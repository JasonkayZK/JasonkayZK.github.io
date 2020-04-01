---
title: '算法:链表中倒数第k个结点'
cover: http://api.mtyqx.cn/api/random.php?24
categories: 算法题目
date: 1996-07-27 08:00:00
tags: [算法题目, 链表, 双指针]
---

<br/>

<!--more-->

## 链表中倒数第k个结点

[链表中倒数第k个结点](https://www.nowcoder.com/practice/529d3ae5a407492994ad2a246518148a?tpId=13&tqId=11167&tPage=1&rp=1&ru=%2Fta%2Fcoding-interviews&qru=%2Fta%2Fcoding-interviews%2Fquestion-ranking)

输入一个链表，输出该链表中倒数第k个结点。

****

### 分析

明显的快慢指针的问题

先让快指针走k步, 然后慢指针和快指针同时走, 当快指针到结尾之后, 慢指针即为第k个.

难点在于k的大小可能超过了链表长度, 此时fast指针会提前结束, 所以要在fast开始前进时进行判断:

```java
while (fast != null && --k >= 0) {
    fast = fast.next;
}
if (fast == null) return k == 0 ? slow : null;
```

****

### 代码

```java
public class Solution {
    public ListNode FindKthToTail(ListNode head,int k) {
        if (head == null || k <= 0) return null;

        ListNode fast = head, slow = head;
        while (fast != null && --k >= 0) {
            fast = fast.next;
        }
        if (fast == null) return k == 0 ? slow : null;

        while (fast != null) {
            fast = fast.next;
            slow = slow.next;
        }
        return slow;
    }
}
```

