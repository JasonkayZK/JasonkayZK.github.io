---
title: 学习Rust两周后我的一些感想
toc: true
cover: 'https://img.paulzzh.com/touhou/random?55'
date: 2021-06-16 09:44:24
categories: Rust
tags: [Rust, 人生日记]
description: 学习Rust零零碎碎已经有两周的时间了，老实说最开始其实是本着学习好C++的态度打算好好学习C++的；但是个人对自己的代码能力并没有什么自信，因为C++实在太太太太太容易写出Memory-Leak的代码了！最后，就打算试一试Rust这门语言。用过之后不得不说，Rust应该是神级的Program Language了，编译检查简直严格到变态！本文主要想谈一谈我在学习了Rust两周后的一些感受；
---

学习Rust零零碎碎已经有两周的时间了，老实说最开始其实是本着学习好C++的态度打算好好学习C++的；但是个人对自己的代码能力并没有什么自信，因为C++实在太太太太太容易写出Memory-Leak的代码了！

最后，就打算试一试Rust这门语言。用过之后不得不说，Rust应该是神级的Program Language了，编译检查简直严格到变态！

本文主要想谈一谈我在学习了Rust两周后的一些感受；

源代码：

-   https://github.com/JasonkayZK/rust-learn

<br/>

<!--more-->

## **学习Rust两周后我的一些感想**

### **GC掩盖了什么？**

关于内存管理的一些常见的问题有：

-   **没有及时释放分配的内存导致内存泄漏；**
-   **释放了某一个内存区域两次；**
-   **引用了一个被释放的内存空间；**

目前大部分现代编程语言，比如：Java、Golang、Python等等，基本上都实现了自己的垃圾回收器GC，这让我们忽略了在写代码时，我们肆意在堆上分配的各种内存；

可能很少会有人考虑，编程语言的GC到底帮我们做了什么？如果没有了GC，我们应该怎么办？

**对于C++、Rust这种无GC的编程语言，一个很重要的特点就是要自己控制堆内存，而控制堆内存一个很重要的工具就是：`指针`；**

在这里我不打算谈论如何使用智能指针实现内存的开辟和释放，并且避免内存泄漏；

首先我们来看看下面这个Rust中的例子：

```rust
fn main() {
    let r;
    {
        let x = 5;
        r = &x;
    }
    println!("r: {}", r);
}
```

上面是Rust官方提供的一个很经典的例子；

在一个新的作用域中创建的新的变量`x`的引用被赋值给了引用`r`，随后退出新的作用域后，使用引用`r`访问变量`x`；

如果你尝试编译这个文件，将会产生一个编译错误：<font color="#f00">**值`x`在退出作用域后就被自动释放了，因此此时引用`r`指向的是一个堆中已经不属于`x`的空间；**</font>

类似的这种操作是非常危险的，但是在C++中，这些操作是无法被编译器捕获的；

不妨来看一下在C++中这段相同逻辑代码的表现：

>   **注意：在C++中这是被允许的操作！**

```c++
#include <iostream>

using namespace std;

int main() {
    int* r;
    {
        int x = 5;
        r = &x;
    }
    cout << *r << endl;
}
```

代码会正常输出`5`；

你可能会说，这是因为在C++中，并不会自动释放x的内存；

下面我们使用string和智能指针unique_ptr来实现：

```c++
#include <iostream>
#include <memory>

using namespace std;

int main() {
    string *r;
    {
        unique_ptr<string[]> x{new string[100]};
        x[0] = "hello";
        x[1] = "world";

        r = &x[0];
        cout << *r << endl;
    }
    cout << *r << endl;
}
```

上面的代码通过unique_ptr保证了string数组`x`在退出作用域后内存空间被自动释放，但是我们的引用`r`仍然指向了这个内存空间的开头位置！

尝试运行这个例子，可以得到下面的结果：

```bash
hello
  # 空行
```

即内存被释放前，引用`r`的确指向了数组开头，而退出作用域后，由于空间被释放掉了因此此时引用`r`指向的空间是空的！

但是引用`r`还是成功的指向了我们的内存，并且可以肆无忌惮的访问！

>   <font color="#f00">**没什么大惊小怪的，C++甚至都不会检查数组越界！**</font>

这些危险的行为按道理应当在编译器就被发现，并且被解决！

Rust正是做到了这一点：

```rust
fn main() {
    let r;
    {
        let x= [
            String::from("hello"),
            String::from("world"),
            String::from("something else"),
        ];
        r = &x[0];
        println!("r: {}", r);
    }
    // println!("r: {}", r);
}

```

运行程序，正常输出：

```
r: hello
```

但是如果取消注释最后一行`println!("r: {}", r);`，将无法编译：

```
error[E0597]: `x[_]` does not live long enough
  --> src\main.rs:10:13
   |
10 |         r = &x[0];
   |             ^^^^^ borrowed value does not live long enough
11 |         println!("r: {}", r);
12 |     }
   |     - `x[_]` dropped here while still borrowed
13 |     println!("r: {}", r);
   |                       - borrow later used here
```

因为Rust中的生命期检查将会发现当退出作用域后引用`r`将会指向一个被释放的内存空间；

<br/>

### **关于垂悬引用(Dangling Refer)**

除了上述很明显的引用了一个被释放的内存空间之外，还有另外一类也会产生这种错误的例子，就是在函数返回时产生了垂悬引用(Dangling Refer)；

下面是一个Rust中的例子：

```rust
fn main() {
    println!("get_str: {}", get_str())
}

fn get_str() -> &str {
    return "hello";
}
```

例子中，`get_str()`函数创建了一个关于字符串`"hello"`的引用并返回；

尝试编译会报一个错：

```
error[E0106]: missing lifetime specifier
 --> src\main.rs:5:17
  |
5 | fn get_str() -> &str {
  |                 ^ expected named lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but there is no value for it to be borrowed from
help: consider using the `'static` lifetime
  |
5 | fn get_str() -> &'static str {
  |                 ^^^^^^^^
```

报错的原因主要是因为：<font color="#f00">**我们是在函数的内部创建的字符串`"hello"`，但是在返回时，我们将这个字符串的引用返回到了函数体外；之后字符串`"hello"`被回收，因此返回的引用是一个已经被释放的区域；这就是一个垂悬引用(Dangling Refer)；**</font>

>   <font color="#f00">**其实我们是可以将这个返回值高性能的返回的，只要声明返回值是一个右值引用即可！**</font>
>
>   <font color="#f00">**这就相对于函数将这个变量的所有权转移到了函数体的外部；**</font>

因此在Rust中，只需要返回含有所有权的String类型即可：

```rust
fn main() {
    println!("get_str: {}", get_str())
}

fn get_str() -> String {
    return String::from("hello");
}
```

可以看到，通过所有权的方式，可以很好的理解`垂悬引用`这个概念，而Rust也是这么做的！

<br/>

### **再谈函数入参和引用**

从上面我们可以看到：<font color="#f00">**如果需要返回函数内部在堆上创建的变量，需要将变量的所有权也一并交出；**</font>

<font color="#f00">**但是如果返回值是一个引用呢？**</font>

<font color="#f00">**那就必须要和入参有关系了！**</font>

因此，在Rust中添加了生命期泛型，用于标注入参和出参之间的生命期关系；

下面是一个Rust中的例子：

```rust
fn main() {
    let str_list = vec!["hello", "hi", "ok"];
    println!("before: {:?}", str_list);

    let after = to_lowercase(str_list);
    println!("after: {:?}", after);
}

fn to_lowercase(str: Vec<&str>) -> Vec<&str> {
    str.into_iter()
        .map(|x| x.to_uppercase().as_str())
        .collect()
}
```

例子中，通过遍历vector中的各个str引用，返回一个新的、将字符串大写的数组；

<font color="#f00">**需要注意的是，在调用`x.to_uppercase()`函数时会创建一个新的String，因此依然犯了上面的Dangling Refer的错误：在函数内部返回了引用；**</font>

我们可以通过将返回值修改为String：

```rust
fn main() {
    let str_list = vec!["hello", "hi", "ok"];
    println!("before: {:?}", str_list);

    let after = to_lowercase(str_list);
    println!("after: {:?}", after);
}

fn to_lowercase(str: Vec<&str>) -> Vec<String> {
    str.into_iter()
        .map(|x| x.to_uppercase())
        .collect()
}
```

<font color="#f00">**这是合理的，因为函数执行完成后需要将所有权转接；**</font>

<font color="#f00">**如果函数必须要返回引用类型，由上面的分析可知，出参是必须要从入参来的（否则就会引用函数中创建的变量，从而造成Dangling Refer错误！）**</font>

如，下面的函数返回了长度大于指定值的引用：

```rust
fn main() {
    let str_list = vec!["hello", "hi, there", "ok"];
    println!("before: {:?}", str_list);

    let after = longer_than(str_list, 3);
    println!("after: {:?}", after);
}

fn longer_than(str: Vec<&str>, len: usize) -> Vec<&str> {
    str.into_iter()
        .filter(|x| x.len() > len)
        .collect()
}
```

上面的代码可以被正确的执行：

```
before: ["hello", "hi, there", "ok"]
after: ["hello", "hi, there"]
```

那么为什么我们这里没有声明生命期泛型呢？

这是因为：<font color="#f00">**对于Rust的编译器而言，目前入参和出参的结构已经可以判断出生命期了；**</font>

因此Rust会自动加上生命期：

```rust
fn longer_than<'a>(str: Vec<&'a str>, len: usize) -> Vec<&'a str> {
    str.into_iter()
        .filter(|x| x.len() > len)
        .collect()
}
```

那么什么时候需要显式声明生命期呢？

下面是一个经典的例子：

```rust
fn main() {
    let longer = longest("hello", "hi");
    println!("longer: {:?}", longer);
}

fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

此时，函数无法推断是返回X还是Y，因此需要显式声明！

<br/>

### **总结**

本文草草总结了关于学习Rust时的一些感想；

最后想说的是：如果是老的项目难以迁移，则可以继续使用C++；否则为什么不试试更加安全的Rust呢？

<br/>

## **附录**

源代码：

-   https://github.com/JasonkayZK/rust-learn


<br/>
