---
title: Docker原理实战-3：UnionFS
toc: true
cover: 'https://img.paulzzh.com/touhou/random?3'
date: 2021-08-29 20:27:09
categories: Docker
tags: [Docker, Linux, UnionFS, AUFS]
description: 讲述Docker底层原理的第三篇文章，本文讲述了和Docker底层文件存储相关的技术：UnionFS以及AUFS；
---

讲述Docker底层原理的第三篇文章；

本文讲述了和Docker底层文件存储相关的技术：UnionFS以及AUFS；

系列文章：

-   [Docker原理实战-1：Namespace](/2021/08/29/Docker原理实战-1：Namespace/)
-   [Docker原理实战-2：Cgroups](/2021/08/29/Docker原理实战-2：Cgroups/)
-   [Docker原理实战-3：UnionFS](/2021/08/29/Docker原理实战-3：UnionFS/)
-   [Docker原理实战-4：容器Container](/2021/09/05/Docker原理实战-4：容器Container/)

源代码：

-   https://github.com/JasonkayZK/my_docker

<br/>

<!--more-->

## **Union File System**

### **什么是Union File System**

Union File System，简称UnionFS，是一种为 Linux 、FreeBSD 和 NetBSD 操作系统设计的，把其他文件系统联合到一个联合挂载点的文件系统服务；

它使用 branch 把不同文件系统的文件和目录“透明地”覆盖，形成一个单一、一致的文件系统 ；

这些 branch 或者是 read-only 的、或者是 read-write 的，所以当对这个虚拟后的联合文件系统进行写操作的时候 , 系统是真正写到了一个新的文件中！

看起来这个虚拟后的联合文件系统是可以对任何文件进行操作的 , 但是其实它并没有改变原来的文件！

这是因为：UnionFS 用到了一个重要的资源管理技术：写时复制；

>   写时复制（copy-on-write ,下文简称 CoW），也被称为隐式共享，是一种对可修改资源实现高
>   效复制的资源管理技术；
>
>   <font color="#f00">**UnionFS的思想是：如果一个资源是重复的，并且没有任何修改，这时并不需要立即创建一个新的资源，这个资源可以被新旧实例共享；**</font>
>
>   而创建新资源发生在第一次写操作（也就是对资源进行修改的时候）；
>
>   通过这种资源共享的方式可以显著地减少未修改资源复制带来的消耗，但是也会在进行资源修改时增加小部分的开销；

<br/>

### **AUFS**

AUFS是Docker使用的第一种存储驱动，目前Docker也是支持的！

>   目前Docker默认的存储驱动已经变为了`overlay2`，这里只是简单的介绍AUFS；
>
>   查看Docker的存储驱动：
>
>   ```bash
>   root@jasonkay:~/workspace/my_docker/chapter2_basic# docker info
>   Client:
>   Context:    default
>   Debug Mode: false
>   Plugins:
>    app: Docker App (Docker Inc., v0.9.1-beta3)
>    buildx: Build with BuildKit (Docker Inc., v0.6.1-docker)
>    scan: Docker Scan (Docker Inc., v0.8.0)
>   
>   Server:
>   Containers: 1
>    Running: 1
>    Paused: 0
>    Stopped: 0
>   Images: 2
>   Server Version: 20.10.8
>   Storage Driver: overlay2
>    Backing Filesystem: extfs
>    Supports d_type: true
>    Native Overlay Diff: true
>    userxattr: false
>   Logging Driver: json-file
>   Cgroup Driver: cgroupfs
>   Cgroup Version: 1
>   ```
>
>   可以看到`Storage Driver: overlay2`；

关于Docker存储驱动，包括overlay、overlay2等等分析的文章非常多，这里不再赘述了；

想要深入了解存储驱动的，可以自行Google，下面我们通过案例简单学习下AUFS，对这种文件系统有个了解即可！

<br/>

### **AUFS实例**

#### **创建AUFS文件**

下面通过一个实例来学习AUFS和CoW实现；

首先，在目录下创建一个aufs目录，然后在 aufs 目录下创建一个 mnt 的文件夹作为挂载点；

接着，在 aufs 目录下创建一个名为 container-layer 的目录，里面有一个名为container-layer.txt的文件，文件内容为`I am container layer`；

同样地 , 继续在 aufs 目录下创建 4 个名为 `image-layer{n}` 的文件夹( n 取值分别为 1到4），里面有一个名为`image-layer{n}.txt`的文件，文件内容为`I am image layer ${n}`；

命令如下：

```bash
############################ 创建AUFS目录 ############################
mkdir aufs
cd aufs/
mkdir mnt
mkdir container-layer
echo "I am a container layer" >./container-layer/container-layer.txt
mkdir image-layer1 && mkdir image-layer2 && mkdir image-layer3 && mkdir image-layer4
echo "I am image layer1" >image-layer1/image-layer1.txt
echo "I am image layer2" >image-layer2/image-layer2.txt
echo "I am image layer3" >image-layer3/image-layer3.txt
echo "I am image layer4" >image-layer4/image-layer4.txt
```

检查目录结构：

```bash
root@jasonkay:~/workspace/test/aufs# tree
.
├── container-layer
│   └── container-layer.txt
├── image-layer1
│   └── image-layer1.txt
├── image-layer2
│   └── image-layer2.txt
├── image-layer3
│   └── image-layer3.txt
├── image-layer4
│   └── image-layer4.txt
└── mnt

6 directories, 5 files
```

<br/>

#### **使用AUFS挂载目录**

接下来将`container-layer`和4个`image-layer{n}`的目录使用AUFS的方式挂载至当前的mnt目录下；

```bash
############################ 挂载目录到mnt ############################

# 使用AUFS挂载
sudo mount -t aufs -o dirs=./container-layer:./image-layer4:./image-layer3:./image-layer2:./image-layer1 node ./mnt

# 查看挂载后结果：
tree mnt/
# mnt/
# ├── container-layer.txt
# ├── image-layer1.txt
# ├── image-layer2.txt
# ├── image-layer3.txt
# └── image-layer4.txt
#
#0 directories, 5 files
```

>   <font color="#f00">**注：在`mount aufs`命令中，没有指定待挂载的 5 个目录的权限；**</font>
>
>   <font color="#f00">**则默认情况下的行为是：dirs 指定的左边起第一个目录是 `read-write` 权限, 后续的都是 `read-only` 权限！**</font>

确认新 mount 的文件系统中，每个目录的权限：

```bash
# 查看当前系统全部AUFS的文件
root@jasonkay:~/workspace/test/aufs# ls /sys/fs/aufs/
config  si_452a0e92fdc8093d

# si_452a0e92fdc8093d为当前系统为mnt挂载点新创建的！
# 查看当前每个目录权限：
root@jasonkay:~/workspace/test/aufs# cat /sys/fs/aufs/si_452a0e92fdc8093d/*
/root/workspace/test/aufs/container-layer=rw
/root/workspace/test/aufs/image-layer4=ro
/root/workspace/test/aufs/image-layer3=ro
/root/workspace/test/aufs/image-layer2=ro
/root/workspace/test/aufs/image-layer1=ro
64
65
66
67
68
/root/workspace/test/aufs/container-layer/.aufs.xino
```

可以看到，`container-layer`是 `read-write` 权限, 后续的都是 `read-only` 权限！

<br/>

#### **修改AUFS文件**

接下来修改layer-4，以确认AUFS的CoW工作方式；

向 `mnt/image-layer-4.txt` 文件末尾添加一行文字：

```bash
# 添加文字
echo -e "\nwrite to mnt's image-layer4.txt" >>./mnt/image-layer4.txt

# 查看添加后的文件内容
cat mnt/image-layer4.txt

# 输出：
# I am image layer4
#
# write to mnt's image-layer4.tx
```

从 cat 命令输出可以看到，`mnt/image-layer-4.txt` 文件内容的确发生了变化；

但是这里的mnt只是一个虚拟挂载点，接下来需要查看实际的文件修改位置；

查看 `image-layer4/image-layer4.txt`：

```bash
cat image-layer4/image-layer4.txt
# I am image layer4
```

发现实际的 `image-layer4/image-layer4.txt` 文件并未变化！

检查 `container-layer/` 目录下的内容，发现多了一个名为 `image-layer4.txt` 的文件，并且文件内容如下：

```bash
ll container-layer/
# total 24
# drwxr-xr-x 4 jasonkay jasonkay 4096 3月  16 14:32 ./
# drwxr-xr-x 8 jasonkay jasonkay 4096 3月  16 14:23 ../
# -rw-r--r-- 1 jasonkay jasonkay   21 3月  16 14:23 container-layer.txt
# -rw-r--r-- 1 jasonkay jasonkay   51 3月  16 14:32 image-layer4.txt
# -r--r--r-- 1 root     root        0 3月  16 14:29 .wh..wh.aufs
# drwx------ 2 root     root     4096 3月  16 14:29 .wh..wh.orph/
# drwx------ 2 root     root     4096 3月  16 14:29 .wh..wh.plnk/

# 查看 container-layer/image-layer4.txt 文件内容：
cat container-layer/image-layer4.txt
# I am image layer4
#
# write to mnt's image-layer4.txt
```

可见，当尝试修改 `mnt/image-layer4.txt` 时，系统首先在 `mnt` 目录下查找名为 `image-layer4.txt` 的文件，并将其拷贝到 read-write 层的 `container-layer` 目录中；

接着，对 `container-layer` 目录中的 `image-layer4.txt` 文件进行写操作，即：CoW；

>   **注：试验结束别忘了将挂载点恢复：**
>
>   ```bash
>   pwd # /root/workspace/test/aufs
>   
>   # 取消挂载mnt目录
>   sudo umount ./mnt
>   
>   # 查看AUFS，发现si_452a0e92fdc8093d已经不存在！
>   ls /sys/fs/aufs/ # config
>   ```

<br/>

## **小结**

本篇主要介绍了UnionFS以及AUFS，最后通过实践，体验了CoW（写时复制）；

下一篇将会使用 Go 编写一个类似于 Docker 的容器环境，尽请期待；

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
