---
title: Java面试题总结之一
toc: true
date: 2019-12-24 22:37:24
cover: https://acg.yanwz.cn/api.php?13
categories: 面试总结
tags: [Java面试]
description: 这些题是前段时间一位同学在阿里云面试的时候，面试官问到的
---

这些题是前段时间一位同学在阿里云面试的时候，面试官问到的

<!--more-->

### 1. ThreadLocal有什么缺陷？如果是线程池里的线程用ThreadLocal会有什么问题？

ThreadLocal是java.lang包中一个与本地线程变量相关的一个工具类. 主要用于将线程和该线程对应的对象副本做一个映射, 各个线程互相不干扰, 每个线程操作的都是自己本地内存里面的变量.

当创建一个ThreadLocal变量时, 每个线程会复制一个变量到自己的本地内存

如下:

```java
public class ThreadLocalTest {

    public static ThreadLocal<String> localVariable = new ThreadLocal<>();

    public static void main(String[] args) {
        var threadOne = new Thread(() -> {
            localVariable.set("threadOne local variable");
            print("threadOne");
            System.out.println("threadOne remove after" + ":" + localVariable.get());
        });
        var threadTwo = new Thread(() -> {
            localVariable.set("threadTwo local variable");
            print("threadTwo");
            System.out.println("threadTwo remove after" + ":" + localVariable.get());
        });

        threadOne.start();
        threadTwo.start();
    }

    public static void print(String str) {
        System.out.println(str + ":" + localVariable.get());
        localVariable.remove();
    }

}

------- Output -------
threadOne:threadOne local variable
threadTwo:threadTwo local variable
threadTwo remove after:null
threadOne remove after:null
```

ThreadLocal实现的原理是: 在Thread类中有一个threadLocals和inheritableThreadLocal变量, 他们都是ThreadLocalMap类型的变量, 即定制化的HashMap. 默认情况下都为null. 

当线程使用ThreadLocal的set或者get方法时才会创建他们, 而实际上每个线程的本地变量不是存放在ThreadLocal实例中**(ThreadLocal就是一个工具壳, 他通过set方法将value放入调用线程的threadLocals里面存放)**, 而是存放在调用线程的threadLocals变量中.

**ThreadLocal的缺陷:**

ThreadLocalMap是ThreadLocal的内部类，没有实现Map接口，用独立的方式实现了Map的功能，其内部的Entry也独立实现.

在ThreadLocalMap中，也是用Entry来保存K-V结构数据的。但是Entry中key只能是ThreadLocal对象，这点被Entry的构造方法已经限定死了:

```java
static class Entry extends WeakReference<ThreadLocal> {
    /** The value associated with this ThreadLocal. */
    Object value;

    Entry(ThreadLocal k, Object v) {
        super(k);
        value = v;
    }
}
```

><br/>
>
>**注意:**
>
><font color="#ff0000">**Entry继承自WeakReference(`弱引用，生命周期只能存活到下次GC前`)，但只有Key是弱引用类型的，Value并非弱引用**</font>

由于ThreadLocalMap的key是弱引用，而Value是强引用。这就导致了一个问题:

ThreadLocal在没有外部对象强引用时，**发生GC时弱引用Key会被回收，而Value不会回收**. 当线程没有结束，但是ThreadLocal已经被回收，则可能导致线程中存在ThreadLocalMap<null, Object>的键值对，**造成内存泄露。**（`ThreadLocal被回收，ThreadLocal关联的线程共享变量还存在`）

**避免泄露**

为了防止此类情况的出现，我们有两种手段:

-   使用完线程共享变量后，**显式调用ThreadLocalMap.remove方法**清除线程共享变量；
-   **JDK建议ThreadLocal定义为private static**，这样ThreadLocal的弱引用问题则不存在了;

<br/>

**线程池中使用ThreadLocal而不及时清理变量的严重后果!**

如下面这个代码:

```java
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

public class ThreadLocalAndPool {

    private static ThreadLocal<Integer> threadLocal = ThreadLocal.withInitial(() -> 0);

    public static int get() {
        return threadLocal.get();
    }

    public static void remove() {
        threadLocal.remove();
    }

    public static void increment() {
        threadLocal.set(threadLocal.get() + 1);
    }

    public static void main(String[] args) {
        var executorService = new ThreadPoolExecutor(2, 2, 0, TimeUnit.SECONDS, new LinkedBlockingDeque<>(15));

        for(int i = 0; i < 5; ++i) {
            executorService.execute(() -> {
                long threadId = Thread.currentThread().getId();
                int before = get();
                increment();
                int after = get();
                System.out.println("Thread Id: " + threadId + " before " + before + ", after " + after);
            });
        }
        executorService.shutdown();
    }
}
```

><br/>
>
>输出结果为:
>
>Thread Id: 12 before 0, after 1
>
>Thread Id: 12 before 1, after 2
>
>Thread Id: 12 before 2, after 3
>
>Thread Id: 12 before 3, after 4
>
>Thread Id: 13 before 0, after 1
>
>此时Id为12的线程中的ThreadLocal变量由于线程池的复用而不断累加

这个其实就是threadlocal与线程池使用的问题了: <font color="#ff0000">因为ThreadLocal维护的是 Map<Thread,T>这个结构，而线程池是对线程进行复用的，如果没有及时的清理，那么之前对该线程的使用，就会影响到后面的线程了，造成数据不准确</font>

加上remove清理线程变量后:

```java
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

public class ThreadLocalAndPool {

    private static ThreadLocal<Integer> threadLocal = ThreadLocal.withInitial(() -> 0);

    public static int get() {
        return threadLocal.get();
    }

    public static void remove() {
        threadLocal.remove();
    }

    public static void increment() {
        threadLocal.set(threadLocal.get() + 1);
    }

    public static void main(String[] args) {
        var executorService = new ThreadPoolExecutor(2, 2, 0, TimeUnit.SECONDS, new LinkedBlockingDeque<>(15));

        for(int i = 0; i < 5; ++i) {
            executorService.execute(() -> {
                try {
                    long threadId = Thread.currentThread().getId();
                    int before = get();
                    increment();
                    int after = get();
                    System.out.println("Thread Id: " + threadId + " before " + before + ", after " + after);
                } finally {
                    remove();
                }
            });
        }
        executorService.shutdown();
    }

}
```

><br/>
>
>**输出结果:**
>
>Thread Id: 12 before 0, after 1
>
>Thread Id: 12 before 0, after 1
>
>Thread Id: 12 before 0, after 1
>
>Thread Id: 12 before 0, after 1
>
>Thread Id: 13 before 0, after 1

更多关于ThreadLocal见源码分析: [ThreadLocal源码解析](https://jasonkayzk.github.io/2019/12/26/ThreadLocal源码解析/)

<br/>

### 2. 类的加载机制，为什么要用双亲委托？如何打破双亲委托加载机制?

**为什么使用双亲委派**

双亲委派是指对于某个class文件在加载时, 首先会先委托父类加载器进行加载, 如果父类无法加载才会通过本加载器加载. 这样可以保证安全: 比如我也写一个String类, 包名为java.lang.String, 而双亲委派保证了永远加载的是JDK中的String类, 而不会加载自定义的String类, 从而保证的安全, 同时也保证了即使使用不同的类加载器最终加载的也是同一个对象.

**打破双亲委派**

例如: Tomcat这种Web容器, 由于:

-   一个Web容器可能会部署两个或者多个容器, 而不同的应用程序，可能会依赖同一个第三方类库的不同版本，因此要保证每一个应用程序的类库都是独立、相互隔离的;
-   部署在同一个web容器中的相同类库的相同版本可以共享，否则，会有重复的类库被加载进JVM
-   web容器也有自己的类库，不能和应用程序的类库混淆，需要相互隔离
-   web容器支持jsp文件修改后不用重启，jsp文件也是要编译成.class文件的，支持HotSwap功能

导致:

-   如果Tomcat使用JDK默认的类加载器则无法加载两个相同类库的不同版本.

-   修改jsp文件后，因为类名一样，默认的类加载器不会重新加载，而是使用方法区中已经存在的类, 导致无法使用HotSwap功能;

Tomcat为了实现隔离性和热替换，没有使用默认的类加载器，而是自己实现了类加载器：

-   CommonClassLoader：tomcat最基本的类加载器，加载路径中的class可以被tomcat和各个webapp访问

-   CatalinaClassLoader：tomcat私有的类加载器，webapp不能访问其加载路径下的class，即对webapp不可见

-   SharedClassLoader：各个webapp共享的类加载器，对tomcat不可见

-   WebappClassLoader：webapp私有的类加载器，只对当前webapp可见

-   JspClassLoader: 每个jasper类加载器加载一个jsp文件, 每个jsp对应一个唯一的类加载器，当修改jsp的时候，直接卸载唯一的类加载器，然后重新创建类加载器，并加载jsp文件

所以在Tomcat中加载的过称为:

1.  先在本地缓存中查找是否已经加载过该类(对于一些已经加载了的类，会被缓存在`resourceEntries`这个数据结构中)，如果已经加载即返回，否则 继续下一步
2.  让系统类加载器(AppClassLoader)尝试加载该类，主要是为了防止一些基础类会被web中的类覆盖，如果加载到即返回，返回继续
3.  前两步均没加载到目标类，那么web应用的类加载器将自行加载，如果加载到则返回，否则继续下一步
4.  最后还是加载不到的话，则委托父类加载器(Common ClassLoader)去加载



 **手写一个破坏双亲委派的例子**

双亲委派模型只是JVM规范要求, 实际你自己实现的 ClassLoader遵不遵守这个规范完全按照自己的业务需求来定

><br/>
>
>**关键点:**
>
>ClassLoader类有如下两个关键方法:
>
>-   loadClass(String name, boolean resolve)：该方法为ClassLoader的入口点，根据指定的二进制名称来加载类，系统就是调用ClassLoader的该方法来获取指定类对应的Class对象
>
>-   findClass(String name)：根据二进制名称来查找类
>
>如果需要实现自定义的ClassLoader，可以通过重写以上两个方法来实现，当然我们推荐重写findClass()方法，而不是重写loadClass()方法
>
><font color="#ff0000">**一般ClassLoader的实现类都是单例, 这个也可以作为面试中下一步提问的内容**</font>
>
>**补充: 自定义类加载器常用功能**
>
>-   执行代码前自动验证数字签名
>-   根据用户提供的密码解密代码，从而可以实现代码混淆器来避免反编译class文件
>-   根据用户需求来动态地加载类
>-   根据应用需求把其他数据以字节码的形式加载到应用中

详细代码见: [Java实现的自定义类加载器](https://jasonkayzk.github.io/2019/12/25/Java实现的自定义类加载器/)

<br/>

><br/>
>
>**补充:**
>
>**实际上: 使用SPI server provider模式的JDBC, JAXP等都是破坏了双亲委托模式的，在核心类库rt.jar的加载过程中需要加载第三方厂商的类，直接指定使用线程上下文类加载器也就是应用程序类加载器来加载这些类；**
>
>**其他破坏了双亲委派模型的技术:**
>
>-   OSGI是基于Java语言的动态模块化规范，类加载器之间是网状结构，更加灵活，但是也更复杂
>-   JNDI服务，使用线程上线文类加载器，父类加载器去使用子类加载器

<br/>

### 3. 你平时经常用到的设计模式有哪些？

Java中一般认为有23 种设计模式，我们不需要所有的都会，但是其中常用的几种设计模式应该去掌握。下面列出了所有的设计模式, 总体来说设计模式分为三大类：

-   创建型模式，共五种：工厂方法模式、抽象工厂模式、单例模式、建造者模式、原型模式

-   结构型模式，共七种：适配器模式、装饰器模式、代理模式、外观模式、桥接模式、组合模式、享元模式

-   行为型模式，共十一种：策略模式、模板方法模式、观察者模式、迭代子模式、责任链模式、命令模式、备忘录模式、状态模式、访问者模式、中介者模式、解释器模式

由于设计模式较多, 这里仅仅针对常用的几种给出说明, 其他的后期将会在博客中以专题的形式总结:

<font color="#ff0000">**单例模式**</font>

作为对象的创建模式，**单例模式确保其某一个类只有一个实例**，而且自行实例化并向整个系统提供这个实例，这个类称为单例类。单例模式有以下特点:

-   单例类只能有一个实例；
-   单例类必须自己创建自己的唯一实例，也就是说构造函数是私有的；
-   单例类必须给其他所有对象提供这一实例，通过一个统一的结构提供；

单例常见的实现有: **饿汉式**, **懒汉式**, **双检锁**. 除了这三种写法，静态内部类的方式、静态代码块的方式、enum枚举的方式也都可以，不过异曲同工，这三种方式就不写了。

**饿汉式**

就是使用类的时候不管用的是不是类中的单例部分，都直接创建出单例类，看一下饿汉式的写法:

```java
public class SingleEager {
    
    public static SingleEager se = new SingleEager();
    
    private SingleRager () {}
    
    public static SingleEager getInstance() {
        return se;
    }
　
}
```

>   <br/>
>
>   <font color="#ff0000">这种写法不会造成竞争, 原因:</font>
>
>   对于第3行，CPU执行线程A，实例化一个EagerSingleton，没有实例化完，CPU就从线程A切换到线程B了，线程B此时也实例化这个EagerSingleton，然后EagerSingleton被实例化出来了两次，有两份内存地址，不就有线程安全问题了吗？
>
>   **实际上: JVM采用了CAS配上失败重试的方式保证更新操作的原子性和TLAB两种方式来解决这个问题**

<br/>

**懒汉式**

只有当单例类用到的时候才会去创建这个单例类

```java
public class LazySingleton {
    
    private static LazySingleton instance = null;
    
    private LazySingleton() {}
    
    public static LazySingleton getInstance() {
        if (instance == null)
            instance = new LazySingleton();
        return instance;
    }
}
```

这种写法基本不用，因为这是一种线程非安全的写法:

线程A初次调用getInstance()方法，代码走到第12行，线程此时切换到线程B，线程B走到12行，看到instance是null，就new了一个LazySingleton出来，这时切换回线程A，线程A继续走，也new了一个LazySingleton出来。这样，单例类LazySingleton在内存中就有两份引用了，这就违背了单例模式的本意了!

既然懒汉式是非线程安全的，那就要改进它。最直接的想法是，给getInstance方法加锁不就好了，但是我们不需要给方法全部加锁啊，只需要给方法的一部分加锁就好了

**双检的目的是为了提高效率**，当第一次线程创建了实例对象后，后边进入的线程通过判断第一个是否为null，可以直接不用走入加锁的代码区；

基于这个考虑，引入了双检锁(Double Check Lock, DCL)的写法:

```java
public class DoubleCheckLockSingleton {
    
    private static DoubleCheckLockSingleton instance = null;
    
    private DoubleCheckLockSingleton() {}
    
    public static DoubleCheckLockSingleton getInstance() {
        if (instance == null) {
            synchronized (DoubleCheckLockSingleton.class) {
                if (instance == null)
                    instance  = new DoubleCheckLockSingleton();
            }
        }
        return instance;
    }
}
```

线程A初次调用DoubleCheckLockSingleton.getInstance()方法，判断instance为null，进入同步代码块，此时线程切换到线程B，线程B调用DoubleCheckLockSingleton.getInstance()方法，由于同步代码块外面的代码还是异步执行的，所以线程B判断instance为null，等待锁

结果就是线程A实例化出了一个DoubleCheckLockSingleton，释放锁，线程B获得锁进入同步代码块，判断此时instance不为null了，并不实例化DoubleCheckLockSingleton。这样，单例类就保证了在内存中只存在一份。

><br/>
>
>**补充: 单例模式在Java中的应用**
>
>**Runtime是一个典型的例子: 每个Java应用程序都有一个Runtime类实例，使应用程序能够与其运行的环境相连接，可以通过getRuntime方法获取当前运行时, 应用程序不能创建自己的Runtime类实例**
>
>Runtime类的源码:
>
>```java
>public class Runtime {
>    
>    private static final Runtime currentRuntime = new Runtime(); // 使用饿汉式
>
>    private static Version version;
>
>    public static Runtime getRuntime() {
>        return currentRuntime;
>    }
>
>    private Runtime() {}
>    ....
>}
>```
>
>可以看到Runtime使用getRuntime()方法并让构造方法私有保证程序中只有一个Runtime实例且Runtime实例不可以被用户创建
>
>**补充二: 单例模式的好处**
>
>-   控制资源的使用，通过线程同步来控制资源的并发访问
>-   控制实例的产生，以达到节约资源的目的
>-   控制数据的共享，在不建立直接关联的条件下，让多个不相关的进程或线程之间实现通信

<br/>

<font color="#ff0000">**工厂模式**</font>

工厂模式分为工厂方法模式和抽象工厂模式

工厂方法模式分为三种：

-   普通工厂模式，就是建立一个工厂类，对实现了**同一接口的一些类进行实例的创建**
-   多个工厂方法模式，是对普通工厂方法模式的改进，在普通工厂方法模式中，如果传递的字符串出错，则不能正确创建对象，而多个工厂方法模式是**提供多个工厂方法，分别创建对象**
-   静态工厂方法模式，将上面的**多个工厂方法模式里的方法置为静态的，不需要创建实例，直接调用即可**

**普通工厂模式** 

```java
public interface Sender {
    public void Send(); 
} 

public class MailSender implements Sender {
    @Override
    public void Send() { 
        System.out.println("this is mail sender!");
    }
}

public class SmsSender implements Sender {
    @Override
    public void Send() { 
        System.out.println("this is sms sender!");
    }
}

public class SendFactory { 
    
   public Sender produce(String type) {
       if ("mail".equals(type)) {
           return new MailSender();
       } else if ("sms".equals(type)) {
           return new SmsSender();    
       } else {         
           return null; 
       }
   }
 }
```

**多个工厂方法模式**

该模式是对普通工厂方法模式的改进，在普通工厂方法模式中，如果传递的字符串出错，则不能正确创建对象，而多个工厂方法模式是提供多个工厂方法，分别创建对象

```java
public class SendFactory { 
    
    public Sender produceMail() {
        return new MailSender();
    }
    
    public Sender produceSms() {
        return new SmsSender(); 
    }
}

public class FactoryTest { 
    public static void main(String[] args) { 
        SendFactory factory = new SendFactory();
        Sender sender = factory.produceMail(); 
    }
 }

```

**静态工厂方法模式**

将上面的多个工厂方法模式里的方法置为静态的，不需要创建实例，直接调用即可

```java
public class SendFactory {
    public static Sender produceMail() {
        return new MailSender();
    }
  
    public static Sender produceSms() { 
        return new SmsSender();
    }
}

public class FactoryTest { 
    public static void main(String[] args) { 
        Sender sender = SendFactory.produceMail(); 
        sender.send(); 
    }
 }
```

**抽象工厂模式**

工厂方法模式有一个问题就是，类的创建依赖工厂类，也就是说，如果想要拓展程序，必须对工厂类进行修改，这违背了闭包原则，所以，从设计角度考虑，有一定的问题，如何解决？

就用到抽象工厂模式，创建多个工厂类，这样一旦需要增加新的功能，直接增加新的工厂类就可以了，不需要修改之前的代码

<br/>

<font color="#ff0000">**建造者模式**</font>

工厂类模式提供的是创建单个类的模式，而建造者模式则是将各种产品集中起来进行管理，用来**创建复合对象**，所谓复合对象就是指**某个类具有不同的属性，其实建造者模式就是前面抽象工厂模式和最后的Test结合起来得到的**

<br/>

适配器模式将**某个类的接口转换成客户端期望的另一个接口表示**，目的是**消除由于接口不匹配所造成的类的兼容性问题**

主要分为三类：类的适配器模式、对象的适配器模式、接口的适配器模式

**类的适配器模式**

```java
// 已存在的、具有特殊功能、但不符合我们既有的标准接口的类
class Adaptee {
    public void specificRequest() {
        System.out.println("被适配类 具有特殊功能...");
    }
}

// 目标接口，或称为标准接口
interface Target {
    public void request();
}

// 具体目标类，只提供普通功能
class ConcreteTarget implements Target {
    public void request() {
        System.out.println("普通类 具有普通功能...");
    }
}

// 适配器类，继承了被适配类，同时实现标准接口
class Adapter extends Adaptee implements Target { 
    public void request() {
        super.specificRequest();
    }
}

// 测试类
public class Client {
    public static void main(String[] args) {
        // 使用普通功能类
        Target concreteTarget = new ConcreteTarget(); //实例化一个普通类
        concreteTarget.request();

        // 使用特殊功能类，即适配类
        Target adapter = new Adapter();
        adapter.request();
    }
}
-------- Output -------
普通类 具有普通功能…
被适配类 具有特殊功能…
```

**对象的适配器模式**

基本思路和类的适配器模式相同，只是将 Adapter 类作修改，这次不继承Adaptee类，而是持有Adaptee类的实例，以达到解决兼容性的问题

```java
// 适配器类，直接关联被适配类，同时实现标准接口
class Adapter implements Target {
    // 直接关联被适配类
    private Adaptee adaptee;

    // 可以通过构造函数传入具体需要适配的被适配类对象
    public Adapter (Adaptee adaptee) {
        this.adaptee = adaptee;
    }

    public void request() {
        // 这里是使用委托的方式完成特殊功能
        this.adaptee.specificRequest();
    }
}

// 测试类
public class Client {
    public static void main(String[] args) {
        // 使用普通功能类
        Target concreteTarget = new ConcreteTarget();
        concreteTarget.request();

        // 使用特殊功能类，即适配类，
        // 需要先创建一个被适配类的对象作为参数
        Target adapter = new Adapter(new Adaptee());
        adapter.request();
    }
}
-------- Output -------
普通类 具有普通功能…
被适配类 具有特殊功能…
```

**接口的适配器模式**

有时我们写的一个接口中有多个抽象方法，当我们写该接口的实现类时，必须实现该接口的所有方法，这明显有时比较浪费，因为并不是所有的方法都是我们需要的，有时只需要某一些

为了解决这个问题，我们引入了接口的适配器模式，借助于一个抽象类，该抽象类实现了该接口，实现了所有的方法，而我们不和原始的接口打交道，只和该抽象类取得联系，所以我们写一个类，继承该抽象类，重写我们需要的方法就行

><br/>
>
>**小提示: Java的图形化界面Swing等就大量使用这种设计模式, 如: MouseInputAdapter等**

<br/>

<font color="#ff0000">**观察者模式**</font>

 观察者模式很好理解，类似于邮件订阅和 RSS 订阅，当我们浏览一些博客或wiki时，经常会看到RSS 图标，就这的意思是，当你订阅了该文章，如果后续有更新，会及时通知你。

简单来讲就一句话：当一个对象变化时，其它依赖该对象的对象都会收到通知，并且随着变化(对象之间是一种一对多的关系)

```java
import java.util.ArrayList;
import java.util.List;

public class ObserverPattern {

    public static void main(String[] args) {
        Subject subject = new ConcreteSubject();
        Observer obs1 = new ConcreteObserver1();
        Observer obs2 = new ConcreteObserver2();
        subject.add(obs1);
        subject.add(obs2);
        subject.notifyObserver();
    }

}

//抽象目标
abstract class Subject {

    protected List<Observer> observers = new ArrayList<>();

    //增加观察者方法
    public void add(Observer observer) {
        observers.add(observer);
    }

    //删除观察者方法
    public void remove(Observer observer) {
        observers.remove(observer);
    }

    public abstract void notifyObserver(); //通知观察者方法

}

//具体目标
class ConcreteSubject extends Subject {
    public void notifyObserver() {
        System.out.println("具体目标发生改变...");
        System.out.println("--------------");
        for (Object obs : observers) {
            ((Observer) obs).response();
        }
    }
}

//抽象观察者
interface Observer {
    void response(); //反应
}

//具体观察者1
class ConcreteObserver1 implements Observer {
    public void response() {
        System.out.println("具体观察者1作出反应！");
    }
}

//具体观察者1
class ConcreteObserver2 implements Observer {
    public void response() {
        System.out.println("具体观察者2作出反应！");
    }
}
------- Output -------
具体目标发生改变...
--------------
具体观察者1作出反应！
具体观察者2作出反应！
```

此外还有责任链模式, 在Spring MVC中的filter中也有使用等待;



<br/>

### 4. 熟悉Reactive开发模式吗？

即响应式编程, 其特点是异步或并发、事件驱动、推送PUSH机制以及观察者模式的衍生

reactive应用(响应式应用)允许开发人员构建事件驱动(event-driven)，可扩展性，弹性的反应系统：提供高度敏感的实时的用户体验感觉，可伸缩性和弹性的应用程序栈的支持，随时可以部署在多核和云计算架构

有兴趣学习, 但是还没有实战过…

<br/>

### 5. 你熟悉的分布式技术有哪些？了解他们底层的实现机制吗？

我熟悉的分布式技术主要是一些分布式架构和中间件:

分布式架构:

-   面向服务的架构(SOA)
-   REST风格的架构 – Spring Boot前后端分离, Spring Cloud微服务等;
-   RPC风格的架构 – Dubbo
-   Serverless架构, 如腾讯云, 阿里云等使用的FaaS服务等

分布式中间件:

-   分布式消息服务: RabbitMQ, 阿里的RocketMQ, Apache Kafka, 和最近比较火的Pulsar(暂时没用过)
-   分布式计算: MapReduce, Apache Hadoop, Apache Spark, 阿里的Alink和Blink等;
-   分布式存储: Apache HBase, Apache Cassandra, Redis, MongoDB;
-   分布式监控: Zookeeper;
-   容器技术: Docker, Docker Compose, K8S, 和比较新的Istio等;
-   分布式支持框架: Spring Cloud全家桶: 服务发现Eureka, 客户端侧负载均衡Ribbon, 声明式REST调用Feign, 微服务熔断Hystrix, 微服务网关Zuul, 微服务配置Spring Cloud Config, 微服务跟踪Sleuth等;

底层暂时还不是特别了解, 只能大致说说几个用过的:

RabbitMQ, Kafka, Zookeeper, Docker, Docker Compose, K8S, Spring Cloud全家桶等等.

<br/>

### 6. Spring Cloud 各个组件的运行机制是什么？

**Eureka**

负责各个服务的注册于发现，分为服务端和客户端

在每个客户端启动的时候，会自动的将自己的服务名称，ip地址，端口号等信息注册到注册中心。服务端是一个注册中心，里面有一个注册表，保存了各服务所在的机器和端口号，供所有的客户端查询。

**Ribbon**

本质是一个带有负载均衡功能的http客户端，在每次请求的时候会选择一台机器，均匀的把请求分发到各台机器上。Ribbon的负载均衡默认使用的最经典的Round Robin轮询算法。

Ribbon的工作流程：

首先Ribbon会从 Eureka Client里获取到对应的服务注册表，也就知道了所有的服务都部署在了哪些机器上，在监听哪些端口号；然后Ribbon就可以使用默认的Round Robin算法，从中选择一台机器。

**Feign**

Feign的一个关键机制就是使用了动态代理，Feign默认集成了Ribbon，Feign的工作原理：

如果你对某个接口定义了@FeignClient注解，Feign就会针对这个接口创建一个动态代理；
接着你要是调用那个接口，本质就是会调用 Feign创建的动态代理，这是核心中的核心；Feign的动态代理会根据你在接口上的@RequestMapping等注解，来动态构造出你要请求的服务的地址；最后聪明从Ribbon中拿到对应的IP地址个端口号，针对这个地址，发起请求、解析响应

**Hystrix**

分布式系统中某个服务挂掉后，如果系统处于高并发的场景下，大量请求涌过来的时候，上游的服务会因为没有一个线程可以处理请求，就会导致上游的服务也跟着挂掉，这就是微服务架构中恐怖的服务雪崩问题。

Hystrix是隔离、熔断以及降级的一个框架。Hystrix会搞很多个小小的线程池，比如订单服务请求库存服务是一个线程池，请求仓储服务是一个线程池，请求积分服务是一个线程池。每个线程池里的线程就仅仅用于请求那个服务。

下游的服务挂掉后，每次在上游的服务调用它的时候都会卡住几秒钟，这没有任何意义，可以直接都挂掉的服务熔断处理。比如在5分钟内请求该服务直接就返回了，不要去走网络请求卡住几秒钟，这个过程，就是所谓的熔断！

降级（比如积分服务挂了）：每次调用积分服务，你就在数据库里记录一条消息，说给某某用户增加了多少积分，因为积分服务挂了，导致没增加成功！这样等积分服务恢复了，你可以根据这些记录手工加一下积分。这个过程，就是所谓的降级

**Zuul**

这个组件是负责网络路由的，一般微服务架构中都必然会设计一个网关在里面，像android、ios、pc前端、微信小程序、H5等等，不用去关心后端的几百个服务，就知道有一个网关，所有请求都往网关走，网关会根据请求中的一些特征，将请求转发给后端的各个服务。而且有一个网关之后，还有很多好处，比如可以做统一的降级、限流、认证授权、安全，等等

<br/>

### 7. TreeMap与TreeSet实现原理是什么？

这个问题的详细内容可以参考我博客中的TreeMap和TreeSet的源码解析;

TreeMap 和 TreeSet 是 Java Collection Framework 的两个重要成员，其中 TreeMap 是 Map 接口的常用实现类，而 TreeSet 是 Set 接口的常用实现类

虽然 TreeMap 和TreeSet 实现的接口规范不同，但和HashMap和HashSet的关系类似, TreeSet 底层是通过 TreeMap 来实现的（如同HashSet底层是是通过HashMap来实现的一样），因此二者的实现方式完全一样。而 TreeMap 的实现就是红黑树算法, 所以**问题本质上还是问红黑树算法**

**相同点：**

TreeMap和TreeSet都是有序的集合，也就是说他们存储的值都是排好序的:

-   TreeMap和TreeSet都是非同步集合，因此他们不能在多线程之间共享，不过可以使用方法Collections.synchroinzedMap()来实现同步
-   运行速度都要比Hash集合慢，他们内部对元素的操作时间复杂度为O(logn)，而HashMap/HashSet则为O(1)

**不同点：**

最主要的区别就是TreeSet和TreeMap分别实现Set和Map接口

-   TreeSet只存储一个对象，而TreeMap存储两个对象Key和Value（仅仅key对象有序）
-   **TreeSet中不能有重复对象，而TreeMap中可以存在**
-   TreeMap的底层采用红黑树的实现，完成数据有序的插入，排序

<br/>

再来复习一下红黑树的特点(详细内容见博客中对红黑树的总结)：

-   性质 1：每个节点要么是红色，要么是黑色
-   性质 2：根节点永远是黑色的
-   性质 3：所有的叶节点都是空节点（即 null），并且是黑色的
-   性质 4：每个红色节点的两个子节点都是黑色(从每个叶子到根的路径上不会有两个连续的红色节点)
-   性质 5：从任一节点到其子树中每个叶子节点的路径都包含相同数量的黑色节点

**TreeSet要求存放的对象所属的类必须实现Comparable接口**，该接口提供了比较元素的compareTo()方法，当插入元素时会回调该方法比较元素的大小

**TreeMap要求存放的键值对映射的键必须实现Comparable接口从而根据键对元素进行排序**

<br/>

### 8. Array和ArrayList的区别？

Array可以包含基本类型和对象类型，ArrayList只能包含对象类型；

Array(数组)的大小是固定的，ArrayList(列表)的大小是动态变化的；

ArrayList提供了更多的方法和特性：addAll()、removeAll()、iterator等；

对于基本类型数据，集合使用自动装箱来减少编码工作量, 但是，当处理固定大小的基本数据类型的时候，这种方式相对比较慢

<br/>

### 9. JVM的数据区有哪些，作用是什么？

主要分为5个部分:

1.  程序计数器(PC)
2.  Java虚拟机栈
3.  本地方法栈
4.  Java堆
5.  方法区
6.  运行时常量池(属于“方法区”的一部分)

**各个区域作用和描述**

| 区域名称     | 共享     | 作用                                                         | 异常                                                         | 备注                                                         |
| ------------ | -------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 程序计数器   | 线程私有 | 记录当前线程锁执行的字节码行号指示器                         | Java虚拟机规范中唯一一个没有规定OutOfMemoryError(内存不足错误)的区域 | --                                                           |
| Java虚拟机栈 | 线程私有 | 存放局部变量表、操作数据栈、动态链接、方法出口等信息         | 栈深大于允许的最大深度，抛出StackOverflowError(栈溢出错误)<br />内存不足时，抛出OutOfMemoryError(内存不足错误) | 常说的“栈”说的就是Java虚拟机栈<br />或者是Java虚拟机栈中的局部变量表 |
| 本地方法栈   | 线程私有 | 和Java虚拟机栈类似，不过是为JVM用到的**Native方法服务**      | 同上                                                         | --                                                           |
| Java堆       | 线程共享 | 存放实例化数据                                               | 内存不足时，抛出OutOfMemoryError(内存不足错误)               | 通过-Xmx和-Xms控制大小<br />GC的主要管理对象                 |
| 方法区       | 线程共享 | 存放类信息（版本、字段、方法、接口等）、常量、静态变量、即时编译后的代码等数据 | 内存不足时，抛出OutOfMemoryError(内存不足错误)               | --                                                           |
| 运行时常量池 | 线程共享 | 存放编译期生成的各种字面量和符号引用                         | 内存不足时，抛出OutOfMemoryError(内存不足错误)               | 属于“方法区”的一部分                                         |
| 直接内存     | --       | 如NIO可以使用Native函数库直接分配堆外内存，该内存受计算机内存限制 | 内存不足时，抛出OutOfMemoryError(内存不足错误)               | 不是JVM运行时数据区的一部分，也不是JVM虚拟机规范中定义的内存区域<br />但这部分内存也被频繁的使用, 所以放到一起 |

><br/>
>
>**评价:**
>
>题目考的是Java的内存模型, 可以引申很多内容比如线程安全, 垃圾回收, String放在哪等等

<br/>

