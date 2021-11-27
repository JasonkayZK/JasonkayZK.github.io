---
title: 【分享】Epic-Game自动领取Docker镜像
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?44'
date: 2021-09-04 23:15:06
categories: 工具分享
tags: [工具分享, 福利分享, Docker]
description: 分享一个每天自动领取Epic-Game游戏的Docker镜像；
---

分享一个每天自动领取Epic-Game游戏的Docker镜像；

源代码：

-   https://github.com/JasonkayZK/docker_repo/tree/epic-games-claimer

<br/>

<!--more-->

# **【分享】Epic-Game自动领取Docker镜像**

信息来源：

-   https://www.appinn.com/epicgames-claimer-docker/

由于是Docker镜像，所以部署起来非常简单；

我是使用Docker-Compose起来的代码：

[docker-compose.yml](https://github.com/JasonkayZK/docker_repo/blob/epic-games-claimer/docker-compose.yml)

```yaml
version: '3'

services:
  epic-auto:
    image: luminoleon/epicgames-claimer:latest
    container_name: epic-auto
    restart: unless-stopped
    environment:
      - TZ=Asia/Shanghai
      - AUTO_UPDATE=true
      - EMAIL=your_email_address
      - PASSWORD=your_password # 2FA Closed!
      - RUN_AT=23:00 # Run everyday
      - ONCE=false
```

将上面的`EMAIL`和`PASSWORD`换成你的，并且关闭账号的2FA即可！

`RUN_AT`为每天执行的时间，可以自行设定；

启动：

```bash
docker-compose up -d
```

启动后日志：

```
[Sat Sep  4 22:53:01 2021] Claimer is starting...
[Sat Sep  4 22:53:02 2021] Claimer started. Run at 23:00 everyday.
[Sat Sep  4 22:53:53 2021] All available weekly free games are already in your library.
[Sat Sep  4 23:00:37 2021] Warning: CAPTCHA is required for unknown reasons.
[Sat Sep  4 23:01:12 2021] Warning: CAPTCHA is required for unknown reasons.
[Sat Sep  4 23:01:56 2021] All available weekly free games are already in your library.
```

可以看到成功领取了（我已经领过了，所以显示`All available weekly free games are already in your library.`）；

源代码：

-   https://github.com/JasonkayZK/docker_repo/tree/epic-games-claimer

<br/>
