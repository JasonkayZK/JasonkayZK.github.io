---
title: 使用RSS构建你自己的聚合信息
toc: true
date: 2019-09-23 14:45:34
categories: 工具分享
tags: [RSS, 信息聚合]
description: 之前就看到github上面的一个叫万物皆可RSS(RSSHub)的项目, 但是一直都没时间看. 直到最近, 感觉微信公众号里面的文章太多了! 而且爪机也很是不给力, 所以就试了试RSS订阅的方式, 一试不当紧, 马上就爱上了这种Geek的获取信息的方式.
---

![RSS](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1569231114834&di=f78c3f4220e3ff7acea77dcc8648e56e&imgtype=0&src=http%3A%2F%2Fku.90sjimg.com%2Felement_origin_min_pic%2F00%2F85%2F90%2F4656ea289c7c11f.jpg)

<br/>

之前就看到github上面的一个叫万物皆可RSS(RSSHub)的项目, 但是一直都没时间看. 直到最近, 感觉微信公众号里面的文章太多了! 而且爪机也很是不给力, 所以就试了试RSS订阅的方式, 一试不当紧, 马上就爱上了这种Geek的获取信息的方式.

本文主要讲述了对于小白而言的有关RSS的一切! 不论之前你是否接触过RSS, 在阅读了本文之后, 你都会学到:

-   RSS是什么? RSS能帮助我做什么?
-   如何使用RSS? (创建, 订阅, 信息获取)
-   RSS订阅源
-   关于RSS的一些工具, 优化
-   ......

<!--more-->

## RSS

### 一. 什么是RSS

其实笔者之前也不知道RSS究竟是个什么鬼东西, 在百度之后, 给出的解释是: `简易信息聚合（也叫聚合内容）是一种RSS基于XML标准，在互联网上被广泛采用的内容包装和投递协议。RSS(Really Simple Syndication)是一种描述和同步网站内容的格式，是使用最广泛的XML应用`.

看完了上面的介绍笔者还是一头雾水. 简单来说: <font color="#ff0000">其实RSS就相当于我们日常生活中的订阅报纸, 或者微信的订阅号(公众号)</font>

如下图是我的一个在Inoreader中的RSS订阅订阅内容:

![RSS订阅](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/rss_sample.png)

<br/>

左侧显示了订阅的相关信息, 右侧为推送的内容! <font color="#ff0000">不仅限于微信公众号, 你可以在各种各样的网站上进行订阅, 如果这个网站内容有所更新, 你可以直接收到网站给你投递的推送!</font>

<br/>

#### 1): RSS的没落

其实在笔者还未接触RSS之前, RSS风光过一段时间, 而现如今只有一小部分 RSS 重度用户仍在使用. RSS 没落的原因有两个：

-   一是门槛高上手难度大;
-   二是 RSS 是一种单向的服务工具;



RSS 会将网站内容转化为文本格式，这样一来，那怕你的网站设计有多么巧妙，文章排版有多么的精良，在 RSS  阅读器里统统会变成最原始的文本内容，也无法附带任何脚本语言，这使得提供内容的网站无法对运营效果做出评估，就连文章点击量+1都无法统计，其中一些网站赖以生存的广告营收也荡然无存。

从运营方的角度来说，网站其实也并不那么希望读者使用 RSS 来阅读内容，因为 RSS 难以连接内容提供者和读者，也无法平衡了内容提供者与读者之间的关系，砍去RSS订阅也成了无奈之举，就连曾经被业界"奉若神明"的 Google Reader 也是如此。

<br/>

#### 2): 国内常见的订阅方式比较

**1. RSS订阅**
 RSS订阅是互联网上最早的一种订阅方式。简单来说，以前你需要主动访问网站后才知道有没有内容更新，但有了RSS订阅后，就变成网站内容主动发送到你手上来。（**缺点：门槛高难度大**）

**2. 站内订阅**
 站内订阅和RSS订阅有些相似，都需要用户主动订阅，但这些网站都在试图打造自己的内容闭环生态圈，因此你只能订阅该站站内的内容。比如视频订阅，微博关注，微信公众号订阅，知乎专栏关注等SNS网站。（**缺点：信息孤岛效应**）

**3. 算法推荐**
 以算法为主要内容分发机制，通过你的浏览记录来猜测和推送你可能感兴趣的内容，比如今日头条，腾讯新闻等各大门户的新闻客户端。算法推荐可能是当下最普遍的分发机制，大多数网站和应用或多或少地都在使用。（**缺点：回音室效应**）

**4. 人工推荐**
 人工推荐的产品更近似于传统媒体，产品的内容质量较高，同时也颇具“个人”特色，因为内容都是这些网站的编辑精选而来。比如知乎日报，湾区日报，好奇心日报，果壳精选等。（缺点：**推荐内容与预期存在较大偏差**）

**5. 算法推荐 + 人工推荐**
 相比于算法推荐基于兴趣、领域这样的“面”信息，精准推送采用的是算法和人工编辑并重的分发机制，它为用户提供更加精确的信息，订阅的维度是“点”信息。比如即刻、一订、读读日报、轻芒阅读等。（缺点：**再精准也还是无法代替人脑**）

<br/>

订阅就会产生「**信息过载**」和「**回声室效应**」的问题，但这些问题在 RSS 上也并没有得到完美的解决。

算法推荐常常被诟病瀑布流的内容模式容易造成了信息的过载，然而在 RSS 上，随着时间的推移和不断添加新订阅源，如果你疏于阅读清理，巨大的未阅读数量同样会造成信息过载。

算法推荐也常常被诟病，因为要迁就读者的喜好，推荐的内容会越来越狭窄，读者接受到的知识和观点也会变得片面，视野受限。同样，在 RSS  上，这种回声室效应也没有得到解决，甚至可以说更甚。因为每一条订阅源都是你自己亲自添加的，你没有理由会去添加一条你不喜欢的订阅源。

对于一个没有筛选和自控能力的人来说，RSS 订阅和其他订阅方法差别不大。就像沉迷抖音的那一群人，他们本身就是筛选能力和自控能力较弱的那一群人。

**但如果你是一个有筛选和自控能力的人，RSS 对于你来说就是一种高效的阅读方式。**

<br/>



--------------------------------------------



### 二. 如何使用RSS

#### 1): RSS阅读工具

<font color="#ff0000">不推荐使用本地 RSS 阅读器，不能多平台使用和同步的话，容易造成阅读压力, 同时PC上的消息无法在移动端接收会让你相当头疼!</font>

在线 RSS 应用现如今比较知名的有两家，一家是 Feedly，一家是 Inoreader. Feedly 有着非常优雅的阅读界面，但在国内无法正常访问!<font color="#ff0000">所以我在这里推荐的是Inoreader阅读器.</font>

<font color="#0000ff">对于移动端, 我在iOS系统上使用的是Unread阅读器, 安装端应当也有相应的阅读工具软件.实在不行, 网页版阅读也是很舒服的!</font>

<br/>

#### 2): 开始使用

这里以Inoreader为例说明如何使用RSS, 以及如何订阅.

##### 注册

在[Inoreader官网](https://www.inoreader.com/)注册账号, 这里要说明的是: <font color="#ff0000">国内访问Inoreader有点慢, 所以可以通过其在日本的网站来访问</font>:

-   官网: https://www.inoreader.com/

-   日本网站: http://jp.inoreader.com/

<br/>

##### 添加订阅

<font color="#ff0000">注册登录后, 可以在网站右上角搜索, 或者输入你要添加的RSS源. 就相当于添加了一个微信公众号一样! 不过这个要比公众号要干净, 简洁的多了!</font>

<br/>

##### 收取消息

<font color="#0000ff">当你添加了你的订阅之后, 就已经可以获取到更新了!</font>

<br/>

##### 管理订阅

通过网站左侧的leftside-bar下方可以找到`statistics`:

![RSS使用](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/rss_use.png)

<br/>

点击即出现了:

![RSS管理](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/rss_statistics.png)

<br/>

通过这些数据可以看到订阅中有哪些网站过了多久没有更新, 可以进行快速取消订阅等功能!

<br/>

##### 其他

除此之外, Inoreader还包括了其他相关的功能如: <font color="#0000ff">一键全部阅读, 订阅标签分类, 设置推送时间, 内容更新时间设置等功能, 可以说很是方便了!</font>

<br/>



#### 3): 如何高效使用RSS

RSS最初的愿景是让阅读变得简单，然而RSS实际使用起来并不是那么的简单。最常见的现象是**订阅数量太多或者网站更新频率太高导致未阅读信息堆积如山**，因此在使用 RSS 时，首先要从「做减法」上着手。

**1.选择性订阅**

RSS 适合订阅那些不定时更新的信息源，新闻类网站因为更新频率高会导致未读消息数量庞大，而造成阅读焦虑。那些更新频率高的网站可以用浏览器的书签功能来代替。

**2.人工筛选阅读**

第一种是通过扫标题的方法，感兴趣的全部标记为星标，接着把这个信息源下的内容全部标记为已读，然后用比较集中的时间到“星标文章”中去阅读。
 第二种方法是快捷键 J（下一篇文章）或者 K（上一篇文章）的方法来快速阅读，半分钟内能消化完的内容当场就读完，那些值得仔细阅读的信息则标记为星标。

**3.订阅源分类**

 对订阅源进行分类时，不建议用订阅源的类型作为分类依据，可以按照时间管理里的「四象限法则」来分类，分成「紧急重要」、「紧急不重要」和「重要不紧急」三类，对于那些「不重要不紧急」的订阅源则直接退订删除。分类文件夹名字可以使用「资讯信息」、「每日必读」和「每周必读」。

**4.清理未读文章**

有时候难免会遇到没时间阅读RSS的情况，这时就会积攒下很多未读文章，你需要拿出「断舍离」的心态果断清理未读文章，特别是「资讯信息」这类短期内不看就不再有价值的文章。

**5.定期整理订阅源**

如果你发现一些订阅源每天会更新很多内容但你几乎不会去阅读他们，那就可以退订阅删除他们了，不要让日益增加的未读数目成为你的阅读负担。

<br/>



------------------------



### 三. RSS订阅源问题

既然RSS这么强大, 那么RSS订阅源的来源有哪些呢?

#### 1): Inoreader中搜索

可以通过在Inoreader等网站中的搜索框中搜索你想要订阅的频道, 内容不限于: 音乐, 体育, 娱乐等等!

<br/>



#### 2): 万物皆可RSS

这是Github上的一个开源项目: [RSSHub](https://github.com/DIYgod/RSSHub)

如果你细心观察就会发现, 提供 RSS 相关服务的网站都是国外的，国内与 RSS 相关的网站都相继宣布关闭了。你会发现国内提供 RSS 相关服务的网站都是个人或者小机构，这其中有一个叫 [RSSHub](https://www.runningcheese.com/go?url=https://docs.rsshub.app/) 的网站，是这其中的集大成者，它的作用是<font color="#ff0000">可以给任何奇奇怪怪的内容生成 RSS 订阅源!</font>

<font color="#ff0000">可以在Chrome或者Firefox等主流浏览器中添加JS插件, 来完成对该网页中可用的RSS订阅进行检索</font> 

具体可参见RSSHub官方文档: [RSSHub官方文档](https://docs.rsshub.app/)



<br/>

#### 3): 一些常用的RSS订阅

其实安装了RSSHub的插件之后, 就会为你自动捕获相当多的RSS订阅了, 以下列出了一些常用的RSS订阅:

##### **一般网站和博客**

1). 通常在顶部菜单、右侧菜单、底部菜单等地方会有RSS图标;

2). 如果没有，可以尝试在网站地址后面加上/rss或者/feed，有时会出现在二级域名里;

3). 如果还是没有，可能网站没有提供RSS订阅。可以借用 [Fivefilters.org](https://www.runningcheese.com/go?url=http://createfeed.fivefilters.org/) 或者[Feedity.com](https://www.runningcheese.com/go?url=https://feedity.com/default.aspx)来制作订阅源;

4). 对于一些只提供了摘要RSS的网站，可以使用 [FeedEx.Net](https://www.runningcheese.com/go?url=https://feedex.net/) 来制作全文RSS。 

<br/>



##### **论坛**

一般会有 RSS 图标，如果没有，在网址后面加上 ?mod=rss;

比如网址 [http://bbs.kafan.cn/forum-215-1.html](https://www.runningcheese.com/go?url=http://bbs.kafan.cn/forum-215-1.html)，其 rss 地址为http://bbs.kafan.cn/forum-215-1.html?mod=rss

<br/>



##### **微博**

https://rsshub.app/weibo/user2/博主ID，比如https://rsshub.app/weibo/user2/1195230310

<br/>



##### **微信公众号**

在 [瓦斯阅读](https://www.runningcheese.com/go?url=https://w.qnmlgb.tech/) 搜索要订阅的公众号名称，就会有专门的RSS订阅地址。

<br/>



##### **简书**

https://rsshub.app/jianshu/user/作者ID，比如 https://rsshub.app/jianshu/user/yZq3ZV

<br/>



##### **B站**

https://rsshub.app/bilibili/user/video/UP主ID<br/>



#####  **贴吧**

精品贴订阅：https://rsshub.app/tieba/forum/good/贴吧吧名（支持中文）, 

比如 [https://rsshub.app/tieba/forum/good/哲学](https://www.runningcheese.com/go?url=https://rsshub.app/tieba/forum/good/哲学)

<br/>



##### **知乎**

知乎热榜：[https://rsshub.app/zhihu/hotlist](https://www.runningcheese.com/go?url=https://rsshub.app/zhihu/hotlist)

用户动态：https://rsshub.app/zhihu/people/activities/用户ID，

知乎专栏：https://rsshub.app/zhihu/zhuanlan/专栏ID，

<br/>



##### **知乎日报**

订阅：[https://rsshub.app/zhihu/daily](https://www.runningcheese.com/go?url=https://rsshub.app/zhihu/daily)

分栏订阅： [http://zhihurss.miantiao.me/section](https://www.runningcheese.com/go?url=http://zhihurss.miantiao.me/section)

<br/>



##### **豆瓣小组**

https://www.douban.com/feed/group/豆瓣小组ID/discussion，

比如 [https://www.douban.com/feed/group/beijing/discussion](https://www.runningcheese.com/go?url=https://www.douban.com/feed/group/beijing/discussion)

<br/>



##### **Twitter**

https://rsshub.app/twitter/user/用户ID

<br/>



##### **Instagram**

https://rsshub.app/instagram/user/用户ID

<br/>



##### **U2B**

https://rsshub.app/youtube/user/用户ID，比如 [https://rsshub.app/youtube/user/JFlaMusic/](https://www.runningcheese.com/go?url=https://rsshub.app/youtube/user/JFlaMusic/)

https://rsshub.app/youtube/channel/频道ID，比如 [https://rsshub.app/youtube/channel/UCDwDMPOZfxVV0x_dz0eQ8KQ](https://www.runningcheese.com/go?url=https://rsshub.app/youtube/channel/UCDwDMPOZfxVV0x_dz0eQ8KQ)

<br/>



##### **Reddit**

在当前链接后面加入.rss，比如 [https://www.reddit.com/r/nba/top/](https://www.runningcheese.com/go?url=https://www.reddit.com/r/nba/top/) 改成 [https://www.reddit.com/r/nba/top/.rss](https://www.runningcheese.com/go?url=https://www.reddit.com/r/nba/top/.rss)

<br/>



##### **抖音**

https://rsshub.app/douyin/user/用户ID

<br/>



##### **网易云音乐**

1). 歌单歌曲

https://rsshub.app/ncm/playlist/歌单ID

 2). 用户歌单

https://rsshub.app/ncm/user/playlist/用户ID

3). 电台节目

https://rsshub.app/ncm/djradio/电台ID

<br/>



##### **喜马拉雅**

https://rsshub.app/ximalaya/album/专辑ID

<br/>



##### **Github**

1). 用户动态: 地址 + .atom

 2). 仓库releases: 地址 + .atom

 3). 仓库commits: 地址 + .atom

 4). 仓库issues：https://rsshub.app/github/issue/用户名/仓库名

<br/>



##### **V2EX**

周报：[http://vdaily.iu.vc/old-weekly.xml](https://www.runningcheese.com/go?url=http://vdaily.iu.vc/old-weekly.xml)

<br/>



##### **Dribble**

https://rsshub.app/dribbble/user/用户ID



<br/>

---------------------------------------------



### 四. RSS的一些其他玩用法

#### 1. **监视网页内任意内容的变化。**

有一款叫 `Distill Web Monitor `的拓展 （支持 Firefox / Chrome），可以让你监视网页某处内容的变化，并在第一时间通知你。

使用的场景非常多，比如监控某商城网站商品是否有货是否有降价，某网站上的房价涨跌提醒，某个页面是否有内容更新，某视频网站Po主发布新视频的提醒，再比如你是做运营的，想要监视竞争对手产品的动态，这款拓展都能做到。更加强大的地方在于它可以自定义提醒的条件，比如价格变化超过10%才提醒你。

#### 2. **指定新闻内容动态提醒。**

[Google Alerts](https://www.runningcheese.com/go?url=https://www.google.com/alerts) 可以让用户指定监控的关键词，Google 会在第一时间内向用户推送新内容更新提醒，支持邮件提醒，也支持RSS提醒，非常方便，用户可以用这个功能来跟踪一些新闻报道，业界动态，获取最新的国际事件等等。

Google Alerts的最大作用就是：让用户能迅速而方便地获得其所关注的信息。Google Alerts能将有价值的信息主动推给用户，大大减少了用户获取信息的时间。实现了“不上网而知天下事”。百度也有[类似产品](https://www.runningcheese.com/go?url=https://www.baidu.com/search/rss.html)。

#### 3.**RSS 配合 IFTTT**

IFTTT是“if this then that”的缩写，可以让你的网络行为能够引发连锁反应。以RSS为例，比如在你的RSS订阅源里出现了有关于"iPhone8"的信息，联接上IFTTT后就可以在手机上弹窗通知我们了。

<br/>



---------------------



### 五.总结

有一个说法，说的是 "**You are what you read / 你的阅读造就了你**". RSS作为一个优化你获取信息的一种工具, 掌握之后一定会让你在更短的时间内, 获得更多你想要获得的信息!

你阅读什么就会成为什么样的人，你获取的信息决定了你的思维你的眼界。RSS 就像是你从茫茫的信息海洋中将宝贵的信息收集在一起，同时随着你不断更新整理其中的内容，RSS 也慢慢地变成了一本由你亲手编写的宝书.



<br/>



--------------------



### 附录

文章引用:

-   [当我们谈论RSS时，我们谈论些什么?](https://www.runningcheese.com/rss-feed)

-   [ 可能是目前最全的RSS订阅源了 ](https://www.runningcheese.com/rss-subscriptions)

-   [RSSHub官方文档](https://docs.rsshub.app/)

    


