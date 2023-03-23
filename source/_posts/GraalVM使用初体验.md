---
title: GraalVM使用初体验
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?33'
date: 2023-03-20 20:48:52
categories: GraalVM
tags: [GraalVM, Java]
description: GraalVM是一个加速JVM语言运行的JDK工具，它同时提供了将JavaScript，Python等语言转化为JVM语言的能力，使得这些语言能集成到JVM语言体系中；GraalVM采用两种工作方式，HotSpotJVM 上的 Graal just-in-time (JIT)，或者使用 ahead-of-time (AOT) 将JVM语言编译为原生二进制可执行文件！
---

GraalVM是一个加速JVM语言运行的JDK工具，它同时提供了将JavaScript，Python等语言转化为JVM语言的能力，使得这些语言能集成到JVM语言体系中；

GraalVM采用两种工作方式，HotSpotJVM 上的 Graal just-in-time (JIT)，或者使用 ahead-of-time (AOT) 将JVM语言编译为原生二进制可执行文件！

官方网站：

-   https://www.graalvm.org/

系列文章：

-   [《使用Java编写Cli命令行工具》](https://jasonkayzk.github.io/2023/03/20/使用Java编写Cli命令行工具/)
-   [《GraalVM使用初体验》](https://jasonkayzk.github.io/2023/03/20/GraalVM使用初体验/)

<br/>

<!--more-->

# **GraalVM使用初体验**

## **安装**

GraalVM 的安装非常简单，和Java差不多：

下载压缩包、解压，然后将文件加入到 PATH 即可！

官方文档：

-   https://www.graalvm.org/latest/docs/getting-started/#install-graalvm

检查：

```bash
$ gu --version
GraalVM Updater 22.3.1
```

>   和OracleJDK、OpenJDK类似，GraalVM也提供了两种：
>
>   -   **GraalVM-ce：社区版使用 OpenJDK，在 Github 下载：[graalvm-ce-builds/releases](https://github.com/graalvm/graalvm-ce-builds/releases)**
>   -   **GraalVM-ee：企业版使用 OracleJDK，在Oracle官网下载：[install-graalvm-enterprise)](/graalvm/enterprise/22/docs/getting-started/#install-graalvm-enterprise)**

<br/>

## **使用多语言**

**GraalVM 使用 `gu` 工具来管理其他工具链，并且在安装 GraalVM 时已经自带了 JDK；**

可以直接使用：

```bash
javac HelloWorld.java
java HelloWorld
Hello World!
```

如果想要运行其他语言，例如 JavaScript，需要先安装：

```bash
$ gu install js
```

然后执行：

```bash
$ JAVA_HOME/bin/js

> 1 + 2
3
```

此外，GraalVM 还提供了：

-   nodejs
-   llvm
-   python
-   ruby
-   wasm

等等一系列语言；

使用方法也是类似；

<br/>

## **Native原生编译**

### **原生编译单个Java文件**

编写 HelloWorld：

HelloWorld.java

```java
public class HelloWorld {
  public static void main(String[] args) {
    System.out.println("Hello, Native World!");
  }
}	
```

编译并编译为二进制：

```bash
$ javac HelloWorld.java

$ native-image HelloWorld

=======================================================================================================
GraalVM Native Image: Generating 'helloworld' (executable)...
=======================================================================================================
[1/7] Initializing...                                                                   (4.8s @ 0.21GB)
 Version info: 'GraalVM 22.3.1 Java 17 EE'
 Java version info: '17.0.6+9-LTS-jvmci-22.3-b11'
 C compiler: cc (apple, arm64, 14.0.0)
 Garbage collector: Serial GC
[2/7] Performing analysis...  [*****]                                                   (3.7s @ 0.75GB)
   1,751 (61.74%) of  2,836 classes reachable
   1,567 (45.77%) of  3,424 fields reachable
   6,874 (34.55%) of 19,898 methods reachable
      18 classes,     0 fields, and   248 methods registered for reflection
      49 classes,    33 fields, and    48 methods registered for JNI access
       4 native libraries: -framework Foundation, dl, pthread, z
[3/7] Building universe...                                                              (0.5s @ 1.00GB)
[4/7] Parsing methods...      [*]                                                       (0.4s @ 0.37GB)
[5/7] Inlining methods...     [***]                                                     (0.2s @ 0.56GB)
[6/7] Compiling methods...    [***]                                                     (6.7s @ 2.52GB)
[7/7] Creating image...                                                                 (0.7s @ 0.29GB)
   2.27MB (46.92%) for code area:     3,130 compilation units
   2.36MB (48.74%) for image heap:   42,329 objects and 0 resources
 215.15KB ( 4.34%) for other data
   4.84MB in total
-------------------------------------------------------------------------------------------------------
Top 10 packages in code area:                      Top 10 object types in image heap:
 316.28KB java.lang                                 424.41KB byte[] for code metadata
 199.45KB java.util                                 339.53KB byte[] for java.lang.String
 160.63KB com.oracle.svm.core.code                  282.68KB java.lang.String
 149.30KB com.oracle.svm.core.genscavenge           257.40KB java.lang.Class
 116.85KB java.util.concurrent                      226.30KB byte[] for general heap data
  98.69KB java.math                                 111.71KB char[]
  89.97KB com.oracle.svm.core.jni.functions         104.56KB java.util.HashMap$Node
  83.14KB java.lang.invoke                           78.59KB java.util.HashMap$Node[]
  69.27KB com.oracle.svm.core                        68.40KB c.o.svm.core.hub.DynamicHubCompanion
  59.49KB com.oracle.svm.core.graal.snippets         66.45KB java.lang.Object[]
 963.84KB for 92 more packages                      418.79KB for 459 more object types
-------------------------------------------------------------------------------------------------------
                0.3s (1.9% of total time) in 18 GCs | Peak RSS: 3.11GB | CPU load: 4.84
-------------------------------------------------------------------------------------------------------
Produced artifacts:
 /Users/zk/workspace/java-all/cli/picocli/a-checksum/target/helloworld (executable)
 /Users/zk/workspace/java-all/cli/picocli/a-checksum/target/helloworld.build_artifacts.txt (txt)
=======================================================================================================
Finished generating 'helloworld' in 17.5s.
```

编译完成后就生成了可执行文件，运行：

```bash
$ ./helloworld

Hello, Native World!
```

<br/>

### **原生编译Jar包**

这里使用了上一篇文章 [《使用Java编写Cli命令行工具》](https://jasonkayzk.github.io/2023/03/20/使用Java编写Cli命令行工具/) 编译好的 Jar 包；

执行命令编译：

```bash
$ native-image -jar a-checksum-1.0-SNAPSHOT.jar

=======================================================================================================
GraalVM Native Image: Generating 'a-checksum-1.0-SNAPSHOT' (executable)...
=======================================================================================================
[1/7] Initializing...                                                                   (5.2s @ 0.21GB)
 Version info: 'GraalVM 22.3.1 Java 17 EE'
 Java version info: '17.0.6+9-LTS-jvmci-22.3-b11'
 C compiler: cc (apple, arm64, 14.0.0)
 Garbage collector: Serial GC
[2/7] Performing analysis...  [*****]                                                   (8.0s @ 1.60GB)
   3,672 (76.88%) of  4,776 classes reachable
   4,815 (54.41%) of  8,849 fields reachable
  19,011 (49.51%) of 38,400 methods reachable
      45 classes,     5 fields, and   551 methods registered for reflection
      58 classes,    59 fields, and    52 methods registered for JNI access
       4 native libraries: -framework Foundation, dl, pthread, z
[3/7] Building universe...                                                              (1.1s @ 0.81GB)
[4/7] Parsing methods...      [*]                                                       (0.9s @ 1.95GB)
[5/7] Inlining methods...     [***]                                                     (0.5s @ 2.48GB)
[6/7] Compiling methods...    [****]                                                   (16.7s @ 3.28GB)
[7/7] Creating image...                                                                 (1.7s @ 4.11GB)
   9.03MB (49.09%) for code area:     9,751 compilation units
   8.94MB (48.57%) for image heap:  149,730 objects and 5 resources
 440.86KB ( 2.34%) for other data
  18.40MB in total
-------------------------------------------------------------------------------------------------------
Top 10 packages in code area:                      Top 10 object types in image heap:
1017.12KB java.util                                   1.70MB byte[] for code metadata
 930.98KB picocli                                   977.18KB java.lang.String
 716.55KB java.lang                                 965.67KB byte[] for general heap data
 515.41KB java.text                                 953.46KB byte[] for java.lang.String
 423.18KB com.oracle.svm.core.code                  611.61KB java.lang.Class
 395.35KB jdk.internal.org.objectweb.asm            364.63KB java.util.HashMap$Node
 367.71KB java.util.concurrent                      350.19KB j.util.concurrent.ConcurrentHashMap$Node
 261.72KB java.util.regex                           172.13KB c.o.svm.core.hub.DynamicHubCompanion
 252.84KB java.io                                   169.50KB byte[] for reflection metadata
 195.60KB java.math                                 152.26KB java.util.HashMap$Node[]
   4.02MB for 142 more packages                       1.65MB for 929 more object types
-------------------------------------------------------------------------------------------------------
                0.7s (1.9% of total time) in 24 GCs | Peak RSS: 4.83GB | CPU load: 5.61
-------------------------------------------------------------------------------------------------------
Produced artifacts:
 /Users/zk/workspace/java-all/cli/picocli/a-checksum/target/a-checksum-1.0-SNAPSHOT (executable)
 /Users/zk/workspace/java-all/cli/picocli/a-checksum/target/a-checksum-1.0-SNAPSHOT.build_artifacts.txt (txt)
=======================================================================================================
Finished generating 'a-checksum-1.0-SNAPSHOT' in 35.4s.
```

运行编译好的文件：

```bash
$ ./a-checksum-1.0-SNAPSHOT

Missing required parameter: '<file>'
Usage: checksum [-hV] [-a=<algorithm>] <file>
Prints the checksum (SHA-256 by default) of a file to STDOUT.
      <file>      The file whose checksum to calculate.
  -a, --algorithm=<algorithm>
                  MD5, SHA-1, SHA-256, ...
  -h, --help      Show this help message and exit.
  -V, --version   Print version information and exit.
  
  
$ ./a-checksum-1.0-SNAPSHOT ../hello.txt

5891b5b522d5df086d0ff0b110fbd9d21bb4fc7163af34d08286a2e846f6be03
```

**需要注意的是：**

<font color="#f00">**上面的 Jar 包是使用 JDK 8 编译产生的，但是使用的 GraalVM 工具链是：**</font>

<font color="#f00">**`GraalVM 22.3.1 Java 17 EE (Java Version 17.0.6+9-LTS-jvmci-22.3-b11)`，即 JDK 17；**</font>

<font color="#f00">**但是得益于 Java 良好的 Class 文件规范，生成的 Jar 包仍然能够被正确的编译！**</font>

<br/>

## **总结**

GraalVM 为 JVM 提供了更多的可能，例如：多语言（Polyglot Programming）、原生可执行文件（Native Image）；

Spring3 也已经支持了通过 GraalVM 将项目编译为原生可执行文件，相信以后这是一个发展的方向！

<br/>

# **附录**

系列文章：

-   [《使用Java编写Cli命令行工具》](https://jasonkayzk.github.io/2023/03/20/使用Java编写Cli命令行工具/)
-   [《GraalVM使用初体验》](https://jasonkayzk.github.io/2023/03/20/GraalVM使用初体验/)

<br/>
