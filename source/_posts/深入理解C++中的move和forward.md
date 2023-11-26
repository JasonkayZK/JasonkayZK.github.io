---
title: 深入理解C++中的move和forward
toc: true
cover: 'https://img.paulzzh.com/touhou/random?66'
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

>   <font color="#f00">**注意：上面的函数在返回时，实际上编译器会对返回值进行优化，并不会先析构v，再在str_split 函数的调用栈中对整个v进行Copy；**</font>
>
>   <font color="#f00">**但是之前的C++的确是这么做的，因此会出现类似于下面的代码：**</font>
>
>   ```c++
>   void str_split(const string& s, vector<string>* vec); 
>   ```
>
>   <font color="#f00">**即：将返回值也作为一个输入参数；**</font>
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

>   <font color="#f00">**对于使用过 Rust 的开发者来说，这里他们是非常熟悉的；**</font>
>
>   <font color="#f00">**因为 Rust 丧心病狂的将所有赋值操作都默认定义为了 `Move` 语义！**</font>

<br/>

## **使用 move 函数**

### **move函数的基本使用**

对比之前的例子，这里我们使用 move 语义对其进行优化：

1_move_semantics.cc

```c++
#include <iostream>
#include <utility>
#include <vector>
#include <string>

class Object {
public:
    explicit Object(std::string str) : _str(std::move(str)) {
        std::cout << "build this object, address: " << this << std::endl;
    }

    virtual ~Object() {
        std::cout << "destruct this object, address: " << this << std::endl;
    }

    Object(const Object &object) : _str(object._str) {
        std::cout << "copy this object, address: " << this << std::endl;
    }

    Object(Object &&object) noexcept: _str(std::move(object._str)) {
        std::cout << "move this object!" << std::endl;
    }

    std::string _str;
};

void f_copy(Object obj) {
    std::cout << "copy function, address: " << &obj << std::endl;
}

void f_move(Object &&obj) {
    Object a_obj(std::move(obj));
    std::cout << "move function, address: " << &a_obj << std::endl;
}

int main() {
    Object obj{"abc"};

    // function calling
    f_copy(obj);
    f_move(std::move(obj));

//    std::cout << obj._str << std::endl; // danger!

    std::cout << "============== end ================" << std::endl;

    return 0;
}
```

>   **这里的用法其实是没有意义的，只是为了演示强行使用了 move**

为了方便演示，这里给 Object 类增加了一个 string 类型的成员，并且输出了 Object 的内存地址；

代码输出：

```
build this object, address: 000000FD546FF5A8 // Object obj{"abc"}
copy this object, address: 000000FD546FF620 // f_copy(obj)
copy function, address: 000000FD546FF620 // Object(const Object &object)
destruct this object, address: 000000FD546FF620 // f_copy(obj) End
move this object! // Object a_obj(std::move(obj));
move function, address: 000000FD546FF508 // f_move(Object &&obj)
destruct this object, address: 000000FD546FF508 // f_move(Object &&obj) End
============== end ================
destruct this object, address: 000000FD546FF5A8 // main End
```

**可以看到，相比于 Copy，我们直接使用了 move 函数将变量移入了函数中，此时是没有调用复制构造函数的！**

>   <font color="#f00">**实际上，C++中的 move 函数只是做了类型转换，并不会真正的实现值的移动！**</font>
>
>   <font color="#f00">**因此，对于自定义的类来说，如果要实现真正意义上的 “移动”，还是要手动重载移动构造函数和移动复制函数**</font>
>
>   <font color="#f00">**即：我们需要在自己的类中实现移动语义，避免深拷贝，充分利用右值引用和std::move的语言特性；**</font>
>
>   <font color="#f00">**实际上，通常情况下C++编译器会默认在用户自定义的`class`和`struct`中生成移动语义函数；**</font>
>
>   <font color="#f00">**但前提是：用户没有主动定义该类的`拷贝构造`等函数！**</font>

>   **同时也要注意到：使用一个已经被 move 过的函数是非常危险的事情！**

<br/>

### **move 语义下的析构函数**

在上面的测试在，可能你也注意到了一点就是：

```
destruct this object, address: 000000FD546FF508 // f_move(Object &&obj) End
============== end ================
destruct this object, address: 000000FD546FF5A8 // main End
```

<font color="#f00">**对象被move了之后，仍然会在其离开作用域之后调用他的析构函数？**</font>

这是因为：

-   **虽然将 `obj` 的资源给了 `a_obj` ，但是`obj`并没有立刻析构，只有在 `obj` 离开了自己的作用域的时候才会析构；因此，如果继续使用`str2`的`m_data`变量，可能会发生意想不到的错误；**
-   **也正因为如此，在自己实现移动构造函数的时候，需要将原对象中的值手动置为空，以防止同一片内存区域被多次释放！**

>   此外还需要注意：
>
>   -   **如果我们没有提供移动构造函数，只提供了拷贝构造函数，`std::move()`会失效但是不会发生错误，因为编译器找不到移动构造函数就去寻找拷贝构造函数，这也是拷贝构造函数的参数是`const T&`常量左值引用的原因！**
>   -   **`c++11` 中的所有容器都实现了`move`语义，`move`只是转移了资源的控制权，本质上是将左值强制转化为右值使用，以用于移动拷贝或赋值，避免对含有资源的对象发生无谓的拷贝；**
>   -   **`move` 对于拥有如内存、文件句柄等资源的成员的对象有效，如果是一些基本类型，如int和char[10]数组等，如果使用move，仍会发生拷贝（因为没有对应的移动构造函数），所以说`move`对含有资源的对象说更有意义；**

上面的例子只是对 move 语义的简单介绍，下面给出了一个真正需要自己手动管理资源（内存地址）的例子：

1_move_and_destructor.cc

```c++
#include <iostream>
#include <utility>
#include <vector>

class MyString {
public:
    // Constructor
    explicit MyString(const char *data) {
        if (data != nullptr) {
            _data = new char[strlen(data) + 1];
            strcpy(_data, data);
        } else {
            _data = new char[1];
            *_data = '\0';
        }

        std::cout << "built this object, address: " << this << std::endl;
    }

    // Destructor
    virtual ~MyString() {
        std::cout << "destruct this object, address: " << this << std::endl;
        delete[] _data;
    }

    // Copy constructor
    MyString(const MyString &str) {
        std::cout << "copy this object, address: " << this << std::endl;
        _data = new char[strlen(str._data) + 1];
        strcpy(_data, str._data);
    }

    // Move constructor
    MyString(MyString &&str) noexcept
            : _data(str._data) {
        std::cout << "move this object" << std::endl;
        str._data = nullptr; // Very important!
    }

    // Copy assignment
    MyString& operator=(const MyString& str){
        if (this == &str) // 避免自我赋值!!
            return *this;

        delete[] _data;
        _data = new char[ strlen(str._data) + 1 ];
        strcpy(_data, str._data);
        return *this;
    }

    // Move assignment
    MyString& operator=(MyString&& str) noexcept{
        if (this == &str) // 避免自我赋值!!
            return *this;

        delete[] _data;
        _data = str._data;
        str._data = nullptr; // 不再指向之前的资源了
        return *this;
    }

public:
    char *_data;
};

void f_move(MyString &&obj) {
    MyString a_obj(std::move(obj));
    std::cout << "move function, address: " << &a_obj << std::endl;
}

int main() {
    MyString obj{"abc"};

    f_move(std::move(obj));

//    std::cout << obj._data << std::endl; // danger!

    std::cout << "============== end ================" << std::endl;

    return 0;
}
```

最终输出：

```
built this object, address: 000000843D0FFD78
move this object
move function, address: 000000843D0FFD08
destruct this object, address: 000000843D0FFD08
============== end ================
destruct this object, address: 000000843D0FFD78
```

<font color="#f00">**这里需要注意，在移动构造函数和移动赋值函数中，我们将当前待移动对象的资源赋值为了空（`str._data = nullptr`），这里就是我们手动实现了 `资源的移动`！**</font>

下面我们尝试修改两个地方，来导致报错：

-   **使用资源被 move 后的对象；**
-   **在实现移动构造函数时不赋值为nullptr；**

<br/>

#### **使用资源被 move 后的对象**

将注释打开：

```c++
//    std::cout << obj._data << std::endl; // danger!
```

此时执行代码会疯狂报错：

```
Exception: Exception 0xc0000005 encountered at address 0x7ff62a4f245a: Access violation reading location 0x00000000
```

因为此时obj中的内容已经为空了！

<br/>

#### **在实现移动构造函数时不赋值为nullptr**

将这里注释掉：

```c++
MyString(MyString &&str) noexcept
    : _data(str._data) {
        std::cout << "move this object" << std::endl;
        // str._data = nullptr; // Very important!
    }
```

此时再执行代码，整个程序会直接崩溃，因为：**我们未将已经move掉的资源设置为空值，最终会导致这里的资源被释放两次！**

<br/>

## **什么又是 forward 函数？**

有了 move 函数之后，我们又遇到了一个新的问题：

按照上面的写法，处理临时变量用右值引用`T &&`，处理普通变量用const引用`const T &`，我们需要分别建立两个函数，然后入参使用不同的类型，每个函数都要写两遍；

那么能不能避免重复，将 `T &&` 类型和 `const T &` 类型合二为一呢？

答案就是：`forward` 函数，`std::forward` 也被称为**完美转发**，即：**保持原来的 值 属性不变：**

-   如果原来的值是左值，经std::**forward**处理后该值还是左值；
-   如果原来的值是右值，经std::**forward**处理后它还是右值；

这样一来，我们就可以使用 forward 函数对入参进行封装，从而保证了入参的统一性，从而可以实现一个方法处理两种类型！

>   **正因为如此，forward 函数被大量用在了入参值类型情况不确定的C++模板中！**

2_forward.cc

```c++
template<typename T>
void f_forward(T &&t) {

    Object a = std::forward<T>(t);

    std::cout << "forward this object, address: " << &a << std::endl;
}

int main() {
    Object obj{"abc"};
    f_forward(obj);

    f_forward(Object("def"));

    return 0;
}
```

紧接着上面的例子，我们构建了一个模板函数 `f_forward`；

在里面我们调用了 `std::forward<T>(t)` 来创建一个新的对象；

在 main 函数中，我们分别使用一个左值和一个右值调用了该模板函数；

结果如下：

```c++
build this object, address: 000000CFAE8FFC78
copy this object, address: 000000CFAE8FFBD8
forward this object, address: 000000CFAE8FFBD8
destruct this object, address: 000000CFAE8FFBD8
build this object, address: 000000CFAE8FFCB8
move this object!
forward this object, address: 000000CFAE8FFBD8
destruct this object, address: 000000CFAE8FFBD8
destruct this object, address: 000000CFAE8FFCB8
destruct this object, address: 000000CFAE8FFC78
```

一个调用了 复制构造函数，另一个调用了移动构造函数；

forward 函数成功的识别到了我们的入参，并完成了转发，即：

-   **如果外面传来了右值临时变量，它就转发右值并且启用move语义；**
-   **如果外面传来了左值，它就转发左值并且启用copy，同时它也还能保留const；**

<br/>

## **move 和 forward 函数的区别**

从上面的分析我们可以看出，基本上 forward 可以 cover 所有的需要 move 的场景，毕竟 forward 函数左右值通吃；

那为什么还要使用 move 呢？原因主要有两点：

-   首先，forward函数常用于模板函数这种入参情况不确定的场景中，在使用的时候必须要多带一个模板参数`forward<T>`，代码略复杂；
-   此外，明确只需要 move 临时值的情况下如果使用了 forward，会导致代码意图不清晰，其他人看着理解起来比较费劲；

实际上从实现的角度上来说，他们都可以被 `static_cast` 替代；

>   **为什么不用 static_cast 呢？也是为了阅读和使用起来更方便；**

<br/>

## **move 和 forward 函数的实现**

### **C++11后加入的一些新规则**

#### **引用折叠规则**

**如果间接的创建一个引用的引用，则这些引用就会“折叠”，在所有情况下（除了一个例外），引用折叠成一个普通的左值引用类型；**

**一种特殊情况下，引用会折叠成右值引用，即右值引用的右值引用：`T&& &&`；**

即：

-   `X& &`、`X& &&`、`X&& &`都折叠成`X&`；
-   `X&& &&`折叠为`X&&`；

#### **右值引用的特殊类型推断规则**

当将一个左值传递给一个参数是右值引用的函数，且此右值引用指向**模板类型参数(`T&&`)**时，编译器推断模板参数类型为实参的左值引用，如：

```C++
template<typename T> 
void f(T&&);

int i = 42;
f(i)
```

上述的模板参数类型`T&&`最终将被推断为`int&`类型，而非 int！

>   <font color="#f00">**若将这两个规则结合起来，则意味着可以传递一个左值 `int i` 给f，编译器将推断出T的类型为int&；**</font>
>
>   <font color="#f00">**再根据引用折叠规则 void f(int& &&)将推断为void f(int&)，因此，f将被实例化为: void f<int&>(int&)；**</font>

从上述两个规则可以得出结论：**如果一个函数形参是一个指向模板类型的右值引用，则该参数可以被绑定到一个左值上；**

即类似下面的定义：

```c++
template<typename T> 
void f(T&&);
```

#### **可以通过static_cast显式地将一个左值转换为一个右值**

虽然不能隐式的将一个左值转换为右值引用，但是可以通过static_cast显式地将一个左值转换为一个右值；

>   C++11中为static_cast新增的转换功能；

<br/>

### **move函数解析**

标准库中move的定义如下：

```cpp
template <class _Ty>
_NODISCARD constexpr remove_reference_t<_Ty>&& move(_Ty&& _Arg) noexcept { // forward _Arg as movable
    return static_cast<remove_reference_t<_Ty>&&>(_Arg);
}
```

move 函数的参数`T&&`是一个指向模板类型参数的右值引用（见上方新规则），通过引用折叠，此参数可以和任何类型的实参匹配！

因此 move 函数的入参既可以传递一个左值，也可以传递一个右值！

右值情况，`std::move(string("hello"))`调用解析：

-   首先，根据模板推断规则，确地T的类型为string，`typename remove_reference_t<_Ty>&&` 的结果为 `string &&`，因此，move 函数的返回值参数类型为`string&&`；
-   同时，对于 `static_cast<string &&>(_Arg)`来说，`_Arg` 已经是 `string&&`，于是类型转换什么都不做，直接返回`string &&`；

左值情况，`string s1("hello"); std::move(s1);` 调用解析：

-   首先，根据模板推断规则，确定T的类型为`string&`，`typename remove_reference_t<_Ty>&&` 的结果为 `string&`，因此 move 函数的参数类型为 `string& &&`，**引用折叠之后为`string&`；**
-   同时，对于 `static_cast<string &&>(_Arg)`来说，`_Arg` 是 `string&`，经过`static_cast`之后转换为`string&&`，返回`string &&`；

>   **因此，从 move 函数的实现可以看出，move 自身除了做一些参数的推断之外，返回右值引用本质上还是靠`static_cast<T&&>`完成的；**

因此**下面两个调用是等价的**，std::move就是个语法糖；

```cpp
void func(int&& a) {
    cout << a << endl;
}

int a = 6;
func(std::move(a));

int b = 10;
func(static_cast<int&&>(b)); 
```

**需要注意的是：`std::move` 函数仅仅执行到右值类型的无条件转换；就其本身而言，它没有“move”任何东西；**

<br/>

### **forward函数解析**

标准库中 forward 函数的定义如下：

```cpp
template <class _Ty>
_NODISCARD constexpr remove_reference_t<_Ty>&& move(_Ty&& _Arg) noexcept { // forward _Arg as movable
    return static_cast<remove_reference_t<_Ty>&&>(_Arg);
}
```

当传递一个 `lvalue` 或者 `const lvaue` 时：

-   传递一个lvalue，模板推导之后 `_Ty = _Ty&`；
-   传递一个const lvaue, 模板推导之后`_Ty = const _Ty&`；
-   随后，`_Ty& &&` 将折叠为`_Ty&`，即`_Ty& && 折叠为 _Ty&`，即最终返回 `_Ty&`类型；
-   `std::forward<_Ty&>(_Arg)`将返回一个左值，最终调用拷贝构造函数；

类似的，当传递一个`rvalue`时：

-   `remove_reference_t<_Ty>&& move(_Ty&& _Arg)` 将返回一个右值，最终调用移动构造函数；

<br/>

## **总结**

首先，`std::move`和`std::forward`本质都是转换：

-   <font color="#f00">**`std::move`执行强制到右值的无条件转换；**</font>
-   <font color="#f00">**`std::forward`只有在它的参数绑定到一个右值上的时候，才转换它的参数到一个右值；**</font>

<font color="#f00">**`std::move` 没有move任何东西，std::forward没有转发任何东西；**</font>

<font color="#f00">**整个类型转变的实现是在编译期完成的，在运行期，它们没有做任何事情；**</font>

<font color="#f00">**它们没有为`移动`或者`复制`产生需要执行的代码，一byte都没有；（换言之，我们需要通过重载移动相关操作函数来自己处理move语义）**</font>

在使用场景方面：

-   **一般在模板元编程里面，由于入参的值类型不确定，因此对于forward使用比较多；**
-   **在一般的函数中，如果可以确定传入的一定是右值（临时值），可以直接使用 move 函数，强调使用场景；**

<br/>

# **Appendix**

源代码：

-   https://github.com/JasonkayZK/cpp-learn/tree/value

文章参考：

-   https://wendeng.github.io/2019/05/14/c++%E5%9F%BA%E7%A1%80/c++11move%E5%92%8Cforword/
-   https://www.jianshu.com/p/b90d1091a4ff
-   [C++ 右值引用与move](https://www.cnblogs.com/chenny7/p/11984699.html)

<br/>
