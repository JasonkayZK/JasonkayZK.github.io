---
title: 使用Java编写Cli命令行工具
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?11'
date: 2023-03-20 13:45:36
categories: Java
tags: [Java, Cli, picocli, Maven]
description: 兜兜转转，最近又用回了Java。最近在写mini-redis的Java版来学习Netty，需要用到Java的命令行工具框架picocli。发现通过Java来实现命令行还是挺麻烦的，尤其是打包部分，这里简单总结一下；
---

兜兜转转，最近又用回了Java；

最近在写mini-redis的Java版来学习Netty，需要用到Java的命令行工具框架picocli；

发现通过Java来实现命令行还是挺麻烦的，尤其是打包部分，这里简单总结一下；

源代码：

-   https://github.com/remkop/picocli
-   https://github.com/JasonkayZK/java-all/tree/main/cli/picocli

<br/>

<!--more-->

# **使用Java编写Cli命令行工具**

## **前言**

试了一下，还是不推荐使用 Java 来开发 Cli 的，毕竟不会有人为了这个东西去装 JRE，而且 GraalVM 目前还不能完全支持（各种平台上各种缺动态链接库）；

只是用于学习的项目即可！

<br/>

## **代码**

这里以 picocli 框架提供的 CheckSum 工具为例：

项目的 Maven 配置如下：

```xml
<dependencies>
  <dependency>
    <groupId>info.picocli</groupId>
    <artifactId>picocli</artifactId>
    <version>4.7.1</version>
  </dependency>
</dependencies>

<build>
  <plugins>
    <!-- Enabling Annotation Processor -->
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-compiler-plugin</artifactId>
      <!-- annotationProcessorPaths requires maven-compiler-plugin version 3.5 or higher -->
      <version>3.8.1</version>
      <configuration>
        <annotationProcessorPaths>
          <path>
            <groupId>info.picocli</groupId>
            <artifactId>picocli-codegen</artifactId>
            <version>4.7.1</version>
          </path>
        </annotationProcessorPaths>
        <compilerArgs>
          <arg>-Aproject=${project.groupId}/${project.artifactId}</arg>
        </compilerArgs>
      </configuration>
    </plugin>
  </plugins>
</build>
```

主要是 picocli 依赖以及注解处理插件；

代码如下：

cli/picocli/a-checksum/src/main/java/io/github/jasonkayzk/CheckSum.java

```java
package io.github.jasonkayzk;

import picocli.CommandLine;
import picocli.CommandLine.Command;
import picocli.CommandLine.Option;
import picocli.CommandLine.Parameters;

import java.io.File;
import java.math.BigInteger;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.concurrent.Callable;

@Command(name = "checksum", mixinStandardHelpOptions = true, version = "checksum 4.0",
        description = "Prints the checksum (SHA-256 by default) of a file to STDOUT.")
public class CheckSum implements Callable<Integer> {

    @Parameters(index = "0", description = "The file whose checksum to calculate.")
    private File file;

    @Option(names = {"-a", "--algorithm"}, description = "MD5, SHA-1, SHA-256, ...")
    private String algorithm = "SHA-256";

    @Override
    public Integer call() throws Exception { // your business logic goes here...
        byte[] fileContents = Files.readAllBytes(file.toPath());
        byte[] digest = MessageDigest.getInstance(algorithm).digest(fileContents);
        System.out.printf("%0" + (digest.length * 2) + "x%n", new BigInteger(1, digest));
        return 0;
    }

    // this example implements Callable, so parsing, error handling and handling user
    // requests for usage help or version help can be done with one line of code.
    public static void main(String... args) {
        int exitCode = new CommandLine(new CheckSum()).execute(args);
        System.exit(exitCode);
    }
}
```

命令行框架的代码还是很容易理解的；

在 IDEA 中执行的话要配置对应的命令行参数才行；

那么如果打包成 Jar 呢？

<br/>

## **Maven配置**

### **指定Jar包主清单属性**

如果我们不使用其他的 Maven 插件来打包，打包后执行：

```bash
$ java -jar target/a-checksum-1.0-SNAPSHOT.jar \
  --algorithm SHA-256 hello.txt

target/a-checksum-1.0-SNAPSHOT.jar中没有主清单属性
```

此时会报错：`xxx.jar中没有主清单属性`；

<font color="#f00">**这表示我们没有指定 Jar 包的入口方法，因此这个 Jar 包只能作为一个库来使用而不能成为 Executable Jar；**</font>

这个问题是因为：jar包中的META-INF文件夹下的MANIFEST.MF文件缺少定义jar接口类）说白了就是没有指定class类）；

>   **这里说明一下MANIFEST.MF就是一个清单文件，通俗点将就相当于WINDOWS中 ini 配置文件，用来配置程序的一些信息；**

有两种解决方案：

<font color="#f00">**1、手动编写配置`META-INF/MANIFEST.MF`**</font>

我们可以手动编写这个配置文件，然后打包的时候打包进去，例如：

```
Manifest-Version: 1.0
Build-Jdk: 1.7.0_67
Main-Class: io.github.jasonkayzk.CheckSum
```

但是通常我们都是使用 Maven 插件来帮助我们生成！

<br/>

<font color="#f00">**2、使用 `maven-jar-plugin` 插件**</font>

配置中加入Maven插件：

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-jar-plugin</artifactId>
      <version>3.1.0</version>
      <configuration>
        <archive>
          <manifest>
            <mainClass>io.github.jasonkayzk.CheckSum</mainClass>
          </manifest>
        </archive>
      </configuration>
    </plugin>
  </plugins>
</build>
```

在上面的配置中配置了 MainClass 是我们对应的 CheckSum 类；

这样，Maven 在 package 阶段就会自动生成对应的 MANIFEST 文件并打入 Jar 包中；

<br/>

### **将依赖加入Jar包**

上面配置好了我们的Jar包入口，接下来重新打包并执行：

```bash
$ java -jar target/a-checksum-1.0-SNAPSHOT.jar \
  --algorithm SHA-256 hello.txt

Exception in thread "main" java.lang.NoClassDefFoundError: picocli/CommandLine
        at io.github.jasonkayzk.CheckSum.main(CheckSum.java:35)
Caused by: java.lang.ClassNotFoundException: picocli.CommandLine
        at java.net.URLClassLoader.findClass(URLClassLoader.java:387)
        at java.lang.ClassLoader.loadClass(ClassLoader.java:418)
        at sun.misc.Launcher$AppClassLoader.loadClass(Launcher.java:355)
        at java.lang.ClassLoader.loadClass(ClassLoader.java:351)
        ... 1 more
```

此时仍然报错：`java.lang.NoClassDefFoundError: picocli/CommandLine`；

<font color="#f00">**这是因为，通常情况下我们打包的 Jar 包是不包含依赖文件的；但是当我们作为 Executable Jar 去运行时，就缺少了我们的依赖；**</font>

<font color="#f00">**因此，我们需要将我们的依赖也打入 Jar 包中，即 `uber-jar`（或叫 `fat-jar`，胖Jar包）；**</font>

Maven 提供了两个插件来解决这个问题：

-   **maven-assembly-plugin；**
-   **maven-shade-plugin；**

这两个都可以用于将程序和依赖打成一个 uber-jar，尤其是开发sparkstreaming、flink程序，往yarn上提交任务的时候！

两者的区别在于：

<font color="#f00">**maven-assembly-plugin 插件会将依赖和资源文件都打入最终的Jar包，诸如properties文件等，如果项目和依赖中都有相同名称的资源文件时，就会发生冲突，导致项目中的相同名称的文件不会打到最终的Jar包中！如果这个文件是一个关键的配置文件，便会导致问题！**

<font color="#f00">**而maven-shade-plugin不存在这样的问题；所以，实际开发项目时候，还是尽量选用maven-shade-plugin！**</font>

下面分别来看；

<br/>

#### **使用`maven-assembly-plugin`打包**

Maven 中加入配置：

```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-assembly-plugin</artifactId>
  <version>3.1.1</version>
  <configuration>
    <!-- get all project dependencies -->
    <descriptorRefs>
      <descriptorRef>jar-with-dependencies</descriptorRef>
    </descriptorRefs>
    <!-- Main in manifest make executable jar -->
    <archive>
      <manifest>
        <mainClass>io.github.jasonkayzk.CheckSum</mainClass>                        
      </manifest>
    </archive>
  </configuration>
  <executions>
    <execution>
      <id>make-assembly</id>
      <phase>package</phase>
      <goals>
        <goal>single</goal>
      </goals>
    </execution>
  </executions>
</plugin>

```

然后再次打包并执行：

```bash
$ java -jar target/a-checksum-1.0-SNAPSHOT-jar-with-dependencies.jar \
  --algorithm SHA-256 hello.txt

5891b5b522d5df086d0ff0b110fbd9d21bb4fc7163af34d08286a2e846f6be03
```

`maven-assembly-plugin` 插件会生成两个 Jar 包，一个包含了依赖（如上面的 `a-checksum-1.0-SNAPSHOT-jar-with-dependencies.jar`），一个不包含；

`maven-assembly-plugin` 插件使用比较简单，下面来看另外一个插件；

<br/>

#### **使用`maven-shade-plugin`打包**

加入配置：

```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-shade-plugin</artifactId>
  <version>3.2.4</version>
  <executions>
    <execution>
      <id>checksum</id>
      <phase>package</phase>
      <goals>
        <goal>shade</goal>
      </goals>
      <configuration>
        <transformers>
          <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
            <manifestEntries>
              <Main-Class>io.github.jasonkayzk.CheckSum</Main-Class>
            </manifestEntries>
          </transformer>
        </transformers>
      </configuration>
    </execution>
  </executions>
</plugin>
```

**需要注意的是：`<id>checksum</id>` 是一定要配置的，否则打包时会报错：**

```
Maven – shade for parameter resource: Cannot find ‘resource’ in class org.apache.maven.plugins.shade.resource.ManifestResourceTransformer
```

详见：

-   https://itecnote.com/tecnote/maven-shade-for-parameter-resource-cannot-find-resource-in-class-org-apache-maven-plugins-shade-resource-manifestresourcetransformer/

重新打包后执行：

```bash
$ java -jar target/a-checksum-1.0-SNAPSHOT.jar \
  --algorithm SHA-256 hello.txt

5891b5b522d5df086d0ff0b110fbd9d21bb4fc7163af34d08286a2e846f6be03
```

<br/>

## **小结**

上文主要讲述了如何编写并打包一个 Executable Jar，打包的方式还是传统的 Jar 包的方式；

实际上，得益于 GraalVM 的发展，目前已经可以直接编译Java 到 Native 了，但是还存在一些坑；

希望以后有机会写关于 GraalVM 的内容～

<br/>

# **附录**

源代码：

-   https://github.com/remkop/picocli
-   https://github.com/JasonkayZK/java-all/tree/main/cli/picocli

参考文章：

-   http://www.noobyard.com/article/p-nrudzjzq-dn.html
-   https://www.modb.pro/db/128812
-   https://itecnote.com/tecnote/maven-shade-for-parameter-resource-cannot-find-resource-in-class-org-apache-maven-plugins-shade-resource-manifestresourcetransformer/

<br/>
