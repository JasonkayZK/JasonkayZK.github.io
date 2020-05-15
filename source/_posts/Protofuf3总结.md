---
title: 转-Protofuf3总结
cover: http://api.mtyqx.cn/api/random.php?22
date: 2020-05-15 20:03:54
categories: [Protobuf]
tags: [Protobuf]
description: 本文总结了Protobuf3相关的内容
---

本文总结了Protobuf3相关的内容;


<br/>

<!--more-->

**目录:**

<!-- toc -->

<br/>

## 转-Protofuf3语法总结

Protocol Buffer是Google的语言中立的，平台中立的，可扩展机制的，用于序列化结构化数据 - 对比XML，但更小，更快，更简单。

您可以定义数据的结构化，然后可以使用特殊生成的源代码轻松地在各种数据流中使用各种语言编写和读取结构化数据。

### 定义消息类型

先来看一个非常简单的例子。假设你想定义一个“搜索请求”的消息格式，每一个请求含有一个查询字符串、你感兴趣的查询结果所在的页数，以及每一页多少条查询结果。

可以采用如下的方式来定义消息类型的.proto文件了：

```protobuf
syntax = "proto3";

message SearchRequest {
  string query = 1;
  int32 page_number = 2;
  int32 result_per_page = 3;
}
```

-   文件的第一行指定了你正在使用proto3语法：如果你没有指定这个，编译器会使用proto2。这个**指定语法行必须是文件的非空非注释的第一个行**
-   SearchRequest消息格式有3个字段，在**消息中承载的数据分别对应于每一个字段。其中每个字段都有一个名字和一种类型**

#### 指定字段类型

在上面的例子中，所有字段都是`标量类型`：两个整型（page_number和result_per_page），一个string类型（query）。

当然，你也可以为字段指定其他的合成类型，包括枚举（enumerations）或其他消息类型

****

#### 分配标识号

正如上述文件格式，在消息定义中，每个字段都有唯一的一个**数字标识符**

这些标识符是用来在消息的[二进制格式](https://developers.google.com/protocol-buffers/docs/encoding)中识别各个字段的，<red>**一旦开始使用就不能够再改变**</font>

>   <br/>
>
>   **注：**
>
>   [1,15]之内的标识号在编码的时候会占用一个字节
>
>   [16,2047]之内的标识号则占用2个字节
>
>   最小的标识号可以从1开始，最大到2^29 - 1, or 536,870,911。
>
>   **不可以使用其中的[19000－19999]的标识号， Protobuf协议实现中对这些进行了预留**
>
>   如果非要在.proto文件中使用这些预留标识号，编译时就会报错。
>
>   <red>**应该为那些频繁出现的消息元素保留 [1,15]之内的标识号**</font>
>
>   <red>**切记：要为将来有可能添加的、频繁出现的标识号预留一些标识号。**</font>

****

#### 指定字段规则

消息字段可以是以下之一：

-   单数：格式良好的消息可以包含该字段中的零个或一个（但不超过一个）
-   `repeated`：此字段可以在格式良好的消息中重复任意次数（包括零）。**将保留重复值的顺序**

例如:

```protobuf
syntax = "proto3";

message TestRequest {
  repeated string msg = 1;
}
```

在proto3中，`repeated`数字类型的字段默认使用`packed`编码

>   <br/>
>
>   可以在[协议缓冲区编码中](https://developers.google.com/protocol-buffers/docs/encoding.html#packed)找到有关`packed`编码的更多信息

****

#### 添加更多消息类型

在一个.proto文件中可以定义多个消息类型。

在定义多个相关的消息的时候，这一点特别有用——例如，如果想定义与SearchResponse消息类型对应的回复消息格式的话，你可以将它添加到相同的.proto文件中，如：

```protobuf
message SearchRequest {
  string query = 1;
  int32 page_number = 2;
  int32 result_per_page = 3;
}

message SearchResponse {
 ...
}
```

****

#### 添加注释

向.proto文件添加注释，可以使用C/C++/java风格的双斜杠（//） 语法格式，如：

```protobuf
message SearchRequest {
  string query = 1;
  int32 page_number = 2;  // Which page number do we want?
  int32 result_per_page = 3;  // Number of results to return per page.
}
```

****

#### 保留标识符（Reserved）

如果你通过删除或者注释所有域，以后的用户可以重用标识号当你重新更新类型的时候。如果你使用旧版本加载相同的.proto文件这会导致严重的问题，包括数据损坏、隐私错误等等

现在有一种确保不会发生这种情况的方法就是**指定保留标识符**，protocol buffer的编译器会警告未来尝试使用这些域标识符的用户

```protobuf
message Foo {
  reserved 2, 15, 9 to 11;
  reserved "foo", "bar";
}
```

><br/>
>
>**注：不要在同一行reserved声明中同时声明域名字和标识号**
>
>例如:
>
>```protobuf
>message Foo {
>  reserved 2, 15, 9 to 11, "foo";
>}
>```

<br/>

### 从.proto文件生成了什么？

当用protocol buffer编译器来运行.proto文件时，编译器将**生成所选择语言的代码**

这些代码**可以操作在.proto文件中定义的消息类型，包括获取、设置字段值，将消息序列化到一个输出流中，以及从一个输入流中解析消息**

-   对C++来说，编译器会为每个.proto文件生成一个.h文件和一个.cc文件，.proto文件中的每一个消息有一个对应的类
-   对Java来说，编译器为每一个消息类型生成了一个.java文件，以及一个特殊的Builder类（该类是用来创建消息类接口的）
-   对Python来说，有点不太一样——Python编译器为.proto文件中的每个消息类型生成一个含有静态描述符的模块，，该模块与一个元类（metaclass）在运行时（runtime）被用来创建所需的Python数据访问类
-   对go来说，编译器会位每个消息类型生成了一个.pd.go文件
-   对于Ruby来说，编译器会为每个消息类型生成了一个.rb文件
-   javaNano来说，编译器输出类似域java但是没有Builder类
-   对于Objective-C来说，编译器会为每个消息类型生成了一个pbobjc.h文件和pbobjcm文件，.proto文件中的每一个消息有一个对应的类
-   对于C#来说，编译器会为每个消息类型生成了一个.cs文件，.proto文件中的每一个消息有一个对应的类。

>   <br/>
>
>   你可以从如下的文档链接中获取每种语言更多API
>
>   [API Reference](https://developers.google.com/protocol-buffers/docs/reference/overview?hl=zh-cn)

<br/>

### 标量数值类型

一个标量消息字段可以含有一个如下的类型——该表格展示了定义于.proto文件中的类型，以及与之对应的、在自动生成的访问类中定义的类型：

| .proto Type | Notes                                                        | C++ Type | Java Type  | Python Type[2] | Go Type | Ruby Type                      | C# Type    | PHP Type       |
| ----------- | ------------------------------------------------------------ | -------- | ---------- | -------------- | ------- | ------------------------------ | ---------- | -------------- |
| double      |                                                              | double   | double     | float          | float64 | Float                          | double     | float          |
| float       |                                                              | float    | float      | float          | float32 | Float                          | float      | float          |
| int32       | 使用变长编码，对于负值的效率很低，如果你的域有可能有负值，请使用sint64替代 | int32    | int        | int            | int32   | Fixnum 或者 Bignum（根据需要） | int        | integer        |
| uint32      | 使用变长编码                                                 | uint32   | int        | int/long       | uint32  | Fixnum 或者 Bignum（根据需要） | uint       | integer        |
| uint64      | 使用变长编码                                                 | uint64   | long       | int/long       | uint64  | Bignum                         | ulong      | integer/string |
| sint32      | 使用变长编码，这些编码在负值时比int32高效的多                | int32    | int        | int            | int32   | Fixnum 或者 Bignum（根据需要） | int        | integer        |
| sint64      | 使用变长编码，有符号的整型值。编码时比通常的int64高效。      | int64    | long       | int/long       | int64   | Bignum                         | long       | integer/string |
| fixed32     | 总是4个字节，如果数值总是比总是比228大的话，这个类型会比uint32高效。 | uint32   | int        | int            | uint32  | Fixnum 或者 Bignum（根据需要） | uint       | integer        |
| fixed64     | 总是8个字节，如果数值总是比总是比256大的话，这个类型会比uint64高效。 | uint64   | long       | int/long       | uint64  | Bignum                         | ulong      | integer/string |
| sfixed32    | 总是4个字节                                                  | int32    | int        | int            | int32   | Fixnum 或者 Bignum（根据需要） | int        | integer        |
| sfixed64    | 总是8个字节                                                  | int64    | long       | int/long       | int64   | Bignum                         | long       | integer/string |
| bool        |                                                              | bool     | boolean    | bool           | bool    | TrueClass/FalseClass           | bool       | boolean        |
| string      | 一个字符串必须是UTF-8编码或者7-bit ASCII编码的文本。         | string   | String     | str/unicode    | string  | String (UTF-8)                 | string     | string         |
| bytes       | 可能包含任意顺序的字节数据。                                 | string   | ByteString | str            | []byte  | String (ASCII-8BIT)            | ByteString | string         |

你可以在文章[Protocol Buffer 编码](https://developers.google.com/protocol-buffers/docs/encoding?hl=zh-cn)中，找到更多“序列化消息时各种类型如何编码”的信息

><br/>
>
>**注:**
>
>-   在java中，无符号32位和64位整型被表示成他们的整型对应形式，最高位被储存在标志位中
>-   对于所有的情况，设定值会**执行类型检查**以确保此值是有效
>-   64位或者无符号32位整型在解码时被表示成为ilong，但是在设置时可以使用int型值设定，在所有的情况下，值必须符合其设置其类型的要求
>-   python中string被表示成在解码时表示成unicode。但是一个ASCIIstring可以被表示成str类型
>-   Integer在64位的机器上使用，string在32位机器上使用

<br/>

### 默认值

当一个消息被解析的时候，如果**被编码的信息不包含一个特定的singular元素**，被解析的对象锁对应的域**被设置位一个默认值**，对于不同类型指定如下：

-   对于strings，默认是一个空string
-   对于bytes，默认是一个空的bytes
-   对于bools，默认是false
-   对于数值类型，默认是0
-   **对于枚举，默认是第一个定义的枚举值，必须为0;**
-   对于消息类型（message），域没有被设置，确切的消息是根据语言确定的，详见[generated code guide](https://developers.google.com/protocol-buffers/docs/reference/overview?hl=zh-cn)

对于可重复域的默认值是空（通常情况下是对应语言中空列表/ArrayList/切片）

>   <br/>
>
>   **注：**
>
>   <red>**对于标量消息域，一旦消息被解析，就无法判断域释放被设置为默认值（例如，例如boolean值是否被设置为false）还是根本没有被设置**</font>
>
>   **你应该在定义你的消息类型时非常注意。**
>
>   例如，比如你**不应该定义boolean的默认值false作为任何行为的触发方式。**
>
>   也应该注意**如果一个标量消息域被设置为标志位，这个值不应该被序列化传输。**
>
>   ****
>
>   **解决方案:**
>
>   使用protoc-gen-validate可以为proto生成参数校验的文件;
>
>   见: https://github.com/envoyproxy/protoc-gen-validate

查看[generated code guide](https://developers.google.com/protocol-buffers/docs/reference/overview?hl=zh-cn)选择你的语言的默认值的工作细节

<br/>

### 使用其他消息类型

你可以**将其他消息类型用作字段类型**

例如，假设在每一个SearchResponse消息中包含Result消息，此时可以在相同的.proto文件中定义一个Result消息类型，然后在SearchResponse消息中指定一个Result类型的字段，如：

```protobuf
message SearchResponse {
  repeated Result results = 1;
}

message Result {
  string url = 1;
  string title = 2;
  repeated string snippets = 3;
}
```

<br/>

### 导入定义













<br/>

## 附录

文章参考:

-   [Protobuf 语言指南(proto3)](https://www.cnblogs.com/sanshengshui/p/9739521.html)
-   [Protobuf3教程](https://blog.csdn.net/hulinku/article/details/80827018)
-   [Protocol Buffers](https://developers.google.cn/protocol-buffers)



如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>