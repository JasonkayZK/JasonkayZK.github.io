---
title: ELK设置密码
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?1'
date: 2022-07-01 13:30:07
categories: [ElasticSearch]
tags: [ElasticSearch]
description: ES7.7 以后的版本将安全认证功能免费开放，并将X-pack插件集成了到了开源的ElasticSearch版本中；本文介绍了如何利用X-pack给ElasticSearch设置用户名和密码；
---

ES7.7 以后的版本将安全认证功能免费开放，并将X-pack插件集成了到了开源的ElasticSearch版本中；

本文介绍了如何利用X-pack给ElasticSearch设置用户名和密码；

<br/>

<!--more-->

# **ELK设置密码**

## **环境说明**

本文继续使用 ES 7.14.1 版本；

具体ELK的部署可以参考我之前的文章：

-   [使用Docker-Compose部署单节点ELK](/2021/05/15/使用Docker-Compose部署单节点ELK/)

源代码：

-   https://github.com/JasonkayZK/docker-repo/tree/elk-v7.14-single

<br/>

## **ElasticSearch配置**

首先，配置 `config/elasticsearch.yml`

新增以下配置（开源版本默认是关闭的）：

```yaml
xpack.security.enabled: true
```

保存后重启ES；

随后，输入 `./bin/elasticsearch-setup-passwords interactive` 初始化密码；

内置存在三个用户：

-   elastic：内置超级用户；
-   kibana：仅可用于kibana用来连接elasticsearch并与之通信, 不能用于kibana登录；
-   logstash_system：用于Logstash在Elasticsearch中存储监控信息时使用；

至此，已经完成 ES 及相关组件的加密，后续访问和使用相关组件都需要验证用户名和密码，使用：

-   `curl localhost:9200 -u elastic:{password}`

<br/>

## **Kibana配置**

在 `config/kibana.yml` 中配置用户名和密码：

```yaml
elasticsearch.username: "kibana"
elasticsearch.password: "*****"
```

账号密码为es初始化中设置的密码；

重启 kibana；

输入 `http://ip:5601` 打开 Kibana 登录页面，使用elastic账号登录，并在角色和用户管理中添加用户指定 索引用于访问ES；

<br/>

## **Logstash配置**

首先，修改 Logstash 配置文件`config/logstash.yml`，增加并修改下面的内容：

```yaml
http.host: "0.0.0.0"
xpack.monitoring.elasticsearch.hosts: [ "http://elasticsearch:9200" ]
xpack.monitoring.enabled: true
xpack.monitoring.elasticsearch.username: logstash_system
xpack.monitoring.elasticsearch.password: *****
```

还要修改 logstash 中的配置 `logstash-sample.conf`：

```diff
# Sample Logstash configuration for creating a simple
# Beats -> Logstash -> Elasticsearch pipeline.

input {
  beats {
    port => 5044
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "%{[@metadata][beat]}-%{[@metadata][version]}-%{+YYYY.MM.dd}"
-    #user => "elastic"
-    #password => "changeme"    
+    user => "elastic"
+    password => "*****"
  }
}
```

将密码配置进去即可！

<br/>

# **附录**

参考文章：

-   https://zhuanlan.zhihu.com/p/163337278
-   https://www.jianshu.com/p/4aa3a8b70bfa

<br/>
