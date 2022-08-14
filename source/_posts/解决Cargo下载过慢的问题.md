---
title: 解决Cargo下载过慢的问题
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?55'
date: 2022-08-14 22:36:10
categories: Rust
tags: [Rust, 软件安装与配置, Cargo]
description: 更改 cargo 的源来加速；
---

更改 cargo 的源来加速；

<br/>

<!--more-->

# **解决Cargo下载过慢的问题**

打开 cargo 目录，默认在 `~/.cargo` 下：

```bash
cd ~/.cargo
```

创建 config 文件：

```bash
vim config
```

增加下面的代码：

```bash
# 放到 `$HOME/.cargo/config` 文件中
[source.crates-io]
registry = "https://github.com/rust-lang/crates.io-index"

# 替换成你偏好的镜像源
replace-with = 'sjtu'
#replace-with = 'ustc'

# 清华大学
[source.tuna]
registry = "https://mirrors.tuna.tsinghua.edu.cn/git/crates.io-index.git"

# 中国科学技术大学
[source.ustc]
registry = "git://mirrors.ustc.edu.cn/crates.io-index"

# 上海交通大学
[source.sjtu]
registry = "https://mirrors.sjtug.sjtu.edu.cn/git/crates.io-index"

# rustcc社区
[source.rustcc]
registry = "git://crates.rustcc.cn/crates.io-index"
```

保存即可！

<br/>
