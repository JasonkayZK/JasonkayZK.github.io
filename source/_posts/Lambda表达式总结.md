---
title: Lambda表达式总结
toc: true
date: 2019-09-15 14:28:00
categories: 学习案例
tags: [Lambda表达式, 函数式接口]
description: Java在JDK 8中发布了Lambda特性, 开始支持函数式编程了. 这篇文章总结了Lambda表达式的基本使用. 
---

![Lambda表达式](http://aliyunzixunbucket.oss-cn-beijing.aliyuncs.com/png/20180111002536155989.png)

<br/>

Java在JDK 8中发布了Lambda特性, 开始支持函数式编程了! 虽然平时用的不是很多, 但是看别人写出的代码刷刷刷, 几下子几个箭头就搞定了, 感觉就很爽! 尤其是最近做了一个项目, 

<br/>所以就趁着中秋节花时间学习了一下Lambda表达式的基本用法!

<!--more-->

## Lambda表达式

在使用java8之前，我们在处理一些**包含有单个方法的接口**时，一般是通过实现具体类或者匿名类的方式来处理的.

这种方式能实现所期望的功能，而且也是传统的一切皆对象思想的体现。从实现的细节来看，却显得比较繁琐。在引入了lambda表达式这种新特性之后，我们有了一种更加简练的方式来实现对应的功能特性，当然，也带来了一种函数式编程思想上的转变。

先来看一下函数式接口的声明:

### 0. 函数式接口

函数式接口就是<blue>只声明`一个抽象方法`的接口. </font>

在java里，我们经常可以看到不少只包含有一个方法定义的接口，比如`Runnable, Callable, Comparator`等. 而这种仅仅包含有一个接口方法的接口就可以称其为函数式接口. 

需要特别注意的一点就是: <red>这里指的方法是*接口里定义的抽象方法*. 由于java8里引入了`默认方法(default method)`, 在接口里也可以定义默认方法的实现! 但是这些方法并不算抽象方法!</font>

另外, <red>如果某个接口定义了一个抽象方法的同时继承了一个包含其他抽象方法的接口，那么该接口就*不是*函数式接口.</font>

<br/>

除此之外，<blue>Java SE 8中增加了一个新的包: `java.util.function`, 它里面包含了常用的函数式接口, </font>

例如： 

-   Predicate<T>——接收T对象并返回boolean
-   Consumer<T>——接收T对象，不返回值
-   Function<T, R>——接收T对象，返回R对象
-   Supplier<T>——提供T对象（例如工厂），不接收值
-   UnaryOperator<T>——接收T对象，返回T对象
-   BinaryOperator<T>——接收两个T对象，返回T对象



#### 1): 函数式接口的声明

<red>为保证方法的数量有且仅有一个, java 8 使用了专有注解`@FunctionalInterface`. 

**例如: 声明一个函数式接口**

```java
package lambda.lesson0.functional;

@FunctionalInterface
public interface FunctionalService {

    void sayHello();
}

```

<red>当接口声明的抽象方法多于或者少于一个时编译都会报错!</font

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

其实对于<red>Lambda表达式本质上就是一个对应的函数式接口对象!</font>

#### 1): Lambda类型推断

<blue>一个lambda表达式它本身并没有包含它到底实现哪个函数式接口的信息. 我们怎么知道我们定义的某个lambda表达式可以用到某个函数式接口呢？</font>

<red>实际上，对于lambda表达式的类型是通过它的*应用上下文*来推导出来的. </font> 

这个过程我们称之为**类型推导(type inference)**. 那么，**在上下文中我们期望获得到的类型则称之为`目标类型`**.

**例如: 下面代码中的lambda表达式类型是ActionListener**

```java
    ActionListener l = (ActionEvent e) -> ui.dazzle(e.getModifiers());  
```

<br/>

但是<red>同样的lambda表达式在不同的上下文中可以有不同的类型</font>：

```java
    Callable<String> c = () -> "done";  
      
    PrivilegedAction<String> a = () -> "done";  
```

<blue>第一个lambda表达式() -> "done"是Callable的实例; 而第二个lambda表达式则是PrivilegedAction的实例。</font>

<br/>

#### 2): 类型检查详细例子

​     首先，我们这部分应用lambda表达式的代码如下：

```java
    inventory.sort((Apple a1, Apple a2) -> a1.getWeight().compareTo(a2.getWeight()));  
```

-   我们首先<blue>检查`inventory.sort方法`的签名</font>，它的详细签名如下：

    `void sort(Comparator<? super E> c)`

-   那么它<blue>期待的参数类型是Comparator<Apple>;</font>

-   对于Comparator接口，它是一个函数式接口，并有定义的抽象方法compare;

-   compare方法的详细签名如下：

    `int compare(Apple o1, Apple o2)`, 这表示这个方法<blue>期待两个类型为Apple的输入参数，并返回一个整型的结果</font>

-   <red>比对lambda表达式的函数签名类型，它也是两个输入类型为Apple，并且输出为int类型;</font>

这样，lambda表达式的目标类型和我们的类型匹配了!

<br/>

#### 3): 类型推断总结:

总结起来，**当且仅当下面所有条件均满足时，lambda表达式才可以被赋给目标类型T**：

-   <red>T是一个函数式接口</font>
-   <red>lambda表达式的参数和T的方法参数在数量和类型上一一对应</font>
-   <red>lambda表达式的返回值和T的方法返回值相兼容（Compatible）</font>
-   <red>lambda表达式内所抛出的异常和T的方法throws类型相兼容</font>

<br/>

<red>由于目标类型（函数式接口）已经"知道"lambda表达式的形式参数（Formal parameter）类型，所以我们没有必要把已知类型再重复一遍. </font>

也就是说，lambda表达式的参数类型可以从目标类型中得出：

```java
    Comparator<Apple> comp = (a1, a2) -> a1.getWeight().compareTo(a2.getWeight());  
```

在上面的例子里, <blue>编译器可以推导出a1和a2的类型是Apple。所以它就在lambda表达式里省略了a1, a2的类型声明。这样可以使得我们的代码更加简练.</font>

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

<blue>创建了一个`filter方法`, 通过调用此方法对列表进行过滤查找!</font>

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



-   <red>把外面的壳子去掉, 只保留只保留方法参数和方法体, 参数和方法体之间加上符号 -></font>

```java 
HeroChecker c2 = (Hero h) -> {
    return  h.hp>100 && h.damage<50;
}
```



-   <red>把return和{}去掉</font>

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

与匿名类的概念类似: <blue>匿名方法把方法作为参数. </font>

虽然代码是这么写:

 ```java
filter(heros, h -> h.hp > 100 && h.damage < 50);
 ```

但是，<red>Java会在背后，悄悄的，把这些都还原成匿名类方式.</font> 

引入Lambda表达式，会使得代码更加紧凑，而不是各种接口和匿名类到处飞.

<br/>

#### 6): Lambda的弊端

Lambda表达式虽然带来了代码的简洁，但是也有其局限性:

-   <blue>可读性差，与啰嗦的但是清晰的匿名类代码结构比较起来，Lambda表达式一旦变得比较长，就*难以理解*;</font>
-   <blue>不便于调试，很难在Lambda表达式中增加调试信息，比如日志</font>
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

<blue>与引用静态方法很类似，只是传递方法的时候，*需要一个对象的存在*.</font>

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

-   <red>matched()是成员方法;</font>
-   <red>Hero::matched()是通过类名引用的</font>

<br/>



#### 4): 引用构造器

<blue>有的接口中的方法会返回一个对象，比如`java.util.function.Supplier`提供了一个get方法，返回一个对象!</font>

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

<red>用三种不同的方法创建了容器, 通过比较发现三种方法均能创建容器, 且每个都不相同!</font>

输出为:

```
false
false
```

<br/>



#### 5): 方法引用小结

<blue>有的情况下，我们已经有一些方法实现同样的功能了，那么我们可以重用这些原有的功能而不至于自己去重复实现, 这时候使用Lambda引用即可!</font>

方法引用有很多种，它们的语法如下：

-   静态方法引用：ClassName::methodName
-   实例上的实例方法引用：instanceReference::methodName
-   超类上的实例方法引用：super::methodName
-   类型上的实例方法引用：ClassName::methodName
-   构造方法引用：Class::new
-   数组构造方法引用：TypeName[]::new

<red>对于静态方法引用，我们需要在类名和方法名之间加入::分隔符，例如Integer::sum;</font>

<red>对于具体对象上的实例方法引用，我们则需要在对象名和方法名之间加入分隔符</font>

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

-   <red>Stream 和Collection结构化的数据不一样: Stream是一系列的元素，就像是生产线上的罐头一样，一串串的出来;</font>
-   <red>管道指的是*一系列的聚合操作*;</font>

管道又分**3个部分**

-   **管道源**：在这个例子里，源是一个List
-   **中间操作**： <blue>每个中间操作，*又会返回一个Stream*，比如.filter()又返回一个Stream, 中间操作是“懒”操作，并`不会真正进行遍历`</font>;
-   **结束操作**：<red>当这个操作执行后，流就被使用"光"了，无法再被操作! 所以这`必定是流的最后一个操作`.  结束操作不会返回Stream，但是会返回int、float、String、 Collection或者像forEach，什么都不返回,  结束操作才进行真正的遍历行为，在遍历的时候，才会去进行中间操作的相关判断</font>

**注**： <blue>这个Stream和I/O章节的InputStream,OutputStream是不一样的概念!</font>	

<br/>

#### 3): 管道源

##### 把Collection切换成管道源:

很简单，调用stream()就行了:

```java
heros.stream()
```

<br/>

##### 数组切换为管道源

<red>数组却没有stream()方法，需要使用工具类的静态方法</font>

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

<blue>每个中间操作，又会返回一个Stream，比如.filter()又返回一个Stream, 中间操作是“懒”操作，并不会真正进行遍历;</font>

中间操作比较多，主要分两类: <green>对元素进行筛选 和 转换为其他形式的流</font>

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

```

<br/>



#### 5): 结束操作

<red>当进行结束操作后，流就被使用“光”了，无法再被操作; 所以这*必定是流的最后一个操作*;  </font>

<red>结束操作不会返回Stream，但是会返回int、float、String、 Collection或者像forEach，什么都不返回; 结束操作才真正进行遍历行为，前面的中间操作也在这个时候，才真正的执行;</font>

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

```



<br/>

-------------------------

### 5. 小结









<br/>

-------------------------



### 附录

文章参考:

-   [java8 lambda表达式学习总结](https://blog.csdn.net/iteye_12150/article/details/82642847)
-   http://how2j.cn/k/lambda/lambda-stream/700.html
-   [Java8 lambda表达式10个示例](https://www.cnblogs.com/coprince/p/8692972.html)