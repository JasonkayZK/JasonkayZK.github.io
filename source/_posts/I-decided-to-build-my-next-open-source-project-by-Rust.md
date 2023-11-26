---
title: 我决定用 Rust 构建我的下一个开源项目
toc: true
cover: 'https://img.paulzzh.com/touhou/random?22'
date: 2022-10-08 22:58:15
categories: Rust
tags: [Rust]
description: 前一段时间我萌生出了一个想要复刻 Mark Zuckerberg 在 2003年实现的 Facemash 的想法；并且我学习 Rust 也已经有一段时间了，所以打算使用 Rust 来构建这个项目！
---

前一段时间我萌生出了一个想要复刻 Mark Zuckerberg 在 2003年实现的 Facemash 的想法；

并且我学习 Rust 也已经有一段时间了，所以打算使用 Rust 来构建这个项目！

源代码：

-   https://github.com/orgs/FacemashHub/repositories

<br/>

<!--more-->

# **我决定用 Rust 构建我的下一个开源项目！**

## **前言**

本后端项目用到的技术栈主要包括：

-   Actix Web框架；
-   Log 日志库；
-   Serde 序列化；
-   SnowFlake Id生成；
-   dotenv 获取环境配置；
-   MongoDB 存取；
-   lazy_static 全局静态初始化；
-   ELO 算法；
-   使用 Pre-Commit 在 Git Commit 前进行校验；
-   使用 Github Action 进行 CI；
-   使用中间镜像对代码进行编译并创建部署镜像；
-   ……

阅读了本文，你应该也能够学会上面这些库的用法；

那么废话不多说，直接开始！

<br/>

## **代码实现**

### **代码目录结构**

整个项目的目录结构如下（已去掉无关文件）：

```bash
$ tree         
.
├── .env
├── .github
│   └── workflows
│       └── ci.yaml
├── .pre-commit-config.yaml
├── Cargo.toml
├── Dockerfile
├── Makefile
├── build-image.sh
└── src
    ├── algorithm
    │   ├── elo_rating.rs
    │   ├── k_factor.rs
    │   └── mod.rs
    ├── config
    │   └── mod.rs
    ├── controller
    │   ├── face_info_controller.rs
    │   ├── file_controller.rs
    │   └── mod.rs
    ├── dao
    │   ├── face_info_dao.rs
    │   ├── file_resource_dao.rs
    │   ├── mod.rs
    │   └── rating_log_dao.rs
    ├── entity
    │   ├── face_info.rs
    │   ├── file_resource.rs
    │   ├── mod.rs
    │   └── rating_log.rs
    ├── logger
    │   └── mod.rs
    ├── main.rs
    ├── resource
    │   ├── id_generator.rs
    │   ├── mod.rs
    │   └── mongo.rs
    ├── service
    │   ├── face_info_service.rs
    │   ├── file_resource_service.rs
    │   └── mod.rs
    └── utils
        ├── md5.rs
        └── mod.rs
```

下面来说明：

-   `.github` 目录：Github Actions 相关配置；
-   `src` 目录：项目源代码目录；
-   `.pre-commit-config.yaml`：Pre-Commit 配置；
-   `.env`：项目环境变量配置；
-   `Cargo.toml`：Cargo 项目配置；
-   `Makefile`：项目编译脚本；
-   `Dockerfile`：项目Docker镜像配置；
-   `build-image.sh`：打包镜像脚本；

对于 src 目录下的各个子目录，见名知意，基本上很好理解了！

<br/>

### **服务入口**

Cargo 项目约定程序的入口都是：`src/main.rs` 下；

我们从 main 函数来看做了些什么：

src/main.rs

```rust
#[macro_use]
extern crate log;

use actix_web::{middleware, App, HttpServer};
use dotenv::dotenv;
use mongodb::bson::doc;

use crate::controller::{face_info_controller, file_controller};
use crate::resource::mongo;

mod algorithm;
mod config;
mod controller;
mod dao;
mod entity;
mod logger;
mod resource;
mod service;
mod utils;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    logger::init();

    resource::check_resources().await;
    service::init_file_service().await;

    HttpServer::new(|| {
        App::new()
            .wrap(middleware::Logger::default())
            .service(face_info_controller::get_face_info_randomly)
            .service(face_info_controller::get_face_info_by_id)
            .service(face_info_controller::add_face_info)
            .service(face_info_controller::vote_face_info)
            .service(file_controller::create_file_resource_by_stream)
            .service(file_controller::create_file_resource)
            .service(file_controller::download_local_file)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
```

在入口文件中，首先启用了一些库的宏（Macro），并声明了 Actix-Web 框架的 main 函数；

在 main 函数中，做了一般后端服务都会做的事情：

-   获取环境配置；
-   初始化项目日志；
-   初始化资源：数据库、Id生成器等；
-   注册并启动服务；

下面我们分别来看

<br/>

### **配置与日志**

#### **获取环境配置**

我们可以通过 `dotenv` 库解析位于项目下、以及系统环境变量中的配置；

只需要下面一句话即可：

```rust
dotenv().ok();
```

配置文件如下：

.env

```
MONGODB_URI=mongodb://admin:123456@localhost:27017/?retryWrites=true&w=majority
LOG_LEVEL=INFO
SNOWFLAKE_MACHINE_ID=1
SNOWFLAKE_NODE_ID=1
```

主要是配置了 MongoDB 的连接地址、日志级别、SnowFlake 的配置；

上面的语句会将这些配置解析；

<br/>

#### **初始化Logger**

main 函数中的这条语句初始化了 Logger：

```rust
logger::init();
```

这个是 logger 模块封装的一个函数：

logger/mod.rs

```rust
use std::env;

use crate::config::LOG_LEVEL;
use log::{Level, LevelFilter, Metadata, Record};

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
            "\u{1B}[{}m[{:>5}]:{} - {}\u{1B}[0m",
            color,
            record.level(),
            record.target(),
            record.args(),
        );
    }

    fn flush(&self) {}
}
```

上面的代码首先定义了一个全局日志类型 Logger；

并在 init 函数中初始化了全局静态变量：LOGGER，并使用 `log::set_logger` 进行了设置；

同时，我们我们从环境变量中获取 `LOG_LEVEL` 日志级别配置（如果未设置，则默认为 `INFO` 级别），随后进行了设置；

**我们为我们的 Logger 实现了`log::Log` Trait，这也是为什么我们能将该类型的变量设置为Logger的原因！**

在 `log::Log` Trait 的实现中，我们简单定义了日志的输出格式以及输出颜色；

>   **可以看到有了很多第三方库的支持，rust 还是非常好用的！**

<br/>

#### **初始化资源**

接下来我们调用：

```rust
resource::check_resources().await;
service::init_file_service().await;
```

来等待资源初始化完成；

下面初始化文件服务的逻辑非常简单，只是创建了一个临时文件：

```rust
pub async fn init_file_service() {
    init_local_directory().await;
}

pub async fn init_local_directory() {
    fs::create_dir_all(SAVE_DIR).unwrap()
}
```

我们重点来看 `check_resources()` 函数，在其中初始化并校验了 MongoDB 连接以及 SnowFlake Id生成器；

资源相关的初始化都是在 resource 模块中完成的；

resource 模块的入口 mod.rs 中定义了资源的校验函数：

resource/mod.rs

```rust
use crate::doc;

pub mod id_generator;
pub mod mongo;

pub async fn check_resources() {
    check_mongo().await;
    check_id_generator().await;
}

async fn check_mongo() {
    mongo::MONGO_CLIENT
        .get()
        .await
        .database("admin")
        .run_command(doc! {"ping": 1}, None)
        .await
        .unwrap();
    info!("Mongo connected successfully.");
}

async fn check_id_generator() {
    info!("Id generate success: {}.", id_generator::get_id().await)
}

```

MongoDB 通过 Ping 校验了数据库连接，而 SnowFlake 通过创建了一个 Id 校验了正确性；

那么这些资源是在哪里初始化的呢？

主要是通过 `lazy_static` 在首次使用的时候初始化的！

>   **`lazy_static` 的一个特性是：在首次使用这个变量的时候，才会进行静态初始化；**

下面分别来看：

src/resource/mongo.rs

```rust
use std::env;

use async_once::AsyncOnce;
use lazy_static::lazy_static;
use mongodb::Client;

use crate::config::MONGODB_URI;

lazy_static! {
    pub static ref MONGO_CLIENT: AsyncOnce<Client> = AsyncOnce::new(async {
        let uri = env::var(MONGODB_URI).expect("You must set the MONGODB_URI environment var!");
        Client::with_uri_str(&uri).await.unwrap()
    });
}
```

上面的代码在 `lazy_static!` 宏中，异步初始化了 MongoDB 的连接：

首先，从环境变量中获取配置 `MONGODB_URI`，随后进行了初始化，并保存至变量：`MONGO_CLIENT` 中；

src/resource/id_generator.rs

```rust
use std::env;
use std::sync::Mutex;

use lazy_static::lazy_static;
use snowflake::SnowflakeIdBucket;

use crate::config;

lazy_static! {
    static ref ID_GENERATOR_BUCKET: Mutex<SnowflakeIdBucket> = Mutex::new({
        let machine_id: i32 = env::var(config::SNOWFLAKE_MACHINE_ID)
            .expect("You must set the SNOWFLAKE_MACHINE_ID environment var!")
            .parse::<i32>()
            .unwrap();
        let node_id: i32 = env::var(config::SNOWFLAKE_NODE_ID)
            .expect("You must set the SNOWFLAKE_NODE_ID environment var!")
            .parse::<i32>()
            .unwrap();

        SnowflakeIdBucket::new(machine_id, node_id)
    });
}

pub async fn get_id() -> String {
    ID_GENERATOR_BUCKET.lock().unwrap().get_id().to_string()
}

#[actix_rt::test]
async fn generate_id_test() {
    use dotenv::dotenv;

    dotenv().ok();
    println!("{}", get_id().await)
}
```

与上面的初始化类似，这里从环境变量中获取：`SNOWFLAKE_MACHINE_ID` 和 `SNOWFLAKE_NODE_ID`，随后使用 `SnowflakeIdBucket::new` 进行了初始化；

**同时，和 MongoDB 不同的是，这里需要使用 `Mutex` 进行封装，因为极有可能多个出现多个线程并发获取Id；**

**而 MongoDB 的 Client 已经是：`Arc<ClientInner>` 类型了！**

**我们也封装了 get_id 函数，直接供外部调用，而无需暴露 `ID_GENERATOR_BUCKET` 变量！**

最下面是一个单测，用于测试我们的 Id 生成器；

至此，我们的资源初始化完成；

<br/>

### **ELO算法模块**

#### **ELO算法介绍**

ELO 算法是 Facemash 的核心，他主要用来计算两个玩家在对局结束之后各自的得分；

这个算法被用在了国际象棋分数计算，以及一些游戏 Rank 分数的计算中；

>   Wikipedia：
>
>   -   https://en.wikipedia.org/wiki/Elo_rating_system

这个算法的公式如下所示：

![elo_1.jpg](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/elo_1.jpg)

-   Ea 就是玩家 `a`的期望胜率；
-   Rb、Ra是玩家`b`与玩家`a`的`Rank`分数；
-   当Ra、Rb都相同时，他们的`期望胜率`都为`0.5`；

上述排名公式并非扎克伯格等人原创，而是出自匈牙利裔美国物理学家Arpad Elo，因此算法叫作：[Elo Rating](http://en.wikipedia.org/wiki/Elo_rating)

Arpad Elo认为：

-   参赛选手在每次比赛中的表现成正态分布；后来普遍认为[Logistic](http://en.wikipedia.org/wiki/Logistic_function)（[逻辑斯蒂](http://wiki.mbalib.com/wiki/逻辑斯蒂方程)）分布更为合理；
-   在一局比赛中，赢的一方被认为表现较好，输的一方被认为表现较差；若平局，则双方表现大致相当；
-   如果选手的表现比期望要好，那么此选手的排名应该上升。相反，若表现不如期望，则排名会下降；

同时，算法还给出了计算新的`Rank`分数的算法，公式如下：

```
Rn = Ro + K(W-E)
```

其中：

-   Rn 代表新的`Rank`值，Ro 表示旧的`Rank`值；
-   参数`K` 代表一个变化系数，可以设为常量，如`10`（在大师级象棋赛中通常取16），也可以根据玩家场次、玩家当前 Rank 数动态变化；
-   `W`是`胜负值`，胜者为`1`、败者为`0`；`E` 就是我们上面计算的`期望胜率`；

算法还是非常简单的，让我们在 Rust 中实现这个算法；

<br/>

#### **实现ELO算法**

在本项目中，ELO 算法是在 algorithm 模块中实现的：

src/algorithm/mod.rs

```rust
pub mod elo_rating;
mod k_factor;
```

在 elo_rating 中定义并暴露了几个函数：

src/algorithm/elo_rating.rs

```rust
//! # ELO rating
//!
//! This module contains all of the standard methods that would be used to calculate elo.
//! The module provides the constants WIN, LOSE and DRAW.
#![allow(dead_code)]

use crate::algorithm::k_factor::{fide_k, icc_k, uscf_k};

/// The EloScore type
pub type EloScore = i64;

pub type EloCompeteResult = f64;

/// The score for a won game
pub const WIN: EloCompeteResult = 1_f64;
/// The score for a drawn game
pub const DRAW: EloCompeteResult = 0.5;
/// The score for a lost game
pub const LOSS: EloCompeteResult = 0_f64;

fn rating_change(k: u64, score: EloCompeteResult, exp_score: EloCompeteResult) -> EloScore {
    (k as f64 * (score - exp_score)) as i64
}

/// Calculates the expected outcome of a match between two players.
/// This will always be a number between 0 and 1.
/// The closer to 1 the more favored the match is for player a.
pub fn expected_score(r_a: EloScore, r_b: EloScore) -> f64 {
    1_f64 / (1_f64 + 10_f64.powf(((r_b - r_a) as f64) / 400_f64))
}

/// Convenience function for a game played with FIDE k_factor.
pub fn compete_fide(
    r_a: EloScore,
    game_count_a: u64,
    r_b: EloScore,
    game_count_b: u64,
    s_a: EloCompeteResult,
) -> (EloScore, EloScore) {
    let k_a = fide_k(r_a, game_count_a);
    let k_b = fide_k(r_b, game_count_b);

    compete(r_a, r_b, s_a, k_a, k_b)
}

/// Convenience function for a game played with USCF k_factor.
pub fn compete_uscf(r_a: EloScore, r_b: EloScore, s_a: EloCompeteResult) -> (EloScore, EloScore) {
    let k_a = uscf_k(r_a);
    let k_b = uscf_k(r_b);

    compete(r_a, r_b, s_a, k_a, k_b)
}

/// Convenience function for a game played with ICC k_factor.
pub fn compete_icc(r_a: EloScore, r_b: EloScore, s_a: EloCompeteResult) -> (EloScore, EloScore) {
    let k_a = icc_k();
    let k_b = icc_k();

    compete(r_a, r_b, s_a, k_a, k_b)
}

/// Calculates the updated elo ratings of both players after a match.
/// The k_a and k_b are the K factors used to determine the updated rating,
/// If you just want a default behavior set these to 32, or use game_icc() instead.
pub fn compete(
    r_a: EloScore,
    r_b: EloScore,
    s_a: EloCompeteResult,
    k_a: u64,
    k_b: u64,
) -> (EloScore, EloScore) {
    let s_b = 1_f64 - s_a;

    let e_a = expected_score(r_a, r_b);
    let e_b = 1_f64 - e_a;

    let new_a = r_a + rating_change(k_a, s_a, e_a);
    let new_b = r_b + rating_change(k_b, s_b, e_b);

    (new_a, new_b)
}

/// Calculates the updated elo of a player, after a series of games.
/// This might be used to calculate the rating of a player after a tournament.
pub fn serial_compete(
    r_a: EloScore,
    games: &[(EloScore, EloCompeteResult)],
    k_factor: u64,
) -> EloScore {
    let mut score = 0_f64;
    let mut exp_score = 0_f64;

    for game in games {
        score += game.1;
        exp_score = expected_score(r_a, game.0);
    }

    r_a + rating_change(k_factor, score, exp_score)
}

#[cfg(test)]
mod tests {
   ...
}
```

其中定义了两个类型：

-   EloScore：ELO 比赛 Rank 分数；
-   EloCompeteResult：对应上文公式中的参数 `K`，当平局时取 `0.5`；

以及几个常用的函数：

-   expected_score：计算玩家A对玩家B的胜率期望；
-   compete_fide、compete_uscf、compete_icc：分别计算 K 取值在 FIDE、USCF、ICC 模式下的分数；
-   compete：自定义玩家A、B的 K 取值的比赛；
-   serial_compete：多场自定义 K 值的比赛；

对于 FIDE、USCF、ICC 模式下 K 的取值计算，在 k_factor.rs 中：

src/algorithm/k_factor.rs

```rust
//! Convenience functions for various popular rating systems using elo.
#![allow(dead_code)]

use crate::algorithm::elo_rating::EloScore;

/// FIDE calculates their k_factor depending on how many games you have played,
/// and what you elo rating is.
///
/// They also sometimes use age. But this is left out.
pub fn fide_k(rating: EloScore, game_counts: u64) -> u64 {
    if game_counts < 30 {
        40
    } else if rating < 2400 {
        20
    } else {
        10
    }
}

/// The USCF uses three different k_factors depending on you rating.
pub fn uscf_k(rating: EloScore) -> u64 {
    if rating < 2100 {
        32
    } else if rating < 2400 {
        24
    } else {
        16
    }
}

/// The ICC uses a global k_factor.
pub fn icc_k() -> u64 {
    32
}
```

可以看出：

-   FIDE 是和玩家比赛场数相关的取值；
-   USCF 是和玩家当前分数相关的取值；
-   ICC 为固定取值；

下面的一些单测帮助你了解了上面的函数是如何使用的：

src/algorithm/elo_rating.rs

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_expected_score() {
        let john = 1700;
        let paul = 1800;

        // calculate johns chance to win against paul
        let chance = expected_score(john, paul);
        assert!(chance >= 0.0 && chance <= 1.0);
        println!("johns chance to win against paul: {}", chance)
    }

    #[test]
    fn test_compete() {
        let john = 1700;
        let paul = 1800;

        println!("before compete: john: {}, paul: {}", john, paul);
        let (john, paul) = compete(john, paul, LOSS, 32, 32);
        println!("after compete(paul win): john: {}, paul: {}", john, paul);
    }

    #[test]
    fn test_serial_compete() {
        let john = 1700;
        println!("before serial competes: john: {}", john);

        // An array containing the results of johns games in the tournament
        let games = [(1600, WIN), (1800, DRAW), (2000, LOSS)];

        let john = serial_compete(john, &games, 32);
        println!("after serial competes: john: {}", john);
    }

    #[test]
    fn test_compete_uscf() {
        let john = 1400;
        let paul = 1800;

        println!("before compete uscf: john: {}, paul: {}", john, paul);
        let (john, paul) = compete_uscf(john, paul, WIN);
        println!(
            "after compete uscf(paul win): john: {}, paul: {}",
            john, paul
        );
    }
}
```

<br/>

### **构建服务**

熟悉 Java 的小伙伴都知道，通常在 Spring Boot 项目中，基本上都会分成 entity(POJO)、dao(Mapper)、service、controller 层；

在这里，我也分了这么几层（实际上没什么必要）；

#### **Entity层**

Entity 层主要存放和数据库表相关的基本结构体定义；

在这个项目，我主要是三个结构体：

-   FaceInfo：存放参与评比的选手的信息；
-   RatingLog：存放评比选择的日志；
-   FileResource：存放选手的图像等信息；

下面是定义：

src/entity/face_info.rs

```rust
use serde::{Deserialize, Serialize};

pub const DEFAULT_SCORE: f64 = 1400.0;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct FaceInfo {
    pub id: String,
    pub star_name: String,
    pub file_id: String,
    pub upvote_count: u64,
    pub downvote_count: u64,
    pub score: f64,
    pub creator: String,
    pub updater: String,
    pub created_on: i64,
    pub updated_on: i64,
    pub deleted_on: i64,
    pub is_deleted: i64,
}

impl Default for FaceInfo {
    fn default() -> Self {
        FaceInfo {
            id: "".to_string(),
            file_id: "".to_string(),
            star_name: "".to_string(),
            upvote_count: 0,
            downvote_count: 0,
            score: DEFAULT_SCORE,
            creator: "".to_string(),
            updater: "".to_string(),
            created_on: 0,
            updated_on: 0,
            deleted_on: 0,
            is_deleted: 0,
        }
    }
}

impl FaceInfo {
    pub fn db_name() -> &'static str {
        "facemash"
    }

    pub fn coll_name() -> &'static str {
        "face_info"
    }
}
```

src/entity/file_resource.rs

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UriType {
    Local,
    Url,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct FileResource {
    pub id: String,
    pub file_name: String,
    pub file_uri: String,
    pub uri_type: UriType,
    pub md5: String,
    pub thumb_uri: String,
    pub thumb_type: UriType,
    pub creator: String,
    pub updater: String,
    pub created_on: i64,
    pub updated_on: i64,
    pub deleted_on: i64,
    pub is_deleted: i64,
}

impl Default for FileResource {
    fn default() -> Self {
        FileResource {
            id: "".to_string(),
            file_name: "".to_string(),
            file_uri: "".to_string(),
            uri_type: UriType::Local,
            md5: "".to_string(),
            thumb_uri: "".to_string(),
            thumb_type: UriType::Local,
            creator: "".to_string(),
            updater: "".to_string(),
            created_on: 0,
            updated_on: 0,
            deleted_on: 0,
            is_deleted: 0,
        }
    }
}

impl FileResource {
    pub fn db_name() -> &'static str {
        "facemash"
    }

    pub fn coll_name() -> &'static str {
        "file_resource"
    }
}
```

src/entity/rating_log.rs

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct RatingLog {
    pub id: String,
    pub win_face_id: String,
    pub loss_face_id: String,
    pub creator: String,
    pub updater: String,
    pub created_on: i64,
    pub updated_on: i64,
    pub deleted_on: i64,
    pub is_deleted: i64,
}

impl Default for RatingLog {
    fn default() -> Self {
        RatingLog {
            id: "".to_string(),
            win_face_id: "".to_string(),
            loss_face_id: "".to_string(),
            creator: "".to_string(),
            updater: "".to_string(),
            created_on: 0,
            updated_on: 0,
            deleted_on: 0,
            is_deleted: 0,
        }
    }
}

impl RatingLog {
    pub fn db_name() -> &'static str {
        "facemash"
    }

    pub fn coll_name() -> &'static str {
        "rating_log"
    }
}
```

上面的代码都非常相似；

在 struct 上的过程宏可以为对应的结构体创建相应的 Trait 实现：

-   **`#[derive(Debug, Clone, Serialize, Deserialize)]`：Debug 打印、Clone、序列化、反序列化；**
-   **`#[serde(default)]`：由 serde 库提供的，在序列化、反序列化基础之上，提供 JSON 格式的序列化！**

仅仅加了上面两个宏，我们就可以完成类型的 JSON 序列化了！

同时，为我们的类型实现了 Default Trait；

**这是因为在 Rust 中，创建一个对象需要为他的所有字段都赋值；其中一个方法是创建不同的构造函数来满足；**

**但是这样比较麻烦，我们可以实现 Default Trait，然后在创建对象的时候，指定某些熟悉，然后其他的熟悉通过调用 default 函数来完成；**

例如：

```rust
RatingLog {
  id: resource::id_generator::get_id().await,
  win_face_id: win_face_info.id.clone(),
  loss_face_id: lose_face_info.id.clone(),
  creator: req.voter.clone(),
  created_on: now,
  ..RatingLog::default()
}
```

我们为某些字段赋值，而其他字段使用默认值；

此外，我们为每个类型都实现了：db_name 和 coll_name 方法，用于返回对应 MongoDB 中的数据库的名称以及集合名称；

<br/>

#### **DAO层**

DAO 层主要是为上层屏蔽数据库操作；

**由于我们使用了 MongoDB，其与 serde 序列化、反序列化的良好结合，使得我们甚至无需使用任何 ORM 框架，而达到比 ORM 更方便的效果！**

下面是各个类型数据库操作的实现：

src/dao/file_resource_dao.rs

```rust
use mongodb::results::InsertManyResult;
use mongodb::Collection;

use crate::entity::rating_log::RatingLog;
use crate::mongo;

/// Adds new rating_logs to the "rating_log" collection in the database.
pub async fn add_rating_logs(
    rating_log: Vec<RatingLog>,
) -> mongodb::error::Result<InsertManyResult> {
    let collection: Collection<RatingLog> = mongo::MONGO_CLIENT
        .get()
        .await
        .database(RatingLog::db_name())
        .collection(RatingLog::coll_name());
    collection.insert_many(rating_log, None).await
}
```

src/dao/rating_log_dao.rs

```rust
use mongodb::results::InsertManyResult;
use mongodb::Collection;

use crate::entity::rating_log::RatingLog;
use crate::mongo;

/// Adds new rating_logs to the "rating_log" collection in the database.
pub async fn add_rating_logs(
    rating_log: Vec<RatingLog>,
) -> mongodb::error::Result<InsertManyResult> {
    let collection: Collection<RatingLog> = mongo::MONGO_CLIENT
        .get()
        .await
        .database(RatingLog::db_name())
        .collection(RatingLog::coll_name());
    collection.insert_many(rating_log, None).await
}
```

src/dao/face_info_dao.rs

```rust
use futures_util::StreamExt;
use mongodb::bson::{doc, Document};
use mongodb::results::{InsertOneResult, UpdateResult};
use mongodb::{bson, Collection};

use crate::entity::face_info::FaceInfo;
use crate::mongo;
use crate::resource::mongo::MONGO_CLIENT;

/// Adds a new face_info to the "face_info" collection in the database.
pub async fn add_one_face_info(face_info: &FaceInfo) -> mongodb::error::Result<InsertOneResult> {
    let collection: Collection<FaceInfo> = mongo::MONGO_CLIENT
        .get()
        .await
        .database(FaceInfo::db_name())
        .collection(FaceInfo::coll_name());
    collection.insert_one(face_info, None).await
}

/// Gets the face_info by doc filter.
pub async fn get_one_face_info_by_doc_filter(
    doc_filter: Document,
) -> mongodb::error::Result<Option<FaceInfo>> {
    let collection = MONGO_CLIENT
        .get()
        .await
        .database(FaceInfo::db_name())
        .collection(FaceInfo::coll_name());
    collection.find_one(doc_filter, None).await
}

/// Get multiple face_info by doc filter.
pub async fn get_face_infos_by_doc_filter(
    doc_filter: Document,
) -> Result<Vec<FaceInfo>, mongodb::error::Error> {
    let collection = MONGO_CLIENT
        .get()
        .await
        .database(FaceInfo::db_name())
        .collection(FaceInfo::coll_name());

    let mut ret_face_infos: Vec<FaceInfo> = Vec::new();
    let mut results = collection.find(doc_filter, None).await?;

    while let Some(result) = results.next().await {
        // Use serde to deserialize into the MovieSummary struct:
        let face_info: FaceInfo = bson::from_document(result?)?;
        ret_face_infos.push(face_info);
    }
    Ok(ret_face_infos)
}

/// Update the face_info by id.
pub async fn update_face_info_by_doc_filter(
    doc_filter: Document,
    update_info: Document,
) -> mongodb::error::Result<UpdateResult> {
    let collection: Collection<FaceInfo> = MONGO_CLIENT
        .get()
        .await
        .database(FaceInfo::db_name())
        .collection(FaceInfo::coll_name());

    collection.update_one(doc_filter, update_info, None).await
}

/// Get face_info randomly
pub async fn get_face_info_sample(size: i64) -> Result<Vec<FaceInfo>, mongodb::error::Error> {
    let collection: Collection<FaceInfo> = MONGO_CLIENT
        .get()
        .await
        .database(FaceInfo::db_name())
        .collection(FaceInfo::coll_name());

    let pipeline = vec![doc! {"$sample": {"size": size}}];

    let mut ret_face_infos: Vec<FaceInfo> = Vec::new();
    let mut results = collection.aggregate(pipeline, None).await?;
    while let Some(result) = results.next().await {
        // Use serde to deserialize into the FaceInfo struct:
        let face_info: FaceInfo = bson::from_document(result?)?;
        ret_face_infos.push(face_info);
    }
    Ok(ret_face_infos)
}
```

可以看到，都是直接通过：`mongo::MONGO_CLIENT.get().await.database(XXX::db_name()).collection(XXX::coll_name());` 获取对应数据库连接；

并且调用：insert_one、find_one、insert_many 等函数，直接完成了 CRUD！

而对于查询条件，我们可以直接在外面使用 `doc!` 宏拼好对应的过滤条件，直接完成查询！

<br/>

#### **Service层**

Service 层主要是调用 DAO 层，完成业务逻辑；

对于 FaceInfo 我们有：

src/service/face_info_service.rs

```rust
use mongodb::bson::Document;
use mongodb::results::{InsertOneResult, UpdateResult};

use crate::dao::face_info_dao;
use crate::doc;
use crate::entity::face_info::FaceInfo;

pub async fn get_face_info_randomly(size: i64) -> Result<Vec<FaceInfo>, mongodb::error::Error> {
    face_info_dao::get_face_info_sample(size).await
}

pub async fn get_one_face_info_by_doc_filter(
    doc_filter: Document,
) -> mongodb::error::Result<Option<FaceInfo>> {
    face_info_dao::get_one_face_info_by_doc_filter(doc_filter).await
}

pub async fn get_face_infos_by_doc_filter(
    doc_filter: Document,
) -> Result<Vec<FaceInfo>, mongodb::error::Error> {
    face_info_dao::get_face_infos_by_doc_filter(doc_filter).await
}

pub async fn add_face_info(face_info: &FaceInfo) -> mongodb::error::Result<InsertOneResult> {
    face_info_dao::add_one_face_info(face_info).await
}

pub async fn update_face_info_rating(
    face_info_id: &str,
    rating: f64,
    upvote: bool,
    voter: &str,
    now: i64,
) -> mongodb::error::Result<UpdateResult> {
    let filter_doc = doc! {"id": face_info_id};

    let update_doc = if upvote {
        doc! {
            "$set": {"score": rating, "updater": voter, "updated_on": now},
            "$inc": {"upvote_count": 1},
        }
    } else {
        doc! {
            "$set": {"score": rating, "updater": voter, "updated_on": now},
            "$inc": {"downvote_count": 1},
        }
    };

    face_info_dao::update_face_info_by_doc_filter(filter_doc, update_doc).await
}
```

主要包括下面几个函数：

-   get_face_info_randomly：获取随机的 size 个对手；
-   get_one_face_info_by_doc_filter：根据过滤条件获取单个选手信息；
-   get_face_infos_by_doc_filter：根据过滤条件获取多个选手信息；
-   add_face_info：添加一名选手；
-   update_face_info_rating：更新选手的得分；

下面再来看文件资源：

src/service/file_resource_service.rs

```rust
use std::fs;
use std::fs::File;
use std::io::Write;

use actix_multipart::Multipart;
use actix_web::{error, web, Error};
use futures_util::TryStreamExt as _;
use mongodb::bson::Document;
use mongodb::results::InsertOneResult;

use crate::dao::file_resource_dao;
use crate::entity::file_resource::FileResource;

const SAVE_DIR: &str = "./tmp";

pub async fn init_local_directory() {
    fs::create_dir_all(SAVE_DIR).unwrap()
}

pub async fn create_file_resource_with_stream(
    mut payload: Multipart,
    file_prefix_id: &str,
) -> Result<String, Error> {
    let mut filename: String = "".to_string();

    // iterate over multipart stream
    while let Some(mut field) = payload.try_next().await? {
        // A multipart/form-data stream has to contain `content_disposition`
        let content_disposition = field.content_disposition();

        filename = match content_disposition.get_filename() {
            None => {
                return Err(error::ErrorInternalServerError(
                    "Couldn't read the filename.",
                ));
            }
            Some(f_name) => {
                info!("{}", f_name);
                f_name.replace(' ', "_").to_string()
            }
        };

        let filepath = get_local_filepath(file_prefix_id, &filename);

        // File::create is blocking operation, use threadpool
        let mut f = web::block(|| File::create(filepath)).await??;

        // Field in turn is stream of *Bytes* object
        while let Some(chunk) = field.try_next().await? {
            // filesystem operations are blocking, we have to use threadpool
            f = web::block(move || f.write_all(&chunk).map(|_| f)).await??;
        }
    }

    Ok(filename)
}

pub async fn create_file_resource(
    file_resource: &FileResource,
) -> mongodb::error::Result<InsertOneResult> {
    file_resource_dao::add_one_file_resource(file_resource).await
}

pub async fn get_one_file_resource_by_doc_filter(
    doc_filter: Document,
) -> mongodb::error::Result<Option<FileResource>> {
    file_resource_dao::get_one_file_resource_by_doc_filter(doc_filter).await
}

pub async fn delete_file(filepath: &str) {
    match fs::remove_file(filepath) {
        Ok(_) => {}
        Err(err) => {
            error!("Failed to remove file: {:?}, error: {:?}", filepath, err)
        }
    };
}

pub fn get_local_filepath(face_info_id: &str, filename: &str) -> String {
    format!("{SAVE_DIR}/{face_info_id}-{filename}")
}
```

主要是下面几个功能：

-   create_file_resource_with_stream：通过流上传文件；
-   create_file_resource：创建文件资源；
-   get_one_file_resource_by_doc_filter：根据过滤条件查询资源信息；
-   delete_file：删除资源信息；
-   get_local_filepath：获取某个选手本地保存的资源路径（用于本地保存）；

<br/>

#### **Controller层**

Controller层用于统一处理用户请求；

src/controller/face_info_controller.rs

```rust
use crate::algorithm::elo_rating::{compete_uscf, EloScore, WIN};
use actix_web::error::{ErrorBadRequest, ErrorInternalServerError, ErrorNotFound};
use actix_web::{post, web, Error, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::dao::rating_log_dao::add_rating_logs;
use crate::entity::face_info::FaceInfo;
use crate::entity::file_resource::FileResource;
use crate::entity::rating_log::RatingLog;
use crate::resource;
use crate::service::face_info_service::update_face_info_rating;
use crate::service::{face_info_service, file_resource_service};
use crate::{doc, entity};

#[derive(Debug, Serialize, Deserialize)]
pub struct FaceAndFileResourceInfo {
    face_info: FaceInfo,
    file_resource: FileResource,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetRandomFaceInfoRandomlyReq {
    face_info_cnt: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetRandomFaceInfoRandomlyResp {
    face_and_file_infos: Vec<FaceAndFileResourceInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetFaceInfoByIdReq {
    id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetFaceInfoByIdResp {
    face_and_file_info: FaceAndFileResourceInfo,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AddFaceInfoReq {
    face_info: FaceInfo,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AddFaceInfoResp {
    face_info_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VoteFaceInfoReq {
    win_face_info_id: String,
    lose_face_info_id: String,
    voter: String,
}

#[post("/get_face_info_randomly")]
pub async fn get_face_info_randomly(
    mut req: web::Json<GetRandomFaceInfoRandomlyReq>,
) -> Result<impl Responder, Error> {
    log::debug!("req: {:?}", &req);

    if req.face_info_cnt <= 0 {
        req.face_info_cnt = 2
    }

    let face_infos = face_info_service::get_face_info_randomly(req.face_info_cnt)
        .await
        .unwrap_or_default();

    let mut face_and_file_infos = vec![];
    for face_info in face_infos {
        face_and_file_infos.push(FaceAndFileResourceInfo {
            file_resource: match file_resource_service::get_one_file_resource_by_doc_filter(
                doc! {"id": &face_info.file_id},
            )
            .await
            {
                Ok(file_info) => match file_info {
                    None => FileResource::default(),
                    Some(file_info) => file_info,
                },
                Err(err) => {
                    log::error!("Error: {:?}", err);
                    return HttpResponse::InternalServerError().await;
                }
            },
            face_info,
        });
    }

    Ok(HttpResponse::Ok().json(GetRandomFaceInfoRandomlyResp {
        face_and_file_infos,
    }))
}

#[post("/get_face_info_by_id")]
pub async fn get_face_info_by_id(
    req: web::Json<GetFaceInfoByIdReq>,
) -> Result<impl Responder, Error> {
    info!("req: {:?}", &req);

    let face_info_id = &req.id;
    if face_info_id.is_empty() {
        return HttpResponse::NotFound().await;
    }

    let face_info =
        match face_info_service::get_one_face_info_by_doc_filter(doc! {"id": face_info_id}).await {
            Ok(face_info) => match face_info {
                None => {
                    return HttpResponse::NotFound().await;
                }
                Some(face_info) => face_info,
            },
            Err(err) => {
                log::error!("Error: {:?}", err);
                return HttpResponse::InternalServerError().await;
            }
        };

    let file_resource = match file_resource_service::get_one_file_resource_by_doc_filter(
        doc! {"id": &face_info.file_id},
    )
    .await
    {
        Ok(file_info) => match file_info {
            None => FileResource::default(),
            Some(file_info) => file_info,
        },
        Err(err) => {
            log::error!("Error: {:?}", err);
            return HttpResponse::InternalServerError().await;
        }
    };

    Ok(HttpResponse::Ok().json(GetFaceInfoByIdResp {
        face_and_file_info: FaceAndFileResourceInfo {
            face_info,
            file_resource,
        },
    }))
}

#[post("/add_face_info")]
pub async fn add_face_info(mut req: web::Json<AddFaceInfoReq>) -> Result<impl Responder, Error> {
    info!("req: {:?}", &req);

    let face_info_id = resource::id_generator::get_id().await;
    req.face_info.id = face_info_id;
    req.face_info.created_on = chrono::Utc::now().timestamp();
    req.face_info.score = entity::face_info::DEFAULT_SCORE;

    check_add_face_info_param(&req.face_info).await?;

    match face_info_service::add_face_info(&req.face_info).await {
        Ok(_) => Ok(HttpResponse::Ok().json(AddFaceInfoResp {
            face_info_id: req.face_info.id.clone(),
        })),
        Err(err) => {
            log::error!("Error: {:?}", err);
            HttpResponse::InternalServerError().await
        }
    }
}

#[post("/vote_face_info")]
pub async fn vote_face_info(req: web::Json<VoteFaceInfoReq>) -> Result<impl Responder, Error> {
    info!("req: {:?}", &req);

    if req.win_face_info_id.is_empty() || req.lose_face_info_id.is_empty() {
        return Err(ErrorBadRequest("face_info_id is required!"));
    };

    // Step 1: find corresponding face_info
    let filter_doc = doc! {
        "id" :{"$in": [req.win_face_info_id.as_str(), req.lose_face_info_id.as_str()]}
    };
    let face_info_map: HashMap<String, FaceInfo> =
        match face_info_service::get_face_infos_by_doc_filter(filter_doc).await {
            Ok(res) => {
                if res.len() < 2 {
                    return Err(ErrorNotFound("FaceInfo not found!"));
                }

                let mut ret_map = HashMap::new();
                for x in res {
                    ret_map.insert(x.id.clone(), x);
                }
                ret_map
            }
            Err(err) => {
                log::error!("Error: {:?}", err);
                return HttpResponse::InternalServerError().await;
            }
        };

    // Step 2：Calculate Score
    let win_face_info = match face_info_map.get(req.win_face_info_id.as_str()) {
        None => {
            return Err(ErrorNotFound("Winner FaceInfo not found!"));
        }
        Some(win_face_info) => win_face_info,
    };
    let lose_face_info = match face_info_map.get(req.lose_face_info_id.as_str()) {
        None => {
            return Err(ErrorNotFound("Loser FaceInfo not found!"));
        }
        Some(lose_face_info) => lose_face_info,
    };

    let (win_score, lose_score) = compete_uscf(
        win_face_info.score as EloScore,
        lose_face_info.score as EloScore,
        WIN,
    );

    // Step 3：Update Score
    let now = chrono::Utc::now().timestamp();
    if let Err(err) = update_face_info_rating(
        &win_face_info.id,
        win_score as f64,
        true,
        req.voter.as_str(),
        now,
    )
    .await
    {
        log::error!("Error: {:?}", err);
        return HttpResponse::InternalServerError().await;
    }
    if let Err(err) = update_face_info_rating(
        &lose_face_info.id,
        lose_score as f64,
        false,
        req.voter.as_str(),
        now,
    )
    .await
    {
        log::error!("Error: {:?}", err);
        return HttpResponse::InternalServerError().await;
    }

    // Step 4: Add vote logs
    if let Err(err) = add_rating_logs(vec![RatingLog {
        id: resource::id_generator::get_id().await,
        win_face_id: win_face_info.id.clone(),
        loss_face_id: lose_face_info.id.clone(),
        creator: req.voter.clone(),
        created_on: now,
        ..RatingLog::default()
    }])
    .await
    {
        log::error!("Error: {:?}", err);
    }

    Ok(HttpResponse::Ok().json(()))
}

async fn check_add_face_info_param(face_info: &FaceInfo) -> Result<(), Error> {
    if face_info.id.is_empty() {
        return Err(ErrorInternalServerError("generate id failed"));
    }

    if face_info.file_id.is_empty() {
        return Err(ErrorBadRequest("file id is empty"));
    }

    if face_info.star_name.is_empty() {
        return Err(ErrorBadRequest("start name is empty"));
    }

    Ok(())
}
```

src/controller/file_controller.rs

```rust
use actix_multipart::Multipart;
use actix_web::{get, post, web, Error, HttpResponse, Responder};
use mongodb::bson::doc;
use serde::{Deserialize, Serialize};

use service::{face_info_service, file_resource_service};

use crate::entity::file_resource::{FileResource, UriType};
use crate::{resource, service, utils};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateFileResourceByStreamResp {
    file_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateFileResourceReq {
    file_resource: FileResource,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateFileResourceResp {
    file_resource_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DownloadFileReq {
    face_info_id: String,
}

#[post("/create_file_resource_by_stream")]
pub async fn create_file_resource_by_stream(payload: Multipart) -> Result<HttpResponse, Error> {
    info!("create_file_resource_by_stream start");

    // Step 0: Generate id
    let file_resource_id = resource::id_generator::get_id().await;

    // Step 1: Save the file & calculate md5 hash
    let file_name = match service::file_resource_service::create_file_resource_with_stream(
        payload,
        &file_resource_id,
    )
    .await
    {
        Ok(file_name) => file_name,
        Err(err) => {
            error!("Failed to save_file, error: {:?}", err);
            return HttpResponse::InternalServerError().await;
        }
    };
    let file_uri = file_resource_service::get_local_filepath(&file_resource_id, &file_name);
    let file_md5 = match utils::md5::get_file_md5(&file_uri).await {
        Ok(file_md5) => file_md5,
        Err(err) => {
            error!("Failed to get_file_md5, error: {:?}", err);
            return HttpResponse::InternalServerError().await;
        }
    };

    info!(
        "Saving file success, file_name: {:?}, md5: {:?}",
        file_name, file_md5
    );

    // Step 2: Check file md5 is repeated
    match face_info_service::get_one_face_info_by_doc_filter(doc! {"md5": &file_md5}).await {
        Ok(res) => match res {
            None => {
                info!("Saving file success, file_uri: {:?}", file_uri);
            }
            Some(_) => {
                error!("File has already been saved!");

                file_resource_service::delete_file(&file_uri).await;
                info!(
                    "Delete file success, file_name: {:?}, md5: {:?}",
                    file_name, file_md5
                );

                return HttpResponse::Forbidden().await;
            }
        },
        Err(err) => {
            error!("Failed to get_one_face_info_by_doc, error: {:?}", err);
            return HttpResponse::InternalServerError().await;
        }
    };

    // Step 3：Save file_resource
    match file_resource_service::create_file_resource(&FileResource {
        id: file_resource_id.clone(),
        md5: file_md5,
        created_on: chrono::Utc::now().timestamp(),
        file_name,
        file_uri,
        ..FileResource::default()
    })
    .await
    {
        Ok(_) => Ok(HttpResponse::Ok().json(CreateFileResourceByStreamResp {
            file_id: file_resource_id,
        })),
        Err(err) => {
            log::error!("Error: {:?}", err);
            HttpResponse::InternalServerError().await
        }
    }
}

#[post("/create_file_resource")]
pub async fn create_file_resource(
    mut req: web::Json<CreateFileResourceReq>,
) -> Result<impl Responder, Error> {
    info!("req: {:?}", &req);

    let file_resource_id = resource::id_generator::get_id().await;
    req.file_resource.id = file_resource_id;
    req.file_resource.created_on = chrono::Utc::now().timestamp();

    check_create_file_resource_req(&req.file_resource).await?;

    match file_resource_service::create_file_resource(&req.file_resource).await {
        Ok(_) => Ok(HttpResponse::Ok().json(CreateFileResourceResp {
            file_resource_id: req.file_resource.id.clone(),
        })),
        Err(err) => {
            log::error!("Error: {:?}", err);
            HttpResponse::InternalServerError().await
        }
    }
}

async fn check_create_file_resource_req(file_resource: &FileResource) -> Result<(), Error> {
    match file_resource.uri_type {
        UriType::Local => {}
        UriType::Url => {}
    };

    Ok(())
}

#[get("/download_local_file/{face_info_id}")]
pub async fn download_local_file(
    req: actix_web::HttpRequest,
    face_info_id: web::Path<String>,
) -> Result<HttpResponse, actix_web::Error> {
    info!("req: {:?}", &req);

    let face_info_id = face_info_id.into_inner();

    if face_info_id.is_empty() {
        info!("not found face_info, face_info_id is empty");
        return HttpResponse::NotFound().await;
    }

    // Step 1: Find face info
    let face_info = match face_info_service::get_one_face_info_by_doc_filter(
        doc! {"id": &face_info_id},
    )
    .await
    {
        Ok(face_info) => match face_info {
            None => {
                info!("face_info not found, face_info_id: {:?}", face_info_id);
                return HttpResponse::NotFound().await;
            }
            Some(face_info) => face_info,
        },
        Err(err) => {
            log::error!("Error: {:?}", err);
            return HttpResponse::InternalServerError().await;
        }
    };

    // Step 2: Get file
    let file_resource_info = match file_resource_service::get_one_file_resource_by_doc_filter(
        doc! {"id": &face_info.file_id},
    )
    .await
    {
        Ok(file_resource_info) => match file_resource_info {
            None => {
                info!(
                    "file_resource_info not found, file_id: {:?}",
                    face_info.file_id
                );
                return HttpResponse::NotFound().await;
            }
            Some(file_resource_info) => file_resource_info,
        },
        Err(err) => {
            log::error!("Error: {:?}", err);
            return HttpResponse::InternalServerError().await;
        }
    };

    let file = actix_files::NamedFile::open_async(file_resource_info.file_uri)
        .await
        .unwrap();
    Ok(file.into_response(&req))
}
```

都是一些看代码就能看懂的简单业务逻辑，这里不再赘述；

至此，我们的服务自底向上已经完全实现了！

<br/>

## **CI&CD**

### **Pre-Commit**

`pre-commit` 是 `git hooks` 的一个子集，实现在提交代码审查之前，Git Hooks 脚本可用于处理简单问题；

我们在每次提交时运行我们的钩子，以自动指出代码中的问题，例如：缺少分号，尾随空格和调试语句等；

可以使用 `pip` 安装：

```bash
pip install pre-commit
```

Mac 用户也可以使用 `brew` 安装：

```bash
brew install pre-commit
```

在项目中，我们可以创建一个 `.pre-commit-config.yaml` 来设置配置，例如：

.pre-commit-config.yaml

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.0.1
    hooks:
      - id: check-merge-conflict
      - id: check-toml
      - id: check-yaml
      - id: trailing-whitespace
        args: [ --markdown-linebreak-ext=md ]

  - repo: local
    hooks:
      - id: make-fmt
        name: make fmt
        entry: make fmt
        language: system

```

然后使用 `pre-commit install` 来安装这些 Hooks；

那么当我们 Commit 的时候，会先执行这些脚本，校验通过后才会 Commit 成功；

例如：

```bash
$ git commit -m "fix: typo"
[INFO] Installing environment for https://github.com/pre-commit/pre-commit-hooks.
[INFO] Once installed this environment will be reused.
[INFO] This may take a few minutes...
git push
Check for merge conflicts................................................Passed
Check Toml...........................................(no files to check)Skipped
Check Yaml...........................................(no files to check)Skipped
Trim Trailing Whitespace.................................................Passed
make fmt.................................................................Passed
[dev 812dbe1] fix: typo
 2 files changed, 1 insertion(+), 2 deletions(-)
```

<br/>

### **Github Actions**

我们可以在 `.github/workflows/` 目录下创建 YAML 配置，来集成 Github Actions 帮助我们完成 CI、甚至 CD 的工作！

例如：可以执行 `cargo clippy`、`cargo test` 来校验我们的代码、单测等；

下面是我的一些配置供你参考：

.github/workflows/ci.yaml

```yaml
name: CI

on:
  workflow_dispatch:
  push:
    paths-ignore:
      - '**.md'
    branches-ignore:
      - jupyter
  pull_request:
    paths-ignore:
      - '**.md'
    branches-ignore:
      - jupyter

env:
  RUST_TOOLCHAIN: nightly
  TOOLCHAIN_PROFILE: minimal

jobs:
  lints:
    name: Run cargo fmt and cargo clippy
    runs-on: ubuntu-latest
    steps:
      - name: Checkout sources
        uses: actions/checkout@v2
      - name: Install toolchain
        uses: actions-rs/toolchain@v1
        with:
          profile: ${{ env.TOOLCHAIN_PROFILE }}
          toolchain: ${{ env.RUST_TOOLCHAIN }}
          override: true
          components: rustfmt, clippy
      - name: Cache
        uses: Swatinem/rust-cache@v1
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
        uses: actions/checkout@v2
      - name: Install toolchain
        uses: actions-rs/toolchain@v1
        with:
          profile: ${{ env.TOOLCHAIN_PROFILE }}
          toolchain: ${{ env.RUST_TOOLCHAIN }}
          override: true
      - name: Cache
        uses: Swatinem/rust-cache@v1
      #      - name: Run cargo test --no-run
      #        uses: actions-rs/cargo@v1
      #        with:
      #          command: test --no-run
      - name: Run cargo test
        uses: actions-rs/cargo@v1
        env:
          RUST_TEST_THREADS: 8
        with:
          command: test
```

主要是完成 clippy、test 的工作；

>   **得益于 Cargo 强大的工具链，我们可以很轻松的完成这些功能！**

下面是本项目的 CI：

-   https://github.com/FacemashHub/facemash-backend/actions

<br/>

### **Docker镜像**

说到部署，我们当然是要打包为镜像进行部署；

**Docker 在 17.05 版本之后主持了分多阶段构建，也就是说，我们可以使用一个统一的编译镜像对我们的代码进行测试、编译；**

**并将编译后的产物拉取到另一个纯净的镜像中，减小镜像体积并提供统一的编译环境！**

通常情况下 Rust 编译选择的是这个镜像：`ekidd/rust-musl-builder:latest`；

然后部署的时候可以选择一个非常小的镜像，例如：[scratch](https://hub.docker.com/_/scratch)

下面是本项目中的 Dockerfile：

```dockerfile
FROM ekidd/rust-musl-builder:latest AS builder
COPY --chown=rust:rust . ./
RUN cargo build --release

FROM scratch
WORKDIR /facemash-backend
COPY --from=builder /home/rust/src/target/x86_64-unknown-linux-musl/release/facemash-backend ./
COPY .env ./.env
EXPOSE 8080
CMD ["./facemash-backend"]
```

**上面第一部分用于编译，下面的部分使用上面编译的结果，生成最终的镜像！**

>   **这个项目用这种方法构建完的最终镜像大小只有 20M！可以说是非常小了！**

<br/>

## **后记**

上面简要介绍了一个完整的 Rust 服务端项目的开发过程，相信你能够学到不少的东西；

得益于 Rust 超级稳定的性能，目前这个服务已经在我的服务器上跑了将近 2 个月的时间，而内存占用也只有 1.8M，可以说非常的小！

<br/>

# **附录**

源代码：

-   https://github.com/orgs/FacemashHub/repositories

文章参考：

-   https://sylvanassun.github.io/2017/07/19/2017-07-19-FaceMash/
-   https://zho.tidewaterschool.org/657344-facemash-algorithm-FVWCMC
-   https://www.361shipin.com/blog/1514328900220485632
-   https://en.wikipedia.org/wiki/Elo_rating_system#Mathematical_details

<br/>
