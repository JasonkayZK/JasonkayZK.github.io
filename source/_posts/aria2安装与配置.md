---
title: aria2安装与配置
cover: http://api.mtyqx.cn/api/random.php?88
date: 2020-05-01 13:51:50
categories: 软件安装与配置
tags: [软件安装与配置, aria2]
description: 本文主要讲解下载工具aria2的安装与配置;
---


本文主要讲解下载工具aria2的安装与配置;

<br/>

<!--more-->

**目录:**

<!-- toc -->

<br/>

## aria2安装与配置

`Aria2`是一个命令行工具，优点是轻量、开源，支持多协议、多线程，可以直接使用`Aria2`命令来下载`BT`种子等资源文件;

同时aria2也可以配合前端比如`Aria2 Web UI`、`AriaNg`等使用;

<br/>

### 安装

#### 官方版本

官方版本直接通过apt或者yum安装即可;

****

#### 集成版本

因为Aria2很强大，同时因为强大又没那么容易上手，所以有些人就想办法把Aria2集成到其他软件或者封装成图形界面，使得它能够更方便使用。

**1.Persepolis Download Manager(Windows/Linux/macOS)**

官网: https://persepolisdm.github.io

下载：

Debian/Ubuntu: https://github.com/persepolisdm/persepolis/releases/download/2.4.2/persepolis_2.4.2.1_all.deb

macOS: https://github.com/persepolisdm/persepolis/releases/download/2.4.2/persepolis_2_4_2_mac.dmg

Windows 32位: https://github.com/persepolisdm/persepolis/releases/download/2.4.2/persepolis_2_4_2_windows_32bit.exe

Windows 64位: https://github.com/persepolisdm/persepolis/releases/download/2.4.2/persepolis_2_4_2_windows_64bit.exe

纯粹的套壳之作，开箱即用，虽然目前还有些问题，但是还是挺好的

**~~2.PanDownload(Windows)~~**

下载地址: https://github.com/cherryljr/PanDownload/raw/master/PanDownload.exe

将Aria2用于百度云下载，无需浏览器插件，无需复制粘贴，登录账户一点即下

**3.Aria2GUI(macOS)**

下载地址: https://github.com/yangshun1029/aria2gui

就是单纯的Yaaw+内置Aria2，但是效果其实挺好，配合自带的浏览器插件还是不错的

**4.Maria(macOS)**

下载地址: https://github.com/shincurry/Maria

这个集成了Aria2，也能用You-Get来进行部分下载，也是不错的

****

#### 魔改版本

还有个改版的，把并发线程提到了128，暴力下载

GNU/Linux 64位: https://github.com/xzl2021/aria2-static-builds-with-128-threads/releases/download/v1.32.0/aria2-1.32.0-linux-gnu-64bit-build1.tar.bz2

<br/>

### 配置

通常安装的aria2是没有配置文件的, 所以我们要手动创建配置文件;

在`/etc/aria2`目录下创建`aria2.conf`和`aria2.session`文件:

```bash
$ cd /etc/ 
$ sudo mkdir aria2 && cd aria2 && touch aria2c.conf && touch aria2.session
```

编辑aria2c.conf文件内容，内容如下:

```bash
# Trackers
bt-tracker=udp://tracker.opentrackr.org:1337/announce,udp://tracker.leechers-paradise.org:6969/announce,udp://p4p.arenabg.com:1337/announce,udp://9.rarbg.to:2710/announce,udp://9.rarbg.me:2710/announce,udp://exodus.desync.com:6969/announce,udp://tracker.sbsub.com:2710/announce,udp://retracker.lanta-net.ru:2710/announce,udp://open.stealth.si:80/announce,udp://tracker.tiny-vps.com:6969/announce,udp://tracker.cyberia.is:6969/announce,udp://tracker.torrent.eu.org:451/announce,udp://tracker.moeking.me:6969/announce,udp://tracker3.itzmx.com:6961/announce,udp://ipv4.tracker.harry.lu:80/announce,udp://bt2.archive.org:6969/announce,udp://bt1.archive.org:6969/announce,http://tracker1.itzmx.com:8080/announce,udp://valakas.rollo.dnsabr.com:2710/announce,udp://tracker.zerobytes.xyz:1337/announce

# 文件的保存路径(可使用绝对路径或相对路径), 默认: 当前启动位置
dir=/home/zk/Downloads
# 启用磁盘缓存, 0为禁用缓存, 需1.16以上版本, 默认:16M
disk-cache=5M
# 文件预分配方式, 能有效降低磁盘碎片, 默认:prealloc
# 预分配所需时间: none < falloc ? trunc < prealloc
# falloc和trunc则需要文件系统和内核支持, NTFS建议使用falloc, EXT3/4建议trunc
file-allocation=none
# 断点续传
continue=true

## 下载连接相关 ##

# 最大同时下载任务数, 运行时可修改, 默认:5
max-concurrent-downloads=20
# 同一服务器连接数, 添加时可指定, 默认:1
max-connection-per-server=15
# 最小文件分片大小, 添加时可指定, 取值范围1M -1024M, 默认:20M
# 假定size=10M, 文件为20MiB 则使用两个来源下载; 文件为15MiB 则使用一个来源下载
min-split-size=10M
# 单个任务最大线程数, 添加时可指定, 默认:5
split=16
# 整体下载速度限制, 运行时可修改, 默认:0
#max-overall-download-limit=0
# 单个任务下载速度限制, 默认:0
#max-download-limit=0
# 整体上传速度限制, 运行时可修改, 默认:0
max-overall-upload-limit=20kb
# 单个任务上传速度限制, 默认:0
max-upload-limit=5kb
# 禁用IPv6, 默认:false
disable-ipv6=true
# 禁用https证书检查
check-certificate=false
#运行覆盖已存在文件
allow-overwrite=true
#自动重命名
auto-file-renaming

## 进度保存相关 ##

# 从会话文件中读取下载任务
input-file=/etc/aria2/aria2.session
# 在Aria2退出时保存`错误/未完成`的下载任务到会话文件
save-session=/etc/aria2/aria2.session
# 定时保存会话, 0为退出时才保存, 需1.16.1以上版本, 默认:0
save-session-interval=120

## RPC相关设置 ##

# 启用RPC, 默认:false
enable-rpc=true
# 允许所有来源, 默认:false
rpc-allow-origin-all=true
# 允许非外部访问, 默认:false
rpc-listen-all=true
# 事件轮询方式, 取值:[epoll, kqueue, port, poll, select], 不同系统默认值不同
#event-poll=select
# RPC监听端口, 端口被占用时可以修改, 默认:6800
rpc-listen-port=6800
# 保存上传的种子文件
rpc-save-upload-metadata=false

## BT/PT下载相关 ##

# 当下载的是一个种子(以.torrent结尾)时, 自动开始BT任务, 默认:true
#follow-torrent=true
# BT监听端口, 当端口被屏蔽时使用, 默认:6881-6999
listen-port=51413
# 单个种子最大连接数, 默认:55
#bt-max-peers=55
# 打开DHT功能, PT需要禁用, 默认:true
enable-dht=true
# 打开IPv6 DHT功能, PT需要禁用
enable-dht6=false
# DHT网络监听端口, 默认:6881-6999
#dht-listen-port=6881-6999
# 本地节点查找, PT需要禁用, 默认:false
bt-enable-lpd=true
# 种子交换, PT需要禁用, 默认:true
enable-peer-exchange=true
# 每个种子限速, 对少种的PT很有用, 默认:50K
#bt-request-peer-speed-limit=50K
# 客户端伪装, PT需要
peer-id-prefix=-UT341-
user-agent=uTorrent/341(109279400)(30888)
# 当种子的分享率达到这个数时, 自动停止做种, 0为一直做种, 默认:1.0
seed-ratio=1.0
# 强制保存会话, 话即使任务已经完成, 默认:false
# 较新的版本开启后会在任务完成后依然保留.aria2文件
#force-save=false
# BT校验相关, 默认:true
#bt-hash-check-seed=true
# 继续之前的BT任务时, 无需再次校验, 默认:false
bt-seed-unverified=true
# 保存磁力链接元数据为种子文件(.torrent文件), 默认:false
#bt-save-metadata=false
#仅下载种子文件
bt-metadata-only=true
#通过网上的种子文件下载，种子保存在内存
follow-torrent=mem
```

上面的配置可以根据个人需要更改, 如果未配置则为默认项;

其中:

-   bt-tracker可以设置为更新的内容;
-   dir设置为下载目录;
-   input-file: aria2.session的位置;

而Github提供了最新的tracker, 自行到这里取最新的添加，每个地址之间以逗号分开:

https://github.com/ngosang/trackerslist

><br/>
>
>更全的配置文件说明见:
>
>[Aria2配置文件参数翻译详解](http://www.senra.me/aria2-conf-file-parameters-translation-and-explanation/)

<br/>

### 启动

直接使用下面的命令启动:

```bash
aria2c --conf-path=/etc/aria2/aria2.conf -D
```

你就可以使用aria2下载你的bt种子或磁力链了，aria2c -h 查看使用帮助

<br/>

### 使用

我们使用aria2命令直接下载:

**1、直链下载**

下载直链文件，只需在命令后附加地址，如：

```bash
aria2c http://xx.com/xx
```

如果需要重命名为`yy`的话加上`--out`或者`-o`参数，如：

```bash
aria2c --out=yy http://xx.com/xx
aria2c -o yy http://xx.com/xx
```

使用`aria2`的分段和多线程下载功能可以加快文件的下载速度，对于下载大文件时特别有用。`-x` 分段下载，`-s` 多线程下载，如：

```bash
aria2c -s 2 -x 2 http://xx.com/xx
```

这将使用`2`个连接和`2`个线程来下载该文件。

****

**2、BT下载**

种子和磁力下载：

```bash
aria2c 'xxx.torrnet'
aria2c '磁力链接'
```

列出种子内容：

```bash
aria2c -S xxx.torrent
```

下载种子内编号为`1`、`4`、`5`、`6`、`7`的文件，如：

```bash
aria2c --select-file=1,4-7 xxx.torrent
```

设置`bt`端口：

```bash
aria2c --listen-port=3653 ‘xxx.torrent’
```

****

**3、限速下载**

单个文件最大下载速度：

```bash
aria2c --max-download-limit=300K -s10 -x10 'http://xx.com/xx'
```

整体下载最大速度：

```bash
aria2c --max-overall-download-limit=300k -s10 -x10 'http://xx.com/xx'
```

<br/>

### 浏览器插件

**Safari**

Safari2Aria: 在Safari中管理Aria2，并且劫持默认下载方式

下载地址: https://github.com/miniers/safari2aria

****

**115**

115: 使用Aria2下载115资源

下载地址: https://github.com/acgotaku/115/

****

**百度网盘**

BaiduExporter: 网盘助手, 使用Aria2下载百度网盘资源，这个因为被Chrome商店下架了，需要安装参考——>[传送门](http://www.senra.me/reinstall-baiduexporter-for-chrome/)

下载地址: https://github.com/acgotaku/BaiduExporter

****

**YAAW**

YAAW for Chrome: 在chrome中直接内置一个YAAW，用于直接管理Aria2

下载地址: https://chrome.google.com/webstore/detail/yaaw-for-chrome/dennnbdlpgjgbcjfgaohdahloollfgoc

****

**迅雷离线**

-   Chrome Extension: [ThunderLixianAssistant](https://chrome.google.com/webstore/detail/eehlmkfpnagoieibahhcghphdbjcdmen)
-   UserScript: [ThunderLixianExporter](https://github.com/binux/ThunderLixianExporter)

****

**旋风离线**

-   UserScript: [XuanFengEx](https://greasyfork.org/scripts/354-xuanfengex)
-   UserScript: [LixianExporter](https://greasyfork.org/scripts/2398-lixianexporter)

****

**其他脚本**

-   Chrome Extension: [添加到aria2](https://chrome.google.com/webstore/detail/nimeojfecmndgolmlmjghjmbpdkhhogl)

<br/>

### WebGUI

YAAW:

下载地址: https://github.com/binux/yaaw

><br/>
>
>## YAAW 使用说明
>
>在打开index.html后要配置JSON-RPC Path;
>
>并且确保在aria2配置中开启了RPC, 已经端口号对应等;
>
>**JSON-RPC Path**
>
>-   `JSON-RPC Path` 默认为: `http://localhost:6800/jsonrpc`
>
>-   如果提示 `Aria2 RPC 服务器错误`
>
>    按照以下方法修改	
>
>   -   **`host`**: 指运行 Aria2 所在机器的 IP 或者名字
>   -   **`port`**: 使用 `--rpc-listen-port` 选项设置的端口, 未设置则是 `6800`
>
>   -   普通情况设置为: `http://host:port/jsonrpc`
>   -   使用 `--rpc-secret=xxxxxx` 选项设置为: `http://token:xxxxxx@host:port/jsonrpc`
>   -   使用 `--rpc-user=user --rpc-passwd=pwd ` 选项设置为: `http://user:pwd@host:port/jsonrpc`
>   -   以上 `JSON-RPC Path` 中的 `http` 可以用 `ws` 替代, 代表使用 `WebSocket 协议`
>   -   当使用 https://aria2c.com 访问时, 需要使用 `https` 或 `wss` 协议
>
>**Tips**
>
>-   在 YAAW 中对 Aria2 的设置会在 Aria2 重启后丢失, 必要的设置请写入配置文件
>-   已经下载完成的任务会在 Aria2 重启后消失, 除非启用了 `--force-save` 选项
>-   因界面已汉化, 其他不再赘述.

webgui-aria2:

下载地址: https://github.com/ziahamza/webui-aria2

AriaNG:

下载地址: https://github.com/mayswind/AriaNg

Glutton:

下载地址: https://github.com/NemoAlex/glutton

<br/>

## 附录

参考文章:

-   [下载工具系列——Aria2 (几乎全能的下载神器)](http://www.senra.me/awesome-downloader-series-aria2-almost-the-best-all-platform-downloader/)
-   [Aria2配置文件参数翻译详解](http://www.senra.me/aria2-conf-file-parameters-translation-and-explanation/)
-   [Linux使用Aria2命令下载BT种子/磁力/直链文件](https://www.cnblogs.com/languang9801/p/10940779.html)
-   [Aria2 & YAAW 使用说明](http://aria2c.com/usage.html)

<br/>