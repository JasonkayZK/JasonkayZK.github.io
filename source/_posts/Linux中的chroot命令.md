---
title: Linux中的chroot命令
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?7'
date: 2021-06-26 10:19:22
categories: Linux
tags: [Linux, chroot]
description: 在Linux中提供了chroot命令用于将根目录换成指定的目的目录，从而达到了与原系统隔离的目的；本文介绍了Linux中的chroot命令；
---

在Linux中提供了chroot命令用于将根目录换成指定的目的目录，从而达到了与原系统隔离的目的；

本文介绍了Linux中的chroot命令；

<br/>

<!--more-->

## **Linux中的chroot命令**

### **命令介绍**

**chroot命令** 用来在指定的根目录下运行指令，即：`change root directory （更改 root 目录）`；

>   chroot [最早](https://blog.aquasec.com/a-brief-history-of-containers-from-1970s-chroot-to-docker-2016)是作为**系统调用**引入 1979 年的 Unix V7 系统，目的是为了将当前进程及其子进程的 root 目录重定向到某个指定目录；
>
>   1982 年，chroot 功能被加入到 BSD 中，后经 20 多年，FreeBSD 团队引入虚拟化技术的概念，在原本的 chroot 机制上，开发了新的 jail 机制；

<font color="#f00">**在 linux 系统中，系统默认的目录结构都是以`/`，即是以根 (root) 开始的；**</font>

<font color="#f00">**而在使用 chroot 之后，系统的目录结构将以指定的位置作为`/`位置；**</font>

**在经过 chroot 命令之后，系统读取到的目录和文件将不在是旧系统根下的而是新根下（即被指定的新的位置）的目录结构和文件；**

>   **简单来说：**
>
>   <font color="#f00">**一个正在运行的进程经过 chroot 操作后，其根目录将被显式映射为某个指定目录，它将不能够对该指定目录之外的文件进行访问动作；**</font>
>
>   这是一种非常简单的资源隔离化操作，类似于现在 Linux 的 Mount Namespace 功能；
>
>   当年 Docker 刚开源的时候，有个人就利用 Linux 下 chroot 命令，用 100 多行的 Bash 代码实现了一个[模拟版的 Docker](https://github.com/p8952/bocker?hmsr=toutiao.io&utm_medium=toutiao.io&utm_source=toutiao.io)；

因此它带来的好处大致有以下3个：

-   <font color="#f00">**增加系统的安全性，限制用户的权力；**</font>

在经过 chroot 之后，在新根下将访问不到旧系统的根目录结构和文件，这样就增强了系统的安全性；

这个一般是在登录 (login) 前使用 chroot，以此达到用户不能访问一些特定的文件；

-   <font color="#f00">**建立一个与原系统隔离的系统目录结构，方便用户的开发；**</font>

使用 chroot 后，系统读取的是新根下的目录和文件，这是一个与原系统根下文件不相关的目录结构；

在这个新的环境中，可以用来测试软件的静态编译以及一些与系统不相关的独立开发；

-   <font color="#f00">**切换系统的根目录位置，引导 Linux 系统启动以及急救系统等；**</font>

chroot 的作用就是切换系统的根位置，而这个作用最为明显的是在系统初始引导磁盘的处理过程中使用，从初始 RAM 磁盘 (initrd) 切换系统的根位置并执行真正的 init；

另外，当系统出现一些问题时，我们也可以使用 chroot 来切换到一个临时的系统；

<br/>

### **使用场景**

如果一个进程/命令运行在一个不能访问外部根目录文件的已修改环境中，这种修改环境通常被称为`监禁目录（jail）`或是`chroot 监禁`，只有特权进程和根用户才能使用 chroot 命令；

这通常是很有用的：

1.  将特权分配给无特权的进程，例如 Web 服务或 DNS 服务；
2.  建立测试环境；
3.  不使程序或系统崩溃下，运行旧程序或 ABI 兼容的程序；
4.  系统恢复；
5.  重新安装引导装载程序，例如 Grub 或 Lilo；
6.  密码找回，重置一个已丢失的密码等；

<br/>

### **命令语法**

在现今的 Linux 上，chroot 既是一个 CLI 工具（`chroot(8)`），又是一个系统调用（`chroot(2)`）；

命令语法如下：

```shell
chroot [OPTION] NEWROOT [COMMAND [ARGS]...]

# 例如：
chroot /path/to/new/root command
# 或
chroot /path/to/new/root /path/to/server
# 或
chroot [options] /path/to/new/root /path/to/server

# 选项
--userspec=USER:GROUP  # 使用指定的 用户 和 组 (ID 或 名称)
--groups=G_LIST        # 指定补充组 g1,g2,..,gN 
--help     # 显示帮助并退出
--version  # 显示版本信息并退出
```

-   目录(dir)：指定新的根目录；
-   指令(command)：指定要执行的指令；

COMMAND 指的是切换 root 目录后需要执行的命令，如果没有指定，默认是 `${SHELL} -i`，大部分情况是 `/bin/bash`；

此外，执行 `chroot(8)` 需要使用 root 权限；

例如，简单地，我们可以这样使用：

```bash
$ sudo chroot /path/to/new/root /bin/bash
```

下面就让我们来建造我们的监狱（jail）；

<br/>

### **使用案例：Jail**

创建对应的新的根目录：

```bash
$ J=$HOME/jail
$ mkdir -p $J
$ mkdir -p $J/{bin,lib/x86_64-linux-gnu,lib64,etc,var}
```

将几个必要的命令工具 copy 到 `bin/` 下：

```bash
$ sudo cp -vf /bin/{bash,ls} $J/bin
```

将步骤 2 中可执行命令依赖的动态库 copy 到 `jail/` 下：

```bash
$ list=`ldd /bin/ls | egrep -o '/lib.*\.[0-9]'`
$ for i in $list; do sudo cp -vf $i $J/$i; done

$ list=`ldd /bin/bash | egrep -o '/lib.*\.[0-9]'`
$ for i in $list; do sudo cp $i -vf $J/$i; done
```

执行 chroot 命令：


```bash
$ sudo chroot $J /bin/bash

bash-4.3# ls
bin  etc  lib  lib64  var
bash-4.3# cd /
bash-4.3# ls
bin  etc  lib  lib64  var
bash-4.3# cd ..
bash-4.3# ls
bin  etc  lib  lib64  var
```

可以看到无论我们如何改变目录，其根目录都被隔离在 `$J` 中；

**执行 `exit` 命令可退出这一环境；**

<br/>

### **使用`chroot(2)`系统调用**

`chroot(2)` 的原型是：

```c
#include <unistd.h>

int chroot(const char *path);
```

`chroot()` 将调用进程及其子进程的根目录指定为 path；

>   **同样的，执行该调用需要使用 root 权限；**

如以下代码所示：

test_chroot.c

```c
#include <stdio.h>
#include <error.h>
#include <unistd.h>
#include <stdlib.h>

char *const path = "/root/jail"; // 如上文实验所述目录
char *const argv[] = {"/bin/bash", NULL};

int main(void) {
    if (chroot(path) != 0) {
        perror("chroot error");
    	  exit(1);
    }
    chdir("/");                 // 忽略返回值
    execvp("/bin/bash", argv);  // 忽略返回值
    return 0;
}
```

编译和运行代码：

```bash
$ gcc test_chroot.c -o test_chroot

$ ./test_chroot # 非 root 用户执行命令
chroot error: Operation not permitted

$ sudo ./test_chroot
bash-4.3#
```

<br/>

### **查找服务是否存在于 chrooted 监禁内**

可通过查看进程的 `/proc/<pid>/root` 来查看对应进程是否处于 chroot 监禁中；

如上文，其 chroot 下 bash 的执行进程为 15768，则有：

```bash
$ sudo ls -ld /proc/15768/root
lrwxrwxrwx 1 root root 0 Apr 17 22:47 /proc/15768/root -> /root/jail
```

可见其根目录已经被修改为 `/root/jail`；

<br/>

### **在 Linux 和 类Unix 系统下 chroot 应用程序的注意事项**

从上面的例子看出，chroot 是相当简单的，但是最终可能出现几种不同的问题而结束，例如：

-   **在 jail 中缺失库文件可能直接导致 jail 崩溃；**
-   **一些复杂的程序不好被 chroot；**
-   **正在运行某一程序的 jail 不能再运行其他程序，不能更改任何文件，也不能"假设"另一个用户的身份；放宽这些限制，会降低你的安全性，请根据具体情况使用chroot；**

因此要么尝试真正的jail，例如：[FreeBSD提供的](http://www.cyberciti.biz/faq/how-to-upgrade-freebsd-jail-vps/)，要么用虚拟化解决，比如[Linux 下的 KVM](http://www.cyberciti.biz/faq/kvm-virtualization-in-redhat-centos-scientific-linux-6/)；

还要注意：

1.  **当你升级本地程序时，不要忘记升级已 chroot 的程序；**
2.  **并非所有程序能够或者应该被 chroot；**
3.  **任何需要 root 权限操作的程序，对其 chroot 是没意义的，因为通常 root 用户都能脱离 chroot；**
4.  **Chroot 并不一个高招；更多的可以学习[如何保护和加强系统的各个部分](http://www.cyberciti.biz/tips/linux-security.html)；**

>   **chroot 的安全问题：**
>
>   chroot 机制从一开始就并非安全，存在很多安全漏洞，有不少「越狱」（jailbreak）的手段；

<br/>

## **附录**

文章参考：

-   [chroot](https://wangchujiang.com/linux-command/c/chroot.html)
-   [chroot 命令小记](https://juejin.cn/post/6844903592466317319)
-   [Linux / Unix：chroot 命令实例讲解](https://linux.cn/article-3068-1.html)

<br/>