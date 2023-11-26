---
title: Github个人介绍页美化
cover: 'https://img.paulzzh.com/touhou/random?x'
date: 2020-08-28 21:00:38
categories: [Github]
tags: [Github, 技术杂谈]
toc: true
description: 其实很早之前Github出了一个新彩蛋，会自动将你仓库下的同名用户名仓库的 README 展示到你的个人页面的上方，之前搞了一个版本，这次做了一些升级和优化；
---

其实很早之前Github出了一个新彩蛋，会自动将你仓库下的同名用户名仓库的 README 展示到你的个人页面的上方；

之前搞了一个版本，这次做了一些升级和优化；

源代码：

-   https://github.com/JasonkayZK/jasonkayzk
-   https://github.com/JasonkayZK/waka-box
-   https://gist.github.com/JasonkayZK/59ead22758ee823e48b558d3cff332f1

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## Github个人介绍页美化

最近折腾了一下个人页面仓库，通过 Github Actions 自动每天去跑我的博客和WakaTime动态，然后写入到 README 里面去，最终的效果大概是这个样子：

![github_homepage](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/github_homepage.png)

<br/>

### 预备知识

-   如何让你的 Github 个人页展示 Markdown 的内容：

    Github会自动将你仓库下的同名用户名仓库的 README 展示到你的个人页面的上方；

-   如何使用 Github Actions：[Github Actions总结](https://jasonkayzk.github.io/2020/08/28/Github-Actions总结/)

<br/>

### 使用技巧

#### 利用网站的 RSS 地址

比如说 Recent Blog 这块，博客信息利用RSS订阅的feed.xml快速获取；

Rss 信息处理整体可以通过 **[feedparser](https://link.zhihu.com/?target=https%3A//pythonhosted.org/feedparser/)** 将对应的 Rss 获取到内容数组，然后再进行拼接即可

****

#### 利用自动化的工具提供的 API

比如 **Weekly Development Breakdown** 这一块，超级推荐大家使用 **[wakatime](https://wakatime.com/dashboard/)** 这个工具来统计你的代码时间，具体使用可见：

[使用Wakatime记录你的Coding数据](https://jasonkayzk.github.io/2020/08/28/使用Wakatime记录你的Coding数据/)

如何画这个图，可以参考上面这篇博客中的内容；

最后利用 **[httpx](https://link.zhihu.com/?target=https%3A//www.python-httpx.org/)** 获取到对应 raw 的文本内容，然后通过到 Markdown 代码语法插入即可；

<br/>

## 附录

源代码：

-   https://github.com/JasonkayZK/jasonkayzk
-   https://github.com/JasonkayZK/waka-box
-   https://gist.github.com/JasonkayZK/59ead22758ee823e48b558d3cff332f1

参考文章：

-   [你在 GitHub 上看到过的最有意思的项目是什么？](https://zhuanlan.zhihu.com/p/161705999)

<br/>