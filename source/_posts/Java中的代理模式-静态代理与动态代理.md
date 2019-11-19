---
title: Java中的代理模式-静态代理与动态代理
toc: true
date: 2019-09-18 09:36:24
cover: https://imgconvert.csdnimg.cn/aHR0cDovL2ltZy5ibG9nLmNzZG4ubmV0LzIwMTcwNjI5MjEzOTM4NzM2
categories: 学习案例
tags: [代理模式, JDK动态代理, CGLib动态代理, 静态代理]
description: 反射技术中常见的一个概念就是动态代理, 本篇文章主要讲述了代理模式, 动态代理与静态代理等.
---



在Spring的体系下, 大多数的实现都在使用动态代理, 如: Spring的AOP, 事务注解等. 而Mybatis的mapper, 分页插件也都离不开代理模式. 

<br/>

本篇文章讲述了代理模式相关的内容, 主要包括:

-   什么是代理? 如何使用代理?
-   代理模式
-   静态代理
-   动态代理的实现, 语法, 内幕
-   CGLib动态代理和JDK动态代理的区别与应用
-   Spring中使用了哪种代理方法
-   .....................

<!--more-->

## Java中的代理模式

### 1. 什么是代理?

代理是英文 Proxy 翻译过来的. 我们在生活中见到过的代理, 大概最常见的就是朋友圈中卖面膜的同学了.

她们从厂家拿货，然后在朋友圈中宣传，然后卖给熟人.

![代理](https://imgconvert.csdnimg.cn/aHR0cDovL2ltZy5ibG9nLmNzZG4ubmV0LzIwMTcwNjI5MjEzOTExMTYy)


​	<br/>

按理说，顾客可以直接从厂家购买产品，但是现实生活中，很少有这样的销售模式。一般都是厂家委托给代理商进行销售，顾客跟代理商打交道，而不直接与产品实际生产者进行关联. 所以，代理就有一种中间人的味道。

<br/>



---------------------------------------



### 2. 代理模式

代理模式是面向对象编程中比较常见的设计模式. 这是常见代理模式常见的 UML 示意图: 

![代理模式常见的 UML 示意图](https://imgconvert.csdnimg.cn/aHR0cDovL2ltZy5ibG9nLmNzZG4ubmV0LzIwMTcwNjI5MjEzOTM4NzM2)

<br/>

需要注意的有下面几点：

-   用户<font color="#0000ff">只关心接口功能，而不在乎谁提供了功能. </font>上图中接口是 Subject;
-   <font color="#0000ff">接口真正实现者是上图的 RealSubject，但是它不与用户直接接触，而是通过代理;</font>
-   <font color="#0000ff">代理就是上图中的 Proxy，由于它实现了 Subject 接口，所以它能够直接与用户接触;</font>
-   用户调用 Proxy 的时候，Proxy 内部调用了 RealSubject; 所以，Proxy 是中介者，它<font color="#ff0000">可以增强 RealSubject 操作;</font>

<br/>



----------------------------



### 3. 静态代理实例

我们平常去电影院看电影的时候，在电影开始的阶段是不是经常会放广告呢？

电影是电影公司委托给影院进行播放的，但是影院可以在播放电影的时候，产生一些自己的经济收益，比如卖爆米花、可乐等，然后在影片开始结束时播放一些广告。

现在用代码来进行模拟。

#### 1): 静态代理服务接口: MovieService

首先得有一个接口，通用的接口是代理模式实现的基础。这个接口我们命名为 MovieService，代表电影播放的服务

```java
package proxy.staticProxy.service;

public interface MovieService {
    void play();
}

```

<br/>



#### 2): 静态代理服务实现类: MovieServiceImpl

然后, 我们要有一个真正的实现这个Service的实现类

```java
package proxy.staticProxy.service.impl;

import proxy.staticProxy.service.MovieService;

public class MovieServiceImpl implements MovieService {

    @Override
    public void play() {
        System.out.println("您正在观看电影 《肖申克的救赎》");
    }
}

```

<br/>



#### 3): 服务的代理类: MovieProxy

最后我们还需要一个Movie服务的代理类.(相当于Cinema, 负责调用电影播放的功能, 同时再加上电影播放前后的广告等!)

```java
package proxy.staticProxy.proxy;

import proxy.staticProxy.service.MovieService;
import proxy.staticProxy.service.impl.MovieServiceImpl;

public class MovieProxy implements MovieService {

    MovieServiceImpl movieService;

    public MovieProxy(MovieServiceImpl movieService) {
        super();
        this.movieService = movieService;
    }

    @Override
    public void play() {
        advertise(true);
        movieService.play();
        advertise(false);
    }

    public void advertise(boolean isStart) {
        System.out.println(isStart ? "电影马上开始了，爆米花、可乐、口香糖9.8折，快来买啊！" : "电影马上结束了，爆米花、可乐、口香糖9.8折，买回家吃吧！");
    }


}

```

MovieProxy就是 Proxy 代理对象，它有一个 play() 方法。不过在调用MovieServiceImpl的play() 方法时，它进行了一些相关利益的处理，那就是广告!

<br/>

#### 4): 测试代码:

```java
package proxy.staticProxy;

import proxy.staticProxy.proxy.MovieProxy;
import proxy.staticProxy.service.impl.MovieServiceImpl;

public class StaticProxyTest {

    public static void main(String[] args) {
        new MovieProxy(new MovieServiceImpl()).play();
    }
}

```

最后可以看到输出的结果:

```
电影马上开始了，爆米花、可乐、口香糖9.8折，快来买啊！
您正在观看电影 《肖申克的救赎》
电影马上结束了，爆米花、可乐、口香糖9.8折，买回家吃吧！
```

<br/>



#### 5): 静态代理小结

<font color="#0000ff">代理模式可以在不修改被代理对象的基础上，通过扩展代理类(*例如: 通过构造函数传入具体业务方法的引用等*)，进行一些功能的附加与增强;</font>

<font color="#ff0000">值得注意的是，代理类和被代理类应该`共同实现一个接口，或者是共同继承某个类;`</font>

**为什么叫做静态呢?**

因为它的**类型是事先预定好的**, 比如上面代码中的 MovieProxy 这个类. 

但是对于真正的调用来说, 实际上并不关心这个代理对象, 只要能够实现相应的业务逻辑就好, 而并不需要MovieProxy这个类! 

对于静态代理而言, 我们需要手动编写代码让 MovieProxy 实现 Movie 接口，而<font color="#ff0000">在动态代理中，我们可以让程序在运行的时候自动在内存中创建一个实现 MovieProxy 接口的代理，而不需要去定义 MovieProxy 这个类</font>



<br/>

-----------------------------------------



### 4. 动态代理实例: 初窥

假设有一个大商场，商场有很多的柜台，有一个柜台卖茅台酒. 

我们进行代码的模拟:

#### 1): 动态代理接口 WineService

```java
package proxy.dynamicProxy.service;

public interface WineService {
    void sellWine();
}

```

<br/>



#### 2): 服务接口具体实现类: WineServiceImpl

```java
package proxy.dynamicProxy.service.impl;

import proxy.dynamicProxy.service.WineService;

public class WineServiceImpl implements WineService {

    @Override
    public void sellWine() {
        System.out.println("我卖得是茅台酒。");
    }
}

```

<br/>



#### 3): 动态代理类: WineHandler

有了卖酒的服务之后, 我们还要有一个代理类, 帮助我们在卖酒的同时做一些别的事情: 比如在卖酒的前后对这笔交易做一个记录!

```java
package proxy.dynamicProxy.handler;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;

public class WineHandler implements InvocationHandler {

    private Object wine;

    public WineHandler(Object wine) {
        this.wine = wine;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("销售开始  柜台是： "+this.getClass().getSimpleName());
        method.invoke(wine, args);
        System.out.println("销售结束");
        return null;
    }

}

```

<br/>



#### 4): 测试代码:

```java
package proxy.dynamicProxy;

import proxy.dynamicProxy.handler.WineHandler;
import proxy.dynamicProxy.service.WineService;
import proxy.dynamicProxy.service.impl.WineServiceImpl;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;

public class DynamicProxyTest {

    public static void main(String[] args) {
        WineService wineService = new WineServiceImpl();

        InvocationHandler handler = new WineHandler(wineService);

        WineService dynamicProxy = (WineService) Proxy.newProxyInstance(WineService.class.getClassLoader(), WineServiceImpl.class.getInterfaces(), handler);

        dynamicProxy.sellWine();
    }
}

```

代码如上所示: 

我们首先创建了一个卖酒服务的实现类WineServiceImpl, 然后将它传递给代理的Handler, 并通过 `Proxy.newProxyInstance();`方法创建了一个实际的代理对象, 最后通过调用生成的代理对象的方法完成了交易!

输出如下:

```
销售开始  柜台是： WineHandler
我卖得是茅台酒。
销售结束
```

<br/>



#### 5): 动态代理分析

<font color="#0000ff">动态代码涉及了一个非常重要的类 Proxy. 正是通过 Proxy 的静态方法 newProxyInstance 才会动态创建代理!</font>



##### Proxy.newProxyInstance()方法

```java
// Proxy生成代理类的方法
public static Object newProxyInstance(ClassLoader loader,
                                          Class<?>[] interfaces,
                                          InvocationHandler h)
```

下面讲解它的 3 个参数意义:

-   loader: 自然是类加载器
-   interfaces: 代码要用来代理的接口
-   h: 一个 InvocationHandler 对象

<br/>

##### InvocationHandler

InvocationHandler 是一个接口. <font color="#ff0000">每个代理的实例都有一个与之关联的 InvocationHandler 实现类，如果*代理的方法被调用，那么代理便会通知和转发给内部的 InvocationHandler 实现类，由它决定处理*;</font>

```java
public interface InvocationHandler {
    public Object invoke(Object proxy, Method method, Object[] args)
        throws Throwable;
}
```

<font color="#ff0000">InvocationHandler 内部只有一个 invoke() 方法，正是这个方法决定了怎么样处理代理传递过来的方法调用</font>

-   proxy: 代理对象
-   method: 代理对象调用的方法
-   args: 调用的方法中的参数

<font color="#ff0000">Proxy 动态产生的代理会调用 InvocationHandler 实现类，所以 *InvocationHandler 是实际执行者*</font>

<br/>

----------------------------------------------



### 5. 动态代理的又一个例子: 对比

乍看一下, 动态代理和静态代理都差不多, 都很麻烦, 只不过一个需要自己编写Proxy类, 一个需要编写Handler而已.

下面加深一下业务难度: 我们不仅要卖**茅台酒**，还想卖**五粮液**.

#### 1): 服务接口另一个实现类 WineServiceImpl2

```java
package proxy.dynamicProxy.service.impl;

import proxy.dynamicProxy.service.WineService;

public class WineServiceImpl2 implements WineService {

    @Override
    public void sellWine() {
        System.out.println("我卖得是五粮液。");
    }
}

```

此时WineServiceImpl2也实现了WineService这个接口, 同样可以通过Handler生成对应的代理类.

<br/>



#### 2): 测试代码:

```java
package proxy.dynamicProxy;

import proxy.dynamicProxy.handler.WineHandler;
import proxy.dynamicProxy.service.WineService;
import proxy.dynamicProxy.service.impl.WineServiceImpl;
import proxy.dynamicProxy.service.impl.WineServiceImpl2;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;

public class DynamicProxyTest2 {

    public static void main(String[] args) {
        WineService wineService1 = new WineServiceImpl();
        WineService wineService2 = new WineServiceImpl2();

        InvocationHandler handler1 = new WineHandler(wineService1);
        InvocationHandler handler2 = new WineHandler(wineService2);

        ((WineService)Proxy.newProxyInstance(WineService.class.getClassLoader(),WineServiceImpl.class.getInterfaces(), handler1)).sellWine();

        ((WineService)Proxy.newProxyInstance(WineService.class.getClassLoader(),WineServiceImpl2.class.getInterfaces(), handler2)).sellWine();


    }
}

```

输出如下:

```
销售开始  柜台是： WineHandler
我卖得是茅台酒。
销售结束
销售开始  柜台是： WineHandler
我卖得是五粮液。
销售结束
```

仅仅增加了一个服务接口对应的实现类便完成了从茅台酒到五粮液酒的转换, 这就是动态代理与静态代理的区别!

<br/>



#### 3): 动态代理与静态代理比较

<font color="#ff0000">如果是静态代理的话, 还需要修改Proxy类中构造函数的参数类型或者创建一个新的Proxy代理来完成! 因为对于静态代理来说, 一旦代码固定, 则代理类就固定下来了! 而通过动态代理, 可以在运行时, 通过反射来创建代理类!</font>

<font color="#ff0000">其实这也是代理模式的设计思想: 通过代理的方式避免暴露被代理对象或者说代理不容易被取得的对象，满足开闭原则!</font>

<br/>

##### 补充: 开闭原则

<font color="#ff0000">开闭原则，对于扩展是开放的，对于修改是关闭。在本例中, 我们通过增加了一个WineServiceImpl2业务实现类, 从而避免了类似静态代理修改Proxy中的构造函数, 显然满足开闭原则!</font>



<br/>

------------------------------------



### 6. 动态代理的最终例子: 内幕

现在扩大商场的经营，除了卖酒之外，还要卖烟!

#### 1): 香烟服务接口 CigarService

```java
package proxy.dynamicProxy.service;

public interface CigarService {
    void sell();
}

```

<br/>



#### 2): 香烟服务实现类 CigarServiceImpl

```java
package proxy.dynamicProxy.service.impl;

import proxy.dynamicProxy.service.CigarService;

public class CigarServiceImpl implements CigarService {

    @Override
    public void sell() {
        System.out.println("售卖的是正宗的芙蓉王，可以扫描条形码查证。");
    }
}

```

<br/>



#### 3): 测试代码:

```java
package proxy.dynamicProxy;

import proxy.dynamicProxy.handler.WineHandler;
import proxy.dynamicProxy.service.CigarService;
import proxy.dynamicProxy.service.WineService;
import proxy.dynamicProxy.service.impl.CigarServiceImpl;
import proxy.dynamicProxy.service.impl.WineServiceImpl;
import proxy.dynamicProxy.service.impl.WineServiceImpl2;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;

public class DynamicProxyTest3 {

    public static void main(String[] args) {
        WineService wineService1 = new WineServiceImpl();
        WineService wineService2 = new WineServiceImpl2();
        CigarService cigarService = new CigarServiceImpl();

        InvocationHandler handler1 = new WineHandler(wineService1);
        InvocationHandler handler2 = new WineHandler(wineService2);
        InvocationHandler handler3 = new WineHandler(cigarService);

        ((WineService) Proxy.newProxyInstance(WineService.class.getClassLoader(),
                WineServiceImpl.class.getInterfaces(), handler1)).sellWine();

        ((WineService)Proxy.newProxyInstance(WineService.class.getClassLoader(),  WineServiceImpl2.class.getInterfaces(), handler2)).sellWine();

        ((CigarService)Proxy.newProxyInstance(CigarService.class.getClassLoader(), CigarServiceImpl.class.getInterfaces(), handler3)).sell();
    }
}

```

上述代码通过Proxy.newProxyInstance() 方法, 分别产生了SellWine 和 SellCigarette 两种接口的实现类代理, 并且使用的Handler是同一个!

这就是动态代理与静态代理的另一个区别: <font color="#ff0000">动态代理通过解耦, 将Proxy中业务逻辑相同的部分, 放入的同一个Handler中, 简化了代码! 从而避免了对于不同的Proxy在处理相同的业务逻辑时, 还要写大量重复的代码!</font>

<br/>

#### 4): 动态代理的秘密

为什么 Proxy 能够动态产生不同接口类型的代理? 其实是通过传入进去的接口然后通过反射动态生成了一个接口实例!

如: 对于WineService 接口， Proxy.newProxyInstance() 内部肯定会有一个sellWine()方法供我们调用!

通过查看`Proxy.newProxyInstance() `源码, 下述代码是在**JDK 11** 中的源码:

```java
    @CallerSensitive
    public static Object newProxyInstance(ClassLoader loader, Class<?>[] interfaces, InvocationHandler h) {
        Objects.requireNonNull(h);
        Class<?> caller = System.getSecurityManager() == null ? null : Reflection.getCallerClass();
        
        /*
         * Look up or generate the designated proxy class and its constructor.
         */
        Constructor<?> cons = getProxyConstructor(caller, loader, interfaces);
        return newProxyInstance(caller, cons, h);
    }

```

在调用时:

-   <font color="#00ff00">首先通过Object的静态方法判断传入的Handler不为null</font>:

```java
    public static <T> T requireNonNull(T obj) {
        if (obj == null) {
            throw new NullPointerException();
        } else {
            return obj;
        }
    }
```

<br/>

-   <font color="#00ff00">然后通过通过`getProxyConstructor`方法创建了代理类，并返回了该类的构造方法</font>:

```java
private static Constructor<?> getProxyConstructor(Class<?> caller, ClassLoader loader, Class<?>... interfaces) {
        if (interfaces.length == 1) {
            Class<?> intf = interfaces[0];
            if (caller != null) {
                checkProxyAccess(caller, loader, intf);
            }

            return (Constructor)proxyCache.sub(intf).computeIfAbsent(loader, (ld, clv) -> {
                return (new Proxy.ProxyBuilder(ld, (Class)clv.key())).build();
            });
        } else {
            Class<?>[] intfsArray = (Class[])interfaces.clone();
            if (caller != null) {
                checkProxyAccess(caller, loader, intfsArray);
            }

            List<Class<?>> intfs = Arrays.asList(intfsArray);
            return (Constructor)proxyCache.sub(intfs).computeIfAbsent(loader, (ld, clv) -> {
                return (new Proxy.ProxyBuilder(ld, (List)clv.key())).build();
            });
        }
    }
```

在`getProxyConstructor`函数中，可以看到if-else分支，这里是对单接口的情况做了代码优化。我们主要关注其代理类的生成部分，就是`new ProxyBuilder(ld, clv.key()).build()`!

```
(ld, clv) -> new ProxyBuilder(ld, clv.key()).build() 这种写法是lambda表达式的语法，非常精简。 
```

<br/>

```java
        Constructor<?> build() {
            Class proxyClass = defineProxyClass(this.module, this.interfaces);

            final Constructor cons;
            try {
                cons = proxyClass.getConstructor(Proxy.constructorParams);
            } catch (NoSuchMethodException var4) {
                throw new InternalError(var4.toString(), var4);
            }

            AccessController.doPrivileged(new PrivilegedAction<Void>() {
                public Void run() {
                    cons.setAccessible(true);
                    return null;
                }
            });
            return cons;
        }
```

在build方法中，从语意上可以看到代理类`proxyClass`在`defineProxyClass`方法中生成。之后通过反射并根据构造函数的参数，获取到代理类的构造方法并返回;

<br/>

-   最后使用反射，生成代理类的对象并返回:

```java
    private static Object newProxyInstance(Class<?> caller, Constructor<?> cons, InvocationHandler h) {
        try {
            if (caller != null) {
                checkNewProxyPermission(caller, cons.getDeclaringClass());
            }

            return cons.newInstance(h);
        } catch (InstantiationException | IllegalAccessException var5) {
            throw new InternalError(var5.toString(), var5);
        } catch (InvocationTargetException var6) {
            Throwable t = var6.getCause();
            if (t instanceof RuntimeException) {
                throw (RuntimeException)t;
            } else {
                throw new InternalError(t.toString(), t);
            }
        }
    }
```

<br/>



---------------------------------------------------



### 7. CGLib动态代理和JDK动态代理的区别

根据动态代理的实现方式不同, 又分为`CGLib动态代理`和`JDK自带动态代理`!

#### 1): JDK动态代理例子

##### 业务接口 MyService(必须)

```java
package proxy.jdk.service;

/**
 * 业务服务的最顶层接口，必须!!
 */
public interface MyService {
    void gotoSchool();
    void gotoWork();
    void oneDay();
    void oneDayFinal();
}

```

<br/>

##### 业务接口实现类 MyServiceImpl(非必须!)

```java
package proxy.jdk.service.impl;

import proxy.jdk.service.MyService;

/**
 * 需要被代理的类，实现了顶层接口，非必须!!
 */
public class MyServiceImpl implements MyService {
    @Override
    public void gotoSchool() {
        System.out.println("gotoSchool");
    }
    @Override
    public void gotoWork() {
        System.out.println("gotoWork");
    }
    @Override
    public void oneDay() {
        gotoSchool();
        gotoWork();
    }
    @Override
    public final void oneDayFinal() {
        gotoSchool();
        gotoWork();
    }
}

```

<br/>

##### 代理类 MyInvocationHandler

```java
package proxy.jdk.handler;

import proxy.jdk.service.MyService;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;

/**
 * InvocationHandler 的一个实现，实际上处理代理的逻辑在这里
 *
 * 甚至可以不需要写Service接口的实现类, 而在Handler中写!
 *
 */
public class MyInvocationHandler implements InvocationHandler {

    MyService service;

    public MyInvocationHandler(MyService service) {
        this.service = service;
    }

    public void aopMethod() {
        System.out.println("before method");
    }

    // 继承方法，代理时实际执行的方法;
    // 如果要实现原方法，则需要调用method.invoke(service, args);
    // 这里还调用了一个aopMethod(),可以类比于Spring中的切面before注解;
    @Override
    public Object invoke(Object o, Method method, Object[] args) throws Throwable {
        aopMethod();
        return method.invoke(service, args);
    }
}

```

<br/>

##### 方法测试 JavaProxyTest

```java
package proxy.jdk;

import proxy.jdk.handler.MyInvocationHandler;
import proxy.jdk.service.MyService;
import proxy.jdk.service.impl.MyServiceImpl;

import java.lang.reflect.Proxy;

@SuppressWarnings("restriction")
public class JavaProxyTest {

    public static void main(String[] args) {

        MyService newService = (MyService) Proxy.newProxyInstance(MyService.class.getClassLoader(),
                MyServiceImpl.class.getInterfaces(),
                new MyInvocationHandler(new MyServiceImpl()));

        // 这里可以看到这个类以及被代理，在执行方法前会执行aopMethod();
        // 这里需要注意的是oneDay（）方法和oneDayFinal（）的区别;
        // oneDayFinal的方法aopMethod执行1次，oneDay的aopMethod执行1次!!!
        newService.gotoSchool();
        newService.gotoWork();
        newService.oneDay();
        newService.oneDayFinal();
    }
}

```

最终输出结果为:

```
before method
gotoSchool
before method
gotoWork
before method
gotoSchool
gotoWork
before method
gotoSchool
gotoWork
```

即最终通过代理类, 会在调用每一个业务方法之前, 都调用在代理类中创建的`aopMethod()方法!`

**需要注意的是: oneDay()方法和oneDayFinal()的区别!!!!**: 

<font color="#ff0000"> oneDayFinal的方法在具体业务实现类中被声明为`final`! 最终aopMethod执行1次，oneDay的aopMethod执行1次!!!</font>

在下面CGLib中可以看出, 由于实现方式不同而导致的最终结果不同!( **被final声明的方法不可被继承**!)

<br/>



#### 2): CGLib动态代理例子

<font color="#ff0000">与JDK动态代理通过顶层接口与反射生成代理对象不同, CGLib可以通过动态生成字节码技术, 直接通过业务实现类完成动态代理!</font>

##### 配置CGLib依赖

```java
    <dependencies>
        <dependency>
            <groupId>cglib</groupId>
            <artifactId>cglib</artifactId>
            <version>3.2.6</version>
        </dependency>
    </dependencies>
```

由于CGLib不属于JDK自带的库, 所以需要通过Maven配置相关的依赖. 如上.

<br/>



##### 服务直接实现类 CGLibServiceImpl

```java
package proxy.cglib.service.impl;

/**
 * 需要被代理的类，不需要实现顶层接口!!
 */
public class CGLibServiceImpl {

    public void goHome() {
        System.out.println("============Go Home============");
    }

    public void gotoSchool() {
        System.out.println("===========Go to school============");
    }

    public void oneday() {
        goHome();
        gotoSchool();
    }

    public final void onedayFinal() {
        goHome();
        gotoSchool();
    }
}

```

<br>



##### 拦截类 MyInterceptor

拦截类完成类似于jdk动态代理中的InvocationHandler的功能, 不过是通过动态生成字节码技术实现!

```java
package proxy.cglib.interceptor;

import net.sf.cglib.proxy.MethodInterceptor;
import net.sf.cglib.proxy.MethodProxy;
import proxy.cglib.service.impl.CGLibServiceImpl;

import java.lang.reflect.Method;

/**
 * 可以类比于jdk动态代理中的InvocationHandler, 实际上被代理后重要的类!
 *
 * 实际上后续执行的就是intercept里的方法;
 *
 * 如果需要执行原来的方法，则调用 method.invoke(s, args);
 *
 * 这里也加了一个aopMethod();
 */
public class MyInterceptor implements MethodInterceptor {

    private CGLibServiceImpl service;

    public MyInterceptor(CGLibServiceImpl service) {
        this.service = service;
    }

    private void aopMethod() {
        System.out.println("i am aopMethod");
    }

    @Override
    public Object intercept(Object o, Method method, Object[] args, MethodProxy methodProxy) throws Throwable {
        aopMethod();
        return method.invoke(service, args);
    }

}

```

<br/>



##### 测试代码

```java
package proxy.cglib;

import net.sf.cglib.proxy.Callback;
import net.sf.cglib.proxy.Enhancer;
import proxy.cglib.interceptor.MyInterceptor;
import proxy.cglib.service.impl.CGLibServiceImpl;
import proxy.jdk.service.MyService;

public class CGLibProxyTest {

    public static void main(String[] args) {
        Enhancer enhancer = new Enhancer();
        Callback c = new MyInterceptor(new CGLibServiceImpl());

        enhancer.setSuperclass(CGLibServiceImpl.class);
        enhancer.setCallback(c);

        CGLibServiceImpl helper = (CGLibServiceImpl) enhancer.create();

        helper.goHome();
        helper.gotoSchool();
        System.out.println();
        // 这里可以看到这个类以及被代理，在执行方法前会执行aopMethod（）;
        // 这里需要注意的是oneDay（）方法和onedayFinal（）的区别:
        // onedayFinal的方法aopMethod执行2次，oneDay的aopMethod执行1次!!!!
        // 注意这里和jdk的代理的区别!!!
        helper.oneday();
        System.out.println();

        helper.onedayFinal();
    }

}

```

输出结果:

```
i am aopMethod
============Go Home============
i am aopMethod
===========Go to school============

i am aopMethod
============Go Home============
===========Go to school============

i am aopMethod
============Go Home============
i am aopMethod
===========Go to school============
```

可以看出与JDK不同的是: <font color="#ff0000">对于业务实现类中被声明为final的方法, 通过CGLib动态代理, *调用了两次aopMethod()方法!*</font>

**原因在于:**

<font color="#ff0000">cglib是直接继承了原有类，实现了Factory接口，而jdk是实现了自己的顶层接口，继承了Proxy接口! 这里需要注意一下，这样的话，按照类来找话，jdk就找不到他的实现了，因为他的实现类实际上是一个Proxy类，而不是他自己!</font>

<font color="#ff0000">而正是由于cglib是基于继承的方式实现类的动态代理，因此无法实现对final方法的代理!</font>



<br/>



#### 3): 两种动态代理的区别

| 名称          | 备注                                                         |
| ------------- | ------------------------------------------------------------ |
| 静态代理      | 简单，代理模式，是动态代理的理论基础. 常见使用在代理模式     |
| jdk动态代理   | <font color="#ff0000">需要有顶层接口才能使用，但是在只有顶层接口的时候也可以使用.</font>常见是mybatis的mapper文件是代理。<br />使用反射完成。使用了动态生成字节码技术。 |
| cglib动态代理 | <font color="#ff0000">可以直接代理类，使用字节码技术，不能对 final类进行继承.</font><br/>使用了动态生成字节码技术。 |

<br/>



#### 4): 动态代理底层实现

<font color="#00ff00">生成代码的过程中，都使用了缓存，jdk自带的使用了weakReference引用，而cglib使用的直接是 WeakHashMap，基本也类似;</font>

具体两种方法的底层字节码可参见本篇参考文章: 

[cglib动态代理和jdk动态代理的区别与应用](https://blog.csdn.net/doujinlong1/article/details/80680149)

这里不再赘述!

<br/>



---------------------



### 8. Spring中使用的是哪种代理方式呢?

-   <font color="#ff0000">如果一个类有顶层接口，则*默认使用*jdk的动态代理来代理;</font>
-   <font color="#ff0000">如果直接是一个类，则使用cglib动态代理;</font>
-   <font color="#ff0000">如果没有需要代理的方法，如: 所有方法都没有@Transactional注解，Aop这种，则不会被代理;</font>

**例如:**

对于一个Service的实现类 TestServiceImpl 实现了一个顶层接口TestService: 

```java
@Service
public class TestServiceImpl implements TestService {
    
    @Transactional
    public void updateActual() {
    }
    
}
```

<br/>

然后我们如果在Controller里使用

```java
@Autowired
private TestServiceImpl testServiceImpl;
```

注解来注入，这时候会发现，启动时报错的! 报错也很明显: 

```java
The bean 'testServiceImpl' could not be injected as a 'com.rrc.finance.service.apply.TestServiceImpl' because it is a JDK dynamic proxy that implements:
	com.rrc.finance.service.apply.TestService
```

改成 ：

```java
@Autowired
private  TestService  testServiceImpl; 
```

即可正常启动!

<font color="#ff0000">这证明了动态代理生成的代码是一个  TestService 却不是一个TestServiceImpl! 使用的是jdk的动态代理!</font>

这里去掉事务注解和 去掉接口实现 自己可以再试一下;



<br/>

--------------------------------------



### 9. 总结

-   代理模式本质上的目的是为了增强现有代码的功能;
-   代理分为静态代理和动态代理两种;
-   静态代理，所有代理类需要自己编写代码写成;
-   动态代理，代理类通过 Proxy.newInstance() 方法生成;
-   不管是静态代理还是动态代理，代理与被代理者都要实现两样接口，它们的实质是面向接口编程;
-   静态代理和动态代理的区别是在于要不要开发者自己定义 Proxy 类;
-   动态代理通过 Proxy 动态生成 proxy class，但是它也指定了一个 InvocationHandler 的实现类;
-   动态代理又分为JDK动态代理和CGLib动态代理两, 两者都使用了字节码生成技术;
-   JDK动态代理需要有顶层接口才能使用，在只有顶层接口的时候也可以使用.使用反射完成;
-   CGLib代理可以直接代理类，使用字节码技术, 但不能对 final类进行继承;



<br/>

---------------------------------



### 附录

参考文章: 

-   [轻松学，Java 中的代理模式及动态代理](https://blog.csdn.net/briblue/article/details/73928350)
-   [cglib动态代理和jdk动态代理的区别与应用](https://blog.csdn.net/doujinlong1/article/details/80680149)
-   [Java设计模式（14）----------动态代理原理源码分析](http://www.imooc.com/article/details/id/24883)

<br/>

示例源码: https://github.com/JasonkayZK/Java_Samples/tree/master/src/main/java/proxy



