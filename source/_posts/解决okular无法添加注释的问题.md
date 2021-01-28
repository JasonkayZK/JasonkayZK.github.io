---
title: 解决okular无法添加注释的问题
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?44'
date: 2020-11-10 20:39:18
categories: 技术杂谈
tags: [技术杂谈, Okular]
description: 在使用Okular看PDF的时候，经常会遇到无法添加注释的问题；最后经过Google解决了问题；
---

在使用Okular看PDF的时候，经常会遇到无法添加注释的问题；最后经过Google解决了问题；

<br/>

<!--more-->

## 解决okular无法添加注释的问题

Okular是KDE开发的一款跨平台的PDF阅读器，之前在Linux下一直用它来看PDF的书；

配置了注释快捷键，用的爽的飞起啊！

在Win下也已经习惯了；

>   windows环境下可以通过Chocolately或者应用商店很方便的安装：
>
>   https://chocolatey.org/

但是有时对于一些PDF，却没有办法添加注释；

此时可以通过下面的方式开启添加注释：

**① 检查文件是否为只读或被安全保护**

右键PDF文件，选择属性；

在安全中勾选“解除锁定”，并确保属性中的只读没有被勾选！

如下图：

![okular_1.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/okular_1.png)

**② 配置DRM选项**

在okular中选择设置(settings) → 配置Okular(Configure Okular) → 常规(General) → 取消选中**服从DRM限制(Obey DRM limitations)**选项；

最后保存并重启Okular打开pdf，即可添加注释！

<br/>