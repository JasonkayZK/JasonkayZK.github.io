---
title: 购买了新的CVM
toc: true
cover: 'https://img.paulzzh.com/touhou/random?43'
date: 2021-03-10 18:48:29
categories: 人生日记
tags: [人生日记, 技术杂谈]
description: 之前购买的良心云学生服务器已经到期，并且续费次数也用完了。正好最近有免费升级活动，2C4G6M的机器3年才400块钱，就入手了。本文记录了在新服务器上一些安装软件的过程和旧服务器数据迁移过程；
---

之前购买的良心云学生服务器已经到期，并且续费次数也用完了。正好最近有免费升级活动，2C4G6M的机器3年才400块钱，就入手了；

本文记录了在新服务器上一些安装软件的过程和旧服务器数据迁移过程；

<br/>

<!--more-->

## **购买了新的CVM**

其实如果都是云服务器的话，通过镜像直接迁移是最好的！

这里并不推荐我提供的方法，能直接使用镜像迁移还是使用镜像迁移吧！

### **安装软件**

主要安装的软件有：

-   htop
-   MySQL
-   Docker
-   Redis
-   MongoDB

对于MySQL、Redis、Docker的安装方法可见：

-   [MySQL](/installing/#Mysql)
-   [Redis](/installing/#Redis)
-   [Docker](/installing/#Docker)

htop直接通过yum安装即可；

MongoDB的安装过程见：

-   [CentOS7安装MongoDB](/2021/03/10/CentOS7%E5%AE%89%E8%A3%85MongoDB/)

<br/>

### **数据迁移**

#### **① MongoDB数据迁移**

MongoDB的迁移主要是将原数据源中的数据dump下来，在新的服务器上restore即可；

dump命令：

```bash
mongodump -h <host>:<port> -u <username> -p <password> -d <database> -o ./
```

restore过程：

```bash
mongorestore --host 127.0.0.1:<local_port> --authenticationDatabase admin -u <admin_username> -d <local_database> ./<database_name>/
```

>   关于集群的迁移见：
>
>   -   [迁移MongoDB官方Atlas集群中数据](/2020/12/17/%E8%BF%81%E7%A7%BBMongoDB%E5%AE%98%E6%96%B9Atlas%E9%9B%86%E7%BE%A4%E4%B8%AD%E6%95%B0%E6%8D%AE/)

<br/>

#### **② MySQL数据迁移**

MySQL数据迁移和MongoDB类似，也是将原数据源中的数据dump下来，在新的服务器上restore即可；

dump命令：

```bash
mysqldump --column-statistics=0 --host=<remote_host> -P<port> -u<username> -p <database> > <database>.sql
```

restore过程：

```bash
mysql -u<username> -p <local_database> < ./<database>.sql
```

<br/>

#### **③ 服务迁移**

由于我的服务都是在腾讯云上使用Serverless部署的，所以只要修改一下IP配置，然后重新部署一下就好了；

<br/>

### **后记**

从旧服务器到新服务器迁移其实并没有这么容易，尤其是对于正处于生产环境的服务器来说，要保证实时数据的同步，慢慢迁移；服务地址的修改也并非我描述的这么容易；

只是因为我的数据量很小，而且数据并非特别重要才迁移的很简单。

**最后，在接下来的三年，在新的服务器上玩耍吧！**

<br/>