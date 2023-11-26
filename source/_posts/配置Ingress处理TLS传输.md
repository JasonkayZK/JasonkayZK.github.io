---
title: 配置Ingress处理TLS传输
toc: true
cover: 'https://img.paulzzh.com/touhou/random?55'
date: 2021-05-31 08:47:34
categories: Kubernetes
tags: [Kubernetes, minikube, Ingress]
description: 在上一篇文章《国内在minikube中添加ingress-nginx插件》中，讲述了如何在国内网络环境安装Ingress-Nginx，并且对NodePort、LoadBalancer和Ingress分别进行了测试；但是在实际项目中，我们只会用到HTTPS的连接，因此还需要为Ingress配置TLS证书；本文讲述了如何在Ingress中配置TLS证书；
---

在上一篇文章《国内在minikube中添加ingress-nginx插件》中，讲述了如何在国内网络环境安装Ingress-Nginx，并且对NodePort、LoadBalancer和Ingress分别进行了测试；

但是在实际项目中，我们只会用到HTTPS的连接，因此还需要为Ingress配置TLS证书；

本文讲述了如何在Ingress中配置TLS证书；

源代码： 

-   https://github.com/JasonkayZK/kubernetes-learn/tree/book-learn/chapter5/ingress-nginx

系列文章：

-   [《国内在minikube中添加ingress-nginx插件》](/2021/05/30/国内在minikube中添加ingress-nginx插件/)
-   [《配置Ingress处理TLS传输》](/2021/05/31/配置Ingress处理TLS传输/)

<br/>

<!--more-->

## **配置Ingress处理TLS传输**

2021年的今天，如果网站不用HTTPS，基本上整个网站都要被Ban了；

所以TLS是非常重要的；

对于K8S而言：

<font color="#f00">**当客户端创建到Ingress的控制器的TLS连接时，控制器将终止TLS连接！**</font>

<font color="#f00">**客户端和Ingress控制器之间的通信是加密的，而控制器和后端的Pod通信是非加密的（也无需加密）**</font>

<font color="#f00">**因此，运行在Pod中的应用程序不需要支持TLS，只需接收正常的HTTP通信，并让Ingress处理和TLS相关的所有内容即可！**</font>

<font color="#f00">**要在Ingress控制器中配置TLS相关内容，需要将证书和私钥附加至Ingress中；**</font>

下面我们开始为Ingress配置TLS；

<br/>

### **创建证书并配置Secrets**

创建TLS证书：

chapter5/create-cert.sh

```bash
openssl genrsa -out tls.key 2048

openssl req -new -x509 -key tls.key -out tls.cert -days 360 -subj /CN=kubia.example.com
```

添加证书至Secrets：

```bash
kubectl create secret tls tls-secret --cert=tls.cert --key=tls.key
```

查看：

```bash
[root@localhost chapter5]# kubectl get secrets
NAME                  TYPE                                  DATA   AGE
default-token-97zwj   kubernetes.io/service-account-token   3      46h
tls-secret            kubernetes.io/tls                     2      41m
```

创建成功；

<br/>

### **配置Ingress**

为Ingress添加TLS配置：

chapter5/kubia-ingress-tls.yaml

```yaml
# k8s: v1.18.17
# info: https://kubernetes.io/blog/2019/07/18/api-deprecations-in-1-16/
apiVersion: networking.k8s.io/v1beta1
#apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: kubia-tls
spec:
  tls:
    - hosts:
      - kubia.example.com
      secretName: tls-secret
  rules:
    - host: kubia.example.com
      http:
        paths:
          - backend:
              serviceName: kubia-nodeport
              servicePort: 80
            path: /
```

在配置中添加了TLS相关的配置：

-   hosts：指定后方Ingress的域名地址；
-   secretName：所配置TLS证书的Secrets名称；

最后使用`kubectl apply`更新配置；

```bash
kubectl apply -f kubia-ingress-tls.yaml
```

查看配置：

```bash
[root@localhost chapter5]# kubectl describe ingress kubia-tls 
Name:             kubia-tls
Namespace:        default
Address:          192.168.49.3
Default backend:  default-http-backend:80 (<error: endpoints "default-http-backend" not found>)
TLS:
  tls-secret terminates kubia.example.com
Rules:
  Host               Path  Backends
  ----               ----  --------
  kubia.example.com  
                     /   kubia-nodeport:80 (10.244.0.12:8080,10.244.1.25:8080,10.244.2.26:8080)
Annotations:         <none>
Events:
  Type    Reason  Age   From                      Message
  ----    ------  ----  ----                      -------
  Normal  CREATE  34m   nginx-ingress-controller  Ingress default/kubia-tls
  Normal  UPDATE  34m   nginx-ingress-controller  Ingress default/kubia-tls
```

从`Rules`中，可以看到我们的Ingress已经正确的被配置，并且解析到了服务地址；

配置完成；

<br/>

### **测试TLS连接**

最后，我们做一下测试吧；

首先查看我们Ingress-Nginx服务的端口映射情况：

```bash
[root@localhost chapter5]# kubectl get svc -n ingress-nginx
NAME                                 TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
ingress-nginx-controller             NodePort    10.104.211.117   <none>        80:31904/TCP,443:30310/TCP   15h
ingress-nginx-controller-admission   ClusterIP   10.101.176.66    <none>        443/TCP
```

可以看到端口映射是：

-   HTTP： 80:31904/TCP；
-   HTTPS：443:30310/TCP；

下面我们进行测试；

首先先测试HTTP连接：

```bash
[root@localhost chapter5]# curl -k -v https://kubia.example.com:31904/kubia
* About to connect() to kubia.example.com port 31904 (#0)
*   Trying 192.168.49.3...
* Connected to kubia.example.com (192.168.49.3) port 31904 (#0)
* Initializing NSS with certpath: sql:/etc/pki/nssdb
* NSS error -12263 (SSL_ERROR_RX_RECORD_TOO_LONG)
* SSL received a record that exceeded the maximum permissible length.
* Closing connection 0
curl: (35) SSL received a record that exceeded the maximum permissible length.
```

由于我们没有配置非HTTP连接的情况，因此如果直接使用HTTP进行连接，会报错；

下面测试HTTPS连接：

```bash
[root@localhost chapter5]# curl -k -v https://kubia.example.com:30310/kubia
* About to connect() to kubia.example.com port 30310 (#0)
*   Trying 192.168.49.3...
* Connected to kubia.example.com (192.168.49.3) port 30310 (#0)
* Initializing NSS with certpath: sql:/etc/pki/nssdb
* skipping SSL peer certificate verification
* SSL connection using TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
* Server certificate:
*       subject: CN=kubia.example.com
*       start date: May 31 00:33:42 2021 GMT
*       expire date: May 26 00:33:42 2022 GMT
*       common name: kubia.example.com
*       issuer: CN=kubia.example.com
> GET /kubia HTTP/1.1
> User-Agent: curl/7.29.0
> Host: kubia.example.com:30310
> Accept: */*
> 
< HTTP/1.1 200 OK
< Server: nginx/1.19.1
< Date: Mon, 31 May 2021 01:24:02 GMT
< Transfer-Encoding: chunked
< Connection: keep-alive
< Strict-Transport-Security: max-age=15724800; includeSubDomains
< 
You've hit kubia-replicaset-rl7tm
* Connection #0 to host kubia.example.com left intact

[root@localhost chapter5]# curl -k -v https://kubia.example.com:30310/kubia
* About to connect() to kubia.example.com port 30310 (#0)
*   Trying 192.168.49.3...
* Connected to kubia.example.com (192.168.49.3) port 30310 (#0)
* Initializing NSS with certpath: sql:/etc/pki/nssdb
* skipping SSL peer certificate verification
* SSL connection using TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
* Server certificate:
*       subject: CN=kubia.example.com
*       start date: May 31 00:33:42 2021 GMT
*       expire date: May 26 00:33:42 2022 GMT
*       common name: kubia.example.com
*       issuer: CN=kubia.example.com
> GET /kubia HTTP/1.1
> User-Agent: curl/7.29.0
> Host: kubia.example.com:30310
> Accept: */*
> 
< HTTP/1.1 200 OK
< Server: nginx/1.19.1
< Date: Mon, 31 May 2021 01:24:10 GMT
< Transfer-Encoding: chunked
< Connection: keep-alive
< Strict-Transport-Security: max-age=15724800; includeSubDomains
< 
You've hit kubia-replicaset-l99pk
* Connection #0 to host kubia.example.com left intact
```

从上面打出的日志可以看出，成功通过HTTPS建立了连接；

并且服务的负载均衡也正确的作用了；

<br/>

### **后记**

HTTPS作为现代服务最重要的基本配置之一，不得不学习；

上面的各种配置可以进行优化：

-   **在配置证书时可以使用CertificateSigningRequest（CSR）资源签署；**

此外需要注意的是：

-   **对于Ingress功能的支持因不同的Ingress控制器的实现而异；**

<br/>

## **附录**

源代码： 

-   https://github.com/JasonkayZK/kubernetes-learn/tree/book-learn/chapter5/ingress-nginx

系列文章：

-   [《国内在minikube中添加ingress-nginx插件》](/2021/05/30/国内在minikube中添加ingress-nginx插件/)
-   [《配置Ingress处理TLS传输》](/2021/05/31/配置Ingress处理TLS传输/)

<br/>