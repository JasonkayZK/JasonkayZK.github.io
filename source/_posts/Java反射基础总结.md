---
title: Java反射基础总结
toc: true
date: 2019-09-14 15:31:24
cover: https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1568457978094&di=90a3d25913f9e02d4b7637fa398040af&imgtype=0&src=http%3A%2F%2Fimg0.ph.126.net%2Fwa7MCE5KpwNALpiy-QwXtw%3D%3D%2F6619114974793209336.jpg
categories: 学习案例
tags: [反射, 学习案例]
description: 有关Java中反射的相关总结知识!
---



最近用到了动态代理, 在Spring框架中也大量使用了反射来完成Ioc和AOP. 对于反射一直也都是使用, 也没怎么系统的学习. 这篇文章就系统的总结一下在Java中反射的相关机制!

<!--more-->

## Java反射

### 1. 反射概述

在运行过程中:

-   对于任意一个*类*: <font color="#0000ff">都能够知道这个类的所有属性和方法;</font>
-   对于任意一个对象: <font color="#0000ff">都能够调用它的任意一个方法和属性;</font>

<font color="#ff0000">这种动态获取的信息以及动态调用对象的方法的功能称为java语言的反射机制</font>

实际上, 我们创建的每一个类也都是对象! 即类本身是`java.lang.Class类`的实例对象, 被称为类对象!

<br/>

----------------------------



### 2. Class对象特点

Class类的API如下图所示:

![Class类的API](https://img-blog.csdnimg.cn/20181029101808836.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2xpbGlsdW5p,size_27,color_FFFFFF,t_70)

  从图中可以得出以下几点：

-   Class 类的实例对象表示正在运行的 Java 应用程序中的类和接口; 也就是jvm中<font color="#0000ff">有很多的实例，每个类都有唯一的Class对象;</font>
-   <font color="#ff0000">Class 类没有公共构造方法, Class 对象是在加载类时由 Java 虚拟机自动构造的. </font>也就是说我们不需要创建，JVM已经帮我们创建了;
-   Class 对象用于提供类本身的信息，比如有几种构造方法， 有多少属性，有哪些普通方法;

<br/>

--------------------



### 3. 反射的使用

假设有一个JavaBean: `Hero类`

```java
package reflection.pojo;

public class Hero {

    public String name;

    public double hp;

    protected double armor;

    public int speed;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public double getHp() {
        return hp;
    }

    public void setHp(double hp) {
        this.hp = hp;
    }

    public double getArmor() {
        return armor;
    }

    public void setArmor(double armor) {
        this.armor = armor;
    }

    public int getSpeed() {
        return speed;
    }

    public void setSpeed(int speed) {
        this.speed = speed;
    }

    @Override
    public String toString() {
        return "Hero{" +
                "name='" + name + '\'' +
                ", hp=" + hp +
                ", armor=" + armor +
                ", speed=" + speed +
                '}';
    }

}

```



#### 1): 获取类对象

<font color="#ff0000">获取类对象的方法有3种:</font>

-   <font color="#0000ff">Class.forName() [常用]</font>
-   <font color="#0000ff">Hero.class</font>
-   <font color="#0000ff">new Hero().getClass()</font>

<font color="#ff0000">在一个JVM中, 同一个ClassLoader引导创建的类, 只会有一个类对象存在!</font>

所以对于上述三个方法来说, 都是使用的`AppClassLoader`引导创建的, 所以产生的类对象都相同:

```java
package reflection.chapter3.getClass;

import reflection.pojo.Hero;

public class GetClassDemo {

    public static void main(String[] args) {
        String className = "reflection.pojo.Hero";

        try {
            Class clazz1 = Class.forName(className);
            Class clazz2 = Hero.class;
            Class clazz3 = new Hero().getClass();

            System.out.println(clazz1 == clazz2);
            System.out.println(clazz2 == clazz3);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }

    }

}

```

输出为:

```java
true
true
```

三种方法比较:

-   使用`Class.forName()`静态方法最常用!
-   使用`Hero.class方法`需要导入对于的类的包!
-   使用`new方法`已经直接new出了对象, 一般不再需要反射了!

<font color="#ff0000">一般都第一种，一个字符串可以传入也可写在配置文件中等多种方法.</font>

<br/>

---------------------------------------



#### 2): 利用反射创建对象

与传统的*通过new来获取对象*的方法不同: <font color="#0000ff">反射会先拿到Hexo的"类对象", 然后通过类对象获取"构造器对象", 再通过构造器对象创建一个对象!</font>

**如, 使用默认的构造器方法构造对象:**

```java
/*
    1.获取类对象 Class clazz = Class.forName("reflection.pojo.Hero");
    2.获取构造器对象 Constructor con = clazz.getConstructor(形参.class);
    3 获取对象 Hero hero =con.newInstance(实参);
*/
package reflection.chapter4.constructObject;

import reflection.pojo.Hero;

import java.lang.reflect.Constructor;

public class DefaultConstructor {

    public static void main(String[] args) {
        try {
            Class clazz = Class.forName("reflection.pojo.Hero");
            Constructor constructor = clazz.getConstructor();

            Hero hero = (Hero) constructor.newInstance();
            System.out.println(hero);
        } catch (Exception e) {
            e.printStackTrace();
        }

    }

}

```

输出为:

```java
Hero{name='null', hp=0.0, armor=0.0, speed=0}
```



<br/>

<font color="#ff0000">当Hero的构造方法不是无参构造方法的时候: 需要先获取对应的构造器方法!</font>

**如: 获取构造函数构造对象**

1.Hero类中添加构造方法

```java
    //---------------构造方法-------------------
    //（默认的构造方法）
    Hero(String str){
        System.out.println("(默认)的构造方法 s = " + str);
    }

    //无参构造方法
    public Hero(){
        System.out.println("调用了公有、无参构造方法执行了。。。");
    }

    //有一个参数的构造方法
    public Hero(char name){
        System.out.println("姓名：" + name);
    }

    //有多个参数的构造方法
    public Hero(String name ,float hp){
        System.out.println("姓名："+name+"血量："+ hp);
    }

    //受保护的构造方法
    protected Hero(boolean n){
        System.out.println("受保护的构造方法 n = " + n);
    }

    //私有构造方法
    private Hero(float hp){
        System.out.println("私有的构造方法   血量："+ hp);
    }
```

2.通过反射机制获取对象

```java
package reflection.chapter4.constructObject;


import reflection.pojo.Hero;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;

public class SelectConstructor {

    /**
     *
     * 通过Class对象可以获取某个类中的: 构造方法, 成员变量, 成员方法;
     *
     * 并访问成员.
     *
     * 1.获取构造方法：
     * 		1).批量的方法：
     * 			public Constructor[] getConstructors()：所有"公有的"构造方法
     public Constructor[] getDeclaredConstructors()：获取所有的构造方法(包括私有、受保护、默认、公有)

     * 		2).获取单个的方法，并调用：
     * 			public Constructor getConstructor(Class... parameterTypes):获取单个的"公有的"构造方法：
     * 			public Constructor getDeclaredConstructor(Class... parameterTypes):获取"某个构造方法"可以是私有的，或受保护、默认、公有；
     *
     * 2.创建对象
     * 		Constructor对象调用newInstance(Object... initargs)
     *
     */
    public static void main(String[] args) throws IllegalAccessException, InvocationTargetException, InstantiationException, NoSuchMethodException, ClassNotFoundException {

        // 1. 获取Class对象
        Class clazz = Class.forName("reflection.pojo.Hero");

        // 2. 获取构造方法
        System.out.println("----公有构造方法----");
        Constructor[] constructors = clazz.getConstructors();
        for (Constructor constructor : constructors) {
            System.out.println(constructor);
        }

        System.out.println("----所有的构造方法(包括：私有、受保护、默认、公有)----");
        constructors = clazz.getDeclaredConstructors();
        for (Constructor constructor : constructors) {
            System.out.println(constructor);
        }

        System.out.println("----获取公有、无参的构造方法----");
        // 1> 因为是无参的构造方法所以类型是一个null,不写也可以：这里需要的是一个参数的类型，切记是类型!!!!!
        // 2> 返回的是描述这个无参构造函数的类对象.
        Constructor cons = clazz.getConstructor(null);
        System.out.println("consturctor = " + cons);
        // 调用方法
        Object object = cons.newInstance();
        System.out.println("Object: " + (Hero)object);


        System.out.println("----获取私有构造方法，并调用----");
        cons = clazz.getDeclaredConstructor(float.class);
        System.out.println("consturctor = " + cons);
        // 调用方法
        cons.setAccessible(true);
        object = cons.newInstance(100);
        System.out.println("Object: " + (Hero)object);

    }

}

```

输出为:

```java
----公有构造方法----
public reflection.pojo.Hero()
public reflection.pojo.Hero(char)
public reflection.pojo.Hero(java.lang.String,float)
    
    
----所有的构造方法(包括：私有、受保护、默认、公有)----
reflection.pojo.Hero(java.lang.String)
public reflection.pojo.Hero()
public reflection.pojo.Hero(char)
public reflection.pojo.Hero(java.lang.String,float)
protected reflection.pojo.Hero(boolean)
private reflection.pojo.Hero(float)
    
    
----获取公有、无参的构造方法----
consturctor = public reflection.pojo.Hero()
调用了公有、无参构造方法执行了...
Object: Hero{name='null', hp=0.0, armor=0.0, speed=0}


----获取私有构造方法，并调用----
consturctor = private reflection.pojo.Hero(float)
私有的构造方法   血量：100.0
Object: Hero{name='null', hp=0.0, armor=0.0, speed=0}
```

<br/>

**总结:**

获取构造器**批量**的方法：

-   public Constructor[] getConstructors()：

    所有"公有的"构造方法		

-   public Constructor[] getDeclaredConstructors()：

    获取所有的构造方法(包括私有、受保护、默认、公有)

<br/>

获取构造器**单个**的方法:

-   public Constructor getConstructor(Class… parameterTypes): 

    获取单个的"公有的"构造方法

-   public Constructor getDeclaredConstructor(Class…parameterTypes):

    获取"某个构造方法"可以是私有的，或受保护、默认、公有；

<br/>

---------------------



#### 3): 获取成员变量并使用

**基本步骤:**

-   获取对象: <font color="#0000ff">通过new或者反射获得对象;</font>
-   获取属性: <font color="#ff0000">Field f1 = hero.getDeclaredField("属性名")</font>
-   修改属性: <font color="#ff0000">f1.set(hero, 实参) 此处为对象, 而不是类对象!!!</font>

**例1: 获取并修改属性**

```java
package reflection.chapter5.param;

import reflection.pojo.Hero;

import java.lang.reflect.Field;

public class GetAndModifyParamDemo {

    public static void main(String[] args) {
        Hero hero = new Hero();

        try {
            // 获取hero的叫做name字段的属性
            Field field = hero.getClass().getDeclaredField("name");
            // 修改属性
            field.set(hero, "teemo");

            System.out.println(hero);
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (NoSuchFieldException e) {
            e.printStackTrace();
        }

    }

}

```

输出为:

```java
Hero{name='teemo', hp=0.0, armor=0.0, speed=0}
```

<br/>

**补充: getField和getDeclaredField的区别**

-   getField: <font color="#ff0000">只能获取public的，包括从父类继承来的字段;</font>

-   getDeclaredField: <font color="#ff0000">可以获取本类所有的字段，包括private的，*但是不能获取继承来的字段.*</font> 

    <font color="#ff0000">(注: 这里只能获取到private的字段，但并不能访问该private字段的值,除非加上setAccessible(true))</font>

<br/>

----------------



#### 4): 获取成员方法并使用

**基本步骤:**

-   获取对象;

-   获取成员方法: 

    -   `public Method getMethod(String name ，Class<?>… parameterTypes)`: 获取"公有方法";  (包含了父类的方法也包含Object类)
    -   `public Method getDeclaredMethods(String name ，Class<?>… parameterTypes)` : 获取成员方法，包括私有的<font color="#ff0000">(不包括继承的)</font>

    **参数解释**: 

    -   **name** : 方法名；
    -   **Class** … : 形参的<font color="#ff0000">Class类型对象</font>

-   调用方法: 

    <font color="#ff0000">Method --> public Object invoke(Object obj,Object… args)</font>
    **参数说明**：

    -   **obj**: <font color="#ff0000">要调用方法的对象; </font>
    -   **args**: <font color="#ff0000">调用方式时所传递的实参;</font>

**实例: **

```java
package reflection.chapter6.method;

import reflection.pojo.Hero;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

public class InvokeMethodDemo {

    public static void main(String[] args) {
        Hero hero = new Hero();

        Hero heroSet = new Hero();

        try {
            // 获取方法
            Method method = hero.getClass().getMethod("setName", String.class);

            // 对heroSet调用反射方法!
            method.invoke(heroSet, "Garon");
            // 对hero调用常规方法
            hero.setName("Teemo");

            System.out.println("hero: " + hero);
            System.out.println("heroSet: " + heroSet);
        } catch (Exception e) {
            e.printStackTrace();
        }

    }

}

```

输出结果为:

```
hero: Hero{name='Teemo', hp=0.0, armor=0.0, speed=0}
heroSet: Hero{name='Garon', hp=0.0, armor=0.0, speed=0}
```

<br/>

关于Java方法反射的源码实现的分析: [深入分析Java方法反射的实现原理](https://www.jianshu.com/p/3ea4a6b57f87)

<br/>

--------------------



#### 5): 获取main方法并使用

**例: **

在Hero中添加main方法:

```java
    public static void main(String[] args) {
        System.out.println("执行main方法");
        for (String arg : args) {
            System.out.println(arg);
        }
    }

```

通过反射获取main方法, 并执行:

```java
package reflection.chapter7.main;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

public class InvokeMainDemo {

    public static void main(String[] args) {
        try {
            // 1. 获取Class对象
            Class clazz = Class.forName("reflection.pojo.Hero");

            // 2. 获取main方法
            Method mainMethod = clazz.getMethod("main", String[].class);

            // 3. 调用main方法

            /*
                1. 错误调用
                mainMethod.invoke(null, new String[] {"a", "b", "c"});

                首先,
                    第一个参数: 对象类型, 当方法是静态方法时, 可以为null!
                    第二个参数: String数组，这里要注意在jdk1.4时是数组，jdk1.5之后是可变参数

                上述方法会报错:
                    这里拆的时候会将 new String[]{"a","b","c"} 拆成3个对象!!!
                    所以需要将它强转!!!
             */

            mainMethod.invoke(null, (Object)new String[] {"a", "b", "c"}); // 方法一

            mainMethod.invoke(null, new Object[] {new String[] {"a", "b", "c"}}); // 方法二

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}

```

输出结果:

```
执行main方法
a
b
c
```

<br/>

--------------------



### 4. 反射的应用:

#### 1): 通过反射读取并运行配置文件内容

首先准备两个业务类:

```java
package reflection.chapter8.settings.service;

public class Service1 {

    public void doService1() {
        System.out.println("Service 1");
    }
}

```

```java
package reflection.chapter8.settings.service;

public class Service2 {

    public void doService2() {
        System.out.println("Service 2");
    }
}

```

此时如果需要讲业务方法一切换为业务方法二时, 如果**使用非反射方式**: <font color="#ff0000">必须修改源代码, 然后重新编译, 运行才可以!</font>

**如:**

```java
package reflection.chapter8.settings;

import reflection.chapter8.settings.service.Service1;
import reflection.chapter8.settings.service.Service2;

/**
 * 不使用反射时, 需要修改源代码, 并重新编译!!!
 */
public class CommonDemo {

    public static void main(String[] args) {
        // new Service1().doService1();

        // 想要使用service2, 必须修改源码!
        new Service2().doService2();
    }
}

```

<br/>

**如果使用反射, 将会方便的多!**

-   首先<font color="#0000ff">准备一个配置文件</font>, 如: *reflection.properties*;

    文件存放的是类的名称，和要调用的方法名.

**如:**

```properties
class=reflection.chapter8.settings.service.Service2
method=doService2
```

-   测试类中，<font color="#0000ff">首先取出类名称和方法名，然后通过反射去调用这个方法;</font>
-   <font color="#ff0000">当需要从调用第一个业务方法，切换到调用第二个业务方法的时候，不需要修改一行代码，也不需要重新编译，只需要修改配置文件，再运行即可</font>

<br/>

**例如: 测试类**

```java
package reflection.chapter8.settings;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.util.Properties;

public class ReflectSettingsDemo {

    public static void main(String[] args) {
        Properties properties;
        InputStream in = null;
        try {
            properties = new Properties();
            in = ReflectSettingsDemo.class.getClassLoader().getResourceAsStream("reflection.properties");
            properties.load(in);

            String className = properties.getProperty("class");
            String methodName = properties.getProperty("method");

            // 根据配置类名寻找类对象
            Class clazz = Class.forName(className);

            // 根据方法名, 寻找方法对象
            Method method = clazz.getMethod(methodName);

            // 获取默认无参构造器
            Constructor constructor = clazz.getConstructor();

            // 根据构造器, 实例化对象, 并调用指定方法!
            method.invoke(constructor.newInstance());

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (in != null) {
                try {
                    in.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

}

```

最后读取配置文件后输出:

```
Service 2
```

将配置文件修改为:

```properties
class=reflection.chapter8.settings.service.Service1
method=doService1
```

输出为

```
Service 1
```

<br/>

----------------------



#### 2): 通过反射越过泛型检查

<font color="#ff0000">泛型是在编译期间起作用的。在编译后的.class文件中是没有泛型的。所有比如T或者E类型啊，本质都是通过Object处理的。所以可以通过使用反射来越过泛型! </font>

```java
package reflection.chapter9.genericType;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

public class AviodGenericTypeCheckDemo {

    @SuppressWarnings({"unchecked", "rawtypes"})
    public static void main(String[] args) throws Exception {
        List<String> list = new ArrayList<>();
        list.add("this");
        list.add("is");

        // List.add(5) 编译报错!

        /* 越过泛型检查! */

        // 获取ArrayList的Class对象, 反射调用add()
        Class listClazz = list.getClass();

        // 获取add()方法
        Method method = listClazz.getMethod("add", Object.class);

        method.invoke(list, 5);

        for (Object obj : list) {
            System.out.println(obj);
        }

    }
}

```

正常情况下, 由于声明的泛型类型为String, 而向其中加入的是Integer类型, 所以编译器在检查期将报错!

<font color="#ff0000">而使用了反射之后, 通过`反射调用add()方法`将越过编译器类型检查, 而成功加入</font>

<br/>

最终执行会输出结果:

```
this
is
5
```

<br/>

-----------------



### 附录

<font color="#ff0000">Github源码:</font> https://github.com/JasonkayZK/Java_Samples/tree/master/src/main/java/reflection



--------------------

**引用: **

1.  [Java基础之—反射（非常重要）](https://blog.csdn.net/sinat_38259539/article/details/71799078) [↩︎](https://blog.csdn.net/lililuni/article/details/83449088#fnref1)
2.  [反射有什么用](http://how2j.cn/k/reflection/reflection-usage/1111.html#nowhere) [↩︎](https://blog.csdn.net/lililuni/article/details/83449088#fnref2)
3.  [深入分析Java方法反射的实现原理](https://www.jianshu.com/p/3ea4a6b57f87)

