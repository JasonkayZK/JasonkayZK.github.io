---
title: 使用Uber开源的goleak库进行goroutine泄露检测
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?9'
date: 2021-04-21 15:40:13
categories: Golang
tags: [Golang, 技术杂谈, Goroutine]
description: goroutine 作为 golang 并发实现的核心组成部分，非常容易上手使用，但却很难驾驭得好。我们经常会遭遇各种形式的 goroutine 泄漏，这些泄漏的 goroutine 会一直存活直到进程终结。它们的占用的栈内存一直无法释放、关联的堆内存也不能被GC清理，系统的可用内存会随泄漏 goroutine 的增多越来越少，直至崩溃！Uber开源了goleak库可以帮助我们检测代码中可能存在的goroutine泄露问题；
---

goroutine 作为 golang 并发实现的核心组成部分，非常容易上手使用，但却很难驾驭得好。我们经常会遭遇各种形式的 goroutine 泄漏，这些泄漏的 goroutine 会一直存活直到进程终结。它们的占用的栈内存一直无法释放、关联的堆内存也不能被GC清理，系统的可用内存会随泄漏 goroutine 的增多越来越少，直至崩溃！

Uber开源了goleak库可以帮助我们检测代码中可能存在的goroutine泄露问题；

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/goleak-demo

<br/>

<!--more-->

## **使用Uber开源的goleak库进行goroutine泄露检测**

### **什么是Goroutine泄露**

`goroutine leak` 的意思是go协程泄漏，那么什么又是协程泄漏呢？

<font color="#f00">**我们知道，每次使用go关键字开启一个gorountine任务，经过一段时间的运行，最终是会结束，从而进行系统资源的释放回收。而如果由于操作不当导致一些goroutine一直处于阻塞状态或者永远运行中，永远也不会结束，这就必定会一直占用系统资源；最坏的情况下是随着系统运行，一直在创建此类goroutine，那么最终结果就是程序崩溃或者系统崩溃；这种情况我们一般称为goroutine leak；**</font>

例如下面的一段代码：

```go
package main
 
import (  
    "fmt"  
    "math/rand"  
    "runtime"  
    "time"  
)
 
func query() int {  
    n := rand.Intn(100)  
    time.Sleep(time.Duration(n) * time.Millisecond)  
    return n  
}

// 每次执行此函数，都会导致有两个goroutine处于阻塞状态
func queryAll() int {  
    ch := make(chan int)  
    go func() { ch <- query() }()  
    go func() { ch <- query() }()  
    go func() { ch <- query() }()  
    // <-ch
    // <-ch
    return <-ch  
}

func main() {  
    // 每次循环都会泄漏两个goroutine
    for i := 0; i < 4; i++ {  
        queryAll()  
        // main()也是一个主groutine
        fmt.Printf("#goroutines: %d\n", runtime.NumGoroutine())  
    }  
}
```

输出如下：

```
#goroutines: 3
#goroutines: 5
#goroutines: 7
#goroutines: 9
```

这里发现goroutine的数量一直在增涨，按理说这里的值应该一直是 1 才对(只有一个Main 函数的主goroutine)，其实这里发生了goroutine泄漏的问题：

主要问题发生在 queryAll() 函数里，这个函数在goroutine里往ch里连续三次写入了值，由于这里是无缓冲的ch，所以在写入值的时候，要有在ch有接收者时才可以写入成功，也就是说在从接收者从ch中获取值之前, 前面三个ch<-query() 一直处于阻塞的状态；

当执行到queryAll()函数的 return语句时，ch接收者获取一个值(意思是说三个ch<-query() 中执行最快的那个goroutine写值到ch成功了，还剩下两个执行慢的 ch<-query() 处于阻塞)并返回给调用主函数时，仍有两个ch处于浪费的状态；

**在Main函数中对于for循环：**

-   第一次：goroutine的总数量为 1个主goroutine + 2个浪费的goroutine = 3；
-   第二次：3 + 再个浪费的2个goroutine = 5；
-   第三次：5 + 再个浪费的2个goroutine = 7；
-   第三次：7 + 再个浪费的2个goroutine = 9；

正好是程序的输出结果；

>   **解决方案：**
>
>   可以看到，主要是ch写入值次数与读取的值的次数不一致导致的有ch一直处于阻塞浪费的状态，我们所以我们只要保存写与读的次数完全一样就可以了；
>
>   **这里我们把上面queryAll() 函数代码注释掉的 <-ch 两行取消掉，再执行就正常了，输出内容如下：**
>
>   ```
>   #goroutines: 1
>   #goroutines: 1
>   #goroutines: 1
>   #goroutines: 1
>   ```
>
>   当然对于解决goroutine的方法不是仅仅这一种，也可以利用context来解决，参考：
>
>   -   https://www.cnblogs.com/chenqionghe/p/9769351.html

总结如下：

#### **产生goroutine leak的原因**

-   <font color="#f00">**goroutine由于channel的读/写端退出而一直阻塞，导致goroutine一直占用资源，而无法退出，如只有写入，没有接收，反之一样；**</font>
-   <font color="#f00">**goroutine进入死循环中，导致资源一直无法释放；**</font>

>   **提醒：垃圾收集器不会收集以下形式的goroutines：**
>
>   ```go
>   go func() {
>   // <操作会在这里永久阻塞>
>   }()
>   // Do work
>   ```
>
>   这个goroutine将一直存在，直到整个程序退出；
>
>   是否属于goroutine leak 还需要看如何使用了，如https://www.jianshu.com/p/b524c6762662。如果处理不好，如for{} 根本就不可能结束，此时就属于泄漏；
>
>   所以我们写程序时，至少要保证他们结束的条件，且一定可以结束才算正常；

#### **goroutine终止的场景**

-   <font color="#f00">**goroutine完成它的工作**</font>
-   <font color="#f00">**由于发生了没有处理的错误**</font>
-   <font color="#f00">**收到结束信号，直接终止任务**</font>

**可以看出来，goroutine 的泄漏通常伴随着复杂的协程间通信，而代码评审和常规的单元测试通常更专注于业务逻辑正确，很难完全覆盖 goroutine 泄漏的场景；**

**同时，`pprof` 等性能分析工具更多是作用于监控报警/故障之后的复盘。我们需要一款能在编译部署前识别 goroutine 泄漏的工具，从更上游把控工程质量；**

[goleak](https://github.com/uber-go/goleak) 是 Uber 团队开源的一款 goroutine 泄漏检测工具，它可以非常轻量地集成到测试中，对于 goroutine 泄漏的防治和工程鲁棒性的提升很有帮助；

<br/>

### **使用 uber-go/goleak 工具检测goleak**

上面我们是手动通过获取 groutine数量来判断是否存在泄漏的，下面我们使用 uber-go/goleak工具来检测是否存在泄漏问题；

下面的函数在每次调用时都会造成一个goroutine泄露：

```go
func leak() {
	ch := make(chan struct{})
	go func() {
		ch <- struct{}{}
	}()
}
```

通常我们会为 `leak`函数写类似下面的测试：

```go
func TestLeak(t *testing.T) {
    leak()
}
```

用 `go test` 执行测试看看结果：

```bash
$ go test -v -run ^TestLeak$
=== RUN   TestLeak
--- PASS: TestLeak (0.00s)
PASS
ok      cool-go.gocn.vip/goleak 0.007s
```

**测试不出意外地顺利通过了！**

<font color="#f00">**go 内置的测试显然无法帮我们识别 `leak`中的 goroutine 泄漏！**</font>

在使用goleak进行goroutine泄露测试时，通常我们只需关注 `VerifyNone` 和 V`erifyTestMain` 两个方法，它们也对应了 `goleak` 的两种集成方式；

#### **随用例集成**

在现有测试的首行添加 `defer goleak.VerifyNone(t)`，即可集成 goleak 泄漏检测：

```go
func TestLeakWithGoleak(t *testing.T) {
    defer goleak.VerifyNone(t)
    leak()
}
```

这次的 go test 失败了：

```bash
$ go test -v -run ^TestLeakWithGoleak$
=== RUN   TestLeakWithGoleak
    leaks.go:78: found unexpected goroutines:
        [Goroutine 19 in state chan send, with cool-go.gocn.vip/goleak.leak.func1 on top of the stack:
        goroutine 19 [chan send]:
        cool-go.gocn.vip/goleak.leak.func1(0xc00008c420)
                /Users/blanet/gocn/goleak/main.go:24 +0x35
        created by cool-go.gocn.vip/goleak.leak
                /Users/blanet/gocn/goleak/main.go:23 +0x4e
        ]
--- FAIL: TestLeakWithGoleak (0.45s)
FAIL
exit status 1
FAIL    cool-go.gocn.vip/goleak 0.459s
```

测试报告显示名为 `leak.func1` 的 goroutine 发生了泄漏**（`leak.func1` 在这里指的是 `leak` 方法中的第一个匿名方法）**，并将测试结果置为失败；

我们成功通过 `goleak` 找到了 goroutine 泄漏；

#### **通过 TestMain 集成**

如果觉得逐用例集成 `goleak` 的方式太过繁琐或 “入侵” 性太强，可以试试完全不改变原有测试用例，通过在 `TestMain`中添加 `goleak.VerifyTestMain(m)` 的方式集成 `goleak`：

```go
func TestMain(m *testing.M) {
    goleak.VerifyTestMain(m)
}
```

这次的 `go test` 输出如下：

```bash
$ go test -v -run ^TestLeak$
=== RUN   TestLeak
--- PASS: TestLeak (0.00s)
PASS
goleak: Errors on successful test run: found unexpected goroutines:
[Goroutine 19 in state chan send, with cool-go.gocn.vip/goleak.leak.func1 on top of the stack:
goroutine 19 [chan send]:
cool-go.gocn.vip/goleak.leak.func1(0xc00008c2a0)
        /Users/blanet/gocn/goleak/main.go:24 +0x35
created by cool-go.gocn.vip/goleak.leak
        /Users/blanet/gocn/goleak/main.go:23 +0x4e
]
exit status 1
FAIL    cool-go.gocn.vip/goleak 0.455s
```

可见，`goleak` 再次成功检测到了 goroutine 泄漏；

<font color="#f00">**但与逐用例集成不同的是，`goleak.VerifyTestMain`会先报告用例执行的结果，然后再进行泄漏分析；**</font>

<font color="#f00">**同时，如果单次测试执行了多个用例且最终发生泄漏，那么以 `TestMain` 方式集成的 `goleak` 并不能精准定位发生 goroutine 泄漏的用例，还需进一步分析；**</font>

>   **`goleak` 提供了如下脚本用于进一步推断具体发生 goroutine 泄漏的用例，其本质是逐一执行所有用例进行分析：**

```bash
# Create a test binary which will be used to run each test individually
$ go test -c -o tests

# Run each test individually, printing "." for successful tests, or the test name
# for failing tests.
$ for test in $(go test -list . | grep -E "^(Test|Example)"); do
    ./tests -test.run "^$test\$" &>/dev/null && echo -n "." || echo "\n$test failed"
done
```

<br/>

### **总结**

`goleak` 通过对运行时的栈分析获取 goroutine 状态，并设计了非常简洁易用的接口与测试框架进行对接，是一款小巧强悍的 goroutine 泄漏防治利器；

当然，完备的测试用例支持是 `goleak` 发挥作用的基础，大家还是要老老实实写测试，稳稳当当搞生产！

<br/>

## **附录**

文章参考：

-   https://mp.weixin.qq.com/s/3iPqxiK2mf9Fl5CSZ9U7RQ
-   https://blog.haohtml.com/archives/19308

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/goleak-demo

<br/>