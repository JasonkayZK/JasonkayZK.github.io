---
title: 使用gowatch热部署提升你的开发效率
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?14'
date: 2020-09-23 21:06:47
categories: Golang
tags: [Golang]
description: 相信大家在进行前端开发的时候，都使用过热部署；修改完代码，保存一下即可看到效果；而现在Golang也可以实现这样的功能了；只需要使用gowatch即可!
---

相信大家在进行前端开发的时候，都使用过热部署；修改完代码，保存一下即可看到效果；

而现在Golang也可以实现这样的功能了；只需要使用gowatch即可!


源代码: 

- https://github.com/silenceper/gowatch

<br/>

<!--more-->

<br/>

## 使用gowatch热部署提升你的开发效率

gowatch的使用方法非常简单：

首先使用下面的命令安装gowatch：

```go
go get -u github.com/silenceper/gowatch
```

然后将在gowatch二进制添加到系统PATH变量中；

><br/>
>
>确保在命令行输入gowatch可以执行；

然后在项目根目录中使用gowatch命令即可：

```bash
cd /path/to/myapp
gowatch
```

gowatch会监视文件事件，每次创建/修改/删除文件时，它都会构建并重新启动应用程序；

如果go build返回错误，gowatch会将错误记录在stdout中；

<BR/>

### 支持的命令选项

-   -o： 非必须，指定编译出的二级制文件路径；
-   -p： 非必须，指定要编译的包（也可以是单个文件）；
-   -args：非必须，指定程序运行时参数，例如：`-args ='-host =：8080，-name = demo'`
-   -v：非必须，显示gowatch版本信息；

例如：

```bash
gowatch -o ./bin/demo -p ./cmd/demo
```

 <BR/>

### 配置文件

在大多数情况下，都无需指定配置，并可以通过直接执行gowatch命令来满足大多数要求；

如果要使用配置文件，可以在执行目录中创建`gowatch.yml`文件：

```yaml
# gowatch.yml 配置示例

# 当前目录执行下生成的可执行文件的名字，默认是当前目录名
appname: "test"
# 指定编译后的目标文件目录
output: /bin/demo
# 需要追加监听的文件名后缀，默认只有'.go'文件
watch_exts:
    - .yml
# 需要监听的目录，默认只有当前目录
watch_paths:
    - ../pk
# 在执行命令时，需要增加的其他参数
cmd_args:
    - arg1=val1
# 在构建命令时，需要增加的其他参数
build_args:
    - -race
# 需要增加环境变量，默认已加载当前环境变量
envs:
    - a=b
# 是否监听 ‘vendor’ 文件夹下的文件改变
vendor_watch: false
# 不需要监听的目录名字
excluded_paths:
    - path
# main 包路径，也可以是单个文件，多个文件使用逗号分隔
build_pkg: ""
# build tags
build_tags: ""

#在build app执行的命令 ，例如 swag init	
#prev_build_cmds:	
#  - swag init

# 是否禁止自动运行
disable_run: false
```

<BR/>


## 附录

源代码: 

- https://github.com/silenceper/gowatch

<br/>