---
title: Java面试题总结之一续
toc: true
date: 2019-12-25 20:05:30
cover: https://img.paulzzh.tech/touhou/random?7
categories: 面试总结
tags: [Java面试]
description: 这些题是前段时间一位同学在阿里云面试的时候，面试官问到的
---

这些题是前段时间一位同学在阿里云面试的时候，面试官问到的

<!--more-->

### 10. JVM堆内存结构是怎样的？哪些情况会触发GC？会触发哪些GC？

众所周知, JVM中的堆内存是按照年代分类的, 这主要是为了进行垃圾回收而设计的

><br/>
>
>**补充: 使用分代垃圾回收的原因**

在Java中堆被划分为新生代和旧生代，新生代又被进一步划分为Eden和Survivor区，最后Survivor由FromSpace和ToSpace组成，结构图如下所示:

![Java堆内存分代.jpeg](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/Java堆内存分代.jpeg)

**新生代**

新建的对象都是用新生代分配内存，Eden空间不足的时候，会把存活的对象转移到Survivor中，新生代大小可以由-Xmn来控制，也可以用-XX:SurvivorRatio来控制Eden和Survivor的比例旧生代。用于存放新生代中经过多次垃圾回收仍然存活的对象

目前大部分垃圾收集器对于**新生代都采取Copying算法**，因为新生代中每次垃圾回收都要回收大部分对象，也就是说需要复制的操作次数较少，但是实际中并不是按照1:1的比例来划分新生代的空间的，一般来说是将新生代划分为一块较大的Eden空间和两块较小的Survivor空间，每次使用Eden空间和其中的一块Survivor空间，当进行回收时，将Eden和Survivor中还存活的对象复制到另一块Survivor空间中，然后清理掉Eden和刚才使用过的Survivor空间

**老年代**

由于老年代的特点是每次回收都只回收少量对象，一般使用的是**Mark-Compact算法**

**对象的内存分配**

对象的内存分配, 往大方向上讲就是在堆上分配，对象主要分配在新生代的Eden Space和From  Space，少数情况下会直接分配在老年代

如果新生代的Eden Space和From  Space的空间不足，则会发起一次GC，如果进行了GC之后，Eden Space和From Space能够容纳该对象就放在Eden  Space和From Space. 在GC的过程中，会将Eden Space和From Space中的存活对象移动到To  Space，然后将Eden Space和From Space进行清理

如果在清理的过程中，To  Space无法足够来存储某个对象，就会将该对象移动到老年代中. 在进行了GC之后，使用的便是Eden space和To  Space了，下次GC时会将存活对象复制到From  Space，如此反复循环。当对象在Survivor区躲过一次GC的话，其对象年龄便会加1，默认情况下，如果对象年龄达到15岁，就会移动到老年代中

一般来说，大对象会被直接分配到老年代，所谓的大对象是指需要大量连续存储空间的对象，最常见的一种大对象就是大数组，比如: `byte[] data = new byte[4*1024*1024]`, 这种一般会直接在老年代分配存储空间. 当然分配的规则并不是百分之百固定的，这要取决于当前使用的是哪种垃圾收集器组合和JVM的相关参数

<br/>

**垃圾回收算法**

主要的垃圾回收算法有:

**1. Mark-Sweep（标记-清除）算法**

这是最基础的垃圾回收算法，之所以说它是最基础的是因为它最容易实现，思想也是最简单的。标记-清除算法分为两个阶段：标记阶段和清除阶段

标记阶段的任务是标记出所有需要被回收的对象，清除阶段就是回收被标记的对象所占用的空间。具体过程如下图所示：

![标记清除算法.jpg](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/标记清除算法.jpg)

从图中可以很容易看出标记-清除算法实现起来比较容易，但是有一个比较严重的问题就是容易产生内存碎片，碎片太多可能会导致后续过程中需要为大对象分配空间时无法找到足够的空间而提前触发新的一次垃圾收集动作

<br/>

**2. Copying（复制）算法**

为了解决Mark-Sweep算法的缺陷，Copying算法就被提了出来。它将可用内存按容量划分为大小相等的两块，每次只使用其中的一块。当这一块的内存用完了，就将还存活着的对象复制到另外一块上面，然后再把已使用的内存空间一次清理掉，这样一来就不容易出现内存碎片的问题。具体过程如下图所示:

![复制算法.jpg](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/复制算法.jpg)

这种算法虽然实现简单，运行高效且不容易产生内存碎片，但是却对内存空间的使用做出了高昂的代价，因为能够使用的内存缩减到原来的一半。很显然，Copying算法的效率跟存活对象的数目多少有很大的关系，如果存活对象很多，那么Copying算法的效率将会大大降低

<br/>

**3. Mark-Compact（标记-整理）算法（压缩法）**

为了解决Copying算法的缺陷，充分利用内存空间，提出了Mark-Compact算法。该算法标记阶段和Mark-Sweep一样，但是在完成标记之后，它不是直接清理可回收对象，而是将存活对象都向一端移动，然后清理掉端边界以外的内存。具体过程如下图所示：

![标记整理算法.jpg](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/标记整理算法.jpg)

<br/>

**4. Generational Collection（分代收集）算法**

见上述.

<br/>

**垃圾收集器总结**

垃圾收集算法是内存回收的理论基础，而垃圾收集器就是内存回收的具体实现。下面介绍一下HotSpot虚拟机提供的几种垃圾收集器，用户可以根据自己的需求组合出各个年代使用的收集器:

**Serial/Serial Old收集器**

是最基本最古老的收集器，它是一个单线程收集器，并且在它进行垃圾收集时，必须暂停所有用户线程。<font color="#ff0000">**Serial收集器是针对新生代的收集器，采用的是Copying算法，Serial Old收集器是针对老年代的收集器，采用的是Mark-Compact算法**</font>

它的优点是实现简单高效，但是缺点是会给用户带来停顿

**ParNew收集器**

是**Serial收集器的多线程版本，使用多个线程进行垃圾收集**

**Parallel Scavenge收集器**

是一个**新生代的多线程收集器（并行收集器）**，它在**回收期间不需要暂停其他用户线程，其采用的是Copying算法**，该收集器与前两个收集器有所不同，它主要是为了达到一个可控的吞吐量

**Parallel Old收集器**

是**Parallel Scavenge收集器的老年代版本（并行收集器）**，使用多线程和Mark-Compact算法

**CMS（Current Mark Sweep）收集器**

是一种以获取**最短回收停顿时间为目标的收集器**，它是一种并发收集器，采用的是Mark-Sweep算法

**G1收集器**

G1（Garbadge First Collector）作为一款JVM新的垃圾收集器，可以解决CMS中Concurrent Mode Failed问题，尽量缩短处理超大堆的停顿，在G1进行垃圾回收的时候完成内存压缩，降低内存碎片的生成

G1在堆内存比较大的时候表现出比较高吞吐量和短暂的停顿时间，而且已成为Java 9的默认收集器

**ZGC: 可扩展的低延迟的垃圾回收器**

ZGC全称是Z Garbage Collector，是Java 11加入的一款可伸缩(scalable)的低延迟(low latency garbage)、并发(concurrent)垃圾回收器，旨在实现以下几个目标：

-   停顿时间不超过10ms
-   停顿时间不随heap大小或存活对象大小增大而增大
-   可以处理从几百兆到几T的内存大小

ZGC现在还只能在MacOS和Linux使用, 尚在试验中. 与ZGC相关的介绍: [一文读懂Java 11的ZGC为何如此高效](https://www.jianshu.com/p/3bde1606ea5d)

<br/>

### 11. 数据库你们是怎么优化的？

**第一阶段 优化sql和索引**

(1)用慢查询日志定位执行效率低的`SQL`语句

(2)用`explain`分析`SQL`的执行计划

(3)确定问题，采取相应的优化措施，建立索引等

关于优化SQL更全面: [数据库总结之一](https://jasonkayzk.github.io/2019/12/03/数据库总结之一/)

**第二阶段 搭建缓存**

在优化sql无法解决问题的情况下，才考虑搭建缓存。毕竟你使用缓存的目的，就是将复杂的、耗时的、不常变的执行结果缓存起来，降低数据库的资源消耗

这里需要**注意**的是:搭建缓存后，系统的复杂性增加了。你需要考虑很多问题，比如:

-   缓存和数据库一致性问题？(比如是更缓存，还是删缓存);
-   缓存击穿、缓存穿透、缓存雪崩问题如何解决？是否有做缓存预热的必要。不过我猜，大部分中小公司应该都没考虑

**第三阶段 读写分离**

缓存也搞不定的情况下，搞主从复制，上读写分离。在应用层，区分读写请求。或者利用现成的中间件mycat或者altas等做读写分离

需要注意的是, 只要你敢说你用了主从架构，有三个问题，你要准备:

(1)主从的好处？

回答:实现数据库备份，实现数据库负载均衡，提交数据库可用性

(2)主从的原理?

回答:如图所示

![主从架构.jpg](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/主从架构.jpg)

主库有一个`log dump`线程，将`binlog`传给从库

从库有两个线程，一个I/O线程，一个SQL线程，I/O线程读取主库传过来的`binlog`内容并写入到`relay log`, SQL线程从`relay log`里面读取内容，写入从库的数据库

(3)如何解决主从一致性?

回答:这个问题，我不建议在数据库层面解决该问题。根据CAP定理，主从架构本来就是一种高可用架构，是无法满足一致性的! 哪怕你采用同步复制模式或者半同步复制模式，都是弱一致性，并不是强一致性

所以，推荐还是利用缓存，来解决该问题, 步骤如下:

-   自己通过测试，计算主从延迟时间，建议mysql版本为5.7以后，因为mysql自5.7开始，多线程复制功能比较完善，一般能保证延迟在1s内。不过话说回来，mysql现在都出到8.x了，还有人用5.x的版本么
-   数据库的写操作，先写数据库，再写cache，但是有效期很短，就比主从延时的时间稍微长一点
-   读请求的时候，先读缓存，缓存不存在(这时主从同步已经完成)，再读数据库

**第四阶段 利用分区表**

说句实在话，面试的时候，其实可以略过这个阶段。因为很多互联网公司都不建议用分区表，我自己也不太建议用分区表，采用这个分区表，坑太多

这里引用一下其他文章的回答:

什么是mysql的分区表？

回答：所有数据还在一个表中，但物理存储根据一定的规则放在不同的文件中。这个是mysql支持的功能，业务代码不需要改动，但是sql语句需要改动，sql条件需要带上分区的列

缺点:

(1)分区键设计不太灵活，如果不走分区键，很容易出现全表锁

(2)在分区表使用`ALTER TABLE` … `ORDER BY`，只能在每个分区内进行`order by`

(3)分区表的分区键创建索引，那么这个索引也将被分区。分区键没有全局索引一说

(4)自己分库分表，自己掌控业务场景与访问模式，可控。分区表，研发写了一个sql，都不确定该去哪个分区查，不太可控

**第五阶段 垂直拆分**

上面四个阶段都没搞定，就来垂直拆分了。垂直拆分的复杂度还是比水平拆分小的。将你的表，按模块拆分为不同的小表。大家应该都看过《大型网站架构演变之路》，这种类型的文章或者书籍，基本都有提到这一阶段

如果你有幸能够在什么运营商、银行等公司上班，你会发现他们一个表，几百个字段都是很常见的事情。所以，应该要进行拆分，拆分原则一般是如下三点:

(1)把不常用的字段单独放在一张表

(2)把常用的字段单独放一张表

(3)经常组合查询的列放在一张表中（联合索引）

**第六阶段 水平拆分**

OK, 水平拆分是最麻烦的一个阶段，拆分后会有很多的问题，我再强调一次，水平拆分一定是最最最最后的选择

从某种意义上，我觉得还不如垂直拆分。因为你用垂直拆分，分成不同模块后，发现单模块的压力过大，你完全可以给该模块单独做优化，例如提高该模块的机器配置等

如果是水平拆分，拆成两张表，代码需要变动，然后发现两张表还不行，再变代码，再拆成三张表的？水平拆分模块间耦合性太强，成本太大，不是特别推荐

<br/>

### 12. synchronized 和Lock(ReentrantLock)有什么区别？

**一、原始构成**

synchronized是托管给JVM执行的，属于JVM层面，monitorenter(底层是通过monitor对象来完成，其实wait/notify等方法也依赖monitor对象只有在同步代码块和同步方法中才能调用wait/notify等方法);

而lock是Java写的控制锁的代码, 是具体的类，是api层面的锁；

**二、使用方法**

synchronized不需要用户手动释放锁，synchronized代码执行完成以后系统会自动让线程释放对锁的占有

ReentrantLock则需要用户手动去释放锁，若没有主动释放锁，就有可能导致死锁现象。需要使用lock()和unlock()方法配合try finally语句块来完成

**三、等待是否可以中断**

synchronized不可中断，除非抛出异常或者正常运行完成

ReetrantLock可中断:

-   设置超时方法tryLock(long timeout, TimeUnit unit);
-   lockInterruptibly()放入代码块中，调用interrupt()方法可中断；

**四、加锁是否公平**

synchronized是非公平锁

ReentrantLock默认是非公平锁，可设置为公平锁

**五、锁绑定多个条件condition**

synchronized没有； 

ReentrantLock用来实现分组唤醒需要唤醒的线程们，可以精确唤醒，而不是像synchronized要么随机唤醒一个，要么唤醒全部线程

**六、案例**

题目：多线程之间按照顺序调用，实现A->B->C三个线程启动，要求如下：AA打印5次，BB打印10次，CC打印15次，重复上述过程10次

使用Lock的解法

```java
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class SynchronizedLockDifference {

    public static void main(String[] args) {
        ShareResource shareResource = new ShareResource();
        new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                shareResource.print5();
            }
        }, "A").start();

        new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                shareResource.print10();
            }
        }, "B").start();

        new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                shareResource.print15();
            }
        }, "C").start();

    }

}

class ShareResource {

    // A:1, B:2, C:3
    private int number = 1;

    private Lock lock = new ReentrantLock();

    private Condition conditionA = lock.newCondition();
    private Condition conditionB = lock.newCondition();
    private Condition conditionC = lock.newCondition();

    public void print5() {
        try {
            lock.lock();
            while (number != 1) {
                conditionA.await();
            }
            for (int i = 0; i < 5; i++) {
                System.out.print("A");
            }
            System.out.println();
            number++;
            conditionB.signal();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }

    public void print10(){
        try {
            lock.lock();
            while (number != 2){
                conditionB.await();
            }
            for (int i = 1; i <= 10; i++){
                System.out.print("B");
            }
            System.out.println();
            number++;
            conditionC.signal();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }

    public void print15(){
        try {
            lock.lock();
            while (number != 3){
                conditionC.await();
            }
            for (int i = 1; i <= 15; i++){
                System.out.print("C");
            }
            System.out.println();
            number = 1;
            conditionA.signal();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }

}
```

使用synchronized的解法:

```java
import java.util.concurrent.atomic.AtomicInteger;

public class SynchronizedLockDifference {

    public static void main(String[] args) {
        ShareResource shareResource = new ShareResource();
        new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                shareResource.print5();
            }
        }, "A").start();

        new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                shareResource.print10();
            }
        }, "B").start();

        new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                shareResource.print15();
            }
        }, "C").start();
    }

}

class ShareResource {

    // A:1, B:2, C:3
    private static AtomicInteger number = new AtomicInteger(1);

    private static final Object lock = new Object();

    public void print5() {
        synchronized (lock) {
            while (number.get() != 1) {
                try {
                    lock.wait();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            for (int i = 0; i < 5; i++) {
                System.out.print("A");
            }
            System.out.println();
            number.set(2);
            lock.notifyAll();
        }
    }

    public void print10() {
        synchronized (lock) {
            while (number.get() != 2) {
                try {
                    lock.wait();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            for (int i = 0; i < 10; i++) {
                System.out.print("B");
            }
            System.out.println();
            number.set(3);
            lock.notifyAll();
        }
    }

    public void print15() {
        synchronized (lock) {
            while (number.get() != 3) {
                try {
                    lock.wait();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            for (int i = 0; i < 15; i++) {
                System.out.print("C");
            }
            System.out.println();
            number.set(1);
            lock.notifyAll();
        }
    }
}
```

><br/>
>
>**补充:**
>
>在Java1.5中，synchronize是性能低效的。因为这是一个重量级操作，需要调用操作接口，导致有可能加锁消耗的系统时间比加锁以外的操作还多。相比之下使用Java提供的Lock对象，性能更高一些
>
>但是到了Java1.6，发生了变化。synchronize在语义上很清晰，可以进行很多优化，有适应自旋，锁消除，锁粗化，轻量级锁，偏向锁等等。导致在Java1.6上synchronize的性能并不比Lock差。官方也表示，他们也更支持synchronize，在未来的版本中还有优化余地
>
>说到这里，还是想提一下这两种机制的具体区别。synchronized原始采用的是CPU悲观锁机制，即线程获得的是独占锁。独占锁意味着其他线程只能依靠阻塞来等待线程释放锁。而在CPU转换线程阻塞时会引起线程上下文切换，当有很多线程竞争锁的时候，会引起CPU频繁的上下文切换导致效率很低
>
>而Lock用的是乐观锁方式。所谓乐观锁就是，每次不加锁而是假设没有冲突而去完成某项操作，如果因为冲突失败就重试，直到成功为止。乐观锁实现的机制就是CAS操作（Compare and Swap）。我们可以进一步研究ReentrantLock的源代码，会发现其中比较重要的获得锁的一个方法是: compareAndSetState, 这里其实就是调用的CPU提供的特殊指令
>
>现代的CPU提供了指令，可以自动更新共享数据，而且能够检测到其他线程的干扰，而 compareAndSet() 就用这些代替了锁定。这个算法称作非阻塞算法，意思是一个线程的失败或者挂起不应该影响其他线程的失败或挂起的算法

<br/>

### 13. 用过反向代理服务器吗？用来做什么？nginx负载均衡有哪些参数？

主要考察的是Nginx的一些配置参数, 主要有:

**upstream配置：**

在http配置下增加upstream配置即可：

```
upstream nodes {
    server 192.168.10.1:8668;
    server 192.168.10.2:8668;
}

```

upstream对配置的上游服务器按照默认的轮询方式进行请求。如果上游服务器挂掉，能自己主动剔除，无需手动干预, 这种方式简单快捷

但是如果上游服务器在配置不均衡的情况下，是解决不了的, 所以nginx有其他很多的配置项

**权重配置：**

weight和请求数量成正比，主要用于上游服务器配置不均衡的情况。下面的配置中，192.168.10.2机器的请求量是192.168.10.1机器请求量的2倍

```
upstream nodes {
    server 192.168.10.1:8668 weight=5;
    server 192.168.10.2:8668 weight=10;
}

```

**ip_hash配置：**

每一个请求按照请求的ip的hash结果分配。这样每一个请求固定落在一个上游服务器，能够解决ip会话在同一台服务器的问题

```
upstream nodes {
    ip_hash;
    server 192.168.10.1:8668;
    server 192.168.10.2:8668;
}
```

**fair配置：**

按上游服务器的响应时间来分配请求。响应时间短的优先分配

```
upstream nodes {
    server 192.168.10.1:8668;
    server 192.168.10.2:8668;
    fair;
}
```

**url_hash配置：**

按照访问的url的hash结果来分配请求，使每一个url定向到同一个上游服务器

注意：在upstream中加入hash语句。server语句中不能写入weight等其他的參数，hash_method是使用的hash算法

```
upstream nodes {
    server 192.168.10.1:8668;
    server 192.168.10.2:8668;
    hash $request_uri;
    hash_method crc32;
}
```

**down：**表示当前的server不參与负载均衡

**max_fails ：**请求失败的次数默认为1

**fail_timeout :** max_fails次失败后，暂停请求此台服务器的时间

**backup：** 其他全部的非backup机器down或者忙的时候，请求backup机器。所以这台机器压力会最轻

<br/>

### 14. 你熟悉的消息队列中间件的实现原理是什么？和其他消息中间对比，有什么优势？

我使用过的消息中间件有RabbitMQ, 阿里的RocketMQ和Kafka.

**消息中间件的组成**

**Broker**: 消息服务器，作为server提供消息核心服务;

**Producer**: 消息生产者，业务的发起方，负责生产消息传输给broker;

**Consumer**: 消息消费者，业务的处理方，负责从broker获取消息并进行业务逻辑处理;

**Topic**: 主题，发布订阅模式下的消息统一汇集地，不同生产者向topic发送消息，由MQ服务器分发到不同的订阅者，实现消息的广播;

**Queue**: 队列，PTP模式下，特定生产者向特定queue发送消息，消费者订阅特定的queue完成指定消息的接收;

**Message**: 消息体，根据不同通信协议定义的固定格式进行编码的数据包，来封装业务数据，实现消息的传输;

<br/>

**消息中间件模式分类**

**点对点**

PTP点对点: 使用queue作为通信载体

![点对点.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/点对点.png)

说明:

消息生产者生产消息发送到queue中，然后消息消费者从queue中取出并且消费消息. 消息被消费以后，queue中不再存储，所以消息消费者不可能消费到已经被消费的消息。 Queue支持存在多个消费者，但是对一个消息而言，只会有一个消费者可以消费

**发布/订阅(Pub/Sub)**

Pub/Sub发布订阅(广播): 使用topic作为通信载体

![发布订阅.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/发布订阅.png)

说明:

消息生产者（发布）将消息发布到topic中，同时有多个消息消费者（订阅）消费该消息。和点对点方式不同，发布到topic的消息会被所有订阅者消费

queue实现了负载均衡，将producer生产的消息发送到消息队列中，由多个消费者消费。但一个消息只能被一个消费者接受，当没有消费者可用时，这个消息会被保存直到有一个可用的消费者

topic实现了发布和订阅，当你发布一个消息，所有订阅这个topic的服务都能得到这个消息，所以从1到N个订阅者都能得到一个消息的拷贝

<br/>

**消息中间件的优势**

**系统解耦**: 交互系统之间没有直接的调用关系，只是通过消息传输，故系统侵入性不强，耦合度低

**提高系统响应时间**: 例如原来的一套逻辑，完成支付可能涉及先修改订单状态、计算会员积分、通知物流配送几个逻辑才能完成；通过MQ架构设计，就可将紧急重要（需要立刻响应）的业务放到该调用方法中，响应要求不高的使用消息队列，放到MQ队列中，供消费者处理

**为大数据处理架构提供服务**: 通过消息作为整合，大数据的背景下，消息队列还与实时处理架构整合，为数据处理提供性能支持

<br/>

**消息中间件应用场景**

**异步通信**: 有些业务不想也不需要立即处理消息。消息队列提供了异步处理机制，允许用户把一个消息放入队列，但并不立即处理它。想向队列中放入多少消息就放多少，然后在需要的时候再去处理它们

**解耦**: 降低工程间的强依赖程度，针对异构系统进行适配。在项目启动之初来预测将来项目会碰到什么需求，是极其困难的。通过消息系统在处理过程中间插入了一个隐含的、基于数据的接口层，两边的处理过程都要实现这一接口，当应用发生变化时，可以独立的扩展或修改两边的处理过程，只要确保它们遵守同样的接口约束

**冗余**: 有些情况下，处理数据的过程会失败。除非数据被持久化，否则将造成丢失。消息队列把数据进行持久化直到它们已经被完全处理，通过这一方式规避了数据丢失风险。许多消息队列所采用的”插入-获取-删除”范式中，在把一个消息从队列中删除之前，需要你的处理系统明确的指出该消息已经被处理完毕，从而确保你的数据被安全的保存直到你使用完毕

**扩展性**: 因为消息队列解耦了你的处理过程，所以增大消息入队和处理的频率是很容易的，只要另外增加处理过程即可。不需要改变代码、不需要调节参数。便于分布式扩容

**过载保护**: 在访问量剧增的情况下，应用仍然需要继续发挥作用，但是这样的突发流量无法提取预知；如果以为了能处理这类瞬间峰值访问为标准来投入资源随时待命无疑是巨大的浪费。使用消息队列能够使关键组件顶住突发的访问压力，而不会因为突发的超负荷的请求而完全崩溃

**可恢复性**: 系统的一部分组件失效时，不会影响到整个系统。消息队列降低了进程间的耦合度，所以即使一个处理消息的进程挂掉，加入队列中的消息仍然可以在系统恢复后被处理

**顺序保证**: 在大多使用场景下，数据处理的顺序都很重要。大部分消息队列本来就是排序的，并且能保证数据会按照特定的顺序来处理

**缓冲**: 在任何重要的系统中，都会有需要不同的处理时间的元素。消息队列通过一个缓冲层来帮助任务最高效率的执行，该缓冲有助于控制和优化数据流经过系统的速度。以调节系统响应时间

**数据流处理**: 分布式系统产生的海量数据流，如：业务日志、监控数据、用户行为等，针对这些数据流进行实时或批量采集汇总，然后进行大数据分析是当前互联网的必备技术，通过消息队列完成此类数据收集是最好的选择

<br/>

**消息中间件常用协议**

**AMQP协议**: AMQP即Advanced Message Queuing  Protocol,一个提供统一消息服务的应用层标准高级消息队列协议,是应用层协议的一个开放标准,为面向消息的中间件设计。基于此协议的客户端与消息中间件可传递消息，并不受客户端/中间件不同产品，不同开发语言等条件的限制。

优点：可靠、通用

**MQTT协议**: MQTT（Message Queuing Telemetry  Transport，消息队列遥测传输）是IBM开发的一个即时通讯协议，有可能成为物联网的重要组成部分。该协议支持所有平台，几乎可以把所有联网物品和外部连接起来，被用来当做传感器和致动器（比如通过Twitter让房屋联网）的通信协议

优点：格式简洁、占用带宽小、移动端通信、PUSH、嵌入式系统

**STOMP协议**: STOMP（Streaming Text Orientated Message  Protocol）是流文本定向消息协议，是一种为MOM(Message Oriented  Middleware，面向消息的中间件)设计的简单文本协议。STOMP提供一个可互操作的连接格式，允许客户端与任意STOMP消息代理（Broker）进行交互

优点：命令模式（非topic\queue模式）

**XMPP协议**: XMPP（可扩展消息处理现场协议，Extensible Messaging and  Presence  Protocol）是基于可扩展标记语言（XML）的协议，多用于即时消息（IM）以及在线现场探测。适用于服务器之间的准即时操作。核心是基于XML流传输，这个协议可能最终允许因特网用户向因特网上的其他任何人发送即时消息，即使其操作系统和浏览器不同

优点：通用公开、兼容性强、可扩展、安全性高，但XML编码格式占用带宽大

**其他基于TCP/IP自定义的协议**: 有些特殊框架（如：redis、kafka、zeroMq等）根据自身需要未严格遵循MQ规范，而是基于TCP\IP自行封装了一套协议，通过网络socket接口进行传输，实现了MQ的功能

<br/>

**常见消息中间件MQ介绍**

**RocketMQ**: 阿里系下开源的一款分布式、队列模型的消息中间件，原名Metaq，3.0版本名称改为RocketMQ，是阿里参照kafka设计思想使用java实现的一套mq。同时将阿里系内部多款mq产品（Notify、metaq）进行整合，只维护核心功能，去除了所有其他运行时依赖，保证核心功能最简化，在此基础上配合阿里上述其他开源产品实现不同场景下mq的架构，目前主要多用于订单交易系统

具有以下特点：

-   能够保证严格的消息顺序
-   提供针对消息的过滤功能
-   提供丰富的消息拉取模式
-   高效的订阅者水平扩展能力
-   实时的消息订阅机制
-   亿级消息堆积能力

官方提供了一些不同于kafka的对比差异: https://rocketmq.apache.org/docs/motivation/

**RabbitMQ**: 使用Erlang编写的一个开源的消息队列，本身支持很多的协议：AMQP，XMPP,  SMTP,STOMP，也正是如此，使的它变的非常重量级，更适合于企业级的开发。同时实现了Broker架构，核心思想是生产者不会将消息直接发送给队列，消息在发送给客户端时先在中心队列排队。对路由(Routing)，负载均衡(Load balance)、数据持久化都有很好的支持。多用于进行企业级的ESB整合

**ActiveMQ**: Apache下的一个子项目。使用Java完全支持JMS1.1和J2EE 1.4规范的 JMS  Provider实现，少量代码就可以高效地实现高级应用场景。可插拔的传输协议支持，比如：in-VM, TCP, SSL, NIO, UDP,  multicast, JGroups and JXTA  transports。RabbitMQ、ZeroMQ、ActiveMQ均支持常用的多种语言客户端 C++、Java、.Net,、Python、  Php、 Ruby等

**Kafka**: Apache下的一个子项目，使用scala实现的一个高性能分布式Publish/Subscribe消息队列系统，具有以下特性：

-   快速持久化：通过磁盘顺序读写与零拷贝机制，可以在O(1)的系统开销下进行消息持久化；
-   高吞吐：在一台普通的服务器上既可以达到10W/s的吞吐速率；
-   高堆积：支持topic下消费者较长时间离线，消息堆积量大；
-   完全的分布式系统：Broker、Producer、Consumer都原生自动支持分布式，依赖zookeeper自动实现复杂均衡；
-   支持Hadoop数据并行加载：对于像Hadoop的一样的日志数据和离线分析系统，但又要求实时处理的限制，这是一个可行的解决方案;

<br/>

**主要消息中间件的比较**

|                   **名称**                   |                         **ActiveMQ**                         |                         **RabbitMQ**                         |                         **RocketMQ**                         |   **Kafka**    |
| :------------------------------------------: | :----------------------------------------------------------: | :----------------------------------------------------------: | :----------------------------------------------------------: | :------------: |
| **生产者-消费者模式<br />Producer-Comsumer** |                             支持                             |                             支持                             |                             支持                             |      支持      |
|        **发布-订阅模式<br />Pub-Sub**        |                             支持                             |                             支持                             |                             支持                             |      支持      |
|     **请求-响应模式<br />Request-Reply**     |                             支持                             |                             支持                             |                                                              |                |
|                **多语言支持**                |                        支持, Java优先                        |                           语言无关                           |                          只支持Java                          | 支持, Java优先 |
|                **单机吞吐量**                |                             万级                             |                             万级                             |                             万级                             |     十万级     |
|                 **消息延迟**                 |                                                              |                            微秒级                            |                            毫秒级                            |     毫秒级     |
|                  **可用性**                  |                           高(主从)                           |                           高(主从)                           |                        非常高(分布式)                        | 非常高(分布式) |
|                 **消息丢失**                 |                              低                              |                              低                              |                        理论上不会丢失                        | 理论上不会丢失 |
|                 **消息重复**                 |                                                              |                            可控制                            |                                                              | 理论上会有重复 |
|                 **商业支持**                 |                              无                              |                              无                              |                            阿里云                            |       无       |
|                   **特点**                   |                 功能齐全,被大量开源项目使用                  |              由于Erlang语言的并发能力,性能很好               | 各个环节分布式扩展设计,主从HA;支持上万队列;多种消费模式;性能很好 |                |
|                 **支持协议**                 |                OpenWire,STOMP,REST,XMPP,AMQP                 |                             AMQP                             |             自己定义的一套(社区提供JMS –不成熟)              |                |
|                  **持久化**                  |                      内存, 文件, 数据库                      |                          内存, 文件                          |                           磁盘文件                           |                |
|                   **事务**                   |                             支持                             |                             支持                             |                             支持                             |                |
|                 **负载均衡**                 |                             支持                             |                             支持                             |                             支持                             |                |
|                 **管理界面**                 |                             一般                             |                              好                              |                      有web console实现                       |                |
|                 **部署方式**                 |                          独立, 嵌入                          |                             独立                             |                             独立                             |                |
|                   **优点**                   | 成熟的产品,已经在很多公司得到应用(非大规模场景)<br />有较多的文档;<br />各种协议支持较好;<br />有多种语言的成熟的客户端; | 由于 Erlang语言的特性,MQ性能较好;<br />管理界面较丰富;<br />在互联网公司也有较大规模的应用;<br />支持AMQP协议<br />有多种语言且支持 | 模型简单,接口易用(JMS的接口很多场合并不太实用)<br />在阿里大规模应用<br />性能非常好,可以大量堆积消息在broker中;<br />支持多种消费,包括集群消费、广播消费等;<br />开发度较活跃,版本更新很快 |                |
|                   **缺点**                   | 会出莫名其妙的问题,而且会丢失消息;<br />其重心放到 ActiveMQ6.0产品 (Apollo);<br />目前社区不活跃,且对5.x维护较少; <br />不适合用于上千个队列的应用场景 |         Erlang语言难度较大; <br />集群不支持动态扩展         | 产品较新文档比较缺乏<br />没有在MQ核心中去实现JMS等接口,对已有系统而言不能兼容<br /> |                |

><br/>
>
>**小贴士:**
>
>目前支付宝中的余额宝等新兴产品均使用 RocketMQ集群规模大概在50台左右,单日处理消息上百亿; 阿里内部还有一套未开源的MQAPI,这层API可以将上层应用和下层MQ的实现解耦(阿里内部有多个mq的实现,如 notify、metaq1.x, metaq2.x, RocketMQ等),使得下面mq可以很方便的进行切换和升级而对应用无任何影响,目前这一套东西未开源

 <br/>

### 15. select、poll、epoll的原理与区别

(1) select ==>时间复杂度O(n)

它仅仅知道了，有I/O事件发生了，却并不知道是哪几个流(可能有一个，多个，甚至全部)，我们只能无差别轮询所有流，找出能读出数据，或者写入数据的流，对他们进行操作。所以**select具有O(n)的无差别轮询复杂度**，同时处理的流越多，无差别轮询时间就越长

(2) poll ==>时间复杂度O(n)

poll本质上和select没有区别，它将用户传入的数组拷贝到内核空间，然后查询每个fd对应的设备状态， **但是它没有最大连接数的限制，原因是它是基于链表来存储的**

(3) epoll ==>时间复杂度O(1)

**epoll可以理解为event poll**，不同于忙轮询和无差别轮询，epoll会把哪个流发生了怎样的I/O事件通知我们。所以我们说epoll实际上是**事件驱动（每个事件关联上fd）**的，此时我们对这些流的操作都是有意义的**(复杂度降低到了O(1))**

select，poll，epoll都是IO多路复用的机制。I/O多路复用就是通过一种机制，可以监视多个描述符，一旦某个描述符就绪（一般是读就绪或者写就绪），能够通知程序进行相应的读写操作。**但select，poll，epoll本质上都是同步I/O，因为他们都需要在读写事件就绪后自己负责进行读写，也就是说这个读写过程是阻塞的**，而异步I/O则无需自己负责进行读写，异步I/O的实现会负责把数据从内核拷贝到用户空间

epoll跟select都能提供多路I/O复用的解决方案: 在现在的Linux内核里有都能够支持，其中epoll是Linux所特有，而select则应该是POSIX所规定，一般操作系统均有实现

<br/>

**select**

select本质上是通过设置或者检查存放fd标志位的数据结构来进行下一步处理。这样所带来的缺点是:

1.单个进程可监视的fd数量被限制，即能监听端口的大小有限

一般来说这个数目和系统内存关系很大，具体数目可以通过`cat /proc/sys/fs/file-max`察看, 32位机默认是1024个, 64位机默认是2048

2.对socket进行扫描时是线性扫描，即采用轮询的方法，效率较低

当套接字比较多的时候，每次select()都要通过遍历FD_SETSIZE个Socket来完成调度,不管哪个Socket是活跃的,都遍历一遍。这会浪费很多CPU时间。如果能给套接字注册某个回调函数，当他们活跃时，自动完成相关操作，那就避免了轮询，这正是epoll与kqueue做的

3.需要维护一个用来存放大量fd的数据结构，这样会使得用户空间和内核空间在传递该结构时复制开销大

**poll**

poll本质上和select没有区别，它将用户传入的数组拷贝到内核空间，然后查询每个fd对应的设备状态，如果设备就绪则在设备等待队列中加入一项并继续遍历，如果遍历完所有fd后没有发现就绪设备，则挂起当前进程，直到设备就绪或者主动超时，被唤醒后它又要再次遍历fd。这个过程经历了多次无谓的遍历

**它没有最大连接数的限制:** 原因是它是基于链表来存储的，但是同样有缺点:

1.大量的fd的数组被整体复制于用户态和内核地址空间之间，而不管这样的复制是不是有意义

2.poll还有一个特点是“水平触发”，如果报告了fd后，没有被处理，那么下次poll时会再次报告该fd

**epoll**

epoll有EPOLL-LT和EPOLL-ET两种触发模式: LT是默认的模式，ET是“高速”模式

-   LT模式下，只要这个fd还有数据可读，每次epoll_wait都会返回它的事件，提醒用户程序去操作
-   在ET(边缘触发)模式中，它只会提示一次，直到下次再有数据流入之前都不会再提示了，无论fd中是否还有数据可读

所以在ET模式下，read一个fd的时候一定要把它的buffer读光，也就是说一直读到read的返回值小于请求值，或者遇到EAGAIN错误

还有一个特点是，epoll使用“事件”的就绪通知方式，通过epoll_ctl注册fd，一旦该fd就绪，内核就会采用类似callback的回调机制来激活该fd，epoll_wait便可以收到通知

**epoll的优点：**

**1. 没有最大并发连接的限制，能打开的FD的上限远大于1024(1G的内存上能监听约10万个端口)**

**2. 效率提升，不是轮询的方式，不会随着FD数目的增加效率下降。只有活跃可用的FD才会调用callback函数, 即Epoll最大的优点就在于它只管你“活跃”的连接，而跟连接总数无关，因此在实际的网络环境中，Epoll的效率就会远远高于select和poll**

**3. 内存拷贝，利用mmap()文件映射内存加速与内核空间的消息传递；即epoll使用mmap减少复制开销**

<br/>

**select、poll、epoll 区别总结**

**① 支持一个进程所能打开的最大连接数**

select: 单个进程所能打开的最大连接数由FD_SETSIZE宏定义，其大小是32个整数的大小(在32位的机器上，大小就是32x32，同理64位机器上FD_SETSIZE为32x64)，当然我们可以对进行修改，然后重新编译内核，但是性能可能会受到影响，这需要进一步的测试

poll: poll本质上和select没有区别，但是它没有最大连接数的限制，原因是它是基于链表来存储的

epoll: 虽然连接数有上限，但是很大，1G内存的机器上可以打开10万左右的连接，2G内存的机器可以打开20万左右的连接

**② FD剧增后带来的IO效率问题**

select: 因为每次调用时都会对连接进行线性遍历，所以随着FD的增加会造成遍历速度慢的“线性下降性能问题”

poll: 同上

epoll: 因为epoll内核中实现是根据每个fd上的callback函数来实现的，只有活跃的socket才会主动调用callback，所以在活跃socket较少的情况下，使用epoll没有前面两者的线性下降的性能问题，但是所有socket都很活跃的情况下，可能会有性能问题

**③ 消息传递方式**

select: 内核需要将消息传递到用户空间，都需要内核拷贝动作

poll: 同上

epoll: epoll通过内核和用户空间共享一块内存来实现的

><br/>
>
>**总结：**
>
>**综上，在选择select，poll，epoll时要根据具体的使用场合以及这三种方式的自身特点:**
>
><font color="#ff0000">**1. 表面上看epoll的性能最好，但是在连接数少并且连接都十分活跃的情况下，select和poll的性能可能比epoll好，毕竟epoll的通知机制需要很多函数回调**</font>
>
><font color="#ff0000">**2. select低效是因为每次它都需要轮询。但低效也是相对的，视情况而定，也可通过良好的设计改善** </font>

<br/>

### 16. BIO、NIO与AIO有什么区别？

-   BIO：线程发起IO请求，不管内核是否准备好IO操作，从发起请求起，线程一直阻塞，直到操作完成
-   NIO：线程发起IO请求，立即返回；内核在做好IO操作的准备之后，通过调用注册的回调函数通知线程做IO操作，线程开始阻塞，直到操作完成
-   AIO：线程发起IO请求，立即返回；内存做好IO操作的准备之后，做IO操作，直到操作完成或者失败，通过调用注册的回调函数通知线程做IO操作完成或者失败



-   BIO是一个连接一个线程
-   NIO是一个请求一个线程
-   AIO是一个有效请求一个线程



-   BIO：同步并阻塞，服务器实现模式为一个连接一个线程，即客户端有连接请求时服务器端就需要启动一个线程进行处理，如果这个连接不做任何事情会造成不必要的线程开销，当然可以通过线程池机制改善
-   NIO：同步非阻塞，服务器实现模式为一个请求一个线程，即客户端发送的连接请求都会注册到多路复用器上，多路复用器轮询到连接有I/O请求时才启动一个线程进行处理
-   AIO：异步非阻塞，服务器实现模式为一个有效请求一个线程，客户端的I/O请求都是由OS先完成了再通知服务器应用去启动线程进行处理

**适用场景分析**

-   BIO方式适用于连接数目比较小且固定的架构，这种方式对服务器资源要求比较高，并发局限于应用中，JDK1.4以前的唯一选择，但程序直观简单易理解
-   NIO方式适用于连接数目多且连接比较短（轻操作）的架构，比如聊天服务器，并发局限于应用中，编程比较复杂，JDK1.4开始支持
-   AIO方式使用于连接数目多且连接比较长（重操作）的架构，比如相册服务器，充分调用OS参与并发操作，编程比较复杂，JDK7开始支持

>   <br/>
>
>   关于IO相关的更多内容可见我的博文IO专题: [IO专题](https://jasonkayzk.github.io/categories/IO%E5%9F%BA%E7%A1%80/)

<br/>

### 17. 你的职业规划？年薪期望薪资？

职业规划: 看个人吧…

年薪期望: 报一个你觉得会为之努力工作的数字

<br/>