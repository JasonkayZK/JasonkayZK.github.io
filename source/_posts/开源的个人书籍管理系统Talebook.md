---
title: 开源的个人书籍管理系统Talebook
toc: true
cover: 'https://img.paulzzh.com/touhou/random?14'
date: 2024-08-22 10:19:57
categories: 工具分享
tags: [软件推荐, 工具分享]
description: 我平时看的都是PDF电子书籍，但是之前没有用书籍管理，所以书籍比较乱；比较有名的书籍管理系统有Calibre，但是Talebook支持OPDS，同时能从豆瓣导入信息，比较好用；本文介绍了如何部署和配置Talebook；
---

我平时看的都是PDF电子书籍，但是之前没有用书籍管理，所以书籍比较乱；

比较有名的书籍管理系统有Calibre，但是Talebook支持OPDS，同时能从豆瓣导入信息，比较好用；

本文介绍了如何部署和配置Talebook；

源代码：

-   https://github.com/JasonkayZK/docker-repo/tree/talebook

<br/>

<!--more-->

# **开源的个人书籍管理系统Talebook**

## **部署**

项目地址如下：

-   https://github.com/talebook/talebook

DockerHub地址：

-   https://hub.docker.com/r/talebook/talebook

B站上也有UP主对Talebook做了介绍：

-   https://www.bilibili.com/video/BV1AT411S7c3/

部署起来也是非常简单，先把镜像拉下来，然后 docker-compose 就行：

docker-compose.yml

```yaml
version: "3"

services:
  talebook:
    container_name: talebook
    image: talebook/talebook:v3.8.1
    volumes:
      - /data/talebook:/data
    ports:
       - "80:80"
       - "443:443"
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Asia/Shanghai
      # 调整为『SSR=ON』可开启「服务器端渲染」模式，对于搜索引擎更友好，同时更消耗服务器性能
      - SSR=OFF
    depends_on:
      - douban-rs-api
    restart: always
      
  douban-rs-api:
    container_name: douban-rs-api
    # https://github.com/cxfksword/douban-api-rs
    image: ghcr.io/cxfksword/douban-api-rs:latest
    restart: always
```

配置都比较简单，目录挂载、端口映射直接根据自己的需求修改即可！

<br/>

## **配置**

基本的配置，上面的B站UP基本上都讲了；

需要注意的是：

<font color="#f00">**配置豆瓣的时候，url 结尾的 `/` 要删除！否则会无法使用！**</font>

>   参考：
>
>   -   https://github.com/talebook/talebook/issues/340#issuecomment-2097703672

<br/>

## **其他**

支持 OPDS 的 APP 推荐：

-   安卓：静读天下
-   iOS、MacOS：Yomu、KyBook

>   参考：
>
>   -   https://gameapp.club/post/2022-12-25-ebooks/

需要注意的是：

**如果要使用 OPDS，需要配置：**

-   **关闭「私人图书馆」模式。**
-   **打开「允许任意下载」（访客无需注册或登录）**

>   参考：
>
>   -   https://github.com/talebook/talebook/blob/master/document/README.zh_CN.md#%E9%9D%99%E8%AF%BB%E5%A4%A9%E4%B8%8Bapp%E9%87%8C%E8%AE%BF%E9%97%AE%E4%B9%A6%E5%BA%93%E4%BC%9A%E5%A4%B1%E8%B4%A5%E6%80%8E%E4%B9%88%E5%8A%9E

**Enjoy!**

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/docker-repo/tree/talebook

参考：

-   https://www.bilibili.com/video/BV1AT411S7c3/
-   https://blog.hsu.life/2024/01/14/%E6%89%8B%E6%9C%BA%E5%A6%82%E4%BD%95%E6%96%B9%E4%BE%BF%E7%9A%84%E4%BD%BF%E7%94%A8%E4%B9%A6%E5%BA%93/index.html
-   https://gameapp.club/post/2022-12-25-ebooks/

<br/>
