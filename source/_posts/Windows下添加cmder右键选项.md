---
title: Windows下添加cmder右键选项
cover: http://api.mtyqx.cn/api/random.php?21
date: 2020-05-10 14:19:09
categories: 软件安装与配置
tags: [软件安装与配置, cmder]
description: 本文讲解了在win下配置cmder, 在右键选项中添加在此处打开的功能, 方便使用;
---

本文讲解了在win下配置cmder, 在右键选项中添加在此处打开的功能, 方便使用;

<br/>

<!--more-->

**目录:**

<!-- toc -->

<br/>

## Windows下添加cmder右键选项

>   <br/>
>
>   PS: 最近刚刚入职腾讯, 开发环境改成了win, 配置什么的各种不习惯,开发语言也变成了Golang;

在windows下配置cmder右键选项网上大部分都是先修改环境变量, 然后再命令行RegistALL;

有时候还存在配置失败的场景;

其实只需要写一个`.reg`文件然后运行就可以了:

如创建一个`cmder.reg`的文件:

cmder.reg

```
Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\Directory\Background\shell\cmder]
@="Cmder Here"
"NoWorkingDirectory"=""
"Icon"="D:\\cmder\\icons\\cmder.ico"

[HKEY_CLASSES_ROOT\Directory\Background\shell\cmder\command]
@="\"D:\\cmder\\Cmder.exe\" \"%V\""
```

**需要注意的是: 要将cmd的路径指定为你的cmder安装路径即可!**

然后双击运行即可!

<br/>

### 其他

除了给cmder配置右键菜单选项之外, 还可以将cmder添加到桌面的快捷方式, 然后右键属性给快捷方式添加快捷键;

比如我就配置了和Ubuntu相同的快捷键: `Ctrl + Alt + T`

<br/>

## 附录

文章参考:

-   [Cmder添加右键菜单，在指定目录打开](https://www.jianshu.com/p/2736a36d5ced)

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>