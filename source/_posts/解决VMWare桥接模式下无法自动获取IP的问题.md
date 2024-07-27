---
title: 解决VMWare桥接模式下无法自动获取IP的问题
toc: true
cover: 'https://img.paulzzh.com/touhou/random?1'
date: 2024-07-27 16:17:11
categories: 技术杂谈
tags: [技术杂谈, VMWare]
description: 当配置VMWare虚拟机网络为桥接模式时，可能会出现无法获取到IP的情况；主要是因为桥接模式自动分配的网卡不对；
---

当配置VMWare虚拟机网络为桥接模式时，可能会出现无法获取到IP的情况；

主要是因为桥接模式自动分配的网卡不对；

<br/>

<!--more-->

# **解决VMWare桥接模式下无法自动获取IP的问题**

解决：

1、Edit--Virtual Network Editor...

2、点选VMnet0，在VMnet Information里面，点击“Bridged to: ”后面的“Automatic”下拉菜单，将“Automatic”更换为实际的物理网卡即可！

>   **参考：**
>
>   https://www.cnblogs.com/qmfsun/p/6109766.html

<br/>
