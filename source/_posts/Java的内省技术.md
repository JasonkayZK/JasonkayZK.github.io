---
title: Java的内省技术
cover: https://img.paulzzh.com/touhou/random?29
toc: true
date: 2020-03-02 13:28:39
categories: 技术杂谈
description: 以前知道Java中的反射, 也学习过一些和反射相关的内容. 今天看到了一个叫内省(IntroSpector)的技术, 所以就总结一下
---

以前知道Java中的反射, 也学习过一些和反射相关的内容. 今天看到了一个叫内省(IntroSpector)的技术, 所以就总结一下


本文内容包括:

- 什么是内省(IntroSpector)
- 内省的作用
- 内省和反射的区别
- 如何使用内省
- 内省的例子
- beanutils工具包使用


源代码: https://github.com/JasonkayZK/Java_Samples/tree/java-introspector

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>

<!--more-->

## Java的内省技术

<br/>

### 什么是内省

**内省: 计算机程序在运行时(Runtime)检查对象(Object)类型的一种能力,** 通常也可以称作**运行时类型检查**

><br/>
>
>**注意: 不应该将内省和反射混淆**
>
>**相对于内省，反射更进一步: 计算机程序在运行时(Runtime)可以访问、检测和修改它本身状态或行为的一种能力**
>
><font color="#f00">**简单来说就是: 内省只能访问、用，而反射甚至可以更改(而且内省是通过反射实现的!)**</font>

****

### 内省的作用

**内省是操作JavaBean 的 API，用来访问某个属性的 getter/setter 方法**

对于一个标准的 javaBean 来说，它包括属性、get 方法和 set 方法，这是一个约定俗成的规范

****

### 内省和反射的区别

紧接着上面说的:

-   反射: **在运行状态把Java类中的各种成分映射成相应的Java类(Method, Class等)**，可以动态的获取所有的属性以及动态调用任意一个方法，强调的是运行状态
-   内省: Java 语言针对 Bean 类属性、事件的一种**缺省处理方法, 并且内省机制是通过反射来实现的:** BeanInfo用来暴露一个bean的属性、方法和事件，以后我们就可以操纵该JavaBean的属性

****

### 如何使用内省

Java 中提供了一套 API 用来访问某个属性的 getter/setter 方法，通过这些 API 可以使你不需要了解这个规则（但你最好还是要搞清楚），这些 API 存放于包` java.beans `中:

-   核心类是 `Introspector`, 它提供了的 **`getBeanInfo` 系类方法，可以拿到一个 JavaBean 的所有信息**
-   通过 `BeanInfo` 的 `getPropertyDescriptors` 方法和 `getMethodDescriptors` 方法可以**拿到 javaBean 的字段信息列表和 getter 和 setter 方法信息列表**
-   `PropertyDescriptors` 可以**根据字段直接获得该字段的 getter 和 setter 方法**
-   `MethodDescriptors` 可以**获得方法的元信息**，比如方法名，参数个数，参数字段类型等
-   **然后通过反射机制来调用这些方法**

以上就是在Java内省中用到的几个类, 以及内省的流程

****

### 实例

**创建实体类**

JavaBean: Person.java

```java
/**
 * JavaBean
 *
 * @author zk
 */
public class Person {

    private String name;

    private String password;

    private int age;

    private Date birthday;

    /**
     * 此时gender也是Bean中的一个属性!
     *
     * @return gender
     */
    public String getGender() {
        return "Unknown";
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public Date getBirthday() {
        return birthday;
    }

    public void setBirthday(Date birthday) {
        this.birthday = birthday;
    }
}
```

><br/>
>
>**注意: 尽管gender字段没有被声明, 但是存在他的getter方法!**

**使用内省API操作bean的属性**

IntrospectorDemo1.java

```java
/**
 * 直接使用JDK自带API操作Bean
 *
 * @author zk
 */
public class IntrospectorDemo1 {

    /**
     * 得到bean的所有属性
     */
    public static void getAllAttribute() throws Exception {
        // 不自省从父类继承的属性
        BeanInfo info = Introspector.getBeanInfo(Person.class, Object.class);
        // 取得属性描述器
        PropertyDescriptor[] pds = info.getPropertyDescriptors();
        for (PropertyDescriptor pd : pds) {
            System.out.println(pd.getName());
        }
    }

    /**
     * 操纵bean的指定属性
     */
    public static void manipulateAttributeTest() throws Exception {
        Person p = new Person();
        PropertyDescriptor pd = new PropertyDescriptor("age", Person.class);

        // 得到属性的写方法，为属性赋值
        // setAge
        Method method = pd.getWriteMethod();
        method.invoke(p, 24);

        // 获取属性的值
        // getAge()
        method = pd.getReadMethod();
        System.out.println(method.invoke(p));
    }

    /**
     * 获取当前操作的属性的类型
     */
    public static void readAttributeTypeTest() throws Exception {
        PropertyDescriptor pd = new PropertyDescriptor("age", Person.class);
        System.out.println(pd.getPropertyType());
    }

    public static void main(String[] args) throws Exception {
        // age
        // birthday
        // gender
        // name
        // password
        getAllAttribute();

        // 24
        manipulateAttributeTest();

        // int
        readAttributeTypeTest();
    }
}
```

><br/>
>
>需要注意的是:
>
>-   **① gender也被作为了Bean中的属性(因为含有getter方法);**
>-   **② manipulateAttributeTest()方法的确修改了age属性的值;**
>-   **③ readAttributeTypeTest()方法取得了age所声明的属性类型;**

以上的操作略显繁琐, 所以Apache组织开发了一套用于操作JavaBean的API: `commons-beanutils`

这套API考虑到了很多实际开发中的应用场景，因此在实际开发中很多程序员使用这套API操作JavaBean，以简化程序代码的编写

****

### beanutils工具包使用

Maven依赖:

```xml
<dependency>
    <groupId>commons-beanutils</groupId>
    <artifactId>commons-beanutils</artifactId>
    <version>1.9.4</version>
</dependency>
```

Beanutils工具包的常用类和方法：

-   BeanUtils
-   PropertyUtils
-   ConvertUtils.regsiter(Converter convert, Class clazz)

例子:

**① setProperty(): 对bean中的某个属性进行赋值**

```java
Person p = new Person();
BeanUtils.setProperty(p, "name", "jasonkay");
// jasonkay
System.out.println(p.getName());
```

****

**② 自定义转换器**

因为用户提交的`1994-10-12`是个字符串，而bean中的birthday是个Date类型的属性，由于String类型自动转化仅限于8种基本类型，所以**无法直接将字符串转换为Date**

这就需要我们自定义一个转换器: 

通过`ConvertUtils.regsiter(Converter convert, Class clazz)`方法

```java
Person p = new Person();
// 模拟用户提交的表单
String name = "jasonkay";
String password = "123";
String age = "23";
String birthday = "1996-07-27";

// 给BeanUtils注册一个日期转换器
ConvertUtils.register(new Converter() {
    @Override
    public <T> T convert(Class<T> aClass, Object value) {
        if (value == null) {
            return null;
        }
        if (!(value instanceof String)) {
            throw new ConversionException("只支持String类型的转换！");
        }
        String str = (String) value;
        if ("".equals(str.trim())) {
            return null;
        }

        SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd");
        try {
            return (T) df.parse(str);
        } catch (ParseException e) {
            // 异常链不能断
            throw new RuntimeException(e);
        }
    }
}, Date.class);

// 封装到p对象中
BeanUtils.setProperty(p, "name", name);
BeanUtils.setProperty(p, "password", password);
// 自动将数据转换为基本类型
BeanUtils.setProperty(p, "age", age);
// 通过自定义Converter转换
BeanUtils.setProperty(p, "birthday", birthday);

// jasonkay
// 123
// 23
// Sat Jul 27 00:00:00 CST 1996
System.out.println(p.getName());
System.out.println(p.getPassword());
System.out.println(p.getAge());
System.out.println(p.getBirthday());
```

在调用setProperty()方法之前, 通过ConvertUtils.regsiter()方法注册了一个转换器, 实现从String -> java.util.Date的转换

此后调用BeanUtils.setProperty()方法:

-   **BeanUtils.setProperty(p, "age", age): 自动将数据转换为基本类型**
-   **BeanUtils.setProperty(p, "birthday", birthday): 通过自定义Converter转换**

>   <br/>
>
>   **补充:** 也可以使用API中自带的转换器: `DateLocaleConverter`

****

**③ BeanUtils.populate(): 用map集合中的值填充bean的属性**

```java
Map<String, String> map = new HashMap<>(16);
map.put("name","jasonkay");
map.put("password","123");
map.put("age","23");
map.put("birthday","1996-07-27");

// 给BeanUtils注册一个日期转换器
registDateConverter();

Person bean = new Person();
// 用map集合中的值填充bean的属性
BeanUtils.populate(bean, map);

// jasonkay
// 123
// 23
// Sat Jul 27 00:00:00 CST 1996
System.out.println(bean.getName());
System.out.println(bean.getPassword());
System.out.println(bean.getAge());
System.out.println(bean.getBirthday());
```

其中registDateConverter()方法既是注册了一个转换器

><br/>
>
>以上代码源码见: https://github.com/JasonkayZK/Java_Samples/tree/java-introspector

****

### 总结

内省是基于反射实现的，主要用来操作JavaBean(**可以认为是简化通过反射来操作JavaBean**)，通过内省可以很方便的动态获得bean的set/get方法，属性，方法名

<br/>

### 附录

源代码: https://github.com/JasonkayZK/Java_Samples/tree/java-introspector

文章参考:

-   [java Introspector(内省) 的介绍](https://www.jianshu.com/p/205444f4b1eb)
-   [Java的内省技术](https://blog.csdn.net/z714405489/article/details/84650307)

<br/>