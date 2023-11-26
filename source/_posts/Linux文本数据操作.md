---
title: Linux文本数据操作
cover: https://img.paulzzh.com/touhou/random?22
date: 2020-04-05 21:58:35
categories: Linux
toc: true
tags: [Linux]
description: 本篇总结了一些简单的Linux相关的文本数据操作命令
---

本篇总结了一些简单的Linux相关的文本数据操作命令

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## Linux文本数据操作

### grep命令

**使用:** grep + pattern + 文件/输入流

**作用:** 输出匹配行

例1: 显示包含#的行

```bash
[root@490de829cb74 ~]# grep '#' profile
# /etc/profile
# System wide environment and startup programs, for login setup
# Functions and aliases go in /etc/bashrc
# It's NOT a good idea to change this file unless you know what you
# are doing. It's much better to create a custom.sh shell script in
# /etc/profile.d/ to make custom changes to your environment, as this
# will prevent the need for merging in future updates.
        # ksh workaround
# Path manipulation
# By default, we want umask to get set. This sets it for login shell
# Current threshold for system reserved uid/gids is 200
# You could check uidgid reservation validity in
# /usr/share/doc/setup-*/uidgid file
        if [ "${-#*i}" != "$-" ]; then
```

例2: 显示不包含#的行(**使用-v进行反选**)

```bash
[root@490de829cb74 ~]# grep -v '#' profile
pathmunge () {
    case ":${PATH}:" in
        *:"$1":*)
            ;;
        *)
            if [ "$2" = "after" ] ; then
                PATH=$PATH:$1
            else
                PATH=$1:$PATH
            fi
    esac
}

if [ -x /usr/bin/id ]; then
    if [ -z "$EUID" ]; then
        EUID=`/usr/bin/id -u`
        UID=`/usr/bin/id -ru`
......
```

例3: 使用正则表达式匹配

```bash
[root@490de829cb74 ~]# cat grep.txt 
ooxx1212121212ooxx
ooxx 1212121212
oox 1212121212
1212 ooxx 1212
oo3xx
oo4xx
ooWxx
oomxx
$ooxx
oo1234xx
ooxyzxx

# 包括ooxx的行
[root@490de829cb74 ~]# grep -E "ooxx" grep.txt 
ooxx1212121212ooxx
ooxx 1212121212
1212 ooxx 1212
$ooxx
# ooxx开头的行
[root@490de829cb74 ~]# grep -E "^ooxx" grep.txt 
ooxx1212121212ooxx
ooxx 1212121212
# ooxx中间有一个数字的行
[root@490de829cb74 ~]# grep -E "oo[0-9]xx" grep.txt 
oo3xx
oo4xx
```

><br/>
>
>**说明:**
>
>在grep命令中, 默认是普通正则表达式.
>
>一般使用`-E regexp`来指定正则表达式(否则需要用`\+正则符合`来指定正则)

<br/>

### cut命令

**作用:** 显示切割的行数据

**指令:**

-   `f`: 选择显示的列
-   `s`: 不显示没有分隔符的行
-   `d`: 自定义分隔符

**cut命令是基于分隔符操作的;**

例:

```bash
# 源文件
[root@490de829cb74 ~]# cat grep.txt 
ooxx1212121212ooxx
ooxx 1212121212
oox 1212121212
1212 ooxx 1212
oo3xx
oo4xx
ooWxx
oomxx
$ooxx
oo1234xx
ooxyzxx

# 按照空格分隔, 并显示第一列
[root@490de829cb74 ~]# cut -d ' ' -f 1 grep.txt 
ooxx1212121212ooxx
ooxx
oox
1212
oo3xx
oo4xx
ooWxx
oomxx
$ooxx
oo1234xx
ooxyzxx

# 按照空格分隔, 只显示被分割的行(-s), 并显示第一列和第三列
[root@490de829cb74 ~]# cut -d ' ' -s -f 1,3  grep.txt 
ooxx
oox
1212 1212
```

<br/>

### sort命令

**作用:** 排序文件的行

**参数:**

-   `n`: 按照数值排序;
-   `r`: 倒叙;
-   `t`: 自定义分隔符
-   `k`: 选择排序列;
-   `u`: 合并相同行;
-   `f`: 忽略大小写

需要注意的是, 排序分为两种: 字典序和数值序;

在字典序时: 11 < 8;

在数值序时: 8 < 11;

**在sort命令中默认是按每一行, 按照字典序排序**

例:

```bash
# 源数据
[root@490de829cb74 ~]# cat sort.txt 
banana 12
apple 1
orange 9

# 默认按照每一行字典序排序
[root@490de829cb74 ~]# sort sort.txt 
apple 1
banana 12
orange 9

# 以空格分隔, 并使用第二行按照字典序排序
[root@490de829cb74 ~]# sort -t ' ' -k2 sort.txt 
apple 1
banana 12
orange 9

# 以空格分隔, 并使用第二行按照数值序排序
[root@490de829cb74 ~]# sort -t ' ' -k2 -n sort.txt 
apple 1
orange 9
banana 12
```

<br/>

### wc命令

**作用:** 统计文件字符(word count);

**参数:**

-   `-c`: 统计文件比特数
-   `-m`: 统计文件字符数
-   `-l`: 统计文件行数

查看帮助:

```bash
[root@490de829cb74 ~]# wc --help
Usage: wc [OPTION]... [FILE]...
  or:  wc [OPTION]... --files0-from=F
Print newline, word, and byte counts for each FILE, and a total line if
more than one FILE is specified.  With no FILE, or when FILE is -,
read standard input.
  -c, --bytes            print the byte counts
  -m, --chars            print the character counts
  -l, --lines            print the newline counts
      --files0-from=F    read input from the files specified by
                           NUL-terminated names in file F;
                           If F is - then read names from standard input
  -L, --max-line-length  print the length of the longest line
  -w, --words            print the word counts
      --help     display this help and exit
      --version  output version information and exit
```

例:

```bash
[root@490de829cb74 ~]# wc -l sort.txt 
3 sort.txt
[root@490de829cb74 ~]# cat sort.txt | wc -l 
3
```

<br/>

### sed命令

sed是一个行编辑器

**使用:** `sed [options] 'Address Command' file...`

**参数[options]:**

-   `-n`: 静默模式, 不再默认显示模式空间中的内容;
-   **`-i`: 直接修改原文件**
-   `-e Script`: 可以同时执行多个脚本
-   `-f`: 指定文件
-   `-r`: 使用扩展正则表达式

**命令[Command]:**

-   `d`: 删除符合条件的行
-   `p`: 显示符合条件的行
-   `a \string`: 在指定的行后面添加新的行, 内容为string
-   `i \string`: 在指定的行前面添加新行, 内容为string
-   `r FILE`: 将制定的文件内容添加到符合条件的行处
-   `w FILE`: 将地址指定的范围内的行另存至指定的文件中
-   `s /parttern / string/修饰符`: 查找并替换, 默认只替换每行中第一次被模式匹配到的字符串
    -   `g`: 行内全局替换
    -   `i`: 忽略字符大小写

**行编辑器[Address]:**

-   可以没有(全文)
-   给定范围
-   查找指定行`/str/`

例1:

```bash
# 原文件内容
[root@490de829cb74 ~]# cat sort.txt 
banana 12
apple 1
orange 9

# 使用sed命令, 在第一行(1)[Address] 后追加(a)[Command]字符串(\hello world)
[root@490de829cb74 ~]# sed "1a\hello world" sort.txt 
banana 12
hello world
apple 1
orange 9

# 命令没有使用-i, 所以不会改变原文件
[root@490de829cb74 ~]# cat sort.txt 
banana 12
apple 1
orange 9

# 使用-i命令写入原文件
[root@490de829cb74 ~]# sed -i "1a\hello world" sort.txt 
[root@490de829cb74 ~]# cat sort.txt 
banana 12
hello world
apple 1
orange 9

# 删除第二行
[root@490de829cb74 ~]# sed "2d" sort.txt 
banana 12
apple 1
orange 9

# 删除/apple/匹配的行
[root@490de829cb74 ~]# sed "/apple/d" sort.txt 
banana 12
hello world
orange 9

# 全文替换: hello -> nihao
[root@490de829cb74 ~]# sed "s@hello@nihao@" sort.txt 
banana 12
nihao world
apple 1
orange 9
```

例2: 修改inittab文件

```bash
[root@490de829cb74 ~]# cp /etc/inittab ~
[root@490de829cb74 ~]# cat inittab 
# inittab is only used by upstart for the default runlevel.
#
# ADDING OTHER CONFIGURATION HERE WILL HAVE NO EFFECT ON YOUR SYSTEM.
#
# System initialization is started by /etc/init/rcS.conf
#
# Individual runlevels are started by /etc/init/rc.conf
#
# Ctrl-Alt-Delete is handled by /etc/init/control-alt-delete.conf
#
# Terminal gettys are handled by /etc/init/tty.conf and /etc/init/serial.conf,
# with configuration in /etc/sysconfig/init.
#
# For information on how to write upstart event handlers, or how
# upstart works, see init(5), init(8), and initctl(8).
#
# Default runlevel. The runlevels used are:
#   0 - halt (Do NOT set initdefault to this)
#   1 - Single user mode
#   2 - Multiuser, without NFS (The same as 3, if you do not have networking)
#   3 - Full multiuser mode
#   4 - unused
#   5 - X11
#   6 - reboot (Do NOT set initdefault to this)
# 
id:3:initdefault:

# 把模式设置为5;
[root@490de829cb74 ~]# sed "s/\(id:\)[0-6]\(:initdefault:\)/\15\2/" inittab 
# inittab is only used by upstart for the default runlevel.
#
# ADDING OTHER CONFIGURATION HERE WILL HAVE NO EFFECT ON YOUR SYSTEM.
#
# System initialization is started by /etc/init/rcS.conf
#
# Individual runlevels are started by /etc/init/rc.conf
#
# Ctrl-Alt-Delete is handled by /etc/init/control-alt-delete.conf
#
# Terminal gettys are handled by /etc/init/tty.conf and /etc/init/serial.conf,
# with configuration in /etc/sysconfig/init.
#
# For information on how to write upstart event handlers, or how
# upstart works, see init(5), init(8), and initctl(8).
#
# Default runlevel. The runlevels used are:
#   0 - halt (Do NOT set initdefault to this)
#   1 - Single user mode
#   2 - Multiuser, without NFS (The same as 3, if you do not have networking)
#   3 - Full multiuser mode
#   4 - unused
#   5 - X11
#   6 - reboot (Do NOT set initdefault to this)
# 
id:5:initdefault:
```

><br/>
>
>**扩展: inittab文件作用**
>
>确定在操作系统启动时, 进入的是哪个模式;
>
>-   0-halt(Do Not set initdefault to this) 关机，请不要让默认init进程为0
>-   1-Single user mode 单用户模式(类似于windows的安全模式)
>-   2-Multiuser NFS 没有NFS的多用户模式
>-   3-Full multiuser mode 命令行模式
>-   4-unused 保留
>-   5-X11 (图形界面)
>-   6-reboot 重新启动
>
>默认为3: 默认运行级别，指系统启动后即命令行模式 
>
>由此可以看出，如果将initdefault指定为0或是6，将会出现开机后就关机和开机后就自动启动的情况。 

><br/>
>
>**小技巧:**
>
>可以扩展查找的范围, 但是只替换其中的一部分:
>
>对于`id:5:initdefault:`, 可以选择匹配整个字符串, 但是保留前后缀:
>
>`sed "s/\(id:\)[0-6]\(:initdefault:\)/\15\2/" inittab`
>
>其中:
>
>-   `s`为命令(省略了Address域, 即匹配全文)
>-   `/\(id:\)[0-6]\(:initdefault:\)/`: 匹配字符串, 使用小括号分组, 前一个分组为`id:`, 中间为[0-6], 后一个分组为`:initdefault:`
>-   `/\15\2/`: 替换字符串, 其中`\1, \2`代表第一个分组和第二个分组; 5表示不变;

<br/>

### awk命令

一个强大的文本分析工具;

相对于grep的查找, sed的编辑, awk在**对数据分析并生成报告**时显得更为强大;

简单来讲, awk就是将文件逐行的读入, 使用(空格, tab为默认)分隔符将每行切片, 切开的部分在进行各种分析处理;

**使用:** `awk -F '{pattern + action}' {filenames}`

**特点:**

-   支持自定义分隔符(-F参数)

-   支持正则

-   支持自定义变量, (例如: 数组(K-V对)a[1], a[tom], map[key]) 

-   支持内置变量

    | **变量名** | **意义**                               |
    | ---------- | -------------------------------------- |
    | ARGC       | 命令行参数个数                         |
    | ARGV       | 命令行参数排列                         |
    | ENVIRON    | 支持队列中系统环境变量的使用           |
    | FILENAME   | awk浏览的文件名                        |
    | FNR        | 浏览文件的记录数                       |
    | FS         | 设置输入域的分隔符, 等价于命令行-F选项 |
    | **NF**     | **浏览记录的域的个数**                 |
    | **NR**     | **已读的记录数**                       |
    | OFS        | 输出域分隔符                           |
    | ORS        | 输出记录分隔符                         |
    | RS         | 控制记录分隔符                         |

-   支持函数

    -   print
    -   split
    -   substr
    -   sub
    -   gsub

-   支持流程控制语句, 类C语言

    -   if
    -   while
    -   do/while
    -   for
    -   break
    -   continue

例1: 查询计算机中的全部用户

```bash
# 在/etc/passwd中一行代表一个用户信息
[root@490de829cb74 ~]# awk -F ':' '{print $1}' passwd  
root
bin
daemon
adm
lp
sync
shutdown
halt
mail
uucp
operator
games
gopher
ftp
nobody
vcsa
sshd
```

其中:

-   使用`-F`指定分隔符;
-   使用`{print $1}`指定打印每一行分隔符的第一列

><br/>
>
>**注: 必须使用单引号分隔命令**
>
><font color="#f00">**在Linux中shell是对`$`及其敏感的, 使用单引号包括可以避免字符串首先被shell解析(`$1`是给awk命令使用的)**</font>
>
>例如:
>
>```bash
>[root@490de829cb74 ~]# test=100
>[root@490de829cb74 ~]# echo "$test"
>100
>[root@490de829cb74 ~]# echo '$test'
>$test
>```

><br/>
>
>**扩展: /etc/passwd文件**
>
>账户信息文件;
>
>```bash
>[root@490de829cb74 ~]# cat passwd 
>root:x:0:0:root:/root:/bin/bash
>bin:x:1:1:bin:/bin:/sbin/nologin
>daemon:x:2:2:daemon:/sbin:/sbin/nologin
>adm:x:3:4:adm:/var/adm:/sbin/nologin
>lp:x:4:7:lp:/var/spool/lpd:/sbin/nologin
>sync:x:5:0:sync:/sbin:/bin/sync
>shutdown:x:6:0:shutdown:/sbin:/sbin/shutdown
>halt:x:7:0:halt:/sbin:/sbin/halt
>mail:x:8:12:mail:/var/spool/mail:/sbin/nologin
>uucp:x:10:14:uucp:/var/spool/uucp:/sbin/nologin
>operator:x:11:0:operator:/root:/sbin/nologin
>games:x:12:100:games:/usr/games:/sbin/nologin
>gopher:x:13:30:gopher:/var/gopher:/sbin/nologin
>ftp:x:14:50:FTP User:/var/ftp:/sbin/nologin
>nobody:x:99:99:Nobody:/:/sbin/nologin
>vcsa:x:69:69:virtual console memory owner:/dev:/sbin/nologin
>sshd:x:74:74:Privilege-separated SSH:/var/empty/sshd:/sbin/nologin
>```
>
>第一列: (root)用户名
>
>第二列: x(原来存放密码信息的位置)
>
>第三/四列: (0, 0)用户id和组id;
>
>第五列: (root)用户的描述信息;
>
>第六列: (/home)用户的家目录位置;
>
>第七列: (/bin/bash)用户登录之后的启动的交互程序
>
>**交互程序说明:**
>
>-   `/bin/bash或/sbin/bash`: 启动bash进行交互
>-   `/sbin/nologin`: **某些程序/服务在启动时必须分配一个用户, 进而这个程序继承这个用户对文件的权限;**

****

例2: 显示`/etc/passwd`的账户和对应的shell. 账户和shell之间使用tab分隔, 并且在所有行开始前添加列名`name, shell`, 在最后添加`blue, /bin/bash`

```bash
[root@490de829cb74 ~]# awk -F ':' 'BEGIN{ print "name\tshell" } {print $1 "\t" $7 } END{ print "blue\t/bin/bash"} ' passwd 
name	shell
root	/bin/bash
bin	/sbin/nologin
daemon	/sbin/nologin
adm	/sbin/nologin
lp	/sbin/nologin
sync	/bin/sync
shutdown	/sbin/shutdown
halt	/sbin/halt
mail	/sbin/nologin
uucp	/sbin/nologin
operator	/sbin/nologin
games	/sbin/nologin
gopher	/sbin/nologin
ftp	/sbin/nologin
nobody	/sbin/nologin
vcsa	/sbin/nologin
sshd	/sbin/nologin
blue	/bin/bash
```

`BIGIN`方法只会在执行开始前执行一次;

`END`方法只会在执行结束后执行一次;

****

例3: 搜索`/etc/passwd`有root关键字的行

```bash
[root@490de829cb74 ~]# awk -F ':' '/root/{print "/root/\t"$0}' passwd 
/root/	root:x:0:0:root:/root:/bin/bash
/root/	operator:x:11:0:operator:/root:/sbin/nologin
```

**说明:**

-   `$1`代表第一列;
-   `$0`代表整行;

****

例4: 一个awk中包括多个匿名函数

```bash
[root@490de829cb74 ~]# awk -F ':' '/root/{print "/root/\t"$0} {print $0}' passwd 
/root/	root:x:0:0:root:/root:/bin/bash
root:x:0:0:root:/root:/bin/bash
bin:x:1:1:bin:/bin:/sbin/nologin
daemon:x:2:2:daemon:/sbin:/sbin/nologin
adm:x:3:4:adm:/var/adm:/sbin/nologin
lp:x:4:7:lp:/var/spool/lpd:/sbin/nologin
sync:x:5:0:sync:/sbin:/bin/sync
shutdown:x:6:0:shutdown:/sbin:/sbin/shutdown
halt:x:7:0:halt:/sbin:/sbin/halt
mail:x:8:12:mail:/var/spool/mail:/sbin/nologin
uucp:x:10:14:uucp:/var/spool/uucp:/sbin/nologin
/root/	operator:x:11:0:operator:/root:/sbin/nologin
operator:x:11:0:operator:/root:/sbin/nologin
games:x:12:100:games:/usr/games:/sbin/nologin
gopher:x:13:30:gopher:/var/gopher:/sbin/nologin
ftp:x:14:50:FTP User:/var/ftp:/sbin/nologin
nobody:x:99:99:Nobody:/:/sbin/nologin
vcsa:x:69:69:virtual console memory owner:/dev:/sbin/nologin
sshd:x:74:74:Privilege-separated SSH:/var/empty/sshd:/sbin/nologin
```

可以看出awk是逐行处理文件的.

****

例5: 统计`/etc/passwd`文件中每一行的行号, 每一行的列数, 以及对应行的内容

```bash
[root@490de829cb74 ~]# awk -F ':' '{print NR"\t"NF"\t" $0}'  passwd 
1	7	root:x:0:0:root:/root:/bin/bash
2	7	bin:x:1:1:bin:/bin:/sbin/nologin
3	7	daemon:x:2:2:daemon:/sbin:/sbin/nologin
4	7	adm:x:3:4:adm:/var/adm:/sbin/nologin
5	7	lp:x:4:7:lp:/var/spool/lpd:/sbin/nologin
6	7	sync:x:5:0:sync:/sbin:/bin/sync
7	7	shutdown:x:6:0:shutdown:/sbin:/sbin/shutdown
8	7	halt:x:7:0:halt:/sbin:/sbin/halt
9	7	mail:x:8:12:mail:/var/spool/mail:/sbin/nologin
10	7	uucp:x:10:14:uucp:/var/spool/uucp:/sbin/nologin
11	7	operator:x:11:0:operator:/root:/sbin/nologin
12	7	games:x:12:100:games:/usr/games:/sbin/nologin
13	7	gopher:x:13:30:gopher:/var/gopher:/sbin/nologin
14	7	ftp:x:14:50:FTP User:/var/ftp:/sbin/nologin
15	7	nobody:x:99:99:Nobody:/:/sbin/nologin
16	7	vcsa:x:69:69:virtual console memory owner:/dev:/sbin/nologin
17	7	sshd:x:74:74:Privilege-separated SSH:/var/empty/sshd:/sbin/nologin
```

**NR: 处理的行数**

**NF: 浏览记录的域的个数**  

****

例6: 统计报表: 合计每个人1月份的工资;

```bash
[root@490de829cb74 ~]# cat awk.txt 
Tom 0 2012-12-11 cat 3000
John 1 2013-01-13 bike 1000
vivi 1 2013-01-18 car 2800
Tom 0 2013-01-20 cat 2500
John 1 2013-01-28 bike 3500

[root@490de829cb74 ~]# awk '{split($3,date, "-"); if(date[2]=="01"){name[$1]+=$5}} END{for(i in name){print i"\t"name[i]}}'  awk.txt 
vivi	2800
Tom	2500
John	4500
```

先使用`split($3,date, "-")`通过`-`拆分第三列并放入date数组;

然后判断是否为一月份, 满足条件将数据放入name数组;

最后在END方法遍历输出name数据;

<br/>

扩展: 表中0代表Manager, 1代表Worker; 输出关联查询结果

```bash
[root@490de829cb74 ~]# awk '{split($3,date, "-"); if(date[2]=="01"){name[$1]+=$5}; if($2=="0"){role[$1]="M"} else{role[$1]="W"} } END{for(i in name){print i"\t"name[i]"\t"role[i]}}'  awk.txt 
vivi	2800	W
Tom	2500	M
John	4500	W
```

生成name和role数组, 使用同样的索引即可

<br/>

