---
title: 'Java并发编程总结-1: ThreadLocal'
toc: true
date: 2019-09-11 1:49:37
categories: 并发编程
tags: [并发编程, 多线程]
description: Java并发编程之美之ThreadLocal相关的总结
---

![Java并发编程之美](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1567750837551&di=fae22e8ce73ecbc87820964da733b106&imgtype=0&src=http%3A%2F%2Fimg3m1.ddimg.cn%2F31%2F20%2F1465705921-1_u_1.jpg)

<br/>有关Java中ThreadLocal相关内容的总结!

<!--more-->

## ThreadLocal

多个线程访问同一个共享变量时特别容易出现并发问题, 特别是在多个线程同时需要对一个共享变量进行写入时! 为了保证线程安全, 一般使用者在访问共享变量时*需要进行适当的同步.*

同步的一般措施为**加锁**. 但是加锁机制较为复杂, 有没有一种方法可以做到:<font color="#00ff00">当创建一个变量之后, `每一个线程进行访问时, 访问的是自己线程的变量`</font>. 此方法即为ThreadLocal变量!

`ThreadLocal`由JDK包提供, 提供了线程本地变量, 即: 

![](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1568175650751&di=e282d2c99a6ba561d1db0168a9561440&imgtype=0&src=http%3A%2F%2Fimg2018.cnblogs.com%2Fblog%2F1626398%2F201907%2F1626398-20190729000818865-921657004.png)

<font color="#00ff00">当你创建了一个`ThreadLocal`变量, 那么访问这个变量的每一个线程都会有这个变量的一个副本. 当多个线程操作这个变量的时候, 每一个线程操作的都是*自己本地内存中的变量*. 避免了线程安全问题!</font> 创建一个`ThreadLocal`后, 每一个线程都会复制一个变量到自己的本地内存.



-----------------------------------

###  1. ThreadLocal使用实例

```java
package club.jasonkayzk666.chapter1.lesson11.threadlocal;

public class ThreadLocalTest {

    public static ThreadLocal<String> localVariable = new ThreadLocal<>();

    public static void print(String str) {
        // 1. 打印当前线程本地内存中的localVariable变量的值
        System.out.println(str + ": " + localVariable.get());

        // 2. 清除当前线程本地内存中的localVariable变量
        localVariable.remove();
    }

    public static void main(String[] args) {
        Thread threadOne = new Thread(new Runnable() {
            @Override
            public void run() {
                localVariable.set("thread-one local variable");
                print("thread-one");

                System.out.println("thread-one remove after: " + localVariable.get());
            }
        });

        Thread threadTwo = new Thread(new Runnable() {
            @Override
            public void run() {
                localVariable.set("thread-two local variable");
                print("thread-two");

                System.out.println("thread-two remove after: " + localVariable.get());
            }
        });

        threadOne.start();
        threadTwo.start();
    }


}

```

代码中, 线程One通过`set`方法设置了`localVariable`的值, **这其实是线程One本地内存中的一个副本! 这个副本线程Two是无法访问的! ** 

所以输出为:

```
thread-two: thread-two local variable
thread-two remove after: null
thread-one: thread-one local variable
thread-one remove after: null
```



-----------------------------------------

### 2. ThreadLocal的实现原理

下图为ThreadLocal相关类的类图结构.

![ThreadLocal相关类的类图结构](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1568176537415&di=f52fc4fec8bcd6f9030eb7d060ba14ff&imgtype=0&src=http%3A%2F%2Fpic7.zhimg.com%2Fv2-04ffd190415b2df1654b43632414947e_b.jpg)

在图中可知:

-   `Thread类`中有一个`threadLocals`和一个`inheritableThreadLocals`, 都是`ThreadLocalMap`类型的变量, 而<font color="#00ff00">`ThreadLocalMap`是一个定制化的`HashMap`.</font>



-   <font color="#00ff00">默认情况下, 每个线程中的两个变量都为`null`, 只有当前线程第一次调用`ThreadLocal`的`set`或者`get`方法时才会创建他们. </font>



-   <font color="#ff0000">每个线程的本地变量实际上并不是存放在`ThreadLocal`实例中! 而是存放在`调用线程的threadLocals`里面, 并存放起来. 当调用线程调用它的`get`方法时, 再从当前线程的`threadLocals`变量中将其拿出来使用!</font>



-   <font color="#ff0000">如果调用线程一直不终止, 那么这个变量会一直存放在调用线程的`threadLocals变量`里面, 占用内存!</font>



-   <font color="#00ff00">所以当不再使用本地变量时, 可以通过`ThreadLocal变量的remove`方法, 从当前线程的`threadLocals`里面删除该本地变量!</font>



-   `ThreadLocal`中的`threadLocals`被设计为map的原因: <font color="#00ff00">每个线程可以关联多个`ThreadVariable`变量!</font>



#### 1): void set(T value)

```java
public void set(T value) {
    // 1. 获取当前线程
    Thread t = Thread.currentThread();
    // 2. 将当前线程作为key, 查找对应的线程变量
    ThreadLocalMap map = getMap(t);
    
    // 3.  如果找到该线程则设置
    if (map != null) {
        map.set(this, value);
    } else {
        // 4. 未找到则说明是第一次, 就创建对应Map
        createMap(t, value);
    }
}
```

下面再看看`createMap(t, value)`

```java
void createMap(Thread t, T firstValue) {
    t.threadLocals = new ThreadLocalMap(this, firstValue);
}
```

即创建了一个当前线程的`threadLocals`变量!



#### 2): T get()

```java
public T get() {
    // 1. 获取当前线程
    Thread t = Thread.currentThread();
    // 2. 获取当前线程的ThreadLocal变量
    ThreadLocalMap map = getMap(t);
    
    // 3. 如果找到, 则返回对应变量的值
    if (map != null) {
        ThreadLocalMap.Entry e = map.getEntry(this);
        if (e != null) {
            @SuppressWarnings("unchecked")
            T result = (T)e.value;
            return result;
        }
    }
    // 当ThreadLocal变量为null, 则初始化当前ThreadLocal变量
    return setInitiaVaule();
}
```

对于`setInitialValue()`的代码:

```java
private T setInitialValue() {
    // 1. 初始化为null 
    T value = initialValue();
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    
    // 2. 当前的线程ThreadLocal变量不为空, 设置
    if (map != null) {
        map.set(this, value);
    } else {
        // 3. 当前ThreadLocal变量为空
        createMap(t, value);
    }
    return value;
}

protected T initialValue() {
    return null;
}
```

当前`ThreadLocal`变量不为空则设置为`null`, 否则调用`createMap`方法创建线程变量.



#### 3): void remove()

```java
public void remove() {
    ThreadLocalMap m = getMap(Thread.currentThread());
    if (m != null) {
        m.remove(this);
    } 
}
```

<font color="#00ff00">如果当前线程的`ThreadLocal`变量不为空, 则删除.</font>



#### 4): 总结:

-   <font color="#00ff00">每个线程内部都有一个名为`threadLocals`的成员变量, 变量类型为`HashMap`, 其中`key`为定义的`ThreadLocal`的`this`引用, `value`为使用`set`设置的值! </font>



-   <font color="#ff0000">每个线程的本地变量存放在线程自己的内存变量`threadLocals`变量中, 若线程一直不消亡, 本地变量一直存在, 可能造成内存溢出. *所以使用完毕要调用`ThreadLocal的remove`方法删除本地变量!</font>



------------------------------

### 3. ThreadLocal不支持继承性

**例:**

```java
package club.jasonkayzk666.chapter1.lesson11.threadlocal;

public class ThreadLocalNotInherible {

    public static ThreadLocal<String> threadLocal = new ThreadLocal<>();

    public static void main(String[] args) {

        threadLocal.set("hello world");

        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("thread: " + threadLocal.get());
            }
        });

        thread.start();

        System.out.println("main: " + threadLocal.get());
    }

}

```

输出为:

```
main: hello world
thread: null
```



本例中创建了一个`ThreadLocal变量`并在父线程中设置了值`hello world`, *此值在子线程中无法获取!* 这是对的!

但是有时想要子线程访问父线程中的值, 此时可以使用`InheritableThreadLocal类`



----------------------------------

### 4. InheritableThreadLocal类

` InheritableThreadLocal`继承自`ThreadLocal`, 提供了一个特性即: <font color="#00ff00">让子线程可以访问父线程中设置的本地变</font>

#### 1): InheritableThreadLocal的源码:

```java
public class  InheritableThreadLocal<T> extends ThreadLocal<T> {
    
    protected T childValue(T parentValue) {
        return parentValue;
    }
    
    ThreadLocalMap getMap(Thread t) {
        return t. inheritableThreadLocals;
    }
    
    void createMap(Thread t, T firstValue) {
        t. inheritableThreadLocal = new ThreadLocalMap(this, firstValue);
    }
    
}
```

上述代码可以看出, ` InheritableThreadLocal`继承了`ThreadLocal`, 并重写了三个方法;

-   ` InheritableThreadLocal`重写了`createMap`方法:

    <font color="#00ff00">当首次调用`set方法`时, 创建当前线程的` inheritableThreadLocals`变量实例, 而不再是`threadLocals`.</font>

-   同时调用`get方法`时, 获取的也是` inheritableThreadLocals`而不是`threadLocals`.



下面看下*如何让子线程可以访问到父线程的本地变量*, 从`创建Thread`的代码:

```java
public Thread(Runnable target) {
    init(null ,target, "Thread-" + nextThreadNum(), 0);
}

private void init(ThreadGroup g, Runnable target, String name, long stackSize, AccessControlContext acc) {
    .....
    // 获取当前线程
    Thread parent = currentThread();
    ...
    // 如果父进程 InheritableThreadLocal变量不为空, 
    if (parent. inheritableThreadLocals != null) {
        this. inheritableThreadLocals = ThreadLocal.createInheritedMap(parent.inheritableThreadLocals);
        this.stackSize = stackSize;
        tid = nextThreadID();
    }
}

static ThreadLocalMap createInheritedMap(ThreadLocalMap parentMap) {
    return new ThreadLocalMap(parentMap);
}
```

Thread创建的构造函数的源码如上: <font color="#00ff00">在创建线程时, 构造函数会调用`init方法`. 可以看到, 在`createInheritedMap`内部使用*父进程的` inheritableThreadLocals变量`*, 然后赋予了子线程!</font>

而`ThreadLocalMap`的构造函数将父线程的` InheritableThreadLocal变量`复制到新的`LocalThreadMap`对象中!

#### 2): 总结: 

` InheritableThreadLocal类`通过重新方法, 将本地变量保存到了` inheritableThreadLocals`里面. 线程在通过` InheritableThreadLocal类`实例的`get或者set`方法设置变量时会创建当前线程的` inheritableThreadLocals`变量. <font color="#00ff00">当父线程创建子线程时, 构造函数会把父线程中的` inheritableThreadLocals变量`里面的本地变量*复制一份给子线程*.</font>

**例: **

```java
package club.jasonkayzk666.chapter1.lesson11.threadlocal;

public class InheritableThreadLocalDemo {

    private static InheritableThreadLocal<String> inheritableThreadLocal = new InheritableThreadLocal<>();

    public static void main(String[] args) {
        inheritableThreadLocal.set("hello world");

        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("thread: " + inheritableThreadLocal.get());
            }
        });

        thread.start();

        System.out.println("main: " + inheritableThreadLocal.get());
    }
}

```

输出为:

```
main: hello world
thread: hello world
```



#### 3):InheritableThreadLocal使用场景

-   子线程需要使用存放在`threadLocal`变量中的用户登录信息.
-   一些中间件把统一的id追踪的整个调用链路记录下来等

