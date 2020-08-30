---
title: Linux文件系统
cover: http://api.mtyqx.cn/api/random.php?66
date: 2020-04-05 17:02:53
categories: Linux
toc: true
tags: [Linux]
description: 本文讲解Linux中的文件系统
---

本文讲解Linux中的文件系统

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## Linux文件系统

### Linux目录结构

**磁盘分区**

使用`df -h`命令可以看到磁盘分区使用量

```bash
[root@490de829cb74 /]# df -h
Filesystem      Size  Used Avail Use% Mounted on
overlay         254G   16G  226G   7% /
tmpfs            64M     0   64M   0% /dev
tmpfs            16G     0   16G   0% /sys/fs/cgroup
shm              64M     0   64M   0% /dev/shm
/dev/nvme0n1p3  254G   16G  226G   7% /etc/resolv.conf
/dev/nvme0n1p3  254G   16G  226G   7% /etc/hostname
/dev/nvme0n1p3  254G   16G  226G   7% /etc/hosts
tmpfs            16G     0   16G   0% /proc/asound
tmpfs            16G     0   16G   0% /proc/acpi
tmpfs            64M     0   64M   0% /proc/kcore
tmpfs            64M     0   64M   0% /proc/keys
tmpfs            64M     0   64M   0% /proc/timer_list
tmpfs            64M     0   64M   0% /proc/sched_debug
tmpfs            16G     0   16G   0% /proc/scsi
tmpfs            16G     0   16G   0% /sys/firmware
```

Linux目录结构和windows有着本质的区别;

首先在Linux中采用的是目录树的结构, 而每一个目录是抽象出的存储结构(并且有着固定的命名)

这样做的好处就是, 目录可以**灵活的被挂载和释放**; 同时, 在Linux生态中, **目录名称都相同**, 可以减少不必要的错误;

****

**查看文件使用情况**

使用`du -sh [path]`查看path路径下的文件大小(磁盘使用情况)

例:

```bash
[root@490de829cb74 tmp]# du -sh ./*
20K	./anaconda-post.log
0	./yum.log
4.0K	./yum_save_tx-2020-04-05-02-54bldaOR.yumtx
```

<br/>

### 文件类型

**ls命令**

可以使用`ls -l`查看当前目录下文件内容

例1: 查看dev(Linux中外接设备目录)

```bash
zk@zk:/dev$ ls -l
总用量 0
crw-r--r--  1 root root     10, 235 4月   5 14:55 autofs
drwxr-xr-x  2 root root         700 4月   5 14:55 block
drwxr-xr-x  2 root root          60 4月   5 14:55 bsg
crw-------  1 root root     10, 234 4月   5 14:55 btrfs-control
drwxr-xr-x  3 root root          60 4月   5 14:55 bus
drwxr-xr-x  2 root root        4420 4月   5 14:55 char
crw-------  1 root root      5,   1 4月   5 14:55 console
lrwxrwxrwx  1 root root          11 4月   5 14:55 core -> /proc/kcore
drwxr-xr-x  2 root root          60 4月   5 14:55 cpu
crw-------  1 root root     10,  59 4月   5 14:55 cpu_dma_latency
crw-------  1 root root     10, 203 4月   5 14:55 cuse
drwxr-xr-x  6 root root         120 4月   5 14:55 disk
drwxr-xr-x  3 root root         100 4月   5 14:55 dri
crw-------  1 root root    239,   0 4月   5 14:55 drm_dp_aux0
crw-------  1 root root     10,  62 4月   5 14:55 ecryptfs
crw-rw----  1 root video    29,   0 4月   5 14:55 fb0
lrwxrwxrwx  1 root root          13 4月   5 14:55 fd -> /proc/self/fd
brw-rw----   1 root disk      8,   0 4月   5 14:55 sda
brw-rw----   1 root disk      8,   1 4月   5 14:55 sda1
brw-rw----   1 root disk      8,   2 4月   5 14:55 sda2
brw-rw----   1 root disk      8,   5 4月   5 14:55 sda5
brw-rw----   1 root disk      8,   6 4月   5 14:55 sda6
crw-rw----   1 root disk     21,   0 4月   5 14:55 sg0
drwxrwxrwt   2 root root          40 4月   5 17:34 shm/
......
```

<br/>

首先, 在Linux中**一切皆文件;**

其次, 在Linux中**文件的扩展名是没有意义的**(与windows通过扩展名来识别文件类型不同)

所以在使用文件时, 需要通过指定`命令 + 文件`的方式来使用文件

下面介绍

**其中:**

**① 首列:**

-   `-`: 代表普通文件;
-   `d`: 这个文件是一个目录;
-   `b`: 字节流文件(例如: 硬盘数据IO)
-   `c`: 字符流文件(例如: 键盘, 显示器等设备的IO流)
-   `l`: 软连接文件(link)
-   `s`: socket连接IO;
-   `p`: 管道(pipe);

><br/>
>
>**说明:**
>
>对于键盘, 显示器等这类IO设备, 他的底层的数据是有严格规定(数据不可再分的), 所以是字符流;
>
>而对于类似于硬盘等设备, 可以逐个字节读入数据, 所以是字节流;

例2: 查看/proc目录(内核映射)

```bash
zk@zk:/proc$ ls
1      1115  13    1584  1861   21859  22851  2630   2886   2979   32    350   415   546   620   7539  87    964  994          kallsyms      self
10     1116  1300  1585  1888   219    229    2672   2897   2982   3234  351   416   547   621   76    88    965  999          kcore         slabinfo
100    1123  1302  1588  2      21971  22906  2678   29     2983   33    353   42    549   63    769   8809  966  acpi         keys          softirqs
1000   113   1312  1589  20     22     23     27     2918   2987   3312  3547  44    550   630   77    8810  967  asound       key-users     stat
1001   114   1324  1590  2026   220    230    2714   2922   2992   332   355   4435 
......
```

其中的数字代表进程号(PID)

即在Linux中每一个进程是一个目录;

然后通过`$$`可以看到当前bash的进程号, 并进入目录可以看到fd目录(**文件描述符**)

```bash
zk@zk:/proc$ echo $$
31731
zk@zk:/proc$ cd 31731/
zk@zk:/proc/31731$ ll
总用量 0
dr-xr-xr-x   9 zk   zk   0 4月   5 17:49 ./
dr-xr-xr-x 428 root root 0 4月   5 14:55 ../
-r--r--r--   1 zk   zk   0 4月   5 17:50 arch_status
# 当前进程文件描述符
dr-x------   2 zk   zk   0 4月   5 17:49 fd/ 
dr-x------   2 zk   zk   0 4月   5 17:50 fdinfo/
-rw-r--r--   1 zk   zk   0 4月   5 17:50 gid_map
......
```

进入fd目录, 可以看到当前进程取得的描述符:

```bash
zk@zk:/proc/31731/fd$ ll
总用量 0
dr-x------ 2 zk zk  0 4月   5 17:49 ./
dr-xr-xr-x 9 zk zk  0 4月   5 17:49 ../
lrwx------ 1 zk zk 64 4月   5 17:49 0 -> /dev/pts/1
lrwx------ 1 zk zk 64 4月   5 17:49 1 -> /dev/pts/1
lrwx------ 1 zk zk 64 4月   5 17:49 2 -> /dev/pts/1
lrwx------ 1 zk zk 64 4月   5 17:51 255 -> /dev/pts/1
```

其中有0, 1, 2等文件描述符, 代表:

-   `0`: 标准输入流 
-   `1`: 标准输出流
-   `2`: 错误输出流
-   `255`: 

**每一个程序都会有上面的几个文件描述符;**

**如果你在程序中又打开了一个文件, 此时会再创建一个文件描述符(如3);**

<font color="#f00">**即: 每一个IO流都会在fd创建一个文件描述符**</font>

><br/>
>
>**扩展:**
>
>在Java中使用System.out.println实际上是取得了文件描述符`1`进行操作;
>
>而System.err.println是取得了文件描述符2(虽然很少被使用)

<br/>

### 文件权限

例如:

```bash
zk@zk:/home$ ll
drwxr-xr-x  4 root root  4096 1月  11 20:08 ./
drwxr-xr-x 24 root root  4096 4月   1 08:31 ../
drwx------  2 root root 16384 1月  11 20:06 lost+found/
drwxr-xr-x 57 zk   zk    4096 4月   5 17:40 zk/
```

从左到右依次代表:

-   `d`: 文件类型(为目录)
-   `rwx------`: 文件持有者权限, 组权限, 其他人权限;
-   `4` 文件硬链接数
-   `root root`: 文件持有者, 文件持有组
-   `4096`: 文件大小;
-   `1月  11 20:08`: 文件修改时间
-   `lost+found/`: 文件/目录名称;

<br/>

### 文件目录介绍

```bash
zk@zk:/$ ll
drwxr-xr-x   2 root root  4096 3月  31 09:27 bin/
drwxr-xr-x   4 root root  4096 4月   2 09:31 boot/
drwxr-xr-x   2 root root  4096 1月  11 20:07 cdrom/
drwxr-xr-x  20 root root  4780 4月   5 14:55 dev/
drwxr-xr-x 133 root root 12288 4月   5 07:53 etc/
drwxr-xr-x   4 root root  4096 1月  11 20:08 home/
drwxr-xr-x  22 root root  4096 1月  29 10:00 lib/
drwxr-xr-x   2 root root  4096 8月   6  2019 lib64/
drwx------   2 root root 16384 1月  11 20:06 lost+found/
drwxr-xr-x   3 root root  4096 2月   4 10:04 media/
drwxr-xr-x   2 root root  4096 8月   6  2019 mnt/
drwxr-xr-x  11 root root  4096 2月  26 19:58 opt/
dr-xr-xr-x 421 root root     0 4月   5 14:55 proc/
drwx------   3 root root  4096 8月   6  2019 root/
drwxr-xr-x  32 root root   980 4月   5 15:45 run/
drwxr-xr-x   2 root root 12288 3月  26 11:02 sbin/
drwxr-xr-x  15 root root  4096 1月  12 20:37 snap/
drwxr-xr-x   2 root root  4096 8月   6  2019 srv/
dr-xr-xr-x  13 root root     0 4月   5 14:55 sys/
drwxrwxrwt  21 root root  4096 4月   5 18:09 tmp/
drwxr-xr-x  11 root root  4096 8月   6  2019 usr/
drwxr-xr-x  14 root root  4096 8月   6  2019 var/
```

-   `bin` & `sbin`: 放二进制可执行程序;
-   `boot`: 开机引导程序目录;
-   `dev`: 外挂设备目录;
-   `etc`: 配置文件目录(windows控制面板)
-   `home`: 用户目录(类似于windows中的user目录)
-   `root`: root的用户目录;
-   `lib` & `lib64`: 放扩展库;
-   `media`&`mnt`: 挂载设备(光驱等)用;
-   `usr`: 包管理器安装时释放文件的目录(类似于windows中的programFiles)
-   `opt`: 释放第三方程序; 规定: `厂商/名称/版本/版本/文件`
-   `var`: 存放程序产生的数据文件(日志, 数据库文件等);
-   `proc`: linux内核映射文件;

<br/>

### 文件操作命令

-   `df`: 显示磁盘使用情况
-   `du`: 显示文件系统使用情况
-   `ls`: 显示目录
-   `cd`: 切换工作目录
-   `pwd`: 显示当前工作目录
-   `mkdir`: 创建目录
-   `rm`: 删除
-   `cp`: 拷贝
-   `mv`: 移动/重命名
-   `ln`: 链接
-   `stat`: 元数据
-   `touch`: 创建文件/修改文件元数据到同一个时间(access, modify, change)

#### 例1: 递归创建目录

```bash
# 深度创建目录
mkdir -p ./a/b/c
# 广度创建目录
# 下面两个等价
mkdir ./test/{a,b,c}dir
mkdir ./test/adir ./test/bdir ./test/cdir
```

#### 例2: 同时复制两个文件

```bash
[root@490de829cb74 ~]# cp /etc/{profile,init.d/network} ~
[root@490de829cb74 ~]# ll
total 28
-rw------- 1 root root 2433 Apr  6  2017 anaconda-ks.cfg
-rw-r--r-- 1 root root 7242 Apr  6  2017 install.log
-rw-r--r-- 1 root root 1680 Apr  6  2017 install.log.syslog
-rwxr-xr-x 1 root root 6742 Apr  5 12:55 network
-rw-r--r-- 1 root root 1841 Apr  5 12:55 profile
```

#### 例3: 使用ln创建硬链接

```bash
[root@490de829cb74 ~]# ln profile profile.hardlink
[root@490de829cb74 ~]# ls -li
total 32
1575019 -rw------- 1 root root 2433 Apr  6  2017 anaconda-ks.cfg
1575020 -rw-r--r-- 1 root root 7242 Apr  6  2017 install.log
1575021 -rw-r--r-- 1 root root 1680 Apr  6  2017 install.log.syslog
1971595 -rwxr-xr-x 1 root root 6742 Apr  5 12:55 network
1966559 -rw-r--r-- 2 root root 1841 Apr  5 12:55 profile
1966559 -rw-r--r-- 2 root root 1841 Apr  5 12:55 profile.hardlink
```

可以看到当创建了一个`profile.hardlink`硬链接之后, `profile`和`profile.hardlink`的连接数变为了2;

><br/>
>
>**说明:**
>
>**ln命令默认为硬链接;**
>
>通过`ls -li`可以看出: **两个链接指向的是同一个磁盘的头!**
>
>**硬链接相当于Java在堆中只有一个文件, 但是有两个引用!**
>
>所以:
>
>**修改一个文件, 另一个文件也都会改变(本质上是指向同一个磁盘的文件改变)**

#### 例4: 使用ln创建软连接

```bash
[root@490de829cb74 ~]# ln -s profile profile.softlink
[root@490de829cb74 ~]# ll
total 32
-rw------- 1 root root 2433 Apr  6  2017 anaconda-ks.cfg
-rw-r--r-- 1 root root 7242 Apr  6  2017 install.log
-rw-r--r-- 1 root root 1680 Apr  6  2017 install.log.syslog
-rwxr-xr-x 1 root root 6742 Apr  5 12:55 network
-rw-r--r-- 2 root root 1841 Apr  5 12:55 profile
-rw-r--r-- 2 root root 1841 Apr  5 12:55 profile.hardlink
lrwxrwxrwx 1 root root    7 Apr  5 13:05 profile.softlink -> profile
```

><br/>
>
>**说明:**
>
>软连接相当于windows中的快捷方式;

>   <br/>
>
>   **硬链接和软连接的区别**
>
>   **硬链接:**
>
>   **① 不能对目录创建硬链接**
>
>   原因有几种，最重要的是:
>
>   **文件系统不能存在链接环**（目录创建时的".."除外，这个系统可以识别出来）
>
>   存在环的后果会导致例如文件遍历等操作的混乱(du，pwd等命令的运作原理就是基于文件硬链接，顺便一提，ls -l结果的第二列也是文件的硬链接数，即inode节点的链接数)
>
>   **② 不能对不同的文件系统创建硬链接**
>
>   即两个文件名要在相同的文件系统下
>
>   **③ 不能对不存在的文件创建硬链接**
>
>   <br/>
>
>   **软链接：**
>
>   **① 可以对目录创建软链接**
>
>   遍历操作会忽略目录的软链接
>
>   **② 可以跨文件系统**
>
>   **③ 可以对不存在的文件创建软链接**
>
>   因为放的只是一个字符串，至于这个字符串是不是对于一个实际的文件，就是另外一回事了
>
>   <br/>
>
>   **删除源文件时两者表现不同**
>
>   对于硬链接: 删除源文件相当于删除了文件的一个引用(不会影响另一个硬链接)
>
>   对于软连接: 删除源文件会导致软连接找不到源文件(报错);

#### 例5: 使用stat查看文件元数据

```bash
[root@490de829cb74 ~]# stat /etc/profile
  File: `/etc/profile'
  Size: 1841      	Blocks: 8          IO Block: 4096   regular file
Device: 39h/57d	Inode: 1574688     Links: 1
Access: (0644/-rw-r--r--)  Uid: (    0/    root)   Gid: (    0/    root)
Access: 2017-03-21 21:56:32.000000000 +0000
Modify: 2017-03-21 21:56:32.000000000 +0000
Change: 2020-04-05 00:14:07.064959260 +0000
```

-   Access: 读取文件时更新
-   Modify: 修改文件内容时更新
-   Change: 修改元数据(文件权限, 归属等)或者原文件时都会更新

#### 例6: 使用touch刷新文件时间

```bash
[root@490de829cb74 ~]# stat profile
  File: `profile'
  Size: 1841      	Blocks: 8          IO Block: 4096   regular file
Device: 39h/57d	Inode: 1966559     Links: 2
Access: (0644/-rw-r--r--)  Uid: (    0/    root)   Gid: (    0/    root)
Access: 2020-04-05 12:55:17.694947217 +0000
Modify: 2020-04-05 12:55:17.694947217 +0000
Change: 2020-04-05 12:57:29.427842303 +0000
[root@490de829cb74 ~]# touch profile
[root@490de829cb74 ~]# stat profile
  File: `profile'
  Size: 1841      	Blocks: 8          IO Block: 4096   regular file
Device: 39h/57d	Inode: 1966559     Links: 2
Access: (0644/-rw-r--r--)  Uid: (    0/    root)   Gid: (    0/    root)
Access: 2020-04-05 13:19:54.589350836 +0000
Modify: 2020-04-05 13:19:54.589350836 +0000
Change: 2020-04-05 13:19:54.589350836 +0000
```

<br/>

### 文件预览命令

#### cat命令

**说明:** 读取文件内容(输入流), 并将文件全部内容输出到标准输出流;

**使用:** cat + 文件名(输入流)

****

#### more

**使用:** more + 文件名(输入流)

**使用空格可以向下(在结尾退出)[不可以反复查看]**

****

#### less

**使用:** less + 文件名(输入流)

使用空格可以向下, 使用b可以向上

><br/>
>
>**建议:**
>
><font color="#f00">**当文件较大时推荐使用more**</font>
>
><font color="#f00">**相对于less, more的资源消耗更小**</font>

****

#### head

**使用:** head + 文件名(输入流)

默认显示文件的前十行, 并直接退出

例: 指定前n行

```bash
[root@490de829cb74 ~]# head -3 profile
# /etc/profile

# System wide environment and startup programs, for login setup
```

****

#### tail

**使用:** tail + 文件名(输入流)

默认显示文件的后十行, 并直接退出

例1: 指定后n行

```bash
[root@490de829cb74 ~]# tail -3 profile

unset i
unset -f pathmunge
```

例2: 使用`tail -f file`实时追踪文件变化

```bash
[root@490de829cb74 ~]# tail -f profile
        if [ "${-#*i}" != "$-" ]; then
            . "$i"
        else
            . "$i" >/dev/null 2>&1
        fi
    fi
done

unset i
unset -f pathmunge

```

**此时shell会阻塞; 其他人的修改会被感知;**

><br/>
>
><font color="#f00">**此命令非常常用! 常用于查看错误日志!**</font>

****

### 管道

使用`|`将管道前的输出作为后一个命令的输入;

例: 输出文件的3~5行

```bash
[root@490de829cb74 ~]# head -5 profile | tail -3 
# System wide environment and startup programs, for login setup
# Functions and aliases go in /etc/bashrc

```

><br/>
>
>**注:**
>
><font color="#f00">**管道是将前一个命令的输出流放入下一个命令的输入流;**</font>
>
><font color="#f00">**流被使用的前提是后一个命令会对输入流操作**</font>
>
>例:
>
>```bash
>[root@490de829cb74 ~]# echo "/" | ls -l
>total 32
>-rw------- 1 root root 2433 Apr  6  2017 anaconda-ks.cfg
>-rw-r--r-- 1 root root 7242 Apr  6  2017 install.log
>-rw-r--r-- 1 root root 1680 Apr  6  2017 install.log.syslog
>-rwxr-xr-x 1 root root 6742 Apr  5 12:55 network
>-rw-r--r-- 2 root root 1841 Apr  5 13:19 profile
>-rw-r--r-- 2 root root 1841 Apr  5 13:19 profile.hardlink
>lrwxrwxrwx 1 root root    7 Apr  5 13:05 profile.softlink -> profile
>```
>
>上面的例子并没有输出`ls -l /`;
>
>**原因是ls不会对输入流响应!**

<br/>