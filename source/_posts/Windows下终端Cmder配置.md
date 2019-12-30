---
title: Windows下终端Cmder配置
toc: false
date: 2019-12-30 09:12:17
cover: http://api.mtyqx.cn/api/random.php?12
categories: 工具分享
tags: [工具分享, 软件推荐]
description: 最近切换为Windows下面之后各种不适应, 尤其是Windows的终端, cmd和powershell说实话, 都不好用. 并且和Linux下面不同, 右键都没有在此处打开终端(即使设置了快捷键Ctrl + Alt + T还是要切换路径)
---

最近切换为Windows下面之后各种不适应, 尤其是Windows的终端, cmd和powershell说实话, 都不好用. 并且和Linux下面不同, 右键都没有在此处打开终端(即使设置了快捷键Ctrl + Alt + T还是要切换路径), 所以搞了一个cmder并且配置了右键在当前路径打开, 感觉还可以哦~

<br/>

<!--more-->

cmder官网: https://cmder.net/

cmder的Github页面: https://github.com/cmderdev/cmder

在官网下载full-version, 并解压即完成安装

<br/>

## 配置

**1. 配置环境变量**

我的安装路径是安装的路径是：`E:\cmder`

把Cmder64.exe(或者Cmder.exe)存放的目录添加到系统环境变量

加完环境变量之后,Win+R一下输入cmder,即可出现Cmder窗口

<br/>

**2. 添加 cmder 到右键菜单**

环境变量添加后，在任意文件夹中即可打开Cmder，上一步的把 Cmder 加到环境变量就是为此服务的, **在管理员权限的cmd下输入以下语句即可:**

`Cmder.exe  /REGISTER ALL`

**最后，在任意文件夹右键都有Cmder的快捷方式**

<br/>

**3. 设置Cmder的启动快捷键**

在Windows下添加桌面快捷方式, 然后右键桌面的快捷方式图标即可设置快捷键(我设置的是Ctrl + Alt + T, 当然这个也是Ubuntu默认的终端快捷键)

<br/>

## 快捷键

    Ctrl + ` : 任务栏全局召唤
    Win + Alt + p : 首选项（或右键单击标题栏）
    Ctrl + t : 新建选项卡对话框（也许您想以管理员身份打开cmd？）
    Ctrl + w : 关闭选项卡
    Shift + Alt + number : 快速新建选项卡:
        1. CMD
        2. PowerShell
    Alt + Enter : 全屏
    Ctrl + Alt + u : 在目录结构中向上遍历
    End, Home, Ctrl : 像往常一样在Windows上遍历文本
    Ctrl + r : 历史搜索
    Shift + mouse : 从缓冲区选择和复制文本
    Right click / Ctrl + Shift + v : 粘贴文本

<br/>