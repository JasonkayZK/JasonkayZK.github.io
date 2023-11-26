---
title: 在Docker中体验Go1.17中的泛型
toc: true
cover: 'https://img.paulzzh.com/touhou/random?33'
date: 2021-07-05 15:30:23
categories: Golang
tags: [Golang, Docker]
description: 在Golang的v1.17版本中，已经悄悄的加入了对泛型的支持；在此之前，我们需要在.go2中尝试泛型，现在我们可以直接编写.go格式的文件，然后通过指定-gcflags=-G=3来编译含有泛型语法的源文件了；同时，为了防止在体验时污染我们本地开发环境中的Go，采用了在Docker中运行的方式进行实验；
---

在Golang的v1.17版本中，已经悄悄的加入了对泛型的支持；

在此之前，我们需要在.go2中尝试泛型，现在我们可以直接编写.go格式的文件，然后通过指定`-gcflags=-G=3`来编译含有泛型语法的源文件了；

同时，为了防止在体验时污染我们本地开发环境中的Go，采用了在Docker中运行的方式进行实验；

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/go-v1.17-rc-generic

<br/>

<!--more-->

# **在Docker中体验Go1.17中的泛型**

## **关于Go泛型的开发进度**

根据网络谣传的消息 Go 将在1.18 中正式支持泛型，而依照Go每年发布两个版本的节奏，Go 1.18会在2022年春，也就是二月份左右发布，但是我们目前已经可以在Go 1.17中尝鲜；

>   Go的泛型近一年来一直由Ian Lance Taylor(编译器大牛、Go核心成员)和Robert Griesemer（Go创始三巨头之一，Google V8、Chubby和HotSpot JVM的主要贡献者）等人开发，一直在[dev.typeparams](https://github.com/golang/go/tree/dev.typeparams)分支上做预研和开发工作；
>
>   但是由于泛型会对Go的核心代码做巨大的修改，会影响很多文件，因此将来dev.typeparams在merge回master分支的时候如何管理冲突是一个很困难的事；
>
>   目前，Go开发者采用定期把master的commit merge到dev.typeparams分支方式，尽早解决冲突：因为尽早解决冲突的方式每次解决冲突的量比较少，还是可控的；
>
>   但是由于master分支的开发者无需顾虑dev.typeparams分支的情况，导致最近冲突有些大，解决起来很困难，所以[#43931](https://github.com/golang/go/issues/43931)提议将dev.typeparams分支merge到master分支，以后泛型的开发直接在master分支；

泛型特性可以通过feature flag的方式控制特性的启用和禁用，所以即使merge到master分支，也可以控制在Go 1.18再把特性启用；如果泛型的提案[#43651](https://github.com/golang/go/issues/43651)被拒绝掉的话，相关的无用代码也可以被清除掉；

>   这也类似引入go module的方式：
>
>   `go module`历经几个版本，并通过GO111MODULE开关控制这个特性的启用；

比如引入`-G`开关：

-   `-G=0`启用类型检查；
-   `-G=1`启用 `types2 w/o generics`支持；
-   `-G=2`使用`types2 w/ generics`支持；

而`-G=1`在Go 1.17中默认启用，`-G=2`在Go 1.18中启用；

>   这也是很好的一种渐进式引入特性的方法；

<font color="#f00">**而现在我们已经可以在Go v1.17中通过指定`-gcflags=-G=3`来编译含有泛型语法的源文件了！**</font>

<br/>

## **Go中的泛型**

2019年中旬，在[Go 1.13版本](https://tonybai.com/2019/10/27/some-changes-in-go-1-13/)发布前夕的[GopherCon 2019大会](https://www.gophercon.com/)上，[Ian Lance Taylor](https://github.com/ianlancetaylor)代表Go核心团队做了[有关Go泛型进展的介绍](https://blog.golang.org/why-generics)；

自那以后，Go团队对原先的[Go Generics技术草案](https://github.com/golang/proposal/blob/master/design/go2draft-contracts.md)做了进一步精化，并编写了相关工具让社区gopher体验满足这份设计的Go generics语法，返回建议和意见；

经过一年多的思考、讨论、反馈与实践，Go核心团队决定在这份旧设计的基础上**另起炉灶**，撰写了一份[Go Generics的新技术提案：“Type Parameters”](https://github.com/golang/proposal/blob/master/design/go2draft-type-parameters.md)；

与上一份提案最大的不同在于：<font color="#f00">**使用扩展的interface类型替代“Contract”用于对类型参数的约束；**</font>

<font color="#f00">**Parametric Polymorphism((形式)参数多态)是Go此版泛型设计的基本思想：**</font>

<font color="#f00">**和Go设计思想一致，这种参数多态并不是通过像面向对象语言那种子类型的层次体系实现的，而是通过显式定义结构化的约束实现的；基于这种设计思想，该设计不支持[模板元编程(template metaprogramming)](https://code.fandom.com/wiki/Template_metaprogramming])和编译期运算；**</font>

>   <font color="#f00">**注意：虽然都称为泛型(generics)，但是Go中的泛型(generics)仅是用于狭义地表达带有类型参数(type parameter)的函数或类型，这与其他编程语言中的泛型(generics)在含义上有相似性，但不完全相同；**</font>

<font color="#f00">**本文主要采用的是`go1.17beta1`版本进行讲述，而最终加入Go的泛型可能与目前的实现有所差异；**</font>

下面，首先让我们创建一个`go1.17beta1`环境的容器；

随后，通过几个泛型的例子来学习Go中的泛型！

<br/>

## **Docker中创建Go环境容器**

为了不影响本地的Go环境，我选择了在Docker中创建一个`go1.17beta1`环境的容器来体验泛型；

>   **`go1.17beta1`是目前官方提供的最新的Go环境；**
>
>   **可能你在阅读本文的时候，还有更新的版本可以选择，但是原理都是类似的！**

一键创建Go环境容器：

create-container.sh

```bash
docker run -dit \
--name go-v.17 \
-v /root/workspace/go-v1.17-code:/code \
--privileged \
golang:1.17-rc /bin/bash
```

然后你的`go1.17beta1`环境就有了；

通过下面的命令即可进入容器：

create-container.sh

```bash
[root@localhost go-v1.17-code]# docker exec -it go-v.17 bash
root@e9d447a87912:/go# go version
go version go1.17beta1 linux/amd64
```

>   <font color="#f00">**注：这里主要是将本地的`/root/workspace/go-v1.17-code`作为工作目录，并映射到容器的`/code`目录中，你可以根据自己的需求修改路径；**</font>

下面我们重点来看Go中的泛型；

<br/>

## **几个泛型例子**

### **Print泛型输出 - 范型基本语法**

我们先通过一个范型版的Print来看一看Go目前范型的语法吧；

1_print/main.go

```go
package main

import (
	"fmt"
)

func printSlice[T any](s []T) {
	for _, v := range s {
		fmt.Printf("%v ", v)
	}
	fmt.Print("\n")
}

func main() {
	printSlice[int]([]int{1, 2, 3, 4, 5})
	printSlice[float64]([]float64{1.01, 2.02, 3.03, 4.04, 5.05})
	printSlice[string]([]string{"one", "two", "three", "four", "five"})

	printSlice([]int64{5, 4, 3, 2, 1})
}
```

运行文件：

```bash
go run -gcflags=-G=3 1_print/main.go

1 2 3 4 5 
1.01 2.02 3.03 4.04 5.05 
one two three four five 
5 4 3 2 1 
```

可以看到成功输出了不同类型的列表；

代码中的`[T any]`即为类型参数，意思是该函数支持任何T类型；

在调用该范型函数时，可以显式指定类型参数类型，如：`printSlice[int]([]int{1, 2, 3, 4, 5})`，以帮助编译器实行类型推导；

不过在编译器完全可以实现类型推导时，也可以省略显式类型，如：`printSlice([]int64{5, 4, 3, 2, 1})`；

>   <font color="#f00">**目前Go中实现的范型声明采用`[]`表示，这一点既不同于传统范型的`<>`符号，又不同于Go最初制定的`()`运算符声明；**</font>
>
>   <font color="#f00">**关于Go为什么不用`()`运算符声明，我觉得可能是因为再使用`()`运算符的话，小括号真的是太多了！**</font>

<br/>

### **范型切片 - 声明范型类型**

带有**类型参数(type parameters)**的类型被称为泛型类型；

比如我们定义一个底层类型为切片类型的新类型 Vector：

2_vector/main.go

```go
package main

import (
	"fmt"
)

type vector[T any] []T

func printSlice[T any](s []T) {
	for _, v := range s {
		fmt.Printf("%v ", v)
	}
	fmt.Print("\n")
}

func main() {
	// Compiling Error
	// Cannot use generic type vector[T interface{}] without instantiation
	//vs0 := vector{1,2,3,4,5}

	vs := vector[int]{5,4,2,1}
	printSlice(vs)

	vs2 := vector[string]{"haha", "hehe"}
	printSlice(vs2)
}
```

首先，我们声明了一个可以存放任何类型的切片 vector：

```go
type vector[T any] []T
```

该vector(切片)类型中的元素类型为T；

和泛型函数一样，使用泛型类型时，我们首先要对其进行实例化，即显式为**类型参数**赋一个实参值（一个类型名），因此在main函数中，我们初始化vector是需要带上实际类型！

>   <font color="#f00">**泛型类型的实例化是必须显式为类型参数传参的，编译器无法自行做类型推导；**</font>
>
>   如果将上面例子中main函数改为如下实现方式：
>
>   ```go
>   vs0 := vector{1,2,3,4,5}
>   ```
>
>   Go编译器会报如下错误：
>
>   ```go
>   // Compiling Error
>   // Cannot use generic type vector[T interface{}] without instantiation
>   ```
>
>   即：未实例化(instantiation)的泛型类型Vector(type T)无法使用；

<br/>

### **范型版Add函数 - 类型约束**

对于一个范型的Add函数而言，下面的实现一定是报错的：

```go
func add[T any] (a, b T) T {
	return a + b
}
```

因为在Go中，我们没有为任意类型都定义`+`运算！

>   **在此版Go泛型设计中，泛型函数只能使用类型参数所能实例化出的任意类型都能支持的操作；**
>
>   比如上述Add函数的**类型参数T**没有任何约束，它可以被实例化为任何类型；那么这些实例化后的类型是否都支持“+”操作符运算呢？显然不是；因此，编译器针对示例代码中的第六行报了错！
>
>   对于像上面Add函数那样的没有任何约束的类型参数实例，Go允许对其进行的操作包括：
>
>   -   **声明这些类型的变量；**
>   -   **使用相同类型的值为这些变量赋值；**
>   -   **将这些类型的变量以实参形式传给函数或从作为函数返回值；**
>   -   **取这些变量的地址；**
>   -   **将这些类型的值转换或赋值给interface{}类型变量；**
>   -   **通过类型断言将一个接口值赋值给这类类型的变量；**
>   -   **在type switch块中作为一个case分支；**
>   -   **定义和使用由该类型组成的复合类型，比如：元素类型为该类型的切片；**
>   -   **将该类型传递给一些内置函数，比如new；**

**那么，我们要让上面的Add函数通过编译器的检查，我们就需要限制其类型参数所能实例化出的类型的范围；**

比如：仅允许实例化为**底层类型(underlying type)为整型类型的类型；**

>   **上一版Go泛型设计中使用Contract来定义对类型参数的约束，不过由于Contract与interface在概念范畴上有交集，让Gopher们十分困惑；**
>
>   **于是在新版泛型设计中，Contract这个关键字被移除了，取而代之的是语法扩展了的interface，即我们使用interface类型来修饰类型参数以实现对其可实例化出的类型集合的约束；**

我们来看下面例子：

3_add/main.go

```go
package main

import (
	"fmt"
)

/*
	Invalid operation: operator + not defined on a (variable of type parameter type T)
 */
type Addable interface {
	type int, int8, int16, int32, int64,
		uint, uint8, uint16, uint32, uint64, uintptr,
		float32, float64, complex64, complex128,
		string
}

func add[T Addable] (a, b T) T {
	return a + b
}

func main() {
	fmt.Println(add(1,2))
	fmt.Println(add("foo","bar"))
}
```

运行代码输出：

```bash
bash-5.0# go run -gcflags=-G=3 3_add/main.go   
3
foobar
```

<font color="#f00">**该提案扩展了interface语法，新增了类型列表(type list)表达方式，专用于对类型参数进行约束；**</font>

以该示例为例，如果编译器通过类型推导得到的类型在Addable这个接口定义的类型列表(type list)中，那么编译器将允许这个类型参数实例化；否则就像类型参数实例化将报错！

例如，我们删去Addable中的string类型，重新运行代码，将会报错：

```bash
3_add/main.go:23:17: string does not satisfy Addable (string not found in int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64, uintptr, float32, float64, complex64, complex128)
```

此外，需要注意的是：<font color="#f00">**定义中带有类型列表的接口将无法用作接口变量类型！**</font>

比如下面这个示例：

```go
package main

type Addable interface {
	type int, int8, int16, int32, int64,
		uint, uint8, uint16, uint32, uint64, uintptr,
		float32, float64, complex64, complex128,
		string
}

func main() {
	var n int = 6
	var i Addable
	i = n
	_ = i
}
```

运行后报错：

```bash
3_add/main.go:22:8: interface contains type constraints (int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64, uintptr, float32, float64, complex64, complex128, string)
```

<br/>

### **Stringer - 使用interface本身约束范型**

除了在interface中显式声明类型约束之外，还可以在函数的入参中使用接口对范型进行类型约束，这一点是很自然的！

如下：

4_interface_constraint/main.go

```go
package main

import (
	"fmt"
	"strconv"
)

type StringInt int

func (i StringInt) String() string {
	return strconv.Itoa(int(i))
}

type MyStringer interface {
	String() string
}

// A generic type that need to implement MyStringer interface!
func stringify[T MyStringer](s []T) (ret []string) {
	for _, v := range s {
		ret = append(ret, v.String())
	}
	return ret
}

func main() {
	fmt.Println(stringify([]StringInt{1, 2, 3, 4, 5}))
}
```

代码中我们声明了MyStringer接口，并且使用StringInt类型实现了此接口；

在范型方法中，我们声明了范型的类型为：`任意实现了MyStringer接口的类型`；

运行该示例输出：

```
[1 2 3 4 5]
```

如果我们在main函数中写下如下代码：

```
func main() {
	fmt.Println(Stringify([]int{1, 2, 3, 4, 5}))
}
```

那么我们将得到下面的编译器错误输出：

```
4_interface_constraint/main.go:28:23: int does not satisfy MyStringer (missing method String)
```

我们看到：只有实现了Stringer接口的类型才会被允许作为实参传递给Stringify泛型函数的类型参数并成功实例化！

<br/>

### **MyStringer2.0 - 类型列表和方法列表双重约束**

我们还可以结合interface的类型列表(type list)和方法列表一起对类型参数进行约束，看下面示例：

5_signed_interface_constraint/main.go

```go
package main

import (
	"fmt"
	"strconv"
)

// Compiling Error:
// StringInt does not satisfy MySignedStringer (uint not found in int, int8, int16, int32, int64)
//type StringInt uint

type StringInt int

func (i StringInt) String() string {
	return strconv.Itoa(int(i))
}

type MySignedStringer interface {
	// Only these types & interface can be generalized!
	type int, int8, int16, int32, int64
	String() string
}

// A generic type that need to implement MySignedStringer interface!
func stringify[T MySignedStringer](s []T) (ret []string) {
	for _, v := range s {
		ret = append(ret, v.String())
	}
	return ret
}

func main() {
	fmt.Println(stringify([]StringInt{1, 2, 3, 4, 5}))
}
```

在该示例中，用于对泛型函数的类型参数进行约束的MySignedStringer接口既包含了类型列表，也包含方法列表，这样类型参数的实参类型既要在MySignedStringer的类型列表中，也要实现了MySignedStringer的String方法！

如果我们将上面的StringInt的底层类型改为uint：

```
type StringInt uint
```

那么我们将得到下面的编译器错误输出：

```
StringInt does not satisfy MySignedStringer (uint not found in int, int8, int16, int32, int64) type StringInt uint
```

<br/>

### **查找index函数 - comparable内置比较类型**

由于Go泛型设计选择了不支持运算操作符重载，因此，我们即便对interface做了语法扩展，依然无法表达类型是否支持**==**和**!=**；

为了解决这个表达问题，新设计提案中引入了一个新的预定义类型约束：**comparable**；

我们看下面例子：

6_comparable/main.go

```go
package main

import (
	"fmt"
)

// index returns the index of x in s, or -1 if not found.
func index[T comparable](s []T, x T) int {
	for i, v := range s {
		// v and x are type T, which has the comparable constraint
		// so we can use == here.
		if v == x {
			return i
		}
	}
	return -1
}

type Foo struct {
	a string
	b int
}

func main() {
	fmt.Println(index([]int{1, 2, 3, 4, 5}, 3))
	fmt.Println(index([]string{"a", "b", "c", "d", "e"}, "d"))
	fmt.Println(index(
		[]Foo{
			{"a", 1},
			{"b", 2},
			{"c", 3},
			{"d", 4},
			{"e", 5},
		}, Foo{"b", 2}))
}
```

运行该示例：

```
2
3
1
```

我们看到Go的原生支持比较的类型，诸如整型、字符串以及由这些类型组成的复合类型(如结构体)均可以直接作为实参传给由comparable约束的类型参数；

<font color="#f00">**comparable可以看成一个由Go编译器特殊处理的、包含由所有内置可比较类型组成的type list的interface类型；**</font>

因此我们可以将其嵌入到其他作为约束的接口类型定义中：

```go
type ComparableStringer interface {
	comparable
	String() string
}
```

此时，只有支持比较的类型且实现了**String**方法，才能满足ComparableStringer的约束；

<br/>

### **实现范型Set类型 - 声明范型方法**

和对泛型函数中类型参数的约束方法一样，我们也可以对泛型类型的方法以同样方法做同样的约束；

下面我们使用范型实现一个Set集合：

7_generic_method/main.go

```go
// Package set implements sets of any comparable type.
package main

import "fmt"

type addable interface {
	//type int, int8, int16, int32, int64,
	//	uint, uint8, uint16, uint32, uint64, uintptr,
	//	float32, float64, complex64, complex128,
	comparable
}

// set is a set of values.
type set[T addable] map[T]struct{}

// add adds v to the set s.
// If v is already in s this has no effect.
func (s set[T]) add(v T) {
	s[v] = struct{}{}
}

// contains reports whether v is in s.
func (s set[T]) contains(v T) bool {
	_, ok := s[v]
	return ok
}

// len reports the number of elements in s.
func (s set[T]) len() int {
	return len(s)
}

// delete removes v from the set s.
// If v is not in s this has no effect.
func (s set[T]) delete(v T) {
	delete(s, v)
}

// iterate invokes f on each element of s.
// It's OK for f to call the Delete method.
func (s set[T]) iterate(f func (T) ) {
	for v := range s {
		f(v)
	}
}

// invalid AST: method must have no type parameters
// methods cannot have type parameters
/*
func (s set[T]) anotherGeneric[P comparable](v T, p P) {
	fmt.Printf("v: %v, p: %v\n", v, p)
}
*/

func print[T addable](s T) {
	fmt.Printf("%v ", s)
}

func main() {
	s := make(set[int])

	// Add the value 1,11,111 to the set s.
	s.add(1)
	s.add(11)
	s.add(111)
	s.add(1111)
	s.add(11111)
	fmt.Printf("%v\n", s)

	// Check that s does not contain the value 11.
	if s.contains(11) {
		println("the set contains 11")
	} else {
		println("the set do not contain 11")
	}

	// Check len of set
	fmt.Printf("the len of set: %d\n", s.len())

	// Delete elem in set
	s.delete(11)
	fmt.Println("\nafter delete 11:")
	if s.contains(11) {
		println("the set contains 11")
	} else {
		println("the set do not contain 11")
	}
	fmt.Printf("the len of set: %d\n", s.len())

	// Iterate set with explicit type(int)
	s.iterate(func(x int) {
		fmt.Println(x + 1)
	})

	// Iterate set with implicit type(addable) ERROR!
	//s.iterate(print)

	// Generic in another generic type method
	//s.anotherGeneric(2, 3)
}
```

在这个示例中我们定义了一个数据结构：Set；

该Set中的元素是有约束的：必须支持可比较！对应到代码中，我们用comparable作为泛型类型Set的类型参数的约束；

随后，我们定义了几个常用方法：

-   add
-   contains
-   len
-   delete
-   iterate

运行该示例：

```
map[1:{} 11:{} 111:{} 1111:{} 11111:{}]
the set contains 11
the len of set: 5

after delete 11:
the set do not contain 11
the len of set: 4
11112
2
112
1112
```

<br/>

### **范型队列 - 声明范型引用方法**

下面是一个队列，我们通过应用实现了这个队列的方法：

8_generic_reference_method/main.go

```go
package main

import (
	"fmt"
)

type queue[T any] []T

func (q *queue[T]) enqueue(v T) {
	*q = append(*q, v)
}

func (q *queue[T]) dequeue() (T, bool) {
	if len(*q) == 0 {
		var zero T
		return zero, false
	}
	r := (*q)[0]
	*q = (*q)[1:]
	return r, true
}

func main() {
	q := new(queue[int])
	q.enqueue(5)
	q.enqueue(6)
	fmt.Println(q)
	fmt.Println(q.dequeue())
	fmt.Println(q.dequeue())
	fmt.Println(q.dequeue())
}
```

可以看到，实现范型方法和通常Go的方法基本一致！

<br/>

## **一些其他范型例子**

### **值生成器**

代码如下：

9_others/2_generator/main.go

```go
package main

import (
	"fmt"
)

type addable interface {
	type int, int8, int16, int32, int64,
		uint, uint8, uint16, uint32, uint64, uintptr,
		float32, float64, complex64, complex128
}

func generator[T addable](a T, v T) func() T {
	return func() T {
		r := a
		a = a + v
		return r
	}
}

func main() {
	g1 := generator(0, 1)
	fmt.Println(g1())
	fmt.Println(g1())
	fmt.Println(g1())

	g2 := generator(-9.9, 0.1)
	fmt.Println(g2())
	fmt.Println(g2())
	fmt.Println(g2())
}
```

输出如下：

```
0
1
2
-9.9
-9.8
-9.700000000000001
```

<br/>

### **实现函数式编程map、reduce、filter**

9_others/map/main.go

```go
package main

import (
	"fmt"
)

func mapFunc[T any, M any](a []T, f func (T) M) []M {
	n := make([]M, len(a), cap(a))
	for i, e := range a {
		n[i] = f(e)
	}
	return n
}

func main() {
	vi := []int{1, 2, 3, 4, 5, 6}
	vs := mapFunc(vi, func(v int) string {
		return "<" + fmt.Sprint(v) + ">"
	})
	fmt.Println(vs)
}
```

运行输出：

```
[<1> <2> <3> <4> <5> <6>]
```

<br/>

9_others/reduce/main.go

```go
package main

import (
	"fmt"
)

// reduceFunc
// a: reduce operate collection
// f: reduce operation function
// initial: initial value in reduce
func reduceFunc[T any](a []T, f func(T, T) T, initial interface{}) T {
	if len(a) == 0 || f == nil {
		var vv T
		return vv
	}

	l := len(a) - 1
	reduce := func(a []T, ff func(T, T) T, memo T, startPoint, direction, length int) T {
		result := memo
		index := startPoint
		for i := 0; i <= length; i++ {
			result = ff(result, a[index])
			index += direction
		}
		return result
	}

	if initial == nil {
		return reduce(a, f, a[0], 1, 1, l-1)
	}

	return reduce(a, f, initial.(T), 0, 1, l)
}

func main() {
	v1 := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
	res1 := reduceFunc(v1, func(lhs, rhs int) int {
		return lhs + rhs
	}, 1)
	fmt.Println(res1)

	v2 := []string{"x", "y", "z"}
	res2 := reduceFunc(v2, func(lhs, rhs string) string {
		return lhs + rhs
	}, "a")
	fmt.Println(res2)

	v3 := []int{5, 4, 3, 2, 1}
	res3 := reduceFunc(v3, func(lhs, rhs int) int {
		return lhs*10 + rhs
	}, 0)
	fmt.Println(res3)
}
```

运行输出：

```
56
axyz
54321
```

<br/>


9_others/filter/main.go

```go
package main

import (
	"fmt"
)

func filterFunc[T any](a []T, f func(T) bool) []T {
	var n []T
	for _, e := range a {
		if f(e) {
			n = append(n, e)
		}
	}
	return n
}

func main() {
	v1 := []int{1, 2, 3, 4, 5, 6}
	v1 = filterFunc(v1, func(v int) bool {
		return v < 4.0
	})
	fmt.Println(v1)

	v2 := []float64{2.1, 3.2, 23.2, 2.3}
	v2 = filterFunc(v2, func(v float64) bool {
		return v < 4.0
	})
	fmt.Println(v2)
}
```

运行输出：

```
[1 2 3]
[2.1 3.2 2.3]
```

>   更多例子，见：
>
>   -   https://github.com/JasonkayZK/Go_Learn/tree/go-v1.17-rc-generic

<br/>

## **Golang 泛型的实现机制**

通常，把高级语言编译成机器本地可以执行的汇编代码，大致需要进行词法分析，语法分析，语义分析，生成中间代码，优化，以及最终生成目标代码等几个步骤；

其中词法分析，语法分析，语义分析属于前端，而 **golang 支持的泛型只是前端的改动，本质上是语法糖；**

例如词法分析器要能正确解析泛型新引入的`[]`括号，语法分析器能正确识别并判断代码是否符合泛型的语法规则，并构造正确的语法树 AST；

而到了语义分析阶段，编译器需要能根据前面提到的类型参数和接口限制，来正确的推导出参数的实际类型，检查类型是否实现了相关接口定义的方法，实例化支持特定类型的函数，以及进行函数调用的类型检查等等；

我们可以使用编译 go2go 工具来编译泛型代码；

>   具体的 go2go 工具的编译过程，可以参考这篇文档：
>
>   -   https://golang.org/doc/install/source

下面我们来编译一个最基本的泛型示例代码，内容如下:

```go
import(
   "fmt"
)

func Print[T any](s []T) {
       for _, v := range s {
              fmt.Println(v)
        }
 }

func main(){
     Print([]string{"Hello, ", "World\n"})
}
```

编译完成后，我们看代码长这个样子:

```go
package main

import "fmt"

func main() {
 instantiate୦୦Print୦string([]string{"Hello, ", "World\n"})
}

func instantiate୦୦Print୦string(s []string,) {
	for _, v := range s {
		fmt.Println(v)
	}
}

type Importable୦ int

var _ = fmt.Errorf
```

可以看到编译后的代码实例化了一个支持 string slice 类型的函数，且为了避免和已有代码中的其它函数重名，造成错误，工具引入了两个不常用的 Unicode 字符，并插入到实例化的函数名称中，最后工具把生成的代码，重新命名为.go 后缀的文件，并写到文件系统；

接下来我们就可以正常的编译执行生成的.go 代码！

进一步的，我们可以通过编译 debug go2go 的源码，来看看究竟工具如何做这些做事情的；

通过 debug go2go 工具，我们发现，其实 go2go 帮我们把使用泛型的 golang 代码，通过重写 AST 的方式，转换成 go 1.x 版本的代码， 如下所示：

```go
// rewriteAST rewrites the AST for a file.
func rewriteAST(fset *token.FileSet, importer *Importer, importPath string, tpkg *types.Package, file *ast.File, addImportableName bool) (err error) {
	t := translator{
		fset:         fset,
		importer:     importer,
		tpkg:         tpkg,
		types:        make(map[ast.Expr]types.Type),
		typePackages: make(map[*types.Package]bool),
	}
	t.translate(file)

	// Add all the transitive imports. This is more than we need,
	// but we're not trying to be elegant here.
	imps := make(map[string]bool)

	for _, p := range importer.transitiveImports(importPath) {
		imps[p] = true
	}
	for pkg := range t.typePackages {
    ......
```

上面的 AST 转换工具相关的代码和思路应该会被正式的 golang 编译器实现所借鉴；

<br/>

## **性能影响**

根据这份技术提案中关于泛型函数和泛型类型实现的说明，Go会使用基于接口的方法来编译泛型函数(generic function)，这将优化编译时间，因为该函数仅会被编译一次，但是会有一些运行时代价；

对于每个类型参数集，泛型类型(generic type)可能会进行多次编译，这将延长编译时间，但是不会产生任何运行时代价，编译器还可以选择使用类似于接口类型的方法来实现泛型类型，使用专用方法访问依赖于类型参数的每个元素；

<br/>

## **小结**

Go泛型方案的即将定型即好也不好。Go向来以简洁著称，增加泛型，无论采用什么技术方案，都会增加Go的复杂性，提升其学习门槛，代码可读性也会下降；

但在某些场合(比如实现container数据结构及对应算法库等)，使用泛型却又能简化实现；

在这份提案中，Go核心团队也给出如下期望：

```
We expect that most packages will not define generic types or functions, but many packages are likely to use generic types or functions defined elsewhere

我们期望大多数软件包不会定义泛型类型或函数，但是许多软件包可能会使用在其他地方定义的泛型类型或函数。
```

并且提案提到了会在Go标准库中增加一些新包，已实现基于泛型的标准数据结构(slice、map、chan、math、list/ring等)、算法(sort、interator)等，gopher们只需调用这些包提供的API即可；

>   **另外该提案的一大优点就是与Go1兼容，因此我们可能永远不会使用Go2这个版本号了；**

由于 golang 泛型的实现涉及到编译器前端的诸多技术细节和语言的历史背景，本人不可能也没有能力通过短短一篇文章把所有的方面讲解清楚，目前社区通过多个分支并行开发来提供支持，感兴趣的读者可以自行下载源码阅读研究，本文主要是抛砖引玉，期望有更多的读者参与到开源技术的研究和推广中来并与大家分享；

泛型代码适用的范围主要在集合，数学库，以及一些通用的算法和框架类库中, 滥用泛型会增加代码的编写和维护成本，得不偿失；

最后，用 golang 编译器核心作者之一 Robert Griesemer 的话来总结本文: “泛型是带类型检查的宏指令，使用宏指令前请三思”。

<br/>

## **附录**

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/go-v1.17-rc-generic

文章参考：

-   [Go 言語にやってくる Generics は我々に何をもたらすのか](https://zenn.dev/mattn/books/4c7de85ec42cb44cf285)
-   https://github.com/mattn/go-generics-example
-   [利好！极大可能在go 1.17中就能尝试泛型](https://colobu.com/2021/02/20/merge-dev-typeparams-to-master-during-Go-1-17/)
-   [Go泛型新方案详解！Go泛型真的要来了，最早在Go 1.17版本支持](https://www.imooc.com/article/305914)

<br/>