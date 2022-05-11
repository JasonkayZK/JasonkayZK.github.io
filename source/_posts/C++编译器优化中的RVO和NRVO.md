---
title: C++编译器优化中的RVO和NRVO
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?11'
date: 2022-05-11 09:49:54
categories: C++
tags: [C++, 编译优化]
description: 在前面的文章《深入理解C++中的move和forward》中，我们提到了为了避免对数据进行复制，在C++11中增加了move语义；本文继续这个话题，来聊聊关于编译器优化中的RVO；
---

在前面的文章《深入理解C++中的move和forward》中，我们提到了为了避免对数据进行复制，在C++11中增加了move语义；

本文继续这个话题，来聊聊关于编译器优化中的RVO；

关于前一篇文章：

-   [深入理解C++中的move和forward](/2022/05/08/深入理解C++中的move和forward/)

源代码：

-   https://github.com/JasonkayZK/cpp-learn/tree/rvo

<br/>

<!--more-->

# **C++编译器优化中的RVO和NRVO**

## **简述**

RVO 即 `“Return Value Optimization”`，是一种编译器优化技术，通过该技术编译器可以**减少函数返回时生成临时值（对象）的个数，从某种程度上可以提高程序的运行效率，对需要分配大量内存的类对象其值复制过程十分友好；**

NRVO 全称为 `“Named Return Value Optimization”`，该优化的大致流程与 RVO 类似；

只是单纯这么说显得比较空洞，下面来看一个具体的例子；

<br/>

## **一个RVO优化的例子**

来看下面这个例子：

rvo.cc

```c++
#include <iostream>

class A {
public:
    A() {
        std::cout << "[C] constructor fired." << std::endl;
    }

    A(const A &a) {
        std::cout << "[C] copying constructor fired." << std::endl;
    }

    A(A &&a) noexcept {
        std::cout << "[C] moving copying constructor fired." << std::endl;
    }

    ~A() {
        std::cout << "[C] destructor fired." << std::endl;
    }
};

A getTempA() {
    return A{};
}

int main(int argc, char **argv) {
    auto x = getTempA();

    return 0;
}
```

我们声明了一个类 A，并重载了它的：

-   构造函数；
-   复制构造函数；
-   移动构造函数；
-   析构函数；

在 main 函数中，我们调用 `getTempA()`，返回一个类A的对象；

我们首先使用下面的命令编译并执行代码：

```bash
# Use RVO
g++ rvo.cc -o rvo --std=c++11 && ./rvo
```

输出如下所示：

```text
# [C] constructor fired.
# [C] destructor fired.
```

可以看到：**这里一共只执行了一次构造函数和一次析构函数，对于临时对象的拷贝构造过程并没有被进行！**

**这是因为：在正常情况下，编译器一般会默认启用 RVO 优化；**

接下来使用下面命令重新编译并执行上述代码：

```bash
# No RVO
g++ rvo.cc -o rvo --std=c++11 -fno-elide-constructors && ./rvo
```

这里我们关闭了 RVO 优化，对应使用的编译器参数是 **“-fno-elide-constructors”**：

```bash
# No RVO
g++ rvo.cc -o rvo --std=c++11 -fno-elide-constructors && ./rvo
```

>   **不仅仅是 g++ 编译器，对于其他主流编译器（比如，clang等）都是类似的！**

输出如下所示：

```text
[C] constructor fired.
[C] moving copying constructor fired.
[C] destructor fired.
[C] moving copying constructor fired.
[C] destructor fired.
[C] destructor fired.
```

可以看到，这里一共执行了两次移动构造的过程，分别发生于：

-   函数 `“getTempA”` 的返回值移动构造给临时值对象；
-   以及，临时值对象移动构造给变量 “x” 这两个时刻；

**实际上，RVO 以及 NRVO 两种优化技术又被统称为 `“copy_elision（复制消除）”` 优化；**

C++11 标准中规定，在以下两种场景下要求，<red>**编译器省略类对象的复制和移动构造，即使复制/移动构造函数和析构函数拥有可观察副作用！而直接将对象构造到它们本来要复制/移动到的存储中；**</font>

<red>**只要语言确保不发生复制/移动操作，复制/移动构造函数就不必存在或可访问！**</font>

这两种场景分别是：

-   <red>**在 `“return”` 语句中，当操作数为与函数返回类型为同一类类型的纯右值时；**</font>
-   <red>**在变量的初始化中，当初始化器表达式为与变量类型为同一类类型的纯右值时：**</font>

场景一即为我们之前示例代码中的场景；

下面展示第二种场景；

实际上，我们只需要修改 main 函数中变量 x 的初始化表达式即可：

```diff
int main(int argc, char **argv) {
--    auto x = getTempA();
++    auto x = A(A(A(getTempA())));

    return 0;
}
```

当编译器开启 RVO 优化时，程序同样只调用了一次构造函数和一次析构函数，此时输出为：

```
[C] constructor fired.
[C] destructor fired.
```

当关闭了 RVO 优化时的输出则如下所示：

```
[C] constructor fired.
[C] moving copying constructor fired.
[C] destructor fired.
[C] moving copying constructor fired.
[C] moving copying constructor fired.
[C] moving copying constructor fired.
[C] moving copying constructor fired.
[C] destructor fired.
[C] destructor fired.
[C] destructor fired.
[C] destructor fired.
[C] destructor fired.
```

可以看到，移动构造和析构函数被疯狂的调用；

这时产生的五次拷贝构造过程分别是：

1.  函数 “getTempA” 返回值拷贝构造给临时值对象；
2.  临时值对象作为引用参数被类 A 的拷贝构造函数调用，生成一个 A 的临时值对象；
3.  临时值对象作为引用参数被类 A 的拷贝构造函数调用，生成一个 A 的临时值对象；
4.  临时值对象作为引用参数被类 A 的拷贝构造函数调用，生成一个 A 的临时值对象；
5.  临时值对象最后拷贝构造给变量 “x”；

>   <red>**需要注意的是：RVO（和下面的NRVO）可能导致优化和非优化程序之间的不同行为！**</font>
>
>   <red>**毕竟某些代码被优化掉了，因此应当尽量避免在这些被优化的构造函数中增加tricky的逻辑！**</font>

<br/>

## **再来看看NRVO优化**

NRVO 与 RVO 的不同之处在于：**函数返回的临时值是否是具名的；**

更加官方的定义为：

**当操作数是拥有自动存储期的非 `volatile` 对象的字段，并且非函数形参或 catch 子句形参，且其具有与函数返回类型相同的类型时，此时仍然可以避免对象复制；同时，这种复制消除的变体被称为 NRVO；**

同样的，来看下面这个例子：

nrvo.cc

```c++
#include <iostream>

class RVO {
public:

    RVO() { printf("I am in constructor\n"); }

    RVO(const RVO &c_RVO) { printf("I am in copy constructor\n"); }

    ~RVO() { printf("I am in destructor\n"); }

    int mem_var{};
};

RVO MyMethod(int i) {
    RVO rvo;
    rvo.mem_var = i;
    return (rvo);
}

int main() {
    RVO rvo;
    rvo = MyMethod(5);
}
```

上面的代码在没有进行 NRVO 的情况下输出为：

```bash
I am in constructor
I am in constructor
I am in copy constructor
I am in destructor
I am in destructor
I am in destructor
```

使用 NRVO 优化后的输出将是：

```bash
I am in constructor
I am in constructor
I am in destructor
I am in destructor
```



















<br/>

# **Appendix**

关于前一篇文章：

-   [深入理解C++中的move和forward](/2022/05/08/深入理解C++中的move和forward/)

源代码：

-   https://github.com/JasonkayZK/cpp-learn/tree/rvo

文章参考：

-   https://www.yhspy.com/2019/09/01/C-%E7%BC%96%E8%AF%91%E5%99%A8%E4%BC%98%E5%8C%96%E4%B9%8B-RVO-%E4%B8%8E-NRVO/
-   https://docs.microsoft.com/en-us/previous-versions/ms364057(v=vs.80)?redirectedfrom=MSDN

<br/>
