---
title: Java并发总结-1
toc: true
date: 2019-09-06 16:49:37
categories: 并发编程
tags: [并发编程, 多线程]
description: 最近在看Java并发编程之美, 做的一些比较重要的总结.
---

![Java并发编程之美](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1567750837551&di=fae22e8ce73ecbc87820964da733b106&imgtype=0&src=http%3A%2F%2Fimg3m1.ddimg.cn%2F31%2F20%2F1465705921-1_u_1.jpg)

​		Java并发编程之美阅读总结之-1 : 并发编程线程基础

<!--more-->

## 一. 并发编程线程基础

### 1. 什么是线程

1.  线程是进程中的一个实体, 线程本身是不会独立存在的;
2.  进程是代码在数据集合上的一次运行活动, 是系统进行资源分配和调度的基本单位;
3.  线程是进程中的一个的执行路径, 一个进程中至少有一个线程, 进程中的多个线程共享进程的资源;
4.  <font color="#0000FF">操作系统再分配资源时, 把资源分派给进程</font>
5.  <font color="#0000FF">但是CPU资源比较特殊, 直接分配给线程的!因为真正占用Cpu的还是线程</font>
6.  <font color="#FF0000">一个进程中的多个线程共享进程中的堆和方法区资源, 但是每个线程有自己的程序计数器和栈区域;</font>
7.  程序计数器是一块内存区域, 用来记录线程当前要执行的指令地址;
8.  由于CPU一般是采用时间片轮询的方式让线程轮询占用的, 所以当前线程用完分配的时间片之后, 要让出CPU给其他线程, 而之前的线程通过程序计数器来恢复之前运行的状态, 这也是将程序计数器设计为私有的原因;
9.  <font color="#FF0000">注意: 对于java而言, 如果执行的是native方法, 则pc计数器记录的是undefined地址, 只有执行Java代码时, pc计数器记录的才是下一条指令的地址!</font>
10.  对于每个线程内部的局部变量: <font color="#FF0000">由于每个线程都有自己的栈资源, 所以局部变量线程私有, 其他线程无法访问.</font>
11.  对于堆: <font color="#FF0000">进程为单位, 且是进程中最大的一块内存. 堆是被所有线程共享的(主要存放new出的对象/反射动态创建的实例等). 被所有线程共享!!!!</font>
12.  方法区: <font color="#FF0000">又来存放JVM加载的类, 常量及静态变量等信息, 也是线程共享的;</font>

### 2. 线程的创建与运行

Java中有<font color="#FF0000">三种创建线程的方法:</font>

<font color="#0000FF">1. 继承Thread类, 并重写run()方法;</font>

<font color="#0000FF">2. 实现Runnable接口的run()方法;</font>

<font color="#0000FF">3. 使用FutureTask;</font>

#### 1): 继承Thread类方式的实现

```java
/**
 *  创建线程方法之1: 继承Thread 并重写run()方法
 *
 *
 * */
public class ThreadTest {

    // 继承Thread并重写run()
    public static class MyThread extends Thread {
        @Override
        public void run() {
            System.out.println("I am a child thread!");
        }
    }

    public static void main(String[] args) {
        MyThread thread = new MyThread();
        thread.start();
    }

}
```

代码中的MyThread类继承自Thread类, 并重写了run()方法. 在main中创建了一个MyThread实例, 并调用该实例的start方法启动了线程.

**注意:**  

1.  当创建完thread对象之后, 线程并没有启动执行, 直到<font color="#FF0000">调用了start()方法之后, 才真正启动了线程.</font>

2.  

























