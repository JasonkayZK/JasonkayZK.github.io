---
title: Dockerfile学习
toc: true
date: 2019-10-16 19:30:51
categories: Docker
tags: Docker
cover: https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=1543062383,125194319&fm=26&gp=0.jpg
description: 最近一直在使用Docker部署项目, 但是还没有很系统的学习dockerfile的相关知识, 本篇主要总结的关于dockerfile的制作, 使用等;
---



最近一直在使用Docker部署项目, 但是还没有很系统的学习Dockerfile的相关知识, 本篇主要总结的关于Dockerfile的制作, 使用等;

阅读本文你将学会:

-   为什么使用Dockerfile? 使用Dockerfile的好处?
-   Dockerfile中的指令: FROM, RUN, COPY, ADD, WORKDIR, CMD, ENTRYPOINT, ENV, EXPOSE.
-   Dockerfile中的注意事项
-   Dockerfile中的优化
-   Dockerfile应用场景举例
-   ......

<br/>

<!--more-->

## Dockerfile学习

### 零. 前言

#### 1. 什么是Dockerfile?

虽然我们可以通过`docker  commit`命令来手动创建镜像，但是<font color="#0000ff">通过Dockerfile文件，可以帮助我们自动创建镜像，并且能够自定义创建过程。</font>

<font color="#ff0000">本质上，Dockerfile就是由一系列命令和参数构成的脚本，这些命令应用于基础镜像并最终创建一个新的镜像。它简化了从头到尾的构建流程并极大的简化了部署工作。</font>

<br/>

#### 2. 为什么使用Dockerfile?

使用dockerfile构建镜像有以下好处：

-   <font color="#00ff00">像编程一样构建镜像，支持分层构建以及缓存；</font>
-   <font color="#00ff00">可以快速而精确地重新创建镜像以便于维护和升级；</font>
-   <font color="#00ff00">便于持续集成；</font>
-   <font color="#00ff00">可以在任何地方快速构建镜像</font>



<br/>

---------

~~----------------------------华丽的分割线---------------------------~~

---------------

<br/>



### 一. Dockerfile指令

<font color="#0000ff">Dockerfile 指令为 Docker 引擎提供了创建容器映像所需的步骤, 这些指令按顺序逐一执行。</font>

以下是有关一些基本 Dockerfile 指令的详细信息。

#### 1. FROM

<font color="#ff0000">FROM 指令用于设置在新映像创建过程期间将使用的容器映像。</font>

>   格式:  `FROM image`

示例: 

```dockerfile
FROM nginx
FROM microsoft/dotnet:2.1-aspnetcore-runtime
```



<br/>

#### 2. RUN

<font color="#ff0000">RUN 指令指定将要运行并捕获到新容器映像中的命令。 这些命令包括安装软件、创建文件和目录，以及创建环境配置等。</font>

>   格式:  `RUN ["", "", ""]`或`RUN cmd1 && cmd2 && ...`

示例:

```dockerfile
RUN apt-get update
RUN mkdir -p /usr/src/redis
RUN apt-get update && apt-get install -y libgdiplus
RUN ["apt-get","install","-y","nginx"]
```

>   **注意:** <font color="#ff0000">每一个指令都会创建一层，并构成新的镜像。</font>

当运行多个指令时，会产生一些非常臃肿、非常多层的镜像，不仅仅增加了构建部署的时间，也很容易出错。因此，<font color="#ff0000">在很多情况下，我们可以合并指令并运行! </font>

例如：`RUN apt-get update && apt-get install -y  libgdiplus`

<font color="#0000ff">在命令过多时，一定要注意格式，比如换行、缩进、注释等，会让维护、排障更为容易，这是一个比较好的习惯。</font><font color="#ff0000">使用换行符时，可能会遇到一些问题</font>，具体可以参阅后文的转义字符。



<br/>

#### 3. COPY

<font color="#ff0000">COPY 指令将文件和目录复制到容器的文件系统。文件和目录需位于相对于 Dockerfile 的路径中。</font>

>   格式: `COPY <source> <destination>`或`COPY ["", ""]` 
>
>   <font color="#ff0000">如果源或目标包含空格，请将路径括在方括号和双引号中</font>

示例:

```dockerfile
COPY . .
COPY nginx.conf /etc/nginx/nginx.conf
COPY . /usr/share/nginx/html
COPY hom* /mydir/
```



<br/>

#### 4. ADD

<font color="#ff0000">ADD 指令与 COPY 指令非常类似，但它包含更多功能。除了将文件从主机复制到容器映像，ADD 指令还可以使用 URL 规范从远程位置复制文件</font>

>   格式: `ADD<source> <destination>`

示例:

```dockerfile
# 此示例会将 Python for Windows下载到容器映像的 c:\temp 目录
ADD https://www.python.org/ftp/python/3.5.1/python-3.5.1.exe /temp/python-3.5.1.exe
```



<br/>

#### 5. WORKDIR

<font color="#ff0000">WORKDIR 指令用于为其他 Dockerfile 指令（如 RUN、CMD）设置一个工作目录，并且还设置用于运行容器映像实例的工作目录。</font>

>   格式: `WORKDIR <dir>`

示例：

```dockerfile
WORKDIR /app
```



<br/>

#### 6. CMD

<font color="#ff0000">CMD指令用于设置部署容器映像的实例时要运行的默认命令。例如，如果该容器将承载 NGINX Web 服务器，则 CMD 可能包括用于启动Web服务器的指令，如 nginx.exe。 </font>

<font color="#ff0000">如果 Dockerfile 中指定了多个 CMD 指令，只会计算最后一个指令。</font>

>   格式: `CMD <executable> <param1> <param2> ...` 或`CMD ["<executable>", "<param1>", "<param2>", ...]`

示例：

```dockerfile
CMD ["c:\\Apache24\\bin\\httpd.exe", "-w"]
CMD c:\\Apache24\\bin\\httpd.exe -w
```



<br/>

#### 7. ENTRYPOINT

<font color="#ff0000">配置容器启动后执行的命令，并且不可被 docker run 提供的参数覆盖。</font>

<font color="#ff0000">每个 Dockerfile 中只能有一个 ENTRYPOINT，当指定多个时，只有最后一个起效</font>

>   格式: `ENTRYPOINT ["<cmd>", "<param1>", "<param2>", ...]`

示例:

```dockerfile
ENTRYPOINT ["dotnet", "Magicodes.Admin.Web.Host.dll"]
```



<br/>

#### 8. ENV

<font color="#ff0000">ENV命令用于设置环境变量。这些变量以”key=value”的形式存在，并可以在容器内被脚本或者程序调用。</font>

<font color="#0000ff">这个机制给在容器中运行应用带来了极大的便利。</font>

>   格式: `ENV key=value`

示例:

```dockerfile
ENV VERSION=1.0 DEBUG=on \
NAME="Magicodes"
```



<br/>

#### 9. EXPOSE

<font color="#ff0000">EXPOSE用来指定端口，使容器内的应用可以通过端口和外界交互</font>

>   格式: `EXPOSE <port>`

示例：

```dockerfile
EXPOSE 80
```



#### 总结

说了这么多，我们可以用下图来一言以蔽之：

![dockerfile_cmd.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/dockerfile_cmd.png)



<br/>

---------

~~----------------------------华丽的分割线---------------------------~~

---------------

<br/>



### 二. Dokcerfile中的注意事项

<font color="#0000ff">在许多情况下，Dockerfile 指令需要跨多个行, 这可通过转义字符完成。</font> 

<font color="#ff0000">默认 Dockerfile 转义字符是反斜杠 `\`.  由于反斜杠在 Windows 中也是一个文件路径分隔符，这可能导致出现问题!</font>

以下示例显示使用默认转义字符跨多个行的单个 RUN 指令:

```dockerfile
FROM microsoft/windowsservercore

RUN powershell.exe -Command \
$ErrorActionPreference = 'Stop'; \
wget https://www.python.org/ftp/python/3.5.1/python-3.5.1.exe -OutFile c:\python-3.5.1.exe ; \
Start-Process c:\python-3.5.1.exe -ArgumentList '/quiet InstallAllUsers=1 PrependPath=1' -Wait ; \
Remove-Item c:\python-3.5.1.exe -Force
```

<br/>

<font color="#ff0000">要修改转义字符，必须在 Dockerfile 最开始的行上放置一个转义分析程序指令</font>

如以下示例所示：

```dockerfile
# escape=`

FROM microsoft/windowsservercore

RUN powershell.exe -Command `
$ErrorActionPreference = 'Stop'; `
wget https://www.python.org/ftp/python/3.5.1/python-3.5.1.exe -OutFile c:\python-3.5.1.exe ; `
Start-Process c:\python-3.5.1.exe -ArgumentList '/quiet InstallAllUsers=1 PrependPath=1' -Wait ; `
Remove-Item c:\python-3.5.1.exe -Force
```

>   <font color="#ff0000">注意，只有两个值可用作转义字符：\ 和` </font>



<br/>

---------

~~----------------------------华丽的分割线---------------------------~~

---------------

<br/>



### 三. Dockerfile中的优化

这里只进行简单讲解，后续结合实际案例再进行细说. 但是有几点值得注意的是：

-   <font color="#00ff00">不能忽视dockerfile的优化，通常情况下，我们可以忽略那些细小的优化，但是我们需要知道优化的原理，为什么要优化</font>
-   <font color="#00ff00">不能为了优化而优化。镜像的构建过程视业务情况情况不同，指令就有多到少的区别，在很多情况下，我们先要以满足业务目标为准，而不是镜像层数。如果需要减少镜像的层数，我们一定要选择合适的基础镜像，或者创建符合我们需要的基础镜像</font>

<br/>

下面是一些优化的准则:

#### <font color="#ff0000">1. 选择合适的基础镜像</font>

这点相对最为重要。为什么这么说，我们结合现实社会也可以看到，在大部分情况下，一个人一生的成就更多的是看出身。很多情况下，基因和出身决定了你的高度和终点，这点拿到技术层面来说，也是有很大道理的，因此我们需要选择合适的父母——一个合适的镜像。

<font color="#0000ff">一个合适的基础镜像是指能满足运行应用所需要的最小的镜像，理论上是能用小的就不要用大的，能用轻量的就不要用重量级的，能用性能好的就不要用性能差的。这里有时候还需要考虑那些能够减少我们构建层数的基础镜像。</font>

<br/>

#### <font color="#ff0000">2. 优化指令顺序</font>

<font color="#ff0000">Docker会缓存Dockerfile中尚未更改的所有步骤，但是，如果更改任何指令，将重做其后的所有步骤!</font>

也就是指令3有变动，那么4、5、6就会重做。

<font color="#0000ff">因此，我们需要将最不可能产生更改的指令放在前面，按照这个顺序来编写dockerfile指令。这样，在构建过程中，就可以节省很多时间。比如，我们可以把WORKDIR、ENV等命令放前面，COPY、ADD放后面。</font>

<br/>

#### <font color="#ff0000">3. 合并指令</font>

前面其实我们提到过这点，甚至还特地讲到了转义字符，其实主要是为此服务。

<font color="#ff0000">前面我们说到了，每一个指令都会创建一层，并构成新的镜像。当运行多个指令时，会产生一些非常臃肿、非常多层的镜像，不仅仅增加了构建部署的时间，也很容易出错。</font>

因此，在很多情况下，我们<font color="#ff0000">可以合并指令并运行</font>，例如：

```dockerfile
RUN apt-get update && apt-get install -y  libgdiplus
```

在命令过多时，一定要注意格式，比如换行、缩进、注释等，会让维护、排障更为容易，这是一个比较好的习惯。

<br/>

#### <font color="#ff0000">4. 删除多余文件和清理没用的中间结果</font>

这点很易于理解，通常来讲，体积更小，部署更快！因此在构建过程中，我们需要清理那些最终不需要的代码或文件。比如说，临时文件、源代码、缓存等等。



#### <font color="#ff0000">5. 使用 .dockerignore</font>

<font color="#ff0000">`.dockerignore`文件用于忽略那些镜像构建时非必须的文件，这些文件可以是开发文档、日志、其他无用的文件</font>

例如:

```
.dockerignore
.env
.git
.gitignore
.vs
.vscode
docker-compose.yml
docker-compose.*.yml
*/bin
*/obj

```



<br/>

---------

~~----------------------------华丽的分割线---------------------------~~

---------------

<br/>



### 四. 一个简单的Dockerfile实例

这个简单的node.js例子仅仅用于示范: '编写 -> 编译 -> 运行' Dockerfile的整个流程

#### 1. 编写应用

首先如下编辑app.js内容:

```javascript
const http = require('http');
const os = require('os');

console.log("Server starting...");

var handler = function(request, response) {
    console.log("Receive request from " + request.connection.remoteAddress);
    response.writeHead(200);
    response.end("You've hit " + os.hostname() + "\n");
};

var www = http.createServer(handler);
www.listen(8080);
```

<br/>

#### 2. 编写Dockerfile

由于要运行node.js, 所以需要node镜像(使用ADD添加), 同时还需要源文件. 所以Dockerfile如下所示:

```dockerfile
FROM node:7
ADD app.js /app.js
ENTRYPOINT [ "node", "app.js" ]
```

首先拉去一个镜像, 然后添加项目文件到根目录下, 然后通过`node app.js`运行代码.

<br/>

#### 3. 构建Dockerfile

使用`docker build`命令构建Dockerfile文件, 生成image:

```bash
docker build -t test app/
```

>   注: <font color="#ff0000">此例中Dockerfile在app目录下!</font>
>
>   <font color="#ff0000">其中`-t`参数指定了标签名, 推荐使用`DockerHubId/imageName:version`的形式, 此时构建的镜像与DockerHub的Id一致可直接推送!</font>

<br/>

构建完成即可看到镜像:

```bash
zk@jasonkay:~$ docker images
REPOSITORY                                TAG                 IMAGE ID            CREATED              SIZE
test                                      latest              3bc16cb581f9        About a minute ago   660MB
......
```

<br/>

#### 4. 运行镜像

使用`docker run`命令即可通过image创建container并自动执行`node app.js`启动应用:

```bash
zk@jasonkay:~$ docker run test -name node-app -p 8080:8080
Server starting...
```

然后通过浏览器访问container内部的ip:port, 如下图:

![container_visit.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/container_visit.png)

<br/>

同时终端收到返回消息:

```bash
zk@jasonkay:~$ docker run test -name node-app -p 8080:8080
Server starting...
Receive request from ::ffff:172.17.0.1
Receive request from ::ffff:172.17.0.1

```

以上从应用构建到最后应用部署完整再现了如何使用Dockerfile完成一个可移植应用的开发!



<br/>

---------

~~----------------------------华丽的分割线---------------------------~~

---------------

<br/>



### 附录

参考文章:

-   [Docker最全教程——从理论到实战(四)](https://mp.weixin.qq.com/s?__biz=MzU0Mzk1OTU2Mg==&mid=2247483900&idx=1&sn=584962b8b6f24ca4636a32a441ff2ec5&chksm=fb023e99cc75b78f6f76877cc9be169238f2e499012293dbd2d04ac95c2951a74b3e3a46b4a0&token=2002719666&lang=zh_CN&scene=21#wechat_redirect)





