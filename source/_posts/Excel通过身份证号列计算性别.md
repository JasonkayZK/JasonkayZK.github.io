---
title: Excel通过身份证号列计算性别
toc: true
cover: 'https://img.paulzzh.com/touhou/random?44'
date: 2024-09-11 10:28:56
categories: 办公
tags: [办公, Excel]
description: Excel统计信息中有身份证号，可以通过身份证号直接生成性别列；
---

Excel统计信息中有身份证号，可以通过身份证号直接生成性别列；

<br/>

<!--more-->

# **Excel通过身份证号列计算性别**

例如，B2 列为身份证号所在列，则可以在性别列（如D2列）填写：

```
=IF(MOD(MID(B2, 17, 1), 2) = 1, "男", "女")
```

输入后回车计算结果即为性别；

可以下拉直接生成全部结果！

<br/>

参考：

-   https://jingyan.baidu.com/article/5553fa8291d46b65a2393432.html


<br/>
