---
title: Linux截图工具总结
toc: true
cover: 'https://img.paulzzh.com/touhou/random?34'
date: 2021-05-07 21:03:59
categories: Linux
tags: [Linux]
description: Linux自身已经提供了比较方便的截屏快捷键，本文以Ubuntu为例，讲述了几种截图方式；
---

Linux自身已经提供了比较方便的截屏快捷键，本文以Ubuntu为例，讲述了几种截图方式；

<br/>

<!--more-->

## **Linux截图工具总结**

### **前言**

当我的主力操作系统从 Windows 转换到 Ubuntu 的时候，首要考虑的就是屏幕截图工具的可用性。尽管使用默认的键盘快捷键也可以获取屏幕截图，但如果使用屏幕截图工具，可以更方便地对屏幕截图进行编辑；

本文将会介绍在不使用第三方工具的情况下，如何通过系统自带的方法和工具获取屏幕截图，另外还会介绍一些可用于 Linux 的最佳截图工具；

<br/>

### **方法 1：在 Linux 中截图的默认方式**

如果只需要获取一张屏幕截图，不对其进行编辑的话，那么键盘的默认快捷键就可以满足要求了；

而且不仅仅是 Ubuntu ，绝大部分的 Linux 发行版和桌面环境都支持以下这些快捷键：

-   **`PrtSc` – 获取整个屏幕的截图并保存到 Pictures 目录。**
-   **`Shift + PrtSc` – 获取屏幕的某个区域截图并保存到 Pictures 目录。**
-   **`Alt + PrtSc` –获取当前窗口的截图并保存到 Pictures 目录。**
-   **`Ctrl + PrtSc` – 获取整个屏幕的截图并存放到剪贴板。**
-   **`Shift + Ctrl + PrtSc` – 获取屏幕的某个区域截图并存放到剪贴板。**
-   **`Ctrl + Alt + PrtSc` – 获取当前窗口的 截图并存放到剪贴板。**

如上所述，在 Linux 中使用默认的快捷键获取屏幕截图是相当简单的；

但如果要在不把屏幕截图导入到其它应用程序的情况下对屏幕截图进行编辑，还是使用屏幕截图工具比较方便；

<br/>

### **方法 2：在 Linux 中使用 Flameshot 获取屏幕截图并编辑**

`flameshot`功能概述：

-   注释 (高亮、标示、添加文本、框选)
-   图片模糊
-   图片裁剪
-   上传到 Imgur
-   用另一个应用打开截图

Flameshot 在去年发布到 [GitHub](https://link.zhihu.com/?target=https%3A//github.com/lupoDharkael/flameshot)，并成为一个引人注目的工具；

如果你需要的是一个能够用于标注、模糊、上传到 imgur 的新式截图工具，那么 Flameshot 是一个好的选择；

下面将会介绍如何安装 Flameshot 并根据你的偏好进行配置；

如果你用的是 Ubuntu，那么只需要在 Ubuntu 软件中心上搜索，就可以找到 Flameshot 进而完成安装了；要是你想使用终端来安装，可以执行以下命令：

```bash
sudo apt install flameshot
```

如果你在安装过程中遇到问题，可以按照[官方的安装说明](https://link.zhihu.com/?target=https%3A//github.com/lupoDharkael/flameshot%23installation)进行操作；

安装完成后，你还需要进行配置；

尽管可以通过搜索来随时启动 Flameshot，但如果想使用 `PrtSc` 键触发启动，则需要指定对应的键盘快捷键。

以下是相关配置步骤：

-   进入系统设置中的“键盘设置”；

-   页面中会列出所有现有的键盘快捷键，拉到底部就会看见一个 “+” 按钮；

-   点击 “+” 按钮添加自定义快捷键并输入以下两个字段：

-   -   “名称”： 任意名称均可。
    -   “命令”： `/usr/bin/flameshot gui`；

-   最后将这个快捷操作绑定到 `PrtSc` 键上，也可以是其他按键；（这可能会提示与系统的截图功能相冲突，但可以忽略掉这个警告。）

<br/>

### **方法 3：在 Linux 中使用 Shutter 获取屏幕截图并编辑**

功能概述：

-   注释 (高亮、标示、添加文本、框选)
-   图片模糊
-   图片裁剪
-   上传到图片网站

[Shutter](https://link.zhihu.com/?target=http%3A//shutter-project.org/) 是一个对所有主流 Linux 发行版都适用的屏幕截图工具；

尽管最近已经不太更新了，但仍然是操作屏幕截图的一个优秀工具；

>   在使用过程中可能会遇到这个工具的一些缺陷：Shutter 在任何一款最新的 Linux 发行版上最常见的问题就是由于缺少了任务栏上的程序图标，导致默认禁用了编辑屏幕截图的功能；
>
>   对于这个缺陷，还是有解决方案的；
>
>   你只需要跟随我们的教程[在 Shutter 中修复这个禁止编辑选项并将程序图标在任务栏上显示出来](https://link.zhihu.com/?target=https%3A//itsfoss.com/shutter-edit-button-disabled/)，问题修复后，就可以使用 Shutter 来快速编辑屏幕截图了；

同样地，在软件中心搜索也可以找到进而安装 Shutter，也可以在基于 Ubuntu 的发行版中执行以下命令使用命令行安装：

```bash
sudo apt install shutter
```

类似 Flameshot，你可以通过搜索 Shutter 手动启动它，也可以按照相似的方式设置自定义快捷方式以 `PrtSc` 键唤起 Shutter；

如果要指定自定义键盘快捷键，只需要执行以下命令：

```bash
shutter -f
```

<br/>

### **方法 4：在 Linux 中使用 GIMP 获取屏幕截图**

功能概述：

-   高级图像编辑功能（缩放、添加滤镜、颜色校正、添加图层、裁剪等）
-   截取某一区域的屏幕截图

如果需要对屏幕截图进行一些预先编辑，GIMP 是一个不错的选择。

通过软件中心可以安装 GIMP。如果在安装时遇到问题，可以参考其[官方网站的安装说明](https://link.zhihu.com/?target=https%3A//www.gimp.org/downloads/)。

要使用 GIMP 获取屏幕截图，需要先启动程序，然后通过 “File-> Create-> Screenshot” 导航。

打开 Screenshot 选项后，会看到几个控制点来控制屏幕截图范围。点击 “Snap” 截取屏幕截图，图像将自动显示在 GIMP 中可供编辑；

<br/>

### **方法 5：在 Linux 中使用命令行工具获取屏幕截图**

这一节内容仅适用于终端爱好者；

如果你也喜欢使用终端，可以使用 `gnome-screenshot` 或 `ImageMagick` 或 `Deepin Scrot`，大部分流行的 Linux 发行版中都自带这些工具；

要立即获取屏幕截图，可以执行以下命令：

#### **GNOME 截图工具（可用于 GNOME 桌面）**

```bash
gnome-screenshot
```

GNOME 截图工具是使用 GNOME 桌面的 Linux 发行版中都自带的一个默认工具；

如果需要延时获取屏幕截图，可以执行以下命令（这里的 `5` 是需要延迟的秒数）：

```bash
gnome-screenshot -d -5
```

<br/>

#### **ImageMagick**

如果你的操作系统是 Ubuntu、Mint 或其它流行的 Linux 发行版，一般会自带 [ImageMagick](https://link.zhihu.com/?target=https%3A//www.imagemagick.org/script/index.php) 这个工具；

如果没有这个工具，也可以按照[官方安装说明](https://link.zhihu.com/?target=https%3A//www.imagemagick.org/script/install-source.php)使用安装源来安装；

你也可以在终端中执行这个命令：

```bash
sudo apt-get install imagemagick
```

安装完成后，执行下面的命令就可以获取到屏幕截图（截取整个屏幕）：

```bash
import -window root image.png
```

这里的 “image.png” 就是屏幕截图文件保存的名称。

要获取屏幕一个区域的截图，可以执行以下命令:

```bash
import image.png
```

<br/>

#### **Deepin Scrot**

`Deepin Scrot` 是基于终端的一个较新的截图工具；

和前面两个工具类似，一般自带于 Linux 发行版中；

如果需要自行安装，可以执行以下命令：

```bash
sudo apt install scrot
```

安装完成后，使用下面这些命令可以获取屏幕截图；

获取整个屏幕的截图：

```bash
scrot myimage.png
```

获取屏幕某一区域的截图：

```bash
scrot -s myimage.png
```

<br/>

## **附录**

文章参考：

-   [在 Linux 下截屏并编辑的最佳工具](https://zhuanlan.zhihu.com/p/45919661)

<br/>

