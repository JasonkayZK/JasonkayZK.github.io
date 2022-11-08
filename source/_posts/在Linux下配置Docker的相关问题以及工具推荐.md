---
title: 在Linux下配置Docker的相关问题以及工具推荐
toc: true
date: 2019-09-24 20:38:21
categories: 软件安装与配置
cover: https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=2761450135,1392686256&fm=26&gp=0.jpg
tags: [Docker, 分布式, 软件推荐]
description: 今天在VSCode中添加与Docker相关的插件时, 一直报错, 果然是Linux用户权限的问题. 本篇文章带你解决Docker在Linux操作系统中权限问题的同时, 教你简单配置Docker, 并推荐Docker管理的相关软件!
---



今天在VSCode中添加与Docker相关的插件时, 一直报错, 果然是Linux用户权限的问题. 本篇文章带你解决Docker在Linux操作系统中权限问题的同时, 教你简单配置Docker, 并推荐Docker管理的相关软件!

本篇包括:

-   Linux下非root用户的权限配置(解决`connect EACCES /var/run/docker.sock`错误)
-   Docker设置国内安装源
-   Docker相关管理软件推荐
-   ......

<!--more-->

## 在Linux下配置Docker的相关问题以及工具推荐

### 零. 前言

今天在VSCode中添加与Docker相关的插件时, 一直报错, 不出意料果然是Linux用户权限的问题导致无法获取Docker的相关信息. 

所以本文带你解决Docker在Linux操作系统中权限问题. 但是只是解决这个问题就写一篇文章显然有点小题大做, 所以决定再写一下Docker的相关配置以及Docker的插件推荐.



<br/>

----------



### 一. Docker daemon socket权限不足

在安装VSCode中的Docker插件或者使用非root用户执行docker相关命令时, 可能会出现下述:

```
docker: Got permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Post http://%2Fvar%2Frun%2Fdocker.sock/v1.38/containers/create: dial unix /var/run/docker.sock: connect: permission denied.
```

出现上面问题是因为：

<font color="#ff0000">管理Docker的不是root用户! docker进程使用Unix Socket而不是TCP端口。而默认情况下，Unix socket属于root用户，需要root权限才能访问。</font>

<br/>

解决的方案有两个:

-   使用sudo获取管理员权限，运行docker命令
-   添加docker group组，将用户添加进去

<font color="#0000ff">但是对于一些IDE使用root就比较麻烦, 而且也不是很安全, 所以可以通过方法二</font>

shell命令如下:

```bash
sudo groupadd docker #添加docker用户组
sudo gpasswd -a $USER docker #将登陆用户加入到docker用户组中
正在将用户“zk”加入到“docker”组中
newgrp docker #更新用户组
```

<font color="#ff0000">之后需要注销当前用户, 然后重新登录!</font>

重新登录后, 再次使用docker命令:

```bash
docker ps #测试当前用户是否可以正常使用docker命令
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
```

可正常输出, 同时VSCode插件也可正常运行!



<br/>

----------



### 二. Docker设置国内安装源

Docker官方仓库在国外，速度较慢，可以更换为国内仓库加速!

#### 1. 使用阿里云的docker加速器

在阿里云申请一个账号;

打开连接:https://cr.console.aliyun.com/#/accelerator 拷贝您的专属加速器地址。

修改修改daemon配置文件/etc/docker/daemon.json来使用加速器

```bash
sudo vi /etc/docker/daemon.json
# 将你的加速器地址填写在下面
{
  "registry-mirrors": ["https://xxx.mirror.aliyuncs.com"]
}

sudo systemctl daemon-reload
sudo systemctl restart docker
```

<br/>

#### 2. 利用docker-cn提供的镜像源

编辑/etc/docker/daemon.json文件，并输入docker-cn镜像源地址

```bash
sudo vi /etc/docker/daemon.json
{
  "registry-mirrors": ["https://registry.docker-cn.com"]
}
sudo systemctl daemon-reload
sudo systemctl restart docker
```



<br/>



----------



### 三. Docker管理插件推荐

#### 1. VSCode: Docker

对于VSCode中各种各样的插件这里不多介绍了, 这是你在编辑DockerFile时默认推荐的插件, 除了编写脚本时有代码补全, 语法检查之外, 左侧还多了一个位置, 帮助你:

-   管理已经部署的Container;
-   管理已经下载的Images;
-   DockerHub账号管理;
-   网络映射管理;
-   系统用量管理等;

界面如下所示:

![docker_vscode](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/docker_vscode.png)

<br/>

#### 2. Portainer

这个是Github上的一个开源项目: [Portainer官方仓库](https://github.com/portainer/portainer)

Portainer提供了更为强大的Docker管理, 让你的部署, 管理等更为便捷, 并且是在浏览器中以Dashboard的形式展出!

<font color="#0000ff">Portainer可以在Docker中运行, 这是它的一大优势!</font>

```bash
$ docker volume create portainer_data
$ docker run -d -p 9000:9000 --name portainer --restart always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer
```

Portainer的官方文档: [Portainer documentation](https://portainer.readthedocs.io/en/latest/index.html)



<br/>

--------



### 四. 总结

本文主要讲述了在Linux系统下如何使用非root用户使用docker相关命令, 然后讲述了如何配置国内安装源, 最后推荐了Docker管理相关插件: VSCode-Docker和Portainer.



<br/>

---------



### 附录

文章参考:

-   [问题记录：Docker daemon socket权限不足](https://www.jianshu.com/p/a0cf03605c42)
-   [Docker设置国内安装源](https://www.jianshu.com/p/863324faa003)
-   [Docker官方文档: Post-installation steps for Linux](https://docs.docker.com/install/linux/linux-postinstall/)
-   [Portainer官方文档](https://portainer.readthedocs.io/en/latest/index.html)





