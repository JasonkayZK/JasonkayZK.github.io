---
title: TOML学习
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?22'
date: 2022-11-28 14:31:24
categories: TOML
tags: [TOML, 技术杂谈]
description: Rust中的Cargo配置文件为TOML，这里通过一些文档简单学习了一下；
---

Rust中的Cargo配置文件为TOML，这里通过一些文档简单学习了一下；

<br/>

<!--more-->

# **TOML学习**

文档：

-   https://rustwiki.org/wiki/rust-related/toml/
-   https://toml.io/en/v1.0.0
-   https://github.com/LongTengDao/TOML/blob/%E9%BE%99%E8%85%BE%E9%81%93-%E8%AF%91/toml-v1.0.0.md

工具：

-   JSON转TOML：https://tooltt.com/json2toml/
-   TOML转JSON：https://tooltt.com/toml2json/

简而言之，用 `[table]` 表的形式来归并多个配置，并且去掉了 JSON 括号的形式或者 YAML 缩进的形式；

下面是一个例子：

```toml
# 单个配置
abc = "hello"

# 数组
arr = [1,2,3]

# 内联表
person = {name = { first = "Tom", last = "Preston-Werner" }}

# 表（统一的配置）
[table]
option = false
[table.nested]
option = true

# 表数组
[[table-arr]]
name = "Hammer"
sku = 738594937

[[table-arr]]  # 数组里的空表

[[table-arr]]
name = "Nail"
sku = 284758393
color = "gray"
```

对应的JSON：

```json
{
  "abc": "hello",
  "arr": [1, 2, 3],
  "person": {
    "name": {
      "first": "Tom",
      "last": "Preston-Werner"
    }
  },
  "table": {
    "option": false,
    "nested": {
      "option": true
    }
  },
  "table-arr": [
    {
      "name": "Hammer",
      "sku": 738594937
    },
    {},
    {
      "name": "Nail",
      "sku": 284758393,
      "color": "gray"
    }
  ]
}
```

<br/>
