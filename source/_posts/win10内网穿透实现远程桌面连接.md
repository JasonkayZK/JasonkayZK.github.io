---
title: win10内网穿透实现远程桌面连接
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?20'
date: 2020-09-02 21:29:11
categories: 工具分享
tags: [工具分享, 内网穿透]
description: 由于最近要回导师公司，但是又不想让我新配的3700X、32G内存台式机浪费，所以可以在学校开内网穿透，在公司使用远程桌面继续使用；
---

由于最近要回导师公司，但是又不想让我新配的3700X、32G内存台式机浪费，所以可以在学校开内网穿透，在公司使用远程桌面继续使用；

内网穿透使用的是：

-   https://www.natfrp.com/

<br/>

<!--more-->

<br/>

## win10内网穿透实现远程桌面连接

### 前言

Sakura frp之前是一个个人项目，后来因为各种原因被转让给了 iDea Leaper 小组负责后续管理和运营；

>   <BR/>
>
>   具体可见：http://machbbs.com/v2ex/48954

SAKURA-FRP内网穿透相当良心（如果经常使用或者有钱的话可以给作者赞助一下，毕竟开发这个确实不容易且非常良心）：

免费用户不限流量，虽然限速，但每天可以通过签到获得高速流量，每次签到最少获得1G；

新注册用户送5G高速流量，限速后依然有4Mbps！很多收费的内网穿透VIP用户都没这个网速，没见过比这更良心的了！

<BR/>

### 被控电脑接入过程

**① Sakura frp账号注册**

首先在官网注册Sakura frp账号：

https://www.natfrp.com/

官网大概是这个样子的：

![frp1.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/frp1.png)

点击注册账号，填写资料注册账号；

注册完成后的界面长这样，左边是菜单栏：

![frp2.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/frp2.png)

记住自己的访问密钥，待会用得上，同时不要把访问密钥透露给其他人！

点击左边菜单栏的软件下载，根据系统类型选择对应的客户端进行下载安装，win10选第一个就好了；

下载，然后解压缩即可：

![frp3.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/frp3.png)

至此，网页注册完成！

>   <BR/>
>
>   <font color="#f00">**注册可以在任意电脑完成，但下载客户端一定要下到被控电脑上！**</font>

****

**② 允许连接远程桌面**

在控制面板中找到“系统”，点击左边的远程设置：

![frp4.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/frp4.png)

把“允许远程协助连接这台计算机”前面的框勾上，下面选择“允许远程连接到此计算机”：

![frp5.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/frp5.png)

然后点“选择用户”，注意看红框圈出的位置，这是被控电脑的用户名，待会用得上：

![frp6.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/frp6.png)

然后点确定保存就好；

>   <BR/>
>
>   **如果被控电脑没有开机密码的话要加一步：**
>
>   在运行中输入gpedit.msc进入组策略管理器；
>
>   依次点击左侧的：计算机配置->windows设置->安全设置->本地策略->安全选项；
>
>   把“账户：使用空白密码的本地帐户只允许控制台登陆”禁用才可以连的上：
>
>   ![frp7.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/frp7.png)
>
>   如果是家庭版的系统是没有组策略管理器的，需要加入组策略管理器，这里不再赘述；

****

**③ 内网穿透**

打开刚才下载的软件：

![frp8.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/frp8.png)

软件大概长这样，用刚才网页上的访问密钥进行登陆：

![frp9.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/frp9.png)

登陆完成后，点左边菜单栏的隧道，可以看到目前已经配置了一个隧道：

![frp10.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/frp10.png)

点击加号新建隧道，输入本机IP，端口填win10远程桌面的端口，默认是3389，隧道名称随便填，如果不填的话就会产生一个随机的名称，隧道类型选择TCP；

远程端口可以自己指定，范围是10240~65535，不能和已有的重复，默认为0，此时会给你随机分配一个；

服务器看情况自己选择，一般没有特殊需求就选国内的服务器，关于服务器的详细情况可以去官网上看；

最后注意看一下左边的监听端口，类型为TCP的有没有3389这个端口，一般就在前面，如果没有的话就是远程桌面端口没有开启！

![frp11.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/frp11.png)

点击创建，会弹出创建成功提示框，点击是，会多出一条记录：

![frp12.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/frp12.png)

最后，点击开启刚才的隧道，会弹出日志信息，记住这个日志信息上面的IP或者服务器域名，待会通过这个IP连接被控电脑：

![frp13.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/frp13.png)

至此，内网穿透全部搞定，被控电脑全部设置完毕；

<br/>

### 远程连接电脑

上面创建内网穿透的过程其实就是分配了一个公网IP，所以接下来我们可以通过这个公网IP来访问我们的电脑；

#### Windows远程连接

win10提供了相当给力的远程连接工具：“远程桌面连接”；

填入内网穿透的地址、远程计算机账户名、密码(无密码留空)即可远程；

****

#### iOS等设备连接

微软为iOS等提供了远程连接的APP，可在App Store免费下载：

microsoft remote desktop for ios

使用方式和上面的方法类似；

<BR/>