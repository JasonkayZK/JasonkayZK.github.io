---
title: Java订阅Binlog的几种方式
toc: true
cover: 'https://img.paulzzh.com/touhou/random?4'
date: 2023-03-26 15:42:19
categories: Java
tags: [Java, MySQL]
description: 通过 MySQL 提供的 Binlog，我们可以对 MySQL 中的数据进行同步；本文总结了 Binlog 同步的两种方式：mysql-binlog-connector-java库、Canal组件；
---

通过 MySQL 提供的 Binlog，我们可以对 MySQL 中的数据进行同步；

本文总结了 Binlog 同步的两种方式：mysql-binlog-connector-java库、Canal组件；

源代码：

-   https://github.com/JasonkayZK/java-all/tree/main/mysql/binlog

<br/>

<!--more-->

# **Java订阅Binlog的几种方式**

目前主流订阅 MySQL Binlog 的方式有两种：

-   使用 [osheroff/mysql-binlog-connector-java](https://github.com/osheroff/mysql-binlog-connector-java/) 库；
-   使用 [alibaba/Canal](https://github.com/alibaba/Canal/) 组件；

下面分别来看；

<br/>

## **使用 mysql-binlog-connector-java 库**

### **使用Docker部署MySQL并开启Binlog**

mysql的binlog默认是不打开的，我们需要进行配置：

mysql/binlog/binlog-connector/config/mysqld.cnf

```ini
[mysqld]
log-bin=mysql-bin # 添加这一行就ok
binlog-format=ROW # 选择row模式
server_id=1 # 配置mysql replaction需要定义，不能和Canal的slaveId重复

# 配置表名字不区分大小写
lower_case_table_names=1
```

将该配置文件挂载到 MySQL 配置路径中，并启动容器：

```bash
docker run -itd --restart=always \
  --name my-mysql \
  -p 13306:3306 \
  -v ./config/mysqld.cnf:/etc/mysql/conf.d/mysqld.cnf \
  -e MYSQL_ROOT_PASSWORD=123456 mysql:5.7.8
```

监测是否开启成功，进入mysql命令行，执行：

```
mysql> show variables like '%log_bin%';

+---------------------------------+--------------------------------+
| Variable_name                   | Value                          |
+---------------------------------+--------------------------------+
| log_bin                         | ON                             |
| log_bin_basename                | /var/lib/mysql/mysql-bin       |
| log_bin_index                   | /var/lib/mysql/mysql-bin.index |
| log_bin_trust_function_creators | OFF                            |
| log_bin_use_v1_row_events       | OFF                            |
| sql_log_bin                     | ON                             |
+---------------------------------+--------------------------------+
6 rows in set, 1 warning (0.01 sec)
```

可以看到已经开启；

查看正在写入的binlog状态：

```
mysql> show master status;

+------------------+----------+--------------+------------------+-------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB | Executed_Gtid_Set |
+------------------+----------+--------------+------------------+-------------------+
| mysql-bin.000003 |     2862 |              |                  |                   |
+------------------+----------+--------------+------------------+-------------------+
1 row in set (0.00 sec)
```

<br/>

### **代码读取binlog**

下面我们引入 mysql-binlog-connector-java 依赖：

```xml
<dependencies>
  <dependency>
    <groupId>com.zendesk</groupId>
    <artifactId>mysql-binlog-connector-java</artifactId>
    <version>0.28.0</version>
  </dependency>
</dependencies>
```

然后根据官方提供的 Demo：

```java
public class Main {
  public static void main(String[] args) throws IOException {
    BinaryLogClient client = new BinaryLogClient("localhost", 13306, "root", "123456");
    EventDeserializer eventDeserializer = new EventDeserializer();
    eventDeserializer.setCompatibilityMode(
      EventDeserializer.CompatibilityMode.DATE_AND_TIME_AS_LONG,
      EventDeserializer.CompatibilityMode.CHAR_AND_BINARY_AS_BYTE_ARRAY
    );
    client.setEventDeserializer(eventDeserializer);
    client.registerEventListener(event -> {
      System.out.println(event.toString());
    });
    client.connect();
  }
}
```

在实际使用时，可以在onEvent中写自己的业务逻辑；

在MySQL 中执行一些操作，输出：

```
Event{header=EventHeaderV4{timestamp=0, eventType=ROTATE, serverId=1, headerLength=19, dataLength=28, nextPosition=0, flags=32}, data=RotateEventData{binlogFilename='mysql-bin.000003', binlogPosition=2862}}
Event{header=EventHeaderV4{timestamp=1679801255000, eventType=FORMAT_DESCRIPTION, serverId=1, headerLength=19, dataLength=100, nextPosition=0, flags=0}, data=FormatDescriptionEventData{binlogVersion=4, serverVersion='5.7.8-rc-log', headerLength=19, dataLength=95, checksumType=CRC32}}
Event{header=EventHeaderV4{timestamp=1679840334000, eventType=ANONYMOUS_GTID, serverId=1, headerLength=19, dataLength=46, nextPosition=2927, flags=0}, data=null}
Event{header=EventHeaderV4{timestamp=1679840334000, eventType=QUERY, serverId=1, headerLength=19, dataLength=53, nextPosition=2999, flags=8}, data=QueryEventData{threadId=71, executionTime=0, errorCode=0, database='test', sql='BEGIN'}}
Event{header=EventHeaderV4{timestamp=1679840334000, eventType=TABLE_MAP, serverId=1, headerLength=19, dataLength=36, nextPosition=3054, flags=0}, data=TableMapEventData{tableId=133, database='test', table='t_user', columnTypes=3, 15, 15, columnMetadata=0, 255, 255, columnNullability={}, eventMetadata=null}}
Event{header=EventHeaderV4{timestamp=1679840334000, eventType=EXT_WRITE_ROWS, serverId=1, headerLength=19, dataLength=30, nextPosition=3103, flags=0}, data=WriteRowsEventData{tableId=133, includedColumns={0, 1, 2}, rows=[
    [8, [B@ea30797, [B@7e774085]
]}}
Event{header=EventHeaderV4{timestamp=1679840334000, eventType=XID, serverId=1, headerLength=19, dataLength=12, nextPosition=3134, flags=0}, data=XidEventData{xid=1797}}
```

<br/>

## **使用 Canal 组件**

### **Canal介绍**

早期的时候，阿里巴巴公司因为杭州和美国两个地方的机房都部署了数据库实例，但因为跨机房同步数据的业务需求 ，便孕育而生出了Canal，主要是基于`trigger(触发器)`的方式获取增量变更。从 2010 年开始，阿里巴巴公司开始逐步尝试数据库日志解析，获取增量变更的数据进行同步，由此衍生出了增量订阅和消费业务；

当前的 Canal 支持的数据源端Mysql版本包括（ 5.1.x , 5.5.x , 5.6.x , 5.7.x , 8.0.x）

### **Canal的工作原理**

原理如下：

-   Canal 模拟 MySQL slave 的交互协议，伪装自己为 MySQL slave ，向MySQL master 发送dump 协议；
-   MySQL master 收到 dump 请求，开始推送 `binary log` 给 slave （也就是 Canal）；
-   Canal 解析 `binary log` 对象(数据为`byte`流)；

基于这样的原理与方式，便可以完成数据库增量日志的获取解析，提供增量数据订阅和消费，实现mysql实时增量数据传输的功能；

<br/>

### **使用Docker部署Canal**

编写 docker-compose：

```yaml
version: '3.4'

services:
  mysql:
    image: 'mysql:5.7.8'
    restart: always
    environment:
      - MYSQL_ROOT_PASSWORD=123456
    ports:
      - "13306:3306"
    volumes:
      - ./config/mysqld.cnf:/etc/mysql/conf.d/mysqld.cnf

  canal:
    image: 'canal/canal-server:v1.1.6'
    restart: always
    user: root
    depends_on:
      - mysql
    ports:
      - "11111:11111"
```

包括了 MySQL 和 Canal 两个服务；

和前面类似，MySQL 挂载的配置：

mysql/binlog/canal/config/mysqld.cnf

```ini
[mysqld]
log-bin=mysql-bin # 添加这一行就ok
binlog-format=ROW # 选择row模式
server_id=1 # 配置mysql replaction需要定义，不能和canal的slaveId重复

# 配置表名字不区分大小写
lower_case_table_names=1
```

启动容器：

```bash
docker-compose up -d
```

随后进入 canal 容器中修改配置：

```bash
$ docker exec -it canal-canal-1 bash

[root@9981ccc70979 admin]# cd /home/admin/canal-server/conf/example/
[root@9981ccc70979 example]# vi instance.properties
```

主要修改以下几行：

```properties
# 修改为你的 MySQL 地址
canal.instance.master.address=mysql:3306

# username/password
canal.instance.dbUsername=root
canal.instance.dbPassword=123456

# table black regex
# issue: https://github.com/alibaba/canal/issues/4245
canal.instance.filter.black.regex=.*\\.BASE TABLE.*
```

**注意这个：`canal.instance.filter.black.regex` 配置，如果不配置，会报错找不到表：**

```
Caused by: java.io.IOException: ErrorPacket [errorNumber=1146, fieldCount=-1, message=Table 'test.base table' doesn't exist, sqlState=42S02, sqlStateMarker=#]
```

>   **关联 issue：**
>
>   -   https://github.com/alibaba/canal/issues/4245

<br/>

### **代码集成Canal**

添加依赖：

```xml
<dependencies>
  <dependency>
    <groupId>com.alibaba.otter</groupId>
    <artifactId>canal.client</artifactId>
    <version>1.1.6</version>
  </dependency>
  <dependency>
    <groupId>com.alibaba.otter</groupId>
    <artifactId>canal.protocol</artifactId>
    <version>1.1.6</version>
  </dependency>
</dependencies>
```

示例代码：

mysql/binlog/canal/src/main/java/io/github/jasonkayzk/CanalDemo.java

```java
package io.github.jasonkayzk;

import com.alibaba.otter.canal.client.CanalConnector;
import com.alibaba.otter.canal.client.CanalConnectors;
import com.alibaba.otter.canal.protocol.CanalEntry;
import com.alibaba.otter.canal.protocol.Message;
import com.google.protobuf.InvalidProtocolBufferException;

import java.net.InetSocketAddress;
import java.util.List;

public class CanalDemo {
    //Canal服务地址
    private static final String SERVER_ADDRESS = "localhost";

    //Canal Server 服务端口号
    private static final Integer PORT = 11111;

    //目的地，其实Canal Service内部有一个队列,和配置文件中一致即可，参考【修改instance.properties】图中
    private static final String DESTINATION = "example";

    //用户名和密码，但是目前不支持，只能为空
    private static final String USERNAME = "";

    //用户名和密码，但是目前不支持，只能为空
    private static final String PASSWORD = "";

    public static void main(String[] args) {
        CanalConnector canalConnector = CanalConnectors.newSingleConnector(new InetSocketAddress(SERVER_ADDRESS, PORT), DESTINATION, USERNAME, PASSWORD);
        canalConnector.connect();
        //订阅所有消息
        canalConnector.subscribe(".*\\..*");
        //恢复到之前同步的那个位置
        canalConnector.rollback();

        for (; ; ) {
            //获取指定数量的数据，但是不做确认标记，下一次取还会取到这些信息
            Message message = canalConnector.getWithoutAck(100);
            //获取消息id
            long batchId = message.getId();
            if (batchId != -1) {
                System.out.println("msgId -> " + batchId);
                printEnity(message.getEntries());
                //提交确认
                //canalConnector.ack(batchId);
                //处理失败，回滚数据
                //canalConnector.rollback(batchId);
            }
        }
    }

    private static void printEnity(List<CanalEntry.Entry> entries) {
        for (CanalEntry.Entry entry : entries) {
            if (entry.getEntryType() != CanalEntry.EntryType.ROWDATA) {
                continue;
            }
            try {
                CanalEntry.RowChange rowChange = CanalEntry.RowChange.parseFrom(entry.getStoreValue());
                for (CanalEntry.RowData rowData : rowChange.getRowDatasList()) {
                    System.out.println(rowChange.getEventType());
                    switch (rowChange.getEventType()) {
                        //如果希望监听多种事件，可以手动增加case
                        case INSERT:
                            String tableName = entry.getHeader().getTableName();
                            //测试users表进行映射处
                            List<CanalEntry.Column> afterColumnsList = rowData.getAfterColumnsList();
                            System.out.println(afterColumnsList);
                            break;
                        case UPDATE:
                            List<CanalEntry.Column> afterColumnsList2 = rowData.getAfterColumnsList();
                            System.out.println("新插入的数据是：" + afterColumnsList2);
                            break;
                        case DELETE:
                            List<CanalEntry.Column> beforeColumnsList = rowData.getBeforeColumnsList();
                            System.out.println("被删除的数据是：" + beforeColumnsList);
                            break;
                        default:
                    }
                }
            } catch (InvalidProtocolBufferException e) {
                e.printStackTrace();
            }
        }
    }
}
```

启动服务后，执行 SQL 测试，输出日志：

```
msgId -> 3
INSERT
[index: 0
sqlType: 4
name: "id"
isKey: true
updated: true
isNull: false
value: "1"
mysqlType: "int(10) unsigned"
, index: 1
sqlType: 12
name: "username"
isKey: false
updated: true
isNull: false
value: "a"
mysqlType: "varchar(255)"
, index: 2
sqlType: 12
name: "password"
isKey: false
updated: true
isNull: false
value: "1"
mysqlType: "varchar(255)"
]
......
```

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/java-all/tree/main/mysql/binlog

参考文章：

-   https://juejin.cn/post/6844903889817321480
-   https://juejin.cn/post/6844903894338764814
-   https://blog.csdn.net/qq_18079589/article/details/120123733
-   https://github.com/alibaba/canal/issues/4245

<br/>
