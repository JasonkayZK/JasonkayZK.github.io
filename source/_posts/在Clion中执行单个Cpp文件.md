---
title: 在Clion中执行单个Cpp文件
toc: true
cover: 'https://img.paulzzh.com/touhou/random?3'
date: 2020-11-15 16:09:26
categories: C++
tags: [C++, 技术杂谈, Clion]
description: 有时候我们需要执行一下在单个的Cpp文件中的代码，而通常Clion创建的都是CMake工程，需要修改CMake配置来运行单个cpp文件；
---

有时候我们需要执行一下在单个的Cpp文件中的代码，而通常Clion创建的都是CMake工程，需要修改CMake配置来运行单个cpp文件；

<br/>

<!--more-->

## 在Clion中执行单个Cpp文件

在CMake工程中，可以使用`add_executable`添加一条编译一个可执行文件的配置；

例如下面的配置：

```cmake
cmake_minimum_required(VERSION 3.16)
project(cpp_learn)

set(CMAKE_CXX_STANDARD 20)

add_executable(cpp_learn main.cpp)
add_executable(cpp_learn2 main2.cpp)
```

会同时使用`main.cpp`和`main2.cpp`，分别编译出`cpp_learn`和`cpp_learn2`两个可执行文件；

在Clion中我们可以添加叫做：`C/C++ Single File Exection`的插件；

这样，在单个文件中使用快捷键`Ctrl + Alt + Shift + E`（或使用右键添加的方式）即可添加当前文件到`CMakeLists.txt`文件中；


<br/>