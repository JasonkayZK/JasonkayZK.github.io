---
title: Docker原理实战-2：Cgroups
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?2'
date: 2021-08-29 20:26:44
categories: Docker
tags: [Docker, Linux, Cgroups]
description: 讲述Docker底层原理的第二篇文章，本文讲述了Docker和K8S中限制容器硬件资源的技术：Linux内核中的Cgroups；
---

讲述Docker底层原理的第二篇文章，本文讲述了Docker和K8S中限制容器硬件资源的技术：Linux内核中的Cgroups；

系列文章：

-   [Docker原理实战-1：Namespace](/2021/08/29/Docker原理实战-1：Namespace/)
-   [Docker原理实战-2：Cgroups](/2021/08/29/Docker原理实战-2：Cgroups/)
-   [Docker原理实战-3：UnionFS](/2021/08/29/Docker原理实战-3：UnionFS/)
-   [Docker原理实战-4：容器Container](/2021/09/05/Docker原理实战-4：容器Container/)

源代码：

-   https://github.com/JasonkayZK/my_docker

<br/>

<!--more-->

# **Docker原理实战-2：Cgroups**

## **Cgroups**

Namespace用来隔离自己单独的空间，而Cgroups（Control Groups）用来限制每个空间的硬件资源，如：CPU、内存等；

 通过Cgroups可以方便的限制某个进程的资源占用，并且可以实时的监控进程和统计信息；

<br/>

### **Cgroups三大组件**

Cgroups中一共包括了3大组件：

#### **① cgroup**

对进程进行分组管理的一种机制，即：一个cgroup中包含了一组进程；

而我们可以在整个cgrouo上增加Linux Subsystem的各种参数配置，将一整组进程和一整组subsystem的系统配置关联起来！

#### **② subsystem**

subsystem是一组资源控制的模块，包括了：

| 名称     | 说明                                                         |
| -------- | ------------------------------------------------------------ |
| blkio    | 设置对块设备（比如硬盘）输入输出的访问控制；                 |
| cpu      | 设置 cgroup 中进程的 CPU 被调度的策略；                      |
| cpuacct  | 统计 cgroup 中进程的 CPU 占用 ；                             |
| cpuset   | 在多核机器上设置 cgroup 中进程可以使用的 CPU 和内存（此处内存仅使用于UMA 架构）； |
| devices  | 控制 cgroup 中进程对设备的访问；                             |
| freezer  | 用于挂起( suspend )和恢复( resume) cgroup 中的进程；         |
| memory   | 控制 cgroup 中进程的内存占用；                               |
| net_cls  | 用于将 cgroup 中进程产生的网络包分类，以便 Linux 的 tc (traffic controller )可以根据分类区分出来自某个 cgroup 的包并做限流或监控； |
| net_prio | 设置 cgroup 中进程产生的网络流量的优先级；                   |
| ns       | 这个 subsystem 比较特殊，它的作用是：使 cgroup 中的进程在新的 Namespace 中 fork 新进程 ( NEWNS )时，创建出一个新的 cgroup，这个 cgroup 包含新的 Namespace 中的进程； |

<font color="#f00">**每个 subsystem 会关联到定义了相应限制的 cgroup 上，并对这个 cgroup 中的进程做相应的限制和控制！**</font>

>   可以通过安装 cgroup 命令行工具查看当前内核支持哪些subsystem：
>
>   ```bash
>   root@jasonkay:~# apt install cgroup-tools（原：cgroup-bin）
>   
>   root@jasonkay:~# lssubsys -a
>   cpuset
>   cpu,cpuacct
>   blkio
>   memory
>   devices
>   freezer
>   net_cls,net_prio
>   perf_event
>   hugetlb
>   pids
>   rdma
>   ```

#### **③ hierarchy**

hierarchy的功能是将一组croup串成一个树状结构，通过这个树状结构，可以实现 cgroups 的继承；

>   例如：
>
>   系统对一组定时任务 cgroup-1 限制了CPU使用率，而其中的一个定时任务还需要限制磁盘IO；
>
>   为了避免影响到其他进程，可以创建继承自 cgroup-1的cgroup-2，并设置 cgroup-2 限制磁盘IO；

<br/>

### **三个组件的关系**

Cgroups主要是通过cgroup、subsystem和hierarchy三个组件协作完成的；

三个组件的关系：

-   **系统在创建了新的 hierarchy 之后，系统中所有的进程都会加入这个 hierarchy 的 cgroup根节点，这个 cgroup 根节点是 hierarchy 默认创建的；在 hierarchy 中创建的 cgroup 都是这个 cgroup 根节点的子节点；**
-   **一个 subsystem 只能附加到 一 个 hierarchy 上面；**
-   **一个 hierarchy 可以附加多个 subsystem；**
-   **一个进程可以作为多个 cgroup 的成员,但是这些 cgroup 必须在不同的 hierarchy 中；**
-   **一个进程 fork 出子进程时，子进程是和父进程在同一个 cgroup 中的，也可以根据需要将其移动到其他 cgroup 中；**

<br/>

### **Linux Kernel接口**

在Cgroups中，hierarchy是一个树状的结构；

因此，Linux内核为了使 Cgroups 的配置更加直观，直接通过虚拟的树状文件系统对 Cgroups 进行配置；

下面来实际创建一个 Cgroups；

#### **创建并挂载一个hierarchy**

首先，创建并挂载一个hierarchy（cgroup树）：

```bash
################### 创建cgroup ###################
cd ~ && pwd # /root

# 创建一个hierarchy挂载点
mkdir cgroup-test

# 挂载一个hierarchy
sudo mount -t cgroup -o none,name=cgroup-test cgroup-test ./cgroup-test

# 查看文件:
ls ./cgroup-test 

# 输出：
# cgroup.clone_children  cgroup.sane_behavior  release_agent cgroup.procs notify_on_release tasks
```

完成hierarchy挂载后，目录下会生成一些默认文件，这些文件就是这个hierarchy中的cgroup根节点的配置：

**① cgroup.clone_children**

cpuset 的 subsystem 会读取这个配置文件：

如果这个值是1（默认是 0），子 cgroup 才会继承父 cgroup 的 cpuset 的配置；

**② cgroup.procs**

树中当前节点 cgroup 中的进程组ID；

现在的位置是在根节点，这个文件中会有现在系统中所有进程组的 ID！

例如：

```bash
root@jasonkay:~# cat ./cgroup-test/cgroup.procs 
1
2
3
4
……
```

**③ notify_on_release 和 release_agent**

notify_on_release 和 release_agent 会一起使用：

notify_on_release 标识当这个 cgroup 最后一个进程退出的时候是否执行了 release_agent：

release_agent 则是一个路径，通常用作进程退出之后自动清理掉不再使用的 cgroup；

**④ tasks**

tasks 标识该 cgroup 下面的进程 ID：

<font color="#f00">**如果把一个进程 ID 写到 tasks 文件中，便会将相应的进程加入到这个 cgroup 中！**</font>

<br/>

#### **扩展cgroup子节点**

然后在刚刚创建好的 hierarchy 上的 cgroup 根结点上扩展出两个子 cgroup：

```bash
# 当前路径：
root@jasonkay:~# cd ./cgroup-test && pwd 
# /root/cgroup-test

# 创建子cgroup
sudo mkdir cgroup-1     # 创建子cgroup "cgroup-1"
sudo mkdir cgroup-2     # 创建子cgroup "cgroup-2"

# 查看目录结构：
root@jasonkay:~/cgroup-test# tree
.
├── cgroup-1
│   ├── cgroup.clone_children
│   ├── cgroup.procs
│   ├── notify_on_release
│   └── tasks
├── cgroup-2
│   ├── cgroup.clone_children
│   ├── cgroup.procs
│   ├── notify_on_release
│   └── tasks
├── cgroup.clone_children
├── cgroup.procs
├── cgroup.sane_behavior
├── notify_on_release
├── release_agent
└── tasks

2 directories, 14 files
```

可以看到：

<font color="#f00">**在一个 cgroup 的目录下创建子目录时，内核会将该目录直接标记为这个cgroup的子目录，并继承父 cgroup 的属性！**</font>

<br/>

#### **在cgroup中添加和移动进程**

<font color="#f00">**一个进程在一个Cgroups的hierarchy中，只能在一个cgroup节点上存在，系统进程都会默认在根节点上存在！**</font>

<font color="#f00">**可以将进程移动到其他cgroup节点，只需要将进程的PID写入到对应cgroup节点的task文件即可！**</font>

例如：

```bash
################### 在cgroup中添加和移动进程 ###################

# 查看当前路径
cd cgroup-1/ && pwd # /root/cgroup-test/cgroup-1

# 查看当前Shell进程PID
echo $$ # 6758

# 将所在终端检测移动至cgroup-1中
sudo sh -c "echo $$ >> tasks" 

# 查看配置
cat /proc/6758/cgroup

# 输出：
# 13:name=cgroup-test:/cgroup-1
# 12:blkio:/user.slice
# 11:rdma:/
# 10:cpuset:/
# 9:memory:/user.slice/user-0.slice/session-1.scope
# 8:hugetlb:/
# 7:devices:/user.slice
# 6:net_cls,net_prio:/
# 5:pids:/user.slice/user-0.slice/session-1.scope
# 4:freezer:/
# 3:perf_event:/
# 2:cpu,cpuacct:/user.slice
# 1:name=systemd:/user.slice/user-0.slice/session-1.scope
# 0::/user.slice/user-0.slice/session-1.scope

# 查看tasks
cat tasks 

# 输出：
# 6758
# 47828
```

可以看到当前6758进程，已经被加入到cgroup-1中！

<br/>

#### **通过subsystem限制cgroup中的进程资源**

上面在创建hierarchy时，并没有关联到任何的subsystem，因此没办法通过该hierarchy中的cgroup对进程的资源进行限制；

>   <font color="#f00">**注：系统默认已经为每个subsystem创建了默认的hierarchy；**</font>
>
>   例如：memory的hierarchy：
>
>   ```bash
>   root@jasonkay:~/cgroup-test/cgroup-1# mount | grep memory
>   cgroup on /sys/fs/cgroup/memory type cgroup (rw,nosuid,nodev,noexec,relatime,memory)
>   ```
>
>   可以看到，`/sys/fs/cgroup/memory`目录便是挂在了memory subsystem的hierarchy上！

下面通过在memory subsystem的hierarchy中创建cgroup，限制进程占用内存！

过程如下：

```bash
################### 通过subsystem限制cgroup中进程的资源 ###################

# 进入memory subsystem的hierarchy目录中
cd /sys/fs/cgroup/memory && pwd # /sys/fs/cgroup/memory

# 不做限制的情况下进行测试
stress --vm-bytes 200m --vm-keep -m 1 &

# 输入top，并查看stress内存占用 /stress 为 200M（15985.9 * 1.3%）
top - 16:57:58 up 1 day, 42 min,  2 users,  load average: 0.23, 0.09, 0.02
Tasks: 260 total,   2 running, 258 sleeping,   0 stopped,   0 zombie
%Cpu(s): 12.9 us,  0.1 sy,  0.0 ni, 87.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :  15985.9 total,  11990.0 free,   2460.8 used,   1535.1 buff/cache
MiB Swap:  12288.0 total,  12287.7 free,      0.3 used.  13210.3 avail Mem 

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND                    
  48060 root      20   0  208660 204872    208 R 100.0   1.3   0:13.70 stress
```

>   **注：测试需要使用stress命令；**
>
>   安装：
>
>   ```bash
>   sudo apt install stress
>   ```

下面创建对进程内存进行限制：

```bash
# 创建cgroup
sudo mkdir test-limit-memory && cd test-limit-memory && pwd # /sys/fs/cgroup/memory/test-limit-memory

# 设置cgroup的最大内存占用为100M
sudo sh -c "echo "100m" > memory.limit_in_bytes"

# 将当前进程移动至该cgroup中
sudo sh -c "echo $$ > tasks"

# 再次运行stress
stress --vm-bytes 200m --vm-keep -m 1 &

# 输入top，并查看stress内存占用 /stress 此时为100M（15985.9 * 0.6%）了
top - 17:00:46 up 1 day, 45 min,  2 users,  load average: 0.37, 0.29, 0.11
Tasks: 260 total,   2 running, 258 sleeping,   0 stopped,   0 zombie
%Cpu(s):  2.3 us, 12.8 sy,  0.0 ni, 83.5 id,  1.5 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :  15985.9 total,  12088.5 free,   2361.8 used,   1535.7 buff/cache
MiB Swap:  12288.0 total,  12183.7 free,    104.3 used.  13309.2 avail Mem 

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND                    
  48151 root      20   0  208660  99812    208 R  81.2   0.6   0:03.11 stress
```

可以看到，通过cgroup，成功将stress进程最大内存占用限制到了100M！

>   **注1：试验结束后，将stress进程kill掉！**
>
>   **注2：试验结束后，将目录umount：**
>
>   ```bash
>   # 查看挂载情况：
>   root@jasonkay:~# mount
>   sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)
>   ……
>   cgroup-test on /root/cgroup-test type cgroup (rw,relatime,name=cgroup-test)
>   
>   # 取消挂载：
>   root@jasonkay:~# umount ./cgroup-test
>   
>   # 再次查看挂载情况：
>   root@jasonkay:~# mount
>   sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)
>   …… # 已不存在cgroup-test
>   ```
>
>   **注3：清除内存限制配置：**
>
>   我们将当前进程加入了`test-limit-memory`中，因此，在删除这个目录之前，需要将当前进程重新加入至其他hierarchy中：
>
>   ```bash
>   # 切换到默认内存限制hierarchy
>   cd /sys/fs/cgroup/memory/
>   
>   # 将当前进程放入默认内存限制tasks
>   echo $$ >> tasks
>   
>   # 删除目录（它会将这个目录下的全部文件也都删除！）
>   rmdir test-limit-memory/
>   ```

<br/>

### **Docker是如何使用Cgroups的**

Docker就是通过Cgroups实现容器资源限制和监控的；

```bash
# 使用 -m 设置内存限制
root@jasonkay:/sys/fs/cgroup/memory# docker run -itd -m 128m busybox:1.34.0
WARNING: Your kernel does not support swap limit capabilities or the cgroup is not mounted. Memory limited without swap.
0bf66ace3af2a1cd57e7a8a12bbf33940ba63722e18dbd4c1e82517c8889af0c

# 查看容器cgroup
cd /sys/fs/cgroup/memory/docker/0bf66ace3af2a1cd57e7a8a12bbf33940ba63722e18dbd4c1e82517c8889af0c/

ls
cgroup.clone_children           memory.kmem.tcp.failcnt             memory.oom_control
……

# 查看cgroup内存限制
root@jasonkay:/sys/fs/cgroup/memory/docker/0bf66ace3af2a1cd57e7a8a12bbf33940ba63722e18dbd4c1e82517c8889af0c# cat memory.limit_in_bytes 
134217728

# 查看cgroup中当前进程使用的内存大小
root@jasonkay:/sys/fs/cgroup/memory/docker/0bf66ace3af2a1cd57e7a8a12bbf33940ba63722e18dbd4c1e82517c8889af0c# cat memory.usage_in_bytes 
2863104
```

可以看到，Docker通过为每个容器创建cgroup来配置资源限制和资源监控！

>   <font color="#f00">**注：试验结束别忘了关闭容器！**</font>

<br/>

### **通过Go使用Cgroups**

下面我们通过Go代码来配置Cgroups，以实现限制容器内存；

chapter2_basic/cgroups/cgroup_demo.go

```go
package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path"
	"strconv"
	"syscall"
)

const (
	// 挂载了memory subsystem的hierarchy的根目录位置
	cgroupMemoryHierarchyMount = "/sys/fs/cgroup/memory"
)

func main() {
	// 容器进程
	if os.Args[0] == "/proc/self/exe" {
		fmt.Printf("current pid %d\n", syscall.Getpid())

		cmd := exec.Command("sh", "-c", `stress --vm-bytes 200m --vm-keep -m 1`)
		cmd.SysProcAttr = &syscall.SysProcAttr{
		}
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
	}

	cmd := exec.Command("/proc/self/exe")
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWPID | syscall.CLONE_NEWNS,
	}
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		fmt.Println("ERROR", err)
		os.Exit(1)
	}
	// 得到fork出来进程映射在外部命名空间的pid
	fmt.Printf("%v", cmd.Process.Pid)

	// 在系统默认创建挂载了memory subsystem的hierarchy上创建cgroup
	_ = os.Mkdir(path.Join(cgroupMemoryHierarchyMount, "testmemorylimit"), 0755)
	// 将容器进程加入这个cgroup中
	_ = ioutil.WriteFile(path.Join(cgroupMemoryHierarchyMount, "testmemorylimit", "tasks"), []byte(strconv.Itoa(cmd.Process.Pid)), 0644)
	// 限制cgroup中进程使用
	_ = ioutil.WriteFile(path.Join(cgroupMemoryHierarchyMount, "testmemorylimit", "memory.limit_in_bytes"), []byte("100m"), 0644)

	_, _ = cmd.Process.Wait()
}
```

执行代码并查看：

```bash
pwd # /root/workspace/my_docker/chapter2_basic

# 运行代码：
root@jasonkay:~/workspace/my_docker/chapter2_basic# go run cgroups/cgroup_demo.go 
49750current pid 1
stress: info: [7] dispatching hogs: 0 cpu, 0 io, 1 vm, 0 hdd

# 在一个新的shell中查看内存：
top

# top - 17:36:51 up 1 day,  1:21,  2 users,  load average: 0.56, 0.18, 0.09
# Tasks: 267 total,   2 running, 265 sleeping,   0 stopped,   0 zombie
# %Cpu(s):  0.6 us,  7.3 sy,  0.0 ni, 91.6 id,  0.0 wa,  0.0 hi,  0.6 si,  0.0 st
# MiB Mem :  15985.9 total,  11840.2 free,   2439.3 used,   1706.4 buff/cache
# MiB Swap:  12288.0 total,  12181.0 free,    107.0 used.  13233.0 avail Mem 
# 
#    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND          #                             
#  49763 root      20   0  208660 100996    272 R  75.0   0.6   0:33.54 stress
```

可以看到，只占用了100M内存！

>   **注：最后别忘了清理cgroup配置：**
>
>   ```bash
>   rmdir /sys/fs/cgroup/memory/testmemorylimit/
>   ```

<br/>

## **小结**

本篇主要讲述了Docker和K8S中限制容器硬件资源的技术：Cgroups；

Cgroups主要包括三个部分：

-   cgroup；
-   subsystem；
-   hierarchy；

最后通过Shell操作和Go代码，分别进行了进程的内存限制操作；

本系列的下一小节将讲述和 Docker 存储相关的基本知识：UnionFS；

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
