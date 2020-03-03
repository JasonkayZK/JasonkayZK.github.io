---
title: 实现一个简单的SpringIOC容器
cover: http://api.mtyqx.cn/api/random.php?21
toc: false
date: 2020-03-02 12:36:42
categories: Spring
tags: [Spring源码, Spring]
description: Spring中核心的思想即IoC和AOP. 为了更好的理解关于Spring IoC底层实现, 打算根据Spring 5.x的源码实现一个简单的Spring IoC容器
---

Spring中核心的思想即IoC和AOP. 为了更好的理解关于Spring IoC底层实现, 打算根据Spring 5.x的源码实现一个简单的Spring IoC容器


本文内容包括:

- 自定义注解@MyAutowired等
- 容器初始化
- Bean工程类的构造方法
- Bean元数据定义BeanDefinition
- Bean扫描器ClassPathBeanDefinitionScanner
- Bean的创建和注入
- 代码测试


源代码: 

- https://github.com/JasonkayZK/Java_Samples/tree/spring-ioc

<br/>

<!--more-->

## 实现一个简单的SpringIOC容器

本例子**仅仅使用了Lombok和commons-lang3实现了Spring-core中的大部分IoC功能**

包括:

-   `@MyAutowired`, `@MyService`, `@MyComponent`, `@MyController`, `@MyLazy`等注解
-   创建基于AnnotationConfig的上下文容器AnnotationConfigApplicationContext
-   DefaultListableBeanFactory: Bean工厂的实现
-   BeanPostProcessor: 实现Bean的初始化前置/后置处理
-   AnnotationConfigRegistry: JavaBean的元数据BeanDefinition的注册类
-   ClassPathBeanDefinitionScanner: 根据ClassPath的包扫描器

可完成类似于:

-   读取并解析配置文件(可配置dev等)
-   扫描指定包的注解(`@Component`, `@Service`等)实现Bean和容器的初始化
-   通过context.getBean()获取指定的bean
-   通过继承BeanPostProcessor实现Bean的初始化前置/后置处理
-   通过`@MyLazy`实现懒加载
-   通过`@MyService`或`@MyController`的name属性指定Bean名称(Id)
-   解决循环依赖问题

<br/>

## 零.容器入口ApplicationContext

在开始仿写spring的ioc容器之前，我们先来看一下spring容器中的一个核心类ApplicationContext(即spring容器的入口):

```java
// 基于包路径扫描
ApplicationContext context = new AnnotationConfigApplicationContext("top.jasonkayzk");
// 基于XML配置文件
ApplicationContext context1 = new ClassPathXmlApplicationContext("myBeans.xml");
// 基于配置类
ApplicationContext context2 = new AnnotationConfigApplicationContext(MyConf.class);
// ......
```

这些类就是Spring容器的入口

本例将会仿写一个**基于注解的包扫描实现IOC功能的小Demo**, 也就是: AnnotationConfigApplicationContext类

><br/>
>
>**补充:**
>
>**从Spring的源码可以看出:**
>
>**ApplicationContext同时也实现了BeanFactory和BeanRegistry接口**
>
>**(即完成了Bean创建和Bean信息注册功能)**

<br/>

## 一. 自定义注解

首先，我们先定义了几个需要用到的注解，从而实现**Bean的扫描、Bean的懒加载、Bean的注入等**这些基础的用法:

-   @MyAutowired
-   @MyComponent
-   @MyLazy
-   @MyService
-   @MyController
-   @MyRequestMapping

代码如下：

MyAutowired.java

```java
// 实现Bean的属性填充，依赖注入
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@Documented
@MyComponent
public @interface MyAutowired {
}
```

MyComponent.java

```java
/**
 * 实现Bean的扫描
 *
 * 类加载时会添加到候选资源中，后期完成Bean的注入
 *
 * @author zk
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface MyComponent {
    /**
     * 组件名称
     *
     * @return 组件名称
     */
    String name() default "";
}
```

MyLazy.java

```java
/**
 * 当添加了这个注解，则表示Bean是懒加载的
 *
 * @author zk
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@MyComponent
public @interface MyLazy {
}
```

MyService.java

```java
/**
 * Spring中业务层注解
 *
 * @author zk
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@MyComponent
public @interface MyService {
    /**
     * 业务Bean名称
     *
     * @return 业务Bean名称
     */
    String name() default "";
}
```

MyController.java

```java
/**
 * SpringMVC中控制器注解
 *
 * @author zk
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@MyComponent
public @interface MyController {
}
```

MyRequestMapping.java

```java
/**
 * 访问控制层url处理
 *
 * @author zk
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface MyRequestMapping {
    /**
     * 请求访问url路径
     *
     * @return 请求访问url路径, 默认为: "/"
     */
    String value() default "/";
}
```

<br/>

## 二. 容器初始化

注解创建完毕后，我们开始创建这个AnnotationConfigApplicationContext类

### Spring中的构造方法

在创建这个类之前，我们先分析一下spring-framework-5.0.x源码中这个类的构造方法:

AnnotationConfigApplicationContext.java

```java
public class AnnotationConfigApplicationContext extends GenericApplicationContext implements AnnotationConfigRegistry {
    private final AnnotatedBeanDefinitionReader reader;
    // Bean定义扫描器
    private final ClassPathBeanDefinitionScanner scanner;

    public AnnotationConfigApplicationContext() {
        // 此类有一个父类GenericApplicationContext, 在执行构造方法之前, 先执行父类构造方法
        // super();
        
        // 初始化注解模式下Bean定义的扫描器
        // 此处的this就是AnnotationConfigApplicationContext
        this.reader = new AnnotatedBeanDefinitionReader(this);
        this.scanner = new ClassPathBeanDefinitionScanner(this);
    }
    
    // 扫描给定包中的bean定义, 并自动刷新和创建上下文
    public AnnotationConfigApplicationContext(String... basePackages) {
        // 初始化容器信息, Bean的扫描器, 注册表等信息
        this();
        // 加载, 扫描指定包路径下的所有类
        // 将所有的带有指定标记的类扫描到一个集合中, 集合保存类的源数据信息
        this.scan(basePackages);
        // 注入Bean
        this.refresh();
    }
    //......
}
```

在上述代码中，可以看得出来，我们需要编写一个构造器: 

`new AnnotationConfigApplicationContext(String basePackages)`

并且完成下列初始化工作:

-   **首先容器调用自身的构造函数this()完成容器的初始化准备工作**
-   **其次调用scan(basePackages)方法完成包的扫描工作将扫描的包添加到候选资源集合中**
-   **利用上述扫描过的集合, 使用refresh()方法完成Bean的创建和注入工作**

### 容器抽象类AbstractApplicationContext

为了展示与Spring中类似的继承关系(GenericApplicationContext), 这里我定义了一个AbstractApplicationContext类

所以在进行构造时, 首先会调用AbstractApplicationContext类的构造函数

而AbstractApplicationContext实现了BeanDefinitionRegistry接口, 所以先看一下BeanDefinitionRegistry接口

BeanDefinitionRegistry.java

```java
// bean的注册器
public interface BeanDefinitionRegistry {
    void registerBeanDefinition(String beanName, BeanDefinition beanDefinition);

    BeanDefinition getBeanDefinition(String beanName);

    boolean containsBeanDefinition(String beanName);

    Set<String> getBeanDefinitionNames();

    void registerProperties(Properties properties);
}
```

>   <br/>
>
>   BeanDefinitionRegistry接口主要维护了BeanDefinition(即Bean的元数据类, 见下)的列表

接下来看一下AbstractApplicationContext

AbstractApplicationContext.java

```java
package top.jasonkayzk.ioc.core.context;

import top.jasonkayzk.ioc.core.entity.BeanDefinition;
import top.jasonkayzk.ioc.core.factory.DefaultListableBeanFactory;
import top.jasonkayzk.ioc.core.registry.BeanDefinitionRegistry;

import java.util.Properties;
import java.util.Set;

/**
 * ApplicationContext, Spring容器的顶层抽象类
 *
 * @author zk
 */
public abstract class AbstractApplicationContext implements BeanDefinitionRegistry {

    /**
     * Bean工厂，用户Bean的创建和管理
     */
    public final DefaultListableBeanFactory beanFactory;

    /**
     * 创建一个新的AbstractApplicationContext
     */
    public AbstractApplicationContext() {
        // 调用父类的构造函数
        // 为ApplicationContext Spring上下文对象初始化BeanFactory
        this.beanFactory = new DefaultListableBeanFactory();
    }

    /**
     * 往注册表中注册一个新的 BeanDefinition实例[关键]
     */
    @Override
    public void registerBeanDefinition(String beanName, BeanDefinition beanDefinition) {
        this.beanFactory.registerBeanDefinition(beanName, beanDefinition);
    }

    /**
     * 根据Bean的名称获取Bean的定义
     *
     * @param beanName Bean的名称
     * @return Bean的定义
     */
    @Override
    public BeanDefinition getBeanDefinition(String beanName) {
        return this.beanFactory.beanDefinitionMap.get(beanName);
    }

    /**
     * 判断是否包含某个Bean
     *
     * @param beanName Bean的名称
     * @return 是否包含某个Bean
     */
    @Override
    public boolean containsBeanDefinition(String beanName) {
        return this.beanFactory.beanDefinitionMap.containsKey(beanName);
    }

    /**
     * 获取所有Bean的id
     *
     * @return 所有Bean的id(name)的Set集合
     */
    @Override
    public Set<String> getBeanDefinitionNames() {
        return this.beanFactory.beanDefinitionMap.keySet();
    }

    /**
     * 注册配置文件
     *
     * @param properties 配置文件
     */
    @Override
    public void registerProperties(Properties properties) {
        this.beanFactory.registerProperties(properties);
    }

    /**
     * 从容器中获取Bean
     *
     * @param beanName Bean名称
     * @return Bean名称对应的Bean
     */
    public Object getBean(String beanName) {
        return this.beanFactory.getBean(beanName);
    }

    /**
     * 注入Bean
     */
    public void refresh() {
        // 获取bean工厂
        DefaultListableBeanFactory beanFactory = obtainFreshBeanFactory();
        // 工厂信息初始化完成后，开始创建单例非懒加载的bean
        finishBeanFactoryInitialization(beanFactory);
    }

    /**
     * 获取Bean工厂类
     *
     * @return Bean工厂类
     */
    private DefaultListableBeanFactory obtainFreshBeanFactory() {
        return this.beanFactory;
    }

    /**
     * 开始进行Bean的注入工作
     *
     * @param beanFactory bean工厂的实例
     */
    private void finishBeanFactoryInitialization(DefaultListableBeanFactory beanFactory) {
        beanFactory.preInstantiateSingletons();
    }
}
```

><br/>
>
>**代码说明:**
>
>首先, AbstractApplicationContext虽然是一个抽象类, 但是内部没有abstract方法!
>
>**① Bean工厂: beanFactory**
>
>DefaultListableBeanFactory类型, 用于用户Bean的创建和管理(后文会将介绍)
>
>****
>
>**② 构造方法**
>
>AbstractApplicationContext是一个抽象类, 但是需要注意的是: <font color="#f00">**抽象类的构造方法在子类构造时也是会被调用的!**</font>
>
>此次在创建AnnotationConfigApplicationContext时, 会先调用AbstractApplicationContext的构造方法, 初始化beanFactory;
>
>****
>
>**③ 与BeanDefinition相关方法**
>
>BeanDefinition是一个实体类, 里面存放大量与Bean相关的元数据, 如: beanName, beanClass, lazyInit等
>
>AbstractApplicationContext中定义了一些获取这些元数据的操作, 如:
>
>-   registerBeanDefinition(): 往注册表中注册一个新的 BeanDefinition实例
>-   getBeanDefinition(): 根据Bean的名称获取Bean的定义
>-   containsBeanDefinition(): 判断容器中是否包含某个Bean
>-   getBeanDefinitionNames(): 获取所有Bean的id(Name)
>
>****
>
>**④ 与Application配置相关**
>
>registerProperties()方法: 向BeanFactory中注册配置文件
>
>****
>
>**⑤ 与Bean操作相关方法**
>
>-   getBean(String beanName): 从容器中根据名称获取Bean
>-   refresh(): 完成Bean的注入工作(向依赖中注入Bean)
>
><font color="#f00">**上述方法其实是通过BeanFactory实现的**</font>

父类AbstractApplicationContext初始化之后, 会完成scan()和refresh()方法完成Bean创建和Bean注入工作

### 容器实现类AnnotationConfigApplicationContext

对于AnnotationConfigApplicationContext很简单(他就是一个外壳而已):

对于AnnotationConfigApplicationContext它实现了AnnotationConfigRegistry接口(而AbstractApplicationContext实现了BeanDefinitionRegistry接口)

虽然和父类实现的接口不同, 但是AnnotationConfigRegistry也是定义了一些维护BeanDefinition集合的方法

下面先来看一下AnnotationConfigRegistry:

AnnotationConfigRegistry.java

```java
package top.jasonkayzk.ioc.core.registry;

import top.jasonkayzk.ioc.core.annotation.MyComponent;

/**
 * 注解的注册器
 *
 * @author zk
 */
public interface AnnotationConfigRegistry {
    /**
     * 将一个或者多个类进行注册
     * 调用此方法{@code register}是幂等的, 即:
     * 将同一个注解过的类注册多次没有副作用!
     * <p>
     * Register one or more annotated classes to be processed.
     * Calls to {@code register} are idempotent; adding the same
     * annotated class more than once has no additional effect.
     *
     * @param annotatedClasses 一个或者多个被注解的类
     *                         如: {@link MyComponent @MyComponent} 类
     */
    void register(Class<?>... annotatedClasses);

    /**
     * 基于指定的包进行扫描注解类
     *
     * Perform a scan within the specified base packages.
     *
     * @param basePackages the packages to check for annotated classes
     */
    void scan(String... basePackages);
}
```

再来看一下AnnotationConfigApplicationContext类

AnnotationConfigApplicationContext.java

```java
package top.jasonkayzk.ioc.core.context;

import top.jasonkayzk.ioc.core.registry.AnnotationConfigRegistry;
import top.jasonkayzk.ioc.core.scanner.ClassPathBeanDefinitionScanner;

/**
 * 通过Annotation配置的上下文容器
 *
 * @author zk
 */
public class AnnotationConfigApplicationContext extends AbstractApplicationContext implements AnnotationConfigRegistry {

    /**
     * 创建一个扫描器
     */
    private final ClassPathBeanDefinitionScanner scanner;

    public AnnotationConfigApplicationContext() {
        this.scanner = new ClassPathBeanDefinitionScanner(this);
    }

    public AnnotationConfigApplicationContext(String... basePackages) {
        // 容器初始化
        this();

        // 加载: 扫描指定包路径下的所有的类
        // 将所有的带有指定标记的类扫描到一个集合中，集合中保存的是类的元数据信息
        scan(basePackages);

        // 注入Bean
        refresh();
    }

    @Override
    public void register(Class<?>... annotatedClasses) {
    }

    @Override
    public void scan(String... basePackages) {
        this.scanner.scan(basePackages);
    }
}
```

<br/>

## 三. Bean工厂类构造方法

在上面AnnotationConfigApplicationContext构造时, 首先构造了父类AbstractApplicationContext

而AbstractApplicationContext初始化了一个类DefaultListableBeanFactory(即Bean工厂)

BeanFactory是Spring框架中核心的核心, 它完成了: Bean的初始化, 注入, 管理等各种核心方法

### BeanFactory接口

先看一下DefaultListableBeanFactory实现的接口BeanFactory

BeanFactory.java

```java
package top.jasonkayzk.ioc.core.factory;

/**
 * Spring中工厂模式创建Bean的工厂接口
 *
 * @author zk
 */
public interface BeanFactory {
    /**
     * 根据Bean的名称获取Bean对象
     *
     * @param beanName Bean的名称
     * @return Bean对象
     */
    Object getBean(String beanName);

    /**
     * 真正开始获取Bean
     *
     * @param beanName Bean的名称
     * @return Bean对象
     */
    Object doGetBean(String beanName);

    /**
     * 根据bean的名称创建Bean
     *
     * @param beanName Bean的名称
     * @return Bean对象
     */
    Object createBean(String beanName);

    /**
     * 根据bean的名称真正开始创建bean
     *
     * @param beanName Bean的名称
     * @return Bean对象
     */
    Object doCreateBean(String beanName);
}
```

其实核心方法只有两个: doGetBean(), doCreateBean()

分别用来获取Bean对象和创建Bean对象(**doCreateBean尤其关键!!**)

****

### 构造DefaultListableBeanFactory

再来看一下DefaultListableBeanFactory的小部分内容:

```java
public class DefaultListableBeanFactory implements BeanFactory {

    /**
     * 一级缓存
     * 用于存放完全初始化好的Bean，从该缓存中拿出来的Bean可以直接使用
     */
    private final Map<String, Object> singletonObjects = new ConcurrentHashMap<>(256);

    /**
     * 二级缓存:
     * 存储的原始的Bean(还未完全填充属性),
     * 用于解决Spring中的循环依赖问题，此时已经分配了内存地址
     * <p>
     * Cache of early singleton objects: bean name --> bean instance
     */
    private final Map<String, Object> earlySingletonObjects = new HashMap<>(16);

    /**
     * 三级缓存:
     * 单例对象工厂的cache，存放bean工厂对象，用于解决循环依赖
     * Cache of singleton factories: bean name --> ObjectFactory
     */
    private final Map<String, Object> singletonFactories = new HashMap<>(16);

    /**
     * 保存所有BeanPostProcessor
     */
    private Set<BeanPostProcessor> beanPostProcessorSet = new HashSet<>(16);

    /**
     * Bean的源数据集合，存储的是扫描器扫描的类的源数据信息
     */
    public final Map<String, BeanDefinition> beanDefinitionMap = new ConcurrentHashMap<>(128);

    /**
     * 配置文件
     */
    private Properties properties = null;
    
    ......
}
```

在DefaultListableBeanFactory中有几个比较重要的集合:

| **集合名称**              |   **作用**   | **详细说明**                                                 |
| :------------------------ | :----------: | :----------------------------------------------------------- |
| **singletonObjects**      | **一级缓存** | 用于**存放完全初始化好的Bean**，从该缓存中拿出来的Bean可以直接使用 |
| **earlySingletonObjects** | **二级缓存** | **存储的原始的Bean(还未完全填充属性)**<br /><font color="#f00">**用于解决Spring中的循环依赖问题，此时已经分配了内存地址**</font> |
| **singletonFactories**    | **三级缓存** | **单例对象工厂的cache，存放bean工厂对象**<br />**用于解决循环依赖** |
| **beanDefinitionMap**     |              | Bean的源数据集合，存储的是扫描器扫描的类的源数据信息         |
| **beanPostProcessorSet**  |              | 保存所有BeanPostProcessor                                    |

分别用于: 记录Bean的创建过程和所有的Bean的候选资源集合以及所有的Bean的后置处理器，这些在后面都会被用到!

><br/>
>
>**说明:**
>
>截至到现在: **在执行AnnotationConfigApplicationContext的this()构造函数之前的事情基本上都处理的差不多了**
>
>现在可以开始进行**初始化操作了:**
>
>在AnnotationConfigApplicationContext的构造函数中，实例化了一个ClassPathBeanDefinitionScanner类(也就是创建了一个类的扫描器):
>
>用于扫描需要扫描的包路径下的所有的类，**将指定的类添加到候选资源集合中，也就是上面看到的这个beanDefinitionMap集合中；**

<br/>

## 四. Bean元数据定义BeanDefinition

在查看ClassPathBeanDefinitionScanner之前, 需要看一下BeanDefinition这个类

因为在DefaultListableBeanFactory中维护了一个BeanDefinition的表beanDefinitionMap(包括Bean的所有元数据信息)

所以在分析DefaultListableBeanFactory之前, **先看一下这个BeanDefinition**

BeanDefinition.java

```java
package top.jasonkayzk.ioc.core.entity;

import lombok.Data;

/**
 * JavaBean元数据定义，记录候选Bean的行为信息
 *
 * @author zk
 */
@Data
public class BeanDefinition {

    /**
     * Bean的name(同时也是Id)
     */
    private String beanName;

    /**
     * Bean的字节码对象
     */
    public Class<?> beanClass;

    /**
     * Bean的全限制名
     */
    public String beanReferenceName;

    /**
     * 是否是抽象的
     */
    private boolean abstractFlag = false;

    /**
     * 是否是懒加载的
     */
    private boolean lazyInit = false;

    /**
     * Bean的作用域: 设置默认单例
     */
    private String scope = "singleton";

    public BeanDefinition(String beanName, Class<?> beanClass, String beanReferenceName) {
        this.beanName = beanName;
        this.beanClass = beanClass;
        this.beanReferenceName = beanReferenceName;
    }

    public BeanDefinition(String beanName, Class<?> beanClass, String beanReferenceName, boolean abstractFlag) {
        this.beanName = beanName;
        this.beanClass = beanClass;
        this.beanReferenceName = beanReferenceName;
        this.abstractFlag = abstractFlag;
    }

    public BeanDefinition(String beanName, Class<?> beanClass, String beanReferenceName, boolean lazyInit,  boolean abstractFlag) {
        this.beanName = beanName;
        this.beanClass = beanClass;
        this.beanReferenceName = beanReferenceName;
        this.lazyInit = lazyInit;
        this.abstractFlag = abstractFlag;
    }
}
```

><br/>
>
>**代码说明:**
>
>可以看出BeanDefinition就是一个简单的POJO(所以也被Lombok的@Data标注)
>
>下面对BeanDefinition包括的一些属性做简单说明:
>
>**① beanName**
>
>熟悉Spring的都知道, Spring中不能存在两个相同命名的Bean(这个name被作为beanId使用)
>
>**② beanClass**
>
>与beanName对应的类对象(后面通过反射创建对象)
>
>**③ beanReferenceName**
>
>Bean的全限定名
>
>**④ abstractFlag**
>
>Bean是否是抽象的(抽象类/接口无法创建实例!)
>
>**⑤ 是否是懒加载的**
>
>在Spring中单例bean默认不是懒加载的, 通常会在启动时进行初始化
>
>若标注为@Lazy, 则会在使用时才进行初始化
>
>**⑥ scope**
>
>Bean的作用域: **在Spring中默认Bean为单例**
>
>下面为Spring中五种作用域
>
>| **作用域**      | **描述**                                                     |
>| --------------- | ------------------------------------------------------------ |
>| **singleton**   | 在spring IoC容器仅存在一个Bean实例，Bean以单例方式存在，bean作用域范围的默认值 |
>| **prototype**   | **每次从容器中调用Bean时，都返回一个新的实例**，即每次调用getBean()时，相当于执行newXxxBean() |
>| **request**     | 每次**HTTP请求都会创建一个新的Bean**<br />该作用域仅适用于web的Spring WebApplicationContext环境 |
>| **session**     | **同一个HTTP Session共享一个Bean，不同Session使用不同的Bean**<br />该作用域仅适用于web的Spring WebApplicationContext环境 |
>| **application** | **限定一个Bean的作用域为`ServletContext`的生命周期**<br />该作用域仅适用于web的Spring WebApplicationContext环境 |

<br/>

## 五. Bean扫描器ClassPathBeanDefinitionScanner

当this()方法完成后，紧接着，我们开始进行包的扫描工作，也就是scan(basePackages)方法:

他是通过在AnnotationConfigApplicationContext类初始化的ClassPathBeanDefinitionScanner类的scan(basePackages)方法实现的

### ClassPathBeanDefinitionScanner代码

ClassPathBeanDefinitionScanner的代码如下:

ClassPathBeanDefinitionScanner.java

```java
package top.jasonkayzk.ioc.core.scanner;

import org.apache.commons.lang3.StringUtils;
import top.jasonkayzk.ioc.app.controller.CustomerController;
import top.jasonkayzk.ioc.core.annotation.MyComponent;
import top.jasonkayzk.ioc.core.annotation.MyController;
import top.jasonkayzk.ioc.core.annotation.MyLazy;
import top.jasonkayzk.ioc.core.annotation.MyRequestMapping;
import top.jasonkayzk.ioc.core.annotation.MyService;
import top.jasonkayzk.ioc.core.entity.BeanDefinition;
import top.jasonkayzk.ioc.core.entity.IocConstant;
import top.jasonkayzk.ioc.core.registry.BeanDefinitionRegistry;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.annotation.Annotation;
import java.lang.annotation.Documented;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import java.lang.reflect.Modifier;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Objects;
import java.util.Properties;
import java.util.Set;

/**
 * 类扫描器
 *
 * @author zk
 */
public class ClassPathBeanDefinitionScanner {

    /**
     * Bean注册表
     */
    private final BeanDefinitionRegistry registry;

    /**
     * 扫描包下所有的类的字节码对象(候选资源和非候选资源)
     */
    private final static Set<String> BASE_PACKAGE_CLASS_NAME = new HashSet<>();

    /**
     * 存储所有的候选资源的名称
     */
    private final static Set<String> BEAN_DEFINITION_NAMES = new HashSet<>();

    public ClassPathBeanDefinitionScanner(BeanDefinitionRegistry registry) {
        this.registry = registry;
    }

    /**
     * 开始进行包扫描
     *
     * @param basePackages 包的路径
     */
    public void scan(String[] basePackages) {
        doScan(basePackages);
    }

    /**
     * 获取所有的候选资源元数据信息
     *
     * @param basePackages 包的路径
     */
    private void doScan(String[] basePackages) {
        Set<BeanDefinition> candidates = new HashSet<>();

        // 扫描并注册配置文件
        Properties properties = findAllConfigurationFile();
        registry.registerProperties(properties);

        // 扫描所有的候选资源列表
        findCandidateComponents(basePackages, candidates);

        // 将扫描出来的候选资源信息添加到注册表中
        candidates.forEach(beanDefinition -> registry.registerBeanDefinition(beanDefinition.getBeanName(), beanDefinition));
    }

    /**
     * 获取所有的候选资源源数据信息
     *
     * @param basePackages 需要扫描的包的候选资源信息
     */
    private void findCandidateComponents(String[] basePackages, Set<BeanDefinition> candidates) {
        // 加载所有class
        for (String basePackage : basePackages) {
            loadClass(basePackage);
        }

        // 获取到需要扫描的包路径下所有的类后
        // 开始挑选出需要所有的候选资源信息: BeanDefinition
        BASE_PACKAGE_CLASS_NAME.forEach(packageClassName -> {
            try {
                Class<?> packageClass = Class.forName(packageClassName);

                // 判断是否是候选资源(携带指定注解: @MyComponent, @MyService)
                Class<?> annos = getAnnos(packageClass);
                if (!Objects.isNull(annos)) {
                    String beanName;
                    // 被@MyComponent标注, 并且@MyComponent的name(id)不为空
                    // 按照@MyComponent的name来注册beanName;
                    if (annos.getTypeName().equals(MyComponent.class.getTypeName()) && StringUtils.isNotEmpty(packageClass.getAnnotation(MyComponent.class).name())) {
                        beanName = packageClass.getAnnotation(MyComponent.class).name();
                        // 被@MyService标注, 并且@MyService的name(id)不为空
                        // 按照@MyService的name来注册beanName;
                    } else if (annos.getTypeName().equals(MyService.class.getTypeName()) && StringUtils.isNotEmpty(packageClass.getAnnotation(MyService.class).name())) {
                        beanName = packageClass.getAnnotation(MyService.class).name();
                    } else {
                        // 否则name为空, 按照类名首字母变成小写创建Bean
                        // (此处注意: 由于是单例, 这样做一定不会重复!!!)
                        beanName = toLowercaseIndex(packageClass.getSimpleName());
                    }

                    // 如果BEAN_DEFINITION_NAMES集合中存在了beanName
                    // 说明beanName声明重复!
                    if (BEAN_DEFINITION_NAMES.contains(beanName)) {
                        throw new RuntimeException("beanName已经存在：" + beanName);
                    }

                    // 判断当前类是否是抽象的
                    boolean isAbstract = false;
                    if (Modifier.isAbstract(packageClass.getModifiers())) {
                        isAbstract = true;
                    }

                    // 判断是否是懒加载的
                    if (packageClass.isAnnotationPresent(MyLazy.class)) {
                        candidates.add(new BeanDefinition(beanName, packageClass, packageClassName, true, isAbstract));
                    } else {
                        candidates.add(new BeanDefinition(beanName, packageClass, packageClassName, isAbstract));
                    }

                    // 加入Bean
                    BEAN_DEFINITION_NAMES.add(beanName);
                }
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            }
        });
    }

    /**
     * 类名首字母转小写
     *
     * @param name 类名
     * @return 类名首字母转小写后的字符串
     */
    public static String toLowercaseIndex(String name) {
        if (StringUtils.isNotEmpty(name)) {
            return name.substring(0, 1).toLowerCase() + name.substring(1);
        }
        return name;
    }

    /**
     * 扫描配置文件
     * <p>
     * 从这里可以看出优先级:
     * <p>
     * include >> active >> 默认
     */
    private Properties findAllConfigurationFile() {
        Properties properties = new Properties();
        InputStream is = null, is1 = null;
        try {
            // 寻找: "application.properties"文件
            is = this.getClass().getClassLoader().getResourceAsStream("application.properties");
            if (!Objects.isNull(is)) {
                InputStreamReader inputStreamReader = new InputStreamReader(is, StandardCharsets.UTF_8);
                properties.load(inputStreamReader);
            }
            // 如果properties中存在IocConstant.ACTIVE("spring.profiles.active")
            // 需要扫描application-${spring.profiles.active}.properties配置
            if (properties.containsKey(IocConstant.ACTIVE) && !Objects.isNull(properties.get(IocConstant.ACTIVE))) {
                is1 = this.getClass().getClassLoader().getResourceAsStream("application-" + properties.get(IocConstant.ACTIVE) + ".properties");
                if (!Objects.isNull(is1)) {
                    InputStreamReader inputStreamReader = new InputStreamReader(is1, StandardCharsets.UTF_8);
                    properties.load(inputStreamReader);
                }
            }
            // 如果properties中存在IocConstant.INCLUDE("spring.profiles.include")
            // 需要扫描application-${spring.profiles.include}.properties配置
            if (properties.containsKey(IocConstant.INCLUDE) && !Objects.isNull(properties.get(IocConstant.INCLUDE))) {
                is1 = this.getClass().getClassLoader().getResourceAsStream("application-" + properties.get(IocConstant.INCLUDE) + ".properties");
                if (!Objects.isNull(is1)) {
                    InputStreamReader inputStreamReader = new InputStreamReader(is1, StandardCharsets.UTF_8);
                    properties.load(inputStreamReader);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (is != null) {
                try {
                    is.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            if (is1 != null) {
                try {
                    is1.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
        return properties;
    }

    /**
     * 加载所有的候选资源信息
     *
     * @param basePackage 需要扫描的包的候选资源信息
     */
    private void loadClass(String basePackage) {
        URL url = this.getClass().getClassLoader().getResource(basePackage.replaceAll("\\.", "/"));
        File file = new File(Objects.requireNonNull(url).getFile());
        if (file.exists() && file.isDirectory()) {
            File[] files = file.listFiles();
            for (File fileSon : Objects.requireNonNull(files)) {
                if (fileSon.isDirectory()) {
                    // 递归扫描
                    loadClass(basePackage + "/" + fileSon.getName());
                } else {
                    // 是文件并且是以 .class结尾
                    if (fileSon.getName().endsWith(".class")) {
                        String beanReferenceName = basePackage.replace("/", ".") + "." + fileSon.getName().replaceAll(".class", "");
                        System.out.println("正在读取class文件： " + beanReferenceName);
                        BASE_PACKAGE_CLASS_NAME.add(beanReferenceName);
                    }
                }
            }
        } else {
            throw new RuntimeException("没有找到需要扫描的文件目录");
        }
    }

    /**
     * 判断当前类是否包含组合注解: @MyComponent
     * 注意: interface java.lang.annotation.Documented等存在循环，会导致内存溢出，所以需要排除java的源注解
     *
     * @param clazz 类对象
     */
    private static Class<?> getAnnos(Class<?> clazz) {
        Annotation[] annotations = clazz.getAnnotations();
        for (Annotation annotation : annotations) {
            if (annotation.annotationType() != Deprecated.class &&
                    annotation.annotationType() != SuppressWarnings.class &&
                    annotation.annotationType() != Override.class &&
                    annotation.annotationType() != Target.class &&
                    annotation.annotationType() != Retention.class &&
                    annotation.annotationType() != Documented.class &&
                    annotation.annotationType() != Inherited.class &&
                    annotation.annotationType() != MyRequestMapping.class
            ) {
                if (annotation.annotationType() == MyComponent.class) {
                    return clazz;
                } else {
                    return getAnnos(annotation.annotationType());
                }
            }
        }
        return null;
    }
}
```

ClassPathBeanDefinitionScanner的代码也是比较多哈…我们一点一点来分析

****

### **Scanner的功能**

首先再说一下ClassPathBeanDefinitionScanner的功能:

-   首先扫描并注册配置文件(Spring中默认是application.properties)
-   其次通过扫描给定的basePackages数组给出的包路径, 找到被注解的类
-   然后通过构造器传入的beanRegistry对bean的BeanDefinition进行注册

****

### **Scanner的属性**

Scanner包括的属性有:

-   BeanDefinitionRegistry registry: Bean注册表
-   BASE_PACKAGE_CLASS_NAME: 扫描包下所有的类的字节码对象(候选资源和非候选资源)
-   BEAN_DEFINITION_NAMES: 存储所有的候选资源的名称

><br/>
>
>此处需要注意的是:
>
><font color="#f00">**registry并不是在Scanner中初始化的, 而是Context初始化之后, 通过Scanner的构造器传递给Scanner的!**</font>
>
><font color="#f00">**即: 最终Scanner扫描的BeanDefinition会直接传入Context的registry中!**</font>

****

### **doScan()方法**

scan()方法调用了doScan()方法

而doScan()是Scanner的核心方法, context正是通过这个方法完成了包的扫描

下面是doScan()方法

```java
/**
     * 获取所有的候选资源元数据信息
     *
     * @param basePackages 包的路径
     */
private void doScan(String[] basePackages) {
    Set<BeanDefinition> candidates = new HashSet<>();

    // 扫描并注册配置文件
    Properties properties = findAllConfigurationFile();
    registry.registerProperties(properties);

    // 扫描所有的候选资源列表
    findCandidateComponents(basePackages, candidates);

    // 将扫描出来的候选资源信息添加到注册表中
    candidates.forEach(beanDefinition -> registry.registerBeanDefinition(beanDefinition.getBeanName(), beanDefinition));
}
```

可以很清楚的看到, doScan()方法正是一步一步实现了上述所说的Scanner的功能, 分别通过以下方法:

-   findAllConfigurationFile()
-   findCandidateComponents()
-   registry.registerBeanDefinition()

下面一一来看:

**① findAllConfigurationFile()**

此方法完成了从classpath中读取并载入配置文件

熟悉Spring的人都知道, 默认的配置文件是application.properties

下面来看这个方法:

```java
/**
     * 扫描配置文件
     * <p>
     * 从这里可以看出优先级:
     * <p>
     * include >> active >> 默认
     */
private Properties findAllConfigurationFile() {
    Properties properties = new Properties();
    InputStream is = null, is1 = null;
    try {
        // 寻找: "application.properties"文件
        is = this.getClass().getClassLoader().getResourceAsStream("application.properties");
        if (!Objects.isNull(is)) {
            InputStreamReader inputStreamReader = new InputStreamReader(is, StandardCharsets.UTF_8);
            properties.load(inputStreamReader);
        }
        // 如果properties中存在IocConstant.ACTIVE("spring.profiles.active")
        // 需要扫描application-${spring.profiles.active}.properties配置
        if (properties.containsKey(IocConstant.ACTIVE) && !Objects.isNull(properties.get(IocConstant.ACTIVE))) {
            is1 = this.getClass().getClassLoader().getResourceAsStream("application-" + properties.get(IocConstant.ACTIVE) + ".properties");
            if (!Objects.isNull(is1)) {
                InputStreamReader inputStreamReader = new InputStreamReader(is1, StandardCharsets.UTF_8);
                properties.load(inputStreamReader);
            }
        }
        // 如果properties中存在IocConstant.INCLUDE("spring.profiles.include")
        // 需要扫描application-${spring.profiles.include}.properties配置
        if (properties.containsKey(IocConstant.INCLUDE) && !Objects.isNull(properties.get(IocConstant.INCLUDE))) {
            is1 = this.getClass().getClassLoader().getResourceAsStream("application-" + properties.get(IocConstant.INCLUDE) + ".properties");
            if (!Objects.isNull(is1)) {
                InputStreamReader inputStreamReader = new InputStreamReader(is1, StandardCharsets.UTF_8);
                properties.load(inputStreamReader);
            }
        }
    } catch (Exception e) {
        e.printStackTrace();
    } finally {
        if (is != null) {
            try {
                is.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        if (is1 != null) {
            try {
                is1.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
    return properties;
}
```

><br/>
>
>**代码说明:**
>
>**①** 方法首先会寻找: "application.properties"文件, 如果找到则会解析其中配置(properties.load()方法)
>
>**②** **之后,** 如果properties中存在IocConstant.ACTIVE("spring.profiles.active"), 则会扫描application-${spring.profiles.active}.properties配置
>
>**③** **之后,** 如果properties中存在IocConstant.INCLUDE("spring.profiles.include"), 则会扫描application-${spring.profiles.include}.properties配置
>
>**需要注意的是properties.load()方法:**
>
><font color="#f00">**对于同一个properties对象, 多次调用load()方法仅仅会覆盖掉key相同的属性, load多个不同的流的不同属性则会叠加属性(而不是覆盖!)**</font>
>
><font color="#f00">**所以从这里也可以看出Spring的配置优先级: `include >> active >> 默认`, 因为后面的属性可能覆盖前面的属性**</font>

****

**② findCandidateComponents()**

通过findAllConfigurationFile()方法加载过所有的配置文件之后, 接下来进行Bean的扫描

findCandidateComponents()方法:

```java
/**
     * 获取所有的候选资源源数据信息
     *
     * @param basePackages 需要扫描的包的候选资源信息
     */
private void findCandidateComponents(String[] basePackages, Set<BeanDefinition> candidates) {
    // 加载所有class
    for (String basePackage : basePackages) {
        loadClass(basePackage);
    }

    // 获取到需要扫描的包路径下所有的类后
    // 开始挑选出需要所有的候选资源信息: BeanDefinition
    BASE_PACKAGE_CLASS_NAME.forEach(packageClassName -> {
        try {
            Class<?> packageClass = Class.forName(packageClassName);

            // 判断是否是候选资源(携带指定注解: @MyComponent, @MyService)
            Class<?> annos = getAnnos(packageClass);
            if (!Objects.isNull(annos)) {
                String beanName;
                // 被@MyComponent标注, 并且@MyComponent的name(id)不为空
                // 按照@MyComponent的name来注册beanName;
                if (annos.getTypeName().equals(MyComponent.class.getTypeName()) && StringUtils.isNotEmpty(packageClass.getAnnotation(MyComponent.class).name())) {
                    beanName = packageClass.getAnnotation(MyComponent.class).name();
                    // 被@MyService标注, 并且@MyService的name(id)不为空
                    // 按照@MyService的name来注册beanName;
                } else if (annos.getTypeName().equals(MyService.class.getTypeName()) && StringUtils.isNotEmpty(packageClass.getAnnotation(MyService.class).name())) {
                    beanName = packageClass.getAnnotation(MyService.class).name();
                } else {
                    // 否则name为空, 按照类名首字母变成小写创建Bean
                    // (此处注意: 由于是单例, 这样做一定不会重复!!!)
                    beanName = toLowercaseIndex(packageClass.getSimpleName());
                }

                // 如果BEAN_DEFINITION_NAMES集合中存在了beanName
                // 说明beanName声明重复!
                if (BEAN_DEFINITION_NAMES.contains(beanName)) {
                    throw new RuntimeException("beanName已经存在：" + beanName);
                }

                // 判断当前类是否是抽象的
                boolean isAbstract = false;
                if (Modifier.isAbstract(packageClass.getModifiers())) {
                    isAbstract = true;
                }

                // 判断是否是懒加载的
                if (packageClass.isAnnotationPresent(MyLazy.class)) {
                    candidates.add(new BeanDefinition(beanName, packageClass, packageClassName, true, isAbstract));
                } else {
                    candidates.add(new BeanDefinition(beanName, packageClass, packageClassName, isAbstract));
                }

                // 加入Bean
                BEAN_DEFINITION_NAMES.add(beanName);
            }
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    });
}
```

><br/>
>
>**代码说明:**
>
>**① 加载所有Class**
>
>findCandidateComponents()方法首先**通过loadClass()方法递归加载所有指定的basePackages中的Class类:**
>
>```java
>/**
>     * 加载所有的候选资源信息
>     *
>     * @param basePackage 需要扫描的包的候选资源信息
>     */
>private void loadClass(String basePackage) {
>    URL url = this.getClass().getClassLoader().getResource(basePackage.replaceAll("\\.", "/"));
>    File file = new File(Objects.requireNonNull(url).getFile());
>    if (file.exists() && file.isDirectory()) {
>        File[] files = file.listFiles();
>        for (File fileSon : Objects.requireNonNull(files)) {
>            if (fileSon.isDirectory()) {
>                // 递归扫描
>                loadClass(basePackage + "/" + fileSon.getName());
>            } else {
>                // 是文件并且是以 .class结尾
>                if (fileSon.getName().endsWith(".class")) {
>                    String beanReferenceName = basePackage.replace("/", ".") + "." + fileSon.getName().replaceAll(".class", "");
>                    System.out.println("正在读取class文件： " + beanReferenceName);
>                    BASE_PACKAGE_CLASS_NAME.add(beanReferenceName);
>                }
>            }
>        }
>    } else {
>        throw new RuntimeException("没有找到需要扫描的文件目录");
>    }
>}
>```
>
>**将扫描到的所有类加入BASE_PACKAGE_CLASS_NAME集合中!**
>
>****
>
>**② 挑选出需要的候选资源信息**
>
>遍历刚刚扫描创建的BASE_PACKAGE_CLASS_NAME集合中的Class, **通过getAnnos()方法反射获取注解然后检查是否含有特定注解**
>
>getAnnos()方法:
>
>```java
>/**
>     * 判断当前类是否包含组合注解: @MyComponent
>     * 注意: interface java.lang.annotation.Documented等存在循环，会导致内存溢出，所以需要排除java的源注解
>     *
>     * @param clazz 类对象
>     */
>private static Class<?> getAnnos(Class<?> clazz) {
>    Annotation[] annotations = clazz.getAnnotations();
>    for (Annotation annotation : annotations) {
>        if (annotation.annotationType() != Deprecated.class &&
>            annotation.annotationType() != SuppressWarnings.class &&
>            annotation.annotationType() != Override.class &&
>            annotation.annotationType() != Target.class &&
>            annotation.annotationType() != Retention.class &&
>            annotation.annotationType() != Documented.class &&
>            annotation.annotationType() != Inherited.class &&
>            annotation.annotationType() != MyRequestMapping.class
>           ) {
>            if (annotation.annotationType() == MyComponent.class) {
>                return clazz;
>            } else {
>                return getAnnos(annotation.annotationType());
>            }
>        }
>    }
>    return null;
>}
>```
>
>如果含有特定注解, 则进行以下几个判断:
>
>1.  **注解是否含有name属性:**
>    -   如果含有, 则使用用户指定的name(反射获取)创建Bean**(确实是使用name创建BeanDefinition)**
>    -   否则按照类名首字母变成小写创建Bean**(由于是单例, 这样做name一定不会重复!!!)**
>2.  经过了上一步保证了一定获取了beanName, 接下来判断beanName是否重复:
>    -   **如果已经存在beanName, 直接报错(不能存在相同beanId)**
>3.  反射判断当前Bean是否是抽象的(isAbstract)
>4.  通过注解判断是否是懒加载的
>
>可以看出上面的几个判断正是创建一个BeanDefinition的过程, 所以最后将Bean加入BEAN_DEFINITION_NAME和candidates中

### **进行Bean注册**

在findCandidateComponents()方法返回之后, 方法返回到doScan()方法中

而经过了上述几个步骤, 最终在candidates中加入了所以符合预期的BeanDefinition

所以只需要遍历candidates集合, 将BeanDefinition注册到(也是context中的)registry即可!

>   <br/>
>
>   至此, Scanner完成了他的使命!

<br/>

## 六. Bean的创建和注入

在上面的两个步骤中，我们完成了容器的初始化、类加载以及BeanDefinition创建的步骤, 现在我们就可以开始进行Bean的注入工作了

即调用AnnotationConfigApplicationContext类中有参构造refresh()方法**(此时，调用的是其父类AbstractApplicationContext中的refresh方法)**

**在spring源码中，refresh()方法一共有12个步骤，**在这里我们就不整那么复杂了, 就直接完成第11步操作finishBeanFactoryInitialization(beanFactory)实例化所有的单例Bean；

### DefaultListableBeanFactory代码

在这里，我们调用beanFactory的preInstantiateSingletons()方法，下面是完整的DefaultListableBeanFactory类的代码:

DefaultListableBeanFactory.java

```java
package top.jasonkayzk.ioc.core.factory;

import top.jasonkayzk.ioc.core.annotation.MyAutowired;
import top.jasonkayzk.ioc.core.entity.BeanDefinition;
import top.jasonkayzk.ioc.core.processor.BeanPostProcessor;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import static top.jasonkayzk.ioc.core.scanner.ClassPathBeanDefinitionScanner.toLowercaseIndex;

/**
 * Spring中默认的Bean的工厂类
 *
 * @author zk
 */
public class DefaultListableBeanFactory implements BeanFactory {

    /**
     * 一级缓存
     * 用于存放完全初始化好的Bean，从该缓存中拿出来的Bean可以直接使用
     */
    private final Map<String, Object> singletonObjects = new ConcurrentHashMap<>(256);

    /**
     * 二级缓存:
     * 存储的原始的Bean(还未完全填充属性),
     * 用于解决Spring中的循环依赖问题，此时已经分配了内存地址
     * <p>
     * Cache of early singleton objects: bean name --> bean instance
     */
    private final Map<String, Object> earlySingletonObjects = new HashMap<>(16);

    /**
     * 三级缓存:
     * 单例对象工厂的cache，存放bean工厂对象，用于解决循环依赖
     * Cache of singleton factories: bean name --> ObjectFactory
     */
    private final Map<String, Object> singletonFactories = new HashMap<>(16);

    /**
     * 保存所有BeanPostProcessor
     */
    private Set<BeanPostProcessor> beanPostProcessorSet = new HashSet<>(16);

    /**
     * Bean的源数据集合，存储的是扫描器扫描的类的源数据信息
     */
    public final Map<String, BeanDefinition> beanDefinitionMap = new ConcurrentHashMap<>(128);

    /**
     * 配置文件
     */
    private Properties properties = null;

    /**
     * 动态向候选资源集合中添加候选数据
     *
     * @param beanName       bean名称
     * @param beanDefinition bean元数据实例
     */
    public void registerBeanDefinition(String beanName, BeanDefinition beanDefinition) {
        this.beanDefinitionMap.put(beanName, beanDefinition);
    }

    /**
     * 注册配置文件
     *
     * @param properties 配置文件
     */
    public void registerProperties(Properties properties) {
        this.properties = properties;
    }

    @Override
    public Object getBean(String beanName) {
        return doGetBean(beanName);
    }

    @Override
    public Object doGetBean(String beanName) {
        // 一级缓存寻找, 存在则直接返回
        if (singletonObjects.containsKey(beanName)) {
            return this.singletonObjects.get(beanName);
        }
        // 一级缓存不存在, 创建
        return this.createBean(beanName);
    }

    @Override
    public Object createBean(String beanName) {
        return doCreateBean(beanName);
    }

    @Override
    public Object doCreateBean(String beanName) {
        synchronized (DefaultListableBeanFactory.class) {
            // 先判断当前对象是否正在被创建
            // 因为这是一个synchronized方法, 如果存在当前对象则说明出现了循环依赖
            // A -> B -> A
            // 包括两个判断: 二级缓存(原始的Bean[还未完全填充属性])的创建和三级缓存Bean的工厂类的缓存
            if (earlySingletonObjects.containsKey(beanName) || singletonFactories.containsKey(beanName)) {
                throw new RuntimeException("IOC容器中存在循环依赖异常 beanName=" + beanName);
            }

            // 添加到三级缓存中，标记当前Bean正准备创建
            singletonFactories.put(beanName, "");
            // Bean的定义元数据
            BeanDefinition beanDefinition = beanDefinitionMap.get(beanName);
            if (Objects.isNull(beanDefinition)) {
                // 无Bean的定义则直接返回
                return null;
            }

            // 获取Bean
            Object beanObj = null;
            try {
                // 通过beanDefinition获取对应类的Class, 并通过反射生成对象
                // 此方法在JDK 9过时:
                // beanObj = beanDefinition.getBeanClass().newInstance();
                // 推荐使用clazz.getDeclaredConstructor().newInstance()创建
                beanObj = beanDefinition.getBeanClass().getDeclaredConstructor().newInstance();

                // 如果Bean实现了后置处理器, 添加到beanPostProcessorSet中(进行后置处理)
                if (beanObj instanceof BeanPostProcessor) {
                    beanPostProcessorSet.add((BeanPostProcessor) beanObj);
                }

                // 添加到二级缓存中，标记当前Bean正在被创建，只是还没有完全填充属性
                earlySingletonObjects.put(beanName, beanObj);
                // 由于是单例, 直接删除了这个Bean的工厂类实例(因为已经创建了Bean)
                singletonFactories.remove(beanName);

                // 进行属性填充
                // 属性填充后，有可能对象被反射之类的或者是产生了代理对象!
                populateBean(beanObj);

                // 进行Bean的后置处理器处理
                initializeBeanPostProcessor(beanName, beanObj);

                // 属性填充完毕后，保存当前对象到一级缓存中，表示当前Bean可以直接拿出来使用
                singletonObjects.put(beanName, beanObj);
                earlySingletonObjects.remove(beanName);
            } catch (InstantiationException | NoSuchMethodException | IllegalAccessException | InvocationTargetException e) {
                e.printStackTrace();
            }
            return beanObj;
        }
    }

    /**
     * 实例化所有单例非懒加载的bean
     * (在context中进行)
     */
    public void preInstantiateSingletons() {
        // 获取所有的候选资源Bean的名称
        Set<String> beanNames = beanDefinitionMap.keySet();
        beanNames.forEach(beanName -> {
            BeanDefinition bd = beanDefinitionMap.get(beanName);
            // 如果不是抽象的，并且是单例的，并且不是懒加载的Bean
            // 抽象类不能被实例化，只能被继承
            if (!Objects.isNull(bd) && !bd.isAbstractFlag() && !bd.isLazyInit()) {
                getBean(beanName);
            }
        });
    }

    /**
     * 完成Bean的后置处理器工作
     *
     * @param beanName bean名称
     * @param beanObj  操作的bean对象
     */
    private void initializeBeanPostProcessor(String beanName, Object beanObj) {
        // 遍历beanPostProcessorSet
        // 完成所有(Init前)Bean的后置处理器工作
        for (BeanPostProcessor beanPostProcessor : beanPostProcessorSet) {
            beanObj = beanPostProcessor.postProcessBeforeInitialization(beanObj, beanName);
        }

        // 执行Bean的init方法
        System.out.println("假设正在执行" + beanName + "的init方法.....");

        // 遍历beanPostProcessorSet
        // 完成所有(Init后)Bean的后置处理器工作
        for (BeanPostProcessor beanPostProcessor : beanPostProcessorSet) {
            beanObj = beanPostProcessor.postProcessAfterInitialization(beanObj, beanName);
        }
    }

    /**
     * 对当前Bean进行依赖注入
     *
     * @param beanObj 此处返回当前Bean，后期如果有更改，可能返回是一个代理类
     */
    private void populateBean(Object beanObj) throws IllegalAccessException {
        // 反射获取Bean的所有属性
        Field[] fields = beanObj.getClass().getDeclaredFields();

        // 遍历属性并进行依赖注入
        for (Field field : fields) {
            // 将access改为true(防止private属性)
            field.setAccessible(true);

            // 判断当前属性是否需要进行依赖注入
            // 有无@MyAutowired注解
            if (field.isAnnotationPresent(MyAutowired.class)) {
                // 类名首字母转小写字符串
                String simpleName = toLowercaseIndex(field.getType().getSimpleName());

                // 先判断当前属性类型名称小写是否在候选资源中
                Set<String> beanDefinitionNames = beanDefinitionMap.keySet();
                // 如果候选资源中不存在
                if (!beanDefinitionNames.contains(simpleName)) {
                    // 通过全名寻找Bean实例
                    simpleName = toLowercaseIndex(field.getName());
                    if (!beanDefinitionNames.contains(simpleName)) {
                        // 注入的属性的类型名称小写和属性名称都不在候选资源中
                        throw new RuntimeException("当前类" + beanObj + "找不到属性类型" + field.getType() + "的Bean");
                    }
                }

                // 否则候选资源中存在
                // 一级缓存查找: 判断依赖的Bean是否已经被创建好可以直接被使用了
                if (singletonObjects.containsKey(simpleName)) {
                    field.set(beanObj, singletonObjects.get(simpleName));
                    // 查看二级缓存中是否存在
                } else if (earlySingletonObjects.containsKey(simpleName)) {
                    field.set(beanObj, earlySingletonObjects.get(simpleName));
                } else {
                    // 上面通过全名寻找的Bean实例(一级缓存)
                    field.set(beanObj, getBean(simpleName));
                }
            }
        }
    }
}
```

其中包括一个Bean的后置处理器接口BeanPostProcessor:

```java
/**
 * Bean的后置处理器
 *
 * @author zk
 */
public interface BeanPostProcessor {
    /**
     * Bean的初始化前置处理
     * @param bean JavaBean
     * @param beanName bean名称
     * @return 初始化前对bean进行处理
     */
    public Object postProcessBeforeInitialization(Object bean, String beanName);

    /**
     * Bean的初始化的后置处理
     * @param bean JavaBean
     * @param beanName bean名称
     * @return 初始化后对bean进行处理
     */
    public Object postProcessAfterInitialization(Object bean, String beanName);
}
```

BeanPostProcessor主要完成Bean在初始化前和初始化后的一些操作

下面我们来着重看一下DefaultListableBeanFactory:

**① DefaultListableBeanFactory的属性**

前面已经提到过, 在DefaultListableBeanFactory中有几个比较重要的集合:

| **集合名称**              |   **作用**   | **详细说明**                                                 |
| :------------------------ | :----------: | :----------------------------------------------------------- |
| **singletonObjects**      | **一级缓存** | 用于**存放完全初始化好的Bean**，从该缓存中拿出来的Bean可以直接使用 |
| **earlySingletonObjects** | **二级缓存** | **存储的原始的Bean(还未完全填充属性)**<br /><font color="#f00">**用于解决Spring中的循环依赖问题，此时已经分配了内存地址**</font> |
| **singletonFactories**    | **三级缓存** | **单例对象工厂的cache，存放bean工厂对象**<br />**用于解决循环依赖** |
| **beanDefinitionMap**     |              | Bean的源数据集合，存储的是扫描器扫描的类的源数据信息         |
| **beanPostProcessorSet**  |              | 保存所有BeanPostProcessor                                    |

分别用于: 记录Bean的创建过程和所有的Bean的候选资源集合以及所有的Bean的后置处理器;

而properties是通过前面Scanner初始化的配置信息

****

**② 实例化所有非懒加载的Bean**

前面说到context初始化最后一个方法是调用refresh()方法创建和注入bean, 而refresh方法内部最终就是调用的BeanFactory的preInstantiateSingletons()方法完成bean的初始化

preInstantiateSingletons()方法:

```java
/**
     * 实例化所有单例非懒加载的bean
     * (在context中进行)
     */
public void preInstantiateSingletons() {
    // 获取所有的候选资源Bean的名称
    Set<String> beanNames = beanDefinitionMap.keySet();
    beanNames.forEach(beanName -> {
        BeanDefinition bd = beanDefinitionMap.get(beanName);
        // 如果不是抽象的，并且是单例的，并且不是懒加载的Bean
        // 抽象类不能被实例化，只能被继承
        if (!Objects.isNull(bd) && !bd.isAbstractFlag() && !bd.isLazyInit()) {
            getBean(beanName);
        }
    });
}
```

可见在preInstantiateSingletons方法中是通过**遍历BeanDefinitionMap集合, 判断: 不是抽象的，并且是单例的，并且不是懒加载的Bean, 来通过getBean创建**

下面来看看getBean()方法;

****

**③ 获取Bean**

获取bean主要是通过getBean()方法, 其内部是通过doGetBean()方法实现:

```java
@Override
public Object getBean(String beanName) {
    return doGetBean(beanName);
}

@Override
public Object doGetBean(String beanName) {
    // 一级缓存寻找, 存在则直接返回
    if (singletonObjects.containsKey(beanName)) {
        return this.singletonObjects.get(beanName);
    }
    // 一级缓存不存在, 创建
    return this.createBean(beanName);
}
```

可以看到doGetBean的方法非常简单: 一级缓存存在直接取, 一级缓存不存在则通过createBean()方法创建;

****

**④ 创建Bean**

创建bean主要是通过createBean()方法, 其内部是通过doCreateBean()方法实现:

```java
@Override
public Object createBean(String beanName) {
    return doCreateBean(beanName);
}

@Override
public Object doCreateBean(String beanName) {
    synchronized (DefaultListableBeanFactory.class) {
        // 先判断当前对象是否正在被创建
        // 因为这是一个synchronized方法, 如果存在当前对象则说明出现了循环依赖
        // A -> B -> A
        // 包括两个判断: 二级缓存(原始的Bean[还未完全填充属性])的创建和三级缓存Bean的工厂类的缓存
        if (earlySingletonObjects.containsKey(beanName) || singletonFactories.containsKey(beanName)) {
            throw new RuntimeException("IOC容器中存在循环依赖异常 beanName=" + beanName);
        }

        // 添加到三级缓存中，标记当前Bean正准备创建
        singletonFactories.put(beanName, "");
        // Bean的定义元数据
        BeanDefinition beanDefinition = beanDefinitionMap.get(beanName);
        if (Objects.isNull(beanDefinition)) {
            // 无Bean的定义则直接返回
            return null;
        }

        // 获取Bean
        Object beanObj = null;
        try {
            // 通过beanDefinition获取对应类的Class, 并通过反射生成对象
            // 此方法在JDK 9过时:
            // beanObj = beanDefinition.getBeanClass().newInstance();
            // 推荐使用clazz.getDeclaredConstructor().newInstance()创建
            beanObj = beanDefinition.getBeanClass().getDeclaredConstructor().newInstance();

            // 如果Bean实现了后置处理器, 添加到beanPostProcessorSet中(进行后置处理)
            if (beanObj instanceof BeanPostProcessor) {
                beanPostProcessorSet.add((BeanPostProcessor) beanObj);
            }

            // 添加到二级缓存中，标记当前Bean正在被创建，只是还没有完全填充属性
            earlySingletonObjects.put(beanName, beanObj);
            // 由于是单例, 直接删除了这个Bean的工厂类实例(因为已经创建了Bean)
            singletonFactories.remove(beanName);

            // 进行属性填充
            // 属性填充后，有可能对象被反射之类的或者是产生了代理对象!
            populateBean(beanObj);

            // 进行Bean的后置处理器处理
            initializeBeanPostProcessor(beanName, beanObj);

            // 属性填充完毕后，保存当前对象到一级缓存中，表示当前Bean可以直接拿出来使用
            singletonObjects.put(beanName, beanObj);
            earlySingletonObjects.remove(beanName);
        } catch (InstantiationException | NoSuchMethodException | IllegalAccessException | InvocationTargetException e) {
            e.printStackTrace();
        }
        return beanObj;
    }
}
```

>   <br/>
>
>   **doCreateBean()方法分析:**
>
>   要先说明的是doCreateBean是synchronized方法, 这样保证了并发时创建Bean的正确性
>
>   **① 判断当前对象是否正在被创建**
>
>   方法首先判断当前对象是否正在被创建:
>
>   包括两个判断: 二级缓存(原始的Bean[还未完全填充属性])的创建和三级缓存Bean的工厂类的缓存**(正准备创建的Bean在二级缓存或者三级缓存中)**
>
>   <font color="#f00">**如果存在, 则说明当前对象已经处于正在创建的状态! 此时产生了循环依赖(注意到此方法是synchronized!), 这时应当报错!**</font>
>
>   如果不存在, 则**将beanName添加到三级缓存中，标记当前Bean正准备创建**
>
>   ****
>
>   **② 判断BeanDefinition集合中是否存在当前Bean**
>
>   如果不存在, 则说明无此Bean的定义, 这时无法构造此Bean, 直接返回null;
>
>   ****
>
>   **③ 获取Bean**
>
>   经过第②步, 确定了一定存在BeanDefinition这个类, 所以:
>
>   1.  **通过beanDefinition获取对应类的Class, 并通过反射生成对象**
>   2.  判断如果Bean实现了后置处理器, 添加到beanPostProcessorSet中(在后面进行后置处理)
>   3.  将beanName添加到二级缓存中**(标记当前Bean正在被创建，只是还没有完全填充属性)**
>   4.  删除这个Bean的工厂类实例(因为已经创建了Bean, 而创建的是单例)
>   5.  调用populateBean()方法进行属性填充(后面会讲这个方法)
>   6.  调用initializeBeanPostProcessor()方法进行Bean的后置处理器处理(后面会讲这个方法)
>   7.  属性填充完并进行Bean的后置处理器处理后，保存当前对象到一级缓存中，表示当前Bean可以直接拿出来使用
>   8.  二级缓存中删除原始的Bean
>   9.  返回生成的Bean

下面分析一下populateBean()和initializeBeanPostProcessor()方法, 这两个方法分别完成了: 对当前Bean进行依赖注入和完成Bean的后置处理器工作

****

**⑤ Bean依赖注入方法**

populateBean()方法完成了对当前bean的依赖注入:

```java
/**
     * 对当前Bean进行依赖注入
     *
     * @param beanObj 此处返回当前Bean，后期如果有更改，可能返回是一个代理类
     */
private void populateBean(Object beanObj) throws IllegalAccessException {
    // 反射获取Bean的所有属性
    Field[] fields = beanObj.getClass().getDeclaredFields();

    // 遍历属性并进行依赖注入
    for (Field field : fields) {
        // 将access改为true(防止private属性)
        field.setAccessible(true);

        // 判断当前属性是否需要进行依赖注入
        // 有无@MyAutowired注解
        if (field.isAnnotationPresent(MyAutowired.class)) {
            // 类名首字母转小写字符串
            String simpleName = toLowercaseIndex(field.getType().getSimpleName());

            // 先判断当前属性类型名称小写是否在候选资源中
            Set<String> beanDefinitionNames = beanDefinitionMap.keySet();
            // 如果候选资源中不存在
            if (!beanDefinitionNames.contains(simpleName)) {
                // 通过全名寻找Bean实例
                simpleName = toLowercaseIndex(field.getName());
                if (!beanDefinitionNames.contains(simpleName)) {
                    // 注入的属性的类型名称小写和属性名称都不在候选资源中
                    throw new RuntimeException("当前类" + beanObj + "找不到属性类型" + field.getType() + "的Bean");
                }
            }

            // 否则候选资源中存在
            // 一级缓存查找: 判断依赖的Bean是否已经被创建好可以直接被使用了
            if (singletonObjects.containsKey(simpleName)) {
                field.set(beanObj, singletonObjects.get(simpleName));
                // 查看二级缓存中是否存在
            } else if (earlySingletonObjects.containsKey(simpleName)) {
                field.set(beanObj, earlySingletonObjects.get(simpleName));
            } else {
                // 上面通过全名寻找的Bean实例(一级缓存)
                field.set(beanObj, getBean(simpleName));
            }
        }
    }
}
```

><br/>
>
>**代码说明:**
>
>方法首先通过反射获取Bean的所有属性fields;
>
>然后通过遍历属性并进行依赖注入:
>
>1.  将access改为true(防止private属性)
>2.  判断当前属性是否需要进行依赖注入(有无@MyAutowired注解)
>3.  获取此bean当前属性类型的BeanDefinition
>    -   如果不存在, 则通过全名寻找Bean实例<font color="#f00">**(此处这样设计的原因是想实现通过类的首字母小写注入和属性的名称注入两种方式；)**</font>
>    -   如果也不存在则报错(因为不存在可以@Autowired的类!)
>4.  经过上一步, 以及获取了当前属性的BeanDefinition, 所以根据缓存查找:
>    -   一级缓存查找: 判断依赖的Bean是否已经被创建好可以直接被使用了
>    -   一级缓存不存在: 查看二级缓存中是否存在
>    -   二级缓存不存在**(有可能是还未创建该Bean!)**: 通过getBean()方法创建该Bean;
>
>需要特别注意的是:
>
><font color="#f00">**在第四步二级缓存不存在时, 将会调用回getBean() -> createBean() -> doCreateBean()**</font>
>
><font color="#f00">**如果此时出现循环依赖, 就一定会在doCreateBean方法中出现重复的待初始化的Bean从而导致循环依赖被检测出来!**</font>
>
><font color="#f00">**注意到doCreateBean方法是同步的, 也可以看出synchronized是可重入的锁!**</font>
>
>**上面就是Spring中检测Bean循环依赖注入的原理!**

****

**⑥ 后置处理器工作方法**

initializeBeanPostProcessor()方法对已经经过populateBean方法填充过属性的bean进行后置处理:

```java
/**
     * 完成Bean的后置处理器工作
     *
     * @param beanName bean名称
     * @param beanObj  操作的bean对象
     */
private void initializeBeanPostProcessor(String beanName, Object beanObj) {
    // 遍历beanPostProcessorSet
    // 完成所有(Init前)Bean的后置处理器工作
    for (BeanPostProcessor beanPostProcessor : beanPostProcessorSet) {
        beanObj = beanPostProcessor.postProcessBeforeInitialization(beanObj, beanName);
    }

    // 执行Bean的init方法
    System.out.println("假设正在执行" + beanName + "的init方法.....");

    // 遍历beanPostProcessorSet
    // 完成所有(Init后)Bean的后置处理器工作
    for (BeanPostProcessor beanPostProcessor : beanPostProcessorSet) {
        beanObj = beanPostProcessor.postProcessAfterInitialization(beanObj, beanName);
    }
}
```

为简单起见, 这里使用System.out.println()模拟初始化方法, 实际在String中是通过反射调用Bean的Constructor实现的初始化!

这也说明了:

<font color="#f00">**postProcessBeforeInitialization() 在调用初始化方法前调用, 而postProcessAfterInitialization方法在初始化方法后调用**</font>

<font color="#f00">**注: 在调用Constructor方法之前Bean已经通过反射创建, 但只是放在二级缓存(未被进行属性注入!)**</font>

<font color="#f00">**经过此方法调用后置处理器处理后, 此方法返回, 将Bean从二级缓存删除, 加入一级缓存!**</font>

><br/>
>
>至此我们的AnnotationConfigApplicationContext完成初始化!
>
>当前IOC容器中，涉及到的类和涉及到的方法在spring源码中基本都可以找到，部分实现不太一样，因为spring源码中处理的逻辑太多太多了!

<br/>

**当然这里有一个小问题: @Lazy的Bean呢?**

应该能注意到: preInstantiateSingletons方法在实例化所有单例非懒加载的bean时, 跳过了@Lazy的bean**(通过BeanDefinition的isLazyInit属性)**

而在真正时候@Lazy的Bean时, 是通过getBean()获取的, 而getBean()会通过createBean()方法进行创建, 而此时才会真正创建此Bean!

## 七. 代码测试

经过上面的对IoC容器的构建, 下面通过一个测试来验证这个结果(为了验证的简单, 这里简化了代码)

### 定义几个Service方法

这里为了简单起见, 直接定义了XXXService为业务的实现类:

LazyService.java

```java
 // LazyService懒加载测试
@MyLazy
@MyComponent
public class LazyService {
    public LazyService() {
        System.out.println("测试懒加载: LazyService 的无参构造被执行");
    }
}
```

LazyService用于懒加载测试

****

UserService.java

```java
 // 提供myCustomer实例
@MyComponent
public class UserService {

    @MyAutowired
    private CustomerService myCustomer;

    public CustomerService getMyCustomer() {
        return myCustomer;
    }
}
```

CustomerService.java

```java
@MyService(name = "myCustomer")
public class CustomerService {

    @MyAutowired
    private UserService userService;
}
```

CustomerService指定创建的BeanName

同时UserService和CustomerService验证可能出现的循环依赖问题

****

### 控制器类

CustomerController.java

```java
@MyController
public class CustomerController {

    @MyAutowired
    private UserService userService;
}
```

****

### 后置处理器

```java
@MyComponent
public class MyBeanPostProcessor implements BeanPostProcessor {
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        System.out.println("正在处理" + beanName + "的初始化前的操作");
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        System.out.println("正在处理" + beanName + "的初始化后的操作");
        return bean;
    }
}
```

****

### 启动类

```java
public class IocApplication {

    public static void main(String[] args) {
        // 在指定包下扫描, 完成Bean创建, 注入等
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext("top.jasonkayzk.ioc.app");
        System.out.println("---------------容器创建完毕-------------------");

        // 测试类型首字母小写获取
        UserService userService = (UserService) context.getBean("userService");
        System.out.println(userService);

        // 测试自定义名称
        CustomerService customerService = (CustomerService) context.getBean("myCustomer");
        System.out.println(customerService);

        // 测试懒加载
        Object lazyService = context.getBean("lazyService");
        System.out.println(lazyService);

        // 测试循环依赖
        System.out.println("测试循环依赖  " + (customerService == userService.getMyCustomer()));
        System.out.println("--------------------------------------------------------");
        Set<String> beanDefinitionNames = context.getBeanDefinitionNames();
        beanDefinitionNames.forEach(System.out::println);
    }
}
```

允许启动类, 最终输出:

```
正在读取class文件： top.jasonkayzk.ioc.app.service.LazyService
正在读取class文件： top.jasonkayzk.ioc.app.service.CustomerService
正在读取class文件： top.jasonkayzk.ioc.app.service.UserService
正在读取class文件： top.jasonkayzk.ioc.app.IocApplication
正在读取class文件： top.jasonkayzk.ioc.app.config.MyBeanPostProcessor
正在读取class文件： top.jasonkayzk.ioc.app.controller.CustomerController
假设正在执行myCustomer的init方法.....
假设正在执行userService的init方法.....
假设正在执行customerController的init方法.....
正在处理myBeanPostProcessor的初始化前的操作
假设正在执行myBeanPostProcessor的init方法.....
正在处理myBeanPostProcessor的初始化后的操作
---------------容器创建完毕-------------------
top.jasonkayzk.ioc.app.service.UserService@5e5792a0
top.jasonkayzk.ioc.app.service.CustomerService@26653222
测试懒加载: LazyService 的无参构造被执行
正在处理lazyService的初始化前的操作
假设正在执行lazyService的init方法.....
正在处理lazyService的初始化后的操作
top.jasonkayzk.ioc.app.service.LazyService@3532ec19
测试循环依赖  true
--------------------------------------------------------
userService
myCustomer
lazyService
customerController
myBeanPostProcessor
```

说明全部运行正常!

><br/>
>
>感谢您辛苦看到这里❤
>
>文中全部源代码: https://github.com/JasonkayZK/Java_Samples/tree/spring-ioc

<br/>

## 附录

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

源代码: 

- https://github.com/JasonkayZK/Java_Samples/tree/spring-ioc

文章参考:

-   [从零开始实现一个简易的Java MVC框架](https://segmentfault.com/a/1190000015467044)
-   [仿spring-framework源码实现手写一个IOC容器](https://zhuanlan.zhihu.com/p/95823916)

项目参考:

-   [spring-ioc](https://gitlab.com/qingsongxi/spring-ioc)

<br/>