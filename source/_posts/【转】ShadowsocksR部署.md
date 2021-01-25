---
title: '【转】ShadowsocksR部署'
toc: true
cover: 'https://acg.toubiec.cn/random?44'
date: 2020-10-01 21:55:24
categories: 服务自建
tags: [服务自建, ShadowsocksR]
description: 一个自建ShadowsocksR的经历；
---

一个自建ShadowsocksR的经历；

<br/>

<!--more-->

## ShadowsocksR部署

### 下载并启动脚本

 **CentOS6/Debian6/Ubuntu14 ShadowsocksR一键部署管理脚本（2018.11.21更新）：** 

-    	脚本一（2018.11.20更新） 

```bash
yum -y install wget

wget -N --no-check-certificate https://raw.githubusercontent.com/ToyoDAdoubi/doubi/master/ssr.sh && chmod +x ssr.sh && bash ssr.sh
```

-    	备用脚本二（2018.11.21更新） 

 如果上面的脚本暂时用不了，可以用下面的备用脚本，备用脚本没有单独做图文教程，自己摸索下就会了。备用脚本卸载命令：./shadowsocksR.sh uninstall 

```bash
yum -y install wget

wget --no-check-certificate https://raw.githubusercontent.com/teddysun/shadowsocks_install/master/shadowsocksR.sh

chmod +x shadowsocksR.sh

./shadowsocksR.sh 2>&1 | tee shadowsocksR.log
```

 ———————————————————代码分割线———————————————— 

 复制上面的脚本一代码到VPS服务器里，复制代码用鼠标右键的复制，然后在vps里面右键粘贴进去，因为ctrl+c和ctrl+v无效。接着按回车键，脚本会自动安装，以后只需要运行这个快捷命令就可以出现下图的界面进行设置，快捷管理命令为：`bash ssr.sh`
 ![在这里插入图片描述](http://www.pianshen.com/images/599/979e700abc7a92da9d1628a981b1df7f.png) 

<BR/>

### 配置ShadowsocksR

如上图出现管理界面后，输入数字1来安装SSR服务端。如果输入1后不能进入下一步，那么请退出xshell，重新连接vps服务器，然后输入快捷管理命令`bash ssr.sh`再尝试。

 ![在这里插入图片描述](http://www.pianshen.com/images/695/5ec5436cf30707a187c16991bead5ad7.png) 

 根据上图提示，依次输入自己想设置的端口和密码 (密码建议用复杂点的字母组合，端口号为40-65535之间的数字)，回车键用于确认 ；

 注：关于端口的设置，总的网络总端口有6万多个，理论上可以任意设置，但不要以0开头！但是有的地区需要设置特殊的端口才有效，一些特殊的端口比如80、143、443、1433、3306、3389、8080。 

![在这里插入图片描述](http://www.pianshen.com/images/632/49d7ad8f74dfe72dcdf7a431e7e99de8.png) 

 如上图，选择想设置的加密方式，比如10，按回车键确认 ；

 接下来是选择协议插件，如下图： 

 ![在这里插入图片描述](http://www.pianshen.com/images/258/1110f3d1138aaed9f9f903b71e82c9aa.png)

 ![在这里插入图片描述](http://www.pianshen.com/images/755/bf19f654cd239d6a36265e6c2cfaee9b.png) 

 选择并确认后，会出现上图的界面，提示你是否选择兼容原版，这里的原版指的是SS客户端（SS客户端没有协议和混淆的选项），可以根据需求进行选择，演示选择y 

 之后进行混淆插件的设置。 

<font color="#f00">**注意：如果协议是origin，那么混淆也必须是plain；如果协议不是origin，那么混淆可以是任意的。有的地区需要把混淆设置成plain才好用。因为混淆不总是有效果，要看各地区的策略，有时候不混淆（plain）或者（origin和plain一起使用），让其看起来像随机数据更好。（特别注意：tls 1.2_ticket_auth容易受到干扰！请选择除tls开头以外的其它混淆！！！）**</font>

![在这里插入图片描述](http://www.pianshen.com/images/631/b66dbff52324b42ea1e870ba06050c8f.png) 

 进行混淆插件的设置后，会依次提示你对设备数、单线程限速和端口总限速进行设置，默认值是不进行限制，个人使用的话，选择默认即可，即直接敲回车键。 

<font color="#f00">**注意：关于限制设备数，这个协议必须是非原版且不兼容原版才有效，也就是必须使用SSR协议的情况下，才有效！**</font>
 ![在这里插入图片描述](http://www.pianshen.com/images/100/6fd05ea5bc16587ab1b260a5733bc424.png) 

 之后代码就正式自动部署了，到下图所示的位置，提示你下载文件，输入：y

 ![在这里插入图片描述](http://www.pianshen.com/images/609/4ead64e7886bee664db7c2201191e809.png) 

 耐心等待一会，出现下面的界面即部署完成：

 ![在这里插入图片描述](http://www.pianshen.com/images/686/ff45e2cada1a69f098b9d4cd3a16ca86.png)
 ![在这里插入图片描述](http://www.pianshen.com/images/183/0b0b5dac202fa2949551323542be3fd7.png) 

 根据上图就可以看到自己设置的SSR账号信息，包括IP、端口、密码、加密方式、协议插件、混淆插件，这些信息需要填入你的SSR客户端。如果之后想修改账号信息，直接输入快捷管理命令：`bash ssr.sh`，进入管理界面，选择相应的数字来进行一键修改。例如：
 ![在这里插入图片描述](http://www.pianshen.com/images/30/cb7b8d2d693be01859bff0bc6dbc912e.png)

 ![在这里插入图片描述](http://www.pianshen.com/images/913/832bbff8271ee7760673a68b99e5d3c1.png) 

 脚本演示结束。 

 此脚本是开机自动启动，部署一次即可。最后可以重启服务器确保部署生效（一般情况不重启也可以）。重启需要在命令栏里输入reboot  ，输入命令后稍微等待一会服务器就会自动重启，一般重启过程需要2～5分钟，重启过程中Xshell会自动断开连接，等VPS重启好后才可以用Xshell软件进行连接。如果部署过程中卡在某个位置超过10分钟，可以用xshell软件断开，然后重新连接你的ip，再复制代码进行部署。 

<BR/>

### 一键加速VPS服务器

 2018年12月9日增加破解版锐速加速教程。谷歌BBR见github原链接 

 **【破解版锐速加速教程】** 

 此加速教程为破解版锐速加速,Vultr的服务器centos6系统官方进行了更新，导致目前不支持BBR的部署，但锐速应该是可以部署的，故增加了此部署脚本，加速后对速度的提升很明显，所以推荐部署加速脚本。该加速方法是开机自动启动，部署一次就可以了。 

 第一步，先更换服务器内核： 

```
yum -y install wget

wget --no-check-certificate https://blog.asuhu.com/sh/ruisu.sh && bash ruisu.sh
```

 ![在这里插入图片描述](http://www.pianshen.com/images/927/ba44a64eedf1c84a614ce6d2f6730747.png) 

 不动的时候敲回车键，在上图时需要多等一会儿。

![在这里插入图片描述](http://www.pianshen.com/images/162/826195745c7a3fb8e149d95db978cb8a.png) 

 出现上图时表示已成功替换内核并服务器自动重启。 

 **完成后会重启，2分钟后重新连接服务器，连上后开始第二步的操作。** 

 **第二步，一键安装锐速：** 

```bash
wget -N --no-check-certificate https://raw.githubusercontent.com/91yun/serverspeeder/master/serverspeeder-all.sh && bash serverspeeder-all.sh
```

 卸载加速代码命令为： 

```bash
chattr -i /serverspeeder/etc/apx* && /serverspeeder/bin/serverSpeeder.sh uninstall -f
```

 但有些内核是不适合的，部署过程中需要手动选择推荐的，当部署时出现以下字样：
 ![在这里插入图片描述](http://www.pianshen.com/images/323/6be7389b85da9a0fdc3efe322162db53.png) 

 提示没有完全匹配的内核,随便选一个内核就行,按照提示来输入数字,按回车键即可 

 锐速安装成功标志如下：

![在这里插入图片描述](http://www.pianshen.com/images/785/147b581e34966d1f3c9e72ef3d925301.png) 

 出现running字样即可！

 安装ss客户端并配置信息连接：

[![img](http://www.jkxiao.com/wp-content/uploads/2019/11/11.png)](http://www.jkxiao.com/?attachment_id=593)

 <br/>

### ShadowsocksR客户端

ShadowsocksR客户端市面上有很多了；

这里推荐一个比较好用的：

-   https://github.com/itrump/ssfree

上面这个客户端是我目前在用的，同时支持Android、iOS、Win等平台，下面是各个平台的使用教程：

-   [ssr/ss windows教程](https://github.com/itrump/ssfree/blob/master/cn/ssr_ss_tutorial_windows教程.md)
-   [ssr/ss android教程](https://github.com/itrump/ssfree/blob/master/cn/ssr_ss_tutorial_android教程.md)
-   [ssr/ss mac教程](https://github.com/itrump/ssfree/blob/master/cn/ssr_ss_tutorial_mac教程.md)
-   [ssr/ss iphone/ipad教程](https://github.com/itrump/ssfree/blob/master/cn/ssr_ss_tutorial_ios教程.md)

><font color="#f00">**我本人是使用韩国服务器搭建了一个ShadowsocksR服务器，如果有需要的可以联系我**</font>
>
><font color="#f00">**(不过可能不会支持太多人，毕竟带宽有限)**</font>
>
><font color="#f00">**如果从事非法活动，整个服务器被禁，大家都没得用，所以希望大家都能遵守社会主义核心价值观**</font>

 <br/>

## 附录

文章参考：

-   [ShadowsocksR一键部署（节选）](https://www.jkxiao.com/?p=587)

<br/>