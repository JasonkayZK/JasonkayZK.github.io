---
title: 在Win10下交叉编译Electron项目
toc: true
cover: 'http://api.mtyqx.cn/api/random.php?73'
date: 2020-11-08 20:49:52
categories: Electron
tags: [Electron, 交叉编译]
description: 在上一篇文章中，我们使用Electron实现了免登录下载微博图片的应用；但是在文章最后进行交叉编译，打包发布时会有问题；本文针对这个问题给出了解决方案；
---

在上一篇文章[手把手教你使用Electron开发新浪微博免登录图片下载器](https://jasonkayzk.github.io/2020/11/04/手把手教你使用Electron开发新浪微博免登录图片下载器/)中，我们使用Electron实现了免登录下载微博图片的应用；

但是在文章最后进行交叉编译，打包发布时会有问题；本文针对这个问题给出了解决方案；


源代码: 

- https://github.com/JasonkayZK/weiboPicDownloader

<br/>

<!--more-->

## 在Win10下交叉编译Electron项目

### **前言**

在开发Electron时，一个好处是可以使用开发Web的一切技术开发桌面端；

另一个好处就是可以接用Web的跨平台的好处，一套代码开发全平台的桌面端；

但是在进行Electron交叉编译至其他平台时，会出现各种问题；

本文总结了在win10下编译[手把手教你使用Electron开发新浪微博免登录图片下载器](https://jasonkayzk.github.io/2020/11/04/手把手教你使用Electron开发新浪微博免登录图片下载器/)项目至其他平台时遇到的问题；

<br/>

### **Linux交叉编译无法找到background.js**

如果项目是根据[vue-cli-plugin-electron-builder](https://github.com/nklayman/vue-cli-plugin-electron-builder)构建的，在项目中的入口文件默认是`background.js`；

但是在编译至Linux/Mac平台时，会出现类似下面的问题：

```bash
Error: Application entry file "background.js" in the "/Users/xxx/Documents/npm/xxx-electron/vuecli/xxx/build/linux-unpacked/resources/app.asar" does not exist. 
Seems like a wrong configuration.
```

此时根据：

[Issue#188-Application entry file "electron/bundled/background.js" in the "....app.asar" does not exist](https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/188)

的解决方案：

<font color="#f00">将`package.json`中的`"main": "background.js"`修改为：`"main": "dist_electron\bundled\background.js" `即可；</font>

这个解决方案对我有效！

<br/>

### **编译get请求timeout**

在编译Linux/Mac平台代码时，会报错，类似于：

```bash
• cannot get, wait error=Get https://service.electron.build/find-build-agent?no-cache=1f42oro: dial tcp 51.15.76.176:443: connectex: A connection attempt failed because the connected party did not properly respond after a period of time, or established connection failed because connected host has failed to respond.
attempt=0
waitTime=2
• cannot get, wait error=Get https://service.electron.build/find-build-agent?no-cache=1f42oro: dial tcp 51.15.76.176:443: connectex: A connection attempt failed because the connected party did not properly respond after a period of time, or established connection failed because connected host has failed to respond.
attempt=1
waitTime=4
……
⨯ Get https://service.electron.build/find-build-agent?no-cache=1f42oro: dial tcp 51.15.76.176:443: connectex: A connection attempt failed because the connected party did not properly respond after a
period of time, or established connection failed because connected host has failed to respond.
⨯ C:\Users\mcw\AppData\Roaming\npm\node_modules\electron-builder\node_modules\app-builder-bin\win\x64\app-builder.exe exited with code ERR_ELECTRON_BUILDER_CANNOT_EXECUTE stackTrace=..
```

见下面的issue：

-   [Unable to build AppImage on Windows (service.electron.build)](https://github.com/electron-userland/electron-builder/issues/4318)
-   [Error: Cannot get, wait error=Get https://service.electron.build/find-build-agent?no-cache=1f42oro: dial tcp 51.15.76.176:443:](https://github.com/electron-userland/electron-build-service/issues/9)

解决方案在issue中也提到了，就是：

<font color="#f00">**在Docker中运行一个[electron-build-service](https://github.com/electron-userland/electron-build-service)环境！**</font>

根据下面的步骤：

**① 使用Docker拉取镜像electronuserland/builder**

命令如下:

```bash
docker pull electronuserland/builder
```

**② 创建容器和目录映射**

假设你的Electron项目根目录在`C:\MyAPP`，则根据下面的命令创建目录映射：

```bash
docker run --rm -ti -v C:\MyApp\:/project -w /project electronuserland/builder
```

上面的命令会将`C:\MyAPP`映射至容器中的`/project`目录下；

>   **注意：**
>
>   `--rm`为两个减号，表示一个长flag；
>
>   而`-it`为单个减号，表示`-t -i`的缩写；
>
>   这一点在上面的issue中作者写错了！
>
>   我在issue中已经指出来了！

**③ 安装依赖并编译**

执行上述命令后会创建一个容器，并进入交互状态；

随后执行下面的命令升级Electron项目的Yarn软件包，全局安装electron-builder：

```bash
cd /project
yarn upgrade
yarn global add electron-builder
```

最后执行下面的命令编译各个平台的代码：

-   win平台：`electron-builder --win`
-   mac平台：`electron-builder --mac`
-   linux平台：`electron-builder -l`

编译完成后，由于创建了容器和实际目录的映射关系，所以编译结果也会在dist目录下；

>   更多编译选项，见Electron-builder CLI官方文档：
>
>   -   https://www.electron.build/cli

我们就完成了跨平台交叉编译！

<br/>

## 附录

vue-cli-plugin-electron-builder仓库地址：

-   https://github.com/nklayman/vue-cli-plugin-electron-builder

源代码: 

- https://github.com/JasonkayZK/weiboPicDownloader

<br/>