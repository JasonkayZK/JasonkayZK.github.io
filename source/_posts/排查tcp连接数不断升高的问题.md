---
title: 排查tcp连接数不断升高的问题
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?11'
date: 2022-08-08 21:13:48
categories: 技术杂谈
tags: [技术杂谈]
description: 最近发生了一件“怪事”，我的服务器TCP连接数每天都在以一个速度上涨，这肯定是哪里一直在进行长连接没有关。最近一直比较忙，今天晚上抽空看了一下，解决了。
---

最近发生了一件“怪事”，我的服务器TCP连接数每天都在以一个速度上涨，这肯定是哪里一直在进行长连接没有关；

最近一直比较忙，今天晚上抽空看了一下，解决了；

<br/>

<!--more-->

# **排查tcp连接数不断升高的问题**

最开始接口是在云函数上部署的，由于博客的访问量不大，所以没多长时间 pod 就被 kill 掉了，所以即使有 tcp 连接泄露也没被发现…；

但是最近云函数开始收费，并且再也没有免费额度了，所以就把服务又迁回了自己的服务器上；

所以 TCP 泄露的 bug 就显露了出来；

出现的问题如下，可以看到 TCP 连接数不停的上升；

![](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/blog_tcp.png)

最开始以为只是 Redis 的连接一直没有释放，后面发现原来是 MongoDB 的连接也一直没有释放！

<br/>

## **配置Redis连接**

最开始觉得是 Redis 连接的问题，所以修改了 Redis 的配置：

```diff
# Close the connection after a client is idle for N seconds (0 to disable)
- timeout 0
+ timeout 3600

# TCP keepalive.
#
# If non-zero, use SO_KEEPALIVE to send TCP ACKs to clients in absence
# of communication. This is useful for two reasons:
#
# 1) Detect dead peers.
# 2) Force network equipment in the middle to consider the connection to be
#    alive.
#
# On Linux, the specified value (in seconds) is the period used to send ACKs.
# Note that to close the connection the double of the time is needed.
# On other kernels the period depends on the kernel configuration.
#
# A reasonable value for this option is 300 seconds, which is the new
# Redis default starting with Redis 3.2.1.
- # tcp-keepalive 60 
+ tcp-keepalive 60
```

-   将 `timeout` 配置为 3600：允许连接最多空闲一个小时；
-   将 `tcp-keepalive` 配置为 `60`：启用长链接，但每分钟检查一次长链接状态；

配置完毕后重启 Redis 服务；

最开始以为问题解决了，但是过了几天，tcp 连接还是在飙升；

<br/>

## **查看TCP连接**

这次认真排查了一下；

首先，查看同时连接到哪个服务器的 IP 比较多：

```bash
netstat -an|awk -F: '{print $2}'|sort|uniq -c|sort -nr|head
```

发现了大量的 `127.0.0.1`，说明确实是本地的 TCP 连接泄露；

随后，查看有多少已经建立了双向连接的 TCP：

```bash
 netstat -npt | grep ESTABLISHED | wc -l
```

发现有上千个，确定了的确是 TCP 连接没有释放的问题；

随后查看 MongoDB 端口连接情况：

```bash
 netstat -an | grep :<mongodb-port> | sort
```

结果直接被大量 `ESTABLISHED` 状态的连接刷屏，确认是 MongoDB 连接的泄露；

检查代码发现 node 服务中创建的 mongodb client 一直没有释放连接；

于是修改代码，加上 `client.close()`；

通过：

```bash
lsof -i:<service-port>
```

找到服务端口对应进程 PID，直接 kill 掉，然后重启服务；

观察一段时间后，发现 TCP 连接正常了！

<br/>

# **附录**

参考文章：

-   https://segmentfault.com/a/1190000013253988
-   https://learnku.com/articles/24360
-   https://www.runoob.com/w3cnote/linux-check-port-usage.html

<br/>
