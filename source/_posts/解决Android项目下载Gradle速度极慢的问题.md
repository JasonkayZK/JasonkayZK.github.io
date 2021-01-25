---
title: 解决Android项目下载Gradle速度极慢的问题
toc: true
cover: 'https://acg.toubiec.cn/random?2'
date: 2021-01-13 10:29:37
categories: Android
tags: [Android, Gradle]
description: AndroidStudio初始化项目时竟然遇到了下载Gradle速度极慢的问题，即使挂了梯子也不行？！网上一番搜索，找到了几个解决方案；
---

AndroidStudio初始化项目时竟然遇到了下载Gradle速度极慢的问题，即使挂了梯子也不行？！

网上一番搜索，找到了几个解决方案；

<br/>

<!--more-->

## **解决Android项目下载Gradle速度极慢的问题**

由于Android项目一般都是采用Gradle Wrapper的方式管理：这种方式不需要提前将Gradle下载好，而是自动根据本地缓存情况决定是否需要联网下载Gradle；

>   当然，也可以在Android Studio的File→Settings→Build,Execution,Deployment→Gradle中配置为离线模式，则不再使用Gradle Wrapper的方式；

而这个过程最难的一步竟然是第一步：下载Gradle；

对于使用Gradle下载依赖，阿里云镜像提供了CDN加速，但是对于Gradle本身，居然没办法下载；

下面给出几种解决方案：

### **Gradle SDK下载慢**

>   <font color="#f00">**首先要说一下：不要下载all的版本（它会附带源码和文档）而是下载带bin的版本；**</font>

#### **① 修改Gradle来源**

在项目的`gradle/wrapper/gradle-wrapper.properties`这个文件中可以看到配置：

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
distributionUrl=http\://services.gradle.org/distributions/gradle-6.5-all.zip
```

其中`distributionUrl`指定了Gradle发行版的地址，而这个`http://services.gradle.org/distributions/gradle-6.5-all.zip`访问起来是很慢的；

所以我们修改这个配置即可；

可以将其修改为国内的一个源，如：

```properties
distributionUrl=https\://code.aliyun.com/kar/gradle-all-zip/raw/master/gradle-6.5-all.zip
```

在这里提供了Gradle 6.x的阿里云地址：

-   [国内借助阿里云CDN快速下载Gradle 6.x zip安装包](https://www.kagura.me/dev/20200828131600.html)

但其实在2019年3月，**Gradle开启了在中国地区的CDN，下载Gradle的distribution已经不需要翻墙！**

修改gradle文件夹下面的gradle-wrapper.properties中的`http://services.gradle.org`为：

**`http://downloads.gradle-dn.com`**

即可！

>   <font color="#f00">**但是经过我实测，`http://downloads.gradle-dn.com`的下载速度还是不太行……，所以还是推荐使用阿里云的CDN的方法！**</font>

#### **② 手动下载Gradle**

在项目的`gradle/wrapper/gradle-wrapper.properties`这个文件中可以看到配置：

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
distributionUrl=http\://services.gradle.org/distributions/gradle-6.5-all.zip
```

然后找到 gradle-6.5-all.zip 这就是你要下载的版本，去网上手动下载一个；

然后找到 `$User/.gradle/wrapper/dists`中创建一个对应版本的文件夹以及下面的一个SHA256签名的目录，直接将zip拷贝进去（无需解压缩）；

关闭项目，重新打开即可；

>   强烈不推荐手动下载Gradle；
>
>   <font color="#f00">**你甚至都可以将上述配置中的`distributionUrl`修改为网上的一个地址，重新打开项目，这时项目会自动从这个地址下载Gradle，而避免手动下载、复制压缩包；**</font>

#### **③ 使用本地Gradle**

如果本地存在了Gradle，可以使用本地的Gradle；

在`Android Studio`设置，找到`Gradle`，指定本地Gradle位置；

>   **但是这样就无法实现Gradle Wrapper支持多版本构建的优势了！**

<br/>

### **其他：Gradle依赖镜像源**

Gradle下载依赖较慢的问题，基本上都已经被讲烂了，解决方法就是：换镜像源！

把maven库地址改成阿里云的地址，找到根目录下的`build.gradle`，进行如下修改：

```diff
buildscript {
    repositories {
+       maven{url 'http://maven.aliyun.com/nexus/content/groups/public/'}
+       maven{url "https://jitpack.io" }
        google()
-       // jcenter()
-       // mavenCentral()
    }
}

allprojects {
    repositories {
+       maven{url 'http://maven.aliyun.com/nexus/content/groups/public/'}
        google()
-       // jcenter()
    }
}
```

<br/>