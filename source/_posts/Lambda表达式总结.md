---
title: Lambda表达式总结
toc: true
date: 2019-09-16 14:28:00
cover: http://aliyunzixunbucket.oss-cn-beijing.aliyuncs.com/png/20180111002536155989.png
categories: 学习案例
tags: [Lambda表达式, 函数式接口]
description: Java在JDK 8中发布了Lambda特性, 开始支持函数式编程了. 这篇文章总结了Lambda表达式的基本使用.  
---



Java在JDK 8中发布了Lambda特性, 开始支持函数式编程了! 虽然平时用的不是很多, 但是看别人写出的代码刷刷刷, 几下子几个箭头就搞定了, 感觉就很爽! 尤其是最近做了一个项目, 项目中对于Jedis各种操作的封装出神入化!

<br/>所以就趁着中秋节花时间学习了一下Lambda表达式的基本用法!

<!--more-->

## Lambda表达式

在使用java8之前，我们在处理一些**包含有单个方法的接口**时，一般是通过实现具体类或者匿名类的方式来处理的.

这种方式能实现所期望的功能，而且也是传统的一切皆对象思想的体现。从实现的细节来看，却显得比较繁琐。在引入了lambda表达式这种新特性之后，我们有了一种更加简练的方式来实现对应的功能特性，当然，也带来了一种函数式编程思想上的转变。

先来看一下函数式接口的声明:

### 0. 函数式接口

函数式接口就是<font color="#0000ff">只声明`一个抽象方法`的接口. </font>

在java里，我们经常可以看到不少只包含有一个方法定义的接口，比如`Runnable, Callable, Comparator`等. 而这种仅仅包含有一个接口方法的接口就可以称其为函数式接口. 

需要特别注意的一点就是: <font color="#ff0000">这里指的方法是*接口里定义的抽象方法*. 由于java8里引入了`默认方法(default method)`, 在接口里也可以定义默认方法的实现! 但是这些方法并不算抽象方法!</font>

另外, <font color="#ff0000">如果某个接口定义了一个抽象方法的同时继承了一个包含其他抽象方法的接口，那么该接口就*不是*函数式接口.</font>

<br/>

除此之外，<font color="#0000ff">Java SE 8中增加了一个新的包: `java.util.function`, 它里面包含了常用的函数式接口, </font>

例如： 

-   Predicate<T>——接收T对象并返回boolean
-   Consumer<T>——接收T对象，不返回值
-   Function<T, R>——接收T对象，返回R对象
-   Supplier<T>——提供T对象（例如工厂），不接收值
-   UnaryOperator<T>——接收T对象，返回T对象
-   BinaryOperator<T>——接收两个T对象，返回T对象



#### 1): 函数式接口的声明

<font color="#ff0000">为保证方法的数量有且仅有一个, java 8 使用了专有注解`@FunctionalInterface`. </font>

**例如: 声明一个函数式接口**

```java
package lambda.lesson0.functional;

@FunctionalInterface
public interface FunctionalService {

    void sayHello();
}

```

<font color="#ff0000">当接口声明的抽象方法多于或者少于一个时编译都会报错!</font>

#### 2): 调用函数式接口

```java
package lambda.lesson0.functional;

public class FunctionalDemo {

    public static void main(String[] args) {
        invokeSayHello(() -> System.out.println("Hello"));
    }

    private static void invokeSayHello(FunctionalService service) {
        service.sayHello();
    }

}

```

通过Lambda表达式调用了函数式接口的方法!

<br/>

----------------------



### 1. 目标类型(Target typing)

其实对于<font color="#ff0000">Lambda表达式本质上就是一个对应的函数式接口对象!</font>

#### 1): Lambda类型推断

<font color="#0000ff">一个lambda表达式它本身并没有包含它到底实现哪个函数式接口的信息. 我们怎么知道我们定义的某个lambda表达式可以用到某个函数式接口呢？</font>

<font color="#ff0000">实际上，对于lambda表达式的类型是通过它的*应用上下文*来推导出来的. </font> 

这个过程我们称之为**类型推导(type inference)**. 那么，**在上下文中我们期望获得到的类型则称之为`目标类型`**.

**例如: 下面代码中的lambda表达式类型是ActionListener**

```java
    ActionListener l = (ActionEvent e) -> ui.dazzle(e.getModifiers());  
```

<br/>

但是<font color="#ff0000">同样的lambda表达式在不同的上下文中可以有不同的类型</font>：

```java
    Callable<String> c = () -> "done";  
      
    PrivilegedAction<String> a = () -> "done";  
```

<font color="#0000ff">第一个lambda表达式() -> "done"是Callable的实例; 而第二个lambda表达式则是PrivilegedAction的实例。</font>

<br/>

#### 2): 类型检查详细例子

​     首先，我们这部分应用lambda表达式的代码如下：

```java
    inventory.sort((Apple a1, Apple a2) -> a1.getWeight().compareTo(a2.getWeight()));  
```

-   我们首先<font color="#0000ff">检查`inventory.sort方法`的签名</font>，它的详细签名如下：

    `void sort(Comparator<? super E> c)`

-   那么它<font color="#0000ff">期待的参数类型是Comparator<Apple>;</font>

-   对于Comparator接口，它是一个函数式接口，并有定义的抽象方法compare;

-   compare方法的详细签名如下：

    `int compare(Apple o1, Apple o2)`, 这表示这个方法<font color="#0000ff">期待两个类型为Apple的输入参数，并返回一个整型的结果</font>

-   <font color="#ff0000">比对lambda表达式的函数签名类型，它也是两个输入类型为Apple，并且输出为int类型;</font>

这样，lambda表达式的目标类型和我们的类型匹配了!

<br/>

#### 3): 类型推断总结:

总结起来，**当且仅当下面所有条件均满足时，lambda表达式才可以被赋给目标类型T**：

-   <font color="#ff0000">T是一个函数式接口</font>
-   <font color="#ff0000">lambda表达式的参数和T的方法参数在数量和类型上一一对应</font>
-   <font color="#ff0000">lambda表达式的返回值和T的方法返回值相兼容（Compatible）</font>
-   <font color="#ff0000">lambda表达式内所抛出的异常和T的方法throws类型相兼容</font>

<br/>

<font color="#ff0000">由于目标类型（函数式接口）已经"知道"lambda表达式的形式参数（Formal parameter）类型，所以我们没有必要把已知类型再重复一遍. </font>

也就是说，lambda表达式的参数类型可以从目标类型中得出：

```java
    Comparator<Apple> comp = (a1, a2) -> a1.getWeight().compareTo(a2.getWeight());  
```

在上面的例子里, <font color="#0000ff">编译器可以推导出a1和a2的类型是Apple。所以它就在lambda表达式里省略了a1, a2的类型声明。这样可以使得我们的代码更加简练.</font>

<br/>

---------------------------------



### 2. Hello Lambda

上面简单介绍了Lambda表达式的本质以及简化代码的原理. 下面给出一个例子来详细介绍Lambda表达式:

**假设一个情景: 找出满足条件Hero**

Hero类:

```java
package lambda.pojo;

public class Hero implements Comparable<Hero>{

    public String name;
    public float hp;
    public int damage;

    public Hero(){

    }

    public Hero(String name) {
        this.name =name;

    }

    public Hero(String name,float hp, int damage) {
        this.name =name;
        this.hp = hp;
        this.damage = damage;
    }

    @Override
    public int compareTo(Hero anotherHero) {
        if(damage<anotherHero.damage)
            return 1;
        else
            return -1;
    }

    @Override
    public String toString() {
        return "Hero [name=" + name + ", hp=" + hp + ", damage=" + damage + "]\r\n";
    }

}
```



给定一组heroes, 从中找出所有满足条件: `hp>100 && damage<50`的数据!

<br/>

#### 1): 使用普通方法

```java
package lambda.lesson2.helloLambda.normal;

import lambda.pojo.Hero;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class NormalFind {

    public static void main(String[] args) {
        Random random = new Random();
        List<Hero> heroes = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            heroes.add(new Hero("Hero " + i, random.nextInt(1000), random.nextInt(100)));
        }
        System.out.println("初始化后的集合: ");
        System.out.println(heroes);

        System.out.println("筛选出 hp>100 && damange<50的英雄");
        filter(heroes);
    }

    private static void filter(List<Hero> heroes) {
        for (Hero hero : heroes) {
            if (hero.hp > 100 && hero.damage < 50) {
                System.out.println(hero);
            }
        }
    }
}

```

<font color="#0000ff">创建了一个`filter方法`, 通过调用此方法对列表进行过滤查找!</font>

<br/>

#### 2): 使用匿名内部类

首先准备一个接口HeroChecker, 提供test方法: 

```java
package lambda.service;

import lambda.pojo.Hero;

public interface HeroChecker {

    boolean test(Hero hero);
}

```

<br/>

然后通过匿名内部类实现该接口, 然后调用filter方法, 传递checker去判断!

```java
package lambda.lesson2.helloLambda.interfaceMethod;

import lambda.pojo.Hero;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class InterfaceFind {

    public static void main(String[] args) {
        Random r = new Random();
        List<Hero> heros = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            heros.add(new Hero("hero " + i, r.nextInt(1000), r.nextInt(100)));
        }
        System.out.println("初始化后的集合：");
        System.out.println(heros);
        System.out.println("使用匿名类的方式，筛选出 hp>100 && damange<50的英雄");

        filter(heros, new HeroChecker() {
            @Override
            public boolean test(Hero hero) {
                return (hero.hp > 100 && hero.damage < 50);
            }
        });
    }

    private static void filter(List<Hero> heros, HeroChecker heroChecker) {
        for (Hero hero : heros) {
            if (heroChecker.test(hero)) {
                System.out.println(hero);
            }
        }
    }


}

```

<br/>

#### 3): 使用Lambda表达式

通过Lambda表达式构造匿名内部类:

```java
filter(heros, h -> h.hp > 100 && h.damage < 50);
```

同样是调用filter方法, 但是传递一个Lambda表达式显然更加方便!

```java
package lambda.lesson2.helloLambda.lambda;

import lambda.pojo.Hero;
import lambda.service.HeroChecker;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class LambdaFind {

    public static void main(String[] args) {
        Random r = new Random();
        List<Hero> heros = new ArrayList<Hero>();
        for (int i = 0; i < 5; i++) {
            heros.add(new Hero("hero " + i, r.nextInt(1000), r.nextInt(100)));
        }
        System.out.println("初始化后的集合：");
        System.out.println(heros);

        System.out.println("使用Lamdba的方式，筛选出 hp>100 && damange<50的英雄");
        filter(heros, h -> h.hp > 100 && h.damage < 50);

    }

    private static void filter(List<Hero> heroes, HeroChecker checker) {
        for (Hero hero : heroes) {
            if (checker.test(hero)) {
                System.out.println(hero);
            }
        }
    }
}

```

<br/>

#### 4): 从匿名内部类演变为Lambda表达式

Lambda表达式可以看成是匿名类一点点演变过来

-   匿名类的正常写法 

```java
HeroChecker c1 = new HeroChecker() {
	@Override
    public boolean test(Hero h) {
        return (h.hp>100 && h.damage<50);
    }
};
```



-   <font color="#ff0000">把外面的壳子去掉, 只保留只保留方法参数和方法体, 参数和方法体之间加上符号 -></font>

```java 
HeroChecker c2 = (Hero h) -> {
    return  h.hp>100 && h.damage<50;
}
```



-   <font color="#ff0000">把return和{}去掉</font>

 ```java
HeroChecker c3 = (Hero h) ->h.hp>100 && h.damage<50;
 ```



-   把参数类型和圆括号去掉**(只有一个参数的时候，才可以去掉圆括号)**

```java 
HeroChecker c4 = h -> h.hp > 100 &&  h.damage < 50;
```

 

-   直接把表达式传递进去

```java 
filter(heros, h -> h.hp > 100 && h.damage < 50);
```

**注: 以上所有的Lambda表达式均是合法的!!!**

<br/>

```java
package lambda.lesson2.helloLambda.generateLambda;

import lambda.pojo.Hero;
import lambda.service.HeroChecker;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class GenerateLambdaDemo {

    public static void main(String[] args) {
        Random r = new Random();
        List<Hero> heros = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            heros.add(new Hero("hero " + i, r.nextInt(1000), r.nextInt(100)));
        }
        System.out.println("初始化后的集合：");
        System.out.println(heros);
        System.out.println("使用匿名类的方式，筛选出 hp>100 && damange<50的英雄");

        // 1. 匿名内部类正常写法
        HeroChecker c1 = new HeroChecker() {
            @Override
            public boolean test(Hero h) {
                return (h.hp > 100 && h.damage < 50);
            }
        };

        // 2. 把new HeroChcekcer，方法名，方法返回类型信息去掉
        // 只保留方法参数和方法体
        // 参数和方法体之间加上符号 ->
        HeroChecker c2 = (Hero h) -> {
            return (h.hp > 100 && h.damage < 50);
        };

        // 3. 把return和{}去掉
        HeroChecker c3 = (Hero h) -> h.hp > 100 && h.damage < 50;

        // 4. 把参数类型和圆括号去掉
        HeroChecker c4 = h -> h.hp > 100 && h.damage < 50;

        // 直接把表达式传递进去
        filter(heros, h -> h.hp > 100 && h.damage < 50);
    }

    private static void filter(List<Hero> heroes, HeroChecker checker) {
        for (Hero hero : heroes) {
            if (checker.test(hero)) {
                System.out.println(hero);
            }
        }
    }
}

```

<br/>

#### 5): 匿名方法

与匿名类的概念类似: <font color="#0000ff">匿名方法把方法作为参数. </font>

虽然代码是这么写:

 ```java
filter(heros, h -> h.hp > 100 && h.damage < 50);
 ```

但是，<font color="#ff0000">Java会在背后，悄悄的，把这些都还原成匿名类方式.</font> 

引入Lambda表达式，会使得代码更加紧凑，而不是各种接口和匿名类到处飞.

<br/>

#### 6): Lambda的弊端

Lambda表达式虽然带来了代码的简洁，但是也有其局限性:

-   <font color="#0000ff">可读性差，与啰嗦的但是清晰的匿名类代码结构比较起来，Lambda表达式一旦变得比较长，就*难以理解*;</font>
-   <font color="#0000ff">不便于调试，很难在Lambda表达式中增加调试信息，比如日志</font>
-   版本支持，Lambda表达式在JDK8版本中才开始支持，如果系统使用的是以前的版本，考虑系统的稳定性等原因，而不愿意升级，那么就无法使用;

Lambda比较**适合用在简短的业务代码中, 如: Redis命令. 而并不适合用在复杂的系统中，会加大维护成本**					

<br/>

--------------------



### 3. Lambda 方法引用

#### 1): 引用静态方法

首先添加一个静态方法:

```java
public static boolean testHero(Hero h) {
   return h.hp>100 && h.damage<50;
}
```

此时在Lambda表达式中调用这个静态方法:

```java
filter(heros, h -> TestLambda.testHero(h) );
```

调用静态方法:

```java
filter(heros, TestLambda::testHero);
```

即: **引用静态方法**

```java
package lambda.lesson3.methodReferece.staticMethod;

import lambda.pojo.Hero;
import lambda.service.HeroChecker;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class StaticMethodDemo {

    public static void main(String[] args) {
        Random r = new Random();
        List<Hero> heros = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            heros.add(new Hero("hero " + i, r.nextInt(1000), r.nextInt(100)));
        }
        System.out.println("初始化后的集合：");
        System.out.println(heros);

        System.out.println("在Lambda表达式中使用静态方法");
        filter(heros, h -> h.hp>100 && h.damage<50);

        System.out.println("直接引用静态方法");
        filter(heros, StaticMethodDemo::testHero);
    }

    public static boolean testHero(Hero h) {
        return h.hp>100 && h.damage<50;
    }

    public static void filter(List<Hero> heroes, HeroChecker checker) {
        for (Hero hero : heroes) {
            if (checker.test(hero)) {
                System.out.println(hero);
            }
        }
    }

}

```

<br/>



#### 2): 引用对象方法

<font color="#0000ff">与引用静态方法很类似，只是传递方法的时候，*需要一个对象的存在*.</font>

```java
TestLambda testLambda = new TestLambda();
filter(heros, testLambda::testHero);
```

即: **引用对象方法**

```java
package lambda.lesson3.methodReferece.memberMethod;

import lambda.pojo.Hero;
import lambda.service.HeroChecker;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class MemberMethodDemo {

    public static void main(String[] args) {
        Random r = new Random();
        List<Hero> heros = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            heros.add(new Hero("hero " + i, r.nextInt(1000), r.nextInt(100)));
        }
        System.out.println("初始化后的集合：");
        System.out.println(heros);

        System.out.println("使用引用对象方法  的过滤结果：");
        MemberMethodDemo test = new MemberMethodDemo();
        filter(heros, test::testHero);
    }

    private boolean testHero(Hero h) {
        return h.hp>100 && h.damage<50;
    }

    private static void filter(List<Hero> heroes, HeroChecker checker) {
        for (Hero hero : heroes) {
            if (checker.test(hero))
                System.out.print(hero);
        }
    }

}

```



<br/>



#### 3): 引用容器中的对象方法

首先为`JavaBean`对象Hero添加一个方法

```java
public boolean matched(){
   return this.hp>100 && this.damage<50;
}
```

使用Lambda表达式

```java
filter(heros,h-> h.hp>100 && h.damage<50 );
```

在Lambda表达式中调用容器中的对象Hero的方法matched

```java
filter(heros,h-> h.matched() );
```

matched恰好就是容器中的对象Hero的方法，那就可以进一步改写为: 

```java
filter(heros, Hero::matched);
```

**注意到:**

-   <font color="#ff0000">matched()是成员方法;</font>
-   <font color="#ff0000">Hero::matched()是通过类名引用的</font>

<br/>



#### 4): 引用构造器

<font color="#0000ff">有的接口中的方法会返回一个对象，比如`java.util.function.Supplier`提供了一个get方法，返回一个对象!</font>

```java
public interface Supplier<T> {
    T get();
}
```

设计一个方法，参数是这个接口

```java
public static List getList(Supplier<List> s){
  return s.get();
}
```

为了调用这个方法，有3种方式:

-   **第一种: 匿名类**

```java
Supplier<List> s = new Supplier<List>() {
	public List get() {
		return new ArrayList();
	}
};
List list1 = getList(s);
```

<br/>

-   第二种：Lambda表达式

```java
List list2 = getList(()->new ArrayList());
```

<br/>

-   第三种：引用构造器

```java
List list3 = getList(ArrayList::new);
```

<br/>

```java
package lambda.lesson3.methodReferece.constructor;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

public class ConstructorLambdaDemo {

    public static void main(String[] args) {
        // 1. 匿名内部类
        List list1 = getList(new Supplier<List>() {
            @Override
            public List get() {
                return new ArrayList();
            }
        });

        // 2. Lambda表达式
        List list2 = getList(() -> new ArrayList());

        // 3. 引用构造器
        List list3 = getList(ArrayList::new);

        System.out.println(list1 == list2);
        System.out.println(list2 == list3);
    }

    public static List getList(Supplier<List> s) {
        return s.get();
    }

}

```

<font color="#ff0000">用三种不同的方法创建了容器, 通过比较发现三种方法均能创建容器, 且每个都不相同!</font>

输出为:

```
false
false
```

<br/>



#### 5): 方法引用小结

<font color="#0000ff">有的情况下，我们已经有一些方法实现同样的功能了，那么我们可以重用这些原有的功能而不至于自己去重复实现, 这时候使用Lambda引用即可!</font>

方法引用有很多种，它们的语法如下：

-   静态方法引用：ClassName::methodName
-   实例上的实例方法引用：instanceReference::methodName
-   超类上的实例方法引用：super::methodName
-   类型上的实例方法引用：ClassName::methodName
-   构造方法引用：Class::new
-   数组构造方法引用：TypeName[]::new

<font color="#ff0000">对于静态方法引用，我们需要在类名和方法名之间加入::分隔符，例如Integer::sum;</font>

<font color="#ff0000">对于具体对象上的实例方法引用，我们则需要在对象名和方法名之间加入分隔符</font>

<br/>

------------------------------



### 4. Lambda 聚合操作

#### 1): 传统方法与聚合操作方法遍历数据

遍历数据的传统方式就是使用for循环，然后条件判断，最后打印出满足条件的数据:

```java
for (Hero h : heros) {
   if (h.hp > 100 && h.damage < 50)
      System.out.println(h.name);
}
```

使用聚合操作方式，画风就发生了变化：

```java
heros
	.stream()
	.filter(h -> h.hp > 100 && h.damage < 50)
	.forEach(h -> System.out.println(h.name));
```

源代码:

```java
package lambda.lesson4.polymerization;

import lambda.pojo.Hero;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class TraverseDemo {

    public static void main(String[] args) {
        Random r = new Random();
        List<Hero> heros = new ArrayList<Hero>();
        for (int i = 0; i < 5; i++) {
            heros.add(new Hero("hero " + i, r.nextInt(1000), r.nextInt(100)));
        }
        System.out.println("初始化后的集合：");
        System.out.println(heros);

        System.out.println("查询条件：hp>100 && damage<50");
        System.out.println("通过传统操作方式找出满足条件的数据：");
        for(Hero hero : heros) {
            if (hero.hp > 100 && hero.damage < 50) {
                System.out.println(hero.name);
            }
        }

        System.out.println("通过聚合操作方式找出满足条件的数据：");
        heros
                .stream()
                .filter(h -> h.hp > 100 && h.damage < 50)
                .forEach(h -> System.out.println(h.name));


    }

}

```

<br/>



#### 2): Stream和管道的概念

要了解聚合操作，首先要建立Stream和管道的概念: 

-   <font color="#ff0000">Stream 和Collection结构化的数据不一样: Stream是一系列的元素，就像是生产线上的罐头一样，一串串的出来;</font>
-   <font color="#ff0000">管道指的是*一系列的聚合操作*;</font>

管道又分**3个部分**

-   **管道源**：在这个例子里，源是一个List
-   **中间操作**： <font color="#0000ff">每个中间操作，*又会返回一个Stream*，比如.filter()又返回一个Stream, 中间操作是“懒”操作，并`不会真正进行遍历`</font>;
-   **结束操作**：<font color="#ff0000">当这个操作执行后，流就被使用"光"了，无法再被操作! 所以这`必定是流的最后一个操作`.  结束操作不会返回Stream，但是会返回int、float、String、 Collection或者像forEach，什么都不返回,  结束操作才进行真正的遍历行为，在遍历的时候，才会去进行中间操作的相关判断</font>

**注**： <font color="#0000ff">这个Stream和I/O章节的InputStream,OutputStream是不一样的概念!</font>	

<br/>

#### 3): 管道源

##### 把Collection切换成管道源:

很简单，调用stream()就行了:

```java
heros.stream()
```

<br/>

##### 数组切换为管道源

<font color="#ff0000">数组却没有stream()方法，需要使用工具类的静态方法</font>

```java
Arrays.stream(hs)
```

或者

```java
Stream.of(hs)
```

如:

```java
package lambda.lesson4.polymerization;

import lambda.pojo.Hero;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

public class ArrayToPipeSource {

    public static void main(String[] args) {
        /* 管道源是集合 */
        Random r = new Random();
        List<Hero> heros = new ArrayList<Hero>();
        for (int i = 0; i < 5; i++) {
            heros.add(new Hero("hero " + i, r.nextInt(1000), r.nextInt(100)));
        }

        heros
                .stream()
                .forEach(h -> System.out.println(h.name));

        Hero hs[] = heros.toArray(new Hero[heros.size()]);
        Arrays.stream(hs)
                .forEach(h -> System.out.println(h.name));

    }
}

```

<br/>



#### 4): 中间操作

<font color="#0000ff">每个中间操作，又会返回一个Stream，比如.filter()又返回一个Stream, 中间操作是“懒”操作，并不会真正进行遍历;</font>

中间操作比较多，主要分两类: <font color="#00ff00">对元素进行筛选 和 转换为其他形式的流</font>

对元素进行筛选：

-   filter 匹配
-   distinct 去除重复(根据equals判断)
-   sorted 自然排序
-   sorted(Comparator<T>) 指定排序
-   limit 保留
-   skip 忽略

<br/>

转换为其他形式的流

-   mapToDouble 转换为double的流
-   map  转换为任意类型的流

<br/>

**例如: **

```java
package lambda.lesson4.polymerization.middle;

import lambda.pojo.Hero;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class MiddleOptDemo {

    public static void main(String[] args) {
        Random r = new Random();
        List<Hero> heros = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            heros.add(new Hero("hero " + i, r.nextInt(1000), r.nextInt(100)));
        }
        //制造一个重复数据
        heros.add(heros.get(0));
        System.out.println("初始化集合后的数据 (最后一个数据重复)：");
        System.out.println(heros);

        System.out.println("满足条件hp>100&&damage<50的数据");
        heros
                .stream()
                .filter(h -> h.hp > 100 && h.damage < 50)
                .forEach(h -> System.out.println(h));

        System.out.println("去除重复的数据，去除标准是看equals");
        heros
                .stream()
                .distinct()
                .forEach(h -> System.out.println(h));

        System.out.println("按照血量排序");
        heros
                .stream()
                .sorted((h1, h2) -> h1.hp - h2.hp >= 0 ? 1 : -1)
                .forEach(hero -> System.out.println(hero));

        System.out.println("保留3个");
        heros
                .stream()
                .limit(3)
                .forEach(h -> System.out.println(h));

        System.out.println("忽略前三个");
        heros
                .stream()
                .skip(3)
                .forEach(h -> System.out.println(h));

        System.out.println("转为double的Stream");
        heros
                .stream()
                .mapToDouble(Hero::getHp)
                .forEach(h -> System.out.println(h));

        System.out.println("转为任意类型的Stream");
        heros
                .stream()
                .map((h) -> h.name + " - " + h.hp + " - " + h.damage)
                .forEach(h -> System.out.println(h));

    }
}

```

<br/>



#### 5): 结束操作

<font color="#ff0000">当进行结束操作后，流就被使用“光”了，无法再被操作; 所以这*必定是流的最后一个操作*;  </font>

<font color="#ff0000">结束操作不会返回Stream，但是会返回int、float、String、 Collection或者像forEach，什么都不返回; 结束操作才真正进行遍历行为，前面的中间操作也在这个时候，才真正的执行;</font>

**常见结束操作如下**：

-   forEach() 遍历每个元素
-   toArray() 转换为数组
-   min(Comparator<T>) 取最小的元素
-   max(Comparator<T>) 取最大的元素
-   count() 总数
-   findFirst() 第一个元素

<br/>

**例如:  **

```java
package lambda.lesson4.polymerization.end;

import lambda.pojo.Hero;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

public class EndingOptDemo {

    public static void main(String[] args) {
        Random r = new Random();
        List<Hero> heros = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            heros.add(new Hero("hero " + i, r.nextInt(1000), r.nextInt(100)));
        }

        System.out.println("遍历集合中的每个数据");
        heros.stream()
                .forEach(h -> System.out.println(h));

        System.out.println("返回一个数组");
        Object[] bs = heros.stream().toArray();
        System.out.println(Arrays.toString(bs));

        System.out.println("返回伤害最高的那个英雄");
        Hero min = heros.stream()
                .max((h1, h2) -> h1.damage - h2.damage)
                .get();
        System.out.println(min);

        System.out.println("返回伤害最低的那个英雄");
        Hero max = heros.stream()
                .min((h1, h2) -> h1.damage - h2.damage)
                .get();
        System.out.println(max);

        System.out.println("流中数据的总数");
        long count = heros.stream()
                .count();
        System.out.println(count);

        System.out.println("第一个英雄");
        Hero first = heros.stream()
                .findFirst()
                .get();
        System.out.println(first);

    }
}

```



<br/>

-------------------------

### 5. 十个经典的Lambda表达式例子

#### 1): 用Lambda实现Runnable

使用lambda表达式替换匿名类，而实现Runnable接口是匿名类的最好示例。看一下Java 8之前的runnable实现方法，需要4行代码，而使用lambda表达式只需要一行代码:

```java
package lambda.lesson5.examples.example1;

public class RunnableDemo {

    public static void main(String[] args) {

        new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("Before Java8, too much code for too little to do");
            }
        }).start();

        new Thread(() -> System.out.println("In Java8, Lambda expression rocks !!")).start();
    }
}

```

<br/>



#### 2): 使用Java 8 lambda表达式进行事件处理

如果你用过Swing API编程，你就会记得怎样写事件监听代码。这又是一个旧版本简单匿名类的经典用例，但现在可以不这样了。你可以用lambda表达式写出更好的事件监听代码:

```java
package lambda.lesson5.examples.example2;

import javax.swing.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

public class ListenerDemo {

    public static void main(String[] args) {
        JButton button1 = new JButton();
        button1.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent actionEvent) {
                System.out.println("Event handling without lambda expression is boring");
            }
        });

        JButton button2 = new JButton();
        button2.addActionListener(e -> System.out.println("Light, Camera, Action !! Lambda expressions Rocks"));

    }
}

```



<br/>

#### 3): 使用lambda表达式对列表进行迭代

由于Java是命令式语言，Java 8之前的所有循环代码都是顺序的，即可以对其元素进行并行化处理! 如果你想做并行过滤，就需要自己写代码，这并不是那么容易! 

通过引入lambda表达式和默认方法，将做什么和怎么做的问题分开了，这意味着Java集合现在知道怎样做迭代，并可以在API层面对集合元素进行并行处理!

下面的例子里，我将介绍如何在[使用](http://javarevisited.blogspot.sg/2012/03/how-to-loop-arraylist-in-java-code.html)[lambda](http://javarevisited.blogspot.sg/2012/03/how-to-loop-arraylist-in-java-code.html)或不使用lambda表达式的情况下迭代列表。你可以看到列表现在有了一个 forEach()  方法，它可以迭代所有对象，并将你的lambda代码应用在其中:

```java
package lambda.lesson5.examples.example3;

import java.util.Arrays;
import java.util.List;

public class TraverseDemo {

    public static void main(String[] args) {
        List<String> features = Arrays.asList("Lambdas", "Default Method", "Stream API", "Date and Time API");
        for (String feature : features) {
            System.out.println(feature);
        }

        features.stream().forEach(n -> System.out.println(n));

        // 使用Java 8的方法引用更方便，方法引用由::双冒号操作符标示，
        // 看起来像C++的作用域解析运算符
        features.stream().forEach(System.out::println);
    }
}

```



<br/>

#### 4): 使用lambda表达式和函数式接口Predicate

除了在语言层面支持函数式编程风格，Java 8也添加了一个包，叫做``java.util.function`。它包含了很多类，用来支持Java的函数式编程。

<font color="#ff0000">其中一个便是Predicate，使用`java.util.function.Predicate`函数式接口以及lambda表达式，可以向API方法添加逻辑，用更少的代码支持更多的动态行为!</font>

下面是Java 8 Predicate 的例子，展示了过滤集合数据的多种常用方法。Predicate接口非常适用于做过滤!

```java
package lambda.lesson5.examples.example4;

import java.util.Arrays;
import java.util.List;
import java.util.function.Predicate;

public class PredicateDemo {

    public static void main(String[] args) {
        List<String> languages = Arrays.asList("Java", "Scala", "C++", "Haskell", "Lisp");

        System.out.println("Languages which starts with J :");
        filter(languages, s -> s.startsWith("J"));

        System.out.println("Languages which ends with a ");
        filter(languages, s -> s.endsWith("a"));

        System.out.println("Print all languages :");
        filter(languages, s -> true);

        System.out.println("Print no language : ");
        filter(languages, s -> false);

        System.out.println("Print language whose length greater than 4:");
        filter(languages, s -> s.length() > 4);
    }

    public static void filter(List<String> names, Predicate<String> predicate) {
        names.stream()
                .filter(name -> predicate.test(name))
                .forEach(System.out::println);
    }
}

```



<br/>

#### 5): 如何在lambda表达式中加入Predicate

<font color="#ff0000">java.util.function.Predicate 允许将两个或更多的 Predicate 合成一个. 它提供类似于逻辑操作符AND和OR的方法，名字叫做and()、or()和xor()，用于将传入 filter() 方法的条件合并起来.</font>

例如，要得到所有以J开始，长度为四个字母的语言，可以定义两个独立的 Predicate 示例分别表示每一个条件，然后用`Predicate.and()` 方法将它们合并起来，如下所示：

```java
package lambda.lesson5.examples.example5;

import java.util.Arrays;
import java.util.List;
import java.util.function.Predicate;

public class MultiPredicate {

    public static void main(String[] args) {
        List<String> languages = Arrays.asList("Java", "Scala", "C++", "Haskell", "Lisp");

        Predicate<String> startWithJ = n -> n.startsWith("J");
        Predicate<String> fourLetterLonger = n -> n.length() >= 4;

        languages.stream()
                .filter(startWithJ.and(fourLetterLonger))
                .forEach(System.out::println);
    }
}

```

类似地，也可以使用 or() 和 xor() 方法.



<br/>

#### 6): Java 8中使用lambda表达式的Map和Reduce示例

本例介绍**最广为人知的函数式编程概念map: 它允许你将对象进行转换!**

例如在本例中，我们将 `costBeforeTax`  列表的每个元素转换成为税后的值:

-   我们将 `x -> x*x lambda`表达式传到 map() 方法，后者将其应用到流中的每一个元素, 然后用  forEach() 将列表元素打印出来; 
-   使用流API的收集器类，可以得到所有含税的开销; 
-   有 toList() 这样的方法将 map  或任何其他操作的结果合并起来;

由于收集器在流上做终端操作，因此之后便不能重用流了! 你甚至可以用流API的 reduce()  方法将所有数字合成一个，下一个例子将会讲到。

```java
package lambda.lesson5.examples.example6;

import java.util.Arrays;
import java.util.List;

public class LambdaMap {

    public static void main(String[] args) {
        // 使用lambda表达式为每个订单加上12%的税
        List<Integer>  costBeforeTax = Arrays.asList(100, 200, 300, 400, 500);
        costBeforeTax.stream()
                .map(cost -> cost + 0.12 * cost)
                .forEach(System.out::println);

    }

}

```



<br/>

#### 6.2): Java 8中使用lambda表达式的Map和Reduce示例

在上个例子中，可以看到map将集合类（例如列表）元素进行转换. 

还有一个 **reduce() 函数可以将所有值合并成一个! **

Map和Reduce操作是函数式编程的核心操作，因为其功能，<font color="#00ff00">reduce 又被称为折叠操作.</font> 另外，reduce 并不是一个新的操作，你有可能已经在使用它: *SQL中类似 sum()、avg() 或者 count() 的聚集函数，实际上就是 reduce 操作，因为它们接收多个值并返回一个值;*

<font color="#0000ff">流API定义的 reduceh() 函数可以接受lambda表达式，并对所有值进行合并, IntStream这样的类有类似 average()、count()、sum() 的内建方法来做 reduce 操作，也有mapToLong()、mapToDouble() 方法来做转换;</font>

这并不会限制你，你可以用内建方法，也可以自己定义, 在这个Java 8的Map Reduce示例里，我们首先对所有价格应用 12% 的VAT，然后用 reduce() 方法计算总和。

```java
        List<Integer> costBeforeTax = Arrays.asList(100, 200, 300, 400, 500);
        double bill = costBeforeTax.stream()
                .map(cost -> cost + 0.12 * cost)
                .reduce((sum, cost) -> sum + cost)
                .get();
        System.out.println("Total: " + bill);
```



<br/>

#### 7): 通过过滤创建一个String列表

过滤是Java开发者在大规模集合上的一个常用操作，而现在使用lambda表达式和流API过滤大规模数据集合是惊人的简单;

<font color="#0000ff">流提供了一个 filter() 方法，接受一个 Predicate 对象，即可以传入一个lambda表达式作为过滤逻辑;</font>

下面的例子是用lambda表达式过滤Java集合，将帮助理解:

```java
package lambda.lesson5.examples.example7;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class FilterDemo {

    public static void main(String[] args) {
        List<String> strList = Arrays.asList(new String[] {
                "abc", "bcd", "", "defg", "jk"
        });

        List<String> filtered = strList.stream()
                .filter(x -> x.length() > 2)
                .collect(Collectors.toList());
        System.out.printf("Original List : %s, filtered list : %s %n", strList, filtered);

    }
}

```



<br/>

#### 8): 对列表的每个元素应用函数

<font color="#ff0000">我们通常需要对列表的每个元素使用某个函数，例如逐一乘以某个数、除以某个数或者做其它操作。这些操作都很适合用 map() 方法，可以将转换逻辑以lambda表达式的形式放在 map() 方法里，就可以对集合的各个元素进行转换了，</font>

如下所示:

```java
package lambda.lesson5.examples.example8;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class InvokeMethodDemo {

    public static void main(String[] args) {
        List<String> G7 = Arrays.asList("USA", "Japan", "France", "Germany", "Italy", "U.K.","Canada");
        String G7Countries = G7.stream()
                .map(x -> x.toUpperCase())
                .collect(Collectors.joining(","));
        System.out.println(G7Countries);
    }
}


```

输出为:

```
USA,JAPAN,FRANCE,GERMANY,ITALY,U.K.,CANADA
```



</br>

#### 9): 复制不同的值，创建一个子列表

<font color="#0000ff">利用流的 distinct() 方法来对集合进行去重:</font>

```java
package lambda.lesson5.examples.example9;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class DistinctDemo {

    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(9, 10, 3, 4, 7, 3, 4);

        List<Integer> distinct = numbers.stream()
                .map(i -> i*i)
                .distinct()
                .collect(Collectors.toList());
        System.out.printf("Original List : %s,  Square Without duplicates : %s %n", numbers, distinct);
    }
}

```

输出为:

```
Original List : [9, 10, 3, 4, 7, 3, 4],  Square Without duplicates : [81, 100, 9, 16, 49]
```



<br/>

#### 10:): 计算集合元素的最大值、最小值、总和以及平均值

<font color="#ff0000">IntStream、LongStream 和 DoubleStream 等流的类中，有个非常有用的方法叫做 
`summaryStatistics() `. 可以返回 IntSummaryStatistics、LongSummaryStatistics 或者 DoubleSummaryStatistic s，描述流中元素的各种摘要数据. </font>

在本例中，我们用这个方法来计算列表的最大值和最小值. 它也有getSum() 和 getAverage() 方法来获得列表的所有元素的总和及平均值.

```java
package lambda.lesson5.examples.example10;

import java.util.Arrays;
import java.util.IntSummaryStatistics;
import java.util.List;

public class MaxMinAveSumDemo {

    public static void main(String[] args) {
        List<Integer> primes = Arrays.asList(2, 3, 5, 7, 11, 13, 17, 19, 23, 29);
        IntSummaryStatistics statistics = primes.stream()
                .mapToInt(x -> x).summaryStatistics();
        System.out.println("Highest prime number in List : " + statistics.getMax());
        System.out.println("Lowest prime number in List : " + statistics.getMin());
        System.out.println("Sum of all prime numbers : " + statistics.getSum());
        System.out.println("Average of all prime numbers : " + statistics.getAverage());
    }
}

```

输出如下:

```
Highest prime number in List : 29
Lowest prime number in List : 2
Sum of all prime numbers : 129
Average of all prime numbers : 12.9
```



<br/>

-------------------------



### 6. Lambda表达式 vs 匿名类

既然lambda表达式即将正式取代Java代码中的匿名内部类，那么有必要对二者做一个比较分析:

-   一个关键的不同点就是关键字 this:

    <font color="#ff0000">匿名类的 this 关键字指向匿名类，而lambda表达式的 this 关键字指向包围lambda表达式的类;</font>

-   另一个不同点是二者的编译方式:

    <font color="#ff0000">Java编译器将lambda表达式编译成类的私有方法。使用了Java 7的 `invokedynamic` 字节码指令来动态绑定这个方法!</font>



<br/>

--------------------------



### 总结

-   <font color="#ff0000">1. lambda表达式仅能放入如下代码：</font>
    -   <font color="#0000ff">预定义使用了 @Functional  注释的函数式接口; </font>
    -   <font color="#0000ff">自带一个抽象函数的方法;</font>
    -   <font color="#0000ff">或者SAM（Single Abstract Method  单个抽象方法）类型</font>

这些称为lambda表达式的**目标类型**，可以用作返回类型，或lambda目标代码的参数. 

**例如**: 

<font color="#ff0000">若一个方法接收Runnable、Comparable或者  Callable 接口，都有单个抽象方法，可以传入lambda表达式; </font>

<font color="#ff0000">类似的，如果一个方法接受声明于 java.util.function  包内的接口，例如 Predicate、Function、Consumer 或 Supplier，那么可以向其传lambda表达式;</font>

<br/>



-   <font color="#ff0000">2. lambda表达式内可以使用方法引用，仅当*该方法不修改lambda表达式提供的参数*</font>

本例中的lambda表达式可以换为方法引用，因为这仅是一个参数相同的简单方法调用:

```java
list.forEach(n -> System.out.println(n)); 
list.forEach(System.out::println);  // 使用方法引用
```



<font color="#ff0000">然而，若对参数有任何修改，则不能使用方法引用，而需键入完整地lambda表达式!</font>

如下所示：

```java
list.forEach((String s) -> System.out.println("*" + s + "*"));
```

事实上，可以省略这里的lambda参数的类型声明，编译器可以从列表的类属性推测出来;

<br/>



-   <font color="#0000ff">3. lambda内部可以使用静态、非静态和局部变量，这称为lambda内的变量捕获;</font>

<br/>



-   <font color="#0000ff">4. Lambda表达式在Java中又称为*闭包或匿名函数*，所以如果有同事把它叫闭包的时候，不用惊讶;</font>

<br/>



-   5.Lambda方法在编译器内部被翻译成*私有方法*，并派发` invokedynamic `字节码指令来进行调用;

可以使用JDK中的 javap  工具来反编译class文件, 使用 javap -p 或 javap -c -v 命令来看一看lambda表达式生成的字节码.

大致应该长这样：

```java
private static java.lang.Object lambda$0(java.lang.String);
```

<br/>



-   <font color="#ff0000">6. lambda表达式有个限制，那就是只能引用 final 或 final 局部变量，这就是说不能在lambda内部修改定义在域外的变量!</font>

```java
List<Integer> primes = Arrays.asList(new Integer[]{2, 3,5,7});
int factor = 2;
primes.forEach(element -> { factor++; });

Compile time error : "local variables referenced from a lambda expression must be final or effectively final"
```



<font color="#0000ff">但是，只是访问它而不作修改是可以的;</font>

如下所示：

```java
List<Integer> primes = Arrays.asList(new Integer[]{2, 3,5,7});
int factor = 2;
primes.forEach(element -> { System.out.println(factor*element); });
```

输出：

```
4
6
10
14
```

因此，**它看起来更像不可变闭包**，类似于Python。



<br/>

----------------------------



### 附录

文章参考:

-   [java8 lambda表达式学习总结](https://blog.csdn.net/iteye_12150/article/details/82642847)
-   http://how2j.cn/k/lambda/lambda-stream/700.html
-   [Java8 lambda表达式10个示例](https://www.cnblogs.com/coprince/p/8692972.html)



本文章中所有例程代码: https://github.com/JasonkayZK/Java_Samples/tree/master/src/main/java/lambda

