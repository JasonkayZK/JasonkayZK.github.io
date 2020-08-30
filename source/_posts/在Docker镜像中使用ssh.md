---
title: 在Docker镜像中使用ssh
cover: http://api.mtyqx.cn/api/random.php?86
date: 2020-04-06 15:15:01
categories: Docker
tags: [Docker]
toc: true
description: 有时候在Docker镜像中也需要进行文件传输.如果能够使用ssh远程登录到镜像那就再方便不过了~
---

有时候在Docker镜像中也需要进行文件传输.如果能够使用ssh远程登录到镜像那就再方便不过了~

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## 在Docker镜像中使用ssh

在这里以CentOS镜像为例;

### 设置root密码

在创建一个CentOS容器后, 默认root是没有密码的.

所以需要使用`passwd`修改root的密码

```bash
[root@490de829cb74 /]# passwd
Changing password for user root.
New password: 
......
```

<br/>

### 安装openssh

使用下面命令安装ssh-server和client：

```bash
$ yum install openssh-server openssh-clients
```

<br/>

### 配置ssh

修改ssh配置文件(`/etc/ssh/sshd_config`文件)

```bash
[root@490de829cb74 /]# vi /etc/ssh/sshd_config 

#启用 RSA 认证
RSAAuthentication yes 
#启用公钥私钥配对认证方式
PubkeyAuthentication yes
#公钥文件路径(和上面生成的文件同)
AuthorizedKeysFile .ssh/authorized_keys 
#允许root使用ssh登录
PermitRootLogin yes 
```

将上述四个配置的注释删除;

然后重启ssh服务，并设置开机启动:

```bash
[root@490de829cb74 /]# service sshd restart
Stopping sshd:                                             [  OK  ]
Starting sshd:                                             [  OK  ]
[root@490de829cb74 /]# chkconfig sshd on
```

此时配置完成!

<br/>

### 测试

在另一台机器上使用ssh登录:

```bash
zk@zk:~$ ssh root@172.18.1.0 
root@172.18.1.0's password: 
Last login: Mon Apr  6 07:12:01 2020 from 172.18.0.1
[root@490de829cb74 ~]# 
```

可登录则说明配置成功!

<br/>