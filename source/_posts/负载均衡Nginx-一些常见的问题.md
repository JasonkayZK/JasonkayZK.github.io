---
title: 负载均衡Nginx-一些常见的问题
cover: https://acg.yanwz.cn/api.php?76
date: 2020-04-13 09:33:35
categories: 分布式
toc: true
tags: [分布式, 负载均衡, Nginx]
description: 前一篇文章简要讲述了Nginx的配置. 本篇再此基础之上, 讲述使用Nginx时可能会出现的一些问题;
---

前一篇文章简要讲述了Nginx的配置.

本篇再此基础之上, 讲述使用Nginx时可能会出现的一些问题;

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## 负载均衡Nginx-Session一致性

### https请求跳转

如下面的配置:

```
location /test {
    proxy_pass http://www.baidu.com/;
}
```

在访问URI为`/test`时会跳转到百度;

但此时浏览器中的url也会发生变化;

这是因为:

向`http://www.baidu.com/`发送请求后, Nginx返回的是一个跳转的响应;

此后, 客户端会重新向`https://www.baidu.com/`发送请求**(此过程不在经历Nginx)**

所以最终浏览器发生了跳转, 而非Nginx的负载均衡;

**问题解决**

将配置中的http改为https即可;

<br/>

### Session一致性

在使用Nginx做反向代理时, 如果后端服务器是Tomcat等动态服务器, 则可能会出现Session一致性问题;

即: 无法确保同一个Session一定对应同一个Server;

#### 配置网络

下面使用Docker来演示;

配置IP地址:

| Server  |      IP      |
| :-----: | :----------: |
|  Nginx  | 172.20.1.10  |
| Server1 | 172.20.1.101 |
| Server2 | 172.20.1.102 |

并在Server1和Server2上启动Tomcat;

****

#### 配置Server

在Server端创建jsp页面:

Server1

```bash
[root@c5477d71795c ROOT]# pwd
/var/lib/tomcat/webapps/ROOT
[root@c5477d71795c ROOT]# cat index.jsp 
from 172.20.1.101
<br/>
session=<%=session.getId()%>
```

Server2

```bash
[root@c5477d71795c ROOT]# pwd
/var/lib/tomcat/webapps/ROOT
[root@c5477d71795c ROOT]# cat index.jsp 
from 172.20.1.102
<br/>
session=<%=session.getId()%>
```

然后访问`http://172.20.1.101:8080/`和`http://172.20.1.102:8080/`;

可分别显示来自哪个Server和对应的SessionId, 并且刷新页面时SessionId不会变化;**(即使是使用`Ctrl+F5`刷新)**

****

#### 配置Nginx

修改Nginx的配置文件, 加入新的upstream配置和server配置;

```bash
upstream tomcat {
    server 172.20.1.101:8080;
    server 172.20.1.102:8080;
}

server {
    ......
    location /cat {
        proxy_pass http://tomcat/;
    }
}
```

重启Nginx:

```
[root@ce12b3b4ce00 sbin]# ./nginx -s reload
```

访问`http://172.20.1.10/cat`, 并刷新;

发现from 172.20.1.10x一直在变化, 并且session=xxx也变化;

**说明此时Nginx的配置无法保证Session一致性!**

<br/>

#### 解决方案

在Tomcat后面部署Redis, MemCached等内存数据库来保存Session相关信息;

本例中在Nginx服务器上安装memcached来解决Session一致性问题;

**安装memcached**

在Nginx容器中使用yum安装:

```bash
yum install -y memcached
```

**启动memcached**

使用memcached命令启动:

```bash
memcached -d -m 128m -p 11211 -l 172.20.1.10 -u root -P /tmp/
```

参数说明:

-   -d: 后台启动;
-   -m: 缓存大小;
-   -p: 端口;
-   -l: IP地址;
-   -P: 服务启动后系统进程ID存储文件的目录;
-   -u: 服务器以哪个用户作为管理用户;

**修改tomcat配置**

在两台Server中修改tomcat的配置:

```bash
[root@3a53f7504511 ROOT]# vi /etc/tomcat/context.xml 

# context标签中加入下面的内容
<Manager 
className="de.javakaffee.web.msm.MemcachedBackupSessionManager"
        memcachedNodes="n1:172.20.1.10:11211"
        sticky="false"
        sessionBackupAsync="false"
        lockingMode="auto"
        requestUriIgnorePattern=".*\.(ico|png|gif|jpg|css|js)$"
        sessionBackupTimeout="1000"          
        transcoderFactoryClass="de.javakaffee.web.msm.serializer.kryo.KryoTranscoderFactory" />

```

**导入jar包**

使用yum安装的tomcat可将jar包放在`/usr/share/java/tomcat/`目录下;

需要的jar包:

![img](https://images2015.cnblogs.com/blog/851491/201704/851491-20170418180524774-779206311.png)

maven下依赖如下：

```xml
<dependency>
    <groupId>asm</groupId>
    <artifactId>asm</artifactId>
    <version>3.2</version>
</dependency>

<dependency>
    <groupId>com.couchbase.client</groupId>
    <artifactId>couchbase-client</artifactId>
    <version>1.4.11</version>
</dependency>

<dependency>
    <groupId>com.googlecode</groupId>
    <artifactId>kryo</artifactId>
    <version>1.04</version>
</dependency>

<dependency>
    <groupId>de.javakaffee</groupId>
    <artifactId>kryo-serializers</artifactId>
    <version>0.11</version>
</dependency>

<dependency>
    <groupId>de.javakaffee.msm</groupId>
    <artifactId>memcached-session-manager</artifactId>
    <version>1.8.2</version>
</dependency>

<dependency>
    <groupId>de.javakaffee.msm</groupId>
    <artifactId>memcached-session-manager-tc7</artifactId>
    <version>1.8.2</version>
</dependency>

<dependency>
    <groupId>com.googlecode</groupId>
    <artifactId>minlog</artifactId>
    <version>1.2</version>
</dependency>

<dependency>
    <groupId>de.javakaffee.msm</groupId>
    <artifactId>msm-kryo-serializer</artifactId>
    <version>1.8.2</version>
</dependency>

<dependency>
    <groupId>com.esotericsoftware</groupId>
    <artifactId>reflectasm</artifactId>
    <version>1.01</version>
</dependency>

<dependency>
    <groupId>net.spy</groupId>
    <artifactId>spymemcached</artifactId>
    <version>2.11.4</version>
</dependency>
```

><br/>
>
><font color="#f00">**注: 如果依赖和tomcat版本不对应可能会什么也不显示, 此时响应码为500**</font>

**验证**

上述步骤都正确配置之后, 再次访问`http://172.20.1.10/cat`并刷新会发现SessionId不再变化;

<br/>


## 附录

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>