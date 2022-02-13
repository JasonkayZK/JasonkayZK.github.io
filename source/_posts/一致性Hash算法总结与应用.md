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

![consistent-hash-1]()

取模算法虽然使用简单，但对机器数量取模，在集群扩容和收缩时却有一定的局限性：**因为在生产环境中根据业务量的大小，调整服务器数量是常有的事；**

**而服务器数量N发生变化后`hash（key）% N`计算的结果也会随之变化！**

![consistent-hash-1]()

**比如：一个服务器节点挂了，计算公式从`hash（key）% 3`变成了`hash（key）% 2`，结果会发生变化，此时想要访问一个key，这个key的缓存位置大概率会发生改变，那么之前缓存key的数据也会失去作用与意义；**

**大量缓存在同一时间失效，造成缓存的雪崩，进而导致整个缓存系统的不可用，这基本上是不能接受的；**

为了解决优化上述情况，一致性hash算法应运而生~

<br/>

## **一致性Hash算法详述**

### **算法原理**





<br/>

### **算法优势**







<br/>

### **使用场景**





<br/>

## **一致性Hash算法实现**







<br/>

## **一致性Hash算法检验**









<br/>

## **小结**







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
