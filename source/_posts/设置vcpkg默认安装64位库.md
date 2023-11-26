---
title: 设置vcpkg默认安装64位库
toc: true
cover: 'https://img.paulzzh.com/touhou/random?77'
date: 2022-05-05 13:29:05
categories: 软件安装与配置
tags: [vcpkg, 软件安装与配置]
description: 默认情况下，我们在win10下使用vcpkg安装的库都是x86的，对于x64的库，我们还需要手动指定参数；但是在x64大行其道的现在，我们更希望能默认安装x64的库，此时只需要配置环境变量即可：VCPKG_DEFAULT_TRIPLET=x64-windows；
---

默认情况下，我们在win10下使用vcpkg安装的库都是x86的，对于x64的库，我们还需要手动指定参数；

但是在x64大行其道的现在，我们更希望能默认安装x64的库，此时只需要配置环境变量即可：

-   `VCPKG_DEFAULT_TRIPLET=x64-windows`

<br/>

<!--more-->

# **设置vcpkg默认安装64位库**

默认情况下，我们需要在安装库的时候指定为x64，例如：

```bash
vcpkg install zlib:x64-windows
vcpkg install zlib --triplet x64-windows
```

我们可以通过配置环境变量来达到默认安装x64的效果：

```bash
VCPKG_DEFAULT_TRIPLET=x64-windows
```

>   **对于Clion而言：**
>
>   **如果安装的是x86的库，而在CMake配置的是x64的编译器，则会找不到库；**

Reference：

-   https://github.com/microsoft/vcpkg/issues/1254


<br/>
