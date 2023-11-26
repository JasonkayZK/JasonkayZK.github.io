---
title: Haproxy简介
toc: true
cover: 'https://img.paulzzh.com/touhou/random?33'
date: 2023-06-27 12:06:44
categories: 技术杂谈
tags: [技术杂谈, HAProxy]
description: 本文简单介绍了 HAProxy 的使用；
---

本文简单介绍了 HAProxy 的使用；

<br/>

<!--more-->

# **Haproxy简介**

## **HAProxy概述**

HAProxy是一个免费的负载均衡软件，可以运行于大部分主流的Linux操作系统上。

HAProxy提供了L4(TCP)和L7(HTTP)两种负载均衡能力，具备丰富的功能。HAProxy的社区非常活跃，版本更新快速。最关键的是，HAProxy具备媲美商用负载均衡器的性能和稳定性。

因为HAProxy的上述优点，它当前是免费负载均衡软件的首选；

**简而言之，HAProxy 是一个和 Nginx 类似的负载均衡软件；**

<br/>

### **HAProxy核心功能**

核心功能如下：

- 负载均衡：L4和L7两种模式，支持RR/静态RR/LC/IP Hash/URI Hash/URL_PARAM Hash/HTTP_HEADER Hash等丰富的负载均衡算法；
- 健康检查：支持TCP和HTTP两种健康检查模式；
- 会话保持：对于未实现会话共享的应用集群，可通过Insert Cookie/Rewrite Cookie/Prefix Cookie，以及上述的多种Hash方式实现会话保持；
- SSL：HAProxy可以解析HTTPS协议，并能够将请求解密为HTTP后向后端传输；
- HTTP请求重写与重定向；
- 监控与统计：HAProxy提供了基于Web的统计信息页面，展现健康状态和流量数据。基于此功能，使用者可以开发监控程序来监控HAProxy的状态；

<br/>

### **HAProxy关键特性**

性能：

- 采用单线程、事件驱动、非阻塞模型，减少上下文切换的消耗，能在1ms内处理数百个请求。并且每个会话只占用数KB的内存。
- 大量精细的性能优化，如O(1)复杂度的事件检查器、延迟更新技术、Single-buffereing、Zero-copy forwarding等等，这些技术使得HAProxy在中等负载下只占用极低的CPU资源。
- HAProxy大量利用操作系统本身的功能特性，使得其在处理请求时能发挥极高的性能，通常情况下，HAProxy自身只占用15%的处理时间，剩余的85%都是在系统内核层完成的。
- HAProxy作者在8年前（2009）年使用1.4版本进行了一次测试，单个HAProxy进程的处理能力突破了10万请求/秒，并轻松占满了10Gbps的网络带宽。

稳定性：

作为建议以单进程模式运行的程序，HAProxy对稳定性的要求是十分严苛的。按照作者的说法，HAProxy在13年间从未出现过一个会导致其崩溃的BUG，HAProxy一旦成功启动，除非操作系统或硬件故障，否则就不会崩溃（我觉得可能多少还是有夸大的成分）。

在上文中提到过，HAProxy的大部分工作都是在操作系统内核完成的，所以HAProxy的稳定性主要依赖于操作系统，对sysctls参数进行精细的优化，并且确保主机有足够的内存。这样HAProxy就能够持续满负载稳定运行数年之久。

<br/>

### **Nginx和HAProxy对比**

二者现在都能支持http/tcp/udp的负载均衡，nginx的采用类似编程语言的配置，用文档结构表示配置关系，看起来比较清晰，haproxy的配置有点像网络设备，定义和引用，有时候搞清一个逻辑需要上下来回翻看。

nginx是master-workers多进程，每个进程单线程，多核CPU能充分利用；haproxy是多线程，单进程就能实现超高性能，虽然haproxy也能多进程，但是网上资料多认为开了多进程也不能提升性能，不建议多进程跑。

即使做反向代理nginx性能略低于haproxy，但实际两者性能都超高，我在阿里云1c1g云主机上压测nginx，http性能至少能达到2000qps，而开启了https以后，性能大约550次握手/s。性能问题几乎不用担心。

HAProxy是一款专业的负载均衡软件，相比较Nginx而言，虽然Nginx在19的版本后，也支持4层的负载均衡，但是在性能和稳定性上，还是HAProxy更为市场所接受一些， nginx对web层支持的优秀，使得Nginx更适合做7层的负载均衡， HaProxy以其稳定性和可靠性，可以与硬件级的F5负载均衡设备相媲美。

各自特点如下：

nginx：

- 使用花括号，层级化的配置文件结构
- 除了自带的map、if语句可以实现简单逻辑，原生支持js/perl脚本，非官方支持lua
- 除了做负载均衡还可以做静态web服务器，缓存服务器（Haproxy不行）
- 模块化，按需编译，因为模块化，所以可选很多第三方扩展模块
- 开源版本只有基础功能，更多的功能要折腾第三方模块，或者花钱买官方扩展版的nginx plus

haproxy：

- 定义和引用，命令式的配置结构
- 支持acl，但不支持其他脚本语言（评论里有人说现在可以支持了）
- 做负载均衡性能比nginx好
- 有一个状态统计页面
- 官方支持会话保持、健康检查等（nginx开源版不带）
- 基础功能覆盖要比nginx开源版好，但是不易扩展，缺乏第三方资源。

<br/>

## **安装**

使用包管理工具安装：

```
apt install haproxy
```

Docker 部署：

```
docker run -d --restart=always --name haproxy -p 18888:8888 -v /docker-data/haproxy:/usr/local/etc/haproxy haproxy:latest
```

其中 8888 为自定义可以配置的 HAProxy 状态 Web 的端口；

<br/>

## **配置说明**

### **关键配置详解**

HAProxy的配置文件共有5个域：

- **global**：用于配置全局参数；
- **default**：用于配置所有frontend和backend的默认属性；
- **frontend**：用于配置前端服务（即HAProxy自身提供的服务）实例；
- **backend**：用于配置后端服务（即HAProxy后面接的服务）实例组；
- **listen**：frontend+backend的组合配置，可以理解成更简洁的配置方法；

<br/>

#### **global域**

global域的关键配置：

- daemon：指定HAProxy以后台模式运行，通常情况下都应该使用这一配置；
- user [username] ：指定HAProxy进程所属的用户
- group [groupname] ：指定HAProxy进程所属的用户组
- log [address] [device] [maxlevel] [minlevel]：日志输出配置，如log 127.0.0.1 local0 info warning，即向本机rsyslog或syslog的local0输出info到warning级别的日志。其中[minlevel]可以省略。HAProxy的日志共有8个级别，从高到低为emerg/alert/crit/err/warning/notice/info/debug；
- pidfile：指定记录HAProxy进程号的文件绝对路径。主要用于HAProxy进程的停止和重启动作。
- maxconn：HAProxy进程同时处理的连接数，当连接数达到这一数值时，HAProxy将停止接收连接请求；

<br/>

#### **frontend域**

frontend域的关键配置：

- acl [name] [criterion] [flags] [operator] [value]：定义一条ACL，ACL是根据数据包的指定属性以指定表达式计算出的true/false值。如"acl url_ms1 path_beg -i /ms1/"定义了名为url_ms1的ACL，该ACL在请求uri以/ms1/开头（忽略大小写）时为true；
- bind [ip]:[port]：frontend服务监听的端口；
- default_backend [name]：frontend对应的默认backend；
- disabled：禁用此frontend；
- http-request [operation] [condition]：对所有到达此frontend的HTTP请求应用的策略，例如可以拒绝、要求认证、添加header、替换header、定义ACL等等；
- http-response [operation] [condition]：对所有从此frontend返回的HTTP响应应用的策略，大体同上
log：同global域的log配置，仅应用于此frontend。如果要沿用global域的log配置，则此处配置为log global；
- maxconn：同global域的maxconn，仅应用于此frontend；
- mode：此frontend的工作模式，主要有http和tcp两种，对应L7和L4两种负载均衡模式；
- option forwardfor：在请求中添加X-Forwarded-For Header，记录客户端ip；
- option http-keep-alive：以KeepAlive模式提供服务；
- option httpclose：与http-keep-alive对应，关闭KeepAlive模式，如果HAProxy主要提供的是接口类型的服务，可以考虑采用httpclose模式，以节省连接数资源。但如果这样做了，接口的调用端将不能使用HTTP连接池；
- option httplog：开启httplog，HAProxy将会以类似Apache HTTP或Nginx的格式来记录请求日志；
- option tcplog：开启tcplog，HAProxy将会在日志中记录数据包在传输层的更多属性；
- stats uri [uri]：在此frontend上开启监控页面，通过[uri]访问；
- stats refresh [time]：监控数据刷新周期；
- stats auth [user]:[password]：监控页面的认证用户名密码；
- timeout client [time]：指连接创建后，客户端持续不发送数据的超时时间；
- timeout http-request [time]：指连接创建后，客户端没能发送完整HTTP请求的超时时间，主要用于防止DoS类攻击，即创建连接后，以非常缓慢的速度发送请求包，导致HAProxy连接被长时间占用；
- use_backend [backend] if|unless [acl]：与ACL搭配使用，在满足/不满足ACL时转发至指定的backend

<br/>

#### **backend域**

backend域的关键配置：

- acl：同frontend域；
- balance [algorithm]：在此backend下所有server间的负载均衡算法，常用的有roundrobin和source，完整的算法说明见官方文档configuration.html#4.2-balance；
- cookie：在backend server间启用基于cookie的会话保持策略，最常用的是insert方式，如cookie HA_STICKY_ms1 insert indirect nocache，指HAProxy将在响应中插入名为HA_STICKY_ms1的cookie，其值为对应的server定义中指定的值，并根据请求中此cookie的值决定转发至哪个server。indirect代表如果请求中已经带有合法的HA_STICK_ms1 cookie，则HAProxy不会在响应中再次插入此cookie，nocache则代表禁止链路上的所有网关和缓存服务器缓存带有Set-Cookie头的响应。
- default-server：用于指定此backend下所有server的默认设置。具体见下面的server配置。
- disabled：禁用此backend
- http-request/http-response：同frontend域
- log：同frontend域
- mode：同frontend域
- option forwardfor：同frontend域
- option http-keep-alive：同frontend域
- option httpclose：同frontend域
- option httpchk [METHOD] [URL] [VERSION]：#  定义以http方式进行的健康检查策略。如option httpchk GET /healthCheck.html HTTP/1.1；
- option httplog：同frontend域；
- option tcplog：同frontend域；
- server [name] [ip]:[port] [params]： # 定义backend中的一个后端server，[params]用于指定这个server的参数，常用的包括有：
  - check：指定此参数时，HAProxy将会对此server执行健康检查，检查方法在option httpchk中配置。同时还可以在check后指定inter, rise, fall三个参数，分别代表健康检查的周期、连续几次成功认为server UP，连续几次失败认为server DOWN，默认值是inter 2000ms rise 2 fall 3；
  - cookie [value]：用于配合基于cookie的会话保持，如cookie ms1.srv1代表交由此server处理的请求会在响应中写入值为ms1.srv1的cookie（具体的cookie名则在backend域中的cookie设置中指定）；
  - maxconn：指HAProxy最多同时向此server发起的连接数，当连接数到达maxconn后，向此server发起的新连接会进入等待队列。默认为0，即无限；
  - maxqueue：等待队列的长度，当队列已满后，后续请求将会发至此backend下的其他server，默认为0，即无限；
  - weight：server的权重，0-256，权重越大，分给这个server的请求就越多。weight为0的server将不会被分配任何新的连接。所有server默认weight为1；
  - timeout connect [time]：指HAProxy尝试与backend server创建连接的超时时间；
  - timeout check [time]：默认情况下，健康检查的连接+响应超时时间为server命令中指定的inter值，如果配置了timeout check，HAProxy会以inter作为健康检查请求的连接超时时间，并以timeout check的值作为健康检查请求的响应超时时间；
  - timeout server [time]：指backend server响应HAProxy请求的超时时间；

<br/>

#### **defalut域**

上文所属的frontend和backend域关键配置中，除acl、bind、http-request、http-response、use_backend外，其余的均可以配置在default域中。

default域中配置了的项目，如果在frontend或backend域中没有配置，将会使用default域中的配置。

<br/>

#### **listen域**

listen域是frontend域和backend域的组合；

因此，frontend域和backend域中所有的配置都可以配置在listen域下！

<br/>

## **配置案例**

以下面的配置为例：

```
global
    log         127.0.0.1 local2 info # 日志输出配置
    maxconn     4000  # HAProxy进程同时处理的连接数，当连接数达到这一数值时，HAProxy将停止接收连接请求
    daemon             #以后台形式运行ha-proxy

defaults
    mode                    http  # 工作模式：tcp是4层，http是7层
    log                     global # 沿用global域的log配置
    retries                 3   # 健康检查。3次连接失败就认为服务器不可用，主要通过后面的check检查
    option                  redispatch  # 服务不可用后重定向到其他健康服务器。
    maxconn                 4000

# 监控界面配置

listen stats
  bind *:8888
  stats enable # 开启监控页面
  stats uri / # 在此frontend上开启监控页面，通过[uri]访问
  stats refresh 10s # 监控数据刷新周期
  mode http
  stats realm Global\ statistics # 统计报告格式
  stats auth admin:123456 # 登录账户信息

# 前端入口定义
frontend test
  bind :80
  default_backend webservers

# 后端服务定义
backend webservers
  balance roundrobin
  server ng nginx:80 check fall 2 rise 2 weight 1
  server httpd httpd:80 check fall 2 rise 2 weight 1
```


上面定义了两个转发：
- `<ha-ip>:8888`：HAProxy 提供的监控界面；
- `<ha-ip>:80`：将请求根据 roundrobin负载均衡算法，转发到 nginx、httpd 两台服务；

从上面的例子可以看出：

<font color="#f00">**在使用 HAProxy 时，主要就是编写 listen、或者 frontend + backend 逻辑即可！**</font>

<br/>

### **测试案例**

这里以上面的配置为例，使用 Docker 进行操作；

创建网络：

```
docker network create --subnet 172.40.0.0/24 --gateway 172.40.0.1 my-net
```

创建 nginx、httpd 服务：

```
docker run -d --restart=always --name nginx --ip 172.40.0.10 --network my-net nginx:latest
16:19
docker run -d --restart=always --name httpd --ip 172.40.0.12 --network my-net httpd:latest
```

创建 HAProxy 配置文件：

```
vi /docker-data/haproxy/haproxy.cfg

global
  log         127.0.0.1 local2 info
  maxconn     4000   #优先级低
  daemon               #以后台形式运行ha-proxy

defaults
    mode                    http  #工作模式 http ,tcp 是 4 层,http是 7 层
    log                     global
    retries                 3   #健康检查。3次连接失败就认为服务器不可用，主要通过后面的check检查
    option                  redispatch  #服务不可用后重定向到其他健康服务器。
    maxconn                 4000  #优先级中

listen stats
  bind *:8888
  stats enable
  stats uri /
  stats refresh 10s
  mode http
  stats realm Global\ statistics
  stats auth admin:123456

frontend test
  bind :80
  default_backend webservers

backend webservers
  balance roundrobin
  server ng nginx:80 check fall 2 rise 2 weight 1
  server httpd httpd:80 check fall 2 rise 2 weight 1
```

>   **注：上面使用容器名称代替了 IP；**

创建 HAProxy 容器，并挂载配置：

```
docker run -d --restart=always --name haproxy  -p 18888:8888 -p 8849:80 -v /docker-data/haproxy:/usr/local/etc/haproxy --network zk-net haproxy:latest
```


随后访问监控界面（18888端口）：

可以看到我们的配置；

访问后端服务（8849端口），随着访问，会在上面两个页面切换；


<br/>

# **附录**

参考文章：

- https://www.cnblogs.com/struggle-1216/p/13511703.html
- https://www.zhihu.com/question/34489042
- https://blog.51cto.com/u_9748604/5648143
- https://zhuanlan.zhihu.com/p/466231280
- https://www.modb.pro/db/625178
- https://zhuanlan.zhihu.com/p/161428678
- https://www.cnblogs.com/you-men/p/12979599.html
- http://www.ttlsa.com/linux/haproxy-study-tutorial/


<br/>
