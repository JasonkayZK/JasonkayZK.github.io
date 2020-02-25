---
title: 并发排序从ForkJoin到Stream
toc: false
date: 2020-02-25 17:37:53
cover: http://api.mtyqx.cn/api/random.php?11
categories: 并发编程
tags: [算法, 并发编程]
description: 在前面"几种常见排序方法的优化(下)"一文中, 我总结了针对归并排序的一些优化方法. 但是即使是优化, 整个排序过程也是建立在单个线程当中的. 而自顶向下的归并排序在将数组拆分之后, 左右两部分是不会被同一个递归栈访问的, 容易想到可以开辟两个线程(递归的)分别进行左右归并排序. 本篇就在此基础之上探讨有关ForkJoin和Stream的一些操作
---

在前面[几种常见排序方法的优化(下)](https://jasonkayzk.github.io/2020/02/24/几种常见排序方法的优化-下/)一文中, 我总结了针对归并排序的一些优化方法.但是即使是优化, 整个排序过程也是建立在单个线程当中的

而自顶向下的归并排序在将数组拆分之后, 左右两部分是不会被同一个递归栈访问的, 容易想到可以开辟两个线程(递归的)分别进行左右归并排序

本篇就在此基础之上探讨有关ForkJoin和Stream的一些操作


本文内容包括:

- ForkJoin简单讲解
- 基于多线程(ForkJoin)的归并排序的实现
- 使用Stream进行并发排序
- 排序性能测试


源代码: 

- 源代码: https://github.com/JasonkayZK/Java_Algorithm/tree/master/src/main/java/algorithm/sort
- 测试代码: https://github.com/JasonkayZK/Java_Algorithm/tree/master/src/test/java/algorithm/sort

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>

<!--more-->

## 并发排序从ForkJoin到Stream

对于分治思想, 每一次递归在将问题划分为子问题时, 如果两个子问题之间没有关联, 则都可以通过单独开辟一个线程进行并发完成子问题, 并等待两个子问题解决后完成归并;

对于多线程的归并排序就是这种思想

### 一.ForkJoin简单讲解

#### 1.ForkJoin框架简介

其实Java本身提供了更好的解决方案，就是`Fork/Join`框架

Fork/Join框架由特定的ExecutorService和线程池构成

ExecutorService可以运行任务，并且这个任务会被分解成较小的任务，它们从线程池中被fork(被不同的线程执行)出来，在join(即它的所有的子任务都完成了)之前会一直等待

**Fork/Join使用了任务窃取来最小化线程的征用和开销**

线程池中的**每条工作线程都有自己的双端工作队列并且会将新任务放到这个队列中**去:

它从队列的头部读取任务: 如果队列是空的，工作线程就尝试从另外一个队列的末尾获取一个任务

**窃取操作不会很频繁，因为工作线程会采用后进先出的顺序将任务放入它们的队列中**，同时工作项的规模会随着问题分割成子问题而变小; 你一开始把任务交给一个中心的工作线程，之后它会继续将这个任务分解成更小的任务, 最终所有的工作线程都只会设计很少量的同步操作

><br/>
>
>更多关于Fort/Join的内容见:
>
>-   [Doug Lea 大神写的Fork/Join框架的论文](http://gee.cs.oswego.edu/dl/papers/fj.pdf)
>-   [并发编程网翻译](http://ifeve.com/java-fork-join-framework/#more-35602)

使用Fork/Join 我们需要知道两个类：

-   **ForkJoinTask:**

    我们要使用ForkJoin框架, 必须首先创建一个ForkJoin任务, 它提供在任务中执行fork()和join()操作的机制

    通常情况下我们不需要直接继承ForkJoinTask类，而只需要继承它的子类，Fork/Join框架提供了以下两个子类：

    -   **RecursiveAction：用于没有返回结果的任务**
    -   **RecursiveTask ：用于有返回结果的任务**

-   **ForkJoinPool :**

    ForkJoinTask需要通过ForkJoinPool来执行，任务分割出的子任务会添加到当前工作线程所维护的双端队列中，进入队列的头部

    当一个工作线程的队列里暂时没有任务时，它会随机从其他工作线程的队列的尾部获取一个任务

****

#### 2.ForkJoin的一个例子

由于在归并排序时, 使用到了RecursiveAction, 这里就举一个RecursiveTask的例子:

通过ForkJoin并行计算斐波那契start~end的和:

MultiThreadFibonacci.java

```java
import java.util.concurrent.RecursiveTask;

/**
 * 通过ForkJoin并行计算斐波那契start~end的和
 *
 * @author zk
 */
public class MultiThreadFibonacci extends RecursiveTask<Long> {

    private int start;

    private int end;

    /**
     * 当计算10以下的斐波那契, 直接计算(避免创建过多调用栈, 进行优化)
     */
    private static final long THRESHOLD = 10L;

    public MultiThreadFibonacci(int start, int end) {
        this.start = start;
        this.end = end;
    }

    @Override
    protected Long compute() {
        int len = end - start;

        if (len <= THRESHOLD) {
            long sum = 0;
            for (int i = start; i <= end; ++i) {
                sum += fibByFormula(i);
            }
            return sum;
        } else {
            int mid = start + (end - start) / 2;
            MultiThreadFibonacci left = new MultiThreadFibonacci(start, mid);
            left.fork();

            MultiThreadFibonacci right = new MultiThreadFibonacci(mid + 1, end);
            right.fork();

            return left.join() + right.join();
        }
    }

    /**
     * 通过公式计算fib(n)
     */
    private static long fibByFormula(int n) {
        return (long) ((Math.pow((1 + Math.sqrt(5)) / 2, n) - Math.pow((1 - Math.sqrt(5)) / 2, n)) / Math.sqrt(5));
    }
}
```

><br/>
>
>**代码说明:**
>
>**① 类的定义**
>
>代码定义了MultiThreadFibonacci并继承自`RecursiveTask<Long>`说明这是一个有返回值的Task, 其中泛型表示返回值类型
>
>定义了start, end两个成员变量表示(当前)任务类求和的区间
>
>**② THRESHOLD阈值定义**
>
>对于分治思想的优化来讲, 对于较小的问题最好有可以直接解决的方法, 这样就避免了在小问题上创建大量的调用栈(快排, 归并排序等都采用了类似的优化)
>
>**③ compute()方法**
>
>当end - start <= THRESHOLD时, 直接计算小区间取值并返回
>
>否则将子数组继续左右划分, 并调用fork()方法执行;
>
>最后通过调用join()方法获取调用后的值[类似于Future调用], 并完成两个子线程的归并

运行代码:

MultiThreadFibonacciTest.java

```java
import algorithm.util.iostream.StdOut;
import org.junit.Test;

import static algorithm.basic.Fibonacci.fibByFormula;

public class MultiThreadFibonacciTest {

    @Test
    public void compute() {
        int left = 1, right = 50;
        MultiThreadFibonacci f = new MultiThreadFibonacci(left, right);
        long res = f.compute();
        System.out.println(String.format("The sum of %dth~%dth fibonacci is: %d", left, right, res));
    }

    /**
     * 对比单线程和并行的斐波那契
     */
    @Test
    public void compare() {
        int left = 1, right = 100000000;
        long res1 = 0, res2;

        long current = System.currentTimeMillis();
        for (int i = left; i <= right; i++) {
            res1 += fibByFormula(i);
        }
        StdOut.printf("%s (%d milliseconds)\n", "fibByFormula:", System.currentTimeMillis() - current);

        current = System.currentTimeMillis();
        MultiThreadFibonacci f = new MultiThreadFibonacci(left, right);
        res2 = f.compute();
        StdOut.printf("%s (%d milliseconds)\n", "MultiThreadFibonacci:", System.currentTimeMillis() - current);

        System.out.println(String.format("The sum of %dth~%dth fibonacci is: %d", left, right, res2));
        assert res1 == res2;
    }
}
```

上面的MultiThreadFibonacciTest测试类包括两个测试方法: compute()和compare()

其中:

**① compute()方法**

使用MultiThreadFibonacci并行计算了从fib(left)~fib(right)的求和

输出结果为: The sum of 1th~50th fibonacci is: 32951280098

<br/>

**② compare()方法**

对比单线程和并行的斐波那契, 对fib(left)~fib(right)进行求和

需要注意的是: 求和的值是fib(1) + … + fib(100000000), 计算结果可能已经溢出很多次了

(但是, 我们关注的是计算的性能比较, 所以仅在末尾比较两种方法的结果是否相等: `assert res1 == res2`)

结果如下:

```java
fibByFormula: (4547 milliseconds)
MultiThreadFibonacci: (960 milliseconds)
The sum of 1th~100000000th fibonacci is: 1293530146058730797
```

可见并行的速度还是很快的!

><br/>
>
>**说明:**
>
>这个试验方法仅仅作为测试, 实际上通过自底向上的计算菲波那切并叠加计算的效率在**单线程下**会更高
>
><br/>
>
>源代码: https://github.com/JasonkayZK/Java_Algorithm/tree/master/src/main/java/algorithm/basic
>
>更多斐波那契额相关: [Fibonacci序列生成算法的优化](https://jasonkayzk.github.io/2020/02/25/Fibonacci序列生成算法的优化/)

<br/>

### 二.基于多线程(ForkJoin)的归并排序的实现

下面看看如何用ForkJoin框架实现多线程归并排序

```java
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.RecursiveAction;

/**
 * 归并排序的多线程版本
 *
 * @author zk
 */
public class ParallelMergeSort extends BaseSort {

    @SuppressWarnings("unchecked")
    public static <K extends Comparable<K>> void parallelMergeSort(K[] arr) {
        K[] aux = (K[]) new Comparable[arr.length];

        ForkJoinPool pool = new ForkJoinPool();
        // 创建任务
        RecursiveAction mainTask = new MergeTask<>(arr, aux, 0, arr.length - 1);
        // 执行任务
        pool.invoke(mainTask);
    }

    public static class MergeTask<K extends Comparable<K>> extends RecursiveAction {
        /**
         * 小数组排序优化:
         * <p>
         * 小于500的子数组不再使用递归调用
         * <p>
         * 而是直接使用插入排序
         */
        private final int THRESHOLD = 15;

        private K[] arr;

        private K[] tmp;

        private int start;

        private int end;

        public MergeTask(K[] arr, K[] tmp, int start, int end) {
            this.arr = arr;
            this.tmp = tmp;
            this.start = start;
            this.end = end;
        }

        @Override
        protected void compute() {
            if (end - start <= THRESHOLD) {
                insertionSort(arr, start, end);
            } else {
                // 获取左一半和右一半
                int mid = start + (end - start) / 2;
                MergeTask leftTask = new MergeTask<>(arr, tmp, start, mid);
                MergeTask rightTask = new MergeTask<>(arr, tmp, mid + 1, end);

                // Recursively sort the two halves
                leftTask.fork();
                rightTask.fork();

                leftTask.join();
                rightTask.join();

                // Merge firstHalf with second
                merge(arr, tmp, start, mid + 1, end);
            }
        }
    }

    /**
     * 不使用辅助数组进行复制归并(但是仍需要空间)
     *
     * @param arr   源数组
     * @param tmp   目标数组
     * @param left  归并区间左边界
     * @param mid   归并区间切分位置
     * @param right 归并右边界
     */
    private static <K extends Comparable<K>> void merge(K[] arr, K[] tmp, int left, int mid, int right) {
        int leftEnd = mid - 1, tmpPos = left;
        int numElements = right - left + 1;

        while (left <= leftEnd && mid <= right) {
            if (less(arr[left], arr[mid]))
                tmp[tmpPos++] = arr[left++];
            else
                tmp[tmpPos++] = arr[mid++];
        }

        while (left <= leftEnd)
            tmp[tmpPos++] = arr[left++];

        while (mid <= right)
            tmp[tmpPos++] = arr[mid++];

        for (int i = 0; i < numElements; i++, right--)
            arr[right] = tmp[right];
    }

    /**
     * 使用插排排序a[lo...hi]子区间
     *
     * @param a  排序数组
     * @param lo 排序左边界
     * @param hi 排序右边界
     */
    private static <K extends Comparable<K>> void insertionSort(K[] a, int lo, int hi) {
        for (int i = lo; i <= hi; i++)
            for (int j = i; j > lo && less(a[j], a[j - 1]); j--)
                exch(a, j, j - 1);
    }
}
```

#### 1.代码说明

**① 线程安全的并发排序**

以上操作并没有涉及到锁: 虽然操作的是共享的数组，但是被读写的区域是被隔离开的

****

**② 继承自BaseSort**

BaseSort提供了排序通用的比较方法less(), 以及交换exch()等;

更详细的内容见: [几种常见排序方法的优化(上)](https://jasonkayzk.github.io/2020/02/24/几种常见排序方法的优化(上)/)

****

**③ 内部类MergeTask**

MergeTask继承自RecursiveAction(表示是一个无返回值的任务), 使用了THRESHOLD优化排序, 并通过arr和tmp数组共享排序数组和辅助数组;

最后通过调用compute方法, 完成分组, 排序, 归并操作

需要注意的是:

在创建新的MergeTask对象时, 如: `new MergeTask<>(arr, tmp, start, mid)`

此时传入的是索引(**而非使用arraycopy复制了一遍值!**)

****

**④ 辅助方法**

定义了merge()和insertionSort()方法, 分别用来完成并发排序后两个子数组的归并和针对小数组切换为插入排序的优化

>   <br/>
>
>   **延伸:**
>
>   快排也是基于分治的思想实现的, 当然递归会返回轴(pivot)的索引, 那么如何使用RecursiveTask实现一个并发的快排呢?

**⑤ 入口方法**

parallelMergeSort(K[] arr)是多线程归并排序的入口方法:

通过传入一个实现了Comparable接口的对象K的数组完成排序;

-   创建辅助数组
-   创建ForkJoin连接池
-   创建任务
-   执行任务

<br/>

#### 2.运行实例

使用ParallelMergeSort, 尝试对一百万个随机数排序:

```java
public class ParallelMergeSortTest {
    @Test
    public void parallelMergeSortTest() {
        // 排序大小
        final int sortSize = 1000000;

        Integer[] arr1 = RandomArrayUtil.getRandomBoxedIntArray(sortSize);
        System.out.println("Arrays created!");

        long startTime = System.currentTimeMillis();
        parallelMergeSort(arr1);
        long endTime = System.currentTimeMillis();
        System.out.println("Sequent time is: " + (endTime - startTime) + " milliseconds");
        assert BaseSort.isSorted(arr1);
    }
}
```

最终输出: Sequent time is: 771 milliseconds

可见排序速度还是很快的!

<br/>

### 三.使用Stream进行并发排序

在JDK 8之后, 正式加入了stream流的概念. 它与java.io包里的InputStream和OutputStream是完全不同的概念

#### 1.Stream简单介绍

JDK8中的Stream是对集合(Collection)对象功能的增强

它专注于对集合对象进行各种非常便利、高效的聚合操作(aggregate  operation)，或者大批量数据操作(bulk data operation). Stream API借助于同样新出现的Lambda表达式极大的提高编程效率和程序可读性

Stream不是集合元素，它不是数据结构并不保存数据，它是有关算法和计算的，它更像一个高级版本的 Iterator:

><br/>
>
>原始版本的Iterator: 用户只能显式地一个一个遍历元素并对其执行某些操作；
>
>而高级版本的Stream: 用户只要给出需要对其包含的元素执行什么操作, 比如: 过滤掉长度大于 10 的字符串、获取每个字符串的首字母等(Stream会隐式地在内部进行遍历，做出相应的数据转换)

Stream 就如同一个迭代器(Iterator): **单向, 不可往复, 数据只能遍历一次, 遍历过一次后即用尽了**(就好比流水流过, 一去不复返)

和迭代器又不同的是, Stream 可以并行化操作, 而迭代器只能命令式地、串行化操作

><br/>
>
>通常编写并行代码很难而且容易出错, 但使用 Stream API无需编写一行多线程的代码，就可以很方便地写出高性能的并发程序
>
>所以说，Java 8 中首次出现的java.util.stream是一个函数式语言+多核时代综合影响的产物

顾名思义，当使用串行方式去遍历时，每个item读完后再读下一个item

而使用并行去遍历时，数据会被分成多个段，其中每一个都在不同的线程中处理，然后将结果一起输出

Stream的并行操作依赖于 Java7 中引入的 Fork/Join 框架（JSR166y）来拆分任务和加速处理过程. 即: **实际上Stream并行流实际上就是一个帮你fork/join 后的API!**

#### 2.一个stream实例

下面一段代码通过Stream将一个Collection排序, 并将结果放入数组中:

```java
public void streamSortTest() {
    // 排序大小
    final int sortSize = 1000000;
    
    // 通过stream和一个Integer数组创建一个list
    List<Integer> list = Arrays
        .stream(RandomArrayUtil.getRandomBoxedIntArray(sortSize))
        .collect(Collectors.toList());
    System.out.println("Arrays created!");

    long startTime = System.currentTimeMillis();
    int[] res = list.stream().parallel().mapToInt(Integer::intValue).sorted().toArray();
    long endTime = System.currentTimeMillis();
    System.out.println("ParallelStream time is: " + (endTime - startTime) + " milliseconds");
    assert BaseSort.isSorted(res);
}
```

><br/>
>
>更多关于Stream和Lambda表达式: [Lambda表达式总结](https://jasonkayzk.github.io/2019/09/16/Lambda表达式总结/)

运行结果: ParallelStream time is: 198 milliseconds

将一百万个随机数排序仅仅用了198毫秒!

<br/>

### 四.排序性能测试

分别使用单线程归并排序, ForkJoin并发排序和Stream流排序对十万个、一百万个、一亿个随机数进行排序, 排序代码如下:

ParallelMergeSortTest.java

```java
public class ParallelMergeSortTest {
    /**
     * 比较单线程归并排序, ForkJoin并发排序和Stream流排序
     */
    @Test
    public void compareSort() {
        // 排序大小
        final int sortSize = 100000000;

        Integer[] arr1 = RandomArrayUtil.getRandomBoxedIntArray(sortSize);
        Integer[] arr2 = Arrays.copyOf(arr1, arr1.length);
        List<Integer> arr3 = Arrays.stream(arr1).collect(Collectors.toList());
        System.out.println("Arrays created!");

        long startTime = System.currentTimeMillis();
        MergeSort.sortTopDown(arr2);
        long endTime = System.currentTimeMillis();
        System.out.println("Sequent time is: " + (endTime - startTime) + " milliseconds");
        assert BaseSort.isSorted(arr2);

        startTime = System.currentTimeMillis();
        parallelMergeSort(arr1);
        endTime = System.currentTimeMillis();
        System.out.println("Parallel time is: " + Runtime.getRuntime().availableProcessors() + " processors is " + (endTime - startTime) + " milliseconds");
        assert BaseSort.isSorted(arr1);

        startTime = System.currentTimeMillis();
        int[] res = arr3.stream().parallel().mapToInt(Integer::intValue).sorted().toArray();
        endTime = System.currentTimeMillis();
        System.out.println("ParallelStream time is: " + (endTime - startTime) + " milliseconds");
        assert BaseSort.isSorted(res);
    }
}
```

执行结果为:

```markdown
1.排序十万个数:
  Sequent time is: 4 milliseconds
  Parallel time [16 processors] is: 34 milliseconds
  ParallelStream time is: 29 milliseconds

2.排序一百万个数
  Sequent time is: 461 milliseconds
  Parallel time [16 processors] is: 435 milliseconds
  ParallelStream time is: 220 milliseconds

3.排序一亿个数
  Sequent time is: 58868 milliseconds
  Parallel time [16 processors] is: 28884 milliseconds
  ParallelStream time is: 1606 milliseconds
```

分析:

**① 排序十万个数**

由于创建、调用线程需要转入系统内核态, 此时并发Parallel和Stream的性能是较低的！

****

**② 排序一百万个数**

此时并发排序的性能的提升已经可以忽略创建、调用线程需要转入系统内核态消耗的时间, 所以此时Parallel性能略高于Sequent, 但是不如ParallelStream

****

**③ 排序一亿个数**

单线程排序一亿个随机数需要大概一分钟的时间(58.868秒);

而优化后使用并行的归并排序Parallel(CPU为8核十六线程)花费时间: 28.884秒(**时间缩短了一半多!**)

而并行的stream方法仅仅用了1.606秒, 这个性能相当恐怖了!

所以结论就是: **能用stream进行的集合操作, 一定要用stream(十万以下容量的小数组除外!)**

<br/>

### 附录

参考文章:

-   [如何用多线程实现归并排序](https://blog.csdn.net/whut2010hj/article/details/81540915)
-   [Fork/Join框架与Java8 Stream API 之并行流的速度比较](https://www.cnblogs.com/ITyunbook/p/10892472.html)

源代码: 

- 源代码: https://github.com/JasonkayZK/Java_Algorithm/tree/master/src/main/java/algorithm/sort
- 测试代码: https://github.com/JasonkayZK/Java_Algorithm/tree/master/src/test/java/algorithm/sort

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

公众号内容和博客同步更新~

<br/>

