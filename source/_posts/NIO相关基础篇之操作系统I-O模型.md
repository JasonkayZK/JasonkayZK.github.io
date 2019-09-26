---
title: NIO相关基础篇之操作系统I/O模型
toc: true
date: 2019-09-26 10:56:22
categories: IO基础
tags: [NIO, 操作系统, IO模型]
description: 本篇继上篇之后, 继续NIO相关话题内容，主要谈谈一些Linux 网络 I/O模型、零拷贝等一些内容.
---

![Java NIO](https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=1660559555,3010069585&fm=26&gp=0.jpg)

本篇继上篇之后, 继续NIO相关话题内容，主要谈谈一些Linux 网络 I/O模型下与NIO相关的知识, 主要包括:

-   用户空间以及内核空间: 
-   Linux 网络 I/O模型: Blocking I/O, Non-Blocking I/O, I/O Multiplexing, Signal Driven I/O, Asynchronous I/O
-   五种I/O模型对比
-   文件描述符fd以及Linux内核命令: select, poll, epoll等
-   Zero-Copy相关;
-   直接内存
-   Selector空轮询在Netty中的处理: 
-   ......



<!--more-->

## NIO相关基础篇之操作系统I/O模型

### 一. 用户空间以及内核空间概念

我们知道现在操作系统都是采用虚拟存储器，那么对32位操作系统而言，它的寻址空间（虚拟存储空间）为4G（2的32次方）。操心系统的核心是内核，独立于普通的应用程序，可以访问受保护的内存空间，也有访问底层硬件设备的所有权限。<font color="#0000ff">为了保证用户进程不能直接操作内核，保证内核的安全，操心系统将虚拟空间划分为两部分，一部分为内核空间，一部分为用户空间。</font>

针对linux操作系统而言，将最高的1G字节（从虚拟地址0xC0000000到0xFFFFFFFF），供内核使用，称为内核空间，而将较低的3G字节（从虚拟地址0x00000000到0xBFFFFFFF），供各个进程使用，称为用户空间。每个进程可以通过系统调用进入内核，因此，Linux内核由系统内的所有进程共享。于是，从具体进程的角度来看，每个进程可以拥有4G字节的虚拟空间。

空间分配如下图所示：

![kernel_space](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/kernel_space.png)

<br/>

有了用户空间和内核空间，<font color="#ff0000">整个linux内部结构可以分为三部分，从最底层到最上层依次是：硬件-->内核空间-->用户空间。</font>

如下图所示：

![linux_structure](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/linux_structure.png)

<br/>

**需要注意的细节问题，从上图可以看出内核的组成:**

>   1.  <font color="#ff0000">内核空间中存放的是内核代码和数据，而进程的用户空间中存放的是用户程序的代码和数据。不管是内核空间还是用户空间，它们都处于虚拟空间中</font>
>   2.  Linux使用两级保护机制：0级供内核使用，3级供用户程序使用。



<br/>

---------------



### 二. Linux 网络 I/O模型(五种)

我们都知道，为了OS的安全性等的考虑，<font color="#ff0000">进程是无法直接操作I/O设备的，其*必须通过*系统调用请求内核来协助完成I/O动作，而内核会为每个I/O设备维护一个buffer</font>

如下图所示：

![io_buffer](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/io_buffer.png)

<font color="#ff0000">整个请求过程为： 用户进程发起请求，内核接受到请求后，从I/O设备中获取数据到buffer中，再将buffer中的数据copy到用户进程的地址空间，该用户进程获取到数据后再响应客户端</font>

<font color="#ff0000">在整个请求过程中，数据输入至buffer需要时间，而从buffer复制数据至进程也需要时间</font>

因此<font color="#0000ff">根据在这两段时间内等待方式的不同</font>，I/O动作可以分为以下**五种模式**：

-   **阻塞I/O (Blocking I/O)**
-   **非阻塞I/O (Non-Blocking I/O)**
-   **I/O复用（I/O Multiplexing)**
-   **信号驱动的I/O (Signal Driven I/O)**
-   **异步I/O (Asynchrnous I/O)** 

**说明：**如果像了解更多可能需要linux/unix方面的知识了，可自行去学习一些网络编程原理应该有详细说明，**不过对大多数java程序员来说，不需要了解底层细节，知道个概念就行，知道对于系统而言，底层是支持的**。



>   **记住这两点很重要**
>
>   1.  等待数据准备 (Waiting for the data to be ready) 
>2.  将数据从内核拷贝到进程中 (Copying the data from the kernel to the process)

<br/>

#### 1. 阻塞I/O (Blocking I/O)

<font color="#ff0000">在linux中，默认情况下所有的socket都是blocking，</font>一个典型的读操作流程大概是这样：

![blockingIO](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/blockingIO.png)

当用户进程调用了`recvfrom`这个系统调用，内核就开始了IO的第一个阶段：等待数据准备.

对于network io来说，很多时候数据在一开始还没有到达（比如，还没有收到一个完整的UDP包），这个时候内核就要等待足够的数据到来。而在用户进程这边，整个进程会被阻塞。当内核一直等到数据准备好了，它就会将数据从内核中拷贝到用户内存，然后内核返回结果，用户进程才解除block的状态，重新运行起来。 

所以，<font color="#ff0000">blocking IO的特点就是在IO执行的两个阶段都被block了.</font>

<br/>

#### 2. 非阻塞I/O (Non-Blocking I/O)

<font color="#ff0000">linux下，可以通过设置socket使其变为non-blocking.</font>

当对一个non-blocking socket执行读操作时，流程是这个样子：

![nonblockingIO](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/nonblockingIO.png)

<font color="#0000ff">当用户进程调用recvfrom时，系统不会阻塞用户进程，而是立刻返回一个ewouldblock错误，从用户进程角度讲，并不需要等待，而是马上就得到了一个结果.</font>

用户进程判断标志是ewouldblock时，就知道数据还没准备好，于是它就可以去做其他的事了，于是它可以再次发送recvfrom，一旦内核中的数据准备好了。并且又再次收到了用户进程的system call，那么它马上就将数据拷贝到了用户内存，然后返回.

<font color="#ff0000">当一个应用程序在一个循环里对一个非阻塞调用recvfrom，我们称为轮询. 应用程序不断轮询内核，看看是否已经准备好了某些操作. 这通常是*浪费CPU时间*，但这种模式偶尔会遇到.</font>

<br/>

#### 3. I/O复用（I/O Multiplexing)

IO multiplexing这个词可能有点陌生，但是如果我说select，epoll，大概就都能明白了。有些地方也称这种IO方式为`event driven IO`.

<font color="#ff0000">我们都知道，select/epoll的好处就在于单个process就可以同时处理多个网络连接的IO. 它的基本原理就是select/epoll这个function会不断的轮询所负责的所有socket，当某个socket有数据到达了，就通知用户进程。</font>

它的流程如图：

![io_multiplexing](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/io_multiplexing.png)

当用户进程调用了select，那么整个进程会被block，而同时，内核会“监视”所有select负责的socket，当任何一个socket中的数据准备好了，select就会返回。这个时候用户进程再调用read操作，将数据从内核拷贝到用户进程. 

这个图和blocking IO的图其实并没有太大的不同，事实上，还更差一些。因为这里需要使用两个system call (select 和 recvfrom)，而blocking IO只调用了一个system call (recvfrom)。

<font color="#0000ff">但是，用select的优势在于它可以同时处理多个connection. 所以，如果处理的连接数不是很高的话，*使用select/epoll的webserver不一定比使用multi-threading + blocking IO的web server性能更好，可能延迟还更大*.</font>

<font color="#ff0000">select/epoll的优势并不是对于单个连接能处理得更快，而是在于能处理更多的连接.</font>

在IO multiplexing Model中，实际中，对于每一个socket，一般都设置成为non-blocking，但是，如上图所示，整个用户的process其实是一直被block的。只不过process是被select这个函数block，而不是被socket IO给block。

<br/>

#### 4. 文件描述符fd

<font color="#0000ff">Linux的内核将所有外部设备都可以看做一个文件来操作。那么我们对与外部设备的操作都可以看做对文件进行操作。我们对一个文件的读写，都通过调用内核提供的系统调用；内核给我们返回一个file descriptor（fd,文件描述符）.</font>

而对一个socket的读写也会有相应的描述符，称为socketfd(socket描述符）. <font color="#ff0000">描述符就是一个数字，指向内核中一个结构体（文件路径，数据区，等一些属性）。那么我们的应用程序对文件的读写就通过对描述符的读写完成。</font>

<br/>

#### 5. Linux内核中的一些命令

##### select

**基本原理：**select 函数监视的文件描述符分3类，分别是: `writefds、readfds、和exceptfds`.

<font color="#ff0000">调用后select函数会阻塞，直到有描述符就绪（有数据 可读、可写、或者有except），或者超时（timeout指定等待时间，如果立即返回设为null即可），函数返回。当select函数返回后，可以通过遍历fdset，来找到就绪的描述符。</font>

**缺点**: 

-   <font color="#0000ff">select最大的缺陷就是单个进程所打开的FD是有一定限制的.</font>

    <font color="#ff0000">它由FDSETSIZE设置，32位机默认是1024个，64位机默认是2048。一般来说这个数目和系统内存关系很大!</font>

    具体数目可以`cat /proc/sys/fs/file-max`察看;

<br/>

-   <font color="#0000ff">对socket进行扫描时是线性扫描，即采用轮询的方法，效率较低.</font>

    <font color="#ff0000">当套接字比较多的时候，每次select()都要通过遍历FDSETSIZE个Socket来完成调度，不管哪个Socket是活跃的，都遍历一遍。这会浪费很多CPU时间。</font>

    如果能给套接字注册某个回调函数，当他们活跃时，自动完成相关操作，那就避免了轮询，这正是epoll与kqueue做的!

<br/>

-   <font color="#0000ff">需要维护一个用来存放大量fd的数据结构，这样会使得用户空间和内核空间在传递该结构时复制开销大.</font>

<br/>

##### poll

**基本原理：**poll本质上和select没有区别，它将用户传入的数组拷贝到内核空间，然后查询每个fd对应的设备状态，如果设备就绪则在设备等待队列中加入一项并继续遍历，如果遍历完所有fd后没有发现就绪设备，则挂起当前进程，直到设备就绪或者主动超时，被唤醒后它又要再次遍历fd.这个过程经历了多次无谓的遍历.

**与poll的区别在于**:

<font color="#ff0000">它没有最大连接数的限制，原因是它是基于链表来存储的!</font>

但是同样有缺点：

-   大量的fd的数组被整体复制于用户态和内核地址空间之间，而不管这样的复制是不是有意义;
-   poll还有一个特点是“水平触发”，如果报告了fd后，没有被处理，那么下次poll时会再次报告该fd;

**注意：**从上面看，select和poll都需要在返回后，通过遍历文件描述符来获取已经就绪的socket. 事实上，同时连接的大量客户端在一时刻可能只有很少的处于就绪状态，因此随着监视的描述符数量的增长，其效率也会线性下降。

<br/>

##### epoll

epoll是在2.6内核中提出的，是之前的select和poll的增强版本. <font color="#0000ff">相对于select和poll来说，epoll更加灵活，没有描述符限制。epoll使用一个文件描述符管理多个描述符，将用户关系的文件描述符的事件存放到内核的一个事件表中，这样在用户空间和内核空间的copy只需一次。</font>

**基本原理：**epoll支持水平触发和边缘触发，最大的特点在于<font color="#0000ff">边缘触发，它只告诉进程哪些fd刚刚变为就绪态，并且只会通知一次。还有一个特点是，epoll使用“事件”的就绪通知方式，通过epollctl注册fd，一旦该fd就绪，内核就会采用类似callback的回调机制来激活该fd，epollwait便可以收到通知。</font>

**epoll的优点：**

-   没有最大并发连接的限制，能打开的FD的上限远大于1024（1G的内存上能监听约10万个端口）
-   效率提升，不是轮询的方式，不会随着FD数目的增加效率下降。 只有活跃可用的FD才会调用callback函数；即Epoll最大的优点就在于它只管你“活跃”的连接，而跟连接总数无关，因此在实际的网络环境中，Epoll的效率就会远远高于select和poll;
-   内存拷贝，利用mmap()文件映射内存加速与内核空间的消息传递；即epoll使用mmap减少复制开销。

<font color="#ff0000">**JDK1.5_update10版本使用epoll替代了传统的select/poll，极大的提升了NIO通信的性能。**</font>

>   **备注：**JDK NIO的BUG，例如臭名昭著的epoll bug，它会导致Selector空轮询，最终导致CPU 100%。官方声称在JDK1.6版本的update18修复了该问题，但是直到JDK1.7版本该问题仍旧存在，只不过该BUG发生概率降低了一些而已，它并没有被根本解决。后文将介绍空轮询问题.

<br/>

#### 6. 信号驱动的I/O (Signal Driven I/O)

由于signal driven IO在实际中并不常用，所以简单提下。

![signalDriverIO](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/signalDriverIO.png)

很明显可以看出用户进程不是阻塞的!

首先用户进程建立SIGIO信号处理程序，并通过系统调用sigaction执行一个信号处理函数，这时用户进程便可以做其他的事了，一旦数据准备好，系统便为该进程生成一个SIGIO信号，去通知它数据已经准备好了，于是用户进程便调用recvfrom把数据从内核拷贝出来，并返回结果。

<br/>

#### 7. 异步I/O

一般来说，这些函数通过告诉内核启动操作并在整个操作（包括内核的数据到缓冲区的副本）完成时通知我们。这个模型和前面的信号驱动I/O模型的主要区别是，在信号驱动的I/O中，内核告诉我们何时可以启动I/O操作，但是异步I/O时，内核告诉我们何时I/O操作完成。

![AIO](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/AIO.png)

<font color="#0000ff">当用户进程向内核发起某个操作后，会立刻得到返回，并把所有的任务都交给内核去完成（包括将数据从内核拷贝到用户自己的缓冲区），内核完成之后，只需返回一个信号告诉用户进程已经完成就可以了.</font>



<br/>

------------



### 三. 五种I/O模型的对比

![fiveIO_conpare](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/fiveIO_conpare.png)

>   **结果表明：**前四个模型之间的主要区别是第一阶段，四个模型的第二阶段是一样的：过程受阻在调用recvfrom当数据从内核拷贝到用户缓冲区。然而，异步I/O处理两个阶段，与前四个不同。

**从同步、异步，以及阻塞、非阻塞两个维度来划分来看：**

![fiveIO_conpare2](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/fiveIO_conpare2.png)



<br/>

------------



### 四. Zero-Copy(零拷贝)

#### 1. 为什么需要零拷贝

考虑这样一种常用的情形：你需要将静态内容（类似图片、文件）展示给用户。那么这个情形就意味着你需要先将静态内容从磁盘中拷贝出来放到一个内存buf中，然后将这个buf通过socket传输给用户，进而用户或者静态内容的展示。这看起来再正常不过了，但是实际上这是很低效的流程，我们把上面的这种情形抽象成下面的过程：

```java
read(file, tmp_buf, len);
write(socket, tmp_buf, len);
```

首先调用read将静态内容，这里假设为文件A，读取到tmp_buf, 然后调用write将tmp_buf写入到socket中，如图：

![zerocopy_timesequence](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/zerocopy_timesequence.png)

<br/>

在这个过程中文件A的经历了4次copy的过程, 数据拷贝流程如下图：

![normal_nonzerocopy.gif](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/normal_nonzerocopy.gif)

<br/>

1.  首先，调用read时，文件A拷贝到了kernel模式；
2.  之后，CPU控制将kernel模式数据copy到user模式下；
3.  调用write时，先将user模式下的内容copy到kernel模式下的socket的buffer中；
4.  最后将kernel模式下的socket buffer的数据copy到网卡设备中传送；

从上面的过程可以看出，<font color="#0000ff">数据白白从kernel模式到user模式走了一圈，浪费了2次copy(第一次，从kernel模式拷贝到user模式；第二次从user模式再拷贝回kernel模式，即上面4次过程的第2和3步骤。)。而且上面的过程中kernel和user模式的上下文的切换也是4次。</font>

如下图：

![normal_nonzerocopy_timesequence.gif](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/normal_nonzerocopy_timesequence.gif)

幸运的是，你<font color="#ff0000">可以用一种叫做Zero-Copy的技术来去掉这些无谓的copy。应用程序用Zero-Copy来请求kernel直接把disk的data传输给socket，而不是通过应用程序传输。Zero-Copy大大提高了应用程序的性能，并且减少了kernel和user模式上下文的切换。</font>

<br/>

#### 2. 零拷贝详述

Zero-Copy技术省去了将操作系统的read buffer拷贝到程序的buffer，以及从程序buffer拷贝到socket buffer的步骤，直接将read buffer拷贝到socket buffer. Java NIO中的FileChannal.transferTo()方法就是这样的实现，这个实现是依赖于操作系统底层的sendFile()实现的。

```java
public void transferTo(long position, long count, WritableByteChannel target);
```

他底层的调用时系统调用**sendFile()**方法：

```c++
#include <sys/socket.h>
ssize_t sendfile(int out_fd, int in_fd, off_t *offset, size_t count);
```

下图展示了在transferTo()之后的数据流向：

![zerocopy1](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/zerocopy1.png)

下图展示了在使用transferTo()之后的上下文切换：

![zerocopy2](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/zerocopy2.png)

使用了Zero-Copy技术之后，整个过程如下：

1.  transferTo()方法使得文件A的内容直接拷贝到一个read buffer（kernel buffer）中；
2.  然后数据(kernel buffer)拷贝到socket buffer中。
3.  最后将socket buffer中的数据拷贝到网卡设备（protocol engine）中传输；
    这显然是一个伟大的进步：这里把上下文的切换次数从4次减少到2次，同时也把数据copy的次数从4次降低到了3次。

但是这是Zero-Copy么，答案是否定的。

如果底层NIC（网络接口卡）支持gather操作，我们能进一步减少内核中的数据拷贝。在Linux 2.4以及更高版本的内核中，socket缓冲区描述符已被修改用来适应这个需求。这种方式不但减少多次的上下文切换，同时消除了需要CPU参与的重复的数据拷贝。用户这边的使用方式不变，而内部已经有了质的改变!


<br/>

#### 3. 零拷贝进阶

Linux 2.1内核开始引入了sendfile函数（上一节有提到）,用于将文件通过socket传送。

```c++
sendfile(socket, file, len);
```

该函数通过一次系统调用完成了文件的传送，减少了原来read/write方式的模式切换。此外更是减少了数据的copy, sendfile的详细过程如图：

![zerocopy_timesequence2](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/zerocopy_timesequence2.png)

通过sendfile传送文件只需要一次系统调用，当调用sendfile时：

1.  首先（通过DMA）将数据从磁盘读取到kernel buffer中；
2.  然后将kernel buffer拷贝到socket buffer中；
3.  最后将socket buffer中的数据copy到网卡设备（protocol engine）中发送；

这个过程就是第二节（详述）中的那个步骤。

sendfile与read/write模式相比，少了一次copy。但是从上述过程中也可以发现从kernel buffer中将数据copy到socket buffer是没有必要的。

Linux2.4 内核对sendfile做了改进，如图：

![zerocopy_timesequence3](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/zerocopy_timesequence3.png)

改进后的处理过程如下：

1.  将文件拷贝到kernel buffer中；
2.  向socket buffer中追加当前要发生的数据在kernel buffer中的位置和偏移量；
3.  根据socket buffer中的位置和偏移量直接将kernel buffer的数据copy到网卡设备（protocol engine）中；

经过上述过程，数据只经过了2次copy就从磁盘传送出去了。这个才是真正的Zero-Copy(这里的零拷贝是针对kernel来讲的，数据在kernel模式下是Zero-Copy)。

正是Linux2.4的内核做了改进，<font color="#ff0000">Java中的TransferTo()实现了Zero-Copy,</font>如下图：

![zerocopy3](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/zerocopy3.png)

Zero-Copy技术的使用场景有很多，比如Kafka, 又或者是Netty等，可以大大提升程序的性能。使用的一般场景为:

-   文件较大，读写较慢，追求速度
-   JVM内存不足，不能加载太大数据
-   内存带宽不够，即存在其他程序或线程存在大量的IO操作，导致带宽本来就小

以上都建立在不需要进行数据文件操作的情况下，如果既需要这样的速度，也需要进行数据操作怎么办？那么使用NIO的直接内存！

<br/>

-------



### 五. 直接内存

首先，它的作用位置处于传统IO（BIO）与零拷贝之间，为何这么说？

    传统IO，可以把磁盘的文件经过内核空间，读到JVM空间，然后进行各种操作，最后再写到磁盘或是发送到网络，效率较慢但支持数据文件操作。
    零拷贝则是直接在内核空间完成文件读取并转到磁盘（或发送到网络）。由于它没有读取文件数据到JVM这一环，因此程序无法操作该文件数据，尽管效率很高！

而直接内存则介于两者之间，效率一般且可操作文件数据。直接内存（mmap技术）将文件直接映射到内核空间的内存，返回一个操作地址（address），它解决了文件数据需要拷贝到JVM才能进行操作的窘境。而是直接在内核空间直接进行操作，省去了内核空间拷贝到用户空间这一步操作。

NIO的直接内存是由MappedByteBuffer实现的。核心即是map()方法，该方法把文件映射到内存中，获得内存地址addr，然后通过这个addr构造MappedByteBuffer类，以暴露各种文件操作API。

由于MappedByteBuffer申请的是堆外内存，因此不受Minor GC控制，只能在发生Full GC时才能被回收。而DirectByteBuffer改善了这一情况，它是MappedByteBuffer类的子类，同时它实现了DirectBuffer接口，维护一个Cleaner对象来完成内存回收。因此它既可以通过Full GC来回收内存，也可以调用clean()方法来进行回收。

另外，直接内存的大小可通过jvm参数来设置：-XX:MaxDirectMemorySize。

NIO的MappedByteBuffer还有一个兄弟叫做HeapByteBuffer。顾名思义，它用来在堆中申请内存，本质是一个数组。由于它位于堆中，因此可受GC管控，易于回收。


<br/>

--------------------



### 六. Selector空轮询处理

在NIO中通过Selector的轮询当前是否有IO事件，根据JDK NIO api描述，Selector的select方法会一直阻塞，直到IO事件达到或超时，但是在Linux平台上这里有时会出现问题:

<font color="#0000ff">在某些场景下select方法会直接返回，即使没有超时并且也没有IO事件到达，这就是著名的epoll bug.</font>这是一个比较严重的bug，它会导致线程陷入死循环，会让CPU飙到100%，极大地影响系统的可靠性，到目前为止，JDK都没有完全解决这个问题。

但是Netty有效的规避了这个问题，经过实践证明，epoll bug已Netty框架解决，Netty的处理方式是这样的：

<font color="#ff0000">记录select空转的次数，定义一个阀值，这个阀值默认是512，可以在应用层通过设置系统属性io.netty.selectorAutoRebuildThreshold传入，当空转的次数超过了这个阀值，重新构建新Selector，将老Selector上注册的Channel转移到新建的Selector上，关闭老Selector，用新的Selector代替老Selector，详细实现可以查看NioEventLoop中的selector和rebuildSelector方法.</font>



<br/>

----------



### 六. 总结

本篇从Linux的用户空间以及内核空间为起始, 讲述了:

-   用户空间以及内核空间: 
-   Linux 网络 I/O模型: Blocking I/O, Non-Blocking I/O, I/O Multiplexing, Signal Driven I/O, Asynchronous I/O
-   五种I/O模型对比
-   文件描述符fd以及Linux内核命令: select, poll, epoll等
-   Zero-Copy相关;
-   直接内存
-   Selector空轮询在Netty中的处理: 
-   ......



<br/>

------



### 附录

文章参考:

-   [NIO相关基础篇三](https://mp.weixin.qq.com/s/5SKgdkC0kaHN495psLd3Tg?scene=25#wechat_redirect)
-   [什么是Zero-Copy？](https://mp.weixin.qq.com/s?__biz=MzU0MzQ5MDA0Mw==&mid=2247483913&idx=1&sn=2da53737b8e8908cf3efdae9621c9698&chksm=fb0be89dcc7c618b0d5a1ba8ac654295454cfc2fa81fbae5a6de49bf0a91a305ca707e9864fc&scene=21#wechat_redirect)
-   [浅谈NIO与零拷贝](https://blog.csdn.net/localhost01/article/details/83422888)
-   [Selector空轮询处理](https://www.cnblogs.com/devilwind/p/8351732.html)



