---
title: Ubuntu下安装Typora
date: 2019-09-04 21:30:28
categories: 软件安装与配置
tags: [软件安装与配置, 软件推荐]
description: 在Ubuntu下的Markdown编辑器Typora的安装与配置
---

![avatar](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1567613971175&di=9f01d2812b4643e8d73d0bd91e16cefc&imgtype=0&src=http%3A%2F%2Fimg1.doubanio.com%2Flpic%2Fs28969587.jpg)

​		在Ubuntu下的Markdown编辑器Typora的安装与配置

<!--more-->

## Typora

​		一个Markdown阅读器.

### 1. 安装:

​		安装参考网站: [参考官方网站](https://typora.io/#linux)

```bash
# or run:
# sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys BA300B7755AFCFAE

wget -qO - https://typora.io/linux/public-key.asc | sudo apt-key add -

# add Typora's repository

sudo add-apt-repository 'deb https://typora.io/linux ./'

sudo apt-get update

# install typora

sudo apt-get install typora
```

<br/>

### 2. 注意事项:

​		需要注意的是, 这里有一个小坑:

​		在加入源时, 即你在执行: `add-apt-repository deb https://typora.io/linux ./` 之后可能会出现类似的错误:

```
W: Duplicate sources.list entry http://archive.ubuntukylin.com:10006/ubuntukylin/ trusty/main i386 Packages (/var/lib/apt/lists
```

​		此后, 只要使用apt update就会提示冲突: <font color="#ff0000">这可能是因为加入了多个源.</font>

​		只需要打开软件与更新, 选择其他软件在里面选择冲突的源, 并删除然后关闭即可!

<br/>

### 3. 配置:

主要设置有:

-   文字大小设置: 我是用的是20px;
-   默认缩进: 四个空格
-   即时渲染等;



