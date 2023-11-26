---
title: Linux中的/dev/null
toc: true
cover: 'https://img.paulzzh.com/touhou/random?33'
date: 2021-04-17 17:33:26
categories: Linux
tags: [Linux, 技术杂谈]
description: Linux中存在一个特殊的设备文件/dev/null，又被称为Bit Bucket，本文讲述了/dev/null的作用和使用场景；
---

Linux中存在一个特殊的设备文件/dev/null，又被称为Bit Bucket；

本文讲述了/dev/null的作用和使用场景；

<br/>

<!--more-->

## **Linux中的/dev/null**

### **为什么/dev/null被称为Bit Bucket**

早期的计算机使用打孔卡来存储数据和代码；当这些打孔卡被使用过后，就被收集在了一个桶中；

久而久之，Bit Bucket就代表了那些存放无用二进制数据的“代言人”。

`/dev/null`的其他名称是：`black hole`, `null route`, `punch bucket`, `null device`，或者`null`；

<br/>

### **/dev/null文件介绍**

`/dev/null`文件是在boot启动时才生成的伪设备文件（pseudo-device file）；它没有大小（0个字节），在磁盘上占用0个块，并且所有用户对该文件具有读/写权限；并且该文件和上次系统重新启动具有相同的日期和时间；它是一个特殊的文件，称为字符设备文件（character device file），使得`/dev/null`文件可以像一个无缓冲的设备（空设备）一样工作，并且可以接受数据流；

当你访问设备文件时，需要与驱动程序进行通信；对于`/dev/null`而言，它充当一个具有特定目的驱动程序的伪设备：丢弃写入的所有内容，并且在读取时仅返回EOF字符；

<br/>

### **/dev/null使用场景**

#### **抑制输出流显示**

Linux中可以使用`>`进行数据流重定向；

我们可以将程序的标准输出流直接输入至`/dev/null`设备，从而避免了在终端显示；

例如：

```bash
$ stat /etc/passwd 2> /dev/null
```

会将错误流全部丢弃；

<br/>

#### **使用/dev/null写入EOF**

`/dev/null`的另一个常见用法是提供一个blank或null input，即EOF字符。

对于许多程序需要EOF字符才能继续。例如，mailx允许从命令行发送电子邮件。在发送时，可以一直输入，直到接收到EOF字符为止（通过按CTRL + D发送该字符）；

如果想要发送空白电子邮件，则不得不进入交互模式并按CTRL + D表示没有任何输入；

但是如果以脚本或其他方式使用，则无法实现；

作为一种解决方法，我们可以将`/dev/null`输出重定向到mailx命令中，以执行发送空白邮件的操作：

```bash
$ mailx -s "Just Another Email" user@github.com < /dev/null
 Null message body; hope that's ok
```

<br/>

#### **使用/dev/null清空文件**

`/dev/null`文件的另一个常用用法是清空文件的内容；

<font color="#f00">**如果使用`>`重定向操作符将`/dev/null`重定向到文件中，它将直接删除该文件的全部内容！**</font>

例如：

```bash
$ cat scp.log
 Changing to backup directory…
 Sending SCP request to download fw-backup-2019_11_10…
 fw-backup-2019_11_10-03_03_27-2.0.32.zip      100%  536MB   2.8MB/s   03:14    
$ 
$ cat /dev/null > scp.log
$ 
$ ls -l scp.log
-rw-r--r--. 1 savona savona 0 Nov 11 21:32 scp.log
$ cat scp.log 
$ 
```

或者，<font color="#f00">**也可以使用`cp`命令复制`/dev/null`中的内容至文件中；**</font>

如下所示：

```bash
$ cat scp.log 
 Changing to backup directory…
 Sending SCP request to download fw-backup-2019_11_10…
 fw-backup-2019_11_10-03_03_27-2.0.32.zip      100%  536MB   2.8MB/s   03:14
$ 
$ cp /dev/null scp.log 
$ 
$ cat scp.log 
$ ls -l scp.log 
-rw-r--r--. 1 savona savona 0 Nov 11 21:34 scp.log
$ 
```

<br/>

## **附录**

文章翻译自：

-   [What Is /Dev/Null – an Introduction to the Bit Bucket](https://www.putorius.net/introduction-to-dev-null.html)

<br/>

