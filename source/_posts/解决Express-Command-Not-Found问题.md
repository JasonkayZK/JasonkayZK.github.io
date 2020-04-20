---
title: 解决Express Command Not Found问题
cover: http://api.mtyqx.cn/api/random.php?56
date: 2020-04-20 10:43:38
categories: Node.js
tags: [Node.js, Express, 软件安装与配置]
description: 跟着《nodejs开发指南》初始化Express项目时, 使用npm安装了Express, 但是使用express命令初始化时仍然报错未找到express命令. 原来是express3+已经把创建一个APP的功能分离出来为express-generator.
---

跟着《nodejs开发指南》初始化Express项目时, 使用npm安装了Express, 但是使用express命令初始化时仍然报错未找到express命令. 原来是express3+已经把创建一个APP的功能分离出来为express-generator.

<br/>

<!--more-->

## 解决Express Command Not Found问题

### 安装Express脚手架

在express3+后, 使用`npm install -g express`时仅仅安装了express框架;

而express的脚手架已经被分离, 使用:

```
npm install -g express-generator
```

安装express的脚手架即可;

****

### 初始化ejs项目

**`express -t ejs microblog`创建的不再是ejs模板引擎而是jade模板引擎**

可以通过查看microblog文件夹中的package.json中知道创建出来的不是ejs模板而是jade模板引擎

>   <br/>
>
>   **解决方法：应该使用`express -e microblog`命令初始化工程(-e就是ejs模板)**

****

### 启动项目

使用node app.js启动, 访问不到页面

解决方法：使用`npm start`命令启动工程

<br/>