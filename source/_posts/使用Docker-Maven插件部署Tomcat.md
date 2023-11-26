---
title: 使用Docker-Maven插件部署Tomcat
toc: true
date: 2020-01-14 22:31:51
cover: https://img.paulzzh.com/touhou/random?19
categories: Docker
tags: [Maven, 项目构建, 项目部署, Tomcat, Docker]
description: 学习了Docker之后, 在项目部署时是真的香, 不需要破坏宿主本地环境, 能够统一部署, 环境相同, 构建集群也方便. 所以现在即使开发个JSP, 部署在Tomcat也不想在本地下一个Tomcat了
---

学习了Docker之后, 在项目部署时是真的香, 不需要破坏宿主本地环境, 能够统一部署, 环境相同, 构建集群也方便. 所以现在即使开发个JSP, 部署在Tomcat也不想在本地下一个Tomcat了

查阅了网上的相关资料, 不是搞本地资源映射, 就是自己在构建一个镜像, 不是很方便

本篇总结了直接使用官方的Tomcat镜像, 通过Maven插件直接构建项目镜像!

<br/>

<!--more-->

### 使用镜像说明

由于本项目使用的是JDK 11开发, 所以在部署时使用的是官方的镜像: tomcat:9.0.30-jdk11

拉取:

```bash
docker pull tomcat:9.0.30-jdk11
```

><br/>
>
>**说明:**
>
>如果你是用其他JDK版本, 或是Tomcat版本, 可在DockerHub官方查找所需镜像: [Tomcat官方镜像](https://hub.docker.com/_/tomcat)

<br/>

### 添加Maven插件

使用的是[docker-maven-plugin](https://github.com/spotify/docker-maven-plugin)插件, 可以在maven中直接通过`mvn docker:build`等命令创建, 而不需要再编写Dockerfile

在pom中添加:

```xml
<build>
        <plugins>
            <plugin>
                <groupId>com.spotify</groupId>
                <artifactId>docker-maven-plugin</artifactId>
                <version>1.2.1</version>
                <configuration>
                    <imageName>image-name</imageName>
                    <baseImage>tomcat:9.0.30-jdk11</baseImage>
                    <maintainer>Jasonkay jasonkayzk@gmail.com</maintainer>
                    <resources>
                        <resource>
                            <targetPath>/usr/local/tomcat/webapps</targetPath>
                            <directory>${project.build.directory}</directory>
                            <include>*.war</include>
                        </resource>
                    </resources>
                    <runs>
                        <run>mv /usr/local/tomcat/webapps/${project.build.finalName}.war /usr/local/tomcat/webapps/ROOT.war</run>
                    </runs>
                </configuration>
            </plugin>
        </plugins>
    </build>
```

><br/>
>
>**说明:**
>
>① 在configuration标签中进行配置, 更详细的配置可见: [docker-maven-plugin官方](https://github.com/spotify/docker-maven-plugin)
>
>② imageName: 配置构建后的镜像名称
>
>③ baseImage: 相当于Dockerfile中的FROM, 指明基于哪个镜像构建
>
>④ maintainer: 镜像作者
>
>⑤ resources: 添加构建镜像所需的资源文件**(是将资源添加到镜像中, 而非映射)**
>
>-   targetPath: 在镜像中的位置, `/usr/local/tomcat/webapps`是tomcat镜像中的部署位置
>-   directory: 源文件所在目录, `${project.build.directory}`表示项目构建后的目录
>-   include: 包括的源文件, *.war表示包括构建的war包
>
>⑥ runs: 执行命令, 类似于Dockerfile中的CMD
>
>**补充说明:**
>
>**`<run>mv /usr/local/tomcat/webapps/${project.build.finalName}.war /usr/local/tomcat/webapps/ROOT.war</run>`表示**
>
><font color="#f00">**将添加到tomcat目录中的war包重命名为ROOT.war**</font>
>
>**在Tomcat的webapps目录下部署项目时的特点:**
>
>-   **war包会自动解压;**
>-   **默认的访问路径是`http://ip:port/projectName/`, 即访问时必须加上项目名称;**
>-   **对于ROOT.war为默认的项目, 可以直接使用`http://ip:port/`访问, 即不需要项目名称**
>
><font color="#f00">**而在run中的命令即重命名war包为ROOT.war, 即可不添加项目名称进行访问!**</font>

<br/>

### 项目构建

完成项目的开发之后, 直接使用下面的命令即可构建镜像:

```bash
mvn clean package docker:build
```

然后运行镜像即可

<br/>