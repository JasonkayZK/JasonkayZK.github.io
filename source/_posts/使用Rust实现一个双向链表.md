---
title: 使用Rust实现一个双向链表
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?77'
date: 2022-02-20 11:15:16
categories: Rust
tags: [Rust, 算法]
description: 如何激怒一个Rust爱好者？让他用Rust实现一个双向链表即可！总所周知，Rust中是不能同时存在两个可变引用的，所以在Rust中实现双向链表就会变得非常反人类（因为需要同时存在前后节点同时指向对方的情况）；同时，双向链表也引入了循环引用的问题，这也是导致内存难以释放的一个场景；没想到一个简简单单的双向链表居然涉及如此之多的问题！本文就使用Unsafe Rust实现了双向链表；
---



如何激怒一个Rust爱好者？让他用Rust实现一个双向链表即可！

总所周知，Rust中是不能同时存在两个可变引用的，所以在Rust中实现双向链表就会变得非常反人类（因为需要同时存在前后节点同时指向对方的情况）；

同时，双向链表也引入了循环引用的问题，这也是导致内存难以释放的一个场景；

没想到一个简简单单的双向链表居然涉及如此之多的问题！

本文就使用Unsafe Rust实现了双向链表；

源代码：

-   https://github.com/JasonkayZK/rust-learn/blob/algorithm/collection/src/list/linked_list.rs

<br/>

<!--more-->

# **使用Rust实现一个双向链表**

## **前言**

在阅读本文之前，请确保你有一定的Rust基础，至少：

-   大致读过了：[The Rust Programming Language](https://doc.rust-lang.org/book/#the-rust-programming-language)
-   对Rust中的Unsafe有一定了解，最好读过：[The Rustonomicon](https://doc.rust-lang.org/nomicon/)

对于链表的实现，在Rust中有多种方式，比如：

-   使用 `Box` 实现（由于 `Box` 本身的限制，基本只能实现单向链表）；
-   使用 `Rc + RefCell` 实现（由于 `RefCell` 的限制，迭代器无法很好的实现）；
-   使用 `Unsafe` 实现；

对于链表的实现，甚至专门有一本赫赫有名的书：

-   [Learn Rust With Entirely Too Many Linked Lists](https://rust-unofficial.github.io/too-many-lists/index.html#learn-rust-with-entirely-too-many-linked-lists)

推荐大家先阅读并跟着这本书实现其中的几种链表实现，再来阅读本文，相信你会有更多的收获！

>   这里也提供我学习[《Learn Rust With Entirely Too Many Linked Lists》](https://rust-unofficial.github.io/too-many-lists/index.html#learn-rust-with-entirely-too-many-linked-lists)这本书的源代码：
>
>   -   https://github.com/JasonkayZK/rust-learn/tree/algorithm/too-many-lists

那么，废话不多说，下面来使用 Unsafe Rust 实现一个双向链表吧！

<br/>

## **数据结构定义**

### **链表节点定义：Node**

链表的节点定义、构造函数和Into辅助函数如下：

```rust
struct Node<T> {
    val: T,
    next: Option<NonNull<Node<T>>>,
    prev: Option<NonNull<Node<T>>>,
}

impl<T> Node<T> {
    fn new(val: T) -> Node<T> {
        Node {
            val,
            prev: None,
            next: None,
        }
    }

    fn into_val(self: Box<Self>) -> T {
        self.val
    }
}
```

我知道你有很多的疑问，让我们一步一步来看；

首先，为了链表的通用性，泛型是必不可少的，因此 `Node` 中实际存放的值 `val` 为泛型 T 类型；

>   <font color="#f00">**注：此处 val 为泛型 T 类型，而非 `Option<T>` 类型；**</font>
>
>   <font color="#f00">**这也说明如果存在这个 Node，则该Node中必定是有值的，保证不会出现 Node 存在而 val 为 null 的情况；**</font>
>
>   <font color="#f00">**（取而代之，如果 val 的值为空，则这个 Node 就应该为 `None`）**</font>

<br/>

接下来，来看表示前一节点和后一节点的 `next` 和 `prev` 属性；

`next` 和 `prev` 的类型为：`Option<NonNull<Node<T>>>`，我们一层一层的来分析：

首先：**`Option<T>` 表示该节点为空，即不存在前置节点（整个链表为空时）、或不存在后置节点（链表的尾节点）；**

接下来，`NonNull` 为 Rust 中的一个内置类型，其是裸指针 `*mut T` 的一个包装，但是和 `*mut T` 裸指针的区别在于：

-   **`NonNull`类型即使从未解引用指针，指针也必须始终为非 null；这样一来，枚举就可以将此值用作判别（`Option<NonNull<T>>` 与 `*mut T` 具有相同的大小）； 但是，如果指针未解引用，它可能仍会悬垂！**
-   **与 `*mut T` 不同， `NonNull<T>` 可以作为 `T` 的协变；这样就可以在构建协变类型时使用 `NonNull<T>`，但是如果在实际上不应该协变的类型中使用，则会带来风险；**

>   **上述内容，摘自 `NonNull` 官方文档：**
>
>   -   https://doc.rust-lang.org/std/ptr/struct.NonNull.html

上面说的云里雾里的，那到底裸指针 `*mut T` 和 `NonNull` 有什么区别呢？

<font color="#f00">**简单来说就是 `NonNull` 提供了比 `*mut T` 更多的内容：支持协变类型、空指针优化，并且可以保证指针非空；**</font>

指针非空和空指针优化很好理解，但是这里需要补充一些关于变量类型协变的内容**（已经对协变比较属性的可以直接跳过）；**

<br/>

#### **补充知识：协变**

##### **OOP中的协变**

###### **① 构造器函数中的协变**

要讲 Rust 中的协变，首先要从面向对象说起了（很多编程语言都存在协变，如`C#`）；

在 OOP 中，协变很好理解：

例如，如果 `Cat` 是 `Animal` 的子类型，那么`Cat`类型的表达式可用于任何出现`Animal`类型表达式的地方；

>   **可以说：**
>
>   <font color="#f00">**当我们基于 `Animal` 定义 `Cat` 的时候，`Cat` 相对于 `Animal` 的[内涵增加了，而外延收缩](https://www.zhihu.com/question/22267682/answer/28974249)了；**</font>
>
>   <font color="#f00">**并且可以认为：我们至少可以说一个猫是一个动物。所以猫是动物的子类型，记作 `Cat: Animal`；**</font>
>
>   因为猫至少是一个动物，那么对于所有需要任何动物的地方，我都可以给一只猫：
>
>   ```ts
>   function schrödinger(sample: Animal) -> bool { ... }
>   let cat = new Cat();
>   const alive = schrödinger(cat);
>   ```
>
>   **也就是说：当 `T: U` 的时候，任何需要形式参数 `a: U` 的函数，我们都能给一个实际参数 `a: T`；**
>
>   <font color="#f00">**这是因为：子类型至少可以被当作它的超类型；**</font>

所谓的 **变型（variance）** 是指：如何根据组成类型之间的子类型关系，来确定更复杂的类型之间（例如 `Cat` 数组之于`Animal`数组，返回值为 `Cat` 的函数之于返回值为 `Animal` 的函数...等等）的子类型关系；

当我们用类型构造出更复杂的类型，原本类型的子类型性质可能被保持、反转、或忽略，取决于[类型构造器](https://zh.wikipedia.org/wiki/型別構造器)的变型性质；

>   **类型构造器就是一些带有泛型/模板参数的类型；当填满了参数，才会成为一个实际的类型；**
>
>   比如：很简单的「笼子」就是 `Cage<T>`，其中 `T` 就是类型参数；
>
>   还有容器类型，比如 `List<T>`；

现在回顾一下，我们现在知道一些类型之间的关系，也即是说我们知道 `Cat` 是 `Animal` 的子类型；那么对于任意的（一元）类型构造器 `M`， `M<Cat>` 和 `M<Animal>` 可能会有什么关系呢？（[Wiki](https://link.zhihu.com/?target=https%3A//zh.wikipedia.org/wiki/%E5%8D%8F%E5%8F%98%E4%B8%8E%E9%80%86%E5%8F%98)）

-   **协变（covariance）：`M<Cat>: M<Animal>` 它们维持内部参数的关系不变；**
-   **逆变（contravariance）：`M<Animal>: M<Cat>` 它们的关系被反转了；**
-   **不变（invariance）：两者没有任何子类型关系；**

直觉上来说，只要有协变就够了：

薛定谔想要一个笼子，里面装着一种动物，他不关心是什么动物（`Cage<Animal>`），你给薛定谔一只装着猫的笼子（`Cage<Cat>`），薛定谔把这个猫当作一种动物做实验；

也就是说在需要 `Cage<Animal>` 的地方都可以给一个 `Cage<Cat>` ；

然而，这显然是不对的！

考虑这样一个情况：

```ts
let cage: Cage<Cat> = new Cage();
function capture(x: Cage<Animal>) {
	x.inner = new Dog();
}
capture(cat);
```

因为协变规则，对 `capture` 来说笼子是： `Cage<Animal>`，往笼子里塞一个狗，完全没问题；

但是对于调用者来说，笼子的类型还是 `Cage<Cat>`，这就破坏了类型安全：你接下来的代码期望这是装猫的笼子，其实里面装了一个狗！

<font color="#f00">**所以：如果一个容器是只读的，才能协变，不然很容易就能把一些特殊的容器协变到更一般的容器，再往里面塞进不应该塞的类型；**</font>

再考虑 `Cage<T>` 对 `T` 逆变的情况：`Cage<Animal>: Cage<Dog>`；

也就是说当函数需要 `Cage<Dog>`的时候，总能传给函数一个 `Cage<Animal>`，函数当作 `Cage<Dog>` 来处理！

一般来说这很荒谬，`Cage<Animal>` 里面的动物可能是一只猫，强行当作一个狗来处理肯定会爆炸；

但是对于上面的 `capture` 函数是有意义的，它不关心笼子里有什么，只往里面塞一个准备好的狗，也就是说：<font color="#f00">**对于只写的类型可以用逆变；**</font>

<font color="#f00">**那么对于可读又可写的类型，当然就是不变了：我们不能做出任何假定，不然有可能爆炸；****</font>

<br/>

###### **② 一般函数中的协变**

还有一种特殊的类型，规则有点奇异，那就是**函数类型**：考虑一元函数，按照函数的箭头记法，把函数类型记作 `T -> U`，其中 `T` 是逆变的而 `U` 是协变的；

返回值是协变的很好理解：我需要函数 `F` 最终返回一只动物，那么最终返回一只猫的函数是可接受的；（可以不断地扩大类型域）

当参数是逆变可能有点奇怪了：考虑需要计算猫的年龄的情况： `Cat -> Age`：

给一个通用的，可以计算所有动物的年龄的函数 `Animal -> Age` 来代替也是很好的：`Animal -> Age` 的定义域 `Animal` 中那些 `Cat` 以外的值被截取掉了（我们只会传 `Cat`），就变成很棒的 `Cat -> Age`；

所以任何时候，对需要一个一元函数 `T: U, T -> V` 的情况，它的参数 `T` 可以用 `U` 来代替，只需要简单地无视 `U` 类型除 `T` 以外的取值就行了；

>   **下面一段话摘自维基百科，说的是同一个意思：**
>
>   <font color="#f00">**某些编程语言需要指明什么时候一个函数类型是另一个函数类型的子类型，也就是说：在一个期望某个函数类型的上下文中，什么时候可以安全地使用另一个函数类型；**</font>
>
>   <font color="#f00">**我们可以说：函数f 可以安全替换函数g，如果与函数g 相比，函数f 接受更一般的参数类型，返回更特化的结果类型；**</font>
>
>   例如：
>
>   函数类型`Cat->Cat`可安全用于期望 `Cat->Animal` 的地方；
>
>   类似地，函数类型 `Animal->Animal` 可用于期望 `Cat->Animal` 的地方；
>
>   典型地，在 `Animal a=Fn(Cat(...))` 这种语境下进行调用，由于 Cat 是 Animal 的子类，所以即使 Fn 接受一只 Animal 也同样是安全的！
>
>   一般规则是：
>
>   >   **S1 → S2 ≦ T1 → T2 当T1 ≦ S1且S2 ≦ T2**
>
>   换句话说，**类型构造符→对输入类型是逆变的而对输出类型是协变的；**
>
>   这一规则首先被[Luca Cardelli正式提出](https://zh.wikipedia.org/wiki/协变与逆变#cite_note-1)；

综合起来，也就是说：

![rust-double-linked-list-1.svg](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/rust-double-linked-list-1.svg)

<br/>

##### **Rust中的三种变化**

上面讲述了 OOP 中的协变，再来看 Rust 对于协变的定义；

众所周知，Rust 中是不存在类似于 OOP 中的继承的（不光Rust没有，同一时期的Go等语言都没有！），不算Trait的话，结构体或者枚举之间也都没有子类型关系；

但是Rust中有 `lifetime`，`lifetime`是和通常类型平行的另一套类型（另一个范畴），而**Rust中的子类型就是对于lifetime而言的！**

<br/>

###### **Rust中的子类型**

子类型是一种序关系，不一定是像继承那样的超类型直接包含子类型（动物包含猫）；

在 lifetime 中，外层的 lifetime 是它所包含的内层 lifetime 的子类型： `'big: 'small`：

>   <font color="#f00">**注意：`外层的 lifetime 是它所包含的内层 lifetime 的子类型`，这里的顺序和直觉上是相反的！**</font>

如下图所示：

![rust-double-linked-list-2.jpg](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/rust-double-linked-list-2.jpg)

这张图中的子类型关系应当是：

-   `'static: 'big: 'small_1`；
-   `'static: 'big: 'small_2`；

**即：`'static` 是所有lifetime的子类型！**

>   **lifetime 就是作用域，作用域是很标准的嵌套关系，所以Rust的规则有点反直觉；**
>
>   对于集合，子集扩张到超集往往是恰当的，但一个作用域本身不应该被当作一个集合；
>
>   我们可以说：一只猫**至少**是一个动物；
>
>   但对于lifetime：不能说 `'small_1` **至少**是 `'big`，而应该说 `'big` **至少**是`'small_1`，也**至少**是 `'small_2`；

<font color="#f00">**lifetime 存在的意义就是：界定资源不应该超出一个范围，也就是说：扩张 lifetime 往往是危险的，而收缩（只读引用）lifetime是安全的；**</font>

>   **此处如果遵循直觉，按照嵌套关系排列：**
>
>   **也就是 `'small_1: 'big: 'static`，小的作用域 `'small_1` 就可以协变到全局作用域 `'static` ；**
>
>   **那么在被读取的对象被销毁后，编译器还允许代码继续试图读取它，就会爆炸，整个lifetime系统就失效了！**

可以通过下面几个方式来理解：

1.  **`'small_1` 的 lifetime 代表「包含 `'small_1` 的作用域的集合」；而 `'static` 就是「包含全局作用域的集合」只有一个元素；所以很显然后者是前者的子集，因为全局作用域包含了 `'small_1`；**
2.  **越小的作用域，包含了它的外层作用域就越多；**
3.  **lifetime 类型所关联的作用域是内涵而不是外延，内涵增多则外延减少；正如 `Cat` 就是 `Animal` 增多内涵而来的，它的外延只有各种猫，而 `Animal` 的外延有各种动物；**

<br/>

###### **Rust中的逆变、协变、不变**

>   **[死灵书：subtype](https%3A//doc.rust-lang.org/nomicon/subtyping.html)原文详细地讲了这一块！**

简而言之，在Rust中：

-   <font color="#f00">**协变（covariance）：`M<'small>: M<'small>` 即维持 lifetime 越来越收紧；**</font>
-   <font color="#f00">**逆变（contravariance）：`M<'big>: M<'small>`，lifetime反转，在Rust中非常少见！**</font>
-   <font color="#f00">**不变（invariance）：两者的 lifetime 并没有直接关系；**</font>

我们已知：

**`&` 和 `&mut` 都是一个类型构造器，接受一个lifetime `'a` 和另一个类型 `T`：**

有一般规律：

-   <font color="#f00">**① `&'a T` 对 `'a` 和 `T` 协变，因为 `&` 是只读的，传参数的时候，试图收缩lifetime是安全的；**</font>

-   <font color="#f00">**② `&'a mut T` 对 `'a` 协变，对 `T` 不变：**</font>

这是因为：传参数的时候，收紧一个可变作用域的范围是安全的，调用者还维持着未收紧的作用域；

-   <font color="#f00">**③ `fn(T) -> U` 是对 `T` 逆变对 `U` 协变：**</font>

原因和上文所述一样：当传入的参数是一个函数的时候，我们可以安全地收缩这个函数的定义域，扩张这个函数的陪域，**除此处外Rust中应该没有逆变；**

-   <font color="#f00">**④ 只读或拥有（owning）的容器都是协变的，如：`Box`, `Vec`都是协变的：**</font>

这在别的语言中会爆炸，但是Rust对可变性的限制导致可以安全地当作协变：

当我们拿到一个容器的所有权的时候，外部别处就无法访问了，可以安全地对它协变而不用担心爆炸；

-   <font color="#f00">**⑤ `Cell<T>``RefCell<T>`，在内部是可读写的，所以是不变；**</font>

正如文中的例子一样：

```rust
fn overwrite<T: Copy>(covarianced: &mut T, short: &mut T) {
    *covarianced = *short;
}

fn main() {
    let mut forever: &'static str = " 我会活到世界末日 ";
    'small {
        let short = String::from(" 我马上死了 ");
        overwrite(&mut forever, &mut &*short);
    }
    // 爆炸！用到了已经被释放的内存
    println!("{}", forever);
}
```

如果在一次函数调用时：

一个 `forever: &mut &'static T` 能够协变到 `covarianced: &mut &'small T` ，我们就可以把一个 `short: &'small T` 存进协变后的参数 `covarianced: &mut &'small T`；

这对于调用者来说，引用 `covarianced` 的类型依然是 `&mut &'static T`，却存了一个更短命的引用 `short`；

当 `short` 被销毁的时候，`a` 还维持着引用，就…会炸；

至于这里为什么不能用逆变，原因很简单，就是 `&mut T` ，`T` 是可读可写的，如果能扩张 `T` 的作用域（逆变），读取出来存到别的地方还是会炸；

>   if variance would allow you to store a short-lived value in a longer-lived slot, then invariance must be used.

>   具体协变、逆变和不变相关内容可以阅读：
>
>   -   [维基百科-协变与逆变](https://zh.wikipedia.org/wiki/%E5%8D%8F%E5%8F%98%E4%B8%8E%E9%80%86%E5%8F%98)
>   -   https://doc.rust-lang.org/nomicon/vec/vec-layout.html
>   -   [逆变、协变与子类型，以及Rust](https://zhuanlan.zhihu.com/p/41814387)
>   -   [死灵书：lifetime的子类型及逆变协变](https://link.zhihu.com/?target=https%3A//doc.rust-lang.org/nomicon/subtyping.html)
>   -   [Variance in Rust: An intuitive explanation](https://ehsanmkermani.com/2019/03/16/variance-in-rust-an-intuitive-explanation/)

<br/>

##### **`NonNull`和`*mut`**

NonNull的官方注释如下：

```
*mut T but non-zero and covariant.
This is often the correct thing to use when building data structures using raw pointers, but is ultimately more dangerous to use because of its additional properties. If you're not sure if you should use NonNull<T>, just use *mut T!
Unlike *mut T, the pointer must always be non-null, even if the pointer is never dereferenced. This is so that enums may use this forbidden value as a discriminant -- Option<NonNull<T>> has the same size as *mut T. However the pointer may still dangle if it isn't dereferenced.
Unlike *mut T, NonNull<T> was chosen to be covariant over T. This makes it possible to use NonNull<T> when building covariant types, but introduces the risk of unsoundness if used in a type that shouldn't actually be covariant. (The opposite choice was made for *mut T even though technically the unsoundness could only be caused by calling unsafe functions.)
Covariance is correct for most safe abstractions, such as Box, Rc, Arc, Vec, and LinkedList. This is the case because they provide a public API that follows the normal shared XOR mutable rules of Rust.
If your type cannot safely be covariant, you must ensure it contains some additional field to provide invariance. Often this field will be a PhantomData type like PhantomData<Cell<T>> or PhantomData<&'a mut T>.
Notice that NonNull<T> has a From instance for &T. However, this does not change the fact that mutating through a (pointer derived from a) shared reference is undefined behavior unless the mutation happens inside an UnsafeCell<T>. The same goes for creating a mutable reference from a shared reference. When using this From instance without an UnsafeCell<T>, it is your responsibility to ensure that as_mut is never called, and as_ptr is never used for mutation.
```

**首先，NonNull就是 `*mut T`，但是不会等于零；**

随后，NonNull是协变：**【即有一个子生命周期`Small`和父生命周期 `Longer`，NonNull维持了 `NonNull<Small>` 也是`NonNull<Longer>`的生命周期的关系！】；**

**同时，`NonNull<T>` 不会拥有 `T`，因为其本身只是一个指针`*mut T`，没有拥有的语义；**

>   **因此需要借助 PhantomData 进行标注；**

**最后，NonNull 可以做空指针优化：**

>   `Option<Rc<T>>`跟`Rc<T>`占用相同的内存大小，这个叫[discriminant elision](https://link.zhihu.com/?target=https%3A//rust-lang.github.io/unsafe-code-guidelines/layout/enums.html%23discriminant-elision-on-option-like-enums)；
>
>   **空指针优化能够实现的原因在于：**
>
>   <font color="#f00">**因为 enum 通常需要一个标志（discriminant）来区分究竟是哪一个variant，但是Option只有两个variant的enum，其中一个variant，有一些非法的值（叫niches），这些非法的值可以充当None一样的variant，所以就不用标志了，从而enum与variant占用一样的大小；**</font>

<br/>

最后，再来回顾 `next` 和 `prev` 的类型为：`Option<NonNull<Node<T>>>`；

即， `next` 和 `prev` 最终指向了另一个和自己相同的类型：`Node<T>`；

这是合理的，因为在整个 `Node` 类型中，所有的属性的大小在编译期都是可以被确定的**（泛型类型T 在编译器被绑定，而 `next` 和 `prev` 为两个固定大小的裸指针）**！

```rust
struct Node<T> {
    val: T,
    next: Option<NonNull<Node<T>>>,
    prev: Option<NonNull<Node<T>>>,
}
```

>   **注意：Rust的编译器要求，在编译期所有的属性的大小都是确定的！**
>
>   例如，下面的代码是无法通过编译的：
>
>   ```rust
>   struct WrongNode<T> {
>       data: T,
>       next: WrongNode<T>,
>   }
>   ```
>
>   因为 `next` 字段拥有的大小可能是无限的，无法计算；
>
>   这也是为什么通常情况下，单向链表需要借助智能指针 Box 将结构体转化为指针：
>
>   ```rust
>   struct WrongNode<T> {
>       data: T,
>       next: Box<WrongNode<T>>,
>   }
>   ```
>
>   **但是在双向链表中，使用 Box 是行不通的，因为会出现一个节点同时存在多个可变引用的情况，因此需要使用裸指针；**

最后，一个简单的构造函数，和 into 转换函数，用于将 Box 中的 `Node<T>` 转为含有所有权的 `T` 类型，这个函数下面会用到：

```rust
impl<T> Node<T> {
    fn new(val: T) -> Node<T> {
        Node {
            val,
            prev: None,
            next: None,
        }
    }

    fn into_val(self: Box<Self>) -> T {
        self.val
    }
}
```

链表节点的具体内容大概就是这么多，接下来我们来看整个双向链表的定义；

<br/>

### **双向链表定义：LinkedList**

双向链表的定义如下：

```rust
pub struct LinkedList<T> {
    length: usize,
    head: Option<NonNull<Node<T>>>,
    tail: Option<NonNull<Node<T>>>,
    _marker: PhantomData<Box<Node<T>>>,
}
```

在双向链表中，定义了：

-   **链表的头尾节点：**`head` 和 `tail`，类型和上面的 `Node` 内部的指针一样：`Option<NonNull<Node<T>>>`，这里不再介绍；
-   **length：**维护双向链表的当前长度；

重点来看一下：**_marker**；

**_marker** 被声明为 `PhantomData<Box<Node<T>>>` 类型，对于 PhantomData 的说明如下：

```
Zero-sized type used to mark things that "act like" they own a T.
Adding a PhantomData<T> field to your type tells the compiler that your type acts as though it stores a value of type T, even though it doesn't really. This information is used when computing certain safety properties.
```

即 **_marker** 是一个标注字段，其目的就是告诉编译器：LinkedList 拥有 `Box<Node<T>>`，明示编译器我们很可能在LinkedList 的 drop 函数里面也 drop 掉 `Box<Node<T>>`；

>   一个比较常见的场景如下：
>
>   **由于在 LinkedList 中，`head` 和 `tail` 都以指针的形式存在；**
>
>   **而在实现迭代器时，必须要求标注当前泛型 `T` 的声明周期，此时我们就需要通过使用`PhantomData` 对变量的所有权进行声明，并对生命周期进行标注！**

以上就是我们要实现的双向链表的完整定义；

>   **需要注意的是：**
>
>   <font color="#f00">**为了体现封装性，Node 和 LinkedList 中的所有字段都是对外不可见的！**</font>

接下来我们会逐步实现双向链表的相关API，并尽量对性能做优化；

<br/>

## **具体方法实现**

### **① 构造函数：new()和Default Trait**

构造函数的实现非常简单：

```rust
impl<T> LinkedList<T> {
    pub fn new() -> Self {
        Self {
            length: 0,
            head: None,
            tail: None,
            _marker: PhantomData,
        }
    }
}

impl<T> Default for LinkedList<T> {
    fn default() -> Self {
        Self::new()
    }
}
```

在 `new()` 方法中，我们直接创建了一个 LinkedList 类型的对象（**此处的`Self`代指的就是 LinkedList 类型**）并返回；

>   **注意到：**
>
>   **在给`_marker`进行赋值时，我们直接使用了PhantomData；**
>
>   <red>**这是因为实际上PhantomData是一个ZST（Zero-Size Type），即无内存大小类型；**</font>
>
>   从 `PhantomData` 的定义中我们也能看出来：
>
>   ```rust
>   #[lang = "phantom_data"]
>   #[stable(feature = "rust1", since = "1.0.0")]
>   pub struct PhantomData<T: ?Sized>;
>   ```
>
>   <red>**得益于Rust的优化，这些结构体在编译后都是不会占用内存大小的！**</font>
>
>   <red>**因此，我们的 `_marker` 字段在编译后，甚至不会占用内存空间！**</font>

接下来，我们为 LinkedList 简单实现了 `Default` Trait，这使得我们可以通过两种方式创建出一个 LinkedList：

```rust
let list: LinkedList<i32> = LinkedList::default();
let list: LinkedList<i32> = LinkedList::new();
```

<br/>

### **② 首尾压入元素：push()**

在将一个元素压入双向链表时，需要注意：我们需要获取元素完整的所有权；

具体在链表头部压入元素的代码如下：

```rust
/// Adds the given node to the front of the list.
pub fn push_front(&mut self, val: T) {
    // Use box to help generate raw ptr
    let mut node = Box::new(Node::new(val));
    node.next = self.head;
    node.prev = None;
    let node = NonNull::new(Box::into_raw(node));

    match self.head {
        None => self.tail = node,
        Some(head) => unsafe { (*head.as_ptr()).prev = node },
    }

    self.head = node;
    self.length += 1;
}
```

首先，我们使用入参中的 `val` 创建了一个链表节点Node，并使用 `Box` 包装（**这么做是方便我们后面直接从 Box 获取到裸指针**）；

随后，对 node 进行赋值：

由于是在头部插入，因此新节点的下一个元素便是当前链表的头节点，而新节点的上一个元素是空（因为当前节点会成为新的链表的头节点）；

>   **这里得益于Rust中各种智能指针都实现了 `Deref` Trait，并且编译器会对具体的类型进行一系列 `ref/deref` 的类型推导（这一点和Golang极为相似）；**
>
>   **因此，尽管我们使用 `Box` 对 Node 进行了一层包装，但 node 使用起来和未包装的体验完全一致！**

接下来，使用 `Box::into_raw(node)`，将 node 转为裸指针；

下面是 `Box::into_raw` 的官方文档：

```
Consumes the Box, returning a wrapped raw pointer.
消费Box，并返回一个裸指针。

The pointer will be properly aligned and non-null.
（函数保证）指针在内存中正确对齐并且非空。

After calling this function, the caller is responsible for the memory previously managed by the Box. 
调用此函数后，调用者负责之前由 Box 管理的内存。

In particular, the caller should properly destroy T and release the memory, taking into account the memory layout used by Box. The easiest way to do this is to convert the raw pointer back into a Box with the Box::from_raw function, allowing the Box destructor to perform the cleanup.
特别是，调用者应该适当地销毁 T 并释放内存，同时考虑到 Box 使用的内存布局。最简单的方法是使用 Box::from_raw 函数将原始指针转换回 Box，从而允许 Box 析构函数执行清理。

Note: this is an associated function, which means that you have to call it as Box::into_raw(b) instead of b.into_raw(). This is so that there is no conflict with a method on the inner type.
注意：这是一个关联函数，这意味着您必须将其称为 Box::into_raw(b) 而不是 b.into_raw()。这样就不会与内部类型的方法发生冲突。
```

可以看到，**当对某个被 Box 包装的变量调用了 `Box::into_raw` 后，变量将会被转化为裸指针，同时指针指向的内存的管理权会被交给我们自己；**

什么意思呢？

**通常情况下在Rust中，当一个变量退出了自己的作用域后，Rust便会自动调用其 `drop` 函数释放其占用的内存（这也是为什么尽管Rust没有GC，没有free函数，也能保证内存的安全的原因）；**

但是如果我们对某个被 Box 包装的变量调用了 `Box::into_raw` 后，之前的变量便被转为了一个裸指针！

此时我们只能通过这个裸指针去访问原来的变量；

>   **实际上 `Box::new()` 就是创建了一个指向具体变量值的指针；**
>
>   **而 Box 作为智能指针，在退出作用域后，会直接释放指针的内存，以及指针指向的变量的内存（类似于C++中的 unique_prt ）**

`Box::into_raw` 所做的其实就是消费掉 Box 并返回指针，并且保证不会像 Box 退出作用域后释放指针指向的内存（**否则暴露的指针指向的是野内存，之后取数据会出问题，并且释放也会出问题！**）；

**因此，需要我们自己保存这个裸指针，并在适当时候释放这个裸指针指向的内存！**

那么如何释放由 Box 转换所得的裸指针指向的内存呢？

文档写的也非常清楚：

<red>**最简单的方法是使用 `Box::from_raw` 函数将原始指针转换回 Box，从而允许 Box 析构函数执行清理；**</font>

<red>**所以我们只需要将裸指针再转为实际的 Box，然后通过 Box 退出作用域后直接释放内存即可；**</font>

>   **注：上面的技巧在 Unsafe Rust 中非常常见！**
>
>   **在下面的代码中，我们会大量使用！**

<br/>

在将 node 转为裸指针后，接下来判断当前链表的头节点是否为空：

```rust
match self.head {
    None => self.tail = node,
    Some(head) => unsafe { (*head.as_ptr()).prev = node },
}
```

如果为空，则将链表的尾节点也指向这个新节点即可；

如果头节点不为空，则需要将当前链表头节点的前一个元素赋值为新的节点；

**注意，这里使用到了 `unsafe`，因为我们需要将链表中的头指针 `head` 裸指针进行解引用并修改其 `prev` 值；**

>   <red>**Rust中，只有五类可以在 Unsafe Rust 中进行而不能在 Safe Rust 中进行的操作：**</font>
>
>   -   **解引用裸指针**
>   -   **调用不安全的函数或方法**
>   -   **访问或修改可变静态变量**
>   -   **实现不安全 trait**
>   -   **访问 `union` 的字段**
>
>   同时，**`unsafe` 并不会关闭借用检查器或禁用任何其他 Rust 安全检查：如果在不安全代码中使用引用，它仍会被检查；`unsafe` 关键字只是提供了那五个不会被编译器检查内存安全的功能，你仍然能在不安全块中获得某种程度的安全；**
>
>   再者，**`unsafe` 不意味着块中的代码就一定是危险的或者必然导致内存安全问题：其意图在于作为程序员你将会确保 `unsafe` 块中的代码以有效的方式访问内存；**

在修改了当前链表头节点的 `prev` 后，我们将新的节点设为链表的头节点，然后将链表长度加一，便完成了：

```rust
self.head = node;
self.length += 1;
```

<br/>

相对应的，我们有 `push_back`：

```rust
pub fn push_back(&mut self, val: T) {
    // Use box to help generate raw ptr
    let mut node = Box::new(Node::new(val));
    node.next = None;
    node.prev = self.tail;
    let node = NonNull::new(Box::into_raw(node));

    match self.tail {
        None => self.head = node,
        // Not creating new mutable (unique!) references overlapping `element`.
        Some(tail) => unsafe { (*tail.as_ptr()).next = node },
    }

    self.tail = node;
    self.length += 1;
}
```

和上面非常类似，这里不多赘述了；

<br/>

### **③ 首尾弹出元素：pop()**

`pop()` 函数会将头部或者尾部的元素弹出；

所谓弹出就是：将元素从链表中删除，并且返回具有所有权的 `T`（如果存在的话）；

同时，为了确切的表达是否存在元素，返回值我们使用 `Option<T>` 类型表示；

下面来实现从头部弹出元素的方法 `pop_front`；

代码如下所示：

```rust
/// Removes the first element and returns it, or `None` if the list is
/// empty.
///
/// This operation should compute in *O*(1) time.
pub fn pop_front(&mut self) -> Option<T> {
    self.head.map(|node| {
        self.length -= 1;

        unsafe {
            let node = Box::from_raw(node.as_ptr());

            self.head = node.next;

            match self.head {
                None => self.tail = None,
                Some(head) => (*head.as_ptr()).prev = None,
            }
            node.into_val()
        }
    })
}
```

>   **注意到上面的代码风格，只是调用了 `self.head.map()` 即完成了所有功能；**
>
>   **这种函数式编程的风格在Rust中非常常见；**

#### **补充内容：Option**

在解释上面的代码之前，这里需要补充一些关于 `Option` 的知识：

在 Rust 中所有的变量一定都不为 Null，即不会发生空指针；

例如，下面的结构体：

```rust
struct Foo {
    x: String,
    y: String,
}

let foo = Foo {
    x: "foo".to_string(),
    y: "bar".to_string(),
};
```

如果不对 x 或 y 初始化，则将导致编译错误！

**而 Null 值的语义就是通过枚举类型 Option 来显示标注的！**

Option 的定义如下：

```rust
#[derive(Copy, PartialEq, PartialOrd, Eq, Ord, Debug, Hash)]
#[rustc_diagnostic_item = "Option"]
#[stable(feature = "rust1", since = "1.0.0")]
pub enum Option<T> {
    /// No value.
    #[lang = "None"]
    #[stable(feature = "rust1", since = "1.0.0")]
    None,
    /// Some value of type `T`.
    #[lang = "Some"]
    #[stable(feature = "rust1", since = "1.0.0")]
    Some(#[stable(feature = "rust1", since = "1.0.0")] T),
}
```

其中，`None` 即对应了语义上的 `Null`，而 `Some(T)` 表示存在一个值；

>   <red>**注意到，在 Option 中也存在空指针优化！**</font>
>
>   <red>**因此 `Option<T>` 占用的内存大小和 `T` 是完全相同的！**</font>

>   <red>**枚举 Option 在设计上的思考：**</font>
>
>   <red>**如果你确定某个变量一定不为空，则无需使用 Option 来包装类型，此时在使用时，完全不需要担心会产生空指针等异常；**</font>
>
>   <red>**只有在你不确定某个变量是否一定有值时，才需要使用 Option 进行包装；**</font>
>
>   在使用 Option 时：
>
>   <red>**由于 `Option<T>` 类型和 `T` 类型是完全不同的两个类型，Rust 会要求使用者显式的处理空指针的情况（取值为`None`的情况），因此极大的避免了空指针的行为！**</font>
>
>   见：
>
>   -   [后悔发明Null：堪称CS史上最严重错误，至少造成10亿美金损失](https://cloud.tencent.com/developer/article/1677524)

例如，修改上面的例子：

```rust
struct Foo {
    x: Option<String>,
    y: Option<String>,
}

let foo = Foo {
    x: Option::from("foo".to_string()),
    y: None,
};
```

此时就可以表示一个None值；

<br/>

简单介绍了 `Option` 后，下面来看一下 `self.head.map()`；

在 Rust 中，可能会存在很多 Option，如果需要将一个 Option 进行处理后，再返回另一个 Option 通常需要三个步骤：

`判断 Option A 是 Some` => `解出 A` => `处理A，得到结果B` => `判断B是否为None` => `包装并返回 Option B`

整个步骤异常繁杂：

```rust
struct Foo {
    x: Option<String>,
    y: Option<String>,
}

let a = Foo {
    x: Option::from("foo".to_string()),
    y: None,
};

let mut b: String = "".to_string();
if a.x.is_some() {
    b = a.x.unwrap();
}

let res = if b.ends_with("0") {
    Some(b)
} else {
    None
};

println!("{:?}", res); // None
```

考虑到这种场景非常常见，因此 Rust 在 Option 中提供了 `map` 方法：

```rust
pub const fn map<U, F>(self, f: F) -> Option<U>
where
F: ~const FnOnce(T) -> U,
F: ~const Drop,
{
    match self {
        Some(x) => Some(f(x)),
        None => None,
    }
}
```

用于将一个 `Option<T>` 类型转换为 `Option<U>` 类型；

因此，上面的例子可以直接被简化为：

```rust
let res = a.x.map(|str| {
    if str.ends_with("o") {
        str
    } else {
        None
    }
});
```

<br/>

经过上面的补充知识可以知道，`self.head.map()` 会处理整个弹出逻辑，并将头节点转换为返回值弹出；

如果 head 为空，`map` 函数会直接返回 None；

下面具体来看 `map` 函数中 Lambda表达式的逻辑：

```rust
|node| {
    self.length -= 1;

    unsafe {
        let node = Box::from_raw(node.as_ptr());

        self.head = node.next;

        match self.head {
            None => self.tail = None,
            Some(head) => (*head.as_ptr()).prev = None,
        }
        node.into_val()
    }
}
```

此时，node 表示已经从 Option 中解出来的类型，即：`NonNull<Node<T>>`，裸指针类型；

根据我们之前说的，首先使用 `Box::from_raw` 将裸指针还原为 `Box<Node<T>>` 类型（为返回头节点数据做准备）；

然后将链表的头节点指向当前节点的下一个节点；

随后，修改链表头节点的内容：

判断当前链表头节点是否为 None（弹出元素后是否变为空链表）：

-   如果链表为空，则将尾节点也置为 `None`；
-   否则链表不为空，将当前链表头节点的 `prev` 置为 `None`（表示当前 节点已经变为链表的头节点）；

最后，使用前文提到的 `into_val` 函数，将 `Box<Node<T>>` 中的值取出，完成；

<br/>

同样的，尾部弹出一个元素：

```rust
/// Removes the last element from a list and returns it, or `None` if
/// it is empty.
///
/// This operation should compute in *O*(1) time.
pub fn pop_back(&mut self) -> Option<T> {
  self.tail.map(|node| {
    self.length -= 1;

    unsafe {
      let node = Box::from_raw(node.as_ptr());

      self.tail = node.prev;

      match self.tail {
        None => self.head = None,
        Some(tail) => (*tail.as_ptr()).next = None,
      }
      node.into_val()
    }
  })
}
```

<br/>

### **④ 查看首尾元素：peek()**

由于在 Rust 中是区分元素所有权，并且区分可变和不可变引用的（未标注 `mut` 默认为不可变引用）；

因此在 Rust 中实现 `peek()` 和在其他编程语言中略有不同！

我们需要分别实现：

-   `peek()`：返回不可变引用类型；
-   `peek_mut()`：返回可变引用类型；

>   <red>**需要注意的是：上面两个方法仅仅返回元素的引用，而元素的所有权还是在链表中；**</font>

#### **实现 `peek_front()`**

先来实现 `peek_front()`，代码如下：

```rust
pub fn peek_front(&self) -> Option<&T> {
    unsafe {
      self.head.as_ref().map(|node| &node.as_ref().val)
    }
}
```

代码非常简洁，只有一行；我们一个方法一个方法的来看；

首先，











<br/>











<br/>

## **总结**

呼呼~！你终于在 Rust 中实现了一个令人满意的双向链表！

经过了实现这个双向链表，我想你应该能学到下面这么多内容：

-   Unsafe 用法；
-   Rust 中部分类型的用法：
    -   NonNull；
    -   PhantomData；
    -   Option；
    -   ……
-   Rust 中的 Default；
-   Rust 中的 单元测试、文档测试以及文档注释；
-   Rust 中的三种迭代器：IntoIter、Iter 和 IterMut；
-   Rust 中的错误处理以及如何自定义错误类型；
-   ……

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/rust-learn/blob/algorithm/collection/src/list/linked_list.rs
-   https://github.com/JasonkayZK/rust-learn/tree/algorithm/too-many-lists

相关书籍推荐：

-   [The Rust Programming Language](https://doc.rust-lang.org/book/#the-rust-programming-language)
-   [Rust语言圣经(Rust教程 Rust Course)](https://course.rs/)
-   [Learn Rust With Entirely Too Many Linked Lists](https://rust-unofficial.github.io/too-many-lists/index.html#learn-rust-with-entirely-too-many-linked-lists)
-   [The Rustonomicon](https://doc.rust-lang.org/nomicon/)
-   [Unsafe Gotchas](https://exphp.github.io/unsafe-gotchas/intro.html)

<br/>
