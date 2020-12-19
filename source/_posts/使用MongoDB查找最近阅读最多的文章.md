---
title: 使用MongoDB查找最近阅读最多的文章
toc: true
cover: 'https://acg.yanwz.cn/api.php?23'
date: 2020-12-19 11:28:08
categories: MongoDB
tags: [MongoDB, Node.js, 博客管理]
description: 最近给博客的文章添加了一些数据记录，然后用这些在MongoDB中的阅读记录添加了最近阅读比较多的功能；
---

最近给博客的文章添加了一些数据记录，然后用这些在MongoDB中的阅读记录添加了最近阅读比较多的功能；

<br/>

<!--more-->

## **使用MongoDB查找最近阅读最多的文章**

查找阅读比较多的功能主要是通过MongoDB的aggregate操作完成的；

在MondoDB中存储的文档大概是这个样子的：

```json
{
        "docName" : "Java集合七-List总结(LinkedList, ArrayList使用场景及性能分析)",
        "insertTime" : ISODate("2020-12-16T09:34:17.286Z")
}
{
        "docName" : "关于Mybatis-plus调用baseMapper报错Invalid-bound-statement的解决",
        "insertTime" : ISODate("2020-12-16T09:36:44.592Z")
}
```

现在需要取出`insertTime`所在的最近几天的数据，并聚合个数；

对应的js代码如下：

```javascript
async function getLikeAggregate(startTime, endTime) {
    const client = new MongoClient(uri, { useNewUrlParser: true });
    await client.connect();

    const cmd = client.db('db_name').collection('colloection_name');

    cmd.aggregate([
        {
            $group: {
                "_id": "$group_name",
                "count": { $sum: 1 },
            }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
    ]).toArray(function (err, result) {
        for (let r in result) {
            console.log("type:" + result[r]._id + "+的数量+" + result[r].count);
        }
    });
}
```

上述代码中：

-   group._id：聚合的字段名为group_name；
-   group.count：`$sum: 1`，表示对count求和；
-   sort：按照count从大到小排序；
-   limit：取出前五个；

调用代码如下：

```javascript
async function test() {
    let now = new Date();
    let res = await getLikeAggregate(new Date(now.getTime() - 1000 * 60 * 60 * 24), now)
    console.log(res);
}

test();
```

其中`1000 * 60 * 60 * 24`表示了最近24小时内的内容排序；

最终优化代码后，输出结果如下：

```
[
  { name: '张小凯と彼のBlog', view_count: 32 },
  { name: 'Aria2安装与配置', view_count: 31 },
  { name: '使用Docker部署Redis集群-三主三从', view_count: 20 },
  { name: '使用Docker部署kafka集群', view_count: 20 },
  { name: '分享几个直播源地址', view_count: 15 }
]
```

<br/>