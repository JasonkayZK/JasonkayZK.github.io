---
title: 老旧笔记本安装Debian系统后Broadcom驱动缺失解决方法
toc: true
cover: 'https://img.paulzzh.com/touhou/random?74'
date: 2024-07-18 08:04:29
categories: 技术杂谈
tags: [技术杂谈]
description: 老旧笔记本如果使用的是Broadcom无线网卡，安装完Debian系统之后可能是没有Broadcom驱动，导致无法连接Wifi的；本文讲述了如何在Debian12下（旧版本应该也可以）安装Broadcom驱动；
---

老旧笔记本如果使用的是Broadcom无线网卡，安装完Debian系统之后可能是没有Broadcom驱动，导致无法连接Wifi的；

本文讲述了如何在Debian12下（旧版本应该也可以）安装Broadcom驱动；

<br/>

<!--more-->

# **老旧笔记本安装Debian系统后Broadcom驱动缺失解决方法**

如果是 Debian12，通常情况下会包含一个 non-free 的源，但是这个源不包括：``broadcom-sta-dkms` 软件包！

添加一个源：

/etc/apt/sources.list

```
deb http://deb.debian.org/debian/ stable main contrib non-free
```

然后更新后安装：

```bash
sudo apt update

apt install broadcom-sta-dkms
```

即可！

<br/>

# **附录**

参考文章：

-   https://www.reddit.com/r/debian/comments/173i1uc/cant_get_wifi_to_work_on_debian_12/
-   https://forums.debian.net/viewtopic.php?p=773939&sid=93648e6d83030e517f223f9f9404a8d5#p773939




<br/>
