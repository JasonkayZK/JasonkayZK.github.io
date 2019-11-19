---
title: Git分支相关总结
toc: true
date: 2019-10-22 14:19:04
categories: Git
tags: [Git, 版本控制]
cover: https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1571735512974&di=d4e0fc7ba73f5352d01b2547bd0df89c&imgtype=0&src=http%3A%2F%2Fimages.cnblogs.com%2Fcnblogs_com%2Froverliang%2F915085%2Fo_flow.png
description: 之前在写一些demo例子的时候, 每个不同的案例都是在同一个工程的不同目录下. 但是由于有些案例其实是不需要相关依赖的, 但是由于添加到了同一个工程中, 会导致依赖不清晰的问题. 解决方法就是, 以master为基本创建不同的分支, 每个分支为不同的案例, 各个分支不需要合并即可!
---

之前在写一些demo例子的时候, 每个不同的案例都是在同一个工程的不同目录下. 但是由于有些案例其实是不需要相关依赖的, 但是由于添加到了同一个工程中, 会导致依赖不清晰的问题. 解决方法就是, 以master为基本创建不同的分支, 每个分支为不同的案例, 各个分支不需要合并即可!

阅读本文你将学会:

-   什么是Git中的分支? 分支的使用场景?
-   如何创建、查看、切换、删除本地分支?
-   如何合并分支?
-   Git版本回退操作
-   Git克隆远程仓库的指定分支
-   如何将本地分支推送到远程?
-   ......



<br/>

<!--more-->

## Git分支相关总结

之前在写一些项目案例的时候, 都是创建一个大工程, 然后创建多个目录分别存放, 各个案例. 但是对于各个案例来说, 由于在同一个工程, 所以依赖也都放在了一起, 时间长就造成了依赖混乱等问题.

之后, 采用Git分支解决了这个问题: 

-   <font color="#0000ff">首先创建了一个仓库, 处于master分支;</font>
-   <font color="#0000ff">然后在master的基础上分别创建不同的分支, feature, feature2, feature3...</font>
-   <font color="#0000ff">在不同的分支上创建不同的工程即可!</font>

所以本文主要总结了与Git分支相关的一些知识.



<br/>

### 一. Git中分支的使用场景

分支在实际中有什么作用呢？假设你准备开发一个新功能，但是需要两周才能完成，第一周写了50%的代码，如果立刻提交，由于代码还没写完，不完整的代码库会导致别人不能干活了，如果等代码全部写完再一次性提交，又存在丢失每天进度的巨大风险。

现在有了分支，就不用怕了，你创建了一个属于你自己的分支，别人看不到，还继续在原来的分支上正常工作，而你在自己的分支上干活，想提交就提交，直到开发完毕后，再一次性合并到原来的分支上，这样，既安全，又不影响别人工作。

<br/>

分支的主要作用有:

-   版本迭代更加清晰
-   开发效率提升
-   利于代码review的实现，从而使整个团队开发更加规范，减少bug率



<br/>

<br/>

### 二. 分支的常规操作

#### 1. 查看分支

```bash
git branch -a

* save
  remotes/origin/HEAD -> origin/save
  remotes/origin/master
  remotes/origin/save
```

<br/>



#### 2. 创建、切换分支

创建并切换分支：`git checkout -b <分支名称>`

>   这条命令和下面两条命令效果相同:
>
>   创建分支：git branch <分支名称> 
>
>   切换分支：git checkout <分支名称>

```bash
zk@jasonkay:~/test$ git branch test

zk@jasonkay:~/test$ git checkout test
切换到分支 'test'

zk@jasonkay:~/test$ git branch -a
  master
* test
```

<br/>



#### 3. 合并分支

`git checkout master` 先切换到master分支

`git merge test` 再将B分支的代码合并到master<font color="#0000ff">(在merge合并分支的时候，代码会有冲突，需要自己去解决这些冲突)</font>

>   语法: (切换到主分支) -> git merge <想要合并的分支名>

<br/>



#### 3.1 合并冲突分支

<font color="#0000ff">有时候合并操作并不会如此顺利, 如果在不同的分支中都修改了同一个文件的同一部分，Git 就无法干净地把两者合到一起（译注：逻辑上说，这种问题只能由人来裁决）</font>

如:

```bash
$ git merge iss53
Auto-merging index.html
CONFLICT (content): Merge conflict in index.html
Automatic merge failed; fix conflicts and then commit the result.
```

<br/>

Git 作了合并，但没有提交，它会停下来等你解决冲突。要看看哪些文件在合并时发生冲突，可以用 `git status` 查阅：

```bash
$ git status
On branch master
You have unmerged paths.
  (fix conflicts and run "git commit")

Unmerged paths:
  (use "git add <file>..." to mark resolution)

        both modified:      index.html

no changes added to commit (use "git add" and/or "git commit -a")
```

<font color="#0000ff">任何包含未解决冲突的文件都会以未合并（unmerged）的状态列出, Git 会在有冲突的文件里加入标准的冲突解决标记，可以通过它们来手工定位并解决这些冲突!</font>

可以看到此文件包含类似下面这样的部分：

```html
<<<<<<< HEAD
<div id="footer">contact : email.support@github.com</div>
=======
<div id="footer">
  please contact us at support@github.com
</div>
>>>>>>> iss53
```

可以看到 `=======` 隔开的上半部分，是 `HEAD`（即 `master` 分支，在运行 `merge` 命令时所切换到的分支）中的内容，下半部分是在 `iss53` 分支中的内容.

<font color="#ff0000">解决冲突的办法无非是二者选其一或者由你亲自整合到一起</font>

<br/>

比如你可以通过把这段内容替换为下面这样来解决：

```html
<div id="footer">
please contact us at email.support@github.com
</div>
```

这个解决方案各采纳了两个分支中的一部分内容，而且我还删除了 `<<<<<<<`，`=======` 和 `>>>>>>>` 这些行.

在解决了所有文件里的所有冲突后，运行 `git add` 将把它们标记为已解决状态（译注：实际上就是来一次快照保存到暂存区域）

<font color="#ff0000">因为一旦暂存，就表示冲突已经解决!</font>

<br/>

如果你想用一个有图形界面的工具来解决这些问题，不妨运行 `git mergetool`，它会调用一个可视化的合并工具并引导你解决所有冲突：

```bash
$ git mergetool

This message is displayed because 'merge.tool' is not configured.
See 'git mergetool --tool-help' or 'git help config' for more details.
'git mergetool' will now attempt to use one of the following tools:
opendiff kdiff3 tkdiff xxdiff meld tortoisemerge gvimdiff diffuse diffmerge ecmerge p4merge araxis bc3 codecompare vimdiff emerge
Merging:
index.html

Normal merge conflict for 'index.html':
  {local}: modified file
  {remote}: modified file
Hit return to start merge resolution tool (opendiff):
```

如果不想用默认的合并工具（Git 为我默认选择了 `opendiff`，因为我在 Mac 上运行了该命令），你可以在上方"merge tool candidates"里找到可用的合并工具列表，输入你想用的工具名

退出合并工具以后，Git 会询问你合并是否成功。如果回答是，它会为你把相关文件暂存起来，以表明状态为已解决。

再运行一次 `git status` 来确认所有冲突都已解决：

```bash
$ git status
On branch master
Changes to be committed:
  (use "git reset HEAD <file>..." to unstage)

        modified:   index.html
```

<br/>

<font color="#ff0000">如果觉得满意了，并且确认所有冲突都已解决，也就是进入了暂存区，就可以用 `git commit` 来完成这次合并提交</font>

提交的记录差不多是这样：

```bash
Merge branch 'iss53'

Conflicts:
  index.html
#
# It looks like you may be committing a merge.
# If this is not correct, please remove the file
#       .git/MERGE_HEAD
# and try again.
#
```



<br/>

#### 4. 删除分支

当分支已经合并到主分支，并且不再需要接着该分支继续开发(后期也可以从主分支分出来),可以删除该分支

删除不是当前分支: git branch -d <分支名称>

强行删除当前打开分支: git branch -D <分支名称>

```bash
zk@jasonkay:~/test$ git branch -d test
已删除分支 test（曾为 b8eb76a）
```

<br/>



#### 5. 误删分支恢复

<font color="#0000ff">Git会自行负责分支的管理，所以当我们删除一个分支时，Git只是删除了指向相关提交的指针，但该提交对象依然会留在版本库中</font>

<font color="#ff0000">如果我们知道删除分支时的散列值，就可以将某个删除的分支恢复过来.</font>

在已知提交的散列值的情况下恢复某个分支: `git branch <branch_name> <hash_val>`

```bash
zk@jasonkay:~/test$ git branch test b8eb

zk@jasonkay:~/test$ git branch -a
* master
  test
```

>   **注:** <font color="#ff0000">命令创建提交号历史版本的一个分支，分支名称随意</font>



<br/>

<font color="#ff0000">不知道想要恢复的分支的散列值，可以用reflog命令或者log命令将它找出来</font>

如:

```bash
zk@jasonkay:~/test$ git reflog
b8eb76a (HEAD -> master, test) HEAD@{0}: merge test: Fast-forward
8fc21ae HEAD@{1}: checkout: moving from test to master
b8eb76a (HEAD -> master, test) HEAD@{2}: commit: commit: test
8fc21ae HEAD@{3}: checkout: moving from master to test
8fc21ae HEAD@{4}: checkout: moving from test to master
8fc21ae HEAD@{5}: checkout: moving from master to test
8fc21ae HEAD@{6}: commit (initial): commit: test_master.txt
```

>   **reflog命令**：<font color="#ff0000">显示整个本地仓储的commit，包括所有branch的commit，甚至包括已经撤销的commit. 只要HEAD发生了变化， 就会在reflog里面看得到!</font>

<br/>



或者使用log命令:

```bash
zk@jasonkay:~/test$ git log
commit b8eb76a547ea6e43a5d25bdb3bb603debd861e18 (HEAD -> master)
Author: zk <271226192@qq.com>
Date:   Tue Oct 22 19:35:03 2019 +0800

    commit: test

commit 8fc21ae52d87b63a53b43f4ebcf676550fb5d2ae
Author: zk <271226192@qq.com>
Date:   Tue Oct 22 17:31:37 2019 +0800

    commit: test_master.txt

```

>   **log命令:** <font color="#ff0000">查看历史提交日志</font>



<br/>

#### 6. 查看分支图

`git log --graph`

为了使分支图更加简明，可以加上一些参数: `git log --graph --pretty=oneline --abbrev-commit`

例如:

```bash
zk@jasonkay:~/test$ git log --graph

* commit b8eb76a547ea6e43a5d25bdb3bb603debd861e18 (HEAD -> master)
| Author: zk <271226192@qq.com>
| Date:   Tue Oct 22 19:35:03 2019 +0800
| 
|     commit: test
| 
* commit 8fc21ae52d87b63a53b43f4ebcf676550fb5d2ae
  Author: zk <271226192@qq.com>
  Date:   Tue Oct 22 17:31:37 2019 +0800
  
      commit: test_master.txt

```



<br/>

#### 7. 重命名分支

`git branch –m <当前分支名> <新的分支名>`

```bash
zk@jasonkay:~/test$ git branch -a
  master
* test

zk@jasonkay:~/test$ git branch -m test test2

zk@jasonkay:~/test$ git branch -a
  master
* test2
```



<br/>

#### 8. 总结

git与分支相关的说明总结如下表:

| 说明                     | 命令                                                   | 备注                                                         |
| ------------------------ | ------------------------------------------------------ | ------------------------------------------------------------ |
| **查看分支(本地+远程)**  | git branch -a                                          |                                                              |
| **创建分支**             | git branch <分支名称>                                  |                                                              |
| **切换分支**             | git checkout <分支名称>                                | 也支持 git switch <分支名称>                                 |
| **合并分支**             | git merge <被当前分支合并的分支名>                     | 需要切换其他分支完成合并                                     |
| **创建+切换分支**        | git checkout -b <分支名称>                             | 或者使用 git switch -c <分支名称>                            |
| **删除分支**             | git branch -d <分支名称><br />git branch -D <分支名称> | 删除不是当前分支使用-d <br />强行删除当前打开分支-D          |
| **分支恢复**             | git branch <分支名称> <删除分支时散列值>               |                                                              |
| **显示本地仓储的commit** | git reflog                                             | 包括所有branch的commit，甚至包括已经撤销的commit. 只要HEAD发生了变化， 就会在reflog里面看得到 |
| **显示历史/分支图**      | git log [--graph] [--pretty=oneline] [--abbrev-commit] | 可添加git log的参数做显示优化                                |
| **重命名分支**           | git branch –m <当前分支名> <新的分支名>                |                                                              |



<br/>

<br/>

### 三. Git分支与远程仓库

#### 1. git克隆远程仓库的指定分支

普通克隆方式:

```bash
git clone <远程仓库地址>
```

这种克隆方式默认是克隆master主分支, 而且通过命令 git branch --list 能看到克隆后在本地也只有这一个分支, 如果再通过新建分支再拉取指定分支，甚至可能还需要解决冲突，太繁琐. 

有效的直接克隆远程指定分支, 只需要一条命令:

```bash
git clone -b <指定分支名> <远程仓库地址>
```

会自动在克隆该分支在本地，同样克隆后本地只有这一个分支!



<br/>

#### 2. 本地分支推送远程仓库

对于本地创建的分支, 该如何推送到远程仓库呢?

下面看一个例子:

首先, 创建一个test分支并切换至:

```bash
$ git checkout -b test
```

然后进行一些添加并提交:

```bash
$ vi test.txt

# 添加以下内容
This file is in test branch!

$ git add test.txt
$ git commit -m 'save branch commit'
...
```

<font color="#ff0000">此时, 新增了一个分支, 并作出了内容的修改, 而远程是没有这个分支的! 所以在新的分支下直接提交将会报错!</font>

错误内容类似下面:

```bash
$ git push
fatal: The current branch test has no upstream branch.
To push the current branch and set the remote as upstream, use
    git push --set-upstream origin test
```

当直接直接`git push`的时候，就会报错提示没有设置上游的远程仓库，只要按照提示执行即可:

```bash
$ git push --set-upstream origin test
Total 0 (delta 0), reused 0 (delta 0)
 * [new branch]      test -> test
Branch 'test' set up to track remote branch 'test' from 'origin'.
```

<br/>

<font color="#0000ff">此时Github上会有对应的PR请求, 接受即可!</font>



<br/>

<br/>

### 附录

文章参考:

-   [Git官方文档-Git分支](https://git-scm.com/book/zh/v1/Git-%E5%88%86%E6%94%AF-%E5%88%86%E6%94%AF%E7%9A%84%E6%96%B0%E5%BB%BA%E4%B8%8E%E5%90%88%E5%B9%B6)
-   [创建与合并分支](https://www.liaoxuefeng.com/wiki/896043488029600/900003767775424)
-   [git删除本地分支和删除远程分支](https://www.cnblogs.com/liyong888/p/9822410.html)
-   [git克隆远程仓库的指定分支](https://blog.csdn.net/u010059669/article/details/82670140)
-   [git分支（存在意义和使用方法）解析](https://www.2cto.com/kf/201809/779140.html)
-   [git分支基本操作](https://www.jianshu.com/p/e8f7018cb554)
-   [Git删除分支/恢复分支](https://www.cnblogs.com/utank/p/7880441.html)
-   [git 本地创建新的分支，并推送远程仓库](https://cloud.tencent.com/developer/article/1439317)



