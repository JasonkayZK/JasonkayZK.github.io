---
title: Java实现的自定义类加载器
toc: true
date: 2019-12-25 11:12:32
cover: https://img.paulzzh.tech/touhou/random?2
categories: Java源码
tags: [Java基础, 类加载器]
description: 本文实例讲述了Java实现的自定义类加载器
---

本文讲述了如何实现一个Java的自定义类加载器

<br/>

<!--more-->

ClassLoader类有如下两个关键方法:

-   loadClass(String name, boolean resolve)：该方法为ClassLoader的入口点，根据指定的二进制名称来加载类，系统就是调用ClassLoader的该方法来获取指定类对应的Class对象
-   findClass(String name)：根据二进制名称来查找类

如果需要实现自定义的ClassLoader，可以通过重写以上两个方法来实现，当然我们**推荐重写findClass()方法，而不是重写loadClass()方法**

><br/>
>
>**补充: 自定义类加载器常用功能**
>
>-   执行代码前自动验证数字签名
>-   根据用户提供的密码解密代码，从而可以实现代码混淆器来避免反编译class文件
>-   根据用户需求来动态地加载类
>-   根据应用需求把其他数据以字节码的形式加载到应用中

代码如下:

MyClassLoader类:

```java
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.lang.reflect.Method;

public class MyClassLoader extends ClassLoader {

    // 定义一个主方法
    public static void main(String[] args) throws Exception {
        // 如果运行该程序时没有参数，即没有目标类
        if (args.length < 1) {
            System.out.println("缺少目标类，请按如下格式运行Java源文件： ");
            System.out.println("java MyClassLoader ClassName");
        }
        // 第一个参数是需要运行的类
        String aimClass = args[0];

        // 剩下的参数将作为运行目标类时的参数, 将这些参数复制到一个新数组中
        String[] params = new String[args.length - 1];
        System.arraycopy(args, 1, params, 0, params.length);

        MyClassLoader myClassLoader = new MyClassLoader();
        // 加载需要运行的类
        Class<?> clazz = myClassLoader.loadClass(aimClass);

        // 获取需要运行的类的主方法
        Method main = clazz.getMethod("main", String[].class);
        Object[] argsArray = {params};
        main.invoke(null, argsArray);
    }

    // 重写ClassLoader的findClass方法
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        Class<?> clazz = null;

        // 将包路径中的点（.）替换成斜线（/）
        String fileStub = name.replace(".", "/");
        String javaFilename = fileStub + ".java";
        String classFilename = fileStub + ".class";
        File javaFile = new File(javaFilename);
        File classFile = new File(classFilename);

        // 当指定Java源文件存在，且class文件不存在、或者Java源文件
        // 的修改时间比class文件修改时间更晚，重新编译
        if (javaFile.exists() && (!classFile.exists()
            || javaFile.lastModified() > classFile.lastModified())) {
            try {
                // 如果编译失败，或者该Class文件不存在
                if (!compile(javaFilename) || !classFile.exists()) {
                    throw new ClassNotFoundException("ClassNotFoundException:" + javaFilename);
                }
            } catch (IOException ex) {
                ex.printStackTrace();
            }
        }
        // 如果class文件存在，系统负责将该文件转换成Class对象
        if (classFile.exists()) {
            try {
                // 将class文件的二进制数据读入数组
                byte[] raw = getBytes(classFilename);
                // 调用ClassLoader的defineClass方法将二进制数据转换成Class对象
                clazz = defineClass(name, raw, 0, raw.length);
            } catch (IOException ie) {
                ie.printStackTrace();
            }
        }
        // 如果clazz为null，表明加载失败，则抛出异常
        if (clazz == null) {
            throw new ClassNotFoundException(name);
        }
        return clazz;
    }

    // 定义编译指定Java文件的方法
    private boolean compile(String javaFile)
        throws IOException {
        System.out.println("MyClassLoader: 正在编译 " + javaFile + "...");
        // 调用系统的javac命令
        Process p = Runtime.getRuntime().exec("javac " + javaFile);

        try {
            // 其他线程都等待这个线程完成
            p.waitFor();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        // 获取javac线程的退出值
        int ret = p.exitValue();

        // 返回编译是否成功
        return ret == 0;
    }

    // 读取一个文件的内容
    private byte[] getBytes(String filename) throws IOException {
        File file = new File(filename);
        long len = file.length();
        byte[] raw = new byte[(int) len];
        try (FileInputStream fis = new FileInputStream(file)) {
            // 一次读取class文件的全部二进制数据
            int r = fis.read(raw);
            if (r != len)
                throw new IOException("无法读取全部文件：" + r + " != " + len);
            return raw;
        }
    }

}
```

><br/>
>
>**说明:**
>
>-   **getBytes(String filename)方法: 从class文件中读取二进制内容**
>-   **compile(String javaFile)方法: 调用系统的javac命令编译文件**
>-   **重写父类ClassLoader的findClass(String name)方法: 通过getBytes方法读入文件内容, 然后通过父类的defineClass方法将二进制数据转为Class对象并返回;**
>-   **main方法: 读入命令行启动参数, 调用findClass方法编译并加载对应的类, 最后使用反射构造类对象对应的实例, 并通过反射调用实例的main方法**

<br/>

自定义加载器的测试加载类Hello:

```java
public class Hello {

    public static void main(String[] args) {
        for (String arg : args) {
            System.out.println("运行Hello的参数：" + arg);
        }
    }

}
```

<br/>

**运行**

```bash
$ java MyClassLoader.java Hello UseMyClassLoader

MyClassLoader: 正在编译 Hello.java...
运行Hello的参数：UseMyClassLoader
```

><br/>
>
>**说明:**
>
>1.  **使用`java MyClassLoader.java`直接编译运行MyClassLoader类, 并且指定编译并加载Hello类;**
>2.  **MyClassLoader在main方法中调用系统命令Javac 编译Hello.java文件, 之后通过loadClass()方法加载Hello.class字节码;**
>3.  **通过反射调用Hello类的main方法, 输出: `运行Hello的参数：UseMyClassLoader`**

