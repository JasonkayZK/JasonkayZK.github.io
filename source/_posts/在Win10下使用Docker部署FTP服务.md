---
title: 在Win10下使用Docker部署FTP服务
toc: true
date: 2020-01-10 10:27:18
cover: https://img.paulzzh.tech/touhou/random?13
categories: Docker
tags: [Docker, FTP]
description: 本篇总结了在win10下面使用Docker来部署vsftpd服务
---

本篇总结了在win10下面使用Docker来部署vsftpd服务

<br/>

<!--more-->

最近写项目用到了FTP，也已经习惯了使用Docker进行容器化部署，这样可以不污染宿主的环境，所以在网上查了相关资料

而网上大部分使用的都是在Linux服务器上使用Docker部署，所以自己摸索了一下，稍作修改在win10下也完成了FTP的部署

### 拉取镜像

执行命令拉取vsftpd镜像

```powershell
docker pull fauria/vsftpd
```

<br/>

### 启动容器

通过命令创建容器并启动：

```powershell
docker run -d -v f:\ftp_file:/home/vsftpd 
    -p 20:20 -p 21:21 -p 21100-21110:21100-21110
    -e FTP_USER=zk 
    -e FTP_PASS=zk137818 
    -e PASV_ADDRESS=192.168.1.105 
    -e PASV_MIN_PORT=21100 
    -e PASV_MAX_PORT=21110 
    --name vsftpd --restart=always fauria/vsftpd
```

><br/>
>
>**说明：**
>
>在上述命令中：
>
>-   -d: 后台运行容器，并返回容器ID;
>-   -v: 建立`宿主机文件目录:容器内文件目录`映射
>-   -p: 多个端口映射
>-   -e: 对容器进行配置
>    -   FTP_USER: FTP服务器用户名
>    -   FTP_PASS: FTP服务器密码
>    -   PASV_ADDRESS: FTP服务器地址(通常是本地IP)
>    -   PASV_MIN_PORT: 被动模式最小端口号
>    -   PASV_MAX_PORT: 被动模式下最大端口号
>-   --name xxx: 启动后容器名称
>-   --restart=always: 容器挂了之后会自动重启
>-   fauria/vsftpd: 构建容器时使用的镜像名称
>
><font color="#ff0000">**使用上述命令时, 根据自己的实际需求来替换命令**</font>

<br/>

### 一些注意事项

**① 关于-v文件目录映射问题**

-   容器目录不可以为相对路径
-   宿主机目录如果不存在，则会自动生成

**② 当创建容器时, win10可能会提示磁盘访问权限, 允许即可**

<br/>

### 访问服务

可以使用FileZilla直接访问, 如下图:

![ftp1.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/ftp1.png)

当然也可以使用浏览器直接访问: url为:

```
ftp://username:password@hostname:port
```

在本例中为: `ftp://zk:zk137818@192.168.1.105:21`

如下图:

![ftp2.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/ftp2.png)

<br/>

### 增加一个新用户

**① 首先执行如下命令进入到容器**

```powershell
docker exec -i -t vsftpd bash
```

<br/>

**② 创建新用户的文件夹**

```shell
mkdir /home/vsftpd/test
```

><br/>
>
>**说明: 其中test为新用户的用户名**

<br/>

**③  编辑用户配置文件**

```shell
vi /etc/vsftpd/virtual_users.txt

# 文件内容
zk
zk137818
test # 新用户用户名
zk137818 # 新用户密码
```

<br/>

**④ 保存退出后执行如下命令，把登录的验证信息写入数据库**

```shell
/usr/bin/db_load -T -t hash -f /etc/vsftpd/virtual_users.txt /etc/vsftpd/virtual_users.db
```

<br/>

**⑤ 最后退出容器，并重启容器可以使用新用户连接 FTP 服务了**

```powershell
exit
docker restart vsftpd
```

<br/>