---
title: Rust实现WebAssembly初窥
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?66'
date: 2021-10-10 13:19:14
categories: Rust
tags: [Rust, WebAssembly]
description: 最近在学习Rust，而Rust和WebAssembly的结合正在如火如荼的进行着；相比于Go，Rust和WebAssembly的结合可以说是更加成熟，包括了编译优化、甚至编译完成可以一键发布到npm库；本文讲述了如何使用Rust实现一个Hello-World的WebAssembly；
---

最近在学习Rust，而Rust和WebAssembly的结合正在如火如荼的进行着；相比于Go，Rust和WebAssembly的结合可以说是更加成熟，包括了编译优化、甚至编译完成可以一键发布到npm库；

本文讲述了如何使用Rust实现一个Hello-World的WebAssembly；

关于Go实现WebAssembly，见：

-   [初探Go-WebAssembly/](/2020/09/23/初探Go-WebAssembly/)

源代码：

-   https://github.com/JasonkayZK/rust-learn/tree/wasm-hello

<br/>

<!--more-->

# **Rust实现WebAssembly初窥**

## **前言-为什么使用WebAssembly**

目前，WebAssembly主要使用在浏览器中，但是在不久的将来， *wasm* 可能成为在各种环境中，重要的”便携式可执行”格式，十分具有发展前景；

同时，WebAssembly 可以实现，无GC、高性能等特点，可以提高网页性能；

目前 WebAssembly 被广泛应用在：

-   音视频解码，如：视频直播；
-   游戏；
-   Web办公软件，如：CAD软件等；

<br/>

## **前言-为什么选择Rust-WebAssembly？**

关于这个问题网上已经存在很多答案了：

-   https://llever.com/rustwasm-book/why-rust-and-webassembly.zh.html#a%E5%B0%8Fwasm%E5%B0%BA%E5%AF%B8

这里简单总结一下：

-   小体积的`.wasm`：对于Web应用而言，包的体积大小对于网页加载是非常重要的，而Rust本身无GC，包体积可以做的非常小！
-   和JS、TS等深度集成：Rust可以直接支持npm、Webpack等工具！
-   Rust本身的零成本抽象、高性能以及安全性等；

下面，废话不多说，来看一个例子；

<br/>

## **环境准备**

想要开发Rust-Assembly，本地需要安装以下工具：

Rust工具：

-   Rust工具链：rustup、rustc、cargo等，用于编译Rust代码、管理Rust依赖包：[安装 Rust 工具链.](https://www.rust-lang.org/tools/install)；
-   wasm-pack：编译Rust代码到WebAssembly：[安装`wasm-pack`](https://rustwasm.github.io/wasm-pack/installer/)；
-   cargo-generate：使用Git仓库生成Rust项目模板：`cargo install cargo-generate`；

前端工具：

-   Node；
-   Npm；

上面各种工具的安装都比较简单，这里不再赘述；

<br/>

## **编写Rust-WebAssembly项目**

### **使用模板生成项目**

使用下面的命令通过模板创建项目：

```bash
cargo generate --git https://github.com/rustwasm/wasm-pack-template --name hello-wasm
```

随后，生成`hello-wasm`目录：

```bash
.
├── Cargo.toml
├── LICENSE_APACHE
├── LICENSE_MIT
├── README.md
├── src
|  ├── lib.rs
|  └── utils.rs
└── tests
   └── web.rs

directory: 2 file: 7
```

下面详细几个比较重要的文件：

-   Cargo.toml：该`Cargo.toml`文件是`cargo`的 指定依赖项和元数据，Cargo 则是 Rust 的包管理器和构建工具；这个预先配置了一个`wasm-bindgen`依赖项，用于正确初始化`crate-type`并生成`.wasm`库；
-   src/lib.rs：`src/lib.rs`文件 声明了 Rust 项目中的一个包入口，用于编译成 WebAssembly。它用`wasm-bindgen`与 JavaScript 交互；我们可以在该文件中声明需要导出的库函数；
-   src/utils.rs：`src/utils.rs`模块提供了常用的实用函数，让 Rust 编译成 WebAssembly 来得更容易；

下面是`src/lib.rs`的代码：

```rust
mod utils;

use wasm_bindgen::prelude::*;
use crate::utils::set_panic_hook;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    set_panic_hook();
    alert("Hello, hello-wasm in local!");
}
```

我们通过：`extern`引入了JS中的 `alert` 函数，并在 `greet`函数中使用；

最终，greet函数会调用 `alert` 函数，并在浏览器中弹窗通知！

<br/>

### **构建Rust-WebAssembly项目**

使用`wasm-pack`对项目进行构建；

在构建项目时会根据以下步骤：

-   确保我们有 Rust 1.30 或打上版本，通过`rustup`安装`wasm32-unknown-unknown`目标(target)；
-   用`cargo`将我们的 Rust 的源 编译为 WebAssembly 的 `.wasm`二进制文件；
-   为 Rust 生成的 WebAssembly 使用`wasm-bindgen`，生成 JavaScript API；

在项目的根目录执行命令：

```bash
$ wasm-pack build

[INFO]: Checking for the Wasm target...
[INFO]: Compiling to Wasm...
   Compiling proc-macro2 v1.0.29
   ……
   Compiling hello-wasm v0.1.0 (D:\workspace\rust-learn\hello-wasm)
    Finished release [optimized] target(s) in 8.54s
[INFO]: Installing wasm-bindgen...
[INFO]: Optimizing wasm binaries with `wasm-opt`...
[INFO]: Optional fields missing from Cargo.toml: 'description', 'repository', and 'license'. These are not necessary, but recommended
[INFO]: :-) Done in 9.41s
[INFO]: :-) Your wasm pkg is ready to publish at D:\workspace\rust-learn\hello-wasm\pkg.
```

构建完成后，我们可以在`pkg`目录中找到输出：

```bash
.
├── hello_wasm.d.ts
├── hello_wasm.js
├── hello_wasm_bg.js
├── hello_wasm_bg.wasm
├── hello_wasm_bg.wasm.d.ts
├── package.json
└── README.md
```

生成的README由主项目复制而来，下面解释下其他生成的文件：

-   `hello_wasm_bg.wasm`：该`.wasm`文件是 Rust 编译器从 Rust 源代码生成的 WebAssembly 二进制文件；其包含 所有 Rust 函数和数据。例如，它具有导出的”greet”函数；
-   `hello_wasm.js`：该`.js`文件是由`wasm-bindgen`生成的，其用于将 DOM 和 JavaScript 函数导入 Rust，并向 WebAssembly 函数公开一个很好的 API 到 JavaScript；例如，有一个 JavaScript 的`greet`函数，其包裹着从 WebAssembly 模块导出的`greet`函数；
-   `hello_wasm.d.ts`：该文件包含 [TypeScript](http://www.typescriptlang.org/) 的类型声明；
-   `hello_wasm_bg.js` & `hello_wasm_bg.wasm.d.ts`：JS 和 TS的 wasm 接入层代码；
-   `package.json`：npm 包声明文件，用于依赖管理；我们可以一键发布包到npm！

至此，我们的 wasm 项目构建完毕！

<br/>

## **前端项目**

### **使用模板初始化项目**

使用模板创建前端项目：

```bash
npm init wasm-app frontend
```

其目录结构就是一个经典的前端项目：

```bash
.
├── .bin
|  └── create-wasm-app.js
├── .gitignore
├── bootstrap.js
├── index.html
├── index.js
├── package-lock.json
├── package.json
├── README.md
└── webpack.config.js
```

其中，`index.js`就是我们的JS入口；

<br/>

### **引入本地wasm包**

在`hello-wasm/pkg`目录下执行`npm link`，以便本地包可以被其他本地包依赖，而不需要将它们发布到 npm：

```bash
npm link
```

随后，在前端根目录执行导入本地包：

```bash
npm link hello-wasm
```

链接成功后，修改`frontend/index.js`，导入本地包：

```bash
import * as wasm from "hello-wasm";

wasm.greet();
```

至此，整个前端项目成功引入了本地包；

>   **如果是引入发布到wasm-npm包，就更简单了：和其他npm包的引入方式完全一致！**

<br/>

## **启动项目测试**

本地启动前端项目：

```bash
npm run start
```

访问`localhost:8080`，可以看到Alert通知：

```
Hello, hello-wasm in local!
```

说明项目测试通过！

<br/>

## **前端项目热更新**

对于 wasm 项目而言，热更新也是非常的简单；

我们只需要修改 hello-wasm 项目，并使用`wasm-pack build`命令重新编译整个项目，即可实现前端的热更新！

下面，修改文件：

hello-wasm/src/lib.rs

```diff
pub fn greet() {
    set_panic_hook();
-    alert("Hello, hello-wasm in local!");
+    alert("Hello, hello-wasm in local again!");
}
```

并重新编译；

编译完成后，项目即时生效，并输出了：

```
Hello, hello-wasm in local again!
```

可以看到，开发起来还是非常方便的！

<br/>

## **小结**

本文只是抛砖引玉的介绍了rust和wasm相结合，而真正的 WebAssembly 而言是一个非常宏大的项目！

我们甚至可以使用Rust直接像React一样直接开发一个Web应用，见：

-   https://github.com/yewstack/yew

可以预见，在不久的将来，我们的3A大作、甚至是操作系统都可以直接在浏览器中运行；

真正到了那天，我们只需要一个浏览器即可；

<br/>

# **附录**

文章参考：

-   https://llever.com/rustwasm-book/introduction.zh.html
-   https://zhuanlan.zhihu.com/p/104299612
-   https://www.modb.pro/db/46512
-   https://developer.mozilla.org/zh-CN/docs/WebAssembly/Rust_to_wasm


<br/>
