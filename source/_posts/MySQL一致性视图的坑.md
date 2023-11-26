---
title: MySQL一致性视图的坑
toc: true
cover: 'https://img.paulzzh.com/touhou/random?18'
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

## **TL;DR**

<font color="#f00">**MySQL的事务的一致性视图并非是在 BEGIN 执行后就真正建立的，而是在执行完 BEGIN 之后，在接下来执行的第一句 SQL后，事务才真正启动；**</font>

可以使用下面的命令，将一致性视图的创建提前到 `BEGIN` 执行后立刻开启：

```sql
start transaction with consistent snapshot;
```

下面我们通过实例来展示一下；

<br/>

## **数据准备**

实例中准备的数据如下：

```sql
CREATE TABLE `user` (
  `id` bigint(32) NOT NULL AUTO_INCREMENT COMMENT 'Id',
  `name` varchar(255) DEFAULT '',
  `age` tinyint unsigned DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO user (name, age) VALUES ('a', 12), ('b', 15);
```

执行完成后我们来测试一下：

```sql
mysql> select * from user;

+----+------+------+
| id | name | age  |
+----+------+------+
|  1 | a    |   12 |
|  2 | b    |   15 |
+----+------+------+
2 rows in set (0.00 sec)
```

<br/>

## **BEGIN后未执行命令**

打开两个MySQL终端；

首先在A终端执行命令：

```sql
-- 执行事务前查询
mysql> select * from user;
+----+------+------+
| id | name | age  |
+----+------+------+
|  1 | a    |   12 |
|  2 | b    |   15 |
+----+------+------+
2 rows in set (0.00 sec)

-- 开启事务
mysql> begin;
Query OK, 0 rows affected (0.00 sec)
```

可以看到，在开启事务前，name b 对应的年龄为15；

接下来在B终端不开启事务并执行UPDATE命令：

```sql
mysql> update user set age=age-1 where id=2;
Query OK, 1 row affected (0.00 sec)
Rows matched: 1  Changed: 1  Warnings: 0

mysql> select * from user;
+----+------+------+
| id | name | age  |
+----+------+------+
|  1 | a    |   12 |
|  2 | b    |   14 |
+----+------+------+
2 rows in set (0.00 sec)
```

可以看到，年龄被更新为了14；

然后我们再回到A终端中查看（此时A会话已经执行了BEGIN）：

```sql
mysql> select * from user;
+----+------+------+
| id | name | age  |
+----+------+------+
|  1 | a    |   12 |
|  2 | b    |   14 |
+----+------+------+
2 rows in set (0.00 sec)
```

可以看到，即使已经执行了`BEGIN`命令，A终端中的记录也发生了变化！

执行的路径如下表所示：

| A终端               | B终端                                 |
| ------------------- | ------------------------------------- |
| select * from user; |                                       |
| begin;              |                                       |
|                     | update user set age=age-1 where id=2; |
| select * from user; |                                       |

可以看到，A终端执行`BEGIN`命令后，并未执行SQL，因此此时事务还尚未开启，也就没有创建一致性视图；

此时在B终端中执行UPDATE也会改变A终端查询的内容！

这和我们上面的分析是一致的！

下面我们来看另一种情况；

<br/>

## **BEGIN后先执行查询命令**

这次，我们在A终端执行 `BEGIN` 后立刻执行一条SELECT语句，看一下效果；

即执行路径如下：

| A终端               | B终端                                 |
| ------------------- | ------------------------------------- |
| select * from user; |                                       |
| begin;              |                                       |
| select * from user; |                                       |
|                     | update user set age=age-1 where id=2; |
| select * from user; |                                       |

首先在A终端执行：

```sql
mysql> select * from user;
+----+------+------+
| id | name | age  |
+----+------+------+
|  1 | a    |   12 |
|  2 | b    |   14 |
+----+------+------+
2 rows in set (0.00 sec)


mysql> begin;
Query OK, 0 rows affected (0.00 sec)

mysql> select * from user; -- 执行BEGIN后立即执行SELECT查询
+----+------+------+
| id | name | age  |
+----+------+------+
|  1 | a    |   12 |
|  2 | b    |   14 |
+----+------+------+
2 rows in set (0.00 sec)
```

在B终端中更新：

```sql
mysql> update user set age=age-1 where id=2;
Query OK, 1 row affected (0.00 sec)
Rows matched: 1  Changed: 1  Warnings: 0

mysql> select * from user;
+----+------+------+
| id | name | age  |
+----+------+------+
|  1 | a    |   12 |
|  2 | b    |   13 |
+----+------+------+
2 rows in set (0.00 sec)
```

在A终端中再次查询：

```sql
mysql> select * from user;
+----+------+------+
| id | name | age  |
+----+------+------+
|  1 | a    |   12 |
|  2 | b    |   14 |
+----+------+------+
2 rows in set (0.00 sec)
```

可以看到，这次的确开启了事务，A终端中的结果还是更新之前的值！

这也符合：<font color="#f00">**用户在另外一个事务中执行同条 SELECT 语句数次，结果总是相同的；**</font>

那么如何将一致性视图的创建提前到 `BEGIN` 执行后立刻开启，而非手动执行一条SELECT呢？

答案是使用下面的命令：

```sql
start transaction with consistent snapshot;
```

下面我们来试一下；

<br/>

## **BEGIN后直接创建一致性视图**

执行路径如下所示：

| A终端                                       | B终端                                 |
| ------------------------------------------- | ------------------------------------- |
| select * from user;                         |                                       |
| start transaction with consistent snapshot; |                                       |
|                                             | update user set age=age-1 where id=2; |
| select * from user;                         |                                       |

首先在A终端执行：

```sql
mysql> select * from user;
+----+------+------+
| id | name | age  |
+----+------+------+
|  1 | a    |   12 |
|  2 | b    |   13 |
+----+------+------+
2 rows in set (0.00 sec)


mysql> start transaction with consistent snapshot; -- BEGIN后立即开启事务
Query OK, 0 rows affected (0.00 sec)
```

B终端执行：

```sql
mysql> update user set age=age-1 where id=2;
Query OK, 1 row affected (0.00 sec)
Rows matched: 1  Changed: 1  Warnings: 0

mysql> select * from user;
+----+------+------+
| id | name | age  |
+----+------+------+
|  1 | a    |   12 |
|  2 | b    |   12 |
+----+------+------+
2 rows in set (0.00 sec)
```

在A终端中检验：

```sql
mysql> select * from user;
+----+------+------+
| id | name | age  |
+----+------+------+
|  1 | a    |   12 |
|  2 | b    |   13 |
+----+------+------+
2 rows in set (0.00 sec)
```

可以看到此时，A 终端中事务的查询看不到 B终端中的修改了！

<br/>

# **附录**

文章参考：

-   https://blog.csdn.net/u012702547/article/details/122107506

<br/>
