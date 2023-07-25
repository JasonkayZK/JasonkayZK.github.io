---
title: 在Gitee搭建Github Pages
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?74'
date: 2020-09-18 19:10:08
categories: 工具分享
tags: [工具分享, 博客管理, Github]
description: 最近发现Gitee里面可以导入Github的仓库，甚至也支持像Github Pages一样搭建自己的博客，就搞了一下；这么做的一个目的是有时在Github部署的博客国内不能访问；
---

最近发现Gitee里面可以导入Github的仓库，甚至也支持像Github Pages一样搭建自己的博客，就搞了一下；

这么做的一个目的是有时在Github部署的博客国内不能访问；

<br/>

<!--more-->

<br/>

## 在Gitee搭建Github Pages

上周，工信部官宣把开源中国的码云 Gitee 作为 GitHub 的备胎；加上博客最近在国内不能正常的访问，所以我就在想：不利用码云 Pages 再搭一个博客平台的镜像呢？

下面将会介绍如何在Gitee搭建Github Pages的镜像；

><br/>
>
>首先你要有一个Github Pages；
>
>如果你还没有Github Pages，请Google一下如何利用Github搭建一个博客；

<BR/>

### GitHub Pages仓库复制到码云

登录码云，点击右上角的 + 号，选择「新建仓库」，如下图所示：

![gitee1.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/gitee1.png)

出现以下界面后，点击「导入已有仓库」：

![gitee2.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/gitee2.png)

>   <BR/>
>
>   这里需要注意的是：
>
>   <font color="#f00">**需要把仓库名称和路径改成你的码云账号；**</font>
>
>   <font color="#f00">**比如说我的码云账号是jasonkay，那仓库名称和路径就填写jasonkay，如上图；**</font>
>
>   否则最后的生成的博客访问路径就会是类似于下面的：
>
>    https://jasonkay.gitee.io/jasonkay.github.io/

在输入框中填写 GitHub Pages 地址：

![gitee3.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/gitee3.png)

>   <BR/>
>
>   码云会自动将 GitHub Pages 的一些信息复制过来！

点击「创建」，静静地等待即可完成；

最后仓库就复制成功了！

<BR/>

### 启用码云 Pages

在菜单栏找到服务，选择「Gitee Pages」，见下图： 

![gitee4.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/gitee4.png)

最后点击「启动」(我这里部署过了，所以是更新)，见下图：

![gitee5.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/gitee5.png)

稍等片刻，即可部署成功！

下面访问你的博客吧！

><BR/>
>
><font color="#f00">**需要注意的是，在Gitee部署的Gitee Pages甚至都不需要仓库是公开的！**</font>
>
><font color="#f00">**而在Github如果不是会员，则搭建的博客必须是Public的！**</font>

<BR/>

### 百度收录

百度提供了一个提交链接的入口，地址如下：

>   https://ziyuan.baidu.com/linksubmit/url

填写码云 Pages 的链接：https://jasonkay.gitee.io/，并「提交」；

这样做的好处是，网站可以主动向百度搜索推送数据，缩短爬虫发现网站链接的时间；

另外，进入到百度的站点管理，地址如下：

>   https://ziyuan.baidu.com/site/index#/

按照对应步骤将 https://jasonkay.gitee.io/ 添加进来；

<br/>

## 附录

现在如果Github Pages不可用了，还可以使用Gitee Pages访问；

这样就方便了很多；

<br/>