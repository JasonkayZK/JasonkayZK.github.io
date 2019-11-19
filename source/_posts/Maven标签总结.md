---
title: Maven标签总结
toc: true
date: 2019-10-22 14:17:19
categories: Maven
cover: https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/u=3320916012,4232332240&fm=26&gp=0.jpg
tags: [Maven, 项目构建]
description: 在使用Maven构建Java项目的时候, 可以通过build等标签指定编译版本等信息. 本文主要总结了Maven常用的一些标签!
---



在使用Maven构建Java项目的时候, 可以通过build等标签指定编译版本等信息. 本文主要总结了Maven常用的一些标签!

阅读本文你将学会:

-   如何使用Maven配置指定默认的Java编译版本
-   pom.xml中的常用标签:
    -   build
    -   dependencies
    -   resources
    -   plugins
    -   pluginManagement
    -   reporting
    -   ......
-   ......



<br/>

<!--more-->

## Maven标签总结

最近由于使用的是JDK 11, 而之前的项目一直使用的是JDK 8, 所以在构建或者编辑的时候, 需要在pom.xml中指定相应的JDK版本等, 索性就在此总结一下使用Maven时, 配置pom.xml的相关标签.

<br/>

### 一.  Maven设置默认Java编译版本

有两种方式

-   针对项目配置
-   针对全局配置

<br/>

#### 1. 针对项目配置

修改项目的`pom.xml`中的`<build>`标签添加:

```xml
<!-- JDK 8的配置 -->
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.8.0</version>
            <configuration>
                <target>8</target>
                <source>8</source>
            </configuration>
        </plugin>
    </plugins>
</build>
```

<br/>

#### 2. 针对全局配置

针对全局配置，需要修改全局配置文件`settings.xml (位于${用户名}/.m2/settings.xml)`的`<profiles>标签和<activeProfiles>标签`：

```xaml
<!-- JDK 11配置内容 -->
<profiles>
      <id>jdk1.11</id>

      <activation>
        <jdk>1.11</jdk>
		<activeByDefault>true</activeByDefault>
      </activation>

      <properties>
        <maven.compiler.source>1.11</maven.compiler.source>
        <maven.compiler.target>1.11</maven.compiler.target>
        <maven.compiler.compilerVersion>1.11</maven.compiler.compilerVersion>
      </properties>

      <repositories>
        <repository>
          <id>jdk11</id>
          <name>Repository for JDK 1.11 builds</name>
          <url>http://www.myhost.com/maven/jdk11</url>
          <layout>default</layout>
          <snapshotPolicy>always</snapshotPolicy>
        </repository>
      </repositories>
    </profile>
    
  </profiles>

  <activeProfiles>
    <activeProfile>jdk1.11</activeProfile>
  </activeProfiles>
```



<br/>

<br/>

### 二. pom.xml标签详解

pom文件作为MAVEN中重要的配置文件，对于它的配置是相当重要. 文件中包含了开发者需遵循的规则、缺陷管理系统、组织、licenses、项目信息、项目依赖性等

下面将重点介绍一下该文件的基本组成与功能

<br/>

#### 0. 标签预览

```xml
<project>
    <modelVersion>4.0.0</modelVersion>
    
    <!-- 基础设置 -->
    <groupId>...</groupId>
    <artifactId>...</artifactId>
    <version>...</version>
    <packaging>...</packaging>
    <name>...</name>
    <url>...</url>
    <dependencies>...</dependencies>
    <parent>...</parent>
    <dependencyManagement>...</dependencyManagement>
    <modules>...</modules>
    <properties>...</properties>
    
    <!--构建设置 -->
    <build>...</build>
    <reporting>...</reporting>
    
    <!-- 更多项目信息 -->
    <name>...</name>
    <description>...</description>
    <url>...</url>
    <inceptionYear>...</inceptionYear>
    <licenses>...</licenses>
    <organization>...</organization>
    <developers>...</developers>
    <contributors>...</contributors>
    
    <!-- 环境设置-->
    <issueManagement>...</issueManagement>
    <ciManagement>...</ciManagement>
    <mailingLists>...</mailingLists> 
    <scm>...</scm>
    <prerequisites>...</prerequisites>
    <repositories>...</repositories>
    <pluginRepositories>...</pluginRepositories>
    <distributionManagement>...</distributionManagement>
    <profiles>...</profiles>
    
</project>
```



<br/>

<br/>

#### 1. 基本内容设置

| 标签           | 说明                                                         |
| -------------- | ------------------------------------------------------------ |
| **groupId**    | 项目或者组织的唯一标志 , 如cn.gov.customs生成的相对路径为: /cn/gov/customs |
| **artifactId** | 项目的通用名称                                               |
| **version**    | 项目的版本                                                   |
| **packaging**  | 打包机制, 如: pom, jar, maven-plugin, ejb, war, ear, rar, par |
| **name**       | 用户描述项目的名称，无关紧要的东西，非必要                   |
| **url**        | 开发团队官方地址 ，非必要                                    |
| **classifer**  | 分类                                                         |



<font color="#ff0000">对于以上基本标签, groupId, artifactId, version, packaging作为项目唯一坐标!</font>

<br/>

<br/>

#### 2. POM依赖关系设置

对于POM文件中的关系，<font color="#0000ff">主要有依赖，继承，合成等关系</font>

下面是一个具体工程中用到的依赖相关配置信息:

```xml
<dependencies>
    
    <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>4.0</version>
        <type>jar</type>
        <scope>test</scope>
        <optional>true</optional>
    </dependency>
    
    <dependency>
    <groupId>com.alibaba.china.shared</groupId>
    <artifactId>alibaba.apollo.webx</artifactId>
    <version>2.5.0</version>
    <exclusions>
        <exclusion>
            <artifactId>org.slf4j.slf4j-api</artifactId>
            <groupId>com.alibaba.external</groupId>
        </exclusion>
        ....
    </exclusions>
    </dependency>
    
    ......
</dependencies>

```

以上代码说明: <font color="#ff0000">groupId, artifactId, version这三个组合标示依赖的具体工程. 如果在中央仓库中没有的依赖包，需要自行导入到本地或私有仓库中!</font>

<br/>

##### 导入依赖的三种方法:

-   通过本地maven进行配置安装: 使用maven install plugin

    如: mvn install:intall-file  -Dfile=non-maven-proj.jar -DgroupId=som.group  -DartifactId=non-maven-proj -Dversion=1

-   创建自己的repositories并且部署这个包，使用类似上面的deploy:deploy-file命令

-   在代码中配置scope为system,并且指定系统路径

<br/>

<br/>

##### dependency介绍

| 标签                     | 说明                                                         | 示例             |
| ------------------------ | ------------------------------------------------------------ | ---------------- |
| **type**                 | 默认为**jar**类型<br />常用的类型有：**jar,ejb-client,test-jar**...,可设置plugins中的extensions值为true后在增加新类型 |                  |
| **scope**                | 用来指定当前包的依赖范围<br />compile（编译范围），是默认的范围，编译范围依赖在所有的classpath中可用，同时它们也会被打包<br/>provided（已提供范围），只有在当JDK或者一个容器已提供该依赖之后才使用<br/>runtime（运行时范围），在运行和测试系统的时候需要<br/>test（测试范围），在一般的 编译和运行时都不需要<br/>system（系统范围），与provided类似 |                  |
| **optional**             | 设置指依赖是否可选，默认为false,即子项目默认都继承，为true,则子项目必需显示的引入，与dependencyManagement里定义的依赖类似 |                  |
| **exclusions**           | 如果X需要A,A包含B依赖，那么X可以声明不要B依赖，只要在exclusions中声明exclusion |                  |
| **exclusion**            | 将B从依赖树中删除，如上配置，alibaba.apollo.webx不想使用com.alibaba.external  ,但是alibaba.apollo.webx是集成了com.alibaba.external,r所以就需要排除掉 |                  |
| **parent**               | 如果一个工程作为父类工程，那就必须添加pom,子系统要继承父类，也必须使用**parent**标签<br /><br />**relativePath**：为可选项，maven会首先搜索该地址，然后再搜索远程仓库。 | 见parent示例     |
| **dependencyManagement** | 用于帮助管理chidren的dependencies，优点就是可以集中管理版本  |                  |
| **modules**              | 多模块项目的标签，顺序不重要，MAVEN会自动拓展排序            | 见modules示例    |
| **properties**           | POM文件常量定义区，在文件中可以直接引用，如版本、编码等<br /><br />使用方式：**${file.encoding}** | 见properties示例 |

parent示例:

```xml
<parent>
    <groupId>org.codehaus.mojo</groupId>      
    <artifactId>my-parent</artifactId>     
    <version>2.0</version>  
    <relativePath>../my-parent</relativePath> 
</parent>
```

<br/>

modules示例:

```xml
<!--子模块--> 
<modules>
    <module>ygb-service-config</module>    
    <module>ygb-service-bus</module>     
    <module>ygb-service-policy-center</module>   
    <module>ygb-service-letter-of-indemnity</module>     
    <module>ygb-service-authentication-center</module>   
    <module>ygb-service-eureka-center</module> 
    <module>ygb-service-api-gateway</module>  
    <module>ygb-service-demo</module>    
    <module>ygb-service-cache-ehcache</module>   
    <module>ygb-service-maven</module> 
</modules>
```

<br/>

properties示例:

```xml
<properties> 
    <file.encoding>UTF-8</file_encoding> 
    <java.source.version>1.8</java_source_version>   
    <java.target.version>1.8</java_target_version>
</properties>   
```





<br/>

<br/>

#### 3. MAVEN构建设置

这部分主要是对项目的构建过程进行配置，包括打包的方式、插件的安装等

典型的配置如下所示:

```xml
<!-- 构建管理 -->
<build>
    <!--构建工具插件管理-->
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

build模块介绍:

| 标签名          | 说明                                                         | 示例                                            |
| --------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| **defaultGoal** | 默认的目标，必须跟命令行上的参数相同, 或者与时期parse相同    | 目标如: jar:jar<br />时期如: install            |
| **directory**   | 指定build target目标的目录                                   | 默认为$(basedir}/target, 即项目根目录下的target |
| **finalName**   | 指定去掉后缀的工程名字                                       | 默认为${artifactId}-${version}                  |
| **filters**     | 定义指定filter属性的位置，例如filter元素赋值filters/filter1.properties,那么这个文件里面就可以定义name=value对，这个name=value对的值就可以在工程pom中通过${name}引用 | 默认的filter目录是${basedir}/src/main/filters/  |
| **resources**   | 描述工程中各种文件资源的位置                                 | 见resources示例                                 |

<br/>

resources示例:

```xml
<resource> 
    <targetPath>META-INF/plexus</targetPath> 
    <filtering>false</filtering> 
    <directory>${basedir}/src/main/plexus</directory> 
    <includes> 
        <include>configuration.xml</include> 
    </includes> 
    <excludes> 
        <exclude>**/*.properties</exclude> 
    </excludes> 
</resource>
```

resources子标签介绍：

| 标签名            | 说明                                                         | 示例                                                         |
| ----------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **targetPath**    | 指定build资源具体目录                                        | 默认是base directory                                         |
| **filtering**     | 指定是否将filter文件的变量值在这个resource文件有效, 即上面说的filters里定义的*.property文件 | 例如: 上面就指定那些变量值在configuration文件无效，设置为false |
| **directory**     | 指定属性文件的目录，build的过程需要找到它，并且将其放到targetPath下 | 默认的directory是**${basedir}/src/main/resources**           |
| **includes**      | 指定包含文件的patterns,符合样式并且在directory目录下的文件将会包含进project的资源文件 |                                                              |
| **excludes**      | 指定不包含在内的patterns                                     |                                                              |
| **testResources** | 包含测试资源元素                                             | 默认的测试资源路径是${basedir}/src/test/resources, 测试资源是不部署的 |



<br/>

<br/>

#### 4. plugins配置

对于打包插件的相关配置在该模块配置

一个经典的项目配置如下：

```xml
<plugin> 
    <groupId>org.apache.maven.plugins</groupId> 
    <artifactId>maven-jar-plugin</artifactId> 
    <version>2.0</version> 
    <extensions>false</extensions> 
    <inherited>true</inherited> 
    <configuration> 
      <classifier>test</classifier> 
    </configuration> 
    <dependencies>...</dependencies> 
    <executions>...</executions> 
</plugin>

```

子标签说明:

| 标签名            | 说明                                                         | 示例       |
| ----------------- | ------------------------------------------------------------ | ---------- |
| **extensions**    | 决定是否要load这个plugin的extensions                         | 默认为true |
| **inherited**     | 是否让子pom继承                                              | 默认为true |
| **configuration** | 通常用于私有不开源的plugin,不能够详细了解plugin的内部工作原理，但使plugin满足的properties |            |
| **dependencies**  | 与pom基础的dependencies的结构和功能都相同，只是plugin的dependencies用于plugin,而pom的denpendencies用于项目本身 |            |
| **executions**    | plugin也有很多个目标，每个目标具有不同的配置，executions就是设定plugin的目标 |            |

<br/>

executions 内部标签示意:

```xml

 <execution> 
     <id>echodir</id> 
     <goals> 
       <goal>run</goal> 
     </goals> 
     <phase>verify</phase> 
     <inherited>false</inherited> 
     <configuration> 
       <tasks> 
         <echo>Build Dir: ${project.build.directory}</echo> 
       </tasks> 
     </configuration> 
 </execution> 
```



<br/>

<br/>

#### 5. pluginManagement配置

<font color="#0000ff">pluginManagement的作用类似于denpendencyManagement</font>

<font color="#ff0000">只是denpendencyManagement是用于管理项目jar包依赖，pluginManagement是用于管理plugin</font>

一个项目典型的配置如下:

```xml
<pluginManagement> 
  <plugins> 
    <plugin> 
      <groupId>org.apache.maven.plugins</groupId> 
      <artifactId>maven-jar-plugin</artifactId> 
      <version>2.2</version> 
      <executions> 
        <execution> 
          <id>pre-process-classes</id> 
          <phase>compile</phase> 
          <goals> 
            <goal>jar</goal> 
          </goals> 
          <configuration> 
            <classifier>pre-process</classifier> 
          </configuration> 
        </execution> 
      </executions> 
    </plugin> 
  </plugins> 
</pluginManagement> 

```

<font color="#ff0000">与pom build里的plugins区别是，这里的plugin是列出来，然后让子pom来决定是否引用</font>

<br/>

**子pom引用方法：** 在pom的build里的plugins引用:

```xml
<plugins> 
  <plugin> 
    <groupId>org.apache.maven.plugins</groupId> 
    <artifactId>maven-jar-plugin</artifactId> 
  </plugin> 
</plugins>
```





<br/>

<br/>

#### 6. reporting设置

<font color="#0000ff">reporting包含site生成阶段的一些元素，某些maven  plugin可以生成reports并且在reporting下配置</font>

<font color="#ff0000">reporting里面的reportSets和build里面的executions的作用都是控制pom的不同粒度去控制buld的过程，我们不单要配置plugins，还要配置那些plugins单独的goals</font>

一个项目典型的配置如下:

```xml
<reporting> 
    <plugins> 
      <plugin> 
        ... 
        <reportSets> 
          <reportSet> 
            <id>sunlink</id> 
            <reports> 
              <report>javadoc</report> 
            </reports> 
            <inherited>true</inherited> 
            <configuration> 
              <links> 
                <link>http://java.sun.com/j2se/1.5.0/docs/api/</link> 
              </links> 
            </configuration> 
          </reportSet> 
        </reportSets> 
      </plugin> 
    </plugins> 
  </reporting> 
```



<br/>

<br/>

#### 7. 更多项目信息

这块是一些非必要的设置信息，但是作为项目来讲、版权来讲，也会很重要的信息

| 标签名              | 说明                                                         | 示例                                                         |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **name**            | 项目除了artifactId外，可以定义多个名称                       |                                                              |
| **description**     | 项目描述                                                     |                                                              |
| **url**             | 项目url                                                      |                                                              |
| **inceptionYear**   | 创始年份                                                     |                                                              |
| **Licenses**        | 版权信息                                                     | 见license示例                                                |
| **organization**    | 组织信息                                                     |                                                              |
| **developers**      | 开发者信息                                                   | 见developer示例                                              |
| **issueManagement** | 环境配置信息                                                 | 见issueManagement示例                                        |
| **repositories**    | 仓库配置信息，pom里面的仓库与setting.xml里的仓库功能是一样，主要的区别在于，pom里的仓库是个性化的。比如一家大公司里的setting文件是公用 的，所有项目都用一个setting文件，但各个子项目却会引用不同的第三方库，所以就需要在pom里设置自己需要的仓库地址<br />要成为maven2的repository artifact，必须具有pom文件在$BASE_REPO/groupId/artifactId/version/artifactId-version.pom<br/>BASE_REPO可以是本地，也可以是远程的。repository元素就是声明那些去查找的repositories<br/> | 默认的central Maven repository在[http://repo1.maven.org/maven2/](https://link.jianshu.com?t=http://repo1.maven.org/maven2/)<br />使用见repositories示例 |

<br/>

license示例:

```xml
<licenses>   
    <license>  
        <name>Apache 2</name> 
        <url>http://www.apache.org/licenses/LICENSE-2.0.txt</url>     
        <distribution>repo</distribution>  
        <comments>A business-friendly OSS license</comments> 
    </license>
</licenses>
```

<br/>

developer示例:

```xml
<developers>     
    <developer>       
        <id>hanyahong</id>    
        <name>hanyahong</name>      
        <email>ceo@hanyahong.com</email>      
        <url>http://www.hanyahong.com</url>      
        <organization>hanyahong</organization>       
        <organizationUrl>http://www.hanyahong.com</organizationUrl>     
        <roles>       
            <role>architect</role>   
            <role>developer</role>    
        </roles>      
        <timezone>-6</timezone> 
        <properties>    
            <picUrl>http://www.hanyahong.com/test</picUrl>  
        </properties>    
    </developer>
</developers>
```

<br/>

issueManagement示例:

```xml
<issueManagement>    
    <system>Bugzilla</system>  
    <url>http://hanyahong.com/</url>
</issueManagement> 
```

<br/>

repositories示例:

```xml
<repositories>   
    <repository>      
        <releases>    
            <enabled>false</enabled>   
            <updatePolicy>always</updatePolicy>   
            <checksumPolicy>warn</checksumPolicy>     
        </releases> 
        <snapshots>   
            <enabled>true</enabled>     
            <updatePolicy>never</updatePolicy>  
            <checksumPolicy>fail</checksumPolicy>   
        </snapshots>  
        <id>codehausSnapshots</id>   
        <name>Codehaus Snapshots</name>        
        <url>http://snapshots.maven.codehaus.org/maven2</url>  
        <layout>default</layout> 
    </repository>  
</repositories> 
```



<br/>

<br/>

### 三. 最全Maven-pom文件

```xml
<span style="padding:0px; margin:0px"><project xmlns="http://maven.apache.org/POM/4.0.0"   
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"   
xsi:schemaLocation="http://maven.apache.org/POM/4.0.0http://maven.apache.org/maven-v4_0_0.xsd">   
    <!--父项目的坐标。如果项目中没有规定某个元素的值，那么父项目中的对应值即为项目的默认值。 坐标包括group ID，artifact ID和 version。-->  
    <parent>  
     <!--被继承的父项目的构件标识符-->  
     <artifactId/>  
     <!--被继承的父项目的全球唯一标识符-->  
     <groupId/>  
     <!--被继承的父项目的版本-->  
     <version/>  
     <!-- 父项目的pom.xml文件的相对路径。相对路径允许你选择一个不同的路径。默认值是../pom.xml。Maven首先在构建当前项目的地方寻找父项 目的pom，其次在文件系统的这个位置（relativePath位置），然后在本地仓库，最后在远程仓库寻找父项目的pom。-->  
     <relativePath/>  
 </parent>  
 <!--声明项目描述符遵循哪一个POM模型版本。模型本身的版本很少改变，虽然如此，但它仍然是必不可少的，这是为了当Maven引入了新的特性或者其他模型变更的时候，确保稳定性。-->     
    <modelVersion>4.0.0</modelVersion>   
    <!--项目的全球唯一标识符，通常使用全限定的包名区分该项目和其他项目。并且构建时生成的路径也是由此生成， 如com.mycompany.app生成的相对路径为：/com/mycompany/app-->   
    <groupId>asia.banseon</groupId>   
    <!-- 构件的标识符，它和group ID一起唯一标识一个构件。换句话说，你不能有两个不同的项目拥有同样的artifact ID和groupID；在某个 特定的group ID下，artifact ID也必须是唯一的。构件是项目产生的或使用的一个东西，Maven为项目产生的构件包括：JARs，源 码，二进制发布和WARs等。-->   
    <artifactId>banseon-maven2</artifactId>   
    <!--项目产生的构件类型，例如jar、war、ear、pom。插件可以创建他们自己的构件类型，所以前面列的不是全部构件类型-->   
    <packaging>jar</packaging>   
    <!--项目当前版本，格式为:主版本.次版本.增量版本-限定版本号-->   
    <version>1.0-SNAPSHOT</version>   
    <!--项目的名称, Maven产生的文档用-->   
    <name>banseon-maven</name>   
    <!--项目主页的URL, Maven产生的文档用-->   
    <url>http://www.baidu.com/banseon</url>   
    <!-- 项目的详细描述, Maven 产生的文档用。  当这个元素能够用HTML格式描述时（例如，CDATA中的文本会被解析器忽略，就可以包含HTML标 签）， 不鼓励使用纯文本描述。如果你需要修改产生的web站点的索引页面，你应该修改你自己的索引页文件，而不是调整这里的文档。-->   
    <description>A maven project to study maven.</description>   
    <!--描述了这个项目构建环境中的前提条件。-->  
 <prerequisites>  
  <!--构建该项目或使用该插件所需要的Maven的最低版本-->  
    <maven/>  
 </prerequisites>  
 <!--项目的问题管理系统(Bugzilla, Jira, Scarab,或任何你喜欢的问题管理系统)的名称和URL，本例为 jira-->   
    <issueManagement>  
     <!--问题管理系统（例如jira）的名字，-->   
        <system>jira</system>   
        <!--该项目使用的问题管理系统的URL-->  
        <url>http://jira.baidu.com/banseon</url>   
    </issueManagement>   
    <!--项目持续集成信息-->  
 <ciManagement>  
  <!--持续集成系统的名字，例如continuum-->  
  <system/>  
  <!--该项目使用的持续集成系统的URL（如果持续集成系统有web接口的话）。-->  
  <url/>  
  <!--构建完成时，需要通知的开发者/用户的配置项。包括被通知者信息和通知条件（错误，失败，成功，警告）-->  
  <notifiers>  
   <!--配置一种方式，当构建中断时，以该方式通知用户/开发者-->  
   <notifier>  
    <!--传送通知的途径-->  
    <type/>  
    <!--发生错误时是否通知-->  
    <sendOnError/>  
    <!--构建失败时是否通知-->  
    <sendOnFailure/>  
    <!--构建成功时是否通知-->  
    <sendOnSuccess/>  
    <!--发生警告时是否通知-->  
    <sendOnWarning/>  
    <!--不赞成使用。通知发送到哪里-->  
    <address/>  
    <!--扩展配置项-->  
    <configuration/>  
   </notifier>  
  </notifiers>  
 </ciManagement>  
 <!--项目创建年份，4位数字。当产生版权信息时需要使用这个值。-->  
    <inceptionYear/>  
    <!--项目相关邮件列表信息-->   
    <mailingLists>  
     <!--该元素描述了项目相关的所有邮件列表。自动产生的网站引用这些信息。-->   
        <mailingList>   
         <!--邮件的名称-->  
            <name>Demo</name>   
            <!--发送邮件的地址或链接，如果是邮件地址，创建文档时，mailto: 链接会被自动创建-->   
            <post>banseon@126.com</post>   
            <!--订阅邮件的地址或链接，如果是邮件地址，创建文档时，mailto: 链接会被自动创建-->   
            <subscribe>banseon@126.com</subscribe>   
            <!--取消订阅邮件的地址或链接，如果是邮件地址，创建文档时，mailto: 链接会被自动创建-->   
            <unsubscribe>banseon@126.com</unsubscribe>   
            <!--你可以浏览邮件信息的URL-->  
            <archive>http:/hi.baidu.com/banseon/demo/dev/</archive>   
        </mailingList>   
    </mailingLists>   
    <!--项目开发者列表-->   
    <developers>   
     <!--某个项目开发者的信息-->  
        <developer>   
         <!--SCM里项目开发者的唯一标识符-->  
            <id>HELLO WORLD</id>   
            <!--项目开发者的全名-->  
            <name>banseon</name>   
            <!--项目开发者的email-->  
            <email>banseon@126.com</email>   
            <!--项目开发者的主页的URL-->  
            <url/>  
            <!--项目开发者在项目中扮演的角色，角色元素描述了各种角色-->  
            <roles>   
                <role>Project Manager</role>   
                <role>Architect</role>   
            </roles>  
            <!--项目开发者所属组织-->  
            <organization>demo</organization>   
            <!--项目开发者所属组织的URL-->  
            <organizationUrl>http://hi.baidu.com/banseon</organizationUrl>   
            <!--项目开发者属性，如即时消息如何处理等-->  
            <properties>   
                <dept>No</dept>   
            </properties>  
            <!--项目开发者所在时区， -11到12范围内的整数。-->  
            <timezone>-5</timezone>   
        </developer>   
    </developers>   
    <!--项目的其他贡献者列表-->   
    <contributors>  
     <!--项目的其他贡献者。参见developers/developer元素-->  
     <contributor>  
   <name/><email/><url/><organization/><organizationUrl/><roles/><timezone/><properties/>  
     </contributor>       
    </contributors>     
    <!--该元素描述了项目所有License列表。 应该只列出该项目的license列表，不要列出依赖项目的 license列表。如果列出多个license，用户可以选择它们中的一个而不是接受所有license。-->   
    <licenses>  
     <!--描述了项目的license，用于生成项目的web站点的license页面，其他一些报表和validation也会用到该元素。-->   
        <license>  
         <!--license用于法律上的名称-->  
            <name>Apache 2</name>   
            <!--官方的license正文页面的URL-->  
            <url>http://www.baidu.com/banseon/LICENSE-2.0.txt</url>   
            <!--项目分发的主要方式：  
              repo，可以从Maven库下载  
              manual， 用户必须手动下载和安装依赖-->  
            <distribution>repo</distribution>   
            <!--关于license的补充信息-->  
            <comments>A business-friendly OSS license</comments>   
        </license>   
    </licenses>   
    <!--SCM(Source Control Management)标签允许你配置你的代码库，供Maven web站点和其它插件使用。-->   
    <scm>   
        <!--SCM的URL,该URL描述了版本库和如何连接到版本库。欲知详情，请看SCMs提供的URL格式和列表。该连接只读。-->   
        <connection>   
            scm:svn:http://svn.baidu.com/banseon/maven/banseon/banseon-maven2-trunk(dao-trunk)    
        </connection>   
        <!--给开发者使用的，类似connection元素。即该连接不仅仅只读-->  
        <developerConnection>   
            scm:svn:http://svn.baidu.com/banseon/maven/banseon/dao-trunk    
        </developerConnection>  
        <!--当前代码的标签，在开发阶段默认为HEAD-->  
        <tag/>         
        <!--指向项目的可浏览SCM库（例如ViewVC或者Fisheye）的URL。-->   
        <url>http://svn.baidu.com/banseon</url>   
    </scm>   
    <!--描述项目所属组织的各种属性。Maven产生的文档用-->   
    <organization>   
     <!--组织的全名-->  
        <name>demo</name>   
        <!--组织主页的URL-->  
        <url>http://www.baidu.com/banseon</url>   
    </organization>  
    <!--构建项目需要的信息-->  
    <build>  
     <!--该元素设置了项目源码目录，当构建项目的时候，构建系统会编译目录里的源码。该路径是相对于pom.xml的相对路径。-->  
  <sourceDirectory/>  
  <!--该元素设置了项目脚本源码目录，该目录和源码目录不同：绝大多数情况下，该目录下的内容 会被拷贝到输出目录(因为脚本是被解释的，而不是被编译的)。-->  
  <scriptSourceDirectory/>  
  <!--该元素设置了项目单元测试使用的源码目录，当测试项目的时候，构建系统会编译目录里的源码。该路径是相对于pom.xml的相对路径。-->  
  <testSourceDirectory/>  
  <!--被编译过的应用程序class文件存放的目录。-->  
  <outputDirectory/>  
  <!--被编译过的测试class文件存放的目录。-->  
  <testOutputDirectory/>  
  <!--使用来自该项目的一系列构建扩展-->  
  <extensions>  
   <!--描述使用到的构建扩展。-->  
   <extension>  
    <!--构建扩展的groupId-->  
    <groupId/>  
    <!--构建扩展的artifactId-->  
    <artifactId/>  
    <!--构建扩展的版本-->  
    <version/>  
   </extension>  
  </extensions>  
  <!--当项目没有规定目标（Maven2 叫做阶段）时的默认值-->  
  <defaultGoal/>  
  <!--这个元素描述了项目相关的所有资源路径列表，例如和项目相关的属性文件，这些资源被包含在最终的打包文件里。-->  
  <resources>  
   <!--这个元素描述了项目相关或测试相关的所有资源路径-->  
   <resource>  
    <!-- 描述了资源的目标路径。该路径相对target/classes目录（例如${project.build.outputDirectory}）。举个例 子，如果你想资源在特定的包里(org.apache.maven.messages)，你就必须该元素设置为org/apache/maven /messages。然而，如果你只是想把资源放到源码目录结构里，就不需要该配置。-->  
    <targetPath/>  
    <!--是否使用参数值代替参数名。参数值取自properties元素或者文件里配置的属性，文件在filters元素里列出。-->  
    <filtering/>  
    <!--描述存放资源的目录，该路径相对POM路径-->  
    <directory/>  
    <!--包含的模式列表，例如**/*.xml.-->  
    <includes/>  
    <!--排除的模式列表，例如**/*.xml-->  
    <excludes/>  
   </resource>  
  </resources>  
  <!--这个元素描述了单元测试相关的所有资源路径，例如和单元测试相关的属性文件。-->  
  <testResources>  
   <!--这个元素描述了测试相关的所有资源路径，参见build/resources/resource元素的说明-->  
   <testResource>  
    <targetPath/><filtering/><directory/><includes/><excludes/>  
   </testResource>  
  </testResources>  
  <!--构建产生的所有文件存放的目录-->  
  <directory/>  
  <!--产生的构件的文件名，默认值是${artifactId}-${version}。-->  
  <finalName/>  
  <!--当filtering开关打开时，使用到的过滤器属性文件列表-->  
  <filters/>  
  <!--子项目可以引用的默认插件信息。该插件配置项直到被引用时才会被解析或绑定到生命周期。给定插件的任何本地配置都会覆盖这里的配置-->  
  <pluginManagement>  
   <!--使用的插件列表 。-->  
   <plugins>  
    <!--plugin元素包含描述插件所需要的信息。-->  
    <plugin>  
     <!--插件在仓库里的group ID-->  
     <groupId/>  
     <!--插件在仓库里的artifact ID-->  
     <artifactId/>  
     <!--被使用的插件的版本（或版本范围）-->  
     <version/>  
     <!--是否从该插件下载Maven扩展（例如打包和类型处理器），由于性能原因，只有在真需要下载时，该元素才被设置成enabled。-->  
     <extensions/>  
     <!--在构建生命周期中执行一组目标的配置。每个目标可能有不同的配置。-->  
     <executions>  
      <!--execution元素包含了插件执行需要的信息-->  
      <execution>  
       <!--执行目标的标识符，用于标识构建过程中的目标，或者匹配继承过程中需要合并的执行目标-->  
       <id/>  
       <!--绑定了目标的构建生命周期阶段，如果省略，目标会被绑定到源数据里配置的默认阶段-->  
       <phase/>  
       <!--配置的执行目标-->  
       <goals/>  
       <!--配置是否被传播到子POM-->  
       <inherited/>  
       <!--作为DOM对象的配置-->  
       <configuration/>  
      </execution>  
     </executions>  
     <!--项目引入插件所需要的额外依赖-->  
     <dependencies>  
      <!--参见dependencies/dependency元素-->  
      <dependency>  
       ......  
      </dependency>  
     </dependencies>       
     <!--任何配置是否被传播到子项目-->  
     <inherited/>  
     <!--作为DOM对象的配置-->  
     <configuration/>  
    </plugin>  
   </plugins>  
  </pluginManagement>  
  <!--使用的插件列表-->  
  <plugins>  
   <!--参见build/pluginManagement/plugins/plugin元素-->  
   <plugin>  
    <groupId/><artifactId/><version/><extensions/>  
    <executions>  
     <execution>  
      <id/><phase/><goals/><inherited/><configuration/>  
     </execution>  
    </executions>  
    <dependencies>  
     <!--参见dependencies/dependency元素-->  
     <dependency>  
      ......  
     </dependency>  
    </dependencies>  
    <goals/><inherited/><configuration/>  
   </plugin>  
  </plugins>  
 </build>  
 <!--在列的项目构建profile，如果被激活，会修改构建处理-->  
 <profiles>  
  <!--根据环境参数或命令行参数激活某个构建处理-->  
  <profile>  
   <!--构建配置的唯一标识符。即用于命令行激活，也用于在继承时合并具有相同标识符的profile。-->  
   <id/>  
   <!--自动触发profile的条件逻辑。Activation是profile的开启钥匙。profile的力量来自于它  
   能够在某些特定的环境中自动使用某些特定的值；这些环境通过activation元素指定。activation元素并不是激活profile的唯一方式。-->  
   <activation>  
    <!--profile默认是否激活的标志-->  
    <activeByDefault/>  
    <!--当匹配的jdk被检测到，profile被激活。例如，1.4激活JDK1.4，1.4.0_2，而!1.4激活所有版本不是以1.4开头的JDK。-->  
    <jdk/>  
    <!--当匹配的操作系统属性被检测到，profile被激活。os元素可以定义一些操作系统相关的属性。-->  
    <os>  
     <!--激活profile的操作系统的名字-->  
     <name>Windows XP</name>  
     <!--激活profile的操作系统所属家族(如 'windows')-->  
     <family>Windows</family>  
     <!--激活profile的操作系统体系结构 -->  
     <arch>x86</arch>  
     <!--激活profile的操作系统版本-->  
     <version>5.1.2600</version>  
    </os>  
    <!--如果Maven检测到某一个属性（其值可以在POM中通过${名称}引用），其拥有对应的名称和值，Profile就会被激活。如果值  
    字段是空的，那么存在属性名称字段就会激活profile，否则按区分大小写方式匹配属性值字段-->  
    <property>  
     <!--激活profile的属性的名称-->  
     <name>mavenVersion</name>  
     <!--激活profile的属性的值-->  
     <value>2.0.3</value>  
    </property>  
    <!--提供一个文件名，通过检测该文件的存在或不存在来激活profile。missing检查文件是否存在，如果不存在则激活  
    profile。另一方面，exists则会检查文件是否存在，如果存在则激活profile。-->  
    <file>  
     <!--如果指定的文件存在，则激活profile。-->  
     <exists>/usr/local/hudson/hudson-home/jobs/maven-guide-zh-to-production/workspace/</exists>  
     <!--如果指定的文件不存在，则激活profile。-->  
     <missing>/usr/local/hudson/hudson-home/jobs/maven-guide-zh-to-production/workspace/</missing>  
    </file>  
   </activation>  
   <!--构建项目所需要的信息。参见build元素-->  
   <build>  
    <defaultGoal/>  
    <resources>  
     <resource>  
      <targetPath/><filtering/><directory/><includes/><excludes/>  
     </resource>  
    </resources>  
    <testResources>  
     <testResource>  
      <targetPath/><filtering/><directory/><includes/><excludes/>  
     </testResource>  
    </testResources>  
    <directory/><finalName/><filters/>  
    <pluginManagement>  
     <plugins>  
      <!--参见build/pluginManagement/plugins/plugin元素-->  
      <plugin>  
       <groupId/><artifactId/><version/><extensions/>  
       <executions>  
        <execution>  
         <id/><phase/><goals/><inherited/><configuration/>  
        </execution>  
       </executions>  
       <dependencies>  
        <!--参见dependencies/dependency元素-->  
        <dependency>  
         ......  
        </dependency>  
       </dependencies>  
       <goals/><inherited/><configuration/>  
      </plugin>  
     </plugins>  
    </pluginManagement>  
    <plugins>  
     <!--参见build/pluginManagement/plugins/plugin元素-->  
     <plugin>  
      <groupId/><artifactId/><version/><extensions/>  
      <executions>  
       <execution>  
        <id/><phase/><goals/><inherited/><configuration/>  
       </execution>  
      </executions>  
      <dependencies>  
       <!--参见dependencies/dependency元素-->  
       <dependency>  
        ......  
       </dependency>  
      </dependencies>  
      <goals/><inherited/><configuration/>  
     </plugin>  
    </plugins>  
   </build>  
   <!--模块（有时称作子项目） 被构建成项目的一部分。列出的每个模块元素是指向该模块的目录的相对路径-->  
   <modules/>  
   <!--发现依赖和扩展的远程仓库列表。-->  
   <repositories>  
    <!--参见repositories/repository元素-->  
    <repository>  
     <releases>  
      <enabled/><updatePolicy/><checksumPolicy/>  
     </releases>  
     <snapshots>  
      <enabled/><updatePolicy/><checksumPolicy/>  
     </snapshots>  
     <id/><name/><url/><layout/>  
    </repository>  
   </repositories>  
   <!--发现插件的远程仓库列表，这些插件用于构建和报表-->  
   <pluginRepositories>  
    <!--包含需要连接到远程插件仓库的信息.参见repositories/repository元素-->      
    <pluginRepository>  
     <releases>  
      <enabled/><updatePolicy/><checksumPolicy/>  
     </releases>  
     <snapshots>  
      <enabled/><updatePolicy/><checksumPolicy/>  
     </snapshots>  
     <id/><name/><url/><layout/>  
    </pluginRepository>  
   </pluginRepositories>  
   <!--该元素描述了项目相关的所有依赖。 这些依赖组成了项目构建过程中的一个个环节。它们自动从项目定义的仓库中下载。要获取更多信息，请看项目依赖机制。-->  
   <dependencies>  
    <!--参见dependencies/dependency元素-->  
    <dependency>  
     ......  
    </dependency>  
   </dependencies>  
   <!--不赞成使用. 现在Maven忽略该元素.-->  
   <reports/>     
   <!--该元素包括使用报表插件产生报表的规范。当用户执行“mvn site”，这些报表就会运行。 在页面导航栏能看到所有报表的链接。参见reporting元素-->  
   <reporting>  
    ......  
   </reporting>  
   <!--参见dependencyManagement元素-->  
   <dependencyManagement>  
    <dependencies>  
     <!--参见dependencies/dependency元素-->  
     <dependency>  
      ......  
     </dependency>  
    </dependencies>  
   </dependencyManagement>  
   <!--参见distributionManagement元素-->  
   <distributionManagement>  
    ......  
   </distributionManagement>  
   <!--参见properties元素-->  
   <properties/>  
  </profile>  
 </profiles>  
 <!--模块（有时称作子项目） 被构建成项目的一部分。列出的每个模块元素是指向该模块的目录的相对路径-->  
 <modules/>  
    <!--发现依赖和扩展的远程仓库列表。-->   
    <repositories>   
     <!--包含需要连接到远程仓库的信息-->  
        <repository>  
         <!--如何处理远程仓库里发布版本的下载-->  
         <releases>  
          <!--true或者false表示该仓库是否为下载某种类型构件（发布版，快照版）开启。 -->  
    <enabled/>  
    <!--该元素指定更新发生的频率。Maven会比较本地POM和远程POM的时间戳。这里的选项是：always（一直），daily（默认，每日），interval：X（这里X是以分钟为单位的时间间隔），或者never（从不）。-->  
    <updatePolicy/>  
    <!--当Maven验证构件校验文件失败时该怎么做：ignore（忽略），fail（失败），或者warn（警告）。-->  
    <checksumPolicy/>  
   </releases>  
   <!-- 如何处理远程仓库里快照版本的下载。有了releases和snapshots这两组配置，POM就可以在每个单独的仓库中，为每种类型的构件采取不同的 策略。例如，可能有人会决定只为开发目的开启对快照版本下载的支持。参见repositories/repository/releases元素 -->  
   <snapshots>  
    <enabled/><updatePolicy/><checksumPolicy/>  
   </snapshots>  
   <!--远程仓库唯一标识符。可以用来匹配在settings.xml文件里配置的远程仓库-->  
   <id>banseon-repository-proxy</id>   
   <!--远程仓库名称-->  
            <name>banseon-repository-proxy</name>   
            <!--远程仓库URL，按protocol://hostname/path形式-->  
            <url>http://192.168.1.169:9999/repository/</url>   
            <!-- 用于定位和排序构件的仓库布局类型-可以是default（默认）或者legacy（遗留）。Maven 2为其仓库提供了一个默认的布局；然 而，Maven 1.x有一种不同的布局。我们可以使用该元素指定布局是default（默认）还是legacy（遗留）。-->  
            <layout>default</layout>             
        </repository>   
    </repositories>  
    <!--发现插件的远程仓库列表，这些插件用于构建和报表-->  
    <pluginRepositories>  
     <!--包含需要连接到远程插件仓库的信息.参见repositories/repository元素-->  
  <pluginRepository>  
   ......  
  </pluginRepository>  
 </pluginRepositories>  
     
    <!--该元素描述了项目相关的所有依赖。 这些依赖组成了项目构建过程中的一个个环节。它们自动从项目定义的仓库中下载。要获取更多信息，请看项目依赖机制。-->   
    <dependencies>   
        <dependency>  
   <!--依赖的group ID-->  
            <groupId>org.apache.maven</groupId>   
            <!--依赖的artifact ID-->  
            <artifactId>maven-artifact</artifactId>   
            <!--依赖的版本号。 在Maven 2里, 也可以配置成版本号的范围。-->  
            <version>3.8.1</version>   
            <!-- 依赖类型，默认类型是jar。它通常表示依赖的文件的扩展名，但也有例外。一个类型可以被映射成另外一个扩展名或分类器。类型经常和使用的打包方式对应， 尽管这也有例外。一些类型的例子：jar，war，ejb-client和test-jar。如果设置extensions为 true，就可以在 plugin里定义新的类型。所以前面的类型的例子不完整。-->  
            <type>jar</type>  
            <!-- 依赖的分类器。分类器可以区分属于同一个POM，但不同构建方式的构件。分类器名被附加到文件名的版本号后面。例如，如果你想要构建两个单独的构件成 JAR，一个使用Java 1.4编译器，另一个使用Java 6编译器，你就可以使用分类器来生成两个单独的JAR构件。-->  
            <classifier></classifier>  
            <!--依赖范围。在项目发布过程中，帮助决定哪些构件被包括进来。欲知详情请参考依赖机制。  
                - compile ：默认范围，用于编译    
                - provided：类似于编译，但支持你期待jdk或者容器提供，类似于classpath    
                - runtime: 在执行时需要使用    
                - test:    用于test任务时使用    
                - system: 需要外在提供相应的元素。通过systemPath来取得    
                - systemPath: 仅用于范围为system。提供相应的路径    
                - optional:   当项目自身被依赖时，标注依赖是否传递。用于连续依赖时使用-->   
            <scope>test</scope>     
            <!--仅供system范围使用。注意，不鼓励使用这个元素，并且在新的版本中该元素可能被覆盖掉。该元素为依赖规定了文件系统上的路径。需要绝对路径而不是相对路径。推荐使用属性匹配绝对路径，例如${java.home}。-->  
            <systemPath></systemPath>   
            <!--当计算传递依赖时， 从依赖构件列表里，列出被排除的依赖构件集。即告诉maven你只依赖指定的项目，不依赖项目的依赖。此元素主要用于解决版本冲突问题-->  
            <exclusions>  
             <exclusion>   
                    <artifactId>spring-core</artifactId>   
                    <groupId>org.springframework</groupId>   
                </exclusion>   
            </exclusions>     
            <!--可选依赖，如果你在项目B中把C依赖声明为可选，你就需要在依赖于B的项目（例如项目A）中显式的引用对C的依赖。可选依赖阻断依赖的传递性。-->   
            <optional>true</optional>  
        </dependency>  
    </dependencies>  
    <!--不赞成使用. 现在Maven忽略该元素.-->  
    <reports></reports>  
    <!--该元素描述使用报表插件产生报表的规范。当用户执行“mvn site”，这些报表就会运行。 在页面导航栏能看到所有报表的链接。-->  
 <reporting>  
  <!--true，则，网站不包括默认的报表。这包括“项目信息”菜单中的报表。-->  
  <excludeDefaults/>  
  <!--所有产生的报表存放到哪里。默认值是${project.build.directory}/site。-->  
  <outputDirectory/>  
  <!--使用的报表插件和他们的配置。-->  
  <plugins>  
   <!--plugin元素包含描述报表插件需要的信息-->  
   <plugin>  
    <!--报表插件在仓库里的group ID-->  
    <groupId/>  
    <!--报表插件在仓库里的artifact ID-->  
    <artifactId/>  
    <!--被使用的报表插件的版本（或版本范围）-->  
    <version/>  
    <!--任何配置是否被传播到子项目-->  
    <inherited/>  
    <!--报表插件的配置-->  
    <configuration/>  
    <!--一组报表的多重规范，每个规范可能有不同的配置。一个规范（报表集）对应一个执行目标 。例如，有1，2，3，4，5，6，7，8，9个报表。1，2，5构成A报表集，对应一个执行目标。2，5，8构成B报表集，对应另一个执行目标-->  
    <reportSets>  
     <!--表示报表的一个集合，以及产生该集合的配置-->  
     <reportSet>  
      <!--报表集合的唯一标识符，POM继承时用到-->  
      <id/>  
      <!--产生报表集合时，被使用的报表的配置-->  
      <configuration/>  
      <!--配置是否被继承到子POMs-->  
      <inherited/>  
      <!--这个集合里使用到哪些报表-->  
      <reports/>  
     </reportSet>  
    </reportSets>  
   </plugin>  
  </plugins>  
 </reporting>  
 <!-- 继承自该项目的所有子项目的默认依赖信息。这部分的依赖信息不会被立即解析,而是当子项目声明一个依赖（必须描述group ID和 artifact ID信息），如果group ID和artifact ID以外的一些信息没有描述，则通过group ID和artifact ID 匹配到这里的依赖，并使用这里的依赖信息。-->  
 <dependencyManagement>  
  <dependencies>  
   <!--参见dependencies/dependency元素-->  
   <dependency>  
    ......  
   </dependency>  
  </dependencies>  
 </dependencyManagement>     
    <!--项目分发信息，在执行mvn deploy后表示要发布的位置。有了这些信息就可以把网站部署到远程服务器或者把构件部署到远程仓库。-->   
    <distributionManagement>  
        <!--部署项目产生的构件到远程仓库需要的信息-->  
        <repository>  
         <!--是分配给快照一个唯一的版本号（由时间戳和构建流水号）？还是每次都使用相同的版本号？参见repositories/repository元素-->  
   <uniqueVersion/>  
   <id>banseon-maven2</id>   
   <name>banseon maven2</name>   
            <url>file://${basedir}/target/deploy</url>   
            <layout/>  
  </repository>  
  <!--构件的快照部署到哪里？如果没有配置该元素，默认部署到repository元素配置的仓库，参见distributionManagement/repository元素-->   
  <snapshotRepository>  
   <uniqueVersion/>  
   <id>banseon-maven2</id>  
            <name>Banseon-maven2 Snapshot Repository</name>  
            <url>scp://svn.baidu.com/banseon:/usr/local/maven-snapshot</url>   
   <layout/>  
  </snapshotRepository>  
  <!--部署项目的网站需要的信息-->   
        <site>  
         <!--部署位置的唯一标识符，用来匹配站点和settings.xml文件里的配置-->   
            <id>banseon-site</id>   
            <!--部署位置的名称-->  
            <name>business api website</name>   
            <!--部署位置的URL，按protocol://hostname/path形式-->  
            <url>   
                scp://svn.baidu.com/banseon:/var/www/localhost/banseon-web    
            </url>   
        </site>  
  <!--项目下载页面的URL。如果没有该元素，用户应该参考主页。使用该元素的原因是：帮助定位那些不在仓库里的构件（由于license限制）。-->  
  <downloadUrl/>  
  <!--如果构件有了新的group ID和artifact ID（构件移到了新的位置），这里列出构件的重定位信息。-->  
  <relocation>  
   <!--构件新的group ID-->  
   <groupId/>  
   <!--构件新的artifact ID-->  
   <artifactId/>  
   <!--构件新的版本号-->  
   <version/>  
   <!--显示给用户的，关于移动的额外信息，例如原因。-->  
   <message/>  
  </relocation>  
  <!-- 给出该构件在远程仓库的状态。不得在本地项目中设置该元素，因为这是工具自动更新的。有效的值有：none（默认），converted（仓库管理员从 Maven 1 POM转换过来），partner（直接从伙伴Maven 2仓库同步过来），deployed（从Maven 2实例部 署），verified（被核实时正确的和最终的）。-->  
  <status/>         
    </distributionManagement>  
    <!--以值替代名称，Properties可以在整个POM中使用，也可以作为触发条件（见settings.xml配置文件里activation元素的说明）。格式是<name>value</name>。-->  
    <properties/>  
</project>  </span>
```



<br/>

<br/>

### 附录

参考文章:

-   [Maven-设置默认Java编译版本](https://www.cnblogs.com/yw0219/p/10230238.html)
-   [Maven打包java11报错Fatal error compiling的解决办法](https://jasonkayzk.github.io/2019/10/16/Maven%E6%89%93%E5%8C%85java11%E6%8A%A5%E9%94%99Fatal-error-compiling%E7%9A%84%E8%A7%A3%E5%86%B3%E5%8A%9E%E6%B3%95/)
-   [maven常用标签及意义](https://blog.csdn.net/qq_33719636/article/details/80391898)
-   [史上最全的Maven Pom文件标签详解](https://www.cnblogs.com/sharpest/p/7738444.html)
-   [maven系列--pom.xml标签详解](https://www.jianshu.com/p/242f2349eef1)



