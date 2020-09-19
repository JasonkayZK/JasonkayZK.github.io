---
title: 在Github免费领取你的Mac和Linux终端吧~
toc: true
cover: 'http://api.mtyqx.cn/api/random.php?45'
date: 2020-09-18 19:15:31
categories: 工具分享
tags: [工具分享, Github]
description: 今天RSS推送了一个挺有趣的东西，能通过Github Actions直接创建一个Mac或者Linux服务器，并且可以通过ssh直接连接；花了几分钟试了一下，感觉挺方便的！
---

今天RSS推送了一个挺有趣的东西，能通过Github Actions直接创建一个Mac或者Linux服务器，并且可以通过ssh直接连接；

花了几分钟试了一下，感觉挺方便的！

源代码：

-   https://github.com/JasonkayZK/fastmac

<br/>

<!--more-->

<br/>

## 在Github免费领取你的Mac和Linux终端吧~

觉得这个不错是由于，有的时候还需要在mac上跑一些代码进行跨平台的测试，但是手头又没有mac电脑；

而通过这个仓库，可以很方便的拉起一个macOS，并且内置了brew！

下面是大致的操作过程：

![](https://files.fast.ai/images/fastmac.png)

><BR/>
>
>注意：
>
>根据 [GitHub Actions Terms of Service](https://docs.github.com/en/github/site-policy/github-additional-product-terms#5-actions-and-packages)，项目必须是公开的，否则每个月使用的时间就是被限制的！(虽然每个action的时间已经被限制为6个小时！)
>
><font color="#f00">**另外，六个小时之后，Action就会被停止，然后所有资源都会被回收！**</font>

大致的使用方法在README基本上介绍的很详细了，但是由于README是英文的，这里就大概翻译一下；

<BR/>

### 克隆模板

首先，[点击这里](https://github.com/Jasonkayzk/fastmac/generate)克隆一个模板；

在 "repository name" 输入fastmac，然后点击 "Create repository from template" ；

稍等片刻之后，你的克隆仓库就成功创建了！

>   <BR/>
>
>   **注意：这里是Copy一个仓库，而非直接Fork一个仓库！**

接下来，在你克隆的仓库里面执行下面的步骤：

<BR/>

### 在Actions中启动mac工作流

点击仓库中的Actions，并选择`mac`工作流，如下图：

![fastmac1.png](https://jasonkay_image.imfast.io/images/fastmac1.png)

最后点击Run workflow，即可创建工作流(mac终端)；

<BR/>

### 通过ssh或浏览器访问终端

几秒钟后，刷新页面，会看到一个旋转的橙色圆圈；

单击旁边的“mac”超链接，如下图：

![fastmac2.png](https://jasonkay_image.imfast.io/images/fastmac2.png)

在下一个页面上，你会看到另一个旋转的橙色圆圈，这一次旁边有“build”，点击“build”，如下图：

![fastmac3.png](https://jasonkay_image.imfast.io/images/fastmac3.png)

这将显示创建工作流的log；

一段时间后，会执行`Setup tmate session`阶段，一旦完成自身安装，它将重复打印类似于如下行：

```bash
WebURL: https://tmate.io/t/ub7bnMg9RQxcWAXqRTKWrhvMz

SSH: ssh ub7bnMg9RQxcWAXqRTKWrhvMz@nyc1.tmate.io

WebURL: https://tmate.io/t/ub7bnMg9RQxcWAXqRTKWrhvMz

SSH: ssh ub7bnMg9RQxcWAXqRTKWrhvMz@nyc1.tmate.io

WebURL: https://tmate.io/t/ub7bnMg9RQxcWAXqRTKWrhvMz

......
```

复制并粘贴ssh行（例如：`ssh ub7bnMg9RQxcWAXqRTKWrhvMz@nyc1.tmate.io`）；

进入终端（强烈建议Windows用户尽可能使用WSL），按Enter键执行命令进入服务器；

之后，你会看到欢迎信息，按q键退出它，即可进入Mac shell！

shell已经安装了brew，因此可以轻松添加所需的任何软件！

当然也可以将“WebURL”粘贴到浏览器中，即可在浏览器中获得终端！

>   <BR/>
>
>   如果无法使用终端（例如，必须在手机或平板电脑上执行一些紧急操作）可以使用浏览器终端；
>
>   **但浏览器终端的可靠性不如ssh方法，而且并非所有的方法都能正常工作！**

<BR/>

### 停止终端

根据Github Actions对免费用户的限制，会话最多持续六个小时；

<font color="#f00">**但是当你完成工作后，应该直接它，否则你占用了一台其他人可能正在使用的计算机资源！**</font>

要关闭会话，单击Actions屏幕右侧的红色“Cancel workflow”即可，如下图：

![fastmac4.png](https://jasonkay_image.imfast.io/images/fastmac4.png)

<BR/>

### 使用Linux终端而非Mac

如果需要访问linux shell而非MacOS；

可以按照上面所有步骤操作，只是点击“linux”而不是“mac”来创建工作流；

<BR/>

### 使用SSH连接其他服务器

你还可以通过ssh从fastmac/linux实例连接到你的其他服务器；

首先，必须在fastmac项目的settings/secrets设置一个GitHub密码，其中包含连接到服务器所需的ssh私钥，如下图：

![fastmac5.png](https://jasonkay_image.imfast.io/images/fastmac5.png)

将该私钥其命名为SSH_KEY（必须是这个名字），并将**私钥文件**（例如：~/.ssh/id_rsa）内容粘贴为值；

保存secret，然后当使用fastmac/linux工作流进行其他服务器连接时，会发现终端已经准备好了密钥以供使用；

<BR/>

### 为终端添加启动脚本&文件

在你的`fastmac`仓库中，编辑{linux/mac}.sh文件，添加创建新会话时要自动运行的配置命令；

这些是bash脚本，在创建新会话时运行；

**此外，添加到这个repo中的任何文件都将在会话中可用！**

**因此，可以使用它来包含你想在fastmac/linux会话中访问的任何数据、脚本、信息等。**

<BR/>

### 后记

fastmac是[tmate](https://tmate.io/)的一个非常薄的封装，所以tmate的所有特性都是可用的！

tmate本身是基于[tmux](https://github.com/tmux/tmux/wiki)的，所以你也可以有这些功能；

实际上，这也意味着其他人也可以连接到同一个ssh会话，和你共享同一个屏幕！

这对于调试和支持非常方便！

与Github操作的集成由 [action-tmate](https://github.com/mxschmitt/action-tmate) 提供；

<BR/>

## 附录

源代码：

-   https://github.com/JasonkayZK/fastmac

<br/>