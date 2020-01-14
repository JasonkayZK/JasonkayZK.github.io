---
title: Spring中xml、注解和JavaConfig到底选哪个
toc: true
date: 2019-09-23 19:54:14
cover: https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1569249898351&di=c288d93bf2b6515d5641347c3db125c7&imgtype=jpg&src=http%3A%2F%2Fwww.grabsun.com%2Fuploads%2Fimages%2F201207-1%2F1201261417449212.png
categories: Spring
tags: [Spring]
description: xml、注解和JavaConfig作为Spring中常用的三种配置方式有何区别, 三种方法分别适用于什么场合, 本篇文章为您一一解答.
---



xml、注解和JavaConfig作为Spring中常用的三种配置方式有何区别, 三种方法分别适用于什么场合, 本篇文章为您一一解答.

本文概要:

-   为什么说xml配置是类型不安全的配置方式？
-   如何使用注解进行配置？
-   注解配置是万能的吗？
-   如何使用Java Config进行配置？
-   xml、注解、Java Config，到底该如何选择？

<!--more-->

## Spring中的配置xml、注解和JavaConfig

### 一. 类型不安全的xml配置

通过XML进行的配置容易产生笔误, 如:

```xml
<bean id="serverLogger" class="com.springnovel.perfectlogger.CosoleLogger"/>
```

如上, **笔误**将`CosoleLogger`拼写成了`CosoleLogger`, 对于IDEA这种无敌的编辑器而言, 这种错误可以避免;



<br/>

-------------------



### 二. 通过注解进行自动化装配

#### 1): 通过注解进行装配的例子

例: 将原来PaymentAction中，使用xml配置的OrderDao，改为通过注解进行配置;

首先，给OrderDao加上@Component注解,表明这个类是一个组件类，告诉Spring要为这个class创建bean，并注入给IOrderDao

```java
@Component
public class OrderDao implements IOrderDao{
    ......
}
```

<br/>

接着需要告诉Spring哪些包是需要进行扫描并自动装配. 因此，新建了一个配置类，然后使用@ComponentScan指明哪些包需要扫描:

```java
@Configuration
@ComponentScan(basePackageClasses={IOrderDao.class,PaymentActionMixed.class})
public class PaymentConfig {

}
```

<font color="#0000ff">这里的basePackageClasses是类型安全的，它的值是一个class数组，表明Spring将会扫描这些class所在的包</font>

<br/>

最后需要使用@Autowired，把扫描到的OrderDao通过构造器注入的方式，注入到PaymentAction中:

```java
@Component
public class PaymentActionMixed {

    ......
    private IOrderDao orderDao;

    ......

    @Autowired
    public PaymentActionMixed(IOrderDao orderDao) {
        super();
        this.orderDao = orderDao;
    }

    ......

    public void addOrder(String orderType) {
        orderDao.addOrder(orderType);
    }

}
```

<br/>

测试: 这里使用了SpringJUnit4ClassRunner以便于在测试开始的时候自动创建Spring的上下文，使用@ContextConfiguration告诉Spring要加载什么配置:

```java
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes=PaymentConfig.class)
public class PaymentMixedTest {

    @Autowired
    private PaymentActionMixed paymentActionMixed;

    @Test
    public void testPaymentMixedAddOrder() {
        paymentActionMixed.addOrder("create_sub");
    }
}
```

Output:

```
real add order, order type is create_sub
```

仅仅用了几个注解，就成功地将OrderDao注入到PaymentAction里面了！比起xml啰里啰嗦的配置，简直是太方便了！



<br/>

#### 2): 注解并非万能

<font color="#ff0000">对于第三方的jar包, 由于我们无法修改源码, 所以没办法在源码上添加注解!</font>



<br/>



-----------------



### 三.使用Java代码进行注入

这种配置方式是**自由度最高**的，顾名思义，就是通过Java代码的方式进行注入!

例如: 使用JavaConfig的配置方式来注入第三方jar包里的ConsoleLogger

<font color="#ff0000">使用Java Config，只需要创建一个配置类，在配置类中编写方法，返回要注入的对象，并给方法加上@Bean注解，告诉Spring为返回的对象创建实例:</font>

```java
@Configuration
public class PaymentJavaConfig {

    @Bean
    public ILogger getIlogger() {
        return new ConsoleLogger();
    }

    @Bean
    public PaymentActionMixed getPaymentActionMixed(ILogger logger)     {
        return new PaymentActionMixed(logger);
    }

```

接着就可以进行测试了:

```java
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = PaymentJavaConfig.class)
public class PaymentJavaConfigTest {

    @Autowired
    private PaymentActionMixed paymentActionMixed;

    @Test
    public void testPaymentMixedAddOrder() {
        paymentActionMixed.pay(new BigDecimal(100));
    }
}
```

Output:  

```
ConsoleLogger: pay begin, payValue is 100
ConsoleLogger: pay end
```

Java Config也是非常方便，虽然要写的代码比注解多了不少，但是:

<font color="#ff0000">一方面,相比于注解配置，Java Config*对代码没有侵入*，可以注入代码不是自己维护的类；</font>

<font color="#ff0000">另一方面，Java Config是使用Java代码进行注入的，相比于xml来说，又更为自由</font>



<br/>

------------------------



### 四. 总结

三种配置方式比较:

<br/>

| 特点\配置方式                | XML                                                | 注解                                   | Java Config                                         |
| ---------------------------- | -------------------------------------------------- | -------------------------------------- | --------------------------------------------------- |
| 类型是否安全                 | N                                                  | Y                                      | Y                                                   |
| 查找实现类是否方便           | N，需要查找所有xml                                 | Y，只需看哪个实现类上有加注解          | N，需要查找所有Java Config                          |
| 可读性                       | 差，有很多xml标签，不易阅读                        | 很好，注解的同时起到注释的作用         | 较好，对于Java程序员来说，阅读Java代码比阅读xml方便 |
| 配置简洁性                   | 很啰嗦                                             | 十分简洁                               | 有点啰嗦                                            |
| 修改配置是否需要重新编译     | N，直接替换xml文件即可                             | Y，需重新编译出class文件，然后进行替换 | Y，同注解配置                                       |
| 是否会侵入代码               | N                                                  | Y                                      | N                                                   |
| 自由度                       | 低，可以使用SPEL语法，但是SPEL语法能实现的功能有限 | 低，只能基于注解的属性进行配置         | 高，可以自由使用Java语法，调用各种函数来注入对象    |
| 是否可以注入不是自己维护的类 | Y                                                  | N                                      | Y                                                   |

<br/>

这么总结下来一看，这三种配置方式，真可谓是各有千秋，不过在选择上还是有一定的规律的：

-   xml配置: 相对于其他两种方式来说，几乎没什么优势，<font color="#ff0000">唯一的优势就是修改后不需要重新编译，因此对于一些`经常切换实现类的对象，可以采用xml的方式进行配置;`</font>还有就是由于xml是Spring一开始就提供的配置方式，因此很多旧代码还是采用xml，所以在<font color="#0000ff">维护旧代码时会免不了用到xml;</font>

-   注解: <font color="#ff0000">用起来非常地简洁，代码量十分少，因此是项目的第一选择;</font>
-   Java Config: 只有<font color="#ff0000">当需要注入代码不是自己维护的第三方jar包中的类时，或者需要更为灵活地注入，</font>比如说需要调用某个接口，查询数据，然后把这个数据赋值给要注入的对象，那么这时候就需要用到



<br/>



---------------------------



### 附录

文章引用:

-   [用小说的形式讲解Spring（3） —— xml、注解和Java Config到底选哪个](https://blog.csdn.net/hzy38324/article/details/78176307)
-   Spring in Action
-   [Spring Dependency Injection Styles - Why I love Java based configuration - codecentric AG Blog](https://blog.codecentric.de/en/2012/07/spring-dependency-injection-styles-why-i-love-java-based-configuration/l-or-annotations)
-   [Spring Framework – XML vs. Annotations - DZone Java](https://dzone.com/articles/spring-framework-xml-vs-annotations)
-   [xml configuration versus Annotation based configuration](https://stackoverflow.com/questions/182393/xml-configuration-versus-annotation-based-configuration)
-   [Spring annotation-based DI vs xml configuration?](https://stackoverflow.com/questions/8428439/spring-annotation-based-di-vs-xml-configuration)
-   [Java Dependency injection: XML or annotations](https://stackoverflow.com/questions/4995170/java-dependency-injection-xml-or-annotations)



