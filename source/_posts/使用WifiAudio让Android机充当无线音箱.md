---
title: 使用WifiAudio让Android机充当无线音箱
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?11'
date: 2021-02-21 19:42:08
categories: [工具分享]
tags: [工具分享, Android]
description: 之前配的主机没有音箱，今天在小众软件上发现了一个可以让Android机充当无线音箱的软件WifiAudio。试了一下，延迟很低，体验非常不错！
---

之前配的主机没有音箱，今天在小众软件上发现了一个可以让Android机充当无线音箱的软件WifiAudio。试了一下，延迟很低，体验非常不错！

信息来源：

-   [WiFiAudio – 让 Android 手机充当无线音箱，通过 Windows/Linux 播放音乐](https://www.appinn.com/wifiaudio-for-android-and-windows/)

文件免费下载地址：

-   https://www.90pan.com/o151348

<br/>

<!--more-->

## **使用WifiAudio让Android机充当无线音箱**

使用方式非常简单：

### **安卓端安装**

首先，在Android机上安装一个名叫[wireless speaker for android](https://d.appinn.com/wireless-speaker-for-android/)的App：

![wifiaudio_1.jpg](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/wifiaudio_1.jpg)

安装后只需保证其后台运行即可，它会在 Windows 客户端启动后由Windows发起连接；

### **Windows端安装**

**WiFiAudio** **Server** 支持最低 Windows 7 系统，下载地址：

-   https://www.90pan.com/o151348

>   其他下载地址：
>
>   -   [官方下载页面](https://wifiaudio.boards.net/thread/2/wifiaudio-support-links-download-application)
>   -   [网盘搬运地址](https://590m.com/f/15690961-482999164-293391)

运行 **WiFiAudio** **Server** 后，需要填入手机的 IP 地址，一般在手机的设置页面、网络、Wi-Fi 中都可以看到，填入地址后，点击 Start（可以勾选`High Quality Audio`，即高质量音频）：

![wifiaudio_2.jpg](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/wifiaudio_2.jpg)

然后在Windows界面和手机界面最下方都能看到已连接了，并且在Android端会显示电脑的 IP 地址和已接收的数据包个数；

最后，只需要在电脑播放音乐，手机会同步响起音乐；

**注意：此时电脑仍然会播放出声，如果不需要可以静音，不影响手机。**

>   我大胆猜测，原理就是：
>
>   手机通过 Wi-Fi 与电脑相连，将电脑上的音频进行编码和压缩，然后经过路由器转发给手机，然后手机解码播放，至于使用的是TCP还是UDP，我也没仔细研究；

大概使用起来就是这么简单，Windows上的文件不到1M，手机APK也就1M多，可以说很是轻量了！

手机连上无线耳机，在PC上看视频、打游戏还是蛮爽的233！

<br/>

## **附录**

**信息来源：**

-   [WiFiAudio – 让 Android 手机充当无线音箱，通过 Windows/Linux 播放音乐](https://www.appinn.com/wifiaudio-for-android-and-windows/)

**文件免费下载地址：**

-   https://www.90pan.com/o151348

<br/>