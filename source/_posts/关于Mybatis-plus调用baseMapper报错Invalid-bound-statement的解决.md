---
title: 关于Mybatis-plus调用baseMapper报错Invalid-bound-statement的解决
toc: true
date: 2020-01-25 10:21:59
cover: https://acg.toubiec.cn/random?9
categories: Mybatis
tags: [Mybatis]
description: 在Spring Boot项目中引入Mybatis-Plus之后, 直接调用baseMapper的方法时一直报错Invalid-bound-statement, 最后发现是依赖的问题
---

在Spring Boot项目中引入Mybatis-Plus之后, 直接调用baseMapper的方法时一直报错Invalid-bound-statement, 最后发现是依赖的问题

<br/>

<!--more-->

### 问题说明

在调用baseMapper的方法之后报错日志:

```java
[dispatcherServlet] - Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed; nested exception is org.apache.ibatis.binding.BindingException: Invalid bound statement (not found): top.jasonkayzk.ezshare.system.dao.mapper.DictMapper.selectById] with root cause
org.apache.ibatis.binding.BindingException: Invalid bound statement (not found): top.jasonkayzk.ezshare.system.dao.mapper.DictMapper.selectById
	at org.apache.ibatis.binding.MapperMethod$SqlCommand.<init>(MapperMethod.java:235)
	at org.apache.ibatis.binding.MapperMethod.<init>(MapperMethod.java:53)
	at org.apache.ibatis.binding.MapperProxy.lambda$cachedMapperMethod$0(MapperProxy.java:98)
    ......
```

即找不到baseMapper的方法

><br/>
>
>**说明:**
>
>**在使用Mybatis-Plus的时候, 可以通过继承IService, BaseMapper等从而获得ORM相关操作**

<br/>

### 解决方法

网上普遍的解决方法有:

-   修改Mapper.xml中的配置, namespace与实际路径相对应
-   修改pom.xml文件中的`<resource>`标签内容使其包括*.xml
-   Mapper接口类添加@Mapper注解
-   ……

抱着侥幸心理尝试了大量的方法, 但是这些方法都没有解决

<br/>

最后怀疑是依赖问题, 大年初一一大早把Mybatis的依赖修改:

```xml
<!-- 修改前 -->
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>${mybatis.starter.version}</version>
</dependency>

<!-- 修改后 -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>${mybatis-plus.version}</version>
</dependency>
```

><br/>
>
><font color="#f00">**说明: 之前忘记添加Mybatis-Plus的启动依赖, 但是由于引入了mybatis-plus-generator的依赖, 让我误以为已经加入了依赖, 现在想来真是蠢得要命**</font>

<br/>

