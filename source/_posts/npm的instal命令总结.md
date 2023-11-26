---
title: npm的instal命令总结
toc: true
cover: 'https://img.paulzzh.com/touhou/random?44'
date: 2021-02-17 20:21:49
categories: NPM
tags: [技术杂谈, NPM]
description: 在使用npm安装依赖的时候，有几个额外的占位符，如，-g、-s等等。本文总结了常用的占位符的作用；
---

在使用npm安装依赖的时候，有几个额外的占位符，如，-g、-s等等；

本文总结了常用的占位符的作用；

<br/>

<!--more-->

## **npm的instal命令总结**

我们在使用 npm install 安装模块的模块的时候 ，一般会使用下面这几种命令形式：

-   `npm install moduleName`；
-   `npm install -g moduleName`；
-   `npm install -save moduleName`；
-   `npm install -save-dev moduleName`；

在项目中我们应该使用四个命令中的哪个呢？这个就要视情况而定了；

>   更多的说明，可以查看文档，使用下面的命令可以打开本地的文档：
>
>   ```bash
>   npm help npm
>   ```
>
>   在左侧找到`npm install`有完整的说明！

下面对这四个命令进行对比：

### **① npm install**

安装模块到项目 node_modules 目录下；

<font color="#f00">**不会将模块依赖写入 devDependencies 或 dependencies 节点，所以运行 npm install 初始化项目时不会下载模块；**</font>

>   **使用场景：**
>
>   **通常只是在本地测试一些功能时使用；**

****

### **② npm install -g**

<font color="#f00">**安装模块到全局，不会在项目 node_modules 目录中保存模块包；**</font>

<font color="#f00">**不会将模块依赖写入 devDependencies 或 dependencies 节点；**</font>

<font color="#f00">**运行 npm install 初始化项目时不会下载模块；**</font>

>   **使用场景：**
>
>   **安装一些cli工具，或者全局开发工具等场景下使用；**

****

### **③ npm install -save**

`-save`也可以使用`-S`代替；

安装模块到项目 node_modules 目录下；

<font color="#f00">**会将模块依赖写入 dependencies 节点；**</font>

<font color="#f00">**运行 npm install 初始化项目时，会将模块下载到项目目录下；**</font>

<font color="#f00">**运行 npm install --production 或者注明 NODE_ENV 变量值为 production 时，`会`自动下载模块到 node_modules 目录中；**</font>

>   **使用场景：**
>
>   **给项目添加项目必备模块时使用；**

****

### **④ npm install -save-dev**

`-save-dev`也可以使用`-D`代替；

安装模块到项目 node_modules 目录下；

<font color="#f00">**会将模块依赖写入 devDependencies 节点；**</font>

<font color="#f00">**运行 npm install 初始化项目时，会将模块下载到项目目录下；**</font>

<font color="#f00">**运行 npm install --production 或者注明 NODE_ENV 变量值为 production 时，`不会`自动下载模块到 node_modules 目录中；**</font>

>   **使用场景：**
>
>   **为项目添加一些开发、打包模块依赖时使用；**

>   **补充：devDependencies和Dependencies**
>
>   devDependencies 节点下的模块是我们在**开发时需要用的**，比如：项目中使用的 gulp，压缩 css、js 的模块；但是这些模块在我们的**项目部署后是不需要的，所以我们可以使用 -save-dev 的形式安装；**
>
>   而像 express 这些模块是**项目运行必备**的，应该安装在 dependencies 节点下，所以我们应该使用 -save 的形式安装；

<br/>

## **附录**

文章参考：

-   [NPM install -save 和 -save-dev 傻傻分不清](https://www.limitcode.com/detail/59a15b1a69e95702e0780249.html)

<br/>