---
title: '关于使用Git时push/pull超时, 以及Github访问慢的解决办法'
toc: true
date: 2019-10-10 21:32:56
categories: Git
cover: https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1570726027679&di=9399d91e4f2812b1188d4c409f69caad&imgtype=0&src=http%3A%2F%2Fku.90sjimg.com%2Felement_origin_min_pic%2F00%2F86%2F44%2F4056eb5f135855d.jpg
tags: [Git, Github]
description: 最近在使用Git向github提交代码的时候总是卡顿, 出现SSH连接超时的情况, 一开始以为是因为网络缘故, 后来发现是ssh本身配置的问题!
---



最近在使用Git向github提交代码的时候总是卡顿, 出现SSH连接超时的情况, 一开始以为是因为网络缘故, 后来发现是ssh本身配置的问题! 

阅读本篇你将学会:

-   加速国内Github访问的方法
-   解决git push/pull卡死
-   解决git push/pull ssh连接超时
-   ......

<br/>

<!--more-->

<br/>

### 前言

最近一段时间发现在使用git向github提交代码或者拉取代码的时候, 往往要等相当长的一段时间, 甚至有时会出现SSH超时的情况!

如下图, 命令一直停留, 直到超时:

![pull卡死](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/pull卡死.png)

<br/>

一开始以为是因为在国内访问github的时候由于丢包, 或者连接不稳定导致的问题, 所以先使用`ssh命令`做了一下连接测试:

```bash
ssh -T git@github.com

Hi JasonkayZK! You've successfully authenticated, but GitHub does not provide shell access.
```

最后返回的是可以通过ssh授权! 说明ssh没什么问题!

<br/>

之后又通过`mtr命令`查看了一下路由和丢包情况, 如图:

   ![mtrGithub](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/mtrGithub.png)

结果显示, 虽然延迟在265ms左右, 但是并没有很严重的丢包! 应该大概率也不会是网络的原因.

<br/>

最后经过查找大量的博客, 最后发现是<font color="#ff0000">由于ssh配置导致的问题!!!</font>



<br/>

-----------------



### 一. 解决git连接github超时问题

#### 1. 修改ssh配置[解决问题]

在等待`git pull`命令超时之后报出了类似: `ssh: connect to host github.com port 22: Connection timed out`的错误!

>   **原因是:** <font color="#ff0000">ssh 阻塞了22端口!</font>
>
>   **解决方法:** <font color="#ff0000">修改 ssh 的配置文件</font>

关于修改配置，存在两种解决方法:

-   `/etc/ssh/ssh_config` 中修改全局配置
-   在用户主目录下.ssh/中添加配置文件

这里选择的后者:

```bash
cd ~/.ssh/
vi config

# 在config中添加下面内容
Host github.com  
User git  
Hostname ssh.github.com 
PreferredAuthentications publickey  
IdentityFile ~/.ssh/id_rsa 
Port 443
```

即: 使用https的443端口进行访问!

对我来说解决了问题! 当然网上还有其他的解决方法, 我试了之后都未解决!

<br/>

#### 2. 先pull再push[未解决]

网上有说先pull(即使提醒`Everything is up-to-date`)!

但是对于我来说, pull和push一样都会卡死, 所以并未解决我的问题!

<br/>

#### 3. 添加sendpack.sideband属性[未解决]

网上还有解决方法是: 添加`sendpack.sideband`属性并置为false

```bash
# 全局的
git config --global sendpack.sideband false
# 仓库的
git config --local sendpack.sideband false
```

通过`git config --local -l` 查看仓库级配置，可以看到有sendpack.sideband这一项并且是置为false的!

```bash
git config --local -l 
```

笔者尝试过之后, 还是未解决问题!



<br/>

---------------

### 二. 加速国内Github访问

由于某些原因，国内访问Github会异常缓慢，在clone仓库时甚至只有10k以下的速度，下载半天有时还会失败需要从头再来，甚是让人恼火。 

本小节介绍<font color="#ff0000">通过修改系统hosts文件的办法，绕过国内dns解析，直接访问GitHub的CDN节点，从而达到加速的目的.</font>

#### 1. 获取GitHub官方CDN地址

打开https://www.ipaddress.com/

查询以下三个链接的DNS解析地址: 

```
github.com 
assets-cdn.github.com 
github.global.ssl.fastly.net
```

![DNS解析地址](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/DNS解析地址.png)

记录下查询到的IP地址!

<br/>

#### 2. 修改系统Hosts文件

修改系统的Hosts文件:

-   Linux: `/etc/hosts`
-   Windows: `C:\Windows\System32\drivers\etc`

```bash
sudo vi /etc/hosts

# 添加下面三行
192.30.253.112    github.com
151.101.72.133    assets-cdn.github.com
151.101.193.194    github.global.ssl.fastly.net
```

<br/>

**注: **

-   需管理员权限
-   注意IP地址与域名间需留有空格
-   上面为(2019.10.10查询的IP, 时间不同可能有变化!!!)

<br/>

#### 3. 刷新系统DNS缓存

**Linux下:**

```bash
sudo /etc/init.d/networking restart
```

<br/>

**Windows下:**

Windows+X 打开系统命令行(管理员身份)或powershell 

运行 `ipconfig /flushdns` 手动刷新系统DNS缓存: 

![win刷新系统DNS缓存](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/win刷新系统DNS缓存.png)

<br/>

完成, 现在打开Github，clone一个项目到本地试试吧!



<br/>

-------------



### 附录

参考文章:

-   [Git push提交到远程仓库卡住的问题解决](https://blog.csdn.net/cekiasoo/article/details/54259921)
-   [git push 一直卡住](https://www.v2ex.com/t/431645)
-   [解决git连接github超时问题](https://www.cnblogs.com/sweetheartly/articles/9439798.html)
-   [加速国内Github访问](https://blog.csdn.net/w958660278/article/details/81161224)



