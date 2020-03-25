---
title: Java中的反射真的可以获取泛型属性吗
cover: http://api.mtyqx.cn/api/random.php?17
toc: false
date: 2020-03-25 14:48:22
categories: 技术杂谈
tags: [反射]
description: 众所周知，在Java中由于反射的存在使其可以成为介于Python和C++之间的一直半自动的语言。反射可以强大到在运行时获取类的各种属性，并进行操作。但是在Java中泛型的实现其实是伪泛型，即在编译结束后会擦除实际的泛型类型，最终导致所有地方其实都是Object类型。那么当泛型遇上反射，还能否获取实际类型呢？
---

众所周知，在Java中由于反射的存在使其可以成为介于Python和C++之间的一直半自动的语言。反射可以强大到在运行时获取类的各种属性，并进行操作。但是在Java中泛型的实现其实是伪泛型，即在编译结束后会擦除实际的泛型类型，最终导致所有地方其实都是Object类型。那么当泛型遇上反射，还能否获取实际类型呢？

<br/>

<!--more-->

目录：

<!-- toc -->

<br/>

## Java中的反射真的可以获取泛型属性吗

首先要说的是，本文建立在你已经对Java中的泛型和反射具有一定的了解的基础上进行讲解，而不会讲解反射的细节。

>   <br/>
>
>   关于反射，可以参考我之前的文章：[Java反射基础总结](https://jasonkayzk.github.io/2019/09/14/Java反射基础总结/)

**先说结论：可以获取**

下面给出获取的过程：

### 获取类属性的泛型类型

```java
public class GeneralTypeTest {

    private List<GeneralTypeObject> list;

    private List<?> list2;

    public static void main(String[] args) throws Exception {
        System.out.println(GeneralTypeTest.class.getDeclaredField("list").getGenericType());
        System.out.println(GeneralTypeTest.class.getDeclaredField("list2").getGenericType());

        GeneralTypeTest generalTypeTest = new GeneralTypeTest();
        generalTypeTest.list2 = new ArrayList<>();
        // 无法通过编译
        // generalTypeTest.list2.add(new GeneralTypeObject());
    }
    
    private static class GeneralTypeObject {
    }
}
```

结果如下：

```
java.util.List<GeneralTypeTest$GeneralTypeObject>
java.util.List<?>
```

可以看出，通过反射还是很容易获取属性的泛型类型的，**只需要通过getGenericType方法即可！**

下面再来看看获取方法的参数中的泛型属性

****

### 获取方法参数的泛型类型

```java
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;

public class GeneralTypeTest {

    private List<GeneralTypeObject> list;

    private List<?> list2;

    public static void main(String[] args) throws Exception {
        GeneralTypeTest generalTypeTest = new GeneralTypeTest();
        generalTypeTest.list = new ArrayList<>();
        generalTypeTest.list2 = new ArrayList<>();

        generalTypeTest.list.add(new GeneralTypeObject());
        generalTypeTest.list.add(new GeneralTypeObject());

        // 无法通过编译
//         generalTypeTest.list2.add(new GeneralTypeObject());

        generalTypeTest.show(generalTypeTest.list);
        generalTypeTest.show(generalTypeTest.list2);
    }

    private void show(List<?> list) throws NoSuchMethodException {
        System.out.println("----------- show method: ---------");
        System.out.println(GeneralTypeTest.class.getDeclaredMethods()[0].getParameterTypes()[0].getTypeName());
        System.out.println(list);
    }

    private static class GeneralTypeObject {}
}
```

show方法的参数中定义了泛型`List<?> list`接收参数，在show方法中，通过getDeclaredMethods方法获取GeneralTypeTest类中的show方法，然后通过getParameterTypes获取方法参数的类型。

最终输出如下：

```
----------- show method: ---------
java.util.List
[GeneralTypeTest$GeneralTypeObject@5a39699c, GeneralTypeTest$GeneralTypeObject@3cb5cdba]
----------- show method: ---------
java.util.List
[]
```

可见针对不论`List<GeneralTypeObject>`还是`List<?>`的传参，最终由于Java泛型中的类型擦除，最后都导致输出了`java.util.List`

真的是这样吗？显然不是的！

**注意：在show方法中，正确输出了`GeneralTypeTest$GeneralTypeObject@5a39699c`！说明在JVM中实际上是知道你的泛型类型的！**

只是我们获取泛型的姿势不太对罢了！

****

### 获取方法参数的泛型类型-续

修改show方法如下：

```java
private void show(List<?> list) throws NoSuchMethodException {
    System.out.println("----------- show method: ---------");
    Method method = GeneralTypeTest.class.getDeclaredMethods()[0];

    System.out.println("Method 1:");
    System.out.println(method.getParameterTypes()[0].getTypeName());

    System.out.println("Method 2:");
    Type[] parameterTypes = method.getGenericParameterTypes();
    for (Type type : parameterTypes) {
        System.out.println(type);
        // 只有带泛型的参数才是这种Type，所以得判断一下
        if (type instanceof ParameterizedType) {
            ParameterizedType parameterizedType = (ParameterizedType) type;
            // 获取参数的类型
            System.out.println(parameterizedType.getRawType());
            // 获取参数的泛型列表
            Type[] actualTypeArguments = parameterizedType.getActualTypeArguments();
            for (Type type2 : actualTypeArguments) {
                System.out.println(type2);
            }
        }
    }
    System.out.print("List Content: ");
    System.out.println(list);
}
```

在修改的show方法中，首先通过getDeclaredMethods()方法获取到了show方法，然后**通过`getGenericParameterTypes()`方法获取到了包括泛型的方法参数！**

之后遍历方法参数数组，判断参数是否是泛型类型(`type instanceof ParameterizedType`)，如果当前参数类型是泛型类型，则强转为ParameterizedType，然后通过`getActualTypeArguments()`方法获取声明的泛型类型**(注意：是声明的泛型类型！)**

最终输出：

```
----------- show method: ---------
Method 1:
java.util.List
Method 2:
java.util.List<?>
interface java.util.List
?
List Content: [GeneralTypeTest$GeneralTypeObject@30c7da1e, GeneralTypeTest$GeneralTypeObject@5b464ce8]
----------- show method: ---------
Method 1:
java.util.List
Method 2:
java.util.List<?>
interface java.util.List
?
List Content: []
```

从输出结果可以看出：**使用这种方法获得的泛型类型是声明时的泛型类型，而不是运行时的泛型类型**

如果把泛型声明的？改为GeneralTypeObject对于list有：

```
----------- show method: ---------
Method 1:
java.util.List
Method 2:
java.util.List<GeneralTypeTest$GeneralTypeObject>
interface java.util.List
class GeneralTypeTest$GeneralTypeObject
List Content: [GeneralTypeTest$GeneralTypeObject@36d64342, GeneralTypeTest$GeneralTypeObject@39ba5a14]
```

即获得的泛型属性是声明时的类型！

但是这里就有一个疑问了，为什么通过反射获取的是声明时的泛型类型，但是在调用println方法时，输出的不是Object，而是对应的类型呢？

这就涉及到Java中的编译优化了！

****

### Java早期编译优化

泛型是JDK 1.5的一项新增特性，其本质即是上面提到的Parametersized Type（参数化类型）。

在JDK 1.5以前，由于没有泛型，所以在使用HashMap的get方法时，返回的都是Object对象，这时由于Object可以是任何类型，所以就只有程序员和运行期的JVM才知道这个Object到底是什么类型。而在编译期间，编译器是无法检测这个Object强转是否成功，只能靠程序员来保证强转的正确性。

>   <br/>
>
>   **在这种情况下，许多在编译期就可以解决的问题，被转移到了ClassCastException这类运行时异常！**
>
>   为了解决这个问题，泛型应运而生！

在Java早期编译优化时，的确会将源码中的泛型擦拭，比如对于以下两个类型：

```java
ArrayList<Integer>
ArrayList<String>
```

在Java中，就被认为是同一个类型。

><br/>
>
>**这与C#中的泛型有着本质的区别！**
>
>**在C#中，源代码在编译之后不同的泛型类型会被不同的占位符替代，而Java全部被擦除！**

在下面的例子中：

```java
Map<String, String> map = new HashMap<>();
map.put("Hello", "H");
System.out.println(map.get("Hello"));
```

如果把这段代码反编译之后，会发现泛型声明都消失了（IDEA还是很贴心的帮你加上了～）！

这段代码更像下面：

```java
Map map = new HashMap();
map.put("Hello", "H");
System.out.println((String)map.get("Hello"));
```

即：**擦除了泛型声明，并把所有的结果做了强转转换！**

所以本质上：<font color="#f00">**Java的泛型是一种伪泛型，即前期编译时的语法糖，帮助你解决了大部分运行时才能判断的类型转换异常而已！**</font>

也正因为如此，在下面的重载场景下，其实是无法通过编译的：

```java
private static void method(List<String> list) {}
private static void method(List<Integer> list) {}
```

但是在Sun JDK 1.6中，下面的两个方法是可以通过编译的：

```java
private static String method(List<String> list) {
    return "123";
}

private static int method(List<Integer> list) {
    return 1;
}
```

><br/>
>
>这是由于：
>
>**在编译期，这两个方法对于编译器来说（未擦除之前）显然是两个参数不同的方法，但是当擦除之后，在同一个Class文件中出现了同一个方法签名（返回值、方法名、方法参数）所以被拒绝；**
>
>**而修改了返回类型之后，即可共存于同一个Class文件！**
>
>**（这是非常危险的事情，很可能导致逻辑错误！）**

需要注意的是，尽管在前期编译优化中，Java做了泛型擦除，但是还是保留了元数据。

这也是为什么通过泛型可以获取到源代码中声明的泛型类型，而在println中可以获取到运行时类型的原因：

<font color="#f00">**源代码中声明的泛型类型被保存在元数据中，而在泛型擦除的地方(println方法调用时)添加了强转转换！**</font>

到底是不是这样呢？我们来看看编译后的Class文件。

****

### 查看Class文件

首先通过javac命令编译.java源文件：

```bash
javac GeneralTypeTest.java
```

然后通过`javap -verbose`命令查看编译的.class文件：

```bash
$ javap -verbose GeneralTypeTest.class
Classfile /home/zk/workspace/test/src/main/java/GeneralTypeTest.class
  Last modified 2020年3月25日; size 2088 bytes
  MD5 checksum a315127f7f34585e040b1af1501dee6c
  Compiled from "GeneralTypeTest.java"
public class GeneralTypeTest
  minor version: 0
  major version: 55
  flags: (0x0021) ACC_PUBLIC, ACC_SUPER
  this_class: #2                          // GeneralTypeTest
  super_class: #27                        // java/lang/Object
  interfaces: 0, fields: 2, methods: 3, attributes: 3
Constant pool:
    #1 = Methodref          #27.#56       // java/lang/Object."<init>":()V
    #2 = Class              #57           // GeneralTypeTest
    #3 = Methodref          #2.#56        // GeneralTypeTest."<init>":()V
    #4 = Class              #58           // java/util/ArrayList
    #5 = Methodref          #4.#56        // java/util/ArrayList."<init>":()V
    #6 = Fieldref           #2.#59        // GeneralTypeTest.list:Ljava/util/List;
    #7 = Fieldref           #2.#60        // GeneralTypeTest.list2:Ljava/util/List;
    #8 = Class              #61           // GeneralTypeTest$GeneralTypeObject
    #9 = Methodref          #8.#56        // GeneralTypeTest$GeneralTypeObject."<init>":()V
   #10 = InterfaceMethodref #47.#62       // java/util/List.add:(Ljava/lang/Object;)Z
   #11 = Methodref          #2.#63        // GeneralTypeTest.show:(Ljava/util/List;)V
   #12 = Fieldref           #64.#65       // java/lang/System.out:Ljava/io/PrintStream;
   #13 = String             #66           // ----------- show method: ---------
   #14 = Methodref          #67.#68       // java/io/PrintStream.println:(Ljava/lang/String;)V
   #15 = Methodref          #69.#70       // java/lang/Class.getDeclaredMethods:()[Ljava/lang/reflect/Method;
   #16 = String             #71           // Method 1:
   #17 = Methodref          #48.#72       // java/lang/reflect/Method.getParameterTypes:()[Ljava/lang/Class;
   #18 = Methodref          #69.#73       // java/lang/Class.getTypeName:()Ljava/lang/String;
   #19 = String             #74           // Method 2:
   #20 = Methodref          #48.#75       // java/lang/reflect/Method.getGenericParameterTypes:()[Ljava/lang/reflect/Type;
   #21 = Methodref          #67.#76       // java/io/PrintStream.println:(Ljava/lang/Object;)V
   #22 = Class              #77           // java/lang/reflect/ParameterizedType
   #23 = InterfaceMethodref #22.#78       // java/lang/reflect/ParameterizedType.getRawType:()Ljava/lang/reflect/Type;
   #24 = InterfaceMethodref #22.#79       // java/lang/reflect/ParameterizedType.getActualTypeArguments:()[Ljava/lang/reflect/Type;
   #25 = String             #80           // List Content:
   #26 = Methodref          #67.#81       // java/io/PrintStream.print:(Ljava/lang/String;)V
   #27 = Class              #82           // java/lang/Object
   #28 = Utf8               GeneralTypeObject
   #29 = Utf8               InnerClasses
   #30 = Utf8               list
   #31 = Utf8               Ljava/util/List;
   #32 = Utf8               Signature
   #33 = Utf8               Ljava/util/List<LGeneralTypeTest$GeneralTypeObject;>;
   #34 = Utf8               list2
   #35 = Utf8               Ljava/util/List<*>;
   #36 = Utf8               <init>
   #37 = Utf8               ()V
   #38 = Utf8               Code
   #39 = Utf8               LineNumberTable
   #40 = Utf8               main
   #41 = Utf8               ([Ljava/lang/String;)V
   #42 = Utf8               Exceptions
   ......
{
  public GeneralTypeTest();
    descriptor: ()V
    flags: (0x0001) ACC_PUBLIC
    Code:
      stack=1, locals=1, args_size=1
         0: aload_0
         1: invokespecial #1                  // Method java/lang/Object."<init>":()V
         4: return
      LineNumberTable:
        line 7: 0

  public static void main(java.lang.String[]) throws java.lang.Exception;
    descriptor: ([Ljava/lang/String;)V
    flags: (0x0009) ACC_PUBLIC, ACC_STATIC
    Code:
      stack=3, locals=2, args_size=1
         0: new           #2                  // class GeneralTypeTest
         3: dup
         4: invokespecial #3                  // Method "<init>":()V
         7: astore_1
         8: aload_1
         9: new           #4                  // class java/util/ArrayList
        12: dup
        13: invokespecial #5                  // Method java/util/ArrayList."<init>":()V
        16: putfield      #6                  // Field list:Ljava/util/List;
        19: aload_1
        20: new           #4                  // class java/util/ArrayList
        23: dup
        24: invokespecial #5                  // Method java/util/ArrayList."<init>":()V
        27: putfield      #7                  // Field list2:Ljava/util/List;
        30: aload_1
        31: getfield      #6                  // Field list:Ljava/util/List;
        ......
      LineNumberTable:
        line 14: 0
        line 15: 8
        line 16: 19
        line 18: 30
        line 19: 47
        line 24: 64
        line 25: 72
        line 26: 80
    Exceptions:
      throws java.lang.Exception
}
SourceFile: "GeneralTypeTest.java"
NestMembers:
  GeneralTypeTest$GeneralTypeObject
```

><br/>
>
>**补充：**
>
>也可以通过vim打开.class文件，并通过<font color="#f00">**使用命令`:%!xxd`,即可转变为16进制显示**</font>

在Constant pool中的确可以看到泛型的内容，如：`#33 = Utf8  Ljava/util/List<LGeneralTypeTest$GeneralTypeObject;>; `

这也是我们通过反射获取的类型，至于能否通过反射获取真正的运行时类型，我的答案是：**不能！**

这也是通过Java中泛型的特性推断出来的。

<br/>

如果小伙伴们有可以通过反射获取真正的运行时类型的方法，欢迎下方评论留言或私信我。

另外如果文中有错误，也请指出！

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~