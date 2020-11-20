---
title: Java集合八-Map架构
toc: true
date: 2019-11-27 14:18:28
cover: https://acg.yanwz.cn/api.php?12
categories: Java源码
tags: [Java基础, 面试总结, 集合]
---

前面，我们已经系统的对List进行了学习。接下来，我们先学习Map，然后再学习Set；因为**Set的实现类都是基于Map来实现的**(如，HashSet是通过HashMap实现的，TreeSet是通过TreeMap实现的)

<br/>

<!--more-->

## 概要

首先，我们看看Map架构:

![Map架构.jpg](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/Map架构.jpg)

如上图：

**① Map 是映射接口**，Map中存储的内容是**键值对(key-value)**

**② AbstractMap 是实现了Map接口的抽象类，它实现了Map中的大部分API**。其它Map的实现类可以通过继承AbstractMap来减少重复编码

**③ SortedMap 是继承于Map的接口**。SortedMap中的内容是**排序的键值对**，排序的方法是通过比较器(Comparator)

**④ NavigableMap 是继承于SortedMap的接口**。相比于SortedMap，NavigableMap有**一系列的导航方法**, 如: 获取大于/等于某对象的键值对、获取小于/等于某对象的键值对等

**⑤ TreeMap 继承于AbstractMap**，且**实现了NavigableMap接口**；因此，TreeMap中的内容是“**有序的键值对**”

**⑥ HashMap 继承于AbstractMap**，但**没实现NavigableMap接口**；因此，HashMap的内容是“**键值对，但不保证次序**”

**⑦ Hashtable** 虽然不是继承于AbstractMap，但它**继承于Dictionary**(Dictionary也是键值对的接口)，而且**也实现Map接口**；因此，Hashtable的内容也是“**键值对，也不保证次序**”。但和HashMap相比，Hashtable是线程安全的，而且它**支持通过Enumeration去遍历**

**⑧ WeakHashMap 继承于AbstractMap**。它和HashMap的键类型不同，**WeakHashMap的键是“弱键”**

<br/>

**在对各个实现类进行详细之前，**先来看看**各个接口和抽象类的大致介绍。**内容包括:

-   **Map**
-   **Map.Entry**
-   **AbstractMap**
-   **SortedMap**
-   **NavigableMap**
-   **Dictionary**

<br/>

## 一. Map接口

Map的定义如下:

```java
public interface Map<K,V> { }
```

**Map 是一个键值对(key-value)映射接口:** Map映射中**不能包含重复的键**；每个键最多只能映射到一个值

**Map 接口提供三种collection 视图**，允许以**键集**、**值集**或**键-值映**射关系集的形式查看某个映射的内容

**Map 映射顺序:** 有些实现类，可以明确保证其顺序，如 TreeMap；另一些映射实现则不保证顺序，如 HashMap 类

Map 的实现类应该提供2个“标准的”构造方法：**第一个，void（无参数）构造方法，用于创建空映射**；**第二个，带有单个 Map 类型参数的构造方法，用于创建一个与其参数具有相同键-值映射关系的新映射**

><br/>
>
>**补充:**
>
>实际上，后一个构造方法允许用户复制任意映射，生成所需类的一个等价映射。尽管无法强制执行此建议（因为接口不能包含构造方法），但是 JDK 中所有通用的映射实现都遵从它

<br/>

**Map的API**

```java
// Map接口中定义的方法
int                  size()
boolean              isEmpty()
boolean              containsKey(Object key)
boolean              containsValue(Object value)
V                    get(Object key)
V                    put(K key, V value)
V                    remove(Object key)
void                 putAll(Map<? extends K, ? extends V> map)
void                 clear()
Set<K>               keySet()
Collection<V>        values()
Set<Entry<K, V>>     entrySet()
// 重写Object中的equals()与hashCode()方法
boolean              equals(Object object)
int                  hashCode()


/* JDK 8后Map接口中增加的新方法 */
    
// 在Map中寻找key, 如果存在key且key对应的value不为null则返回value, 否则返回defaultValue
default V getOrDefault(Object key, V defaultValue) {
	V v;
    // 通过key得到的value也不能为null!
	return (((v = get(key)) != null) || containsKey(key))
	    ? v
	    : defaultValue;
}

// 通过传入BiConsumer(Lambda表达式)遍历对Map进行操作
default void forEach(BiConsumer<? super K, ? super V> action) {
    Objects.requireNonNull(action);
    for (Map.Entry<K, V> entry : entrySet()) {
        K k;
        V v;
        try {
            k = entry.getKey();
            v = entry.getValue();
        } catch (IllegalStateException ise) {
            // 执行forEach的时候不允许修改元素长度, 否则会抛出ConcurrentModificationException异常
            // 通常说明entry已经不在map中[并发线程移除了](this usually means the entry is no longer in the map)
            throw new ConcurrentModificationException(ise);
        }
        action.accept(k, v);
    }
}

// 根据重写方法逻辑进行重新赋值
default void replaceAll(BiFunction<? super K, ? super V, ? extends V> function) {
    Objects.requireNonNull(function);
    for (Map.Entry<K, V> entry : entrySet()) {
        K k;
        V v;
        try {
            k = entry.getKey();
            v = entry.getValue();
        } catch (IllegalStateException ise) {
            // 执行forEach的时候不允许修改元素长度, 否则会抛出ConcurrentModificationException异常
            // 通常说明entry已经不在map中[并发线程移除了](this usually means the entry is no longer in the map)
            throw new ConcurrentModificationException(ise);
        }

        // ise thrown from function is not a cme.
        v = function.apply(k, v);

        try {
            entry.setValue(v);
        } catch (IllegalStateException ise) {
            // 执行forEach的时候不允许修改元素长度, 否则会抛出ConcurrentModificationException异常
            // 通常说明entry已经不在map中[并发线程移除了](this usually means the entry is no longer in the map)
            throw new ConcurrentModificationException(ise);
        }
    }
}

// 当不存在key或者key中存放的是null值时, 加入(k, v)对
default V putIfAbsent(K key, V value) {
    V v = get(key);
    if (v == null) {
        v = put(key, value);
    }

    return v;
}

// 使用Objects.equals()方法比较(内部也是先比较内存地址, 再使用equals比较)
// 若存在与传参相同的(k, v)对则移除
default boolean remove(Object key, Object value) {
    Object curValue = get(key);
    if (!Objects.equals(curValue, value) ||
        (curValue == null && !containsKey(key))) {
        return false;
    }
    remove(key);
    return true;
}

// 使用Objects.equals()方法比较(内部也是先比较内存地址, 再使用equals比较)
// 若存在与传参相同的(k, v)对则替换newValue
default boolean replace(K key, V oldValue, V newValue) {
    Object curValue = get(key);
    if (!Objects.equals(curValue, oldValue) ||
        (curValue == null && !containsKey(key))) {
        return false;
    }
    put(key, newValue);
    return true;
}

// 如果存在key则替换, 否则添加(k, v)对, 并返回添加的value
default V replace(K key, V value) {
    V curValue;
    if (((curValue = get(key)) != null) || containsKey(key)) {
        curValue = put(key, value);
    }
    return curValue;
}

// 如果传给该方法的key参数在Map中对应的value为null，则使用mappingFunction"根据key计算"一个新的结果
// 如果计算结果不为null，则用计算结果覆盖原有value(如果原Map原来不包含该key，那么该方法可能会添加一组key-value对)
default V computeIfAbsent(K key,
        Function<? super K, ? extends V> mappingFunction) {
    Objects.requireNonNull(mappingFunction);
    V v;
    if ((v = get(key)) == null) {
        V newValue;
        if ((newValue = mappingFunction.apply(key)) != null) {
            put(key, newValue);
            return newValue;
        }
    }

    return v;
}

// 该方法使用remappingFunction"根据原key-value对计算"一个新的value
// 只要新value不为null，就使用新value覆盖原value；
// 如果原value不为null,但新value为null，则删除原key-value对;
// 如果原value、新value同时为null，那么该方法不改变任何key-value对，直接返回null
default V computeIfPresent(K key,
                           BiFunction<? super K, ? super V, ? extends V> remappingFunction) {
    Objects.requireNonNull(remappingFunction);
    V oldValue;
    if ((oldValue = get(key)) != null) {
        V newValue = remappingFunction.apply(key, oldValue);
        if (newValue != null) {
            put(key, newValue);
            return newValue;
        } else {
            remove(key);
            return null;
        }
    } else {
        return null;
    }
}

// 使用remappingFunction根据原key-value对计算一个新的value
// 只要新value不为null，就使用新value覆盖原value；
// 如果原value不为null, 但新value为null，则删除原key-value对;
// 如果原value、新value同时为null，那么该方法不改变任何key-value对，直接返回null
default V compute(K key,
        BiFunction<? super K, ? super V, ? extends V> remappingFunction) {
    Objects.requireNonNull(remappingFunction);
    V oldValue = get(key);

    V newValue = remappingFunction.apply(key, oldValue);
    if (newValue == null) {
        // delete mapping
        if (oldValue != null || containsKey(key)) {
            // something to remove
            remove(key);
            return null;
        } else {
            // nothing to do. Leave things as they were.
            return null;
        }
    } else {
        // add or replace old mapping
        put(key, newValue);
        return newValue;
    }
}

// 先根据Key参数获取该Map中对应的value:
// 如果获得value为null，则直接用传入的value覆盖原有的value(在这中情况下，可能要添加一组key-value对)；
// 如果获取的value不为null, 则使用remappingFunction 函数根据原value、新value计算一新的结果，并用得到的结果去覆盖原有的value
default V merge(K key, V value,
        BiFunction<? super V, ? super V, ? extends V> remappingFunction) {
    Objects.requireNonNull(remappingFunction);
    Objects.requireNonNull(value);
    V oldValue = get(key);
    V newValue = (oldValue == null) ? value :
               remappingFunction.apply(oldValue, value);
    if (newValue == null) {
        remove(key);
    } else {
        put(key, newValue);
    }
    return newValue;
}

/* JDK 9后Map接口中增加的新方法 */
/* 创建 ImmutableCollections(不可变集合的相关API) */

// 返回一个空的不可变Map
static <K, V> Map<K, V> of() {
    return ImmutableCollections.emptyMap();
}

// 返回由一个(k, v)组成的不可变Map
static <K, V> Map<K, V> of(K k1, V v1) {
    return new ImmutableCollections.Map1<>(k1, v1);
}

// 返回由两个(k, v)组成的不可变Map
static <K, V> Map<K, V> of(K k1, V v1, K k2, V v2) {
    return new ImmutableCollections.MapN<>(k1, v1, k2, v2);
}

...

// 返回由十个(k, v)组成的不可变Map
static <K, V> Map<K, V> of(K k1, V v1, K k2, V v2, K k3, V v3, K k4, V v4, K k5, V v5,
                           K k6, V v6, K k7, V v7, K k8, V v8, K k9, V v9, K k10, V v10) {
    return new ImmutableCollections.MapN<>(k1, v1, k2, v2, k3, v3, k4, v4, k5, v5,
                                           k6, v6, k7, v7, k8, v8, k9, v9, k10, v10);
}

// 返回由多个(k, v)组成的不可变Map
@SafeVarargs
@SuppressWarnings("varargs")
static <K, V> Map<K, V> ofEntries(Entry<? extends K, ? extends V>... entries) {
    if (entries.length == 0) { // implicit null check of entries array
        return ImmutableCollections.emptyMap();
    } else if (entries.length == 1) {
        // implicit null check of the array slot
        return new ImmutableCollections.Map1<>(entries[0].getKey(),
                entries[0].getValue());
    } else {
        Object[] kva = new Object[entries.length << 1];
        int a = 0;
        for (Entry<? extends K, ? extends V> entry : entries) {
            // implicit null checks of each array slot
            kva[a++] = entry.getKey();
            kva[a++] = entry.getValue();
        }
        return new ImmutableCollections.MapN<>(kva);
    }
}

// 返回一个包括所给的(k, v)对的不可变的Entry{@link Entry}
// Returns an unmodifiable {@link Entry} containing the given key and value. 
// These entries are suitable for populating {@code Map} instances
// - using the {@link Map#ofEntries Map.ofEntries()} method
static <K, V> Entry<K, V> entry(K k, V v) {
    // KeyValueHolder checks for nulls
    return new KeyValueHolder<>(k, v);
}

/* JDK 10后加入方法 */

// Map的克隆方法, 生成当前Map的一个快照:
// 返回一个不可修改的Map, 并包括当前Map中所有的(k, v)对.
// 给定的Map不能为null, 且一定不能包括值为null的key或value.
// 如果Map在复制时被更改, 则返回值不会反应这个更改(因为生成的是快照)
// Returns an unmodifiable Map containing the entries  of the given Map
// The given Map must not be null, and it must not contain any  null keys or values
// If the given Map is subsequently modified, the returned Map will not reflect such modifications
@SuppressWarnings({"rawtypes","unchecked"})
static <K, V> Map<K, V> copyOf(Map<? extends K, ? extends V> map) {
    if (map instanceof ImmutableCollections.AbstractImmutableMap) {
        return (Map<K,V>)map;
    } else {
        return (Map<K,V>)Map.ofEntries(map.entrySet().toArray(new Entry[0]));
    }
}

// Map.Entry接口中定义的方法: 见Map.Entry
...
```

><br/>
>
>**说明:**
>
>**①** Map接口提供了分别用于返回 键集、值集或键-值映射关系集:
>
>-   **entrySet()**用于返回**键-值集**的**Set集合**
>-   **keySet()**用于返回**键集**的**Set集合**
>-   **values()**用户返回**值集**的**Collection集合**
>-   因为**Map中不能包含重复的键；**每个键最多只能映射到一个值。所以，**键-值集、键集都是Set，值集是Collection**
>
>**② Map接口提供了键-值对、根据键获取值、删除键、获取容量大小等方法**
>
>**③ 在Map中实际是通过Map.Entry内部接口来定义数据类型**
>
>**④ JDK 8在Map接口中添加了getOrDefault(), forEach(), putIfAbsent(), compute(), merge()等与Stream和Lambda表达式搭配使用的方法**
>
>**⑤  JDK 9与JDK 10分别加入了创建不可变(ImmutableCollections)Map的方法以及生成当前Map快照的方法copyOf()**

<br/>

## 二. Map.Entry

Map.Entry的定义如下:

```java
interface Entry<K,V> { }
```

Map.Entry是Map中内部的一个接口，Map.Entry是**键值对**

Map通过 entrySet() 获取Map.Entry的键值对集合，从而通过该集合实现对键值对的操作

**Map.Entry的API**

```java
abstract boolean      equals(Object object)
abstract int          hashCode()
abstract K            getKey()
abstract V            getValue()
abstract V            setValue(V object)

/* JDK 8后加入的方法 */

// 返回一个按自然顺序(natural order)比较Key的比较器(Comparator)
// Returns a comparator that compares {@link Map.Entry} in natural order on key
public static <K extends Comparable<? super K>, V> Comparator<Map.Entry<K, V>> comparingByKey() {
    return (Comparator<Map.Entry<K, V>> & Serializable)
        (c1, c2) -> c1.getKey().compareTo(c2.getKey());
}

// 返回一个按自然顺序比较Value的比较器
// Returns a comparator that compares {@link Map.Entry} in natural order on value
public static <K, V extends Comparable<? super V>> Comparator<Map.Entry<K, V>> comparingByValue() {
    return (Comparator<Map.Entry<K, V>> & Serializable)
        (c1, c2) -> c1.getValue().compareTo(c2.getValue());
}

// 返回一个按照自定义比较方法比较Key的比较器
// Returns a comparator that compares {@link Map.Entry} by key using the given
public static <K, V> Comparator<Map.Entry<K, V>> comparingByKey(Comparator<? super K> cmp) {
    Objects.requireNonNull(cmp);
    return (Comparator<Map.Entry<K, V>> & Serializable)
        (c1, c2) -> cmp.compare(c1.getKey(), c2.getKey());
}

// 返回一个按照自定义比较方法比较Value的比较器
// Returns a comparator that compares {@link Map.Entry} by value using the given
public static <K, V> Comparator<Map.Entry<K, V>> comparingByValue(Comparator<? super V> cmp) {
    Objects.requireNonNull(cmp);
    return (Comparator<Map.Entry<K, V>> & Serializable)
        (c1, c2) -> cmp.compare(c1.getValue(), c2.getValue());
}
```

><br/>
>
>**说明: JDK 8中添加了两对有参和无参的比较方法, 方法返回一个比较器**
>
>此方法用在Stream处理中, 用于简化代码, 并使得代码更加清晰, 如在JdepsTask类中:
>
>```java
>config.splitPackages().entrySet()
>                      .stream()
>                      .sorted(Map.Entry.comparingByKey())
>                      .forEach(...);
>```
>
>可以通过方法名直接看出是使用了key进行排序

<br/>

## 三. AbstractMap

AbstractMap的定义如下：

```java
public abstract class AbstractMap<K,V> implements Map<K,V> {}
```

AbstractMap类提供 Map 接口的骨干实现，以最大限度地减少实现此接口所需的工作

-   **要实现不可修改的映射，只需扩展此类并提供 entrySet 方法的实现即可**，该方法将返回映射的映射关系 set 视图:

    通常，返回的 set 将依次在 AbstractSet 上实现。此 set 不支持 add() 或 remove() 方法，其迭代器也不支持 remove() 方法

    

-   **要实现可修改的映射，编程人员必须另外重写此类的 put 方法（否则将抛出 UnsupportedOperationException），entrySet().iterator() 返回的迭代器也必须另外实现其 remove 方法**

<br/>

**AbstractMap的API**

 ```java
/* AbstractMap中定义的属性与构造函数 */
transient Set<K>        keySet;
transient Collection<V> values;
protected AbstractMap() {}


/* 来自于Map接口未实现的方法 */
abstract Set<Entry<K, V>>     entrySet()

/* 来自于Map接口实现的方法 */
public   int                  size()
public   boolean              isEmpty()
public   boolean              containsKey(Object key)
public   boolean              containsValue(Object value)
public   V                    get(Object key)
public   V                    remove(Object key)
public   void                 putAll(Map<? extends K, ? extends V> map)
public   void                 clear()
public   Set<K>               keySet()
public   Collection<V>        values()
public   boolean              equals(Object object)
public   int                  hashCode()
public   V                    put(K key, V value) {
    throw new UnsupportedOperationException();
}
    
    
/* 覆盖Object中的方法 */
}
public   String               toString()
public   Object               clone()


/* JDK 1.6中: AbstractMap中定义的内部类: SimpleEntry */
/* public static class SimpleEntry<K,V> implements Entry<K,V>, java.io.Serializable */

// 实现Entry接口的方法
public   K                    getKey() {...}
public   V                    getValue() {...}
public   V                    setValue(V value) {...}
public   boolean              equals(Object o) {...}
public   int                  hashCode() {...}
public   String               toString() {...}

// SimpleEntry内部定义的属性及构造方法
private static final long     serialVersionUID = -8499721149061103585L;
private final K               key;
private V                     value;

public SimpleEntry(K key, V value) {...}
public SimpleEntry(Entry<? extends K, ? extends V> entry) {...}



/* JDK 1.6中: AbstractMap中定义的内部类: SimpleImmutableEntry */
/* public static class SimpleImmutableEntry<K,V> implements Entry<K,V>, java.io.Serializable */

// 实现Entry接口的方法
public   K                    getKey() {...}
public   V                    getValue() {...}
public   boolean              equals(Object o) {...}
public   int                  hashCode() {...}
public   String               toString() {...}

public V setValue(V value) {
    throw new UnsupportedOperationException();
}

// SimpleImmutableEntry内部定义的属性及构造方法
private static final long     serialVersionUID = 7138329143949025153L;
private final K               key;
private final V               value;

public SimpleImmutableEntry(K key, V value) {...}
public SimpleImmutableEntry(Entry<? extends K, ? extends V> entry) {...}
 ```

><br/>
>
>**总结:**
>
>**① 在AbstractMap中定义了两个属性keySet和values:**
>
>-   **keySet()**用于返回**键集**的**Set集合**
>-   **values()**用户返回**值集**的**Collection集合**
>
>**② AbstractMap实现了Map接口中除entrySet()方法之外的所有方法**, 但是实现的方法有些并不可直接使用: 
>
>**如: put()方法就仅仅抛出UnsupportedOperationException异常**
>
>**③ AbstractMap抽象类中定义了两个内部类SimpleEntry, SimpleImmutableEntry分别都实现了Entry和 Serializable接口(JDK 1.6)**, 两者的用途如下:
>
>-   **SimpleEntry: 维护键和值的条目。可以使用{@code setValue}方法更改该值。这个类简化了构建自定义映射实现的过程**
>
>    
>
>    **原文: An Entry maintaining a key and a value.  The value may be changed using the {@code setValue} method.  This class facilitates the process of building custom map implementations**
>
>    
>
>-   **SimpleImmutableEntry: 一个维护不可变键和值的Entry。此类{@code setValue}不支持方法(调用setValue()方法将直接抛出UnsupportedOperationException异常). 在返回键为值映射的线程安全快照的方法中，此类可以很方便**
>
>    
>
>    **原文: An Entry maintaining an immutable key and value.  This class does not support method {@code setValue}.  This class may be convenient in methods that return thread-safe snapshots of key-value mappings**

<br/>

## 四. SortedMap

SortedMap的定义如下：

```java
public interface SortedMap<K,V> extends Map<K,V> { }
```

SortedMap是一个**继承于Map接口的接口, 它是一个有序的SortedMap键值映射**

SortedMap的排序方式有两种：**自然排序** 或者 **用户指定比较器**。 插入有序 SortedMap 的**所有元素都必须实现 Comparable 接口（或者被指定的比较器所接受）**

另外，所有SortedMap **实现类都应该提供 4 个“标准”构造方法**：

**① void（无参数）构造方法**，它创建一个空的有序映射，按照键的自然顺序进行排序

**② 带有一个 Comparator 类型参数的构造方法**，它创建一个空的有序映射，根据指定的比较器进行排序

**③ 带有一个 Map 类型参数的构造方法**，它创建一个新的有序映射，其键-值映射关系与参数相同，按照键的自然顺序进行排序

**④ 带有一个 SortedMap 类型参数的构造方法**，它创建一个新的有序映射，其键-值映射关系和排序方法与输入的有序映射相同。**无法保证强制实施此建议，因为接口不能包含构造方法。**

<br/>

**SortedMap的API**

```java
// 继承于Map的API
abstract void                 clear()
abstract boolean              containsKey(Object key)
abstract boolean              containsValue(Object value)
abstract Set<Entry<K, V>>     entrySet()
abstract boolean              equals(Object object)
abstract V                    get(Object key)
abstract int                  hashCode()
abstract boolean              isEmpty()
abstract Set<K>               keySet()
abstract V                    put(K key, V value)
abstract void                 putAll(Map<? extends K, ? extends V> map)
abstract V                    remove(Object key)
abstract int                  size()
abstract Collection<V>        values()

// SortedMap新增的API 
abstract Comparator<? super K>     comparator()
abstract K                         firstKey()
abstract SortedMap<K, V>           headMap(K endKey)
abstract K                         lastKey()
abstract SortedMap<K, V>           subMap(K startKey, K endKey)
abstract SortedMap<K, V>           tailMap(K startKey)
```

<br/>

## 五. NavigableMap

NavigableMap的定义如下：

```java
public interface NavigableMap<K,V> extends SortedMap<K,V> { }
```

NavigableMap是继承于SortedMap的接口。它是一个可导航的键-值对集合，具有了为给定搜索目标报告最接近匹配项的导航方法

NavigableMap分别提供了获取键、键-值对、键集、键-值对集的相关方法

<br/>

**NavigableMap的API**

```java
/* 从SortedMap接口继承的方法 */
abstract SortedMap<K, V>         subMap(K fromKey, K toKey)
abstract SortedMap<K, V>         headMap(K toKey)
abstract SortedMap<K, V>         tailMap(K fromKey)

/* NavigableMap接口中定义的方法 */
abstract Entry<K, V>             ceilingEntry(K key)
abstract Entry<K, V>             firstEntry()
abstract Entry<K, V>             floorEntry(K key)
abstract Entry<K, V>             higherEntry(K key)
abstract Entry<K, V>             lastEntry()
abstract Entry<K, V>             lowerEntry(K key)
abstract Entry<K, V>             pollFirstEntry()
abstract Entry<K, V>             pollLastEntry()
abstract K                       ceilingKey(K key)
abstract K                       floorKey(K key)
abstract K                       higherKey(K key)
abstract K                       lowerKey(K key)
abstract NavigableSet<K>         descendingKeySet()
abstract NavigableSet<K>         navigableKeySet()
abstract NavigableMap<K, V>      descendingMap()
abstract NavigableMap<K, V>      headMap(K toKey, boolean inclusive)
abstract NavigableMap<K, V>      subMap(K fromKey, boolean fromInclusive, K toKey, boolean toInclusive)
abstract NavigableMap<K, V>      tailMap(K fromKey, boolean inclusive)
```

><br/>
>
>**说明**：
>
>NavigableMap除了继承SortedMap的特性外，它的提供的功能可以分为4类:
>
>-   **① 提供操作键-值对的方法:**
>
>    lowerEntry、floorEntry、ceilingEntry 和 higherEntry 方法，它们分别返回与小于、小于等于、大于等于、大于给定键的键**关联的 Map.Entry 对象**
>
>    firstEntry、pollFirstEntry、lastEntry 和 pollLastEntry 方法，它们返回和/或移除最小和最大的映射关系（如果存在），否则返回 null
>
>    
>
>-   **② 提供操作键的方法:**
>
>    这个和第1类比较类似lowerKey、floorKey、ceilingKey 和 higherKey 方法，它们分别返回与小于、小于等于、大于等于、大于**给定键的键**
>
>    
>
>-   **③ 获取键集:**
>
>    navigableKeySet、descendingKeySet分别**获取正序/反序的键集**
>
>    
>
>-   **④ 获取键-值对的子集**

<br/>

## 六. Dictionary

Dictionary的定义如下：

```java
public abstract class Dictionary<K,V> {}
```

**Dictionary是JDK 1.0定义的键值对的抽象类，它也包括了操作键值对的基本方法**

<br/>

**Dictionary的API**

```java
abstract Enumeration<V>     elements()
abstract V                  get(Object key)
abstract boolean            isEmpty()
abstract Enumeration<K>     keys()
abstract V                  put(K key, V value)
abstract V                  remove(Object key)
abstract int                size()
```



<br/>