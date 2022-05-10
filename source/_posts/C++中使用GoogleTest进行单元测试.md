---
title: C++中使用GoogleTest进行单元测试
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?99'
date: 2022-05-09 22:39:02
categories: C++
tags: [C++, Library]
description: GoogleTest是Google开源的一个测试框架，使用这个框架我们可以很方便的对我们的项目进行测试；本文讲述了GoogleTest的基本使用；
---

GoogleTest是Google开源的一个测试框架，使用这个框架我们可以很方便的对我们的项目进行测试；

本文讲述了GoogleTest的基本使用；

源代码：

-   https://github.com/JasonkayZK/cpp-learn/tree/lib/gtest
-   https://github.com/google/googletest

<br/>

<!--more-->

# **C++中使用GoogleTest进行单元测试**

## **安装并配置GoogleTest**

得益于 vcpkg，我们可以非常简单的安装和配置GoogleTest库；

```bash
vcpkg install gtest
```

注：

-   **GoogleTest的名称为 `gtest`；**
-   **你可能需要安装的是 x64的版本；**

安装完成之后，根据提示，在我们的CMake项目中增加配置，并为我们的可执行文件添加链接库即可：

```cmake
add_executable(main_test main_test.cc)

find_package(GTest CONFIG REQUIRED)
target_link_libraries(main_test PRIVATE GTest::gmock GTest::gtest GTest::gmock_main GTest::gtest_main)
```

至此，配置完成；

>   关于如何配置 vcpkg 默认安装64位：
>
>   -   [设置vcpkg默认安装64位库](/2022/05/05/设置vcpkg默认安装64位库/)

<br/>

## **第一个GoogleTest例子**

下面我们创建一个单测文件；

main_test.cc

```c++
#include <iostream>
#include "gtest/gtest.h"

TEST(HelloTest, PrintHello) {
    std::string str{"Hello, World!"};
    ASSERT_EQ(str, "Hello, World!");
    ASSERT_EQ(str.size(), 13);
}

int main(int argc, char **argv) {
    printf("Running main() from %s\n", __FILE__);
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
```













<br/>

## **断言**











<br/>

## **事件机制**









<br/>

## **测试函数之间共享数据**













<br/>

# **Appendix**

Reference：

-   https://zhuanlan.zhihu.com/p/369466622
-   http://senlinzhan.github.io/2017/10/08/gtest/

源代码：

-   https://github.com/JasonkayZK/cpp-learn/tree/lib/gtest
-   https://github.com/google/googletest


<br/>
