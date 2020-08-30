---
title: Java基础总结之四
toc: true
date: 2019-11-22 10:40:32
cover: http://api.mtyqx.cn/api/random.php?33
categories: 面试总结
tags: Java基础
description: 本文是Java面试总结中Java基础篇的第四篇
---

本文是Java面试总结中Java基础篇的第四篇

<br/>

<!--more-->

### 1. 如何把一段逗号分割的字符串转换成一个数组?

**① 使用`str.split(',')`:**

```java
String orgStr = "a,b,c,d,e";
String[] res = orgStr.split(",");
System.out.println(Arrays.toString(res));
```

**② 使用StringTokenizer:**

```java
String orgStr = "a,b,c,d,e";
StringTokenizer tokenizer = new StringTokenizer(orgStr, ",");
String[] res = new String[tokenizer.countTokens()];

int cnt = 0;
while (tokenizer.hasMoreTokens()) {
    res[cnt++] = tokenizer.nextToken();
}
System.out.println(Arrays.toString(res));
```

<br/>

### 2. 数组有没有length()这个方法? String有没有length()这个方法？

数组没有length()这个方法，有length的属性。

String有length()这个方法。

<br/>

### 3. **下面这条语句一共创建了多少个对象：String s="a"+"b"+"c"+"d";**

对于如下代码：

```java
String s1 = "a";
String s2 = s1 + "b";
String s3 = "a" + "b";
System.out.println(s2 == "ab"); // false
System.out.println(s3 == "ab");  // true
```

第一条语句打印的结果为false，第二条语句打印的结果为true，这说明<font color="#ff0000">javac编译可以对字符串常量直接相加的表达式进行优化，不必要等到运行期去进行加法运算处理，而是在编译时去掉其中的加号，直接将其编译成一个这些常量相连的结果</font>

题目中的第一行代码被编译器在编译时优化后，相当于直接定义了一个”abcd”的字符串，所以，上面的代码应该只创建了一个String对象。

写如下两行代码:

```java
String s ="a" + "b" + "c" + "d";
System.out.println(s == "abcd"); // true
```

最终打印的结果应该为true。

<br/>

### 4. try {}里有一个return语句，那么紧跟在这个try后的finally {}里的code会不会被执行，什么时候被执行，在return前还是后?

也许你的答案是在return之前，但往更细地说，我的答案是:<font color="#ff0000">在return中间执行</font>

请看下面程序代码的运行结果：

```java
public class Test {

    public static void main(String[] args) {
        System.out.println(new Test().test()); // 1
    }

    public int test() {
        int x = 1;
        try {
            return x;
        } finally {
            ++x;
        }
    }
}
```

运行结果是1，为什么呢？

主函数调用子函数并得到结果的过程，好比主函数准备一个空罐子，当子函数要返回结果时，先把结果放在罐子里，然后再将程序逻辑返回到主函数。所谓返回，就是子函数说，我不运行了，你主函数继续运行吧，这没什么结果可言，结果是在说这话之前放进罐子里的。

<br/>

### 5. try中的return和finally中的return最终会返回哪个值?

下面的程序代码输出的结果是多少？

```java
public class Test {

    public static void main(String[] args) {
        System.out.println(new Test().get()); // 2
    }

    public int get() {
        try {
            return 1;
        } finally {
            return 2;
        }
    }

}
```

返回的结果是2。

可以通过下面一个例子程序来帮助解释这个答案:

```java
public class Test {

    public static void main(String[] args) {
        System.out.println(new Test().test());
    }

    int test() {
        try {
            return func1();
        } finally {
            return func2();
        }
    }

    int func1() {
        System.out.println("func1");
        return 1;
    }

    int func2() {
        System.out.println("func2");
        return 2;
    }

}
-----------执行结果-----------------
func1
func2
2
```

从例子的运行结果中可以发现: try中的return语句调用的函数先于finally中调用的函数执行，也就是说return语句先执行，finally语句后执行，所以，返回的结果是2。

<font color="#ff0000">return并不是让函数马上返回，而是return语句执行后，将把返回结果放置进函数栈中，此时函数并不是马上返回，它要执行finally语句后才真正开始返回, 而此时finally修改了函数栈!</font>

><br/>
>
>**结论：**finally中的代码比return和break语句后执行

<br/>

### 6. final, finally, finalize的区别

**① final**

final 用于声明属性，方法和类，分别表示属性不可变，方法不可覆盖，类不可继承; 

此外, 内部类要访问局部变量，局部变量必须定义成final类型;(JDK 8之前)

例如:

```java
public static void main(String[] args) {
    final String str = "Final String";
    new Thread(() -> {
        System.out.println(str);
    }).start();
}
```

虽然JDK 8之后对于不使用final声明的也可以编译通过, 但实际上这是一种编译机制的改变，实际上就是一个语法糖（底层还是帮你加了final）! 所以还是养成手动加上final的好习惯吧!

**② finally**

finally是异常处理语句结构的一部分，表示总是执行。

**③ finalize**

finalize是Object类的一个方法，在垃圾收集器执行的时候会调用被回收对象的此方法，可以覆盖此方法提供垃圾收集时的其他资源回收，例如关闭文件等。JVM不保证此方法总被调用!

<br/>

### 7. 运行时异常与一般异常有何异同？

异常表示程序运行过程中可能出现的非正常状态，运行时异常表示虚拟机的通常操作中可能遇到的异常，是一种常见运行错误。java编译器要求方法必须声明抛出可能发生的非运行时异常，但是并不要求必须声明抛出未被捕获的运行时异常。

<br/>

### 8. error和exception有什么区别?

error 表示恢复不是不可能但很困难的情况下的一种严重问题。比如说内存溢出。不可能指望程序能处理这样的情况。 

exception表示一种设计或实现问题。也就是说，它表示如果程序运行正常，从不会发生的情况。

<br/>

### 9. Java中的异常处理机制的简单原理和应用。

异常是指java程序运行时（非编译）所发生的非正常情况或错误. Java对异常进行了分类，不同类型的异常分别用不同的Java类表示，所有异常的`根类为java.lang.Throwable`，Throwable下面又派生了两个子类：Error和Exception.

Error表示应用程序本身无法克服和恢复的一种严重问题，程序只有死的份了，例如，说内存溢出和线程死锁等系统问题。

Exception表示程序还能够克服和恢复的问题，其中又分为系统异常和普通异常: 

**系统异常**是软件本身缺陷所导致的问题，也就是软件开发人员考虑不周所导致的问题，软件使用者无法克服和恢复这种问题，但在这种问题下还可以让软件系统继续运行或者让软件死掉，例如，数组脚本越界（ArrayIndexOutOfBoundsException），空指针异常（NullPointerException）、类转换异常（ClassCastException）；

**普通异常**是运行环境的变化或异常所导致的问题，是用户能够克服的问题，例如，网络断线，硬盘空间不够，发生这样的异常后，程序不应该死掉。

><br/>
>
>**备注:** java为系统异常和普通异常提供了不同的解决方案: 
>
>编译器强制普通异常必须try..catch处理或用throws声明继续抛给上层调用方法处理，所以普通异常也称为checked异常;
>
>系统异常可以处理也可以不处理，所以，编译器不强制用try..catch处理或用throws声明，所以系统异常也称为unchecked异常。

<br/>

### 10. 请写出你最常见到的5个runtime exception。

所谓系统异常，就是它们都是RuntimeException的子类，在jdk doc中查RuntimeException类，就可以看到其所有的子类列表，也就是看到了所有的系统异常.

常见的Runtime Exception有: 

-   NullPointerException—一程序试图访问一个空的数组中的元素或访问空的对象中的 方法或变量时产生异常；
-   OutofMemoryException——用new语句创建对象时，如系统无法为其分配内存空 间则产生异常； 
-   IndexOutOfBoundsExcention——由于数组下标越界或字符串访问越界引起异常； 
-   ClassCastException—一当把一个对象归为某个类，但实际上此对象并不是由这个类 创建的，也不是其子类创建的，则会引起异常； 
-   ClassNotFoundException——未找到指定名字的类或接口引起异常； 
-   IOException——由于文件未找到、未打开或者I/O操作不能进行而引起异常； 



<br/>