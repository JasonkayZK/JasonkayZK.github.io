---
title: Java Annotation总结
toc: true
date: 2019-09-17 19:30:22
cover: https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=2943267863,1904310036&fm=26&gp=0.jpg
categories: 学习案例
tags: [Java注解]
description: 本篇学习一下Java Annotation相关的知识
---

在Java各流行框架中, 大量使用第三方注解, 帮助我们简化配置, 如声明Spring配置类的: *@Configuration*. 为何注解如此神奇? 

本篇文章帮助大家揭晓注解背后的故事, 帮助大家理解 Hibernate，Spring, Struts等等第三方注解是如何工作的!

示例代码: https://github.com/JasonkayZK/Java_Samples/tree/java-annotation

<br/>

本篇文章的内容包括:

-   注解的作用;
-   注解的基本语法，创建如同接口，但是多了个 @ 符号;
-   注解的元注解;
-   注解的属性;
-   Java的5个预置注解;
-   注解的提取, 主要包括在类名修饰的注解, 和在方法/变量等修饰的注解;
-   注解使用场景
-   使用注解的一些例子
-   一些注解的应用实例等

<!--more-->

## Java Annotation

### 0. 注解如同标签

**想像代码具有生命，注解就是对于代码中某些鲜活个体的贴上去的一张标签。简化来讲，注解如同一张标签。**

《奇葩说》是近年网络上非常火热的辩论节目，其中辩手陈铭被另外一个辩手马薇薇攻击说是————“站在宇宙中心呼唤爱”，然后贴上了一个大大的标签————“鸡汤男”，自此以后，观众再看到陈铭的时候，首先映入脑海中便是“鸡汤男”三个大字，其实本身而言陈铭非常优秀，为人师表、作风正派、谈吐举止得体，但是在网络中，因为娱乐至上的环境所致，人们更愿意以娱乐的心态来认知一切，于是“鸡汤男”就如陈铭自己所说成了一个撕不了的标签。

可以说: <font color="#ff0000">有没有注解对于Java*代码本身*而言, 并没有什么改变! 但是加入了注解之后的标签对于Java编译器, 解释器等相当于贴上了标签一样!</font>

如, 对于常见的`@Override`注解而言: <font color="#0000ff">加入了之后, 编译器会做相应的检查, 如果发现, 并没有哪个方法被重写了, 就会报错! 这时就会帮助你排除相应的Bug(可能是函数签名笔误!)</font>



### 1. 注解语法

如同 classs 和 interface 一样，**注解也属于一种类型**! 它是在 Java SE 5.0 版本中开始引入的概念.

#### 1): 定义

<font color="#ff0000">注解通过`@interface`关键字定义</font>

```java
package annotation.grammer.lesson1.define;

public @interface DefineAnnotation {
}

```

<font color="#0000ff">定义的形式跟接口很类似，不过前面多了一个 @ 符号;</font>

**可简单理解为创建了一个DefineAnnotation的标签**

<br/>

#### 2): 应用

```java
package annotation.grammer.lesson2.apply;

import annotation.grammer.lesson1.define.DefineAnnotation;

@DefineAnnotation
public class ApplyClassDemo {
}

```

<font color="#ff0000">通过创建了一个类, 在类定义的地方加上`@AnnotationName`即可添加注解了!</font>

**相当于给该类添加了一个标签!**

</font>

------------------



### 2. 元注解

<font color="#ff0000">元注解是可以注解到注解上的注解，或者说元注解是一种基本注解，但是它能够应用到其它的注解上面, 目的就是给其他普通的标签进行解释说明的.</font>

元标签有5种: 

-   @Retention
-   @Documented
-   @Target
-   @Inherited
-   @Repeatable

下面一一说明.

<br/>

#### 1): Retention

Retention 的英文意为保留期的意思. <font color="#ff0000">当 @Retention 应用到一个注解上的时候，它解释说明了这个注解的的存活时间</font>:

它的取值如下：

-   RetentionPolicy.SOURCE: <font color="#ff0000">注解*只在源码阶段*保留，在编译器进行编译时它将被丢弃忽视;</font>
-   RetentionPolicy.CLASS <font color="#ff0000">注解*只被保留到编译进行*的时候，它并不会被加载到 JVM 中;</font>
-   RetentionPolicy.RUNTIME <font color="#ff0000">注解可以保留到程序运行的时候，它会被加载进入到 JVM 中，所以在程序运行时可以获取到它们;</font>



我们可以这样的方式来加深理解: 

<font color="#ff0000">@Retention 去给一张标签解释的时候，它指定了这张标签张贴的时间; @Retention 相当于给一张标签上面盖了一张时间戳，时间戳指明了标签张贴的时间周期. </font>

如:

```java
package annotation.metaAnnotation.retention;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

@Retention(RetentionPolicy.RUNTIME)
public @interface RetentionDemo {    
}

```

我们指定 TestAnnotation 可以在程序运行周期被获取到，因此它的生命周期非常的长!

<br/>



#### 2): Documented

<font color="#ff0000">这个元注解肯定是和文档有关。它的作用是能够将注解中的元素包含到 Javadoc 中去</font>

<br/>



#### 3): Target

Target 是目标的意思，<font color="#ff0000">@Target 指定了注解运用的地方. 当一个注解被 @Target 注解时，这个注解就被限定了运用的场景.</blue>

<font color="#0000ff">类比到标签，原本标签是你想张贴到哪个地方就到哪个地方，但是因为 @Target 的存在，它张贴的地方就非常具体了，比如只能张贴到方法上、类上、方法参数上等等.</font>

@Target 有下面的取值:

-   ElementType.ANNOTATION_TYPE 可以给一个注解进行注解
-   ElementType.CONSTRUCTOR 可以给构造方法进行注解
-   ElementType.FIELD 可以给属性进行注解
-   ElementType.LOCAL_VARIABLE 可以给局部变量进行注解
-   ElementType.METHOD 可以给方法进行注解
-   ElementType.PACKAGE 可以给一个包进行注解
-   ElementType.PARAMETER 可以给一个方法内的参数进行注解
-   ElementType.TYPE 可以给一个类型进行注解，比如类、接口、枚举

**如**:

```java
package annotation.metaAnnotation.target;

import java.lang.annotation.ElementType;
import java.lang.annotation.Target;

@Target({ElementType.METHOD, ElementType.FIELD})
public @interface TargetDemo {
}

```

可以标注在方法和属性标注, 但是标注在类上时无法通过编译!

```java
package annotation.metaAnnotation.target;

// @TargetDemo
public class TargetClassDemo {

    @TargetDemo
    private int test;

    @TargetDemo
    private void testMethod() {}
}

```

<br/>



#### 4): Inherited

Inherited 是继承的意思，但是它并不是说注解本身可以继承，而是说:

<font color="#ff0000">如果一个超类被 @Inherited 注解过的注解进行注解的话，那么如果它的子类没有被任何注解应用的话，那么这个子类就继承了超类的注解.</font>

如:

```java
package annotation.metaAnnotation.inherited;

import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

@Inherited
@Retention(RetentionPolicy.RUNTIME)
public @interface InheritedDemo {
}

@InheritedDemo
class A {}

class B extends A {}

```

注解 Test 被 @Inherited 修饰，之后类 A 被 Test 注解，类 B 继承 A,类 B 也拥有 Test 这个注解!

<br/>



#### 5): Repeatable

Repeatable 自然是可重复的意思. @Repeatable 是 Java 1.8 才加进来的，所以算是一个新的特性. 

<font color="#0000ff">什么样的注解会多次应用呢？通常是注解的值可以同时取多个.</font>

举个例子，一个人他既是程序员又是产品经理,同时他还是个画家!

```java
package annotation.metaAnnotation.repeatable;

import java.lang.annotation.Repeatable;

public @interface Persons {
    Person[] value();
}

@Repeatable(Persons.class)
@interface Person {
    String role() default "";
}

@Person(role = "artist")
@Person(role = "coder")
@Person(role = "PM")
class SuperMan {}
```

注意上面的代码，@Repeatable 注解了 Person. 而 @Repeatable 后面括号中的类相当于一个容器注解.

**容器注解:**

<font color="#ff0000">用来存放其它注解的地方。它本身也是一个注解.</font>

对于代码中的容器注解:

```java
public @interface Persons {
    Person[] value();
}
```

<font color="#ff0000">它里面必须要有一个 value 的属性，属性类型是`一个被 @Repeatable 注解过的注解数组`，注意它是数组!</font>

如果不好理解的话，可以这样理解: 

Persons 是一张总的标签，上面贴满了 Person 这种同类型但内容不一样的标签, 把 Persons 给一个 SuperMan 贴上，相当于同时给他贴了程序员、产品经理、画家的标签.

我们可能对于 `@Person(role="PM")` 括号里面的内容感兴趣，它其实就是*给 Person 这个注解的 role 属性赋值为 PM*;



<br/>

-------------------



### 3. 注解的属性

**注解的属性也叫做成员变量**. 

<font color="#ff0000">注解只有成员变量, 没有方法. 注解的成员变量在注解的定义中以`无形参的方法形式`来声明，其方法名定义了该成员变量的名字，其返回值定义了该成员变量的类型!</font>

#### 1): 属性的声明

**例如:**

```java
package annotation.attribute;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface AttributeDemo {
    int id();

    String msg();
}

```

上面代码定义了 TestAnnotation 这个注解中拥有 id 和 msg 两个属性. 

<br/>

#### 2): 属性赋值

##### 正常赋值

<font color="#ff0000">在使用的时候，我们应该给它们进行赋值, 赋值的方式是在注解的括号内以 `value=""` 形式，多个属性之前用 `，`隔开.</font>

```java
package annotation.attribute.giveValue;

import annotation.attribute.setupAttr.AttributeDemo;

@AttributeDemo(id = 3, msg = "hello")
public class GiveAttributeValue {
}

```

<font color="#ff0000">需要注意的是，在注解中定义属性时它的类型必须是 8 种基本数据类型外加 类、接口、注解及它们的数组</font>

<br/>



##### 赋默认值

<font color="#ff0000">注解中属性可以有默认值，默认值需要用 default 关键值指定.</font>

**比如**：

```java
package annotation.attribute;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface DefaultValueDemo {

    public int id() default -1;

    public String msg() default "Hi";

}

@DefaultValueDemo
class Test {}
```

如上, 此时可以直接使用;

<br/>



##### 仅声明单个属性赋值

<font color="#ff0000">此外,  如果一个注解内仅仅只有一个名字为 value 的属性时，应用这个注解时可以直接接属性值填写到括号内.</font>

```java
package annotation.attribute.singleAttr;

public @interface SingleAttrDemo {
    String value();
}

@SingleAttrDemo("Hi")
class Test {}

```



##### 无属性的注解

是一个注解没有任何属性, 那么在应用这个注解的时候，括号都可以省略:

```java
public @interface Perform {}

@Perform
public void testMethod(){}
```



<br/>

--------------------------



### 4. Java预置注解

其实 Java 语言本身已经提供了几个现成的注解:

#### 1): @Deprecated

<font color="#ff0000">这个元素是用来标记过时的元素，编译器在编译阶段遇到这个注解时会发出提醒警告，告诉开发者正在调用一个过时的元素比如过时的方法、过时的类、过时的成员变量. </font>

```java
package annotation.chapter4.javaDefalut.deprecated;

public class DeprecatedDemo {

    @Deprecated(since = "s", forRemoval = true)
    public static void say() {
        System.out.println("Hello!");
    }

    public static void speak() {
        System.out.println("Hi!");
    }

    public static void main(String[] args) {
        DeprecatedDemo.say();
        DeprecatedDemo.speak();
    }
}

```

大多数IDE会在过时的方法上~~添加删除线~~来作为提醒. <font color="#0000ff">如果被提示了此方法过时, 最好使用更新的解决方法!</font>

<br/>



#### 2): @Override

提示子类要复写父类中被 @Override 修饰的方法, 如果不满足调节将无法编译.

如:

```java
package annotation.chapter4.javaDefalut.override;

public class OverrideDemo {

    @Override
    public String toStrings() {
        return super.toString();
    }
}

```

如果将toString()方法拼写错误, **通过注解可以在编译器发现问题**!

<br/>



#### 3): @SuppressWarnings

<font color="#ff0000">阻止警告的意思. 之前说过调用被 @Deprecated 注解的方法后，编译器会警告提醒，而有时候开发者会忽略这种警告，他们可以在调用的地方通过 @SuppressWarnings 达到目的!</font>

如:

```java
package annotation.chapter4.javaDefalut.suppresswarnings;

public class SuppressWarningsDemo {

    @Deprecated
    @SuppressWarnings("deprecation")
    public static void say() {
        System.out.println("Hello");
    }

    public static void main(String[] args) {
        SuppressWarningsDemo.say();
    }
}

```

<font color="#0000ff">对这些警告进行了抑制，即忽略掉这些警告信息. </font>

@SuppressWarnings 有常见的值，分别对应如下意思:

-   deprecation：使用了<font color="#ff0000">不赞成使用的类或方法时的警告</font>(使用@Deprecated使得编译器产生的警告)；
-   unchecked：<font color="#ff0000">执行了未检查的转换时的警告，例如当使用集合时没有用泛型 (Generics) 来指定集合保存的类型; 关闭编译器警告;</font>
-   fallthrough：当 Switch 程序块直接通往下一种情况而没有 Break 时的警告;
-   path：在类路径、源文件路径等中有不存在的路径时的警告;
-   serial：当在可序列化的类上缺少 serialVersionUID 定义时的警告;
-   finally：任何 finally 子句不能正常完成时的警告;
-   rawtypes 泛型类型未指明
-   unused 引用定义了，但是没有被使用
-   all：关于以上所有情况的警告。



<br/>



#### 4): @SafeVarargs

<font color="#ff0000">参数安全类型注解. 它的目的是提醒开发者不要用参数做一些不安全的操作,它的存在会阻止编译器产生 unchecked 这样的警告. </font>

它是在 Java 1.7 的版本中加入的.

```java
package annotation.chapter4.javaDefalut.safeVarargs;

import java.util.Arrays;
import java.util.List;

public class SafeVarargsDemo {

    @SafeVarargs
    public static void notSafe(List<String>... stringLists) {
        Object[] arr = stringLists;
        List<Integer> tempList = Arrays.asList(42);
        arr[0] = tempList; // Semantically invalid, but compiles without warnings
        String s= stringLists[0].get(0); // Oh no, ClassCastException at runtime!
    }

    public static void main(String[] args) {
        SafeVarargsDemo.notSafe(Arrays.asList(args));
    }
}

```

上面的代码中，编译阶段不会报错，但是运行时会抛出 ClassCastException 这个异常，所以它虽然告诉开发者要妥善处理，但是开发者自己还是搞砸了!

@SafeVarargs注解只能用在参数长度可变的方法或构造方法上，且方法必须声明为static或final，否则会出现编译错误;

一个方法使用@SafeVarargs注解的前提是，开发人员必须确保这个方法的实现中对泛型类型参数的处理不会引发类型安全问题。

<br/>



#### 5): @FunctionalInterface

函数式接口注解，这个是 Java 1.8 版本引入的新特性. 

有关函数式编程和Lambda表达式可以见我的另一篇博客: [Lambda表达式总结](https://jasonkayzk.github.io/2019/09/16/Lambda%E8%A1%A8%E8%BE%BE%E5%BC%8F%E6%80%BB%E7%BB%93/)

简单来说, **函数式接口 (Functional Interface) 就是一个具有一个方法的普通接口**

如:

```java
package annotation.chapter4.javaDefalut.functionalInterface;

@FunctionalInterface
public interface FunctionalDemo {

    void say();

//    void say2();
}

```

<font color="#ff0000">在编译期, 标注`@FunctionalInterface`的接口将会被检查*有且仅有一个方法*, 否则将无法通过编译!</font>

<br/>



### 5.注解的提取

<font color="#ff0000">注解的提取即: 检阅这些标签内容. 形象的比喻就是你把这些注解标签在合适的时候撕下来，然后检阅上面的内容信息.</font>

<font color="#0000ff">要想正确检阅注解，离不开一个手段，那就是反射!</font>

#### 1) 获取类上的注解

```java
package annotation.chapter5.getAnnotation;

import java.lang.annotation.Annotation;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.util.Arrays;

@Retention(RetentionPolicy.RUNTIME)
@interface TestAnnotation {

    public int id() default 1;

    public String name() default "test";
}

@TestAnnotation
public class GetAnnotaionDemo {

    public static void main(String[] args) {
        // 1. isAnnotationPresent() 方法判断它是否应用了某个注解
        System.out.println(GetAnnotaionDemo.class.isAnnotationPresent(TestAnnotation.class));

        // 2. 通过 getAnnotation() 方法来获取 Annotation 对象
        TestAnnotation annotation = GetAnnotaionDemo.class.getAnnotation(TestAnnotation.class);
        System.out.println(annotation);

        // 3. 或者是 getAnnotations() 方法
        Annotation[] annotations = GetAnnotaionDemo.class.getAnnotations();
        System.out.println(Arrays.toString(annotations));

        // 4. 调用注解的属性方法
        System.out.println("id: " + annotation.id());
        System.out.println("name: " + annotation.name());

    }

}

```

代码如上所示:

-   isAnnotationPresent(): 通过 Class 对象的 isAnnotationPresent() 方法判断它是否应用了某个注解;
-   getAnnotation(): 来获取 Annotation 对象;
-   getAnnotations(): 返回注解到这个元素上的所有注解;

判断注解存在, 并获取注解, 最后调用了注解的方法.

<br/>



#### 2): 获取属性、方法等上的注解

```java
package annotation.chapter5.getOtherAnnotation;

import java.lang.annotation.*;
import java.lang.reflect.Field;
import java.lang.reflect.Method;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface MethodTest {
    String msg() default "hello";

    int id() default 0;
}


@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface ParamTest {
    String value() default "";
}


public class GetOtherAnnotationDemo {

    @ParamTest(value = "2")
    private int a;

    @MethodTest
    @SuppressWarnings("deprecation")
    public void test1() {}

    public static void main(String[] args) {
        try {
            // 1. 获取成员变量上的注解
            Field a = GetOtherAnnotationDemo.class.getDeclaredField("a");
            ParamTest paramTest = a.getAnnotation(ParamTest.class);
            if (paramTest != null) {
                System.out.println("Param value: " + paramTest.value());
            }

            // 2. 获取方法上的注解
            Method method = GetOtherAnnotationDemo.class.getDeclaredMethod("test1");
            if (method != null) {
                // 获取方法中的注解
                Annotation[] ans = method.getAnnotations();
                for (Annotation an : ans) {
                    System.out.println("method test1 annotation:" + an.annotationType().getSimpleName());
                }
            }

        } catch (NoSuchFieldException | NoSuchMethodException e) {
            e.printStackTrace();
        }
    }
}

```

输出如下:

```
Param value: 2
method test1 annotation:MethodTest
```

重点关注`test1()方法`, 上面有两个注解, 但是仅输出了一个, 原因是: **@SuppressWarnings**注解并不是被声明为`@Retention(RetentionPolicy.RUNTIME) `的! 

源码如下:

```java
@Retention(RetentionPolicy.SOURCE)
public @interface SuppressWarnings {
    String[] value();
}
```

<font color="#ff0000">需要注意的是，如果一个注解要在运行时被成功提取，那么 `@Retention(RetentionPolicy.RUNTIME) 是必须的`!</font>

<br/>



--------------------



### 6. 注解的使用场景

Java 官方的定义是: <font color="#ff0000">注解是一系列元数据，它*提供数据用来解释程序代码*，但是注解并非是所解释的代码本身的一部分. *注解对于代码的运行效果没有直接影响!*</font>

注解有许多用处，主要如下：

-   提供信息给编译器: <font color="#0000ff">编译器可以利用注解来探测错误和警告信息</font>
-   编译阶段时的处理: <font color="#0000ff">软件工具可以用来利用注解信息来生成代码、Html文档或者做其它相应处理</font>
-   运行时的处理: <font color="#0000ff">某些注解可以在程序运行的时候接受代码的提取</font>

值得注意的是，注解不是代码本身的一部分，注解只是某些工具的的工具, 注解主要针对的是编译器和其它工具软件(SoftWare tool).

<font color="#0000ff">当开发者使用了Annotation 修饰了类、方法、Field 等成员之后，这些 Annotation 不会自己生效，必须由开发者提供相应的代码来提取并处理 Annotation 信息! 这些处理提取和处理 Annotation 的代码统称为 `APT(Annotation Processing Tool)`.</font>

<br/>



### 7. 使用注解的实例

#### 1): 使用注解进行测试

我要写一个测试框架，测试程序员的代码有无明显的异常.

>   —— 程序员 A : 我写了一个类，它的名字叫做 NoBug，因为它所有的方法都没有错误。
>
>   —— 我：自信是好事，不过为了防止意外，让我测试一下如何？
>
>   —— 程序员 A: 怎么测试？
>
>   —— 我：把你写的代码的方法都加上 @MyTest 这个注解就好了。
>
>   —— 程序员 A: 好的。

<br/>

##### 被测试类: NoBug

```java
package annotation.chapter7.testExample;

public class NoBug {

    @MyTest
    public void show(){
        System.out.println("1234567890");
    }

    @MyTest
    public void add(){
        System.out.println("1+1="+1+1);
    }

    @MyTest
    public void subtract(){
        System.out.println("1-1="+(1-1));
    }

    @MyTest
    public void multiply(){
        System.out.println("3 x 5="+ 3*5);
    }

    @MyTest
    public void division(){
        System.out.println("6 / 0="+ 6 / 0);
    }

}

```

上面的代码，有些方法上面运用了 @MyTest 注解

<br/>

##### 测试注解: MyTest

```java
package annotation.chapter7.testExample;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface MyTest {
}

```

<br/>

##### 测试工具: TestTool

```java
package annotation.chapter7.testExample;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

public class TestTool {

    public static void main(String[] args) throws NoSuchMethodException, IllegalAccessException, InvocationTargetException, InstantiationException {
        Method[] methods = NoBug.class.getDeclaredMethods();

        //用来记录测试产生的 log 信息
        StringBuilder log = new StringBuilder();
        // 记录异常的次数
        int errornum = 0;

        // 通过反射生成一个测试对象
        NoBug testObj = (NoBug)NoBug.class.getConstructor().newInstance();

        for (Method m : methods) {
            // 只有被 @MyTest标注过的方法才进行测试
            if (m.isAnnotationPresent(MyTest.class)) {
                try {
                    m.setAccessible(true);
                    m.invoke(testObj, null);
                } catch (Exception e) {
                    //e.printStackTrace();
                    errornum++;
                    log.append(m.getName());
                    log.append(" ");
                    log.append("has error:");
                    log.append("\n\r  caused by ");
                    //记录测试过程中，发生的异常的名称
                    log.append(e.getCause().getClass().getSimpleName());
                    log.append("\n\r");
                    //记录测试过程中，发生的异常的具体信息
                    log.append(e.getCause().getMessage());
                    log.append("\n\r");
                }
            }
        }
        log.append(NoBug.class.getSimpleName());
        log.append(" has  ");
        log.append(errornum);
        log.append(" error.");

        // 生成测试报告
        System.out.println(log.toString());
    }
}

```

测试的结果是：

```
1234567890
1-1=0
1+1=11
3 x 5=15
division has error:
  caused by ArithmeticException
/ by zero
NoBug has  1 error.

```

提示 NoBug 类中的 chufa() 这个方法有异常，这个异常名称叫做 ArithmeticException，原因是运算过程中进行了除 0 的操作;

所以，NoBug 这个类有 Bug!

<br/>



#### 2): 把数据库连接的工具类DBUtil改造成为注解的方式

通常来讲，在一个基于JDBC开发的项目里，都会有一个DBUtil这么一个类，在这个类里统一提供连接数据库的IP地址，端口，数据库名称， 账号，密码，编码方式等信息。

如例所示，在这个DBUtil类里，这些信息，就是以属性的方式定义在类里的:

```java
package annotation.chapter7.test.dbutilExample.noAnno;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBUtil {

    private static String ip = "127.0.0.1";
    private static int port = 3306;
    private static String database = "test";
    private static String encoding = "UTF-8";
    private static String username = "root";
    private static String password = "admin";
    static {
        try {
            Class.forName("com.mysql.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }

    public static Connection getConnection() throws SQLException {
        String url = String.format("jdbc:mysql://%s:%d/%s?characterEncoding=%s", ip, port, database, encoding);
        return DriverManager.getConnection(url, username, password);
    }
    public static void main(String[] args) throws SQLException {
        System.out.println(getConnection());
    }

}

```

<br/>

**通过注解方式**

首先创建`@JDBCConfig`注解, 将配置信息放入注解中提供:

```java
package annotation.chapter7.test.dbutilExample.anno;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.TYPE})
@Inherited
@Documented
public @interface JDBCConfig {
    String ip();
    int port() default 3306;
    String database();
    String encoding() default "UTF-8";
    String username();
    String password();
}

```

然后进行注解解析和数据库注册等:

```java
package annotation.chapter7.test.dbutilExample.anno;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

@JDBCConfig(ip = "127.0.0.1", database = "test", username = "root", password = "admin")
public class DBUtil {

    static {
        try {
            Class.forName("com.mysql.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }

    public static Connection getConnection() throws SQLException, SecurityException {
        JDBCConfig config = DBUtil.class.getAnnotation(JDBCConfig.class);

        String ip = config.ip();
        int port = config.port();
        String database = config.database();
        String encoding = config.encoding();
        String loginName = config.username();
        String password = config.password();

        String url = String.format("jdbc:mysql://%s:%d/%s?characterEncoding=%s", ip, port, database, encoding);
        return DriverManager.getConnection(url, loginName, password);
    }

    public static void main(String[] args) throws SecurityException, SQLException {
        Connection c = getConnection();
        System.out.println(c);
    }
}

```

<br/>



### 8. 注解应用实例

#### 1): JUnit

JUnit 这个是一个测试框架，典型使用方法如下：

```java
public class ExampleUnitTest {
    @Test
    public void addition_isCorrect() throws Exception {
        assertEquals(4, 2 + 2);
    }
}
```

<br/>



#### 2): Retrofit

很牛的 Http 网络访问框架

```java
public interface GitHubService {
  @GET("users/{user}/repos")
  Call<List<Repo>> listRepos(@Path("user") String user);
}

Retrofit retrofit = new Retrofit.Builder()
    .baseUrl("https://api.github.com/")
    .build();

GitHubService service = retrofit.create(GitHubService.class);
```

当然，还有许多注解应用的地方，这里不一一列举。

<br/>



---------------------------



### 9. 总结

本篇文章的内容包括:

-   注解的作用;
-   注解的基本语法，创建如同接口，但是多了个 @ 符号;
-   注解的元注解;
-   注解的属性;
-   Java的5个预置注解;
-   注解的提取, 主要包括在类名修饰的注解, 和在方法/变量等修饰的注解;
-   注解使用场景
-   使用注解的一些例子
-   一些注解的应用实例

最后要注意的是: <font color="#ff0000">注解的提取需要借助于 Java 的反射技术，*反射比较慢*，所以注解使用时也需要谨慎计较时间成本!</font>

<br/>

### 附录

参考文章: 

-   [秒懂，Java 注解 （Annotation）你可以这样学](https://blog.csdn.net/briblue/article/details/73824058#commentBox)

-   [注解系列教材](http://how2j.cn/k/annotation/annotation-brief/1055.html)

<br/>

示例代码: https://github.com/JasonkayZK/Java_Samples/tree/java-annotation
