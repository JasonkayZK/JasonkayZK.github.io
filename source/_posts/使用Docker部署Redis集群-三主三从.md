---
title: 使用Docker部署Redis集群-三主三从
toc: true
date: 2020-01-17 21:30:52
cover: http://api.mtyqx.cn/api/random.php?21
categories: [Docker, Redis]
tags: [Docker, Redis, 项目部署]
description: 项目中用到了Redis, 所以打算用Docker在本地搭建一个Redis集群. 搭建时用到了docker-compose, 而网上大多数参考都是先搭建六个单节点, 然后再创建主从节点, 在这种方式下没办法细粒度的指定哪个节点为主节点, 哪个节点为指定主节点的从节点(其实可以, 但是很麻烦)
---

项目中用到了Redis, 所以打算用Docker在本地搭建一个Redis集群. 搭建时用到了docker-compose, 而网上大多数参考都是先搭建六个单节点, 然后再创建主从节点, 在这种方式下没办法细粒度的指定哪个节点为主节点, 哪个节点为指定主节点的从节点(其实可以, 但是很麻烦)

所以在docker-compose.yml中增加了配置, 完成了一条命令创建三主三从的Redis节点, 并且可以根据需求来指定哪些为主, 哪些为从, 以及从节点属于哪个主节点

<br/>

<!--more-->

## 使用Docker部署Redis集群-三主三从

本案例源代码: https://github.com/JasonkayZK/ttmall/tree/master/docker/redis-cluster

<br/>

### 拉取镜像

本次使用的是Redis最新的镜像版本: Redis:5.0.7

<br/>

### 创建集群网络

使用命令创建redis集群的网络redis-cluster-net:

```bash
docker network create --subnet=192.168.200.0/24 redis-cluster-net
```

><br/>
>
>**说明:**
>
><font color="#f00">**① 创建一个网段: 192.168.200.0(docker默认使用172.17.0.1网段)**</font>
>
><font color="#f00">**② 24表示子网掩码有24位,即255.255.255.0**</font>

集群ip以及端口安排:

|       ip       | port |      remark      |
| :------------: | :--: | :--------------: |
| 192.168.200.11 | 7001 | 主节点: master-1 |
| 192.168.200.12 | 7002 | 主节点: master-2 |
| 192.168.200.13 | 7003 | 主节点: master-3 |
| 192.168.200.14 | 7004 | 从节点: slave-1  |
| 192.168.200.15 | 7005 | 从节点: slave-2  |
| 192.168.200.16 | 7006 | 从节点: slave-3  |

<br/>

### 创建redis.conf配置文件

这里分别给出一个主节点和一个从节点的最小配置文件例子, 其他的修改一些端口号即可

**主节点**

redis-7001.conf

```
port 7001
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
daemonize no
protected-mode no
pidfile  /var/run/redis_7001.pid
```

**从节点**

redis-7004.conf

```
port 7004
cluster-enabled no
appendonly yes
daemonize no
protected-mode no
pidfile  /var/run/redis_7004.pid
slaveof 192.168.1.103 7001
```

><br/>
>
>**说明:**
>
>**主节点主要配置说明:**
>
>-   port: 指定了启动的端口号
>-   cluster-enabled: 启动允许集群
>-   cluster-config-file & cluster-node-timeout: 集群配置文件(自动创建)和集群超时时间
>-   appendonly: 持久化 yes
>-   daemonize: 后台运行 no
>-   protected-mode: 允许外部IP访问
>
>**主节点配置注意事项:**
>
><font color="#f00">**① 开启持久化后默认的数据路径在容器的/data下**</font>
>
><font color="#f00">**② daemonize一定要关闭, 否则容器启动后会因为没有前台线程而直接关闭**</font>
>
>****
>
>**从节点主要配置说明:**
>
>-   cluster-enabled: no 不参与集群分配
>-   appendonly: 持久化 yes
>-   daemonize: 后台运行 no(理由同上)
>-   slaveof 192.168.1.103 7001: 直接指定成为对应master的从节点
>
>**从节点配置注意事项:**
>
><font color="#f00">**① cluster-enabled配置为no, 不参与集群分配, 否则将无法直接指定slaveof**</font>
>
><font color="#f00">**② 从节点也进行持久化, 其实可以主节点持久化, 从节点做流量访问, 否则有可能影响性能**</font>
>
><font color="#f00">**③ slaveof ip port直接指定了本节点是指定节点一个从节点(注意ip port中间是空格而不是冒号)**</font>
>
>****
>
>其他相关节点的配置与上面类似, 修改port即可
>
>源代码见: https://github.com/JasonkayZK/ttmall/tree/master/docker/redis-cluster
>
>更详细配置说明见: [转-redis常用配置redis-conf说明](https://jasonkayzk.github.io/2020/01/17/转-redis常用配置redis-conf说明/)

<br/>

### 创建docker-compose.yml

docker-compose.yml中主要完成镜像, 网络等声明以及各个容器的内容等, 内容如下:

```yaml
version: '3.7'

x-image:
  &default-image
    redis:5.0.7

networks:
  redis-cluster-net:
    external:
      name: redis-cluster-net

services:
  redis-master-1:
    image: *default-image
    container_name: redis-master-1
    command:
      ["redis-server", "/home/redis/cluster/redis.conf"]
    networks:
      redis-cluster-net:
        ipv4_address: 192.168.200.11
    volumes:
      - ./redis-7001.conf:/home/redis/cluster/redis.conf
      - ./7001/data:/data
    ports:
      - 7001:7001
      - 17001:17001

  redis-master-2:
    image: *default-image
    container_name: redis-master-2
    command:
      ["redis-server", "/home/redis/cluster/redis.conf"]
    networks:
      redis-cluster-net:
        ipv4_address: 192.168.200.12
    volumes:
      - ./redis-7002.conf:/home/redis/cluster/redis.conf
      - ./7002/data:/data
    ports:
      - 7002:7002
      - 17002:17002

  redis-master-3:
    image: *default-image
    container_name: redis-master-3
    command:
      ["redis-server", "/home/redis/cluster/redis.conf"]
    networks:
      redis-cluster-net:
        ipv4_address: 192.168.200.13
    volumes:
      - ./redis-7003.conf:/home/redis/cluster/redis.conf
      - ./7003/data:/data
    ports:
      - 7003:7003
      - 17003:17003

  redis-salve-1:
    image: *default-image
    container_name: redis-salve-1
    command:
      ["redis-server", "/home/redis/cluster/redis.conf"]
    networks:
      redis-cluster-net:
        ipv4_address: 192.168.200.14
    volumes:
      - ./redis-7004.conf:/home/redis/cluster/redis.conf
      - ./7004/data:/data
    ports:
      - 7004:7004
      - 17004:17004

  redis-salve-2:
    image: *default-image
    container_name: redis-salve-2
    command:
      ["redis-server", "/home/redis/cluster/redis.conf"]
    networks:
      redis-cluster-net:
        ipv4_address: 192.168.200.15
    volumes:
      - ./redis-7005.conf:/home/redis/cluster/redis.conf
      - ./7005/data:/data
    ports:
      - 7005:7005
      - 17005:17005

  redis-salve-3:
    image: *default-image
    container_name: redis-salve-3
    command:
      ["redis-server", "/home/redis/cluster/redis.conf"]
    networks:
      redis-cluster-net:
        ipv4_address: 192.168.200.16
    volumes:
      - ./redis-7006.conf:/home/redis/cluster/redis.conf
      - ./7006/data:/data
    ports:
      - 7006:7006
      - 17006:17006
```

><br/>
>
>**说明:**
>
>-   <font color="#f00">**docker-compose的版本为最新版: 3.7, 如果你的docker版本较低, 可以修改为更低的版本(并没有用新特性, 兼容低版本)**</font>
>-   **配置指定了使用的镜像, 容器名称, 创建的网络, 文件映射, 端口映射等**
>-   **volumes分别将本地配置和持久化数据进行映射**
>-   **ports分别将节点端口和集群端口映射到本地(port+10000)**

<br/>

### 启动

在docker-compose.yml所在目录执行命令:

```bash
$ docker-compose up -d
Creating redis-master-3 ... done
Creating redis-salve-3  ... done
Creating redis-salve-1  ... done
Creating redis-master-2 ... done
Creating redis-master-1 ... done
Creating redis-salve-2  ... done
```

即创建了六个Redis示例

><br/>
>
>**注意: 此时仅仅创建了三对主从节点, 但是三个主节点(7001, 7002, 7003)是孤立的, 并且还未分配slots**

<br/>

### 创建集群并进行slots分配

进入任一主节点**(注意是主节点)**, 并执行下面的命令

```bash
root@141307f0c6e2:/data# redis-cli --cluster create 192.168.1.103:7001 192.168.1.103:7002 192.168.1.103:7003 --cluster-replicas 0
>>> Performing hash slots allocation on 3 nodes...
Master[0] -> Slots 0 - 5460
Master[1] -> Slots 5461 - 10922
Master[2] -> Slots 10923 - 16383
M: 2056e77f1e6d24800e7af83770b5b92ac3091958 192.168.1.103:7001
   slots:[0-5460] (5461 slots) master
M: 56908abced57c7ed2ca0a22c0265a8b8ba5056e8 192.168.1.103:7002
   slots:[5461-10922] (5462 slots) master
M: 06f0cb6f92770709d8afdc226da16abc6ab3679d 192.168.1.103:7003
   slots:[10923-16383] (5461 slots) master
   
Can I set the above configuration? (type 'yes' to accept): yes
>>> Nodes configuration updated
>>> Assign a different config epoch to each node
>>> Sending CLUSTER MEET messages to join the cluster
Waiting for the cluster to join
..
>>> Performing Cluster Check (using node 192.168.1.103:7001)
M: 2056e77f1e6d24800e7af83770b5b92ac3091958 192.168.1.103:7001
   slots:[0-5460] (5461 slots) master
M: 56908abced57c7ed2ca0a22c0265a8b8ba5056e8 192.168.200.1:7002
   slots:[5461-10922] (5462 slots) master
M: 06f0cb6f92770709d8afdc226da16abc6ab3679d 192.168.200.1:7003
   slots:[10923-16383] (5461 slots) master
[OK] All nodes agree about slots configuration.
>>> Check for open slots...
>>> Check slots coverage...
[OK] All 16384 slots covered.
```

输入yes同意slots分配即可完成集群创建

<br/>

### 测试

在7001(master-1)中添加几个k-v对:

```bash
7001(127.0.0.1:7001)>set hello world
"OK"
7001(127.0.0.1:7001)>set hello1 world1
已连接到集群。
7001(127.0.0.1:7001)>
7001(192.168.200.1:7003)>
"OK"
7001(192.168.200.1:7003)>set hello2 world2
已连接到集群。
7001(192.168.200.1:7003)>
7001(192.168.200.1:7002)>
"OK"
7001(192.168.200.1:7002)>
```

><br/>
>
>**说明: 此时由于redis分配规则, 某些key值在计算完hash后会被分配到其他master节点(如上)**

<font color="#f00">**在这种情况下, 理论上在master-1的从节点上应当是无法查询到其他加入到其他主节点中的key的**</font>

执行命令:

```bash
7004:0>get hello
"world"
7004:0>get hello1
null
7004:0>get hello2
null
```

可见查询hello1, hello2均为null, 而查询其他从节点可查到对应数据

```bash
7005:0>get hello2
"world2"
```

>   <br/>
>
>   **说明确实完成了主从复制, 集群搭建成功!**

<br/>

### 集群关闭

在docker-compose.yml目录下执行下述命令即可关闭:

```bash
docker-compose down
```

><br/>
>
>**注意:**
>
><font color="#f00">**使用`docker-compose up -d`命令创建的容器会在down了之后自动删除!**</font>
>
><font color="#f00">**而再次启动时, 如果指定的数据路径存在数据, 则无法创建集群**</font>
>
>所以重新创建redis集群需要:
>
>-   将每个节点下aof、rdb、nodes.conf本地备份文件删除
>-   127.0.0.1:7001> flushdb #清空当前数据库(这一步可以省略) 
>-   重新执行创建集群命令
>
>****
>
>具体可见: [重新创建redis集群的注意事项](https://www.cnblogs.com/yfacesclub/p/11849727.html)

<br/>

### 参考文章

-   [Redis 5.0 redis-cli --cluster help说明](https://www.cnblogs.com/zhoujinyi/p/11606935.html)
-   [docker network create](https://blog.csdn.net/zhizhuodewo6/article/details/87706638)

<br/>