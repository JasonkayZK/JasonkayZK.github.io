---
title: Java中的IO流
toc: false
date: 2019-11-25 22:30:49
cover: http://api.mtyqx.cn/api/random.php?5
categories: IO基础
tags: [Java基础]
description: Java中的IO一直都是我的薄弱项, 本篇总结了Java中的IOStream
---

Java中的IO一直都是我的薄弱项, 所以今天就来总结一下Java中的IOStream

<br/>

<!--more-->

## 一. 流的概念和作用

<font color="#ff0000">流: 代表任何有能力产出数据的数据源对象或者是有能力接受数据的接收端对象</font>

**流的本质:** 数据传输，根据数据传输特性将流抽象为各种类，方便更直观的进行数据操作

**作用: 为数据源和目的地建立一个输送通道**

<br/>

### **1. Java IO所采用的模型**

Java的IO模型使用Decorator(装饰者)模式，按功能划分Stream，所以可以动态装配这些Stream，以便获得需要的功能

例如: 需要一个具有缓冲的文件输入流，则应当组合使用FileInputStream和BufferedInputStream。

<br/>

### **2. IO流的分类**

① 按**数据流的方向**分为: 输入流和输出流(此输入、输出是相对于我们写的代码程序而言):

-   输入流：从别的地方(本地文件，网络上的资源等)获取资源 输入到 我们的程序中

-   输出流：从我们的程序中 输出到 别的地方(本地文件)， 将一个字符串保存到本地文件中，就需要使用输出流

② 按**处理数据单位**分为字节流和字符流(1字符 = 2字节, 一个汉字占两个字节长度):

-   字节流：每次读取(写出)一个字节，当传输的资源文件有中文时，就会出现乱码

-   字符流：每次读取(写出)两个字节，有中文时，使用该流就可以正确传输显示中文

③ 按**功能**分为节点流和处理流:

-   节点流：以从或向一个特定的地方（节点）读写数据, 如: FileInputStream　
-   处理流：是对一个已存在的流的连接和封装，通过所封装的流的功能调用实现数据读写, 如: BufferedReader

><br/>
>
>**小贴士: 处理流的构造方法总是要带一个其他的流对象做参数, 一个流对象可以经过其他流的多次包装**

<br/>

**4个基本的抽象流类型，所有的流都继承这四个:**

**① InputStream: 字节输入流**

![InputStream.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/InputStream.png)

**② OutputStream：字节输出流**

![OutputStream.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/OutputStream.png)

③ Reader：字符输入流

![Reader.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/Reader.png)

④ Writer：字符输出流

![Writer.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/Writer.png)

四个基本抽象流的关系如下表:

|            | **输入流**  |  **输出流**  |
| :--------: | :---------: | :----------: |
| **字节流** | InputStream | OutPutStream |
| **字符流** |   Reader    |    Writer    |

><br/>
>
>**小结: 如何选择合适的IO流**
>
>**① 首先要选择输入流还是输出流;**
>
>**② 然后考虑传输数据时，是选择使用字节流传输还是字符流，也就是每次传1个字节还是2个字节，有中文肯定就选择字符流了**
>
>**③ 前面两步就可以选出一个合适的节点流了，比如字节输入流inputStream，如果要在此基础上增强功能，那么就在处理流中选择一个合适的即可**

<br/>

### **3. IO流特性**

① **先进先出(FIFO)**，最先写入输出流的数据最先被输入流读取到

② **顺序存取**，可以一个接一个地往流中写入一串字节，读出时也将按写入顺序读取一串字节，不能随机访问中间的数据（**RandomAccessFile可以从文件的任意位置进行存取（输入输出）操作）**

③ 只读或只写，每个流只能是输入流或输出流的一种，**不能同时具备两个功能**，输入流只能进行读操作，对输出流只能进行写操作

>   <br/>
>
>   **注: 在一个数据传输通道中，如果既要写入数据，又要读取数据，则要分别提供两个流**

<br/>

### **4. IO流常用到的类**

在整个Java.io包中最重要的几个类指的是:

-   **① File（文件特征与管理）:**

    File类是对文件系统中文件以及文件夹进行封装的对象，可以通过对象的思想来操作文件和文件夹

    File类保存文件或目录的各种元数据信息, 包括: 文件名、文件长度、最后修改时间、是否可读、获取当前文件的路径名，判断指定文件是否存在、获得当前目录中的文件列表，创建、删除文件和目录等方法

    

-   **② InputStream（二进制格式操作）:**

    抽象类，基于字节的输入操作，是所有输入流的父类。定义了所有输入流都具有的共同特征

    

-   **③ OutputStream:**

    抽象类, 基于字节的输出操作。是所有输出流的父类。定义了所有输出流都具有的共同特征

    

-   **④ Reader（文件格式操作）:**

    抽象类，基于字符的输入操作

    

-   **⑤ Writer（文件格式操作）:**

    抽象类，基于字符的输出操作

    

-   **⑥ RandomAccessFile（随机文件操作）:**

    一个独立的类，**直接继承至Object**. 它的功能丰富，可以从文件的任意位置进行存取（输入输出）操作

整个IO流的结构如下图: 

![整个IO流的结构.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/整个IO流的结构.png)

<br/>

### **5. Java IO流对象**

**① 输入字节流InputStream**

![InputStream.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/InputStream.png)

-   **ByteArrayInputStream：**

    字节数组输入流，该类的功能就是**从字节数组(byte[])中进行以字节为单位的读取**，也就是将资源文件都以字节的形式存入到该类中的字节数组中去

    

-   **PipedInputStream：**

    管道字节输入流，它**和PipedOutputStream一起使用，能实现多线程间的管道通信**

    

-   **FilterInputStream ：**

    装饰者模式中处于装饰者，**具体的装饰者都要继承它**，所以在该类的子类下都是用来装饰别的流的，也就是处理类

    

-   **BufferedInputStream：**

    缓冲流，对处理流进行装饰，增强，内部会有一个缓存区，用来存放字节，每次都是将**缓存区存满然后发送，而不是一个字节或两个字节这样发送**, 效率更高

    

-   **DataInputStream：**

    数据输入流，它是用来装饰其它输入流，它**允许应用程序以与机器无关方式从底层输入流中读取基本 Java 数据类型**

    

-   **FileInputSream：**

    文件输入流。它通常用于**对文件进行读取操作**

    

-   **File：**

    对指定目录的文件进行操作.

    >   <br/>
    >
    >   **注意: 该类虽然是在IO包下，但是并不继承自四大基础类**

    

-   **ObjectInputStream：**

    对象输入流，用来提供对基本数据或对象的持久存储, 通俗点讲，也就是能直接**传输反序列化的对象**（反序列化中使用）

<br/>

**② 输出字节流OutputStream**

![OutputStream.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/OutputStream.png)

OutputStream 是**所有的输出字节流的父类**，它是一个抽象类

-   **ByteArrayOutputStream, FileOutputStream:** 是两种基本的介质流，它们分别向Byte 数组、和本地文件中写入数据

    

-   **PipedOutputStream:** 向与其它线程共用的管道中写入数据

    

-   **FilterOutputStream和所有他的子类都是装饰流**

    

-   **ObjectOutputStream: 序列化中使用**

<br/>

**③ 字符输入流Reader**

![Reader.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/Reader.png)

在上面的继承关系图中可以看出：

-   **Reader是所有的输入字符流的父类**，它是一个抽象类

    

-   **CharArrayReader, StringReader**(图中未显示)是两种基本的介质流，它们分别**从Char 数组、String中读取数据**

    

-   **PipedReader** 是从**与其它线程共用的管道中读取数据**

    

-   **BufferedReader** 为了提供读的效率而设计的一个包装类，它可以包装字符流。可以从字符输入流中读取文本，缓冲各个字符，从而实现字符、数组和行的高效读取

    

-   **FilterReader** 是所有自定义具体装饰流的父类，其子类PushbackReader 对Reader 对象进行装饰，会增加一个行号

    

-   **InputStreamReader** 是一个连接字节流和字符流的桥梁，它**将字节流转变为字符流**

    

-   **FileReader** 文件读入流, 在其源代码中使用了将FileInputStream 转变为Reader 的方法

><br/>
>
>**小结:** Reader 中各个类的用途和使用方法基本和InputStream 中的类使用一致

<br/>

**④ 字符输出流Writer**

![Writer.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/Writer.png)

在上面的关系图中可以看出：

-   **Writer 是所有的输出字符流的父类**，它是一个抽象类

    

-   **CharArrayWriter和StringWriter** 是两种基本的介质流，它们分别**向Char 数组、String 中写入数据**

    

-   **PipedWriter 是向与其它线程共用的管道中写入数据**

    

-   **BufferedWriter** 是一个装饰器**为Writer 提供缓冲功能**

    

-   **PrintWriter** 和PrintStream 极其类似，功能和使用也非常相似

    

-   **OutputStreamWriter 是OutputStream 到Writer 转换的桥梁**，它的子类FileWriter 其实就是一个实现此功能的具体类, 功能和使用和OutputStream 极其类似

><br/>
>
>**小结: 字节流和字符流的使用场景**
>
>-   字节流一般用来处理图像，视频，以及PPT，Word类型的文件
>
>-   字符流一般用于处理纯文本类型的文件，如TXT文件等
>
>**字节流可以用来处理纯文本文件，但是字符流不能用于处理图像视频等非文本类型的文件**

<br/>

### **6. 字符流与字节流转换**

**① 转换流的作用**

<font color="#ff0000">例如: 文本文件在硬盘中以字节流的形式存储时，通过InputStreamReader读取后转化为字符流给程序处理，程序处理的字符流通过OutputStreamWriter转换为字节流保存</font>

<br/>

**② 转换流的特点**

-   是字符流和字节流之间的桥梁
-   可对读取到的字节数据经过指定编码转换成字符
-   可对读取到的字符数据经过指定编码转换成字节

<br/>

**③ 何时使用转换流**

-   **当字节和字符之间有转换动作时**
-   **流操作的数据需要编码或解码时**

<br/>

**④ 具体的对象体现**

-   InputStreamReader:字节到字符的桥梁, 有构造方法InputStreamReader(InputStream in): 将字节流以字符流输入
-   OutputStreamWriter:字符到字节的桥梁, 有构造方法OutputStreamWriter(OutStream out):将字节流以字符流输出

>   <br/>
>
>   **说明: 这两个流对象是字符体系中的成员，它们有转换作用，本身又是字符流，所以在构造的时候需要传入字节流对象进来**

 <br/>

### **7. 字节流和字符流的区别**

字节流是最基本的，所有的InputStream和OutputStream的子类都是字节流, 主要用在处理二进制数据，它是按字节来处理的

但实际中很多的数据是文本，又提出了字符流的概念，它是按**虚拟机的encode来处理**，也就是要进行字符集的转化这两个之间通过 InputStreamReader,OutputStreamWriter来关联**(实际上是通过byte[]和String来关联)**

><br/>
>
>**小贴士: 在实际开发中出现的汉字问题实际上都是在字符流和字节流之间转化不统一而造成的**

在从字节流转化为字符流时，实际上就是byte[]转化为String时，`public String(byte bytes[], String charsetName)`有一个关键的参数字符集编码:

如果我们省略了，那系统就用操作系统的lang而在字符流转化为字节流时，实际上当String转化为byte[]时: `byte[] String.getBytes(String charsetName)`也是一样的道理

>   <br/>
>
>   **小结:**
>
>   **① 字节流没有缓冲区，是直接输出的，而字符流是输出到缓冲区的**
>
>   因此在输出时，字节流不调用colse()方法时，信息已经输出了，而字符流只有在若未将缓冲区装满、调用close()方法关闭缓冲区时或者手动调用flush()方法刷新缓冲区，信息才输出;
>
>   **② 读写单位不同：****字节流以字节（8bit）为单位，字符流以字符为单位**，根据码表映射字符，一次可能读多个字节
>
>   **③ 处理对象不同：**字节流能处理所有类型的数据（如图片、avi等），而字符流只能处理字符类型的数据
>
>   **结论：只要是处理纯文本数据，就优先考虑使用字符流。除此之外都使用字节流**

<br/>

### **8. System类对IO的支持**

在System类中提供了以下的几个静态对象:

|              **名称**               |       **描述**       |
| :---------------------------------: | :------------------: |
| public static final PrintStream out | 对应标准输出, 显示器 |
| public static final PrintStream err | 对应错误输出, 显示器 |
| public static final InputStream in  |  对应标准输入, 键盘  |

>   <br/>
>
>   **备注: 标准I/O**
>
>   Java程序可通过命令行参数与外界进行简短的信息交换，同时，也规定了与标准输入、输出设备，如键盘、显示器进行信息交换的方式。而通过文件可以与外界进行任意数据形式的信息交换

 <br/>

## 二. IOStream中的装饰流

BufferedReader, BufferedWriter,BufferedInputStream, BufferedOutputsStream，都要包上一层节点流

也就是说装饰流是在节点流的基础之上进行的，而带有Buffered的流又称为缓冲流，缓冲流处理文件的输入输出的速度是最快的, 所以一般缓冲流的使用比较多

### **1. 什么是装饰者模式？**

装饰者中拥有被装饰者的实例，然后有什么具体的装饰我们都另写一个类来继承该装饰者，当我们需要该装饰时，就new出该类来，然后将其被装饰者当作参数传递进去(类似于代理模式)

![装饰者模式.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/装饰者模式.png)

现在来看看一个具体的实例: 我们需要制作一份鸡腿堡，流程是怎样的呢？

① 先有基本原料，也就是两块面包，这是不管做什么汉堡都需要的

② 做什么汉堡，取决于加什么材料，比如生菜，鸡肉等，所以根据材料来做汉堡，想做什么汉堡就加什么材料

③ 所有材料加完之后，直接计算价格即可

换一种汉堡，也不需要改源码，什么也不需要, 只要将汉堡传入不同的构造器即可

![装饰者模式2.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/装饰者模式2.png)

<br/>

### **2. Scanner类**

 Java 5添加了java.util.Scanner类，这是一个用于扫描输入文本的类, 它是以前的StringTokenizer和Matcher类之间的某种结合

由于任何数据都必须通过同一模式的捕获组检索或通过使用一个索引来检索文本的各个部分, 于是可以结合使用正则表达式和从输入流中检索特定类型数据项的方法。除了能使用正则表达式之外，Scanner类还可以任意地对字符串和基本类型(如int和double)的数据进行分析

><br/>
>
>**小贴士: 借助于Scanner，可以针对任何要处理的文本内容编写自定义的语法分析器**

Scanner套接字节流或字符流：

-   **字节流的套接：**在Scanner的构造方法中Scanner(InputStream source)，InputStream只要经过适当的套接，总能获得你想要的流接口

    

-   **字符流的套接：**Scanner(Readable source)，你需要使用接口Readable，该接口表示`具有read()方法的某种东西`，查看Readable接口的API你可以发现你想要的带有Reader的类基本都在其中

<br/>

><br/>
>
>**总结:**
>
>① InputStream类的功能不足被Scanner解决了
>
>② OutputStream类的功能不足被PrintStream解决了
>
>③ Reader类功能不足被BufferReader解决了
>
>④ Writer类的功能不足被PrintWriter解决了
>
>输出数据用PrintStream, Printwriter
>
>读取数据用Scanner其次是BufferReader











<br/>

