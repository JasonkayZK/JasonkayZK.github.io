---
title: 深入剖析Java中的void和java.lang.Void
toc: false
date: 2019-12-12 22:41:42
cover: http://api.mtyqx.cn/api/random.php?6
categories: Java源码
tags: [Java源码]
description: 在Java的源码中, 使用到了很多Void类型(这里不是关键字void, 而是Void类). 本文解析了Java中Void类与void关键字的区别与作用
---

在Java的源码中, 使用到了很多Void类型(这里不是关键字void, 而是Void类). 本文解析了Java中Void类与void关键字的区别与作用

<br/>

<!--more-->

## 深入剖析Java中的void和java.lang.Void

总结为一句话:

**void关键字表示函数没有返回结果，是java中的一个关键字**

**java.lang.Void是一种类型，例如给Void引用赋值null的代码为Void nil=null;**

<br/>

### Void类的特性

通过Void类的源代码可以看到，Void类型不可以继承与实例化:

```java
package java.lang;

/**
 * The {@code Void} class is an uninstantiable placeholder class to hold a
 * reference to the {@code Class} object representing the Java keyword
 * void.
 *
 * @author  unascribed
 * @since   1.1
 */
public final class Void {

    /**
     * The {@code Class} object representing the pseudo-type corresponding to
     * the keyword {@code void}.
     */
    @SuppressWarnings("unchecked")
    public static final Class<Void> TYPE = (Class<Void>) Class.getPrimitiveClass("void");

    /*
     * The Void class cannot be instantiated.
     */
    private Void() {}
}
```

><br/>
>
>**说明:**
>
>**① Void 作为函数的返回结果表示函数返回 null (除了 null 不能返回其它类型)**
>
>```java
>Void function(int a, int b) {
>    //do something
>    return null;
>} 
>```
>
>**② 在泛型出现之前，Void 一般用于反射之中**
>
>例如，下面的代码打印返回类型为 void 的方法名
>
>```java
>public class Test {
>    public void print(String v) {}
>
>    public static void main(String args[]){
>        for(Method method : Test.class.getMethods()) {
>            if(method.getReturnType().equals(Void.TYPE)) {
>                System.out.println(method.getName());
>            }
>        }
>    }
>    
>} 
>```
>
><br/>
>
>③ 泛型出现后，某些场景下会用到 Void 类型
>
>例如:  
>
>-   `Future<T>` 用来保存结果, Future 的 get 方法会返回结果(类型为 T ). 但如果操作并没有返回值呢？这种情况下就可以用 `Future<Void>` 表示:
>
>    当调用 get 后结果计算完毕则返回后将会返回 null
>
>-   Void 也用于无值的 Map 中:
>
>    例如: `Map<T, Void> `这样 map 将具有和 `Set<T> `一样的功能
>
><font color="#ff0000">**因此当你使用泛型时函数并不需要返回结果或某个对象不需要值时候这是可以使用 java.lang.Void 类型表示**</font>

<br/>

### 总结

**① Void 作为函数的返回结果表示方法返回 null (除了 null 不能返回其它类型)**

**② Void用在反射中用来打印返回类型为 void 的方法;**

**③ 使用`Future<T>`来保存结果, 如果操作并没有返回值时可以使用Void;(但是这时候为什么不适用Runnable呢?);**

**④ Void用于无值的 Map 中: `Map<T, Void>`, 这样 map 将具有和 `Set<T> `一样的功能**

**⑤ 使用泛型时函数并不需要返回结果或某个对象不需要值时候这是可以使用 java.lang.Void 类型表示**

<br/>