---
title: 使用Rust实现布隆过滤器BloomFilter
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?54'
date: 2022-12-16 14:47:19
categories: Rust
tags: [Rust, BloomFilter]
description: 布隆过滤器（Bloom Filter）是一个基于Hash的概率性的数据结构，它是由一个很长的二进制数组组成，用来检查一个元素可能存在集合中，和一定不存在集合中；它的优点是空间效率高，但是有一定false positive（假阳性：元素不在集合中，但是布隆过滤器显示在集合中）；本文首先介绍了BloomFilter，随后给出了Rust实现；
---

布隆过滤器（Bloom Filter）是一个基于Hash的概率性的数据结构，它是由一个很长的二进制数组组成，用来检查一个元素可能存在集合中，和一定不存在集合中；

它的优点是空间效率高，但是有一定false positive（假阳性：元素不在集合中，但是布隆过滤器显示在集合中）；

本文首先介绍了BloomFilter，随后给出了Rust实现；

源代码：

-   https://github.com/JasonkayZK/boost-rs/blob/main/boost-rs/src/collection/bloom_filter/mod.rs

<br/>

<!--more-->

# **使用Rust实现布隆过滤器BloomFilter**

## **BloomFilter讲解**

### **介绍**

**布隆过滤器就是一个长度为`m`个bit的位数组，初始的时候每个bit都是0，另外还有`k`个hash函数；**

![](https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Bloom_filter.svg/720px-Bloom_filter.svg.png)

下面是一些BloomFilter的使用场景：

-   字处理软件中，需要检查一个英语单词是否拼写正确；
-   一个人的名字是否已经在名单上；
-   在网络爬虫里，一个网址是否被访问过；
-   yahoo, gmail等邮箱垃圾邮件过滤功能；

即，BloomFilter 解决的是 **如何判断一个元素是否存在一个集合中** 的问题；

<br/>

### **为什么选择 BloomFilter**

判断一个元素是否存在一个集合中，我们有许多方法，例如：

-   树、平衡二叉树、Trie
-   Map (红黑树)
-   哈希表
-   ……

虽然上面的这几种数据结构配合常见的排序、二分搜索可以快速高效的处理绝大部分判断元素是否存在集合中的需求；

但是当集合里面的元素数量足够大，如果有：5000万条、甚至1亿条记录呢？这个时候常规的数据结构的问题就凸显出来了；

数组、链表、树等数据结构会存储元素的内容，一旦**数据量过大，消耗的内存也会呈现线性增长**，最终达到瓶颈；

>   虽然哈希表的效率很高，查询效率可以达到O(1)，但是哈希表需要消耗的内存很高；
>
>   使用哈希表存储一亿个垃圾 email 地址的消耗（假设哈希函数将一个email地址映射成8字节信息指纹，并考虑到哈希表存储效率通常小于50%）：8 * 2 * 1亿 字节 = 1.6G 内存；

而 BloomFilter 的空间效率和查询效率都很高！



<br/>

### **加入元素**

当加入一个元素时：

-   先用`k`个hash函数得到`k`个hash值；
-   将`k`个hash值与bit数组长度取模得到个`k`个位置；
-   最后将这`k`个位置对应的bit置位1；

例如，原始 Bit 数组包含 8 位，并且初始全部为0：

```
0 0 0 0 0 0 0 0
```

我们有 3 个 Hash 函数，对于某个 key 计算 `Hash(key) % 8` 后的值为 `1、3、6`，则将这些位置为 1：

```
0 1 0 1 0 0 1 0
```

<br/>

### **查询元素**

在布隆过滤器中查询元素比较简单：

-   先用`k`个hash函数得到`k`个hash值；
-   将`k`个hash值与bit数组长度取模得到个`k`个位置；
-   然后检查这`k`个位置的bit是否是1：
    -   如果都是1，则说明这个 key **可能存在**；
    -   如果存在0，则说明 key **一定不存在**！

例如，我们计算某个 `Hash(key2) % 8` 后的值为 `1、3、5`，而上面的数组中 index 为 5 的地方为 0，则 key2 一定不存在！

<br/>

### **假阳性误判（false positive）**

前面注意到，如果查询命中，则说明这个 key **可能存在**；

这是因为：有可能`k`个hash值对应的位置都已经置1，但这都是其他元素的操作，而实际上这个元素并不在布隆过滤器中，这就是假阳性误判；

对于 false positive 计算，有3个非常重要的参数：

1.  `m`表示bit数组的长度；
2.  `k`表示散列函数的个数；
3.  `n`表示插入的元素个数；

则在布隆过滤器中，一个元素插入后，某个bit为0的概率是：

```
(1−1/m)^k
```

n个元素插入后，某个bit为0的概率是：

```scss
(1−1/m)^(nk)
```

则 false positive 的概率是：

```bash
(1−(1−1/m)^nk)^k
```

因为需要的是`k`个不同的bit被设置成1，概率是大约是：

```bash
P(error) = (1−e^(−kn/m))^k
```

这个就是假阳性误判的概率；



>   关于概率的证明，Wikipedia 有更详细的证明：
>
>   -   https://en.wikipedia.org/wiki/Bloom_filter

<br/>

### **Bit数组的大小选择**

<font color="#f00">**可以看到，我们的bit数组的长度 `m` 越大，误判率越低；**</font>

<font color="#f00">**在使用时：我们可以预估可能的元素数据量 `n`、以及可以接受的误判率（例如，万分之一），选择 Hash 函数的个数（例如，3个），使用上面的公式来计算所需要的Bit数组的大小；**</font>

<br/>

### **Hash函数的选择**

由于布隆过滤器会对单个 key 计算多个Hash函数，因此Hash函数应当选择计算快速，所以不推荐 `md5`,`sha`等耗时比较久的hash操作；

可以使用，例如：`murmur3`的hash算法，来对key进行hash；

>   **Hash 函数比较：**
>
>   -   https://softwareengineering.stackexchange.com/questions/49550/which-hashing-algorithm-is-best-for-uniqueness-and-speed

<br/>

## **BloomFilter实现**

前面简单介绍了 BloomFilter 的原理，下面我们动手来实现一个；

和其他语言相比，Rust 中各种数据结构的实现要稍微复杂一些，不过由于 BloomFilter 比较简单，所以也没有想象中那么复杂；

**对于 Bit 数组，我这里直接使用了 [`bitvec`](https://crates.io/crates/bitvec) crate！**

>   具体实现的代码见：
>
>   -   https://github.com/JasonkayZK/boost-rs/blob/main/boost-rs/src/collection/bloom_filter/mod.rs

<br/>

### **结构定义**

BloomFilter 结构体定义如下：

```rust
const DEFAULT_CAPACITY: usize = 10240;

type HasherArray = Box<[Box<dyn BuildHasher<Hasher = DefaultHasher>>]>;

pub struct BloomFilter<T: ?Sized + Hash> {
    cap: usize,
    bit_array: BitVec,
    hashers: HasherArray,
    _phantom: PhantomData<T>,
}
```

首先，默认的 Bit 数组大小为 10240；

然后，为了支持自定义 Hash 函数，我们定义了 `HasherArray` 类型，他是一个 Slice，用来存放多个实现了 BuildHasher Trait 的对象；

>   <font color="#f00">**由于 Rust 要求 Struct 中定义的所有字段在编译期都要有确定的内存大小，因此我们需要使用 Box 包裹；**</font>
>
>   **关于为什么不使用Vec，可见：**
>
>   -   https://rustcc.cn/article?id=8a747b49-7b31-47a8-8170-6a82ff8df146
>   -   https://github.com/paulkernfeld/contiguous-data-in-rust#boxed-slice-boxt
>
>   <font color="#f00">**大概原因就是：BloomFilter 一旦创建，Hash 函数的个数就是固定的了，因此不需要使用变长的 Vec，同时也跟节省内存；**</font>

随后，我们定义了范型：`T: ?Sized + Hash`；

>   **Hash 的 Trait Bound 是显而易见的，我们需要为这个数据计算 hash 值；**
>
>   同时，我们<font color="#f00">**并不要求 T 是 Sized，因为：我们只要能够计算这个类型对应对象的 hash 值即可，在 BloomFilter 中是不存实际的数据的！**</font>

然后我们定义了 Phantom 类型：`_phantom: PhantomData<T>`；

**这也是因为我们声明了范型类型 `T`，但是在结构体中我们并没有存储任何和范型类型 `T` 相关的数据，因此需要使用一个 Phantom 类型的 Marker 来标注，告诉编译器（我们实际上拥有类型 `T` 的所有权）；**

>   **关于 PhantomData 也可以参考源码中的注释，写的非常清楚了：**
>
>   ```rust
>   /// Zero-sized type used to mark things that "act like" they own a `T`.
>   ///
>   /// Adding a `PhantomData<T>` field to your type tells the compiler that your
>   /// type acts as though it stores a value of type `T`, even though it doesn't
>   /// really. This information is used when computing certain safety properties.
>   ```

<br/>

### **构造函数**

我们为 BloomFilter 实现了 Default Trait：

```rust
impl<T: ?Sized + Hash> Default for BloomFilter<T> {
    fn default() -> Self {
        let v: Vec<Box<dyn BuildHasher<Hasher = DefaultHasher>>> =
            vec![Box::new(RandomState::new())];
        let hash_arr = HasherArray::from(v);
        BloomFilter {
            bit_array: BitVec::repeat(false, DEFAULT_CAPACITY),
            cap: DEFAULT_CAPACITY,
            hashers: hash_arr,
            _phantom: Default::default(),
        }
    }
}
```

使用了 `RandomState`（标准库中 HashMap 默认的 HashBuilder）作为默认的 Hash 函数；

一些其他构造函数：

```rust
impl<T: ?Sized + Hash> BloomFilter<T> {
    pub fn new() -> Self {
        Self::default()
    }
    
    pub fn with_capacity(cap: usize) -> Self {
        let v: Vec<Box<dyn BuildHasher<Hasher = DefaultHasher>>> =
            vec![Box::new(RandomState::new())];
        let hash_arr = HasherArray::from(v);
        BloomFilter {
            cap,
            bit_array: BitVec::repeat(false, cap),
            hashers: hash_arr,
            _phantom: Default::default(),
        }
    }

    pub fn with_hashers<const N: usize>(
        hashers: [Box<dyn BuildHasher<Hasher = DefaultHasher>>; N],
    ) -> Self {
        let hash_arr = HasherArray::from(hashers);
        BloomFilter {
            cap: DEFAULT_CAPACITY,
            bit_array: BitVec::repeat(false, DEFAULT_CAPACITY),
            hashers: hash_arr,
            _phantom: Default::default(),
        }
    }

    pub fn with_cap_and_hashers<const N: usize>(
        cap: usize,
        hashers: [Box<dyn BuildHasher<Hasher = DefaultHasher>>; N],
    ) -> Self {
        let hash_arr = HasherArray::from(hashers);
        BloomFilter {
            cap,
            bit_array: BitVec::repeat(false, cap),
            hashers: hash_arr,
            _phantom: Default::default(),
        }
    }
}
```

逻辑比较简单，这里不再赘述；

<br/>

### **Get/Set操作**

Get/Set 操作的实现如下：

```rust
impl<T: ?Sized + Hash> BloomFilter<T> {
    pub fn set(&mut self, item: &T) {
        for i in 0..self.hashers.len() {
            let bit_offset = self.calculate_hash(i, item) as usize;
            self.bit_array.set(bit_offset, true);
        }
    }

    pub fn might_contain(&self, item: &T) -> bool {
        for i in 0..self.hashers.len() {
            let bit_offset = self.calculate_hash(i, item) as usize;
            match self.bit_array.get(bit_offset) {
                None => return false,
                Some(res) => {
                    if !res {
                        return false;
                    }
                }
            }
        }
        true
    }

    fn calculate_hash(&self, idx: usize, item: &T) -> u64 {
        let mut hasher = self.hashers[idx].build_hasher();
        item.hash(&mut hasher);
        hasher.finish() % (self.cap as u64)
    }
}
```

**set 方法：**

-   遍历所有的 hasher，对每一个 hasher 使用 calculate_hash 内部方法计算 hash 值；
-   在 bit_array 中 set 对应的位；

**might_contain 方法：**

-   遍历所有的 hasher，对每一个 hasher 使用 calculate_hash 内部方法计算 hash 值；
-   如果某个 hash 值对应的位在 bit_array 为 false，则直接返回 false 即可！

实现起来是不是非常简单？

<br/>

## **测试**

下面进行测试：

```rust
#[cfg(test)]
mod tests {
    use std::collections::hash_map::RandomState;
    use crate::collection::bloom_filter::BloomFilter;

    #[test]
    fn test_filter() {
        let mut f: BloomFilter<String> = BloomFilter::with_capacity(102400);
        for x in 0..10000 {
            f.set(&x.to_string());
        }

        for x in 5000..15000 {
            if x < 10000 {
                assert!(f.might_contain(&x.to_string()));
            }
        }
    }
}
```

写入了 `0-10000` 的数据，然后遍历 `5000-15000`，则 10000 以下的都应当存在；

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/boost-rs/blob/main/boost-rs/src/collection/bloom_filter/mod.rs

参考文章：

-   https://en.wikipedia.org/wiki/Bloom_filter
-   https://juejin.cn/post/6855839313859461133
-   https://www.cnblogs.com/cpselvis/p/6265825.html
-   https://www.cnblogs.com/allensun/archive/2011/02/16/1956532.html


<br/>
