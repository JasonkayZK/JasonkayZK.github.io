---
title: BI工具Redash体验
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?22'
date: 2021-08-15 15:23:05
categories: Redash
tags: [Redash, Docker]
description: 最近忙着加班，忙里偷闲=体验了一下BI工具Redash；一如既往的，采用Docker配合compose一键部署体验；
---

最近忙着加班，忙里偷闲=体验了一下BI工具Redash；一如既往的，采用Docker配合compose一键部署体验；

源代码：

-   https://github.com/JasonkayZK/docker_repo/tree/redash-single

<br/>

<!--more-->

# **BI工具Redash体验**

## 前言-什么是BI

>   BI即商业智能（Business Intelligence），它是一套完整的解决方案，用来将企业中现有的数据进行有效的[整合](https://baike.baidu.com/item/整合/33302)，快速准确的提供报表并提出决策依据，帮助企业做出明智的业务经营决策；
>
>   商业智能的概念最早在1996年提出，当时将商业智能定义为一类由[数据仓库](https://baike.baidu.com/item/数据仓库/381916)（或[数据集市](https://baike.baidu.com/item/数据集市/607135)）、查询报表、数据分析、[数据挖掘](https://baike.baidu.com/item/数据挖掘/216477)、数据备份和恢复等部分组成的、以帮助企业决策为目的技术及其应用；

那么话不多说，直接进入安装步骤；

<br/>

## **使用Docker部署Redash**

首先创建docker-compose文件：

[docker-compose.yml](https://github.com/JasonkayZK/docker_repo/blob/redash-single/docker-compose.yml)

```yaml
version: '3.6'
services:
  server:
    image: redash/redash:8.0.2.b37747
    command: server
    depends_on:
      - redash_postgres
      - redash_redis
    ports:
      - "15000:5000"
    networks:
      - redash
    deploy:
      mode: replicated
      replicas: 1
    environment:
      PYTHONUNBUFFERED: 0
      REDASH_LOG_LEVEL: "INFO"
      REDASH_REDIS_URL: "redis://redash_redis:6379/0"
      REDASH_DATABASE_URL: "postgresql://postgres:123456@redash_postgres/postgres"
      REDASH_COOKIE_SECRET: "123456"
      REDASH_WEB_WORKERS: 4

  worker:
    image: redash/redash:8.0.2.b37747
    command: scheduler
    networks:
      - redash
    deploy:
      mode: replicated
      replicas: 1
    environment:
      PYTHONUNBUFFERED: 0
      REDASH_LOG_LEVEL: "INFO"
      REDASH_REDIS_URL: "redis://redash_redis:6379/0"
      REDASH_DATABASE_URL: "postgresql://postgres:123456@redash_postgres/postgres"
      QUEUES: "queries,scheduled_queries,celery"
      REDASH_COOKIE_SECRET: "123456"
      WORKERS_COUNT: 2

  redash_redis:
    image: redis:6.2.4
    networks:
      - redash
    deploy:
      mode: replicated
      replicas: 1
  redash_postgres:
    image: postgres:13.3
    networks:
      - redash
    environment:
      POSTGRES_PASSWORD: 123456
    deploy:
      mode: replicated
      replicas: 1

networks:
  redash:
    name: redash
```

需要注意的是：

-   **Redash依赖Redis和Postgres两个数据库，因此在服务中声明了`redash_redis`和`redash_postgres`；**
-   **为了防止网络冲突，将所有的服务都声明在了同一个网络`redash`下；**
-   **对于Redash服务而言：在`worker`中声明了数据库的相关配置，并在server服务中启动了服务；**
-   **Redash服务的端口映射为`15000:5000`，稍后我们会通过15000端口访问它；**

启动Redash服务分为两个步骤：

-   ① 创建数据库；
-   ② 启动服务；

下面一一来看；

### **① 创建数据库**

直接使用下面的命令启动`server`服务，并执行`create_db`命令即可创建并初始化数据库：

```bash
docker-compose -f docker-compose.yml run --rm server create_db
```

### **② 启动服务；**

使用下面的命令可以一键部署Redash：

```bash
docker-compose -f docker-compose.yml up -d
```

成功执行命令后可以看到相关服务已经启动：

```bash
[root@VM-234-202-centos ~]# docker ps -a
CONTAINER ID   IMAGE                        COMMAND                  CREATED       STATUS       PORTS                                                    NAMES
1ed3c3eecd3a   redash/redash:8.0.2.b37747   "/app/bin/docker-ent…"   6 days ago    Up 6 days    0.0.0.0:15000->5000/tcp, :::15000->5000/tcp              redash_server_1
140940d1edef   redash/redash:8.0.2.b37747   "/app/bin/docker-ent…"   6 days ago    Up 6 days    5000/tcp                                                 redash_worker_1
00026cfcf3f5   postgres:13.3                "docker-entrypoint.s…"   6 days ago    Up 6 days    5432/tcp                                                 redash_redash_postgres_1
7aff1d272160   redis:6.2.4                  "docker-entrypoint.s…"   6 days ago    Up 6 days    6379/tcp                                                 redash_redash_redis_1
965c7b4ac3a0   postgres:13.3                "docker-entrypoint.s…"   6 days ago    Up 6 days    0.0.0.0:15432->5432/tcp, :::15432->5432/tcp              mypostgres
202a5385247f   redis:6.2.4                  "docker-entrypoint.s…"   5 weeks ago   Up 5 weeks   0.0.0.0:16379->6379/tcp, :::16379->6379/tcp              redis
61feb34256e4   mysql:8.0.25                 "docker-entrypoint.s…"   5 weeks ago   Up 5 weeks   33060/tcp, 0.0.0.0:13306->3306/tcp, :::13306->3306/tcp   mysql
e4e3e50b4da7   portainer/portainer-ce       "/portainer"             5 weeks ago   Up 5 weeks   8000/tcp, 0.0.0.0:19000->9000/tcp, :::19000->9000/tcp    portainer
```

通过Portainer也可以查看：

![redash_0.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/redash_0.png)

>   <font color="#f00">**注意到，因为我们声明了Redash在独立的redash网络中，因此我们的Redash服务不会影响到我们之前的MySQL、Redis等服务！**</font>

<br/>

## **Redash相关操作**

首次启动Redash后，需要进行一些用户名、密码等基本配置；

然后就可以进入主页面了！

![redash_1.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/redash_1.png)

### **添加数据源**

点击设置，可以添加对应的数据源：

![redash_2.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/redash_2.png)

上面是我添加的我在腾讯云服务器上部署的MongoDB的数据源；

<br/>

### **增加查询**

点击Queries，可以创建数据查询；

在这里，我创建了两个查询，主要是关于我博客的点赞数统计，和点赞类型统计；

关于点赞数的统计结果查询如下：

![redash_3.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/redash_3.png)

执行后，可以看到下方的查询结果；

<br/>

### **创建查询图表**

随后我们还可以创建相关的面板：点击右侧的`+ New Visualization`，创建图表；

可以看到创建完成后的图表结果如下：

![redash_4.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/redash_4.png)

可以看到，创建图表还是相当方便的！

<br/>

### **创建表盘(Dashboard)**

最后，点击Create，选择Dashboard，输入表盘名称即可创建表盘；

在表盘中点击Edit，然后点击`Add Widget`即可添加对应表盘；

例如：

![redash_5.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/redash_5.png)

同时可以一键同步所有数据

<br/>

## **后记**

除了上面的一些基本功能和丰富的数据源等优点之外，Redash还提供了发送日报邮件等功能；

有兴趣的童鞋可以深入学习~

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/docker_repo/tree/redash-single

文章参考：

-   https://www.jianshu.com/p/6af73fcf5589


<br/>
