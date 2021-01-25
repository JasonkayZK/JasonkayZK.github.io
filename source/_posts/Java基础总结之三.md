---
title: Java基础总结之三
toc: true
date: 2019-11-21 21:40:32
cover: https://acg.toubiec.cn/random?52
categories: 面试总结
tags: Java基础
description: 本文是Java面试总结中Java基础篇的第三篇
---

本文是Java面试总结中Java基础篇的第三篇

<br/>

<!--more-->

### 1. java中实现多态的机制是什么？

靠的是父类或接口定义的引用变量可以指向子类或具体实现类的实例对象，而程序调用的方法在运行期才动态绑定，就是引用变量所指向的具体实例对象的方法，也就是内存里正在运行的那个对象的方法，而不是引用变量的类型中定义的方法。

>   <br/>
>
>   **备注:**
>
>   由于Java采用的是动态绑定机制, 所以对于泛型来说, 类型在编译期都会被抹去, 最终都为Object类型!
>
>   即: `List<String> arrayList = new ArrayList<>();  -->  List<Object>`
>
>   编译完成内部后其实是Object, 由编译器完成类型检查! 比在运行期检查更安全!

<br/>

### 2. abstract class和interface有什么区别?

含有abstract修饰符的class即为抽象类，abstract类不能创建实例对象。含有abstract方法的类必须定义为abstract class，abstract class类中的方法不必是抽象的。

<font color="#ff0000">abstract class类中定义抽象方法必须在具体(Concrete)子类中实现，所以，不能有抽象构造方法或抽象静态方法。</font>如果的子类没有实现抽象父类中的所有抽象方法，那么子类也必须定义为abstract类型。

<font color="0000ff">接口（interface）可以说成是抽象类的一种特例，接口中的所有方法都必须是抽象的。接口中的方法定义默认为public abstract类型，接口中的成员变量类型默认为public static final。</font>

**语法上的区别：**

① 抽象类可以有构造方法，接口中不能有构造方法。

② 抽象类中可以有普通成员变量，接口中没有普通成员变量(默认为public static final)

③ 抽象类中可以包含非抽象的普通方法，接口中的所有方法必须都是抽象的，不能有非抽象的普通方法

④ 抽象类中的抽象方法的访问类型可以是public，protected, 但接口中的抽象方法只能是public类型的，并且默认即为public abstract类型。

⑤ 抽象类中可以包含静态方法，接口中不能包含静态方法

⑥ 抽象类和接口中都可以包含静态成员变量，抽象类中的静态成员变量的访问类型可以任意，但接口中定义的变量只能是public static final类型，并且默认即为public static final类型。

⑦ 一个类可以实现多个接口，但只能继承一个抽象类。

**应用上的区别:**

接口: 在系统架构设计方法发挥作用，主要用于定义模块之间的通信契约;

抽象类: 在代码实现方面发挥作用，可以实现代码的重用! 

例如，模板方法设计模式是抽象类的一个典型应用: 假设某个项目的所有Servlet类都要用相同的方式进行权限判断、记录访问日志和处理异常，那么就可以定义一个抽象的基类，让所有的Servlet都继承这个抽象基类，在抽象基类的service方法中完成权限判断、记录访问日志和处理异常的代码，在各个子类中只是完成各自的业务逻辑代码.

<br/>

### 3. abstract的method是否可同时是static,是否可同时是native，是否可同时是synchronized?

① **abstract的method不可以是static的**，因为抽象的方法是要被子类实现的，而static与子类扯不上关系！

② **native不能与abstract混用**, native方法表示该方法要用另外一种依赖平台的编程语言实现的，不存在着被子类实现的问题，所以，它也不能是抽象的.

例如，FileOutputSteam类要硬件打交道，底层的实现用的是操作系统相关的api实现，例如，在windows用c语言实现的，所以，查看jdk的源代码，可以发现FileOutputStream的open方法的定义如下：

```java
private native void open(Stringname) throws FileNotFoundException;
```

如果我们要用java调用别人写的c语言函数，我们是无法直接调用的，我们需要按照java的要求写一个c语言的函数，用我们的这个c语言函数去调用别人的c语言函数。由于我们的c语言函数是按java的要求来写的，我们这个c语言函数就可以与java对接上，java那边的对接方式就是定义出与我们这个c函数相对应的方法，java中对应的方法不需要写具体的代码，但需要在前面声明native。

③ **synchronized与abstract不可以同时使用**. 因为假设有这么一个方法，synchronized 的方法的同步锁对象是 this ，而包含这个抽象方法的接口或抽象类也许有多个子类，那么那个 this 到底是指哪一个子类就无法确定。所以不可以。

<br/>

### 4. 什么是内部类？Static Nested Class和Inner Class的不同

内部类就是在一个类的内部定义的类，<font color="#ff0000">内部类中不能定义静态成员（静态成员不是对象的特性，只是为了找一个容身之处, 所以需要放到一个类中而已)</font>

内部类可以直接访问外部类中的成员变量，内部类可以定义在外部类的方法外面，也可以定义在外部类的方法体中! 如下: 

```java
public class Test {

    int outx = 0;

    public void method() {

        Inner1 inner1 = new Inner1();

        class Inner2   {
            //在方法体内部定义的内部类
            public void method() {
                outx = 3;
            }
        }
        Inner2 inner2 = new Inner2();
    }

    public class Inner1  {
        //在方法体外面定义的内部类
    }

}
```

**① 方法体外面定义的内部类**:

访问类型可以是public,protecte,默认的，private等4种类型，这就好像类中定义的成员变量有4种访问类型一样，它们决定这个内部类的定义对其他类是否可见；

我们也可以在外面创建内部类的实例对象，<font color="#ff0000">创建内部类的实例对象时，一定要先创建外部类的实例对象，然后用这个外部类的实例对象去创建内部类的实例对象</font>

代码如下：

```java
Test test = new Test();
Inner1 inner1 = test.new Inner1();
```

**② 在方法内部定义的内部类:**

前面不能有访问类型修饰符，就好像方法中定义的局部变量一样，但<font color="#ff0000">方法体中的内部类的前面可以使用final或abstract修饰符(极少使用!)</font>

><br/>
>
>**备注:**
>
>1.  这种内部类对其他类是不可见的其他类无法引用这种内部类，但是这种内部类创建的实例对象可以传递给其他类访问。
>
>2.  这种内部类必须是先定义，后使用，即内部类的定义代码必须出现在使用该类之前，这与方法中的局部变量必须先定义后使用的道理也是一样的。
>
>3.  这种内部类可以访问方法体中的局部变量，但是，该局部变量前必须加final修饰符。

另外, 在方法体内部还可以采用如下语法来创建一种匿名内部类，即定义某一接口或类的子类的同时，还创建了该子类的实例对象，无需为该子类定义名称：

```java
public class Test {

    public void start() {
        new Thread(() -> System.out.println("Hello")).start();
    }
   
}

```

**③ Static Nested Class**

在方法外部定义的内部类前面可以加上static关键字，从而成为Static Nested Class，它不再具有内部类的特性，所以，从狭义上讲，它不是内部类。

Static Nested Class与普通类在运行时的行为和功能上没有什么区别，只是在编程引用时的语法上有一些差别，它可以定义成public、protected、默认的、private等多种类型，而普通类只能定义成public和默认的这两种类型。在外面引用Static Nested Class类的名称为“外部类名.内部类名”。<font color="#ff0000">在外面不需要创建外部类的实例对象，就可以直接创建Static Nested Class.</font>

例如，假设Inner是定义在Outer类中的Static Nested Class，那么可以使用如下语句创建Inner类：

```java
Outer.Inner inner = new Outer.Inner();
```

>   <br/>
>
>   **备注:** 一个经典的代表即`System.out`
>
>   System类里面的一个静态数据成员，而且这个成员是java.io.PrintStream类的引用

由于static Nested Class不依赖于外部类的实例对象，所以，static Nested Class能访问外部类的非static成员变量(不能直接访问，需要创建外部类实例才能访问非静态变量)。

当在外部类中访问Static Nested Class时，可以直接使用Static Nested Class的名字，而不需要加上外部类的名字了，在Static Nested Class中也可以直接引用外部类的static的成员变量，不需要加上外部类的名字。

在静态方法中定义的内部类也是Static Nested Class，这时候不能在类前面加static关键字，静态方法中的Static Nested Class与普通方法中的内部类的应用方式很相似，它除了可以直接访问外部类中的static的成员变量，还可以访问静态方法中的局部变量，但是，该局部变量前必须加final修饰符。

>   <br/>
>
>   **备注：**
>
>   首先根据你的印象说出你对内部类的总体方面的特点：例如，在两个地方可以定义，可以访问外部类的成员变量，不能定义静态成员，这是大的特点。
>
>   然后再说一些细节方面的知识，例如，几种定义方式的语法区别，静态内部类，以及匿名内部类。

<br/>

### 5. 内部类可以引用它的包含类的成员吗？有没有什么限制？

完全可以。如果不是静态内部类，那没有什么限制！

如果你把静态嵌套类当作内部类的一种特例: <font color="#ff0000">静态嵌套类不可以访问外部类的普通成员变量，而只能访问外部类中的静态成员</font>

例如，下面的代码：

```java
public class Test {

    public static int x; // 去掉static, 则内部类Inner无法引用x!

    static class Inner {
        void test() {
            System.out.println(x);
        }
    }
}
```

<br/>

### 6. Anonymous Inner Class (匿名内部类)是否可以extends(继承)其它类，是否可以implements(实现)interface(接口)?

可以继承其他类或实现其他接口.

<br/>

### 7. super.getClass()方法调用

下面程序的输出结果是多少？

```java
import java.util.Date;

public class Test extends Date{

    public static void main(String[] args) {
        new Test().test();
    }

    public void test(){
        System.out.println(getClass().getName()); // Test
        System.out.println(super.getClass().getName()); // Test
        System.out.println(getClass().getSuperclass().getName()); // Date
    }

}
```

<font color="#ff0000">很奇怪，前两个的结果是Test!</font>

在test方法中，直接调用getClass().getName()方法，返回的是Test类名;

<font color="#ff0000">由于getClass()在Object类中定义成了final，子类不能覆盖该方法，所以，在test方法中调用getClass().getName()方法，其实就是在调用从父类继承的getClass()方法，等效于调用super.getClass().getName()方法!</font>

所以，super.getClass().getName()方法返回的也应该是Test。如果想得到父类的名称，应该用如下代码：

```java
getClass().getSuperClass().getName();
```

<br/>

### 8. String是最基本的数据类型吗?

String不是基本类型, 基本数据类型包括byte、int、char、long、float、double、boolean和short。

>   <br/>
>
>   **备注:**
>
>   ① java.lang.String类是final类型的，因此不可以继承这个类、不能修改这个类。为了提高效率节省空间，我们应该用StringBuffer类;
>
>   ② String在JDK7之前是常量池是在方法区（永久代）中，之后则移到了堆中!
>
>   **更多关于String相关见:** [为什么在Java中String被设计为不可变](https://jasonkayzk.github.io/2019/10/01/为什么在Java中String被设计为不可变/)

<br/>

### 9. String s = new String("str")创建了几个String Object?二者之间有什么区别？

两个或一个，`"str"`对应一个对象，这个对象放在字符串常量缓冲区(JDK7之前)，常量"str"不管出现多少遍，都是缓冲区中的那一个。new String每写一遍，就创建一个新的对象，它一句那个常量`"str"`对象的内容来创建出一个新String对象。如果以前就用过`"str"`，这句代表就不会创建”str”自己了，直接从缓冲区拿!

<br/>

### 10. String和StringBuffer的区别

JAVA平台提供了两个类：String和StringBuffer，它们可以储存和操作字符串，即包含多个字符的字符数据。

String类提供了数值不可改变的字符串, 而StringBuffer类提供的字符串进行修改。当你知道字符数据要改变的时候你就可以使用StringBuffer。典型地，你可以使用StringBuffers来动态构造字符数据。

>   <br/>
>
>   **备注:**
>
>   String实现了equals方法，new String(“abc”).equals(newString(“abc”)的结果为true!
>
>   <font color="#ff0000">而StringBuffer没有实现equals方法!</font> 所以，new StringBuffer(“abc”).equals(newStringBuffer(“abc”)的结果为false。
>
>   由于String覆盖了equals方法和hashCode方法，而StringBuffer没有覆盖equals方法和hashCode方法，所以，将**StringBuffer对象存储进Java集合类中时会出现问题**。

**例如:**

```java
public static void main(String[] args) {
    System.out.println(new String("str").equals(new String("str"))); // true
    System.out.println(new StringBuilder("str").equals(new StringBuilder("str"))); // false
}
```



<br/>