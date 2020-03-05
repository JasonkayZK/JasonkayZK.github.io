---
title: Java线程池ThreadPoolExecutor分析与实战
toc: false 
date: 2020-02-06 22:37:43
cover: http://api.mtyqx.cn/api/random.php?11
categories: 并发编程
tags: [并发编程, 线程池]
description: 本篇通过手写一个简单的线程池, 展现了Java线程池有关的内容, 并给出简单使用的实例
---

本篇通过手写一个简单的线程池, 展现了Java线程池有关的内容, 并给出简单使用的实例

本文内容:

-   手写一个简单的线程池
-   通过JDK使用一个线程池

源代码：https://github.com/JasonkayZK/Java_Samples/tree/java-threadpool

<br/>

<!--more-->

系列文章入口:

-   [Java线程池ThreadPoolExecutor分析与实战](https://jasonkayzk.github.io/2020/02/06/Java线程池ThreadPoolExecutor分析与实战/)
-   [Java线程池ThreadPoolExecutor分析与实战续](https://jasonkayzk.github.io/2020/03/04/Java线程池ThreadPoolExecutor分析与实战续/)
-   [Java线程池ThreadPoolExecutor分析与实战终](https://jasonkayzk.github.io/2020/03/05/Java线程池ThreadPoolExecutor分析与实战终/)

<br/>

## 前言

其实这篇文章一个月之前就想写了, 但是说实话JUC包里面的内容实在是太多了, 不知道从何讲起, 一直拖到现在hhh~

今天学习手写了一个很简单的线程池, 打算简单总结一下

<br/>

## 一.手写一个简单的线程池

在手写这个简单的线程池之前, 再啰嗦一句:

我个人认为: **线程池是典型的消费者生产者模型:** 放入一个Task就相当于生产者进行了一个生产, (调用run方法)完成一个Task就相当于进行了一个消费

所以, 通过Java中的阻塞队列, 我们可以很容易的模拟一个生产者/消费者模型, 从而实现一个线程池

### 创建一个Pool接口

创建一个Pool接口来作为ThreadPool的顶级接口, 抽象线程池的行为

Pool.java

```java
package top.jasonkayzk.core;

import java.util.concurrent.Executor;

/**
 * 线程池定级接口
 */
public interface Pool extends Executor {
    /**
     * 添加任务(并非执行)
     *
     * @param runnable 任务
     */
    @Override
    void execute(Runnable runnable);

    /**
     * 停止线程池(让线程执行完任务在停止)
     */
    void shutDown();

    /**
     * 添加工作者
     *
     * @param num 添加工作者数量
     */
    void addWorker(int num);

    /**
     * 移除工作者
     *
     * @param num 移除工作者数量
     */
    void removeWorker(int num);

    /**
     * 获取线程池大小
     *
     * @return 当前线程池大小
     */
    int poolSize();

    /**
     * 强转停止线程池(不管是否有任务,都停止)
     */
    void shutDownNow();
}
```

接口中的方法大概就是: 执行任务, 获取池大小, 修改池大小, 停止, 强制停止等;

下面再来看一下线程池的实现类

### 线程池实现类SimpleThreadPool

SimpleThreadPool.java

```java
package top.jasonkayzk.core;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

/**
 * 自己写的一个线程池
 * <p>
 * 使用java并发库下的阻塞队列来做,这样我们就不需要做额外的同步跟阻塞操作
 *
 * @author zk
 */
public class SimpleThreadPool implements Pool {

    /**
     * 存储工作的阻塞队列
     */
    private final BlockingQueue<Runnable> jobs = new LinkedBlockingQueue<>();

    /**
     * 存储工作线程的阻塞队列
     */
    private final BlockingQueue<Worker> workers = new LinkedBlockingQueue<>();

    /**
     * 指定池中线程大小进行初始化
     *
     * @param num 初始化线程池中线程数量
     */
    public SimpleThreadPool(int num) {
        initPool(num);
    }

    /**
     * 初始化线程池, 创建num个worker
     *
     * @param num 工人数
     */
    private void initPool(int num) {
        for (int i = 0; i < num; i++) {
            Worker worker = new Worker();
            workers.add(worker);
            worker.start();
        }
    }

    @Override
    public int poolSize() {
        return workers.size();
    }

    @Override
    public void execute(Runnable runnable) {
        if (runnable != null) {
            jobs.add(runnable);
        }
    }

    /**
     * 关闭线程池:
     * <p>
     * 通过不断的循环来判断,任务队列是否已经清空,
     * 如果队列任务清空了,将工作者队列的线程停止
     * 打破循环,清空工作者队列
     */
    @Override
    public void shutDown() {
        while (true) {
            if (jobs.size() == 0) {
                for (Worker worker : workers) {
                    worker.stopRunning();
                }
                break;
            }
        }
        workers.clear();
    }

    /**
     * 添加新的工作者到工作者队列尾部
     */
    @Override
    public void addWorker(int num) {
        for (int i = 0; i < num; i++) {
            Worker worker = new Worker();
            workers.offer(worker);
            worker.start();
        }
    }

    /**
     * 移除工作者阻塞队列头部的线程
     */
    @Override
    public void removeWorker(int num) {
        for (int i = 0; i < num; i++) {
            try {
                workers.take().stopRunning();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * 强行清空任务队列, 然后调用停止线程池的方法
     */
    @Override
    public void shutDownNow() {
        jobs.clear();
        shutDown();
    }

    private class Worker extends Thread {
        /**
         * 通过volatile修饰的变量,保证变量的可见性,从而能让线程马上得知状态
         */
        private volatile boolean isRunning = true;

        @Override
        public void run() {
            // 通过自旋不停的从任务队列中获取任务
            while (isRunning) {
                Runnable runnable = null;
                try {
                    // 如果工作队列为空,则阻塞
                    runnable = jobs.poll(1, TimeUnit.SECONDS);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }

                // 获取的工作不为空, 执行
                if (runnable != null) {
                    System.out.println(getName() + " --> ");
                    runnable.run();
                }

                // 睡眠100毫秒, 验证shutdown是否是在任务执行完毕后才会关闭线程池
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            System.out.println(getName() + "销毁...");
        }
        public void stopRunning() {
            this.isRunning = false;
        }
    }
}
```

><br/>
>
>**代码说明:**
>
>**① 线程池属性**
>
>SimpleThreadPool中定义了两个阻塞队列类型的属性jobs和workers, 分别用来存储传递进来的工作(Runnable接口的实现类)和线程池中的工人
>
>****
>
>**② 内部类Worker**
>
>Worker继承自Thread, 同时也是线程池中真正执行job的类**(而线程池只负责创建, 管理和维护)**
>
>首先, Worker类中定义了一个isRunning标识当前工作线程的生命周期(是否在运行);
>
>>   <br/>
>>
>>   **事实上Java线程的声明周期有多个: 如new, runnable, running, blocked, dead**
>>
>>   **而blocked又被分为: 等待(如调用wait()方法)和锁定(如调用同步方法)**
>
>而这个属性通过volatile修饰, 保证变量的可见性, 能让线程马上得知状态(而停止)
>
>然后重写了父类Thread的run方法, 重点看一下这个run方法:
>
>```java
>@Override
>public void run() {
>    // 通过自旋不停的从任务队列中获取任务
>    while (isRunning) {
>        Runnable runnable = null;
>        try {
>            // 如果工作队列为空,则阻塞
>            runnable = jobs.poll(1, TimeUnit.SECONDS);
>        } catch (InterruptedException e) {
>            e.printStackTrace();
>        }
>
>        // 获取的工作不为空, 执行
>        if (runnable != null) {
>            System.out.println(getName() + " --> ");
>            runnable.run();
>        }
>
>        // 睡眠100毫秒, 验证shutdown是否是在任务执行完毕后才会关闭线程池
>        try {
>            Thread.sleep(100);
>        } catch (InterruptedException e) {
>            e.printStackTrace();
>        }
>    }
>    System.out.println(getName() + "销毁...");
>}
>```
>
>首先Worker通过自旋, 不断的从任务阻塞队列jobs中尝试获取任务:
>
>如果没有获取到任务, 则阻塞, 直到有任务来进行消费;
>
>**这里其实处理的并不是很好:**
>
><font color="#f00">**在`runnable = jobs.poll(1, TimeUnit.SECONDS);`中, 如果不限制超时时间, 则在关闭线程池时当前线程还是处于阻塞状态无法停止**</font>
>
><font color="#f00">**加入了超时之后, 虽然会超时退出, 但是这是一个相当糟糕的做法!(下面会分析源码的处理方法)**</font>
>
>如果获取到了任务, 则直接执行这个任务, 最后返回
>
>最后是停止线程:
>
>stopRunning()方法可以修改isRunning来修改当前worker的状态, 而worker通过判断isRunning自旋来保证获取jobs
>
>所以要让thread停止, 只需要改变isRunning即可
>
>****
>
>**③ 线程池初始化**
>
>SimpleThreadPool构造方法中通过传入num提供初始化线程池大小, 并调用initPool方法完成初始化;
>
>而initPool方法仅仅是创建了num个线程放入workers阻塞队列中;
>
>**本质上线程池也就是解决线程用完即丢, 然后重复创建的问题(因为Java是通过操作系统内核完成线程创建)**
>
>****
>
>**④ 修改线程池大小**
>
>通过addWorker和removeWorker方法完成增删线程;
>
>****
>
>**⑤ 执行任务**
>
>线程池通过execute方法执行任务, 在线程池的内部其实就是将任务放在jobs的阻塞队列中(**等待被消费者消费**)
>
>****
>
>**⑥ 关闭线程池**
>
>关闭线程池有两个方法: shutdown和shutdownNow;
>
>shutdown方法会等待消费队列空了之后再关闭;
>
>而shutdownNow则是直接清空jobs队列**(会造成任务丢失!)**, 然后关闭线程池

通过SimpleThreadPool就可以完成一个ThreadPool最基本的工作

### 手写线程池测试

下面通过线程池完成并发对1~100求和

SimpleThreadPoolTest.java

```java
public class SimpleThreadPoolTest {

    private static AtomicInteger res;

    public static void main(String[] args) throws Exception {
        res = new AtomicInteger(0);

        // 构建一个只有10个线程的线程池
        Pool pool = new SimpleThreadPool(10);
        Thread.sleep(1000);

        // 放100个任务进去, 让线程池进行消费
        for (int i = 1; i < 101; i++) {
            int finalI = i;
            pool.execute(() -> res.getAndAdd(finalI));
        }

        // 移除2个工作者
//        pool.removeWorker(2);
//        System.out.println("线程池大小:" + pool.poolSize());

        // 添加5个工作者
//        pool.addWorker(5);
//        System.out.println("线程池大小:" + pool.poolSize());

        // 验证线程池的消费完任务停止以及不等任务队列清空就停止任务
        System.out.println("停止线程池");
        pool.shutDown();
//        System.out.println("强行停止线程池");
//        pool.shutDownNow();

        System.out.println(res);
    }
}
```

通过创建一个只有10个线程的线程池, 然后通过创建100个任务完成1~100的求和;

当使用shutdown方法关闭时, 线程池会等待任务队列中的任务(100个)完成, 然后退出, 此时输出:

```java
......
Thread-1 --> 
Thread-2 --> 
Thread-7 --> 
5050
Thread-9销毁...
Thread-8销毁...
Thread-0销毁...
Thread-6销毁...
Thread-3销毁...
Thread-7销毁...
Thread-1销毁...
Thread-2销毁...
Thread-4销毁...
Thread-5销毁...
```

而当使用shutdownNow方法关闭时, 则会丢失jobs队列中等待的任务, 此时输出:

```java
强行停止线程池
0
Thread-0销毁...
Thread-9销毁...
Thread-5销毁...
Thread-3销毁...
Thread-7销毁...
Thread-6销毁...
Thread-1销毁...
Thread-2销毁...
Thread-4销毁...
Thread-8销毁...
```

### 小结

通过运行上面的线程池, 可以看出的确实现了线程池的作用, 但是其实上面的实现方法缺点还是很多的, 比如:

-   线程池停止问题;
-   线程池大小没有做越界判断;
-   过多的sleep方法影响性能等等;

下面先看一下JDK自带的线程池是如何实现的;

>   <br/>
>
>   关于线程池更多内容、原理和源码剖析见: [Java线程池ThreadPoolExecutor分析与实战续](https://jasonkayzk.github.io/2020/03/04/Java线程池ThreadPoolExecutor分析与实战续/)

<br/>

## 二.通过JDK使用一个线程池

下面通过Executors获取一个FixedThreadPool, 来完成和上面相同的任务

代码如下:

```java
/**
 * 通过JDK提供的线程池计算1~100求和
 */
public class JdkThreadPoolTest {

    private static AtomicInteger res;

    public static void main(String[] args) throws InterruptedException {
        res = new AtomicInteger(0);
        ExecutorService executorService = Executors.newFixedThreadPool(10);

        for (int i = 1; i < 101; i++) {
            int finalI = i;
            executorService.execute(() -> res.getAndAdd(finalI));
        }

        executorService.shutdown();
        while (true) {
            if (executorService.isTerminated()) {
                System.out.println("结束了！");
                break;
            }
            Thread.sleep(200);
        }
        System.out.println(res);
    }
}
```

最后通过自旋调用`executorService.isTerminated()`判断线程池中的任务是否已经结束, 最后输出结果:

```
结束了！
5050
```

可见结果也是正确的!

<br/>

## 后记

上面通过自己实现了一个线程池, 初步理解了线程池的工作原理, 下一篇文章将会分享Java中自带的线程池源码, 并分析四种线程池: 

关于线程池更多内容、原理和源码剖析见: [Java线程池ThreadPoolExecutor分析与实战续](https://jasonkayzk.github.io/2020/03/04/Java线程池ThreadPoolExecutor分析与实战续/)

## 附录

源代码：https://github.com/JasonkayZK/Java_Samples/tree/java-threadpool

文章参考：

-   [自己手动实现一个简单的线程池](https://my.oschina.net/u/2278977/blog/1515221)
-   [Java线程池-ThreadPoolExecutor原理分析与实战](https://blog.csdn.net/z_s_z2016/article/details/81674893)