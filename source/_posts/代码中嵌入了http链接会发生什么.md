---
title: 代码中嵌入了http链接会发生什么
toc: true
cover: 'https://acg.yanwz.cn/api.php?55'
date: 2020-12-07 16:15:44
categories: 技术杂谈
tags: [技术杂谈]
description: 有一次在C++的代码中不小心贴了个url，结果发现竟然能编译通过，并运行！
---

有一次在C++的代码中不小心贴了个url，结果发现竟然能编译通过，并运行！

<br/>

<!--more-->

## C语言代码中嵌入http链接会发生什么

猜一下，下面的C++代码能正常编译嘛：

```cpp
#include <iostream>

int main() {
    using namespace std;

    https://jasonkayzk.github.io/
    cout << "hello, world" << endl;
    return 0;
}
```

答案是可以正常编译，并输出`hello, world`；

原因其实很简单：

**`https`被当作了一个标签，而后面的`//`被当作了注释！**

<br/>