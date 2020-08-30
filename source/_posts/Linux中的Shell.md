---
title: Linux中的Shell
cover: http://api.mtyqx.cn/api/random.php?43
date: 2020-04-06 19:08:10
categories: Linux
tags: [Linux]
toc: true
description: 本文总结了Linux中关于Shell的一些基础知识
---


本文总结了Linux中关于Shell的一些基础知识

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## Linux中的Shell

在Linux的Shell编程中遵循`一切皆命令`

### 前言

shell中的bash本质上是一个解释器(启动器), 对于解释器来说, 输入可以是两种形式:

-   **用户交互输入**
-   **文本文件输入**

对于脚本文件而言(文本文件输入), 其本质是在文件首行声明执行所需要的解释器, 如:

-   `#!/bin/bash`
-   `#!/usr/bin/python`

<br/>

### 命令读取方式

在执行时bash会首先启动对应声明的解释器, 然后逐行处理脚本文件;

#### 例1: 在当前bash执行文件

```bash
# 创建一个txt文件
[root@490de829cb74 ~]# cat file.txt 
echo "Hello world"
echo $$
echo $test

[root@490de829cb74 ~]# echo $$
15

# 定义一个test变量
[root@490de829cb74 ~]# test=100
[root@490de829cb74 ~]# echo $test
100

# 使用source命令执行文件
[root@490de829cb74 ~]# source file.txt 
Hello world
15
100

# 使用.命令执行文件
[root@490de829cb74 ~]# . file.txt 
Hello world
15
100
```

><br/>
>
>**注:**
>
><font color="#f00">**使用`source`或者`.`来逐条执行文件中的命令时, 会在当前bash中执行, 所以他们的`$$`(进程ID是相同的!)**</font>

****

#### 例2: 在新的bash中读取文件执行

```bash
[root@490de829cb74 ~]# cat file.txt 
echo "Hello world"
echo $$
echo $test

[root@490de829cb74 ~]# echo $$
15

[root@490de829cb74 ~]# bash file.txt 
Hello world
45
# 空

```

**可见使用`bash`命令会创建一个新的bash, 并在新的bash中执行命令!**

同时:

**在新的bash中并未定义`test`变量, 所以`echo $test`为空**

****

#### 例3: 将文件声明为脚本, 并附上可执行权限

```bash
# 在文件头加入解释器声明
[root@490de829cb74 ~]# cat file.txt 
#!/bin/bash
echo "Hello world"
echo $$
echo $test

[root@490de829cb74 ~]# ./file.txt 
Hello world
51
# 空行
```

和使用`bash`命令执行类似, 在执行可执行文件时, 也会创建一个新的bash, 并在新的bash中逐行执行命令

<br/>

### 函数

在shell中也可以定义函数, 如下:

```bash
# 定义var1变量
[root@490de829cb74 ~]# var1=22

# 定义test函数
[root@490de829cb74 ~]# test() {
> echo $$
> echo "hello world"
> echo $var1
> }

# 使用test函数
[root@490de829cb74 ~]# test
15
hello world
22

# 查看test方法
[root@490de829cb74 ~]# type test
test is a function
test () 
{ 
    echo $$;
    echo "hello world";
    echo $var1
}
```

><br/>
>
>**注:**
>
>**在linux中一切皆命令; 在使用时直接使用函数名执行即可!**

<br/>

### IO重定向

首先, 重定向不是命令;

在Linux中每个程序启动时都会拿到自己对应的文件描述符(`/proc/$pid/fd`目录下), 如下:

```bash
[root@490de829cb74 fd]# ll
total 0
lrwx------ 1 root root 64 Apr  7 01:07 0 -> /dev/pts/1
lrwx------ 1 root root 64 Apr  7 01:07 1 -> /dev/pts/1
lrwx------ 1 root root 64 Apr  7 01:07 2 -> /dev/pts/1
lrwx------ 1 root root 64 Apr  7 01:48 255 -> /dev/pts/1
```

默认情况下, 每个程序都会有0, 1, 2描述符分别表示标准输入流, 标准输出流, 错误输出流;

而程序每多一个IO就会多一个文件描述符;

#### 输出流

**所以可以控制文件描述符的输出到不同的地方(IO重定向)**

例1: 控制`ls -l /`命令的标准输出到ls.txt文件中

```bash
[root@490de829cb74 ~]# ls -l / 1> ls.txt
[root@490de829cb74 ~]# cat ls.txt 
total 92
dr-xr-xr-x   1 root root 4096 Apr  5 01:05 bin
drwxr-xr-x   3 root root 4096 Apr  5 01:05 boot
drwxr-xr-x   5 root root  360 Apr  7 01:04 dev
drwxr-xr-x   1 root root 4096 Apr  6 06:09 etc
drwxr-xr-x   2 root root 4096 Sep 23  2011 home
dr-xr-xr-x   1 root root 4096 Apr  6 05:11 lib
dr-xr-xr-x   1 root root 4096 Apr  5 01:05 lib64
...
```

需要注意的是:

-   **`1`代表命令对应的文件描述符;**
-   **`>`代表覆盖写入;**
-   **`>>`代表追加写入;**
-   <font color="#f00">**重定向操作符和文件描述符之间不可存在空白符!**</font>

****

例2: 控制`ls -l /god/`命令的错误输出到ls.txt文件中

```bash
[root@490de829cb74 ~]# ls -l /god 2> ls_error.txt
[root@490de829cb74 ~]# cat ls_error.txt 
ls: cannot access /god: No such file or directory
```

****

例3: 同时对标准和错误输出重定向

```bash
# 写入不同文件
[root@490de829cb74 ~]# ls -l / /god 1>ls.txt 2>ls_error.txt
[root@490de829cb74 ~]# cat ls.txt 
/:
total 92
dr-xr-xr-x   1 root root 4096 Apr  5 01:05 bin
drwxr-xr-x   3 root root 4096 Apr  5 01:05 boot
drwxr-xr-x   5 root root  360 Apr  7 01:04 dev
drwxr-xr-x   1 root root 4096 Apr  6 06:09 etc
drwxr-xr-x   2 root root 4096 Sep 23  2011 home
......

[root@490de829cb74 ~]# cat ls_error.txt 
ls: cannot access /god: No such file or directory
```

****

例4: 文件描述符之间相互指向

```bash
# 标准输出流和错误输出流写入同一个文件
# 第一种方法(2输出到了屏幕)[错误]
[root@490de829cb74 ~]# ls -l / /god 2>& 1 1> ls_mix.txt
ls: cannot access /god: No such file or directory

# 第二种方法(2输出到了文件)[正确]
[root@490de829cb74 ~]# ls -l / /god 1> ls_mix.txt 2>& 1
[root@490de829cb74 ~]# cat ls_mix.txt 
ls: cannot access /god: No such file or directory
/:
total 92
dr-xr-xr-x   1 root root 4096 Apr  5 01:05 bin
drwxr-xr-x   3 root root 4096 Apr  5 01:05 boot
drwxr-xr-x   5 root root  360 Apr  7 01:04 dev
drwxr-xr-x   1 root root 4096 Apr  6 06:09 etc
......
```

在文件描述符之间相互切换流指向时, 需要使用`x>& y`

**因为如果只使用了`>`则会认为后面一个接的是文件名称!**

其次, 流的转换是有先后顺序的(从左到右)

**对于方法一:**

首先将错误输出流2指向了1(此时标准输入流1仍然指向的是屏幕!), 然后修改了标准输入流1指向文件ls_mix.txt.

所以最终ls_mix.txt中存放的是标准输入流1的输出, 而错误流2被输出到了屏幕;

**对于方法二:**

首先改变了标准输入流1指向文件, 然后再修改错误输出流2. 使得两个流的输出都指向了文件;

****

例5: 合并标准输出和错误输出流

```bash
[root@490de829cb74 ~]# ls -l / /god &> ls_mix.txt 
[root@490de829cb74 ~]# ls -l / /god >& ls_mix.txt 
[root@490de829cb74 ~]# cat ls_mix.txt 
ls: cannot access /god: No such file or directory
/:
total 92
dr-xr-xr-x   1 root root 4096 Apr  5 01:05 bin
drwxr-xr-x   3 root root 4096 Apr  5 01:05 boot
......
```

除了使用流转换以外, 可以使用`&>`或者`>&`合并标准输出和错误输出流;

<font color="#f00">**注: 此时流后应当接的是一个文件!**</font>

<br/>

#### read命令

**使用:** read + 变量名

**作用:** 使用read后会阻塞, 将输入的值复制给变量(换行结束)

例:

```bash
[root@490de829cb74 ~]# read test
12d12d312
[root@490de829cb74 ~]# echo $test
12d12d312
```

<br/>

#### 输入流

**① <<<**

`<<<`可以将右侧的数据输入到一个输入流文件描述符

例:

```bash
[root@490de829cb74 ~]# read test 0<<<"hello"
[root@490de829cb74 ~]# echo $test
hello
```

****

**② <<XXX**

`<<`右侧可以指定输入流边界标志位, 并且在开始和结束标志位之间的内容可以被转化为标准输入流

例:

```bash
# 在终端中
[root@490de829cb74 ~]# read test 0<<OOXX
> 12412345
> faqf13
> 123d12d
> OOXX
[root@490de829cb74 ~]# echo $test
12412345

# 写入文件中
[root@490de829cb74 ~]# cat test.txt 
cat <<OOXX
hello
nihao
bye
OOXX

[root@490de829cb74 ~]# source test.txt 
hello
nihao
bye
```

****

**③ <**

可以使用`0<`直接将一个文件输入, 如:

```bash
[root@490de829cb74 ~]# cat 0< test.txt 
cat <<OOXX
hello
nihao
bye
OOXX
```

显然, 没有什么实质性作用;

例: 使用IO流向百度发送HTTP请求

```bash
[root@490de829cb74 fd]# ll /proc/15/fd/
total 0
lrwx------ 1 root root 64 Apr  7 01:07 0 -> /dev/pts/1
lrwx------ 1 root root 64 Apr  7 01:07 1 -> /dev/pts/1
lrwx------ 1 root root 64 Apr  7 01:07 2 -> /dev/pts/1
lrwx------ 1 root root 64 Apr  7 01:48 255 -> /dev/pts/1

# 在当前bash创建一个标准的双向流(8号文件描述符)
[root@490de829cb74 fd]# exec 8<> /dev/tcp/www.baidu.com/80
[root@490de829cb74 fd]# ll /proc/15/fd/
total 0
lrwx------ 1 root root 64 Apr  7 01:07 0 -> /dev/pts/1
lrwx------ 1 root root 64 Apr  7 01:07 1 -> /dev/pts/1
lrwx------ 1 root root 64 Apr  7 01:07 2 -> /dev/pts/1
lrwx------ 1 root root 64 Apr  7 01:48 255 -> /dev/pts/1
lrwx------ 1 root root 64 Apr  7 01:07 8 -> socket:[273464]

# 通过文件输出流向8号文件描述符输出一个请求头(请求百度)
[root@490de829cb74 fd]# echo -e "GET / HTTP/1.1\n" 1>& 8

# 使用输入流重定向输出结果
[root@490de829cb74 fd]# cat 0<& 8
HTTP/1.1 200 OK
Accept-Ranges: bytes
Cache-Control: no-cache
Connection: keep-alive
Content-Length: 14615
Content-Type: text/html
Date: Tue, 07 Apr 2020 02:49:44 GMT

<!DOCTYPE html><!--STATUS OK-->
<html>
<head>
	<title>百度一下，你就知道</title>
	<link href="http://s1.bdstatic.com/r/www/cache/static/home/css/index.css" rel="stylesheet" type="text/css" />
	......
```

上面的例子中首先通过`exec 8<> /dev/tcp/www.baidu.com/80`创建了一个8号文件描述符, 且是一个双向流;

><br/>
>
>**注:**
>
><font color="#f00">**在`/dev/tcp/`中创建的文件描述符会触发内核机制, 最终创建了一个socket通信**</font>
>
>如:
>
>```bash
>[root@490de829cb74 fd]# ll /proc/15/fd/
>total 0
>lrwx------ 1 root root 64 Apr  7 01:07 0 -> /dev/pts/1
>lrwx------ 1 root root 64 Apr  7 01:07 1 -> /dev/pts/1
>lrwx------ 1 root root 64 Apr  7 01:07 2 -> /dev/pts/1
>lrwx------ 1 root root 64 Apr  7 01:48 255 -> /dev/pts/1
>lrwx------ 1 root root 64 Apr  7 01:07 8 -> socket:[273464]
>```

然后使用`echo -e "GET / HTTP/1.1\n" 1>& 8`将字符串输出流重定向到八号文件描述符(向百度发送请求头);

最后通过`cat 0<& 8`接收八号文件描述符的输入流(百度返回的响应), 最终拿到响应;

<br/>

### 变量参数

bash中提供的变量可以分为:

-   本地
-   局部
-   位置
-   特殊
-   环境

#### 本地变量

在当前shell中拥有, 并且变量的生命周期伴随shell.

例:

```bash
[root@490de829cb74 /]# name=god
[root@490de829cb74 /]# echo $name
god

# 在函数外定义的变量
[root@490de829cb74 /]# test=100
[root@490de829cb74 /]# func() {
> echo $test
> test=222
> }

# 执行函数
[root@490de829cb74 /]# func
100

# 在函数内也可以修改本地变量
[root@490de829cb74 /]# echo $test
222
```

****

#### 局部变量

在函数内部使用`local`定义的变量

例:

```bash
[root@490de829cb74 /]# func() {
> local inner=100
> }
[root@490de829cb74 /]# func
[root@490de829cb74 /]# echo $inner
# 空行
```

****

#### 位置变量

位置变量如: `$1, $2, ${11}`

位置变量可以出现在脚本或者函数中

****

#### 特殊变量

-   `$#`: 位置参数个数
-   `$*`: 参数列表, 双引号引用为一个字符串
-   `$@`: 参数列表, 双引号引用为单独的字符串
-   `$$`: 当前shell的PID(相当于命令接收者)
    -   `$BASHPID`: 真实
    -   管道
-   `$?`: 上一个命令退出状态
    -   `0`: 成功
    -   `other`: 失败

例1: 使用特殊变量取参数

```bash
[root@490de829cb74 /]# cat shell.sh 
echo $#
echo $*
echo $@

echo $1
echo $2
echo $11

[root@490de829cb74 /]# . shell.sh 1 2 3 4 5 6 7 8 9 0 a b 
12
1 2 3 4 5 6 7 8 9 0 a b
1 2 3 4 5 6 7 8 9 0 a b
1
2
11
```

>   <br/>
>
>   **注意:** `echo $11`打印的不是a, 而是11
>
>   这是因为: 实际上在解析的时候, 解析的是${1}1.
>
>   所以可以使用`${11}`取值
>
>   **标准取值应该使用`${xx}`取值**
>
>   例:
>
>   ```bash
>   [root@490de829cb74 /]# test=test
>   [root@490de829cb74 /]# echo $test
>   test
>   [root@490de829cb74 /]# echo $testgood
>   
>   [root@490de829cb74 /]# echo ${test}good
>   testgood
>   ```

<br/>

例2: `$$`与管道

>   <br/>
>
>   **管道:**
>
>   <font color="#f00">**在管道的两侧会开辟两个新的子bash分别去执行**</font>
>
>   如:
>
>   ```bash
>   [root@490de829cb74 /]# test=100
>   [root@490de829cb74 /]# echo $test
>   100
>   [root@490de829cb74 /]# test=200 | echo ok
>   ok
>   [root@490de829cb74 /]# echo $test
>   100
>   ```
>
>   **上面经过管道后, 相当于在子bash中改变了test的值为200, 而不会影响到父bash中的test变量的值**

在看下面的例子:

```bash
[root@490de829cb74 /]# echo $$
105
[root@490de829cb74 /]# echo $$ | cat
105

[root@490de829cb74 /]# echo $BASHPID
105
[root@490de829cb74 /]# echo $BASHPID | cat
134
```

对于`$BASHPID`可以看出管道的确创建了两个新的bash来执行;

但是为什么在子bash中, `echo $$`和父进程相同呢?

**这是由`$$`的优先级决定的:**

<font color="#f00">**在`echo $$ | cat`命令中, 由于`$$`的优先级高于管道, 所以`$$`会被首先替换为105, 然后再去执行管道命令**</font>

<font color="#f00">**而`$BASHPID`的优先级低于管道**</font>

****

#### 环境变量

**相关命令:**

-   set: 用来显示本地变量(包括当前用户的变量)
-   unset: 取消变量
-   env/printenv: 用来显示环境变量(显示当前用户的变量)
-   export: 用来显示和设置环境变量(显示当前导出成用户变量的shell变量)

>   <br/>
>
>   **更多**
>
>   每个shell有自己特有的变量（set）显示的变量，这个和用户变量是不同的，当前用户变量和你用什么shell无关，不管你用什么shell都在
>
>   比如HOME,SHELL等这些变量，但shell自己的变量不同shell是不同的，比如BASH_ARGC，  BASH等，这些变量只有set才会显示，是bash特有的
>
>   **export不加参数的时候，显示哪些变量被导出成了用户变量**，因为一个shell自己的变量可以通过export “导出”变成一个用户变量

<br/>

例1: 查看shell变量

```bash
[root@490de829cb74 /]# set
BASH=/bin/bash
BASHOPTS=checkwinsize:cmdhist:expand_aliases:extquote:force_fignore:hostcomplete:interactive_comments:progcomp:promptvars:sourcepath
BASHPID=105
BASH_ALIASES=()
BASH_ARGC=()
name=god
test=100
func () 
{ 
    local inner=100
}
......
```

<br/>

**可以使用export标示一个变量被导出;**

**被导出的变量在当前shell创建一个子shell时, 子shell可以访问这个被导出变量的值;**

例2: 使用export导出一个变量

```bash
[root@490de829cb74 ~]# test=100

# test变量未被导出
[root@490de829cb74 ~]# bash shell.sh 
hello
#空行

# test变量导出
[root@490de829cb74 ~]# export test
[root@490de829cb74 ~]# bash shell.sh 
hello
100
```

>   <br/>
>
>   **注: 此操作是导出, 而非父子shell共享变量**

****

#### 父子shell中的环境变量

由于子shell中可以获取到父shell中export的变量; 所以就有以下的问题:

-   在子shell中改变变量的值父shell中会变化吗?
-   在父shell中改变变量的值子shell中会变化吗?

**① 在子shell中修改值**

```bash
# 定义变量test=100
[root@490de829cb74 ~]# echo $test
100

# 运行的脚本
[root@490de829cb74 ~]# cat shell.sh 
echo "---------------"
echo $test
test=22222222
echo "---------------"
echo $test
sleep 20 #睡眠20秒
echo $test

# 脚本后台运行
[root@490de829cb74 ~]# bash shell.sh &
[1] 45
[root@490de829cb74 ~]# 
---------------
100 # 子shell输出100(获得了export的变量)
---------------
22222222 # 子shell中改变了值为2222222

# 子shell睡眠时父shell获取test值
# (此时子shell已经将值改为22222222)
[root@490de829cb74 ~]# echo $test
100 # 父shell还是100

# 子shell打印值, 并退出
[root@490de829cb74 ~]# 
22222222
[1]+  Done                    bash shell.sh

# 父shell的值仍为100
[root@490de829cb74 ~]# echo $test
100
```

**可见在子shell中对变量做出的任何修改在父shell中都是不可见的**

**(不会改变父shell中的值)**

<br/>

**② 在父shell中修改值**

```bash
# test值仍为100
[root@490de829cb74 ~]# echo $test
100

# 待执行shell脚本
[root@490de829cb74 ~]# cat shell.sh 
echo "---------------"
echo $test
test=22222222
echo "---------------"
echo $test
sleep 20
echo $test

# 后台执行脚本
[root@490de829cb74 ~]# bash shell.sh  &
[1] 53
---------------
100 # 子shell输出为100
---------------
22222222 # 修改后输出为22222222

# 在父shell中修改test的值为333
[root@490de829cb74 ~]# test=333

# 输出值为333
[root@490de829cb74 ~]# echo $test
333

# 子shell执行结束输出为22222222
[root@490de829cb74 ~]# 
22222222
[1]+  Done                    bash shell.sh
```

**可见在父shell中对变量做出的任何修改在子shell中也都是不可见的**

**(不会改变子shell中的值)**

<br/>

**总结:**

在Linux中使用内核中的fork()方法创建一个进程;

**在fork()函数创建子进程时, 不会将原父进程中的所有数据全部拷贝一遍(如果父进程中含有大量大对象效率相当慢), 而是创建一个引用指向父进程中的对象等数据;**

此时: 父变量->100<-子变量

**而在父shell改变变量值时, shell才会真正去创建这个变量, 并分配新的内存空间;**

此时: 父变量->200 子变量->100

**子shell变量值改变时同理;**

这样就保证了fork操作的效率, 同时保证了父子进程不可看到互相的改变;

<br/>

### 引用

#### 双引号引用

弱引用, **允许变量扩展(替换)**

如:

```bash
[root@490de829cb74 ~]# test=100
[root@490de829cb74 ~]# echo $test
100
[root@490de829cb74 ~]# echo "$test"
100
```

****

#### 单引号引用

强引用, **不允许变量替换, 不可嵌套**

如:

```bash
[root@490de829cb74 ~]# test=100
[root@490de829cb74 ~]# echo $test
100
[root@490de829cb74 ~]# echo '$test'
$test
```

><br/>
>
>**注1: 花括号扩展不能被引用**
>
>**注2: 命令执行前会删除引用符合**
>
>在shell中`'`和`"`是关键字, 在输出时不会输出. 如果想要输出, 需要转义, 如:
>
>```bash
>[root@490de829cb74 ~]# echo "$test"
>100
>[root@490de829cb74 ~]# echo "\"$test\""
>"100"
>```

****

#### 命令替换

在bash执行时, 首先会将一些变量等字符串进行替换, 如:

例1: 使用反引号做命令替换

```bash
# 执行下面的命令
[root@490de829cb74 ~]# var1=echo $test
bash: 100: command not found

# 由于命令是原子的, 所以var1未被赋值
[root@490de829cb74 ~]# echo $var1
# 空

# 使用反引号包括, 赋值成功
[root@490de829cb74 ~]# var1=`echo $test`
[root@490de829cb74 ~]# echo $var1
100
```

首先使用`var1=echo $test`命令时, 会认为`var1=echo`是一个赋值命令, 然后`$test`(100)是另一个命令;

所以在执行时首先将`$test1`替换为100, 然后将var1赋值为echo, 然后执行命令`100`, 未找到所以报错;

<font color="#f00">**此时由于shell执行命令是原子的, 所以输出var1的值为空**</font>

使用反引号包括后面语句则先执行了`echo $test`命令, 然后将结果赋值给var1;

除了使用反引号, 还可以使用`$(command)`

例2: 使用`${()`做命令替换

```bash
[root@490de829cb74 ~]# var2=$(echo $test)
[root@490de829cb74 ~]# echo $var2
100
```

<font color="#f00">**同时命令替换是可以嵌套的**</font>

例3: 使用嵌套的命令替换

```bash
[root@490de829cb74 ~]# var3=`echo $(echo $test)`
[root@490de829cb74 ~]# echo $var3
100
```

<br/>

### 命令退出状态

在shell中可以通过`$?`取得上一条命令的退出状态;

退出状态是一个数字，一般情况下，大部分命令执行成功会返回 0，失败返回其他;

例:

```bash
# 成功执行
[root@490de829cb74 ~]# ls -l /root
total 16
-rw------- 1 root root 2433 Apr  6  2017 anaconda-ks.cfg
-rw-r--r-- 1 root root 7242 Apr  6  2017 install.log
-rw-r--r-- 1 root root 1680 Apr  6  2017 install.log.syslog
[root@490de829cb74 ~]# echo $?
0

# 错误命令
[root@490de829cb74 ~]# ls -l /god
ls: cannot access /god: No such file or directory
[root@490de829cb74 ~]# echo $?
2
```

<br/>

### 表达式

#### 算术表达式

**① 使用let**

let命令可以计算算术运算表达式(可以使用`help let`查看)

例:

```bash
[root@490de829cb74 ~]# a=100
[root@490de829cb74 ~]# b=200

# 直接输出$a+$b
[root@490de829cb74 ~]# echo $a+$b
100+200

# 使用let
[root@490de829cb74 ~]# let c=$a+$b
[root@490de829cb74 ~]# echo $c
300
```

****

**② 使用`$[算术表达式]`计算**

例:

```bash
[root@490de829cb74 ~]# a=100
[root@490de829cb74 ~]# b=200
[root@490de829cb74 ~]# c=$[$a+$b]
[root@490de829cb74 ~]# echo $c
300
```

****

**③ 使用`$((算术表达式))`计算**

例:

```bash
[root@490de829cb74 ~]# a=100
[root@490de829cb74 ~]# b=200
[root@490de829cb74 ~]# c=$(($a+$b))
[root@490de829cb74 ~]# echo $c
300
```

<font color="#f00">**注: 使用两个小括号时, 其中的变量可以不加`$`符号**</font>

例2:

```bash
[root@490de829cb74 ~]# a=1
[root@490de829cb74 ~]# b=2
[root@490de829cb74 ~]# ((a++))
[root@490de829cb74 ~]# echo $a
2
[root@490de829cb74 ~]# c=$((a+b))
[root@490de829cb74 ~]# echo $c
4
```

****

**④ 使用expr计算**

使用expr命令也可以计算算术表达式, 需要注意的是:

<font color="#f00">**表达式中各个操作数和运算符之间必须要用空格, 且必须使用命令引用**</font>

例:

```bash
[root@490de829cb74 ~]# a=100
[root@490de829cb74 ~]# b=200

# 各个操作数和运算符之间未使用空格
[root@490de829cb74 ~]# c=`expr $a+$b`
[root@490de829cb74 ~]# echo $c
100+200

# # 各个操作数和运算符之间使用空格
[root@490de829cb74 ~]# c=`expr $a + $b`
[root@490de829cb74 ~]# echo $c
300
```

<br/>

#### 条件表达式

条件表达式的几种:

-   `[ expression ]`
-   `test expression`
-   `[[ expression ]]`

可以使用`help test`查看

例:

```bash
[root@490de829cb74 ~]# test 3 -gt 8
[root@490de829cb74 ~]# echo $?
1
[root@490de829cb74 ~]# test 3 -gt 2
[root@490de829cb74 ~]# echo $?
0
[root@490de829cb74 ~]# test 3 -gt 2 && echo ok
ok
[root@490de829cb74 ~]# test 3 -gt 8 && echo ok
# 无
```

例2: 使用`[ exp ]`

```bash
[root@490de829cb74 ~]# [ 3 -gt 2 ] && echo ok
ok

[root@490de829cb74 ~]# [ 3 -gt 8 ] && echo ok
# 无
```

<font color="#f00">**注: 在Linux中命令和参数之间必须添加空白符, 所以`[`后面必须增加空格!**</font>

<br/>



