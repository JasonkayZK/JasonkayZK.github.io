---
title: Java并发总结-1
toc: true
date: 2019-09-10 16:49:37
categories: 并发编程
tags: [并发编程, 多线程]
description: 最近在看Java并发编程之美, 做的一些比较重要的总结.
---

![Java并发编程之美](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1567750837551&di=fae22e8ce73ecbc87820964da733b106&imgtype=0&src=http%3A%2F%2Fimg3m1.ddimg.cn%2F31%2F20%2F1465705921-1_u_1.jpg)

<br/>		Java并发编程之美阅读总结之-1 : 并发编程线程基础

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



----------------------

### 2. 线程的创建与运行

Java中有<font color="#FF0000">三种创建线程的方法:</font>

<font color="#0000FF">1. 继承Thread类, 并重写run()方法;</font>

<font color="#0000FF">2. 实现Runnable接口的run()方法;</font>

<font color="#0000FF">3. 使用FutureTask;</font>

#### 1): 继承Thread类方式的实现[不推荐]

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

代码中的`MyThread`类继承自Thread类, 并重写了run()方法. 在main中创建了一个MyThread实例, 并调用该实例的start方法启动了线程.

**注意:**  

-   当创建完thread对象之后, 线程并没有启动执行, 直到<font color="#FF0000">调用了`start()`方法之后, 才真正启动了线程.</font>
-   其实调用`start()`方法并没有马上执行, 而是使线程处于了就绪状态, 即*该线程已经获取了<font color="#ff0000">除CPU资源以外的其他资源, 等待获取CPU资源后才会真正处于运行状态!</font>*

使用*继承方法*的好处:

在`run()方法`内部直接获取当前线程直接使用`this`即可, 而无需使用`Thread.currentThread()`方法;

使用`继承`不好:

如果继承了Thread类, 则无法再继承其他类; 且任务与代码没有分离, 当多个线程执行相同的任务时, 需要多份任务代码!

#### 2): 使用Runnable接口的run方法[无返回值]

```java
public class ThreadTest2 {
    public static class RunableTask implements Runnable {

        @Override
        public void run() {
            System.out.println("I am a child thread");
        }
    }

    public static void main(String[] args) {
        RunableTask task = new RunableTask();
        new Thread(task).start();
        new Thread(task).start();
    }
}
```

上面的代码中, 两个线程共用同一个task代码逻辑, 如果需要, 也可以通过给`RunableTask`添加参数来进行任务区分.

此外, `RunableTask`可以继承其他类. 但是上面介绍的两种方法有一个共同的缺点: *任务没有返回值!*

#### 3): FutureTask方式[有返回值]

```java
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.FutureTask;

public class ThreadTest3 {
    // 创建任务类, 类似于Runnable
    public static class CallerTask implements Callable<String> {

        @Override
        public String call() throws Exception {
            return "hello";
        }
    }

    public static void main(String[] args) {
        // 创建异步任务
        FutureTask<String> futureTask = new FutureTask<>(new CallerTask());
        // 启动线程
        new Thread(futureTask).start();
        try {
            // 等待任务执行完毕, 并返回结果
            System.out.println(futureTask.get());
        } catch (ExecutionException e) {
            e.printStackTrace();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

上述代码中的`CallerTask`类实现了`Callable`接口的`call()`方法. 在main函数中首先<font color="#ff0000">创建了一个`FutureTask`对象(构造方法为`CallerTask`实例),</font> 然后使用创建的`FutureTask`对象作为任务创建了一个线程并启动, 最后<font color="#00ff00">通过`futureTask.get()`等待任务执行完毕并返回结果.</font>

#### 4): 三种创建线程方法的总结

-   使用继承方法的好处是: 

方便传参, 可以在子类中添加成员变量, 并通过`setter`方法设置参数或通过构造函数进行传递, 而*使用Runnable方法, 则只能使用主线程里面被声明为final的变量(Java 8之前).*

-   使用Runnable接口方法

Java不支持多继承, 如果继承了`Thread类`, 则子类无法再继承其他类, 而`Runnable方法`没有限制.

-   使用`FutrueTask`方法

可以拿到任务返回的结果!



-------------------------------

### 3. 线程的通知与等待

Java中的`Object类`是所有类的父类, 而Java把所有类都需要的方法放到了Object类中, 其中就包括了一些线程方法!

#### 1): *wait()函数*

<font color="#00ff00">当一个线程调用一个共享变量的`wait()方法`时, 调用线程会被阻塞挂起, 直到发生下面几个事情之一才返回:</font>

-   其他线程调用了该对象的`notify()`或者`notifyAll()`方法;
-   其他线程调用了该线程的`interrupt()方法`, 该线程抛出`InterruptedException`异常返回.



一个线程如何获取一个共享变量的`监视器锁`呢?

-   执行`synchronized`同步代码块时, 使用该共享变量作为参数

```java
synchronized (共享变量) {
    //doSomething
}
```



-   调用该共享变量的方法, 并且该方法使用了`synchronized`修饰!

``` java
synchronized void add(int a, int b) {
    // doSomething
}
```

此外需要注意的是:

<font color="#ff0000">一个线程可以从`挂起状态`变为`可运行状态(被唤醒)`, 即使该线程没有被其他线程调用`notify(), notifyAll()`方法进行通知, 或者被中断, 或者等待超时, 即所谓的: *`虚假唤醒`*</font>

虽然虚假唤醒很少发生, 但是要防范于未然, <font color="#ff0000">可通过在一个循环中调用`wait()`方法进行防范!</font>

```java
synchronized (obj) {
    while (条件不满足) {
        obj.wait();
    }
}
```

**上述代码是经典的调用共享变量的`wait()`方法的实例**: <font color="#ff0000">首先通过同步块获取obj的监视器锁, 然后在while循环中调用obj的`wait()`方法.</font>

-   例: 生产者与消费者

```java
import java.util.LinkedList;
import java.util.Queue;

public class QueueDemo {

    private static final int MAX_SIZE = 10;
    private static Queue<Integer> queue = new LinkedList<>();


    // 生产者模型
    public static class Producer implements Runnable {

        private int ele;

        public Producer(int ele) {
            this.ele = ele;
        }

        @Override
        public void run() {
            synchronized (queue) {
                // 消费者队列满, 等待队列空闲
                while (queue.size() == MAX_SIZE) {
                    System.out.println("消费者队列已满, 等待中!");
                    try {
                        // 挂起当前线程, 并且释放同步块获取的queue上的锁,
                        // 让消费者可以获取该锁, 然后消费队列元素
                        queue.wait();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }

                // 空闲时则生成元素, 并通知消费者!
                queue.add(ele);
                queue.notifyAll();
            }
        }
    }

    // 消费者模型
    public static class Consumer implements Runnable {

        @Override
        public void run() {
            synchronized (queue) {

                // 消费者队列为空
                while (queue.size() == 0) {
                    System.out.println("消费者队列为空, 等待中");
                    // 挂起当前线程, 并释放同步锁获取的queue上的监视器锁,
                    // 让生产者可以获取该锁, 将生产元素放入队列
                    try {
                        queue.wait();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }

                }

                // 消费元素, 并通知唤醒生产者线程
                System.out.println(queue.poll());
                queue.notifyAll();
            }
        }
    }


    public static void main(String[] args) {
        // 20个生产者
        for (int i = 0; i < 20; ++i) {
            new Thread(new Producer(i)).start();
        }
        // 20个消费者
        for (int i = 0; i < 20; ++i) {
            new Thread(new Consumer()).start();
        }

    }
}

```

上述代码中, 其中`queue`为共享变量, 生产者线程在调用`queue`的`wait()`方法之前, 使用了`synchronized`关键字拿到了该共享变量`queue`的监视器锁, 所以才不会在调用`wait()方法`时不会抛出`IllegalMonitorStateException`异常!

部分输出结果:

```
4
消费者队列已满, 等待中!
5
消费者队列已满, 等待中!
消费者队列已满, 等待中!
消费者队列已满, 等待中!
消费者队列已满, 等待中!
6
消费者队列已满, 等待中!
消费者队列已满, 等待中!
消费者队列已满, 等待中!
7
消费者队列已满, 等待中!
消费者队列已满, 等待中!
8
消费者队列已满, 等待中!
9
17
18
14
19
```



如果当前队列无空闲容量则会调用`queue`的`wait()`方法挂起线程, 而使用`while`就是防止*虚假唤醒*问题! **若当前线程被虚假唤醒, 但是队列无空余容量时, 当前线程仍然会调用wait方法把自己挂起**

**注**:

-   上述生产者线程A发现当前线程已满, 会调用方法`queue.wait()`阻塞自己, 并<font color="#ff0000">释放获取的queue的锁!</font>

如果不释放该锁, 由于其他生产者和消费者线程都已被阻塞, 则线程A也被挂起, 最终形成死锁!

-   <font color="#ff0000">当前线程调用共享变量的`wait()`方法后, 只会释放当前共享变量上的锁, 如果当前变量还持有其他共享变量的锁, 则这些变量不会被释放!</font>例: 

```java
public class TwoLockWait {

    // 创建资源
    private static volatile Object resourceA = new Object();
    private static volatile Object resourceB = new Object();

    public static void main(String[] args) throws InterruptedException {
        Thread threadA = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    // 获取A的监视器锁
                    synchronized (resourceA) {
                        System.out.println("ThreadA get resourceA lock");
                        // 获取B的监视器锁
                        synchronized (resourceB) {
                            System.out.println("ThreadA get resourceB lock");
                            // 线程A阻塞, 并释放A的锁
                            System.out.println("ThreadA release resourceA lock");
                            resourceA.wait();
                        }
                    }
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });

        Thread threadB = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    // 休眠一秒, 确保ThreadA获取锁
                    Thread.sleep(1000);

                    // 获取A
                    synchronized (resourceA) {
                        System.out.println("ThreadB get resourceA lock");

                        System.out.println("ThreadB try get resourceB lock...");
                        // 获取B的锁
                        synchronized (resourceB) {
                            System.out.println("ThreadB get resourceB lock");

                            // 线程B阻塞, 并释放A的锁
                            System.out.println("ThreadB release resourceA lock");
                            resourceA.wait();
                        }
                    }
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });

        // 启动线程
        threadA.start();
        threadB.start();

        // 等待两个线程结束
        threadA.join();
        threadB.join();

        System.out.println("main over");
    }
}
```

输出结果如下:

```
ThreadA get resourceA lock
ThreadA get resourceB lock
ThreadA release resourceA lock
ThreadB get resourceA lock
ThreadB try get resourceB lock...

// 程序尚未结束!
```

上述代码中, 在main函数启动了线程A, 线程B. 为了让A先获得锁, 让线程B先休眠了1s. 线程A先后获取`资源A`和`资源B`的锁, 然后调用了`resourceA的wait()`方法, 阻塞自己并释放`资源A`的锁.

线程B休眠结束后, 首先尝试获取`资源A`的锁, 成功. 然后尝试获取`资源B`的锁. <font color="#ff0000">由于线程A调用的是`资源A`的`wait()`方法, 所以线程A挂起后, 并没有释放`资源B`的锁!所以线程B尝试获取`资源B`的锁会被阻塞. 最终形成死锁!</font>

也证明了: <font color="#ff0000">当线程调用共享对象的`wait()`方法时, 当前线程只会释放当前共享对象的锁, 而当前线程持有的其他共享对象的监视器锁并不会释放!</font>



-   <font color="#ff0000">当一个线程调用共享对象的`wait()`方法被阻塞挂起后, 如果其他线程中断了该线程, 则该线程会抛出`Interrupted Exception`异常并返回!</font>例:

```java
public class WaitAndInterrupted {

    private static Object obj = new Object();

    public static void main(String[] args) throws InterruptedException {

        // 创建线程
        Thread threadA = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    System.out.println("--begin--");
                    // 阻塞当前线程
                    synchronized (obj) {
                        obj.wait();
                    }
                    System.out.println("--end--");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });

        threadA.start();

        Thread.sleep(1000);

        System.out.println("--begin interrupt threadA");
        threadA.interrupt();
        System.out.println("--end interrupt threadA");
    }
}

```

上述代码中, `threadA`调用共享对象obj的`wait()`方法之后阻塞了自己. 而主线程在休眠1s之后, 中断了`threadA`线程, 中断后在`obj.wait()`处抛出`java.lang.InterruptedException`并终止返回.



#### 2): wait(long timeout)函数

相比`wait()`方法多了一个超时参数. 不同之处在于: <font color="#00ff00">如果一个线程调用共享对象的该方法挂起后, 没有被指定的`timeout ms`时间段内被其他线程调用该变量的`notify()或notifyAll()`方法唤醒, 则该函数还是会因为超时而退出! </font>

-   <font color="#ff0000">如果将`timeout 设置为0`则和`wait()`方法一致!</font>

-   <font color="#ff0000">如果传递了一个`负的timeout`抛出异常!</font>



#### 3): wait(long timeout, int nanos)函数

在内部调用的是`wait(long timeout)`方法, 有在`nanos > 0`时, 才使参数`timeout递增1`



#### 4): notify()函数

一个线程调用共享对象的`notify()`方法后, 会唤醒**一个**在该变量上调用`wait`方法后被挂起的线程. <font color="#ff0000">一个共享变量上可能有多个线程在等待, 具体唤醒那个等待的线程是随机的!</font>

此外: <font color="#ff0000">被唤醒的线程不能马上从`wait`方法返回! 必须在获得了共享对象的监视器锁后才可以返回! </font>

即: <font color="#00ff00">唤醒他的线程释放了共享变量上的锁后, 被唤醒的线程也不一定会获取到共享对象的监视器锁, 因为还需要和其他线程一起竞争该锁!</font>

<font color="#ff0000">类似于`wait`方法, 只有当前线程获取了共享变量的监视器锁后, 才可以调用共享变量的`notify()`方法, 否则抛出`IllegalMonitorStateException`



#### 5): notifyAll()函数

不同于`notify()`唤醒单个线程, `notifyAll()`唤醒在该共享变量上由于`wait`方法而被挂起的**所有线程**!

例:

```java
public class NotifyAndNotifyAllDemo {

    // 创建资源
    private static volatile Object resourceA = new Object();

    public static void main(String[] args) throws InterruptedException {

        // 创建线程
        Thread threadA = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (resourceA) {
                    System.out.println("threadA get A lock");

                    try {
                        System.out.println("threadA begin wait");
                        resourceA.wait();
                        System.out.println("threadA end wait");
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }
        });

        Thread threadB = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (resourceA) {
                    System.out.println("threadB get A lock");
                    try {
                        System.out.println("threadB begin wait");
                        resourceA.wait();
                        System.out.println("threadB end wait");
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }
        });

        Thread threadC = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (resourceA) {
                    System.out.println("threadC begin notify");
                    resourceA.notify();
//                    resourceA.notifyAll();
                }
            }
        });

        threadA.start();
        threadB.start();

        Thread.sleep(1000);
        threadC.start();

        threadA.join();
        threadB.join();
        threadC.join();

        System.out.println("main over");
    }
}
```

上述代码开启了三个线程, 其中线程A和线程B分别调用了`resourceA`的`wait()`方法, 线程C则调用了`notify()`方法. 这个例子试图在*线程A和线程B都因为调用`wait()`方法而被阻塞后, 通过线程C调用`resourceA.notify()`方法, 从而唤醒线程A和线程B.* 但结果: <font color="#ff0000">只有线程A被唤醒, 线程B没有被唤醒!</font>

结果如下:

```
threadA get A lock
threadA begin wait
threadB get A lock
threadB begin wait
threadC begin notify
threadA END wait
```



-   将`notify`改为`notifyAll`

则结果为:

```
threadA get A lock
threadA begin wait
threadB get A lock
threadB begin wait
threadC begin notify
threadB end wait
threadA end wait
main over
```

从结果可以看出, 当使用`notifyAll()`唤醒时: <font color="#00ff00">线程A和线程B都会被唤醒, 只是线程B先获得了`resourceA`上的锁, 从`wait()`方法返回. 线程B执行完毕后, 线程A又获取了`resourceA`上面的锁, 并返回.</font>

**注:**

<font color="ff0000">在共享变量上调用`notifyAll()`方法只会唤醒这个*方法前调用了`wait`方法而被放入共享变量等待集合里面的线程*. 如果调用`notifyAll()`后一个线程调用了这个共享变量的`wait()`方法, 则不会被唤醒</font>



-------------------------------------



### 4. 等待线程终止的join方法

项目中经常碰到: *需要等待某几件事完成之后, 才能继续向下执行*, 如: 多个线程加载资源, 需要等待多个资源全部加载完毕再汇总处理. 在`Thread类`中有一个`join`方法可以做这个.

例:

```java
public class JoinDemo {

    public static void main(String[] args) throws InterruptedException {
        Thread threadOne = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }

                System.out.println("child thread-one over!");
            }
        });

        Thread threadTwo = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }

                System.out.println("child thread-two over!");
            }
        });

        threadOne.start();
        threadTwo.start();

        System.out.println("wait all child thread over!");

        threadOne.join();
        threadTwo.join();

        System.out.println("all child thread over!");
    }
}

```

如上代码, 在主线程中创建并启动了两个子线程, 然后分别调用了他们的`join()`方法, 则:<font color="00ff00">主线程首先会在调用`threadOne.join()`后被阻塞, 等待`threadOne`执行完毕后返回! `threadOne`执行完毕后, 主线程继续调用`threadTwo.join()`方法再次被阻塞, 等待`threadTwo`执行完毕后返回!</font>

此外, 当线程A调用了线程B的`join`方法后会被阻塞. 当其他线程调用了线程A的`interrupt()`方法中断了线程A之后, 线程A会抛出`InterruptedException`异常而返回!

例:

```java
public class JoinInterrupted {

    public static void main(String[] args) {
        Thread threadOne = new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("thread-one begin run!");
                for(; ;) {

                }
            }
        });

        // 获取主线程
        final Thread mainThread = Thread.currentThread();

        Thread threadTwo = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                mainThread.interrupt();
            }
        });

        // 启动子线程
        threadOne.start();

        // 延迟一秒启动中断线程
        threadTwo.start();

        // 等待线程one结束
        try {
            threadOne.join();
        } catch (InterruptedException e) {
            System.out.println("main thread: " + e);
        }
    }
}

```

上代码在`threadOne`线程中执行死循环, 主线程调用`threadOne的join()方法`**阻塞自己**, 等待线程`threadOne`执行完毕. 当`threadTwo`休眠1秒后会主动调用主线程的`interrupt()`方法设置主线程的中断标志. 此时主线程在`threadOne.join()`处抛出异常. 注: <font color="ff0000">在`threadTwo`线程中调用的是主线程的`interrupt()`方法, 而不是线程`threadOne`的! 所以程序并不会结束(线程`threadOne`仍在运行)</font>



### 5. 让线程睡眠的sleep方法

`Thread类`中有一个静态的`sleep方法`, 当一个执行中的线程调用了`Thread的sleep方法`后, 调用线程会暂时让出指定时间的执行权, 即: 

-   <font color="00ff00">此期间不参与CPU调度</font>
-   <font color="ff0000">但是该线程所拥有的监视器资源, 比如锁是持有而不让出的!</font>
-   <font color="ff0000">指定的睡眠时间到了之后, 该函数会正常返回. 此时线程处于就绪状态, 然后参与CPU的调度;</font>
-   <font color="ff0000">如果在睡眠期间其他线程调用了该线程的`interrupt()`方法中断了该线程, 则该线程会在调用`sleep`方法的地方抛出`InterruptedException`异常而返回</font>

**例1:**

```java
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class SleepTest {

    // 创建一个独占锁
    private static final Lock lock = new ReentrantLock();

    public static void main(String[] args) {
        Thread threadA = new Thread(new Runnable() {
            @Override
            public void run() {
                // 获取独占锁
                lock.lock();

                try {
                    System.out.println("child threadA is in sleep");

                    Thread.sleep(5000);
                    System.out.println("child threadA is awake");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    lock.unlock();
                }
            }
        });

        Thread threadB = new Thread(new Runnable() {
            @Override
            public void run() {
                lock.lock();
                try {
                    System.out.println("child threadB is in sleep");
                    Thread.sleep(5000);
                    System.out.println("child threadB is awake");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    lock.unlock();
                }
            }
        });

        threadA.start();
        threadB.start();

    }

}

```

上例子说明了: <font color="ff0000">线程在睡眠时, 拥有的监视器资源不会被释放!</font>

首先创建了一个独占锁. 然后创建了两个线程, 每个线程在内部先获取锁, 然后睡眠. 睡眠之后会释放锁. 



**例2:**

```java
package club.jasonkayzk666.chapter1.lesson5.sleep;

public class SleepInterrupt {

    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    System.out.println("child thread is in sleep");
                    Thread.sleep(10000);
                    System.out.println("child thread is in awake");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });

        thread.start();
        Thread.sleep(2000);

        thread.interrupt();

    }
}

```

子线程在睡眠的时候, 主线程中断了它. 所以子线程在调用sleep方法处抛出了`InterruptedException`异常.

此外: *如果在调用`Thread.sleep(long millis)`时, 为参数传递了一个负数, 将会抛出异常.*



--------------------

### 6. 让出CPU执行权的yield方法

`Thread类`中存在一个静态的`yield`方法, 当线程调用`yield`方法时, 实际上就是在暗示线程调度器当前线程请求让出自己的CPU使用.<font color="#ff0000">但是线程调度器可以无条件忽略这个暗示!</font>

<font color="#00ff00">当一个线程调用了`yield`方法时, 当前线程会让出CPU使用权, 然后处于就绪状态, 线程调度器会从线程就绪队列中获取一个线程优先级最高的线程.当然也有可能会调度到刚刚让出CPU的那个线程来获取CPU执行权.</font>

例:

```java
package club.jasonkayzk666.chapter1.lesson6.yield;

public class YieldTest implements Runnable {

    YieldTest() {
        // 创建并启动线程
        new Thread(this).start();
    }

    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            // 当i = 0时, 让出CPU执行权, 放弃时间片, 进行下一论调度
            if (i % 5 ==0) {
                System.out.println(Thread.currentThread() + "yidld cpu...");

                // 当前线程让出CPU执行权, 放弃时间片, 进行下一论调度
                // Thread.yield();
            }
        }

        System.out.println(Thread.currentThread() + " is over");
    }

    public static void main(String[] args) {
        new YieldTest();
        new YieldTest();
        new YieldTest();
    }
}

```

上面的代码开启了三个线程, 每个线程都一样, 在`for循环`中执行5次打印. 运行多次后, 下面结果出现次数最多:

```
Thread[Thread-0,5,main]yidld cpu...
Thread[Thread-0,5,main] is over
Thread[Thread-1,5,main]yidld cpu...
Thread[Thread-1,5,main] is over
Thread[Thread-2,5,main]yidld cpu...
Thread[Thread-2,5,main] is over
```

解开`Thread.yield()`的注释在执行, 结果如下:

```
Thread[Thread-1,5,main]yidld cpu...
Thread[Thread-2,5,main]yidld cpu...
Thread[Thread-0,5,main]yidld cpu...
Thread[Thread-1,5,main] is over
Thread[Thread-0,5,main] is over
Thread[Thread-2,5,main] is over
```

从结果可知: <font color="#00ff00"> `Thread.yield()方法`生效了. 三个线程线程分别在`i = 0`时调用了`Thread.yield()`方法, 所以三个线程自己的两行没有输出在一起, 因为输出了第一行之后, 当前线程让出了CPU使用权.</font>

**总结:**

<font color="#ff0000">`sleep`与`yield`方法的区别在于, 当线程调用`sleep`方法时, 调用线程会被阻塞指定时间, 在此期间线程不会被调度; 而使用`yield`方法, 线程只是让出自己剩余的时间片, 并没有被阻塞挂起, 而是处于就绪状态, 调度器*下一次就有可能调度到当前线程执行*</font>



--------------------------

### 7. 线程中断

Java中的线程中断是一种*线程间的协作模式*.

<font color="#ff0000">通过设置线程的中断标志并不能直接终止该线程的执行! 而是被中断的线程根据中断状态自行处理!</font>

#### 1): `void interrupt()方法`:

中断线程.

例如: 当线程A运行时, 线程B可以调用线程A的`interrupt()方法`来**设置线程A的中断标志为true并立即返回.**

<font color="#ff0000">设置标志仅仅是设置标志, 线程A实际并没有被中断, 而是会继续向下执行! 如果线程A因为调用了`wait, join, sleep`方法而被阻塞挂起, 此时线程A会抛出`InterruptedException`异常.</font>



#### 2): `boolean isInterrupted()`: 

检测当前线程是否被中断;

**注:** <font color="#ff0000">只检测, 而不清除中断标志</font>



#### 3): `boolean interrupted()`: 

检测当前线程是否被中断. 

<font color="#ff0000">若发现当前线程被中断, 则会清除中断标志, 并且该方法为*`静态方法`*, 可以通过`Thread类`直接调用. (*获取当前调用线程的中断标志, 而不是调用`interrupted()`方法的实例对象!!!!!*)</font>

``` java
public static boolean interrupted() {
    // 清除中断标志
    return currentThread().isInterrupted(true);
}
```



**例: **利用`Interrupted`优雅退出

```java
public void run() {
    try {
        ....... 
        // 线程退出条件
        while (!Thread.currentThread().isInterrupted() && more work to do) {
            // do more work
        } catch (InterruptedException e) {
            // thread was interrupted during sleep or wait
        } finally {
            // cleanup, if required
        }
    }
}
```

**例2: **根据中断标志判断线程是否终止的例子

```java
package club.jasonkayzk666.chapter1.lesson7.interrupt;

public class InterruptTest {

    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                while (!Thread.currentThread().isInterrupted()) {
                    System.out.println(Thread.currentThread() + " hello");
                }
            }
        });


        thread.start();

        Thread.sleep(1000);

        System.out.println("main thread interrupt thread");
        thread.interrupt();

        thread.join();
        System.out.println("main is over");
    }
}

```

输出结果如下:

```
.....................
Thread[Thread-0,5,main] hello
Thread[Thread-0,5,main] hello
main thread interrupt thread
Thread[Thread-0,5,main] hello
main is over
```

上述代码中, 子线程`thread`通过检查当前线程中断标志来控制是否退出循环, 主线程休眠1秒后调用`thread的interrupt()方法`设置了中断标志, 所以线程`thread`退出了循环.



还有一些情况比如: 当线程为了等待一些特定条件的到来时, 一般会调用`sleep`方法, `wait`或者`join()`来阻塞当前进程. 如: 一个线程调用了`Thread.sleep(3000)`. 则在调用时会一直阻塞, 直到3s后才变为激活状态! 但是有可能在3s内条件已经满足, 如果等待3s后再返回有点浪费时间, 此时可以使用`interrupt()`方法, 强制让`sleep`抛出异常而返回, 线程转为激活态.

**例:**

```java
package club.jasonkayzk666.chapter1.lesson7.interrupt;

public class InterruptSleep {

    public static void main(String[] args) throws InterruptedException {
        Thread threadOne = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    System.out.println("thread-one begin sleep for 2000 seconds");
                    Thread.sleep(2000000);
                    System.out.println("thread-one awaking");
                } catch (InterruptedException e) {
                    System.out.println("thread-one is interrupted while sleeping");
                    return;
                }

                System.out.println("thread-one leaving normally");
            }
        });

        threadOne.start();

        Thread.sleep(1000);

        threadOne.interrupt();

        threadOne.join();

        System.out.println("main thread is over");
    }
}

```

线程one休眠了2000秒, 在正常情况下线程需要2000s才可以被唤醒. 但是通过`threadOne.interrupt()`方法, 打断了线程的休眠, 并捕获抛出的异常.

**例2:** `interrupted()`与`isInterrupted()`区别

```java
package club.jasonkayzk666.chapter1.lesson7.interrupt;

public class InterruptedAndIsinterrupted {

    public static void main(String[] args) throws InterruptedException {
        
        Thread threadOne = new Thread(new Runnable() {
            @Override
            public void run() {
                for (; ;) {

                }
            }
        });

        // 启动线程
        threadOne.start();

        // 设置线程中断标志
        threadOne.interrupt();

        // 获取线程中断标志
        System.out.println("isInterrupted: " + threadOne.isInterrupted());

        // 获取线程中断标志并重置
        System.out.println("isInterrupted: " + threadOne.interrupted());

        // 获取中断标志并重置
        System.out.println("isInterrupted: " + Thread.interrupted());

        // 获取中断标志
        System.out.println("isInterrupted: " + threadOne.isInterrupted());

        threadOne.join();

        System.out.println("main is over");

    }
}

```

输出为:

```
isInterrupted: true
isInterrupted: false
isInterrupted: false
isInterrupted: true
```

为什么后三个输出为`false, false, true`而不是`true, false, false`!

**注:**

<font color="#ff0000">*这里虽然调用了`threadOne.interrupted()`方法, 但是获取的实际是主线程的中断标志!!!! 因为主线程是当前线程! 而`threadOne.interrupted() 和 Thread.interrupted()`方法的作用是一样的, 都是获取`当前进程的`中断标志!*</font>



---------------------------

### 8. 线程上下文切换

多线程编程中, 线程个数一般都大于CPU个数, 而每个CPU同一时刻都只能被一个线程使用! 当前线程使用过时间片后, 就会处于就绪状态, 并让出CPU让其他线程占用, 即: **上下文切换**.

而上下文的切换过程中需要保存当前线程的执行现场, 当再次执行是根据保存的执行现场信息回复!



------------------------

### 9. 线程死锁

死锁即: <font color="#ff0000">两个或者两个以上的线程在执行过程中, 因抢占资源而造成的相互等待的现象; 且在无外力作用的情况下, 线程会一直等待而无法继续运行下去!</font>

![死锁](https://gss2.bdstatic.com/-fo3dSag_xI4khGkpoWK1HF6hhy/baike/c0%3Dbaike80%2C5%2C5%2C80%2C26/sign=7a4ee20578cb0a46912f836b0a0a9d41/810a19d8bc3eb1354547b744a51ea8d3fc1f4448.jpg)

如图: 

​		T1已经持有资源2, 同时还想申请资源1；而T2已经持有资源1, 同时还想申请资源2, 即T1与T2将会相互等待, 而进入了死锁状态!

#### 1): *死锁产生的四个必备条件!*

-   <font color="#ff0000">*互斥条件*</font>

    线程对已经获得的资源进行**排他性使用**, 即该资源同时只能有一个线程占用!

    如果此时还有其他线程请求资源, 则请求者只能等待, 直到占有资源的线程释放该资源!

-   <font color="#ff0000">请求并持有条件</font>

    一个线程已经持有了至少一个资源, 但又提出了新的资源要求, 而新的资源已经被其他线程占用, 所以: *当前线程会在不释放自己已经获取的资源的前提下被阻塞!*

-   <font color="#ff0000">不可剥夺条件</font>

    线程获取的资源在自己使用之前不能被其他线程抢占, 只有自己使用完毕之后才能够由自己释放!

-   <font color="#ff0000">环路等待条件</font>

    发生死锁的时候, 必定包含**线程-资源的环形链**, 即线程集合中{T0, T1, T2, ...., Tn}中的T0在等待T1的资源占用, T1等待T2的资源占用....., Tn正在等待T0的资源占用!

#### 2): 死锁的例子

```java
package club.jasonkayzk666.chapter1.lesson9.deadlock;

public class DeadLockDemo {

    // 创建资源
    private static Object sourceA = new Object();
    private static Object sourceB = new Object();

    public static void main(String[] args) {

        Thread threadA = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (sourceA) {
                    System.out.println(Thread.currentThread() + " get resourceA");

                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }

                    System.out.println(Thread.currentThread() + " waiting get B");
                    synchronized (sourceB) {
                        System.out.println(Thread.currentThread() + " get B");
                    }
                }
            }
        });

        Thread threadB = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (sourceB) {
                    System.out.println(Thread.currentThread() + " get resourceB");

                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }

                    System.out.println(Thread.currentThread() + " waiting get A");
                    synchronized (sourceA) {
                        System.out.println(Thread.currentThread() + " get A");
                    }
                }
            }
        });

        threadA.start();
        threadB.start();

    }

}

```

输出的结果如下:

```
Thread[Thread-0,5,main] get resourceA
Thread[Thread-1,5,main] get resourceB
Thread[Thread-0,5,main] waiting get B
Thread[Thread-1,5,main] waiting get A
```

*由于线程A获得了资源B, 线程B获得了资源A, 且满足死锁的四个必要条件, 所以发生了死锁!*



#### 3): 避免死锁的方法

想要避免死锁, 只需要**破坏至少一个构成死锁的必要条件即可!** <font color="#ff0000">但是, 由操作系统可知, 只有`请求并持有`和`环路等待`条件是可以被破坏的!</font>

-   **保证资源申请的有序性**

造成死锁的原因其实和<font color="#00ff00">申请资源的顺序</font>有很大关系. 使用资源申请的有序性即可!

**例如**: 将线程B的代码修改为

```java
Thread threadB = new Thread(new Runnable() {
    @Override
    public void run() {
        synchronized (sourceA) {
            System.out.println(Thread.currentThread() + " get resourceB");

            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            System.out.println(Thread.currentThread() + " waiting get A");
            synchronized (sourceB) {
                System.out.println(Thread.currentThread() + " get A");
            }
        }
    }
});
```

即: *改变线程B获取资源的顺序与线程A一致!*

**原因**: <font color="#ff0000">资源的有序性破坏了资源请求并持有条件和环路等待条件!</font>



-------------------------

### 10. 守护线程与用户线程

Java中的线程分为两类: `daemon线程(守护线程)`和`user线程(用户线程)`. 在JVM启动时会调用main函数, main函数所在的线程就是一个用户线程. 而在JVM内部其实还启动了好多守护线程, 如: 垃圾回收等. 

#### 1): daemon与user线程的区别

<font color="#00ff00">当最后一个`非守护线程`退出时, JVM将会退出, 所有的守护线程也会退出!</font>



#### 2): 守护线程的创建

在Java中创建守护线程只需: <font color="#00ff00">设置线程的daemon参数为`true`即可!</font>

```java
daemonThread.setDaemon(true);
```



#### 3): daemon与user线程的比较例子

```java
package club.jasonkayzk666.chapter1.lesson10.daemonAndUesrThread;

public class DaemonAndUserThread {

    public static void main(String[] args) {
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                for (; ; ) {

                }
            }
        });

        thread.setDaemon(true);
        thread.start();

        System.out.println("main thread is over!");
    }
}

```

`在启动线程前`将线程设置为守护线程, 执行后JVM已终止!

当main线程结束后, JVM会启动叫做`DestroyJavaVM`的线程, 会等待所有用户线程结束之后终止JVM!



#### 4): daemon在Tomcat中

在Tomcat的NIO实现`NioEndpoint`中会开启一组`接受线程`来*接受用户的连接请求*, 以及一组`处理线程`负责具体用户请求. 

通过源码可以看出: <font color="#ff0000">在默认情况下, *接受线程和处理线程都是守护线程!*</font>

这也意味着: <font color="#ff0000">当tomcat收到shutdown命令后, 并且没有其他用户线程存在时, Tomcat进程将会马上消亡, *不会等待处理线程处理完当前请求!</font>



