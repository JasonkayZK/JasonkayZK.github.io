---
title: Linux输出流重定向
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?23'
date: 2021-06-24 14:08:15
categories: Linux
tags: [Linux, 技术杂谈, 重定向]
description: 在shell中可能经常能看到类似的命令：echo log > /dev/null 2>&1，将输出流重定向，本文介绍了这些重定向符号的含义；
---

在shell中可能经常能看到类似的命令：`echo log > /dev/null 2>&1`，将输出流重定向；

本文介绍了这些重定向符号的含义；

<br/>

<!--more-->

## **Linux输出流重定向**

对于一个命令的结果，可以通过`%>`的形式来定义；

下面来看这条命令`echo log > /dev/null 2>&1`：

-   **/dev/null**：代表空设备文件；
-   **>**：代表重定向到哪里，例如：`echo "123" > /home/123.txt`；
-   **1**：表示stdout，标准输出，系统默认值是1，所以`>/dev/null`等同于`1>/dev/null`；
-   **2**：表示stderr，标准错误输出；
-   **&**：表示等同于的意思；
-   **2>&1**：表示2的输出重定向等同于1；

因此，`1 > /dev/null 2>&1`语句的含义就是：

-   `1 > /dev/null`：首先，将标准输出重定向到空设备文件，也就是不输出任何信息到终端；
-   `2>&1` ：接着，标准错误输出重定向（等同于）标准输出，因为之前标准输出已经重定向到了空设备文件，所以标准错误输出也重定向到空设备文件；

所以，命令的标志输出、标准错误输出都不显示！

<br/>

### **cmd >a 2>a 和 cmd >a 2>&1 为什么不同？**

`cmd >a 2>a`：stdout和stderr都直接送往文件 a ，a文件会被打开两遍，由此导致stdout和stderr互相覆盖！

`cmd >a 2>&1` ：stdout直接送往文件a ，stderr是继承了FD1的管道之后，再被送往文件a，因此a文件只被打开一遍，就是FD1将其打开！

**两者的不同点在于：**

`cmd >a 2>a`相当于使用了FD1、FD2两个互相竞争使用文件 a 的管道； 

`cmd >a 2>&1`只使用了一个管道FD1，但已经包括了stdout和stderr；

同时，从IO效率上来讲，`cmd >a 2>&1`的效率更高；

<br/>

### **为何2>&1要写在后面？**

对于命令`command > file 2>&1`：

首先，是`command > file`将标准输出重定向到file中，`2>&1`是标准错误拷贝至标准输出的行为，也就是同样被重定向到file中，最终结果就是标准输出和错误都被重定向到file中；

对于命令`command 2>&1 > file`：表示**`2>&1`标准错误首先拷贝了标准输出的行为，但此时标准输出还是在终端，`>file`后的输出才被重定向到file，因此此时标准错误仍然保持在终端；**

使用strace可以看到：

-    `command > file 2>&1`这个命令中实现重定向的关键系统调用序列是：`open(file) == 3 dup2(3,1) dup2(1,2)`
-   而`command 2>&1 >file`这个命令中实现重定向的关键系统调用序列是：`dup2(1,2) open(file) == 3 dup2(3,1)`

而**不同的dup2()调用序列会产生不同的文件共享结构；**

<br/>

### **典型案例**

在将一些程序后台启动时，我们通常需要将输出写入日志文件，此时就需要用到重定向：

例如：

```bash
python main.py > ./log.txt 2>&1 &
```

这样，命令`python main.py`在后台执行，并同时将标准和错误日志输出至文件：`log.txt`中；

<br/>

## **附录**

文章参考：

-   [Linux Shell 1>/dev/null 2>&1 含义](https://cloud.tencent.com/developer/article/1392461)
-   [1>/dev/null 2>&1的含义](http://dongwei.iteye.com/blog/322702)
-   [/dev/null 2>&1 解释](http://blog.163.com/liang8421@126/blog/static/89481957200926105219622/) 

<br/>