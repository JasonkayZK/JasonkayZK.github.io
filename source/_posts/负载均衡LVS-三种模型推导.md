---
title: 负载均衡LVS-三种模型推导
cover: https://img.paulzzh.com/touhou/random?78
date: 2020-04-08 08:43:02
categories: 分布式
toc: true
tags: [分布式, 负载均衡, LVS]
description: 在解决高并发时常用的策略就是通过一个负载均衡服务器将用户的请求进行转发给后方真正处理请求的服务器集群, 从而实现HA. 负载均衡通常有基于四层协议的LVS和基于七层协议的Nginx. 本文主要探讨基于四层协议的LVS负载均衡的三种模型的实现
---

在解决高并发时常用的策略就是通过一个负载均衡服务器将用户的请求进行转发给后方真正处理请求的服务器集群, 从而实现HA. 负载均衡通常有基于四层协议的LVS和基于七层协议的Nginx.

本文主要探讨基于四层协议的LVS负载均衡的三种模型的实现

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## 前言

在进行LVS负载均衡的三种模型推导之前, 需要有一些计算机网络相关的基础知识, 即ISO七层网络模型.

不太了解的小伙伴可以通过下面的视频复习一下相关知识:

<iframe src="//player.bilibili.com/player.html?aid=35028934&bvid=BV1Nb411P7Mf&cid=61333294&page=24" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>

><br/>
>
>原视频地址: 
>
>https://www.bilibili.com/video/BV1Nb411P7Mf/?p=24

<br/>

### LVS和Nginx的区别

#### LVS

LVS是基于四层(传输层/TCP层)实现的负载均衡, 主要负责完成用户请求的转发.

**① 原理**

通过观察传输层的状态标志位(如: SYNC, ACK, FIN等标志位)实现跟踪用户请求的状态, 从而实现负载均衡;

LVS主要完成对用户请求的转发, 并且以DR(Direct Routing, 直接路由)模式为主要场景

**② 优点**

由于LVS是基于四层(传输层/TCP层)实现的负载均衡, 所以**LVS在进行负载均衡时并不需要建立三次握手和四次挥手的过程(而Nginx是基于七层模型实现的, 所以进行负载均衡时需要经过三次握手的过程)**

><br/>
>
>**注: 对百度的请求过程**
>
>在通过浏览器登入百度时, 首先进行的是三次握手的过程.
>
><font color="#f00">**需要注意的是, 三次握手的过程是发生在四层(传输层/TCP层)的. 此时七层发出的`GET`请求是一直被阻塞的.**</font>
>
><font color="#f00">**只有当四层的三次握手真正完成, `GET`请求才会真正的被传输.**</font>

><br/>
>
>**注2:**
>
><font color="#f00">**虽然LVS仅仅将数据包转发. 但是LVS会通过窥看数据包传输层的状态标志位来保证三次握手和四次分手的过程不被分隔**</font>
>
><font color="#f00">**即确保一个请求和同一个server建立TCP连接**</font>

><br/>
>
>**注3:**
>
><font color="#f00">**LVS由于不知道数据包的真正内容, 所以一般要求后端请求处理服务器部署的是完全相同的内容**</font>

即LVS可承受的并发量要高于Nginx(几十万并发量)

并且通常**数据包的返回可以不再经由负载均衡服务器**(直接建立客户端->服务器的点对点连接), 所以可以减少负载均衡服务器压力;

并且LVS**基于内核网络层面工作，稳定性最好，对内存和cpu资源消耗极低**

**③ 缺点**

工作在4层，不支持7层规则修改.

同时LVS需要配置后方的RS(Real Server, 后端请求处理服务器)，所以部署复杂，功能单一。

****

#### Nginx

Nginx是基于七层实现的负载均衡, 也就是说Nginx在每一次转发请求时都会首先建立三次握手. 但是建立三次握手后就可以得到用户请求的url, 然后可以灵活的对请求进行转发.

><br/>
>
>**注: 在Nginx 1.9版本以后也支持4层**

**① 优点**

由于Nginx是基于七层实现的负载均衡, 所以**可以明确得知用户的请求路径**. 相比于LVS, Nginx**不会造成资源的倾斜**;

****

**② 缺点**

由于Nginx是面向连接的, 所以**需要对转发的请求建立三次握手.** 相比于LVS效率不太高，只支持1-5万并发

并且**数据包来去都要经过负载均衡器**

<br/>

## 负载均衡LVS-三种模型推导

### LVS简介

LVS，是Linux Virtual Server的简称，也就是Linux虚拟服务器, 是一个由[章文嵩博士](https://baike.baidu.com/item/%E7%AB%A0%E6%96%87%E5%B5%A9/6689425?fr=aladdin)发起的自由软件项目。

LVS由**用户空间的ipvsadm和内核空间的IPVS组成，ipvsadm用来定义规则，IPVS利用ipvsadm定义的规则工作。**

现在**LVS已经是 Linux标准内核的一部分**，在Linux2.4内核以前，使用LVS时必须要重新编译内核以支持LVS功能模块，但是从Linux2.4内核以后，已经完全内置了LVS的各个功能模块，无需给内核打任何补丁，可以直接使用LVS提供的各种功能。

<br/>

### LVS场景术语

LVS中有一些常见的术语，如下表所示：

|      **名称**      | **解释**                                                     |
| :----------------: | :----------------------------------------------------------- |
|      ipvsadm       | 用户空间的命令行工具，用于管理集群服务及集群服务上的RS等；   |
|        IPVS        | 工作于内核上的netfilter INPUT HOOK之上的程序，可根据用户定义的集群实现请求转发； |
|         VS         | Virtual Server ,虚拟服务                                     |
| Director, Balancer | 负载均衡器、分发器                                           |
|       **RS**       | **Real Server  后端请求处理服务器**                          |
|      **CIP**       | **Client IP,客户端IP**                                       |
|      **VIP**       | **Director Virtual IP,负载均衡器虚拟IP**                     |
|      **DIP**       | **Director IP,负载均衡器IP(转发的网络地址)**                 |
|      **RIP**       | **Real Server IP,后端真正处理请求的服务器IP**                |

对应如下图所示:

![lvs四层.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/lvs四层.png)

><br/>
>
>**注:**
>
><font color="#f00">**无论使用什么样的负载均衡技术, 对于客户端来说都应该是透明的**</font>
>
><font color="#f00">**即: CIP不会随着负载均衡的变化而变化, CIP就是向VIP发送请求**</font>

<br/>

### SNAT

SNAT指的是**在使用NAT做地址转换时, 转换的是源地址(Source)**

![SNAT.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/SNAT.png)

如上图所示:

在内网中有192.168.1.88和192.168.1.66两个IP地址想要访问123.123.123.88这个公网IP地址;

此时这两个内网IP会通过子网掩码找到路由出口, 然后通过下一跳的方式连接到路由器; 不妨假设两个机器均使用的是21212端口号做请求;

此时在路由器中会再次开启两个端口分别对应这两个请求, 如上图的:

123: 192.168.1.88:21212

212: 192.168.1.66:21212

然后, 路由器将两个请求的内网IP替换为公网IP(18.18.18.8). 然后以公网IP的形式对外进行访问**(内网IP是不允许存在于公网中的!)**

在123.123.123.88返回请求时, 根据路由器对应的端口号寻找到对应请求的客户端, 并返回数据;

><br/>
>
>**所以SNAT本质上就是做了源IP地址层的替换**

<br/>

### DNAT

与SNAT类似, 只不过在做地址转换时修改的是目标IP地址.

在下面LVS的NAT模型中在发送请求时使用到的就是DNAT.

<br/>

### NAT模型

NAT模型图如下所示:

![lvs_nat.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/lvs_nat.png)

首先, 客户端会从CIP向VIP发送请求, 此时请求到达负载均衡服务器. 但是负载均衡服务器不能直接将当前的请求包转发(**因为数据包的源/目的地址为CIP->VIP**)

所以此时使用DNAT做目标地址转换: 在负载均衡服务器中将VIP替换为RIP**(此时数据包源/目的地址为CIP->RIP)**

但是在RS处理完请求之后, 返回的数据包为RIP->CIP. 此数据包不会被客户端识别(因为客户端建立的Socker通信为CIP<->VIP).

此时需要将RS的默认网关指向LVS负载均衡服务器. 然后再次通过LVS将地址修改回VIP->CIP.

#### NAT模型的不足

在上述模型中不论是请求转发和响应转发都需要经过LVS服务器做代理.

而由于通常情况下用户请求的数据量较小, 但是后端服务器响应的数据量较大. 所以LVS的出口带宽就成为了瓶颈;

优化的方式就是在用户请求时, 通过LVS服务器, 而在服务器返回响应时不再经过LVS转发, 而是直接返回给客户端;

上述优化方式就是LVS的DR模型

<br/>

### DR模型

DR模型即直接路由模型(Direct Routing). 就是在服务器返回响应时, 不再经由LVS转发, 而是直接由服务器响应客户端请求;

DR模型如下图所示:

![lvs_dr.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/lvs_dr.png)

><br/>
>
>**说明:**
>
><font color="#f00">**DR模型是通过在RS中配置隐藏的VIP实现的**</font>
>
>原因是:
>
><font color="#f00">**在RS中必须包含VIP信息才能实现在响应客户端请求时发送出VIP->CIP的数据包**</font>
>
><font color="#f00">**也即: RS中存在两个IP地址, 一个是其本身对外的IP地址, 另一个是VIP(对外隐藏, 对内可见)**</font>

首先, 客户端还是发送CIP->VIP请求;

然后经由LVS服务器将请求转发. 此时由于RS中也存在对内可见的VIP, 所以数据包可以直接发送给后端的RS;

><br/>
>
>**注:**
>
>**在LVS服务器中也存在VIP. 此时如果不对用户的请求包做处理, 请求包将会直接转发会LVS自己!**

><br/>
>
>**注2: 隐藏VIP的方法**
>
>在Linux内核中有两个参数`arp_ignore`和`arp_announce`, 可以通过修改`/proc/sys/net/ipv4/conf/*IF*/`目录下的两个文件即可;
>
>每一个`/*IF*/`目录代表一个网卡的配置(也包括虚拟网卡), 例如:
>
>```bash
>zk@zk:/proc/sys/net/ipv4/conf$ ll
>dr-xr-xr-x 1 root root 0 4月  10 08:53 ./
>dr-xr-xr-x 1 root root 0 4月  10 08:53 ../
>dr-xr-xr-x 1 root root 0 4月  10 08:53 all/
>dr-xr-xr-x 1 root root 0 4月  10 11:57 br-44f57ba828cf/
>dr-xr-xr-x 1 root root 0 4月  10 11:57 br-f2f675760ec5/
>dr-xr-xr-x 1 root root 0 4月  10 08:53 default/
>dr-xr-xr-x 1 root root 0 4月  10 11:57 docker0/
>dr-xr-xr-x 1 root root 0 4月  10 08:53 enp34s0/
>dr-xr-xr-x 1 root root 0 4月  10 11:57 lo/
>```
>
>其中:
>
>-   `all`: 配置对所有网卡生效;
>-   `lo`: 环路网卡
>
><br/>
>
>**配置文件说明:**
>
>-   **arp_ignore:** 定义接收到ARP请求时的**响应级别;**
>    -   0: 只要本地配置的有相应地址, 就给与响应;(默认)
>    -   **1: 仅在请求的目标(MAC)地址配置请求到达的接口上时, 才给予响应;**
>
>-   **arp_announce:** 定义将自己地址向外通告时的**通告级别;**
>    -   0: 将本地任何接口上的任何地址向外通告;(默认)
>    -   1: 试图仅向目标网络通告与其网络匹配的地址;
>    -   **2: 仅向与本地接口上地址匹配的网络进行通告;**
>
>配置上述两个参数后:
>
>在处理请求时, 未在arp_ignore配置的请求将不会做出响应;
>
>同时在操作系统开启时, 不会向所有主机通告自己的地址(ARP表);
>
>从而实现了对外隐藏, 对内可见;

所以在向RS转发请求包之前, LVS会**将请求包的目标MAC地址拼成RS的MAC地址(修改数据链路层/二层)**

然后由MAC地址对应的RS接收到请求, 并处理;

最后, RS使用本机中的VIP将处理后的响应直接发送回客户端(不再经由LVS转发)

<br/>

#### DR模型的不足

根据上述的分析可知, 在LVS向RS进行请求包转发时, 需要修改数据链路层中的目标MAC地址(MAC地址欺骗):

<font color="#f00">**所以就要求LVS和RS在同一个局域网之中**</font>

><br/>
>
>如果LVS和RS不在同一个局域网:
>
>**此时请求包将再次被路由转发, 而在转发时MAC地址会再次被修改, 就无法到达RS**

此外, 在RS和客户端建立连接之后. 要求<font color="#f00">**RS后不可再经历NAT模式, 即RS要有公网IP并直接接入互联网**</font>

所以RS的默认网关应当指向ISP, 并获取到了PIP(公网IP)

<br/>

### TUN模型

有时需要将负载均衡服务器部署在一个地方, 而将RS部署在另外的局域网;

此时就不可再使用DR模型, 而使用的是TUN模型, 即隧道模型;

![lvs_tun.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/lvs_tun.png)

TUN模型类似于VPN技术, 即通过LVS进行代理;

首先客户端发送CIP->VIP请求;

LVS服务器接收到客户端的请求, 然后在用户请求外侧再套上一层请求DIP->RIP(CIP->VIP), 然后转发请求;

最终转发的请求到达RS; 而RS配置了管道技术, 所以会将数据包拆开, 最终获得CIP->VIP的请求;

<br/>

## 附录

文章内容参考:

-   [图解LVS的工作原理](https://blog.csdn.net/gui951753/article/details/80316565)
-   https://www.bilibili.com/video/BV1Nb411P7Mf?p=25



如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>