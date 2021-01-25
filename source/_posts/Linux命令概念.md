---
title: Linux命令概念
cover: https://acg.toubiec.cn/random?14
date: 2020-04-05 10:49:47
categories: Linux
toc: true
tags: [Linux]
description: 本篇总结Linux操作系统下命令的概念
---

本篇总结Linux操作系统下命令的概念

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## Linux命令概念

在Linux的bash中命令有两类:

-   **内部命令(builtin): bash中自带的命令(如`echo`)**
-   **外部命令: 在Linux文件系统中的程序执行的命令**
    -   **二进制命令;**
    -   **脚本命令;**

在Linux中命令是以空白符分隔(可以是多个分隔符)[**空格敏感, $敏感…**]

对空白符切割之后, 认为第一个是命令, 后面的是参数;

在执行命令时, bash首先会进行几类扩展, 包括命令替换, 变量替换, 正则替换等等; 

**转换结束之后才会真正执行命令!**

><br/>
>
>更多见: [Bash各类扩展详解](https://blog.csdn.net/weixin_33725239/article/details/91707854)

**操作系统是怎么寻找指令的?**

通过操作系统中的`PATH`环境变量:

```bash
# 在Windows中是两个%
[root@490de829cb74 /]# echo $PATH
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
```

在shell中会从左到右依次扫描这些路径, 去寻找命令;

****

### 内部常用变量

| **变量**  | **含义**                              |
| :-------: | ------------------------------------- |
|   `$0`    | 脚本名                                |
| `$1 -$9`  | 位置参数1-9                           |
| `${ 10 }` | 位置参数10                            |
|   `$#`    | 位置参数的个数                        |
|   `$*`    | 所有位置参数(作为单个字符串)          |
|   `$@`    | 所有位置参数(每个作为单独字符串)      |
| `${ #* }` | 传递到脚本中的命令行参数的个数        |
| `${ #* }` | 传递到脚本中的命令行参数的个数        |
|   `$?`    | 返回值                                |
|   `$$`    | 脚本进程的PID                         |
|   `$-`    | 传递到脚本中的标识                    |
|   `$_`    | 之前命令的最后一个参数                |
|   `$!`    | 运行在后台的最后一个作业的进程ID(PID) |

****

### help

学习shell的内部命令可以通过`help`命令

**使用:** help + 内部命令(**可通过type查看是不是内部命令**)

例1:

```bash
# help
GNU bash, version 4.1.2(2)-release (x86_64-redhat-linux-gnu)
These shell commands are defined internally.  Type `help' to see this list.
Type `help name' to find out more about the function `name'.
Use `info bash' to find out more about the shell in general.
Use `man -k' or `info' to find out more about commands not in this list.

A star (*) next to a name means that the command is disabled.
......
```

**单独使用help可以获取所有的内部命令;**

例2:

```bash
# help echo
echo: echo [-neE] [arg ...]
    Write arguments to the standard output.
    
    Display the ARGs on the standard output followed by a newline.
    
    Options:
      -n	do not append a newline
      -e	enable interpretation of the following backslash escapes
      -E	explicitly suppress interpretation of backslash escapes
......
    
# echo -n 'Hello world'
Hello world[root@490de829cb74 /]# 
```

****

### whereis

**使用:** whereis + 命令

**作用:** 定位命令的位置;(和type类似)

****

### man

**使用:** man + 命令

**作用:** 查看外部命令的说明;

安装:

```bash
# yum install man man-pages
```

****

### type命令

**使用:** type + 命令;

**作用:** 可以获取到文件类型(命令的来源)

例1:

```bash
$ type ifconfig 
ifconfig 是 /sbin/ifconfig
```

例2:

```bash
[root@490de829cb74 /]# type echo
echo is a shell builtin
[root@490de829cb74 /]# type bash
bash is /bin/bash
```

****

### file命令

**使用:** file + 文件

**作用:** 获取文件的解释

例1:

```bash
$ file /sbin/ifconfig 
/sbin/ifconfig: ELF 64-bit LSB shared object, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/l, for GNU/Linux 2.6.32, BuildID[sha1]=5b520b9bf0713ebab9f31dcd60400359b0fb186c, stripped
```

><br/>
>
>**注:ELF表示二进制程序的编码格式(类似于Windows下的exe)**

例2:

```bash
# file /usr/bin/yum
/usr/bin/yum: a /usr/bin/python script text executable

# vi /usr/bin/yum

#!/usr/bin/python
import sys
try:
    import yum
except ImportError:
    print >> sys.stderr, """\
There was a problem importing one of the Python modules
required to run yum. The error leading to this problem was:
......
```

><br/>
>
>**注:**
>
>yum命令本质上是一个python脚本;
>
>在执行yum命令时, 首先会启动python解释器(`/usr/bin/python`), 然后通过python解释器执行这个脚本!

****

### echo

显示一个字符串;(打印到标准输出)

例:

```bash
# echo "hello world"
hello world
```

****

### ps

显示进程信息

例: `ps -fe`

```shell
[root@490de829cb74 /]# ps -fe
UID        PID  PPID  C STIME TTY          TIME CMD
root         1     0  0 08:13 pts/0    00:00:00 /bin/bash
root        46     0  0 08:21 pts/1    00:00:00 /bin/bash
root        71    46  0 08:41 pts/1    00:00:00 ps -fe
```

****

### pstree

将所有行程以树状图显示

树状图将会以 pid (如果有指定) 或是以 init 这个基本行程为根 (root)

如果有指定使用者 id，则树状图会只显示该使用者所拥有的行程

例:

```bash
zk@zk:~$ pstree
......
```

<br/>