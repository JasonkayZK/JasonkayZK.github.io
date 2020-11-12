---
title: 使用golang构建简单的websocket应用
toc: true
cover: 'https://acg.yanwz.cn/api.php?53'
date: 2020-10-28 15:31:17
categories: Websocket
tags: [Golang, Websocket]
description: 众所周知，HTTP是面向无连接的通信协议，而在构建web应用时，有时还是需要像socket这样的长连接；同时，传统的web应用依赖于客户端请求的推动，而服务器仅仅作为应用的响应方；为了能够实现服务器、客户端双端通信，websocket应运而生。
---

众所周知，HTTP是面向无连接的通信协议，而在构建web应用时，有时还是需要像socket这样的长连接；

同时，传统的web应用依赖于客户端请求的推动，而服务器仅仅作为应用的响应方；

为了能够实现服务器、客户端双端通信，websocket应运而生；

本文通过实现一个简单的websocket应用，来学习如何在go中使用websocket；

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/websocket

<br/>

<!--more-->

## 使用golang构建简单的websocket应用

### 什么是websocket

WebSocket是升级版的HTTP连接，WebSocket将一直存在，直到该连接被客户端或服务器终止。通过此WebSocket连接，我们可以执行双工通信，这是说我们可以使用此单连接从客户端与服务器进行来回通信的一种非常好的方法。

WebSocket的优点在于，它仅使用了单个TCP连接(尽管HTTP协议中也包括了keep-alive)，并且在整个服务期间所有的通信都是通过这个长期存在的TCP连接完成的；

同时，由于不需要持续轮询HTTP端点，因此可以大大减少使用WebSockets构建实时应用程序所需的网络开销！

下面通过一个简单的例子：

基于websocket实现服务器向web浏览器客户端推送实时服务器时间，来学习websocket；

<br/>

### websocket服务端

我们的服务端是通过[gorilla/websocket](https://github.com/gorilla/websocket)实现的；

具体服务端代码如下：

websocket.go

```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

// We'll need to define an UpGrader
// this will require a Read and Write buffer size
var upGrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

func wsEndpoint(w http.ResponseWriter, r *http.Request) {
	// upgrade this connection to a WebSocket
	// connection
	ws, err := upGrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
	}

	// say hello
	log.Println("Client Connected")
	err = ws.WriteMessage(1, []byte("Hi Client!"))

	// handle writer
	go func() {
		for {
			err = ws.WriteMessage(1, []byte(time.Now().Format("2006-01-02 15:04:05")))
			if err != nil {
				log.Println(err)
			}
			time.Sleep(time.Second)
		}
	}()

	// listen indefinitely for new messages coming
	// through on our WebSocket connection
	go func(conn *websocket.Conn) {
		for {
			// read in a message
			messageType, p, err := conn.ReadMessage()
			if err != nil {
				log.Println(err)
				return
			}
			// print out that message for clarity
			log.Println(string(p))

			if err := conn.WriteMessage(messageType, p); err != nil {
				log.Println(err)
				return
			}
		}
	}(ws)
}

func setupRoutes() {
	http.HandleFunc("/ws", wsEndpoint)
}

func main() {
	fmt.Println("starting server...")
	setupRoutes()
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

下面我们一步一步来看：

#### **① 创建Upgrader**

[gorilla/websocket](https://github.com/gorilla/websocket)主要是使用`websocket.Upgrader`包装类升级了通常的HTTP连接；

如下，创建了一个简单的Upgrader，并指定了读写缓冲区的大小：

```go
var upGrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}
```

****

#### **② 创建http路由handler并开启http-server**

下面的`setupRoutes`函数创建了`/ws`下的路由，并在8080端口开启了http服务：

```go
func setupRoutes() 
	http.HandleFunc("/ws", wsEndpoint)
}

func main() {
	fmt.Println("starting server...")
	setupRoutes()
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

>   对于http.HandleFunc中的参数需要是一个`func(http.ResponseWriter, *http.Request)`类型的函数；
>
>   其实也就是`http.Handler`接口声明的函数；

****

#### **③ 处理路由逻辑**

在`wsEndpoint`函数中处理了websocket逻辑：

```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

// We'll need to define an UpGrader
// this will require a Read and Write buffer size
var upGrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

func wsEndpoint(w http.ResponseWriter, r *http.Request) {
	// upgrade this connection to a WebSocket
	// connection
	ws, err := upGrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
	}

	// say hello
	log.Println("Client Connected")
	err = ws.WriteMessage(1, []byte("Hi Client!"))

	// handle writer
	go func() {
		for {
			time.Sleep(time.Second * 5)
			err = ws.WriteMessage(1, []byte(time.Now().Format("2006-01-02 15:04:05")))
			if err != nil {
				log.Println(err)
			}
		}
	}()

	// listen indefinitely for new messages coming
	// through on our WebSocket connection
	go func(conn *websocket.Conn) {
		for {
			// read in a message
			messageType, p, err := conn.ReadMessage()
			if err != nil {
				log.Println(err)
				return
			}
			// print out that message for clarity
			log.Println(string(p))

			if err := conn.WriteMessage(messageType, p); err != nil {
				log.Println(err)
				return
			}
		}
	}(ws)
}

func setupRoutes() {
	http.HandleFunc("/ws", wsEndpoint)
}

func main() {
	fmt.Println("starting server...")
	setupRoutes()
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

函数首先使用upGrader对象中的`Upgrade`方法升级了http连接，使其为一个websocket连接，并返回`websocket.Conn`连接；

随后我们使用这个连接先发送了一条消息：`Hi Client!`

随后在`wsEndpoint`函数中开启了两个新的goroutine：

一个用来向连接每五秒发送服务器当前时间，另一个用来监听并打印web客户端发送回来的信息；

至此，我们的websocket编写完毕；

<br/>

### websocket客户端

编写完了服务端，接下来我们编写客户端；

客户端代码如下：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta http-equiv="X-UA-Compatible" content="ie=edge"/>
    <title>Go WebSocket Demo</title>
</head>
<body>
<h2>Go WebSocket Demo</h2>
<div id="data"></div>
<script>
    let socket = new WebSocket("ws://127.0.0.1:8080/ws");
    console.log("Attempting Connection...");

    socket.onopen = () => {
        console.log("Successfully Connected");
        socket.send("Hi From the Client!");
    };
    socket.onclose = event => {
        console.log("Socket Closed Connection: ", event);
        socket.send("Client Closed!");
    };
    socket.onmessage = event => {
        console.log(event);
        let para = document.createElement("p");
        para.innerText = event.data;
        let tb = document.getElementById("data");
        tb.prepend(para);
    }
    socket.onerror = error => {
        console.log("Socket Error: ", error);
    };
</script>
</body>
</html>
```

在HTML页面中，在data插入websocket中的message；

在script中实现了websocket的逻辑：

首先使用`new WebSocket("ws://127.0.0.1:8080/ws")`创建了一个WebSocket连接（HTTP5规范支持），随后在websocket对象上注册了`onopen`、`onclose`、`onmessage`以及`onerror`事件；

其中打开和关闭都会调用`send`方法给服务端发送消息；

而在接收到message之后，会将message插入到页面的data中；

至此，前端也开发完毕；

<br/>

### 测试websocket

最后，使用`go run websocket.go`启动websocket服务端；

随后在浏览器中打开index.html即可看到服务端的推送，同时服务端也会打出响应的log：

![websocket_demo.png](https://jasonkay_image.imfast.io/images/websocket_demo.png)

## 附录

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/websocket


<br/>