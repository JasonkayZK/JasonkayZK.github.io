---
title: Go创建Goroutine时显式调用时的坑
toc: true
cover: 'https://acg.toubiec.cn/random?23'
date: 2021-01-21 11:27:42
categories: Golang
tags: [Golang, GoRoutine]
description: 在Go中可以直接通过go关键字直接创建一个goroutine并在子goroutine中直接调用函数；但是有时候由于调用的方式不同会存在一些问题；
---

在Go中可以直接通过go关键字直接创建一个goroutine并在子goroutine中直接调用函数；

但是有时候由于调用的方式不同会存在一些问题；

源代码：

-   https://github.com/JasonkayZK/go_traps_and_pitfalls/tree/goroutine

<br/>

<!--more-->

## **Go创建Goroutine时显式调用时的坑**

### **Goroutine调用概述**

对于go关键字创建新goroutine并调用函数的方式有两种：

-   隐式传参调用
-   显式传参调用

```go
func main() {
	x := 1
	// 隐式传参调用
	// 此时传入的是x的“引用值”，即两个x指向的是同一个内存地址，在子routine中修改的值，会改变外部的x！
	go func() {
		fmt.Println(x)
	}()

	// 直接传参调用
	// 此时为值传递，内部的x不会影响外部的x；
	go func(x int) {
		fmt.Println(x)
	}(x)
}
```

两者的区别在于：

-   当隐式传参时：此时传入的是x的“引用值”，即两个x指向的是同一个内存地址，在子routine中修改的值，会改变外部的x！
-   当显式传参时：此时为值传递，内部的x不会影响外部的x；

另外，需要注意的：<font color="#f00">**显式的传参，在传参时就必须将参数计算好，这一点和defer函数是相同的！**</font>

例如：

```GO
func main() {
	wg := sync.WaitGroup{}
	wg.Add(2)

	x := 1
	// 隐式传参调用
	// 此时传入的是x的“引用值”，即两个x指向的是同一个内存地址，在子routine中修改的值，会改变外部的x！
	go func() {
		fmt.Printf("Implicit invoke: %d\n", x)
		wg.Done()
	}()

	// 直接传参调用
	// 此时为值传递，内部的x不会影响外部的x；
	go func(x int) {
		fmt.Printf("Direct invoke: %d\n", x)
		wg.Done()
	}(x)

	x = 3

	wg.Wait()
}
```

上面的函数大概率输出为：

```
Direct invoke: 1
Implicit invoke: 3
```

这是因为，在直接传参调用时，x的值还未被修改(仍然是1)并且已经被确定，而隐式传参调用会根据外部x值的改变而改变；

>   **之所以说是`大概率`是因为，一般情况下，隐式传参调用的goroutine执行速度还是比main中执行至`x=3`语句要慢的，所以，大概率会先执行`x=3`修改x的值，随后才会执行隐式传参调用！**

<br/>

### **一道关于 Goroutine 的题**

下面的代码输出什么呢？

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    ch1 := make(chan int)
    go fmt.Println(<-ch1)
    ch1 <- 5
    time.Sleep(1 * time.Second)
}
```

以上代码输出什么？（单选）

-   A：5
-   B：不能编译
-   C：运行时死锁

如果你耐心看了上面的讲解，可以很容易知道正确答案是：C；

因为：

在上方创建Goroutine进行调用时，实际上是**显式传参！**

所以，上方的代码其实类似于：

```go
func main() {
    ch1 := make(chan int)
    x := <-ch1
    go fmt.Println(x)
    ch1 <- 5
    time.Sleep(1 * time.Second)
}
```

此时`x := <-ch1`会阻塞main函数，而`ch1 <- 5`也是在main函数中调用的，所以会被阻塞，最终造成死锁！

<br/>

### **附录**

Goroutine题目来源：

-   [Go语言爱好者周刊：第 78 期 — 这道关于 goroutine 的题](https://mp.weixin.qq.com/s/kma8hvdLVPIkZnKw_MaSKg)

源代码：

-   https://github.com/JasonkayZK/go_traps_and_pitfalls/tree/goroutine

<br/>