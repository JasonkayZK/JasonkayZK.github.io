---
title: 解决Github突然不支持密码访问的问题
toc: true
cover: 'https://img.paulzzh.com/touhou/random?11'
date: 2021-08-15 16:20:28
categories: Github
tags: [Github, 技术杂谈]
description: 今天提交代码到Github的时候，突然发现不能提交了；即使输入了自己的用户名和密码后，还是提示报错：Support for password authentication was removed. Please use a personal access token instead；最后才发现，原来Github从2021年8月13号开始，废除了使用密码登录，而是使用个人Token进行登录！
---

今天提交代码到Github的时候，突然发现不能提交了；即使输入了自己的用户名和密码后，还是提示报错：Support for password authentication was removed. Please use a personal access token instead；

最后才发现，原来Github从2021年8月13号开始，废除了使用密码登录，而是使用个人Token进行登录！

<br/>

<!--more-->

# **解决Github突然不支持密码访问的问题**

关于Github废除个人密码登录，使用个人Token登录的文章：

-   https://github.blog/2020-12-15-token-authentication-requirements-for-git-operations/

>   From August 13, 2021, github is longer accept account passwords when authenticating Git operations.
>
>   You need to add **PAT (Personal Access Token)** instead, you can follow the below method to add PFA on your system!

下面主要来说一下如何解决；

## **在Github创建个人Token**

打开Github，**点击右上角的头像** =>  **Settings** => **Developer Settings** => **Personal Access Token** => **Generate New Token；**

此时会让你重新登录，以打开Github的Root模式；

输入密码后，可以创建个人Token；

填写Token名称，并选择你所需要的权限和Token有效期，点击创建，即可生成一个Token（类似于：`ghp_sFhFsSHhTzMDreGRLjmks44zuzgthdvfsrta`）；

>   <font color="#f00">**我们需要记下这个Token，后面会用到，并且这个Token只会出现这一次！**</font>

<br/>

## **在操作系统添加个人Token配置**

### **Windows OS**

控制面板 => 凭据管理器 => Windows凭据；

>   也可以直接通过开始菜单查找`凭据管理器`；

查看是否存在 `git:https://github.com`凭据，不存在则创建：

![github_token_1](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/github_token_1.png)

用户名为你Github的用户名，密码修改为刚刚创建的个人Token！

完成！

<br/>

### **MAC OS**

使用`Command + 空格`打开Spotlight搜索：`钥匙串访问`或者`Keychain access`打开钥匙串访问；

找到`github.com`，修改密码为个人Token；

完成！

<br/>

### **Linux based OS**

在Linux下，先配置全局的Git的用户名和邮箱：

```bash
$ git config --global user.name ""
$ git config --global user.email ""
$ git config -l
```

随后，使用Git拉取Github下任意仓库：

```bash
$ git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY
> Cloning into `Spoon-Knife`...
$ Userame for 'https://github.com' : username
$ Password for 'https://github.com' : give your personal access token here # 你的个人Toekn！
```

创建Token的缓存：

```bash
$ git config --global credential.helper cache
```

>   删除本地Git缓存(如果你有需要)：
>
>   ```bash
>   git config --global --unset credential.helper
>   ```

<br/>

# **附录**

文章参考：

-   https://github.blog/2020-12-15-token-authentication-requirements-for-git-operations/
-   https://stackoverflow.com/questions/68775869/support-for-password-authentication-was-removed-please-use-a-personal-access-to

<br/>
