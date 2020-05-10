---
title: Golang依赖管理gomod
cover: http://api.mtyqx.cn/api/random.php?92
date: 2020-05-10 17:07:14
categories: Golang
tags: [Golang, Gomod]
description: 随着go modules在go1.11版推出，go1.12版功能不断改进，再到go1.13版完善优化，Go Modules基本成为了官方推荐的包依赖管理工具了
---

随着go modules在go1.11版推出，go1.12版功能不断改进，再到go1.13版完善优化，Go Modules基本成为了官方推荐的包依赖管理工具了

本篇讲解了gomod的基本使用;

本文节选自: [GO 依赖管理工具go Modules（官方推荐）](https://blog.csdn.net/guyan0319/article/details/101783164)

<br/>

<!--more-->

**目录:**

<!-- toc -->

<br/>

## Golang依赖管理gomod

Go Modules是官方正式推出的包依赖管理项目，由Russ Cox （即Go 现在的掌舵人）推动;

>   <br/>
>
>   对于Golang的另一个依赖管理工具Dep目前则处于“official experiment”阶段;

### Go Modules特点

#### 介绍

Go modules**出现的目的之一就是为了解决 GOPATH 的问题，也就相当于是抛弃 GOPATH 了**

**[以前项目必须在`$GOPATH/src`里进行，现在Go允许在`$GOPATH/src`外的任何目录下使用 go.mod 创建项目]**

随着模块一起推出的还有模块代理协议（Module proxy protocol），通过这个协议我们可以实现 Go 模块代理（Go module proxy），也就是依赖镜像

><br/>
>
>**可以使用国内的代理下载相关的依赖;**
>
>**在国内各种墙的背景下,有的时候go get能让你怀疑人生~**

****

#### 版本

Go Modules的Tag必须遵循语义化版本控制，如果没有则将忽略 Tag，然后根据你的 Commit 时间和哈希值再为你生成一个假定的符合语义化版本控制的版本号

**Go modules 还默认认为，只要你的主版本号不变，那这个模块版本肯定就不包含Breaking changes**(因为语义化版本控制就是这么规定的)

****

#### 模块缓存

Global Caching这个主要是针对 Go modules 的全局缓存数据说明，如下：

-   **同一个模块版本的数据只缓存一份，所有其他模块共享使用**
-   **目前所有模块版本数据均缓存在 `$GOPATH/pkg/mod`和 `$GOPATH/pkg/sum`下，未来或将移至 `$GOCACHE/mod`和`$GOCACHE/sum`下( 可能会在当 $GOPATH 被淘汰后)**
-   **可以使用 go clean -modcache 清理所有已缓存的模块版本数据**

>   <br/>
>
>   **其他:**
>
>   <font color="#f00">**在 Go1.11 之后 GOCACHE 已经不允许设置为 off**</font>
>
>   **这也是为了模块数据缓存移动位置做准备，因此大家应该尽快做好适配**

如果你的版本是go1.12或更早版本，建议升级到go1.13，来体验一把go modules;

它能给你带来哪些方面身心的愉悦~

<br/>

### Go Modules相关操作

#### 前提条件

安装或升级Golang到1.13+

****

#### 配置环境变量

需要配置的变量主要有:

```bash
# 修改 GOBIN 路径（可选）
go env -w GOBIN=$HOME/bin
# 打开 Go modules
go env -w GO111MODULE=on
# 设置 GOPROXY
go env -w GOPROXY=https://goproxy.cn,direct
```

><br/>
>
>**关于GOBIN**
>
>GOBIN 程序生成的可执行文件的路径，你可以设置它，也可以不设置;
>
>**默认是个空字符串, 它会链接距离最短的$GOPATH下的./bin文件夹;**
>
>这里多说一句:
>
>**`go install`才会链接到GOBIN;**
>
>**`go build`之后你的可执行文件和你的main.go在同一目录下**

>   <br/>
>
>   **关于go env -w**
>
>   Go1.13新增了 go env -w 用于写入环境变量，而写入的地方是`os.UserConfigDir`所返回的路径
>
>   需要注意的是: <font color="#f00">**go env -w 不会覆写，它不会覆盖系统环境变量**</font>

>   <br/>
>
>   **关于GO111MODULE**
>
>   这个环境变量主要是 Go modules 的开关，主要有以下参数：
>
>   -   **auto**：只在项目包含了 go.mod 文件时启用 Go modules，**在 Go 1.13 中是默认值**，详见[golang.org/issue/31857](golang.org/issue/31857)
>   -   **on**：任何情况下启用 Go modules，**推荐设置，未来版本中的默认值(GOPATH 从此成为历史)**
>   -   **off**：禁用 Go modules


><br/>
>
>**关于GOPROXY**
>
>这个环境变量主要是用于设置 Go 模块代理
>
>**它的值是一个以英文逗号 “,” 分割的 Go module proxy 列表，默认是proxy.golang.org，国内访问不了**
>
>这里要**感谢盛傲飞和七牛云**为中国乃至全世界的 Go 语言开发者提供免费、可靠的、持续在线的且经过CDN加速Go module proxy（`goproxy.cn`）
>
>值列表中的 `direct` 为特殊指示符:
>
><font color="#f00">**direct用于指示 Go 回源到模块版本的源地址去抓取(比如 GitHub 等)**</font>
>
>-   当值列表中上一个 Go module proxy 返回 404 或 410 错误时，Go 自动尝试列表中的下一个;
>-   在遇见`direct`时回源;
>-   遇见 EOF 时终止并抛出类似 `invalid version: unknown revision…`的错误

<br/>

#### module-get和gopath-get

<font color="#f00">**使用go.mod管理依赖会对go get命令产生一定影响**</font>

>   <br/>
>
>   使用`go help module-get` 和 `go help gopath-get` 可分别获取Go modules启用和未启用两种状态下的 go get 的行为

在module-get模式下:

使用 `go get` 拉取新的依赖:

-   拉取最新的版本(优先择取 tag)：`go get golang.org/x/text@latest`
-   拉取 master 分支的最新 commit：`go get golang.org/x/text@master`
-   拉取 tag 为 v0.3.2 的 commit：`go get golang.org/x/text@v0.3.2`
-   拉取 hash 为 342b231 的 commit，最终会被转换为 v0.3.2：`go get golang.org/x/text@342b2e`

使用 `go get -u` 更新现有的依赖;

<br/>

### 项目测试

#### 创建项目

这里我们在`$GOPATH/src`外，创建项目目录

><br/>
>
>**注:**
>
><font color="#f00">**初始化gomod不可在$GOPATH路径下, 否则可能报错!**</font>

例如:

```bash
mkdir ~/go_learn
cd  ~/go_learn
```

新建main.go

```go
package main

import (
	"github.com/gin-gonic/gin"
	"fmt"
)

func main() {
	r := gin.Default()
	r.GET("/ping", func(c *gin.Context) {
		fmt.Println("hello world!")
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
	r.Run() // listen and serve on 0.0.0.0:8080
}
```

在go_learn的根目录下生成go mod

```bash
go mod init go_learn
```

><br/>
>
>**其中:**
>
>go_learn为你的模块名称;
>
><font color="#f00">**由于gomod项目并不在`$GOPATH`下, 所以在引用本地模块时就需要使用到这个模块名**</font>

go.mod的内容类似于:

```
module go_learn

go 1.14
```

go.mod是**启用了 Go moduels 的项目所必须的最重要的文件:**

它**描述了当前项目（也就是当前模块）的元信息，每一行都以一个动词开头**，目前有以下 5 个动词:

-   **module**：用于定义当前项目的模块路径
-   **go**：用于设置预期的 Go 版本
-   **require**：用于设置一个特定的模块版本
-   **exclude**：用于从使用中排除一个特定的模块版本
-   **replace**：用于将一个模块版本替换为另外一个模块版本

这里的填写格式基本为包引用路径+版本号

>   <br/>
>
>   另外比较特殊的是`go $version`，目前从 Go1.13 的代码里来看，还只是个标识作用，暂时未知未来是否有更大的作用

****

#### 构建项目

在go_learn根目录下执行`go build`:

```bash
D:\workspace\go_learn>go build
go: downloading github.com/gin-gonic/gin v1.6.3
go: downloading github.com/mattn/go-isatty v0.0.12
go: downloading github.com/gin-contrib/sse v0.1.0
go: downloading gopkg.in/yaml.v2 v2.2.8
go: downloading github.com/golang/protobuf v1.3.3
go: downloading github.com/go-playground/validator/v10 v10.2.0
go: downloading github.com/ugorji/go v1.1.7
go: downloading github.com/ugorji/go/codec v1.1.7
go: downloading github.com/leodido/go-urn v1.2.0
go: downloading github.com/go-playground/universal-translator v0.17.0
go: downloading github.com/go-playground/locales v0.13.0
......
```

此时会从GOPROXY开始依次尝试下载依赖包;

完成后项目目录结构如下:

```bash
 D:\workspace\go_learn>dir
 
2020/05/10  18:49    <DIR>          .
2020/05/10  18:49    <DIR>          ..
2020/05/10  18:28                71 go.mod
2020/05/10  18:28             4,360 go.sum
2020/05/10  18:49        14,727,680 go_learn.exe
2020/05/10  18:28               284 main.go
```

项目中增加了go.sum和二进制文件go_learn.exe;

go.sum文件内容:

```
github.com/davecgh/go-spew v1.1.0/go.mod h1:J7Y8YcW2NihsgmVo/mv3lAwl/skON4iLHjSsI+c5H38=
github.com/davecgh/go-spew v1.1.1 h1:vj9j/u1bqnvCEfJOwUhtlOARqs3+rkHYY13jYWTU97c=
github.com/davecgh/go-spew v1.1.1/go.mod h1:J7Y8YcW2NihsgmVo/mv3lAwl/skON4iLHjSsI+c5H38=
github.com/gin-contrib/sse v0.1.0 h1:Y/yl/+YNO8GZSjAhjMsSuLt29uWRFHdHYUb5lYOV9qE=
github.com/gin-contrib/sse v0.1.0/go.mod h1:RHrZQHXnP2xjPF+u1gW/2HnVO7nvIa9PG3Gm+fLHvGI=
github.com/gin-gonic/gin v1.6.3 h1:ahKqKTFpO5KTPHxWZjEdPScmYaGtLo8Y4DMHoEsnp14=
......
```

go.sum类似于比如dep的 Gopkg.lock的文件，它详细罗列了当前项目直接或间接依赖的所有模块版本，并写明了那些模块版本的 SHA-256 哈希值以备 Go在今后的操作中保证项目所依赖的那些模块版本不会被篡改

我们可以看到一个模块路径可能有如下两种：

```
github.com/davecgh/go-spew v1.1.1 h1:vj9j/u1bqnvCEfJOwUhtlOARqs3+rkHYY13jYWTU97c=
github.com/davecgh/go-spew v1.1.1/go.mod h1:J7Y8YcW2NihsgmVo/mv3lAwl/skON4iLHjSsI+c5H38=
```

前者为 Go modules 打包整个模块包文件 zip 后再进行 hash 值，而后者为针对 go.mod 的 hash 值

**他们两者，要不就是同时存在，要不就是只存在 go.mod hash**

><br/>
>
>**注: 不存在zip hash而只存在gomod hash的情况**
>
>当Go认为肯定用不到某个模块版本的时候就会省略它的 zip hash，就会出现不存在 zip hash，只存在 go.mod hash 的情况
>

此外go.mod文件内容发生了变化，增加了:

```
require github.com/gin-gonic/gin v1.6.3
```

<font color="#f00">**默认使用最新版本的package**</font>

****

#### 更换依赖版本

查看gin所有历史版本:

```bash
go list -m -versions github.com/gin-gonic/gin 
github.com/gin-gonic/gin v1.1.1 v1.1.2 v1.1.3 v1.1.4 v1.3.0 v1.4.0 v1.5.0 v1.6.0 v1.6.1 v1.6.2 v1.6.3
```

如果想更换依赖版本，比如v1.5.0，怎么办？

只需执行如下命令:

```bash
# 修改依赖版本
go mod edit -require="github.com/gin-gonic/gin@v1.5.0"
# 更新现有依赖
go mod tidy 
```

@后跟版本号，这个时候go.mod已经修改好了

```
require github.com/gin-gonic/gin v1.5.0
```

****

#### 其他命令

查看所有项目依赖的包

```bash
go list -m all
go_learn
github.com/davecgh/go-spew v1.1.1
github.com/gin-contrib/sse v0.1.0
github.com/gin-gonic/gin v1.6.3
github.com/go-playground/assert/v2 v2.0.1
github.com/go-playground/locales v0.13.0
github.com/go-playground/universal-translator v0.17.0
github.com/go-playground/validator/v10 v10.2.0
github.com/golang/protobuf v1.3.3
github.com/google/gofuzz v1.0.0
github.com/json-iterator/go v1.1.9
github.com/leodido/go-urn v1.2.0
github.com/mattn/go-isatty v0.0.12
github.com/modern-go/concurrent v0.0.0-20180228061459-e0a39a4cb421
github.com/modern-go/reflect2 v0.0.0-20180701023420-4b7aa43c6742
github.com/pmezard/go-difflib v1.0.0
github.com/stretchr/objx v0.1.0
github.com/stretchr/testify v1.4.0
github.com/ugorji/go v1.1.7
github.com/ugorji/go/codec v1.1.7
golang.org/x/sys v0.0.0-20200116001909-b77594299b42
golang.org/x/text v0.3.2
golang.org/x/tools v0.0.0-20180917221912-90fa682c2a6e
gopkg.in/check.v1 v0.0.0-20161208181325-20d25e280405
gopkg.in/yaml.v2 v2.2.8
```

<br/>

### 快速迁移项目至Go Modules

在你项目的根目录下执行 go mod init 项目名 （项目名可不加, 默认为父级目录名），以生成 go.mod 文件

执行 `go mod tidy`  更新整理现有的依赖，删除未使用的依赖

<br/>

### gomod命令小结

| **命令**             | **说明**                                                     |
| -------------------- | ------------------------------------------------------------ |
| `go mod download`    | 下载 go.mod 文件中指明的所有依赖                             |
| `go mod tidy`        | 整理现有的依赖，删除未使用的依赖                             |
| `go mod graph`       | 查看现有的依赖结构                                           |
| `go mod init`        | 生成 go.mod 文件<br />(Go 1.13 中唯一一个可以生成 go.mod 文件的子命令) |
| `go mod edit`        | 编辑 go.mod 文件                                             |
| `go mod vendor`      | 导出现有的所有依赖<br />(事实上 Go modules 正在淡化 Vendor 的概念) |
| `go mod verify`      | 校验一个模块是否被篡改过                                     |
| `go clean -modcache` | 清理所有已缓存的模块版本数据                                 |
| `go mod`             | 查看所有 go mod的使用命令                                    |

#### go mod vendor说明

最后想再说一下vendor:

使用goverdor来管理项目依赖包时, 如果`GOPATH`中本身没有项目的依赖包，则需要通过`go get`先下载到GOPATH中，再通过`govendor add +external`拷贝到`vendor`目录中

Go 1.6以上版本默认开启GO15VENDOREXPERIMENT环境变量

而在使用gomod管理依赖包时默认是不会下载到项目目录中的**(如上例子使用`go build`后, 目录中并没有依赖文件)**

个人觉得使用gomod管理依赖时有点像Java的Maven;

<br/>

但是有时候还是需要将依赖加入到项目的, 比如:

构建的环境无法连接其他网络或者无法连接一些依赖库下载对应依赖时(**尤其是国内这种恶劣的开发环境**), 将**依赖直接导出到项目目录直接进行构建**就显得尤为重要了!

在上面的例子之上通过`go mod verdor`命令将依赖导入到项目目录:

```bash
D:\workspace\go_learn>go mod vendor
go: downloading golang.org/x/sys v0.0.0-20200116001909-b77594299b42

D:\workspace\go_learn>dir

2020/05/10  20:08                71 go.mod
2020/05/10  20:08             4,360 go.sum
2020/05/10  18:49        14,727,680 go_learn.exe
2020/05/10  18:28               284 main.go
2020/05/10  20:36    <DIR>          vendor
```

可以看到, 项目目录中多了一个verdor目录;

**在提交代码时, 加入verdor目录, 则在构建部署时就无需再次拉取依赖了;**

**当然坏处就是整个项目变得特别臃肿~**

<br/>

## 附录

测试代码源码:

-   https://github.com/JasonkayZK/Go_Learn/tree/go-mod-demo

文章参考：

-   [GO 依赖管理工具go Modules（官方推荐）](https://blog.csdn.net/guyan0319/article/details/101783164)
-   https://segmentfault.com/a/1190000020522261
-   https://learnku.com/articles/27401

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>