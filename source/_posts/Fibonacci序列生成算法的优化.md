---
title: Fibonacci序列生成算法的优化
toc: true
date: 2020-02-25 16:38:54
cover: http://api.mtyqx.cn/api/random.php?24
categories: 算法
tags: [算法]
description: 菲波那切数列在一些场景中很有用. 相信如何计算第n个斐波那契数是一些人接触到的第一个递归算法(尽管他的效率很低). 本篇讲述了如何一步步优化计算fib(n)
---

菲波那切数列在一些场景中很有用. 相信如何计算第n个斐波那契数是一些人接触到的第一个递归算法(尽管他的效率很低). 本篇讲述了如何一步步优化计算fib(n)

本文内容包括:

-   菲波那切数列定义
-   计算斐波那契方法
    -   递归
    -   循环
    -   通项公式
    -   矩阵乘法
-   斐波那契方法性能测试

源代码: https://github.com/JasonkayZK/Java_Algorithm/tree/master/src/main/java/algorithm/basic

本文部分内容转自: [斐波那契数列 --- 四层优化](https://www.cnblogs.com/zkfopen/p/11245857.html)

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>

<!--more-->

## 斐波那契数列

数学函数定义:

fib(0) = 0, fib(1) = 1;

fib(n) = fib(n - 2) + fib(n - 1) [n > 1]

### 计算方法

#### **方法1（递归）**

```java
/**
 * 斐波那契数列生成算法
 */
public class Fibonacci {
    /**
     * 递归计算生成fib(n)
     * 
     * 时间复杂度: O(N^2)
     * 
     * 空间复杂度：O(N)
     */
    public static long fibRecursively(int n) {
        return n < 2 ? Math.max(0, n) : fibRecursively(n - 1) + fibRecursively(n - 2);
    }
}
```

****

#### 方法2（循环）

```java
/**
     * 循环计算fib(n)
     * 
     * 时间复杂度：O（N）
     * 
     * 空间复杂度：O（1）
     */
public static long fibByArray(int n) {
    if (n <= 2) return Math.max(0, n);

    long fibOne = 1, fibTwo = 0, fibN = 0;
    for (int i = 1; i < n; i++) {
        fibN = fibOne + fibTwo;
        fibTwo = fibOne;
        fibOne = fibN;
    }
    return fibN;
}
```

****

#### 方法3（通项公式）

斐波那契的通项公式为: `fib(n) = 1/sqrt(5) * (((1+sqrt(5)) / 2) ^ n - ((1-sqrt(5)) / 2) ^ n`

所以有:

```java
/**
     * 通过公式计算fib(n)
     * 
     * 时间复杂度：O（logN）
     * 
     * 空间复杂度：O（1）
     *
     */
public static long fibByFormula(int n) {
    return (long) ((Math.pow((1 + Math.sqrt(5)) / 2, n) - Math.pow((1 - Math.sqrt(5)) / 2, n)) / 		Math.sqrt(5));
}
```

****

#### 方法4（矩阵乘法实现，最优解）

算法原理:

![fibonacci_matrix1.png](https://img2018.cnblogs.com/blog/1425284/201907/1425284-20190725173707805-713685239.png)

![fibonacci_matrix2.png](https://img2018.cnblogs.com/blog/1425284/201907/1425284-20190725173718819-342184474.png)

总结成一句话就是, 可以**将求解变为类似于生成快速幂的形式**

代码如下:

```java
/**
     * 矩阵乘法实现(单线程最优解)
     *
     * @param n 计算fib(n)
     * @return fib(n)
     */
public static long fibByMatrix(int n) {
    if (n <= 2) return Math.max(0, n);
    FibMatrix fibMatrix = FibMatrix.power(n - 1);
    return fibMatrix.m00;
}

/**
     * fibByMatrix计算使用到的2x2的矩阵
     */
private static class FibMatrix {
    private long m00;

    private long m01;

    private long m10;

    private long m11;

    public FibMatrix(long m00, long m01, long m10, long m11) {
        this.m00 = m00;
        this.m01 = m01;
        this.m10 = m10;
        this.m11 = m11;
    }

    /**
         * 定义2×2矩阵的乘法运算
         *
         * @param matrix1 matrix1
         * @param matrix2 matrix2
         * @return 矩阵乘法结果
         */
    public static FibMatrix multiply(FibMatrix matrix1, FibMatrix matrix2) {
        FibMatrix matrix12 = new FibMatrix(1, 1, 1, 0);

        matrix12.m00 = matrix1.m00 * matrix2.m00 + matrix1.m01 * matrix2.m10;
        matrix12.m01 = matrix1.m00 * matrix2.m01 + matrix1.m01 * matrix2.m11;
        matrix12.m10 = matrix1.m10 * matrix2.m00 + matrix1.m11 * matrix2.m10;
        matrix12.m11 = matrix1.m10 * matrix2.m01 + matrix1.m11 * matrix2.m11;
        return matrix12;
    }

    /**
         * 定义2×2矩阵的幂运算(使用快速幂的方法)
         *
         * @return 矩阵的n次幂
         */
    public static FibMatrix power(int n) {
        FibMatrix matrix = new FibMatrix(1, 1, 1, 0);
        if (n == 1) {
        } else if (n % 2 == 0) {
            matrix = power(n / 2);
            matrix = multiply(matrix, matrix);
        } else if (n % 2 == 1) {
            matrix = power((n - 1) / 2);
            matrix = multiply(matrix, matrix);
            matrix = multiply(matrix, new FibMatrix(1, 1, 1, 0));
        }
        return matrix;
    }
}
```

><br/>
>
>**代码说明:**
>
>声明了一个内部类FibMatrix是一个2x2的数组, 并定义了矩阵乘和矩阵幂
>
>由上面理论分析可知: **通过计算矩阵的快速幂FibMatrix.power(n-1)即可求得fib(n)**

<br/>

### 斐波那契方法性能测试

比较上面几种方式的性能, 代码如下:

```java
import algorithm.util.iostream.StdOut;
import org.junit.Test;
import top.jasonkayzk.jutil.RandomUtils;

import static algorithm.basic.Fibonacci.fibByArray;
import static algorithm.basic.Fibonacci.fibByFormula;
import static algorithm.basic.Fibonacci.fibByMatrix;
import static algorithm.basic.Fibonacci.fibRecursively;
import static algorithm.basic.Fibonacci.test;

public class FibonacciTest {
    /**
     * 比较所有算法计算fib(50)
     *
     */
    @Test
    public void compare() {
        long current = System.currentTimeMillis();
        long res = fibRecursively(50);
        StdOut.printf("%s (%d milliseconds)\n", "fibRecursively:", System.currentTimeMillis() - current);
        assert test(50, res);

        current = System.currentTimeMillis();
        res = fibByArray(50);
        StdOut.printf("%s (%d milliseconds)\n", "fibByArray:", System.currentTimeMillis() - current);
        assert test(50, res);

        current = System.currentTimeMillis();
        res = fibByFormula(50);
        StdOut.printf("%s (%d milliseconds)\n", "fibByFormula:", System.currentTimeMillis() - current);
        assert test(50, res);

        current = System.currentTimeMillis();
        res = fibByMatrix(50);
        StdOut.printf("%s (%d milliseconds)\n", "fibByMatrix:", System.currentTimeMillis() - current);
        assert test(50, res);
    }

}
```

><br/>
>
>**代码说明:**
>
>通过计算fib(50)简单比较几种计算菲波那切数列的方法
>
>`assert test(50, res);`保证了各方法计算结果的正确性

计算结果:

```
fibRecursively: (60008 milliseconds)
fibByArray: (0 milliseconds)
fibByFormula: (0 milliseconds)
fibByMatrix: (0 milliseconds)
```

可见: 除了递归方法, 其他方法都能保证在以毫秒之内完成计算

<br/>

### 附录

源代码: https://github.com/JasonkayZK/Java_Algorithm/tree/master/src/main/java/algorithm/basic

<br/>

本文部分内容转自: [斐波那契数列 --- 四层优化](https://www.cnblogs.com/zkfopen/p/11245857.html)

<br/>