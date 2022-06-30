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

<font color="#f00">**关系型数据库中两个数据表示是独立的，即使他们里面有相同名称的列也不影响使用，但ES中不是这样的：ES 中不同 type 下名称相同的 field 最终在 Lucene 中的处理方式是一样的！**</font>

<font color="#f00">**举个例子：两个不同 type 下的两个 user_name，在 ES 同一个索引下其实被认为是同一个 field，你必须在两个不同的 type 中定义相同的field映射；否则，不同type中的相同字段名称就会在处理中出现冲突的情况，导致Lucene处理效率下降！**</font>

<font color="#f00">**去掉 type 能够使数据存储在独立的 index 中，这样即使有相同的字段名称也不会出现冲突，就像ElasticSearch出现的第一句话一样“你知道的，为了搜索····”，去掉type就是为了提高ES处理数据的效率；**</font>

<font color="#f00">**除此之外，在同一个索引的不同 type 下存储字段数不一样的实体会导致存储中出现稀疏数据，影响Lucene压缩文档的能力，导致ES查询效率的降低；**</font>

<br/>

### **文档（document）**

**存储在ES中的主要实体被称为：文档，可以理解为关系型数据库中表的一行数据记录，每个文档由多个字段（field）组成；**

<font color="#f00">**区别于关系型数据库的是，ES是一个非结构化的数据库，每个文档可以有不同的字段，并且有一个唯一标识；**</font>

<br/>

### **映射（mapping）**

**mapping是对索引库中的索引字段及其数据类型进行定义，类似于关系型数据库中的表结构；**

<font color="#f00">**ES默认动态创建索引和索引类型的mapping，这有点类似于 MongoDB，无需定义表结构，更不用指定字段的数据类型，表的结构是动态的非常灵活（当然也可以手动指定mapping类型）；**</font>

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
-   <font color="#f00">**一个索引中含有shard的数量，默认值为5，在索引创建后这个值是不能被更改的；**</font>

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

-   <font color="#f00">**第一种是插入文档时，将text类型的字段做分词然后插入倒排索引；**</font>
-   <font color="#f00">**第二种就是在查询时，先对要查询的text类型的输入做分词，再去倒排索引搜索；**</font>

<font color="#f00">**如果想要让 索引 和 查询 时使用不同的分词器，ElasticSearch也是能支持的，只需要在字段上加 search_analyzer参数；**</font>

<font color="#f00">**在索引时，只会去看字段有没有定义analyzer，有定义的话就用定义的，没定义就用ES预设的；**</font>

<font color="#f00">**在查询时，会先去看字段有没有定义search_analyzer，如果没有定义，就去看有没有analyzer，再没有定义，才会去使用ES预设的；**</font>

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

<font color="#f00">**需要注意的是：这里的 `comment` 字段在我们创建索引的时候是不存在的！**</font>

<font color="#f00">**在ES创建文档时，如果索引中不存在，ES 会自动创建对应的 index 和 type！**</font>

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

<font color="#f00">**如果文档不存在，就索引新的文档，否则现有文档就会被删除，新的文档被索引，版本信息 `_version` + 1；**</font>

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

并且，<font color="#f00">**Update 和 Index 方法不同，Update 方法不会删除原来的文档，而是实现真正的数据更新！**</font>

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

同时多条操作中：<font color="#f00">**如果其中有一条失败，也不会影响其他的操作，并且返回的结果包括每一条操作执行的结果；**</font>

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

## **各种查询**

在上面的查询中，主要都是直接通过 Id 进行查询；

这种方式在实际使用时其实并不常见，更多的是配合各种各样的条件进行匹配查询；

下面我们详细来看；

<br/>

### **查询的类型**

ES 的搜索结果是按照相关分数的高低进行排序的，在搜索的过程中，会计算这个分数，这个分数代表了这条记录匹配搜索内容的相关程度；

分数是一个浮点型的数字，对应的是搜索结果中的`_score`字段，分数越高代表匹配度越高，排序越靠前；

在ES的搜索当中，分为两种：

-   查询：计算分数，代表这条记录与搜索内容匹配的程度，除了决定这条记录是否匹配外，还要计算这条记录的相关分数；
-   过滤：不计算分数，代表这条记录是否匹配查询条件；频繁使用的过滤还会被ES加入到缓存，以提升ES的性能；

>   **在某些不需要相关性算分的查询场景，尽量使用FilterContext优化查询性能；**

下面就是一个查询的例子：

```json
GET /_search
{
  "query": { 
    "bool": { 
      "must": [
        { "match": { "title":   "Search"        }},
        { "match": { "content": "Elasticsearch" }}
      ],
      "filter": [ 
        { "term":  { "status": "published" }},
        { "range": { "publish_date": { "gte": "2015-01-01" }}}
      ]
    }
  }
}
```

`/_search` 是请求的路径，请求的方法是`GET`，请求体中有一个`query`，代表查询的条件；

而 `bool` 中的：

-   `must` 被用作`query context`，它在查询的时候会计算记录匹配的相关分数；
-   `filter`中的条件用作过滤，只会把符合条件的记录检索出来，不会计算分数；

<br/>

### **复合查询（Compound queries）**

复合查询由其他复合查询或叶查询组合而成，以组合它们的结果和分数，改变它们的行为，或者从查询切换到过滤上下文；

复合查询包含了许多其他的查询，像我们前面提到的`query context`和`filter context`；

在复合查询中，分为很多种类型：

-   Boolean Query；
-   Boosting Query；
-   Const Query；
-   全文检索；
-   ……

下面我们分别来看；

#### **Boolean Query**

**布尔查询是最常用的组合查询，不仅将多个查询条件组合在一起，并且将查询的`结果`和结果的`评分`组合在一起，bool 相当于`MySQL中的一个括号()`；**

前面我们写的查询语句例子就是一个boolean查询，在 boolean 查询中有几个关键词：

| **关键词**                             | **描述**                                                     |
| :------------------------------------- | :----------------------------------------------------------- |
| <font color="#f00">**must**</font>     | <font color="#f00">**必须满足的条件，而且会计算分数；**</font> |
| <font color="#f00">**filter**</font>   | <font color="#f00">**必须满足的条件，不会计算分数；**</font> |
| <font color="#f00">**should**</font>   | <font color="#f00">**可以满足的条件，会计算分数；**</font>   |
| <font color="#f00">**must_not**</font> | <font color="#f00">**必须不满足的条件，不会计算分数；**</font> |

我们看看下面的查询语句：

```javascript
POST _search
{
  "query": {
    "bool" : {
      "must" : {
        "term" : { "user" : "kimchy" }
      },
      "filter": {
        "term" : { "tag" : "tech" }
      },
      "must_not" : {
        "range" : {
          "age" : { "gte" : 10, "lte" : 20 }
        }
      },
      "should" : [
        { "term" : { "tag" : "wow" } },
        { "term" : { "tag" : "elasticsearch" } }
      ],
      "minimum_should_match" : 1,
      "boost" : 1.0
    }
  }
}
```

上面的查询就是一个典型的boolean复合查询，里边的关键词都用上了；

这里再强调一下 `must`和`should`的区别：

-   `must`是必须满足的条件，上面的例子中`must`里只写了一个条件，如果是多个条件，那么里边的所有条件必须全部满足，才能被查出来；
-   而对于`should`，在例子中 `should` 列出了两个条件，并不是说这两个条件必须全部满足，到底需要满足几个条件可以看下面的关键字`minimum_should_match`（最小`should`匹配数，在这里设置的是1），也就是说，`should`里的条件只要满足1个，就算匹配成功；

>   <font color="#f00">**在boolean查询中，如果存在一个`should`条件，而没有`filter`和`must`条件，那么`minimum_should_match`的默认值是1，其他情况默认值是0；**</font>

<br/>

再来看一个实际的例子，之前我们创建了一个 `passage` 索引；

索引中存在着几条数据，数据如下：

| _index  | _id                  | title          | content                    | comment       |
| :------ | :------------------- | :------------- | :------------------------- | :------------ |
| passage | 1                    | 测试           | 这是一个测试内容           | 这是一个评论  |
| passage | 2                    | 测试2          | 这是一个测试内容2          | 这是一个评论2 |
| passage | wicds4EB0KdGOS9dT4Pr | 自动创建Id测试 | 这是一个自动创建Id测试内容 |               |

只有 3 条记录，我们新建一个查询语句，如下：

```javascript
POST /passage/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "title": "自动测试"
          }
        }
      ]
    }
  },
  "from": 0,
  "size": 1
}
```

我们查询的条件是 `title` 字段满足 `自动测试` ；

由于在创建索引时，我们使用了 ik 分词器：

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
            "stopwords": [...]
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

而查询条件 `自动测试` 会被分词为 `自动` 和 `测试` ，3个数据的 `title` 中都有 `测试` 字段，所以 3条数据都会被查询出来：

```json
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 0.86236954,
    "hits" : [
      {
        "_index" : "passage",
        "_type" : "_doc",
        "_id" : "wicds4EB0KdGOS9dT4Pr",
        "_score" : 0.86236954,
        "_source" : {
          "title" : "自动创建Id测试",
          "content" : "这是一个自动创建Id测试内容"
        }
      },
      {
        "_index" : "passage",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.17426977,
        "_source" : {
          "title" : "测试",
          "content" : "这是一个测试内容",
          "comment" : "这是一个评论"
        }
      },
      {
        "_index" : "passage",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.14181954,
        "_source" : {
          "title" : "测试2",
          "content" : "这是一个测试内容2",
          "comment" : "这是一个评论2"
        }
      }
    ]
  }
}
```

可以看到，数据全部被查询出来了，和我们的预期是一样的；

>   <font color="#f00">**text类型的查询都是基于分词后的词条查询的，例如"abcd"分词后"ab,cd"如果term查询"bc"就查不到；**</font>

<font color="#f00">**需要注意的是 `_score`字段：它们的分数是不一样的，我们的查询条件是 `自动测试`，所以既包含`自动`又包含`测试`的数据分数高，我们看到分数到了0.86，而另外2条数据只匹配了`测试`，所以分数只有0.17，0.14；**</font>

<br/>

#### **Boosting Query**

Boosting Query 可以为不喜欢的查询减分；

Boosting Query 有两个关键词：`positive`和`negative`；

-   `positive`：（必需，查询对象）查询语句，所有满足 `positive` 条件的数据都会被查询出来；
-   `negative`：（必需，查询对象）降低分数的匹配查询，**满足`negative`条件的数据并不会被过滤掉，而是会扣减分数；**使用字段`negative_boost` 表示扣减系数（在0~1之间）；如果满足了`negative`条件的数据，它们的分数会乘以这个系数；比如这个系数是 0.5，原来100分的数据如果满足了`negative`条件，它的分数会乘以0.5，变成50分；

```javascript
POST /passage/_search
{
  "query": {
    "boosting": {
      "positive": {
        "term": {
          "title": "测试"
        }
      },
      "negative": {
        "term": {
          "title": "自动"
        }
      },
      "negative_boost": 0.5
    }
  }
}
```

`positive` 条件是 `测试`，因此只要 `title` 中有 `测试` 的数据都会被查询出来；

而`negative`的条件是 `自动`，只要`title`中包含 `自动` 的数据都会被扣减分数；由 `"negative_boost": 0.5` 可知，它的得分将会变为 `原分数*0.5`；

执行后的结果：

```json
{
  "took" : 6,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 0.17426977,
    "hits" : [
      {
        "_index" : "passage",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.17426977,
        "_source" : {
          "title" : "测试",
          "content" : "这是一个测试内容",
          "comment" : "这是一个评论"
        }
      },
      {
        "_index" : "passage",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.14181954,
        "_source" : {
          "title" : "测试2",
          "content" : "这是一个测试内容2",
          "comment" : "这是一个评论2"
        }
      },
      {
        "_index" : "passage",
        "_type" : "_doc",
        "_id" : "wicds4EB0KdGOS9dT4Pr",
        "_score" : 0.05166793,
        "_source" : {
          "title" : "自动创建Id测试",
          "content" : "这是一个自动创建Id测试内容"
        }
      }
    ]
  }
}
```

可以看到由于最后一条数据中的`title`包含`自动`，它的得分会乘以0.5的系数，所以分数会比较低；

<br/>

#### **constant_score**

恒定分数查询；

在通常情况下，ES 中查询的分数是由 Lucene 计算出来的，我们也可以人为指定一个固定的分数；

例如：

```json
POST /passage/_search
{
  "query": {
    "constant_score": {
      "filter": {
        "term": {
          "title": "自动"
        }
      },
      "boost": 1.2
    }
  }
}
```

此时 `filter` 是必须的，并且其中的 `boost` 是匹配之后获得的分数；

执行后结果为：

```json
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 1.2,
    "hits" : [
      {
        "_index" : "passage",
        "_type" : "_doc",
        "_id" : "wicds4EB0KdGOS9dT4Pr",
        "_score" : 1.2,
        "_source" : {
          "title" : "自动创建Id测试",
          "content" : "这是一个自动创建Id测试内容"
        }
      }
    ]
  }
}
```

可以看到，得分为 1.2；

<br/>

#### **dis_max**

dis_max 查询只使用最佳匹配查询条件的分数：

-   `queries`：（必需，查询对象数组）包含一个或多个查询子句；返回的文档必须与这些查询中的一个或多个匹配；如果一个文档匹配多个查询，ES 使用`最高`的相关性分数；
-   `tie_breaker`：（可选，浮点数）0-1之间，默认0.0，用于增加的评分；

例如：

```json
GET /_search
{
  "query": {
    "dis_max": {
      "queries": [
        { "term": { "title": "测试" } },  # 查询字句，假设C1=1.3
        { "term": { "comment": "2" } }, # 查询字句，假设C2=1.8
        { "term": { "content": "这是一个" } } # 查询字句，假设C3=1.1
      ],
      "tie_breaker": 0.2
    }
  }
}
```

对于无 dis_max 时查询的评分，大致应该是`C1+C2+C3`的评分；

而有 dis_max 的评分大致计算：`C2+(C1+C3)*tie_breaker`；

上面的查询返回：

```json
{
  ......
  "hits" : {
    "total" : {
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 0.7003642,
    "hits" : [
      {
        "_index" : "passage",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.7003642,
        "_source" : {
          "title" : "测试2",
          "content" : "这是一个测试内容2",
          "comment" : "这是一个评论2"
        }
      },
      {
        "_index" : "passage",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.17426977,
        "_source" : {
          "title" : "测试",
          "content" : "这是一个测试内容",
          "comment" : "这是一个评论"
        }
      },
      {
        "_index" : "passage",
        "_type" : "_doc",
        "_id" : "wicds4EB0KdGOS9dT4Pr",
        "_score" : 0.10333586,
        "_source" : {
          "title" : "自动创建Id测试",
          "content" : "这是一个自动创建Id测试内容"
        }
      }
    ]
  }
}
```

<br/>

#### **打分函数（function_score）**

function_score 会在 `主查询query结束后` 对每一个匹配的文档进行一系列的 `重新打分` 操作，能够对多个字段一起进行综合评估，并且能够使用 filter 将结果划分为多个子集，并为每个子集使用不同的加强函数；

<font color="#f00">**需要注意的是：`不论我们怎么自定义打分，都不会改变原始query的匹配行为`，我们自定义打分，都是在原始 query 查询结束后，对每一个匹配的文档进行重新算分；**</font>

最终结果的 `_score`，即 `result_score` 的计算过程如下：

-   **跟原来一样执行`query`并且得到原始 `query_score`；**
-   **执行设置的自定义打分函数，并为每个文档得到一个新的分数，记为`func_score`；**
-   **最终结果的分数 `result_score` 等于 `query_score`与`func_score`按某种方式计算的结果（默认是相乘）；**

**最终的分数`result_score` 是由`query_score`与`func_score`进行计算而来，计算方式由参数`boost_mode`定义：**

-   multiply : 相乘（默认），`result_score = query_score * function_score`；
-   replace : 替换，`result_score = function_score`；
-   sum : 相加，`result_score = query_score + function_score`；
-   avg : 取两者的平均值，`result_score = Avg(query_score, function_score)`；
-   max : 取两者之中的最大值，`result_score = Max(query_score, function_score)`；
-   min : 取两者之中的最小值，`result_score = Min(query_score, function_score)`；

function_score 提供了以下几种打分的函数：

-   weight : 加权；
-   random_score : 随机打分，生成 [0, 1) 之间均匀分布的随机分数值；
-   field_value_factor : 使用字段的数值参与计算分数；
-   decay_function : 衰减函数 gauss, linear, exp 等；
-   script_score : 自定义脚本打分；

例如：

```json
GET /_search
{
  "query": {
    "function_score": { # 打分函数
      "query": { "match_all": {} }, # 原始query的匹配
      "boost": "5", # 用以提高整个查询权重
      "functions": [ # 当有多个打分函数时，需使用functions，当只有一个时，可省略
        { # 打分函数1：可以理解成，weight*随机数
          "weight": 23, # 加权值，默认值是1.0，也可以理解每个打分函数都有一个 weight: 1.0
          "filter": { "match": { "test": "bar" } }, # 通过 filter 去限制 weight 的作用范围
          "random_score": { # 随机打分，生成0-1之间的随机数，本示例中random_score在0-23之间
            "seed": 10,
            "field": "_seq_no"
          } 
        },
        { # 打分函数2
          "weight": 42 # 加权数
          "filter": { "match": { "test": "cat" } }, # 通过 filter 去限制 weight 的作用范围
        },
        { # 打分函数3：衰减函数，
          "weight": 1.0, #  默认加权 1.0倍
          "exp": { # exp指数函数算法
            "ctime": { # 时间衰减
              "origin": 1649582870, # 当前时间戳
              "scale": 4320000, # 50天内衰减
              "offset": 800, # 从多长时间后开始衰减
              "decay": 0.1 // 最低衰减值
            }
          }
        },
        { # 打分函数4：使用字段值计算，此方法可以理解成：1.0*log1p(1.2*doc['weight'].value)
          "weight": 1.0, #  默认加权 1.0倍
          "field_value_factor": { 
            "field": "weight", # 参与计算的字段
            "modifier": "log1p", # 计算函数，有十来个函数可以查看文档，示例中：log1p(1.2*doc['weight'].value)，其实和script_score计算差不多，只不过效率更高
            "factor": 1.2, # 函数的调节用的参数，factor>1会提升效果，factor<1会降低效果
            "missing": 1   # 若 weight 字段不存在，则默认为1
          }
        },
        { # 打分函数5：使用脚本来自定义
          "script_score": {
            "source": "params.a / Math.pow(params.b, doc['my-int'].value)",
            "params": {"a": 5,"b": 1.2},
          }
        }
      ],
      "score_mode": "avg", # 参数 score_mode 指定多个打分函数如何组合计算出新的分数，avg求平均
      "min_score": 2 # 为了排除掉一些分数太低的结果，我们可以通过 min_score 参数设置最小分数阈值
      "boost_mode": "multiply", # 就是把原始的 query_score 与新的 func_score 计算就得到了最终的 _score 分数
      "max_boost": 42, # 为了避免新的分数的数值过高，可以通过 max_boost 参数去设置上限
    }
  }
}
```

**注意：这里在重新打分时，如果都提供了 `weight` 这个参数，且 `score_mode=avg`，那么计算最终`func_score`时，应该是加权平均数；**

例如：打分函数1的weight=2，算出来的值是3，打分函数2的weight=5，算出来的值是2，加权平均数=`(2*3+5*2)/(2+5)`

>   相关文章：
>
>   -   [ES 自定义打分 Function score query](https://segmentfault.com/a/1190000037700644)
>   -   [Elasticsearch探索：相关性打分机制 API](https://cloud.tencent.com/developer/article/1764235)

<br/>

### **全文检索（Full-Text Queries）**

全文查询能够搜索分析器（analyzer）`分析过后的文本字段`，例如内容正文；使用在索引期间应用于字段的相同分析器处理查询字符串；

在前面的内容中提到：**只有字段的类型是 `text`的才会使用全文检索，并且全文检索会使用到分析器；**

在我们的 `passage` 索引中，`title`和`content`字段都是`text`类型；所以，这两个字段的搜索都会使用到ik中文分词器；

全文检索比起前面的复合检索要简单一点，下面我们分别来看；

对于下面的语句：

```javascript
GET /passage/_search
{
  "query": {
    "match": {
      "title": {
        "query": "测试"
      }
    }
  }
}
```

在请求体中，`match` 代替了之前的 `bool`，`match`是标准的全文索引的查询；

`match` 后面的字段是要查询的字段名，如果有多个字段，可以列举多个，`title`字段里的 `query` 就是要查询的内容；

此外，还可以在字段中指定分析器，使用 `analyzer` 关键字，如果不指定，默认就是索引的分析器；

执行上面的查询，结果如下：

```json
{
  ......
  "hits" : {
    "total" : {
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 0.17426977,
    "hits" : [
      {
        "_index" : "passage",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.17426977,
        "_source" : {
          "title" : "测试",
          "content" : "这是一个测试内容",
          "comment" : "这是一个评论"
        }
      },
      {
        "_index" : "passage",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.14181954,
        "_source" : {
          "title" : "测试2",
          "content" : "这是一个测试内容2",
          "comment" : "这是一个评论2"
        }
      },
      {
        "_index" : "passage",
        "_type" : "_doc",
        "_id" : "wicds4EB0KdGOS9dT4Pr",
        "_score" : 0.10333586,
        "_source" : {
          "title" : "自动创建Id测试",
          "content" : "这是一个自动创建Id测试内容"
        }
      }
    ]
  }
}
```

可以看到相应的数据已经检索出来了；

全文检索也包括了许多类型，下面我们一一来看；

<br/>

#### **match**

match查询是执行全文搜索的标准查询，包括了用于模糊匹配的选项；

下面是一个 match 查询的标准参数：

```json
GET /_search
{
  "query": {
    "match": { # match关键字
      "message": { # （必需，对象）要搜索的字段。
        "query": "this is a test", # 要查询的内容
        "analyzer":{...}, # （可选，字符串）分析器
        "operator":"", #（可选，字符串）用于解释query值中文本的布尔逻辑。有效值为：OR AND
        "fuzziness":"", #（可选，字符串）允许匹配的最大编辑距离。
        "max_expansions":50, # （可选，整数）查询将扩展到的最大术语数。默认为50
        "prefix_length":0, #（可选，整数）用于模糊匹配的起始字符数保持不变。默认为0
        "fuzzy_transpositions":0, #可选，布尔值）如果true，模糊匹配的编辑包括两个相邻字符的换位（ab → ba）默认为true
        "fuzzy_rewrite":"", #（可选，字符串）用于重写查询的方法。
        "lenient":false #（可选，布尔值）如果，则忽略true基于格式的错误
      }
    }
  }
}
```

<br/>

#### **intervals**

为了更加简单灵活的控制查询时字符串在文本中匹配的`距离`与`先后顺序`，ES 在 7.0 中引入了intervals query，用户可单一或者组合多个规则集合在某一个特定的`text field`上进行操作；

例如：

```json
GET /passage/_search
{
  "query": {
    "intervals" : { # intervals查询关键字
      "content" : { # （必需，规则对象）要搜索的text字段
        "all_of" : { # 匹配规则，有效规则包括：match、prefix、wildcard、fuzzy、all_of、any_of
          "ordered" : true, # all_of规则参数（可选，布尔值）如果true，规则产生的间隔应按指定的顺序出现，默认为false。
          "intervals" : [ # all_of规则参数（必需，规则对象数组）要组合的规则数组。
            { # 子规则1
              "match" : {
                "query" : "一个 测试",
                "max_gaps" : 0,
                "ordered" : true
              }
            },
            { # 子规则2
              "any_of" : {
                "intervals" : [
                  { "match" : { "query" : "2" } },
                  { "match" : { "query" : "自动" } }
                ]
              }
            }
          ]
        },
        "boost" : 2.0,
        "_name" : "passage_content"
      }
    }
  }
}
```

结果如下：

```json
{
  ......
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 0.6666666,
    "hits" : [
      {
        "_index" : "passage",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.6666666,
        "_source" : {
          "title" : "测试2",
          "content" : "这是一个测试内容2",
          "comment" : "这是一个评论2"
        },
        "matched_queries" : [
          "passage_content"
        ]
      }
    ]
  }
}
```

<br/>

#### **match_bool_prefix**

查询处理流程：

-   对查询的内容进行分词；
-   然后构造bool查询；
-   对每个分词(除了最后一个分词)使用term查询；
-   但对最后一个分词采用prefix查询；

例如：

```json
GET /_search
{
  "query": {
    "match_bool_prefix": { # 查询关键词
      "message": { # 查询字段
        "query": "quick brown f", # 被查询的词，被分为3个词quick、brown、f。其中quick与brown使用term查询，p使用prefix查询
        "analyzer": "keyword" # 指定分析器
      }
    }
  }
}
```

<br/>

#### **match_phrase**

match_phrase 可以查询分析文本，并从分析的文本中创建短语查询；

```json
GET /_search
{
  "query": {
    "match_phrase": {
      "message": {
        "query": "quick brown fox",
        "analyzer": "my_analyzer"
      }
    }
  }
}
```

在上面的例子中，对于匹配了短语"quick brown fox"的文档，下面的条件必须为true：

-   quick、brown和fox必须全部出现在某个字段中；
-   brown的位置必须比quick的位置大1；
-   fox的位置必须比quick的位置大2；

如果以上的任何一个条件没有被满足，那么文档就不能被匹配！

<br/>

#### **match_phrase_prefix**

match_phrase_prefix和match_phrase是相同的，除了它允许文本中最后一项使用前缀匹配；

```json
GET /_search
{
  "query": {
    "match_phrase_prefix": {
      "message": {
        "query": "quick brown f" # 注意，分词的最后一项f使用前缀匹配
        "max_expansions":50, # 这里可以理解前缀查询f需在多少个词内查询到
        "analyzer":ik  
      }
    }
  }
}
```

<br/>

#### **multi_match**

multi_match 查询提供了一个简便的方法用来对多个字段执行相同的查询；

```json
GET /_search
{
  "query": {
    "multi_match" : { # 关键字
      "query":      "brown fox", # 查询字符串，经分析器处理后
      "type":       "best_fields", # 处理类型
      "fields":     [ "subject", "message" ], # 待处理的字段列表
      "tie_breaker": 0.3 
    }
  }
}
```

<br/>

#### **combined_fields**

支持查询多个字段，比如文章的标题、正文、描述，也可以使用`^`字符提升某个字段的权重，同时也支持通配符；

```json
GET /_search
{
  "query": {
    "combined_fields" : {
      "query":      "database systems",
      "fields":     [ "title", "abstract", "body"],
      "operator":   "and"
    }
  }
}
```

<br/>

#### **query_string**

query_string是使用查询解析器来解析其内容的查询；

-   [官方查询字符串语法](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#query-string-syntax)

```json
GET /_search
{
    "query": {
        "query_string" : {
            "default_field" : "content", # 默认字符串
            "query" : "this AND that OR thus" # 查询语法
        }
    }
}
```

<br/>

#### **simple_query_string**

相比query_string，不支持 AND OR NOT，但会当作字符串处理，Term 之间默认的关系是 OR，可以指定 `Operator+`替代`AND`，`|`替代`OR`，`-`替代`NOT`；

<br/>

### **Geo(地理查询)**

Elasticsearch 支持两种类型的地理数据：

-   `geo_point`字段，支持纬度/经度；
-   `geo_shape`字段，支持点、线、圆、多边形、多多边形等；

主要包括下面几类：

-   geo_bounding_box(矩形内的点的文档)；
-   geo_distance(中心点指定距离内的文档)；
-   geo_polygon(多边形内的文档)；
-   geo_shape(相交、包含、不相交的形状)；

<br/>

### **Shape queries(形状查询)**

Elasticsearch 支持索引任意二维（非地理空间）几何的能力，这使得绘制虚拟世界、体育场馆、主题公园和 CAD 图表成为可能；

查询类型为 `shape`；

以下是可用空间关系运算符的完整列表：

-   INTERSECTS：（默认）返回shape字段与查询几何相交的所有文档；

-   DISJOINT：返回其shape字段与查询几何没有共同之处的所有文档；

-   WITHIN：返回其shape字段在查询几何范围内的所有文档；

-   CONTAINS：返回其shape字段包含查询几何的所有文档；

```json
GET /example/_search
{
  "query": {
    "shape": {
      "geometry": {
        "shape": {
          "type": "envelope",
          "coordinates": [
            [
              1355,
              5355
            ],
            [
              1400,
              5200
            ]
          ]
        },
        "relation": "within"
      }
    }
  }
}
```

<br/>

### **Joining queries(加入查询)**

在像 Elasticsearch 这样的分布式系统中执行完整的SQL风格的连接是非常昂贵的；相反，Elasticsearch 提供了两种形式的连接，旨在水平扩展；

-   nested(嵌套查询)；
-   has_child and has_parent(有子查询，有父查询)；

例如：

```json
# 定义nested
PUT /my-index-000001
{
  "mappings": {
    "properties": {
      "obj1": {
        "type": "nested" # 这里类型设置为nested
      }
    }
  }
}
# 使用nested查询
GET /my-index-000001/_search
{
  "query": {
    "nested": { # 查询关键字
      "path": "obj1",  # 您希望搜索路径嵌套对象
      "score_mode": "avg", # 设置内部children匹配影响parent文档。默认是avg，但是也可以设置为sum、min、max和none
      "query": { # 查询语法
        "bool": {
          "must": [
            { "match": { "obj1.name": "blue" } },
            { "range": { "obj1.count": { "gt": 5 } } }
          ]
        }
      }
    }
  }
}
```

<br/>

### **Match All/None(匹配所有)**

match_all(匹配所有文档)：

```json
GET /_search
{
  "query": {
    "match_all": { "boost" : 1.2 }
  }
}
```

match_none(不匹所有文档)：

```json
GET /_search
{
  "query": {
    "match_none": {}
  }
}
```

<br/>

### **Span queries(范围查询)**

-   span_containing；
-   span_field_masking；
-   span_first；
-   span_multi；
-   span_near；
-   span_not；
-   span_or；
-   span_term；
-   span_within；

<br/>

### **Specialized queries(专业查询)**

-   distance_feature；
-   more_like_this(相似度查询)；
-   percolate；
-   rank_feature；
-   script；
-   script_score；
-   wrapper；
-   pinned；

<br/>

### **Term-level queries(术语级查询)**

根据结构化数据中的`精确值`查找文档；

`结构化数据`指的是，例如：日期范围、IP 地址、价格或产品 ID等；

**与全文查询不同，词级查询不分析搜索词，相反，术语级别的查询与存储在字段中的确切术语相匹配；**

#### **exists**

exist表示：包含字段索引值的文档，可以理解成MySQL中的`is not null`

```json
# 查找指定字段存在的文档
GET /_search
{
  "query": {
    "exists": {
      "field": "user" # 必须，指定的字段，此字段必须包含值。不存在：null和[]，存在："","-",[null,"foo"]
    }
  }
}
```

<br/>

#### **fuzzy**

 fuzzy表示：包含与搜索词相似的词的文档；

```json
# 为了查找相似的术语，fuzzy查询会在指定的编辑距离内创建一组搜索术语的所有可能变体或扩展。然后查询返回每个扩展的精确匹配。
GET /_search
{
  "query": {
    "fuzzy": { 
      "user.id": { # 必须，要搜索的字段
        "value": "ki", # 必须，待搜索的值
        "fuzziness": "AUTO", # 允许匹配的最大编辑距离
        "max_expansions": 50, # 创建的最大变体数。默认为50
        "prefix_length": 0, # 创建扩展时保持不变的起始字符数。默认为0
        "transpositions": true, # 是否包括两个相邻字符的换位（ab → ba）。默认为true
        "rewrite": "constant_score" # 重写查询的方法。
      }
    }
  }
}
```

<br/>

#### **ids**

ids用于查_id值对应的文档；

```json
# 根据文档的 ID 返回文档。此查询使用存储在_id字段中的文档 ID
GET /_search
{
  "query": {
    "ids" : {
      "values" : ["1", "4", "100"] # 必需，字符串数组，文档_id数组
    }
  }
}
```

<br/>

#### **prefix**

prefix用于查前缀；

```json
# 包含特定前缀的文档
GET /_search
{
  "query": {
    "prefix": { 
      "user.id": { # 字段名
        "value": "ki" # 待搜索的值
      }
    }
  }
}
```

<br/>

#### **range**

range用于范围查询，可以理解为MySQL中的`between`；

```json
# 数字或时间范围匹配
GET /_search
{
  "query": {
    "range": { # 范围查询
      "age": { # 字段名
        "gte": 10, # 操作符 gt(>) gte(>=) lt(<) lte(<=)
        "lte": 20,
        "format": "yyyy/MM/dd", # 用于转换date查询中值的日期格式
        "time_zone": "", # 指定时区
        "boost": 2.0 # 增减查询参数
      }
    }
  }
}
```

<br/>

#### **regexp**

regexp表示正则表达式匹配；

```json
# 正则表达式
GET /_search
{
  "query": {
    "regexp": {
      "user.id": { # 要搜索的字段
        "value": "k.*y", # 正则表达式，要提高性能，请避免使用通配符模式，例如.*或 .*?+，而没有前缀或后缀
        "flags": "ALL", # 正则表达式启用可选运算符
        "case_insensitive": true, # 是否区分大小写的匹配
        "max_determinized_states": 10000,
        "rewrite": "constant_score" # 重写查询的方法
      }
    }
  }
}
```

<br/>

#### **term**

termy 用于精确匹配（除了text类型的字段)，可以理解成MySQL中的 `等于(=)`；

```json
# 精确查询
# 避免term对text字段使用查询
# 默认情况下，text作为analysis 的一部分，Elasticsearch 会更改字段的值。这会使查找text字段值的精确匹配变得困难。要搜索text字段值，请改用match查询。
GET /_search
{
  "query": {
    "term": {
      "user.id": { # 字段
        "value": "kimchy", # 值
        "boost": 1.0 # 权重
      }
    }
  }
}
```

<br/>

#### **terms**

terms 用于精确匹配多个；

```json
# 可以理解成MySQL中的in查询
# 同term查询，唯一不同的就是可以设置多个值
GET /_search
{
  "query": {
    "terms": { 
      "user.id": [ "kimchy", "elkbee" ], # 匹配多个值
      "boost": 1.0
    }
  }
}
```

<br/>

#### **terms_set**

terms_set 用于精确匹配多个，同时可定义最少匹配数；

```json
# 同terms查询，但可以定义最少匹配数
GET /job-candidates/_search
{
  "query": {
    "terms_set": {
      "programming_languages": {
        "terms": [ "c++", "java", "php" ],
        "minimum_should_match_field": "required_matches",
        "minimum_should_match_script": {
          "source": "Math.min(params.num_terms, doc['required_matches'].value)"
        },
        "boost": 1.0
      }
    }
  }
}
```

<br/>

#### **wildcard**

wildcard 表示通配符查询；

```json
GET /_search
{
  "query": {
    "wildcard": {
      "user.id": { # 字段
        "value": "ki*y", # 通配符的值
        "boost": 1.0, # 权重
        "rewrite": "constant_score" # 改变查询行为，专业人士使用，此参数的值会影响搜索性能和相关性
      }
    }
  }
}
```

<br/>

## **一些高级特性**

### **配置分词查询**

#### **安装分词插件**

对于中文查询而言，我们是没有类似于英文中的空格来拆分单词的，因此需要进行分词；

一个非常常用的中文分词分析器 ik：

-   https://github.com/medcl/elasticsearch-analysis-ik

并且，ES 提供了很好的插件工具：`elasticsearch-plugin`，可以一键安装，例如：

```bash
./bin/elasticsearch-plugin install https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v7.14.1/elasticsearch-analysis-ik-7.14.1.zip
```

<br/>

#### **补充知识：ik_max_word和ik_smart的区别**

IK分词器有两种分词模式：ik_max_word和ik_smart模式；

-   ik_max_word：会将文本做最细粒度的拆分，比如会将“中华人民共和国人民大会堂”拆分为“中华人民共和国、中华人民、中华、华人、人民共和国、人民、共和国、大会堂、大会、会堂等一系列词语；
-   ik_smart：会做最粗粒度的拆分，比如会将“中华人民共和国人民大会堂”拆分为中华人民共和国、人民大会堂；

<font color="#f00">**两种分词器使用的最佳实践是：索引时用ik_max_word，在搜索时用ik_smart；**</font>

<font color="#f00">**即：索引时最大化的将文章内容分词，搜索时更精确的搜索到想要的结果；**</font>

举个例子：

如果用户输入“苹果手机”，此时用户的想法是想搜索出“苹果手机”的商品，而不是苹果其它的商品，也就是商品信息中必须只有`苹果手机`这个词；

如果此时使用 ik_smart 和 ik_max_word 都会将苹果手机拆分为苹果和手机两个词，那些只包括“苹果”这个词的信息也被搜索出来了，而目标是搜索只包含`苹果手机`这个词的信息；

我们可以将`苹果手机`添加到自定义词库；

此后，因为`苹果手机`是一个词，所以ik_smart就不再细粒度分了；

因此，可以在索引时使用 ik_max_word，在搜索时用ik_smart；

<br/>

#### **分词索引配置**

在本文开头的例子，建立的 `passage` 索引就使用了这两种分析器；

如下所示：

```json
PUT /x
{
  "settings": {
    "index": {
      "analysis": {
        "analyzer": {
          "title_analyzer": {
            "type": "custom",
            "use_smart": "false",
            "tokenizer": "ik_max_word"
          },
          "content_analyzer": {
            "type": "custom",
            "use_smart": "true",
            "tokenizer": "ik_smart"
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

在上面的例子中，我们分别为索引 `x` 中的 `title` 和 `content` 字段配置了 `ik_max_word` 和 `ik_smart` 分析器；

至于分词的效果，前面已经看到了，这里不再重复展示；

<br/>

### **配置同义词**

除了分词之外，有时候我们还需要配置同义词，例如：`中国` 和 `China`，当用户输入 `China` 的时候，也可以搜索到 包含 `中国` 的内容；

关于如何配置同义词，下面是官方文档：

-   https://www.elastic.co/guide/en/elasticsearch/reference/7.14/analysis-synonym-tokenfilter.html
-   https://www.elastic.co/guide/en/elasticsearch/reference/7.14/analyzer.html

这里简单说一下，大概分为三步：

-   创建同义词词库；
-   重启ES加载词库（不支持热更新）；
-   **创建索引时指定同义词 filter；**

下面分别来看；

#### **一、创建同义词词库**

找到 ES 安装目录，创建 `config/analysis/synonym.txt`，该文件用于创建同义词词库；

<font color="#f00">**一行一个同义词，一定要是UTF-8格式！**</font>

**其中：**

-   <font color="#f00">**`AA,BB=>CC` 这种写法会将 AA 与 BB 都映射到 CC，然后只对CC进行索引；**</font>
-   <font color="#f00">**而 `AA,BB` 这种当文档中存在AA时，不仅仅会索引AA还会索引BB；**</font>

<font color="#f00">**如果文件中一个词存在于多行，那么对应的近义词会累计，如：**</font>

```
苹果,苹果手机
苹果,苹果电脑
```

此时“苹果”对应的近义词是“苹果手机”、“苹果电脑”，但如果是输入“苹果手机”，那么近义词只有“苹果”；

将以下字段写入`synonym.txt`：

```
西红柿,番茄=>圣女果
中国,China
```

<br/>

#### **二、重启ES加载词库（不支持热更新）**

重启elasticsearch，加载同义词词库；

对于Docker来说就很容易了，只需要重启ES容器即可！

<br/>

#### **三、创建索引时指定同义词 filter**

创建索引和映射，my_analyzer 为自定义分词器，my_synonym 为自定义过滤器：

```json
PUT /synonym_test
{
  "settings": {
    "index": {
      "analysis": {
        "analyzer": {
          "my_analyzer": {
            "type": "custom",
            "use_smart": "true",
            "tokenizer": "ik_smart",
            "filter": [
              "my_synonym"
            ]
          }
        },
        "filter": {
          "my_synonym": {
            "type": "synonym",
            "synonyms_path": "analysis/synonym.txt"
          }
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title": {
        "analyzer": "my_analyzer",
        "type": "text"
      }
    }
  }
}
```

其中 `synonyms_path` 指定第一步配置的索引文件路径；

>   **最重要的步骤：mappings 需要指定字段来使用同义词的filter，若未指定将使用默认的filter，搜索时将对同义词不生效！**

<br/>

#### **测试**

创建一个测试文档：

```json
POST /synonym_test/_doc/1
{
  "title": "我喜欢吃中国的圣女果"
}
```

测试 `AA,BB=>CC`：

```json
GET /synonym_test/_search
{
    "query":{
      "match": {
        "title": "番茄"
      } 
    }
}

GET /synonym_test/_search
{
    "query":{
      "match": {
        "title": "西红柿"
      } 
    }
}
```

以上两个搜索语句都能通过 **番茄** 和 **西红柿** 将 **圣女果** 搜索出来；

再来测试一下 `AA,BB`：

```json
GET /synonym_test/_search
{
    "query":{
      "match": {
        "title": "中国"
      } 
    }
}

GET /synonym_test/_search
{
    "query":{
      "match": {
        "title": "China"
      } 
    }
}
```

以上两个搜索语句也都能查询到！

<br/>

### **增加Stopwords**

在搜索的时候，我们还有另一种场景：有些文字或者词语没有什么实际的意义，比如：`的`、`嗯`等等；

这些词如果没有排除掉，用户在搜索时也会影响我们的匹配得分；

此时，我们可以配置 `Stopwords` 来跳过对这些词的匹配；

下面的这个 Github 开源库提供了一些常用的 Stopwords：

-   https://dgithub.com/goto456/stopwords

我们来动手配一下 Stopwords 看看效果；

<br/>

#### **为索引配置Stopwords**

Stopwords 的配置方式和同义词类似；

这里也可以采用另一种方式，即：在创建索引的时候提供 Stopwords 数组；

这样可以避免重启ES；

索引配置如下：

```json
PUT /stopword_test
{
  "settings": {
    "index": {
      "analysis": {
        "analyzer": {
          "my_analyzer": {
            "type": "custom",
            "use_smart": "true",
            "tokenizer": "ik_smart",
            "filter": [
              "my_stopwords"
            ]
          }
        },
        "filter": {
          "my_stopwords": {
            "type": "stop",
            "stopwords": [
              "的",
              "深圳"
            ]
          }
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title": {
        "analyzer": "my_analyzer",
        "type": "text"
      }
    }
  }
}
```

下面进行测试；

<br/>

#### **测试**

向索引添加文档：

```json
POST /stopword_test/_doc/1
{
  "title": "深圳的夏天很热"
}
```

尝试搜索关键字：

```json
GET /stopword_test/_doc/_search
{
    "query":{
      "match": {
        "title": "深圳"
      } 
    }
}

GET /stopword_test/_doc/_search
{
    "query":{
      "match": {
        "title": "的"
      } 
    }
}
```

都查不到文档，说明 Stopwords 已生效！

而查询 `夏天`：

```json
GET /stopword_test/_doc/_search
{
    "query":{
      "match": {
        "title": "夏天"
      } 
    }
}
```

可以查到；

<br/>

### **配置大小写不敏感**

有时候，我们也需要在查询时忽略大小写；此时，我们只需要使用 `lowercase` 过滤器即可：

在自定义的 `analysis` 里面：

-   如果是针对 `keyword` 类型的字段， analysis 要定义成 `normalizer`；
-   对于 `text` 类型，则需要为analyzer；

如下演示的是 `normalizer` 类型的定义：

```json
PUT /case_insensitive_test
{
  "settings": {
    "analysis": {
      "normalizer": {
        "self_normalizer": {
          "type": "custom",
          "filter": [
            "lowercase",
            "asciifolding"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "content": {
        "type": "keyword",
        "normalizer": "self_normalizer"
      }
    }
  }
}
```

向ES中新增数据：

```json
POST /case_insensitive_test/_doc/1
{
  "content": "abc"
}
POST /case_insensitive_test/_doc/2
{
  "content": "aBC"
}
POST /case_insensitive_test/_doc/3
{
  "content": "Abc"
}
```

此时的对于`content`，在ES中的值大小写都有的，此时进行查询：

```json
GET /case_insensitive_test/_search
{
    "query":{
      "match": {
        "content": "abc"
      } 
    }
}
```

三个都是可以查到的，并且分数完全相同：

```json
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 0.13353139,
    "hits" : [
      {
        "_index" : "case_insensitive_test",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.13353139,
        "_source" : {
          "content" : "abc"
        }
      },
      {
        "_index" : "case_insensitive_test",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.13353139,
        "_source" : {
          "content" : "aBC"
        }
      },
      {
        "_index" : "case_insensitive_test",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 0.13353139,
        "_source" : {
          "content" : "Abc"
        }
      }
    ]
  }
}
```

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
-   https://hlog.cc/archives/29/
-   [ES 自定义打分 Function score query](https://segmentfault.com/a/1190000037700644)
-   https://zhuanlan.zhihu.com/p/52543633
-   https://www.jianshu.com/p/893d35d53356
-   https://www.jianshu.com/p/60f986726ef3
-   https://elasticsearch.cn/question/29
-   https://cloud.tencent.com/developer/article/1764235
-   https://www.jianshu.com/p/f668d847f18d
-   [es number_of_shards和number_of_replicas](https://www.cnblogs.com/mikeluwen/p/8031813.html)
-   https://somersames.xyz/2020/03/20/ES7%E4%B8%AD%E5%A4%A7%E5%B0%8F%E5%86%99%E4%B8%8D%E6%95%8F%E6%84%9F%E7%9A%84%E6%A8%A1%E7%B3%8A%E5%8C%B9%E9%85%8D/


<br/>
