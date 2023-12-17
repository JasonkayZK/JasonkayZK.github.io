---
title: 使用jenv管理jdk版本
toc: true
cover: 'https://img.paulzzh.com/touhou/random?12'
date: 2023-12-17 20:24:00
categories: Java
tags: [Java]
description: Java 更改了发布策略之后，版本发布变得特别频繁，我们可能需要安装多个版本的JDK，尤其是区分JVM和GraalVM；此时可以使用 jenv 来配置 JDK；
---

Java 更改了发布策略之后，版本发布变得特别频繁，我们可能需要安装多个版本的JDK，尤其是区分JVM和GraalVM；

此时可以使用 jenv 来配置 JDK；

官方网站：

-   https://www.jenv.be/

<br/>

<!--more-->

# **使用jenv管理jdk版本**

## **安装并配置jenv**

```shell
$ brew install jenv
```

安装完成后需要配置：

```shell
# 如果是zsh：
$ echo 'export PATH="$HOME/.jenv/bin:$PATH"' >> ~/.zshrc
$ echo 'eval "$(jenv init -)"' >> ~/.zshrc
$ source ~/.zshrc

# 如果是bash：
$ echo 'export PATH="$HOME/.jenv/bin:$PATH"' >> ~/.bash_profile
$ echo 'eval "$(jenv init -)"' >> ~/.bash_profile
$ source ~/.bash_profile
```

查看当前安装的jdk版本：

```shell
$ jenv doctor

[OK]	No JAVA_HOME set
[ERROR]	Java binary in path is not in the jenv shims.
[ERROR]	Please check your path, or try using /path/to/java/home is not a valid path to java installation.
	PATH : /Users/user/.jenv/libexec:/Users/user/.jenv/shims:/Users/user/.jenv/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
[OK]	Jenv is correctly loaded
```

<br/>

## **jenv使用**

使用例子如下：

```shell
# 添加jdk：设置 JDK 在的目录即可
# 用法：jenv add {jdk安装位置}
$ jenv add /Library/Java/JavaVirtualMachines/jdk-11.0.16.1.jdk/Contents/Home

oracle64-11.0.16.1 added
11.0.16.1 added
11.0 added
11 added

# 查看已安装的版本
# 前面带*号的，就是当前设置的版本
$ jenv versions
  system
  1.8
  1.8.0.333
  11
  11.0
  11.0.16.1
* oracle64-1.8.0.333 (set by /Users/zk/.jenv/version)
  oracle64-11.0.16.1
  
# 设置全局jdk版本
$ jenv global oracle64-11.0.16.1
$ java -version
java version "11.0.16.1" 2022-08-18 LTS
Java(TM) SE Runtime Environment 18.9 (build 11.0.16.1+1-LTS-1)
Java HotSpot(TM) 64-Bit Server VM 18.9 (build 11.0.16.1+1-LTS-1, mixed mode)

# 设置当前shell的jdk版本
$ jenv shell oracle64-1.8.0.333
$ java -version
java version "1.8.0_333"
Java(TM) SE Runtime Environment (build 1.8.0_333-b02)
Java HotSpot(TM) 64-Bit Server VM (build 25.333-b02, mixed mode)

# 设置当前文件夹的jdk版本
$ jenv shell local oracle64-17.0.3.1
$ java -version
java version "17.0.3.1" 2022-04-22 LTS
Java(TM) SE Runtime Environment (build 17.0.3.1+2-LTS-6)
Java HotSpot(TM) 64-Bit Server VM (build 17.0.3.1+2-LTS-6, mixed mode, sharing)
```

<br/>

# **附录**

官方网站：

-   https://www.jenv.be/


<br/>
