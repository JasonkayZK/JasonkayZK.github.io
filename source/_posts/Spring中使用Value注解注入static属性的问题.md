---
title: Spring中使用Value注解注入static属性的问题
toc: true
date: 2020-01-14 22:06:46
cover: https://img.paulzzh.com/touhou/random?10
categories: Spring
tags: [Spring]
description: 今天在写项目的时候使用了@Value注解在static属性上注入了值, 启动项目后一直报NPE, 后来才发现spring中不能直接向static属性注入值
---

今天在写项目的时候使用了@Value注解在static属性上注入了值, 启动项目后一直报NPE, 后来才发现spring中不能直接向static属性注入值

<br/>

<!--more-->

## 无法注入的原因

<font color="#ff0000">**由于在Spring中@Value注入的原理是依赖于setter方法的: 而static属性使用的不是普通的setter方法(使用static setter), 所以无法直接注入(被置为null)**</font>

如下方法:

```java
@Component
public class Test {
    @Value("${url}")
    public static String url;
}
```

><br/>
>
>**说明:**
>
>**本意是通过ApplicationContext载入配置文件, 并将url值注入字段, 实际上属性值为null!**

<br/>

## 注入static属性的方法

### ① xml通过bean注入

配置例如:

Util.java

```java
Class Util{
  private static XXX xxx;
  public void setXxx(XXX xxx){
    this.xxx = xxx;
  }
  public void getXxx(){
    return xxx;
  }
  public static void method1(){
    xxx.func1(); 
  }
  public static void method2(){
    xxx.func2();
  }   
}
```

application.xml

```xml
<bean value="test" class="x.x.x.Util">
    <property value="xxx" ref="xxx"/>
</bean>
```

<br/>

### ② 通过setter方法

```java
@Component
public class Test {
    public static String url = "/dev/xx";

    @Value("${url}")
    public static void setUrl(String url) {
        Test.url = url;
    }
}
```

<br/>

### ③ 通过中间变量赋值

```java
@Component
public class Test {
    public static String url = "/dev/xx";

    @Value("${url}")
    public String tempUrl = "/dev/xx";

    @PostConstruct
    public void init() {
        url = tempUrl;
    }
}
```

><br/>
>
>**说明:**
>
>这里使用到了@PostConstruct注解: 
>
>从Java EE5规范开始，Servlet增加了两个影响Servlet生命周期的注解(Annotation): @PostConstruct和@PreConstruct; 这两个注解被用来修饰一个非静态的void()方法, 而且这个方法不能有抛出异常声明
>
>-   **@PostConstruct说明:**
>
>    被@PostConstruct修饰的方法会在服务器加载Servlet的时候运行，并且只会被服务器调用一次，类似于Serclet的init()方法; 
>
>    被@PostConstruct修饰的方法会在构造函数之后，init()方法之前运行
>
>    <br/>
>
>-   **@PreConstruct说明:**
>
>    被@PreConstruct修饰的方法会在服务器卸载Servlet的时候运行，并且只会被服务器调用一次，类似于Servlet的destroy()方法;
>
>    被@PreConstruct修饰的方法会在destroy()方法之后运行，在Servlet被彻底卸载之前

<br/>