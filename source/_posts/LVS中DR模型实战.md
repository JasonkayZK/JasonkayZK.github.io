---
title: LVS中DR模型实战
cover: http://api.mtyqx.cn/api/random.php?88
date: 2020-04-10 12:44:00
categories: 分布式
tags: [分布式, 负载均衡, LVS]
description: 在前两篇文章中分别介绍了LVS中常用的三种模型, 然后介绍了LVS中的功能配置. 本文在此基础之上, 基于Docker进行LVS中DR模型的实战;
---

在前两篇文章中分别介绍了LVS中常用的三种模型, 然后介绍了LVS中的功能配置.

本文在此基础之上, 基于Docker进行LVS中DR模型的实战;

<br/>

<!--more-->

**目录:**

<!-- toc -->

<br/>

## LVS中DR模型实战

### 前言

在本次实战中, 采用CentOS:7镜像创建三个Docker容器实现:

其中一个Docker容器作为LVS负载均衡服务器, 另外两个容器作为RS.

><br/>
>
>**注意: 一定要选择好CentOS的镜像**
>
><font color="#f00">**在DockerHub中有些CentOS镜像内核中不包括ip_vs, 这将导致ipvsadm命令无法使用**</font>

<font color="#f00">**此外, 为了在Docker中使用ipvsadm命令, 在宿主系统中也需要安装ipvsadm, 并开启服务!(本机使用的是Ubuntu18.04.LTS)**</font>

所以需要提前在本机中安装ipvsadm, 并启动服务:

```bash
# 先查看是否使用了ip_vs内核模块
$ lsmod | grep ip_vs
# 空

# 下载ipvsadm
$ sudo apt install ipvsadm

# 启动ipvsadm
$ sudo ipvsadm
IP Virtual Server version 1.2.1 (size=4096)
Prot LocalAddress:Port Scheduler Flags
  -> RemoteAddress:Port           Forward Weight ActiveConn InActConn

# 查看内核模块, 的确存在ip_vs模块
$ lsmod | grep ip_vs
ip_vs                 151552  0
nf_conntrack          139264  6 xt_conntrack,nf_nat,xt_nat,nf_conntrack_netlink,xt_MASQUERADE,ip_vs
nf_defrag_ipv6         24576  2 nf_conntrack,ip_vs
libcrc32c              16384  3 nf_conntrack,nf_nat,ip_vs
```

本机配置完成

<br/>

### 创建子网络

使用下述命令创建一个叫做lvs_dr的子网络:

```bash
docker network create --subnet=172.20.1.0/16 lvs_dr
```

网络规划为(在下方配置):

-   VIP地址: 172.20.1.100
-   LVS的IP地址: 172.20.1.1
-   两台RS的IP地址: 172.20.1.10和172.20.1.11

<br/>

### 创建容器

然后在子网络中分别创建lvs, rs1, rs2三个子容器并启动:

```bash
docker run -d --privileged=true --name=lvs --net lvs_dr --ip 172.20.1.1 centos:7 /usr/sbin/init
docker run -d --privileged=true --name=rs1 --net lvs_dr --ip 172.20.1.10 centos:7 /usr/sbin/init
docker run -d --privileged=true --name=rs2 --net lvs_dr --ip 172.20.1.11 centos:7 /usr/sbin/init
```

><br/>
>
>**注: `--privileged=true`参数非常关键, 在下面的操作中会使用真正的root权限来修改内核配置**
>
>并且在和容器进行交互时也推荐加入`--privileged=true`参数, 例如:
>
>```bash
>docker exec -it --privileged lvs /bin/bash
>```
>
><br/>
>
>**注2: /usr/sbin/init用于初始化内核进程**

如下:

```bash
# lvs
[root@39673a2ec2bf /]# ifconfig 
eth0      Link encap:Ethernet  HWaddr 02:42:AC:14:01:01  
          inet addr:172.20.1.1  Bcast:172.20.255.255  Mask:255.255.0.0
......

# rs1
[root@a4e096143dec /]# ifconfig 
eth0      Link encap:Ethernet  HWaddr 02:42:AC:14:01:0A  
          inet addr:172.20.1.10  Bcast:172.20.255.255  Mask:255.255.0.0
......

# rs2
[root@df7a0b42700e /]# ifconfig 
eth0      Link encap:Ethernet  HWaddr 02:42:AC:14:01:0B  
          inet addr:172.20.1.11  Bcast:172.20.255.255  Mask:255.255.0.0
......
```

><br/>
>
>**注: 由前分析可知, DR模型中LVS和RS必须在同一个网段**

<br/>

### 配置lvs的VIP

即配置客户端请求时的IP地址;

可以使用ifconfig命令配置:

```bash
[root@39673a2ec2bf /]# ifconfig eth0:1 172.20.1.100/16
[root@39673a2ec2bf /]# ifconfig 
eth0      Link encap:Ethernet  HWaddr 02:42:AC:14:01:01  
          inet addr:172.20.1.1  Bcast:172.20.255.255  Mask:255.255.0.0
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:69219 errors:0 dropped:0 overruns:0 frame:0
          TX packets:36178 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:86198035 (82.2 MiB)  TX bytes:2403434 (2.2 MiB)

eth0:1    Link encap:Ethernet  HWaddr 02:42:AC:14:01:01  
          inet addr:172.20.1.100  Bcast:172.20.255.255  Mask:255.255.0.0
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1

lo        Link encap:Local Loopback  
          inet addr:127.0.0.1  Mask:255.0.0.0
          UP LOOPBACK RUNNING  MTU:65536  Metric:1
          RX packets:82 errors:0 dropped:0 overruns:0 frame:0
          TX packets:82 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000 
          RX bytes:7747 (7.5 KiB)  TX bytes:7747 (7.5 KiB)
```

上面的配置(**临时配置**)在eth0的子接口`eth0:1`配置了`172.20.1.100\16`

><br/>
>
>**`172.20.1.100\16`等价于`172.20.1.100 netmask 255.255.0.0`**

>   <br/>
>
>   需要注意的是, **docker限制容器进程配置自己的网络**
>
>   在Docker0.6版本之后，privileged被引入docker
>
>   使用该参数，container内的root才拥有真正的root权. 否则，container内的root只是外部的一个普通用户权限
>
>   使用privileged启动的容器，可以看到很多host上的设备，并且可以执行mount, 甚至允许你在docker容器中启动docker容器
>
>   所以在使用**更改上述配置时, 使用`--privileged=true`获取真正的root权限:**
>
>   ```bash
>   docker exec -it --privileged=true lvs /bin/bash
>   ```
>
>   否则在使用ifconfig修改ip时可能会报错:
>
>   ```
>   SIOCSIFADDR: Operation not permitted
>   SIOCSIFNETMASK: Operation not permitted
>   SIOCSIFBROADCAST: Operation not permitted
>   SIOCSIFFLAGS: Operation not permitted
>   SIOCSIFFLAGS: Operation not permitted
>   ```

<br/>

### 配置LVS地址转发

使用下面的命令配置(**临时配置**)LVS的地址转发功能(启用IP路由转发功能):

```bash
[root@39673a2ec2bf /]# echo 1 > /proc/sys/net/ipv4/ip_forward
[root@39673a2ec2bf ~]# sysctl -a | grep ip_forward
net.ipv4.ip_forward = 1
net.ipv4.ip_forward_update_priority = 1
net.ipv4.ip_forward_use_pmtu = 0
```

><br/>
>
>**操作系统默认, 收到一个包, 这个包的目标地址不是本机则丢弃**
>
><br/>
>
><font color="#f00">**注: 内核文件只能用echo来直接覆盖文件, 而不能使用类似vi来修改;**</font>
>
><font color="#f00">**因为vi修改会创建一个临时文件, 这是不变允许的!**</font>

<br/>

### 配置RS的响应和通告级别

<font color="#f00">**需要注意的是: 必须先配置RS的响应和通告级别然后再去配置VIP**</font>

<font color="#f00">**否则, 先配置的VIP会直接被广播. 就失去了对外隐藏, 对内可见的性质!**</font>

下面以rs1为例配置`arp_ignore`和`arp_announce`文件:

```bash
[root@b2f5ab1b8b7d conf]# cd /proc/sys/net/ipv4/conf/
[root@b2f5ab1b8b7d conf]# ll
total 0
dr-xr-xr-x 1 root root 0 Apr 10 08:03 all
dr-xr-xr-x 1 root root 0 Apr 10 08:03 default
dr-xr-xr-x 1 root root 0 Apr 10 08:03 eth0
dr-xr-xr-x 1 root root 0 Apr 10 08:03 lo
[root@b2f5ab1b8b7d conf]# cd eth0/
[root@b2f5ab1b8b7d eth0]# echo 1 > arp_ignore 
[root@b2f5ab1b8b7d eth0]# echo 2 > arp_announce 
[root@b2f5ab1b8b7d eth0]# cat arp_ignore 
1
[root@b2f5ab1b8b7d eth0]# cat arp_announce 
2
```

上面修改了ech0目录下的配置信息

><br/>
>
><font color="#f00">**注: 在启动容器和交互时必须增加`--privileged=true`参数, 否则文件将为只读, 无法修改**</font>

如果后续还要添加新的机器, 可以通过修改all目录下的配置信息

```bash
[root@b2f5ab1b8b7d eth0]# cd ../all/
[root@b2f5ab1b8b7d all]# echo 1 > arp_ignore 
[root@b2f5ab1b8b7d all]# echo 2 > arp_announce 
```

<br/>

### 配置RS的VIP

这里继续以rs1为例对VIP(172.20.1.100)进行配置;

使用ifconfig配置如下:

```bash
[root@b2f5ab1b8b7d all]# ifconfig lo:1 172.20.1.100 netmask 255.255.255.255
[root@b2f5ab1b8b7d all]# ifconfig 
eth0      Link encap:Ethernet  HWaddr 02:42:AC:14:01:0A  
          inet addr:172.20.1.10  Bcast:172.20.255.255  Mask:255.255.0.0
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:32 errors:0 dropped:0 overruns:0 frame:0
          TX packets:0 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:4578 (4.4 KiB)  TX bytes:0 (0.0 b)

lo        Link encap:Local Loopback  
          inet addr:127.0.0.1  Mask:255.0.0.0
          UP LOOPBACK RUNNING  MTU:65536  Metric:1
          RX packets:0 errors:0 dropped:0 overruns:0 frame:0
          TX packets:0 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000 
          RX bytes:0 (0.0 b)  TX bytes:0 (0.0 b)

lo:1      Link encap:Local Loopback  
          inet addr:172.20.1.100  Mask:255.255.255.255
          UP LOOPBACK RUNNING  MTU:65536  Metric:1
```

<font color="#f00">**注: 将掩码地址配置为四个255**</font>

**原因是如果将掩码配置为255.255.255.0, 则可以通过eth0和lo:1两个接口做请求**

如:

```bash
[root@b2f5ab1b8b7d all]# route -n
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         172.20.0.1      0.0.0.0         UG    0      0        0 eth0
172.20.0.0      0.0.0.0         255.255.0.0     U     0      0        0 eth0
```

**而lo离内核更近, 所以所有包会经由lo走;**

><br/>
>
>**此时RS的包会自己发送给自己(环回接口)**

<br/>

### 在两个RS上启动HTTPD服务

两台RS都经过了上述配置之后, 安装httpd服务;

```bash
yum install httpd -y
```

然后在`/var/www/html`目录下创建一个主页分别表示当前RS的主页

><br/>
>
>**为了显示负载均衡的效果, 两个RS的内容不同. 而在实际生成环境, 应当部署相同的Server镜像**

对于rs1:

```bash
[root@b2f5ab1b8b7d all]# cd /var/www/html/
[root@b2f5ab1b8b7d html]# vi index.html
[root@b2f5ab1b8b7d html]# cat index.html 
from rs1 server...
```

对于rs2:

```bash
[root@953d5b5e1201 /]# vi /var/www/html/index.html
[root@953d5b5e1201 /]# cat /var/www/html/index.html 
from rs2 server...
```

然后启动两个服务:

```bash
# CentOS 7中, 启动服务
[root@88528e94e720 /]# systemctl start httpd

# 在CentOS 6.x中使用下面
[root@b2f5ab1b8b7d html]# service httpd start
Starting httpd: httpd: Could not reliably determine the server's fully qualified domain name, using 172.20.1.10 for ServerName   [  OK  ]
```

><br/>
>
><font color="#f00">**注意: 这一步要求在启动容器时使用了`/usr/sbin/init`初始化内核**</font>

此时可以访问`172.20.1.10`和`172.20.1.11`, 会分别显示:

```bash
# http://172.20.1.10/
from rs1 server... 

# http://172.20.1.11/
from rs2 server... 
```

但此时访问`# http://172.20.1.100/`会访问失败, 因为LVS还尚未配置;

<br/>

### 配置LVS

首先安装ipvsadm:

```bash
[root@06f8e77f3a22 /]# yum install -y ipvsadm
```

然后配置监控包和负载包(分别使用-A和-a):

```bash
# 配置监控包
[root@4229bb8082ee /]# ipvsadm -A -t 172.20.1.100:80 -s rr

# 使用命令查看
[root@4229bb8082ee /]# ipvsadm -ln
IP Virtual Server version 1.2.1 (size=4096)
Prot LocalAddress:Port Scheduler Flags
  -> RemoteAddress:Port           Forward Weight ActiveConn InActConn
TCP  172.20.1.100:80 rr

# 配置负载包
[root@4229bb8082ee /]# ipvsadm -a -t 172.20.1.100:80 -r 172.20.1.10 -g
[root@4229bb8082ee /]# ipvsadm -a -t 172.20.1.100:80 -r 172.20.1.11 -g

# 再次使用命令查看
[root@4229bb8082ee /]# ipvsadm -ln
IP Virtual Server version 1.2.1 (size=4096)
Prot LocalAddress:Port Scheduler Flags
  -> RemoteAddress:Port           Forward Weight ActiveConn InActConn
TCP  172.20.1.100:80 rr
  -> 172.20.1.10:80               Route   1      0          0         
  -> 172.20.1.11:80               Route   1      0          0   
```

配置完成后即时生效;

此时访问172.20.1.100, 则会在浏览器轮流显示:

```
from rs1 server... 

from rs2 server... 
```

><br/>
>
>**要使用`ctrl + F5`强制刷新, 否则看到的是缓存的内容!**

说明配置成功!

<br/>

### 分析

#### 查看LVS中TCP连接状况

多次访问172.20.1.100之后, 在了lvs容器中使用netstat命令:

```bash
# 查看tcp连接
[root@4229bb8082ee /]# netstat -natp
Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 127.0.0.11:32793        0.0.0.0:*               LISTEN      -    
```

结果发现并没有对应tcp连接

**这也说明了LVS工作在四层, 只做请求的转发, 而不建立三次握手连接**

****

#### 查看RS中的TCP连接状况

而查看RS中的TCP连接状况:

```bash
[root@88528e94e720 /]# netstat -natp
Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      1258/httpd          
tcp        0      0 127.0.0.11:35389        0.0.0.0:*               LISTEN      -   
```

发现RS中存在TCP连接, 说明符合DR模型;

****

#### 查看LVS记录

通过`ipvsadm -lnc`可以查看LVS中的记录

```bash
ipvsadm -lnc
[root@4229bb8082ee /]# ipvsadm -lnc
IPVS connection entries
pro expire state       source             virtual            destination
TCP 01:35  FIN_WAIT    172.20.0.1:47562   172.20.1.100:80    172.20.1.11:80
TCP 01:35  FIN_WAIT    172.20.0.1:47556   172.20.1.100:80    172.20.1.10:80
TCP 01:35  FIN_WAIT    172.20.0.1:47566   172.20.1.100:80    172.20.1.11:80
TCP 01:35  FIN_WAIT    172.20.0.1:47560   172.20.1.100:80    172.20.1.10:80
TCP 01:35  FIN_WAIT    172.20.0.1:47552   172.20.1.100:80    172.20.1.10:80
TCP 01:35  FIN_WAIT    172.20.0.1:47564   172.20.1.100:80    172.20.1.10:80
TCP 01:35  FIN_WAIT    172.20.0.1:47558   172.20.1.100:80    172.20.1.11:80
TCP 01:35  FIN_WAIT    172.20.0.1:47554   172.20.1.100:80    172.20.1.11:80
TCP 01:35  FIN_WAIT    172.20.0.1:47568   172.20.1.100:80    172.20.1.10:80
TCP 01:40  FIN_WAIT    172.20.0.1:47570   172.20.1.100:80    172.20.1.11:80
```

而LVS就是通过这个记录实现动态负载均衡的

<br/>

## 附录

文章参考:

-   [docker网络配置](http://blog.sina.com.cn/s/blog_a130ce010102xa17.html)



如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>