---
title: Raft算法零-基本流程
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?34'
date: 2022-11-24 11:28:17
categories: Raft
tags: [Raft, 分布式]
description: 最近在学习Raft算法，涉及到的内容比较多，因此打算开一个新的坑，从头到尾的好好讲讲Raft算法。包括论文理解、MIT算法实现、实际应用等等。可能时间会比较长，也希望自己能坚持下来！本篇作为Raft算法的开篇，不会讲那些很深奥并且琐碎的论文和实现细节，主要是提供一些资料，以及大概讲一讲Raft的基本流程内容；
---

最近在学习Raft算法，涉及到的内容比较多，因此打算开一个新的坑，从头到尾的好好讲讲Raft算法：

包括论文理解、MIT算法实现、实际应用等等。可能时间会比较长，也希望自己能坚持下来！

本篇作为Raft算法的开篇，不会讲那些很深奥并且琐碎的论文和实现细节，主要是提供一些资料，以及大概讲一讲Raft的基本流程内容；

<br/>

<!--more-->

# **Raft算法零-基本流程**

## **Raft基本概念**

Raft 是英文"Reliable、Replicated、Redundant、And Fault-Tolerant"（“可靠、可复制、可冗余、可容错”）的首字母缩写；

它起源于 2013 年 斯坦福大学 Diego Ongaro 和 John Ousterhout 的博士论文[《In Search of an Understandable Consensus Algorithm》](https://raft.github.io/raft.pdf)；

是一种用于替代 Paxos 的共识算法，相比于 Paxos，Raft 的目标是更容易理解，同时安全性更高，并能提供一些额外的特性；







<br/>

### **Raft中的角色状态**

在 Raft 中包括 Leader(领导者)、Candidate(候选人)、Follower(跟随者) 三种角色状态，关于它们的说明如下：

| **角色状态**  | **说明**                                                     |
| :------------ | :----------------------------------------------------------- |
| **Leader**    | **负责处理所有外部的请求，如果不是 Leader 机器收到请求时，请求会被转到 Leader 机器；**<br />**负责向 Follower同步心跳信息；**<br />**负责向其他节点同步日志复制 AppendEntries RPC 信息；**<br />**同一任期，最多只能有一个 Leader；** |
| **Candidate** | **主动发起选举投票；**<br />**重置选举超时时间；**<br />**获取大多数 Follower的投票后成为 Leader；** |
| **Follower**  | **响应 Leader的 AppendEntries RPC(空消息)心跳请求；**<br />**响应 Candidate的 RequestVote RPC 投票请求；**<br />**响应 Leader的 AppendEntries RPC 日志复制请求；**<br />**切换成 Candidate角色，为自己发起选举投票；** |





















<br/>

# **附录**

Raft 官方网站：

-   https://raft.github.io/

在线展示：

-   http://thesecretlivesofdata.com/raft/#home
-   https://raft.github.io/

论文：

-   https://raft.github.io/raft.pdf

论文翻译：

-   https://github.com/maemual/raft-zh_cn/blob/master/raft-zh_cn.md
-   https://github.com/brandonwang001/raft_translation/blob/master/raft_translation/raft_translation.pdf
-   https://xiaochai.github.io/2018/09/26/raft/
-   https://arthurchiao.art/blog/raft-paper-zh/

<br/>
