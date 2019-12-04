---
title: MySQL存储过程
toc: false
date: 2019-12-04 09:51:57
cover: http://api.mtyqx.cn/api/random.php?17
categories: 数据库
description: 最近在复习数据库, 突然发现存储过程和触发器还没怎么用过, 所以在这篇总结一下关于MySQL中存储过程和触发器的用法
---

最近在复习数据库, 突然发现存储过程和触发器还没怎么用过, 所以在这篇总结一下关于MySQL中存储过程的用法

本篇内容转自: [菜鸟教程-MySQL 存储过程](https://www.runoob.com/w3cnote/mysql-stored-procedure.html)

<br/>

<!--more-->

## 综述

MySQL 5.0 版本开始支持存储过程（Stored Procedure）:  存储过程是一种在数据库中存储复杂程序，以便外部程序调用的一种数据库对象

 存储过程是为了完成特定功能的SQL语句集，经编译创建并保存在数据库中，用户可通过指定存储过程的名字并给定参数(需要时)来调用执行

正文 存储过程思想上很简单，就是数据库 SQL 语言层面的代码封装与重用

存储过程的优缺点:

###  优点

-    存储过程可封装，并**隐藏复杂的商业逻辑**。
-    存储过程**可以回传值，并可以接受参数**。
-    存储过程**无法使用 SELECT 指令来运行，因为它是子程序，与查看表，数据表或用户定义函数不同**。
-    存储过程**可以用在数据检验，强制实行商业逻辑等**。

###  缺点

-   存储过程，往往**定制化于特定的数据库上**，因为支持的编程语言不同。当切换到其他厂商的数据库系统时，需要重写原有的存储过程。
-    存储过程的**性能调校与撰写，受限于各种数据库系统**

<br/>

## 一、存储过程的创建和调用

存储过程就是具有名字的一段代码，用来完成一个特定的功能, 创建的存储过程保存在数据库的数据字典中

### 创建存储过程

```mysql
CREATE [DEFINER = { user | CURRENT_USER }] PROCEDURE sp_name ([proc_parameter[,...]])
    [characteristic ...] routine_body
 
[begin_label:] BEGIN
　　[statement_list]
END [end_label]
```

>   <br/>
>
>   **参数说明:**
>
>   ```mysql
>   proc_parameter: [ IN | OUT | INOUT ] param_name type
>    
>   characteristic: 
>       COMMENT 'string'
>     | LANGUAGE SQL
>     | [NOT] DETERMINISTIC
>     | { CONTAINS SQL | NO SQL | READS SQL DATA | MODIFIES SQL DATA }
>     | SQL SECURITY { DEFINER | INVOKER }
>    
>   routine_body: Valid SQL routine statement
>   ```

<br/>

### MYSQL 存储过程中的关键语法

① 声明语句结束符，可以自定义:

```mysql
DELIMITER $$
或
DELIMITER //
```

② 声明存储过程:

```mysql
CREATE PROCEDURE demo_in_parameter(IN p_in int)
```

③ 存储过程开始和结束符号:

```mysql
BEGIN .... END
```

④ 变量赋值:

```mysql
SET @p_in=1
```

⑤ 变量定义:

```mysql
DECLARE l_int int unsigned default 4000000;
```

<br/>

**实例**

下面是存储过程的例子，删除给定球员参加的所有比赛:

```mysql
delimiter $$ -- 将语句的结束符号从分号;临时改为两个$$(可以是自定义)
create procedure deleteStudent(IN stuNo integer)
begin
	delete from mybatis.t_student
    where id = stuNo;
end$$
delimiter ; -- 将语句的结束符号恢复为分号
```

><br/>
>
>**解析：**
>
>-   默认情况下，存储过程和默认数据库相关联，如果想指定存储过程创建在某个特定的数据库下，那么在过程名前面加数据库名做前缀
>-   在定义过程时，使用 `DELIMITER  $$` 命令将语句的结束符号从分号 ; 临时改为两个` $$`，<font color="#ff0000">使得过程体中使用的分号被直接传递到服务器，而不会被客户端（如mysql）解释</font>

<br/>

调用存储过程:

```mysql
call sp_name[(传参)];
```

例如:

```mysql
call deleteStudent(12);
```

则此时id为12的学生记录就被删除

><br/>
>
>**解析：**在存储过程中设置了需要传参的变量stuNo，调用存储过程的时候，通过传参将12赋值给stuNo，然后进行存储过程里的SQL操作

<br/>

### 存储过程体

存储过程体包含了: 在过程调用时必须执行的语句(例如：dml、ddl语句，if-then-else和while-do语句、声明变量的declare语句等)

**过程体格式：以begin开始，以end结束(可嵌套)**

```mysql
BEGIN
　　BEGIN
　　　　BEGIN
　　　　　　statements; 
　　　　END
　　END
END
```

><br/>
>
>**注意：** <font color="#ff0000">每个嵌套块及其中的每条语句，必须以分号结束，表示过程体结束的begin-end块(又叫做复合语句compound statement)，则不需要分号</font>

为语句块贴标签:

```mysql
[begin_label:] BEGIN
　　[statement_list]
END [end_label]
```

例如：

```mysql
label1: BEGIN
　　label2: BEGIN
　　　　label3: BEGIN
　　　　　　statements; 
　　　　END label3 ;
　　END label2;
END label1
```

标签有两个作用：

-   **1. 增强代码的可读性** 
-   **2. 在某些语句(例如:leave和iterate语句)，需要用到标签**

<br/>

## 二、存储过程的参数

MySQL存储过程的参数用在存储过程的定义，共有三种参数类型,IN,OUT,INOUT,形式如:

```mysql
CREATE PROCEDURE 存储过程名([[IN |OUT |INOUT ] 参数名 数据类形...])
```

-    **IN 输入参数**：表示调用者向过程传入值（传入值可以是字面量或变量） 
-    **OUT 输出参数**：表示过程向调用者传出值(可以返回多个值)（传出值只能是变量） 
-    **INOUT 输入输出参数**：既表示调用者向过程传入值，又表示过程向调用者传出值（值只能是变量）

<br/>

### IN 输入参数

```mysql
drop procedure if exists in_param;

delimiter $$
create procedure in_param(IN p_in int)
begin
    select p_in; -- 1
    set p_in = 2;
    select p_in; -- 2
end$$
delimiter ;

set @p_in = 1;
call in_param(@p_in);

+------+
| p_in |
+------+
|    1 |
+------+
 
+------+
| P_in |
+------+
|    2 |
+------+

select @p_in; -- 1
+-------+
| @p_in |
+-------+
|     1 |
+-------+
```

以上可以看出，**p_in 在存储过程中被修改，但并不影响 @p_id 的值，因为前者为局部变量、后者为全局变量**

<br/>

### OUT输出参数

```mysql
drop procedure if exists out_param;

delimiter $$
create procedure out_param(OUT p_out int)
begin
    select p_out;
    set p_out = 2;
    select p_out;
end$$
delimiter ;

set @p_out = 1;
call out_param(@p_out);

+-------+
| p_out |
+-------+
|  NULL |
+-------+
# 因为out是向调用者输出参数，不接收输入的参数，所以存储过程里的p_out为null
+-------+
| p_out |
+-------+
|     2 |
+-------+

select @p_out;
+--------+
| @p_out |
+--------+
|      2 |
+--------+
# 调用了out_param存储过程，输出参数，改变了p_out变量的值
```

<br/>

### INOUT参数

```mysql
drop procedure if exists inout_param;

delimiter $$
create procedure inout_param(INOUT p_inout int)
begin
    select p_inout;
    set p_inout = 2;
    select p_inout;
end$$
delimiter ;

set @p_inout = 1;
call inout_param(@p_inout);

+---------+
| p_inout |
+---------+
|       1 |
+---------+
 
+---------+
| p_inout |
+---------+
|       2 |
+---------+

select @p_inout;
+----------+
| @p_inout |
+----------+
|        2 |
+----------+
# 调用了inout_param存储过程，接受了输入的参数，也输出参数，改变了变量
```

><br/>
>
>**注意：**
>
>**① 如果过程没有参数，也必须在过程名后面写上小括号**
>
>例：
>
>```mysql
>CREATE PROCEDURE sp_name ([proc_parameter[,...]]) ……
>```
>
>**② 确保参数的名字不等于列的名字，否则在过程体中，参数名被当做列名来处理**
>
>**建议：**
>
>-   **输入值使用in参数**
>-   **返回值使用out参数**
>-   **INOUT参数就尽量的少用**

<br/>

## 三. 变量

### 变量定义

**局部变量声明一定要放在存储过程体的开始：**

```mysql
DECLARE variable_name [,variable_name...] datatype [DEFAULT value];
```

其中，datatype 为 MySQL 的数据类型，如: int, float, date, varchar(length)

例如:

```mysql
DECLARE l_int int unsigned default 4000000;   
DECLARE l_numeric number(8,2) DEFAULT 9.95;   
DECLARE l_date date DEFAULT '1999-12-31';   
DECLARE l_datetime datetime DEFAULT '1999-12-31 23:59:59';   
DECLARE l_varchar varchar(255) DEFAULT 'This will not be padded';
```

<br/>

### 变量赋值

```mysql
SET 变量名 = 表达式值 [,variable_name = expression ...]
```

<br/>

### 用户变量

**① 在MySQL客户端使用用户变量:**

```mysql
mysql > SELECT 'Hello World' into @x;  
mysql > SELECT @x;  
+-------------+  
|   @x        |  
+-------------+  
| Hello World |  
+-------------+  

mysql > SET @y='Goodbye Cruel World';  
mysql > SELECT @y;  ① 在MySQL客户端使用用户变量:
+---------------------+  
|     @y              |  
+---------------------+  
| Goodbye Cruel World |  
+---------------------+  
 
mysql > SET @z=1+2+3;  
mysql > SELECT @z;  
+------+  
| @z   |  
+------+  
|  6   |  
```

<br/>

**② 在存储过程中使用用户变量**

```mysql
create procedure GreetWorld() SELECT CONCAT(@greeting,' World');  
set @greeting = 'Hello';
call GreetWorld();
+----------------------------+  
| CONCAT(@greeting,' World') |  
+----------------------------+  
|  Hello World               |  
+----------------------------+
```

<br/>

**③ 在存储过程间传递全局范围的用户变量**

```mysql
CREATE PROCEDURE p1()   SET @last_procedure='p1';
CREATE PROCEDURE p2() SELECT CONCAT('Last procedure was ', @last_procedure);
CALL p1();
CALL p2();
+-----------------------------------------------+  
| CONCAT('Last procedure was ',@last_proc       |  
+-----------------------------------------------+  
| Last procedure was p1                         |  
 +-----------------------------------------------+
```

><br/>
>
>**总结:**
>
>-   **用户变量名一般以@开头**
>-   **滥用用户变量会导致程序难以理解及管理**

<br/>

## 四. MySQL存储过程的调用

用call和过程名以及一个括号，括号里面根据需要，加入参数，参数包括输入参数、输出参数、输入输出参数

具体的调用方法可以参看上面的例子

<br/>

## 五. MySQL存储过程的查询

我们想知道一个数据库下面有哪些表，我们一般采用 `showtables; `进行查看

**① 查看某个数据库下面的存储过程**，可以用以下语句:

```mysql
select name from mysql.proc where db='数据库名';
或者
select routine_name from information_schema.routines where routine_schema='数据库名';
或者
show procedure status where db='数据库名';
```

<br/>

**② 查看某个存储过程的详细**

```mysql
SHOW CREATE PROCEDURE 数据库.存储过程名;
```

<br/>

## 六. MySQL存储过程的修改

```mysql
ALTER PROCEDURE
```

**更改用 CREATE PROCEDURE 建立的预先指定的存储过程，其不会影响相关存储过程或存储功能**

<br/>

## 七. MySQL存储过程的删除

删除一个存储过程比较简单，和删除表一样：

```mysql
DROP PROCEDURE 过程名
```

从 MySQL 的表格中删除一个或多个存储过程

<br/>

## 八.  MySQL存储过程的控制语句 

### 变量作用域

<font color="#ff0000">内部的变量在其作用域范围内享有更高的优先权</font>

<font color="#ff0000">当执行到 end时，内部变量消失，此时已经在其作用域外，变量不再可见了, 此时在存储过程外再也不能找到这个声明的变量，但是你可以通过 out 参数或者将其值指派给会话变量来保存其值</font>

```mysql
delimiter $$
create procedure proc3()
begin
    declare x1 varchar(5) default 'outer';
    begin
		declare x1 varchar(5) default 'inner';
		select x1; -- inner
	end;
	select x1; -- outer
end$$
delimiter ;

call proc3();
```

<br/>

### 条件语句

**① if-then-else 语句**

```mysql
delimiter $$
create procedure if_demo(IN param INT)
begin
	declare var int;
    set var = param + 1;
    if var = 0 
	then insert into t values(17);
    end if;
    
    if param = 0
    then update t set s1 = s1 + 1;
    else update t set s1 = s1 + 2;
    end if;
end$$
delimiter ;
```

<br/>

**② case语句**

```mysql
delimiter $$
create procedure case_demo(IN param INT)
begin
	declare var int;
    set var = param + 1;
    case var
		when 0 then 
			insert into t values(17);
		when 1 then
			insert into t values(18);
		else
			insert into t values(19);
	end case;
end$$
delimiter ;
```

<br/>

### 循环语句

**① while … end while**

语法:

```mysql
while 条件 do
    --循环体;
end while;
```

例如:

```mysql
delimiter $$
create procedure while_demo(IN param INT)
begin
	declare var int;
    set var = 0;
    while var < 6 do
		insert into t values(var);
        set var = var + 1;
	end while;
end$$
delimiter ;
```

<br/>

**② repeat … end repeat**

它在**执行操作后检查结果**，而 while 则是执行前进行检查

语法:

```mysql
repeat
    --循环体;
until 循环条件  
end repeat;
```

例如:

```mysql
delimiter $$
create procedure repeat_demo()
begin
	declare v int;
    set v = 0;
    repeat
		insert into t values(v);
        set v = v + 1;
	until v >= 5
    end repeat;
end$$
delimiter ;
```

><br/>
>
>**注: until后面是没有分号的**

<br/>

**③  loop … end loop**

loop 循环不需要初始条件，这点和 while 循环相似，同时和 repeat 循环一样不需要结束条件, leave 语句的意义是离开循环

```mysql
delimiter $$
create procedure loop_demo()
begin
	declare v int;
    set v = 0;
    LOOP_LABEL: loop
		insert into t values(v);
		set v = v + 1;
		if v >= 5 
			then leave LOOP_LABEL;
		end if;
    end loop;    
end$$
delimiter ;
```

<br/>

**④ ITERATE迭代**

ITERATE 通过引用复合语句的标号,来重新开始复合语句:

```mysql
delimiter $$
create procedure iterate_demo()
begin
	declare v int;
    set v = 0;
    LOOP_LABEL: loop
		if v = 3 then 
			set v = v + 1;
			iterate LOOP_LABEL;
		end if;
		
        insert into t values(v);
        set v = v + 1;
        
        if v >= 5 then
			leave LOOP_LABEL;
		end if;
    end loop;    
end$$
delimiter ;
```

<br/>