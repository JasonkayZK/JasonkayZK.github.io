---
title: Java基础总结之一
toc: true
date: 2019-11-21 10:39:14
cover: https://acg.yanwz.cn/api.php?12
categories: 面试总结
tags: Java基础
description: 本文是Java面试总结中Java基础篇的第一篇
---

本文是Java面试总结中Java基础篇的第一篇

<br/>

<!--more-->

### 1. 一个.java源文件中是否可以包括多个类（不是内部类）？有什么限制?

一个Java源文件可以包含多个类, 但是只能有一个被声明为public的类被作为入口类, 并且public类的类名必须与文件名一致!

<br/>

### 2. Java有没有goto?

goto是Java中的保留字, 但是没有被Java使用

<br/>

### 3. 说说&和&&的区别

&和&&都可以用于逻辑运算: 而其中&&是短路与, 一旦计算式出现false, 不再向后执行!

&还可以用作按位与;

>   <br/>
>
>   **注意:**<font color="#ff0000">按位与运算优先级很低要小心</font>
>
>   **如:** `(x & 1) == 1  与 x & 1 == 1` 不同, 后者编译报错. 因为会先计算==, 结果为true变为boolean类型!

<br/>

### 4. 在JAVA中如何跳出当前的多重嵌套循环？

**①. 使用带有标签的break语句**

在Java中，要想跳出多重循环，可以在外面的循环语句前定义一个标号，然后在里层循环体的代码中使用带有标号的break语句，即可跳出外层循环. 如:

```java
        ok:
        for (int i = 0; i < 10; i++) {
            for (int j = 0; j < 10; j++) {
                System.out.println(i + ", " + j);
                if (j == 5) break ok;
            }
        }
```

**②. 使用外部定义的标识符**

让外层的循环条件表达式的结果可以受到里层循环体代码的控制. 如:

```java
boolean found = false;
int[][] arr ={{1,2,3}, {4,5,6,7}, {9}};
for (int i = 0; i < arr.length; i++) {
    for (int j = 0; j < arr[0].length; j++) {
        System.out.println(i + ", " + j);
        if (arr[i][j] == 5) {
            found = true;
            break;
        }
    }
    if (found) break;
}
```

<br/>

### 5. switch语句能否作用在byte上，能否作用在long上，能否作用在String上?

在jdk 7 之前，switch 只能支持 byte、short、char、int  这几个基本数据类型和其对应的封装类型。switch后面的括号里面只能放int类型的值，但由于byte，short，char类型，它们会 自动 转换为int类型（精精度小的向大的转化），所以它们也支持。

注意，对于精度比int大的类型，比如long、float，doulble，不会自动转换为int，如果想使用，就必须强转为int，如(int)float;

<font color="#f00">jdk1.7后，整形，枚举类型，boolean，字符串都可以: 通过调用switch中string.hashCode,将string转换为int从而进行判断.</font>

<br/>

### 6. short s1 = 1; s1 = s1 + 1;有什么错? short s1 = 1; s1 += 1;有什么错?

对于`short s1 = 1; s1 = s1 + 1`: 由于s1+1运算时会自动提升表达式的类型，所以结果是int型，再赋值给short类型s1时，编译器将报告需要强制转换类型的错误;

对于`short s1 = 1; s1 += 1`: 由于 +=是java语言规定的运算符，java编译器会对它进行特殊处理，因此可以正确编译;

<br/>

### 7. char型变量中能不能存贮一个中文汉字?为什么?

char型变量是用来存储Unicode编码的字符的，unicode编码字符集中包含了汉字，所以，char型变量中当然可以存储汉字. 不过，如果某个特殊的汉字没有被包含在unicode编码字符集中，那么，这个char型变量中就不能存储这个特殊汉字

>   <br/>
>
>   **补充说明：**unicode编码占用两个字节，所以，char类型的变量也是占用两个字节。

<br/>

### 8. 使用final关键字修饰一个变量时，是引用不能变，还是引用的对象不能变？

使用final关键字修饰一个变量时，是指引用变量不能变，引用变量所指向的对象中的内容还是可以改变的!

例如, 下面的程序: 

```java
final StringBuilder sb = new StringBuilder("immutable");
sb.append(" broken!");
System.out.println(sb.toString());
```

执行后输出: immutable broken!

但是如果执行`sb = new StringBuilder("");`, 将在编译期报错, 因为修改了变量的引用!

<br/>

### 9. ==和equals方法究竟有什么区别？

`==操作符`专门用来比较两个变量的值是否相等, 也就是用于比较变量所对应的内存中所存储的数值是否相同，对于两个基本类型的数据则直接比较的是数值大小. 

想要比较两个引用变量是否是同一个对象的别名，可以用`==操作符`

equals方法是用于比较两个独立对象的内容是否相同. 如果一个类没有自己定义equals方法，那么它将继承Object类的equals方法，Object类的equals方法的实现代码如下：

```java
boolean equals(Object o){
  return this==o;
}
```

如果一个类没有自己定义equals方法，它默认的equals方法（从Object类继承的）就是使用`==操作符`，这时候使用equals和使用==会得到同样的结果

所以一般都需要重新equals方法, 希望能够比较该类创建的两个实例对象的内容是否相同.

Java中大部分lang包中的类都已经重写了equals方法, 例如String:

```java
String s1 = new String("abc");
String s2 = new String("abc");
System.out.println(s1 == s2); // false
System.out.println(s1.equals(s2)); // true
```

<br/>

### 10. 静态变量和实例变量的区别？

在语法定义上的区别：静态变量前要加static关键字，而实例变量前则不加。

在程序运行时的区别：实例变量属于某个对象的属性，必须创建了实例对象，其中的实例变量才会被分配空间，才能使用这个实例变量。静态变量不属于某个实例对象，而是属于类，所以也称为类变量，只要程序加载了类的字节码，不用创建任何实例对象，静态变量就会被分配空间，静态变量就可以被使用了。

例如:

```java
public class Test {

    public static int staticVar = 0;

    public int instanceVar = 0;

    public Test() {
        staticVar++;
        instanceVar++;
        System.out.println(staticVar + ", " + instanceVar);
    }

    public static void main(String[] args) {
        new Test(); // 1,1
        new Test(); // 2,1
    }
}

```

无论创建多少个实例对象，永远都只分配一个staticVar变量；但是，每创建一个实例对象，就会分配一个instanceVar，即可能分配多个instanceVar，并且每个instanceVar的值都只自加了1次!



<br/>