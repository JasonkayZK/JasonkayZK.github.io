---
title: RSS订阅工具Folo使用
toc: true
cover: 'https://img.paulzzh.com/touhou/random?89'
date: 2025-07-15 21:30:21
categories: 工具分享
tags: [RSS, 工具分享]
description: 之前一直使用的是Inoreader，也早就听说并且下载了Folo，但是一直没有时间切换。今天有时间切换到了Folo，聊一下感受！
---

之前一直使用的是Inoreader，也早就听说并且下载了Folo，但是一直没有时间切换；

今天有时间切换到了Folo，聊一下感受！

源代码：

-   https://github.com/RSSNext/Folo

<br/>

<!--more-->

# **RSS订阅工具Folo使用**

## **零、Folo介绍**

Follow 是一款新兴且创新的 RSS 订阅工具；

除了具备传统 RSS 订阅器的所有基本功能外，Follow 还提供了一些额外的特色功能。

类似于 Inoreader，可以订阅 RSS，查看属于自己独一无二的信息流；

>   **如果你还不了解 RSS，可以简单认为类似于将网页内容转为微信公众号订阅！**

<br/>

## **一、使用方法**

### **1、下载&注册**

Web 版：

-   https://app.follow.is/

Mac、Win、Android：

-   https://github.com/RSSNext/Folo/releases

<br/>

### **2、使用**

添加订阅即可！

添加方法：

-   （1）搜索：输入关键词进行搜索；
-   （2）RSS订阅：输入RSS URL进行订阅；
-   （3）RSSHub订阅；
-   （4）RSS3
5. （5）UID：可以直接搜索订阅正在使用Follow的用户，输入对方的UID（在个人资料里设置的唯一标识）即可订阅；

-   （6）通过导入OPML文件（如Inoreader）订阅；

>   **强烈建议配合RSSHub使用（网页插件，可以探索当前页面的RSS源）：**
>
>   -   https://docs.rsshub.app/

<br/>

## **二、从Inoreader迁移**

如果你根据 Folo 提供的：

```
打开 https://www.inoreader.com/preferences/content
切换到 "SYSTEM FOLDERS" 标签。
点击 "Newsfeed" 右侧的 "OPML" 按钮。
```

会要求你开通会员才能导出；

可以在设置的 `账号` 中，选择 `导出和备份`，此时会导出 xml 格式的文件！

![inoreader-export-1.jpg](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/inoreader-export-1.jpg)

随后，在导入时选择 `所有文件`，即可导入！

![inoreader-export-2.jpg](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/inoreader-export-2.jpg)

>   **目前最多支持500个订阅，比 Inoreader 的150 个多很多了！**

<br/>

## **三、RSS所有者认证**

认证自己的订阅源。

### **1、获取认证码**

你在 Follow 中订阅自己的博客，再在 Follow 中右键点击订阅源，申请 Claim，便可以获取到认证码，例如：

This message is used to verify that this feed (feedId:57983956538829824) belongs to me (userId:81890745999218688). Join me in enjoying the next generation information browser https://folo.is.



### **2、验证认证码**

在你的博客，写入一篇文章，贴入认证码并发布；然后在 Follow 中再次申请 Claim 即可认证。 认证过后，认证码的信息便可以删除；此处予以修改、保留，方便其他读者认证时参考使用。 

当然，你也可以通过一个 Telegram 频道，来进行 Follow 的认证。

<br/>

## **后记**

更多的内容可以阅读：

-   [《使用 Follow 的第 50 天：RSS 迎来又一春？》](https://yinji.org/5317.html)

后续也会在博客分享一些我的订阅源，敬请期待～

<br/>

# **附录**

源代码：

-   https://github.com/RSSNext/Folo

RSS相关服务：

-   [RSSHub](https://link.zhihu.com/?target=https%3A//docs.rsshub.app/)
-   [Telegram RSS / JSON generator](https://link.zhihu.com/?target=https%3A//tg.i-c-a.su/)
-   [RSS-proxy](https://link.zhihu.com/?target=https%3A//github.com/damoeb/rss-proxy)
-   [yarb (Yet Another Rss Bot)](https://link.zhihu.com/?target=https%3A//github.com/firmianay/yarb)
-   [ALL-about-RSS](https://link.zhihu.com/?target=https%3A//github.com/aboutrss/ALL-about-RSS)
-   [各种转 RSS 服务](https://link.zhihu.com/?target=https%3A//rss.lilydjwg.me/)
-   [diff.blog](https://link.zhihu.com/?target=https%3A//diff.blog/)
-   [Kill the Newsletter](https://link.zhihu.com/?target=https%3A//kill-the-newsletter.com/)

参考文章：

-   https://zhuanlan.zhihu.com/p/781349659
-   https://yinji.org/5317.html


<br/>
