---
title: 使用Maven插件在Docker中部署你的Tomcat项目
toc: true
date: 2020-01-10 11:24:27
cover: https://img.paulzzh.com/touhou/random?17
categories: Docker
tags: [Docker, 项目部署, Tomcat, Maven]
description: 原来一直都是使用本地的Tomcat部署项目, 虽然简单, 但是项目一多其实文件不好管理, 并且集群化了之后也不方便管理, 所以本篇讲述了通过Maven的Docker部署插件完成项目在Tomcat镜像中的部署
---

原来一直都是使用本地的Tomcat部署项目, 虽然简单, 但是项目一多其实文件不好管理, 并且集群化了之后也不方便管理, 所以本篇讲述了通过Maven的Docker部署插件完成项目在Tomcat镜像中的部署

<br/>

<!--more-->

