---
title: 分享一个可以学习并部署高可用Postgres的网站CrunchyData
toc: true
cover: 'https://img.paulzzh.com/touhou/random?66'
date: 2022-11-12 14:42:40
categories: PostgreSQL
tags: [PostgreSQL, Kubernetes, 软件安装与配置]
description: 相比于 MySQL 我更喜欢性能更好、使用更方便并且插件生态更丰富的 Postgres！本文主要分享了一个可以学习并部署高可用Postgres的网站CrunchyData；
---

相比于 MySQL 我更喜欢性能更好、使用更方便并且插件生态更丰富的 Postgres！本文主要分享了一个可以学习并部署高可用Postgres的网站 [CrunchyData](https://www.crunchydata.com/)；

社区地址：

-   https://github.com/CrunchyData

网站：

-   https://www.crunchydata.com/developers/tutorials

<br/>

<!--more-->

# **分享一个可以学习并部署高可用Postgres的网站CrunchyData**

下面是可以在线通过实践学习 Postgres 的网站：

-   https://www.crunchydata.com/developers/tutorials

以及 Postgres Tips & Tricks：

-   https://www.crunchydata.com/postgres-tips

相比于其他在线实践在后台启动一个 Pod 实例来实现在线操作不同：

**CrunchyData 并不会在后台启动数据库实例，而是使用 WASM 的方式，直接将一个 Postgres 数据库跑在你的浏览器中！**

>   这也意味着如果你刷新页面，数据都将会丢失；
>
>   感兴趣的可以看下面这篇博文，里面有更详细的介绍：
>
>   -   https://www.crunchydata.com/blog/learn-postgres-at-the-playground

<br/>

同时，正如 CrunchyData 在 Github Organization 中介绍的那样，他们提供了在 k8s 中部署高可用 Postgres 集群的解决方案；

可以直接跟这下面的这个官方文档直接安装：

-   https://access.crunchydata.com/documentation/postgres-operator/5.2.0/quickstart/

>   **反正我是一次性就装好了的，issue-free～ 很赞！**

装好之后，数据库的账号、密码等配置，就在 `kubectl get secrets -n postgres-operator` 中了！

可以查看：

```bash
PG_CLUSTER_USER_SECRET_NAME=hippo-pguser-hippo

PGPASSWORD=$(kubectl get secrets -n postgres-operator "${PG_CLUSTER_USER_SECRET_NAME}" -o go-template='{{.data.password | base64decode}}') \
PGUSER=$(kubectl get secrets -n postgres-operator "${PG_CLUSTER_USER_SECRET_NAME}" -o go-template='{{.data.user | base64decode}}') \
PGDATABASE=$(kubectl get secrets -n postgres-operator "${PG_CLUSTER_USER_SECRET_NAME}" -o go-template='{{.data.dbname | base64decode}}')

$ echo ${PGUSER} ${PGPASSWORD}
hippo xxxxxxxx
```

对于远程访问，可以采用 Port-Forward 的方式：

```bash
PG_CLUSTER_PRIMARY_POD=$(kubectl get pod -n postgres-operator -o name \
  -l postgres-operator.crunchydata.com/cluster=hippo,postgres-operator.crunchydata.com/role=master)
kubectl -n postgres-operator port-forward "${PG_CLUSTER_PRIMARY_POD}" 25432:5432
```

然后通过上面的账号密码，连接服务器上的 25432 端口；

这一点官方文档写的也非常清楚了；

<br/>

# **后记**

可以在线实践的学习各种技术是一件非常爽的事情（相比于干巴巴的文章而言）；

例如：各种编程语言 Rust、Go 都自带了 PlayGround，k8s、ClickHouse 也有在线体验、教程；

并且随着 WASM 技术的发展，这种在线体验式的教程可能会越来越多！

最后，近期我也会跟着这个教程来对 Postgres 做一些总结，大家可以期待一下～

<br/>

# **附录**

社区地址：

-   https://github.com/CrunchyData

网站：

-   https://www.crunchydata.com/developers/tutorials


<br/>
