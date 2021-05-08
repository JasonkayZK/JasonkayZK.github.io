---
title: Ubuntu工作区（workspace）介绍
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?89'
date: 2021-05-07 22:10:45
categories: Linux
tags: [Linux]
description: 在Windows10中，可以手动创建多个桌面，并且可以在多个桌面之间切换；Ubuntu中提供了类似的功能被称为Workspace；本文讲述了Ubuntu中Workspace相关的内容；
---

在Windows10中，可以手动创建多个桌面，并且可以在多个桌面之间切换；Ubuntu中提供了类似的功能被称为Workspace；

本文讲述了Ubuntu中Workspace相关的内容；

<br/>

<!--more-->

## **Ubuntu工作区（workspace）介绍**

### **Ubuntu中的工作区**

与Windows中静态桌面不同的是，在Ubuntu 18.04后采用动态的Workspace功能，即：

-   当你只使用一个workspace的时候，系统就是会留出一个空白的workspace，所以这个正常状态下只会显示两个；
-   如果你在第二个workspace中也打开一些文件，那么系统就是自动为你开辟一个新的workspace，这时候你就发现已经变成了三个workspace，也就是说总会有个workspace是空的！

**默认情况下，Ubuntu 都是采用动态工作空间，这意味着它将根据需要创建更多的工作空间；**

如果你希望工作区的数量是静态的，可以从Ubuntu软件或通过以下方式安装Gnome Tweaks：

```bash
sudo apt-get install gnome-tweaks
```

然后，直接进入工作区并将它们设置为所需的静态桌面数量；

<br/>

### **查看工作区**

和工作区相关的Ubuntu官方文档：

-   [窗口和工作区](https://help.ubuntu.com/lts/ubuntu-help/shell-windows.html.zh-CN)

按下`Super`键（即Windows键），可以进入[Activities](https://help.ubuntu.com/lts/ubuntu-help/shell-introduction.html.zh-CN#activities)界面，此时将光标移动到屏幕的最右侧，垂直面板将展开，显示正在使用的工作空间以及一个空的工作空间，这就是工作区选择器；

如下图所示：

![ubuntu_workspace_1.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/ubuntu_workspace_1.png)

**要添加工作区，请将窗口从现有工作区拖放到工作区选择器中的空工作区中；现在，此工作空间包含您放置的窗口，并且在其下方将出现一个新的空工作空间；**

**要删除工作区，只需关闭其所有窗口或将它们移至其他工作区即可；**

>   **注：系统会保留至少一个工作区；**

<br/>

### **工作区相关操作**

#### **切换工作区**

**① 使用鼠标**

-   打开[Activities](https://help.ubuntu.com/lts/ubuntu-help/shell-introduction.html.zh-CN#activities)界面；
-   在屏幕右侧的工作区选择器中单击一个工作区，以查看该工作区上打开的窗口；
-   单击任何窗口缩略图以激活工作区；

****

**② 使用键盘快捷键**

-   按`Ctrl + Alt + Up`移至工作空间选择器中当前工作空间上方显示的工作空间；
-   按`Ctrl + Alt + Down`移至工作空间选择器中当前工作空间下方显示的工作空间；

<br/>

#### **移动窗口至另一个工作区**

**① 使用鼠标**

-   打开[Activities](https://help.ubuntu.com/lts/ubuntu-help/shell-introduction.html.zh-CN#activities)界面；
-   点击并拖动窗口到屏幕的右边；
-   工作区选择器会展开；
-   把窗口放到一个空的工作区上。这个工作区现在包含了你所拖动的窗口，一个新的空工作区出现在工作区选择器的右边，并且在工作空间选择器的底部将出现一个新的空工作空间；

****

**② 使用键盘快捷键**

-   选择你要移动的窗口（例如，使用Super+Tab窗口切换器）；
-   按`Ctrl + Alt + Shift + Up`键，将窗口移动到工作区选择器上的当前工作区之上的工作区；
-   按`Ctrl + Alt + Shift + Page Down`键，可以将窗口移动到工作区选择器上当前工作区的下方；

<br/>

