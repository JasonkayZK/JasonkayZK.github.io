---
title: 在Docker中安装MongoDB并配置
cover: https://acg.toubiec.cn/random?77
date: 2020-04-21 10:09:45
categories: Docker
toc: true
tags: [Docker, MongoDB]
description: 本篇讲解了使用Docker安装MongoDB, 并进行用户名密码等配置;
---

本篇讲解了使用Docker安装MongoDB, 并进行用户名密码等配置;

本文部分内容转自: [docker安装mongoDb并创建用户](http://www.apgblogs.com/docker-mongodb/)

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## 在Docker中安装MongoDB并配置

### 下载镜像

```bash
# 下载官方镜像
docker pull mongo
```

需要注意的是mongodb的镜像名就是mongo**(没有db);**

****

### 使用镜像创建容器

```bash
# 从镜像创建并启动mongoDb容器
docker run -d --privileged=true -p 27017:27017 --name=mongodb mongo:latest
# 查看容器是否已经启动
docker ps
```

****

### 创建mongodb用户

下面分别以创建root和普通用户为例:

```bash
# 进入mongoDb容器
docker exec -it mongodb /bin/bash

# 进入mongoDb
mongo
> use admin
switched to db admin

# 创建用户名为admin, 密码为123456, 角色为root的用户;
> db.createUser({user:"admin",pwd:"123456",roles:[{role:"root",db:"admin"}]});
Successfully added user: {
	"user" : "admin",
	"roles" : [
		{
			"role" : "root",
			"db" : "admin"
		}
	]
}
# 出现创建成功提示就对了，退出管理员
> exit;
```

用刚创建的管理用户登录, 再创建一个普通用户

```bash
# 用刚创建的管理用户登录
mongo --port 27017 -u admin -p 123456 --authenticationDatabase admin
# 再创建一个普通用户
> use test
switched to db test
# 普通用户账户: zk, 密码: 123456, 有读写权限;
> db.createUser({user:"zk",pwd:"123456",roles:[{role:"readWrite",db:"test"}]});
Successfully added user: {
	"user" : "zk",
	"roles" : [
		{
			"role" : "readWrite",
			"db" : "test"
		}
	]
}
```

>**mongoDb用户角色权限说明**
>
>-   **数据库用户角色** read、readWrite
>-   **数据库管理角色** dbAdmin、dbOwner、userAdmin
>-    **集群管理角色** clusterAdmin、clusterManager、clusterMonitor、  hostManager
>-    **备份恢复角色** backup、restore
>-    **所有数据库角色** readAnyDatabase、readWriteAnyDatabase、userAdminAnyDatabase、dbAdminAnyDatabase 
>-    **超级用户角色** root 
>-    **内部角色** __system 
>
>****
>
>**角色说明:**
>
>-   **Read 允许用户读取指定数据库**
>-   **readWrite 允许用户读写指定数据库**
>-   **dbAdmin 允许用户在指定数据库中执行管理函数，如索引创建、删除，查看统计或访问system.profile**
>-   **userAdmin 允许用户向system.users集合写入，可以找指定数据库里创建、删除和管理用户**
>-   **clusterAdmin 只在admin数据库中可用，赋予用户所有分片和复制集相关函数的管理权限。**
>-   **readAnyDatabase 只在admin数据库中可用，赋予用户所有数据库的读权限**
>-   **readWriteAnyDatabase 只在admin数据库中可用，赋予用户所有数据库的读写权限**
>-   **userAdminAnyDatabase 只在admin数据库中可用，赋予用户所有数据库的userAdmin权限**
>-   **dbAdminAnyDatabase 只在admin数据库中可用，赋予用户所有数据库的dbAdmin权限。**
>-   **root 只在admin数据库中可用。超级账号，超级权限**

<br/>


## 附录

本文部分内容转自: [docker安装mongoDb并创建用户](http://www.apgblogs.com/docker-mongodb/)

<br/>