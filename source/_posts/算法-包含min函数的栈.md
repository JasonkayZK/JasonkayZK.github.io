---
title: '算法:包含min函数的栈'
cover: http://api.mtyqx.cn/api/random.php?29
categories: 算法题目
toc: true
date: 1996-07-27 08:00:00
tags: [算法题目, 栈]
---

<br/>

<!--more-->

## 包含min函数的栈

[包含min函数的栈](https://www.nowcoder.com/practice/4c776177d2c04c2494f2555c9fcc1e49?tpId=13&tqId=11173&tPage=1&rp=1&ru=%2Fta%2Fcoding-interviews&qru=%2Fta%2Fcoding-interviews%2Fquestion-ranking)

  定义栈的数据结构，请在该类型中实现一个能够得到栈中所含最小元素的min函数（时间复杂度应为O（1））。 

  注意：保证测试中不会当栈为空的时候，对栈调用pop()或者min()或者top()方法。

****

### 分析

设定两个栈stack和minStack

-   入栈: 如果当前minStack为空或者入栈元素小于等于栈顶元素则入minStack; 而stack无论何时都会入栈
-   出栈: 如果当前出栈元素为minStack.peak, 则minStack出栈; 而stack无论何时都会出栈;

由于以上两点, 保证了minStack.peak即为当前栈中的min

****

### 代码

```java
import java.util.Stack;

public class Solution {

    private static Stack<Integer> stack;

    private static Stack<Integer> minStack;

    static {
        stack = new Stack<>();
        minStack = new Stack<>();
    }

    public void push(int node) {
        stack.push(node);
        if (minStack.isEmpty() || node <= minStack.peek()) {
            minStack.push(node);
        }
    }

    public void pop() {
        if (stack.peek() == minStack.peek()) {
            minStack.pop();
        }
        stack.pop();
    }

    public int top() {
        return stack.peek();
    }

    public int min() {
        return minStack.peek();
    }
}
```

