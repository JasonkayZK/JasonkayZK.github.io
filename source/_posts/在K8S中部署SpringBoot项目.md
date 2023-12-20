---
title: 在K8S中部署SpringBoot项目
toc: true
cover: 'https://img.paulzzh.com/touhou/random?2'
date: 2023-12-19 20:27:56
categories: Kubernetes
tags: [Kubernetes, Spring, Java, Kafka]
description: 在前几篇文章中，我们在Kubernetes中部署了StorageClass、StatefulSet等等；在这篇文章中，我们会部署实际的SpringBoot项目，来利用这些有状态的服务；
---

在前几篇文章中，我们在Kubernetes中部署了StorageClass、StatefulSet等等；

在这篇文章中，我们会部署实际的SpringBoot项目，来利用这些有状态的服务；

源代码：

-   https://github.com/JasonkayZK/kubernetes-learn/tree/proj/springboot-deploy-demo

<br/>

<!--more-->

# **在K8S中部署SpringBoot项目**

## **部署第一个SpringBoot-Web项目**

### **编写服务**

作为开始，我们先来部署一个最简单的 SpringBoot HelloWorld 级别的项目；

代码：

-   https://github.com/JasonkayZK/kubernetes-learn/tree/proj/springboot-deploy-demo/ch01-hello

>   **使用K8S部署Go项目，参考：**
>
>   -   [《使用K8S部署最简单的Go应用》](https://jasonkayzk.github.io/2021/10/31/使用K8S部署最简单的Go应用/)

代码非常简单：

src/main/java/io/jasonkayzk/github/controller/HelloController.java

```java
@RestController
public class HelloController {
    @GetMapping("/")
    public String index() throws UnknownHostException {
        return "Greetings from Spring Boot on: " + InetAddress.getLocalHost().getHostName() + "\n";
    }
}
```

访问 `/` 就会输出当前机器的 HostName；

<br/>

### **构建镜像**

打包项目：

```shell
mvn clean package
```

打包结果输出到 target 下面：

```
➜  target git:(proj/springboot-deploy-demo) tree -L 1
.
├── ch01-hello-1.0.0.jar
├── ch01-hello-1.0.0.jar.original
├── classes
├── generated-sources
├── maven-archiver
└── maven-status

5 directories, 2 files
```

编写 Dockerfile：

```dockerfile
FROM openjdk:8-jre-slim
MAINTAINER jasonkayzk@gmail.com
RUN mkdir /app
COPY target/*.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT [ "sh", "-c", "java $JAVA_OPTS -jar /app/app.jar" ]
```

在 Dockerfile 中我们定义了容器镜像，为 OpenJDK 官方提供的 JRE-8；

然后创建了 `/app` 目录，并将打包的 `jar` 复制进镜像中：`/app/app.jar`；

最后对外暴露服务端口 8080（**注意：这个是在 K8S 中为Pod在集群中访问的端口，并非K8S对外的端口！**）

最后使用 `java -jar` 启动服务；

Dockerfile 编写完成后，可以打包并上传镜像了：

```shell
docker build -t jasonkay/java-deploy-app:v1.0.0 .

docker push jasonkay/java-deploy-app:v1.0.0
```

>   **实际开发中，上面几步基本上是由 CI 组件做的，比如：Github Actions、Jenkins、Spinnaker 等等；**

<br/>

### **部署服务到 K8S 中**

编写 YAML 配置：

deploy/deployment.yaml

```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: java-deploy-app
  namespace: workspace # 声明工作空间，默认为default
spec:
  replicas: 3
  selector:
    matchLabels:
      name: java-deploy-app
  template:
    metadata:
      labels:
        name: java-deploy-app
    spec:
      containers:
        - name: java-deploy-container
          image: jasonkay/java-deploy-app:v1.0.0
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8080 # containerPort是声明容器内部的port

---
apiVersion: v1
kind: Service
metadata:
  name: java-deploy-app-service
  namespace: workspace # 声明工作空间，默认为default
spec:
  type: NodePort
  ports:
    - name: http
      port: 18888 # Service暴露在cluster-ip上的端口，通过<cluster-ip>:port访问服务,通过此端口集群内的服务可以相互访问
      targetPort: 8080 # Pod的外部访问端口，port和nodePort的数据通过这个端口进入到Pod内部，Pod里面的containers的端口映射到这个端口，提供服务
      nodePort: 32080 # Node节点的端口，<nodeIP>:nodePort 是提供给集群外部客户访问service的入口
  selector:
    name: java-deploy-app
```

主要是 Deployment 和 Service 两个部分；

Deployment 中定义：

-   部署名称；
-   部署用到的镜像；
-   部署镜像拉取策略；
-   容器暴露的端口；

Service 定义：

-   服务暴露的方式：NodePort；
-   暴露的端口配置：
    -   **`port: 18888`：Service暴露在cluster-ip上的端口，通过`<cluster-ip>:port`访问服务,通过此端口集群内的服务可以相互访问；**
    -   **`targetPort: 8080`：Pod的外部访问端口，port和nodePort的数据通过这个端口进入到Pod内部，Pod里面的containers的端口映射到这个端口，提供服务；**
    -   **`nodePort: 32080`：Node节点的端口，`<nodeIP>:nodePort` 是提供给集群外部客户访问service的入口；**

**端口的配置比较多，不要搞混了！**

定义好之后，就可以部署了：

```shell
kubectl apply -f deploy/deployment.yaml
```

查看结果：

```
➜  kubernetes-learn git:(proj/springboot-deploy-demo) k get pods -n workspace

NAME                               READY   STATUS    RESTARTS      AGE
java-deploy-app-7475c6f558-mzcbq   1/1     Running   0 (95m ago)   16h
java-deploy-app-7475c6f558-x7prr   1/1     Running   0 (96m ago)   16h
java-deploy-app-7475c6f558-zvcc7   1/1     Running   0 (94m ago)   16h
```

<br/>

### **测试服务**

最后通过 Curl 来测试我们的服务：

```shell
# curl <k8s-node-ip>:32080

curl 192.168.31.201:32080
Greetings from Spring Boot on: java-deploy-app-7475c6f558-zvcc7

curl 192.168.31.202:32080
Greetings from Spring Boot on: java-deploy-app-7475c6f558-zvcc7

curl 192.168.31.203:32080
Greetings from Spring Boot on: java-deploy-app-7475c6f558-zvcc7

curl 192.168.31.203:32080
Greetings from Spring Boot on: java-deploy-app-7475c6f558-mzcbq

curl 192.168.31.203:32080
Greetings from Spring Boot on: java-deploy-app-7475c6f558-x7prr
```

<br/>

## **连接有状态StatefulSet服务**

上一小节中，我们在 K8S 中部署了一个非常简单的服务；

接下来，将会将我们的服务连接到之前我们部署的 Kafka 集群；

<br/>

### **EmbeddedKafka**

在开始之前，先说一下，Kafka 为开发者提供了 `@EmbeddedKafka` 测试；

在开发过程中下，我们可以使用它来测试我们的代码；

ch02-kafka-integrate/src/test/java/ApplicationTests.java

```java
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.context.junit4.SpringRunner;

import java.io.IOException;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = ApplicationTests.class)
@EmbeddedKafka(count = 3, ports = {9092, 9093, 9094})
public class ApplicationTests {
    @Test
    public void contextLoads() throws IOException {
        System.in.read();
    }
}
```

只需要声明：`@EmbeddedKafka(count = 3, ports = {9092, 9093, 9094})` 即可！

执行测试即可创建 Kafka 集群！

<br/>

### **创建环境配置文件**

在 SpringBoot 项目中，基本上都会用 `application-{env}` 来区分环境；

总配置入口：

ch02-kafka-integrate/src/main/resources/application.yaml

```yaml
spring:
  profiles:
    active: dev
```

Dev 环境：

```yaml
server:
  port: 8080

spring:
  kafka:
    bootstrap-servers: 'localhost:9092'
    producer:
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
    consumer:
      auto-offset-reset: earliest

# custom kafka topic config
kafka:
  sasl-enable: false
  topic:
    my-topic: my-topic
    my-topic2: my-topic2
  topics:
    - name: topic0
      num-partitions: 3
      replication-factor: 1
    - name: topic1
      num-partitions: 1
      replication-factor: 1
    - name: topic2
      num-partitions: 2
      replication-factor: 1
```

上面的配置文件声明了开发环境的配置：

-   服务端口：8080（默认）；
-   Spring Kafka 配置：
    -   `bootstrap-servers: 'localhost:9092'`：配置地址；
    -   生产者：
        -   `value-serializer`：Value 序列化方式；
    -   消费者：
        -   `auto-offset-reset: earliest`：从最早的消息开始消费；

在 `kafka` 中：自定义了我们的 Topic，这里会用两种方法创建 Topic：

-   **`sasl-enable: false` 表示 Kafka 连接使用 SASL 认证，开发环境连接不需要，但是在连接部署在 K8S 中的 Kafka 集群需要；**

Prod 环境：

```yaml
server:
  port: 8080

spring:
  kafka:
    bootstrap-servers: 'kafka-broker-0.kafka-broker-headless.workspace.svc.cluster.local:9092,kafka-broker-1.kafka-broker-headless.workspace.svc.cluster.local:9092,kafka-broker-2.kafka-broker-headless.workspace.svc.cluster.local:9092'

# custom kafka topic config
kafka:
  sasl-enable: true
  topic:
    my-topic: my-topic
    my-topic2: my-topic2
  topics:
    - name: topic0
      num-partitions: 3
      replication-factor: 1
    - name: topic1
      num-partitions: 1
      replication-factor: 1
    - name: topic2
      num-partitions: 2
      replication-factor: 1
```

生产环境中的配置主要是通过 Spring 提供的配置类的形式配置；

这里只配置了 Kafka server 在集群中的地址；

>   **这里能够使用 Kafka 的服务名是因为我们的应用和 Kafka 服务在同一个 K8S 集群中；**

同时，将 `sasl-enable` 开启；

<br/>

### **创建Kafka配置类**

Kafka 整体配置：

ch02-kafka-integrate/src/main/java/io/jasonkayzk/github/configure/kafka/KafkaConfigure.java

```java
package io.jasonkayzk.github.configure.kafka;

import org.apache.kafka.clients.CommonClientConfigs;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.config.SaslConfigs;
import org.apache.kafka.common.security.plain.PlainLoginModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.support.converter.RecordMessageConverter;
import org.springframework.kafka.support.converter.StringJsonMessageConverter;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author zk
 */
@Configuration
public class KafkaConfigure {

    @Value("${spring.kafka.bootstrap-servers}")
    private List<String> bootstrapAddresses;

    @Value("${kafka.sasl-enable}")
    private boolean saslEnable;

    @Value("${KAFKA_USER}")
    private String kafkaUsername;

    @Value("${KAFKA_PASSWORD}")
    private String kafkaPassword;

    /**
     * Use Config in application.yaml
     */
    @Value("${kafka.topic.my-topic}")
    String myTopic;
    @Value("${kafka.topic.my-topic2}")
    String myTopic2;

    /**
     * Kafka connection config
     */
    @Bean
    public KafkaAdmin kafkaAdmin() {
        Map<String, Object> configs = new HashMap<>(8);
        configs.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapAddresses);

        if (saslEnable) {
            configs.put(CommonClientConfigs.SECURITY_PROTOCOL_CONFIG, "SASL_PLAINTEXT");
            configs.put(SaslConfigs.SASL_MECHANISM, "PLAIN");

            configs.put(SaslConfigs.SASL_JAAS_CONFIG, String.format(
                    "%s required username=\"%s\" " + "password=\"%s\";", PlainLoginModule.class.getName(), kafkaUsername, kafkaPassword
            ));
        }

        return new KafkaAdmin(configs);
    }

    @Bean
    public ProducerFactory<Object, Object> producerFactory() {
        Map<String, Object> configs = new HashMap<>(8);
        configs.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapAddresses);
        configs.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        configs.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);

        if (saslEnable) {
            configs.put(CommonClientConfigs.SECURITY_PROTOCOL_CONFIG, "SASL_PLAINTEXT");

            configs.put(SaslConfigs.SASL_MECHANISM, "PLAIN");
            configs.put(SaslConfigs.SASL_JAAS_CONFIG, String.format(
                    "%s required username=\"%s\" " + "password=\"%s\";", PlainLoginModule.class.getName(), kafkaUsername, kafkaPassword
            ));
        }

        return new DefaultKafkaProducerFactory<>(configs);
    }

    @Bean(name = "bookContainerFactory")
    public ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, Object> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        return factory;
    }

    public ConsumerFactory<String, Object> consumerFactory() {
        Map<String, Object> configs = new HashMap<>(8);
        configs.put(JsonDeserializer.TRUSTED_PACKAGES, "*");
        configs.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapAddresses);
        configs.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        configs.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        configs.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

        if (saslEnable) {
            configs.put(CommonClientConfigs.SECURITY_PROTOCOL_CONFIG, "SASL_PLAINTEXT");
            configs.put(SaslConfigs.SASL_MECHANISM, "PLAIN");
            configs.put(SaslConfigs.SASL_JAAS_CONFIG, String.format(
                    "%s required username='%s' " + "password='%s';", PlainLoginModule.class.getName(), kafkaUsername, kafkaPassword
            ));
        }

        return new DefaultKafkaConsumerFactory<>(configs);
    }

    /**
     * JSON消息转换器
     */
    @Bean
    public RecordMessageConverter jsonConverter() {
        return new StringJsonMessageConverter();
    }

    /**
     * 通过注入一个 NewTopic 类型的 Bean 来创建 topic，如果 topic 已存在，则会忽略。
     */
    @Bean
    public NewTopic myTopic() {
        return new NewTopic(myTopic, 2, (short) 1);
    }

    @Bean
    public NewTopic myTopic2() {
        return new NewTopic(myTopic2, 1, (short) 1);
    }
}
```

配置属性：

-   `bootstrapAddresses`：Kafka 服务地址，由 Yaml 配置提供；
-   `saslEnable`：Kafka 服务连接是否开启SASL，由 Yaml 配置提供；
-   `myTopic、myTopic2`：自定义topic名称，由 Yaml 配置提供；
-   `kafkaUsername`：Kafka 连接 Username，由环境变量提供；
-   `kafkaPassword`：Kafka 连接 Password，由环境变量提供；

>   <font color="#f00">**注：Kafka 部署在 K8S 后，集群的连接密码会存储在 Secrets 中；**</font>
>
>   <font color="#f00">**在实际使用时，我们可以将 Secrets 中的变量挂载到我们 Pod 的环境变量中来使用！**</font>

此外配置了：

-   **kafkaAdmin**：Kafka 管理总配置；
-   **producerFactory**：生产者配置；
-   **consumerFactory**：消费者配置；
-   **kafkaListenerContainerFactory**：Kafka Listener 配置；
-   **jsonConverter**：消息序列化转换器；

此外还创建了两个 Bean：**myTopic、myTopic2**；

通过注入一个 NewTopic 类型的 Bean 来直接创建 topic，如果 topic 已存在，则会忽略；

<br/>

Kafka Topic 配置：

除了通过注入一个 NewTopic 类型的 Bean 来创建 topic 的方式，还可以使用配置类来创建；

ch02-kafka-integrate/src/main/java/io/jasonkayzk/github/configure/kafka/KafkaTopicConfigure.java

```java
package io.jasonkayzk.github.configure.kafka;

import lombok.Data;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.support.GenericWebApplicationContext;

import javax.annotation.PostConstruct;
import java.util.List;

@Configuration
public class KafkaTopicConfigure {

    private final TopicConfiguration configuration;

    private final GenericWebApplicationContext context;

    public KafkaTopicConfigure(TopicConfiguration configuration, GenericWebApplicationContext genericContext) {
        this.configuration = configuration;
        this.context = genericContext;
    }

    @PostConstruct
    public void init() {
        initializeBeans(configuration.getTopics());
    }

    private void initializeBeans(List<TopicConfiguration.Topic> topics) {
        topics.forEach(t -> context.registerBean(t.name, NewTopic.class, t::toNewTopic));
    }
}

@Data
@Configuration
@ConfigurationProperties(prefix = "kafka")
class TopicConfiguration {
    private List<Topic> topics;

    @Data
    static class Topic {
        String name;
        Integer numPartitions = 3;
        Short replicationFactor = 1;

        NewTopic toNewTopic() {
            return new NewTopic(this.name, this.numPartitions, this.replicationFactor);
        }
    }
}
```

TopicConfiguration 类用来解析 `kafka.topics` 配置；

在 KafkaTopicConfigure 中，通过 `@PostConstruct` 来创建多个 NewTopic；

<br/>

### **编写生产者、消费者**

编写 Book 模型：

ch02-kafka-integrate/src/main/java/io/jasonkayzk/github/entity/Book.java

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Book {
    private Long id;

    private String name;
}
```

生产者：

ch02-kafka-integrate/src/main/java/io/jasonkayzk/github/kafka/BookProducer.java

```java
@Service
public class BookProducer {

    private static final Logger logger = LoggerFactory.getLogger(BookProducer.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public BookProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendMessage(String topic, Object o) {
        // 分区编号最好为 null，交给 kafka 自己去分配
        ProducerRecord<String, Object> producerRecord = new ProducerRecord<>(topic, null, System.currentTimeMillis(), String.valueOf(o.hashCode()), o);

        ListenableFuture<SendResult<String, Object>> future = kafkaTemplate.send(producerRecord);
        future.addCallback(result -> {
                    if (result != null) {
                        logger.info("生产者成功发送消息到topic:{} partition:{}的消息", result.getRecordMetadata().topic(), result.getRecordMetadata().partition());
                    }
                },
                ex -> logger.error("生产者发送消失败，原因：{}", ex.getMessage()));
    }
}
```

消费者：

ch02-kafka-integrate/src/main/java/io/jasonkayzk/github/kafka/BookConsumer.java

```java
@Service
public class BookConsumer {

    @Value("${kafka.topic.my-topic}")
    private String myTopic;
    @Value("${kafka.topic.my-topic2}")
    private String myTopic2;

    private final Logger logger = LoggerFactory.getLogger(BookConsumer.class);

    private final ObjectMapper objectMapper = new ObjectMapper();

    @KafkaListener(topics = {"${kafka.topic.my-topic}"}, groupId = "group1", containerFactory = "bookContainerFactory")
    public void consumeMessage(ConsumerRecord<String, String> bookConsumerRecord) {
        try {
            Book book = objectMapper.readValue(bookConsumerRecord.value(), Book.class);
            logger.info("消费者消费topic:{} partition:{}的消息 -> {}", bookConsumerRecord.topic(), bookConsumerRecord.partition(), book.toString());
        } catch (JsonProcessingException e) {
            logger.error(e.toString());
        }
    }

    @KafkaListener(topics = {"${kafka.topic.my-topic2}"}, groupId = "group2", containerFactory = "bookContainerFactory")
    public void consumeMessage2(Book book) {
        logger.info("消费者消费topic:{} 的消息 -> {}", myTopic2, book.toString());
    }
}
```

逻辑比较简单，这里不再赘述；

<br/>

### **编写服务**

最后来编写一个 Web 接口：

ch02-kafka-integrate/src/main/java/io/jasonkayzk/github/controller/BookController.java

```java
@RestController
@RequestMapping(value = "/book")
public class BookController {

    @Value("${kafka.topic.my-topic}")
    String myTopic;
    @Value("${kafka.topic.my-topic2}")
    String myTopic2;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final BookProducer producer;

    private final AtomicLong atomicLong = new AtomicLong();

    BookController(BookProducer producer) {
        this.producer = producer;
    }

    @PostMapping
    public void sendMessageToKafkaTopic(@RequestParam("name") String name) throws JsonProcessingException {
        this.producer.sendMessage(myTopic, objectMapper.writeValueAsString(new Book(atomicLong.addAndGet(1), name)));
        this.producer.sendMessage(myTopic2, new Book(atomicLong.addAndGet(1), name));
    }
}
```

接收到 `/book` 的 Post 请求之后，分别向 myTopic、myTopic2 发送一条消息；

<br/>

### **构建镜像**

创建 Dockerfile：

ch02-kafka-integrate/Dockerfile

```dockerfile
FROM openjdk:8-jre-slim
MAINTAINER jasonkayzk@gmail.com
RUN mkdir /app
COPY target/*.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT [ "sh", "-c", "java $JAVA_OPTS -jar /app/app.jar --spring.profiles.active=prod" ]
```

<font color="#f00">**这里需要注意，我们需要指定 Spring Profile 使用 `prod`，来使用生产环境的配置！**</font>

构建镜像：

```shell
docker build -t jasonkay/java-deploy-app:v1.0.1 .

docker push jasonkay/java-deploy-app:v1.0.1
```

<br/>

### **部署服务到K8S集群中**

编写 Deployment：

ch02-kafka-integrate/deploy/deployment.yaml

```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: java-deploy-app
  namespace: workspace # 声明工作空间，默认为default
spec:
  replicas: 3
  selector:
    matchLabels:
      name: java-deploy-app
  template:
    metadata:
      labels:
        name: java-deploy-app
    spec:
      containers:
        - name: java-deploy-container
          image: jasonkay/java-deploy-app:v1.0.1
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8080 # containerPort是声明容器内部的port
          env: # 将Secrets挂载为环境变量
            - name: KAFKA_USER
              value: 'user1'
            - name: KAFKA_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: kafka-user-passwords
                  key: client-passwords

---
apiVersion: v1
kind: Service
metadata:
  name: java-deploy-app-service
  namespace: workspace # 声明工作空间，默认为default
spec:
  type: NodePort
  ports:
    - name: http
      port: 18888 # Service暴露在cluster-ip上的端口，通过<cluster-ip>:port访问服务,通过此端口集群内的服务可以相互访问
      targetPort: 8080 # Pod的外部访问端口，port和nodePort的数据通过这个端口进入到Pod内部，Pod里面的containers的端口映射到这个端口，提供服务
      nodePort: 32080 # Node节点的端口，<nodeIP>:nodePort 是提供给集群外部客户访问service的入口
  selector:
    name: java-deploy-app
```

Service 的部分没有改变；

在 Deploment 部分，我们通过 env 将 Kafka 连接的 Secrets 配置挂载到了容器的环境变量中，这样上面的 Kafka 配置类就能获取到相关配置并正确连接！

部署：

```shell
kubectl apply -f ch02-kafka-integrate/deploy/deployment.yaml
```

<br/>

### **服务测试**

通过 Curl 命令测试服务：

```shell
curl -X POST -F 'name=Java' http://<k8s-node-ip>:32080/book

# 查看日志
k logs -n workspace java-deploy-app-578668888d-5m5dm | tail -n 20

2023-12-20 00:35:23.090  INFO 7 --- [ntainer#1-0-C-1] o.s.k.l.KafkaMessageListenerContainer    : group1: partitions assigned: [my-topic-0]
2023-12-20 00:35:23.102  INFO 7 --- [ntainer#1-0-C-1] io.jasonkayzk.github.kafka.BookConsumer  : 消费者消费topic:my-topic partition:0的消息 -> Book(id=1, name=Java)
2023-12-20 00:35:23.102  INFO 7 --- [ntainer#1-0-C-1] io.jasonkayzk.github.kafka.BookConsumer  : 消费者消费topic:my-topic partition:0的消息 -> Book(id=1, name=Java)
2023-12-20 00:35:23.102  INFO 7 --- [ntainer#1-0-C-1] io.jasonkayzk.github.kafka.BookConsumer  : 消费者消费topic:my-topic partition:0的消息 -> Book(id=1, name=Java)


k logs -n workspace java-deploy-app-578668888d-7hv9r | tail -n 20

2023-12-20 00:35:10.977  INFO 7 --- [ad | producer-1] io.jasonkayzk.github.kafka.BookProducer  : 生产者成功发送消息到topic:my-topic2 partition:0的消息
```







<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/kubernetes-learn/tree/proj/springboot-deploy-demo






<br/>
