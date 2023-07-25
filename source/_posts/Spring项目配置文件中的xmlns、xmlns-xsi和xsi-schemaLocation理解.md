---
title: 'Spring项目配置文件中的xmlns、xmlns:xsi和xsi:schemaLocation理解'
toc: true
date: 2019-12-05 16:11:39
cover: https://img.paulzzh.tech/touhou/random?6
categories: 技术杂谈
tags: XML
description: java开发项目中，经常用到xml配置文件，比如web.xml、applicationContext.xml、pom.xml等。在这些文件中都有xmlns、xmlns-xsi和xsi-schemaLocation配置, 平时在做项目时，遇到这些配置文件，尤其是搭建spring框架时，总是从别处直接拷贝过来，没有深入去理解这些配置信息。最近在搭建项目时，又遇到这些配置文件，打算好好理解这些东西
---

java开发项目中，经常用到xml配置文件，比如web.xml、applicationContext.xml、pom.xml等

在这些文件中都有xmlns、xmlns-xsi和xsi-schemaLocation配置, 平时在做项目时，遇到这些配置文件，尤其是搭建spring框架时，总是从别处直接拷贝过来，没有深入去理解这些配置信息

最近在搭建项目时，又遇到这些配置文件，打算好好理解这些东西

<br/>

<!--more-->

java开发项目中，经常用到xml配置文件，比如web.xml、applicationContext.xml、pom.xml等。在这些文件中都有xmlns、xmlns:xsi和xsi:schemaLocation配置

例如：

web.xml 配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app version="3.0" 
    xmlns="http://java.sun.com/xml/ns/javaee" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
    xsi:schemaLocation="http://java.sun.com/xml/ns/javaee 
    http://java.sun.com/xml/ns/javaee/web-app_3_0.xsd">
  <display-name></display-name> 
  <context-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>classpath:applicationContext.xml</param-value>
  </context-param>    
......
</web-app>
```

applicationContext.xml 配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:context="http://www.springframework.org/schema/context"
    xmlns:mvc="http://www.springframework.org/schema/mvc"
    xmlns:tx="http://www.springframework.org/schema/tx"
    xmlns:dwr="http://www.directwebremoting.org/schema/spring-dwr"
    xmlns:aop="http://www.springframework.org/schema/aop"
    xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans-3.2.xsd 
    http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context-3.2.xsd 
    http://www.springframework.org/schema/mvc http://www.springframework.org/schema/mvc/spring-mvc-3.2.xsd 
    http://www.springframework.org/schema/tx http://www.springframework.org/schema/tx/spring-tx-3.2.xsd 
    http://www.springframework.org/schema/aop http://www.springframework.org/schema/aop/spring-aop-3.2.xsd" default-autowire="byName">
    ......
</beans>
```

pom.xml 配置文件

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>report</groupId>
  <artifactId>report-web</artifactId>
  <packaging>war</packaging>
  <version>0.0.1-SNAPSHOT</version>
  <name>report-web</name>
  ......
</project>
```

在上面三个配置文件中，均有xmlns、xmlns:xsi和xsi:schemaLocation设置，针对这些配置信息，有若干思考问题：

**① xmlns、xmlns:xsi和xsi:schemaLocation代表什么意思？**

**② 为什么要使用这些配置信息？**

<br/>

带着这两个问题，逐步理解下:

## xmlns的含义

首先理解xmlns，翻译成汉语就是**xml命名空间（XML Namespaces）**。那么为什么需要xml命名空间呢？

W3School中关于xml教程中给出的答案是**“XML命名空间提供避免元素命名冲突的方法”**

举例说明：

a.xml (这个xml文档携带某个表格中的信息)

```xml
<table>
   <tr>
   <td>Apples</td>
   <td>Bananas</td>
   </tr>
</table>
```

b.xml (这个文档携带有关桌子的信息)

```xml
<table>
   <name>African Coffee Table</name>
   <width>80</width>
   <length>120</length>
</table>
```

如果这两个 XML 文档被一起使用，由于两个文档都包含带有不同内容和定义的 元素，就会发生命名冲突, XML 解析器无法确定如何处理这类冲突

如何解决这类冲突呢？

首先是**使用前缀来避免命名冲突**: a.xml与b.xml文档使用前缀后格式如下：

a.xml 

```xml
<h:table>
   <h:tr>
   <h:td>Apples</h:td>
   <h:td>Bananas</h:td>
   </h:tr>
</h:table>
```

b.xml

```xml
<f:table>
   <f:name>African Coffee Table</f:name>
   <f:width>80</f:width>
   <f:length>120</f:length>
</f:table>
```

现在，命名冲突不存在了，这是由于两个文档都**使用了不同的名称来命名它们的 `<table> 元素 (<h:table> 和 <f:table>)`**

通过使用前缀，我们创建了两种不同类型的 `<table>` 元素, 然后我们**再使用命名空间来继续改变这两个xml文件**：

a.xml

```xml
<h:table xmlns:h="http://www.w3.org/TR/html4/">
   <h:tr>
   <h:td>Apples</h:td>
   <h:td>Bananas</h:td>
   </h:tr>
</h:table>
```

b.xml

```xml
<f:table xmlns:f="http://www.w3school.com.cn/furniture">
   <f:name>African Coffee Table</f:name>
   <f:width>80</f:width>
   <f:length>120</f:length>
</f:table>
```

与仅仅使用前缀不同，我们**为 `<table>`标签添加了一个 xmlns 属性，这样就为前缀赋予了一个与某个命名空间相关联的限定名称**

><br/>
>
>**总结:**
>
>**这两个不同含义的`<table>`，相当于我们在java项目中建立的两个类，一个用来表示表格，另一个用来表示家具；若我们把这两个类都命名成Table（同一包下），那么程序肯定报错（即相当于xml解析器无法解析）；**
>
><font color="#ff0000">**仅仅使用前缀，这两个`<table> 变成<h:table> 和 <f:table>`，相当于我们命名类时，一个命名成HTable，另一个命名成FTable；**</font>
>
><font color="#ff0000">**使用命名空间后，相当于我们建立了两个不同名称的包，一个是f，另一个是h，在这两个不同的包下，我们分别创建了名称都为Table的类**</font>


因此，XML 命名空间属性被放置于元素的开始标签之中，并使用以下的语法：

```xml
xmlns:namespace-prefix="namespaceURI"
```

<font color="#ff0000">**当命名空间被定义在元素的开始标签中时，所有带有相同前缀的子元素都会与同一个命名空间相关联**</font>

对于xml命名空间**还有一个定义就是“默认命名空间”**: <font color="#ff0000">**为元素定义默认的命名空间可以让我们省去在所有的子元素中使用前缀的工作**</font>

例如：

a.xml

```xml
<table xmlns="http://www.w3.org/TR/html4/">
   <tr>
   <td>Apples</td>
   <td>Bananas</td>
   </tr>
</table>
```

b.xml

```xml
<table xmlns="http://www.w3school.com.cn/furniture">
   <name>African Coffee Table</name>
   <width>80</width>
   <length>120</length>
</table>
```

上面两个均使用了默认命名空间

<br/>

到这里，我们也就理解了, 比如: 

APPlicationContext.xml中的`xmlns="http://www.springframework.org/schema/beans"` 这句代码的意思(表示为`<beans>` 定义的默认命名空间)

另外需要注意的是：**用于标示命名空间的地址不会被解析器用于查找信息, 其惟一的作用是赋予命名空间一个惟一的名称**

也就是说: <font color="#ff0000">**http://www.springframework.org/schema/beans 这个url地址只是为`<beans>` 元素命名空间定义的一个唯一名称，没有其它作用**</font>

><br/>
>
>**补充: 不过，很多公司常常会作为指针来使用命名空间指向实际存在的网页: 这个网页包含关于命名空间的信息**

<br/>

## 如何使用xmlns？

 很简单，使用语法： `xmlns:namespace-prefix="namespaceURI"`

**其中namespace-prefix为自定义前缀，只要在这个XML文档中保证前缀不重复即可；namespaceURI是这个前缀对应的XML Namespace的定义**

例如: 定义了一个http://www.springframwork.org/schema/context的Namespace（这和Java类中的包的声明很相似），并将其和前缀context绑定, 而在Spring XML文档中会有这么一句：

```xml
<content:component-scan base-package="xxx.xxx.controller" /> 
```

这里的`<component-scan>`元素就来自别名为context的XML Namespace，也就是在http://www.springframework.org/schema/context中定义的

我们还可以将前缀定义为abc：

```xml
xmlns:abc="namespaceURI"
```

**这样在使用这个namespaceURI中的元素时，需要以abc为前缀**，例如：`<abc:xxx>`

<br/>

## xmlns和xmlns:xsi有什么不同？

**xmlns表示默认的Namespace**: 例如Spring XML文档中的`xmlns="http://www.springframework.org/schema/beans"`

这一句表示该文档默认的XML Namespace为http://www.springframwork.org/schema/beans

<font color="#ff0000">**对于默认的Namespace中的元素，可以不使用前缀**</font>, 例如Spring XML文档中的:

```xml
<bean id = "xxx" class = "xxx.xxx.xxx.xxx">
	<properth name = "xxx" value = "xxxx" />
</bean>
```

<font color="#ff0000">**xmlns:xsi表示使用xsi作为前缀的Namespace，当然前缀xsi需要在文档中声明**</font>

<br/>

## xmlns:xsi的含义

好了，我们再来分析下xmlns:xsi 在配置文件中的作用：

```xml
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
```

根据上面的理解，我们知道这句代码中，xsi表示前缀，http://www.w3.org/2001/XMLSchema-instance 表示命名空间唯一名称，那这句代码到底表示什么含义呢？为什么要引用这句代码呢？ 

首先我们要知道xsi是xml shema instance的缩写，翻译后就是xml文档实例, 要理解xsi具体含义，我们先理解xml文档验证:

在验证xml文档时，**一个合法的xml文档，同样遵守文档类型定义（DTD）的语法规则**，例如：

note.xml

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE note SYSTEM "Note.dtd">
<note>
<to>George</to>
<from>John</from>
<heading>Reminder</heading>
<body>Don't forget the meeting!</body>
</note>
```

在note.xml文件中，DOCTYPE声明是对外部DTD文件的引用，这个DTD文件的内容如下：

note.dtd

```dtd
<!DOCTYPE note [
  <!ELEMENT note (to,from,heading,body)>
  <!ELEMENT to      (#PCDATA)>
  <!ELEMENT from    (#PCDATA)>
  <!ELEMENT heading (#PCDATA)>
  <!ELEMENT body    (#PCDATA)>
]>
```

dtd文件的作用是定义xml文档的结构，它使用一系列合法的元素来定义文档结构

比如说，我们在note.xml文档中添加一个`<aa><aa/>`元素，那么note.xml就无法验证通过，因为note.dtd中没有定义aa元素

>   <br/>
>
>   **补充:**
>
>   其实大家对dtd文件的使用最多的还是在html文件中，我们创建jsp页面时，在jsp页面会出现一行代码（若使用html5，不会出现这行代码）:
>
>   ```jsp
>   <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
>   ```
>
>   这句代码就是说明了我们html文档使用了哪个版本的dtd文件

对于xml文档验证，**W3C支持一种基于xml的dtd替代者，它名为xml schema**（注意上面我们提到了xml schema instance这个词义）

xml schema是描述xml文档结构(xml schema 语言也称作xml schema 定义[xml schema definition , xsd])

那么xml schema文件是什么样式的呢？针对note.xml 我们定义一个名称为note.xsd的xml schema文件，具体内容：

note.xsd

```xml-dtd
<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
targetNamespace="http://www.w3school.com.cn"
xmlns="http://www.w3school.com.cn"
elementFormDefault="qualified">
<xs:element name="note">
    <xs:complexType>
      <xs:sequence>
    <xs:element name="to" type="xs:string"/>
    <xs:element name="from" type="xs:string"/>
    <xs:element name="heading" type="xs:string"/>
    <xs:element name="body" type="xs:string"/>
      </xs:sequence>
    </xs:complexType>
</xs:element>
</xs:schema>
```

针对note.xsd中具体代码的含义不再具体解释

那么我们要理解**note.xsd是xsd的一个具体的实例**，也就是说现在我们拥有了一个xml schema 的一个实例即一个xml schema instance，名称叫note.xsd。

接下来，在note.xml 文件中对note.xsd的使用如下:

note.xml

```xml
<?xml version="1.0"?>
<note
xmlns="http://www.w3school.com.cn"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.w3school.com.cn note.xsd">
<to>George</to>
<from>John</from>
<heading>Reminder</heading>
<body>Don't forget the meeting!</body>
</note>
```

`xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`这句代码再次出现了，现在我们就明白了，这句代码的意思是我们拥有了一个xml schema instance, 其中，前缀、url都是固定不变的，说明遵守w3c协议

<br/>

## xsi:schemaLocation的含义

那么，现在我们拥有了xml schema instance，接下来就是为xml schema instance提供使用的xml schema地址（schemaLocation），即xsd文件全路径

代码如下：

```xml
xsi:schemaLocation="http://www.w3school.com.cn note.xsd"
```

好了，现在我们就全部理解了xmlns、xmlns:xsi和xsi:schemaLocation的具体含义，及为什么要使用它们

<br/>

## Spring中的XML配置文档

现在我有个疑问，如果我们去掉web.xml中的xmlns，项目会不会报错？去掉xmlns:xsi呢？

从本人项目中，可以看看相应的代码：

![xml1.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/xml1.png)

而何时名字空间**何时可以删除**呢，比如下面的情况：

![xml2.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/xml2.png)

><br/>
>
>**总结:**
>
><font color="#ff0000">**一切以  `xsi：schemaLocation="..."`为准, 也就是说xsi：schemaLocation包含的部分一定要出现在名字空间中**</font>
>
>**而实际上写的只需要多于xsi：schemaLocation中的内容即可，这就是删除的依据**

<br/>

又例:

![xml3.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/xml3.png)

<br/>