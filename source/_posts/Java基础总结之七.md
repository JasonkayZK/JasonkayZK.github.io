---
title: Java基础总结之七
toc: true
date: 2019-11-25 09:51:03
cover: https://img.paulzzh.tech/touhou/random?31
categories: 面试总结
tags: Java基础
description: 本文是Java面试总结中Java基础篇的第七篇
---

本文是Java面试总结中Java基础篇的第七篇

<br/>

<!--more-->

### 1. 描述一下JVM加载class文件的原理机制? 类的加载过程?

<font color="#ff0000">Java中的所有类，都需要由类加载器装载到JVM中才能运行!</font>

类加载器本身也是一个类，而它的工作就是把class文件从硬盘读取到内存中. 在写程序的时候，我们几乎不需要关心类的加载，因为这些都是隐式装载的，除非我们有特殊的用法: **像是反射就需要显式的加载所需要的类**

**类装载方式有两种 :**

-   **① 隐式装载: 程序在运行过程中当碰到通过new等方式生成对象时，隐式调用类装载器加载对应的类到jvm中;**
-   **② 显式装载， 通过class.forname()等方法，显式加载需要的类;**

><br/>
>
>**注意: Java类的加载是动态的，它并不会一次性将所有类全部加载后再运行，而是保证程序运行的基础类(像是基类)完全加载到jvm中，至于其他类，则在需要的时候才加载(懒加载)**
>
>当然, 这样做的目的一部分是为了节省内存开销, 另外还有类似于JIT编译器, 可以实现热装载等

<br/>

**Java已经定义的类加载器有三个, 同时用户也可以继承并定义自己的类加载器**

结构如下图:

![Classloader分类.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/Classloader分类.png)

-   **① Bootstrap Loader: 启动类加载器，是虚拟机自身的一部分, 负责将存放在\lib目录中的类库加载到虚拟机中。其无法被Java程序直接引用。 负责加载系统类  (指的是内置类，像是String)**
-   **② ExtClassLoader: 负责加载扩展类(就是继承类和实现类)**
-   **③ AppClassLoader: 负责加载用户类路径（ClassPath）上所指定的类库(程序员自定义的类)**
-   **④ User ClassLoader: 用户代码中自定义的加载器类**

<br/>

JVM中类的加载是由类加载器（ClassLoader）和它的子类来实现的，由于Java的跨平台性，经过编译的Java源程序并不是一个可执行程序，而是一个或多个类文件。

当Java程序需要使用某个类时，JVM会确保这个类已经被**加载、连接（验证、准备和解析）和初始化**

类的加载过程如下图所示:

![类的加载过程.jpeg](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/类的加载过程.jpeg)

① **类的加载**是指把类的.class文件中的数据读入到内存中，通常是创建一个字节数组读入.class文件，然后产生与所加载类对应的Class对象。加载完成后，Class对象还不完整，所以此时的类还不可用;

当类被加载后就进入**链接阶段**，这一阶段包括:

-   ① **验证**：为了确保Class文件的字节流中包含的信息符合当前虚拟机的要求，并且不会危害虚拟机自身的安全

-   ② **准备**：为静态变量分配内存并设置默认的初始值(此时还未调用构造函数, 但已经有值)

-   ③ **解析**：将符号引用替换为直接引用
-   ④ **初始化:** 最后JVM对类进行初始化，包括：
    -   1) 如果类存在直接的父类并且这个类还没有被初始化，那么就先初始化父类；
    -   2) 如果类中存在初始化语句，就依次执行这些初始化语句（如static变量和static块），那就依次执行这些初始化语句
    -   3) 执行这个类的构造函数完成类的初始化

><br/>
>
>**补充: 双亲委派模型**
>
>从Java  2（JDK  1.2）开始，类加载过程采取了双亲委派模型（PDM）。PDM更好的保证了Java平台的安全性. 
>
>在该机制中，JVM自带的Bootstrap是启动类加载器，其他的加载器都有且仅有一个父类加载器。<font color="#ff0000">类的加载首先请求父类加载器加载，父类加载器无能为力时才由其子类加载器自行加载。并且JVM永远不会向Java程序提供对Bootstrap的引用</font>

<br/>

### 2. 类什么时候才被初始化?类的初始化步骤?

-   **① 创建类的实例，也就是new一个对象**
-   **② 访问某个类或接口的静态变量，或者对该静态变量赋值**
-   **③ 调用类的静态方法**
-   **④ 反射: Class.forName("java.util.ArrayList")**
-   **⑤ 初始化一个类的子类（会首先初始化子类的父类）**
-   **⑥ JVM启动时标明的启动类，即文件名和类名相同的那个类**

<font color="#ff0000">在Java中只有这6中情况才会导致类的类的初始化</font>

<br/>

**类的初始化步骤：**

**①** 如果这个类还没有被加载和链接，那先进行加载和链接

**②** 假如这个类存在直接父类，并且这个类还没有被初始化**（注意：在一个类加载器中，类只能初始化一次），那就初始化直接的父类（不适用于接口）**

**③** 假如类中存在初始化语句（如static变量和static块），那就依次执行这些初始化语句

**④** 执行这个类的构造函数完成类的初始化

<br/>

### 3. 什么是双亲委派模型(PDM-Parents Delegate Model)? 为什么使用双亲委派模型?

**双亲委派模型：<font color="#ff0000">在该模型中，JVM自带的Bootstrap是启动类加载器，其他的加载器都有且仅有一个父类加载器。类的加载首先请求父类加载器加载，父类加载器无能为力时才由其子类加载器自行加载。并且JVM永远不会向Java程序提供对Bootstrap的引用</font>**

双亲委派模型如下图:

![双亲委派.jpeg](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/双亲委派.jpeg)

><br/>
>
>**补充: 类加载器之间的父子关系，一般不会以继承的关系来实现，而是通过组合关系复用父加载器的代码**

<br/>

**双亲委派的工作过程**

如果一个类加载器收到了类加载的请求，它首先不会自己去尝试加载这个类，而是把这个请求委派给父类加载器完成, 每个层次的类加载器都是如此，因此所有的加载请求最终都应该传送到顶层的启动类加载器中;

当且仅当(反射除外)父加载器反馈自己无法完成这个加载请求（它的搜索范围没有找到所需的类）时，子加载器才会尝试自己去加载

<br/>

**为什么要使用双亲委派模型**

Java类随着它的类加载器一起具备了一种带优先级的层次关系

比如: java.lang.Object，它存放在rt.jar中，无论哪个类加载器要加载这个类，最终都是委派给启动类加载器进行加载，因此Object类在程序的各个类加载器环境中，都是同一个类

如果自己编写一个与rt.jar类库中已有类重名的java类，可以正常编译，但无法被加载运行

<br/>

**委托机制的意义 — 防止内存中出现多份同样的字节码** 

比如两个类A和类B都要加载System类：如果不用委托而是自己加载自己的，那么类A就会加载一份System字节码，然后类B又会加载一份System字节码，这样内存中就出现了两份System字节码

如果使用委托机制，会递归的向父类查找，也就是首选用Bootstrap尝试加载，如果找不到再向下。这里的System就能在Bootstrap中找到然后加载，如果此时类B也要加载System，也从Bootstrap开始，此时Bootstrap发现已经加载过了System那么直接返回内存中的System即可而不需要重新加载，这样内存中就只有一份System的字节码了

<br/>

### 4. 能不能自己写个类，也叫java.lang.String？

通常不可以，但可以采取另类方法达到这个需求

为了不让我们写String类，类加载采用委托机制，这样可以保证父类加载器优先，父类加载器能找到的类，子加载器就没有机会加载。而String类是Bootstrap加载器加载的，就算自己重写，也总是使用Java系统提供的System，自己写的System类根本没有机会得到加载

但是，可以通过一些技术手段达到这个目的:

**① 我们可以自己定义一个类加载器来达到这个目的，为了避免双亲委托机制，这个类加载器也必须是特殊的**

由于系统自带的三个类加载器都加载特定目录下的类，如果我们自己的类加载器放在一个特殊的目录，那么系统的加载器就无法加载，也就是最终还是由我们自己的加载器加载。 

><br/>
>
>**注意: 由于在tomcat的web应用程序中，都是由webapp自己的类加载器先自己加载WEB-INF/classess目录中的类，然后才委托上级的类加载器加载，如果我们在tomcat的web应用程序中写一个java.lang.String，这时候Servlet程序加载的就是我们自己写的java.lang.String，但是这么干就会出很多潜在的问题，原来所有用了java.lang.String类的都将出现问题**

**② java提供了endorsed技术，可以覆盖jdk中的某些类**

><br/>
>
>**说明: endorsed技术**
>
>**在Java运行环境中有一个叫endorsed的目录，它允许你将一些特殊的类库放到其中以供项目使用**
>
>官方说明:
>
>><br/>
>>
>>**Specifying the -Djava.endorsed.dirs=lib/endorsed system property on the [Java](http://www.2cto.com/kf/ware/Java/) command line will force the JVM to prefer any library  it finds in the endorsed directory over its own  system libraries. Copying the jars into $JAVA_HOME/jre/lib/endorsed will do the same  thing**
>
>其大意是：如果你在运行程序的时候指定了`-D  java.endorsed.dirs`这个参数所指向的包含特别的jar包的目录，或者把那些jar复制到默认的`$JAVA_HOME/jre/lib/endorsed`目录下, 那么在项目运行时虚拟机会优先使用这些jar包，优先级比JDK自带的系统类库还要高，**但是java.lang这个语言包下的类除外**

<font color="#ff0000">能够被覆盖的类是有限制范围，不包括java.lang这样的包中的类</font>

<br/>

### 5. heap和stack有什么区别?

java的内存分为两类，一类是栈(stack)内存，一类是堆(heap)内存:

-   栈内存是指程序进入一个方法时，会为这个方法单独分配一块私属存储空间，用于存储这个方法内部的局部变量，当这个方法结束时，分配给这个方法的栈会释放，这个栈中的变量也将随之释放
-   堆是与栈作用不同的内存，一般用于存放不放在当前方法栈中的那些数据，例如，使用new创建的对象都放在堆里. 所以，它不会随方法的结束而消失。**方法中的局部变量使用final修饰后，放在堆中，而不是栈中。**

><br/>
>
>**注意: 垃圾收集发生在堆中, 因为栈中的数据在退出方法后已经自动清除了**

<br/>

### 6. GC是什么?为什么要有GC?

GC是垃圾收集的意思(Gabage Collection)，忘记或者错误的内存回收会导致程序或系统的不稳定甚至崩溃

Java提供的GC功能可以自动监测对象是否超过作用域从而达到**自动回收内存**的目的，并且Java语言没有提供释放已分配内存的显示操作方法

 <br/>

### 7. 垃圾回收的优点和原理, 并考虑2种回收机制

Java语言中一个显著的特点就是引入了垃圾回收机制，它使得Java程序员在编写程序的时候不再需要考虑内存管理。由于有个垃圾回收机制，**Java中的对象不再有"作用域"的概念，只有对象的引用才有"作用域"**

垃圾回收可以有效的防止内存泄露，有效的使用可以使用的内存。垃圾回收器通常是作为一个单独的低级别的线程运行，不可预知的情况下对内存堆中已经死亡的或者长时间没有使用的对象进行清楚和回收，程序员不能实时的调用垃圾回收器对某个对象或所有对象进行垃圾回收。

回收机制有分代: **复制垃圾回收和标记垃圾回收，增量垃圾回收, 以及JDK 11中新加入的ZGC等**

<br/>

### 8. 垃圾回收器的基本原理是什么？垃圾回收器可以马上回收内存吗？有什么办法主动通知虚拟机进行垃圾回收？

对于GC来说，当程序员创建对象时，GC就开始监控这个对象的地址、大小以及使用情况。

**通常，GC采用有向图的方式记录和管理堆(heap)中的所有对象。**通过这种方式确定哪些对象是"可达的"，哪些对象是"不可达的"。当GC确定一些对象为"不可达"时，GC就有责任回收这些内存空间。

**程序员可以手动执行`System.gc()`，通知GC运行，但是Java语言规范并不保证GC一定会执行**

<br/>

### 9. 谈谈Java中的垃圾分代?为什么要垃圾分代?如何分代?

分代垃圾回收机制，是基于这样一个事实：**不同的对象的生命周期是不一样的, 因此，不同生命周期的对象可以采取不同的回收算法，以便提高回收效率**

我们将对象分为三种状态：

-   **年轻代**
-   **年老代**
-   **持久代**

对应的, JVM将堆内存划分为

-   **Eden**
-   **Survivor**
-   **Tenured/Old**

如下图所示:

![堆内存的划分细节.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/堆内存的划分细节.png)

下面一一说明:

**① 年轻代**

所有新生成的对象首先都是放在Eden区。 

年轻代的**回收目标**就是: **尽可能快速的收集掉那些生命周期短的对象，对应的垃圾收集器是Minor GC;**

<font color="#ff0000">每次 Minor  GC 会清理年轻代的内存，算法采用效率较高的复制算法，频繁的操作，但是会浪费内存空间。当“年轻代”区域存放满对象后，就将对象存放到年老代区域</font>

**② 年老代**

在年轻代中**经历了N(默认15)次垃圾回收后仍然存活的对象**，就会被放到年老代中

因此，可以认为年老代中存放的都是一些生命周期较长的对象

当年老代对象越来越多，我们就需要**启动Major GC和Full GC(全量回收)**，来一次大扫除，全面清理年轻代区域和年老代区域

**③ 持久代**

用于**存放静态文件**，如Java类、方法等。

持久代**对垃圾回收没有显著影响**

<br/>

对应于各个年龄代的收集器:

-   **Minor GC:**

    用于清理年轻代区域。Eden区满了就会触发一次Minor GC。清理无用对象，将有用对象复制到“Survivor1”、“Survivor2”区中(这两个区，大小空间也相同，同一时刻Survivor1和Survivor2只有一个在用，一个为空)

-   **Major GC:**

    用于清理老年代区域

-   **Full GC:**

    用于清理年轻代、年老代区域。 成本较高，会对系统性能产生影响

><br/>
>
>**备注: **
>
>**① 在JDK 8后引入了新的垃圾回收器ZGC**: 可以解决CMS(ConcurrentMark-SweepCollector)垃圾回收器中Concurrent Mode Failed问题，尽量缩短处理超大堆的停顿，在G1进行垃圾回收的时候完成内存压缩，降低内存碎片的生成(已成为Java 9后的默认收集器)
>
>**② 在JDK 11后引入了ZGC**: 这是一个更加强大的垃圾回收器(强烈建议使用, 我就是因为这个上的JDK 11!), 有如下特性:
>
>-   ① 暂停时间**不**超过**10毫秒**
>-   ② 暂停时间**不会**随堆或实时设置大小**而**增加
>-   ③处理堆范围从**几百M**到**几TB**
>
>><br/>
>>
>>**小贴士一: 查看默认使用的JDK垃圾回收器**
>>
>>可能我们目前在使用的是CMS垃圾回收器或者是G1垃圾回收器或者什么没有设置使用的是jdk默认的垃圾回收器, 可以使用如下命令查看我们目前**默认使用的jdk垃圾回收器**:
>>
>>```bash
>>java -XX:+PrintCommandLineFlags -version
>>```
>>
>>可知:
>>
>>① jdk1.7.x默认的回收器是ParallelGC: `-XX:+UseParallelGC`
>>
>>② jdk1.8.x默认的垃圾回收器也是ParallelGC: `-XX:+UseParallelGC`
>>
>>③ jdk1.9.x默认垃圾收集器是G1: `-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC`
>>
>>④ jdk 1.11.x默认垃圾收集器也是G1: `-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC`(但可以手动更改垃圾回收器)
>
>><br/>
>>
>>**小贴士二: 更改JDK垃圾回收器**
>>
>>ZGC回收机预计在jdk11支持，ZGC目前仅适用于**Linux / x64**, 和G1开启很像，用下面参数即可开启：
>>
>>```bash
>>-XX:+UnlockExperimentalVMOptions -XX:+UseZGC
>>```
>>
>>关于IDEA中如何设置JVM运行参数见: [IDEA中设置JVM运行参数](https://jasonkayzk.github.io/2019/11/25/IDEA中设置JVM运行参数/)

<br/>

**垃圾回收过程：**

① 新创建的对象，绝大多数都会存储在Eden中;

② 当Eden满了（达到一定比例）不能创建新对象，则触发垃圾回收（GC），将无用对象清理掉，然后剩余对象复制到某个Survivor中，如S1，同时清空Eden区

③ 当Eden区再次满了，会将S1中的不能清空的对象存到另外一个Survivor中，如S2，同时将Eden区中的不能清空的对象，也复制到S1中，保证Eden和S1，均被清空

④ 重复多次(默认15次)Survivor中没有被清理的对象，则会复制到老年代Old(Tenured)区中

⑤ 当Old区满了，则会触发一个一次完整地垃圾回收（FullGC），之前新生代的垃圾回收称为（minorGC）

<br/>

### 10. java中会存在内存泄漏吗，请简单描述

内存泄露就是指一个不再被程序使用的对象或变量一直被占据在内存中. java中有垃圾回收机制，它可以保证一对象不再被引用的时候，即对象变成了孤儿的时候，对象将自动被垃圾回收器从内存中清除掉。

由于**Java使用有向图的方式进行垃圾回收管理，可以消除引用循环的问题**

例如有两个对象，相互引用，只要它们和根进程不可达的，那么GC也是可以回收它们的，例如下面的代码可以看到这种情况的内存回收：

```java
public class Test {

    public static void main(String[] args) throws IOException {
        gcTest();
        System.out.println("has exited gcTest!");
        System.in.read();
        System.out.println("out begin gc!");
        for (int i = 0; i < 10; i++) {
            System.gc();
            System.in.read();
        }
    }

    private static void gcTest() throws IOException {
        System.in.read();
        Person p1 = new Person();
        System.in.read();
        Person p2 = new Person();
        p1.setMate(p2);
        p2.setMate(p1);
        System.out.println("before exit gc test!");
        System.in.read();
        System.gc();
        System.out.println("exit gc test!");
    }

    private static class Person {
        byte[] data = new byte[20000000];
        Person mate = null;
        public void setMate(Person other) {
            mate = other;
        }
    }

}

```

GC效果如下图所示:

![循环引用GC效果.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/循环引用GC效果.png)

><br/>
>
>代码中定义了两个相互引用的变量p1和p2, 但是在方法调用结束后, 两个变量还是被收集了(在图中可以看到内存被释放)
>
>**结论: 即使是循环引用, 只要它们和根进程不可达的，那么GC也是可以回收它们的**

<br/>

但是Java中仍然存在内存泄露的情况：**长生命周期的对象持有短生命周期对象的引用就很可能发生内存泄露，尽管短生命周期对象已经不再需要，但是因为长生命周期对象持有它的引用而导致不能被回收**

这就是java中内存泄露的发生场景，通俗地说: 就是程序员可能创建了一个对象，以后一直不再使用这个对象，这个对象却一直被引用，即这个对象无用但是却无法被垃圾回收器回收的，这就是java中可能出现内存泄露的情况

><br/>
>
>**例如: 缓存系统，我们加载了一个对象放在缓存中(例如放在一个全局map对象中)，然后一直不再使用它，这个对象一直被缓存引用，但却不再被使用**

检查java中的内存泄露，一定要让程序将各种分支情况都完整执行到程序结束，然后看某个对象是否被使用过，如果没有，则才能判定这个对象属于内存泄露

如果一个外部类的实例对象的方法返回了一个内部类的实例对象，这个内部类对象被长期引用了，即使那个外部类实例对象不再被使用，但由于内部类持久外部类的实例对象，这个外部类对象将不会被垃圾回收，这也会造成内存泄露

下面这个例子就说明了: 清空堆栈中的某个元素，并不是彻底把它从数组中拿掉，而是把存储的总数减少. 当然也可以写得比这个好，在拿掉某个元素时，顺便也让它从数组中消失(将那个元素所在的位置的值设置为null即可）:

```java
// Stack的源码
public class Stack {

    private Object[] elements = new Object[10];

    private int size = 0;

    public void push(Object e) {
        ensureCapacity();
        elements[size++] = e;
    }

    public Object pop() {
        if (size == 0) {
            throw new EmptyStackException();
        }
        return elements[--size];
    }

    private void ensureCapacity() {
        if (elements.length == size) {
            Object[] oldElements = elements;
            elements = new Object[2 * elements.length + 1];
            System.arraycopy(oldElements, 0, elements, 0, size);
        }
    }
}
```

上面的原理应该很简单，假如堆栈加了10个元素，然后全部弹出来，虽然堆栈是空的，没有我们要的东西，但是这是个对象是无法回收的，这个才符合了内存泄露的两个条件：无用，无法回收.

但是就是存在这样的东西也不一定会导致什么样的后果，如果这个堆栈用的比较少，也就浪费了几个K内存而已，反正我们的内存都上G了，哪里会有什么影响，再说这个东西很快就会被回收的，有什么关系

下面再看一个例子:

```java
public class Test {

    public static Stack s = new Stack();

    static {
        s.push(new Object());
        s.pop(); //这里有一个对象发生内存泄露
        s.push(new Object()); //上面的对象可以被回收了，等于是自愈了
    }

}
```

因为是static，就一直存在到程序退出，但是我们也可以看到它有自愈功能，就是说如果你的Stack最多有100个对象，那么最多也就只有100个对象无法被回收其实这个应该很容易理解，Stack内部持有100个引用，最坏的情况就是他们都是无用的，因为我们一旦放新的进入，以前的引用自然消失！

<br/>

**内存泄露的另外一种情况**

<font color="#ff0000">当一个对象被存储进HashSet集合中以后，就不能修改这个对象中的那些参与计算哈希值的字段了</font>

**否则: 对象修改后的哈希值与最初存储进HashSet集合中时的哈希值就不同了，在这种情况下，即使在contains方法使用该对象的当前引用作为的参数去HashSet集合中检索对象，也将返回找不到对象的结果，这也会导致无法从HashSet集合中单独删除当前对象，造成内存泄露**

<br/>

