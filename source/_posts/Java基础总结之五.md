---
title: Java基础总结之五
toc: false
date: 2019-11-22 11:46:46
cover: http://api.mtyqx.cn/api/random.php?12
categories: 面试总结
tags: Java基础
description: 本文是Java面试总结中Java基础篇的第五篇
---

本文是Java面试总结中Java基础篇的第五篇

<br/>

<!--more-->

### 1. 在try块中可以抛出异常吗？

在try块中当然可以抛出异常. 

><br/>
>
>**备注:**
>
>事实上, 对于Spring框架来说, 对于许多例如JDBC等规范定义的异常, Spring都将其catch并重新以运行时异常抛出, 这样便可以在编写代码时不用特地使用try/catch捕获. 代码显得清爽很多!

<br/>

### 2. java中有几种方法可以实现一个线程？

java5以前，有如下两种：

**① 实现Runnable接口:**

```java
public class Test {

    public static void main(String[] args) {
        Thread1 thread1 = new Test().new Thread1();
        new Thread(thread1).start(); // Thread1
    }

    class Thread1 implements Runnable {
        @Override
        public void run() {
            System.out.println("Thread1");
        }
    }
}

```

上述代码定义了一个Thread1类, 将它传递至新的线程中并调用线程的.start()启动. 

通常都采用匿名内部类实现, 如下:

```java
public static void main(String[] args) {
    new Thread(() -> System.out.println("Thread1")).start();
}
```

><br/>
>
>**备注:** 由于Runnable接口是一个典型的FunctionalInterface, 所以配合Lambda表达式, 代码会清爽很多!

**② 继承Thread类, 并重新run()方法(本质上还是实现Runnable接口)**

由于Thread类本事已经实现了Runnable接口, 所以继承Thread类, 重写run()方法在本质上还是实现Runnable接口!

```java
public class Test extends Thread {

    public static void main(String[] args) {
        new Thread(() -> System.out.println("Thread1")).start(); // Thread1
        new Thread(new Test()).start(); // Thread2
    }

    @Override
    public void run() {
        System.out.println("Thread2");
    }
}
```

><br/>
>
>**备注:** 此方法较少使用, 因为Java单继承的原因, 一旦继承了Thread类, 则不能继承其他类!

<br/>

**自从java5开始，还有一些方法:**

**③ FutureTask方式[有返回值]**

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

上述代码中的`CallerTask`类实现了`Callable`接口的`call()`方法. 在main函数中首先<font color="#ff0000">创建了一个`FutureTask`对象(构造方法为`CallerTask`实例),</font> 然后使用创建的`FutureTask`对象作为任务创建了一个线程并启动, 最后<font color="#0000ff">通过`futureTask.get()`等待任务执行完毕并返回结果.</font>

**④ 线程池创建多线程的方式：**

```java
public class Test {

    public static void main(String[] args) {
        ExecutorService pool = Executors.newFixedThreadPool(3);
        for (int i = 0; i < 10; i++) {
            pool.execute(() -> {
                System.out.println(Thread.currentThread());
            });
        }
        pool.shutdown();

        // 通过线程池直接创建线程!
        Executors.newCachedThreadPool().execute(() -> {
            System.out.println(Thread.currentThread());
        });
        Executors.newSingleThreadExecutor().execute(() -> {
            System.out.println(Thread.currentThread());
        });
        // 线程池未关闭! 程序仍在执行!!!
    }

}
---------- 输出
Thread[pool-1-thread-1,5,main]
Thread[pool-1-thread-2,5,main]
Thread[pool-1-thread-3,5,main]
Thread[pool-1-thread-1,5,main]
Thread[pool-1-thread-1,5,main]
Thread[pool-1-thread-1,5,main]
Thread[pool-1-thread-1,5,main]
Thread[pool-1-thread-1,5,main]
Thread[pool-1-thread-1,5,main]
Thread[pool-1-thread-1,5,main]
Thread[pool-2-thread-1,5,main]
Thread[pool-3-thread-1,5,main]
```

><br/>
>
>**备注:** 需要注意的是, 通过线程池直接创建线程的方式并不推荐!
>
><font color="#ff0000">如上例, 中后两个例子创建的线程执行完毕后, 由于线程池没有关闭, 所以程序并不会终止!</font>

><br/>
>
>更多关于线程基础的可以查看文章: [Java并发总结-1](https://jasonkayzk.github.io/2019/09/10/Java%E5%B9%B6%E5%8F%91%E6%80%BB%E7%BB%93-1/)

<br/>

### 3. 用什么关键字修饰同步方法? stop()和suspend()方法为何不推荐使用？

用`synchronized`关键字修饰同步方法.

反对使用stop()，是因为它不安全。它会解除由线程获取的所有锁定，而且如果对象处于一种不连贯状态，那么其他线程能在那种状态下检查和修改它们, 结果很难检查出真正的问题所在。

suspend()方法容易发生死锁。调用suspend()的时候，目标线程会停下来，但却仍然持有在这之前获得的锁定。此时，其他任何线程都不能访问锁定的资源，除非被"挂起"的线程恢复运行。对任何线程来说，如果它们想恢复目标线程，同时又试图使用任何一个锁定的资源，就会造成死锁。

<font color="#0000ff">所以不应该使用suspend()，而应在自己的Thread类中置入一个标志，指出线程应该活动还是挂起。若标志指出线程应该挂起，便用wait()命其进入等待状态。若标志指出线程应当恢复，则用一个notify()重新启动线程。</font>

<br/>

### 4. sleep()和 wait()有什么区别?

sleep就是正在执行的线程主动让出cpu，cpu去执行其他线程，在sleep指定的时间过后，cpu才会回到这个线程上继续往下执行，如果当前线程进入了同步锁. sleep方法并不会释放锁，即使当前线程使用sleep方法让出了cpu，但其他被同步锁挡住了的线程也无法得到执行。

wait是指在一个已经进入了同步锁的线程内，让自己暂时让出同步锁，以便其他正在等待此锁的线程可以得到同步锁并运行，只有其他线程调用了notify方法，调用wait方法的线程就会解除wait状态和程序可以**再次竞争**锁后继续向下运行。

><br/>
>
>**备注:**
>
><font color="#ff0000">① notify并不释放锁，只是告诉调用过wait方法的线程可以去参与获得锁的竞争了，但不是马上得到锁，因为锁还在别人手里，别人还没释放</font>
>
><font color="#ff0000">② 如果notify方法后面的代码还有很多，需要这些代码执行完后才会释放锁，可以在notfiy方法后增加一个等待和一些代码，看看效果</font>

```java
public class Test {

    public static void main(String[] args) {
        new Thread(new Thread1()).start();
        try {
            // 10毫秒之后创建Thread2
            Thread.sleep(10);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        new Thread(new Thread2()).start();
    }

    private static class Thread1 implements Runnable {

        @Override
        public void run() {
            // 由于这里的Thread1和下面的Thread2内部run方法要用同一对象作为监视器，我们这里不能用this
            // 因为在Thread2里面的this和这个Thread1的this不是同一个对象。
            // 我们用Test.class这个字节码对象，当前虚拟机里引用这个变量时，指向的都是同一个对象。
            synchronized (Test.class) {
                System.out.println("enter thread1...");
                System.out.println("thread1 is waiting");
                try{
                    // 释放锁有两种方式:
                    // 第一种方式是程序自然离开监视器的范围，也就是离开了synchronized关键字管辖的代码范围
                    // 另一种方式就是在synchronized关键字管辖的代码内部调用监视器对象的wait方法。
                    // 这里，使用wait方法释放锁。
                    Test.class.wait();
                }catch(InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println("thread1is going on...");
                System.out.println("thread1is being over!");
            }
        }
    }

    private static class Thread2 implements Runnable {

        @Override
        public void run() {
            synchronized (Test.class) {
                System.out.println("enter thread2...");
                System.out.println("thread2 notify other thread can release wait status..");
                // 由于notify方法并不释放锁，即使thread2调用下面的sleep方法休息了3秒
                // 但thread1仍然不会执行，因为thread2没有释放锁，所以Thread1无法得不到锁!
                Test.class.notify();
                System.out.println("thread2is sleeping three second...");
                try{
                    Thread.sleep(3000);
                }catch(InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println("thread2is going on...");
                System.out.println("thread2is being over!");
            }
        }
    }
}
------- Output -------
enter thread1...
thread1 is waiting
enter thread2...
thread2 notify other thread can release wait status..
thread2 is sleeping three second...
(暂停期间, Thread1并没有执行!)
thread2 is going on...
thread2 is being over!
thread1 is going on...
thread1 is being over!
```

示例如上, 在Thread2暂停期间, Thread1并没有执行!

<br/>

### 5. 同步和异步有何异同，在什么情况下分别使用他们？举例说明。

如果数据将在线程间共享。例如正在写的数据以后可能被另一个线程读到，或者正在读的数据可能已经被另一个线程写过了，那么这些数据就是共享数据，必须进行同步存取。

当应用程序在对象上调用了一个需要花费很长时间来执行的方法，并且不希望让程序等待方法的返回时，就应该使用异步编程，在很多情况下采用异步途径往往更有效率。

<br/>

### 6. 同步有几种实现方法?

同步的实现方面有两种:分别是synchronized, wait与notify

wait():使一个线程处于等待状态，并且释放所持有的对象的lock。

sleep():使一个正在运行的线程处于睡眠状态，是一个静态方法，调用此方法要捕捉InterruptedException异常。

notify():唤醒一个处于等待状态的线程，注意的是在调用此方法的时候，并不能确切的唤醒某一个等待状态的线程，而是由JVM确定唤醒哪个线程，而且不是按优先级。

notifyAll():唤醒所有处入等待状态的线程，注意并不是给所有唤醒线程一个对象的锁，而是让它们竞争。

<br/>

### 7. 启动一个线程是用run()还是start()?

启动一个线程是调用start()方法，使线程就绪状态，以后可以被调度为运行状态，一个线程必须关联一些具体的执行代码，run()方法仅仅是该线程所关联的执行代码。

<br/>

### 8. 当一个线程synchronized方法后，其它线程是否可进入此对象的其它方法? 静态方法和非静态方法都声明为synchronized是否会发生锁竞争?

分几种情况：

① 其他方法前是否加了synchronized关键字，如果没加，则能。

② 如果这个方法内部调用了wait，则可以进入其他synchronized方法。

③ 如果其他个方法都加了synchronized关键字，并且内部没有调用wait，则不能。

④ 如果其他方法是static，它用的同步锁是当前类的字节码，与非静态的方法不能同步，因为非静态的方法用的是this!

><br/>
>
>**备注:** <font color="#ff0000">静态方法与非静态方法采用的是不同的同步锁监视器: 静态方法是CurrentClass.class, 即当前类的字节码, 而非静态方法采用的是this!</font>

例如: 下面所示静态方法与非静态方法并未同步!

```java
public class Test {

    public static void main(String[] args) {
        Test test = new Test();
        new Thread(test::normalMethod).start();
        try {
            Thread.sleep(50);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        new Thread(Test::staticMethod).start();
    }

    public static synchronized void staticMethod() {
        System.out.println("This is a static synchronized");
    }

    public synchronized void normalMethod() {
        System.out.println("Normal method in!");
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("Normal method out!");
    }
}
------- Output -------
Normal method in!
This is a static synchronized! (立即输出)
Normal method out! (等待3秒)
```

静态方法会立即输出, 而普通方法则是等待三秒结束! 因为本质上他们使用的是不同的同步锁!

<br/>

### 9. 线程的基本概念、线程的基本状态以及状态之间的关系

一个程序中可以有多条执行线索同时执行，一个线程就是程序中的一条执行线索，每个线程上都关联有要执行的代码，即可以有多段程序代码同时运行，每个程序至少都有一个线程，即main方法执行的那个线程。

**状态：**就绪，运行，synchronize阻塞，wait和sleep挂起，结束。

><br/>
>
>**备注:** wait必须在synchronized内部调用。

**状态转换:** 调用线程的start方法后线程进入就绪状态，线程调度系统将就绪状态的线程转为运行状态，遇到synchronized语句时，由运行状态转为阻塞，当synchronized获得锁后，由阻塞转为运行，在这种情况可以调用wait方法转为挂起状态，当线程关联的代码执行完后，线程变为结束状态。

<br/>

### 10. 简述synchronized和java.util.concurrent.locks.Lock的异同？

**主要相同点：**Lock能完成synchronized所实现的所有功能

**主要不同点：**Lock有比synchronized更精确的线程语义和更好的性能。synchronized会自动释放锁，而Lock一定要求程序员手工释放，并且必须在finally从句中释放。Lock还有更强大的功能，例如，它的tryLock方法可以非阻塞方式去拿锁。

举例说明:

```java
public class Test {

    private int j;

    private Lock lock = new ReentrantLock();

    public static void main(String[] args) {
        Test tt = new Test();
        for (int i = 0; i < 2; i++) {
            new Thread(tt.new Adder()).start();
            new Thread(tt.new Subtractor()).start();
        }
    }

    private class Subtractor implements Runnable {

        @Override
        public void run() {
            while (true) {
                /*synchronized (ThreadTest.this) {
                    System.out.println("j--="+ j--);
                    //这里抛异常了，锁能释放吗？
                }*/
                lock.lock();
                try {
                    System.out.println("j--=" + j--);
                } finally {
                    lock.unlock();
                }
            }
        }
    }

    private class Adder implements Runnable {

        @Override
        public void run() {
            while (true) {
                /*synchronized (ThreadTest.this) {
                    System.out.println("j++="+ j++);
                }*/
                lock.lock();
                try {
                    System.out.println("j++=" + j++);
                } finally {
                    lock.unlock();
                }
            }
        }
    }
}
```

上述代码分别使用了synchronized和Lock方法实现了两个线程对一个成员的自增和自减的同步

><br/>
>
>**备注:** 
>
><font color="#ff0000">对于synchronized, 在抛出异常是自动释放锁的, 而对于Lock则需要写在finally块中, 保证在任何异常情况下可以正常释放锁!</font>

<br/>