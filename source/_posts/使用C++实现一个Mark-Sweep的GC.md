---
title: 使用C++实现一个Mark-Sweep的GC
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?53'
date: 2020-12-12 19:50:23
categories: C++
tags: [C++, GC]
description: 在现代编程语言中，无论是Java这种基于JVM的语言，还是Golang这种直接生成Native的语言，都存在自己的GC；由于GC的存在，我们可以肆无忌惮的申请内存并创建对象而不必手动的释放内存空间；而对于GC中的垃圾清理，我们也仅仅是停留在理论学习中；本文带大家使用C++实现一个简单的GC，以实际代码理解GC的实质；
---

在现代编程语言中，无论是Java这种基于JVM的语言，还是Golang这种直接生成Native的语言，都存在自己的GC；

由于GC的存在，我们可以肆无忌惮的申请内存并创建对象而不必手动的释放内存空间；而对于GC中的垃圾清理，我们也仅仅是停留在理论学习中；

本文带大家使用C++实现一个简单的GC，以实际代码理解GC的实质；


源代码: 

- https://github.com/JasonkayZK/mark_sweep_gc

<br/>

<!--more-->

## **使用C++实现一个Mark-Sweep的GC**

最近看到了一篇很不错的英文文章，讲解的是使用C实现一个简单的GC：

-   [Baby's First Garbage Collector](http://journal.stuffwithstuff.com/2013/12/08/babys-first-garbage-collector/)

但是这篇文章写的有点啰嗦，正好最近再看C++，就按照作者的思路用C++重新实现了一下作者文中的GC；

>   前言：
>
>   为了叙述GC的核心内容，本文假设你对于JVM中的GC已经有了一定的了解，并省去了一些常识性的叙述；

<br/>

### **什么是垃圾**

代码中的垃圾，其实就是那些我们**分配在堆上**但是**不再使用**的内存空间；

<font color="#f00">**注1：这些内存空间特指在堆上分配的内存！**</font>

因为：

-   **在栈上分配的内存会跟随函数的返回而被自动回收（局部对象）；**
-   **在local_thread中分配的内存会伴随当前线程的结束而被自动回收；**

所以在讨论GC时，我们不必考虑栈上和local_thread中分配的变量；

>   <font color="#f00">**上述的两条规则，也构成了C++中有名的RAII原理；**</font>

<font color="#f00">**注2：这些内存空间是不再使用的！**</font>

变量在使用中的定义：

-   **如果对象被作用域中的变量引用的话，那么它就是在使用中的；**
-   **如果对象被在使用中的对象引用的话，那么它也是在使用中的；**

>   **注：第二条规则是递归的：**
>
>   **如果对象A被一个变量引用，并且它有个字段引用了对象B，那么B也是正在使用中的，因为通过A你能对它进行访问；**

<br/>

### **确定和回收垃圾**

为了确定哪些垃圾是需要回收的，我们需要一张可达对象的图：

以一个变量为起点，你能够遍历到的所有对象，而不在这张可达对象图里的对象对程序来说都是没用的，那么它占有的内存就可以回收了；

>   这个可达图在实际JVM中的GC实现通常是多个GC Root；
>
>   对于可以作为GC Root的对象，在JVM中有自己的定义，这里不再赘述，可见：
>
>   -   [Java中什么样的对象才能作为gc root，gc roots有哪些呢？](https://www.zhihu.com/question/50381439)

为了简单起见，在本文中会简单使用一个单向链表来表示这个可达图；

而所有分配的对象都将被加入这个链表中；

对于查找及回收无用对象的方法有很多种，最简单也是最早的一种方法，叫“Mark-Sweep”，由John McCathy发明，他同时还发明了Lisp和大胡子；

查找和回收的过程和分析可达性的过程几乎一样：

-   从根对象开始，遍历整个对象图。每访问一个对象，就把一个标记位设成true；
-   一旦完成遍历，找出所有没有被标记过的对象，并清除掉它们；

这样就OK了；

<br/>

### **虚拟机与对象的定义**

在Java中，我们创建的每一个对象、申请并分配的每一块内存空间都需要JVM的参与：JVM分配内存、JVM创建对象；

在这里我们也定义了一个简单的VM和其中可以创建的对象类型（使我们可以回收这些对象）；

#### **① VM中的对象定义Object**

首先虽然在C++中有模板和泛型，但是为了简单起见，我们仅仅在这个VM中定义了两种类型：

```cpp
enum class ObjectType {
    OBJ_INT,
    OBJ_PAIR
};
```

其中：

-   OBJ_INT：表示一个int类型对象；
-   OBJ_PAIR：表示VM中的一个对象对，包括了VM中两个其他对象的指针；

使用OBJ_PAIR的原因是为了在代码中展示循环引用的场景；

VM中可产生的对象只有上述两种类型，我们可以使用C++中的union来表示VM中的一个对象：

```cpp
class Object {
public:
    ObjectType type;
    unsigned char marked;

    /* The next object in the linked list of heap allocated objects. */
    struct Object *next;

    union {
        /* OBJ_INT */
        int value;

        /* OBJ_PAIR */
        struct {
            Object *head;
            Object *tail;
        };
    };

    void static objectPrint(Object *object);
};
```

Object类包括：

-   type字段：用来标识它是什么类型的，int或者是pair；
-   union结构：用来保存int或者pair的数据；

>   union声明了C++中一个内存重叠的字段，union同时只可能是一种类型；
>
>   一个指定的对象要么是int要么是pair，没必要在内存里同时给它们分配三个字段，一个union就搞定了；

-   marked：当前对象是否被标记；
-   *next：VM中对象可达图的对象指针，指向下一个堆中分配的对象；
-   objectPrint成员方法：递归的方式输出当前对象；

objectPrint的实现如下：

```cpp
void Object::objectPrint(Object *object) {
    switch (object->type) {
        case ObjectType::OBJ_INT:
            std::cout << object->value << std::endl;
            break;

        case ObjectType::OBJ_PAIR:
            printf("(");
            Object::objectPrint(object->head);
            printf(", ");
            Object::objectPrint(object->tail);
            printf(")");
            break;
    }
}
```

如果对象是OBJ_PAIR类型，则会递归的输出其链出的对象；

****

#### **② 虚拟机定义VM**

下面我们定义虚拟机；

在本文中，这个虚拟机的作用就是持有一个栈，用来存储当前使用的变量；

>   很多语言的虚拟机要么是基于栈的（如JVM和CLR），要么是基于寄存器的（比如Lua）；
>
>   不管是哪种结构，实际上它们都得有一个栈，用来存储本地变量以及表达式中可能会用到的中间变量；

我们用一种简单明了的方式将它抽象出来，就像这样：

```cpp
#define STACK_MAX 256
#define INITIAL_GC_THRESHOLD 8

class VM {
public:
    Object *stack[STACK_MAX]{};
    int stackSize;

    /* The first object in the linked list of all objects on the heap. */
    Object *firstObject;

    /* The total number of currently allocated objects. */
    int numObjects;

    /* The number of objects required to trigger a GC. */
    int maxObjects;

    VM();

    ~VM();

    void static assert(int condition, const char *message);

    void push(Object *value);

    Object *pop();

    void mark(Object *object);

    void markAll();

    void sweep();

    void gc();

    Object *newObject(ObjectType type);

    void pushInt(int intValue);

    Object *pushPair();

    void freeVM();
};
```

上面VM的定义有一点复杂，我们一点一点来看；

首先VM中定义了一个栈，并声明了栈的最大值STACK_MAX，以及当前栈的大小stackSize：

```cpp
#define STACK_MAX 256
class VM {
public:
    Object *stack[STACK_MAX]{};
    int stackSize;
    ……
};
```

>   为了记录VM中更多的信息，我们定义了下面的几个变量/常量：
>
>   -   INITIAL_GC_THRESHOLD：触发GC阈值常量，保守点的话就设置的小点，希望GC花的时间少点的话就设置大点；
>   -   *firstObject：对象可达图的入口对象(链表头)；
>   -   numObjects：VM中已分配的对象数目；
>   -   maxObjects：触发GC的已分配对象阈值；

现在我们需要的基本的数据结构已经就绪了，接下来写一下VM的构造函数和析构函数，用来创建，初始化、清理虚拟机：

```cpp
VM::VM() {
    std::cout << "vm started!" << std::endl;
    this->stackSize = 0;
    this->firstObject = nullptr;
    this->numObjects = 0;
    this->maxObjects = INITIAL_GC_THRESHOLD;
}

VM::~VM() {
    std::cout << "all objects cleaned, vm closed!" << std::endl;
}

void VM::assert(int condition, const char *message) {
    if (!condition) {
        std::cout << message << std::endl;
        exit(1);
    }
}
```

>   为了显示VM被清理，我们在VM的析构函数中友好的显示了VM被清理的信息；
>
>   为了模拟JVM OOM以及其他各种Error异常，我们定义了assert方法，帮助我们打印错误信息，并退出程序；

有了虚拟机后，我们需要对它的栈进行一些操作：

```cpp
void VM::push(Object *value) {
    assert(this->stackSize < STACK_MAX, "Stack overflow!");
    this->stack[this->stackSize++] = value;
}

Object *VM::pop() {
    assert(this->stackSize > 0, "Stack underflow!");
    return this->stack[--this->stackSize];
}
```

好了，现在我们可以把东西存到栈中了；

然后，我们需要实际去创建一些对象，下面是VM创建对象的方法：

```cpp
Object *VM::newObject(ObjectType type) {
    if (this->numObjects == this->maxObjects) gc();

    auto *object = new Object();
    object->type = type;
    object->next = this->firstObject;
    this->firstObject = object;
    object->marked = 0;

    this->numObjects++;

    return object;
}
```

>   注意到：
>
>   -   **当VM中的对象数numObjects达到maxObjects后就会触发GC（GC过程在下一节详细讲述）；**
>   -   **创建新对象的时候，maked字段会被初始化成0；**
>   -   **创建对象时会将对象加入对象链表中；**
>

它会进行内存分配并且设置类型标记，有了它我们就可以把不同类型的对象压到栈里了：

```cpp
void VM::pushInt(int intValue) {
    Object *object = newObject(ObjectType::OBJ_INT);
    object->value = intValue;

    push(object);
}

Object *VM::pushPair() {
    Object *object = newObject(ObjectType::OBJ_PAIR);
    object->tail = pop();
    object->head = pop();

    push(object);
    return object;
}
```

目前，我们的这个VM已经可以分配内存、创建对象；

下面我们来实现垃圾回收部分；

<br/>

### **Mark-Sweep(标记清除算法)**

#### **① 标记阶段**

第一个阶段是标记阶段：

我们需要遍历所有的可达对象，并且设置它们的标记位`Object->marked`；

为了标记所有的可达对象，我们得从内存里的变量先开始，也就是说我们得访问栈，代码如下：

```cpp
void VM::mark(Object *object) {
    /* If already marked, we're done. Check this first to avoid recursively
       on cycles in the object graph. */
    if (object->marked) return;

    object->marked = 1;

    if (object->type == ObjectType::OBJ_PAIR) {
        mark(object->head);
        mark(object->tail);
    }
}

void VM::markAll() {
    for (int i = 0; i < this->stackSize; i++) {
        mark(this->stack[i]);
    }
}
```

现在我们可以调用markAll来标记VM中所有的可达对象；

****

#### **② 清除阶段**

下一个清除阶段就是遍历所有分配的对象，释放掉那些没有被标记的对象；

如果在虚拟机中仅实现了关于对象引用的语义，一旦某个对象没有人引用了，我们将会彻底的失去它，并导致内存泄露；

所以我们为所有分配地对象维护一个链表，而虚拟机记录了这个链表的头节点；

我们在VM的构造函数中，将firstObject初始成NULL，而当我们要创建对象时，我们把它加到链表中(具体见newObject方法)；

>   这样的话，即便从语言的角度来看无法找到一个对象，在语言的实现中还是能够找到的；

要扫描并删除未被标记的对象，我们只需要遍历这个链表即可：

```cpp
void VM::sweep() {
    Object **object = &this->firstObject;
    while (*object) {
        if (!(*object)->marked) {
            /* This object wasn't reached, so remove it from the list and free it. */
            Object *unreached = *object;

            *object = unreached->next;
            delete (unreached);

            this->numObjects--;
        } else {
            /* This object was reached, so unmark it (for the next GC) and move on to
             the next. */
            (*object)->marked = 0;
            object = &(*object)->next;
        }
    }
}
```

上面的这段代码用到了指针的指针遍历了一下整个列表，一旦它发现一个未标记的对象，就释放它的内存，并把它从列表中移除；

调用了这个方法之后，所有被标记为不可达（未被标记）的对象都被我们删除了；

<br/>

### **gc方法**

在gc方法中，我们将markAll和sweep方法整合在一起：

```cpp
void VM::gc() {
    int i_numObjects = this->numObjects;

    markAll();
    sweep();

    this->maxObjects = this->numObjects == 0 ? INITIAL_GC_THRESHOLD : this->numObjects * 2;

    printf("Collected %d objects, %d remaining.\n", i_numObjects - this->numObjects,
           this->numObjects);
}
```

并且在每次GC时给出VM中的objects数量等友好提示；

对于GC方法，一个比较棘手的问题就是究竟在什么时候去调用它，到底什么才是内存紧张？

这个问题并没有标准答案，这取决于你如何使用你的虚拟机并且它运行在什么样的硬件上；

为了让本文的例子简单点，我们在分配一定数量对象后进行回收(具体见newObject方法)；

并且每次回收之后，我们会根据存活对象的数量，更新maxOjbects的值；

>   <font color="#f00">**这里乘以2是为了让我们的堆能随着存活对象数量的增长而增长；**</font>
>
>   <font color="#f00">**同样的，如果大量对象被回收之后，堆也会随着缩小；**</font>

>   补充：清理VM中所有对象；
>
>   这个方法实现早freeVM方法中：
>
>   ```cpp
>   void VM::freeVM() {
>       this->stackSize = 0;
>       gc();
>   }
>   ```
>
>   只需将当前栈清空（大小置为0），再调用gc；
>
>   再gc的markAll阶段不会标记任何object，从而所有的对象都会被清除！

<br/>

### **测试**

测试代码包括了栈上分配还在使用的内存、回收已经释放的内存、对象内的引用、循环引用、以及性能测试；

```cpp
void test1() {
    printf("Test 1: Objects on stack are preserved.\n");
    auto vm = new VM();
    vm->pushInt(1);
    vm->pushInt(2);

    vm->gc();
    VM::assert(vm->numObjects == 2, "Should have preserved objects.");
    vm->freeVM();
    delete (vm);
}

void test2() {
    printf("Test 2: Unreached objects are collected.\n");
    auto vm = new VM();
    vm->pushInt(1);
    vm->pushInt(2);
    vm->pop();
    vm->pop();

    vm->gc();
    VM::assert(vm->numObjects == 0, "Should have collected objects.");
    vm->freeVM();
    delete (vm);
}

void test3() {
    printf("Test 3: Reach nested objects.\n");
    auto vm = new VM();
    vm->pushInt(1);
    vm->pushInt(2);
    vm->pushPair();
    vm->pushInt(3);
    vm->pushInt(4);
    vm->pushPair();
    vm->pushPair();

    vm->gc();
    VM::assert(vm->numObjects == 7, "Should have reached objects.");
    vm->freeVM();
    delete (vm);
}

void test4() {
    printf("Test 4: Handle cycles.\n");
    auto vm = new VM();
    vm->pushInt(1);
    vm->pushInt(2);
    Object *a = vm->pushPair();
    vm->pushInt(3);
    vm->pushInt(4);
    Object *b = vm->pushPair();

    /* Set up a cycle, and also make 2 and 4 unreachable and collectible. */
    a->tail = b;
    b->tail = a;

    vm->gc();
    VM::assert(vm->numObjects == 4, "Should have collected objects.");
    vm->freeVM();
    delete (vm);
}

void perfTest() {
    printf("Performance Test.\n");
    auto vm = new VM();

    for (int i = 0; i < 1000; i++) {
        for (int j = 0; j < 20; j++) {
            vm->pushInt(i);
        }

        for (int k = 0; k < 20; k++) {
            vm->pop();
        }
    }
    vm->freeVM();
    delete (vm);
}

int main() {
    test1();
    test2();
    test3();
    test4();
    perfTest();

    return 0;
}
```

除性能测试之外的输出如下：

```
Test 1: Objects on stack are preserved.
vm started!
Collected 0 objects, 2 remaining.
Collected 2 objects, 0 remaining.
all objects cleaned, vm closed!
Test 2: Unreached objects are collected.
vm started!
Collected 2 objects, 0 remaining.
Collected 0 objects, 0 remaining.
all objects cleaned, vm closed!
Test 3: Reach nested objects.
vm started!
Collected 0 objects, 7 remaining.
Collected 7 objects, 0 remaining.
all objects cleaned, vm closed!
Test 4: Handle cycles.
vm started!
Collected 2 objects, 4 remaining.
Collected 4 objects, 0 remaining.
all objects cleaned, vm closed!
```

<br/>

### **C++中使用GC还是RAII？**

我们已经动手实现了一个简单的GC，在这个基础之上你可以做很多优化；

在文章最后，我们不禁要问，为什么C++不实现一个自己的GC，而解放我们这些写代码的人呢？

下面是知乎上提出的几个相关问题：

-   [为什么 C++ 11 标准不加入 GC 功能呢？](https://www.zhihu.com/question/24954016)
-   [一个采用GC的原生程序语言有没有可能性能上超越非GC的原生程序语言？](https://www.zhihu.com/question/38796174)

总结下来大概就是C++中已经存在了RAII和智能指针，再不济C++可以自己指定内存池；

>   本文不打算在这个问题上花过多篇幅，关于RAII可以看这篇文章：
>
>   -   [浅谈C++中的RAII](https://jasonkayzk.github.io/2020/12/13/浅谈C++中的RAII/)；

<br/>

## **附录**

文章参考：

-   [Baby's First Garbage Collector](http://journal.stuffwithstuff.com/2013/12/08/babys-first-garbage-collector/)

源代码: 

- https://github.com/JasonkayZK/mark_sweep_gc

<br/>