---
title: 'UUID生成算法,UUID还是snowflake'
toc: true
date: 2020-02-09 15:51:08
cover: https://img.paulzzh.com/touhou/random?22
categories: 分布式
tags: [分布式, UUID]
description: UUID是通用唯一识别码（Universally Unique Identifier）的缩写, 其目的是让分布式系统中的所有元素，都能有唯一的辨识资讯，而不需要透过中央控制端来做辨识资讯的指定。如此一来，就不需考虑数据库建立时的名称重复问题. 目前最广泛应用的 UUID，即是微软的 Microsoft's Globally Unique Identifiers (GUIDs)，而其他重要的应用，则有 Linux ext2/ext3 档案系统、LUKS 加密分割区等
---

UUID是通用唯一识别码（Universally Unique Identifier）的缩写, 其目的是让分布式系统中的所有元素，都能有唯一的辨识资讯，而不需要透过中央控制端来做辨识资讯的指定。如此一来，就不需考虑数据库建立时的名称重复问题. 目前最广泛应用的 UUID，即是微软的 Microsoft's Globally Unique Identifiers (GUIDs)，而其他重要的应用，则有 Linux ext2/ext3 档案系统、LUKS 加密分割区等

本篇总结了一些UUID生成算法, 以及一些UUID生成算法的实现；

系列文章：

-   [UUID生成算法-UUID还是snowflake](/2020/02/09/UUID生成算法-UUID还是snowflake/)
-   [高性能分布式ID生成器实现方法总结](/2021/06/20/高性能分布式ID生成器实现方法总结/)
-   [在Go中仅使用MySQL实现高性能分布式ID生成器](/2021/06/20/在Go中仅使用MySQL实现高性能分布式ID生成器/)

<br/>

<!--more-->

### UUID的定义

UUID是Universally Unique Identifier的缩写，它是在一定的范围内（从特定的名字空间到全球）唯一的机器生成的标识符。UUID具有以下涵义:

-   **经由一定的算法机器生成**

为了保证UUID的唯一性，规范定义了包括网卡MAC地址、时间戳、名字空间（Namespace）、随机或伪随机数、时序等元素，以及从这些元素生成UUID的算法。UUID的复杂特性在保证了其唯一性的同时，意味着**只能由计算机生成**

-   **非人工指定，非人工识别**

UUID是**不能人工指定的，除非你冒着UUID重复的风险**。UUID的复杂性决定了一般人不能直接从一个UUID知道哪个对象和它关联

-   **在特定的范围内重复的可能性极小**

UUID的生成规范定义的算法主要目的就是要保证其唯一性。但这个**唯一性是有限的，只在特定的范围内才能得到保证，这和UUID的类型有关**（参见UUID的版本）

**UUID是16字节128位长的数字，通常以36字节的字符串表示**，示例如下:

3F2504E0-4F89-11D3-9A0C-0305E82C3301

><br/>
>
><font color="#f00">**其中的字母是16进制表示，大小写无关**</font>

Universally Unique IDentifier(UUID)，有着正儿八经的[RFC规范](http://www.ietf.org/rfc/rfc4122.txt)，是一个128bit的数字，也可以表现为32个16进制的字符，中间用”-”分割: 

-   时间戳＋UUID版本号，分三段占16个字符(60bit+4bit)
-   Clock Sequence号与保留字段，占4个字符(13bit＋3bit)
-   节点标识占12个字符(48bit)

GUID（Globally Unique Identifier）是UUID的别名；但在实际应用中，GUID通常是指微软实现的UUID

<br/>

### UUID组成

UUID是指在一台机器上生成的数字，它保证对在同一时空中的所有机器都是唯一的。通常平台会提供生成的API。按照[开放软件基金会](https://baike.baidu.com/item/开放软件基金会)(OSF)制定的标准计算，用到了以太网卡地址、纳秒级时间、芯片ID码和随机数

UUID由以下几部分的组合：

-   当前日期和时间，UUID的第一个部分与时间有关，如果你在生成一个UUID之后，过几秒又生成一个UUID，则第一个部分不同，其余相同
-   时钟序列
-   全局唯一的IEEE机器识别号，如果有网卡，从网卡MAC地址获得，没有网卡以其他方式获得
-   在 hibernate(Java orm框架)中， 采用: IP-JVM启动时间-当前时间右移32位-当前时间-内部计数（8-8-4-8-4）来组成UUID

<font color="#f00">**UUID的唯一缺陷在于生成的结果串会比较长**</font>

><br/>
>
>摘自百度百科: [UUID](https://baike.baidu.com/item/UUID/5921266?fr=aladdin#2)

<br/>

### UUID常见算法

UUID具有多个版本，每个版本的算法不同，应用范围也不同

**① Null的UUID**

首先是一个特例: Nil UUID(通常我们不会用到它，它是由全为0的数字组成)：00000000-0000-0000-0000-000000000000

****

**② Version-1: 基于时间的UUID**

<font color="#f00">**基于时间的UUID通过计算当前时间戳、随机数和机器MAC地址得到**</font>

因为时间戳有满满的60bit，所以可以尽情花，以100纳秒为1，从1582年10月15日算起, 能撑3655年

节点标识也有48bit，一般用MAC地址表达，如果有多块网卡就随便用一块。如果没网卡，就用随机数凑数，或者拿一堆尽量多的其他的信息，比如主机名什么的，拼在一起再hash一把

><br/>
>
>**补充:**
>
>由于在算法中使用了MAC地址，这个版本的UUID**可以保证在全球范围的唯一性**, 但与此同时，使用MAC地址会**带来安全性问题**，这就是这个版本UUID受到批评的地方, 如果应用只是在局域网中使用，也可以使用退化的算法，以IP地址来代替MAC地址 -> Java的UUID往往是这样实现的（当然也考虑了获取MAC的难度）

顺序号这16bit则仅用于避免前面的节点标示改变（如网卡改了），时钟系统出问题（如重启后时钟快了慢了），让它随机一下避免重复

但好像Version-1就没考虑过一台机器上起了两个进程这类的问题，也没考虑相同时间戳的并发问题，所以严格的Version1没人实现，接着往下看各个变种吧

<br/>

-   **Version-1变种1 – Hibernate**

Hibernate的[CustomVersionOneStrategy.java](https://github.com/hibernate/hibernate-orm/blob/master/hibernate-core/src/main/java/org/hibernate/id/uuid/CustomVersionOneStrategy.java)，解决了之前version-1的两个问题:

-   时间戳(6bytes, 48bit)：毫秒级别的，从1970年算起，能撑8925年…;
-   顺序号(2bytes, 16bit, 最大值65535): 没有时间戳过了一秒要归零的事，各搞各的，short溢出到了负数就归0
-   机器标识(4bytes 32bit): 拿localhost的IP地址，IPV4呢正好4个byte，但如果是IPV6要16个bytes，就只拿前4个byte
-   进程标识(4bytes 32bit): 用当前时间戳右移8位再取整数应付，不信两条线程会同时启动

>   <br/>
>
>   **值得留意就是: 机器进程和进程标识组成的64bit Long几乎不变，只变动另一个Long就够了**

****

-   **Version-1变种2 – MongoDB**

MongoDB的[ObjectId.java](https://github.com/mongodb/mongo-java-driver/blob/master/bson/src/main/org/bson/types/ObjectId.java)的定义:

-   时间戳(4 bytes 32bit): 是秒级别的，从1970年算起，能撑136年
-   自增序列(3bytes 24bit, 最大值一千六百万)： 是一个从随机数开始（机智）的Int不断加一，也没有时间戳过了一秒要归零的事，各搞各的。因为只有3bytes，所以一个4bytes的Int还要截一下后3bytes
-   机器标识(3bytes 24bit): 将所有网卡的Mac地址拼在一起做个HashCode，同样一个int还要截一下后3bytes。搞不到网卡就用随机数混过去
-   进程标识(2bytes 16bits)：从JMX里搞回来到进程号，搞不到就用进程名的hash或者随机数混过去

><br/>
>
>**评价:**
>
>MongoDB的每一个字段设计都比Hibernate的更合理一点，比如时间戳是秒级别的, 总长度也降到了12 bytes 96bit，但如果用64bit长的Long来保存有点不上不下的，只能表达成byte数组或16进制字符串

****

-   **Version-1变种3 – Twitter的snowflake派号器**

snowflake也是一个派号器，基于Thrift的服务，不过不是用redis简单自增，而是类似UUID version-1

由于只有一个Long 64bit的长度，所以[IdWorker](https://github.com/twitter/snowflake/blob/b3f6a3c6ca8e1b6847baa6ff42bf72201e2c2231/src/main/scala/com/twitter/service/snowflake/IdWorker.scala)紧巴巴的分配成:

-   时间戳(42bit) 自从2012年以来(比那些从1970年算起的会过日子)的毫秒数，能撑139年
-   自增序列(12bit，最大值4096), 毫秒之内的自增，过了一毫秒会重新置0
-   DataCenter ID (5 bit, 最大值32），配置值
-   Worker ID ( 5 bit, 最大值32)，配置值，因为是派号器的id，所以一个数据中心里最多32个派号器就够了，还会在ZK里做下注册

><br/>
>
>**评价:**
>
>因为是派号器，把机器标识和进程标识都省出来了，所以能够只用一个Long表达
>
>另外，这种派号器，client每次只能一个ID，不能批量取，所以额外增加的延时是问题

><br/>
>
>更多snowflake相关内容:
>
>-   [雪花算法(snowflake) ：分布式环境，生成全局唯一的订单号](https://blog.csdn.net/fly910905/article/details/82054196)

****

**③ Version-2: DCE安全的UUID**

DCE（Distributed Computing Environment）安全的UUID和基于时间的UUID算法相同，但会**把时间戳的前4位置换为POSIX的UID或GID**。这个版本的UUID在实际中较少用到

****

**④ Version-3: 基于名字的UUID（MD5）**

基于名字的UUID通过**计算名字和名字空间的MD5散列值得到**

这个版本的UUID保证了：

-   **相同名字空间中不同名字生成的UUID的唯一性；**
-   **不同名字空间中的UUID的唯一性；**
-   **相同名字空间中相同名字的UUID重复生成是相同的**

****

**⑤ Version-4: 随机UUID**

**根据随机数，或者伪随机数生成UUID**

这种UUID产生重复的概率是可以计算出来的，但随机的东西就像是买彩票：你指望它发财是不可能的

****

**⑥ 基于名字的UUID（SHA1）**

和基于名字的UUID算法类似，只是**散列值计算使用SHA1（Secure Hash Algorithm 1）算法**

<br/>

### UUID应用场景

UUID可以用在一些需要生成全局唯一ID的场景, 如:

-   设备的MAC地址生成
-   表单的唯一单号
-   分布式生成全局唯一ID来进行日志记录
-   用户登录Token或Session值标志
-   分布式集群下实例ID标志
-   ……

而从UUID的不同版本可以看出:

-   Version-1/2适合应用于分布式计算环境下，具有高度的唯一性；

-   Version-3/5适合于一定范围内名字唯一，且需要或可能会重复生成UUID的环境下；

    >   <br/>
    >
    >   对于具有名称不可重复的自然特性的对象，最好使用Version-3/5的UUID, 比如系统中的用户:
    >
    >   如果用户的UUID是Version-1的，如果你不小心删除了再重建用户，你会发现人还是那个人，用户已经不是那个用户了(虽然标记为删除状态也是一种解决方案，但会带来实现上的复杂性)

-   至于Version-4，我个人的建议是最好不用（虽然它是最简单最方便的）

通常我们建议使用UUID来标识对象或持久化数据，但以下情况最好不使用UUID：

-   映射类型的对象: 比如只有代码及名称的代码表
-   人工维护的非系统生成对象: 比如系统中的部分基础数据

<br/>

### UUID生成器实现

下面是一些可用的Java UUID生成器：

-   **Java UUID Generator (JUG):** 开源UUID生成器，LGPL协议，支持MAC地址
-   **[UUID](http://johannburkard.de/blog/programming/java/Java-UUID-generators-compared.html):** 特殊的License，有源码
-   **JDK 5以上自带的UUID生成器:** 采用RFC 4122的标准，按标准数据按16进制进行表示（36个字符）
-   **Hibernate中的UUID生成器:** 生成的不是任何一个（规范）版本的UUID，**强烈不建议使用**
-   **Apache的Commons包**
-   [hutool Java工具包集](https://gitee.com/loolly/hutool)
-   [mica 基于 Spring、 java8 微服务工具集](https://github.com/lets-mica/mica)

UUID性能比较: [使用java9的uuid生成方式，让uuid生成速度提升一个档次](https://blog.csdn.net/weixin_33919941/article/details/89545209)

<br/>

### 附录

系列文章：

-   [UUID生成算法-UUID还是snowflake](/2020/02/09/UUID生成算法-UUID还是snowflake/)
-   [高性能分布式ID生成器实现方法总结](/2021/06/20/高性能分布式ID生成器实现方法总结/)
-   [在Go中仅使用MySQL实现高性能分布式ID生成器](/2021/06/20/在Go中仅使用MySQL实现高性能分布式ID生成器/)

参考文章:

-   [UUID百度百科](https://baike.baidu.com/item/UUID/5921266?fr=aladdin#2)
-   [使用java9的uuid生成方式，让uuid生成速度提升一个档次](https://blog.csdn.net/weixin_33919941/article/details/89545209)
-   [UUID介绍与生成方法](https://blog.csdn.net/nawenqiang/article/details/82684001)