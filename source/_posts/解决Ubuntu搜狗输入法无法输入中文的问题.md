---
title: 解决Ubuntu搜狗输入法无法输入中文的问题
toc: true
cover: 'https://img.paulzzh.com/touhou/random?66'
date: 2023-02-20 18:31:41
categories: 技术杂谈
tags: [技术杂谈]
description: 在Ubuntu中安装完fcitx和搜狗输入法后可能会出现无法输入中文的问题，这是缺少部分动态链接库组件的问题；
---

在Ubuntu中安装完fcitx和搜狗输入法后可能会出现无法输入中文的问题，这是缺少部分动态链接库组件的问题；

<br/>

<!--more-->

# **解决Ubuntu搜狗输入法无法输入中文的问题**

## **前言 - 碎碎念**

最近刚回到深圳，路途颠簸可能把三星的固态硬盘给搞坏了，所以又买了一块固态硬盘；

然后重装系统的时候，又遇到了之前搜狗输入法无法显示的问题；

这次仔细看了报错，是**缺少部分动态链接库组件的问题；**

<BR/>

## **解决方法**

在终端中输入fcitx，手动启动fcitx运行，可以看到输入法的启动过程，显示的信息中有关于sogou的报错：

```bash
/opt/sogoupinyin/files/bin/sogoupinyin-service: error while loading shared libraries:
 libgsettings-qt.so.1: cannot open shared object file: No such file or directory
```

直接通过 apt 安装对应的库即可：

```bash
sudo apt install libgsettings-qt1
```

之后重启一下，然后就能正常输入了！

<br/>
