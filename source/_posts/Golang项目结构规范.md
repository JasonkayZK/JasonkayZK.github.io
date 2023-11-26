---
title: 'Golang项目结构规范'
cover: https://img.paulzzh.com/touhou/random?1
date: 2020-05-14 19:39:26
categories: [Golang]
tags: [Golang, 开发规范]
toc: true
description: 在Github仓库中给出了Golang项目的标准目录结构, 本文就来总结这个项目结构规范
---

在[golang-standards/project-layout](https://github.com/golang-standards/project-layout)中给出了Golang项目的标准目录结构规范;

本文就来总结这个项目结构规范;

文章转自：[[译] Go 项目结构规范](https://www.jianshu.com/p/4726b9ac5fb1)

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## 基于Google标准的Golang-Project-Layout

><br/>
>
>为了方便开发大型项目, 我也根据这个规范做了一个Golang的开发模板:
>
>https://github.com/JasonkayZK/Go_Learn/tree/golang-project-layout

>   <br/>
>
>   以下是翻译内容, 具体内容见:
>
>   https://github.com/golang-standards/project-layout

这里列举的是一个 Go 项目的基础布局. 它并不是由 Go 核心开发团队定义的官方标准; 然而, 它是 Go 生态圈中新老项目常用的一组布局模式. 其中一些模式较其他更流行一些. 它也包含一些小的改进以及支持目录, 这在真实世界中足够大的项目里是很常见的.

如果你正准备学习 Go 语言, 或者你只是想验证一些概念, 做个玩具项目, 那使用这套项目布局就有些小题大做了. 从最简单的实现开始 (一个 `main.go` 文件就绰绰有余了). 随着项目逐渐成长, 请记得保持良好的项目结构是一件很重要的事情, 否则结果只会一团乱麻, 代码包含着大量的隐藏依赖和全局状态. 当你的项目有更多人参与的时候, 就需要更多的结构. 这时候引入一种通用的方式来管理包和库就很重要了. 当你管理一个开源项目, 或者当你知道有其他项目会引入你的代码时, 拥有一个私有 private (或叫 `内部 internal`) 的包和代码也很必要. 你可以克隆这个仓库, 留下需要的删掉其他所有文件! 只是因为它们在那儿并不意味着你一定得都用上. 这些模式中没有哪个是每个项目都得用的. 即便是 `vendor` 模式也没那么通用.

在Go 1.14中, `Go Modules`终于可以投入生产了。除非您有特定的原因不使用`Go Modules`，否则请使用Go Modules；因为使用了`Go Modules`就无需担心`$GOPATH`和项目放置位置。仓库中的go.mod文件假定您的项目托管在Github上，但这不是必需的。模块路径可以是任意的，尽管第一个模块路径组件的名称中应带有点（当前版本的Go不再强制使用该点，但是，如果您使用的是稍旧的版本，则在构建失败时不要感到惊讶）。如果您想了解更多信息，请参见问题37554和32819。

下面是一个目录规范的示例：

```bash
.
├─api
├─assets
├─build
│  ├─ci
│  └─package
├─cmd
│  └─app
├─configs
├─deployments
├─docs
├─examples
├─githooks
├─init
├─internal
│  └─app
│      └─_your_app_
├─scripts
├─test
├─third_party
├─tools
├─web
│  ├─app
│  ├─static
│  └─template
└─website
```

这个项目结构刻意做得很通用, 它并没有强套Golang的某一种特定的包结构.

这也是社区努力的成果. 如果你见到一个新模式, 或是认为某个模式需要改进都可以开新的 issue.

如果你需要一些命名, 代码格式化和风格上的帮助, 可以从 [gofmt](https://golang.org/cmd/gofmt/) 及 [golint](https://github.com/golang/lint) 开始. 同时也请确保读过这些 Go 代码规范和建议:

-   https://talks.golang.org/2014/names.slide
-   https://golang.org/doc/effective_go.html#names
-   https://blog.golang.org/package-names
-   https://github.com/golang/go/wiki/CodeReviewComments

参考 [`Go Project Layout`](https://medium.com/golang-learn/go-project-layout-e5213cdcfaa2) 来了解更多背景知识.

还有更多其他关于命名, 包结构组织, 代码结构方面的建议在这里:

-   [GopherCon EU 2018: Peter Bourgon - Best Practices for Industrial Programming](https://www.youtube.com/watch?v=PTE4VJIdHPg)
-   [GopherCon Russia 2018: Ashley McNamara + Brian Ketelsen - Go best practices.](https://www.youtube.com/watch?v=MzTcsI6tn-0)
-   [GopherCon 2017: Edward Muller - Go Anti-Patterns](https://www.youtube.com/watch?v=ltqV6pDKZD8)
-   [GopherCon 2018: Kat Zien - How Do You Structure Your Go Apps](https://www.youtube.com/watch?v=oL6JBUk6tj0)

<br/>

### Go Directories

#### /cmd

该项目的主程序.

每个程序目录的名字应该和可执行文件的名字保持一致 (比如 `/cmd/myapp`).

**不要在程序目录中放太多代码.**

**如果你觉得这些代码会被其他项目引用, 那它们应该被放在 `/pkg` 目录中.**

**如果这些代码不能被重用, 或者说你不希望别人重用这些代码, 那么就把它们放在 `/internal` 目录中.**

你也许会惊讶于别人使用你代码的方式, 所以一定要保持你的意图足够明确!

一般来说一个足够小的 `main` 函数, 用于引入并执行 `/internal` 和 `/pkg` 下的代码就足够了.

例子请参考 [`/cmd`](https://github.com/golang-standards/project-layout/blob/master/cmd/README.md) 目录

#### /internal

程序和库的私有代码. 这里的代码都是你不希望被别的应用和库所引用的.

把你真正的应用代码放在 `/internal/app` 目录 (比如: `/internal/app/myapp`) 把你的应用间共享的代码放在 `/internal/pkg` 目录 (比如: `internal/pkg/myprivlib`)

#### /pkg

可以被其他外部应用引用的代码 (比如: `/pkg/mypubliclib`). 其他项目会引入这些库并期望它们能正常工作, 所以把代码放在这里之前还请三思 :-)

如果你的代码仓库根目录中包含很多非 Go 的组件和目录, 那么把 Go 代码组织到同一个目录下也算是一种方式, 这么做可以让你更轻松地使用不少 Go 工具 (GopherCon EU 2018 里的 [`Best Practices for Industrial Programming`](https://www.youtube.com/watch?v=PTE4VJIdHPg) 有提过这部分的内容 ).

如果你想看看有哪些热门项目使用了这种项目结构可以参考 [`/pkg`](https://github.com/golang-standards/project-layout/blob/master/pkg/README.md) 目录. 这是一种常见的布局模式, 但它并没有被完全接受, 有些 Go 社区并不推荐使用.

#### /vendor

应用的依赖 (手工管理或者是通过你最爱的依赖管理工具像是 [`dep`](https://github.com/golang/dep)).

如果你在构建一个库项目, 那注意不要把依赖也提交上去了.

****

### Service 应用目录

#### /api

OpenAPI/Swagger 规范, JSON schema 文件, 协议定义文件.

例子请参考 [`/api`](https://github.com/golang-standards/project-layout/blob/master/api/README.md)

****

### Web 应用目录

#### /web

Web 应用标准组件: 静态 Web 资源, 服务端模板, 单页应用.

****

### 常规应用目录

#### /configs

配置文件模板或者默认配置.

在这里放置你的 `confd` 或者 `consul-template` 模板文件.

#### /init

系统初始化 (systemd, upstart, sysv) 及进程管理/监控 (runit, supervisord) 配置.

#### /scripts

执行各种构建, 安装, 分析等其他操作的脚本.

这些脚本要保持根级别的 Makefile 小而简单 (比如: https://github.com/hashicorp/terraform/blob/master/Makefile).

例子请参考 [`/scripts`](https://github.com/golang-standards/project-layout/blob/master/scripts/README.md) 目录

#### /build

打包及持续集成.

将 cloud (AMI), container (Docker), OS (deb, rpm, pkg) 包配置放在 `/build/package` 目录下.

将 CI (travis, circle, drone) 配置和脚本放在 `/build/ci` 目录. 需要注意的是, 有些 CI 工具 (比如 Travis CI) 对它们配置文件的位置非常挑剔. 尝试把配置文件放在 `/build/ci` 目录, 然后将它们软链接到 CI 工具希望它们出现的位置 (如果可能的话).

#### /deployments

IaaS, Paas, 系统, 容器编排的部署配置和模板 (docker-compose, kubernetes/helm, mesos, terraform, bosh)

#### /test

额外的外部测试软件和测试数据. 你可以用任意方式自由地组织 `/test` 目录的结构. 大型项目则有必要包含一个 data 子目录. 比如你可以建立 `/test/data` 或者 `/test/testdata` 目录, 如果你希望 Go 忽略里面的内容. 注意, Go 也会忽略任何以 "." 和 "_" 开头的文件和目录, 所以就如何命名测试数据目录而言, 你拥有更多的灵活性.

例子请参考 [`/test`](https://github.com/golang-standards/project-layout/blob/master/test/README.md) 目录.

****

### 其他目录

#### /docs

用户及设计文档 (除了 godc 生成的文档).

例子请参考  [`/docs`](https://github.com/golang-standards/project-layout/blob/master/docs/README.md) 目录.

#### /tools

项目的支持工具. 注意, 这些工具可以引入 `/pkg` 和 `/internal` 目录的代码.

例子请参考 [`/tools`](https://github.com/golang-standards/project-layout/blob/master/tools/README.md) 目录.

#### /examples

应用或者库的示例文件.

例子请参考 [`/examples`](https://github.com/golang-standards/project-layout/blob/master/examples/README.md) 目录.

#### /third_party

外部辅助工具, forked 代码, 以及其他第三方工具 (例如: Swagger UI)

#### /githooks

Git hooks.

#### /assets

其他和你的代码仓库一起的资源文件 (图片, logo 等).

#### /website

如果你不用 Github pages 的话, 这里放置你的项目站点数据.

例子参考 [`/website`](https://github.com/golang-standards/project-layout/blob/master/website/README.md) 目录.

****

### 不应该存在的目录

#### /src

有些 Go 项目确实有个 `src` 目录, 但是这一般发生在从 Java 世界过来的开发者身上, 在那里这是一个很常见的模式. 如果做得到就尽量控制住自己不要采用 Java 的目录模式. 你不会希望你的 Go 代码和 Go 工程看起来像 Java 一样 :-)

不过别搞混项目级别的 `/src` 目录和 Go 本身用作工作空间的 `/src` 目录, 在 [`How to Write Go Code`](https://golang.org/doc/code.html) 有对它的描述. `$GOPATH` 环境变量指向你 (当前) 的工作空间 (在非 Windows 系统中它默认指向 `$HOME/go`). 这个工作空间包括顶层的 `/pkg`, `/bin` 和 `/src` 目录. 你的实际项目最终被放在 `/src` 的一个子目录中, 所以如果你在你的项目中包含 `/src` 目录, 那么你的项目路径看起来会是这个样子 `/some/path/to/workspace/src/your_project/src/your_code.go`. 需要注意的是 尽管 Go 1.11 中你可以把你的项目放在 `GOPATH` 之外, 但采用这种布局模式依然不是个好主意.

****

### 徽章

-   [Go Report Card](https://goreportcard.com/) - 它会使用 `gofmt`, `go vet`, `gocyclo`, `golint`, `ineffassign`, `license` 和 `misspell` 扫描你的代码. 用你自己的项目地址替换掉 `github.com/golang-standards/project-layout` 就可以了.
-   [GoDoc](http://godoc.org/) - 它会提供在线版的 GoDoc 自动生成的文档. 把项目链接改成你自己的就行了.
-   Release - 它会显示你项目的最新版本号. 修改 GitHub 链接指向你自己的项目即可.

<br/>

## 附录

文章转自：[[译] Go 项目结构规范](https://www.jianshu.com/p/4726b9ac5fb1)

<br/>