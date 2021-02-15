---
title: Go的中国身份证号校验库
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?87'
date: 2021-02-14 14:57:35
categories: Golang
tags: [Golang]
description: Go的中国身份证号校验库guanguans/id-validator，提供了身份证号正确性校验、随机生成身份证号、身份证号信息提取等功能；
---

Go的中国身份证号校验库[guanguans/id-validator](https://github.com/guanguans/id-validator)，提供了身份证号正确性校验、随机生成身份证号、身份证号信息提取等功能；

示例源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/id-validator-demo

<br/>

<!--more-->

## **Go的中国身份证号校验库**

校验库链接如下：

-   [guanguans/id-validator](https://github.com/guanguans/id-validator)

校验库提供了身份证号正确性校验、随机生成身份证号、身份证号信息提取等功能；

下面给出使用例子：

```go
package main

import (
	"fmt"
	idvalidator "github.com/guanguans/id-validator"
)

func main() {
	// 验证身份证号合法性
	fmt.Println(idvalidator.IsValid("440308199901101512"))  // 大陆居民身份证18位
	fmt.Println(idvalidator.IsValid("610104620927690"))     // 大陆居民身份证15位
	fmt.Println(idvalidator.IsValid("810000199408230021"))  // 港澳居民居住证18位
	fmt.Println(idvalidator.IsValid("830000199201300022"))  // 台湾居民居住证18位

	// 获取身份证号信息
	fmt.Println(idvalidator.GetInfo("440308199901101512"))
	// []interface {}[
	// 	github.com/guanguans/id-validator.IdInfo{          // 身份证号信息
	// 		AddressCode: int(440308)                           // 地址码
	// 		Abandoned:   int(0)                                // 地址码是否废弃：1为废弃的，0为正在使用的
	// 		Address:     string("广东省深圳市盐田区")             // 地址
	// 		AddressTree: []string[                             // 省市区三级列表
	//			string("广东省")                                    // 省
	//			string("深圳市")                                    // 市
	//			string("盐田区")                                    // 区
	//		]
	// 		Birthday:      <1999-01-10 00:00:00 +0000 UTC>     // 出生日期
	// 		Constellation: string("摩羯座")                     // 星座
	// 		ChineseZodiac: string("卯兔")                       // 生肖
	// 		Sex:           int(1)                              // 性别：1为男性，0为女性
	// 		Length:        int(18)                             // 号码长度
	// 		CheckBit:      string("2")                         // 校验码
	// 	}
	// 	<nil>                                              // 错误信息
	// ]

	// 生成可通过校验的假身份证号
	fmt.Println(idvalidator.FakeId()) // 随机生成
	fmt.Println(idvalidator.FakeRequireId(true, "江苏省", "200001", 1)) // 生成出生于2000年1月江苏省的男性居民身份证

	// 15位号码升级为18位
	fmt.Println(idvalidator.UpgradeId("610104620927690"))
	// []interface {}[
	// 	string("610104196209276908") // 升级后号码
	// 	<nil>                        // 错误信息
	// ]
}
```

这个库使用起来还是比较简单的：

-   IsValid：校验身份证号；
-   GetInfo：获取身份证号信息；
-   FakeId & FakeRequireId：生成虚假身份证号；
-   UpgradeId：15位号码升级为18位；

更多API可以查看手册：

-   https://godoc.org/github.com/guanguans/id-validator

<br/>