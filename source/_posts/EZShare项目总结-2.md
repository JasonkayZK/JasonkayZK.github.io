---
title: EZShare项目总结-2
toc: true
date: 2020-01-22 20:39:16
cover: https://img.paulzzh.tech/touhou/random?14
categories: 项目总结
tags: [项目总结]
description: 本篇在数据库表建立完毕的基础之上, 总结一下EZShare项目的后端技术选型(后续可能会进行修改和添加), 以及后端的一些配置, 最后总结一下Mybatis-Plus提供的代码生成技术
---

本篇在数据库表建立完毕的基础之上, 总结一下EZShare项目的技术选型(后续可能会进行修改和添加), 以及后端的一些配置, 最后总结一下Mybatis-Plus提供的代码生成技术

具体代码见: https://github.com/JasonkayZK/EZShare

欢迎PR❤

<br/>

<!--more-->

## EZShare项目总结-2

项目采用前后端分离架构, 后端采用SSM(Spring Boot 2.2.4 + Spring MVC + Mybatis)

项目拟采用的技术栈和功能有:

| **名称**                                          |            **说明**             |
| :------------------------------------------------ | :-----------------------------: |
| **JDK 11**                                        |                /                |
| **Lombok**                                        |                /                |
| **Spring Boot Actuator**                          |       Spring应用程序监控        |
| **Spring Boot AOP**                               |           自定义切面            |
| **Redis**                                         |              缓存               |
| **Dynamic Datasource**                            |           动态数据源            |
| **Mybatis-Plus**                                  | 多表关联查询, 分页等ORM相关操作 |
| **Mybatis-Plus-Generator & Freemarker**           |  基于Freemarker的代码生成技术   |
| **p6spy**                                         |    数据库跟踪, 慢查询监控等     |
| **Shro & JWT**                                    |      权限管理, 身份校验等       |
| **Guava & Apache Commons: lang3、io、fileupload** |    字符串、文件上传等工具类     |
| **ExcelKit**                                      |         Excel等文件导出         |
| **quartz**                                        |            任务计划             |
| **ip2region**                                     |          ip地址定位库           |
| **Swagger**                                       |       RESTful接口文档生成       |

下面对个别功能和配置进行说明 

<br/>

### 项目总体配置

application.yml

```yaml
server:
  port: 8848

spring:
  datasource:
    dynamic:
      # 是否开启SQL日志输出，生产环境关闭(有性能损耗)
      p6spy: true

      hikari:
        connection-timeout: 30000
        max-lifetime: 1800000
        max-pool-size: 15
        min-idle: 5
        connection-test-query: SELECT 1 FROM DUAL
        pool-name: HikariCP

      # 默认数据源
      primary: primary
      datasource:
        # 数据源1: primary
        primary:
          username: root
          password: 123456
          driver-class-name: com.p6spy.engine.spy.P6SpyDriver
          url: jdbc:p6spy:mysql://127.0.0.1:3306/ezshare?useUnicode=true&characterEncoding=UTF-8&useJDBCCompliantTimezoneShift=true&useLegacyDatetimeCode=false&serverTimezone=UTC

        # 数据源2: test
        test:
          username: root
          password: 123456
          driver-class-name: com.p6spy.engine.spy.P6SpyDriver
          url: jdbc:p6spy:mysql://127.0.0.1:3306/ezshare_test?useUnicode=true&characterEncoding=UTF-8&useJDBCCompliantTimezoneShift=true&useLegacyDatetimeCode=false&serverTimezone=UTC

  # 基于接口的还是基于类的代理被创建
  # true则是基于类的代理将起作用（需要cglib库）
  # false或者省略这个属性，则标准的JDK 基于接口的代理将起作用
  aop:
    proxy-target-class: true

  # Spring 配置内容编码(ValidationMessages.properties)
  messages:
    encoding: utf-8

  # Date类默认返回
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: GMT+8

  # Redis缓存配置
  redis:
    host: 127.0.0.1
    port: 6379
    password:
    jedis:
      pool:
        min-idle: 8
        max-idle: 500
        max-active: 2000
        max-wait: 10000
    timeout: 0

  # servlet配置, 最大支持1T处理
  servlet:
    multipart:
      max-file-size: 1099511627776
      max-request-size: 1099511627776

  # 关闭Spring的banner显示
  main:
    banner-mode: off

# 日志配置
logging:
  config: classpath:logback.xml

# Spring Actuator配置
management:
  endpoints:
    web:
      exposure:
        include: ['httptrace', 'metrics', 'caches']

# mybatis-plus 设置
mybatis-plus:
  type-aliases-package: top.jasonkayzk.ezshare.system.entity,top.jasonkayzk.ezshare.job.entity,top.jasonkayzk.ezshare.file.entity
  mapper-locations: classpath:mapper/*/*.xml
  configuration:
    jdbc-type-for-null: null
  global-config:
    # 关闭mybatis-plus的banner
    banner: true

# Swagger相关配置
swagger:
  enabled: true
  title: EZShare Application API
  basePackage: top.jasonkayzk.ezshare
  basePath=/**:
  description: upload, download, share, file-sharing system
  version: 1.0
  author: Jasonkay
  url: https://github.com/JasonkayZK/EZShare
  email: jasonkayzk@gmail.com
  license: Apache 2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0.html
  exclude-path: error, /ops/**

shiro:
  # 后端免认证接口url
  anonUrl:
    - /login
    - /logout/**
    - /regist
    - /user/check/**
    - /swagger-resources/**
    - /webjars/**
    - /v2/**
    - /swagger-ui.html/**
    - /favicon.ico
  # token有效期，单位秒
  jwtTimeOut: 3600

# 项目自定义配置
ezshare:
  # 是否异步记录用户操作日志
  openAopLog: true

  # 单次最大批量入库数量
  max:
    batch:
      insert:
        num: 2000
```

><br/>
>
>**说明: 其中包括了本项目中绝大多数的配置**

<br/>

### 日志记录Logback配置

在application.yml中配置配置文件的地址:

```yaml
# 日志配置
logging:
  config: classpath:logback.xml
```

logback.xml文件内容:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration scan="true" scanPeriod="60 seconds" debug="false">
    <contextName>ezshare</contextName>
    <property name="log.path" value="log" />
    <property name="log.maxHistory" value="15" />
    <property name="log.colorPattern" value="%d{yyyy-MM-dd HH:mm:ss} | %highlight(%-5level) | %boldYellow(%thread) | %boldGreen(%logger) | %msg%n"/>
    <property name="log.pattern" value="%d{yyyy-MM-dd HH:mm:ss.SSS} %contextName [%thread] %-5level %logger{36} - %msg%n" />

    <!--输出到控制台-->
    <appender name="console" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>${log.colorPattern}</pattern>
        </encoder>
    </appender>

    <!--输出到文件-->
    <appender name="log_info" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>${log.path}/info/info.%d{yyyy-MM-dd}.log</fileNamePattern>
            <MaxHistory>${log.maxHistory}</MaxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>${log.pattern}</pattern>
        </encoder>
        <filter class="ch.qos.logback.classic.filter.LevelFilter">
            <level>INFO</level>
            <onMatch>ACCEPT</onMatch>
            <onMismatch>DENY</onMismatch>
        </filter>
    </appender>

    <appender name="log_error" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>${log.path}/error/error.%d{yyyy-MM-dd}.log</fileNamePattern>
        </rollingPolicy>
        <encoder>
            <pattern>${log.pattern}</pattern>
        </encoder>
        <filter class="ch.qos.logback.classic.filter.LevelFilter">
            <level>ERROR</level>
            <onMatch>ACCEPT</onMatch>
            <onMismatch>DENY</onMismatch>
        </filter>
    </appender>

    <root level="debug">
        <appender-ref ref="console" />
    </root>

    <root level="info">
        <appender-ref ref="log_info" />
        <appender-ref ref="log_error" />
    </root>
</configuration>
```

><br/>
>
>**logback.xml配置文件说明:**
>
>-   **configuration**: 包含下面三个属性
>
>    -   scan: 当此属性设置为true时，配置文件如果发生改变，将会被重新加载，默认值为true
>    -   scanPeriod: 设置监测配置文件是否有修改的时间间隔，如果没有给出时间单位，默认单位是毫秒。当scan为true时，此属性生效。默认的时间间隔为1分钟
>    -   debug: 当此属性设置为true时，将打印出logback内部日志信息，实时查看logback运行状态。默认值为false
>
>    <br/>
>
>-   **contextName**: 用来设置上下文名称
>
>    <br/>
>
>-   **Property**: 定义变量值，它有两个属性name和value，通过`<property>`定义的值会被插入到logger上下文中，可以使用`${name}`来使用变量
>
>    <br/>
>
>-   **appender**: 负责写日志的组件，它有两个必要属性name和class:
>
>    -   name指定appender名称
>    -   class指定appender的全限定名
>
>    appender class类型主要有三种:
>
>    -   **ConsoleAppender**: 把日志输出到控制台
>
>        -   `<encoder>`：对日志进行格式化: 详情参考https://www.cnblogs.com/ClassNotFoundException/p/6964435.html
>        -   `<target>`：字符串System.out(默认)或者System.err
>
>    -   **FileAppender**: 把日志添加到文件
>
>        -   `<file>`：被写入的文件名，可以是相对目录，也可以是绝对目录，如果上级目录不存在会自动创建，没有默认值
>        -   `<append>`：如果是 true，日志被追加到文件结尾，如果是 false，清空现存文件，默认是true
>        -   `<encoder>`：对记录事件进行格式化
>        -   `<prudent>`：如果是 true，日志会被安全的写入文件，即使其他的FileAppender也在向此文件做写入操作(效率低，默认是 false)
>
>    -   **RollingFileAppender**: 滚动记录文件，先将日志记录到指定文件，当符合某个条件时，将日志记录到其他文件
>
>        -   `<file>`：被写入的文件名，可以是相对目录，也可以是绝对目录，如果上级目录不存在会自动创建，没有默认值
>
>        -   `<append>`：如果是 true，日志被追加到文件结尾，如果是 false，清空现存文件，默认是true
>
>        -   `<rollingPolicy>`: 当发生滚动时，决定RollingFileAppender的行为，涉及文件移动和重命名, 属性class定义具体的滚动策略类
>
>            >   <br/>
>            >
>            >   **说明:**
>            >
>            >   "ch.qos.logback.core.rolling.TimeBasedRollingPolicy，是最受欢迎的滚动政策，例如按天或按月
>            >
>            >   TimeBasedRollingPolicy承担翻滚责任以及触发所述翻转的责任, TimeBasedRollingPolicy支持自动文件压缩
>
><font color="#f00">**在Spring Boot 2.x中Logback是默认的日志方式, 所以无需引入依赖即可使用**</font>

<br/>

### 参数校验提示信息配置

Spring Boot中可在resources路径下创建ValidationMessages.properties**(文件名称不可更改!)**, 来提供参数校验时的提示信息

ValidationMessages.properties

```properties
required=内容不能为空
range=输入有效长度{min}到{max}个字符
email=邮箱输入格式不合法
mobile=手机号输入不合法
noMoreThan=输入长度不能超过{max}个字符
invalid=输入值不合法
```

><br/>
>
>**注意:**
>
><font color="#f00">**Spring Boot在解析.properties文件时默认采用Unicode编码, 此时中文会产生乱码**</font>
>
>**解决方法:**
>
>在application.yml配置:
>
>```yaml
># Spring 配置内容编码(ValidationMessages.properties)
>spring: 
>  messages:
>    encoding: utf-8
>```

<br/>

### p6spy数据库

**① 修改driver和url**

如下

```yaml
datasource:
  # 数据源1: primary
  primary:
    username: root
    password: 123456
    driver-class-name: com.p6spy.engine.spy.P6SpyDriver
    url: jdbc:p6spy:mysql://127.0.0.1:3306/ezshare?useUnicode=true&characterEncoding=UTF-8&useJDBCCompliantTimezoneShift=true&useLegacyDatetimeCode=false&serverTimezone=UTC
```

**② 创建spy.properties配置**

spy.properties

```properties
# p6spy配置: https://p6spy.readthedocs.io/en/latest/configandusage.html
# 使用日志系统记录 sql
appender=com.p6spy.engine.spy.appender.Slf4JLogger

# 自定义日志打印
logMessageFormat=top.jasonkayzk.ezshare.common.config.P6spySqlFormatConfig

# 是否开启慢SQL记录
outagedetection=true

# 慢SQL记录标准: 3秒
outagedetectioninterval=3

# 开启过滤
filter=true

# 包含 QRTZ的不打印
exclude=QRTZ
```

<br/>

**③ 创建P6spySqlFormatConfig配置类**

P6spySqlFormatConfig.java

```java
/**
 * 自定义p6spy-sql输出格式
 *
 * @author zk
 */
public class P6spySqlFormatConfig implements MessageFormattingStrategy {

    /**
     * 自定义SQL样式
     */
    @Override
    public String formatMessage(int connectionId, String now, long elapsed, String category, String prepared, String sql, String url) {
        return StringUtils.isNotBlank(sql) ? DateUtil.formatFullTime(LocalDateTime.now(), DateUtil.FULL_TIME_SPLIT_PATTERN)
                + " | 耗时 " + elapsed + " ms | SQL 语句：" + StringUtils.LF + sql.replaceAll("[\\s]+", StringUtils.SPACE) + ";" : "";
    }

}
```

><br/>
>
>**更多详细内容见:** https://p6spy.readthedocs.io/en/latest/configandusage.html

<br/>

### Mybatis-Plus提供的代码生成

**① 引入依赖**

字节码生成采用Freemarker模板, 所以还应当加入Freemarker的依赖

```xml
<!-- 代码生成器 -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-generator</artifactId>
    <version>${mybatis-plus.version}</version>
</dependency>

<!-- freemarker引擎 -->
<dependency>
    <groupId>org.freemarker</groupId>
    <artifactId>freemarker</artifactId>
    <version>${freemarker.version}</version>
</dependency>
```

**② 创建模板**

```
.
├── application.yml
├── generator
│   └── templates
│       ├── controller.java.ftl
│       ├── entity.java.ftl
│       ├── mapper.java.ftl
│       ├── mapper.xml.ftl
│       ├── serviceImpl.java.ftl
│       └── service.java.ftl
└── ...
```

模板内容见: https://github.com/JasonkayZK/EZShare/tree/master/backend/src/main/resources/generator/templates

其实模板网上一搜也有一大堆

**③ 创建生成器类**

Mybatis-Plus官方也是提供了这个生成器类的, 我的生成器内容如下:

```java
package top.jasonkayzk.ezshare.common.generator;

import com.baomidou.mybatisplus.core.exceptions.MybatisPlusException;
import com.baomidou.mybatisplus.generator.AutoGenerator;
import com.baomidou.mybatisplus.generator.config.*;
import com.baomidou.mybatisplus.generator.config.rules.NamingStrategy;
import com.baomidou.mybatisplus.generator.engine.FreemarkerTemplateEngine;
import org.apache.commons.lang3.StringUtils;

import java.util.Scanner;

/**
 * Mybatis-Plus提供的代码生成器
 *
 * 可以快速生成 Entity、Mapper、Mapper XML、Service、Controller等各个模块的代码
 *
 * @link https://mp.baomidou.com/guide/generator.html
 *
 * @author zk
 */
public class CodeGenerator {

    /**
     * 数据库 URL
     */
    private static final String URL = "jdbc:mysql://127.0.0.1:3306/ezshare?useUnicode=true&characterEncoding=UTF-8&useJDBCCompliantTimezoneShift=true&useLegacyDatetimeCode=false&serverTimezone=UTC";

    /**
     * 数据库驱动
     */
    private static final String DRIVER_NAME = "com.mysql.cj.jdbc.Driver";

    /**
     * 数据库用户名
     */
    private static final String USERNAME = "root";

    /**
     * 数据库密码
     */
    private static final String PASSWORD = "123456";

    /**
     * Author值
     */
    private static final String AUTHOR = "Jasonkay";

    /**
     * 包的基础路径
     */
    private static final String BASE_PACKAGE_URL = "top.jasonkayzk.ezshare";

    /**
     * 模板路径
     */
    private static final String XML_MAPPER_TEMPLATE_PATH = "generator/templates/mapper.xml";

    /**
     * 表前缀(去掉)
     */
    private static final String TABLE_PREFIX = "t_";

    /**
     * mapper文件模板
     */
    private static final String MAPPER_TEMPLATE_PATH = "generator/templates/mapper.java";

    /**
     * entity文件模板
     */
    private static final String ENTITY_TEMPLATE_PATH = "generator/templates/entity.java";

    /**
     * service文件模板
     */
    private static final String SERVICE_TEMPLATE_PATH = "generator/templates/service.java";

    /**
     * serviceImpl文件模板
     */
    private static final String SERVICE_IMPL_TEMPLATE_PATH = "generator/templates/serviceImpl.java";

    /**
     * controller文件模板
     */
    private static final String CONTROLLER_TEMPLATE_PATH = "generator/templates/controller.java";

    public static void main(String[] args) {
        AutoGenerator generator = new AutoGenerator();

        // 全局配置
        GlobalConfig globalConfig = new GlobalConfig();
        String projectPath = System.getProperty("user.dir");
        globalConfig.setOutputDir(projectPath + "/src/main/java");
        globalConfig.setAuthor(AUTHOR);
        globalConfig.setOpen(false);
        globalConfig.setFileOverride(false);
        generator.setGlobalConfig(globalConfig);

        // 数据源配置
        DataSourceConfig dataSourceConfig = new DataSourceConfig();
        dataSourceConfig.setUrl(URL);
        dataSourceConfig.setDriverName(DRIVER_NAME);
        dataSourceConfig.setUsername(USERNAME);
        dataSourceConfig.setPassword(PASSWORD);
        generator.setDataSource(dataSourceConfig);

        // 包配置
        PackageConfig packageConfig = new PackageConfig();
        packageConfig.setModuleName("gen");
        packageConfig.setParent(BASE_PACKAGE_URL);
        generator.setPackageInfo(packageConfig);

        // 配置自定义代码模板
        TemplateConfig templateConfig = new TemplateConfig();
        templateConfig.setXml(XML_MAPPER_TEMPLATE_PATH);
        templateConfig.setMapper(MAPPER_TEMPLATE_PATH);
        templateConfig.setEntity(ENTITY_TEMPLATE_PATH);
        templateConfig.setService(SERVICE_TEMPLATE_PATH);
        templateConfig.setServiceImpl(SERVICE_IMPL_TEMPLATE_PATH);
        templateConfig.setController(CONTROLLER_TEMPLATE_PATH);
        generator.setTemplate(templateConfig);

        // 策略配置
        StrategyConfig strategy = new StrategyConfig();
        strategy.setNaming(NamingStrategy.underline_to_camel);
        strategy.setColumnNaming(NamingStrategy.underline_to_camel);
        strategy.setEntityLombokModel(true);
        strategy.setRestControllerStyle(true);
        strategy.setInclude(scanner());
        // 加入则不生成id列
        // strategy.setSuperEntityColumns("id");
        strategy.setControllerMappingHyphenStyle(true);
        // 去掉表中前缀
        strategy.setTablePrefix(TABLE_PREFIX);
        generator.setStrategy(strategy);
        generator.setTemplateEngine(new FreemarkerTemplateEngine());
        generator.execute();
    }


    private static String[] scanner() {
        Scanner scanner = new Scanner(System.in);
        System.out.println(("请输入表名(多个表使用空格分开)" + "："));
        // t_dict t_file t_file_category t_file_download_log t_job t_job_log t_log t_login_log t_menu t_role t_role_menu t_user t_user_config t_user_role t_file_auth
        if (scanner.hasNextLine()) {
            String ipt = scanner.nextLine();
            if (StringUtils.isNotBlank(ipt)) {
                return ipt.split("\\s");
            }
        }
        throw new MybatisPlusException("请输入正确的" + "表名" + "！");
    }

}

```

输入表名, 即可根据模板生成代码

><br/>
>
>**补充:**
>
>**① 去掉表前缀:**
>
>在我的数据表中有类似`t_tablename`的前缀, 可以通过策略配置去掉:
>
>```java
>// 去掉表中前缀
>strategy.setTablePrefix("t_");
>```
>
><br/>
>
>**② 生成实体entity没有id**
>
>删去: `strategy.setSuperEntityColumns("id");`即可
>
><br/>
>
>源代码见: https://github.com/JasonkayZK/EZShare/tree/master/backend/src/main/java/top/jasonkayzk/ezshare/common/generator/
>
>更多内容见: [AutoGenerator官方文档](https://mp.baomidou.com/guide/generator.html)

<br/>

### ip转地区

将数据放在resources目录下即可

可见: https://github.com/lionsoul2014/ip2region

<br/>

### 启动类

一般情况下, 都是使用`SpringApplication.run(Application.class,args);`启动Spring Boot应用

但是使用SpringApplicationBuilder可以在启动时增加更多的配置信息(如自定义横幅和记录器等), 启动方式更为灵活

```java
@SpringBootApplication
@EnableTransactionManagement
@EnableScheduling
@EnableAsync
public class EzShareApplication {

    public static void main(String[] args) {
        new SpringApplicationBuilder(EzShareApplication.class)
                .bannerMode(Banner.Mode.OFF)
                .run(args);
    }

}
```

><br/>
>
>**补充:**
>
>-   **EnableTransactionManagement**: 开启事务支持, 在访问数据库的Service方法上添加注解` @Transactional `便可(无需Spring中的配置)
>-   **EnableScheduling**: 启动定时任务, 可与quartz配合使用
>-   **EnableAsync**: 开启多线程进行异步调用执行, 让@Async注解生效

<br/>