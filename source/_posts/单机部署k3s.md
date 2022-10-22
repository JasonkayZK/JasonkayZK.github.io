---
title: 单机部署k3s
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?3'
date: 2022-10-21 23:08:19
categories: Kubernetes
tags: [Kubernetes, k3s]
description: 最近将单节点的k8s换成了更加轻量级的k3s，这里记录一下；
---

最近将单节点的k8s换成了更加轻量级的k3s，这里记录一下；

Gist 仓库：

-   https://gist.github.com/JasonkayZK/670d578f9bb494c56c6061466dd7314f

<br/>

<!--more-->

# **单机部署k3s**

## **k3s介绍**

K3s 是一个轻量级的 Kubernetes 发行版，它针对边缘计算、物联网等场景进行了高度优化。K3s 有以下增强功能：

-   打包为单个二进制文件。
-   使用基于 sqlite3 的轻量级存储后端作为默认存储机制。同时支持使用 etcd3、MySQL 和 PostgreSQL 作为存储机制。
-   封装在简单的启动程序中，通过该启动程序处理很多复杂的 TLS 和选项。
-   默认情况下是安全的，对轻量级环境有合理的默认值。
-   添加了简单但功能强大的`batteries-included`功能，例如：本地存储提供程序，服务负载均衡器，Helm controller 和 Traefik Ingress controller。
-   所有 Kubernetes control-plane 组件的操作都封装在单个二进制文件和进程中，使 K3s 具有自动化和管理包括证书分发在内的复杂集群操作的能力。
-   最大程度减轻了外部依赖性，K3s 仅需要 kernel 和 cgroup 挂载。 K3s 软件包需要的依赖项包括：
    -   containerd
    -   Flannel
    -   CoreDNS
    -   CNI
    -   主机实用程序（iptables、socat 等）
    -   Ingress controller（Traefik）
    -   嵌入式服务负载均衡器（service load balancer）
    -   嵌入式网络策略控制器（network policy controller）

>   k3s 名称由来：
>
>   我们希望安装的 Kubernetes 在内存占用方面只是一半的大小。Kubernetes 是一个 10 个字母的单词，简写为 K8s。所以，有 Kubernetes 一半大的东西就是一个 5 个字母的单词，简写为 K3s；
>
>   K3s 没有全称，也没有官方的发音。

K3s 适用于以下场景：

-   边缘计算-Edge
-   物联网-IoT
-   CI
-   Development
-   ARM
-   嵌入 K8s

由于运行 K3s 所需的资源相对较少，所以 K3s 也适用于开发和测试场景；

在这些场景中，如果开发或测试人员需要对某些功能进行验证，或对某些问题进行重现，那么使用 K3s 不仅能够缩短启动集群的时间，还能够减少集群需要消耗的资源；

与此同时，Rancher 中国团队推出了一款针对 K3s 的效率提升工具：**AutoK3s**。只需要输入一行命令，即可快速创建 K3s 集群并添加指定数量的 master 节点和 worker 节点；

>   上述内容来自，k3s 中文文档：
>
>   -   https://docs.rancher.cn/k3s/

总结一下就是：

**k8s 里面带的东西太多了，我们将很多k8s的功能打到了一个二进制里面，你直接使用这个二进制去玩就好了！**

<br/>

## **k3s安装与配置**

### **安装k3s**

相比于k8s，k3s的安装过程非常简单，直接使用：

```bash
curl -sfL https://get.k3s.io | sh -
```

安装即可；

国内用户，可以使用以下方法加速安装：

```bash
curl -sfL https://rancher-mirror.oss-cn-beijing.aliyuncs.com/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn sh -
```

需要注意的是：

-   k3s 安装完成后会将 [kubeconfig](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/) 文件写入到`/etc/rancher/k3s/k3s.yaml`，对于有多个集群的来说，需要配置这个；
-   同时 `K3S_TOKEN` 会存在你的服务器节点上的`/var/lib/rancher/k3s/server/node-token`路径下；

》

<br/>

### **卸载k3s**

使用`install.sh`脚本安装了 K3s，在安装过程中会生成一个卸载脚本；

该脚本在节点的`/usr/local/bin/k3s-uninstall.sh`上创建（或者是`k3s-agent-uninstall.sh`）：

```
./k3s-uninstall.sh #或是以下命令
./k3s-agent-uninstall.sh
```

运行该脚本即可卸载 K3s；

<br/>

### **配置helm**

Helm 是 Kubernetes 的首选包管理工具，Helm Chart 为 Kubernetes YAML 清单文件提供了模板化语法；

通过 Helm，我们可以创建可配置的部署，而不仅仅是使用静态文件；

>   更多信息：
>
>   -   [Helm 快速入门](https://helm.sh/docs/intro/quickstart/)

对于在 k3s 下使用 helm，其实官方已经提供了，可以直接参考：

-   https://docs.rancher.cn/docs/k3s/helm/_index/

<br/>

下面是额外安装 helm 的指南，也比较简单：

首先是下载并安装：

```bash
curl https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get > install-helm.sh
chmod u+x install-helm.sh
./install-helm.sh
helm init
# Or: https://www.cnblogs.com/breezey/p/9398927.html
# helm init --upgrade -i registry.cn-hangzhou.aliyuncs.com/google_containers/tiller:v2.9.0 --service-account=tiller --stable-repo-url https://kubernetes.oss-cn-hangzhou.aliyuncs.com/charts
```

随后是将 Helm 和 Tiller 连接：

```bash
kubectl create serviceaccount --namespace kube-system tiller
kubectl create clusterrolebinding tiller-cluster-rule --clusterrole=cluster-admin --serviceaccount=kube-system:tiller
kubectl patch deploy --namespace kube-system tiller-deploy -p '{"spec":{"template":{"spec":{"serviceAccount":"tiller"}}}}'      
helm init --service-account tiller --upgrade
```

>   **注：在 Helm 3.x 版本，舍弃了 Tiller；**

最后校验 Helm 安装：

```bash
helm repo update
helm search postgres
```

>   上面所有的安装内容，这里也提供了一个 Gist，可以参考：
>
>   -   https://gist.github.com/JasonkayZK/670d578f9bb494c56c6061466dd7314f

<br/>

### **其他内容**

除了上面列出的，还有一些其他内容：

-   [集群访问](https://docs.rancher.cn/docs/k3s/cluster-access/_index)
-   [卷和存储](https://docs.rancher.cn/docs/k3s/storage/_index)
-   [网络](https://docs.rancher.cn/docs/k3s/networking/_index)
-   [高级选项和配置](https://docs.rancher.cn/docs/k3s/advanced/_index)
-   [常见问题](https://docs.rancher.cn/docs/k3s/faq/_index)
-   [安全](https://docs.rancher.cn/docs/k3s/security/secrets_encryption/_index)

**尤其是 `网络` 和 `卷和存储` 建议看一下！**

<br/>

## **部署Dashboard**

>   **推荐使用 Kuborad，比官方的面板要好用：**
>
>   -   `kubectl apply -f https://addons.kuboard.cn/kuboard/kuboard-v3.yaml`

在 k3s 中部署 Kubernetes Dashboard 的官方文档如下：

-   https://docs.k3s.io/installation/kube-dashboard#deploying-the-kubernetes-dashboard

Dashboard：

-   repo：https://github.com/kubernetes/dashboard
-   文档：https://kubernetes.io/zh-cn/docs/tasks/access-application-cluster/web-ui-dashboard/

只要跟着通过 `kubectl` 创建资源，随后创建 RBAC 配置即可；

在登陆 Dashboard 的时候，需要首先通过：

```bash
sudo k3s kubectl -n kubernetes-dashboard create token admin-user
```

创建 Bearer Token，然后通过Token登陆；

同时，默认情况下 Dashboard 只支持通过 localhost 访问：

```bash
sudo k3s kubectl proxy
```

Dashboard 部署完成后主要有两个常见的问题：

-   设置远程访问；
-   自签名证书；

下面分别来看；

<br/>

### **设置远程访问**

默认情况下 Dashboard 只能通过本地访问，我们可以通过：

-   通过 proxy 放开：`k3s kubectl proxy --address='0.0.0.0' --accept-hosts='^\*$'`；
-   Port Forward：`kubectl port-forward -n kubernetes-dashboard service/kubernetes-dashboard 8080:443`；
-   Service 设置为 NodePort 来放开：

多种方法来设置远程访问，其中 NodePort 的方法一劳永逸，下面来介绍；

编辑 dashboard service：

-   `kubectl -n kubernetes-dashboard edit service kubernetes-dashboard`

将 `type: ClusterIP` 修改为：`type: NodePort`：

```diff
# Please edit the object below. Lines beginning with a '#' will be ignored,
# and an empty file will abort the edit. If an error occurs while saving this file will be
# reopened with the relevant failures.
#
apiVersion: v1
...
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
  resourceVersion: "343478"
  selfLink: /api/v1/namespaces/kubernetes-dashboard/services/kubernetes-dashboard
  uid: 8e48f478-993d-11e7-87e0-901b0e532516
spec:
  clusterIP: 10.100.124.90
  externalTrafficPolicy: Cluster
  ports:
  - port: 443
    protocol: TCP
    targetPort: 8443
  selector:
    k8s-app: kubernetes-dashboard
  sessionAffinity: None
-  type: ClusterIP
+  type: NodePort
status:
  loadBalancer: {}
```

随后检查服务：

```bash
$ kubectl -n kubernetes-dashboard get service kubernetes-dashboard

NAME                   TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)         AGE
kubernetes-dashboard   NodePort   10.43.224.49   <none>        443:31048/TCP   18h
```

可以通过 `https://<ip>:31048` 访问！

>   文档：
>
>   -   https://github.com/kubernetes/dashboard/blob/master/docs/user/accessing-dashboard/README.md

<br/>

### **Chrome证书拦截**

解决了远程访问的问题之后，还有另一个问题。

Dashboard 需要使用 https 访问，并且默认提供的自签名证书 chrome 是不认的！

在使用 Chrome 访问时会提示：`您的连接不是私密连接`，然后无法打开页面；

解决方法也有很多种，比如：

-   配置一个自签名证书；
-   把浏览器换成 Firefox （没有黑 Firefox 的意思～）；

上面的方法都可以解决，但是比较麻烦，但是网上大多数都是这种方法；

但是，其实最简单的方法是：

直接在当前页面输入：

```
thisisunsafe
```

就可以访问了！

<font color="#f00">**因为Chrome不信任这些自签名ssl证书，为了安全起见，直接禁止访问了，`thisisunsafe` 这个命令，说明你已经了解并确认这是个不安全的网站；**</font>

>   参考：
>
>   -   https://blog.csdn.net/weixin_45024950/article/details/114014416

<br/>

# **附录**

Gist 仓库：

-   https://gist.github.com/JasonkayZK/670d578f9bb494c56c6061466dd7314f

K3s 官方文档：

-   https://docs.k3s.io/

<br/>
