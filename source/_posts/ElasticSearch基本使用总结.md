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

源代码：

-   https://github.com/JasonkayZK/docker-repo/tree/elk-v7.14-single

下面来看看ES的具体用法；

<br/>

## **基本概念**

Elasticsearch概述：

ES 是一个基于 Lucene 的搜索服务器，它提供了一个分布式多用户能力的搜索引擎，且ES支持 Restful Web风格的url访问；ES是基于Java开发的开源搜索引擎，设计用于云计算；此外，ES还提供了数据聚合分析功能，但在数据分析方面，ES 的时效性不是很理想，在企业应用中一般还是用于搜索；ES自2016年起已经超过Solr等，称为排名第一的搜索引擎应用；

ElasticSearch 中有几个基本概念：

-   索引(index)；
-   类型(type)；
-   文档(document)；
-   映射(mapping)等；

我们将这几个概念与传统的关系型数据库中的库、表、行、列等概念进行对比，如下表：

| **RDBMS**              | **ES**                                         |
| ---------------------- | ---------------------------------------------- |
| **数据库（Database）** | **索引（Index）**                              |
| 表（table）            | 类型（type）（ES6.0之后被废弃，es7中完全删除） |
| 表结构（schema）       | 映射（mapping）                                |
| 行（row）              | 文档（document）                               |
| 列（column）           | 字段（field）                                  |
| 索引                   | 反向索引                                       |
| SQL                    | 查询DSL                                        |
| SELECT * FROM table    | GET /index/_search {}                          |
| UPDATE table SET       | PUT  /index {}                                 |
| DELETE                 | DELETE  /index                                 |

**这里需要特别注意的是：**

**和 RDBMS 中的索引概念不同，ES 中的索引跟类似于 Table 的概念，即：**

**在 ES 中文档是“挂”在索引上面的；**

下面分别来看这些概念；

<br/>

### **索引（index）**

索引是ES的**逻辑存储**，对应关系型数据库中的库，ES可以把索引数据存放到服务器中，也可以分片（Sharding）后存储到多台服务器上；

每个索引可以有一个或多个分片，每个分片可以有多个副本；

<br/>

### **类型（type）**

ES中，一个索引可以存储多个用于不同用途的对象，可以通过类型来区分索引中的不同对象，对应关系型数据库中表的概念。但是在ES6.0开始，类型的概念被废弃，ES7中将它完全删除。删除type的原因：

我们一直认为ES中的“index”类似于关系型数据库的“database”，而“type”相当于一个数据表。ES的开发者们认为这是一个糟糕的认识。例如：关系型数据库中两个数据表示是独立的，即使他们里面有相同名称的列也不影响使用，但ES中不是这样的。

我们都知道elasticsearch是基于Lucene开发的搜索引擎，而ES中不同type下名称相同的filed最终在Lucene中的处理方式是一样的。举个例子，两个不同type下的两个user_name，在ES同一个索引下其实被认为是同一个filed，你必须在两个不同的type中定义相同的filed映射。否则，不同type中的相同字段名称就会在处理中出现冲突的情况，导致Lucene处理效率下降。

去掉type能够使数据存储在独立的index中，这样即使有相同的字段名称也不会出现冲突，就像ElasticSearch出现的第一句话一样“你知道的，为了搜索····”，去掉type就是为了提高ES处理数据的效率。

除此之外，在同一个索引的不同type下存储字段数不一样的实体会导致存储中出现稀疏数据，影响Lucene压缩文档的能力，导致ES查询效率的降低；

<br/>

### **文档（document）**

存储在ES中的主要实体叫文档，可以理解为关系型数据库中表的一行数据记录。每个文档由多个字段（field）组成。区别于关系型数据库的是，ES是一个非结构化的数据库，每个文档可以有不同的字段，并且有一个唯一标识；

<br/>

### **映射（mapping）**

mapping是对索引库中的索引字段及其数据类型进行定义，类似于关系型数据库中的表结构。ES默认动态创建索引和索引类型的mapping，这就像是关系型数据中的，无需定义表机构，更不用指定字段的数据类型。当然也可以手动指定mapping类型；

<br/>

### **分片（shard）**

如果我们的索引数据量很大，超过硬件存放单个文件的限制，就会影响查询请求的速度，Es引入了分片技术。一个分片本身就是一个完成的搜索引擎，文档存储在分片中，而分片会被分配到集群中的各个节点中，随着集群的扩大和缩小，ES会自动的将分片在节点之间进行迁移，以保证集群能保持一种平衡。

分片有以下特点：

ES的一个索引可以包含多个分片（shard）；
每一个分片（shard）都是一个最小的工作单元，承载部分数据；
每个shard都是一个lucene实例，有完整的简历索引和处理请求的能力；
增减节点时，shard会自动在nodes中负载均衡；
一个文档只能完整的存放在一个shard上
一个索引中含有shard的数量，默认值为5，在索引创建后这个值是不能被更改的。
优点：水平分割和扩展我们存放的内容索引；分发和并行跨碎片操作提高性能/吞吐量；
每一个shard关联的副本分片（replica shard）的数量，默认值为1，这个设置在任何时候都可以修改。

<br/>

### **副本（replica）**

副本（replica shard）就是shard的冗余备份，它的主要作用：

冗余备份，防止数据丢失；
shard异常时负责容错和负载均衡；
ES的特性：
速度快、易扩展、弹性、灵活、操作简单、多语言客户端、X-Pack、hadoop/spark强强联手、开箱即用。

分布式：横向扩展非常灵活
全文检索：基于lucene的强大的全文检索能力；
近实时搜索和分析：数据进入ES，可达到近实时搜索，还可进行聚合分析
高可用：容错机制，自动发现新的或失败的节点，重组和重新平衡数据
模式自由：ES的动态mapping机制可以自动检测数据的结构和类型，创建索引并使数据可搜索。

RESTful API：JSON + HTTP

<br/>

### **一些其他问题**

#### **analyzer和search_analyzer的区别**



分析器主要有两种情况会被使用：
第一种是插入文档时，将text类型的字段做分词然后插入倒排索引，
第二种就是在查询时，先对要查询的text类型的输入做分词，再去倒排索引搜索

如果想要让 索引 和 查询 时使用不同的分词器，ElasticSearch也是能支持的，只需要在字段上加上search_analyzer参数

在索引时，只会去看字段有没有定义analyzer，有定义的话就用定义的，没定义就用ES预设的

在查询时，会先去看字段有没有定义search_analyzer，如果没有定义，就去看有没有analyzer，再没有定义，才会去使用ES预设的

<br/>

#### **es number_of_shards和number_of_replicas的区别**

number_of_replicas 是数据备份数，如果只有一台机器，设置为0

number_of_shards 是数据分片数，默认为5，有时候设置为3

可以在线改所有配置的参数，number_of_shards不可以在线改

```bash
curl -XPUT '10.0.120.39:9200/_settings' -d ' { "index" : { "number_of_replicas" : 0 } }'
```

如果要所有的配置都生效，修改配置文件：

```bash
index.number_of_shards: 3
index.number_of_replicas: 0
```

如果每次生成索引的时候没生效，就要注意是否有索引模板了，索引模板生成的时候已经制定了参数

上面命令在elasticsearch 6.x 用不了了，修改如下：

```bash
curl -X PUT "10.10.10.10:9200/filebeat*/_settings" -H 'Content-Type: application/json' -d'
{
    "index" : {
        "number_of_replicas" : 0
    }
}
'
```

 要对后面新的index有效，要创建一个默认模板（模板很重要，模板可以为所欲为）：

```bash
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

# **附录**

相关文章：

-   [tags/ElasticSearch](/tags/ElasticSearch/)

源代码：

-   https://github.com/JasonkayZK/docker-repo/tree/elk-v7.14-single
-   https://github.com/medcl/elasticsearch-analysis-ik

参考文章：

-   https://blog.51cto.com/u_14286115/3328651
-   https://www.jianshu.com/p/438018379339
-   [es number_of_shards和number_of_replicas](https://www.cnblogs.com/mikeluwen/p/8031813.html)


<br/>
