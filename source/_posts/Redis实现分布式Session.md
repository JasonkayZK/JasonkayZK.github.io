---
title: Redis实现分布式Session
toc: true
date: 2020-02-10 12:15:05
cover: https://img.paulzzh.com/touhou/random?10
categories: Redis
tags: [Redis, 分布式]
description: 传统的session由服务器端生成并存储，当应用进行分布式集群部署的时候，如何保证不同服务器上session信息能够共享呢？本篇通过实战讲述如何使用Redis实现分布式Session共享
---

传统的session由服务器端生成并存储，当应用进行分布式集群部署的时候，如何保证不同服务器上session信息能够共享呢？本篇通过实战讲述如何使用Redis实现分布式Session共享

源代码: https://github.com/JasonkayZK/Java_Samples/tree/redis-session

<br/>

<!--more-->

 Cookie 保存在客户端浏览器中，而 Session 保存在服务器上。客户端浏览器访问服务器的时候，服务器把客户端信息以某种形式记录在服务器上，这就是 Session。客户端浏览器再次访问时只需要从该 Session 中查找该客户的状态就可以了

**Session的实现原理：**

-   服务端首先查找对应的cookie的值（sessionid）
-   根据sessionid，从服务器端session存储中获取对应id的session数据，进行返回
-   如果找不到sessionid，服务器端就创建session，生成sessionid对应的cookie，写入到响应头中

<br/>

在实际工作中我们**建议使用外部的缓存设备来共享 Session，避免单个服务器节点挂掉而影响服务，共享数据都会放到外部缓存容器中**

>   **共享session原理：**
>
>   -   session集中存储（redis，memcached，hbase等）
>   -   不同服务器上session数据进行复制
>
>   **利用Redis等session集中存储的实现方案：**
>
>   -   新增Filter，拦截请求，包装HttpServletRequest
>   -   改写getSession方法，从session存储中获取session数据，返回自定义的HttpSession实现
>   -   在生成新Session后，写入sessionid到cookie中
>
>   所有服务器的session信息都存储到了同一个Redis集群中，即所有的服务都将 Session 的信息存储到 Redis 集群中，无论是对 Session 的注销、更新都会同步到集群中，达到了 Session 共享的目的
>
>   **Redis存储session的需要考虑问题：**
>
>   -   session数据如何在Redis中存储？
>   -   session属性变更何时触发存储？
>
>   考虑到session中数据类似map的结构，采用redis中hash存储session数据比较合适，如果使用单个value存储session数据，不加锁的情况下，就会存在session覆盖的问题，因此**使用hash存储session，每次只保存本次变更session属性的数据，避免了锁处理，性能更好**
>
>   如果每改一个session的属性就触发存储，在**变更较多session属性时会触发多次redis写操作，对性能也会有影响，我们是在每次请求处理完后，做一次session的写入，并且只写入变更过的属性**
>
>   如果本次没有做session的更改， 是不会做redis写入的，仅当没有变更的session超过一个时间阀值（不变更session刷新过期时间的阀值），就会触发session保存，以便session能够延长有效期

此外, Spring 官方针对 Session 管理这个问题，提供了专门的组件 Spring Session，使用 Spring  Session 在项目中集成分布式 Session 非常方便。Spring 为 Spring Session 和 Redis  的集成提供了组件：spring-session-data-redis

所以在这里我们直接使用这个组件实现

<br/>

### 导入依赖并配置

pom.xml

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.2.4.RELEASE</version>
    <relativePath/> <!-- lookup parent from repository -->
</parent>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-pool2</artifactId>
    </dependency>
    <!-- Spring Session Redis 依赖-->
    <dependency>
        <groupId>org.springframework.session</groupId>
        <artifactId>spring-session-data-redis</artifactId>
    </dependency>

    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

配置文件

application.yml

```yaml
server:
  port: 8080

spring:
  # Redis配置(不同应用程序项目配置同一个Redis服务器)
  redis:
    database: 0
    host: localhost
    port: 6379

    # 连接池(使用负值表示没有限制)
    lettuce:
      shutdown-timeout: 100
      pool:
        max-active: 8
        max-wait: -1
        max-idle: 8
        min-idle: 0
```

SessionConfig.java

```java
package top.jasonkayzk.redissession.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;

/**
 * Session配置
 *
 * Session失效时间: 30天
 *
 * @author zk
 */
@Configuration
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 86400 * 30)
public class SessionConfig {
}
```

><br/>
>
>**配置说明:**
>
>**`maxInactiveIntervalInSeconds:` 设置 Session 失效时间，使用 Redis Session 之后，原 Spring Boot 中的 server.session.timeout 属性不再生效**

仅仅需要这两步 Spring Boot 分布式 Session 就配置完成了

<br/>

### 实体类

先创建一个User类，<font color="#f00">**一定要实现序列化接口，因为session将数据存放到了Redis集群中，所以存入的数据也需要能够被序列化**</font>

User.java

```java
package top.jasonkayzk.redissession.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.io.Serializable;

/**
 * 用户实体类
 *
 * @author zk
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Accessors(chain = true)
public class User implements Serializable {

    private static final long serialVersionUID = -5838756847926488707L;

    private Long id;

    private String username;

    private String password;

    public static User defaultUser() {
        return User.builder().id(1L).username("zk").password("123456").build();
    }

}
```

><br/>
>
>**说明:** 为了简单演示, 没有从数据库中取数据, 而是直接通过defaultUser()直接返回了一个User实例

<br/>

### 控制器

IndexController.java

```java
package top.jasonkayzk.redissession.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import top.jasonkayzk.redissession.entity.User;

import javax.servlet.http.HttpServletRequest;

import static top.jasonkayzk.redissession.entity.User.defaultUser;

/**
 * @author zk
 */
@Controller
public class IndexController {

    @ResponseBody
    @GetMapping("/index")
    public String index(HttpServletRequest request) {
        User user = (User) request.getSession().getAttribute("user");
        if (user != null) {
            return "index message";
        }
        return "please login first";
    }

    @ResponseBody
    @RequestMapping("/login")
    public String login(HttpServletRequest request, String username, String password) {
        User userFromDB = defaultUser();
        if (username.equals(userFromDB.getUsername())) {
            if (password.equals(userFromDB.getPassword())) {
                request.getSession().setAttribute("user", userFromDB);
                return "login success";
            }
        }
        return "login failure";
    }

    @ResponseBody
    @RequestMapping("/logout")
    public String login(HttpServletRequest request) {
        request.getSession().removeAttribute("user");
        return "has already logout";
    }

}
```

><br/>
>
>**说明:**
>
>前端控制器IndexController包括三个方法:
>
>-   **index:**
>
>    判断请求的Session中是否包括user属性(判断当前会话是否已经登录)
>
>-   **login:**
>
>    通过数据库取出User信息, 与请求发来的username和password对比, 如果密码匹配则将user属性加入当前Session(**表示登录成功**)
>
>-   **logout:**
>
>    将user属性从当前Session中移除(**表示退出登录**)

### 实现原理

在上面的IndexController中并没有与Redis的相关操作, 但是还是通过Redis完成了Session共享

**① 查看Redis中存储的Session**

```mysql
localhost:0>keys *
 # 执行 TTL key ，可以查看剩余生存时间
 # 定时Job程序触发Session 过期。(spring-session 功能)，数据类型：Set
 1)  "spring:session:sessions:expires:f63798bb-2593-4c8a-be89-e316c1005138"
 # 存储 Session 数据,数据类型hash，可以使用type查看
 2)  "spring:session:sessions:f63798bb-2593-4c8a-be89-e316c1005138"
 # Redis TTL触发Session 过期，数据类型：String
 3)  "spring:session:expirations:1583905680000"
 
localhost:0>type spring:session:sessions:f63798bb-2593-4c8a-be89-e316c1005138
"hash"

localhost:0>type spring:session:expirations:1583905680000
"set"

localhost:0>type spring:session:sessions:expires:f63798bb-2593-4c8a-be89-e316c1005138
"string"

localhost:0>hkeys spring:session:sessions:f63798bb-2593-4c8a-be89-e316c1005138
 1)  "lastAccessedTime"
 2)  "creationTime"
 3)  "maxInactiveInterval"
 4)  "sessionAttr:user"
```

**② Spring-Session在Redis中存储时数据结构形式说明**

Redis中的存储说明：

-   spring:session是默认的Redis HttpSession前缀

-   每一个session都会创建3组数据：

    -   hash结构，spring-session存储的主要内容: spring:session:sessions:fc454e71-c540-4097-8df2-92f88447063f

        hash结构有key和field，如上面的例子：hash的key为"spring:session:sessions"前缀加上fc454e71-c540-4097-8df2-92f88447063f，该key下的field有：

        ```properties
        field=sessionAttr:qwe,value=123                
        field=creationTime,value=                         //创建时间
        field=maxInactiveInterval，value=           
        field=lastAccessedTime，value=              //最后访问时间
        ```

    -   String结构，用于ttl过期时间记录: spring:session:sessions:expires:fc454e71-c540-4097-8df2-92f88447063f

        key为`spring:session:sessions:expires: 前缀+fc454e71-c540-4097-8df2-92f88447063f`

        value为空

    -   Set结构，过期时间记录: spring:session:expirations:1515135000000

        set的key固定为`spring:session:expirations:1515135000000`，set的集合values为：

        ```properties
        expires:c7fc28d7-5ae2-4077-bff2-5b2df6de11d8  //（一个会话一条）
        expires:fc454e71-c540-4097-8df2-92f88447063f  //（一个会话一条）
        ```

><br/>
>
>**补充:**
>
><font color="#f00">**Redis清除过期key的行为是一个异步行为且是一个低优先级的行为，用文档中的原话来说便是，可能会导致session不被清除**</font>
>
>于是**引入了专门的expiresKey，来专门负责session的清除**，包括我们自己在使用redis时也需要关注这一点。在开发层面，我们仅仅需要关注第三个key就行了

**③ spring-session-data-redis的实现原理**

总体思路是: **通过一个过滤器，重新包装request和reponse以及session**, 在SpringSession实现过程中**DelegatingFilterProxy就是这个过滤器入口**

<br/>

-   **Spring-Session-data-redis配置类**

包括: 

-   RedisHttpSessionConfiguration
-   SessionRepository
-   SpringSessionRepositoryFilter等;

由Spring的配置类复制加载spring配置和创建(RedisOperationsSessionRepository)SessionFactory和(SessionRepositoryFilter)SpringSessionRepositoryFilter;

其中SpringSessionRepositoryFilter是由他的父类SpringHttpSessionConfiguration创建

功能:

-   Redis连接设置(超时, 连接池等)
-   线程池设置
-   序列化设置
-   命令执行
-   ……

****

-   **Request包装类**

包括:

-   SessionRepositoryRequestWrapper(SessionRepositoryFilter的内部类)
    -   getSession()
    -   getCurrentSession()
    -   ……
-   ……

SessionRepositoryRequestWrapper实现了HttpServletRequest的所有方法, 比如: getSession方法是调用SessionRepository.createSession(), 然后返回一个包装过后的RedisSession对象(**RedisSession包装了HttpSession的常用方法**)

****

-   **Response包装类**

包括:

-   SessionRepositoryResponseWrapper(同样是SessionRepositoryFilter的内部类)
    -   getSession()
    -   getCurrentSession()
    -   ……
-   ……

SessionRepositoryResponseWrapper继承OnCommitedResponseWrapper, 实现了HttpServletResponse的所有方法

****

-   **替换request和reponse包装的调用流程**

1.  DelegatingFilterProxy.initFilter(): 从Spring容器中拿到SpringSessionRepositoryFilter对象;
2.  DelegatingFilterProxy.doFilter();
3.  DelegatingFilterProxy.invokeDelegate(): 调用SpringSessionRepositoryFilter对象的doFilter方法, SessionRepositoryFilter继承自OncePerRequestFilter, doFilter方法在OncePerRequestFilter中
4.  SessionRepositoryFilter.doFilterInternal(): 包装request和response后, 调用过滤器链, 传递给下游程序完成Redis增删查逻辑;

<br/>

### 测试

修改端口号, 分别为8080和9090启动两个Spring Boot实例

8080端口的服务器与9090端口的服务器连接的是同一个Redis服务器, 所以8080端口的服务器与9090端口的服务器共享的是同一个session。在8080端口服务器登录后，在9090端口服务器是可以访问受限制资源的

同样，在9090端口上进行用户退出，然后再测试8080端口是否可以访问受限制资源，结果是用户退出后不可以访问受限制资源

如下图:

![RedisSession.gif](http://www.luyixian.cn/upload/201901/07/201901071657172770.gif)

<br/>

### 附录

源代码: https://github.com/JasonkayZK/Java_Samples/tree/redis-session

文章参考:

-   [SpringBoot坚持学习第七天：Redis实现分布式session共享](http://www.luyixian.cn/news_show_9155.aspx)
-   [几分钟搞定redis存储session共享——设计实现](https://www.cnblogs.com/xiongze520/p/10333233.html)

<br/>