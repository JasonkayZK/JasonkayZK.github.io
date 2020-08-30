---
title: MySQL变量
toc: true
date: 2019-12-04 20:25:48
cover: http://api.mtyqx.cn/api/random.php?16
categories: 数据库
tags: [MySQL]
description: 上一篇讲解了MySQL中的触发器, 本篇讲解MySQL中的变量
---

上一篇讲解了MySQL中的触发器, 本篇讲解MySQL中的变量

<br/>

<!--more-->

## 变量

Mysql本质是一种编程语言，需要很多变量来保存数据。Mysql中很多的属性控制都是通过mysql中固有的变量来实现的

### 系统变量

**系统内部定义的变量，系统变量针对所有用户（MySQL客户端）有效**

><br/>
>
>**查看系统所有变量：`show variables [like 'pattern'];`**

<br/>

**Mysql允许用户使用select查询变量的数据值（系统变量）**

>   <br/>
>
>   **基本语法：`select @@变量名;`**

例如:

```mysql
select @@autocommit;

+--------------+
| @@autocommit |
+--------------+
|            1 |
+--------------+
1 row in set (0.00 sec)
```

<br/>

修改系统变量：分为两种修改方式

**① 局部修改（会话级别）**

只针对当前自己客户端当次连接有效

><br/>
>
>**基本语法：`set 变量名 = 新值;`**

例如:

```mysql
mysql> set autocommit = 0;
Query OK, 0 rows affected (0.00 sec)

mysql> select @@autocommit;
+--------------+
| @@autocommit |
+--------------+
|            0 |
+--------------+
1 row in set (0.00 sec)
```

<br/>

**② 全局修改**

针对所有的客户端，“所有时刻”都有效

>   <br/>
>
>   **基本语法：`set global 变量名 = 值; 或 set @@global.变量名 = 值;`**

全局修改之后：所有连接的客户端并没发现改变？

<font color="#ff0000">**注意: 全局修改只针对新客户端生效（正在连着的无效）**</font>

<font color="#ff0000">**如果想要本次连接对应的变量修改有效，那么不能使用全局修改，只能使用会话级别修改（set 变量名 = 值）;</font>**

<br/>

### 会话变量

会话变量也称之为用户变量，**会话变量跟mysql客户端是绑定的，设置的变量，只对当前用户使用的客户端生效**

><br/>
>
>**定义用户变量：`set @变量名 := 值;`**
>
><font color="#ff0000">**注意: `set @变量名 = 值;`是错误写法**</font>
>
>在**mysql中因为没有比较符号==**，所以是用=代替比较符号, 有时候在使用=赋值的时候，会报错
>
>**mysql为了避免系统分不清是赋值还是比较：特定增加一个变量的赋值符号：  :=**

例如:

```mysql
mysql> set @age := 57;
Query OK, 0 rows affected (0.00 sec)
```

<font color="#ff0000">**Mysql允许将数据从表中取出存储到变量中：但查询得到的数据必须只能是一行数据（一个变量对应一个字段值）, 且Mysql没有数组**</font>

<br/>

关于会话变量的一些易错的操作:

**① 赋值且查看赋值过程**

```mysql
select @变量1 := 字段1，@变量2 := 字段2 from 数据表 where 条件；
```

错误语法：就是**因为使用=，系统会当做比较符号来处理**

```mysql
mysql> select @name = cnname, @sex = sex from mybatis.t_student limit 1;
+----------------+------------+
| @name = cnname | @sex = sex |
+----------------+------------+
|           NULL |       NULL |
+----------------+------------+
1 row in set (0.00 sec)

```

正确处理：使用:=

```mysql
mysql> select @name := cnname, @sex := sex from mybatis.t_student limit 1;
+-----------------+-------------+
| @name := cnname | @sex := sex |
+-----------------+-------------+
| Mouse           |           1 |
+-----------------+-------------+
1 row in set (0.00 sec)
```

<br/>

**② 只赋值，不看过程**

```mysql
select 字段1，字段2… from 数据源 where 条件 into @变量1，@变量2…
```

例如:

```mysql
mysql> select cnname, sex from mybatis.t_student limit 1 into @name, @sex;
Query OK, 1 row affected (0.00 sec)
```

查看变量：select @变量名;

```mysql
mysql> select @name, @sex;
+-------+------+
| @name | @sex |
+-------+------+
| Mouse |    1 |
+-------+------+
1 row in set (0.00 sec)
```

<br/>

### 局部变量

**作用范围在begin到end语句块之间,** 在该语句块里设置的变量，**declare语句专门用于定义局部变量**

-   **局部变量是使用declare关键字声明**

-   **局部变量declare语句出现的位置一定是在begin和end之间（beginend是在大型语句块中使用：函数/存储过程/触发器）**

><br/>
>
>**声明语法：`declare 变量名 数据类型 [属性];`**

<br/>

### 变量作用域

变量作用域即: 变量能够使用的区域范围

<br/>

**局部作用域**

<font color="#ff0000">使用declare关键字声明（在结构体内：函数/存储过程/触发器），而且只能在结构体内部使用</font>

declare关键字声明的**变量没有任何符号修饰，就是普通字符串**，如果**在外部访问该变量，系统会自动认为是字段**

<br/>

**会话作用域**

<font color="#ff0000">用户定义的，使用@符号定义的变量，使用set关键字</font>

会话作用域：<font color="#ff0000">**在当前用户当次连接有效，只要在本连接之中，任何地方都可以使用（可以在结构内部，也可以跨库）**</font>

例:

**① 会话变量可以在函数内部使用**

```mysql
-- 定义会话变量@name
mysql> set @name = 'Tom';
Query OK, 0 rows affected (0.00 sec)

-- 定义自定义函数my_func(), 并在函数中直接返回会话变量@name
mysql> create function my_func() returns char(4)
    -> return @name;
Query OK, 0 rows affected (0.00 sec)

-- 调用my_func(), 返回了Tom
mysql> select my_func();
+-----------+
| my_func() |
+-----------+
| Tom       |
+-----------+
1 row in set (0.00 sec)
```

<br/>

**② 会话变量可以跨库**

```mysql
mysql> use exam;
Database changed

mysql> select @name;
+-------+
| @name |
+-------+
| Tom   |
+-------+
1 row in set (0.00 sec)
```

<br/>

**全局作用域**

<font color="#ff0000">所有的客户端所有的连接都有效: 需要使用全局符号来定义</font>

```mysql
set global 变量名 = 值;
或
set @@global.变量名 = 值;
```

><br/>
>
>**备注: 通常，在SQL编程的时候，不会使用自定义变量来控制全局。一般都是定义会话变量或者在结构中使用局部变量来解决问题**

<br/>