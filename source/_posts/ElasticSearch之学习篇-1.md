---
title: ElasticSearch之学习篇-1
toc: true
date: 2019-10-10 20:40:24
cover: https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1570012601164&di=e7d7a24dc0375f5728f840b0722c89b0&imgtype=0&src=http%3A%2F%2Fpic2.zhimg.com%2Fv2-d6d239c55b93b2745b6c4ff516fa939f_1200x500.jpg
categories: [ElasticSearch]
tags: [ElasticSearch]
description: 经过前两篇对于ES的热身, 从本篇开始, 将正式总结ES相关知识.
---



经过前两篇对于ES的热身, 从本篇开始, 将正式总结ES相关知识.

本篇文章主要内容:

-   什么是ES? 为什么要使用ES?
-   和ES交换的方式: Java API, RESTful API with JSON over HTTP
-   从一个员工例子开始介绍增删改查
-   简单介绍ES特性: match, filter, 全文检索, 短语搜索, 高亮搜索等
-   ES的分布式特性: 创建集群, 集群健康, 向集群中添加索引, 添加故障转移, 水平扩容等
-   ......

<br/>

<!--more-->

## ElasticSearch之学习篇-1

### 零. 前言

#### **官方文档已经很全面了, 为何要再写一个ES系列?**

由于官方文档已经是4年前开始写的了, 版本还停留在2.x版本, 对于现行最新的7.x版本, 完全不能符合日常开发的要求. 并且对于在7.x版本被废除的特性, 官方文档中居然还保留着各种例子!

所以, 作为一个初入ES的小白在学习上的总结, 同时也希望和大家一起交流更新版本的ES, 所以出现了该文章系列.

#### **本系列的说明**

本系列主要还是紧紧跟随官方提供的文档进行学习, 同时对于官方提供的一些例子给予在新版本下的实现, 并针对新版本下可能会出现的问题做出回答. 可作为对于官方文档的补充与更新.

#### 本系列中的程序源代码以及说明

本系列中的所有源代码都保存在我的Github仓库: https://github.com/JasonkayZK/ElasticSearch_Learn

大家可以随意修改, 分发, 重用其中的任何代码, 而不用经过申请. 最后由于本人学力与精力有限, 文中可能会有不对的地方, 还请大家批评指正, 同时也希望和能大家一同交流.



<br/>

-------



### 一. 初入ES世界

#### 1. 什么是ES? 为什么要使用ES?

Elasticsearch 是一个开源的搜索引擎，建立在一个全文搜索引擎库 [Apache Lucene™](https://lucene.apache.org/core/) 基础之上。Lucene 可以说是当下最先进、高性能、全功能的搜索引擎库--无论是开源还是私有。

但是 Lucene 仅仅只是一个库。为了充分发挥其功能，你需要使用 Java 并将 Lucene 直接集成到应用程序中。更糟糕的是，您可能需要获得信息检索学位才能了解其工作原理。Lucene *非常* 复杂。

<font color="#0000ff">Elasticsearch 也是使用 Java 编写的，它的内部使用 Lucene 做索引与搜索，但是它的目的是使全文检索变得简单，通过隐藏 Lucene 的复杂性，取而代之的提供一套简单一致的 RESTful API。</font>

然而，**Elasticsearch 不仅仅是 Lucene，并且也不仅仅只是一个全文搜索引擎**。  它可以被下面这样准确的形容：

-    一个分布式的实时文档存储，*每个字段* 可以被索引与搜索 
-    一个分布式实时分析搜索引擎 
-    能胜任上百个服务节点的扩展，并支持 PB 级别的结构化或者非结构化数据 

Elasticsearch 将所有的功能打包成一个单独的服务，这样你可以通过程序与它提供的简单的 RESTful API 进行通信， 可以使用自己喜欢的编程语言充当 web 客户端，甚至可以使用命令行（去充当这个客户端）。

<br/>

#### 2. 和 Elasticsearch 的交互

和 Elasticsearch 的交互方式取决于你是否使用 Java.

##### Java API

如果你正在使用  Java，在代码中你可以使用 Elasticsearch 内置的两个客户端：

-   节点客户端（Node client） 

    <font color="#0000ff">节点客户端作为一个`非数据节点加入到本地集群`中。换句话说，它本身不保存任何数据，但是它知道数据在集群中的哪个节点中，并且可以把请求转发到正确的节点。 </font>

-   传输客户端（Transport client） 

    <font color="#0000ff">轻量级的传输客户端可以将请求发送到远程集群。它`本身不加入集群`，但是它可以将请求转发到集群中的一个节点上。 </font>

<font color="#ff0000">两个 Java 客户端都是通过 `9300 端口`并使用 Elasticsearch 的原生 *传输* 协议和集群交互。</font>集群中的节点通过端口 9300 彼此通信。如果这个端口没有打开，节点将无法形成一个集群。

>   Java 客户端作为节点必须和 Elasticsearch 有相同的 *主要* 版本；否则，它们之间将无法互相理解。

更多的 Java 客户端信息可以在 [Elasticsearch Clients](https://www.elastic.co/guide/en/elasticsearch/client/index.html) 中找到。

<br/>

##### RESTful API with JSON over HTTP

<font color="#ff0000">所有其他语言可以使用 RESTful API 通过端口 *9200* 和 lasticsearch 进行通信，你可以用你最喜爱的 web 客户端访问 Elasticsearch ，你甚至可以使用 `curl` 命令来和 Elasticsearch 交互:</font> 

一个 Elasticsearch 请求和任何 HTTP 请求一样由若干相同的部件组成：

```bash
curl -X<VERB> '<PROTOCOL>://<HOST>:<PORT>/<PATH>?<QUERY_STRING>' -d '<BODY>'
```

被 `< >` 标记的部件：

|    Keyword     |                             含义                             |
| :------------: | :----------------------------------------------------------: |
|     `VERB`     | 适当的 HTTP *方法* 或 *谓词* : `GET`、 `POST`、 `PUT`、 `HEAD` 或者 `DELETE`。 |
|   `PROTOCOL`   | `http` 或者 `https`（如果你在 Elasticsearch 前面有一个 `https` 代理） |
|     `HOST`     | Elasticsearch 集群中任意节点的主机名，或者用 `localhost` 代表本地机器上的节点。 |
|     `PORT`     |    运行 Elasticsearch HTTP 服务的端口号，默认是 `9200` 。    |
|     `PATH`     | API 的终端路径（例如 `_count` 将返回集群中文档数量）。Path 可能包含多个组件，例如：`_cluster/stats` 和 `_nodes/stats/jvm` 。 |
| `QUERY_STRING` | 任意可选的查询字符串参数 (例如 `?pretty` 将格式化地输出 JSON 返回值，使其更容易阅读) |
|     `BODY`     |          一个 JSON 格式的请求体 (如果请求需要的话)           |

例如，计算集群中文档的数量，我们可以用这个:

```json
curl -XGET 'http://localhost:9200/_count?pretty' -d '
{
    "query": {
        "match_all": {}
    }
}
'
```

在接下来的学习中你会知道, 上面的指令可以被省略, 所以在使用时更像下面这样(省略请求中所有相同的部分，例如主机名、端口号以及 `curl` 命令本身, 但是命令原本样子是使用curl的):

```json
GET /_count
{
    "query": {
        "match_all": {}
    }
}
```

Elasticsearch 返回一个 HTTP 状态码（例如：`200 OK`）和（除`HEAD`请求）一个 JSON 格式的返回值。前面的 `curl` 请求将返回一个像下面一样的 JSON 体：

```json
{
    "count": 6,
    "_shards": {
        "total": 4,
        "successful": 4,
        "skipped": 0,
        "failed": 0
    }
}
```

**如果要在curl命令中显示HTTP消息头**: 可以使用`-i`参数:

```bash
curl -i -XGET 'localhost:9200/'
```

<br/>

#### 3. 面向文档

在应用程序中对象很少只是一个简单的键和值的列表。通常，它们拥有更复杂的数据结构，可能包括日期、地理信息、其他对象或者数组等。

也许有一天你想把这些对象存储在数据库中。使用关系型数据库的行和列存储，这相当于是把一个表现力丰富的对象塞到一个非常大的电子表格中：为了适应表结构，你必须设法将这个对象扁平化--通常一个字段对应一列--而且每次查询时又需要将其重新构造为对象。

Elasticsearch 是 *面向文档* 的，意味着它存储整个对象或 *文档_。Elasticsearch 不仅存储文档，而且 _索引* 每个文档的内容，使之可以被检索。在 Elasticsearch 中，我们对文档进行索引、检索、排序和过滤--而不是对行列数据。这是一种完全不同的思考数据的方式，也是 Elasticsearch 能支持复杂全文检索的原因。



<br/>

------------



### 二. 从一个例子员工开始

通常在学习SQL等RMDB时, 通常都是使用一个雇员(Employee)的例子. 这次也不例外! 也是采用了一个Employee的例子开始. (因为ES也可以看做一种类似于文档类型的数据库?!)

#### 0. 任务需求: 创建一个雇员目录

我们受雇于  *Megacorp* 公司，作为 HR 部门新的 *“热爱无人机”* （_"We love our drones!"_）激励项目的一部分，我们的任务是为此创建一个员工目录。该目录应当能培养员工认同感及支持实时、高效、动态协作，因此有一些业务需求：

-    支持**包含多值标签、数值、以及全文本的数据** 
-    **检索任一员工的完整信息** 
-    **允许结构化搜索**，比如查询 30 岁以上的员工 
-    **允许简单的全文搜索以及较复杂的短语搜索** 
-    **支持在匹配文档内容中高亮显示搜索片段** 
-    **支持基于数据创建和管理分析仪表盘** 

<br/>

#### 1. 增加员工数据

第一个业务需求是存储员工数据. 这将会<font color="#0000ff">以*员工文档* 的形式存储：一个文档代表一个员工。</font><font color="#ff0000">存储数据到 Elasticsearch 的行为叫做 *索引* ，但在索引一个文档之前，需要确定将文档存储在哪里。</font>

<font color="#0000ff">一个 Elasticsearch 集群可以  包含多个 *索引* ，相应的每个索引可以包含多个 *类型* 。 这些不同的类型存储着多个 *文档* ，每个文档又有  多个 *属性* 。</font>

>   (1 * Index  = n * types)
>
>   1 * Index = n * _doc
>
>   1 * _doc = n * attr
>
>   <font color="#ff0000">需要注意的是, 在高版本中已经删去了types特性</font>具体原因可查看我的另一篇文章: [ElasticSearch为什么在高版本移除映射类型](https://jasonkayzk.github.io/2019/10/03/ElasticSearch%E4%B8%BA%E4%BB%80%E4%B9%88%E5%9C%A8%E9%AB%98%E7%89%88%E6%9C%AC%E7%A7%BB%E9%99%A4%E6%98%A0%E5%B0%84%E7%B1%BB%E5%9E%8B/)

**倒排索引：**

<font color="#0000ff">关系型数据库通过增加一个 *索引* 比如一个 B树（B-tree）索引到指定的列上，以便提升数据检索速度。Elasticsearch 和 Lucene 使用了一个叫做  *倒排索引* 的结构来达到相同的目的。</font>

<font color="#ff0000">默认的，一个文档中的*每一个属性都是被索引* 的（有一个倒排索引）和可搜索的。一个没有倒排索引的属性是不能被搜索到的!</font>

<br/>

对于员工目录，我们将做如下操作：

-   每个员工索引一个文档，文档包含该员工的所有信息。 
-   该类型位于 *索引* `employee` 内。 
-   该索引保存在我们的 Elasticsearch 集群中。 

实践中这非常简单（尽管看起来有很多步骤），我们可以通过一条命令完成所有这些动作：

```json
PUT /employee/_doc/1
{
    "first_name": "John-put",
    "last_name": "Smith",
    "age": 25,
    "about": "I love to go rock climbing",
    "interests": [
        "sports",
        "music"
    ]
}
```

>   **注意: **这里使用了更高版本的ES推荐的格式, 而路径中并未包含官方文档中的`types`字段;

请求API介绍:

-   请求动作为PUT, 添加一个对象, 符合RESTful的习惯.
-   路径包含了三部分内容:
    -   employee: 索引名称
    -   _doc: 索引类型
    -   1: 特定雇员的ID
-   请求体(JSON 文档): 包含了这位员工的所有详细信息，他的名字叫 John Smith ，今年 25 岁，喜欢攀岩

很简单！<font color="#ff0000">无需进行执行管理任务，如创建一个索引或指定每个属性的数据类型之类的，可以直接只索引一个文档! </font>Elasticsearch 默认地完成其他一切，因此所有必需的管理任务都在后台使用默认设置完成。

执行之后返回一条结果:

```json
{
    "_index": "employee",
    "_type": "_doc",
    "_id": "1",
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

出现了successful表示执行成功!

进行下一步前，让我们增加更多的员工信息到目录中：

```json
PUT /employee/_doc/2
{
    "first_name": "Jane",
    "last_name": "Smith",
    "age": 32,
    "about": "I like to collect rock albums",
    "interests": [
        "music"
    ]
}

PUT /employee/_doc/3
{
    "first_name": "Douglas",
    "last_name": "Fir",
    "age": 35,
    "about": "I like to build cabinets",
    "interests": [
        "forestry"
    ]
}
```

<br/>

#### 2. 查找员工数据

目前我们已经在 Elasticsearch 中存储了一些数据，  接下来就能专注于实现应用的业务需求了。第一个需求是可以检索到单个雇员的数据。 这在 Elasticsearch 中很简单:

<font color="#0000ff">简单地执行  一个 HTTP `GET` 请求并指定文档的地址: 索引库、类型和ID. 使用这三个信息可以返回原始的 JSON 文档:</font>

```json
// 按照id获取信息
GET /employee/_doc/1
```

返回结果包含了文档的一些元数据，以及 `_source` 属性，内容是 John Smith 雇员的原始 JSON 文档: 

```json
{
    "_index": "employee",
    "_type": "_doc",
    "_id": "1",
    "_version": 1,
    "_seq_no": 0,
    "_primary_term": 1,
    "found": true,
    "_source": {
        "first_name": "John-put",
        "last_name": "Smith",
        "age": 25,
        "about": "I love to go rock climbing",
        "interests": [
            "sports",
            "music"
        ]
    }
}
```

>   使用`GET` 可以用来检索文档
>
>   使用 `DELETE` 命令来删除文档
>
>   使用 `HEAD` 指令来检查文档是否存在
>
>   如果想更新已存在的文档，只需再次 `PUT`

<br/>

#### 3. 搜索员工信息

一个 `GET` 是相当简单的，可以直接得到指定的文档. 现在尝试点儿稍微高级的功能，比如一个简单的搜索! 

##### 搜索全部员工

第一个尝试的几乎是最简单的搜索了。我们使用下列请求来搜索所有雇员：

```
// 获得全部
GET /employee/_search
```

可以看到，我们仍然使用索引库 `employee`，但与指定一个文档 ID 不同，这次使用 `_search` 。返回结果包括了所有三个文档，放在数组`hits` 中。<font color="#0000ff">一个搜索默认返回十条结果.</font>

```json
{
    "took": 2,
    "timed_out": false,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 3,
            "relation": "eq"
        },
        "max_score": 1,
        "hits": [
            {
                "_index": "employee",
                "_type": "_doc",
                "_id": "1",
                "_score": 1,
                "_source": {
                    "first_name": "John-put",
                    "last_name": "Smith",
                    "age": 25,
                    "about": "I love to go rock climbing",
                    "interests": [
                        "sports",
                        "music"
                    ]
                }
            },
            {
                "_index": "employee",
                "_type": "_doc",
                "_id": "2",
                "_score": 1,
                "_source": {
                    "first_name": "Jane",
                    "last_name": "Smith",
                    "age": 32,
                    "about": "I like to collect rock albums",
                    "interests": [
                        "music"
                    ]
                }
            },
            {
                "_index": "employee",
                "_type": "_doc",
                "_id": "3",
                "_score": 1,
                "_source": {
                    "first_name": "Douglas",
                    "last_name": "Fir",
                    "age": 35,
                    "about": "I like to build cabinets",
                    "interests": [
                        "forestry"
                    ]
                }
            }
        ]
    }
}
```

>   注意：返回结果不仅告知匹配了哪些文档，还包含了整个文档本身：显示搜索结果给最终用户所需的全部信息。

<br/>

##### 搜索姓氏为 ``Smith`` 的雇员

接下来，尝试下搜索姓氏为 ``Smith`` 的雇员: 

为此，我们将使用一个 *高亮* 搜索. 这个方法一般涉及到一个 *查询字符串* （_query-string_） 搜索，因为我们通过一个URL参数来传递查询信息给搜索接口：

```
// 搜索姓氏为 ``Smith`` 的雇员
// 在请求路径中使用 _search 端点，并将查询本身赋值给参数 q=
GET /employee/_search?q=last_name:Smith
```

我们仍然<font color="#ff0000">在请求路径中使用 `_search` 端点，并将查询本身赋值给参数 `q=`.</font>返回结果给出了所有的 Smith：

```json
{
    ......
    "hits": {
        "total": {
            "value": 2,
            "relation": "eq"
        },
        "max_score": 0.47000363,
        "hits": [
            {
                "_index": "employee",
                "_type": "_doc",
                "_id": "1",
                "_score": 0.47000363,
                "_source": {
                    "first_name": "John-put",
                    "last_name": "Smith",
                    "age": 25,
                    "about": "I love to go rock climbing",
                    "interests": [
                        "sports",
                        "music"
                    ]
                }
            },
            {
                "_index": "employee",
                "_type": "_doc",
                "_id": "2",
                "_score": 0.47000363,
                "_source": {
                    "first_name": "Jane",
                    "last_name": "Smith",
                    "age": 32,
                    "about": "I like to collect rock albums",
                    "interests": [
                        "music"
                    ]
                }
            }
        ]
    }
}
```

<br/>

#### 4. 使用查询表达式搜索

`Query-string `搜索通过命令非常方便地进行**临时性的即席搜索**  ，但它有自身的局限性: <font color="#0000ff">查询字符串搜索允许任何用户在索引的任意字段上执行可能较慢且重量级的查询，这可能会暴露隐私信息，甚至将集群拖垮 !</font>

Elasticsearch 提供一个丰富灵活的查询语言叫做 *查询表达式* ， 它支持构建更加复杂和健壮的查询。

*领域特定语言* （DSL）， 使用 JSON 构造了一个请求。

##### 使用match查询

我们可以像这样重写之前的查询所有名为 Smith 的搜索 ：

```json
// 使用查询表达式搜索: 
// 领域特定语言 （DSL）， 使用 JSON 构造了一个请求
GET /employee/_search
{
  "query": {
    "match": {
      "last_name": "Smith"
    }
  }
}
```

返回结果与之前的查询一样，但还是可以看到有一些变化。其中之一是，<font color="#ff0000">不再使用 *query-string* 参数，而是一个请求体替代!</font> 这个请求使用 JSON 构造，并使用了一个 `match` 查询!

<br/>

##### 使用filter过滤器

现在尝试下更复杂的搜索。同样搜索姓氏为 Smith 的员工，但这次我们只需要年龄大于 30 的。查询需要稍作调整，使用过滤器 *filter* ，它支持高效地执行一个结构化查询。

```json
// 使用过滤器 filter 
// 添加了一个 过滤器 用于执行一个范围查询，并复用之前的 match查询
GET /employee/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "last_name" : "smith"
          }
        }
      ], 
      "filter": {
        "range": {
          "age": {
            "gt": 30
          }
        }
      }
    }
  }
}
```

我们添加了一个 *过滤器* 用于执行一个范围查询，并复用之前的 `match` 查询。现在结果只返回了一名员工，叫 Jane Smith，32 岁。

```json
{
    ......
        "hits": [
            {
                "_index": "employee",
                "_type": "_doc",
                "_id": "2",
                "_score": 0.47000363,
                "_source": {
                    "first_name": "Jane",
                    "last_name": "Smith",
                    "age": 32,
                    "about": "I like to collect rock albums",
                    "interests": [
                        "music"
                    ]
                }
            }
        ]
    }
}
```

<br/>

#### 5. 全文搜索

截止目前的搜索相对都很简单：单个姓名，通过年龄过滤。现在尝试下稍微高级点儿的: 全文搜索, 一项传统数据库确实很难搞定的任务。

搜索下所有喜欢攀岩（rock climbing）的员工

```json
// 全文搜索
// 搜索下所有喜欢攀岩（rock climbing）的员工
// Elasticsearch 默认按照相关性得分排序，即每个文档跟查询的匹配程度
// 但为什么 Jane Smith 也作为结果返回了呢？原因是她的 about 属性里提到了 “rock” 。因为只有 “rock” 而没有 “climbing” ，所以她的相关性得分低于 John 的
GET /employee/_search
{
  "query": {
    "match": {
      "about": "rock climbing"
    }
  }
}
```

显然我们依旧使用之前的 `match` 查询在`about` 属性上搜索 “rock climbing” 。<font color="#0000ff">得到两个匹配的文档</font>：

```json
{
    ......
    "hits": {
        "total": {
            "value": 2,
            "relation": "eq"
        },
        "max_score": 1.4167402,
        "hits": [
            {
                "_index": "employee",
                "_type": "_doc",
                "_id": "1",
                "_score": 1.4167402,
                "_source": {
                    "first_name": "John-put",
                    "last_name": "Smith",
                    "age": 25,
                    "about": "I love to go rock climbing",
                    "interests": [
                        "sports",
                        "music"
                    ]
                }
            },
            {
                "_index": "employee",
                "_type": "_doc",
                "_id": "2",
                "_score": 0.45895916,
                "_source": {
                    "first_name": "Jane",
                    "last_name": "Smith",
                    "age": 32,
                    "about": "I like to collect rock albums",
                    "interests": [
                        "music"
                    ]
                }
            }
        ]
    }
}
```

Elasticsearch  默认按照相关性得分`_score`排序，即**每个文档跟查询的匹配程度**。第一个最高得分的结果很明显：John Smith 的 `about` 属性清楚地写着 "rock climbing" .

<font color="#0000ff">但为什么 Jane Smith 也作为结果返回了呢？原因是她的 `about` 属性里提到了 “rock” 。因为只有 “rock” 而没有 “climbing” ，所以她的相关性得分低于 John 的。</font>

这是一个很好的案例，阐明了 Elasticsearch 如何在`全文属性上搜索并返回相关性最强的结果`。<font color="#ff0000">Elasticsearch中的 *相关性*   概念非常重要，也是完全区别于传统关系型数据库的一个概念，`数据库中的一条记录要么匹配要么不匹配`</font>

<br/>

#### 6. 短语搜索

找出一个属性中的独立单词是没有问题的，但有时候**想要精确匹配一系列单词或者短语** . 

比如， 我们想执行这样一个查询: 仅匹配同时包含 “rock” *和* “climbing” ，*并且*  二者以短语 “rock climbing” 的形式紧挨着的雇员记录。

为此对 `match` 查询稍作调整，使用一个叫做 `match_phrase` 的查询：

```json
// 短语搜索
// 精确匹配一系列单词或者短语 
// 仅匹配同时包含 “rock” 和 “climbing” ，并且 二者以短语 “rock climbing” 的形式紧挨着的雇员记录
GET /employee/_search
{
  "query": {
    "match_phrase": {
      "about": "rock climbing"
    }
  }
}
```

此时, 返回结果仅有 John Smith 的文档:

```json
{
    ......
    "hits": {
        "total": {
            "value": 1,
            "relation": "eq"
        },
        "max_score": 1.4167402,
        "hits": [
            {
                "_index": "employee",
                "_type": "_doc",
                "_id": "1",
                "_score": 1.4167402,
                "_source": {
                    "first_name": "John-put",
                    "last_name": "Smith",
                    "age": 25,
                    "about": "I love to go rock climbing",
                    "interests": [
                        "sports",
                        "music"
                    ]
                }
            }
        ]
    }
}
```

<br/>

#### 7. 高亮搜索

许多应用都倾向于在每个搜索结果中 *高亮*   部分文本片段，以便让用户知道为何该文档符合查询条件。在 Elasticsearch 中检索出高亮片段也很容易。

再次执行前面的查询，并增加一个新的 `highlight` 参数：

```json
// 高亮搜索
// 让用户知道为何该文档符合查询条件
// 当执行该查询时，返回结果与之前一样，与此同时结果中还多了一个叫做 highlight 的部分。这个部分包含了 about 属性匹配的文本片段，并以 HTML 标签 <em></em> 封装
GET /megacorp/_search
{
  "query": {
    "match_phrase": {
      "about": "rock climbing"
    }
  },
  "highlight": {
    "fields": {
      "about": {}
    }
  }
}

```

当执行该查询时，<font color="#0000ff">返回结果与之前一样，与此同时结果中还多了一个叫做 `highlight` 的部分.</font> 这个部分包含了 `about` 属性匹配的文本片段，并以 HTML 标签 `<em></em>` 封装：

```json
{
    ......
        "hits": [
            {
                "_index": "megacorp",
                "_type": "_doc",
                "_id": "1",
                "_score": 0.5753642,
                "_source": {
                    "first_name": "John-put",
                    "last_name": "Smith",
                    "age": 25,
                    "about": "I love to go rock climbing",
                    "interests": [
                        "sports",
                        "music"
                    ]
                },
                "highlight": {
                    "about": [
                        "I love to go <em>rock</em> <em>climbing</em>"
                    ]
                }
            }
        ]
    }
}
```

关于高亮搜索片段，可以在 [highlighting reference documentation](https://www.elastic.co/guide/en/elasticsearch/reference/5.6/search-request-highlighting.html) 了解更多信息.

<br/>

#### 8. 分析

终于到了最后一个业务需求: 支持管理者对员工目录做分析

<font color="#0000ff">Elasticsearch 有一个功能叫聚合（aggregations），允许我们基于数据生成一些精细的分析结果。聚合与 SQL 中的 `GROUP BY` 类似但更强大</font>

举个例子，挖掘出员工中最受欢迎的兴趣爱好:

```json
// 聚合（aggregations）: 分析
// 允许我们基于数据生成一些精细的分析结果, 聚合与 SQL 中的 GROUP BY 类似但更强大
// 例如: 挖掘出员工中最受欢迎的兴趣爱好
// 这些聚合的结果数据并非预先统计，而是根据匹配当前查询的文档即时生成的
GET /employee/_search
{
  "aggs": {
    "all_interests": {
      "terms": {
        "field": "interests"
      }
    }
  }
}
```

<br/>

##### 开启聚合模式

对于高版本来说, 在执行聚合操作时, 可能会报: `typeillegal_argument_exception`异常, 这是由于: <font color="#ff0000">Elastic Search在进行聚合操作时, 都是在内存中进行计算的, 可能会造成OOM错误, 所以默认情况下是关闭的, 可以通过修改`fielddata`字段启用</font>

```json
// ES进行如下聚合操作时，会报如题所示错误:
// "typeillegal_argument_exception", 
// "reason": "Fielddata is disabled on text fields by default. Set fielddata=true on [interests] in order to load fielddata in memory by uninverting the inverted index. Note that this can however use significant memory. Alternatively use a keyword field instead."
PUT employee/_mapping
{
  "properties": {
    "interests": { 
      "type":     "text",
      "fielddata": true
    }
  }
}
```

开启聚合功能之后再次执行, 可以看到结果:

```json
{
   ......
    "aggregations": {
        "all_interests": {
            "doc_count_error_upper_bound": 0,
            "sum_other_doc_count": 0,
            "buckets": [
                {
                    "key": "music",
                    "doc_count": 2
                },
                {
                    "key": "forestry",
                    "doc_count": 1
                },
                {
                    "key": "sports",
                    "doc_count": 1
                }
            ]
        }
    }
}
```

可以看到，两位员工对音乐感兴趣，一位对林业感兴趣，一位对运动感兴趣。<font color="#ff0000">这些聚合的结果数据并非预先统计，而是根据匹配当前查询的文档`即时生成`的。</font>

如果想知道叫 Smith 的员工中最受欢迎的兴趣爱好，可以直接构造一个组合查询：

```json
// 想知道叫 Smith 的员工中最受欢迎的兴趣爱好，可以直接构造一个组合查询
// all_interests 聚合已经变为只包含匹配查询的文档：
GET /employee/_search
{
  "query": {
    "match": {
      "last_name": "smith"
    }
  },
  "aggs": {
    "all_interests": {
      "terms": {
        "field": "interests"
      }
    }
  }
}
```

`all_interests` 聚合已经变为只包含匹配查询的文档：

```json
{
    ......
        "aggregations": {
        "all_interests": {
            "doc_count_error_upper_bound": 0,
            "sum_other_doc_count": 0,
            "buckets": [
                {
                    "key": "music",
                    "doc_count": 2
                },
                {
                    "key": "sports",
                    "doc_count": 1
                }
            ]
        }
    }
}
```

<br/>

聚合还支持分级汇总. 比如，查询特定兴趣爱好员工的平均年龄：

```json
// 聚合还支持分级汇总
// 查询特定兴趣爱好员工的平均年龄：
// 输出基本是第一次聚合的加强版。依然有一个兴趣及数量的列表，只不过每个兴趣都有了一个附加的 avg_age 属性，代表有这个兴趣爱好的所有员工的平均年龄
GET /employee/_search
{
  "aggs": {
    "all_interests": {
      "terms": {
        "field": "interests"
      }, 
      "aggs": {
        "avg_age": {
          "avg": {
            "field": "age"
          }
        }
      }
    }
  }
}
```

得到的聚合结果有点儿复杂，但理解起来还是很简单的：

```json
{
	......
    "aggregations": {
        "all_interests": {
            "doc_count_error_upper_bound": 0,
            "sum_other_doc_count": 0,
            "buckets": [
                {
                    "key": "music",
                    "doc_count": 2,
                    "avg_age": {
                        "value": 28.5
                    }
                },
                {
                    "key": "forestry",
                    "doc_count": 1,
                    "avg_age": {
                        "value": 35
                    }
                },
                {
                    "key": "sports",
                    "doc_count": 1,
                    "avg_age": {
                        "value": 25
                    }
                }
            ]
        }
    }
}
```

输出基本是第一次聚合的加强版。依然有一个兴趣及数量的列表，只不过每个兴趣都有了一个附加的 `avg_age` 属性，代表有这个兴趣爱好的所有员工的平均年龄。

复杂聚合及分组通过Elasticsearch 特性实现得很完美，能够提取的数据类型也没有任何限制



<br/>

----------



### 三. 分布式特性

Elasticsearch 可以横向扩展至数百（甚至数千）的服务器节点，同时可以处理PB级数据。这是由于<font color="#0000ff">Elasticsearch 天生就是分布式的，并且在设计时屏蔽了分布式的复杂性。Elasticsearch 在分布式方面几乎是透明的!</font>

#### 0. 分布式集群综述

Elasticsearch 尽可能地屏蔽了分布式系统的复杂性。这里列举了**一些在后台自动执行的操作**：

-   分配文档到不同的容器  或 *分片* 中，文档可以储存在一个或多个节点中 
-   按集群节点来均衡分配这些分片，从而对索引和搜索过程进行负载均衡 
-   复制每个分片以支持数据冗余，从而防止硬件故障导致的数据丢失 
-   将集群中任一节点的请求路由到存有相关数据的节点 
-   集群扩容时无缝整合新节点，重新分配分片以便从离群节点恢复 

ElasticSearch 的主旨是**随时可用和按需扩容**。 而扩容可以通过购买性能更强大（ *垂直扩容* ，或 *纵向扩容* ） 或者数量更多的服务器（ *水平扩容* ，或 *横向扩容* ）来实现

虽然 Elasticsearch 可以获益于更强大的硬件设备，但是垂直扩容是有极限的。 真正的扩容能力是来自于水平扩容--为集群添加更多的节点，并且将负载压力和稳定性分散到这些节点中

对于大多数的数据库而言，通常需要对应用程序进行非常大的改动，才能利用上横向扩容的新增资源。 与之相反的是，<font color="#0000ff">ElastiSearch天生就是 *分布式的* ，它知道如何通过管理多节点来提高扩容性和可用性, 这也意味着你的应用无需关注这个问题。</font>

<br/>

#### 1. 空集群

如果我们启动了一个单独的节点，里面不包含任何的数据和
索引，那我们的集群看起来就是一个**包含空内容节点的集群**

![包含空内容节点的集群](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/包含空内容节点的集群.png)

<font color="#ff0000">一个运行中的 Elasticsearch 实例称为一个`节点`，而集群是由一个或者多个拥有相同 `cluster.name` 配置的节点组成， 它们共同承担数据和负载的压力。当有节点加入集群中或者从集群中移除节点时，集群将会*重新平均分布所有的数据*。</font>

<font color="#0000ff">当一个节点被选举成为 *主* 节点时， 它将负责管理集群范围内的所有变更，例如`增加、删除索引，或者增加、删除节点`等。</font> <font color="#ff0000">而主节点并不需要涉及到文档级别的变更和搜索等操作，所以当集群只拥有一个主节点的情况下，即使流量的增加它也不会成为瓶颈!</font> 任何节点都可以成为主节点。我们的示例集群就只有一个节点，所以它同时也成为了主节点。

作为用户，我们<font color="#0000ff">可以将请求发送到 *集群中的任何节点* ，包括主节点。 每个节点都知道任意文档所处的位置，并且能够将我们的请求直接转发到存储我们所需文档的节点。 无论我们将请求发送到哪个节点，它都能负责从各个包含我们所需文档的节点收集回数据，并将最终结果返回給客户端。</font> **Elasticsearch 对这一切的管理都是透明的。**

<br/>

#### 2. 集群健康

Elasticsearch 的集群监控信息中包含了许多的统计数据，其中最为重要的一项就是 *集群健康* ，它在 `status` 字段中展示为 `green` 、 `yellow` 或者 `red` 

```json
// 集群健康
// Elasticsearch 的集群监控信息中包含了许多的统计数据，其中最为重要的一项就是 集群健康 ， 它在 status 字段中展示为 green 、 yellow 或者 red
// status 字段是我们最关心的
// status 字段指示着当前集群在总体上是否工作正常
GET /_cluster/health
```

在一个不包含任何索引的空集群中，它将会有一个类似于如下所示的返回内容：

```json
{
    "cluster_name": "elasticsearch",
    "status": "yellow",
    "timed_out": false,
    "number_of_nodes": 1,
    "number_of_data_nodes": 1,
    "active_primary_shards": 6,
    "active_shards": 6,
    "relocating_shards": 0,
    "initializing_shards": 0,
    "unassigned_shards": 4,
    "delayed_unassigned_shards": 0,
    "number_of_pending_tasks": 0,
    "number_of_in_flight_fetch": 0,
    "task_max_waiting_in_queue_millis": 0,
    "active_shards_percent_as_number": 60
}
```

>   `status` 字段是我们最关心的。

`status` 字段指示着当前集群在总体上是否工作正常。它的三种颜色含义如下：

-    `green` 

    ​    所有的主分片和副本分片都正常运行。 

-    `yellow` 

       <font color="#ff0000">所有的主分片都正常运行，但不是所有的副本分片都正常运行</font> 

-    `red` 

    ​    有主分片没能正常运行。 

<br/>

#### 3. 添加索引

<font color="#0000ff">索引实际上是指向一个或者多个物理 *分片* 的 *逻辑命名空间* . 一个 *分片* 是一个底层的 *工作单元* ，它仅保存了 全部数据中的一部分, 一个分片是一个 Lucene 的实例，它本身就是一个完整的搜索引擎.</font> <font color="#ff0000">我们的文档被存储和索引到分片内，但是应用程序是直接与索引而不是与分片进行交互!</font>

<font color="#0000ff">Elasticsearch 是利用分片将数据分发到集群内各处的。分片是数据的容器，文档保存在分片内，分片又被分配到集群内的各个节点里。</font> <font color="#ff0000">当你的集群规模扩大或者缩小时， Elasticsearch 会自动的在各节点中迁移分片，使得数据仍然均匀分布在集群里。</font>

<font color="#ff0000">一个分片可以是 *主* 分片或者 *副本* 分片。  索引内任意一个文档都归属于一个主分片，所以主分片的数目决定着索引能够保存的最大数据量。</font>

>   技术上来说，一个主分片最大能够存储 Integer.MAX_VALUE - 128 个文档，但是实际最大值还需要参考你的使用场景：包括你使用的硬件，
>   文档的大小和复杂程度，索引和查询文档的方式以及你期望的响应时长。

<font color="#ff0000">一个副本分片只是一个主分片的拷贝。 副本分片作为硬件故障时保护数据不丢失的冗余备份，并为搜索和返回文档等*读操作*提供服务。</font>

<font color="#ff0000">在索引建立的时候就已经确定了主分片数，但是副本分片数可以随时修改。</font>

让我们在包含一个空节点的集群内创建名为 `blogs` 的索引。  <font color="#ff0000">索引在默认情况下会被分配5个主分片，</font>   但是为了演示目的，我们将分配3个主分片和一份副本（每个主分片拥有一个副本分片）：

```json
// 添加索引
// 在包含一个空节点的集群内创建名为 blogs 的索引
// 索引在默认情况下会被分配5个主分片， 但是为了演示目的，我们将分配3个主分片和一份副本（每个主分片拥有一个副本分片）
PUT /blogs
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1
  }
}

```

我们的集群现在是`拥有一个索引的单节点集群`. 所有3个主分片都被分配在 `Node 1` 。

![拥有一个索引的单节点集群](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/拥有一个索引的单节点集群.png)

<br/>

如果我们现在查看`集群健康`，我们将看到如下内容：

```json
GET /_cluster/health


{
    "cluster_name": "elasticsearch",
    "status": "yellow",
    "timed_out": false,
    "number_of_nodes": 1,
    "number_of_data_nodes": 1,
    "active_primary_shards": 6,
    "active_shards": 6,
    "relocating_shards": 0,
    "initializing_shards": 0,
    "unassigned_shards": 4,
    "delayed_unassigned_shards": 0,
    "number_of_pending_tasks": 0,
    "number_of_in_flight_fetch": 0,
    "task_max_waiting_in_queue_millis": 0,
    "active_shards_percent_as_number": 60
}
```

>   集群 `status` 值为 `yellow` 。
>
>   没有被分配到任何节点的副本数。

集群的健康状况为 `yellow` 则表示全部 *主* 分片都正常运行（集群可以正常服务所有请求），<font color="#0000ff">但是 *副本* 分片没有全部处在正常状态。</font> 

实际上，所有3个副本分片都是 `unassigned` —— 它们都没有被分配到任何节点。 <font color="#0000ff">在同一个节点上既保存原始数据又保存副本是没有意义的，因为一旦失去了那个节点，我们也将丢失该节点上的所有副本数据。</font>

<font color="#0000ff">当前我们的集群是正常运行的，但是在硬件故障时有丢失数据的风险。</font>

<br/>



#### 4. 添加故障转移

当集群中只有一个节点在运行时，意味着会有一个单点故障问题——没有冗余。幸运的是，我们只需再启动一个节点即可防止数据丢失!

**启动第二个节点**

为了测试第二个节点启动后的情况，你可以参考我的另一篇文章, 里面很详细的讲述了如何在单机部署两个ES: [在单台服务器部署多个ElasticSearch节点](https://jasonkayzk.github.io/2019/10/04/%E5%9C%A8%E5%8D%95%E5%8F%B0%E6%9C%8D%E5%8A%A1%E5%99%A8%E9%83%A8%E7%BD%B2%E5%A4%9A%E4%B8%AAElasticSearch%E8%8A%82%E7%82%B9/)

如果启动了第二个节点，我们的集群将会如图:

![拥有两个节点的集群](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/拥有两个节点的集群.png)

<br/>

<font color="#ff0000">当第二个节点加入到集群后，3个 *副本分片* 将会分配到这个节点上——每个主分片对应一个副本分片。</font> 这意味着当集群内任何一个节点出现问题时，我们的数据都完好无损。

<font color="#ff0000">所有新近被索引的文档都将会保存在主分片上，然后被并行的复制到对应的副本分片上。这就保证了我们既可以从主分片又可以从副本分片上获得文档!</font>

`cluster-health` 现在展示的状态为 `green` ，这表示所有6个分片（包括3个主分片和3个副本分片）都在正常运行!

```json
{
  "cluster_name": "elasticsearch",
  "status": "green", 
  "timed_out": false,
  "number_of_nodes": 2,
  "number_of_data_nodes": 2,
  "active_primary_shards": 3,
  "active_shards": 6,
  "relocating_shards": 0,
  "initializing_shards": 0,
  "unassigned_shards": 0,
  "delayed_unassigned_shards": 0,
  "number_of_pending_tasks": 0,
  "number_of_in_flight_fetch": 0,
  "task_max_waiting_in_queue_millis": 0,
  "active_shards_percent_as_number": 100
}
```

<br/>

#### 5. 水平扩容

当启动了第三个节点，我们的集群将会看起来如图:

![拥有三个节点的集群](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/拥有三个节点的集群.png)

`Node 1` 和 `Node 2` 上各有一个分片被迁移到了新的 `Node 3` 节点，现在每个节点上都拥有2个分片，而不是之前的3个。 这表示<font color="#ff0000">每个节点的硬件资源（CPU, RAM, I/O）将被更少的分片所共享，每个分片的性能将会得到提升。</font>

<font color="#ff0000">分片是一个功能完整的搜索引擎，它拥有使用一个节点上的所有资源的能力。</font> <font color="#0000ff">我们这个拥有6个分片（3个主分片和3个副本分片）的索引可以最大扩容到6个节点，每个节点上存在一个分片，并且每个分片拥有所在节点的全部资源。</font>

**更多的扩容!**

但是如果我们想要扩容超过6个节点怎么办呢？

<font color="#ff0000">主分片的数目在索引创建时就已经确定了下来。实际上，这个数目定义了这个索引能够 *存储* 的最大数据量!</font>（实际大小取决于你的数据、硬件和使用场景。） 但是，<font color="#ff0000">读操作——搜索和返回数据——可以同时被主分片 *或* 副本分片所处理，所以当你拥有越多的副本分片时，也将拥有越高的吞吐量。</font>

<font color="#ff0000">在运行中的集群上是可以*动态调整副本分片数目*的 ，我们可以按需伸缩集群。</font>让我们把副本数从默认的 `1` 增加到 `2` :

```json
PUT /blogs/_settings
{
   "number_of_replicas" : 2
}

```

将参数 `number_of_replicas` 调大到 2 `blogs` 索引现在拥有9个分片：3个主分片和6个副本分片。这意味着我们可以将集群扩容到9个节点，每个节点上一个分片。相比原来3个节点时，集群搜索性能可以提升 *3* 倍:

![将参数number_of_replicas调大到2](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/将参数number_of_replicas调大到2.png)

<br/>

>   **注:** 如果<font color="#ff0000">只是在相同节点数目的集群上增加更多的副本分片并不能提高性能，因为每个分片从节点上获得的资源会变少。 你需要增加更多的硬件资源来提升吞吐量!</font>
>
>   但是更多的副本分片数提高了数据冗余量：按照上面的节点配置，我们可以在失去2个节点的情况下不丢失任何数据。

<br/>

#### 6. 应对故障

Elasticsearch 可以应对节点故障，如果我们关闭第一个节点，这时集群的状态为下图所示:

![关闭了一个节点后的集群](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/关闭了一个节点后的集群.png)

<br/>

我们关闭的节点是一个主节点。<font color="#0000ff">而集群必须拥有一个主节点来保证正常工作，所以发生的第一件事情就是选举一个新的主节点： `Node 2` 。</font>

<font color="#ff0000">在我们关闭 `Node 1` 的同时也失去了主分片 `1` 和 `2` ，并且在缺失主分片的时候索引也不能正常工作。   如果此时来检查集群的状况，我们看到的状态将会为 `red` ：不是所有主分片都在正常工作。</font>

幸运的是，<font color="#ff0000">在其它节点上存在着这两个主分片的完整副本， 所以新的主节点立即将这些分片在 `Node 2` 和 `Node 3` 上对应的副本分片提升为主分片， 此时集群的状态将会为 `yellow` 。 这个提升主分片的过程是瞬间发生的，如同按下一个开关一般。</font>

为什么我们集群状态是 `yellow` 而不是 `green` 呢？ <font color="#0000ff">虽然我们拥有所有的三个主分片，但是同时设置了每个主分片需要对应2份副本分片，而此时只存在一份副本分片。</font> 所以集群不能为 `green` 的状态，不过我们不必过于担心：<font color="#ff0000">如果我们同样关闭了 `Node 2` ，我们的程序 *依然* 可以保持在不丢任何数据的情况下运行，因为 `Node 3` 为每一个分片都保留着一份副本!</font>

<font color="#0000ff">如果我们重新启动 `Node 1` ，集群可以将缺失的副本分片再次进行分配，那么如果 `Node 1` 依然拥有着之前的分片，它将尝试去重用它们，同时仅从主分片复制发生了修改的数据文件。</font>



<br/>

---------------



### 附录

文章参考:

-   [ES官方文档](https://www.elastic.co/guide/cn/elasticsearch/guide/current/intro.html)

<br/>

示例代码: https://github.com/JasonkayZK/ElasticSearch_Learn/tree/master/chapter1_basic


