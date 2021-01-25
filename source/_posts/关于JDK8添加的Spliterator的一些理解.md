---
title: 关于JDK8添加的Spliterator的一些理解
toc: true
date: 2019-12-03 20:36:03
cover: https://img.paulzzh.tech/touhou/random?1
categories: Java源码
tags: [Java基础, 集合]
description: 最近在看Java集合源码的时候研究了一下Spliterator, 发现了Spliterator的一些问题, 在这一篇中总结一下
---

最近在看Java集合源码的时候研究了一下Spliterator, 发现了Spliterator的一些问题, 在这一篇中总结一下:

-   Spliterator源码解读
-   ArrayList中Spliterator的实现
-   LinkedList中Spliterator的实现
-   HashMap(Set)中Spliterator的实现

 <br/>

<!--more-->

## 一. Spliterator源码解读

Spliterator接口是1.8新加的接口，字面意思可分割的迭代器，不同以往的iterator需要顺序迭代，Spliterator可以分割为若干个小的迭代器进行并行操作，既可以实现多线程操作提高效率，又可以避免普通迭代器的fail-fast机制所带来的异常

Spliterator**可以配合1.8新加的Stream进行并行流的实现**，大大提高处理效率

### 属性

通过characteristics（）方法返回的值，用来标识实现类所具有的的特征

```java
public static final int ORDERED    = 0x00000010;//表示元素是有序的（每一次遍历结果相同）
public static final int DISTINCT   = 0x00000001;//表示元素不重复
public static final int SORTED     = 0x00000004;//表示元素是按一定规律进行排列（有指定比较器）
public static final int SIZED      = 0x00000040;//是否确定大小
public static final int NONNULL    = 0x00000100;//表示迭代器中没有null元素
public static final int IMMUTABLE  = 0x00000400;//表示元素不可变
public static final int CONCURRENT = 0x00001000;//表示迭代器可以多线程操作
public static final int SUBSIZED   = 0x00004000;//表示子Spliterators都具有SIZED特性
```

<br/>

### 方法

-   `boolean tryAdvance(Consumer<? super T> action);`

    如果有剩余的元素存在，执行参数给定的操作，并返回true，否则就返回false
    如果Spliterator对象具有ORDERED属性，那么tryAdvance也会按照相应的顺序去执行

    

-   `default void forEachRemaining(Consumer<? super T> action)`

    对Spliterator的每一个对象执行tryAdvance操作

    ```java
    default void forEachRemaining(Consumer<? super T> action) {
        do { } while (tryAdvance(action));
    }
    ```

    

-   `Spliterator<T> trySplit()`

    如果这个Spliterator是可以被分割的，那么这个方法会返回一个Spliterator，与原来的Spliterator平分其中的元素，如果原Spliterator的元素个数单数，两个Spliterator的元素个数相差1，基本是相同的
    如果Spliterator不能再分割，那么会返回null

    

-   `long estimateSize()`
    返回一个预估的值，等于执行forEachRemaining方法时调用tryAdvance的次数。
    如果这个值过大，或者需要太复杂的计算过程，那么直接回返回long型的最大值

    

-   `default long getExactSizeIfKnown()`
    返回Spliterator对象确切的大小，如果存在SIZED属性，则返回estimateSize()方法的返回值，否则返回-1

    ```java
    default long getExactSizeIfKnown() {
        return (characteristics() & SIZED) == 0 ? -1L : estimateSize();
    }
    ```

    

-   `int characteristics();`

    返回Spliterator对象的特征值，这个上面有介绍。一般实现类中的属性就是几个属性进行或操作之后的结果

    

-   `default boolean hasCharacteristics(int characteristics)`
    根据characteristics()与参数相与的结果看Spliterator对象是否包含参数指定的属性

    ```java
    default boolean hasCharacteristics(int characteristics) {
        return (characteristics() & characteristics) == characteristics;
    }
    ```

    

-   default Comparator<? super T> getComparator()

    如果Spliterator的具体实现具有SORTED属性，那么此方法会返回一个相应的比较器，否则会返回null

    ```java
    default Comparator<? super T> getComparator() {
        throw new IllegalStateException();
    }
    ```

<br/>

### **衍生接口**

-   OfPrimitive

    衍生接口的内容与Spliterator几乎无差别，只是将trySplit，tryAdvance，forEachRemaining三个方法中的参数类型做了一点小小的变化，更加适合基本参数类型

    

    ```java
     public interface OfPrimitive<T, T_CONS, T_SPLITR extends 
                 Spliterator.OfPrimitive<T, T_CONS, T_SPLITR>> extends Spliterator<T> {
            @Override
            T_SPLITR trySplit();
         
             @SuppressWarnings("overloads")
        	 boolean tryAdvance(T_CONS action);
    
       		 @SuppressWarnings("overloads")
        	 default void forEachRemaining(T_CONS action) {
                do { } while (tryAdvance(action));
             }
     }
    ```

    **下面有相应的OfInt、OfLong、OfDouble三个借口专门提供给int、long、double类型的数据使用**

<br/>

## 二. ArrayList中Spliterator的实现

ArrayList中的实现类是ArrayListSpliterator, 其内部包括了三个变量:

-   **int index: 当前位置（包含），advance/spilt操作时会被修改(current index, modified on advance/split)**

    

-   **int fence: 结束位置（不包含），-1表示到最后一个元素(-1 until used; then one past last index)**

    

-   **int expectedModCount: 用于存放list的modCount(initialized when fence set)**

其用法也是最简单的: **创建一个长度为100的list，如果下标能被10整除，则该位置数值跟下标相同，否则值为aaaa。然后多线程遍历list，取出list中的数值(字符串aaaa不要)进行累加求和**

```java
public class Test {

    static List<String> list;

    static AtomicInteger count;

    public static void main(String[] args) throws InterruptedException {
        // 初始化List, 并获得spliterator
        list = new ArrayList<>();
        for (int i = 1; i <= 100; i++) {
            if (i % 10 == 0) {
                list.add(Integer.toString(i));
            } else {
                list.add("aaaa");
            }
        }
        Spliterator<String> spliterator = list.spliterator();

        // 求和结果
        count = new AtomicInteger(0);

        Spliterator<String> s1 = spliterator.trySplit();
        Spliterator<String> s2 = spliterator.trySplit();

        Thread main = new Thread(new Task(spliterator));
        Thread t1 = new Thread(new Task(s1));
        Thread t2 = new Thread(new Task(s2));

        main.start();
        t1.start();
        t2.start();

        t1.join();
        t2.join();
        main.join();

        System.out.println(count);
    }

    // 判断字符串是数字
    public static boolean isInteger(String str) {
        Pattern pattern = Pattern.compile("^[-+]?[\\d]*$");
        return pattern.matcher(str).matches();
    }

    static class Task implements Runnable {

        private Spliterator<String> spliterator;

        public Task(Spliterator<String> spliterator) {
            this.spliterator = spliterator;
        }

        @Override
        public void run() {
            String threadName = Thread.currentThread().getName();
            System.out.println("线程" + threadName + "开始运行-----");
            spliterator.forEachRemaining(x -> {
                if (isInteger(x)) {
                    count.addAndGet(Integer.parseInt(x));
                    System.out.println("数值：" + x + "------" + threadName);
                }
            });
            System.out.println("线程" + threadName + "运行结束-----");
        }
    }

}

------- Output -------
线程Thread-0开始运行-----
线程Thread-1开始运行-----
线程Thread-2开始运行-----
数值：60------Thread-2
数值：70------Thread-2
线程Thread-2运行结束-----
数值：80------Thread-0
数值：90------Thread-0
数值：10------Thread-1
数值：100------Thread-0
线程Thread-0运行结束-----
数值：20------Thread-1
数值：30------Thread-1
数值：40------Thread-1
数值：50------Thread-1
线程Thread-1运行结束-----
550
```

><br/>
>
>**注意:**
>
>需要注意的是, 之前我在博客中写的代码如下:
>
>```java
>package top.jasonkayzk;
>
>
>import java.util.ArrayList;
>import java.util.List;
>import java.util.Spliterator;
>import java.util.concurrent.CountDownLatch;
>import java.util.concurrent.atomic.AtomicInteger;
>import java.util.regex.Pattern;
>
>/**
> * @author zk
> */
>public class Test {
>
>    public static void main(String[] args) throws InterruptedException {
>        // 初始化List, 并获得spliterator
>        final List<String> map = new ArrayList<>();
>        for (int i = 1; i <= 100; i++) {
>            if (i % 10 == 0) {
>                map.add(i + "");
>            } else {
>                map.add("aaaa");
>            }
>        }
>        Spliterator<String> spliterator = map.spliterator();
>
>        // 求和结果
>        final AtomicInteger count = new AtomicInteger(0);
>
>        // 开启线程数
>        final int threadNum = 4;
>
>        // 计数器锁, 多个线程都处理完毕后才输出结果, 也可以使用join()方法
>        final CountDownLatch latch = new CountDownLatch(threadNum);
>
>        // 定义处理线程任务
>        Runnable task = () -> {
>            String threadName = Thread.currentThread().getName();
>            System.out.println("线程" + threadName + "开始运行-----");
>            spliterator.trySplit().forEachRemaining((ele) -> {
>                if (isInteger(ele)) {
>                    int num = Integer.parseInt(ele);
>                    count.addAndGet(num);
>                    System.out.println("数值：" + num + "------" + threadName);
>                }
>            });
>            System.out.println("线程" + threadName + "运行结束-----");
>            latch.countDown();
>        };
>
>        for (int i = 0; i < threadNum; i++) {
>            new Thread(task).start();
>        }
>
>        // 等待全部运行完毕
>        latch.await();
>
>        System.out.println(count);
>    }
>
>    // 判断字符串是数字
>    public static boolean isInteger(String str) {
>        Pattern pattern = Pattern.compile("^[-+]?[\\d]*$");
>        return pattern.matcher(str).matches();
>    }
>}
>
>------- Output -------
>线程Thread-0开始运行-----
>线程Thread-2开始运行-----
>线程Thread-1开始运行-----
>线程Thread-3开始运行-----
>数值：90------Thread-3
>数值：80------Thread-1
>数值：60------Thread-2
>线程Thread-1运行结束-----
>数值：70------Thread-2
>线程Thread-3运行结束-----
>线程Thread-2运行结束-----
>数值：10------Thread-0
>数值：20------Thread-0
>数值：30------Thread-0
>数值：40------Thread-0
>数值：50------Thread-0
>线程Thread-0运行结束-----
>450
>```
>
><font color="#ff0000">其结果并不为550, 因为最后一个元素被忽略了!</font>
>
>**经过多次尝试也没有找到原因, 所以在使用时最好:**
>
>-   **先做整体切割**
>-   **然后创建内部类, 类中定义属性, 并在构造方法中注入spliterator对象**
>
><font color="#ff0000">这样可以保证并发操作时可以正确分配而不受并发的影响, 并且将元素全部遍历</font>

<br/>

## 三. LinkedList中Spliterator的实现

与ArrayList类似, 在LinkedList中也存在一个实现了Spliterator接口的内部类: **LLSpliterator** 用于并发遍历整个表以提高性能, 使用方法与ArrayList类似

相同的例子: **创建一个长度为100的list，如果下标能被10整除，则该位置数值跟下标相同，否则值为aaaa。然后多线程遍历list，取出list中的数值(字符串aaaa不要)进行累加求和**

```java
package top.jasonkayzk;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;


public class Test {

    static List<String> list;

    static AtomicInteger count;

    public static void main(String[] args) throws InterruptedException {
        // 初始化List, 并获得spliterator
        list = new LinkedList<>();
        for (int i = 1; i <= 100; i++) {
            if (i % 10 == 0) {
                list.add(Integer.toString(i));
            } else {
                list.add("aaaa");
            }
        }
        Spliterator<String> spliterator = list.spliterator();

        // 求和结果
        count = new AtomicInteger(0);

        Spliterator<String> s1 = spliterator.trySplit();
        Spliterator<String> s2 = spliterator.trySplit();

        Thread main = new Thread(new Task(spliterator));
        Thread t1 = new Thread(new Task(s1));
        Thread t2 = new Thread(new Task(s2));

        main.start();
        t1.start();
        t2.start();

        t1.join();
        t2.join();
        main.join();

        System.out.println(count);
    }

    // 判断字符串是数字
    public static boolean isInteger(String str) {
        Pattern pattern = Pattern.compile("^[-+]?[\\d]*$");
        return pattern.matcher(str).matches();
    }

    static class Task implements Runnable {

        private Spliterator<String> spliterator;

        public Task(Spliterator<String> spliterator) {
            this.spliterator = spliterator;
        }

        @Override
        public void run() {
            String threadName = Thread.currentThread().getName();
            System.out.println("线程" + threadName + "开始运行-----");
            spliterator.forEachRemaining(x -> {
                if (isInteger(x)) {
                    count.addAndGet(Integer.parseInt(x));
                    System.out.println("数值：" + x + "------" + threadName);
                }
            });
            System.out.println("线程" + threadName + "运行结束-----");
        }
    }

}
```

以上代码与之前ArrayList中的代码几乎相同(只是在创建List时使用的是new LinkedList<>()而已)

执行结果如下:

```
线程Thread-1开始运行-----
线程Thread-2开始运行-----
线程Thread-0开始运行-----
线程Thread-0运行结束-----
Exception in thread "Thread-2" java.lang.NullPointerException
	at top.jasonkayzk.Test$Task.run(Test.java:65)
	at java.base/java.lang.Thread.run(Thread.java:834)
数值：10------Thread-1
数值：20------Thread-1
数值：30------Thread-1
数值：40------Thread-1
数值：50------Thread-1
数值：60------Thread-1
数值：70------Thread-1
数值：80------Thread-1
数值：90------Thread-1
数值：100------Thread-1
线程Thread-1运行结束-----
550
```

<font color="#ff0000">结果是正确的, 但是爆出了NPE的错误!</font>

<font color="#ff0000">但是将100增大, 比如到10000, 则不会报错了!</font>

**原因在于:**

<font color="#ff0000">LLSpliterator和在ArrayList中实现的ArrayListSpliterator的实现方式还是有所区别的</font>

在LLSpliterator中定义了`BATCH_UNIT和batch`变量:



```java
static final int BATCH_UNIT = 1 << 10;  // 批处理数组大小增量,  1024
static final int MAX_BATCH = 1 << 25;  // 最大批处理数组大小,  33554432
int est;              // size估计(尾节点索引)，初始值为-1(size estimate; -1 until first needed)
int expectedModCount; // 期望的改变计数。用来实现fail-fast机制
int batch;            // 拆分的批量大小
```

而在源码的trySplit()方法中可以看到在LLSpliterator中是以batch(或者说是j)来进行拆分的:

```java
public Spliterator<E> trySplit() {
    Node<E> p;
    int s = getEst();
    if (s > 1 && (p = current) != null) {
        int n = batch + BATCH_UNIT;
        if (n > s)
            n = s;
        if (n > MAX_BATCH)
            n = MAX_BATCH;
        Object[] a = new Object[n];
        int j = 0;
        do { a[j++] = p.item; } while ((p = p.next) != null && j < n);
        current = p;
        batch = j;
        est = s - j;
        return Spliterators.spliterator(a, 0, j, Spliterator.ORDERED);
    }
    return null;
}
```

**并且这个batch固定等于: batch + BATCH_UNIT, 而batch只能被初始化为0(没找到setter方法), 所以batch只能固定为1024!**

><br/>
>
>**说明:** 在LLSpliterator中
>
>**①  batch限定了每次差分的大小, 而batch并未通过构造函数或者Setter暴露, 所以只能为: BATCH_UNIT(1024), 即每一批次固定为1024个元素**
>
>**② MAX_BATCH规定了可处理的总批数, 所以LLSpliterator可处理的最多元素是: MAX_BATCH x BATCH_UNIT**

综上, 也就不难得出, 为什么当list长度为100时会报错了: **因为开了四个线程, 但是因为每一批固定为1024个, 所以其实另外三个线程都被分为了null, 所以报出NPE**

>   <br/>
>
>   **总结: ArrayListSpliterator和LLSpliterator的底层实现还是不同的**
>
>   <font color="#ff0000">我个人觉得主要是因为LinkedList的随机访问能力远不如ArrayList, 所以差分多个其实性能远远不如ArrayList好, 所以Java官方才这样设计的, 毕竟你拆分LinkedList时, 基本上已经遍历了整个链表了</font>
>
>   <font color="#ff0000">所以使用Spliterator多线程并发操作List的时候, 一定要选择ArrayList!</font>

<br/>

## 四. HashMap(Set)中Spliterator的实现

  map中有KeySpliterator, ValueSpliterator和EntrySpliterator都继承自内部抽象类HashMapSpliterator并实现了Spliterator接口, 因此可以通过这三个内部类获取相应的Spliterator来完成并发遍历HashMap

同时对于Set(例如HashSet), 其内部源码如下:

```java
public Spliterator<E> spliterator() {
    return new HashMap.KeySpliterator<>(map, 0, -1, 0, 0);
}
```

<font color="#ff0000">可见, HashSet中实际上返回的还是HashMap中Spliterator的实现(同理, TreeSet返回TreeMap的实现类)</font>

<br/>

同一个例子: **创建一个长度为100的list，如果下标能被10整除，则该位置数值跟下标相同，否则值为aaaa。然后多线程遍历list，取出list中的数值(字符串aaaa不要)进行累加求和**

```java
public class Test {

    static HashMap<Integer, String> map;

    static AtomicInteger count;

    public static void main(String[] args) throws InterruptedException {
        // 初始化List, 并获得spliterator
        map = new HashMap<>();
        for (int i = 1; i <= 109; i++) {
            if (i % 10 == 0) {
                map.put(i, Integer.toString(i));
            } else {
                map.put(i, "aaaa");
            }
        }
        Spliterator<String> spliterator = map.values().spliterator();

        // 求和结果
        count = new AtomicInteger(0);

        Spliterator<String> s1 = spliterator.trySplit();
        Spliterator<String> s2 = s1.trySplit();

        Thread main = new Thread(new Task(spliterator));
        Thread t1 = new Thread(new Task(s1));
        Thread t2 = new Thread(new Task(s2));

        main.start();
        t1.start();
        t2.start();

        t1.join();
        t2.join();
        main.join();

        System.out.println(count);
    }

    // 判断字符串是数字
    public static boolean isInteger(String str) {
        Pattern pattern = Pattern.compile("^[-+]?[\\d]*$");
        return pattern.matcher(str).matches();
    }

    static class Task implements Runnable {

        private Spliterator<String> spliterator;

        public Task(Spliterator<String> spliterator) {
            this.spliterator = spliterator;
        }

        @Override
        public void run() {
            String threadName = Thread.currentThread().getName();
            System.out.println("线程" + threadName + "开始运行-----");
            spliterator.forEachRemaining(x -> {
                if (isInteger(x)) {
                    count.addAndGet(Integer.parseInt(x));
                    System.out.println("数值：" + x + "------" + threadName);
                }
            });
            System.out.println("线程" + threadName + "运行结束-----");
        }
    }
}

------- Output -------
线程Thread-1开始运行-----
线程Thread-2开始运行-----
线程Thread-0开始运行-----
线程Thread-0运行结束-----
数值：10------Thread-2
数值：20------Thread-2
数值：30------Thread-2
数值：40------Thread-2
数值：50------Thread-2
数值：60------Thread-2
线程Thread-2运行结束-----
数值：70------Thread-1
数值：80------Thread-1
数值：90------Thread-1
数值：100------Thread-1
线程Thread-1运行结束-----
550
```

><br/>
>
>**注: HashMap的遍历和ArrayList有很大的不同!**
>
><font color="#ff0000">由于HashMap中的遍历涉及到桶(存储分区数目)以及树(或者链表)结构, 且和具体数据的hash值也有很大的关系</font>
>
>**所以可能会出现像上例中Thread-0类似: 做了切分但实际上没有分配任何数据!**
>
>**HashMap由于结构十分复杂, 以后有机会再研究内部的并发实现**

<br/>

## 总结

以上讲述了Spliterator接口的源码, 以及Spliterator在不同集合类中的具体实现类的区别

**要知道, 对于不同的场景下, 具体的Spliterator实现类所具有的特点是不完全一样的(尽管他们都实现了同一个接口)**

<br/>



