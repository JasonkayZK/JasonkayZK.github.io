---
title: 跨平台文件同步工具syncthing
toc: true
cover: 'https://img.paulzzh.com/touhou/random?23'
date: 2022-10-19 21:56:11
categories: 工具分享
tags: [工具分享]
description: 最近有个在多台设备上同步一些文件的需求，所以使用了 syncthing 这个开源软件，用起来还挺不错的，这里分享一下！
---

最近有个在多台设备上同步一些文件的需求，所以使用了 syncthing 这个开源软件；

用起来还挺不错的，这里分享一下！

源代码：

-   https://github.com/syncthing/syncthing
-   https://github.com/JasonkayZK/docker-repo/blob/master/syncthing.sh

<br/>

<!--more-->

# **跨平台文件同步工具syncthing**

背景是，我的 win10 台式机、虚拟机、开发机、我的 Mac 之间有一些文件需要同步；

但是有的时候我在家，有的时候我在公司；

此时可以通过 syncthing，借助开发机作为文件同步的中间节点；

其他所有的设备都共同同步开发机下的同一个目录，就能够完成所有设备之间的文件同步！

首先在开发机上使用 Docker 部署：

syncthing.sh

```shell
docker run -itd --network=host -v /root/data/docker-volumn/sync-thing:/var/syncthing --restart=always --name=my-syncthing --privileged=true syncthing/syncthing:1.22
```

这里将 `/root/data/docker-volumn/sync-thing` 目录挂载到了容器中，同时作为容器外部的文件路径；

同时，syncthing 提供了大量各种平台的工具：

-   https://docs.syncthing.net/users/contrib.html#contributions

在 Win10 台式机上，我使用了：

-   [SyncTrayzor](https://github.com/canton7/SyncTrayzor)

在 Mac 上我使用了：

-   [syncthing-macos](https://github.com/syncthing/syncthing-macos)

在虚拟机中，我同样使用的是 Docker 部署的方式；

在所有设备都安装了 syncthing 之后，只需要做简单的配置即可完成设备连接：

-   https://docs.syncthing.net/intro/getting-started.html

主要是，点击 “Add New Device” 打开下面的页面：

![](https://docs.syncthing.net/_images/gs2.png)

然后点击 “Advanced”：

在 Addresses 中写入要同步的对端（这里是开发机）的地址即可，例如：

```
tcp://127.0.0.1:22000
```

>   **默认同步端口号为 22000！**

最终配置好的结果如下图：

![syncthing.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/syncthing.png)

**此时，任意一台设备上在 sync-files 目录下改变了文件，都会同步到其他所有设备上，非常方便！**

<br/>

# **附录**

源代码：

-   https://github.com/syncthing/syncthing
-   https://github.com/JasonkayZK/docker-repo/blob/master/syncthing.sh


<br/>
