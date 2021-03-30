---
title: 使用Go打包二进制React单页面应用
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?77'
date: 2021-03-28 20:59:08
categories: Go
tags: [Go, SPA, React]
description: Golang在1.16中加入了embed包，可以将文件直接打包为二进制；除此之外，github的开源库rakyll/statik也提供了类似的功能，并且使用起来也很方便；本文使用rakyll/statik库，以一个TODO List应用为例，打包了一个二进制的React SPA应用；
---

Golang在1.16中加入了embed包，可以将文件直接打包为二进制；除此之外，github的开源库rakyll/statik也提供了类似的功能，并且使用起来也很方便；

本文使用[rakyll/statik](https://github.com/rakyll/statik)库，以一个TODO List应用为例，打包了一个二进制的React SPA应用；

源代码：

-   https://github.com/JasonkayZK/go-spa-demo

<br/>

<!--more-->

## **使用Go打包二进制React单页面应用**

### **前言**

在微服务 + 云上部署大行其道的今天，其实**把所有的静态资源全部打包到一个二进制文件是相当不明智的（类似于Java Web项目打包到一整个jar包或者war包）；**

但是对于二进制来说，可以在**一定程度上降低软件分发的难度，以及用户的使用难度；**

<font color="#f00">**想象一下，整个项目只有一个二进制，双击打开就好，完全的纯净版是多么的爽！**</font>

**Golang在1.16中加入了embed包，可以将文件直接打包为二进制；**

除此之外，github的开源库rakyll/statik也提供了类似的功能，并且使用起来也很方便；

所有，本文使用[rakyll/statik](https://github.com/rakyll/statik)库，以一个TODO List应用为例，打包了一个二进制的React SPA应用；

<br/>

### **构建React SPA应用**

在项目根目录使用命令`create-react-app`创建一个React项目：

```bash
create-react-app web
```

>   如果没有安装这个命令，可以使用npm直接安装：
>
>   ```bash
>   npm install -g create-react-app
>   ```

项目创建完成后，依赖会自动下好；

下面我们使用React进行进行TODO List的开发；

首先添加Todo.js作为Todo List中单个项的组件：

web/Todo.js

```javascript
import React, {useState} from 'react'

export const Todo = ({handleAdd}) => {
    const [description, setDescription] = useState('')

    return (<form onSubmit={x => handleAdd({description})}>
        <input type="text" value={description} onChange={x => setDescription(x.target.value)}></input>
        <button disabled={description.length < 1}>Add</button>
    </form>)
}
```

其次，添加整个TODO List的列表项`Todos.js`和`Todos.css`：

web/Todos.js

```javascript
import React, {Component, Fragment} from 'react'
import {Todo} from './Todo'

import './Todos.css'

export class Todos extends Component {
    constructor() {
        super()
        this.state = {
            todos: [],
            waiting: false
        }
        this.handleAdd = this.handleAdd.bind(this)
    }

    componentDidMount() {
        this.setState({waiting: true})
        fetch('/todo')
            .then(response => {
                this.setState({waiting: true})
                if (response.status === 200) {
                    return response.json()
                }
            })
            .then(todos => {
                this.setState({todos})
            })
            .finally(() =>{
                this.setState({waiting: false})
            })
    }

    handleAdd(todo) {
        if (!todo.description) return
        this.setState({waiting: true})
        fetch('/todo', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(todo)
        })
            .then(response => {
                this.setState({waiting: true})
                if (response.status === 200) {
                    return response.json()
                }
            })
            .then(todos => {
                this.setState({todos})
            })
            .finally(() =>{
                this.setState({waiting: false})
            })
    }

    render() {
        const renderInput = () => {
            const {waiting} = this.state
            if (!waiting) {
                return (
                    <Todo handleAdd={this.handleAdd}/>
                )
            }
            return (<div>Waiting...</div>)
        }

        return (
            <Fragment>
                <ul className="Todos">
                    {this.state.todos != null ? (
                        this.state.todos.map(x => (<li>
                        {x.description}
                        </li>))) : null
                    }
                </ul>
                {renderInput()}
            </Fragment>
        )
    }
}
```

web/Todos.css

```css
.Todos {
    list-style-type: none;
}

.Todos li {
    padding: 16px;
    border-width: 0 0 1px 0;
    border-color: #eee;
    border-style: solid;
}
```

接下来我们还要修改`App.js`，让他加载我们的Todos组件：

web/App.js

```javascript
import React, { Component } from 'react'
import {Todos} from './Todos'
import logo from './logo.svg';
import './App.css';

export default class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          Todo App
        </header>

        <Todos/>
      </div>
    )
  }
}
```

这时候的样式比较奇怪（因为还是原来React欢迎页的样式）；

修改`App.css`：

web/App.css

```css
.App {
  text-align: center;
}

.App-logo {
  height: 40vmin;
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  .App-logo {
    animation: App-logo-spin infinite 20s linear;
  }
}

.App-header {
  background-color: #282c34;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
  padding: 16px;
}


.App-link {
  color: #61dafb;
}

@keyframes App-logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

最后，使用`yarn start`启动；

效果如下：

![demo1.png](https://cdn.jsdelivr.net/gh/jasonkayzk/go-spa-demo@main/image/demo1.png)

<font color="#f00">**尝试添加几个Todo项，会发现此时是无法添加的，因为我们的App需要和后端进行交互！**</font>

至此，我们的React SPA应用开发完毕！

下面进行后台Go项目；

<br/>

### **创建Go项目**

在根目录下使用`go mod`命令创建项目：

```bash
go mod init github.com/jasonkayzk/go-spa-demo
```

随后创建main.go

main.go

```go
package main

import (
	"fmt"
	"log"
	"net/http"

	_ "github.com/jasonkayzk/go-spa-demo/statik"
	"github.com/labstack/echo"
	"github.com/rakyll/statik/fs"
)

var e = echo.New()

// Todo is a representation of a todo object for JSON
type Todo struct {
	Description string `json:"description"`
}

// Validate that he object is sufficient
func (t *Todo) Validate() error {
	if t.Description == "" {
		return fmt.Errorf("Item is missing it's description")
	}
	return nil
}

// ErrorJSON returns an error text in json
type ErrorJSON struct {
	Message string `json:"message"`
}

type todoController struct {
	get  func(c echo.Context) error
	post func(c echo.Context) error
}

func newTodoController() *todoController {
	todos := []*Todo{
		&Todo{
			Description: "Default todo",
		},
	}

	return &todoController{
		get: func(c echo.Context) error {
			e.Logger.Printf("Handle get")
			return c.JSON(http.StatusOK, todos)
		},
		post: func(c echo.Context) error {
			e.Logger.Printf("Handle post")
			t := &Todo{}
			if err := c.Bind(t); err != nil {
				e.Logger.Printf("Could not parse request")
				return c.JSON(http.StatusBadRequest, err)
			}

			if err := t.Validate(); err != nil {
				e.Logger.Printf("Validation failed")
				return c.JSON(http.StatusBadRequest, ErrorJSON{Message: err.Error()})
			}

			todos = append(todos, t)

			return c.JSON(http.StatusOK, todos)
		},
	}
}

func main() {
	addr := ":8080"

	statikFS, err := fs.New()
	if err != nil {
		log.Fatal(err)
	}

	staticHandler := http.FileServer(statikFS)
	tc := newTodoController()

	e.GET("/*", echo.WrapHandler(http.StripPrefix("/", staticHandler)))

	e.GET("/todo", tc.get)
	e.POST("/todo", tc.post)

	e.Logger.Fatal(e.Start(addr))
}

```

这里有必要解释一下代码；

>   首先，go项目使用[labstack/echo](https://github.com/labstack/echo)，作为服务器后端的web框架；
>
>   >   因为这个库是一个高性能，并且极简的web框架：
>   >
>   >   **High performance, minimalist Go web framework**
>
>   其次，代码引入了[rakyll/statik](https://github.com/rakyll/statik)依赖；
>
>   <font color="#f00">**并且`_ "github.com/jasonkayzk/go-spa-demo/statik"`这个包，即statik目录目前是不存在的，需要后期通过statik命令生成！**</font>

首先通过`echo.New()`创建了一个echo Web服务器；

随后定义了一个Todo类，用于存放React中的单个Todo条目；并给Todo类添加了一个Validate方法，用于检测内容是否为空；

随后创建了todoController类，包括了get和post两个方法；

在newTodoController类中，完成了创建一个todoController类，并创建get和post两个函数的逻辑；

-   get函数：返回todos的json列表；
-   post函数：实现添加一个todo条目的逻辑；

>   <font color="#f00">**由于例子比较简单，所以每次get或者post都会返回整个todo list的内容；**</font>
>
>   <font color="#f00">**但是这样效率是比较低的，感兴趣的同学可以尝试优化；**</font>

最后在main函数中：

首先创建了statikFS（即通过statik编译后的二进制文件系统）；

随后使用`http.FileServer`将statikFS转换为一个静态文件目录的handler（前端页面）；

随后，初始化了controller，并使用echo声明了：

-   `/*`：根目录为前端静态页面入口；
-   `/todo`：前端get和post接口路由；

最后，启动web服务器；

至此整个go项目后台编写完毕；

接下来编译整个项目！

<br/>

### **使用statik编译二进制并编译项目**

#### **statik编译二进制概述**

[rakyll/statik](https://github.com/rakyll/statik)官方仓库地址如下：

-   https://github.com/rakyll/statik

使用前可能需要安装：

>   <font color="#f00">**clone源码，go build，并把编译出的statik二进制加入系统变量Path即可！**</font>

statik的使用方式也很简单：

```bash
statik -src=/path/to/your/project/public
```

使用`-src`直接指定静态文件所在目录即可；

>   **当然，也可以使用`-include=*.jpg,*.txt,*.html,*.css,*.js`指定需要编译的文件类型；**
>
>   更多使用方式可以查看官方文档；

>   **例如：在项目的根目录下编译：**
>
>   ```bash
>   statik.exe -src=./web/build
>   ```
>   **会在根目录下生成`statik`目录以及`statik/statik.go`文件；**
>
>   **文件中的data即编译后的二进制数据；**

<br/>

#### **编译整个项目**

在编译时，首先我们应该先编译前端项目，并生成静态文件；

随后，使用statik编译前端的静态项目；

最后，再编译整个go项目，生成二进制文件；

即命令如下：

```bash
# 编译前端
cd web && yarn && yarn build && cd ..
# 编译静态文件
statik -f -src=./web/build # use `-f` to override statik build
# 编译go项目
go build -o app main.go
```

为了方便起见，我们可以编写一个Makefile文件，这样就不需要每次都输入这么多命令了；

Makefile

```makefile
all:
	cd web && yarn && yarn build && cd ..
	statik -f -src=./web/build # use `-f` to override statik build
	go build -o app main.go

.ONESHELL:
statik:
	cd web && yarn && yarn build && cd ..
	statik -src=./web/build

dev:
	watcher -startcmd -cmd="go run main.go"

clean:
	rm app

setup:
	go get github.com/rakyll/statik
	go get github.com/canthefason/go-watcher
	go get github.com/mitchellh/gox


cross-platform:
	gox -output="build/{{.Dir}}_{{.OS}}_{{.Arch}}"


.PHONY: all clean statik dev cross-platform
```

>   <font color="#f00">**在Windows下使用make可能需要安装mingw等GNU套件；**</font>

最后，让我们试一下效果：

```bash
D:\workspace\go-spa-demo>make
cd web && yarn && yarn build && cd ..
statik -f -src=./web/build # use `-f` to override statik build
go build -o app main.go
yarn install v1.22.5
[1/4] Resolving packages...
success Already up-to-date.
Done in 0.46s.
yarn run v1.22.5
$ react-scripts build
Creating an optimized production build...
Compiled with warnings.

src\App.js
  Line 3:8:  'logo' is defined but never used  no-unused-vars

Search for the keywords to learn more about each warning.
To ignore, add // eslint-disable-next-line to the line before.

File sizes after gzip:

  42.19 KB  build\static\js\2.55a8d793.chunk.js
  1.57 KB   build\static\js\3.01417940.chunk.js
  1.17 KB   build\static\js\runtime-main.08b54c47.js
  1.04 KB   build\static\js\main.d5c45919.chunk.js
  624 B     build\static\css\main.668855c6.chunk.css

The project was built assuming it is hosted at /.
You can control this with the homepage field in your package.json.

The build folder is ready to be deployed.
You may serve it with a static server:

  yarn global add serve
  serve -s build

Find out more about deployment here:

  https://cra.link/deployment

Done in 4.67s.
```

编译成功，并且项目根目录下生成`app`二进制文件！

<br/>

### **测试项目**

运行编译生成的二进制文件；

>   <font color="#f00">**注：如果是在windows环境下，可能需要修改文件名为`app.exe`**</font>

打开后端服务器：

```powershell
D:\workspace\go-spa-demo>.\app.exe

   ____    __
  / __/___/ /  ___
 / _// __/ _ \/ _ \
/___/\__/_//_/\___/ v3.3.10-dev
High performance, minimalist Go web framework
https://echo.labstack.com
____________________________________O/_______
                                    O\
⇨ http server started on [::]:8080
```

访问`localhost:8080`，结果如下：

![demo1.png](https://cdn.jsdelivr.net/gh/jasonkayzk/go-spa-demo@main/image/demo1.png)

添加多个Todo项，结果：

![demo2.png](https://cdn.jsdelivr.net/gh/jasonkayzk/go-spa-demo@main/image/demo2.png)

同时后端输出日志：

```json
{"time":"2021-03-28T21:26:30.6609505+08:00","level":"-","prefix":"echo","file":"main.go","line":"53","messa
ge":"Handle get"}
{"time":"2021-03-28T21:27:49.7780022+08:00","level":"-","prefix":"echo","file":"main.go","line":"57","messa
ge":"Handle post"}
{"time":"2021-03-28T21:27:52.6052245+08:00","level":"-","prefix":"echo","file":"main.go","line":"57","messa
ge":"Handle post"}
{"time":"2021-03-28T21:27:54.2510517+08:00","level":"-","prefix":"echo","file":"main.go","line":"57","messa
ge":"Handle post"}
```

成功！

<br/>

## **附录**

源代码：

-   https://github.com/JasonkayZK/go-spa-demo

项目参考：

-   https://github.com/divanvisagie/go-spa-example

<br/>