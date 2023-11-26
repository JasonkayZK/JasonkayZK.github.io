---
title: Dubbo快速上手案例
toc: true
date: 2019-12-06 18:23:55
cover: https://img.paulzzh.com/touhou/random?12
categories: Dubbo
tags: [Dubbo]
description: 最近开始学习Dubbo框架, 这一篇主要总结了首次使用Dubbo并集成Spring的一个快速上手的例子
---

最近开始学习Dubbo框架, 这一篇主要总结了首次使用Dubbo并集成Spring的一个快速上手的例子

<br/>

<!--more-->

## 所需环境

**zookeeper作为dubbo的注册中心，dubbo服务提供方和消费方都需要在zookeeper注册中心注册**

><br/>
>
>**注: 本案例选择在Docker中运行Zookeeper**
>
>具体的docker启动Zookeeper服务的命令如下:
>
>```bash
>docker run -d -p 2181:2181 \
>  -v /home/zk/workspace/dubbo_learn/quick-start/zookeeper/data/:/data/ \
>  --name=zookeeper \
>  --privileged zookeeper
>```
>
><font color="#ff0000">**使用时请将具体Zookeeper保存目录修改为你的实际目录**</font>

<br/>

## 开始搭建

### 服务提供方和消费方都需要的包

这里我新建maven工程为pom工程，将共同的项目依赖写到pom.xml中

**① 总的项目结构**

```
zk@jasonkay:~/workspace/dubbo_learn/quick-start$ tree
.
├── docker_cmd.sh
├── dubbo-api
│   ├── dubbo-provider.iml
│   ├── pom.xml
│   ├── src
│   │   └── main
│   │       ├── java
│   │       │   └── top
│   │       │       └── jasonkayzk
│   │       │           └── service
│   │       │               └── DemoService.java
│   │       └── resources
├── dubbo-consumer
│   ├── dubbo-provider.iml
│   ├── pom.xml
│   ├── src
│   │   └── main
│   │       ├── java
│   │       │   └── top
│   │       │       └── jasonkayzk
│   │       │           └── ConsumerTest.java
│   │       └── resources
│   │           ├── dubbo-consumer.xml
│   │           ├── log4j.properties
│   │           └── springmvc.xml
├── dubbo-provider
│   ├── dubbo-provider.iml
│   ├── pom.xml
│   ├── src    原文链接：https://blog.csdn.net/jingyangV587/article/details/84986577
│   │   └── main
│   │       ├── java
│   │       │   └── top
│   │       │       └── jasonkayzk
│   │       │           ├── ProviderTest.java
│   │       │           └── service
│   │       │               └── DemoServiceImpl.java
│   │       └── resources
│   │           ├── dubbo-provider.xml
│   │           ├── log4j.properties
│   │           └── springmvc.xml
├── pom.xml

```

<br/>

**② pom.xml文件内容**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>top.jasonkayzk</groupId>
    <artifactId>quick-start</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>pom</packaging>


    <modules>
        <module>dubbo-api</module>
        <module>dubbo-provider</module>
        <module>dubbo-consumer</module>
    </modules>

    <properties>
        <dubbo.version>2.5.3</dubbo.version>
        <dubbox.version>2.8.4</dubbox.version>
        <spring.version>5.2.2.RELEASE</spring.version>
        <java.version>11</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>dubbo</artifactId>
            <version>${dubbo.version}</version>
            <exclusions>
                <exclusion>
                    <groupId>org.springframework</groupId>
                    <artifactId>spring</artifactId>
                </exclusion>
            </exclusions>
        </dependency>

        <dependency>
            <groupId>com.github.sgroschupf</groupId>
            <artifactId>zkclient</artifactId>
            <version>0.1</version>
        </dependency>

        <!-- spring相关 -->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-core</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-beans</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-jdbc</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-web</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-webmvc</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-aop</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-tx</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-orm</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context-support</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-test</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-jms</artifactId>
            <version>${spring.version}</version>
        </dependency>
        <dependency>
            <groupId>org.aspectj</groupId>
            <artifactId>aspectjrt</artifactId>
            <version>1.6.11</version>
        </dependency>
        <dependency>
            <groupId>org.aspectj</groupId>
            <artifactId>aspectjweaver</artifactId>
            <version>1.6.11</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.0</version>
                <configuration>
                    <target>11</target>
                    <source>11</source>
                </configuration>
            </plugin>
        </plugins>
    </build>

</project>
```

><br/>
>
>**说明:**
>
>本案例中主要的依赖有:
>
>-   **JDK 11**
>-   **dubbo: 2.5.3**
>-   **dubbox: 2.8.4**
>-   **spring: 5.2.2.RELEASE(目前最新)**
>-   **zkclient: 0.1**
>-   **aspectj: 1.6.11**

<br/>

### 一. dubbo-api模块

dubbo-api中定义服务接口

<font color="#ff0000">**注意: (服务提供方和消费方都需要依赖这个项目)**</font>

模块结构如下:

```
├── pom.xml
├── src
│   └── main
│       ├── java
│       │   └── top
│       │       └── jasonkayzk
│       │           └── service
│       │               └── DemoService.java
│       └── resources
...
```

<br/>

**① 在pom.xml中声明parent**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <artifactId>dubbo-api</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>jar</packaging>

    <parent>
        <groupId>top.jasonkayzk</groupId>
        <artifactId>quick-start</artifactId>
        <version>1.0-SNAPSHOT</version>
    </parent>

</project>
```

<br>

**② 定义服务接口DemoService**

```java
package top.jasonkayzk.service;

/**
 * 公共服务接口, 生产者和消费者都需要依赖这个项目
 * @author zk
 */
public interface DemoService {

    /**
     * @param name 名称
     *
     * @return 返回名称, 作为测试
     */
    String sayHello(String name);
}
```

<br/>

### 二. dubbo-provider 服务提供方模块

模块结构:

```
├── pom.xml
├── src
│   └── main
│       ├── java
│       │   └── top
│       │       └── jasonkayzk
│       │           ├── ProviderTest.java
│       │           └── service
│       │               └── DemoServiceImpl.java
│       └── resources
│           ├── dubbo-provider.xml
│           ├── log4j.properties
│           └── springmvc.xml
...
```

**① 在pom.xml声明parent并引入dubbo-api模块依赖**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <artifactId>dubbo-provider</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>jar</packaging>

    <parent>
        <groupId>top.jasonkayzk</groupId>
        <artifactId>quick-start</artifactId>
        <version>1.0-SNAPSHOT</version>
    </parent>

    <dependencies>
        <dependency>
            <groupId>top.jasonkayzk</groupId>
            <artifactId>dubbo-api</artifactId>
            <version>1.0-SNAPSHOT</version>
            <scope>compile</scope>
        </dependency>
    </dependencies>

</project>
```

<br/>

**② 实现接口**

```java
package top.jasonkayzk.service;

import org.springframework.stereotype.Service;

/**
 * 服务接口生产者的实现类
 *
 * @author zk
 */
@Service("demoService")
public class DemoServiceImpl implements DemoService {

    @Override
    public String sayHello(String name) {
        return name;
    }
}

```

<br/>

**③ 声明暴露服务**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
	http://www.springframework.org/schema/beans/spring-beans.xsd
	http://code.alibabatech.com/schema/dubbo
	http://code.alibabatech.com/schema/dubbo/dubbo.xsd">

    <!-- 提供方应用信息，用于计算依赖关系 -->
    <dubbo:application name="dubbo_provider" />

    <!-- 使用zookeeper注册中心暴露服务地址 -->
    <dubbo:registry address="zookeeper://127.0.0.1:2181" />

    <!-- 用dubbo协议在20880端口暴露服务 -->
    <dubbo:protocol name="dubbo" path="20880" />

    <!-- 声明需要暴露的服务接口 -->
    <dubbo:service interface="top.jasonkayzk.service.DemoService" ref="demoService" />
    
</beans>
```

<br/>

**④ 在springmvc.xml中扫描service注解并将dubbo-provider.xml中的相关的dubbo配置引入进来**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans" xmlns:aop="http://www.springframework.org/schema/aop"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:util="http://www.springframework.org/schema/util" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/aop
        http://www.springframework.org/schema/aop/spring-aop-4.0.xsd
        http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans-4.0.xsd
        http://www.springframework.org/schema/context
        http://www.springframework.org/schema/context/spring-context-4.0.xsd
        http://www.springframework.org/schema/util
        http://www.springframework.org/schema/util/spring-util-4.0.xsd"
       default-autowire="byName">

    <aop:aspectj-autoproxy />
    <context:component-scan base-package="top.jasonkayzk" />
    <import resource="classpath:dubbo-provider.xml" />

</beans>
```

<br/>

**⑤ 配置log4j**

```properties
log4j.rootLogger=INFO,stdout

# Console Appender
log4j.appender.stdout=org.apache.log4j.ConsoleAppender
log4j.appender.stdout.layout=org.apache.log4j.PatternLayout
log4j.appender.stdout.layout.ConversionPattern= %d{hh:mm:ss,SSS} [%t] %-5p %c %x - %m%n
```

<br/>

**⑥ 配置启动类**

```java
package top.jasonkayzk;

import org.springframework.context.support.ClassPathXmlApplicationContext;

import java.io.IOException;

/**
 * 加载Spring配置，启动服务类
 *
 * @author zk
 */
public class ProviderTest {

    public static void main(String[] args) {
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("classpath:springmvc.xml");
        context.start();

        System.out.println("Dubbo provider start...");

        try {
            System.in.read(); // 按任意键退出
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

<br/>

### 三. dubbo-consumer 服务消费者模块

模块结构:

```
├── pom.xml
├── src
│   └── main
│       ├── java
│       │   └── top
│       │       └── jasonkayzk
│       │           └── ConsumerTest.java
│       └── resources
│           ├── dubbo-consumer.xml
│           ├── log4j.properties
│           └── springmvc.xml
...
```

<br/>

**① 在pom.xml声明parent并引入dubbo-api模块依赖**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <artifactId>dubbo-consumer</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>jar</packaging>

    <parent>
        <groupId>top.jasonkayzk</groupId>
        <artifactId>quick-start</artifactId>
        <version>1.0-SNAPSHOT</version>
    </parent>

    <dependencies>
        <dependency>
            <groupId>top.jasonkayzk</groupId>
            <artifactId>dubbo-api</artifactId>
            <version>1.0-SNAPSHOT</version>
            <scope>compile</scope>
        </dependency>
    </dependencies>

</project>
```

<br/>

**② 在dubbo-consumer.xml中声明所需要消费的服务**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans.xsd
        http://code.alibabatech.com/schema/dubbo
        http://code.alibabatech.com/schema/dubbo/dubbo.xsd ">

    <!-- 消费方应用名，用于计算依赖关系，不是匹配条件，不要与提供方一样 -->
    <dubbo:application name="dubbo_consumer" />

    <!-- 使用multicast广播注册中心暴露发现服务地址 -->
    <dubbo:registry protocol="zookeeper" address="zookeeper://127.0.0.1:2181" />

    <!-- 生成远程服务代理，可以和本地bean一样使用demoService -->
    <dubbo:reference interface="top.jasonkayzk.service.DemoService" id="demoService" />

</beans>

```

<br/>

**③ 在springmvc.xml中扫描service注解并将dubbo-consumer.xml中的相关的dubbo配置引入进来**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<beans xmlns="http://www.springframework.org/schema/beans" xmlns:aop="http://www.springframework.org/schema/aop"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:util="http://www.springframework.org/schema/util" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/aop
        http://www.springframework.org/schema/aop/spring-aop-4.0.xsd
        http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans-4.0.xsd
        http://www.springframework.org/schema/context
        http://www.springframework.org/schema/context/spring-context-4.0.xsd
        http://www.springframework.org/schema/util
        http://www.springframework.org/schema/util/spring-util-4.0.xsd"
       default-autowire="byName">

    <aop:aspectj-autoproxy />
    <context:component-scan base-package="top.jasonkayzk" />
    <import resource="classpath:/dubbo-consumer.xml" />
    
</beans>
```

<br/>

**④ 配置log4j**

```properties
log4j.rootLogger=INFO,stdout

# Console Appender
log4j.appender.stdout=org.apache.log4j.ConsoleAppender
log4j.appender.stdout.layout=org.apache.log4j.PatternLayout
log4j.appender.stdout.layout.ConversionPattern= %d{hh:mm:ss,SSS} [%t] %-5p %c %x - %m%n
```

<br/>

**⑤ 创建启动类**

```java
package top.jasonkayzk;

import org.springframework.context.support.ClassPathXmlApplicationContext;
import top.jasonkayzk.service.DemoService;

import java.io.IOException;

/**
 * @author zk
 */
public class ConsumerTest {

    public static void main(String[] args) {
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext(new String[] {"classpath:springmvc.xml"});

        context.start();

        DemoService demoService = (DemoService) context.getBean("demoService");

        System.out.println(demoService.sayHello("Hello World!"));

        try {
            System.in.read();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

<br/>

## 测试

首先保证Zookeeper是启动的

>   <br/>
>
>   **注: 本案例使用Docker部署Zookeeper, 直接在主机本地部署Zookeeper的方法见官方文档**

然后先启动dubbo-provider, 再启动dubbo-consumer, 控制台输出:

```
Hello World!
```

则调用成功

<br/>