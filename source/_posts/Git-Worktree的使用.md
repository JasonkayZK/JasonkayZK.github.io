---
title: Git Worktree的使用
cover: https://img.paulzzh.com/touhou/random?67
date: 2020-05-03 17:06:56
categories: Git
tags: [Git]
toc: true
description: 本篇讲述了Git Worktree命令的基本用法
---


本篇讲述了Git Worktree命令的基本用法

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## Git Worktree的使用

### 使用场景

假设这样一个场景，你做完了一个功能，正在跑漫长的测试。

闲着也是闲着，修复下 bug 吧。

但是测试跑着，你不能随便动工作区的代码。

这时候应该怎么办？

**在git worktree出现之前, git切换分支前后的文件都只存在在当前文件夹下;** 

**git worktree出现之后, 我们可以将分支切换到其他文件夹下;**

答：使用 *git worktree* 命令

>   <br/>
>
>   比如你的项目有很多个版本分支, 在**git worktree**出现之前, 为了维护不同版本你就需要频繁切换版本, 如果项目还不小的话, 切换成本还是不小的;
>
>   以前端为例, 由于**node_modules**文件夹被忽略无法被跟着分支来回切换, 导致切换不同版本后还需要重新安装npm, 很麻烦
>
>   这时使用**git worktree**将分支检出到另外其他文件夹就可以避免这个问题.
>
>   将分支用**git worktree**检出到其他文件夹的好处很明显:
>
>   **可以同时维护多个分支代码、可以对比不同分支的代码行为等等**

下面是实例说明:

<br/>

### 应用实例

首先创建一个本地文件夹 git_test, 并在git_test文件夹内创建 main 文件夹, 然后在 main 内 `git init`;

```bash
mkdir git_test && cd git_test/ && mkdir main && cd main/ && git init
```

在 main 内创建一个 foo.txt 文件, 写点东西然后 add commit;

```bash
zk@zk:~/workspace/git_test/main$ vi foo.txt
zk@zk:~/workspace/git_test/main$ cat foo.txt 
Created in master branch.
zk@zk:~/workspace/git_test/main$ git add foo.txt 
zk@zk:~/workspace/git_test/main$ git commit -m 'add: foo.txt'
[master （根提交） c1785d7] add: foo.txt
 1 file changed, 1 insertion(+)
 create mode 100644 foo.txt
```

在dev分支下修改 foo.txt 然后 add commit:

```bash
zk@zk:~/workspace/git_test/main$ git checkout -b dev
切换到一个新分支 'dev'
zk@zk:~/workspace/git_test/main$ vi foo.txt 
zk@zk:~/workspace/git_test/main$ cat foo.txt 
Modified in dev branch.
zk@zk:~/workspace/git_test/main$ git add foo.txt 
zk@zk:~/workspace/git_test/main$ git commit -m 'modify: foo.txt'
[dev 050f6d8] modify: foo.txt
 1 file changed, 1 insertion(+), 1 deletion(-)
```

使用`git worktree add -f ../dev dev`, 将分支导出到某新文件夹下, 此处为dev文件夹

```bash
zk@zk:~/workspace/git_test/main$ git branch -a
* dev
  master
zk@zk:~/workspace/git_test/main$ git worktree add -f ../dev dev
准备 ../dev（标识符 dev）
HEAD 现在位于 050f6d8 modify: foo.txt
zk@zk:~/workspace/git_test/main$ cd ..
zk@zk:~/workspace/git_test$ ll
总用量 16
drwxr-xr-x  4 zk zk 4096 5月   3 19:22 ./
drwxr-xr-x 16 zk zk 4096 5月   3 19:07 ../
drwxr-xr-x  2 zk zk 4096 5月   3 19:22 dev/
drwxr-xr-x  3 zk zk 4096 5月   3 19:17 main/

# dev文件夹存放被检出的dev分支
zk@zk:~/workspace/git_test$ cat dev/foo.txt 
Modified in dev branch.
# master分支可以随意切换
zk@zk:~/workspace/git_test$ cd main/
zk@zk:~/workspace/git_test/main$ git checkout master 
切换到分支 'master'
zk@zk:~/workspace/git_test/main$ cat foo.txt 
Created in master branch.
```

此时在git_test目录下就可以看到并存的master和dev分支下的文件, 分别对应main和dev文件夹

><br/>
>
>**相比于需要从远程Git仓库pull下来两个远程分支, 使用worktree要稍微方便一点**

<br/>

### 常用命令说明

#### git worktree add path [branch]

增加一个新的 worktree，并指定了其关联的目录是 `path` ，关联的分支是 `branch` 

后者是一个可选项，默认值是 `HEAD` 分支。

**如果当前branch已经被关联到了一个 worktree，则这次 add 会被拒绝执行，可以通过增加 `-f | --force` 选项来强制执行**

同时，可以使用 `-b ` 基于新建分支并使这个新分支关联到这个新的 worktree 。如果已经存在，则这次 add 会被拒绝，可以使用 -B代替这里的 -b 来强制执行;

#### git worktree list

列出当前仓库已经存在的所有 `worktree` 的详细情况，包括每个 `worktree` 的关联目录，当前的提交点的哈希码和当前 checkout 到的关联分支。

若没有关联分支，则是 `detached HEAD` 

可以增加 `--porcelain` 选项，用来改变显示风格

即：使用 label 对应 value 的形式显示上面提到的内容。

><br/>
>
>**全部关于worktree的命令**
>
>git worktree全部命令如下:
>
>```bash
># 添加worktree
>git worktree add [-f] [--checkout -b <new-branch>] <path> <commit-ish>
># 列出所有worktree
>git worktree list [--porcelain]
># worktree上锁
>git worktree lock [--reason <string> <worktree>]
># worktree解锁
>git worktree unlock <worktree>
># 移动worktree到其他目录
>git worktree move <worktree> <new-path>
># 清除那些检出目录已经被删除的worktree
>git worktree prune -n --expire <expire>
># 删除worktree, 同时删除检出目录
>git worktree remove -f <worktree>
>```

<br/>

## 附录

文章参考:

-   [git worktree 是什么及其使用场景](https://www.cnblogs.com/skura23/p/8654248.html)
-   [Git进阶:你不知道的git stash 和 git worktree](https://cloud.tencent.com/developer/article/1517189)
-   [Git worktree 的使用](https://www.jianshu.com/p/9d411fed8f7f)

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>