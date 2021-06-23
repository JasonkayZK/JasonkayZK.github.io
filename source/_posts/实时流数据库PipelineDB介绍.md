---
title: 实时流数据库PipelineDB介绍
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?65'
date: 2021-06-16 15:19:07
categories: PostgreSQL
tags: [PostgreSQL, PipelineDB, 流式数据库]
description: 在大数据时代，像是Spark、Flink这些大数据分析工具都提供了相应的流式分析解决方案；对于像是MySQL这种传统的关系型数据库是否能够实现流式分析呢？当然！PipelineDB就是这么一个基于PostgreSQL实现的流式数据库，并且PipelineDB已经成为了PostgreSQL中的一个插件，我们可以在PostgreSQL中安装并直接使用！本文就来讲述实时流数据库PipelineDB，并带你推开流式数据分析的大门；
---

在大数据时代，像是Spark、Flink这些大数据分析工具都提供了相应的流式分析解决方案；对于像是MySQL这种传统的关系型数据库是否能够实现流式分析呢？

当然！PipelineDB就是这么一个基于PostgreSQL实现的流式数据库，并且PipelineDB已经成为了PostgreSQL中的一个插件，我们可以在PostgreSQL中安装并直接使用！

本文就来讲述实时流数据库PipelineDB，并带你推开流式数据分析的大门；

PipelineDB官方仓库：

-   https://github.com/pipelinedb/pipelinedb

PipelineDB官方文档：

-   https://pipelinedb-doc-cn.readthedocs.io/zh_CN/latest/index.html

<br/>

<!--more-->

## **实时流数据库PipelineDB介绍**

### **安装PipelineDB**

>   <font color="#f00">**PipelineDB是以PostgreSQL插件运行的，因此在安装PipelineDB之前，请确保你已经成功安装了PostgreSQL；**</font>

你可以使用apt、yum等多种方式安装PipelineDB，下面是安装的官方文档：

-   https://pipelinedb-doc-cn.readthedocs.io/zh_CN/latest/installation.html#docker

本文将**不采用**这种方式，而是**采用Docker的方式**直接通过官方提供的镜像进行安装；

PipelineDB官方Docker镜像地址：

-   https://hub.docker.com/u/pipelinedb

通过下面这条命令直接拉取镜像并创建一个容器：

```bash
docker run -d -p5432:5432 --name pipelinedb pipelinedb/pipelinedb-postgresql-11
```

>   **通过 `docker run` 启动PipelineDB实例时可以指定PostgreSQL版本：**
>
>   ```bash
>   docker run pipelinedb/pipelinedb-postgresql-{postgresql version}
>   ```
>
>   同时，PipelineDB Docker镜像基于 [PostgreSQL image](https://hub.docker.com/_/postgres/) 构建；
>
>   因此，所有配置项及个性化参数均可以通过 [PostgreSQL镜像](https://hub.docker.com/_/postgres/) 提供的接口进行设置！

<font color="#f00">**创建完成后，服务器端口会映射至`5432`，同时默认的镜像账号及密码均为：`postgres`；**</font>

查看容器状态：

```bash
[root@localhost ~]# docker ps
CONTAINER ID   IMAGE                                 COMMAND                  CREATED         STATUS         PORTS                                       NAMES
8d489064dbd2   pipelinedb/pipelinedb-postgresql-11   "docker-entrypoint.s…"   4 minutes ago   Up 4 minutes   0.0.0.0:5432->5432/tcp, :::5432->5432/tcp   pipelinedb
```

可以看到容器已经启动，至此我们的PipelineDB已经安装完成！

<br/>

### **进入数据库**

首先进入容器中：

```bash
docker exec -it pipelinedb /bin/bash
```

随后，进入数据库：

```bash
root@8d489064dbd2:/# psql -U postgres
psql (11.0 (Debian 11.0-1.pgdg90+2))
Type "help" for help.

postgres=# 
```

由于我们是root，同时是本地登录因此不需要输入密码，直接进入数据库交互了；

进入数据库之后，我们来开始介绍关于PipelineDB的核心概念吧！

<br/>

### **核心概念**

#### **Stream**

##### **创建Stream**

Stream 在 PipelineDB 中代表一个数据流，他的地位和传统关系型数据库中的表或视图（Table/View）是类似的，可以通过`CREATE FOREIGN TABLE table_name (column_name type) SERVER pipelinedb;`命令创建流，使用`Drop`删除流，`Insert`将数据插入流；

例如，下面的命令创建了一个叫做`mystream`的流，流中包括了`x`、`y`两个整数：

```mysql
CREATE FOREIGN TABLE table_name (x integer, y integer) SERVER pipelinedb;
```

执行命令：

```
postgres=# CREATE FOREIGN TABLE mystream (x integer, y integer) SERVER pipelinedb;
CREATE FOREIGN TABLE
```

可以看到，我们的Stream创建成功！

下面尝试向Stream中插入数据！

<br/>

##### **向Stream中插入数据**

可以使用和传统关系型数据库相同的`INSERT INTO`向流中插入数据：

```mysql
# 插入一条数据
INSERT INTO mystream (x, y) VALUES (1, 2);

# 插入多条数据
INSERT INTO mystream (x, y) VALUES (1, 2),(2,2),(3,1);
```

执行后的结果如下：

```
postgres=# INSERT INTO mystream (x, y) VALUES (1, 2);
INSERT 0 1
postgres=# INSERT INTO mystream (x, y) VALUES (1, 2),(2,2),(3,1);
INSERT 0 3
```

<br/>

##### **删除Stream**

可以使用`DROP FOREIGN TABLE table_name`删除Stream：

```mysql
DROP FOREIGN TABLE table_name;
```

<br/>

##### **关于查询操作**

我们介绍了关于Stream的创建、删除以及向Stream中写入数据的操作，但是并<font color="#f00">**没有查询的`SELECT`命令；**</font>

<font color="#f00">**这和 Stream 的特性有关：Stream 代表的是一个流的入口，数据可以从这个入口进入(Insert)，但是 Stream 本身并不保存任何数据，因而不能在 Stream 上运行任何查询，要想将 Stream 的数据”兜”住，则需要创建一个持续视图；**</font>

下面我们创建一个持续视图（Continuous View）；

<br/>

#### **Continuous View**

我们知道视图 View 是一个抽象的表，即：对于有 x、y、z 三列的表 tb1 上可以选出 x、y 两列组成一个视图，其实就是一张表，只不过区别于table，view并没有单独创建；

上面是对 View 的简述，那么 Continuous View 又是指什么呢？

PIpelineDB将数据流进行圈定的方式就是持续视图，对照关系如下：

```
table--->stream
view--->continuous view
```

<font color="#f00">**但是区别在于：流不能直接用select进行查询，持续视图比起视图有着随着流数据进入会持续更新的效果；**</font>

概念表述上可能略微复杂，让我们看个例子；

##### **创建Continuous View**

可以像创建一个通常的View一样，使用`CREATE VIEW`创建一个持续视图，只不过要指定 `action` 为 `materialize`：

```mysql
CREATE VIEW myview1 WITH (action=materialize) AS SELECT x, y FROM mystream;
```

同时在对Stream创建视图时，默认的 `action` 就是 `materialize`，所以我们可以将`WITH (action=materialize)`整个省略，直接创建持续视图：

```mysql
CREATE VIEW myview1 AS SELECT x, y FROM mystream;
```

执行后的结果如下：

```
postgres=# CREATE VIEW myview1 AS SELECT x, y FROM mystream;
CREATE VIEW
```

可以看到，视图成功的被创建了！

除了查询`x`和`y`的值以外，数据库还提供了大量的聚合函数，例如下面的`myview2`创建了一个查询流中`x`的最大值和`y`中总和的持续视图：

```mysql
CREATE VIEW myview2 AS SELECT max(x), sum(y) FROM mystream;
```

<br/>

##### **从Continuous View中查询**

首先我们向Stream中插入一些数据：

```
postgres=# INSERT INTO mystream (x, y) VALUES (1,2),(2,1),(3,3);
INSERT 0 3
```

随后，和传统的关系型数据库类似，可以直接通过`SELECT`进行查询：

```mysql
# 从myview1中查询数据
SELECT * FROM myview1中查询数据;

 x | y 
---+---
 1 | 2
 2 | 1
 3 | 3
(3 rows)

# 从myview2中查询数据
SELECT * FROM myview2;

max | sum 
-----+-----
   3 |   6
(1 row)
```

从这个例子中可以看出：持续视图可以始终记录整个数据流中 x 的最大值以及 y 值的和；

因此流式数据分析可以通过创建视图的形式进行实时分析，要想获得分析的结果只需要通过一个数据库的Select语句即可；

同时，由于PipelineDB本身基于PostgreSQL，所以任何能连接PostgreSQL的驱动（如jdbc、odbc等）都可以连接该数据库！

<br/>

#### **Sliding Windows**

在默认情况下，持续视图会存储整个流中所有的历史；

但是有些时候我们可能只想存储1小时以内的数据，这就需要一个滑动窗口（Sliding Windows），约束分析的时间范围；

下面创建了两个包括时间窗口的持续视图：

```mysql
CREATE VIEW myview3 WITH (sw = '10 seconds') AS  SELECT x, y FROM mystream;

CREATE VIEW myview4 WITH (sw = '10 seconds') AS SELECT max(x), sum(y) FROM mystream;
```

通过指定`WITH (sw = '10 seconds')`我们创建了一个窗口长度为10秒钟的持续视图；

下面再插入一些数据看一看效果吧：

```mysql
# 插入数据
INSERT INTO mystream (x, y) VALUES (10,20),(20,10),(30,30);
INSERT 0 3

# 查询myview3
SELECT * FROM myview3;

 x  | y  
----+----
 10 | 20
 20 | 10
 30 | 30
(3 rows)

# 查询myview4
SELECT * FROM myview4;

 max | sum 
-----+-----
  30 |  60
(1 row)

# 查询myview1
SELECT * FROM myview1;

 x  | y  
----+----
  1 |  2
  2 |  1
  3 |  3
 10 | 20
 20 | 10
 30 | 30
(6 rows)

# 查询myview2
SELECT * FROM myview2;

 max | sum 
-----+-----
  30 |  66
(1 row)
```

可以看到，此时myview1~myview4都正常输出了；

等待10秒钟后，再次查询：

```mysql
SELECT * FROM myview3;

x | y 
---+---
(0 rows)

SELECT * FROM myview4;

 max | sum 
-----+-----
     |    
(1 row)

SELECT * FROM myview1;

 x  | y  
----+----
  1 |  2
  2 |  1
  3 |  3
 10 | 20
 20 | 10
 30 | 30
(6 rows)

SELECT * FROM myview2;

 max | sum 
-----+-----
  30 |  66
(1 row)
```

可以看到此时含有窗口的myview3和myview4中已经不再包含任何数据了！

这就是时间窗口的作用！

<br/>

#### **Continuous Transforms**

如果想要在流数据出现异常值的时候触发事件执行`shell`脚本该怎么做呢？

PipelineDB提供了持续转换（Continuous Transforms）：

<font color="#f00">**持续转换和持续视图有些类似，不过持续转换并不存储任何数据，只是提供判断：如果数据满足条件则触发事件执行自定义的函数；**</font>

例如：流中 `x` 的值超过100，则执行一段shell指令：curl调用REST接口去发送邮件；

下面我们来尝试一下这个功能；

首先我们先创建一个数据表`abnormal_val`，该数据表将会存储当`x`和`y`的值大于100时的数据；

```mysql
CREATE TABLE abnormal_val (x integer, y integer);
```

接下来创建一个函数，用于向数据表`abnormal_val`中插入数据；

```mysql
CREATE OR REPLACE FUNCTION insert_into_abnormal_val()
  RETURNS trigger AS
  $$
  BEGIN
    INSERT INTO abnormal_val (x, y) VALUES (NEW.x, NEW.y);
    RETURN NEW;
  END;
  $$
  LANGUAGE plpgsql;
```

最后我们创建一个Continuous Transforms，用于触发大于100写入表的逻辑：

```mysql
CREATE VIEW myct WITH (action=transform, outputfunc=insert_into_abnormal_val) AS
  SELECT x::integer, y::integer FROM mystream  WHERE x > 100 and y > 100;
```

下面尝试插入几条数据：

```mysql
INSERT INTO mystream (x, y) VALUES (-5,5),(100,30),(101,110),(99,1010),(222,333);
```

现在让我们查看一下数据表`abnormal_val`中的数据：

```mysql
SELECT * FROM abnormal_val;

  x  |  y  
-----+-----
 101 | 110
 222 | 333
(2 rows)
```

可以看到，只有满足X和Y都大于100的数据才被插入了表中！

就是这么的方便！

<br/>

### **总结**

可以看到，我们可以通过Docker快速的启动一个PipelineDB，并使用PipelineDB对数据进行各种维度下的流式分析；

并且相信你通过上面的讲解，已经对流式数据库有了基本的了解；

与传统的关系型数据库不同，流式数据库更加关注实时性的数据，而非结构型的数据；

最后，本文仅仅起到抛砖引玉的作用；如果想要进一步深入了解PipelineDB可以查看PipelineDB的官方文档：

-   https://pipelinedb-doc-cn.readthedocs.io/zh_CN/latest/index.html

<br/>

## **附录**

PipelineDB官方仓库：

-   https://github.com/pipelinedb/pipelinedb

PipelineDB官方文档：

-   https://pipelinedb-doc-cn.readthedocs.io/zh_CN/latest/index.html

文章参考：

-   https://sunwu51.github.io/bigdatatutorial/PostgreSQL/pipelinedb.html
-   https://github.com/pipelinedb/pipelinedb/issues/1774
-   https://pipelinedb-doc-cn.readthedocs.io/zh_CN/latest/streams.html

<br/>