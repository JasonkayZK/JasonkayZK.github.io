---
title: Rust中的向下转型
toc: true
cover: 'https://img.paulzzh.com/touhou/random?55'
date: 2023-12-13 08:46:29
categories: Rust
tags: [Rust]
description: 在 Java 等存在继承的编程语言中，有时候会需要将一个父类或接口类转为一个具体的子类，这时候需要用到向下转型（downcast）。而在 Rust 中，有时候也需要将一个具体的 Trait 对象转为一个具体的类型，此时需要用到 Any Trait；
---

在 Java 等存在继承的编程语言中，有时候会需要将一个父类或接口类转为一个具体的子类，这时候需要用到向下转型（downcast）；

而在 Rust 中，有时候也需要将一个具体的 Trait 对象转为一个具体的类型，此时需要用到 Any Trait；

本文讲述了如何在 Rust 中实现向下转型（downcast）；

源代码：

-   https://github.com/JasonkayZK/boost-rs/blob/main/boost-rs/src/types/as_any.rs
-   https://github.com/JasonkayZK/rust-learn/tree/any

<br/>

<!--more-->

# **Rust中的向下转型**

Rust中的向下转型需要使用到 Any Trait；

>   关于 Any，我之前的文章中讲过：
>
>   -   [《Rust反射之Any》](https://jasonkayzk.github.io/2022/11/24/Rust%E5%8F%8D%E5%B0%84%E4%B9%8BAny/)

不过上一篇文章更多的是讲解如何通过 Any 来获取变量类型，或转换为一般的类型，不涉及到 Trait 变量；

这篇将会探讨 Trait 对象的向下转型；

<br/>

## **向下转型例子**

下面是一个向下转型的例子：

examples/2_trait_downcast.rs

```rust
use std::any::Any;

#[derive(Default)]
struct Test {
    age: i32,
}

trait Custom: AsAny {
    fn hello(&self) -> String;
}

trait AsAny {
    fn as_any(&self) -> &dyn Any;
}

impl AsAny for Test {
    fn as_any(&self) -> &dyn Any {
        self
    }
}

impl Custom for Test {
    fn hello(&self) -> String {
        String::from("hello")
    }
}

fn main() {
    let test = Test { age: 1 };
    let custom: Box<dyn Custom> = Box::new(test);
    println!("age: {}", custom.as_any().downcast_ref::<Test>().unwrap().age)
}
```

Test 为我们的结构体，Custom 为对应的 Trait；

同时我们为 Test 实现了 AsAny 来将结构体转换为 Any 类型；

在 main 函数中，我们先创建了一个 Test 对象，然后使用 Box 包装并转为了一个 Trait 对象；

最后，我们再使用 `custom.as_any().downcast_ref::<Test>()` 来进行向下转换将一个 Trait 对象转换为了一个 Test 具体类型；

以上就是在 Rust 中实现向下转换的方法；

<br/>

## **更复杂的例子**

来看下面这个例子：

examples/3_trait_downcast2.rs

```rust
use std::any::{Any, TypeId};

#[derive(Default)]
struct Test1 {
    age: i32,
}

#[derive(Default)]
struct Test2 {
    salary: i32,
}

trait Custom: AsAny {
    fn hello(&self) -> String;
}

trait AsAny {
    fn as_any(&self) -> &dyn Any;

    fn type_id(&self) -> TypeId;
}

impl AsAny for Test1 {
    fn as_any(&self) -> &dyn Any {
        self
    }

    fn type_id(&self) -> TypeId {
        TypeId::of::<Self>()
    }
}

impl Custom for Test1 {
    fn hello(&self) -> String {
        String::from("hello from test1")
    }
}

impl AsAny for Test2 {
    fn as_any(&self) -> &dyn Any {
        self
    }

    fn type_id(&self) -> TypeId {
        TypeId::of::<Self>()
    }
}

impl Custom for Test2 {
    fn hello(&self) -> String {
        String::from("hello from test2")
    }
}

fn main() {
    let mut v: Vec<Box<dyn Custom>> = vec![];
    let test1 = Box::new(Test1 { age: 1 });
    let test2 = Box::new(Test2 { salary: 2 });
    v.push(test1);
    v.push(test2);

    for item in v {
        println!("{}", item.hello());
        let any_item = item.as_any();

        if any_item.type_id() == TypeId::of::<Test1>() {
            println!("age: {}", any_item.downcast_ref::<Test1>().unwrap().age)
        }
        if any_item.type_id() == TypeId::of::<Test2>() {
            println!("salary: {}", any_item.downcast_ref::<Test2>().unwrap().salary)
        }
    }
}
```

我们创建了 Test1、Test2 两个结构体，并为他们实现了 Custom、AsAny Trait；

>   **注意：AsAny Trait 中添加了 type_id 方法，用来获取结构体对象的实际类型！**

在 main 函数中，我们创建了 Test1、Test2 两个类型的对象，并将他们放入到 Vec 中；

在 for 循环中，我们首先调用了对象共有的 Custom Trait 中的方法；

随后通过 type_id 对具体类型进行判断，并转换，完成了向下转型！

>   **可以看到，虽然 Rust 中没有继承的概念，但是也可以完成和面向对象类似的效果！**

<br/>

## **使用范型简化实现**

在上面的代码中可以看到，我们需要为每个具体的类型实现一遍 AsAny Trait，非常麻烦；

我们可以使用范性做简化！

通过给 AsAny Trait 提供默认的实现，让其他 Trait 继承 AsAny Trait 来直接实现！

代码如下：

boost-rs/src/types/as_any.rs

```rust
//! This library provides some utility traits to make working with [`Any`] smoother.
//! This crate contains similar functionality to the `downcast` crate, but simpler,
use std::any::{Any, TypeId};

/// This trait is an extension trait to [`Any`], and adds methods to retrieve a `&dyn Any`
pub trait AsAny: Any {
    fn as_any(&self) -> &dyn Any;

    fn as_any_mut(&mut self) -> &mut dyn Any;

    /// Gets the type name of `self`
    fn type_name(&self) -> TypeId;
}

impl<T: 'static> AsAny for T {
    #[inline(always)]
    fn as_any(&self) -> &dyn Any {
        self
    }

    #[inline(always)]
    fn as_any_mut(&mut self) -> &mut dyn Any {
        self
    }

    #[inline(always)]
    fn type_name(&self) -> TypeId {
        TypeId::of::<T>()
    }
}

/// This is a shim around `AaAny` to avoid some boilerplate code.
/// It is a separate trait because it is also implemented
/// on runtime polymorphic traits (which are `!Sized`).
pub trait Downcast: AsAny {
    /// Returns `true` if the boxed type is the same as `T`.
    ///
    /// Forward to the method defined on the type `Any`.
    #[inline(always)]
    fn is<T>(&self) -> bool
    where
        T: AsAny,
    {
        self.as_any().is::<T>()
    }

    /// Forward to the method defined on the type `Any`.
    #[inline(always)]
    fn downcast_ref<T>(&self) -> Option<&T>
    where
        T: AsAny,
    {
        self.as_any().downcast_ref()
    }

    /// Forward to the method defined on the type `Any`.
    #[inline(always)]
    fn downcast_mut<T>(&mut self) -> Option<&mut T>
    where
        T: AsAny,
    {
        self.as_any_mut().downcast_mut()
    }
}

impl<T: ?Sized + AsAny> Downcast for T {}
```

>   上面的代码实现加入到了我的 Crate：[boost-rs](https://github.com/JasonkayZK/boost-rs)

在项目中使用：

examples/4_as_any.rs

```rust
use boost_rs::types::as_any::{AsAny, Downcast};

trait Custom: AsAny {
    fn hello(&self) -> String;
}

struct Test {
    age: i32,
}

impl Custom for Test {
    fn hello(&self) -> String {
        String::from("This is Test!")
    }
}

fn main() {
    let x: Box<dyn Custom> = Box::new(Test { age: 1 });
    // Wrong:
    // println!("age: {}", x.downcast_ref::<Test>().unwrap().age);
    println!("age: {}", (*x).downcast_ref::<Test>().unwrap().age);

    let y: &dyn Custom = &Test { age: 2 };
    println!("age: {}", y.downcast_ref::<Test>().unwrap().age)
}
```

**需要注意的是：**

**由于 Box 存在自动解引用的坑，如果是使用 Box 包装的类型，需要显式解引用 `*y`！**

**否则调用的是 Box 实现的 Any Trait，会导致返回的是 None！**

>   **也可以使用全限定类型名继承，此时不会有问题：**
>
>   `trait Custom: boost_rs::types::as_any::AsAny`

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/boost-rs/blob/main/boost-rs/src/types/as_any.rs
-   https://github.com/JasonkayZK/rust-learn/tree/any

参考文章：

-   [《Rust反射之Any》](https://jasonkayzk.github.io/2022/11/24/Rust%E5%8F%8D%E5%B0%84%E4%B9%8BAny/)
-   https://stackoverflow.com/questions/33687447/how-to-get-a-reference-to-a-concrete-type-from-a-trait-object
-   https://stackoverflow.com/questions/69107401/trait-downcasting

<br/>
