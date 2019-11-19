---
title: 软件工程UML图总结
toc: true
date: 2019-10-21 11:12:18
categories: UML
cover: http://img2018.cnblogs.com/blog/1051030/201811/1051030-20181105205357467-1040762398.png
description: 最近在看Mybatis技术原理与实战的时候, 书中出现了大量的UML类图, 看得我很是难受, 决定要抽出一点时间, 系统的学习一下UML的相关知识!
---



最近在看Mybatis技术原理与实战的时候, 书中出现了大量的UML类图, 看得我很是难受, 决定要抽出一点时间, 系统的学习一下UML的相关知识!

阅读本文你将学会:

-   什么是UML图? UML有什么作用? 特点?
-   UML图的模型分类: 
    -   功能模型: 用例图等;
    -   对象模型: 类图, 对象图, 包图等;
    -   动态模型: 序列图, 活动图, 状态图等;
-   类图中的关系: 
    -   泛化(Generalization)
    -   实现(Realization)
    -   关联(Association)
    -   聚合(Aggregation)
    -   组合(Composition)
    -   依赖(Dependency)
    -   ......
-   UML中的其他图
-   ......



<br/>

<!--more-->

## 软件工程UML图总结

UML(Unified Modeling Language) [统一建模语言](https://baike.baidu.com/item/统一建模语言/3160571)，又称[标准建模语言](https://baike.baidu.com/item/标准建模语言/10967573)。是用来对软件密集系统进行可视化[建模](https://baike.baidu.com/item/建模)的一种语言

UML的定义包括<font color="#ff0000">UML语义</font>和<font color="#ff0000">UML表示法</font>两个元素。

UML是在开发阶段，说明、可视化、构建和书写一个[面向对象](https://baike.baidu.com/item/面向对象/2262089)软件密集系统的制品的开放方法。最佳的应用是工程实践，对大规模，复杂系统进行建模方面，特别是在[软件架构](https://baike.baidu.com/item/软件架构/7485920)层次，已经被验证有效

>   统一建模语言(UML)是一种模型化语言。模型大多以图表的方式表现出来。一份典型的建模图表通常包含几个块或框，连接线和作为模型附加信息之用的文本。这些虽简单却非常重要，在UML规则中相互联系和扩展



<br/>

<br/>

### 一. UML图简介

#### 1. UML图作用

[UML](https://baike.baidu.com/item/UML/446747)的目标是<font color="#00ff00">以面向对象图的方式来描述任何类型的系统</font>，具有很宽的应用领域。总之，<font color="#ff0000">UML是一个通用的标准建模语言，可以对任何`具有静态结构和动态行为的系统`进行[建模](https://baike.baidu.com/item/建模/814831)</font>，而且适用于系统开发的不同阶段，从需求规格描述直至系统完成后的测试和维护.

<br/>



#### 2. UML图特点

-   UML<font color="#0000ff">统一了各种方法对不同类型的系统、不同开发阶段以及不同内部概念的不同观点，从而有效的消除了各种建模语言之间不必要的差异.</font> 它实际上是一种通用的建模语言，可以为许多面向对象建模方法的用户广泛使用

-   UML建模能力比其它[面向对象](https://baike.baidu.com/item/面向对象/2262089)建模方法更强. 它不仅适合于一般系统的开发，而且对并行、分布式系统的建模尤为适宜
-   UML是一种建模语言，而不是一个开发过程

<br/>



#### 3. UML主要模型

在UML系统开发中有三个主要的模型：

##### 功能模型

从用户的角度展示系统的功能，包括[用例图](https://baike.baidu.com/item/用例图)。

<br/>

##### 对象模型

采用对象、属性、操作、关联等概念展示系统的结构和基础，包括[类图](https://baike.baidu.com/item/类图)、对象图、包图。

<br/>

##### 动态模型

展现系统的内部行为。 包括序列图、[活动图](https://baike.baidu.com/item/活动图)、[状态图](https://baike.baidu.com/item/状态图)。



<br/>

<br/>

### 二. UML图的种类

<font color="#0000ff">截止UML2.0一共有13种图形(UML1.5定义了9种，2.0增加了4种)</font>

分别是：用例图、类图、对象图、状态图、活动图、顺序图、协作图、构件图、部署图9种，包图、时序图、组合结构图、交互概览图4种

-   用例图：从用户角度描述系统功能
-   类图：描述系统中类的静态结构
-   对象图：系统中的多个对象在某一时刻的状态
-   状态图：是描述状态到状态控制流，常用于动态特性建模
-   活动图：描述了业务实现用例的工作流程
-   顺序图：对象之间的动态合作关系，强调对象发送消息的顺序，同时显示对象之间的交互
-   协作图：描述对象之间的协助关系
-   构件图：一种特殊的UML图来描述系统的静态实现视图
-   部署图：定义系统中软硬件的物理体系结构
-   包图：对构成系统的模型元素进行分组整理的图
-   时序图： 表示生命线状态变化的图
-   组合结构图：表示类或者构建内部结构的图
-   交互概览图：用活动图来表示多个交互之间的控制关系的图



<br/>

<br/>

### 三. 各UML图详述

下面对常用的一些UML图, 做详细说明:

#### 1.用例图(UseCase Diagrams)

用例图主要回答了两个问题：

-   <font color="#ff0000">是谁用软件</font>
-   <font color="#ff0000">软件的功能</font>

<font color="#ff0000">从用户的角度描述了系统的功能</font>，并指出各个功能的执行者，强调用户的使用者，系统为执行者完成哪些功能。

>   注意：这只是初步的用例，用来说明系统业务功能的

例如：一个新闻网站的业务用例图如下：

![新闻网站的业务用例.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/新闻网站的业务用例.png)



<br/>

#### 2. 类图(Class Diagrams)

用户<font color="#ff0000">根据用例图抽象成类，描述类的内部结构和类与类之间的关系，是一种静态结构图</font>

在UML类图中，常见的有以下几种关系: 

-   泛化(Generalization)
-   实现(Realization)
-   关联(Association)
-   聚合(Aggregation)
-   组合(Composition)
-   依赖(Dependency)

>   <font color="#ff0000">各种关系的强弱顺序： 泛化 = 实现 > 组合 > 聚合 > 关联 > 依赖</font>

<br/>

##### 2.1 泛化

【泛化关系】：是<font color="#ff0000">一种继承关系，表示一般与特殊的关系，它指定了子类如何继承父类的所有特征和行为</font>

>   例如：老虎是动物的一种，即有老虎的特性也有动物的共性		

![泛化.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/泛化.png)



<br/>

##### 2.2 实现

【实现关系】：是一种<font color="#ff0000">类与接口的关系，表示类是接口所有特征和行为的实现</font>

![实现.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/实现.png)



<br/>

##### 2.3 关联

【关联关系】: <font color="#ff0000">是一种拥有的关系，它使一个类知道另一个类的属性和方法;</font>

>   如：老师与学生，丈夫与妻子关联可以是双向的，也可以是单向的。

-   <font color="#ff0000">双向的关联可以有两个箭头或者没有箭头</font>
-   <font color="#ff0000">单向的关联有一个箭头</font>

【代码体现】：<font color="#ff0000">成员变量</font>

![关联.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/关联.png)



<br/>

##### 2.4 聚合

【聚合关系】：<font color="#ff0000">是整体与部分的关系，**且部分可以离开整体而单独存在**</font>

>   如: 车和轮胎是整体和部分的关系，轮胎离开车仍然可以存在

**聚合关系是关联关系的一种**，是强的关联关系；关联和聚合在语法上无法区分，必须考察具体的逻辑关系

【代码体现】: <font color="#ff0000">成员变量</font>

![聚合.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/聚合.png)



<br/>

##### 2.5 组合

【组合关系】：<font color="#ff0000">是**整体与部分的关系，但部分不能离开整体而单独存在**</font>

>   如: 公司和部门是整体和部分的关系，没有公司就不存在部门

**组合关系是关联关系的一种，是比聚合关系还要强的关系**，它要求普通的聚合关系中代表整体的对象负责代表部分的对象的生命周期。

【代码体现】：<font color="#ff0000">成员变量</font>

【箭头及指向】：<font color="#ff0000">带实心菱形的实线，菱形指向整体</font>

![组合.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/组合.png)



<br/>

##### 2.6 依赖

【依赖关系】：<font color="#ff0000">是一种使用的关系，即一个类的实现需要另一个类的协助，所以要尽量不使用双向的互相依赖</font>

【代码表现】：<font color="#ff0000">局部变量、方法的参数或者对静态方法的调用</font>

【箭头及指向】：<font color="#ff0000">带箭头的虚线，指向被使用者</font>

![依赖.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/依赖.png)



<br/>

##### 2.7 总结

如下图: 一个工程中常见的UML类图

![各种类图关系.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/各种类图关系.png)



<br/>

<br/>

#### 3. 对象图(Object Diagrams)

与[类图](https://baike.baidu.com/item/类图)极为相似，它是类图的实例，<font color="#ff0000">对象图显示类的多个对象实例，而不是实际的类. 它描述的不是类之间的关系，而是对象之间的关系</font>

描述的是参与**交互的各个对象在交互过程中某一时刻的状态**.

<font color="#ff0000">对象图可以被看作是类图在某一时刻的实例</font>

![对象图.jpg](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/对象图.jpg)



<br/>

#### 4. 包图

包图用于描述系统的分层结构，由包或类组成，表示包与包之间的关系

   

<br/>

#### 5. 活动图(Activity Diagrams)

描述用例要求所要进行的活动，以及活动间的约束关系，有利于识别并行活动。能够演示出系统中哪些地方存在功能，以及这些功能和系统中其他组件的功能如何共同满足前面使用[用例图](https://baike.baidu.com/item/用例图)[建模](https://baike.baidu.com/item/建模)的商务需求

是状态图的一种特殊情况，这些状态大都处于活动状态。本质是一种流程图，它描述了活动到活动的控制流

交互图强调的是对象到对象的控制流，而活动图则强调的是从活动到活动的控制流

活动图是一种表述过程基理、业务过程以及工作流的技术

>   它可以用来对业务过程、工作流建模，也可以对用例实现甚至是程序实现来建模

![活动图.jpg](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/活动图.jpg)

<br/>

##### 5.1 带泳道的活动图

<font color="#0000ff">泳道表明每个活动是由哪些人或哪些部门负责完成</font>

![带泳道的活动图.jpg](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/带泳道的活动图.jpg)

##### 5.2 带对象流的活动图

<font color="#0000ff">用活动图描述某个对象时，可以把涉及到的对象放置在活动图中，并用一个依赖将其连接到进行创建、修改和撤销的动作状态或者活动状态上，对象的这种使用方法就构成了对象流</font>

<font color="#ff0000">对象流用带有箭头的虚线表示</font>

![带对象流的活动图.jpg](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/带对象流的活动图.jpg)



<br/>

#### 6. 状态图(Statechart Diagrams)

描述类的对象所有可能的状态，以及事件发生时状态的转移条件。可以捕获对象、子系统和系统的生命周期。他们可以告知一个对象可以拥有的状态，并且事件(如消息的接收、时间的流逝、错误、条件变为真等)会怎么随着时间的推移来影响这些状态。

一个[状态图](https://baike.baidu.com/item/状态图)应该连接到所有具有清晰的可标识状态和复杂行为的类；该图可以确定类的行为，以及该行为如何根据当前的状态变化，也可以展示哪些事件将会改变类的对象的状态

<font color="#0000ff">状态图是对[类图](https://baike.baidu.com/item/类图)的补充, 是一种由状态、变迁、事件和活动组成的状态机，用来描述类的对象所有可能的状态以及时间发生时状态的转移条件</font>

![状态图.gif](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/状态图.gif)



<br/>

#### 7. 序列图(Sequence Diagrams)

序列图([顺序图](https://baike.baidu.com/item/顺序图))是用来<font color="#0000ff">显示你的参与者如何以一系列顺序的步骤与系统的对象交互的模型，强调时间顺序</font>

顺序图可以用来展示对象之间是如何进行交互的。顺序图将显示的重点放在消息序列上，即强调消息是如何在对象之间被发送和接收的

序列图的主要用途是把用例表达的需求，转化为进一步、更加正式层次的精细表达。用例常常被细化为一个或者更多的序列图。同时序列图更有效地描述如何分配各个类的职责以及各类具有相应职责的原因。

![序列图-时序图.jpg](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/序列图-时序图.jpg)

<br/>

消息用从一个对象的生命线到另一个对象生命线的箭头表示。箭头以时间顺序在图中从上到下排列。 

序列图中涉及的元素：

##### 7.1 生命线

<font color="#ff0000">生命线名称可带下划线, 当使用下划线时，意味着序列图中的生命线代表一个类的特定实例</font>

![生命线.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/生命线.png)

##### 7.2 同步消息

同步等待消息

![同步消息.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/同步消息.png)

##### 7.3 异步消息

异步发送消息，不需等待

![异步消息.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/异步消息.png)

##### 7.4 注释

![注释.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/注释.png)

##### 7.5 约束

![约束.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/约束.png)

##### 7.6 组合

**组合片段用来解决交互执行的条件及方式**. <font color="#0000ff">它允许在序列图中直接表示逻辑组件，用于通过指定条件或子进程的应用区域，为任何生命线的任何部分定义特殊条件和子进程</font>

<font color="#0000ff">常用的组合片段有：抉择、选项、循环、并行</font>



<br/>

#### 8. 协作图(Collaboration Diagrams)

<font color="#0000ff">和序列图相似，显示对象间的动态合作关系，强调对象之间的合作关系</font> 

<font color="#ff0000">如果强调时间和顺序，则使用序列图；如果强调上下级关系，则选择协作图；这两种图合称为交互图</font>

![协作图.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/协作图.png)



<br/>

#### 9. 构件图(Component Diagrams)

<font color="#0000ff">构件图是用来表示系统中构件与构件之间，类或接口与构件之间的关系图</font>

其中，<font color="#ff0000">构建图之间的关系表现为依赖关系，定义的类或接口与类之间的关系表现为依赖关系或实现关系</font>

![构件图.jpg](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/构件图.jpg)



<br/>

#### 10. 部署图(Deployment Diagrams)

描述了<font color="#0000ff">系统运行时进行处理的结点以及在结点上活动的构件的配置, 强调了物理设备以及之间的连接关系</font>

描述一个具体应用的主要部署结构，通过对各种硬件，在硬件中的软件以及各种连接协议的显示，可以很好的描述系统是如何部署的；平衡系统运行时的计算资源分布；可以通过连接描述组织的硬件网络结构或者是嵌入式系统等具有多种硬件和软件相关的系统运行模型

部署模型的目的：

>   例如计算机和设备，以及它们之间是如何连接的。[部署图](https://baike.baidu.com/item/部署图)的使用者是开发人员、系统集成人员和测试人员。

![部署图.jpg](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/部署图.jpg)



<br/>

<br/>

#### 四. 图的差异比较

##### 1. 序列图(时序图)VS协作图

序列图和协作图都是交互图, 二者在语义上等价，可以相互转化. 但是侧重点不同：<font color="#ff0000">序列图侧重时间顺序，协作图侧重对象间的关系</font>

-   共同点：时序图与协作图均显示了对象间的交互

-   不同点：时序图强调交互的时间次序, 协作图强调交互的空间结构



<br/>

##### 2. 状态图VS活动图

状态图和活动图都是行为图, <font color="#ff0000">状态图侧重从行为的结果来描述，活动图侧重从行为的动作来描述. 状态图描述了一个具体对象的可能状态以及他们之间的转换.</font>

在实际的项目中，活动图并不是必须的，需要满足以下条件：

-   出现并行过程&行为
-   描述算法
-   跨越多个用例的活动图



<br/>

##### 3.活动图VS交互图

二者都涉及到对象和他们之间传递的关系, 区别在于: <font color="#ff0000">交互图观察的是传送消息的对象，而活动图观察的是对象之间传递的消息</font>

看似语义相同，但是他们是从不同的角度来观察整个系统的



<br/>

<br/>

#### 五. UML与软件工程

UML图是软件工程的组成部分，软件工程从宏观的角度保证了软件开发的各个过程的质量。而UML作为一种建模语言，更加有效的实现了软件工程的要求

　　如下图，在软件的各个开发阶段需要的UML图

![UML与软件工程.png](https://raw.githubusercontent.com/JasonkayZK/blog_static/master/images/UML与软件工程.png)



<br/>

<br/>

### 附录

文章参考:

-   [UML图 - 百度百科](https://baike.baidu.com/item/UML%E5%9B%BE/6963758?fr=aladdin)
-   [UML各种图总结-精华](https://www.cnblogs.com/jiangds/p/6596595.html)
-   [软件工程UML图](https://www.jianshu.com/p/d8fe13064f41)





