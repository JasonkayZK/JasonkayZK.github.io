---
title: 使用Docker部署你的JavaWeb项目
toc: true
date: 2019-10-16 15:22:23
categories: Docker
tags: [Docker, 项目部署]
description: 由于最新的项目采用的是JDK11编写的, 而服务器上的还是JRE8, 所以想以后就使用Docker进行部署, 方便而且干净. 当然部署过程中还是遇到了很多小坑, 所以本篇文章记录了使用Docker部署JavaWeb项目的方法.
---

![JAR](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1571817260&di=8ff40e0ea67111dac6e9fae4f25666bd&imgtype=jpg&er=1&src=http%3A%2F%2Fwww.xdowns.com%2Fattachment%2Fsyapp%2Flogo%2F201808251535168806.jpg)

由于最新的项目采用的是JDK11编写的, 而服务器上的还是JRE8, 所以想以后就使用Docker进行部署, 方便而且干净. 当然部署过程中还是遇到了很多小坑, 所以本篇文章记录了使用Docker部署JavaWeb项目的方法.

读了本文你将学会:

-   如何使用Docker部署已经打包好的Jar包
-   如何使用Docker在Tomcat等容器中部署War包
-   ......



<br/>

<!--more-->

## 使用Docker部署你的JavaWeb项目

由于服务器上面安装了JRE8, 而新写的项目是以JDK11构建的, 但是又不想更改之前服务器的配置了, 所以打算这个项目开始就尝试使用Docker部署项目, 这一路上的艰辛谁知?! 

本篇就带你探秘使用docker部署jar, war, dockerfile的全解析!



<br/>

### 一. Docker部署Jar包

在目前前后端分离大火的背景下, 在使用Spring Boot构建Java Web项目时, 大部分都是打包成为Jar包, 而真正让项目跑起来只需要:

```bash
java -jar demo.jar
```

即可启动项目. 

当然, 这是最简单的.

在使用dokcer部署项目时:

#### 1. 首先拉取JER镜像

我自己也构建了JRE11的镜像在DockerHub上面, 可以通过:

```bash
docker pull jasonkay/jre11
```

来获取镜像.

<br/>

>   或者: 你也可以尝试在DockerHub上搜索`openjdk`或者`java`然后搜索相应的JRE版本.

<br/>



#### 2. 使用run命令让Jar包跑起来!

可以事先将待运行的jar包放在指定的文件夹下, 如我创建了一个目录: `/usr/local/dev/jar_deploy`, 其他需要部署的Jar包可以放置在这个目录下方便管理!

```bash
sudo mv demo.jar /usr/local/dev/jar_deploy
```

然后通过run命令, 并指定docker运行时镜像与本地文件的映射:

```bash
sudo docker run -d -p 8080:8080 -v /usr/local/dev/jar_deploy/demo.jar:/usr/local/dev/jar_deploy/demo.jar --name demo jasonkay/jre11 java -jar /usr/local/dev/jar_deploy/demo.jar
```

**命令解析:**

-   `-d`: 让docker在后台运行容器
-   `-p 8080:8080` :表示端口映射, 即 本机端口:容器内部端口;
-   `-v  /usr/local/dev/jar_deploy/demo.jar:/usr/local/dev/jar_deploy/demo.jar`: 表示将本地的目录中的/usr/local/dev/jar_deploy/demo.jar映射到镜像中的/usr/local/dev/jar_deploy/demo.jar文件, 是通过复制完成的, 并且两个文件会保持同步, 即修改那个都一样!
-   `--name demo`: 指定运行的容器的名称为demo, 这样便于查找, 注意: 不可与已有的container重复;
-   `jasonkay/jre11 java`: 创建容器使用到的镜像;
-   `java -jar /usr/local/dev/jar_deploy/demo.jar`: 创建容器之后要执行的命令, 即运行项目!

<br/>

>   此外还可以添加: `--restart=always`参数, 表示<font color="#ff0000">当 Docker 重启时，容器自动启动</font>

<br/>

一行命令即可完成项目的部署, 而且不需要再担心环境问题, 即使你是JDK6, JDK13, JDK100! 都可以通过pull下不同的镜像来部署你的项目!

<br/>

-----------------



### 二. Docker在Tomcat中部署War包

#### 1. 拉取tomcat镜像

可以通过修改tag来获取你想要的tomcat版本, 如:

```bash
docker pull tomcat:tag
```

#### 2. 启动并挂载目录

和上面一样, 可以通过-v参数指定需要挂载的目录, 如:

```bash
docker run -d -p 8080:8080 --name tomcat -v /usr/local/dev/docker_tomcat:/usr/local/tomcat/webapps --restart=always tomcat
```

与上面Jar包的部署类似, 关键是<font color="#ff0000">指定挂载目录在/usr/local/tomcat/webapps下!</font>

执行之后, 即可看到, docker_tomcat目录下的war包已经解压完毕, 这是tomcat自动完成的! 



