---
title: C++主流编译器总结
toc: true
cover: 'https://img.paulzzh.com/touhou/random?44'
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

main.cpp

```c++
#include<iostream>

int main(int arg, char **args) {
    printf("arg number: %d\n", arg);
}
```

编译后执行：

```bash
$ ./main 
arg number: 1
```



如果对于多个文件，则需要首先编译为 `.obj` 文件，随后进行链接；

>   想要理解GCC编译器的完整的编译过程，可以阅读：
>
>   -   [Journey of a C Program to Linux Executable in 4 Stages](https://www.thegeekstuff.com/2011/10/c-program-to-an-executable/)

<br/>

### **GCC编译过程**

<font color="#f00">**GCC/G++ 在执行编译工作的时候，总共需要4步：**</font>

-   <font color="#f00">**预处理，生成 `.i` 的文件（预处理器cpp），此时对应的参数是 `-E`；**</font>
-   <font color="#f00">**将预处理后的文件转换成汇编语言，生成文件`.s`（编译器egcs），对应的参数是 `-S`；**</font>
-   <font color="#f00">**由汇编代码变为目标代码（机器代码）生成 `.o` 的文件（汇编器as），对应的参数是 `-c`；**</font>
-   <font color="#f00">**连接目标代码，分配实际的内存地址并生成可执行程序（链接器ld），无参数；**</font>

即：一个C/C++文件要经过预处理(preprocessing)、编译(compilation)、汇编(assembly)、和连接(linking)才能变成可执行文件；

下面分别来看；

#### **预处理**

只生成预处理代码的命令如下：

```bash
g++ -E main.cpp -o main.i
```

`-E` 的作用是让 GCC 在预处理结束后停止编译；

<font color="#f00">**预处理阶段主要处理 `include和define` 等；**</font>

<font color="#f00">**它把 `#include` 包含进来的 `.h文件` 插入到 `#include` 所在的位置，把源程序中使用到的用 `#define` 定义的宏用实际的字符串代替；**</font>

>   **只是做简单的字符串替换，这么看来这一步还是很简单的；**
>
>   **想必了解了这些，你也知道为什么需要避免同一个头文件 include 两次了吧！**

<br/>

#### **编译阶段**

编译阶段命令如下：

```bash
g++ -S main.i -o main.s
```

`-S` 的作用是编译后结束，编译生成了汇编文件；

<font color="#f00">**在这个阶段中，GCC 首先要检查代码的规范性、是否有语法错误等；**</font>

<font color="#f00">**以确定代码的实际要做的工作，在检查无误后，GCC 把代码翻译成汇编语言；**</font>

<br/>

#### **汇编阶段**

汇编阶段命令如下：

```bash
g++ -c main.s -o main.o
```

<font color="#f00">**汇编阶段把 `.s`文件翻译成二进制机器指令文件`.o`，这个阶段接收 `.c` 、`.i`、`.s` 的文件都没有问题；**</font>

<br/>

#### **链接阶段**

链接阶段命令如下：

```bash
g++ -o main main.s
```

**链接阶段，链接的是函数库；**

在 `main.cpp` 中并没有定义 `printf` 的函数实现，且在预编译中包含进的 `stdio.h` 中也只有该函数的声明；

而系统把这些函数实现都被做到名为`libc.so`的动态库；

**函数库一般分为静态库和动态库两种：**

-   <font color="#f00">**静态库是指编译链接时，把库文件的代码全部加入到可执行文件中，因此生成的文件比较大，但在运行时也就不再需要库文件了；Linux中后缀名为 `.a`；**</font>
-   <font color="#f00">**动态库与之相反，在编译链接时并没有把库文件的代码加入到可执行文件中，而是在程序执行时由运行时链接文件加载库；Linux中后缀名为 `.so`，如前面所述的 `libc.so` 就是动态库；**</font>
-   <font color="#f00">**GCC 在编译时默认使用动态库；**</font>

**静态库节省时间：不需要再进行动态链接，需要调用的代码直接就在代码内部；**

**动态库节省空间：如果一个动态库被两个程序调用，那么这个动态库只需要一份在内存中；**

<br/>

### **GCC优化级别**

GCC 编译器也有自己的一套优化级别，在编译时指定优化级别是由 `-O` 参数指定的；

>   **这个选项控制所有的优化等级；**
>
>   **使用优化选项会使编译过程耗费更多的时间，并且占用更多的内存，尤其是在提高优化等级的时候；**

例如：

```bash
g++ -O3 main.cpp -o main
```

下面来看优化等级：

GCC 中指定优化级别的参数有：

| **优化级别** | **说明**                                                     |
| ------------ | ------------------------------------------------------------ |
| `-O0`        | 关闭所有优化选项，也是CFLAGS 或 CXXFLAGS中没有设置-O等级时的默认等级；<br />这样就不会优化代码； |
| `-O1`        | 最基本的优化等级；编译器会在不花费太多编译时间、同时也会试图生成更快更小的代码；<br />这些优化是非常基础的，但一般这些任务肯定能顺利完成。 |
| `-O2`        | `-O1` 的进阶；这是推荐的优化等级，除非你有特殊的需求；`-O2` 会比 `-O1` 启用多一些标记；<br />设置了`-O2`后，编译器会试图提高代码性能而不会增大体积和大量占用的编译时间； |
| `-O3`        | **最高最危险的优化等级**；用这个选项会延长编译代码的时间，并且在使用 `GCC4.x` 的系统里不应全局启用！<br />自从3.x版本以来GCC的行为已经有了极大地改变：在3.x，`-O3`生成的代码也只是比`-O2`快一点点而已，而`GCC4.x`中还未必更快；<br />用`-O3`来编译所有的软件包将产生更大体积更耗内存的二进制文件，大大增加编译失败的机会或不可预知的程序行为（包括错误），这样做将得不偿失；**在gcc 4.x.中使用-O3是不推荐的；** |
| `-Og`        | 参数 `-Og` 是在 `-O1` 的基础上，去掉了那些影响调试的优化，所以如果最终是为了调试程序，可以使用这个参数；<br />不过光有这个参数也是不行的，这个参数只是告诉编译器，编译后的代码不要影响调试，但调试信息的生成还是靠 `-g` 参数的； |
| `-Os`        | 参数 `-Os` 是在 `-O2` 的基础上，去掉了那些会导致最终可执行程序增大的优化，如果想要更小的可执行程序，可选择这个参数； |
| `-Ofast`     | **参数 `-Ofast` 是在 `-O3` 的基础上，添加了一些非常规优化，这些优化是通过打破一些国际标准（比如一些数学函数的实现标准）来实现的，所以一般不推荐使用该参数；** |

其他一些需要注意的是：

-   **在编译时，如果没有指定上面的任何优化参数，则默认为 `-O0`，即没有优化；**
-   **参数 `-O1`、`-O2`、`-O3` 中，随着数字变大，代码的优化程度也越高，不过这在某种意义上来说，也是以牺牲程序的编译速度、编译内存占用以及可调试性为代价的；**

>   如果想知道上面的优化参数具体做了哪些优化，可以使用 `gcc -Q --help=optimizers` 命令来查询，比如下面是查询 -O3 参数开启了哪些优化：
>
>   ```bash
>   $ g++ -Q --help=optimizers -O3
>     ...
>     -fassociative-math              [disabled]
>     -fassume-phsa                   [enabled]
>     ...
>   ```

>   **相关扩展：是否优化程度越高，生成的代码就越好？**
>
>   答案是：否；
>
>   **要记住一句话：过犹不及；**
>
>   **更高级别的优化是使用了大量的编译器 track 实现的，这些优化可能有些是不符合标准的，从而会造成一些奇奇怪怪的问题；**
>
>   **通常情况下我们使用 `-O2` 级别已经可以了；**

>   GCC优化文档：
>
>   -   https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html#Optimize-Options

<br/>

### **G++常用命令参数**

#### **指定编译输出的名字`-o`**

G++ 编译器最常用的使用格式是：

```bash
g++ main.cpp
```

上面的命令执行完整的编译过程，并且生成一个`a.out`文件；

使用参数`-o`, 可以指定输出的文件名：

```bash
g++ main.cpp -o main
```

上面的命令会产生输出文件`main`；

<br/>

#### **通过`-Wall`参数启用所有警告**

这个参数可以启用所有警告：

main.cpp

```c++
#include<stdio.h>

int main(void) {
   int i;
   printf("\n The Geek Stuff [%d]\n", i);
   return 0;
}
```

上面的代码编译时，会出现 `未初始化的i` 类似的警告；

```bash
$ g++ -Wall main.cpp -o main
main.c: In function ‘main’:
main.c:6:10: warning: ‘i’ is used uninitialized in this function [-Wuninitialized]
```

>   **`-w` 则是不产生任何告警！**

<br/>

#### **使用`-g`参数产生调试信息**

在开发阶段，必要的调试信息是必须的：

```bash
$ g++ -g main.cpp -o main
```

<br/>

#### **使用`-E`参数只产生预处理输出**

`-E` 参数是产生预处理阶段的输出：

```bash
$ g++ -E main.cpp > main.i
```

G++ 命令将结果输出在`stdout`中，所以你可以把它重定向到任意的文件中；

在上面的例子中，重定向到`main.i`文件中；

<br/>

#### **使用`-S`参数只产生汇编代码**

`-S` 参数产生汇编级别的代码；

```bash
g++ -S main.cpp > main.s
```

文件`main.s`包含汇编代码；

<br/>

#### **使用 `-c` 参数只产生编译的代码**

`-C`参数只产生编译的代码(没有链接link)。

```
g++ -c main.cpp
```

上面的代码产生`main.o`，包含机器级别的代码或者编译的代码；

<br/>

#### **使用`-save-temps`参数产生所有的中间步骤的文件**

通过 `-save-temps` 这个参数，所有中间阶段的文件都会存储在当前文件夹中，注意它也会产生可执行文件；

```bash
$ g++ -save-temps main.cpp

$ ls
a.out  main.c  main.i  main.o  main.s
```

从例子中我们可以看到各个中间文件以及可执行文件；

<br/>

#### **使用`-l`参数链接共享库**

`-l`可以用作链接共享库，例如：

```bash
g++ -Wall main.cpp -o main -lCPPfile
```

上面的代码会链接 `libCPPfile.so`，产生可执行文件 `main`；

>   **需要注意的是：**
>
>   <font color="#f00">**链接库文件名称是：去掉 `lib前缀` 和 `.so后缀` 的部分；**</font>
>
>   如：
>
>   -   `libev.so` 就是 `-lev`；
>   -   `libace.so` 就是 `-lace`；

<br/>

#### **使用`-fPIC`产生位置无关的代码**

<font color="#f00">**当产生共享库的时候，应该创建位置无关的代码，这会让共享库使用任意的地址而不是固定的地址，要实现这个功能，需要使用`-fPIC`参数；**</font>

下面的例子产生`libMain.so`动态库：

```bash
$ g++ -c -Wall -Werror -fPIC main.cpp
$ g++ -shared -o libMain.so main.o
```

注意：

-   产生共享库的时候使用了`-fPIC`参数；
-   `-shared`产生共享库；

<br/>

#### **使用`-v`打印所有的执行命令**

参数`-v`提供详细的信息，打印出G++编译一个文件的时候所有的步骤；

例如：

```bash
$ g++ -Wall -v main.cpp -o main

Using built-in specs.
COLLECT_GCC=gcc
COLLECT_LTO_WRAPPER=/usr/lib/gcc/i686-linux-gnu/4.6/lto-wrapper
Target: i686-linux-gnu
Configured with: ../src/configure -v --with-pkgversion='Ubuntu/Linaro 4.6.3-1ubuntu5' --with-bugurl=file:///usr/share/doc/gcc-4.6/README.Bugs --enable-languages=c,c++,fortran,objc,obj-c++ --prefix=/usr --program-suffix=-4.6 --enable-shared --enable-linker-build-id --with-system-zlib --libexecdir=/usr/lib --without-included-gettext --enable-threads=posix --with-gxx-include-dir=/usr/include/c++/4.6 --libdir=/usr/lib --enable-nls --with-sysroot=/ --enable-clocale=gnu --enable-libstdcxx-debug --enable-libstdcxx-time=yes --enable-gnu-unique-object --enable-plugin --enable-objc-gc --enable-targets=all --disable-werror --with-arch-32=i686 --with-tune=generic --enable-checking=release --build=i686-linux-gnu --host=i686-linux-gnu --target=i686-linux-gnu
Thread model: posix
gcc version 4.6.3 (Ubuntu/Linaro 4.6.3-1ubuntu5)
...
...
...
```

这样我们可以看到所有的细节；

<br/>

#### **使用`-funsigned-char`将char解释为符号的char**

通过这个参数， `char` 类型被看作为 `unsigned char` 类型；

例如：

```c++
#include<stdio.h>

int main() {
  char c = -10;
  // Print the string
   printf("\n The Geek Stuff [%d]\n", c);
   return 0;
}
```

上面的代码通过这个参数编译后，输出结果为：

```bash
$ g++ -Wall -funsigned-char main.cpp -o main
$ ./main

 The Geek Stuff [246]
```

可以看到char是无符号的字节；

<br/>

#### **使用`-fsigned-char`将char解释为有符号的char**

和上面的功能相反， 使用这个参数， char类型被看作是有符号的：

```bash
$ g++ -Wall -fsigned-char main.cpp -o main
$ ./main

 The Geek Stuff [-10]
```

结果输出为负数；

<br/>

#### **使用`-D`参数可以使用编译时的宏**

参数`D`可以用作定义编译时的宏，例如：

```c++
#include<stdio.h>

int main(void) {
#ifdef MY_MACRO
  printf("\n Macro defined \n");
#endif
  char c = -10;
  printf("\n The Geek Stuff [%d]\n", c);
  return 0;
}
```

`-D` 可以用作从命令行定义宏`MY_MACRO`：

```bash
$ g++ -Wall -DMY_MACRO main.cpp -o main
$ ./main

 Macro defined 

 The Geek Stuff [-10]
```

可以看到宏被定义了，并打印出了结果；

<br/>

#### **使用`-Werror`将警告升级为错误**

通过这个参数，GCC 会将所有的警告转换成错误，例如：

```c++
#include<stdio.h>

int main() {
  char c;
  printf("\n The Geek Stuff [%d]\n", c);
  return 0;
}
```

上面的代码编译的时候会有一个 `uninitialized` 警告， `-Werror`会把这个警告升级成错误：

```bash
main.cpp: In function ‘int main()’:
main.cpp:5:9: error: ‘c’ is used uninitialized in this function [-Werror=uninitialized]
   printf("\n The Geek Stuff [%d]\n", c);
   ~~~~~~^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
cc1plus: all warnings being treated as errors
```

<br/>

#### **使用`@`参数从文件中读取参数**

GCC 参数可以从文件中读取，通过`@`后跟文件名的方式提供， 多个参数可以使用空格区隔，例如：

文件 `opt_file` 包含编译参数：

```bash
$ cat opt_file 
-Wall -omain
```

使用`@`参数：

```bash
$ g++ main.cpp @opt_file
main.c: In function ‘main’:
main.c:6:11: warning: ‘i’ is used uninitialized in this function [-Wuninitialized]

$ ls main
main
```

输出结果表明参数的确从文件中读取了，并且正确的应用到编译过程中；

<br/>

#### **使用参数`-I`指定头文件的文件夹**

`-I` 参数指定了 Include 头文件的搜索路径；

当有此选项时，优先搜索此路径下的头文件，然后按照 `#include` 后面是 `""` 还是 `<>` 来决定是优先在当前目录搜索还是优先在系统目录搜索；

>   默认头文件的路径为：`当前目录./` 和 `系统目录：/usr/include 和/usr/local/include`；

```bash
$ g++ -I /home/jasonkayzk/include input-file.cpp
```

`-I-` 参数则是取消前一个参数功能，一般用在`-Idir`之后；

<br/>

#### **使用参数`-std`指定支持的c++/c的标准**

```bash
$ g++ -std=c++14 main.cpp
```

标准如 `c++11, c++14, c90, c89`等；

<br/>

#### **使用`-L`指定链接库的搜索路径**

`-L` 参数用来指定链接库文件的搜索路径；

>   **默认链接库的搜索路径为`/lib`和`/usr/lib`；**

<br/>

#### **使用`-static`生成静态链接的文件**

静态编译文件是指，把动态库的函数和其它依赖都编译进最终文件；

例如：

```bash
$ g++ main.cpp -static -o main -lpthread
```

>   此选项将禁止使用动态库；
>
>   所以，编译出来的东西，一般都很大，但是不需要什么动态连接库，就可以运行；

<br/>

#### **使用`-static-libstdc++`静态链接libstdc++**

如果没有使用`-static`，默认使用 `libstdc++` 共享库，而 `-static-libstdc++` 可以指定使用 `libstdc++` 静态库；

<br/>

#### **使用`-M`生成文件关联的信息**

```bash
$ g++ -M main.cpp

main.o: main.cpp /usr/include/stdc-predef.h /usr/include/stdio.h \
 /usr/include/features.h /usr/include/sys/cdefs.h \
 /usr/include/bits/wordsize.h /usr/include/gnu/stubs.h \
 /usr/include/gnu/stubs-64.h \
 /opt/rh/devtoolset-8/root/usr/lib/gcc/x86_64-redhat-linux/8/include/stddef.h \
 /usr/include/bits/types.h /usr/include/bits/typesizes.h \
 /usr/include/libio.h /usr/include/_G_config.h /usr/include/wchar.h \
 /opt/rh/devtoolset-8/root/usr/lib/gcc/x86_64-redhat-linux/8/include/stdarg.h \
 /usr/include/bits/stdio_lim.h /usr/include/bits/sys_errlist.h
```

>   全部参数文档：
>
>   -   https://gcc.gnu.org/onlinedocs/gcc/Option-Summary.html

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

下面是一些 Clang 的优点（相比于GCC）：

-   编译速度更快：在某些平台上，Clang的编译速度要明显快于 GCC；
-   占用内存更小：Clang生成的AST所占用的内存通常是GCC的五分之一左右；
-   **模块化的设计：Clang采用基于库的模块化设计，更易于IDE的集成及其他用途的重用；**
-   **诊断信息可读性强**：在编译过程中，Clang会创建并保留大量详细的元数据 (metadata)，这将更有利于调试和错误报告（**想一想GCC非人类的报错提示？**）；
-   设计更清晰简单，容易理解，易于扩展加强；
-   与代码基础较为古老的GCC相比，学习曲线会显得更为平缓；
-   **Clang 开源协议不是 GPLv3；**
-   **大部分命令都兼容G++**

>   说个题外话，Clang 和 LLVM 的工具模块化的确不错：
>
>   ```bash
>   $ clang-
>   clang-5.0 clang-check clang-cl clang-cpp clang-format clang-import-test clang-offload-bundler clang-rename clang-tblgen
>   
>   $ llvm-
>   llvm-ar          llvm-bcanalyzer  llvm-diff        llvm-dwarfdump   llvm-link        llvm-mcmarkup    llvm-objdump     llvm-readobj     llvm-size        llvm-symbolizer  
>   llvm-as          llvm-cov         llvm-dis         llvm-extract     llvm-mc          llvm-nm          llvm-ranlib      llvm-rtdyld      llvm-stress      llvm-tblgen
>   ```

Clang的一些不足：

-   需要支持更多语言：GCC 除了支持 C/C++/Objective-C，还支持Fortran/Pascal/Java/Ada/Go等其他语言；Clang目前基本上只支持C/C++/Objective-C/Objective-C++这四种语言；
-   需要加强对C++的支持：Clang对C++标准的支持依然落后于 GCC，Clang还需要加强对C++ 提供全方位支持；
-   需要支持更多平台：由于GCC流行的时间比较长，已经被广泛使用，对各种平台的支持也很完备，Clang目前支持的平台有Linux/Windows/Mac OS；

>   **除了Clang ，这里也有一个 Clang++；**
>
>   **这两者的区别和 GCC 和 G++ 的区别类似，一个使用的是C的库，另一个使用的是C++的库；**

<br/>

### **LLVM工具介绍**

#### **opt**

这是一个在IR级别做程序优化的工具，输入和输出都是同一类型的LLVM IR，很好理解，做优化不必要修改文件格式；设计编译器的同学会经常性的调用这个工具来验证自己的优化是否正确；

反过来，优化不一定作用于LLVM IR，比如作用于后端的MI，这时opt是不能使用的；

<br/>

#### **llc**

这是微观意义上的LLVM编译器，不同于GCC的编译器，它的输入是LLVM IR，输出是汇编文件或者是目标文件；

通过 `-filetype=asm` 或者 `-filetype=obj` 来指定输出是汇编文件还是目标文件，若生成是目标文件，llc会调用LLVM中的汇编输出的代码库来工作（注意这个汇编器和gcc的汇编器也不同，它输入的是MI，是一种后端的中间表示）；

除此之外，还可以用`-On`来指定优化级别（llc默认优化级别是`-O2`），或者其他一些参数；

```bash
llc -filetype=asm main.bc -O0 -o main.s
llc -filetype=obj main.bc -O0 -o main.o
```

>   **`.bc`文件换成`.ll`文件也可以**

<br/>

#### **llvm-mc**

这是微观意义上的LLVM汇编器，它输入汇编文件，输出目标文件；

同时，它也可以反汇编，指定特殊参数（--disassemble）就行；可以发现，llc和llvm-mc都会调用到输出目标文件的库，也就是`MCObjectStreamer`；

>   关于这个工具，可以查看这个比较老旧的文档来学习：
>
>   -   [Intro to the LLVM MC Project](https://link.zhihu.com/?target=http%3A//blog.llvm.org/2010/04/intro-to-llvm-mc-project.html)

<br/>

#### **lli**

这个工具是LLVM IR的解释器，也是一个JIT编译器；

LLVM可以把C语言翻译成LLVM IR，然后解释执行，与Java的那一套类似，这也是最初LLVM编写时的实现（一个虚拟机运行IR）；

<br/>

#### **llvm-link**

它是IR级别的链接器，链接的是IR文件；

这里简单说一下LLVM针对多个源文件编译时的两种目标码输出方式：

1.  第一种是LLVM先通过前端把每个源文件单独翻译成IR级别，然后用llvm-link链接成一个IR，然后再经过优化、后端等步骤生成目标文件，使用llvm-link的同时，可以使用链接时优化（不过需要注意，这种方式同样需要最终调用链接器，将这个目标文件链接成可执行文件）；
2.  第二种是LLVM通过前端把每个源文件单独翻译后，再单独经过优化、后端等工作，将每个源文件生成目标文件，之后再调用链接器，将所有目标文件链接成可执行文件；

即如下图所示：

![llvm](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static/images/llvm.png)

<br/>

#### **llvm-as**

这是针对LLVM IR的汇编器，虽然名字里带as，实际上不是gcc那个as，它的功能是将`.ll`文件翻译为`.bc`文件，LLVM项目里，`.ll`称为LLVM汇编码，所以llvm-as也就是IR的汇编器了；

例如：

```bash
$ llvm-as main.ll -o test.bc
```

<br/>

#### **llvm-dis**

`llvm-dis` 命令与 `llvm-as` 刚好相反，IR的反汇编器，用来将`.bc`文件翻译为`.ll`文件；

例如：

```bash
$ llvm-dis test.bc -o test.ll
```

<br/>

#### **Clang**

最后，就是我们的Clang了，它是现在 LLVM 项目中一个很重要的前端工具；

Clang能够调用起来整个编译器的流程，即在编译时它会调用上边其他工具调用的库；

Clang通过指定 `-emit-llvm` 参数，可以配合`-S`或`-c`生成`.ll`或`.bc`文件，这样我们就能把Clang的部分和LLVM的后端分离开来独立运行：

```bash
$ clang -emit-llvm -c main.c -o main.bc
$ clang -emit-llvm -S main.c -o main.ll
```

LLVM还有一些其他工具，就不举例了，可以查看LLVM项目路径下`/src/tools/`中查看。

<br/>

### **Clang基本使用**

#### **前言**

首先要说明的是，由于Clang兼容GCC的大部分参数；

因此，在GCC下面的那一套，在Clang下也可以玩，例如下面的命令：

```bash
# 直接生成可执行文件
$ clang++ main.cpp -o main

# 只生成预处理文件
$ clang++ -E main.cpp -o main.i

# 只生成汇编文件
$ clang++ -S main.cpp -o main.s
```

只是把 `g++` 换成了 `clang++` 仍然是可以玩的；

这里我们探讨的 Clang 的基本使用是使用 Clang 生成 LLVM IR 中间代码，然后使用 LLVM 来编译；

<br/>

#### **使用Clang生成中间代码和可执行文件**

我们可以使用 Clang 命令生成 LLVM IR 中间代码：

```bash
$ clang++ -O2 -emit-llvm main.cpp -S -o main.ll
```

也可以直接生成 LLVM 的中间表示 BitCode 文件：

```bash
$ clang++ -O2 -emit-llvm main.cpp -c -o main.bc

# 查看文件类型
$ file main.bc
main.bc: LLVM bitcode, wrapper
```

>   **和上面命令的不同点在于，这里多了个`-emit-llvm`，表示生成和LLVM相关的代码；**

<font color="#f00">**对于 LLVM 来说，我们是可以直接通过 `lli` 命令进行解释执行的（这一点就完全类似于 Java 的 JIT）！**</font>

例如：

```bash
# 解释执行 BitCode
$ lli main.bc 
hello                                                                                                                      

# 解释执行中间代码
$ lli main.ll
hello
```

<font color="#f00">**可以看出来，LLVM在这一点上非常的强大！**</font>

<br/>

除此之外，我们可以通过 `llc` 命令将中间代码编译为 汇编或者 `.obj` 文件：

```bash
# 编译为汇编
$ llc -filetype=asm main.bc -O0 -o main.s

# 编译为obj文件
$ llc -filetype=obj main.bc -O2 -o main.o
```

或者也可以直接通过 `clang` 命令实现：

```bash
$ clang++ -O2 -c main.bc -o main.bc.o

$ file main.bc.o 
main.bc.o: Mach-O 64-bit object arm64
```

对比两种方式：

```bash
$ md5 main.o main.bc.o 
MD5 (main.o) = bb22786da7050949a4e20bd69fe6b2c3
MD5 (main.bc.o) = bb22786da7050949a4e20bd69fe6b2c3
```

**可以发现：通过 BitCode 获取到的Obj代码和直接编译出来的Obj代码是一模一样的！**

**因此只需要得到 BitCode 文件就可以编译出一样的目标文件！**

>   **LLVM 中的 BitCode 的本质是什么？**
>
>   通过LLVM官方对 BitCode 的描述，可以知道 BitCode 是一种以位为单位存取的二进制文件，它可以存在于包装结构中，如上一节中看到`LLVM bitcode, wrapper x86_64`，也可以存在于`Object`文件中，例如`Mach-O`文件等；
>
>   **对于`Mach-O`文件并且必定存在于名为`__LLVM`或者`__bitcode`的section中，因此我们可以根据这两个字段来判断生成的Mach-O文件是否包含BitCode；**
>
>   更多关于 BitCode：
>
>   -   https://joey520.github.io/2019/11/21/%E6%B7%B1%E5%85%A5%E7%90%86%E8%A7%A3Bitcode/

最后，我们可以编译并生成二进制可执行文件：

```bash
$ clang++ -O2 main.o -o main

$ ./main
hello
```

<br/>

### **Clang工具链编译完整步骤**

上面展示了 Clang+LLVM 的基本用法，下面总结一下整个Clang工具链涉及到的整个编译过程：

首先，通过 `-E` 查看 Clang 在预处理步骤做了什么：

```bash
$ clang++ -E main.cpp
```

>   **这个过程的处理包括宏的替换，头文件的导入，以及类似 `#if` 的处理；**

在预处理完成后就会进行词法分析，这里会把代码切成一个个 Token，比如：大小括号，等于号还有字符串等：

```bash
$ clang++ -fmodules -fsyntax-only -Xclang -dump-tokens main.cpp
```

然后是语法分析，验证语法是否正确，然后将所有节点组成抽象语法树 AST：

```bash
$ clang++ -fmodules -fsyntax-only -Xclang -ast-dump main.cpp
```

完成这些步骤后，就可以开始 IR 中间代码的生成了！

CodeGen 会负责将语法树自顶向下遍历逐步翻译成 LLVM IR，IR 是编译过程的前端的输出后端的输入：

```bash
$ clang++ -S -emit-llvm main.cpp -o main.ll
```

<font color="#f00">**这里 LLVM 会去做些优化工作，在编译设置里也可以设置优化级别 `-01`，`-03`，`-0s`，还可以写些自己的 Pass！**</font>

```bash
$ clang++ -O3 -S -emit-llvm main.cpp -o main.ll
```

接下来，生成汇编：

```bash
$ clang++ -S main.cpp -o main.s
```

随后，生成目标文件：

```bash
$ clang++ -fmodules -c main.cpp -o main.o
```

最后，生成可执行文件：

```bash
$ clang++ main.o -o main
```

执行：

```bash
$ ./main
hello
```

<br/>

### **Clang常用命令**

#### **基本命令**

经过上面的一些例子，我们可以看到 Clang + LLVM 的基本用法，这里总结如下：

```bash
# 直接生成可执行文件
$ clang++ main.cpp -o main

# 只生成预处理文件
$ clang++ -E main.cpp -o main.i

# 只生成汇编文件
$ clang++ -S main.cpp -o main.s

# 生成LLVM IR中间代码 .ll 文件(可视化字节码文件)
$ clang++ -O2 -emit-llvm main.cpp -S -o main.ll

# 生成 LLVM 的中间表示 BitCode 文件
$ clang++ -O2 -emit-llvm main.cpp -c -o main.bc

# 解释执行 BitCode 文件
$ lli main.bc 

# 解释执行中间代码
$ lli main.ll

# 将 .ll 文件转化为 .bc 文件（汇编）
$ llvm-as main.ll -o main.bc

# 将 .bc 文件转化为 .ll 文件（反汇编）
$ llvm-dis main.bc -o main.ll

# 将LLVM字节码编译为汇编
$ llc -filetype=asm main.bc -O2 -o main.s

# 将LLVM字节码编译为obj文件
$ llc -filetype=obj main.bc -O2 -o main.o

# 使用Clang++ 将.bc或.ll文件转化为obj代码
$ clang++ -O2 -c main.bc -o main.o

# 将目标文件编译为二进制文件
$ clang++ -O2 main.o -o main
```

<br/>

#### **其他常用命令**

除了上面非常常用的命令之外，Clang 还包括了一些其他命令；

查看编译源文件需要的几个不同的阶段：

```bash
$ clang++ -ccc-print-phases main.cpp
+- 0: input, "main.cpp", c++
+- 1: preprocessor, {0}, c++-cpp-output
+- 2: compiler, {1}, ir
+- 3: backend, {2}, assembler
+- 4: assembler, {3}, object
+- 5: linker, {4}, image
6: bind-arch, "arm64", {5}, image
```

查看操作内部命令：

```bash
$ clang -### main.cpp -o main 
Apple clang version 13.1.6 (clang-1316.0.21.2.3)
Target: arm64-apple-darwin21.4.0
Thread model: posix
InstalledDir: /Library/Developer/CommandLineTools/usr/bin
 "/Library/Developer/CommandLineTools/usr/bin/clang" "-cc1" "-triple" "arm64-apple-macosx12.0.0" "-Wundef-prefix=TARGET_OS_" "-Wdeprecated-objc-isa-usage" "-Werror=deprecated-objc-isa-usage" "-Werror=implicit-function-declaration" "-emit-obj" "-mrelax-all" "--mrelax-relocations" "-disable-free" "-disable-llvm-verifier" "-discard-value-names" "-main-file-name" "main.cpp" "-mrelocation-model" "pic" "-pic-level" "2" "-mframe-pointer=non-leaf" "-fno-strict-return" "-fno-rounding-math" "-munwind-tables" "-target-sdk-version=12.3" "-fvisibility-inlines-hidden-static-local-var" "-target-cpu" "apple-m1" "-target-feature" "+v8.5a" "-target-feature" "+fp-armv8" "-target-feature" "+neon" "-target-feature" "+crc" "-target-feature" "+crypto" "-target-feature" "+dotprod" "-target-feature" "+fp16fml" "-target-feature" "+ras" "-target-feature" "+lse" "-target-feature" "+rdm" "-target-feature" "+rcpc" "-target-feature" "+zcm" "-target-feature" "+zcz" "-target-feature" "+fullfp16" "-target-feature" "+sm4" "-target-feature" "+sha3" "-target-feature" "+sha2" "-target-feature" "+aes" "-target-abi" "darwinpcs" "-fallow-half-arguments-and-returns" "-debugger-tuning=lldb" "-target-linker-version" "762" "-resource-dir" "/Library/Developer/CommandLineTools/usr/lib/clang/13.1.6" "-isysroot" "/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk" "-I/usr/local/include" "-stdlib=libc++" "-internal-isystem" "/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/usr/include/c++/v1" "-internal-isystem" "/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/usr/local/include" "-internal-isystem" "/Library/Developer/CommandLineTools/usr/lib/clang/13.1.6/include" "-internal-externc-isystem" "/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/usr/include" "-internal-externc-isystem" "/Library/Developer/CommandLineTools/usr/include" "-Wno-reorder-init-list" "-Wno-implicit-int-float-conversion" "-Wno-c99-designator" "-Wno-final-dtor-non-final-class" "-Wno-extra-semi-stmt" "-Wno-misleading-indentation" "-Wno-quoted-include-in-framework-header" "-Wno-implicit-fallthrough" "-Wno-enum-enum-conversion" "-Wno-enum-float-conversion" "-Wno-elaborated-enum-base" "-Wno-reserved-identifier" "-Wno-gnu-folding-constant" "-Wno-objc-load-method" "-fdeprecated-macro" "-fdebug-compilation-dir=/Users/kylinkzhang/self-workspace/test" "-ferror-limit" "19" "-stack-protector" "1" "-fstack-check" "-mdarwin-stkchk-strong-link" "-fblocks" "-fencode-extended-block-signature" "-fregister-global-dtors-with-atexit" "-fgnuc-version=4.2.1" "-fno-cxx-modules" "-fcxx-exceptions" "-fexceptions" "-fmax-type-align=16" "-fcommon" "-fcolor-diagnostics" "-clang-vendor-feature=+messageToSelfInClassMethodIdReturnType" "-clang-vendor-feature=+disableInferNewAvailabilityFromInit" "-clang-vendor-feature=+disableNonDependentMemberExprInCurrentInstantiation" "-fno-odr-hash-protocols" "-clang-vendor-feature=+enableAggressiveVLAFolding" "-clang-vendor-feature=+revert09abecef7bbf" "-clang-vendor-feature=+thisNoAlignAttr" "-clang-vendor-feature=+thisNoNullAttr" "-mllvm" "-disable-aligned-alloc-awareness=1" "-D__GCC_HAVE_DWARF2_CFI_ASM=1" "-o" "/var/folders/4y/s025lnc52lv68jjnzmt1pwgc0000gn/T/main-ee04e5.o" "-x" "c++" "main.cpp"
 "/Library/Developer/CommandLineTools/usr/bin/ld" "-demangle" "-lto_library" "/Library/Developer/CommandLineTools/usr/lib/libLTO.dylib" "-no_deduplicate" "-dynamic" "-arch" "arm64" "-platform_version" "macos" "12.0.0" "12.3" "-syslibroot" "/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk" "-o" "main" "-L/usr/local/lib" "/var/folders/4y/s025lnc52lv68jjnzmt1pwgc0000gn/T/main-ee04e5.o" "-lSystem" "/Library/Developer/CommandLineTools/usr/lib/clang/13.1.6/lib/darwin/libclang_rt.osx.a"
```

更多内容见官方文档：

-   https://clang.llvm.org/

<br/>

## **尾声**

本文走马观花的介绍了目前主流的一些编译器，以及其基本用法；

希望对大家学习C++有所帮助！

<br/>

# **附录**

文章参考：

-   https://www.zhihu.com/question/445921363
-   https://www.zhihu.com/question/20940822
-   https://zhuanlan.zhihu.com/p/196785332
-   https://www.cnblogs.com/kid-kid/p/12616788.html
-   https://www.cnblogs.com/webor2006/p/9946061.html
-   https://www.zhihu.com/question/20235742
-   https://llvm.liuxfe.com/post/2190
-   https://joey520.github.io/2019/11/21/%E6%B7%B1%E5%85%A5%E7%90%86%E8%A7%A3Bitcode/
-   https://www.jianshu.com/p/42cb026ce541
-   https://www.jianshu.com/p/e4cbcd764783
-   https://yupeng.fun/2020/01/11/clang-llvm/

<br/>
