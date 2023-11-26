---
title: 解决Mybatis分页插件PageHelper的Interceptor不匹配的问题
toc: true
date: 2020-01-16 14:24:39
cover: https://img.paulzzh.com/touhou/random?6
categories: Mybatis
tags: [Mybatis]
description: 使用Mybatis的PageHelper插件时候报错java.lang.ClassCastException-com.github.pagehelper.PageHelper cannot be cast to org.apache.ibatis.plugin.Interceptor异常, 网上搜索资料最后解决了问题
---

使用Mybatis的PageHelper插件时候报错java.lang.ClassCastException: com.github.pagehelper.PageHelper cannot be cast to org.apache.ibatis.plugin.Interceptor异常, 网上搜索资料最后解决了问题

<br/>

<!--more-->

在使用PageHelper时启动Spring报错如下:

```
org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'sqlSessionFactory' defined in class path resource 
	[applicationContext.xml]: Invocation of init method failed; nested exception is org.springframework.core.NestedIOException:
	Failed to parse config resource: class path resource [mybatis-config.xml]; 
    ......
Cause: java.lang.ClassCastException: com.github.pagehelper.PageHelper cannot be cast to org.apache.ibatis.plugin.Interceptor
	at org.mybatis.spring.SqlSessionFactoryBean.buildSqlSessionFactory(SqlSessionFactoryBean.java:500)
	at org.mybatis.spring.SqlSessionFactoryBean.afterPropertiesSet(SqlSessionFactoryBean.java:380)
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.invokeInitMethods(AbstractAutowireCapableBeanFactory.java:1687)
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.initializeBean(AbstractAutowireCapableBeanFactory.java:1624)
	... 25 more
Caused by: org.apache.ibatis.builder.BuilderException: Error parsing SQL Mapper Configuration. Cause: java.lang.ClassCastException: com.github.pagehelper.PageHelper cannot be cast to org.apache.ibatis.plugin.Interceptor
	at org.apache.ibatis.builder.xml.XMLConfigBuilder.parseConfiguration(XMLConfigBuilder.java:121)
	at org.apache.ibatis.builder.xml.XMLConfigBuilder.parse(XMLConfigBuilder.java:99)
	at org.mybatis.spring.SqlSessionFactoryBean.buildSqlSessionFactory(SqlSessionFactoryBean.java:494)
	... 28 more
Caused by: java.lang.ClassCastException: com.github.pagehelper.PageHelper cannot be cast to org.apache.ibatis.plugin.Interceptor
	at org.apache.ibatis.builder.xml.XMLConfigBuilder.pluginElement(XMLConfigBuilder.java:183)
	at org.apache.ibatis.builder.xml.XMLConfigBuilder.parseConfiguration(XMLConfigBuilder.java:110)
	... 30 more

```

主要是这句: com.github.pagehelper.PageHelper cannot be cast to org.apache.ibatis.plugin.Interceptor

再来看看我的配置:

```xml
<plugins>
    <plugin interceptor="com.github.pagehelper.PageHelper">
        <!-- 设置数据库类型 Oracle,Mysql,MariaDB,SQLite,Hsqldb,PostgreSQL六种数据库-->       
        <property name="dialect" value="Oracle"/>
    </plugin>
</plugins>
```

配置中实现的是com.github.pagehelper.PageHelper这个接口，而错误报的是这个接口在强转成org.apache.ibatis.plugin.Interceptor这个接口时报错了

-   <font color="#f00">**而自4.0.0版本以后就不再实现这个接口了，转而实现这个接口: `org.apache.ibatis.plugin.Interceptor`**</font>

-   <font color="#f00">**同时自4.0.0以后的版本已经可以自动识别数据库了，所以不需要我们再去指定数据库**</font>

所以，修改配置：

```xml
<!-- 配置分页插件 -->
<plugins>
    <plugin interceptor="com.github.pagehelper.PageInterceptor">
        <!-- 设置数据库类型 Oracle,Mysql,MariaDB,SQLite,Hsqldb,PostgreSQL六种数据库-->       
        <!-- <property name="dialect" value="Oracle"/> -->
    </plugin>
</plugins>
```



### 参考文章

-   [com.github.pagehelper.PageHelper cannot be cast to org.apache.ibatis.plugin.Interceptor和oracle不识别](https://blog.csdn.net/s592652578/article/details/78179998)

<br/>