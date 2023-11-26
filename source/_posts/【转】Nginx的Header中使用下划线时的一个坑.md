---
title: 【转】Nginx的Header中使用下划线时的一个坑
toc: true
cover: 'https://img.paulzzh.com/touhou/random?34'
date: 2021-06-24 15:10:29
categories: Nginx
tags: [Nginx, 技术杂谈]
description: Nginx的Header中默认不解析下划线，这一点要注意！
---

Nginx的Header中默认不解析下划线，这一点要注意！

<br/>

<!--more-->

## **【转】Nginx的Header中使用下划线时的一个坑**

### **问题描述**

最近遇到一个 Nginx 转发的坑，一个请求转发到 Tomcat 时发现有几个 http header 始终获取不到，导致线上出现 bug，运维说不是他的问题，这个锅我背了。

新增的几个 **header** 是这样的：

-   accept_sign
-   accept_token
-   ...

反复检查代码，确定这些 header 是传了的，而且本地测试单独在 tomcat 中是可以接受到这些参数的，所以 tomcat 和命名本身是没问题的，初步断定是 Nginx 的问题；

经过一翻搜索，终于找到了一个 Nginx 的配置参数：

-   **underscores_in_headers**：这个参数默认值为：off，即默认忽略带下划线的 header；

<br/>

### **解决方案：**

#### **① 修改Nginx配置**

在 http 或者 server 配置中把 **underscores_in_headers** 配置参数开关打开：

```
server {
  ...
  underscores_in_headers on;
  ...
}
```

增加配置后，然后重启 Nginx；

<br/>

#### **② 修改Header**

使用破折号（-）代替下划线（_），或者统一规范直接不要使用下划线；

我们来看下一般的 http **header** 长什么样的：

```
HTTP/1.1 200 OK
Date: Thu, 24 Jun 2021 07:23:35 GMT
Cache-Control: max-age=600, public, must-revalidate
CF-Cache-Status: DYNAMIC
cf-request-id: 0ade802cdc0000cc6684aa3000000001
Server: cloudflare
CF-RAY: 66443627cfaacc66-YOW
alt-svc: h3-27=":443"; ma=86400, h3-28=":443"; ma=86400, h3-29=":443"; ma=86400, h3=":443"; ma=86400
Content-Type: text/html
Last-Modified: Fri, 02 Apr 2021 00:40:42 GMT
Vary: Accept-Encoding
Content-Encoding: gzip
X-DNS-Prefetch-Control: off
```

一般所见的 headers 确实也都是中杠线，没有下划线；

<br/>

### **Nginx 为什么默认忽略带下划线 header？**

我找到了 Nginx 的官方说明：

>   https://www.nginx.com/resources/wiki/start/topics/tutorials/config_pitfalls/?highlight=underscores#missing-disappearing-http-headers

>   If you do not explicitly set `underscores_in_headers on;`, NGINX will silently drop HTTP headers with underscores (which are perfectly valid according to the HTTP standard). This is done in order to prevent ambiguities when mapping headers to CGI variables as both dashes and underscores are mapped to underscores during that process.

根据官方说明，这样做是<font color="#f00">**为了避免把 headers 映射为 CGI 变量时出现歧义，因为破折号和下划线都会被映射为下划线，所以两者不好区分；**</font>

好吧，终于弄清楚了，这个问题也太变态了，这应该是 Nginx 设计时的一个缺陷吧，这个坑我替你们踩了！

所以，推荐大家使用第二种方案：<font color="#f00">**统一规范 headers 不要使用下划线，使用 Nginx 默认的配置即可，这样可以尽量避免环境上的差异，以免后续带来问题；**</font>

<br/>

## **附录**

文章转自：

-   [Nginx 转发时的一个坑，运维居然让我背锅！！](https://mp.weixin.qq.com/s/gERA4XFZnTrHcczyWMIBtg)


<br/>
