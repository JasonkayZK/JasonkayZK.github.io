---
title: Mac合盖后不休眠
toc: true
cover: 'https://img.paulzzh.com/touhou/random?26'
date: 2024-06-30 10:01:08
categories: 工具分享
tags: [工具分享, 技术杂谈]
description: 让Mac即使合上盖子也不休眠，这样连上蓝牙耳机后即使合盖也能继续播放音乐等等；
---

让Mac即使合上盖子也不休眠，这样连上蓝牙耳机后即使合盖也能继续播放音乐等等；

<br/>

<!--more-->

# **Mac合盖后不休眠**

因为苹果为了节能，默认盒盖后开启休眠模式，所以关闭它即可；

命令如下：

```
sudo pmset -a disablesleep 1
```

接下来你就可以尝试合盖听歌啦；

重新开启睡眠模式明亮：

```
sudo pmset -a disablesleep 0
```

<br/>

或者使用休眠设置软件：[Amphetamine ](https://links.jianshu.com/go?to=https%3A%2F%2Fwww.macw.com%2Fmac%2F3323.html%3Fid%3DMzAyODgyJl8mMjcuMTg2LjE0LjY5)

在「开启新回话」-「当app正在运行时」里面选择你要控制的应用

取消勾选“当显示器关闭时允许系统睡眠”，即可保持盒盖运行状态；

<br/>

# **附录**

文章参考：

-   https://www.jianshu.com/p/b7257c2f9def


<br/>
