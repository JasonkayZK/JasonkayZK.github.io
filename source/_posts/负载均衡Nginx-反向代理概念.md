---
title: 负载均衡Nginx
cover: https://acg.toubiec.cn/random?83
date: 2020-04-13 09:30:59
categories: 分布式
toc: true
tags: [分布式, 负载均衡, Nginx]
description: 前面讲述了四层的LVS负载均衡, 接下来讲述工作在七层的Nginx负载均衡;
---

前面讲述了四层的LVS负载均衡, 接下来讲述工作在七层的Nginx负载均衡;

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## 负载均衡Nginx

相比于LVS后端只能部署相同的服务器镜像, Nginx实现的负载均衡可以灵活的多;

由于Nginx是建立在七层的负载均衡, 所以可以通过客户端具体请求的URL实现动态的负载均衡; 但是Nginx在进行负载均衡时需要和客户端建立三次握手连接, 所以Nginx的效率略低于LVS;

### Nginx工作流程

Nginx在实现反向代理的同时实现了负载均衡, 即: 客户端向Nginx发来请求, 例如: `/search?ooxx`, Nginx识别url并根据策略转发请求;

具体步骤如下:

-   Nginx和客户端建立握手连接;
-   Nginx接受请求并分析url
-   Nginx转发请求给对应的后端服务器;
-   Nginx等等后端的响应;
-   Nginx将响应回复给客户端;

><br/>
>
>**注: Nginx和LVS对比**
>
>在LVS的DR模型中, LVS后端的服务器可以直接给客户端返回**(并且是后端服务器和客户端建立连接, 而LVS并不建立连接)**
>
>但是**通过Nginx做负载均衡时, 后端返回的响应必须经由Nginx向客户端返回, 因为真正和客户端建立连接的是Nginx**

<br/>

### Tengine安装与配置

[Tengine](http://tengine.taobao.org/)是由淘宝团队开发的基于Nginx的升级版本; 在[Nginx](http://nginx.org/)的基础上，针对大访问量网站的需求，添加了很多高级功能和特性。

#### 创建网络

在Docker中创建Nginx子网络:

```bash
docker network create --subnet=172.20.1.0/24 nginx
```

规划Nginx的IP为`172.20.1.x`

****

### 创建容器

使用CentOS7镜像创建tengine容器:

```bash
docker run -d --privileged=true --name=tengine --net nginx --ip 172.20.1.10 centos:7 /usr/sbin/init
```

****

### 容器中安装tengine

进入tengine容器:

```bash
docker exec -it tengine /bin/bash
```

通过源码安装tengine:

```bash
# 下载源码包
cd /opt/
curl -o tengine-2.3.2.tar.gz http://tengine.taobao.org/download/tengine-2.3.2.tar.gz

# 安装相关依赖
yum install -y gcc pcre-devel openssl-devel automake autoconf libtool make

# 配置安装路径
cd /opt/tengine-2.3.2/
./configure --prefix=/opt/nginx

# 编译和安装
make && make install
```

启动tengine:

```bash
/opt/nginx/sbin/nginx
```

打开浏览器可以看到tengine主页, 即安装成功;

关闭tengine:

```bash
/opt/nginx/sbin/nginx -s stop
```

****

### 配置tengine

nginx的配置主要是在`/opt/nginx/conf/nginx.conf`中;

配置文件内容如下:

```bash
#user  nobody;
worker_processes  1;

#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;
#error_log  "pipe:rollback logs/error_log interval=1d baknum=7 maxsize=2G";

#pid        logs/nginx.pid;


events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    #log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
    #                  '$status $body_bytes_sent "$http_referer" '
    #                  '"$http_user_agent" "$http_x_forwarded_for"';

    #access_log  logs/access.log  main;
    #access_log  "pipe:rollback logs/access_log interval=1d baknum=7 maxsize=2G"  main;

    sendfile        on;
    #tcp_nopush     on;

    #keepalive_timeout  0;
    keepalive_timeout  65;

   #gzip  on;

    server {
        listen       80;
        server_name  localhost;

        #charset koi8-r;

        #access_log  logs/host.access.log  main;
        #access_log  "pipe:rollback logs/host.access_log interval=1d baknum=7 maxsize=2G"  main;

        location / {
            root   html;
            index  index.html index.htm;
        }

      #error_page  404              /404.html;

        # redirect server error pages to the static page /50x.html
        #
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }

        # proxy the PHP scripts to Apache listening on 127.0.0.1:80
        #
        #location ~ \.php$ {
        #    proxy_pass   http://127.0.0.1;
        #}

       # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
        #
        #location ~ \.php$ {
        #    root           html;
        #    fastcgi_pass   127.0.0.1:9000;
        #    fastcgi_index  index.php;
        #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
        #    include        fastcgi_params;
        #}

        # pass the Dubbo rpc to Dubbo provider server listening on 127.0.0.1:20880
        #
        #location /dubbo {
        #    dubbo_pass_all_headers on;
        #    dubbo_pass_set args $args;
        #    dubbo_pass_set uri $uri;
       #    dubbo_pass_set method $request_method;
        #
        #    dubbo_pass org.apache.dubbo.samples.tengine.DemoService 0.0.0 tengineDubbo dubbo_backend;
        #}

        # deny access to .htaccess files, if Apache's document root
        # concurs with nginx's one
        #
        #location ~ /\.ht {
        #    deny  all;
        #}
    }
    
    # upstream for Dubbo rpc to Dubbo provider server listening on 127.0.0.1:20880
    #
    #upstream dubbo_backend {
    #    multi 1;
    #    server 127.0.0.1:20880;
    #}

    # another virtual host using mix of IP-, name-, and port-based configuration
    #
    #server {
    #    listen       8000;
    #    listen       somename:8080;
    #    server_name  somename  alias  another.alias;

    #    location / {
    #        root   html;
    #        index  index.html index.htm;
    #    }
    #}


    # HTTPS server
    #
    #server {
    #    listen       443 ssl;
    #    server_name  localhost;

    #    ssl_certificate      cert.pem;
    #    ssl_certificate_key  cert.key;

    #    ssl_session_cache    shared:SSL:1m;
    #    ssl_session_timeout  5m;

    #    ssl_ciphers  HIGH:!aNULL:!MD5;
    #    ssl_prefer_server_ciphers  on;

    #    location / {
    #        root   html;
    #        index  index.html index.htm;
    #    }
    #}

}
```

下面详述配置文件内容:

#### user

```
user nobody;
```

nginx的worker进程所属的用户;

在Linux中, 进程属于哪个用户, 则这个进程的权限就是归属于用户的权限;

><br/>
>
>**注: master和worker进程的归属一般不同**

****

#### worker_processes

工作进程数, 默认为1; 

通常配置为和CPU核心数相同;

****

#### events

工作模式和连接数上限;

使用epoll进行基于事件模型处理请求;

单个进程的最大连接数 = 连接数(worker_connections) x 进程数(worker_processes);

所以对于八核心的服务器来说, 配置worker_connections在7000左右就可以处理50000左右的请求;

><br/>
>
>**注: worker_connections的数量受到Linux操作系统的限制**
>
>对于操作系统而言, 可以打开的最大文件数(文件描述符)和内存大小成正比(对于1G内存可以打开的文件数大约为10万左右)
>
>可以通过下面的命令查看当前系统打开的最大文件数的配置:
>
>```bash
>[root@ce12b3b4ce00 /]# cat /proc/sys/fs/file-max 
>3277579
>```
>
>此外, Linux对于单个进程可以创建的文件描述符也有限制:
>
>```bash
>[root@ce12b3b4ce00 /]# ulimit -a
>core file size          (blocks, -c) unlimited
>data seg size           (kbytes, -d) unlimited
>scheduling priority             (-e) 0
>file size               (blocks, -f) unlimited
>pending signals                 (-i) 128062
>max locked memory       (kbytes, -l) 16384
>max memory size         (kbytes, -m) unlimited
>open files                      (-n) 1048576
>pipe size            (512 bytes, -p) 8
>POSIX message queues     (bytes, -q) 819200
>real-time priority              (-r) 0
>stack size              (kbytes, -s) 8192
>cpu time               (seconds, -t) unlimited
>max user processes              (-u) unlimited
>virtual memory          (kbytes, -v) unlimited
>file locks                      (-x) unlimited
>```
>
>可以看到`open files (-n) 1048576`, 即单个最多创建1048576个文件描述符(I/O连接)

><br/>
>
>**注2: Nginx请求连接数**
>
>对于Nginx而言, 在请求到来时会创建一个文件描述符, 而在处理请求向后端服务器做请求转发时还会创建文件描述符;
>
>所以并发总数是一定会小于`连接数(worker_connections) x 进程数(worker_processes)`;
>
>所以一般在计算Nginx可处理的最大客户端数时, 一般使用下面的公式来计算:
>
>**max_clients = worker_connections x worker_processes / 4**

****

#### http

**log_format**

日志的格式, 如:

```
log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
    '$status $body_bytes_sent "$http_referer" '
    '"$http_user_agent" "$http_x_forwarded_for"';
```

log_format 格式名称 '格式内容'

****

**access_log**

日志记录的位置, 如:

```
#access_log  logs/access.log  main;
```

****

**sendfile**

开启零拷贝;

关于零拷贝可以参考我的另一篇文章:

[NIO相关基础篇之操作系统I-O模型](https://jasonkayzk.github.io/2019/09/26/NIO%E7%9B%B8%E5%85%B3%E5%9F%BA%E7%A1%80%E7%AF%87%E4%B9%8B%E6%93%8D%E4%BD%9C%E7%B3%BB%E7%BB%9FI-O%E6%A8%A1%E5%9E%8B/)

简单来讲就是, 在进行IO的过程中, 数据不再通过全部读入内存而是直接通过两个文件描述符直接拷贝数据;

(避免了用户态↔内核态切换)

****

**tcp_nopush**

在进行IO时通常会在buffer中写入, 在buffer内容积累到一定程度之后才会调用flush刷入外部设备;

而启用了tcp_nopush之后, 会在发送时直接调用flush

****

**keepalive_timeout**

在HTTP/1.1中加入的keepalive;

可以保持这个会话存在的时长, 而不必请求一个直接关闭, 然后再创建连接;

****

**gzip**

文件在传输过程中进行压缩;

以CPU计算来换取带宽;

****

**server**

Nginx支持虚拟服务器, 所以在http中可以有多个server配置;

```
server {
    listen       80;
    server_name  www.test2.com;   
    location / {
        root   /mnt;
        autoindex on;
    }    
}

server {
    listen       80;
    server_name  www.test.com;
    location / {
        root   html;
        index  index.html index.htm;
    }
}
```

对于上面的两个server, 若在hosts文件中配置:

```bash
127.0.0.1 www.test.com www.test2.com
```

则在使用两个域名分别请求同一个127.0.0.1:80时, 会产生不同的结果;

><br/>
>
>location中的:
>
>`root html`使用的是相对路径, 指向的是nginx目录下的html目录;
>
>`root /mnt`使用的是绝对路径, 指向的是/mnt目录;
>
>**注: 可以在/mnt目录下可以挂载其他外部设备, 做资源共享**

产生不同结果的原因是Nginx是工作在七层的协议, 在收到请求后回去解析HTTP请求中的Host字段, 然后在配置文件中做匹配;

><br/>
>
>**Nginx请求匹配**
>
>Nginx在收到请求头后会去判定ip, port, host然后再去决定server;

****

#### **server.location**

在决定了server之后, Nginx会进行location匹配, 然后针对请求的uri对请求进行反向代理;

在一个server中可以配置多个location;

即: 可以对同一个页面的多个不同请求做不同的反向代理;

例如:

-   `www.test.com/search`
-   `www.test.com/user`
-   `www.test.com/system`
-   ……

##### **location映射规则**

location的配置规则如下

```
location [= | ~ | ~* | ^~] URI {...}
```

| **标识符** | **描述**                                                     |
| :--------- | ------------------------------------------------------------ |
| =          | **精确匹配**；用于标准uri前，要求请求字符串和uri严格匹配。如果匹配成功，就停止匹配，立即执行该location里面的请求。 |
| ~          | **正则匹配**；用于正则uri前，表示uri里面包含正则，并且区分大小写。 |
| ~*         | **正则匹配**；用于正则uri前，表示uri里面包含正则，不区分大小写。 |
| ^~         | **非正则匹配**；用于标准uri前，nginx服务器匹配到前缀最多的uri后就结束，该模式匹配成功后，不会使用正则匹配。 |
| 无         | **普通匹配（最长字符匹配）**；与location顺序无关，是按照匹配的长短来取匹配结果。若完全匹配，就停止匹配。 |

><br/>
>
>**备注**：
>
>1.如果uri里面包含正则表达式，就必须使用~或~*标识符；
>
>2.针对`~和~*`匹配标识符，可以在前面加上!来取反，如下：
>
>-   !~ 表示正则不匹配，区分大小写。
>-   !~* 表示正则不匹配，不区分大小写。

****

##### **location匹配规则**

**1.如果有精确匹配，会先进行精确匹配，匹配成功，立刻返回结果。**

**2.普通匹配与顺序无关，因为按照匹配的长短来取匹配结果。**

**3.正则匹配与顺序有关，因为是从上往下匹配。(首先匹配，就结束解析过程)**

结合标识符，匹配顺序如下:

<font color="#f00">**(location =) > (location 完整路径) > (location ^~ 路径) > (location ~,~* 正则顺序) > (location 部分起始路径) > (location /)**</font>

**换句话说:**

<font color="#f00">**（精确匹配）> (最长字符串匹配，但完全匹配) >（非正则匹配）>（正则匹配）>（最长字符串匹配，不完全匹配）>（location通配）**</font>

****

##### **location匹配案例**

假设，现有如下一些规则：

```
location = / {  
   //精确匹配/ ，主机名后面不能带任何字符串
    echo "规则A";
}
 
location = /login {
  //精确匹配 /login 开头的地址，匹配符合以后，不在继续往下搜索 
    echo "规则B";
}
 
location ^~ /blog/ { 
  //非正则匹配，匹配/blog/后，停止往下搜索正则，采用这一条
  echo "规则C";
}
 
 
location ~  \.(gif|jpg|png|js|css)$ {
    //区分大小写的正则匹配  若匹配成功，停止往下搜索正则，采用这一条
    echo "规则D";
}
 
 
location ~* \.png$ {  
   //区分大小写的正则匹配 ，停止往下搜索正则，采用这一条
    echo "规则E";
}
 
location / {
  //因为所有的地址都以 / 开头，所以这条规则将匹配到所有请求
  //如果没任何规则匹配上，就采用这条规则
    echo "规则F";
}
 
location /blog/detail { 
  //最长字符串匹配，若完全匹配成功，就不在继续匹配，否则还会进行正则匹配
  echo "规则G";
}
 
location /images {  
    //最长字符串匹配，同上 
    echo "规则Y";
}
 
location ^~ /static/files {  
    //非正则匹配，若匹配成功，就不在继续匹配
    echo "规则X";
}
```

1.当访问根路径/的时候，比如`http://www.findme.wang/` ，会匹配规则A。

2.当访如`http://www.findme.wang/login` ，会匹配规则B。

3.当访如`http://www.findme.wang/login.html`，会匹配规则F。

4.当访如`http://www.findme.wang/blog/detail/3.html` ，会匹配规则C。

>   <br/>
>
>   例4分析:
>
>   首先看看，“**精确匹配**”是否可以匹配成功，显示不可以；
>
>   然后，看看是否可以“**普通匹配**”是否可以完全匹配，显示也没有；
>
>   接着在看看非正则匹配，是否可以匹配成功，发现同规则C匹配上了，所以采用了规则C。

****

##### **location配置反向代理**

在location中可以使用root来指定文件路径;

也可以使用proxy_pass来配置反向代理;

例:

```
location ~* \.go$ {
    proxy_pass http://192.168.9.12;
}
```

上面将正则匹配对于以`.go`结尾的请求, 并反向代理到`http://192.168.9.12/`

但是如果只使用了反向代理, 大量的请求还是会负载到同一台服务器, 例如`192.168.9.12`;

此时还需要配置负载均衡;

****

##### **location配置负载均衡**

首先在server外配置upstream:

```
upstream myloadbalancer {
    server 192.168.9.12;
    server 192.168.9.13;
}
```

在upstream中定义了负载均衡服务器之后, 在location中使用upstream声明的负载均衡服务器进行配置:

```
location ~* \.go$ {
    proxy_pass http://myloadbalancer;
}
```

这样即可实现向多个服务器转发请求;

><br/>
>
>**注:**
>
>**在配置负载均衡时如果keepalive_timeout设置不为0, 则再次请求时由于连接未断开, 还会向同一个server转发请求**

<br/>

## 附录

参考文章:

-   [nginx配置中location匹配规则详解](http://www.findme.wang/blog/detail/id/495.html)



如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>