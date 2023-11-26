---
title: VMWare下创建CentOS7节点集群
toc: true
cover: 'https://img.paulzzh.com/touhou/random?12'
date: 2021-03-13 14:39:40
categories: [Linux]
tags: [Linux, CentOS, VMWare]
description: 最近在看大数据的视频，一般都需要建立几个集群，网上的教程一般都是基于CentOS6，但是CentOS6目前已经要停止维护了，所以我这里使用CentOS7建立了一个集群。过程还是蛮简单的。
---

最近在看大数据的视频，一般都需要建立几个集群，网上的教程一般都是基于CentOS6；

但是CentOS6目前已经要停止维护了，所以我这里使用CentOS7建立了一个集群，过程还是蛮简单的。

<br/>

<!--more-->

## **VMWare下创建CentOS7节点集群**

### **安装镜像**

首先在镜像站下载CentOS-7-x86_64-Minima.iso，即最小的镜像文件；

然后在VMWare安装这个镜像，作为模板进行配置；

>   具体镜像安装挺简单的，这里不再赘述了；
>
>   只贴一个配置：
>
>   -   1个处理器2核
>   -   2G内存
>   -   20G硬盘SCSI
>   -   网络：NAT
>
>   分区：
>
>   -   /boot：256M
>   -   swap：2G
>   -   /：剩余

<br/>

### **配置网络**

安装完成后，有极大的可能是无法联网的（所以也不能使用yum安装）；

首先修改配置`vi /etc/sysconfig/network`：

```bash
$ vi /etc/sysconfig/network
# 添加下面的配置
NETWORKING=yes
HOSTNAME=node0
```

还要修改`vi /etc/sysconfig/network-scripts/ifcfg-ens33`：

```bash
$ vi /etc/sysconfig/network-scripts/ifcfg-ens33
# 配置如下
TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
BOOTPROTO=static
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
IPADDR=192.168.24.60
NETMASK=255.255.255.0
GATEWAY=192.168.24.2
NAME=ens33
DEVICE=ens33
ONBOOT=yes
DNS1=192.168.24.2
DNS2=114.114.114.114
```

>   上面的配置主要是为了将网络修改为静态IP；
>
>   在CentOS6中是`/etc/sysconfig/network-scripts/ifcfg-eth0`；
>
>   配置中的几个重点：
>
>   -   **BOOTPROTO：修改为static，即静态IP；**
>   -   **IPADDR：静态的IP地址；**
>   -   **NETMASK：子网掩码，选择255.255.255.0即可；**
>   -   **GATEWAY：网关，结尾为`.2`，NAT分配的子网地址可在`编辑→虚拟网络编辑器`中查看；**
>   -   **DNS1、DNS2：DNS1可选择本机网关地址、DNS2可配置114.114.114.114等公共DNS；**
>   -   **UUID：删除；**
>   -   **ONBOOT：yes，开机启用网络（开启才能开机就联网）；**

最后配置hosts：

```diff
$ vi /etc/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6

+ 192.168.24.60 node0
+ 192.168.24.61 node1
+ 192.168.24.62 node2
+ 192.168.24.63 node3
+ 192.168.24.64 node4
```

>   上述配置根据你实际情况修改；

配置完成后reboot；

reboot后登录，ping百度等网站，成功则说明配置成功；

<br/>

### **下载和配置软件**

配置yum源：

```bash
# 配置阿里云源
# 备份
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
# 配置
curl -o /etc/yum.repos.d/CentOS-Base.repo https://mirrors.aliyun.com/repo/Centos-7.repo
# 生成缓存
yum makecache

# 安装epel库
yum -y install epel-release
yum -y update
```

随后，可通过yum安装vim、htop、ntp、net-tools等软件；

配置ntp：

```bash
# 开启服务
$ service ntpd start

# 开机启动
$ systemctl enable ntpd
```

关闭防火墙iptables：

```bash
$ service iptables stop

$ systemctl disable iptables
```

禁用selinux：

```bash
# 查看selinux
$ getenforce
Enforcing

# 关闭
$ vim /etc/selinux/config
# 修改
SELINUX=disabled
```

禁用防火墙firewalld：

```bash
systemctl stop firewalld
systemctl disable firewalld
```

关闭sshd服务的DNS加快SSH登录：

```bash
$ vim /etc/ssh/sshd_config
# 修改
UseDNS no
```

允许Root身份登录、允许空密码登录、是否允许使用密码认证：

```bash
PermitRootLogin yes #允许root登录
PermitEmptyPasswords no #不允许空密码登录
PasswordAuthentication yes # 设置是否使用口令验证
```

>   在制作镜像快照前，如果系统是CentOS6，则还需要删除`/etc/udev/rules.d/70-persistent-net.rules`文件；
>
>   **注：删除之后不可重启！否则下次重启还会自动创建该文件，还需要删除！**

<br/>

### **创建快照并克隆**

选择`虚拟机→快照→拍摄快照`，使用当前虚拟机的当前状态拍摄快照；

拍摄完成后，选择当前拍摄快照，点击`克隆`，选择`现有快照`，克隆类型有两种：链接克隆和完整克隆，选择一个即可；随后修改名称，完成即可；

>   **链接克隆和完整克隆：**
>
>   -   **链接克隆：母镜像损坏，克隆机都会损坏，但存储占有率低；**
>   -   **完整克隆：母镜像和克隆机互不影响，但存储占有率高；**

<br/>

### **修改克隆机**

通过镜像克隆四台虚拟机，取名为node1~node4；

修改各台虚拟机的配置：

node1：

```diff
$ vi /etc/sysconfig/network
NETWORKING=yes
- HOSTNAME=node0
+ HOSTNAME=node1

$ vi /etc/sysconfig/network-scripts/ifcfg-ens33
TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
BOOTPROTO=static
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
- IPADDR=192.168.24.60
+ IPADDR=192.168.24.61
NETMASK=255.255.255.0
GATEWAY=192.168.24.2
NAME=ens33
DEVICE=ens33
ONBOOT=yes
DNS1=192.168.24.2
DNS2=114.114.114.114
```

其他虚拟机类似；

最后做测试，如在node1去ping其他node：

```bash
[root@node1 ~]# ping node2
PING node2 (192.168.24.62) 56(84) bytes of data.
64 bytes from node2 (192.168.24.62): icmp_seq=1 ttl=64 time=0.313 ms
64 bytes from node2 (192.168.24.62): icmp_seq=2 ttl=64 time=0.203 ms
64 bytes from node2 (192.168.24.62): icmp_seq=3 ttl=64 time=0.194 ms
^C
--- node2 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2001ms
rtt min/avg/max/mdev = 0.194/0.236/0.313/0.056 ms
[root@node1 ~]# ping node3
PING node3 (192.168.24.63) 56(84) bytes of data.
64 bytes from node3 (192.168.24.63): icmp_seq=1 ttl=64 time=0.291 ms
64 bytes from node3 (192.168.24.63): icmp_seq=2 ttl=64 time=0.271 ms
64 bytes from node3 (192.168.24.63): icmp_seq=3 ttl=64 time=0.224 ms
^C
--- node3 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2000ms
rtt min/avg/max/mdev = 0.224/0.262/0.291/0.028 ms
```

成功！

<br/>