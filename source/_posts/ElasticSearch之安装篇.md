---
title: ElasticSearch之安装篇
toc: true
date: 2019-10-02 15:26:42
categories: [ElasticSearch]
tags: [ElasticSearch]
description: 本篇作为ElasticSearch学习的入门篇, 主要讲解了ElasticSearch的基本概念, 以及ElasticSearch的安装与简单配置, 主要是为接下来ElasticSearch热身.
---

![ElasticSearch](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1570012601164&di=e7d7a24dc0375f5728f840b0722c89b0&imgtype=0&src=http%3A%2F%2Fpic2.zhimg.com%2Fv2-d6d239c55b93b2745b6c4ff516fa939f_1200x500.jpg)

本篇主要讲述了ElasticSearch的基本概念, 以及ElasticSearch的安装与简单配置, 主要是为接下来ElasticSearch热身.

主要内容包括:

-   Elastic Search相关介绍
-   Elastic Search安装与配置
-   Kibana安装
-   一些由于版本兼容而导致的坑
-   ......



<!--more-->

## ElasticSearch之安装篇

### 一. Elastic Search相关介绍

#### 1. ElasticSearch是什么

Elasticsearch是一个基于Apache Lucene(TM)的开源搜索引擎，无论在开源还是专有领域，Lucene可以被认为是迄今为止最先进、性能最好的、功能最全的搜索引擎库。 <font color="#ff0000">但是，Lucene只是一个库。想要发挥其强大的作用，你需使用Java并要将其集成到你的应用中。Lucene非常复杂，你需要深入的了解检索相关知识来理解它是如何工作的。 </font> 

Elasticsearch也是使用Java编写并使用Lucene来建立索引并实现搜索功能，但是它的目的是<font color="#0000ff">通过简单连贯的RESTful API让全文搜索变得简单并隐藏Lucene的复杂性。</font> 不过，Elasticsearch不仅仅是Lucene和全文搜索引擎，它还提供：

-   分布式的实时文件存储，每个字段都被索引并可被搜索
-   实时分析的分布式搜索引擎
-   可以扩展到上百台服务器，处理PB级结构化或非结构化数据

而且，所有的这些功能被集成到一台服务器，你的应用<font color="#ff0000">可以通过简单的RESTful  API、各种语言的客户端甚至命令行与之交互</font>。上手Elasticsearch非常简单，它提供了许多合理的缺省值，并对初学者隐藏了复杂的搜索引擎理论。它开箱即用（安装即可使用），只需很少的学习既可在生产环境中使用。Elasticsearch在Apache  2 license下许可使用，可以免费下载、使用和修改。 随着知识的积累，你可以根据不同的问题领域定制Elasticsearch的高级特性，这一切都是可配置的，并且配置非常灵活。

<br/>

#### 2. Elasticsearch中涉及到的重要概念

Elasticsearch有几个核心概念。从一开始理解这些概念会对整个学习过程有莫大的帮助。

-   接近实时(NRT)
    Elasticsearch**是一个接近实时的搜索平台**。这意味着，从索引一个文档直到这个文档能够被搜索到有一个轻微的延迟（通常是1秒）。

-   集群(cluster)

    一个集群就是由一个或多个节点组织在一起，它们共同持有你整个的数据，并一起提供索引和搜索功能。<font color="#ff0000">一个集群由一个唯一的名字标识，这个名字默认就是`elasticsearch`。</font>这个名字是重要的，因为一个节点只能通过指定某个集群的名字，来加入这个集群。在产品环境中显式地设定这个名字是一个好习惯，但是使用默认值来进行测试/开发也是不错的。

-   节点(node)
    <font color="#ff0000">一个节点是你集群中的一个服务器，作为集群的一部分，它存储你的数据，参与集群的索引和搜索功能。</font>和集群类似，<font color="#0000ff">一个节点也是由一个名字来标识的，默认情况下，这个名字是一个随机的漫威漫画角色的名字，这个名字会在启动的时候赋予节点。</font>这个名字对于管理工作来说挺重要的，因为在这个管理过程中，你会去确定网络中的哪些服务器对应于Elasticsearch集群中的哪些节点。

    <font color="#ff0000">一个节点可以通过配置集群名称的方式来加入一个指定的集群。默认情况下，每个节点都会被安排加入到一个叫做`elasticsearch`的集群中，这意味着，如果你在你的网络中启动了若干个节点，并假定它们能够相互发现彼此，它们将会自动地形成并加入到一个叫做elasticsearch的集群中。</font>在一个集群里，只要你想，可以拥有任意多个节点。而且，如果当前你的网络中没有运行任何Elasticsearch节点，这时启动一个节点，会默认创建并加入一个叫做`elasticsearch`的集群。

-   索引(index)
    <font color="#ff0000">一个索引就是一个拥有几分相似特征的文档的集合。</font>比如说，你可以有一个客户数据的索引，另一个产品目录的索引，还有一个订单数据的索引。一个索引由一个名字来标识（必须全部是小写字母的），并且当我们要对对应于这个索引中的文档进行索引、搜索、更新和删除的时候，都要使用到这个名字。<font color="#ff0000">索引类似于关系型数据库中Database的概念。在一个集群中，如果你想，可以定义任意多的索引。</font>

-   类型(type) - Deprecated!

-   文档(document)
    <font color="#ff0000">一个文档是一个可被索引的基础信息单元。</font>比如，你可以拥有某一个客户的文档，某一个产品的一个文档，当然，也可以拥有某个订单的一个文档。<font color="#ff0000">文档以JSON（Javascript  Object Notation）格式来表示，而JSON是一个到处存在的互联网数据交互格式。</font>

    在一个index/type里面，只要你想，你可以存储任意多的文档。注意，<font color="#ff0000">尽管一个文档，物理上存在于一个索引之中，文档必须被索引/赋予一个索引的type。文档类似于关系型数据库中Record的概念。</font><font color="#0000ff">实际上一个文档除了用户定义的数据外，还包括`_index`、`_type`和`_id`字段。</font>

-   分片和复制(shards & replicas)
    <font color="#0000ff">一个索引可以存储超出单个结点硬件限制的大量数据。比如，一个具有10亿文档的索引占据1TB的磁盘空间，而任一节点都没有这样大的磁盘空间；或者单个节点处理搜索请求，响应太慢。</font>

    为了解决这个问题，Elasticsearch提供了<font color="#ff0000">将索引划分成多份的能力，这些份就叫做分片。</font>当你创建一个索引的时候，你可以指定你想要的分片的数量。每个分片本身也是一个功能完善并且独立的“索引”，这个“索引”可以被放置到集群中的任何节点上。 
    分片之所以重要，主要有两方面的原因：

    -   允许你水平分割/扩展你的内容容量
    -   允许你在分片（潜在地，位于多个节点上）之上进行分布式的、并行的操作，进而提高性能/吞吐量

    

    <font color="#ff0000">至于一个分片怎样分布，它的文档怎样聚合回搜索请求，是完全由Elasticsearch管理的，对于作为用户的你来说，这些都是透明的。</font>

在一个网络/云的环境里，失败随时都可能发生，在某个分片/节点不知怎么的就处于离线状态，或者由于任何原因消失了。这种情况下，有一个故障转移机制是非常有用并且是强烈推荐的。为此目的，Elasticsearch允许你<font color="#ff0000">创建分片的一份或多份拷贝，这些拷贝叫做复制分片，或者直接叫复制。</font>复制之所以重要，主要有两方面的原因：

-   在分片/节点失败的情况下，提供了高可用性。因为这个原因，注意到复制分片从不与原/主要（original/primary）分片置于同一节点上是非常重要的。
-   扩展你的搜索量/吞吐量，因为搜索可以在所有的复制上并行运行

总之，<font color="#ff0000">每个索引可以被分成多个分片。一个索引也可以被复制0次（意思是没有复制）或多次。</font><font color="#0000ff">一旦复制了，每个索引就有了主分片（作为复制源的原来的分片）和复制分片（主分片的拷贝）之别。</font>分片和复制的数量可以在索引创建的时候指定。在索引创建之后，你可以在任何时候动态地改变复制数量，但是不能改变分片的数量。

<font color="#ff0000">默认情况下，Elasticsearch中的每个索引被分片5个主分片和1个复制，这意味着，如果你的集群中至少有两个节点，你的索引将会有5个主分片和另外5个复制分片（1个完全拷贝），这样的话每个索引总共就有10个分片。</font><font color="#0000ff">一个索引的多个分片可以存放在集群中的一台主机上，也可以存放在多台主机上，这取决于你的集群机器数量。主分片和复制分片的具体位置是由ES内在的策略所决定的。</font>



<br/>

----------



### 二. Elastic Search安装与配置

本教程主要讲解在Linux下ES7.4.0(截止到2019/10/2最新版本)的安装与配置, 其他平台可以参考官方文档: https://www.elastic.co/cn/downloads/elasticsearch

#### 1. 下载

可以在[Elastic Search官方网站](https://www.elastic.co/cn/downloads/elasticsearch)下载.tar.gz格式的压缩文件.

#### 2. 解压缩

然后通过命令解压压缩文件到指定目录, 我的是解压到/opt/目录下

```bash
sudo tar -zxvf elasticsearch-7.4.0-linux-x86_64.tar.gz -C /opt/
```

#### 3. 修改用户权限或者文件所属

我是通过修改文件所属

```bash
cd /opt/
sudo chown zk:zk -R elasticsearch-7.4.0/
```

#### 4. 修改环境变量

```bash
# 对当前用户有效, 若要对全部用户有效, 可修改/etc/profile
$ vi ~/.bashrc

# 添加以下内容
export ES_HOME=/opt/elasticsearch-7.4.0
export PATH=$PATH:${ES_HOME}/bin

# 使修改立即生效
$ source ~/.bashrc
```

<br/>

#### 5. 测试运行

通过`elasticsearch`命令便可以直接运行!

运行时需要提前安装并配置好JVM环境, 因为ES是使用Java写的, 并且如果你的JDK版本为11以下, 则会有如下提醒:

```
future versions of Elasticsearch will require Java 11; your Java version from [/usr/lib/jvm/java-8-oracle/jre] does not meet this requirement
```

再打开另外一个控制台, 并输入:

```bash
curl http://localhost:9200/
```

或者使用浏览器打开: http://localhost:9200/

最终返回:

```json
{
  "name" : "JasonkayZK",
  "cluster_name" : "elasticsearch",
  "cluster_uuid" : "KUS8-G-XQMS2ZwsHPnR_UA",
  "version" : {
    "number" : "7.4.0",
    "build_flavor" : "default",
    "build_type" : "tar",
    "build_hash" : "22e1767283e61a198cb4db791ea66e3f11ab9910",
    "build_date" : "2019-09-27T08:36:48.569419Z",
    "build_snapshot" : false,
    "lucene_version" : "8.2.0",
    "minimum_wire_compatibility_version" : "6.8.0",
    "minimum_index_compatibility_version" : "6.0.0-beta1"
  },
  "tagline" : "You Know, for Search"
}

```

则说明ES安装成功!

**注: **

-   <font color="#ff0000">服务默认占用的是9200端口, 如启动失败, 有可能是JVM配置问题, 或者9200端口被占用!</font>

-   <font color="#ff0000">仅仅使用`elasticsearch`命令将在前台启动ES服务, 此时退出控制台将会退出ES服务! 如果想要在后台开启服务:</font>

    ```bash
     ./elasticsearch –d #在后台运行Elasticsearch
    
     ./elasticsearch -d -Xmx2g -Xms2g #后台启动，启动时指定内存大小（2G）
    
     ./elasticsearch -d -Des.logger.level=DEBUG  #可以在日志中打印出更加详细的信息
    ```

    详细请参考: [es官方文档](https://www.elastic.co/guide/index.html)



<br/>

--------



### 三. Kibana安装

仅仅使用ElasticSearch提供的命令终端来管理ES是很不方便的, 好在ES为我们提供了更加方便的可视化工具Kibana!

<font color="#00ff00">Kibana是一个开源的分析和可视化平台，设计用于和Elasticsearch一起工作。你用Kibana来搜索，查看，并和存储在Elasticsearch索引中的数据进行交互。</font>你可以轻松地执行高级数据分析，并且以各种图标、表格和地图的形式可视化数据。Kibana使得理解大量数据变得很容易。它简单的、基于浏览器的界面使你能够快速创建和共享动态仪表板，实时显示Elasticsearch查询的变化。

#### 1. 下载

可以在[Kibana官方网站](https://www.elastic.co/cn/downloads/kibana)下载.tar.gz格式的压缩文件.

#### 2. 解压缩

然后通过命令解压压缩文件到指定目录, 我的是解压到/opt/目录下

```bash
sudo tar -zxvf kibana-7.4.0-linux-x86_64.tar.gz -C /opt/
```

#### 3. 修改用户权限或者文件所属

我是通过修改文件所属

```bash
cd /opt/
sudo chown zk:zk -R kibana-7.4.0-linux-x86_64/
```

#### 4. 修改环境变量

```bash
# 对当前用户有效, 若要对全部用户有效, 可修改/etc/profile
$ vi ~/.bashrc

# 添加以下内容
export KIBANA_HOME=/opt/kibana-7.4.0-linux-x86_64
export PATH=$PATH:${KIBANA_HOME}/bin

# 使修改立即生效
$ source ~/.bashrc
```

<br/>

#### 5. 测试运行

在终端输入`kibana`即可运行, 需要注意的是:

-   <font color="#ff0000">Kibana依赖于ES的运行, 必须先要开启本地的ES服务才能使用Kibana!</font>
-   <font color="#ff0000">Kibana服务会占用5601端口, 在启动kibana之前请先排除端口占用问题!</font>

启动之后, 可以通过浏览器访问: http://localhost:5601

便可获得一个可视化的平台!

对于Kibana的使用本文不再赘述, 大家可以移步下面网站学习: 

-   [Kibana（一张图片胜过千万行日志）](https://www.cnblogs.com/cjsblog/p/9476813.html)
-   [Kibana官方教程](https://www.elastic.co/guide/en/kibana/current/index.html)



<br/>

----------



### 四. 一些在安装时的坑

#### 1. 通过 kibana 安装sense失败

通过官方教程进行学习的时候, 要求安装Sense插件, 其中的命令为:

```bash
# 在 Kibana 目录下运行下面的命令，下载并安装 Sense app：
./bin/kibana plugin --install elastic/sense
```

但是在7.x版本中已经不再支持这个命令了!

<font color="#0000ff">可以使用新的命令`kibana-plugin`进行安装</font>:

```bash
$ ./bin/kibana-plugin -h

  Usage: bin/kibana-plugin [command] [options]
  
  The Kibana plugin manager enables you to install and remove plugins that provide additional functionality to Kibana
  
  Commands:
    list  [options]                 list installed plugins
    install  [options] <plugin/url> install a plugin
    remove  [options] <plugin>      remove a plugin
    help  <command>                 get the help for a specific command
```

但是仍然无法安装sense插件, 原因是:

<font color="#ff0000">从5.x版本之后, 就已经有了sense的功能, 所以不再需要安装! es5.0以后的版本x-pack提供的DevTools代替了sense, 即上文访问的控制台!</font>

<br/>

#### 2. 使用curl与head插件出现不能查询数据的异常

使用elasticsearch时，curl与head插件都出现不能查询数据的异常，具体原因如下

```json
{
  "error" : "Content-Type header [application/x-www-form-urlencoded] is not supported",
  "status" : 406
}
```

<font color="#ff0000">此原因时由于ES增加了安全机制， 进行严格的内容类型检查，严格检查内容类型也可以作为防止跨站点请求伪造攻击的一层保护。</font>

具体原因见官网: [官网解释](https://www.elastic.co/blog/strict-content-type-checking-for-elasticsearch-rest-requests)

<font color="#0000ff">es5没有严格检查的，可以设置参数，以增加安全性</font>

```
http.content_type.required
```

**解决方法: **

<font color="#ff0000">添加请求头即可正常查询</font>

```bash
 curl -H "Content-Type: application/json" http://localhost:9200/_search?pretty  -d ' {"query": {"match_all": {}}}'
```



<br/>

----------



### 附录

参考文章

-   [Elasticsearch基础教程](http://blog.csdn.net/cnweike/article/details/33736429)
-   [Kibana（一张图片胜过千万行日志）](https://www.cnblogs.com/cjsblog/p/9476813.html)
-   [通过 kibana 安装sense失败](https://elasticsearch.cn/question/3709)
-   [Content-Type header [application/x-www-form-urlencoded] is not supported](https://blog.csdn.net/wangxilong1991/article/details/80618082)




