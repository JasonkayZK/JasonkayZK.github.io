---
title: 解决Aria2的BT下载速度慢或没速度的问题
cover: https://acg.toubiec.cn/random?43
date: 2020-05-02 17:43:02
categories: 技术杂谈
toc: true
tags: [技术杂谈, Aria2]
description: 在使用Aria2下载BT资源时总是出现无速度的情况, 转载了网上的一篇文章, 有时能解决BT无速度的情况;
---

在使用Aria2下载BT资源时总是出现无速度的情况, 转载了网上的一篇文章, 有时能解决BT无速度的情况;

文章转自:

[解决Aria2 BT下载速度慢没速度的问题](http://www.senra.me/solutions-to-aria2-bt-metalink-download-slowly/)

<br/>

<!--more-->

## 解决Aria2的BT下载速度慢或没速度的问题

Aria2由于没有加速服务器，有些种子一直没几个人上传导致只有几KB的速度甚至完全没速度，这种情况下该怎么办呢？

办法还是有的，这儿介绍两种:

**①借鸡生蛋**

既然Aria2没有离线，那我给它加个不就行了吗，迅雷的离线空间(虽然很多可能提示违规)、百度云的离线(虽然不少8秒)，但也不是不能用吗，土豪可以上115，强无敌，然后通过各种插件脚本将完成的任务通过Aria2下载，成功实现借鸡生蛋。

不过除非是百度云还没开会员，不然这样感觉有种脱裤子放屁的感觉……

****

**②众人拾柴**

所谓**BT其实实际上并不是一个人的事，因为你的下载必然代表着一个甚至一堆人在上传。**

所以，如果下载慢，那么找更多上传的人不就行了？那么问题来了，**如何知道有谁能给你上传？这就涉及到Tracker、本地用户发现、DHT、用户交换这些功能了。**

**Tracker: 会存储你的信息(包括正在下载或者上传的是什么种子，你的速度还有进度)，同时会将其他正在下载或者上传这个种子的用户数据给你，从而你能够根据这些信息连接对应的用户**

**DHT: 类似Tracker，只是它不像Tracker这样是一个个的，而是一整个网络，你可以通过接入DHT网络从而分享以及获得数据**

**本地用户发现: 不是很懂，感觉上应该是扫描局域网开放端口或者获取其他BT客户端在网内广播数据(?)从而发现其他用户**

**用户交换: 从和你连接的用户交换所获得的其他用户的信息**

在这四个中，**DHT很大程度上比较不可控，因为我们不好修改程序（但是！DHT这玩意有缓存，下面会提到），而本地用户发现比较看你服务器，在某些BT扎堆的机房和地区感觉应该会比较有效，至于用户交换则是需要连接其他用户作为前提。**

所以我们最好下手的就是Tracker，要知道全世界一大堆Tracker服务器，如果我们连接的Tracker多了，那么就有更大的机会碰到和我们下载同一个种子的用户，这样速度不就会变快？

基于这个想法，我们需要**给Aria2添加Tracker，而不是只根据从DHT网络或者种子文件中存储的Tracker信息，让下载赢在起跑线上**

>   <br/>
>
>   推荐一个自动更新的Tracker列表:
>
>   https://github.com/ngosang/trackerslist
>
>   这里面分了好几种，有http和udp的，也有纯ip和域名的，还有选出来的前20的Tracker(基于延迟以及热门度)

修改Aria2配置文件:

```bash
vi /etc/aria2/aria2c.conf
#不是这个位置你也应该知道怎么办吧
bt-tracker=udp://tracker.skyts.net:6969/announce,udp://tracker.safe.moe:6969/announce,udp://tracker.piratepublic.com:1337/announce,udp://tracker.pirateparty.gr:6969/announce,udp://tracker.coppersurfer.tk:6969/announce,udp://tracker.leechers-paradise.org:6969/announce,udp://allesanddro.de:1337/announce,udp://9.rarbg.com:2710/announce
......
```

我这个只是今天的列表，所以……**用的时候建议自己换一下最新的**

另外，在抗DMCA的服务器上请把如下选项打开

```bash
enable-dht=true
bt-enable-lpd=true
enable-peer-exchange=true
```

上面提到DHT有缓存，是这样滴：

和很多BT客户端一样，**Aria2有个dht.dat文件(开启ipv6还有个dht6.dat)，这玩意用于存储一种叫做DHT Routing  Table的东西。**

**DHT网络由无数节点组成，你接触到一个后能通过它接触到更多的节点**，Aria2我记得是有内置的节点

但是：**如果你在Aria2第一次运行的时候直接下载磁力链接或者冷门种子，你很可能遇到连MetaData都无法获取的情况，这就是因为第一次只是初始化dht.dat文件，你本地不存在DHT Routing Table的缓存，所以你无法从DHT网络中获取足够的数据。**

那么怎么办？我的建议是，<font color="#f00">**找个热门种子(千万建议是种子，而不是磁力链接)，然后下一波，挂着做种，过几个小时后退出Aria2，或者等Aria2会话自动保存，你会发现dht.dat从空文件变成有数据了，这时候你下载就会正常很多。**</font>

<br/>

## 附录

文章转自:

[解决Aria2 BT下载速度慢没速度的问题](http://www.senra.me/solutions-to-aria2-bt-metalink-download-slowly/)

<br/>