---
title: 使用Go实现服务端事件推送SSE
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?11'
date: 2021-03-05 11:15:32
categories: Golang
tags: [Golang, SSE]
description: 服务端事件推送SSE可以说是WebSocket的轻量级实现，SSE只能用于服务端单向流推送，本文讲述了SSE的基本概念，并给出了Go的实现案例。
---

服务端事件推送SSE可以说是WebSocket的轻量级实现，SSE只能用于服务端单向流推送。

本文讲述了SSE的基本概念，并给出了Go的实现案例；

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/sse

<br/>

<!--more-->

## **使用Go实现服务端事件推送SSE**

### **什么是SSE(Server Sent Events)**

引用维基百科：

>   Server-Sent Events (SSE) is a server push technology enabling a client to receive automatic updates from a server via HTTP connection. The Server-Sent Events EventSource API is standardized as part of HTML5[1] by the W3C.

在Web开发时，由于HTTP是无状态的协议，所以客户端浏览器必须首先向服务器发送请求才能接收新数据。所以如果要实现服务端向客户端发起通知，通常可以使用WebSocket或者客户端长轮询(Long-Poling)的方式。但是其实如果只是服务端向客户端推送**单方向的数据流**时，可以使用H5标准中的SSE，SSE使用户可以订阅服务器端的实时数据流。

所以SSE主要是用于**只需要服务器单方向推送数据流**的使用场景，如：

-   股票行情自动收录
-   社交网站自动更新（Twitter）
-   …

<br/>

### **SSE与WebSocket**

[Websocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)是服务器与客户端之间的双向通信形式，通常用于建立聊天室或多人视频游戏，因为这些应用程序需要服务器与客户端之间的持续通信。

>   更多关于WebSocket：
>
>   -   [使用golang构建简单的websocket应用](/2020/10/28/使用golang构建简单的websocket应用/)

对于许多Web应用程序而言，WebSocket可能会过大。

例如，更新产品页面上项目的价格并不需要双向通信，服务器只需要单向通信即可更新其所有客户的价格；

SSE与Websocket 相比较：

-   SSE 提供单向通信，Websocket 提供双向通信；
-   SSE 是通过 HTTP 协议实现的，Websocket 是单独的协议；
-   实现上来说 SSE 比较容易，Websocket 复杂一些；
-   SSE 有最大连接数限制；
-   WebSocket可以传输二进制数据和文本数据，但SSE只有文本数据；

Websocket 使用场景：

-   VNC
-   协同编辑
-   …

<br/>

### **SSE与长轮询**

[长轮询](https://www.ably.io/topic/long-polling)是一种通信方法，由客户端定期访问服务器获取新数据；

当正在构建的应用程序涉及手工操作或执行计算量大的任务时，通常使用这种形式的通信；

例如，触发机器学习模型的训练，此时需要很长时间才能完成；在这种情况下，可能不需要经常检查这些任务的完成情况；

而SSE通常用于快速生成事件的应用程序中，例如，在YouTube视频上托管喜欢的实时计数，在UI上显示服务器日志文件或将通知推送到用户的电话，所有这些事件都近似于即时更新；

<br/>

### **使用Golang实现SSE**

Golang有开源库[eventsource](https://github.com/antage/eventsource)直接支持了SSE，在这里我们直接使用这个库构建服务器：

app.go

```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"gopkg.in/antage/eventsource.v1"
)

func main() {
	es := eventsource.New(nil, nil)
	defer es.Close()

	http.Handle("/", http.FileServer(http.Dir("./public")))
	http.Handle("/events", es)
	go func() {
		for {
			// 每2秒发送一条当前时间消息，并打印对应客户端数量
			es.SendEventMessage(fmt.Sprintf("hello, now is: %s", time.Now()), "", "")
			log.Printf("Hello has been sent (consumers: %d)", es.ConsumersCount())
			time.Sleep(2 * time.Second)
		}
	}()

	log.Println("Open URL http://localhost:8080/ in your browser.")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
```

上面的代码很容易理解：首先通过eventsource包创建了一个EventSource接口类型的对象，而EventSource接口包括了`http.Handler`接口，所以我们可以直接向`http.Handle`传入一个EventSource实例来作为路由处理函数。

在`http.Handle`中，我们指定了两个路由：

-   `/`：指向public目录，在此目录下放置了HTML页面；
-   `/events`：发送SSE消息的路由；

之后创建了一个goroutine，使用这个EventSource实例的`SendEventMessage`方法向客户端单向传递消息；

最后，在8080端口启动了http服务器；

所以我们访问`localhost:8080`可以访问首页、访问`localhost:8080/events`可以接收到消息；

>   更多关于eventsource库可见官方文档：
>
>   -   https://github.com/antage/eventsource

客户端HTML页面：

./public/index.html

```html
<!DOCTYPE html>
<html>
<head>
    <title>SSE test</title>
    <script type="text/javascript">
        window.addEventListener("DOMContentLoaded", function () {
            var evsrc = new EventSource("/events");
            evsrc.onmessage = function (ev) {
                document.getElementById("log")
                    .insertAdjacentHTML("beforeend", "<li>" + ev.data + "</li>");
            }
            evsrc.onerror = function (ev) {
                console.log("readyState = " + ev.currentTarget.readyState);
            }
        })
    </script>
</head>
<body>
<h1>SSE test</h1>
<div>
    <ul id="log">
    </ul>
</div>
</body>
</html>

```

客户端HTML页面在public目录下，通过`new EventSource("/events")`创建了前端的SSE接收实例对象evsrc，并设置了onmessage方法：每次接收到请求就在页面列表中加入一条数据；

<br/>

### **启动项目**

下载依赖：

```bash
go mod tidy
```

启动SSE后台：

```bash
go run app.go
```

访问：http://localhost:8080/

可以看到页面收到服务器主动推送时间：

![demo1.png](https://cdn.jsdelivr.net/gh/jasonkayzk/Go_Learn@sse/images/demo1.png)

同时服务器输出日志及客户端连接数：

![demo2.png](https://cdn.jsdelivr.net/gh/jasonkayzk/Go_Learn@sse/images/demo2.png)

实验完成！

<br/>

## **附录**

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/sse

参考文章：

-   https://amittallapragada.github.io/docker/fastapi/python/2020/12/23/server-side-events.html
-   https://stackoverflow.com/questions/5195452/websockets-vs-server-sent-events-eventsource

<br/>