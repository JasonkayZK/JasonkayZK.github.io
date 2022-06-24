---
title: ElasticSearch基本使用总结
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?78'
date: 2022-06-14 13:36:52
categories: ElasticSearch
tags: [ElasticSearch]
description: 最近做的项目用到了ES，这里总结一下；
---

最近做的项目用到了ES，这里总结一下；

<br/>

<!--more-->

# **ElasticSearch基本使用总结**

## **部署ELK**

在进行ES操作之前，首先我们要先有一个ELK服务；

具体ELK的部署可以参考我之前的文章：

-   [使用Docker-Compose部署单节点ELK](/2021/05/15/使用Docker-Compose部署单节点ELK/)

下面来看看ES的具体用法；

<br/>

## **基本概念**

### **建表（索引）**











<br/>

### **增删改查**









<br/>

## **一些高级特性**

### **配置分词查询**





<br/>

### **配置同义词**







<br/>

### **增加Stopwords**







<br/>

### **配置大小写不敏感**









<br/>

### **计算匹配分数**







<br/>

## **一些其他问题**

### **analyzer和search_analyzer的区别**



分析器主要有两种情况会被使用：
第一种是插入文档时，将text类型的字段做分词然后插入倒排索引，
第二种就是在查询时，先对要查询的text类型的输入做分词，再去倒排索引搜索

如果想要让 索引 和 查询 时使用不同的分词器，ElasticSearch也是能支持的，只需要在字段上加上search_analyzer参数

在索引时，只会去看字段有没有定义analyzer，有定义的话就用定义的，没定义就用ES预设的

在查询时，会先去看字段有没有定义search_analyzer，如果没有定义，就去看有没有analyzer，再没有定义，才会去使用ES预设的

<br/>

### **es number_of_shards和number_of_replicas的区别**

number_of_replicas 是数据备份数，如果只有一台机器，设置为0

number_of_shards 是数据分片数，默认为5，有时候设置为3

可以在线改所有配置的参数，number_of_shards不可以在线改

```
curl -XPUT '10.0.120.39:9200/_settings' -d ' { "index" : { "number_of_replicas" : 0 } }'
```

如果要所有的配置都生效，修改配置文件：

```
index.number_of_shards: 3
index.number_of_replicas: 0
```

如果每次生成索引的时候没生效，就要注意是否有索引模板了，索引模板生成的时候已经制定了参数

上面命令在elasticsearch 6.x 用不了了，修改如下：

```
curl -X PUT "10.10.10.10:9200/filebeat*/_settings" -H 'Content-Type: application/json' -d'
{
    "index" : {
        "number_of_replicas" : 0
    }
}
'
```

 要对后面新的index有效，要创建一个默认模板（模板很重要，模板可以为所欲为）：

```
curl -X PUT "10.10.10.10:9200/_template/template_log" -H 'Content-Type: application/json' -d'
{
    "index_patterns" : ["filebeat*"],
    "order" : 0,
    "settings" : {
        "number_of_replicas" : 0
    }
}
'
```



<br/>

# **附录**

相关文章：

-   [tags/ElasticSearch](/tags/ElasticSearch/)

源代码：

-   https://github.com/JasonkayZK/docker-repo/tree/elk-v7.14-single
-   https://github.com/medcl/elasticsearch-analysis-ik

参考文章：

-   https://www.jianshu.com/p/438018379339
-   [es number_of_shards和number_of_replicas](https://www.cnblogs.com/mikeluwen/p/8031813.html)


<br/>
