---
title: 浅谈C++中的RAII
toc: true
cover: 'https://img.paulzzh.com/touhou/random?78'
date: 2020-12-13 11:08:44
categories: C++
tags: [C++, RAII]
description: RAII（Resource Acquisition Is Initialization）是由C++之父Bjarne Stroustrup提出的，中文翻译为资源获取即初始化，即使用局部对象来管理资源的技术称为资源获取即初始化；本文通过一个例子来讲述C++中的RAII；
---

RAII（Resource Acquisition Is Initialization）是由C++之父Bjarne Stroustrup提出的，中文翻译为资源获取即初始化，即使用局部对象来管理资源的技术称为资源获取即初始化；

本文通过一个例子来讲述C++中的RAII；


源代码: 

- https://github.com/JasonkayZK/cpp_learn/tree/raii

本文转自：

-   [c++经验之谈一：RAII原理介绍](https://zhuanlan.zhihu.com/p/34660259)

<br/>

<!--more-->

## 浅谈C++中的RAII



>   **什么是RAII？**
>
>   RAII（Resource Acquisition Is Initialization）是由c++之父Bjarne Stroustrup提出的，中文翻译为资源获取即初始化：使用局部对象来管理资源的技术称为资源获取即初始化；
>
>   **这里的资源主要是指操作系统中有限的东西如内存、网络套接字等等，局部对象是指存储在栈的对象，它的生命周期是由操作系统来管理的，无需人工介入；**

资源的使用一般经历三个步骤：

-   获取资源；
-   使用资源；
-   销毁资源；

但是资源的销毁往往是程序员经常忘记的一个环节；C++之父给出了解决问题的方案：RAII，它充分的利用了C++语言局部对象自动销毁的特性来控制资源的生命周期（正如本文开篇所讲）；

给一个简单的例子来看下局部对象的自动销毁的特性：

```cpp
#include <iostream>

using namespace std;

class person {
public:
    explicit person(std::string name = "", int age = 0) :
            name_(std::move(name)), age_(age) {
        std::cout << "Init a person!" << std::endl;
    }

    ~person() {
        std::cout << "Destroy a person!" << std::endl;
    }

private:
    const std::string name_;
    int age_;
};

void testPerson() {
    person p;
}

int main() {
    testPerson();
    return 0;
}
```

运行程序，会输出：

```
Init a person!
Destroy a person!
```

从person类可以看出，当我们在testPerson函数中声明一个局部对象的时候，会自动调用构造函数进行对象的初始化，**当整个testPerson函数执行完成后，自动调用析构函数来销毁对象，整个过程无需人工介入，由操作系统自动完成；**

于是，很自然联想到，当我们在使用资源的时候，在构造函数中进行初始化，在析构函数中进行销毁；

整个RAII过程为四个步骤：

-   **设计一个类封装资源；**
-   **在构造函数中初始化；**
-   **在析构函数中执行销毁操作；**
-   **使用时声明一个该对象的类；**

最后，举一个RAII在实际应用中的例子来结束本文；

Linux下经常会使用多线程技术，而在多线程中经常使用互斥锁保护临界资源一次只被一个线程访问，按照我们前面的分析，我们封装一下POSIX标准的互斥锁：

mutex.h

```cpp
#ifndef CPP_LEARN_MUTEX_H
#define CPP_LEARN_MUTEX_H

#include <pthread.h>
#include <cstdlib>
#include <cstdio>
#include <cstring>

class Mutex {
public:
    Mutex();
    ~Mutex();

    void Lock();
    void Unlock();

private:
    pthread_mutex_t mu_{};

    // No copying
    Mutex(const Mutex&);
    void operator=(const Mutex&);
};

#endif //CPP_LEARN_MUTEX_H
```

mutex.cpp

```cpp
#include "mutex.h"

static void PthreadCall(const char* label, int result) {
    if (result != 0) {
        fprintf(stderr, "pthread %s: %s\n", label, strerror(result));
    }
}

Mutex::Mutex() { PthreadCall("init mutex", pthread_mutex_init(&mu_, nullptr)); }

Mutex::~Mutex() { PthreadCall("destroy mutex", pthread_mutex_destroy(&mu_)); }

void Mutex::Lock() { PthreadCall("lock", pthread_mutex_lock(&mu_)); }

void Mutex::Unlock() { PthreadCall("unlock", pthread_mutex_unlock(&mu_)); }
```

写到这里其实就可以使用Mutex来锁定临界区；

但我们发现Mutex只是用来对锁的初始化和销毁，我们还得在代码中调用Lock和Unlock函数，这又是一个对立操作，所以我们可以继续使用RAII进行封装，代码如下：

test_mutex_lock.h

```cpp
#ifndef CPP_LEARN_TEST_MUTEX_LOCK_H
#define CPP_LEARN_TEST_MUTEX_LOCK_H

#include "mutex.h"

class  MutexLock {
public:
    explicit MutexLock(Mutex *mu)
            : mu_(mu)  {
        this->mu_->Lock();
    }
    ~MutexLock() { this->mu_->Unlock(); }

private:
    Mutex *const mu_;

    // No copying allowed
    MutexLock(const MutexLock&);
    void operator=(const MutexLock&);
};

#endif //CPP_LEARN_TEST_MUTEX_LOCK_H

```

到这里我们就真正封装了互斥锁，下面我们来通过一个简单的例子来使用它，代码如下：

test_mutex_lock.cpp

```cpp
#include "test_mutex_lock.h"
#include <iostream>

#define NUM_THREADS 10000

int num = 0;
Mutex mutex;

void *count([[maybe_unused]] void *args) {
    MutexLock lock(&mutex);
    num++;
}

int main() {
    int t;
    pthread_t thread[NUM_THREADS];

    for (t = 0; t < NUM_THREADS; t++) {
        int ret = pthread_create(&thread[t], nullptr, count, nullptr);
        if (ret) {
            return -1;
        }
    }

    for (t = 0; t < NUM_THREADS; t++)
        pthread_join(thread[t], nullptr);
    std::cout << num << std::endl;
    return 0;
}
```

<br/>

## **附录**

源代码: 

- https://github.com/JasonkayZK/cpp_learn/tree/raii

本文转自：

-   [c++经验之谈一：RAII原理介绍](https://zhuanlan.zhihu.com/p/34660259)

<br/>