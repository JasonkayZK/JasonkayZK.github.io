---
title: 深入探讨MySQL查询时字符串尾部存在空格的问题
toc: true
cover: 'https://img.paulzzh.com/touhou/random?31'
date: 2022-02-27 11:06:11
categories: MySQL
tags: [MySQL]
description: 之前在一次MySQL的查询中，偶然间发现了即使在字符串查询条件的后面加空格也能查出数据来！本文从多个场景对该现象进行了分析；
---

之前在一次MySQL的查询中，偶然间发现了即使在字符串查询条件的后面加空格也能查出数据来！

本文从多个场景对该现象进行了分析；

<br/>

<!--more-->

# **深入探讨MySQL查询时字符串尾部存在空格的问题**

## **前言**

本文采用的MySQL版本分别如下：

-   MySQL 5.7.36: docker.io/mysql:5.7.36
-   MySQL 8.0.28: docker.io/mysql:8.0.28

<font color="#f00">**需要注意的是：MySQL尾部存在空格的逻辑在 MySQL 8.x 版本已经被修改；**</font>

<font color="#f00">**下文会详细叙述；**</font>

<br/>

## **字符串类型为普通字段的情况**

### **数据准备**

先来看最基本的情况：**当字符串类型为普通字段时**；

创建表：

```mysql
DROP TABLE IF EXISTS `space_test`;
CREATE TABLE `space_test`
(
    `id`      BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键自增ID',
    `var_str` VARCHAR(64)         NOT NULL DEFAULT '',
    `str`     CHAR(64)            NOT NULL DEFAULT '',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

INSERT INTO space_test(var_str, str)
values ('abc', 'abc'), # no space
       (' abc', ' abc'), # one prefix space
       ('abc ', 'abc '), # one suffix space
       ('abc    ', 'abc    '); # four suffix spaces
```

上面的表创建了两个字段：`var_str` 和 `str`，分别为 `varchar` 和 `char` 类型；

>   <font color="#f00">**注意这里的字符集声明，后面有大作用！**</font>

随后，写入了四条具有代表性的数据；

### **MySQL 5.7.x中的表现**

首先，先将所有的结果列出：

```mysql
mysql> select * from space_test;

+----+---------+------+
| id | var_str | str  |
+----+---------+------+
|  1 | abc     | abc  |
|  2 |  abc    |  abc |
|  3 | abc     | abc  |
|  4 | abc     | abc  |
+----+---------+------+
4 rows in set (0.00 sec)
```

可以看到，除了具有前导空格的数据，其他三条数据查询出来的结果看起来甚至是一模一样的！

#### **字段条件查询**

下面我们执行几个查询：

```mysql
# 无空格查询
mysql> select * from space_test where var_str='abc';
+----+---------+-----+
| id | var_str | str |
+----+---------+-----+
|  1 | abc     | abc |
|  3 | abc     | abc |
|  4 | abc     | abc |
+----+---------+-----+
3 rows in set (0.00 sec)

# 一个尾部空格查询
mysql> select * from space_test where var_str='abc ';
+----+---------+-----+
| id | var_str | str |
+----+---------+-----+
|  1 | abc     | abc |
|  3 | abc     | abc |
|  4 | abc     | abc |
+----+---------+-----+
3 rows in set (0.00 sec)

# 3个尾部空格查询
mysql> select * from space_test where var_str='abc  ';
+----+---------+-----+
| id | var_str | str |
+----+---------+-----+
|  1 | abc     | abc |
|  3 | abc     | abc |
|  4 | abc     | abc |
+----+---------+-----+
3 rows in set (0.00 sec)

# 无数个尾部空格查询
mysql> select * from space_test where var_str='abc          ';
+----+---------+-----+
| id | var_str | str |
+----+---------+-----+
|  1 | abc     | abc |
|  3 | abc     | abc |
|  4 | abc     | abc |
+----+---------+-----+
3 rows in set (0.00 sec)

# 一个前导空格查询
mysql> select * from space_test where var_str=' abc';
+----+---------+------+
| id | var_str | str  |
+----+---------+------+
|  2 |  abc    |  abc |
+----+---------+------+
1 row in set (0.00 sec)

# 二个前导空格查询
mysql> select * from space_test where var_str='  abc';
Empty set (0.00 sec)
```

**从执行结果我们可以看出：查询 varchar 类型时，MySQL的确忽略了尾部的空格（数据和查询条件）进行匹配；**

**将查询条件中的 var_str 换成 str 结果也是一样的！**

<br/>

#### **Count查询**

再来看一下 Count 查询：

```mysql
mysql> select count(1) from space_test;
+----------+
| count(1) |
+----------+
|        4 |
+----------+
1 row in set (0.00 sec)
```

>   <font color="#f00">**Count 的结果为4条，这是正确的，因为 Count(1) 其实是根据主键来确定数据条数的！**</font>

下面我们再来看一下查询在 MySQL 8.0.x中的表现；

<br/>

### **MySQL 8.0.x中的表现**

在 MySQL 8.0.x 中创建相同的表，并执行相同的查询；

#### **对varchar类型进行查询**

结果如下：

```mysql
# 无空格
mysql> select * from space_test where var_str='abc';
+----+---------+-----+
| id | var_str | str |
+----+---------+-----+
|  1 | abc     | abc |
+----+---------+-----+
1 row in set (0.00 sec)

# 1个尾部空格查询
mysql> select * from space_test where var_str='abc ';
+----+---------+-----+
| id | var_str | str |
+----+---------+-----+
|  3 | abc     | abc |
+----+---------+-----+
1 row in set (0.00 sec)

# 3个尾部空格查询
mysql> select * from space_test where var_str='abc   ';
Empty set (0.00 sec)

# 4个尾部空格查询
mysql> select * from space_test where var_str='abc    ';
+----+---------+-----+
| id | var_str | str |
+----+---------+-----+
|  4 | abc     | abc |
+----+---------+-----+
1 row in set (0.00 sec)

# 无数个尾部空格查询
mysql> select * from space_test where var_str='abc           ';
Empty set (0.00 sec)

# 1个头部空格查询
mysql> select * from space_test where var_str=' abc';
+----+---------+------+
| id | var_str | str  |
+----+---------+------+
|  2 |  abc    |  abc |
+----+---------+------+
1 row in set (0.00 sec)

# 2个头部空格查询
mysql> select * from space_test where var_str='  abc';
Empty set (0.00 sec)
```

可以看到：

<font color="#f00">**在 MySQL 8.0.x 中，对于 varchar 的查询的逻辑不再去除尾部空格，而是采用精确匹配的方式；**</font>

下面再来看看在 MySQL 8.0.x 中针对 char 类型的查询；

<br/>

#### **对char类型进行查询**

结果如下：

```mysql
# 无空格
mysql> select * from space_test where str='abc';
+----+---------+-----+
| id | var_str | str |
+----+---------+-----+
|  1 | abc     | abc |
|  3 | abc     | abc |
|  4 | abc     | abc |
+----+---------+-----+
3 rows in set (0.00 sec)

# 1个尾部空格查询
mysql> select * from space_test where str='abc ';
Empty set (0.00 sec)

# 3个尾部空格查询
mysql> select * from space_test where str='abc   ';
Empty set (0.00 sec)

# 4个尾部空格查询
mysql> select * from space_test where str='abc    ';
Empty set (0.00 sec)

# 无数个尾部空格查询
mysql> select * from space_test where str='abc           ';
Empty set (0.00 sec)

# 1个前导空格查询
mysql> select * from space_test where str=' abc';
+----+---------+------+
| id | var_str | str  |
+----+---------+------+
|  2 |  abc    |  abc |
+----+---------+------+
1 row in set (0.01 sec)

# 2个前导空格查询
mysql> select * from space_test where str='  abc';
```

从上面的结果可以看出：

<font color="#f00">**在 MySQL 8.0.x 中，对于 char 类型的查询会直接认为尾部不存在空格，并且仅会匹配尾部无空格的查询条件！**</font>

<font color="#f00">**这一点和 MySQL 5.7.x 中的行为完全不同！**</font>

接下来再看一下当被查询的数据被声明为唯一索引时的表现；

<br/>

#### **Count查询**

再来看一下 Count 查询在 MySQL 8.0.x 中的表现：

```mysql
mysql> select count(1) from space_test;
+----------+
| count(1) |
+----------+
|        4 |
+----------+
1 row in set (0.00 sec)
```

<font color="#f00">**可以看到，Count 的结果也为4条！**</font>

<br/>

## **字符串类型为唯一索引场景**

### **建表语句**

建表语句如下：

```mysql
DROP TABLE IF EXISTS `space_test`;
CREATE TABLE `space_test`
(
    `id`      BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键自增ID',
    `var_str` VARCHAR(64)         NOT NULL DEFAULT '',
    `str`     CHAR(64)            NOT NULL DEFAULT '',
    PRIMARY KEY (`id`),
    UNIQUE KEY (`var_str`),
    UNIQUE KEY (`str`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

INSERT INTO space_test(var_str, str) values ('abc', 'abc'); # no space

INSERT INTO space_test(var_str, str) values (' abc', '2'); # one varchar prefix space
INSERT INTO space_test(var_str, str) values ('3', ' abc'); # one char prefix space

INSERT INTO space_test(var_str, str) values ('abc ', '4'); # one varchar suffix space
INSERT INTO space_test(var_str, str) values ('5', 'abc '); # one char suffix space

INSERT INTO space_test(var_str, str) values ('abc    ', '6'); # four varchar suffix space
INSERT INTO space_test(var_str, str) values ('7' ,'abc    '); # four char suffix space
```

由于可能会存在单条数据插入失败的场景，因此对不同的插入场景进行了区分；

>   **为了避免空值重复，我们为其附上了没有意义的数字值；**

下面分 MySQL 版本来看；

<br/>

### **MySQL 5.7.x中的表现**

执行上面的语句后，执行插入数据语句的结果如下：

```mysql
mysql> INSERT INTO space_test(var_str, str) values ('abc', 'abc'); # no space
Query OK, 1 row affected (0.01 sec)

mysql> INSERT INTO space_test(var_str, str) values (' abc', '2'); # one varchar prefix space
Query OK, 1 row affected (0.00 sec)

mysql> INSERT INTO space_test(var_str, str) values ('3', ' abc'); # one char prefix space
Query OK, 1 row affected (0.01 sec)



mysql> INSERT INTO space_test(var_str, str) values ('abc ', '4'); # one varchar suffix space
ERROR 1062 (23000): Duplicate entry 'abc ' for key 'var_str'

mysql> INSERT INTO space_test(var_str, str) values ('5', 'abc '); # one char suffix space
ERROR 1062 (23000): Duplicate entry 'abc' for key 'str'

mysql> INSERT INTO space_test(var_str, str) values ('abc    ', '6'); # four varchar suffix space
ERROR 1062 (23000): Duplicate entry 'abc    ' for key 'var_str'

mysql> INSERT INTO space_test(var_str, str) values ('7' ,'abc    '); # four char suffix space
ERROR 1062 (23000): Duplicate entry 'abc' for key 'str'
```

可以看到：

**由于我们首先插入了不含有任何空格的数据，因此在插入任何具有尾部空格的数据时都会报错！**

现象和我们上面进行查询完全一致：

<font color="#f00">**在查询 varchar 或者 char 类型时，MySQL 5.7.x 版本忽略了尾部的空格（数据和查询条件）进行匹配；**</font>

下面再来看在 MySQL 8.0.x 中的表现；

<br/>

### **MySQL 8.0.x中的表现**

执行上面的语句后，执行插入数据语句的结果如下：

```mysql
mysql> INSERT INTO space_test(var_str, str) values ('abc', 'abc'); # no space
Query OK, 1 row affected (0.01 sec)

mysql> INSERT INTO space_test(var_str, str) values (' abc', '2'); # one varchar prefix space
Query OK, 1 row affected (0.01 sec)

mysql> INSERT INTO space_test(var_str, str) values ('3', ' abc'); # one char prefix space
Query OK, 1 row affected (0.01 sec)



mysql> INSERT INTO space_test(var_str, str) values ('abc ', '4'); # one varchar suffix space
Query OK, 1 row affected (0.00 sec)

mysql> INSERT INTO space_test(var_str, str) values ('5', 'abc '); # one char suffix space
ERROR 1062 (23000): Duplicate entry 'abc' for key 'space_test.str'

mysql> INSERT INTO space_test(var_str, str) values ('abc    ', '6'); # four varchar suffix space
Query OK, 1 row affected (0.01 sec)

mysql> INSERT INTO space_test(var_str, str) values ('7' ,'abc    '); # four char suffix space
ERROR 1062 (23000): Duplicate entry 'abc' for key 'space_test.str'
```

在MySQL 8.0.x 中的现象和查询的结果也完全一致：

-   <font color="#f00">**对于 varchar 的查询的逻辑不再去除尾部空格，而是采用精确匹配的方式；**</font>
-   <font color="#f00">**对于 char 类型的查询会直接认为尾部不存在空格，并且仅会匹配尾部无空格的查询条件！**</font>

因此，在上面的插入中，varchar 类型可以成功插入，而 char 类型不可以！

最后，再来看看当字符串为主键时的场景；

<br/>

## **字符串类型为主键场景**

### **建表语句**

varchar 类型的主键和 char 类型的主键对应的建表语句如下：

```mysql
-- varchar
DROP TABLE IF EXISTS `space_test`;
CREATE TABLE `space_test`
(
    `id` VARCHAR(64) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- char
DROP TABLE IF EXISTS `space_test`;
CREATE TABLE `space_test`
(
    `id` CHAR(64) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;
```

以及对应的写入数据的SQL语句：

```mysql
INSERT INTO space_test(id) values ('abc'); # no space
INSERT INTO space_test(id) values (' abc'); # one prefix space
INSERT INTO space_test(id) values ('abc '); # one suffix space
INSERT INTO space_test(id) values ('abc    '); # four char suffix space
```

下面分 MySQL 版本来看；

<br/>

### **MySQL 5.7.x中的表现**

创建以 varchar 类型作为主键的表后，执行插入语句后的结果如下：

```mysql
mysql> INSERT INTO space_test(id) values ('abc'); # no space
Query OK, 1 row affected (0.01 sec)

mysql> INSERT INTO space_test(id) values (' abc'); # one prefix space
Query OK, 1 row affected (0.00 sec)

mysql> INSERT INTO space_test(id) values ('abc '); # one suffix space
ERROR 1062 (23000): Duplicate entry 'abc ' for key 'PRIMARY'

mysql> INSERT INTO space_test(id) values ('abc    '); # four char suffix space
ERROR 1062 (23000): Duplicate entry 'abc    ' for key 'PRIMARY'
```

可以看到，和字段为唯一索引的情况是一致的：

**尾部存在空格的字符串会和无空格的字符串冲突，从而无法被插入；**

**以 char 类型作为主键的表的结果和 varchar 的结果完全一致，这里不再赘述！**

>   <font color="#f00">**其实结果是显而易见的，因为在主键的语义中已经包括了 `唯一索引` 的概念；**</font>

<br/>

### **MySQL 8.0.x中的表现**

#### **varchar类型作为主键**

建表后结果如下：

```mysql
mysql> INSERT INTO space_test(id) values ('abc'); # no space
Query OK, 1 row affected (0.00 sec)

mysql> INSERT INTO space_test(id) values (' abc'); # one prefix space
Query OK, 1 row affected (0.02 sec)

mysql> INSERT INTO space_test(id) values ('abc '); # one suffix space
Query OK, 1 row affected (0.01 sec)

mysql> INSERT INTO space_test(id) values ('abc    '); # four char suffix space
Query OK, 1 row affected (0.01 sec)
```

和上面的结论也是一致的：

<font color="#f00">**MySQL 8.0.x 中对于 varchar 的查询的逻辑不再去除尾部空格，而是采用精确匹配的方式；**</font>

可以查询到，此时有四条数据：

```mysql
mysql> select * from space_test;

+---------+
| id      |
+---------+
|  abc    |
| abc     |
| abc     |
| abc     |
+---------+
4 rows in set (0.00 sec)
```

下面再来看 char 类型作为主键时的场景；

<br/>

#### **char类型作为主键**

执行语句后结果如下：

```mysql
mysql> INSERT INTO space_test(id) values ('abc'); # no space
Query OK, 1 row affected (0.00 sec)

mysql> INSERT INTO space_test(id) values (' abc'); # one prefix space
Query OK, 1 row affected (0.01 sec)

mysql> INSERT INTO space_test(id) values ('abc '); # one suffix space
ERROR 1062 (23000): Duplicate entry 'abc' for key 'space_test.PRIMARY'

mysql> INSERT INTO space_test(id) values ('abc    '); # four char suffix space
ERROR 1062 (23000): Duplicate entry 'abc' for key 'space_test.PRIMARY'
```

也和上面的结论保持一致：

<font color="#f00">**MySQL 8.0.x 中对于 char 类型的查询会直接认为尾部不存在空格，并且仅会匹配尾部无空格的查询条件！**</font>

<br/>

## **现象总结**

表格如下：

| **版本** | **匹配方式**                                                 |
| -------- | ------------------------------------------------------------ |
| 5.7.x    | <font color="#f00">**在查询/匹配 varchar 或者 char 类型时，会忽略尾部的空格（数据和查询条件）进行匹配；**</font> |
| 8.0.x    | <font color="#f00">**对于 varchar 的查询的逻辑不再去除尾部空格，而是采用精确匹配的方式；**</font><br /><font color="#f00">**对于 char 类型的查询会直接认为尾部不存在空格，并且仅会匹配尾部无空格的查询条件！**</font> |

<br/>

## **原因分析**

>   **相关资料参考：**
>
>   MySQL的官方文档：
>
>   -   https://dev.mysql.com/doc/refman/5.7/en/char.html
>   -   https://dev.mysql.com/doc/refman/8.0/en/char.html
>
>   以及Stack Overflow相关问题：
>
>   -   https://stackoverflow.com/questions/10495692/mysql-comparison-operator-spaces

**下面先来看一下在 MySQL 5.7.x 中的内容；**

<br/>

### **CHAR和VARCHAR在底层数据存储上的区别**

首先需要明确的是：

<font color="#f00">**在MySQL中，CHAR 和 VARCHAR 类型还是有非常大的区别的（无论是从存储角度还是查询角度来看）；**</font>

对应 CHAR 类型而言：

<font color="#f00">**CHAR 类型的存储长度固定在创建表时声明的长度（长度在0～255之间）；**</font>

<font color="#f00">**当存储 CHAR 值时，会在字符串的右侧填充到指定长度的空格！而在查询 CHAR 值时，除非启用 [`PAD_CHAR_TO_FULL_LENGTH`](https://dev.mysql.com/doc/refman/5.7/en/sql-mode.html#sqlmode_pad_char_to_full_length) SQL模式，否则将会删除尾部的所有空格！**</font>

而，对于 VARCHAR 类型而言：

<font color="#f00">**VARCHAR 类型存储长度是动态变化的（长度在 0～65535之间，并且受限于整张表的最大行长度：[Section 8.4.7, “Limits on Table Column Count and Row Size”](https://dev.mysql.com/doc/refman/5.7/en/column-count-limit.html)）**</font>

<font color="#f00">**同时，相比于 CHAR 类型，VARCHAR 类型会在数据头部记录 1～2个字节（单个字节如果字符串长度小于255字节，否则为2个字节）的数据来表示当前所存储字符串的真实长度！**</font>

<font color="#f00">**同时，相比于 CHAR 类型，VARCHAR 类型并不会在字符串尾部插入空格来填充长度！**</font>

<font color="#f00">**因此，VARCHAR 在查询和存储字符串时会完全保留尾部的空格个数，和标准的SQL保持一致(in conformance with standard SQL)**</font>

<br/>

### **CHAR和VARCHAR在数据写入上的区别**

除了数据存储上的区别之外，CHAR 和 VARCHAR 在数据写入上也存在些许区别；

<font color="#f00">**在非严格SQL模式（strict SQL mode）下，当对 CHAR 和 VARCHAR 类型的字段插入超过声明长度的字符串时，字符串将会被截断；**</font>

<font color="#f00">**而在严格模式下，插入超过声明长度的数据会报错！**</font>

<font color="#f00">**对于尾部为空格的数据来说：**</font>

-   <font color="#f00">**对于 VARCHAR 类型而言，尾部的空格将会被截断，同时提示 WARNING（无论是否处于严格SQL模式下）；**</font>
-   <font color="#f00">**对于 CHAR 类型而言，尾部的空格会被截断，并且不会有任何提示（无论是否处于严格SQL模式下）；**</font>

>   **原文：**
>
>   If strict SQL mode is not enabled and you assign a value to a `CHAR` or `VARCHAR` column that exceeds the column's maximum length, the value is truncated to fit and a warning is generated. For truncation of nonspace characters, you can cause an error to occur (rather than a warning) and suppress insertion of the value by using strict SQL mode. See [Section 5.1.10, “Server SQL Modes”](https://dev.mysql.com/doc/refman/5.7/en/sql-mode.html).
>
>   For `VARCHAR` columns, trailing spaces in excess of the column length are truncated prior to insertion and a warning is generated, regardless of the SQL mode in use. For `CHAR` columns, truncation of excess trailing spaces from inserted values is performed silently regardless of the SQL mode.

下面是一个在非严格SQL模式下，实际截断的例子：

| Value        | `CHAR(4)` | Storage Required | `VARCHAR(4)` | Storage Required |
| :----------- | :-------- | :--------------- | :----------- | :--------------- |
| `''`         | `'    '`  | 4 bytes          | `''`         | 1 byte           |
| `'ab'`       | `'ab  '`  | 4 bytes          | `'ab'`       | 3 bytes          |
| `'abcd'`     | `'abcd'`  | 4 bytes          | `'abcd'`     | 5 bytes          |
| `'abcdefgh'` | `'abcd'`  | 4 bytes          | `'abcd'`     | 5 bytes          |

>   这里补充一点：
>
>   <font color="#f00">**InnoDB 引擎会将长度大于等于768字节的定长字段编码为可变长度字段，使其可以在页外存储；**</font>
>
>   <font color="#f00">**例如，如果字符集的最大字节长度大于3，则 CHAR(255) 列可能会超过768字节（如，utf8mb4字符集）；**</font>

<br/>

### **CHAR和VARCHAR在数据读取上的区别**

<font color="#f00">**对于分别存储在 CHAR(4) 和 VARCHAR(4) 中的数据而言，对于这些列查询到的值并不总是相同的：**</font>

<font color="#f00">**因为在查询时，CHAR 会删除尾部的空格！**</font>

例如：

```mysql
mysql> CREATE TABLE vc (v VARCHAR(4), c CHAR(4));
Query OK, 0 rows affected (0.01 sec)

mysql> INSERT INTO vc VALUES ('ab  ', 'ab  ');
Query OK, 1 row affected (0.00 sec)

mysql> SELECT CONCAT('(', v, ')'), CONCAT('(', c, ')') FROM vc;
+---------------------+---------------------+
| CONCAT('(', v, ')') | CONCAT('(', c, ')') |
+---------------------+---------------------+
| (ab  )              | (ab)                |
+---------------------+---------------------+
1 row in set (0.06 sec)
```

<br/>

### **CHAR和VARCHAR在数据比较上的区别**

首先需要明确的是，对于 CHAR 和 VARCHAR 而言，其比较都是建立在某一特定的字符集之上的！

<font color="#f00">**同时，对于 MySQL 而言，所有的字符集类型都是“填充空格”(All MySQL collations are of type `PAD SPACE`)；**</font>

<font color="#f00">**即：无论对于 `CHAR`、 `VARCHAR`、 还是 `TEXT` 类型而言，在比较时，都会忽略尾部的空格！**</font>

<font color="#f00">**唯一需要区别的是，`LIKE` 关键字，因为这个场景下尾部空格的匹配对其非常重要！**</font>

>   原文：
>
>   All MySQL collations are of type `PAD SPACE`. This means that all `CHAR`, `VARCHAR`, and `TEXT` values are compared without regard to any trailing spaces. “Comparison” in this context does not include the [`LIKE`](https://dev.mysql.com/doc/refman/5.7/en/string-comparison-functions.html#operator_like) pattern-matching operator, for which trailing spaces are significant.

例如：

```mysql
mysql> CREATE TABLE names (myname CHAR(10));
Query OK, 0 rows affected (0.03 sec)

mysql> INSERT INTO names VALUES ('Jones');
Query OK, 1 row affected (0.00 sec)

mysql> SELECT myname = 'Jones', myname = 'Jones  ' FROM names;
+------------------+--------------------+
| myname = 'Jones' | myname = 'Jones  ' |
+------------------+--------------------+
|                1 |                  1 |
+------------------+--------------------+
1 row in set (0.00 sec)

mysql> SELECT myname LIKE 'Jones', myname LIKE 'Jones  ' FROM names;
+---------------------+-----------------------+
| myname LIKE 'Jones' | myname LIKE 'Jones  ' |
+---------------------+-----------------------+
|                   1 |                     0 |
+---------------------+-----------------------+
1 row in set (0.00 sec)
```

<br/>

对于那些会除去尾部空格，或者相互比较时尾部空格被忽略的场景，如果某列被声明为了唯一索引，则在向其插入的数据中如果只存在尾部空格的区别，则插入数据会报错！

例如：表中已存在 `'a'`，则插入 `'a '` 会报错；

>   原文：
>
>   For those cases where trailing pad characters are stripped or comparisons ignore them, if a column has an index that requires unique values, inserting into the column values that differ only in number of trailing pad characters results in a duplicate-key error. For example, if a table contains `'a'`, an attempt to store `'a '` causes a duplicate-key error.

<br/>

### **MySQL 8.0.x中新增内容**

上面为 MySQL 5.7.x 文档中的内容，在 MySQL 8.0.x 中有了部分变化；

#### **NO PAD类型**

首先，引入了 `NO PAD` 类型的数据类型；

<font color="#f00">**上面提到在老的 MySQL 版本中，所有的字符集类型都是“填充空格”(All MySQL collations are of type `PAD SPACE`)；**</font>

<font color="#f00">**而在新的版本中，存在 `NO PAD` 类型，如：UCA 9.0.0 或更高版本的 Unicode；**</font>

<font color="#f00">**可以通过  `INFORMATION_SCHEMA`.[`COLLATIONS`](https://dev.mysql.com/doc/refman/8.0/en/information-schema-collations-table.html) 表查看具体数据的类型；**</font>

>   原文：
>
>   MySQL collations have a pad attribute of `PAD SPACE`, other than Unicode collations based on UCA 9.0.0 and higher, which have a pad attribute of `NO PAD`. (see [Section 10.10.1, “Unicode Character Sets”](https://dev.mysql.com/doc/refman/8.0/en/charset-unicode-sets.html)).
>
>   To determine the pad attribute for a collation, use the `INFORMATION_SCHEMA` [`COLLATIONS`](https://dev.mysql.com/doc/refman/8.0/en/information-schema-collations-table.html) table, which has a `PAD_ATTRIBUTE` column.

<br/>

#### **非二进制字符串(nonbinary strings)比较变更**

在上面的基础之上：

<font color="#f00">**对于非二进制字符串(包括，`CHAR`, `VARCHAR` 和 `TEXT` 类型)而言，字符串的校对填充属性(collation pad attribute) 决定了在比较时是否处理字符串在尾部的空格：**</font>

-   <font color="#f00">**`NO PAD` 类型会在比较时计入尾部的空格；**</font>
-   <font color="#f00">**而 `PAD SPACE` 则不会在比较时计入尾部的空格；**</font>

>   原文：
>
>   For nonbinary strings (`CHAR`, `VARCHAR`, and `TEXT` values), the string collation pad attribute determines treatment in comparisons of trailing spaces at the end of strings. `NO PAD` collations treat trailing spaces as significant in comparisons, like any other character. `PAD SPACE` collations treat trailing spaces as insignificant in comparisons; strings are compared without regard to trailing spaces. See [Trailing Space Handling in Comparisons](https://dev.mysql.com/doc/refman/8.0/en/charset-binary-collations.html#charset-binary-collations-trailing-space-comparisons). The server SQL mode has no effect on comparison behavior with respect to trailing spaces.

我们来看一下支持的类型：

```mysql
mysql> select * from information_schema. COLLATIONS;
+----------------------------+--------------------+-----+------------+-------------+---------+---------------+
| COLLATION_NAME             | CHARACTER_SET_NAME | ID  | IS_DEFAULT | IS_COMPILED | SORTLEN | PAD_ATTRIBUTE |
+----------------------------+--------------------+-----+------------+-------------+---------+---------------+
| ascii_general_ci           | ascii              |  11 | Yes        | Yes         |       1 | PAD SPACE     |
| ascii_bin                  | ascii              |  65 |            | Yes         |       1 | PAD SPACE     |
| binary                     | binary             |  63 | Yes        | Yes         |       1 | NO PAD        |

..........

| utf8_tolower_ci            | utf8               |  76 |            | Yes         |       1 | PAD SPACE     |
| utf8_bin                   | utf8               |  83 |            | Yes         |       1 | PAD SPACE     |
| utf8_unicode_ci            | utf8               | 192 |            | Yes         |       8 | PAD SPACE     |
| utf8_icelandic_ci          | utf8               | 193 |            | Yes         |       8 | PAD SPACE     |
| utf8_latvian_ci            | utf8               | 194 |            | Yes         |       8 | PAD SPACE     |
| utf8_romanian_ci           | utf8               | 195 |            | Yes         |       8 | PAD SPACE     |
| utf8_slovenian_ci          | utf8               | 196 |            | Yes         |       8 | PAD SPACE     |
| utf8_polish_ci             | utf8               | 197 |            | Yes         |       8 | PAD SPACE     |
| utf8_estonian_ci           | utf8               | 198 |            | Yes         |       8 | PAD SPACE     |
| utf8_spanish_ci            | utf8               | 199 |            | Yes         |       8 | PAD SPACE     |
| utf8_swedish_ci            | utf8               | 200 |            | Yes         |       8 | PAD SPACE     |
| utf8_turkish_ci            | utf8               | 201 |            | Yes         |       8 | PAD SPACE     |
| utf8_czech_ci              | utf8               | 202 |            | Yes         |       8 | PAD SPACE     |
| utf8_danish_ci             | utf8               | 203 |            | Yes         |       8 | PAD SPACE     |
| utf8_lithuanian_ci         | utf8               | 204 |            | Yes         |       8 | PAD SPACE     |
| utf8_slovak_ci             | utf8               | 205 |            | Yes         |       8 | PAD SPACE     |
| utf8_spanish2_ci           | utf8               | 206 |            | Yes         |       8 | PAD SPACE     |
| utf8_roman_ci              | utf8               | 207 |            | Yes         |       8 | PAD SPACE     |
| utf8_persian_ci            | utf8               | 208 |            | Yes         |       8 | PAD SPACE     |
| utf8_esperanto_ci          | utf8               | 209 |            | Yes         |       8 | PAD SPACE     |
| utf8_hungarian_ci          | utf8               | 210 |            | Yes         |       8 | PAD SPACE     |
| utf8_sinhala_ci            | utf8               | 211 |            | Yes         |       8 | PAD SPACE     |
| utf8_german2_ci            | utf8               | 212 |            | Yes         |       8 | PAD SPACE     |
| utf8_croatian_ci           | utf8               | 213 |            | Yes         |       8 | PAD SPACE     |
| utf8_unicode_520_ci        | utf8               | 214 |            | Yes         |       8 | PAD SPACE     |
| utf8_vietnamese_ci         | utf8               | 215 |            | Yes         |       8 | PAD SPACE     |
| utf8_general_mysql500_ci   | utf8               | 223 |            | Yes         |       1 | PAD SPACE     |
| utf8mb4_general_ci         | utf8mb4            |  45 |            | Yes         |       1 | PAD SPACE     |
| utf8mb4_bin                | utf8mb4            |  46 |            | Yes         |       1 | PAD SPACE     |
| utf8mb4_unicode_ci         | utf8mb4            | 224 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_icelandic_ci       | utf8mb4            | 225 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_latvian_ci         | utf8mb4            | 226 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_romanian_ci        | utf8mb4            | 227 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_slovenian_ci       | utf8mb4            | 228 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_polish_ci          | utf8mb4            | 229 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_estonian_ci        | utf8mb4            | 230 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_spanish_ci         | utf8mb4            | 231 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_swedish_ci         | utf8mb4            | 232 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_turkish_ci         | utf8mb4            | 233 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_czech_ci           | utf8mb4            | 234 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_danish_ci          | utf8mb4            | 235 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_lithuanian_ci      | utf8mb4            | 236 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_slovak_ci          | utf8mb4            | 237 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_spanish2_ci        | utf8mb4            | 238 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_roman_ci           | utf8mb4            | 239 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_persian_ci         | utf8mb4            | 240 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_esperanto_ci       | utf8mb4            | 241 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_hungarian_ci       | utf8mb4            | 242 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_sinhala_ci         | utf8mb4            | 243 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_german2_ci         | utf8mb4            | 244 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_croatian_ci        | utf8mb4            | 245 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_unicode_520_ci     | utf8mb4            | 246 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_vietnamese_ci      | utf8mb4            | 247 |            | Yes         |       8 | PAD SPACE     |
| utf8mb4_0900_ai_ci         | utf8mb4            | 255 | Yes        | Yes         |       0 | NO PAD        |
| utf8mb4_de_pb_0900_ai_ci   | utf8mb4            | 256 |            | Yes         |       0 | NO PAD        |
| utf8mb4_is_0900_ai_ci      | utf8mb4            | 257 |            | Yes         |       0 | NO PAD        |
| utf8mb4_lv_0900_ai_ci      | utf8mb4            | 258 |            | Yes         |       0 | NO PAD        |
| utf8mb4_ro_0900_ai_ci      | utf8mb4            | 259 |            | Yes         |       0 | NO PAD        |
| utf8mb4_sl_0900_ai_ci      | utf8mb4            | 260 |            | Yes         |       0 | NO PAD        |
| utf8mb4_pl_0900_ai_ci      | utf8mb4            | 261 |            | Yes         |       0 | NO PAD        |
| utf8mb4_et_0900_ai_ci      | utf8mb4            | 262 |            | Yes         |       0 | NO PAD        |
| utf8mb4_es_0900_ai_ci      | utf8mb4            | 263 |            | Yes         |       0 | NO PAD        |
| utf8mb4_sv_0900_ai_ci      | utf8mb4            | 264 |            | Yes         |       0 | NO PAD        |
| utf8mb4_tr_0900_ai_ci      | utf8mb4            | 265 |            | Yes         |       0 | NO PAD        |
| utf8mb4_cs_0900_ai_ci      | utf8mb4            | 266 |            | Yes         |       0 | NO PAD        |
| utf8mb4_da_0900_ai_ci      | utf8mb4            | 267 |            | Yes         |       0 | NO PAD        |
| utf8mb4_lt_0900_ai_ci      | utf8mb4            | 268 |            | Yes         |       0 | NO PAD        |
| utf8mb4_sk_0900_ai_ci      | utf8mb4            | 269 |            | Yes         |       0 | NO PAD        |
| utf8mb4_es_trad_0900_ai_ci | utf8mb4            | 270 |            | Yes         |       0 | NO PAD        |
| utf8mb4_la_0900_ai_ci      | utf8mb4            | 271 |            | Yes         |       0 | NO PAD        |
| utf8mb4_eo_0900_ai_ci      | utf8mb4            | 273 |            | Yes         |       0 | NO PAD        |
| utf8mb4_hu_0900_ai_ci      | utf8mb4            | 274 |            | Yes         |       0 | NO PAD        |
| utf8mb4_hr_0900_ai_ci      | utf8mb4            | 275 |            | Yes         |       0 | NO PAD        |
| utf8mb4_vi_0900_ai_ci      | utf8mb4            | 277 |            | Yes         |       0 | NO PAD        |
| utf8mb4_ru_0900_as_cs      | utf8mb4            | 307 |            | Yes         |       0 | NO PAD        |
| utf8mb4_zh_0900_as_cs      | utf8mb4            | 308 |            | Yes         |       0 | NO PAD        |
| utf8mb4_0900_bin           | utf8mb4            | 309 |            | Yes         |       1 | NO PAD        |
+----------------------------+--------------------+-----+------------+-------------+---------+---------------+
272 rows in set (0.00 sec)
```

再来看一下我们之前建表语句：

```mysql
DROP TABLE IF EXISTS `space_test`;
CREATE TABLE `space_test`
(
    `id`      BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键自增ID',
    `var_str` VARCHAR(64)         NOT NULL DEFAULT '',
    `str`     CHAR(64)            NOT NULL DEFAULT '',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;
```

实际对应的字符集类型：

```mysql
mysql> show table status from test like 'space_test';
+------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+--------------------+----------+----------------+---------+
| Name       | Engine | Version | Row_format | Rows | Avg_row_length | Data_length | Max_data_length | Index_length | Data_free | Auto_increment | Create_time         | Update_time         | Check_time | Collation          | Checksum | Create_options | Comment |
+------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+--------------------+----------+----------------+---------+
| space_test | InnoDB |      10 | Dynamic    |    4 |           4096 |       16384 |               0 |            0 |         0 |              5 | 2022-03-06 10:26:47 | 2022-03-06 10:26:47 | NULL       | utf8mb4_0900_ai_ci |     NULL |                |         |
+------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+--------------------+----------+----------------+---------+
1 row in set (0.01 sec)
```

可以看到，<font color="#f00">**实际的排序类型为：`utf8mb4_0900_ai_ci`，对应的是 `NO PAD`！**</font>

<font color="#f00">**因此，这也是为什么在上面的测试中 MySQL 8.0.x 和 MySQL 5.7.x 表现不一致的原因！**</font>

<br/>

## **解决方案**

### **业务代码层面**

<font color="#f00">**首先，在业务代码中建议使用 Trim、TrimSpace 等相关函数先对参数进行处理，避免出现尾部存在空格的数据；**</font>

<br/>

### **数据集声明层面**

<font color="#f00">**需要根据实际需求，结合`INFORMATION_SCHEMA`.[`COLLATIONS`](https://dev.mysql.com/doc/refman/8.0/en/information-schema-collations-table.html) 表判断具体使用 `PAD SPACE` 还是 `NO PAD`类型！**</font>

<br/>

### **查询层面**

如果一定要查询含有尾部空格的数据，则可以使用两种方法：

-   使用 like 匹配；
-   查询条件中增加 binary；

下面在MySQL 5.7.x 中分别来看；

#### **like**

查询结果：

```mysql
-- varchar查询
mysql> select * from space_test where var_str like 'abc';
+----+---------+-----+
| id | var_str | str |
+----+---------+-----+
|  1 | abc     | abc |
+----+---------+-----+
1 row in set (0.00 sec)

mysql> select * from space_test where var_str like 'abc ';
+----+---------+-----+
| id | var_str | str |
+----+---------+-----+
|  3 | abc     | abc |
+----+---------+-----+
1 row in set (0.00 sec)

mysql> select * from space_test where var_str like 'abc  ';
Empty set (0.00 sec)

mysql> select * from space_test where var_str like 'abc   ';
Empty set (0.00 sec)

mysql> select * from space_test where var_str like 'abc    ';
+----+---------+-----+
| id | var_str | str |
+----+---------+-----+
|  4 | abc     | abc |
+----+---------+-----+
1 row in set (0.01 sec)


-- char查询
mysql> select * from space_test where str like 'abc';
+----+---------+-----+
| id | var_str | str |
+----+---------+-----+
|  1 | abc     | abc |
|  3 | abc     | abc |
|  4 | abc     | abc |
+----+---------+-----+
3 rows in set (0.00 sec)

mysql> select * from space_test where str like 'abc ';
Empty set (0.00 sec)

mysql> select * from space_test where str like 'abc  ';
Empty set (0.00 sec)

mysql> select * from space_test where str like 'abc   ';
Empty set (0.00 sec)

mysql> select * from space_test where str like 'abc    ';
Empty set (0.00 sec)
```

<font color="#f00">**可以看到：在 MySQL 5.7.x 中使用 LIKE 关键字后的逻辑和 MySQL 8.0.x 中的`NO PAD`逻辑相同；**</font>

<br/>

#### **binary**

`binary` 是MySQL中的一个类型转换运算符：用来强制它后面的字符串为一个二进制字符串，可以理解成精确匹配；

<font color="#f00">**注：BINARY 关键字要放在 `=` 的后边，以便有效利用该字段的索引；**</font>

实验结果：

```mysql
-- varchar
mysql> select * from space_test where var_str = binary 'abc';
+----+---------+-----+
| id | var_str | str |
+----+---------+-----+
|  1 | abc     | abc |
+----+---------+-----+
1 row in set (0.00 sec)

mysql> select * from space_test where var_str = binary 'abc ';
+----+---------+-----+
| id | var_str | str |
+----+---------+-----+
|  3 | abc     | abc |
+----+---------+-----+
1 row in set (0.00 sec)

mysql> select * from space_test where var_str = binary 'abc  ';
Empty set (0.00 sec)

mysql> select * from space_test where var_str = binary 'abc   ';
Empty set (0.00 sec)

mysql> select * from space_test where var_str = binary 'abc    ';
+----+---------+-----+
| id | var_str | str |
+----+---------+-----+
|  4 | abc     | abc |
+----+---------+-----+
1 row in set (0.00 sec)


-- char
mysql> select * from space_test where str = binary 'abc';
+----+---------+-----+
| id | var_str | str |
+----+---------+-----+
|  1 | abc     | abc |
|  3 | abc     | abc |
|  4 | abc     | abc |
+----+---------+-----+
3 rows in set (0.00 sec)

mysql> select * from space_test where str = binary 'abc ';
Empty set (0.00 sec)

mysql> select * from space_test where str = binary 'abc  ';
Empty set (0.00 sec)

mysql> select * from space_test where str = binary 'abc   ';
Empty set (0.00 sec)

mysql> select * from space_test where str = binary 'abc    ';
Empty set (0.00 sec)
```

<font color="#f00">**可以看到：在 MySQL 5.7.x 中使用 BINARY 关键字后的逻辑和 MySQL 8.0.x 中的`NO PAD`逻辑相同；**</font>

<br/>

## **小结**

MySQL 中字符串尾部存在空格的问题和两个条件相关：

-   字段类型：`CHAR` 或者 `VARCHAR`；
-   字符集类型：`PAD SPACE` 或者 `NO PAD`;

**`CHAR` 类型在存储字符串时会截断尾部的空格，而 `VARCHAR` 则会保留；**

**`PAD SPACE` 类型在比较时会忽略字符串尾部的空格，而 `NO PAD` 会保留；**

**同时，我们可以通过 `LIKE` 或 `BINARY` 关键字将针对 `PAD SPACE` 类型的查询转化为类似于 `NO PAD` 的查询；**

<br/>

# **附录**

参考文章：

-   [MySQL字段等值查询时，尾部有空格也能匹配上的坑](https://www.cnblogs.com/waterystone/p/12871323.html)
-   [Mysql 查询条件中字符串尾部有空格也能匹配上的问题](https://www.cnblogs.com/xjnotxj/p/9019866.html)
-   [11.3.2 The CHAR and VARCHAR Types](https://dev.mysql.com/doc/refman/5.7/en/char.html)
-   [MySQL comparison operator, spaces](https://stackoverflow.com/questions/10495692/mysql-comparison-operator-spaces)

MySQL的官方文档：

-   https://dev.mysql.com/doc/refman/5.7/en/char.html
-   https://dev.mysql.com/doc/refman/8.0/en/char.html

以及Stack Overflow相关问题：

-   https://stackoverflow.com/questions/10495692/mysql-comparison-operator-spaces

