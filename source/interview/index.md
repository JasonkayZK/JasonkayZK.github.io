---
title: 张小凯のJava面试笔记
cover:  https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/interview.jpg
date: 2019-11-21 10:12:50
---

*Le vent se lve, il faut tenter de vivre.*

*風立ちぬ、いざ生きめやも* ———— 《風立ちぬ》

## 面试总结

**本页面创立于: 2019年11月21日**

**页面成立原因:** 总结博主准备Java面试的一路心酸史

**面试内容来源:** 

-   [Java初级面试题](https://www.jianshu.com/p/08153f5678de?utm_campaign=maleskine&utm_content=note&utm_medium=seo_notes&utm_source=recommendation)
-   [Java 集合系列](http://www.cnblogs.com/skywang12345/p/3323085.html)

再次感谢以上作者提供的面试相关资料!<font color="#ff0000">❤</font>

<br/>

## Java基础

基础部分主要包括的内容有：

-   基本语法
-   类相关的内容
-   内部类的内容
-   继承相关的内容
-   异常的内容
-   线程的内容
-   集合的内容
-   io的内容
-   虚拟机方面的内容

|                           文章索引                           | 文章发布日期 | 问题内容                                                     |
| :----------------------------------------------------------: | ------------ | :----------------------------------------------------------- |
| [Java基础总结之一](https://jasonkayzk.github.io/2019/11/21/Java基础总结之一/) | 2019-11-21   | **1. 一个.java源文件中是否可以包括多个类（不是内部类）？有什么限制?<br /><br />2. Java有没有goto?<br /><br />3. 说说&和&&的区别<br /><br />4. 在JAVA中如何跳出当前的多重嵌套循环？<br /><br />5. switch语句能否作用在byte上，能否作用在long上，能否作用在String上?<br /><br />6. short s1 = 1; s1 = s1 + 1;有什么错? short s1 = 1; s1 += 1;有什么错?<br /><br />7. char型变量中能不能存贮一个中文汉字?为什么?<br /><br />8. 使用final关键字修饰一个变量时，是引用不能变，还是引用的对象不能变？<br /><br />9. ==和equals方法究竟有什么区别？<br /><br />10. 静态变量和实例变量的区别？** |
| [Java基础总结之二](https://jasonkayzk.github.io/2019/11/21/Java基础总结之二/) | 2019-11-21   | **1. 是否可以从一个static方法内部发出对非static方法的调用？<br /><br />2. Integer与int的区别<br /><br />3. Math.round(11.5)等于多少? Math.round(-11.5)等于多少?<br /><br />4. 为什么使用STRING.equals(str)? 它与str.equals(STRING)的区别是什么?<br /><br />5. 请说出作用域public，private，protected，以及不写时的区别<br /><br />6. Overload和Override的区别。Overload的方法是否可以改变返回值的类型?<br /><br />7. 构造器Constructor是否可被override?<br /><br />8. 接口是否可继承接口?抽象类是否可实现(implements)接口?抽象类是否可继承具体类(concrete class)?抽象类中是否可以有静态的main方法？<br /><br />9. 写clone()方法时，通常都有一行代码，是什么？<br /><br />10. 面向对象的特征有哪些方面?** |
| [Java基础总结之三](https://jasonkayzk.github.io/2019/11/21/Java基础总结之三/) | 2019-11-21   | **1. java中实现多态的机制是什么？<br /><br />2. abstract class和interface有什么区别?<br /><br />3. abstract的method是否可同时是static,是否可同时是native，是否可同时是synchronized?<br /><br />4. 什么是内部类？Static Nested Class和Inner Class的不同<br /><br />5. 内部类可以引用它的包含类的成员吗？有没有什么限制？<br /><br />6. Anonymous Inner Class (匿名内部类)是否可以extends(继承)其它类，是否可以implements(实现)interface(接口)?<br /><br />7. super.getClass()方法调用<br /><br />8. String是最基本的数据类型吗?<br /><br />9. String s = new String("str")创建了几个String Object?二者之间有什么区别？<br /><br />10. String和StringBuffer的区别** |
| [Java基础总结之四](https://jasonkayzk.github.io/2019/11/22/Java基础总结之四/) | 2019-11-22   | **1. 如何把一段逗号分割的字符串转换成一个数组?<br /><br />2. 数组有没有length()这个方法? String有没有length()这个方法？<br /><br />3. 下面这条语句一共创建了多少个对象：String s="a"+"b"+"c"+"d";<br /><br />4. try {}里有一个return语句，那么紧跟在这个try后的finally {}里的code会不会被执行，什么时候被执行，在return前还是后?<br /><br />5. try中的return和finally中的return最终会返回哪个值?<br /><br />6. final, finally, finalize的区别<br /><br />7. 运行时异常与一般异常有何异同？<br /><br />8. error和exception有什么区别?<br /><br />9. Java中的异常处理机制的简单原理和应用。<br /><br />10. 请写出你最常见到的5个runtime exception。** |
| [Java基础总结之五](https://jasonkayzk.github.io/2019/11/22/Java基础总结之五/) | 2019-11-22   | **1. 在try块中可以抛出异常吗？<br /><br />2. java中有几种方法可以实现一个线程？<br /><br />3. 用什么关键字修饰同步方法? stop()和suspend()方法为何不推荐使用？<br /><br />4. sleep()和 wait()有什么区别?<br /><br />5. 同步和异步有何异同，在什么情况下分别使用他们？举例说明。<br /><br />6. 同步有几种实现方法?<br /><br />7. 启动一个线程是用run()还是start()?<br /><br />8. 当一个线程synchronized方法后，其它线程是否可进入此对象的其它方法? 静态方法和非静态方法都声明为synchronized是否会发生锁竞争?<br /><br />9. 线程的基本概念、线程的基本状态以及状态之间的关系<br /><br />10. 简述synchronized和java.util.concurrent.locks.Lock的异同？** |
| [Java基础总结之六](https://jasonkayzk.github.io/2019/11/22/Java基础总结之六/) | 2019-11-22   | **1. 设计4个线程，其中两个线程每次对j增加1，另外两个线程对j每次减少1<br /><br />2. 介绍Collection框架的结构<br /><br />3. ArrayList和Vector的区别<br /><br />4. HashMap和Hashtable的区别<br /><br />5. 说出ArrayList,Vector, LinkedList的存储性能和特性<br /><br />6. 两个对象值相同(x.equals(y) == true)，但却可有不同的hash code，这句话对不对?<br /><br />7. java中有几种类型的流?JDK为每种类型的流提供了一些抽象类以供继承，请说出他们分别是哪些类?<br /><br />8. 字节流与字符流的区别<br /><br />9. 什么是java序列化，如何实现java序列化？请解释Serializable接口的作用<br /><br />10. 什么是assert?什么时候用assert?** |
| [Java基础总结之七](https://jasonkayzk.github.io/2019/11/25/Java基础总结之七/) | 2019-11-25   | **1. 描述一下JVM加载class文件的原理机制? 类的加载过程?<br /><br />2. 类什么时候才被初始化?类的初始化步骤?<br /><br />3. 什么是双亲委派模型(PDM-Parents Delegate Model)? 为什么使用双亲委派模型?<br /><br />4. 能不能自己写个类，也叫java.lang.String？<br /><br />5. heap和stack有什么区别?<br /><br />6. GC是什么?为什么要有GC?<br /><br />7. 垃圾回收的优点和原理, 并考虑2种回收机制<br /><br />8. 垃圾回收器的基本原理是什么？垃圾回收器可以马上回收内存吗？有什么办法主动通知虚拟机进行垃圾回收？<br /><br />9. 谈谈Java中的垃圾分代?为什么要垃圾分代?如何分代?<br /><br />10. java中会存在内存泄漏吗，请简单描述** |

<br/>

## 算法部分

待更新, 敬请期待…

| 文章索引 | 文章发布日期 | 文章主要内容 |
| :------: | :----------: | ------------ |
|          |              |              |

<br/>

## 数据库部分

|                           文章索引                           | 文章发布日期 | 文章主要内容                                                 |
| :----------------------------------------------------------: | :----------: | :----------------------------------------------------------- |
| [数据库总结之一](https://jasonkayzk.github.io/2019/12/03/数据库总结之一/) |  2019-12-04  | **一. 触发器与存储过程<br /><br />二. 数据库三范式是什么?<br /><br />三. 说出一些数据库优化方面的经验?<br /><br />四. union和union all有什么不同?<br /><br />五. 分页语句<br /><br />六. 注册Jdbc驱动程序的三种方式<br /><br />七. 用JDBC如何调用存储过程<br /><br />八. JDBC中的PreparedStatement相比Statement的好处<br /><br />九. 说出数据连接池的工作机制是什么?<br /><br />十. 为什么要用 ORM? 和 JDBC有何不一样?** |
| [MySQL自定义函数](https://jasonkayzk.github.io/2019/12/04/MySQL自定义函数/) |  2019-12-04  | **创建并使用自定义函数<br /><br />修改自定义函数<br /><br />删除自定义函数** |
| [MySQL存储过程](https://jasonkayzk.github.io/2019/12/04/MySQL存储过程/) |  2019-12-04  | **存储过程的创建<br /><br />存储过程的参数<br /><br />存储过程中的变量<br /><br />存储过程的调用<br /><br />存储过程的查询<br /><br />存储过程的修改<br /><br />存储过程的删除<br /><br />存储过程的控制语句** |
| [MySQL触发器](https://jasonkayzk.github.io/2019/12/04/MySQL触发器/) |  2019-12-04  | **触发器简介<br /><br />创建触发器<br /><br />修改和删除触发器** |
| [MySQL变量](https://jasonkayzk.github.io/2019/12/04/MySQL变量/) |  2019-12-04  | **系统变量<br /><br />会话变量<br /><br />局部变量<br /><br />变量作用域** |
| [MySQL索引](https://jasonkayzk.github.io/2019/12/05/MySQL索引/) |  2019-12-05  | **索引的管理<br /><br />B+ 树索引的使用<br /><br />索引的特点、优点、缺点及适用场景** |

<br/>

## Java Web部分

Java Web包括的知识主要有:

-   HTML + CSS + DIV
-   JavaScript
-   Ajax
-   JSP + Servlet + Tomcat
-   Strut2 + Hibernate(or JPA)Spring
-   Web Service

这里包括一些~~不经常使用~~(已经淘汰)的框架, 主流框架见框架部分

|                           文章索引                           | 文章发布日期 | 文章主要内容                                                 |
| :----------------------------------------------------------: | :----------: | :----------------------------------------------------------- |
| [JavaWeb总结之一](https://jasonkayzk.github.io/2019/11/25/JavaWeb总结之一/) |  2019-11-25  | **1. Tomcat的优化<br /><br />2. HTTP请求的GET与POST方式的区别<br /><br />3. 什么是Servlet?Servlet的生命周期?<br /><br />4. Servlet的基本架构<br /><br />5. 两种跳转方式分别是什么?Servlet API中forward()与redirect()的区别？<br /><br />6. Request对象的主要方法<br /><br />7. request.getAttribute()和 request.getParameter()有何区别?<br /><br />8. jsp有哪些内置对象?作用分别是什么?分别有什么方法？<br /><br />9. JSP中动态INCLUDE与静态INCLUDE的区别？** |
|                                                              |              |                                                              |

<br/>

## 框架部分

待更新, 敬请期待…

| 文章索引 | 文章发布日期 | 文章主要内容 |
| :------: | :----------: | ------------ |
|          |              |              |

<br/>

## JVM调优

待更新, 敬请期待…

| 文章索引 | 文章发布日期 | 文章主要内容 |
| :------: | :----------: | ------------ |
|          |              |              |

<br/>

## JDK源码分析

><br/>
>
>**注: 文章中的源码解析均基于JDK11.0.4**

|                           文章索引                           | 文章发布日期 | 文章主要内容                                                 |
| :----------------------------------------------------------: | :----------: | :----------------------------------------------------------- |
| [为什么在Java中String被设计为不可变](https://jasonkayzk.github.io/2019/10/01/%E4%B8%BA%E4%BB%80%E4%B9%88%E5%9C%A8Java%E4%B8%ADString%E8%A2%AB%E8%AE%BE%E8%AE%A1%E4%B8%BA%E4%B8%8D%E5%8F%AF%E5%8F%98/) |  2019-10-01  | **String源码简单分析<br /><br />JVM内存模型<br /><br />String在JVM中的常量池的解析: 字面量, new, +连接, intern()<br /><br />String中的==和equals<br /><br />什么是Java中的不可变? 不可变的好处与坏处?<br /><br />证明回答String被设计成不可变和不能被继承的原因** |
| [Java集合一-Collection架构](https://jasonkayzk.github.io/2019/11/23/Java集合一-Collection架构/) |  2019-11-23  | **集合总体框架概述<br /><br />Iterator源码分析<br /><br />ListIterator源码分析<br /><br />Collection源码分析<br /><br />List源码分析<br /><br />Set源码分析<br /><br />AbstractCollection源码分析<br /><br />AbstractList源码分析<br /><br />AbstractSet源码分析** |
| [Java集合二-ArrayList](https://jasonkayzk.github.io/2019/11/24/Java集合二-ArrayList/) |  2019-11-24  | **ArrayList数据结构<br /><br />ArrayList源码解析<br /><br />ArrayList遍历方式(完整遍历, 子列表遍历, 并发遍历)<br /><br />toArray()异常** |
| [Java集合四-LinkedList](https://jasonkayzk.github.io/2019/11/26/Java集合四-LinkedList/) |  2019-11-26  | **LinkedList介绍(构造函数, API等)<br /><br />LinkedList数据结构(继承关系等)<br /><br />LinkedList源码解析<br /><br />LinkedList遍历方式(整表遍历, 子列表遍历, 并发遍历)<br /><br />LLSpliterator与ArrayListSpliterator的区别(为什么不推荐使用LLSpliterator)** |
| [Java集合五-Vector](https://jasonkayzk.github.io/2019/11/26/Java集合五-Vector/) |  2019-11-26  | **Vector介绍(构造函数, API等)<br /><br />Vector数据结构(继承关系等)<br /><br />Vector源码解析<br /><br />Vector遍历方式(整表遍历, 子列表遍历, 并发遍历)<br /><br />Vector示例** |
| [Java集合六-Stack](https://jasonkayzk.github.io/2019/11/27/Java集合六-Stack/) |  2019-11-27  | **Stack介绍(构造函数, API等)<br /><br />Stack源码解析(基于JDK11.0.4)<br /><br />Stack示例** |
| [Java集合八-Map架构](https://jasonkayzk.github.io/2019/11/27/Java集合八-Map架构/) |  2019-11-27  | **Map的整体架构<br /><br />Map源码<br /><br />Map.Entry源码<br /><br />AbstractMap源码<br /><br />SortedMap源码<br /><br />NavigableMap源码<br /><br />Dictionary源码** |
| [Java集合九-HashMap存储过程.png](https://jasonkayzk.github.io/2019/11/27/Java集合九-HashMap/) |  2019-11-28  | **HashMap数据结构<br /><br />HashMap源码深度解析<br /><br />HashMap内部转换等总结** |
| [Java集合十-TreeNode与HashMap](https://jasonkayzk.github.io/2019/12/03/Java集合十-TreeNode与HashMap/) |  2019-12-02  | **数据结构Tree的发展史<br /><br />HashMap中TreeNode的源码分析 <br /><br />HashMap中的hash冲突 <br /><br />HashMap中的Rehash操作 <br /><br />HashMap遍历方式(整表遍历, 并发遍历)** |
| [关于JDK8添加的Spliterator的一些理解](https://jasonkayzk.github.io/2019/12/03/关于JDK8添加的Spliterator的一些理解) |  2019-12-03  | **Spliterator源码解读<br/><br />ArrayList中Spliterator的实现<br/><br />LinkedList中Spliterator的实现<br/><br />HashMap(Set)中Spliterator的实现** |

<br/>

## 请我喝Java

如果觉得博主面试内容对你有帮助, 可以对本博主打赏哦!

**Alipay:**

![alipay](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/alipay.jpg)

**WechatPay:**

![wechat](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/wechat.jpg)

<br/>

## 赞助单

|    时间    | 捐助人 | 金额 | 赞助目标 |
| :--------: | :----: | :--: | :------: |
| 2019-11-09 |  林❤   | 5.20 |  张小凯  |



**本人再次向以上对本站赞助的老爷们表示感谢， 你们是最棒的!**<font color="#FF0000">❤</font>

另外也感谢我的女朋友林妈妈, 在学习代码、准备面试期间，都没什么时间陪我们家小可爱。感谢她的包容和支持。<font color="#FF0000">❤</font>

<br/>



