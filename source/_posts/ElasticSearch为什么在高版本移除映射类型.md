---
title: ElasticSearch为什么在高版本移除映射类型
toc: true
date: 2019-10-03 09:52:15
categories: ElasticSearch
tags: [ElasticSearch]
description: 由于ElasticSearch官方文档使用的还是2.x版本, 而在使用其中的某些API时, 会出现deprecated提示. 本篇主要总结ElasticSearch中那些由于版本更新而不再推荐使用的API, 同时也作为正式学习ElasticSearch前的又一次预热.
---

![ElasticSearch](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1570012601164&di=e7d7a24dc0375f5728f840b0722c89b0&imgtype=0&src=http%3A%2F%2Fpic2.zhimg.com%2Fv2-d6d239c55b93b2745b6c4ff516fa939f_1200x500.jpg)

<br/>

由于ElasticSearch官方文档使用的还是2.x版本, 而在使用其中的某些API时, 会出现deprecated提示. 本篇主要总结ElasticSearch中那些由于版本更新而不再推荐使用的API, 例如: 移除了映射类型(mapping types). 同时也作为正式学习ElasticSearch前的又一次预热.

本篇主要内容:

-   什么是映射类型(mapping types)
-   为什么要移除映射类型
-   映射类型的可选替代方案: 每种文档类型一个索引/自定义类型字段
-   Elastic Search 各个版本对types的支持
-   一些Elastic Search在新版本的使用技巧
-   ......



<!--more-->

## ElasticSearch为什么在高版本移除映射类型

官方英文解释在这：https://www.elastic.co/guide/en/elasticsearch/reference/current/removal-of-types.html

**注意**：<font color="#ff0000">在Elasticsearch6.0.0或者或者更新版本中创建的索引只会包含一个映射类型(mappingtype). 在5.x中创建的具有多个映射类型的索引在Elasticsearch6.x中依然会正常工作。在Elasticsearch7.0.0中，映射类型将会被完全移除。</font>

### 一. 什么是映射类型？

<font color="#ff0000">从Elasticsearch的第一个发行版开始，每一个文档都会被存储在一个单独的索引中，并且配以一个单独的映射类型。</font><font color="#00ff00">一个映射类型被用来表示被索引的文档或者实体的类型，比如一个twitter索引可能会有一个user类型和一个tweet类型。</font>

<font color="#0000ff">每一个映射类型都可以有其自身的字段</font>，所以user类型可能有一个full_name字段，一个user_name字段和一个email字段，而tweet类型可能会包含一个content字段，一个tweeted_at字段，以及与user类型中类似的user_name字段。

<font color="#0000ff">每个文档都有一个_type元字段用来保存类型名，搜索可以通过在URL中指定类型名将搜索限定于一个或多个类型中：</font>

```json
GET twitter/user,tweet/_search
{
  "query": {
    "match": {
      "user_name": "kimchy"
    }
  }
}_type字段的值会与文档的_id字段的值组合起来生成_uid字段，所以具有相同_id的不同类型的多个文档可以共存于一个索引中。
```

<font color="#0000ff">映射类型也被用来建立文档之间的父子关系，比如question类型的文档可以是answer类型文档的父亲。</font>



<br/>

----------



### 二. 为什么要移除映射类型（mappingtypes）

>   在Elasticsearch 7.0.0或更高版本中创建的索引不再接受`_default_`映射，索引在6.x中创建将继续在Elasticsearch 6.x中运行，类型在api 7.0中是不受支持的，它会中断对索引创建、put映射、get映射、put模板、get模板和get字段映射API的更改。

开始的时候，我们说"索引(index)"类似于SQL数据库中的"数据库"，将"类型(type)"等同于"表"。

**这是一个糟糕的类比，并且导致了一些错误的假设。**<font color="#ff0000">在SQL数据库中，表之间是相互独立的。一个表中的各列并不会影响到其它表中的同名的列。而在映射类型（mappingtype）中却不是这样的。</font>

<font color="#ff0000">在同一个Elasticsearch索引中，其中不同映射类型中的同名字段在内部是由同一个Lucene字段来支持的。</font><font color="#0000ff">换句话说，使用上面的例子，`user类型中的user_name字段`与`tweet类型中的user_name字段`是*完全一样*的，并且两个user_name字段在两个类型中必须具有相同的映射（定义）.</font>

<font color="#ff0000">这会在某些情况下导致一些混乱. 比如，在同一个索引中，当你想在其中的一个类型中将deleted字段作为date类型，而在另一个类型中将其作为boolean字段。</font>

在此之上需要考虑一点，<font color="#ff0000">如果同一个索引中存储的各个实体如果只有很少或者根本没有同样的字段，这种情况会导致稀疏数据，并且会影响到Lucene的高效压缩数据的能力。</font>

基于这些原因，将映射类型的概念从Elasticsearch中移除!



<br/>

---------



### 三. 映射类型的可选替代方案

#### 1. 每种文档类型一个索引

第一种选择就是<font color="#ff0000">每个文档类型对应一个索引。</font><font color="#0000ff">你可以不将tweets和users存储于同一个索引，而将它们分别存储于tweets索引和users索引中。索引之间是完全相互独立的，不同索引中的（同名的）字段类型也就不会产生冲突了。</font>

这种方式有两个好处：

-   数据更倾向于密集（而不是稀疏），这样就能获益于Lucene的压缩技术;
-   因为同一个索引中的所有的文档代表同一种实体，用于为全文搜索打分的条件统计会更精确

每个索引可以依据其可能的文档存储量级来设置相关的配置：可以对users使用较少的主分片，同时对tweets使用较大数量的主分片。

<br/>

#### 2. 自定义类型字段

当然，一个集群中可以创建的主分片的数量是有限制的，所以你可能不想为一个只有几千个文档的集合去浪费一整个分片。这种情况下你可以**使用你自己定义的type字段**，它看起来和原来的_type工作机制类似。

我们继续使用上面的user/tweet例子。原来的工作流程可能像下面这样：

```json
PUT twitter
{
  "mappings": {
    "user": {
      "properties": {
        "name": { "type": "text" },
        "user_name": { "type": "keyword" },
        "email": { "type": "keyword" }
      }
    },
    "tweet": {
      "properties": {
        "content": { "type": "text" },
        "user_name": { "type": "keyword" },
        "tweeted_at": { "type": "date" }
      }
    }
  }
}
PUT twitter/user/kimchy
{
  "name": "Shay Banon",
  "user_name": "kimchy",
  "email": "shay@kimchy.com"
}
PUT twitter/tweet/1
{
  "user_name": "kimchy",
  "tweeted_at": "2017-10-24T09:00:00Z",
  "content": "Types are going away"
}
GET twitter/tweet/_search
{
  "query": {
    "match": {
      "user_name": "kimchy"
    }
  }
}
```

你可以通过自定义的type字段实现同样的目的：

```json
PUT twitter
{
  "mappings": {
    "doc": {
      "properties": {
        "type": { "type": "keyword" }, 
        "name": { "type": "text" },
        "user_name": { "type": "keyword" },
        "email": { "type": "keyword" },
        "content": { "type": "text" },
        "tweeted_at": { "type": "date" }
      }
    }
  }
}
PUT twitter/doc/user-kimchy
{
  "type": "user", 
  "name": "Shay Banon",
  "user_name": "kimchy",
  "email": "shay@kimchy.com"
}
PUT twitter/doc/tweet-1
{
  "type": "tweet", 
  "user_name": "kimchy",
  "tweeted_at": "2017-10-24T09:00:00Z",
  "content": "Types are going away"
}
GET twitter/_search
{
  "query": {
    "bool": {
      "must": {
        "match": {
          "user_name": "kimchy"
        }
      },
      "filter": {
        "match": {
          "type": "tweet" 
        }
      }
    }
  }
}
```

<font color="#ff0000">显式`type`字段替代了隐式`_type`字段。</font>

<br/>

#### 3. 在没有映射类型的情况下实现父子关系

先前，我们通过将一个映射类型指定为父，另一个或多个映射类型为子来表示父子关系。在没有类型的情况下，我们就不能使用这种语法了。父子关系的特征会向之前那样工作，不同之处在于文档之间这种关系的**表示方式变成了使用新的join字段**。



<br/>

--------------



### 四. 映射类型的移除计划

对于用户来说，这是一个巨大的变化，所以已经尝试让它尽可能地不那么痛苦，更改将按如下方式进行：

**Elasticsearch 5.6.0**

-   在索引上设置`index.mapping.single_type: true`将启用在6.0中强制执行的单类型/索引行为。
-   在5.6中创建的索引中可以使用父—子`join`字段替换。

**Elasticsearch 6.x**

-   在5.x中创建索引将继续在6.x中运行就像5.x。
-   索引在6.x中创建只允许每个索引使用单一类型，类型可以使用任何名称，但只能有一个，首选的类型名称是`_doc`，因此索引API具有与7.0中相同的路径：`PUT {index}/_doc/{id} and POST {index}/_doc`。
-    `_type`名称不能再与`_id`组合以形成`_uid`字段，`_uid`字段已成为`_id`字段的别名。
-   新的索引不再支持旧式的父/子索引，而是应该使用`join`字段。
-    `_default_`映射类型已弃用。
-   在6.8中，索引创建、索引模板和映射API支持查询字符串参数（`include_type_name`），该参数指示请求和响应是否应该包含类型名称。它默认为`true`，应该设置为一个显式值，以便准备升级到7.0，未设置`include_type_name`将导致一个弃用警告，没有显式类型的索引将使用虚拟类型名称`_doc`。

**Elasticsearch 7.x**

-   在请求中指定类型已弃用，例如，索引文档不再需要文档`type`，对于显式**id**，新的索引API是`PUT {index}/_doc/{id}`，对于自动生成的**id**则是`POST {index}/_doc`，注意，在7.0中，`_doc`是路径的一个永久部分，它表示端点名称，而不是文档类型。
-   索引创建、索引模板和映射API中的`include_type_name`参数默认为`false`，完全设置该参数将导致一个弃用警告。
-   删除`_default_`映射类型。

**Elasticsearch 8.x**

-   不再支持在请求中指定类型。
-   删除`include_type_name`参数。



<br/>

----------



### 五. 一些Elastic Search的使用技巧

#### 1. 将多类型索引迁移到单类型

[Reindex API](https://segmentfault.com/a/1190000017044200)可用于**将多类型索引转换为单类型索引**，下面的例子可以在Elasticsearch 5.6或Elasticsearch 6.x中使用，<font color="#ff0000">在6.x，不需要指定`index.mapping.single_type`作为默认值</font>

##### 每种文档类型的索引

第一个示例将`twitter`索引拆分为`tweets`索引和`users`索引：

```json
PUT users
{
  "settings": {
    "index.mapping.single_type": true
  },
  "mappings": {
    "_doc": {
      "properties": {
        "name": {
          "type": "text"
        },
        "user_name": {
          "type": "keyword"
        },
        "email": {
          "type": "keyword"
        }
      }
    }
  }
}

PUT tweets
{
  "settings": {
    "index.mapping.single_type": true
  },
  "mappings": {
    "_doc": {
      "properties": {
        "content": {
          "type": "text"
        },
        "user_name": {
          "type": "keyword"
        },
        "tweeted_at": {
          "type": "date"
        }
      }
    }
  }
}

POST _reindex
{
  "source": {
    "index": "twitter",
    "type": "user"
  },
  "dest": {
    "index": "users"
  }
}

POST _reindex
{
  "source": {
    "index": "twitter",
    "type": "tweet"
  },
  "dest": {
    "index": "tweets"
  }
}
```

##### 自定义类型字段

下一个示例添加一个自定义类型字段，并将其设置为原始`_type`的值，它还将类型添加到`_id`中，以防有任何不同类型的文档具有冲突的`id`：

```json
PUT new_twitter
{
  "mappings": {
    "_doc": {
      "properties": {
        "type": {
          "type": "keyword"
        },
        "name": {
          "type": "text"
        },
        "user_name": {
          "type": "keyword"
        },
        "email": {
          "type": "keyword"
        },
        "content": {
          "type": "text"
        },
        "tweeted_at": {
          "type": "date"
        }
      }
    }
  }
}


POST _reindex
{
  "source": {
    "index": "twitter"
  },
  "dest": {
    "index": "new_twitter"
  },
  "script": {
    "source": """
      ctx._source.type = ctx._type;
      ctx._id = ctx._type + '-' + ctx._id;
      ctx._type = '_doc';
    """
  }
}
```

<br/>

#### 2. 新版本中的无类型API

<font color="#0000ff">在Elasticsearch 7.0中，每个API都支持无类型请求，指定类型将产生一个弃用警告。</font>

>   即使目标索引包含自定义类型，无类型API也可以工作，例如，如果索引具有自定义类型名称`my_type`，则可以使用无类型`index`调用向其添加文档，并使用无类型`get`调用加载文档。

**索引API**

<font color="#0000ff">索引创建、索引模板和映射API支持一个新的`include_type_name` URL参数，该参数指定请求和响应中的映射定义是否应该包含类型名称.</font> 版本6.8中的参数默认为`true`，以匹配在映射中使用类型名称的7.0之前的行为，它在7.0版本中默认为`false`，将在8.0版本中删除。

它应该在6.8中明确设置，以便准备升级到7.0，为了避免6.8中的弃用警告，可以将参数设置为`true`或`false`，在7.0中，设置`include_type_name`将导致一个弃用警告。

查看一些与Elasticsearch交互的例子，这个选项设置为`false`：

```json
PUT index?include_type_name=false
{
  "mappings": {
    "properties": { 
      "foo": {
        "type": "keyword"
      }
    }
  }
}
```

-   映射直接包含在`mappings`键下，没有类型名称。

```json
PUT index/_mappings?include_type_name=false
{
  "properties": { 
    "bar": {
      "type": "text"
    }
  }
}
```

```
GET index/_mappings?include_type_name=false
```

上面的调用返回：

```
{
  "index": {
    "mappings": {
      "properties": { 
        "foo": {
          "type": "keyword"
        },
        "bar": {
          "type": "text"
        }
      }
    }
  }
}
```

<br/>

#### 3. 文档API

<font color="#ff0000">在7.0中，必须使用`{index}/_doc`路径调用索引API，以便自动生成`_id`，使用显式`id`调用`{index}/_doc/{id}`。</font>

```
PUT index/_doc/1
{
  "foo": "baz"
}
{
  "_index": "index",
  "_id": "1",
  "_type": "_doc",
  "_version": 1,
  "result": "created",
  "_shards": {
    "total": 2,
    "successful": 1,
    "failed": 0
  },
  "_seq_no": 0,
  "_primary_term": 1
}
```

类似地，<font color="#0000ff">`get`和`delete` API使用路径`{index}/_doc/{id}`：</font>

```
GET index/_doc/1
```

>   <font color="#ff0000">在7.0中，`_doc`表示端点名称，而不是文档类型，`_doc`组件是文档`index`、`get`和`delete` API路径的永久部分，在8.0中不会被删除。</font>

对于同时包含类型和端点名（如`_update`）的API路径，在7.0中端点将立即跟随索引名：

```
POST index/_update/1
{
    "doc" : {
        "foo" : "qux"
    }
}

GET /index/_source/1
```

<font color="#ff0000">类型也不应该再出现在请求体中，下面的`bulk`索引示例省略了URL和单个批量命令中的类型：</font>

```
POST _bulk
{ "index" : { "_index" : "index", "_id" : "3" } }
{ "foo" : "baz" }
{ "index" : { "_index" : "index", "_id" : "4" } }
{ "foo" : "qux" }
```

<br/>

#### 4. 搜索API

<font color="#ff0000">在调用诸如`_search`、`_msearch`或`_explain`之类的搜索API时，URL中不应该包含类型，此外，`_type`字段不应该用于查询、聚合或脚本!</font>

文档和搜索API将继续在响应中返回`_type`键，以避免中断响应解析，然而，键被认为是不赞成的，不应该再被引用，**类型将在8.0中从响应中完全删除**。

注意，当使用废弃的类型化API时，索引的映射类型将作为正常返回，但是无类型API将在响应中返回虚拟类型`_doc`，例如，下面的无类型`get`调用总是返回`_doc`作为类型，即使映射有一个像`my_type`这样的自定义类型名：

```
PUT index/my_type/1
{
  "foo": "baz"
}

GET index/_doc/1
```

​                     

```
{
    "_index" : "index",
    "_type" : "_doc",
    "_id" : "1",
    "_version" : 1,
    "_seq_no" : 0,
    "_primary_term" : 1,
    "found": true,
    "_source" : {
        "foo" : "baz"
    }
}
```

<br/>

#### 5. 索引模版

<font color="#ff0000">建议通过将`include_type_name`设置为`false`来重新添加索引模板，使其无类型，在底层，无类型模板在创建索引时将使用虚拟类型`_doc`!</font>

如果将无类型模板用于类型化索引创建调用，或者将类型化模板用于无类型索引创建调用，则仍将应用模板，但索引创建调用将决定是否应该有类型。例如在下面的示例中，`index-1-01`将具有一个类型，尽管它匹配一个没有类型的模板，而`index-2-01`将具有无类型，尽管它匹配一个定义了类型的模板，`index-1-01`和`index-2-01`都将从匹配的模板中继承`foo`字段。

```json
PUT _template/template1
{
  "index_patterns":[ "index-1-*" ],
  "mappings": {
    "properties": {
      "foo": {
        "type": "keyword"
      }
    }
  }
}

PUT _template/template2?include_type_name=true
{
  "index_patterns":[ "index-2-*" ],
  "mappings": {
    "type": {
      "properties": {
        "foo": {
          "type": "keyword"
        }
      }
    }
  }
}

PUT index-1-01?include_type_name=true
{
  "mappings": {
    "type": {
      "properties": {
        "bar": {
          "type": "long"
        }
      }
    }
  }
}

PUT index-2-01
{
  "mappings": {
    "properties": {
      "bar": {
        "type": "long"
      }
    }
  }
}
```

在隐式索引创建的情况下，因为文档在索引中被索引，而索引还不存在，所以总是使用模板，这通常不是一个问题，因为无类型索引调用要处理有类型的索引。

<br/>

#### 6. 混合版本的集群

<font color="#ff0000">在由6.8和7.0节点组成的集群中，应该在索引创建之类的索引API中指定参数`include_type_name`，这是因为参数在6.8和7.0之间有不同的默认值，所以相同的映射定义对两个节点版本都无效!</font>

诸如`bulk`和`update`之类的无类型文档API仅在7.0版本时可用，不能用于6.8节点，对于执行文档查找的查询的无类型版本，如`terms`，也是如此。



<br/>

---------------------



### 附录

参考文章

-   [官方文档Removal of mapping types](https://www.elastic.co/guide/en/elasticsearch/reference/master/removal-of-types.html#_why_are_mapping_types_being_removed)
-   [ Elasticsearch 参考指南（删除映射类型）](https://segmentfault.com/a/1190000019911538)
-   [Elasticsearch 移除 type 之后的新姿势](https://elasticsearch.cn/article/601)
-   [Elasticsearch 映射类型（mapping type)为何将在 7.0版本后彻底移除](https://blog.51cto.com/14298057/2384062)



