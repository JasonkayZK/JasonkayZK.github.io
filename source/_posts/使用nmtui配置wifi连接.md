---
title: 使用nmtui配置wifi连接
toc: true
cover: 'https://img.paulzzh.com/touhou/random?75'
date: 2024-07-18 08:25:47
categories: 技术杂谈
tags: [技术杂谈]
description: 笔记本作为服务器，可以通过使用nmtui来配置wifi实现网络连接；
---

笔记本作为服务器，可以通过使用nmtui来配置wifi实现网络连接；

<br/>

<!--more-->

# **使用nmtui配置wifi连接**

首先安装 nmtui，然后直接输入 nmtui 命令配置连接即可；

配置参考：

-   https://ubunlog.com/zh-CN/nmtui%E6%88%96nmcli%E4%BB%8E%E7%BB%88%E7%AB%AF%E5%BB%BA%E7%AB%8BWi-Fi%E8%BF%9E%E6%8E%A5/

需要注意：

**1、需要正确安装无线网卡驱动，否则可能搜索不到Wifi；**

<br/>

**2、配置Wifi后可能也会出现`temporary failure in name resolution`错误；**

可能是没有正确配置 DNS 解析；

修改：

/etc/resolv.conf

```
nameserver 114.114.114.114
nameserver 8.8.8.8
```

重启解析服务：

```
systemctl restart systemd-resolved.service
```

即可！

<br/>

# **附录**

文章参考：

-   https://docs.redhat.com/zh_hans/documentation/red_hat_enterprise_linux/8/html/configuring_and_managing_networking/proc_configuring-a-wifi-connection-by-using-nmtui_assembly_managing-wifi-connections
-   https://ubunlog.com/zh-CN/nmtui%E6%88%96nmcli%E4%BB%8E%E7%BB%88%E7%AB%AF%E5%BB%BA%E7%AB%8BWi-Fi%E8%BF%9E%E6%8E%A5/
-   https://www.redswitches.com/blog/fix-temporary-failure-in-name-resolution/

<br/>
