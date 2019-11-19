---
title: Java并发编程-2
toc: true
date: 2019-09-11 11:04:53
cover: https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1567750837551&di=fae22e8ce73ecbc87820964da733b106&imgtype=0&src=http%3A%2F%2Fimg3m1.ddimg.cn%2F31%2F20%2F1465705921-1_u_1.jpg
categories: 并发编程
tags: [并发编程, 多线程]
description: Java并发编程之美之二
---



Java并发编程之美第二章总结: 并发编程的其他基础知识

<!--more-->

## 二. 并发编程的其他基础知识

### 1. 并发与并行

-   *并发:* <font color="#0000ff">同一个时间段内多个任务同时都在执行, 并且都没有结束;</font>
-   *并行:* <font color="#0000ff">单位时间内多个任务同时在执行</font>

#### 1): 区别

<font color="#ff0000">`并发`强调一个时间段内同时执行, 而单位时间段内不一定同时执行!</font>

<font color="#ff0000">`并行`时同一时刻有多个任务同时执行!</font>



一般线程的个数都多于CPU个数, 所以一般都称为**多线程并发编程**.



----------------------

### 3. Java中的线程安全问题

-   *共享资源*: 该资源被多个线程所持有/多个线程都可以去访问该资源!
-   *线程安全问题*: 当多个线程同时读写一个共享资源并且没有任何的同步措施时, 导致出现脏数据或者其他不可预见的结果的问题!

最常见的线程安全问题为: **计数器类(这里略)**



---------------------------

### 4. Java中共享变量的内存可见性问题

下图为多线程下处理共享变量时的Java内存模型:

![Java内存模型](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1568200735073&di=df31eab982e669d5d583b349893bbcc4&imgtype=0&src=http%3A%2F%2Fstatic.jointforce.com%2Fjfperiodical_prod%2Fattached%2Fimage%2F20171009%2F1924535125.jpg)

Java内存模型规定:

<font color="#ff0000">所有的变量都保存在主内存中(堆内存). 当线程使用变量时, *会把主内存里面的变量复制到自己的工作空间(工作内存), 线程读写的是自己工作内存中的变量!</font>

下图所示是一个双核CPU系统架构:

![双核CPU系统架构](https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=1148586582,4011720927&fm=26&gp=0.jpg)

其中每个核有自己的一级缓存, 有一些架构里面还有所有CPU共享的二级缓存. Java内存模型中的工作内存, 就对应于*L1/L2缓存或者CPU的寄存器*.

当一个线程操作共享变量时,<font color="#0000ff">首先从主内存复制共享变量到自己的工作内存, 然后对工作内存里的变量进行处理, 处理完成后将变量值更新到主内存!</font>

#### *内存不可见性导致的问题*

假设线程A与线程B同时处理一个共享变量. 并假设线程A与线程B使用不同的CPU执行, 且最开始两级Cache都为空! **这时由于Cache的存在, 将会导致内存不可见问题!**

-   线程A获得资源X的值, 由于两级缓存都没有命中, 所以加载主内存中X的值(假设X=0); 然后把`X=0`缓存到两级缓存.
-   线程A修改X的值为1, 然后写入两级Cache, 并刷新主存. 

操作完毕后, 线程A所在的CPU的两级Cache和主存中的X值均为1;



-   线程B获取X的值, 首先一级缓存未命中, 二级缓存命中所以返回1;

到这里一切都是正常的!



-   然后线程B修改X的值为2, 并将其存放到线程B所在的一级和共享二级缓存中, 最后更新主存中X的值为2;

到这里也是正常的!



-   线程A这次又要修改X的值. 获取时<font color="#ff0000">一级缓存命中, 并且`X=1`. </font>

<font color="#0000ff">到这里问题出现了! 线程B将共享变量修改为了2, 但是线程A读入的值还为1! 这就是共享变量的内存不可见问题: *线程B写入的值对线程A不可见!*</font>(可以使用Java的`volatile`关键字解决)



-----------------------

### 5. Java中的synchronized关键字

#### 1). synchronized关键字

`synchronize块`是Java提供的一种**原子性内置锁**, <font color="#ff0000">Java中的每一个对象都可以被当做一个同步锁使用!</font>这些Java内置的使用者看不到的锁被称为: *内部锁*, 或者*监视器锁*.

<font color="#0000ff">线程执行的代码在进入synchronized代码块之前, 会自动获取到内部锁, 这时, 其他线程访问该同步代码块的时候会被阻塞挂起. 拿到了内部锁的线程会在`正常退出/抛出异常/同步块内调用wait`时释放内置锁. </font>

<font color="#0000ff">内置锁是`排它锁`: 当一个线程获取这个锁后, 其他线程*必须*等待该线程释放锁后才能获取该锁!</font>

<font color="#ff0000">此外, Java中的线程与操作系统的原生线程一一对应! 所以当阻塞一个线程时, *需要从用户态切换到内核态执行阻塞操作*, 这个是很耗时的操作, 而且synchronized的使用还会导致上下文切换!</font>



#### 2): synchronized内存语义

进入synchronized块的内存语义就是: 

-   <font color="#ff0000">把在synchronized块内使用到的变量从线程的工作内存中清除, 这样在synchronized块中使用的变量不会从线程的工作内存中获取, 而是*直接从主内存中获取*.</font>



退出synchronized块的语义就是:

-   <font color="#ff0000">把在synchronized块内对共享变量的修改刷新到主内存中</font>



除了解决共享变量内存可见性问题, synchronized经常被用来实现原子操作.



------------------------

### 6. Java的volatile关键字

除了使用较为笨重的锁的形式解决共享变量的内存可见性问题, Java还提供了一种*弱形式的同步*.

<font color="#0000ff">该关键字可以确保, 对一个变量的更新对其他线程马上可见! </font>

<font color="#ff0000">当一个变量被声明为`volatile`时, 线程在写入变量时, *不会*把值缓存在寄存器或者其他地方, 而是会把值刷新回主内存. 当其他线程读取该变量的值时, 会从主内存重新获取值, 而不是使用当前线程的工作内存中的值.</font>



#### 1): volatile与synchronized

当线程写入了volatile变量值时, 就等价于线程退出synchronized同步块(把写入工作内存中的变量值刷新到主内存);

读取volatile变量时, 就相当于进入同步块(先清空本地内存变量值, 在从主内存获取最新值).

**例: **

```java
// 线程不安全
public class ThreadNotSafeInteger {
    private int value;
    
    public int get() {
        return value;
    }
    
    public void set(int value) {
        this.value = value;
    }
}

```

使用synchronized进行同步的方法

```java
public class ThreadSafeInteger {
    private int value;
    
    public synchronized int get() {
        return value;
    }
 	
    public synchronized void set(int value) {
        this.value = value;
    }
    
}
```

使用volatile

```java
public class ThreadNotSafeInteger {
    private volatile int value;
    
    public int get() {
        return value;
    }
    
    public void set(int value) {
        this.value = value;
    }
}

```

上面使用`synchronized`和`volatile`都解决了value的内存可见性问题, 但是前者是独占锁, 同时只能有一个线程调用get方法, 同时存在线程上下文切换和线程重新调度的开销. 而volatile是非阻塞算法!

但`synchronized`和`volatile`并非等价!

`volatile`虽然提供了内存可见性, 但是<font color="#ff0000">不能保证操作原子性!</font>



#### 2): volatile使用场景

-   <font color="#0000ff">写入变量值不依赖变量的当前值时.</font>

    因为如果依赖当前值, 将是 获取--计算--写入三步操作, 这三步不是原子性的, 而volatile不保证原子性!

-   <font color="#0000ff">读写变量值时没有加锁.</font>

    因为加锁本身已经保证了内存可见性, 这时已经不需要声明为volatile.



-------------------------------

### 7. Java中的原子性操作

#### 1): 原子性操作

所谓原子性操作: <font color="#0000ff">在执行一系列操作时, 这些操作要么全部执行, 要么全部不执行, 不存在只执行其中一部分的情况!</font>

**如下: **

```java
public class ThreadNotSafeCounter {
    private Long value;
    
    public Long getCount() {
        return value;
    }
    
    public void inc() {
        ++value;
    }
}
```

这个计数器将会<font color="#00ff00">先读取当前值, 然后+1, 在更新. 这个过程是读--写--改的过程.</font>如果无法保证这个过程是原子性的, 会出现线程安全问题!



#### 2): 保证线程安全之使用synchronized

修改代码如下:

```java
public class ThreadNotSafeCounter {
    private Long value;
    
    public synchronized Long getCount() {
        return value;
    }
    
    public synchronized void inc() {
        ++value;
    }
}
```

**问: 对于getCount()而言, 只是只读操作可否删去synchronized关键字?**

不可以! <font color="#ff0000">这里还要靠synchronized实现value的内存可见性!</font>



-------------------------

### 8. Java中的CAS操作

<font color="#0000ff">`CAS(Compare and Swap)`是JDK提供的非阻塞原子性操作, 通过硬件保证了*比较--更新*的原子性!</font>

在JDK中的`Unsafe类`提供了一系列的`compareAndSwap*方法`, 以`compareAndSwapLong方法`为例:

-   boolean compareAndSwapLong(Object obj, long valueOffset, long expect, long update)方法:

    其中compareAndSwap的意思是: *比较并交换.*

    CAS有四个操作数: <font color="#0000ff">对象的内存位置, 对象中的变量的偏移量, 变量预期值, 新的值.</font>

    操作含义: <font color="#0000ff">若对象obj中内存偏移量为`valueOffset`的变量值为`expect`, 则使用新的值`update`替换旧的值`expect`.</font>

    <font color="#ff0000">这是处理器提供的原子性命令!</font>



#### 1): 基本的ABA问题

在CAS算法中，需要取出内存中某时刻的数据（由用户完成），在下一时刻比较并替换（由CPU完成，该操作是原子的）。这个时间差中，会导致数据的变化。

假设如下事件序列：

1.  线程 1 从内存位置V中取出A。
2.  线程 2 从位置V中取出A。
3.  线程 2 进行了一些操作，将B写入位置V。
4.  线程 2 将A再次写入位置V。
5.  线程 1 进行CAS操作，发现位置V中仍然是A，操作成功。

尽管线程 1 的CAS操作成功，但不代表这个过程没有问题——*对于线程 1 ，线程 2 的修改已经丢失*!



#### 2): 与内存模型相关的ABA问题
在没有垃圾回收机制的内存模型中（如C++），程序员可随意释放内存。

假设如下事件序列：

1.  线程 1 从内存位置V中取出A，A指向内存位置W。
2.  线程 2 从位置V中取出A。
3.  线程 2 进行了一些操作，释放了A指向的内存。
4.  线程 2 重新申请内存，并恰好申请了内存位置W，将位置W存入C的内容。
5.  线程 2 将内存位置W写入位置V。
6.  线程 1 进行CAS操作，发现位置V中仍然是A指向的即内存位置W，操作成功

这里比问题 1.1 的后果更严重，实际内容已经被修改了，但*线程 1 无法感知到线程 2 的修改*。

更甚，如果线程 2 只释放了A指向的内存，而线程 1 在 CAS之前还要访问A中的内容，那么线程 1 将访问到一个`野指针`。



#### 3): 基本的ABA问题举例
如果位置V存储的是链表的头结点，那么发生ABA问题的链表中，原头结点是node1，线程 2 操作头结点变化了两次，很可能是先修改头结点为node2，再将node1（在C++中，也可是重新分配的节点node3，但恰好其指针等于已经释放掉的node1）插入表头成为新的头结点。

对于线程 1 ，头结点仍旧为 node1（或者说头结点的值，因为在C++中，虽然地址相同，但其内容可能变为了node3），CAS操作成功，但头结点之后的子链表的状态已不可预知!



#### 4): ABA问题的解决

<font color="#0000ff">ABA问题的产生是因为变量的状态值产生了环形转换, 即变量的值可以A--B--A. 若变量的值只能朝着一个方向转换就不会存在问题!</font>

<font color="#ff0000">Java的垃圾回收机制已经帮我们解决了问题 1.2；至于问题 1.1，加入版本号即可解决!</font>

JDK中的`AtomicStampedReference类`给每一个变量的状态值都配备了一个时间戳从而避免了ABA问题!



### 9. Unsafe类(Java中的指针)

JDK中的`rt.jar`包中的`Unsafe类`提供了硬件级别的原子性操作, <font color="#ff0000">Unsafe类中的方法都是*native*方法, 使用JNI的方式访问本地C++实现库!</font>

#### 1): Unsafe中提供的接个主要的方法

-   `long objectFieldOffset(Field field)`方法: 

    返回指定的变量在所属类中的内存偏移地址, 该偏移地址仅仅在该Unsafe函数中访问指定字段时使用

    例:

    ```java
    static {
        try {
            valueOffset = unsafe.objectFieldOffset(AtomicLong.class.getDeclaredField("value"));
        } catch(....) {
            .....
        }
    }
    ```

    获取了变量`value`在`AtomicLong`对象中的内存偏移量!

    <br/>

-   `int arrayBaseOffset(Class arrayClass)`方法:

    获取数组中第一个元素的地址

    <br/>

-   `int arrayIndexScale(Class arrayClass)`方法:

    获取数组中第一个元素占用的字节数

    <br/>

-   `boolean compareAndSwapLong(Object obj, long valueOffset, long expect, long update)`方法

    比较对象obj中*偏移量为offset*的变量的值是否与expect相等, 若相等则使用update更新, 然后返回`true`, 否则返回`false`.

    <br/>

-   `public native long getLongvolatile(Object obj, long offset)`方法

    获取对象obj中偏移量为Offset的变量对应volatile语义的值

    <br/>

-   `void putLongvolatile(Object obj, long offset, long value)`方法

    设置obj对象中offset偏移的类型为long的field的值为value, 支持volatile语义

    <br/>

-   `void putOrderedLong(Object obj, long offset, long value)`方法

    设置obj对象中offset偏移地址对应的long型的field的值为value. <font color="#0000ff">这是一个有延迟的`putLongvolatile`方法, 并且不保证值修改对其他线程立即可见! 只有当变量使用volatile修饰, 并且预计会被意外修改时才使用此方法!</font>

    <br/>

-   `void park(boolean isAbsolute, long time)`方法

    <font color="#0000ff">阻塞当前线程.</font>

    其中:

    -   参数`isAbsolute == false && time=0`表示一直阻塞;

    -   `time > 0`表示等待指定的time后阻塞线程被唤醒, 这个time是一个相对值: 相对当前时间累加time后被唤醒;
    -   `isAbsolute == true && time > 0`表示阻塞线程到指定的时间点后被唤醒, 这里time是绝对时间!

    <font color="#0000ff">此外, 当其他线程调用了当前线程的`interrupt()方法`而中断了当前线程时, 当前线程会返回;</font>

    <font color="#0000ff">当其他线程调用了unPark()方法且把当前线程作为参数时, 也会返回.</font>

    <br/>

-   `void unpark(Object thread)`方法

    唤醒调用park方法后阻塞的线程

    <br/>

<font color="#0000ff">*JDK8后新增方法*</font>

-   `long getAndSetLong(Object obj, long offset, long update)`方法

    获取对象obj中偏移量为offset的变量volatile语义的当前值, 并设置变量volatile语义的值为update;

    <br/>

-   `long getAndAddLong(Object obj, long offset, long addValue)`方法

    获取对象obj中偏移量为offset的变量volatile语义的当前值, 并设置变量值为原始值+addValue.



#### 2): 如何使用Unsafe类

```java
package club.jasonkayzk666.chapter2.lesson9.unsafe;

import sun.misc.Unsafe;

public class UnsafeTest {

    // 获取Unsafe实例
    public static final Unsafe unsafe = Unsafe.getUnsafe();

    // 记录变量state在类UnsafeTest中的偏移值
    public static final long stateOffset;

    // 变量
    private volatile long state = 0;

    static {
        try {
            // 使用Unsafe获取偏移值!
            stateOffset = unsafe.objectFieldOffset(UnsafeTest.class.getDeclaredField("state"));
        } catch (NoSuchFieldException e) {
            System.out.println(e.getLocalizedMessage());
            throw new Error(e);
        }
    }

    public static void main(String[] args) {
        // 创建实例, 并设置值为1
        UnsafeTest test = new UnsafeTest();
        System.out.println(unsafe.compareAndSwapLong(test, stateOffset, 0, 1));

    }

}

```

代码如上所示: 首先获取了一个Unsafe实例, 然后创建了一个state变量并初始化为0. 使用`unsafe.objectFieldOffset`获取UnsafeTest类中的state变量, 并将地址保存!

调用unsafe的`compareAndSwapInt`方法, 设置test对象的state变量的值. 即: <font color="#0000ff"> 若test对象中内存偏移量为stateOffset的state变量的值为0, 则更新为1</font>

运行后的结果:

```java
Exception in thread "main" java.lang.ExceptionInInitializerError
Caused by: java.lang.SecurityException: Unsafe
	at sun.misc.Unsafe.getUnsafe(Unsafe.java:90)
	at club.jasonkayzk666.chapter2.lesson9.unsafe.UnsafeTest.<clinit>(UnsafeTest.java:8)

```

为找出原因, 查看getUnsafe源码:

```java
    @CallerSensitive
    public static Unsafe getUnsafe() {
        // 获取调用本方法的对象的Class对象
        Class var0 = Reflection.getCallerClass();
        
        if (!VM.isSystemDomainLoader(var0.getClassLoader())) {
            throw new SecurityException("Unsafe");
        } else {
            return theUnsafe;
        }
    }

	// 判断paramClassLoader是不是BootStrap类加载器
    public static boolean isSystemDomainLoader(ClassLoader var0) {
        return var0 == null;
    }
```

<font color="#0000ff">代码首先获取调用本方法的对象的Class对象, 然后判断paramClassLoader是不是BootStrap类加载器. </font>

<font color="#ff0000">显然, 本例中是在main方法中new出来的实例, 所以UnsafeTest.class是使用`APPClassLoader`加载的, 所以抛出了异常!</font>

**判断ClassLoader的原因:**

<font color="#ff0000">因为Unsafe类是`rt.jar`包提供的, 而此包中的类是使用`BootStrapClassLoader`加载的, 而我们在main函数所在的类是使用`APPClassLoader`加载的, 所以在main函数加载Unsafe类时, 根据*双亲委派原则,* 会委托BootStrap去加载Unsafe类, 从而调用上述代码而导致异常!!</font>

<font color="#0000ff">由于Unsafe类可以直接操作内存, 不安全, 所以使用了ClassLoader判断</font>

**真想实例化Unsafe类的方法:**

<font color="#ff0000">通过反射打破双亲委派原则即可!</font>

**例:**

```java
package club.jasonkayzk666.chapter2.lesson9.unsafe;

import sun.misc.Unsafe;

import java.lang.reflect.Field;

public class UnsafeReflection {

    public static Unsafe unsafe;

    public static long stateOffset;

    private volatile long state = 0;

    static {
        try {

            // 使用反射获取Unsafe的成员变量theUnsafe!
            Field field = Unsafe.class.getDeclaredField("theUnsafe");

            // 设置为可存取
            field.setAccessible(true);

            // 获取unsafe变量
            unsafe = (Unsafe) field.get(null);

            // 获取偏移量
            stateOffset = unsafe.objectFieldOffset(UnsafeReflection.class.getDeclaredField("state"));

        } catch (NoSuchFieldException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        UnsafeReflection test = new UnsafeReflection();

        System.out.println(unsafe.compareAndSwapInt(test, stateOffset, 0, 1));
    }

}


```

代码通过反射创建了Unsafe对象, 最后输出:

```
true
```





------------------------



### 10. Java指令重排列

Java的内存模型允许编译器和处理器对指令进行冲排列以提高性能, 并且<font color="#ff0000">只会对不存在数据依赖性的指令进行冲排列.</font>

在单线程的情况下可以保证最终执行的结果与顺序执行的结果相同! 但是多线程情况可能就不同!

如:

```
int a = 1; (1)
int b = 2; (2)
int c = a + b; (3)
```

上面的代码, c的值依赖于a和b, 所以重排列之后, (3)仍然在(1), (2)之后, 但是(1), (2)谁先执行就不一定了! 这在单线程下不会有问题!

对于多线程:

```java
package club.jasonkayzk666.chapter2.lesson10.commandresort;

public class CommandResort {

    private static int num = 0;

    private static boolean ready = false;

    public static class ReadThread extends Thread {

        @Override
        public void run() {
            while (!Thread.currentThread().isInterrupted()) {
                if (ready) {
                    System.out.println(num + num);
                }
            }
            System.out.println("read thread....");
        }
    }

    public static class WriteThread extends Thread {
        @Override
        public void run() {
            num = 2; // (3)
            ready = true; // (4)
            System.out.println("writeThread set over...");
        }
    }

    public static void main(String[] args) throws InterruptedException {
        ReadThread rt = new ReadThread();
        rt.start();

        WriteThread wt = new WriteThread();
        wt.start();

        Thread.sleep(10);
        rt.interrupt();

        System.out.println("main exit");
    }
}

```

对于上述代码, 由于变量没有被声明为volatile, 也没有采用任何同步措施, 所以存在内存可见性问题. 这里先不考虑这个问题, 因为<font color="#0000ff">使用volatile本身即可避免指令重拍!</font>

当写线程的代码(3)(4)被重拍, 则执行(4)后, 有可能读线程已经执行了(1), 并且在(3)执行之前就开始执行(2)操作. <font color="#ff0000">此时输出的是0而不是4!</font>

**解决指令重排的方法:**

<font color="#0000ff">指令重排在多线程下会导致非预期的程序执行结果, 而使用volatile修饰ready即可避免重排列和内存可见性问题!</font>

<font color="#ff0000">编译器会保证, 写volatile时, 写之前的操作不会被重排列到写之后; volatile读之后的操作不会重排序到读之前!</font>



----------------------



### 11. 伪共享

#### 1): 什么是伪共享

未解决计算机中*主内存与CPU之间运行速度差问题*, 会在CPU与主内存之间添加一级或者多级高速缓冲. 如图为两级缓存:

![两级缓存](https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/u=2559964246,1177664816&fm=26&gp=0.jpg)

在Cache内部是按照行进行存储的, 每一个行称为`Cache行`. <font color="#0000ff">Cache行是Cache与主内存进行数据交换的单位! Cache行的大小一般为2的幂次!</font>

![CPU的Cache行](https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=691099822,286084129&fm=26&gp=0.jpg)



当CPU访问某个变量时: 首先查看CPU Cache中是否存在该变量, 如果有则直接获取, 否则就会去主内存中获取该变量, 然后把该<font color="#ff0000">变量所在的内存区域的一个Cache行大小的内存复制到Cache中!</font>

由于存放在Cache行中的是内存块, 而不是单个变量! 所以会将多个变量放在Cache中.<font color="#ff0000">当多个线程同时修改一个缓存行中的多个变量时, 由于同时只能有一个线程操作缓存行, 所以相比每个变量放到一个缓存行, 性能会有所下降, 这既是`伪共享`!</font>



#### 2): 出现伪共享的原因

<font color="#ff0000">因为多个变量被放到了一个缓存行, 并且多个线程同时去写入缓存行中不同的变量. </font>

而缓存与内存交换数据的单位就是缓存行, 当CPU要访问的变量未在缓存中找到时, 根据程序运行的**局部性原理**, 会把该变量所在内存中大小为缓存行的内存全部放入缓存行!

```java
long a, b, c, d;
```

如: 上述代码声明了四个long变量, 若缓存行的大小为32 byte, 那么当CPU访问a时, 会把变量a 以及附近的b, c, d都放入缓存行.

<font color="#ff0000">即地址连续的多个变量才有可能还会被放在同一个缓存行! 当创建数组是, 数组中多个元素会被放在同一个缓存行, 这对于单线程是有利的!</font>

```java
package club.jasonkayzk666.chapter2.lesson11.fakeshare;

public class FakeShareDemo {

    private static int LINE_NUM = 1024;

    private static int COLUM_NUM = 1024;

    public static void main(String[] args) {
        long[][] fast = new long[LINE_NUM][COLUM_NUM];

        long startTime = System.currentTimeMillis();
        for (int i = 0; i < LINE_NUM; ++i) {
            for (int j = 0; j < COLUM_NUM; ++j) {
                // 地址连续取用
                fast[i][j] = i * 2 + j;
            }
        }
        System.out.println("Use Cache time: " + (System.currentTimeMillis() - startTime));

        long[][] slow = new long[LINE_NUM][COLUM_NUM];
        startTime = System.currentTimeMillis();
        for (int i = 0; i < LINE_NUM; ++i) {
            for (int j = 0; j < COLUM_NUM; ++j) {
                // 地址非连续取用
                fast[j][i] = i * 2 + j;
            }
        }
        System.out.println("Not use Cache time: " + (System.currentTimeMillis() - startTime));

    }

}

```

对于上述两个循环中: 循环一会快于循环二! <font color="#0000ff">因为数组内数组元素的内存地址是连续的, 当访问数组第一个元素时, 会把第一个元素后的若干元素放入缓存, 这样在访问时, 缓存直接命中就不用去主内存中读取了!</font>

<font color="#ff0000">但是在多线程并发修改一个缓存行中的多个变量时, 就会发生竞争缓存行, 从而降低程序运行效率!</font>



#### 3): 避免伪共享

JDK 8之前是通过**字节填充**来避免, 即: <font color="#0000ff">创建一个变量时, 使用填充字段填充该变量所在缓存行, 这样即避免了将多个变量存放在同一个缓存行!</font>

如:

```java
public final static class FilledLong {
    public volatile long value = 0;
    public long p1, p2, p3, p4, p5, p6;
}

```

假设缓存行为64字节, 则: 填充了6个long类型, 每个long类型占用8字节, 加上value变量本身, 共56字节. 此外, <font color="#0000ff">FilledLong是一个类对象, 每个类对象的字节码的对象头占用8字节</font>. 共64字节刚好占用一个缓存行!

JDK 8之后提供了`sun.misc.Contended`注解, 用来解决伪共享问题!

```java
@sun.misc.Contended
public final static class FilledLong {
    public volatile long value = 0L;
}
```

<font color="#ff0000">注解可以修饰类, 变量.</font>

**注意: **<font color="#ff0000">默认情况下, `@Contended`注解只用于Java的核心类, 如: `rt.jar`包下的类. 若用户类路径下的类需要使用这个注解, 需要:

-   添加JVM参数`-XX: -RestrictContended`,
-   自定义填充宽度: `-XX:ContendedPadding Width`



