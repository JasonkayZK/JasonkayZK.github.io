---
title: 迁移MongoDB官方Atlas集群中数据
toc: true
cover: 'https://acg.toubiec.cn/random?90'
date: 2020-12-17 09:26:03
categories: MongoDB
tags: [MongoDB]
description: 之前博客用的是MongoDB提供的免费Atlas数据库，位于新加坡。每次请求的时候都要顶着几百的延迟，体验是相当的差了！所以最后还是在自己的良心云上搭了个MongoDB，把数据同步过来了；
---

之前博客用的是MongoDB提供的免费Atlas数据库，位于新加坡。每次请求的时候都要顶着几百的延迟，体验是相当的差了！

所以最后还是在自己的良心云上搭了个MongoDB，把数据同步过来了；

<br/>

<!--more-->

## **迁移MongoDB官方Atlas集群中数据**

安装MongoDB的过程这里不再讲述了，Google一查一大把；

这里提供官方的安装文档：

-   https://docs.mongodb.com/manual/installation/

mongodump和mongorestore是MongoDB数据库自带的备份恢复工具；

>   <font color="#f00">**注1：在进行dump和restore之前，需要确保你拥有了Atlas实例的read权限、以及本地MongoDB的readWrite权限；**</font>
>
>   <font color="#f00">**注2：确保Atlas实例开启了远程登录，并正确配置了白名单：在SECURITY的Network Access的IP Access List中；**</font>
>
>   如下图：
>
>   ![mongodb_iplist.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/mongodb_iplist.png)
>
>   **通常为0.0.0.0/0：表示允许所有IP远程登录**

**备份数据库命令：**

```bash
mongodump --uri mongodb+srv://<username>:<passwd>@<cluster_url>/<collection_name>
```

将上面的：

-   username：atlas的用户名；
-   passwd：atlas的密码；
-   cluster_url：atlas对应集群url；
-   collection_name：Collection名称；

替换为你自己的；

执行之后就会在本地生成一个dump目录；

****

**恢复数据库命令：**

```bash
mongorestore --host <mongodb_host>:<mongodb_port> --authenticationDatabase admin -u <username> -d <database> <database_backupfile_directory>
```

其中：

-   mongodb_host：本地mongodb的ip；
-   mongodb_port：本地mongodb的端口号；
-   username：本地mongodb中admin数据库权限校验用户名；
-   database：恢复的Collection名称；
-   database_backupfile_directory：数据库备份文件所在的目录，例如：`./dump/blog/`；

键入回车即可完成恢复；

<br/>