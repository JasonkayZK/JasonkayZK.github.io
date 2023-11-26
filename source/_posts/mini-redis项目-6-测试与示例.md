---
title: mini-redis项目-6-测试与示例
toc: true
cover: 'https://img.paulzzh.com/touhou/random?6'
date: 2022-12-07 16:24:38
categories: Rust
tags: [Rust, Database, Redis]
description: 本篇是本系列的最后一节，主要是对我们之前实现的功能进行测试；Rust提供了非常方便的工具编写测试和示例；
---

本篇是本系列的最后一节，主要是对我们之前实现的功能进行测试；

Rust提供了非常方便的工具编写测试和示例；

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

# **mini-redis项目-6-测试与示例**

## **编写测试代码**

默认情况下，Cargo 项目中的集成测试用例可以写在和 src 目录同级的 tests 目录下；

下面是服务端测试代码：

tests/server.rs

```rust
/// A basic "hello world" style test. A server instance is started in a
/// background task. A client TCP connection is then established and raw redis
/// commands are sent to the server. The response is evaluated at the byte
/// level.
#[tokio::test]
async fn key_value_get_set() {
    let addr = start_server().await;

    // Establish a connection to the server
    let mut stream = TcpStream::connect(addr).await.unwrap();

    // Get a key, data is missing
    stream
        .write_all(b"*2\r\n$3\r\nGET\r\n$5\r\nhello\r\n")
        .await
        .unwrap();

    // Read nil response
    let mut response = [0; 5];
    stream.read_exact(&mut response).await.unwrap();
    assert_eq!(b"$-1\r\n", &response);

    // Set a key
    stream
        .write_all(b"*3\r\n$3\r\nSET\r\n$5\r\nhello\r\n$5\r\nworld\r\n")
        .await
        .unwrap();

    // Read OK
    let mut response = [0; 5];
    stream.read_exact(&mut response).await.unwrap();
    assert_eq!(b"+OK\r\n", &response);

    // Get the key, data is present
    stream
        .write_all(b"*2\r\n$3\r\nGET\r\n$5\r\nhello\r\n")
        .await
        .unwrap();

    // Shutdown the write half
    stream.shutdown().await.unwrap();

    // Read "world" response
    let mut response = [0; 11];
    stream.read_exact(&mut response).await.unwrap();
    assert_eq!(b"$5\r\nworld\r\n", &response);

    // Receive `None`
    assert_eq!(0, stream.read(&mut response).await.unwrap());
}

/// Similar to the basic key-value test, however, this time timeouts will be
/// tested. This test demonstrates how to test time related behavior.
///
/// When writing tests, it is useful to remove sources of non-determinism. Time
/// is a source of non-determinism. Here, we "pause" time using the
/// `time::pause()` function. This function is available with the `test-util`
/// feature flag. This allows us to deterministically control how time appears
/// to advance to the application.
#[tokio::test]
async fn key_value_timeout() {
    let addr = start_server().await;

    // Establish a connection to the server
    let mut stream = TcpStream::connect(addr).await.unwrap();

    // Set a key
    stream
        .write_all(
            b"*5\r\n$3\r\nSET\r\n$5\r\nhello\r\n$5\r\nworld\r\n\
                     +EX\r\n:1\r\n",
        )
        .await
        .unwrap();

    let mut response = [0; 5];

    // Read OK
    stream.read_exact(&mut response).await.unwrap();

    assert_eq!(b"+OK\r\n", &response);

    // Get the key, data is present
    stream
        .write_all(b"*2\r\n$3\r\nGET\r\n$5\r\nhello\r\n")
        .await
        .unwrap();

    // Read "world" response
    let mut response = [0; 11];

    stream.read_exact(&mut response).await.unwrap();

    assert_eq!(b"$5\r\nworld\r\n", &response);

    // Wait for the key to expire
    time::sleep(Duration::from_secs(1)).await;

    // Get a key, data is missing
    stream
        .write_all(b"*2\r\n$3\r\nGET\r\n$5\r\nhello\r\n")
        .await
        .unwrap();

    // Read nil response
    let mut response = [0; 5];

    stream.read_exact(&mut response).await.unwrap();

    assert_eq!(b"$-1\r\n", &response);
}

#[tokio::test]
async fn pub_sub() {
    let addr = start_server().await;

    let mut publisher = TcpStream::connect(addr).await.unwrap();

    // Publish a message, there are no subscribers yet so the server will
    // return `0`.
    publisher
        .write_all(b"*3\r\n$7\r\nPUBLISH\r\n$5\r\nhello\r\n$5\r\nworld\r\n")
        .await
        .unwrap();

    let mut response = [0; 4];
    publisher.read_exact(&mut response).await.unwrap();
    assert_eq!(b":0\r\n", &response);

    // Create a subscriber. This subscriber will only subscribe to the `hello`
    // channel.
    let mut sub1 = TcpStream::connect(addr).await.unwrap();
    sub1.write_all(b"*2\r\n$9\r\nSUBSCRIBE\r\n$5\r\nhello\r\n")
        .await
        .unwrap();

    // Read the subscribe response
    let mut response = [0; 34];
    sub1.read_exact(&mut response).await.unwrap();
    assert_eq!(
        &b"*3\r\n$9\r\nsubscribe\r\n$5\r\nhello\r\n:1\r\n"[..],
        &response[..]
    );

    // Publish a message, there now is a subscriber
    publisher
        .write_all(b"*3\r\n$7\r\nPUBLISH\r\n$5\r\nhello\r\n$5\r\nworld\r\n")
        .await
        .unwrap();

    let mut response = [0; 4];
    publisher.read_exact(&mut response).await.unwrap();
    assert_eq!(b":1\r\n", &response);

    // The first subscriber received the message
    let mut response = [0; 39];
    sub1.read_exact(&mut response).await.unwrap();
    assert_eq!(
        &b"*3\r\n$7\r\nmessage\r\n$5\r\nhello\r\n$5\r\nworld\r\n"[..],
        &response[..]
    );

    // Create a second subscriber
    //
    // This subscriber will be subscribed to both `hello` and `foo`
    let mut sub2 = TcpStream::connect(addr).await.unwrap();
    sub2.write_all(b"*3\r\n$9\r\nSUBSCRIBE\r\n$5\r\nhello\r\n$3\r\nfoo\r\n")
        .await
        .unwrap();

    // Read the subscribe response
    let mut response = [0; 34];
    sub2.read_exact(&mut response).await.unwrap();
    assert_eq!(
        &b"*3\r\n$9\r\nsubscribe\r\n$5\r\nhello\r\n:1\r\n"[..],
        &response[..]
    );
    let mut response = [0; 32];
    sub2.read_exact(&mut response).await.unwrap();
    assert_eq!(
        &b"*3\r\n$9\r\nsubscribe\r\n$3\r\nfoo\r\n:2\r\n"[..],
        &response[..]
    );

    // Publish another message on `hello`, there are two subscribers
    publisher
        .write_all(b"*3\r\n$7\r\nPUBLISH\r\n$5\r\nhello\r\n$5\r\njazzy\r\n")
        .await
        .unwrap();

    let mut response = [0; 4];
    publisher.read_exact(&mut response).await.unwrap();
    assert_eq!(b":2\r\n", &response);

    // Publish a message on `foo`, there is only one subscriber
    publisher
        .write_all(b"*3\r\n$7\r\nPUBLISH\r\n$3\r\nfoo\r\n$3\r\nbar\r\n")
        .await
        .unwrap();

    let mut response = [0; 4];
    publisher.read_exact(&mut response).await.unwrap();
    assert_eq!(b":1\r\n", &response);

    // The first subscriber received the message
    let mut response = [0; 39];
    sub1.read_exact(&mut response).await.unwrap();
    assert_eq!(
        &b"*3\r\n$7\r\nmessage\r\n$5\r\nhello\r\n$5\r\njazzy\r\n"[..],
        &response[..]
    );

    // The second subscriber received the message
    let mut response = [0; 39];
    sub2.read_exact(&mut response).await.unwrap();
    assert_eq!(
        &b"*3\r\n$7\r\nmessage\r\n$5\r\nhello\r\n$5\r\njazzy\r\n"[..],
        &response[..]
    );

    // The first subscriber **did not** receive the second message
    let mut response = [0; 1];
    time::timeout(Duration::from_millis(100), sub1.read(&mut response))
        .await
        .unwrap_err();

    // The second subscriber **did** receive the message
    let mut response = [0; 35];
    sub2.read_exact(&mut response).await.unwrap();
    assert_eq!(
        &b"*3\r\n$7\r\nmessage\r\n$3\r\nfoo\r\n$3\r\nbar\r\n"[..],
        &response[..]
    );
}

#[tokio::test]
async fn manage_subscription() {
    let addr = start_server().await;

    let mut publisher = TcpStream::connect(addr).await.unwrap();

    // Create a subscriber
    let mut sub = TcpStream::connect(addr).await.unwrap();
    sub.write_all(b"*2\r\n$9\r\nSUBSCRIBE\r\n$5\r\nhello\r\n")
        .await
        .unwrap();

    // Read the subscribe response
    let mut response = [0; 34];
    sub.read_exact(&mut response).await.unwrap();
    assert_eq!(
        &b"*3\r\n$9\r\nsubscribe\r\n$5\r\nhello\r\n:1\r\n"[..],
        &response[..]
    );

    // Update subscription to add `foo`
    sub.write_all(b"*2\r\n$9\r\nSUBSCRIBE\r\n$3\r\nfoo\r\n")
        .await
        .unwrap();

    let mut response = [0; 32];
    sub.read_exact(&mut response).await.unwrap();
    assert_eq!(
        &b"*3\r\n$9\r\nsubscribe\r\n$3\r\nfoo\r\n:2\r\n"[..],
        &response[..]
    );

    // Update subscription to remove `hello`
    sub.write_all(b"*2\r\n$11\r\nUNSUBSCRIBE\r\n$5\r\nhello\r\n")
        .await
        .unwrap();

    let mut response = [0; 37];
    sub.read_exact(&mut response).await.unwrap();
    assert_eq!(
        &b"*3\r\n$11\r\nunsubscribe\r\n$5\r\nhello\r\n:1\r\n"[..],
        &response[..]
    );

    // Publish a message to `hello` and then a message to `foo`
    publisher
        .write_all(b"*3\r\n$7\r\nPUBLISH\r\n$5\r\nhello\r\n$5\r\nworld\r\n")
        .await
        .unwrap();
    let mut response = [0; 4];
    publisher.read_exact(&mut response).await.unwrap();
    assert_eq!(b":0\r\n", &response);

    publisher
        .write_all(b"*3\r\n$7\r\nPUBLISH\r\n$3\r\nfoo\r\n$3\r\nbar\r\n")
        .await
        .unwrap();
    let mut response = [0; 4];
    publisher.read_exact(&mut response).await.unwrap();
    assert_eq!(b":1\r\n", &response);

    // Receive the message
    // The second subscriber **did** receive the message
    let mut response = [0; 35];
    sub.read_exact(&mut response).await.unwrap();
    assert_eq!(
        &b"*3\r\n$7\r\nmessage\r\n$3\r\nfoo\r\n$3\r\nbar\r\n"[..],
        &response[..]
    );

    // No more messages
    let mut response = [0; 1];
    time::timeout(Duration::from_millis(100), sub.read(&mut response))
        .await
        .unwrap_err();

    // Unsubscribe from all channels
    sub.write_all(b"*1\r\n$11\r\nunsubscribe\r\n")
        .await
        .unwrap();

    let mut response = [0; 35];
    sub.read_exact(&mut response).await.unwrap();
    assert_eq!(
        &b"*3\r\n$11\r\nunsubscribe\r\n$3\r\nfoo\r\n:0\r\n"[..],
        &response[..]
    );
}

// In this case we test that server Responds with an Error message if a client
// sends an unknown command
#[tokio::test]
async fn send_error_unknown_command() {
    let addr = start_server().await;

    // Establish a connection to the server
    let mut stream = TcpStream::connect(addr).await.unwrap();

    // Get a key, data is missing
    stream
        .write_all(b"*2\r\n$3\r\nFOO\r\n$5\r\nhello\r\n")
        .await
        .unwrap();

    let mut response = [0; 28];

    stream.read_exact(&mut response).await.unwrap();

    assert_eq!(b"-err unknown command \'foo\'\r\n", &response);
}

// In this case we test that server Responds with an Error message if a client
// sends an GET or SET command after a SUBSCRIBE
#[tokio::test]
async fn send_error_get_set_after_subscribe() {
    let addr = start_server().await;

    let mut stream = TcpStream::connect(addr).await.unwrap();

    // send SUBSCRIBE command
    stream
        .write_all(b"*2\r\n$9\r\nsubscribe\r\n$5\r\nhello\r\n")
        .await
        .unwrap();

    let mut response = [0; 34];

    stream.read_exact(&mut response).await.unwrap();

    assert_eq!(
        &b"*3\r\n$9\r\nsubscribe\r\n$5\r\nhello\r\n:1\r\n"[..],
        &response[..]
    );

    stream
        .write_all(b"*3\r\n$3\r\nSET\r\n$5\r\nhello\r\n$5\r\nworld\r\n")
        .await
        .unwrap();

    let mut response = [0; 28];

    stream.read_exact(&mut response).await.unwrap();
    assert_eq!(b"-err unknown command \'set\'\r\n", &response);

    stream
        .write_all(b"*2\r\n$3\r\nGET\r\n$5\r\nhello\r\n")
        .await
        .unwrap();

    let mut response = [0; 28];

    stream.read_exact(&mut response).await.unwrap();
    assert_eq!(b"-err unknown command \'get\'\r\n", &response);
}

async fn start_server() -> SocketAddr {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();

    tokio::spawn(async move { server::run(listener, tokio::signal::ctrl_c()).await });

    addr
}
```

每一个使用 `#[tokio::test]` 宏标注的函数都是一个单独的测试用例，最开始都使用了内部的 `start_server` 启动了服务端；

客户端测试代码：

tests/client.rs

```rust
/// A PING PONG test without message provided.
/// It should return "PONG".
#[tokio::test]
async fn ping_pong_without_message() {
    let (addr, _) = start_server().await;
    let mut client = client::connect(addr).await.unwrap();

    let pong = client.ping(None).await.unwrap();
    assert_eq!(b"PONG", &pong[..]);
}

/// A PING PONG test with message provided.
/// It should return the message.
#[tokio::test]
async fn ping_pong_with_message() {
    let (addr, _) = start_server().await;
    let mut client = client::connect(addr).await.unwrap();

    let pong = client.ping(Some("你好世界".to_string())).await.unwrap();
    assert_eq!("你好世界".as_bytes(), &pong[..]);
}

/// A basic "hello world" style test. A server instance is started in a
/// background task. A client instance is then established and set and get
/// commands are sent to the server. The response is then evaluated
#[tokio::test]
async fn key_value_get_set() {
    let (addr, _) = start_server().await;

    let mut client = client::connect(addr).await.unwrap();
    client.set("hello", "world".into()).await.unwrap();

    let value = client.get("hello").await.unwrap().unwrap();
    assert_eq!(b"world", &value[..])
}

/// similar to the "hello world" style test, But this time
/// a single channel subscription will be tested instead
#[tokio::test]
async fn receive_message_subscribed_channel() {
    let (addr, _) = start_server().await;

    let client = client::connect(addr).await.unwrap();
    let mut subscriber = client.subscribe(vec!["hello".into()]).await.unwrap();

    tokio::spawn(async move {
        let mut client = client::connect(addr).await.unwrap();
        client.publish("hello", "world".into()).await.unwrap()
    });

    let message = subscriber.next_message().await.unwrap().unwrap();
    assert_eq!("hello", &message.channel);
    assert_eq!(b"world", &message.content[..])
}

/// test that a client gets messages from multiple subscribed channels
#[tokio::test]
async fn receive_message_multiple_subscribed_channels() {
    let (addr, _) = start_server().await;

    let client = client::connect(addr).await.unwrap();
    let mut subscriber = client
        .subscribe(vec!["hello".into(), "world".into()])
        .await
        .unwrap();

    tokio::spawn(async move {
        let mut client = client::connect(addr).await.unwrap();
        client.publish("hello", "world".into()).await.unwrap()
    });

    let message1 = subscriber.next_message().await.unwrap().unwrap();
    assert_eq!("hello", &message1.channel);
    assert_eq!(b"world", &message1.content[..]);

    tokio::spawn(async move {
        let mut client = client::connect(addr).await.unwrap();
        client.publish("world", "howdy?".into()).await.unwrap()
    });

    let message2 = subscriber.next_message().await.unwrap().unwrap();
    assert_eq!("world", &message2.channel);
    assert_eq!(b"howdy?", &message2.content[..])
}

/// test that a client accurately removes its own subscribed chanel list
/// when unsubscribing to all subscribed channels by submitting an empty vec
#[tokio::test]
async fn unsubscribes_from_channels() {
    let (addr, _) = start_server().await;

    let client = client::connect(addr).await.unwrap();
    let mut subscriber = client
        .subscribe(vec!["hello".into(), "world".into()])
        .await
        .unwrap();

    subscriber.unsubscribe(&[]).await.unwrap();
    assert_eq!(subscriber.get_subscribed().len(), 0);
}

async fn start_server() -> (SocketAddr, JoinHandle<()>) {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();

    let handle = tokio::spawn(async move { server::run(listener, tokio::signal::ctrl_c()).await });

    (addr, handle)
}
```

编写完成后可以使用 cargo 命令进行测试：

```rust
$ cargo test --all         

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/bin/cli.rs (target/debug/deps/mini_redis_cli-01da23b4d263898c)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/bin/server.rs (target/debug/deps/mini_redis_server-9faa14d080da4ec7)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/client.rs (target/debug/deps/client-614c81c1e6844848)

running 6 tests
test ping_pong_without_message ... ok
test ping_pong_with_message ... ok
test key_value_get_set ... ok
test unsubscribes_from_channels ... ok
test receive_message_subscribed_channel ... ok
test receive_message_multiple_subscribed_channels ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/server.rs (target/debug/deps/server-e059dba3cac184ec)

running 6 tests
test send_error_unknown_command ... ok
test key_value_get_set ... ok
test send_error_get_set_after_subscribe ... ok
test pub_sub ... ok
test manage_subscription ... ok
test key_value_timeout ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.00s

   Doc-tests mini-redis

running 6 tests
test src/client/cli.rs - client::cli::Client::ping (line 49) - compile ... ok
test src/client/cli.rs - client::cli::Client::get (line 80) - compile ... ok
test src/client/cli.rs - client::cli::Client::publish (line 222) - compile ... ok
test src/client/mod.rs - client::connect (line 19) - compile ... ok
test src/client/cli.rs - client::cli::Client::set (line 123) - compile ... ok
test src/client/cli.rs - client::cli::Client::set_expires (line 159) - compile ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s
```

<br/>

## **配置GitHub Actions**

我们还可以配置 Github Actions，这样每次提交就会自动进行测试；

配置如下：

.github/workflows/ci.yaml

```rust
name: CI # Continuous Integration

on:
  workflow_dispatch:
  push:
    paths-ignore:
      - '**.md'
  pull_request:
    paths-ignore:
      - '**.md'

env:
  RUST_TOOLCHAIN: stable
  TOOLCHAIN_PROFILE: minimal

jobs:
  lints:
    name: Run cargo fmt and cargo clippy
    runs-on: ubuntu-latest
    steps:
      - name: Checkout sources
        uses: actions/checkout@v3
      - name: Install toolchain
        uses: actions-rs/toolchain@v1
        with:
          profile: ${{ env.TOOLCHAIN_PROFILE }}
          toolchain: ${{ env.RUST_TOOLCHAIN }}
          override: true
          components: rustfmt, clippy
      - name: Cache
        uses: Swatinem/rust-cache@v2
      - name: Run cargo fmt
        uses: actions-rs/cargo@v1
        with:
          command: fmt
          args: --all -- --check
      - name: Run cargo clippy
        uses: actions-rs/cargo@v1
        with:
          command: clippy
          args: -- -D warnings
  test:
    name: Run cargo test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout sources
        uses: actions/checkout@v3
      - name: Install toolchain
        uses: actions-rs/toolchain@v1
        with:
          profile: ${{ env.TOOLCHAIN_PROFILE }}
          toolchain: ${{ env.RUST_TOOLCHAIN }}
          override: true
      - name: Cache
        uses: Swatinem/rust-cache@v2
      - name: Run cargo test
        uses: actions-rs/cargo@v1
        env:
          RUST_TEST_THREADS: 8
        with:
          command: test
          args: --all-features
```

测试结果：

-   https://github.com/JasonkayZK/mini-redis/actions

<br/>

## **编写示例**

Cargo 还提供了编写示例的功能，默认在 examples 目录下；

下面是几个简单的例子引导其他人如何使用：

examples/hello.rs

```rust
//! Hello world client.
//!
//! A simple client that connects to a mini-redis server, sets key "hello" with value "world",
//! and gets it from the server after
//!
//! You can test this out by running:
//!
//!     cargo run --bin mini-redis-server
//!
//! And then in another terminal run:
//!
//!     cargo run --example hello_world

use mini_redis::client;
use mini_redis::error::MiniRedisClientError;

#[tokio::main]
pub async fn main() -> Result<(), MiniRedisClientError> {
    // Open a connection to the mini-redis address.
    let mut client = client::connect("127.0.0.1:6379").await?;

    // Set the key "hello" with value "world"
    let result = client.set("hello", "world".into()).await?;
    println!("set value to the server success， result: {:?}", result);

    // Get key "hello"
    let result = client.get("hello").await?;
    println!("got value from the server success， result: {:?}", result);

    Ok(())
}
```

examples/ping.rs

```rust
#[tokio::main]
pub async fn main() -> Result<(), MiniRedisConnectionError> {
    // Open a connection to the mini-redis address.
    let mut client = client::connect("127.0.0.1:6379").await?;

    let result = client.ping(None).await?;
    println!("empty ping response: {:?}", result);

    let result = client.ping(Some("hello".into())).await?;
    println!("bytes ping response: {:?}", result);

    Ok(())
}
```

examples/pub.rs

```rust
#[tokio::main]
async fn main() -> Result<(), MiniRedisClientError> {
    // Open a connection to the mini-redis address.
    let mut client = client::connect("127.0.0.1:6379").await?;

    // publish message `bar` on channel foo
    let res = client.publish("foo", "bar".into()).await?;

    println!("pushed message success, res: {:?}", res);

    Ok(())
}
```

examples/sub.rs

```rust
#[tokio::main]
pub async fn main() -> Result<(), MiniRedisClientError> {
    // Open a connection to the mini-redis address.
    let client = client::connect("127.0.0.1:6379").await?;

    // subscribe to channel foo
    let mut subscriber = client.subscribe(vec!["foo".into()]).await?;

    // await messages on channel foo
    if let Some(msg) = subscriber.next_message().await? {
        println!(
            "got message from the channel: {}; message = {:?}",
            msg.channel, msg.content
        );
    }

    Ok(())
}
```

<br/>

## **总结**

通过学习 mini-redis，应该能够学习到：

-   tokio框架的使用，如何编写异步代码；
-   Redis 一个简单的实现，以及通信协议；
-   服务端和客户端是如何实现的；
-   连接管理、服务端优雅停机；
-   ……

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
