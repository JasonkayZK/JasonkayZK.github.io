---
title: Github-Actions自动部署Hexo
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?99'
date: 2021-05-08 08:25:39
categories: [Github]
tags: [技术杂谈, Github]
description: 最近换上了Linux系统，安装的Node版本是14.x，在使用Hexo Deploy部署时，因为Node版本过高，导致无法通过部署了！与其切换Node版本，不如索性直接用Github-Actions远程部署算了。Github-Actions是 GitHub 官方 CI 工具，与 GitHub 无缝集成；本文记录了使用 GitHub-Actions 部署Hexo的全部流程。
---

最近换上了Linux系统，安装的Node版本是14.x，在使用Hexo Deploy部署时，因为Node版本过高，导致无法通过部署了！与其切换Node版本，不如索性直接用Github-Actions远程部署算了。

Github-Actions是 GitHub 官方 CI 工具，与 GitHub 无缝集成；

本文记录了使用 GitHub-Actions 部署Hexo的全部流程。

Github-Actions相关总结：

-   [Github-Actions总结](/2020/08/28/Github-Actions总结/)

<br/>

<!--more-->

## **Github-Actions自动部署Hexo**

### **前言**

关于Github-Actions，之前我已经写过一篇相关的文章，详细介绍了如何使用；

不熟悉Github-Actions的同学可以先去看看这篇：

-   [Github-Actions总结](/2020/08/28/Github-Actions总结/)

<br/>

### **步骤0：博客仓库准备**

GitHub 博客创建步骤非本文重点，网上一搜一大堆，请自行搜索；

推荐使用 `master` 分支作为最终部署分支，源码分支可以根据自己喜好创建，我使用的是 `save`分支；

<br/>

### **步骤1：生成ssh-key**

**源码分支中**通过下面命令生成公钥和私钥：

```bash
cd workspace/jasonkayzk.github.io 
git checkout save
ssh-keygen -t rsa -b 4096 -C "$(git config user.email)" -f github-deploy-key -N ""
```

目录中生成两个文件：

-   `github-deploy-key.pub` — 公钥文件
-   `github-deploy-key` — 私钥文件

>   <font color="#f00">**公钥和私钥切记要添加到 `.gitignore` 中！！！**</font>

<br/>

### **步骤2：博客仓库添加公钥**

在 GitHub 中博客工程中根据 `Settings -> Deploye keys -> Add deploy key` 找到对应的页面，然后进行公钥添加；

该页面中：

-   `Title` 自定义即可，我添加的是`hexo_deploy_pub`；
-   `Key` 中添加 `github-deploy-key.pub` 文件中的内容；

![github_deploy_key.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/github_deploy_key.png)

>   **注意：**
>
>   -   <font color="#f00">**切记不要多复制空格；**</font>
>
>   -   <font color="#f00">**切记要勾选 `Allow write access`，否则会出现无法部署的情况；**</font>

<br/>

### **步骤3：博客仓库添加Secrets私钥**

在 GitHub 中博客工程中按照 `Settings -> Secrets -> Add a new secrets` 找到对应的页面，然后进行私钥添加；

![github_secret_key_1.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/github_secret_key_1.png)

和上一步类似，该页面中：

-   `Name` 自定义即可，这里我使用的是`hexo_deploy_pri`；
-   `Value` 中添加 `github-deploy-key` 文件中的内容；

![github_secret_key_2.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/github_secret_key_2.png)

>   <font color="#f00">**注意：切记不要多复制空格!!!**</font>

<br/>

### **步骤4：创建Gtihub-Actions Workflow配置**

在博客源码分支(我这里是save分支)中创建 `.github/workflows/deploy.yml` 文件，内容如下：

```yaml
name: Build & Deploy Blog

on:
  workflow_dispatch:
  # push:
  #     branches:
  #       - save

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout source
        uses: actions/checkout@v1
        with:
          ref: save
      - name: Use Node.js ${{ matrix.node_version }}
        uses: actions/setup-node@v1
        with:
          version: ${{ matrix.node_version }}
      - name: Setup hexo
        env:
          ACTION_DEPLOY_KEY: ${{ secrets.hexo_deploy_pri }}
        run: |
          mkdir -p ~/.ssh/
          echo "$ACTION_DEPLOY_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan github.com >> ~/.ssh/known_hosts
          git config --global user.email "jasonkayzk@gmail.com"
          git config --global user.name "jasonkayzk"
          npm install hexo-cli -g
          npm install
      - name: Hexo deploy
        run: |
          hexo clean
          hexo d
```

其中：

-   `name`：所设置workflow在Github Actions中显示的名称，可自行设置；
-   `on`：Github Actions触发条件；
    -   workflow_dispatch表示手动触发；
    -   push（注释掉了）：对应分支push时自动触发；

`jobs`中声明了具体的workflow流程；

在使用时你需要修改：

-   <font color="#f00">**第17行：替换为你的源码分支，我这里是`save`；**</font>
-   <font color="#f00">**第24行：替换为你所创建secrets的名称，我这里是`hexo_deploy_pri`；**</font>
-   <font color="#f00">**第30、31行：替换为你的Git邮箱和用户名信息；**</font>

>   <font color="#f00">**创建的配置文件必须在仓库根目录下的`.github/workflows`目录下！**</font>

至此，Github Actions配置完成；

<br/>

### **步骤5：Hexo项目配置**

在项目根目录中修改 `_config.yml` ，增加部署相关内容：

```yaml
deploy:
  type: git
  repo: git@github.com:jasonkayzk/jasonkayzk.github.io.git
  branch: master

>   **注：**
>
>   -   <font color="#f00">**这里的repo必须要填写ssh的形式，使用https形式可能会有问题！**</font>
>   -   <font color="#f00">**branch为部署分支，通常为master（或者main）分支；**</font>

<br/>

### **部署测试**

现在 Hexo 已经和 GitHub Actions 已经集成了，接下来在博客源码分支上推送代码即可自动/手动编译部署；

具体执行过程可以在仓库的 `Actions` 中查看；

<br/>

## **附录**

文章参考：

-   [GitHub Actions 自动部署 Hexo](https://blog.csdn.net/xinruodingshui/article/details/105499161)


<br/>