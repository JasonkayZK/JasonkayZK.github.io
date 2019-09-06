---
title: 初入zookeeper之安装与配置
date: 2019-09-01 22:48:44
categories: 分布式
tags: [Zookeeper, 分布式, 大数据, 软件安装与配置]
description: Zookeeper的部署总结.
---

![avatar](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1567359455658&di=34285376f655743af81698efb0b8ecca&imgtype=0&src=http%3A%2F%2Fweb3.xin%2Fuploads%2Fimage%2F2017%2F02%2F11%2F20170211145103_33505.jpg)

  	对于Zookeeper的安装与部署相关总结.

<!--more-->

# 零. Zookeeper安装

##   1. 准备Java环境

​		确保安装了Java 1.6以上的的版本, 并在/etc/profile中配置JAVA_HOME 和PATH等环境变量;

##   2. 下载安装包

​		从Apache的[Zookeeper](http://archive.apache.org/dist/zookeeper/)官网下载稳定版本**(尾号双数为稳定版本, 奇数为尝鲜版).**

##   3. 解压

​		通过 sudo tar -zxvf zookeeper-x.x.x.tar.gz  -C /opt/ 解压文件. 

## 4. 切换文件所有权(可选)

​		通过 sudo chown user:user -R zookeeper-x.x.x 转换文件所有权.

​		至此, Zookeeper安装完毕!

# 一. Zookeeper配置

##   1. 配置环境变量:

​		通过vi /etc/profile, 配置内容如下:

``` bash
export ZK_HOME=/opt/zookeeper-3.4.14
export PATH=$JAVA_HOME/bin:$JRE_HOME/bin:$PATH:$ZK_HOME/bin
```

配置ZK_HOME;

##   2. 配置zoo.cfg文件:

​		初次使用Zookeeper时, 还需要配置文件,将%ZK_HOME/conf/zoo_sample.cfg重命名:

``` bash
sudo vi %ZK_HOME/conf/zoo_sample.cfg %ZK_HOME/conf/zoo.cfg
```

​		并修改内容:

``` bash
tickTime=2000
# The number of ticks that the initial 
# synchronization phase can take
initLimit=5
# The number of ticks that can pass between 
# sending a request and getting an acknowledgement
syncLimit=2
# the directory where the snapshot is stored.
# do not use /tmp for storage, /tmp here is just 
# example sakes.
dataDir=/var/lib/zookeeper/data
dataLogsDir=/var/lib/zookeeper/logs
# the port at which the clients will connect
clientPort=2181
# the maximum number of client connections.
# increase this if you need to handle more clients
#maxClientCnxns=60
#
# Be sure to read the maintenance section of the 
# administrator guide before turning on autopurge.
#
# http://zookeeper.apache.org/doc/current/zookeeperAdmin.html#sc_maintenance
#
# The number of snapshots to retain in dataDir
#autpurge.snapRetainCount=3
# Purge task interval in hours
# Set to "0" to disable auto purge feature
#autopurge.purgeInterval=1
server.1=127.0.0.1:2888:3888
```

##   3. 开启Zookeeper

​		在根目录下执行:

``` bash
sudo sh ./bin/zkService.sh start
```

启动Zookeeper.

##   4. 验证服务器

​		确保本机中已安装telnet. 并使用:

``` bash
telnet 127.0.0.1 2181
```

​		如果连接成功则说明Zookeeper部署成功;

# 二. 常见错误



## 1. 启动Zookeeper的bin/zkServer.sh: 81: /opt/zookeeper-3.4.6/bin/zkEnv.sh: Syntax error: "(" unexpected (expecting "fi")错误:

​		原因:

​			Ubuntu的默认的shell有问题导致的!

​		解决:

​			使用: dpkg-reconfigure dash, **并选择 NO!**



## 2. 使用了sudo sh ./bin/zkService start, 显示START, 但是进程中无相应进程, 或telnet无法连接:

​		在根目录执行:

```bash
sudo sh ./bin/zkService.sh start-foreground
```

**注意:  推荐将文件所有权给root, 并用sudo执行(Ubuntu下), 防止本地用户权限过大!**

​		此时显示: **170:exec :java:not found**

解决方案: 

### 1. 修改bin目录下的zkServer.sh, 添加JAVA_HOME:

```bash
# use POSTIX interface, symlink is followed automatically
ZOOBIN="${BASH_SOURCE-$0}"
ZOOBIN="$(dirname "${ZOOBIN}")"
ZOOBINDIR="$(cd "${ZOOBIN}"; pwd)"
JAVA_HOME=/usr/java/jdk1.8.0_201
```

  		**最后一行为添加内容**.

  		此方法亲测有效!

### 2. 给解压后的目录 zookeeper 加权限 chmod -R 777 (文件夹名)

​		未尝试此方法!