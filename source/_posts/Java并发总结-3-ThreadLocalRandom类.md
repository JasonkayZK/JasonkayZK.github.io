---
title: Java并发总结-3-ThreadLocalRandom类
toc: true 
date: 2019-09-14 22:52:14
categories: 并发编程
cover:  https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1567750837551&di=fae22e8ce73ecbc87820964da733b106&imgtype=0&src=http%3A%2F%2Fimg3m1.ddimg.cn%2F31%2F20%2F1465705921-1_u_1.jpg
tags: [并发编程, 多线程]
description: Java并发编程之美-3-ThreadLocalRandom类 
---



ThreadLocalRandom类是JDK 7 在JUC下新增的随机数生成器, 弥补了在多线程下的缺陷. 本文主要讲解为何要在JUC下新增该类, 以及该类的实现原理!

<!--more-->

### 1. Random类及其局限性

在JDK 7之前和现在, `java.util.Random类`都是使用广泛的随机数生成工具类, 并且<font color="#ff0000">`java.lang.Math`中的随机数生成也是用的此类的实例!</font>

**例:**

```java
package club.jasonkayzk666.chapter3.threadlocalrandom.lesson1.randomfalut;

import java.util.Random;

public class RandomDemo {

    public static void main(String[] args) {

        // 生成默认的随机数种子的随机数生成器!
        Random random = new Random();
        for (int i = 0; i < 10; i++) {
            System.out.println(random.nextInt(5));
        }
    }
}

```

<font color="#0000ff">随机数的生成需要一个默认的种子, 这个种子其实是一个long类型的数字! *也可以在创建`Random对象`时通过构造函数指定!*</font>

对于生成随机数的源码:

```java
public int nextInt(int bound) {
    // 参数检查
    if (bound <= 0) 
        throw new IllegalArgumentException(BadBound);
    
    // 根据老的种子, 生成新的种子!
    int r = next(31);
    // 根据新的种子计算随机数
    .....
    return r;
}
```

**即: 新的随机数生成需要两个步骤**

-   <font color="#0000ff">根据老的种子生成新的种子;</font>
-   <font color="#0000ff">根据新的种子计算新的随机数</font>

其中:

-   根据老的种子生成新的种子可以抽象为: 

    `seed = f(seed)`, 其中f为一个固定的函数, 如: `f(seed) = a*seed + b`;

-   根据新的种子计算随机数可以抽象为: 

    `g(seed, bound)`, 其中g是一个固定的函数, 如: `g(seed, bound) = (int)(bound * (long)seed) >> 31`.

<br/>

#### 1): 局限性: 多线程无法保证随机性

<font color="#0000ff">对于单线程而言: *每次调用`nextInt`都是根据老的种子计算出新的种子*, 此时可以保证随机性!</font>

<font color="#ff0000">在多线程的情况下: 多个线程可能拿到的是同一个老的种子去执行计算新的种子, 此时会*导致多个线程产生的新种子是一样的!* 而g的算法也是固定的, 所以多个线程最终产生的随机数是一样的! 所以最终无法保证多线程随机性.</font>

<br/>

#### 2): 局限性的一种解决方案:

<font color="#ff0000">使得通过老种子产生新种子的步骤是原子的即可!</font>

即, <font color="#0000ff">当多个线程根据老种子计算新种子时, 第一个线程的新种子被计算出来后, 第二个线程要*丢弃自己的老种子*, 而使用第一个线程的新种子来计算自己的新种子.....</font>

<font color="#ff0000">Random函数内部使用了一个原子变量达到了这个效果, 在创建Random对象时初始化的种子就已经被保存在了种子的原子变量中!</font>

`Random类中next()方法`源码如下所示

```java
protected int next(int bits) {
    long oldseed, nextseed;
    AtomicLong seed = this.seed;
    
    // 使用while循环来计算新的种子
    do {
        // (6) 获取当前原子变量种子的值
        oldseed = seed.get();
        // (7) 根据当前种子的值计算新的种子
        nextseed = (oldseed * multiplier + addend) & mask;
        // (8) 使用CAS操作, 使用新的种子去更新老的种子!
    } while (!seed.compareAndSet(oldseed, nextseed));
    // (9) 根据生成的新种子, 按照固定算法计算随机数
    return (int)(nextseed >>> (48 - bits));
}
```

**在代码(8)中使用CAS操作的原因:**

<font color="#0000ff">在多线程下, 可能多个线程都执行到了(6), 此时多个线程拿到的当前种子是同一个值! 然后执行步骤(7)计算的新种子也是同一个!</font>

<font color="#ff0000">但是CAS操作保证了只能有一个线程可以更新老的种子为新的! *失败的线程会通过循环而重新获取更新后的种子作为当前种子来计算*, 这就保证了随机性!</font>

 <br/>

#### 3): 总结

每个Random实例中都有一个**原子性的种子变量**来记录当前种子的值, 当要生成新的随机数时, <font color="#0000ff">需要根据当前种子计算新的种子并更新回原子变量种!</font>

<font color="#ff0000">但是当在多线程下, 当多个线程同时计算新的种子时, 多个线程会*竞争同一个原子变量的更新操作*, 由于原子变量的更新是CAS操作, 会造成大量线程自旋重试! 这降低了并发性能!</font>

<br/>

-----------------------



### 2. ThreadLocalRandom类

为了弥补多线程高并发下Random的缺陷, 在JUC包下, 新增了ThreadLocalRandom类.

#### 1): 使用

```java
package club.jasonkayzk666.chapter3.threadlocalrandom.lesson2.threadlocalrandom;

import java.util.concurrent.ThreadLocalRandom;

public class ThreadLocalRandomDemo {

    public static void main(String[] args) {
        // 获取一个随机数生成器
        ThreadLocalRandom random = ThreadLocalRandom.current();

        // 输出10个0~5(包括0, 不包括5)之间的随机数
        for (int i = 0; i < 10; i++) {
            System.out.println(random.nextInt(5));
        }

    }

}

```

<br/>

#### 2): 实现原理

通过ThreadLocal的原理可知: 

<font color="#ff0000">通过让每一个线程复制一份变量, 使得每个线程对变量进行操作的时候, 实际上是操作自己本地内存中的副本, 从而避免了对共享变量进行同步!</font>

<font color="#0000ff">Random的缺点是, 多个线程使用了同一个原子性种子变量, 从而导致CAS操作对原子变量的竞争!</font>

<font color="#0000ff">如果每一个线程维护一个种子变量, 则每一个线程生成随机数时都会根据自己老的种子计算新的种子, 而不会存在竞争问题了!</font>

<br/>

--------------------------------



### 3. 源码分析

#### 1): ThreadLocalRandom类图结构

ThreadLocalRandom类图结构如下:

![ThreadLocalRandom类图结构](https://upload-images.jianshu.io/upload_images/5879294-de63d1e5f21bd72c.png?imageMogr2/auto-orient/strip|imageView2/2/w/598)

可知: 

-   <font color="#0000ff">ThreadLocalRandom*继承了Random*并重写了`nextInt方法`;</font>

-   ThreadLocalRandom中并没有使用继承自Random的原子性种子变量:

    <font color="#ff0000">ThreadLocalRandom中并没有具体存放种子，具体的种子是存放到具体的调用线程的 threadLocalRandomSeed变量里面的, ThreadLocalRandom类似于ThreadLocal类就是个工具类;</font>

-   当线程调用ThreadLocalRandom的current方法时候:

    <font color="#0000ff">ThreadLocalRandom负责初始化调用线程的 threadLocalRandomSeed变量，也就是初始化种子;</font>

-   当调用ThreadLocalRandom的nextInt方法时候:

    <font color="#0000ff">实际上是*获取当前线程的`threadLocalRandomSeed变量`作为当前种子*来计算新的种子，然后更新新的种子到当前线程的threadLocalRandomSeed变量，然后在根据新种子和具体算法计算随机数;</font>

<br/>

**这里需要注意的是:**

-   <font color="#ff0000">`threadLocalRandomSeed`变量就是*Thread类里面的一个普通long变量，并不是原子性变量!* 因为这个变量是线程级别的，根本不需要使用原子性变量! </font>

-   <font color="#ff0000">变量`seeder和probeGenerator`是两个*原子性变量*, 在*初始化调用线程的种子和探针变量时候用到*，每个线程只会使用一次! </font>

-   <font color="#ff0000">变量instance是个ThreadLocalRandom的一个实例，该变量是`static`的!</font>

    当多线程通过ThreadLocalRandom的current方法获取ThreadLocalRandom的实例时候: <font color="#0000ff">其实获取的是同一个，但是由于具体的种子是存放到线程里面的，所以ThreadLocalRandom的实例里面*只是与线程无关的通用算法*，所以是线程安全的.</font>

<br/>



下面看看ThreadLocalRandom的主要代码实现逻辑

#### 2): Unsafe 机制的使用

```java
    private static final sun.misc.Unsafe UNSAFE;
    private static final long SEED;
    private static final long PROBE;
    private static final long SECONDARY;
    static {
        try {
            //获取unsafe实例
            UNSAFE = sun.misc.Unsafe.getUnsafe();
            Class<?> tk = Thread.class;
            //获取Thread类里面threadLocalRandomSeed变量在Thread实例里面偏移量
            SEED = UNSAFE.objectFieldOffset
                (tk.getDeclaredField("threadLocalRandomSeed"));
            //获取Thread类里面threadLocalRandomProbe变量在Thread实例里面偏移量
            PROBE = UNSAFE.objectFieldOffset
                (tk.getDeclaredField("threadLocalRandomProbe"));
            //获取Thread类里面threadLocalRandomSecondarySeed变量在Thread实例里面偏移量, 这个值在后面的LongAdder时用到!
            SECONDARY = UNSAFE.objectFieldOffset
                (tk.getDeclaredField("threadLocalRandomSecondarySeed"));
        } catch (Exception e) {
            throw new Error(e);
        }
    }
```

<br/>

#### 3): ThreadLocalRandom current()方法

该方法<font color="#0000ff">获取ThreadLocalRandom实例，并初始化调用线程中threadLocalRandomSeed和threadLocalRandomProbe变量;</font>

```java
    static final ThreadLocalRandom instance = new ThreadLocalRandom();
    public static ThreadLocalRandom current() {
        //(12)
        if (UNSAFE.getInt(Thread.currentThread(), PROBE) == 0)
            //(13)
            localInit();
        //(14)
        return instance;
    }
    static final void localInit() {
        int p = probeGenerator.addAndGet(PROBE_INCREMENT);
        int probe = (p == 0) ? 1 : p; // skip 0
        long seed = mix64(seeder.getAndAdd(SEEDER_INCREMENT));
        Thread t = Thread.currentThread();
        UNSAFE.putLong(t, SEED, seed);
        UNSAFE.putInt(t, PROBE, probe);
    }
```

-   代码(12):

    如果当前线程中threadLocalRandomProbe变量值为0 (默认情况下线程的这个变量为0): <font color="#0000ff">说明当前*线程第一次调用ThreadLocalRandom的current方法*，那么就需要调用localInit方法计算当前线程的初始化种子变量;</font>

    <font color="#0000ff">这里设计为了延迟初始化，不需要使用随机数功能时候Thread类中的种子变量就不需要被初始化，这是一种优化.</font>

-   代码(13):

    <font color="#0000ff">首先根据probeGenerator*计算当前线程中threadLocalRandomProbe的初始化值*，然后根据seeder计算当前线程的初始化种子，然后把这两个变量设置到当前线程;</font>

-   代码(14):

    返回ThreadLocalRandom的实例. <font color="#ff0000">需要注意的是这个方法是静态方法，多个线程返回的是同一个ThreadLocalRandom实例!</font>

<br/>

#### 4): int nextInt(int bound)方法：

计算当前线程的下一个随机数;

```java
    public int nextInt(int bound) {
        //(15)参数校验
        if (bound <= 0)
            throw new IllegalArgumentException(BadBound);
        //(16) 根据当前线程中种子计算新种子
        int r = mix32(nextSeed());
        //(17)根据新种子和bound计算随机数
        int m = bound - 1;
        if ((bound & m) == 0) // power of two
            r &= m;
        else { // reject over-represented candidates
            for (int u = r >>> 1;
                 u + m - (r = u % bound) < 0;
                 u = mix32(nextSeed()) >>> 1)
                ;
        }
        return r;
    }
```

如上代码逻辑步骤与Random相似，我们重点看下nextSeed()方法：

```java
    final long nextSeed() {
        Thread t; 
        long r; 
        UNSAFE.putLong(t = Thread.currentThread(), SEED,
                       r = UNSAFE.getLong(t, SEED) + GAMMA);
        return r;
    }
```

<font color="#0000ff">首先使用 `r = UNSAFE.getLong(t,  SEED)`获取当前线程中threadLocalRandomSeed变量的值，然后在种子的基础上`累加GAMMA值作为新种子`，然后使用UNSAFE的putLong方法把新种子放入当前线程的threadLocalRandomSeed变量. </font>

<br/>

----------------------------



### 4. 总结

<font color="#0000ff">ThreadLocalRandom使用ThreadLocal的原理, 让每一个线程都持有一个本地的种子变量, 该种子变量只有在使用随机数的时候才会被初始化! 在多线程下, 每个线程根据自己线程内的种子变量更新, 避免了竞争!</font>



