---
title: Linux软件安装
cover: http://api.mtyqx.cn/api/random.php?44
date: 2020-04-06 12:27:04
categories: Linux
toc: true
tags: [Linux]
description: 本文总结了在Linux中一些软件安装的方法
---

本文总结了在Linux中一些软件安装的方法

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## Linux软件安装

在Linux中安装有三种方式:

-   **源码编译安装;**
-   **rpm安装: 包;**
-   **yum/apt安装: 仓库;**

### 源码编译

通过获取程序的源代码, 自己手动编译生成二进制可执行程序;

#### 弊端

需要安装源代码对应的编译器;

#### 使用场景

需要自己修改源代码, 对软件功能进行个性化定制;

<br/>

#### 例: 源码安装tengine

**① 下载tengine源码**

使用curl下载源码压缩包:

```bash
curl -o tengine-2.3.2.tar.gz http://tengine.taobao.org/download/tengine-2.3.2.tar.gz
```

****

**② 解压缩**

使用tar命令解压缩(到/opt/目录下):

```bash
$ tar -zxvf tengine-2.3.2.tar.gz -C /opt/

$ ll
-rw-rw-r--  1 root root    889 Sep  5  2019 AUTHORS.te
drwxrwxr-x  6 root root   4096 Sep  5  2019 auto
-rw-rw-r--  1 root root 298825 Sep  5  2019 CHANGES
-rw-rw-r--  1 root root  25609 Sep  5  2019 CHANGES.cn
-rw-rw-r--  1 root root  32748 Sep  5  2019 CHANGES.te
drwxrwxr-x  2 root root   4096 Sep  5  2019 conf
-rwxrwxr-x  1 root root   2502 Sep  5  2019 configure
drwxrwxr-x  4 root root   4096 Sep  5  2019 contrib
drwxrwxr-x  4 root root   4096 Sep  5  2019 docs
drwxrwxr-x  2 root root   4096 Sep  5  2019 html
-rw-rw-r--  1 root root   1715 Sep  5  2019 LICENSE
drwxrwxr-x  2 root root   4096 Sep  5  2019 man
drwxrwxr-x 26 root root   4096 Sep  5  2019 modules
drwxrwxr-x  3 root root   4096 Sep  5  2019 packages
-rw-rw-r--  1 root root   3421 Sep  5  2019 README.markdown
drwxrwxr-x 10 root root   4096 Sep  5  2019 src
drwxrwxr-x  4 root root   4096 Sep  5  2019 tests
-rw-rw-r--  1 root root     43 Sep  5  2019 THANKS.te
```

****

**③ 个性化配置**

解压缩后的源代码中尚不存在makefile文件. 通过README文件可知, 需要先执行`./configure`命令进行

```bash
$ cat README.markdown 
......

Installation

Tengine can be downloaded at [http://tengine.taobao.org/download/tengine.tar.gz](http://tengine.taobao.org/download/tengine.tar.gz). You can also checkout the latest source code from GitHub at [https://github.com/alibaba/tengine](https://github.com/alibaba/tengine)

To install Tengine, just follow these three steps:

    $ ./configure
    $ make
    # make install

By default, it will be installed to _/usr/local/nginx_. You can use the __'--prefix'__ option to specify the root directory.
If you want to know all the _'configure'_ options, you should run __'./configure --help'__ for help.
......
```

使用`./configure`命令配置安装目录;

```bash
$ ./configure --help | more

  --help                             print this message

  --prefix=PATH                      set installation prefix
  --sbin-path=PATH                   set nginx binary pathname

  --with-http_ssl_module             enable ngx_http_ssl_module
  --with-http_v2_module              enable ngx_http_v2_module
  --with-http_realip_module          enable ngx_http_realip_module
......

$ ./configure --prefix=/opt/nginx
checking for OS
 + Linux 5.3.0-45-generic x86_64
checking for C compiler ... not found

./configure: error: C compiler cc is not found
```

经上面提示未找到C语言编译器, 所以还需要安装GCC

```bash
$ yum install gcc
```

再次执行`./configure --prefix=/opt/nginx`, 结果提示:

```bash
......
checking for PCRE library in /usr/include/pcre/ ... not found
checking for PCRE library in /usr/pkg/ ... not found
checking for PCRE library in /opt/local/ ... not found

./configure: error: the HTTP rewrite module requires the PCRE library.
You can either disable the module by using --without-http_rewrite_module
option, or install the PCRE library into the system, or build the PCRE library
statically from the source with nginx by using --with-pcre=<path> option.
```

缺少PCRE library. 安装:

```bash
[root@490de829cb74 tengine-2.3.2]# yum search pcre
Loaded plugins: fastestmirror, ovl
Loading mirror speeds from cached hostfile
 * base: mirrors.aliyun.com
 * extras: mirrors.aliyun.com
 * updates: mirrors.aliyun.com
=========================================== N/S Matched: pcre ===========================================
pcre-devel.i686 : Development files for pcre
pcre-devel.x86_64 : Development files for pcre
pcre-static.x86_64 : Static library for pcre
pcre.i686 : Perl-compatible regular expression library
pcre.x86_64 : Perl-compatible regular expression library

  Name and summary matches only, use "search all" for everything.
[root@490de829cb74 tengine-2.3.2]# yum install pcre-devel
Loaded plugins: fastestmirror, ovl
Setting up Install Process
Loading mirror speeds from cached hostfile
 * base: mirrors.aliyun.com
 * extras: mirrors.aliyun.com
 * updates: mirrors.aliyun.com
Resolving Dependencies
--> Running transaction check
---> Package pcre-devel.x86_64 0:7.8-7.el6 will be installed
--> Finished Dependency Resolution

Dependencies Resolved

=========================================================================================================
 Package                    Arch                   Version                    Repository            Size
=========================================================================================================
Installing:
 pcre-devel                 x86_64                 7.8-7.el6                  base                 320 k

Transaction Summary
=========================================================================================================
Install       1 Package(s)

Total download size: 320 k
Installed size: 957 k
Is this ok [y/N]: y
Downloading Packages:
pcre-devel-7.8-7.el6.x86_64.rpm                                                   | 320 kB     00:00     
Running rpm_check_debug
Running Transaction Test
Transaction Test Succeeded
Running Transaction
  Installing : pcre-devel-7.8-7.el6.x86_64                                                           1/1 
  Verifying  : pcre-devel-7.8-7.el6.x86_64                                                           1/1 

Installed:
  pcre-devel.x86_64 0:7.8-7.el6                                                                          

Complete!
```

首先使用yum search寻找pcre库, 发现有多个;

**而使用yum install pcre-devel时会自动进行匹配**

安装结束再次执行`./configure --prefix=/opt/nginx`, 结果提示:

```
......
./configure: error: SSL modules require the OpenSSL library.
You can either do not enable the modules, or install the OpenSSL library
into the system, or build the OpenSSL library statically from the source
with nginx by using --with-openssl=<path> option.
```

缺少SSL模块.

使用`yum install openssl-devel`安装SSL模块;

至此tengine的外部依赖安装完毕!

再次执行`./configure --prefix=/opt/nginx`, 即创建了Makefile文件!

><br/>
>
>**说明:**
>
>在执行`./configure --prefix=/opt/nginx`时, 实际上是针对安装过程进行预处理;
>
>即: 对生成的Makefile文件进行配置

****

**④ 使用Makefile文件**

```bash
$ cat Makefile

default:	build

clean:
	rm -rf Makefile objs

build:
	$(MAKE) -f objs/Makefile

install:
	$(MAKE) -f objs/Makefile install

.PHONY: modules
modules:
	$(MAKE) -f objs/Makefile modules

upgrade:
	/opt/nginx/sbin/nginx -t

	kill -USR2 `cat /opt/nginx/logs/nginx.pid`
	sleep 1
	test -f /opt/nginx/logs/nginx.pid.oldbin

	kill -QUIT `cat /opt/nginx/logs/nginx.pid.oldbin`
```

可见Makefile中分为clean, build, install等模块;(默认为build模块)

在看Makefile实际上指向了objs目录下的Makefile, 而此文件才真正的处理编译等过程;

使用make命令进行编译, 并使用make install进行安装;

```bash
$ make
......
$ make install
......
```

make是编译的过程, 最终生成了二进制文件;

**(make后接参数, 如果不接默认为build, 即编译)**

而make install是安装的过程**(实际上就是使用cp命令进行拷贝);**

****

**⑤ 测试安装结果**

进入`/opt/nginx/sbin`目录, 执行`./nginx`即可启动nginx;

打开浏览器, 可以看到Tengine页面, 即安装成功!

停止tengine:

```bash
[root@490de829cb74 sbin]# ./nginx -s stop
```

<br/>

### RPM安装

Redhat提供了RPM(Redhat Package Manager)管理体系;

 **每个rpm包保存的是已经编译的软件包(针对不同平台提供不同的rpm包);**

#### 特点

通过rpm安装的软件包**可以由操作系统维护其安装信息**(类似于windows添加删除程序);

#### 弊端

软件包包含依赖检测, 但是其中的依赖还需要人为解决**(rpm包本身不包括其他依赖)**

#### 例:使用rpm包安装JDK

首先在可以在oracle官网下载对应版本的rpm包;

```bash
[root@490de829cb74 opt]# ll
-rw-r--r--  1 root root 162162296 Apr  6 05:58 jdk-11.0.6_linux-x64_bin.rpm
```

然后使用rpm命令安装:

```bash
[root@490de829cb74 opt]# rpm -ivh jdk-11.0.6_linux-x64_bin.rpm 
warning: jdk-11.0.6_linux-x64_bin.rpm: Header V3 RSA/SHA256 Signature, key ID ec551f03: NOKEY
Preparing...                ########################################### [100%]
   1:jdk-11.0.6             ########################################### [100%]
```

其中:

-   `i`: install安装;
-   `v&h`: 显示安装信息

><br/>
>
>**rpm其他命令:**
>
>-   **升级**
>    -   `-Uvh`
>    -   `Fvh`
>-   **卸载**
>    -   `-e PACKAGE_NAME`

****

#### rpm查询

| **命令**                       | 说明                                                         |
| ------------------------------ | ------------------------------------------------------------ |
| rpm -qa                        | 查询已经安装的所有包                                         |
| rpm -q PACKAGE_NAME            | 查询指定的包是否已经安装                                     |
| rpm -qi PACKAGE_NAME           | 查询指定包的说明信息                                         |
| rpm -ql PACKAGE_NAME           | 查询指定包安装后生成的文件列表                               |
| rpm -qc PACKAGE_NAME           | 查询指定包安装的配置文件                                     |
| rpm -qd PACKAGE_NAME           | 查询指定包安装的帮助文件                                     |
| rpm -q –scripts PACKAGE_NAME   | 查询指定包中包含的脚本                                       |
| rpm -qf /path/to/somefile      | 查询文件是由哪个rpm包安装生成的(反向查询)                    |
| rpm -qpi /path/to/PACKAGE_FILE | 如果rpm包**尚未安装**<br />查询其说明信息和安装以后会生成的文件 |

例1: 查询jdk已经安装

```bash
[root@490de829cb74 opt]# rpm -qa
setup-2.8.14-23.el6.noarch
basesystem-10.0-4.el6.noarch
bash-4.1.2-48.el6.x86_64
libcap-2.16-5.5.el6.x86_64
info-4.13a-8.el6.x86_64
libsepol-2.0.41-4.el6.x86_64
chkconfig-1.3.49.5-1.el6.x86_64
audit-libs-2.4.5-6.el6.x86_64
readline-6.0-4.el6.x86_64

[root@490de829cb74 opt]# rpm -qa | grep jdk
jdk-11.0.6-11.0.6-ga.x86_64
```

****

例2: 查询包信息

通过上一步可知, rpm的包名(PACKAGE_NAME)**[不是压缩文件名]**为`jdk-11.0.6-11.0.6-ga.x86_64`

所以可通过rpm进行查询

```bash
[root@490de829cb74 opt]# rpm -ql jdk-11.0.6-11.0.6-ga.x86_64
/usr
/usr/java
/usr/java/jdk-11.0.6
/usr/java/jdk-11.0.6/.java
/usr/java/jdk-11.0.6/.java/.systemPrefs
/usr/java/jdk-11.0.6/.java/.systemPrefs/.system.lock
/usr/java/jdk-11.0.6/.java/.systemPrefs/.systemRootModFile
/usr/java/jdk-11.0.6/.java/init.d
/usr/java/jdk-11.0.6/.java/init.d/jexec
/usr/java/jdk-11.0.6/README.html
......
```

****

例3: 使用rpm逆向查询包括命令的是哪个包

```bash
[root@490de829cb74 opt]# rpm -qf /sbin/ifconfig 
net-tools-1.60-114.el6.x86_64
```

>   <br/>
>
>   **注: 即使本机不存在此文件也可以做查询**
>
>   **因为会去rpm数据库查询**

<br/>

### YUM仓库安装

yum仓库是基于rpm包管理, 类似于Java中的Maven仓库; yum重点在于解决了rpm包的依赖管理问题.

在yum仓库中不仅存放着rpm包, 并且维护了一份依赖管理列表; 在进行安装时, 首先会检索所缺失的依赖; 然后将目标rpm包和依赖包一并传递并安装;

例如: 在CentOS镜像文件中不但包括packages(rpm仓库), 并且包括了repodata文件夹; 而repodata文件夹中存放的即是包的元数据信息;

><br/>
>
>**注:**
>
>在Ubuntu等Debian系统中, 是以apt作为包管理; 在python中以pip作为包管理;
>
>**但是他们的原理都是类似的!**

<br/>

#### 原理

在使用yum命令时, 首先会将rpm包的元数据下载回来;

然后在本地推算本机还需要的依赖关系;

然后再从yum仓库下载各个rpm包;

<br/>

#### 弊端

在国内使用yum安装一些文件时, 由于yum的服务器可能在国外; 所以可能会导致下载速度极慢, 甚至无法访问等情况;

此时需要设置yum的仓库源, 如阿里云等;

**配置文件在`/etc/yum.repos.d/`目录下**

可用的yum仓库有:

baseUrl=

-   `http://xxx`
-   `file://`
-   `ftp://`

**即yum仓库不仅可以是互联网仓库, 也可以是ftp服务器, 甚至是本地文件仓库!** 

<br/>

#### 命令

-   基本命令
    -   `yum repolist`
    -   `yum clean all`
    -   `yum makecache`
    -   `yum update`
-   查询
    -   `yum list`
    -   `yum search`
    -   `yum info`
-   安装&卸载
    -   `yum install`
    -   `yum remove/erase`
-   分组
    -   `yum grouplist`
    -   `yum groupinfo`
    -   `yum groupinstall`
    -   `yum groupremove`
    -   `yum groupupdate`

例1: 查询安装的yum组

```bash
[root@490de829cb74 ~]# yum grouplist
Loaded plugins: fastestmirror, ovl
Setting up Group Process
Loading mirror speeds from cached hostfile
 * base: mirrors.aliyun.com
 * extras: mirrors.aliyun.com
 * updates: mirrors.aliyun.com
Installed Groups:
   Additional Development
   Security Tools
Available Groups:
   Backup Client
   Backup Server
   Base
   CIFS file server
   Client management tools
......
```

例2: 使用yum组安装中文支持

```bash
[root@490de829cb74 ~]# yum groupinstall "Chinese Support"
```

然后修改环境变量`$LANG`

```bash
[root@490de829cb74 ~]# echo $LANG
en_US.UTF-8

[root@490de829cb74 ~]# LANG=zh_CN.UTF-8
```

<br/>