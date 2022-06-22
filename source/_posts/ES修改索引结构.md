---
title: ES修改索引结构
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?44'
date: 2022-06-22 13:23:04
categories: [ElasticSearch]
tags: [ElasticSearch]
description: 在使用ES时有时候我们需要修改索引信息，本文总结了如何修改索引信息；
---

在使用ES时有时候我们需要修改索引信息；

本文总结了如何修改索引信息；

<br/>

<!--more-->

# **ES修改索引结构**

在 ElasticSearch 中索引就类似于关系型数据库中 Table 的概念；

如果要修改索引的一些关键信息时，要重建索引；

具体步骤如下：

-   新建索引；
-   复制数据（reindex）；
-   确认数据；
-   删除旧别名；
-   删除旧索引；
-   创建别名（aliases）；

假设我们使用到的索引名称为 `test`，使用索引别名的方式来实现；

首先我们有 `test_v1` 索引，现在要重建索引到 `test_v2`；

这里提供一个脚本例子：

```bash
# 创建V2版本索引
curl -u <user>:<passwd> -XPUT -H "Content-Type: application/json" 'http://<ip>:9200/test_v2' -d '{"settings":{ ... }}'

# 复制数据（reindex）
curl -u <user>:<passwd> -XPOST -H "Content-Type: application/json" 'http://<ip>:9200/_reindex' -d '{"source":{"index":"test_v1"},"dest":{"index":"test_v2"}}'

# 查看V2版本索引下文档数量
curl -u <user>:<passwd> -XGET -H "Content-Type: application/json" 'http://<ip>:9200/_cat/count/test_v2?v' -d '{}'

# 删除V1版本到索引test的索引别名
curl -u <user>:<passwd> -XDELETE -H "Content-Type: application/json" 'http://<ip>:9200/test_v1/_aliases/test'

# 删除V1版本索引
curl -u <user>:<passwd> -XDELETE -H "Content-Type: application/json" 'http://<ip>:9200/test_v1'

# 创建V2版本索引到test索引
curl -u <user>:<passwd> -XPUT -H "Content-Type: application/json" 'http://<ip>:9200/test_v2/_aliases/test'
```

<br/>

# **附录**

参考文章：

-   https://www.jianshu.com/p/a63f7c8ac500
-   https://www.elastic.co/guide/cn/elasticsearch/guide/current/index-aliases.html
-   https://segmentfault.com/a/1190000022258926
-   https://www.cnblogs.com/chenhuabin/p/13800715.html
-   [Elasticsearch（3）：别名](https://www.cnblogs.com/chenhuabin/p/13800715.html)

<br/>
