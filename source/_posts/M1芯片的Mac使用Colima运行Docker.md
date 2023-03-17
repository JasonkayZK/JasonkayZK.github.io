---
title: M1芯片的Mac使用Colima运行Docker
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?41'
date: 2023-03-17 15:55:00
categories: Docker
tags: [Docker, Colima]
description: Docker 在 M1 芯片的 Mac 上提供了 DockerDesktop 是有面板的，感觉会浪费性能，我还是喜欢命令行的方式。可以使用 Colima 来运行 Docker；
---

Docker 在 M1 芯片的 Mac 上提供了 DockerDesktop 是有面板的，感觉会浪费性能，我还是喜欢命令行的方式；

可以使用 Colima 来运行 Docker；

源代码：

-   https://github.com/abiosoft/colima

<br/>

<!--more-->

# **M1芯片的Mac使用Colima运行Docker**

## **安装**

Colima 致力于构建一个在 MacOS 上的容器环境；

Colima 的安装非常简单：

```bash
brew install colima
```

同时 Colima 依赖容器环境，例如：Docker、Containerd；

安装 Docker：

```bash
# Docker
# You can use the docker client on macOS after colima start with no additional setup.
brew install docker
```

<br/>

## **启动**

使用下面的命令启动 Colima 后台：

```bash
~ colima start
INFO[0000] starting colima
INFO[0000] runtime: docker
INFO[0000] preparing network ...                         context=vm
INFO[0000] starting ...                                  context=vm
INFO[0051] provisioning ...                              context=docker
INFO[0051] starting ...                                  context=docker
INFO[0057] done
```

Colima 会使用 QEMU 虚拟机；

也可以在启动时指定参数：

```bash
colima start --cpu 1 --memory 2 --disk 10

colima start --arch aarch64 --vm-type=vz --vz-rosetta

...
```

也可以编辑配置后使用配置启动：

```bash
colima start --edit
```

Colima 启动后，就可以使用 Docker 命令了！

例如，开一个 Portainer 面板：

```bash
docker run -d -p 18000:8000 -p 19443:9443 -p 19000:9000 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:latest
```

<br/>

## **停止**

停止 Docker 只需要停止 Colima 虚拟机即可：

```bash
colima stop
```

使用起来非常简单；

<br/>

## **配置**

有一些配置是一定要修改的，比如：

```yaml
# Number of CPUs to be allocated to the virtual machine.
cpu: 2

# Size of the disk in GiB to be allocated to the virtual machine.
# NOTE: changing this has no effect after the virtual machine has been created.
disk: 60

# Size of the memory in GiB to be allocated to the virtual machine.
memory: 2
```

<br/>

# **附录**

源代码：

-   https://github.com/abiosoft/colima


<br/>
