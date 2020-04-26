---
title: 使用Docker部署zookeeper集群
cover: http://api.mtyqx.cn/api/random.php?99
date: 2020-04-26 20:07:32
categories: Docker
tags: [Docker, Zookeeper]
description: 本文讲解如何使用Docker部署Zookeeper集群;
---

本文讲解如何使用Docker部署Zookeeper集群;


源代码: 

-   https://github.com/JasonkayZK/docker_repo/tree/zookeeper-v3.4-cluster

<br/>

<!--more-->

**目录:**

<!-- toc -->

<br/>

## 使用Docker部署zookeeper集群

### 实现目标

-   各zookeeper处于同一子网段
-   宿主机可以访问zookeeper集群
-   docker重启时集群自动重启
-   集群的数据文件映射到宿主机器目录中
-   使用yml文件和`docker-compose up -d`命令创建或重建集群

<br/>

### 拉取镜像

从zookeeper官方拉取3.4版本的镜像:

```bash
docker pull zookeeper:3.4
```

<br/>

### 创建子网段

```bash
docker network create --subnet 172.30.0.0/24 --gateway 172.30.0.1 zookeeper
```

以三个zookeeper为例, 各个子容器的ip地址分配如下:

| hostname | ip          | port      |
| -------- | ----------- | --------- |
| zoo1     | 172.30.0.11 | 2184:2181 |
| zoo2     | 172.30.0.12 | 2185:2181 |
| zoo3     | 172.30.0.13 | 2186:2181 |

<br/>

### 创建compose文件

```yaml
version: '3.4'

services: 
    zoo1:
        image: zookeeper:3.4
        restart: always
        hostname: zoo1
        container_name: zoo1
        ports:
            - 2184:2181
        volumes: 
            - "/home/zk/workspace/volumes/zkcluster/zoo1/data:/data"
            - "/home/zk/workspace/volumes/zkcluster/zoo1/datalog:/datalog"
        environment: 
            ZOO_MY_ID: 1
            ZOO_SERVERS: server.1=0.0.0.0:2888:3888 server.2=zoo2:2888:3888 server.3=zoo3:2888:3888
        networks:
            zookeeper:
                ipv4_address: 172.30.0.11

    zoo2:
        image: zookeeper:3.4
        restart: always
        hostname: zoo2
        container_name: zoo2
        ports:
            - 2185:2181
        volumes: 
            - "/home/zk/workspace/volumes/zkcluster/zoo2/data:/data"
            - "/home/zk/workspace/volumes/zkcluster/zoo2/datalog:/datalog"
        environment: 
            ZOO_MY_ID: 2
            ZOO_SERVERS: server.1=zoo1:2888:3888 server.2=0.0.0.0:2888:3888 server.3=zoo3:2888:3888
        networks:
            zookeeper:
                ipv4_address: 172.30.0.12
        
    zoo3:
        image: zookeeper:3.4
        restart: always
        hostname: zoo3
        container_name: zoo3
        ports:
            - 2186:2181
        volumes: 
            - "/home/zk/workspace/volumes/zkcluster/zoo3/data:/data"
            - "/home/zk/workspace/volumes/zkcluster/zoo3/datalog:/datalog"
        environment: 
            ZOO_MY_ID: 3
            ZOO_SERVERS: server.1=zoo1:2888:3888 server.2=zoo2:2888:3888 server.3=0.0.0.0:2888:3888
        networks:
            zookeeper:
                ipv4_address: 172.30.0.13

networks: 
    zookeeper:
        external: 
            name: zookeeper 
```

>   <br/>
>
>   以上配置内容可以根据需求修改, 如:
>
>   -   hostname: 容器主机名;
>   -   ports:端口映射;
>   -   networks: 容器ip地址;
>   -   volumes: 文件目录映射

<br/>

### 使用

#### 启动集群:

```bash
docker-compose -f docker-compose.yml up -d
Creating zoo3 ... done
Creating zoo1 ... done
Creating zoo2 ... done
```

****

#### 测试

```bash
$ docker exec -it zoo1 /bin/bash
root@zoo1:/zookeeper-3.4.14# ./bin/zkServer.sh status
ZooKeeper JMX enabled by default
Using config: /conf/zoo.cfg
Mode: follower
root@zoo1:/zookeeper-3.4.14# exit
exit
$ docker exec -it zoo2 /bin/bash
root@zoo2:/zookeeper-3.4.14# ./bin/zkServer.sh status
ZooKeeper JMX enabled by default
Using config: /conf/zoo.cfg
Mode: follower
root@zoo2:/zookeeper-3.4.14# exit
exit
$ docker exec -it zoo3 /bin/bash
root@zoo3:/zookeeper-3.4.14# ./bin/zkServer.sh status
ZooKeeper JMX enabled by default
Using config: /conf/zoo.cfg
Mode: leader
```

进入三个容器发现zoo1, zoo2, zoo3分别为从, 从, 主;

****

#### 停止

```bash
$ docker-compose -f docker-compose.yml stop
Stopping zoo2 ... done
Stopping zoo3 ... done
Stopping zoo1 ... done
Removing zoo2 ... done
Removing zoo3 ... done
Removing zoo1 ... done
Network zookeeper is external, skipping
```

>   <br/>
>
>   可以使用docker-compose stop/down停止一个compose应用;
>
>   区别在于:
>
>   **docker-compose stop**
>
>   停止 Compose 应用相关的所有容器，但不会删除它们。
>
>   被停止的应用可以很容易地通过 docker-compose restart 命令重新启动。
>
>   **docker-compose down**
>
>   停止并删除运行中的 Compose 应用。
>
>   它会删除容器和网络，但是不会删除卷和镜像。

<br/>

### 其他

可以在volumes下挂载各个zookeeper容器各种的配置文件等;

<br/>

## 附录

源代码:

-   https://github.com/JasonkayZK/docker_repo/tree/zookeeper-v3.4-cluster

参考文章:

-   [Docker快速搭建Zookeeper和kafka集群超详细](https://blog.csdn.net/weixin_45778734/article/details/105689685)
-   [zookeeper部署及集群测试](https://www.cnblogs.com/rwxwsblog/p/5806075.html)



如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>