---
title: 【翻译】Go内存模型
toc: true
cover: 'https://img.paulzzh.com/touhou/random?99'
date: 2022-10-26 09:04:49
categories: Golang
tags: [Golang]
description: MIT的Lecture5要求先阅读Go内存模型，这篇文章写的挺好的，所以打算翻译一下；
---

MIT的Lecture5要求先阅读Go内存模型，这篇文章写的挺好的，所以打算翻译一下；

原文地址：

-   https://go.dev/ref/mem

源代码：

-   https://github.com/JasonkayZK/go-learn/tree/go-memory-model

<br/>

<!--more-->

# **【翻译】Go内存模型**

## **前言**

**本文是基于 `Version of June 6, 2022` 翻译；**

之前在网上找了不少关于 `The Go Memory Model` 的翻译，大多数都是比较老的版本；

而新版本加了不少的内容，所以想要再翻译一下；

**本文结合了我个人的一些理解，如果有翻译不对的地方，也希望大家能够在下方评论区指出！**

<br/>

## **介绍(Introduction)**

>   The Go memory model specifies the conditions under which reads of a variable in one goroutine can be guaranteed to observe values produced by writes to the same variable in a different goroutine.

Go内存模型特别指定了一些条件，在这些条件下可以保证在一个 goroutine 中可以观察（读取）到其他 goroutine 中对相同变量的写入的值；

### **建议(Advice)**

>Programs that modify data being simultaneously accessed by multiple goroutines must serialize such access.
>
>To serialize access, protect the data with channel operations or other synchronization primitives such as those in the [`sync`](https://go.dev/pkg/sync/) and [`sync/atomic`](https://go.dev/pkg/sync/atomic/) packages.
>
>If you must read the rest of this document to understand the behavior of your program, you are being too clever.
>
>Don't be clever.

代码中如果存在多个 Goroutine 同时访问并修改同一个数据的场景，则必须（采用同步的方式）序列化这些操作；

为了序列化访问这些共享的数据，可以采用 Channel 操作或者其他同步原语，比如：[`sync`](https://go.dev/pkg/sync/) 和 [`sync/atomic`](https://go.dev/pkg/sync/atomic/) 包提供的功能；

如果你选择了阅读这篇文档剩下的内容来了解你的代码到底是如何工作的，那你的选择是明智的！

不要自作聪明！

>   **总结：你觉得你自己懂了，我觉得你没懂；233**

### **正式开始前的碎碎念(Informal Overview)**

>   Go approaches its memory model in much the same way as the rest of the language, aiming to keep the semantics simple, understandable, and useful. This section gives a general overview of the approach and should suffice for most programmers. The memory model is specified more formally in the next section.

Go 在实现他自己的内存模型时，和其他大多数的编程语言十分类似，目的是为了保证语义的简单、好理解并且好用；这一小节给出了一个 Go 内存模型实现的总体概述，但是足以满足大多数开发者的知识需要了；在下一小节中会更加深入的探讨内存模型；

>   A *data race* is defined as a write to a memory location happening concurrently with another read or write to that same location, unless all the accesses involved are atomic data accesses as provided by the `sync/atomic` package. As noted already, programmers are strongly encouraged to use appropriate synchronization to avoid data races. In the absence of data races, Go programs behave as if all the goroutines were multiplexed onto a single processor. This property is sometimes referred to as DRF-SC: data-race-free programs execute in a sequentially consistent manner.

>   **`data race`：数据竞争，指的是多个线程并发访问某一共享数据从而可能造成并发问题，下文将使用原单词；**

`data race` 指的是在向内存的某一地址写入数据的同时，存在其他线程并发的在同一内存地址进行读取或写入操作；所有上述涉及到数据访问的操作都是由  `sync/atomic` 包提供的原子操作除外！

正如前文提到的，我们强烈推荐开发者使用合适的同步策略（如，锁、Channel等）来避免 data race；

在没有 data race 的场景下，Go 程序表现的就像是所有的 goroutine 被同一个处理器进行多路调度一样（`all the goroutines were multiplexed onto a single processor`）；

这种特性有时也被称作为 `DRF-SC`：无 data race 的程序以顺序一致的方式执行（data-race-free programs execute in a sequentially consistent manner）；

>   While programmers should write Go programs without data races, there are limitations to what a Go implementation can do in response to a data race. An implementation may always react to a data race by reporting the race and terminating the program. Otherwise, each read of a single-word-sized or sub-word-sized memory location must observe a value actually written to that location (perhaps by a concurrent executing goroutine) and not yet overwritten. These implementation constraints make Go more like Java or JavaScript, in that most races have a limited number of outcomes, and less like C and C++, where the meaning of any program with a race is entirely undefined, and the compiler may do anything at all. Go's approach aims to make errant programs more reliable and easier to debug, while still insisting that races are errors and that tools can diagnose and report them.

虽然开发者应当在没有 data race 的情况下编写 Go 代码，但是 Go 的实现实际上限制了这一点（使得你不得不关注 并解决 data race 问题）；

>   **我猜这里作者的意思是像C++这种语言不会限制你去处理 data race 开发者不需要关心 data race 代码也能跑，但是对不对就是你自己的事情了～**

一个（好的）实现应该总是能察觉并对 data race 做出反应，比如：报错说存在 data race 并且终止程序运行；

否则，每次在内存地址中读取一个字或者一个字节的时候，必须确保（观察到）这个值确实被写入到了内存的这个地方（可能是被多个 goroutine 并发写入），并且这个值还没有被（其他 goroutine）覆盖；

正是这些实现的约束，使得 Go 和 Java 或者 JavaScript 非常类似，即：大多数的 data race 只会造成不是很严重的后果（have a limited number of outcomes）；

而不像 C 和 C++（点名表扬！），data race 会造成未定义的行为，并且编译器（尤其是代码优化阶段）可能会做各种各样离谱的事！

Go 的实现目的是让犯错误的程序也能够尽量可靠，并且容易 debug，并且也坚持： data race 就是错误，应当提供相应的工具来诊断并报告这些错误；

<br/>

## **内存模型(Memory Model)**

>   The following formal definition of Go's memory model closely follows the approach presented by Hans-J. Boehm and Sarita V. Adve in “[Foundations of the C++ Concurrency Memory Model](https://www.hpl.hp.com/techreports/2008/HPL-2008-56.pdf)”, published in PLDI 2008. The definition of data-race-free programs and the guarantee of sequential consistency for race-free programs are equivalent to the ones in that work.

Go 中内存模型的定义与 `Hans-J. Boehm` 和 `Sarita V. Adve` 在2008年发表在 PLDI 上的论文 [Foundations of the C++ Concurrency Memory Model](https://www.hpl.hp.com/techreports/2008/HPL-2008-56.pdf) 内容非常接近；同时，关于禁止 data-race（`data-race-free`）和保证在禁止数据竞争（`race-free`）程序中顺序一致性的描述和论文内容完全一致。

>   The memory model describes the requirements on program executions, which are made up of goroutine executions, which in turn are made up of memory operations.
>
>   A *memory operation* is modeled by four details:
>
>   -   its kind, indicating whether it is an ordinary data read, an ordinary data write, or a *synchronizing operation* such as an atomic data access, a mutex operation, or a channel operation,
>   -   its location in the program,
>   -   the memory location or variable being accessed, and
>   -   the values read or written by the operation.

**内存模型描述了代码执行的基本需求：Go 的执行是由大量 goroutine 执行组成，当然最终这些执行都会转化为内存操作；**

内存操作的建模细节如下（内存模型定义）：

-   **内存操作类型**：表示这个内存操作是：普通读数据、普通写数据、或者是一个同步操作，如：原子数据访问、互斥锁操作、Channel 操作等；
-   操作本身在代码中的位置；
-   需要操作的内存地址、或正在被访问的变量和；
-   对应的正在被操作读取或写入的值；

>   Some memory operations are *read-like*, including read, atomic read, mutex lock, and channel receive. Other memory operations are *write-like*, including write, atomic write, mutex unlock, channel send, and channel close. Some, such as atomic compare-and-swap, are both read-like and write-like.

一些操作是具有 `写特性的`（`read-like`），包括：读、原子读、互斥锁和 Channel 接收消息；

一些操作是 `读特性的`（`write-line`），包括：写、原子写、解互斥锁、Channel 发送消息 和 关闭 Channel；

还有一些特性是同时具有两种属性的，比如：原子的CAS（atomic compare-and-swap）操作；

>   **CAS 操作首先要比较值（Read），然后再交换写入（Write）；**

>   A *goroutine execution* is modeled as a set of memory operations executed by a single goroutine.

**而 Goroutine 的执行会被抽象为由单个 Goroutine 执行的一组内存操作；**

<br/>

>   **Requirement 1**: The memory operations in each goroutine must correspond to a correct sequential execution of that goroutine, given the values read from and written to memory. That execution must be consistent with the *sequenced before* relation, defined as the partial order requirements set out by the [Go language specification](https://go.dev/ref/spec) for Go's control flow constructs as well as the [order of evaluation for expressions](https://go.dev/ref/spec#Order_of_evaluation).
>
>   A Go *program execution* is modeled as a set of goroutine executions, together with a mapping *W* that specifies the write-like operation that each read-like operation reads from. (Multiple executions of the same program can have different program executions.)

**要求1**：给定从内存读取和写入的值，每个goroutine中的内存操作必须对应于该goroutin的正确顺序执行；该执行必须与之前的顺序关系（*sequenced before*）保持一致，这个部分顺序的要求（`the partial order requirements`）在 [Go language specification](https://go.dev/ref/spec)（或者 [order of evaluation for expressions](https://go.dev/ref/spec#Order_of_evaluation)）中被定义为 Go的控制流结构；

Go 程序执行被抽象为一组 goroutine 的执行，以及一个抽象映射 *W*：表示每个读特性的操作都用来读取的写特性的操作；（同一个程序的多次执行可以由不同的程序执行）；

>   **这里说的是由哪个 goroutine 执行是不确定的？**

>   **Requirement 2**: For a given program execution, the mapping *W*, when limited to synchronizing operations, must be explainable by some implicit total order of the synchronizing operations that is consistent with sequencing and the values read and written by those operations.
>
>   The *synchronized before* relation is a partial order on synchronizing memory operations, derived from *W*. If a synchronizing read-like memory operation *r* observes a synchronizing write-like memory operation *w* (that is, if *W*(*r*) = *w*), then *w* is synchronized before *r*. Informally, the synchronized before relation is a subset of the implied total order mentioned in the previous paragraph, limited to the information that *W* directly observes.
>
>   The *happens before* relation is defined as the transitive closure of the union of the sequenced before and synchronized before relations.

**要求2：** 对于一个给定的执行程序，映射 *W* 只是同步操作时，必须以某种隐含的同步操作的一致性顺序来解释和执行，该操作必须（与代码）顺序一致，并且（每一个操作执行后的）值是由这些操作读取和修改的值；

*synchronized before*（操作前同步）关系源自映射 *W*，并且是一个同步内存操作基础上的部分有序操作。

如果一个被同步化的读特性内存操作 *r* 观察到了此时存在一个被同步化了的写特性操作 *w* （即：*W*(*r*) = *w*），此时 *w* 就需要在 *r* 执行前被同步（*w* is synchronized before *r*）；

不严格的讲，刚才提到的 *synchronized before*（操作前同步）操作是前文中提到的全局顺序执行的一个子集，原因主要是受限于映射 *W* 所能直接观察到的信息；

*happens before* 关系是：顺序前序执行和同步前序执行两者的并集（the transitive closure of the union of the sequenced before and synchronized before relations.）；

>   **Requirement 3**: For an ordinary (non-synchronizing) data read *r* on a memory location *x*, *W*(*r*) must be a write *w* that is *visible* to *r*, where visible means that both of the following hold:
>
>   1.  *w* happens before *r*.
>   2.  *w* does not happen before any other write *w'* (to *x*) that happens before *r*.

**要求3：** 对于一个普通（非同步）的在内存地址 *x* 上的读取操作 *r*，W(*r*) 操作也必须要保证，写入操作 *w* 对于读取操作 *r* 是可见的，这里的可见性主要包括两点：

-   写入操作 *w* 操作发生在读取操作 *r* 之前；
-   写入操作 *w* 不会发生在读取操作 *r* 之前的任何其他写入 *w’*（至 *x*）之前；

>   上面这一段不太好理解，总的来说主要就是讲述了 *happen before* 的一些特性，即，两个事件的结果之间的关系：
>
>   **如果一个事件应该在另一个事件之前发生，则结果必须反映这一点，即使这些事件实际上是无序执行的（通常是为了优化程序流程）；**
>
>   主要包括了以下八大原则：
>
>   -   **单线程happen-before原则：在同一个线程中，书写在前面的操作happen-before后面的操作。**
>   -   **锁的happen-before原则：同一个锁的unlock操作happen-before此锁的lock操作。**
>   -   **volatile的happen-before原则：对一个volatile变量的写操作happen-before对此变量的任意操作(当然也包括写操作了)。**
>   -   **happen-before的传递性原则：如果A操作 happen-before B操作，B操作happen-before C操作，那么A操作happen-before C操作。**
>   -   **线程启动的happen-before原则：同一个线程的start方法happen-before此线程的其它方法。**
>   -   **线程中断的happen-before原则：对线程interrupt方法的调用happen-before被中断线程的检测到中断发送的代码。**
>   -   **线程终结的happen-before原则：线程中的所有操作都happen-before线程的终止检测。**
>   -   **对象创建的happen-before原则：一个对象的初始化完成先于他的finalize方法调用。**
>
>   扩展阅读：
>
>   -   https://en.wikipedia.org/wiki/Happened-before
>   -   https://www.jianshu.com/p/1508eedba54d
>   -   https://www.51cto.com/article/712408.html
>   -   https://cloud.tencent.com/developer/article/1734515



>   A *read-write data race* on memory location *x* consists of a read-like memory operation *r* on *x* and a write-like memory operation *w* on *x*, at least one of which is non-synchronizing, which are unordered by happens before (that is, neither *r* happens before *w* nor *w* happens before *r*).
>
>   A *write-write data race* on memory location *x* consists of two write-like memory operations *w* and *w'* on *x*, at least one of which is non-synchronizing, which are unordered by happens before.
>
>   Note that if there are no read-write or write-write data races on memory location *x*, then any read *r* on *x* has only one possible *W*(*r*): the single *w* that immediately precedes it in the happens before order.

一个在内存地址为 *x* 上的 读写data race，主要包括：一个在内存 *x* 处的读特性操作 *r* 和一个在同一地址下的写特性操作 *w*，并且两者至少有一个没有进行同步操作，最终就导致了无序的 *happens before* （即：即不能保证 *r* 在 *w* 之前执行，也不能保证 *w* 在 *r* 之前执行）；

一个在内存地址为 *x* 上的 写写data race，主要包括：两个在内存 *x* 处的写特性操作 *w* 和 *w‘*，并且两者至少有一个没有进行同步操作，最终就导致了无序的 *happens before*；

注意到：如果在内存 *x* 处没有 读写或写写data race，那么此时任何读操作 *r* 都只会有一个唯一确定的 *W*(*r*)：一个紧跟着的 *w* 操作；

>   More generally, it can be shown that any Go program that is data-race-free, meaning it has no program executions with read-write or write-write data races, can only have outcomes explained by some sequentially consistent interleaving of the goroutine executions. (The proof is the same as Section 7 of Boehm and Adve's paper cited above.) This property is called DRF-SC.

更一般的结论：任何一个 data-race-free 的 Go 程序都表示其不存在 read-write 或 write-write data race，并且都可以被唯一的被解释为一些顺序一致的被交织在许多 goroutine 中的执行过程（这一点和前面提到的 Boehm 和 Adve 论文中的第七小节中的证明完全一致！），这个性质就被称为 `DRF-SC`；

>   The intent of the formal definition is to match the DRF-SC guarantee provided to race-free programs by other languages, including C, C++, Java, JavaScript, Rust, and Swift.
>
>   Certain Go language operations such as goroutine creation and memory allocation act as synchronization operations. The effect of these operations on the synchronized-before partial order is documented in the “Synchronization” section below. Individual packages are responsible for providing similar documentation for their own operations.

更加广义化的 DRF-SC 的定义的目的是为其他编程语言提供了 race-free 编程的实现，包括：C, C++, Java, JavaScript, Rust, 和 Swift等；

某些 Go 中的操作例如：创建 goroutine、内存分配等，都表现为同步操作（内部实现）；

这些操作对于“在同步操作前保证局部顺序”（`synchronized-before partial order`）在下面的 `Synchronization` 小节会详细讲述。此外，每个独立的库都有责任为自己提供的操作提供相应的类似的文档。

<br/>

## **含有data-race的代码实现的限制**

>   The preceding section gave a formal definition of data-race-free program execution. This section informally describes the semantics that implementations must provide for programs that do contain races.
>
>   First, any implementation can, upon detecting a data race, report the race and halt execution of the program. Implementations using ThreadSanitizer (accessed with “`go` `build` `-race`”) do exactly this.
>
>   Otherwise, a read *r* of a memory location *x* that is not larger than a machine word must observe some write *w* such that *r* does not happen before *w* and there is no write *w'* such that *w* happens before *w'* and *w'* happens before *r*. That is, each read must observe a value written by a preceding or concurrent write.

前面的内容给出了 data-race-free 程序执行的定义；本节主要是讲述为那些实现必须为包含 data-race 的程序所必须提供的语义；

首先，（Go 提供了相关工具使得）任何代码实现都可以在检测到 data race 之后报告 race 内容，并且停止执行程序；这个特性主要是通过 `ThreadSanitizer` （可以使用 “`go` `build` `-race`”）来实现的；

否则，对于一个在读取内存地址为 *x* 且大小不超过一个机器字长的操作，必须能够观测到在这个读操作之前的一个写操作 *w*，同时在这个 *w* 和 *r* 之间不能插入另外一个写操作 *w‘* 使得 *w* 在 *w‘* 之前执行，而 *w‘* 在 *r* 之前执行！

即：（同步操作应该保证）每个读取操作都应当能够观测到在他之前或者并发执行的写操作的值！

>   这里解释一下：
>
>   **为什么读取操作会看不到在他之前执行的写操作的值：**
>
>   在现代 CPU 架构中，基本上都会存在多级的 CPU Cache 来缓存，这样避免了所有的操作都要去访问内存空间，但是也导致了一个显然的问题：
>
>   <font color="#f00">**由于CPU存在多个核，某个核中的数据可能不会立即刷入到内存中，这就导致了如果其他CPU核心去内存中取值，取到的是旧的值，而非 CPU Cache 中的值！**</font>
>
>   <font color="#f00">**Go 中的同步原语，如：lock、channel、atomic 都保证了 Cache 中的值能够在多个 goroutine 中可见（刷入内存中），这也是上面的内容讲的；**</font>
>
>   <font color="#f00">**对于 Java、C++ 等语言，还提供了类似 `volatile` 的关键字，保证变量直接被刷入内存，以确保对其他线程的可用性；**</font>
>
>   <br/>
>
>   **关于不大于一个字长的定义：**
>
>   对于大于一个字长的结构，通常其空间都是在堆上分配，而在操作时都是通过一个机器字长的指针进行操作；
>
>   所以这里关注的都是不大于一个字长的定义，而通常对于这些数据，拷贝他们的值消耗的性能，和移动他们的值消耗的性能几乎没什么区别，例如：int类型；

>   Additionally, observation of acausal and “out of thin air” writes is disallowed.
>
>   Reads of memory locations larger than a single machine word are encouraged but not required to meet the same semantics as word-sized memory locations, observing a single allowed write *w*. For performance reasons, implementations may instead treat larger operations as a set of individual machine-word-sized operations in an unspecified order. This means that races on multiword data structures can lead to inconsistent values not corresponding to a single write. When the values depend on the consistency of internal (pointer, length) or (pointer, type) pairs, as can be the case for interface values, maps, slices, and strings in most Go implementations, such races can in turn lead to arbitrary memory corruption.
>
>   Examples of incorrect synchronization are given in the “Incorrect synchronization” section below.
>
>   Examples of the limitations on implementations are given in the “Incorrect compilation” section below.

此外，观察到未分配空间的（`acausal`，无配偶的）和未初始化完成的对象（`“out of thin air”`）的写入是不允许的；

我们鼓励读取超过一个机器字长的内存空间的操作，但是他的语义和单机器字长的场景有所不同：观察单个允许写入*w*；

出于性能方面的考虑，在真正实现时，超过一个机器字长的内存空间的操作可能被处理为多个独立的单机器字长的无序操作。这表示多字长的数据上的 data race 可能会导致数据的不一致性，这和（之前）单个的写入操作（的表现）不同；

当某个复杂类型的取值依靠：内部实现（指针，长度）或者数据对（指针，类型）时，例如：map、slice、string 在 Go 中的实现，这样的数据竞争会导致内存中的数据损坏（memory corruption），出现不一致；

下面的“不正确同步”（`“Incorrect synchronization”`）小节给出了错误同步的代码例子；

下面的“错误编译”（`“Incorrect compilation”`）小节给出了data race 实现限制的代码例子；

<br/>

## **同步（Synchronization）**

### **初始化（Initialization）**

>   Program initialization runs in a single goroutine, but that goroutine may create other goroutines, which run concurrently.
>
>   If a package `p` imports package `q`, the completion of `q`'s `init` functions happens before the start of any of `p`'s.
>
>   The completion of all `init` functions is synchronized before the start of the function `main.main`.

Go 程序的初始化都是运行在单一的一个 goroutine 中的，但是这个 goroutine 可以创建大量其他的 goroutine，并且这些 goroutine 是并行运行的！

>   **即，开始的时候，main 函数创建第一个 goroutine，然后这个 goroutine 创造了万物！**

如果包 `p` import 了包 `q`，那么包 `q` 中的 `init` 函数的执行要严格优先于包 `p`！

在 `main` 函数开始之前，所有的 `init` 函数都是同步执行的；

例如下面的代码：

initialization

```go
// p/p.go
package p

import "fmt"

func init() {
	func() {
		fmt.Println("p init in a new goroutine")
	}()
}

func P() {
	fmt.Println("this is p")
}

// q/q.go
package q

import (
	"fmt"
	"initialization/p"
)

func init() {
	func() {
		fmt.Println("q init in a new goroutine")
	}()
}

func RunP() {
	p.P()
}

// main.go
package main

import (
	_ "initialization/q"

	_ "initialization/p"
)

// Will print:
//  p init in a new goroutine
//  q init in a new goroutine
// Even though the q is imported first!
func main() {
}
```

由于包 `q` import 了 包 `p`，因此，在 main 中，即使包 `q` 首先被引入，但是由于上面的限制，会首先执行包 `p` 中的 `init`，然后再执行包 `q` 中的 `init` 函数！因此输出：

```
p init in a new goroutine
q init in a new goroutine
```

但是如果我们将 `q.go` 中的 `p.P()` 注释掉，即：不再 import 包 `p`，则此时根据 main 中 import 的优先级，会输出：

```
q init in a new goroutine
p init in a new goroutine
```

<br/>

### **创建Goroutine（Goroutine creation）**

>   The `go` statement that starts a new goroutine is synchronized before the start of the goroutine's execution.
>
>   For example, in this program:
>
>   calling `hello` will print `"hello, world"` at some point in the future (perhaps after `hello` has returned).

`go` 关键字会开启一个新的 goroutine，并且在这个 goroutine 开始执行之前，这个 goroutine 是同步被创建的！

例如下面的代码：

goroutine-creation/main.go

```go
var a string

func f() {
	fmt.Println(a)
}

func hello() {
	a = "hello, world"
	go f()
}

func main() {

	hello()

	fmt.Println("hello returned")

	<-time.After(1 * time.Second)
}
```

调用 hello 在未来的某个时间总是会保证输出 `"hello, world"`（并且有可能是函数 hello 返回之后输出）；

>   **这里解释一下：**
>
>   **对应于上面讲述的 goroutine 的创建是一个同步的过程，因此保证了在执行 `go f()` 之前，`a = "hello, world"` 一定会被执行，因此变量 a 一定会被正常的初始化，所以可以输出 `"hello, world"`！**

因此，上面的代码最终可能会输出：

```
hello returned
hello, world
```

<br/>

### **销毁Goroutine（Goroutine destruction）**

>   The exit of a goroutine is not guaranteed to be synchronized before any event in the program. For example, in this program:
>
>   the assignment to `a` is not followed by any synchronization event, so it is not guaranteed to be observed by any other goroutine. In fact, an aggressive compiler might delete the entire `go` statement.
>
>   If the effects of a goroutine must be observed by another goroutine, use a synchronization mechanism such as a lock or channel communication to establish a relative ordering.

Goroutine 的退出不能保证操作的同步，例如：

goroutine-destruction/main.go

```go
var a string

func hello() {
	go func() { a = "hello" }()
	fmt.Println(a)
}

func main() {

	hello()

	fmt.Println("hello returned")

	<-time.After(1 * time.Second)
}
```

由于给变量 `a` 赋值时没有使用任何的同步操作，因此不能够保证对变量 `a` 的赋值能够直接被其他的 goroutine 观测到。事实上，一些优化比较激进的编译器会直接把上面的整个 `go` 语句删除；

如果 goroutine 对程序产生的影响必须被其他 goroutine 观测到，那么必须要使用一些同步的机制，比如：锁或者 Channel 来建立强一致的关联顺序；

<br/>

### **Channel通信（Channel communication）**

#### **无缓存Channel**

>   Channel communication is the main method of synchronization between goroutines. Each send on a particular channel is matched to a corresponding receive from that channel, usually in a different goroutine.
>
>   A send on a channel is synchronized before the completion of the corresponding receive from that channel.
>
>   This program:
>
>   is guaranteed to print `"hello, world"`. The write to `a` is sequenced before the send on `c`, which is synchronized before the corresponding receive on `c` completes, which is sequenced before the `print`.
>
>   The closing of a channel is synchronized before a receive that returns a zero value because the channel is closed.
>
>   In the previous example, replacing `c <- 0` with `close(c)` yields a program with the same guaranteed behavior.

Channel 是一个在 goroutine 之间进行同步的主要手段；每个向 channel 发送的消息，都存在一个对应的接收者，并且通常这个接收者在另一个 goroutine 中；

在 Channel 上的发送操作会在被对应的接收者接收之前而被同步；

以下面的代码为例：

channel-communication/demo_1_test.go

```go
var c = make(chan int, 10)
var a string

func f() {
	a = "hello, world"
	c <- 0
	//close(c)
}

func TestDemo1(t *testing.T) {
	go f()
	<-c
	print(a)
}
```

上面的代码保证会打印出 `"hello, world"`；因为对于 `a` 的写入操作会被下一行 `c <- 0` 的发送同步，只有在 channel `c` 中的数据被接收后，才会执行 `print`；

channel 的关闭会在接收操作之前同步的执行，此后由于 channel 已经关闭，接收者会接收到零值！

在上面的例子中，将 `c <- 0` 替换为  `close(c)`，也能得到相同的结果；

<br/>

>   A receive from an unbuffered channel is synchronized before the completion of the corresponding send on that channel.
>
>   This program (as above, but with the send and receive statements swapped and using an unbuffered channel):
>
>   is also guaranteed to print `"hello, world"`. The write to `a` is sequenced before the receive on `c`, which is synchronized before the corresponding send on `c` completes, which is sequenced before the `print`.
>
>   If the channel were buffered (e.g., `c = make(chan int, 1)`) then the program would not be guaranteed to print `"hello, world"`. (It might print the empty string, crash, or do something else.)

（前面看到了）从一个无缓存的 Channel 中读取消息时（该 goroutine）会被强制同步，直到存在消息发送到了对应的 Channel 中；

下面的代码和上面的例子类似，不过将发送和接收消息的位置交换了；

channel-communication/demo_2_test.go

```go
var c2 = make(chan int, 10)
var a2 string

func f2() {
	a2 = "hello, world"
	<-c2
}

func TestDemo2(t *testing.T) {
	go f2()
	c2 <- 0
	print(a2)
}
```

和前面的例子类似，这里的代码也能够保证打印出 `"hello, world"`；对变量 `a2` 的写入会被 `<-c2` 阻塞等待而同步；

但是，如果这是一个有缓存的 Channel（`c = make(chan int, 1)`），则就无法保证输出 `"hello, world"` 了（可能会发生：输出空字符串、程序崩溃等等）；

<br/>

#### **有缓存Channel**

>   The *k*th receive on a channel with capacity *C* is synchronized before the completion of the *k*+*C*th send from that channel completes.
>
>   This rule generalizes the previous rule to buffered channels. It allows a counting semaphore to be modeled by a buffered channel: the number of items in the channel corresponds to the number of active uses, the capacity of the channel corresponds to the maximum number of simultaneous uses, sending an item acquires the semaphore, and receiving an item releases the semaphore. This is a common idiom for limiting concurrency.
>
>   This program starts a goroutine for every entry in the work list, but the goroutines coordinate using the `limit` channel to ensure that at most three are running work functions at a time.

第 k 个在缓存为 C 的 Channel 上被同步，直到第 k+C 个发生到这个 channel 的消息被成功发送；

这个规则是一个推广后的结论；它允许了有限个数的信号量（`semaphore`）被抽象为了一个有缓存的 Channel：Channel 中的消息数量对于目前正在活跃的使用数（线程数），Channel 的缓存大小对应于可以同时并发的数量；当发送消息时获取信号量，当接收消息后释放信号量；这也是限制并发的通常用法；

下面的程序为任务列表中的每一个条目都开启了一个 goroutine，但是由于有缓存 Channel 的限制，保证了一次最多有 3 个 goroutine 在同时执行；

channel-communication/demo_3_test.go

```go
var limit = make(chan int, 3)

func TestDemo3(t *testing.T) {

	work := make([]func(), 0)
	for i := 0; i < 10; i++ {
		aI := i
		work = append(work, func() {
			fmt.Printf("Hello, this is: %d\n", aI)
		})
	}

	for _, w := range work {
		go func(w func()) {
			limit <- 1
			w()
			time.Sleep(time.Second * 1)
			<-limit
		}(w)
	}

	<-time.After(time.Second * 10)
}
```

上面的代码会每次输出3个任务，直到最后结束；

<br/>

### **Locks**

>   The `sync` package implements two lock data types, `sync.Mutex` and `sync.RWMutex`.
>
>   For any `sync.Mutex` or `sync.RWMutex` variable `l` and *n* < *m*, call *n* of `l.Unlock()` is synchronized before call *m* of `l.Lock()` returns.
>
>   This program:
>
>   is guaranteed to print `"hello, world"`. The first call to `l.Unlock()` (in `f`) is synchronized before the second call to `l.Lock()` (in `main`) returns, which is sequenced before the `print`.

`sync` 包提供了两种锁类型：`sync.Mutex` 和 `sync.RWMutex`；

对于 `sync.Mutex` 或 `sync.RWMutex` 类型的变量 `l`，并且 *n* < *m*，n 次调用 `l.Unlock()` 会在 m 次调用 `l.Lock()` 返回之前被同步；

来看下面的例子：

locks/demo1_test.go

```go
var l sync.Mutex
var a string

func f() {
	a = "hello, world"
	l.Unlock()
}

func TestDemo1(t *testing.T) {
	l.Lock()
	go f()
	l.Lock()
	print(a)
}
```

代码保证能够打印出：`"hello, world"`，首次在 `f()` 中调用 `l.Unlock()` 被第二次在 main 函数中调用的 `l.Lock()` 所同步，因此保证了（变量的赋值）顺序一定在 `print` 之前；

>   For any call to `l.RLock` on a `sync.RWMutex` variable `l`, there is an *n* such that the *n*th call to `l.Unlock` is synchronized before the return from `l.RLock`, and the matching call to `l.RUnlock` is synchronized before the return from call *n*+1 to `l.Lock`.
>
>   A successful call to `l.TryLock` (or `l.TryRLock`) is equivalent to a call to `l.Lock` (or `l.RLock`). An unsuccessful call has no synchronizing effect at all. As far as the memory model is concerned, `l.TryLock` (or `l.TryRLock`) may be considered to be able to return false even when the mutex *l* is unlocked.

对于任意调用 `l.RLock` 的 `sync.RWMutex` 类型的变量 `l`，存在一个 *n*，使得第 n 次调用 `l.Unlock` 在 `l.RLock` 返回之前被同步，并且 `l.RUnlock` 在 `l.Lock` 被 n+1 次调用返回之前被同步；

一个成功的调用 `l.TryLock` (或者 `l.TryRLock`) 和调用 `l.Lock` (或者 `l.RLock`) 的结果是一致的；但是，一个不成功的调用，不会产生任何同步的效果；

就内存模型（的定义）来说，即使 Mutex 已经被解锁了，`l.TryLock` (或者 `l.TryRLock`) 也有可能返回 false（即获取锁失败！）；

<br/>

### **Once**

>   The `sync` package provides a safe mechanism for initialization in the presence of multiple goroutines through the use of the `Once` type. Multiple threads can execute `once.Do(f)` for a particular `f`, but only one will run `f()`, and the other calls block until `f()` has returned.
>
>   The completion of a single call of `f()` from `once.Do(f)` is synchronized before the return of any call of `once.Do(f)`.
>
>   In this program:
>
>   calling `twoprint` will call `setup` exactly once. The `setup` function will complete before either call of `print`. The result will be that `"hello, world"` will be printed twice.

`sync` 包提供了一种安全的机制，可以通过使用 `Once` 类型在多个 goroutines 并发执行的的情况下进行初始化；

**多个线程可以对函数 `f` 执行 `once.Do(f)`，但是只有一个线程能够执行 `f()`，而其他线程在调用时会被阻塞，直到（上一个调用） `f()` （的线程）返回；**

来看下面的例子：

once/main.go

```go
var a string
var once sync.Once

func setup() {
	a = "hello, world"
	fmt.Println("a has been setup")
}

func doPrint() {
	once.Do(setup)
	fmt.Println(a)
}

func twoPrint() {
	go doPrint()
	go doPrint()
}

func main() {

	twoPrint()

	<-time.After(1 * time.Second)
}
```

调用 `twoPrint` 后会且仅会调用 `setup` 函数一次；此后任意一个 `doPrint` 的调用，`setup` 函数 都会立即完成！

因此，上面的代码会打印 `"a has been setup"` 一次，`"hello, world"` 两次：

```
a has been setup
hello, world
hello, world
```

<br/>

### **Atomic Values**

>   The APIs in the [`sync/atomic`](https://go.dev/pkg/sync/atomic/) package are collectively “atomic operations” that can be used to synchronize the execution of different goroutines. If the effect of an atomic operation *A* is observed by atomic operation *B*, then *A* is synchronized before *B*. All the atomic operations executed in a program behave as though executed in some sequentially consistent order.
>
>   The preceding definition has the same semantics as C++’s sequentially consistent atomics and Java’s `volatile` variables.

在 [`sync/atomic`](https://go.dev/pkg/sync/atomic/) 包中的 API 提供了 `原子操作` 的集合，可以用于在多个 goroutine 之间同步执行（变量的可观测性）；如果一个原子性操作 `A` 能够被另一个原子性操作 `B` 观测到，则说明操作A在操作B之前进行了同步；一个程序中执行的所有原子操作，都会以某种顺序一致的顺序依次执行；

上面的定义和 C++ 中顺序一致原子定义以及 Java 中 `volatile` 类型的变量的语义是一致的！

来看下面的例子：

atomic/main.go

```go
func main() {

	var ops uint64 = 0

	for i := 0; i < 50; i++ {
		go func() {
			atomic.AddUint64(&ops, 1)
		}()
	}

	time.Sleep(time.Second)

	opsFinal := atomic.LoadUint64(&ops)
	fmt.Println("ops:", opsFinal)
}
```

atomic 原子操作主要用于并发环境下，无须加锁对整数进行安全的加减、比较、读取操作；

因此上面的代码能够准确无误的输出：

```
ops: 50
```

<br/>

### **Finalizers**

>   The [`runtime`](https://go.dev/pkg/runtime/) package provides a `SetFinalizer` function that adds a finalizer to be called when a particular object is no longer reachable by the program. A call to `SetFinalizer(x, f)` is synchronized before the finalization call `f(x)`.

[`runtime`](https://go.dev/pkg/runtime/) 提供了 `SetFinalizer` 函数来为某个特定的对象定义终结器（`finalizer`），当这个对象在程序中不可达之后调用；

同时调用 `SetFinalizer(x, f)` 一定在调用 `f(x)` 之前被同步；

来看例子：

finalizer/main.go

```go
type Foo struct {
	a int
}

func main() {
	for i := 0; i < 3; i++ {
		f := NewFoo(i)
		println(f.a)
	}

	runtime.GC()

	time.Sleep(time.Second)
}

//go:noinline
func NewFoo(i int) *Foo {
	f := &Foo{a: rand.Intn(50)}
	runtime.SetFinalizer(f, func(f *Foo) {
		fmt.Println(`foo ` + strconv.Itoa(i) + ` has been garbage collected`)
	})

	return f
}
```

需要注意的是，Finalizer 无法保证被调用，即：

**在程序无法获取到一个 obj 所指向的对象后的任意时刻，finalizer 被调度运行，且无法保证 finalizer 运行在程序退出之前；**

>   更多内容，见：
>
>   -   https://studygolang.com/articles/23461

<br/>

### **Additional Mechanisms**

>   The `sync` package provides additional synchronization abstractions, including [condition variables](https://go.dev/pkg/sync/#Cond), [lock-free maps](https://go.dev/pkg/sync/#Map), [allocation pools](https://go.dev/pkg/sync/#Pool), and [wait groups](https://go.dev/pkg/sync/#WaitGroup). The documentation for each of these specifies the guarantees it makes concerning synchronization.
>
>   Other packages that provide synchronization abstractions should document the guarantees they make too.

`sync` 包还提供了更多关于同步操作的抽象，包括：[condition variables](https://go.dev/pkg/sync/#Cond), [lock-free maps](https://go.dev/pkg/sync/#Map), [allocation pools](https://go.dev/pkg/sync/#Pool), [wait groups](https://go.dev/pkg/sync/#WaitGroup) 等等；对应的每个文档都详细说明了它在同步方面的作用；

其他提供同步抽象的包也应该为他们在线程同步中的作用提供文档；

<br/>

## **不正确的同步（Incorrect synchronization）**

>   Programs with races are incorrect and can exhibit non-sequentially consistent executions. In particular, note that a read *r* may observe the value written by any write *w* that executes concurrently with *r*. Even if this occurs, it does not imply that reads happening after *r* will observe writes that happened before *w*.
>
>   In this program:
>
>   it can happen that `g` prints `2` and then `0`.
>
>   This fact invalidates a few common idioms.

含有 data race 的程序会导致不正确性，并且他们的执行顺序也表现的非顺序一致；尤其是，在并发读写操作的时候，一个读操作 *r* 可能也可能没有读到另外一个并发的写操作 *w* 写入的值；

即使读操作 *r* 读到了写入的新值，也不能说明写操作 *w* 一定先于读操作 *r* 发生；

来看下面的例子：

incorrect-synchronization/demo1_test.go

```go
var a, b int

func f() {
	a = 1
	b = 2
}

func g() {
	print(b)
	print(a)
}

func TestDemo1(t *testing.T) {
	go f()
	g()
}
```

上面的代码有时可能会输出：`2` 然后输出 `0`！

这个事实可能会颠覆我们的认知；

>   Double-checked locking is an attempt to avoid the overhead of synchronization. For example, the `twoprint` program might be incorrectly written as:
>
>   but there is no guarantee that, in `doprint`, observing the write to `done` implies observing the write to `a`. This version can (incorrectly) print an empty string instead of `"hello, world"`.

双重检查锁是为了避免代码同步开销；

例如，一个不正确的  `twoprint` 的实现：

incorrect-synchronization/demo2_test.go

```go
var a2 string
var done bool
var once sync.Once

func setup() {
	a2 = "hello, world"
	done = true
}

func doprint() {
	if !done {
		once.Do(setup)
	}
	print(a2)
}

func twoprint() {
	go doprint()
	go doprint()
}

func TestDemo2(t *testing.T) {
	twoprint()
}
```

上面的 `doprint` 函数不能保证，在观察到 `done` 的同时，观察到 `a` 的写入；

因此，上面的代码可能会出现输出了空字符串而非  `"hello, world"` 的情况！

>   Another incorrect idiom is busy waiting for a value, as in:
>
>   As before, there is no guarantee that, in `main`, observing the write to `done` implies observing the write to `a`, so this program could print an empty string too. Worse, there is no guarantee that the write to `done` will ever be observed by `main`, since there are no synchronization events between the two threads. The loop in `main` is not guaranteed to finish.

另一个不正确的常见认知是，忙于等待一个值；

例如：

incorrect-synchronization/demo3_test.go

```go
var a3 string
var done3 bool

func setup3() {
	a3 = "hello, world"
	done3 = true
}

func TestDemo3(t *testing.T) {
	go setup3()
	for !done3 {
	}
	print(a3)
}
```

和前面的例子类似，这里的 main 函数也无法保证在观察到 `done` 的同时，观察到 `a` 的写入，因此这段代码也有可能打印出空字符串；

更坏的是，他甚至不能保证对变量 `done` 的写入能够在 main 中观测到，毕竟两个线程之间没有任何的同步机制；

因此有可能在 main 中的 for 循环永远不会停止！

>   There are subtler variants on this theme, such as this program.
>
>   Even if `main` observes `g != nil` and exits its loop, there is no guarantee that it will observe the initialized value for `g.msg`.
>
>   In all these examples, the solution is the same: use explicit synchronization.

这个里还有另外一个比较微妙的变体，来看下面的代码：

incorrect-synchronization/demo4_test.go

```go
type T struct {
	msg string
}

var g4 *T

func setup4() {
	t := new(T)
	t.msg = "hello, world"
	g4 = t
}

func TestDemo4(t *testing.T) {
	go setup4()
	for g4 == nil {
	}
	print(g4.msg)
}
```

即使在 main 函数中观察到了 `g != nil` 并退出了循环，这也不能保证 main 函数能够观测到在 `g` 中被初始化的值  `g.msg`！

>   **这里可以参考前面说到的超过一个机器字长的同步；**

在上面所有的例子中，解决方法都是一样的：显式的使用同步机制；

<br/>

## **编译相关的错误（Incorrect compilation）**

>   The Go memory model restricts compiler optimizations as much as it does Go programs. Some compiler optimizations that would be valid in single-threaded programs are not valid in all Go programs. In particular, a compiler must not introduce writes that do not exist in the original program, it must not allow a single read to observe multiple values, and it must not allow a single write to write multiple values.
>
>   All the following examples assume that `*p` and `*q` refer to memory locations accessible to multiple goroutines.
>
>   Not introducing data races into race-free programs means not moving writes out of conditional statements in which they appear. For example, a compiler must not invert the conditional in this program:
>
>   ```
>   *p = 1
>   if cond {
>   	*p = 2
>   }
>   ```
>
>   That is, the compiler must not rewrite the program into this one:
>
>   ```
>   *p = 2
>   if !cond {
>   	*p = 1
>   }
>   ```
>
>   If `cond` is false and another goroutine is reading `*p`, then in the original program, the other goroutine can only observe any prior value of `*p` and `1`. In the rewritten program, the other goroutine can observe `2`, which was previously impossible.

Go 的内存模型严格限制了它能为 Go 程序所做的优化；有一些能够在单线程下进行的编译优化，在 Go 程序中并非是合法的；尤其是，编译器不能在原程序中引入原本不存在的写操作，也不能允许单个读操作观察到多个不同的值，并且他必须禁止单次写入可写入多个值；

在下面所有的例子中，都假设 ``*p` 和 `*q` 在多个 goroutine 中指向的内存地址；

不导致 data race 表示，不要将写操作从他们之前的条件语句块中移出；

例如，编译器不能够转换下面的代码：

```go
*p = 1
if cond {
	*p = 2
}
```

即，不能重写为下面的代码：

```go
*p = 2
if !cond {
	*p = 1
}
```

如果 `cond` 是 false，并且另一个goroutine正在读取 `*p`；

那么在之前的代码中，另一个 goroutine 只能观察到 `*p` 为 1；而在重写后的代码中，其他goroutin可以观察到 2，这在转换之前不可能的！

>   Not introducing data races also means not assuming that loops terminate. For example, a compiler must in general not move the accesses to `*p` or `*q` ahead of the loop in this program:
>
>   ```
>   n := 0
>   for e := list; e != nil; e = e.next {
>   	n++
>   }
>   i := *p
>   *q = 1
>   ```
>
>   If `list` pointed to a cyclic list, then the original program would never access `*p` or `*q`, but the rewritten program would. (Moving `*p` ahead would be safe if the compiler can prove `*p` will not panic; moving `*q` ahead would also require the compiler proving that no other goroutine can access `*q`.)

不导致 data race 还说明了，不假设循环会终止；

例如，编译器不能将  `*p` or `*q` 提出到循环之前：

```go
n := 0
for e := list; e != nil; e = e.next {
	n++
}
i := *p
*q = 1
```

如果 `list` 是一个循环列表，那么在转换之前的程序是无法访问到  `*p` 和 `*q` 的，但是转换之后的代码就会了！

（能够将 `*p` 安全提前的前提条件是编译器能够保证 `*p` 不会引发 panic；能够将  `*q`  提前的前提条件是编译器能够保证没有其他的 goroutine 会访问  `*q` 的内存地址）；

>   Not introducing data races also means not assuming that called functions always return or are free of synchronization operations. For example, a compiler must not move the accesses to `*p` or `*q` ahead of the function call in this program (at least not without direct knowledge of the precise behavior of `f`):
>
>   ```
>   f()
>   i := *p
>   *q = 1
>   ```
>
>   If the call never returned, then once again the original program would never access `*p` or `*q`, but the rewritten program would. And if the call contained synchronizing operations, then the original program could establish happens before edges preceding the accesses to `*p` and `*q`, but the rewritten program would not.

不导致 data race 还说明了，不能假设所有的函数调用都能正常返回，或者假设（函数内）无同步操作；

例如下面的代码：

```go
f()
i := *p
*q = 1
```

编译器不能将  `*p` or `*q` 移动到函数调用之前（至少在不了解函数 `f` 的行为的时候）；

如果函数调用永远也不返回，那么之前的代码是无法访问  `*p` 或者 `*q` 的，但是重写之后的代码就会访问；

并且，如果函数中存在同步操作，那么之前的代码会在访问 `*p` 或者 `*q` 之前建立 happen-before 隔离，而重写之后的代码就不会；

>   Not allowing a single read to observe multiple values means not reloading local variables from shared memory. For example, a compiler must not discard `i` and reload it a second time from `*p` in this program:
>
>   ```
>   i := *p
>   if i < 0 || i >= len(funcs) {
>   	panic("invalid function index")
>   }
>   ... complex code ...
>   // compiler must NOT reload i = *p here
>   funcs[i]()
>   ```
>
>   If the complex code needs many registers, a compiler for single-threaded programs could discard `i` without saving a copy and then reload `i = *p` just before `funcs[i]()`. A Go compiler must not, because the value of `*p` may have changed. (Instead, the compiler could spill `i` to the stack.)

不允许单个读操作读取到多个值表示：不从共享内存中重新加载局部变量；

例如下面的代码：

```go
i := *p
if i < 0 || i >= len(funcs) {
	panic("invalid function index")
}
... complex code ...
// compiler must NOT reload i = *p here
funcs[i]()
```

编译器不能将原 `i` 值丢弃，并且重新从 `*p` 中读取新的值！

如果一些复杂的代码需要许多寄存器，则有一些编译器在优化单线程的程序时，会在调用  `funcs[i]()` 之前，先丢弃 `i` 并且不保存他的值，而且再次使用  `i = *p` 重新写入新值；

而 Go 编译器不允许这么做，因为 `*p` 的值可能会变（取而代之，编译器会将 `i` 写入到函数栈上）；

>   Not allowing a single write to write multiple values also means not using the memory where a local variable will be written as temporary storage before the write. For example, a compiler must not use `*p` as temporary storage in this program:
>
>   ```
>   *p = i + *p/2
>   ```
>
>   That is, it must not rewrite the program into this one:
>
>   ```
>   *p /= 2
>   *p += i
>   ```
>
>   If `i` and `*p` start equal to 2, the original code does `*p = 3`, so a racing thread can read only 2 or 3 from `*p`. The rewritten code does `*p = 1` and then `*p = 3`, allowing a racing thread to read 1 as well.

不允许单个写操作多次写入也表示：不是使用 local 变量将被写入的内存作为写入前的临时存储；

例如下面的例子：

```go
*p = i + *p/2
```

编译器不能将  `*p`  作为临时计算结果值的存储区域；

也即，编译器不能将代码重写为这样：

```go
*p /= 2
*p += i
```

如果 `i` 和 `*p` 最初都为 2，则最初的代码会将 `*p` 赋值为 3，因此具有 data race 的代码可能会从 `*p` 读取到 2 或者 3；

而重写后的代码可能会从 `*p` 中读取到 1 或者 3！

>   Note that all these optimizations are permitted in C/C++ compilers: a Go compiler sharing a back end with a C/C++ compiler must take care to disable optimizations that are invalid for Go.
>
>   Note that the prohibition on introducing data races does not apply if the compiler can prove that the races do not affect correct execution on the target platform. For example, on essentially all CPUs, it is valid to rewrite
>
>   ```
>   n := 0
>   for i := 0; i < m; i++ {
>   	n += *shared
>   }
>   ```
>
>   into:
>
>   ```
>   n := 0
>   local := *shared
>   for i := 0; i < m; i++ {
>   	n += local
>   }
>   ```
>
>   provided it can be proved that `*shared` will not fault on access, because the potential added read will not affect any existing concurrent reads or writes. On the other hand, the rewrite would not be valid in a source-to-source translator.

需要注意的是，上面提到的所有优化在 C/C++ 的编译器中都是被允许的；因此，一个与 C/C++ 编译器共享后端的 Go编译器的实现必须要注意禁用掉在 Go 中被禁止的优化！

同时要注意，如果编译器能够保证 data race 不会影响到目标平台执行的正确性，则上述禁止引入 data race 的规定就可以不适用；

例如：在基本上所有的CPU上，下面的重写是可以的：

```go
n := 0
for i := 0; i < m; i++ {
	n += *shared
}
```

重写后：

```go
n := 0
local := *shared
for i := 0; i < m; i++ {
	n += local
}
```

前提是可以证明 `*shared` 不会在访问时出错，因为添加读操作不会影响到任何原有的并发读或写；

另一方面，重写在源到源转换器（source-to-source translator）中无效；

<br/>

## **总结**

>   Go programmers writing data-race-free programs can rely on sequentially consistent execution of those programs, just as in essentially all other modern programming languages.
>
>   When it comes to programs with races, both programmers and compilers should remember the advice: don't be clever.

Go 的开发者可以依靠前文中所说的顺序一致执行来编写 data-race-free 的代码，这个其他现代编程语言是一样的；

当遇到了 data race，开发者和编译器都应当听取这个建议：不要自作聪明（`don't be clever.`）

<br/>

# **附录**

原文地址：

-   https://go.dev/ref/mem

源代码：

-   https://github.com/JasonkayZK/go-learn/tree/go-memory-model

<br/>
