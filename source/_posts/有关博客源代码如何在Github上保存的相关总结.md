---
title: 有关博客源代码如何在Github上保存的相关总结
toc: true
date: 2019-09-06 14:05:15
categories: 博客管理
tags: [博客管理, 博客美化, Git学习]
description: 教你如何在Github中保存源代码.
---

![avatar](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1567761824699&di=633c2ef16967472223b534b6eee9e1fb&imgtype=0&src=http%3A%2F%2Fwx1.sinaimg.cn%2Flarge%2F007z5ekzgy1fz8hzbldi3j30rs0fmjvj.jpg)

​		由于最近几天要从公司回学校, 而Hexo在github上面是只发布编译完成的代码的! 即github上面的master分支是只会保存你编译完成的html静态网页, 而对于你的配置源代码是都不会保存的! 所以本篇总结了如何通过Git分支来实现: 既保存了源代码, 又不影响静态网页的发布. 

<!--more-->

### 0. 前言

​		由于最近要回学校, 在学校期间也想写一下博客记录. 而Hexo在部署的时候, 是仅仅部署了编译过的静态资源的, 所以上传到github上面的*.github.io仓库的master分支时只会有静态资源.(废话!) 这样, <font color="#FF0000">你换一台电脑, 在进行git clone的时候, clone的其实只是你发布的静态资源. </font>

​		这就很蛋疼了! 这就意味这你想要在别的地方继续用你现在的开发环境就要使用U盘拷贝整个文件夹, 或者在新的电脑上重新搭建你的环境.....丢!

​		但其实, github本身不就是代码仓库吗? 为何不直接把源代码也保存在github呢? 答案是肯定的! 所以其实网上有以下几个比较常见的方法:

**1. 通过U盘拷贝, 每次换电脑之前, 都重新拷贝到U盘.**

**评价:**

​		文件少还好说, 另外, 拷贝之前还可以把`node_modules`文件夹删了, 省得一大堆js包. 直接在新的机器上cnpm install在安装就好了!

​		但是文件一多, 真的就会很麻烦. 复制 -> 删除 -> 复制. 而且这个方法是真的很不Geek!

**2. 通过再创建一个github仓库叫什么: xxxblog_backup**

**评价:**

​		嗯... 稍微Geek一点了, 但是几个文件夹来来回回复制, 即使在硬盘上也挺麻烦的啊! 有没有更简单的方法呢?

​		答案是肯定的!

​		通过Git分支功能即可完成在你的`./blog/`目录下同时支持Hexo和Git!

```bash
# Hexo 命令
hexo g
hexo s
hexo d --message '新写了一篇文章: xxx'

# Git命令
git add .
git commit -m '更新了一篇博客'
git push origin save
```

​		这里注意到, push的不再是master分支, 而是save分支了!

​		处理时参考了几篇博客的做法, 最后优化了一下这个博客的内容: [怎么去备份你的Hexo博客](https://www.jianshu.com/p/baab04284923)		

----------------------------

*这里是一个不存在的分割线~~~*

-------------------

### 1. 正文

​		本文针对的是<font color="#FF0000">已经在github搭建了仓库</font>的同学, 如果你还没有搭建仓库, 可以先试着搭建一个自己的博客哦!

*1. 在username.github.io仓库创建一个分支: **save** [名字可以随意];*

![在github上直接创建分支的方法](https://upload-images.jianshu.io/upload_images/4904768-028896088d24cd6a.png?imageMogr2/auto-orient/strip|imageView2/2/w/594)

*2. 设置save为你的默认分支:*

这里是为了让你提交的时候, 如果没有写明分支, 则默认提交到这个分支.

设置默认分支可参考: [Github官方](https://help.github.com/en/articles/setting-the-default-branch)

![设置save为你的默认分支](https://help.github.com/assets/images/help/repository/repository-options-branch.png)

*3. 将你的博客仓库clone到本地*

**注意: ** <font color="#FF0000">由于之前修改了分支, 所以clone的应该是save分支!</font>

*4. 删除所有文件, <font color="#FF0000">仅保留.git文件夹</font>*

​		这里可能要显示隐藏文件, 也删除就好.

*5. 将之前包括源代码的博客文件夹中的内容全部复制进来.*

*6. 将`themes/yilia/`(**这个和你用的博客主题有关**)下的`.git/`删除:*

*7. 这里是因为, 在一个git中, 不可以包括另外一个.git!*

这时即配置完成!



### 2. 修改

*1. 对于提交Github源码:*

通过你的老三步:

```bash
git add .
git commit -m '提交新的文章'
git push origin save
```

<font color="#FF0000">注意这里是save分支!</font>

*2. 对于发布博客:*

和你之前一点变化都没有!

```bash
hexo new 'new article title'
hexo g # 生成
hexo s # 本地查看
hexo d --message '发布新文章 ' # 发布
```

它们之间没有严格的顺序!

### 3. 远程clone

​		使用git clone时, <font color="#FF0000">指定克隆的分支也可以:</font>

```bash
git clone -b <指定分支名> <远程仓库地址>
```

​		之后和你保存的代码一模一样了, 但是要注意: <font color="#FF0000">你的`node_modules/`,`public/`,等目录都是不会被上传github的(被写在了.gitignore中了!)</font>

​		所以clone之后还需要在安装一下依赖:

```bash
cnpm install hexo-cli -g
cnpm install
cnpm install hexo-deployer-git
```

​		完成!

### 4. 总结

​		其实老司机都看得出, 这其实就是在github上重新建了一个save分支, 在本地换了一个git而已. 就是这么简单!

​		但是就是这么几个步骤, 就免去了你复制, 甚至动用U盘的功夫!

​		其实以上步骤和我参考的那个博客差不多, 但是在他的第三步中, 只是复制了几个文件. 对于我来说, 出现了部分资源缺失的问题:**使用hexo s之后, 部分图片找不到了!**

原因其实很简单:

​		<font color="#FF0000">因为在github上面生成save时, 分支进度就是你发布的静态资源的master分支进度, 你直接clone你的文件夹里面其实就是静态资源. 而采用我参考的那篇博客复制一小部分文件而没有删除静态资源可能导致路径出现问题!</font>

​		所以clone之后, **直接把文件删除(只剩下.git)**, 之后把原来的整个文件夹的内容复制过来即可. 虽然暴力了一点, 但是很省事, 也很方便!

### 5. 附录

Hexo的源文件说明：
1、`_config.yml`站点的配置文件，需要拷贝；
2、`themes/`主题文件夹，需要拷贝；
3、`source`博客文章的.md文件，需要拷贝；
4、`scaffolds/`文章的模板，需要拷贝；
5、`package.json`安装包的名称，需要拷贝；
6、`.gitignore`限定在push时哪些文件可以忽略，需要拷贝；
7、`.git/`主题和站点都有，标志这是一个git项目，不需要拷贝；
8、`node_modules/`是安装包的目录，在执行npm install的时候会重新生成，不需要拷贝；
9、`public`是hexo g生成的静态网页，不需要拷贝；
10、`.deploy_git`同上，hexo g也会生成，不需要拷贝；
11、`db.json`文件，不需要拷贝。

