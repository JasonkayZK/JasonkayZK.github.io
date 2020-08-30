---
title: Maven打包java11报错Fatal error compiling的解决办法
toc: true
date: 2019-10-16 13:43:19
categories: Maven
cover: https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/u=2652402318,679790988&fm=26&gp=0.jpg
tags: [Maven, 项目构建]
description: 最近一段时间一直都在忙导师公司的事情, 然后一边在写一个文件分享的项目, 实在没什么时间写博客, 今天终于忙完导师公司的事情, 然后打包构建项目的时候发现无法构建. 在网上一番查证之后, 终于发现问题所在.
---



最近一段时间一直都在忙导师公司的事情, 然后一边在写一个文件分享的项目, 实在没什么时间写博客, 今天终于忙完导师公司的事情, 然后打包构建项目的时候发现无法构建: `Fatal error compiling`的错误

在网上一番查证之后, 终于发现问题所在, 原来是Java 11之后, 在Maven中的标注不再是`1.8`, 而是`11`!

看完本篇文章你将学会:

-   如何使用Maven构建JDK11的项目
-   如何通过在pom.xml中指定源代码与编译代码版本
-   如何配置IDEA中的JDK环境
-   ......



<!--more-->

## Maven打包java11报错Fatal error compiling的解决办法

### 前言

今天在使用Maven打包JDK11的项目的时候发现, 报错`Fatal error compiling`, 在网上经过一番查证, 发现了是在Maven中指定项目JDK版本时指定格式有问题!

写下这篇文章记录一下这个坑, 同时也总结一下使用Maven构建工程时使用到的XML标签.



<br/>

-----------------



### `Fatal error compiling`错误的解决

在Maven工程中, 之前pom.xml的内容为:

```xml
    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <java.version>1.11</java.version>
        <maven.compiler.source>1.11</maven.compiler.source>
        <maven.compiler.target>1.11</maven.compiler.target>
    </properties>
```

其中问题就出现在: <font color="#ff0000">JDK版本指定应当直接指定为11, 而对于JDK8 则指定为1.8!</font>

修改内容为:

```xml
 <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <java.version>11</java.version>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
   </properties>
```

即可构建成功!

就这么简单, 就浪费了将近20分钟...., 因为没找到问题所在, 我也是无语.

>   **注: ** 除了上面修改Maven项目下的pom.xml内容之外, 在使用IDEA时, 还需要设置:
>
>   -   项目SDK: File -> project Structure -> project -> ProjectSDK: 11
>   -   项目模块: File -> project Structure -> Modules -> Language Level 11
>   -   Java编译器: Setting -> File -> Settings -> Build, Execution, Deployment -> Compiler -> Java Compiler -> Project bytecode version: 11

<br/>

通常在IDEA中设置了以上版本都一致时即可! 然后通过命令: 

`mvn clean insall` 构建你的项目吧!



