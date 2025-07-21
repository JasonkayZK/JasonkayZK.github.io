---
title: debian12部署kubernetes-1.28集群
toc: true
cover: 'https://img.paulzzh.com/touhou/random?57'
date: 2025-07-21 10:41:07
categories: Kubernetes
tags: [Kubernetes, VMWare, Debian]
description: 由于暑假到了以及天气原因，学校的k8s集群暂时关闭了，但是目前还是有使用k8s的需求，花了2个小时又重新搭了一下。由于国内网络的问题，导致github包、镜像都很难拉下来，因此本文的内容更适合国内需求环境。
---

由于暑假到了以及天气原因，学校的k8s集群暂时关闭了，但是目前还是有使用k8s的需求，花了2个小时又重新搭了一下；

由于国内网络的问题，导致github包、镜像都很难拉下来，因此本文的内容更适合国内需求环境。

源代码：

-   https://github.com/JasonkayZK/kubernetes-learn

<br/>

<!--more-->

# **debian12部署kubernetes-1.28集群**

## **零、前置工作**

### **0、环境校验**

该部分内容来自于 [`K8S` 官方文档](https://kubernetes.io/zh-cn/docs/setup/production-environment/tools/kubeadm/install-kubeadm/)：

-   一台兼容的 `Linux` 主机。`Kubernetes` 项目为基于 `Debian` 和 `Red Hat` 的 `Linux` 发行版以及一些不提供包管理器的发行版提供通用的指令。
-   每台机器 `2 GB` 或更多的 `RAM`（如果少于这个数字将会影响你应用的运行内存）。
-   `CPU 2` 核心及以上。
-   集群中的所有机器的网络彼此均能相互连接（公网和内网都可以）。
-   节点之中不可以有重复的主机名、`MAC` 地址或 `product_uuid`。

<br/>

### **1、准备虚拟机**

| IP Address      | Hostname | CPU  | Memory | Storage | OS Release | Role   |
| --------------- | -------- | ---- | ------ | ------- | ---------- | ------ |
| 192.168.117.200 | k1       | 4C   | 8G     | 100GB   | Debian 12  | Master |
| 192.168.117.201 | k2       | 4C   | 8G     | 100GB   | Debian 12  | Worker |
| 192.168.117.202 | k3       | 4C   | 8G     | 100GB   | Debian 12  | Worker |

虚拟机安装、配置部分不再赘述了！

主要包括下面几个方面：

-   配置软件源；
-   配置静态IP；
-   配置 hosts 解析；
-   配置 SSH 免密登录；
-   安装必要工具：net-tools、wget、curl、htop等；

>   参考：
>
>   -   [《从零开始搭建大数据镜像-1》](/2021/08/21/%E4%BB%8E%E9%9B%B6%E5%BC%80%E5%A7%8B%E6%90%AD%E5%BB%BA%E5%A4%A7%E6%95%B0%E6%8D%AE%E9%95%9C%E5%83%8F-1/)

<br/>

### **2、卸载docker（如有）**

新版本的 k8s 和 docker 底层都依赖 containerd 容易造成冲突，直接卸载docker：

```bash
sudo apt-get purge docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-ce-rootless-extras

sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
sudo rm -rf /etc/docker
```

<br/>

### **3、设置系统时区和时间同步**

使用阿里云的时钟源：

```bash
timedatectl set-timezone Asia/Shanghai

# 安装 chrony
apt-get install -y chrony

# 修改为阿里的时钟源
sed -i "s/pool 2.debian.pool.ntp.org iburst/server ntp.aliyun.com iburst/g" /etc/chrony/chrony.conf

# 启用并立即启动 chrony 服务
systemctl restart chrony
systemctl enable chrony

# 查看与 chrony 服务器同步的时间源
chronyc sources
```

<br/>

### **4、安装ipvs工具**

在 `Kubernetes` 中，`ipset` 和 `ipvsadm` 的用途：

-   `ipset` 主要用于支持 `Service` 的负载均衡和网络策略。它可以帮助实现高性能的数据包过滤和转发，以及对 `IP` 地址和端口进行快速匹配。
-   `ipvsadm` 主要用于配置和管理 `IPVS` 负载均衡器，以实现 `Service` 的负载均衡。

执行：

```bash
apt-get install -y ipset ipvsadm 
```

<br/>

### **5、关闭服务**

关闭 swap、防火墙等：

```bash
# 关闭所有已激活的 swap 分区
swapoff -a

# 禁用系统启动时自动挂载 swap 分区
sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

# 停止 AppArmor 服务
systemctl stop apparmor.service

# 禁用 AppArmor 服务
systemctl disable apparmor.service

# 禁用 Uncomplicated Firewall（ufw）
ufw disable

# 停止 ufw 服务
systemctl stop ufw.service

# 禁用 ufw 服务
systemctl disable ufw.service
```

<br/>

### **6、内核优化**

创建一个名为 kubernetes.conf 的内核配置文件，并写入以下配置内容：

```bash
cat > /etc/sysctl.d/kubernetes.conf << EOF
# 允许 IPv6 转发请求通过iptables进行处理（如果禁用防火墙或不是iptables，则该配置无效）
net.bridge.bridge-nf-call-ip6tables = 1

# 允许 IPv4 转发请求通过iptables进行处理（如果禁用防火墙或不是iptables，则该配置无效）
net.bridge.bridge-nf-call-iptables = 1

# 启用IPv4数据包的转发功能
net.ipv4.ip_forward = 1

# 禁用发送 ICMP 重定向消息
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# 提高 TCP 连接跟踪的最大数量
net.netfilter.nf_conntrack_max = 1000000

# 提高连接追踪表的超时时间
net.netfilter.nf_conntrack_tcp_timeout_established = 86400

# 提高监听队列大小
net.core.somaxconn = 1024

# 防止 SYN 攻击
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2

# 提高文件描述符限制
fs.file-max = 65536

# 设置虚拟内存交换（swap）的使用策略为0，减少对磁盘的频繁读写
vm.swappiness = 0
EOF
```

加载或启动内核模块 br_netfilter，该模块提供了网络桥接所需的网络过滤功能

```
modprobe br_netfilter
```

查看是否已成功加载模块：

```bash
lsmod | grep br_netfilter
```

将读取该文件中的参数设置，并将其应用到系统的当前运行状态中：

```bash
sysctl -p /etc/sysctl.d/kubernetes.conf
```

>   参考：
>
>   -   [Linux操作系统-内核优化](https://isekiro.com/linux操作系统-内核优化/)

<br/>

### **7、内核模块配置**

将自定义在系统引导时自动加载的内核模块：

```bash
# 将自定义在系统引导时自动加载的内核模块
cat > /etc/modules-load.d/kubernetes.conf << EOF
# /etc/modules-load.d/kubernetes.conf

# Linux 网桥支持
br_netfilter

# IPVS 加载均衡器
ip_vs
ip_vs_rr
ip_vs_wrr
ip_vs_sh

# IPv4 连接跟踪
nf_conntrack_ipv4

# IP 表规则
ip_tables
EOF
```

添加可执行权限：

```bash
chmod a+x /etc/modules-load.d/kubernetes.conf
```

<br/>

### **8、安装containerd运行时**

>   **以下指令适用于 Kubernetes 1.28！**

#### **（1）安装**

安装 containerd：

```bash
# cri-containerd 比 containerd 多了 runc
wget https://github.com/containerd/containerd/releases/download/v1.7.21/cri-containerd-1.7.21-linux-amd64.tar.gz

tar xf cri-containerd-1.7.21-linux-amd64.tar.gz -C /

# 创建目录，该目录用于存放 containerd 配置文件
mkdir /etc/containerd

# 创建一个默认的 containerd 配置文件
containerd config default > /etc/containerd/config.toml

# 修改配置文件中使用的沙箱镜像版本
sed -i 's#registry.k8s.io/pause:3.8#registry.aliyuncs.com/google_containers/pause:3.9#' /etc/containerd/config.toml

# 设置容器运行时（containerd + CRI）在创建容器时使用 Systemd Cgroups 驱动
sed -i '/SystemdCgroup/s/false/true/' /etc/containerd/config.toml

# 修改存储目录
# mkdir /data1/containerd
# sed -i 's#root = "/var/lib/containerd"#root = "/data1/containerd"#' /etc/containerd/config.toml
```

<br/>

#### **（2）配置脚本**

配置启动脚本：

/lib/systemd/system/containerd.service

```ini
[Unit]
Description=containerd container runtime
Documentation=https://containerd.io
After=network.target local-fs.target

[Service]
ExecStartPre=-/sbin/modprobe overlay
ExecStart=/usr/local/bin/containerd

Type=notify
Delegate=yes
KillMode=process
Restart=always
RestartSec=5

LimitNPROC=infinity
LimitCORE=infinity

TasksMax=infinity
OOMScoreAdjust=-999

[Install]
WantedBy=multi-user.target
```

执行配置：

```bash
# 启用并立即启动 containerd 服务
systemctl enable --now containerd.service

# 检查 containerd 服务的当前状态
systemctl status containerd.service

# 检查 containerd crictl runc 的版本
containerd --version
crictl --version
runc --version

crictl config runtime-endpoint unix:///run/containerd/containerd.sock
```

<br/>

## **一、安装组件**

更新 apt 包索引并安装使用 Kubernetes apt 仓库所需要的包：

```bash
sudo apt-get update

# apt-transport-https 可能是一个虚拟包（dummy package）；如果是的话，你可以跳过安装这个包
sudo apt-get install -y apt-transport-https ca-certificates curl gpg

#下载用于 Kubernetes 软件包仓库的公共签名密钥。所有仓库都使用相同的签名密钥，因此你可以忽略URL中的版本：
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.28/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

#添加 Kubernetes apt 仓库。 请注意，此仓库仅包含适用于 Kubernetes 1.28 的软件包； 对于其他 Kubernetes 次要版本，则需要更改 URL 中的 Kubernetes 次要版本以匹配你所需的次要版本 （你还应该检查正在阅读的安装文档是否为你计划安装的 Kubernetes 版本的文档）。
# 此操作会覆盖 /etc/apt/sources.list.d/kubernetes.list 中现存的所有配置。
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.28/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list

#更新 apt 包索引，安装 kubelet、kubeadm 和 kubectl，并锁定其版本：
sudo apt-get update
sudo apt-get install -y kubelet=1.28.13-1.1 kubeadm=1.28.13-1.1 kubectl=1.28.13-1.1

#锁定版本
sudo apt-mark hold kubelet kubeadm kubectl

#说明：在 Debian 12 和 Ubuntu 22.04 之前的早期版本中，默认情况下不存在 /etc/apt/keyrings 目录； 你可以通过运行 sudo mkdir -m 755 /etc/apt/keyrings 来创建它。
```

配置 kubelet 开机启动：

```bash
systemctl enable kubelet
```

<br/>

## **二、初始化集群**

### **1、初始化集群（Master节点执行）**

>   **本小节在 master 节点执行！**

生成配置文件：

```bash
kubeadm config print init-defaults > kubeadm.yaml
```

配置文件如下：

kubeadm.yaml

```yaml
apiVersion: kubeadm.k8s.io/v1beta3
bootstrapTokens:
- groups:
  - system:bootstrappers:kubeadm:default-node-token
  token: abcdef.0123456789abcdef
  ttl: 24h0m0s
  usages:
  - signing
  - authentication
kind: InitConfiguration
#localAPIEndpoint:
#  advertiseAddress: 192.168.2.232
#  bindPort: 6443
nodeRegistration:
  criSocket: unix:///run/containerd/containerd.sock
  imagePullPolicy: IfNotPresent
#  name: node
  taints: null
---
apiServer:
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta3
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controllerManager: {}
dns: {}
etcd:
  local:
    dataDir: /var/lib/etcd
# 指定阿里云镜像以及k8s版本
imageRepository: registry.cn-hangzhou.aliyuncs.com/google_containers
kind: ClusterConfiguration
kubernetesVersion: 1.28.13
# 新增
controlPlaneEndpoint: 192.168.117.200:6443 # 修改为masterIP！
networking:
  dnsDomain: cluster.local
  serviceSubnet: 10.254.0.0/16
  podSubnet: 10.255.0.0/16  # 指定pod网段
scheduler: {}

# 新增如下：
---
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
cgroupDriver: systemd
---
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
mode: ipvs
```

验证镜像仓配置是否生效。

```bash
kubeadm config images list --config=kubeadm.yaml
```

提前拉取镜像。

```bash
kubeadm config images pull --config=kubeadm.yaml
```

查看镜像是否下载。

```bash
crictl images
```

开始初始化。

```bash
kubeadm init --config=kubeadm.yaml
```

安装完会有加入集群的相关指令：

```bash
You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

You can now join any number of control-plane nodes by copying certificate authorities
and service account keys on each node and then running the following as root:

  kubeadm join 192.168.117.200:6443 --token abcdef.0123456789abcdef \
        --discovery-token-ca-cert-hash sha256:91a2398cbadf3967950dc6900e7411d5319e82ad30e139a1163896f9a8c61234 \
        --control-plane 

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 192.168.117.200:6443 --token abcdef.0123456789abcdef \
        --discovery-token-ca-cert-hash sha256:91a2398cbadf3967950dc6900e7411d5319e82ad30e139a1163896f9a8c61234
```

<br/>

### **2、Worker加入集群（Worker节点）**

>   **此小节在 worker 节点执行！**

执行加入脚本：

```bash
kubeadm join 192.168.117.200:6443 --token abcdef.0123456789abcdef \
        --discovery-token-ca-cert-hash sha256:91a2398cbadf3967950dc6900e7411d5319e82ad30e139a1163896f9a8c61234
```

等待后即可加入！

<br/>

### **3、Master节点污点（可选）**

默认情况下 Master 节点为 `control-plane`，无法部署服务；

可以通过执行：

```bash
# 查看污点
kubectl describe node k1 |grep Taints
Taints:    node-role.kubernetes.io/control-plane:NoSchedule

# 删除污点
kubectl taint node k1 node-role.kubernetes.io/control-plane:NoSchedule-
```

启用 master 节点调度！

<br/>

### **补：其他节点使用kubectl**

其他节点默认是无法直接使用 kubectl 管理集群的，我们只需要将配置文件复制到其他节点即可！

**方法一：拷贝master节点的/etc/kubernetes/admin.conf 到nodes节点中的同样的目录/etc/kubernetes/ ，然后再配置环境变量**

```bash
[root@k8s-node1 qq-5201351]# scp k8s-master:/etc/kubernetes/admin.conf /etc/kubernetes/admin.conf
```

然后再配置环境变量：

```bash
echo 'export KUBECONFIG=/etc/kubernetes/admin.conf' >> ~/.bash_profile
source ~/.bash_profile
```

 <br/>

**方法二：拷贝master节点的/etc/kubernetes/admin.conf 到nodes节点的$HOME/.kube目录，并且命名为config**

因为默认是没有 `$HOME/.kube` 目录的，先进行创建：

-   **mkdir -p $HOME/.kube**
-   **scp k8s-master:/etc/kubernetes/admin.conf $HOME/.kube/config**

<br/>

## **三、网络插件**

### **1、安装Calico**

k8s 部署完成后还不能使用，需要配置网络插件，从而为 Pod 分配 IP，打通网络等等。

>   Calico是 **目前开源的最成熟的纯三层网络框架之一**， 是一种广泛采用、久经考验的开源网络和网络安全解决方案，适用于 Kubernetes、虚拟机和裸机工作负载。 Calico 为云原生应用提供两大服务：工作负载之间的网络连接和工作负载之间的网络安全策略。
>
>   Calico 访问链接：[projectcalico.docs.tigera.io/about/](https://link.juejin.cn/?target=https%3A%2F%2Fprojectcalico.docs.tigera.io%2Fabout%2Fabout-calico)

在这里使用 calico 来做为集群的网络插件，官网提供2种安装方式：

-   operator 的方式修改镜像比较麻烦，这里不使用；
-   通过yaml配置文件的方式；

```bash
curl https://raw.githubusercontent.com/projectcalico/calico/v3.28.1/manifests/calico.yaml -O
```

**配置：**

-   **修改 `CALICO_IPV4POOL_CIDR` 为我们的网段（本文为：`10.254.0.0/16`）**
-   **修改 `CALICO_IPV4POOL_IPIP` 为 `Always` 启用 ipip 协议；**

```diff
- # - name: CALICO_IPV4POOL_CIDR
- #   value: "192.168.0.0/16"
+ - name: CALICO_IPV4POOL_CIDR
+   value: "10.254.0.0/16"

# Enable IPIP
+ - name: CALICO_IPV4POOL_IPIP
+   value: "Always"
```

**修改镜像地址：**

搜索 `image:` 将镜像修改：

```diff
- image: docker.io/calico/cni:v3.28.1
+ image: registry.cn-hangzhou.aliyuncs.com/jasonkay/cni:v3.28.1

- image: docker.io/calico/node:v3.28.1
+ image: registry.cn-hangzhou.aliyuncs.com/jasonkay/node:v3.28.1

- image: docker.io/calico/kube-controllers:v3.28.1
+ image: registry.cn-hangzhou.aliyuncs.com/jasonkay/kube-controllers:v3.28.1
```

>   **即，将：`docker.io/calico` 替换为 `registry.cn-hangzhou.aliyuncs.com/jasonkay` （我在阿里云上同步的镜像）！**

随后执行：

```bash
kubectl apply -f calico.yaml
```

等待部署完成即可！

<br/>

### **2、验证**

验证 coredns dns 转发是否正常：

```bash
# 安装dns工具
apt install -y dnsutils

# 获取dns ip地址
kubectl get svc -n kube-system
NAME       TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                  AGE
kube-dns   ClusterIP   10.254.0.10   <none>        53/UDP,53/TCP,9153/TCP   15h

# 测试能够解析
dig -t a www.baidu.com @10.254.0.10
```

<br/>

## **四、部署应用测试**

部署 nginx 进行测试：

nginx-deploy.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: registry.cn-hangzhou.aliyuncs.com/jasonkay/nginx:latest
        ports:
        - containerPort: 80

---

apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  type: NodePort
  selector:
    app: nginx
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
      nodePort: 31080
```

应用：

```bash
kubectl apply -f nginx-deploy.yaml
```

然后访问 `k8s-ip:31080`，能够正常访问 Nginx！

<br/>

## **五、安装Helm**

Helm 是 Kubernetes 的一个包管理工具，类似于 Linux 的 Apt 或 Yum；

这个工具能帮助开发者和系统管理员更方便地管理在 Kubernetes 集群上部署、更新、卸载应用。

`Helm` 中的三个主要概念：

| 概念       | 描述                                                 |
| ---------- | ---------------------------------------------------- |
| Chart      | 在 Kubernetes 集群上部署应用所需的所有资源定义的包   |
| Release    | 在 Kubernetes 集群上部署的 Chart 的实例              |
| Repository | Chart 的存储位置，类似软件仓库，用于分发和分享 Chart |

安装脚本：

```bash
1. 添加 Helm 的官方 GPG key
root@k8s-master:~# curl https://baltocdn.com/helm/signing.asc | gpg --dearmor -o /usr/share/keyrings/helm-keyring.gpg

2. 添加 Helm 的官方 APT 仓库
root@k8s-master:~# echo "deb [signed-by=/usr/share/keyrings/helm-keyring.gpg] https://baltocdn.com/helm/stable/debian/ all main" | tee /etc/apt/sources.list.d/helm-stable-debian.list

3. 更新 apt 源
root@k8s-master:~# apt-get update

4. 安装 Helm
root@k8s-master:~# apt-get install -y helm

5. 检查 Helm 是否已正确安装
root@k8s-master:~# helm version
version.BuildInfo{Version:"v3.13.3", GitCommit:"c8b948945e52abba22ff885446a1486cb5fd3474", GitTreeState:"clean", GoVersion:"go1.20.11"}
```

<br/>

## **六、安装面板KubeSphere**

官方提供的面板不太好用，这里推荐使用 KubeSphere；

配置下载区域：

```bash
export KKZONE=cn
```

安装也很简单，使用 helm 即可，而且支持国内：

```bash
helm upgrade --install -n kubesphere-system \
  --create-namespace ks-core \
  https://charts.kubesphere.com.cn/main/ks-core-1.1.4.tgz \
  --debug --wait \
  --set global.imageRegistry=swr.cn-southwest-2.myhuaweicloud.com/ks \
  --set extension.imageRegistry=swr.cn-southwest-2.myhuaweicloud.com/ks
```

等待所有 Pod 就绪后，安装完成，显示：

```
NOTES:
Thank you for choosing KubeSphere Helm Chart.

Please be patient and wait for several seconds for the KubeSphere deployment to complete.

1. Wait for Deployment Completion

    Confirm that all KubeSphere components are running by executing the following command:

    kubectl get pods -n kubesphere-system

2. Access the KubeSphere Console

    Once the deployment is complete, you can access the KubeSphere console using the following URL:

    http://192.168.6.10:30880

3. Login to KubeSphere Console

    Use the following credentials to log in:

    Account: admin
    Password: P@88w0rd

NOTE: It is highly recommended to change the default password immediately after the first login.

For additional information and details, please visit https://kubesphere.io.
```

执行以下命令检查 Pod 状态。

```
kubectl get pods -n kubesphere-system
```

当 Pod 状态都为 **Running** 时，使用默认的账户和密码 (admin/P@88w0rd) 通过 `<NodeIP>:30880` 访问 KubeSphere Web 控制台！

<br/>

## **七、工具推荐**

### **1、kubectx**

推荐安装 kubectx，可以切换k8s上下文（管理多个集群）；

并且 kubectx 自带了另一个工具：kubens，可以方便切换默认的 namespace；

安装：

```bash
apt install -y kubectx
```

<br/>

### **2、nerdctl**

nerdctl 可以提供在宿主机上类 docker 的操作（操作 containerd），可以提升用户体验：

```bash
cd /tmp
wget https://github.com/containerd/nerdctl/releases/download/v1.7.6/nerdctl-1.7.6-linux-amd64.tar.gz
tar xf nerdctl-1.7.6-linux-amd64.tar.gz
mv nerdctl /usr/sbin
```

<br/>

# **附录**

参考文章：

-   https://isekiro.com/kubernetes%E5%9F%BA%E7%A1%80-debian-%E9%83%A8%E7%BD%B2k8s-1.28/
-   https://juejin.cn/post/7300419978486169641
-   https://www.cnblogs.com/5201351/p/17407406.html
-   https://kubesphere.io/zh/docs/v4.1/02-quickstart/01-install-kubesphere/

源代码：

-   https://github.com/JasonkayZK/kubernetes-learn

<br/>
