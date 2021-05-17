---
title: 在VMWare中部署你的K8S集群
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?76'
date: 2021-05-16 21:45:31
categories: Kubernetes
tags: [Kubernetes, VMWare, CentOS]
description: 如果要学Kubernetes的话，怎么能够没有自己的Kubernetes集群呢？本文从零开始，手把手教你搭建Kubernetes集群！
---

如果要学Kubernetes的话，怎么能够没有自己的Kubernetes集群呢？

本文从零开始，手把手教你搭建Kubernetes集群！

<br/>

<!--more-->

## **在VMWare中部署你的K8S集群**

### **前言**

在搭建K8S之前，我觉得K8S包含的组件这么多，应该相当复杂了吧（上一次搭建基本上是在三年前了）；

但实际上，经过这几年各种折腾的打磨，发现并没有自己想象的那么难！

搭建的过程和通常的CentOS集群基本上类似，只是稍微多了几个东西而已；

>   如果对搭建CentOS集群不熟悉，建议可以先看一下我的这篇文章：
>
>   -   [VMWare下创建CentOS7节点集群](/2021/03/13/VMWare下创建CentOS7节点集群/)

在搭建之前先说一下我的环境：

-   CPU：AMD Ryzen 7 3700X
-   内存：32GB
-   硬盘：NVMe Samsung SSD 970 500GB
-   虚拟化：VMWare Pro 15.1.0 build-13591040
-   操作系统镜像：CentOS-7-x86_64-Minimal-2009.iso

关于我们要搭建的K8S：

-   Docker版本：docker-ce-19.03.9；
-   K8S版本：1.20.2；
-   三个节点：master、node1、node2（固定IP）；
-   容器运行时：仍然使用Docker而非Containerd；
-   Pod网络：用Calico替换Flannel实现 Pod 互通，支持更大规模的集群；
-   集群构建工具：Kubeadm（这个没啥好说的吧）；

关于网络配置：

-   整体机器采用NAT地址转换；
-   各台虚拟机采用固定IP地址；
-   虚拟机VMWare统一网关地址：192.168.24.2；

具体IP地址分配如下：

| 主机名称 | 硬件配置      | IP             |
| :------- | :------------ | :------------- |
| master   | CPU4核/内存4G | 192.168.24.180 |
| node1    | CPU4核/内存4G | 192.168.24.181 |
| node2    | CPU4核/内存4G | 192.168.24.182 |

下面，我们就来动手搭建一个K8S集群吧！

<br/>

### **创建合适的操作系统快照**

先来说一下什么是`合适的操作系统快照`：

由于VMWare中提供了快照功能，我们可以通过生成一个快照，并且克隆这个快照快速实现虚拟机倍增；但是，为了让我们克隆的机器可以直接加入集群，而非在克隆后还要修改克隆机大量配置，因此创建快照的内容想到关键；

我们应当在master机上进行网络配置、工具安装后再生成快照；

#### **① 安装CentOS镜像**

首先在镜像站下载CentOS-7-x86_64-Minima.iso，即最小的镜像文件；

然后在VMWare安装这个镜像，这里作为master机器；

具体镜像安装挺简单的，这里不再赘述了；

只贴一个配置：

-   1个处理器4核
-   4G内存
-   40G硬盘SCSI
-   网络：NAT

分区：

-   /boot：256M
-   swap：2G
-   /：剩余

>   <font color="#f00">**在安装CentOS时可以不创建用户，但是一定要创建Root密码；**</font>
>
>   **我这里创建的是：`123456`；**

<br/>

#### **② 配置网络**

>   <font color="#f00">**在网络配置中，我们要配置虚拟机为固定的IP地址，避免使用DCHP动态分配IP（否则每次IP都不同，乱套了！）；**</font>

首先，安装完成后，有极大的可能是无法联网的（所以也不能使用yum安装）；

首先需要修改配置`vi /etc/sysconfig/network`：

```diff
$ vi /etc/sysconfig/network
# 添加下面的配置
+ NETWORKING=yes
+ HOSTNAME=master
```

还要修改`vi /etc/sysconfig/network-scripts/ifcfg-ens33`：

```diff
$ vi /etc/sysconfig/network-scripts/ifcfg-ens33
# 配置如下

TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
-BOOTPROTO=dchp
+BOOTPROTO=static
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
-UUID=XXXX-XXXX-XXXX
-ONBOOT=no
+ONBOOT=yes
+IPADDR=192.168.24.180
+NETMASK=255.255.255.0
+GATEWAY=192.168.24.2
NAME=ens33
DEVICE=ens33
+DNS1=192.168.24.2
+DNS2=114.114.114.114
```

上面的配置主要是为了将网络修改为静态IP；

配置中的几个重点：

-   **BOOTPROTO：修改为static，即静态IP；**
-   **IPADDR：静态的IP地址；**
-   **NETMASK：子网掩码，选择255.255.255.0即可；**
-   **GATEWAY：网关，结尾为`.2`，NAT分配的子网地址可在`编辑→虚拟网络编辑器`中查看；**
-   **DNS1、DNS2：DNS1可选择本机网关地址、DNS2可配置114.114.114.114等公共DNS；**
-   **UUID：删除；**
-   **ONBOOT：yes，开机启用网络（开启才能开机就联网）；**

>   需要注意的是：
>
>   在CentOS 6中，网络的配置文件是：
>
>   -   `/etc/sysconfig/network-scripts/ifcfg-eth0`；

随后，配置hosts：

```diff
$ vi /etc/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6

+ 192.168.24.180 master
+ 192.168.24.181 node1
+ 192.168.24.182 node2
```

>   上述配置根据你实际情况修改；

配置完成后reboot；

reboot后登录，ping百度、qq等网站，成功则说明配置成功；

```bash
ping www.qq.com
PING ins-r23tsuuf.ias.tencent-cloud.net (221.198.70.47) 56(84) bytes of data.
64 bytes from www47.asd.tj.cn (221.198.70.47): icmp_seq=1 ttl=128 time=61.0 ms
64 bytes from www47.asd.tj.cn (221.198.70.47): icmp_seq=2 ttl=128 time=61.0 ms
64 bytes from www47.asd.tj.cn (221.198.70.47): icmp_seq=3 ttl=128 time=61.2 ms
```

<br/>

#### **③ 系统配置**

系统配置主要是关闭防火墙、关闭swap、配置yum源等；

##### **Ⅰ.关闭防火墙iptables**

命令如下：

```bash
$ service iptables stop
$ systemctl disable iptables
```

>   <font color="#f00">**注：有些机器可能没有iptables，这时候会提示：**</font>
>
>   ```bash
>   [root@master ~]# service iptables stop
>   Redirecting to /bin/systemctl stop iptables.service
>   Failed to stop iptables.service: Unit iptables.service not loaded.
>   [root@master ~]# systemctl disable iptables
>   Failed to execute operation: No such file or directory
>   ```
>
>   不用理会，这样最好~

****

##### **Ⅱ.禁用selinux**

命令如下：

```bash
# 查看selinux
$ getenforce
Enforcing

# 关闭
$ vim /etc/selinux/config
# 修改为：disabled
SELINUX=disabled
```

****

##### **Ⅲ.禁用防火墙firewalld**

命令如下：

```bash
systemctl stop firewalld
systemctl disable firewalld
```

>   <font color="#f00">**上面三步非常关键，如果防火墙没有关闭，会有各种各样的问题，导致机器中的节点无法正常通信（别问我是怎么知道的~）**</font>

****

##### **Ⅳ.SSH登录配置**

```bash
$ vim /etc/ssh/sshd_config
# 修改
UseDNS no
```

允许Root身份登录、允许空密码登录、是否允许使用密码认证：

```bash
PermitRootLogin yes #允许root登录
PermitEmptyPasswords no #不允许空密码登录
PasswordAuthentication yes # 设置是否使用口令验证
```

****

##### **Ⅴ.关闭Swap空间**

命令如下：

```bash
[root@master ~]# swapoff -a
[root@master ~]# sed -ie '/swap/ s/^/# /' /etc/fstab 
[root@master ~]# free -m
              total        used        free      shared  buff/cache   available
Mem:           3770        1265        1304          12        1200        2267
Swap:             0           0           0
```

>   <font color="#f00">**此步同样非常关键**</font>

****

##### **Ⅵ.配置桥接流量**

命令如下：

```bash
[root@k8s-master1 ~]# cat > /etc/sysctl.d/k8s.conf << EOF
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
```

****

##### **Ⅶ.配置yum源**

在安装软件前首先要配置yum源：

```bash
# 配置阿里云源
# 备份
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
# 配置
curl -o /etc/yum.repos.d/CentOS-Base.repo https://mirrors.aliyun.com/repo/Centos-7.repo
# 生成缓存
yum makecache

# 安装epel库
yum -y install epel-release
yum -y update
```

随后，可通过yum安装vim、htop、ntp、net-tools、wget等软件；

<br/>

#### **④ 下载并配置软件**

htop、vim、net-tools、wget直接通过`yum install`安装即可；

##### **Ⅰ.时间同步ntp**

下面讲述时间同步ntp配置：

安装ntp：

```bash
yum install ntp
```

配置ntp：

```bash
# 开启服务
$ service ntpd start

# 开机启动
$ systemctl enable ntpd
```

****

##### **Ⅱ.安装Docker**

Kubernetes默认的CRI（容器运行时）为Docker，因此先安装Docker；

首先，安装必要的一些系统工具：

```bash
yum install -y yum-utils device-mapper-persistent-data lvm2
```

随后，添加软件源信息：

```bash
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

替换下载源为阿里源：

```bash
sed -i 's+download.docker.com+mirrors.aliyun.com/docker-ce+' /etc/yum.repos.d/docker-ce.repo
# 更新源
yum makecache fast
```

查看可安装版本：


```bash
yum list docker-ce --showduplicates | sort -r
```

选择版本安装：

```bash
yum -y install docker-ce-19.03.9
```

设置开机启动r并启动Docke：


```bash
systemctl enable docker && systemctl start docker
```

配置镜像下载加速：

```bash
cat > /etc/docker/daemon.json << EOF
{
  "registry-mirrors" : [
    "http://hub-mirror.c.163.com",
    "http://registry.docker-cn.com",
    "http://docker.mirrors.ustc.edu.cn"
  ]
}
EOF
```

重启生效：

```bash
[root@master ~]# systemctl restart docker
[root@master ~]# docker info | grep 'Server Version'
 Server Version: 19.03.9
```

至此，Docker安装完成；

****

##### **Ⅲ.安装kubeadm/kubelet和kubectl**

由于kubeadm依赖中已经包括了kubectl、kubelet，所以不用单独安装kubectl；

配置镜像源：

```bash
cat  > /etc/yum.repos.d/kubernetes.repo <<EOF
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
```

安装kubeadm：

```bash
yum install kubeadm-1.20.2 -y
```

>   <font color="#f00">**由于版本更新频繁，这里指定版本号部署**</font>

设置开机启动：

```bash
systemctl enable kubelet
```

至此，所有配置配置完毕、所有软件安装完毕；

接下来我们创建镜像并克隆；

<br/>

### **创建快照并克隆**

>   在制作镜像快照前，如果系统是CentOS6，则还需要删除`/etc/udev/rules.d/70-persistent-net.rules`文件；
>
>   **注：删除之后不可重启！否则下次重启还会自动创建该文件，还需要删除！**

选择`虚拟机→快照→拍摄快照`，使用当前虚拟机的当前状态拍摄快照；

拍摄完成后，选择当前拍摄快照，点击`克隆`，选择`现有快照`，克隆类型有两种：链接克隆和完整克隆，选择一个即可；随后修改名称，完成即可；

>   **链接克隆和完整克隆：**
>
>   -   **链接克隆：母镜像损坏，克隆机都会损坏，但存储占有率低；**
>   -   **完整克隆：母镜像和克隆机互不影响，但存储占有率高；**

<br/>

### **修改克隆机并测试网络互通性**

通过镜像克隆两台虚拟机，取名为node1和node2；

修改各台虚拟机的配置，这里以node1为例：

```diff
$ vi /etc/sysconfig/network
NETWORKING=yes
- HOSTNAME=master
+ HOSTNAME=node1

$ vi /etc/sysconfig/network-scripts/ifcfg-ens33
TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
BOOTPROTO=static
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
- IPADDR=192.168.24.180
+ IPADDR=192.168.24.181
NETMASK=255.255.255.0
GATEWAY=192.168.24.2
NAME=ens33
DEVICE=ens33
ONBOOT=yes
DNS1=192.168.24.2
DNS2=114.114.114.114
```

node2虚拟机类似；

>   <font color="#f00">**注：克隆后`/etc/sysconfig/network`文件中的`HOSTNAME`字段也可能被删除了；**</font>
>
>   <font color="#f00">**这时只需要添加`HOSTNAME=具体节点名称`即可；**</font>

最后做测试，如在master去ping其他node：

```bash
[root@master ~]# ping node1
PING node1 (192.168.24.181) 56(84) bytes of data.
64 bytes from node1 (192.168.24.181): icmp_seq=1 ttl=64 time=0.183 ms
64 bytes from node1 (192.168.24.181): icmp_seq=2 ttl=64 time=0.192 ms
64 bytes from node1 (192.168.24.181): icmp_seq=3 ttl=64 time=0.175 ms
^C
--- node1 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 1999ms
rtt min/avg/max/mdev = 0.175/0.183/0.192/0.013 ms
[root@master ~]# ping node2
PING node2 (192.168.24.182) 56(84) bytes of data.
64 bytes from node2 (192.168.24.182): icmp_seq=1 ttl=64 time=0.274 ms
64 bytes from node2 (192.168.24.182): icmp_seq=2 ttl=64 time=0.235 ms
64 bytes from node2 (192.168.24.182): icmp_seq=3 ttl=64 time=0.199 ms
^C
--- node2 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2000ms
rtt min/avg/max/mdev = 0.199/0.236/0.274/0.030 ms
```

成功！

<br/>

### **创建Kubernetes集群**

#### **Master节点初始化**

在Master节点执行：

```bash
[root@master ~]# kubeadm init \
  --apiserver-advertise-address=192.168.24.180 \
  --image-repository registry.aliyuncs.com/google_containers \
  --kubernetes-version v1.20.2 \
  --service-cidr=10.96.0.0/12 \
  --pod-network-cidr=10.244.0.0/16 \
  --ignore-preflight-errors=all
```

说明：

-   `--apiserver-advertise-address`：<font color="#f00">**集群通告地址，就是Master节点的IP地址；**</font>
-   `--image-repository` ：<font color="#f00">**由于默认拉取镜像地址k8s.gcr.io国内无法访问，这里指定阿里云镜像仓库地址；**</font>
-   `--kubernetes-version`：<font color="#f00">**K8s版本，与上面安装的一致；**</font>
-   `--service-cidr`：<font color="#f00">**集群内部虚拟网络，Pod统一访问入口；**</font>
-   `--pod-network-cidr`：<font color="#f00">**Pod网络，与下面部署的CNI网络组件yaml中保持一致；**</font>

>   <font color="#f00">**注：集群内部虚拟地址和Pod网络地址可自行指定，但是必须要和下面的配置要保持一致！**</font>

>   **也可以使用配置文件引导初始化：**
>
>   ```bash
>   $ vi kubeadm.conf
>   apiVersion: kubeadm.k8s.io/v1beta2
>   kind: ClusterConfiguration
>   kubernetesVersion: v1.20.2
>   imageRepository: registry.aliyuncs.com/google_containers 
>   networking:
>     podSubnet: 10.244.0.0/16 
>     serviceSubnet: 10.96.0.0/12 
>   
>   $ kubeadm init --config kubeadm.conf --ignore-preflight-errors=all
>   ```
>
>   **这里不在赘述；**

等待一段时间后初始化结束，这时根据提示我们需要拷贝认证文件：

```bash
# 拷贝kubectl使用的连接k8s认证文件到默认路径
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config
```

>   同时还会创建鉴权token，类似于：
>
>   ```bash
>   kubeadm join 192.168.24.180:6443 --token w2mfe2.3pwfhv6nm9yueb4d \
>       --discovery-token-ca-cert-hash sha256:88b9219498210b9ac2f394e32b06a21ae58af887ff6566fa53f30fc9a9dd1ef3 --v=6
>   ```
>
>   <font color="#f00">**这个是稍后将子Node节点加入Master节点时需要的命令，需要先记下来；**</font>

此时查看Master节点的状态：

```bash
[root@master ~]# kubectl get nodes
NAME          STATUS     ROLES                  AGE     VERSION
master   NotReady   control-plane,master   2m15s   v1.20.2
```

这时master节点是`NotReady`的状态；

<font color="#f00">**这是因为我们还没有为Kubernetes安装对应的CNI（Container Network Interface，容器网络接口）插件；**</font>

<br/>

#### **安装Calico插件**

<font color="#f00">**CNI是Kubernetes中的一个调用网络实现的接口标准；**</font>

<font color="#f00">**Kubelet 通过这个标准的 API 来调用不同的网络插件以实现不同的网络配置方式，实现了这个接口的就是 CNI 插件，它实现了一系列的 CNI API 接口；**</font>

常用的CNI插件有很多，比如：

-   Flannel；
-   Calico；
-   Canal；
-   Weave；
-   ……

**这里我们选用的是Calico；**

>   **关于Calico：**
>
>   **Calico是一个纯三层的数据中心网络方案，Calico支持广泛的平台，包括Kubernetes、OpenStack等；**
>
>   **Calico 在每一个计算节点利用 Linux Kernel 实现了一个高效的虚拟路由器（ vRouter） 来负责数据转发，而每个 vRouter 通过 BGP 协议负责把自己上运行的 workload 的路由信息向整个 Calico 网络内传播；**
>
>   官方文档：
>
>   -   https://docs.projectcalico.org/getting-started/kubernetes/quickstart
>
>   相关阅读：
>
>   -   [CNI容器网络介绍](https://kubernetes.io/docs/concepts/cluster-administration/networking/#how-to-implement-the-kubernetes-networking-model)
>   -   [从零开始入门 K8s | 理解 CNI 和 CNI 插件](https://www.kubernetes.org.cn/6908.html)
>   -   [CNI - Container Network Interface（容器网络接口）](https://jimmysong.io/kubernetes-handbook/concepts/cni.html)
>   -   [Comparing Kubernetes CNI Providers: Flannel, Calico, Canal, and Weave](https://rancher.com/blog/2019/2019-03-21-comparing-kubernetes-cni-providers-flannel-calico-canal-and-weave/)

首先，通过wget下载Calico配置文件：

```bash
 wget https://docs.projectcalico.org/manifests/calico.yaml
```

随后修改配置文件中的`CALICO_IPV4POOL_CIDR`：

**修改Pod网络（CALICO_IPV4POOL_CIDR），与前面kubeadm init指定的一样；**

```diff
# 
vim calico.yaml 

# The default IPv4 pool to create on startup if none exists. Pod IPs will be
# chosen from this range. Changing this value after installation will have
# no effect. This should fall within `--cluster-cidr`.
-# - name: CALICO_IPV4POOL_CIDR
-#   value: "10.244.0.0/16"
+ - name: CALICO_IPV4POOL_CIDR
+   value: "10.244.0.0/16"
# Disable file logging so `kubectl logs` works.
```

最后通过配置文件启动服务：

```bash
kubectl apply -f calico.yaml
```

等待一段时间后，查看pod状态：

```bash
[root@master ~]# kubectl get pods -n kube-system
NAME                                       READY   STATUS    RESTARTS   AGE
calico-kube-controllers-6d7b4db76c-pkdfp   1/1     Running   1          18h
calico-node-5vmrs                          1/1     Running   2          18h
calico-node-95x84                          1/1     Running   1          18h
calico-node-tpx7f                          1/1     Running   2          18h
coredns-7f89b7bc75-lr8ch                   1/1     Running   1          18h
coredns-7f89b7bc75-z5j77                   1/1     Running   1          18h
etcd-master                                1/1     Running   2          18h
kube-apiserver-master                      1/1     Running   2          18h
kube-controller-manager-master             1/1     Running   2          18h
kube-proxy-5wtj8                           1/1     Running   2          18h
kube-proxy-b7h4t                           1/1     Running   2          18h
kube-proxy-kxhrs                           1/1     Running   2          18h
kube-scheduler-master                      1/1     Running   2          18h
```

可以看到，所有的服务都已经Running；

同时查看节点状态：

```bash
[root@master ~]# kubectl get nodes
NAME     STATUS   ROLES                  AGE   VERSION
master   Ready    control-plane,master   19h   v1.21.1
```

此时Master节点已经变为了Ready状态！

>   <font color="#f00">**注：在将Node节点加入Master之前必须先安装CNI（即使不是Calico）；**</font>
>
>   <font color="#f00">**否则有可能出现子节点无法连接Master的情况；**</font>

<br/>

#### **Node节点加入Master**

在Node节点中运行之前在Master节点初始化后`kubeadm init`输出的`kubeadm join`命令：

```bash
kubeadm join 192.168.24.180:6443 --token w2mfe2.3pwfhv6nm9yueb4d \
    --discovery-token-ca-cert-hash sha256:88b9219498210b9ac2f394e32b06a21ae58af887ff6566fa53f30fc9a9dd1ef3 --v=6
```

等待片刻，Node节点即加入至Master中；

**集群创建完毕！**

>   <font color="#f00">**注：默认token有效期为24小时，当过期之后，该token就不可用了；**</font>
>
>   这时就需要重新创建token，操作如下：
>
>   ```bash
>   kubeadm token create --print-join-command
>   ```
>
>   通过该命令可以快捷生成token；

<br/>

#### **部署WebUI（Dashboard）**

接下来为Kubernetes创建后台管理面板，方便查看和管理；

>   Dashboard的网址：
>
>   -   https://github.com/kubernetes/dashboard/

<font color="#f00">**使用时需要根据kubenetes版本选择Dashboard版本，此处为v2.1.0；**</font>

##### **① 下载并部署**

首先通过wget获取配置文件：

```bash
wget https://raw.githubusercontent.com/kubernetes/dashboard/v2.1.0/aio/deploy/recommended.yaml -O dashboard.yaml
```

<font color="#f00">**由于在默认情况下，Dashboard只能集群内部访问；因此，需要修改Service为NodePort类型，暴露到外部；**</font>

文件修改内容如下：

```diff
vi dashboard.yaml

kind: Service
apiVersion: v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
spec:
+ type: NodePort
  ports:
    - port: 443
      targetPort: 8443
+     nodePort: 30001
  selector:
    k8s-app: kubernetes-dashboard
```

随后，将配置文件应用：

```bash
kubectl apply -f dashboard.yaml
```

等待服务部署后查看：

```bash
[root@master ~]# kubectl get pods -n kubernetes-dashboard
NAME                                         READY   STATUS    RESTARTS   AGE
dashboard-metrics-scraper-79c5968bdc-ldvd7   1/1     Running   1          19h
kubernetes-dashboard-7448ffc97b-gpsv5        1/1     Running   1          19h
```

可以看到Dashboard已经成功跑起来了！

在浏览器访问：

-   https://192.168.24.180:30001/

出现下面的界面：

![k8s_dashboard.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/k8s_dashboard.png)

说明Dashboard部署成功；

在使用时需要添加用户及其权限以生成Token来登录；

<br/>

##### **② 创建用户角色**

下面在Master节点创建`service account`并绑定默认`cluster-admin`管理员集群角色；

创建用户：

```bash
[root@master ~]# kubectl create serviceaccount dashboard-admin -n kube-system
serviceaccount/dashboard-admin created
```

用户授权：

```bash
[root@master ~]# kubectl create clusterrolebinding dashboard-admin --clusterrole=cluster-admin --serviceaccount=kube-system:dashboard-admin
clusterrolebinding.rbac.authorization.k8s.io/dashboard-admin created
```

获取用户Token：

```bash
[root@master ~]# kubectl describe secrets -n kube-system $(kubectl -n kube-system get secret | awk '/dashboard-admin/{print $1}')
Name:         dashboard-admin-token-bbsrb
Namespace:    kube-system
Labels:       <none>
Annotations:  kubernetes.io/service-account.name: dashboard-admin
              kubernetes.io/service-account.uid: 9a01a52d-04a5-4ea6-b4f8-afdc22b1b9c6

Type:  kubernetes.io/service-account-token

Data
====
ca.crt:     1066 bytes
namespace:  11 bytes
token:      eyJhbGciOiJSUzI1NiIsImtpZCI6Inpvc2Y0dmREN3p1SU5GWUhuWWVNek92NDJzX2JFQm94N09Dd1Nwa1lWUnMifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlLXN5c3RlbSIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJkYXNoYm9hcmQtYWRtaW4tdG9rZW4tYmJzcmIiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoiZGFzaGJvYXJkLWFkbWluIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiOWEwMWE1MmQtMDRhNS00ZWE2LWI0ZjgtYWZkYzIyYjFiOWM2Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50Omt1YmUtc3lzdGVtOmRhc2hib2FyZC1hZG1pbiJ9.oAN9GWZlj6_HKdG_2KOLzjfysXpVBl6lcfarQThZYs-TaEtVzOfKqvAPe4e7yE93uunV-4ddr1fdyGDV3iwPPwpGF9B65IDn6XlM268agEwb2efNjlbwYku4NZt8RCgH_tf-IdvuwEiuYolaGvfYLGw1sQ6-Hphi4kw-G9KZgCAUYwcqhijGSwcZwP7GwMEsthqXLJE84mUHpqRj6QZoRV_vx3G54PyIplLrp04gkuLZArqcxxkY7Y9gibafbhKKbNbxY1v32lYIzG1VjwHb3vmLx_FABEilztYtU1alXfgtdvuiGBpfuzgXgOCgLyElRqUK04dWRCSIRHM3Ai9aRg
```

上述Token部分即为登录使用的Token；

>   <font color="#f00">**可将其保存在一个文件中，方便登录时使用**</font>

使用获取到的Token登录Dashboard；

登录后的界面和下面的类似（但是你应该是没有Nginx服务的）；

![k8s_dashboard.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/k8s_dashboard_2.png)

<br/>

### **测试Kubernetes集群**

既然服务已经部署完毕了，那么我们就来部署一个包含Nginx的Pod来测试一下吧！

创建一个部署的`Deployment`：

```bash
[root@master ~]# kubectl create deployment nginx --image=nginx
deployment.apps/nginx created
```

将Nginx服务暴露：

```bash
[root@master ~]# kubectl expose deployment nginx --port=80 --type=NodePort
service/nginx exposed
```

查看Pod和服务状态：

```bash
[root@master ~]# kubectl get pod,svc
NAME                         READY   STATUS    RESTARTS   AGE
pod/nginx-6799fc88d8-ld2qf   1/1     Running   1          19h

NAME                 TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
service/kubernetes   ClusterIP   10.96.0.1      <none>        443/TCP        19h
service/nginx        NodePort    10.98.182.12   <none>        80:32182/TCP   19h
```

在Master中访问Nginx：

```bash
[root@master ~]# curl 10.98.182.12
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
    body {
        width: 35em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
    }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

成功！

同时，我们也可以在面板上看到Nginx的服务：

![k8s_dashboard_nginx.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/k8s_dashboard_nginx.png)

至此，我们的K8S已经安装成功了，接下来就愉快的玩耍吧！

<br/>

## **附录**

文章参考：

-   [CentOS 7 上使用kubeadm搭建k8s集群](https://www.skynemo.cn/2021/02/18/%E5%AE%B9%E5%99%A8%E5%8F%8A%E8%99%9A%E6%8B%9F%E5%8C%96/k8s_install_with_kubeadm/)

扩展阅读：

-   [和我一步步部署 kubernetes 集群](https://github.com/opsnull/follow-me-install-kubernetes-cluster)
-   [Kubernetes网络之Calico](https://cloud.tencent.com/developer/article/1651077)

<br/>