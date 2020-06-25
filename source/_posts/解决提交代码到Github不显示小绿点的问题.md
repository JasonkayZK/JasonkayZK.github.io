---
title: 解决提交代码到Github不显示小绿点的问题
cover: 'http://api.mtyqx.cn/api/random.php?32'
date: 2020-06-25 16:04:21
categories: 程序人生
tags: [Github, 程序人生]
description: 最近在公司提交代码到Github的时候，发现提交了代码之后，在主页没有显示对应绿色的contributions；最后发现是git的邮箱配置问题；
---

最近在公司提交代码到Github的时候，发现提交了代码之后，在主页没有显示对应绿色的contributions；

最后发现是git的邮箱配置问题（并不是我偷懒没有写代码~）；

<br/>

<!--more-->

<br/>

## 解决提交代码到Github不显示小绿点的问题

在提交代码时，Github会<font color="#f00">**使用你当前仓库中配置的git的邮箱作为提交邮箱(而非你SSH中配置的邮箱地址)**</font>；

只有提交的邮箱地址和你Github账号的邮箱地址一致时才会显示绿色的contributions；

所以可以修改在对应的仓库下的邮箱地址配置；

相关的命令如下：

```bash
# 使用log命令查看作者的邮箱地址
git log

# 使用以下命令对邮箱进行配置
# 如果只想修改这一个仓库的邮箱：
git config user.email "your_email@example.com"
# 可以使用如下命令确认修改是否成功：
git config user.email

# 如果想对所有的仓库生效，避免在别的仓库继续出现这个情况，则输入：
git config --global user.email "your_email@example.com"

# 同样可以查看确认一下：
git config --global user.email
```

<br/>