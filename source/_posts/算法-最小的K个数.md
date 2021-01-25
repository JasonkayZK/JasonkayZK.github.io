---
title: '算法:最小的K个数'
cover: https://acg.toubiec.cn/random?38
categories: 算法题目
date: 1996-07-27 08:00:00
tags: [算法题目, 数组]
toc: true
---

<br/>

<!--more-->

## 最小的K个数

[最小的K个数](https://www.nowcoder.com/practice/6a296eb82cf844ca8539b57c23e6e9bf?tpId=13&tqId=11182&tPage=2&rp=1&ru=%2Fta%2Fcoding-interviews&qru=%2Fta%2Fcoding-interviews%2Fquestion-ranking)

输入n个整数，找出其中最小的K个数。例如输入4,5,1,6,2,7,3,8这8个数字，则最小的4个数字是1,2,3,4。

****

### 分析

求最小的K个数使用最大堆;

对于每个数字:

-   如果当前堆大小小于K, 直接加入
-   如果当前堆大小大于K, 则通过下面的策略保证容量为K
    -   如果当前数字大于等于堆顶元素, 说明数字大于等于所有的最小K个数, 直接忽略;
    -   如果当前数字小于堆顶元素, 则移去堆顶元素, 并且将当前元素加入堆中;

同理, 求最大的K个数使用最小堆;

****

### 代码

```java
import java.util.ArrayList;
import java.util.PriorityQueue;
import java.util.Queue;
public class Solution {
    public ArrayList<Integer> GetLeastNumbers_Solution(int[] input, int k) {
        if (input == null || input.length == 0 || input.length < k || k == 0) return new ArrayList<>();

        Queue<Integer> queue = new PriorityQueue<>((x, y) -> y - x);
        for (int n : input) {
            if (queue.size() < k) {
                queue.offer(n);
                continue;
            }
            if (n < queue.peek()) {
                queue.poll();
                queue.offer(n);
            }
        }
        return new ArrayList<>(queue);
    }
}
```

