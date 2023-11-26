---
title: 快速搭建属于你自己的网盘：FileBrowser
toc: true
cover: 'https://img.paulzzh.com/touhou/random?89'
date: 2021-06-25 10:29:40
categories: 服务自建
tags: [服务自建, 网盘, Docker]
description: FileBrowser是一个使用Go编写的开源网盘，同时提供了Docker镜像，可以直接一键部署；
---



FileBrowser是一个使用Go编写的开源网盘，同时提供了Docker镜像，可以直接一键部署；

Github地址：

-   https://github.com/filebrowser/filebrowser

FileBrowser官方文档：

-   https://filebrowser.org/

<br/>

<!--more-->

## **快速搭建属于你自己的网盘：FileBrowser**

### **启动服务**

关于FileBrowser的安装的详细过程，可以参考官方文档：

-   https://filebrowser.org/installation

对于我来说，更倾向于直接使用Docker一键部署：

```bash
docker run -d \
-v /home/docker/file_browser:/srv \
--user $(id -u):$(id -g) \
-p 80:80 \
--name filebrowser \
filebrowser/filebrowser:v2.15.0
```

>   **注：**
>
>   **端口映射、文件目录映射和FileBrowser版本可以根据自身需求修改；**

启动成功后可查看：

```bash
[root@VM-12-16-centos ~]# docker ps -a

CONTAINER ID   IMAGE                             COMMAND          CREATED        STATUS                  PORTS                     NAMES
7015765b0722   filebrowser/filebrowser:v2.15.0   "/filebrowser"   14 hours ago   Up 14 hours (healthy)   0.0.0.0:80->80/tcp     filebrowser
4c94d559ef95   portainer/portainer:1.24.2        "/portainer"     15 hours ago   Up 15 hours             0.0.0.0:9000->9000/tcp   portainer
```

<br/>

### **服务配置**

<font color="#f00">**默认用户名、密码均为：`admin`，首次登录一定要去`Settings`中修改！**</font>

登陆后的界面如下：

![file_browser.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/file_browser.png)

网盘支持中文、文件分享、多用户、视频在线播放等等，还是很不错的！

我就在我的服务器上搭建了这个网盘！

<br/>

## **附录**

Github地址：

-   https://github.com/filebrowser/filebrowser

FileBrowser官方文档：

-   https://filebrowser.org/


<br/>
