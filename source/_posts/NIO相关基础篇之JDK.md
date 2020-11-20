---
title: NIO相关基础篇之JDK
toc: true
date: 2019-09-25 15:52:54
cover: http://ckimg.baidu.com/course/2017-02/04/fe7122fba4ca2e6071d7e2571373d419.jpg
categories: IO基础
tags: [NIO]
description: 本篇讲述了Java NIO的相关知识.
---

最近在看《Netty In Action》, 发现里面好多东西看不懂, 实际上是Java IO相关的知识太少了! 尤其是Java 1.4之后推出的NIO. 所以在网上搜集了资料, 在这里整理一下关于Java NIO的相关知识.

-   Java IO体系以及IO相关主题
-   什么是NIO? NIO与OIO(Old IO)/IO的区别是什么?
-   Buffer(缓冲区): 视图缓存区类以及相关问题, Buffer的属性, 使用
-   Channel(通道): 通道的种类, 如何获取通道, 使用transferTo连接通道
-   FileLock(文件锁): 文件锁lock()与tryLock()
-   Selector(选择器): 选择器的种类与方法, SelectionKey的四个重要常量
-   简单介绍AIO
-   .......

代码实例: https://github.com/JasonkayZK/Java_Samples/tree/java-nio

<br/>

<!--more-->

## NIO相关基础篇之JDK

### 零. 前言

现在使用NIO的场景越来越多，很多网上的技术框架或多或少的使用NIO技术，譬如Tomcat，Jetty。学习和掌握NIO技术已经不是一个JAVA攻城狮的加分技能，而是一个必备技能!

<br/>

#### 1. Java IO体系

先来自顶向下看一下整个Java的IO体系:

-   Java的IO体系：
    -   旧IO
    -   新IO：nio，用ByteBuffer和FileChannel读写
    -   nio通道管理：Selector
    -   Okio：io的封装，好像不关nio的事
    -   Netty：目的是快速的实现任何协议的server和client端 
        -   所以说你可以用netty通过channel等实现一个httpclient，和URLConnection平级
        -   这个课题太大了，应该分层次学： 
            -   第一层是官方的文档，写几个helloworld
            -   第二层就是官方的example，研究server和client
            -   第三层是权威指南，研究TCP，UDP等的常见问题，谷歌的protobuf，自己实现http服务器等
        -   github：https://github.com/netty/netty
    -   其他： 
        -   Gzip
        -   大文件读写，如2G
        -   文件锁

<br/>

#### 2. IO相关主题

-   主题：
    -   通道和缓冲器：提高读写速度，Channel，ByteBuffer，速度怎么提高的 
        -   ByteBuffer的操作是很底层的，底层就快，底层怎么就快
        -   ByteBuffer倾向于大块的操作字节流，大块就快
    -   异步IO：提高线程的利用率，增加系统吞吐量，selector，key等，但以牺牲实时性为代价（折衷是永恒不变的主题）
        -   channel管理：向Selector注册Channel，然后调用它的select()方法。这个方法会一直阻塞到某个注册的通道有事件就绪 
            -   Selector允许单线程处理多个 Channel。如果你的应用打开了多个连接（通道），但每个连接的流量都很低，使用Selector就会很方便。例如，在一个聊天服务器中
        -   怎么就牺牲实时性了，一组IO，轮询看有没有可读信息，所以一个IO来消息了，不会立刻就轮询到它
        -   所以负责轮询IO的线程，读到消息就得立刻分发出去，尽量不能有耗时操作
        -   特别注意： 
            -   Channel和Selector配合时，必须channel.configureBlocking(false)切换到非阻塞模式
            -   而FileChannel没有非阻塞模式，只有Socket相关的Channel才有

<br/>

需要注意的是: <font color="#ff0000">`java.nio.*`包的引入是为了提高速度, 并且旧的IO包已经用nio重新实现过，所以即使你不用nio，也已经收益了!</font>



<br/>

-----------



### 一. 什么是NIO

Java NIO（ New IO） 是从Java 1.4版本开始引入的一个新的IO API，可以替代标准的Java IO API。NIO与原来的IO有同样的作用和目的，但是使用的方式完全不同， NIO支持面向缓冲区的、基于通道的IO操作。 NIO将以更加高效的方式进行文件的读写操作。

<br/>

**NIO与OIO的主要区别**

|           IO            |             NIO             |
| :---------------------: | :-------------------------: |
| 面向流(Stream Oriented) | 面向缓冲区(Buffer Oriented) |
|   阻塞IO(Blocking IO)   |  非阻塞IO(Non Blocking IO)  |
|          (无)           |      选择器(Selectors)      |

-   Channels and Buffers（通道和缓冲区）：标准的IO基于字节流和字符流进行操作的，而NIO是基于通道（Channel）和缓冲区（Buffer）进行操作，数据总是从通道读取到缓冲区中，或者从缓冲区写入到通道中。
-   Asynchronous IO（异步IO）：Java NIO可以让你异步的使用IO，例如：当线程从通道读取数据到缓冲区时，线程还是可以进行其他事情。当数据被写入到缓冲区时，线程可以继续处理它。从缓冲区写入通道也类似。
-   Selectors（选择器）：Java NIO引入了选择器的概念，选择器用于监听多个通道的事件（比如：连接打开，数据到达）。因此，单个的线程可以监听多个数据通道。



<br/>

-----------------



### 二. 缓冲区: Buffer

通过上面NIO与普通IO的主要区别也可以看到<font color="#ff0000">在基本的IO操作中所有的操作都是基于流进行操作的，而在NIO中所有的操作都是*基于缓冲区*操作的!</font>

<font color="#ff0000">NIO所有的读写操作都是通过缓存区来进行完成，缓冲区（Buffer）是一个线性的、有序的数据集，只能容纳特定的数据类型（基本就是基本数据类型对应的Buffer或者其子类;</font>

<br/>

#### 1. 各数据类型的视图缓存区类

|   缓存区类   |        相关描述        |
| :----------: | :--------------------: |
|  ByteBuffer  |    存储字节的Buffer    |
|  CharBuffer  |    存储字符的Buffer    |
| ShortBuffer  |   存储短整型的Buffer   |
|  IntBuffer   |    存储整型的Buffer    |
|  LongBuffer  |   存储长整型的Buffer   |
| FloatBuffer  | 存储单精度浮点型Buffer |
| DoubleBuffer | 存储双精度浮点型Buffer |

<br/>

**备注：**看到上面这几类是不是想起了JAVA的8种基本数据类型，**唯一缺少boolean**对于的类型。

##### 为什么boolean不需要缓存呢？

根据描述规范中数字的内部表示和存储，boolean所占位数1bit（取值只有true或者false），由于字节(byte)是操作系统和所有I/O设备使用的基本数据类型，所以基本都是以字节或者连续的一段字节来存储表示，所以就没有boolean，感觉也没有必要boolean类型的缓存操作（像RocketMQ源码里面可能把一个Int里面的某位来表示boolean，其他位继续来存储数据.

<font color="#ff0000">ByteBuffer是很底层的类，直接存储未加工的字节</font>

ByteBuffer系列的类继承关系挺有意思，可以研究研究

ByteArrayBuffer是其最通用子类，一般操作的都是ByteArrayBuffer

ByteBuffer.asLongBuffer(), asIntBuffer(), asDoubleBuffer()等一系列

-   不多说：
    -   ByteBuffer底层是一个byte[]，get()方法返回一个byte，1字节，8bit，10字节可以get几次？10次
    -   ByteBuffer.asIntBuffer()得到IntBuffer，底层是一个int[]，get()方法返回一个int，还是10字节，可以get几次？
    -   同理，还有ShortBuffer, LongBuffer, FloatBuffer, DoubleBuffer，这些就是ByteBuffer的一个视图，所以叫视图缓冲器
    -   asIntBuffer时，如果ByteBuffer本身有5个byte，则其中前4个会变成IntBuffer的第0个元素，第5个被忽略了，但并未被丢弃
    -   往新的IntBuffer放数据（put(int)），默认时会从头开始写，写入的数据会反映到原来的ByteBuffer上
-   总结：
    -   `具体也说不明白了，其实就是你有什么类型的数据，就用什么类型的Buffer`
    -   但直接往通道读写的，肯定是ByteBuffer，所以首先得有个ByteBuffer，其他视图Buffer，就得从ByteBuffer来
    -   怎么从ByteBuffer来呢，ByteBuffer.asIntBuffer()等方法

<br/>

##### 字符流：CharBuffer和Charset(byte[]和编码问题)

ByteBuffer是最原始的，其实就是字节流，适用于二进制数据的读写，图片文件等.

但我们更常用的，其实是字符串

-   字符串涉及到的类：
    -   CharBuffer：注意，Channel是直接和ByteBuffer交流，所以CharBuffer只能算是上层封装
    -   Charset：编码相关，字节流到字符串，肯定会有编码相关的问题
    -   CharBuffer.toString()：得到字符串
-   怎么得到CharBuffer
    -   方法1：ByteBuffer.asCharBuffer()，局限在于使用系统默认编码
    -   方法2：Charset.forName(“utf-8”).decode(buff)，相当于new String(buff.array(), “utf-8”)的高级版 
        -   相对的，Charset.forName(“utf-8”).encode(cbuff)，返回个ByteBuffer，就相当于String.getBytes(“utf-8)
-   CharBuffer读写
    -   put(String)：写
    -   toString()：读，就拿到了字符串

**例: 获得编码相关的一些信息**

```java
package nio.basic.charset;

import java.nio.charset.Charset;
import java.util.Iterator;
import java.util.SortedMap;

public class ShowCharSetDemo {

    public static void main(String[] args) {
        SortedMap<String, Charset> charsets = Charset.availableCharsets();
        Iterator<String> iterator = charsets.keySet().iterator();
        while (iterator.hasNext()) {
            String csName = iterator.next();
            System.out.print(csName);
            Iterator aliases = charsets.get(csName).aliases().iterator();
            if (aliases.hasNext())
                System.out.print(": ");
            while (aliases.hasNext()) {
                System.out.print(aliases.next());
                if (aliases.hasNext())
                    System.out.print(", ");
            }
            System.out.println();
        }
    }
}

```

输出:

```
Big5: csBig5
Big5-HKSCS: big5-hkscs, big5hk, Big5_HKSCS, big5hkscs
CESU-8: CESU8, csCESU-8
EUC-JP: csEUCPkdFmtjapanese, x-euc-jp, eucjis, Extended_UNIX_Code_Packed_Format_for_Japanese, euc_jp, eucjp, x-eucjp
EUC-KR: ksc5601-1987, csEUCKR, ksc5601_1987, ksc5601, 5601, euc_kr, ksc_5601, ks_c_5601-1987, euckr
GB18030: gb18030-2000
GB2312: gb2312, euc-cn, x-EUC-CN, euccn, EUC_CN, gb2312-80, gb2312-1980
GBK: CP936, windows-936
IBM-Thai: ibm-838, ibm838, 838, cp838
......
```

<font color="#ff0000">ByteBuffer.asCharBuffer()的局限：没指定编码，容易乱码</font>

<font color="#ff0000">asCharBuffer()一般情况下不能用: 会把ByteBuffer转为CharBuffer，但用的是系统默认编码</font>

<br/>

##### 字节序

简介： 

-   高位优先，Big Endian，最重要的字节放地址最低的存储单元，ByteBuffer默认以高位优先，网络传输大部分也以高位优先
-   低位优先，Little Endian
-   ByteBuffer.order()方法切换字节序 
    -   ByteOrderr.BIG_ENDIAN
    -   ByteOrderr.LITTLE_ENDIAN
-   对于00000000 01100001，按short来读，如果是big endian，就是97， 以little endian，就是24832



<br/>

#### 2. Buffer的使用

##### **分配空间**

-   ByteBuffer.allocate(len)的大小问题，大块的移动数据是快的关键，所以长度很重要，但没啥标准，根据情况定吧，1024（1K）小了

<br/>

##### **读数据**

-   flip()方法

-   -   将Buffer从写模式切换到读模式
    -   调用flip()方法会将position设回0，并将limit设置成之前position的值。
    -   buf.flip();

-   buf.get()

-   -   读取数据

-   Buffer.rewind()

-   -   将position设回0，所以你可以重读Buffer中的所有数据
    -   limit保持不变，仍然表示能从Buffer中读取多少个元素（byte、char等）

-   Buffer.mark()方法，可以标记Buffer中的一个特定position。之后可以通过调用reset方法回滚!

-   Buffer.reset()方法，恢复到Buffer.mark()标记时的position。

-   clear()方法会：

-   -   清空整个缓冲区。
    -   position将被设回0，limit被设置成 capacity的值
    -   ByteBuffer.flip(), clear()比较拙劣，但这正是为了最大速度付出的代价

-   compact()方法：

-   -   只会清除已经读过的数据；任何未读的数据都被移到缓冲区的起始处，新写入的数据将放到缓冲区未读数据的后面。
    -   将position设到最后一个未读元素正后面，limit被设置成 capacity的值。

<br/>

##### **写数据**

-   buf.put(127);
-   ByteBuffer.wrap(byte[])，不会再复制数组，而是直接以参数为底层数组，快
-   复制文件时，一个ByteBuffer对象会不断从src的channel来read，并写入dest的channel，注意： 
    -   src.read(buff);  buff.flip();  dest.write(buff); buff.clear()
    -   ByteBuffer必须clear了，才能重新从Channel读

**例: 交换相邻的两个字符串**

```java
/**
 * 给一个字符串，交换相邻的两个字符
 */
private static void symmetricScramble(CharBuffer buffer) {
    while (buffer.hasRemaining()) {
        buffer.mark();
        char c1 = buffer.get();
        char c2 = buffer.get();
        buffer.reset();
        buffer.put(c2).put(c1);
    }
}

/*
思考：如果没有mark和reset功能，你怎么做？用postion方法记录和恢复刚才位置
*/
private static void symmetricScramble2(CharBuffer buffer) {
    while (buffer.hasRemaining()) {
        int position = buffer.position();
        char c1 = buffer.get();
        char c2 = buffer.get();
        buffer.position(position);
        buffer.put(c2).put(c1);
    }
}
```



<br/>



#### 3. 缓冲区的基本属性

如图所示为缓冲区的细节图:

![Buffer_Structure](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/Buffer_Structure.png)

<br/>

-   mark：标记，mark方法记录当前位置，reset方法回滚到上次mark的位置
-   position：位置，当前位置，读和写都是在这个位置操作，并且会影响这个位置，position方法可以seek
-   limit：界限， 
    -   作为读的界限时：指到buffer当前被填入了多少数据，get方法以此为界限， 
        -   flip一下，limit才有值，指向postion，才能有个读的界限
    -   作为写的界限时： 
        -   allocate或者clear时，直接可写，limit指向capacity，表示最多写到这
        -   wrap时，直接可读，所以position是0，limit是指到之后，capacity也是指到最后，直接进入可读状态
-   capacity：容量，指到buffer的最后，这不是字节数，而是能写入的个数，对于ByteBuffer，就是byte个数，对于IntBuffer，就是int个数 
    -   allocate方法的参数就是capacity 
        -   所以，可以推断一下，ByteBuffer.capacity = 5时，如果转成IntBuffer，capacity是1，不会指向最后，而是留出了最后一个字节，被忽略了，没法通过Int读写

>   **备注：**标记、 位置、 限制、 容量遵守以下不变式： 0 <= position <= limit <= capacity。

<br/>

对应的方法为:

![buffer_method](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/buffer_method.png)

<br/>



**为了更形象解释上面重要属性，准备配上简单代码以及图来进行说明就容易懂了。**

```java
package nio.basic.buffer;

import java.nio.IntBuffer;

public class BufferModelDemo {

    public static void main(String[] args) {
        //第一步，获取IntBuffer，通过IntBuffer.allocate操作
        IntBuffer buf = IntBuffer.allocate(10) ;    // 准备出10个大小的缓冲区

        //第二步未操作前输出属性值
        System.out.println("position = " + buf.position() + "，limit = " + buf.limit() + "，capacty = " + buf.capacity()) ;

        //第三步进行设置数据
        buf.put(6) ;    // 设置一个数据
        buf.put(16) ;    // 设置二个数据

        //第四步操作后输出属性值
        System.out.println("position = " + buf.position() + "，limit = " + buf.limit() + "，capacty = " + buf.capacity()) ;

        //第五步将Buffer从写模式切换到读模式 postion = 0 ,limit = 原本position
        buf.flip() ;

        //第六步操作后输出属性值
        System.out.println("position = " + buf.position() + "，limit = " + buf.limit() + "，capacty = " + buf.capacity()) ;
    }

}

```

程序输出结果:

```java
    position = 0，limit = 10，capacty = 10
    position = 2，limit = 10，capacty = 10
    position = 0，limit = 2，capacty = 10
```

查看下图来进行说明：

![buffer_1](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/buffer_1.png)

![buffer_2](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/buffer_2.png)

![buffer_3](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/buffer_3.png)

![buffer_4](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/buffer_4.png)



<br/>

-------------



### 三. 通道: Channel

通道表示打开到 IO 设备(例如：文件、套接字)的连接。若需要使用 NIO 系统，需要获取用于连接 IO 
设备的通道以及用于容纳数据的缓冲区。然后操作缓冲区，对数据进行处理。Channel 负责传输， Buffer 负责存储。通道是由 
java.nio.channels 包定义的。 Channel 表示 IO 源与目标打开的连接。Channel 类似于传统的“流”。只不过 
Channel本身不能直接访问数据， Channel 只能与Buffer 进行交互。

<font color="#ff0000">通道都是依靠操作缓存区完成全部的功能的。</font>

<br/>

#### 1. Java中所有已知 Channel 实现类

-   AbstractInterruptibleChannel
-   AbstractSelectableChannel
-   DatagramChannel
-   FileChannel
-   Pipe.SinkChannel
-   Pipe.SourceChannel
-   SelectableChannel
-   ServerSocketChannel
-   SocketChannel



**常用的有入下几个：**

-   FileChannel：用于读取、写入、映射和操作文件的通道。
-   DatagramChannel：通过 UDP 读写网络中的数据通道。
-   SocketChannel：通过 TCP 读写网络中的数据。
-   ServerSocketChannel：可以监听新进来的 TCP 连接，对每一个新进来的连接都会创建一个 SocketChannel。

<br/>

#### 2. 获取通道

获取通道的一种方式是<font color="#ff0000">对支持通道的对象调用getChannel() 方法.</font> 支持通道的类如下：

-   FileInputStream
-   FileOutputStream
-   RandomAccessFile
-   DatagramSocket
-   Socket
-   ServerSocket

获取通道的其他方式是使用 Files 类的静态方法 newByteChannel() 获取字节通道。或者通过通道的静态方法 open() 打开并返回指定通道。

<br/>

#### 3. FileChannel实例

为了更形象解释说明的Channel，下面准备以FileChannel的一些简单代码进行说明就容易懂了。准备以FileOutputStream类为准，这两个类都是支持通道操作的。

```java
package nio.basic.channel.fileChannel;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;

public class FileChannelDemo {

    public static void main(String[] args) {
        String[] info = {"Hello ", "world", " by ", "Java", " NIO"};
        File file = new File("src/testFileChannel.txt");
        FileOutputStream output = null;
        FileChannel fout = null;

        try {
            output = new FileOutputStream(file);
            fout = output.getChannel(); // 得到输出的通道
            ByteBuffer buffer = ByteBuffer.allocate(1024);

            for (String s : info) {
                buffer.put(s.getBytes()); // 字符串变为字节数组放进缓冲区之中
            }
            buffer.flip(); // 切换模式准备输出
            fout.write(buffer); // 输出缓冲区的内容
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (fout != null) {
                try {
                    fout.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }

            if (output != null) {
                try {
                    output.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

}

```

程序最终在src文件夹下输出文件:

```
Hello world by Java NIO
```

<br/>

#### 4. 连接通道: TransferTo

nio通过大块数据的移动来加快读写速度，而这个大小都由ByteBuffer来控制， 其实还有方法可以直接将读写两个Channel相连.

这也是<font color="#ff0000">实现文件复制的更好的方法</font>

```java
public class TransferTo {
    public static void main(String[] args) throws Exception {
        if (args.length != 2) {
            System.out.println("arguments: sourcefile destfile");
            System.exit(1);
        }
        FileChannel in = new FileInputStream(args[0]).getChannel(), out = new FileOutputStream(
                args[1]).getChannel();
        in.transferTo(0, in.size(), out);
        // 或者：
        // out.transferFrom(in, 0, in.size());
    }
} 
```



<br/>

--------------



### 四. 文件锁: FileLock

文件锁和其他我们了解并发里面的锁很多概念类似，<font color="#ff0000">当多个人同时操作一个文件的时候，只有第一个人可以进行编辑，其他要么关闭（等第一个人操作完成之后可以操作），要么以只读的方式进行打开。</font>

在java nio中提供了新的锁文件功能，<font color="#ff0000">当一个线程将文件锁定之后，其他线程无法操作此文件，文件的锁操作是使用FileLock类来进行完成的，此类对象需要依赖FileChannel进行实例化。</font>



#### 1. 文件锁的两种方式

-   共享锁：允许多个线程进行文件读取。
-   独占锁：只允许一个线程进行文件的读写操作。

<font color="#ff0000">文件锁定以整个 Java 虚拟机来保持。但它们**不适用于**控制同一虚拟机内多个线程对文件的访问。多个并发线程可安全地使用文件锁定对象。</font>

<br/>

#### 2. Java文件依赖FileChannel的主要涉及的方法

|                             方法                             |                             说明                             |
| :----------------------------------------------------------: | :----------------------------------------------------------: |
|                            lock()                            |  获取对此通道的文件的<font color="#0000ff">独占锁定</font>   |
|        lock(long position, long size, boolean shared)        | 获取此通道的文件<font color="#0000ff">给定区域上的锁定</font> |
|                 tryLock() throws IOException                 |               试图获取对此通道的文件的独占锁定               |
| tryLock(long position, long size, boolean shared) throws IOException |             试图获取对此通道的文件给定区域的锁定             |

-   lock()等同于lock(0L, Long.MAX_VALUE, false)

-   tryLock()等同于tryLock(0L, Long.MAX_VALUE, false)

<br/>

#### 3. lock()和tryLock()的区别

-   lock()阻塞的方法，锁定范围可以随着文件的增大而增加; 

    无参lock()默认为独占锁;

    有参lock(0L, Long.MAX_VALUE, true)为共享锁;

-   tryLock()非阻塞,当未获得锁时,返回null;

    无参tryLock()默认为独占锁；

    有参tryLock(0L, Long.MAX_VALUE, true)为共享锁。

**例如:**

```java
package nio.basic.filelock;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;

public class FileLockDemo {

    public static void main(String[] args) {
        File file = new File("src/testFileChannel.txt");
        FileOutputStream output = null;
        FileChannel fout = null;

        try {
            output = new FileOutputStream(file, true);
            fout = output.getChannel(); // 得到通道

            FileLock lock = fout.tryLock(); // 进行独占锁的操作
            if (lock != null) {
                System.out.println(file.getName() + "文件锁定") ;
                Thread.sleep(5000) ;
                lock.release() ;    // 释放
                System.out.println(file.getName() + "文件解除锁定。") ;
            }
        } catch (InterruptedException | IOException e) {
            e.printStackTrace();
        } finally {
            if(fout!=null){
                try {
                    fout.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            if(output!=null) {
                try {
                    output.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

}

```

结果:

```
testFileChannel.txt文件锁定
testFileChannel.txt文件解除锁定。
```



<br/>

----------------



### 五. 选择器: Selector

>   **说明：**
>
>   -   FileChannel是可读可写的Channel，它必须阻塞，**不能用在非阻塞模式中**。
>   -   SocketChannel与FileChannel不同：新的Socket Channel能在**非阻塞模式下**运行并且是可选择的。不再需要为每个socket连接指派线程了。使用新的NIO类，一个或多个线程能管理成百上千个活动的socket连接，使用**Selector**对象可以选择可用的Socket Channel。

以前的Socket程序是阻塞的，服务器必须始终等待客户端的连接，而NIO可以通过Selector完成非阻塞操作。

<font color="#ff0000">其实NIO主要的功能是解决服务端的通讯性能。</font>

#### 1. Selector一些主要方法

|      方法      |                      说明                       |
| :------------: | :---------------------------------------------: |
|     open()     |                打开一个选择器。                 |
|    select()    | 选择一组键，其相应的通道已为 I/O 操作准备就绪。 |
| selectedKeys() |           返回此选择器的已选择键集。            |

<br/>

#### 2. SelectionKey的四个重要常量

|    字段    |              说明              |
| :--------: | :----------------------------: |
| OP_ACCEPT  | 用于套接字接受操作的操作集位。 |
| OP_CONNECT | 用于套接字连接操作的操作集位。 |
|  OP_READ   |    用于读取操作的操作集位。    |
|  OP_WRITE  |    用于写入操作的操作集位。    |

**说明**：<font color="#ff0000">其实四个常量就是Selector监听SocketChannel四种不同类型的事件。</font>

如果你对不止一种事件感兴趣，那么可以用"位或"操作符将常量连接起来，如下： `int interestSet = SelectionKey.OPREAD | SelectionKey.OPWRITE;`

**NIO简单实例**

服务端:

```java
package nio.basic.nio;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.nio.ByteBuffer;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.util.Date;
import java.util.Iterator;
import java.util.Set;

public class Server {

    public static void main(String[] args) throws IOException {
        int port = 8848;
        // 通过open()方法找到Selector
        Selector selector = Selector.open();
        // 打开服务器的通道
        ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();
        // 服务器配置为非阻塞
        serverSocketChannel.configureBlocking(false);
        ServerSocket serverSocket = serverSocketChannel.socket();
        // 进行服务的绑定
        serverSocket.bind(new InetSocketAddress(port));
        // 注册到selector，等待连接
        serverSocketChannel.register(selector, SelectionKey.OP_ACCEPT);
        System.out.println("服务器运行，端口：" + port);

        // 数据缓冲区
        ByteBuffer byteBuffer = ByteBuffer.allocate(1024);
        while (true) {
            if (selector.select() > 0) { // 选择一组键，并且相应的通道已经准备就绪
                Set<SelectionKey> selectionKeys = selector.selectedKeys(); // 取出全部生成的key
                Iterator<SelectionKey> iterator = selectionKeys.iterator();
                while (iterator.hasNext()) {
                    SelectionKey key = iterator.next(); // 取出每一个key
                    if (key.isAcceptable()) {
                        ServerSocketChannel server = (ServerSocketChannel) key.channel();
                        // 接收新连接 和BIO写法类是都是accept
                        SocketChannel client = server.accept();
                        // 配置为非阻塞
                        client.configureBlocking(false);
                        byteBuffer.clear();
                        // 向缓冲区中设置内容
                        byteBuffer.put(("当前的时间为：" + new Date()).getBytes());
                        byteBuffer.flip();
                        // 输出内容
                        client.write(byteBuffer);
                        client.register(selector, SelectionKey.OP_READ);
                    } else if (key.isReadable() && key.isValid()) {
                        SocketChannel client = (SocketChannel) key.channel();
                        byteBuffer.clear();
                        // 读取内容到缓冲区中
                        int readSize = client.read(byteBuffer);
                        if (readSize > 0) {
                            System.out.println("服务器端接受客户端数据:" + new String(byteBuffer.array(), 0, readSize));
                            client.register(selector, SelectionKey.OP_WRITE);
                        }
                    } else if (key.isWritable() && key.isValid()) {
                        SocketChannel client = (SocketChannel) key.channel();
                        byteBuffer.clear();
                        // 向缓冲区中设置内容
                        byteBuffer.put(("向客户端发送消息").getBytes());
                        byteBuffer.flip();
                        // 输出内容
                        client.write(byteBuffer);
                        client.register(selector, SelectionKey.OP_READ);
                    }
                }
                selectionKeys.clear(); // 清除全部的key
            }
        }
    }
}

```

客户端:

```java
package nio.basic.nio;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.SocketChannel;
import java.util.Date;
import java.util.Iterator;
import java.util.Set;

public class Client {

    public static void main(String[] args) throws IOException {
        // 打开socket通道
        SocketChannel socketChannel = SocketChannel.open();
        // 设置为非阻塞方式
        socketChannel.configureBlocking(false);
        // 通过open()方法找到Selector
        Selector selector = Selector.open();
        // 注册连接服务端socket动作
        socketChannel.register(selector, SelectionKey.OP_CONNECT);
        // 连接
        socketChannel.connect(new InetSocketAddress("127.0.0.1", 8848));

        /* 数据缓冲区 */
        ByteBuffer byteBuffer = ByteBuffer.allocate(1024);

        while (true) {
            if ((selector.select()) > 0) { // 选择一组键，并且相应的通道已经准备就绪
                Set<SelectionKey> selectedKeys = selector.selectedKeys();// 取出全部生成的key
                Iterator<SelectionKey> iter = selectedKeys.iterator();
                while (iter.hasNext()) {
                    SelectionKey key = iter.next(); // 取出每一个key
                    if (key.isConnectable()) {
                        SocketChannel client = (SocketChannel) key.channel();
                        if (client.isConnectionPending()) {
                            client.finishConnect();
                            byteBuffer.clear();
                            // 向缓冲区中设置内容
                            byteBuffer.put(("isConnect,当前的时间为：" + new Date()).getBytes());
                            byteBuffer.flip();
                            // 输出内容
                            client.write(byteBuffer);
                        }
                        client.register(selector, SelectionKey.OP_READ);
                    } else if (key.isReadable() && key.isValid()) {
                        SocketChannel client = (SocketChannel) key.channel();
                        byteBuffer.clear();
                        // 读取内容到缓冲区中
                        int readSize = client.read(byteBuffer);
                        if (readSize > 0) {
                            System.out.println("客户端接受服务器端数据:" + new String(byteBuffer.array(), 0, readSize));
                            client.register(selector, SelectionKey.OP_WRITE);
                        }
                    } else if (key.isWritable() && key.isValid()) {
                        SocketChannel client = (SocketChannel) key.channel();
                        byteBuffer.clear();
                        // 向缓冲区中设置内容
                        byteBuffer.put(("nio文章学习很多！").getBytes());
                        byteBuffer.flip();
                        // 输出内容
                        client.write(byteBuffer);
                        client.register(selector, SelectionKey.OP_READ);
                    }
                }
                selectedKeys.clear(); // 清楚全部的key
            }

        }

    }
}

```

运行结果:

```
# Server
服务器运行，端口：8848
服务器端接受客户端数据:isConnect,当前的时间为：Thu Sep 26 10:21:06 CST 2019
服务器端接受客户端数据:nio文章学习很多！
服务器端接受客户端数据:nio文章学习很多！
服务器端接受客户端数据:nio文章学习很多！
服务器端接受客户端数据:nio文章学习很多！
服务器端接受客户端数据:nio文章学习很多！
.......

# Client
客户端接受服务器端数据:当前的时间为：Thu Sep 26 10:21:06 CST 2019
客户端接受服务器端数据:向客户端发送消息
客户端接受服务器端数据:向客户端发送消息
客户端接受服务器端数据:向客户端发送消息
客户端接受服务器端数据:向客户端发送消息
客户端接受服务器端数据:向客户端发送消息
客户端接受服务器端数据:向客户端发送消息
客户端接受服务器端数据:向客户端发送消息
客户端接受服务器端数据:向客户端发送消息
.......
```

上面仅仅是一个demo，其实使用nio开发复杂度很高的，需要考虑：

-   链路的有效性校验机制（安全认证、半包和粘包等);
-   链路的断连重连机制（网络闪断重连）
-   可靠性设计（心跳检测，消息重发、黑白名单）
-   可扩展性的考虑等等，

这些都是很复杂，那里搞不好就容易出错，而很多问题netty已经帮我们解决了，所以有必要好好看看netty了!



<br/>

------------



### 六. 简单聊几句AIO

虽然NIO在网络操作中提供了非阻塞方法，但是NIO的IO行为还是同步的，对于NIO来说，我们的业务线程是在IO操作准备好时，才得到通知，接着就有这个线程自行完成IO操作，但是IO操作的本身其实还是同步的。

AIO是异步IO的缩写，相对与NIO来说又进了一步，它不是在IO准备好时再通知线程，而是在IO操作完成后在通知线程，所以AIO是完全不阻塞的，我们的业务逻辑看起来就像一个回调函数了。



<br/>

-------------------



### 七. 总结

本文从Java IO体系开始, 自顶向下讲述了与IO相关的主题, 之后主要讲述了:

-   什么是NIO? NIO与OIO(Old IO)/IO的区别是什么?

-   Buffer(缓冲区): 视图缓存区类以及相关问题, Buffer的属性, 使用

-   Channel(通道): 通道的种类, 如何获取通道, 使用transferTo连接通道

-   FileLock(文件锁): 文件锁lock()与tryLock()

-   Selector(选择器): 选择器的种类与方法, SelectionKey的四个重要常量

-   简单介绍AIO

    

<br/>

-----------------



### 附录

文章参考:

-   [NIO相关基础篇一](https://mp.weixin.qq.com/s?__biz=MzU2NjIzNDk5NQ==&mid=2247483837&idx=1&sn=b51954fd4644feeddde61daed5d273b6&scene=21#wechat_redirect)
-   [NIO相关基础篇二](https://mp.weixin.qq.com/s?__biz=MzU2NjIzNDk5NQ==&mid=2247483858&idx=1&sn=a18f5f37dacad171becf5aaf905d97b6&scene=21#wechat_redirect)
-   [Java 8：活好水多——Java 的新IO （nio）](https://blog.csdn.net/cowthan/article/details/53563206)
-   [Java NIO？看这一篇就够了！](https://blog.csdn.net/u011381576/article/details/79876754)



代码实例: https://github.com/JasonkayZK/Java_Samples/tree/java-nio



