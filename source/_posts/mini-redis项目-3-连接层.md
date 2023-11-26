---
title: mini-redis项目-3-连接层
toc: true
cover: 'https://img.paulzzh.com/touhou/random?3'
date: 2022-12-06 00:16:29
categories: Rust
tags: [Rust, Database, Redis]
description: 上一篇文章讲解了mini-redis数据存储层的实现，这一篇在这个基础之上，讲解连接层的实现；连接层负责建立服务端和客户端之间的连接，通过tokio框架我们可以异步的处理连接；
---

上一篇文章 [《mini-redis项目-2-存储层》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-2-存储层/) 中讲解了mini-redis数据存储层的实现，这一篇在这个基础之上，讲解连接层的实现；

连接层负责建立服务端和客户端之间的连接，通过tokio框架我们可以异步的处理连接；

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

# **mini-redis项目-3-连接层**

连接层主要是屏蔽客户端与服务端之间的底层通信协议，并处理两端之间连接的建立、断开等；

## **Redis序列化通信协议**

### **RESP简介**

和其他的通信协议类似，客户端和服务端之间也需要定义一个通信协议规则才能进行通信；

Redis 中的通信协议被称为：RESP，即：Redis serialization protocol (RESP)

官方文档如下：

-   https://redis.io/docs/reference/protocol-spec/

这个通信协议的优势：

-   Simple to implement.
-   Fast to parse.
-   Human readable.

RESP 可以序列化不同的数据类型，如整数，字符串和数组；同时，错误也有特定类型；

请求从客户端发送到服务器时，命令被解析为带有的参数字符串数组（下文中的Frame），服务端使用特定的数据类型回复；

同时，**RESP 中使用前缀来标记数据类型以及长度**（prefixed-length）；

<br/>

### **RESP基本内容**

RESP 是一个串行化协议（serialization protocol），支持以下几种数据类型：

-   Simple Strings；
-   Errors；
-   Integers；
-   Bulk Strings；
-   Arrays；

同时 RESP 使用的是请求-响应模型（request-response protocol）：

-   客户端将命令作为 Array of Bulk Strings 发送到Redis服务器；
-   服务器获取命令，根据不同的类型进行回复；

在 RESP 中，不同的数据类型是由他首个字节决定：

-   For **Simple Strings**：the first byte of the reply is "+"；
-   For **Errors**：the first byte of the reply is "-"；
-   For **Integers**：the first byte of the reply is ":"；
-   For **Bulk Strings**：the first byte of the reply is "$"；
-   For **Arrays**：the first byte of the reply is "`*`"；

对于 Null 值，可以使用 Bulk Strings 或者 Array 的特殊值来实现；

在 RESP 中，不同消息之间总是以 `"\r\n"` 结尾（different parts of the protocol are always terminated with "\r\n" (CRLF)）；

最后，官方文档提供了不同数据类型的例子：

```bash
# Simple Strings
"+OK\r\n"

# Errors
"-ERR unknown command 'helloworld'\r\n"

# Integers
":1000\r\n"

# Bulk Strings
"$5\r\nhello\r\n" => "hello"
"$0\r\n\r\n" => ""
"$-1\r\n" => Null(Null Bulk String)

# Arrays
"*0\r\n" => []
"*2\r\n$5\r\nhello\r\n$5\r\nworld\r\n" => ["hello","world"]
"*3\r\n:1\r\n:2\r\n:3\r\n" => [1,2,3]
"*5\r\n:1\r\n:2\r\n:3\r\n:4\r\n$5\r\nhello\r\n" => [1,2,3,4,"hello"]
"*-1\r\n" => Null(Null Array)

# Nested arrays
*2\r\n
*3\r\n
:1\r\n
:2\r\n
:3\r\n
*2\r\n
+Hello\r\n
-World\r\n => [[1,2,3],["Hello", Err("World")]]

# Null elements in Arrays
*3\r\n
$5\r\n
hello\r\n
$-1\r\n
$5\r\n
world\r\n => ["hello",nil,"world"]
```

官方文档还列出了不同数据类型的一些实现细节，你在阅读下面一部分时，建议先阅读官方文档；

-   https://redis.io/docs/reference/protocol-spec/

否则对于一些实现可能会一脸懵比；

<br/>

### **向服务端发送命令**

前面介绍了 RESP 各个数据类型的定义，那么客户端和服务端到底是如何交互的呢？

也就是说，客户端要如何发送命令到服务端，并且服务端进行响应的呢？

下面来看一个客户端发送 **`LLEN mylist`**（获取 mylist 长度） 的例子：

```bash
Client: "*2\r\n$4\r\nLLEN\r\n$6\r\nmylist\r\n"

Server: :48293\r\n
```

客户端首先将 `LLEN mylist` 包装后，发送 `"*2\r\n$4\r\nLLEN\r\n$6\r\nmylist\r\n"` 到服务端；

服务端处理后返回 `:48293\r\n` 给客户端；

客户端收到结果并解析后，得到结果 `48293`；

<br/>

## **mini-redis连接层实现**

mini-redis 中的连接层主要分为三个部分：

-   **消息块 Frame：对应于上文所说的一整条使用 `\r\n` 分隔的序列化的命令，但是经过了格式化和拆分；**
-   **消息解析 Parse：将 Frame 消息解析为对应类型的命令；**
-   **连接管理 Connection：管理连接，发送并接收相应的消息；**

代码结构如下：

```bash
$ tree ./src/connection 
./src/connection
├── connect.rs
├── frame.rs
├── mod.rs
└── parse.rs
```

下面我们一个一个来看；

<br/>

### **消息块Frame**

前文说了一个 Frame 对应于一整条使用 `\r\n` 分隔的序列化的命令，我们将这条命令封装到了 Frame 中；

而由于在 Redis 中，命令的类型是固定的，那么使用 Rust 中强大的枚举类型来定义再合适不过！

实现如下：

src/connection/frame.rs

```rust
#[derive(Clone, Debug)]
pub enum Frame {
    Simple(String),
    Error(String),
    Integer(u64),
    Bulk(Bytes),
    Null,
    Array(Vec<Frame>),
}

impl PartialEq<&str> for Frame {
    fn eq(&self, other: &&str) -> bool {
        match self {
            Frame::Simple(s) => s.eq(other),
            Frame::Bulk(s) => s.eq(other),
            _ => false,
        }
    }
}

impl fmt::Display for Frame {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        use std::str;

        match self {
            Frame::Simple(response) => response.fmt(fmt),
            Frame::Error(msg) => write!(fmt, "error: {}", msg),
            Frame::Integer(num) => num.fmt(fmt),
            Frame::Bulk(msg) => match str::from_utf8(msg) {
                Ok(string) => string.fmt(fmt),
                Err(_) => write!(fmt, "{:?}", msg),
            },
            Frame::Null => "(nil)".fmt(fmt),
            Frame::Array(parts) => {
                for (i, part) in parts.iter().enumerate() {
                    if i > 0 {
                        write!(fmt, " ")?;
                        part.fmt(fmt)?;
                    }
                }

                Ok(())
            }
        }
    }
}

impl Frame {
    pub(crate) fn array() -> Frame {
        Frame::Array(vec![])
    }

    pub(crate) fn push_bulk(&mut self, bytes: Bytes) -> Result<(), MiniRedisParseError> {
        match self {
            Frame::Array(vec) => {
                vec.push(Frame::Bulk(bytes));
                Ok(())
            }
            _ => Err(MiniRedisParseError::ParseArrayFrame),
        }
    }

    pub(crate) fn push_int(&mut self, value: u64) -> Result<(), MiniRedisParseError> {
        match self {
            Frame::Array(vec) => {
                vec.push(Frame::Integer(value));
                Ok(())
            }
            _ => Err(MiniRedisParseError::ParseArrayFrame),
        }
    }

    pub fn check(src: &mut Cursor<&[u8]>) -> Result<(), MiniRedisParseError> {
        match get_u8(src)? {
            b'+' => {
                get_line(src)?;
                Ok(())
            }
            b'-' => {
                get_line(src)?;
                Ok(())
            }
            b':' => {
                let _ = get_decimal(src)?;
                Ok(())
            }
            b'$' => {
                if b'-' == peek_u8(src)? {
                    skip(src, 4)
                } else {
                    let len: usize = get_decimal(src)?.try_into()?;

                    skip(src, len + 2)
                }
            }
            b'*' => {
                let len = get_decimal(src)?;

                for _ in 0..len {
                    Frame::check(src)?;
                }

                Ok(())
            }
            actual => Err(MiniRedisParseError::Parse(format!(
                "protocol error; invalid frame type byte `{}`",
                actual
            ))),
        }
    }

    pub fn parse(src: &mut Cursor<&[u8]>) -> Result<Frame, MiniRedisParseError> {
        match get_u8(src)? {
            b'+' => {
                let line = get_line(src)?.to_vec();

                let string = String::from_utf8(line)?;

                Ok(Frame::Simple(string))
            }
            b'-' => {
                let line = get_line(src)?.to_vec();

                let string = String::from_utf8(line)?;

                Ok(Frame::Error(string))
            }
            b':' => {
                let len = get_decimal(src)?;
                Ok(Frame::Integer(len))
            }
            b'$' => {
                if b'-' == peek_u8(src)? {
                    let line = get_line(src)?;

                    if line != b"-1" {
                        return Err(MiniRedisParseError::Parse(
                            "protocol error; invalid frame format".into(),
                        ));
                    }

                    Ok(Frame::Null)
                } else {
                    let len = get_decimal(src)?.try_into()?;
                    let n = len + 2;

                    if src.remaining() < n {
                        return Err(MiniRedisParseError::Incomplete);
                    }

                    let data = Bytes::copy_from_slice(&src.chunk()[..len]);

                    skip(src, n)?;

                    Ok(Frame::Bulk(data))
                }
            }
            b'*' => {
                let len = get_decimal(src)?.try_into()?;
                let mut out = Vec::with_capacity(len);

                for _ in 0..len {
                    out.push(Frame::parse(src)?);
                }

                Ok(Frame::Array(out))
            }
            _ => Err(MiniRedisParseError::Unimplemented),
        }
    }
}

fn skip(src: &mut Cursor<&[u8]>, n: usize) -> Result<(), MiniRedisParseError> {
    if src.remaining() < n {
        return Err(MiniRedisParseError::Incomplete);
    }

    src.advance(n);
    Ok(())
}

fn peek_u8(src: &mut Cursor<&[u8]>) -> Result<u8, MiniRedisParseError> {
    if !src.has_remaining() {
        return Err(MiniRedisParseError::Incomplete);
    }

    Ok(src.chunk()[0])
}

fn get_u8(src: &mut Cursor<&[u8]>) -> Result<u8, MiniRedisParseError> {
    if !src.has_remaining() {
        return Err(MiniRedisParseError::Incomplete);
    }

    Ok(src.get_u8())
}

fn get_decimal(src: &mut Cursor<&[u8]>) -> Result<u64, MiniRedisParseError> {
    use atoi::atoi;

    let line = get_line(src)?;

    atoi::<u64>(line).ok_or_else(|| {
        MiniRedisParseError::Parse("protocol error; invalid frame format to get decimal".into())
    })
}

fn get_line<'a>(src: &mut Cursor<&'a [u8]>) -> Result<&'a [u8], MiniRedisParseError> {
    let start = src.position() as usize;
    let end = src.get_ref().len() - 1;

    for i in start..end {
        if src.get_ref()[i] == b'\r' && src.get_ref()[i + 1] == b'\n' {
            src.set_position((i + 2) as u64);

            return Ok(&src.get_ref()[start..i]);
        }
    }

    Err(MiniRedisParseError::Incomplete)
}
```

<br/>

#### **Frame定义**

和上面 Redis 官方文档相对应，我们定义了 Frame 枚举，并重写了 PartialEq 和 Display Trait；

```rust
#[derive(Clone, Debug)]
pub enum Frame {
    Simple(String),
    Error(String),
    Integer(u64),
    Bulk(Bytes),
    Null,
    Array(Vec<Frame>),
}

impl PartialEq<&str> for Frame {
    fn eq(&self, other: &&str) -> bool {
        match self {
            Frame::Simple(s) => s.eq(other),
            Frame::Bulk(s) => s.eq(other),
            _ => false,
        }
    }
}

impl fmt::Display for Frame {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        use std::str;

        match self {
            Frame::Simple(response) => response.fmt(fmt),
            Frame::Error(msg) => write!(fmt, "error: {}", msg),
            Frame::Integer(num) => num.fmt(fmt),
            Frame::Bulk(msg) => match str::from_utf8(msg) {
                Ok(string) => string.fmt(fmt),
                Err(_) => write!(fmt, "{:?}", msg),
            },
            Frame::Null => "(nil)".fmt(fmt),
            Frame::Array(parts) => {
                for (i, part) in parts.iter().enumerate() {
                    if i > 0 {
                        write!(fmt, " ")?;
                        part.fmt(fmt)?;
                    }
                }

                Ok(())
            }
        }
    }
}
```

**需要注意：的是我们直接使用了 Vector 来存储 Array 类型的命令；**

其他部分实现非常简单，这里不再解释了；

下面来具体看 Frame 的实现部分；

<br/>

#### **Frame实现**

我们在 Frame 中定义了下面几个方法：

-   array：返回一个空的 Array 类型的 Frame，大多用于服务端响应时自行填充返回值时使用，配合下面的各种push方法；
-   push_bulk：向 Frame 对象中填充 Bulk 类型的值；
-   push_int：向 Frame 对象中填充 Int 类型的值；
-   check：校验当前字节数组中的值是否合法，主要用在服务端、客户端接受到请求和响应后进行消息校验；
-   parse：将当前字节数组中的值解析为 Frame；

实现如下：

```rust
impl Frame {
    /// Returns an empty array
    pub(crate) fn array() -> Frame {
        Frame::Array(vec![])
    }

    /// Push a "bulk" frame into the array. `self` must be an Array frame.
    pub(crate) fn push_bulk(&mut self, bytes: Bytes) -> Result<(), MiniRedisParseError> {
        match self {
            Frame::Array(vec) => {
                vec.push(Frame::Bulk(bytes));
                Ok(())
            }
            _ => Err(MiniRedisParseError::ParseArrayFrame),
        }
    }

    /// Push an "integer" frame into the array. `self` must be an Array frame.
    pub(crate) fn push_int(&mut self, value: u64) -> Result<(), MiniRedisParseError> {
        match self {
            Frame::Array(vec) => {
                vec.push(Frame::Integer(value));
                Ok(())
            }
            _ => Err(MiniRedisParseError::ParseArrayFrame),
        }
    }

    /// Checks if an entire message can be decoded from `src`
    pub fn check(src: &mut Cursor<&[u8]>) -> Result<(), MiniRedisParseError> {
        match get_u8(src)? {
            b'+' => {
                get_line(src)?;
                Ok(())
            }
            b'-' => {
                get_line(src)?;
                Ok(())
            }
            b':' => {
                let _ = get_decimal(src)?;
                Ok(())
            }
            b'$' => {
                if b'-' == peek_u8(src)? {
                    // Skip '-1\r\n'
                    skip(src, 4)
                } else {
                    // Read the bulk string
                    let len: usize = get_decimal(src)?.try_into()?;

                    // skip that number of bytes + 2 (\r\n).
                    skip(src, len + 2)
                }
            }
            b'*' => {
                let len = get_decimal(src)?;

                for _ in 0..len {
                    Frame::check(src)?;
                }

                Ok(())
            }
            actual => Err(MiniRedisParseError::Parse(format!(
                "protocol error; invalid frame type byte `{}`",
                actual
            ))),
        }
    }

    pub fn parse(src: &mut Cursor<&[u8]>) -> Result<Frame, MiniRedisParseError> {
        match get_u8(src)? {
            b'+' => {
                // Read the line and convert it to `Vec<u8>`
                let line = get_line(src)?.to_vec();

                // Convert the line to a String
                let string = String::from_utf8(line)?;

                Ok(Frame::Simple(string))
            }
            b'-' => {
                // Read the line and convert it to `Vec<u8>`
                let line = get_line(src)?.to_vec();

                // Convert the line to a String
                let string = String::from_utf8(line)?;

                Ok(Frame::Error(string))
            }
            b':' => {
                let len = get_decimal(src)?;
                Ok(Frame::Integer(len))
            }
            b'$' => {
                if b'-' == peek_u8(src)? {
                    let line = get_line(src)?;

                    if line != b"-1" {
                        return Err(MiniRedisParseError::Parse(
                            "protocol error; invalid frame format".into(),
                        ));
                    }

                    Ok(Frame::Null)
                } else {
                    // Read the bulk string
                    let len = get_decimal(src)?.try_into()?;
                    let n = len + 2;

                    if src.remaining() < n {
                        return Err(MiniRedisParseError::Incomplete);
                    }

                    let data = Bytes::copy_from_slice(&src.chunk()[..len]);

                    // skip that number of bytes + 2 (\r\n).
                    skip(src, n)?;

                    Ok(Frame::Bulk(data))
                }
            }
            b'*' => {
                let len = get_decimal(src)?.try_into()?;
                let mut out = Vec::with_capacity(len);

                for _ in 0..len {
                    out.push(Frame::parse(src)?);
                }

                Ok(Frame::Array(out))
            }
            _ => Err(MiniRedisParseError::Unimplemented),
        }
    }
}
```

写入 Frame 的方法：

-   array 方法：实现非常简单，就是返回一个空的 Array 类型的 Frame，并初始化一个空的 vector；
-   push_bulk 方法：如果当前 Frame 对象是 Array 类型，则将 bytes 加入数组中，否则报错；
-   push_int 方法：和上面类似，如果当前 Frame 对象是 Array 类型，则将 u64 加入数组中；

重点来看**解析 Frame 的方法：check 和 parse；**

他们将接收到的字节，根据前文中的 RESP 规则解析为对应类型的 Frame；

两者的实现及其类似，这里主要解析 check 方法，parse 方法只是在 check 逻辑的基础之上将 Frame 封装后返回；

首先来看几个辅助函数：

```rust
fn skip(src: &mut Cursor<&[u8]>, n: usize) -> Result<(), MiniRedisParseError> {
    if src.remaining() < n {
        return Err(MiniRedisParseError::Incomplete);
    }

    src.advance(n);
    Ok(())
}

fn peek_u8(src: &mut Cursor<&[u8]>) -> Result<u8, MiniRedisParseError> {
    if !src.has_remaining() {
        return Err(MiniRedisParseError::Incomplete);
    }

    Ok(src.chunk()[0])
}

fn get_u8(src: &mut Cursor<&[u8]>) -> Result<u8, MiniRedisParseError> {
    if !src.has_remaining() {
        return Err(MiniRedisParseError::Incomplete);
    }

    Ok(src.get_u8())
}

/// Read a new-line terminated decimal
fn get_decimal(src: &mut Cursor<&[u8]>) -> Result<u64, MiniRedisParseError> {
    use atoi::atoi;

    let line = get_line(src)?;

    atoi::<u64>(line).ok_or_else(|| {
        MiniRedisParseError::Parse("protocol error; invalid frame format to get decimal".into())
    })
}

/// Find a line in a frame
fn get_line<'a>(src: &mut Cursor<&'a [u8]>) -> Result<&'a [u8], MiniRedisParseError> {
    // Scan the bytes directly
    let start = src.position() as usize;
    // Scan to the second to last byte
    let end = src.get_ref().len() - 1;

    for i in start..end {
        if src.get_ref()[i] == b'\r' && src.get_ref()[i + 1] == b'\n' {
            // We found a line, update the position to be *after* the \n
            src.set_position((i + 2) as u64);

            // Return the line
            return Ok(&src.get_ref()[start..i]);
        }
    }

    Err(MiniRedisParseError::Incomplete)
}
```

上面定义了几个辅助函数：

-   **`skip(src: &mut Cursor<&[u8]>, n: usize)`：将当前 Cursor 前移 n 个字节；**
    -   前面说到了在 RESP 中会通过 prefixed-length 来指定数据的字节长度，这里就可以直接将这个数据跳过，继续解析下一个数据；
    -   当然，如果后面已经没有 n 个字节，说明数据不完整，此时无法解析，返回 `MiniRedisParseError::Incomplete` 类型的错误，说明消息不完整；
-   **`peek_u8(src: &mut Cursor<&[u8]>)`：查看下一个字节对应字符；**
    -   peek_u8 主要是在不移动指针的前提下获取下一个字节，可以用来判断，例如：Array 中的下一个数据类型、是否为空的 Bulk（`-` 开头）等；
-   **`get_u8(src: &mut Cursor<&[u8]>)`：直接获取下一个字节，用于直接判断某个命令的数据类型；**
-   **`get_line<'a>(src: &mut Cursor<&'a [u8]>)`：获取以 `\r\n` 结尾的一整行数据；**
    -   前文提到了每个独立的命令都是以 `\r\n` 结尾；
-   **`get_decimal(src: &mut Cursor<&[u8]>)`：获取一整行整型类型，主要用在简化整型数据解析的场景；**

下面来看具体的 check 方法的实现：

```rust
pub fn check(src: &mut Cursor<&[u8]>) -> Result<(), MiniRedisParseError> {
  match get_u8(src)? {
    b'+' => {
      get_line(src)?;
      Ok(())
    }
    b'-' => {
      get_line(src)?;
      Ok(())
    }
    b':' => {
      let _ = get_decimal(src)?;
      Ok(())
    }
    b'$' => {
      if b'-' == peek_u8(src)? {
        // Skip '-1\r\n'
        skip(src, 4)
      } else {
        // Read the bulk string
        let len: usize = get_decimal(src)?.try_into()?;

        // skip that number of bytes + 2 (\r\n).
        skip(src, len + 2)
      }
    }
    b'*' => {
      let len = get_decimal(src)?;

      for _ in 0..len {
        Frame::check(src)?;
      }

      Ok(())
    }
    actual => Err(MiniRedisParseError::Parse(format!(
      "protocol error; invalid frame type byte `{}`",
      actual
    ))),
  }
}
```

逻辑如下：

-   **`+` 或者 `-` 开头（简单字符串、错误信息）：只要是一行数据（`\r\n` 结尾）即可；**
-   **`:` 开头（整数类型）：不光要是一行数据，还要能被解析为整数；**
-   **`$` 开头（Bulk String）：**
    -   **如果 `-` 开头，说明是空字符串（`$-1\r\n`）；**
    -   **否则，先通过 get_decimal 取出字符串长度、再跳过 `对应长度 + 2(\r\n)` 个字节，取出 Frame；**
-   **`*` 开头（Array）：先取出数组的长度 len，再递归的调用 check 来校验每一个元素；**
-   **否则是不支持的数据类型，直接报错；**

parse 方法的逻辑和 check 基本上是一致的，这里不再赘述；

<font color="#f00">**需要注意的是：check 方法会移动 Cursor 指针到 `\r\n` 之后，这是为了后面在调用 parse 方法时可以直接获取到一整条 Frame 的长度；**</font>

另外还有一个问题：**为什么将解析分为了 check、parse 两个功能相似的方法？**

这是因为：

-   <font color="#f00">**首先，在一整条命令尚未完全接收到的时候，我们会可能会进行多次解析，而 check 的效率是高于 parse 的；**</font>
-   <font color="#f00">**另外，在没有完全确定我们收到了一个完整的 Frame 之前如果直接强行的 parse 会分配内存，而先调用 check 方法是不需要内存分配的；**</font>

<br/>

###  **消息解析Parse**

Parse 是对 Frame 的一个包装，将例如：`set foo 123` 一整个 Frame 包装为一个类似于 cursor 的结构；这样，Parse 中的第一个元素即 redis 中的命令；

这在遍历 Frame 中的 Array 等结构时非常有用！

Parse 定义如下：

src/connection/parse.rs

```rust
/// Utility for parsing a command
///
/// Commands are represented as array frames. Each entry in the frame is a
/// "token". A `Parse` is initialized with the array frame and provides a
/// cursor-like API. Each command struct includes a `parse_frame` method that
/// uses a `Parse` to extract its fields.
#[derive(Debug)]
pub(crate) struct Parse {
    /// Array frame iterator.
    parts: vec::IntoIter<Frame>,
}
```

对应实现的方法：

src/connection/parse.rs

```rust
impl Parse {
    /// Create a new `Parse` to parse the contents of `frame`.
    /// Returns `Err` if `frame` is not an array frame.
    pub(crate) fn new(frame: Frame) -> Result<Parse, MiniRedisParseError> {
        let array = match frame {
            Frame::Array(array) => array,
            frame => {
                return Err(MiniRedisParseError::Parse(format!(
                    "protocol error; expected array, got {:?}",
                    frame
                )))
            }
        };

        Ok(Parse {
            parts: array.into_iter(),
        })
    }

    /// Return the next entry. Array frames are arrays of frames, so the next
    /// entry is a frame.
    fn next(&mut self) -> Result<Frame, MiniRedisParseError> {
        self.parts.next().ok_or(MiniRedisParseError::EndOfStream)
    }

    /// Return the next entry as a string.
    /// If the next entry cannot be represented as a String, then an error is returned.
    pub(crate) fn next_string(&mut self) -> Result<String, MiniRedisParseError> {
        match self.next()? {
            // Both `Simple` and `Bulk` representation may be strings. Strings
            // are parsed to UTF-8.
            //
            // While errors are stored as strings, they are considered separate
            // types.
            Frame::Simple(s) => Ok(s),
            Frame::Bulk(data) => std::str::from_utf8(&data[..])
                .map(|s| s.to_string())
                .map_err(|_| MiniRedisParseError::Parse("protocol error; invalid string".into())),
            frame => Err(MiniRedisParseError::Parse(format!(
                "protocol error; expected simple frame or bulk frame, got {:?}",
                frame
            ))),
        }
    }

    /// Return the next entry as raw bytes.
    /// If the next entry cannot be represented as raw bytes, an error is
    /// returned.
    pub(crate) fn next_bytes(&mut self) -> Result<Bytes, MiniRedisParseError> {
        match self.next()? {
            // Both `Simple` and `Bulk` representation may be raw bytes.
            //
            // Although errors are stored as strings and could be represented as
            // raw bytes, they are considered separate types.
            Frame::Simple(s) => Ok(Bytes::from(s.into_bytes())),
            Frame::Bulk(data) => Ok(data),
            frame => Err(MiniRedisParseError::Parse(format!(
                "protocol error; expected simple frame or bulk frame, got {:?}",
                frame
            ))),
        }
    }

    /// Return the next entry as an integer.
    ///
    /// This includes `Simple`, `Bulk`, and `Integer` frame types. `Simple` and
    /// `Bulk` frame types are parsed.
    ///
    /// If the next entry cannot be represented as an integer, then an error is
    /// returned.
    pub(crate) fn next_int(&mut self) -> Result<u64, MiniRedisParseError> {
        use atoi::atoi;

        match self.next()? {
            // An integer frame type is already stored as an integer.
            Frame::Integer(v) => Ok(v),
            // Simple and bulk frames must be parsed as integers. If the parsing
            // fails, an error is returned.
            Frame::Simple(data) => atoi::<u64>(data.as_bytes())
                .ok_or_else(|| MiniRedisParseError::Parse("protocol error; invalid number".into())),
            Frame::Bulk(data) => atoi::<u64>(&data)
                .ok_or_else(|| MiniRedisParseError::Parse("protocol error; invalid number".into())),
            frame => Err(MiniRedisParseError::Parse(format!(
                "protocol error; expected int frame but got {:?}",
                frame
            ))),
        }
    }

    /// Ensure there are no more entries in the array
    pub(crate) fn finish(&mut self) -> Result<(), MiniRedisParseError> {
        if self.parts.next().is_none() {
            Ok(())
        } else {
            Err(MiniRedisParseError::Parse(
                "protocol error; expected end of frame, but there was more".into(),
            ))
        }
    }
}
```

解析如下：

-   **new 方法：**创建了一个 IntoIter 类型的迭代器，类似于流数据，一旦获取到了下一个 Frame，则交出所有权！
-   **next、next_string、next_bytes、next_int 方法：**提供了直接获取下一个 Frame 的方法，如果类型不匹配则直接报错，避免了自己再去判断数据类型，简化了使用；
-   **finish 方法：**当命令解析完成后调用该方法，确保 Frame 用完，保证 Frame 格式的正确性；

Parse 模块主要是给 Command 模块提供一个更高层次上的命令抽象，方便使用；

<br/>

### **连接管理Connection**

#### **Connection定义**

最后来看连接管理 Connection，他负责在 Client 和 Server 之间建立一个 TCP 连接，并负责写入或读取低层次的 Frame 数据；

Connection 的定义如下：

src/connection/connect.rs

```rust
/// Send and receive `Frame` values from a remote peer.
///
/// When implementing networking protocols, a message on that protocol is
/// often composed of several smaller messages known as frames. The purpose of
/// `Connection` is to read and write frames on the underlying `TcpStream`.
///
/// To read frames, the `Connection` uses an internal buffer, which is filled
/// up until there are enough bytes to create a full frame. Once this happens,
/// the `Connection` creates the frame and returns it to the caller.
///
/// When sending frames, the frame is first encoded into the write buffer.
/// The contents of the write buffer are then written to the socket.
#[derive(Debug)]
pub struct Connection {
    /// The `TcpStream`. It is decorated with a `BufWriter`, which provides write
    /// level buffering. The `BufWriter` implementation provided by Tokio is
    /// sufficient for our needs.
    stream: BufWriter<TcpStream>,

    // The buffer for reading frames.
    buffer: BytesMut,
}
```

Connection 包含了：

-   **stream：**`BufWriter<TcpStream>` 类型；<font color="#f00">**stream 被 BufWriter 包装，这样我们在写入数据的时候，可以先分块写入（类似于Java中的StringBuilder），最后再调用 flush 一次发送，避免多次调用内核函数，提高效率；**</font>
-   **buffer：**连接读取数据时的缓冲；<font color="#f00">**注意到我们使用的是 tokio 框架，因此将数据读取到 buffer 是一个异步操作；**</font>

在 Connection 中定义并暴露了下面两个方法：

-   `new`：构造函数；
-   `read_frame`：从 buffer 中读取并解析数据为 Frame；
-   `write_frame`：向 TCP 流中写入一个完整的 Frame 数据；

下面来看实现：

```rust
impl Connection {
    pub fn new(socket: TcpStream) -> Connection {
        Connection {
            stream: BufWriter::new(socket),
            buffer: BytesMut::with_capacity(4 * 1024),
        }
    }

    pub async fn read_frame(&mut self) -> Result<Option<Frame>, MiniRedisConnectionError> {
        loop {
            if let Some(frame) = self.parse_frame()? {
                return Ok(Some(frame));
            }

            if 0 == self.stream.read_buf(&mut self.buffer).await? {
                return if self.buffer.is_empty() {
                    Ok(None)
                } else {
                    Err(MiniRedisConnectionError::Disconnect)
                };
            }
        }
    }

    fn parse_frame(&mut self) -> Result<Option<Frame>, MiniRedisConnectionError> {
        let mut buf = Cursor::new(&self.buffer[..]);

        match Frame::check(&mut buf) {
            Ok(_) => {
                let len = buf.position() as usize;

                buf.set_position(0);

                let frame = Frame::parse(&mut buf)?;

                self.buffer.advance(len);
                Ok(Some(frame))
            }
            Err(MiniRedisParseError::Incomplete) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    pub async fn write_frame(&mut self, frame: &Frame) -> Result<(), MiniRedisConnectionError> {
        match frame {
            Frame::Array(val) => {
                self.stream.write_u8(b'*').await?;

                self.write_decimal(val.len() as u64).await?;

                for entry in val {
                    self.write_value(entry).await?;
                }
            }
            _ => self.write_value(frame).await?,
        }

        self.stream.flush().await.map_err(|e| e.into())
    }

    async fn write_value(&mut self, frame: &Frame) -> Result<(), MiniRedisConnectionError> {
        match frame {
            Frame::Simple(val) => {
                self.stream.write_u8(b'+').await?;
                self.stream.write_all(val.as_bytes()).await?;
                self.stream.write_all(b"\r\n").await?;
            }
            Frame::Error(val) => {
                self.stream.write_u8(b'-').await?;
                self.stream.write_all(val.as_bytes()).await?;
                self.stream.write_all(b"\r\n").await?;
            }
            Frame::Integer(val) => {
                self.stream.write_u8(b':').await?;
                self.write_decimal(*val).await?;
            }
            Frame::Null => {
                self.stream.write_all(b"$-1\r\n").await?;
            }
            Frame::Bulk(val) => {
                let len = val.len();

                self.stream.write_u8(b'$').await?;
                self.write_decimal(len as u64).await?;
                self.stream.write_all(val).await?;
                self.stream.write_all(b"\r\n").await?;
            }
            Frame::Array(_val) => {
                warn!("unreachable code: recursive write_value: {:?}", _val);
                return Err(MiniRedisParseError::Unimplemented.into());
            }
        }

        Ok(())
    }

    async fn write_decimal(&mut self, val: u64) -> Result<(), MiniRedisConnectionError> {
        use std::io::Write;

        let mut buf = [0u8; 20];
        let mut buf = Cursor::new(&mut buf[..]);

        write!(&mut buf, "{}", val)?;

        let pos = buf.position() as usize;
        self.stream.write_all(&buf.get_ref()[..pos]).await?;
        self.stream.write_all(b"\r\n").await?;

        Ok(())
    }
}
```

new 方法的实现非常简单，对于读取 Buffer 而言开辟了一个 4Kb 的 buffer 空间（对于 prototype 来说是合适的），这里不再赘述，下面重点来看异步数据读写的实现；

<br/>

#### **读取数据：read_frame**

读取数据 read_frame：

```rust
use tokio::io::{AsyncReadExt};
pub async fn read_frame(&mut self) -> Result<Option<Frame>, MiniRedisConnectionError> {
  loop {
    // Attempt to parse a frame from the buffered data. If enough data
    // has been buffered, the frame is returned.
    if let Some(frame) = self.parse_frame()? {
      return Ok(Some(frame));
    }

    // There is not enough buffered data to read a frame. Attempt to
    // read more data from the socket.
    //
    // On success, the number of bytes is returned. `0` indicates "end
    // of stream".
    if 0 == self.stream.read_buf(&mut self.buffer).await? {
      // The remote closed the connection. For this to be a clean
      // shutdown, there should be no data in the read buffer. If
      // there is, this means that the peer closed the socket while
      // sending a frame.
      return if self.buffer.is_empty() {
        Ok(None)
      } else {
        Err(MiniRedisConnectionError::Disconnect)
      };
    }
  }
}
```

在 read_frame 方法中会循环读取数据，并调用内部的 parse_frame 方法解析当前 buffer 中的数据：

-   如果 parse_frame 方法成功解析了一个 frame，则退出循环并返回这个 Frame；
-   如果 parse_frame 方法保存则返回错误；
-   否则继续调用 `self.stream.read_buf(&mut self.buffer).await` 异步的向 buffer 中读取数据（依赖 tokio 中的 AsyncReadExt Trait），如果 read_buf 返回 0 则说明流已关闭（对面客户端关闭了连接）！

当流关闭后：

-   如果 buffer 中无数据，则表示客户端并未发送数据，此时正常退出即可；
-   如果 buffer 中存在数据，则表示客户端在发送数据的中途关闭了连接，此时要报错：`MiniRedisConnectionError::Disconnect`；

>   **上面基本上是使用 tokio stream 的标准结构；**

下面具体来看解析 Frame 部分：

```rust
fn parse_frame(&mut self) -> Result<Option<Frame>, MiniRedisConnectionError> {
  // Cursor is used to track the "current" location in the
  // buffer. Cursor also implements `Buf` from the `bytes` crate
  // which provides a number of helpful utilities for working
  // with bytes.
  let mut buf = Cursor::new(&self.buffer[..]);

  // The first step is to check if enough data has been buffered to parse a single frame.
  // This step is usually much faster than doing a full
  // parse of the frame, and allows us to skip allocating data structures
  // to hold the frame data unless we know the full frame has been received.
  match Frame::check(&mut buf) {
    Ok(_) => {
      // The `check` function will have advanced the cursor until the
      // end of the frame. Since the cursor had position set to zero
      // before `Frame::check` was called, we obtain the length of the
      // frame by checking the cursor position.
      let len = buf.position() as usize;

      // Reset the position to zero before passing the cursor to
      // `Frame::parse`.
      buf.set_position(0);

      // Parse the frame from the buffer. This allocates the necessary
      // structures to represent the frame and returns the frame value.
      //
      // If the encoded frame representation is invalid, an error is
      // returned. This should terminate the **current** connection
      // but should not impact any other connected client.
      let frame = Frame::parse(&mut buf)?;

      // Discard the parsed data from the read buffer.
      //
      // When `advance` is called on the read buffer, all of the data
      // up to `len` is discarded. The details of how this works is
      // left to `BytesMut`. This is often done by moving an internal
      // cursor, but it may be done by reallocating and copying data.
      self.buffer.advance(len);

      // Return the parsed frame to the caller.
      Ok(Some(frame))
    }
    // There is not enough data present in the read buffer to parse a
    // single frame. We must wait for more data to be received from the
    // socket. Reading from the socket will be done in the statement
    // after this `match`.
    //
    // We do not want to return `Err` from here as this "error" is an
    // expected runtime condition.
    Err(MiniRedisParseError::Incomplete) => Ok(None),
    // An error was encountered while parsing the frame. The connection
    // is now in an invalid state. Returning `Err` from here will result
    // in the connection being closed.
    Err(e) => Err(e.into()),
  }
}
```

在 parse_frame 内部方法中就用到了我们前文中所述的 `Frame::check` 方法；

parse_frame 首先将 buffer 转为 Cursor，随后调用 `Frame::check` 方法对 buffer 中的数据进行校验：

-   如果校验成功：
    -   获取当前 buf 的长度作为整个 Frame 的长度（**前文提到 check 方法会移动`当前 Cursor`（每次调用 parse_frame 创建一个新的 Cursor） 的位置到 Frame 末尾**）；
    -   同时将 cursor 恢复后调用 `Frame::parse` 方法解析 Frame；
    -   最后调用 `self.buffer.advance(len)` 移动指针并丢弃 buffer 中我们已经解析的数据；
-   如果校验失败：
    -   如果是 `MiniRedisParseError::Incomplete` 类型的错误，则说明 buffer 中的数据还不够组成一个 Frame，此时返回 None；
    -   否则，直接返回错误即可；

<font color="#f00">**这里就体现了我们使用 thiserror 库的优势：我们可以判断具体的错误类型为数据不足，进而继续从 buffer 中读取数据；**</font>

<br/>

#### **写入数据：write_frame**

写入 Frame write_frame：

```rust
use tokio::io::{AsyncWriteExt, BufWriter};

/// Write a single `Frame` value to the underlying stream.
///
/// The `Frame` value is written to the socket using the various `write_*`
/// functions provided by `AsyncWrite`. Calling these functions directly on
/// a `TcpStream` is **not** advised, as this will result in a large number of
/// syscalls. However, it is fine to call these functions on a *buffered*
/// write stream. The data will be written to the buffer. Once the buffer is
/// full, it is flushed to the underlying socket.
pub async fn write_frame(&mut self, frame: &Frame) -> Result<(), MiniRedisConnectionError> {
  // Arrays are encoded by encoding each entry. All other frame types are
  // considered literals. For now, mini-redis is not able to encode
  // recursive frame structures. See below for more details.
  match frame {
    Frame::Array(val) => {
      // Encode the frame type prefix. For an array, it is `*`.
      self.stream.write_u8(b'*').await?;

      // Encode the length of the array.
      self.write_decimal(val.len() as u64).await?;

      // Iterate and encode each entry in the array.
      for entry in val {
        self.write_value(entry).await?;
      }
    }
    // The frame type is a literal. Encode the value directly.
    _ => self.write_value(frame).await?,
  }

  // Ensure the encoded frame is written to the socket. The calls above
  // are to the buffered stream and writes. Calling `flush` writes the
  // remaining contents of the buffer to the socket.
  self.stream.flush().await.map_err(|e| e.into())
}
```

write_frame 异步写入数据的实现逻辑非常简单：

-   如果是 Array 类型的 Frame，则先写入 `*len(arr)`，然后遍历数组，调用 write_value 内部方法向流中写入数组中的每一个 Frame；
-   否则，直接调用 write_value 内部方法写入 Frame；
-   最后，调用 `stream.flush()` 发送数据即可！

>   <font color="#f00">**由于我们使用 `BufWriter<TcpStream>` 包装了 Stream，因此我们可以多次调用 write_value 向流中写入数据，而只有 buffer 装满，或调用 flush 后才会真正的将数据发送给 socket！**</font>

下面来看 write_value 内部方法，他根据 RESP 规则写入具体格式的数据：

```rust
/// Write a frame literal to the stream
async fn write_value(&mut self, frame: &Frame) -> Result<(), MiniRedisConnectionError> {
  match frame {
    Frame::Simple(val) => {
      self.stream.write_u8(b'+').await?;
      self.stream.write_all(val.as_bytes()).await?;
      self.stream.write_all(b"\r\n").await?;
    }
    Frame::Error(val) => {
      self.stream.write_u8(b'-').await?;
      self.stream.write_all(val.as_bytes()).await?;
      self.stream.write_all(b"\r\n").await?;
    }
    Frame::Integer(val) => {
      self.stream.write_u8(b':').await?;
      self.write_decimal(*val).await?;
    }
    Frame::Null => {
      self.stream.write_all(b"$-1\r\n").await?;
    }
    Frame::Bulk(val) => {
      let len = val.len();

      self.stream.write_u8(b'$').await?;
      self.write_decimal(len as u64).await?;
      self.stream.write_all(val).await?;
      self.stream.write_all(b"\r\n").await?;
    }
    // Encoding an `Array` from within a value cannot be done using a
    // recursive strategy. In general, async fns do not support
    // recursion. Mini-redis has not needed to encode nested arrays yet,
    // so for now it is skipped.
    Frame::Array(_val) => {
      warn!("unreachable code: recursive write_value: {:?}", _val);
      return Err(MiniRedisParseError::Unimplemented.into());
    }
  }

  Ok(())
}

/// Write a decimal frame to the stream
async fn write_decimal(&mut self, val: u64) -> Result<(), MiniRedisConnectionError> {
  use std::io::Write;

  // Convert the value to a string
  let mut buf = [0u8; 20];
  let mut buf = Cursor::new(&mut buf[..]);

  write!(&mut buf, "{}", val)?;

  let pos = buf.position() as usize;
  self.stream.write_all(&buf.get_ref()[..pos]).await?;
  self.stream.write_all(b"\r\n").await?;

  Ok(())
}
```

实现逻辑基本上跟我们解析字节到 Frame 中的逻辑相反；

然而，write_value 的逻辑更加简单，直接根据 RESP 规则，针对不同类型的数据写入不同格式的数据即可；

<font color="#f00">**需要注意的是：目前在 rust 中 async 函数不允许直接递归，因此 write_value 还不能处理另外一个 Array 类型的数据；**</font>

>   **实际上这是因为递归的 async 生成的 Future 块的大小是不确定的，而 Rust 又规定在编译器所有类型的内存大小是确定的；**
>
>   **这可以通过 Box 将 Future 移动到堆上解决：**
>
>   -   https://rust-lang.github.io/async-book/07_workarounds/04_recursion.html
>
>   **另外也有一些库提供了 `#[async_recursion]` 宏，例如：**
>
>   -   https://github.com/dcchut/async-recursion

<br/>

## **小结**

本文实现了 mini-redis 的连接层，主要包括下面几个部分：

-   消息块 Frame：字节流抽象；
-   消息解析 Prase：RESP 完整实现；
-   连接管理 Connection：TCP 连接中的异步读写 Frame 块功能；

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

文章参考：

-   https://redis.io/docs/reference/protocol-spec/

<br/>
