---
title: 简单易用的内网穿透组网工具ZeroTier
toc: true
cover: 'https://img.paulzzh.com/touhou/random?5'
date: 2024-07-28 09:32:46
categories: 技术杂谈
tags: [技术杂谈]
description: ZeroTier 是一款非常简单易用的内网穿透工具，不需要配置，就能实现虚拟局域网的组建，让你可以在外也能连回家中、学校、办公室的电脑获取资料，数据。配置与使用都非常简单，堪称「 无配置，零基础」；
---

ZeroTier 是一款非常简单易用的内网穿透工具，不需要配置，就能实现虚拟局域网的组建，让你可以在外也能连回家中、学校、办公室的电脑获取资料，数据；

配置与使用都非常简单，堪称「 无配置，零基础」；

<br/>

<!--more-->

# **简单易用的内网穿透组网工具ZeroTier**

>   项目地址：https://github.com/zerotier/ZeroTierOne
>
>   官网：https://www.zerotier.com/

## **使用方法**

1.  [注册 ZeroTier](https://my.zerotier.com/)，获得 Internal ID；
2.  创建私有局域网，获得 Network ID；
3.  安装客户端，加入 Network ID（或邀请 Internal ID 加入）；
4.  连接；

>   安装步骤参考官网即可：
>
>   -   https://www.zerotier.com/download/
>
>   创建和网络配置方法基本上默认的就行，比较简单，这里不再赘述～

需要注意的是，在使用客户端加入网络时，首先执行：

```bash
zerotier-cli join <network-id>
```

随后还需要在网页的控制台上授权使用，例如：

![](https://www.netopt.net/group1/M00/00/A9/rBEADGNzljiACLJVAABPyE1wl0E887.png)

设置好以后，可以看到有分配IP了，就可以像访问你自己的本地网络一样去访问你远端的计算机了；

>   小技巧：
>
>   在上面的设置中，可以：
>
>   -   **修改 `short-name`，添加各个设备的tag；**
>   -   **开启 `Do Not Auto-Assign IPs`，然后通过右侧手动分配静态的IP地址；**

<br/>

参考文章：

-   https://zhuanlan.zhihu.com/p/422171986
-   https://www.appinn.com/zerotier-one/
-   https://post.smzdm.com/p/awkom242/
-   https://netopt.net/topic/c7d7ce1aff79bbd26ca53f7dc3431b4b
-   https://juejin.cn/post/7161224755519946759
-   https://muzihuaner.github.io/2021/09/22/%E5%86%85%E7%BD%91%E7%A9%BF%E9%80%8F%E7%A5%9E%E5%99%A8ZeroTier%E4%BD%BF%E7%94%A8%E6%95%99%E7%A8%8B/

<br/>
