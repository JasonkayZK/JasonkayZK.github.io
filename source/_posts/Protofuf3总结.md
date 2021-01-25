---
title: 转-Protofuf3总结
cover: https://acg.toubiec.cn/random?22
date: 2020-05-15 20:03:54
categories: [Protobuf]
tags: [Protobuf]
toc: true
description: 本文总结了Protobuf3相关的内容
---

本文总结了Protobuf3相关的内容;


<br/>

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

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

这些标识符是用来在消息的[二进制格式](https://developers.google.com/protocol-buffers/docs/encoding)中识别各个字段的，<font color="#f00">**一旦开始使用就不能够再改变**</font>

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
>   <font color="#f00">**应该为那些频繁出现的消息元素保留 [1,15]之内的标识号**</font>
>
>   <font color="#f00">**切记：要为将来有可能添加的、频繁出现的标识号预留一些标识号。**</font>

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
>   <font color="#f00">**对于标量消息域，一旦消息被解析，就无法判断域释放被设置为默认值（例如，例如boolean值是否被设置为false）还是根本没有被设置**</font>
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

在上面的例子中，Result消息类型与SearchResponse是定义在同一文件中的

如果想要使用的消息类型已经在其他.proto文件中已经定义过了呢？

可以通过导入（importing）其他.proto文件中的定义来使用它们。要导入其他.proto文件的定义，你需要在你的文件中添加一个导入声明，如：

```protobuf
import "myproject/other_protos.proto";
```

默认情况下你只能使用直接导入的.proto文件中的定义

然而， 有时候你**需要移动一个.proto文件到一个新的位置，  可以不直接移动.proto文件， 只需放入一个伪 .proto 文件在老的位置， 然后使用import public转向新的位置**

`import public` 依赖性会**通过任意导入包含import public声明的proto文件传递**

例如：

```protobuf
// 这是新的proto
// All definitions are moved here
```

```protobuf
// 这是旧的proto
// 所有客户端正在导入的包
import public "new.proto";
import "other.proto";
```

```protobuf
// 客户端proto
import "old.proto";
// 现在你可以使用新旧两种包的proto定义了
```

通过在编译器命令行参数中使用`-I/--proto_path`protocal 编译器会在指定目录搜索要导入的文件

如果没有给出标志，编译器会搜索编译命令被调用的目录。通常你只要指定proto_path标志为你的工程根目录就好。并且指定好导入的正确名称就好

<br/>

### 使用proto2消息类型

在proto3消息中导入proto2的消息类型也是可以的，反之亦然;

**但是proto2枚举不可以直接在proto3的标识符中使用（如果仅仅在proto2消息中使用是可以的）**

<br/>

### 嵌套类型

你可以在其他消息类型中定义、使用消息类型，在下面的例子中，Result消息就定义在SearchResponse消息内，如：

```protobuf
message SearchResponse {
  message Result {
    string url = 1;
    string title = 2;
    repeated string snippets = 3;
  }
  repeated Result results = 1;
}
```

如果你想在它的父消息类型的外部重用这个消息类型，你需要以Parent.Type的形式使用它，如：

```protobuf
message SomeOtherMessage {
  SearchResponse.Result result = 1;
}
```

当然，你也可以将消息嵌套任意多层，如：

```protobuf
message Outer { // Level 0
  message MiddleAA { // Level 1
    message Inner { // Level 2
      int64 ival = 1;
      bool  booly = 2;
    }
  }
  message MiddleBB { // Level 1
    message Inner { // Level 2
      int32 ival = 1;
      bool  booly = 2;
    }
  }
}
```

<br/>

### 更新一个消息类型

如果一个已有的消息格式已无法满足新的需求——如，要在消息中添加一个额外的字段——但是同时旧版本写的代码仍然可用。不用担心！更新消息而不破坏已有代码是非常简单的。在更新时只要记住以下的规则即可。

-   <font color="#f00">**不要更改任何已有的字段的数值标识**</font>
-   如果你增加新的字段，**使用旧格式的字段仍然可以被你新产生的代码所解析**。你应该记住这些元素的默认值这样你的新代码就可以以适当的方式和旧代码产生的数据交互。相似的，**通过新代码产生的消息也可以被旧代码解析：只不过新的字段会被忽视掉**。注意，<font color="#f00">**未被识别的字段会在反序列化的过程中丢弃掉，所以如果消息再被传递给新的代码，新的字段依然是不可用的**（这和proto2中的行为是不同的，在proto2中未定义的域依然会随着消息被序列化）</font>
-   **非required的字段可以移除——只要它们的标识号在新的消息类型中不再使用**<font color="#f00">**（更好的做法可能是重命名那个字段，例如在字段前添加“OBSOLETE_”前缀，那样的话，使用的.proto文件的用户将来就不会无意中重新使用了那些不该使用的标识号**）</font>
-   int32, uint32, int64,  uint64,和bool是全部兼容的，这意味着可以将这些类型中的一个转换为另外一个，而不会破坏向前、  向后的兼容性。**如果解析出来的数字与对应的类型不相符，那么结果就像在C++中对它进行了强制类型转换一样**（例如，如果把一个64位数字当作int32来 读取，那么它就会被截断为32位的数字）
-   sint32和sint64是互相兼容的，但是它们与其他整数类型不兼容
-   **string和bytes是兼容的——只要bytes是有效的UTF-8编码**
-   嵌套消息与bytes是兼容的——只要bytes包含该消息的一个编码过的版本
-   fixed32与sfixed32是兼容的，fixed64与sfixed64是兼容的
-   枚举类型与int32，uint32，int64和uint64相兼容（注意如果值不相兼容则会被截断），然而在客户端反序列化之后他们可能会有不同的处理方式，例如，未识别的proto3枚举类型会被保留在消息中，但是他的表示方式会依照语言而定。int类型的字段总会保留他们的

<br/>

### Any

Any类型消息**允许你在没有指定他们的.proto定义的情况下使用消息作为一个嵌套类型**

一个Any类型包括一个可以被序列化bytes类型的任意消息，以及一个URL作为一个全局标识符和解析消息类型

为了使用Any类型，你需要导入`import google/protobuf/any.proto`

```protobuf
import "google/protobuf/any.proto";

message ErrorStatus {
  string message = 1;
  repeated google.protobuf.Any details = 2;
}
```

对于给定的消息类型的默认类型URL是`type.googleapis.com/packagename.messagename`

**不同语言的实现会支持动态库以线程安全的方式去帮助封装或者解封装Any值**

例如在java中，Any类型会有特殊的`pack()`和`unpack()`访问器，在C++中会有`PackFrom()`和`UnpackTo()`方法

```c++
// Storing an arbitrary message type in Any.
NetworkErrorDetails details = ...;
ErrorStatus status;
status.add_details()->PackFrom(details);

// Reading an arbitrary message from Any.
ErrorStatus status = ...;
for (const Any& detail : status.details()) {
  if (detail.Is<NetworkErrorDetails>()) {
    NetworkErrorDetails network_error;
    detail.UnpackTo(&network_error);
    ... processing network_error ...
  }
}
```

**目前，用于Any类型的动态库仍在开发之中** 

如果你已经很熟悉[proto2语法](https://developers.google.com/protocol-buffers/docs/proto?hl=zh-cn)，使用Any替换[拓展](https://developers.google.com/protocol-buffers/docs/proto?hl=zh-cn#extensions)

<br/>

### Oneof

如果你的**消息中有很多可选字段， 并且同时至多一个字段会被设置**， 你可以加强这个行为，使用oneof特性**节省内存**

Oneof字段就像可选字段， 除了它们会共享内存， 至多一个字段会被设置

 **设置其中一个字段会清除其它字段。 你可以使用`case()`或者`WhichOneof()` 方法检查哪个oneof字段被设置**， 看你使用的是什么语言

#### 使用Oneof

为了在.proto定义Oneof字段， 你**需要在名字前面加上oneof关键字**, 比如下面例子的test_oneof:

```protobuf
message SampleMessage {
  oneof test_oneof {
    string name = 4;
    SubMessage sub_message = 9;
  }
}
```

然后你可以增加oneof字段到 oneof 定义中

**你可以增加任意类型的字段, 但是不能使用repeated关键字**

在产生的代码中, oneof字段拥有同样的 getters 和setters， 就像正常的可选字段一样, 也有一个特殊的方法来检查到底那个字段被设置

你可以在相应的语言[API指南](https://developers.google.com/protocol-buffers/docs/reference/overview?hl=zh-cn)中找到oneof API介绍

****

#### Oneof 特性

**① 设置oneof会自动清除其它oneof字段的值**

所以设置多次后，只有最后一次设置的字段有值:

```java
SampleMessage message;
message.set_name("name");
CHECK(message.has_name());
message.mutable_sub_message();   // Will clear name field.
CHECK(!message.has_name());
```

<br/>

**② 如果解析器遇到同一个oneof中有多个成员，只有最会一个会被解析成消息**

**③ oneof不支持`repeated`**

**④ 反射API对oneof字段有效**

**⑤ 如果使用C++,需确保代码不会导致内存泄漏**

例如, 下面的代码会崩溃， 因为`sub_message` 已经通过`set_name()`删除了:

```c++
SampleMessage message;
SubMessage* sub_message = message.mutable_sub_message();
message.set_name("name");      // Will delete sub_message
sub_message->set_...            // Crashes here
```

**⑥ 在C++中，如果你使用`Swap()`两个oneof消息，每个消息将拥有对方的值**

例如在下面的例子中，`msg1`会拥有`sub_message`并且`msg2`会有`name`

```c++
SampleMessage msg1;
msg1.set_name("name");
SampleMessage msg2;
msg2.mutable_sub_message();
msg1.swap(&msg2);
CHECK(msg1.has_sub_message());
CHECK(msg2.has_name());
```

****

#### 向后兼容性问题

当增加或者删除oneof字段时一定要小心. **如果检查oneof的值返回`None/NOT_SET`, 它意味着oneof字段没有被赋值或者在一个不同的版本中赋值了**

**你不会知道是哪种情况，因为没有办法判断如果未识别的字段是一个oneof字段**

Tage 重用问题：

-   **将字段移入或移除oneof：在消息被序列号或者解析后，你也许会失去一些信息（有些字段也许会被清除）**
-   **删除一个字段或者加入一个字段：在消息被序列号或者解析后，这也许会清除你现在设置的oneof字段**
-   **分离或者融合oneof：行为与移动常规字段相似**

<br/>

### Map（映射）

如果你希望创建一个关联映射，protocol buffer提供了一种快捷的语法：

```protobuf
map<key_type, value_type> map_field = N;
```

其中`key_type`可以是任意Integer或者string类型（**除了floating和bytes的任意标量类型都是可以的**）`value_type`可以是任意类型

例如，如果你希望创建一个project的映射，每个`Projecct`使用一个string作为key，你可以像下面这样定义：

```protobuf
map<string, Project> projects = 3;
```

-   **Map的字段可以是repeated**
-   序列化后的顺序和**map迭代器的顺序是不确定的**，所以你不要期望以固定顺序处理Map
-   当为.proto文件**产生生成文本格式的时候，map会按照key的顺序排序，数值化的key会按照数值排序**
-   从其他map解析或合并时，如果有重复的映射键，则使用最后看到的键;
-   从文本格式解析映射时，如果存在重复键，则解析可能会失败;

生成map的API现在对于所有proto3支持的语言都可用了，你可以从[API指南](https://developers.google.com/protocol-buffers/docs/reference/overview?hl=zh-cn)找到更多信息

<br/>

### 向后兼容性问题





























<br/>

## 附录

文章参考:

-   [Protobuf 语言指南(proto3)](https://www.cnblogs.com/sanshengshui/p/9739521.html)
-   [Protobuf3教程](https://blog.csdn.net/hulinku/article/details/80827018)
-   [Protocol Buffers](https://developers.google.cn/protocol-buffers)



如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>