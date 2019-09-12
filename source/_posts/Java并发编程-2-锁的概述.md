---
title: Java并发编程-2-锁的概述
toc: true
date: 2019-09-12 10:33:27
categories: 并发编程
tags: [并发编程, 多线程]
description: Java并发编程之美-2-锁的概述
---

![Java线程生命周期](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1568266912531&di=c235b28ef40d7975bb63957baea6ad9c&imgtype=0&src=http%3A%2F%2Fimage.codes51.com%2FArticle%2Fimage%2F20160507%2F20160507104152_6100.jpg)

<br/>

本文主要总结了Java多线程编程中各种锁的种类以及概述: 

-   乐观锁与悲观锁
-   公平锁与非公平锁
-   独占锁和共享锁
-   可重入锁和不可重入锁
-   自旋锁

图为Java线程的生命周期.

<!--more-->

## Java 锁的概述

### 1. 乐观锁与悲观锁

乐观锁与悲观锁是数据库中引入的名词! 但是并发包中也引入了类似的思想.

#### 1): 悲观锁

**概念: ** 

<font color="#0000ff">指对数据被外界修改持保守态度, 认为数据很容易就被其他线程修改, 所以在数据被处理之前要先对数据进行加锁, 并在整个数据处理过程中, 使数据处于锁定状态!</font>

**实现: **

悲观锁的实现<font color="#ff0000">往往依靠数据库提供的锁机制, 即在对数据记录操作之前给记录增加*排它锁.*</font>

-   若获取锁失败, 则说明数据正在被其他线程修改, 当前线程等待或者抛出异常;
-   若获取锁成功, 则对记录进行操作, 然后提交事务后释放排它锁.

**例子: 使用悲观锁来避免多线程同时对一个记录进行修改**

```java
public int updateEntry(long id) {
    // 使用悲观锁获取指定记录
    EntryObject entry = query("SELECT * FROM table1 WHERE id = # {id} for update", id);
    
    // 修改记录内容, 根据计算修改entry记录的属性
    String name = generatorName(entry);
    entry.setName(name);
    .....
        
    // update操作
    int count = update("UPDATE table1 SET name=#{name}, age=#{age} WHERE id=#{id}", entry);
    
    return count;
}
```

这里假设`updateEntry, query, update`方法都使用了事务切面, 且事务传播性被设置为`required`:

-   <font color="#0000ff">执行`updateEntry`方法时, 如果上层调用方法没有开启事务, 则会即时开启一个事务, 然后执行代码!</font>

-   <font color="#0000ff">调用query方法, 由于事务传播性为`required`, 所以执行时没有开启新的事务, 而是加入了`updateEntry`开启的事务;</font>

也即是: <font color="#ff0000">当`updateEntry`方法执行完毕提交事务时, query方法才会被提交! </font>

<br/>

当多个线程同时调用updateEntry方法, 并且传递的是同一个id时, 只有一个线程执行代码会成功, 而其他线程将会被阻塞. <font color="#ff0000">因为同一时间只有一个线程可以获取到对应记录的锁, 而在获取锁的线程释放锁之前(updateEntry执行完毕之前), 其他线程必须等待!</font>

<br/>

#### 2): 乐观锁

**概念: **

乐观锁是相对悲观锁来说的, 他认为: <font color="#0000ff">数据在一般情况下不会造成冲突, 所以在*访问记录前不会增加排它锁!* 而是在数据提交更新的时候, 才会正式对数据冲突与否进行检测!</font>

**实现: **

<font color="#ff0000">具体来讲, 根据update返回的行数, 让用户决定如何去做! </font>

**例子: **

```java
public int updateEntry (long id) {
    // 使用乐观锁获取记录(1)
    EntryObject entry = query("SELECT * FROM table1 WHERE id = #{id}", id);
    
    // 修改记录, version字段不能被修改!(2)
    String name = generatorName(entry);
    entry.setName(name);
    ......
    
    // update操作(3)
    int count = update("UPDATE table1 SET name=#{name}, age=#{age}, version=${version}+1 WHERE id = #{id} AND version=#{version}", entry);
	return count;
}
```

对于上述代码, 当多个线程使用updateEntry, 并且传递相同的id时:

-   <font color="#0000ff">多个线程可以同时执行代码(1)并获得id对应的记录, 然后放入线程本地栈中;</font>

-   <font color="#0000ff">然后可以同时执行代码(2)对*自己栈上*的记录进行修改, 此时**多个线程修改后各自的entry中的属性都不同了!</font>

-   <font color="#0000ff">然后多个线程同时执行代码(3), 代码(3)中的update语句的where条件加入了`version=#{version}`条件, 并且set语句中多了`version=${version} + 1`表达式</font>: 

    <font color="#ff0000">若数据库中`id=#{id} && version=#{version}`的记录存在, 则更新version的值加1!</font>

<br/>

假设多个线程同时执行updateEntry并传入相同的id, 则执行(1)获取到的Entry是同一个! **(Entry中的version是同一个!)**. 所以, 当执行(3)时:

<font color="#ff0000">由于update语句本身是原子性的, 假设某一个线程执行update成功了, 此时id对应的version由原始值变为+1. 则其他线程执行代码时, 会返回影响的行号为0! </font>

业务上根据返回值0, 即可知道当前更新没有成功! 之后可以: 什么都不做, 或者选择重试:

```java
// 使用乐观锁重试更新的例子

public boolean updateEntry(long id) {
	
    boolean result = false;
    int retryNum = 5;
    while (retryNum > 0) {
        
        // 使用乐观锁获取记录(1)
        EntryObject entry = query("SELECT * FROM table1 WHERE id = #{id}", id);

        // 修改记录, version字段不能被修改!(2)
        String name = generatorName(entry);
        entry.setName(name);
        ......

        // update操作(3)
        int count = update("UPDATE table1 SET name=#{name}, age=#{age}, version=${version}+1 WHERE id = #{id} AND version=#{version}", entry);
        
        if (count == 1) {
            result = true;
            break;
        }
        retryNum--;
    }
    return result;
}
```

上述代码使用retryNum设置了更新失败后的重试次数. 

-   若执行后返回0: 说明记录已经被修改, 此时**重新获得最新的数据, 然后重新尝试更新!**

<br/>

**总结: **

<font color="#ff0000">乐观锁并不会使用数据库提供的锁机制! 一般在表中添加version字段或者业务状态来实现!</font>

<font color="#ff0000">乐观锁直到提交才锁定, 所以不会产生死锁!</font>



-----------------------------------



### 2. 公平锁与非公平锁

<font color="#0000ff">根据线程获取锁的抢占机制, 分为: 公平锁和非公平锁</font>

-   公平锁: 线程获取锁的顺序是按照线程请求锁的时间早晚来决定的, 先请求先得到;
-   非公平锁: 运行时闯入, 不一定先到的先得

**实现: **

`ReentrantLock`提供了公平锁和非公平锁的实现:

-   公平锁: 

    ```java
    ReentrantLock lock = new ReentrantLock(true);
    ```

-   非公平锁:

    ```java
    ReentrantLock lock = new ReentrantLock(false);
    ```

当构造函数不传参数<font color="#00ff00">默认为非公平锁!</font>



**举例:**

线程A已经获得锁, 此时线程B请求该锁将被挂起. 当线程A释放锁后, 线程C也需要获得该锁. 

-   若采用非公平锁方式, 根据线程调度, 线程B/C均有可能获得;
-   若使用公平锁, C将被挂起, 线程B获得锁.



------------------



### 3. 独占锁与共享锁

<font color="#0000ff">根据锁只能被单个线程持有, 还是能够被多个线程共同持有, 分为: *独占锁和共享锁*</font>

-   <font color="#0000ff">独占锁保证, 任何时候都只有一个线程能够得到锁, 如: `ReentrantLock`就是以独占方式实现;</font>

-   <font color="#0000ff">共享锁则可以同时由多个线程持有, 如: `ReadWriteLock`读写锁, 允许一个资源可以被多个线程同时进行读操作.</font>

<br/>

#### 1): 独占锁

是一种**悲观锁**, 由于每次访问资源都要先加上互斥锁, 限制了并发性.

<br/>

#### 2): 共享锁

是一种**乐观锁**, 放宽了加锁的条件, 允许多个线程同时进行读操作.

<br/>

--------------------------------



### 4. 可重入锁

当一个线程要获取一个*被其他线程持有的独占锁*时, 线程将被阻塞; 而<font color="#00ff00">当一个线程再次获取他自己已经获取的锁时, 是否会被阻塞</font>

如果不能被阻塞: *可重入锁*. 即: <font color="#0000ff">只要线程获取了该锁, 那么可以几乎无限次地进入该锁锁住的代码!</font>

<br/>

**应用场景:**

```java
public class Hello {
    
    public synchronized void helloA() {
        System.out.println("hello");
    }
    
    public synchronized void helloB() {
        System.out.println("helloB");
        helloA();
    }
    
}
```

如上代码块: <font color="#0000ff">调用helloB方法后, 会先获得内置锁, 然后打印输出. 之后调用helloA方法, 在调用前会先获取该锁</font>

<font color="#ff0000">如果锁是不可重入的, 那么线程将会一直被阻塞!</font>

<br/>

#### 可重入内部锁: synchronized

事实上, synchronized内部锁是: `可重入的`. 

**原理:**

<font color="#ff0000">在锁的内部维护一个线程标示, 用来标示该锁当前被哪个线程占用. 当一个线程获取了该锁时, 计数器的值变为1, 这时其他锁再来获取该锁时, 会发现锁的持有者不是自己而被阻塞挂起!</font>

<font color="#ff0000">当获取了该锁的线程再次获取该锁时, 发现所拥有者是自己时, 会把计数器+1, 当释放锁后计数器-1;</font>

<font color="#ff0000">当计数器值为零时, 锁中的线程标志被重置为null, 这时, 被阻塞的线程会被唤醒来竞争该锁!</font>

<br/>

----------------------------------



### 5. 自旋锁

由于Java中的线程与操作系统中的线程是一一对应的, 所以:

-   当一个线程在获取锁(如独占锁)失败后, <font color="#0000ff">会被切换到内核态而被挂起!</font>
-   当一个线程获取锁后, <font color="#0000ff">需要将其切换到内核态而唤醒该线程</font>

<font color="#ff0000">从用户态切换到内核状态的开销是比较大的, 在一定程度上影响了并发的性能!</font>

<br/>

**自旋锁则是:** 

<font color="#0000ff">当前线程获取锁时, 若发现锁已经被其他线程占有, 并不是马上阻塞自己! 而是在不放弃CPU使用权的前提下, 多次尝试(默认为10次, 可通过`-XX:PreBlockSpinsh`参数设置). 可能在后面几次尝试中其他线程已经释放了该锁! </font>

<font color="#0000ff">如果多次尝试之后仍没有获取到该锁, 则当前线程才会被阻塞挂起</font>

<font color="#ff0000">即: 使用CPU时间换取线程阻塞和调度的开销, 但是有可能这些CPU时间白白浪费!</font>



