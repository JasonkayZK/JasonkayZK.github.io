---
title: Java基础总结之六
toc: true
date: 2019-11-22 14:12:59
cover: https://img.paulzzh.tech/touhou/random?3
categories: 面试总结
tags: Java基础
description: 本文是Java面试总结中Java基础篇的第六篇
---

本文是Java面试总结中Java基础篇的第六篇

<br/>

<!--more-->

### 1. 设计4个线程，其中两个线程每次对j增加1，另外两个线程对j每次减少1

以下程序使用ReentrantLock实现, 对j增减的时候没有考虑顺序问题:

```java
public class Test {

    private int j;

    private Lock lock = new ReentrantLock();

    public static void main(String[] args) {
        final Test test = new Test();
        new Thread(test::inc).start();
        new Thread(test::inc).start();
        new Thread(test::dec).start();
        new Thread(test::dec).start();
    }

    public void inc() {
        lock.lock();
        try {
            j++;
            System.out.println(Thread.currentThread().getName() + ", " + "inc: " + j);
        } finally {
            lock.unlock();
        }
    }

    public void dec() {
        lock.lock();
        try {
            j--;
            System.out.println(Thread.currentThread().getName() + ", " + "dec: " + j);
        } finally {
            lock.unlock();
        }
    }

}
```

<br/>

### 2. 介绍Collection框架的结构

Java集合是java 提供的工具包`java.util.*`, 包含了常用的数据结构：集合、链表、队列、栈、数组、映射等。

Java集合主要可以划分为4个部分：

-   List列表;
-   Set集合;
-   Map映射;
-   工具类(Iterator迭代器、Enumeration枚举类、Arrays和Collections)、。

Java集合工具包框架图(如下)：

![Collection框架结构.jpg](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/Collection框架结构.jpg)

 看上面的框架图，先抓住它的主干，即Collection和Map。

**① Collection**

Collection是一个接口，是高度抽象出来的集合，它包含了集合的基本操作和属性。AbstractCollection抽象类，它实现了Collection中的绝大部分函数;

Collection包含了List和Set两大分支。  AbstractList和AbstractSet都继承于AbstractCollection; 具体的List实现类继承于AbstractList，而Set的实现类则继承于AbstractSet。

(1) List是一个**有序**的队列，每一个元素都有它的索引。第一个元素的索引值是0. List的实现类有: LinkedList, ArrayList, Vector, Stack

(2) Set是一个不允许有重复元素的集合. Set的实现类有: HashSet和TreeSet. HashSet依赖于HashMap，它实际上是通过HashMap实现的；TreeSet依赖于TreeMap，它实际上是通过TreeMap实现的。

**② Map**

Map是一个映射接口，即key-value键值对。 

AbstractMap是个抽象类，它实现了Map接口中的大部分API。HashMap，TreeMap，WeakHashMap都是继承于AbstractMap。
   Hashtable虽然继承于Dictionary，但它实现了Map接口。

接下来，再看Iterator。

**③ Iterator**

Iterator是遍历集合的工具，即我们通常通过Iterator迭代器来遍历集合。我们说Collection依赖于Iterator，是因为Collection的实现类都要实现iterator()函数，返回一个Iterator对象. ListIterator是专门为遍历List而存在的。

**④ Enumeration**

再看Enumeration，它是JDK 1.0引入的抽象类。作用和Iterator一样，也是遍历集合；但是Enumeration的功能要比Iterator少。在上面的框图中，Enumeration只能在Hashtable, Vector, Stack中使用。

**⑤ Arrays和Collections**

最后，看Arrays和Collections。它们是操作数组、集合的两个工具类。

<br/>

### 3. ArrayList和Vector的区别

这两个类都实现了List接口（List接口继承了Collection接口），他们都是有序集合，即存储在这两个集合中的元素的位置都是有顺序的，相当于一种动态的数组，我们以后可以按位置索引号取出某个元素，并且其中的数据是允许重复的，这是与HashSet之类的集合的最大不同处，HashSet之类的集合不可以按索引号去检索其中的元素，也不允许有重复的元素。

接着说ArrayList与Vector的区别，这主要包括两个方面:

**① 同步性：**

Vector是线程安全的，也就是说是它的方法之间是线程同步的，而ArrayList是线程序不安全的，它的方法之间是线程不同步的。

如果只有一个线程会访问到集合，那最好是使用ArrayList，因为它不考虑线程安全，效率会高些；如果有多个线程会访问到集合，那最好是使用Vector，因为不需要我们自己再去考虑和编写线程安全的代码。

><br/>
>
>**备注:**
>
>对于Vector&ArrayList、Hashtable&HashMap，要记住线程安全的问题，记住Vector与Hashtable是旧的，是java一诞生就提供了的，它们是线程安全的，ArrayList与HashMap是java2时才提供的，它们是线程不安全的

**② 数据增长：**

ArrayList与Vector都有一个初始的容量大小，当存储进它们里面的元素的个数超过了容量时，就需要增加ArrayList与Vector的存储空间，每次要增加存储空间时，不是只增加一个存储单元，而是增加多个存储单元，每次增加的存储单元的个数在内存空间利用与程序效率之间要取得一定的平衡。

Vector默认增长为原来两倍，而ArrayList的增长策略在文档中没有明确规定（从源代码看到的是增长为原来的1.5倍）。ArrayList与Vector都可以设置初始的空间大小，Vector还可以设置增长的空间大小，而ArrayList没有提供设置增长空间的方法。

><br/>
>
>**备注:**
>
>① Vector默认增长原来的一倍，ArrayList增加原来的0.5倍
>
>② 在阿里巴巴规范中, 规定了对于ArrayList或者Vector这种底层采用数组实现的集合, 在初始化时就要预估并指定容量. 一方面防止开辟过大空间; 另一方面, 防止开辟过小数组不断扩容很影响效率;

<br/>

### 4. HashMap和Hashtable的区别

HashMap是Hashtable的轻量级实现（非线程安全的实现），他们都实现了Map接口，主要区别在于:

-   <font color="#ff0000">① HashMap允许将null作为一个entry的key或者value，而Hashtable不允许</font>

-   ② 最大的不同是，Hashtable的方法是Synchronize的，而HashMap不是，在多个线程访问Hashtable时，不需要自己为它的方法实现同步，而HashMap就必须为之提供外同步; 同时, 由于非线程安全，在只有一个线程访问的情况下，HashMap效率要高于Hashtable

-   <font color="#ff0000">③ HashMap把Hashtable的contains方法去掉了，改成containsValue和containsKey。因为contains方法容易让人引起误解</font>

-   ④ Hashtable基于陈旧的Dictionary类，而HashMap是Java1.2引进的Map interface的一个实现

><br/>
>
>**备注:**
>
>Hashtable和HashMap采用的hash/rehash算法都大概一样，所以性能不会有很大的差异

<br/>

### 5. 说出ArrayList,Vector, LinkedList的存储性能和特性

ArrayList和Vector都是使用数组方式存储数据，此数组元素数大于实际存储的数据以便增加和插入元素，它们都允许直接按序号索引元素，但是插入元素要涉及数组元素移动等内存操作，所以索引数据快而插入数据慢;

Vector由于使用了synchronized方法（线程安全），通常性能上较ArrayList差，而LinkedList使用双向链表实现存储，按序号索引数据需要进行前向或后向遍历，但是插入数据时只需要记录本项的前后项即可，所以插入速度较快。

同时, LinkedList也是线程不安全的，LinkedList提供了一些方法，使得LinkedList可以被当作堆栈和队列来使用。

<br/>

### 6. 两个对象值相同(x.equals(y) == true)，但却可有不同的hash code，这句话对不对?

对, 如下, 我们甚至可以分别重新equals和hashcode方法:

```java
public class Test {

    public static void main(String[] args) {
        HashCodeTest test1 = new Test().new HashCodeTest(1);
        HashCodeTest test2 = new Test().new HashCodeTest(1);
        System.out.println(test1.equals(test2));
        System.out.println("test1: " + test1.hashCode() + ", test2: " + test2.hashCode());
}

    class HashCodeTest {

        private Random random;

        public int i;

        public HashCodeTest(int i) {
            this.i = i;
            random = new Random();
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            HashCodeTest that = (HashCodeTest)o;
            return this.i == that.i;
        }

        @Override
        public int hashCode() {
            return random.nextInt(1000);
        }
    }

}
------- Output -------
true
test1: 268, test2: 557
```

如上定义了一个内部类叫做HashCodeTest, 我们甚至将hashcode函数返回一个随机数! 而使用equals比较时, 他们仍然是相等, 但是显然hashcode一般不同!

><br/>
>
>**注意:**
>
><font color="#ff0000">① 如果对象要保存在HashSet或HashMap中，它们的equals相等，那么，它们的hashcode值就必须相等</font>
>
>② 如果不是要保存在HashSet或HashMap，则与hashcode没有什么关系了，这时候hashcode不等是可以的，例如arrayList存储的对象就不用实现hashcode; 但是应当养成良好的习惯, 同时重写hashcode方法
>
>**阿里巴巴规约规定了: 重写equals方法的同时必须重写hashcode方法**

<br/>

### 7. java中有几种类型的流?JDK为每种类型的流提供了一些抽象类以供继承，请说出他们分别是哪些类?

Java中的流分为两种: `一种是字节流，另一种是字符流`，分别由四个抽象类来表示(每种流包括输入和输出两种所以一共四个): **InputStream，OutputStream，Reader，Writer**, 而字符流继承于**InputStreamReader/OutputStreamWriter**

Java中其他多种多样变化的流均是由它们派生出来的. 

<br/>

### 8. 字节流与字符流的区别

字符流和字节流是根据处理数据的不同来区分的: 字节流按照8位传输，字节流是最基本的，所有文件的储存是都是字节（byte）的储存，在磁盘上保留的并不是文件的字符而是先把字符编码成字节，再储存这些字节到磁盘

**字节流和字符流的区别:**

-   ① 字节流可用于任何类型的对象，包括二进制对象，而字符流只能处理字符或者字符串；
-   ② 字节流提供了处理任何类型的IO操作的功能，但它不能直接处理Unicode字符，而字符流就可以。

读文本的时候用字符流，例如txt文件。读非文本文件的时候用字节流，例如mp3。理论上任何文件都能够用字节流读取，但当读取的是文本数据时，为了能还原成文本你必须再经过一个转换的工序，相对来说字符流就省了这个麻烦，可以有方法直接读取。

 字符流处理的单元为2个字节的Unicode字符，分别操作字符、字符数组或字符串，而字节流处理单元为1个字节， 操作字节和字节数组。所以字符流是由Java虚拟机将字节转化为2个字节的Unicode字符为单位的字符而成的，所以它对多国语言支持性比较好！

><br/>
>
>**备注:**
>
>底层设备永远只接受字节数据，有时候要写字符串到底层设备，需要将字符串转成字节再进行写入。**字符流是字节流的包装**，**字符流则是直接接受字符串**，它内部将串转成字节，再写入底层设备，这为我们向IO设别写入或读取字符串提供了一点点方便。
>
>**字符向字节转换时，要注意编码的问题**，因为字符串转成字节数组，其实是转成该字符的某种编码的字节形式，读取也是反之的道理。

字节流与字符流关系的代码案例:

```java
public class Test {

    public static void main(String[] args) throws Exception {

        String str = "中国人";

        FileOutputStream fos  = new FileOutputStream("1.txt");
        fos.write(str.getBytes(StandardCharsets.UTF_8));
        fos.close();

        FileWriter fw = new FileWriter("1.txt");
        fw.write(str);
        fw.close();

        PrintWriter pw = new PrintWriter("1.txt", StandardCharsets.UTF_8);
        pw.write(str);
        pw.close();

        FileReader fr =new FileReader("1.txt");
        char[] buf = new char[1024];
        int len = fr.read(buf);

        String myStr = new String(buf,0,len);
        System.out.println(myStr);

        FileInputStream fis = new FileInputStream("1.txt");
        byte[] buff = new byte[1024];
        int length = fis.read(buff);
        String myStr2 = new String(buff,0,length, StandardCharsets.UTF_8);
        System.out.println(myStr);

        BufferedReader br = new BufferedReader(
            new InputStreamReader(
                new FileInputStream("1.txt"), StandardCharsets.UTF_8
            )
        );
        String myStr3 = br.readLine();
        br.close();
        System.out.println(myStr3);
    }

}
```

><br/>
>
>**备注:** 可以看出一个是在Byte量级上进行操作的, 而高级流是在Char量级上进行操作的(并没有使用getBytes())

更多关于IO流的内容见: [Java中的IO流](https://jasonkayzk.github.io/2019/11/25/Java中的IO流/)

<br/>

### 9. 什么是java序列化，如何实现java序列化？请解释Serializable接口的作用

我们有时候将一个java对象变成字节流的形式传出去或者从一个字节流中恢复成一个java对象. 例如: 要将java对象存储到硬盘或者传送给网络上的其他计算机，这个过程我们可以自己写代码去把一个java对象变成某个格式的字节流再传输. 但是，JDL本身就提供了这种支持!

调用OutputStream的writeObject方法来做，如果要让java帮我们做，**要被传输的对象必须实现serializable接口**，这样，javac编译时就会进行特殊处理，编译的类才可以被writeObject方法操作，即所谓的序列化。

><br/>
>
>**备注:**
>
>需要被序列化的类必须实现Serializable接口，该接口是一个mini接口，**其中没有需要实现的方法**，Serializable**只是为了标注该对象是可被序列化的**。

例如，在web开发中，如果对象被保存在了Session中，tomcat在重启时要把Session对象序列化到硬盘，这个对象就必须实现Serializable接口。如果对象要经过分布式系统进行网络传输或通过rmi等远程调用，这就需要在网络上传输对象，被传输的对象就必须实现Serializable接口。

<br/>

### 10. 什么是assert?什么时候用assert?

assertion(断言)在软件开发中是一种常用的调试方式，很多开发语言中都支持这种机制。

在实现中，assertion就是在程序中的一条语句，它对一个boolean表达式进行检查，一个正确程序必须保证这个boolean表达式的值为true；如果该值为false，说明程序已经处于不正确的状态下，assert将给出警告或退出。

一般来说，**assertion用于保证程序最基本、关键的正确性。**assertion检查通常在开发和测试时开启。为了提高性能，在软件发布后，assertion检查通常是关闭的。

下面是使用assert的一个例子:

```java
public class Test {

    public static void main(String[] args) {
        int i = 0;
        for (i = 0; i < 5; i++) {
            System.out.println(5);
        }
        --i; //假设程序不小心多了一句--i;
        assert i == 5;
    }

}
-------- Output -------
5
5
5
5
5
Exception in thread "main" java.lang.AssertionError
    at top.jasonkayzk.jutil.Test.main(Test.java:11)
```

><br/>
>
>**注意: 使用assert断言时, 需要在VM上添加启动参数-ea**



<br/>