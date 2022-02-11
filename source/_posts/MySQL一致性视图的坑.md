---
title: MySQL一致性视图的坑
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?18'
date: 2022-02-11 19:44:22
categories: 数据库
tags: [MySQL, 数据库]
description: 我们都知道MySQL中的事务默认情况下隔离级别是可重复读，即别的事务对数据的操作不影响当前事务，但是这里有一个坑可能会打破你对可重复读的认知；
---

我们都知道MySQL中的事务默认情况下隔离级别是可重复读，即别的事务对数据的操作不影响当前事务；

但是这里有一个坑可能会打破你对可重复读的认知；

<br/>

<!--more-->

# **MySQL一致性视图的坑**









<br/>

# **附录**

文章参考：

-   https://blog.csdn.net/u012702547/article/details/122107506

<br/>
