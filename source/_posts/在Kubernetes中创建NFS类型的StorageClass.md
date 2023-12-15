---
title: 在Kubernetes中创建NFS类型的StorageClass
toc: true
cover: 'https://img.paulzzh.com/touhou/random?77'
date: 2023-12-15 16:04:31
categories: Kubernetes
tags: [Kubernetes, NFS]
description: 如果要在Kubernetes中部署StatefulSet类型的Pod，需要先创建持久化的StorageClass、PV，从而让PVC能够使用对应的存储；StorageClass常用的类型有：Local(例如：HostPath、EmptyDir等)、NFS、Ceph；在声明NFS类型的StorageClass时需要用到第三方的Provisioner；本文讲解了如何在Kubernetes中创建NFS类型的StorageClass；
---

如果要在Kubernetes中部署StatefulSet类型的Pod，需要先创建持久化的StorageClass、PV，从而让PVC能够使用对应的存储；

StorageClass常用的类型有：Local(例如：HostPath、EmptyDir等)、NFS、Ceph；

在声明NFS类型的StorageClass时需要用到第三方的Provisioner；

本文讲解了如何在Kubernetes中结合 Kuboard 使用 [nfs-subdir-external-provisioner](https://github.com/kubernetes-sigs/nfs-subdir-external-provisioner/) 创建NFS类型的StorageClass；

<br/>

<!--more-->

# **在Kubernetes中创建NFS类型的StorageClass**

## **前言**

本文在：[《在VMWare中部署你的K8S集群》](https://jasonkayzk.github.io/2021/05/16/在VMWare中部署你的K8S集群/) 的基础之上进行！

<br/>



## **安装并配置NFS服务**

这里开启了另外一台 Ubuntu 来作为 NFS 服务器；

`hostname` 设置为 `ubuntu-4`；

### **安装NFS**

首先，在这台机器上安装并配置 NFS；

>   参考文章：
>
>   -   https://www.digitalocean.com/community/tutorials/how-to-set-up-an-nfs-mount-on-ubuntu-22-04#step-7-mounting-the-remote-nfs-directories-at-boot

NFS 服务器上安装 Server：

```shell
sudo apt update
sudo apt install nfs-kernel-server
```

>   **各个 K8S 节点上也需要安装 nfs 客户端：**
>
>   ```shell
>   sudo apt update
>   sudo apt install nfs-common
>   ```
>
>   

<br/>

### **创建挂载点**

然后在 NFS 服务器上创建挂载点：

```shell
sudo mkdir /var/nfs/general -p
```

并修改 owner：

```shell
root@ubuntu-4:/var/nfs/general# ls -dl /var/nfs/general

drwxr-xr-x 15 nobody nogroup 4096 Dec 15 07:21 /var/nfs/general
```

<br/>

### **配置NFS**

修改  `/etc/exports` 添加配置：

```diff
# /var/nfs/general    client_ip(rw,sync,no_subtree_check)

+ /var/nfs/general  *(rw,sync,no_subtree_check)
```

如果配置为 `*`，则任何 ClientIp 都可以访问这个目录；

配置含义：

-   **rw**：Client 可以读写；
-   **sync**：同步写操作，保证在响应客户端之前数据已经强制写入（提高可靠性，但是降低文件操作效率）；
-   **no_subtree_check**：关闭文件子树检查，避免NFS服务器在处理每次请求时都检查文件树合法；关闭后可以避免客户端重命名文件产生的问题；

<br/>

### **重启服务**

配置完成后重启服务：

```shell
sudo systemctl restart nfs-kernel-server
```

开机自启动：

```shell
sudo systemctl enable nfs-kernel-server
```

<br/>

### **测试：在Client节点创建挂载点**

在 Client 节点创建要挂载的目录：

```shell
sudo mkdir -p /nfs/general
```

挂载：

```shell
sudo mount nfs_host_ip:/var/nfs/general /nfs/general
```

>   **将 `nfs_host_ip` 修改为 NFS 服务器 IP 地址；**

校验写入：

```shell
# client
sudo touch /nfs/general/general.test
```

执行成功，并且在 NFS Server 对应目录中能看到文件即可！

清理：

```shell
# client
sudo rm /nfs/general/general.test

sudo umount /nfs/general
```

<br/>

## **创建 StorageClass**

StorageClass是一个存储类，通过创建StorageClass可以动态生成一个存储卷，供 k8s 使用；

**使用 StorageClass 可以根据PVC动态的创建PV，减少管理员手工创建PV的工作；**

StorageClass的定义主要包括名称、后端存储的提供者 (privisioner) 和后端存储的相关参数配置；

>   **注意：StorageClass一旦被创建，就无法修改，如需修改，只能删除重建！**

接下来就需要使用 [nfs-subdir-external-provisioner](https://github.com/kubernetes-sigs/nfs-subdir-external-provisioner/) Provisioner；

这个 Provisioner 使用已经配置好的 nfs 服务器，来自动创建持久卷，即自动帮我们创建 PV；

同时：

-   **自动创建的 PV 以`{namespace}-{pvcName}-{pvName}` 这样的命名！**

-   **格式创建在 NFS 服务器上的共享数据目录中；**

-   **当这个 PV 被回收后会以 `archieved-{namespace}-{pvcName}-{pvName}` 这样的命名格式存在 NFS 服务器上；**

我们可以直接通过 Helm 安装：

```shell
$ helm repo add nfs-subdir-external-provisioner https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/

$ helm install nfs-subdir-external-provisioner nfs-subdir-external-provisioner/nfs-subdir-external-provisioner \
    --set nfs.server=x.x.x.x \
    --set nfs.path=/exported/path
```

>   **官方文档：**
>
>   -   https://github.com/kubernetes-sigs/nfs-subdir-external-provisioner

或者我们也可以通过 Kuboard 进行配置：

在集群概览页，点击 `Create StorageClass`：

![kuboard-storageclass.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/kuboard-storageclass.png)

然后根据需求进行配置即可：

![kuboard-storageclass-2.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/kuboard-storageclass-2.png)

等待部署完成后，可以查看部署成功：

```shell
root@ubuntu-1:~# k get sc -A
NAME         PROVISIONER      RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
my-storage   nfs-my-storage   Delete          Immediate           false                  5h25m

root@ubuntu-1:~# k get pv -A
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                            STORAGECLASS                   REASON   AGE
nfs-pv-my-storage                          75Gi       RWX            Retain           Bound    kube-system/nfs-pvc-my-storage   nfs-storageclass-provisioner            5h26m
```

即部署完成；

下一篇文章将会讲述如何使用我们创建的 StorageClass 部署 StatefulSet！

<br/>

# **附录**

参考文章：

-   [《在VMWare中部署你的K8S集群》](https://jasonkayzk.github.io/2021/05/16/在VMWare中部署你的K8S集群/)
-   https://blog.csdn.net/u011837804/article/details/128692744
-   https://github.com/kubernetes-sigs/nfs-subdir-external-provisioner
-   https://kuboard.cn/learning/k8s-intermediate/persistent/pv.html#%E6%A6%82%E8%BF%B0

<br/>
