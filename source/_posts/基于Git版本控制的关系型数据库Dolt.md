---
title: 基于Git版本控制的关系型数据库Dolt
toc: true
cover: 'https://img.paulzzh.com/touhou/random?79'
date: 2024-01-21 21:07:06
categories: Dolt
tags: [Dolt, 数据库]
description: Dolt 是一个基于Git的数据库实现，他提供了类似于Git管理代码的方式来管理数据！并且提供了DoltHub，类似于Github来存储关系型数据！
---

Dolt 是一个基于Git的数据库实现，他提供了类似于Git管理代码的方式来管理数据！

并且提供了DoltHub，类似于Github来存储关系型数据！

源代码：

-   https://github.com/JasonkayZK/docker-repo/blob/master/my-dolt.sh
-   https://github.com/dolthub/dolt/tree/main

<br/>

<!--more-->

# **基于Git版本控制的关系型数据库Dolt**

## **前言**

Dolt 的官方 Repo：

-   https://github.com/dolthub/dolt/tree/main

**Dolt 本身只是一个二进制，直接通过 Release 下载即可使用！**

例如：

```shell
# 初始化数据库
dolt init

# 进入 sql 交互
dolt sql
```

Dolt 支持 MySQL 的大部分语法，直接使用即可！

**此外 Dolt 提供了 Dolthub，类似于 Github 可以存储数据，强烈建议注册一个账号（直接通过 Github 即可），后面会用到！**

-   https://www.dolthub.com/

<br/>

## **部署Dolt-Server**

除了通过 Shell 的方式使用，也可以将 Dolt 部署为一个 Server，然后通过 MySQL 客户端的方式使用！

使用 Docker 部署的方法如下；

1、创建数据目录：

```shell
export DOLT_HOME=/root/workspace/dolt

mkdir -p $DOLT_HOME
mkdir -p $DOLT_HOME/server-conf
```

2、创建配置：

```shell
# Write config
# see more: https://docs.dolthub.com/sql-reference/server/configuration

cat > $DOLT_HOME/server-conf/config.yaml << EOF
log_level: info

behavior:
  read_only: false
  autocommit: true

user:
  name: root
  password: "your-password"

listener:
  host: localhost
  port: 3306
  max_connections: 100
  read_timeout_millis: 28800000
  write_timeout_millis: 28800000

performance:
  query_parallelism: null
EOF
```

3、创建容器：

```shell
docker run -itd --restart=always \
  --name my-dolt \
  -p 23306:3306 \
  -v $DOLT_HOME/server-conf:/etc/dolt/servercfg.d \
  -v $DOLT_HOME/dolt-conf:/etc/dolt/doltcfg.d \
  -v $DOLT_HOME/databases:/var/lib/dolt \
  dolthub/dolt-sql-server:1.32.0
```

4、修改容器中的远程配置：

```shell
# 进入容器中
docker exec -it my-dolt /bin/bash

# 修改配置
dolt config --global --set user.name "jasonkayzk"
dolt config --global --set user.email "jasonkayzk@gmail.com"
dolt login # set creds
```

执行 `dolt login` 后会打开 Dolthub 并创建一个 `Credentials`，直接保存即可！

5、重启容器：

最后，重启容器，让配置生效！

```shell
docker restart my-dolt
```

>   <font color="#f00">**注：这里一定要重启容器，否则上面的 Credentials 不会在 Server 中生效！**</font>
>
>   <font color="#f00">**这会导致在 Server 中进行 Push 时会报错 PermissionDenied！**</font>

<br/>

## **连接Dolt执行SQL**

我们可以直接通过 MySQL 的客户端连接到 Dolt 服务器；

例如：

```shell
mysql --host 127.0.0.1 --port 3306 -u root
```

也可以在容器中通过 Dolt 执行 SQL：

```shell
docker exec -it my-dolt /bin/bash

dolt sql
```

<br/>

## **使用Dolt例子**

### **基本使用**

使用 MySQL 客户端连接到 Dolt，执行 SQL：

```mysql
create database testdb;

use testdb;

create table mytable
(
    pk   int primary key,
    col1 varchar(20)
);

insert into mytable
values (1, 'first row'),
       (2, 'second row');
```

上面的 SQL 创建了 testdb 数据库和一个 mytable 表，并写入了一条数据；

**然而，此时，我们执行的这些变更都是在本地的，并且没有对变更进行 Commit；**

下面来看 Dolt 提供的 Git 功能！

<br/>

### **版本控制**

Dolt 命令行提供了 Add、Commit 等功能；

通过命令行查看当前状态：

```shell
$ dolt status

On branch main
Untracked tables:
  (use "dolt add <table>" to include in what will be committed)
        new table:        mytable
```

同时，Dolt 也提供了 SQL 函数来实现相同的功能，例如：

-   `dolt_add`
-   `dolt_commit`
-   `dolt_clone`
-   …

**可以使用 CALL 来调用这些 SQL 函数；**

Commit 上面的创建：

```SQL
# dolt add .
call dolt_add('.');

0

# dolt commit -am 'first commit!'
call dolt_commit('-am', 'first commit!');

8v3jvctvh04v0njh81s3l02u64l3qpbb
```

查看状态（`dolt_history_<table-name>`）：

```sql
SELECT * FROM dolt_history_mytable;

# 1,first row,8v3jvctvh04v0njh81s3l02u64l3qpbb,root,2024-01-21 13:57:17
# 2,second row,8v3jvctvh04v0njh81s3l02u64l3qpbb,root,2024-01-21 13:57:17
```

<br/>

再次添加数据：

```shell
insert into mytable values (100, 'new row');

call dolt_add('.');

call dolt_commit('-am', 'new commit!');
```

查看数据：

```mysql
select * from mytable;

# 1,first row
# 2,second row
# 100,new row
```



查看 Log：

```sql
# dolt log
select * from dolt_log;

# koum3phtvdh00hmohl4hv90eu3ml61ln,root,root@%,2024-01-21 14:00:41,new commit!
# 8v3jvctvh04v0njh81s3l02u64l3qpbb,root,root@%,2024-01-21 13:57:17,first commit!
# ufio4hfv807ftqmlr540v9gu8j7jasff,jasonkayzk,jasonkayzk@gmail.com,2024-01-21 13:41:12,Initialize data repository
```

回滚数据：

```sql
# dolt reset --hard HEAD^
call dolt_reset('--hard', 'HEAD^');

# Query data：
select * from mytable;

# 1,first row
# 2,second row

# Show log
select * from dolt_log;
8v3jvctvh04v0njh81s3l02u64l3qpbb,root,root@%,2024-01-21 13:57:17,first commit!
ufio4hfv807ftqmlr540v9gu8j7jasff,jasonkayzk,jasonkayzk@gmail.com,2024-01-21 13:41:12,Initialize data repository
```

**可以看到，数据被回滚了！**

<br/>

### **结合Dolthub**

上面我们创建了数据库，并展示了 Dolt 的版本控制；

下面我们会结合 Dolthub，完成 Push、Clone 等功能！

首先，在 Dolthub 创建一个新的数据库：

-   https://www.dolthub.com/profile/new-repository

然后添加 Remote 并 push：

```sql
# dolt remote add origin jasonkayzk/testdb
call dolt_remote('add', 'origin', 'jasonkayzk/testdb');
# 0

# dolt push origin main
call dolt_push('origin', 'main');
# 0,"To https://doltremoteapi.dolthub.com/jasonkayzk/testdb
#  * [new branch]          main -> main"
```

随后即可看到数据被推到了 Dolthub：

-   https://www.dolthub.com/repositories/jasonkayzk/testdb

非常的方便！

<br/>

此外，我们也可以在其他地方通过 Dolt 对数据进行 Clone：

```shell
# call dolt_clone('jasonkayzk/testdb');
➜  dolt clone jasonkayzk/testdb
cloning https://doltremoteapi.dolthub.com/jasonkayzk/testdb

➜  cd testdb

➜  testdb dolt sql
# Welcome to the DoltSQL shell.
# Statements must be terminated with ';'.
# "exit" or "quit" (or Ctrl-D) to exit.
testdb/main> select * from mytable;
+----+------------+
| pk | col1       |
+----+------------+
| 1  | first row  |
| 2  | second row |
+----+------------+
2 rows in set (0.00 sec)

testdb/main> quit
Bye
```

非常的方便！

<br/>

## **小结**

除了上面展示的功能，Dolt 还提供了 Branch、Merge 等等几乎 Git 所有的功能！

快去试试吧！

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/docker-repo/blob/master/my-dolt.sh
-   https://github.com/dolthub/dolt/tree/main

<br/>
