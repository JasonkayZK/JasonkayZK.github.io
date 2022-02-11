---
title: 一些学习Rust的总结
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?44'
date: 2022-02-11 10:03:44
categories: Rust
tags: [Rust]
description: 距离上一次写文章已经过去三个多月了，最近一直在研究Rust和K8S的源码；这里推荐一些我看过的Rust的入门书籍吧~
---

距离上一次写文章已经过去三个多月了，最近一直在研究Rust和K8S的源码；

这里推荐一些我看过的Rust的入门书籍吧~

源代码：

-   https://github.com/JasonkayZK/rust-learn

<br/>

<!--more-->

# **一些学习Rust的总结**

## **看过的书籍推荐**

一些入门书籍：

-   [The Rust Programming Language](https://doc.rust-lang.org/book/#the-rust-programming-language)
-   [Rust语言圣经(Rust教程 Rust Course)](https://course.rs/)
-   [Learn Rust With Entirely Too Many Linked Lists](https://rust-unofficial.github.io/too-many-lists/index.html#learn-rust-with-entirely-too-many-linked-lists)
-   [Rust编程之道](https://book.douban.com/subject/30418895/)

一些进阶书籍：

-   [Asynchronous Programming in Rust](https://rust-lang.github.io/async-book/)
-   [The Rustonomicon](https://doc.rust-lang.org/nomicon/)
-   [The Little Book of Rust Macros](https://veykril.github.io/tlborm/introduction.html)
-   [Unsafe Gotchas](https://exphp.github.io/unsafe-gotchas/intro.html)
-   [Rust设计模式](http://chuxiuhong.com/chuxiuhong-rust-patterns-zh/intro.html)

其他书籍/教程：

-   [Rust算法教程](https://algos.rs/about-book.html)
-   [How to build a Web Application with Rust](https://medium.com/tarkalabs/building-a-web-application-with-rust-part-i-configuration-c21319ae626e)

<br/>

## **一些目前在做的项目**

Project Space:

- [url-mapper-rs](https://github.com/JasonkayZK/rust-learn/tree/url-mapper-rs)

Learning Step:

- [Part I : Configuration](https://github.com/JasonkayZK/rust-learn/commit/12b88b1b5f5e02141ff90716feefea834817c34b)
- [Part II : Database Setup](https://github.com/JasonkayZK/rust-learn/commit/89327a61a4afda4e2fb9f55171889ee7fa205de5)
- [Part III - Database Manager: add mapper & tokio-async](https://github.com/JasonkayZK/rust-learn/commit/51120a38865911aa19a5fd4b093d077a40e95cd0)
- [Part IV: Basic Server & log tracing](https://github.com/JasonkayZK/rust-learn/commit/75267288ec824cd9b65f84245e14b37a9b4d5b4c)
- [Part V: Server and Database Manager communication](https://github.com/JasonkayZK/rust-learn/commit/cefc2ad7639c8359719cb639b9351c16db9e19d1)
- [Part VI - UrlMap CRUD API](https://github.com/JasonkayZK/rust-learn/commit/d77521b4c39ca953ef51cc75065f23a487ba6b12)
- [Part VII - Auth Middleware](https://github.com/JasonkayZK/rust-learn/commit/2da0d7d7ef20cf54bf4d01f4cc927e29ca5a58ea)
- [Part VIII - Containerization](https://github.com/JasonkayZK/rust-learn/commit/5d5cebcf69dccb809afb46b74dd6479991e511ae)
- [Part IX - Handling Signals & Deploying to Kubernetes](https://github.com/JasonkayZK/rust-learn/commit/03d3a5c76ad168da2ac3bd850e18bde6780d747f)
- [Part X - Frontend using Tera](https://github.com/JasonkayZK/rust-learn/commit/ad3828f69af89ea25092d8319bb6099cc357966f)
- [Part XI - React Front-End](https://github.com/JasonkayZK/rust-learn/commit/bdb21c2bff6ead55ba55554a51e0223e76453c60)

其他基础项目：

- [algorithm](https://github.com/JasonkayZK/rust-learn/tree/algorithm)
    - [sorting](https://github.com/JasonkayZK/rust-learn/tree/algorithm/algorithms/src/sorting)
        - [bubble_sort.rs](https://github.com/JasonkayZK/rust-learn/blob/algorithm/algorithms/src/sorting/bubble_sort.rs)
        - [insertion_sort.rs](https://github.com/JasonkayZK/rust-learn/blob/algorithm/algorithms/src/sorting/insertion_sort.rs)
        - [merge_sort.rs](https://github.com/JasonkayZK/rust-learn/blob/algorithm/algorithms/src/sorting/merge_sort.rs)
        - [quick_sort.rs](https://github.com/JasonkayZK/rust-learn/blob/algorithm/algorithms/src/sorting/quick_sort.rs)
        - [selection_sort.rs](https://github.com/JasonkayZK/rust-learn/blob/algorithm/algorithms/src/sorting/selection_sort.rs)
- [collection](https://github.com/JasonkayZK/rust-learn/tree/algorithm/collection)
    - [list](https://github.com/JasonkayZK/rust-learn/tree/algorithm/collection/src/list)
        - [vector.rs](https://github.com/JasonkayZK/rust-learn/blob/algorithm/collection/src/list/vector.rs)
        - [linked_list.rs](https://github.com/JasonkayZK/rust-learn/blob/algorithm/collection/src/list/linked_list.rs)
    - [tree](https://github.com/JasonkayZK/rust-learn/tree/algorithm/collection/src/tree)
        - [binary_search_tree.rs](https://github.com/JasonkayZK/rust-learn/blob/algorithm/collection/src/tree/binary_search_tree.rs)
- [concurrency](https://github.com/JasonkayZK/rust-learn/tree/algorithm/concurrency)
    - [my_arc.rs](https://github.com/JasonkayZK/rust-learn/blob/algorithm/concurrency/src/my_arc.rs)

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/rust-learn

<br/>
