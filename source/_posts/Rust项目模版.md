---
title: Rust项目模版
toc: true
cover: 'https://img.paulzzh.com/touhou/random?5'
date: 2022-11-30 11:11:51
categories: Rust
tags: [Rust]
description: 用过npm的前端同学都知道，可以使用模版仓库去创建一个新的前端项目，这样就不用从零开始配置一大堆乱七八糟的东西了。Rust中也可以使用cargo-generate通过模版创建一个项目；本文讲解了如何开发一个Rust项目模版，并基于该模版创建一个新的项目；
---

用过npm的前端同学都知道，可以使用模版仓库去创建一个新的前端项目，这样就不用从零开始配置一大堆乱七八糟的东西了，Rust中也可以使用cargo-generate通过模版创建一个项目；

本文讲解了如何开发一个Rust项目模版，并基于该模版创建一个新的项目；

源代码：

-   https://github.com/JasonkayZK/rust-template

<br/>

<!--more-->

# **Rust项目模版**

## **前言**

最近陆陆续续开了一些新的坑，但是每个 repo 都要重新增加 CI、pre-commit 等等的配置，很是麻烦；

所以就花了半个小时，搞了一个 Rust 项目模版，以后都可以直接用这个模版创建新的坑了～

<br/>

## **一个模板项目**

Rust 模版项目和通常的 Cargo 项目并无什么本质区别，只是在一些需要替换的地方使用 [Handlebars](https://handlebarsjs.com/) 语法做了占位；

这是我创建的模版项目：

```bash
$ tree  
.
├── CHANGELOG.md # 标记迭代内容
├── Cargo.lock
├── Cargo.toml
├── LICENSE
├── Makefile
├── README.md
├── cargo-generate.toml # 重要！cargo-generate 必须用到的文件！
├── rust-toolchain.toml
├── src
    ├── lib.rs
    └── main.rs

7 directories, 11 files
```

下面具体来看；

<br/>

### **定义cargo-generate**

声明项目模板的关键内容就是 `cargo-generate.toml` 配置文件！

**在使用 `cargo generate` 命令时首先就会获取这个里面的配置，生成命令行文件，最后再替换模板中的占位符！**

下面来看这个配置：

```toml
[template]
cargo_generate_version = ">=0.10.0"

[placeholders.gh-username]
type = "string"
prompt = "GitHub username (or organization)"
# The username cannot end with a hyphen, too, but
# this requirement is not captured by the regex at the moment.
regex = "^[A-Za-z0-9][A-Za-z0-9-]{0,38}$"

[placeholders.project-description]
type = "string"
prompt = "Project description"

[conditional.'crate_type == "lib"']
ignore = [ "src/main.rs" ]

[conditional.'crate_type == "bin"']
ignore = [ "src/lib.rs" ]
```

我们声明了 `gh-username`、`project-description` 在后面我们的模版中会用到；

**除了上面我们自己定义的这些变量，cargo-generate 还包括了一些内置的变量，例如：`project-name`、`crate_type` 等，我们可以直接使用：**

-   https://cargo-generate.github.io/cargo-generate/templates/builtin_placeholders.html

同时，下面判断了 crate 的类型：

-   **如果是 lib类型：则移除 `src/main.rs`；**
-   **如果是 bin类型：则移除 `src/lib.rs`；**

<br/>

### **引入变量**

上面定义完了变量之后，我们就可以在项目中使用这些变量；

例如：

Cargo.toml

```toml
[package]
name = "{{project-name}}"
version = "0.1.0"
edition = "2021"
description = "{{project-description}}"
repository = "https://github.com/{{gh-username}}/{{project-name}}"
license-file = "LICENSE"
```

License

```
MIT License

Copyright (c) 2022 {{authors}}
```

甚至可以使用一些条件语句，例如：

.gitignore

```
{% if crate_type == "lib" %}
Cargo.lock
{% endif %}
```

**如果是 lib 类型的 crate 则在 gitignore 中加入此行，否则 bin 类型的 crate 需要提交 Cargo.lock！**

<br/>

### **发布模板**

编写完成后，将代码推到 Github 即可：

-   https://github.com/JasonkayZK/rust-template

<br/>

## **使用模版创建一个新的项目**

使用模版创建新项目需要安装 cargo-generate 工具：

```bash
cargo install cargo-generate
```

随后，直接通过工具安装即可，例如一个 lib 项目：

```bash
$ cargo generate --git https://github.com/JasonkayZK/rust-template --lib

🤷   Project Name: my-lib
🔧   Destination: /Users/JasonkayZK/self-workspace/my-lib ...
🔧   project-name: my-lib ...
🔧   Generating template ...
🤷   Project description: A demo lib.
🤷   GitHub username (or organization): JasonkayZK
[ 1/15]   Done: .github/dependabot.yml                                                                                    [ 2/15]   Done: .github/workflows/ci.yaml                                                                                 [ 3/15]   Done: .github/workflows                                                                                         [ 4/15]   Done: .github                                                                                                   [ 5/15]   Done: .gitignore                                                                                                [ 6/15]   Done: .pre-commit-config.yaml                                                                                   [ 7/15]   Done: CHANGELOG.md                                                                                              [ 8/15]   Done: Cargo.lock                                                                                                [ 9/15]   Done: Cargo.toml                                                                                                [10/15]   Done: LICENSE                                                                                                   [11/15]   Done: Makefile                                                                                                  [12/15]   Done: README.md                                                                                                 [13/15]   Done: rust-toolchain.toml                                                                                       [14/15]   Done: src/lib.rs                                                                                                [15/15]   Done: src                                                                                                       🔧   Moving generated files into: `/Users/JasonkayZK/self-workspace/my-lib`...
💡   Initializing a fresh Git repository
✨   Done! New project created /Users/JasonkayZK/self-workspace/my-lib
```

一个新的项目（坑）即刻初始化完成，可以开始 happy coding 了！

<br/>

## **收藏模版**

如果你觉得某个模版特别好用，你可以将它们收藏；

>   **毕竟不是所有人都能记得住模版仓库的域名；**

创建 `$CARGO_HOME/cargo-generate.toml`：

```bash
$ vi ~/.cargo/cargo-generate.toml
```

增加配置：

```toml
[favorites.default]
git = "https://github.com/JasonkayZK/rust-template"
branch = "main"
```

我给这个模版起的名字为 `default`，如果你有其他场景的模版，可以起名为 `wasm`、`yew-demo` 等等；

随后就可以直接使用了，例如创建一个 bin 项目：

```bash
$ cargo generate default

💡   Using application config: /Users/JasonkayZK/.cargo/cargo-generate.toml
🤷   Project Name: my-bin
🔧   Destination: /Users/JasonkayZK/self-workspace/my-bin ...
🔧   project-name: my-bin ...
🔧   Generating template ...
🤷   Project description: a bin demo.
🤷   GitHub username (or organization): JasonkayZK
[ 1/15]   Done: .github/dependabot.yml                                                                       [ 2/15]   Done: .github/workflows/ci.yaml                                                                    [ 3/15]   Done: .github/workflows                                                                            [ 4/15]   Done: .github                                                                                      [ 5/15]   Done: .gitignore                                                                                   [ 6/15]   Done: .pre-commit-config.yaml                                                                      [ 7/15]   Done: CHANGELOG.md                                                                                 [ 8/15]   Done: Cargo.lock                                                                                   [ 9/15]   Done: Cargo.toml                                                                                   [10/15]   Done: LICENSE                                                                                      [11/15]   Done: Makefile                                                                                     [12/15]   Done: README.md                                                                                    [13/15]   Done: rust-toolchain.toml                                                                          [14/15]   Done: src/main.rs                                                                                  [15/15]   Done: src                                                                                          🔧   Moving generated files into: `/Users/JasonkayZK/self-workspace/my-bin`...
💡   Initializing a fresh Git repository
✨   Done! New project created /Users/JasonkayZK/self-workspace/my-bin
```

可以看到提示：

```
💡   Using application config: /Users/JasonkayZK/.cargo/cargo-generate.toml
```

更多配置见官方文档：

-   https://cargo-generate.github.io/cargo-generate/favorites.html?highlight=default#favorites

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/rust-template

参考：

-   https://github.com/cargo-generate/cargo-generate
-   https://github.com/rust-github/template


<br/>
