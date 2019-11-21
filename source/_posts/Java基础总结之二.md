---
title: Java基础总结之二
toc: false
date: 2019-11-21 19:59:32
cover:
categories: 面试总结
tags: Java基础
description: 本文是Java面试总结中Java基础篇的第二篇
---

本文是Java面试总结中Java基础篇的第一篇

<!--more-->

### 1. 是否可以从一个static方法内部发出对非static方法的调用？

不可以。因为非static方法是要与对象关联在一起的，必须创建一个对象后，才可以在该对象上进行方法调用，而static方法调用时不需要创建对象，可以直接调用。

即当一个static方法被调用时，可能还没有创建任何实例对象，如果从一个static方法中发出对非static方法的调用，那个非static方法是关联到哪个对象上的呢？这个逻辑无法成立，所以，一个static方法内部发出对非static方法的调用。

<br/>

### 2. Integer与int的区别

int是java提供的8种原始数据类型之一。Java为每个原始类型提供了封装类，Integer是java为int提供的封装类。

<font color="#ff0000">int的默认值为0，而Integer的默认值为null，即Integer可以区分出未赋值和值为0的区别，int则无法表达出未赋值的情况，例如，要想表达出没有参加考试和考试成绩为0的区别，则只能使用Integer。</font>

**① 在JSP开发中:**

Integer的默认为null，所以用el表达式在文本框中显示时，值为空白字符串，而int默认的默认值为0，所以用el表达式在文本框中显示时，结果为0，所以，int不适合作为web层的表单数据的类型;

**② 在Hibernate中:**

如果将OID定义为Integer类型，那么Hibernate就可以根据其值是否为null而判断一个对象是否是临时的，如果将OID定义为了int类型，还需要在hbm映射文件中设置其unsaved-value属性为0。

另外，Integer提供了多个与整数相关的操作方法，例如，将一个字符串转换成整数，Integer中还定义了表示整数的最大值和最小值的常量。

>   <br/>
>
>   **注:** 需要注意的是, 对于int[]和Integer[]是不一样的!

例: 从大到小排序数组

```java
int[] intArray = new int[] {1,2,3,4,5};
Integer[] integerArray = new Integer[] {1,2,3,4,5};
Arrays.sort(intArray, (x, y) -> y - x); 
// 编译错误: 
/* Error:(10, 15) java: 对于sort(int[],(x,y)->x - y), 找不到合适的方法
    方法 java.util.Arrays.<T>sort(T[],java.util.Comparator<? super T>)不适用
      (推论变量 T 具有不兼容的上限
        等式约束条件：int
        下限：java.lang.Object)
    方法 java.util.Arrays.<T>sort(T[],int,int,java.util.Comparator<? super T>)不适用
      (无法推断类型变量 T
        (实际参数列表和形式参数列表长度不同))
*/
System.out.println(Arrays.toString(intArray));
Arrays.sort(integerArray, (x, y) -> y - x);
System.out.println(Arrays.toString(integerArray)); // 正常输出5,4,3,2,1
```

这是由于<font color="#ff0000">Arrays.sort()方法仅支持引用类型，而int并非应用类型. 所以无法对 int[]数组进行倒序排序!</font>

**解决办法:**

-   [ ] 使用Arrays.sort(arr)对数组正序排列后再翻转或反序遍历;
-   [x] 使用JDK 8的特性: Stream

使用Stream特性后的代码:

```java
int[] intArray = new int[] {1,2,3,4,5};
Integer[] integerArray = new Integer[] {1,2,3,4,5};
Arrays.stream(intArray)
    .boxed()
    .sorted((x, y) -> y - x)
    .forEach(System.out::println);
Arrays.stream(integerArray)
    .sorted((x, y) -> y - x)
    .forEach(System.out::println);
```

代码中boxed()即将基本类型转为了包装类, 保证了后面自定义比较器可以正常运行!

<br/>

### 3. Math.round(11.5)等于多少? Math.round(-11.5)等于多少?

Math类中提供了三个与取整有关的方法：`ceil、floor、round`, 这些方法的作用与它们的英文名称的含义相对应.

① ceil的英文意义是天花板: 该方法就表示向上取整，Math.ceil(11.3)的结果为12,Math.ceil(-11.3)的结果是-11；

② floor的英文意义是地板，该方法就表示向下取整，Math.ceil(11.6)的结果为11,Math.ceil(-11.6)的结果是-12;

③ <font color="#ff0000">round方法表示“四舍五入”，算法为Math.floor(x+0.5)，即将原来的数字加上0.5后再向下取整;</font>

>   <br/>
>
>   所以，Math.round(11.5)的结果为12，Math.round(-11.5)的结果为-11!

<br/>

### 4. 为什么使用STRING.equals(str)? 它与str.equals(STRING)的区别是什么?

这个问题在阿里巴巴的Java编程规范中讲的很清楚.

对于str.equals(STRING)来说程序可能会报NPE, 而使用STRING.equals(str)一定是对的!(即使str为null!)

例:

```java
String str = null;
System.out.println("str".equals(str)); // false
System.out.println(str.equals("str")); // 报错: NPE
```

<br/>

### 5. 请说出作用域public，private，protected，以及不写时的区别

>   <br/>
>
>   **说明：**如果在修饰的元素上面没有写任何访问修饰符，则表示package

|  作用域   | 当前类 | 同一package | 子类 | 其他package |
| :-------: | :----: | :---------: | :--: | :---------: |
|  public   |   √    |      √      |  √   |      √      |
| protected |   √    |      √      |  √   |      ×      |
|  package  |   √    |      √      |  ×   |      ×      |
|  private  |   √    |      ×      |  ×   |      ×      |

<br/>

### 6. Overload和Override的区别。Overload的方法是否可以改变返回值的类型?

Overload是重载的意思，Override是覆盖的意思，也就是重写。

**① Overload重载**

重载Overload是针对同一个类来说的, 即同一个类中可以有多个名称相同的方法，但这些方法的参数列表各不相同（即参数个数或类型不同）. 在调用时，VM会根据不同的参数样式，来选择合适的方法执行。

>   <br/>
>
>   **在使用重载要注意以下的几点：**
>
>   ① 在使用重载时只能通过不同的参数样式。例如，不同的参数类型，不同的参数个数，不同的参数顺序（当然，同一方法内的几个参数类型必须不一样，例如可以是fun(int,float)，但是不能为fun(int,int)）;
>
>   ② 不能通过访问权限、返回类型、抛出的异常进行重载；
>
>   ③ 方法的异常类型和数目不会对重载造成影响；
>
>   ④ 对于继承来说，如果某一方法在父类中是访问权限是priavte，那么就不能在子类对其进行重载，如果定义的话，也只是定义了一个新方法，而不会达到重载的效果。

**② Override覆盖**

重写Override是针对父子类来说的, 即子类中的方法可以与父类中的某个方法的名称和参数完全相同，通过子类创建的实例对象调用这个方法时，将调用子类中的定义方法，这相当于把父类中定义的那个完全相同的方法给覆盖了，这也是面向对象编程的多态性的一种表现。

>   <br/>
>
>   **对于Override需要注意的是:**
>
>   ① 覆盖的方法的标志必须要和被覆盖的方法的标志完全匹配，才能达到覆盖的效果；
>
>   ② <font color="#ff0000">覆盖的方法的返回值必须和被覆盖的方法的返回一致!</font>
>
>   ③ 覆盖的方法所抛出的异常必须和被覆盖方法的所抛出的异常一致，或者是其子类；子类覆盖父类的方法时，**只能比父类抛出更少的异常**，或者是抛出父类抛出的异常的子异常!因为子类可以解决父类的一些问题，不能比父类有更多的问题。
>
>   ④ 被覆盖的方法不能为private，否则在其子类中只是新定义了一个方法，并没有对其进行覆盖。子类方法的访问权限只能比父类的更大，不能更小。如果父类的方法是private类型，那么，子类则不存在覆盖的限制，相当于子类中增加了一个全新的方法。



**再次强调**: <font color="#ff0000">覆盖的方法的返回值必须和被覆盖的方法的返回一致!</font>

例如, 下面声明了一个接口返回值为String, 在实现类中若为void则编译错误! 

```java
public class Test implements TestInterface {

    public static void main(String[] args) {

    }

    @Override
    public void hello() { // 此处为void! 报错!
        return;
    }
}

interface TestInterface {
    String hello();
}

```

<br/>

### 7. 构造器Constructor是否可被override?

构造器Constructor不能被继承，因此不能重写Override，但可以被重载Overload。

<br/>

### 8. 接口是否可继承接口?抽象类是否可实现(implements)接口?抽象类是否可继承具体类(concrete class)?抽象类中是否可以有静态的main方法？

接口可以继承接口。

抽象类可以实现(implements)接口。

抽象类可以继承具体类。

抽象类中可以有静态的main方法。

>   <br/>
>
>   **备注：**
>
>   <font color="#ff0000">记住抽象类与普通类的唯一区别就是不能创建实例对象和允许有abstract方法。</font>

<br/>

### 9. 写clone()方法时，通常都有一行代码，是什么？

答: `super.clone()`

因为首先要把父类中的成员复制到位，然后才是复制自己的成员。

<br/>

### 10. 面向对象的特征有哪些方面

面向对象的编程语言有4个主要的特征:

**① 封装**

封装是保证软件部件具有优良的模块性的基础，封装的目标就是要实现软件部件的“高内聚、低耦合”，防止程序相互依赖性而带来的变动影响。

在面向对象的编程语言中，对象是封装的最基本单位，面向对象的封装比传统语言的封装更为清晰、更为有力。面向对象的封装就是把描述一个对象的属性和行为的代码封装在一个“模块”中，也就是一个类中，属性用变量定义，行为用方法进行定义，方法可以直接访问同一个对象中的属性。

**② 抽象**

抽象就是找出一些事物的相似和共性之处，然后将这些事物归为一个类，这个类只考虑这些事物的相似和共性之处，并且会忽略与当前主题和目标无关的那些方面，将注意力集中在与当前目标有关的方面。

**③ 继承**

在定义和实现一个类的时候，可以在一个已经存在的类的基础之上来进行，把这个已经存在的类所定义的内容作为自己的内容，并可以加入若干新的内容，或修改原来的方法使之更适合特殊的需要，这就是继承。继承是子类自动共享父类数据和方法的机制，这是类之间的一种关系，提高了软件的可重用性和可扩展性。

**④ 多态**

多态是指程序中定义的引用变量所指向的具体类型和通过该引用变量发出的方法调用在编程时并不确定，而是在程序运行期间才确定，即一个引用变量倒底会指向哪个类的实例对象，该引用变量发出的方法调用到底是哪个类中实现的方法，必须在由程序运行期间才能决定。

<font color="ff0000">由于在程序运行时才确定具体的类，这样，不用修改源程序代码，就可以让引用变量绑定到各种不同的类实现上，从而导致该引用调用的具体方法随之改变，即不修改程序代码就可以改变程序运行时所绑定的具体代码，让程序可以选择多个运行状态，这就是多态性。</font>多态性增强了软件的灵活性和扩展性。

例如，下面代码中的UserDao是一个接口，它定义引用变量userDao指向的实例对象由daofactory.getDao()在执行的时候返回. 

有时候指向的是UserJdbcDao这个实现，有时候指向的是UserHibernateDao这个实现，这样，不用修改源代码，就可以改变userDao指向的具体类实现，从而导致userDao.insertUser()方法调用的具体代码也随之改变，即有时候调用的是UserJdbcDao的insertUser方法，有时候调用的是UserHibernateDao的insertUser方法:

```java
UserDao userDao = daofactory.getDao();
userDao.insertUser(user);
```



<br/>