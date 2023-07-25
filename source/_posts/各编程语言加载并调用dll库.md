---
title: 各编程语言加载并调用dll库
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?2'
date: 2021-01-28 09:39:02
categories: C++
tags: [C++, DLL, 技术杂谈]
description: 在上一篇文章《cmake生成动态链接库dll》中，我们编写C++并生成了DLL库；但是DLL库不仅可以被C系的编程语言调用，也可以被其他编程语言调用；本文给出了较为流行的几种编程语言的DLL调用实例；
---

在上一篇文章《cmake生成动态链接库dll》中，我们编写C++并生成了DLL库；

但是DLL库不仅可以被C系的编程语言调用，也可以被其他编程语言调用；

本文给出了较为流行的几种编程语言的DLL调用实例：

-   Golang
-   Python
-   Java
-   Kotlin
-   JavaScript

源代码：

-   https://github.com/JasonkayZK/cpp_learn/tree/dll

系列文章：

-   [cmake生成动态链接库dll](/2021/01/27/cmake生成动态链接库dll/)
-   [各编程语言加载并调用dll库](/2021/01/28/各编程语言加载并调用dll库/)

<br/>

<!--more-->

## **各编程语言加载并调用dll库**

DLL库并非只能由C/C++加载调用，也可以使用其他相对高级的编程语言调用；

下面我们来介绍几种：

-   Golang
-   Python
-   Java
-   Kotlin
-   JavaScript

<font color="#f00">**注：对于各个编程语言而言，在进行DLL调用时都要遵循一定的类型规则；**</font>

<br/>

### **Golang调用DLL**

Golang在`syscall`中已经提供了系统调用相关的API，我们可以直接使用这个包完成；

代码如下：

demo/run_dll.go

```go
package main

import (
	"fmt"
	"syscall"
)

var (
	dll     = syscall.NewLazyDLL("../lib_out/my_dll.dll")
	addFunc = dll.NewProc("add")
)

func main() {
	ret1, ret2, err := addFunc.Call(123, 22)
	fmt.Println(ret1, ret2, err)
}
```

上面的代码通过`syscall.NewLazyDLL`懒加载了DLL；

随后通过`dll.NewProc`获取到了`add`函数；

最后通过`addFunc.Call`调用了函数，并打印了结果；

运行并获取结果：

```bash
$ go run run_dll.go
145 123 The operation completed successfully.
```

在调用`Call`时，需要注意；下面是Go中Call源码的注释：

```go
// Call executes procedure p with arguments a. It will panic if more than 18 arguments
// are supplied.
//
// The returned error is always non-nil, constructed from the result of GetLastError.
// Callers must inspect the primary return value to decide whether an error occurred
// (according to the semantics of the specific function being called) before consulting
// the error. The error always has type syscall.Errno.
//
// On amd64, Call can pass and return floating-point values. To pass
// an argument x with C type "float", use
// uintptr(math.Float32bits(x)). To pass an argument with C type
// "double", use uintptr(math.Float64bits(x)). Floating-point return
// values are returned in r2. The return value for C type "float" is
// math.Float32frombits(uint32(r2)). For C type "double", it is
// math.Float64frombits(uint64(r2)).
func (p *Proc) Call(a ...uintptr) (r1, r2 uintptr, lastErr error) {
	switch len(a) {
	case 0:
		return Syscall(p.Addr(), uintptr(len(a)), 0, 0, 0)
	case 1:
		return Syscall(p.Addr(), uintptr(len(a)), a[0], 0, 0)
	……
	default:
		panic("Call " + p.Name + " with too many arguments " + itoa(len(a)) + ".")
	}
}
```

首先，调用的参数个数不得多于18个；

其次，<font color="#f00">**返回的err一定不为空（如上面输出的：`The operation completed successfully.`），而调用者需要判断第一个返回值是否符合调用逻辑来判断是否调用成功！**</font>

随后就是，在调用时传参为浮点数时的处理；

<br/>

### **Python调用DLL**

在Python中调用DLL需要引入`ctypes`库；

随后，直接使用`CDLL`引入DLL库即可使用！

代码如下：

demo/run_dll.py

```python
import ctypes

dll = ctypes.CDLL("../lib_out/my_dll.dll")
a = dll.add(1, 2)
print(a)
```

运行代码并输出结果：

```bash
$ python run_dll.py
3
```

<br/>

### **JDK调用DLL前言**

#### **JNI和JNA**

在Java中调用DLL可以使用JNI和JNA两种方式，而JNA是JNI的一层封装，所以相较于JNI会更加容易；

下面简单介绍一下JNI和JNA；

先说JNI(Java Native Interface)，有过不同语言间通信经历的一般都知道，它允许Java代码和其他语言（尤其C/C++）写的代码进行交互，只要遵守调用约定即可；

首先看下JNI调用C/C++的过程，注意写程序时自下而上，调用时自上而下：

![JNI.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/JNI.png)

如果已有一个编译好的.dll/.so文件，如果使用JNI技术调用，我们需要：**首先使用C语言另外写一个.dll/.so共享库，使用SUN规定的数据结构替代C语言的数据结构，调用已有的 dll/so中公布的函数，然后再在Java中载入这个库dll/so，最后编写Java native函数作为链接库中函数的代理；**

经过这些繁琐的步骤才能在Java中调用本地代码。因此，很少有Java程序员愿意编写调用dll/.so库中原生函数的java程序；这也使Java语言在客户端上乏善可陈，可以说JNI是 Java的一大弱点！

那么JNA是什么呢？

JNA(Java Native Access)是一个开源的Java框架，是Sun公司推出的一种调用本地方法的技术，是建立在经典的JNI基础之上的一个框架。之所以说它是JNI的替代者，是因为JNA大大简化了调用本地方法的过程，使用很方便，基本上不需要脱离Java环境就可以完成；

如果要和上图做个比较，那么JNA调用C/C++的过程大致如下：

![JNA.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/JNA.png)

可以看到步骤减少了很多，最重要的是：**我们不需要重写我们的动态链接库文件，而是有直接调用的API，大大简化了我们的工作量；**

JNA只需要我们写Java代码而不用写JNI或本地代码，功能相对于Windows的Platform/Invoke和Python的ctypes；

#### **JNA技术原理**

**JNA使用一个小型的JNI库打桩程序来动态调用本地代码；**

**开发者使用Java接口描述目标本地库的功能和结构，这使得它很容易利用本机平台的功能，而不会产生多平台配置和生成JNI代码的高开销；此外，JNA包括一个已与许多本地函数映射的平台库，以及一组简化本地访问的公用接口；**

>   **注意：**
>
>   JNA是建立在JNI技术基础之上的一个Java类库，它使您可以方便地使用java直接访问动态链接库中的函数；
>
>   原来使用JNI，你必须手工用C写一个动态链接库，在C语言中映射Java的数据类型；
>
>   JNA中提供了一个动态的C语言编写的转发器，可以自动实现Java和C的数据类型映射，你不再需要编写C动态链接库；
>
>   这也意味着，使用JNA技术比使用JNI技术调用动态链接库会有些微的性能损失。但总体影响不大，因为JNA也避免了JNI的一些平台配置的开销；

#### **JNA技术难点**

有过跨语言、跨平台开发的程序员都知道，跨平台、语言调用的难点，就是**不同语言之间数据类型不一致造成**的问题。绝大部分跨平台调用的失败，都是这个问题造成的。关于这一点，不论何种语言，何种技术方案，都无法解决这个问题，JNA也不例外。

上面说到接口中使用的函数必须与链接库中的函数原型保持一致，这是JNA甚至所有跨平台调用的难点，因为C/C++的类型与Java的类型是不一样的，你必须转换类型让它们保持一致，比如printf函数在C中的原型为：

```
void printf(const char *format, [argument]);
```

你不可能在Java中也这么写，Java中是没有char *指针类型的，因此const char *转到Java下就是String类型了。

这就是**类型映射（Type Mappings）**，JNA官方给出的默认类型映射表如下：

![jna_mapping.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/jna_mapping.png)

还有很多其它的类型映射，需要的请到JNA官网查看；

另外，**JNA还支持类型映射定制**，比如：有的Java中可能找不到对应的类型（在Windows API中可能会有很多类型，在Java中找不到其对应的类型），JNA中TypeMapper类和相关的接口就提供了这样的功能；

#### **JNA能完全替代JNI吗？**

这可能是大家比较关心的问题，但是遗憾的是，**JNA是不能完全替代JNI的**，因为有些需求还是必须求助于JNI。

**使用JNI技术，不仅可以实现Java访问C函数，也可以实现C语言调用Java代码；**

**而JNA只能实现Java访问C函数，作为一个Java框架，自然不能实现C语言调用Java代码。此时，你还是需要使用JNI技术；**

JNI是JNA的基础，是Java和C互操作的技术基础。有时候，你必须回归到基础上来！

<br/>

### **Java调用DLL**

看了这么多概念性的东西，接下来我们看一下如何在Java中调用DLL库；

创建一个Maven工程，修改`pom.xml`，加入jna依赖：

```xml
<dependencies>
    <dependency>
        <groupId>net.java.dev.jna</groupId>
        <artifactId>jna</artifactId>
        <version>5.6.0</version>
    </dependency>
</dependencies>
```

编写JNA接口：

src/main/java/io.github.jasonkayzk/java/Add.java

```java
package io.github.jasonkayzk.java;

import com.sun.jna.Library;
import com.sun.jna.Native;

/**
 * 测试JNA调用DLL的接口
 */
public interface Add extends Library {
    /**
     * 根据C提供的接口构造的接口
     */
    int add(int x, int y);

    /**
     * 需要将dll或so件放入Java运行目录
     */
    Add LIBRARY = Native.load("my_dll.dll", Add.class);
}
```

启动类：

src/main/java/io.github.jasonkayzk/java/DllRun.java

```java
package io.github.jasonkayzk.java;

public class DllRun {
    public static void main(String[] args) {
        int res = Add.LIBRARY.add(12, 20);
        System.out.println(res);
    }
}
```

<font color="#f00">**并在resources目录下放入编译好的`my_dll.dll`文件；**</font>

代码说明：

上面的Add接口声明了一个与DLL库中`add`函数对应的接口，并在接口中声明了一个Add接口类型的静态常量LIBRARY：LIBRARY使用`Native.load`方法加载了DLL库；

在DllRun启动类中，使用Add中定义并加载了DLL的常量调用add方法，完成调用！

>   <font color="#f00">**从上面的代码可以看出来，JNA的解决方案相当优雅：通过接口声明代替了头文件，并且直接通过一个函数加载即可像调用Java方法一样调用本地代码！**</font>

<br/>

### **Kotlin调用DLL**

由于Kotlin和Java同属于JVM语言，所以，Java能够实现的，Kotlin当然也能够实现！

而且由于Kotlin更加简洁的语法，和语言抽象能力，所以DLL在Kotlin中使用更加简单；

在上面的Maven项目之上，我们添加Kotlin的插件，修改`pom.xml`：

```xml
<properties>
    <kotlin.version>1.4.30-RC</kotlin.version>
</properties>

<dependencies>
    <dependency>
        <groupId>net.java.dev.jna</groupId>
        <artifactId>jna</artifactId>
        <version>5.6.0</version>
    </dependency>
    <dependency>
        <groupId>org.jetbrains.kotlin</groupId>
        <artifactId>kotlin-stdlib-jdk8</artifactId>
        <version>${kotlin.version}</version>
    </dependency>
    <dependency>
        <groupId>org.jetbrains.kotlin</groupId>
        <artifactId>kotlin-test</artifactId>
        <version>${kotlin.version}</version>
        <scope>test</scope>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.jetbrains.kotlin</groupId>
            <artifactId>kotlin-maven-plugin</artifactId>
            <version>${kotlin.version}</version>
            <executions>
                <execution>
                    <id>compile</id>
                    <phase>compile</phase>
                    <goals>
                        <goal>compile</goal>
                    </goals>
                </execution>
                <execution>
                    <id>test-compile</id>
                    <phase>test-compile</phase>
                    <goals>
                        <goal>test-compile</goal>
                    </goals>
                </execution>
            </executions>
            <configuration>
                <jvmTarget>1.8</jvmTarget>
            </configuration>
        </plugin>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <executions>
                <execution>
                    <id>compile</id>
                    <phase>compile</phase>
                    <goals>
                        <goal>compile</goal>
                    </goals>
                </execution>
                <execution>
                    <id>testCompile</id>
                    <phase>test-compile</phase>
                    <goals>
                        <goal>testCompile</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

编写在Kotlin中加载和调用DLL的代码：

Add接口：

src/main/java/io.github.jasonkayzk/kotlin/Add.kt

```kotlin
package io.github.jasonkayzk.kotlin

import com.sun.jna.Library
import com.sun.jna.Native

interface Add : Library {

    fun add(x: Int, y: Int): Int

    companion object {
        // 懒加载的方式
        val LIBRARY by lazy { Native.load("my_dll.dll", Add::class.java) as Add }
    }
}
```

调用逻辑：

src/main/java/io.github.jasonkayzk/kotlin/DllRun.kt

```kotlin
package io.github.jasonkayzk.kotlin

fun main() {
    val res = Add.LIBRARY.add(10, 20)
    println(res)
    println(res)
}
```

和Java类似，在Kotlin中，我们在Add接口中定义了和DLL对应的add方法，并且定义了一个单例类，以懒加载的方式加载了DLL库；

在main函数中，我们直接使用接口调用了函数，使用起来也是相当简洁！

<br/>

### **JS调用DLL**

在JS中调用DLL的坑比较多；

主要的实现方式有两种：

-   使用C++编写C++ Addons；
-   使用`ffi`库，而ffi库底层使用了编译套件：node-gyp + 各个操作系统的编译环境；

由于配置开发环境较为麻烦，这里不做演示了；

关于使用C++编写C++ Addons，可以Node参考官方文档：

-   https://nodejs.org/api/addons.html

关于`ffi`库，可以参考：

-   https://github.com/node-ffi/node-ffi
-   https://github.com/nodejs/node-gyp#installation

<br/>

## **附录**

源代码：

-   https://github.com/JasonkayZK/cpp_learn/tree/dll

系列文章：

-   [cmake生成动态链接库dll](/2021/01/27/cmake生成动态链接库dll/)
-   [各编程语言加载并调用dll库](/2021/01/28/各编程语言加载并调用dll库/)

文章参考：

-   [JNI的替代者—使用JNA访问Java外部功能接口](https://www.cnblogs.com/lanxuezaipiao/p/3635556.html)

<br/>

