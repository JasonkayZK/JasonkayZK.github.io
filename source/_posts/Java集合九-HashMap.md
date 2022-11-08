---
title: Java集合九-HashMap
toc: true
date: 2019-11-27 19:14:09
cover: https://img.paulzzh.tech/touhou/random?8
categories: Java源码
tags: [Java基础, 面试总结, 集合]
---

这一章，我们对HashMap进行学习

我们先对HashMap有个整体认识，然后再学习它的源码，最后再通过实例来学会使用HashMap。内容包括：

-   HashMap介绍
-   HashMap数据结构
-   HashMap源码深度解析(基于JDK11.0.4)

<br/>

<!--more-->

## 一. HashMap介绍

**HashMap简介** 

HashMap 是一个**散列表**，它**存储的内容是键值对(key-value)映射**

HashMap **继承于AbstractMap，实现了Map、Cloneable、Serializable接口**

<font color="#ff0000">**HashMap 的实现不是同步的，这意味着它不是线程安全的。它的key、value都可以为null。此外，HashMap中的映射不是有序的**</font>

HashMap 的实例有两个参数影响其性能：**初始容量** 和 **加载因子**:

-   **容量:** 是哈希表中桶的数量，初始容量是哈希表在创建时的容量
-   **加载因子:** 是哈希表在**其容量自动增加之前可以达到多满的一种尺度**. <font color="#ff0000">**当哈希表中的条目数超出了加载因子与当前容量的乘积时，则要对该哈希表进行 rehash  操作（即重建内部数据结构），从而哈希表将具有大约两倍的桶数**</font>

><br/>
>
>**备注: 加载因子**
>
>通常，**默认加载因子是 0.75**, 这是在时间和空间成本上寻求一种折衷
>
>**加载因子过高虽然减少了空间开销，但同时也增加了查询成本**（在大多数 HashMap 类的操作中，包括 get 和 put 操作，都反映了这一点）
>
>**在设置初始容量时应该考虑到映射中所需的条目数及其加载因子，以便最大限度地减少 rehash  操作次数, 如果初始容量大于最大条目数除以加载因子，则不会发生 rehash 操作**

<br/>

**HashMap的构造函数**

HashMap共有**4个构造函数**,如下：

```java
// 默认构造函数, 创建一个空的HashMap, 具有16的初始容量和0.75的加载因子
// Constructs an empty {@code HashMap} with the default initial capacity(16) and the default load factor (0.75)
public HashMap() {
    this.loadFactor = DEFAULT_LOAD_FACTOR; // (0.75f)
}

// 指定容量大小的构造函数, 创建一个空的HashMap, 具有initialCapacity的初始容量和0.75的加载因子
// Constructs an empty {@code HashMap} with the specified initial capacity and the default load factor (0.75).
public HashMap(int initialCapacity) {
    this(initialCapacity, DEFAULT_LOAD_FACTOR);
}

// 指定容量大小和加载因子的构造函数
// Constructs an empty {@code HashMap} with the specified initial capacity and load factor
public HashMap(int initialCapacity, float loadFactor) {
    // 初始化容量小于0, 报错IllegalArgumentException
    if (initialCapacity < 0)
        throw new IllegalArgumentException("Illegal initial capacity: " +
                                           initialCapacity);
    // 初始化容量大于最大容量(MAXIMUM_CAPACITY = 1 << 30 = 2^30 = 1073741824), 则设置为最大容量
    if (initialCapacity > MAXIMUM_CAPACITY)
        initialCapacity = MAXIMUM_CAPACITY;
    // 加载因子小于0或不是数字报错IllegalArgumentException
    if (loadFactor <= 0 || Float.isNaN(loadFactor))
        throw new IllegalArgumentException("Illegal load factor: " +
                                           loadFactor);
    this.loadFactor = loadFactor;
    this.threshold = tableSizeFor(initialCapacity);
}

// 包含子Map的构造函数, 有着相同的映射, 且初始化容量为满足映射关系的容量, 加载因子是0.75
// Constructs a new {@code HashMap} with the same mappings as the specified {@code Map}
// The {@code HashMap} is created with default load factor (0.75) and an initial capacity sufficient to hold the mappings in the specified {@code Map}
public HashMap(Map<? extends K, ? extends V> m) {
    this.loadFactor = DEFAULT_LOAD_FACTOR;
    putMapEntries(m, false);
}
```

<br/>

**HashMap的API**

```java
/* 来自于Map接口 */
int               size()
boolean           isEmpty()
V                 get(Object key)
boolean           containsKey(Object key)
V                 put(K key, V value)
void              putAll(Map<? extends K, ? extends V> map)
V                 remove(Object key)
void              clear()
boolean           containsValue(Object value)
Set<K>            keySet()
Collection<V>     values()
Set<Entry<K, V>>  entrySet()


/* 重写JDK 8后Map接口中的方法(Overrides of JDK8 Map extension methods) */
V                 getOrDefault(Object key, V defaultValue)
V                 putIfAbsent(K key, V value)
boolean           remove(Object key, Object value)
boolean           replace(K key, V oldValue, V newValue)
V                 replace(K key, V value)
V                 computeIfAbsent(K key, Function<? super K, ? extends V> mappingFunction)
V                 computeIfPresent(K key, BiFunction<? super K, ? super V, ? extends V> remappingFunction)
V                 compute(K key, BiFunction<? super K, ? super V, ? extends V> remappingFunction)
V                 merge(K key, V value, BiFunction<? super V, ? super V, ? extends V> remappingFunction)
void              forEach(BiConsumer<? super K, ? super V> action)
void              replaceAll(BiFunction<? super K, ? super V, ? extends V> function)


/* 重写AbstractMap抽象类中的clone() */
Object            clone()

```

<br/>

## HashMap数据结构

**HashMap的继承关系**

```java
java.lang.Object
   ↳     java.util.AbstractMap<K, V>
         ↳     java.util.HashMap<K, V>

public class HashMap<K,V>
    extends AbstractMap<K,V>
    implements Map<K,V>, Cloneable, Serializable { }
```

<br/>

**HashMap与Map关系如下图:**

![HashMap与Map关系.jpg](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/HashMap与Map关系.jpg)

从图中可以看出:

**① HashMap继承于AbstractMap类，实现了Map接口:** Map是"key-value键值对"接口，AbstractMap实现了"键值对"的通用方法接口

**② HashMap是通过"拉链法"实现的哈希表: 它包括几个重要的成员变量：table, size, threshold, loadFactor, modCount**

-   **table是一个Entry[]数组类型**，而**Entry实际上就是一个单向链表**。哈希表的**"k-v对"都是存储在Entry数组中的**

    

-   **size是HashMap的大小，它是HashMap保存的键值对的数量**

    

-   **threshold是HashMap的阈值**，用于**判断是否需要调整HashMap的容量:** `threshold=容量 x 加载因子`，当HashMap中**存储数据的数量达到threshold时，就需要将HashMap的容量加倍**

    

-   **loadFactor就是加载因子**

    

-   **modCount用来实现fail-fast机制**

<br/>

## 三. HashMap源码解析(基于JDK11.0.4)

为了更了解HashMap的原理，下面对HashMap源码代码作出分析

在阅读源码前, 先读一下源码中的一段注释这样更容易理解HashMap的一些行为:

><br/>
>
>```
>/*
>* Implementation notes.
>* 使用说明
>*
>* This map usually acts as a binned (bucketed) hash table, but
>* when bins get too large, they are transformed into bins of
>* TreeNodes, each structured similarly to those in  java.util.TreeMap. 
>* Most methods try to use normal bins, but
>* relay to TreeNode methods when applicable (simply by checking
>* instanceof a node).  
>* Bins of TreeNodes may be traversed and
>* used like any others, but additionally support faster lookup
>* when overpopulated. However, since the vast majority of bins in
>* normal use are not overpopulated, checking for existence of
>* tree bins may be delayed in the course of table methods.
>*
>* HashMap常表现为带bins(基于桶)的Hash表。但是bins(桶)变大的时候将装换成红黑树，此时结构像java.util.TreeMap
>* 绝大多数方法使用普通的扁平的bins(基于桶的)。但节点的数到达一定的阀值之后，变成红黑树的方法。
>* 红黑树的bins跟普通的扁平的bins没有差别，只是在数据量多的时候能够快速查找。
>* 大多数情况下，bins的数量不会很多。所以在内部实现上对于bins数量的检查也会滞后
>*
>* Tree bins (i.e., bins whose elements are all TreeNodes) are
>* ordered primarily by hashCode, but in the case of ties, if two
>* elements are of the same "class C implements Comparable<C>",
>* type then their compareTo method is used for ordering.
>* (We conservatively check generic types via reflection to validate
>* this -- see method comparableClassFor).  
>* The added complexity  of tree bins is worthwhile in providing worst-case O(log n)
>* operations when keys either have distinct hashes or are
>* orderable, Thus, performance degrades gracefully under
>* accidental or malicious usages in which hashCode() methods
>* return values that are  y1, y2 值, 赋给 y3, 最后打印的是 y3。poorly distributed, as well as those in
>* which many keys share a hashCode, so long as they are also
>* Comparable. (If neither of these apply, we may waste about a
>* factor of two in time and space compared to taking no
>* precautions. But the only known cases stem from poor user
>* programming practices that are already so slow that this makes
>* little difference)
>*
>* 红黑树的bins主要是根据该bin的hashCode排序，但是当两个元素是同一个实现了Comparable接口的对象，那么排序方式是通过该对象的compareTo方法决定排序。
>* （我们广泛使用了反射来确保对每一个对象的一般的类型进行映射检查(以满足排序) -- 见方法comparableClassFor）
>* 将操作（元素有不同的hashCode或者排序的）转化成红黑树的复杂运算是值得的, 因为当所有key拥有不同的hash值或者都是可排序的(orderable), 他将会把最坏的操作时间也降为O(log n).
>* 因此, 即使在意外或恶意使用hashCode()方法返回分布不均匀的值或者许多键共享一个hashCode的值时，只要它们都具有可比性(Comparable)，性能也只会"优雅地下降"(degrades gracefully)
>* (如果这两种情况都不适用[hashcode不同或实现了Comparable]，我们可能在时间和空间上浪费大约两倍于不采取措施。但是，唯一已知的情况是源于糟糕的用户编程实践(代码过于垃圾)
>* 而这些烂代码已经跑的非常缓慢了，以至于HashMap有(如果这两种情况都不适用[hashcode不同或实现了Comparable]，我们可能在时间和空间上浪费大约两倍于不采取措施。但是，唯一已知的情况是源于糟糕的用户编程实践(代码过于垃圾)没有优化没有什么区别)
>*
>* Because TreeNodes are about twice the size of regular nodes, we
>* use them only when bins contain enough nodes to warrant use
>* (see TREEIFY_THRESHOLD). And when they become too small (due to
>* removal or resizing) they are converted back to plain bins.  In
>* usages with well-distributed user hashCodes, tree bins are
>* rarely used.  Ideally, under random hashCodes, the frequency of
>* nodes in bins follows a Poisson distribution
>* (http://en.wikipedia.org/wiki/Poisson_distribution) with a
>* parameter of about 0.5 on average for the default resizing
>* threshold of 0.75, although with a large variance because of
>* resizing granularity. Ignoring variance, the expected
>* occurrences of list size k are (exp(-0.5) * pow(0.5, k) /
>* factorial(k)). The first values are:
>*
>* 由于TreeNodes的大小大约是常规节点的两倍，因此我们仅在容器包含足够的节点以保证使用时效率更高时才使用它们（请参见TREEIFY_THRESHOLD）
>* 并且当HashMap变得很小时(由于remove或resizing) 他们会重新被转化为普通的基于桶的拉链表
>* 对于hashcode分布良好(well-distributed)的情况下, 红黑色很少被使用
>* 在理想情况下, 在随机的hashCode()方法作用下, 在默认的大小调整阈值为0.75时，存储桶中节点的频率遵循泊松分布，上述公式中 λ 约等于 0.5, 即便是容量大小调整而有很大的差异的情况下
>* 忽略(容量)变化幅度，列表大小k的预期出现次数是（exp（-0.5）*pow（0.5，k）/ factorial（k））
>* 箱子中元素个数和概率的关系如下:
>*
>* 0:    0.60653066
>* 1:    0.30326533
>* 2:    0.07581633
>* 3:    0.01263606
>* 4:    0.00157952
>* 5:    0.00015795
>* 6:    0.00001316
>* 7:    0.00000094
>* 8:    0.00000006
>* more: less than 1 in ten million
>* 
>* 这就是为什么箱子中链表长度超过 8 以后要变成红黑树
>* 因为在正常情况下出现这种现象的几率小到忽略不计
>* 一旦出现，几乎可以认为是哈希函数设计有问题导致的
>*
>*
>* The root of a tree bin is normally its first node.  However,
>* sometimes (currently only upon Iterator.remove), the root might
>* be elsewhere, but can be recovered following parent links
>* (method TreeNode.root()).
>*
>* 红黑数的根通常是它的第一个节点. 
>* 然而,  有时(当前仅在Iterator.remove中)，根可能在其他地方，但可以在父链接(method TreeNode.root())中恢复
>*
>* All applicable internal methods accept a hash code as an
>* argument (as normally supplied from a public method), allowing
>* them to call each other without recomputing user hashCodes.
>* Most internal methods also accept a "tab" argument, that is
>* normally the current table, but may be a new or old one when
>* resizing or converting.
>* 
>* 内部方法中都接受一个hash code的参数(通常由公共方法提供)，允许它们在不重新计算用户哈希代码的情况下相互调用, 避免每次重复计算
>* 大多数内部方法也接受一个"tab"参数，通常这个参数指的是当前表，但在调整大小或转换时可能是新的或旧的 
>*
>*
>* When bin lists are treeified, split, or untreeified, we keep
>* them in the same relative access/traversal order (i.e., field
>* Node.next) to better preserve locality, and to slightly
>* simplify handling of splits and traversals that invoke
>* iterator.remove. When using comparators on insertion, to keep a
>* total ordering (or as close as is required here) across
>* rebalancings, we compare classes and identityHashCodes as
>* tie-breakers.
>*
>* 当HashMap被红黑树化, 被拆分, 或被去红黑树化, 我们将它们保持在相同的相对访问/遍历顺序(即field Node.next)中，以更好地保持局部性
>* 并稍微简化调用iterator.remove的拆分和遍历时的处理
>* 当在插入时使用比较器时，为了在重新平衡红黑树中保持总的顺序（或者尽可能接近这里所要求的顺序），我们比较类和标识哈希码作为连接断路器(短路运算符)
>*
>*
>* The use and transitions among plain vs tree modes is
>* complicated by the existence of subclass LinkedHashMap. See
>* below for hook methods defined to be invoked upon insertion,
>* removal and access that allow LinkedHashMap internals to
>* otherwise remain independent of these mechanics. (This also
>* requires that a map instance be passed to some utility methods
>* that may create new nodes.)
>* 
>* 由于子类LinkedHashMap的存在，普通vs树模式之间的使用和转换是非常复杂的
>* 有关定义为在插入、移除和访问时调用的钩子方法，请参见下文，这些钩子方法允许LinkedHashMap内部保持独立于这些机制
>* [通过LinkedHashMap实现树化和普通化的转换，在插入、删除、访问都会回调LinkedHashMap的实现方法]
>* (这还要求将map实例传递给一些实用程序方法, 同时可能会创建新的节点)
>*
>*
>* The concurrent-programming-like SSA-based coding style helps
>* avoid aliasing errors amid all of the twisty pointer operations.
>* 
>* 基于SSA(static single assignment)的并发编程风格有助于避免在Map定义的"反人类的"指针操作中出现错误
>*/
>```

<br/>

下面看一下源码:

```java
public class HashMap<K,V> extends AbstractMap<K,V> implements Map<K,V>, Cloneable, Serializable {

    // HashMap序列化ID
    private static final long serialVersionUID = 362498820763181265L;

    /*  Implementation notes ...... */

    // 默认的初始容量是16，必须是2的幂
    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4; // 16

    // 最大容量（必须是2的幂且小于2的30次方，传入容量过大将被这个值替换）
    static final int MAXIMUM_CAPACITY = 1 << 30;

    // 默认加载因子
    static final float DEFAULT_LOAD_FACTOR = 0.75f;

    // 如果哈希函数不合理，即使扩容也无法减少箱子中链表的长度
    // Java 的处理方案是当链表太长时，转换成红黑树
    // 这个值表示当某个桶中，链表长度大于 8(TREEIFY_THRESHOLD) 时，有可能会转化成树
    static final int TREEIFY_THRESHOLD = 8;

    // 在哈希表扩容时，如果发现链表长度小于 6，则会由树重新退化为链表
    static final int UNTREEIFY_THRESHOLD = 6;

    // 在转变成树之前，还会有一次判断，只有键值对数量大于 64(MIN_TREEIFY_CAPACITY) 才会发生转换
    // 这是为了避免在哈希表建立初期，多个键值对恰好被放入了同一个链表中而导致不必要的转化
    static final int MIN_TREEIFY_CAPACITY = 64;

    // Node是单向链表(JDK 8之前叫做Entry)
    // 它是“HashMap链式存储法”对应的链表(见内部类TreeNode和LinkedHashMap)
    // 它实现了Map.Entry 接口，即实现getKey(), getValue(), setValue(V value), equals(Object o), hashCode()等方法
    // Basic hash bin node, used for most entries.  (See below for TreeNode subclass, and in LinkedHashMap for its Entry subclass)
    static class Node<K,V> implements Map.Entry<K,V> {
        final int hash;
        final K key;
        V value;
        // 指向下一个节点
        Node<K,V> next;

        // 构造函数。
        // 输入参数包括"哈希值(h)", "键(k)", "值(v)", "下一节点(n)"
        Node(int hash, K key, V value, Node<K,V> next) {
            this.hash = hash;
            this.key = key;
            this.value = value;
            this.next = next;
        }

        public final K getKey()        { return key; }
        public final V getValue()      { return value; }
        public final String toString() { return key + "=" + value; }

        // 实现hashCode(), 使用key和value的hashcode的异或
        public final int hashCode() {
            return Objects.hashCode(key) ^ Objects.hashCode(value);
        }

        public final V setValue(V newValue) {
            V oldValue = value;
            value = newValue;
            return oldValue;
        }

        // 判断两个Node是否相等
        // 若两个Node的“key”和“value”都相等，则返回true。
        // 否则，返回false
        public final boolean equals(Object o) {
            if (o == this)
                return true;
            if (o instanceof Map.Entry) {
                Map.Entry<?,?> e = (Map.Entry<?,?>)o;
                if (Objects.equals(key, e.getKey()) &&
                    Objects.equals(value, e.getValue()))
                    return true;
            }
            return false;
        }
    }

    /* ---------------- 静态工具类(Static utilities) -------------- */

    /**
     * Computes key.hashCode() and spreads (XORs) higher bits of hash
     * to lower.  Because the table uses power-of-two masking, sets of
     * hashes that vary only in bits above the current mask will
     * always collide. (Among known examples are sets of Float keys
     * holding consecutive whole numbers in small tables.)  
     * So we apply a transform that spreads the impact of higher bits
     * downward. There is a tradeoff between speed, utility, and
     * quality of bit-spreading. Because many common sets of hashes
     * are already reasonably distributed (so don't benefit from
     * spreading), and because we use trees to handle large sets of
     * collisions in bins, we just XOR some shifted bits in the
     * cheapest possible way to reduce systematic lossage, as well as
     * to incorporate impact of the highest bits that would otherwise
     * never be used in index calculations because of table bounds.
     */
    // hash再散列方法
    // 计算key.hashCode()[计算得出hashCode 不属于这个hash函数管]把高位二进制序列(比如 0110 0111 中的 0110) , 的特征性传播到低位中，通过异或运算实现
    // 因为HashMap存储对象的数组容量经常是2的次方，这个二的次方(比如上面是16 = 2 ^ 4) 减1后作为掩码
    // 在掩码是2^n - 1 的情况下，只用低位的话经常发生hash冲突
    // (经典的例子是: 一组在小表中保存连续的浮点数key)
    // 所以我们应用一个转换，将高位的影响向下传播
    // 但是这种特性的传播会带来一定的性能损失(速度、实用性和位传播质量之间权衡)
    // 因为有的hashCode他们的低位已经足够避免多数hash冲突了(已经被合理的均匀分布了, 他们在位传播的过程中不会受益)
    // [比如我们的hashCode是八位的并且我们的数组大小是((2 ^ 8) - 1) (0111 1111) ]
    // [那么只有两种冲突情况而已，0mmm mmmm 和 1mmm mmmm 会冲突，每次进行插入元素或者查找元素都要调用hash函数再一次散列hashCode，显然不划算]
    // 因为我们使用树来处理容器中的大量冲突，所以我们只是以最节省的方式对一些移位的位进行异或运算，以减少系统损失
    // 并合并最高位的影响，否则由于表边界的原因，最高位永远不会用于索引计算
    static final int hash(Object key) {
        int h;
        return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    }

    // 用于对象x实现了Comparable接口的ClassFor()方法, 使用反射返回x的运行时类型
    // 当x的类型为X，且X直接实现了Comparable接口（比较类型必须为X类本身）时，返回x的运行时类型；否则返回null
    // Returns x's Class if it is of the form "class C implements Comparable<C>", else null.
    static Class<?> comparableClassFor(Object x) {
        if (x instanceof Comparable) {
            Class<?> c; Type[] ts, as; ParameterizedType p;
            if ((c = x.getClass()) == String.class) // 如果x是个字符串对象
                return c; // 返回String.
            // 为什么如果x是个字符串就直接返回c了呢? 
            // 因为String  实现了 Comparable 接口

            // 如果 c 不是字符串类，获取c直接实现的接口（如果是泛型接口则附带泛型信息）    
                for (Type t : ts) { // 遍历接口数组
                    // 如果当前接口t是个泛型接口 
                    // 如果该泛型接口t的原始类型p 是 Comparable 接口
	                // 如果该Comparable接口p只定义了一个泛型参数
    	            // 如果这一个泛型参数的类型就是c，那么返回c
                    if ((t instanceof ParameterizedType) &&
                        ((p = (ParameterizedType) t).getRawType() ==
                         Comparable.class) &&
                        (as = p.getActualTypeArguments()) != null &&
                        as.length == 1 && as[0] == c) // type arg is c
                        return c;
                }
            // 上面for循环的目的就是为了看看x的class是否 implements  Comparable<x的class>
            }
        }
        return null; // 如果c并没有实现 Comparable<c> 那么返回空
    }

    // 如果x所属的类是kc，返回k.compareTo(x)的比较结果, 如果x为空，或者其所属的类不是kc，返回0
    // Returns k.compareTo(x) if x matches kc (k's screened comparable class), else 0.
    @SuppressWarnings({"rawtypes","unchecked"}) // for cast to Comparable
    static int compareComparables(Class<?> kc, Object k, Object x) {
        return (x == null || x.getClass() != kc ? 0 :
                ((Comparable)k).compareTo(x));
    }

    // 返回大于输入参数且最近的2的整数次幂的数, 比如: cap=10，则返回16
    // Returns a power of two size for the given target capacity
    static final int tableSizeFor(int cap) {
        int n = -1 >>> Integer.numberOfLeadingZeros(cap - 1);
        return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
    }

    /* ---------------- 属性(Fields) -------------- */

    // 存储数据的Node数组，长度是2的幂
    // HashMap是采用拉链法实现的，每一个Node本质上是一个单向链表
    transient Node<K,V>[] table;

    // 保存缓存的EntrySet()
    // Holds cached entrySet(). Note that AbstractMap fields are used for keySet() and values()
    transient Set<Map.Entry<K,V>> entrySet;

    // HashMap的大小，它是HashMap保存的键值对的数量
    transient int size;

    // HashMap被改变的次数, 实现fail-fast机制
    transient int modCount;

    // HashMap的阈值，用于判断是否需要调整HashMap的容量（threshold = 容量*加载因子）
    int threshold;

    // 加载因子实际大小
    final float loadFactor;

    /* ---------------- 公共操作方法(Public operations) -------------- */

    // 指定“容量大小”和“加载因子”的构造函数
    public HashMap(int initialCapacity, float loadFactor) {
        if (initialCapacity < 0)
            throw new IllegalArgumentException("Illegal initial capacity: " +
                                               initialCapacity);
        // HashMap的最大容量只能是MAXIMUM_CAPACITY(2^30)
        if (initialCapacity > MAXIMUM_CAPACITY)
            initialCapacity = MAXIMUM_CAPACITY;
        if (loadFactor <= 0 || Float.isNaN(loadFactor))
            throw new IllegalArgumentException("Illegal load factor: " +
                                               loadFactor);
        this.loadFactor = loadFactor;
        // 找出“大于initialCapacity”的最小的2的幂
        // 设置HashMap阈值, 当HashMap中存储数据的数量达到threshold时，就需要将HashMap的容量加倍
        this.threshold = tableSizeFor(initialCapacity);
    }

    // 指定“容量大小”的构造函数, 加载因子为默认的0.75
    // Constructs an empty {@code HashMap} with the specified initial capacity and the default load factor (0.75).
    public HashMap(int initialCapacity) {
        this(initialCapacity, DEFAULT_LOAD_FACTOR);
    }

    // 默认构造函数, 默认容量大小为16, 加载因子为默认的0.75
    public HashMap() {
        this.loadFactor = DEFAULT_LOAD_FACTOR; // 0.75f
    }

    // 包含“子Map”的构造函数, 加载因子为默认的0.75
    public HashMap(Map<? extends K, ? extends V> m) {
        this.loadFactor = DEFAULT_LOAD_FACTOR;
        // 将m中的全部元素逐个添加到HashMap中
        putMapEntries(m, false);
    }

    // 实现Map.putAll()方法和Map构造函数
    // Implements Map.putAll and Map constructor
    final void putMapEntries(Map<? extends K, ? extends V> m, boolean evict) {
        int s = m.size();
        if (s > 0) {
            // 初始table为null
            if (table == null) { // pre-size
                // 用负载参数进行计算
                float ft = ((float)s / loadFactor) + 1.0F;
                // 与最大容量作比较 返回对应的int类型值
                int t = ((ft < (float)MAXIMUM_CAPACITY) ?
                         (int)ft : MAXIMUM_CAPACITY);
                // The next size value at which to resize (capacity * load factor)
                if (t > threshold)
                    threshold = tableSizeFor(t);
            }
            // 扩容
            else if (s > threshold)
                resize();
            // 插入处理
            for (Map.Entry<? extends K, ? extends V> e : m.entrySet()) {
                K key = e.getKey();
                V value = e.getValue();
                putVal(hash(key), key, value, false, evict);
            }
        }
    }

    // 返回map中的k-v对数量(即map中存储的k-v元素个数)
    public int size() {
        return size;
    }

    // map是否为空
    public boolean isEmpty() {
        return size == 0;
    }

    // 获取key对应的value
    public V get(Object key) {
        Node<K,V> e;
        return (e = getNode(hash(key), key)) == null ? null : e.value;
    }

    // Map.get()和其他相关方法的真正实现方法
    // Implements Map.get and related methods
    final Node<K,V> getNode(int hash, Object key) {
        // 声明节点数组对象、链表的第一个节点对象、循环遍历时的当前节点对象、数组长度、节点的键对象
        Node<K,V>[] tab; Node<K,V> first, e; int n; K k;
            // 节点数组赋值、数组长度赋值、通过位运算得到求模结果确定链表的首节点
        if ((tab = table) != null && (n = tab.length) > 0 &&
            (first = tab[(n - 1) & hash]) != null) {
            // 首先比对首节点，如果首节点的hash值和key的hash值相同 并且 首节点的键对象和key相同（地址相同或equals相等），则返回该节点
            if (first.hash == hash && 
                ((k = first.key) == key || (key != null && key.equals(k))))
                return first; // 返回首节点
            // 如果首节点比对不相同、那么看看是否存在下一个节点，如果存在的话，可以继续比对，如果不存在就意味着key没有匹配的键值对
            if ((e = first.next) != null) {
                // 如果存在下一个节点 e，那么先看看这个首节点是否是个树节点
                if (first instanceof TreeNode)
                    // 如果是首节点是树节点，那么遍历树来查找
                    return ((TreeNode<K,V>)first).getTreeNode(hash, key);
                do {
                    // 如果首节点不是树节点，就说明还是个普通的链表，那么逐个遍历比对即可
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        return e; // 如果当前节点e的键对象和key相同，那么返回e
                } while ((e = e.next) != null); // 看看是否还有下一个节点，如果有，继续下一轮比对，否则跳出循环
            }
        }
        // 在比对完了应该比对的树节点 或者全部的链表节点 都没能匹配到key，那么就返回null
        return null;
    }

    // HashMap是否包含key
    // 判断方法为: 通过key寻找value, 当value不为null时返回true
    public boolean containsKey(Object key) {
        return getNode(hash(key), key) != null;
    }

    // 将“key-newValue”添加到HashMap中
    // 如果之前存在key对应的oldValue, 则返回oldValue
    public V put(K key, V value) {
        return putVal(hash(key), key, value, false, true);
    }

    /**
     * Map.put()等相关方法的实际实现
     * Implements Map.put and related methods
     *
     * @param hash key的hash值
     * @param key
     * @param value 新的value值
     * @param onlyIfAbsent 如果为true, 则不修改存在的oldValue
     * @param evict 如果为false，则表处于创建模式
     * @return oldValue或者返回空
     */
    final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
        Node<K,V>[] tab; Node<K,V> p; int n, i;
        // 如果存储元素的table为空，则进行必要字段的初始化
        if ((tab = table) == null || (n = tab.length) == 0)
            n = (tab = resize()).length; // 获取长度（16）
         // 如果根据hash值获取的结点为空，则新建一个结点
        if ((p = tab[i = (n - 1) & hash]) == null)
            tab[i] = newNode(hash, key, value, null);
        else {
            Node<K,V> e; K k;
            // 如果新插入的结点和table中p结点的hash值，key值相同的话
            if (p.hash == hash &&
                ((k = p.key) == key || (key != null && key.equals(k))))
                e = p;
            // 如果是红黑树结点的话，进行红黑树插入
            else if (p instanceof TreeNode)
                e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
            else {
                for (int binCount = 0; ; ++binCount) {
                    // 代表这个单链表只有一个头部结点，则直接新建一个结点即可
                    if ((e = p.next) == null) {
                        p.next = newNode(hash, key, value, null);
                        // 链表长度大于8时，将链表转红黑树
                        if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                            treeifyBin(tab, hash);
                        break;
                    }
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        break;
                    // 及时更新p
                    p = e;
                }
            }
            // 如果存在这个映射就覆盖
            if (e != null) { // existing mapping for key
                V oldValue = e.value;
                // 判断是否允许覆盖，并且value是否为空
                if (!onlyIfAbsent || oldValue == null)
                    e.value = value;
                afterNodeAccess(e); // 回调以允许LinkedHashMap后置操作
                return oldValue;
            }
        }
        ++modCount; // 更改操作次数, 实现fail-fast机制
        if (++size > threshold) // 大于临界值
            // 将数组大小设置为原来的2倍，并将原先的数组中的元素放到新数组中
            // 因为有链表，红黑树之类，因此还要调整他们
            resize();
        // 回调以允许LinkedHashMap后置操作
        afterNodeInsertion(evict); 
        return null;
    }

    /**
    * 初始化或者扩容之后元素调整
    * 如果为空，则根据字段阈值中保留的初始容量目标进行分配(16)
    * 否则，因为我们使用的是两次幂扩展
    * 所以每个bin中的元素必须保持在同一指数(2的次方)中, 或在新表中以两的次方的偏移进行移动
    *
     * Initializes or doubles table size.  If null, allocates in
     * accord with initial capacity target held in field threshold.
     * Otherwise, because we are using power-of-two expansion, the
     * elements from each bin must either stay at same index, or move
     * with a power of two offset in the new table.
     *
     * @return the table
     */
    final Node<K,V>[] resize() {
        // 获取旧元素数组的各种信息
        Node<K,V>[] oldTab = table;
        // 旧表容量
        int oldCap = (oldTab == null) ? 0 : oldTab.length;
        // 旧表扩容的临界值
        int oldThr = threshold;
        // 定义新数组的长度及扩容的临界值
        int newCap, newThr = 0;
        if (oldCap > 0) {  // 如果原table不为空
            if (oldCap >= MAXIMUM_CAPACITY) { 
                // 如果数组长度达到最大值，则修改临界值为Integer.MAX_VALUE
                threshold = Integer.MAX_VALUE;   
                return oldTab;
            }
            // 下面就是扩容操作（2倍）
            else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY &&
                     oldCap >= DEFAULT_INITIAL_CAPACITY)
                newThr = oldThr << 1; // threshold也变为二倍
        }
        else if (oldThr > 0) // initial capacity was placed in threshold
            newCap = oldThr;
        else {               // threshold为0，则使用默认值
            newCap = DEFAULT_INITIAL_CAPACITY;
            newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
        }
        if (newThr == 0) { // 如果临界值也为0，则设置临界值
            float ft = (float)newCap * loadFactor;
            newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ?
                      (int)ft : Integer.MAX_VALUE);
        }
        threshold = newThr; // 更新填充因子
        @SuppressWarnings({"rawtypes","unchecked"})
        Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
        table = newTab;
        if (oldTab != null) { // 调整数组大小之后，需要调整红黑树或者链表的指向
            for (int j = 0; j < oldCap; ++j) {
                Node<K,V> e;
                if ((e = oldTab[j]) != null) {
                    oldTab[j] = null;
                    if (e.next == null)
                        newTab[e.hash & (newCap - 1)] = e;
                    else if (e instanceof TreeNode) // 红黑树调整
                        ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                    else { // preserve order
                        // 链表调整
                        Node<K,V> loHead = null, loTail = null;
                        Node<K,V> hiHead = null, hiTail = null;
                        Node<K,V> next;
                        do {
                            next = e.next;
                            if ((e.hash & oldCap) == 0) {
                                if (loTail == null)
                                    loHead = e;
                                else
                                    loTail.next = e;
                                loTail = e;
                            }
                            else {
                                if (hiTail == null)
                                    hiHead = e;
                                else
                                    hiTail.next = e;
                                hiTail = e;
                            }
                        } while ((e = next) != null);
                        if (loTail != null) {
                            loTail.next = null;
                            newTab[j] = loHead;
                        }
                        if (hiTail != null) {
                            hiTail.next = null;
                            newTab[j + oldCap] = hiHead;
                        }
                    }
                }
            }
        }
        return newTab;
    }

    /**
    * 把容器里的元素变成树结构
    * 替换给定哈希的索引处bin中的所有链接节点
    * 但如果表太小，在这种情况下将改为调整大小
    *
     * Replaces all linked nodes in bin at index for given hash unless
     * table is too small, in which case resizes instead.
     */
    final void treeifyBin(Node<K,V>[] tab, int hash) {
        int n, index; Node<K,V> e;
        /*
     * 如果元素数组为空 或者 数组长度小于 树结构化的最小限制
     * MIN_TREEIFY_CAPACITY 默认值64，对于这个值可以理解为：如果元素数组长度小于这个值，没有必要去进行结构转换
     * 当一个数组位置上集中了多个键值对，那是因为这些key的hash值和数组长度取模之后结果相同。（并不是因为这些key的hash值相同）
     * 因为hash值相同的概率不高，所以可以通过扩容的方式，来使得最终这些key的hash值在和新的数组长度取模之后，拆分到多个数组位置上
     */
        if (tab == null || (n = tab.length) < MIN_TREEIFY_CAPACITY)
            resize(); // 扩容
        
    	// 如果元素数组长度已经大于等于了 MIN_TREEIFY_CAPACITY，那么就有必要进行结构转换了
        // 根据hash值和数组长度进行取模运算后，得到链表的首节点
        else if ((e = tab[index = (n - 1) & hash]) != null) {
            TreeNode<K,V> hd = null, tl = null; // 定义红黑树的首、尾节点
            do {
                // 将该节点转换为 树节点
                TreeNode<K,V> p = replacementTreeNode(e, null);
                if (tl == null) // 如果尾节点为空，说明还没有根节点
                    hd = p; // 首节点（根节点）指向 当前节点
                else  // 尾节点不为空，以下两行是一个双向链表结构
                    p.prev = tl; // 当前树节点的 前一个节点指向 尾节点
                    tl.next = p; // 尾节点的 后一个节点指向 当前节点
                }
                tl = p; // 把当前节点设为尾节点
            } while ((e = e.next) != null);

            // 到目前为止 也只是把Node对象转换成了TreeNode对象，把单向链表转换成了双向链表
        
            // 把转换后的双向链表，替换原来位置上的单向链表
            if ((tab[index] = hd) != null)
                // 此处才是真正的转为红黑树
                hd.treeify(tab);
        }
    }

    // 将“m”中的全部元素都添加到HashMap中
    public void putAll(Map<? extends K, ? extends V> m) {
        putMapEntries(m, true);
    }

    // 删除“键为key”元素
    public V remove(Object key) {
        Node<K,V> e;
        return (e = removeNode(hash(key), key, null, false, true)) == null ?
            null : e.value;
    }

    /**
     * 从Map中删除节点(Map.remove和其他相关方法)的真正实现方法
     * Implements Map.remove and related methods
     *
     * @param hash key的hash值
     * @param key
     * @param value 当matchValue为true时, 当且仅当value也相同时才移除
     * @param matchValue 当matchValue为true时, 当且仅当value也相同时才移除
     * @param movable 当为false, 在删除节点时不移动其他节点
     * @return the node, or null if none
     */
    final Node<K,V> removeNode(int hash, Object key, Object value,
                               boolean matchValue, boolean movable) {
        // 定义节点数组tab用于指向table、节点p、数组长度n、hash所映射的数组下标
        Node<K,V>[] tab; Node<K,V> p; int n, index;
        // 节点数组在hash位置处的节点不为空,若为空则直接返回null(不存在可删除元素)
        if ((tab = table) != null && (n = tab.length) > 0 &&
            (p = tab[index = (n - 1) & hash]) != null) {
            // 定义局部节点变量node存储需要删除的元素、循环变量e、key、value
            Node<K,V> node = null, e; K k; V v;
            if (p.hash == hash &&
                ((k = p.key) == key || (key != null && key.equals(k))))
                // 头结点即为需要删除的节点
                node = p;
            // 链表还存在其他元素,并将e指向头结点的后继元
            else if ((e = p.next) != null) {
                if (p instanceof TreeNode) // 该链表是一个红黑树结构
                    node = ((TreeNode<K,V>)p).getTreeNode(hash, key); // 在红黑树中查询指定hash、key的节点并返回
                else { // 链表是一个单向链表
                    do {
                        if (e.hash == hash &&
                            ((k = e.key) == key ||
                             (key != null && key.equals(k)))) {
                            node = e; // 节点e是需要移除的节点,结束循环
                            break;
                        }
                        p = e; // 循环结束时,节点p为目标节点的前驱元
                    } while ((e = e.next) != null);
                }
            }
            // 存在需要移除的节点且值匹配删除为false或者不为false且值匹配
            if (node != null && (!matchValue || (v = node.value) == value ||
                                 (value != null && value.equals(v)))) { 
                if (node instanceof TreeNode) // node为树形节点,使用treeNode的移除方法
                    ((TreeNode<K,V>)node).removeTreeNode(this, tab, movable);
                else if (node == p) // 若node为头结点,直接将node 的后继元作为新的头结点
                    tab[index] = node.next;
                else // 是链表结构且不为头结点,此时将目标节点的前驱元的后继元指向目标节点的后继元
                    p.next = node.next;
                ++modCount;
                --size;
                afterNodeRemoval(node);
                return node;
            }
        }
        return null;
    }

    // 清空HashMap，将所有的元素设为null
    public void clear() {
        Node<K,V>[] tab;
        modCount++;
        if ((tab = table) != null && size > 0) {
            size = 0;
            for (int i = 0; i < tab.length; ++i)
                tab[i] = null;
        }
    }

    // 是否包含“值为value”的元素
    public boolean containsValue(Object value) {
        Node<K,V>[] tab; V v;
        if ((tab = table) != null && size > 0) { // table不为空
            for (Node<K,V> e : tab) {
                for (; e != null; e = e.next) {
                    // 此处若传参value为null, 而map中对应value为null也会返回true(null == null为true)
                    if ((v = e.value) == value || 
                        (value != null && value.equals(v)))
                        return true;
                }
            }
        }
        return false;
    }

    /**
    * 返回此映射中包含的键的{@link Set}"视图", 返回值是内部类KeySet类型(AbstractSet的实现类)
    * 集合由映射支持，因此对映射的更改将反映在集合中，反之亦然!(因为返回的是指向同一个内部对象的引用!)
    * 如果在对keySet()集合进行迭代时(其他线程)修改了映射（通过迭代器自己的{@code remove}操作除外），则迭代的结果是不确定的
    * 集合支持通过{@code Iterator.remove}、{@code set.remove}、{@code removeAll}、{@code retainal}和{@code clear}操作从映射中移除相应映射的元素(k-v对)
    * 但是它不支持{@code add}或{@code addAll}操作
    *
     * Returns a {@link Set} view of the keys contained in this map.
     * The set is backed by the map, so changes to the map are
     * reflected in the set, and vice-versa.  If the map is modified
     * while an iteration over the set is in progress (except through
     * the iterator's own {@code remove} operation), the results of
     * the iteration are undefined.  The set supports element removal,
     * which removes the corresponding mapping from the map, via the
     * {@code Iterator.remove}, {@code Set.remove},
     * {@code removeAll}, {@code retainAll}, and {@code clear}
     * operations.  It does not support the {@code add} or {@code addAll}
     * operations.
     *
     * @return a set view of the keys contained in this map
     */
    public Set<K> keySet() {
        Set<K> ks = keySet; 
        if (ks == null) { // 如果map尚未初始化(此时为null), 则帮助初始化
            ks = new KeySet();
            keySet = ks;
        }
        return ks;
    }

    // Key对应的集合
    // KeySet继承于AbstractSet，说明该集合中没有重复的Key
    final class KeySet extends AbstractSet<K> {
        public final int size()                 { return size; }
        // 注意会删除原map中的所有元素!
        public final void clear()               { HashMap.this.clear(); } 
        // 返回一个迭代器, 具体实现是内部类KeyIterator[继承了内部抽象类HashIterator, 并实现了Iterator接口]
        public final Iterator<K> iterator()     { return new KeyIterator(); }
        public final boolean contains(Object o) { return containsKey(o); }
        public final boolean remove(Object key) {
            return removeNode(hash(key), key, null, false, true) != null;
        }
        // 返回一个Spliterator, 具体实现是内部类KeySpliterator[继承了内部类HashMapSpliterator, 并实现了Spliterator接口]
        public final Spliterator<K> spliterator() {
            return new KeySpliterator<>(HashMap.this, 0, -1, 0, 0);
        }
        // JDK 8后加入的遍历方法, 传入一个Lambda表达式(函数), 遍历将所有对象作用这个函数
        public final void forEach(Consumer<? super K> action) {
            Node<K,V>[] tab;
            if (action == null)
                throw new NullPointerException();
            if (size > 0 && (tab = table) != null) {
                int mc = modCount;
                for (Node<K,V> e : tab) {
                    for (; e != null; e = e.next)
                        action.accept(e.key);
                }
                if (modCount != mc)
                    throw new ConcurrentModificationException();
            }
        }
    }

    /**
    * 返回此映射中包含的值的{@link Collection}"视图"
    * 集合由映射支持，因此对映射的更改将反映在集合中，反之亦然!(因为返回的是指向同一个内部对象的引用!)
    * 如果在对values()集合进行迭代时(其他线程)修改了映射（通过迭代器自己的{@code remove}操作除外），则迭代的结果是不确定的
    * 集合支持通过{@code Iterator.remove}、{@code set.remove}、{@code removeAll}、{@code retainal}和{@code clear}操作从映射中移除相应映射的元素(k-v对)
    * 但是它不支持{@code add}或{@code addAll}操作
    *
     * Returns a {@link Collection} view of the values contained in this map.
     * The collection is backed by the map, so changes to the map are
     * reflected in the collection, and vice-versa.  If the map is
     * modified while an iteration over the collection is in progress
     * (except through the iterator's own {@code remove} operation),
     * the results of the iteration are undefined.  The collection
     * supports element removal, which removes the corresponding
     * mapping from the map, via the {@code Iterator.remove},
     * {@code Collection.remove}, {@code removeAll},
     * {@code retainAll} and {@code clear} operations.  It does not
     * support the {@code add} or {@code addAll} operations.
     *
     * @return a view of the values contained in this map
     */
    public Collection<V> values() {
        Collection<V> vs = values;
        if (vs == null) { // 如果map尚未初始化(此时为null), 则帮助初始化
            vs = new Values();
            values = vs;
        }
        return vs;
    } 

    // value集合
    // Values继承于AbstractCollection，不同于“KeySet继承于AbstractSet”，
    // Values中的元素能够重复, 因为不同的key可以指向相同的value
    final class Values extends AbstractCollection<V> {
        public final int size()                 { return size; }
        // 注意会删除原map中的所有元素!
        public final void clear()               { HashMap.this.clear(); }
        // 返回一个迭代器, 具体内部实现是内部类ValueIterator[继承自HashIterator, 并实现了Iterator接口]
        public final Iterator<V> iterator()     { return new ValueIterator(); }
        public final boolean contains(Object o) { return containsValue(o); }
        // 返回一个Spliterator, 具体实现是内部类ValueSpliterator[继承了内部类HashMapSpliterator, 并实现了Spliterator接口]
        public final Spliterator<V> spliterator() {
            return new ValueSpliterator<>(HashMap.this, 0, -1, 0, 0);
        }
        public final void forEach(Consumer<? super V> action) {
            Node<K,V>[] tab;
            if (action == null)
                throw new NullPointerException();
            if (size > 0 && (tab = table) != null) {
                int mc = modCount;
                for (Node<K,V> e : tab) {
                    for (; e != null; e = e.next)
                        action.accept(e.value);
                }
                if (modCount != mc)
                    throw new ConcurrentModificationException();
            }
        }
    }

    /**
    * 返回此映射中包含的映射的{@link Set}"视图"
    * 集合由映射支持，因此对映射的更改将反映在集合中，反之亦然!(因为返回的是指向同一个内部对象的引用!)
    * 如果在对values()集合进行迭代时(其他线程)修改了映射（通过迭代器自己的{@code remove}操作除外），则迭代的结果是不确定的
    * 集合支持通过{@code Iterator.remove}、{@code set.remove}、{@code removeAll}、{@code retainal}和{@code clear}操作从映射中移除相应映射的元素(k-v对)
    * 但是它不支持{@code add}或{@code addAll}操作
     */
    public Set<Map.Entry<K,V>> entrySet() {
        Set<Map.Entry<K,V>> es;
        return (es = entrySet) == null ? (entrySet = new EntrySet()) : es;
    }

    // EntrySet对应的集合
    // EntrySet继承于AbstractSet，说明该集合中没有重复的EntrySet
    final class EntrySet extends AbstractSet<Map.Entry<K,V>> {
        public final int size()                 { return size; }
        // 注意会删除原map中的所有元素!
        public final void clear()               { HashMap.this.clear(); }
        // 返回一个迭代器, 具体实现是内部类EntryIterator[继承了内部抽象类HashIterator, 并实现了Iterator接口]
        public final Iterator<Map.Entry<K,V>> iterator() { return new EntryIterator(); }
        
        // 这个EntrySet中是否存在某个Entry(对象o)
        public final boolean contains(Object o) {
            if (!(o instanceof Map.Entry))
                return false;
            Map.Entry<?,?> e = (Map.Entry<?,?>) o;
            Object key = e.getKey();
            Node<K,V> candidate = getNode(hash(key), key);
            return candidate != null && candidate.equals(e);
        }
        
        // 同时在EntrySet和map对象中移除Entryo
        public final boolean remove(Object o) {
            if (o instanceof Map.Entry) {
                Map.Entry<?,?> e = (Map.Entry<?,?>) o;
                Object key = e.getKey();
                Object value = e.getValue();
                // 其实还是根据key寻找k-v, 然后删除
                return removeNode(hash(key), key, value, true, true) != null;
            }
            return false;
        }
        
        // 返回一个Spliterator, 具体实现是内部类EntrySpliterator[继承了内部类HashMapSpliterator, 并实现了Spliterator接口]
        public final Spliterator<Map.Entry<K,V>> spliterator() {
            return new EntrySpliterator<>(HashMap.this, 0, -1, 0, 0);
        }
        public final void forEach(Consumer<? super Map.Entry<K,V>> action) {
            Node<K,V>[] tab;
            if (action == null)
                throw new NullPointerException();
            if (size > 0 && (tab = table) != null) {
                int mc = modCount;
                for (Node<K,V> e : tab) {
                    for (; e != null; e = e.next)
                        action.accept(e);
                }
                if (modCount != mc)
                    throw new ConcurrentModificationException();
            }
        }
    }

    /* 重写了JDK8中 Map接口中添加的方法(Overrides of JDK8 Map extension methods) */

    // 在Map中寻找key, 如果存在key且key对应的value不为null则返回value, 否则返回defaultValue
    // 使用内部的getNode()方法进行优化
    @Override
    public V getOrDefault(Object key, V defaultValue) {
        Node<K,V> e;
        return (e = getNode(hash(key), key)) == null ? defaultValue : e.value;
    }

    // 当不存在key或者key中存放的是null值时, 加入(k, v)对
    // 使用内部的putVal()方法进行优化
    @Override
    public V putIfAbsent(K key, V value) {
        return putVal(hash(key), key, value, true, true);
    }

    // 若存在与传参相同的(k, v)对则移除
    // 使用内部的removeNode()方法优化
    @Override
    public boolean remove(Object key, Object value) {
        return removeNode(hash(key), key, value, true, true) != null;
    }

    // 若存在与传参相同的(k, v)对则替换newValue
    @Override
    public boolean replace(K key, V oldValue, V newValue) {
        Node<K,V> e; V v;
        if ((e = getNode(hash(key), key)) != null &&
            ((v = e.value) == oldValue || (v != null && v.equals(oldValue)))) {
            e.value = newValue;
            afterNodeAccess(e);
            return true;
        }
        return false;
    }

    // 如果存在key则替换, 否则添加(k, v)对, 并返回添加的value
    @Override
    public V replace(K key, V value) {
        Node<K,V> e;
        if ((e = getNode(hash(key), key)) != null) {
            V oldValue = e.value;
            e.value = value;
            afterNodeAccess(e);
            return oldValue;
        }
        return null;
    }

    /**
     * 如果传给该方法的key参数在Map中对应的value为null，则使用mappingFunction"根据key计算"一个新的结果
     * 如果计算结果不为null，则用计算结果覆盖原有value(如果原Map原来不包含该key，那么该方法会添加一组key-value对)
     * 在计算时如果其他线程并发修改了map中的内容, 将会触发fail-fast机制, 抛出ConcurrentModificationException
     *
     * <p>This method will, on a best-effort basis, throw a
     * {@link ConcurrentModificationException} if it is detected that the
     * mapping function modifies this map during computation.
     */
    @Override
    public V computeIfAbsent(K key,
                             Function<? super K, ? extends V> mappingFunction) {
        if (mappingFunction == null)
            throw new NullPointerException();
        int hash = hash(key);
        Node<K,V>[] tab; Node<K,V> first; int n, i;
        int binCount = 0;
        TreeNode<K,V> t = null;
        Node<K,V> old = null;
        if (size > threshold || (tab = table) == null ||
            (n = tab.length) == 0)
            n = (tab = resize()).length;
        if ((first = tab[i = (n - 1) & hash]) != null) {
            if (first instanceof TreeNode)
                old = (t = (TreeNode<K,V>)first).getTreeNode(hash, key);
            else {
                Node<K,V> e = first; K k;
                do {
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k)))) {
                        old = e;
                        break;
                    }
                    ++binCount;
                } while ((e = e.next) != null);
            }
            V oldValue;
            if (old != null && (oldValue = old.value) != null) {
                afterNodeAccess(old);
                return oldValue;
            }
        }
        int mc = modCount;
        V v = mappingFunction.apply(key);
        if (mc != modCount) { throw new ConcurrentModificationException(); }
        if (v == null) {
            return null;
        } else if (old != null) {
            old.value = v;
            afterNodeAccess(old);
            return v;
        }
        else if (t != null)
            t.putTreeVal(this, tab, hash, key, v);
        else {
            tab[i] = newNode(hash, key, v, first);
            if (binCount >= TREEIFY_THRESHOLD - 1)
                treeifyBin(tab, hash);
        }
        modCount = mc + 1;
        ++size;
        afterNodeInsertion(true); // 回调以允许LinkedHashMap后置操作
        return v;
    }

    // 该方法使用remappingFunction"根据原key-value对计算"一个新的value
    // 只要新value不为null，就使用新value覆盖原value；
    // 如果原value不为null,但新value为null，则删除原key-value对;
    // 如果原value、新value同时为null，那么该方法不改变任何key-value对，直接返回null
	// 在计算时如果其他线程并发修改了map中的内容, 将会触发fail-fast
    @Override
    public V computeIfPresent(K key,
                              BiFunction<? super K, ? super V, ? extends V> remappingFunction) {
        if (remappingFunction == null)
            throw new NullPointerException();
        Node<K,V> e; V oldValue;
        int hash = hash(key);
        if ((e = getNode(hash, key)) != null &&
            (oldValue = e.value) != null) {
            int mc = modCount;
            V v = remappingFunction.apply(key, oldValue);
            if (mc != modCount) { throw new ConcurrentModificationException(); }
            if (v != null) {
                e.value = v;
                afterNodeAccess(e);
                return v;
            }
            else
                removeNode(hash, key, null, false, true);
        }
        return null;
    }

    // 使用remappingFunction根据原key-value对计算一个新的value
    // 只要新value不为null，就使用新value覆盖原value；
    // 如果原value不为null, 但新value为null，则删除原key-value对;
    // 如果原value、新value同时为null，那么该方法不改变任何key-value对，直接返回null
    // 在计算时如果其他线程并发修改了map中的内容, 将会触发fail-fast
    @Override
    public V compute(K key,
                     BiFunction<? super K, ? super V, ? extends V> remappingFunction) {
        if (remappingFunction == null)
            throw new NullPointerException();
        int hash = hash(key);
        Node<K,V>[] tab; Node<K,V> first; int n, i;
        int binCount = 0;
        TreeNode<K,V> t = null;
        Node<K,V> old = null;
        if (size > threshold || (tab = table) == null ||
            (n = tab.length) == 0)
            n = (tab = resize()).length;
        if ((first = tab[i = (n - 1) & hash]) != null) {
            if (first instanceof TreeNode)
                old = (t = (TreeNode<K,V>)first).getTreeNode(hash, key);
            else {
                Node<K,V> e = first; K k;
                do {
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k)))) {
                        old = e;
                        break;
                    }
                    ++binCount;
                } while ((e = e.next) != null);
            }
        }
        V oldValue = (old == null) ? null : old.value;
        int mc = modCount;
        V v = remappingFunction.apply(key, oldValue);
        if (mc != modCount) { throw new ConcurrentModificationException(); }
        if (old != null) {
            if (v != null) {
                old.value = v;
                afterNodeAccess(old);
            }
            else
                removeNode(hash, key, null, false, true);
        }
        else if (v != null) {
            if (t != null)
                t.putTreeVal(this, tab, hash, key, v);
            else {
                tab[i] = newNode(hash, key, v, first);
                if (binCount >= TREEIFY_THRESHOLD - 1)
                    treeifyBin(tab, hash);
            }
            modCount = mc + 1;
            ++size;
            afterNodeInsertion(true); // 回调以允许LinkedHashMap后置操作
        }
        return v;
    }

    // 先根据Key参数获取该Map中对应的value:
    // 如果获得value为null，则直接用传入的value覆盖原有的value(在这中情况下，添加一组key-value对)；
    // 如果获取的value不为null, 则使用remappingFunction 函数根据原value、新value计算一新的结果，并用得到的结果去覆盖原有的value
    // 在计算时如果其他线程并发修改了map中的内容, 将会触发fail-fast
    @Override
    public V merge(K key, V value,
                   BiFunction<? super V, ? super V, ? extends V> remappingFunction) {
        if (value == null)
            throw new NullPointerException();
        if (remappingFunction == null)
            throw new NullPointerException();
        int hash = hash(key);
        Node<K,V>[] tab; Node<K,V> first; int n, i;
        int binCount = 0;
        TreeNode<K,V> t = null;
        Node<K,V> old = null;
        if (size > threshold || (tab = table) == null ||
            (n = tab.length) == 0)
            n = (tab = resize()).length;
        if ((first = tab[i = (n - 1) & hash]) != null) {
            if (first instanceof TreeNode)
                old = (t = (TreeNode<K,V>)first).getTreeNode(hash, key);
            else {
                Node<K,V> e = first; K k;
                do {
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k)))) {
                        old = e;
                        break;
                    }
                    ++binCount;
                } while ((e = e.next) != null);
            }
        }
        if (old != null) {
            V v;
            if (old.value != null) {
                int mc = modCount;
                v = remappingFunction.apply(old.value, value);
                if (mc != modCount) {
                    throw new ConcurrentModificationException();
                }
            } else {
                v = value;
            }
            if (v != null) {
                old.value = v;
                afterNodeAccess(old);
            }
            else
                removeNode(hash, key, null, false, true);
            return v;
        }
        if (value != null) {
            if (t != null)
                t.putTreeVal(this, tab, hash, key, value);
            else {
                tab[i] = newNode(hash, key, value, first);
                if (binCount >= TREEIFY_THRESHOLD - 1)
                    treeifyBin(tab, hash);
            }
            ++modCount;
            ++size;
            afterNodeInsertion(true); // 回调以允许LinkedHashMap后置操作
        }
        return value;
    }

	// 通过传入BiConsumer(Lambda表达式)遍历对Map进行操作
    @Override
    public void forEach(BiConsumer<? super K, ? super V> action) {
        Node<K,V>[] tab;
        if (action == null)
            throw new NullPointerException();
        if (size > 0 && (tab = table) != null) {
            int mc = modCount;
            for (Node<K,V> e : tab) {
                for (; e != null; e = e.next)
                    action.accept(e.key, e.value);
            }
            if (modCount != mc)
                throw new ConcurrentModificationException();
        }
    }

	// 根据重写方法逻辑进行重新赋值
    @Override
    public void replaceAll(BiFunction<? super K, ? super V, ? extends V> function) {
        Node<K,V>[] tab;
        if (function == null)
            throw new NullPointerException();
        if (size > 0 && (tab = table) != null) {
            int mc = modCount;
            for (Node<K,V> e : tab) {
                for (; e != null; e = e.next) {
                    e.value = function.apply(e.key, e.value);
                }
            }
            if (modCount != mc)
                throw new ConcurrentModificationException();
        }
    }

    /* ------------------------------------------------------------ */
    /* 克隆和序列化操作(Cloning and serialization) */

    /**
     * 返回一个当前HashMap对象的浅复制，并返回"Object对象": 
     * 内部的key和value都没有被克隆!(即直接传入的是引用)
     *
     * Returns a shallow copy of this {@code HashMap} instance: the keys and
     * values themselves are not cloned.
     */
    @SuppressWarnings("unchecked")
    @Override
    public Object clone() {
        HashMap<K,V> result;
        try {
            result = (HashMap<K,V>)super.clone();
        } catch (CloneNotSupportedException e) {
            // this shouldn't happen, since we are Cloneable
            throw new InternalError(e);
        }
        // 将全部属性初始化为0或者null
        result.reinitialize();
        // 将所有元素放入新的(克隆的)map中[同构造方法, 放入的是引用]
        result.putMapEntries(this, false);
        return result;
    }

	// 返回加载因数
    // 序列化HashSet时也使用了这个方法(These methods are also used when serializing HashSets)
    final float loadFactor() { return loadFactor; }

	// 返回当前map的总容量(不是元素个数)
	// 序列化HashSet时也使用了这个方法
    final int capacity() {
        return (table != null) ? table.length :
            (threshold > 0) ? threshold :
            DEFAULT_INITIAL_CAPACITY;
    }

    // 序列化方法
    // 将HashMap的“总的容量，实际容量，所有的Entry”都写入到输出流中
    private void writeObject(java.io.ObjectOutputStream s)
        throws IOException {
        int buckets = capacity();
        // Write out the threshold, loadfactor, and any hidden stuff
        s.defaultWriteObject();
        
        // Write out number of buckets
        s.writeInt(buckets);
        
        // Write out size (number of Mappings)
        s.writeInt(size);
        
        // Write out keys and values (alternating)
        internalWriteEntries(s);
    }

    // 反序列化方法
    // 将HashMap的“总的容量，实际容量，所有的Entry”依次读出
    private void readObject(java.io.ObjectInputStream s)
        throws IOException, ClassNotFoundException {
        // Read in the threshold (ignored), loadfactor, and any hidden stuff
        s.defaultReadObject();
        
        // 初始化对象
        reinitialize();
        if (loadFactor <= 0 || Float.isNaN(loadFactor))
            throw new InvalidObjectException("Illegal load factor: " +
                                             loadFactor);
        
        // Read and ignore number of buckets
        s.readInt();           
        // Read number of mappings (size)
        int mappings = s.readInt(); 
        if (mappings < 0)
            throw new InvalidObjectException("Illegal mappings count: " +
                                             mappings);
        else if (mappings > 0) { // (if zero, use defaults)
            
            // 设置loadFactor
            // Size the table using given load factor only if within
            // range of 0.25...4.0
            float lf = Math.min(Math.max(0.25f, loadFactor), 4.0f);
            float fc = (float)mappings / lf + 1.0f;
            
            // 设置容量
            int cap = ((fc < DEFAULT_INITIAL_CAPACITY) ?
                       DEFAULT_INITIAL_CAPACITY :
                       (fc >= MAXIMUM_CAPACITY) ?
                       MAXIMUM_CAPACITY :
                       tableSizeFor((int)fc));
            
            // 设置容量阈值
            float ft = (float)cap * lf;
            threshold = ((cap < MAXIMUM_CAPACITY && ft < MAXIMUM_CAPACITY) ?
                         (int)ft : Integer.MAX_VALUE);

            // 检查对象是否是Map.Entry[]类型
            // Check Map.Entry[].class since it's the nearest public type to what we're actually creating
            SharedSecrets.getJavaObjectInputStreamAccess().checkArray(s, Map.Entry[].class, cap);
            @SuppressWarnings({"rawtypes","unchecked"})
            Node<K,V>[] tab = (Node<K,V>[])new Node[cap];
            table = tab;

            // 读入key和value并放入map中
            // Read the keys and values, and put the mappings in the HashMap
            for (int i = 0; i < mappings; i++) {
                @SuppressWarnings("unchecked")
                    K key = (K) s.readObject();
                @SuppressWarnings("unchecked")
                    V value = (V) s.readObject();
                putVal(hash(key), key, value, false, false);
            }
        }
    }

    /* ------------------------------------------------------------ */
    /* 迭代器(iterators) */

	// HashMap中的一个内部抽象类(虽然内部没有抽象方法)
	// KeyIterator, ValueIterator和EntryIterator都继承此类
    // 用于简化其他内部迭代器类的实现
    abstract class HashIterator {
        Node<K,V> next;        // next entry to return
        Node<K,V> current;     // current entry
        int expectedModCount;  // for fast-fail
        int index;             // current slot

        // 抽象类的构造器, 供子类继承
        HashIterator() {
            expectedModCount = modCount;
            Node<K,V>[] t = table;
            current = next = null;
            index = 0;
            // 在构造器中会找到数组中第一个不是指向null的那个元素
            // 将这个元素存入next中，同时index指向这个数组元素的下一个下标
            if (t != null && size > 0) { // advance to first entry
                do {} while (index < t.length && (next = t[index++]) == null);
            }
        }

        public final boolean hasNext() {
            return next != null;
        }

        final Node<K,V> nextNode() {
            Node<K,V>[] t;
            Node<K,V> e = next;
            if (modCount != expectedModCount)
                throw new ConcurrentModificationException();
            if (e == null)
                throw new NoSuchElementException();
            // 首先查看当前“链表”是否已到结尾，若还没到，则next直接指向它的下一个”结点“；
            if ((next = (current = e).next) == null && (t = table) != null) {
                // 若已到”链表“结尾，则需要找到table数组中下一个不是指向空”链表“的那个元素
                // 使next更新为”链表“首结点，同时更新index
                do {} while (index < t.length && (next = t[index++]) == null);
            }
            return e;
        }

        public final void remove() {
            Node<K,V> p = current;
            if (p == null)
                throw new IllegalStateException();
            if (modCount != expectedModCount)
                throw new ConcurrentModificationException();
            current = null;
            removeNode(p.hash, p.key, null, false, false);
            expectedModCount = modCount;
        }
    }

	// 内部类: KeyIterator, 用于Key的迭代器的实现
    final class KeyIterator extends HashIterator
        implements Iterator<K> {
        public final K next() { return nextNode().key; }
    }

	// 内部类: ValueIterator, 用于Value的迭代器的实现
    final class ValueIterator extends HashIterator
        implements Iterator<V> {
        public final V next() { return nextNode().value; }
    }

	// 内部类: EntryIterator, 用于Entry的迭代器的实现
    final class EntryIterator extends HashIterator
        implements Iterator<Map.Entry<K,V>> {
        public final Map.Entry<K,V> next() { return nextNode(); }
    }

    /* ------------------------------------------------------------ */
    /* 切分器(spliterators) */

	// HashMap中的一个内部抽象类(虽然内部没有抽象方法)
	// KeySpliterator, ValueSpliterator和EntrySpliterator都继承此类
    // 用于简化其他内部Spliterator类的实现
    static class HashMapSpliterator<K,V> {
        final HashMap<K,V> map;
        Node<K,V> current;          // 当前节点(current node)
        int index;                  // 当前位置（包含），advance/spilt操作时会被修改(current index, modified on advance/split)
        int fence;                  // 结束位置（不包含）
        int est;                    // 预估元素个数
        int expectedModCount;       // 用于存放list的modCount, 实现fail-fast(for comodification checks)

        // 从origin -> fence范围创建一个Spliterator(Creates new spliterator covering the given range)
        HashMapSpliterator(HashMap<K,V> m, int origin,
                           int fence, int est,
                           int expectedModCount) {
            this.map = m;
            this.index = origin;
            this.fence = fence;
            this.est = est;
            this.expectedModCount = expectedModCount;
        }

        // 第一次使用时实例化结束位置
        final int getFence() { // initialize fence and size on first use
            int hi;
             // 第一次初始化时，fence才会小于0
            if ((hi = fence) < 0) {
                HashMap<K,V> m = map;
                est = m.size;
                expectedModCount = m.modCount;
                Node<K,V>[] tab = m.table;
                hi = fence = (tab == null) ? 0 : tab.length;
            }
            return hi;
        }

        // 估算大小
        public final long estimateSize() {
            getFence(); // force init
            return (long) est;
        }
    }

	// 内部类KeySpliterator: 用于Key的Spliterator实现类
    static final class KeySpliterator<K,V>
        extends HashMapSpliterator<K,V>
        implements Spliterator<K> {
        KeySpliterator(HashMap<K,V> m, int origin, int fence, int est,
                       int expectedModCount) {
            super(m, origin, fence, est, expectedModCount);
        }

        public KeySpliterator<K,V> trySplit() {
            int hi = getFence(), lo = index, mid = (lo + hi) >>> 1;
            return (lo >= mid || current != null) ? null :
                new KeySpliterator<>(map, lo, index = mid, est >>>= 1,
                                        expectedModCount);
        }

        // 顺序遍历处理所有剩下的元素
        public void forEachRemaining(Consumer<? super K> action) {
            int i, hi, mc;
            // Lambda表达式为空抛出异常
            if (action == null)
                throw new NullPointerException();
            HashMap<K,V> m = map;
            Node<K,V>[] tab = m.table;
            if ((hi = fence) < 0) {
                mc = expectedModCount = m.modCount;
                hi = fence = (tab == null) ? 0 : tab.length;
            }
            else
                mc = expectedModCount;
            if (tab != null && tab.length >= hi &&
                (i = index) >= 0 && (i < (index = hi) || current != null)) {
                Node<K,V> p = current;
                current = null;
                do {
                    if (p == null)
                        p = tab[i++];
                    else {
                        action.accept(p.key);
                        p = p.next;
                    }
                } while (p != null || i < hi);
                if (m.modCount != mc)
                    throw new ConcurrentModificationException();
            }
        }

        // 返回true时，表示可能还有元素未处理, 返回falsa时，没有剩余元素处理了
        public boolean tryAdvance(Consumer<? super K> action) {
            int hi;
            if (action == null)
                throw new NullPointerException();
            Node<K,V>[] tab = map.table;
            if (tab != null && tab.length >= (hi = getFence()) && index >= 0) {
                while (current != null || index < hi) {
                    if (current == null)
                        current = tab[index++];
                    else {
                        K k = current.key;
                        current = current.next;
                        action.accept(k);
                        if (map.modCount != expectedModCount)
                            throw new ConcurrentModificationException();
                        return true;
                    }
                }
            }
            return false;
        }

        // 返回特征值
        public int characteristics() {
            return (fence < 0 || est == map.size ? Spliterator.SIZED : 0) |
                Spliterator.DISTINCT;
        }
    }

	// 内部类ValueSpliterator: 用于Value的Spliterator实现类
    static final class ValueSpliterator<K,V>
        extends HashMapSpliterator<K,V>
        implements Spliterator<V> {
        ValueSpliterator(HashMap<K,V> m, int origin, int fence, int est,
                         int expectedModCount) {
            super(m, origin, fence, est, expectedModCount);
        }

        public ValueSpliterator<K,V> trySplit() {
            int hi = getFence(), lo = index, mid = (lo + hi) >>> 1;
            return (lo >= mid || current != null) ? null :
                new ValueSpliterator<>(map, lo, index = mid, est >>>= 1,
                                          expectedModCount);
        }

        public void forEachRemaining(Consumer<? super V> action) {
            int i, hi, mc;
            if (action == null)
                throw new NullPointerException();
            HashMap<K,V> m = map;
            Node<K,V>[] tab = m.table;
            if ((hi = fence) < 0) {
                mc = expectedModCount = m.modCount;
                hi = fence = (tab == null) ? 0 : tab.length;
            }
            else
                mc = expectedModCount;
            if (tab != null && tab.length >= hi &&
                (i = index) >= 0 && (i < (index = hi) || current != null)) {
                Node<K,V> p = current;
                current = null;
                do {
                    if (p == null)
                        p = tab[i++];
                    else {
                        action.accept(p.value);
                        p = p.next;
                    }
                } while (p != null || i < hi);
                if (m.modCount != mc)
                    throw new ConcurrentModificationException();
            }
        }

        public boolean tryAdvance(Consumer<? super V> action) {
            int hi;
            if (action == null)
                throw new NullPointerException();
            Node<K,V>[] tab = map.table;
            if (tab != null && tab.length >= (hi = getFence()) && index >= 0) {
                while (current != null || index < hi) {
                    if (current == null)
                        current = tab[index++];
                    else {
                        V v = current.value;
                        current = current.next;
                        action.accept(v);
                        if (map.modCount != expectedModCount)
                            throw new ConcurrentModificationException();
                        return true;
                    }
                }
            }
            return false;
        }

        public int characteristics() {
            return (fence < 0 || est == map.size ? Spliterator.SIZED : 0);
        }
    }

	// 内部类EntrySpliterator: 用于Entry的Spliterator实现类
    static final class EntrySpliterator<K,V>
        extends HashMapSpliterator<K,V>
        implements Spliterator<Map.Entry<K,V>> {
        EntrySpliterator(HashMap<K,V> m, int origin, int fence, int est,
                         int expectedModCount) {
            super(m, origin, fence, est, expectedModCount);
        }

        public EntrySpliterator<K,V> trySplit() {
            int hi = getFence(), lo = index, mid = (lo + hi) >>> 1;
            return (lo >= mid || current != null) ? null :
                new EntrySpliterator<>(map, lo, index = mid, est >>>= 1,
                                          expectedModCount);
        }

        public void forEachRemaining(Consumer<? super Map.Entry<K,V>> action) {
            int i, hi, mc;
            if (action == null)
                throw new NullPointerException();
            HashMap<K,V> m = map;
            Node<K,V>[] tab = m.table;
            if ((hi = fence) < 0) {
                mc = expectedModCount = m.modCount;
                hi = fence = (tab == null) ? 0 : tab.length;
            }
            else
                mc = expectedModCount;
            if (tab != null && tab.length >= hi &&
                (i = index) >= 0 && (i < (index = hi) || current != null)) {
                Node<K,V> p = current;
                current = null;
                do {
                    if (p == null)
                        p = tab[i++];
                    else {
                        action.accept(p);
                        p = p.next;
                    }
                } while (p != null || i < hi);
                if (m.modCount != mc)
                    throw new ConcurrentModificationException();
            }
        }

        public boolean tryAdvance(Consumer<? super Map.Entry<K,V>> action) {
            int hi;
            if (action == null)
                throw new NullPointerException();
            Node<K,V>[] tab = map.table;
            if (tab != null && tab.length >= (hi = getFence()) && index >= 0) {
                while (current != null || index < hi) {
                    if (current == null)
                        current = tab[index++];
                    else {
                        Node<K,V> e = current;
                        current = current.next;
                        action.accept(e);
                        if (map.modCount != expectedModCount)
                            throw new ConcurrentModificationException();
                        return true;
                    }
                }
            }
            return false;
        }

        public int characteristics() {
            return (fence < 0 || est == map.size ? Spliterator.SIZED : 0) |
                Spliterator.DISTINCT;
        }
    }

    /* ------------------------------------------------------------ */
    /* LinkedHashMap 支持方法(support) */

    /*
     * 以下包可见的方法(无修饰符)被设计LinkedHashMap重写，但不被任何其他子类重写
     * 几乎所有其他内部方法都也都声明为包可见，但声明为final(方法被继承但是不可被重写)
     * 因此可以由LinkedHashMap、视图类和HashSet使用
     *
     *
     * The following package-protected methods are designed to be
     * overridden by LinkedHashMap, but not by any other subclass.
     * Nearly all other internal methods are also package-protected
     * but are declared final, so can be used by LinkedHashMap, view
     * classes, and HashSet.
     */

    // 创建一个Node(非红黑树中的Node, 用在LinkedHashMap中)
	// Create a regular (non-tree) node
    Node<K,V> newNode(int hash, K key, V value, Node<K,V> next) {
        return new Node<>(hash, key, value, next);
    }

	// 用于将红黑树节点转为普通结点
    // For conversion from TreeNodes to plain nodes
    Node<K,V> replacementNode(Node<K,V> p, Node<K,V> next) {
        return new Node<>(p.hash, p.key, p.value, next);
    }

	// 创建一个红黑树节点
    // Create a tree bin node
    TreeNode<K,V> newTreeNode(int hash, K key, V value, Node<K,V> next) {
        return new TreeNode<>(hash, key, value, next);
    }

	// 将节点p转化为红黑树节点
    // For treeifyBin
    TreeNode<K,V> replacementTreeNode(Node<K,V> p, Node<K,V> next) {
        return new TreeNode<>(p.hash, p.key, p.value, next);
    }

    /**
     * 将map对象重置为初始化状态, 被clone()和readObject()方法调用
     *
     * Reset to initial default state.  Called by clone and readObject.
     */
    void reinitialize() {
        table = null;
        entrySet = null;
        keySet = null;
        values = null;
        modCount = 0;
        threshold = 0;
        size = 0;
    }

	// LinkedHashMap的回调方法
    // Callbacks to allow LinkedHashMap post-actions
    void afterNodeAccess(Node<K,V> p) { }
    void afterNodeInsertion(boolean evict) { }
    void afterNodeRemoval(Node<K,V> p) { }

	
	// 仅在writeObject中调用，以确保序列化顺序兼容 (一致)
    // Called only from writeObject, to ensure compatible ordering.
    void internalWriteEntries(java.io.ObjectOutputStream s) throws IOException {
        Node<K,V>[] tab;
        if (size > 0 && (tab = table) != null) {
            for (Node<K,V> e : tab) {
                for (; e != null; e = e.next) {
                    s.writeObject(e.key);
                    s.writeObject(e.value);
                }
            }
        }
    }

    /* ------------------------------------------------------------ */
    /* 内部类: 红黑树(Tree bins) */

    /**
     * 红黑树内部的结点, 继承了LinkedHashMap.Entry(而它又继承了HashMap中的Node类)
     * 所以他可以(在HashMap中)被当做常规节点或树节点的扩展
     *
     * Entry for Tree bins. Extends LinkedHashMap.Entry (which in turn
     * extends Node) so can be used as extension of either regular or
     * linked node
     */
    // 具体代码分析见TreeNode(红黑树分析)
    static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {...}

}

```

  ><br/>
  >
  >**备注: TreeNode的源码分析见文章:** [Java集合十-TreeNode与HashMap](https://jasonkayzk.github.io/2019/12/03/Java集合十-TreeNode与HashMap/)

><br/>
>
>**说明**:
>
>在详细介绍HashMap的代码之后总结如下：
>
>-   **① HashMap就是一个散列表，它是通过“拉链法”解决哈希冲突的**
>
>    
>
>-   **② 影响HashMap性能的有两个参数：初始容量(initialCapacity) 和加载因子(loadFactor)**
>
>    -   容量是哈希表中桶的数量，初始容量只是哈希表在创建时的容量
>    -   加载因子是哈希表在其容量自动增加之前可以达到多满的一种尺度, 当**哈希表中的条目数超出了加载因子与当前容量的乘积时，则要对该哈希表进行 rehash  操作（**即重建内部数据结构），从而**哈希表将具有大约两倍的桶数**
>
>    
>
>-   **③ 在HashMap中定义了两个内部类**: 
>
>    -   **Node(JDK 8之前叫做HashMap.Entry): 普通单向链表数据类型**
>    -   **TreeNode: 红黑树数据类型**
>
>    
>
>-   **④ HashMap会在必要的情况下在普通链表 <-> 红黑树之间转换(treeifyBin()):** 
>
>    -   <font color="#ff0000">**转换条件: 链表长度到8(选择8是泊松分布决定的)且数组长度到64:**</font> 
>
>        ```java
>        final V otherAddMethod (...) {
>            // 其他添加方法在添加元素之后会做如下判断:
>            // 当链表长度到达8(hashcode冲突元素有8个), 才会调用下面的treeifyBin()方法
>            ...
>            if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
>                treeifyBin(tab, hash);
>            ...
>                
>        }
>        
>        final void treeifyBin(Node<K,V>[] tab, int hash) {
>            int n, index; Node<K,V> e;
>            if (tab == null || (n = tab.length) < MIN_TREEIFY_CAPACITY)
>                // 数组长度小于MIN_TREEIFY_CAPACITY(64)时, 仅仅扩容
>                resize();
>            // 否则才会转化, 即数组长度大于等于64
>            else if ((e = tab[index = (n - 1) & hash]) != null) {
>                TreeNode<K,V> hd = null, tl = null;
>                do {
>                    TreeNode<K,V> p = replacementTreeNode(e, null);
>                    if (tl == null)
>                        hd = p;
>                    else {
>                        p.prev = tl;
>                        tl.next = p;
>                    }
>                    tl = p;
>                } while ((e = e.next) != null);
>                if ((tab[index] = hd) != null)
>                    hd.treeify(tab);
>            }
>        }
>        
>        ```
>
>        **可知:**
>
>        **① 当hashcode冲突元素到达8个(链表长度到8)之后才会调用treeifyBin()方法, 进行扩容或者转换;**
>
>        <br/>
>
>        **② 进入treeifyBin()方法并不是直接转换, 而是判断(数组长度小于MIN_TREEIFY_CAPACITY(64)时, 仅仅扩容):**
>
>        <font color="#ff0000">**这是为了在初始化时, 因为数组容量较小(所以很容易发生hash冲突), 而此时并不应该转换, 所做的优化**</font>
>
>    -   **转换过程**: 上述treeifyBin()方法
>
>    
>
>-   **⑤ HashMap中涉及了大量的转换**, 总结如下:
>
>    -   **① 数组扩容: table属性(Node<K,V>[] table)的扩容**
>
>        <font color="#f00">**发生在当插入下一个元素(如put()等方法[或treeifyBin()方法])使得元素个数大于threshold时调用resize()方法扩容;**</font>
>
>        <font color="#ff0000">**注意: 数组扩容都为两倍扩容, 并且要求了初始化时的容量必须为2的次方(即使你构造方法传参不是2的幂, 也会使用tableSizeFor()方法帮你转化)**</font>
>
>        <font color="#ff0000">**所以数组容量永远为二次幂**</font>
>
>    -   **② Rehash: 当数组扩容时, 会进行rehash**
>
>    -   **③ 普通链表转为红黑树: 链表长度到8(选择8是泊松分布决定的)且数组长度到64**
>
>    -   **④ 红黑树转为普通链表: 若桶中元素小于等于6时，树结构还原成链表形式**
>
>    ><br/>
>    >
>    >**选择6和8的原因是:**
>    >
>    >中间有个差值7可以防止链表和树之间频繁的转换
>    >
>    >假设一下，如果设计成链表个数超过8则链表转换成树结构，链表个数小于8则树结构转换成链表，如果一个HashMap不停的插入、删除元素，链表个数在8左右徘徊，就会频繁的发生树转链表、链表转树，效率会很低
>
>     
>
>-   **⑥ HashMap中定义了三个内部类, 用于不同需求的遍历:**
>
>    -   **KeySet: 继承自AbstractSet, 所以key值不可重复**
>    -   **Values: 继承自AbstractCollection, 所以value值可以重复**
>    -   **EntrySet: 继承自AbstractSet, 所以Entry也不可重复**
>
>    
>
>    各自的**Iterator实现**: KeyIterator, ValueIterator和EntryIterator**(统一继承了抽象内部类HashIterator, 并实现了Iterator接口)**
>
>    
>
>    各自的**Spliterator实现**: KeySpliterator, ValueSpliterator和EntrySpliterator**(统一继承了抽象内部类HashMapSpliterator, 并实现了Spliterator接口)**

><br/>
>
>更多与HashMap相关内容查看: [Java集合十-TreeNode与HashMap](https://jasonkayzk.github.io/2019/12/03/Java集合十-TreeNode与HashMap/)



<br/>