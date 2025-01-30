---
title: 通过GithubActions拉取并推送Docker镜像到国内云
toc: true
cover: 'https://img.paulzzh.com/touhou/random?3'
date: 2025-01-30 11:13:54
categories: Docker
tags: [Docker, Github]
description: 自从DockerHub在国内被墙之后，Docker镜像在国内的拉取一直是一个问题。目前有许多解决方案，比如：使用公开的镜像站、或者通过Cloudflare自建镜像站等等。但是都存在访问不稳定、配置麻烦等问题。实际上，Github提供的Actions服务器就是在海外，可以通过Actions拉取Docker镜像，并推送到国内的云厂商，实现稳定的访问！tech-shrimp/docker_image_pusher 库就实现了这个功能！
---

自从DockerHub在国内被墙之后，Docker镜像在国内的拉取一直是一个问题。目前有许多解决方案，比如：使用公开的镜像站、或者通过Cloudflare自建镜像站等等。但是都存在访问不稳定、配置麻烦等问题。

实际上，Github提供的Actions服务器就是在海外，可以通过Actions拉取Docker镜像，并推送到国内的云厂商，实现稳定的访问！

[tech-shrimp/docker_image_pusher](https://github.com/tech-shrimp/docker_image_pusher) 库就实现了这个功能！

<br/>

<!--more-->

# **通过GithubActions拉取并推送Docker镜像到国内云**

## **使用方法**

首先 fork 项目：

-   https://github.com/tech-shrimp/docker_image_pusher

到本地，然后基本上根据 README 文档来即可；

需要在 fork 后的仓库的配置中配置 Secrets：

-   ALIYUN_NAME_SPACE：你创建的阿里云的命名空间
-   ALIYUN_REGISTRY：阿里云的地址
-   ALIYUN_REGISTRY_USER：阿里云的用户名
-   ALIYUN_REGISTRY_PASSWORD：阿里云的密码

**配置完成后直接修改 `images.txt` 文件即可直接拉取镜像并推送到阿里云的容器仓库！**

<br/>

# **附录**

源码仓库：

-   https://github.com/tech-shrimp/docker_image_pusher

<br/>
