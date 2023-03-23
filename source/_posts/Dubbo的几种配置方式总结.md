---
title: Dubbo的几种配置方式总结
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?55'
date: 2023-03-23 14:02:19
categories: Dubbo
tags: [Dubbo]
description: 本文讲解了Dubbo的几种配置方式，包括XML、API以及Annotation的方式；Dubbo版本基于2.x；
---

本文讲解了Dubbo的几种配置方式，包括XML、API以及Annotation的方式；Dubbo版本基于2.x；

源代码：

-   https://github.com/JasonkayZK/java-all/tree/main/dubbo2

<br/>

<!--more-->

# **Dubbo的几种配置方式总结**

## **XML方式**

XML 方式和 Spring 框架中的 XML 配置方式一模一样；

### **接口实现**

io/github/jasonkayzk/impl/BasicHelloServiceImpl.java

```java
public class BasicHelloServiceImpl implements HelloService {
    @Override
    public String sayHello(String name) {
        System.out.println("[" + new SimpleDateFormat("HH:mm:ss").format(new Date())
                + "] Hello " + name + ", request from consumer: "
                + RpcContext.getContext().getRemoteAddress());
        return "Hello " + name + ", response from provider: " + RpcContext.getContext().getLocalAddress();
    }
}
```

<br/>

### **Provider实现**

io/github/jasonkayzk/XmlProviderBootstrap.java

```java
public class XmlProviderBootstrap {

    public static void main(String[] args) throws Exception {
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext(
                new String[]{"spring/dubbo-demo-provider.xml"});
        context.start();

        System.in.read(); // press any key to exit
    }
  
}
```

上面的代码读取了 resources 下的配置：

spring/dubbo-demo-provider.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xmlns="http://www.springframework.org/schema/beans"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd
       http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">

    <!-- provider's application name, used for tracing dependency relationship -->
    <dubbo:application name="demo-provider"/>

    <!-- use multicast registry center to export service -->
    <dubbo:registry group="aaa" address="zookeeper://127.0.0.1:2181"/>
    <dubbo:registry address="zookeeper://127.0.0.1:2181"/>
    <!--<dubbo:registry address="zookeeper://11.163.250.27:2181"/>-->

    <!-- use dubbo protocol to export service on port 20880 -->
    <dubbo:protocol name="dubbo" port="20890"/>

    <!-- service implementation, as same as regular local bean -->
    <bean id="helloService" class="io.github.jasonkayzk.impl.BasicHelloServiceImpl"/>

    <!-- declare the service interface to be exported -->
    <dubbo:service interface="io.github.jasonkayzk.HelloService" ref="helloService"/>

</beans>
```

<br/>

### **Consumer配置**

Consumer实现：

io/github/jasonkayzk/XmlConsumerBootstrap.java

```java
public class XmlConsumerBootstrap {

    public static void main(String[] args) {
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext(
                new String[]{"spring/dubbo-demo-consumer.xml"});
        context.start();

        // get remote service proxy
        HelloService helloService = (HelloService) context.getBean("demoService");

        while (true) {
            try {
                Thread.sleep(1000);
                String hello = helloService.sayHello("world"); // call remote method
                System.out.println(hello); // get result
            } catch (Throwable throwable) {
                throwable.printStackTrace();
            }
        }
    }
}
```

配置：

spring/dubbo-demo-consumer.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xmlns="http://www.springframework.org/schema/beans"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd
       http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">

    <!-- consumer's application name, used for tracing dependency relationship (not a matching criterion),
    don't set it same as provider -->
    <dubbo:application name="demo-consumer"/>

    <!-- use multicast registry center to discover service -->
    <dubbo:registry group="aaa" address="zookeeper://127.0.0.1:2181"/>

    <!-- generate proxy for the remote service, then demoService can be used in the same way as the
    local regular interface -->
    <dubbo:reference id="demoService" check="false" interface="io.github.jasonkayzk.HelloService"/>

</beans>
```

<br/>

## **API方式**

如果不想编写 XML，可以使用API的方式进行配置：

### **Provider实现**

Provider实现如下：

dubbo2/b-hello-dubbo-api/src/main/java/io/github/jasonkayzk/ApiProviderBootstrap.java

```java
public class ApiProviderBootstrap {

    public static void main(String[] args) throws Exception {
        // 服务实现
        HelloService helloService = new ApiHelloServiceImpl();

        // 当前应用配置
        ApplicationConfig application = new ApplicationConfig();
        application.setName("api-hello-provider");

        // 连接注册中心配置
        RegistryConfig registry = new RegistryConfig();
        registry.setAddress("zookeeper://127.0.0.1:2181");

        // 服务提供者协议配置
        ProtocolConfig protocol = new ProtocolConfig();
        protocol.setName("dubbo");
        protocol.setPort(12345);
        protocol.setThreads(20);

        // 注意：ServiceConfig为重对象，内部封装了与注册中心的连接，以及开启服务端口

        // 服务提供者暴露服务配置
        // 此实例很重，封装了与注册中心的连接，请自行缓存，否则可能造成内存和连接泄漏
        ServiceConfig<HelloService> service = new ServiceConfig<>();
        service.setApplication(application);
        service.setRegistry(registry); // 多个注册中心可以用setRegistries()
        service.setProtocol(protocol); // 多个协议可以用setProtocols()
        service.setInterface(HelloService.class);
        service.setRef(helloService);
        service.setVersion("1.0.0");

        // 暴露及注册服务
        service.export();

        System.in.read(); // press any key to exit
    }
}
```

<br/>

### **Consumer实现**

dubbo2/b-hello-dubbo-api/src/main/java/io/github/jasonkayzk/ApiConsumerBootstrap.java

```java
public class ApiConsumerBootstrap {

    public static void main(String[] args) {
        // 当前应用配置
        ApplicationConfig application = new ApplicationConfig();
        application.setName("api-hello-consumer");

        // 连接注册中心配置
        RegistryConfig registry = new RegistryConfig();
        registry.setAddress("zookeeper://127.0.0.1:2181");

        // 注意：ReferenceConfig为重对象，内部封装了与注册中心的连接，以及与服务提供方的连接

        // 引用远程服务
        // 此实例很重，封装了与注册中心的连接以及与提供者的连接，请自行缓存，否则可能造成内存和连接泄漏
        ReferenceConfig<HelloService> reference = new ReferenceConfig<>();
        reference.setApplication(application);
        reference.setRegistry(registry); // 多个注册中心可以用setRegistries()
        reference.setInterface(HelloService.class);
        reference.setVersion("1.0.0");

        // 和本地bean一样使用xxxService
        // 注意：此代理对象内部封装了所有通讯细节，对象较重，请缓存复用
        HelloService helloService = reference.get();

        // get remote service proxy
//        HelloService helloService = (HelloService) context.getBean("helloService");

        while (true) {
            try {
                Thread.sleep(1000);
                String hello = helloService.sayHello("world"); // call remote method
                System.out.println(hello); // get result
            } catch (Throwable throwable) {
                throwable.printStackTrace();
            }
        }
    }
}
```

<br/>

## **Annotation方式**

### **接口实现**

#### **Provider中接口实现：**

dubbo2/c-hello-dubbo-annotation/src/main/java/io/github/jasonkayzk/provider/impl/AnnotationHelloServiceImpl.java

```java
@Service
public class AnnotationHelloServiceImpl implements HelloService {
    @Override
    public String sayHello(String name) {
        System.out.println("[" + new SimpleDateFormat("HH:mm:ss").format(new Date())
                + "] Hello " + name + ", request from consumer: "
                + RpcContext.getContext().getRemoteAddress());
        return "Hello " + name + ", response from annotation-provider: " + RpcContext.getContext().getLocalAddress();
    }
}
```

使用了 `@Service` 注解；

<br/>

#### **Consumer中Action声明**

使用注解方式需要在 Consumer 中声明接口，从而将具体的实现注入；：

dubbo2/c-hello-dubbo-annotation/src/main/java/io/github/jasonkayzk/consumer/action/AnnotationHelloAction.java

```java
@Component("annotationHelloAction")
public class AnnotationHelloAction {

    @Reference
    private HelloService helloService;

    public String doSayHello(String name) {
        return helloService.sayHello(name);
    }

}
```

<br/>

### **Annotation中使用Property配置**

#### **Provider的配置及启动**

Property配置如下：

dubbo2/c-hello-dubbo-annotation/src/main/resources/spring/dubbo-provider.properties

```properties
dubbo.application.name=annotation-configuration-provider
dubbo.registry.address=zookeeper://127.0.0.1:2181
dubbo.protocol.name=dubbo
dubbo.protocol.port=20880
```

启动实现：

dubbo2/c-hello-dubbo-annotation/src/main/java/io/github/jasonkayzk/provider/AnnotationPropertyProviderBootstrap.java

```java
@Configuration
@EnableDubbo(scanBasePackages = "io.github.jasonkayzk.consumer.action")
@ComponentScan(value = {"io.github.jasonkayzk.consumer.action"})
@PropertySource("classpath:/spring/dubbo-consumer.properties")
class AnnotationPropertyConsumerConfiguration {
}

public class AnnotationPropertyConsumerBootstrap {

    public static void main(String[] args) throws InterruptedException {
        AnnotationConfigApplicationContext context =
                new AnnotationConfigApplicationContext(AnnotationPropertyConsumerConfiguration.class);
        context.start();

        AnnotationHelloAction helloService = context.getBean(AnnotationHelloAction.class);

        for (int i = 0; i < 10; i++) {
            String hello = helloService.doSayHello("annotation-config");
            System.out.println("result: " + hello);
            Thread.sleep(1000);
        }
    }

}
```

<br/>

#### **Consumer的配置及启动**

Property配置如下：

dubbo2/c-hello-dubbo-annotation/src/main/resources/spring/dubbo-consumer.properties

```properties
dubbo.application.name=annotation-configuration-consumer
dubbo.registry.address=zookeeper://127.0.0.1:2181
dubbo.consumer.timeout=3000
```

启动如下：

dubbo2/c-hello-dubbo-annotation/src/main/java/io/github/jasonkayzk/consumer/AnnotationPropertyConsumerBootstrap.java

```java
@Configuration
@EnableDubbo(scanBasePackages = "io.github.jasonkayzk.consumer.action")
@ComponentScan(value = {"io.github.jasonkayzk.consumer.action"})
@PropertySource("classpath:/spring/dubbo-consumer.properties")
class AnnotationPropertyConsumerConfiguration {
}

public class AnnotationPropertyConsumerBootstrap {

    public static void main(String[] args) throws InterruptedException {
        AnnotationConfigApplicationContext context =
                new AnnotationConfigApplicationContext(AnnotationPropertyConsumerConfiguration.class);
        context.start();

        AnnotationHelloAction helloService = context.getBean(AnnotationHelloAction.class);

        for (int i = 0; i < 10; i++) {
            String hello = helloService.doSayHello("annotation-config");
            System.out.println("result: " + hello);
            Thread.sleep(1000);
        }
    }
}
```

<br/>

### **使用SpringBean注入**

除了从 Property 中配置，还可以使用 Spring Bean 注入的方式来进行配置；

#### **Provider配置**

dubbo2/c-hello-dubbo-annotation/src/main/java/io/github/jasonkayzk/AnnotationProviderBootstrap.java

```java
@Configuration
@EnableDubbo(scanBasePackages = "io.github.jasonkayzk.provider.impl")
class ProviderConfiguration {
    @Bean
    public ProviderConfig providerConfig() {
        ProviderConfig providerConfig = new ProviderConfig();
        providerConfig.setTimeout(1000);
        return providerConfig;
    }

    @Bean
    public ApplicationConfig applicationConfig() {
        ApplicationConfig applicationConfig = new ApplicationConfig();
        applicationConfig.setName("dubbo-annotation-provider");
        return applicationConfig;
    }

    @Bean
    public RegistryConfig registryConfig() {
        RegistryConfig registryConfig = new RegistryConfig();
        registryConfig.setProtocol("zookeeper");
        registryConfig.setAddress("localhost");
        registryConfig.setPort(2181);
        return registryConfig;
    }

    @Bean
    public ProtocolConfig protocolConfig() {
        ProtocolConfig protocolConfig = new ProtocolConfig();
        protocolConfig.setName("dubbo");
        protocolConfig.setPort(20880);
        return protocolConfig;
    }
}

public class AnnotationProviderBootstrap {

    public static void main(String[] args) throws IOException {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(ProviderConfiguration.class);
        context.start();
        System.in.read();
    }

}
```

<br/>

#### **Consumer配置**

dubbo2/c-hello-dubbo-annotation/src/main/java/io/github/jasonkayzk/AnnotationConsumerBootstrap.java

```java
@Configuration
@EnableDubbo(scanBasePackages = "io.github.jasonkayzk.consumer.action")
@ComponentScan(value = {"io.github.jasonkayzk.consumer.action"})
class ConsumerConfiguration {
    @Bean
    public ApplicationConfig applicationConfig() {
        ApplicationConfig applicationConfig = new ApplicationConfig();
        applicationConfig.setName("dubbo-annotation");
        return applicationConfig;
    }

    @Bean
    public ConsumerConfig consumerConfig() {
        ConsumerConfig consumerConfig = new ConsumerConfig();
        consumerConfig.setTimeout(3000);
        return consumerConfig;
    }

    @Bean
    public RegistryConfig registryConfig() {
        RegistryConfig registryConfig = new RegistryConfig();
        registryConfig.setProtocol("zookeeper");
        registryConfig.setAddress("localhost");
        registryConfig.setPort(2181);
        return registryConfig;
    }
}
public class AnnotationConsumerBootstrap {

    public static void main(String[] args) throws InterruptedException {
        AnnotationConfigApplicationContext ctx = new AnnotationConfigApplicationContext(ConsumerConfiguration.class);
        ctx.start();
        AnnotationHelloAction greetingServiceConsumer = ctx.getBean(AnnotationHelloAction.class);

        for (int i = 0; i < 10; i++) {
            String hello = greetingServiceConsumer.doSayHello("annotation-config");
            System.out.println("result: " + hello);
            Thread.sleep(1000);
        }
    }
}
```

<br/>

## **使用YAML配置**

上面的配置主要是通过 XML 或者 Property 的方式，实际上阅读起来并没有那么容易；

比较高版本的 SpringBoot 中可以使用 YAML 的方式进行配置；

<br/>

### **YAML配置转换工厂类**

创建一个工厂类用于将YAML配置转为Property配置：

dubbo2/d-hello-dubbo-yaml/src/main/java/io/github/jasonkayzk/utils/YamlPropertySourceFactory.java

```java
public class YamlPropertySourceFactory extends DefaultPropertySourceFactory {

    @Override
    public PropertySource<?> createPropertySource(String name, EncodedResource resource) throws IOException {
        List<PropertySource<?>> sources = new YamlPropertySourceLoader().load(resource.getResource().getFilename(),resource.getResource());
        return sources.get(0);
    }
}
```

<br/>

### **Provider配置**

使用 YAML 配置 Provider：

dubbo2/d-hello-dubbo-yaml/src/main/resources/dubbo-provider.yml

```yaml
dubbo:
  application:
    name: "yaml-configuration-provider"
  registry:
    address: "zookeeper://127.0.0.1:2181"
  protocol:
    name: "dubbo"
    port: "20880"
```

配置 Bean 代码：

dubbo2/d-hello-dubbo-yaml/src/main/java/io/github/jasonkayzk/provider/config/YamlConfigProviderConfig.java

```java
@Configuration
@EnableDubbo(scanBasePackages = "io.github.jasonkayzk.provider.impl")
@PropertySource(value = "classpath:dubbo-provider.yml", factory = YamlPropertySourceFactory.class)
public class YamlConfigProviderConfig {
}
```

<br/>

### **Consumer配置**

YAML 配置：

dubbo2/d-hello-dubbo-yaml/src/main/resources/dubbo-consumer.yml

```yaml
dubbo:
  application:
    name: "yaml-configuration-consumer"
  registry:
    address: "zookeeper://127.0.0.1:2181"
  consumer:
    timeout: 3000
```

配置 Bean 代码：

dubbo2/d-hello-dubbo-yaml/src/main/java/io/github/jasonkayzk/consumer/config/YamlConfigConsumerConfig.java

```java
@Configuration
@EnableDubbo(scanBasePackages = "io.github.jasonkayzk.consumer.action")
@ComponentScan(value = {"io.github.jasonkayzk.consumer.action"})
@PropertySource(value = "classpath:dubbo-consumer.yml", factory = YamlPropertySourceFactory.class)
public class YamlConfigConsumerConfig {
}
```

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/java-all/tree/main/dubbo2

参考文章：

-   https://cn.dubbo.apache.org/zh-cn/docsv2.7/user/configuration/


<br/>
