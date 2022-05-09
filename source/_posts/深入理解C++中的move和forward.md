---
title: 深入理解C++中的move和forward
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?66'
date: 2022-05-08 13:44:48
categories: C++
tags: [C++]
description: 在C++11标准之前，C++中默认的传值类型均为Copy语义，即：不论是指针类型还是值类型，都将会在进行函数调用时被完整的复制一份！对于非指针而言，开销及其巨大！因此在C++11以后，引入了右值和Move语义，极大的提高了效率；本文介绍了在此场景下了两个常用的标准库函数：move和forward；
---

在C++11标准之前，C++中默认的传值类型均为Copy语义，即：不论是指针类型还是值类型，都将会在进行函数调用时被完整的复制一份！

对于非指针而言，开销及其巨大！

因此在C++11以后，引入了右值和Move语义，极大的提高了效率；

本文介绍了在此场景下了两个常用的标准库函数：move和forward；

源代码：

-   https://github.com/JasonkayZK/cpp-learn/tree/value

<br/>

<!--more-->

# **C++中move和forward的区别**

## **特性背景**

### **Copy语义简述**

C++中默认为Copy语义，因此存在大量开销；

以下面的代码为例：

0_copy_semantics.cc

```C++
#include <iostream>
#include <vector>

class Object {
public:
    Object() {
        std::cout << "build this object!" << std::endl;
    }

    virtual ~Object() {
        std::cout << "destruct this object!" << std::endl;
    }
};

void f(const Object obj) {}

int main() {
    Object obj{};

    // function calling
    f(obj);

    // vector
    std::vector<Object> v;
    v.push_back(obj);
}

```

最终的输出结果为：

```
build this object!
destruct this object!
destruct this object!
destruct this object!
```

第一个为显式调用构造函数创建 obj 时的输出；

后面的输出说明存在三个对象，因此调用了三次析构函数；

即：**除了我们显式构造的函数之外，我们在调用函数、将对象加入 vector 的时候，也创建了新的对象！**

**并且这个对象不是通过构造函数创建的，事实上是通过`复制构造函数`创建的！**

**当尝试将复制构造函数禁用后，上面的代码将无法编译：**

```c++
Object (const Object& object) = delete;
```

<br/>

### **临时值（右值）简述**

Copy 语义虽然用起来很方便，但是很多时候我们并不想将值（尤其是一些临时变量） Copy 一遍再使用！

例如：

```C++
func("some temporary string"); // 尽管直接将一个常量传入函数中, C++还是大概率会创建一个string的复制
v.push_back(X()); // 初始化了一个临时X, 然后被复制进了vector
a = b + c; // b+c是一个临时值, 然后被赋值给了a
x++; // x++操作也有临时变量的产生（++x则不会产生）
a = b + c + d; //c+d是一个临时变量, b+(c+d)是另一个临时变量
```

另外还有函数在返回时：

```c++
vector<string> str_split(const string& s) {
  vector<string> v;
  // ...
  return v; // v是左值，但优先移动，不支持移动时仍可复制
}
```

>   <red>**注意：上面的函数在返回时，实际上编译器会对返回值进行优化，并不会先析构v，再在str_split 函数的调用栈中对整个v进行Copy；**</font>
>
>   <red>**但是之前的C++的确是这么做的，因此会出现类似于下面的代码：**</font>
>
>   ```c++
>   void str_split(const string& s, vector<string>* vec); 
>   ```
>
>   <red>**即：将返回值也作为一个输入参数；**</font>
>
>   **上面编译器的优化有一个非常学术的名字：`RVO (Return Value Optimization)，返回值优化`；**
>
>   感兴趣的可以看看下面的文章：
>
>   -   [C++ 编译器优化之 RVO 与 NRVO](https://www.yhspy.com/2019/09/01/C-%E7%BC%96%E8%AF%91%E5%99%A8%E4%BC%98%E5%8C%96%E4%B9%8B-RVO-%E4%B8%8E-NRVO/)

上面的这些临时值，在C++中被统一定义为：`右值(rvalue)`，因为在编译器的角度，实际上并没有对应的变量名存储这些变量值；

对面上面提到的一些临时值的场景都有一些共性：

-   **临时变量的内容先被复制一遍；**
-   **被复制的内容覆盖到成员变量指向的内存；**
-   **临时变量用完了再被回收；**

其实这里是可以优化的：

**临时变量其实最终都是要被回收的，如果能把临时变量的内容直接`“移入”`成员变量中，此时就不需要调用复制构造函数了！**

即：

-   **成员变量内部的指针指向”temporary str1”所在的内存；**
-   **临时变量内部的指针指向成员变量以前所指向的内存；**
-   **最后临时变量指向的那块内存再被回收；**

上面的操作即可避免一次对象Copy的发生，实际上它就是所谓的 `Move`语义；

>   <red>**对于使用过 Rust 的开发者来说，这里他们是非常熟悉的；**</font>
>
>   <red>**因为 Rust 丧心病狂的将所有赋值操作都默认定义为了 `Move` 语义！**</font>

<br/>

## **使用 move 函数**

对比之前的例子，这里我们使用 move 语义对其进行优化：

1_move_semantics.cc

```c++
#include <iostream>
#include <utility>

class Object {
public:
    Object() {
        std::cout << "build this object!" << std::endl;
    }

    virtual ~Object() {
        std::cout << "destruct this object, address: " << this << std::endl;
    }

    Object(const Object &object) = default;
};

void f(Object &&obj) {
}

int main() {
    Object obj{};

    // func
    f(std::move(obj));
}
```











<br/>

## **什么又是 forward 函数？**









<br/>

## **move 和 forward 函数的区别**









<br/>

## **move 和 forward 函数的实现**











<br/>

# **Appendix**

源代码：

-   https://github.com/JasonkayZK/cpp-learn/tree/value

文章参考：

-   https://wendeng.github.io/2019/05/14/c++%E5%9F%BA%E7%A1%80/c++11move%E5%92%8Cforword/
-   https://www.jianshu.com/p/b90d1091a4ff


<br/>
