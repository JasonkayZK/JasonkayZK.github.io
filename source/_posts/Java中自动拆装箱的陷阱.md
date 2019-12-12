---
title: Java中自动拆装箱的陷阱
toc: false
date: 2019-12-12 21:16:11
cover: http://api.mtyqx.cn/api/random.php?2
categories: Java源码
tags: [Java源码]
description: 在看《深入理解Java虚拟机》一书时看到的问题，关于Java编译器在进行解语法糖时对于自动拆装箱做出的行为，有时会造成误解或者歧义，所以在此总结一下
---

摘在看《深入理解Java虚拟机》一书时看到的问题，关于Java编译器在进行解语法糖时对于自动拆装箱做出的行为，有时会造成误解或者歧义，所以在此总结一下

<br/>

<!--more-->

## Java中自动拆装箱的陷阱

先提出一个问题: 看下面代码, 分别输出什么结果?

```java
/**
 * @author zk 
 */
public class IntegerTest {

    public static void main(String[] args) {
        Integer a = 1;
        Integer b = 2;
        Integer c = 3;
        Integer d = 3;
        Integer e = 321;
        Integer f = 321;
        Long g = 3L;

        System.out.println(c == d);
        System.out.println(e == f);
        System.out.println(c == (a + b));
        System.out.println(c.equals(a + b));
        System.out.println(g == a + b);
        System.out.println(g.equals(a + b));
    }
}
```

执行之后将分别输出:

```java
System.out.println(c == d); // true
System.out.println(e == f); // false
System.out.println(c == (a + b)); // true
System.out.println(c.equals(a + b)); // true
System.out.println(g == a + b); // true
System.out.println(g.equals(a + b)); // false
```

>   <br/>
>
>   你可能会感到奇怪:
>
>   <font color="#ff0000">**① 为什么Integer(3) == Integer(3)就是true, 而Integer(321) == Integer(321)就是false?**</font>
>
>   <font color="#ff0000">**② 为什么Integer(3) == Integer(1) + Integer(2)与Integer(3).equals(Integer(1) + Integer(2))都是true?**</font>
>
>   <font color="#ff0000">**③ 又为什么Long(3) == Integer(3)是true, 而Long(3).equals(Integer(3))就是false?**</font>

没关系, 这些问题在看完本文都将迎刃而解!

<br/>

### 一. 自动拆装箱等语法糖

下面这一段代码含有了泛型, 自动装箱, 自动拆箱, 遍历循环与变长参数5个语法糖:

```java
public static void main(String[] args) {
    List<Integer> list = Arrays.asList(1, 2, 3, 4);

    int sum = 0;
    for (int i : list) {
        sum += i;
    }
    System.out.println(sum);
}
```

解语法糖后的代码如下:

```java
public static void main(String[] args) {
    List list = Arrays.asList(new Integer[]{
        Integer.valueOf(1),
        Integer.valueOf(2),
        Integer.valueOf(3),
        Integer.valueOf(4)
    });

    int sum = 0;
    for (Iterator localIterator = list.iterator(); localIterator.hasNext();) {
        int i = ((Integer)localIterator.next()).intValue();
        sum += i;
    }
    System.out.println(sum);
}
```

><br/>
>
>**说明:**
>
>① 自动拆装箱在早期编译后被转化为了对应的包装和还原方法;
>
>② 泛型中的参数被擦去, 所以调用时实际上内部做了强制类型转换(Java是伪泛型);
>
>③ 循环遍历把源码还原成了迭代器的实现**(你要是设计了一个类实现了Iterable接口也可以使用此语法糖)**;
>
>④ 变长参数在调用时变为一个数组;

<br/>

### 二. ==与equals的区别

这是一个老生常谈的问题了:

**==表示内存地址是否相等, equals表示两个对象的内容是否相等**

需要注意的是: <font color="#ff0000">**包装类的==运算在不遇到算术运算的情况下不会自动拆箱!**</font>

<br/>

### 三. **Integer底层实现**

整型值赋给一个Integer对象，会出现自动装箱的效果，将自动调用Integer.valueOf方法

```java
public static Integer valueOf(int i) {
     assert IntegerCache.high >= 127;
     if (i >= IntegerCache.low && i <= IntegerCache.high)
         return IntegerCache.cache[i + (-IntegerCache.low)];
     return new Integer(i);
  }
```

从这里可以看出当传入的值如果在IntegerCache.low和IntegerCache.high范围内则使用Integer缓存好的对象来返回，否则重新new一个对象出来

接下来看IntegerCache代码:

```java
private static class IntegerCache {
     static final int low = -128;
     static final int high;
     static final Integer cache[];
     static {
         // high value may be configured by property
         int h = 127;
         String integerCacheHighPropValue =
             sun.misc.VM.getSavedProperty("java.lang.Integer.IntegerCache.high");
         if (integerCacheHighPropValue != null) {
             int i = parseInt(integerCacheHighPropValue);
             i = Math.max(i, 127);
             // Maximum array size is Integer.MAX_VALUE
             h = Math.min(i, Integer.MAX_VALUE - (-low));
         }
         high = h;
         cache = new Integer[(high - low) + 1];
         int j = low;
         for(int k = 0; k < cache.length; k++)
             cache[k] = new Integer(j++);
     }
     private IntegerCache() {}
}
```

><br/>
>
>**说明:**
>
>**① 在Java中对于数值较小的整型是做了缓存优化的(默认是-128~127), 在JVM启动时就将这些数据放入方法区(使用时不需再次创建, 可以直接使用);**
>
>**② 可以对Java运行参数做配置,比如`-Djava.lang.Integer.IntegerCache.high=500`,**
> **那么IntegerCache.high=500, 即对(-128~500)做缓存;**

<br/>

### 四. 问题解答

**① 为什么Integer(3) == Integer(3)就是true, 而Integer(321) == Integer(321)就是false?**

由于3被缓存进入了方法区, 所以实际使用时, 并不会每次都在堆中new出一个新的对象(所以**所有的3都是用同一个常量!**)

而321没有被缓存, 所以每次使用都会在堆中new一个新的对象, 所以在使用==(对象的内存地址)比较时是不同的

<br/>

**② 为什么Integer(3) == Integer(1) + Integer(2)与Integer(3).equals(Integer(1) + Integer(2))都是true?**

-   对于==比较来说:

当Integer类型进行数值运算时, 将会进行自动拆箱, 所以上面的代码<font color="#ff0000">**==两边都会先进行自动拆箱, 然后进行计算后再比较**</font>, 所以输出为true

-   对于equals比较来说:

当求和运算时会先进行拆箱, 在发现使用equals比较时, 又会自动装箱为3, 所以输出也为true

另附上Integer中equals和hashcode的源码:

```java
    /**
     * Returns a hash code for this {@code Integer}.
     *
     * @return  a hash code value for this object, equal to the
     *          primitive {@code int} value represented by this
     *          {@code Integer} object.
     */
    @Override
    public int hashCode() {
        return Integer.hashCode(value);
    }

    /**
     * Returns a hash code for an {@code int} value; compatible with
     * {@code Integer.hashCode()}.
     *
     * @param value the value to hash
     * @since 1.8
     *
     * @return a hash code value for an {@code int} value.
     */
    public static int hashCode(int value) {
        return value;
    }

    /**
     * Compares this object to the specified object.  The result is
     * {@code true} if and only if the argument is not
     * {@code null} and is an {@code Integer} object that
     * contains the same {@code int} value as this object.
     *
     * @param   obj   the object to compare with.
     * @return  {@code true} if the objects are the same;
     *          {@code false} otherwise.
     */
    public boolean equals(Object obj) {
        if (obj instanceof Integer) {
            return value == ((Integer)obj).intValue();
        }
        return false;
    }
```

><br/>
>
>**总结:**
>
>**① Java中Integer的hashcode就是它本身的值;**
>
>**② JDK 8之后增加了求一个int值的hashcode的方法(实际上还是返回这个值, 没有什么卵用, 可能是为了好理解);**
>
><font color="#ff0000">**③ Integer重写了equals方法, 比较时先看是不是同一个类, 如果不是, 直接false(所以即使是一个Long和Integer数值相同, 也是false)**</font>

<br/>

**③ 又为什么Long(3) == Integer(3)是true, 而Long(3).equals(Integer(3))就是false?**

由上equals源码分析不难得出, 使用equals比较由于是不同的类, 所以输出是false;

**而Long(3) == Integer(3)为true的原因是因为: 3被缓存为了常量, 所以都一样!**

<br/>

### 五. 问题延伸

下面的代码分别输出什么呢?

```java
    public static void main(String[] args) {
        Integer a = 250;
        Integer b = 250;
        Integer c = 500;

        Integer d = a + b;
        Integer e = 250 + 250;

        System.out.println(c == d);
        System.out.println(c == e);

        String strA = "250";
        String strB = "250";
        String strC = "250250";

        String strD = strA + strB;
        String strE = "250" + "250";

        System.out.println(strC == strD);
        System.out.println(strC == strE);

        Integer m = 1;
        Integer n = 1;
        Integer o = 2;
        Integer p = m + n;
        Integer q = 1 + 1;

        System.out.println(o == p);
        System.out.println(o == q);
    }
```

答案是:

```
false
false
false
true
true
true
```

<br/>

之前看过String在早期编译优化的同学应该对String的输出结果不会感到惊讶: <font color="#ff0000">**String在通过常量进行连接时, 在编译期会被StringBuilder(JDK 5之前是StringBuffer)编译优化为单个常量!**</font>

但是为什么250 + 250没有被优化呢?

**实际上是被优化的!**

<font color="#ff0000">**在编译期250 + 250被优化为了500, 但是这里的500是Integer.valueOf(500), 所以还是new了一个新的Integer(和String不同)**</font>

**这里千万不能将Integer和String在早期编译时做出的优化给搞混!**

其次, **最后两个都是true, 原因是自动拆装箱用到的Integer.valueOf()方法, 将-128~127缓存了, 所以这些对象都是一样的**

<br/>

### 六. 总结

① 两个 `new Integer()`  比较 ，永远是 false, 其内存地址不同

```java
Integer i = new Integer(100);
Integer j = new Integer(100);
System.out.print(i == j);  //false
```

><br/>
>
>**说明:**
>
>**每一个new的对象使用==都是false, 这是符合我们的预期的(只要不是单例);**
>
><font color="#ff0000">**注意: Integer.valueOf()默认情况下在-128~127使用的是类似于单例的创建方式, 返回的是同一个对象**</font>

<br/>

② `Integer` 和 `new Integer()` 比较 ，永远为 false

因为 Integer变量 指向的是  java **常量池** 中的对象, 而 new Integer()  的变量指向 **堆中** 新建的对象，两者在内存中的地址不同

```java
Integer i = new Integer(100);
Integer j = 100;
System.out.print(i == j);  //false
```

<br/>

③ `int` 变量 与 `Integer`、   `new Integer()` 比较时，只要两个的值是相等，则为true

因为包装类Integer 和 基本数据类型int 比较时，java会自动拆包装为int ，然后进行比较，实际上就变为两个int变量的比较

```java
Integer i = new Integer(100); //自动拆箱为 int i=100; 此时，相当于两个int的比较
int j = 100；
System.out.print(i == j); //true
```

<br/>