---
title: 控制Goroutine数量的方法
toc: true
cover: 'https://img.paulzzh.com/touhou/random?55'
date: 2021-10-22 17:49:57
categories: Golang
tags: [Golang, Goroutine, 并发编程]
description: 在我们写代码的时候，经常会有批量创建任务并等待返回的场景；此时使用生产消费者并发的提交任务来代替for循环逐个执行任务能够大大提高代码效率；然而不加限制的创建Goroutine也是会有内存溢出、CPU切换过多等资源浪费的情况；本文讲述了Go中一些常用的控制Goroutine数量的方法；
---

在我们写代码的时候，经常会有批量创建任务并等待返回的场景；此时使用生产消费者并发的提交任务来代替for循环逐个执行任务能够大大提高代码效率；

然而不加限制的创建Goroutine也是会有内存溢出、CPU切换过多等资源浪费的情况；

本文讲述了Go中一些常用的控制Goroutine数量的方法；

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/goroutine-limit

<br/>

<!--more-->

# **控制Goroutine数量的方法**

## **前言**

Go 语言中创建协程（Goroutine）的成本非常低，因此稍不注意就可能创建出大量的协程，一方面会造成资源的浪费，另一方面不容易控制这些协程的状态；

本文讲述了Go中一些常用的控制Goroutine数量的方法，主要包括：

-   无限Goroutine
-   使用Go原生方式控制Goroutine数量：Channel & WaitGroup
-   使用Semaphore控制Goroutine数量；
-   开源协程池：
    -   Ants: https://github.com/panjf2000/ants
    -   Go-Playground: https://github.com/go-playground/pool
    -   Tunny: https://github.com/Jeffail/tunny

<br/>

## **任务抽象**

在进行实验之前，简单说一下我们要进行的任务：

我们的任务就是将一个字符串数组中的所有字符串都加上一个`prefix`，并生成新的数组；

任务的代码示例如下：

```go
func job(str string, jobIdx int, res *[]string) {
   fmt.Printf("str: %s, jobIdx: %d\n", str, jobIdx)
   (*res)[jobIdx] = prefix + str
}
```

很容易想到我们可以采用for循环的方式：

```go
arr := generateJobArr(jobNum)
res := make([]string, len(arr))
for idx, s := range arr {
    job(s, idx, &res)
}
```

>   <font color="#f00">**注意到，这里是将结果数组和对应的idx传入，而非使用`append`向`res`中追加元素，后面会介绍这样做的好处！**</font>

但是这样效率太低，不能有效地利用我们多核心CPU的优势；

因此我们想到了使用并发的方式去提交任务，让我们的程序并发的去执行！

<br/>

## **无限Goroutine？**

既然Go中创建协程的成本那么低，我们能否为每一个任务都创建一个Goroutine去执行呢？

如果任务不多的情况下，我们是可以这么做的！

代码如下：

0-no-limit-demo/no_limit.go

```go
package main

const (
	prefix = `hello: `
)

var (
	jobNum = 100000

	// Fatal Err!
	//jobNum = 1000000000
)

func main() {

	arr := generateJobArr(jobNum)

	wg := sync.WaitGroup{}
	res := make([]string, len(arr))

	for idx, s := range arr {
		wg.Add(1)
		go job(s, idx, &res, &wg)
		fmt.Printf("index: %d, goroutine Num: %d \n", idx, runtime.NumGoroutine())
	}
	wg.Wait()

	for idx, re := range res {
		if re != prefix+arr[idx] {
			panic(fmt.Sprintf("not equal: re: %s, arr[%d]: %s", re, idx, arr[idx]))
		}
	}
}

// 任务内容
func job(str string, jobIdx int, res *[]string, wg *sync.WaitGroup) {
	defer wg.Done()

	fmt.Printf("str: %s, jobIdx: %d\n", str, jobIdx)
	(*res)[jobIdx] = prefix + str

	time.Sleep(time.Second * 5) // 睡眠5s，模拟耗时
}

// 初始化测试数据
func generateJobArr(jobNum int) []string {
	arr := make([]string, 0)
	for i := 1; i < jobNum+1; i++ {
		arr = append(arr, strconv.Itoa(i))
	}
	return arr
}
```

使用WaitGroup来等待所有协程的完成；

这里就可以看到**将结果数组和对应的idx传入，而非使用`append`向`res`中追加元素**的好处：

-   由于Go中的Append函数是非线程安全的，如果我们在多个线程中同时向`res`数组中Append，大概率会导致缺少很多元素；而为了避免这种情况，我们需要使用锁来限制对数组资源的获取，使得效率降低；

有兴趣的可以执行下面的代码试试：

```go
func main() {

	size := 10000

	res := make([]int, 0)
	for i := 0; i < size; i++ {
		jobI := i // Copy Value to avoid copy pointer in goroutine function!
		go func() {
			res = append(res, jobI)
		}()
	}

	fmt.Printf("size equal: %t, size: %d", len(res) == size, len(res))
}
```

<font color="#f00">**注1：我们需要将`i`的值Copy一份到jobI中，否则在`go func`中获取到的是变量`i`的指针，造成大量的数据重复！**</font>

<font color="#f00">**注2：上面的代码极大概率输出`false`，因为大量的Gouroutine使用Append向res数组写入，造成并发竞争问题；**</font>

<font color="#f00">**注3：代码会在任务未完全结束时就退出；**</font>

将代码稍作修改加上锁即可避免：

```go
func main() {

	size := 10000

	res := make([]int, 0)
	wg, lock := sync.WaitGroup{}, sync.Mutex{}
	for i := 0; i < size; i++ {
		jobI := i // Copy Value to avoid copy pointer in goroutine function!
		wg.Add(1)
		go func() {
			defer wg.Done()
			lock.Lock()
			defer lock.Unlock()
			res = append(res, jobI)
		}()
	}
	wg.Wait()

	fmt.Printf("size equal: %t, size: %d", len(res) == size, len(res))
}
```

加入Lock，保证仅有一个协程修改`res`，并且加入WaitGroup保证所有任务执行完毕后才退出；

而使用Index直接修改`res`可以不需要加锁：

```go
func main() {

	size := 10000

	res := make([]int, size)
	wg := sync.WaitGroup{}
	for i := 0; i < size; i++ {
		jobI, jobIdx := i, i // Copy Value to avoid copy pointer in goroutine function!
		wg.Add(1)
		go func() {
			defer wg.Done()
			res[jobIdx] = jobI
		}()
	}
	wg.Wait()

	fmt.Printf("size equal: %t, size: %d", len(res) == size, len(res))
}

```

-   **多个协程追加无法保证任务顺序，而提前开辟的数组能够保证和外面数组的顺序保持一致！**

对于十万个任务来说，我们的程序可以轻松胜任；

而对于十亿个任务，我们的程序可能会开出上百万个协程（这里为了效果更突出，Sleep了5s保留了更多的协程），从而占用大量的内存，并频繁切换上下文，造成严重的资源浪费！

>   有兴趣的可以看我的这篇文章：
>
>   -   [golang并发素数筛-并发真的会快吗？](https://jasonkayzk.github.io/2020/06/25/golang并发素数筛-并发真的会快吗？/)
>
>   无限的Goroutine反而会导致程序执行效率一落千丈！

下面我们来限制一下Goroutine数量！

<br/>

## **使用Go原生方式控制Goroutine数量**

使用Go原生的方式控制Goroutine数量有两种思路：

-   生产消费者模型结合Channel，无锁的实现限制；
-   将协程也看做一种资源，使用信号量（semaphore）实现限制；

下面我们一一来看！

### **使用Channel进行限制**

代码如下：

1-limit-with-channel-and-wg/limit_with_channel_and_wg.go

```go
package main

const (
	prefix = `hello: `
)

var (
	jobNum = 1000000

	poolSize = runtime.NumCPU() << 1
)

type jobReqItem struct {
	Str    string
	JobIdx int
	Res    *[]string
	Wg     *sync.WaitGroup
}

func main() {

	arr := generateJobArr(jobNum)

	wg := sync.WaitGroup{}
	jobChan := make(chan *jobReqItem, poolSize)
   	defer close(jobChan)
	res := make([]string, len(arr))

	// Start Consumer: 生成指定数目的 goroutine，每个 goroutine 消费 jobsChan 中的数据
	for i := 0; i < poolSize; i++ {
		go func() {
			for jobReq := range jobChan {
				job(jobReq)
			}
		}()
	}

	// Start Producer: 把 job 依次推送到 jobsChan 供 goroutine 消费
	for idx, s := range arr {
		wg.Add(1)
		jobChan <- &jobReqItem{Str: s, JobIdx: idx, Res: &res, Wg: &wg}

		// Goroutine Number Check：
		// +1：包括了main函数的Goroutine
		// 两倍poolSize：是最差情况下，所有的Goroutine的锁全部释放的同时，所有新的Goroutine被创建
		fmt.Printf("index: %d, goroutine Num: %d\n", idx, runtime.NumGoroutine())
		if runtime.NumGoroutine() > poolSize+1 {
			panic("超过了指定Goroutine池大小！")
		}
	}
	wg.Wait()

	// Test
	for idx, re := range res {
		if re != prefix+arr[idx] {
			panic(fmt.Sprintf("not equal: re: %s, arr[%d]: %s", re, idx, arr[idx]))
		}
	}
}

// 任务内容
func job(jobReq *jobReqItem) {
	defer jobReq.Wg.Done()

	fmt.Printf("str: %s, jobIdx: %d\n", jobReq.Str, jobReq.JobIdx)
	(*jobReq.Res)[jobReq.JobIdx] = prefix + jobReq.Str
}
```

代码创建了一个Buffer大小为`poolSize=runtime.NumCPU() << 1`、类型为`jobReqItem`的Chanenl，用于生产者向消费者发送任务；

随后，创建`poolSize`个任务消费Goroutine，同时从Channel中获取任务；

>   <font color="#f00">**注：此时生产者还未向Channel中发送消息，因此此时所有的消费Goroutine都处于阻塞状态！**</font>

然后，在for循环中提交任务；

>   <font color="#f00">**For循环中使用`runtime.NumGoroutine()`校验了当前的Goroutine个数是否会超过限定的数量；**</font>
>
>   **`+1`是包括了main函数这个Goroutine；**

最后代码通过`wg.Wait()`等待所有任务完成，并在函数最后关闭Channel；

测试上面的代码，可以发现是可以成功执行，并且可以通过最后的测试，即：所有的元素和原数组都是一一对应的！

>   **上面的代码也是协程池实现的逻辑抽象！**

下面我们来看另一种实现方式，即使用信号量实现；

<br/>

### **使用semaphore进行限制**

使用semaphore进行限制的思想比较好理解，即：将协程也看做是一种资源，进行限制即可！

代码如下：

2-semaphore/semaphore.go

```go
package main

import (
	"context"
	"fmt"
	"golang.org/x/sync/semaphore"
	"runtime"
	"strconv"
	"sync"
)

var (
	jobNum = 1000000

	poolSize = runtime.NumCPU() // 同时运行的goroutine上限
)

func main() {

	arr := generateJobArr(jobNum)

	wg := sync.WaitGroup{}
	sem := semaphore.NewWeighted(int64(poolSize))
	res := make([]string, len(arr))

	for idx, s := range arr {
		err := sem.Acquire(context.Background(), 1)
		if err != nil {
			panic(err)
		}
		wg.Add(1)
		go job(s, idx, &res, &wg, sem)

		// Goroutine Number Check：
		// +1：包括了main函数的Goroutine
		// 两倍poolSize：是最差情况下，所有的Goroutine的锁全部释放的同时，所有新的Goroutine被创建
		fmt.Printf("index: %d, goroutine Num: %d\n", idx, runtime.NumGoroutine())
		if runtime.NumGoroutine() > poolSize<<1+1 {
			panic("超过了指定Goroutine池大小！")
		}
	}
	wg.Wait()

	// Result Test
	for idx, re := range res {
		if re != prefix+arr[idx] {
			panic(fmt.Sprintf("not equal: re: %s, arr[%d]: %s", re, idx, arr[idx]))
		}
	}
}

// 任务内容
func job(str string, jobIdx int, res *[]string, wg *sync.WaitGroup, sem *semaphore.Weighted) {
	defer func() {
		wg.Done()
		sem.Release(1)
	}()

	fmt.Printf("str: %s, jobIdx: %d\n", str, jobIdx)
	(*res)[jobIdx] = prefix + str

	//time.Sleep(time.Millisecond * 500) // 睡眠500ms，模拟耗时
}
```

>   代码使用的是这个依赖：golang.org/x/sync/semaphore

上面的代码理解起来非常简单：

使用`semaphore.NewWeighted(int64(poolSize))`创建了`poolSize`大小的信号量；

在For循环中，每次创建任务时首先使用`sem.Acquire(context.Background(), 1)`获取semaphore锁：

-   如果获取到锁，则新开一个协程；
-   否则主代码在此阻塞等待其他任务完成；

如此便实现了限制Goroutine数量；

测试上面的代码，可以发现是可以成功执行，并且可以通过最后的测试；

但是相比于前一种使用Channel的方法，这里需要显式的使用锁，则Channel方法可以实现无锁并发！

<br/>

### **小结**

使用Go原生的方法，我们可以很容易的实现将Goroutine严格且精确的限制在某个数量之下；

例如上面的代码输出的`runtime.NumGoroutine()`永远都不会超过`poolSize+1`；

但是如果我们有很多类似的并发任务，就需要重复的写代码；此时，我们可以使用现成的协程池来解决；

<br/>

## **使用开源的协程池库**

目前使用比较多的第三方的协程池库主要有：

-   [panjf2000/ants](https://github.com/panjf2000/ants)
-   [go-playground/pool](https://github.com/go-playground/pool)
-   [Jeffail/tunny](https://github.com/Jeffail/tunny)

几种协程池的使用方式各有差异，下面一一来看！

### **panjf2000/ants**

ants库提供了执行两种方式：

-   `(p *Pool) Submit(task func())`：直接提交任务；
-   `(p *PoolWithFunc) Invoke(args interface{}) error`：调用缓存的函数执行；

下面一一来看；

#### **① 使用Submit**

代码如下：

3-ants/ants_submit.go

```go
func antsSubmit() {

	arr := generateJobArr(jobNum)

	pool, err := ants.NewPool(poolSize, func(opts *ants.Options) {
		opts.Nonblocking = false
		opts.MaxBlockingTasks = len(arr)
	})
	if err != nil {
		panic(err)
	}
	defer pool.Release()

	wg := sync.WaitGroup{}
	res := make([]string, len(arr))

	for idx, s := range arr {
		jobIdx, jobStr := idx, s // Copy Value to avoid copy pointer in Submit function!
		err := pool.Submit(func() {
			wg.Add(1)
			job(jobStr, jobIdx, &res, &wg)
		})
		if err != nil {
			panic(fmt.Errorf("submit job err: %v", err))
		}
	}
	wg.Wait()
}
```

代码首先使用`ants.NewPool`创建了协程池；

随后使用`pool.Submit`提交任务，并使用WaitGroup等待任务全部完成即可！

就是这么简单，所有的限制都由协程池帮助我们完成了！

#### **② 使用Invoke**

同时，ants也支持直接创建某一类函数的协程池；

代码如下：

3-ants/ants_with_func.go

```go
type jobItem struct {
	Str    string
	JobIdx int
	Res    *[]string
	Wg     *sync.WaitGroup
}

func antsWithFunc() {

	arr := generateJobArr(jobNum)

	funcPool, err := ants.NewPoolWithFunc(poolSize,
		func(i interface{}) {
			item := i.(*jobItem)
			job(item.Str, item.JobIdx, item.Res, item.Wg)
		}, func(opts *ants.Options) {
			opts.Nonblocking = false
			opts.MaxBlockingTasks = len(arr)
		})
	if err != nil {
		panic(err)
	}
	defer funcPool.Release()

	wg := sync.WaitGroup{}
	res := make([]string, len(arr))

	for idx, s := range arr {
		jobIdx, jobStr := idx, s // Copy Value to avoid copy pointer in Submit function!
		wg.Add(1)
		err := funcPool.Invoke(&jobItem{
			Str:    jobStr,
			JobIdx: jobIdx,
			Res:    &res,
			Wg:     &wg,
		})
		if err != nil {
			panic(fmt.Errorf("submit job err: %v", err))
		}
	}
	wg.Wait()
}
```

函数`ants.NewPoolWithFunc`的入参函数声明类型为`func(i interface{})`，因此我们需要将我们的任务包装为`jobItem`类型；

同时，在调用`funcPool.Invoke`时对入参进行包装即可！

从上面两个例子可以看到，我们可以很方便的使用`ants`库实现任务提交；

<br/>

### **go-playground/pool**

go-playground/pool库和ants的使用方法稍有不同，代码如下：

4-go-playground/go-playground.go

```go
package main

var (
	jobNum = 100000

	poolSize = runtime.NumCPU()
)

type jobResult struct {
	JobIdx int
	RetStr string
}

func main() {

	arr := generateJobArr(jobNum)

	p := pool.NewLimited(uint(poolSize))
	defer p.Close()

	res := make([]string, len(arr))

	batch := p.Batch()
	go func() {
		for idx, s := range arr {
			jobIdx, jobStr := idx, s // Copy Value to avoid copy pointer in Submit function!
			batch.Queue(func(wu pool.WorkUnit) (interface{}, error) {
				if wu.IsCancelled() {
					// return values not used
					return nil, nil
				}
				return job(jobStr, jobIdx)
			})
		}
		// DO NOT FORGET THIS OR GOROUTINES WILL DEADLOCK
		// if calling Cancel() it calls QueueComplete() internally
		batch.QueueComplete()
	}()

	for jobResultWrapper := range batch.Results() {
		if err := jobResultWrapper.Error(); err != nil {
			panic(err)
		}

		jobResVal := jobResultWrapper.Value()
		result := jobResVal.(*jobResult)
		res[result.JobIdx] = result.RetStr
	}
}

// 任务内容
func job(str string, jobIdx int) (*jobResult, error) {

	fmt.Printf("str: %s, JobIdx: %d\n", str, jobIdx)
	retStr := prefix + str

	//time.Sleep(time.Millisecond * 500) // 睡眠500ms，模拟耗时

	// Goroutine Number Check：
	fmt.Printf("index: %d, goroutine Num: %d\n", jobIdx, runtime.NumGoroutine())

	return &jobResult{RetStr: retStr, JobIdx: jobIdx}, nil
}
```

go-playground/pool库比较特殊的地方在于：他允许异步提交任务，并在另一个地方获取并发的结果；

如上面的代码所示：

首先，通过`pool.NewLimited(uint(poolSize))`创建了协程池；

随后通过`batch := p.Batch()`创建了一个批量任务，并异步的创建了一个协程：在for循环中通过`batch.Queue`提交任务，并在任务完成后调用`batch.QueueComplete()`完成任务；

在随后的代码中通过`batch.Results()`获取各个批量任务的结果；

go-playground/pool库使用的逻辑非常清晰，并且提供了任务撤销等一系列逻辑，使用起来非常方便；

<br/>

### **Jeffail/tunny**

Jeffail/tunny库与ants库相似，同样也支持创建函数协程池；

同时Jeffail/tunny库还支持精确创建poolSize大小的协程池；

代码如下：

5-tunny/tunny.go

```go
package main

var (
	jobNum = 100000

	poolSize = runtime.NumCPU()
)

type jobItem struct {
	Str    string
	JobIdx int
}

type jobResult struct {
	JobIdx int
	RetStr string
	Err    error
}

func main() {

	arr := generateJobArr(jobNum)

	pool := tunny.NewFunc(poolSize, func(jobItemEntity interface{}) interface{} {
		item := jobItemEntity.(*jobItem)
		return job(item.Str, item.JobIdx)
	})
	defer pool.Close()

	res := make([]string, len(arr))
	for idx, s := range arr {

		// Funnel this work into our pool. This call is synchronous and will
		// block until the job is completed.
		result := pool.Process(&jobItem{
			Str:    s,
			JobIdx: idx,
		}).(*jobResult)
		if result.Err != nil {
			panic(result.Err)
		}

		res[result.JobIdx] = result.RetStr
	}
}

// 任务内容
func job(str string, jobIdx int) *jobResult {

	fmt.Printf("str: %s, jobIdx: %d\n", str, jobIdx)
	retStr := prefix + str

	// Goroutine Number Check：
	// +1：包括了main函数的Goroutine
	fmt.Printf("index: %d, goroutine Num: %d\n", jobIdx, runtime.NumGoroutine())
	if runtime.NumGoroutine() > poolSize+1 {
		panic("超过了指定Goroutine池大小！")
	}

	return &jobResult{RetStr: retStr, JobIdx: jobIdx, Err: nil}
}
```

首先，使用`tunny.NewFunc`创建了一个`poolSize`大小的出参入参都为`interface{}`的协程池，在函数中提供了任务的实现方法；

随后，调用`pool.Process`函数提交任务；

由于入参和出参都为单个`interface{}`参数，因此需要使用`jobItem`和`jobResult`封装入参类型；

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/goroutine-limit

使用Go手动实现的一个协程池：

-   https://github.com/JasonkayZK/pool

文章参考：

-   [【图示】控制 Goroutine 的并发数量的方式](https://jingwei.link/2019/09/13/conotrol-goroutines-count.html)
-   [go中如何控制goroutine的数量](https://boilingfrog.github.io/2021/04/14/%E6%8E%A7%E5%88%B6goroutine%E7%9A%84%E6%95%B0%E9%87%8F/)

<br/>
