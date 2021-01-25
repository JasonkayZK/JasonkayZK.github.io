---
title: 使用jsDelivr加速github资源
toc: true
cover: 'https://acg.toubiec.cn/random?323'
date: 2020-11-20 16:23:09
categories: 技术杂谈
tags: [技术杂谈, Github, CDN] 
description: 之前博客一直使用的是fast.io加速Github图片资源；但是最近fast.io被撸羊毛的有点惨，将会在明年一月停止服务了，所以换了jsDelivr提供的CDN；
---

之前博客一直使用的是fast.io加速Github图片资源；但是最近fast.io被撸羊毛的有点惨，将会在明年一月停止服务了，所以换了jsDelivr提供的CDN；

<br/>

<!--more-->

## 使用jsDelivr加速github资源

jsDelivr官网：

-   https://www.jsdelivr.com/

提供了npm、GitHub以及WordPress的CDN服务；

<font color="#f00">**并且jsDelivr默认就提供了GitHub的CDN服务，我们不需要注册账号，也不需要做任何配置，直接就可以使用这个CDN服务了！**</font>

jsDelivr提供的GitHub的CDN链接地址的格式如下：

```
https://cdn.jsdelivr.net/gh/{username}/{repo_name}@{branch}/file
```

下面是我博客中静态文件仓库的一个路径：

```
https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static/images/Tencent1.jpg
```

下面展示了这张图：

![cdn](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static/images/Tencent1.jpg)

Github每个仓库的限制是1G的空间，对于我这种轻度图床的使用者来说，绝对是够用了；

当然，大家也可以探索jsDelivr更多的使用方式，如npm包发布加速等…；

<br/>