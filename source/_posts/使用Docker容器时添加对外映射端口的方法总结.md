---
title: 使用Docker容器时添加对外映射端口的方法总结
toc: false
date: 2020-01-16 14:41:28
cover: http://api.mtyqx.cn/api/random.php?2
categories: Docker
tags: [Docker]
description: 本篇总结了几种使用Docker容器时添加对外映射端口的方法
---

Docker容器在运行时可能会遇到多开启几个端口或者修改启动参数等情况, 本篇总结了两种使用Docker容器时添加对外映射端口的方法:

-   创建当前容器的镜像并重新运行镜像
-   修改当前容器的配置文件

<br/>

<!--more-->

### 方法一: 将现有的容器打包成镜像，在使用新的镜像运行容器时重新指定要映射的端口

**① 先停止现有容器**

```bash
docker stop container-name
```

**② 将容器commit成为一个镜像**

```bash
docker commit container-name  new-image-name
```

**③ 用新镜像运行容器**

```bash
docker run -it -d --name container-name -p p1:p1 -p p2:p2 new-image-name
```

<br/>

### 方法二: 修改要端口映射的容器的配置文件

**① 查看容器信息**

```bash
docker ps -a
```

**② 查看容器的端口映射情况，在容器外执行**

```bash
docker port 容器ID 或者 docker port 容器名称
```

**③ 查找要修改容器的容器Id**

```bash
docker inspect 容器ID |grep Id
```

**④ 进到/var/lib/docker/containers 目录下找到与 Id 相同的目录, 修改 hostconfig.json 和 config.v2.json文件**

><br/>
>
>**注意:**
>
>若该容器还在运行，先停掉:
>
>```bash
>docker stop 容器ID
>```
>
>停掉docker服务
>
>```bash
>systemctl stop docker
>```

修改hostconfig.json, 在`"PortBindings"`中添加端口绑定:

```json
"9003/tcp": [{"HostIp": "","HostPort": "9003"}]，# 表示绑定端口9003
```

修改config.v2.json在ExposedPorts中加上要暴露的端口，即9003

**⑤ 改完之后保存启动docker**

```
systemctl start docker
```

之后可以再次查看添加的端口是否已映射绑定上

<br/>

### 总结

以上总结了两种使用Docker容器时添加对外映射端口的方法:

-   创建当前容器的镜像并重新运行镜像
-   修改当前容器的配置文件

<br/>