---
title: Java集合三-Iterator的Fail-Fast机制总结
toc: true
date: 2019-11-24 16:39:37
cover: https://img.paulzzh.tech/touhou/random?13
categories: Java源码
tags: [Java基础, 面试总结, 集合]
description: 本篇以ArrayList为例, 总结了Java中Iterator出现的Fail-Fast(快速失败)机制
---

本篇以ArrayList为例, 总结了Java中出现的Fail-Fast(快速失败)机制

前面, 我们已经学习了[ArrayList的源码](https://jasonkayzk.github.io/2019/11/24/Java集合二-ArrayList/). 接下来，我们以ArrayList为例，对Iterator的fail-fast机制进行了解, 内容包括:

-   fail-fast简介
-   fail-fast示例
-   fail-fast解决办法
-   fail-fast原理
-   JUC解决fail-fast的原理

<br/>

<!--more-->

## Fail-Fast简介

**fail-fast 机制是java集合(Collection)中的一种错误机制, 当某个线程在遍历集合时, 其他线程或本线程自身对同一个集合的内容进行操作时，就可能会产生fail-fast事件**

例如：当某一个线程A通过iterator去遍历某集合的过程中，若该集合的内容被其他线程所改变了；那么线程A访问集合时，就会抛出ConcurrentModificationException异常，产生fail-fast事件

先通过一个示例来认识一下fail-fast

<br/>

## Fail-Fast示例

```java
/**
 * java集合中Fast-Fail的测试程序
 *
 * fast-fail事件产生的条件：当多个线程对Collection进行操作时，若其中某一个线程通过iterator去遍历集合时，该集合的内容被其他线程所改变；则会抛出ConcurrentModificationException异常
 *
 * fast-fail解决办法：通过util.concurrent集合包下的相应类去处理，则不会产生fast-fail事件
 * 
 * 本例中，分别测试ArrayList和CopyOnWriteArrayList这两种情况: ArrayList会产生fast-fail事件，而CopyOnWriteArrayList不会产生fast-fail事件。
 * 1) 使用ArrayList时，会产生fast-fail事件，抛出ConcurrentModificationException异常；定义如下：
 *     private static List<String> list = new ArrayList<String>();
 *
 * 2) 使用时CopyOnWriteArrayList，不会产生fast-fail事件；定义如下：
 *     private static List<String> list = new CopyOnWriteArrayList<String>();
 *
 * @author zk
 */
public class FastFailTest {

    private static List<String> list = new ArrayList<>();

//    private static List<String> list = new CopyOnWriteArrayList<String>();

    public static void main(String[] args) {

        // 同时启动两个线程对list进行操作！
        new ThreadOne().start();
        new ThreadTwo().start();
    }

    private static void printAll() {
        System.out.println();
        for (String s : list) {
            System.out.print(s + ", ");
        }
    }

    /**
     * 向list中依次添加0,1,2,3,4,5，每添加一个数之后，就通过printAll()遍历整个list
     */
    private static class ThreadOne extends Thread {
        @Override
        public void run() {
            int i = 0;
            while (i < 6) {
                list.add(String.valueOf(i));
                printAll();
                i++;
            }
        }
    }

    /**
     * 向list中依次添加10,11,12,13,14,15，每添加一个数之后，就通过printAll()遍历整个list
     */
    private static class ThreadTwo extends Thread {
        @Override
        public void run() {
            int i = 10;
            while (i < 16) {
                list.add(String.valueOf(i));
                printAll();
                i++;
            }
        }
    }

}
```

><br/>
>
>**运行结果**: <font color="#ff0000"运行该代码，抛出异常java.util.ConcurrentModificationException, 即，产生fail-fast事件</font>
>
>**结果说明**：
>
>**①** FastFailTest中通过 new ThreadOne().start() 和 new ThreadTwo().start() 同时启动两个线程去操作list:
>
>-   **ThreadOne线程**：向list中依次添加0,1,2,3,4,5。每添加一个数之后，就通过printAll()遍历整个list
>-   **ThreadTwo线程**：向list中依次添加10,11,12,13,14,15。每添加一个数之后，就通过printAll()遍历整个list
>
>**②** 当某一个线程遍历list的过程中，list的内容被另外一个线程所改变了；就会抛出ConcurrentModificationException异常，产生fail-fast事件

<br/>

## 三. Fail-Fast解决办法

fail-fast机制，是一种错误检测机制。**它只能被用来检测错误，因为JDK并不保证fail-fast机制一定会发生。**

若在多线程环境下使用fail-fast机制的集合，建议使用`java.util.concurrent包下的类`去取代java.util包下的类. 所以, 本例中只需要将ArrayList替换成java.util.concurrent包下对应的类即可:

```
private static List<String> list = new ArrayList<String>();
```

替换为

```
private static List<String> list = new CopyOnWriteArrayList<String>();
```

则可以解决该问题

<br/>

## 四. Fail-Fast原理

产生fail-fast事件，是通过抛出ConcurrentModificationException异常来触发的. 那么，ArrayList是如何抛出ConcurrentModificationException异常的呢?

我们知道，ConcurrentModificationException是在操作Iterator时抛出的异常, 而ArrayList的Iterator是在父类AbstractList中实现的, 所以我们不妨先看看AbstractList的源代码:

```java
public abstract class AbstractList<E> extends AbstractCollection<E> implements List<E> {

    ...

    // AbstractList中唯一的属性
    // 用来记录List修改的次数：每修改一次(增/删操作)，将modCount + 1
    protected transient int modCount = 0;

    // 返回List对应迭代器。实际上，是返回Itr对象。
    public Iterator<E> iterator() {
        return new Itr();
    }

    // Itr是Iterator(迭代器)的实现类
    private class Itr implements Iterator<E> {
        int cursor = 0; 

        int lastRet = -1;

        // 修改数的记录值。
        // 每次新建Itr()对象时，都会保存新建该对象时对应的modCount；
        // 以后每次遍历List中的元素的时候，都会比较expectedModCount和modCount是否相等；
        // 若不相等，则抛出ConcurrentModificationException异常，产生fail-fast事件
        int expectedModCount = modCount;

        public boolean hasNext() {
            return cursor != size();
        }

        public E next() {
            // 获取下一个元素之前，都会判断“新建Itr对象时保存的modCount”和“当前的modCount”是否相等；
            // 若不相等，则抛出ConcurrentModificationException异常，产生fail-fast事件。
            // 其余方法类似
            checkForComodification();
            try {
                E next = get(cursor);
                lastRet = cursor++;
                return next;
            } catch (IndexOutOfBoundsException e) {
                checkForComodification();
                throw new NoSuchElementException();
            }
        }

        public void remove() {
            if (lastRet == -1)
                throw new IllegalStateException();
            checkForComodification();

            try {
                AbstractList.this.remove(lastRet);
                if (lastRet < cursor)
                    cursor--;
                lastRet = -1;
                expectedModCount = modCount;
            } catch (IndexOutOfBoundsException e) {
                throw new ConcurrentModificationException();
            }
        }

        final void checkForComodification() {
            if (modCount != expectedModCount)
                throw new ConcurrentModificationException();
        }
    }

    ...
}
```

><br/>
>
>从中，我们可以发现在调用 next() 和 remove()时，都会执行 checkForComodification(): **若 “modCount 不等于 expectedModCount”，则抛出ConcurrentModificationException异常，产生fail-fast事件**
>
>而从Itr类中，我们知道 expectedModCount 在创建Itr对象时，被赋值为 modCount。所以，需要考证的就是modCount何时会被修改。

接下来，我们查看ArrayList的源码，来看看modCount是如何被修改的:

```java
public class ArrayList<E> extends AbstractList<E> implements List<E>, RandomAccess, Cloneable, java.io.Serializable {

    ...

    // list中容量变化时，对应的同步函数
    public void ensureCapacity(int minCapacity) {
        modCount++;
        int oldCapacity = elementData.length;
        if (minCapacity > oldCapacity) {
            Object oldData[] = elementData;
            int newCapacity = (oldCapacity * 3)/2 + 1;
            if (newCapacity < minCapacity)
                newCapacity = minCapacity;
            elementData = Arrays.copyOf(elementData, newCapacity);
        }
    }

    // 添加元素到队列最后
    public boolean add(E e) {
        // 修改modCount
        ensureCapacity(size + 1); 
        elementData[size++] = e;
        return true;
    }

    // 添加元素到指定的位置
    public void add(int index, E element) {
        if (index > size || index < 0)
            throw new IndexOutOfBoundsException(
            "Index: "+index+", Size: "+size);

        // 修改modCount
        ensureCapacity(size+1); 
        System.arraycopy(elementData, index, elementData, index + 1,
             size - index);
        elementData[index] = element;
        size++;
    }

    // 添加集合
    public boolean addAll(Collection<? extends E> c) {
        Object[] a = c.toArray();
        int numNew = a.length;
        // 修改modCount
        ensureCapacity(size + numNew);
        System.arraycopy(a, 0, elementData, size, numNew);
        size += numNew;
        return numNew != 0;
    }
   
    // 删除指定位置的元素 
    public E remove(int index) {
        RangeCheck(index);

        // 修改modCount
        modCount++;
        E oldValue = (E) elementData[index];

        int numMoved = size - index - 1;
        if (numMoved > 0)
            System.arraycopy(elementData, index+1, elementData, index, numMoved);
        elementData[--size] = null;

        return oldValue;
    }

    // 快速删除指定位置的元素 
    private void fastRemove(int index) {
        // 修改modCount
        modCount++;
        int numMoved = size - index - 1;
        if (numMoved > 0)
            System.arraycopy(elementData, index+1, elementData, index,
                             numMoved);
        elementData[--size] = null;
    }

    // 清空集合
    public void clear() {
        // 修改modCount
        modCount++;
        for (int i = 0; i < size; i++)
            elementData[i] = null;
        size = 0;
    }

    ...
}
```

从中，我们发现：无论是add()、remove()，还是clear()，只要涉及到修改集合中的元素个数时，都会改变modCount的值

**即: 当多个线程对同一个集合进行操作的时候，某线程访问集合的过程中，该集合的内容被其他线程所改变(即其它线程通过add、remove、clear等方法，改变了modCount的值)；这时，就会抛出ConcurrentModificationException异常，产生fail-fast事件**

<br/>

## 五. JUC解决fail-fast的原理

上面，说明了解决fail-fast机制的办法，也知道了fail-fast产生的根本原因, 接下来，我们再进一步谈谈java.util.concurrent包中是如何解决fail-fast事件的

还是以和ArrayList对应的CopyOnWriteArrayList进行说明, 我们先看看CopyOnWriteArrayList的源码：

```java
public class CopyOnWriteArrayList<E> implements List<E>, RandomAccess, Cloneable, java.io.Serializable {

    ...

    // 返回集合对应的迭代器
    public Iterator<E> iterator() {
        return new COWIterator<E>(getArray(), 0);
    }

    ...
   
    // 内部类COWIterator: 作为CopyOnWriteArrayList的迭代器
    private static class COWIterator<E> implements ListIterator<E> {
        
        private final Object[] snapshot;
        private int cursor;

        private COWIterator(Object[] elements, int initialCursor) {
            cursor = initialCursor;
            // 新建COWIterator时，将集合中的元素保存到一个新的拷贝数组中(快照)
            // 这样，当原始集合的数据改变，拷贝数据中的值也不会变化
            snapshot = elements;
        }

        public boolean hasNext() {...}
        public boolean hasPrevious() {...}
        public E next() {...}
        public E previous() {...}
        public int nextIndex() {...}
        public int previousIndex() {...}
        public void remove() {...}
        public void set(E e) {...}
        public void add(E e) {...}
    }
  
    ...

}
```

从中，我们可以看出:

-   **① 和ArrayList继承于AbstractList不同，CopyOnWriteArrayList没有继承于AbstractList，它仅仅只是实现了List接口;**
-   **② ArrayList的iterator()函数返回的Iterator是在AbstractList中实现的；而CopyOnWriteArrayList是自己实现Iterator;**
-   **③ ArrayList的Iterator实现类中调用next()时，会调用checkForComodification()比较`expectedModCountmodCount`的大小”；但是，CopyOnWriteArrayList的Iterator实现类中，没有所谓的checkForComodification()，更不会抛出ConcurrentModificationException异常！** 

<br/>