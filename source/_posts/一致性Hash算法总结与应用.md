---
title: 一致性Hash算法总结与应用
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?44'
date: 2022-02-12 17:15:12
categories: 算法
tags: [算法, 分布式]
description: 一致性Hash算法是解决分布式缓存等问题的一种算法，本文介绍了一致性Hash算法的原理，并给出了一种实现和实际运用的案例；
---

一致性Hash算法是解决分布式缓存等问题的一种算法；

本文介绍了一致性Hash算法的原理，并给出了一种实现和实际运用的案例；

源代码：

-   https://github.com/JasonkayZK/consistent-hashing-demo

<br/>

<!--more-->

# **一致性Hash算法总结与应用**

## **一致性Hash算法背景**

考虑这么一种场景：

我们有三台缓存服务器编号`node0`、`node1`、`node2`，现在有3000万个`key`，希望可以将这些个key均匀的缓存到三台机器上，你会想到什么方案呢？

我们可能首先想到的方案是：取模算法`hash（key）% N`，即：对key进行hash运算后取模，N是机器的数量；

这样，对key进行hash后的结果对3取模，得到的结果一定是0、1或者2，正好对应服务器`node0`、`node1`、`node2`，存取数据直接找对应的服务器即可，简单粗暴，完全可以解决上述的问题；

![consistent-hash-1.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/consistent-hash-1.png)

取模算法虽然使用简单，但对机器数量取模，在集群扩容和收缩时却有一定的局限性：**因为在生产环境中根据业务量的大小，调整服务器数量是常有的事；**

**而服务器数量N发生变化后`hash（key）% N`计算的结果也会随之变化！**

![consistent-hash-2.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/consistent-hash-2.png)

**比如：一个服务器节点挂了，计算公式从`hash（key）% 3`变成了`hash（key）% 2`，结果会发生变化，此时想要访问一个key，这个key的缓存位置大概率会发生改变，那么之前缓存key的数据也会失去作用与意义；**

**大量缓存在同一时间失效，造成缓存的雪崩，进而导致整个缓存系统的不可用，这基本上是不能接受的；**

为了解决优化上述情况，一致性hash算法应运而生~

<br/>

## **一致性Hash算法详述**

### **算法原理**

>   一致性哈希算法在 1997 年由麻省理工学院提出，是一种特殊的哈希算法，在移除或者添加一个服务器时，能够尽可能小地改变已存在的服务请求与处理请求服务器之间的映射关系；
>
>   一致性哈希解决了简单哈希算法在分布式[哈希表](https://link.segmentfault.com/?enc=8SLNH%2BJkz1wSUKDQoMpUHQ%3D%3D.d6lGfewjMMLemIFvUa01RtDhzMFVr3f3KDOee9wh%2BKofqOsfRFAUjbNFSu8hZ6mQSLJllSWS62WHskJ0a0tkhdU4zmtmnEgyaQYtUxL2FDE%3D)（Distributed Hash Table，DHT）中存在的动态伸缩等问题；

一致性hash算法本质上也是一种取模算法；

不过，不同于上边按服务器数量取模，一致性hash是**对固定值2^32取模**；

>   **IPv4的地址是4组8位2进制数组成，所以用2^32可以保证每个IP地址会有唯一的映射；**

#### **① hash环**

我们可以将这`2^32`个值抽象成一个圆环⭕️，圆环的正上方的点代表0，顺时针排列，以此类推：1、2、3…直到`2^32-1`，而这个由2的32次方个点组成的圆环统称为`hash环`；

![consistent-hash-3.jpg](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/consistent-hash-3.jpg)

<br/>

#### **② 服务器映射到hash环**

在对服务器进行映射时，使用`hash（服务器ip）% 2^32`，即：

**使用服务器IP地址进行hash计算，用哈希后的结果对`2^32`取模，结果一定是一个0到`2^32-1`之间的整数；**

**而这个整数映射在hash环上的位置代表了一个服务器，依次将`node0`、`node1`、`node2`三个缓存服务器映射到hash环上；**

![consistent-hash-4.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/consistent-hash-4.png)

<br/>

#### **③ 对象key映射到服务器**

在对对应的Key映射到具体的服务器时，需要首先计算Key的Hash值：`hash（key）% 2^32`；

>   **注：此处的Hash函数可以和之前计算服务器映射至Hash环的函数不同，只要保证取值范围和Hash环的范围相同即可（即：`2^32`）；**

将Key映射至服务器遵循下面的逻辑：

<red>**从缓存对象key的位置开始，沿顺时针方向遇到的第一个服务器，便是当前对象将要缓存到的服务器；**</font>

假设我们有 "semlinker"、"kakuqo"、"lolo"、"fer" 四个对象，分别简写为 o1、o2、o3 和 o4；

首先，使用哈希函数计算这个对象的 hash 值，值的范围是 [0, 2^32-1]：

![consistent-hash-5.jpg](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/consistent-hash-5.jpg)

图中对象的映射关系如下：

```abnf
hash(o1) = k1; hash(o2) = k2;
hash(o3) = k3; hash(o4) = k4;
```

同时 3 台缓存服务器，分别为 CS1、CS2 和 CS3：

![consistent-hash-6.jpg](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/consistent-hash-6.jpg)

则可知，各对象和服务器的映射关系如下：

```
K1 => CS1
K4 => CS3
K2 => CS2
K3 => CS1
```

即：

![consistent-hash-7.jpg](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/consistent-hash-7.jpg)

以上便是一致性Hash的工作原理；

>   <red>**可以看到，一致性Hash就是：将原本单个点的Hash映射，转变为了在一个环上的某个片段上的映射！**</font>

下面我们来看几种服务器扩缩容的场景；

<br/>

### **服务器扩缩容场景**

#### **① 服务器减少**

假设 CS3 服务器出现故障导致服务下线，这时原本存储于 CS3 服务器的对象 o4，需要被重新分配至 CS2 服务器，其它对象仍存储在原有的机器上：

![consistent-hash-8.jpg](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/consistent-hash-8.jpg)

**此时受影响的数据只有 CS2 和 CS3 服务器之间的部分数据！**

<br/>

#### **② 服务器增加**

假如业务量激增，我们需要增加一台服务器 CS4，经过同样的 hash 运算，该服务器最终落于 t1 和 t2 服务器之间，具体如下图所示：

![consistent-hash-9.jpg](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/consistent-hash-9.jpg)

此时，只有 t1 和 t2 服务器之间的部分对象需要重新分配；

在以上示例中只有 o3 对象需要重新分配，即它被重新到 CS4 服务器；

在前面我们已经说过：如果使用简单的取模方法，当新添加服务器时可能会导致大部分缓存失效，而使用一致性哈希算法后，这种情况得到了较大的改善，因为只有少部分对象需要重新分配！

<br/>

### **数据偏斜&服务器性能平衡问题**

#### **引出问题**

在上面给出的例子中，各个服务器几乎是平均被均摊到Hash环上；

但是在实际场景中很难选取到一个Hash函数这么完美的将各个服务器散列到Hash环上；

此时，在服务器节点数量太少的情况下，很容易因为**节点分布不均匀而造成数据倾斜问题；**

如下图被缓存的对象大部分缓存在`node-4`服务器上，导致其他节点资源浪费，系统压力大部分集中在`node-4`节点上，这样的集群是非常不健康的：

![consistent-hash-11.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/consistent-hash-11.png)

同时，还有另一个问题：

在上面新增服务器 CS4 时，CS4 只分担了 CS1 服务器的负载，服务器 CS2 和 CS3 并没有因为 CS4 服务器的加入而减少负载压力；如果 CS4 服务器的性能与原有服务器的性能一致甚至可能更高，那么这种结果并不是我们所期望的；

<br/>

#### **虚拟节点**

**针对上面的问题，我们可以通过：引入虚拟节点来解决负载不均衡的问题：**

<red>**即将每台物理服务器虚拟为一组虚拟服务器，将虚拟服务器放置到哈希环上，如果要确定对象的服务器，需先确定对象的虚拟服务器，再由虚拟服务器确定物理服务器；**</font>

如下图所示：

![consistent-hash-10.jpg](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/consistent-hash-10.jpg)

在图中：o1 和 o2 表示对象，v1 ~ v6 表示虚拟服务器，s1 ~ s3 表示实际的物理服务器；

<br/>

#### **虚拟节点的计算**

虚拟节点的hash计算通常可以采用：<red>**对应节点的IP地址加数字编号后缀 hash（10.24.23.227#1) 的方式；**</font>

举个例子，node-1节点IP为10.24.23.227，正常计算`node-1`的hash值：

-   `hash（10.24.23.227#1）% 2^32`

假设我们给node-1设置三个虚拟节点，`node-1#1`、`node-1#2`、`node-1#3`，对它们进行hash后取模：

-   `hash（10.24.23.227#1）% 2^32`
-   `hash（10.24.23.227#2）% 2^32`
-   `hash（10.24.23.227#3）% 2^32`

>   **注意：**
>
>   -   <red>**分配的虚拟节点个数越多，映射在hash环上才会越趋于均匀，节点太少的话很难看出效果；**</font>
>   -   <red>**引入虚拟节点的同时也增加了新的问题，要做虚拟节点和真实节点间的映射，`对象key->虚拟节点->实际节点`之间的转换；**</font>

<br/>

### **使用场景**

一致性hash在分布式系统中应该是实现负载均衡的首选算法，它的实现比较灵活，既可以在客户端实现，也可以在中间件上实现，比如日常使用较多的缓存中间件`memcached`和`redis`集群都有用到它；

memcached的集群比较特殊，严格来说它只能算是**伪集群**，因为它的服务器之间不能通信，请求的分发路由完全靠客户端来的计算出缓存对象应该落在哪个服务器上，而它的路由算法用的就是一致性hash；

还有redis集群中hash槽的概念，虽然实现不尽相同，但思想万变不离其宗，看完本篇的一致性hash，你再去理解redis槽位就轻松多了；

其它的应用场景还有很多：

-   `RPC`框架`Dubbo`用来选择服务提供者
-   分布式关系数据库分库分表：数据与节点的映射关系
-   `LVS`负载均衡调度器
-   ……

<br/>

## **一致性Hash算法实现**

下面我们根据上面的讲述，使用Golang实现一个一致性Hash算法，这个算法具有一些下面的功能特性：

-   一致性Hash核心算法；
-   支持自定义Hash算法；
-   支持自定义虚拟节点个数；

>   具体源代码见：
>
>   -   https://github.com/JasonkayZK/consistent-hashing-demo

下面开始实现吧！

<br/>

### **结构体、错误以及常量定义**

首先定义每一台









<br/>

### **注册/注销缓存服务器**













<br/>

### **查询Key**











<br/>

## **一致性Hash算法检验**











<br/>

## **含有负载边界值的一致性Hash**

17年时，Google 提出了含有负载边界值的一致性Hash算法，此算法主要应用于服务器组中资源不同的场景；

>   **此算法最初由 Vimeo 的 Andrew Rodland 在 [haproxy](https://github.com/haproxy/haproxy) 中实现并开源；**
>
>   参考：
>
>   -   https://ai.googleblog.com/2017/04/consistent-hashing-with-bounded-loads.html





<br/>

## **总结**







<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/consistent-hashing-demo

文章参考：

-   https://segmentfault.com/a/1190000041268497
-   https://segmentfault.com/a/1190000021199728
-   https://zhuanlan.zhihu.com/p/98030096
-   https://zh.wikipedia.org/wiki/%E4%B8%80%E8%87%B4%E5%93%88%E5%B8%8C
-   https://ai.googleblog.com/2017/04/consistent-hashing-with-bounded-loads.html
-   https://pkg.go.dev/crypto/sha512#Sum512


<br/>
