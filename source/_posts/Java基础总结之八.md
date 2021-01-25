---
title: Java基础总结之八
toc: true
date: 2019-12-05 14:07:35
cover: https://acg.toubiec.cn/random?22
categories: 面试总结
tags: [Java基础, XML]
description: 本文是Java面试总结中Java基础篇的第八篇
---

本文是Java面试总结中Java基础篇的第八篇

<br/>

<!--more-->

## 1. xml有哪些解析技术?区别是什么?

**1.DOM生成和解析XML文档**

为 XML 文档的已解析版本定义了一组接口, **解析器读入整个文档**，然后构建一个驻留内存的树结构，然后代码就可以**使用 DOM 接口来操作这个树结构**

**优点：**整个文档树在内存中，便于操作；支持删除、修改、重新排列等多种功能；

**缺点：**将整个文档调入内存（包括无用的节点），浪费时间和空间；

**使用场合：**一旦解析了文档还需多次访问这些数据；硬件资源充足（内存、CPU）

<br/>

**2.SAX生成和解析XML文档**

为解决DOM的问题，出现了SAX: SAX，事件驱动

当解析器发现元素开始、元素结束、文本、文档的开始或结束等时，发送事件，程序员编写响应这些事件的代码，保存数据

优点：不用事先调入整个文档，占用资源少；SAX解析器代码比DOM解析器代码小，适于Applet，下载

缺点：不是持久的；事件过后，若没保存数据，那么数据就丢了；无状态性；从事件中只能得到文本，但不知该文本属于哪个元素；

使用场合：Applet; 只需XML文档的少量内容，很少回头访问；机器内存少；

**3.DOM4J生成和解析XML文档**

DOM4J 是一个非常非常优秀的Java XML API，具有性能优异、功能强大和极端易用使用的特点，同时它也是一个开放源代码的软件

如今你可以看到越来越多的 Java 软件都在使用 DOM4J 来读写 XML，特别值得一提的是连 Sun 的 JAXM 也在用 DOM4J

**4.JDOM生成和解析XML**

为减少DOM、SAX的编码量，出现了JDOM；

优点：20-80原则，极大减少了代码量

使用场合：要实现的功能简单，如解析、创建等，但在底层，JDOM还是使用SAX（最常用）、DOM、Xanan文档

<br/>

## 2. XML文档定义有几种形式？它们之间有何本质区别？解析XML文档有哪几种方式？

**两种形式: dtd 和schema**

**本质区别: schema本身是xml的，可以被XML解析器解析(这也是从DTD上发展schema的根本目的)**

解析XML的方式: 有DOM,SAX,STAX等

DOM: 处理大型文件时其性能下降的非常厉害, 这个问题是由DOM的树结构所造成的，这种结构占用的内存较多，而且DOM必须在解析文件之前把整个文档装入内存,适合对XML的随机访问

SAX: 不现于DOM,SAX是事件驱动型的XML解析方式. 它顺序读取XML文件，不需要一次全部装载整个文件。当遇到像文件开头，文档结束，或者标签开头与标签结束时，它会触发一个
事件，用户通过在其回调事件中写入处理代码来处理XML文件，适合对XML的顺序访问

STAX: Streaming API for XML

<br/>

## 3. 你在项目中用到了xml技术的哪些方面?如何实现的?

答: 用到了**数据存贮，信息配置**两方面

在做数据交换平台时，将不能作为数据源的数据组装成XML文件，然后将XML文件压缩打包加密后通过网络传送给接收者，接收解密与解压缩后再同XML文件中还原相关信息进行处理

在做软件配置时，利用XML可以很方便的进行，软件的各种配置参数都存贮在XML文件中

<br/>

## 4. 用jdom解析xml文件时如何解决中文问题?如何解析?

如下例子, 创建了一个xml文件:

```java
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.*;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

/**
 * @author zk
 */
public class DomTest {

    public static void main(String[] args) {
        String filename = "test.xml";

        try {
            DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
            Document document = builder.newDocument();
            Element root = document.createElement("老师");
            Element wang = document.createElement("王");

            wang.appendChild(document.createTextNode("我是王老师"));
            root.appendChild(wang);
            document.appendChild(root);

            Transformer transformer = TransformerFactory.newInstance().newTransformer();
            transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
            transformer.setOutputProperty(OutputKeys.INDENT, "yes");
            transformer.transform(new DOMSource(document), new StreamResult(filename));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

```

输出的xml文件如下:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<老师>
    <王>我是王老师</王>
</老师>
```

<br/>

## 5. 编程用Dom4j解析XML

如下`test.xml`文件在工程下的resources文件夹下:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<jdbc>
    <driver name="driver">com.mysql.jdbc.Driver</driver>
    <url name="url">jdbc:mysql://localhost:3306/exam</url>
    <username name="username">root</username>
    <password name="password">root</password>
</jdbc>
```

下面是使用Dom4j解析xml文件的代码:

```java
import org.dom4j.Attribute;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;

import java.io.File;
import java.util.Iterator;
import java.util.List;

/**
 * @author zk
 */
public class Dom4jTest {

    public static void main(String[] args) throws DocumentException {
        // 创建saxReader对象
        SAXReader reader = new SAXReader();

        // 通过read方法读取一个文件 转换成Document对象
        Document document = reader.read(new File("src/main/resources/test.xml"));

        //获取根节点元素对象
        Element node = document.getRootElement();
        //遍历所有的元素节点
        listNodes(node);
    }

    /**
     * 遍历当前节点元素下面的所有(元素的)子节点
     *
     * @param node 待遍历根节点
     */
    public static void listNodes(Element node) {
        System.out.println("当前节点的名称: " + node.getName());
        // 获取当前节点的所有属性节点
        List<Attribute> list = node.attributes();

        // 遍历属性节点
        for (Attribute attr : list) {
            System.out.println(attr.getText() + ": " + attr.getName() + " -- " + attr.getValue());
        }

        if (!("".equals(node.getTextTrim()))) {
            System.out.println("文本内容: " + node.getText());
        }

        // 当前节点下面子节点迭代器
        Iterator<Element> it = node.elementIterator();
        // 遍历
        while (it.hasNext()) {
            // 获取某个子节点对象
            Element e = it.next();
            // 对子节点进行遍历
            listNodes(e);
        }
    }
}

------- Output -------
当前节点的名称: jdbc
当前节点的名称: driver
driver: name -- driver
文本内容: com.mysql.jdbc.Driver
当前节点的名称: url
url: name -- url
文本内容: jdbc:mysql://localhost:3306/exam
当前节点的名称: username
username: name -- username
文本内容: root
当前节点的名称: password
password: name -- password
文本内容: root
```

<br/>

><br/>
>
>**总结:**
>
>**① 获得Document对象的方式有三种：**
>
>```java
>// 读取XML文件,获得document对象  
>SAXReader reader = new SAXReader();              
>Document   document = reader.read(new File("pom.xml"));
>
>// 解析XML形式的文本,得到document对象
>String text = "<test>Test</test>";            
>Document document = DocumentHelper.parseText(text);
>
>// 主动创建document对象
>Document document = DocumentHelper.createDocument(); //创建根节点
>Element root = document.addElement("test");
>```
>
>**② 节点对象操作的方法**
>
>```java
>// 获取文档的根节点
>Element root = document.getRootElement();
>
>// 取得某个节点的子节点
>Element element = node.element("四大名著");
>
>// 取得节点的文字
>String text = node.getText();
>
>// 取得某节点下所有名为“test”的子节点，并进行遍历
>List nodes = rootElm.elements("test");
>for (Iterator it = nodes.iterator(); it.hasNext(); ) {
>    Element elm = (Element) it.next();
>    // do something
>}
>
>// 对某节点下的所有子节点进行遍历
>for (Iterator it = root.elementIterator(); it.hasNext(); ) {
>    Element element = (Element) it.next();
>    // do something 
>}
>
>// 在某节点下添加子节点
>Element elm = newElm.addElement("朝代");
>
>// 设置节点文字
>elm.setText("明朝");
>
>// 删除某节点: childElement是待删除的节点, parentElement是其父节点
>parentElement.remove(childElment);
>
>// 添加一个CDATA节点
>Element contentElm = infoElm.addElement("content");
>contentElm.addCDATA("cdata区域");
>```
>
>**③ 节点对象的属性方法操作**
>
>```java
>// 取得某节点下的某属性    
>Element root = document.getRootElement(); // 属性名name
>Attribute attribute = root.attribute("id");
>
>// 取得属性的文字
>String text = attribute.getText();
>
>// 删除某属性
>Attribute attribute = root.attribute("size"); 
>root.remove(attribute);
>
>// 遍历某节点的所有属性   
>Element root = document.getRootElement();      
>for(Iterator it = root.attributeIterator(); it.hasNext(); ){        
>    Attribute attribute = (Attribute) it.next();         
>    String text=attribute.getText();        
>    System.out.println(text);  
>}
>  
>// 设置某节点的属性和文字
>newMemberElm.addAttribute("name", "sitinspring");
>
>// 设置属性的文字   
>Attribute attribute = root.attribute("name");   
>attribute.setText("test");
>```
>
>**④ 将文档写入XML文件**
>
>```java
>// 文档中全为英文,不设置编码,直接写入的形式. 
>XMLWriter writer = new XMLWriter(new  FileWriter("ot.xml")); 
>writer.write(document);  
>writer.close();
>
>// 文档中含有中文,设置编码格式写入的形式
>// 创建文件输出的时候，自动缩进的格式
>OutputFormat format = OutputFormat.createPrettyPrint(); 
>format.setEncoding("UTF-8");//设置编码
>XMLWriter writer = new XMLWriter(newFileWriter("output.xml"), format);
>writer.write(document);
>writer.close();
>```
>
>**⑤ 字符串与XML的转换**
>
>```java
>// 将字符串转化为XML
>String text = "<test> <java>Java</java></test>";
>Document document = DocumentHelper.parseText(text);
>
>// 将文档或节点的XML转化为字符串
>SAXReader reader = new SAXReader();
>Document   document = reader.read(new File("test.xml"));            
>Element root=document.getRootElement();    
>String docXmlText=document.asXML();
>String rootXmlText=root.asXML();
>Element memberElm=root.element("test");
>String memberXmlText=memberElm.asXML();
>```
>
>

<br/>