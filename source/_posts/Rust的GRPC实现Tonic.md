---
title: Rust的GRPC实现Tonic
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?3'
date: 2022-12-03 14:19:51
categories: Rust
tags: [Rust, GRPC]
description: tonic是rust中的一个GRPC客户端和服务端的异步实现，底层使用了tokio的prost生成Protocol Buffers对应的代码；本文讲解了如何使用Tonic，并提供了一个包含多个proto文件的项目案例；
---

[tonic](https://github.com/hyperium/tonic) 是rust中的一个GRPC客户端和服务端的异步实现，底层使用了tokio的[`prost`](https://github.com/tokio-rs/prost)生成Protocol Buffers对应的代码；

本文讲解了如何使用Tonic，并提供了一个包含多个proto文件的项目案例；

源代码：

-   https://github.com/JasonkayZK/rust-learn/tree/grpc

<br/>

<!--more-->

# **Rust的GRPC实现Tonic**

## **前言**

[`tonic`](https://github.com/hyperium/tonic)是基于HTTP/2的gRPC实现，专注于高性能，互通性和灵活性；

创建该库的目的是为了对async/await具有一流的支持，并充当用Rust编写的生产系统的核心构建块；

特性：

-   双向流传输
-   高性能异步io
-   互通性
-   通过[`rustls`](https://github.com/ctz/rustls)进行TLS加密支持
-   负载均衡
-   自定义元数据
-   身份认证
-   健康检查
-   ……

编译 Protobuf 还是需要安装 protoc 的，可以参考官方文档：

-   https://grpc.io/docs/protoc-installation/

另外，**除了这个实现之外，PingCAP 也开源了一个实现：**

-   https://github.com/tikv/grpc-rs

我试了一下，说实话并没有 Tonic 好用，但是他的 benchmark 稍微高一些；

下面开始编写一个包含多个proto文件的项目案例；

<br/>

## **创建项目**

最终的目录结构如下：

```bash
$ tree .       
.
├── Cargo.toml
├── Cargo.lock 
├── build.rs
├── proto
  │   ├── basic
  │   │   └── basic.proto
  │   ├── goodbye.proto
  │   └── hello.proto
  └── src
  ├── bin
  │   ├── client.rs
  │   └── server.rs
  └── lib.rs
```

其中：

-   `proto` 目录中定义了服务；
-   `build.rs` 中声明了通过 proto 生成 rs 文件的脚本；
-   `lib.rs` 中引入了 `build.rs` 编译 proto 后生成的 rs 文件；
-   `bin` 目录下定义了客户端、服务端的实现；

首先创建一个 lib 项目：

```bash
cargo new tonic-demo --lib
```

在这个 lib 中我们实现服务代码，并通过 `bin` 目录下的 `client` 和 `server` 实现客户端和服务端；

修改 Cargo 配置：

Cargo.toml

```toml
[[bin]]
name="server"
path="src/bin/server.rs"

[[bin]]
name="client"
path="src/bin/client.rs"

[dependencies]
prost = "0.11.3"
tokio = { version = "1.19.2", features = ["macros", "rt-multi-thread"] }
tonic = "0.8.3"

[build-dependencies]
tonic-build = "0.8.4"
```

<br/>

## **定义服务**

创建 proto 目录，并声明相应的服务；

由于网上的资料大多都是一个 proto 文件，而实际项目中基本上都是具有层级结构的；

因此这里我也使用了多个 proto 文件来演示；

定义如下：

```protobuf
// tonic-demo/proto/basic/basic.proto
syntax = "proto3";

package basic;

message BaseResponse {
  string message = 1;
  int32 code = 2;
}

// tonic-demo/proto/hello.proto
syntax = "proto3";

import "basic/basic.proto";

package hello;

service Hello {
  rpc Hello(HelloRequest) returns (HelloResponse) {}
}

message HelloRequest {
  string name = 1;
}

message HelloResponse {
  string data = 1;
  basic.BaseResponse message = 2;
}

// tonic-demo/proto/goodbye.proto
syntax = "proto3";

import "basic/basic.proto";

package goodbye;

service Goodbye {
  rpc Goodbye(GoodbyeRequest) returns (GoodbyeResponse) {}
}

message GoodbyeRequest {
  string name = 1;
}

message GoodbyeResponse {
  string data = 1;
  basic.BaseResponse message = 2;
}
```

在 `proto/basic` 目录下定义了：`BaseResponse`；

而在 `hello.proto` 和 `goodbye.proto` 中都引入了他；

<br/>

## **配置编译**

下面来看 build.rs，这也是编译 protobuf 文件的关键！

众所周知，在 `build.rs` 中定义的代码，会在真正编译项目代码前被执行，用于在编译真正的项目前做一些骚操作；

因此，我们可以在这里先编译 protobuf 文件；

在上面 Cargo 配置中我们引入了：

```toml
[build-dependencies]
tonic-build = "0.8.4"
```

因此在这里被使用：

build.rs

```rust
use std::error::Error;
use std::fs;

static OUT_DIR: &str = "src/proto-gen";

fn main() -> Result<(), Box<dyn Error>> {
    let protos = [
        "proto/basic/basic.proto",
        "proto/hello.proto",
        "proto/goodbye.proto",
    ];

    fs::create_dir_all(OUT_DIR).unwrap();
    tonic_build::configure()
        .build_server(true)
        .out_dir(OUT_DIR)
        .compile(&protos, &["proto/"])?;

    rerun(&protos);

    Ok(())
}

fn rerun(proto_files: &[&str]) {
    for proto_file in proto_files {
        println!("cargo:rerun-if-changed={}", proto_file);
    }
}
```

首先，声明了我们要编译的 proto 文件，随后创建 proto 文件编译后的输出位置（默认在 `target/build` 目录下）；

最后，使用 `tonic_build` 编译了 server 端的文件；

项目编译后，被编译的 proto 文件会输出至我们定义好的 `src/proto-gen` 下；

tonic-demo/src/proto-gen/basic.rs

```rust
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct BaseResponse {
    #[prost(string, tag = "1")]
    pub message: ::prost::alloc::string::String,
    #[prost(int32, tag = "2")]
    pub code: i32,
}
```

tonic-demo/src/proto-gen/hello.rs

```rust
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct HelloRequest {
    #[prost(string, tag = "1")]
    pub name: ::prost::alloc::string::String,
}
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct HelloResponse {
    #[prost(string, tag = "1")]
    pub data: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "2")]
    pub message: ::core::option::Option<super::basic::BaseResponse>,
}
/// Generated client implementations.
pub mod hello_client {
    #![allow(unused_variables, dead_code, missing_docs, clippy::let_unit_value)]
    use tonic::codegen::*;
    use tonic::codegen::http::Uri;
    #[derive(Debug, Clone)]
    pub struct HelloClient<T> {
        inner: tonic::client::Grpc<T>,
    }
    impl HelloClient<tonic::transport::Channel> {
        /// Attempt to create a new client by connecting to a given endpoint.
        pub async fn connect<D>(dst: D) -> Result<Self, tonic::transport::Error>
        where
            D: std::convert::TryInto<tonic::transport::Endpoint>,
            D::Error: Into<StdError>,
        {
            let conn = tonic::transport::Endpoint::new(dst)?.connect().await?;
            Ok(Self::new(conn))
        }
    }
    impl<T> HelloClient<T>
    where
        T: tonic::client::GrpcService<tonic::body::BoxBody>,
        T::Error: Into<StdError>,
        T::ResponseBody: Body<Data = Bytes> + Send + 'static,
        <T::ResponseBody as Body>::Error: Into<StdError> + Send,
    {
        pub fn new(inner: T) -> Self {
            let inner = tonic::client::Grpc::new(inner);
            Self { inner }
        }
        pub fn with_origin(inner: T, origin: Uri) -> Self {
            let inner = tonic::client::Grpc::with_origin(inner, origin);
            Self { inner }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> HelloClient<InterceptedService<T, F>>
        where
            F: tonic::service::Interceptor,
            T::ResponseBody: Default,
            T: tonic::codegen::Service<
                http::Request<tonic::body::BoxBody>,
                Response = http::Response<
                    <T as tonic::client::GrpcService<tonic::body::BoxBody>>::ResponseBody,
                >,
            >,
            <T as tonic::codegen::Service<
                http::Request<tonic::body::BoxBody>,
            >>::Error: Into<StdError> + Send + Sync,
        {
            HelloClient::new(InterceptedService::new(inner, interceptor))
        }
        /// Compress requests with the given encoding.
        ///
        /// This requires the server to support it otherwise it might respond with an
        /// error.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.send_compressed(encoding);
            self
        }
        /// Enable decompressing responses.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.accept_compressed(encoding);
            self
        }
        pub async fn hello(
            &mut self,
            request: impl tonic::IntoRequest<super::HelloRequest>,
        ) -> Result<tonic::Response<super::HelloResponse>, tonic::Status> {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::new(
                        tonic::Code::Unknown,
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic::codec::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static("/hello.Hello/Hello");
            self.inner.unary(request.into_request(), path, codec).await
        }
    }
}
/// Generated server implementations.
pub mod hello_server {
    #![allow(unused_variables, dead_code, missing_docs, clippy::let_unit_value)]
    use tonic::codegen::*;
    /// Generated trait containing gRPC methods that should be implemented for use with HelloServer.
    #[async_trait]
    pub trait Hello: Send + Sync + 'static {
        async fn hello(
            &self,
            request: tonic::Request<super::HelloRequest>,
        ) -> Result<tonic::Response<super::HelloResponse>, tonic::Status>;
    }
    #[derive(Debug)]
    pub struct HelloServer<T: Hello> {
        inner: _Inner<T>,
        accept_compression_encodings: EnabledCompressionEncodings,
        send_compression_encodings: EnabledCompressionEncodings,
    }
    struct _Inner<T>(Arc<T>);
    impl<T: Hello> HelloServer<T> {
        pub fn new(inner: T) -> Self {
            Self::from_arc(Arc::new(inner))
        }
        pub fn from_arc(inner: Arc<T>) -> Self {
            let inner = _Inner(inner);
            Self {
                inner,
                accept_compression_encodings: Default::default(),
                send_compression_encodings: Default::default(),
            }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> InterceptedService<Self, F>
        where
            F: tonic::service::Interceptor,
        {
            InterceptedService::new(Self::new(inner), interceptor)
        }
        /// Enable decompressing requests with the given encoding.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.accept_compression_encodings.enable(encoding);
            self
        }
        /// Compress responses with the given encoding, if the client supports it.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.send_compression_encodings.enable(encoding);
            self
        }
    }
    impl<T, B> tonic::codegen::Service<http::Request<B>> for HelloServer<T>
    where
        T: Hello,
        B: Body + Send + 'static,
        B::Error: Into<StdError> + Send + 'static,
    {
        type Response = http::Response<tonic::body::BoxBody>;
        type Error = std::convert::Infallible;
        type Future = BoxFuture<Self::Response, Self::Error>;
        fn poll_ready(
            &mut self,
            _cx: &mut Context<'_>,
        ) -> Poll<Result<(), Self::Error>> {
            Poll::Ready(Ok(()))
        }
        fn call(&mut self, req: http::Request<B>) -> Self::Future {
            let inner = self.inner.clone();
            match req.uri().path() {
                "/hello.Hello/Hello" => {
                    #[allow(non_camel_case_types)]
                    struct HelloSvc<T: Hello>(pub Arc<T>);
                    impl<T: Hello> tonic::server::UnaryService<super::HelloRequest>
                    for HelloSvc<T> {
                        type Response = super::HelloResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::HelloRequest>,
                        ) -> Self::Future {
                            let inner = self.0.clone();
                            let fut = async move { (*inner).hello(request).await };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let inner = inner.0;
                        let method = HelloSvc(inner);
                        let codec = tonic::codec::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                _ => {
                    Box::pin(async move {
                        Ok(
                            http::Response::builder()
                                .status(200)
                                .header("grpc-status", "12")
                                .header("content-type", "application/grpc")
                                .body(empty_body())
                                .unwrap(),
                        )
                    })
                }
            }
        }
    }
    impl<T: Hello> Clone for HelloServer<T> {
        fn clone(&self) -> Self {
            let inner = self.inner.clone();
            Self {
                inner,
                accept_compression_encodings: self.accept_compression_encodings,
                send_compression_encodings: self.send_compression_encodings,
            }
        }
    }
    impl<T: Hello> Clone for _Inner<T> {
        fn clone(&self) -> Self {
            Self(self.0.clone())
        }
    }
    impl<T: std::fmt::Debug> std::fmt::Debug for _Inner<T> {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "{:?}", self.0)
        }
    }
    impl<T: Hello> tonic::server::NamedService for HelloServer<T> {
        const NAME: &'static str = "hello.Hello";
    }
}
```

需要注意的是：

为客户端生成的`HelloClient`类型：

-   **实现了Clone、Sync以及Send，因此可以跨线程使用；**

为服务端生成的 `HelloServer`类型：

-   **包含 `impl<T: Hello>`，因此要求必须实现我们定义的 Hello Trait；**

<br/>

## **引入proto生成的文件**

下面我们在 `lib.rs` 中引入 ptoroc 生成的文件：

lib.rs

```rust
pub mod basic {
    include!("./proto-gen/basic.rs");
}

pub mod hello {
    include!("./proto-gen/hello.rs");
}

pub mod goodbye {
    include!("./proto-gen/goodbye.rs");
}
```

这里使用了标准库提供的 `include!` 将文件引入；

如果你没有定义 proto 文件编译后的输出位置，则默认在 `target/build` 目录下；

**此时也可以使用 tonic 提供的 `include_proto!("hello")` 宏，直接引入对应文件而不用额外制定路径了；**

参考官方文档：

-   https://docs.rs/tonic/latest/tonic/macro.include_proto.html

<br/>

## **服务端实现**

下面来实现服务端；

服务端的实现和其他语言基本类似，为对应 proto 定义的 Service 创建相应的 Service 实现即可：

tonic-demo/src/bin/server.rs

```rust
#[derive(Default)]
pub struct HelloService {}

#[tonic::async_trait]
impl Hello for HelloService {
    async fn hello(&self, req: Request<HelloRequest>) -> Result<Response<HelloResponse>, Status> {
        println!("hello receive request: {:?}", req);

        let response = HelloResponse {
            data: format!("Hello, {}", req.into_inner().name),
            message: Some(BaseResponse {
                message: "Ok".to_string(),
                code: 200,
            }),
        };
        Ok(Response::new(response))
    }
}

#[derive(Default)]
pub struct GoodbyeService {}

#[tonic::async_trait]
impl Goodbye for GoodbyeService {
    async fn goodbye(
        &self,
        req: Request<GoodbyeRequest>,
    ) -> Result<Response<GoodbyeResponse>, Status> {
        println!("goodbye receive request: {:?}", req);

        let response = GoodbyeResponse {
            data: format!("Goodbye, {}", req.into_inner().name),
            message: Some(BaseResponse {
                message: "Ok".to_string(),
                code: 200,
            }),
        };
        Ok(Response::new(response))
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let addr = "0.0.0.0:50051".parse()?;

    println!("server starting at: {}", addr);

    Server::builder()
        .add_service(HelloServer::new(HelloService::default()))
        .add_service(GoodbyeServer::new(GoodbyeService::default()))
        .serve(addr)
        .await?;

    Ok(())
}
```

在对应的 Trait 中实现接口的相应逻辑，最后在 main 中注册 Service 即可，逻辑非常清晰；

<br/>

## **客户端实现**

客户端的实现就更加的简单了，首先通过地址创建 Endpoint 连接，随后直接调用对应函数即可：

tonic-demo/src/bin/client.rs

```rust
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let addr = Endpoint::from_static("https://127.0.0.1:50051");

    let mut hello_cli = HelloClient::connect(addr.clone()).await?;
    let request = Request::new(HelloRequest {
        name: "tonic".to_string(),
    });
    let response = hello_cli.hello(request).await?;
    println!("hello response: {:?}", response.into_inner());

    let mut goodbye_cli = GoodbyeClient::connect(addr).await?;
    let request = Request::new(GoodbyeRequest {
        name: "tonic".to_string(),
    });
    let response = goodbye_cli.goodbye(request).await?;
    println!("goodbye response: {:?}", response.into_inner());

    Ok(())
}
```

是不是非常的简单；

<br/>

## **测试**

下面来测试一下，首先启动服务端：

```bash
$ cargo run --bin server             

server starting at: 0.0.0.0:50051
```

再启动客户端：

```bash
$ cargo run --bin client     

hello response: HelloResponse { data: "Hello, tonic", message: Some(BaseResponse { message: "Ok", code: 200 }) }
goodbye response: GoodbyeResponse { data: "Goodbye, tonic", message: Some(BaseResponse { message: "Ok", code: 200 }) }
```

客户端收到响应，并且服务端打出日志：

```
hello receive request: Request { metadata: MetadataMap { headers: {"te": "trailers", "content-type": "application/grpc", "user-agent": "tonic/0.8.3"} }, message: HelloRequest { name: "tonic" }, extensions: Extensions }
goodbye receive request: Request { metadata: MetadataMap { headers: {"te": "trailers", "content-type": "application/grpc", "user-agent": "tonic/0.8.3"} }, message: GoodbyeRequest { name: "tonic" }, extensions: Extensions }
```

**在 Github Action 中需要添加步骤：**

```yaml
- name: Install protoc
	run: sudo apt-get install -y protobuf-compiler
```

**安装 protoc；**

参考代码：

-   https://github.com/JasonkayZK/rust-learn/blob/grpc/.github/workflows/ci.yaml

<br/>

## **总结**

可以看到，相比于其他语言来说，在 Rust 中使用 grpc 更加的简单，甚至不需要额外的去编写 protoc 生成的 shell 脚本，而是通过 build.rs 更加优雅的实现了！

更多tonic使用方法：

-   tonic官方给的示例，例如流式(Stream)的grpc、负载均衡、带tls证书验证等：https://github.com/hyperium/tonic/tree/master/examples
-   编写流式grpc，建议看：https://github.com/hyperium/tonic/blob/master/examples/routeguide-tutorial.md

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/rust-learn/tree/grpc

开源库：

-   https://github.com/tokio-rs/prost
-   https://github.com/hyperium/tonic

参考文章：

-   https://cn.pingcap.com/blog/grpc
-   https://cn.pingcap.com/blog/grpc-rs
-   https://www.pingcap.com/blog/futures-and-grpc-in-rust/
-   https://rustcc.cn/article?id=21934c4e-60eb-4796-80c2-70c4733032e1
-   https://rust-book.junmajinlong.com/ch101/02_Protobuf_tonic.html
-   https://medium.com/geekculture/quick-start-to-grpc-using-rust-c655785fc6f4


<br/>
