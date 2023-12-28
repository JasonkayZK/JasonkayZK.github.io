---
title: Rust中使用libp2p
toc: true
cover: 'https://img.paulzzh.com/touhou/random?99'
date: 2023-12-27 22:12:07
categories: Rust
tags: [Rust, P2P, libp2p]
description: 在个人数据日益被侵犯的现在，P2P技术变得越来越重要；本文通过编写一个实例，讲解了P2P中的一些概念，以及如何使用libp2p来进行点对点应用的开发！
---

在个人数据日益被侵犯的现在，P2P技术变得越来越重要；

本文通过编写一个实例，讲解了P2P中的一些概念，以及如何使用libp2p来进行点对点应用的开发！

源代码：

-   https://github.com/JasonkayZK/rust-learn/tree/proj/p2p-demo

<br/>

<!--more-->

# **Rust中使用libp2p**

## **P2P 概述**

### **P2P 简介**

-   P2P：peer-to-peer
-   P2P 是一种网络技术，可以在不同的计算机之间共享各种计算资源，如 CPU、网络带宽和存储。
-   P2P 是当今用户在线共享文件（如音乐、图像和其他数字媒体）的一种非常常用的方法。
    -   Bittorrent 和 Gnutella 是流行的文件共享 p2p 应用程序的例子。以及比特币和以太坊等区块链网络。
    -   它们不依赖中央服务器或中介来连接多个客户端。
    -   最重要的是，它们利用用户的计算机作为客户端和服务器，从而将计算从中央服务器上卸载下来。
-   传统的分布式系统使用 Client-Server 范式来部署
-   P2P 是另一种分布式系统
    -   在 P2P 中，一组节点（或对等点，Peer）彼此直接交互以共同提供公共服务，而无需中央协调器或管理员
    -   P2P 系统中的每个节点（或 Peer）都可以充当客户端（从其他节点请求信息）和服务器（存储/检索数据并响应客户端请求执行必要的计算）。
    -   P2P 网络中的所有节点不必完全相同，一个关键特征将 Client-Server 网络与 P2P 网络区分开来：缺乏具有唯一权限的专用服务器。在开放、无许可的 P2P 网络中，任何节点都可以决定提供与 P2P 节点相关的全部或部分服务集。

<br/>

### P2P 的特点

-   与 Client-Server 网络相比，P2P 网络能够在其上构建不同类别的应用程序，这些应用程序是无许可、容错和抗审查的。
    -   无许可：因为数据和状态是跨多个节点复制的，所以没有服务器可以切断客户机对信息的访问。
    -   容错性：因为没有单点故障，例如中央服务器。
    -   抗审查：如区块链等网络。
    -   P2P 计算还可以更好地利用资源。

<br/>

### P2P 的复杂性

-   构建 P2P 系统要比传统 Client-Server 的系统复杂
    -   传输：P2P 网络中的每个 Peer 都可以使用不同的协议，例如HTTP(s)、TCP、UDP等。
    -   身份：每个 Peer 都需要知道其想要连接并发送消息的 Peer 的身份。
    -   安全性：每个 Peer 都应该能够以安全的方式与其他 Peer 通信，而不存在第三方拦截或修改消息的风险等。
    -   路由：每个 Peer 可以通过各种路由（例如数据包在 IP 协议中的分布方式）从其他 Peer 接收消息，这意味着如果消息不是针对自身的，则每个 Peer 都应该能够将消息路由到其他 Peer。
    -   消息传递：P2P 网络应该能够发送点对点消息或组消息（以发布/订阅模式）。

<br/>

### P2P 的要求

#### **传输**

-   TCP/IP 和 UDP 协议无处不在，在编写网络应用程序时非常流行。但还有其他更高级别的协议，如 HTTP（TCP上分层）和 QUIC（UDP上分层）。
-   P2P 网络中的每个 Peer 都应该能够启动到另一个节点的连接，并且由于网络中 peer 的多样性，能够通过多个协议监听传入的连接。

#### **Peer 身份**

-   与 web 开发领域不同，在 web 开发领域中，服务器由唯一的域名标识（例如 www.rust-lang.org，然后使用域名服务将其解析为服务器的IP地址）
-   P2P 网络中的节点需要唯一身份，以便其他节点可以访问它们。
-   P2P 网络中的节点使用公钥和私钥对（非对称公钥加密）与其他节点建立通信。
    -   P2P 网络中的节点的身份称为 PeerId，是节点公钥的加密散列。

#### **安全**

-   加密密钥对和 PeerId 使节点能够与它的 peers 建立安全、经过身份验证的通信通道。但这只是安全的一个方面。
-   节点还需要实现授权框架，该框架为哪个节点可以执行何种操作建立规则。
-   还有需要解决的网络级安全威胁，如 sybil 攻击（其中一个节点运营商利用不同身份启动大量节点，以获得网络中的优势地位）或 eclipse 攻击（其中一组恶意节点共谋以特定节点为目标，使后者无法到达任何合法节点）。

#### **Peer 路由**

-   P2P 网络中的节点首先需要找到其他 peer 才能进行通信。这是通过维护 peer 路由表来实现的，该表包含对网络中其他 peer 的引用。
-   但是，在具有数千个或更多动态变化的节点（即节点加入和离开网络）的 P2P 网络中，任何单个节点都难以为网络中的所有节点维护完整而准确的路由表。Peer 路由使节点能够将不是给自己准备的消息路由到目标节点。

#### **消息**

-   P2P 网络中的节点可以向特定节点发送消息，但也可以参与广播消息协议。
    -   例如，发布/订阅，其中节点注册对特定主题的兴趣（订阅），发送该主题消息的任何节点（发布）都由订阅该主题的所有节点接收。这种技术通常用于将消息的内容传输到整个网络。

#### **流多路复用**

-   流多路复用（Stream multiplexing）是通过公共通信链路发送多个信息流的一种方法。
-   在 P2P 的情况下，它允许多个独立的“逻辑”流共享一个公共 P2P 传输层。
    -   当考虑到一个节点与不同 peers 具有多个通信流的可能性，或者两个远程节点之间也可能存在多个并发连接的可能性时，这一点变得很重要。
    -   流多路复用有助于优化 peer 之间建立连接的开销。

>   <font color="#f00">**注意：多路复用在后端服务开发中很常见，其中客户端可以与服务器建立底层网络连接，然后通过底层网络连接多路复用不同的流（每个流具有唯一的端口号）**</font>

<br/>

## **Libp2p概述**

libp2p 是一个由协议、规范和库组成的模块化系统，它支持 P2P 应用程序的开发；

它目前支持三种语言：JS、Go、Rust、JVM（Kotlin编写），未来将支持 Haskell、Python等；

它被许多流行的项目使用，例如：IPFS、Filecoin 和 Polkadot 等；

>   <font color="#f00">**由于目前 rust-libp2p 每次更新版本时， API 的变化都比较大！**</font>
>
>   <font color="#f00">**所以在使用时需要参考 CHANGELOG 来进行代码迁移！**</font>
>
>   **例如，Swarm 参考：**
>
>   -   https://github.com/libp2p/rust-libp2p/blob/4fc911e6b39f8b2f097583fb60178948ae368528/swarm/CHANGELOG.md

<br/>

### **Libp2p 主要模块**

-   传输（Transport）：负责从一个 peer 到另一个 peer 的数据的实际传输和接收
-   身份（Identity）：libp2p 使用公钥密钥（PKI）作为 peer 节点身份的基础。使用加密算法为每个节点生成唯一的 peer id。
-   安全（Security）：节点使用其私钥对消息进行签名。节点之间的传输连接可以升级为安全的加密通道，以便远程 peer 可以相互信任，并且没有第三方可以拦截它们之间的通信。
-   Peer 发现（Peer Discovery）：允许 peer 在 libp2p 网络中查找并相互通信。
-   Peer 路由（Peer Routing）：使用其他 peer 的知识信息来实现与 peer 节点的通信。
-   内容发现（Content Discovery）：在不知道哪个 peer 节点拥有该内容的情况下，允许 peer 节点从其他 peer 节点获取部分内容。
-   消息（Messaging）：其中发布/订阅：允许向对某个主题感兴趣的一组 peer 发送消息。

<br/>

### P2P 节点的身份

P2P Node

PeerId: 12d3k.....

<br/>

### 公钥和私钥

-   加密身份使用公钥基础设施（PKI），广泛用于为用户、设备和应用程序提供唯一身份，并保护端到端通信的安全。
-   它的工作原理是创建两个不同的加密密钥，也称为由私钥和公钥组成的密钥对，它们之间具有数学关系。
-   密钥对有着广泛的应用，但在 P2P 网络中
    -   节点使用密钥对彼此进行身份识别和身份验证。
    -   公钥可以在网络中与其他人共享，但决不能泄漏节点的私钥。

>   **公钥和私钥的例子 - 访问传统的服务器**
>
>   -   如果想连接到数据中心的远程服务器（使用SSH），用户可以生成密钥对并在远程服务器上配置公钥，从而授予用户访问权限。
>   -   但远程服务器如何知道哪个用户是该公钥的所有者？
>       -   为了实现这一点，当连接（通过SSH）到远程服务器时，用户必须指定私钥（与存储在服务器上的公钥关联的）。
>       -   私钥从不发送到远程服务器，但SSH客户端（在本地服务器上运行）使用用户的私钥向远程SSH服务器进行身份验证。

<br/>

### **多地址（Multiaddresses）**

-   在 libp2p 中，peer 的身份在其整个生命周期内都是稳定且可验证的。
-   但 libp2p 区分了 peer 的身份和位置。
    -   peer 的身份是 peer id。
-   peer 的位置是可以到达对方的网络地址。
    -   例如，可以通过 TCP、websockets、QUIC 或任何其他协议访问 peer。
    -   libp2p 将这些网络地址编码成一个自描述格式，它叫做 multiaddress（multiaddr）。
    -   因此，在 libp2p中，multiaddress 表示 peer 的位置。

-   当 p2p 网络上的节点共享其联系信息时，它们会发送一个保护网络地址和 peer id 的多地址（multiaddress）。
-   节点多地址的 peer id 表示如下：
    -   **/p2p/12D3KooWBu3fmjZgSmLkQ2p...**
-   多地址的网络地址表示如下：
    -   **/ip4/192.158.1.23/tcp/1234**
-   节点的完整地址就是 peer id 和网络地址的组合：
    -   **/ip4/192.158.1.23/tcp/1234/p2p/12D3KooWBu3fmjZgSmLkQ2p...**

<br/>

### **Swarm概述**

Swarm 是 libp2p 中给定 P2P 节点内的网络管理器模块；

它维护从给定节点到远程节点的所有活动和挂起连接，并管理已打开的所有子流的状态；

#### **Swarm 的结构和上下文环境**

Swarm 代表了一个低级接口，并提供了对 libp2p 网络的细粒度控制。Swarm 是使用传输、网络行为和节点 peer id 的组合构建的。

传输（Transport）会指明如何在网络上发送字节，而网络行为（Behaviour）会指明发送什么字节，发送给谁。

多个网络行为可以与单个运行节点相关联。

>   **需要注意的是：同一套客户端和服务端代码在 libp2p 网络的所有节点上运行，即每个Node即是客户端又是服务端；**
>
>   **这与客户端和服务器具有不同代码库的 Client-Server 模型不同；**

<br/>

### 发现 peer

mDNS 是由 RFC 6762（datatracker.ietf.org/doc/html/rfc6762）定义的协议，它将主机名解析为 IP 地址。

在 libp2p 中，mDNS 用于发现网络上的其他节点。

在 libp2p 中实现的网络行为 mDNS 将自动发现本地网络上的其他 libp2p 节点。

>   详见：
>
>   -   https://datatracker.ietf.org/doc/html/rfc6762

<br/>

## **rust-libp2p实践**

上面介绍了关于 P2P 和 libp2p 中的一些概念；

**最主要的是：Peer、非对称加密、Transport、Behaviour 以及 Swarm 的概念；**

下面我们将使用 [rust-libp2p](https://github.com/libp2p/rust-libp2p/) 来创建一个点对点的应用；

>   **注意：**
>
>   <font color="#f00">**由于 [rust-libp2p](https://github.com/libp2p/rust-libp2p/) 的 API 变化较大，这里我们采用的是目前最新的版本：`0.52`；**</font>
>
>   <font color="#f00">**该版本要求最低的 Rust 版本为 `1.71.0`，可能需要使用 `rustup update stable` 更新**！</font>

接下来我们会创建一个简单的关于菜谱的应用：

用户可以：

-   列出当前和本机连接的所有对等点：`ls p`
-   创建菜谱（默认情况下不分享）：`create r recipe_name|recipe_ingredients|recipe_instruction`
-   发布菜谱来对他人分享：`publish r recipe_id`
-   列出本地菜谱：`ls r`
-   列出其他所有对等点分享的菜谱：`ls r all`
-   列出某个对等点分享的菜谱：`ls r 12D...(PeerId)`

<br/>

### **创建项目**

使用 cargo 创建一个项目，增加依赖：

```toml
[dependencies]
libp2p = { version = "0.52", features = ["tokio", "floodsub", "noise", "tcp", "yamux", "mdns", "macros", "identify"] }
tokio = { version = "1", features = ["io-util", "io-std", "macros", "rt", "rt-multi-thread", "fs", "time", "sync"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
once_cell = "1.5"
log = "0.4"
pretty_env_logger = "0.4"
anyhow = "1.0.77"
```

-   libp2p 和 tokio 分别提供了 p2p 和 async 支持；
-   serde、serde_json 完成了 json 序列化；
-   once_cell 用来初始化全局变量；
-   log、pretty_env_logger 打印日志；
-   anyhow 提供错误处理；

<br/>

### **全局变量**

前面提到，p2p 中使用非对称加密来确定一个 PeerId，这里我们使用全局变量来定义一个全局唯一的 PeerId：

src/consts.rs

```rust
pub const STORAGE_FILE_PATH: &str = "./recipes.json";

/// Key pair enables us to communicate securely with the rest of the network, making sure no one can impersonate
pub static KEYS: Lazy<identity::Keypair> = Lazy::new(identity::Keypair::generate_ed25519);

/// A unique identifier for a specific peer within the whole peer to peer network
///
/// Derive from a key pair to ensure its uniqueness
pub static PEER_ID: Lazy<PeerId> = Lazy::new(|| PeerId::from(KEYS.public()));

/// A Topic is a concept from Floodsub, which is an implementation of libp2p’s pub/sub interface
pub static TOPIC: Lazy<Topic> = Lazy::new(|| Topic::new("recipes"));
```

说明：

-   `STORAGE_FILE_PATH`：本地菜谱存储路径；
-   `KEYS`：非对称加密密钥对；
-   `PEER_ID`：通过密钥对生成的 PeerId；
-   `TOPIC`：在 Floodsub 模式中，对等节点可以订阅的 Topic，类似于 PubSub 模式；

<br/>

### **模型定义**

接下来定义几个结构体类型；

存储菜谱信息 Recipe：

src/models.rs

```rust
/// The recipe data for cook
#[derive(Debug, Serialize, Deserialize)]
pub struct Recipe {
    pub id: usize,
    pub name: String,
    pub ingredients: String,
    pub instructions: String,
    pub shared: bool,
}
```

列出菜谱的模式（全部、根据 PeerId）：

src/models.rs

```rust
/// Fetch data mode
#[derive(Debug, Serialize, Deserialize)]
pub enum ListMode {
    /// Fetch from all peers
    All,

    /// Fetch from one specific peer
    One(String),
}
```

列出菜谱的请求、响应：

src/models.rs

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct ListRequest {
    pub mode: ListMode,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ListResponse {
    pub mode: ListMode,
    pub data: Vec<Recipe>,
    pub receiver: String,
}
```

Tokio select 事件枚举（后面会用到）：

src/models.rs

```rust
pub enum EventType {
    Response(ListResponse),
    Input(String),
}
```

<br/>

### **创建并启动一个 Swarm**

前面介绍了 Swarm 的概念，Swarm 是一个管理器，管理所有节点的活动、挂起、连接等等；

在创建一个 Swarm 时大概要配置以下几个内容：

-   **身份验证（Identity）**：身份验证的密钥对（KeyPair）；
-   **运行时环境（Runtime）**：例如 tokio、async_std 等；
-   **连接类型（Transport）**：TCP、UDP，以及连接对应的配置：超时时间、连接验证、多路复用等；
-   **网络行为（NetworkBehaviour）**：网络连接的类型，非常重要的概念，用于定义对等点之间网络行为，例如：FloodSub、mDNS 以及自定义 NetworkBehaviour；
-   **Swarm 自身配置**：Executor 线程池创建、管理等；

下面就创建了一个 Swarm：

src/main.rs

```rust
let mut swarm = libp2p::SwarmBuilder::with_existing_identity(KEYS.clone())
  .with_tokio()
  .with_tcp(
    tcp::Config::default(),
    noise::Config::new,
    yamux::Config::default,
  )?
  .with_behaviour(|_key| RecipeBehaviour {
    flood_sub: Floodsub::new(*PEER_ID),
    mdns: mdns::tokio::Behaviour::new(mdns::Config::default(), KEYS.public().to_peer_id())
    .expect("can create mdns"),
  })?
  .with_swarm_config(|cfg| cfg.with_idle_connection_timeout(Duration::from_secs(5)))
  .build();
```

创建 Swarm 的部分：

-   `with_existing_identity`：指定了密钥对；
-   `with_tokio`：指定了异步运行时为 tokio；
-   `with_tcp`：使用 TCP 为 Transport；
    -   `tcp_config: libp2p_tcp::Config`：TCP 配置，例如连接超时时间等；
    -   `security_upgrade: SecUpgrade`：TCP 安全连接配置，这里使用 noise 握手，即使用密钥对的方式；
    -   `multiplexer_upgrade: MuxUpgrade`：连接多路复用配置，这里使用 yamux；
-   `with_behaviour`：该 Swarm 网络行为定义，这里为自定义的 RecipeBehaviour，后文会介绍；
-   `with_swarm_config：Swarm` 自身配置，这里作为实验，配置了闲置超时时间为 5s；

通过 `listen_on` 即可启动监听：

src/main.rs

```rust
Swarm::listen_on(
        &mut swarm,
        "/ip4/0.0.0.0/tcp/0"
            .parse()
            .expect("can get a local socket"),
    )
    .expect("swarm can be started");
```

**监听 IPV4 下任意 IP 来源（`0.0.0.0`）的连接，并且监听端口由系统分配（端口号为0）；**

此外，这里我们还启动了 Swarm 中定义的 FloodSub 对我们 Topic 的监听：

src/main.rs

```rust
swarm.behaviour_mut().flood_sub.subscribe(TOPIC.clone());
```

<br/>

### **定义网络行为 NetworkBehaviour**

在上一小节创建 Swarm 时，我们使用了 RecipeBehaviour 我们自定义的行为；

下面我们来看是如何定义的：

src/behaviour.rs

```rust
#[derive(NetworkBehaviour)]
#[behaviour(to_swarm = "RecipeBehaviourEvent")]
pub struct RecipeBehaviour {
    pub(crate) flood_sub: Floodsub,
    pub(crate) mdns: mdns::tokio::Behaviour,
}

#[derive(Debug)]
pub enum RecipeBehaviourEvent {
    Floodsub(FloodsubEvent),
    Mdns(mdns::Event),
}

impl From<FloodsubEvent> for RecipeBehaviourEvent {
    fn from(event: FloodsubEvent) -> RecipeBehaviourEvent {
        RecipeBehaviourEvent::Floodsub(event)
    }
}

impl From<mdns::Event> for RecipeBehaviourEvent {
    fn from(event: mdns::Event) -> RecipeBehaviourEvent {
        RecipeBehaviourEvent::Mdns(event)
    }
}
```

首先是 RecipeBehaviour 结构体，其中包括了 FloodSub 和 mDNS 两个 Behaviour；

分别处理了：消息广播和节点自动发现；

<font color="#f00">**需要注意的是：RecipeBehaviour 结构体使用 `#[derive(NetworkBehaviour)]` 标识；**</font>

<font color="#f00">**此宏会自动实现部分逻辑，同时要求被标注的结构体只能含有实现了 NetworkBehaviour 的属性！**</font>

>   <font color="#f00">**注意：之前可以在 NetworkBehaviour 结构体中使用 `#[behaviour(ignore)]` 的方式被废弃！**</font>
>
>   **见：**
>
>   -   https://github.com/libp2p/rust-libp2p/blob/4fc911e6b39f8b2f097583fb60178948ae368528/swarm/CHANGELOG.md#0380

<font color="#f00">**同时，BehaviourEvent 的定义被抽取到了枚举中，通过 `#[behaviour(to_swarm = "RecipeBehaviourEvent")]` 来声明；**</font>

<font color="#f00">**后面可以看到，我们通过将 RecipeBehaviour 中定义的行为产生的事件统一使用 From Trait 转换为RecipeBehaviourEvent 来统一处理；**</font>

<font color="#f00">**这也是最新 rust-libp2p 官方推荐的方式！**</font>

<br/>

### **处理输入请求**

在前面我们定义了我们应用允许用户操作的一些行为，用户可以：

-   列出当前和本机连接的所有对等点：`ls p`
-   创建菜谱（默认情况下不分享）：`create r recipe_name|recipe_ingredients|recipe_instruction`
-   发布菜谱来对他人分享：`publish r recipe_id`
-   列出本地菜谱：`ls r`
-   列出其他所有对等点分享的菜谱：`ls r all`
-   列出某个对等点分享的菜谱：`ls r 12D...(PeerId)`

下面我们来简单实现：

src/main.rs

```rust
let (response_sender, mut response_rcv) = mpsc::unbounded_channel();
let mut stdin = tokio::io::BufReader::new(tokio::io::stdin()).lines();
loop {
  let evt = {
    tokio::select! {
      line = stdin.next_line() => Some(EventType::Input(line.expect("can get line").expect("can read line from stdin"))),
      response = response_rcv.recv() => Some(EventType::Response(response.expect("response exists"))),
      _ = handle_swarm_event(response_sender.clone(), &mut swarm) => None,
    }
  };

  if let Some(event) = evt {
    match event {
      EventType::Response(resp) => {
        let json = serde_json::to_string(&resp).expect("can jsonify response");
        swarm
        .behaviour_mut()
        .flood_sub
        .publish(TOPIC.clone(), json.as_bytes());
      }
      EventType::Input(line) => match line.as_str() {
        "ls p" => handle_list_peers(&mut swarm).await,
        cmd if cmd.starts_with("create r") => handle_create_recipe(cmd).await,
        cmd if cmd.starts_with("publish r") => handle_publish_recipe(cmd).await,
        cmd if cmd.starts_with("ls r") => handle_list_recipes(cmd, &mut swarm).await,
        _ => error!("unknown command: {:?}", line),
      },
    }
  }
}
```

为了简单实现，我们使用 StdIn 作为输入；

在 loop 无限循环中，我们使用 `tokio::select!` 来等待准备完成的事件：

-   `line`：用户完成了一行数据；
-   `response`：列表数据请求的响应；
-   处理到来的 Swarm 事件： handle_swarm_event；

上面的 select 最终会返回我们之前定义的 EventType 类型：

```rust
pub enum EventType {
  Input(String),
  Response(ListResponse),
}
```

对于 Input 的处理比较简单，直接对应我们之前对于用户的定义处理即可：

```rust
EventType::Input(line) => match line.as_str() {
  "ls p" => handle_list_peers(&mut swarm).await,
  cmd if cmd.starts_with("create r") => handle_create_recipe(cmd).await,
  cmd if cmd.starts_with("publish r") => handle_publish_recipe(cmd).await,
  cmd if cmd.starts_with("ls r") => handle_list_recipes(cmd, &mut swarm).await,
  _ => error!("unknown command: {:?}", line),
},
```

对于 Response 则是将结果广播给其他所有 Node：

```rust
EventType::Response(resp) => {
  let json = serde_json::to_string(&resp).expect("can jsonify response");
  swarm
  .behaviour_mut()
  .flood_sub
  .publish(TOPIC.clone(), json.as_bytes());
}
```

下面来看处理用户输入的逻辑；

<br/>

#### **列出全部对等点**

使用 `ls p` 列出所有目前已连接的对等点：

src/handlers.rs

```rust
pub async fn handle_list_peers(swarm: &mut Swarm<RecipeBehaviour>) {
    info!("Discovered Peers:");
    let nodes = swarm.behaviour().mdns.discovered_nodes();

    let mut unique_peers = HashSet::new();
    for peer in nodes {
        unique_peers.insert(peer);
    }
    unique_peers.iter().for_each(|p| info!("{}", p));
}
```

通过 swarm 可以获取到 mdns 中自动发现的节点；

逻辑非常简单，这里不再赘述；

<br/>

#### **创建Recipe**

使用 `create r recipe_name|recipe_ingredients|recipe_instruction` 创建一个新的 Recipe；

创建Recipe 只涉及到本地数据，不涉及 p2p 部分，逻辑比较简单：

src/handlers.rs

```rust
pub async fn handle_create_recipe(cmd: &str) {
  if let Some(rest) = cmd.strip_prefix("create r") {
    let elements: Vec<&str> = rest.split('|').collect();
    if elements.len() < 3 {
      info!("too few arguments - Format: name|ingredients|instructions");
    } else {
      let name = elements.first().expect("name is there");
      let ingredients = elements.get(1).expect("ingredients is there");
      let instructions = elements.get(2).expect("instructions is there");
      if let Err(e) = create_new_recipe(name, ingredients, instructions).await {
        error!("error creating recipe: {}", e);
      };
    }
  }
}

async fn create_new_recipe(name: &str, ingredients: &str, instructions: &str) -> Result<()> {
  let mut local_recipes = read_local_recipes().await?;
  let new_id = match local_recipes.iter().max_by_key(|r| r.id) {
    Some(v) => v.id + 1,
    None => 0,
  };
  local_recipes.push(Recipe {
    id: new_id,
    name: name.to_owned(),
    ingredients: ingredients.to_owned(),
    instructions: instructions.to_owned(),
    shared: false,
  });
  write_local_recipes(&local_recipes).await?;

  info!("Created recipe:");
  info!("Name: {}", name);
  info!("Ingredients: {}", ingredients);
  info!("Instructions:: {}", instructions);

  Ok(())
}

async fn write_local_recipes(recipes: &Vec<Recipe>) -> Result<()> {
  let json = serde_json::to_string(&recipes)?;
  fs::write(STORAGE_FILE_PATH, &json).await?;
  Ok(())
}

async fn read_local_recipes() -> Result<Vec<Recipe>> {
  let content = fs::read(STORAGE_FILE_PATH).await?;
  let result = serde_json::from_slice(&content)?;
  Ok(result)
}
```

逻辑比较简单，就是解析命令行传入的参数，创建结构体，先加载数据文件的数据，然后添加一条再写回文件；

>   **频繁读写文件的效率非常的低，这里只是作为例子演示简单实现！**

<br/>

#### **发布Recipe**

发布菜谱来对他人分享：`publish r recipe_id`

发布 Recipe 的逻辑也非常简单：

src/handlers.rs

```rust
pub async fn handle_publish_recipe(cmd: &str) {
  if let Some(rest) = cmd.strip_prefix("publish r") {
    match rest.trim().parse::<usize>() {
      Ok(id) => {
        if let Err(e) = publish_recipe(id).await {
          info!("error publishing recipe with id {}, {}", id, e)
        } else {
          info!("Published Recipe with id: {}", id);
        }
      }
      Err(e) => error!("invalid id: {}, {}", rest.trim(), e),
    };
  }
}

async fn publish_recipe(id: usize) -> Result<()> {
  let mut local_recipes = read_local_recipes().await?;
  local_recipes
  .iter_mut()
  .filter(|r| r.id == id)
  .for_each(|r| r.shared = true);
  write_local_recipes(&local_recipes).await?;
  Ok(())
}
```

首先解析命令行传入的Recipe Id，然后修改文件中对应 Id 的 shared 字段，改为 true；

>   **和创建Recipe类似，这里也会频繁读写文件，效率较低，仅作为展示例子；**

<br/>

### **查询菜谱（发送消息）**

查询菜谱比较复杂，可以通过下面三种形式：

-   列出本地菜谱：`ls r`
-   列出其他所有对等点分享的菜谱：`ls r all`
-   列出某个对等点分享的菜谱：`ls r 12D...(PeerId)`

下面来看实现：

src/handlers.rs

```rust
pub async fn handle_list_recipes(cmd: &str, swarm: &mut Swarm<RecipeBehaviour>) {
  let rest = cmd.strip_prefix("ls r ");
  match rest {
    Some("all") => {
      let req = ListRequest {
        mode: ListMode::All,
      };
      let json = serde_json::to_string(&req).expect("can jsonify request");
      swarm
      .behaviour_mut()
      .flood_sub
      .publish(TOPIC.clone(), json.as_bytes());
    }
    Some(recipes_peer_id) => {
      let req = ListRequest {
        mode: ListMode::One(recipes_peer_id.to_owned()),
      };
      let json = serde_json::to_string(&req).expect("can jsonify request");
      swarm
      .behaviour_mut()
      .flood_sub
      .publish(TOPIC.clone(), json.as_bytes());
    }
    None => {
      match read_local_recipes().await {
        Ok(v) => {
          info!("Local Recipes ({})", v.len());
          v.iter().for_each(|r| info!("{:?}", r));
        }
        Err(e) => error!("error fetching local recipes: {}", e),
      };
    }
  };
}
```

首先，解析命令行参数：

-   **如果为 all**：则使用 FloodSub 向网络中所有其他 Node 广播 `ListMode::All` 请求；
-   **如果为 `recipes_peer_id`**：则广播 `ListMode::One(recipes_peer_id.to_owned())` 请求；
-   否则，为查询本地 Recipe 列表，直接读取文件返回即可！

<br/>

### **响应消息**

前面我们通过 FloodSub 向对等网中的其他节点发送了请求，那么如何响应消息呢？

这就是 Swarm 自定义逻辑中的核心部分了！

注意到，在前面的 处理输入请求 一小节，我们在 `tokio::select!` 中定义了：

```rust
tokio::select! {
  ...
  _ = handle_swarm_event(response_sender.clone(), &mut swarm) => None,
}
```

我们正是在这个函数中处理的 BehaviourEvent 逻辑，下面来看：

src/handlers.rs

```rust
pub async fn handle_swarm_event(
  response_sender: mpsc::UnboundedSender<ListResponse>,
  swarm: &mut Swarm<RecipeBehaviour>,
) {
  let event = swarm.select_next_some().await;
  info!("Income swarm Event: {:?}", event);

  match event {
    SwarmEvent::Behaviour(recipe_behaviours) => match recipe_behaviours {
      RecipeBehaviourEvent::Floodsub(flood_sub_event) => match flood_sub_event {
        FloodsubEvent::Message(msg) => {
          if let Ok(resp) = serde_json::from_slice::<ListResponse>(&msg.data) {
            if resp.receiver == PEER_ID.to_string() {
              info!("Response from {}:", msg.source);
              resp.data.iter().for_each(|r| info!("{:?}", r));
            }
          } else if let Ok(req) = serde_json::from_slice::<ListRequest>(&msg.data) {
            match req.mode {
              ListMode::All => {
                info!("Received ALL req: {:?} from {:?}", req, msg.source);
                respond_with_public_recipes(
                  response_sender.clone(),
                  msg.source.to_string(),
                );
              }
              ListMode::One(ref peer_id) => {
                if peer_id == &PEER_ID.to_string() {
                  info!("Received req: {:?} from {:?}", req, msg.source);
                  respond_with_public_recipes(
                    response_sender.clone(),
                    msg.source.to_string(),
                  );
                }
              }
            }
          }
        }
        FloodsubEvent::Subscribed { .. } => {}
        FloodsubEvent::Unsubscribed { .. } => {}
      },
      RecipeBehaviourEvent::Mdns(mdns_event) => match mdns_event {
        Event::Discovered(discovered_list) => {
          let behavior_mut = swarm.behaviour_mut();
          for (peer, _addr) in discovered_list {
            behavior_mut.flood_sub.add_node_to_partial_view(peer);
          }
        }
        Event::Expired(expired_list) => {
          let behavior_mut = swarm.behaviour_mut();
          for (peer, _addr) in expired_list {
            if !behavior_mut.mdns.has_node(&peer) {
              behavior_mut.flood_sub.remove_node_from_partial_view(&peer);
            }
          }
        }
      },
    },
    SwarmEvent::ConnectionEstablished {
      peer_id,
      connection_id,
      endpoint,
      num_established,
      ..
    } => {
      debug!("[Connection established] peer_id: {}, connection_id: {}, endpoint: {:?}, num_established: {:?}", peer_id, connection_id, endpoint, num_established);
    }
    SwarmEvent::ConnectionClosed {
      peer_id,
      connection_id,
      endpoint,
      num_established,
      ..
    } => {
      debug!("[Connection closed] peer_id: {}, connection_id: {}, endpoint: {:?}, num_established: {:?}", peer_id, connection_id, endpoint, num_established);
    }
    SwarmEvent::IncomingConnection { .. } => {}
    SwarmEvent::IncomingConnectionError { .. } => {}
    SwarmEvent::OutgoingConnectionError { .. } => {}
    SwarmEvent::NewListenAddr { .. } => {}
    SwarmEvent::ExpiredListenAddr { .. } => {}
    SwarmEvent::ListenerClosed { .. } => {}
    SwarmEvent::ListenerError { .. } => {}
    SwarmEvent::Dialing { .. } => {}
  };
}
```

可以看到，我们正是通过 `let event = swarm.select_next_some().await` 来获取的 Swarm 中所有的 Event 事件！

**随后我们即可枚举全部的 Event 事件：**

-   `SwarmEvent::Behaviour`：用户自定义的事件，也就是上面我们通过 `to_swarm` 宏指定的 Enum 类型！
-   `SwarmEvent::ConnectionEstablished`：连接建立事件；
-   `SwarmEvent::ConnectionClosed`：连接断开事件；
-   ……

>   **可以看到，得益于 Rust 强大的枚举类型，我们可以非常清晰的处理各种事件！**

<br/>

#### **处理FloodSubEvent**

处理 FloodSubEvent 的逻辑如下：

```rust
RecipeBehaviourEvent::Floodsub(flood_sub_event) => match flood_sub_event {
  FloodsubEvent::Message(msg) => {
    if let Ok(resp) = serde_json::from_slice::<ListResponse>(&msg.data) {
      if resp.receiver == PEER_ID.to_string() {
        info!("Response from {}:", msg.source);
        resp.data.iter().for_each(|r| info!("{:?}", r));
      }
    } else if let Ok(req) = serde_json::from_slice::<ListRequest>(&msg.data) {
      match req.mode {
        ListMode::All => {
          info!("Received ALL req: {:?} from {:?}", req, msg.source);
          respond_with_public_recipes(
            response_sender.clone(),
            msg.source.to_string(),
          );
        }
        ListMode::One(ref peer_id) => {
          if peer_id == &PEER_ID.to_string() {
            info!("Received req: {:?} from {:?}", req, msg.source);
            respond_with_public_recipes(
              response_sender.clone(),
              msg.source.to_string(),
            );
          }
        }
      }
    }
  }
  FloodsubEvent::Subscribed { .. } => {}
  FloodsubEvent::Unsubscribed { .. } => {}
},
```

首先我们判断：

-   如果接收到的是其他节点广播的 ListResponse，并且 receiver 为本机 PeerId 则直接输出；
-   如果接收到的是 ListRequest，则判断：
    -   如果为 `ListMode::All` 查询模式，则读取本机数据，并返回；
    -   如果为 `ListMode::One(ref peer_id)`，则判断 PeerId 为本机才返回；

`respond_with_public_recipes` 的逻辑如下：

```rust
fn respond_with_public_recipes(sender: mpsc::UnboundedSender<ListResponse>, receiver: String) {
  tokio::spawn(async move {
    match read_local_recipes().await {
      Ok(recipes) => {
        let resp = ListResponse {
          mode: ListMode::All,
          receiver,
          data: recipes.into_iter().filter(|r| r.shared).collect(),
        };
        if let Err(e) = sender.send(resp) {
          error!("error sending response via channel, {}", e);
        }
      }
      Err(e) => error!("error fetching local recipes to answer ALL request, {}", e),
    }
  });
}
```

读取本地 Recipe 数据，并通过 sender 发送即可！

在 `tokio::select!` 中会接收响应，并广播出去：

```rust
tokio::select! {
  response = response_rcv.recv() => Some(EventType::Response(response.expect("response exists"))),
}

EventType::Response(resp) => {
  let json = serde_json::to_string(&resp).expect("can jsonify response");
  swarm
  .behaviour_mut()
  .flood_sub
  .publish(TOPIC.clone(), json.as_bytes());
}
```

<br/>

#### **处理mDNSEvent**

mDNS 包括了两个事件：

```rust
#[derive(Debug, Clone)]
pub enum Event {
  /// Discovered nodes through mDNS.
  Discovered(Vec<(PeerId, Multiaddr)>),

  /// The given combinations of `PeerId` and `Multiaddr` have expired.
  ///
  /// Each discovered record has a time-to-live. When this TTL expires and the address hasn't
  /// been refreshed, we remove it from the list and emit it as an `Expired` event.
  Expired(Vec<(PeerId, Multiaddr)>),
}

```

分别为：

-   `Discovered(Vec<(PeerId, Multiaddr)>)`：已发现的节点；
-   `Expired(Vec<(PeerId, Multiaddr)>)`：新节点过期；

处理逻辑如下：

src/handlers.rs

```rust
RecipeBehaviourEvent::Mdns(mdns_event) => match mdns_event {
  Event::Discovered(discovered_list) => {
    let behavior_mut = swarm.behaviour_mut();
    for (peer, _addr) in discovered_list {
      behavior_mut.flood_sub.add_node_to_partial_view(peer);
    }
  }
  Event::Expired(expired_list) => {
    let behavior_mut = swarm.behaviour_mut();
    for (peer, _addr) in expired_list {
      if !behavior_mut.mdns.has_node(&peer) {
        behavior_mut.flood_sub.remove_node_from_partial_view(&peer);
      }
    }
  }
},
```

即：

-   当发现了节点，这将其加入到 FloodSub 广播的节点中；
-   如果节点过期，则将该节点从 FloodSub 广播列表中去除；

逻辑非常简单；

至此，我们的应用开发完毕！

<br/>

### **应用测试**

我们可以通过 `cargo run` 在本机创建多个节点；

```shell
cargo run

INFO  rust_learn > Peer Id: 12D3KooWA7xhiEmFxikn9aiWcffkhDACDhz1rRPXxkC4yxgnzJCT
INFO  libp2p_mdns::behaviour::iface > creating instance on iface 192.168.31.22
INFO  rust_learn::handlers          > Income swarm Event: NewListenAddr { listener_id: ListenerId(1), address: "/ip4/127.0.0.1/tcp/65248" }
INFO  rust_learn::handlers          > Income swarm Event: NewListenAddr { listener_id: ListenerId(1), address: "/ip4/192.168.31.22/tcp/65248" }
INFO  libp2p_mdns::behaviour        > discovered: 12D3KooWGEGJQhFaR4ZzJ15CUvMVVu1wcaGd3i7yzvHHYFexbfT7 /ip4/192.168.31.22/tcp/65247
INFO  rust_learn::handlers          > Income swarm Event: Behaviour(Mdns(Discovered([(PeerId("12D3KooWGEGJQhFaR4ZzJ15CUvMVVu1wcaGd3i7yzvHHYFexbfT7"), "/ip4/192.168.31.22/tcp/65247")])))
INFO  rust_learn::handlers          > Income swarm Event: Dialing { peer_id: Some(PeerId("12D3KooWGEGJQhFaR4ZzJ15CUvMVVu1wcaGd3i7yzvHHYFexbfT7")), connection_id: ConnectionId(1) }
INFO  rust_learn::handlers          > Income swarm Event: ConnectionEstablished { peer_id: PeerId("12D3KooWGEGJQhFaR4ZzJ15CUvMVVu1wcaGd3i7yzvHHYFexbfT7"), connection_id: ConnectionId(1), endpoint: Dialer { address: "/ip4/192.168.31.22/tcp/65247/p2p/12D3KooWGEGJQhFaR4ZzJ15CUvMVVu1wcaGd3i7yzvHHYFexbfT7", role_override: Dialer }, num_established: 1, concurrent_dial_errors: Some([]), established_in: 7.355625ms }
INFO  rust_learn::handlers          > Income swarm Event: Behaviour(Floodsub(Subscribed { peer_id: PeerId("12D3KooWGEGJQhFaR4ZzJ15CUvMVVu1wcaGd3i7yzvHHYFexbfT7"), topic: Topic("recipes") }))
INFO  libp2p_mdns::behaviour        > discovered: 12D3KooWCWesVZsAoDaFs7UZYXV6gTNd56UPMoiWfxWFgvLCJZhz /ip4/192.168.31.22/tcp/65250
INFO  rust_learn::handlers          > Income swarm Event: Behaviour(Mdns(Discovered([(PeerId("12D3KooWCWesVZsAoDaFs7UZYXV6gTNd56UPMoiWfxWFgvLCJZhz"), "/ip4/192.168.31.22/tcp/65250")])))
INFO  rust_learn::handlers          > Income swarm Event: Dialing { peer_id: Some(PeerId("12D3KooWCWesVZsAoDaFs7UZYXV6gTNd56UPMoiWfxWFgvLCJZhz")), connection_id: ConnectionId(2) }
INFO  rust_learn::handlers          > Income swarm Event: IncomingConnection { connection_id: ConnectionId(3), local_addr: "/ip4/192.168.31.22/tcp/65248", send_back_addr: "/ip4/192.168.31.22/tcp/65253" }
INFO  rust_learn::handlers          > Income swarm Event: ConnectionEstablished { peer_id: PeerId("12D3KooWCWesVZsAoDaFs7UZYXV6gTNd56UPMoiWfxWFgvLCJZhz"), connection_id: ConnectionId(2), endpoint: Dialer { address: "/ip4/192.168.31.22/tcp/65250/p2p/12D3KooWCWesVZsAoDaFs7UZYXV6gTNd56UPMoiWfxWFgvLCJZhz", role_override: Dialer }, num_established: 1, concurrent_dial_errors: Some([]), established_in: 5.762334ms }
INFO  rust_learn::handlers          > Income swarm Event: ConnectionEstablished { peer_id: PeerId("12D3KooWCWesVZsAoDaFs7UZYXV6gTNd56UPMoiWfxWFgvLCJZhz"), connection_id: ConnectionId(3), endpoint: Listener { local_addr: "/ip4/192.168.31.22/tcp/65248", send_back_addr: "/ip4/192.168.31.22/tcp/65253" }, num_established: 2, concurrent_dial_errors: None, established_in: 5.212125ms }
INFO  rust_learn::handlers          > Income swarm Event: Behaviour(Floodsub(Subscribed { peer_id: PeerId("12D3KooWCWesVZsAoDaFs7UZYXV6gTNd56UPMoiWfxWFgvLCJZhz"), topic: Topic("recipes") }))
```

查看所有对等节点：

```shell
ls p

 INFO  rust_learn::handlers          > Discovered Peers:
 INFO  rust_learn::handlers          > 12D3KooWGEGJQhFaR4ZzJ15CUvMVVu1wcaGd3i7yzvHHYFexbfT7
 INFO  rust_learn::handlers          > 12D3KooWCWesVZsAoDaFs7UZYXV6gTNd56UPMoiWfxWFgvLCJZhz
```

创建 Recipe：

```shell
create r name|recipe_ingredients|recipe_instruction

 INFO  rust_learn::handlers          > Created recipe:
 INFO  rust_learn::handlers          > Name:  name
 INFO  rust_learn::handlers          > Ingredients: recipe_ingredients
 INFO  rust_learn::handlers          > Instructions:: recipe_instruction
```

列出本地 Recipe：

```shell
ls r

 INFO  rust_learn::handlers          > Local Recipes (6)
 INFO  rust_learn::handlers          > Recipe { id: 0, name: " Coffee", ingredients: "Coffee", instructions: "Make Coffee", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 1, name: " Tea", ingredients: "Tea, Water", instructions: "Boil Water, add tea", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 2, name: " Carrot Cake", ingredients: "Carrots, Cake", instructions: "Make Carrot Cake", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 3, name: " Name", ingredients: "Ingredients", instructions: "Instructions", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 4, name: " name", ingredients: "recipeIngredients", instructions: "instruction", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 5, name: " name", ingredients: "recipe_ingredients", instructions: "recipe_instruction", shared: false }
```

列出所有对等点 Recipe：

```shell
ls r all

 INFO  rust_learn::handlers          > Income swarm Event: Behaviour(Floodsub(Message(FloodsubMessage { source: PeerId("12D3KooWGEGJQhFaR4ZzJ15CUvMVVu1wcaGd3i7yzvHHYFexbfT7"), data: [123, 34, 109, 111,...
 INFO  rust_learn::handlers          > Response from 12D3KooWGEGJQhFaR4ZzJ15CUvMVVu1wcaGd3i7yzvHHYFexbfT7:
 INFO  rust_learn::handlers          > Recipe { id: 0, name: " Coffee", ingredients: "Coffee", instructions: "Make Coffee", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 1, name: " Tea", ingredients: "Tea, Water", instructions: "Boil Water, add tea", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 2, name: " Carrot Cake", ingredients: "Carrots, Cake", instructions: "Make Carrot Cake", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 3, name: " Name", ingredients: "Ingredients", instructions: "Instructions", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 4, name: " name", ingredients: "recipeIngredients", instructions: "instruction", shared: true }
 INFO  rust_learn::handlers          > Income swarm Event: Behaviour(Floodsub(Message(FloodsubMessage { source: PeerId("12D3KooWCWesVZsAoDaFs7UZYXV6gTNd56UPMoiWfxWFgvLCJZhz"), data: [123, 34, 109....
 INFO  rust_learn::handlers          > Response from 12D3KooWCWesVZsAoDaFs7UZYXV6gTNd56UPMoiWfxWFgvLCJZhz:
 INFO  rust_learn::handlers          > Recipe { id: 0, name: " Coffee", ingredients: "Coffee", instructions: "Make Coffee", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 1, name: " Tea", ingredients: "Tea, Water", instructions: "Boil Water, add tea", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 2, name: " Carrot Cake", ingredients: "Carrots, Cake", instructions: "Make Carrot Cake", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 3, name: " Name", ingredients: "Ingredients", instructions: "Instructions", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 4, name: " name", ingredients: "recipeIngredients", instructions: "instruction", shared: true }
```

列出某个对等点 Recipe：

```shell
ls r 12D3KooWGEGJQhFaR4ZzJ15CUvMVVu1wcaGd3i7yzvHHYFexbfT7

 INFO  rust_learn::handlers          > Income swarm Event: Behaviour(Floodsub(Message(FloodsubMessage { source: PeerId("12D3KooWGEGJQhFaR4ZzJ15CUvMVVu1wcaGd3i7yzvHHYFexbfT7"), data: [123, 34, 109, 111, 100, 101, 34, ...
 INFO  rust_learn::handlers          > Response from 12D3KooWGEGJQhFaR4ZzJ15CUvMVVu1wcaGd3i7yzvHHYFexbfT7:
 INFO  rust_learn::handlers          > Recipe { id: 0, name: " Coffee", ingredients: "Coffee", instructions: "Make Coffee", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 1, name: " Tea", ingredients: "Tea, Water", instructions: "Boil Water, add tea", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 2, name: " Carrot Cake", ingredients: "Carrots, Cake", instructions: "Make Carrot Cake", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 3, name: " Name", ingredients: "Ingredients", instructions: "Instructions", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 4, name: " name", ingredients: "recipeIngredients", instructions: "instruction", shared: true }
```

发布 Recipe：

```shell
publish r 5

 INFO  rust_learn::handlers          > Published Recipe with id: 5
```

再次列出远程节点中的 Recipe：

```shell
ls r 12D3KooWGEGJQhFaR4ZzJ15CUvMVVu1wcaGd3i7yzvHHYFexbfT7

 INFO  rust_learn::handlers          > Income swarm Event: Behaviour(Floodsub(Message(FloodsubMessage { source: PeerId("12D3KooWGEGJQhFaR4ZzJ15CUvMVVu1wcaGd3i7yzvHHYFexbfT7"), data: [123, 34, 109, ...
 INFO  rust_learn::handlers          > Response from 12D3KooWGEGJQhFaR4ZzJ15CUvMVVu1wcaGd3i7yzvHHYFexbfT7:
 INFO  rust_learn::handlers          > Recipe { id: 0, name: " Coffee", ingredients: "Coffee", instructions: "Make Coffee", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 1, name: " Tea", ingredients: "Tea, Water", instructions: "Boil Water, add tea", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 2, name: " Carrot Cake", ingredients: "Carrots, Cake", instructions: "Make Carrot Cake", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 3, name: " Name", ingredients: "Ingredients", instructions: "Instructions", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 4, name: " name", ingredients: "recipeIngredients", instructions: "instruction", shared: true }
 INFO  rust_learn::handlers          > Recipe { id: 5, name: " name", ingredients: "recipe_ingredients", instructions: "recipe_instruction", shared: true }
```

由于多个节点共享的是同一份数据文件，刚刚我们发布了一个新的 Recipe，所以刚刚发布的 Recipe 也在这里显示了！

<br/>

## **小结**

相信通过上面的讲解，你已经了解了 libp2p 的基本使用；

P2P 技术目前广泛应用在区块链等领域，相信 libp2p 也一定会被越来越多的人使用！

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/rust-learn/tree/proj/p2p-demo

参考文章：

-   https://github.com/libp2p/rust-libp2p/blob/4fc911e6b39f8b2f097583fb60178948ae368528/swarm/CHANGELOG.md
-   https://github.com/libp2p/rust-libp2p/blob/4fc911e6b39f8b2f097583fb60178948ae368528/examples/chat/src/main.rs
-   https://github.com/zupzup/rust-peer-to-peer-example/
-   https://docs.rs/libp2p/0.53.2/libp2p/tutorials/ping/index.html
-   https://datatracker.ietf.org/doc/html/rfc6762
-   https://blog.logrocket.com/libp2p-tutorial-build-a-peer-to-peer-app-in-rust/
-   https://www.cnblogs.com/QiaoPengjun/p/17418735.html


<br/>
