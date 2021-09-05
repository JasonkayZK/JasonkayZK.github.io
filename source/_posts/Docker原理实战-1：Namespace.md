---
title: Docker原理实战-1：Namespace
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?1'
date: 2021-08-29 20:26:12
categories: Docker
tags: [Docker, Linux, Namespace]
description: 讲述Docker底层原理的开篇文章，本文讲述了Linux内核中的Namespace和Docker的关系；
---

讲述Docker底层原理的开篇文章，本文讲述了Linux内核中的Namespace和Docker的关系；

系列文章：

-   [Docker原理实战-1：Namespace](/2021/08/29/Docker原理实战-1：Namespace/)
-   [Docker原理实战-2：Cgroups](/2021/08/29/Docker原理实战-2：Cgroups/)
-   [Docker原理实战-3：UnionFS](/2021/08/29/Docker原理实战-3：UnionFS/)
-   [Docker原理实战-4：容器Container](/2021/09/05/Docker原理实战-4：容器Container/)

源代码：

-   https://github.com/JasonkayZK/my_docker

<br/>

<!--more-->

# **Docker原理实战-1：Namespace**

## **前言 - 实验环境**

在讲述Docker底层原理之前，先说一下实验的环境吧；

操作系统Ubuntu：

```bash
root@jasonkay:~# lsb_release -a
No LSB modules are available.
Distributor ID: Ubuntu
Description:    Ubuntu 20.04.2 LTS
Release:        20.04
Codename:       focal
```

Linux内核版本：

```bash
root@jasonkay:~# uname -a
Linux jasonkay 5.4.0-81-generic #91-Ubuntu SMP Thu Jul 15 19:09:17 UTC 2021 x86_64 x86_64 x86_64 GNU/Linux
```

Docker版本：

```bash
root@jasonkay:~# docker version
Client: Docker Engine - Community
 Version:           20.10.8
 API version:       1.41
 Go version:        go1.16.6
 Git commit:        3967b7d
 Built:             Fri Jul 30 19:54:27 2021
 OS/Arch:           linux/amd64
 Context:           default
 Experimental:      true

Server: Docker Engine - Community
 Engine:
  Version:          20.10.8
  API version:      1.41 (minimum version 1.12)
  Go version:       go1.16.6
  Git commit:       75249d8
  Built:            Fri Jul 30 19:52:33 2021
  OS/Arch:          linux/amd64
  Experimental:     false
 containerd:
  Version:          1.4.9
  GitCommit:        e25210fe30a0a703442421b0f60afac609f950a3
 runc:
  Version:          1.0.1
  GitCommit:        v1.0.1-0-g4144b63
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0
```

Golang版本：

```bash
root@jasonkay:~# go version
go version go1.17 linux/amd64
```

基本上都是目前（2021年08月29日）最新的了！

废话不多说，直接进入正题；

本文作为讲述Docker底层原理的开篇，先来讲述 Docker 实现容器隔离的技术：Namespace；

<br/>

## **Linux Namespace**

Namespace是Linux Kernel中的一个功能，便于隔离一系列的系统资源，如：

-   PID；
-   User ID；
-   Network；
-   ……

>   **Namespace和chroot命令有些类似，但是比chroot强大的多！**
>
>   关于chroot：
>
>   -   [Linux中的chroot命令](/2021/06/26/Linux中的chroot命令/)

>   **用途：**
>
>   例如：Namespace可以做到UID级别的隔离，即：以UID为n的用户，虚拟化出来一个Namespace，在这个Namespace中，用户具有root权限！（但是在真实的物理机器上，他还是UID为n的用户！）

命令空间建立起系统不同的视图，从用户的角度来看：

每一个命名空间都如同一台单独的Linux计算机一样，有自己的init进程（PID为1），其他进程的PID依次递增！

例如下图：

![](https://cdn.jsdelivr.net/gh/jasonkayzk/my_docker@master/chapter2_basic/images/namespace-1.png)

A和B空间均存在PID为1的init进程，子命名空间的进程映射至父命名空间的进程上；

因此：**父命名空间可以知道每个子命名空间的运行状态，而子命名空间之间是相互隔离的！**

目前，Linux一共实现了6种不同类型的Namespace：

| **Namespace类型** | **系统调用参数** | **内核版本** |
| ----------------- | ---------------- | ------------ |
| Mount Namespace   | CLONE_NEWNS      | 2.4.19       |
| UTS Namespace     | CLONE_NEWUTS     | 2.6.19       |
| IPC Namespace     | CLONE_NEWIPC     | 2.6.19       |
| PID Namespace     | CLONE_NEWPID     | 2.6.24       |
| Network Namespace | CLONE_NEWNET     | 2.6.29       |
| User Namespace    | CLONE_NEWUSER    | 3.8          |

Namespace API主要使用以下三个系统调用：

-   clone()：创建新进程；根据调用参数来判断哪些类型的Namespace被创建，并且由他创建的子进程会被包含到这些Namespace中！
-   unshare()：将进程移出某个Namespace；
-   setns()：将进程加入到Namespace中；

<br/>

### **UTS Namespace**

`UTS Namespace` 用来隔离nodename和domainname两个系统标识；

**在UTS Namespace中，每个Namespace允许拥有自己的hostname！**

下面是代码：

chapter2_basic/namespace/uts_namespace_demo.go

```go
func main() {
	cmd := exec.Command("sh")
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWUTS,
	}
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}
}
```

代码解释：

-   `exec.Command("sh")`指定被fork出来的新进程内的初始命令`sh`；
-   使用`CLONE_NEWUTS`创建新的UTS命名空间并将`clone()`系统调用后的新的子进程加入；
-   `cmd.StdXXX = os.StdXXX`：当前进程和子进程输入输出流绑定；

运行代码：

```bash
root@jasonkay:~/workspace/my_docker/chapter2_basic# go run namespace/uts_namespace_demo.go 
#
```

进入一个sh运行环境中；

查看进程关系：

```bash
# pstree -pl
systemd(1)─┬─VGAuthService(843)
├─sshd(941)───sshd(1095)─┬─bash(4096)───go(15135)─┬─uts_namespace_d(15232)─┬─sh(15237)───pstree(15246)
           │                        │                        │                        ├─{uts_namespace_d}(15233)
           │                        │                        │                        ├─{uts_namespace_d}(15234)
           │                        │                        │                        ├─{uts_namespace_d}(15235)
           │                        │                        │                        └─{uts_namespace_d}(15236)
           │                        │                        ├─{go}(15136)
……

## 输出当前PID
# echo $$ 
15237
```

验证父子进程不在同一个UTS命名空间中：

```bash
# readlink /proc/15237/ns/uts
uts:[4026532644]
# readlink /proc/15232/ns/uts
uts:[4026531838]
```

可以看到，的确不在同一个UTS命名空间！

查看hostname：

```bash
# 查看hostname
# hostname
jasonkay

# 修改hostname
# hostname -b zk

# 再次查看hostname
# hostname
zk
```

在宿主机启动另一个Shell，并查看hostname：

```bash
root@jasonkay:~# hostname
jasonkay
```

可以看到：外部的hostname并没有被内部的修改所影响！

<br/>

### **IPC Namespace**

IPC命名空间用来隔离System V IPC和 POSIX message queues；

chapter2_basic/namespace/ipc_namespace_demo.go

```go
func main() {
	cmd := exec.Command("sh")
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWIPC,
	}
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}
}
```

代码增加了`CLONE_NEWIPC`，代表同时创建IPC命名空间；

下面进行测试（需要同时在宿主机上打开两个Shell）；

```bash
# 查询现有ipc message queues
root@jasonkay:~# ipcs -q

------ Message Queues --------
key        msqid      owner      perms      used-bytes   messages    

# 创建一个message queue
root@jasonkay:~# ipcmk -Q
Message queue id: 0

# 再次查看
root@jasonkay:~# ipcs -q

------ Message Queues --------
key        msqid      owner      perms      used-bytes   messages    
0x5336d6db 0          root       644        0            0           

```

此时已经存在一个queue了！

使用另外一个shell运行程序：

```bash
root@jasonkay:~/workspace/my_docker/chapter2_basic# go run namespace/ipc_namespace_demo.go 
# ipcs -q

------ Message Queues --------
key        msqid      owner      perms      used-bytes   messages    

```

可以发现，新的命名空间，看不到宿主机的消息队列！

<br/>

### **PID Namespace**

PID命名空间用来隔离进程ID：

**同一个进程在不同的PID命名空间可以拥有不同的PID！**

>   例如：
>
>   在Docker容器中使用`ps -ef`可以发现：容器内前台运行的进程PID为1，但是在容器外却是不同的PID；

代码如下：

chapter2_basic/namespace/pid_namespace_demo.go

```go
func main() {
	cmd := exec.Command("sh")
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWIPC | syscall.CLONE_NEWPID,
	}
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}
}
```

下面进行测试：

```bash
# 启动子进程 
root@jasonkay:~/workspace/my_docker/chapter2_basic# go run namespace/pid_namespace_demo.go 
#

# 宿主机查看
root@jasonkay:~# pstree -pl
systemd(1)─┬─VGAuthService(843)
          ├─sshd(941)───sshd(1095)─┬─bash(4096)───go(16024)─┬─pid_namespace_d(16119)─┬─sh(16124)
           │                        │                        │                        ├─{pid_namespace_d}(16120)
           │                        │                        │                        ├─{pid_namespace_d}(16121)
           │                        │                        │                        ├─{pid_namespace_d}(16122)
           │                        │                        │                        └─{pid_namespace_d}(16123)
           │                        │                        ├─{go}(16025)
……

# 容器内sh查看
# echo $$
1
```

可以看到，PID被映射到了1上；

>   **注：此时不能使用`ps`命令查看！**
>
>   **因为`ps`和`top`命令使用的是`/proc`中的内容，而此时我们没有修改挂载(Mount)命名空间！**

<br/>

### **Mount Namespace**

**Mount命名空间用来隔离各个进程看到的挂载点视图：**

**在不同的命名空间中的进程看到的文件系统层次是不同的，并且在新的Mount命名空间中调用`mount()`和`unmount`仅仅影响当前命名空间内的文件系统，而对全局的文件系统没有影响！**

>   **这个命名空间的功能类似于`chroot`，但是实现比这个系统调用更加灵活和安全！**

>   **Mount命名空间的系统调用参数为`NEWNS`；**
>
>   **这是因为，Mount命名空间是Linux第一个实现的命名空间类型，当时还没有意识到还有其他更多类型的命名空间出现！**

下面是代码：

chapter2_basic/namespace/mount_namespace_demo.go

```go
func main() {
	cmd := exec.Command("sh")
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWIPC |
			syscall.CLONE_NEWPID | syscall.CLONE_NEWNS,
	}
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}
}
```

首先运行代码，并查看`/proc`目录中的内容：

```bash
root@jasonkay:~/workspace/my_docker/chapter2_basic# go run namespace/mount_namespace_demo.go 
# ls /proc
1      130    144    163    2    272  310  331  4096  57    810   9441         iomem         pressure
10     1302   145    16385  20   273  311  332  41    58    812   951          ioports       sched_debug
10720  13095  146    164    206  274  312  333  413   582   813   957          irq           schedstat
1095   13098  147    16434  21   275  313  334  42    59    814   966          kallsyms      scsi
11     131    148    165    22   276  314  335  438   6     815   991          kcore         self
1100   13369  149    16522  23   277  315  336  44    60    839   acpi         keys          slabinfo
1102   13370  15     16527  24   278  316  337  45    64    843   asound       key-users     softirqs
11129  13384  150    16530  258  279  317  338  46    65    845   buddyinfo    kmsg          stat
117    134    151    166    259  28   318  339  47    66    877   bus          kpagecgroup   swaps
11713  135    152    167    26   280  319  34   478   67    879   cgroups      kpagecount    sys
118    137    153    168    260  281  32   35   479   6758  893   cmdline      kpageflags    sysrq-trigger
119    138    154    169    261  282  320  36   48    68    899   consoles     loadavg       sysvipc
12     13873  155    17     262  283  321  366  480   69    9     cpuinfo      locks         thread-self
12563  13874  156    172    263  284  322  38   50    786   901   crypto       mdstat        timer_list
12570  13875  157    173    264  285  323  384  51    787   907   devices      meminfo       tty
126    139    158    174    265  286  324  385  514   788   908   diskstats    misc          uptime
12608  14     159    175    266  287  325  387  52    789   909   dma          modules       version
127    140    16     176    267  29   326  388  521   790   920   driver       mounts        version_signature
1275   141    160    178    268  3    327  389  53    799   928   execdomains  mpt           vmallocinfo
128    14132  16013  179    269  30   328  39   538   800   9284  fb           mtrr          vmstat
1286   142    161    18     27   304  329  4    54    802   929   filesystems  net           zoneinfo
129    143    162    190    270  308  33   40   554   803   941   fs           pagetypeinfo
13     1432   16252  193    271  309  330  401  56    805   9440  interrupts   partitions
```

>   **`/proc`是一个文件系统，提供额外机制，通过内核和内核模块将信息发送给进程！**

此时`/proc`为宿主机的，因此看到里面会比较乱；

下面将`/proc` mount 至自己的Namespace下：

```bash
# mount -t proc proc /proc
# ls /proc
1          consoles     fb           kcore        locks    net           slabinfo       timer_list
5          cpuinfo      filesystems  keys         mdstat   pagetypeinfo  softirqs       tty
acpi       crypto       fs           key-users    meminfo  partitions    stat           uptime
asound     devices      interrupts   kmsg         misc     pressure      swaps          version
buddyinfo  diskstats    iomem        kpagecgroup  modules  sched_debug   sys            version_signature
bus        dma          ioports      kpagecount   mounts   schedstat     sysrq-trigger  vmallocinfo
cgroups    driver       irq          kpageflags   mpt      scsi          sysvipc        vmstat
cmdline    execdomains  kallsyms     loadavg      mtrr     self          thread-self    zoneinfo
```

可以看到少了非常多！

此时再使用`ps`查看系统进程：

```bash
# ps -ef
UID          PID    PPID  C STIME TTY          TIME CMD
root           1       0  0 20:36 pts/1    00:00:00 sh
root           6       1  0 20:40 pts/1    00:00:00 ps -ef
```

可以看到，当前命名空间中 sh 进程为PID为 1 的进程，而当前的 Mount命名空间和外部是隔离的！

>   **Docker Volumn也是利用了这个特性！**

>   <font color="#f00">**注：试验结束后，需要在容器中执行`umount /proc`取消挂载，否则会影响到外部挂载！**</font>
>
>   **（这是受`systemd`影响的！后面会介绍如何避免受影响！）**
>
>   ```bash
>   # umount /proc
>   # ls /proc
>   1      130    144    163    193  271  309  330  401   56    805   9440         interrupts    partitions
>   10     1302   145    164    2    272  310  331  4096  57    810   9441         iomem         pressure
>   10720  13095  146    16434  20   273  311  332  41    58    812   951          ioports       sched_debug
>   1095   13098  147    165    206  274  312  333  413   582   813   957          irq           schedstat
>   11     131    148    16522  21   275  313  334  42    59    814   966          kallsyms      scsi
>   1100   13369  149    16527  22   276  314  335  438   6     815   991          kcore         self
>   1102   13370  15     166    23   277  315  336  44    60    839   acpi         keys          slabinfo
>   11129  13384  150    167    24   278  316  337  45    64    843   asound       key-users     softirqs
>   117    134    151    16706  258  279  317  338  46    65    845   buddyinfo    kmsg          stat
>   11713  135    152    16716  259  28   318  339  47    66    877   bus          kpagecgroup   swaps
>   118    137    153    16755  26   280  319  34   478   67    879   cgroups      kpagecount    sys
>   119    138    154    168    260  281  32   35   479   6758  893   cmdline      kpageflags    sysrq-trigger
>   12     13873  155    169    261  282  320  36   48    68    899   consoles     loadavg       sysvipc
>   12563  13874  156    17     262  283  321  366  480   69    9     cpuinfo      locks         thread-self
>   12570  13875  157    172    263  284  322  38   50    786   901   crypto       mdstat        timer_list
>   126    139    158    173    264  285  323  384  51    787   907   devices      meminfo       tty
>   12608  14     159    174    265  286  324  385  514   788   908   diskstats    misc          uptime
>   127    140    16     175    266  287  325  387  52    789   909   dma          modules       version
>   1275   141    160    176    267  29   326  388  521   790   920   driver       mounts        version_signature
>   128    14132  16013  178    268  3    327  389  53    799   928   execdomains  mpt           vmallocinfo
>   1286   142    161    179    269  30   328  39   538   800   9284  fb           mtrr          vmstat
>   129    143    162    18     27   304  329  4    54    802   929   filesystems  net           zoneinfo
>   13     1432   16252  190    270  308  33   40   554   803   941   fs           pagetypeinfo
>   ```
>
>   umount后，挂载恢复！

<br/>

### **User Namespace**

User命名空间用于隔离用户的用户组，即：

**一个进程的UserId和GroupId在User命名空间内外可以是不同的！**

>   例如：
>
>   在宿主机上以一个非root用户创建一个User命名空间，而在User命名空间里面映射为root！

>   **注：在 Linux Kernel 3.8开始，非root进程也可以创建User命名空间了！**

代码如下：

chapter2_basic/namespace/user_namespace_demo.go

```go
func main() {
	cmd := exec.Command("sh")
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWIPC |
			syscall.CLONE_NEWPID | syscall.CLONE_NEWNS | syscall.CLONE_NEWUSER,
		/*
			以下两种情况，会导致UidMappings/GidMappings中设置了非当前进程所属UID和GID的相关数值：
			1. HostID非本进程所有（与Getuid()和Getgid()不等）
			2. Size大于1 （则肯定包含非当前进程的UID和GID）
			则需要Host机使用Root权限才能正常执行此段代码。

			Issue #3 error about User Namespace：
				https://github.com/xianlubird/mydocker/issues/3
		*/
		UidMappings: []syscall.SysProcIDMap{
			{
				ContainerID: 1,
				HostID:      syscall.Getuid(),
				Size:        1,
			},
		},
		GidMappings: []syscall.SysProcIDMap{
			{
				ContainerID: 1,
				HostID:      syscall.Getgid(),
				Size:        1,
			},
		},
	}

	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}

	os.Exit(-1)
}
```

**需要注意的是：这里配置了Uid和Gid的映射；**

>   **不同的操作系统可能要求是不同的，这里建议使用Ubuntu操作系统！**

下面进行测试：

```bash
# 宿主机查看当前用户和用户组
root@jasonkay:~# id
uid=0(root) gid=0(root) groups=0(root)
```

可以看到，此时是root用户；

运行程序：

```bash
root@jasonkay:~/workspace/my_docker/chapter2_basic# go run namespace/user_namespace_demo.go 
$ id
uid=1(daemon) gid=1(daemon) groups=1(daemon)
```

可以看到，他们的UID是不同的！

<br/>

### **Network Namespace**

Network命名空间用来隔离网络设备、IP地址等；

**Network命名空间可以让每个容器拥有自己独立的（虚拟）网络设备，并且容器内的应用可以绑定到自己的端口，并且不会冲突！**

代码如下：

chapter2_basic/namespace/network_namespace_demo.go

```go
func main() {
	cmd := exec.Command("sh")
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWIPC |
			syscall.CLONE_NEWPID | syscall.CLONE_NEWNS |
			syscall.CLONE_NEWUSER | syscall.CLONE_NEWNET,
		UidMappings: []syscall.SysProcIDMap{
			{
				ContainerID: 1,
				HostID:      syscall.Getuid(),
				Size:        1,
			},
		},
		GidMappings: []syscall.SysProcIDMap{
			{
				ContainerID: 1,
				HostID:      syscall.Getgid(),
				Size:        1,
			},
		},
	}

	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}

	os.Exit(-1)
}
```

首先，在宿主机查看网络设备：

```bash
root@jasonkay:~# ifconfig 
ens33: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.24.135  netmask 255.255.255.0  broadcast 192.168.24.255
        inet6 fe80::20c:29ff:fe4d:11db  prefixlen 64  scopeid 0x20<link>
        ether 00:0c:29:4d:11:db  txqueuelen 1000  (Ethernet)
        RX packets 980680  bytes 94756175 (94.7 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 1697074  bytes 2161080469 (2.1 GB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 1650  bytes 131668 (131.6 KB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 1650  bytes 131668 (131.6 KB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

运行程序，并在容器中查看：

```bash
root@jasonkay:~/workspace/my_docker/chapter2_basic# go run namespace/network_namespace_demo.go 
$ ifconfig
$
```

此时，容器中没有任何设备，即：容器和宿主机直接网络是隔离的！

<br/>

## **小结**

本篇作为开篇，讲述了Docker中容器隔离所依赖的技术 Namespace，主要包括六个部分：

-   UTS Namespace
-   IPC Namespace
-   PID Namespace
-   Mount Namespace
-   User Namespace
-   Network Namespace

下一篇将会介绍 Docker 和 K8S 中限制容器内硬件资源的技术：Cgroups；

<br/>

# **附录**

系列文章：

-   [Docker原理实战-1：Namespace](/2021/08/29/Docker原理实战-1：Namespace/)
-   [Docker原理实战-2：Cgroups](/2021/08/29/Docker原理实战-2：Cgroups/)
-   [Docker原理实战-3：UnionFS](/2021/08/29/Docker原理实战-3：UnionFS/)
-   [Docker原理实战-4：容器Container](/2021/09/05/Docker原理实战-4：容器Container/)

源代码：

-   https://github.com/JasonkayZK/my_docker


<br/>
