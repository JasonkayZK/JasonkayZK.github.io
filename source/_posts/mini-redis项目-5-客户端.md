---
title: mini-redis项目-5-客户端
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?5'
date: 2022-12-07 16:20:06
categories: Rust
tags: [Rust, Database, Redis]
description: 在上一篇《mini-redis项目-4-服务端》中，我们实现了mini-redis的服务端，这一篇来实现客户端；
---

在上一篇[《mini-redis项目-4-服务端》](https://jasonkayzk.github.io/2022/12/06/mini-redis项目-4-服务端/)中，我们实现了mini-redis的服务端，这一篇来实现客户端；

源代码：

-   https://github.com/JasonkayZK/mini-redis

系列文章：

-   [《mini-redis项目-1-简介》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-1-简介/)
-   [《mini-redis项目-2-存储层》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-2-存储层/)
-   [《mini-redis项目-3-连接层》](https://jasonkayzk.github.io/2022/12/06/mini-redis项目-3-连接层/)
-   [《mini-redis项目-4-服务端》](https://jasonkayzk.github.io/2022/12/06/mini-redis项目-4-服务端/)
-   [《mini-redis项目-5-客户端》](https://jasonkayzk.github.io/2022/12/07/mini-redis项目-5-客户端/)
-   [《mini-redis项目-6-测试与示例》](https://jasonkayzk.github.io/2022/12/07/mini-redis项目-6-测试与示例/)

<br/>

<!--more-->

# **mini-redis项目-5-客户端**

## **客户端入口**

和服务端相同，客户端的入口也是 bin 目录下的可执行文件，具体实现如下：

首先来看客户端命令行的定义：

src/bin/cli.rs

```rust
use mini_redis::client::cmd::Command;

#[derive(Parser, Debug)]
#[clap(
    name = "mini-redis-cli",
    version,
    author,
    about = "Issue Redis commands"
)]
struct Cli {
    #[clap(subcommand)]
    command: Command,

    #[clap(name = "hostname", long, default_value = "127.0.0.1")]
    host: String,

    #[clap(long, default_value_t = DEFAULT_PORT)]
    port: u16,
}
```

我们定义了客户端的命令行参数 Cli，包括：

-   command：子命令，同时使用了 `#[clap(subcommand)]` 标注；**注意：这里的 Command 是客户端命令行 Command 不是我们上一节讲述的 mini-redis 中的命令！**
-   host：服务端地址，默认为 `127.0.0.1`；
-   port：服务端端口地址，默认为 `DEFAULT_PORT=6379`；

main 函数的定义如下：

```rust
/// Entry point for CLI tool.
///
/// `flavor = "current_thread"` is used here to avoid spawning background
/// threads. The CLI tool use case benefits more by being lighter instead of
/// multi-threaded.
#[tokio::main(flavor = "current_thread")]
async fn main() -> Result<(), MiniRedisClientError> {
    dotenv().ok();
    logger::init();

    // Parse command line arguments
    let cli = Cli::parse();
    debug!("get cli: {:?}", cli);

    // Get the remote address to connect to
    let addr = format!("{}:{}", cli.host, cli.port);

    // Establish a connection
    let mut client = client::connect(&addr).await?;

    // Process the requested command
    match cli.command {
        Command::Ping { msg } => {
            let value = client.ping(msg).await?;
            if let Ok(string) = std::str::from_utf8(&value) {
                println!("\"{}\"", string);
            } else {
                println!("{:?}", value);
            }
        }
        Command::Get { key } => {
            if let Some(value) = client.get(&key).await? {
                if let Ok(string) = std::str::from_utf8(&value) {
                    println!("\"{}\"", string);
                } else {
                    println!("{:?}", value);
                }
            } else {
                println!("(nil)");
            }
        }
        Command::Set {
            key,
            value,
            expires: None,
        } => {
            client.set(&key, value).await?;
            println!("OK");
        }
        Command::Set {
            key,
            value,
            expires: Some(expires),
        } => {
            client.set_expires(&key, value, expires).await?;
            println!("OK");
        }
        Command::Publish { channel, message } => {
            client.publish(&channel, message).await?;
            println!("Publish OK");
        }
        Command::Subscribe { channels } => {
            if channels.is_empty() {
                return Err(MiniRedisConnectionError::InvalidArgument(
                    "channel(s) must be provided".into(),
                )
                .into());
            }
            let mut subscriber = client.subscribe(channels).await?;

            // await messages on channels
            while let Some(msg) = subscriber.next_message().await? {
                println!(
                    "got message from the channel: {}; message = {:?}",
                    msg.channel, msg.content
                );
            }
        }
    }

    Ok(())
}
```

和服务端类似，也是：

-   首先初始化了 env、logger、cli；
-   随后通过 ` client::connect(&addr).await` 建立了和服务端之间的 TCP 连接；
-   最后通过 match 执行命令行指定的对应的命令；

上面的 Command、Client 都在 client 模块中定义，下面我们具体来看；

<br/>

## **Client模块概述**

client 模块的目录结构如下：

```rust
$ tree ./src/client 
./src/client
├── cli.rs
├── cmd.rs
├── mod.rs
└── subscriber.rs
```

各个文件内容：

-   mod：对外暴露了 connect 函数，获取 TCP 连接并创建 Client；
-   cmd：定义客户端命令行工具的 Command 命令；
-   cli：定义 Client 实现；
-   subscriber：客户端 channel 订阅者；

下面分别来看；

<br/>

### **命令行子命令**

在 `cmd.rs` 中定义了上文中使用 `#[clap(subcommand)]` 宏标注的子命令 command 字段；

下面是具体实现：

src/client/cmd.rs

```rust
#[derive(Subcommand, Debug)]
pub enum Command {
    Ping {
        /// Message to ping
        msg: Option<String>,
    },
    /// Get the value of key.
    Get {
        /// Name of key to get
        key: String,
    },
    /// Set key to hold the string value.
    Set {
        /// Name of key to set
        key: String,

        /// Value to set.
        #[clap(parse(from_str = bytes_from_str))]
        value: Bytes,

        /// Expire the value after specified amount of time
        #[clap(parse(try_from_str = duration_from_ms_str))]
        expires: Option<Duration>,
    },
    ///  Publisher to send a message to a specific channel.
    Publish {
        /// Name of channel
        channel: String,

        #[clap(parse(from_str = bytes_from_str))]
        /// Message to publish
        message: Bytes,
    },
    /// Subscribe a client to a specific channel or channels.
    Subscribe {
        /// Specific channel or channels
        channels: Vec<String>,
    },
}

fn duration_from_ms_str(src: &str) -> Result<Duration, ParseIntError> {
    let ms = src.parse::<u64>()?;
    Ok(Duration::from_millis(ms))
}

fn bytes_from_str(src: &str) -> Bytes {
    Bytes::from(src.to_string())
}
```

可以看到各个子命令基本上是和 mini-redis 中的命令一一对应；

同时，有几个命令通过 `from_str` 指定了类型转换，完成的对应格式的解析；

>   **这里可以学到 clap 命令行库的用法；**

<br/>

### **创建客户端**

在 `mod.rs` 中定义了创建客户端的函数 connect：

src/client/mod.rs

```rust
/// Establish a connection with the Redis server located at `addr`.
///
/// `addr` may be any type that can be asynchronously converted to a
/// `SocketAddr`. This includes `SocketAddr` and strings. The `ToSocketAddrs`
/// trait is the Tokio version and not the `std` version.
pub async fn connect<T: ToSocketAddrs>(addr: T) -> Result<Client, MiniRedisConnectionError> {
    // The `addr` argument is passed directly to `TcpStream::connect`. This
    // performs any asynchronous DNS lookup and attempts to establish the TCP
    // connection. An error at either step returns an error, which is then
    // bubbled up to the caller of `mini_redis` connect.
    let socket = TcpStream::connect(addr).await?;

    // Initialize the connection state. This allocates read/write buffers to
    // perform redis protocol frame parsing.
    let connection = Connection::new(socket);

    Ok(Client { connection })
}
```

函数通过获取 socket 创建了我们之前第三篇中定义的 Connection（发送一整个 Frame），并返回；

逻辑非常简单，不再赘述；

<br/>

### **客户端实现Client**

先来看 Client 的定义：

src/client/cli.rs

```rust
pub struct Client {
    pub(crate) connection: Connection,
}
```

非常简单，就是包装了我们之前定义的 Connection；

下面来看 Client 中的方法：

```rust
impl Client {

  pub async fn ping(&mut self, msg: Option<String>) -> Result<Bytes, MiniRedisConnectionError> {
        let frame = Ping::new(msg).into_frame()?;

        self.connection.write_frame(&frame).await?;

        match self.read_response().await? {
            Frame::Simple(value) => Ok(value.into()),
            Frame::Bulk(value) => Ok(value),
            frame => Err(MiniRedisConnectionError::CommandExecute(frame.to_string())),
        }
    }

    pub async fn get(&mut self, key: &str) -> Result<Option<Bytes>, MiniRedisConnectionError> {
        let frame = Get::new(key).into_frame()?;

        self.connection.write_frame(&frame).await?;

        match self.read_response().await? {
            Frame::Simple(value) => Ok(Some(value.into())),
            Frame::Bulk(value) => Ok(Some(value)),
            Frame::Null => Ok(None),
            frame => Err(MiniRedisConnectionError::CommandExecute(frame.to_string())),
        }
    }

    pub async fn set(&mut self, key: &str, value: Bytes) -> Result<(), MiniRedisConnectionError> {
        self.set_cmd(Set::new(key, value, None)).await
    }

    pub async fn set_expires(
        &mut self,
        key: &str,
        value: Bytes,
        expiration: Duration,
    ) -> Result<(), MiniRedisConnectionError> {
        self.set_cmd(Set::new(key, value, Some(expiration))).await
    }

    async fn set_cmd(&mut self, cmd: Set) -> Result<(), MiniRedisConnectionError> {
        let frame = cmd.into_frame()?;

        self.connection.write_frame(&frame).await?;

        match self.read_response().await? {
            Frame::Simple(response) if response == "OK" => Ok(()),
            frame => Err(MiniRedisConnectionError::CommandExecute(frame.to_string())),
        }
    }

    pub async fn publish(
        &mut self,
        channel: &str,
        message: Bytes,
    ) -> Result<u64, MiniRedisConnectionError> {
        let frame = Publish::new(channel, message).into_frame()?;

        self.connection.write_frame(&frame).await?;

        match self.read_response().await? {
            Frame::Integer(response) => Ok(response),
            frame => Err(MiniRedisConnectionError::CommandExecute(frame.to_string())),
        }
    }

    pub async fn subscribe(
        mut self,
        channels: Vec<String>,
    ) -> Result<Subscriber, MiniRedisConnectionError> {
        self.subscribe_cmd(&channels).await?;

        Ok(Subscriber {
            client: self,
            subscribed_channels: channels,
        })
    }

    pub(crate) async fn subscribe_cmd(
        &mut self,
        channels: &[String],
    ) -> Result<(), MiniRedisConnectionError> {
        let frame = Subscribe::new(channels).into_frame()?;

        self.connection.write_frame(&frame).await?;

        for channel in channels {
            let response = self.read_response().await?;

            // Verify it is confirmation of subscription.
            match response {
                Frame::Array(ref frame) => match frame.as_slice() {
                    [subscribe, schannel, ..]
                        if *subscribe == "subscribe" && *schannel == channel =>
                    {
                        debug!("subscribe channel: {} success", channel);
                    }
                    _ => {
                        error!("subscribe frame failed, response: {}", response);
                        return Err(MiniRedisConnectionError::CommandExecute(
                            response.to_string(),
                        ));
                    }
                },
                frame => {
                    error!(
                        "subscribe frame failed, response frame type not match: {}",
                        frame
                    );
                    return Err(MiniRedisConnectionError::InvalidFrameType);
                }
            };
        }

        Ok(())
    }

    pub(crate) async fn read_response(&mut self) -> Result<Frame, MiniRedisConnectionError> {
        let response = self.connection.read_frame().await?;

        match response {
            Some(Frame::Error(msg)) => Err(MiniRedisConnectionError::CommandExecute(msg)),
            Some(frame) => Ok(frame),
            None => {
                // Receiving `None` here indicates the server has closed the
                // connection without sending a frame. This is unexpected and is
                // represented as a "connection reset by peer" error.
                Err(MiniRedisConnectionError::Disconnect)
            }
        }
    }
}
```

逻辑都非常类似，都是：

-   先通过创建对应命令，然后调用 `into_frame` 转为具体的 frame；
-   然后通过 connection 中封装好的 write_frame 方法，将数据发送给 Server；
-   最后再调用内部的 read_response 方法，解析响应并输出；

<br/>

### **Channel订阅Subscriber**

当执行了 subscribe 命令后，会创建对应的 Subscriber 来订阅各个 channel；

具体实现如下：

```rust
/// A client that has entered pub/sub mode.
///
/// Once clients subscribe to a channel, they may only perform pub/sub related
/// commands. The `Client` type is transitioned to a `Subscriber` type in order
/// to prevent non-pub/sub methods from being called.
pub struct Subscriber {
    /// The subscribed client.
    pub(crate) client: Client,

    /// The set of channels to which the `Subscriber` is currently subscribed.
    pub(crate) subscribed_channels: Vec<String>,
}

/// A message received on a subscribed channel.
#[derive(Debug, Clone)]
pub struct Message {
    pub channel: String,
    pub content: Bytes,
}

impl Subscriber {
    /// Subscribe to a list of new channels
    pub async fn subscribe(&mut self, channels: &[String]) -> Result<(), MiniRedisConnectionError> {
        // Issue the subscribe command
        self.client.subscribe_cmd(channels).await?;

        // Update the set of subscribed channels.
        self.subscribed_channels
            .extend(channels.iter().map(Clone::clone));

        Ok(())
    }

    /// Returns the set of channels currently subscribed to.
    pub fn get_subscribed(&self) -> &[String] {
        &self.subscribed_channels
    }

    /// Receive the next message published on a subscribed channel, waiting if
    /// necessary.
    ///
    /// `None` indicates the subscription has been terminated.
    pub async fn next_message(&mut self) -> Result<Option<Message>, MiniRedisConnectionError> {
        match self.client.connection.read_frame().await? {
            Some(frame) => {
                debug!("subscribe received next message: {:?}", frame);

                match frame {
                    Frame::Array(ref frame) => match frame.as_slice() {
                        [message, channel, content] if *message == "message" => Ok(Some(Message {
                            channel: channel.to_string(),
                            content: Bytes::from(content.to_string()),
                        })),
                        _ => {
                            error!("invalid message, frame: {:?}", frame);
                            Err(MiniRedisConnectionError::InvalidFrameType)
                        }
                    },
                    frame => Err(MiniRedisConnectionError::CommandExecute(frame.to_string())),
                }
            }
            None => Ok(None),
        }
    }

    /// Convert the subscriber into a `Stream` yielding new messages published
    /// on subscribed channels.
    ///
    /// `Subscriber` does not implement stream itself as doing so with safe code
    /// is non trivial. The usage of async/await would require a manual Stream
    /// implementation to use `unsafe` code. Instead, a conversion function is
    /// provided and the returned stream is implemented with the help of the
    /// `async-stream` crate.
    pub fn into_stream(mut self) -> impl Stream<Item = Result<Message, MiniRedisConnectionError>> {
        // Uses the `try_stream` macro from the `async-stream` crate. Generators
        // are not stable in Rust. The crate uses a macro to simulate generators
        // on top of async/await. There are limitations, so read the
        // documentation there.
        try_stream! {
            while let Some(message) = self.next_message().await? {
                yield message;
            }
        }
    }

    /// Unsubscribe to a list of new channels
    pub async fn unsubscribe(
        &mut self,
        channels: &[String],
    ) -> Result<(), MiniRedisConnectionError> {
        let frame = Unsubscribe::new(channels).into_frame()?;

        debug!("unsubscribe command: {:?}", frame);

        // Write the frame to the socket
        self.client.connection.write_frame(&frame).await?;

        // if the input channel list is empty, server acknowledges as unsubscribing
        // from all subscribed channels, so we assert that the unsubscribe list received
        // matches the client subscribed one
        let num = if channels.is_empty() {
            self.subscribed_channels.len()
        } else {
            channels.len()
        };

        // Read the response
        for _ in 0..num {
            let response = self.client.read_response().await?;

            match response {
                Frame::Array(ref frame) => match frame.as_slice() {
                    [unsubscribe, channel, ..] if *unsubscribe == "unsubscribe" => {
                        let len = self.subscribed_channels.len();

                        if len == 0 {
                            // There must be at least one channel
                            return Err(MiniRedisConnectionError::InvalidArgument(
                                response.to_string(),
                            ));
                        }

                        // unsubscribed channel should exist in the subscribed list at this point
                        self.subscribed_channels.retain(|c| *channel != &c[..]);

                        // Only a single channel should be removed from the
                        // list of subscribed channels.
                        if self.subscribed_channels.len() != len - 1 {
                            return Err(MiniRedisConnectionError::CommandExecute(
                                response.to_string(),
                            ));
                        }
                    }
                    _ => {
                        return Err(MiniRedisConnectionError::InvalidFrameType);
                    }
                },
                frame => return Err(MiniRedisConnectionError::CommandExecute(frame.to_string())),
            };
        }

        Ok(())
    }
}
```

实现逻辑也很清晰：主要就是将 Client 封装了一层，然后通过 connection 提供的 stream 读取消息；

同时也能接收 sub/unsub 命令，并且处理逻辑和服务端非常相似；

<br/>

## **小结**

本篇讲解了客户端的实现，由于前面几个部分的封装，使得客户端的实现变得非常简单；

下一篇也会是本系列的最后一篇，主要是对我们的实现进行测试；

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/mini-redis

系列文章：

-   [《mini-redis项目-1-简介》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-1-简介/)
-   [《mini-redis项目-2-存储层》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-2-存储层/)
-   [《mini-redis项目-3-连接层》](https://jasonkayzk.github.io/2022/12/06/mini-redis项目-3-连接层/)
-   [《mini-redis项目-4-服务端》](https://jasonkayzk.github.io/2022/12/06/mini-redis项目-4-服务端/)
-   [《mini-redis项目-5-客户端》](https://jasonkayzk.github.io/2022/12/07/mini-redis项目-5-客户端/)
-   [《mini-redis项目-6-测试与示例》](https://jasonkayzk.github.io/2022/12/07/mini-redis项目-6-测试与示例/)

<br/>
