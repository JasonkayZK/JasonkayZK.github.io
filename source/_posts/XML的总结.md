---
title: XML的总结
toc: true
date: 2019-12-05 17:22:35
cover: https://img.paulzzh.tech/touhou/random?9
categories: 技术杂谈
tags: XML
description: 想必大家对XML已经很熟悉了吧. 最近复习的时候, 发现XML远没有自己想的那么简单, 所以就抽出一点时间来总结一下XML中一些常识性的或者冷门的知识
---

想必大家对XML已经很熟悉了吧. 最近复习的时候, 发现XML远没有自己想的那么简单, 所以就抽出一点时间来总结一下XML中一些常识性的或者冷门的知识

<br/>

<!--more-->

## XML简介

XML 的设计宗旨是*传输数据*，而非显示数据, 这也意味着**XML 是不作为的, 仅仅是纯文本**

XML 标签没有被预定义, 与HTML不同, 您需要*自行定义标签*

XML 被设计为具有*自我描述性*

XML 是 *W3C 的推荐标准*

<br/>

## XML的用途

**① XML 把数据从代码中分离**

通过 XML，数据能够存储在独立的 XML 文件中, 这样你就可以专注于代码编写, 并确保修改底层数据不再需要对代码进行任何的改变

**② 简化数据共享**

XML 数据以纯文本格式进行存储，因此提供了一种独立于软件和硬件的数据存储方法

**③ 简化数据传输**

可以在不兼容的系统之间轻松地交换数据

**④ 简化平台的变更**

XML 数据以文本格式存储。这使得 XML 在不损失数据的情况下，更容易扩展或升级到新的操作系统、新应用程序或新的浏览器

**⑤ XML 用于创建新的 Internet 语言**

很多新的 Internet 语言是通过 XML 创建的：

其中的例子包括：

-   XHTML - 最新的 HTML 版本
-   WSDL - 用于描述可用的 web service
-   WAP 和 WML - 用于手持设备的标记语言
-   RSS - 用于 RSS feed 的语言
-   RDF 和 OWL - 用于描述资源和本体
-   SMIL - 用于描述针针对 web 的多媒体

<br/>

## 树结构

XML 文档形成了一种树结构，它从“根部”开始，然后扩展到“枝叶”

XML 使用简单的具有自我描述性的语法：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<note>
<to>George</to>
<from>John</from>
<heading>Reminder</heading>
<body>Don't forget the meeting!</body>
</note>
```

第一行是 XML 声明: 它定义 XML 的版本 (1.0) 和所使用的编码 

><BR/>
>
>**备注:**
>
><font color="#ff0000">**XML 文档必须包含*根元素*: 该元素是所有其他元素的父元素**</font>
>
><font color="#ff0000">**所有元素均可拥有子元素**</font>
>
>XML 文档中的元素形成了一棵文档树, 这棵树从根部开始，并扩展到树的最底端

<br/>

## XML语法规则

**① XML 文档必须包含根元素**

**② 所有 XML 元素都须有关闭标签**

**③ XML 标签对大小写敏感, 标签 `<Letter>` 与标签` <letter>` 是不同的**

**④ XML 的属性值必须加引号:** 

```xml
<!-- 错误 -->
<note date=08/08/2008>
<to>George</to>
<from>John</from>
</note> 

<!-- 正确 -->
<note date="08/08/2008">
<to>George</to>
<from>John</from>
</note> 
```

**⑤ 在 XML 中，空格会被保留**

**⑥ XML 以 LF 存储换行**

><br/>
>
>**备注:**
>
>在 **Windows 应用程序中，换行通常以一对字符来存储：回车符 (CR) 和换行符 (LF)**, 这对字符与打字机设置新行的动作有相似之处
>
>在 **Unix(Linux) 应用程序中，新行以 LF 字符存储**
>
>而 **Macintosh 应用程序使用 CR 来存储新行**

<br/>

## XML元素

*XML 元素*指的是从（且包括）开始标签直到（且包括）结束标签的部分

元素可包含其他元素、文本或者两者的混合物, 元素也可以拥有属性

例: 

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<bookstore>
    <book category="CHILDREN">
        <title>Harry Potter</title>
        <author>J K. Rowling</author>
        <year>2005</year>
        <price>29.99</price>
    </book>
    <book category="WEB">
        <title>Learning XML</title>
        <author>Erik T. Ray</author>
        <year>2003</year>
        <price>39.95</price>
    </book>
</bookstore> 
```

在上例中:

`<bookstore>` 和 `<book>` 都拥有*元素内容*，因为它们包含了其他元素

`<author> `只有*文本内容*，因为它仅包含文本

`<book>` 元素拥有*属性* (category="CHILDREN")

<br/>

**命名规则**

XML 元素必须遵循以下命名规则：

-   名称可以含字母、数字以及其他的字符
-   名称不能以数字或者标点符号开始 
-   名称不能以字符 “xml”（或者 XML、Xml）开始 
-   名称不能包含空格 

<br/>

## XML 属性

**XML 元素可以在开始标签中包含属性，属性 (Attribute) 提供关于元素的额外（附加）信息**

**属性通常提供不属于数据组成部分的信息**

在下面的例子中，文件类型与数据无关，但是对需要处理这个元素的软件来说却很重要：

```xml
<file type="gif">computer.gif</file>
```

><br/>
>
>**注意: **
>
>**① XML 属性必须加引号**
>
>**② 如果属性值本身包含双引号，那么有必要使用单引号包围它(或使用实体引用转义)**

<br/>

因使用属性而引起的一些问题：

-   属性无法包含多重的值（元素可以）
-   属性无法描述树结构（元素可以）
-   属性不易扩展（为未来的变化）
-   属性难以阅读和维护

请尽量使用元素来描述数据。而仅仅使用属性来提供与数据无关的信息

><br/>
>
>**总结: 元数据（有关数据的数据）应当存储为属性，而数据本身应当存储为元素**

<br/>

## XML验证

**① 使用DTD验证**

合法的 XML 文档是“形式良好”的 XML 文档，同样遵守文档类型定义 (DTD) 的语法规则：

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

在上例中，DOCTYPE 声明是对外部 DTD 文件的引用

下面的段落展示了这个文件的内容:

```dtd
<!DOCTYPE note [
  <!ELEMENT note (to,from,heading,body)>
  <!ELEMENT to      (#PCDATA)>
  <!ELEMENT from    (#PCDATA)>
  <!ELEMENT heading (#PCDATA)>
  <!ELEMENT body    (#PCDATA)>
]> 
```

DTD 的作用是定义 XML 文档的结构, 它使用一系列合法的元素来定义文档结构

><br/>
>
>**扩展:**
>
>**也可以直接在xml文件中声明dtd**, 如:
>
>```xml-dtd
><?xml version="1.0" ?> 
><!DOCTYPE note [
>  <!ELEMENT note (to,from,heading,body)>
>  <!ELEMENT to      (#PCDATA)>
>  <!ELEMENT from    (#PCDATA)>
>  <!ELEMENT heading (#PCDATA)>
>  <!ELEMENT body    (#PCDATA)>
>]>
><note>
><to>George</to> 
><from>John</Ffrom> 
><heading>Reminder</heading> 
><body>Dont forget the meeting!</body> 
></note>
>
>```

<br/>

**② 使用XML Schema验证**

W3C 支持一种基于 XML 的 DTD 代替者，它名为 XML Schema:

```xml-dtd
<xs:element name="note">
<xs:complexType>
  <xs:sequence>
    <xs:element name="to"      type="xs:string"/>
    <xs:element name="from"    type="xs:string"/>
    <xs:element name="heading" type="xs:string"/>
    <xs:element name="body"    type="xs:string"/>
  </xs:sequence>
</xs:complexType>
</xs:element> 
```

><br/>
>
>**扩展: XML 错误会终止您的程序**
>
><font color="#ff0000">**XML 文档中的错误会终止你的 XML 程序!**</font>
>
>W3C 的 XML 规范声明：**如果 XML 文档存在错误，那么程序就不应当继续处理这个文档。理由是，XML 软件应当轻巧，快速，具有良好的兼容性**
>
>如果使用 HTML，创建包含大量错误的文档是有可能的（比如你忘记了结束标签）, 其中一个主要的原因是 HTML 浏览器相当臃肿，兼容性也很差，并且它们有自己的方式来确定当发现错误时文档应该显示为什么样子

<br/>

## 查看 XML 文件

在所有现代浏览器中，均能够查看原始的 XML 文件, 但不要指望 XML 文件会直接显示为 HTML 页面

并且**如果浏览器打开了某个有错误的 XML 文件，那么它会报告这个错误**

><br/>
>
>**为什么 XML 会这样显示？**
>
>XML 文档不会携带有关如何显示数据的信息
>
>由于 XML 标签由 XML 文档的作者“发明”，浏览器无法确定像 `<table>` 这样一个标签究竟描述一个 HTML 表格还是一个餐桌
>
>在没有任何有关如何显示数据的信息的情况下，大多数的浏览器都会仅仅把 XML 文档显示为源代码

<br/>

## XML 命名空间（XML Namespaces）

XML 命名空间提供避免元素命名冲突的方法

在 XML 中，元素名称是由开发者定义的，当两个不同的文档使用相同的元素名时，就会发生命名冲突

例如, 这个 XML 文档携带着某个表格中的信息：

```xml
<table>
   <tr>
   <td>Apples</td>
   <td>Bananas</td>
   </tr>
</table>
```

另一个XML 文档携带有关桌子的信息（一件家具）：

```xml
<table>
   <name>African Coffee Table</name>
   <width>80</width>
   <length>120</length>
</table>
```

假如这两个 XML 文档被一起使用，由于两个文档都包含带有不同内容和定义的` <table>` 元素，就会发生命名冲突. 此时XML 解析器无法确定如何处理这类冲突

<br/>

**① 使用前缀来避免命名冲突**

```xml
<!-- 此文档带有某个表格中的信息 -->
<h:table>
   <h:tr>
   <h:td>Apples</h:td>
   <h:td>Bananas</h:td>
   </h:tr>
</h:table>

<!-- 此 XML 文档携带着有关一件家具的信息 -->
<f:table>
   <f:name>African Coffee Table</f:name>
   <f:width>80</f:width>
   <f:length>120</f:length>
</f:table>
```

通过使用前缀，我们创建了两种不同类型的 `<table>` 元素

<br/>

**② 使用命名空间（Namespaces）**

```xml
<!-- 此文档带有某个表格中的信息 -->
<h:table xmlns:h="http://www.w3.org/TR/html4/">
   <h:tr>
   <h:td>Apples</h:td>
   <h:td>Bananas</h:td>
   </h:tr>
</h:table>

<!-- 此 XML 文档携带着有关一件家具的信息 -->
<f:table xmlns:f="http://www.w3school.com.cn/furniture">
   <f:name>African Coffee Table</f:name>
   <f:width>80</f:width>
   <f:length>120</f:length>
</f:table>
```

与仅仅使用前缀不同，我们为` <table>` 标签添加了一个 xmlns 属性，这样就为前缀赋予了一个与某个命名空间相关联的限定名称(类似于Java中的包名)

<br/>

**XML Namespace (xmlns) 属性**

XML 命名空间属性被放置于元素的开始标签之中，并使用以下的语法：

```xml
xmlns:namespace-prefix="namespaceURI"
```

**当命名空间被定义在元素的开始标签中时，所有带有相同前缀的子元素都会与同一个命名空间相关联**

><br/>
>
>**注释：用于标示命名空间的地址不会被解析器用于查找信息, 其惟一的作用是赋予命名空间一个惟一的名称**
>
>不过，很多公司常常会作为指针来使用命名空间指向实际存在的网页，这个网页包含关于命名空间的信息

<br/>

**默认的命名空间（Default Namespaces）**

<font color="#ff0000">为元素定义默认的命名空间可以让我们省去在所有的子元素中使用前缀的工作</font>

使用下面的语法：

```xml
xmlns="namespaceURI"
```

<br/>

## XML CDATA

<font color="#ff0000">**所有 XML 文档中的文本均会被解析器解析, 只有 CDATA 区段（CDATA section）中的文本会被解析器忽略**</font>

### PCDATA

PCDATA 指的是*被解析的字符数据*（Parsed Character Data）

XML 解析器通常会解析 XML 文档中所有的文本

**当某个 XML 元素被解析时，其标签之间的文本也会被解析：**

```
<message>此文本也会被解析</message>
```

解析器之所以这么做是因为 XML 元素可包含其他元素，就像这个例子中，其中的 `<name>` 元素包含着另外的两个元素(first 和 last)：

```
<name><first>Bill</first><last>Gates</last></name>
```

而解析器会把它分解为像这样的子元素：

```
<name>
   <first>Bill</first>
   <last>Gates</last>
</name>
```

<br/>

### CDATA

术语 CDATA 指的是**不应由 XML 解析器进行解析的文本数据（Unparsed Character Data）**

在 **XML 元素中，"<" 和 "&" 是非法的**

<font color="#ff0000">**"<" 会产生错误，因为解析器会把该字符解释为新元素的开始**</font>

<font color="#ff0000">**"&" 也会产生错误，因为解析器会把该字符解释为字符实体的开始**</font>

某些文本，比如 JavaScript 代码，包含大量 "<" 或 "&" 字符, 为了避免错误，可以将脚本代码定义为 CDATA

CDATA 部分中的所有内容都会被解析器忽略

CDATA 部分由`<![CDATA[`开始，由 `]]>` 结束：

```xml
<script>
<![CDATA[
function matchwo(a,b) {
    if (a < b && a < 0) then {
      return 1;
     }
    else {
      return 0;
    }
}
]]>
</script>
```

在上面的例子中，解析器会忽略 CDATA 部分中的所有内容

><br/>
>
>**关于 CDATA 部分的注释:**
>
>-   **CDATA 部分不能包含字符串 "]]>", 也不允许嵌套的 CDATA 部分**
>
>-   **标记 CDATA 部分结尾的 "]]>" 不能包含空格或折行**

<br/>