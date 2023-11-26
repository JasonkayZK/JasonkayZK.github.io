---
title: 【转】浅谈vpn、vps、Proxy以及shadowsocks之间的联系和区别
toc: true
cover: 'https://img.paulzzh.com/touhou/random?55'
date: 2021-03-06 21:05:10
categories: 技术杂谈
tags: [技术杂谈, Shadowsocks, VPN]
description: 一直搞不清楚VPN和Shadowsocks的区别，今天看到了一篇文章，在这里总结一下；
---

一直搞不清楚VPN和Shadowsocks的区别，今天看到了一篇文章，在这里总结一下；

本文部分内容转自：

-   [浅谈vpn、vps、Proxy以及shadowsocks之间的联系和区别](https://medium.com/@thomas_summon/%E6%B5%85%E8%B0%88vpn-vps-proxy%E4%BB%A5%E5%8F%8Ashadowsocks%E4%B9%8B%E9%97%B4%E7%9A%84%E8%81%94%E7%B3%BB%E5%92%8C%E5%8C%BA%E5%88%AB-b0198f92db1b)
-   [Shadowsocks PAC模式和全局模式的区别](https://www.zybuluo.com/gongzhen/note/472805)

<br/>

<!--more-->

## **【转】浅谈vpn、vps、Proxy以及shadowsocks之间的联系和区别**

有一句很经典的话：**所有的VPN和shadowsocks本质上都是正向代理**

这句话不假，<font color="#f00">**客户端主动填入服务端的IP、端口号等地址，然后由服务端主动代替客户端转发请求或是流量，其实这就是正向代理的工作方式；**</font>

那么这些名词：vpn、vps、Proxy、shadowsocks，到底是什么意思呢？PAC和全局模式又是什么呢？

本文作为科普文，希望读过本文之后你能统统了解！

<br/>

### **翻墙原理**

在讨论vpn、Proxy这些之前，我觉得有必要先提一下目前主流翻墙手段的实现原理；

GFW(Great Firewall，特指互联网长城)实现网络封锁的手段主要有两种：**DNS劫持和IP封锁（除此之外，还有DNS污染和关键词过滤，这里我们不讨论）；**

#### **① DNS劫持**

ip是网络上各主机的“地址”，要想访问“别人家”，当然得要有地址。但ip是一串数字，是给电脑看的，人记起来太麻烦，所以就有了域名（也就是我们常说的网址）和 [DNS](https://zh.wikipedia.org/zh-hans/域名系统)（网域名称系统，Domain Name System）；

域名是一串英文字符串，方便人记忆。DNS将域名和ip关联起来，形成映射。用户访问域名所在的目标网站前，将域名发给DNS服务器询问这对映射关系，拿到对应的ip后就可以在茫茫网海中找到那个“她”了。

而GFW所做的就是站在用户和DNS服务器之间，破坏它们的正常通讯，并向用户回传一个假ip。用户拿不到真正的ip，自然也就访问不到本想访问的网站了。

DNS劫持是GFW早期唯一的技术手段，所以那个时候的用户通过修改[Hosts](https://zh.wikipedia.org/wiki/Hosts文件)文件的方式就可以零成本突破封锁了。

#### **② IP封锁**

DNS劫持之后，GFW引入了ip封锁，直接锁住了访问目标网站的去路，用户发往被封锁ip的任何数据都会被墙截断。这个时候，依靠类似于修改Hosts文件这种低成本方法突破封锁就显得有些天方夜谭了。那么，解决办法是什么呢？

答案是：<font color="#f00">**在第三方架设翻墙服务器，中转与目标服务器间的来往流量。**</font>

目前为止，GFW采用的是黑名单模式，像Google、Facebook这种在黑名单上的网站的ip无法访问，而不在黑名单上的第三方不记名ip可以。于是，一切就很明朗了，我们目前几乎所有的翻墙手段都是基于上述原理实现的，vpn是，shadowsocks是，还有一些比较冷门的（比如v2ray）同样如此，只不过它们的技术细节不同（这个我们不会深入）。

<br/>

### **VPN**

VPN，全称“虚拟私人网络（Virtual Private Network）”，是一种加密通讯技术。

VPN是一个统称，它有很多的具体实现，比如：PPTP、L2TP、IPSec和openVPN；

VPN的出现远早于GFW，所以它不是为了翻墙而生的。我上面说了，VPN是一种加密通讯技术，它被设计出来的目的是数据传输安全和[网络匿名](https://zh.wikipedia.org/wiki/匿名)；

<font color="#f00">**既然不是为翻墙而生，那从翻墙的角度上讲，VPN协议就存在诸多问题。最严重的一个就是流量特征过于明显。墙目前已经能够精确识别绝大部分VPN协议的流量特征并给予封锁，所以，VPN这种翻墙方式基本已经废了。**</font>

但即便如此，VPN作为过去很长一段时间最主流、最热门、最常用、最为人所知的翻墙手段，已然成为翻墙的代名词，即便是VPN已不再常用的今天，当人们谈及翻墙的时候，说得最多的仍是：“你有什么好用的VPN吗？”

<br/>

### **Proxy（代理）**

#### **① 反向代理**

Proxy（代理）又分为正向代理和反向代理。翻墙所用的代理都是正向代理。反向代理的作用主要是为服务器做缓存和负载均衡，这里不做过多讨论。

>   对**代理模式**感兴趣的朋友可以看我之前写的一篇文章：
>
>   -   [Java中的代理模式-静态代理与动态代理](/2019/09/18/Java%E4%B8%AD%E7%9A%84%E4%BB%A3%E7%90%86%E6%A8%A1%E5%BC%8F-%E9%9D%99%E6%80%81%E4%BB%A3%E7%90%86%E4%B8%8E%E5%8A%A8%E6%80%81%E4%BB%A3%E7%90%86/)
>
>   对负载均衡感兴趣的也可以查看我之前写的负载均衡相关的系列文章：
>
>   -   [tag: 负载均衡](/tags/%E8%B4%9F%E8%BD%BD%E5%9D%87%E8%A1%A1/)

顺带一提，shadowsocks里也有负载均衡的概念，但shadowsocks的负载均衡和反向代理的负载均衡不是一个概念；

反向代理的负载均衡是指：在多个真正的服务器前架设一个代理服务器，用户所有的数据都发给代理服务器，然后代理服务器根据各个真实服务器的状态将数据转发给一个任务较少的服务器处理；这样，服务商既可以架设多个服务器分担任务、减轻压力，用户也只要记一个域名或ip就可以了；

而<font color="#f00">**shadowsocks的负载均衡是指：每隔一段时间更改一次翻墙服务器，将用户的数据平均发给多个不同的翻墙服务器，以避免发往某一个翻墙服务器的流量过多；**</font>

#### **② 正向代理**

正向代理主要有HTTP、HTTP over TLS(HTTPS)、Socks、Socks over TLS几种；其中，HTTP和Socks无法用于翻墙，HTTPS和Socks over TLS可以用于翻墙；不过，Socks over TLS几乎没人用，我们这里就不多说了；

Proxy的历史同样早于GFW，<font color="#f00">**Proxy最早被设计出来的目的当然也不是翻墙；正向代理最主要的目的和vpn差不多，都是用于匿名，但HTTP和Socks不能加密，只能匿名，HTTPS既可以匿名，也可以用于加密通信；**</font>

从理论上讲，四种正向代理协议都可以通过**“用户先将数据发给代理服务器，再由代理服务器转发给目的服务器”**的方法达到翻墙目的；

<font color="#f00">**但由于HTTP和Socks都是明文协议，GFW可以通过检查数据包内的内容得知用户的真实意图，进而拦截数据包；所以，HTTP和Socks一般只用作本地代理；**</font>

<font color="#f00">**而HTTPS协议是加密通讯，GFW无法得知数据包内的真实内容，类似于关键词过滤的手段无法施展；不仅如此，HTTPS代理的流量特征和我们平时访问网站时所产生的HTTPS流量几乎一模一样，GFW无法分辨，稳定性爆表；**</font>

理论上讲，HTTPS代理无论是安全性，还是在隐匿性，都要比目前最为流行的shadowsocks好；事实上，相比于所有已知的翻墙协议，无论是vpn协议，还是代理协议，HTTPS应该都是最好的；

v2ray的vmess over tls也许能和HTTPS代理媲美；但v2ray存在的时间较短、使用者较少、社区也没有HTTPS代理活跃（从全球范围上看）；故而，相比于HTTPS代理，vmess协议潜在的安全漏洞可能要多；

当然，HTTPS代理也有它的缺点，其中<font color="#f00">**HTTPS最大的缺点就是：配置复杂；**</font>

即便能用默认参数就用默认参数，用户自己只作最低限度的配置，对新手而言，这也是一个无比痛苦的过程；更别说，想要正常使用HTTPS代理，你还要购买域名和证书这些，非常麻烦；

所以，即便是在shadowsocks出现之前，HTTPS代理也没在大陆流行起来；

这也是造成v2ray的小众的主要原因之一（另一个是用户没有从shadowsocks迁移到v2ray的动力），它的配置同样相当复杂；

除此之外，<font color="#f00">**HTTPS代理只能转发tcp流量，对udp无能为力；**</font>

>   这里推荐刘亚晨先生的一篇文章：
>
>   -   [各种加密代理协议的简单对比](https://medium.com/@Blankwonder/各种加密代理协议的简单对比-1ed52bf7a803)

<br/>

### **VPS**

再来说说VPS。

大家不妨想一个问题：我们平时上网浏览网页，我们访问的那些网页都是哪来的？答案很简单，从另一台电脑上下载下来的；无论是用户平时所使用的个人pc，还是用于搭载网站的服务器，本质上都是电脑；但与个人pc不同，被用作服务器的电脑必须做到24小时开机在线，以确保能在任何时候回应用户的请求；而vps，就是不会关机的电脑；

VPS（Virtual private server，虚拟专用服务器）是由vps提供商维护，租用给站长使用的“不会关机的电脑”。<font color="#f00">**vps不是一台台独立的电脑，而是将一台巨型服务器通过虚拟化技术分割成若干台看似独立的服务器；**</font>

这台巨型服务器不间断运行，被分割出来的小服务器也跟着不停的运作，站长租用其中一台小服务器，搭载上自己的站点，就可以等着用户访问了；

那么，个人电脑能不能做服务器呢？当然可以！我上面说，“与个人pc不同，被用作服务器的电脑必须做到24小时开机在线，以确保能在任何时候回应用户的请求。”这句话反过来看，如果个人pc能做到24小时在线，它同样也可以用作服务器；

事实上，有不少个人网站就是搭载在家中闲置的电脑上的。同时，还有人选择用树莓派、个人NAS建站。但是，由于大陆的ISP运营商面向普通网民提供的是动态ip，绑定域名很不方便，再加上宽带上网上下行网速不对等、网络稳定性不高等问题，大部分人还是选择使用vps建站；（除此之外，前一段时间，政府下达了新政令，要求运营商封禁个人宽带网络的443端口和80端口，至此，个人pc建站几无可能）；

那么，vps和vpn、Proxy以及我们后面会说的shadowsocks有什么关系呢？很简单，vps可以用来搭建网站，当然也可以用来承载vpn服务器、代理服务器或是shadowsocks的服务器啦；建站固然是vps最主要的作用，但绝对不是它唯一的作用，既然vps本质上也是电脑，那电脑能做的事它当然也能做；

>   **听起来VPS和云服务器貌似是同一个玩意，但是还是有一小点区别的！**
>
>   上面谈到了：<font color="#f00">**vps不是一台台独立的电脑，而是将一台巨型服务器通过虚拟化技术分割成若干台看似独立的服务器；**</font>
>
>   所以，<font color="#f00">**VPS是在`单台电脑上`切分出来的多个虚拟服务器，如果母服务器出问题了，就意味着全部在里面的虚拟主机也出问题了，属于一损俱损；**</font>
>
>   <font color="#f00">**而云服务器是由硬件隔离、众多的服务器组成的云集群，并且云服务器的集群一台服务器出问题，还有镜像文件，不会有任何中断**</font>
>
>   所以可以说：<font color="#f00">**云服务器其实就是VPS的升级版**</font>

<br/>

### **shadowsocks**

接下来，就是我们的shadowsocks闪亮登场了。

介绍之前，我这里先附上shadowsocks的[官网链接](http://www.shadowsocks.org/en/index.html)，英文比较好的同学建议看看官网上对shadowsocks的介绍；

在shadowsocks之前，墙内网民主要依靠寻找现成的技术实现翻墙，比如：vpn、HTTPS、tor的中继网桥以及之后的meek插件等等；

虽然也有自己的技术，比如：一种依靠Google隐藏ip实现翻墙的技术（名字忘了），但毕竟难成大器，再加上GFW逐渐加大对VPN的干扰，人们迫切需要一种简单可靠的技术来抵御GFW的进攻；

于是，大概是在2013年吧（具体时间我也不太清楚），[@clowwindy](https://github.com/clowwindy)带着他的shadowsocks横空出世；

<font color="#f00">**Shadowsocks同样是一种代理协议，但是作为clowwindy为国人设计的专门用于翻墙的代理协议，相对于vpn，shadowsocks有着极强的隐匿性；**</font>

相对于HTTP代理，shadowsocks提供了较为完善的加密方案，虽然比不上HTTPS代理和vpn，但使用的也是成熟的工业级的加密算法，普通个人用户完全不用顾虑；相对于HTTPS代理，shadowsocks的安装配置更为简单，中文社区更为活跃，中文文档教程更完善，**更符合中国国情**；

Shdadowsocks最初的版本是由clowwindy使用Python实现的，所以clowwindy的版本被称为Python版；

在shadowsocks有点名气之后，不同的开发者使用不同的编程语言为其写了很多分支版本；比如：[@cyfdecyf](https://github.com/cyfdecyf)开发维护的Go版本，[@madeye](https://github.com/madeye)开发维护的libev版本（由纯C语言编写，基于libev库开发），由[@librehat](https://github.com/librehat)开发维护的c++版，由[@zhou0](https://github.com/zhou0)开发维护的Perl版。这些版本的安装使用指南都可以在shadowsocks的官网上查阅；

2015年，clowwindy因喝茶事件被迫停止了shadowsocks的维护，并删除了其开源在GitHub上的代码，Python版就此停滞；但其它版本仍处于维护更新中；其中，更新最频繁，新技术跟进最快的是由@madeye维护的libev版本；

这里有必要说明下：

目前，shadowsocks协议（请区分“shadowsocks协议”和“shadowsocks协议的具体实现”这两者的区别）是由shadowsocks社区内的成员共同维护，协议上任何新改进都是社区成员共同商讨的结果；但对这些变化，不同的版本的shadowsocks跟进速度不同；

而跟进速度最快的就是我上面说的libev版：无论是[SIP007](https://github.com/shadowsocks/shadowsocks-org/issues/42)确认的ADEA Ciphers（一种同时进行认证和加密的算法），还是[SIP003](https://github.com/shadowsocks/shadowsocks-org/issues/28)引进的simple-obfs（tor开发的一种混淆插件），shadowsocks-libev都是最早引入自己软件的；

![shadowsocks_version](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/shadowsocks_version.jpeg)

上表是我从shadowsocks官网上直接搬下来的，显示了目前各版本的shadowsocks对协议新特性的支持情况；

当然，这里说的全是服务端的shadowsocks，客户端的没提，也没法提，因为实在太多了，比如比较出名的两个：surge和shadowrocket；

这些客户端有好有坏，良莠不齐，对shadowsocks协议的支持程度也不一样，有的需要付费（iOS端基本都要付费，而安卓端则基本免费），费用也不一样。而且，这些客户端绝大部分都不是shadowsocks社区的“官方客户端”，而是第三方开发者制作的客户端；

>   关于个人搭建shadowsocks：
>
>   -   [【转】ShadowsocksR部署](/2020/10/01/%E3%80%90%E8%BD%AC%E3%80%91ShadowsocksR%E9%83%A8%E7%BD%B2/)

<br/>

### **Shadowsocks中PAC模式和全局模式的区别**

最后，我想聊一聊在Shadowsocks中PAC模式和全局模式的区别；

Shadowsocks的全局模式，是设置你的操作系统代理的代理服务器，使你的所有http/socks数据全部经过代理服务器的转发送出；

>   <font color="#f00">**注意：只有支持socks5或者使用系统代理的软件才能使用Shadowsocks（一般的浏览器都是默认使用系统代理）；**</font>
>
>   经过代理服务器的IP会被更换，连接Shadowsocks需要知道IP、端口、账号密码和加密方式；
>
>   （Shadowsocks因为可以自由换端口，所以定期换端口就可以有效避免IP被封！）

而PAC模式就是：会在你连接网站的时候读取PAC文件里的规则，来确定你访问的网站有没有被墙，如果符合，那就会使用代理服务器连接网站，而PAC列表一般都是从GFWList更新的；

>   GFWList定期会更新被墙的网站（不过一般挺慢的）：
>
>   -   https://github.com/gfwlist/gfwlist

简单地说，在全局模式下，所有网站默认走代理；而PAC模式是只有被墙的才会走代理，推荐PAC模式，如果PAC模式无法访问一些网站，就换全局模式试试，一般是因为PAC更新不及时（也可能是GFWList更新不及时）导致的；

>   最后，再说一下：
>
>   <font color="#f00">**使用Shadowsocks模式时，Chrome不需要Proxy SwitchyOmega和Proxy SwitchySharp插件，这两个插件的作用就是，快速切换代理，判断网站需不需要使用某个代理的（ss已经有pac模式了，所以不需要这个）；**</font>
>
>   <font color="#f00">**所以，如果你只用shadowsocks的话，就不需要这个插件了！**</font>

<br/>

## **附录**

本文部分内容转自：

-   [浅谈vpn、vps、Proxy以及shadowsocks之间的联系和区别](https://medium.com/@thomas_summon/%E6%B5%85%E8%B0%88vpn-vps-proxy%E4%BB%A5%E5%8F%8Ashadowsocks%E4%B9%8B%E9%97%B4%E7%9A%84%E8%81%94%E7%B3%BB%E5%92%8C%E5%8C%BA%E5%88%AB-b0198f92db1b)
-   [Shadowsocks PAC模式和全局模式的区别](https://www.zybuluo.com/gongzhen/note/472805)

<br/>