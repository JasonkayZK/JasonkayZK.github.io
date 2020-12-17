---
title: 软件安装
toc: true
date: 2019-09-04 20:28:29
cover: https://acg.yanwz.cn/api.php?21
layout: about
---

*Get busy living or get busy dying*  ————电影肖申克的救赎。

<br/>

## 软件安装

**创立于: 2020年12月5日(迁移自《记一次重装软件》)**

**页面成立原因：总结下各个平台（主要是Linux下）软件的安装方法，尽量跟着我的步骤走一次就成功**

**其他：Linux软件安装综述**

在Linux中, 安装软件有很多很多种方法, 如: 

1.  通过apt/yum安装: 安装极其方便, 不需要你考虑依赖, 不用手动编译; 坏处是, 安装的文件分散在各个地方, 配置起来可能很是麻烦! **(有时需要借助sudo find where -name which 命令查找!)**
2.  通过源码编译安装: 需要自己下载, 解压缩, 编译, 配置环境; 好处是文件都在你指定的文件夹, 环境也是你自己配的, 修改设置就很容易!

对于上面列举的两种情况, 可以看出还是有一点点小的区别的！

 **我个人建议**:

-   <font color="#FF0000">对于不需要配置的软件, 尽量用apt等软件管理进行安装, 比较方便；</font>
-   <font color="#FF0000">对于Redis, RabbitMQ等, 需要更改配置的, 使用源码安装, 可以方便修改配置信息!</font>

下面按照上面列出的顺序写一下这些软件的安装方法，对于一些坑比较多的软件，将会单独在一篇博客里面介绍如何安装，如何配置，如何避开那些坑！

<br/>

## Linux软件列表

| **软件名称**                                        | **软件版本**              | **添加时间** | **备注**                                                     |
| :-------------------------------------------------- | :------------------------ | :----------: | ------------------------------------------------------------ |
| [Typora](#Typora)                                   | Any                       |  2019-09-04  |                                                              |
| [IDEA](#IDEA)                                       | Any                       |  2019-09-04  |                                                              |
| [Firefox](#Firefox)                                 | Any                       |  2019-09-04  | **推荐使用Chrome浏览器；**                                   |
| [Git](#Git)                                         | Any                       |  2019-09-04  | 包括安装、配置、生成SSH-Key和验证                            |
| [SSH](#SSH)                                         | Any                       |  2019-09-04  |                                                              |
| [Python3.6](#Python3.6)                             | 3.6.x                     |  2019-09-04  |                                                              |
| [Tomcat](#Tomcat)                                   | Any                       |  2019-09-04  | 下载、解压缩、配置环境、测试                                 |
| [XMind](#XMind)                                     | XMind8                    |  2019-09-04  | 推荐在JDK8环境下安装；                                       |
| [Zookeeper](#Zookeeper)                             | 3.4.14                    |  2019-09-04  |                                                              |
| [Postman](#Postman)                                 | Any                       |  2019-09-04  |                                                              |
| [Docker](#Docker)                                   | Docker 18.09              |  2019-09-04  |                                                              |
| [Java11](#Java11)                                   | 11.0.x                    |  2019-09-04  | 不推荐安装JDK11，虽然已经出到JDK15了，但是很多项目仍然使用JDK8，比如Andriod； |
| [7Zip](#7Zip)                                       | Any                       |  2019-09-04  |                                                              |
| [Nodejs与npm](#Nodejs与npm)                         | Any                       |  2019-09-04  | 下载、解压缩、配置环境变量、生成软连接、配置cnpm加速；       |
| [Redis](#Redis)                                     | 5.0.5<br />(编译源码安装) |  2019-09-04  | 下载、解压缩、编译、配置环境变量、安装工具utils、验证；      |
| [Mysql](#Mysql)                                     | 8.0.x                     |  2019-09-04  | Apt安装、配置用户&密码、权限、开机启动等；                   |
| [Telnet](#Telnet)                                   | Any                       |  2019-09-04  |                                                              |
| [VSCode](#VSCode)                                   | Any                       |  2019-09-04  | 安装、插件推荐；                                             |
| ~~[Flash](#Flash)~~                                 | /                         |  2019-09-04  | 已过时，不推荐安装；                                         |
| [Arthas](#Arthas)                                   | Any                       |  2019-09-04  |                                                              |
| [Putty](#Putty)                                     | Any                       |  2019-09-04  |                                                              |
| [FileZilla](#FileZilla)                             | Any                       |  2019-09-04  |                                                              |
| [Maven](#Maven)                                     | Any                       |  2019-09-04  | 下载、解压缩、配置环境变量、配置阿里云镜像；                 |
| [Htop](#Htop)                                       | Any                       |  2019-09-04  |                                                              |
| [Sougo](#Sougo)                                     | Any                       |  2019-09-04  | 下载、安装Fcitx、验证；                                      |
| [Curl](#Curl)                                       | Any                       |  2019-09-04  |                                                              |
| [Pip3](#Pip3)                                       | Any                       |  2019-09-04  | 安装、配置、升级、更换源、降级安装；                         |
| [Okular](#Okular)                                   | Any                       |  2019-09-04  | 一个KDE出品的PDF阅读器；                                     |
| [netTools](#netTools)                               | Any                       |  2019-09-04  |                                                              |
| [Rpm](#Rpm)                                         | Any                       |  2019-09-04  |                                                              |
| [uGet](#uGet)                                       | Any                       |  2019-09-04  |                                                              |
| ~~[Redis-desktop-manager](#Redis-desktop-manager)~~ | Any                       |  2019-09-04  | Redis-Desktop-Manager已收费不推荐安装；<br />推荐：[AnotherRedisDesktopManager](https://github.com/qishibo/AnotherRedisDesktopManager) |
| [PythonModules](#PythonModules)                     | /                         |  2019-09-04  |                                                              |
| [NpmModules](#NpmModules)                           | /                         |  2019-09-04  | 安装cnpm、Vue-Cli、yarn等；                                  |
| [Gradle](#Gradle)                                   | 6.7.1                     |  2020-12-05  |                                                              |
|                                                     |                           |              |                                                              |


具体软件安装可见右上角TOC，快速访问；

<br/>

### Typora

​		一个Markdown阅读器, 先下载的这个也是因为, 就可以及时总结了.

​		有关Typora的详细安装见本博客另一篇文章: [Typora安装与配置](https://jasonkayzk.github.io/2019/09/04/Ubuntu下安装Typora/)



### IDEA

​		Java的一个神级IDE. 

​		有关Idea的详细安装与配置见本博客另一篇文章: [IDEA的安装与配置](https://jasonkayzk.github.io/2019/09/04/Ubuntu下安装IDEA/)



### Firefox

这个是Linux自带的开源浏览器.

顺便说一点, 我的是<font color="#FF0000">注册了Firefox账号</font>的, 所以我的所有插件, 书签,密码, 甚至访问记录在重新登录之后都是可以自动全部导入的, 和原来的浏览器一模一样! 将重装成本及耗时降到了零!

所以这里强烈建议各位: **注册一个浏览器账号进行数据同步**, 否则换台电脑你就只能面对空白的书签和插件发呆了.



### Git

#### 1): 安装

```bash
sudo apt update -y
sudo apt install git
```

#### 2): 验证

```bash
git --version
git version 2.15.1
```

即, 安装成功

#### 3): 配置

``` bash
git config --global user.name "zk"
git config --global user.email "271226192@qq.com"
```

验证配置:

```bash
~$ git config --list
user.name=linuxidc
user.email=root@linuxidc.net
```

则成功配置!

#### 4): Git生成SSH-key

通过命令:

```bash
ssh-keygen -t rsa -C "271226192@qq.com"
```

一路回车即可生成一个key, **当然邮箱填写你自己的!**

通常这个key会生成在你的~/.ssh/目录下:

```bash
cat ~/.ssh/rsa.pub
```

将显示的公钥复制到你的github或者其他代码仓库上面即可.



### SSH

Ubuntu 自带了ssh工具, 无需额外安装了!



### Python3.6

如果你安装的是Ubuntu 18.04 LTS 或者更高的版本, 则在安装好了之后, 会直接默认为Python3.6.8版本, 因为Python2.7 讲在不久的将来停止维护. 

如果你是低版本, 可以尝试使用apt/yum进行安装, 这里不多介绍.



### Tomcat

其实Apache开源的那些软件, 安装步骤都是一个尿性:

1.  下载压缩包
2.  解压缩
3.  赋权限或者修改拥有
4.  配置环境变量
5.  测试

#### 1): 下载压缩包

​		可以在Tomcat的官方网站下载[Tomcat官方网站](https://tomcat.apache.org/)

#### 2): 解压缩

```bash
sudo tar -zvxf apache-tomcat-x.x.x.tar.gz -C /opt/
```

​		这里还是解压缩到/opt/目录下

#### 3): 赋权限或者修改拥有

修改拥有

```bash
sudo chown -R user:user apache-tomcat-x.x.x
```

或者赋权限

```bash
sudo chmod 755 -R apache-tomcat-x.x.x
```

#### 4):配置环境变量

​		修改 ~/.bashrc (本用户环境变量), /etc/profile(全局环境变量)

加入:

```
export CATALINA_HOME=/opt/apache-tomcat-9.0.24
export PATH=$PATH:${CATALINA_HOME}/bin:${CATALINA_HOME}/lib
```

​		之后使用source ~/.bashrc 让配置立即生效

**注:**

这里有一个小坑, 就是: 

​		使用sudo source /etc/profile 会报错: sudo: source: command not found!

所以我们可以使用:

```bash
sudo bash
```

在新开的bash中, 以root身份使用sudo source /etc/profile



#### 5): 测试

``` bash
cd /opt/apache-tomcat-x.x.x/bin/
./startup.sh
```

即启动了tomcat, 之后打开浏览器, 默认为: http://localhost:8080/

若显示:

![](https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=1831964659,4279260439&fm=26&gp=0.jpg)

即为安装成功!



### XMind

​		Java编写的一个思维导图工具, 但是居然不支持Java 11!(新系统我使用的是Java 11)

​		安装过程其实比较简单:

方法1:

​		通过snap应用商店安装: 搜索, 点击安装即可.

方法2:

​		下载压缩包, 解压缩到/opt/目录下, 修改权限, 然后通过./setup安装

第二种安装方法需要注意的是:

​		<font color="#FF0000">由于XMind8不支持Java 11, 所以, 在执行./setup之后, 还会自动安装一个Java8 --headless, 并且会覆盖你原有的Java!</font>

​		所以最终我没有选择安装XMind.

​		安装参考: [Ubuntu18.04安装XMind8](https://www.cnblogs.com/thoughtful-actors/p/10232856.html)



### Zookeeper

​		Apache的又一个开源分布式框架, 安装和配置见我的另一篇博客:

​		[Zookeeper的安装与配置](https://jasonkayzk.github.io/2019/09/01/初入zookeeper/)



### Postman

一个网页调试工具, 测试Restful接口后端的数据.

直接通过snap商店安装即可；

>   有个小坑：
>
>   在安装过程中, 我不小心关闭了snap, 重新打开后提示:
>
>   **error: snap "Postman" has "install-snap" change in progress**
>
>   **其实就是软件之前安装了一次，只是没安装完就强行停止了**
>
>   **解决方案**
>
>   **运行如下命令**
>
>   ```bash
>   ~$ snap changes
>   ID  Status  Spawn                  Ready                  Summary
>   4    Error  yesterday at 21:20 CST  yesterday at 21:31 CST  Install "Postman" snap
>   5    Doing  yesterday at 22:36 CST  -                      Install "Postman" snap
>   ```
>
>   可以看到ID=5  Doing就是我之前安装失败的。
>
>   现在我们终止它
>
>   ```bash
>   ~$ sudo snap abort 5
>   ```
>
>   好了，可以重新安装了。



### Docker

操作系统是CentOS 7.6；

#### 1.查看系统内容

```bash
[root@localhost /]# uname -r
3.10.0-957.el7.x86_64
```

如果版本过低，sudo yum update 升级到最新；

#### 2.卸载旧版本(如果安装过旧版本的话)

```bash
$ sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
```

#### 3.配置阿里云Docker Yum源

（1）安装需要的软件包， yum-util 提供yum-config-manager功能，另外两个是devicemapper驱动依赖的：

```bash
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
```

（2）设置yum源

```bash
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

#### 4.查看Docker版本以及安装

命令: `yum list docker-ce`

```bash
yum list docker-ce

已加载插件：fastestmirror, langpacks
Loading mirror speeds from cached hostfile
 * base: mirrors.cn99.com
 * extras: mirrors.cn99.com
 * updates: mirrors.shu.edu.cn
可安装的软件包
docker-ce.x86_64           
```

安装Docker最新版本：

```bash
sudo yum install docker-ce
```

#### 5.启动Docker服务并加入开机启动

```bash
$ sudo systemctl start docker
$ sudo systemctl enable docker
```

#### 6.查看docker版本

```bash
[root@localhost /]# docker version
Client:
 Version:           18.09.0
 API version:       1.39
 Go version:        go1.10.4
 Git commit:        4d60db4
 Built:             Wed Nov  7 00:48:22 2018
 OS/Arch:           linux/amd64
 Experimental:      false

Server: Docker Engine - Community
 Engine:
  Version:          18.09.0
  API version:      1.39 (minimum version 1.12)
  Go version:       go1.10.4
  Git commit:       4d60db4
  Built:            Wed Nov  7 00:19:08 2018
  OS/Arch:          linux/amd64
  Experimental:     false
```

如图所示，我们的安装已经完成。

#### 7.卸载

查询安装过的包

`yum list installed | grep docker`

```bash
[root@localhost /]# yum list installed | grep docker
containerd.io.x86_64                    1.2.0-3.el7                    @docker-ce-stable
docker-ce.x86_64                        3:18.09.0-3.el7                @docker-ce-stable
docker-ce-cli.x86_64                    1:18.09.0-3.el7                @docker-ce-stable
```

删除安装的软件包

```bash
yum -y remove docker-ce.x86_64 
```

删除镜像/容器等

```bash
rm -rf /var/lib/docker
```



### Java11

​		由于Java 11是最新的LTS, 并且优化了大量和虚拟机有关的代码, 所以我就在这次重装之后, 直接上手了Java 11, 一步到位.

#### 1): 下载

​		在Oracle官网下载: [Java 11](https://www.oracle.com/technetwork/java/javase/downloads/jdk11-downloads-5066655.html)

#### 2): 解压缩

```bash
sudo tar -zxvf jdk-11uxxx-linux-x64.tar.gz -C /opt/
```

​		解压缩到/opt/目录下

#### 3): 修改配置信息

```bash
vim ~/.bashrc
```

添加:

```
export JAVA_HOME=/opt/jdk-11.0.4
export JRE_HOME=${JAVA_HOME}/jre
export CLASSPATH=.:${JAVA_HOME}/lib:${JRE_HOME}/lib
export PATH=$PATH:${JAVA_HOME}/bin:
```

修改/etc/profile, 添加同样的内容, 这里不再赘述.

```bash
source ~/.bashrc
```

#### 4): 测试

查看Java版本

```bash
zk@jasonkay:~$ java -version
java version "11.0.4" 2019-07-16 LTS
Java(TM) SE Runtime Environment 18.9 (build 11.0.4+10-LTS)
Java HotSpot(TM) 64-Bit Server VM 18.9 (build 11.0.4+10-LTS, mixed mode)
```

即Java 11安装成功!

<font color="#FF0000">需要注意的是: 对于非个人使用而言: Oracle的Java 从JDK8之后开始收费了!</font>



### 7Zip

​		7zip是一个支持多种压缩格式的压缩软件.

```bash
sudo apt-get install p7zip
```

​		使用apt安装即可!



### Nodejs与npm

#### 1): 下载

​		在nodejs的官网下载安装包: [nodejs官方网站](https://nodejs.org/en/)

#### 2):解压安装包

``` bash
sudo tar -zxvf node-vx.x.x-linux-x64.tar.gz -C /opt/
```

​		解压在/opt/目录下

#### 3): 配置环境变量:

因为 /opt/node/bin这个目录是不在环境变量中的；

如果要在任意目录访问的话，需要将node 所在的目录，添加PATH环境变量里面

``` bash
sudo vim /etc/profile  #全局环境变量配置文件
vim ~/.bashrc  #当前用户环境变量配置文件
#node
export NODE_HOME=/opt/node-vx.x.x-linux-x64
export PATH=$NODE_HOME/bin:$PATH

#npm
export NODE_PATH=/opt/node-vx.x.x-linux-x64/lib/node_modules

source  你配置的那个文件让他生效
```

#### 4): 生成软连接

​		通过软连接的形式将node和npm链接到系统默认的PATH目录下，以下仅介绍软链接方式；

分别执行:

``` bash
sudo ln -s /opt/node-vx.x.x-linux-x64/bin/node /usr/local/bin/node
sudo ln -s /opt/node-vx.x.x-linux-x64/bin/npm /usr/local/bin/npm
```

通过如此，就可以在任意目录下访问 node命令了，同时nodejs环境也部署完毕。

#### 5): 配置npm淘宝镜像cnpm

执行命令:

```bash
npm install -g cnpm --registry=https://registry.npm.taobao.org
```

生成软连接:

```bash
sudo ln -s /opt/node/bin/cnpm /usr/local/bin/cnpm
```



### Redis

由于之前的系统是通过apt直接安装的, 导致在修改配置文件时, 基本找不到配置文件, 所以这里采用了源码编译的方式进行安装.

当然, 官方网站也是有安装教程的, 但是还是不够详细;

#### 1): 下载

在Redis的官方网站下载源码压缩包: [Redis官网](https://redis.io/download)

或使用wget: 

```bash
wget http://download.redis.io/releases/redis-x.x.x.tar.gz
```

将-x.x.x换成你要安装的版本；

#### 2): 解压缩

通过命令, 解压缩到/opt/目录下:

```bash
sudo tar -xvzf redis-x.x.x.tar.gz -C /opt/
```

#### 3): 编译

```bash
cd /opt/redis-x.x.x
make
```

>   **注1：**
>
>   编译时如果系统很干净（指server版的什么都没装）可能有错，这时可以按照错误提示把没安装的安装了。可能缺少的有`jemalloc，lua, hiredis,  linenoise`；
>
>   进入解压后的目录 :
>
>   ```bash
>   cd redis-x.x.x
>   ```
>
>   找到并进入deps目录，用ls查看就可以知道有没有了. 如果没有就在这目录下使用命令 :
>
>   ```bash
>   make jemalloc
>   make lua
>   make hiredis
>   make linenoise 
>   ```
>
>   把这些依赖安装就可以了；
>
>   make成功之后就可以看到提示:
>
>   ```bash
>   LINK redis-check-aof
>   Hint: It’s a good idea to run ‘make test’ ;)
>   make[1]: Leaving directory ‘/opt/redis-x.x.x/src’
>   ```
>
>   从最后一行可以看出它提示可以去/opt/redis-x.x.x/src目录查看了，进去后会有很多东西。

>   **注2：GCC版本过低**
>
>   默认CentOS的GCC版本是很低的，可能会无法编译；
>
>   （安装6版本的redis，gcc版本一定要5.3以上，centos6.6默认安装4.4.7；centos7.5.1804默认安装4.8.5）
>
>   这里要升级gcc了：
>
>   ```bash
>   yum -y install centos-release-scl && yum -y install devtoolset-9-gcc devtoolset-9-gcc-c++ devtoolset-9-binutils && scl enable devtoolset-9
>   ```
>
>   使scl(softwar collections)包命令持久化：
>
>   ```bash
>   echo "source /opt/rh/devtoolset-9/enable" >> /etc/profile
>   source /etc/profile
>   ```
>
>   查看gcc版本：
>
>   ```bash
>   gcc -v
>   ```

修改编译后的文件夹:

```ba
sudo mv /opt/redis-x.x.x/src /opt/redis-x.x.x/bin
```

将src重命名为bin；

#### 4): 检查编译生成的文件

进入bin目录，里面有这几个可执行文件就行了:

-   redis-benchmark
-   redis-check-rdb
-   redis-sentinel
-   redis-check-aof
-   redis-cli
-   redis-server

#### 5): 配置环境变量

修改~/.bashrc 和 /etc/profile中的内容, 增加:

```bash
export REDIS_HOME=/opt/redis-5.0.5
export PATH=$PATH:${REDIS_HOME}/bin
```

再使source命令使其立即生效；

#### 6): 安装运行工具utils

由于之前编译的, 在运行时是默认启动, 即使用的是默认的配置文件, 并不是我们想要的；

1.  在编译的文件夹内除了src(后为bin)目录，还有一个utils目录，进入里面:

2.  运行:

    ```bash
    sudo ./install_server.sh
    ```

3.  会有提示， 最后显示如下:

    ```bash
    Port : 6379
    Config file : /etc/redis/6379.conf
    Log file : /var/log/redis_6379.log
    Data dir : /var/lib/redis/6379
    Executable : /opt/redis-x.x.x/bin/redis-server
    Cli Executable : /opt/redis-x.x.x/bin/redis-cli
    ```

    >   对于在云服务器安装redis，可能会出现报错：
    >
    >   ```bash
    >   This systems seems to use systemd.
    >   Please take a look at the provided example service unit files in this directory, and adapt and install them. Sorry!
    >   ```
    >
    >   这时，编辑脚本`install_server.sh`：
    >
    >   ```bash
    >   vi ./install_server.sh
    >   ```
    >
    >   注释掉下面几行即可：
    >
    >   ```bash
    >   #bail if this system is managed by systemd
    >   #_pid_1_exe="$(readlink -f /proc/1/exe)"
    >   #if [ "${_pid_1_exe##*/}" = systemd ]
    >   #then
    >   #       echo "This systems seems to use systemd."
    >   #       echo "Please take a look at the provided example service unit files in this directory, and adapt and install them. Sorry!"
    >   #       exit 1
    >   #fi
    >   ```

4.  前四个点回车确定就可以了，第五个的时候: 输入安装地址

    ```bash
    /opt/redis-x.x.x/bin/redis-server
    ```

5.  最后确定会提示如下:

    ```bash
    Copied /tmp/6379.conf => /etc/init.d/redis_6379
    Installing service…
    Success!
    Starting Redis server…
    Installation successful!
    ```

6.  从Copied /tmp/6379.conf => /etc/init.d/redis_6379这句话我们知道它把生成的文件拷贝到了这里。

7.  进去/etc/init.d, 查看发现有个redis_6379, 把名字改成redisd(d是后台服务的意思.)

8.  这服务的配置文件在/etc/redis下有个6379.conf，可以查看里面有端口，数据库数量等等。里面有一行:

    ```bash
    daemonize yes
    ```

    说明是后台服务了，并且进程获得的ID号:

    ```bash
    /var/run/redis_6379.pid
    ```

    默认数据库数量: databases 16；

    默认的目录: /var/lib/redis/6379；

9.  然后启动服务:

    ```bash
    service redisd start
    ```

10.  启动成功！

>   **注:**
>
>   若发现启动失败, 提示：
>
>   ```bash
>   Failed to start redisd.service: Unit redisd.service not found.
>   ```
>
>   输入`systemctl daemon-reload`，再输入`service redisd start`就可以了；

#### 7): 验证安装:

查看端口占用情况

```bash
ss -tanl
```


显示127.0.0.1:6379，说明启动成功了。

#### 8): 添加密码：

默认Redis是没有密码的，如果暴露在公网相当危险！

>   <font color="#f00">**另外Redis的查询速度是非常快的，外部用户一秒内可以尝试多大150K个密码；**</font>
>
>   <font color="#f00">**所以密码要尽量长；**</font>

在配置文件中有个参数：`requirepass`，这个就是配置redis访问密码的参数；

如：`requirepass test123`；

修改配置文件后需要重启：

```bash
service redisd restart
```

之后测试：

```bash
$ redis-cli -p 6379
> redis 127.0.0.1:6379> auth test123
> OK
```

成功！

#### 9): 远程连接配置

在默认情况下Redis是处于安全模式，仅能保证本地连接，如果想要远程连接需要修改配置：

**① 注释掉redis.window.conf文件中的bind属性设置**

将Redis配置中默认的`bind 127.0.0.1`注释：

```bash
$ vi /etc/redis/6379.conf
...
#bind 127.0.0.1
...
```

**② 把protected-mode属性设置no**

```bash
$ vi /etc/redis/6379.conf
...
protected-mode no
...
```

保存；

>   <font color="#f00">**此时如果Redis配置了密码，则无法使用`service redisd restart`重启，报错：**</font>
>
>   ```bash
>   $ service redisd restart
>   Stopping ...
>   (error) NOAUTH Authentication required.
>   Waiting for Redis to shutdown ...
>   Waiting for Redis to shutdown ...
>   ```
>
>   此时需要首先登录Redis，使用`shutdown`关闭Redis：
>
>   ```bash
>   $ redis-cli -p 6379
>   127.0.0.1:6379> auth <password>
>   OK
>   127.0.0.1:6379> shutdown # 关闭Redis
>   not connected> exit
>   ```
>
>   随后再使用`service redisd start`启动Redis！

重启后，即可远程登录！

<br/>

### Mysql

​		安装mysql的时候, 我是使用的apt安装的. 按道理并不推荐使用apt安装!

#### 1): 执行apt命令安装

执行命令:		

```bash
sudo apt install mysql-server
sudo apt install mysql-client
sudo apt install libmysqlclient-dev
```

安装完成

#### 2): 验证安装是否成功

``` bash
sudo netstat -tap | grep mysql
tcp6       0      0 [::]:mysql              [::]:*                  LISTEN      1416/mysqld 
```

出现下面的一行即安装成功.

#### 3): 检测mysql服务状态

```bash
~$ systemctl status mysql.service
● mysql.service - MySQL Community Server
   Loaded: loaded (/lib/systemd/system/mysql.service; enabled; vendor preset: en
   Active: active (running) since Wed 2019-09-04 16:25:24 CST; 17h ago
 Main PID: 1416 (mysqld)
    Tasks: 27 (limit: 4915)
   CGroup: /system.slice/mysql.service
           └─1416 /usr/sbin/mysqld --daemonize --pid-file=/run/mysqld/mysqld.pid

9月 04 16:25:21 jasonkay systemd[1]: Starting MySQL Community Server...
9月 04 16:25:24 jasonkay systemd[1]: Started MySQL Community Server.
```

即启动了配置;

#### 4): 配置远程访问

​		Mysql在默认情况下是仅允许本地访问的, 所以要进行配置:

1.  首先进入root用户:

**注: 出现ERROR 1698(28000): Access denied for user 'root'@'localhost' 错误解决: 修改密码**

​		这里需要注意的是: 因为我们使用apt安装的时候, 并没有配置root登录密码, 所以系统帮我们生成了一个登录密码, 具体在什么地方我忘记了, 去寻找这个字符串比较麻烦, 我们用下面的命令即可:

```bash
sudo mysql
```

​		这时不需要密码, 可以直接访问.

2.  修改root用户密码:

```sql
GRANT ALL PRIVILEGES ON *.* TO root@localhost IDENTIFIED BY "123456";
Query OK, ....
```

​		显示Query OK, 即更新密码成功;

​		其中`root@localhos`，`localhost`就是本地访问，配置成`%`就是所有主机都可连接；

​		第二个`'123456'`为你给新增权限用户设置的密码，`%`代表所有主机，也可以是具体的ip;

或:

```bash
use mysql;   然后敲回车
update user set authentication_string=password("你的密码") where user="root";  然后敲回车
flush privileges;  然后敲回车
```

​		也可以修改密码!

**注2: mysql出现ERROR1698(28000):Access denied for user root@localhost错误解决方法: 更新认证字段**

​		此时, 退出之后, 再次使用:

```bash
~$: mysql -u root -p
password: 
```

​		<font color="#FF0000">依然可能提示无法登录!</font>

此时再次使用:

```bash
sudo mysql
```

进入mysql, 执行:

```sql
use mysql;
select user,plugin from user;
```

此时显示:

![](https://img2018.cnblogs.com/blog/1425775/201809/1425775-20180904131927504-1825749614.png)	

错误原因是因为plugin root的字段是auth_socket，那我们改掉它为下面的mysql_native_password就行了。输入：

```sql
update user set authentication_string=password("ln122920"),plugin='mysql_native_password' where user='root';
```

然后重启mysql服务:

```bash
sudo systemctl restart mysql.service
```

再次登录即可!

参考: [mysql出现ERROR1698(28000):Access denied for user root@localhost错误解决方法](https://www.cnblogs.com/cpl9412290130/p/9583868.html)



**注3: 更新密码出现: ERROR 1054(42S22) Unknown column 'password' in 'field list' 错误的解决**

错误的原因是:

​	<font color="#FF0000">5.7版本下的mysql数据库下已经没有password这个字段了，password字段改成了authentication_string</font>

所以修改密码应使用:

```sql
use mysql;
select User from user;  #此处为查询用户命令
update user set password=password("*******") where user="*******";  #修改密码报错


mysql> update mysql.user set authentication_string=password('*******') where  user='*******';  #修改密码成功
Query OK, 1 row affected, 1 warning (0.00 sec)
Rows matched: 1  Changed: 1  Warnings: 1

mysql> flush privileges;  #立即生效
Query OK, 0 rows affected (0.00 sec)

mysql> quit
Bye
```



#### 5): 创建新的用户

​		由于Mysql安装时的root权限过大, 所以我们最好就封锁他的登录为localhost, 即只能通过本地登录, 而创建一个新的用户, 通过给这个用户分配权限实现管理mysql.

1.  添加用户

　　同前, 跟以往版本不同，MySQL5.7 mysql.user 表没有password字段，这个字段改成了 authentication_string；

　　这里我们使用命令进行创建用户：

```sql
CREATE USER 'username'@'host' IDENTIFIED BY 'password';
```

　　如: 创建一个test用户，密码为test123，可以进行远程登录：

```sql
create user 'test'@'%' identified by 'test123';
```

　　username - 你将创建的用户名,

　　host - 指定该用户在哪个主机上可以登陆，此处的"localhost"，是指该用户只能在本地登录，不能在另外一台机器上远程登录，如果想远程登录的话，将"localhost"改为"%"，表示在任何一台电脑上都可以登录;也可以指定某台机器可以远程登录;

　　password - 该用户的登陆密码,密码可以为空,如果为空则该用户可以不需要密码登陆服务器。

2.  删除用户

　　如果用户创建错了，肯定要支持删除操作，使用命令：

```sql
DROP USER 'username'@'host';
```

3.  授权

　　授权test用户有testDB数据库的某一部分权限：

```sql
grant select,update on testDB.* to test@'%' identified by 'test123';
```

　　授权test用户有testDB数据库的所有操作权限：

```sql
grant all privileges on testDB.* to 'test'@'%' identified by 'test123';
```

　　授权test用户拥有所有数据库的某些权限：

```sql
grant select,delete,update,create,drop on *.*  to 'test'@'%' identified by 'test123';
```

privileges - 用户的操作权限,如select,delete,update,create,drop等(详细列表可自行百度)，如果要授予所有的权限可使用all（参考第二种授权方式）;% 表示对所有非本地主机授权，不包括localhost。

#### 6): 配置验证

​		此时使用:

```bash
mysql -u username -p
password:
```

​		输入密码之后即可登录.



### Telnet

#### 1): 使用apt安装

```bash
sudo apt-get update # 更新包
sudo apt-get install xinetd telnetd # 安装Telnet
```

#### 2): 验证安装

```bash
netstat -a | grep telnet
```

若有输出则安装完成。 

重启机器或重启网络服务命令:

```bash
sudo /etc/init.d/xinetd restart
```



### VSCode

#### 1): 安装

​		在Ubuntu中安装VSCode比较简单, 可通过:

1.  snap商店搜索安装
2.  通过VSCode官方网站下载deb包安装:

下载: [VSCode官方网站](https://code.visualstudio.com/Download)

下载完成之后, 通过双击安装包, 或者dpkg命令安装即可:

```bash
sudo dpkg -i code_1.24.1-1528912196_amd64.deb
```



#### 2): 配置

 1.    修改VSCode显示语言:

       通过按住 **ctrl+shift+p**,  在上方输入框输入“language”选择Configure Display Language, 则会提示更换语言, 下载对应的语言包即可;

       ![](https://img-blog.csdn.net/20180621213248969?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0hlbGxvWkVY/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

2.  设置字体:

    在Ubuntu中, VSCode的默认字体将会导致代码之间的空格无比之小!

    通过首选项(preference)->设置(Setting), 搜索: 

    ​	**font**, 修改用户(User)和工作区(Worksapce)中:

    1.  Editor: Font Family: 

    ```
    "monospace"
    ```

    2.  Editor: Font Size:

    ```
    14
    ```

    	3. Editor › Editor: Mouse Wheel Zoom:

    勾选, 可以在编辑器中通过按住 **Ctrl + 鼠标滚轮**调节字体大小.

    

    之后搜索: **zoom**, 修改:

    4.  Window: Zoom Level:

    ```
    0.3
    ```

    ​	<font color="#FF0000">可以调节整个IDE的视图大小, 搭配字体大小, 实现左边的Bar和编辑器文字大小的匹配</font>

#### 3): 插件安装

​		其实网上已经有好多推荐的插件了, 这里不在赘述. 只是最近在刷Leetcode, 所以推荐一个Leetcode的刷题插件, 商店搜索**Leetcode**即可!



### Flash

​		Ubuntu虽然默认自带了浏览器Firefox, 但是没有自带Flash, 导致你在登录一些不支持H5的网站的时候, 使用Flash播放的视频无法播放. 

​		通常的做法是, 通过[Flash中国官网](https://www.flash.cn/)下载对应的安装包安装.

​		但是现在我们可以直接通过apt安装!

```bash
sudo apt install adobe-flashplugin
```

​		<font color="#FF0000">需要注意的是: 安装完成之后, 需要重新启动才能生效!</font>

测试:

​		可以通过打开[Bilibili](https://www.bilibili.com/), 打开任意一个视频, 在播放器下边的设置, 选择使用Flash播放器播放, 如果可以播放, 则说明安装成功!



### Arthas

#### 1): 下载安装包

​		[Arthas Github安装包](https://github.com/MartinDai/Arthas/raw/master/arthas.tar.gz)地址

#### 2): 安装

```bash
./install.sh
```

#### 3): 启动

```bash
 ./as.sh pid
```

附上Arthas的使用指南: [Arthas使用指南](https://blog.csdn.net/minicto/article/details/82906220)



### Putty

​		使用apt安装即可

``` bash
sudo apt install putty
```



### FileZilla

​		使用apt安装即可

```
sudo apt install filezilla
```



### Maven

#### 1): 下载压缩包

[Apache-Maven官方网站](https://maven.apache.org/download.cgi)

**注:** <font color="#FF0000">压缩包应选择Binary tar.gz archive类型, 而Source tar.gz archive为源码压缩包, 无法直接运行!</font>

#### 2): 解压缩

```bash
sudo tar -zvxf apache-maven-x.x.x-bin.tar.gz -C /opt/
```

将文件解压缩到/opt/目录下

#### 3): 设置文件权限或所属

设置文件权限:

```bash
sudo chmod 755 -R /opt/apache-maven-x.x.x
```

或设置文件所属:

```bash
sudo chown user:user -R /opt/apache-maven-x.x.x
```

#### 4): 配置环境变量

修改~/.bashrc 和 /etc/profile文件, 加入:

```
export M2_HOME=/opt/apache-maven-3.6.1
export CLASSPATH=.:${JAVA_HOME}/lib:${JRE_HOME}/lib:${M2_HOME}/lib
export PATH=$PATH:${JAVA_HOME}/bin:${M2_HOME}/bin
```

#### 5): 配置阿里云镜像

默认会在国外的服务器上面下载jar包, 速度很是慢, 修改`%M2_HOME%/conf/settings.xml`文件, 在mirrors标签内部添加:

```xml
<mirror> 
    <id>aliyun-maven</id> 
    <mirrorOf>*</mirrorOf> 
    <name>aliyun maven</name> 
    <url>http://maven.aliyun.com/nexus/content/groups/public</url> 
</mirror>
```

**注: 可能出现的错误:安装maven 错误: 找不到或无法加载主类 org.codehaus.plexus.classworlds.launcher.Launcher**

可能是你下载错了安装包了, 应该下载二进制源的压缩包，然后可以根据安装说明(installation instructions)进行配置。



### Htop

​		通过apt安装即可, 很方便的终端任务管理器

```bash
sudo apt install htop
```



### Sougo

​		以前在安装搜狗输入法的时候, 还需要自己安装Fcitx等依赖, 现在Sougo貌似已经提供了?(疑问)

​		并且官网也给了一个详细的安装教程: [官方安装教程](https://pinyin.sogou.com/linux/help.php)

#### 1): 下载安装包并安装

​		[搜狗输入法官网](https://pinyin.sogou.com/linux/)

​		下载的为deb包, 双击安装即可

#### 2): 按照官方教程设置输入法为Fcitx

#### 3): 重新启动, 即可生效



### Curl

​		通过apt安装即可

```bash
sudo apt install curl
```



### Pip3

#### 1): 安装

​		虽然高版本的ubuntu自带了Python3.6.8, 但是居然没自带pip3, 所以只能自行下载pip3, 通过apt安装即可!

```bash
sudo apt-get install python3-pip
```

#### 2): 验证

通过:

```bash
pip3 -V
```

打印出安装的pip3的版本信息.

#### 3): 配置

​		**注: **<font color="#FF0000">如果系统之前有过pip则, 默认的pip命令为Python2的包管理工具!</font>

​		我们可以通过创建系统中的alias(命令别名来覆盖python, 使得控制台输入python即使用了python3, 使用pip3来代替pip)

​		修改~/.bashrc(本用户有效) 或者 /etc/profile(全体用户有效)

```bash
vim ~/.bashrc

alias python='python3'
alias pip='pip3'
```

​		并使用source命令更新, 使配置立即生效即可.

配置验证:

```bash
zk@jasonkay:~$ python
Python 3.6.8 (default, Jan 14 2019, 11:02:34) 
[GCC 8.0.1 20180414 (experimental) [trunk revision 259383]] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> 

zk@jasonkay:~$ pip -V
pip 9.0.1 from /usr/lib/python3/dist-packages (python 3.6)
```



#### 4): 升级pip

​		如果使用apt安装pip3之前, 没有使用apt update来更新软件源的数据, 可能安装的不是最新版的pip, 此时可能会提示pip3版本过低的警告, 可以通过:

```bash
sudo pip3 install --upgrade pip
```

​		更新pip3



#### 5): pip更换源:

​		pip是Python中非常方便易用的安装包管理器，但是在实际下载安装包的时候总是连接不上或者下载速度特别慢, [pypi.python.org](https://www.cnblogs.com/lpl521/p/pypi.python.org)就是其中一个。

​		所以，使用pip给Python安装软件时，经常出现Timeout连接超时错误。修改pip连接的软件库可以解决这个问题。

​		http://pypi.douban.com是豆瓣提供一个镜像源，软件够新，连接速度也很好。

​		http://mirrors.aliyun.com/pypi/simple/ 这个阿里云也可以。

**方案一: 修改配置文件[一劳永逸, 推荐]**

1.  检查pip.conf文件是否存在, 不存在则创建~/.pip/目录

```bash
cd ~
mkdir .pip
ls ~/.pip
```

2.  直接编辑pip.conf

```bash
sudo vi ~/.pip/pip.conf 

# 写入内容
[global]
timeout=6000
index-url = http://mirrors.aliyun.com/pypi/simple/
[install]
trusted-host = mirrors.aliyun.com
```

​		保存并退出. 此后再使用pip安装软件包速度飞起~!



**方案二: 临时换源[仅本次有效]**

命令格式:

```bash
sudo pip3 install 包名 -i 镜像源url
```

例如:

```bash
sudo pip3 install tensorflow -i https://pypi.douban.com/simple/ 
```



#### 6): 使用pip安装指定版本的包(降级安装)

命令格式:

```bash
sudo pip3 install 包名==版本号
```

例:

```bash
sudo pip3 install numpy==1.16
```

​		这个问题是我在重新安装tensorflow和keras时遇到的, 因为安装的numpy版本过高, 导致不停出现某些方法将在不久的将来弃用(Deprecated)的Warning, 很是烦人.

​		此时可以通过这种方式安装较低版本的软件包. 但是要注意你当前代码用到的包可能在未来某个时间停止维护(笑)!



### Okular

​		一个PDF阅读器, 占用内存还不小, 没什么特别的, 看电子书用的而已. 使用apt安装即可!

```bash
sudo apt install okular
```



### netTools

​		使用apt安装即可!

```bash
sudo apt install net-tools
```



### Rpm

​		使用apt安装即可.

```bash
sudo apt install rpm
```



### uGet

​		一个图形化的下载工具, 使用apt安装即可!

```bash
sudo apt install uget
```



### Redis-desktop-manager

​		一个图形化的Redis管理工具, 可以在ubuntu的snap应用商店找到下载. 或者通过snap命令下载.

```bash
sudo snap install redis-desktop-manager
```

或者通过deb包下载, 这里不再赘述.



### PythonModules

		1. tensorflow
	
	 		2. scipy
	            		3. matplotlib
	                          		4. numpy
	                       		5. keras

等........, 通过pip install 安装即可!



### NpmModules

#### 1. 安装cnpm[国内线路版npm]

​		通过npm安装即可:

```bash
sudo npminstall -g cnpm --registry=https://registry.npm.taobao.org
```

验证:

```bash
cnpm -v
```

可打印出版本即成功安装.



#### 2. 安装Vue-cli

​		通过cnpm安装:

```bash
sudo cnpm install -g vue-cli
```



#### 3. 安装yarn

​		通过yarn的官方文档安装: [](https://yarnpkg.com/lang/en/docs/install/#debian-stable)

配置cnpm源:

```bash
yarn config set registry https://registry.npm.taobao.org
```

<br/>

### Gradle

#### 1.下载Gradle

官方网站：[https://gradle.org/install/#manually](https://gradle.org/install/#manually)

提供了两种下载方式：

-   Binary-only是只下载二进制源码；
-   Complete, with docs and sources是下载源码和文档；

如果有阅读文档的需求可以下载第二个，没有需要的下载Binary-only即可；

#### 2.解压缩安装

将压缩包解压缩即完成安装；

#### 3.配置环境变量

配置环境变量：

-   GRADLE_HOME：解压到的目录；
-   GRADLE_USER_HOME：自定义Gradle仓库目录或者Maven的仓库目录；

修改环境变量Path：

-   $GRADLE_HOME/bin；

#### 4.配置Gradle仓库源

在Gradle安装目录下的 init.d 目录下，新建一个 init.gradle 文件，里面填写以下配置：

```groovy
allprojects {
    repositories {
        maven { url 'file://.......'}
        mavenLocal()
        maven { name "Alibaba" ; url "https://maven.aliyun.com/repository/public" }
        maven { name "Bstek" ; url "http://nexus.bsdn.org/content/groups/public/" }
        mavenCentral()
    }

    buildscript { 
        repositories { 
            maven { name "Alibaba" ; url 'https://maven.aliyun.com/repository/public' }
            maven { name "Bstek" ; url 'http://nexus.bsdn.org/content/groups/public/' }
            maven { name "M2" ; url 'https://plugins.gradle.org/m2/' }
        }
    }
}
```

repositories 中写的是获取 jar 包的顺序：先是本地的 Maven 仓库路径；接着的 mavenLocal() 是获取 Maven 本地仓库的路径，可以和第一条一样，但是不冲突；第三条和第四条是从国内和国外的网络上仓库获取；最后的 mavenCentral() 是从Apache提供的中央仓库获取 jar 包；

#### 5.IDEA配置Gradle

在IDEA的Setting里打开"Build, Execution, Deployment"-"Build Tools"-"Gradle"；

如果在变量和配置文件中设置了Gradle的仓库路径，在 Service directory path 中就会自动填写地址，如果想改的话可以手动修改；

具体见下图：

![gradle_idea.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/gradle_idea.png)

<br/>