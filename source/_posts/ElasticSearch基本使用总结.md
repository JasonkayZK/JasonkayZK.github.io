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

ES的特性：速度快、易扩展、弹性、灵活、操作简单、多语言客户端、X-Pack、hadoop/spark强强联手、开箱即用；

-   分布式：横向扩展非常灵活；
-   全文检索：基于lucene的强大的全文检索能力；
-   近实时搜索和分析：数据进入ES，可达到近实时搜索，还可进行聚合分析；
-   高可用：容错机制，自动发现新的或失败的节点，重组和重新平衡数据；
-   模式自由：ES的动态mapping机制可以自动检测数据的结构和类型，创建索引并使数据可搜索；
-   RESTful API：JSON + HTTP；

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
| DELETE                 | DELETE  /index {}                              |

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

在 ES 中，**一个索引可以存储多个用于不同用途的对象，可以通过类型来区分索引中的不同对象，对应关系型数据库中表的概念；但是在ES 6.0开始，类型的概念被废弃，ES7中将它完全删除；**

删除type的原因：

我们一直认为 ES 中的 `index` 类似于关系型数据库的 `database`，而 `type` 相当于一个数据表；但是，ES的开发者们认为这是一个糟糕的认识；例如：

<red>**关系型数据库中两个数据表示是独立的，即使他们里面有相同名称的列也不影响使用，但ES中不是这样的：ES 中不同 type 下名称相同的 field 最终在 Lucene 中的处理方式是一样的！**</font>

<red>**举个例子：两个不同 type 下的两个 user_name，在 ES 同一个索引下其实被认为是同一个 field，你必须在两个不同的 type 中定义相同的field映射；否则，不同type中的相同字段名称就会在处理中出现冲突的情况，导致Lucene处理效率下降！**</font>

<red>**去掉 type 能够使数据存储在独立的 index 中，这样即使有相同的字段名称也不会出现冲突，就像ElasticSearch出现的第一句话一样“你知道的，为了搜索····”，去掉type就是为了提高ES处理数据的效率；**</font>

<red>**除此之外，在同一个索引的不同 type 下存储字段数不一样的实体会导致存储中出现稀疏数据，影响Lucene压缩文档的能力，导致ES查询效率的降低；**</font>

<br/>

### **文档（document）**

**存储在ES中的主要实体被称为：文档，可以理解为关系型数据库中表的一行数据记录，每个文档由多个字段（field）组成；**

<red>**区别于关系型数据库的是，ES是一个非结构化的数据库，每个文档可以有不同的字段，并且有一个唯一标识；**</font>

<br/>

### **映射（mapping）**

**mapping是对索引库中的索引字段及其数据类型进行定义，类似于关系型数据库中的表结构；**

<red>**ES默认动态创建索引和索引类型的mapping，这有点类似于 MongoDB，无需定义表结构，更不用指定字段的数据类型，表的结构是动态的非常灵活（当然也可以手动指定mapping类型）；**</font>

<br/>

### **分片（shard）**

如果我们的索引数据量很大，超过硬件存放单个文件的限制，就会影响查询请求的速度；

ES 引入了分片技术：一个分片本身是一个最小的工作单元，承载**部分数据**，文档存储在分片中，而分片会被分配到集群中的各个节点中，随着集群的扩大和缩小，ES会自动的将分片在节点之间进行迁移，以保证集群能保持一种平衡；

分片有以下特点：

-   一个索引可以包含多个分片（shard）；
-   每一个分片（shard）都是一个最小的工作单元，承载**部分数据**；
-   **每个shard都是一个lucene实例，有完整的简历索引和处理请求的能力；**
-   **增减节点时，shard会自动在nodes中负载均衡；**
-   **一个文档只能完整的存放在一个shard上；**
-   <red>**一个索引中含有shard的数量，默认值为5，在索引创建后这个值是不能被更改的；**</font>

优点：

-   **水平分割和扩展我们存放的内容索引；**
-   **分发和并行跨碎片操作提高性能/吞吐量；**

每一个shard关联的副本分片（replica shard）的数量，默认值为1，这个设置在任何时候都可以修改；

<br/>

### **副本（replica）**

副本（replica shard）就是shard的冗余备份，它的主要作用：

-   冗余备份，防止数据丢失；
-   shard异常时负责容错和负载均衡；

<br/>

### **一些其他问题**

#### **analyzer和search_analyzer的区别**

**分析器主要有两种情况会被使用：**

-   <red>**第一种是插入文档时，将text类型的字段做分词然后插入倒排索引；**</font>
-   <red>**第二种就是在查询时，先对要查询的text类型的输入做分词，再去倒排索引搜索；**</font>

<red>**如果想要让 索引 和 查询 时使用不同的分词器，ElasticSearch也是能支持的，只需要在字段上加 search_analyzer参数；**</font>

<red>**在索引时，只会去看字段有没有定义analyzer，有定义的话就用定义的，没定义就用ES预设的；**</font>

<red>**在查询时，会先去看字段有没有定义search_analyzer，如果没有定义，就去看有没有analyzer，再没有定义，才会去使用ES预设的；**</font>

<br/>

#### **es number_of_shards和number_of_replicas的区别**

`number_of_replicas` 是**数据备份数**，如果只有一台机器，可以设置为 0；

`number_of_shards` 是**数据分片数**，默认为 5；

<br/>

## **ES的基本操作**

在 ES 中的所有操作都是可以使用 Restful 风格的请求来操作；

例如：

```bash
curl -u username:passwd -XPUT -H "Content-Type: application/json" "http://127.0.0.1:9200/abc" -d "{}"
```

同时，在 Kibana 中也提供了相关工具：DevTools；

在 Kibana 中可以直接简化上面的操作：

```
PUT /abc {}
```

下面的操作都会在 Kibana 中操作，相信你也能轻松的转为 curl 命令的风格；

<br/>

### **索引（表）操作**

#### **建索引（表）**

ES 的表结构是非常灵活的，最简单的建表语句可以是下面这样的：

```
PUT /abc
```

调用之后返回：

```json
{
  "acknowledged" : true,
  "shards_acknowledged" : true,
  "index" : "abc"
}
```

即表示建表完成！

当然，建表语句也可以非常复杂；

例如，下面是一个保存文章的索引：

```json
PUT /passage
{
  "settings": {
    "index": {
      "analysis": {
        "analyzer": {
          "title_analyzer": {
            "type": "custom",
            "use_smart": "false",
            "tokenizer": "ik_max_word",
            "filter": [
              "jt_tfr",
              "lowercase"
            ]
          },
          "content_analyzer": {
            "type": "custom",
            "use_smart": "true",
            "tokenizer": "ik_smart",
            "filter": [
              "jt_tfr",
              "lowercase"
            ]
          }
        },
        "filter": {
          "jt_tfr": {
            "type": "stop",
            "stopwords": [
              " ",
              "！",
              "，",
              "：",
              "；"
            ]
          }
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title": {
        "analyzer": "title_analyzer",
        "type": "text"
      },
      "content": {
        "analyzer": "content_analyzer",
        "type": "text"
      }
    }
  }
}
```

索引包括了：

-   三个映射：title、content；
-   两个分析器：title_analyzer、content_analyzer；
-   一个过滤器：jt_tfr；

<br/>

#### **删索引**

删除索引也是非常简单，由于 Restful 风格良好的表达，我们只需要将 `PUT` 改为 `DELETE` 即可！

```
DELETE /abc
```

返回如下：

```json
{
  "acknowledged" : true
}
```

<br/>

#### **修改索引**

修改索引在之前的文章中写过了：

-   [ES修改索引结构](/2022/06/22/ES修改索引结构/)

具体步骤如下：

-   新建索引；
-   复制数据（reindex）；
-   确认数据；
-   删除旧别名；
-   删除旧索引；
-   创建别名（aliases）；

<br/>

### **文档操作**

文档操作主要包括了  Index、Create、Read、Update、Delete 这五种操作；

总结如下表所示：

| 操作   | 实例                                                         |
| ------ | ------------------------------------------------------------ |
| Index  | `PUT my_index/_doc/1 {}`                                     |
| Create | `PUT my_index/_create/1 {}`<br />`POST my_index/_doc {}` 不指定Id，自动生成； |
| Read   | `GET my_index/_doc/1`                                        |
| Update | `POST my_index/_update/1 {"doc": {...}}`                     |
| Delete | `DELETE my_index/_doc/1`                                     |

请求首先都是提供一个 HTTP 的 method，后面是索引名字，在 7.0 之后所以的 Type 都用 `_doc` 表示，后面是文档 id；

下面分别来看；

#### **新增文档**

Create 支持两种方式：

-   **指定文档Id创建文档；**
-   **自动生成文档Id；**

>   **自己指定文档 id创建文档，需要考虑 id 的均衡性，避免产生分配不均衡的问题；**
>
>   **ES 的 hash 函数会确保文档 id 被均匀分配到不同的分片；**

下面指定Id新增了一个文档：

```json
PUT /passage/_doc/1
{
  "title": "测试",
  "content": "这是一个测试内容"
}
```

返回响应：

```json
{
  "_index" : "passage",
  "_type" : "_doc",
  "_id" : "1",
  "_version" : 1,
  "result" : "created",
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 0,
  "_primary_term" : 1
}
```

其中 `_version` 每一次操作，都会 + 1，它是一个锁的机制，当并行修改文档的时候，更新的版本号比文档当前的版本号小时就会报错，不允许做修改；

也可以用下面的方式创建文档：

```json
PUT /passage/_create/2
{
  "title": "测试2",
  "content": "这是一个测试内容2",
  "comment": "这是一个评论2"
}
```

效果是一样的；

<red>**需要注意的是：这里的 `comment` 字段在我们创建索引的时候是不存在的！**</font>

<red>**在ES创建文档时，如果索引中不存在，ES 会自动创建对应的 index 和 type！**</font>

也可以用不指定 id 创建文档的方式：

```json
POST /passage/_doc 
{
  "title": "自动创建Id的测试",
  "content": "这是一个自动创建Id的测试内容"
}
```

响应：

```json
{
  "_index" : "passage",
  "_type" : "_doc",
  "_id" : "4cyVqYEBPqU3ER3DXk4l",
  "_version" : 1,
  "result" : "created",
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 4,
  "_primary_term" : 1
}
```

Index操作相比 Create，区别在于：

<red>**如果文档不存在，就索引新的文档，否则现有文档就会被删除，新的文档被索引，版本信息 `_version` + 1；**</font>

<br/>

#### **查询文档**

Get 方法比较简单：只需要 `Get 索引名称/_doc/文档 id`，就可以知道文档的具体信息了；

例如：

```
GET /passage/_doc/2
```

返回结果如下：

```json
{
  "_index" : "passage",
  "_type" : "_doc",
  "_id" : "2",
  "_version" : 3,
  "_seq_no" : 3,
  "_primary_term" : 1,
  "found" : true,
  "_source" : {
    "title" : "测试2",
    "content" : "这是一个测试内容2",
    "comment" : "这是一个评论2"
  }
}
```

其中 `_index` 为索引，`_type` 为类型，`_id` 为文档 id，`_version` 为版本信息，`_source` 存储了文档的完整原始数据；

当查询的文档 id 不存在时，会返回 HTTP 404，且 `found` 为 `false`，具体如下：

```
GET /passage/_doc/3
```

返回结果如下：

```json
{
  "_index" : "passage",
  "_type" : "_doc",
  "_id" : "3",
  "found" : false
}
```

<br/>

#### **更新文档**

Update 方法采用 HTTP POST，在请求体中必须指明 doc，在把具体文档提供在 HTTP 的 body 里；

并且，<red>**Update 和 Index 方法不同，Update 方法不会删除原来的文档，而是实现真正的数据更新！**</font>

比如在原来的文档 Id 为 1 的文档上增加字段，具体请求如下：

```json
POST /passage/_update/1
{
  "doc": {
    "title": "测试",
    "content": "这是一个测试内容",
    "comment": "这是一个评论"
  }
}
```

结果如下：

```json
{
  "_index" : "passage",
  "_type" : "_doc",
  "_id" : "1",
  "_version" : 2,
  "result" : "updated",
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 5,
  "_primary_term" : 1
}

```

执行后，版本信息 `_version` + 1；

再去查询下该文档：

```json
{
  "_index" : "passage",
  "_type" : "_doc",
  "_id" : "1",
  "_version" : 2,
  "_seq_no" : 5,
  "_primary_term" : 1,
  "found" : true,
  "_source" : {
    "title" : "测试",
    "content" : "这是一个测试内容",
    "comment" : "这是一个评论"
  }
}
```

可以看到，新增字段已经成功了；

<br/>

#### **删除文档**

DELETE 方法也很简单，`DELETE 索引名称/_doc/文档id` 就可以了：

```json
DELETE /passage/_doc/1
```

返回值如下：

```json
{
  "_index" : "passage",
  "_type" : "_doc",
  "_id" : "1",
  "_version" : 3,
  "result" : "deleted",
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 6,
  "_primary_term" : 1
}
```

<br/>

### **Bulk API**

在一个 REST 请求中，重新建立网络连接是十分损耗性能的，因此 ES 提供 Bulk API，支持在一次 API 调用中，对不同的索引进行操作，从而减少网络传输开销，提升写入速率；

ES 支持 `Index`、`Create`、`Update`、`Delete` 四种类型操作，可以在 URI 中指定索引，也可以在请求的方法体中进行；

同时多条操作中：<red>**如果其中有一条失败，也不会影响其他的操作，并且返回的结果包括每一条操作执行的结果；**</font>

比如下面的请求：

```json
POST /_bulk
{"index":{"_index":"passage","_id":"2"}}
{"comment":"bulk api"}
{"delete":{"_index":"passage","_id":"1"}}
{"update":{"_index":"passage","_id":"2"}}
{"doc":{"title":"bulk"}}
```

执行命令后，结果如下：

```json
{
  "took" : 4,
  "errors" : false,
  "items" : [
    {
      "index" : {
        "_index" : "passage",
        "_type" : "_doc",
        "_id" : "2",
        "_version" : 6,
        "result" : "updated",
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 10,
        "_primary_term" : 1,
        "status" : 200
      }
    },
    {
      "delete" : {
        "_index" : "passage",
        "_type" : "_doc",
        "_id" : "1",
        "_version" : 2,
        "result" : "deleted",
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 11,
        "_primary_term" : 1,
        "status" : 200
      }
    },
    {
      "update" : {
        "_index" : "passage",
        "_type" : "_doc",
        "_id" : "2",
        "_version" : 7,
        "result" : "updated",
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 12,
        "_primary_term" : 1,
        "status" : 200
      }
    }
  ]
}
```

`took` 表示消耗了 4 毫秒，`errors` 为 `false` 说明没问题；

如果，`errors` 为 `true` 则表示在这些操作中错误发生；

在使用 Bulk API 的时候，**当 `errors` 为 `true` 时，需要把错误的操作修改掉，防止存到 ES 的数据有缺失；**

<br/>

### **批量查询文档**

**批量查询需要指明要查询文档的 id**，可以在一个 `_mget` 操作里查询不同索引的数据，可以减少网络连接所产生的开销，提高性能；

下面我们来实际操作下，执行下面的命令就可以得到文档 Id 为 1、3 的数据：

```json
GET /_mget
{
  "docs": [
    {
      "_index": "passage",
      "_id": "1"
    },
    {
      "_index": "passage",
      "_id": "3"
    }
  ]
}
```

返回结果：

```json
{
  "docs" : [
    {
      "_index" : "passage",
      "_type" : "_doc",
      "_id" : "1",
      "_version" : 1,
      "_seq_no" : 13,
      "_primary_term" : 1,
      "found" : true,
      "_source" : {
        "title" : "测试",
        "content" : "这是一个测试内容"
      }
    },
    {
      "_index" : "passage",
      "_type" : "_doc",
      "_id" : "3",
      "_version" : 1,
      "_seq_no" : 15,
      "_primary_term" : 1,
      "found" : true,
      "_source" : {
        "title" : "测试3",
        "content" : "这是一个测试内容3",
        "comment" : "这是一个评论3"
      }
    }
  ]
}
```

批量操作虽然可以提高 API 调用性能，但是不要一次发送过多数据，否则会对 ES 集群产生过大的压力，导致性能有所下降；

一般建议 1000-5000 个文档，如果你的文档很大，可以适当减少队列，大小建议是 5-15 MB，默认不能超过 100 M；

<br/>

## **（多）条件查询**

在上面的查询中，主要都是直接通过 Id 进行查询；

这种方式在实际使用时其实并不常见，更多的是配合各种各样的条件进行匹配查询；

下面我们详细来看；

<br/>

### **分数（score）**

ES的搜索结果是按照相关分数的高低进行排序的，咦？！ 怎么没说搜索先说搜索结果的排序了？咱们这里先把这个概念提出来，因为在搜索的过程中，会计算这个分数。这个分数代表了这条记录匹配搜索内容的相关程度。分数是一个浮点型的数字，对应的是搜索结果中的`_score`字段，分数越高代表匹配度越高，排序越靠前。

在ES的搜索当中，分为两种，一种计算分数，而另外一种是不计算分数的；

**查询（query context）**

查询，代表的是这条记录与搜索内容匹配的怎么样，除了决定这条记录是否匹配外，还要计算这条记录的相关分数。这个和咱们平时的查询是一样的，比如我们搜索一个关键词，分词以后匹配到相关的记录，这些相关的记录都是查询的结果，那这些结果谁排名靠前，谁排名靠后呢？这个就要看匹配的程度，也就是计算的分数。

<br/>

**过滤（filter context）**

过滤，代表的含义非常的简单，就是YES or NO，这条记录是否匹配查询条件，**它不会计算分数**。频繁使用的过滤还会被ES加入到缓存，以提升ES的性能。下面我们看一个查询和过滤的例子，这个也是ES官网中的例子。



























<br/>

## **一些高级特性**

### **配置分词查询**











<br/>

### **配置同义词**







<br/>

### **增加Stopwords**







<br/>

### **配置大小写不敏感**

如果要实现大小写的模糊查询，则首先必须要自定义 `analysis`；

在自定义的 `analysis` 里面：

-   如果是针对 keyword 类型的字段， analysis 要定义成 normalizer；
-   对于text类型，则需要为analyzer；

如下演示的是`normalizer`类型的定义：







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
-   https://cloud.tencent.com/developer/article/1597951
-   https://www.jianshu.com/p/f668d847f18d
-   [es number_of_shards和number_of_replicas](https://www.cnblogs.com/mikeluwen/p/8031813.html)
-   https://somersames.xyz/2020/03/20/ES7%E4%B8%AD%E5%A4%A7%E5%B0%8F%E5%86%99%E4%B8%8D%E6%95%8F%E6%84%9F%E7%9A%84%E6%A8%A1%E7%B3%8A%E5%8C%B9%E9%85%8D/


<br/>
