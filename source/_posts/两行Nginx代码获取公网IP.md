---
title: 两行Nginx代码获取访问者的公网IP
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?33'
date: 2020-11-13 10:38:44
categories: Nginx
tags: [Nginx, 技术杂谈]
description: 今天在RSS上看到的内容，无需配置后台，利用Nginx即可返回访问者的公网IP地址；感觉挺实用的，就翻译了一下；
---

今天在RSS上看到的内容，无需配置后台，利用Nginx即可返回访问者的公网IP地址；

感觉挺实用的，就翻译了一下；

<br/>

<!--more-->

## 两行Nginx代码获取访问者的公网IP

无需配置后台，利用Nginx即可返回访问者的公网IP地址；

### **① 返回普通文本格式**

添加一个`/ip`路径的映射，并配置为：

```nginx
location /ip {
    default_type text/plain;
    return 200 $remote_addr;
}
```

调用返回结果如下：

```bash
$ curl https://example.com/ip
2001:1b48:103::189
```

`default_type text/plain`阻止了浏览器尝试将响应下载为文件；

即，此时Web浏览器可以直接显示IP地址；

### **② 返回json格式**

添加一个`/json_ip`的路径，如下：

```nginx
location /json_ip {
    default_type application/json;
    return 200 "{\"ip\":\"$remote_addr\"}";
}
```

现在，响应是一个JSON格式：

```bash
$ curl -s https://example.com/json_ip | jq
{
    "ip": "2001:1b48:103::189"
}
```

<br/>

## 附录

文章参考：

-   https://www.ecalamia.com/blog/show-ip-api-nginx/

<br/>