---
title: 2024年安装Docker的方法
toc: true
cover: 'https://img.paulzzh.com/touhou/random?10'
date: 2024-08-22 10:00:43
categories: 软件安装与配置
tags: [软件安装与配置, Docker]
description: 阿里云的Docker源没了，本文写了在2024年如何安装Docker、配置DockerHub源；PS：没想到2024年了，还在写Docker安装的教程...
---

阿里云的Docker源没了，本文写了在2024年如何安装Docker、配置DockerHub源；

PS：没想到2024年了，还在写Docker安装的教程...

<br/>

<!--more-->

# **2024年安装Docker的方法**

## **安装Docker**

目前（2024年8月22日），阿里云已不再提供 Docker 源的安装（404了）；

腾讯云目前还是提供的，安装教程如下：

-   https://cloud.tencent.com/document/product/213/46000#C_XgAwZpjht292j2EOU2t

Ubuntu的安装如下：

```bash
sudo apt-get update

sudo apt-get install ca-certificates curl

sudo install -m 0755 -d /etc/apt/keyrings

# Debian系统将ubuntu改为debian！
sudo curl -fsSL https://mirrors.cloud.tencent.com/docker-ce/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc

sudo chmod a+r /etc/apt/keyrings/docker.asc

# Debian系统将ubuntu改为debian！
echo   "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://mirrors.cloud.tencent.com/docker-ce/linux/ubuntu/ \

  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" |   sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  
sudo apt-get update
```

>   **需要注意的是：如果是Debian系统，需要将上面的ubuntu改为debian即可！**

安装：

```bash
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

<br/>

## **Docker镜像源**

众所周知，由于不可抗因素，国内是无法在 DockerHub 上 pull 镜像的，Github 的 [**ghcr.io**](https://ghcr.io/) 也不行；

下面的网址提供了一些目前可用的镜像站：

-   https://taimatsu.xlog.app/china-mirror-proxy?locale=zh
-   https://qinyang.wang/china-mirror-proxy
-   https://github.com/cmliu/CF-Workers-docker.io

以及使用 CF 搭建镜像站的教程：

-   https://www.lincol29.cn/cloudflaretodocker
-   https://github.com/cmliu/CF-Workers-docker.io

<br/>

# **附录**

参考：

-   https://cloud.tencent.com/document/product/213/46000#C_XgAwZpjht292j2EOU2t

<br/>
