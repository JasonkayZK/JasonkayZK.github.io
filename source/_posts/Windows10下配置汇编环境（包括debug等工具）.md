---
title: Windows10下配置汇编环境（包括debug等工具）
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?x'
date: 2021-03-27 20:28:34
categories: 汇编语言
tags: [汇编语言, 软件安装与配置]
description: 本文讲述了如何在Windows10下配置学习汇编语言的环境；包括编辑器VSCode以及DOSBOX等；
---

本文讲述了如何在Windows10下配置学习汇编语言的环境；

包括编辑器VSCode以及DOSBOX等；

<br/>

<!--more-->

## **Windows10下配置汇编环境**

### **安装插件**

首先在VS Code下搜索并安装插件：

-   MASM：用于进行代码语法提示；（作者：blindtiger）
-   MASM/TASM：提供了DOSBox、Debug等工具；（作者：clcxsrolau）

插件安装完成后，可以在VS Code的插件目录下找到MASM/TASM的插件；

>   通常VS Code的插件被安装在`$user_home/.vscode/extensions`目录下；
>
>   如：`C:\Users\jasonkay\.vscode\extensions`；

MASM/TASM的插件在`xsro.masm-tasm-0.X.X`目录中，在其中的tools目录包括了DOSBox、MASM、TASM等工具；

为了方便使用，我们可以将tasm、masm以及dosbox目录加入系统环境变量PATH中，方便启动；

<font color="#f00">**同时为了将来在DOSBox中方便映射，可以将masm目录拷贝一份到其他盘的根目录；**</font>

<br/>

### **验证插件**

如果是使用VS Code进行编程，可以直接编写以`.asm`结尾的文件；

并使用`Ctrl + Shift + P`打开VS Code终端，然后选择`run ASM code`或者`debug ASM code`即可；

以下面Hello-world的代码为例：

```assembly
;Hello World

.386
DATA SEGMENT USE16
    MESG DB 'hello tasm', 0AH, '$'

DATA ENDS

CODE SEGMENT USE16
    ASSUME CS:CODE, DS:DATA
BEG:
    MOV AX, DATA
    MOV DS, AX
    MOV CX, 8
    MOV AH, 9
LAST:
    MOV AH, 9
    MOV DX, OFFSET MESG
    INT 21H
    LOOP LAST
    MOV AH, 4CH
    INT 21H ; BACK TO DOS
CODE ENDS
END BEG
```

执行成功即可；

<br/>

### **在DOSBox中使用Debug**

首先打开DOSBox；

在刚进入DOSBox时，我们是**没有挂载任何文件目录的（此时会提示我们在Z盘）**，这时是找不到debug的；

并且输入`c:`尝试跳转到C盘会出现提示：

```powershell
Z:\> c:
Drive C does not exist!
You must mount it first. Type intro or intro mount for more information.
```

我们可以挂载MASM的目录到C盘，如下：

```powershell
Z:\>mount c c:\Users\jasonkay\.vscode\extensions\xsro.masm-tasm-0.8.4\tools\masm
Drive C is mounted as local directory c:\Users\jasonkay\.vscode\extensions\xsro.masm-tasm-0.8.4\tools\masm

# 切换至C盘
Z:\>c:

# 使用Debug
C:\>debug
-r
AX=0000  BX=0000  CX=0000 ....

# 退出Debug
-q
```

<font color="#f00">**如果你拷贝了masm目录，这里的挂载目录可以为你拷贝的目录，如：`e:\masm`**</font>

<br/>

### **其他**

#### **关于DOSBox**

根据维基百科上定义讲：

**DOSBox**是一种模拟器软件，主要是在IBM PC兼容机下，模拟旧时的操作系统：MS-DOS，支持许多IBM PC兼容的显卡和声卡，为本地的DOS程序提供执行环境，使这些程序可以正常运行于大多数现代计算机上的不同操作系统；

DOSBox特别是为运行早期的计算机游戏所设计，主要以C++编写，是以GNU通用公共许可证许可发布的自由软件；

DOSBox可以运行那些在现代计算机上不能运行的MS-DOS软件，这些软件通常与现在的主流硬件和操作系统有一些不兼容；

DOSBox在模拟MS-DOS同时，还增加了一些可用特性，包括虚拟磁盘、点对点网络、对模拟画面截图和录像；

有些非官方的DOSBox变体，如DOSBox SVN Daum和DOSBox SVN-lfn提供了更多的功能，比如存档、长文件名支持等；有些游戏开发商重新发行早期的DOS游戏时，也会使用DOSBox，使其可以在现代计算机上运行；

<br/>

#### **关于学习汇编**

我阅读的是王爽老师的《汇编语言（第三版）》；

**想要阅读的可以在本博客的文件分享中下载这本书：**

-   [文件分享](/sharing/)

**我的学习的仓库：**

-   [assembly_learn](https://github.com/JasonkayZK/assembly_learn)

最后，附上一张我在看书的时候记笔记的照片，总的来说汇编还是挺有意思的：

<font color="#f00">**（图为第三章结尾：当使用MOV命令修改SS寄存器，并进入系统中断并返回后导致的即使未向栈中PUSH数据，仍然具有数据的原因）**</font>

![学习汇编笔记.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/学习汇编笔记.png)

<br/>