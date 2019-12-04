---
title: MySQL触发器
toc: false
date: 2019-12-04 10:02:18
cover: http://api.mtyqx.cn/api/random.php?12
categories: 数据库
tags: [MySQL]
description: 上一篇讲解了MySQL中的自定义函数, 本篇讲解MySQL中的触发器
---

上一篇讲解了MySQL中的自定义函数, 本篇讲解MySQL中的触发器

<br/>

<!--more-->

## 一. 触发器简介

MySQL 数据库中触发器是一个**特殊的存储过程**，不同的是执行存储过程要使用 CALL 语句来调用，而**触发器的执行不需要使用 CALL 语句来调用，也不需要手工启动**，只要**一个预定义的事件发生就会被 MySQL自动调用**

引发触发器执行的事件一般如下：

-   增加一条学生记录时，会**自动检查**年龄是否符合范围要求
-   每当删除一条学生信息时，**自动删除**其成绩表上的对应记录
-   每当删除一条数据时，在数据库存档表中**保留一个备份副本**


触发程序的优点如下：

-   触发程序的**执行是自动的**，当对触发程序相关表的数据做出相应的修改后立即执行
-   触发程序可以**通过数据库中相关的表层叠修改另外的表**
-   触发程序可以实施**比 FOREIGN KEY 约束、CHECK 约束更为复杂的检查和操作**


触发器与表关系密切，主要用于**保护表中的数据, 特别是当有多个表具有一定的相互联系的时候，触发器能够让不同的表保持数据的一致性**

<font color="#ff0000">在实际使用中，MySQL 所支持的触发器有三种：INSERT 触发器、UPDATE 触发器和 DELETE 触发器，所以只有执行 INSERT、UPDATE 和 DELETE 操作时才能激活触发器</font>

<br/>

### INSERT 触发器

在 INSERT 语句执行之前或之后响应的触发器

使用 INSERT 触发器需要注意以下几点： 

-   在 INSERT 触发器代码内，可引**用一个名为 NEW（不区分大小写）的虚拟表来访问被插入的行**
-   在 **BEFORE INSERT 触发器中，NEW 中的值也可以被更新，即允许更改被插入的值（只要具有对应的操作权限）**
-   对于 **AUTO_INCREMENT 列，NEW 在 INSERT 执行之前包含的值是 0，在 INSERT 执行之后将包含新的自动生成值**

<br/>

### UPDATE 触发器

在 UPDATE 语句执行之前或之后响应的触发器。

使用 UPDATE 触发器需要注意以下几点:

-   在 UPDATE 触发器代码内，可**引用一个名为 NEW（不区分大小写）的虚拟表来访问更新的值**
-   在 UPDATE 触发器代码内，可**引用一个名为 OLD（不区分大小写）的虚拟表来访问 UPDATE 语句执行前的值**
-   在 BEFORE UPDATE 触发器中，NEW 中的值可能也被更新，即**允许更改将要用于 UPDATE 语句中的值（只要具有对应的操作权限）**
-   **OLD 中的值全部是只读的，不能被更新**

>   <br/>
>
>   <font color="#ff0000">**注意：当触发器设计对触发表自身的更新操作时，只能使用 BEFORE 类型的触发器，AFTER 类型的触发器将不被允许**</font>

<br/>

### DELETE 触发器

在 DELETE 语句执行之前或之后响应的触发器

使用 DELETE 触发器需要注意以下几点：

-    在 DELETE 触发器代码内，**可以引用一个名为 OLD（不区分大小写）的虚拟表来访问被删除的行**
-    **OLD 中的值全部是只读的，不能被更新**

<br/>

### 总结

总体来说，触发器使用的过程中，MySQL 会按照以下方式来处理错误:

-   对于事务性表，如果触发程序失败，以及由此导致的整个语句失败，那么该语句所执行的所有更改将回滚
-   对于非事务性表，则不能执行此类回滚，即使语句失败，失败之前所做的任何更改依然有效

若 BEFORE 触发程序失败，则 MySQL 将不执行相应行上的操作

若在 BEFORE 或 AFTER 触发程序的执行过程中出现错误，则将导致调用触发程序的整个语句失败

仅当 BEFORE 触发程序和行操作均已被成功执行，MySQL 才会执行AFTER触发程序

<br/>

## 二. 创建触发器

### 基本语法

在 MySQL 5.7 中，可以使用 CREATE TRIGGER 语句创建触发器

语法格式如下:

```mysql
CREATE <触发器名> < BEFORE | AFTER > <INSERT | UPDATE | DELETE > ON <表名>
FOR EACH ROW <触发器主体>
```

语法说明如下:

 **① 触发器名**

触发器的名称，触发器**在当前数据库中必须具有唯一的名称**, 如果**要在某个特定数据库中创建，名称前面应该加上数据库的名称**

<br/>

**② INSERT | UPDATE | DELETE**

 触发事件，用于指定激活触发器的语句的种类

-   **INSERT：将新行插入表时激活触发器:** 例如，INSERT 的 BEFORE 触发器不仅能被 MySQL 的 INSERT 语句激活，**也能被 LOAD DATA 语句激活**
-   **DELETE： 从表中删除某一行数据时激活触发器:** 例如 DELETE 和 REPLACE 语句
-   **UPDATE：更改表中某一行数据时激活触发器:** 例如 UPDATE 语句

<br/>

**③ BEFORE | AFTER**

BEFORE 和 AFTER，**触发器被触发的时刻**，表示触发器是在激活它的语句之前或之后触发

<font color="#ff0000">若希望验证新数据是否满足条件，则使用 BEFORE 选项</font>

<font color="#ff0000">若希望在激活触发器的语句执行之后完成几个或更多的改变，则通常使用 AFTER 选项</font>

<br/>

**④ 表名**

与触发器相关联的表名，**此表必须是永久性表，不能将触发器与临时表或视图关联起来**, 在该表上触发事件发生时才会激活触发器,

<font color="#ff0000">同一个表不能拥有两个具有相同触发时刻和事件的触发器</font>

例如: 对于一张数据表，不能同时有两个 BEFORE UPDATE 触发器，但可以有一个 BEFORE UPDATE 触发器和一个 BEFORE INSERT 触发器，或一个  BEFORE UPDATE 触发器和一个 AFTER UPDATE 触发器

<br/>

**⑤ 触发器主体**

 触发器动作主体，包含**触发器激活时将要执行的 MySQL 语句**

如果要执行多个语句，可使用 BEGIN…END 复合语句结构

<br/>

**⑥ FOR EACH ROW**

一般是指**行级触发**，对于**受触发事件影响的每一行都要激活触发器的动作**

例如，使用 INSERT 语句向某个表中插入多行数据时，触发器会对每一行数据的插入都执行相应的触发器动作

>   <br/>
>
>   **注意：每个表都支持 INSERT、UPDATE 和 DELETE 的 BEFORE 与 AFTER，因此每个表最多支持 6 个触发器**
>
>   <font color="#ff0000">每个表的每个事件每次只允许有一个触发器, 单一触发器不能与多个事件或多个表关联</font>

><br/>
>
>**补充: 在 MySQL 中，若需要查看数据库中已有的触发器，则可以使用 `SHOW TRIGGERS `语句**

<br/>

###  创建 BEFORE 类型触发器

在 exam 数据库中，数据表 t_emp 为员工信息表，包含 id、name、deptId 和 salary 字段，数据表 t_emp 的表结构如下所示:

```mysql
+--------+-------------+------+-----+---------+-------+
| Field  | Type        | Null | Key | Default | Extra |
+--------+-------------+------+-----+---------+-------+
| id     | int(11)     | NO   | PRI | NULL    |       |
| name   | varchar(22) | YES  | UNI | NULL    |       |
| deptId | int(11)     | NO   | MUL | NULL    |       |
| salary | float       | YES  |     | 0       |       |
+--------+-------------+------+-----+---------+-------+
```

对应的SQL语句如下:

```mysql
create table t_emp (
	id int(11) not null,
    name varchar(22) default null unique,
    deptId int(11) not null, 
    salary float default 0,
    
    constraint pk_id primary key (id),
    index (deptId)
);

desc t_emp;
```

<br/>

【实例 1】创建一个名为 sumOfSalary 的触发器，触发的条件是向数据表 t_emp 中插入数据之前，对新插入的 salary 字段值进行求和计算。

输入的 SQL 语句和执行过程如下所示:

```mysql
create trigger sumOfSalary before insert on t_emp
for each row
set @sum = @sum + NEW.salary;
```

触发器 sumOfSalary 创建完成之后，向表 t_emp 中插入记录时，定义的 sum 值由 0 变成了 1500，即插入值 1000 和 500 的和，如下所示:

```mysql
SET @sum=0;

INSERT INTO t_emp VALUES(1,'A',1,1000), (2,'B',1,500);

select @sum;
+------+
| @sum |
+------+
| 1500 |
+------+
1 row in set (0.03 sec)
```

再次插入:

```mysql
insert into t_emp values(3, 'C', 1, 4000);

select @sum;
+------+
| @sum |
+------+
| 5500 |
+------+
```

<br/>

### 创建 AFTER 类型触发器

在 exam 数据库中，数据表 t_emp1 和 t_emp2 都为员工信息表，包含 id、name、deptId 和 salary 字段，数据表 t_emp1 和 t_emp2 的表结构如下所示:

```mysql
mysql> DESC t_emp1;
+--------+-------------+------+-----+---------+-------+
| Field  | Type        | Null | Key | Default | Extra |
+--------+-------------+------+-----+---------+-------+
| id     | int(11)     | NO   | PRI | NULL    |       |
| name   | varchar(25) | YES  |     | NULL    |       |
| deptId | int(11)     | YES  | MUL | NULL    |       |
| salary | float       | YES  |     | NULL    |       |
+--------+-------------+------+-----+---------+-------+

mysql> DESC t_emp2;
+--------+-------------+------+-----+---------+-------+
| Field  | Type        | Null | Key | Default | Extra |
+--------+-------------+------+-----+---------+-------+
| id     | int(11)     | NO   | PRI | NULL    |       |
| name   | varchar(25) | YES  |     | NULL    |       |
| deptId | int(11)     | YES  |     | NULL    |       |
| salary | float       | YES  |     | 0       |       |
+--------+-------------+------+-----+---------+-------+
```

对应的创建SQL如下:

```mysql
create table t_emp1 (
	id int(11) not null,
    name varchar(25) default null,
    deptId int(11) default null,
    salary float default null,
    
    constraint pk_id primary key (id),
    index (deptId)
);

desc t_emp1;

create table t_emp2 (
	id int(11) not null,
    name varchar(25) default null,
    deptId int(11) default null,
    salary float default 0,
    
    constraint pk_id primary key (id)
);

desc t_emp2;
```

<br/>

【实例 2】创建一个名为 double_salary 的触发器，触发的条件是向数据表 t_emp1 中插入数据之后，再向数据表 t_emp2 中插入相同的数据，并且 salary 为 t_emp1 中新插入的 salary 字段值的 2 倍

输入的 SQL 语句和执行过程如下所示:

```mysql
create trigger double_salary after insert on t_emp1
for each row
insert into t_emp2 values (NEW.id, NEW.name, NEW.deptId, 2 * NEW.salary);
```

触发器 double_salary 创建完成之后，向表 t_emp1 中插入记录时，同时向表 t_emp2 中插入相同的记录，并且 salary 字段为 t_emp1 中 salary 字段值的 2 倍，如下所示:

```mysql 
INSERT INTO t_emp1 VALUES (1,'A',1,1000), (2,'B',1,500);

select * from t_emp1;
+----+------+--------+--------+
| id | name | deptId | salary |
+----+------+--------+--------+
|  1 | A    |      1 |   1000 |
|  2 | B    |      1 |    500 |
+----+------+--------+--------+

select * from t_emp2;
+----+------+--------+--------+
| id | name | deptId | salary |
+----+------+--------+--------+
|  1 | A    |      1 |   2000 |
|  2 | B    |      1 |   1000 |
+----+------+--------+--------+
```

<br/>

## 三. 修改和删除触发器

与其他 MySQL 数据库对象一样，可以**使用 DROP 语句将触发器从数据库中删除**

语法格式如下： 

 ```mysql
DROP TRIGGER [ IF EXISTS ] [数据库名] <触发器名>
 ```

语法说明如下： 

**① 触发器名**

要删除的触发器名称

**② 数据库名**

可选项, 指定触发器所在的数据库的名称。若没有指定，则为当前默认的数据库

**③ 权限**

执行 DROP TRIGGER 语句需要 SUPER 权限

**④ IF EXISTS**

可选项, 避免在没有触发器的情况下删除触发器

>    <br/>
>
>   **注意：**
>
>   **删除一个表的同时，也会自动删除该表上的触发器**
>
>   <font color="#ff0000">**另外，触发器不能更新或覆盖，为了修改一个触发器，必须先删除它，再重新创建**</font>

<br/>

### 删除触发器

使用 DROP TRIGGER 语句可以删除 MySQL 中已经定义的触发器

【实例】删除 double_salary 触发器，输入的 SQL 语句和执行过程如下所示:

```mysql
mysql> DROP TRIGGER double_salary;
Query OK, 0 rows affected (0.03 sec)
```

删除 double_salary 触发器后，再次向数据表 t_emp1 中插入记录时，数据表 t_emp2 的数据不再发生变化，如下所示:

```mysql
INSERT INTO t_emp1 VALUES (3,'C',1,200);

SELECT * FROM t_emp1;
+----+------+--------+--------+
| id | name | deptId | salary |
+----+------+--------+--------+
|  1 | A    |      1 |   1000 |
|  2 | B    |      1 |    500 |
|  3 | C    |      1 |    200 |
+----+------+--------+--------+
3 rows in set (0.00 sec)

SELECT * FROM t_emp2;
+----+------+--------+--------+
| id | name | deptId | salary |
+----+------+--------+--------+
|  1 | A    |      1 |   2000 |
|  2 | B    |      1 |   1000 |
+----+------+--------+--------+
2 rows in set (0.00 sec)
```

<br/>