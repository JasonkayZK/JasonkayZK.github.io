---
title: C++主流编译器总结
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?44'
date: 2022-05-29 00:23:27
categories: C++
tags: [C++, 编译器]
description: 由于历史原因，C++存在多个厂商的编译器，主流的包括GCC、G++、MSVC、clang等，本文介绍了这几个编译器之间的关系，以及各个编译器常用的命令参数；
---

由于历史原因，C++存在多个厂商的编译器，主流的包括GCC、G++、MSVC、clang等；

本文介绍了这几个编译器之间的关系，以及各个编译器常用的命令参数；

<br/>

<!--more-->

# **C++主流编译器总结**

## **前言**

C++ 作为一门历史包袱极重的 PL，其对应的编译器也是数不胜数，如：Borland C++、TCC、Dev C++等；

甚至历史上一度出现了关于 C++ 编译器圣战；

>   关于这段历史可以参考：
>
>   -   [《Borland传奇》](https://book.douban.com/subject/1106304/)

本文总结了一些主流编译器的用法：

-   MSVC
-   GCC/G++
-   Clang

<br/>

## **MSVC**

### **MSVC简要介绍**

先贴一下关于 MSVC 的优点吧：

-   巨硬家的编译器；
-   C++ 编译器圣战中的胜者（是的 Borland 败了！）；
-   C++ 规范支持最快的编译器，没有之一；
-   唯一一个同时支持增量编译和增量链接的编译器；

>   **是的，你没看错，MSVC 居然是对C++ 规范支持最好的编译器；**
>
>   **隔壁 GCC 和 clang 甚至在 2022 年了，C++20 都没完全支持？！**

再来点缺点：

-   **闭源；**
-   一般大家都是在win平台用（是的，结合宇宙第一IDE VS）；
-   大项目编译速度最快；
-   优化方面没有 GCC 和clang那么激进；

另外，MSVC 支持了许多在 GCC、clang 中不支持的“骚操作”，例如它独特的嵌入汇编的片段…；

<br/>

### **MSVC优化级别**

对于 C++ 的代码，性能优化当然是我们非常关心的一个内容了！

下面的表格列出了 MSVC 编译器提供的一些编译选项：

| 选项                                                         | 目标                                                     |
| :----------------------------------------------------------- | :------------------------------------------------------- |
| [`/favor:`](https://docs.microsoft.com/zh-cn/cpp/build/reference/favor-optimize-for-architecture-specifics?view=msvc-170) | 生成针对一个指定体系结构或一系列体系结构进行优化的代码。 |
| [`/O1`](https://docs.microsoft.com/zh-cn/cpp/build/reference/o1-o2-minimize-size-maximize-speed?view=msvc-170) | 创建小代码。                                             |
| [`/O2`](https://docs.microsoft.com/zh-cn/cpp/build/reference/o1-o2-minimize-size-maximize-speed?view=msvc-170) | 创建快速代码。                                           |
| [`/Ob`](https://docs.microsoft.com/zh-cn/cpp/build/reference/ob-inline-function-expansion?view=msvc-170) | 控制内联展开。                                           |
| [`/Od`](https://docs.microsoft.com/zh-cn/cpp/build/reference/od-disable-debug?view=msvc-170) | 禁用优化。                                               |
| [`/Og`](https://docs.microsoft.com/zh-cn/cpp/build/reference/og-global-optimizations?view=msvc-170) | 已弃用。 使用全局优化。                                  |
| [`/Oi[-\]`](https://docs.microsoft.com/zh-cn/cpp/build/reference/oi-generate-intrinsic-functions?view=msvc-170) | 生成内部函数。                                           |
| [`/Os`](https://docs.microsoft.com/zh-cn/cpp/build/reference/os-ot-favor-small-code-favor-fast-code?view=msvc-170) | 代码大小优先。                                           |
| [`/Ot`](https://docs.microsoft.com/zh-cn/cpp/build/reference/os-ot-favor-small-code-favor-fast-code?view=msvc-170) | 代码速度优先。                                           |
| [`/Ox`](https://docs.microsoft.com/zh-cn/cpp/build/reference/ox-full-optimization?view=msvc-170) | 不包含 /GF 或 /Gy 的 /O2 子集。                          |
| [`/Oy`](https://docs.microsoft.com/zh-cn/cpp/build/reference/oy-frame-pointer-omission?view=msvc-170) | 省略帧指针。 (仅限 x86)                                  |

>   详见：
>
>   -   https://docs.microsoft.com/zh-cn/cpp/build/reference/compiler-options-listed-by-category?view=msvc-170#optimization

<br/>

### **MSVC编译参数**

关于 MSVC 的编译参数，这里不再详细给出了，原因有几点：

-   MS 的中文文档其实已经非常全面了（是的，中文文档！）：
    -   https://docs.microsoft.com/zh-cn/cpp/build/reference/compiling-a-c-cpp-program?view=msvc-170
-   此外，大部分使用 MSVC 的也是使用的微软那一套自己的工具链，这些大部分都已经集成在了IDE里面，毕竟微软还是倾向于做界面的！
-   另外，大部分人还是倾向于使用 Linux/Unix 的，所以这一套工具链大多数还是在 win 平台自己玩；

>   关于编译器参数：
>
>   -   https://docs.microsoft.com/zh-cn/cpp/build/reference/compiler-options-listed-by-category?view=msvc-170

<br/>

## **GCC/G++**

提到 Linux，你一定会想到：GCC、GNU、libc；

是的，这是一个伴随着 Linux 一同产生的超级远古的编译器，并且它遵循 GPL 这个“病毒式”扩散的开源协议；

那 GCC 和 G++ 又是什么关系呢？

<br/>

### **GCC和G++的区别？**

这里首先要说一下，GCC 和 G++ 都是 GCC:GNU Compiler Collection(GUN 编译器集合) 中的套件；

>   GCC 既是项目的名字，也是一个程序（项目产物）的名字，而 G++ 是这个项目的产物（程序）之一；

实际上，无论是 GCC 还是 G++, 他们的定位都仅仅是 Driver，最终他们都是仅仅负责调用真正的编译器，来把源码编译到汇编代码；

比如 C 语言的编译器是 `cc1`，而 C++ 语言的编译器是 `cc1plus`，随后，Driver 再调用 `as`，把汇编代码变成二进制代码；

最后，调用 `ld`把二进制代码拼在一起；

而，GCC 和 G++ 之间的区别无非就是：**调用的编译器不同，并且传递给链接器的参数不同；**

>   具体而言：
>
>   -   **G++** 会把 `.c` 文件当做是 C++ 语言 (在 `.c` 文件前后分别加上 `-xc++` 和 `-xnone`, 强行变成 C++)，从而调用 `cc1plus` 进行编译；
>   -   **G++** 遇到 `.cpp` 文件也会当做是 C++，调用 `cc1plus` 进行编译；
>   -   **G++** 还会默认告诉链接器，让它链接上 C++ 标准库；
>   -   **GCC** 会把 `.c` 文件当做是 C 语言，从而调用 `cc1` 进行编译；
>   -   **GCC** 遇到 `.cpp` 文件，会处理成 C++ 语言，调用 `cc1plus` 进行编译；
>   -   **GCC** 默认不会链接上 C++ 标准库；
>   -   **GCC** 不会定义 **__cplusplus** 宏，而 **G++** 会；
>
>   二者的源码基本是一样的，只相差一个文件：
>
>   -   https://GCC.gnu.org/git/?p=GCC.git;a=summary

<br/>

### **G++基本使用**

基本上学习过 C++ 的同学都知道下面的命令：

```bash
g++ main.cpp -o main
```

对于单个 C++ 文件，上面的命令会直接编译 `main.cpp` 文件，并生成二进制文件 main；

如下面这个文件：

执行文件











<br/>

### **G++优化级别**











<br/>

### **G++常用命令**













<br/>

## **Clang**

大厂 Apple 背书，开源的编译器，最早是为了处理 Apple 自己那一套 （ios sdk，XCode，Objective-C，Swift）；

>   说到 Clang，就不得不提另一个编译器了 LLVM；
>
>   LLVM提供了一套适合编译器系统的[中间语言](https://zh.m.wikipedia.org/wiki/中間語言)（Intermediate Representation，IR），有大量变换和优化都围绕其实现；经过变换和优化后的中间语言，可以转换为目标平台相关的[汇编语言](https://zh.m.wikipedia.org/wiki/汇编语言)代码；
>
>   简而言之，最开始的时候，各个编译器都是自己生成汇编代码，各个编译器有自己对代码优化的骚操作；
>
>   **后来大家发现，其实可以把这些骚操作统一起来搞一个后端编译器，不论什么编程语言，你只要符合我 IR 中间代码的规范，我这个后端编译器都能给你编译成对应平台的、优化极好的汇编，而这个后端编译器就是 LLVM；**
>
>   **甚至 Clang 之前都只是 LLVM 的一个子项目：[Clang](https://clang.llvm.org/)**

















<br/>

# **附录**

文章参考：

-   https://www.zhihu.com/question/445921363
-   https://www.zhihu.com/question/20940822
-   https://www.cnblogs.com/webor2006/p/9946061.html



<br/>
