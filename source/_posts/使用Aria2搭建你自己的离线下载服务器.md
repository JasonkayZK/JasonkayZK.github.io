---
title: 使用Aria2搭建你自己的离线下载服务器
cover: https://img.paulzzh.tech/touhou/random?62
date: 2020-05-02 16:14:20
categories: 服务自建
toc: true
tags: [服务自建, Aria2]
description: 上一篇我们讲述了如何安装和配置Aria2, 并使用Aria2下载; 这一篇我们在此基础之上讲解如何使用Aria2搭建离线下载服务器;
---

上一篇我们讲述了如何安装和配置Aria2, 并使用Aria2下载; 这一篇我们在此基础之上讲解如何使用Aria2搭建离线下载服务器;

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## 使用Aria2搭建你自己的离线下载服务器

有时我们可能不想浪费本地的带宽去下载, 或者现在使用的是手机, 不想浪费流量; 并且这些资源可以预先被下载, 稍后有需要的时候再去取, 这时可以用到离线下载;

在上一篇关于Aria2的文章:

[Aria2安装与配置](https://jasonkayzk.github.io/2020/05/01/Aria2安装与配置/)

讲解了Aria2的下载, 配置以及一般的使用方法;

而Aria2可以使用JSON-RPC(一个无状态且轻量级的远程过程调用（RPC）传送协议，其传递内容透过 [JSON](https://baike.baidu.com/item/JSON) 为主)来接收一个RPC调用;

这样我们可以通过向部署在服务器端的Aria2发送RPC调用来在服务器上实现离线下载;

### 前期准备

首先要在远端服务器下载并启动Aria2, 这个前文已经讲过了;

需要注意的是Aria2的配置:

| **配置名称**                                                 | **配置参考值**                                               | **备注**                                                     |
| :----------------------------------------------------------- | :----------------------------------------------------------- | :----------------------------------------------------------- |
| **bt-tracker**                                               | 可在Github中查看最新的:<br />https://github.com/ngosang/trackerslist | 这个一定要配置<br />离线下载的速度在一定程度上也取决于tracker的活跃程度; |
| **dir**                                                      | /data                                                        | 默认的下载文件夹;<br />推荐配置, 便于管理                    |
| **continue**                                                 | true                                                         |                                                              |
| **max-connection-per-server**                                | 15                                                           | 同一服务器连接数<br />不建议很大                             |
| **split**                                                    | 16                                                           | 单个任务最大线程数<br />可根据服务器性能修改                 |
| **max-overall-upload-limit**                                 | 20kb                                                         | 整体上传速度限制                                             |
| **max-upload-limit**                                         | 5kb                                                          | 单个任务上传速度限制                                         |
| **enable-rpc<br />rpc-allow-origin-all<br />rpc-listen-all** | true                                                         | 为了能够进行Web端管理, 需要开启RPC                           |
| **rpc-listen-port**                                          | 6800                                                         | 默认6800, 可根据需要修改<br />在Web配置时需要用到            |
| **rpc-secret**                                               | xxxxxx                                                       | RPC连接令牌<br />早期版本使用username和passwd<br />新版本建议使用rpc-secret配置 |
| **enable-dht**                                               | true                                                         | 打开DHT功能<br />优化BT下载                                  |
| **seed-ratio**                                               | 1.0                                                          | 当种子的分享率达到这个数时, 自动停止做种<br />0为一直做种, 默认:1.0<br />不建议开很高<br />因为当下载完毕时未达到seed-ratio时下载并不停止; |

需要特别注意的是:

-   **rpc-secret**: 用于登录的令牌一定要配置, 否则可能被他人恶意下载;

在配置rpc-secret之后, JSON-RPC Path为:

`http://token:rpc-secret@hostname:rpc-listen-port/jsonrpc`

例如:

`http://token:123456@127.0.0.1:6800/jsonrpc`

-   **seed-ratio**  

默认情况下为1.0;

在下载完毕之后, Aria2并不会停止下载, 而是继续上传一次资源完整的资源供他人下载, 然后再退出并保存DHT;

**如果设置为0时则永远不会退出下载, 而是继续为别人服务!**

<br/>

### 远程管理

服务器端使用:

```bash
aria2c --conf-path=/etc/aria2/aria2.conf -D
```

后台启动服务之后我们一般还需要Web面板;

前端web面板一般使用webui-aria2和YAAW(当然还有AriaNG)

>   <br/>
>
>   这两个的架设方法都很简单，基本上就是绑定域名之后丢到网站文件夹里，没啥特殊环境要求**(直接本地使用YAAW时甚至不需要使用Apache静态Server, 直接打开index.html即可)**
>
>   当然你也可以使用别人架设的，[aria2c.com](http://aria2c.com/)

简单的使用就是直接在上面添加任务，但是这对一些网盘之类的可能不太方便，可以使用一些插件:

-   全功能插件，基本上支持大部分网盘：[MBL&MC迅雷离线/QQ旋风/百度网盘/360云盘等aria2增强脚本](https://chrome.google.com/webstore/detail/mblmc迅雷离线qq旋风百度网盘360云盘等ar/iamaphkapjbdhhpdapkalhanifedeged?utm_source=chrome-app-launcher-info-dialog)
-   115网盘支持插件：[115下载助手](https://chrome.google.com/webstore/detail/115exporter/ojafklbojgenkohhdgdjeaepnbjffdjf?utm_source=chrome-app-launcher-info-dialog)
-   ~~百度网盘支持插件：[百度网盘助手](https://chrome.google.com/webstore/detail/baiduexporter/mjaenbjdjmgolhoafkohbhhbaiedbkno?utm_source=chrome-app-launcher-info-dialog)~~
-   迅雷离线支持插件：[迅雷离线助手](https://chrome.google.com/webstore/detail/thunderlixianassistant/eehlmkfpnagoieibahhcghphdbjcdmen?utm_source=chrome-app-launcher-info-dialog)

我给出的都是chrome应用商店的地址，访问需要某些特殊的姿势。

<br/>

### 后记

在服务器端离线下载之后, 可以通过Plex实现私人的在线片库, 或者通过类似FileZilla将服务器的文件传送回本地保存;

除了使用Aria2实现离线下载之外, 也可以使用docker-thunder-xware部署迅雷的离线下载;

迅雷远程下载官网:

http://yuancheng.xunlei.com/login.html

有机会再在博客更新关于部署docker-thunder-xware的文章;

<br/>

## 附录

文章参考:

-   [下载神器——Aria2，打造你自己的离线下载服务器](http://www.senra.me/download-artifact-aria2-create-your-own-offline-download-server/)

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>