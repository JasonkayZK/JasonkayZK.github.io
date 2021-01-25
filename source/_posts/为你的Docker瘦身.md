---
title: 为你的Docker瘦身
cover: https://acg.toubiec.cn/random?91
date: 2020-04-26 19:36:59
categories: Docker
tags: [Docker]
description: 使用Docker时间长之后, 由于docker在删除容器时不会删除容器的volume(在本地的目录映射), 所以可能会出现闲置的volume; 本文教你如何删除那些无用的volume;
toc: true
---

使用Docker时间长之后, 由于docker在删除容器时不会删除容器的volume(在本地的目录映射), 所以可能会出现闲置的volume; 本文教你如何删除那些无用的volume;

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## 为你的Docker瘦身

当使用了一段时间的Docker后, 容器建建删删, 导致本地出现了很多的volume映射, 如:

```bash
zk@zk:~/workspace/blog$ docker volume ls
DRIVER              VOLUME NAME
local               5f721f54218c36b265cdad4248ee0183aac04e350ae7c1f77a6778e716ac926d
local               7c4929d538fb7d362c92609b6374fda9990fa460b28af239104661f212080bcd
local               b720909c2cffe69274f19216d64f46305cb16f1d85ecb145898f2ae0f7088462
local               bb07e6af8e09d2be46657e509cb60b51395c19b8391a150edf5d677708c337c0
local               bc0d8821b5fa0f18f54aa4b1e13998e141082c5d052cd5beecd77304594efc24
......
```

<br/>

### 查看 docker 占用的资源

在进行资源清理之前有必要搞清楚 docker 都占用了哪些系统的资源。这需要综合使用不同的命令来完成。

-   **docker container ls：**默认只列出正在运行的容器，-a 选项会列出包括停止的所有容器;
-   **docker image ls：**列出镜像信息，-a 选项会列出 intermediate 镜像(就是其它镜像依赖的层);
-   **docker volume ls：**列出数据卷;
-   **docker network ls：**列出 network;
-   **docker info：**显示系统级别的信息，比如容器和镜像的数量等;

通过这些命令查看 docker 使用的资源情况后，相信你已经决定要清理 docker 占用的一些资源了！

让我们先从那些未被使用的资源开始。

****

### 只删除那些未被使用的资源

Docker 提供了方便的 docker system prune 命令来删除:

-   **已停止的容器**
-   **dangling 镜像**
-   **未被容器引用的 network** 
-   **构建过程中的 cache**

```bash
zk@zk:~/workspace/blog$ docker system prune 
WARNING! This will remove:
  - all stopped containers
  - all networks not used by at least one container
  - all dangling images
  - all dangling build cache

Are you sure you want to continue? [y/N] n
```

><br/>
>
>**dangling images:**
>
> dangling images可以简单的理解为未被任何镜像引用的镜像。
>
>比如在你重新构建了镜像后，那些之前构建的且不再被引用的镜像层就变成了 dangling images;

**安全起见，这个命令默认不会删除那些未被任何容器引用的数据卷**

**如果需要同时删除未被任何容器引用的数据卷，你需要显式的指定 --volumns 参数**

**使用 --all 参数后会删除所有未被引用的镜像而不仅仅是 dangling 镜像**

****

### 删除具体某类资源

在不同在子命令下执行 prune，这样删除的就是某类资源：

-   docker container prune: 删除所有退出状态的容器
-   docker volume prune: 删除未被使用的数据卷
-   docker image prune: 删除 dangling 或所有未被使用的镜像

同时我们也可以通过bash的变量替换来实现相同的效果:

如:

列出dangling volumes：

```bash
docker volume ls -qf dangling=true
```

删除：

```bash
docker volume rm $(docker volume ls -qf dangling=true)
```

****

### 让 docker 回到安装时的状态

这里的 "安装时的状态" 指资源占用情况而不是 docker  的相关配置。这也是一种比较常见的用例，比如笔者就需要在一个干净的 docker  环境中自动化的还原出某天的一个生产环境(使用生产环境的备份数据)用于 bug 调查。让我们一起来看看都需要做些什么？

回想我们前面介绍的 docker system prune --all --force --volumns 命令，**如果在执行这个命令前系统中所有的容器都已停止，那么这个命令就会移除所有的资源！**

好，现在让我们想办法停掉系统中的所有容器。

docker container stop 命令可以停止一个或多个容器，我们只需要把系统中所有在运行的容器罗列出来就可以了。由于 docker 并不介意我们再次停止一个已经停止了的容器，干脆简单粗暴点，直接列出所有的容器(包括已经停止的)！

```bash
# -a 显示所有的容器，-q 只显示数字形式的容器 ID
docker container ls -a -q
668dc3e2f7e0
5d3ca8086b36
19849683b494
```

同样的, 在这里把命令执行的结果作为 docker container stop 命令的参数：

```bash
docker container stop $(docker container ls -a -q)
```

完整的恢复 docker 环境的命令如下：

```bash
docker container stop $(docker container ls -a -q) && docker system prune --all --force --volumns
```

和前面的 prune 命令类似，也可以完全删除某一类资源：

-   删除所有容器：`docker container rm $(docker container ls -a -q)`
-   删除所有镜像：`docker image rm $(docker image ls -a -q)`
-   删除所有数据卷：`docker volume rm $(docker volume ls -q)`
-   删除所有network：`docker network rm $(docker network ls -q)`

<br/>

## 附录

文章参考:

-   [快速清理 Docker 资源，让Docker保持清爽高效！](https://baijiahao.baidu.com/s?id=1603760171088416076&wfr=spider&for=pc)
-   [如何删除所有 docker volumes？](https://cloud.tencent.com/developer/ask/38498)



如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>