---
title: 简单实现C++内存分配跟踪
toc: true
cover: 'https://img.paulzzh.com/touhou/random?55'
date: 2022-11-12 10:27:10
categories: C++
tags: [C++, 技术杂谈]
description: 有的时候我们想要跟踪我们的代码到底分配了多少的内存，一个常用的方法是使用 Valgrind 工具进行内存分析；但是对于一些场景，我们不想这么麻烦，那么此时我们可以通过简单的覆盖 malloc、free 等函数实现！
---

有的时候我们想要跟踪我们的代码到底分配了多少的内存，一个常用的方法是使用 Valgrind 工具进行内存分析；

但是对于一些场景，我们不想这么麻烦，那么此时我们可以通过简单的覆盖 malloc、free 等函数实现！

源代码：

-   https://github.com/JasonkayZK/cpp-learn/tree/track-memory

<br/>

<!--more-->

# **简单实现C++内存分配跟踪**

## **简单实现**

我们知道，C、C++ 中主要是通过 `malloc`、`free` 函数以及 `new`、`delete`、`new[]`、`delete[]` 等运算符进行内存分配；

对于 `malloc`、`free` 函数而言：

**虽然他们是在编译时通过链接到 `glibc` 库加入的，但是我们可以通过`宏定义`来替换他们，从而实现自己的逻辑；**

对于 `new`、`delete` 等运算符，可以通过全局覆盖（`override`）他们来实现 Hook；

具体实现的代码很简单，如下：

[track_memory.h](https://github.com/JasonkayZK/cpp-learn/blob/track-memory/track_memory.h)

```c++
#ifndef TRACK_MEMORY_H_
#define TRACK_MEMORY_H_

/**
 * Implements simple memory tracking for use in C++ applications.
 * Define: TRACK_MEMORY to enable during debug and unit testing, and undef for production.
 * Define: PRINT_MEMORY_TRACKING to print memory tracking
 */

#include <cassert>
#include <cstdio>
#include <cstdlib>

#ifdef TRACK_MEMORY
#include <map>

size_t gAllocatedMemory = 0;
bool gTrackAllocation = true;
typedef std::map<void *, size_t> AllocationMap;
static AllocationMap gAllocationMapStandard;
static AllocationMap gAllocationMapArray;

/**
 * Allocates using a map to keep track of sizes.
 */
inline void *wrap_malloc(size_t size,
                         const char *file,
                         int line,
                         const char *func,
                         AllocationMap &map = gAllocationMapStandard) {

  assert(size != 0);
  void *ptr;

  if (gTrackAllocation) {
    gAllocatedMemory += size;
    ptr = malloc(size);

    gTrackAllocation = false;
    map[ptr] = size;
    gTrackAllocation = true;

#ifdef PRINT_MEMORY_TRACKING
    printf("[Malloc %s:%d:%s] Allocated mem 0x%8.8lx: %8ld (%ld)\n",
           file, line, func, (unsigned long) ptr, gAllocatedMemory, size);
#endif
  } else {
    ptr = malloc(size);
  }

  if (ptr == nullptr)
    throw std::bad_alloc();
  else
    return ptr;
}

/**
 * Deletes stuff allocated with tracked_new.
 */
inline void wrap_free(void *ptr,
                      const char *file,
                      int line,
                      const char *func,
                      AllocationMap &map = gAllocationMapStandard) {

  if (gTrackAllocation) {
    size_t size = map[ptr];
    assert(size != 0);
    gAllocatedMemory -= size;

#ifdef PRINT_MEMORY_TRACKING
    printf("[Delete %s:%d:%s] Deallocated mem 0x%8.8lx: %8ld (-%ld)\n",
           file, line, func, (unsigned long) ptr,
           gAllocatedMemory,
           size);
#endif

    gTrackAllocation = false;
    map.erase(ptr);
    gTrackAllocation = true;
  }

  free(ptr);
}

#define malloc(X) wrap_malloc(X, __FILE__, __LINE__, __FUNCTION__)
#define free(X) wrap_free(X, __FILE__, __LINE__, __FUNCTION__)

void *operator new(size_t size) noexcept(false) {
  return wrap_malloc(size, __FILE__, __LINE__, __FUNCTION__, gAllocationMapStandard);
}

void *operator new[](size_t size) noexcept(false) {
  return wrap_malloc(size, __FILE__, __LINE__, __FUNCTION__, gAllocationMapArray);
}

void operator delete(void *ptr) noexcept {
  wrap_free(ptr, __FILE__, __LINE__, __FUNCTION__, gAllocationMapStandard);
}

void operator delete[](void *ptr) noexcept {
  wrap_free(ptr, __FILE__, __LINE__, __FUNCTION__, gAllocationMapArray);
}

#endif /* TRACK_MEMORY */

#endif // TRACK_MEMORY_H_
```

为了使用起来更加方便，我定义了：

-   **`TRACK_MEMORY`：启用内存监控的总开关；**
-   **`PRINT_MEMORY_TRACKING`：是否打印内存分配内容；**

同时，定义了：`gAllocationMapStandard`  和 `gAllocationMapArray` 来保存分配的内存空间；

并且使用 `gAllocatedMemory` 来记录当前已分配的字节数；

<br/>

### **覆盖` malloc` 和 `free`**

代码中，`wrap_malloc` 和 `wrap_free` 包装了在 `glibc` 中的 ` malloc` 和 `free` 函数；

随后，通过宏覆盖了原来的 ` malloc` 和 `free`：

```c++
#define malloc(X) wrap_malloc(X, __FILE__, __LINE__, __FUNCTION__)
#define free(X) wrap_free(X, __FILE__, __LINE__, __FUNCTION__)
```

<font color="#f00">**注意：这里必须要先定义函数，再进行宏替换，否则会将 wrapper 函数中的 malloc 也给替换掉！**</font>

>   **这里实现的是单线程的内存分配跟踪，对于多线程的实现，需要使用 Lock 将上面共享的内容保护起来！**

<br/>

### **覆盖`new`和`delete`**

上面的代码完成了对 ` malloc` 和 `free` 函数的覆盖；

那么对于 `new`和`delete` 等运算符来说，我们只需要调用上面已经实现的包装函数即可：

```c++
void *operator new(size_t size) noexcept(false) {
  return wrap_malloc(size, __FILE__, __LINE__, __FUNCTION__, gAllocationMapStandard);
}

void *operator new[](size_t size) noexcept(false) {
  return wrap_malloc(size, __FILE__, __LINE__, __FUNCTION__, gAllocationMapArray);
}

void operator delete(void *ptr) noexcept {
  wrap_free(ptr, __FILE__, __LINE__, __FUNCTION__, gAllocationMapStandard);
}

void operator delete[](void *ptr) noexcept {
  wrap_free(ptr, __FILE__, __LINE__, __FUNCTION__, gAllocationMapArray);
}
```

**这里需要注意的是：**

<font color="#f00">**由于运算符重载函数是无法 inline 的，因此 `__LINE__`、`__FILE__` 实际上只能获取到这个文件的路径；**</font>

<font color="#f00">**并且，由于我们在重载时，无法实现在和原来的 `void *operator new(size_t size)` 函数签名完全相同下、增加入参的重载（否则会不知道究竟使用哪个实现！）**</font>

>   **如果有小伙伴们知道怎么做，可以在下方留言评论～**

>   关于重写库函数或系统调用：
>
>   -   [重写库函数或系统调用](https://irgb.github.io/%E5%A6%82%E4%BD%95%E9%87%8D%E5%86%99%E5%BA%93%E5%87%BD%E6%95%B0%E6%88%96%E7%B3%BB%E7%BB%9F%E8%B0%83%E7%94%A8/)

至此，我们的功能编写完成！

<br/>

## **测试用例**

在使用时，我们在源代码的开头引入这个头文件，并定义对应的宏开启功能即可！

即：

```c++
#define TRACK_MEMORY
#define PRINT_MEMORY_TRACKING

#include "track_memory.h"
```

例如：

[main.cc](https://github.com/JasonkayZK/cpp-learn/blob/track-memory/main.cc)

```c++
#define TRACK_MEMORY
#define PRINT_MEMORY_TRACKING

#include "track_memory.h"

int main() {
  char *buf = new char[100];
  delete[] buf;

  struct TestStruct {
    long a;
    long b;
  };

  auto *testStruct = new TestStruct;
  delete testStruct;

  auto *ptr = malloc(sizeof(TestStruct));
  free(ptr);
}
```

执行后输出：

```
[Malloc /root/data/cpp-learn/track_memory.h:94:operator new []] Allocated mem 0x01b0f260:      100 (100)
[Delete /root/data/cpp-learn/track_memory.h:102:operator delete []] Deallocated mem 0x01b0f260:        0 (-100)
[Malloc /root/data/cpp-learn/track_memory.h:90:operator new] Allocated mem 0x01b0f720:       16 (16)
[Delete /root/data/cpp-learn/track_memory.h:98:operator delete] Deallocated mem 0x01b0f720:        0 (-16)
[Malloc /root/data/cpp-learn/main.cc:18:main] Allocated mem 0x01b0f720:       16 (16)
[Delete /root/data/cpp-learn/main.cc:19:main] Deallocated mem 0x01b0f720:        0 (-16)
```

即可完成对内存分配的跟踪，非常方便！

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/cpp-learn/tree/track-memory

文章参考：

-   http://joshcarter.com/software/easy_cpp_allocation_tracking/
-   https://stackoverflow.com/questions/438515/how-to-track-memory-allocations-in-c-especially-new-delete
-   [https://irgb.github.io/%E5%A6%82%E4%BD%95%E9%87%8D%E5%86%99%E5%BA%93%E5%87%BD%E6%95%B0%E6%88%96%E7%B3%BB%E7%BB%9F%E8%B0%83%E7%94%A8/](https://irgb.github.io/如何重写库函数或系统调用/)
-   https://stackoverflow.com/questions/1094532/problem-in-overriding-malloc

<br/>
