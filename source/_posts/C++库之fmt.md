---
title: C++库之fmt
toc: true
cover: 'https://img.paulzzh.com/touhou/random?2'
date: 2022-05-04 22:07:13
categories: C++
tags: [C++, Library]
description: fmt库是一个先进的文本格式库，具有现代语言的特征，用来代替C的stdio和C++中的iostreams。本文讲解了如何使用C++的开源库：fmt；
---

fmt库是一个先进的文本格式库，具有现代语言的特征，用来代替C的stdio和C++中的iostreams；

本文讲解了如何使用C++的开源库：fmt；

源代码：

-   https://github.com/JasonkayZK/cpp-learn/tree/lib/fmt

开源库地址：

-   https://github.com/fmtlib/fmt

<br/>

<!--more-->

# **C++库之fmt**

## **下载并配置fmt库**

这里使用 vcpkg 直接安装：

```bash
vcpkg install fmt
```

安装完成后需要在 CMake项目中配置：

```cmake
cmake_minimum_required(VERSION 3.16)
project(fmt_learn)

set(CMAKE_CXX_STANDARD 20)

add_executable(cpp_learn main.cpp)

find_package(fmt CONFIG REQUIRED)
target_link_libraries(cpp_learn PRIVATE fmt::fmt)
```

>   **注：这里的 `cpp_learn` 是上面指定的二进制文件的名称；**

此外，还需要对IDE进行配置，如Clion：

`Build, Execution, Deployment` -> `Cmake` -> `Cmake options`;

增加配置：

```
-DCMAKE_TOOLCHAIN_FILE=<vcpkg-path>/scripts/buildsystems/vcpkg.cmake
```

>   详细内容见，Clion文档：
>
>   -   https://intellij-support.jetbrains.com/hc/en-us/community/posts/360000023899-How-to-use-vcpkg-with-clion

<br/>

## **在项目中使用fmt库**

下面是一些使用fmt库的例子，开箱即用，非常简单：

```c++
#include <iostream>
#include <vector>
#include <unordered_map>
#include <fmt/core.h>
#include <fmt/format.h>
#include <fmt/chrono.h>
#include <fmt/ranges.h>
#include <fmt/os.h>
#include <fmt/color.h>


void simple_print() {
    fmt::print("Hello, {}\n", "world!");
}

void string_format() {
    std::string s = fmt::format("The answer is {}.", 42);
    fmt::print("{}\n", s);
}

void float_format() {
    fmt::print("The answer is {:.2f}\n", 1.12345678);
}

void position_param() {
    fmt::print("I'd rather be {1} than {0}.\n", "right", "happy");
}

void named_param() {
    fmt::print("Hello, {name}! The answer is {number}. Goodbye, {name}.\n",
               fmt::arg("name", "World"), fmt::arg("number", 42));
}

void suffix_named_param() {
    // #include <fmt/format.h> needed
    using namespace fmt::literals;
    fmt::print("Hello, {name}! The answer is {number}. Goodbye, {name}.\n",
               "name"_a = "World", "number"_a = 22);
}

void time_format() {
    // #include <fmt/chrono.h> needed
    using namespace std::literals::chrono_literals;
    fmt::print("Default format: {} {}\n", 42s, 100ms);
    fmt::print("strftime-like format: {:%H:%M:%S}\n", 3h + 15min + 30s);
}

void collection_format() {
    // #include <fmt/ranges.h> needed
    std::vector<int> v = {1, 2, 3};
    fmt::print("v: {}\n", v);

    std::unordered_map<std::string, int> m{{"a", 1},
                                           {"b", 2}};
    fmt::print("m: {}\n", m);
}

void format_to_file() {
    // #include <fmt/os.h> needed
    auto out = fmt::output_file("test.txt");
    out.print("Don't {}", "Panic");
}

void font_format() {
    // #include <fmt/color.h> needed
    fmt::print(fg(fmt::color::crimson) | fmt::emphasis::bold,
               "Hello, {}!\n", "world");
    fmt::print(fg(fmt::color::floral_white) | bg(fmt::color::slate_gray) |
               fmt::emphasis::underline, "Hello, {}!\n", "мир");
    fmt::print(fg(fmt::color::steel_blue) | fmt::emphasis::italic,
               "Hello, {}!\n", "世界");
}

int main() {

    simple_print();

    string_format();

    float_format();

    position_param();

    named_param();

    suffix_named_param();

    time_format();

    collection_format();

    format_to_file();

    font_format();

    return 0;
}
```

输出：

```
Hello, world!
The answer is 42.
The answer is 1.12
I'd rather be happy than right.
Hello, World! The answer is 42. Goodbye, World.
Hello, World! The answer is 22. Goodbye, World.
Default format: 42s 100ms
strftime-like format: 03:15:30
v: [1, 2, 3]
m: {"b": 2, "a": 1}
Hello, world!
Hello, мир!
Hello, 世界!
```

<br/>

# **Appendix**

源代码：

-   https://github.com/JasonkayZK/cpp-learn/tree/lib/fmt

开源库地址：

-   https://github.com/fmtlib/fmt


<br/>
