---
title: 在CentOS7中使用Shadowsocks客户端
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?99'
date: 2021-05-27 10:35:16
categories: 软件安装与配置
tags: [Shadowsocks, 软件安装与配置, CentOS]
description: 本文讲述了如何在CentOS7中配置并使用Shadowsocks客户端；
---

本文讲述了如何在CentOS7中配置并使用Shadowsocks客户端；

<br/>

<!--more-->

## **在CentOS7中使用Shadowsocks客户端**

**最近需要在CentOS中加入SSR代理，网上的教程大部分都是通过脚本一键安装，具有服务器暴露的风险；**

最后找到了通过原生的Shadowsocks配合Privoxy配置客户端的方法；

<br/>

### **安装Shadowsocks**

使用pip3安装：

```bash
pip3 install shadowsocks # pip安装ss客户端
# 如果提示 -bash: pip: command not found
# 运行 yum -y install python-pip
```

安装完成会会有`sslocal`和`ssserver`两个可执行文件；

我们使用`sslocal`连接SSR服务器；

<br/>

### **创建配置文件**

创建配置文件：

```bash
mkdir /etc/shadowsocks

vi /etc/shadowsocks/shadowsocks.json

{
    "server":"SERVER-IP",   
    "server_port":PORT, 
    "local_address": "127.0.0.1",
    "local_port":1080,
    "password":"PASSWORD",
    "timeout":300,
    "method":"aes-256-cfb",
    "fast_open": false,
    "workers": 1
}
```

<br/>

### **安装privoxy**

直接使用sslocal是不能转发HTTP和HTTPS的流量的，所以我们还需要安装privoxy；

```bash
yum -y install privoxy
```

配置 socks5 全局代理：

```bash
echo 'forward-socks5 / 127.0.0.1:1080 .' >> /etc/privoxy/config
```

设置 http/https 代理：

```bash
# privoxy默认监听端口为8118
export http_proxy=http://127.0.0.1:8118
export https_proxy=http://127.0.0.1:8118
```

运行 privoxy：

```bash
service privoxy start
```

<br/>

### **简化使用**

每次启动代理时都要输入许多命令太麻烦，可以利用命令别名来简化我们的操作：

编辑`~/.bashrc`文件：

```bash
vi ~/.bashrc

alias ssinit='nohup sslocal -c /etc/shadowsocks.json &>> /var/log/sslocal.log &'
alias sson='export http_proxy=http://127.0.0.1:8118 && export https_proxy=http://127.0.0.1:8118 && systemctl start privoxy'
alias ssoff='unset http_proxy && unset https_proxy && systemctl stop privoxy && pkill sslocal'
```

立即生效：

```bash
source ~/.bashrc
```

使用方法：

-   开启ss代理：`ssinit & sson`；
-   关闭ss代理：`ssoff`；

<br/>

### **使用测试**

启动SSR代理，并测试 socks5 全局代理：

```bash
curl www.google.com
```

如果出现下面这段输出则代理成功！

```bash
302 Moved

The document has moved
here.
```

<br/>

## **附录**

文章参考：

-   [CentOS 7命令行使用shadowsocks客户端(和服务的)代理的方法](https://woj.app/3857.html)

<br/>