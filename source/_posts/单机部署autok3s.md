---
title: 单机部署autok3s
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?13'
date: 2022-10-22 13:20:42
categories: Kubernetes
tags: [Kubernetes, autok3s]
description: 在上一篇文章中，我们讲了k3s的部署，这篇主要是讲解如何使用autok3s快速部署一个k3s集群；
---

在上一篇文章 [《单机部署k3s》](https://jasonkayzk.github.io/2022/10/21/单机部署k3s/) 中，我们讲了k3s的部署，这篇主要是讲解如何使用autok3s快速部署一个k3s集群；

autok3s快速启动脚本：

-   https://github.com/JasonkayZK/docker-repo/blob/master/autok3s.sh

<br/>

<!--more-->

# **单机部署autok3s**

## **AutoK3s介绍**

上一篇文章 [《单机部署k3s》](https://jasonkayzk.github.io/2022/10/21/单机部署k3s/) 讲述了 k3s 的基本部署和使用。

由于在 k3s 上，默认 master 节点是可以作为工作节点的（`tainted`），因此我们可以直接使用我们的单节点 k3s；

不过如果想要增加 worker 节点、将单个 master 节点变为高可用的集群，还是比较麻烦的；

此时可以使用 [autok3s](https://github.com/cnrancher/autok3s) 来部署 k3s 集群；

AutoK3s 是用于简化 K3s 集群管理的轻量级工具，可以使用 AutoK3s 在任何地方运行 K3s 服务！

下面是来自 AutoK3s 文档中展示的一些 feature：

-   通过 API、CLI 和 UI 等方式快速创建 K3s。
-   云提供商集成（简化 [CCM](https://kubernetes.io/docs/concepts/architecture/cloud-controller) 设置）。
-   灵活安装选项，例如 K3s 集群 HA 和数据存储（内置 etcd、RDS、SQLite 等）。
-   低成本（尝试云中的竞价实例）。
-   通过 UI 简化操作。
-   多云之间弹性迁移，借助诸如 [backup-restore-operator](https://github.com/rancher/backup-restore-operator) 这样的工具进行弹性迁移。

同时，AutoK3s 可以支持多个云厂商：

-   [阿里云](https://docs.rancher.cn/docs/k3s/autok3s/alibaba/_index) - 在阿里云的 ECS 中初始化 K3s 集群
-   [AWS](https://docs.rancher.cn/docs/k3s/autok3s/aws/_index) - 在亚马逊 EC2 中初始化 K3s 集群
-   [Google](https://docs.rancher.cn/docs/k3s/autok3s/google/_index) - 在Google GCE 中初始化 K3s 集群
-   [腾讯云](https://docs.rancher.cn/docs/k3s/autok3s/tencent/_index) - 在腾讯云 CVM 中初始化 K3s 集群
-   [Native](https://docs.rancher.cn/docs/k3s/autok3s/native/_index) - 在任意类型 VM 实例中初始化 K3s 集群
-   [K3d](https://docs.rancher.cn/docs/k3s/autok3s/k3d/_index) - 使用 K3d 在宿主机 Docker 中初始化 K3s 集群
-   [Harvester](https://docs.rancher.cn/docs/k3s/autok3s/harvester/_index) - 在 Harvester 实例中初始化 K3s 集群

<font color="#f00">**当然，我觉得最方便的就是 K3d 的形式，即：直接在宿主机 Docker 中初始化 K3s 集群！**</font>

>   autok3s 官方文档：
>
>   -   https://docs.rancher.cn/docs/k3s/autok3s/_index/

<br/>

## **部署AutoK3s**

对于学习、研究来说 [K3d](https://docs.rancher.cn/docs/k3s/autok3s/k3d/_index) 的形式是最好，也是最方便的：**你只需要一台安装了 Docker 的设备即可！**

可以通过下面的命令直接一键部署好 AntoK3s：

```bash
docker run -itd --restart=always --name=my-autok3s --net host -v /var/run/docker.sock:/var/run/docker.sock cnrancher/autok3s:v0.5.2
```

<font color="#f00">**这里需要注意，如果想要在 docker 中使用 K3d provider，则需要使用宿主机网络启动 AutoK3s 镜像，即声明：**</font>

-   **`--net host`**

<font color="#f00">**同时由于我们是 K3d 的形式，因此也必须将 `docker.sock` 挂载到容器中！**</font>

可以看到容器已经起来了：

```bash
$ docker ps -l
CONTAINER ID   IMAGE                      COMMAND                  CREATED              STATUS              PORTS     NAMES
ec80a4bc165e   cnrancher/autok3s:v0.5.2   "autok3s serve --bin…"   About a minute ago   Up About a minute             my-autok3s
```

**我们可以直接通过访问 `server-ip:8080` 访问 AutoK3s！**

>   **Mac 部署AutoK3s有坑！更多内容，见：**
>
>   -   https://docs.rancher.cn/docs/k3s/autok3s/k3d/_index

<br/>

## **使用AutoK3s快速创建一个集群**

我们可以使用快速创建功能，在指定的云提供商服务中，快速启动一个K3s集群！

以下图为例，我们将在 Docker 中使用默认配置创建一个单节点的 K3s 集群：

![](https://docs.rancher.cn/assets/images/quick-start-k3d-adfefb922df43268344eb61a2644e0f1.png)

简单情况下，可以只设置 master、worker节点数，以及集群名称即可部署！

具体内容可见：

-   https://docs.rancher.cn/docs/k3s/autok3s/k3d/_index

<br/>

## **集群管理**

### **添加节点**

在集群管理中，我们可以选中要添加节点的集群，点击右侧下拉菜单中的 **Join Node** 按钮，在弹出的窗口中设置要添加的节点数量即可；

![](https://docs.rancher.cn/assets/images/join-nodes-9fecfbf80d26c6b96e1520bac2aacae9.png)

<br/>

### **配置kubeconfig**

几乎所有场景我们都会使用 `kubectl` 来管理我们的集群，此时可以点击右上角 **Launch Kubectl** 按钮，在下拉框中选择要操作的集群后，便可以在 UI 控制台操作选中的集群；

![](https://docs.rancher.cn/assets/images/launch-kubectl-5cef4dd0d43db3a880b7ce5dffc06598.png)

**不过这种方式需要在 Web 界面去操作，非常麻烦；**

<font color="#f00">**AutoK3s 还提供了Kubeconfig 文件，可以单独下载指定集群的 Kubeconfig 文件！**</font>

点击指定集群右侧下拉菜单中的 **Download KubeConfig** 按钮，在弹出窗口中选择复制或下载文件；

![img](https://docs.rancher.cn/assets/images/download-kubeconfig-bc9db3f6e2dfbb9e27fb513e08a8157b.png)

随后将文件内容写到，例如：

-   `~/.kube/config`；

然后配置环境变量：

```bash
$ vi ~/.bashrc
export KUBECONFIG=/root/.kube/config

$ source ~/.bashrc
```

最后切换 kubectl 的 context：

```bash
kubectl config use-context k3d-my-k3s
```

**上面的 `k3d-my-k3s` 由你的 k3s 集群名称决定，取 `contexts.context.name` 配置即可！**

下面测试：

```bash
$ kubectl get nodes -A
NAME                  STATUS   ROLES                  AGE   VERSION
k3d-my-k3s-agent-0    Ready    <none>                 10m   v1.21.7+k3s1
k3d-my-k3s-server-0   Ready    control-plane,master   10m   v1.21.7+k3s1
k3d-my-k3s-agent-2    Ready    <none>                 10m   v1.21.7+k3s1
k3d-my-k3s-agent-1    Ready    <none>                 10m   v1.21.7+k3s1
```

可以看到，所有的节点都已经被创建！

<br/>

### **开启kube-explorer dashboard**

可以在Web界面通过右侧下拉菜单中选择 Enable Explorer 功能来开启 kube-explorer；

![img](https://docs.rancher.cn/assets/images/enable-kube-explorer-9440323ea3404319e17032ed8f556c51.png)

<br/>

## **总结**

相比于使用 k3s 单个部署，AutoK3s 提供了更方便的工具可以直接部署整个 K3s 集群！

还等什么，快去部署你自己的 K3s 集群吧！

<br/>

# **附录**

autok3s快速启动脚本：

-   https://github.com/JasonkayZK/docker-repo/blob/master/autok3s.sh


<br/>
