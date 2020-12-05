---
title: VMWare安装Ubuntu虚拟机
toc: true
cover: 'https://acg.yanwz.cn/api.php?x'
date: 2020-12-05 21:08:41
categories: 软件安装与配置
tags: [软件安装与配置, VMWare, 虚拟机]
description: Windows对Docker的支持一直不是很好，即使已经支持了WSL和WSL2；最近还是重新装上了VMWare，发现真香！
---

Windows对Docker的支持一直不是很好，即使已经支持了WSL和WSL2；

最近还是重新装上了VMWare，发现真香！

<br/>

<!--more-->

## **VMWare安装Ubuntu虚拟机**

环境：

-   VMWare：15.1.0 build-13591040
-   Ubuntu-20.04-desktop-amd64

### **下载镜像**

推荐镜像地址：

-   官网：https://ubuntu.com/download/desktop
-   网易：http://mirrors.163.com/ubuntu-releases/

<br/>

### **安装镜像**

安装过程如下（由于较简单，所以省略的安装图片）：

1.  打开VMware新建虚拟机，并选择自定义安装；
2.  选择虚拟机硬件；
3.  选择稍后安装操作系统；
4.  选择要安装的操作系统：Ubuntu64位；
5.  虚拟机命名和位置；
6.  处理器配置：1个处理器，8核；
7.  内存配置：16G（16384M）；
8.  网络类型：NAT；
9.  I/O控制器类型：LSI Logic(L)；
10.  磁盘类型：SCSI(S)；
11.  选择磁盘：创建新虚拟机磁盘；
12.  磁盘容量：100G、单个文件；
13.  磁盘存储位置：自定义；
14.  创建完成；

<br/>

### **编辑虚拟机设置**

镜像安装完成后，先不打开，而是点击：`编辑虚拟机设置`：

-   CD/DVD → 使用ISO映像文件 → 选择下载的ISO文件；

<br/>

### **安装操作系统**

开启虚拟机安装操作系统，安装过程可以参考另一篇文章：

-   [记一次重装系统](https://jasonkayzk.github.io/2019/09/04/记一次重装系统/)

安装完成，重启时，先点击下方VMWare提醒的的`安装完成`，然后重启；

<br/>

### **再次编辑虚拟机设置**

操作安装完成后，再次点击：`编辑虚拟机设置`：

-   CD/DVD → 使用物理驱动器(P) → 自动检测；

保存设置，开机；

完成安装！

<br/>

### **虚拟机优化**

#### **① 分辨率调整**

安装完成后在Ubuntu配置中是没有`1920x1080`分辨率配置的，可以通过在命令行输入下面的命令配置：

```bash
xrandr --newmode "1920x1080"  173.00  1920 2048 2248 2576  1080 1083 1088 1120 -hsync +vsync
xrandr --addmode Virtual1 1920x1080
xrandr --output Virtual1 --mode 1920x1080
```

****

#### **② 安装vm-tools**

vm-tools提供了例如：ubuntu和windows之间复制文本、拖拽文件等功能；

可以通过命令行安装这个工具：

```bash
sudo apt autoremove open-vm-tools
sudo apt install open-vm-tools-desktop
```

<br/>

### **安装软件**

软件安装参考：

-   [软件安装](https://jasonkayzk.github.io/installing/)

<br/>