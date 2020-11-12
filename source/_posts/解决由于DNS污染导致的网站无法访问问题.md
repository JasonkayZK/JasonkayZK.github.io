---
title: 解决由于DNS污染导致的网站无法访问问题
cover: https://acg.yanwz.cn/api.php?20
date: 2020-04-21 20:00:37
categories: [技术杂谈]
toc: true
tags: [技术杂谈, inoreader, RSS]
description: 大概在一个月以前inoreader在国内突然不能访问了, 其实是DNS污染造成的, 通过修改本地的hosts即可访问 ;
---

大概在一个月以前inoreader在国内突然不能访问了, 其实是DNS污染造成的, 通过修改本地的hosts即可访问 ;

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## 解决由于DNS污染导致的网站无法访问问题

### DNS污染

[DNS污染](https://www.dns.com/speed.html)，又称为域名服务器缓存污染（DNS cache pollution）或者域名服务器快照侵害（DNS cache poisoning）。[DNS污染](https://www.dns.com/speed.html)是指一些刻意制造或无意中制造出来的域名服务器分组，把域名指往不正确的IP地址。

一般来说，网站在互联网上一般都有可信赖的域名服务器，但为减免网络上的交通，一般的域名都会把外间的域名服务器数据暂存起来，待下次有其他机器要求解析域名时，可以立即提供服务。一旦有相关网域的局域域名服务器的缓存受到污染，就会把网域内的电脑导引往错误的服务器或服务器的网址。

**某些网络运营商为了某些目的，对[DNS](https://www.dns.com)进行了某些操作，导致使用ISP的正常上网设置无法通过域名取得正确的IP地址。某些国家或地区为出于某些目的防止某网站被访问，而且其又掌握部分国际DNS根目录服务器或镜像，也可以利用此方法进行屏蔽。**

这和某些运营商利用DNS劫持域名发些小广告不同，[DNS](https://www.dns.com)污染则让域名直接无法访问了

><br/>
>
>**小贴士:**
>
>你也可以设置具体的DNS服务器来屏蔽一些非法网站, 从而近似实现青少年模式hhh~

<br/>

### DNS污染解决方法

**修改DNS配置**

Linux中修改DNS配置有三种方法

**1.HOST本地DNS解析**

```
# 修改本地hosts文件配置
vi /etc/hosts
# 添加规则
223.231.234.33 www.baidu.com
```

**2.网卡配置文件DNS服务地址**

```
vi /etc/sysconfig/network-scripts/ifcfg-eth0
添加规则 例如:
DSN1='114.114.114.114'
```

3.系统默认DNS配置

```
vi /etc/resolv.conf
添加规则 例如:
nameserver 114.114.114.114
```

>   <br/>
>
>   **解析的优先级: 1>2>3**
>
>   即:
>
>   **本地HOST >  网卡配置  >  系统默认DNS配置**

****

#### 更换DNS服务器

DNS被污染的解决方法有很多, 而最直接的就是换一个DNS即可;

如: 我们常用的有114.114.114.144或者8.8.8.8;

但是其实8.8.8.8效率并不是那么高;

所以我们可以修改DNS配置, 使我们使用那些响应和解析更快的DNS服务器;

对于这些公用的DNS服务器网上有一大堆, 这里不再赘述, 可以参考:

-   DNS评测: [国内外优秀公共DNS测评及推荐](https://baijiahao.baidu.com/s?id=1610680975248109822&wfr=spider&for=pc)
-   知乎问题: [公共DNS哪家强？](https://www.zhihu.com/question/32229915/answer/574532020?utm_source=wechat_session)

****

#### 修改本地DNS解析

除了修改DNS服务器这种方式之外, 有时只是对于某个特定域名的网站无法访问;

此时通过修改本地的hosts文件修改本地DNS解析即可解决问题**(如Github无法访问, Inoreader无法访问, 甚至是Google);**

而在配置hosts时需要已知目标域名的ip地址, 可以通过下面这个网站查找:

https://www.ipaddress.com/

然后在hosts中配置对应ip即可访问;

><br/>
>
>**修改hosts的弊端:**
>
>对于互联网上的IP地址, 如Github的IP地址不是一成不变的!
>
>所以如果在hosts中将ip地址写死, 可能过一段时间就需要手动去修改ip, 较为麻烦;
>
>**但是在国内这种各个地区的ISP都大搞墙、DNS污染等；与其相信运营商，还不如相信我们自己…**

<br/>

## 附录

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>