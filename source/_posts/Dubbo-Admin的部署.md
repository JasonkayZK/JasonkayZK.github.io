---
title: Dubbo-Admin的部署
toc: true
date: 2019-12-06 19:02:30
cover: https://acg.toubiec.cn/random?3
categories: Dubbo
tags: [Dubbo]
description: 本篇讲述了在本地部署官方提供的Dubbo-Admin, 并解决了在打包部署时存在CuratorConnectionLossException异常的问题
---

本篇讲述了在本地部署官方提供的Dubbo-Admin, 并解决了在打包部署时存在CuratorConnectionLossException异常的问题

<br/>

<!--more-->

Dubbo官方已经提供了管理Dubbo的后台管理系统: [dubbo-admin](https://github.com/apache/dubbo-admin)

使用时只需要下面几步即可:

### ① 克隆项目的develop分支

```bash
git clone https://github.com/apache/dubbo-admin.git
```

<br/>

### ② 修改子模块dubbo-admin-server的配置

模块中自带的配置如下:

```properties
admin.registry.address=zookeeper://127.0.0.1:2181
admin.config-center=zookeeper://127.0.0.1:2181
admin.metadata-report.address=zookeeper://127.0.0.1:2181

#group
admin.registry.group=dubbo
admin.config-center.group=dubbo
admin.metadata-report.group=dubbo

admin.apollo.token=e16e5cd903fd0c97a116c873b448544b9d086de9
admin.apollo.appId=test
admin.apollo.env=dev
admin.apollo.cluster=default
admin.apollo.namespace=dubbo
```

>   <br/>
>
>   **因为我就是在本地运行, 所以使用的是默认的配置, 并没有做出修改**

<br/>

### ③ 在项目根目录下编译并打包

```bash
mvn clean package -Dmaven.test.skip=true
```

><br/>
>
>**注: 这里跳过了Maven构建中的test阶段**
>
>**若不跳过test阶段, 部署时报错:**
>
>```
>ERROR curator.ConnectionState - Connection timed out for connection string (127.0.0.1:2181) and timeout (5000) / elapshttps://ask.csdn.net/questions/691453#ed (19803)
>org.apache.curator.CuratorConnectionLossException: KeeperErrorCode = ConnectionLoss
>        at org.apache.curator.ConnectionState.checkTimeouts(ConnectionState.java:225)
>......
>```
>
><font color="#ff0000">**因为官方提供的源代码中的dubbo-admin-server模块一直无法通过测试, 所以在打包编译时跳过了这个阶段(不影响使用)**</font>

### ④ 启动项目

使用下面命令启动项目

```bash
mvn --projects dubbo-admin-server spring-boot:run
或
cd dubbo-admin-distribution/target; java -jar dubbo-admin-0.1.jar
```

可以在`http://localhost:8080`查看项目

<br/>