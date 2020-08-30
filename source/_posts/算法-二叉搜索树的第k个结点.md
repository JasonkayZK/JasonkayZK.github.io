---
title: '算法:二叉搜索树的第k个结点'
cover: http://api.mtyqx.cn/api/random.php?64
categories: 算法题目
date: 1996-07-27 08:00:00
tags: [算法题目, 二叉树, 搜索]
toc: true
---

<br/>

<!--more-->

## 二叉搜索树的第k个结点

[二叉搜索树的第k个结点](https://www.nowcoder.com/practice/ef068f602dde4d28aab2b210e859150a?tpId=13&tqId=11215&tPage=4&rp=1&ru=%2Fta%2Fcoding-interviews&qru=%2Fta%2Fcoding-interviews%2Fquestion-ranking)

给定一棵二叉搜索树，请找出其中的第k小的结点。

例如， （5，3，7，2，4，6，8）  中，按结点数值大小顺序第三小结点的值为4。

****

### 分析

对于二叉树的中序遍历即为有序数列;

所以设置一个index, 对二叉树进行中序遍历;

如果index==k则直接返回;

****

### 代码

```java
public class Solution {
    int index = 0;

    TreeNode KthNode(TreeNode root, int k) {
        if (root != null) {
            TreeNode node = KthNode(root.left, k);
            if (node != null)
                return node;
            index++;
            if (index == k)
                return root;
            node = KthNode(root.right, k);
            if (node != null)
                return node;
        }
        return null;
    }
}
```

