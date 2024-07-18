---
title: Debian系统设置合上笔记本盖子不休眠
toc: true
cover: 'https://img.paulzzh.com/touhou/random?29'
date: 2024-07-18 04:40:58
categories: 技术杂谈
tags: [技术杂谈]
description: 最近将我的一个老旧笔记本重做了一个Debian系统来当服务器使用，这里大概总结一下如何设置Debian系统合上笔记本盖子不休眠；
---

最近将我的一个老旧笔记本重做了一个Debian系统来当服务器使用；

这里大概总结一下如何设置Debian系统合上笔记本盖子不休眠；

<br/>

<!--more-->

# **Debian系统设置合上笔记本盖子不休眠**

修改：

/etc/systemd/logind.conf

```conf
HandleLidSwitch=ignore
LidSwitchIgnoreInhibited=yes
```

总结：

```
HandlePowerKey按下电源键后的行为，默认power off

HandleSleepKey 按下挂起键后的行为，默认suspend

HandleHibernateKey按下休眠键后的行为，默认hibernate

HandleLidSwitch合上笔记本盖后的行为，默认suspend（改为ignore；即合盖不休眠）在原文件中，还要去掉当前行和LidSwitchIgnoreInhibited=yes这行前面的 #

HandleLidSwitchExternalPower 外接电源供电时合上笔记本盖后的行为，默认suspend（改为ignore；即合盖不休眠）
```

<br/>

# **附录**

参考文章：

-   https://linux.cn/article-15015-1.html
-   https://forums.debiancn.org/t/topic/3837/8
-   https://www.cnblogs.com/sharkwave/p/13201196.html


<br/>
