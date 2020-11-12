---
title: 解决由于CRLF导致shell脚本无法运行
cover: https://acg.yanwz.cn/api.php?25
date: 2020-05-10 15:03:09
categories: 技术杂谈
tags: [技术杂谈]
toc: true
description: 在Windows下编辑的shell脚本在写入时默认的换行符为CRLF,而在Linux中换行符为LF这可能导致在Windows下编辑的脚本在Linux下运行报错;
---


在Windows下编辑的shell脚本在写入时默认的换行符为CRLF,而在Linux中换行符为LF这可能导致在Windows下编辑的脚本在Linux下运行报错;

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## 解决由于CRLF导致shell脚本无法运行

### 问题来源

在Git拉取的项目在Win下编辑并且保存了, 结果导致换行符出现了CRLF;

使用Goland远程开发时, 将Win中的项目同步push到了云服务器, 结果启动脚本报错:

`invalid option 2: set: -`

><br/>
>
>**什么是CRLF和LF**
>
>CRLF 是 carriage return line feed 的缩写；中文意思是 回车换行
>
>LF 是 line feed 的缩写，中文意思是换行
>
>****
>
>**换行符\n和回车符\r**
>
>回车符就是回到一行的开头，用符号r表示，十进制ASCII代码是13，十六进制代码为0x0D，回车（return）；
>
>换行符就是另起一行，用n符号表示，ASCII代码是10，十六制为0x0A， 换行（newline）
>
>****
>
>**应用情况**
>
>Dos和Windows平台：使用回车（CR）和换行（LF）两个字符来结束一行，回车+换行(CR+LF)，即`\r\n`；
>
>Mac 和 Linux平台：只使用换行（LF）一个字符来结束一行，即`\n`；
>
>PS: 最早Mac每行结尾是回车CR 即'\r'，后mac os x 也投奔了 unix
>
>**许多 Windows 上的编辑器会悄悄把行尾的换行（LF）字符转换成回车（CR）和换行（LF），或在用户按下 Enter 键时，插入回车（CR）和换行（LF）两个字符**
>
>**但是文本编辑器不会**
>
>****
>
>**影响**
>
>-   一个直接后果是，Unix/Mac系统下的文件在Windows里打开的话，所有文字会变成一行
>-   而Windows里的文件在Unix/Mac下打开的话，在每行的结尾可能会多出一个^M符号
>-   Linux保存的文件在windows上用记事本看的话会出现黑点

<br/>

### 解决方法

**① 使用vim编辑器**

在vim编辑栏可以使用`set ff`查看文件格式:

```
: set ff
```

修改方法

```
： set ff=unix
```



****

**② 使用dos2unix**

首先可以使用apt或者yum安装dos2unix;

关于dos2unix命令可见:

[dos2unix命令](https://www.jianshu.com/p/d2e96b2ccab9)

最简单的用法就是dos2unix直接跟上文件名：`dos2unix file`

<br/>

### 其他

对于像是使用Goland或者VSCode这种编辑器进行代码远程同步时;

**最好先在Linux服务器clone, 然后再使用SFTP同步;**

**否则如果现在Win下clone然后push同步到服务器, 可能就会出现CRLF转换的问题导致shell脚本无法使用!**

<br/>

### 关于Git

windows平台下使用git add等命令时也经常出现`“warning: LF will be replaced by CRLF”` 的提示, 这其实就是Git帮助你解决的跨平台的换行问题;

在Git中，可以通过以下命令来显示当前你的Git中采取哪种对待换行符的方式:

```bash
git config core.autocrlf
true
```

此命令会有三种输出:

| **输出**  | **说明**                                                     |
| :-------- | :----------------------------------------------------------- |
| **true**  | Git会将你add的所有文件视为文本文件，将结尾的CRLF转换为LF<br />而checkout时会再将文件的LF格式转为CRLF格式 |
| **false** | 对文件不做任何改变，文本文件保持其原来的样子                 |
| **input** | add时Git会把CRLF转换为LF，而check时仍旧为LF<br />**Windows操作系统不建议设置此值** |

>   <br/>
>
>   **当core autocrlf为true时，还有一个需要慎重的地方**
>
>   <font color="#f00">**当你上传一个二进制文件，Git可能会将二进制文件误以为是文本文件，从而也会修改你的二进制文件，从而产生隐患**</font>

可以通过`git config –global key value`的方式对其进行配置, 如:

```bash
# true的位置放你想使autocrlf成为的结果，true，false或者input
git config --global core.autocrlf true
```

>   <br/>
>
>   将core.autocrlf设为false即可解决这个Warning, 如果你和你的伙伴只工作于Windows平台或者Linux平台，那么没问题;
>
>   **不过如果是存在跨平台的现象的话，就很有可能会出现问题!**

### Git配置

Git 的 Windows 客户端基本都会默认设置 `core.autocrlf=true`, 只要保持工作区都是纯 CRLF 文件，编辑器用 CRLF 换行，就不会出现警告了；

<font color="#f00">**Linux 最好不要设置 core.autocrlf，因为这个配置算是为 Windows 平台定制；**</font>

<font color="#f00">**Windows 上设置 core.autocrlf=false，仓库里也没有配置 .gitattributes，很容易引入 CRLF 或者混合换行符（Mixed Line Endings，一个文件里既有 LF 又有CRLF）到版本库，这样就可能产生各种奇怪的问题**</font>

<br/>

## 附录

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>