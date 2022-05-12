---
title: 管理Git在本地的远程分支追踪
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?23'
date: 2022-05-11 09:44:15
categories: Git
tags: [Git]
description: 如果远程的分支删除，本地会存在一个追踪的远程已经不存在的一个分支origin/xxx；如果这种分支太多，本地的分支看起来会特别乱；本文讲解了如何管理Git在本地的远程分支追踪；
---

如果远程的分支删除，本地会存在一个追踪的远程已经不存在的一个分支origin/xxx；

如果这种分支太多，本地的分支看起来会特别乱；

本文讲解了如何管理Git在本地的远程分支追踪；

<br/>

<!--more-->

# **管理Git在本地的远程分支追踪**

下面的这个命令：

```bash
git remote prune
```

可以删除本地版本库上那些失效的远程追踪分支，具体用法是：

假如你的远程版本库名是 **origin**，则使用如下命令先查看哪些分支需要清理：

```bash
git remote prune origin --dry-run
```

随后执行：

```bash
git remote prune origin
```

这样，就完成了无效的远程追踪分支的清理工作；

>   **需要注意，这里远程追踪分支是位于 `.git/refs/remote/origin` 下的分支；**
>
>   **如果有本地分支作为下游存在的话，还需要手动清理：**
>
>   ```bash
>   git branch -d xxx
>   ```

<br/>
