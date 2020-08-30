---
title: Redis面试相关问题
toc: true
date: 2020-02-05 23:28:43
cover: http://api.mtyqx.cn/api/random.php?3
categories: Redis
tags: [Java面试, Redis]
description: 本篇总结了Redis在面试中经常碰到的一些问题, 以及在项目开发中Redis常见的问题
---

本篇总结了Redis在面试中经常碰到的一些问题, 以及在项目开发中Redis常见的问题, 主要包括:

-   Redis功能, 使用场景(缓存, 分布式事务…)
-   Redis操作
-   Redis数据结构
-   Redis设计(前缀, 名称等)
-   Redis的hotkey
-   Redis事务
-   Redis实现分布式锁
-   Redis持久化
-   Redis架构模式(一主一从[Master-Slave], Redis集群[Redis-Cluster], 哨兵模式[Redis-Sentinel])
-   Redis集群(如何保证同步…)
-   缓存算法(LRU等)
-   一致性哈希算法？什么是哈希槽？
-   什么是缓存穿透？如何避免？什么是缓存雪崩？何如避免?
-   ……

<br/>

<!--more-->

### Redis功能, 使用场景

**① 说明**

key—value型数据库，支持:

-   string
-   list
-   set
-   zset
-   hash

对这些数据的**操作都是原子性的，Redis为了保证效率会定期持久化数据**

端口：6379

**默认16个数据库，下标从0开始**

**单线程：redis是单线程+io多路复用：检查文件描述的就绪状态**

**② Redis功能**

-   解决应用服务器的cpu和内存压力
-   减少io的读操作，减轻io的压力
-   关系型数据库的扩展性不强，难以改变表结构

**③ 使用场景**

-   **数据高并发的读写**
-   **海量数据的读写**
-   **对扩展性要求高的数据**

><br/>
>
>**例如:**
>
>-   缓存会话（单点登录）
>-   分布式锁，比如：使用setnx
>-   各种排行榜或计数器
>-   商品列表或用户基础数据列表等
>-   使用list作为消息对列
>-   秒杀，库存扣减等
>
>**各数据结构的应用场景:**
>
>-   **String:** 
>
>    例如: 
>
>    -   可以直接用作计数器
>    -   统计在线人数
>    -   另外**String类型是二进制存储安全的**，所以也可以使用它来存储图片，甚至是视频等
>
>-   **Hash:**
>
>    存放键值对
>
>    -   一般可以用来存某个对象的基本属性信息: 例如，用户信息，商品信息等;
>
>    -   另外，由于hash的大小在小于配置的大小的时候使用的是ziplist结构，比较节约内存，所以针对大量的数据存储可以考虑使用hash来分段存储来达到压缩数据量，节约内存的目的; 例如，对于大批量的商品对应的图片地址名称: 
>
>        比如：商品编码固定是10位，可以选取前7位做为hash的key,后三位作为field，图片地址作为value。这样每个hash表都不超过999个，只要把redis.conf中的hash-max-ziplist-entries改为1024即可
>
>-   **List:**
>
>    列表类型
>
>    -   可以用于实现消息队列;
>    -   也可以使用它提供的range命令，做分页查询功能
>
>-   **Set:**
>
>    集合，整数的有序列表可以直接使用set
>
>    -   可以用作某些去重功能，例如用户名不能重复等
>    -   还可以对集合进行交集，并集操作，来查找某些元素的共同点
>
>-   **ZSet:**
>
>    有序集合
>
>    -   使用范围查找
>    -   排行榜功能
>    -   topN功能

**④ 不适场景**

-   需要事务支持（非关系型数据库）[Redis也支持事务…]
-   结构化查询储存，关系复杂

<br/>

### Redis操作

**Redis提供的命令**

-   redis-benchmark：性能测试工具
-   redis-server：启动redis服务器
-   redis-cli：启动redis客户端，操作入口

**命令**

**① Key操作**

| **命令**                | **说明**                                                     | **备注**                                   |
| ----------------------- | ------------------------------------------------------------ | ------------------------------------------ |
| `keys *`                | 查看当前库所有的键                                           | 不推荐<br /><br />在数据量巨大时会导致卡死 |
| `exists <key>`          | 判断是否存在key                                              |                                            |
| `del <key>`             | 删除某个键                                                   |                                            |
| `expire <key> <second>` | 设置键过期时间 单位是s秒                                     |                                            |
| `ttl <key>`             | 查看还有多少秒过期<br /><br />-1表示永不过期<br /><br />-2表示已经过期 |                                            |
| `move <key> <db>`       | 把键移到另一个库下                                           |                                            |
| `dbsize`                | 查看数据库key的数量                                          |                                            |
| `flushdb`               | 清空当前库                                                   |                                            |
| `flushall`              | 通杀所有库                                                   |                                            |

**② String类型**

String是二进制安全的，可以包含任何数据源，最大512Mb

| **命令**                     | **说明**                                 | **备注** |
| ---------------------------- | ---------------------------------------- | -------- |
| `get <key>`                  | 查看对应的键值                           |          |
| `set <key> <value>`          | 添加键值对                               |          |
| `append <key> <value>`       | 将给定的value追加到原值的末尾            |          |
| `strlen < key >`             | 获取值得长度                             |          |
| `setnx <key> <value>`        | 当key不存在的时候设置key值               |          |
| `incr <key>`                 | 将key中储存的数字加1，如果为空，则值为1  |          |
| `decr <key>`                 | 将key中储存的数字减1，如果为空，则值为-1 |          |
| `incrby/decrby <key> <step>` | 将key中的数字增减step                    |          |

**String批量处理:**

| **命令**                                 | **说明**                           | **备注** |
| ---------------------------------------- | ---------------------------------- | -------- |
| `mset <key1> <value1> <key2> <value2>`   | 同时设置多个键值对                 |          |
| `mget <key1> <key 2>`                    | 同时获得多个值                     |          |
| `msetnx <key1> <value1> <key2> <value2>` | 当给定的key都不存在时设置          |          |
| `getrange <key> <start> <stop>`          | 类似substring                      |          |
| `setrange <key> <start> <stop>`          | 类似substring覆盖原始值            |          |
| `setex <key> <过期时间> <value>`         | 设置键值的同时，给定过期时间       |          |
| `getset <key> <value>`                   | 以旧换新，设置了新的值同时得到旧值 |          |

**② List链表**

-   特点:
    -   **单键多值**
    -   Redis列表是简单的字符串列表，从左或者从右插入
    -   **底层是双向链表，对两端的操作性能很高，通过下标查询性能很低**



| **命令**                                        | **说明**                             | **备注** |
| ----------------------------------------------- | ------------------------------------ | -------- |
| `lpush/rpush <key> <value1> <value2> …`         | 从左或从右插入多个值                 |          |
| `lpop/rpop <key>`                               | 从左边或右边吐出一个值，**值光键亡** |          |
| `rpoplpush <key1> <key2>`                       | 从key1 右边吐出一个值到key2的左边    |          |
| `lrange <key> <index>`                          | 按照索引下标获取元素 从左到右        |          |
| `lindex <key> <index>`                          | 按照索引下标获取元素 从左到右        |          |
| `llen <key>`                                    | 获取列表长度                         |          |
| `linsert <key> before|after <value> <newvalue>` | 在key中value前/后插入newvalue        |          |

**③ Set**

类似list的无序集合，保证列表中不会有重复数据，**底层是一个value为null的hash表**

| **命令**                       | **说明**                                | **备注**    |
| ------------------------------ | --------------------------------------- | ----------- |
| `sadd <key> <value1> <value2>` | 将多个元素加入到key中，重复值忽略       |             |
| `smembers <key>`               | 取出该集合的所有值                      |             |
| `sismember <key> <value>`      | 判断集合key中是否有该value值            | 有就1 没有0 |
| `scard <key>`                  | 返回该集合的元素个数                    |             |
| `srem <key> <value1> <value2>` | 删除集合中的某个元素                    |             |
| `spop <key>`                   | 随机吐出该集合一个值                    |             |
| `srandmember <key> <n>`        | 随机从集合中取出n个值，不会从集合中删除 |             |
| `smove <key1> <key2> <value>`  | 将key1中的value 移动到key2 中           |             |
| `sinter <key1> <key2>`         | 返回两个集合的交集元素                  |             |
| `sunion <key1> <key2>`         | 返回两个集合的并集                      |             |

**④ Hash**

键值对集合，类似map <String, Object>

| **命令**                                           | **说明**                      | **备注** |
| -------------------------------------------------- | ----------------------------- | -------- |
| `hset <key> <filed> <value>`                       | 给key集合中的field键赋值value |          |
| `hget <key1> <field>`                              | 从key1集合field键中取出value  |          |
| `hmset <key1> <field1> <value1> <field2> <value2>` | 批量设置hash的值              |          |
| `hexists <key> <field>`                            | 查看key中的field 是否存在     |          |
| `hkeys <key>`                                      | 列出key中所有的filed          |          |
| `hvals <key>`                                      | 列出该hash集合中所有的value   |          |

**⑤ zset**

与set集合非常相似，**但是每个成员都关联了score，可以用来排序**

| **命令**                                                     | **说明**                                      | **备注** |
| ------------------------------------------------------------ | --------------------------------------------- | -------- |
| `zadd<key><score1><member1><score2><member2>`                | 将一个或多个元素以及score加入zset             |          |
| `zrange<key><start><stop> withscore`                         | 返回下标在区间内的集合，带有score             |          |
| `zrangebylex <key> <min> <max> [limit offset count]`         | 通过字典区间返回有序集合的成员                |          |
| `zrangebyscore <key> <min> <max>[withscore] [limit offset count]` | 返回key中 score介于min和max中的成员，升序排列 |          |
| `zrevrangerbyscore <key> <min> <max> [withscore] [limit offset count]` | 降序                                          |          |
| `zincrby <key> <increment> <member>`                         | 在key集合中的value上增加increment             |          |
| `zrem <key> <member>`                                        | 删除key集合下的指定元素                       |          |
| `zcount <key> <min><member>`                                 | 计算在有序集合中指定区间分数的成员数          |          |
| `zcord <key>`                                                | 获取集合中的元素个数                          |          |
| `zrank <key><member>`                                        | 查询value在key中的排名，从0开始               |          |
| `zlexcount <key> <min> <max>`                                | 计算有序集合中指定字典区间内成员数量          |          |

<br/>

### Redis数据结构

**① 字符串**

redis设计了一种简单动态字符串(SDS[Simple Dynamic String])作为底层实现:

><br/>
>
>**说明: redis是使用C语言开发，但C中并没有字符串类型，只能使用指针或符数组的形式表示一个字符串**

定义SDS对象，此对象中包含三个属性：

-   len: buf中已经占有的长度(表示此字符串的实际长度)
-   free: buf中未使用的缓冲区长度
-   buf[]: 实际保存字符串数据的地方

><br/>
>
>**说明:**
>
>-   **取字符串的长度的时间复杂度为O(1)**
>-   buf[]中依然采用了C语言的以\0结尾, 所以可以直接使用C语言的部分标准C字符串库函数
>
>**空间分配原则:** 
>
><font color="#f00">**当len小于1MB（1024*1024）时增加字符串分配空间大小为原来的2倍，当len大于等于1M时每次分配 额外多分配1M的空间**</font>

由此可以得出以下特性：

-   Redis为字符分配空间的次数是小于等于字符串的长度N，而原C语言中的分配原则必为N, 降低了分配次数提高了追加速度，代价就是多占用一些内存空间，且这些空间不会自动释放
-   **二进制安全**
-   **高效的计算字符串长度(时间复杂度为O(1))**
-   **高效的追加字符串操作**

><br/>
>
>**补充: 二进制安全**
>
><font color="#f00">**一个二进制安全函数，其本质上将操作输入作为原始的、无任何特殊格式意义的数据流。对于每个字符都公平对待，不特殊处理某一个字符**</font>
>
>大多数的函数当其使用任何特别的或标记字符，如转义码，那些期望 null 结尾的字符串（如C语言中的字符串），不是二进制安全的。一个可能的例外是该函数的明确的目的是在某二进制字符串搜索某特定字符
>
>而在处理未知格式的数据（尽管此格式无需保存），例如随意的文件、加密数据及类似情况时，二进制安全功能是必须的。函数必须知道数据长度，以便函数操作整体数据
>
>**例如:**
>
>C语言中的字符串是根据特殊字符`\0`来判断该字符串是否结束，对于字符串str="0123456789\0123456789”来说，在C语言里面str的长度就是10（strlen(str)=10），所以strlen()函数不是二进制安全的
>
>而在Redis中，strlen str的结果是21，是二进制安全的（Redis底层所使用的字符串表示是SDS），它只关心二进制化的字符串，不关心字符串的具体格式，里面有啥字符，只会严格的按照二进制的数据存取，不会以某种特殊格式解析字符串

**② 列表(List)**

一个列表结构可以有序地存储多个字符串，拥有例如：lpush lpop rpush rpop等等操作命令

在3.2版本之前，列表是**使用`ziplist`和`linkedlist`实现的**，在这些老版本中，当列表对象同时满足以下两个条件时，列表对象使用ziplist编码：

-   列表对象保存的所有字符串元素的长度都小于64字节
-   列表对象保存的元素数量小于512个

当有任一条件不满足时将会进行一次转码，使用linkedlist

而在3.2版本之后，重新**引入了一个`quicklist`的数据结构，列表的底层都是由quicklist实现的，它结合了ziplist和linkedlist的优点**

按照原文的解释这种数据结构是`A doubly linked list of ziplists`, 即一个由ziplist组成的双向链表

**ziplist的结构**

由表头和N个entry节点和压缩列表尾部标识符zlend组成的一个连续的内存块, 然后通过一系列的编码规则，提高内存的利用率，主要用于存储整数和比较短的字符串

可以看出在插入和删除元素的时候，都需要对内存进行一次扩展或缩减，还要进行部分数据的移动操作，这样会造成更新效率低下的情况

这篇文章对ziplist的结构讲的还是比较详细的：

https://blog.csdn.net/yellowriver007/article/details/79021049

****

**linkedlist的结构**

为一个双向链表，和普通的链表定义相同，每个entry包含向前向后的指针，当插入或删除元素的时候，只需要对此元素前后指针操作即可, 所以插入和删除效率很高, 但查询的效率却是O(n)[n为元素的个数]

****

我们再来看看上面说的ziplist组成的双向链表是什么？

实际上，它整体宏观上就是一个链表结构，只不过**每个节点都是以压缩列表ziplist的结构保存着数据，而每个ziplist又可以包含多个entry**, 也可以说一个quicklist节点保存的是一片数据，而不是一个数据

**总结：**

-   整体上quicklist就是一个双向链表结构，和普通的链表操作一样，插入删除效率很高，但查询的效率却是O(n), 不过，这样的链表访问两端的元素的时间复杂度却是O(1), 所以，对list的操作多数都是poll和push
-   每个quicklist节点就是一个ziplist，具备压缩列表的特性

在redis.conf配置文件中，有两个参数可以优化列表：

-   list-max-ziplist-size: 表示每个quicklistNode的字节大小, 默认为-2 表示8KB
-   list-compress-depth: 表示quicklistNode节点是否要压缩, 默认是0 表示不压缩

**③ 哈希(hash)**

Redis的散列可以存储多个k-v对之间的映射，散列存储的值既可以是字符串又可以是数字值，并且用户同样可以对散列存储的数字值执行自增操作或者自减操作

散列可以看作是一个文档或关系数据库里的一行, Hash底层的数据结构实现有两种:

-   一种是ziplist，上面已经提到过;
-   另一种就是HashTable, 这种结构的时间复杂度为O(1)，但是会消耗比较多的内存空间;

当存储的数据超过配置的阀值时转用HashTable的结构: 这种转换比较消耗性能，所以应该尽量避免这种转换操作。同时满足以下两个条件时才会使用这种结构:

-   **当键的个数小于hash-max-ziplist-entries（默认512）**
-   **当所有值都小于hash-max-ziplist-value（默认64）**

****

**④ 集合(Set)**

Redis的集合和列表都可以存储多个字符串，它们之间的不同在于: **列表可以存储多个相同的字符串，而集合则通过使用散列表（HashTable）来保证自已存储的每个字符串都是各不相同的(这些散列表只有键，但没有与键相关联的值)，redis中的集合是无序的**

还存在另一种集合，那就是IntSet，它是用于存储整数的有序集合，里面存放同一类型的整数, 共有三种整数:

-   int16_t
-   int32_t
-   int64_t

查找的时间复杂度为O(logN)，但是插入的时候，有可能会涉及到升级（比如：原来是int16_t的集合，当插入int32_t的整数的时候就会为每个元素升级为int32_t）**这时候会对内存重新分配，所以此时的时间复杂度就是O(N)级别的了**

**注意：intset只支持升级不支持降级操作**

IntSet在redis.conf中也有一个配置参数:

-   set-max-intset-entries: 默认值为512, 表示如果entry的个数小于此值，则可以编码成REDIS_ENCODING_INTSET类型存储，节约内存, 否则采用dict的形式存储

****

**⑤ 有序集合(zset)**

有序集合和散列一样，都用于存储键值对：**有序集合的键被称为成员（member), 每个成员都是各不相同的**

有序集合的值则被称为**分值（score），分值必须为浮点数**

有序集合是redis里面唯一一个**既可以根据成员访问元素(这一点和散列一样),又可以根据分值以及分值的排列顺序访问元素的结构**

它的存储方式也有两种:

**ziplist结构**

与上面的hash中的ziplist类似，member和score**顺序存放并按score的顺序排列**

**skiplist与dict的结合**

skiplist是一种跳跃表结构，用于有序集合中快速查找，大多数情况下它的效率与平衡树差不多，但比平衡树实现简单

redis对普通的跳跃表进行了修改，包括添加span\tail\backward指针、score的值可重复这些设计，从而实现排序功能和反向遍历的功能

><br/>
>
>**一般跳跃表**
>
>**① 实现**
>
>主要包含以下几个部分：
>
>-   **表头（head）：**指向头节点
>-   **表尾（tail）：**指向尾节点
>-   **节点（node）：**实际保存的元素节点，每个节点可以有多层，层数是在创建此节点的时候随机生成的一个数值，而且每一层都是一个指向后面某个节点的指针
>-   **层（level）：**目前表内节点的最大层数
>-   **长度（length）：**节点的数量
>
>**② 遍历**
>
>跳跃表的遍历总是从高层开始，然后随着元素值范围的缩小，慢慢降低到低层
>
><br/>
>
>跳跃表的实现原理可以参考：https://blog.csdn.net/Acceptedxukai/article/details/17333673

前面也说了，有序列表是使用skiplist和dict结合实现的:

-   skiplist用来保障有序性和访问查找性能
-   dict就用来存储元素信息，并且dict的访问时间复杂度为O(1)

<br/>

### Redis的3个高级数据结构

除了String，Hash，List，Set，ZSet，Redis还有3个高级数据结构:

-   Bitmaps
-   Hyperloglogs
-   GEO

**① BitMaps**

<font color="#f00">**bitmaps不是一个真实的数据结构, 而是String类型上的一组面向bit操作的集合**</font>

由于string是二进制安全的blob，并且它们的最大长度是512Mb，所以bitmaps能最大设置2^32个不同的bit

bit操作被分为两组:

-   恒定的单个bit操作，例如把某个bit设置为0或者1, 或者获取某bit的值
-   对一组bit的操作。例如给定范围内bit统计（例如人口统计）

Bitmaps的最大优点就是存储信息时可以节省大量的空间, 例如:

在一个系统中，不同的用户被一个增长的用户ID表示, 40亿（2^32=4 * 1024 *1024 * 1024 ≈ 40亿）用户只需要512M内存就能记住某种信息，例如用户是否登录过

Bits设置和获取通过SETBIT 和GETBIT 命令，用法如下:

```mysql
SETBIT key offset value
GETBIT key offset
```

使用实例：

```mysql
127.0.0.1:6380> setbit dupcheck 10 1
(integer) 0
127.0.0.1:6380> getbit dupcheck 10 
(integer) 1
```

-   SETBIT命令: 第一个参数是位编号，第二个参数是这个位的值，只能是0或者1, 如果bit地址超过当前string长度，会自动增大string

><br/>
>
>**补充: Bitmaps示意图**
>
>初始化一个BitMaps, 长度为6
>
>| **bit**   | 0    | 1    | 2    | 3    | 4    | 5    |
>| --------- | ---- | ---- | ---- | ---- | ---- | ---- |
>| **value** | 0    | 0    | 0    | 0    | 0    | 0    |
>
>对offset为2和4的位置设置为1
>
>| **bit**   | 0    | 1    | 2    | 3    | 4    | 5    |
>| --------- | ---- | ---- | ---- | ---- | ---- | ---- |
>| **value** | 0    | 0    | 1    | 0    | 1    | 0    |
>
>对offset为10的位置设为1**(需要扩容[自动])**
>
>| **bit**   | 0    | 1    | 2    | 3    | 4    | 5    | 6    | 7    | 8    | 9    | 10   |
>| --------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
>| **value** | 0    | 0    | 1    | 0    | 1    | 0    | 0    | 0    | 0    | 0    | 1    |

-   GETBIT命令: 指示返回指定位置bit的值, **超过范围（寻址地址在目标key的string长度以外的位）的GETBIT总是返回0**

<br/>

三个操作bits组的命令如下:

-   **BITOP:** 执行两个不同string的位操作，包括AND，OR，XOR和NOT
-   **BITCOUNT:** 统计位的值为1的数量
-   **BITPOS:** 寻址第一个为0或者1的bit的位置
    -   寻址第一个为1的bit的位置：bitpos dupcheck 1
    -   寻址第一个为0的bit的位置：bitpos dupcheck 0

<br/>

bitmaps一般的使用场景：

-   各种实时分析
-   存储与对象ID关联的节省空间并且高性能的布尔信息

><br/>
>
>**使用场景举例:**
>
>例如，想象一下你想知道访问你的网站的用户的最长连续时间
>
>你开始计算从0开始的天数，就是你的网站公开的那天，每次用户访问网站时通过SETBIT命令设置bit为1，可以简单的用当前时间减去初始时间并除以3600*24（结果就是你的网站公开的第几天）当做这个bit的位置
>
>这种方法对于每个用户，都有存储每天的访问信息的一个很小的string字符串, 通过BITCOUN就能轻易统计某个用户连续访问网站的天数
>
>另外通过调用BITPOS命令，或者客户端获取并分析这个bitmap，就能计算出最长停留时间
>
>**比如Github上面每次提交就出现一个contributions的统计小方块(不确定是否使用Redis实现, 但是可以使用)**

****

**② HyperLogLogs**

HyperLogLog是**用于计算唯一事物的概率数据结构（被称为估计集合的基数）**

如果统计唯一项，项目越多，需要的内存就越多, 因为需要记住过去已经看过的项，从而避免多次统计这些项; 然而，有一组算法可以交换内存以获得精确度：在redis的实现中，可以使用标准错误小于1％的估计度量结束

这个算法的神奇在于: **不再需要与需要统计的项相对应的内存，取而代之，使用的内存一直恒定不变**, 最坏的情况下只需要12k，就可以计算接近2^64个不同元素的基数; 如果HyperLogLog（简称为HLL）已经看到的元素非常少，则需要的内存要要少得多

在redis中HLL是一个不同的数据结构，它被**编码成Redis字符串**, 因此可以通过调用GET命令序列化一个HLL，也可以通过调用SET命令将其反序列化到redis服务器

HLL的API类似使用SET数据结构做相同的任务，通过SADD命令把每一个观察的元素添加到一个SET集合，用SCARD命令检查SET集合中元素的数量，集合里的元素都是唯一的，已经存在的元素不会被重复添加

而使用HLL时并不是真正添加项到HLL中（这一点和SET结构差异很大），因为HLL的数据结构只包含一个不包含实际元素的状态，API是一样的：

-   PFADD: 用于添加一个新元素到统计中
-   PFCOUNT: 用于获取到目前为止通过PFADD命令添加的**唯一元素个数近似值**
-   PFMERGE: 执行**多个HLL之间的联合操作**

```mysql
127.0.0.1:6380> PFADD hll a b c d d c
(integer) 1
127.0.0.1:6380> PFCOUNT hll
(integer) 4
127.0.0.1:6380> PFADD hll e
(integer) 1
127.0.0.1:6380> PFCOUNT hll
(integer) 5
```

><br/>
>
>**补充: PFMERGE命令说明**
>
>`PFMERGE destkey sourcekey [sourcekey ...]`: 将N个不同的HyperLogLogs合并为一个
>
>用法（把hll1和hll2合并到hlls中）：
>
>```mysql
>127.0.0.1:6380> PFADD hll1 1 2 3
>(integer) 1
>127.0.0.1:6380> PFADD hll2 3 4 5
>(integer) 1
>127.0.0.1:6380> PFMERGE hlls hll1 hll2
>OK
>127.0.0.1:6380> PFCOUNT hlls
>```
>

HLL数据结构的一个使用场景就是:

计算用户每天在搜索框中执行的唯一查询，即**搜索页面UV统计**

**而Bitmaps则用于判断某个用户是否访问过搜索页面, 这是它们用法的不同**

****

**③ GEO**

Redis的GEO特性在 Redis3.2版本中推出，这个功能可以将**用户给定的地理位置（经度和纬度）信息储存起来，并对这些信息进行操作**

GEO相关命令只有6个:

-   **GEOADD：**GEOADD key longitude latitude member [longitude latitude member …]

    将指定的地理空间位置（纬度、经度、名称）添加到指定的key中

    例如：GEOADD city 113.501389 22.405556 shenzhen；

    ><br/>
    >
    >**注意: 取值范围**
    >
    >经纬度具体的限制，由EPSG:900913/EPSG:3785/OSGEO:41001规定如下：
    >
    >-   有效的经度从-180度到180度
    >-   有效的纬度从-85.05112878度到85.05112878度
    >
    >当坐标位置超出上述指定范围时，该命令将会返回一个错误

-   **GEOHASH：**GEOHASH key member [member …]

    返回一个或多个位置元素的标准Geohash值，它可以在http://geohash.org/使用

    例子：http://geohash.org/sqdtr74hyu0

    可以通过谷歌了解Geohash原理，或者Geohash基本原理：https://www.cnblogs.com/tgzhu/p/6204173.html
    
-   **GEOPOS：**GEOPOS key member [member …]

    从key里返回所有给定位置元素的位置（经度和纬度）

-   **GEODIST：**GEODIST key member1 member2 [unit]

    返回两个给定位置之间的距离

    GEODIST命令在计算距离时会**假设地球为完美的球形**。在极限情况下，这一假设最大会造成0.5%的误差

    指定单位的参数unit必须是以下单位的其中一个：

    -   m 表示单位为米（默认）
    -   km 表示单位为千米
    -   mi 表示单位为英里
    -   ft 表示单位为英尺

-   **GEORADIUS：**GEORADIUS key longitude latitude radius m|km|ft|mi [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count]

    以给定的经纬度为中心， 返回键包含的位置元素当中， 与中心的距离不超过给定最大距离的所有位置元素

    这个命令可以查询某城市的周边城市群

-   **GEORADIUSBYMEMBER：**GEORADIUSBYMEMBER key member radius m|km|ft|mi [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count]

    这个命令和GEORADIUS命令一样，都可以找出位于指定范围内的元素，但是GEORADIUSBYMEMBER的中心点是由给定的位置元素决定的，而不是像 GEORADIUS那样，使用输入的经度和纬度来决定中心点

    指定成员的位置被用作查询的中心

<br/>

GEO的6个命令用法示例如下：

```mysql
redis> GEOADD Sicily 13.361389 38.115556 "Palermo" 15.087269 37.502669 "Catania"
(integer) 2
 
redis> GEOHASH Sicily Palermo Catania
1) "sqc8b49rny0"
2) "sqdtr74hyu0"
 
redis> GEOPOS Sicily Palermo Catania NonExisting
1) 1) "13.361389338970184"
   2) "38.115556395496299"
2) 1) "15.087267458438873"
   2) "37.50266842333162"
3) (nil)
 
redis> GEODIST Sicily Palermo Catania
"166274.15156960039"
 
redis> GEORADIUS Sicily 15 37 100 km
1) "Catania"
redis> GEORADIUS Sicily 15 37 200 km
1) "Palermo"
2) "Catania"
 
redis> GEORADIUSBYMEMBER Sicily Agrigento 100 km
1) "Agrigento"
2) "Palermo"
```
<br/>

### Redis设计

见: [阿里云Redis开发规范](https://jasonkayzk.github.io/2019/12/30/阿里云Redis开发规范/)

<br/>

### Redis的hotkey

当使用redis集群来作为缓存的时候，如果在业务上碰到大促，或者正好有一个非常热的帖子的时候，对应的缓存会被频繁访问

而这个缓存会落在redis集群的同一台集群上，导致数据频繁的访问同一台机器，造成集群性能的不均衡, 这个就是所谓的hot key的问题

**解决方案**

如果要频繁的访问同一个key，但是又不想让这个key一直落到同一台机器上，我们就需要在其他机器上复制这个key的备份，让请求进来的时候，会去随机的到各台机器上访问缓存, 所以剩下的问题就是如何做到让请求平均的分布到各台机器上; 简单的，假设有N台机器，当请求到来的时候，我们随机从1到N之间随机选择一台机器进行访问

如何选择呢？因为redis集群中其实是根据key来做对应的，所以我们可以产生一个随机值作为key的后缀，由key变成key_suffix

同时，为了防止有相同的后缀在做了映射之后仍旧会集中在某些机器上，一般需要把随机值的上限放大，比如取集群数量N的2倍

因此有了最简单的版本：

```java
int M = N * 2 // N为随机数上限
Random random = new Random(0, M) // 随机 0 ~ 2*N
String bakHotKey = hotKey + “_” + random // 增加映射后缀为随机数
// 缓存中获取(由于是随机访问, 不一定可以命中, 但是基本保证了集群中都能缓存数据)
data = redis.GET(bakHotKey) 
if (data == NULL) { // 缓存未命中, 数据库获取
    data = GetFromDB()
    redis.SET(bakHotKey, expireTime)
}
```

**解决过期带来的滚雪球效应**

既然是hot key，短时间内必然有大量的访问请求， 上边的代码设置了redis集群中的各台机器都有相同的过期时间,  **如果redis集群中的缓存集中过期，必然都会把压力转移到DB上**

为了防止这种雪崩效应，需要将各台机器的过期时间都尽量设置的不一样。所以可以在过期时间上再加上一个随机值，有了第二个版本

```java
int M = N * 2 // N为随机数上限
Random random = new Random(0, M) // 随机 0 ~ 2*N
String bakHotKey = hotKey + “_” + random // 增加映射后缀为随机数
// 缓存中获取(由于是随机访问, 不一定可以命中, 但是基本保证了集群中都能缓存数据)
data = redis.GET(bakHotKey) 
if (data == NULL) { // 缓存未命中, 数据库获取
    data = GetFromDB()
    redis.SET(bakHotKey, expireTime + new Random().nextInt(0 ,5));
}
```

为了进一步提升性能，既然集群中的机器都有这个key的备份，为什么每台机器上bakHotKey不存在的时候都要去访问DB呢， 完全可以**在redis自己内部解决**

因此仍旧可以保存一份原来的hotKey在缓存中，所有的bakHotKey失效的时候，**都从hotKey去同步数据; 只有当hotKey也失效的时候，才去DB中访问数据**, 这样即使先后有好几台机器里边的缓存失效了，只有一台机器真正的去DB访问了数据，其他的redis都从之后的hotKey的缓存中备份一份数据出来

```java
int M = N * 2 // N为随机数上限
Random random = new Random(0, M) // 随机 0 ~ 2*N
String bakHotKey = hotKey + “_” + random // 增加映射后缀为随机数
// 拉取备份的bakHotKey
var data = redis.GET(bakHotKey)
if (data == NULL) {
    // bakHotKey失效，尝试拉取hotKey
    data = redis.GET(hotKey)
    if (data == NULL) {
        // hotKey也失效，从DB拉取
        data = GetFromDB()
        // 写入主数据
        redis.SET(hotKey, data, expireTime + longerTime)
        // 写入备份数据
        redis.SET(bakHotKey, data, expireTime + new Random().nextInt(0 ,5))
    } else {
        // 否则只需要直接写入bakHotKey，无需访问DB
         redis.SET(bakHotKey, data, expireTime + new Random().nextInt(0 ,5))
    }
}
```

****

**hotkey检测**

Redis 4.0新增了一类内存逐出策略：**LFU（Least Frequently Used）**

LFU表示最不经常使用, 相比LRU，LRU对于不怎么使用的key，如果偶然用了一下，也是类似激活了一下这个key，不会短时间内删除；但是LFU是统计key的总体的使用频率，删除使用频率最小的key

redis 4.0.3提供了redis-cli的热点key发现功能，执行redis-cli时加上–hotkeys选项即可，示例如下：

```bash
$./redis-cli --hotkeys

# Scanning the entire keyspace to find hot keys as well as
# average sizes per key type.  You can use -i 0.1 to sleep 0.1 sec
# per 100 SCAN commands (not usually needed).

[00.00%] Hot key 'counter:000000000002' found so far with counter 87
[00.00%] Hot key 'key:000000000001' found so far with counter 254
[00.00%] Hot key 'mylist' found so far with counter 107
[00.00%] Hot key 'key:000000000000' found so far with counter 254
[45.45%] Hot key 'counter:000000000001' found so far with counter 87
[45.45%] Hot key 'key:000000000002' found so far with counter 254
[45.45%] Hot key 'myset' found so far with counter 64
[45.45%] Hot key 'counter:000000000000' found so far with counter 93

-------- summary -------

Sampled 22 keys in the keyspace!
hot key found with counter: 254    keyname: key:000000000001
hot key found with counter: 254    keyname: key:000000000000
hot key found with counter: 254    keyname: key:000000000002
hot key found with counter: 107    keyname: mylist
hot key found with counter: 93    keyname: counter:000000000000
hot key found with counter: 87    keyname: counter:000000000002
hot key found with counter: 87    keyname: counter:000000000001
hot key found with counter: 64    keyname: myset
```

<br/>

### Redis事务

<font color="#f00">**Redis 事务的本质是一组命令的集合**</font>

事务支持一次执行多个命令，一个事务中所有命令都会被序列化, 在事务执行过程，会按照顺序串行化执行队列中的命令，其他客户端提交的命令请求不会插入到事务执行命令序列中

><br/>
>
>**总结**
>
>Redis事务就是一次性、顺序性、排他性的执行一个队列中的一系列命令
>
>**主要作用：**序列化操作，串联多个命令防止别的命令插队
>
>**Redis使用乐观锁：redis就是利用check-and-set机制实现事务**

><br/>
>
>**回顾: 乐观锁与悲观锁**
>
>-   悲观锁：每次拿到数据的时候都会上锁，或者等待别人处理完再去拿锁，传统的关系型数据库里边很多用到了这种锁机制，比如行锁、表锁、读锁、写锁
>-   乐观锁：每次拿数据的时候总认为别人不会修改数据，所以不会上锁。但是更新的时候回去判断别人有没有更改数据，使用版本号机制。乐观锁适用于多读的应用类型，可以提高吞吐量

三大特性：

-   **单独的隔离操作：事务中的所有命令都会序列化，按顺序执行。不会被其他客户端打断**
-   **没有隔离级别概念：批量操作在发送 EXEC 命令前被放入队列缓存，并不会被实际执行，也就不存在事务内的查询要看到事务里的更新，事务外查询不能看到**
-   **不能保证原子性：单条命令是原子性执行的，但事务不保证原子性，且没有回滚; 事务中任意命令执行失败，其余的命令仍会被执行**

<br/>

**Redis事务的三个阶段：**

-   开始事务
-   命令入队
-   执行事务

**Redis事务相关命令：**

-   `watch key1 key2 ... `: 监视一或多个key, 如果在**事务执行之前，被监视的key被其他命令改动，则事务被打断 （ 类似乐观锁 ）**
-   `multi`: 标记一个**事务块的开始**（ queued ）
-   `exec`: **执行所有事务块的命令 （ 一旦执行exec后，之前加的监控锁都会被取消掉 ）**　
-   `discard`: **取消事务，放弃事务块中的所有命令**
-   `unwatch`: **取消watch对所有key的监控**

<br/>

**Redis事务使用案例**

**① 正常执行**

```mysql
localhost:0>MULTI # 开启事务
"OK"
localhost:0>set k1 v1 # 命令入队
"QUEUED"
localhost:0>set k2 v2 # 命令入队
"QUEUED"
localhost:0>get k2 # 命令入队
"QUEUED"
localhost:0>set k3 v3 # 命令入队
"QUEUED"
localhost:0>exec # 执行事务
# 输出结果
 1)  "OK" 
 2)  "OK"
 3)  "v2"
 4)  "OK"
```

**② 放弃事务**

```mysql
localhost:0>multi # 开启事务
"OK"
localhost:0>set k1 v1 # 命令入队
"QUEUED"
localhost:0>set k2 v2 # 命令入队
"QUEUED"
localhost:0>set k3 v3 # 命令入队
"QUEUED"
localhost:0>discard # 取消事务
"OK"
localhost:0>get k2 # 数据未被加入
null
```

**③ 事务队列中存在命令性错误**

<font color="#f00">**若在事务队列中存在命令性错误（类似于编译性错误），则执行EXEC命令时，所有命令都不会执行**</font>

```mysql
localhost:0>multi # 开启事务
"OK"
localhost:0>set k1 v1 # 命令入队
"QUEUED"
localhost:0>set k2 v2 # 命令入队
"QUEUED"
localhost:0>set k3 v3 # 命令入队
"QUEUED"
localhost:0>getset k3 # 错误命令
"ERR wrong number of arguments for 'getset' command"
localhost:0>set k4 v4 # 命令入队
"QUEUED"
localhost:0>set k5 v5 # 命令入队
"QUEUED"
localhost:0>exec # 执行事务报错!
"EXECABORT Transaction discarded because of previous errors."
localhost:0>get k5 # 命令未执行
null
```

**④ 事务队列中存在语法性错误**

<font color="#f00">**若在事务队列中存在语法性错误（类似于运行时异常），则执行EXEC命令时，其他正确命令会被执行，错误命令抛出异常**</font>

```mysql
localhost:0>set k1 v1 # 事务前设置k1 - v1
"OK"
localhost:0>multi # 开启事务
"OK"
localhost:0>incr k1 # 错误命令, 对v1进行加一操作
"QUEUED"
localhost:0>set k2 v2 # 正确命令入队
"QUEUED"
localhost:0>set k3 v3 # 正确命令入队
"QUEUED"
localhost:0>get k3 # 正确命令入队
"QUEUED"
localhost:0>exec # 执行事务
 1)  "ERR value is not an integer or out of range" # 第一条命令报错
 2)  "OK" # 其他命令正常执行
 3)  "OK"
 4)  "v3"
```

**⑤ 使用watch**

-   案例一：使用watch检测balance，事务期间balance数据未变动，事务执行成功

    ```mysql
    localhost:0>set balance 100 # balance初始值为100
    "OK"
    localhost:0>watch balance # 检测可用余额数
    "OK"
    localhost:0>multi # 开启事务
    "OK"
    localhost:0>decrby balance 20 # 消费20后, 可用余额数-20
    "QUEUED"
    localhost:0>incrby debt 20 # 应还余额 + 20
    "QUEUED"
    localhost:0>exec
     1)  "80"
     2)  "20"
    ```

-   案例二：使用watch检测balance，在开启事务后（标注1处），在新窗口执行标注2中的操作，更改balance的值，模拟其他客户端在事务执行期间更改watch监控的数据，然后再执行标注1后命令，执行EXEC后，事务未成功执行

    ```mysql
    # 客户端-1
    localhost:0>set balance 100 # balance初始值为100
    "OK"
    localhost:0>watch balance # 检测可用余额数
    "OK"
    localhost:0>multi # 客户端-1开启事务(标注1)
    "OK"
    
    # 客户端-2执行
    localhost:0>get balance
    "100"
    localhost:0>set balance 800 # 客户端-2修改balance, 此时客户端-1开启了事务
    "OK"
    
    # 客户端-1继续
    localhost:0>decrby balance 20 # 消费20后, 可用余额数-20
    "QUEUED"
    localhost:0>incrby debt 20 # 应还余额 + 20
    "QUEUED"
    localhost:0>exec
    (nil) # 事务失败
    localhost:0>get balance # balance值已经被修改
    "800"
    ```

    **一但执行 EXEC 开启事务的执行后，无论事务使用执行成功， WARCH 对变量的监控都将被取消, 故当事务执行失败后，需重新执行WATCH命令对变量进行监控，并开启新的事务进行操作**

><br/>
>
>**watch总结:**
>
>watch指令类似于乐观锁，在事务提交时，<font color="#f00">**如果watch监控的多个KEY中任何KEY的值已经被其他客户端更改，则使用EXEC执行事务时，事务队列将不会被执行，同时返回Null, multi-bulk应答以通知调用者事务执行失败**</font>

<br/>

### Redis订阅发布

发布订阅是一种应用程序系统之间通讯，传递数据的技术手段, 特别是在异构（不
 同语言）系统之间作用非常明显, 发布订阅可以实现应用系统之间的解耦合

除了传统的比如RabbitMQ, Kafka等消息队列可以实现发布/订阅(Pub/Sub)之外, Redis也可以实现Pub/Sub服务

Redis通过`publish和subscribe`命令实现订阅和发布的功能, Redis将信息类型称为通道(channel); 

订阅者可以通过subscribe命令向redis-server订阅自己感兴趣的消息类型; 当发布者通过publish命令向redis-server发送特定类型的信息时，订阅该消息类型的全部订阅者都会收到此消息

**Redis案例**

客户端-1订阅cctv1:

```mysql
127.0.0.1:6379> subscribe cctv1
Reading messages... (press Ctrl-C to quit)
1) "subscribe"
2) "CCTV1"
3) (integer) 1
```

客户端-2订阅cctv1和cctv2:

```mysql
127.0.0.1:6379> subscribe cctv1 cctv2
Reading messages... (press Ctrl-C to quit)
1) "subscribe"
2) "CCTV1"
3) (integer) 1
1) "subscribe"
2) "CCTV2"
3) (integer) 2
```

客户端-3订阅发布到模式(使用psubscribe来订阅一个模式):

```mysql
127.0.0.1:6379> psubscribe cctv*
Reading messages... (press Ctrl-C to quit)
1) "psubscribe"
2) "CCTV*"
3) (integer) 1
```

现在客户端-4向服务器推送了关于cctv1频道的信息:

```mysql
127.0.0.1:6379> publish CCTV1 "cctv1 is good"
(integer) 2
```

则三个客户端都会获得:

```mysql
# 客户端-1
1) "message"
2) "cctv1"
3) "cctv1 is good"

# 客户端-2
1) "message"
2) "cctv1"
3) "cctv1 is good"

# 客户端-3
1) "pmessage"
2) "cctv*"
3) "cctv1"
4) "cctv1 is good"
```

**Pub/Sub在Java中的实现**

导入Redis驱动

```xml
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
    <version>3.2.0</version>
</dependency>
```

Redis驱动包提供了一个抽象类: `JedisPubSub`, 继承这个类就完成了对客户端对订阅的监听

示例代码:

RedisMsgPubSubListener.java

```java
package top.jasonkayzk.redismq.listener;

import redis.clients.jedis.JedisPubSub;

/**
 * Redis发布订阅消息监听器
 *
 * @author zk
 */
public class RedisMsgPubSubListener extends JedisPubSub {

    @Override
    public void unsubscribe() {
        super.unsubscribe();
    }

    @Override
    public void unsubscribe(String... channels) {
        super.unsubscribe(channels);
    }

    @Override
    public void subscribe(String... channels) {
        super.subscribe(channels);
    }

    @Override
    public void psubscribe(String... patterns) {
        super.psubscribe(patterns);
    }

    @Override
    public void punsubscribe() {
        super.punsubscribe();
    }

    @Override
    public void punsubscribe(String... patterns) {
        super.punsubscribe(patterns);
    }

    /**
     * 订阅频道时的回调
     *
     * @param channel            频道
     * @param subscribedChannels 订阅成功的频道
     */
    @Override
    public void onSubscribe(String channel, int subscribedChannels) {
        System.out.println(String.format("subscribe redis channel success, channel %s, subscribedChannels %d",
                channel, subscribedChannels));
    }

    /**
     * 监听到订阅频道接受到消息时的回调
     *
     * @param channel 订阅频道
     * @param message 频道推送
     */
    @Override
    public void onMessage(String channel, String message) {
        System.out.println(String.format("receive redis published message, channel %s, message %s", channel, message));
    }

    /**
     * 取消订阅频道时的回调
     *
     * @param channel            频道
     * @param subscribedChannels 订阅成功的频道
     */
    @Override
    public void onUnsubscribe(String channel, int subscribedChannels) {
        System.out.println(String.format("unsubscribe redis channel, channel %s, subscribedChannels %d",
                channel, subscribedChannels));
    }

    /**
     * 监听到订阅模式接受到消息时的回调
     *
     * @param pattern 订阅模式
     * @param channel 订阅频道
     * @param message 频道推送
     */
    @Override
    public void onPMessage(String pattern, String channel, String message) {
        System.out.println(String.format("onPMessage: pattern[%s], channel[%s], message[%s]", pattern, channel, message));
    }

    /**
     * 取消订阅模式时的回调
     *
     * @param pattern            订阅模式
     * @param subscribedChannels 订阅的频道
     */
    @Override
    public void onPUnsubscribe(String pattern, int subscribedChannels) {
        System.out.println(String.format("onPUnsubscribe: pattern[%s], subscribedChannels[%s]", pattern, subscribedChannels));
    }

    /**
     * 订阅频道模式时的回调
     *
     * @param pattern            订阅模式
     * @param subscribedChannels 订阅的频道
     */
    @Override
    public void onPSubscribe(String pattern, int subscribedChannels) {
        System.out.println(String.format("onPSubscribe: pattern[%s], subscribedChannels[%s]", pattern, subscribedChannels));
    }

}

```

><br/>
>
>**方法说明:**
>
>-   监听到订阅模式接受到消息时的回调 (onPMessage)
>-   监听到订阅频道接受到消息时的回调 (onMessage )
>-   订阅频道时的回调( onSubscribe )
>-   取消订阅频道时的回调( onUnsubscribe )
>-   订阅频道模式时的回调 ( onPSubscribe )
>-   取消订阅模式时的回调( onPUnsubscribe )

发布者: RedisPub

```java
package top.jasonkayzk.redismq.pub;

import redis.clients.jedis.Jedis;

/**
 * 发布者
 *
 * @author zk
 */
public class RedisPub {

    public static void main(String[] args) {
        publish();
    }

    public static void publish() {
        System.out.println("发布者");
        Jedis client = null;
        try {
            // redis服务地址和端口号
            client = new Jedis("127.0.0.1", 6379, 0);

            // client客户端配置两个推送channel
            client.publish( "news.share", "新闻分享");
            client.publish( "news.blog", "新闻博客");
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (client != null) {
                client.disconnect();
            }
        }
    }

}
```

订阅者: RedisSub

```java
package top.jasonkayzk.redismq.sub;

import redis.clients.jedis.Jedis;
import top.jasonkayzk.redismq.listener.RedisMsgPubSubListener;

/**
 * 订阅者
 *
 * @author zk
 */
public class RedisSub {

    public static void main(String[] args) {
        subscribe();
    }

    public static void subscribe() {
        System.out.println("订阅者");
        Jedis client = null;
        try {
            // redis服务地址和端口号
            client = new Jedis("127.0.0.1", 6379, 0);
            // 创建一个Listener
            RedisMsgPubSubListener listener = new RedisMsgPubSubListener();
            // 客户端配置监听两个channel: news.share和news.blog
            // 真正收到推送后在listener中处理回调逻辑
            client.subscribe(listener, "news.share", "news.blog");
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (client != null) {
                client.disconnect();
            }
        }
    }

}
```

之后先运行订阅者进行订阅, 然后运行发布者即可收到消息:

```
订阅者
subscribe redis channel success, channel news.share, subscribedChannels 1
subscribe redis channel success, channel news.blog, subscribedChannels 2
receive redis published message, channel news.share, message 新闻分享
receive redis published message, channel news.blog, message 新闻博客
```

><br/>
>
>**运行机制说明:**
>
>RedisPub通过Jedis客户端注册并发布消息到指定的channel, 之后RedisSub通过Listener类中的subscribe()方法注册订阅;
>
><font color="#f00">**Listener收到发布事件之后, 通过OnMessage等回调函数完成逻辑处理(即RedisSub仅仅完成订阅, 真正执行逻辑的是Listener)**</font>
>
>源码见: https://github.com/JasonkayZK/Java_Samples/tree/redis-pub/sub

<br/>

### Redis实现分布式锁

在Java并发编程中，我们通过锁，来避免由于竞争而造成的数据不一致问题。通常，我们以`synchronized 、Lock`来使用它

但是Java中的锁，只能保证在同一个JVM进程内中执行。如果在分布式集群环境下呢？

分布式锁，是一种思想，它的实现方式有很多。比如，我们将沙滩当做分布式锁的组件，那么它看起来应该是这样的：

-   **加锁**

在沙滩上踩一脚，留下自己的脚印，就对应了加锁操作。其他进程或者线程，看到沙滩上已经有脚印，证明锁已被别人持有，则等待

-   **解锁**

把脚印从沙滩上抹去，就是解锁的过程

-   **锁超时**

为了避免死锁，我们可以设置一阵风，在单位时间后刮起，将脚印自动抹去

分布式锁的实现有很多，比如基于数据库、memcached、Redis、系统文件、zookeeper等。它们的核心的理念跟上面的过程大致相同

**① 单节点Redis实现一个简单的分布式锁**

-   **加锁**

<font color="#f00">**加锁实际上就是在redis中，给Key键设置一个值，为避免死锁，并给定一个过期时间:**</font>

`SET lock_key lock_value NX PX 5000`

值得注意的是：

-   `lock_value` 是客户端生成的唯一的字符串
-   `NX` 代表只在键不存在时，才对键进行设置操作
-   `PX 5000` 设置键的过期时间为5000毫秒

这样，如果上面的命令执行成功，则证明客户端获取到了锁

-   **解锁**

解锁的过程就是将Key键删除, 但也不能乱删，不能说客户端1的请求将客户端2的锁给删除掉, 这时候`lock_value`的作用就体现出来

为了保证解锁操作的原子性，可以用LUA脚本完成这一操作: 先判断当前锁的字符串是否与传入的值相等，是的话就删除Key，解锁成功

```lua
if redis.call('get',KEYS[1]) == ARGV[1] then 
   return redis.call('del',KEYS[1]) 
else
   return 0 
end
```

-   **实现**

首先加入jedis依赖

```java
        <dependency>
            <groupId>redis.clients</groupId>
            <artifactId>jedis</artifactId>
            <version>3.2.0</version>
        </dependency>
```

分布式锁

SinglePointRedisLock.java

```java
package top.jasonkayzk.redislock.singlepoint;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.params.SetParams;

import java.util.Collections;

/**
 * 单点Redis分布式锁
 * <p>
 * 未实现: 可重入, 键值过期等问题
 *
 * @author zk
 */
public class SinglePointRedisLock {

    /**
     * 锁键
     */
    private final String LOCK_KEY = "redis_lock";

    /**
     * 锁过期时间
     */
    protected final long internalLockLeaseTime = 30000;

    /**
     * 获取锁的超时时间
     */
    private final long TIMEOUT = 999999;

    /**
     * 加锁
     *
     * @param id 锁Id
     * @return 是否加锁成功
     */
    public boolean lock(String id) {
        try (Jedis jedis = new Jedis("127.0.0.1", 6379, 0)) {
            long start = System.currentTimeMillis();

            // SET命令的参数
            SetParams params = SetParams.setParams().nx().px(internalLockLeaseTime);

            for (; ; ) {
                // SET命令返回OK ，则证明获取锁成功
                String lock = jedis.set(LOCK_KEY, id, params);
                if ("OK".equals(lock)) {
                    return true;
                }

                // 否则循环等待，在timeout时间内仍未获取到锁，则获取失败
                long l = System.currentTimeMillis() - start;
                if (l >= TIMEOUT) {
                    return false;
                }

                // 模拟自旋锁
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    /**
     * 解锁
     *
     * @param id 锁Id
     * @return 是否成功解锁
     */
    public boolean unlock(String id) {
        try (Jedis jedis = new Jedis("127.0.0.1", 6379, 0)) {
            String script =
                    "if redis.call('get',KEYS[1]) == ARGV[1] then" +
                            "   return redis.call('del',KEYS[1]) " +
                            "else" +
                            "   return 0 " +
                            "end";

            // 使用jedis.eval执行Lua脚本, 保证解锁的原子性
            Object result = jedis.eval(script, Collections.singletonList(LOCK_KEY),
                    Collections.singletonList(id));
            return "1".equals(result.toString());
        }
    }

}
```

><br/>
>
>**代码说明:**
>
>**① 加锁过程lock()**
>
><font color="#f00">**加锁的过程很简单，就是通过SET指令来设置值，成功则返回；否则就循环等待，在timeout时间内仍未获取到锁，则获取失败**</font>
>
>**② 解锁过程unlock()**
>
><font color="#f00">**解锁通过`jedis.eval`来执行一段Lua脚本, 保证了解锁过程的原子性; 将锁的Key键和生成的字符串当做参数传进来**</font>

-   **测试**

在多线程环境下进行测试: 开启1000个线程，对count进行累加

调用的时候，关键是唯一字符串的生成, 这里者使用的是Java自带的UUID生成, 当然你也可以使用`Snowflake`算法

><br/>
>
>**具体UUID生成算法见:** [UUID生成算法-UUID还是snowflake](https://jasonkayzk.github.io/2020/02/09/UUID生成算法-UUID还是snowflake/)

SinglePointRedisLockTest.java

```java
package top.jasonkayzk.redislock.singlepoint;

import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 单节点Redis分布式锁测试类
 *
 * @author zk
 */
public class SinglePointRedisLockTest {

    SinglePointRedisLock redisLock = new SinglePointRedisLock();

    private int count = 0;

    public static void main(String[] args) throws InterruptedException {
        new SinglePointRedisLockTest().test();
    }

    public void test() throws InterruptedException {
        int clientCount = 1000;

        CountDownLatch latch = new CountDownLatch(clientCount);

        // 创建client大小的连接池
        ExecutorService executorService = Executors.newFixedThreadPool(clientCount);

        long start = System.currentTimeMillis();

        for (var i = 0; i < clientCount; ++i) {
            executorService.execute(() -> {
                //通过Snowflake算法获取唯一的ID字符串
                UUID id = UUID.randomUUID();
                try {
                    redisLock.lock(id.toString());
                    count++;
                } finally {
                    redisLock.unlock(id.toString());
                }
                latch.countDown();
            });
        }

        latch.await();
        long end = System.currentTimeMillis();
        System.out.println(String.format("执行线程数:{%s},总耗时:{%s},count数为:{%s}", clientCount, end - start, count));
        executorService.shutdown();
    }

}

/* Output */
执行线程数:{1000},总耗时:{1759},count数为:{1000}
```

至此，单节点Redis的分布式锁的实现就已经完成了, 比较简单，但是问题也比较大, 比如:

-   锁不具有可重入性
-   锁超时问题
-   ……

****

**② Redisson**

><br/>
>
>**Redisson介绍**
>
>[Redisson](https://redisson.org/)是架设在[Redis](http://redis.cn/)基础上的一个Java驻内存数据网格（In-Memory Data Grid）。充分的利用了Redis键值数据库提供的一系列优势，基于Java实用工具包中常用接口，为使用者提供了一系列具有分布式特性的常用工具类。使得**原本作为协调单机多线程并发程序的工具包获得了协调分布式多机多线程并发系统的能力**，大大降低了设计和研发大规模分布式系统的难度。同时结合各富特色的分布式服务，更进一步简化了分布式环境中程序相互之间的协作

相对于Jedis而言，Redisson更为强大, 当然了，随之而来的就是它的复杂性

它里面也实现了分布式锁，而且包含多种类型的锁

更多请参阅[分布式锁和同步器](https://github.com/redisson/redisson/wiki/8.-分布式锁和同步器)

-   **可重入锁**

先来看看Redisson中如何调用可重入锁, 这里使用的是当前的最新版: 3.12.1

```java
package top.jasonkayzk.redislock.redisson;

import org.redisson.Redisson;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Redisson可重入锁测试
 *
 * @author zk
 */
public class RedissonReentrantLockTest {

    private int count = 0;

    private static final String LOCK_KEY = "redis_lock";

    /**
     * 锁过期时间
     */
    protected static final long INTERNAL_LOCK_LEASE_TIME = 30000;

    private static final RedissonClient client;

    static {
        Config config = new Config();
        config.useSingleServer().setAddress("redis://127.0.0.1:6379");

        client = Redisson.create(config);
    }

    public static void main(String[] args) throws InterruptedException {
        new RedissonReentrantLockTest().test();
    }

    public void test() throws InterruptedException {
        var clientCount = 1000;

        var latch = new CountDownLatch(clientCount);

        // 创建client大小的连接池
        var executorService = Executors.newFixedThreadPool(clientCount);

        var start = System.currentTimeMillis();

        for (var i = 0; i < clientCount; ++i) {
            executorService.execute(() -> {
                RLock lock = null;
                try {
                    lock = client.getLock(LOCK_KEY);
                    lock.lock(INTERNAL_LOCK_LEASE_TIME, TimeUnit.MILLISECONDS);
                    count++;
                } finally {
                    if (lock != null) {
                        lock.unlock();
                    }
                }
                latch.countDown();
            });
        }

        latch.await();
        long end = System.currentTimeMillis();
        System.out.println(String.format("执行线程数:{%s},总耗时:{%s},count数为:{%s}", clientCount, end - start, count));
        executorService.shutdown();
        client.shutdown();
    }

}
```

><br/>
>
>**代码说明:**
>
>通过配置获取RedissonClient客户端的实例，然后`getLock`获取锁的实例，进行操作即可
>
>-   **获取锁实例**
>
>先来看`RLock lock = client.getLock("lock1");`  这句代码就是为了获取锁的实例，然后我们可以看到它返回的是一个`RedissonLock`对象:
>
>```java
>public RLock getLock(String name) {
>    return new RedissonLock(connectionManager.getCommandExecutor(), name);
>}
>```
>
>在`RedissonLock`构造方法中，主要初始化一些属性
>
>```java
>public RedissonLock(CommandAsyncExecutor commandExecutor, String name) {
>    super(commandExecutor, name);
>    //命令执行器
>    this.commandExecutor = commandExecutor;
>    //UUID字符串
>    this.id = commandExecutor.getConnectionManager().getId();
>    //内部锁过期时间
>    this.internalLockLeaseTime = commandExecutor.
>                getConnectionManager().getCfg().getLockWatchdogTimeout();
>    this.entryName = id + ":" + name;
>}
>```
>
>-   **加锁**
>
>当我们调用`lock`方法，定位到`lockInterruptibly`, 在这里，完成了加锁的逻辑
>
>```java
>public void lockInterruptibly(long leaseTime, TimeUnit unit) throws InterruptedException {
>    
>    //当前线程ID
>    long threadId = Thread.currentThread().getId();
>    //尝试获取锁
>    Long ttl = tryAcquire(leaseTime, unit, threadId);
>    // 如果ttl为空，则证明获取锁成功
>    if (ttl == null) {
>        return;
>    }
>    //如果获取锁失败，则订阅到对应这个锁的channel
>    RFuture<RedissonLockEntry> future = subscribe(threadId);
>    commandExecutor.syncSubscription(future);
>
>    try {
>        while (true) {
>            //再次尝试获取锁
>            ttl = tryAcquire(leaseTime, unit, threadId);
>            //ttl为空，说明成功获取锁，返回
>            if (ttl == null) {
>                break;
>            }
>            //ttl大于0 则等待ttl时间后继续尝试获取
>            if (ttl >= 0) {
>                getEntry(threadId).getLatch().tryAcquire(ttl, TimeUnit.MILLISECONDS);
>            } else {
>                getEntry(threadId).getLatch().acquire();
>            }
>        }
>    } finally {
>        //取消对channel的订阅
>        unsubscribe(future, threadId);
>    }
>    //get(lockAsync(leaseTime, unit));
>}
>```
>
>如上代码，就是加锁的全过程:
>
>-   <font color="#f00">**先调用`tryAcquire`来获取锁，如果返回值ttl为空，则证明加锁成功，返回；**</font>
>-   <font color="#f00">**如果不为空，则证明加锁失败; 这时候，它会订阅这个锁的Channel，等待锁释放的消息，然后重新尝试获取锁**</font>
>
>Redisson可重入锁流程图:
>
>![Redisson可重入锁流程图.png](https://upload-images.jianshu.io/upload_images/13230160-6c08ae68fe9a796f.png?imageMogr2/auto-orient/strip|imageView2/2/w/815)
>
>-   **获取锁**
>
>获取锁的过程就要看`tryAcquire`方法
>
>在这里，它有两种处理方式，一种是带有过期时间的锁，一种是不带过期时间的锁
>
>```java
>private <T> RFuture<Long> tryAcquireAsync(long leaseTime, TimeUnit unit, final long threadId) {
>
>    //如果带有过期时间，则按照普通方式获取锁
>    if (leaseTime != -1) {
>        return tryLockInnerAsync(leaseTime, unit, threadId, RedisCommands.EVAL_LONG);
>    }
>    
>    //先按照30秒的过期时间来执行获取锁的方法
>    RFuture<Long> ttlRemainingFuture = tryLockInnerAsync(
>        commandExecutor.getConnectionManager().getCfg().getLockWatchdogTimeout(),
>        TimeUnit.MILLISECONDS, threadId, RedisCommands.EVAL_LONG);
>        
>    //如果还持有这个锁，则开启定时任务不断刷新该锁的过期时间
>    ttlRemainingFuture.addListener(new FutureListener<Long>() {
>        @Override
>        public void operationComplete(Future<Long> future) throws Exception {
>            if (!future.isSuccess()) {
>                return;
>            }
>
>            Long ttlRemaining = future.getNow();
>            // lock acquired
>            if (ttlRemaining == null) {
>                scheduleExpirationRenewal(threadId);
>            }
>        }
>    });
>    return ttlRemainingFuture;
>}
>```
>
>接着往下看，`tryLockInnerAsync`方法是真正执行获取锁的逻辑，它是一段LUA脚本代码。在这里，它使用的是hash数据结构
>
>```java
><T> RFuture<T> tryLockInnerAsync(long leaseTime, TimeUnit unit,     
>                            long threadId, RedisStrictCommand<T> command) {
>
>        //过期时间
>        internalLockLeaseTime = unit.toMillis(leaseTime);
>
>        return commandExecutor.evalWriteAsync(getName(), LongCodec.INSTANCE, command,
>                  //如果锁不存在，则通过hset设置它的值，并设置过期时间
>                  "if (redis.call('exists', KEYS[1]) == 0) then " +
>                      "redis.call('hset', KEYS[1], ARGV[2], 1); " +
>                      "redis.call('pexpire', KEYS[1], ARGV[1]); " +
>                      "return nil; " +
>                  "end; " +
>                  //如果锁已存在，并且锁的是当前线程，则通过hincrby给数值递增1
>                  "if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then " +
>                      "redis.call('hincrby', KEYS[1], ARGV[2], 1); " +
>                      "redis.call('pexpire', KEYS[1], ARGV[1]); " +
>                      "return nil; " +
>                  "end; " +
>                  //如果锁已存在，但并非本线程，则返回过期时间ttl
>                  "return redis.call('pttl', KEYS[1]);",
>        Collections.<Object>singletonList(getName()), 
>                internalLockLeaseTime, getLockName(threadId));
>    }
>```
>
>这段LUA代码看起来并不复杂，有三个判断：
>
>-   **通过exists判断，如果锁不存在，则设置值和过期时间，加锁成功**
>-   **通过hexists判断，如果锁已存在，并且锁的是当前线程，则证明是重入锁，加锁成功**
>-   **如果锁已存在，但锁的不是当前线程，则证明有其他线程持有锁。返回当前锁的过期时间，加锁失败**
>
>![Redisson可重入锁流程图2.png](https://upload-images.jianshu.io/upload_images/13230160-2046b77640392660.png?imageMogr2/auto-orient/strip|imageView2/2/w/913)
>
>加锁成功后，在redis的内存数据中，就有一条hash结构的数据: 
>
>-   **key为锁的名称；field为随机字符串+线程ID；值为1**
>-   **如果同一线程多次调用`lock`方法，值递增1**
>
>```mysql
>127.0.0.1:6379> hgetall lock1
>1) "b5ae0be4-5623-45a5-8faa-ab7eb167ce87:1"
>2) "1"
>```
>
>-   **解锁**
>
>我们通过调用`unlock`方法来解锁
>
>```java
>public RFuture<Void> unlockAsync(final long threadId) {
>    final RPromise<Void> result = new RedissonPromise<Void>();
>    
>    //解锁方法
>    RFuture<Boolean> future = unlockInnerAsync(threadId);
>
>    future.addListener(new FutureListener<Boolean>() {
>        @Override
>        public void operationComplete(Future<Boolean> future) throws Exception {
>            if (!future.isSuccess()) {
>                cancelExpirationRenewal(threadId);
>                result.tryFailure(future.cause());
>                return;
>            }
>            //获取返回值
>            Boolean opStatus = future.getNow();
>            //如果返回空，则证明解锁的线程和当前锁不是同一个线程，抛出异常
>            if (opStatus == null) {
>                IllegalMonitorStateException cause = 
>                    new IllegalMonitorStateException("
>                        attempt to unlock lock, not locked by current thread by node id: "
>                        + id + " thread-id: " + threadId);
>                result.tryFailure(cause);
>                return;
>            }
>            //解锁成功，取消刷新过期时间的那个定时任务
>            if (opStatus) {
>                cancelExpirationRenewal(null);
>            }
>            result.trySuccess(null);
>        }
>    });
>
>    return result;
>}
>```
>
>然后我们再看`unlockInnerAsync`方法。这里也是一段LUA脚本代码
>
>```java
>protected RFuture<Boolean> unlockInnerAsync(long threadId) {
>    return commandExecutor.evalWriteAsync(getName(), LongCodec.INSTANCE, EVAL,
>    
>            //如果锁已经不存在， 发布锁释放的消息
>            "if (redis.call('exists', KEYS[1]) == 0) then " +
>                "redis.call('publish', KEYS[2], ARGV[1]); " +
>                "return 1; " +
>            "end;" +
>            //如果释放锁的线程和已存在锁的线程不是同一个线程，返回null
>            "if (redis.call('hexists', KEYS[1], ARGV[3]) == 0) then " +
>                "return nil;" +
>            "end; " +
>            //通过hincrby递减1的方式，释放一次锁
>            //若剩余次数大于0 ，则刷新过期时间
>            "local counter = redis.call('hincrby', KEYS[1], ARGV[3], -1); " +
>            "if (counter > 0) then " +
>                "redis.call('pexpire', KEYS[1], ARGV[2]); " +
>                "return 0; " +
>            //否则证明锁已经释放，删除key并发布锁释放的消息
>            "else " +
>                "redis.call('del', KEYS[1]); " +
>                "redis.call('publish', KEYS[2], ARGV[1]); " +
>                "return 1; "+
>            "end; " +
>            "return nil;",
>    Arrays.<Object>asList(getName(), getChannelName()), 
>        LockPubSub.unlockMessage, internalLockLeaseTime, getLockName(threadId));
>
>}
>```
>
>如上代码，就是释放锁的逻辑。同样的，它也是有三个判断：
>
>-   **如果锁已经不存在，通过publish发布锁释放的消息，解锁成功**
>-   **如果解锁的线程和当前锁的线程不是同一个，解锁失败，抛出异常**
>-   **通过hincrby递减1，先释放一次锁。若剩余次数还大于0，则证明当前锁是重入锁，刷新过期时间；若剩余次数小于0，删除key并发布锁释放的消息，解锁成功**
>
>![Redisson可重入锁流程图3.png](https://upload-images.jianshu.io/upload_images/13230160-34c1a3f8ec81a652.png?imageMogr2/auto-orient/strip|imageView2/2/w/876)

至此，Redisson中的可重入锁的逻辑，就分析完了

但值得注意的是，上面的两种实现方式都是针对单机Redis实例而进行的, 如果我们有多个Redis实例，请参阅**Redlock算法**

该算法的具体内容，请参考http://redis.cn/topics/distlock.html

><br/>
>
>**文章转自:** [分布式锁之Redis实现](https://www.jianshu.com/p/47fd7f86c848)

<br/>

### Redis实现分布式Session

见: [Redis实现分布式Session](https://jasonkayzk.github.io/2020/02/10/Redis实现分布式Session/)

<br/>

### Redis实现SSO

见: [Redis实现SSO](https://jasonkayzk.github.io/2020/02/10/Redis实现SSO/)

<br/>

### Redis持久化

Redis提供两种持久化方式：RDB（redis database）和AOF（append of file）

**① RDB**

在指定时间间隔内，将**内存中的数据作为一个快照文件（snapshot）写入到磁盘**，读取的时候也是**直接读取snapshot文件到内存中**

![RDB.png](http://img1.tuicool.com/NjYjYvF.png!web?_=6182478)

-   **持久化过程：**redis单独创建(通过操作系统的fork函数)一个进程来持久化，会先将数据写入临时文件中，待上次持久化结束后，会将该临时文件替换上次持久化文件，比aof高效，但是最后一次数据可能会丢失
-   **Fork：**在linux中，fork()会产生一个跟主进程一样的子进程，出于效率考虑，主进程和子进程会公用一段物理内存，当发生改变的时候，才会把主进程复制一份给子进程
-   **Redis备份的文件：**在redis.conf中设置，dbfilename默认为：dump.rdb
-   **RDB保存策略：**
    -   save 900 1: 在900秒(15分钟)之后，如果至少有1个key发生变化，则dump内存快照
    -   save 300 10: 在300秒(5分钟)之后，如果至少有10个key发生变化，则dump内存快照
    -   save 60 10000: 在60秒(1分钟)之后，如果至少有10000个key发生变化，则dump内存快照
-   **RDB的备份：**
    -   config get dir 得到备份的文件夹
    -   复制备份文件
-   **RDB恢复：**
    -    关闭redis
    -   将备份文件复制到工作目录下
    -   启动redis，自动加载

****

**② AOF**

以日志形式**记录每个写操作**，启动时通过日志恢复操作

![AOF.png](http://img2.tuicool.com/YrqaY3f.png!web?_=6182478)

-   开启AOF：默认不开启，进入redis.conf找到`appendonly yes`打开
-   修复AOF：redis-check-aof –fix appendonly.aof
-   同步频率：每秒记录一次，如果宕机该秒记可能失效
-   Rewrite：bgrewriteaof 因为日志是追加方式，文件会越来越大，当超过了设置的阈值时，日志文件会压缩，保留仅可以恢复的日志

****

**③ RDB和AOF对比**

-   RDB优点

    整个Redis数据库将只包含一个文件，你可能打算每个小时归档一次最近24小时的数据，同时还要每天归档一次最近30天的数据。通过这样的备份策略，一旦系统出现灾难性故障，我们可以非常容易的进行恢复

    -   节省磁盘空间
    -   恢复速度快
    -   RDB的启动效率更高

-   RDB缺点：

    -   一段时间保存一次快照，宕机时最后一次可能没有保存
    -   数据太大时，比较消耗性能: 由于RDB是通过fork子进程来协助完成数据持久化工作的，因此，如果当数据集较大时，可能会导致整个服务器停止服务几百毫秒，甚至是1秒钟

-   AOF优点:

    更高的数据安全性，即数据持久性。Redis中提供了三种同步策略，即每秒同步、每修改同步和不同步

    事实上，每秒同步也是异步完成的，其效率也是非常高的，所差的是一旦系统出现宕机现象，那么这一秒钟之内修改的数据将会丢失。而每修改同步，我们可以将其视为同步持久化，即每次发生的数据变化都会被立即记录到磁盘中, 这种方式在效率上是最低的

    -   备份机制更加稳健
    -   可读的日志文件，通过aof恢复更加稳健
    -   可以处理失误: 本次操作只是写入了一半数据就出现了系统崩溃问题，不用担心，在Redis下一次启动之前，我们可以通过redis-check-aof工具来帮助我们解决数据一致性的问题
    -   如果日志过大，Redis可以自动启用rewrite机制。即Redis以append模式不断的将修改数据写入到老的磁盘文件中，同时Redis还会创建一个新的文件用于记录此期间有哪些修改命令被执行。因此在进行rewrite切换时可以更好的保证数据安全性

-   AOF缺点：

    -   比RDB更占磁盘
    -   备份速度, 恢复速度都较慢
    -   每次都同步日志，有性能压力

>   <br/>
>
>   **使用场景:**
>
>   二者选择的标准，就是看:
>
>   -   愿意牺牲一些性能，换取更高的缓存一致性（AOF）
>   -   愿意写操作频繁的时候，不启用备份来换取更高的性能，待手动运行save的时候，再做备份（RDB）
>
>   生产环境其实更多都是二者结合使用的

<br/>

### Redis架构模式

一主一从[Master-Slave], Redis集群[Redis-Cluster], 哨兵模式[Redis-Sentinel]





<br/>

### Redis集群(如何保证同步…)





<br/>

### 缓存算法(LRU等)



<br/>

### 一致性哈希算法？什么是哈希槽？





<br/>

### 什么是缓存穿透？如何避免？什么是缓存雪崩？何如避免?





<br/>

### 附录

文章参考:

-   [Redis的各种用途以及使用场景](https://blog.csdn.net/qq_24641227/article/details/94591693)
-   [Redis的五种数据结构原理分析](https://blog.csdn.net/xpsallwell/article/details/84030285)
-   [Redis的3个高级数据结构](https://blog.csdn.net/wufaliang003/article/details/82016385)
-   [如何处理redis集群中的hot Key](https://blog.csdn.net/harleylau/article/details/86246806)
-   [分布式锁之Redis实现](https://www.jianshu.com/p/47fd7f86c848)