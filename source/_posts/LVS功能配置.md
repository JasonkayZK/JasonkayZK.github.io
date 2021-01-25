---
title: LVS功能配置
cover: https://acg.toubiec.cn/random?11
date: 2020-04-10 11:49:22
categories: 分布式
toc: true
tags: [分布式, 负载均衡, LVS]
description: 紧接着上一篇LVS三种模型的推导, 本文介绍了LVS的相关配置
---

紧接着上一篇LVS三种模型的推导, 本文介绍了LVS的相关配置

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## LVS功能配置

在上一篇文章[负载均衡LVS-三种模型推导](https://jasonkayzk.github.io/2020/04/08/负载均衡LVS-三种模型推导/)我们进行了LVS三种常用的工作模型的介绍.

本文在此基础之上介绍LVS相关功能的配置;

### LVS网卡配置

在前面讲到, 为了实现DR模型, 需要在RS中配置一个对外隐藏, 对内可见的VIP.  而在Linux内核中有两个参数`arp_ignore`和`arp_announce`, 可以通过修改`/proc/sys/net/ipv4/conf/*IF*/`目录下的两个文件即可;

每一个`/*IF*/`目录代表一个网卡的配置(也包括虚拟网卡), 例如:

```bash
zk@zk:/proc/sys/net/ipv4/conf$ ll
dr-xr-xr-x 1 root root 0 4月  10 08:53 ./
dr-xr-xr-x 1 root root 0 4月  10 08:53 ../
dr-xr-xr-x 1 root root 0 4月  10 08:53 all/
dr-xr-xr-x 1 root root 0 4月  10 11:57 br-44f57ba828cf/
dr-xr-xr-x 1 root root 0 4月  10 11:57 br-f2f675760ec5/
dr-xr-xr-x 1 root root 0 4月  10 08:53 default/
dr-xr-xr-x 1 root root 0 4月  10 11:57 docker0/
dr-xr-xr-x 1 root root 0 4月  10 08:53 enp34s0/
dr-xr-xr-x 1 root root 0 4月  10 11:57 lo/
```

其中:

-   `all`: 配置对所有网卡生效;
-   `lo`: 环路网卡

<br/>

**配置文件说明:**

-   **arp_ignore:** 定义接收到ARP请求时的**响应级别;**
    -   0: 只要本地配置的有相应地址, 就给与响应;(默认)
    -   **1: 仅在请求的目标(MAC)地址配置请求到达的接口上时, 才给予响应;**

-   **arp_announce:** 定义将自己地址向外通告时的**通告级别;**
    -   0: 将本地任何接口上的任何地址向外通告;(默认)
    -   1: 试图仅向目标网络通告与其网络匹配的地址;
    -   **2: 仅向与本地接口上地址匹配的网络进行通告;**

配置上述两个参数后:

在处理请求时, 未在arp_ignore配置的请求将不会做出响应;

同时在操作系统开启时, 不会向所有主机通告自己的地址(ARP表);

从而实现了对外隐藏, 对内可见;

><br/>
>
>**此外, 在只有一块网卡的情况下, 应当将配置配置在lo网卡上!**
>
><font color="#f00">**否则对于arp_ignore而言: 在模式1下, 无论如何都会接受到请求(无法实现目标请求MAC地址过滤)**</font>

<br/>

### LVS管理程序

在Linux中由ipvs实现LVS的功能, 而此功能是嵌入Linux内核中的.

所以**在进行交互时需要使用`ipvsadm`应用程序来管理;**

<br/>

### LVS调度方法

**① 静态调度算法**

-   rr: 轮询;
-   wrr: 加权轮询
-   dh
-   sh

****

**② 动态调度算法**

LVS不会对客户端建立三次握手

但是可以通过窥探第四层传输层的标识符来记录当前RS连接数, 进而进行动态调度算法

-   lc: 最少连接;
-   wlc: 加权最少连接;
-   sed: 最短期望延迟;
-   nq: never queue
-   LBLC: 基于本地的最少连接
-   DH
-   LBLCR: 基于本地的带复制功能的最少连接;

><br/>
>
>**在LVS中默认调度算法为WLC**

<br/>

### LVS命令

首先安装ipvsadm应用程序:

```bash
yum install ipvsadm -y
```

然后配置ipvs管理集群服务

><br/>
>
>**IPVS需要配置两个方案:**
>
>-   **一套用于配置收到什么样的数据包时进行负载均衡;(发送而来的包)**
>-   **另一套用于配置将收到的包给予那些服务器进行负载均衡;(发出的包)**
>
>**配置参数分别为`-A`和`-a`**

#### 对监控包的设置`-A`

-   添加: -A -t|u|f service-address [-s scheduler]
    -   -t: TCP协议的集群
    -   -u: UDP协议的集群
    -   -f: FWM: 防火墙标记
    -   service-address: VIP的地址以及端口号
    -   -s scheduler: 调度算法
-   修改: -E
-   删除: -D -t|u|f service-address

例如:

`ipvsadm -A -t 192.168.9.100:80 -s rr`表示, 客户端在请求192.168.9.100:80的TCP连接时, 会使用负载均衡;

><br/>
>
>**IPVS支持配置多个IP地址的负载均衡**
>
>例如:
>
>在上面配置的基础上, 再进行`ipvsadm -A -t 172.16.11.1:8080 -s rr`配置
>
>则会同时对192.168.9.100:80以及172.16.11.1:8080两个地址进行负载均衡;**(但是他们是单独负载均衡)**

****

#### 对负载包的设置`-a`

-   添加: -a -t|u|f service-address -r server-address [-g|i|m] [-w weight]
    -   -t|u|f service-address: 事先定义好的某集群服务
    -   -r server-address: 某RS的地址, 在NAT模型中可以使用IP:PORT实现端口映射;
    -   -g|i|m: LVS类型, 默认为DR模型
        -   -g: DR
        -   -i: TUN
        -   -m: NAT
    -   -w weight: 定义RS的权重
-   修改: -e
-   删除: -d -t|u|f service-address -r server-address

例如:

`ipvsadm -a -t 172.16.100.1:80 -r 192.168.10.8 -g`

`ipvsadm -a -t 172.16.100.1:80 -r 192.168.10.9 -g`

上面两条命令增加了两个对负载包的配置, 即对VIP`172.16.100.1:80`配置了两个负载均衡RS: 192.168.10.8和192.168.10.9; 并指定使用DR模型;

****

**LVS配置查看**

-   -L|I: 显示出负载了哪些包/监控了哪些RS
-   -n: 数字格式显示主机地址和端口
-   `--stats`: 统计数据
-   `--rate`: 速率
-   `--timeout`: 显示tcp, tcpfin和udp的会话超时时长;
-   **-c: 显示当前的ipvs连接状况(LVS负载的记录)**

****

**LVS删除与保存**

-   删除:
    -   -C: 清空IPVS规则, 删除所有集群服务;
-   保存:
    -   -S
-   载入此前的规则:
    -   -R

例如: 

`ipvsadm -S > /path/to/somefile`用于将当前配置保存在文件中;

`ipvsadm -R < /path/to/somefile`用于载入配置文件中的配置;

><br/>
>
>**ipvsadm没有配置文件, 但是可以通过向内核导入导出完成配置**

<br/>

## 附录

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>