---
title: DockerHub被墙之后的一些替代方案汇总
toc: true
cover: 'https://img.paulzzh.com/touhou/random?43'
date: 2024-07-23 08:06:53
categories: 技术杂谈
tags: [技术杂谈, Docker, DockerHub]
description: DockerHub在国内已经无法使用了，这里有几篇文章提供了一些替代方法，可以参考；
---

DockerHub在国内已经无法使用了，这里有几篇文章提供了一些替代方法，可以参考；

<br/>

<!--more-->

# **DockerHub被墙之后的一些替代方案汇总**

## **使用免费的镜像代理**

目前能过使用的：

```
https://dockerhub.o0o.us.kg
```

例如：

```
docker pull dockerhub.o0o.us.kg/library/alpine:latest # 拉取 library 镜像
docker pull dockerhub.o0o.us.kg/coredns/coredns:latest # 拉取 coredns 镜像
```

镜像拉取后，可以通过 re-tag 的方式修改：

```
docker tag dockerhub.o0o.us.kg/coredns/coredns:latest coredns:latest

docker rmi dockerhub.o0o.us.kg/coredns/coredns:latest
```

参考：

-   http://dockerhub.o0o.us.kg/
-   https://dockerproxy.com/

<br/>

## **自建代理**

自建代理可以参考：

-   https://zhangzhuo.ltd/articles/2024/07/15/1721034528395.html
-   https://zhpengfei.com/dockerhub-in-china-via-cloudflare-workers/#comments
-   https://51.ruyo.net/18687.html

<br/>
