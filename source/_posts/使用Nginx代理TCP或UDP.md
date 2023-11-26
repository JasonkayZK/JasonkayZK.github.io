---
title: 使用Nginx代理TCP或UDP
toc: true
cover: 'https://img.paulzzh.com/touhou/random?33'
date: 2022-10-24 14:07:53
categories: Nginx
tags: [Nginx]
description: 使用Nginx做代理转发是一个非常常用的功能；比如：有的时候在开发机上使用Docker起了一个服务，这个容器的端口在启动的时候没有暴露，如果后面需要远程访问，就要修改配置，比较麻烦；此时可以使用 Nginx，在开发机上设置容器的代理（相对于我们手动Ingress），然后就可以连接了！
---

使用Nginx做代理转发是一个非常常用的功能；

比如：有的时候在开发机上使用Docker起了一个服务，这个容器的端口在启动的时候没有暴露，如果后面需要远程访问，就要修改配置，比较麻烦；

此时可以使用 Nginx，在开发机上设置容器的代理（相对于我们手动Ingress），然后就可以连接了！

<br/>

<!--more-->

# **使用Nginx代理TCP或UDP**

安装 Nginx 的部分这里就不介绍了，网上一找一大堆；

>   **这里推荐使用源码的方式编译安装，因为源码包中包括了一些常用模块，可以自行安装！**

这里主要是介绍一下 Nginx 代理 TCP 或者 UDP 的配置；

<br/>

## **安装ngx_stream_module模块**

由于代理 TCP/UDP 依赖 ngx_stream_module 模块，所以首先我们要安装；

>   安装过这个模块的可以忽略；

首先进入 nginx 解压后的目录：

```bash
$ ll
total 832
drwxr-xr-x  3 root root   4096 Oct 24 13:46 objs
-rw-r--r--  1 root root    438 Oct 24 13:45 Makefile
drwxr-xr-x 14 root root   4096 Aug  2 17:56 ..
drwxr-xr-x 10 1001 1001   4096 Nov 27  2021 .
drwxr-xr-x  3 root root   4096 Nov 27  2021 nginx-backup
drwxr-xr-x  6 1001 1001   4096 Nov 27  2021 auto
drwxr-xr-x  2 1001 1001   4096 Nov 27  2021 conf
drwxr-xr-x  4 1001 1001   4096 Nov 27  2021 contrib
drwxr-xr-x  2 1001 1001   4096 Nov 27  2021 html
drwxr-xr-x  2 1001 1001   4096 Nov 27  2021 man
drwxr-xr-x  9 1001 1001   4096 Nov 27  2021 src
-rw-r--r--  1 1001 1001 311503 May 25  2021 CHANGES
-rw-r--r--  1 1001 1001   1397 May 25  2021 LICENSE
```

声明我们的编译配置：

```bash
./configure --prefix=/usr/share/nginx --with-compat --with-http_stub_status_module --with-http_ssl_module --with-stream=dynamic
```

>   **注意：这里的 `--with-compat` 一定要带上，否则编译后的链接库可能无法使用！**
>
>   详见：
>
>   -   https://serverfault.com/questions/988250/nginx-module-not-binary-compatible-after-compilation-on-centos-7

最后编译：

```bash
make
```

编译后，在 `objs/` 目录下会有编译好的 ngx_stream_module.so 模块：

```bash
$ ll objs/*.so
-rwxr-xr-x 1 root root 1360112 Oct 24 13:46 objs/ngx_stream_module.so
-rwxr-xr-x 1 root root  970168 Nov 27  2021 objs/ngx_mail_module.so
-rwxr-xr-x 1 root root  216256 Nov 27  2021 objs/ngx_http_perl_module.so
-rwxr-xr-x 1 root root  186904 Nov 27  2021 objs/ngx_http_image_filter_module.so
-rwxr-xr-x 1 root root  197728 Nov 27  2021 objs/ngx_http_xslt_filter_module.so
```

至此，我们的模块准备完成！

<br/>

## **修改Nginx配置**

在 ngx_stream_module 模块准备好了之后，首先我们修改 Nginx 的入口配置文件：

在首行引用这个模块，并增加子模块配置：

/etc/nginx/nginx.conf

```diff
+ load_module /opt/nginx-1.20.1/objs/ngx_stream_module.so;

+ stream {
+    include /etc/nginx/conf.d/*.stream;
+ }
```

>   **强烈推荐使用模块化的方式配置 nginx，即：**
>
>   **在入口文件中只是 include 其他配置文件，而不写其他配置逻辑！**

随后在 `conf.d` 中增加子配置，这里以 clickhouse 的连接代理配置为例：

conf.d/click-house.stream

```
upstream CLICKHOUSE {
    server 172.19.0.2:8123;
}

server {
    listen 18123;

    proxy_connect_timeout 30s;
    proxy_timeout 600s;
    proxy_pass CLICKHOUSE;
}
```

上面的 `172.19.0.2:8123` 为容器中的 `ip:port`，K8S部署的话，可以通过下面的命令获取：

```bash
$ kubectl -n my-ch get svc
NAME                      TYPE           CLUSTER-IP     EXTERNAL-IP                                   PORT(S)                         AGE
clickhouse-demo-01        LoadBalancer   10.43.93.132   172.19.0.2,172.19.0.3,172.19.0.4,172.19.0.5   8123:30842/TCP,9000:31655/TCP   15h
chi-demo-01-demo-01-0-0   ClusterIP      None           <none>                                        8123/TCP,9000/TCP,9009/TCP      15h
chi-demo-01-demo-01-1-0   ClusterIP      None           <none>                                        8123/TCP,9000/TCP,9009/TCP      15h
```

而 server 中的 `18123` 为自己定义的服务器对外代理的 port；

在外部连接的时候，直接使用 `server:18123` 即可和容器中的ClickHouse连接！

最后，重启 Nginx：

```bash
systemctl restart nginx
```

即可生效！

<br/>

# **附录**

文章参考：

-   https://cloud.tencent.com/developer/article/1629758
-   https://www.xiexianbin.cn/linux/nginx/2018-10-21-nginx-proxy-stream/index.html
-   https://www.fxkjnj.com/2560/
-   https://www.cnblogs.com/GYoungBean/p/15128007.html
-   https://serverfault.com/questions/988250/nginx-module-not-binary-compatible-after-compilation-on-centos-7




<br/>
