---
title: 在单台服务器部署多个ElasticSearch节点
toc: true
date: 2019-10-03 16:35:55
categories: [ElasticSearch]
tags: [ElasticSearch]
description: 本篇作为Elastic Search的伴随篇, 主要解决如何在单机上部署多个Elastic Search实例, 模拟并学习集群.
---

![ElasticSearch](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1570012601164&di=e7d7a24dc0375f5728f840b0722c89b0&imgtype=0&src=http%3A%2F%2Fpic2.zhimg.com%2Fv2-d6d239c55b93b2745b6c4ff516fa939f_1200x500.jpg)

<br/>

对于想要学习ES的人来说, 集群是一个不得不谈的话题, 而且就目前的形式来说, 越来越要求开发人员会用分布式. 对于ES来说, 由于其本身对分布式集群已经支持的相当完善, 已经屏蔽了大多数的服务发现, fallover等. 但是学习集群首先要有一个集群, 对于大多数人来说, 还是希望在本地运行一个集群. 所以本篇是在笔者查阅了大量资料之后, 经过尝试总结的在ES 7.x版本下如何在单节点下运行ES集群.

阅读本文你将学会:

-   



<!--more-->

## 在单台服务器部署多个ElasticSearch节点

在单台服务器上部署多个ES节点的方法不止一种, 如果在有docker的运行环境下使用docker来部署是最干净,快捷的. 而笔者想找到通过命令行在启动时读入配置文件启动的方法, 结果最后发现此功能在6.x版本已经被废除, 坑啊!

废话不多说了, 下面来看如何在单节点下部署多个ES节点.

### 一. 复制多份ES副本, 通过修改配置文件启动

这个方法是最为简单粗暴的, 在任何版本下都可以使用! 下面来详细介绍一下.

#### 1. 首先将ES文件复制两份

我的ES安装在`/opt/`目录下, 你在使用时应该修改为自己的安装路径

```bash
# 复制
sudo cp -r elasticsearch-7.4.0/ elasticsearch-node-1
sudo cp -r elasticsearch-7.4.0/ elasticsearch-node-2

# 修改所属
sudo chown -R zk:zk elasticsearch-node-1
sudo chown -R zk:zk elasticsearch-node-2
```

<br/>

#### 2. 修改配置文件

<blue>配置文件默认在`%ES_HOME/config`下面, 我们要修改的是`elasticsearch.yml`文件,</font> 配置如下:

```yaml
# node-1的配置文件
cluster.name: zk-app # 集群名称, 相同集群必须相同
node.name: node-1 # 节点名, 不同节点必须不同
network.host: 127.0.0.1 # 服务器ip地址
http.port: 9200 # http访问端口
transport.tcp.port: 9300 # 集群内部通讯访问端口
discovery.zen.ping.unicast.hosts: ["127.0.0.1:9300", "127.0.0.1:9301"] # 配置多节点

# node-2的配置文件
cluster.name: zk-app
node.name: node-2
network.host: 127.0.0.1 # 服务器ip地址
http.port: 9201 # http访问端口
transport.tcp.port: 9301 # 集群内部通讯访问端口
discovery.zen.ping.unicast.hosts: ["127.0.0.1:9300", "127.0.0.1:9301"] # 配置多节点
```

**注: **这个配置是很简单的配置, 生产环境中的配置文件更为复杂, 如果想要查看配置文件的全部参数, 可以查看官方文档或网上相关信息, 这里不再赘述!

<br/>

#### 3. 启动节点

分别在elasticSearch的根目录下执行

```bash
./bin/elasticsearch
```

运行节点.

以笔者为例, 我先启动了node-1服务, 然后启动了node-2服务. 之后通过命令:

```bash
GET /_cluster/health
```

查看集群健康状况则返回: 

```json
{
    "cluster_name": "zk-app",
    "status": "green",
    "timed_out": false,
    "number_of_nodes": 2,
    "number_of_data_nodes": 2,
    "active_primary_shards": 8,
    "active_shards": 16,
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

或者使用kibana打开浏览器进入`Stack Monitoring`中查看, 如下图所示:

![kibana观察集群情况]()

可以看到的确有两个节点在工作, 集群启动成功!

#### 4. 启动时可能出现的问题

##### Error: with the same id but is a different node instance

<blue>如果之前在复制时的文件目录中以及存在data数据了, 则在从节点启动时, 可能会发生节点冲突的错误! 因为之前节点的信息已经被保存在data文件夹中了</font>

**解决方法: **<red>删除data目录即可!</font>

<br/>



----------------



### 二. 使用启动参数(Options)启动

由于每次启动一个节点都要复制所有的ES文件, 可以说相当的麻烦, 所以有没有更为简单的方法, <red>可以通过多个配置文件分别启动一个节点.</font>

对于这种情况, 笔者在网上搜集了很多信息, 答案是: **分版本!**

-   对于5.x以下版本: 可通过对Java添加`-Des.default.path.conf=/etc/elasticsearch`启动参数根据指定的**配置文件目录**启动, 其中`/etc/elasticsearch`即为你实际的配置文件目录. 如:

    ```bash
    ${JAVA_HOME}/bin/java  \
                -Des.pidfile=/path/xxx.pid \
                -Des.default.path.home=/path/xxx \
                -Des.default.path.logs=/path/logs \
                -Des.default.path.data=/path/data \
                -Des.default.path.work=/path/work \
                -Des.default.path.conf=/path/config \
                -Des.path.home=/path/xxx \
                -cp :/path/xxx.jar \
                org.elasticsearch.bootstrap.Elasticsearch
    ```

    elasticsearch启动类有两个，分别是Elasticsearch和ElasticsearchF，其中F代表foreground，区别是在前台进程运行还是后台进程运行，以及日志是存储在日志文件中还是显示在控制台中，System.setProperty("es.foreground",
    "yes")用来指定foreground。
    两个启动类最终都是调用Bootstrap的静态main方法来启动elasticsearch

-   对于5.x版本, 可以使用elasticsearch的启动参数启动, 添加`-- default.path.conf=/etc/elasticsearch`. 如:

    ```bash
    ./bin/elasticsearch --default.path.conf=/etc/elasticsearch
    ```

    或使用elasticsearch的`-E参数`修改配置启动. 如:

    ```bash
    ./bin/elasticsearch -E path.conf=/etc/elasticsearch
    ```

    <red>对于上面这两种方法, 笔者不确定是哪个, 因为在笔者7.x版本下, 都启动失败!</font>

-   对于6.x版本及以上, 恭喜你, 你再也无法使用配置文件直接启动啦!(丢!)

>   对于删除`path.conf`参数官方给出的解释:
>
>   ### `path.conf` is no longer a configurable setting[edit](https://github.com/elastic/elasticsearch/edit/6.2/docs/reference/migration/migrate_6_0/packaging.asciidoc)
>
>   Previous versions of Elasticsearch enabled setting `path.conf` as a setting. This was rather convoluted as it meant that you could start Elasticsearch with a config file that specified via `path.conf` that Elasticsearch should use another config file. Instead, to configure a custom config directory, use the [`ES_PATH_CONF` environment variable](https://www.elastic.co/guide/en/elasticsearch/reference/6.2/settings.html#config-files-location).
>
>   官方文档: https://www.elastic.co/guide/en/elasticsearch/reference/6.2/breaking_60_packaging_changes.html
>
>   中文翻译ES6.0变化: [Elasticsearch 6.0 重大变化](https://blog.csdn.net/chunqiqian1285/article/details/100977195)

简单翻译过来就是: 之前版本可以通过`path.conf`来指定配置文件启动, 这相当复制?! 所以在新的版本中你丫的就别用了. 你可以通过配置`ES_PATH_CONF`环境变量启动.

而在官方的配置文档中, 也确实推荐通过配置`ES_PATH_CONF`环境变量来配置ElasticSearch, 并且提供了在ES运行时替换配置的API.

[ES 7.4官方文档Configuring Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/settings.html#settings)

<br/>

那就真的没有办法在启动时通过命令行指定参数启动了吗? 答案是: 有, 但是非常不推荐!

可以简单通过下面的命令启动一个master节点:

```bash
bin/elasticsearch -E node.data=false -E node.master=true -E node.name=NoData
```

<red>即通过`-E <key=value>`指定启动参数, 所以理论上可以通过这种方式修改启动参数来启动集群.</font>

但是笔者强烈不推荐这种方式, 因为: <blue>首先,通过命令行构建所有启动参数的方法很不直观, 而且容易产生错误; 其次, 启动多个集群要敲多个命令行, 很是麻烦; 最后, 这是一个相当不优雅的解决方法!</font>

>   在官方文档也提到了: <red>提供`-E <key=value>`启动参数的目的是用来修改一些和集群配置无关的配置项, 不推荐使用`-E`来修改和集群相关的配置!</font>

所以还是最好还是使用docker进行单节点启动, 既优雅也方便!

<br/>

-------------



### 三. 使用docker

使用docker创建集群的方法相当的简单.

#### 1. 拉取镜像

```bash
sudo docker pull elasticsearch:7.4.0
sudo docker pull kibana:7.4.0
```

#### 2. 分别启动es1和es2







<br/>

-------------



### 四. Elasticsearch配置文件详解







<br/>

-----------



### 附录

文章参考:

-   [ElasticSearch学习--单机如何启动多节点集群](https://jingyan.baidu.com/article/86fae3466b42bc7c48121a1d.html)
-   [ElasticSearch5.5.1 单台服务器部署多个节点](https://www.viphper.com/1371.html)
-   [ElasticSearch多节点模式的搭建](https://blog.51cto.com/6989066/2338497)
-   [搭建elsticsearch集群 报错with the same id but is a different node instance解决办法](https://blog.csdn.net/qq_24879495/article/details/77718032)
-   [Elasticsearch 6.0 命令行Option -E启动报错，求大佬指导，感谢](https://elasticsearch.cn/question/6496)
-   [Elasticsearch源码分析-启动过程浅析](https://www.jianshu.com/p/a754cda53b5f)
-   [Elasticsearch 6.0 重大变化](https://blog.csdn.net/chunqiqian1285/article/details/100977195)
-   [官方文档6.2版本更新](https://www.elastic.co/guide/en/elasticsearch/reference/6.2/breaking_60_packaging_changes.html)
-   [ES 7.4官方文档Configuring Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/settings.html#settings)
-   [如何在ElasticSearch中有多个节点？](https://cloud.tencent.com/developer/ask/87431)
-   [使用elasticSearch+kibana+logstash+ik分词器+pinyin分词器+繁简体转化分词器  6.5.4 启动   ELK+logstash概念描述](https://www.cnblogs.com/sxdcgaq8080/p/10213950.html)
-   [Elasticsearch 集群启动多节点 + 解决ES节点集群状态为yellow](https://www.bbsmax.com/A/kjdwDgnqzN/)











