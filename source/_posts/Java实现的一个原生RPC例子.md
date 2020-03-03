---
title: Java实现的一个原生RPC例子
toc: true
date: 2019-09-13 10:13:28
categories: 学习案例
cover: http://5b0988e595225.cdn.sohucs.com/q_70,c_zoom,w_640/images/20180616/3f10534bc3e042c3836a043b3244ab24.jpeg
tags: [RPC, JDK动态代理, 反射, 序列化, Socket, Lambda表达式]
description: 一个通过Java原生API实现的RPC的例子
---

这是一个简单的原生RPC例子，用了JDK动态代理,反射,JDK自带的序列化和反序列化以及JAVA原生Socket通信

本项目Github地址: https://github.com/JasonkayZK/Java_Samples/tree/java-rpc

<br/>

<!--more-->

## 一个Java实现的原生RPC例子

### 1. 项目说明

```
.
└── main
    ├── java
    │   └── rpc
    │       ├── api
    │       │   ├── bean
    │       │   │   ├── NetModel.java
    │       │   │   └── Person.java
    │       │   └── util
    │       │       └── SerializeUtils.java
    │       ├── client
    │       │   ├── proxy
    │       │   │   └── ProxyFactory.java
    │       │   └── RpcClient.java
    │       └── server
    │           ├── RpcServer.java
    │           └── service
    │               ├── HelloService.java
    │               └── impl
    │                   └── HelloServiceImpl.java
    └── resources
        └── config.properties

```

本项目为一个RPC Maven项目, 共有三个模块: 

-   API模块: 公共类
-   Server模块: 服务端
-   Client模块: 客户端



<br/>

-----------------------------------------



### 2. API模块

#### 1) JavaBean: Person

```java
package rpc.api.bean;

import java.io.Serializable;

/**
 * 普通公共Bean
 */
public class Person implements Serializable {

    private static final long serialVersionUID = 5542635716484888244L;

    private String name;

    private Integer age;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    @Override
    public String toString() {
        return "Person{" +
                "name='" + name + '\'' +
                ", age=" + age +
                '}';
    }
}

```

作为RPC传输的Java Bean.

<br/>

#### 2): Model: NetModel RPC网络传输模型

```java
package rpc.api.bean;

import java.io.Serializable;
import java.util.Arrays;

/**
 * 公共网络通信模型类
 *
 * 通过序列化该类, 将客户端调用的接口, 方法, 参数类型封装,
 *
 * 然后服务端反序列化, 再通过反射, 调取相应实现类的方法!
 *
 */
public class NetModel implements Serializable {

    private static final long serialVersionUID = 3152168260407524091L;

    // 接口名
    private String className;

    // 方法命
    private String method;

    // 参数表
    private Object[] args;

    // 参数类型
    private String[] types;


    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public Object[] getArgs() {
        return args;
    }

    public void setArgs(Object[] args) {
        this.args = args;
    }

    public String[] getTypes() {
        return types;
    }

    public void setTypes(String[] types) {
        this.types = types;
    }

    @Override
    public String toString() {
        return "NetModel{" +
                "className='" + className + '\'' +
                ", method='" + method + '\'' +
                ", args=" + Arrays.toString(args) +
                ", types=" + Arrays.toString(types) +
                '}';
    }
}

```

公共网络通信模型类: 

 * <font color="#0000ff">通过序列化该类, 将客户端调用的接口, 方法, 参数类型封装;</font>
 * <font color="#0000ff">然后服务端反序列化, 再通过反射, 调取相应实现类的方法!</font>

<font color="#ff0000">此NetModel也是以`JavaBean`的形式给出的! 用于封装RPC的调用参数!</font>

<br/>

#### 3): Util: SerializeUtils 序列化工具类

```java
package rpc.api.util;

import java.io.*;

/**
 * @author zk
 */
public class SerializeUtils {

    /**
     * 序列化
     *
     * @param object
     * @return
     */
    public static byte[] serialize(Object object) {
        ByteArrayOutputStream os = null;
        ObjectOutputStream outputStream = null;
        try {
            os = new ByteArrayOutputStream();
            outputStream = new ObjectOutputStream(os);

            outputStream.writeObject(object);
            outputStream.flush();

            byte[] bytes = os.toByteArray();

            return bytes;
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                if (outputStream != null) {
                    outputStream.close();
                }
                if (os != null) {
                    os.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        throw new RuntimeException("Fail to serialize!");
    }


    /**
     * 反序列化
     *
     * @param buf
     * @return
     */
    public static Object deserialize(byte[] buf) {
        ByteArrayInputStream is = null;
        ObjectInputStream inputStream = null;
        try {
            is = new ByteArrayInputStream(buf);
            inputStream = new ObjectInputStream(is);
            Object object = inputStream.readObject();

            return object;
        } catch (IOException e) {
            e.printStackTrace();
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } finally {
            try {
                if (inputStream != null) {
                    inputStream.close();
                }
                if (is != null) {
                    is.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        return new RuntimeException("Fail to deserialize!");
    }

}

```

通过调用**JDK提供的原生序列化和反序列化方法**完成对RPC对象的序列化方法!

<br/>

### 3. Server模块

#### 1): Service: HelloService & HelloServiceImpl 业务方法接口与实现类

业务接口:

```java
package rpc.server.service;

import rpc.api.bean.Person;

// 公共服务接口类
public interface HelloService {
    String sayHello(String name);

    Person getPerson(String name);
}

```

业务接口实现类:

```java
package rpc.server.service.impl;

import rpc.api.bean.Person;
import rpc.server.service.HelloService;

/**
 * RPC服务实现类
 *
 */
public class HelloServiceImpl implements HelloService {

    @Override
    public String sayHello(String name) {
        return "Say hello to " + name;
    }

    @Override
    public Person getPerson(String name) {
        Person person = new Person();
        person.setName(name);
        person.setAge(22);

        return person;
    }
}

```

业务接口的对应实现类!

<br/>

#### 2): Server: RpcServer 服务端

```java
package rpc.server;

import rpc.api.bean.NetModel;
import rpc.api.util.SerializeUtils;

import java.io.*;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.Properties;

/**
 * Server服务端
 *
 * 使用JDK自带的ServerSocket进行.
 *
 * 服务端收到数据之后, 对数据进行处理, 处理完成之后, 把结果返回给客户端!
 *
 */
public class RpcServer {

    /**
     * 配置文件
     */
    private static Properties properties;

    /**
     * 读入配置信息
     */
    static {
        properties = new Properties();
        InputStream in = null;
        try {
            in = RpcServer.class.getClassLoader().getResourceAsStream("config.properties");
            properties.load(in);
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
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

    public static void main(String[] args) {
        openServer();
    }

    /**
     * 此方法用来启动服务端, 然后接受数据, 并返回处理完的结果
     *
     */
    public static void openServer() {
        ServerSocket serverSocket = null;
        Socket socket = null;
        try {
            serverSocket = new ServerSocket(9999);
            System.out.println("Service on!");

            while (true) {
                socket = serverSocket.accept();
                System.out.println(socket.getInetAddress() + "-connected!");

                InputStream in = socket.getInputStream();
                byte[] buf = new byte[1024];
                in.read(buf);

                byte[] formatData = formatData(buf);

                OutputStream out = socket.getOutputStream();
                out.write(formatData);
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (socket != null) {
                try {
                    socket.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            if (serverSocket != null) {
                try {
                    serverSocket.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    /**
     * 处理接收到的数据, 通过反序列化得到传递的NetModel!
     *
     * 然后得到接口名, 方法名, 参数, 参数类型;
     *
     * 最后通过JDK反射, 调用实现类的方法, 并将结果序列化后, 返回byte数组
     *
     * @param bs
     * @return
     */
    private static byte[] formatData(byte[] bs) {
        try {
            // 收到的NetModel二进制反序列化为NetModel模型, 然后通过反射调用服务实现类的方法
            NetModel netModel = (NetModel) SerializeUtils.deserialize(bs);
            String className = netModel.getClassName();
            String[] types = netModel.getTypes();
            Object[] args = netModel.getArgs();

            /*
                1. 通过Map来做接口映射到实现类, 从map取出实现类方法

                Map<String, String> map = new HashMap<>();
                map.put("rpc.server.service.HelloService", "rpc.server.service.impl.HelloServiceImpl");
                Class<?> clazz = Class.forName(map.className);
             */

            /*
                2. 放在配置文件下, 读取配置文件读取
             */
            Class<?> clazz = Class.forName(getPropertyValue(className));
            Class<?>[] typeClazzs = null;

            if (types != null) {
                typeClazzs = new Class[types.length];
                for (int i = 0; i < types.length; i++) {
                    typeClazzs[i] = Class.forName(types[i]);
                }
            }

            Method method = clazz.getMethod(netModel.getMethod(), typeClazzs);
            Object object = method.invoke(clazz.newInstance(), args);

            byte[] bytes = SerializeUtils.serialize(object);
            return bytes;
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } catch (NoSuchMethodException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (InstantiationException e) {
            e.printStackTrace();
        } catch (InvocationTargetException e) {
            e.printStackTrace();
        }
        throw new RuntimeException("Fail to format data");
    }

    private static String getPropertyValue(String key) {
        return properties.getProperty(key);
    }

}

```

<font color="#0000ff">使用JDK自带的`ServerSocket`进行. 服务端收到数据后, 对对象进行处理, 处理完成后再将结果返回给客户端!</font>

<br/>

对应的配置文件: `config.properties`

```properties
rpc.server.service.HelloService=rpc.server.service.impl.HelloServiceImpl
```

<br/>



-------------------------------



### 4. Client 模块

#### 1): Client: RpcClient

```java
package rpc.client;

import rpc.client.proxy.ProxyFactory;
import rpc.api.util.SerializeUtils;
import rpc.server.service.HelloService;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.net.UnknownHostException;

/**
 * RPC客户端, 使用Socket与服务端通信
 *
 */
public class RpcClient {

    public static Object send(byte[] bs) {
        Socket socket = null;
        OutputStream outputStream = null;
        InputStream in = null;

        try {
            socket = new Socket("127.0.0.1", 9999);

            outputStream = socket.getOutputStream();

            outputStream.write(bs);

            in = socket.getInputStream();
            byte[] buf = new byte[1024];
            in.read(buf);

            Object formatData = SerializeUtils.deserialize(buf);

            return formatData;
        } catch (UnknownHostException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (socket != null) {
                try {
                    socket.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }

        throw new RuntimeException("Fail to send data!");
    }

    /**
     * 运行main, 开启客户端
     *
     * @param args
     */
    public static void main(String[] args) {
        HelloService helloService = ProxyFactory.getInstance(HelloService.class);
        System.out.println("say: " + helloService.sayHello("zhangsan"));
        System.out.println("Person: " + helloService.getPerson("zhangsan"));
    }

}

```

<font color="#0000ff">客户端的`send方法`通过Socket与服务端通信: *发送序列化过的请求信息, 并接收服务端处理过得数据并进行反序列化后返回!*</font>  

<br/>

#### 2): Proxy: ProxyFactory 动态代理类

```java
package rpc.client.proxy;

import rpc.api.bean.NetModel;
import rpc.api.util.SerializeUtils;
import rpc.client.RpcClient;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;

public class ProxyFactory {

    private static InvocationHandler handler = (proxy, method, args) -> {
        NetModel netModel = new NetModel();

        Class<?>[] classes = proxy.getClass().getInterfaces();
        String className = classes[0].getName();

        netModel.setClassName(className);
        netModel.setArgs(args);
        netModel.setMethod(method.getName());
        String[] types = null;

        if (args != null) {
            types = new String[args.length];
            for (int i = 0; i < types.length; i++) {
                types[i] = args[i].getClass().getName();
            }
        }
        netModel.setTypes(types);

        byte[] bytes = SerializeUtils.serialize(netModel);

        return RpcClient.send(bytes);
    };

    @SuppressWarnings("unchecked")
    public static <T> T getInstance(Class<T> serviceClass) {
        return (T) Proxy.newProxyInstance(serviceClass.getClassLoader(), new Class[] {serviceClass}, handler);
    }
}

```

<font color="#0000ff">代理工厂类ProxyFactory. </font>

-   <font color="#ff0000">客户端通过调用方法`getInstance()`,动态代理生成代理接口类;</font>

-   <font color="#0000ff">代理接口调用方法的时候,该`代理类会去调用InvocationHandler 中的invoke方法`;</font>

-   <font color="#ff0000">在invoke方法中能得到代理接口的全名,调用的方法,参数和参数类型，然后将这些参数封装在NetModel中, 然后序列化NetModel,将序列化后的byte数组调用RPCClient中的send方法,将消息发送给服务端;</font>

-   <font color="#ff0000">服务端然后将消息反序列化,得到接口名,方法名,参数,参数类型,`最后通过JDK反射,来调取实现类的方法,并将调取结果,序列化为byte数组,然后返回;`</font>

-   <font color="#0000ff">send再将byte数组反序列化对象,返回给调用者</font>

-   <font color="#0000ff">最后invoke再将send方法的返回值返回，这个返回值就是客户端调用接口的返回值了!</font>

    <br/>

<font color="#00ff00">这个过程也就是客户端与服务端通信的过程</font>

<br/>

-------------------------------------



### 5. 调用测试

先开启Server端, 输出:

```
Service on!
```

<br/>

再开启客户端, 向服务端发送请求, 客户端收到回复:

```
say: Say hello to zhangsan
Person: Person{name='zhangsan', age=22}
```

<br/>

服务端收到Socket请求:

```
Service on!
/127.0.0.1-connected!
/127.0.0.1-connected!
```

<br/>

### 附录

本项目Github地址: https://github.com/JasonkayZK/Java_Samples/tree/java-rpc

