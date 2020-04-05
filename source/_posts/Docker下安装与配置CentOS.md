---
title: Docker下安装与配置CentOS
cover: http://api.mtyqx.cn/api/random.php?3
toc: false
date: 2020-04-05 09:07:04
categories: Docker
tags: [Docker]
description: 最近开始学习分布式大数据相关的一些内容. 一般情况下都是使用VMWare这种虚拟机. 但是实际上Docker已经这么轻量级, 完全没有必要使用VMWare这种带有图形界面的软件了. 所以就简单折腾了一下, 配置安装了CentOS.
---

最近开始学习分布式大数据相关的一些内容. 一般情况下都是使用VMWare这种虚拟机.但是实际上Docker已经这么轻量级, 完全没有必要使用VMWare这种带有图形界面的软件了.

所以就简单折腾了一下, 配置安装了CentOS.

<br/>

<!--more-->

**目录:**

<!-- toc -->

<br/>

## Docker下安装与配置CentOS

我打算采用的是CentOS 6.9(虽然现在CentOS8都已经发行了. 但是视频教程还是用的6.x, 所以勉为其难用了6.x);

### 下载镜像

```bash
docker pull centos:6.9
```

****

### 创建网络

这一步其实比较容易忽略, 但是单独创建一个网络更加方便管理.

同时也避免了容器之间可能无法正常通信等各种问题.

```bash
docker network create --subnet=172.18.1.0/16 hadoop_network
```

我创建的是`172.18.1.x`网段, 并命名为hadoop_network

你可以按照自己的喜好来设置;

但是不要选用`172.17.0.x`网段. 因为这个是docker的默认网段;

****

### 创建容器并启动

使用docker run命令创建并启动一个容器

```bash
docker run -it \
    --name hadoop1 \
    --net hadoop_network \
    --ip 172.18.0.1 \
    centos:6.9 /bin/bash
```

上面的命令的一些解释:

-   `--name`: 指定创建的容器名称(**方便下一次直接通过容器名称启动**)
-   `--net`: 指定容器的网络, 如果不指定类型则默认为bridge模式(NAT方式)
-   `--ip`: 指定容器的固定ip(**如果不指定, 则Docker会按照容器的启动顺序分配, 有可能造成每次的ip都不同**)

><br/>
>
>更多关于Docker网络: 
>
>[docker 之网络配置](https://blog.51cto.com/13362895/2130375)

****

### 设置yum镜像源

配置阿里云的镜像源, 在容器中执行下面的命令:

```bash
curl http://mirrors.aliyun.com/repo/Centos-6.repo > /etc/yum.repos.d/CentOS-Base-6-aliyun.repo
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.bak
yum makecache
```

>   <br/>
>
>   **注意:**
>
>   其中的`Centos-6.repo`是对应CentOS6版本的, 其他的也可以在阿里云上查找:
>
>   [阿里云官方镜像站](https://developer.aliyun.com/mirror/)

****

### 安装ssh

```bash
yum install -y openssh-clients openssh-server
```

>   <br/>
>
>   **注意：**
>
>   **刚开始进入到docker中的centos6时，是没有service这个命令的，而当安装 openssh 时，里面会依赖到 initscripts 软件包，这个将自动进行安装，安装后就有 service 命令可以使用了**

**启动ssh**

```bash
# chkconfig sshd on
# service sshd start
Generating SSH2 RSA host key:                              [  OK  ]
Generating SSH1 RSA host key:                              [  OK  ]
Generating SSH2 DSA host key:                              [  OK  ]
Starting sshd:                                             [  OK  ]
```

><br/>
>
>**注意:**
>
>**在docker的centos6中，启动ssh时，会自动创建ssh的rsa、dsa密钥;**
>
>**如果是在docker中的centos7刚开始启动ssh时，则需要创建相应的密钥，否则会报相关的密钥不存在**
>
>```bash
># docker 中首次启动 centos 7 的 ssh
>ssh-keygen -t rsa -f /etc/ssh/ssh_host_rsa_key
>ssh-keygen -t ecdsa -f /etc/ssh/ssh_host_ecdsa_key
>ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key
>```

**修改ssh配置**

启动好ssh后，还要修改一下配置，否则会连接后自动关闭，连接本机或另的机器ssh连接过来都会出现:

```bash
# ssh localhost
root@localhost's password: 
Connection to localhost closed.
```

修改ssh的配置文件:

```bash
vi /etc/ssh/sshd_config
```

**将第97行的UsePAM yes，改为 UsePAM no**

保存退出，重启ssh

```bash
[root@14c0ec213102 /]# service sshd restart
Stopping sshd:                                             [  OK  ]
Starting sshd:                                             [  OK  ]
```

现在就能正常使用ssh连接访问了

```bash
[root@14c0ec213102 /]# ssh localhost
root@localhost's password: 
Last login: Sun Jun  4 15:50:46 2017 from 172.17.42.1
```

><br/>
>
>**说明:**
>
>**将UsePAM设置为no，主要是禁止PAM验证:**
>
>**usePam为非对称密钥认证 UsePam，如果是yes的话非对称密钥验证失败，仍然可用口令登录**

****

### 关闭防火墙

在某些CentOS镜像中开启了防火墙, 在学习是我们是不需要的

**临时关闭防火墙**

```bash
service iptables stop
```

**开机禁用**

```bash
chkconfig iptabls off
```

>   <br/>
>
>   查看开机启动的服务`chkconfig`
>
>   ```bash
>   [root@490de829cb74 ~]# chkconfig
>   iptables       	0:off	1:off	2:on	3:on	4:on	5:on	6:off
>   netconsole     	0:off	1:off	2:off	3:off	4:off	5:off	6:off
>   netfs          	0:off	1:off	2:off	3:on	4:on	5:on	6:off
>   network        	0:off	1:off	2:on	3:on	4:on	5:on	6:off
>   rdisc          	0:off	1:off	2:off	3:off	4:off	5:off	6:off
>   restorecond    	0:off	1:off	2:off	3:off	4:off	5:off	6:off
>   sshd           	0:off	1:off	2:on	3:on	4:on	5:on	6:off
>   udev-post      	0:off	1:on	2:on	3:on	4:on	5:on	6:off
>   ```
>
>   **0-6是Linux的模式:**
>
>   **一般3是命令行模式, 5是图形模式**

**修改selinux配置**

在Docker镜像中并不一定存在此文件

```bash
vi /etc/selinux/config
# 将SELINUX=enforcing修改为disabled
```

****

### 修改hosts

修改`/etc/hosts`, 加入集群的信息, 如加入:

```bash
172.18.1.1 node1
172.18.1.2 node2
172.18.1.3 node3
172.18.1.4 node4
```

<br/>