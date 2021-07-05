---
title: 在Docker中体验Go1.17中的泛型
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?33'
date: 2021-07-05 15:30:23
categories: Golang
tags: [Golang, Docker]
description: 在Golang的v1.17版本中，已经悄悄的加入了对泛型的支持；在此之前，我们需要在.go2中尝试泛型，现在我们可以直接编写.go格式的文件，然后通过指定-gcflags=-G=3来编译含有泛型语法的源文件了；同时，为了防止在体验时污染我们本地开发环境中的Go，采用了在Docker中运行的方式进行实验；
---

在Golang的v1.17版本中，已经悄悄的加入了对泛型的支持；

在此之前，我们需要在.go2中尝试泛型，现在我们可以直接编写.go格式的文件，然后通过指定`-gcflags=-G=3`来编译含有泛型语法的源文件了；

同时，为了防止在体验时污染我们本地开发环境中的Go，采用了在Docker中运行的方式进行实验；

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/go-v1.17-rc-generic

<br/>

<!--more-->

# **在Docker中体验Go1.17中的泛型**

## **关于Go泛型的开发进度**

根据网络谣传的消息 Go 将在1.18 中正式支持泛型，而依照Go每年发布两个版本的节奏，Go 1.18会在2022年春，也就是二月份左右发布，但是我们目前已经可以在Go 1.17中尝鲜；

>   Go的泛型近一年来一直由Ian Lance Taylor(编译器大牛、Go核心成员)和Robert Griesemer（Go创始三巨头之一，Google V8、Chubby和HotSpot JVM的主要贡献者）等人开发，一直在[dev.typeparams](https://github.com/golang/go/tree/dev.typeparams)分支上做预研和开发工作；
>
>   但是由于泛型会对Go的核心代码做巨大的修改，会影响很多文件，因此将来dev.typeparams在merge回master分支的时候如何管理冲突是一个很困难的事；
>
>   目前，Go开发者采用定期把master的commit merge到dev.typeparams分支方式，尽早解决冲突：因为尽早解决冲突的方式每次解决冲突的量比较少，还是可控的；
>
>   但是由于master分支的开发者无需顾虑dev.typeparams分支的情况，导致最近冲突有些大，解决起来很困难，所以[#43931](https://github.com/golang/go/issues/43931)提议将dev.typeparams分支merge到master分支，以后泛型的开发直接在master分支；

泛型特性可以通过feature flag的方式控制特性的启用和禁用，所以即使merge到master分支，也可以控制在Go 1.18再把特性启用；如果泛型的提案[#43651](https://github.com/golang/go/issues/43651)被拒绝掉的话，相关的无用代码也可以被清除掉；

>   这也类似引入go module的方式：
>
>   `go module`历经几个版本，并通过GO111MODULE开关控制这个特性的启用；

比如引入`-G`开关：

-   `-G=0`启用类型检查；
-   `-G=1`启用 `types2 w/o generics`支持；
-   `-G=2`使用`types2 w/ generics`支持；

而`-G=1`在Go 1.17中默认启用，`-G=2`在Go 1.18中启用；

>   这也是很好的一种渐进式引入特性的方法；

<red>**而现在我们已经可以在Go v1.17中通过指定`-gcflags=-G=3`来编译含有泛型语法的源文件了！**</font>

<br/>

## **Go中的泛型**

2019年中旬，在[Go 1.13版本](https://tonybai.com/2019/10/27/some-changes-in-go-1-13/)发布前夕的[GopherCon 2019大会](https://www.gophercon.com/)上，[Ian Lance Taylor](https://github.com/ianlancetaylor)代表Go核心团队做了[有关Go泛型进展的介绍](https://blog.golang.org/why-generics)；

自那以后，Go团队对原先的[Go Generics技术草案](https://github.com/golang/proposal/blob/master/design/go2draft-contracts.md)做了进一步精化，并编写了相关工具让社区gopher体验满足这份设计的Go generics语法，返回建议和意见；

经过一年多的思考、讨论、反馈与实践，Go核心团队决定在这份旧设计的基础上**另起炉灶**，撰写了一份[Go Generics的新技术提案：“Type Parameters”](https://github.com/golang/proposal/blob/master/design/go2draft-type-parameters.md)；

与上一份提案最大的不同在于：<red>**使用扩展的interface类型替代“Contract”用于对类型参数的约束；**</font>

<red>**Parametric Polymorphism((形式)参数多态)是Go此版泛型设计的基本思想：**</font>

<red>**和Go设计思想一致，这种参数多态并不是通过像面向对象语言那种子类型的层次体系实现的，而是通过显式定义结构化的约束实现的；基于这种设计思想，该设计不支持[模板元编程(template metaprogramming)](https://code.fandom.com/wiki/Template_metaprogramming])和编译期运算；**</font>

>   <red>**注意：虽然都称为泛型(generics)，但是Go中的泛型(generics)仅是用于狭义地表达带有类型参数(type parameter)的函数或类型，这与其他编程语言中的泛型(generics)在含义上有相似性，但不完全相同；**</font>

<red>**本文主要采用的是`go1.17beta1`版本进行讲述，而最终加入Go的泛型可能与目前的实现有所差异；**</font>

下面，首先让我们创建一个`go1.17beta1`环境的容器；

随后，通过几个泛型的例子来学习Go中的泛型！

<br/>

## **Docker中创建Go环境容器**

为了不影响本地的Go环境，我选择了在Docker中创建一个`go1.17beta1`环境的容器来体验泛型；

>   **`go1.17beta1`是目前官方提供的最新的Go环境；**
>
>   **可能你在阅读本文的时候，还有更新的版本可以选择，但是原理都是类似的！**

一键创建Go环境容器：

create-container.sh

```bash
docker run -dit \
--name go-v.17 \
-v /root/workspace/go-v1.17-code:/code \
--privileged \
golang:1.17-rc /bin/bash
```

然后你的`go1.17beta1`环境就有了；

通过下面的命令即可进入容器：

create-container.sh

```bash
[root@localhost go-v1.17-code]# docker exec -it go-v.17 bash
root@e9d447a87912:/go# go version
go version go1.17beta1 linux/amd64
```

>   <red>**注：这里主要是将本地的`/root/workspace/go-v1.17-code`作为工作目录，并映射到容器的`/code`目录中，你可以根据自己的需求修改路径；**</font>

下面我们重点来看Go中的泛型；

<br/>

## **几个泛型例子**

#### **Print泛型输出**



















<br/>

## **附录**

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/go-v1.17-rc-generic

文章参考：

-   [Go 言語にやってくる Generics は我々に何をもたらすのか](https://zenn.dev/mattn/books/4c7de85ec42cb44cf285)
-   https://github.com/mattn/go-generics-example
-   [利好！极大可能在go 1.17中就能尝试泛型](https://colobu.com/2021/02/20/merge-dev-typeparams-to-master-during-Go-1-17/)
-   [Go泛型新方案详解！Go泛型真的要来了，最早在Go 1.17版本支持](https://www.imooc.com/article/305914)

<br/>