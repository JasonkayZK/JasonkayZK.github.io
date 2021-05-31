---
title: 国内在minikube中添加ingress-nginx插件
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?4'
date: 2021-05-30 19:42:48
categories: Kubernetes
tags: [Kubernetes, minikube, Ingress]
description: 在使用minikube时，需要打开许多addons；由于国内“令人失望”的网络环境，在使用minikube addons enable时，基本拉不下来镜像；好在这个只是addon，可以自己拉下来yaml文件，修改为阿里云的镜像安装；
---

在使用minikube时，需要打开许多addons；由于国内“令人失望”的网络环境，在使用minikube addons enable时，基本拉不下来镜像；

好在这个只是addon，可以自己拉下来yaml文件，修改为阿里云的镜像安装；

源代码：

-   https://github.com/JasonkayZK/kubernetes-learn/tree/book-learn/chapter5/ingress-nginx

系列文章：

-   [《国内在minikube中添加ingress-nginx插件》](/2021/05/30/国内在minikube中添加ingress-nginx插件/)
-   [《配置Ingress处理TLS传输》](/2021/05/31/配置Ingress处理TLS传输/)

文章参考：

-   [使用ingress-nginx访问k8s内服务](https://www.jianshu.com/p/46dd82cb4d68)

<br/>

<!--more-->

## **国内在minikube中添加ingress-nginx插件**

### **前言**

目前我使用的各种K8S版本如下：

minikube版本：

```bash
[root@localhost chapter5]# minikube version
minikube version: v1.20.0
commit: c61663e942ec43b20e8e70839dcca52e44cd85ae
```

kubectl版本：

```bash
[root@localhost chapter5]# kubectl version
Client Version: version.Info{Major:"1", Minor:"20", GitVersion:"v1.20.2", GitCommit:"faecb196815e248d3ecfb03c680a4507229c2a56", GitTreeState:"clean", BuildDate:"2021-01-13T13:28:09Z", GoVersion:"go1.15.5", Compiler:"gc", Platform:"linux/amd64"}
Server Version: version.Info{Major:"1", Minor:"18", GitVersion:"v1.18.17", GitCommit:"68b4e26caf6ede7af577db4af62fb405b4dd47e6", GitTreeState:"clean", BuildDate:"2021-03-18T00:54:02Z", GoVersion:"go1.13.15", Compiler:"gc", Platform:"linux/amd64"}
```

docker版本：

```bash
[root@localhost chapter5]# docker version 
 Version:           20.10.6
```

操作系统CentOS7的内核：

```bash
[root@localhost chapter5]# uname -a
Linux localhost 3.10.0-1160.25.1.el7.x86_64 #1 SMP Wed Apr 28 21:49:45 UTC 2021 x86_64 x86_64 x86_64 GNU/Linux
```

K8S版本：

-   v1.18.17

<br/>

### **安装Ingress-Nginx插件**

>   **不得不说，国内的网络真是神奇的存在，一个插件的安装都得花时间总结；**

#### **下载YAML配置文件**

在minikube的宿主机上下载Ingress-Nginx插件：

官方：

-   https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.34.1/deploy/static/provider/baremetal/deploy.yaml

我的仓库的：

-   https://cdn.jsdelivr.net/gh/jasonkayzk/kubernetes-learn@book-learn/chapter5/ingress-nginx/deploy.yaml

下载一个就可以了；

```bash
wget https://cdn.jsdelivr.net/gh/jasonkayzk/kubernetes-learn@book-learn/chapter5/ingress-nginx/deploy.yaml
```

<br/>

#### **修改镜像地址**

修改镜像地址，找到 `# Source: ingress-nginx/templates/controller-deployment.yaml`；

由：`us.gcr.io`改为阿里云的地址：

```diff
vi deploy.yaml
# 寻找# Source: ingress-nginx/templates/controller-deployment.yaml

...
# Source: ingress-nginx/templates/controller-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: controller
  name: ingress-nginx-controller
  namespace: ingress-nginx
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: ingress-nginx
      app.kubernetes.io/instance: ingress-nginx
      app.kubernetes.io/component: controller
  revisionHistoryLimit: 10
  minReadySeconds: 0
  template:
    metadata:
      labels:
        app.kubernetes.io/name: ingress-nginx
        app.kubernetes.io/instance: ingress-nginx
        app.kubernetes.io/component: controller
    spec:
      dnsPolicy: ClusterFirst
      containers:
        - name: controller
-		  image: us.gcr.io/k8s-artifacts-prod/ingress-nginx/controller:v0.34.1@sha256:0e072dddd1f7f8fc8909a2ca6f65e76c5f0d2fcfb8be47935ae3457e8bbceb20
+          image: registry.cn-hangzhou.aliyuncs.com/bin_x/nginx-ingress:v0.34.1@sha256:80359bdf124d49264fabf136d2aecadac729b54f16618162194356d3c78ce2fe
          imagePullPolicy: IfNotPresent
          lifecycle:
            preStop:
              exec:
...
```

>   <font color="#f00">**如果下载的是官方的配置文件需要修改这里；**</font>
>
>   <font color="#f00">**如果下载的是我的仓库的配置文件，则不需要修改这里了；**</font>

<br/>

#### **修改nodePort端口（可选）**

对外暴露Ingress服务的时候，需要固定node上的端口，即配置`nodePort`；

>   <font color="#f00">**当然这里也可以不配置，此时K8S会随机分配端口；**</font>

如果你想要手动指定的话，参照下面的方法；

找到 `Source: ingress-nginx/templates/controller-service.yaml`；

在ports中添加nodePort，对应的值就是node节点开放给外部使用的端口；

如下面的配置中添加的是`http:31234; https:31235;`；

文件如下：

```diff
...
# Source: ingress-nginx/templates/controller-service.yaml
apiVersion: v1
kind: Service
metadata:
  labels:
    helm.sh/chart: ingress-nginx-2.11.1
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/version: 0.34.1
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/component: controller
  name: ingress-nginx-controller
  namespace: ingress-nginx
spec:
  type: NodePort
  ports:
    - name: http
      port: 80
      protocol: TCP
      targetPort: http
+      nodePort: 31234
    - name: https
      port: 443
      protocol: TCP
      targetPort: https
+      nodePort: 31235
  selector:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/component: controller
...
```

>   <font color="#f00">**在本实验中，并未对端口进行配置；使用的是随机分配的端口；**</font>

<br/>

#### **应用YAML文件**

使用`apply`命令应用配置：

```bash
kubectl apply -f deploy.yaml
```

之后系统会自动进行安装配置。可以通过如下命令检查是否安装成功：

```bash
kubectl get pods -n ingress-nginx \
  -l app.kubernetes.io/name=ingress-nginx
```

等到出现如下提示，说明安装成功：

```bash
[root@localhost chapter5]# kubectl get pods -n ingress-nginx \
>   -l app.kubernetes.io/name=ingress-nginx

NAME                                        READY   STATUS      RESTARTS   AGE
ingress-nginx-admission-create-btdp7        0/1     Completed   0          147m
ingress-nginx-admission-patch-f5z22         0/1     Completed   1          147m
ingress-nginx-controller-69df8c9c8d-f7dv9   1/1     Running     0          147m
```

输入如下命令，检查配置是否生效：

```bash
[root@localhost chapter5]# kubectl -n ingress-nginx get svc
NAME                                 TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
ingress-nginx-controller             NodePort    10.104.211.117   <none>        80:31904/TCP,443:30310/TCP   148m
ingress-nginx-controller-admission   ClusterIP   10.101.176.66    <none>        443/TCP                      148m
```

看到以上两条信息说明配置已经生效，且对应的80和443端口已经绑到随机的`31904`和`30310`端口上；

>   <font color="#f00">**如果没有添加`nodePort`配置，这里K8S也会自己分配随机的端口；**</font>

<br/>

### **Ingress-Nginx插件测试**

因为在看[《Kubernetes in Action中文版》](https://book.douban.com/subject/30418855/)，因此这里就直接用书中的例子了；

>   **下面的源代码可以在我的仓库中找到：**
>
>   -   https://github.com/JasonkayZK/kubernetes-learn/tree/book-learn

#### **创建ReplicaSet**

创建配置文件：

chapter4/kubia-replicaset.yaml

```yaml
# k8s: 18.1.17
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: kubia-replicaset
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kubia
  template:
    metadata:
      labels:
        app: kubia
    spec:
      containers:
        - name: kubia
          image: jasonkay/kubia:latest
          ports:
            - containerPort: 8080
              protocol: TCP
```

使用配置文件创建ReplicaSet；

```bash
kubectl create -f chapter4/kubia-replicaset.yaml
```

此时这个ReplicaSet会发现无对应Pod，自行创建3个Pod：

```bash
[root@localhost chapter5]# kubectl get rs
NAME               DESIRED   CURRENT   READY   AGE
kubia-replicaset   3         3         3       25h

[root@localhost chapter5]# kubectl get po
NAME                     READY   STATUS    RESTARTS   AGE
kubia-replicaset-75l2c   1/1     Running   0          160m
kubia-replicaset-l99pk   1/1     Running   0          160m
kubia-replicaset-rl7tm   1/1     Running   0          160m
```

>   Pod中的服务是一个简单的Node服务，直接向客户端返回当前Hostname；
>
>   Node服务源代码：
>
>   ```javascript
>   const http = require('http');
>   const os = require('os');
>   
>   console.log("kubia server starting...");
>   
>   let handler = function(request, response) {
>       console.log("Received request from " + request.connection.remoteAddress);
>       response.writeHead(200);
>       response.end("You've hit " + os.hostname() + "\n");
>   };
>   
>   let www = http.createServer(handler);
>   www.listen(8080)
>   ```

接下来分别使用`NodePort`和`LoadBalancer`的方式暴露服务；

最后使用`Ingress`的方式将这两种服务方式结合，体现`Ingress`方法的灵活性；

<br/>

#### **创建NodePort和LoadBalancer服务**

下面是`NodePort`的方式：

chapter5/kubia-svc-nodeport.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: kubia-nodeport
spec:
  type: NodePort
  ports:
    - port: 80 # 服务集群IP的端口号（供内部集群访问）
      targetPort: 8080 # selector对应的Pod的目标端口
      nodePort: 30123 # 暴露给外部客户端的端口，可通过集群Node的30123端口访问
  selector:
    app: kubia
```

下面是`LoadBalancer`的方式：

chapter5/kubia-svc-loadbalancer.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: kubia-loadbalancer
spec:
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 8080
  selector:
    app: kubia
```

分别使用配置文件创建两种服务：

```bash
kubectl create -f chapter5/kubia-svc-nodeport.yaml

kubectl create -f chapter5/kubia-svc-loadbalancer.yaml
```

查看服务：

```bash
[root@localhost chapter5]# kubectl get svc
NAME                         TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
external-svc-external-name   ExternalName   <none>           www.qq.com    443/TCP        174m
kubernetes                   ClusterIP      10.96.0.1        <none>        443/TCP        34h
kubia-loadbalancer           LoadBalancer   10.98.177.50     <pending>     80:31618/TCP   10h
kubia-nodeport               NodePort       10.111.116.233   <none>        80:30123/TCP   5h55m
```

能够看到这两个服务已经正确启动了；

现在简单对这两种方式做测试；

##### **测试NodePort服务**

NodePort的方式是直接在每个K8S节点保留一个端口用以直接转发至Node的Pod中；

我们可以先查看节点的状况：

```bash
[root@localhost chapter5]# kubectl get nodes 
NAME           STATUS   ROLES    AGE   VERSION
minikube       Ready    master   34h   v1.18.17
minikube-m02   Ready    <none>   33h   v1.18.17
minikube-m03   Ready    <none>   33h   v1.18.17

# 查看集群node节点IP地址
[root@localhost chapter5]# kubectl get nodes -o jsonpath='{.items[*].status.addresses[].address}'

192.168.49.2 192.168.49.3 192.168.49.4
```

上面使用`jsonPath`直接取出了Node的IP地址；

可以直接使用`curl`命令，使用`nodeIP + kubia-nodeport:nodePort`进行请求：

```bash
[root@localhost chapter5]# curl 192.168.49.2:30123
You've hit kubia-replicaset-75l2c
[root@localhost chapter5]# curl 192.168.49.3:30123
You've hit kubia-replicaset-75l2c
[root@localhost chapter5]# curl 192.168.49.4:30123
You've hit kubia-replicaset-l99pk
[root@localhost chapter5]# curl 192.168.49.4:30123
You've hit kubia-replicaset-rl7tm
```

可见正确配置了`kubia-nodeport`服务，并且正常请求了；

<br/>

##### **测试LoadBalancer服务**

`LoadBalancer`可以说是`NodePort`服务的升级版；

他在`NodePort`服务前加了一个负载均衡器，仅此而已；

我们先来看一下`kubia-svc-loadbalancer`服务：

```bash
[root@localhost chapter5]# kubectl describe svc kubia-loadbalancer
Name:                     kubia-loadbalancer
Namespace:                default
Labels:                   <none>
Annotations:              <none>
Selector:                 app=kubia
Type:                     LoadBalancer
IP Families:              <none>
IP:                       10.98.177.50
IPs:                      <none>
Port:                     <unset>  80/TCP
TargetPort:               8080/TCP
NodePort:                 <unset>  31618/TCP
Endpoints:                10.244.0.12:8080,10.244.1.25:8080,10.244.2.26:8080
Session Affinity:         None
External Traffic Policy:  Cluster
Events:                   <none>
[root@localhost chapter5]# kubectl get svc 
external-svc-external-name  kubia-loadbalancer          
kubernetes                  kubia-nodeport              
[root@localhost chapter5]# kubectl get svc 
NAME                         TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
external-svc-external-name   ExternalName   <none>           www.qq.com    443/TCP        3h4m
kubernetes                   ClusterIP      10.96.0.1        <none>        443/TCP        34h
kubia-loadbalancer           LoadBalancer   10.98.177.50     <pending>     80:31618/TCP   10h
kubia-nodeport               NodePort       10.111.116.233   <none>        80:30123/TCP   6h5m
```

可以看到`kubia-loadbalancer`的IP是`<pending>`，这是因为：<font color="#f00">**Minikube中不显示这个IP**</font>

我们直接通过`minikube service list`查看即可：

```bash
[root@localhost chapter5]# minikube service list
|---------------|------------------------------------|--------------|---------------------------|
|   NAMESPACE   |                NAME                | TARGET PORT  |            URL            |
|---------------|------------------------------------|--------------|---------------------------|
| default       | external-svc-external-name         | No node port |
| default       | kubernetes                         | No node port |
| default       | kubia-loadbalancer                 |           80 | http://192.168.49.2:31618 |
| default       | kubia-nodeport                     |           80 | http://192.168.49.2:30123 |
| ingress-nginx | ingress-nginx-controller           | http/80      | http://192.168.49.2:31904 |
|               |                                    | https/443    | http://192.168.49.2:30310 |
| ingress-nginx | ingress-nginx-controller-admission | No node port |
| kube-system   | kube-dns                           | No node port |
|---------------|------------------------------------|--------------|---------------------------|
```

看到了`kubia-loadbalancer`的IP和端口号；

接下来测试即可：

```bash
[root@localhost chapter5]# curl http://192.168.49.2:31618
You've hit kubia-replicaset-75l2c
[root@localhost chapter5]# curl http://192.168.49.2:31618
You've hit kubia-replicaset-rl7tm
[root@localhost chapter5]# curl http://192.168.49.2:31618
You've hit kubia-replicaset-75l2c
[root@localhost chapter5]# curl http://192.168.49.2:31618
You've hit kubia-replicaset-rl7tm
```

可以看到，也成功部署了；

<br/>

#### **创建Ingress服务**

Ingress服务比前面所述的`NodePort`和`LoadBalancer`服务都要灵活的多；

Ingress是基于域名和路径对服务进行区分的；

下面我们创建一个多服务、多路径的Ingress：

chapter5/kubia-ingress-multi.yaml

```yaml
# k8s: v1.18.17
# info: https://kubernetes.io/blog/2019/07/18/api-deprecations-in-1-16/
apiVersion: networking.k8s.io/v1beta1
#apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: kubia-ingress-multi
spec:
  rules:
    - host: kubia.example.com
      http:
        paths:
          - path: /kubia-nodeport
            backend:
              serviceName: kubia-nodeport
              servicePort: 80
          - path: /kubia-loadbalancer
            backend:
              servicePort: 80
              serviceName: kubia-loadbalancer
    - host: qq.example.com
      http:
        paths:
          - path: /
            backend:
              serviceName: kubia-nodeport
              servicePort: 80
```

使用`kubectl create`创建并查看：

```bash
[root@localhost chapter5]# kubectl create -f kubia-ingress-multi.yaml 

[root@localhost chapter5]# kubectl get ingresses
NAME                  CLASS    HOSTS                              ADDRESS        PORTS   AGE
kubia-ingress-multi   <none>   kubia.example.com,qq.example.com   192.168.49.3   80      156m

[root@localhost chapter5]# kubectl describe ingress kubia-ingress-multi 
Name:             kubia-ingress-multi
Namespace:        default
Address:          192.168.49.3
Default backend:  default-http-backend:80 (<error: endpoints "default-http-backend" not found>)
Rules:
  Host               Path  Backends
  ----               ----  --------
  kubia.example.com  
                     /kubia-nodeport       kubia-nodeport:80 (10.244.0.12:8080,10.244.1.25:8080,10.244.2.26:8080)
                     /kubia-loadbalancer   kubia-loadbalancer:80 (10.244.0.12:8080,10.244.1.25:8080,10.244.2.26:8080)
  qq.example.com     
                     /   kubia-nodeport:80 (10.244.0.12:8080,10.244.1.25:8080,10.244.2.26:8080)
Annotations:         <none>
Events:              <none>
```

上面展示了两个域名：

-   kubia.example.com：路径指向`/kubia-nodeport`，并表示了使用`NodePort`服务；
-   qq.example.com：路径指向`/`，并表示了使用`LoadBalancer`服务；

在进行测试之前，还需要在`/etc/hosts`中添加域名，毕竟我们的主机是无法识别这两个域名的！

```diff
[root@localhost chapter5]# cat /etc/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6
127.0.0.1       localhost
192.168.24.88   localhost
127.0.0.1       host.minikube.internal
192.168.24.88   control-plane.minikube.internal

+192.168.49.3    kubia.example.com  
+192.168.49.3    qq.example.com
```

IP地址就是上面`Address: 192.168.49.3`显示的IP；

最后我们分别对这些域名进行测试，测试时别忘了，我们在创建`Ingress-Nginx`时获得的HTTP和HTTPS端口映射：

-   HTTP： 80:31904/TCP；
-   HTTPS：443:30310/TCP；

测试时要用到这两个端口！

```bash
# 测试kubia.example.com域名
# 失败
# 失败原因：未配置80端口的Service
[root@localhost chapter5]# curl kubia.example.com
curl: (7) Failed connect to kubia.example.com:80; Connection refused

# kubia.example.com:31904
# 成功，但是404
# 404原因：我们的Ingress配置了31904端口，但是未配置这个路由路径
[root@localhost chapter5]# curl kubia.example.com:31904
<html>
<head><title>404 Not Found</title></head>
<body>
<center><h1>404 Not Found</h1></center>
<hr><center>nginx/1.19.1</center>
</body>
</html>

# 测试：curl kubia.example.com:31904/kubia-nodeport
# 成功，并且展示了路由情况
[root@localhost chapter5]# curl kubia.example.com:31904/kubia-nodeport
You've hit kubia-replicaset-l99pk
[root@localhost chapter5]# curl kubia.example.com:31904/kubia-nodeport
You've hit kubia-replicaset-75l2c
[root@localhost chapter5]# curl kubia.example.com:31904/kubia-nodeport
You've hit kubia-replicaset-rl7tm

# 测试：kubia.example.com:31904/kubia-loadbalancer
# 成功，并且展示了路由情况
[root@localhost chapter5]# curl kubia.example.com:31904/kubia-loadbalancer
You've hit kubia-replicaset-75l2c
[root@localhost chapter5]# curl kubia.example.com:31904/kubia-loadbalancer
You've hit kubia-replicaset-l99pk

# 测试：kubia.example.com:30310/kubia-nodeport
# 失败：因为使用了HTTP去请求HTTPS，下面的解释也很清楚~
[root@localhost chapter5]# curl kubia.example.com:30310/kubia-nodeport
<html>
<head><title>400 The plain HTTP request was sent to HTTPS port</title></head>
<body>
<center><h1>400 Bad Request</h1></center>
<center>The plain HTTP request was sent to HTTPS port</center>
<hr><center>nginx/1.19.1</center>
</body>
</html>
```

至此，我们使用`Ingress`分别转发了`NodePort`和`LoadBalancer`的服务；

可见，`Ingress`相当的灵活！

<br/>

## **附录**

源代码：

-   https://github.com/JasonkayZK/kubernetes-learn/tree/book-learn/chapter5/ingress-nginx

系列文章：

-   [《国内在minikube中添加ingress-nginx插件》](/2021/05/30/国内在minikube中添加ingress-nginx插件/)
-   [《配置Ingress处理TLS传输》](/2021/05/31/配置Ingress处理TLS传输/)

文章参考：

-   [使用ingress-nginx访问k8s内服务](https://www.jianshu.com/p/46dd82cb4d68)

<br/>