---
title: Java集合六-Stack
toc: false
date: 2019-11-27 10:05:10
cover: http://api.mtyqx.cn/api/random.php?11
categories: Java源码
tags: [Java基础, 面试总结, 集合]
description: 本篇总结了Java中的Stack
---

学完[Vector](https://jasonkayzk.github.io/2019/11/26/Java%E9%9B%86%E5%90%88%E4%BA%94-Vector/)了之后，接下来我们开始学习Stack。Stack很简单，它继承于Vector。学习方式还是和之前一样，先对Stack有个整体认识，然后再学习它的源码；最后再通过实例来学会使用它。内容包括：

-   Stack介绍
-   Stack源码解析(基于JDK11.0.4)
-   Stack示例

<br/>

<!--more-->

## 一. Stack介绍

**Stack简介**

 Stack是栈, 它的特性是：**先进后出**(FILO, First In Last Out)

-   **Stack是继承于[Vector](https://jasonkayzk.github.io/2019/11/26/Java%E9%9B%86%E5%90%88%E4%BA%94-Vector/)(矢量队列)的**, 由于Vector是通过数组实现的，这就意味着，**Stack也是通过数组实现的, 而非链表**

    

-   并且Stack也是使用synchronized实现同步的

显然, 我们**也可以将LinkedList当作栈**来使用

<br/>

**Stack的继承关系**

```java
java.lang.Object
↳     java.util.AbstractCollection<E>
   ↳     java.util.AbstractList<E>
       ↳     java.util.Vector<E>
           ↳     java.util.Stack<E>

public class Stack<E> extends Vector<E> {}
```

<br/>

**Stack和Collection的关系如下图:**

![Stack和Collection的关系.jpg]()

<br/>

**Stack的构造方法**

Stack**只有一个默认构造方法**，如下：

```java
public Stack() {}
```

<br/>

**Stack的API**

Stack是栈，它**常用的API**如下：

```java
             boolean       empty()
synchronized E             peek()
synchronized E             pop()
             E             push(E object)
synchronized int           search(Object o)
```

>   <br/>
>
>   **注意:** 由于Stack和继承于Vector，因此**它也包含Vector中的全部API**

<br/>

## 二. Stack源码解析(基于JDK11.0.4)

Stack的源码非常简单，下面我们对它进行学习:

```java
public class Stack<E> extends Vector<E> {
    
    // 构造方法
    public Stack() {}

    // push方法：将元素存入栈顶
    public E push(E item) {
        // 将元素存入栈顶
        // addElement()的实现在Vector.java中
        addElement(item);

        return item;
    }

    // pop方法：返回栈顶元素，并将其从栈中删除
    public synchronized E pop() {
        E       obj;
        int     len = size();

        obj = peek();
        // 删除栈顶元素，removeElementAt()的实现在Vector.java中
        removeElementAt(len - 1);

        return obj;
    }

    // peek方法：返回栈顶元素，不执行删除操作
    public synchronized E peek() {
        int     len = size();

        if (len == 0)
            throw new EmptyStackException();
        // 返回栈顶元素，elementAt()具体实现在Vector.java中
        return elementAt(len - 1);
    }

    // 栈是否为空
    public boolean empty() {
        return size() == 0;
    }

    // 查找元素o(使用equals()方法)在栈中的位置：由栈底向栈顶方向查找
    public synchronized int search(Object o) {
        // 获取元素索引，elementAt()具体实现在Vector.java中
        int i = lastIndexOf(o);

        if (i >= 0) {
            return size() - i;
        }
        return -1;
    }

    // 版本ID, 这个用于版本升级控制
    private static final long serialVersionUID = 1224463164541339165L;
}

```

><br/>
>
>**总结:**
>
>**① Stack实际上是通过数组去实现的**
>
>-   执行**push**时(即，**将元素推入栈中**)，是通过将元素追加的数组的末尾中
>
>    
>
>-   执行**peek**时(即，**取出栈顶元素，不执行删除**)，是返回数组末尾的元素
>
>    
>
>-   执行**pop**时(即，**取出栈顶元素，并将该元素从栈中删除**)，是取出数组末尾的元素，然后将该元素从数组中删除
>
>    
>
>**② Stack继承于Vector，意味着Vector拥有的属性和功能，Stack都拥有**
>
>**③** Stack继承于Vector，也意味着**Stack也是通过synchronized这种低效的方式实现多线程同步**的
>
>Vector都已经被淘汰了, 他的儿子当然也被淘汰了

<br/>

## 三. Stack示例

下面我们通过实例学习如何使用Stack

```java
/**
 * @desc Stack的测试程序。测试常用API的用法
 *
 * @author zk
 */
public class StackTest {

    public static void main(String[] args) {
        Stack stack = new Stack();
        // 将1,2,3,4,5添加到栈中
        for(int i=1; i<6; i++) {
            stack.push(String.valueOf(i));
        }

        // 遍历并打印出该栈
        iteratorThroughRandomAccess(stack) ;

        // 查找“2”在栈中的位置，并输出
        int pos = stack.search("2");
        System.out.println("the postion of 2 is:"+pos);

        // pup栈顶元素之后，遍历栈
        stack.pop();
        iteratorThroughRandomAccess(stack) ;

        // peek栈顶元素之后，遍历栈
        String val = (String)stack.peek();
        System.out.println("peek:"+val);
        iteratorThroughRandomAccess(stack) ;

        // 通过Iterator去遍历Stack
        iteratorThroughIterator(stack) ;
    }

    /**
     * 通过快速访问遍历Stack
     */
    public static void iteratorThroughRandomAccess(List list) {
        String val = null;
        for (int i=0; i<list.size(); i++) {
            val = (String)list.get(i);
            System.out.print(val+" ");
        }
        System.out.println();
    }

    /**
     * 通过迭代器遍历Stack
     */
    public static void iteratorThroughIterator(List list) {

        String val = null;
        for(Iterator iter = list.iterator(); iter.hasNext(); ) {
            val = (String)iter.next();
            System.out.print(val+" ");
        }
        System.out.println();
    }
}

------- Output -------
1 2 3 4 5 
the postion of 2 is:4
1 2 3 4 
peek:4
1 2 3 4 
1 2 3 4
```

<br/>