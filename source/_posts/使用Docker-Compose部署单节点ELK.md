---
title: 使用Docker-Compose部署单节点ELK
toc: true
cover: 'https://img.paulzzh.com/touhou/random?75'
date: 2021-05-15 10:35:59
categories: Docker
tags: [Docker, Docker-Compose, ElasticSearch]
description: 最近在学习Go中集成ELK，需要搭建至少单节点的ELK服务，就用ElasticSearch官方的镜像和Docker-Compose创建了单节点的ELK；本文讲述了如何使用Docker-Compose部署单节点ELK，使用的版本为7.1.0，当然也适用于其他版本的搭建；
---

最近在学习Go中集成ELK，需要搭建至少单节点的ELK服务，就用ElasticSearch官方的镜像和Docker-Compose创建了单节点的ELK；

本文讲述了如何使用Docker-Compose部署单节点ELK，使用的版本为7.1.0，当然也适用于其他版本的搭建；

源代码：

-   https://github.com/JasonkayZK/docker_repo/tree/elk-v7.1-single

系列文章：

-   [使用Docker-Compose部署单节点ELK](/2021/05/15/使用Docker-Compose部署单节点ELK/)
-   [使用Docker-Compose部署单节点ELK-Stack](/2021/05/15/使用Docker-Compose部署单节点ELK-Stack/)
-   [在Go中集成ELK服务](/2021/05/16/在Go中集成ELK服务/)

<br/>

<!--more-->

## **使用Docker-Compose部署单节点ELK**

### **前言**

部署环境为：

-   操作系统：CentOS 7
-   Docker：20.10.6
-   Docker-Compose：1.29.1
-   ELK Version：7.1.0

>   <font color="#f00">**注：本篇仅仅采用通常的ElasticSearch + LogStash + Kibana组件，而未使用FileBeat；**</font>

<br/>

### **项目说明**

首先，在配置文件`.env`中声明了ES以及各个组件的版本：

.env

```
ES_VERSION=7.1.0
```

其次，创建Docker-Compose的配置文件：

docker-compose.yml

```yaml
version: '3.4'

services: 
    elasticsearch:
        image: "docker.elastic.co/elasticsearch/elasticsearch:${ES_VERSION}"
        environment:
            - discovery.type=single-node
        volumes:
            - /etc/localtime:/etc/localtime
            - /docker_es/data:/usr/share/elasticsearch/data
        ports:
            - "9200:9200"
            - "9300:9300"
    
    logstash:
        depends_on:
            - elasticsearch
        image: "docker.elastic.co/logstash/logstash:${ES_VERSION}"
        volumes:
            - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
        ports:
            - "5044:5044"
        links:
            - elasticsearch

    kibana:
        depends_on:
            - elasticsearch
        image: "docker.elastic.co/kibana/kibana:${ES_VERSION}"
        environment:
            - ELASTICSEARCH_URL=http://elasticsearch:9200
        volumes:
            - /etc/localtime:/etc/localtime
        ports:
            - "5601:5601"
        links:
            - elasticsearch
```

在Services中声明了三个服务：

-   elasticsearch；
-   logstash；
-   kibana；

在elasticsearch服务的配置中有几点需要特别注意：

-   **`discovery.type=single-node`：将ES的集群发现模式配置为单节点模式；**
-   **`/etc/localtime:/etc/localtime`：Docker容器中时间和宿主机同步；**
-   **`/docker_es/data:/usr/share/elasticsearch/data`：将ES的数据映射并持久化至宿主机中；**

>   <font color="#f00">**在启动ES容器时，需要先创建好宿主机的映射目录；**</font>
>
>   <font color="#f00">**并且配置映射目录所属，例如：**</font>
>
>   ```bash
>   sudo chown -R 1000:1000 /docker_es/data
>   ```
>
>   <font color="#f00">**否则可能报错！**</font>
>
>   见：
>
>   -   [Caused by: java.nio.file.AccessDeniedException: /usr/share/elasticsearch/data/nodes](https://www.google.com/search?q=Caused+by%3A+java.nio.file.AccessDeniedException%3A+%2Fusr%2Fshare%2Felasticsearch%2Fdata%2Fnodes&sxsrf=ALeKk02j1--iGkUZ432Y7Hh1ggXe7FPU1A%3A1621041287165&ei=hyCfYNbGCZDQ-wT9hJCoCw&oq=Caused+by%3A+java.nio.file.AccessDeniedException%3A+%2Fusr%2Fshare%2Felasticsearch%2Fdata%2Fnodes&gs_lcp=Cgdnd3Mtd2l6EAMyBwgAEEcQsAMyBwgAEEcQsAMyBwgAEEcQsAMyBwgAEEcQsAMyBwgAEEcQsAMyBwgAEEcQsAMyBwgAEEcQsAMyBwgAEEcQsANQ2_gPWNv4D2Cz-g9oAHAFeACAAQCIAQCSAQCYAQGgAQKgAQGqAQdnd3Mtd2l6yAEIwAEB&sclient=gws-wiz&ved=0ahUKEwiWptmwwcrwAhUQ6J4KHX0CBLUQ4dUDCA4&uact=5)
>   -   [how-to-fix-elasticsearch-docker-accessdeniedexception-usr-share-elasticsearch-data-nodes](https://techoverflow.net/2020/04/18/how-to-fix-elasticsearch-docker-accessdeniedexception-usr-share-elasticsearch-data-nodes/)

在logstash服务的配置中有几点需要特别注意：

-   **`./logstash.conf:/usr/share/logstash/pipeline/logstash.conf`：将宿主机本地的logstash配置映射至logstash容器内部；**

在kibana服务的配置中有几点需要特别注意：

-   **`ELASTICSEARCH_URL=http://elasticsearch:9200`：配置ES的地址；**
-   **`/etc/localtime:/etc/localtime`：Docker容器中时间和宿主机同步；**

下面是LogStash的配置，在使用时可以自定义：

logstash.conf

```conf
input {
  tcp {
    mode => "server"
    host => "0.0.0.0"
    port => 5044
    codec => json
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "%{[service]}-%{+YYYY.MM.dd}"
  }
  stdout { codec => rubydebug }
}
```

<br/>

### **使用方法**

>   **使用前必看：**
>
>   **① 修改ELK版本**
>
>   可以修改在`.env`中的`ES_VERSION`字段，修改你想要使用的ELK版本；
>
>   **② LogStash配置**
>
>   修改`logstash.conf`为你需要的日志配置；
>
>   **③ 修改ES文件映射路径**
>
>   修改`docker-compose`中`elasticsearch`服务的`volumes`，将宿主机路径修改为你实际的路径：
>
>   ```diff
>   volumes:
>     - /etc/localtime:/etc/localtime
>   -  - /docker_es/data:/usr/share/elasticsearch/data
>   + - [your_path]:/usr/share/elasticsearch/data
>   ```
>
>   并且修改宿主机文件所属：
>
>   ```bash
>   sudo chown -R 1000:1000 [your_path]
>   ```

随后使用docker-compose命令启动：

```bash
docker-compose up -d
Creating network "docker_repo_default" with the default driver
Creating docker_repo_elasticsearch_1 ... done
Creating docker_repo_kibana_1        ... done
Creating docker_repo_logstash_1      ... done
```

在portainer中可以看到三个容器全部被成功创建：

![](https://cdn.jsdelivr.net/gh/jasonkayzk/docker_repo@elk-v7.1-single/images/demo_1.png)

访问`<ip>:5601/`可以看到Kibana也成功启动：

![](https://cdn.jsdelivr.net/gh/jasonkayzk/docker_repo@elk-v7.1-single/images/demo_2.png)

<br/>

### **测试**

#### **通过API进行数据的CRUD**

向ES中增加数据：

```bash
curl -XPOST "http://127.0.0.1:9200/ik_v2/chinese/3?pretty"  -H "Content-Type: application/json" -d ' 
{ 
    "id" : 3, 
    "username" :  "测试测试", 
    "description" :  "测试测试" 
}'

# 返回 
{
  "_index" : "ik_v2",
  "_type" : "chinese",
  "_id" : "3",
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

获取数据：

```bash
curl -XGET "http://127.0.0.1:9200/ik_v2/chinese/3?pretty"

# 返回
{
  "_index" : "ik_v2",
  "_type" : "chinese",
  "_id" : "3",
  "_version" : 1,
  "_seq_no" : 0,
  "_primary_term" : 1,
  "found" : true,
  "_source" : {
    "id" : 3,
    "username" : "测试测试",
    "description" : "测试测试"
  }
}
```

修改数据：

```bash
curl -XPOST 'localhost:9200/ik_v2/chinese/3/_update?pretty' -H "Content-Type: application/json" -d '{ 
    "doc" : { 
            "username" : "testtest" 
        } 
    } 
}'

# 返回
{
  "_index" : "ik_v2",
  "_type" : "chinese",
  "_id" : "3",
  "_version" : 2,
  "result" : "updated",
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 1,
  "_primary_term" : 1
}
```

再次查询：

```bash
curl -XGET "http://127.0.0.1:9200/ik_v2/chinese/3?pretty"

# 返回
{
  "_index" : "ik_v2",
  "_type" : "chinese",
  "_id" : "3",
  "_version" : 2,
  "_seq_no" : 1,
  "_primary_term" : 1,
  "found" : true,
  "_source" : {
    "id" : 3,
    "username" : "testtest",
    "description" : "测试测试"
  }
}
```

可以看到，username已经成功被修改！

<br/>

#### **在Kibana中查看**

目前我们的Kibana中是不存在Index索引的，需要先创建；

在Management中点击`Kibana`下面的`Index Management`，并输入上面我们插入的索引`ik_v2`：

![](https://cdn.jsdelivr.net/gh/jasonkayzk/docker_repo@elk-v7.1-single/images/demo_3.png)

创建成功后可以在`Discover`中查看：

![](https://cdn.jsdelivr.net/gh/jasonkayzk/docker_repo@elk-v7.1-single/images/demo_4.png)

大体单节点的ELK就部署成功，可以使用了！

<br/>

## **附录**

源代码：

-   https://github.com/JasonkayZK/docker_repo/tree/elk-v7.1-single

系列文章：

-   [使用Docker-Compose部署单节点ELK](/2021/05/15/使用Docker-Compose部署单节点ELK/)
-   [使用Docker-Compose部署单节点ELK-Stack](/2021/05/15/使用Docker-Compose部署单节点ELK-Stack/)
-   [在Go中集成ELK服务](/2021/05/16/在Go中集成ELK服务/)

<br/>
