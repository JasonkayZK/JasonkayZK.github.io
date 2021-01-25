---
title: '算法:和为S的连续正数序列'
cover: https://img.paulzzh.tech/touhou/random?49
categories: 算法题目
date: 1996-07-27 08:00:00
tags: [算法题目, 数学]
toc: true
---

<br/>

<!--more-->

## 和为S的连续正数序列

[和为S的连续正数序列](https://www.nowcoder.com/practice/c451a3fd84b64cb19485dad758a55ebe?tpId=13&tqId=11194&tPage=3&rp=1&ru=%2Fta%2Fcoding-interviews&qru=%2Fta%2Fcoding-interviews%2Fquestion-ranking)

小明很喜欢数学,有一天他在做数学作业时,要求计算出9~16的和,他马上就写出了正确答案是100。但是他并不满足于此,他在想究竟有多少种连续的正数序列的和为100(至少包括两个数)。没多久,他就得到另一组连续正数和为100的序列:18,19,20,21,22。现在把问题交给你,你能不能也很快的找出所有和为S的连续正数序列? Good Luck!

输出描述:

```
输出所有和为S的连续正数序列。序列内按照从小至大的顺序，序列间按照开始数字从小到大的顺序
```

****

### 分析

由于我们要找的是和为S的连续正数序列，因此这个序列是个公差为1的等差数列，而这个序列的中间值代表了平均值的大小。假设序列长度为n，那么这个序列的中间值可以通过（S / n）得到，知道序列的中间值和长度，也就不难求出这段序列了。 

满足条件的n分两种情况： 

-   n为奇数时，序列中间的数正好是序列的平均值，所以条件为：(n & 1) == 1 && sum % n == 0；
-   n为偶数时，序列中间两个数的平均值是序列的平均值，而这个平均值的小数部分为0.5，所以条件为：(sum % n) * 2 == n 

由题可知n >= 2，那么n的最大值是多少呢？我们完全可以将n从2到S全部遍历一次，但是大部分遍历是不必要的。为了让n尽可能大，我们让序列从1开始， 

  根据等差数列的求和公式：S = (1 + n) * n / 2，得到n < sqrt(2S)

  最后举一个例子，假设输入sum = 100，我们只需遍历n = 13~2的情况（按题意应从大到小遍历）

n = 8时，得到序列[9, 10, 11, 12, 13, 14, 15, 16]；

n = 5时，得到序列[18, 19, 20, 21, 22]。 

****

### 代码

```java
import java.util.ArrayList;
public class Solution {
    public ArrayList<ArrayList<Integer> > FindContinuousSequence(int sum) {
        ArrayList<ArrayList<Integer>> res = new ArrayList<>(512);
        for (int n = (int) Math.sqrt(2 * sum); n >= 2; --n) {
            // n是序列长度
            // n可以被sum整除
            if (((n & 1) == 1 && sum % n == 0) || ((sum % n) * 2 == n)) {
                ArrayList<Integer> cur = new ArrayList<>(512);
                for (int j = 0, start = (sum / n) - (n - 1) / 2; j < n; ++j, start++) {
                    cur.add(start);
                }
                res.add(cur);
            }
        }
        return res;
    }
}
```

