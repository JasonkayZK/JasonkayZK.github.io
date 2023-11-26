---
title: centos7中使用yum安装docker报错解决方法
toc: true
cover: 'https://img.paulzzh.com/touhou/random?11'
date: 2022-08-14 11:06:41
categories: 软件安装与配置
tags: [软件安装与配置, CentOS, Docker]
description: 服务器上的 Docker 是 1.13 版本的有点老了，于是打算升级一下；结果发现加入了 Docker 源之后使用 yum 安装报错了…，这里总结一下；
---

服务器上的 Docker 是 1.13 版本的有点老了，于是打算升级一下；

结果发现加入了 Docker 源之后使用 yum 安装报错了…，这里总结一下；

<br/>

<!--more-->

# **centos7中使用yum安装docker报错解决方法**

## **安装Docker**

首先卸载旧版本：

```bash
sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
```

然后按照软件源：

```bash
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

查看可用版本：

```bash
yum list docker-ce --showduplicates | sort -r
```

<br/>

至此步骤都是正常的；

当使用 yum 命令安装时：

```bash
yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

报错：

```bash
This system is not registered with an entitlement server. You can use subscription-manager to register.
 https://yum.dockerproject.org/repo/main/centos/7/repodata/repomd.xml: [Errno 
14] HTTPS Error 404 - Not Found
Trying other mirror.
...
failure: repodata/repomd.xml from dockerrepo: [Errno 256] No more mirrors to try.
   https://yum.dockerproject.org/repo/main/centos/7/repodata/repomd.xml: [Errno 14] HTTPS Error 404 - Not Found
```

原因是 CentOS 7 中的链接解析已经被废弃了；

可以尝试替换：`/etc/yum.repos.d/docker-ce.repo` 文件中的 `$releasever => 7` 解决：

/etc/yum.repos.d/docker-ce.repo

```diff
[docker-ce-stable]
name=Docker CE Stable - $basearch
- baseurl=https://download.docker.com/linux/centos/$releasever/$basearch/stable
+ baseurl=https://download.docker.com/linux/centos/7/$basearch/stable
enabled=1
gpgcheck=1
gpgkey=https://download.docker.com/linux/centos/gpg
```

替换之后便可安装！

设置为开机启动：

```sh
systemctl enable docker
```

启动：

```sh
systemctl start docker
```

查看启动状态：

```sh
systemctl status docker
```

查看版本：

```sh
docker version
```

<br/>

## **旧版本Docker兼容**

有部分安装的docker版本太旧，对docker进行版本升级后，启动旧版本创建的容器时遇到这个错误：

```
docker start 容器ID
Error response from daemon: Unknown runtime specified docker-runc
```

当从不兼容的版本升级docker并且升级后无法启动docker容器时会出现这种情况，原因是新旧版本的两个版本命令所在目录不同；

解决方法：

-   更改`/var/lib/docker/containers`目录中的文件参数，把`docker-runc`替换为`runc`

可通过以下命令进行修复：

```bash
grep -rl 'docker-runc' /var/lib/docker/containers/ | xargs sed -i 's/docker-runc/runc/g'
```

>**注：**
>
>-   **`grep -rl`：递归搜索目录和子目录，只列出含有匹配的文本行的文件名，而不显示具体的匹配内容；**
>-   **`xargs`：衔接执行之前得到的值；**
>
>总体意思是把`/var/lib/docker/containers`中含有`docker-runc`文件搜索出来；
>
>并把`docker-runc`字符替换为`runc`；

替换完成后重启 Docker：

```bash
systemctl restart docker
```

<br/>

# **附录**

文章参考：

-   https://stackoverflow.com/questions/60970697/docker-install-failing-in-linux-with-error-errno-14-https-error-404-not-foun
-   https://www.dockerchina.cn/?id=126
-   https://blog.51cto.com/dongweizhen/3606988

<br/>
