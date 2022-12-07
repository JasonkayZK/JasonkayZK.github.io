---
title: mini-redis项目-4-服务端
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?4'
date: 2022-12-06 16:00:59
categories: Rust
tags: [Rust, Database, Redis]
description: 前面几篇文章讲解了mini-redis的存储层、连接层，这一篇在此基础之上继续讲解服务端的实现；
---

前面几篇文章讲解了mini-redis的存储层、连接层，这一篇在此基础之上继续讲解服务端的实现；

源代码：

-   https://github.com/JasonkayZK/mini-redis

系列文章：

-   [《mini-redis项目-1-简介》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-1-简介/)
-   [《mini-redis项目-2-存储层》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-2-存储层/)
-   [《mini-redis项目-3-连接层》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-3-连接层/)
-   [《mini-redis项目-4-服务端》](https://jasonkayzk.github.io/2022/12/06/mini-redis项目-4-服务端/)
-   [《mini-redis项目-5-客户端》](https://jasonkayzk.github.io/2022/12/07/mini-redis项目-5-客户端/)
-   [《mini-redis项目-6-测试与示例》](https://jasonkayzk.github.io/2022/12/07/mini-redis项目-6-测试与示例/)

<br/>

<!--more-->

# **mini-redis项目-4-服务端**

## **服务端入口**

### **可执行文件入口**

服务端的入口在 `src/bin/server.rs` 可执行文件中；

具体实现如下：

src/bin/server.rs

```rust
#[derive(Parser, Debug)]
#[clap(
    name = "mini-redis-server",
    version,
    author,
    about = "A mini redis server"
)]
struct Cli {
    #[clap(long)]
    port: Option<u16>,
}

#[tokio::main]
pub async fn main() -> Result<(), MiniRedisServerError> {
    let cli = init();
    let port = cli.port.unwrap_or(DEFAULT_PORT);

    // Bind a TCP listener
    let listener = TcpListener::bind(&format!("0.0.0.0:{}", port)).await?;

    server::run(listener, signal::ctrl_c()).await;

    Ok(())
}

fn init() -> Cli {
    dotenv().ok();
    logger::init();
    Cli::parse()
}
```

主要使用了 clap 库对定义了命令行参数 `port`；

首先，main 函数调用 init 函数进行初始化，在 init 函数中：

-   使用 dotenv 通过 `.env` 文件初始化环境变量（如果有的话）；
-   随后通过 `logger::init` 初始化 logger；
-   最后调用 `Cli::parse()` 解析命令行参数到 Cli 结构体中；

随后，创建 TCP listener 等待接收客户端连接，并将 listener 传入 server 模块提供的 run 方法中，启动服务端；

因此，这个 `run` 方法就是整个服务端的入口；

<br/>

### **Server结构**

Server 的结构如下所示：

```bash
$ tree ./src/server    
./src/server
├── handler.rs
├── listener.rs
├── mod.rs
└── shutdown.rs
```

各个部分内容如下：

-   mod：对外暴露了 run 函数，启动服务端，初始化相应的资源；
-   listener：监听具体的 TCP 连接，并创建 Handler 处理消息；
-   handler：由 listener 内部创建，对接收到的每一个 TCP 连接创建一个 Handler 来处理对应的客户端；
-   shutdown：服务器停止后用来等待异步任务结束后优雅关闭；

<br/>

### **服务端启动异步函数：run**

下面具体来看上面提到的在 `mod.rs` 中定义的 run 函数；

具体实现如下：

src/server/mod.rs

```rust
/// Run the mini-redis server.
///
/// Accepts connections from the supplied listener. For each inbound connection,
/// a task is spawned to handle that connection. The server runs until the
/// `shutdown` future completes, at which point the server shuts down
/// gracefully.
///
/// `tokio::signal::ctrl_c()` can be used as the `shutdown` argument. This will
/// listen for a SIGINT signal.
pub async fn run(listener: TcpListener, shutdown: impl Future) {
    info!(
        "mini-redis server started listen on: {}",
        listener.local_addr().unwrap()
    );

    // When the provided `shutdown` future completes, we must send a shutdown
    // message to all active connections. We use a broadcast channel for this
    // purpose. The call below ignores the receiver of the broadcast pair, and when
    // a receiver is needed, the subscribe() method on the sender is used to create one.
    let (notify_shutdown, _) = broadcast::channel(1);
    let (shutdown_complete_tx, shutdown_complete_rx) = mpsc::channel(1);

    // Initialize the listener state
    let mut server = Listener {
        listener,
        db_holder: DbDropGuard::new(),
        limit_connections: Arc::new(Semaphore::new(MAX_CONNECTIONS)),
        notify_shutdown,
        shutdown_complete_tx,
        shutdown_complete_rx,
    };

    // Concurrently run the server and listen for the `shutdown` signal. The
    // server task runs until an error is encountered, so under normal
    // circumstances, this `select!` statement runs until the `shutdown` signal
    // is received.
    tokio::select! {
        res = server.run() => {
            // If an error is received here, accepting connections from the TCP
            // listener failed multiple times and the server is giving up.
            //
            // Errors encountered when handling individual connections do not
            // bubble up to this point.
            if let Err(err) = res {
                error!("failed to accept: {:?}", err);
            }
        }
        _ = shutdown => {
            // The shutdown signal has been received
            debug!("server is about to shutdown");
        }
    }

    // Extract the `shutdown_complete` receiver and transmitter
    // explicitly drop `shutdown_transmitter`. This is important, as the
    // `.await` below would otherwise never complete.
    let Listener {
        mut shutdown_complete_rx,
        shutdown_complete_tx,
        notify_shutdown,
        ..
    } = server;

    // When `notify_shutdown` is dropped, all tasks which have `subscribe`d will
    // receive the shutdown signal and can exit
    drop(notify_shutdown);
    // Drop final `Sender` so the `Receiver` below can complete
    drop(shutdown_complete_tx);

    debug!("server is shutting down");

    // Wait for all active connections to finish processing. As the `Sender`
    // handle held by the listener has been dropped above, the only remaining
    // `Sender` instances are held by connection handler tasks. When those drop,
    // the `mpsc` channel will close and `recv()` will return `None`.
    let _ = shutdown_complete_rx.recv().await;
}
```

在 run 函数的入参中需要传入：

-   listener：具体的 TCP Listener；
-   shutdown：一个 Future 来表示一个未来会执行的异步任务，来停止数据库的执行；

shutdown 在本例中为 `signal::ctrl_c()`，生产环境可以是其他 Future，如：健康检查等，帮助优雅关闭并重启服务：

-   **当 shutdown Future 完成后，我们应当发送服务器即将关闭的消息给所有的 TCP 连接，并等待所有的异步任务处理完成后退出：因此，run 函数创建了 `broadcast` 类型的 channel `notify_shutdown`，他会被复制到所有 TCP 连接中，当关闭时通知所有 TCP 连接；**
-   **当所有的异步任务结束、资源被释放后我们才可以退出，所以 run 函数还创建了 `shutdown_complete_tx, shutdown_complete_rx`，来通知、等待 shutdown 任务完成；**

随后初始化了我们的服务端 Listener，以及对应的数据库、连接等资源；

然后使用 `select!` 宏等待：

-   **TCP 连接：处理客户端请求；**
-   **shutdown Future：关闭数据库；**

一旦我们跳出了 `select!` 宏，说明 shutdown Future 宏被执行；

因此我们显式的 drop 掉 notify_shutdown、shutdown_complete_tx，这样其他 TCP 连接以及数据库就会收到 shutdown 的信号，进而转入 shutdown 阶段；

最后，我们<font color="#f00">**只需要调用 `shutdown_complete_rx.recv()` 等待所有的 Sender 都 drop 掉后，这里自然而然就会返回 None，从而整个服务端优雅的退出！**</font>

<br/>

## **服务监听Listener**

由于在前几篇文章中我们已经将底层做了很好的封装，因此 Listener 的逻辑并不复杂；

Listener 就是我们的 Server，他负责：

-   接收并处理 TCP 连接请求；
-   封装 DbDropGuard 存储；
-   优雅停机；

具体 Listener 的定义如下：

src/server/listener.rs

```rust
/// Server listener state. Created in the `run` call. It includes a `run` method
/// which performs the TCP listening and initialization of per-connection state.
#[derive(Debug)]
pub(crate) struct Listener {
    /// Shared database handle.
    ///
    /// Contains the key / value store as well as the broadcast channels for
    /// pub/sub.
    ///
    /// This holds a wrapper around an `Arc`. The internal `Db` can be
    /// retrieved and passed into the per connection state (`Handler`).
    pub(crate) db_holder: DbDropGuard,

    /// TCP listener supplied by the `run` caller.
    pub(crate) listener: TcpListener,

    /// Limit the max number of connections.
    ///
    /// A `Semaphore` is used to limit the max number of connections. Before
    /// attempting to accept a new connection, a permit is acquired from the
    /// semaphore. If none are available, the listener waits for one.
    ///
    /// When handlers complete processing a connection, the permit is returned
    /// to the semaphore.
    pub(crate) limit_connections: Arc<Semaphore>,

    /// Broadcasts a shutdown signal to all active connections.
    ///
    /// The initial `shutdown` trigger is provided by the `run` caller. The
    /// server is responsible for gracefully shutting down active connections.
    /// When a connection task is spawned, it is passed a broadcast receiver
    /// handle. When a graceful shutdown is initiated, a `()` value is sent via
    /// the broadcast::Sender. Each active connection receives it, reaches a
    /// safe terminal state, and completes the task.
    pub(crate) notify_shutdown: broadcast::Sender<()>,

    /// Used as part of the graceful shutdown process to wait for client
    /// connections to complete processing.
    ///
    /// Tokio channels are closed once all `Sender` handles go out of scope.
    /// When a channel is closed, the receiver receives `None`. This is
    /// leveraged to detect all connection handlers completing. When a
    /// connection handler is initialized, it is assigned a clone of
    /// `shutdown_complete_tx`. When the listener shuts down, it drops the
    /// sender held by this `shutdown_complete_tx` field. Once all handler tasks
    /// complete, all clones of the `Sender` are also dropped. This results in
    /// `shutdown_complete_rx.recv()` completing with `None`. At this point, it
    /// is safe to exit the server process.
    pub(crate) shutdown_complete_rx: mpsc::Receiver<()>,
    pub(crate) shutdown_complete_tx: mpsc::Sender<()>,
}
```

各个字段含义如下：

-   `db_holder: DbDropGuard`：内部存储数据库；
-   `listener: TcpListener`：监听 TCP 连接；
-   `limit_connections: Arc<Semaphore>`：使用信号量 Semaphore 实现的连接令牌，当超过了最大连接数，则需要等待其他连接释放后才能创建新的连接；
-   `notify_shutdown: broadcast::Sender<()>`：通知所有 TCP 服务器 shutdown 信号；
-   `shutdown_complete_rx: mpsc::Receiver<()>, shutdown_complete_tx: mpsc::Sender`：shutdown 任务结束后信号通知；

Listener 中实现了 run 方法，用来在上面的 `select!` 宏中接收并处理 TCP 连接；

具体实现如下：

src/server/listener.rs

```rust
impl Listener {
    /// Run the server
    ///
    /// Listen for inbound connections. For each inbound connection, spawn a
    /// task to process that connection.
    ///
    /// # Errors
    ///
    /// Returns `Err` if accepting returns an error. This can happen for a
    /// number reasons that resolve over time. For example, if the underlying
    /// operating system has reached an internal limit for max number of
    /// sockets, accept will fail.
    ///
    /// The process is not able to detect when a transient error resolves
    /// itself. One strategy for handling this is to implement a back off
    /// strategy, which is what we do here.
    pub(crate) async fn run(&mut self) -> Result<(), MiniRedisConnectionError> {

        loop {
            // Wait for a permit to become available
            //
            // `acquire_owned` returns a permit that is bound to the semaphore.
            // When the permit value is dropped, it is automatically returned
            // to the semaphore.
            //
            // `acquire_owned()` returns `Err` when the semaphore has been
            // closed. We don't ever close the semaphore, so `unwrap()` is safe.
            let permit = self
                .limit_connections
                .clone()
                .acquire_owned()
                .await
                .unwrap();

            // Accept a new socket. This will attempt to perform error handling.
            // The `accept` method internally attempts to recover errors, so an
            // error here is non-recoverable.
            let socket = self.accept().await?;

            // Create the necessary per-connection handler state.
            let mut handler = Handler {
                // Get a handle to the shared database.
                db: self.db_holder.db(),

                // Initialize the connection state. This allocates read/write
                // buffers to perform redis protocol frame parsing.
                connection: Connection::new(socket),

                // Receive shutdown notifications.
                shutdown: Shutdown::new(self.notify_shutdown.subscribe()),

                // Notifies the receiver half once all clones are dropped.
                _shutdown_complete: self.shutdown_complete_tx.clone(),
            };

            // Spawn a new task to process the connections. Tokio tasks are like
            // asynchronous green threads and are executed concurrently.
            tokio::spawn(async move {
                // Process the connection. If an error is encountered, log it.
                if let Err(err) = handler.run().await {
                    error!("connection error：{:?}", err);
                }
                // Move the permit into the task and drop it after completion.
                // This returns the permit back to the semaphore.
                drop(permit);
            });
        }
    }

    /// Accept an inbound connection.
    ///
    /// Errors are handled by backing off and retrying. An exponential backoff
    /// strategy is used. After the first failure, the task waits for 1 second.
    /// After the second failure, the task waits for 2 seconds. Each subsequent
    /// failure doubles the wait time. If accepting fails on the 6th try after
    /// waiting for 64 seconds, then this function returns with an error.
    async fn accept(&mut self) -> Result<TcpStream, MiniRedisConnectionError> {
        let mut backoff = 1;

        // Try to accept a few times
        loop {
            // Perform the accept operation. If a socket is successfully
            // accepted, return it. Otherwise, save the error.
            match self.listener.accept().await {
                Ok((socket, _)) => return Ok(socket),
                Err(err) => {
                    if backoff > 64 {
                        // Accept has failed too many times. Return the error.
                        error!("failed to accept socket after retry: {}", err);
                        return Err(err.into());
                    } else {
                        error!("failed to accept socket: {}", err);
                    }
                }
            }

            // Pause execution until the back off period elapses.
            time::sleep(Duration::from_secs(backoff)).await;

            // Double the back off
            backoff <<= 2;
        }
    }
}
```

在 run 方法中：

首先会通过 limit_connections 获取一个令牌；

随后，调用 accept 内部定义的异步方法等待 TCP 连接，accept 会尝试几次建立连接，如果都失败才会返回错误；

然后，在 run 方法中创建了 Handler，传入 Socket 连接，并将 `db`、 `notify_shutdown` 和 `shutdown_complete_tx` 复制进去，用以处理客户请求以及 shutdown 信号；

最后，通过 `tokio::spawn` 创建新的异步任务；

>   <font color="#f00">**需要注意的是：我们需要在异步任务结束后，调用 drop 来返还我们通过 limit_connections 获取到的令牌；**</font>

<br/>

## **请求处理Handler**

Handler 是整个服务端处理客户端请求的核心，每个 TCP 连接都会创建一个对应的 Handler 异步任务；

Handler 结构体定义如下：

```rust
/// Per-connection handler. Reads requests from `connection` and applies the
/// commands to `db`.
#[derive(Debug)]
pub(crate) struct Handler {
    /// Shared database handle.
    ///
    /// When a command is received from `connection`, it is applied with `db`.
    /// The implementation of the command is in the `cmd` module. Each command
    /// will need to interact with `db` in order to complete the work.
    pub(crate) db: Db,

    /// The TCP connection decorated with the redis protocol encoder / decoder
    /// implemented using a buffered `TcpStream`.
    ///
    /// When `Listener` receives an inbound connection, the `TcpStream` is
    /// passed to `Connection::new`, which initializes the associated buffers.
    /// `Connection` allows the handler to operate at the "frame" level and keep
    /// the byte level protocol parsing details encapsulated in `Connection`.
    pub(crate) connection: Connection,

    /// Listen for shutdown notifications.
    ///
    /// A wrapper around the `broadcast::Receiver` paired with the sender in
    /// `Listener`. The connection handler processes requests from the
    /// connection until the peer disconnects **or** a shutdown notification is
    /// received from `shutdown`. In the latter case, any in-flight work being
    /// processed for the peer is continued until it reaches a safe state, at
    /// which point the connection is terminated.
    pub(crate) shutdown: Shutdown,

    /// Not used directly. Instead, when `Handler` is dropped
    pub(crate) _shutdown_complete: mpsc::Sender<()>,
}
```

其中：

-   db：数据库的计数引用；
-   connection：客户端的 TCP 连接；
-   shutdown：服务器 shutdown 后的信号通知；
-   _shutdown_complete：Handler 处理完成后 Drop 此引用，通知 Listener 中的 channel；

在 Handler 中也实现了 run 方法下面重点来看：

```rust
impl Handler {
    /// Process a single connection.
    ///
    /// Request frames are read from the socket and processed. Responses are
    /// written back to the socket.
    ///
    /// Currently, pipelining is not implemented. Pipelining is the ability to
    /// process more than one request concurrently per connection without
    /// interleaving frames. 
    ///
    /// See for more details:
    /// https://redis.io/topics/pipelining
    ///
    /// When the shutdown signal is received, the connection is processed until
    /// it reaches a safe state, at which point it is terminated.
    pub(crate) async fn run(&mut self) -> Result<(), MiniRedisConnectionError> {
        // As long as the shutdown signal has not been received, try to read a
        // new request frame.
        while !self.shutdown.is_shutdown() {
            // While reading a request frame, also listen for the shutdown
            // signal.
            let maybe_frame = tokio::select! {
                res = self.connection.read_frame() => res?,
                _ = self.shutdown.recv() => {
                    // If a shutdown signal is received, return from `run`.
                    // This will result in the task terminating.
                    return Ok(());
                }
            };

            // If `None` is returned from `read_frame()` then the peer closed
            // the socket. There is no further work to do and the task can be
            // terminated.
            let frame = match maybe_frame {
                Some(frame) => frame,
                None => {
                    debug!("peer closed the socket, return");
                    return Ok(());
                }
            };

            // Convert the redis frame into a command struct. This returns an
            // error if the frame is not a valid redis command or it is an
            // unsupported command.
            let cmd = Command::from_frame(frame)?;

            // Logs the `cmd` object.
            debug!("received command: {:?}", cmd);

            // Perform the work needed to apply the command. This may mutate the
            // database state as a result.
            //
            // The connection is passed into the apply function which allows the
            // command to write response frames directly to the connection. In
            // the case of pub/sub, multiple frames may be send back to the
            // peer.
            cmd.apply(&self.db, &mut self.connection, &mut self.shutdown)
                .await?;
        }

        Ok(())
    }
}
```

只要在 run 方法中没有收到 shutdown 信号或没有报错，就调用 `self.connection.read_frame()` 持续接收并解析来自客户端的数据；

直到接收到了完整的 Frame 数据，判断 Frame 是否为空，如果为空说明客户端断开了连接，此时可以直接返回；

否则调用 `Command::from_frame(frame)` 将 Frame 转为对应的命令；

最后调用 `cmd.apply(&self.db, &mut self.connection, &mut self.shutdown).await?;` 执行对应的命令；

上面的 `Command::from_frame(frame)` 和  `cmd.apply()` 都定义在 cmd 执行命令模块，下面来看；

<br/>

## **执行命令模块**

cmd 模块中定义了 Command 枚举，为 mini-redis 中每一个命令都定义了相应的枚举类型；

定义如下：

src/cmd/mod.rs

```rust
/// Enumeration of supported Redis commands.
///
/// Methods called on `Command` are delegated to the command implementation.
#[derive(Debug)]
pub enum Command {
    Get(Get),
    Set(Set),
    Publish(Publish),
    Subscribe(Subscribe),
    Unsubscribe(Unsubscribe),
    Ping(Ping),
    Unknown(Unknown),
}
```

其中每个枚举类型都包含一个对应的类型实现：

```bash
$ tree ./src/cmd       
./src/cmd
├── get.rs
├── mod.rs
├── ping.rs
├── publish.rs
├── set.rs
├── subscribe.rs
├── unknown.rs
└── unsubscribe.rs
```

同时为 Command 实现了两个方法：

-   from_frame：将命令 Frame 转为具体的命令枚举；
-   apply：执行具体命令；

具体实现如下：

```rust
impl Command {
    /// Parse a command from a received frame.
    ///
    /// The `Frame` must represent a Redis command supported by `mini-redis` and
    /// be the array variant.
    pub fn from_frame(frame: Frame) -> Result<Command, MiniRedisParseError> {
        let mut parse = Parse::new(frame)?;

        // All redis commands begin with the command name as a string. The name
        // is read and converted to lower cases in order to do case sensitive
        // matching.
        let command_name = parse.next_string()?.to_lowercase();

        // Match the command name, delegating the rest of the parsing to the
        // specific command.
        let command = match &command_name[..] {
            "get" => Command::Get(Get::parse_frames(&mut parse)?),
            "set" => Command::Set(Set::parse_frames(&mut parse)?),
            "publish" => Command::Publish(Publish::parse_frames(&mut parse)?),
            "subscribe" => Command::Subscribe(Subscribe::parse_frames(&mut parse)?),
            "unsubscribe" => Command::Unsubscribe(Unsubscribe::parse_frames(&mut parse)?),
            "ping" => Command::Ping(Ping::parse_frames(&mut parse)?),
            _ => {
                // The command is not recognized and an Unknown command is
                // returned.
                //
                // `return` is called here to skip the `finish()` call below. As
                // the command is not recognized, there is most likely
                // unconsumed fields remaining in the `Parse` instance.
                return Ok(Command::Unknown(Unknown::new(command_name)));
            }
        };

        // Check if there is any remaining unconsumed fields in the `Parse`
        // value. If fields remain, this indicates an unexpected frame format
        // and an error is returned.
        parse.finish()?;

        // The command has been successfully parsed
        Ok(command)
    }

    /// Apply the command to the specified `Db` instance.
    ///
    /// The response is written to `dst`. This is called by the server in order
    /// to execute a received command.
    /// Apply the command to the specified `Db` instance.
    ///
    /// The response is written to `dst`. This is called by the server in order
    /// to execute a received command.
    pub(crate) async fn apply(
        self,
        db: &Db,
        dst: &mut Connection,
        shutdown: &mut Shutdown,
    ) -> Result<(), MiniRedisConnectionError> {
        use Command::*;

        match self {
            Ping(cmd) => cmd.apply(dst).await,
            Get(cmd) => cmd.apply(db, dst).await,
            Set(cmd) => cmd.apply(db, dst).await,
            Publish(cmd) => cmd.apply(db, dst).await,
            Subscribe(cmd) => cmd.apply(db, dst, shutdown).await,
            // `Unsubscribe` cannot be applied. It may only be received from the
            // context of a `Subscribe` command.
            Unsubscribe(_) => Err(MiniRedisConnectionError::CommandExecute(
                "`Unsubscribe` is unsupported in this context".into(),
            )),
            Unknown(cmd) => cmd.apply(dst).await,
        }
    }

    /// Returns the command name
    pub(crate) fn get_name(&self) -> &str {
        match self {
            Command::Get(_) => "get",
            Command::Set(_) => "set",
            Command::Publish(_) => "pub",
            Command::Subscribe(_) => "subscribe",
            Command::Unsubscribe(_) => "unsubscribe",
            Command::Ping(_) => "ping",
            Command::Unknown(cmd) => cmd.get_name(),
        }
    }
}
```

from_frame 方法的实现非常简单：

-   **首先，通过上一篇文章中实现的 Parse 对 Frame 进行解析，转为类似于 Cursor 的操作；**
-   **随后，调用 `parse.next_string()?.to_lowercase()` 获取第一个 string，也就是命令名称并转为小写；**
-   **然后，根据具体的命令，调用对应命令的 `parse_frames` 方法，将 Parse 转为具体的命令枚举；**
-   **最后，调用 `parse.finish()` 校验命令格式，如果校验成功，则返回上面解析完成的命令枚举；**

apply 方法更加简单，就是通过匹配不同类型的枚举，调用具体命令实现的 `apply` 方法；

每一个具体命令的实现如下所示；

<br/>

### **Ping命令**

Ping 命令实现如下：

src/cmd/ping.rs

```rust
#[derive(Debug, Default)]
pub struct Ping {
    /// optional message to be returned
    msg: Option<String>,
}

impl Ping {
    pub fn new(msg: Option<String>) -> Ping {
        Ping { msg }
    }

    /// Parse a `Ping` instance from a received frame.
    ///
    /// The `Parse` argument provides a cursor-like API to read fields from the
    /// `Frame`. At this point, the entire frame has already been received from
    /// the socket.
    ///
    /// The `PING` string has already been consumed.
    pub(crate) fn parse_frames(parse: &mut Parse) -> Result<Ping, MiniRedisParseError> {
        match parse.next_string() {
            Ok(msg) => Ok(Ping::new(Some(msg))),
            Err(MiniRedisParseError::EndOfStream) => Ok(Ping::default()),
            Err(e) => Err(e),
        }
    }

    /// Apply the `Ping` command and return the message.
    ///
    /// The response is written to `dst`. This is called by the server in order
    /// to execute a received command.
    pub(crate) async fn apply(self, dst: &mut Connection) -> Result<(), MiniRedisConnectionError> {
        let response = match self.msg {
            None => Frame::Simple("PONG".to_string()),
            Some(msg) => Frame::Bulk(Bytes::from(msg)),
        };

        // Write the response back to the client
        dst.write_frame(&response).await?;

        Ok(())
    }

    /// Converts the command into an equivalent `Frame`.
    ///
    /// This is called by the client when encoding a `Ping` command to send
    /// to the server.
    pub(crate) fn into_frame(self) -> Result<Frame, MiniRedisParseError> {
        let mut frame = Frame::array();
        frame.push_bulk(Bytes::from("ping".as_bytes()))?;
        if let Some(msg) = self.msg {
            frame.push_bulk(Bytes::from(msg))?;
        }
        Ok(frame)
    }
}
```

parse_frames 和 apply 的实现都非常简单，这里不再赘述；

<font color="#f00">**需要注意的是：Parse 内部是一个 IntoIter 实现，并且前面在匹配命令时，已经将具体的命令字符串消费了，因此这里的 Parse 的迭代器是不包含最开始的命令字符串的！其他命令也是类似！**</font>

**同时，为命令实现了 into_frame 方法，这是提供给客户端使用的，用于将客户端通过命令行输入的命令转化为对应的 Frame 发送给服务端执行；**

into_frame 方法实现非常简单这里均不再赘述；

<br/>

### **Get命令**

Get命令的实现也很简单；

src/cmd/get.rs

```rust
#[derive(Debug)]
pub struct Get {
    key: String,
}

impl Get {
    pub fn new(key: impl ToString) -> Get {
        Get {
            key: key.to_string(),
        }
    }

    pub fn key(&self) -> &str {
        &self.key
    }

    pub(crate) fn parse_frames(parse: &mut Parse) -> Result<Get, MiniRedisParseError> {
        let key = parse.next_string()?;

        Ok(Get { key })
    }

    pub(crate) async fn apply(
        self,
        db: &Db,
        dst: &mut Connection,
    ) -> Result<(), MiniRedisConnectionError> {
        let response = if let Some(value) = db.get(&self.key) {
            Frame::Bulk(value)
        } else {
            // If there is no value, `Null` is written.
            Frame::Null
        };

        debug!("get command applied resp: {:?}", response);

        dst.write_frame(&response).await?;

        Ok(())
    }

    pub(crate) fn into_frame(self) -> Result<Frame, MiniRedisParseError> {
        let mut frame = Frame::array();
        frame.push_bulk(Bytes::from("get".as_bytes()))?;
        frame.push_bulk(Bytes::from(self.key.into_bytes()))?;
        Ok(frame)
    }
}
```

<br/>

### **Set命令**

由于 Set 命令存在设置过期时间的用法，因此稍微有些复杂；

具体实现如下：

src/cmd/set.rs

```rust
/// Set `key` to hold the string `value`.
///
/// If `key` already holds a value, it is overwritten, regardless of its type.
/// Any previous time to live associated with the key is discarded on successful
/// SET operation.
#[derive(Debug)]
pub struct Set {
    /// the lookup key
    key: String,

    /// the value to be stored
    value: Bytes,

    /// When to expire the key
    expire: Option<Duration>,
}

impl Set {
    pub fn new(key: impl ToString, value: Bytes, expire: Option<Duration>) -> Set {
        Set {
            key: key.to_string(),
            value,
            expire,
        }
    }

    /// Parse a `Set` instance from a received frame.
    ///
    /// The `Parse` argument provides a cursor-like API to read fields from the
    /// `Frame`. At this point, the entire frame has already been received from
    /// the socket.
    pub(crate) fn parse_frames(parse: &mut Parse) -> Result<Set, MiniRedisParseError> {
        // Read the key to set. This is a required field
        let key = parse.next_string()?;

        // Read the value to set. This is a required field.
        let value = parse.next_bytes()?;

        // The expiration is optional. If nothing else follows, then it is `None`.
        let mut expire = None;

        // Attempt to parse another string.
        match parse.next_string() {
            Ok(s) if s.to_uppercase() == "EX" => {
                // An expiration is specified in seconds. The next value is an
                // integer.
                let secs = parse.next_int()?;
                expire = Some(Duration::from_secs(secs));
            }
            Ok(s) if s.to_uppercase() == "PX" => {
                // An expiration is specified in milliseconds. The next value is
                // an integer.
                let ms = parse.next_int()?;
                expire = Some(Duration::from_millis(ms));
            }
            // Currently, mini-redis does not support any of the other SET
            // options. An error here results in the connection being
            // terminated. Other connections will continue to operate normally.
            Ok(s) => {
                warn!("unsupported SET option: {}", s);
                return Err(MiniRedisParseError::Parse(
                    "currently `SET` only supports the expiration option".into(),
                ));
            }
            // The `EndOfStream` error indicates there is no further data to
            // parse. In this case, it is a normal run time situation and
            // indicates there are no specified `SET` options.
            Err(MiniRedisParseError::EndOfStream) => {
                debug!("no extra SET option");
            }
            // All other errors are bubbled up, resulting in the connection
            // being terminated.
            Err(err) => return Err(err),
        }

        Ok(Set { key, value, expire })
    }

    /// Apply the `Set` command to the specified `Db` instance.
    ///
    /// The response is written to `dst`. This is called by the server in order
    /// to execute a received command.
    pub(crate) async fn apply(
        self,
        db: &Db,
        dst: &mut Connection,
    ) -> Result<(), MiniRedisConnectionError> {
        // Set the value in the shared database state.
        db.set(self.key, self.value, self.expire);

        // Create a success response and write it to `dst`.
        let response = Frame::Simple("OK".to_string());
        debug!("applied set command response: {:?}", response);

        dst.write_frame(&response).await?;

        Ok(())
    }

    /// Converts the command into an equivalent `Frame`.
    ///
    /// This is called by the client when encoding a `Set` command to send to
    /// the server.
    pub(crate) fn into_frame(self) -> Result<Frame, MiniRedisParseError> {
        let mut frame = Frame::array();
        frame.push_bulk(Bytes::from("set".as_bytes()))?;
        frame.push_bulk(Bytes::from(self.key.into_bytes()))?;
        frame.push_bulk(self.value)?;
        if let Some(ms) = self.expire {
            // Expirations in Redis procotol can be specified in two ways
            // 1. SET key value EX seconds
            // 2. SET key value PX milliseconds
            // We implement the second option because it allows greater precision and
            // src/bin/cli.rs parses the expiration argument as milliseconds
            // in duration_from_ms_str()
            frame.push_bulk(Bytes::from("px".as_bytes()))?;
            frame.push_int(ms.as_millis() as u64)?;
        }
        Ok(frame)
    }

    pub fn key(&self) -> &str {
        &self.key
    }

    pub fn value(&self) -> &Bytes {
        &self.value
    }

    pub fn expire(&self) -> Option<Duration> {
        self.expire
    }
}
```

parse_frames 方法首先通过 parse 获取到了要 set 的 key 和 value，随后获取下一个 String：

-   如果为 `EX`：则通过下一个 int 类型获取秒单位的过期时间；
-   如果为 `PX`：则通过下一个 int 类型获取毫秒单位的过期时间；
-   否则说明命令格式有误，返回对应的错误；

Set 命令的 apply 方法和 Get 命令类似，直接通过操作数据库接口即可保存，随后向客户端返回结果即可；

<br/>

### **Subscribe命令**

Subscribe 命令较为复杂，下面我们来看；

Subscribe 命令定义如下：

```rust
/// Subscribes the client to one or more channels.
///
/// Once the client enters the subscribed state, it is not supposed to issue any
/// other commands, except for additional SUBSCRIBE, PSUBSCRIBE, UNSUBSCRIBE,
/// PUNSUBSCRIBE, PING and QUIT commands.
#[derive(Debug)]
pub struct Subscribe {
    channels: Vec<String>,
}

/// Stream of messages. The stream receives messages from the
/// `broadcast::Receiver`. We use `stream!` to create a `Stream` that consumes
/// messages. Because `stream!` values cannot be named, we box the stream using
/// a trait object.
type Messages = Pin<Box<dyn Stream<Item = Bytes> + Send>>;
```

Subscribe 命令一次可以订阅多个 channel；

同时定义了 Messages 为 Channel 中传输的数据流；

下面来具体看 parse_frames 和 apply 方法的实现；

parse_frames 方法实现也比较简单：

src/cmd/subscribe.rs

```rust
pub(crate) fn parse_frames(parse: &mut Parse) -> Result<Subscribe, MiniRedisParseError> {
  // Extract the first string. If there is none, the the frame is
  // malformed and the error is bubbled up.
  let mut channels = vec![parse.next_string()?];

  loop {
    match parse.next_string() {
      // A string has been consumed from the `parse`, push it into the
      // list of channels to subscribe to.
      Ok(s) => channels.push(s),
      // The `EndOfStream` error indicates there is no further data to
      // parse.
      Err(MiniRedisParseError::EndOfStream) => break,
      // All other errors are bubbled up, resulting in the connection
      // being terminated.
      Err(err) => return Err(err),
    }
  }

  Ok(Subscribe { channels })
}

```

parse_frames 主要就是将所有要订阅的 channel 名称放入 Vector 中并返回；

接下来是 apply 方法：

```rust
pub(crate) async fn apply(mut self,
  db: &Db,
  dst: &mut Connection,
  shutdown: &mut Shutdown,
) -> Result<(), MiniRedisConnectionError> {
  // Each individual channel subscription is handled using a
  // `sync::broadcast` channel. Messages are then fanned out to all
  // clients currently subscribed to the channels.
  //
  // An individual client may subscribe to multiple channels and may
  // dynamically add and remove channels from its subscription set. To
  // handle this, a `StreamMap` is used to track active subscriptions. The
  // `StreamMap` merges messages from individual broadcast channels as
  // they are received.
  let mut subscriptions = StreamMap::new();

  loop {
    // `self.channels` is used to track additional channels to subscribe
    // to. When new `SUBSCRIBE` commands are received during the
    // execution of `apply`, the new channels are pushed onto this vec.
    for channel_name in self.channels.drain(..) {
      Self::subscribe_to_channel(channel_name, &mut subscriptions, db, dst).await?;
    }

    // Wait for one of the following to happen:
    //
    // - Receive a message from one of the subscribed channels.
    // - Receive a subscribe or unsubscribe command from the client.
    // - A server shutdown signal.
    select! {
      // Receive messages from subscribed channels
      Some((channel_name, msg)) = subscriptions.next() => {
        dst.write_frame(&make_message_frame(channel_name, msg)?).await?;
      }
      res = dst.read_frame() => {
        let frame = match res? {
          Some(frame) => frame,
          // This happens if the remote client has disconnected.
          None => {
            warn!("remote subscribe client disconnected");
            return Ok(())
          }
        };

        handle_command(
          frame,
          &mut self.channels,
          &mut subscriptions,
          dst,
        ).await?;
      }
      _ = shutdown.recv() => {
        warn!("server shutdown, stop subscribe");
        return Ok(());
      }
    }
  }
}
```

由于每个客户端可以同时动态的订阅多个 channel，因此先创建了一个 StreamMap 用于存储 Stream 映射；

接下来，创建一个循环，在循环中：

-   首先，使用 `self.channels.drain` 将命令的 channels 中订阅的所有 channel 消费掉（<font color="#f00">**这里不使用 IntoIter 的原因是：这个 Vector 后面还会用到（动态订阅新的channel），我们只是消耗其中的值**</font>）；
-   随后，调用 `Self::subscribe_to_channel` 内部方法，将 channel 订阅至 StreamMap 中；
-   接着创建一个 `select!` 等待下面几个事件：
    -   从 StreamMap 中获取消息：则调用连接的 write_frame 将 channel 中的消息返回给 client；
    -   接收到客户端新的 Subscribe 或 Unsubscribe 命令：获取命令并调用 handle_command 函数处理；
    -   接收到 shutdown 命令，则停止订阅；

最后，来看向 StreamMap 中添加 Stream 方法 subscribe_to_channel 和处理客户端新增 Subscribe 或 Unsubscribe 的 handle_command 函数；

subscribe_to_channel 方法实现如下：

```rust
async fn subscribe_to_channel(
  channel_name: String,
  subscriptions: &mut StreamMap<String, Messages>,
  db: &Db,
  dst: &mut Connection,
) -> Result<(), MiniRedisConnectionError> {
  let mut rx = db.subscribe(channel_name.clone());

  // Subscribe to the channel.
  let rx = Box::pin(async_stream::stream! {
    loop {
      match rx.recv().await {
        Ok(msg) => yield msg,
        // If we lagged in consuming messages, just resume.
        Err(tokio::sync::broadcast::error::RecvError::Lagged(e)) => {
          warn!("subscribe received lagged: {}", e);
        }
        Err(e) => {
          warn!("subscribe received error: {}", e);
          break
        },
      }
    }
  });

  // Track subscription in this client's subscription set.
  subscriptions.insert(channel_name.clone(), rx);

  debug!("subscribed to channel success: {}", channel_name);

  // Respond with the successful subscription
  let response = make_subscribe_frame(channel_name, subscriptions.len())?;
  dst.write_frame(&response).await?;

  Ok(())
}
```

逻辑也非常简单：

-   首先调用 `db.subscribe` 在数据库中记录 Subscribe 记录；
-   随后通过 `stream!` 宏定义流处理逻辑，并加入 StreamMap 中；
-   最后向客户端返回响应；

最后来看 handle_command 函数：

```rust
async fn handle_command(
  frame: Frame,
  subscribe_to: &mut Vec<String>,
  subscriptions: &mut StreamMap<String, Messages>,
  dst: &mut Connection,
) -> Result<(), MiniRedisConnectionError> {
  // A command has been received from the client.
  //
  // Only `SUBSCRIBE` and `UNSUBSCRIBE` commands are permitted in this context.
  match Command::from_frame(frame)? {
    Command::Subscribe(subscribe) => {
      // The `apply` method will subscribe to the channels we add to this
      // vector.
      subscribe_to.extend(subscribe.channels.into_iter());
    }
    Command::Unsubscribe(mut unsubscribe) => {
      // If no channels are specified, this requests unsubscribing from
      // **all** channels. To implement this, the `unsubscribe.channels`
      // vec is populated with the list of channels currently subscribed
      // to.
      if unsubscribe.channels.is_empty() {
        unsubscribe.channels = subscriptions
        .keys()
        .map(|channel_name| channel_name.to_string())
        .collect();
      }

      for channel_name in unsubscribe.channels {
        debug!("begin unsubscribed: {}", channel_name);
        subscriptions.remove(&channel_name);

        let response = make_unsubscribe_frame(channel_name, subscriptions.len())?;
        dst.write_frame(&response).await?;
        debug!("unsubscribed success: {}", response);
      }
    }
    command => {
      let cmd = Unknown::new(command.get_name());
      cmd.apply(dst).await?;
    }
  }
  Ok(())
}

```

逻辑如下：

-   **如果是 Subscribe：则通过 `subscribe_to.extend(subscribe.channels.into_iter())` 将新增的 channel 名称加入到当前的命令数组中（下一次循环通过 drain 消费）；**
-   **如果是 Unsubscribe：如果没有指定取消订阅的 channel 名称，则加入所有 channel；随后，遍历所有带取消订阅的数组，逐个取消订阅即可；**

<br/>

### **Unsubscribe命令**

Unsubscribe 命令实现非常简单，这里不再赘述：

src/cmd/unsubscribe.rs

```rust
use bytes::Bytes;

use crate::connection::frame::Frame;
use crate::connection::parse::Parse;
use crate::error::MiniRedisParseError;

/// Unsubscribes the client from one or more channels.
///
/// When no channels are specified, the client is unsubscribed from all the
/// previously subscribed channels.
#[derive(Clone, Debug)]
pub struct Unsubscribe {
    pub(crate) channels: Vec<String>,
}

impl Unsubscribe {
    pub(crate) fn new(channels: &[String]) -> Unsubscribe {
        Unsubscribe {
            channels: channels.to_vec(),
        }
    }

    pub(crate) fn parse_frames(parse: &mut Parse) -> Result<Unsubscribe, MiniRedisParseError> {
        // There may be no channels listed, so start with an empty vec.
        let mut channels = vec![];

        // Each entry in the frame must be a string or the frame is malformed.
        // Once all values in the frame have been consumed, the command is fully
        // parsed.
        loop {
            match parse.next_string() {
                // A string has been consumed from the `parse`, push it into the
                // list of channels to unsubscribe from.
                Ok(s) => channels.push(s),
                // The `EndOfStream` error indicates there is no further data to
                // parse.
                Err(MiniRedisParseError::EndOfStream) => break,
                // All other errors are bubbled up, resulting in the connection
                // being terminated.
                Err(err) => return Err(err),
            }
        }

        Ok(Unsubscribe { channels })
    }

    pub(crate) fn into_frame(self) -> Result<Frame, MiniRedisParseError> {
        let mut frame = Frame::array();
        frame.push_bulk(Bytes::from("unsubscribe".as_bytes()))?;

        for channel in self.channels {
            frame.push_bulk(Bytes::from(channel.into_bytes()))?;
        }

        Ok(frame)
    }
}

pub(crate) fn make_unsubscribe_frame(
    channel_name: String,
    num_subs: usize,
) -> Result<Frame, MiniRedisParseError> {
    let mut response = Frame::array();
    response.push_bulk(Bytes::from_static(b"unsubscribe"))?;
    response.push_bulk(Bytes::from(channel_name))?;
    response.push_int(num_subs as u64)?;
    Ok(response)
}
```

如果没有提供具体取消订阅的 channel 名称，则会取消订阅所有 channel；

<br/>

### **Publish命令**

publish 命令实现非常简单，这里不再赘述：

src/cmd/publish.rs

```rust
#[derive(Debug)]
pub struct Publish {
    channel: String,

    message: Bytes,
}

impl Publish {
    pub(crate) fn new(channel: impl ToString, message: Bytes) -> Self {
        Publish {
            channel: channel.to_string(),
            message,
        }
    }

    pub(crate) fn parse_frames(parse: &mut Parse) -> Result<Publish, MiniRedisParseError> {
        let channel = parse.next_string()?;
        let message = parse.next_bytes()?;
        Ok(Publish { channel, message })
    }

    pub(crate) async fn apply(
        self,
        db: &Db,
        dst: &mut Connection,
    ) -> Result<(), MiniRedisConnectionError> {
        // The shared state contains the `tokio::sync::broadcast::Sender` for
        // all active channels. Calling `db.publish` dispatches the message into
        // the appropriate channel.
        //
        // The number of subscribers currently listening on the channel is
        // returned. This does not mean that `num_subscriber` channels will
        // receive the message. Subscribers may drop before receiving the
        // message. Given this, `num_subscribers` should only be used as a
        // "hint".
        let num_subscribers = db.publish(&self.channel, self.message);

        // The number of subscribers is returned as the response to the publish
        // request.
        let response = Frame::Integer(num_subscribers as u64);
        debug!("apply command applied response: {}", response);

        dst.write_frame(&response).await?;

        Ok(())
    }

    pub(crate) fn into_frame(self) -> Result<Frame, MiniRedisParseError> {
        let mut frame = Frame::array();
        frame.push_bulk(Bytes::from("publish".as_bytes()))?;
        frame.push_bulk(Bytes::from(self.channel.into_bytes()))?;
        frame.push_bulk(self.message)?;

        Ok(frame)
    }
}
```

<br/>

### **Unknown命令**

如果客户端传入了一个未知的命令，则被解析为一个 Unknown 命令，这个命令非常简单，就是返回错误；

具体实现如下：

src/cmd/unknown.rs

```rust
/// Represents an "unknown" command. This is not a real `Redis` command.
#[derive(Debug)]
pub struct Unknown {
    command_name: String,
}

impl Unknown {
    /// Create a new `Unknown` command which responds to unknown commands
    /// issued by clients
    pub(crate) fn new(key: impl ToString) -> Unknown {
        Unknown {
            command_name: key.to_string(),
        }
    }

    pub(crate) fn get_name(&self) -> &str {
        &self.command_name
    }

    /// Responds to the client, indicating the command is not recognized.
    ///
    /// This usually means the command is not yet implemented by `mini-redis`.
    pub(crate) async fn apply(self, dst: &mut Connection) -> Result<(), MiniRedisConnectionError> {
        let response = Frame::Error(format!("err unknown command '{}'", self.command_name));

        debug!("apply unknown command resp: {:?}", response);

        dst.write_frame(&response).await?;
        Ok(())
    }
}
```

实现非常简单，这里不再解释；

<br/>

## **服务停止Shutdown**

前面在提到优雅关闭服务时，说到了 Shutdown，最后我们来看一下 Shutdown 的实现；

其实 Shutdown 的实现特别简单，就是通过 `broadcast` 向所有持有相同 Receiver 的 TCP Handler 发送通知即可；

具体实现如下：

src/server/shutdown.rs

```rust
use tokio::sync::broadcast;

/// Listens for the server shutdown signal.
///
/// Shutdown is signalled using a `broadcast::Receiver`. Only a single value is
/// ever sent. Once a value has been sent via the broadcast channel, the server
/// should shutdown.
///
/// The `Shutdown` struct listens for the signal and tracks that the signal has
/// been received. Callers may query for whether the shutdown signal has been
/// received or not.
#[derive(Debug)]
pub(crate) struct Shutdown {
    /// `true` if the shutdown signal has been received
    shutdown: bool,

    /// The receive half of the channel used to listen for shutdown.
    notify: broadcast::Receiver<()>,
}

impl Shutdown {
    /// Create a new `Shutdown` backed by the given `broadcast::Receiver`.
    pub(crate) fn new(notify: broadcast::Receiver<()>) -> Shutdown {
        Shutdown {
            shutdown: false,
            notify,
        }
    }

    /// Returns `true` if the shutdown signal has been received.
    pub(crate) fn is_shutdown(&self) -> bool {
        self.shutdown
    }

    /// Receive the shutdown notice, waiting if necessary.
    pub(crate) async fn recv(&mut self) {
        // If the shutdown signal has already been received, then return immediately.
        if self.shutdown {
            return;
        }

        // Cannot receive a "lag error" as only one value is ever sent.
        let _ = self.notify.recv().await;

        // Remember that the signal has been received.
        self.shutdown = true;
    }
}
```

调用 Shutdown 的 recv 异步方法会调用 `self.notify.recv().await` 被阻塞；

直到接收到了来自 Shutdown Future 触发的消息之后，将 shutdown 置为 true，表示进入 shutdown 阶段；

<br/>

## **小结**

本文从服务端可执行文件入口入手，讲述了 mini-redis 整个服务端的实现，包括了：

-   服务端的启动、初始化；
-   服务监听 Listener；
-   请求处理 Handler；
-   执行命令模块 Command；
-   优雅停机 Shutdown；

下一篇会继续实现客户端，进而完成一个真正可用的 mini-redis！

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/mini-redis

系列文章：

-   [《mini-redis项目-1-简介》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-1-简介/)
-   [《mini-redis项目-2-存储层》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-2-存储层/)
-   [《mini-redis项目-3-连接层》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-3-连接层/)
-   [《mini-redis项目-4-服务端》](https://jasonkayzk.github.io/2022/12/06/mini-redis项目-4-服务端/)
-   [《mini-redis项目-5-客户端》](https://jasonkayzk.github.io/2022/12/07/mini-redis项目-5-客户端/)
-   [《mini-redis项目-6-测试与示例》](https://jasonkayzk.github.io/2022/12/07/mini-redis项目-6-测试与示例/)

<br/>
