---
title: 为什么Spring中不推荐使用@Autowired字段注入
toc: true
date: 2019-10-16 14:48:40
categories: [Spring]
tags: Spring
cover: https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1571676678621&di=cb9b198a4edbc3a228760be11e427c13&imgtype=0&src=http%3A%2F%2Fimg.mukewang.com%2F57aebe45000109ad05000205.jpg
description: 最近在学习一个项目的时候, 发现IDEA在我的@Autowired标注的变量上面提醒警告Field injection is not recommended. 不推荐使用字段注射方式! 这是为什么呢? 本篇文章给与解答!
---



最近在学习一个项目的时候, 发现IDEA在我的@Autowired标注的变量上面提醒警告: `Field injection is not recommended`. 不推荐使用字段注射方式! 这是为什么呢? 本篇文章给与解答!

读完本文你将学会:

-   Spring的三种依赖注入方式: 构造函数注入, Setter注入, 字段注入
-   为什么Spring中不推荐使用@Autowired字段注入
-   ......



<br/>



<!--more-->

## 为什么Spring中不推荐使用@Autowired字段注入

### 前言

最近在做项目时, 在使用字段注入时(如下图所示), 会提示: `Field injection is not recommended`, 在一番搜索之后找到了答案!

![Autowired](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1571676678621&di=cb9b198a4edbc3a228760be11e427c13&imgtype=0&src=http%3A%2F%2Fimg.mukewang.com%2F57aebe45000109ad05000205.jpg)



<br/>

--------------------------



### Spring的三种依赖注入方式

1.  构造函数注入 ，这也是比较推荐的方式
2.  Setter或者其他方法注入
3.  字段注入, 不推荐!

这三种其实都可以使用 `@Autowired` 注解，只是注解修饰的是构造函数，方法，还是字段.



<br/>

### 字段注入的缺点

1.  <font color="#0000ff">只需要使用 `@Autowired` 就很容易的进行依赖注入，为什么说这是个缺点呢，因为这种方便可能让你放弃对依赖的思考，结果就是你的类的依赖可能是十几个或者更多，这样违反了SPR!</font>
2.  <font color="#0000ff">对单元测试不友好，你没办法直接初始化这个类，必须依赖 DI 容器.</font>
3.  <font color="#0000ff">类的依赖被隐藏起来，并不能像构造函数那样在初始化时，就直观的知道这个类有哪些依赖.</font>
4.  <font color="#0000ff">你的类跟DI容器强耦合在一起.</font>

<br/>

由于以上的缺点导致字段注入虽然很方便, 但是也确实是除了方便之外没什么其他好处了! 所以<font color="#ff0000">下次写完之后, 老老实实使用IDEA转换为构造器注入是一个更好的主意!</font>

