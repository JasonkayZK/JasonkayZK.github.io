---
title: QuickSort总结
toc: true
date: 2020-02-06 11:00:05
cover: https://img.paulzzh.tech/touhou/random?21
categories: 算法
tags: [算法, 排序]
description: 最近总结面试题, 复习了一下面试题, 顺便研究了一下快排的优化
---

最近总结面试题, 复习了一下面试题, 顺便研究了一下快排的优化

主要内容:

-   快排算法实现原理
-   基于Java的快排算法实现
-   通过泛型和Comparator接口实现任意数据任意顺序排序
-   快排时间复杂度(最好, 最差, 平均), 空间复杂度
-   快排可做的优化

<br/>

<!--more-->

## QuickSort

快速排序(Quicksort)是对冒泡排序的一种改进, **对数据量越大，数据分布越混乱的，一般认为是性能最好的**, 快排是分治思想的一种体现，把大的问题细化成小问题，把小问题细化成更小的问题，最终把问题缩小到一定规模内，可解决

### 算法实现

1). 先从数列中取出一个数作为基准数

2). 分区过程，将比这个数大的数全放到它的右边，小于或等于它的数全放到它的左边

3). 再对左右区间重复第二步，直到各区间只有一个数

如图:

![QuickSort.png](https://upload-images.jianshu.io/upload_images/5644137-43b34643d2531ef1.png?imageMogr2/auto-orient/strip|imageView2/2)

<br/>

下面贴出代码(从小到大排序):

>   <br/>
>
>   **说明:**
>
>   **算法使用到了挖坑填数法, 即每次将一个数填入下一个坑中(最开始为key)**

```java
import java.util.Arrays;

/**
 * @author zk
 */
public class QuickSort {

    public static void main(String[] args){
        Integer[] a1 = {1, 6, 8, 7, 3, 5, 16, 4, 8, 36, 13, 44};
        // 从小到大
        quickSort(a1, 0, a1.length - 1);
        System.out.println("Answer: " + Arrays.toString(a1));
    }

    private static void quickSort(Integer[] arr, int start, int end){
        if (arr.length <= 1 || start >= end)return;

        // 选定数组第一个数字作为key
        int left = start, right = end, key = arr[left];

        while (left < right){
            // 从右向左遍历,找到小于key的,放入下标left中
            while (left < right && arr[right] >= key)right--; // 相等也要移动
            arr[left] = arr[right];
            // 从左向右遍历,找到大于key的,放入下标right中
            while (left < right && arr[left] <= key)left++; // 相等也要移动
            arr[right] = arr[left];
        }

        // 此时left == right, 这就是所谓的轴，把key放入轴中，轴左边的都<key,轴右边的都>key
        arr[left] = key;

        System.out.println(Arrays.toString(arr));

        // 此时轴在数组中间，说明把数组分成两部分，此时要对这两部分分别进行快排
        quickSort(arr, start, left - 1);
        quickSort(arr, left + 1, end);
    }

}

/* Output */
[1, 6, 8, 7, 3, 5, 16, 4, 8, 36, 13, 44]
[1, 4, 5, 3, 6, 7, 16, 8, 8, 36, 13, 44]
[1, 3, 4, 5, 6, 7, 16, 8, 8, 36, 13, 44]
[1, 3, 4, 5, 6, 7, 16, 8, 8, 36, 13, 44]
[1, 3, 4, 5, 6, 7, 13, 8, 8, 16, 36, 44]
[1, 3, 4, 5, 6, 7, 8, 8, 13, 16, 36, 44]
[1, 3, 4, 5, 6, 7, 8, 8, 13, 16, 36, 44]
[1, 3, 4, 5, 6, 7, 8, 8, 13, 16, 36, 44]
Answer: [1, 3, 4, 5, 6, 7, 8, 8, 13, 16, 36, 44]
```

><br/>
>
><font color="#f00">**注意: 如果在两个while循环中, 不判断相等的情况, 遇到数值相同的情况时将出现死循环(如上例)**</font>

<br/>

### 基于泛型的实现(任意类型, 任意顺序)

与Arrays.sort()方法类似, 我们可以对泛型类型`<T>`构建一个传入`Comparator<? super T>`类型的比较器, 通过比较器进行排序, 最终完成对任意指定类型, 任意指定顺序的排序:

```java
import java.util.Arrays;
import java.util.Comparator;

/**
 * @author zk
 */
public class QuickSort {

    public static void main(String[] args){
        Integer[] a1 = {1, 6, 8, 7, 3, 5, 16, 4, 8, 36, 13, 44};

        // 大到小
        quickSort(a1, 0, a1.length - 1, Comparator.reverseOrder());
        System.out.println("Answer: " + Arrays.toString(a1));

        // 小到大
        quickSort(a1, 0, a1.length - 1, Comparator.comparingInt(x -> x));
        System.out.println("Answer: " + Arrays.toString(a1));
    }

    private static <T> void quickSort(T[] arr, int start, int end, Comparator<? super T> comparator){
        if (arr.length <= 1 || start >= end)return;

        int left = start, right = end;
        var key = arr[left];
        while (left < right){
            while (left < right && comparator.compare(arr[right], key)>= 0)right--;
            arr[left] = arr[right];

            while (left < right && comparator.compare(arr[left], key)<= 0)left++;
            arr[right] = arr[left];
        }

        arr[left] = key;
        System.out.println(Arrays.toString(arr));

        quickSort(arr, start, left - 1, comparator);
        quickSort(arr, left + 1, end, comparator);
    }
}
/* Output */
[44, 6, 8, 7, 3, 5, 16, 4, 8, 36, 13, 1]
[44, 6, 8, 7, 3, 5, 16, 4, 8, 36, 13, 1]
[44, 13, 8, 7, 36, 8, 16, 6, 4, 5, 3, 1]
[44, 16, 36, 13, 7, 8, 8, 6, 4, 5, 3, 1]
[44, 36, 16, 13, 7, 8, 8, 6, 4, 5, 3, 1]
[44, 36, 16, 13, 8, 8, 7, 6, 4, 5, 3, 1]
[44, 36, 16, 13, 8, 8, 7, 6, 4, 5, 3, 1]
[44, 36, 16, 13, 8, 8, 7, 6, 5, 4, 3, 1]
Answer: [44, 36, 16, 13, 8, 8, 7, 6, 5, 4, 3, 1]
[1, 36, 16, 13, 8, 8, 7, 6, 5, 4, 3, 44]
[1, 36, 16, 13, 8, 8, 7, 6, 5, 4, 3, 44]
[1, 3, 16, 13, 8, 8, 7, 6, 5, 4, 36, 44]
[1, 3, 16, 13, 8, 8, 7, 6, 5, 4, 36, 44]
[1, 3, 4, 13, 8, 8, 7, 6, 5, 16, 36, 44]
[1, 3, 4, 13, 8, 8, 7, 6, 5, 16, 36, 44]
[1, 3, 4, 5, 8, 8, 7, 6, 13, 16, 36, 44]
[1, 3, 4, 5, 8, 8, 7, 6, 13, 16, 36, 44]
[1, 3, 4, 5, 6, 8, 7, 8, 13, 16, 36, 44]
[1, 3, 4, 5, 6, 8, 7, 8, 13, 16, 36, 44]
[1, 3, 4, 5, 6, 7, 8, 8, 13, 16, 36, 44]
Answer: [1, 3, 4, 5, 6, 7, 8, 8, 13, 16, 36, 44]
```

<br/>

### 快排复杂度分析

**① 时间复杂度**

快速排序的时间性能取决于快速排序递归的深度，可以用递归树来描述递归算法的执行情况

**最优情况下**

​                                在最优情况下，Partition每次都划分得很均匀，如果排序n个关键字，其递归树的深度就为: |log2n|+1(|x|表示不大于x的最大整数)，即仅需递归log2n次

如果遍历一次需要时间为T(n)的话:

-   第一次Partiation应该是需要对整个数组扫描一遍，做n次比较

-   然后，获得的枢轴将数组一分为二，那么各自还需要T(n/2)的时间(注意是最好情况，所以平分两半)

-   于是不断地划分下去，我们就有了下面的不等式推断

    T(n) ≤ 2T(n/2) + n, T(1)= 0  

    T(n) ≤ 2(2T(n/4)+n/2) + n = 4T(n/4) + 2n  

    T(n) ≤ 4(2T(n/8)+n/4) + 2n = 8T(n/8) + 3n  

    ……

    T(n) ≤ nT(1) + (log2n)×n ~ O(nlogn)

<font color="#f00">**最优的情况下，快速排序算法的时间复杂度为O(nlogn)**</font>

**最坏情况下**

在最坏的情况下，待排序的序列为正序或者逆序，每次划分只得到一个比上一次划分少一个记录的子序列，注意另一个为空, 如果递归树画出来，它就是一棵斜树

此时需要执行n‐1次递归调用，且第i次划分需要经过n‐i次关键字的比较才能找到第i个记录，也就是枢轴的位置，因此比较次数为

n - 1 + n - 2 + … + 1 = n(n - 1) / 2 ~ O(n<sup>2</sup>)

<font color="#f00">**最终最坏条件下时间复杂度为O(n<sup>2</sup>)**</font>

**平均时间复杂度**

平均的情况，设枢轴的关键字应该在第k的位置(1≤k≤n)，那么：

[![img](http://images.51cto.com/files/uploadimg/20110826/222801489.jpg)](http://images.51cto.com/files/uploadimg/20110826/222801489.jpg)

由数学归纳法可证明，其数量级为O(nlogn)

<br/>

****

**② 空间复杂度**

就空间复杂度来说，主要是**递归造成的栈空间的使用**

-   最好情况，递归树的深度为log2n，其空间复杂度也就为O(logn)
-   最坏情况，需要进行n‐1递归调用，其空间复杂度为O(n)
-   平均情况，空间复杂度也为O(logn)

><br/>
>
>**其他: 由于关键字的比较和交换是跳跃进行的，因此，快速排序是一种不稳定的排序方法**

<br/>

### 快排的优化

关于快排的优化主要有:

-   针对key值(或被称为pivot)进行选取(而不是取首个元素)
    -   随机数选取
    -   根据数组的arr[0]、arr[arr.length / 2]和arr[arr.length - 1]做比较选取
    -   ……
-   对于较小的数组(或者已处于相当有序的数据)采用插排
-   ……

更多详细优化方法和性能比较可查看: [快排的优化（简直神乎其神了！！！）](https://blog.csdn.net/msdnwolaile/article/details/52133674?utm_source=blogxgwz7)

<br/>