---
title: IDEA中设置JVM运行参数
toc: true
date: 2019-11-25 10:09:54
cover: http://api.mtyqx.cn/api/random.php?23
categories: 软件安装与配置
description: 对JVM运行参数进行修改是JVM性能调优的重要手段，下面介绍在应用程序开发过程中JVM参数设置的几种方式
---

对JVM运行参数进行修改是JVM性能调优的重要手段，下面介绍在应用程序开发过程中JVM参数设置的几种方式

<br/>

<!--more-->

## 方式一

java程序运行时指定 `-Dproperty=value`

该参数通常用于设置系统级全局变量值，如配置文件路径，保证该属性在程序中任何地方都可访问。当然，也可以通过在程序中使用System.setProperty进行设置。

>   <br/>
>
>   **注意：**
>
>   **① 如果-Dproperty=value的value中包含空格，可以将value使用引号引起来。例如：-Dmyname="hello world"**
>
>   **② 如果配置了-Dproperty=value参数，又在程序中使用了System.setProperty对同一个变量进行设置，那么以程序中的设置为准**

<br/>

## 方式二

在idea开发环境中修改，JVM参数，修改方式如下图：

![IDEA中设置JVM运行参数1.png](https://jasonkay_image.imfast.io/images/IDEA中设置JVM运行参数1.png)

![IDEA中设置JVM运行参数2.png](https://jasonkay_image.imfast.io/images/IDEA中设置JVM运行参数2.png)

<br/>

## 方式三

① 打开IDEA安装目录中的bin目录

② 找到并打开`idea64.vmoptions`配置文件，编辑该配置文件保存

③ 重新启动idea才能生效

><br/>
>
>**注意: 三种方式的优先级关系: 方式一 > 方式二 > 方式三**

<br/>

