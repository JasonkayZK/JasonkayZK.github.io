---
title: Postman中Tests脚本总结
cover: https://acg.yanwz.cn/api.php?72
date: 2020-05-22 20:50:15
categories: [软件测试]
tags: [软件测试, Postman]
toc: true
description: 本文讲述了如何编写Postman中的Tests脚本;
---

本文讲述了如何编写Postman中的Tests脚本;

<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## Postman中Tests脚本总结

>   本内容翻译自Postman官方文档：
>
>   https://learning.postman.com/docs/postman/launching-postman/introduction/

Postman的test本质上是nodejs代码，通过我们编写测试代码，每一个tests返回True,或是False。 而每一个tests实际上就是一个测试用例；

postman 的 script 主要分成两类，一类是 `Pre-Request Scripts`，在发送请求之前执行，一类是 `Tests`，在接收到响应之后执行；

Collection/Folder/Request 都可以定义自己的 `Pre-Request Scripts` 和 `Tests`，这些 `Scripts` 执行顺序如下：

![](https://jasonkay_image.imfast.io/images/postman_script1.png)

上一级的测试作用于子级所有的请求，也就是说我们可以在 Collection 的 `Test Scripts` 中定义一个测试用例，这会对这个 Collection 下的所有请求都有效，都会验证这个测试是否有效

如果想要实现测试用例的复用可以将类似的请求放在一个目录下针对目录写测试用例，这样这个目录下的请求都会有这个测试用例

如果只是想针对某一个请求的测试，可以针对 request 来写，只在对应 request 的 `Test Scripts` 中定义即可

### Postman Console

postman 是基于 nodejs 的，你可以直接使用 `console.log` 来记录一些日志，通过 postman console 来查看，在左上角的菜单 `View` 下有一个 `Show Postman Console`

![](https://jasonkay_image.imfast.io/images/postman_script2.png)

我们在请求的 `Pre-Scripts` 里输出一条日志，然后发送请求

![](https://jasonkay_image.imfast.io/images/postman_script3.png)

这里的 `pm.variables.set("phone","")` 是设置 phone 这一参数为空字符串，由下图可以看出，phone 这一变量在发送请求的时候会被替换成空字符串

![](https://jasonkay_image.imfast.io/images/postman_script4.png)

查看 postman console

![](https://jasonkay_image.imfast.io/images/postman_script5.png)

可以看到我们在上面输出的日志已经输出到 postman console 了；

<br/>

### 环境变量设置

postman 支持的变量分几个层级，

-   global
-   environment
-   collection
-   data(数据文件中的变量值）
-   local

![](https://jasonkay_image.imfast.io/images/postman_script6.png)

变量优化级：

上面的类型优先级从低到高，“就近原则”

通过tests脚本创建、获取和撤销环境变量时通常使用类似于`scope.set/get/unset`方法，例如：

```javascript
// Variables
// 这个方法会从上面所有的来源寻找对应的变量，就近原则，优先从最靠近自己的地方找
var value = pm.variables.get("variable_key"); 

// Globals
// 设置一个全局变量
pm.globals.set("variable_key", "variable_value");
// 从全局变量中获取某个变量的值
pm.globals.get("variable_key");
// 取消设置全局变量，移除变量
pm.globals.unset("variable_key");

// Environments
// postman 中的 <Environment> 环境变量，不同于系统环境变量
pm.environment.set("variable_key", "variable_value");
// 从环境中获取某个变量
var value = pm.environment.get("variable_key");
// 从环境中移除某一个变量
pm.environment.unset("variable_key");

// 你也可以序列化一个对象或数组放在变量中
// var array = [1, 2, 3, 4];
// pm.environment.set("array", JSON.stringify(array, null, 2));
// var obj = { a: [1, 2, 3, 4], b: { c: 'val' } };
// pm.environment.set("obj", JSON.stringify(obj));

// If the value is a stringified JSON:
// These statements should be wrapped in a try-catch block if the data is coming from an unknown source.
var array = JSON.parse(pm.environment.get("array"));
var obj = JSON.parse(pm.environment.get("obj"));

// Collection
// 设置一个 collection 变量
pm.collectionVariables.set("variable_key", "variableValue");
// 从 collection 中获取一个变量 
var val = pm.collectionVariables.get("variable_key");
// 从 collection 中移除一个变量
pm.collectionVariables.unset("variable_key");

// local
pm.variables.set("variable_key", "variable_value");
pm.variables.get("variable_key");
pm.variables.unset("variable_key");
```

使用变量，如 username => `{{username}}`，使用两层大括号来表示变量引用；

### 编写Test Scripts

postman 的测试用例也是分层级的，上面已经做了简单的介绍，postman 是基于 nodejs 的所以，在nodejs 里可以用的语法大多也都支持，比如 `JSON.parse`；

可以使用pm.test函数定义测试，提供一个名称和函数，该函数返回一个布尔值（true或false），指示测试是通过还是失败；

对于test函数来说，其第一个参数是一个字符串类型，表示该断言的内容，例如：

```javascript
pm.test("Status test", function () {
    pm.response.to.have.status(200);
});
```

类似的你也可以使用`pm.expect`来进行测试，例如：

```javascript
pm.test("environment to be production", function () {
    pm.expect(pm.environment.get("env")).to.equal("production");
});
```

在Postman中也提供了一些常用的测试内容，通过点击右侧的snippets列出的一些内容，可以快速创建一个tests断言；

### 一些Test例子

设置环境变量

```javascript
pm.environment.set("variable_key", "variable_value");
```

将嵌套对象设置为环境变量

```javascript
var array = [1, 2, 3, 4];
pm.environment.set("array", JSON.stringify(array, null, 2));
 
var obj = { a: [1, 2, 3, 4], b: { c: 'val' } };
pm.environment.set("obj", JSON.stringify(obj));
```

获取环境变量

```javascript
pm.environment.get("variable_key");
```

获取环境变量（其值是严格化对象）

```javascript
// These statements should be wrapped in a try-catch block if the data is coming from an unknown source.
 
var array = JSON.parse(pm.environment.get("array"));
var obj = JSON.parse(pm.environment.get("obj"));
```

清除环境变量

```javascript
pm.environment.unset("variable_key");
```

设置全局变量

```javascript
pm.globals.set("variable_key", "variable_value");
```

获取全局变量

```javascript
pm.globals.get("variable_key");
```

清除全局变量

```javascript
pm.globals.unset("variable_key");
```

获取变量

```javascript
pm.variables.get("variable_key");
```

检查响应体是否包含字符串

```javascript
pm.test("Body matches string", function () {
    pm.expect(pm.response.text()).to.include("string_you_want_to_search");
});
```

检查响应体是否等于字符串

```javascript
pm.test("Body is correct", function () {
    pm.response.to.have.body("response_body_string");
});
```

检查JSON值

```javascript
pm.test("Your test name", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.value).to.eql(100);
});
```

内容类型存在

```javascript
pm.test("Content-Type is present", function () {
    pm.response.to.have.header("Content-Type");
});
```

响应时间小于200毫秒

```javascript
pm.test("Response time is less than 200ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(200);
});
```

状态代码为200

```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
```

代码名包含字符串

```javascript
pm.test("Status code name has string", function () {
    pm.response.to.have.status("Created");
});
```

成功后请求状态代码

```javascript
pm.test("Successful POST request", function () {
    pm.expect(pm.response.code).to.be.oneOf([201,202]);
});
```

为JSON数据使用TinyValidator

```javascript
var schema = {
 "items": {
 "type": "boolean"
 }
};
var data1 = [true, false];
var data2 = [true, 123];
 
pm.test('Schema is valid', function() {
  pm.expect(tv4.validate(data1, schema)).to.be.true;
  pm.expect(tv4.validate(data2, schema)).to.be.true;
});
```

解码BASE64编码数据

```javascript
var intermediate,
	base64Content, // assume this has a base64 encoded value
	rawContent = base64Content.slice('data:application/octet-stream;base64,'.length);
 
// CryptoJS is an inbuilt object
// documented here: https://www.npmjs.com/package/crypto-js
intermediate = CryptoJS.enc.Base64.parse(base64content); 
pm.test('Contents are valid', function() {
  // a check for non-emptiness
  pm.expect(CryptoJS.enc.Utf8.stringify(intermediate)).to.be.true; 
});
```

发送异步请求

```javascript
pm.sendRequest("https://postman-echo.com/get", function (err, response) {
    console.log(response.json());
});
```

将XML体转换为JSON对象

```javascript
var jsonObject = xml2Json(responseBody);
```

>   更多关于pm模块的内容见：
>
>   [Postman Sandbox API reference](https://learning.postman.com/docs/postman/scripts/postman-sandbox-api-reference/)

<br/>


## 附录

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>