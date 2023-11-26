---
title: memos部署总结
toc: true
cover: 'https://img.paulzzh.com/touhou/random?4'
date: 2023-01-02 14:01:15
categories: 工具分享
tags: [工具分享]
description: 最近在我的服务器上部署了新的服务：Memos，这里简单总结一下；
---

最近在我的服务器上部署了新的服务：Memos，这里简单总结一下；

源代码：

-   https://github.com/usememos/memos
-   https://github.com/JasonkayZK/docker-repo/blob/master/memos.sh

<br/>

<!--more-->

# **memos部署总结**

memos 是一个开源的笔记、灵感记录网站，可以自行部署用于自己各种内容的记录；

Github repo 如下：

-   https://github.com/usememos/memos

部署也非常方便，可以使用 Docker 一键部署：

```bash
docker run -d --name memos -p 5230:5230 -v ~/.memos/:/var/opt/memos neosmemo/memos:latest
```

同时， memos 还提供了各个平台的客户端以及浏览器插件，例如：

-   Chrome扩展插件，挺好用的：[Memos-bber - Chrome Web Store](https://chrome.google.com/webstore/detail/memos-bber/cbhjebjfccgchgbmfbobjmebjjckgofe/related)
-   安卓端：[mudkipme/MoeMemosAndroid](https://github.com/mudkipme/MoeMemosAndroid/)

更多平台见：

-   https://usememos.com/

<br/>

# **附录**

源代码：

-   https://github.com/usememos/memos
-   https://github.com/JasonkayZK/docker-repo/blob/master/memos.sh


<br/>
