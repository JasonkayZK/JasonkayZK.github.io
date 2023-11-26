---
title: Docker安装Bytebase
toc: true
cover: 'https://img.paulzzh.com/touhou/random?88'
date: 2022-10-31 13:46:15
categories: Docker
tags: [Docker, Bytebase]
description: Bytebase 是一个数据库CI/CD的解决方案，支持多种数据库；本文讲解了如何使用 Docker 安装Bytebase；
---

Bytebase 是一个数据库CI/CD的解决方案，支持多种数据库；

本文讲解了如何使用 Docker 安装Bytebase；

源代码：

-   https://github.com/JasonkayZK/docker-repo/blob/master/bytebase.sh

官方文档：

-   https://www.bytebase.com/docs/introduction/what-is-bytebase

<br/>

<!--more-->

# **Docker安装Bytebase**

使用 Docker 安装 Bytebase 非常简单；

只需要下面一条命令即可：

```bash
docker run --init -itd \
--name bytebase \
--restart always \
-p 15678:8080 \
--add-host host.docker.internal:host-gateway \
--health-cmd "curl --fail http://localhost:8080/healthz || exit 1" \
--health-interval 5m \
--health-timeout 60s \
-v /root/data/docker-volumn/bytebase/data:/var/opt/bytebase \
bytebase/bytebase:1.7.0 \
--data /var/opt/bytebase \
--port 8080
```

上面的命令，指定了：

-   容器名称：`bytebase`；
-   允许重启；
-   在 15678 端口暴露服务，并且对应容器中的 8080 端口；
-   增加 `host.docker.internal:host-gateway` 配置：根据文档所述，如果数据库和 Bytebase 在同一个 Host 上，则需要加这个配置；
-   心跳检查：每 5 分钟一次，超时时间 60s，命令：`curl --fail http://localhost:8080/healthz || exit 1`；
-   数据挂载：`/root/data/docker-volumn/bytebase/data:/var/opt/bytebase`；

随后指定了镜像版本：`bytebase/bytebase:1.7.0`；

并指定了容器中的参数：

-   数据存放位置：`/var/opt/bytebase`，和上面的挂载目录一致；
-   服务端口：8080，和上面端口映射保持一致；

随后即可通过 `<server-ip>:15678` 访问；

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/docker-repo/blob/master/bytebase.sh

官方文档：

-   https://www.bytebase.com/docs/introduction/what-is-bytebase


<br/>
