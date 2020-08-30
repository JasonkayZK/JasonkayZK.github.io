---
title: 负载均衡之keepalived
cover: http://api.mtyqx.cn/api/random.php?97
date: 2020-04-12 14:08:31
categories: 分布式
toc: true
tags: [分布式, 负载均衡, keepalived]
description: 在前面介绍的LVS中容易发生单点故障的问题；当LVS或者RS挂掉时，后台的RS服务不再可靠。而通过部署keepalive可以达到检测单点故障，并达到自动切换LVS Server和剔除故障RS的效果。
---

在前面介绍的LVS中容易发生单点故障的问题；当LVS或者RS挂掉时，后台的RS服务不再可靠。而通过部署keepalive可以达到检测单点故障，并达到自动切换LVS Server和剔除故障RS的效果。

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## 负载均衡之keepalived

### 前言

本文在[LVS中DR模型实战](https://jasonkayzk.github.io/2020/04/10/LVS%E4%B8%ADDR%E6%A8%A1%E5%9E%8B%E5%AE%9E%E6%88%98/)基础之上, 在LVS节点中配置Keepalive, 从而解决LVS的单点故障问题;

在解决HA问题时主要主要使用的是一台变多台, 此时有两种思路:

-   多台计算机同时可以提供服务;
-   多台计算机只有一台可以提供服务, 其他计算机为冗余备机;

<font color="#f00">**而在LVS一台变多台时, 只能有一台对外提供服务(VIP只能配置在一台机器上对外提供服务)**</font>

在某台LVS挂掉后, VIP会切换到另外一台LVS继续提供服务;

而检测LVS的健康状况, 对LVS进行切换就是使用keepalived实现的;

><br/>
>
>**具体子容器的创建本篇不再赘述, 更多的是进行keepalived的说明**
>
>如中途遇到问题, 解决方法参考:
>
>[LVS中DR模型实战](https://jasonkayzk.github.io/2020/04/10/LVS%E4%B8%ADDR%E6%A8%A1%E5%9E%8B%E5%AE%9E%E6%88%98/)

<br/>

### keepalived介绍

Keepalived是Linux下面实现VRRP备份路由的高可靠性运行件。Keepalived是一个基于VRRP协议来实现的服务高可用方案，可以利用其来避免IP单点故障，类似的工具还有heartbeat、corosync、pacemaker。但是它一般不会单独出现，而是与其它负载均衡技术（如lvs、haproxy、nginx）一起工作来达到集群的高可用。

><br/>
>
>**简介: VRRP**
>
>VRRP全称 Virtual Router Redundancy Protocol，即 虚拟路由冗余协议。
>
>可以认为它是实现路由器高可用的容错协议，即将N台提供相同功能的路由器组成一个路由器组(Router Group)，这个组里面有一个master和多个backup，但在外界看来就像一台一样，构成虚拟路由器，拥有一个虚拟IP（vip，也就是路由器所在局域网内其他机器的默认路由），占有这个IP的master实际负责ARP相应和转发IP数据包，组中的其它路由器作为备份的角色处于待命状态。
>
>**master会发组播消息，当backup在超时时间内收不到vrrp包时就认为master宕掉了，这时就需要根据VRRP的优先级来选举一个backup当master，保证路由器的高可用。**

#### 对于LVS挂掉

master会定期的向backup集群发送广播包，通报自己的健康状态。而backup在多个时间周期都未收到master的广播包时，就认为master已经挂掉，此时会根据序列号的高低马上推选一个新的master**(在LVS的实践中会立刻在新的master中配置VIP)**

****

#### 对于RS挂掉

当RS挂掉之后，在`ipvsadm -ln`列表中，会将具体的负载均衡RS条目标记为不可用，从而不再向此RS中分配请求负载包；

一旦keepalived再次感知到RS上线后，会再次将RS加入，标记为可用；

>   <br/>
>
>   **注：RS的健康检测**
>
>   keepalived通过向RS发送一个GET请求头，检测响应码是否返回200；
>
>   <font color="#f00">**不是使用ping!**</font>
>
>   <font color="#f00">**因为实际使用ping命令时连四层的基本都没有到! 仅仅使用了三层协议, 更别提建立握手!**</font>
>
>   此外，如果keepalived验证的是200的响应码，则对于一些跳转返回如3xx响应码也会被认为RS挂掉！

<br/>

### 创建子网络

使用下述命令创建一个叫做lvs_dr的子网络(**上次已经创建**):

```bash
docker network create --subnet=172.20.1.0/16 lvs_dr
```

网络规划为(在下方配置):

-   VIP地址: 172.20.1.100
-   两个LVS的IP地址: 172.20.1.1和172.20.1.2
-   两台RS的IP地址: 172.20.1.10和172.20.1.11

><br/>
>
>**为了考察keepalived实现了故障转移, 使用到了两个LVS**

<br/>

### 创建容器

然后在子网络中分别创建lvs, rs1, rs2三个子容器并启动:

```bash
docker run -d --privileged=true --name=lvs1 --net lvs_dr --ip 172.20.1.1 centos:7 /usr/sbin/init
docker run -d --privileged=true --name=lvs2 --net lvs_dr --ip 172.20.1.2 centos:7 /usr/sbin/init
docker run -d --privileged=true --name=rs1 --net lvs_dr --ip 172.20.1.10 centos:7 /usr/sbin/init
docker run -d --privileged=true --name=rs2 --net lvs_dr --ip 172.20.1.11 centos:7 /usr/sbin/init
```

<br/>

### 配置RS

对于RS的配置和之前的配置完全相同, 具体步骤如下;

#### 配置RS的响应和通告级别

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

****

#### 配置RS的VIP

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

****

#### 在两个RS上启动HTTPD服务

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
from 172.20.1.10
```

对于rs2:

```bash
[root@953d5b5e1201 /]# vi /var/www/html/index.html
[root@953d5b5e1201 /]# cat /var/www/html/index.html 
from 172.20.1.11
```

然后启动两个服务:

```bash
# CentOS 7中, 启动服务
[root@88528e94e720 /]# systemctl start httpd

# 在CentOS 6.x中使用下面
[root@b2f5ab1b8b7d html]# service httpd start
Starting httpd: httpd: Could not reliably determine the server's fully qualified domain name, using 172.20.1.10 for ServerName   [  OK  ]
```

此时可以访问`172.20.1.10`和`172.20.1.11`, 会分别显示:

```bash
# http://172.20.1.10/
from 172.20.1.10

# http://172.20.1.11/
from 172.20.1.11 
```

但此时访问`# http://172.20.1.100/`会访问失败, 因为LVS还尚未配置;

<br/>

### 在LVS中使用keepalived

在LVS容器中可以不安装ipvsadm软件（推荐安装，可以使用`ipvsadm -lnc`查看ipvs日志记录）

#### 安装keepalived

使用yum安装keepalived即可：

```bash
yum install -y keepalived
```

启动：

```bash
# CentOS 7中
systemctl start keepalived

# CentOS 6中
service keepalived start
```

><br/>
>
>**启动前应先修改配置**

配置文件：`/etc/keepalived/keepalived.conf`

日志文件：`/var/log/message`

<br/>

#### 配置keepalived

在配置keepalived之前，先清除之前ipvs的配置：

```bash
ipvsadm -C
```

修改keepalived配置：

配置172.20.1.10为主机master：

```bash
[root@9517ef4219ec keepalived]# cd /etc/keepalived/

# 配置文件备份
[root@9517ef4219ec keepalived]# cp keepalived.conf keepalived.conf.bak

# 修改配置文件
[root@9517ef4219ec keepalived]# vi keepalived.conf

! Configuration File for keepalived

# 全局配置，无需修改
global_defs {
   notification_email {
     acassen@firewall.loc
     failover@firewall.loc
     sysadmin@firewall.loc
   }
   notification_email_from Alexandre.Cassen@firewall.loc
   smtp_server 192.168.200.1
   smtp_connect_timeout 30
   # 可设置lvs的id，在一个网络内唯一
   router_id LVS_DEVEL
   vrrp_skip_check_adv_addr
   vrrp_strict
   vrrp_garp_interval 0
   vrrp_gna_interval 0
}

vrrp_instance VI_1 {
    # 主机配置，从机为BACKUP
    state MASTER
    # 网卡名称
    interface eth0
    virtual_router_id 51
    # 权重值,值越大，优先级越高
    # backup设置比master小, 这样就能在master宕机后将backup变为master
    # 而master恢复后就再抢回master位置
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    # 同一网段VIP配置
    virtual_ipaddress {
        # 根据docker规划的可知：
        # ip: 172.20.1.100 mask: 255.255.0.0(16)
        # 设备为eth0，标签为eth0:1
        172.20.1.100/16 dev eth0 label eth0:1
    }
}

# virtual_server VIP port
virtual_server 172.20.1.100 80 {
    delay_loop 6
    # 负载均衡策略
    lb_algo rr
    # 负载均衡模型
    lb_kind DR
    # 子网掩码
    nat_mask 255.255.0.0
    # 保持连接的时间
    persistence_timeout 0
    protocol TCP

    # RS配置
    real_server 172.20.1.10 80 {
        # 负载均衡权重
        weight 1
        # 健康检测配置
        # 使用HTTP_GET探活, 如果使用了HTTPS则为SSL
        HTTP_GET {
            # 探活url和探活条件
            url {
              path /
              status_code 200
            }
            # 重试时间/次数
            connect_timeout 3
            nb_get_retry 3
            delay_before_retry 3
        }
    }
}

# RS2配置
virtual_server 172.20.1.100 80 {
    delay_loop 6
    lb_algo rr
    lb_kind DR
    nat_mask 255.255.0.0
    persistence_timeout 0
    protocol TCP

    real_server 172.20.1.11 80 {
        weight 1
        HTTP_GET {
            url {
              path /
              status_code 200
            }
            connect_timeout 3
            nb_get_retry 3
            delay_before_retry 3
        }
    }
}
```

将172.20.1.11配置为从节点,  与上面配置类似, 只需修改`vrrp_instance VI_1`中的配置:

-   `state BACKUP`表示为从节点;
-   `priority 50` 表示从节点的权重;

其他配置和主节点一致;

****

#### 开启keepalived

配置完毕之后开启两个LVS容器中的keepalived

```bash
systemctl start keepalived
```

然后打开浏览器输入VIP(172.20.1.100)；

使用`Ctrl+F5`刷新，则会依次显示`from 172.20.1.10`和`from 172.20.1.11`；

说明keepalived部署成功；

在master中查看ipvs负载均衡情况:

```bash
[root@9517ef4219ec keepalived]# ipvsadm -ln
IP Virtual Server version 1.2.1 (size=4096)
Prot LocalAddress:Port Scheduler Flags
  -> RemoteAddress:Port           Forward Weight ActiveConn InActConn
TCP  172.20.1.100:80 rr
  -> 172.20.1.10:80               Route   1      0          0         
  -> 172.20.1.11:80               Route   1      0          0        
```

可以看到两个RS服务器; 

<br/>

### keepalived测试

#### 模拟RS挂掉

停止一个rs容器中的httpd服务, 如rs1容器

```bash
systemctl stop httpd
```

此时经历一个keepalived探活的过程(探活期间rs1中的服务将无法访问)

使用`Ctrl+F5`刷新，则仅会显示`from 172.20.1.11`；

在master节点查看ipvs:

```bash
[root@9517ef4219ec keepalived]# ipvsadm -ln 
IP Virtual Server version 1.2.1 (size=4096)
Prot LocalAddress:Port Scheduler Flags
  -> RemoteAddress:Port           Forward Weight ActiveConn InActConn
TCP  172.20.1.100:80 rr
  -> 172.20.1.11:80               Route   1      0          0      
```

可以看到只剩下一个`172.20.1.11`一个RS;

****

重新开启RS1中的httpd服务:

```bash
systemctl start httpd
```

在等待一会, 使用`Ctrl+F5`刷新，则又会依次显示`from 172.20.1.10`和`from 172.20.1.11`；

在master节点查看ipvs:

```bash
[root@9517ef4219ec keepalived]# ipvsadm -ln
IP Virtual Server version 1.2.1 (size=4096)
Prot LocalAddress:Port Scheduler Flags
  -> RemoteAddress:Port           Forward Weight ActiveConn InActConn
TCP  172.20.1.100:80 rr
  -> 172.20.1.10:80               Route   1      0          0         
  -> 172.20.1.11:80               Route   1      0          0        
```

可以看到两个RS均在负载均衡列表中;

<br/>

#### 模拟IPVS挂掉

在一般情况下IPVS很难挂掉**(因为IPVS属于内核功能, 如果IPVS挂掉, 基本说明整个服务器挂掉了)**

我们可以通过直接禁用lvs容器中的eth0物理接口实现:

```bash
[root@9517ef4219ec /]# ifconfig eth0 down
[root@9517ef4219ec /]# ifconfig 
lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

此时访问172.20.1.100, 并使用`Ctrl+F5`刷新，仍会显示两个网页;

而在另一台主机上会自动创建eth0:1, 如下:

```bash
[root@bb1945fadef5 /]# ifconfig 
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.20.1.2  netmask 255.255.0.0  broadcast 172.20.255.255
        ether 02:42:ac:14:01:02  txqueuelen 0  (Ethernet)
        RX packets 584  bytes 57801 (56.4 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 384  bytes 30766 (30.0 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

eth0:1: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.20.1.100  netmask 255.255.0.0  broadcast 0.0.0.0
        ether 02:42:ac:14:01:02  txqueuelen 0  (Ethernet)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

再次使用`ifconfig up`启用lvs1中的eth0:

```bash
[root@9517ef4219ec /]# ifconfig eth0 up  
[root@9517ef4219ec /]# ifconfig 
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.20.1.1  netmask 255.255.0.0  broadcast 172.20.255.255
        ether 02:42:ac:14:01:01  txqueuelen 0  (Ethernet)
        RX packets 454  bytes 55619 (54.3 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 700  bytes 48787 (47.6 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

eth0:1: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.20.1.100  netmask 255.255.0.0  broadcast 0.0.0.0
        ether 02:42:ac:14:01:01  txqueuelen 0  (Ethernet)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

则172.20.1.1又成为master, 所以会自动配上`eth0:1`子接口;

而在lvs2(172.20.1.2)中又会自动删除`eth0:1`子接口:

```bash
[root@bb1945fadef5 /]# ifconfig 
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.20.1.2  netmask 255.255.0.0  broadcast 172.20.255.255
        ether 02:42:ac:14:01:02  txqueuelen 0  (Ethernet)
        RX packets 991  bytes 102255 (99.8 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 821  bytes 63459 (61.9 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

<br/>

#### 模拟keepalived异常退出

使用`kill -9`杀死在lvs1中的keepalive进程:

```bash
# 查看并杀死keepalived进程
[root@9517ef4219ec /]# ps -fe | grep keep
root      1153     1  0 09:13 ?        00:00:00 /usr/sbin/keepalived -D
root      1154  1153  0 09:13 ?        00:00:00 /usr/sbin/keepalived -D
root      1155  1153  0 09:13 ?        00:00:00 /usr/sbin/keepalived -D
root      1189  1131  0 09:24 pts/0    00:00:00 grep --color=auto keep
[root@9517ef4219ec /]# kill -9 1153
[root@9517ef4219ec /]# ps -fe | grep keep
root      1192  1131  0 09:25 pts/0    00:00:00 grep --color=auto keep

# 查看lvs1中已不存在eth0:1子接口
[root@9517ef4219ec /]# ifconfig 
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.20.1.1  netmask 255.255.0.0  broadcast 172.20.255.255
        ether 02:42:ac:14:01:01  txqueuelen 0  (Ethernet)
        RX packets 944  bytes 118425 (115.6 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 1570  bytes 110567 (107.9 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

而lvs2已被提升为MASTER:

```bash
[root@bb1945fadef5 /]# ifconfig 
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.20.1.2  netmask 255.255.0.0  broadcast 172.20.255.255
        ether 02:42:ac:14:01:02  txqueuelen 0  (Ethernet)
        RX packets 1563  bytes 161846 (158.0 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 1295  bytes 100717 (98.3 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

eth0:1: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500              inet 172.20.1.100  netmask 255.255.0.0  broadcast 0.0.0.0
        ether 02:42:ac:14:01:02  txqueuelen 0  (Ethernet)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

此时再次启用lvs1中的keepalived服务:

```bash
[root@9517ef4219ec /]# systemctl start keepalived
[root@9517ef4219ec /]# ifconfig 
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.20.1.1  netmask 255.255.0.0  broadcast 172.20.255.255
        ether 02:42:ac:14:01:01  txqueuelen 0  (Ethernet)
        RX packets 1119  bytes 128261 (125.2 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 1587  bytes 111562 (108.9 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

eth0:1: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.20.1.100  netmask 255.255.0.0  broadcast 0.0.0.0
        ether 02:42:ac:14:01:01  txqueuelen 0  (Ethernet)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

则lvs1再次变为MASTER, 而lvs2降为BACKUP:

```bash
[root@bb1945fadef5 /]# ifconfig 
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.20.1.2  netmask 255.255.0.0  broadcast 172.20.255.255
        ether 02:42:ac:14:01:02  txqueuelen 0  (Ethernet)
        RX packets 1849  bytes 197178 (192.5 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 1747  bytes 133196 (130.0 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

<br/>

## 附录

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>