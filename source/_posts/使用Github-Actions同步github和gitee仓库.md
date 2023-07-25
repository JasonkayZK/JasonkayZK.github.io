---
title: 使用Github-Actions同步github和gitee仓库
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?22'
date: 2020-10-23 18:11:08
categories: Github
tags: [Github, Gitee, Github-Actions]
description: 在之前的一篇文章中，我讲解了如何使用Gitee同步Github Pages代码，并生成gitee的博客。但是到目前为止，在使用Gitee同步代码时还需要手动进行同步，很少麻烦。所以本文继续使用Github-Actions实现Github和Gitee仓库之间的同步；
---

在之前的一篇文章[在Gitee搭建Github-Pages](https://jasonkayzk.github.io/2020/09/18/在Gitee搭建Github-Pages/)中，我讲解了如何使用Gitee同步Github Pages代码，并生成gitee的博客。但是到目前为止，在使用Gitee同步代码时还需要手动进行同步，很少麻烦。

所以本文继续使用Github-Actions实现Github和Gitee仓库之间的同步；

源代码：

-   https://github.com/JasonkayZK/hub_sync_action

<br/>

<!--more-->

## 使用Github-Actions同步github和gitee仓库

>   关于如何在Gitee搭建一个Github-Pages可以参考我之前的文章：
>
>   [在Gitee搭建Github-Pages](https://jasonkayzk.github.io/2020/09/18/在Gitee搭建Github-Pages/)
>
>   关于如何使用Github-Actions可以参考我的文章：
>
>   [Github-Actions总结](https://jasonkayzk.github.io/2020/08/28/Github-Actions总结/)

本文使用[Yikun/hub-mirror-action](https://github.com/Yikun/hub-mirror-action)实现，并且本文仅会讲解如何使用Github-Actions将Github的仓库同步至Gitee(Gitee同步至Github的步骤类似)；

<br/>

### **① 配置SSH key**

为了能让Gitee访问我们的Github仓库，首先要在Gitee中添加一个SSH-key的公钥：

使用下面命令生成一个key：

```bash
ssh-keygen -t rsa -C <你的邮箱>
```

然后将`.pub`结尾的公钥上传到gitee；

随后在Github创建一个专门用来同步的仓库，并把私钥上传到这个仓库的Secrets中；

命名为：`GITEE_PRIVATE_KEY`

不知道怎么配置Secret的看这个：[Github-Actions总结#使用Secrets](https://jasonkayzk.github.io/2020/08/28/Github-Actions总结/#使用Secrets)

****

### **② 配置Gitee-Token**

为了让Github可以操作Gitee中的仓库等内容，和Github类似，我们还需要一个Gitee中的Token；

所以在Gitee你的个人设置中创建一个Gitee令牌(私人令牌)：

![gitee_token_1.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/gitee_token_1.png)

这里选择所有权限即可：

![gitee_token_2.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/gitee_token_2.png)

创建完成后要记号这个token的内容，他只显示一次；(忘记了也没关系，重新创建一个即可)

将这个Gitee令牌也配置在Github仓库的Secrets中，命名为`GITEE_TOKEN`；

****

### **③ 创建workflow**

之前说过，在Github中项目根目录中`.github\workflow`下的YAML配置文件都会被认为是一个Github Actions；

所以我们这个仓库只需要在`.github\workflow`中编辑一个YAML文件即可完成每天的同步功能！

下面先给一个代码示例，这个也是我目前在用的：

```yaml
on:
  workflow_dispatch:
  schedule:
    - cron: '0 1 * * *'

name: Mirror GitHub Selected Repos to Gitee
jobs:
  run:
    name: Run
    runs-on: ubuntu-latest
    steps:
    - name: Checkout source codes
      uses: actions/checkout@v2
    - name: Mirror Github to Gitee with white list
      uses: Yikun/hub-mirror-action@master
      with:
        src: github/JasonkayZK
        dst: gitee/jasonkay
        dst_key: ${{ secrets.GITEE_PRIVATE_KEY }}
        dst_token:  ${{ secrets.GITEE_TOKEN }}
        static_list: 'JasonkayZK.github.io'
        force_update: true
```

其中`on`定义了工作流的触发方式，这里我设定了两种：

-   `workflow_dispatch`：手动触发，用于手动同步；
-   `schedule`：根据cron表达式定时触发，<font color="#f00">**cron表达式中的时间为标准UTC时间，比我们慢了八个小时（所以上面的时间是早上九点）**</font>

剩下的配置声明了同步的工作流：

主要逻辑就是：

首先使用`actions/checkout`获取Action源码；

然后使用`Yikun/hub-mirror-action`完成我们的同步工作；

在`Yikun/hub-mirror-action`中的几个必选参数有：

-   `src` 需要被同步的源端账户名，如github/jasonkayzk，表示Github的jasonkayzk账户；
-   `dst` 需要同步到的目的端账户名，如gitee/jasonkayzk，表示Gitee的jasonkayzk账户；
-   `dst_key` 用于在目的端上传代码的私钥(默认可以从~/.ssh/id_rsa获取），可参考[生成/添加SSH公钥](https://gitee.com/help/articles/4181)或[generating SSH keys](https://docs.github.com/articles/generating-an-ssh-key/)生成，并确认对应公钥已经被正确配置在目的端。对应公钥，Github可以在[这里](https://github.com/settings/keys)配置，Gitee可以[这里](https://gitee.com/profile/sshkeys)配置；
-   `dst_token` 创建仓库的API令牌， 用于自动创建不存在的仓库，Github可以在[这里](https://github.com/settings/tokens)找到，Gitee可以在[这里](https://gitee.com/profile/personal_access_tokens)找到；

最后，我使用的是静态名单的方式进行的同步，所以使用了`static_list`声明了我需要同步的仓库(多个使用`,`分割)；

并且为强行更新：即使用`git push -f`强制同步

>   <font color="#f00">**注意：开启后，会强制覆盖目的端仓库**</font>

>   对于有其他同步需求的，可以见原仓库中的说明：
>
>   https://github.com/Yikun/hub-mirror-action

****

### **④ 验证同步**

最后提交你的代码，并试着手动执行；

如果没有问题的话，你的Github仓库就会被乖乖的被同步到Gitee中；

****

### **后记**

由于同步是使用push操作的，所以：

**当源仓库未发生变化时，是不会在目标仓库生成一条commit同步记录的！**

但是，由于目前在同步时，**源-目标仓库命名会相同：这个时候使用Gitee创建的Gitee-Pages访问路径会很长；**

目前还未想出如何将github下命名为aaa的仓库同步至bbb仓库中，不过我已经给这个Action的作者提了issue：

[同步时，Github和Gitee的仓库名可否不同？](https://github.com/Yikun/hub-mirror-action/issues/64)

希望能够解决这个问题；

>目前关于仓库映射给出的解决方案：
>
>[同步时，Github和Gitee的仓库名可否不同？](https://github.com/Yikun/hub-mirror-action/issues/64)

<br/>

## 附录

源代码：

-   https://github.com/JasonkayZK/hub_sync_action
-   https://github.com/Yikun/hub-mirror-action

<br/>