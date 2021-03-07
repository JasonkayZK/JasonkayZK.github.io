---
title: apt和apt-get的区别
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?67'
date: 2021-03-07 15:14:16
categories: 技术杂谈
tags: [技术杂谈, apt]
description: 经常使用基于Debian的Linux发行版（例如最有名的Ubuntu）的同学应该对apt命令不陌生，我们使用apt命令一行代码安装了大量的应用。但是在查看一些教程时，会用到apt-get。那么apt和apt-get到底有什么区别呢？本文就来讲述apt和apt-get的区别。
---

经常使用基于Debian的Linux发行版（例如最有名的Ubuntu）的同学应该对apt命令不陌生，我们使用apt命令一行代码安装了大量的应用。

但是在查看一些教程时，会用到apt-get。

那么apt和apt-get到底有什么区别呢？本文就来讲述apt和apt-get的区别。

<br/>

<!--more-->

## **apt和apt-get的区别**

在Ubuntu 16.04中新增了apt命令；

但实际上，apt的第一个稳定版本于2014年发布，但随着Ubuntu 16.04的发布，人们在2016年开始注意到它；

<br/>

### **为什么要引入apt**

Debian是Linux操作系统的分支之一，而Ubuntu，Linux Mint等都是基于Debian分支的发行版；Debian具有强大的打包系统，每个组件和应用程序都内置在系统中安装的软件包中；

Debian使用一组称为**高级打包工具（APT）**的[工具](https://wiki.debian.org/Apt)来管理打包系统；

在Debian中有多种工具可与APT交互，并可以使用该工具在基于Debian的Linux发行版中安装、删除和管理软件包；而apt-get就是这样一个广泛使用的命令行工具，另一个流行的工具是同时具有GUI和命令行选项的[Aptitude](https://wiki.debian.org/Aptitude?action=show&redirect=aptitude)；

当然除了apt-get和Aptitude之外，还有很多类似的命令行工具，例如：apt-cache；

<font color="#f00">**但是其中有些命令行工具过于底层，所以在使用时需要用户记住大量的细节，并给与大量的占位符才能使用；另一方面，最常用的软件包管理命令分散在apt-get和apt-cache中；**</font>

基于上述原因，apt命令被引入；

在apt命令中包含了apt-get和apt-cache中使用最广泛的一些功能，而并省略了许多晦涩难懂且不常用的功能；此外apt命令还可以管理[apt.conf](https://linux.die.net/man/5/apt.conf)文件；

此外，apt更加结构化，并为您提供管理软件包所需的必要选项；

>   可以认为：**apt = apt-get + apt-cache中最常用的命令选项**

<br/>

### **apt和apt-get之间的区别**

相比于apt-get，apt命令可以将所有管理软件包的必要工具集中到一处，同时apt命令具有较少但足够的命令选项；最重要的是，apt命令包括了一些默认选项，这些选项会对用户有不少帮助；

例如：

-   在apt中安装或删除程序时，会看到进度栏；
-   apt还会提示更新存储库数据库时可以升级的软件包数量；

虽然通过其他命令选项配合，apt-get也可以实现相同的效果；但是apt命令略去了大量的命令行占位符！

<br/>

### **apt和apt-get命令使用上的区别**

<font color="#f00">**注意：尽管apt确实具有与apt-get类似的命令选项，但它与apt-get不向后兼容！这意味着，如果仅将apt-get命令的apt-get部分替换为apt，命令可能无法正常工作！**</font>

下面，让我们看看apt命令替换了apt-get和apt-cache中的哪些命令选项：

| **apt命令**      | **apt替换掉的命令**  | **功能描述**                 |
| :--------------- | :------------------- | :--------------------------- |
| apt install      | apt-get install      | 安装软件包                   |
| apt remove       | apt-get remove       | 删除软件包                   |
| apt purge        | apt-get purge        | 使用配置删除软件包           |
| apt update       | apt-get update       | 刷新存储库索引               |
| apt upgrade      | apt-get upgrade      | 升级所有可升级的软件包       |
| apt autoremove   | apt-get autoremove   | 删除不需要的软件包           |
| apt full-upgrade | apt-get dist-upgrade | 通过自动处理依赖项升级软件包 |
| apt search       | apt-cache search     | 搜索程序                     |
| apt show         | apt-cache show       | 显示包装详细信息             |

apt中也包括了一些独一无二的命令：

| **apt命令**      | **功能描述**                             |
| :--------------- | :--------------------------------------- |
| apt list         | 列出符合条件的软件包（已安装，可升级等） |
| apt edit-sources | 编辑源清单                               |

随着apt的不断发展，apt中加入的命令选项会越来越多；

<br/>

### **apt-get被弃用了吗？**

apt-get并没有被启用；

因为apt-get提供了比apt更多的功能；

对于一些底层操作，例如：脚本编写等，仍会使用apt-get命令；

<br/>

### **apt和apt-get的使用场景**

作为普通的Linux用户，在安装和管理软件包时应当首选apt命令；因为apt是Linux发行版推荐的命令，它提供了管理软件包的必要选项，最重要的是，它具有较少但易于记忆的选项，更易于使用；

当你需要执行一些必须使用apt-get的特定操作时，才需要使用apt-get；

<br/>