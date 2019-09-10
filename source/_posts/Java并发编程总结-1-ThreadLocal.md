---
title: 'Java并发编程总结-1: ThreadLocal'
toc: true
date: 2019-09-10 23:49:37
categories: 并发编程
tags: [并发编程, 多线程]
description: Java并发编程之美之ThreadLocal相关的总结
---

![Java并发编程之美](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1567750837551&di=fae22e8ce73ecbc87820964da733b106&imgtype=0&src=http%3A%2F%2Fimg3m1.ddimg.cn%2F31%2F20%2F1465705921-1_u_1.jpg)

<br/>有关Java中ThreadLocal相关内容的总结!

<!--more-->

## ThreadLocal

多个线程访问同一个共享变量时特别容易出现并发问题, 特别是在多个线程同时需要对一个共享变量进行写入时! 为了保证线程安全, 一般使用者在访问共享变量时*需要进行适当的同步.*

同步的一般措施为**加锁**. 但是加锁机制较为复杂