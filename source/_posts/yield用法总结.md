---
title: yield用法总结
toc: true
cover: 'https://img.paulzzh.com/touhou/random?2'
date: 2021-04-20 10:06:58
categories: 技术杂谈
tags: [技术杂谈]
description: yield在Java、C++、Python、JS中都有运用，本文讲解yield在各种编程语言中的用法；
---

yield在Java、C++、Python、JS中都有运用，本文讲解yield在各种编程语言中的用法；

-   转载自AlloyTeam：http://www.alloyteam.com/2021/03/15427/

源代码：

-   https://github.com/JasonkayZK/node_learn/tree/yield-demo

<br/>

<!--more-->

## **yield用法总结**

yield 英文直译有着「提供」、「退让」的意思，先了解直译，对后面内容理解有帮助；

完全不了解 yield 的同学，可以先看一下 api 使用文档稍微了解一下：

-   javascript yield：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/yield
-   c++ yield：https://zh.cppreference.com/w/cpp/thread/yield
-   python yield：https://docs.python.org/3/reference/simple_stmts.html#grammar-token-yield-stmt

<br/>

### **yield在javascript中**

我们先看一下 yield 在 javascript 中的定义:

>   <font color="#f00">**yield 关键字用来暂停和恢复一个生成器函数；**</font>

这句话里面有两个概念需要了解：

1.  生成器函数
2.  暂停和恢复

生成器函数就是 function*，（普通的 function 关键字后面增加了一个星号）；那它有什么用呢？

>   <font color="#f00">**生成器函数在执行时能暂停，后面又能从暂停处继续执行；**</font>

好家伙，这直接让人想到协程了；

不过我们不要去想着底层是如何实现的，还是把注意力放在**暂停和恢复**这两个行为上；

在前端代码中，我们让程序暂停和恢复的次数非常多，举例最大的点就是：发送请求，等待 ajax 返回；

```javascript
const response = await axios.get('/drink?id=yori');
// balabala 操作 response
```

当执行到如上代码的时候，需要发送 IO 请求；

而在 response 没有回来的时候，cpu 没啥事干，就去其他应用程序里打工去了，此时相当于整个函数执行变成了**暂停**状态，然后 response 回来，整个函数**恢复**执行；

#### **yield 与异步**

这样一看，首先 yield 能解决异步问题，我们可以写一个代码感受一下；

yield_and_async.js

```javascript
// app.js

function* main() {
    yield console.log("Jasonkay准备");
    yield* drink();
    yield console.log("Jasonkay喝不动了");
}

function* drink() {
    yield console.log("Jasonkay吨吨吨");

    yield new Promise(function (resolve, reject) {
        setTimeout(function () {
            console.log('过了3s');
            resolve();
        }, 3000);
    });
}

function run(gen) { // 类似 co
    const t = gen.next();
    const {value, done} = t;
    if (done) {
        console.log('End');
        return;
    }

    if (value instanceof Promise) {
        value.then((e) => run(gen))
    } else {
        run(gen);
    }
}

const gen = main();
run(gen);
```

输出结果：

```
Jasonkay准备
Jasonkay吨吨吨
过了3s
Jasonkay喝不动了
End
```

**异步出现在 drink 函数里面那个封装成 Promise 的 setTimeout；**

问题来了！yield 本身和 Promise 并没有什么火花，**对于 yield 来说它只是把 Promise 当作一个普通的 expression；**

<font color="#f00">**此时，反倒是 yield 配套的 next 起到了关键性的作用，虽然需要我们自己调用 next 很繁琐，但这同是将操作权给了我们，可以创造无限可能；**</font>

我们可以通过一个 if 条件，判断 yield 结果是否是一个 Promise，如果是 Promise，那就可以就地进行 then 等待，而并非立刻继续 next；

>   *这便是 co 函数的核心，但真正的 co 函数还有很多细节，感兴趣同学自行查阅；*

理解了上面这个示例代码，我们便知道了：

<font color="#f00">**用 yield 来将异步回调函数的写法转为同步的能力，是一种取巧的方案，必须依赖 co 函数进行辅助。**</font>所以相比较 async、await，yield 确实是一种临时方案，koa2 进行全面替换也无可厚非；

>   *谁要是异步代码不用 async、await，用 yield，头都给捶烂！！*

<br/>

#### **yield与迭代**

上面一章已经说了，yield 本身并不是给异步用的，那 yield 有自己存在的价值么？

当然还是有的！从网上关于 function* 的示例，基本上都是作为迭代使用，比如下：

```javascript
// yield_and_iteration

function* getValue() {
    let list = [1, 2, 3, 4, 5];
    for (let i = 0; i < list.length; i++) {
        yield list[i];
    }
}
const gen = getValue();

// 自己调用 next 的方式
let t;
while (t = gen.next(), !t.done) {
    console.log(t.value);
}

// 采用 for of 的方式
for (let t of getValue()) {
    console.log(t);
}
```

输出：

```
1
2
3
4
5
1
2
3
4
5
```

你可能觉得就这？？遍历数据我 for 循环不行么？当然可以，**但是这违背了泛型编程的思想：**

<font color="#f00">**数组的 for 循环是一种写法，链表的 for 循环是一种写法，二叉树的 for 循环也是一种写法，自定义的数据结构迭代又会是一种写法；**</font>

>   *不过对于前端而言，也不一定有那么强烈的泛型编程场景，还是得结合实际考虑；*

整体来说 yield 在迭代场景中使用还是比较简单，不过需要注意几点：

-   <font color="#f00">**生成器一定要相互独立，切勿随意复用；**</font>

```javascript
// yield_and_iteration_err

function* getValue() {
    let list = [1, 2, 3, 4, 5];
    for (let i = 0; i < list.length; i++) {
        yield list[i];
    }
}

// 没问题，generator 都相互独立
const gen1 = getValue();
let t1;
while (t1 = gen1.next(), !t1.done) {
    for (d of getValue()) {
        console.log(d);
    }
    console.log(t1.value);
}

console.log();

// 有问题
const gen2 = getValue();
let t2;
while (t2 = gen2.next(), !t2.done) {
    for (d of gen2) { // ⚠️这里用了同一个 gen
        console.log(d);
    }
    console.log(t2.value);
}
```

输出如下：

```
1
2
3
4
5
1
1
2
3
4
5
2
1
2
3
4
5
3
1
2
3
4
5
4
1
2
3
4
5
5

2
3
4
5
1
```

由于用了同一个generator，所以输出其实只有一次；

-   <font color="#f00">**不要在迭代过程中修改迭代的元素**</font>

```javascript
let list = [1, 2, 3, 4, 5];
for (let v of list) {
    console.log(v);
    if (Math.random() < 0.5) {
        list.unshift(6);
    }
}
```

看代码应该就能理解，会有元素被输出多次，而 6 这个元素永远不会出现；

当然，如果你觉得自己可以控制好修改元素的位置，并且很有自信，也是可以刀尖舔血的，但一定要记得：**v8 don't know what you want；**

-   <font color="#f00">**避免上层对 next 的调用**</font>

next 是一把双刃剑，它的灵活性让 yield 可以胜任很多骚操作（前面说的异步就是一种），但是我的建议是不要将这个东西给上层使用，请封装好，就像 co 函数，就像 for...of；

再回到最开始说的 yield 英文直译，可以理解「提供」和「退让」的语义在哪了么？

<br/>

### **yield在python中**

yield在python中的语义与js类似，下面给出了一个例子：

```python
def add_list(a_list):
  for i in a_list:
    yield i + 1

a_list = [1, 2, 3, 4]
for x in add_list(a_list):
  print(x)
```

生成+1的新列表；

<br/>

### **yield在C++中**

这一节就简单了，先直接上代码；

```c++
#include <thread>

void wait() {
    while (true) {
        // 进行 yield 调用，让出 cpu
        std::this_thread::yield();
    }
}

void calc() {
    int d = 0;
    for (int n = 0; n < 10000; ++n) {
        for (int m = 0; m < 10000; ++m) {
            d += d * m * n;
        }
    }
}

int main() {
    std::thread t1(wait);
    std::thread t2(calc);

    t1.detach();
    t2.join();

    return 0;
}
```

calc 是一个耗时的函数，在我机器上大概耗时 4s，此时如果我不在 wait 函数中加 yield 执行，**注意执行时 taskset 要设置成单 cpu 执行；**

```
real    0m7.920s
user    0m7.916s
sys     0m0.000s
```

这里 user 的时间不止 4s，可以看出 while true 占据了不少 cpu 时间片。

然后我们加上 yield 的后结果就不一样了：

```
real    0m7.910s
user    0m5.012s
sys     0m2.896s
```

这里 user 时间下降到 5s，wait 函数线程占据的 cpu 时间明显下降，但是 sys 时间上升，因为我们通过 yield 将时间交还给了内核，所以可以看到 sys 的时间有所增长；

再回到最开始说的 yield 英文直译，应该可以很容易理解 C++ 中的「退让」语义；

<br/>

### **yield在Java中**

Java中的yield语义和C++中的相同，这里不再赘述了；

<br/>

## **附录**

-   转载自AlloyTeam：http://www.alloyteam.com/2021/03/15427/

源代码：

-   https://github.com/JasonkayZK/node_learn/tree/yield-demo

<br/>