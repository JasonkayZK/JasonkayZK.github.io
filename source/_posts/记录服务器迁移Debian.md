---
title: 记录服务器迁移Debian
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?88'
date: 2022-11-13 14:59:35
categories: 技术杂谈
tags: [技术杂谈]
description: 之前服务器用的是 CentOS7，很多东西都已经过时了，用起来很不方便；所以趁着周末有空，重建了整个系统，改用 Debian；同时也把服务器上所有的服务也都容器化了，更方便管理；
---

之前服务器用的是 CentOS7，很多东西都已经过时了，用起来很不方便；

所以趁着周末有空，重建了整个系统，改用 Debian；

同时也把服务器上所有的服务也都容器化了，更方便管理；

源代码：

-   https://github.com/JasonkayZK/docker-repo

<br/>

<!--more-->

# **记录服务器迁移Debian**

## **备份数据**

在进行服务器重装系统之前，首先要备份相关的数据；

对于腾讯云上的 LightHouse 而言，可以很方便、并且无需关机的创建一个镜像；

同时，还要将一些文件打包：`tar -zcv -f bak.tar.gz workspace/`；

并且使用 `mongodump` 备份数据；

记录服务 IP、配置等等…；

<br/>

## **重建系统**

数据都备份之后，可以直接在 LightHouse 上选择重装系统，选择 Debian 11；

安装完成后，将备份的文件上传，解压缩 `tar -zxvf bak.tar.gz -C ./workspace`；

并且使用 `mongorestore` 恢复数据；

<br/>

## **打包服务**

关于一些常用的工具，例如：net-tools、docker 的安装这里就不写了；

这里主要讲一下打包服务；

在服务器上，主要是使用的 Node 和 Python 写的服务；

对于 Python 服务打包 Docker 镜像：

```dockerfile
FROM python:3.9-slim-buster

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt 

COPY main.py main.py

CMD [ "python3", "main.py"]
```

可以使用上面的 Dockerfile 来安装依赖并启动：

```bash
docker run -d --name app --restart=always app:latest
```

<br/>

对于 Node 服务也是类似的：

```dockerfile
FROM node:14

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --registry=http://mirrors.cloud.tencent.com/npm/

# Bundle app source
COPY *.js ./

CMD [ "node", "index.js" ]
```

启动服务：

```bash
docker run -d --name backend --net host  --restart=always backend:latest
```

**如果是同一台机器同时部署的 mysql、redis 等数据库，如果没有提前创建 Docker 网络，可能会出现 Docker 各个容器之间网络不通的情况；**

**一个简单的策略就是：服务容器直接使用 `host` 类型的网络，此时可以直接使用 `127.0.0.1` 连接数据库（前提是数据库容器对外暴露了端口！）**

<br/>

还有一些服务不太好容器化，此时可以使用 `supervisor` 进行服务监控和管理；

安装：

```bash
apt install supervisor
```

在 `/etc/supervisor/conf.d` 目录下新增 `*.conf` 配置，例如：

blog.conf

```ruby
#项目名
[program:blog]
#脚本目录
directory=/opt/bin
#脚本执行命令
command=/usr/bin/python /opt/bin/test.py

#supervisor启动的时候是否随着同时启动，默认True
autostart=true
#当程序exit的时候，这个program不会自动重启,默认unexpected，设置子进程挂掉后自动重启的情况，有三个选项，false,unexpected和true。如果为false的时候，无论什么情况下，都不会被重新启动，如果为unexpected，只有当进程的退出码不在下面的exitcodes里面定义的
autorestart=false
#这个选项是子进程启动多少秒之后，此时状态如果是running，则我们认为启动成功了。默认值为1
startsecs=1

#脚本运行的用户身份 
user = test

#日志输出 
stderr_logfile=/tmp/blog_stderr.log 
stdout_logfile=/tmp/blog_stdout.log 
#把stderr重定向到stdout，默认 false
redirect_stderr = true
#stdout日志文件大小，默认 50MB
stdout_logfile_maxbytes = 20MB
#stdout日志文件备份数
stdout_logfile_backups = 20
```

之后：

```bash
# 重新加载
supervisorctl reload

# 查看状态
supervisorctl status
```

开机启动：

```bash
systemctl enable supervisor
```

>   更详细：
>
>   -   [Supervisor使用详解](https://www.jianshu.com/p/0b9054b33db3)

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/docker-repo

<br/>
