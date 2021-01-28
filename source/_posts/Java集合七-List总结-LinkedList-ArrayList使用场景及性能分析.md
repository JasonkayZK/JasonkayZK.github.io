---
title: 'Java集合七-List总结(LinkedList, ArrayList使用场景及性能分析)'
toc: true
date: 2019-11-27 10:32:56
cover: https://img.paulzzh.tech/touhou/random?7
categories: Java源码
tags: [Java基础, 面试总结, 集合]
---

前面，我们学完了List的全部内容(ArrayList, LinkedList, Vector, Stack)

[Java集合二-ArrayList](https://jasonkayzk.github.io/2019/11/24/Java%E9%9B%86%E5%90%88%E4%BA%8C-ArrayList/)

[Java集合四-LinkedList](https://jasonkayzk.github.io/2019/11/26/Java%E9%9B%86%E5%90%88%E5%9B%9B-LinkedList/)

[Java集合五-Vector](https://jasonkayzk.github.io/2019/11/26/Java%E9%9B%86%E5%90%88%E4%BA%94-Vector/)

[Java集合六-Stack](https://jasonkayzk.github.io/2019/11/27/Java%E9%9B%86%E5%90%88%E5%85%AD-Stack/)

现在，我们再回头看看总结一下List。内容包括：

-   List概括
-   List各实现类使用场景及性能分析

<br/>

<!--more-->

## 一. List概括

先回顾一下List的框架图

![List框架图.jpg](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/List框架图.jpg)

**① List 是一个接口，继承于Collection接口**. 它代表着有序的队列

**② AbstractList 是一个抽象类，它继承于AbstractCollection**。AbstractList实现List接口中除size()、get(int location)之外的方法

**③ AbstractSequentialList 是一个抽象类，它继承于AbstractList**。AbstractSequentialList 实现了“链表中，根据index索引值操作链表的全部方法”

**④** ArrayList, LinkedList, Vector, Stack是List的4个实现类:

-   **ArrayList 是一个数组队列，相当于动态数组**。它由数组实现，随机访问效率高，随机插入、随机删除效率低

    

-   **LinkedList 是一个双向链表**。它也可以被当作堆栈、队列或双端队列进行操作, LinkedList随机访问效率低，但随机插入、随机删除效率低

    

-   **Vector 是矢量队列，和ArrayList一样，它也是一个动态数组，由数组实现**。但是ArrayList是非线程安全的，而Vector是线程安全的(使用暴力的所有方法添加synchronized)

    

-   **Stack 是栈，它继承于Vector**。它的特性是：先进后出(FILO, First In Last Out)

 <br/>

## 二. List使用场景

**如果涉及到“栈”、“队列”、“链表”等操作，应该考虑用List，具体的选择哪个List，根据下面的标准来取舍:**

-   对于**需要快速插入，删除元素，应该使用LinkedList**

    

-   对于**需要快速随机访问元素，应该使用ArrayList**

    

-   -   对于“**单线程环境**” 或者 “**多线程环境，但List仅仅只会被单个线程操作**”，此时应该使用非同步的类(如ArrayList)

    -   对于“**多线程环境**，且List可能同时被多个线程操作”，此时，应该使用同步的类(如Vector)


通过下面的测试程序，我们来验证上面的结论, 参考代码如下：

```java
/**
 * 对比ArrayList和LinkedList的插入、随机读取效率、删除的效率
 *
 * @author zk
 */
public class ListCompareTest {

    private static final int COUNT = 100000;

    private static LinkedList linkedList = new LinkedList();
    private static ArrayList arrayList = new ArrayList();
    private static Vector vector = new Vector();
    private static Stack stack = new Stack();

    public static void main(String[] args) {
        // 换行符
        System.out.println();
        // 插入
        insertByPosition(stack) ;
        insertByPosition(vector) ;
        insertByPosition(linkedList) ;
        insertByPosition(arrayList) ;

        // 换行符
        System.out.println();
        // 随机读取
        readByPosition(stack);
        readByPosition(vector);
        readByPosition(linkedList);
        readByPosition(arrayList);

        // 换行符
        System.out.println();
        // 删除
        deleteByPosition(stack);
        deleteByPosition(vector);
        deleteByPosition(linkedList);
        deleteByPosition(arrayList);
    }

    // 获取list的名称
    private static String getListName(List list) {
        if (list instanceof LinkedList) {
            return "LinkedList";
        } else if (list instanceof ArrayList) {
            return "ArrayList";
        } else if (list instanceof Stack) {
            return "Stack";
        } else if (list instanceof Vector) {
            return "Vector";
        } else {
            return "List";
        }
    }

    // 向list的指定位置插入COUNT个元素，并统计时间
    private static void insertByPosition(List list) {
        long startTime = System.currentTimeMillis();

        // 向list的位置0插入COUNT个数
        for (int i=0; i<COUNT; i++) {
            list.add(0, i);
        }

        long endTime = System.currentTimeMillis();
        long interval = endTime - startTime;
        System.out.println(getListName(list) + " : insert "+COUNT+" elements into the 1st position use time：" + interval+" ms");
    }

    // 从list的指定位置删除COUNT个元素，并统计时间
    private static void deleteByPosition(List list) {
        long startTime = System.currentTimeMillis();

        // 删除list第一个位置元素
        for (int i=0; i<COUNT; i++) {
            list.remove(0);
        }

        long endTime = System.currentTimeMillis();
        long interval = endTime - startTime;
        System.out.println(getListName(list) + " : delete "+COUNT+" elements from the 1st position use time：" + interval+" ms");
    }

    // 根据position，不断从list中读取元素，并统计时间
    private static void readByPosition(List list) {
        long startTime = System.currentTimeMillis();

        // 读取list元素
        for (int i=0; i<COUNT; i++) {
            list.get(i);
        }

        long endTime = System.currentTimeMillis();
        long interval = endTime - startTime;
        System.out.println(getListName(list) + " : read "+COUNT+" elements by position use time：" + interval+" ms");
    }
}
```

**运行结果如下**：

```
Stack :       insert 100000 elements into the 1st position use time：1060 ms
Vector :      insert 100000 elements into the 1st position use time：981 ms
LinkedList :  insert 100000 elements into the 1st position use time：8 ms
ArrayList :   insert 100000 elements into the 1st position use time：986 ms

Stack :       read 100000 elements by position use time：3 ms
Vector :      read 100000 elements by position use time：0 ms
LinkedList :  read 100000 elements by position use time：3583 ms
ArrayList :   read 100000 elements by position use time：1 ms

Stack :       delete 100000 elements from the 1st position use time：926 ms
Vector :      delete 100000 elements from the 1st position use time：928 ms
LinkedList :  delete 100000 elements from the 1st position use time：5 ms
ArrayList :   delete 100000 elements from the 1st position use time：909 ms
```

><br/>
>
>**从中，我们可以发现:**
>
>插入10万个元素，LinkedList所花时间最短：**8ms**
>
>删除10万个元素，LinkedList所花时间最短：**5ms**
>
>遍历10万个元素，LinkedList所花时间最长：**3583 ms**；而ArrayList、Stack和Vector则相差不多，都只用了几毫秒
>
>考虑到Vector是支持同步的，而Stack又是继承于Vector的；因此，得出结论:
>
>**① 对于需要快速插入，删除元素，应该使用LinkedList**
>
>**② 对于需要快速随机访问元素，应该使用ArrayList**
>
>**③ 对于“单线程环境” 或者 “多线程环境，但List仅仅只会被单个线程操作”，此时应该使用非同步的类**

<br/>

