---
title: Java集合一-Collection架构
toc: false
date: 2019-11-23 13:31:19
cover: http://api.mtyqx.cn/api/random.php?21
categories: Java源码
tags: [Java基础, 面试总结, 集合]
description: 本篇总结了Java中提供的集合类的相关知识
---

本篇总结了Java中提供的集合类的相关知识, 即java.util.*包中的集合类.

<br/>

<!--more-->

## 一. 集合总体框架概述

Java集合是java 提供的工具包`java.util.*`, 包含了常用的数据结构：集合、链表、队列、栈、数组、映射等。

Java集合主要可以划分为4个部分：

-   List列表;
-   Set集合;
-   Map映射;
-   工具类(Iterator迭代器、Enumeration枚举类、Arrays和Collections)

Java集合工具包框架图(如下)：

![Collection框架结构.jpg](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/Collection框架结构.jpg)

 看上面的框架图，先抓住它的主干，即Collection和Map。

**① Collection**

Collection是一个接口，是高度抽象出来的集合，它包含了集合的基本操作和属性。AbstractCollection抽象类，它实现了Collection中的绝大部分函数;

Collection包含了List和Set两大分支。  AbstractList和AbstractSet都继承于AbstractCollection; 具体的List实现类继承于AbstractList，而Set的实现类则继承于AbstractSet。

(1) List是一个**有序**的队列，每一个元素都有它的索引。第一个元素的索引值是0. List的实现类有: LinkedList, ArrayList, Vector, Stack

(2) Set是一个不允许有重复元素的集合. Set的实现类有: HashSet和TreeSet. HashSet依赖于HashMap，它实际上是通过HashMap实现的；TreeSet依赖于TreeMap，它实际上是通过TreeMap实现的。

**② Map**

Map是一个映射接口，即key-value键值对。 

AbstractMap是个抽象类，它实现了Map接口中的大部分API。HashMap，TreeMap，WeakHashMap都是继承于AbstractMap。
   Hashtable虽然继承于Dictionary，但它实现了Map接口。

接下来，再看Iterator。

**③ Iterator**

Iterator是遍历集合的工具，即我们通常通过Iterator迭代器来遍历集合。我们说Collection依赖于Iterator，是因为Collection的实现类都要实现iterator()函数，返回一个Iterator对象. ListIterator是专门为遍历List而存在的。

**④ Enumeration**

再看Enumeration，它是JDK 1.0引入的抽象类。作用和Iterator一样，也是遍历集合；但是Enumeration的功能要比Iterator少。在上面的框图中，Enumeration只能在Hashtable, Vector, Stack中使用。

**⑤ Arrays和Collections**

最后，看Arrays和Collections。它们是操作数组、集合的两个工具类。

<br/>

## 二. Collection 框架概述

Collection实现了Iterable接口, 先来看一下Iterable:

```java
public interface Iterable<T> {
    
    Iterator<T> iterator();

    default void forEach(Consumer<? super T> action) {
        Objects.requireNonNull(action);
        for (T t : this) {
            action.accept(t);
        }
    }
    
    default Spliterator<T> spliterator() {
        return Spliterators.spliteratorUnknownSize(iterator(), 0);
    }
}

```

在Iterable接口中, 定义了一个Interator类型的属性(接口中默认为public static final类型), 和forEach以及seliterator方法, 并通过default声明了默认方法

><br/>
>
>**备注: default函数**
>
>在java8之前 ,一个类实现一个接口需要实现接口所有的方法. 
>
>但是这样会导致一个问题: 当一个接口有很多的实现类的时候,修改这个接口就变成了一个非常麻烦的事,需要修改这个接口的所有实现类!
>
>不过在java8中这个问题得到了解决: default函数
>
>看下面这个例子:
>
>```java
>interface DefaultInterface {
>    int operate(int a, int b);
>    
>    default int addition(int a, int b) {
>        return a + b;
>    }
>}
>
>public class Test implements DefaultInterface {
>
>    @Override
>    public int operate(int a, int b) {
>        return a - b;
>    }
>
>    public static void main(String[] args) {
>        Test defaultMethodTest = new Test();
>        System.out.println("5 + 3 = " + defaultMethodTest.addition(5, 3)); // 5 + 3 = 8
>        System.out.println("5 - 3 = " + defaultMethodTest.operate(5, 3)); // 5 - 3 = 2
>    }
>}
>```
>
>可以看到 DefaultInterface 接口的addition方法用default进行了修饰,并且有自己的默认实现. 
>
>而Test仅仅实现DefaultInterface 接口一个方法, 却不用实现addition方法.
>
><font color="#ff0000">如果我们对一个接口进行修改,而又不想修改已经有的实现类的时候就变得非常有用!</font>

**1.** **Iterator**

Iterator 是一个接口，它是集合的迭代器, 集合可以通过Iterator去遍历集合中的元素。

Iterator提供的API接口，包括：

-   **是否存在下一个元素**: boolean hasNext()
-   **获取下一个元素**: E next()
-   **删除当前元素**: void remove()

```java
public interface Iterator<E> {

    boolean hasNext();
    E next();
    
    // JDK 8加入默认方法(之前只有声明)
    default void remove() { throw new UnsupportedOperationException("remove"); }
    
    // JDK 8加入
    default void forEachRemaining(Consumer<? super E> action) {
        Objects.requireNonNull(action);
        while (hasNext())
            action.accept(next());
    }
    
}
```

><br/>
>
>**注意:**
>
>**① Iterator遍历Collection时，是 fail-fast 机制的**: <font color="#0000ff">当某一个线程A通过iterator去遍历某集合的过程中，若该集合的内容被其他线程所改变了；那么线程A访问集合时，就会抛出ConcurrentModificationException异常，产生fail-fast事件;</font>
>
>**② JDK 8中加入了forEachRemaining()默认方法.**
>
>1.  **与forEach()方法的区别在于:** <font color="#0000ff">可以多次调用forEach，并将元素进行多次传递。而forEachRemaining()使用迭代器Iterator的所有元素之后，第二次调用它将不会做任何事情，因为不再有下一个元素!</font>
>
>2.  **forEachRemaining可使用Lambda表达式来遍历集合元素**, 例如:
>
>    ```java
>    public class Test {
>    
>        public static void main(String[] args) {
>            List<String> list = new ArrayList<>();
>            list.add("1");
>            list.add("make");
>            list.add("2");
>            Iterator<String> it=list.iterator();
>    
>            it.forEachRemaining(System.out::println); // 1 make 2
>            it.forEachRemaining(System.out::println); // 已经没有输出了
>        }
>    
>    }
>    ```

**2. ListIterator**

ListIterator 是一个**继承于Iterator的接口**，它是队列迭代器, **专门用于遍历List，能提供向前向后遍历。**

相比于Iterator它新增了: 

-   添加
-   是否存在上一个元素
-   获取上一个元素等;

```java
public interface ListIterator<E> extends Iterator<E> {
    
    /* Iterator接口中的方法 */
    boolean hasNext();
    E next();
    void remove();
    
    /* ListIterator中定义的方法 */
    boolean hasPrevious();
    E previous();
    int nextIndex();
    int previousIndex();
    void set(E e);
    void add(E e);
}
```

><br/>
>
>**备注: ListIterator相比于Iterator只是扩充了一些针对于List遍历的方法而已!**

**3. Collection**

Collection 是一个接口，是高度抽象出来的集合，它包含了集合的基本操作：添加、删除、清空、遍历(读取)、是否为空、获取大小、是否保护某元素等等；

<font color="#0000ff">Collection 接口的所有子类(直接子类和间接子类)都必须实现2种构造函数：不带参数的构造函数 和 参数为Collection的构造函数。带参数的构造函数，可以用来转换Collection的类型;</font>

```java
public interface Collection<E> extends Iterable<E> { 
    int size(); 
    boolean isEmpty(); 
    boolean contains(Object o); 
    Iterator<E> iterator(); 
    Object[] toArray();
    
    // String[] y = x.toArray(new String[0]);
    <T> T[] toArray(T[] a); 

    boolean add(E e); 
    boolean remove(Object o); 
    boolean containsAll(Collection<?> c); 
    boolean addAll(Collection<? extends E> c); 
    boolean removeAll(Collection<?> c); 
    boolean retainAll(Collection<?> c); 
    void clear(); 
    boolean equals(Object o); 
    int hashCode(); 
    
    // JDK 11新添加
    default <T> T[] toArray(IntFunction<T[]> generator) { 
        return toArray(generator.apply(0));
    }
    
	// JDK 8添加
	default boolean removeIf(Predicate<? super E> filter) {
        Objects.requireNonNull(filter);
        boolean removed = false;
        final Iterator<E> each = iterator();
        while (each.hasNext()) {
            if (filter.test(each.next())) {
                each.remove();
                removed = true;
            }
        }
        return removed;
    }
    
    // JDK 8新添加
    @Override
    default Spliterator<E> spliterator() {
        return Spliterators.spliterator(this, 0);
    }

    // JDK 8新添加
    default Stream<E> stream() {
        return StreamSupport.stream(spliterator(), false);
    }    
    // JDK 8新添加
    default Stream<E> parallelStream() {
        return StreamSupport.stream(spliterator(), true);
    }
    
}
```

><br/>
>
>**备注:** 可以看到, 除了一些正常的增删改查操作之外, JDK8/11还加入了一些流操作

**4. List**

List是一个继承于Collection的接口，即List是集合中的一种。List是**有序**的队列，List中的每一个元素都有一个索引；第一个元素的索引值是0，往后的元素的索引值依次+1。和Set不同，List中允许有重复的元素。

<font color="#0000ff">关于API方面。既然List是继承于Collection接口，它自然就包含了Collection中的全部函数接口；由于List是有序队列，它也额外的有自己的API接口。主要有“添加、删除、获取、修改指定位置的元素”、“获取List中的子队列”等</font>

```java
public interface List<E> extends Collection<E> {
    
    /* Collection的API */
    boolean         add(E object)
    boolean         addAll(Collection<? extends E> collection)
    void            clear()
    boolean         contains(Object object)
    boolean         containsAll(Collection<?> collection)
    boolean         equals(Object object)
    int             hashCode()
    boolean         isEmpty()
    Iterator<E>     iterator()
    boolean         remove(Object object)
    boolean         removeAll(Collection<?> collection)
    boolean         retainAll(Collection<?> collection)
    int             size()
    <T> T[]         toArray(T[] array)
    Object[]        toArray()
        
    // JDK 8新加入 
    @Override
    default Spliterator<E> spliterator() {
        if (this instanceof RandomAccess) {
            return new AbstractList.RandomAccessSpliterator<>(this);
        } else {
            return Spliterators.spliterator(this, Spliterator.ORDERED);
        }
    }
        
    /* 相比与Collection，List新增的API */
    void                add(int location, E object)
    boolean             addAll(int location, Collection<? extends E> collection)
    E                   get(int location)
    int                 indexOf(Object object)
    int                 lastIndexOf(Object object)
    ListIterator<E>     listIterator(int location)
    ListIterator<E>     listIterator()
    E                   remove(int location)
    E                   set(int location, E object)
    List<E>             subList(int start, int end)

    // JDK 8新加入 
    default void replaceAll(UnaryOperator<E> operator) {
        Objects.requireNonNull(operator);
        final ListIterator<E> li = this.listIterator();
        while (li.hasNext()) {
            li.set(operator.apply(li.next()));
        }
    }

    // JDK 8新加入 
    @SuppressWarnings({"unchecked", "rawtypes"})
    default void sort(Comparator<? super E> c) {
            Object[] a = this.toArray();
            Arrays.sort(a, (Comparator) c);
            ListIterator<E> i = this.listIterator();
            for (Object e : a) {
                i.next();
                i.set((E) e);
            }
    }
    
	// JDK 9新加入
    static <E> List<E> of() {
        return ImmutableCollections.emptyList();
    }
    
    // JDK 9新加入
    static <E> List<E> of(E e1) {
        return new ImmutableCollections.List12<>(e1);
    }
    
    // JDK 9新加入
    static <E> List<E> of(E e1, E e2) {
        return new ImmutableCollections.List12<>(e1, e2);
    }
    
    ...
      
    // JDK 9新加入
	static <E> List<E> of(E e1, E e2, E e3, E e4, E e5, E e6, E e7, E e8, E e9, E e10) {
        return new ImmutableCollections.ListN<>(e1, e2, e3, e4, e5,
                                                e6, e7, e8, e9, e10);
    }
    
    // JDK 9新加入
    @SafeVarargs
    @SuppressWarnings("varargs")
    static <E> List<E> of(E... elements) {
        switch (elements.length) { // implicit null check of elements
            case 0:
                return ImmutableCollections.emptyList();
            case 1:
                return new ImmutableCollections.List12<>(elements[0]);
            case 2:
                return new ImmutableCollections.List12<>(elements[0], elements[1]);
            default:
                return new ImmutableCollections.ListN<>(elements);
        }
    }
    
    // JDK 10加入
    static <E> List<E> copyOf(Collection<? extends E> coll) {
        return ImmutableCollections.listCopy(coll);
    }
    
}
```

><br/>
>
>**备注:** 可以看到, JDK 8中List添加了sort方法, JDK 10中添加了copyOf方法(虽然大多数人还是习惯使用Collections中的方法)

**5. Set**

Set 是一个继承于Collection的接口，即Set也是集合中的一种。Set是没有重复元素的集合。

关于API方面。Set的API和Collection几乎完全一样。

```java
public interface Set<E> extends Collection<E> {
    
    /* Collection的API */
    boolean         add(E object)
    boolean         addAll(Collection<? extends E> collection)
    void             clear()
    boolean         contains(Object object)
    boolean         containsAll(Collection<?> collection)
    boolean         equals(Object object)
    int             hashCode()
    boolean         isEmpty()
    Iterator<E>     iterator()
    boolean         remove(Object object)
    boolean         removeAll(Collection<?> collection)
    boolean         retainAll(Collection<?> collection)
    int             size()
    <T> T[]         toArray(T[] array)
    Object[]         toArray()
     
    // JDK 8新增
    @Override
    default Spliterator<E> spliterator() {
        return Spliterators.spliterator(this, Spliterator.DISTINCT);
    }        
    
    /* Set新增API */
    // JDK 9新增
    static <E> Set<E> of() {
        return ImmutableCollections.emptySet();
    }
    
    // JDK 9新增
    static <E> Set<E> of(E e1) {
        return new ImmutableCollections.Set12<>(e1);
    }
    
    // JDK 9新增
    static <E> Set<E> of(E e1, E e2) {
        return new ImmutableCollections.Set12<>(e1, e2);
    }
    
    ...
        
    // JDK 9新增        
    static <E> Set<E> of(E e1, E e2, E e3, E e4, E e5, E e6, E e7, E e8, E e9, E e10) {
        return new ImmutableCollections.SetN<>(e1, e2, e3, e4, e5,
                                               e6, e7, e8, e9, e10);
    }        
    
	// JDK 9新增
    @SafeVarargs
    @SuppressWarnings("varargs")
    static <E> Set<E> of(E... elements) {
        switch (elements.length) { // implicit null check of elements
            case 0:
                return ImmutableCollections.emptySet();
            case 1:
                return new ImmutableCollections.Set12<>(elements[0]);
            case 2:
                return new ImmutableCollections.Set12<>(elements[0], elements[1]);
            default:
                return new ImmutableCollections.SetN<>(elements);
        }
    }
    
    // JDK 10新增
    @SuppressWarnings("unchecked")
    static <E> Set<E> copyOf(Collection<? extends E> coll) {
        if (coll instanceof ImmutableCollections.AbstractImmutableSet) {
            return (Set<E>)coll;
        } else {
            return (Set<E>)Set.of(new HashSet<>(coll).toArray());
        }
    }    
    
}
```

**6. AbstractCollection**

AbstractCollection是一个**抽象类**，它<font color="#ff0000">实现了Collection中除iterator()和size()之外的方法</font>, 从而**方便其它类实现Collection**. 

比如ArrayList、LinkedList等，它们这些类想要实现Collection接口，而通过继承AbstractCollection就已经实现了大部分的接口了。

```java
public abstract class AbstractCollection<E> implements Collection<E> {
    
    protected AbstractCollection() {}
    
    /* Collection中未实现的方法 */
    public abstract Iterator<E> iterator();
    public abstract int size();
    
    /* 实现Collection接口中的方法 */
    public boolean isEmpty() {...}
    public boolean contains(Object o) {...}
    public Object[] toArray() {...}
    public <T> T[] toArray(T[] a) {...}
    public boolean add(E e) {...}
    public boolean remove(Object o) {...}
    public boolean containsAll(Collection<?> c) {...}
    public boolean addAll(Collection<? extends E> c) {...}
    public boolean removeAll(Collection<?> c) {...}
    public boolean retainAll(Collection<?> c) {...}
    public void clear() {...}
    
    /* 继承Object的方法 */
    public String toString() {...}
    
    /* AbstractCollection中的方法 */
    private static <T> T[] finishToArray(T[] r, Iterator<?> it) {...}
    private static int hugeCapacity(int minCapacity) {...}
    
    /* AbstractCollection中的属性 */
    private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;
    
}
```

><br/>
>
>**备注:**
>
>**①** **AbstractCollection抽象类**中实现了Collection接口**除iterator()和size()的方法**, 并且请注意, <font color="#ff0000">对于那些没有重写但是被声明为default的方法, 类中也是可以使用的!</font>
>
>**②** AbstractCollection中已经重写了toString()方法;
>
>**③** AbstractCollection中定义了MAX_ARRAY_SIZE, 表示数组可分配的最大容量, 原文:
>
>><br/>
>>
>>**The maximum size of array to allocate. Some VMs reserve some header words in an array.** 
>>
>>**Attempts to allocate larger arrays may result in OutOfMemoryError: Requested array size exceeds VM limit**
>
>**④** AbstractCollection中存在两个private方法:
>
>-   **finishToArray:** 在toArray()方法中使用, 当迭代器返回的元素比预期的多时，重新分配toArray中使用的数组，并从迭代器中完成数组填充。(Reallocates the array being used within toArray when the iterator returned more elements than expected, and finishes filling it from the iterator.)
>-   **hugeCapacity:** 在finishToArray方法中使用, 当finished方法需要开辟更大数组空间时, 判断空间大小并返回新的大小

**7. AbstractList**

AbstractList 是一个**继承于AbstractCollection，并且实现List接口的抽象类**。

<font color="#0000ff">它实现了List中除size()、get(int location)之外的函数, 从而方便其它类继承List。  另外，和AbstractCollection相比，AbstractList抽象类中，**实现了iterator()接口**。</font>

```java
public abstract class AbstractList<E> extends AbstractCollection<E> implements List<E> {
    
    protected transient int modCount = 0;
    
    protected AbstractList() {}
    
    /* AbstractList中未实现的List接口方法 */
    public abstract E get(int index);
    
    /* AbstractList中实现的List接口(AbstractList他自己实现的) */
    public boolean add(E e) {...}
    public E set(int index, E element) {...}
    public void add(int index, E element) {...}
    public E remove(int index) {...}
    public int indexOf(Object o) {...}
    public int lastIndexOf(Object o) {...}
    public void clear() {...}
    public boolean addAll(int index, Collection<? extends E> c) {...}
    public Iterator<E> iterator() {...}
    public ListIterator<E> listIterator() {...}
    public ListIterator<E> listIterator(final int index) {...}
    public List<E> subList(int fromIndex, int toIndex) {...}
    
    /* 重写Collection中的方法 */
    public boolean equals(Object o) {...}
    public int hashCode() {...}
    
    /* AbstractList中定义的方法 */
    static void subListRangeCheck(int fromIndex, int toIndex, int size) {...}
    protected void removeRange(int fromIndex, int toIndex) {...}
    private void rangeCheckForAdd(int index) {...}
    private String outOfBoundsMsg(int index) {...}
    
    
    /* AbstractList中的Iterator实现类, 真正List元素ListItr的父类 */
    private class Itr implements Iterator<E> {
        /**
         * Index of element to be returned by subsequent call to next.
         */        
    	int cursor = 0;
        /**
         * Index of element returned by most recent call to next or
         * previous.  Reset to -1 if this element is deleted by a call
         * to remove.
         */
        int lastRet = -1; 
        /**
         * The modCount value that the iterator believes that the backing
         * List should have.  If this expectation is violated, the iterator
         * has detected concurrent modification.
         */
        int expectedModCount = modCount;
        
        /* Iterator接口中的方法 */
        public boolean hasNext() {...}        
        public E next() {...}
        public void remove() {...}
        
        /* Itr中定义的方法 */
        final void checkForComodification() {...}
    }
    
    
    /* AbstractList中Iterator真正的元素 */
    private class ListItr extends Itr implements ListIterator<E> {
        ListItr(int index) { cursor = index; }    
        
        /* ListIterator接口中的方法 */
        public boolean hasPrevious() {...}
        public E previous() {...}
        public int nextIndex() {...}
        public int previousIndex() {...}
        public void set(E e) {...}
        public void add(E e) {...}
    }
    
    
    /* JDK 8之后, 为了并行遍历元素而设计的一个可分割迭代器(splitable iterator) */
    static final class RandomAccessSpliterator<E> implements Spliterator<E> {
        
        private final List<E> list;
        private int index; // current index, modified on advance/split
        private int fence; // -1 until used; then one past last index
        private final AbstractList<E> alist; // The following fields are valid if covering an AbstractList
        private int expectedModCount; // initialized when fence set
        
        /* RandomAccessSpliterator的构造方法 */
        RandomAccessSpliterator(List<E> list) {...}
        
		/* Spliterator接口中的方法 */
        public Spliterator<E> trySplit() {...}
        public boolean tryAdvance(Consumer<? super E> action) {...}
        public long estimateSize() {...}
        public int characteristics() {...}
        public void forEachRemaining(Consumer<? super E> action) {...}
        
        /* RandomAccessSpliterator类中定义的方法 */
        RandomAccessSpliterator(List<E> list) {...}
        private RandomAccessSpliterator(RandomAccessSpliterator<E> parent, int origin, int fence) {...} // Create new spliterator covering the given range
		private static <E> E get(List<E> list, int i) {...}
        private int getFence() {...} // initialize fence to size on first use
    }
    
    /* AbstractList的内部类SubList, 继承了AbstractList本身, 是List的一个视图 */
    private static class SubList<E> extends AbstractList<E> {
        
        private final AbstractList<E> root;
        private final SubList<E> parent;
        private final int offset;
        protected int size;
        
        /* AbstractList抽象类(内部类继承了包括他的类!)的方法 */
        public E set(int index, E element) {...}
        public void add(int index, E element) {...}
        public E remove(int index) {...}
        protected void removeRange(int fromIndex, int toIndex) {...}
        public boolean addAll(int index, Collection<? extends E> c) {...}
        public Iterator<E> iterator() {...}
        public ListIterator<E> listIterator(int index) {...}
        public List<E> subList(int fromIndex, int toIndex) {...}
        public E get(int index) {...}
        
        /* AbstractCollection抽象类中的方法 */
        public int size() {...} // AbstractCollection并未实现该方法, 另一个未实现的方法是Iterator()
        public boolean addAll(Collection<? extends E> c) {...} // 覆盖AbstractCollection的方法
        
        /* SubList中定义的方法 */
        public SubList(AbstractList<E> root, int fromIndex, int toIndex) {...} // Constructs a sublist of an arbitrary AbstractList, which is not a SubList itself.
        protected SubList(SubList<E> parent, int fromIndex, int toIndex) {...} // Constructs a sublist of another SubList.
        private void rangeCheckForAdd(int index) {...}
        private String outOfBoundsMsg(int index) {...}
        private void checkForComodification() {...}
        private void updateSizeAndModCount(int sizeChange) {...}
    }
    
    /* 继承自SubList(他的爸爸就是AbstractList), 并实现RandomAccess接口 */
    private static class RandomAccessSubList<E> extends SubList<E> implements RandomAccess {
        
        /* 覆盖了父类SubList的方法 */
        public List<E> subList(int fromIndex, int toIndex) {...}
		
        /* RandomAccessSubList中定义的方法 */
         RandomAccessSubList(AbstractList<E> root, int fromIndex, int toIndex) {...} // Constructs a sublist of an arbitrary AbstractList, which is not a RandomAccessSubList itself.
        RandomAccessSubList(RandomAccessSubList<E> parent, int fromIndex, int toIndex) {...} // Constructs a sublist of another RandomAccessSubList.
    }
    
}
```

><br/>
>
>**备注:**
>
>这里的关系比较复杂, 首先先说明一下RandomAccess接口: 
>
>**RandomAccess接口:** 
>
>它是JDK 1.4中加入的接口, 它内部一个方法都没定义, 是一个标志接口, 文档原文为:
>
>>   <br/>
>>
>>   **Marker interface used by `List` implementations to indicate that they support fast (generally constant time) random access.**
>
>即RandomAccess 是一个标志接口，表明实现这个这个接口的 List 集合是支持快速随机访问的。也就是说，实现了这个接口的集合是支持 **快速随机访问** 策略的;
>
>且如果是实现了这个接口的 **List**，那么使用for循环的方式获取数据会优于用迭代器获取数据。
>
>接下来结合代码, 再看一下AbstractList:
>
>**① AbstractList本身:**
>
>1.  AbstractList自身继承自AbstractCollection(显而易见, 为了方便才创立的AbstractCollection, **要注意AbstractCollection未实现iterator()和size()方法**);
>
>2.  同时AbstractList实现了List的部分接口<font color="#ff0000">(除了get()方法, 因为数组实现和链表实现的get显然是不同的!)</font>
>
>3.  **AbstractList重写了equals()和hashcode()方法!**
>
>4.  AbstractList定义了四个方法:
>    -   **void subListRangeCheck(int fromIndex, int toIndex, int size)**: 包内可见的方法, 用于subList()方法, 截取自列表前判断index, size的合法性;
>    -   **removeRange**: 删除指定区间的元素;
>    -   **rangeCheckForAdd**: 用于addAll方法, 判断index的合法性;
>    -   **outOfBoundsMsg**: 代码: return "Index: "+index+", Size: "+size(); 用于rangeCheckForAdd抛出的IndexOutOfBoundsException时的错误信息;
>
>**② AbstractList中定义的内部类:**
>
>-   **Itr**: AbstractList中的一个Iterator实现类, 为ListItr服务的父类;
>-   **ListItr**: AbstractList中Iterator真正的元素, 继承了Itr, 并实现了ListIterator接口**(ListIterator是一个继承了Iterator的接口, 为List遍历而创建)**;
>-   **RandomAccessSpliterator**: 实现了Spliterator接口. JDK 8之后, 为了并行遍历元素而设计的一个可分割迭代器(splitable iterator);
>-   **SubList**: AbstractList的内部类SubList, 继承了AbstractList本身, 作为List的一个视图, 为RandomAccessSubList服务;<font color="#ff0000">这个内部类的牛逼之处在于, 他继承了包含他的类!</font>
>-   **RandomAccessSubList**: 继承自SubList(那个很牛逼的内部类), 并实现了RandomAccess接口;
>
>**③ AbstractList中的内部类关系整理:**
>
>1.  **RandomAccessSpliterator与其他内部类没有关系**, 它仅仅是实现了Spliterator接口, 在JDK 8之后, 为了并行遍历元素而设计的;
>
>2.  **Itr与ListItr是一组**: 两者为父子完成了对ListIterator接口的实现; 是普遍使用的List内部的迭代器实现;
>
>3.  **SubList与RandomAccessSubList是一组**: 最牛逼的父子组合, 连续继承了包含他们的AbstractList, 并配合实现了RandomAccess和AbstractList; 主要应用于创建List的子视图;

<br/>

**8. AbstractSet**

AbstractSet 是一个继承于AbstractCollection，并且实现Set接口的抽象类。<font color="#ff0000">由于Set接口和Collection接口中的API完全一样，Set也就没有自己单独的API。</font>

**和AbstractCollection一样，它实现了List中除iterator()和size()之外的方法, 从而方便其它类实现Set接口。**

```java
public abstract class AbstractSet<E> extends AbstractCollection<E> implements Set<E> {
    
    protected AbstractSet() {}
    
    /* 重写了Collection中的equals()和hashcode()方法 */
    public boolean equals(Object o) {...}
    public int hashCode() {...}
    
    /* 实现了Set接口中的removeAll()方法 */
    public boolean removeAll(Collection<?> c) {...}
}

```

><br/>
>
>**备注:**
>
>AbstractSet比较简单, 因为Set接口在继承自Collection时, 除了of()方法和copyOf()方法之外, 也确实没声明什么新的东西;
>
>不过在AbstractSet中就实现了removeAll, 说明下面的代码估计都懒省事了233.

<br/>