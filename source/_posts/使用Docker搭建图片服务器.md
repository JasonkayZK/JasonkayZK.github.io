---
title: 使用Docker搭建图片服务器
toc: true
date: 2020-01-16 11:08:15
cover: https://acg.yanwz.cn/api.php?13
categories: Docker
tags: [Docker, FTP, Nginx]
description: 最近做项目需要用到图片服务器, 但是把vsftpd和nginx服务器下载, 配置还是有些麻烦, 所以自己基于fauria/vsftpd镜像构建了一个图片服务器方便使用
---

最近做项目需要用到图片服务器, 但是把vsftpd和nginx服务器下载, 配置还是有些麻烦, 所以自己基于fauria/vsftpd镜像构建了一个图片服务器方便使用

镜像地址: https://hub.docker.com/repository/docker/jasonkay/image-server

<br/>

<!--more-->

## 基于vsftpd + nginx实现的图片服务器

### 说明

jasonkay/image-server这个镜像基于fauria/vsftpd镜像构建, 在其中添加了nginx服务器, 并完成了配置, 可以通过命令行直接启动

<br/>

### 使用说明

启动参数:

```bash
docker run -d 
    -v /ftp_file:/home/vsftpd 
    -p 20:20 
    -p 21:21 
    -p 80:80 
    -p 21100-21110:21100-21110 
    -e FTP_USER=test 
    -e FTP_PASS=123456 
    -e PASV_ADDRESS=192.168.1.100 
    -e PASV_MIN_PORT=21100 
    -e PASV_MAX_PORT=21110 
    --name img_server jasonkay/image-server
```

默认映射路径: /ftp_file:/home/vsftpd

>   <br/>
>
>   **注意:**
>
>   <font color="#f00">**启动后默认是不开启nginx的http -> ftp的服务的, 需要手动进入容器, 执行`/sbin/nginx` ,开启nginx服务**</font>
>
>   **参数说明:**
>
>   1.  -v /ftp_file:/home/vsftpd: ftp文件目录映射(默认为/ftp_file目录下)
>   2.  -p 指定端口映射
>   3.  FTP_USER: FTP的用户名
>   4.  FTP_PASS: FTP的密码
>   5.  PASV_ADDRESS: 服务器ip
>   6.  PASV_MIN_PORT: 被动模式最小端口号
>   7.  PASV_MAX_PORT: 被动模式最大端口号
>
>   **启动nginx后, 默认http-ftp映射路径为: http://ip/username/**
>
>   如: test用户存放: images/1.png, 则访问路径为: http://ip/test/images/1.png

<br/>

### 构建时遇到的一些问题

**① 425 Security: Bad IP connecting.解决方法**

使用FTP客户端进行连接vsftpd时报错

><br/>
>
>**解决方法:**
>
>1.  `vim /etc/vsftpd/vsftpd.conf`
>2.  添加：`pasv_promiscuous=YES`
>3.  保存后退出
>4.  重启 vsftpd   `service vsftpd restart`
>
>**参数说明:**
>
>此选项激活时，将关闭PASV模式的安全检查: 该检查确保数据连接和控制连接是来自同一个IP地址。小心打开此选项。此选项唯一合理的用法是存在于由安全隧道方案构成的组织中。默认值为NO
>
>合理的用法是：在一些安全隧道配置环境下，或者更好地支持FXP时(才启用它)

<br/>

**② ftpClient.makeDirectory(path)返回false，无法创建目录的问题**

使用Java的FTPClient客户端创建目录时, 返回为false, 即无法创建目录

><br/>
>
>**原因:**
>
>由于使用的是普通账号登录，所以一开始就设置chroot_local_user=YES，将用户禁锢在了宿主目录，导致始终无法创建目录。但是可以上传文件，不过，上传的文件最终也只能存放在宿主目录下，即 /home/test/xxx.txt
>
>**解决方法:**
>
>将vsftpd.conf文件中的chroot_local_user=NO，重启vsftpd即可

<br/>

**③ 使用nginx创建http -> ftp的反向代理映射**

修改nginx配置文件(默认位于/etc/nginx/nginx.conf):

-   修改为user root;

-   修改location:

    ```
    location / {
    	root /home/vsftpd;
    	autoindex on;
    }
    
    # 或者
    
    location / {  
        root  /home/ftpuser; # 定义服务器的默认网站根目录位置
        index index.html index.php index.htm; # 定义首页索引文件的名称
    }
    ```

<br/>

### 后期展望

这个镜像在部署之后默认只开启ftp服务, 还需要手动进入容器启动nginx(使用`/sbin/nginx`启动)

下一步添加启动容器自动启动ftp和nginx的镜像

目前已经尝试过得方法:

-   ~~使用`<RUN>`标签运行init.sh脚步~~
-   ~~使用`CMD`标签~~
-   ~~使用`ENTRYPOINT`标签~~

有知道解决方案的欢迎在下方留言或直接联系我, 也欢迎与我交流

<br/>