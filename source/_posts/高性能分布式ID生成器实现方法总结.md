---

title: 高性能分布式ID生成器实现方法总结
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?87'
date: 2021-06-20 21:14:32
categories: Golang
tags: [Golang, 分布式, ID生成器]
description: 在复杂分布式系统中，往往需要对大量的数据和消息进行唯一标识。如在支付、餐饮、酒店等产品的系统中，数据日渐增长，对数据分库分表后需要有一个唯一ID来标识一条数据或消息，数据库的自增ID显然不能满足需求；特别一点的如订单、骑手、优惠券也都需要有唯一ID做标识。此时一个能够生成全局唯一ID的系统是非常必要的；本文介绍了业界常见的几种分布式ID的生成方法；
---

在复杂分布式系统中，往往需要对大量的数据和消息进行唯一标识。如在支付、餐饮、酒店等产品的系统中，数据日渐增长，对数据分库分表后需要有一个唯一ID来标识一条数据或消息，数据库的自增ID显然不能满足需求；特别一点的如订单、骑手、优惠券也都需要有唯一ID做标识。此时一个能够生成全局唯一ID的系统是非常必要的；

本文介绍了业界常见的几种分布式ID的生成方法；

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/distributed-id-generator-mysql

系列文章：

-   [UUID生成算法-UUID还是snowflake](/2020/02/09/UUID生成算法-UUID还是snowflake/)

<br/>

<!--more-->

## **高性能分布式ID生成器实现方法总结**

### **为什么要用分布式 ID**

随着业务数据量的增长，存储在数据库中的数据越来越多，当索引占用的空间超出可用内存大小后，就会通过磁盘索引来查找数据，这样就会极大的降低数据查询速度；

如何解决这样的问题呢？

一般我们首先通过分库分表来解决：<font color="#f00">**分库分表后就无法使用数据库自增 ID 来作为数据的唯一编号，那么就需要使用分布式 ID 来做唯一编号了；**</font>

<br/>

### **业务系统对ID号的要求**

那业务系统对ID号的要求有哪些呢？

-   **全局唯一性**：不能出现重复的ID号，既然是唯一标识，这是最基本的要求；
-   **趋势递增**：在MySQL的InnoDB引擎中使用的是聚集索引，由于多数RDBMS使用B-tree的数据结构来存储索引数据，在主键的选择上面我们应该尽量使用有序的主键保证写入性能；
-   **单调递增**：保证下一个ID一定大于上一个ID，例如事务版本号、IM增量消息、排序等特殊需求；
-   **信息安全**：如果ID是连续的，恶意用户的爬取就非常容易了，直接按照顺序下载指定URL即可；如果是订单号就更危险了，竞对可以直接知道我们一天的单量；因此，在一些应用场景下，会需要ID无规则、不规则；

其中，上述1、2、3分别对应三类不同的场景，3和4需求还是互斥的，无法使用同一个方案满足；

同时除了对ID号码自身的要求，业务还对**ID号生成系统的可用性要求极高：**

想象一下，如果ID生成系统瘫痪，整个支付、优惠券发券、骑手派单等关键动作都无法执行，这就会带来一场灾难；

由此总结，对于一个ID生成系统应该做到如下几点：

-   **平均延迟和TP999延迟都要尽可能低；**
-   **可用性5个9；**
-   **高QPS；**

<br/>

### **分布式 ID 实现方案综述**

目前，关于分布式 ID ，业界主要有以下四种实现方案：

-   **UUID**：例如使用 JDK 的 `UUID#randomUUID() `生成 ID；
-   **Redis或MySQL自增**：Redis可以使用 `Jedis#incr(String key)` 生成 ID，MySQL可以通过表锁等方式；
-   **Snowflake 算法**：以时间戳机器号和毫秒内并发组成的 64 位 Long 型 ID；
-   **Leaf算法**：按照步长从数据库读取一段可用范围的 ID；

>   关于UUID和Snowflack见：
>
>   -   [UUID生成算法-UUID还是snowflake](/2020/02/09/UUID生成算法-UUID还是snowflake/)

我们总结一下这几种方案的特点：

| **方案**  | **顺序性** | **重复性**                                               | **可用性**                                         | **部属方式**       | **可用时间** |
| --------- | ---------- | -------------------------------------------------------- | -------------------------------------------------- | ------------------ | ------------ |
| UUID      | 无序       | 通过多位随机字符达到极低重复概率，但**理论上是会重复的** | 一直可用                                           | JDK 直接调用       | 永久         |
| Redis     | 单调递增   | **RDB 持久化模式下，会出现重复**                         | Redis 宕机后不可用                                 | Jedis 客户调用     | 永久         |
| Sonwflake | 趋势递增   | 不会重复                                                 | **发生时钟回拨并且回拨时间超过等待阈值时不可用**   | 集成部署、集群部署 | 69年         |
| Leaf      | 趋势递增   | 不会重复                                                 | **如果数据库宕机并且获取步长内的 ID 用完后不可用** | 集成部署、集群部署 | 永久         |

其中，前面两种实现方案的用法以及实现大家日常了解较多，就不在此赘述；

下面对于这些算法我们一个一个来看；

<br/>

### **SnowFlake方案**

#### **SnowFlake算法详述**

>   <font color="#f00">**Snowflake 算法可以做到分配好机器号后就可以使用，不依赖任何第三方服务实现本地 ID 生成；**</font>
>
>   <font color="#f00">**而依赖的第三方服务越少可用性越高；**</font>

长整型数字（即 Long 型数字）的十进制范围是 `-2^64 ~ 2^64-1`；

<font color="#f00">**Snowflake 使用的是无符号长整型数字，即从左到右一共 64 位二进制组成，但其第一位是不使用的；**</font>

所以，**在 Snowflake 中使用的是 63bit 的长整型无符号数字，它们由时间戳、机器号、毫秒内并发序列号三个部分组成 ：**

-   **时间戳位**：当前毫秒时间戳与新纪元时间戳的差值；
-   **机器号**：10 位 2 进制转为十进制是 2^10，即 1024，也就是说最多可以支持有 1024 个机器节点；
-   **毫秒内并发序列号**：12 位 2 进制转为十进制是 2^12，即 4096，也就是说一毫秒内在一个机器节点上并发的获取 ID，最多可以支持 4096 个并发；

>   **① 关于新纪元时间戳**
>
>   所谓<font color="#f00">**新纪元时间戳就是应用开始使用 Snowflake 的时间；**</font>
>
>   <font color="#f00">**如果不设置新纪元时间，时间戳默认是从1970年开始计算的，设置了新纪元时间可以延长 Snowflake 的可用时间）；**</font>
>
>   **② 关于使用69年**
>
>   <font color="#f00">**这是由于Snowflake 在计算UUID的时，时间戳位需要41位的二进制：**</font>
>
>   >   41 位 2 进制转为十进制是` 2^41`；
>>
>   >   ` 2^41` 除以（365 天 * 24 小时 * 3600 秒 * 1000 毫秒），约等于 69年，所以最多可以使用 69 年；

下面我们来看一下各个分段的使用情况：

| **二进制位** | **[0]**              | **[1,41]**                 | **[42,51]**              | **[52,63]**                                                  |
| ------------ | -------------------- | -------------------------- | ------------------------ | ------------------------------------------------------------ |
| **说明**     | **最高符号位不使用** | 一共41位，是**毫秒时间戳** | 一共10位，是**机器号位** | 一共12位，是**毫秒内并发序列号<br />当前请求的时间戳如果和上一次请求的时间戳相同<br />那么就将毫秒内并发序列号加一** |

>   <font color="#f00">**如果我们对IDC划分有需求，还可以将10-bit分5-bit给IDC，分5-bit给工作机器；**</font>
>
>   这样就可以表示32个IDC，每个IDC下可以有32台机器，可以根据自身需求定义；
>
>   **12个自增序列号可以表示2^12个ID，理论上snowflake方案的QPS约为409.6w/s；**
>
>   这种分配方式**可以保证在任何一个IDC的任何一台机器在任意毫秒内生成的ID都是不同的；**

那么 Snowflake 生成的 ID 长什么样子呢？

下面我们来举几个例子（假设我们的时间戳新纪元是：2020-12-31 00:00:00）：

| 时间                | 机器 | 毫秒并发 | 十进制 Snowflake ID |
| ------------------- | ---- | -------- | ------------------- |
| 2021-01-01 08:33:11 | 1    | 10       | 491031363588106     |
| 2021-01-02 13:11:12 | 2    | 25       | 923887730696217     |
| 2021-01-03 21:22:01 | 3    | 1        | 1409793654796289    |

>   **对于例子①：**
>
>   `491031363588106` =
>
>    `0_00000000000000110111110100101110010011000_0000000001_000000001010`
>
>   -   **0： 0，不使用；**
>   -   **1~41：`00000000000000110111110100101110010011000` = `117071000`，表示自`2020-12-31 00:00:00`起过了`117071000`毫秒；**
>   -   **42~51：`0000000001`，表示：一号机器；**
>   -   **51~63：000000001010：表示一毫秒内有10个请求；**
>
>   其他例子类似；

<br/>

#### **ID 缓冲环**

为了提高 **SnowflakeID** 的并发性能和可用性，可以使用 ID 缓冲环（即 ID Buffer Ring）提高并发性；通过使用缓冲环能够充分利用毫秒时间戳，提高可用性提，缓解由时钟回拨导致的服务不可用；

<font color="#f00">**缓冲环是通过定长数组加游标哈希实现的，相比于链表而言，不需要频繁的内存分配；**</font>

下面是ID缓冲环的说明：

-   **在 ID 缓冲环初始化的时候会请求 ID 生成器将 ID 缓冲环填满，当业务需要获取 ID 时，从缓冲环的头部依次获取 ID；**
-   **当 ID 缓冲环中剩余的 ID 数量少于设定的阈值百分比时：比如剩余 ID 数量少于整个 ID 缓冲环的 30% 时，触发异步 ID 填充加载；异步 ID 填充加载会将新生成的 ID 追加到 ID 缓冲环的队列末尾，然后按照哈希算法映射到 ID 缓冲环上；**
-   **另外有一个单独的定时器异步线程来定时填充 ID 缓冲环；**

下面的动画展示了 ID 缓冲环的三个阶段：ID 初始化加载、ID 消费、ID 消费后填充：

![](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/distributed_id_11.gif)

具体流程：

-   **ID缓冲环初始化加载**：从 ID generator 获取到 ID 填充到 ID 缓冲环，直到 ID 缓冲环被填满；
-   **ID缓冲环消费**：业务应用从 ID 缓冲环获取 ID；
-   **异步加载填充 ID 缓冲环**：定时器线程负责异步的从 ID generator 获取 ID 添加到 ID 缓冲队列，同时按照哈希算法映射到 ID 缓冲环上，当 ID 缓冲环被填满时，异步加载填充结束；

实际业务整体流程：

-   客户端业务请求到应用服务器，应用服务器从 ID 缓冲环获取 ID：
    -   如果 ID 缓冲环内空了那么抛出服务不可用；
    -   如果 ID 缓冲环内存有 ID 那么就消费一个 ID ；
-   同时，在消费 ID 缓冲环中的 ID 时，如果发现 ID 缓冲环中存留的 ID 数量少于整个 ID 缓冲环容量的 30% 时触发异步加载填充 ID 缓冲环；

![](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/distributed_id_12.png)

<br/>

#### **Snowflake 集成分布式部署方式**

Snowflake **通常可以使用三种不同的部署方式来部署：**

-   <font color="#f00">**集成分布式部署方式；**</font>
-   <font color="#f00">**中心集群式部署方式；**</font>
-   <font color="#f00">**直连集群式部署方式；**</font>

下面我们来分别介绍一下这几种部署方式；

>   <font color="#f00">**当使用 ID 的应用节点比较少时，比如 200 个节点以内，适合使用集成分布式部署方式；**</font>

<font color="#f00">**每个应用节点在启动的时候决定了机器号后，运行时不依赖任何第三方服务，在本地使用时间戳、机器号、以及毫秒内并发序列号生成 ID；**</font>

下图展示的是应用服务器通过引入 jar 包的方式实现获取分布式 ID 的过程：

![](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/distributed_id_1.jpg)

每一个使用分布式 ID 的应用服务器节点都会分配一个拓扑网络内唯一的机器号，这个机器号的管理存放在 MySQL 或者 ZooKeeper 上；

>   <font color="#f00">**当拓扑网络内使用分布式 ID 的机器节点很多，例如超过 1000 个机器节点时，使用集成部署的分布式 ID 就不合适了，因为机器号位一共是 10 位，即最多支持 1024 个机器号；**</font>
>
>   <font color="#f00">**因此，当机器节点超过 1000 个机器节点时，可以使用下面要介绍的中心集群式部署方式；**</font>

<br/>

##### **Snowflake 中心集群式部署方式**

<font color="#f00">**中心集群式部署需要新增用来做请求转发的 ID 网关，比如：使用 nginx 反向代理（即下图中的 ID REST API Gateway）；**</font>

如下图所示：

![](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/distributed_id_2.png)

>   <font color="#f00">**机器号的分配只是分配给下图中的 ID Generator node 节点，应用节点是不需要分配机器号的；**</font>

<font color="#f00">**使用 ID 网关组网后，应用服务器通过 HTTP 或 RPC 请求 ID 网关获取分布式 ID**</font>，这样相比于上面的集成分布式部署方式，就可以支撑更多的应用节点使用分布式 ID 了；

>   **使用中心集群式部署方式需要引入新的 nginx 反向代理做网关，增加了系统的复杂性，降低了服务的可用性；**

我们下面再介绍一种不需要引入 nginx 又可以支持超过 1000 个应用节点的直连集群部署方式；

<br/>

##### **Snowflake 直连集群式部署方式**

相比于中心集群部署方式，**直连集群部署方式可以去掉中间的 ID 网关，提高服务的可用性；**

在使用 ID 网关的时候，我们**需要把 ID generator node 的服务地址配置在 ID 网关中（如Nginx）；**

而在使用直连集群式部署方式时，ID generator node 的服务地址可以配置在应用服务器本地配置文件中，或者配置在配置中心；

![](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/distributed_id_3.png)

应用服务器获取到服务地址列表后，需要实现服务直连 ID生成器来获取 ID；

<br/>

#### **Snowflake 算法评价**

Snowflake 算法的优缺点是：

优点：

-   **毫秒数在高位，自增序列在低位，整个ID都是趋势递增的；**
-   **不依赖数据库等第三方系统，以服务的方式部署，稳定性更高，生成ID的性能也是非常高；**
-   **可以根据自身业务特性分配bit位，非常灵活；**

缺点：

-   强依赖机器时钟，如果机器上时钟回拨，会导致发号重复或者服务会处于不可用状态；

<font color="#f00">**由于Snowflake 算法是强依赖时间戳的算法，因此一旦发生时钟回拨就会产生 ID 重复的问题；**</font>

那么时钟回拨是怎么产生的，我们又需要怎么去解决这个问题呢？

**例如：NTP（Network Time Protocol）服务自动校准可能导致时钟回拨；**

>   我们身边的每一台计算机都有自己本地的时钟，这个时钟是根据 CPU 的晶振脉冲计算得来的；
>
>   然而随着运行时间的推移，这个时间和世界时间的偏差会越来越大；
>
>   那么 NTP 就是用来做时钟校准的服务；

一般情况下发生时钟回拨的概率也非常小，因为：

<font color="#f00">**一旦出现本地时间相对于世界时间需要校准，但时钟偏差值小于 STEP 阈值（默认128毫秒）时，计算机会选择以 SLEW 的方式进行同步，即以 0.5 毫秒/秒的速度差调整时钟速度，保证本地时钟是一直连续向前的，不产生时钟回拨，直到本地时钟和世界时钟对齐；**</font>

然而如果本地时钟和世界时钟相差大于 STEP 阈值时，就会发生时钟回拨！

这个 STEP 阈值是可以修改的，但是修改的越大，在 SLEW 校准的时候需要花费的校准时间就越长，例如 STEP 阈值设置为 10 分钟，即本地时钟与世界时钟偏差在 10 分钟以内时都会以 SLEW 的方式进行校准，这样最多会需要 14 天才会完成校准！

<font color="#f00">**为了避免时钟回拨导致重复 ID 的问题，可以使用 128 毫秒的 STEP 阈值，同时在获取 SnowflakeID 的时候与上一次的时间戳相比，判断时钟回拨是否在 1 秒钟以内，如果在 1 秒钟以内，那么等待 1 秒钟，否则服务不可用，这样可以解决时钟回拨 1 秒钟的问题**</font>

>   **Snowflake 算法应用举例：MongoDB ObjectID**
>
>   [MongoDB官方文档-ObjectID](https://docs.mongodb.com/manual/reference/method/ObjectId/#description)可以算作是和snowflake类似方法：
>
>   通过`时间+机器码+pid+inc`共12个字节，通过4+3+2+3的方式最终标识成一个24长度的十六进制字符；

<br/>

### **UUID**

UUID(Universally Unique Identifier)的**标准型式包含32个16进制数字，以连字号分为五段，形式为8-4-4-4-12的36个字符；**

示例：`550e8400-e29b-41d4-a716-446655440000`；

>   到目前为止业界一共有5种方式生成UUID，详情见IETF发布的UUID规范：
>
>   -   [A Universally Unique IDentifier (UUID) URN Namespace](http://www.ietf.org/rfc/rfc4122.txt)。

优点：

-   性能非常高：本地生成，没有网络消耗；

缺点：

-   不易于存储：UUID太长，16字节128位，通常以36长度的字符串表示，很多场景不适用；
-   信息不安全：基于MAC地址生成UUID的算法可能会造成MAC地址泄露（这个漏洞曾被用于寻找梅丽莎病毒制作者的位置！）；
-   ID作为主键时在特定的环境会存在一些问题，比如做DB主键的场景下，UUID就非常不适用：

其他说明：

<font color="#f00">**① MySQL官方有明确的建议主键要尽量越短越好，36个字符长度的UUID不符合要求；**</font>

    All indexes other than the clustered index are known as secondary indexes. In InnoDB, each record in a secondary index contains the primary key columns for the row, as well as the columns specified for the secondary index. InnoDB uses this primary key value to search for the row in the clustered index.*** If the primary key is long, the secondary indexes use more space, so it is advantageous to have a short primary key***.

<font color="#f00">**② 对MySQL索引不利：如果作为数据库主键，在InnoDB引擎下，UUID的无序性可能会引起数据位置频繁变动，严重影响性能；**</font>

<br/>

### **数据库生成**

数据库生成可以采用Redis、MySQL等数据库生成ID；

以MySQL举例，利用给字段设置`auto_increment_increment`和`auto_increment_offset`来保证ID自增，每次业务使用下列SQL读写MySQL得到ID号；

```mysql
begin;
REPLACE INTO Tickets64 (stub) VALUES ('a');
SELECT LAST_INSERT_ID();
commit;
```

这种方案的优缺点如下：

优点：

-   非常简单，利用现有数据库系统的功能实现，成本小，可以由专业DBA维护；
-   ID号单调自增，可以实现一些对ID有特殊要求的业务；

缺点：

-   强依赖DB，当DB异常时整个系统不可用，属于致命问题；配置主从复制可以尽可能的增加可用性，但是数据一致性在特殊情况下难以保证；同时，主从切换时的不一致可能会导致重复发号；
-   ID发号性能瓶颈限制在单台MySQL的读写性能；

对于MySQL的性能问题，可用如下方案解决：

**在分布式系统中我们可以多部署几台机器，每台机器设置不同的初始值，且步长和机器数相等；**

比如有两台机器，设置步长step为2，TicketServer1的初始值为1（1，3，5，7，9，11…）、TicketServer2的初始值为2（2，4，6，8，10…）；

>   这是Flickr团队在2010年撰文介绍的一种主键生成策略：
>
>   -   [Ticket Servers: Distributed Unique Primary Keys on the Cheap ](http://code.flickr.net/2010/02/08/ticket-servers-distributed-unique-primary-keys-on-the-cheap/)

如下所示，为了实现上述方案分别设置两台机器对应的参数，TicketServer1从1开始发号，TicketServer2从2开始发号，两台机器每次发号之后都递增2：

```sql
TicketServer1:
auto-increment-increment = 2
auto-increment-offset = 1

TicketServer2:
auto-increment-increment = 2
auto-increment-offset = 2
```

假设我们要部署N台机器，则步长需设置为N，并且每台的初始值依次为`0,1,2…,N-1`；

那么整个架构就变成了如下图所示：

![](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/distributed_id_4.png)

这种架构貌似能够满足性能的需求，但有以下几个缺点：

**① 系统水平扩展比较困难；**

比如定义好了步长和机器台数之后，如果要添加机器该怎么做？

假设现在只有一台机器发号是1,2,3,4,5（步长是1），这个时候需要扩容机器一台；可以这样做：

首先，把第二台机器的初始值设置得比第一台超过很多，比如：14（假设在扩容时间之内第一台不可能发到14），同时设置步长为2，那么这台机器下发的号码都是14以后的偶数；

然后，摘掉第一台，把ID值保留为奇数，比如7，然后修改第一台的步长为2，让它符合我们定义的号段标准，对于这个例子来说就是让第一台以后只能产生奇数；

扩容方案看起来复杂吗？貌似还好，但是现在想象一下如果我们线上有100台机器，这个时候要扩容该怎么做？简直是噩梦。所以系统水平扩展方案复杂难以实现；

**② ID没有了单调递增的特性**

ID只能趋势递增，这个缺点对于一般业务需求不是很重要，可以容忍；

**③ 数据库性能**

数据库压力还是很大，每次获取ID都得读写一次数据库，只能靠堆机器来提高性能；

<br/>

### **Leaf方案实现**

>   Leaf 这个名字是来自德国哲学家、数学家莱布尼茨的一句话： 
>
>   There are no two identical leaves in the world > “世界上没有两片相同的树叶”

综合对比上述几种方案，每种方案都不完全符合我们的要求；

因此Leaf分别在上述第一种和第三种方案上做了相应的优化，实现了Leaf-snowflake和Leaf-segment方案；

#### **Leaf-segment数据库方案**

第一种Leaf-segment方案，在使用数据库的方案上，做了如下改变：

-   由于原方案每次获取ID都得读写一次数据库，造成数据库压力大，<font color="#f00">**改为利用proxy server批量获取，并且每次获取一个segment(step决定大小)号段的值；用完之后再去数据库获取新的号段，可以大大的减轻数据库的压力；**</font>
-   <font color="#f00">**各个业务不同的发号需求用app_tag字段来区分，每个app_tag的ID获取相互隔离，互不影响；如果以后有性能需求需要对数据库扩容，不需要上述描述的复杂的扩容操作，只需要对app_tag分库分表就行；**</font>

数据库表设计如下：

schema.sql

```mysql
CREATE TABLE `segments`
(
    `app_tag`     VARCHAR(32) NOT NULL,
    `max_id`      BIGINT      NOT NULL,
    `step`        BIGINT      NOT NULL,
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`app_tag`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8
    COMMENT ='业务ID池';

INSERT INTO segments(`app_tag`, `max_id`, `step`)
VALUES ('test_business', 0, 100000);
```

重要字段说明：

-   app_tag：用来区分业务；
-   max_id表示：该app_tag目前所被分配的ID号段的最大值；
-   step表示：每次分配的号段长度；

原来获取ID每次都需要写数据库，现在只需要把step设置得足够大，比如1000；那么只有当1000个号被消耗完了之后才会去重新读写一次数据库，读写数据库的频率从1减小到了1/step；

大致架构如下图所示：

![](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/distributed_id_5.png)

test_tag在第一台Leaf机器上是 `1~1000` 的号段，当这个号段用完时，会去加载另一个长度为`step=1000`的号段；

假设另外两台号段都没有更新，这个时候第一台机器新加载的号段就应该是3001~4000；

同时数据库对应的app_tag这条数据的max_id会从3000被更新成4000，更新号段的SQL语句如下：

```mysql
Begin
UPDATE table SET max_id=max_id+step WHERE app_tag=xxx
SELECT tag, max_id, step FROM table WHERE app_tag=xxx
Commit
```

这种模式有以下优缺点：

优点：

-   **高性能**：Leaf服务可以很方便的线性扩展，性能完全能够支撑大多数业务场景；
-   **趋势递增**：ID号码是趋势递增的 8 Byte 的64位数字，满足上述数据库存储的主键要求；
-   **容灾性高**：Leaf服务内部有号段缓存，即使DB宕机，短时间内Leaf仍能正常对外提供服务；
-   **方便迁移**：可以自定义max_id的大小，非常方便业务从原有的ID方式上迁移过来；
-   **不依赖时间戳**：ID 生成不依赖时间戳，ID 生成初始值可以从 0 开始逐渐增加；

缺点：

-   **ID号码不够随机，能够泄露发号数量的信息，不太安全；**
-   当服务重启时需要将最大 ID 值增加步长，频繁重启的话就会浪费掉很多分段；
-   TP999数据波动大，当号段使用完之后还是会hang在更新数据库的I/O上，此时数据会出现偶尔的尖刺；
-   **DB宕机会造成整个系统不可用；**

<br/>

##### **双buffer优化**

对于第二个缺点，可以对Leaf-Segment做一些优化，简单的说就是：

上述Leaf算法**取号段的时机是在号段消耗完的时候进行的**，也就意味着号段临界点的ID下发时间取决于下一次从DB取回号段的时间，并且在这期间进来的请求也会因为DB号段没有取回来，导致线程阻塞；

如果请求DB的网络和DB的性能稳定，这种情况对系统的影响是不大的，但是假如取DB的时候网络发生抖动，或者DB发生慢查询就会导致整个系统的响应时间变慢；

为此，我们**希望DB取号段的过程能够做到无阻塞，不需要在DB取号段的时候阻塞请求线程**，即<font color="#f00">**当号段消费到某个点时就异步的把下一个号段加载到内存中。而不需要等到号段用尽的时候才去更新号段**</font>，这样做就可以很大程度上的降低系统的TP999指标；

双buffer优化的主要原理为：<font color="#f00">**设计两个缓存桶：currentBufferBucket 和 nextBufferBucket，每个桶都存放一个步长这么多的 ID，如果当前缓存桶的 ID 用完了，那么就将下一个缓存桶设置为当前缓存桶；**</font>

下面的动画展示了双桶缓存初始化、异步加载预备桶和将预备桶切换成当前桶的全过程：

![](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/distributed_id_10.gif)

-   **初始化当前的缓存桶**：即更新`max = max + step`，然后获取更新后的 max 值；比如：步长是 1000，更新后的 max 值是 1000，那么`桶的高度就是步长即 1000`，`桶 min = max - step + 1 = 1，max = 1000`；
-   **加载新桶**：当前缓存桶的 ID 剩余不足 20% 的时候（其他条件也可以）可以加载下一个缓存桶，即更新 `max = max + step`，然后获取更新后的 max 值，此时更新后的 max 值是 2000，`min = max - step + 1 = 1001， max = 2000`；
-   **切换桶**：如果当前桶的 ID 全部用完了，那么就将下一个 ID 缓存桶设置为当前桶；

具体详细实现如下图所示：

![](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/distributed_id_6.png)

**优化采用双buffer的方式，Leaf服务内部有两个号段缓存区segment：**

-   <font color="#f00">**在当前号段已下发10%时，如果下一个号段未更新，则另启一个更新线程去更新下一个号段；**</font>
-   <font color="#f00">**当前号段全部下发完后，如果下个号段准备好了则切换到下个号段为当前segment接着下发，循环往复；**</font>

在设计上：

-   <font color="#f00">**每个app-tag都有消费速度监控，通常推荐segment长度设置为服务高峰期发号QPS的600倍（10分钟），这样即使DB宕机，Leaf仍能持续发号10-20分钟不受影响；**</font>
-   <font color="#f00">**每次请求来临时都会判断下个号段的状态，从而更新此号段，所以偶尔的网络抖动不会影响下个号段的更新；**</font>

<br/>

##### **Leaf高可用容灾**

对于第三点`DB可用性`问题，目前可以采用一主两从的方式，同时分机房部署，Master和Slave之间采用**半同步方式**同步数据；同时可以使用Atlas数据库中间件(已开源，改名为[DBProxy](http://tech.meituan.com/dbproxy-introduction.html))做主从切换；

当然这种方案在一些情况会退化成异步模式，甚至在**非常极端**情况下仍然会造成数据不一致的情况，但是出现的概率非常小；

如果你的系统要保证100%的数据强一致，可以选择使用`类Paxos算法`实现的强一致MySQL方案，如MySQL中提供的[MySQL Group Replication](https://dev.mysql.com/doc/refman/5.7/en/group-replication.html)；

但是运维成本和精力都会相应的增加，根据实际情况选型即可；

![](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/distributed_id_7.png)

同时Leaf服务可以分IDC部署：服务调用的时候，可以配置负载均衡算法优先调用同机房的Leaf服务；只有在该IDC内Leaf服务不可用的时候才会选择其他机房的Leaf服务；

同时还可以搭配服务治理：提供针对服务的过载保护、一键截流、动态流量分配等对服务的保护措施；

<br/>

#### **Leaf-Snowflake方案**

Leaf-Segment方案可以生成趋势递增的ID，同时**ID号是可计算的**，不适用于订单ID生成场景；

**比如：竞争对手在两天中午12点分别下单，通过订单id号相减就能大致计算出公司一天的订单量，这个是不能忍受的；**

面对这一问题，可以使用 Leaf-Snowflake方案；

**Leaf-Snowflake方案完全沿用Snowflake方案的bit位设计，即：`1+41+10+12`的方式组装ID号；**

对于10bit位的workerID的分配：

-   <font color="#f00">**当服务集群数量较小的情况下，完全可以手动配置；**</font>
-   <font color="#f00">**Leaf服务规模较大，动手配置成本太高；所以可以使用Zookeeper持久顺序节点的特性自动对snowflake节点配置wokerID；**</font>

Leaf-Snowflake是按照下面几个步骤启动的：

1.  启动Leaf-snowflake服务，连接Zookeeper，在leaf_forever父节点下检查自己是否已经注册过（是否有该顺序子节点）；
2.  如果有注册过直接取回自己的workerID（zk顺序节点生成的int类型ID号），启动服务；
3.  如果没有注册过，就在该父节点下面创建一个持久顺序节点，创建成功后取回顺序号当做自己的workerID号，启动服务；

![](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/distributed_id_8.png)

<br/>

##### **弱依赖ZooKeeper**

<font color="#f00">**除了服务每次会去ZK拿数据以外，服务也会在本机文件系统缓存一个workerID文件；**</font>

<font color="#f00">**当ZooKeeper出现问题，恰好机器出现问题需要重启时，能保证服务能够正常启动；**</font>

<font color="#f00">**这样做到了对三方组件的弱依赖，一定程度上提高了SLA；**</font>

<br/>

##### **解决时钟问题**

因为Leaf-Snowflake方案仍然需要依赖时间，因此如果机器的时钟发生了回拨，那么还是会有可能生成重复的ID号；

此时还是需要解决时钟回退的问题；

问题可以通过在ZK中写入自身系统实际来解决，解决方案如下：

![](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/distributed_id_9.png)

参见上图整个启动流程图，服务启动时首先检查自己是否写过ZooKeeper的leaf_forever节点：

1.  若写过，则用自身系统时间与`leaf_forever/${self}`节点记录时间做比较，若小于`leaf_forever/${self}`时间则认为机器时间发生了大步长回拨，服务启动失败并报警；
2.  若未写过，证明是新服务节点，直接创建持久节点`leaf_forever/${self}`并写入自身系统时间，接下来综合对比其余Leaf节点的系统时间来**判断自身系统时间是否准确**，具体做法是：
    -   取`leaf_temporary`下的所有临时节点(所有运行中的Leaf-Snowflake节点)的服务IP：Port，然后通过RPC请求得到所有节点的系统时间，并计算`sum(time)/nodeSize`；
    -   若`abs(自身系统时间-sum(time)/nodeSize ) < 阈值`，认为当前系统时间准确，正常启动服务，同时写临时节点`leaf_temporary/${self}`维持租约；
    -   否则认为本机系统时间发生大步长偏移，启动失败并报警；
3.  每隔一段时间(3s)上报自身系统时间写入`leaf_forever/${self}`；

由于强依赖时钟，对时间的要求比较敏感，因此在**机器工作时NTP同步也会造成秒级别的回退，建议可以直接关闭NTP同步；**

要么在时钟回拨的时候直接不提供服务直接返回ERROR_CODE，等时钟追上即可；

**或者做一层重试，然后上报报警系统，更或者是发现有时钟回拨之后自动摘除本身节点并报警**，如下：

```java
 //发生了回拨，此刻时间小于上次发号时间
 if (timestamp < lastTimestamp) {
     long offset = lastTimestamp - timestamp;
     if (offset <= 5) {
         try {
             //时间偏差大小小于5ms，则等待两倍时间
             wait(offset << 1);//wait
             timestamp = timeGen();
             if (timestamp < lastTimestamp) {
                 //还是小于，抛异常并上报
                 throwClockBackwardsEx(timestamp);
             }    
         } catch (InterruptedException e) {  
             throw  e;
         }
     } else {
         //throw
         throwClockBackwardsEx(timestamp);
     }
 }
 //分配ID
```

<br/>

### **后记**

本文主要介绍了分布式 ID 的实现方案，并详细介绍了 Snowflake 方案和Leaf方案，以及针对这两种方案的优化方案；

我们再简单总结一下这两个方案：

-   在高并发场景下生成大量的分布式 ID，适合使用 Snowflake 算法方案，毫秒内并发序列为2^12=4096，单机 QPS 支持高达 4 百万，但是需要对 ID 生成器的机器号进行管理；
-   使用Leaf方式生成 ID 就可以免去对机器号的管理，但是需要合理的设置步长，如果步长太短满足不了并发需求，如果步长太长又会造成分段的过渡浪费；

>   **扩展：**
>
>   本文主要参考了美团点评的文章：[Leaf——美团点评分布式ID生成系统](https://tech.meituan.com/MT_Leaf.html)
>
>   而Leaf在美团点评公司内部服务包含金融、支付交易、餐饮、外卖、酒店旅游、猫眼电影等众多业务线；
>
>   目前Leaf的性能在4C8G的机器上QPS能压测到近5w/s，TP999 1ms，已经能够满足大部分的业务的需求，每天提供亿数量级的调用量！

<br/>

## **附录**

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/distributed-id-generator-mysql

系列文章：

-   [UUID生成算法-UUID还是snowflake](/2020/02/09/UUID生成算法-UUID还是snowflake/)
-   [高性能分布式ID生成器实现方法总结](/2021/06/20/高性能分布式ID生成器实现方法总结/)
-   [在Go中仅使用MySQL实现高性能分布式ID生成器](/2021/06/20/在Go中仅使用MySQL实现高性能分布式ID生成器/)

文章参考：

-   [浅谈分布式 ID 的实践与应用](https://mp.weixin.qq.com/s/uqfbmr8oJFr8riPNl59crw)
-   [Leaf——美团点评分布式ID生成系统](https://tech.meituan.com/MT_Leaf.html)
-   [go-id-alloc](https://github.com/owenliang/go-id-alloc)

<br/>

