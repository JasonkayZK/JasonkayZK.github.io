---
title: CentOS7安装minikube
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?75'
date: 2021-05-26 22:00:37
categories: Kubernetes
tags: [Kubernetes, VMWare, CentOS]
description: 在上一篇《在VMWare中部署你的K8S集群》中，讲述了如何真正的部署一个K8S集群；但是这种方式对于大部分人来说有一点重；除了这种方式之外，也可以使用minikube来部署一个单节点的集群；本文就讲述了如何在国内使用阿里云镜像和minikube部署一个k8s集群；
---

在上一篇[《在VMWare中部署你的K8S集群》](/2021/05/16/在VMWare中部署你的K8S集群/)中，讲述了如何真正的部署一个K8S集群；但是这种方式对于大部分人来说有一点重；除了这种方式之外，也可以使用minikube来部署一个单节点的集群；

本文就讲述了如何在国内使用阿里云镜像和minikube部署一个k8s集群；

系列文章：

-   [在VMWare中部署你的K8S集群](/2021/05/16/在VMWare中部署你的K8S集群/)
-   [CentOS7安装minikube](/2021/05/26/CentOS7安装minikube/)

<br/>

<!--more-->

## **CentOS7安装minikube**

在使用minikube启动k8s集群之前需要先安装`kubectl`和`minikube`；

>   <font color="#f00">**这里和使用`kubeadm`不同，minikube不会自带`kubectl`和`kubelet`；**</font>

本文安装的版本为`1.20.2`；

<br/>

### **安装kubectl和minikube**

`kubectl`和`minikube`的安装非常的简单，直接在官网分别下载二进制文件，增加可执行权限，然后移动文件到`$PATH`下（如`/usr/local/bin/`目录）即可；

#### **① 安装kubectl**

下载kubectl：

```bash
curl -Lo kubectl "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && && chmod +x kubectl && sudo mv kubectl /usr/local/bin/
```

>   **说明：**
>
>   如需下载某个指定的版本，请用指定版本号替换该命令的这一部分： `$(curl -L -s https://dl.k8s.io/release/stable.txt)`；
>
>   例如，要在 Linux 中下载 v1.21.0 版本，请输入：
>
>   ```bash
>   curl -LO https://dl.k8s.io/release/v1.21.0/bin/linux/amd64/kubectl
>   ```

<br/>

#### **② 安装minikube**

下载并安装：

```bash
curl -Lo minikube "https://kubernetes.oss-cn-hangzhou.aliyuncs.com/minikube/releases/v1.18.1/minikube-linux-amd64" && chmod +x minikube && sudo mv minikube /usr/local/bin/
```

>   也可以使用国内的yum源安装`kubectl`和`minikube`，见：
>
>   -   [安装kubelet kubeadm kubectl（国内镜像源）](https://www.orchome.com/10036)

<br/>

### **使用minikube启动K8S集群**

直接使用minikube启动K8S集群即可：

```bash
minikube start \
--image-mirror-country=cn \
--registry-mirror='https://t9ab0rkd.mirror.aliyuncs.com' \
--image-repository='registry.cn-hangzhou.aliyuncs.com/google_containers' \
--vm-driver=none
```

>   **注：**
>
>   -   <font color="#f00">**这里使用的是阿里云的镜像；**</font>
>   -   <font color="#f00">**执行前需要安装Docker；**</font>
>
>   **注2：**
>
>   <font color="#f00">**因为我是在VMWare的CentOS7系统中部署的，所以`--vm-driver`设置为了`none`！；**</font>
>
>   <font color="#f00">**而Linux默认的`--vm-driver`选型为`docker`，如果你是以root身份启动minikube，可能会报错：**</font>
>
>   ```bash
>   [root@localhost ~]# minikube start \> --image-mirror-country=cn \
>   > --registry-mirror='https://t9ab0rkd.mirror.aliyuncs.com' \
>   > --image-repository='registry.cn-hangzhou.aliyuncs.com/google_containers'
>   😄  minikube v1.20.0 on Centos 7.9.2009
>   ✨  Automatically selected the docker driver. Other choices: none, ssh
>   🛑  The "docker" driver should not be used with root privileges.
>   💡  If you are running minikube within a VM, consider using --driver=none:
>   📘    https://minikube.sigs.k8s.io/docs/reference/drivers/none/
>   
>   ❌  Exiting due to DRV_AS_ROOT: The "docker" driver should not be used with root privileges.
>   ```
>
>   这时需要给Docker添加（非root）用户组：
>
>   **Add new User**
>
>   ```bash
>   adduser developer
>   # password@7
>   usermod -aG sudo developer
>   su - developer
>   ```
>
>   **Login to the newly created User**
>
>   ```bash
>   su - developer
>   # password@7
>   ```
>
>   **Add User to the Docker Group**
>
>   ```bash
>   sudo groupadd docker
>   sudo usermod -aG docker $USER
>   - Re-Login or Restart the Server
>   ```
>
>   **Start minikube with Docker Driver**
>
>   ```bash
>   minikube start --driver=docker
>   ```
>
>   **Verify minikube Installation**
>
>   ```bash
>   docker ps
>   ```
>
>   详见：
>
>   -   https://github.com/kubernetes/minikube/issues/7903

正常启动后，minikube会输出：

```bash
[root@localhost ~]# minikube start \
> --image-mirror-country=cn \
> --registry-mirror='https://t9ab0rkd.mirror.aliyuncs.com' \
> --image-repository='registry.cn-hangzhou.aliyuncs.com/google_containers' \
> --vm-driver=none
😄  minikube v1.20.0 on Centos 7.9.2009
✨  Using the none driver based on user configuration
✅  Using image repository registry.cn-hangzhou.aliyuncs.com/google_containers
👍  Starting control plane node minikube in cluster minikube
🤹  Running on localhost (CPUs=8, Memory=15866MB, Disk=48908MB) ...
ℹ️  OS release is CentOS Linux 7 (Core)
🐳  Preparing Kubernetes v1.20.2 on Docker 20.10.6 ...
    ▪ Generating certificates and keys ...
    ▪ Booting up control plane ...
    ▪ Configuring RBAC rules ...
🤹  Configuring local host environment ...

❗  The 'none' driver is designed for experts who need to integrate with an existing VM
💡  Most users should use the newer 'docker' driver instead, which does not require root!
📘  For more information, see: https://minikube.sigs.k8s.io/docs/reference/drivers/none/

❗  kubectl and minikube configuration will be stored in /root
❗  To use kubectl or minikube commands as your own user, you may need to relocate them. For example, to overwrite your own settings, run:

    ▪ sudo mv /root/.kube /root/.minikube $HOME
    ▪ sudo chown -R $USER $HOME/.kube $HOME/.minikube

💡  This can also be done automatically by setting the env var CHANGE_MINIKUBE_NONE_USER=true
🔎  Verifying Kubernetes components...
    ▪ Using image registry.cn-hangzhou.aliyuncs.com/google_containers/k8s-minikube/storage-provisioner:v5 (global image repository)
🌟  Enabled addons: storage-provisioner, default-storageclass
🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
```

看到`🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default`说明我们的安装没毛病！

通过kubectl查看：

```bash
[root@localhost ~]# minikube status
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured

[root@localhost ~]# kubectl cluster-info 
Kubernetes control plane is running at https://192.168.24.88:8443
KubeDNS is running at https://192.168.24.88:8443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.

[root@localhost ~]# kubectl get svc
NAME         TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   7m54s
```

可以看到服务正常启动了；

并且通过Portainer也可以查看到服务容器都已经起来了：

![minikube.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/minikube.png)

接下来我们拉取一个服务测试一下；

<br/>

### **K8S集群测试**

在进行集群测试时我们需要拉取镜像，这里仍然需要使用阿里云的镜像：

#### **创建Deployment**

下面的命令会拉取echoserver镜像，并创建一个deployment：

```bash
kubectl create deployment hello-minikube \
--image=registry.aliyuncs.com/google_containers/echoserver:1.10
```

查看：

```bash
[root@localhost ~]# kubectl get deployments.apps 
NAME             READY   UP-TO-DATE   AVAILABLE   AGE
hello-minikube   0/1     1            0           15s
[root@localhost ~]# kubectl get deployments.apps 
NAME             READY   UP-TO-DATE   AVAILABLE   AGE
hello-minikube   1/1     1            1           29s
```

此时Deployment已经Ready；

#### **导出Service**

使用下面的命令暴露Service，并取暴露8080端口：

```bash
kubectl expose deployment hello-minikube --type=NodePort --port=8080
```

>   <font color="#f00">**与在真正的K8S中直接使用`--type=LoadBalance`暴露服务不同，minikube中没有这个选项；**</font>
>
>   <font color="#f00">**需要使用`minikube service hello-minikube --url`查看所暴露服务的地址；**</font>

#### **查看状态**

使用下面的命令查看pod的状态：

```bash
[root@localhost ~]# kubectl get pods
NAME                              READY   STATUS    RESTARTS   AGE
hello-minikube-69485c8fcc-tnwwh   1/1     Running   0          2m50s
```

一开始可能是ContainerCreating状态，过一阵应该变成Running状态；

如果有问题可以用`kubectl describe pods`看问题；

#### **获取Service的url**

使用下面的命令获取minikube暴露的服务：

```bash
[root@localhost ~]# minikube service hello-minikube --url
http://192.168.24.88:31375
```

在本地使用浏览器打开，显示：

![echo_server.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/echo_server.png)

大功告成！

<br/>

## **附录**

系列文章：

-   [在VMWare中部署你的K8S集群](/2021/05/16/在VMWare中部署你的K8S集群/)
-   [CentOS7安装minikube](/2021/05/26/CentOS7安装minikube/)

文章参考：

-   [在 Linux 系统中安装并设置 kubectl](https://kubernetes.io/zh/docs/tasks/tools/install-kubectl-linux/)
-   [安装 Minikube](https://v1-18.docs.kubernetes.io/zh/docs/tasks/tools/install-minikube/)
-   [使用 Minikube 安装 Kubernetes](https://v1-18.docs.kubernetes.io/zh/docs/setup/learning-environment/minikube/)
-   [Minikube - Kubernetes本地实验环境](https://developer.aliyun.com/article/221687)
-   [使用minikube安装单机测试Kubernetes集群](http://fancyerii.github.io/2020/08/28/minikube/#%E5%90%AF%E5%8A%A8)

<br/>

