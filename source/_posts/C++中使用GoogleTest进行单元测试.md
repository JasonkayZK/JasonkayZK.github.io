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

GoogleTest官方文档：

-   https://google.github.io/googletest/

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

代码首先引入了头文件 `gtest/gtest.h`，该头文件中包含了 GoogleTest 中核心的宏等；

随后我们使用了`TEST()`宏创建了一个单元测试用例；

`TEST()`宏的使用方法如下：

```c++
TEST(test_suite_name, test_case_name) {
    // test body ...
}
```

第一个参数为整个测试组的名称，第二个参数为测试组中具体某个用例的名称；

最后在 main 函数中：

首先输出了单元测试的文件位置，随后使用启动测试时指定的参数初始化测试，最后调用`RUN_ALL_TESTS();`开启测试；

启动测试后结果如下：

```
/Users/jasonkayzk/self-workspace/cpp-learn/cmake-build-debug/main_test
Running main() from /Users/jasonkayzk/self-workspace/cpp-learn/main_test.cc
[==========] Running 1 test from 1 test suite.
[----------] Global test environment set-up.
[----------] 1 test from HelloTest
[ RUN      ] HelloTest.PrintHello
[       OK ] HelloTest.PrintHello (0 ms)
[----------] 1 test from HelloTest (0 ms total)

[----------] Global test environment tear-down
[==========] 1 test from 1 test suite ran. (0 ms total)
[  PASSED  ] 1 test.
```

执行成功！

<br/>

## **断言**

gtest 提供了大量的测试断言函数，大体上分为了两类：

-   **`ASSERT_*`：执行失败，退出当前的测试函数立即返回（注意：并非退出当前案例）；**
-   **`EXPECT_*`：执行失败，并不会退出当前测试函数，继续向下执行；**

下面给出了两个例子：

```c++
TEST(ExpectAndAssert, ExpectTest) {
    auto add = [](const int x, const int y) { return x + y; };

    EXPECT_EQ(add(1, 2), 4);
    EXPECT_EQ(add(1, 2), 3);
}

TEST(ExpectAndAssert, AssertTest) {
    auto subtract = [](const int x, const int y) { return x - y; };

    ASSERT_EQ(subtract(3, 1), 3);
    ASSERT_EQ(subtract(3, 1), 2);
}
```

执行后输出：

```
[==========] Running 2 tests from 1 test suite.
[----------] Global test environment set-up.
[----------] 2 tests from ExpectAndAssert
[ RUN      ] ExpectAndAssert.ExpectTest
/Users/kylinkzhang/self-workspace/cpp-learn/main_test.cc:15: Failure
Expected equality of these values:
  add(1, 2)
    Which is: 3
  4
[  FAILED  ] ExpectAndAssert.ExpectTest (0 ms)
[ RUN      ] ExpectAndAssert.AssertTest
/Users/kylinkzhang/self-workspace/cpp-learn/main_test.cc:22: Failure
Expected equality of these values:
  subtract(3, 1)
    Which is: 2
  3
[  FAILED  ] ExpectAndAssert.AssertTest (0 ms)
[----------] 2 tests from ExpectAndAssert (0 ms total)

[----------] Global test environment tear-down
[==========] 2 tests from 1 test suite ran. (0 ms total)
[  PASSED  ] 0 tests.
[  FAILED  ] 2 tests, listed below:
[  FAILED  ] ExpectAndAssert.ExpectTest
[  FAILED  ] ExpectAndAssert.AssertTest

 2 FAILED TESTS
```

一些比较常用的断言有：

### **1、布尔值检查：**

| Fatal assertion            | Nonfatal assertion         | Verifies             |
| -------------------------- | -------------------------- | -------------------- |
| ASSERT_TRUE(*condition*);  | EXPECT_TRUE(*condition*);  | *condition* is true  |
| ASSERT_FALSE(*condition*); | EXPECT_FALSE(*condition*); | *condition* is false |

### **2、数值型数据检查：**

| Fatal assertion                  | Nonfatal assertion               | Verifies               |
| -------------------------------- | -------------------------------- | ---------------------- |
| ASSERT_EQ(*expected*, *actual*); | EXPECT_EQ(*expected*, *actual*); | *expected* == *actual* |
| ASSERT_NE(*val1*, *val2*);       | EXPECT_NE(*val1*, *val2*);       | *val1* != *val2*       |
| ASSERT_LT(*val1*, *val2*);       | EXPECT_LT(*val1*, *val2*);       | *val1* < *val2*        |
| ASSERT_LE(*val1*, *val2*);       | EXPECT_LE(*val1*, *val2*);       | *val1* <= *val2*       |
| ASSERT_GT(*val1*, *val2*);       | EXPECT_GT(*val1*, *val2*);       | *val1* > *val2*        |
| ASSERT_GE(*val1*, *val2*);       | EXPECT_GE(*val1*, *val2*);       | *val1* >= *val2*       |

### **3、字符串比较：**

| Fatal assertion                                 | Nonfatal assertion                              | Verifies                            |
| ----------------------------------------------- | ----------------------------------------------- | ----------------------------------- |
| ASSERT_STREQ(*expected_str*, *actual_str*);     | EXPECT_STREQ(*expected_str*, *actual_str*);     | 两个C字符串有相同的内容             |
| ASSERT_STRNE(*str1*, *str2*);                   | EXPECT_STRNE(*str1*, *str2*);                   | 两个C字符串有不同的内容             |
| ASSERT_STRCASEEQ(*expected_str*, *actual_str*); | EXPECT_STRCASEEQ(*expected_str*, *actual_str*); | 两个C字符串有相同的内容，忽略大小写 |
| ASSERT_STRCASENE(*str1*, *str2*);               | EXPECT_STRCASENE(*str1*, *str2*);               | 两个C字符串有不同的内容，忽略大小写 |

### **4、异常检查：**

| Fatal assertion                              | Nonfatal assertion                           | Verifies                                          |
| -------------------------------------------- | -------------------------------------------- | ------------------------------------------------- |
| ASSERT_THROW(*statement*, *exception_type*); | EXPECT_THROW(*statement*, *exception_type*); | *statement* throws an exception of the given type |
| ASSERT_ANY_THROW(*statement*);               | EXPECT_ANY_THROW(*statement*);               | *statement* throws an exception of any type       |
| ASSERT_NO_THROW(*statement*);                | EXPECT_NO_THROW(*statement*);                | *statement* doesn't throw any exception           |

### **5、浮点型检查：**

| Fatal assertion                       | Nonfatal assertion                    | Verifies                               |
| ------------------------------------- | ------------------------------------- | -------------------------------------- |
| ASSERT_FLOAT_EQ(*expected, actual*);  | EXPECT_FLOAT_EQ(*expected, actual*);  | the two float values are almost equal  |
| ASSERT_DOUBLE_EQ(*expected, actual*); | EXPECT_DOUBLE_EQ(*expected, actual*); | the two double values are almost equal |

对相近的两个数比较：

| Fatal assertion                       | Nonfatal assertion                    | Verifies                                                     |
| ------------------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| ASSERT_NEAR(*val1, val2, abs_error*); | EXPECT_NEAR*(val1, val2, abs_error*); | the difference between *val1* and *val2* doesn't exceed the given absolute error |

### **6、类型对比断言：**

该类断言只有一个`::testing::StaticAssertTypeEq<T, T>()`：

-   当类型相同时，它不会执行任何内容；
-   如果不同则会引起编译错误；

**需要注意的是：要使代码触发编译器推导类型，否则也会发生编译错误；**

如：

```c++
template <typename T> class Foo {
 public:
  void Bar() { ::testing::StaticAssertTypeEq<int, T>(); }
};
```

如下的代码就不会引起编译冲突：

```c++
void Test1() { Foo<bool> foo; }
```

但是下面的代码由于引发了编译器的类型推导，所以会触发编译错误：

```c++
void Test2() { Foo<bool> foo; foo.Bar(); }
```

### **7、几个特殊的断言：**

-   **`SUCCEED()`宏：直接标记断言成功；**
-   **`FAIL()`宏：标记致命错误（同`ASSERT_*`)；**
-   **`ADD_FAILURE()`宏：标记非致命错误（同`EXPECT_*`）；**

>   更多断言见官方文档：
>
>   -   https://google.github.io/googletest/reference/assertions.html

<br/>

## **自定义错误信息**

有的时候，我们可能会对默认情况下的错误的输出不满意：

例如：

```c++
Failure
Expected equality of these values:
  1+2
    Which is: 3
  4
```

此时，我们还可以使用 `<<` 操作符来自定义输出信息；

```c++
TEST(TestMessage, Message) {
    int result = 4;
    EXPECT_EQ(1 + 2, result) << "1+2 should equals to: " << result;
}
```

此时输出：

```
Failure
Expected equality of these values:
  1 + 2
    Which is: 3
  result
    Which is: 4
1+2 should equals to: 4
```

从输出中，我们可以很明显的看到，此时 result 为 4！

<br/>

## **事件机制和TEST_F**

使用过 JUnit 的小伙伴，应该对 `@Before` 和 `@After` 注解都不陌生；

他们允许我们在开始用例前、用例结束分别进行一些操作；

gtest 也提供了这样的事件，并且分为了多种类型：

-   **全局事件；**
-   **TestSuite事件；**
-   **TestCase事件；**

下面我们一一来看；

### **全局事件**

要实现全局事件，必须写一个类来**继承 `testing::Environment` 类**，并实现里面的 `SetUp` 和 `TearDown` 方法；

此后：

-   `SetUp()方法`：在**所有案例**执行前执行；
-   `TearDown()方法`：在**所有案例**执行后执行；

<font color="#f00">**同时，还需要告诉 gtest 添加这个全局事件：**</font>

<font color="#f00">**需要在main函数中通过 testing::AddGlobalTestEnvironment 方法将事件挂进来；**</font>

>   <font color="#f00">**这也意味着，我们可以写很多个这样的类，然后将他们的事件都挂上去；**</font>

<br/>

### **TestSuite事件**

我们需要写一个类，**继承 `testing::Test`**，然后实现两个静态方法：

-   `SetUpTestCase()方法`：在第一个TestCase之前执行；
-   `TearDownTestCase()方法`：在最后一个TestCase之后执行；

在编写测试案例时，我们需要使用 `TEST_F` 这个宏，第一个参数必须是我们上面类的名字，代表一个TestSuite；

<br/>

### **TestCase事件**

TestCase事件是挂在每个案例执行前后的，实现方式和上面的几乎一样，不过需要实现的是SetUp方法和TearDown方法：

-   `SetUp()方法`：在每个TestCase之前执行；
-   `TearDown()方法`：在每个TestCase之后执行；

<br/>

事件机制可以很好的帮助我们简化测试，例如：

我们可以使用事件机制来在测试函数之间共享数据；

下面提供了一个使用各种事件的例子：

```c++
class GlobalEvent : public testing::Environment {
public:
    void SetUp() override {
        std::cout << "Before any case, Global" << std::endl;
    }
    void TearDown() override {
        std::cout << "After all cases done, Global" << std::endl;
    }
};

class VectorTest : public ::testing::Test {
protected:
    // set resources before test
    void SetUp() override {
        vec.push_back(1);
        vec.push_back(2);
        vec.push_back(3);
    }

    // clean up resources after test
    void TearDown() override {
        vec.clear();
    }

    static void SetUpTestCase() {
        std::cout << "SetUpTestCase()" << std::endl;
    }

    static void TearDownTestCase() {
        std::cout << "TearDownTestCase()" << std::endl;
    }

    std::vector<int> vec;
};

// Here we are using TEST_F, not TEST
TEST_F(VectorTest, PushBack) {
    // We changed vec here, but this is invisible to other test cases
    vec.push_back(4);
    EXPECT_EQ(vec.size(), 4);
    EXPECT_EQ(vec.back(), 4);
}

TEST_F(VectorTest, Size) {
    ASSERT_EQ(vec.size(), 3);
}

int main(int argc, char **argv) {
    printf("Running main() from %s\n", __FILE__);
    ::testing::AddGlobalTestEnvironment(new GlobalEvent); // add env
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
```

首先，我们定义了 `GlobalEvent` 类，它继承了 `testing::Environment`，用于定义在整个测试开始之前、之后的操作；

随后，我们定义了 `VectorTest` 类，它继承了 `testing::Test`，用于定义在此测试组以及单个测试集合开始之前、之后的操作；

接着，我们使用 `TEST_F` 定义了两组个测试用例；

最后，我们在 main 函数中注册了我们之前定义的环境变量：`::testing::AddGlobalTestEnvironment(new GlobalEvent);`；

执行用例，我们得到下面的输出：

```
Running main() from /Users/jasonkayzk/self-workspace/cpp-learn/main_test.cc
[==========] Running 2 tests from 1 test suite.
[----------] Global test environment set-up.
Before any case, Global
[----------] 2 tests from VectorTest
SetUpTestCase()
[ RUN      ] VectorTest.PushBack
[       OK ] VectorTest.PushBack (0 ms)
[ RUN      ] VectorTest.Size
[       OK ] VectorTest.Size (0 ms)
TearDownTestCase()
[----------] 2 tests from VectorTest (0 ms total)

[----------] Global test environment tear-down
After all cases done, Global
[==========] 2 tests from 1 test suite ran. (0 ms total)
[  PASSED  ] 2 tests.
```

需要注意的是：在上面的两个测试中：

```c++
// Here we are using TEST_F, not TEST
TEST_F(VectorTest, PushBack) {
    // We changed vec here, but this is invisible to other test cases
    vec.push_back(4);
    EXPECT_EQ(vec.size(), 4);
    EXPECT_EQ(vec.back(), 4);
}

TEST_F(VectorTest, Size) {
    ASSERT_EQ(vec.size(), 3);
}
```

<font color="#f00">**在一个测试函数中修改数据，并不会影响到其它测试函数；**</font>

这是因为，每个单独的测试用例都会单独调用我们重载过的 `SetUp` 和 `TearDown` 函数！

<br/>

# **Appendix**

参考文章：

-   https://zhuanlan.zhihu.com/p/369466622
-   http://senlinzhan.github.io/2017/10/08/gtest/
-   https://www.cnblogs.com/coderzh/archive/2009/04/06/1430364.html
-   https://www.cnblogs.com/helloworldcode/p/9606838.html

源代码：

-   https://github.com/JasonkayZK/cpp-learn/tree/lib/gtest
-   https://github.com/google/googletest


<br/>
