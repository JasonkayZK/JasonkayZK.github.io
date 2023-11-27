---
title: Rust中创建全局变量
toc: true
cover: 'https://img.paulzzh.com/touhou/random?33'
date: 2023-11-27 20:31:30
categories: Rust
tags: [Rust]
description: 在 Rust 中常用的一些定义全局变量的方法总结；
---

在 Rust 中常用的一些定义全局变量的方法总结；

源代码：

-   https://github.com/JasonkayZK/rust-learn/tree/global-vars

<br/>

<!--more-->

# **Rust中创建全局变量**

## **引言**

在一些场景，我们可能需要全局变量来简化状态共享的代码，包括全局 ID，全局数据存储等等；

由于 Rust 在默认情况下的苛刻定义，我们几乎很难做到在不使用 unsafe 的情况下去定义并初始化一个全局变量；

>   <font color="#f00">**首先，有一点可以肯定，全局变量的生命周期肯定是`'static`，即全局变量会一直存活至程序结束！**</font>
>
>   <font color="#f00">**但是不代表它需要用`static`来声明，例如常量、字符串字面值等无需使用`static`进行声明，原因是它们已经被打包到二进制可执行文件中；**</font>

创建全局变量主要包括下面几种情况：

-   编译期初始化
-   运行期初始化

<br/>

## **编译期初始化**

大多数使用的全局变量都只需要在编译期初始化即可，例如：静态配置、计数器、状态值、默认值等；

### **静态常量**

全局常量可以在程序任何一部分使用，当然，如果它是定义在某个模块中，你需要引入对应的模块才能使用。常量，顾名思义它是不可变的，很适合用作静态配置：

examples/01_static_const.rs

```rust
const MAX_ID: usize =  usize::MAX / 2;

fn main() {
   println!("用户ID允许的最大值是{}", MAX_ID);
}
```

**常量与普通变量的区别：**

-   关键字是`const`而不是`let`
-   定义常量**必须指明类型（如 i32）不能省略（不能使用类型推断！）；**
-   定义常量时变量的**命名规则一般是全部大写**
-   **常量可以在任意作用域进行定义，其生命周期贯穿整个程序的生命周期。**<font color="#f00">**编译时编译器会尽可能将其内联到代码中，所以在不同地方对同一常量的引用并不能保证引用到相同的内存地址！**</font>
-   **常量的赋值只能是常量表达式/数学表达式**，也就是说**必须是在编译期就能计算出的值**，如果需要在**运行时才能得出结果的值比如函数，则不能赋值给常量表达式**
-   对于变量出现重复的定义(绑定)会发生变量遮盖，后面定义的变量会遮住前面定义的变量，常量则不允许出现重复的定义；

<br/>

### **静态变量**

静态常量是不可变的；

而静态变量允许声明一个全局的变量，常用于全局数据统计，例如我们希望用一个变量来统计程序当前的总请求数：

examples/02_static_var.rs

```rust
static mut REQUEST_RECV: usize = 0;
fn main() {
   unsafe {
        REQUEST_RECV += 1;
        assert_eq!(REQUEST_RECV, 1);
   }
}
```

此时，Rust 要求必须使用`unsafe`语句块才能访问和修改`static`变量，因为这种使用方式往往并不安全！

编译器是对的，**当在多线程中同时去修改时，会不可避免的遇到脏数据；**

因此，只有在同一线程内或者不在乎数据的准确性时，才应该使用全局静态变量；

同时，和常量相同，**定义静态变量的时候必须赋值为在编译期就可以计算出的值(常量表达式/数学表达式)，不能是运行时才能计算出的值(如函数)！**

>   **这个规则极大的限制了全局变量的使用场景，因此通常全局变量都会使用运行时初始化！**

<br/>

### **静态变量和常量的区别**

区别如下：

-   静态变量不会被内联，在整个程序中，**静态变量只有一个实例，所有的引用都会指向同一个地址**
-   存储在静态变量中的值必须要实现 Sync Trait（保证变量能够安全地被多个线程访问！）

<br/>

### **原子类型**

想要全局计数器、状态控制等功能，又想要线程安全的实现，原子类型是非常好的办法；

examples/03_atomic_var.rs

```rust
use std::sync::atomic::{AtomicUsize, Ordering};
use std::thread;
use std::time::Duration;

static REQUEST_RECV: AtomicUsize = AtomicUsize::new(0);

fn main() {
    let cnt = 10000;

    for _ in 0..cnt {
        thread::spawn(|| {
            REQUEST_RECV.fetch_add(1, Ordering::Relaxed);
        });
    }

    thread::sleep(Duration::from_secs(2));

    println!("当前用户请求数{:?}", REQUEST_RECV);
    assert_eq!(REQUEST_RECV.load(Ordering::Relaxed), cnt);
}
```

这里使用`AtomicUsize::new(0)`来初始化一个原子类型的整数；

关于原子类型的讲解看：

-   https://course.rs/advance/concurrency-with-threads/sync2.html

<br/>

## **运行期初始化**

### **错误案例**

编译期的静态初始化有一个致命的问题：

无法用函数进行静态初始化，例如你如果想声明一个全局的`Mutex`锁：

```rust
use std::sync::Mutex;
static NAMES: Mutex<String> = Mutex::new(String::from("Sunface, Jack, Allen"));

fn main() {
    let v = NAMES.lock().unwrap();
    println!("{}",v);
}
```

运行后报错如下：

```console
error[E0015]: calls in statics are limited to constant functions, tuple structs and tuple variants
 --> src/main.rs:3:42
  |
3 | static NAMES: Mutex<String> = Mutex::new(String::from("sunface"));
```

但你又必须在声明时就对`NAMES`进行初始化，此时就陷入了两难的境地；

好在天无绝人之路，我们可以使用很多方法来解决这个问题；

<br/>

### **lazy_static**

[`lazy_static`](https://github.com/rust-lang-nursery/lazy-static.rs)是社区提供的非常强大的宏，用于懒初始化静态变量，之前的静态变量都是在编译期初始化的，因此无法使用函数调用进行赋值，而`lazy_static`允许我们在运行期初始化静态变量！

例如：

examples/04_lazy_static.rs

```rust
use std::sync::Mutex;
use lazy_static::lazy_static;

lazy_static! {
    static ref NAMES: Mutex<String> = Mutex::new(String::from("Jack, Allen"));
}

fn main() {
    let mut v = NAMES.lock().unwrap();
    v.push_str(", Myth");
    println!("{}",v);
}
```

同时需要注意的是：

>   <font color="#f00">**使用`lazy_static`在每次访问静态变量时，会有轻微的性能损失，因为其内部实现用了一个底层的并发原语`std::sync::Once`，在每次访问该变量时，程序都会执行一次原子指令用于确认静态变量的初始化是否完成！**</font>

`lazy_static`宏，匹配的是`static ref`，所以定义的静态变量都是不可变引用！

可能有读者会问，为何需要在运行期初始化一个静态变量，除了上面的全局锁，你会遇到最常见的场景就是：**一个全局的动态配置，它在程序开始后，才加载数据进行初始化，最终可以让各个线程直接访问使用；**

再来看一个使用`lazy_static`实现全局缓存的例子：

examples/05_lazy_static2.rs

```rust
use lazy_static::lazy_static;
use std::collections::HashMap;

lazy_static! {
    static ref HASHMAP: HashMap<u32, &'static str> = {
        let mut m = HashMap::new();
        m.insert(0, "foo");
        m.insert(1, "bar");
        m.insert(2, "baz");
        m
    };
}

fn main() {
    // 首次访问`HASHMAP`的同时对其进行初始化
    println!("The entry for `0` is \"{}\".", HASHMAP.get(&0).unwrap());

    // 后续的访问仅仅获取值，再不会进行任何初始化操作
    println!("The entry for `1` is \"{}\".", HASHMAP.get(&1).unwrap());
}
```

**需要注意的是：`lazy_static`只有在真正获取对应变量时才会真正进行初始化，在没有访问该变量之前都不会执行初始化操作！**

<br/>

### **Box::leak**

`Box::leak` 也可以用于全局变量，例如用作运行期初始化的全局动态配置；

如果不使用 `Box::leak` 来放弃编译器对变量的内存分配跟踪，例如：

```rust
#[derive(Debug)]
struct Config {
    a: String,
    b: String,
}

static mut CONFIG: Option<&mut Config> = None;

fn main() {
    unsafe {
        CONFIG = Some(&mut Config {
            a: "A".to_string(),
            b: "B".to_string(),
        });

        println!("{:?}", CONFIG)
    }
}
```

以上代码我们声明了一个全局动态配置`CONFIG`，并且其值初始化为`None`，然后在程序开始运行后，给它赋予相应的值，运行后报错:

```console
error[E0716]: temporary value dropped while borrowed
  --> src/main.rs:10:28
   |
10 |            CONFIG = Some(&mut Config {
   |   _________-__________________^
   |  |_________|
   | ||
11 | ||             a: "A".to_string(),
12 | ||             b: "B".to_string(),
13 | ||         });
   | ||         ^-- temporary value is freed at the end of this statement
   | ||_________||
   |  |_________|assignment requires that borrow lasts for `'static`
   |            creates a temporary which is freed while still in use
```

可以看到，Rust 的借用和生命周期规则限制了我们做到这一点，因为试图将一个局部生命周期的变量赋值给全局生命周期的`CONFIG`，这明显是不安全的；

`Box::leak`方法可以将一个变量从内存中泄漏（放弃内存分配跟踪），然后将其变为`'static`生命周期，最终该变量将和程序活得一样久，因此可以赋值给全局静态变量`CONFIG`：

examples/06_box_leak.rs

```rust
#[derive(Debug)]
struct Config {
    _a: String,
    _b: String
}
static mut CONFIG: Option<&mut Config> = None;

fn main() {
    let c = Box::new(Config {
        _a: "A".to_string(),
        _b: "B".to_string(),
    });

    unsafe {
        // 将`c`从内存中泄漏，变成`'static`生命周期
        CONFIG = Some(Box::leak(c));
        println!("{:?}", CONFIG);
    }
}
```

除此之外，如果我们需要在运行期，从一个函数返回一个全局变量，此时也可以使用 `Box::leak`！

例如：

examples/07_box_leak2.rs

```rust
#[derive(Debug)]
struct Config {
    _a: String,
    _b: String,
}
static mut CONFIG: Option<&mut Config> = None;

fn init() -> Option<&'static mut Config> {
    let c = Box::new(Config {
        _a: "A".to_string(),
        _b: "B".to_string(),
    });

    Some(Box::leak(c))
}


fn main() {
    unsafe {
        CONFIG = init();

        println!("{:?}", CONFIG)
    }
}
```

<br/>

### **OnceCell**

在 `Rust` 标准库中提供了实验性的 `lazy::OnceCell` 和 `lazy::SyncOnceCell` (在 `Rust` 1.70.0版本及以上的标准库中，替换为稳定的 `cell::OnceCell` 和 `sync::OnceLock` )两种 `Cell` ；

>   或者也可以使用 `once` Crate！

**前者用于单线程，后者用于多线程，它们用来存储使用堆上内存的变量，并且具有最多只能赋值一次的特性；**

如实现一个多线程的日志组件 `Logger`：

examples/08_once_cell.rs

```rust
// 低于Rust 1.70版本中， OnceCell 和 SyncOnceCell 的API为实验性的 ，
// 需启用特性 `#![feature(once_cell)]`。
// #![feature(once_cell)]
// use std::{lazy::SyncOnceCell, thread};

// Rust 1.70版本以上,
use std::sync::OnceLock;

use std::thread;

fn main() {
    // 子线程中调用
    let handle = thread::spawn(|| {
        let logger = Logger::global();
        logger.log("thread message".to_string());
    });

    // 主线程调用
    let logger = Logger::global();
    logger.log("some message".to_string());

    let logger2 = Logger::global();
    logger2.log("other message".to_string());

    handle.join().unwrap();
}

#[derive(Debug)]
struct Logger;

// 低于Rust 1.70版本
// static LOGGER: SyncOnceCell<Logger> = SyncOnceCell::new();

// Rust 1.70版本以上
static LOGGER: OnceLock<Logger> = OnceLock::new();

impl Logger {
    fn global() -> &'static Logger {
        // 获取或初始化 Logger
        LOGGER.get_or_init(|| {
            println!("Logger is being created..."); // 初始化打印
            Logger
        })
    }

    fn log(&self, message: String) {
        println!("{}", message)
    }
}
```

以上代码我们声明了一个 `global()` 关联函数，并在其内部调用 `get_or_init` 进行初始化 `Logger`，之后在不同线程上多次调用 `Logger::global()` 获取其实例：

```console
Logger is being created...
some message
other message
thread message
```

可以看到，`Logger is being created...` 在多个线程中使用也只被打印了一次；

特别注意，目前 `OnceCell` 和 `SyncOnceCell` API 暂未稳定，需启用特性 `#![feature(once_cell)]`；

<br/>

### **OnceLock**

OnceLock 是一个用于实现懒加载、并发安全的数据结构；

OnceLock 可以确保一个变量只被初始化一次，同时它可以在多线程环境下进行安全访问！（OnceCell 只能在单线程下访问！）

以下是一个使用 OnceLock 的示例：

examples/09_once_lock.rs

```rust
use std::sync::OnceLock;

static WINNER: OnceLock<&str> = OnceLock::new();

fn main() {
    let winner = std::thread::scope(|s| {
        s.spawn(|| WINNER.set("thread"));
        std::thread::yield_now(); // give them a chance...
        WINNER.get_or_init(|| "main")
    });
    println!("{winner:?} wins!");
}
```

在这个例子中，我们使用 OnceLock 来创建一个名为 WINNER 的变量，并在多线程环境下使用它。我们使用 WINNER.set() 方法来设置 WINNER 变量的值，在另一个线程中，我们使用 WINNER.get_or_init() 方法来获取 WINNER 变量的值。get_or_init() 方法接受一个闭包作为参数，该闭包用于初始化变量的值，只有在变量未被初始化时才会执行。

可以这样简单理解：`OnceLock = OnceCell + Lock`；

<br/>

### **Const Mutex**

从 Rust 1.63 开始，`Mutex::new()` 变为了 const，因此，下面的代码已经可以编译通过：

```rust
static LOG_FILE: Mutex<String> = Mutex::new(String::new());
```

改造上面 Logger 的例子：

examples/10_const_mutex.rs

```rust
use std::sync::Mutex;
use std::thread;

fn main() {
    // 子线程中调用
    let handle = thread::spawn(|| {
        let logger = LOGGER.lock().unwrap();
        logger.log("thread message".to_string());
    });

    // 主线程调用
    {
        let logger = LOGGER.lock().unwrap();
        logger.log("some message".to_string());
    }
    {
        let logger2 = LOGGER.lock().unwrap();
        logger2.log("other message".to_string());
    }

    handle.join().unwrap();
}

#[derive(Debug)]
struct Logger;

static LOGGER: Mutex<Logger> = Mutex::new(Logger);

impl Logger {
    fn log(&self, message: String) {
        println!("{}", message)
    }
}
```

<br/>

## **总结**

上面介绍了 Rust 中全局变量的一些场景，以及在对应场景下的一些初始化、使用方式；

简单来说，全局变量可以分为两种：

-   编译期初始化的全局变量，`const`创建常量，`static`创建静态变量，`Atomic`创建原子类型；
-   运行期初始化的全局变量，`lazy_static`用于懒初始化，`Box::leak`利用内存泄漏将一个变量的生命周期变为`'static`；

如果你使用的是较新的 Rust 版本，那么建议：

优先直接使用 Rust 标准库中自带的 OnceCell 即可，而不再需要使用 `lazy_static`、`once_cell` 等 Crate！

同时：

-   当你想在`static`中使用的类型支持线程安全的内部可变性并具有const构造函数时，可以直接将其声明为静态。 （编译器会为你检查所有这些，只需查看它是否能编译。） 这以前仅包括原子类型，但现在还包括互斥锁和读写锁。 因此，如果像`static CURRENT_CONFIG: Mutex<Option<Config>> = Mutex::new(None)`或`static SHOULD_LOG: AtomicBool = AtomicBool::new(true)` 对你有用，可以直接使用。
-   当这种方法不起作用，或者需要在首次使用时进行初始化，请使用`std::sync::OnceLock`，最好封装在函数（例如：global）中；
-   如果你创建了大量的全局变量，并希望避免每个变量都封装在一个函数中的样板代码，可以使用`once_cell::sync::Lazy` 来代替  `lazy_static`；

注意，已经使用`once_cell`或`lazy_static` Crate 的现有代码并不需要处理，这些 crate 将无限期保持可用，并且它们生成的汇编代码几乎与标准库的`OnceLock`相同！

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/rust-learn/tree/global-vars

参考文章：

-   https://rustcc.cn/article?id=48db4d6f-0a0a-4770-bd7e-9b0110161ba3
-   https://morestina.net/blog/2055/rust-global-variables-two-years-on
-   https://morestina.net/blog/1774/rust-global-variables-demystified
-   https://course.rs/advance/global-variable.html
-   https://zhuanlan.zhihu.com/p/343064284
-   https://juejin.cn/post/7111280470226108429
-   https://zhuanlan.zhihu.com/p/636856396
-   https://zhuanlan.zhihu.com/p/637151852


<br/>
