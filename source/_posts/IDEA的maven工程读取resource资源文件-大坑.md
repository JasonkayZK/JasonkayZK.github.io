---
title: IDEA的maven工程读取resource资源文件
toc: true
date: 2019-09-14 00:40:52
cover: https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1568403519047&di=16c7d622b37f6e05c091295037190479&imgtype=0&src=http%3A%2F%2Fimg.52jbj.com%2Fd%2Ffile%2F170408%2F201704080048591464.png
categories: 软件配置
tags: [IDEA配置, Maven, 类加载器]
description: 在IDEA下面使用FileInputStream读取配置文件报错找不到路径的解决方案 
---



今天在IDEA下面创建了一个工程使用FileInputStream读取一直报错: 提示找不到路径! 无奈之下换了getClassLoader().getResourceAsStream()居然好了!

<!--more-->

### 1. 使用 new FileInputStream("src/main/resources/config.properties")提示:找不到路径! 解决方案

**原因:** <font color="#ff0000">要取编译后的路径，而不是你看到的src/main/resources的路径. </font>

如下：

```java
URL url = MyTest.class.getClassLoader().getResource("config.properties");
File file = new File(url.getFile());
```

或者:

```java
InputStream in = MyTest.class.getClassLoader().getResourceAsStream("config.properties");
```

第二种方法，也可以省略`*.class`改成:

```java
InputStream in = getClass().getClassLoader().getResourceAsStream("config.properties");
```

另一种一种的写法是：

```java
InputStream in = getClass().getResourceAsStream("conf.properties"); // 无法获取到!
```

<font color="#ff0000">发现，只要添加了`.getClassLoader()`就可以了!</font>

<br/>

-------------------------------------------



### 2. ClassLoader() 的作用

<font color="#0000ff">`classLoader`主要对类的请求提供服务，当JVM需要某类时，它*根据名称向ClassLoader要求这个类*，然后由ClassLoader返回这个类的class对象.</font>

<font color="#ff0000">ClassLoader*负责载入系统的所有资源(Class，文件，图片，来自网络的字节流等)*，通过ClassLoader从而将资源载入JVM 中。每个class都有一个引用，指向自己的ClassLoader。</font>

<br/>

--------------------------------------



### 3. getClassLoader() 的作用

-   getClass(): <font color="#0000ff">取得当前对象所属的Class对象</font>

-   getClassLoader(): <font color="#0000ff">取得该Class对象的类装载器</font>

    <font color="#ff0000">类装载器负责从Java字符文件将字符流读入内存，并构造Class类对象，也通过它可以得到一个文件的输入</font>

<br/>

-----------------------



### 4. Class.getClassLoader()的一个小陷阱: 空指针异常

昨天我的code总在`Integer.class.getClassLoader().getResource("*********")`这一句抛出**空指针异常**，定位为<font color="#0000ff">getClassLoader()返回null!</font>

查了一下jdk的文档，原来这里还有一个陷阱: 

<font color="#ff0000">如果一个类是通过`bootstrap`载入的，那我们通过这个类去获得classloader的话，有些jdk的实现是会返回一个null的!</font>  比如: 用 `new  Object().getClass().getClassLoader()`的话: 会返回一个null，这样的话上面的代码就会出现NullPointer异常．

<font color="#ff0000">所以保险起见我们最好还是使用我们自己写的类来获取classloader("this.getClass().getClassLoader()")，这样一来就不会有问题!</font>

<br/>

------------------------------



### 5. getResourceAsStream()方法详解

<font color="#00ff00">getResourceAsStream()用法与getResouce()方法一样的，用getResource()取得File文件后，再new FileInputStream(file) 与 getResourceAsStream() 的效果一样.</font>

<br/>给出示例, 两个代码效果一样:

```java
InputStream inputStream1 = new 
    FileInputStream(new File(Thread.currentThread().getContextClassLoader().getResource("test.txt").getFile()));

//=============================

InputStream inputStream2 = Thread.currentThread().getContextClassLoader().getResourceAsStream("test.txt");
```

