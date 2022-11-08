---
title: JVM堆内存溢出后其他线程可否继续工作
toc: true
date: 2019-12-30 10:31:43
cover: https://img.paulzzh.tech/touhou/random?9
categories: 技术杂谈
tags: [面试总结, JVM]
description: 最近看公众号推送了一个美团的面试题目, JVM堆内存溢出后其他线程可否继续工作, 自己心里想的是应该不可以吧, 毕竟JVM内存模型规定的是所有线程共用同一个堆内存, 结果答案是可以......
---

最近看公众号推送了一个美团的面试题目, JVM堆内存溢出后其他线程可否继续工作, 自己心里想的是应该不可以吧, 毕竟JVM内存模型规定的是所有线程共用同一个堆内存, 结果答案是可以......

<br/>

<!--more-->

最近网上出现一个美团面试题: "一个线程OOM后，其他线程还能运行吗？"

这道题其实很有难度，涉及的知识点有jvm内存分配、作用域、gc等，不是简单的是与否的问题:

由于题目中给出的OOM，java中OOM又分很多类型, 比如：

-   堆溢出(java.lang.OutOfMemoryError: Java heap space）
-   永久带溢出(java.lang.OutOfMemoryError:Permgen  space)
-   不能创建线程(java.lang.OutOfMemoryError:Unable to create new native  thread)等很多种情况

本文主要是分析堆溢出对应用带来的影响

**先说一下答案，答案是还能运行!**

<br/>

代码如下:

```java
/**
 * @author zk
 */
public class JvmThreadTest {

    public static void main(String[] args) {
        // OOM Thread
        new Thread(() -> {
            List<byte[]> list = new ArrayList<>();
            while (true) {
                System.out.println(new Date().toString() + Thread.currentThread() + "==");
                byte[] b = new byte[1024 * 1024 * 1];
                list.add(b);
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }).start();

        // Other Thread
        new Thread(() -> {
            while (true) {
                System.out.println(new Date().toString() + Thread.currentThread() + "==");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }).start();
    }
}
------- Output --------
zk@jasonkay:~/workspace/test/src/main/java$ java -Xms16m -Xmx32m JvmThreadTest 
Mon Dec 30 10:57:17 CST 2019Thread[Thread-1,5,main]==
Mon Dec 30 10:57:17 CST 2019Thread[Thread-0,5,main]==
.......
Mon Dec 30 10:57:31 CST 2019Thread[Thread-1,5,main]==
Mon Dec 30 10:57:31 CST 2019Thread[Thread-0,5,main]==
Exception in thread "Thread-0" java.lang.OutOfMemoryError: Java heap space
        at JvmThreadTest.lambda$main$0(JvmThreadTest.java:16)
        at JvmThreadTest$$Lambda$1/0x0000000100060840.run(Unknown Source)
        at java.base/java.lang.Thread.run(Thread.java:834)
Mon Dec 30 10:57:32 CST 2019Thread[Thread-1,5,main]==
Mon Dec 30 10:57:33 CST 2019Thread[Thread-1,5,main]==
Mon Dec 30 10:57:34 CST 2019Thread[Thread-1,5,main]==
......
```

通过参数-Xms设置程序启动时占用内存大小, -Xmx设置程序运行期间最大可占用的内存大小: `-Xms16m -Xmx32m`

从日志可以看出在thead-0发生OOM之后, thread-1仍旧能够继续申请内存工作

![JVM堆内存溢出.jpg](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/JVM堆内存溢出.jpg)

上图是JVM堆空间的变化。我们仔细观察一下在14:42:05~14:42:25之间曲线变化，你会发现使用堆的数量，突然间急剧下滑！这代表这一点，当一个线程抛出OOM异常后，它所占据的内存资源会全部被释放掉，从而不会影响其他线程的运行

讲到这里大家应该懂了，此题的答案为一个线程溢出后，进程里的其他线程还能照常运行。注意了，这个例子我只演示了堆溢出的情况。如果是栈溢出，结论也是一样的，大家可自行通过代码测试

><br/>
>
>**总结:**
>
><font color="#ff0000">**其实发生OOM的线程一般情况下会死亡，也就是会被终结掉，该线程持有的对象占用的heap都会被gc了，释放内存**</font>
>
><font color="#ff0000">**但是因为发生OOM之前要进行gc，就算其他线程能够正常工作，也会因为频繁gc产生较大的影响**</font>

<br/>

**扩展: 如果thread-0发生了OOM，但是该线程仍旧存活并且持有这些对象会怎么样呢？**

代码如下:

```java
/****因为发生OOM之前要进行gc，就算其他线程能够正常工作，也会因为频繁gc产生较大的影响
 * @author zk
 */
public class JvmThreadTest {

    public static void main(String[] args) {
        // OOM Thread
        new Thread(() -> {
            List<byte[]> list = new ArrayList<>();
            try {
                while (true) {
                    System.out.println(new Date().toString() + Thread.currentThread() + "==");
                    list.add(new byte[1024 * 1024]);
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            } catch (Throwable throwable) {
                throwable.printStackTrace();
            }

            // After OOM, halt here
            while (true) {;}
        }, "OOM Thread").start();

        // Other Thread
        new Thread(() -> { e.printStackTrace();
            List<byte[]> list = new ArrayList<>();
            try {
                Thread.sleep(5000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            while (true) {
                System.out.println(new Date().toString() + Thread.currentThread() + "==");
                list.add(new byte[1024 * 1024]);
                // Wait for OOM
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }, "Other Thread").start();
    }
}
```

在线程OOM Thread我们捕获了该ERROR，然后让该线程暂停（不要让他结束，不然又像上面那样了）, 并且在Other Thread中同样申请内存, 则输出日志如下:

```
zk@jasonkay:~/workspace/test/src/main/java$ javac JvmThreadTest.java 
zk@jasonkay:~/workspace/test/src/main/java$ java -Xms16m -Xmx32m JvmThreadTest 
Mon Dec 30 11:18:55 CST 2019Thread[OOM Thread,5,main]==
Mon Dec 30 11:18:56 CST 2019Thread[OOM Thread,5,main]==
Mon Dec 30 11:18:57 CST 2019Thread[OOM Thread,5,main]==
Mon Dec 30 11:18:58 CST 2019Thread[OOM Thread,5,main]==
Mon Dec 30 11:18:59 CST 2019Thread[OOM Thread,5,main]==
Mon Dec 30 11:19:00 CST 2019Thread[Other Thread,5,main]==
Mon Dec 30 11:19:00 CST 2019Thread[OOM Thread,5,main]==
Mon Dec 30 11:19:01 CST 2019Thread[Other Thread,5,main]==
Mon Dec 30 11:19:01 CST 2019Thread[OOM Thread,5,main]==
Mon Dec 30 11:19:02 CST 2019Thread[Other Thread,5,main]==
Mon Dec 30 11:19:02 CST 2019Thread[OOM Thread,5,main]==
Mon Dec 30 11:19:03 CST 2019Thread[Other Thread,5,main]==
Mon Dec 30 11:19:03 CST 2019Thread[OOM Thread,5,main]==
Mon Dec 30 11:19:04 CST 2019Thread[Other Thread,5,main]==
Mon Dec 30 11:19:04 CST 2019Thread[OOM Thread,5,main]==
java.lang.OutOfMemoryError: Java heap space
        at JvmThreadTest.lambda$main$0(JvmThreadTest.java:17)
        at JvmThreadTest$$Lambda$1/0x0000000100060840.run(Unknown Source)
        at java.base/java.lang.Thread.run(Thread.java:834)
Mon Dec 30 11:19:05 CST 2019Thread[Other Thread,5,main]==
Exception in thread "Other Thread" java.lang.OutOfMemoryError: Java heap space
        at JvmThreadTest.lambda$main$1(JvmThreadTest.java:42)
        at JvmThreadTest$$Lambda$2/0x0000000100062840.run(Unknown Source)
        at java.base/java.lang.Thread.run(Thread.java:834)
        
The program is still running......
```

下图是JVM堆空间的变化:

![JVM堆内存溢出2.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/JVM堆内存溢出2.png)

可见在OOM线程发生了OOM之后, GC运行清理了部分内存, 但是还是存在垃圾, 所以Other线程在请求内存时由于OOM而挂断, 而OOM线程由于catch了Error而继续运行:

>   <br/>
>
>   **原理:**
>
>   我们知道java对象基本上都是在堆上分配（有特殊情况下，不在我们讨论的范围内）:
>
>   -   小对象都是直接在Eden区域中分配, 如果此时内存不够，就会发生young gc;
>   -   如果释放之后还是内存不够，此时jvm会进行full gc;
>   -   如果发生full  gc之后内存还是不够，此时就会抛出`java.lang.OutOfMemoryError: Java heap  space`
>
>   
>
>   大对象jvm会直接在old 区域中申请，但是和小对象分配的原理类似;
>
>   <br/>
>
>   <font color="#ff0000">**一般情况下，java对象内存分配跟线程无关（TLAB例外），能够申请成功只与当前只和当前heap空余空间有关**</font>
>
>   清楚了内存分配原理之后，我们就可以以此为基础来分析各种情况, 比如:
>
>   -   在OOM Thread中bytesList放在try中, 发生OOM之后，bytesList其实就不属于存活对象，gc的时候就被释放了;
>   -   再比如发生OOM捕获该异常之后，因为日志输入的string需要占用heap空间，也可能导致OOM Thread再次发生OOM，OOM Thread线程终结;
>   -   再比如OOM Thread中一次性申请的内存太大，比如超过heap大小；其他申请小内存的线程肯定不会受到影响

><br/>
>
>**总结:**
>
><font color="#ff0000">**发生OOM之后会不会影响其他线程正常工作需要具体的场景分析。但是就一般情况下，发生OOM的线程都会终结（除非代码写的太烂），该线程持有的对象占用的heap都会被gc了，释放内存**</font>
>
><font color="#ff0000">**因为发生OOM之前要进行gc，就算其他线程能够正常工作，也会因为频繁gc产生较大的影响**</font>

<br/>