---
title: Zerotier配置内网流量转发
toc: true
cover: 'https://img.paulzzh.com/touhou/random?8'
date: 2024-08-21 09:51:01
categories: 技术杂谈
tags: [技术杂谈]
description: 在上一篇文章《简单易用的内网穿透组网工具ZeroTier》中，简单介绍了组网工具Zerotier；实际上，我们可以通过Ip Forward的方式来访问组网设备内网下的其他设备！
---

在上一篇文章[《简单易用的内网穿透组网工具ZeroTier》](/2024/07/28/%E7%AE%80%E5%8D%95%E6%98%93%E7%94%A8%E7%9A%84%E5%86%85%E7%BD%91%E7%A9%BF%E9%80%8F%E7%BB%84%E7%BD%91%E5%B7%A5%E5%85%B7ZeroTier/)中，简单介绍了组网工具Zerotier；

实际上，我们可以通过Ip Forward的方式来访问组网设备内网下的其他设备！

<br/>

<!--more-->

# **Zerotier配置内网流量转发**

首先，在这台机器上配置 IP 转发：

```shell
sudo sysctl -w net.ipv4.ip_forward=1

sudo sysctl -p
```

查看网卡配置：

```bash
ip a

ens33: 192.168.117.0/24

ztnfanm5kw: 192.168.196.220
```

在zerotier网站设置转发规则：

![alipay](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/zerotier.jpg)

在这台流量转发机器上设置环境变量：

```bash
export PHY_IFACE=ens33 # 物理网卡

export ZT_IFACE=ztnfanm5kw # Zerotier虚拟网卡
```

添加规则到iptables：

```bash
sudo iptables -t nat -A POSTROUTING -o $PHY_IFACE -j MASQUERADE

sudo iptables -A FORWARD -i $PHY_IFACE -o $ZT_IFACE -m state --state RELATED,ESTABLISHED -j ACCEPT

sudo iptables -A FORWARD -i $ZT_IFACE -o $PHY_IFACE -j ACCEPT
```

>   这三条 `iptables` 规则用于配置网络地址转换（NAT）和数据包转发；
>
>   含义如下：
>
>   1.  **规则 1：** `sudo iptables -t nat -A POSTROUTING -o $PHY_IFACE -j MASQUERADE`
>
>       这条规则在 `nat` 表的 `POSTROUTING` 链中添加了一条规则。`-o $PHY_IFACE` 表示这条规则适用于所有通过 `$PHY_IFACE` 这个网络接口（通常是物理接口）出去的数据包。`-j MASQUERADE` 指定了 NAT 操作中的伪装（masquerading）。这意味着，当数据包从 `$PHY_IFACE` 发送出去时，其源 IP 地址会被替换为 `$PHY_IFACE` 的 IP 地址。这通常用于允许内部网络通过一个公共 IP 地址进行外部通信；
>
>   2.  **规则 2：** `sudo iptables -A FORWARD -i $PHY_IFACE -o $ZT_IFACE -m state --state RELATED,ESTABLISHED -j ACCEPT`
>
>       这条规则在 `filter` 表的 `FORWARD` 链中添加了一条规则。`-i $PHY_IFACE` 表示适用于从 `$PHY_IFACE` 这个接口进入的数据包，`-o $ZT_IFACE` 表示这些数据包要转发到 `$ZT_IFACE` 这个接口。`-m state --state RELATED,ESTABLISHED` 指定了只有那些与已有连接相关或已经建立的连接的数据包才被接受（`ACCEPT`）。这个规则通常用于允许来自外部网络的返回流量进入内部网络，从而支持诸如 HTTP 会话等；
>
>   3.  **规则 3：** `sudo iptables -A FORWARD -i $ZT_IFACE -o $PHY_IFACE -j ACCEPT`
>
>       这条规则在 `filter` 表的 `FORWARD` 链中添加了一条规则。`-i $ZT_IFACE` 表示适用于从 `$ZT_IFACE` 这个接口进入的数据包，`-o $PHY_IFACE` 表示这些数据包要转发到 `$PHY_IFACE` 这个接口。`-j ACCEPT` 表示这些数据包会被接受并转发。这条规则允许来自 `$ZT_IFACE` 的流量经过路由器转发到 `$PHY_IFACE`，从而实现网络之间的数据传输；
>
>   总结：
>
>   -   第一条规则用于设置源地址伪装，允许内部网络设备通过一个公共 IP 地址进行外部通信；
>   -   第二条规则允许返回流量和已经建立的连接的数据包从外部网络进入内部网络；
>   -   第三条规则允许来自内部网络的数据包被转发到外部网络；

保存配置到文件：

```bash
iptables-save
```

**此时就可以用另一台加入了此Zerotier网络的机器访问内网机器的其他电脑了！**

<br/>

# **附录**

文章参考：

-   https://blog.51cto.com/u_6364219/5264985

<br/>
