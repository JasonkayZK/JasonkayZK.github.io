---
title: Git Stash用法总结
cover: http://api.mtyqx.cn/api/random.php?41
date: 2020-05-03 10:57:45
categories: Git
tags: [Git]
toc: true
description: 本篇讲述了Git Stash命令的基本用法
---

本篇讲述了Git Stash命令的基本用法;

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## Git Stash用法总结

### 应用场景

**场景一**

当正在dev分支上开发某个项目，这时项目中出现一个bug，需要紧急修复，但是正在开发的内容只是完成一半，还不想提交，这时可以用git stash命令将修改的内容保存至堆栈区，然后顺利切换到hotfix分支进行bug修复，修复完成后，再次切回到dev分支，从堆栈中恢复刚刚保存的内容。 

**场景二**

由于疏忽，**本应该在dev分支开发的内容，却在master上进行了开发**，需要重新切回到dev分支上进行开发，可以用git stash将内容保存至堆栈中，切回到dev分支后，再次恢复内容即可。

总的来说，**git stash命令的作用就是将目前还不想提交的但是已经修改的内容进行保存至堆栈中，后续可以在某个分支上恢复出堆栈中的内容。**

这也就是说，stash中的内容**不仅仅可以恢复到原先开发的分支，也可以恢复到其他任意指定的分支上。**

<font color="#f00">**git stash作用的范围包括工作区和暂存区中的内容，也就是说没有提交的内容都会保存至堆栈中。**</font>

<font color="#f00">**但是没有在git 版本控制中的文件，是不能被git stash 存起来的**</font>

<br/>

例:

在master分支有一个已经提交的a.txt, 我们在dev分支下创建了一个b.txt;

```bash
zk@zk:~/workspace/git_test$ git branch -a
* dev
  master
zk@zk:~/workspace/git_test$ git status 
位于分支 dev
未跟踪的文件:
  （使用 "git add <文件>..." 以包含要提交的内容）

	b.txt

提交为空，但是存在尚未跟踪的文件（使用 "git add" 建立跟踪）
```

**注意此时b.txt并未被`git add`命令添加到暂存区!**

所以此时可以随意切换分支, 而在任意分支中b.txt都是未跟踪:

```bash
zk@zk:~/workspace/git_test$ git checkout master 
切换到分支 'master'
zk@zk:~/workspace/git_test$ git status 
位于分支 master
未跟踪的文件:
  （使用 "git add <文件>..." 以包含要提交的内容）

	b.txt

提交为空，但是存在尚未跟踪的文件（使用 "git add" 建立跟踪）
zk@zk:~/workspace/git_test$ git checkout dev 
切换到分支 'dev'
```

而一旦在dev分支将b.txt提交, 并再次修改:

```bash
zk@zk:~/workspace/git_test$ git add b.txt 
zk@zk:~/workspace/git_test$ git commit -m 'add: b.txt'
[dev 2e9b879] add: b.txt
 1 file changed, 1 insertion(+)
 create mode 100644 b.txt
zk@zk:~/workspace/git_test$ vi b.txt 
zk@zk:~/workspace/git_test$ cat b.txt 
b file.
modified at dev branch.
zk@zk:~/workspace/git_test$ git status 
位于分支 dev
尚未暂存以备提交的变更：
  （使用 "git add <文件>..." 更新要提交的内容）
  （使用 "git checkout -- <文件>..." 丢弃工作区的改动）

	修改：     b.txt

修改尚未加入提交（使用 "git add" 和/或 "git commit -a"）
```

此时将无法切换到master分支:

```bash
zk@zk:~/workspace/git_test$ git status 
位于分支 dev
尚未暂存以备提交的变更：
  （使用 "git add <文件>..." 更新要提交的内容）
  （使用 "git checkout -- <文件>..." 丢弃工作区的改动）

	修改：     b.txt

修改尚未加入提交（使用 "git add" 和/或 "git commit -a"）

zk@zk:~/workspace/git_test$ git checkout master 
error: 您对下列文件的本地修改将被检出操作覆盖：
	b.txt
请在切换分支前提交或贮藏您的修改。
终止中
```

即:

<font color="#f00">**首次添加(git add)的新文件并不影响分支切换, 因为所有的分支都没有对该文件进行跟踪; 但是一旦在某个分支提交(产生了跟踪), 则在修改文件时就需要使用stash或者commit**</font>

<br/>

### 命令详解

#### git stash

stash命令能够将所有未提交的修改**（工作区和暂存区）**保存至堆栈中，用于后续恢复当前工作目录;

在上面的例子中我们在dev分支修改了b.txt, 并加入了一行:`modified at dev branch.`;

这导致了我们无法从dev分支切换到master分支, 除非我们进行stash或者commit;

下面我们对dev分支的修改内容进行贮藏:

```bash
zk@zk:~/workspace/git_test$ git status 
位于分支 dev
尚未暂存以备提交的变更：
  （使用 "git add <文件>..." 更新要提交的内容）
  （使用 "git checkout -- <文件>..." 丢弃工作区的改动）

	修改：     b.txt

修改尚未加入提交（使用 "git add" 和/或 "git commit -a"）
zk@zk:~/workspace/git_test$ git stash 
保存工作目录和索引状态 WIP on dev: 2e9b879 add: b.txt
zk@zk:~/workspace/git_test$ git stash 
没有要保存的本地修改
zk@zk:~/workspace/git_test$ cat b.txt 
b file.
```

简单的通过git stash命令, 我们把本次的修改保存在了`dev: 2e9b879`中;

而通过查看b.txt的内容, 可以看出我们在dev分支做出的所有修改被暂时还原, 但是此时我们可以切换到master分支了~

****

#### git stash save

除了简单使用git stash贮藏修改之外可以添加参数: `save "save message"`加一些注释;

首先我们使用`git stash pop`弹出上一个贮藏, 然后使用stash save命令贮藏:

```bash
zk@zk:~/workspace/git_test$ git stash pop 
位于分支 dev
尚未暂存以备提交的变更：
  （使用 "git add <文件>..." 更新要提交的内容）
  （使用 "git checkout -- <文件>..." 丢弃工作区的改动）

	修改：     b.txt

修改尚未加入提交（使用 "git add" 和/或 "git commit -a"）
丢弃了 refs/stash@{0} (20d300aca604986a48e0dd2e15a6fbd0fa8b3919)
zk@zk:~/workspace/git_test$ git stash save "first save"
保存工作目录和索引状态 On dev: first save
```

****

#### git stash list

list可以查看当前stash中的内容

```bash
zk@zk:~/workspace/git_test$ git stash list 
stash@{0}: On dev: first save
```

****

#### git stash pop

将当前stash中的内容弹出，并应用到当前分支对应的工作目录上。 

**注：该命令将堆栈中最近保存的内容删除（栈是先进后出）** 

之前已经创建了一个stash: first save;

我们再次修改b.txt, 并添加`another modification at dev branch.`, 然后再次贮藏:

```bash
zk@zk:~/workspace/git_test$ git stash list 
stash@{0}: On dev: first save
zk@zk:~/workspace/git_test$ vi b.txt 
zk@zk:~/workspace/git_test$ cat b.txt 
b file.
another modification at dev branch.
zk@zk:~/workspace/git_test$ git stash save "another save"
保存工作目录和索引状态 On dev: another save
zk@zk:~/workspace/git_test$ git stash list 
stash@{0}: On dev: another save
stash@{1}: On dev: first save
```

此时使用pop弹出stash时, 总是栈顶的stash被弹出(即`stash@{0}: On dev: another save`):

```bash
zk@zk:~/workspace/git_test$ git stash pop
位于分支 dev
尚未暂存以备提交的变更：
  （使用 "git add <文件>..." 更新要提交的内容）
  （使用 "git checkout -- <文件>..." 丢弃工作区的改动）

	修改：     b.txt

修改尚未加入提交（使用 "git add" 和/或 "git commit -a"）
丢弃了 refs/stash@{0} (1863562fbc3ec23472d77a50ed92a3630f948823)
zk@zk:~/workspace/git_test$ cat b.txt 
b file.
another modification at dev branch.
```

如果从stash中恢复的内容和当前目录中的内容发生了冲突，也就是说，**恢复的内容和当前目录修改了同一行的数据，那么会提示报错，需要解决冲突:**

可以通过直接pop并手动修复冲突或者创建新的分支来解决冲突;

****

#### git stash apply

将堆栈中的内容应用到当前目录，不同于git stash pop，**该命令不会将内容从堆栈中删除**

也就说该命令能够将堆栈的内容多次应用到工作目录中，适应于多个分支的情况。

例如:

在b.txt分支做两次修改和stash:

```bash
zk@zk:~/workspace/git_test$ vi b.txt 
zk@zk:~/workspace/git_test$ cat b.txt 
b file.
first stash.
zk@zk:~/workspace/git_test$ git stash save 'first stash'
保存工作目录和索引状态 On dev: first stash
zk@zk:~/workspace/git_test$ vi b.txt 
zk@zk:~/workspace/git_test$ cat b.txt 
b file.
second stash.
zk@zk:~/workspace/git_test$ git stash save 'second stash'
保存工作目录和索引状态 On dev: second stash
zk@zk:~/workspace/git_test$ git stash list 
stash@{0}: On dev: second stash
stash@{1}: On dev: first stash
```

然后使用apply:

```bash
zk@zk:~/workspace/git_test$ cat b.txt 
b file.
modified at dev branch.
zk@zk:~/workspace/git_test$ git stash apply 
位于分支 dev
尚未暂存以备提交的变更：
  （使用 "git add <文件>..." 更新要提交的内容）
  （使用 "git checkout -- <文件>..." 丢弃工作区的改动）

	修改：     b.txt

修改尚未加入提交（使用 "git add" 和/或 "git commit -a"）
zk@zk:~/workspace/git_test$ cat b.txt 
b file.
second stash.
```

堆栈中的内容并没有删除。 

**默认情况下, apply会将栈顶的stash作用在当前分支; 也可以使用git stash apply + stash名字（如stash@{1}）指定恢复哪个stash到当前的工作目录。**

例:

```bash
# 暂存上次的apply
zk@zk:~/workspace/git_test$ git stash save 'third stash'
保存工作目录和索引状态 On dev: third stash
zk@zk:~/workspace/git_test$ git stash list 
stash@{0}: On dev: third stash
stash@{1}: On dev: second stash
stash@{2}: On dev: first stash
# 暂存后结果
zk@zk:~/workspace/git_test$ cat b.txt 
b file.
modified at dev branch.

# 使用apply并指定stash
zk@zk:~/workspace/git_test$ git stash apply stash@{2} 
位于分支 dev
尚未暂存以备提交的变更：
  （使用 "git add <文件>..." 更新要提交的内容）
  （使用 "git checkout -- <文件>..." 丢弃工作区的改动）

	修改：     b.txt

修改尚未加入提交（使用 "git add" 和/或 "git commit -a"）
zk@zk:~/workspace/git_test$ cat b.txt 
b file.
first stash.
```

****

#### git stash drop + 名称

从堆栈中移除某个指定的stash

例如删除最早的stash:

```bash
zk@zk:~/workspace/git_test$ git stash list 
stash@{0}: On dev: third stash
stash@{1}: On dev: second stash
stash@{2}: On dev: first stash
zk@zk:~/workspace/git_test$ git stash drop stash@{2} 
丢弃了 stash@{2} (d0c0ccda95446b047624dd125abd9097d14f322f)
zk@zk:~/workspace/git_test$ git stash list 
stash@{0}: On dev: third stash
stash@{1}: On dev: second stash
```

****

#### git stash clear

清除堆栈中的所有内容

```bash
zk@zk:~/workspace/git_test$ git stash clear 
zk@zk:~/workspace/git_test$ git stash list 
# 空
```

****

#### git stash show

查看堆栈中**最新保存的stash和当前目录的差异**。

```bash
zk@zk:~/workspace/git_test$ git stash list
stash@{0}: On dev: second stash
stash@{1}: On dev: first stash
zk@zk:~/workspace/git_test$ git stash show 
 b.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

通过 git stash show -p 查看详细的不同：

```bash
zk@zk:~/workspace/git_test$ git stash show -p
diff --git a/b.txt b/b.txt
index 2fbb2e3..11c5108 100644
--- a/b.txt
+++ b/b.txt
@@ -1,2 +1,2 @@
 b file.
-modified at dev branch.
+second stash.
```

通过`git stash show stash@{1}`查看指定的stash和当前目录差异:

```bash
zk@zk:~/workspace/git_test$ git stash show stash@{1} -p
diff --git a/b.txt b/b.txt
index 2fbb2e3..ddfab50 100644
--- a/b.txt
+++ b/b.txt
@@ -1,2 +1,2 @@
 b file.
-modified at dev branch.
+first stash.
```

****

#### git stash branch

从最新的stash创建分支。

应用场景：当储藏了部分工作，暂时不去理会，继续在当前分支进行开发，后续想将stash中的内容恢复到当前工作目录时，如果是针对同一个文件的修改（即便不是同行数据），那么可能会发生冲突，恢复失败，这里通过创建新的分支来解决。

可以用于解决stash中的内容和当前目录的内容发生冲突的情景。

当发生冲突时，需手动解决冲突。

例:

现已经有`first stash`和`second stash`两个贮藏, 现直接在dev分支继续开发, 并提交:

```bash
zk@zk:~/workspace/git_test$ git stash list 
stash@{0}: On dev: second stash
stash@{1}: On dev: first stash
zk@zk:~/workspace/git_test$ vi b.txt 
zk@zk:~/workspace/git_test$ cat b.txt 
b file.
modified after first & second stash.
zk@zk:~/workspace/git_test$ git add b.txt
zk@zk:~/workspace/git_test$ git commit -m 'add: modified after first & second stash.'
[dev 7369f44] add: modified after first & second stash.
 1 file changed, 1 insertion(+), 1 deletion(-)
```

此时弹出stash将会冲突, 可以通过git stash branch来创建新的分支:

```bash
# dev分支的提交
zk@zk:~/workspace/git_test$ cat b.txt 
b file.
modified after first & second stash.

# 创建新的分支
zk@zk:~/workspace/git_test$ git stash branch 'secondstash'
切换到一个新分支 'secondstash'
位于分支 secondstash
尚未暂存以备提交的变更：
  （使用 "git add <文件>..." 更新要提交的内容）
  （使用 "git checkout -- <文件>..." 丢弃工作区的改动）

	修改：     b.txt

修改尚未加入提交（使用 "git add" 和/或 "git commit -a"）
丢弃了 refs/stash@{0} (543ffeaeff2b45042933494653ee54b0f4f9e37b)
zk@zk:~/workspace/git_test$ cat b.txt 
b file.
second stash.
zk@zk:~/workspace/git_test$ git branch -a
  dev
  master
* secondstash
```

可见创建了新的分支, 并且对b.txt的修改并未影响到dev分支的提交!

<br/>

## 附录

文章参考:

-   [git stash详解](https://blog.csdn.net/stone_yw/article/details/80795669)
-   [git stash 用法总结和注意点](https://www.cnblogs.com/zndxall/p/9586088.html)

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>