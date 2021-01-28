---
title: cmake生成动态链接库dll
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?23'
date: 2021-01-27 17:35:04
categories: C++
tags: [C++, DLL]
description: 本文讲解了如何使用cmake将C++代码生成DLL库；
---

本文讲解了如何使用cmake将C++代码生成DLL库；

源代码：

-   https://github.com/JasonkayZK/cpp_learn/tree/dll

系列文章：

-   [cmake生成动态链接库dll](/2021/01/27/cmake生成动态链接库dll/)
-   [各编程语言加载并调用dll库](/2021/01/28/各编程语言加载并调用dll库/)

<br/>

<!--more-->

## **cmake生成动态链接库dll**

### **DLL概述**

为了更好的实现代码复用，DLL库应运而生；与Windows平台下的exe格式相比，DLL可以被认为是一个单独的组件；

通过使用 DLL，可以将程序模块化为单独的组件。 例如，会计程序可以按模块出售；

如果安装了该模块，则每个模块都可以运行时加载到主程序中。 由于模块是分开的，因此程序的加载时间会更快。 并且仅在请求该功能时加载模块；

DLL 优势：

-   使用更少的资源

    当多个程序使用相同的函数库时，DLL 可以减少在磁盘和物理内存中加载的代码的重复。 它不仅会大大影响前台运行的程序的性能，还会影响在 Windows 操作系统上运行的其他程序的性能。

-   提升模块化体系结构

    DLL 有助于推动开发模块化程序。 它可以帮助你开发需要多种语言版本的大型程序或需要模块化体系结构的程序。 模块化程序的一个示例是一个会计程序，该程序具有许多可在运行时动态加载的模块。

-   简化部署和安装

    当 DLL 中的函数需要更新或修复时，DLL 的部署和安装不需要程序与 DLL 重新链接。 此外，如果多个程序使用相同的 DLL，则多个程序都将从更新或修复中获益。 在使用定期更新或修复的第三方 DLL 时，此问题可能更频繁地出现。

>   关于DLL的Microsoft官方文档：
>
>   -   https://docs.microsoft.com/zh-cn/troubleshoot/windows-client/deployment/dynamic-link-library

<br/>

### **实验前说明**

通常情况下，DLL都是以lib库的形式编写的，所以我们使用cmake以类似于子项目的形式创建dll库，并构建整个项目；

整个项目的结构如下：

```bash
.
│  CMakeLists.txt
│  run_dll.cpp
│
└─lib
        CMakeLists.txt
        my_dll.cpp
        my_dll.h
```

其中，根目录下放置了`CMakeLists.txt`，用于声明整个项目；

而`run_dll.cpp`为最终生成DLL库的加载测试代码，这里可以暂时忽略；

`lib`目录下就是生成DLL库的代码；

在这个简单的项目中，我们会在C++代码中创建一个`add`函数，用于实现两个数字相加，并返回结果；

生成DLL库，以供其他代码调用；

<br/>

### **编写C++生成DLL**

#### **初始化项目**

首先在项目根目录创建`CMakeLists.txt`，并编辑：

```cmake
cmake_minimum_required(VERSION 3.16)
project(dll_learn)

set(CMAKE_CXX_STANDARD 20)

# 声明引入子项目(目录)
ADD_SUBDIRECTORY(lib)
```

声明一些项目属性，创建lib目录，初始化整个项目；

<br/>

#### **初始化lib库**

在lib目录下，我们会真正的编写DLL库；

首先在lib目录下创建一个`CMakeLists.txt`，声明为一个子项目；

```cmake
# 设置变量
SET(LIBHELLO_SRC ./my_dll.h ./my_dll.cpp)
SET(CMAKE_LIBRARY_OUTPUT_DIRECTORY ../lib_out)

# 第一个参数为你需要构建的dll的名字，第二个为类型
ADD_LIBRARY(my_dll SHARED ${LIBHELLO_SRC})
INSTALL(TARGETS my_dll)
# 为dll设置linker
# 指定dll的生成目录，这里是：./lib_out
SET_TARGET_PROPERTIES(my_dll PROPERTIES LINKER_LANGUAGE C
        RUNTIME_OUTPUT_DIRECTORY ${CMAKE_LIBRARY_OUTPUT_DIRECTORY}
        LIBRARY_OUTPUT_DIRECTORY ${CMAKE_LIBRARY_OUTPUT_DIRECTORY}
        OUTPUT_NAME "my_dll"
        PREFIX "")
```

首先使用`SET`定义了两个变量：

-   **LIBHELLO_SRC**：lib库源文件；
-   **CMAKE_LIBRARY_OUTPUT_DIRECTORY**：编译最终输出目录；

随后使用`ADD_LIBRARY`声明了这是一个lib库；

然后使用`INSTALL`指定了目标`my_dll`，并使用`SET_TARGET_PROPERTIES`设置了目标的属性：

-   **PROPERTIES LINKER_LANGUAGE C**：声明为C链接库，提高DLL库的兼容性；
-   **XXX_OUTPUT_DIRECTORY**：指定输出命令；
-   **OUTPUT_NAME**：DLL库输出名称；
-   **PREFIX**：DLL库前缀，若不设置，可能会加默认前缀；如，`cygmy_dll.dll`；

>   更多关于CMake的内容可以查询相关文档！

<br/>

#### **编写lib库代码**

在lib目录下的CMakeLists中，我们声明了`my_dll.cpp`和`my_dll.h`两个文件；

下面我们来编写这两个文件；

my_dll.h

```cpp
#ifndef CPP_LEARN_MY_DLL_H
#define CPP_LEARN_MY_DLL_H

#define EXPORT_DLL __declspec(dllexport)

extern "C" EXPORT_DLL int add(int a, int b); // 即 int add(int a,int b)

#endif //CPP_LEARN_MY_DLL_H
```

my_dll.cpp

```cpp
#include "my_dll.h"

int add(int a, int b) {
    return (a + b);
}
```

在头文件中，我们使用`__declspec(dllexport)`声明并导出了一个dll函数；

使用`extern "C"`也是为了导出为C代码，以提高代码兼容性；

在cpp文件中，我们定义了头文件中声明的add函数；

至此，dll库就已经编写完成了！

<br/>

### **编译DLL**

在根目录先使用`cmake .`命令，在根目录和lib目录下编译出Makefile文件；

然后在根目录或者lib目录下使用`make install`即可编译出DLL库；

编译出的DLL库位于根目录的`lib_out`目录下，名称为：`my_dll.dll`；

和我们在cmake中配置的完全相同；

<br/>

### **测试DLL**

为了测试生成的DLL能否正常运行，我们需要编写代码并加载测试生成的DLL是否可以正常被调用；

在根目录下创建`run_dll.cpp`：

run_dll.cpp

```cpp
#include <windows.h>
#include <iostream>

typedef int (*add)(int, int);

int main() {
    HINSTANCE handle = LoadLibrary("./lib_out/my_dll.dll");
    auto f = (add) GetProcAddress(handle, "add");
    std::cout << f(1, 32) << std::endl;
    FreeLibrary(handle);
    return 0;
}
```

在run_dll.cpp中，我们首先动态加载了生成的DLL库，随后获取到了`add`方法，最后调用并输出了求和结果；

编写完成后，还要在根目录中的`CMakeLists.txt`中添加编译可执行文件的声明：

```diff
cmake_minimum_required(VERSION 3.16)
project(dll_learn)

set(CMAKE_CXX_STANDARD 20)

ADD_SUBDIRECTORY(lib)

+ add_executable(run_dll run_dll.cpp)
```

然后重新执行`cmake .`和`make install`编译项目；

这时会在项目根目录生成`run_dll.exe`；

运行`run_dll.exe`，可以生成结果：

```bash
$ run_dll.exe
33
```

测试成功！

>   关于其他编程语言加载DLL库，见：
>
>   -   [各编程语言加载并调用dll库](/2021/01/28/各编程语言加载并调用dll库/)

<br/>

## **附录**

源代码：

-   https://github.com/JasonkayZK/cpp_learn/tree/dll

系列文章：

-   [cmake生成动态链接库dll](/2021/01/27/cmake生成动态链接库dll/)
-   [各编程语言加载并调用dll库](/2021/01/28/各编程语言加载并调用dll库/)

<br/>