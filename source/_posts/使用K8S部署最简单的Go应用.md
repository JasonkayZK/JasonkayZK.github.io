---
title: 使用K8S部署最简单的Go应用
toc: true
cover: 'https://img.paulzzh.com/touhou/random?33'
date: 2021-10-31 16:46:39
categories: Kubernetes
tags: [Kubernetes]
description: 本文介绍了如何部署一个简单的Go项目；
---

本文介绍了如何部署一个简单的Go项目；

源代码：

-   https://github.com/JasonkayZK/kubernetes-learn/tree/go-hello-deploy-demo

<br/>

<!--more-->

# **使用K8S部署最简单的Go应用**

## **项目简介**

本文构建的Go项目是一个非常简单的Web项目：

main.go

```go
package main

import (
	"fmt"
	"net/http"
)

func index(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "<h1>Hello World</h1>")
}

func check(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "<h1>Health check</h1>")
}

func main() {
	http.HandleFunc("/", index)
	http.HandleFunc("/health_check", check)
	fmt.Println("Server starting...")
	http.ListenAndServe(":8080", nil)
}
```

项目启动后分别访问：

- `:8080/`: show `<h1>Hello World</h1>`
- `:8080/health_check`: show `<h1>Health check</h1>`

会显示如下内容：

![demo1](https://cdn.jsdelivr.net/gh/jasonkayzk/kubernetes-learn@go-hello-deploy-demo/images/demo1.png)

下面介绍如何在K8S中部署这个项目；

<br/>

## **构建镜像**

首先编写Dockerfile文件：

Dockerfile

```dockerfile
FROM golang:1.17.2-alpine3.14
MAINTAINER jasonkayzk@gmail.com
RUN mkdir /app
COPY . /app
WORKDIR /app
RUN go build -o main .
CMD ["/app/main"]
```

随后构建镜像：

```bash
docker build -t jasonkay/go-hello-app:v0.0.1 .
```

最后，向DockerHub推送镜像；

```bash
docker push jasonkay/go-hello-app:v0.0.1
```

>   **当然，你也可以先在本地对镜像进行测试：**
>
>   -   `docker run -d -p 8080:8080 --rm --name go-hello-app-container jasonkay/go-hello-app:v0.0.1`

<br/>

## **部署应用至K8S中**

创建文件`deployment.yaml`：

deploy/deployment.yaml

```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: go-hello-app
  namespace: my-workspace # 声明工作空间，默认为default
spec:
  replicas: 2
  selector:
    matchLabels:
      name: go-hello-app
  template:
    metadata:
      labels:
        name: go-hello-app
    spec:
      containers:
        - name: go-hello-container
          image: jasonkay/go-hello-app:v0.0.1
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8080 # containerPort是声明容器内部的port

---
apiVersion: v1
kind: Service
metadata:
  name: go-hello-app-service
  namespace: my-workspace # 声明工作空间，默认为default
spec:
  type: NodePort
  ports:
    - name: http
      port: 18080 # Service暴露在cluster-ip上的端口，通过<cluster-ip>:port访问服务,通过此端口集群内的服务可以相互访问
      targetPort: 8080 # Pod的外部访问端口，port和nodePort的数据通过这个端口进入到Pod内部，Pod里面的containers的端口映射到这个端口，提供服务
      nodePort: 31080 # Node节点的端口，<nodeIP>:nodePort 是提供给集群外部客户访问service的入口
  selector:
    name: go-hello-app
```

>   **注1：你可能需要修改上面的配置，尤其是：**
>
>   -   **metadata.namespace;**
>   -   **spec.spec.containers.image;**

>   **注2：注意在Deployment中containerPort以及Service中port、targetPort和nodePort的区别：**
>
>   -   `Deployment.containerPort`：仅仅是声明容器中应用需要的Port；
>   -   `Service.port`：**Service暴露在k8s-cluster-ip上的端口**，可以通过`<cluster-ip>:port`访问服务，通过此端口集群内的服务可以相互访问；
>   -   `Service.targetPort`：**Pod的外部访问端口**，port和nodePort的数据通过这个端口进入到Pod内部，Pod里面的containers的端口映射到这个端口，提供服务；
>   -   `Service.nodePort`：Node节点的端口，`<nodeIP>:nodePort` 是**提供给集群外部客户访问service的入口！**

最后，通过下面的命令向K8S的ApiServer提交配置，部署应用：

```bash
kubectl create -f deploy/deployment.yaml
```

<font color="#f00">**注意：此处使用的是`kubectl create`命令，也可以使用`kubectl apply`命令；**</font>

两者的区别：

| 序号 | **kubectl apply**                                            | **kubectl create**                                           |
| ---- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 1    | 根据yaml文件中包含的字段（yaml文件可以只写需要改动的字段），直接升级集群中的现有资源对象 | 首先删除集群中现有的所有资源，然后重新根据yaml文件（必须是完整的配置信息）生成新的资源对象 |
| 2    | yaml文件可以不完整，只写需要的字段                           | yaml文件必须是完整的配置字段内容                             |
| 3    | kubectl apply只工作在yaml文件中的某些改动过的字段            | kubectl create工作在yaml文件中的所有字段                     |
| 4    | 在只改动了yaml文件中的某些声明时，而不是全部改动，你可以使用kubectl apply | 在没有改动yaml文件时，使用同一个yaml文件执行命令kubectl replace，将不会成功（fail掉），因为缺少相关改动信息 |

<br/>

## **部署校验**

首先，我们通过命令行查看Pod状态：

```shell
kubectl get po -n my-workspace
 
NAME                            READY   STATUS    RESTARTS   AGE
go-hello-app-555c69b994-zt9zf   2/2     Running   0          54m
go-hello-app-555c69b994-zwdb7   2/2     Running   0          54m
```

随后，我们通过面板查看状态：

![demo2](https://cdn.jsdelivr.net/gh/jasonkayzk/kubernetes-learn@go-hello-deploy-demo/images/demo2.png)

最后，我们可以通过`<k8s-node-ip:NodePort>`的形式访问，即：

-   [http://k8s-node-ip:31080/](http://localhost:31080/)

同样的，我们可以看到：

![demo1](https://cdn.jsdelivr.net/gh/jasonkayzk/kubernetes-learn@go-hello-deploy-demo/images/demo1.png)

<br/>

## **卸载服务**

可以通过下面的命令卸载服务：

```shell
kubectl delete -f deploy/deployment.yaml
```

<br/>

## **小结**

本文使用一个非常简单的Go项目展示了如何将项目部署在K8S中；

从上面的示例可以看到，Go项目的部署可以和K8S很紧密的结合，或许这也是为什么Go越来越流行的原因之一吧！

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/kubernetes-learn/tree/go-hello-deploy-demo

文章参考：

-   https://segmentfault.com/a/1190000023072862
-   https://www.cnblogs.com/huhyoung/p/13264242.html


<br/>
