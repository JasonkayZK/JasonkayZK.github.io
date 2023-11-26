---
title: 一个Go实现的终端PPT展示库：slides
toc: true
cover: 'https://img.paulzzh.com/touhou/random?44'
date: 2021-06-27 18:47:00
categories: Golang
tags: [Golang, 技术杂谈]
description: slides是一个可以在终端将Markdown转换为PPT的库，你甚至可以直接在终端展示PPT的同时执行PPT中的代码片段！
---

slides是一个可以在终端将Markdown转换为PPT的库，你甚至可以直接在终端展示PPT的同时执行PPT中的代码片段！

Github地址：

-   https://github.com/maaslalani/slides

<br/>

<!--more-->

## **一个Go实现的终端PPT展示库：slides**

### **安装**

本质上slides就是一个二进制工具，直接下载官方Release的二进制，放在PATH下即可；

当然也可以自己Clone源代码，然后自己编译并加入PATH中；

>   <font color="#f00">**注：由于项目使用到了Golang 1.16的特性：`embed`，所以自行编译需要Go的版本至少为1.16！**</font>

<br/>

### **基本使用**

#### **创建PPT(Markdown)文件**

任意一个Markdown文件都可以被作为一个`PPT`；

##### **① 分页**

**PPT各页之间通过`---`来划分；**

如下面的的文件会被划分为三页：

pages.md

```markdown
# First Page
first page

---

# Second Page
second page

---

# Third Page
third page
```

<br/>

##### **② 处理PPT文件**

只需将Markdown格式的文件作为`slides`程序的参数即可展示PPT，如：

```bash
$ slides pages.md
```

当然你也可以使用管道将一个输入流传递给slides，如：

```bash
$ curl http://example.com/slides.md | slides
```

>   <font color="#f00">**注：当你向`slides`命令传递一个Markdown文件时，他会跟踪并实时渲染这个文件的变化！**</font>

<br/>

##### **③ PPT翻页**

下一页：

-   space
-   right
-   down
-   enter
-   n
-   k
-   l

上一页：

-   left
-   up
-   p
-   h
-   j

<br/>

##### **④ 执行代码块**

可以使用`ctrl+e`来执行目前所展示的这段PPT中的代码段；

例如，下面是官方提供的一个例子：

```markdown
# Code blocks

Slides allows you to execute code blocks directly inside your slides!

Just press `ctrl+e` and the result of the code block will be displayed as virtual
text in your slides.

Currently supported languages:
* `bash`
* `go`
* `ruby`
* `python`
* `elixir`

---

### Bash

​```bash
ls
​```

---

### Go

​```go
package main

import "fmt"

func main() {
  fmt.Println("Hello, world!")
}
​```

---

### Python

​```python
print("Hello, world!")
​```
```

下面是一些执行后结果：

```
                 
   ▒▒▒▒ Bash     
                 
     ls          
                 
 ascii_slides.md 
 code_blocks.md  
 preprocess.md   
 slides.md       
 temp.md  
```

Go的结果：

```go
                                    
   ▒▒▒▒ Go                          
                                    
     package main                   
                                    
     import "fmt"                   
                                    
     func main() {                  
       fmt.Println("Hello, world!") 
     }                              
                                    
 Hello, world!                      
```

>   <font color="#f00">**当然，这段代码的执行还是依赖于你本机中的环境！**</font>
>
>   <font color="#f00">**如果你本机并没有Python，它是不可能执行的！**</font>

个人比较推荐使用一些脚本语言进行展示，但是比较遗憾的是，目前还不支持Node.js；

博主也是提出了一个Issue：

-   [feature：Code execution with Node.](https://github.com/maaslalani/slides/issues/57)

<br/>

##### **⑤ 切换主题**

主题的切换可以非常的简单，只需要在Markdown文件的顶部声明你的主题的样式即可：

```markdown
---
theme: ./path/to/theme.json
---
```

当然，官方也是已经提供了一个颜值很高的主题了：

-   https://github.com/maaslalani/slides/tree/main/styles/theme.json

<br/>

### **总结**

除了可以直接执行代码以外，slides还有其他很多比较有趣的功能，比如：表格展示、流程图等等；

大家不妨可以去体验一下！

<br/>

## **附录**

Github地址：

-   https://github.com/maaslalani/slides

<br/>