---
title: mini-redis项目-1-简介
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?54'
date: 2022-12-05 16:43:55
categories: Rust
tags: [Rust, Database, Redis]
description: 最近看完了tokio，其中tokio官方提供的mini-redis项目非常的好，跟着教程完整的做了一遍，并且对很多地方根据自己的理解重新实现了（比如错误处理、文件组织等）；这里会分多篇文章进行总结，这里是第一篇；
---

最近看完了tokio，其中tokio官方提供的mini-redis项目非常的好，跟着教程完整的做了一遍，并且对很多地方根据自己的理解重新实现了（比如错误处理、文件组织等）；

这里会分多篇文章进行总结，这里是第一篇；

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

# **mini-redis项目-1-简介**

## **前言**

tokio 官方文档如下：

-   https://tokio.rs/tokio/tutorial

mini-redis 项目地址：

-   https://github.com/JasonkayZK/mini-redis

项目的目录结构如下：

```bash
$ tree ./src/
.
├── bin
│   ├── cli.rs
│   └── server.rs
├── client
│   ├── cli.rs
│   ├── cmd.rs
│   ├── mod.rs
│   └── subscriber.rs
├── cmd
│   ├── get.rs
│   ├── mod.rs
│   ├── ping.rs
│   ├── publish.rs
│   ├── set.rs
│   ├── subscribe.rs
│   ├── unknown.rs
│   └── unsubscribe.rs
├── config.rs
├── connection
│   ├── connect.rs
│   ├── frame.rs
│   ├── mod.rs
│   └── parse.rs
├── consts.rs
├── error.rs
├── lib.rs
├── logger.rs
├── server
│   ├── handler.rs
│   ├── listener.rs
│   ├── mod.rs
│   └── shutdown.rs
└── storage
    ├── db.rs
    ├── mod.rs
    ├── store.rs
    └── traits.rs
```

其中：

-   `bin` 目录：server 和 cli 的命令行入口可执行文件；
-   `client` 目录：客户端具体实现逻辑；
-   `server` 目录：服务端具体实现逻辑；
-   `cmd` 目录：mini-redis 相关命令实现；
-   `connection` 目录：客户端、服务端异步连接实现；
-   `storage` 目录：kv、subscribe 存储实现（本例中直接使用 HashMap 实现，实际生产环境多用 LSM-Tree）；
-   `config.rs`：mini-redis 配置相关；
-   `consts.rs`：mini-redis 常量配置相关；
-   `error.rs`：mini-redis 错误定义；
-   `logger.rs`：mini-redis 日志配置；
-   `lib.rs`：mini-redis 库入口；

总体分为下面几个部分：

-   **存储实现；**
-   **连接实现；**
-   **具体命令实现**
-   **客户端、服务端实现；**

<br/>

## **基本使用**

首先启动server：

```bash
$ cargo run --bin mini-redis-server

[ INFO]: mini_redis::server - mini-redis server started listen on: 0.0.0.0:6379
[ INFO]: mini_redis::server::listener - server started, accepting inbound connections
```

随后可以使用 client：

```bash
$ cargo run --bin mini-redis-cli

mini-redis-cli 0.1.0
Issue Redis commands

USAGE:
    mini-redis-cli [OPTIONS] <SUBCOMMAND>

OPTIONS:
    -h, --help                   Print help information
        --hostname <hostname>    [default: 127.0.0.1]
        --port <PORT>            [default: 6379]
    -V, --version                Print version information

SUBCOMMANDS:
    get          Get the value of key
    help         Print this message or the help of the given subcommand(s)
    ping         
    publish      Publisher to send a message to a specific channel
    set          Set key to hold the string value
    subscribe    Subscribe a client to a specific channel or channels
```

<br/>

ping命令测试：

```bash
$ cargo run --bin mini-redis-cli ping   
"PONG"

$ cargo run --bin mini-redis-cli ping abc
"abc"
```

<br/>

get/set 测试：

```bash
$ cargo run --bin mini-redis-cli get foo     
(nil)

$ cargo run --bin mini-redis-cli set foo 123
OK

$ cargo run --bin mini-redis-cli get foo    
"123"
```

过期键测试，设置 5s 过期：

```bash
$ cargo run --bin mini-redis-cli set foo 123 5000
```

获取：

```bash
$ cargo run --bin mini-redis-cli get foo
"123"

$ cargo run --bin mini-redis-cli get foo
(nil)
```

5s后，获取不到 key 值了！

<br/>

pub/sub 测试；

启动三个 subscribe，订阅同一个 channel，ch1：

```bash
$ cargo run --bin mini-redis-cli subscribe ch1

$ cargo run --bin mini-redis-cli subscribe ch1

$ cargo run --bin mini-redis-cli subscribe ch1
```

向 ch1 发布消息：

```bash
$ cargo run --bin mini-redis-cli publish ch1 a-message
Publish OK
```

其他订阅者均收到消息：

```
got message from the channel: ch1; message = b"a-message"
```

<br/>

错误命令测试：

```bash
$ cargo run --bin mini-redis-cli ping get foo

error: Found argument 'foo' which wasn't expected, or isn't valid in this context
```

<br/>

## **项目配置**

### **日志配置**

日志使用 `log` 框架，进行了一些配置：

logger.rs

```rust
use std::env;

use log::{Level, LevelFilter, Metadata, Record};

use crate::config::LOG_LEVEL;

struct Logger;

pub fn init() {
    static LOGGER: Logger = Logger;
    log::set_logger(&LOGGER).unwrap();

    let log_level: String = env::var(LOG_LEVEL).unwrap_or_else(|_| String::from("INFO"));
    log::set_max_level(match log_level.as_str() {
        "ERROR" => LevelFilter::Error,
        "WARN" => LevelFilter::Warn,
        "INFO" => LevelFilter::Info,
        "DEBUG" => LevelFilter::Debug,
        "TRACE" => LevelFilter::Trace,
        _ => LevelFilter::Info,
    });
}

impl log::Log for Logger {
    fn enabled(&self, _metadata: &Metadata) -> bool {
        true
    }

    fn log(&self, record: &Record) {
        if !self.enabled(record.metadata()) {
            return;
        }

        let color = match record.level() {
            Level::Error => 31, // Red
            Level::Warn => 93,  // BrightYellow
            Level::Info => 34,  // Blue
            Level::Debug => 32, // Green
            Level::Trace => 90, // BrightBlack
        };

        println!(
            "\u{1B}[{}m[{:>5}]: {} - {}\u{1B}[0m",
            color,
            record.level(),
            record.target(),
            record.args(),
        );
    }

    fn flush(&self) {}
}
```

在初始化 logger 时会获取 `LOG_LEVEL` 环境变量，如果没有获得，则默认日志级别为 `INFO`；

<br/>

### **常量配置**

常量主要在 `config.rs` 和 `consts.rs` 中定义：

```rust
// src/config.rs

/// Logger level
pub static LOG_LEVEL: &str = "LOG_LEVEL";


// src/consts.rs

/// Default port that a redis server listens on.
///
/// Used if no port is specified.
pub const DEFAULT_PORT: u16 = 6379;

/// Maximum number of concurrent connections the redis server will accept.
///
/// When this limit is reached, the server will stop accepting connections until
/// an active connection terminates.
pub const MAX_CONNECTIONS: usize = 1024;
```

定义了日志级别环境变量的常量、默认端口号、以及默认连接数；

<br/>

### **错误配置**

对于库而言，应当尽量使用能够保留错误层级的库，例如：thiserror；

而anyhow更适用于业务、应用层场景；

因此这里并没有使用更方便的 anyhow，而是使用了 thiserror；

如下：

src/error.rs

```rust
use std::io;

use thiserror::Error;

#[derive(Error, Debug)]
pub enum MiniRedisServerError {
    #[error(transparent)]
    IoError(#[from] io::Error),

    #[error(transparent)]
    Connect(#[from] MiniRedisConnectionError),

    #[error(transparent)]
    Parse(#[from] MiniRedisParseError),
}

#[derive(Error, Debug)]
pub enum MiniRedisClientError {
    #[error(transparent)]
    Connect(#[from] MiniRedisConnectionError),

    #[error(transparent)]
    Parse(#[from] MiniRedisParseError),
}

/// Error encountered while parsing a frame.
///
/// Only `EndOfStream` errors are handled at runtime. All other errors result in
/// the connection being terminated.
#[derive(Error, Debug)]
pub enum MiniRedisParseError {
    #[error("invalid message encoding, parse failed")]
    Parse(String),

    /// Attempting to extract a value failed due to the frame being fully
    /// consumed.
    #[error("protocol error; unexpected end of stream")]
    EndOfStream,

    #[error("not enough data is available to parse a message")]
    Incomplete,

    #[error("unimplemented command")]
    Unimplemented,

    #[error("not an array frame")]
    ParseArrayFrame,

    #[error(transparent)]
    ParseInt(#[from] std::num::TryFromIntError),
    #[error(transparent)]
    ParseUtf8(#[from] std::string::FromUtf8Error),
}

#[derive(Error, Debug)]
pub enum MiniRedisConnectionError {
    #[error("connection reset by peer")]
    Disconnect,

    #[error(transparent)]
    ParseFrame(#[from] MiniRedisParseError),

    #[error(transparent)]
    IoError(#[from] io::Error),

    #[error("command execute error")]
    CommandExecute(String),

    #[error("received next message failed, invalid frame type")]
    InvalidFrameType,

    #[error("invalid argument")]
    InvalidArgument(String),
}
```

主要是通过 `#[error(transparent)]` 定义了错误层级：

-   MiniRedisServerError、MiniRedisClientError：继承 MiniRedisConnectionError 和 MiniRedisParseError；
-   MiniRedisConnectionError：继承 MiniRedisParseError，主要是连接错误；
-   MiniRedisParseError：最底层错误，包装命令解析、IO中断不完整 等错误；

<br/>

## **小结**

本小节作为简介，主要是大体上讲解了 mini-redis 的实现，以及目录结构和主要功能；

下面几个小节会具体对实现进行分析；

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

参考文章：

-   https://tokio.rs/tokio/tutorial
-   https://redis.io/docs/reference/protocol-spec/
-   https://rust-book.junmajinlong.com/ch100/00.html


<br/>
