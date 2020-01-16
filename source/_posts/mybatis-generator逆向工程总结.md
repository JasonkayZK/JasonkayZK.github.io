---
title: mybatis-generator逆向工程总结
toc: false
date: 2020-01-15 17:25:08
cover: http://api.mtyqx.cn/api/random.php?9
categories: [Mybatis, 技术杂谈, 学习案例]
tags: [Mybatis, 逆向工程]
description: 最近使用的工程为了提高开发效率用到了Mybatis-Generator逆向工程产生了单表对应的POJO和Mapper.xml, 在此总结一下使用方法
---

最近使用的工程为了提高开发效率用到了Mybatis-Generator逆向工程产生了单表对应的POJO和Mapper.xml, 在此总结一下使用方法

<br/>

<!--more-->

##  Mybatis-Generator

Mybatis-Generator主要的功能就是方便，快捷的创建好Entity, Mapper.xml等DAO层. 加快了开发速度，使用方面根据其提供的规则配置好就OK

>   <br/>
>
>   **补充:**
>
>   这里还有一个重要的开发场景，开发过程中，对数据库的操作肯定很多，比如新增字段什么的:
>
>   只要将原先自动生成的一套代码删除，重新再生成一份，这就完美解决了，但是这样做的前提是: **你必须对生成后的代码不改动，只是使用。不需要像手动开发写代码那样到处改代码，还担心改漏地方**

<br/>

### 使用流程

本案例使用到的数据库表结构, 以及DDL如下所示:

```mysql
-- ----------------------------
-- Table structure for t_user
-- ----------------------------
DROP TABLE IF EXISTS `t_user`;
CREATE TABLE `t_user`
(
    `id`       bigint(20)  NOT NULL AUTO_INCREMENT,
    `username` varchar(50) NOT NULL COMMENT '用户名',
    `password` varchar(32) NOT NULL COMMENT '密码，加密存储',
    `phone`    varchar(20) DEFAULT NULL COMMENT '注册手机号',
    `email`    varchar(50) DEFAULT NULL COMMENT '注册邮箱',
    `created`  datetime    NOT NULL,
    `updated`  datetime    NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `username` (`username`) USING BTREE,
    UNIQUE KEY `phone` (`phone`) USING BTREE,
    UNIQUE KEY `email` (`email`) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8 COMMENT ='用户表';

-- ----------------------------
-- Table structure for t_item
-- ----------------------------
DROP TABLE IF EXISTS `t_item`;
CREATE TABLE `t_item`
(
    `id`         bigint(20)   NOT NULL COMMENT '商品id，同时也是商品编号',
    `title`      varchar(100) NOT NULL COMMENT '商品标题',
    `sell_point` varchar(500)          DEFAULT NULL COMMENT '商品卖点',
    `price`      bigint(20)   NOT NULL COMMENT '商品价格，单位为：分',
    `num`        int(10)      NOT NULL COMMENT '库存数量',
    `barcode`    varchar(30)           DEFAULT NULL COMMENT '商品条形码',
    `image`      varchar(500)          DEFAULT NULL COMMENT '商品图片',
    `cid`        bigint(10)   NOT NULL COMMENT '所属类目，叶子类目',
    `status`     tinyint(4)   NOT NULL DEFAULT '1' COMMENT '商品状态，1-正常，2-下架，3-删除',
    `created`    datetime     NOT NULL COMMENT '创建时间',
    `updated`    datetime     NOT NULL COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `cid` (`cid`),
    KEY `status` (`status`),
    KEY `updated` (`updated`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8 COMMENT ='商品表';

-- ----------------------------
-- Table structure for t_item_cat
-- ----------------------------
DROP TABLE IF EXISTS `t_item_cat`;
CREATE TABLE `t_item_cat`
(
    `id`         bigint(20) NOT NULL AUTO_INCREMENT COMMENT '类目ID',
    `parent_id`  bigint(20)  DEFAULT NULL COMMENT '父类目ID=0时，代表的是一级的类目',
    `name`       varchar(50) DEFAULT NULL COMMENT '类目名称',
    `status`     int(1)      DEFAULT '1' COMMENT '状态。可选值:1(正常),2(删除)',
    `sort_order` int(4)      DEFAULT NULL COMMENT '排列序号，表示同级类目的展现次序，如数值相等则按名称次序排列。取值范围:大于零的整数',
    `is_parent`  tinyint(1)  DEFAULT '1' COMMENT '该类目是否为父类目，1为true，0为false',
    `created`    datetime    DEFAULT NULL COMMENT '创建时间',
    `updated`    datetime    DEFAULT NULL COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `parent_id` (`parent_id`, `status`) USING BTREE,
    KEY `sort_order` (`sort_order`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8 COMMENT ='商品类目';

-- ----------------------------
-- Table structure for t_item_desc
-- ----------------------------
DROP TABLE IF EXISTS `t_item_desc`;
CREATE TABLE `t_item_desc`
(
    `item_id`   bigint(20) NOT NULL COMMENT '商品ID',
    `item_desc` text COMMENT '商品描述',
    `created`   datetime DEFAULT NULL COMMENT '创建时间',
    `updated`   datetime DEFAULT NULL COMMENT '更新时间',
    PRIMARY KEY (`item_id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8 COMMENT ='商品描述表';
```

<br/>

**第一步: 添加依赖**

主要是jdbc和generator:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>top.jasonkayzk</groupId>
    <artifactId>java_samples</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>jar</packaging>

    <properties>
        <mysql.version>8.0.18</mysql.version>
        <mybatis.generator.version>1.3.6</mybatis.generator.version>
    </properties>

    <dependencies>
        <!-- MySql -->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>${mysql.version}</version>
        </dependency>
        <dependency>
            <groupId>org.mybatis.generator</groupId>
            <artifactId>mybatis-generator-core</artifactId>
            <version>${mybatis.generator.version}</version>
        </dependency>
    </dependencies>

<build>
    <!-- resources-->
    <resources>
        <resource>
            <directory>src/main/resources</directory>
        </resource>
    </resources>

    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.6.0</version>
            <configuration>
                <source>11</source>
                <target>11</target>
                <encoding>UTF-8</encoding>
            </configuration>
        </plugin>
    </plugins>
</build>

</project>
```

**第二步: 配置 generatorConfig.xml**

这个文件主要是对数据源(表结构信息)从哪来, POJO, Mapper接口等文件输出到哪去的描述，还有一些特殊要求的配置

配置如下:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE generatorConfiguration
        PUBLIC "-//mybatis.org//DTD MyBatis Generator Configuration 1.0//EN"
        "http://mybatis.org/dtd/mybatis-generator-config_1_0.dtd">

<generatorConfiguration>
    <context id="DB2Tables" targetRuntime="MyBatis3">

        <commentGenerator>
            <!-- 是否去除自动生成的注释 true：是 ： false:否 -->
            <property name="suppressAllComments" value="true"/>
        </commentGenerator>

        <!--数据库连接的信息：驱动类、连接地址、用户名、密码 -->
        <jdbcConnection driverClass="com.mysql.cj.jdbc.Driver"
                        connectionURL="jdbc:mysql://localhost:3306/test"
                        userId="root"
                        password="zk137818">
        </jdbcConnection>

        <!-- 默认false，把JDBC DECIMAL 和 NUMERIC 类型解析为 Integer，为true时把JDBC DECIMAL 和
			NUMERIC 类型解析为java.math.BigDecimal -->
        <javaTypeResolver>
            <property name="forceBigDecimals" value="false"/>
        </javaTypeResolver>

        <!-- targetProject:生成PO类的位置 -->
        <javaModelGenerator targetPackage="top.jasonkayzk.generator.pojo"
                            targetProject="./src/main/java">
            <!-- enableSubPackages:是否让schema作为包的后缀 -->
            <property name="enableSubPackages" value="false"/>
            <!-- 从数据库返回的值被清理前后的空格 -->
            <property name="trimStrings" value="true"/>
        </javaModelGenerator>

        <!-- targetProject:mapper映射文件生成的位置 -->
        <sqlMapGenerator targetPackage="top.jasonkayzk.generator.mapper"
                         targetProject="./src/main/java">
            <!-- enableSubPackages:是否让schema作为包的后缀 -->
            <property name="enableSubPackages" value="false"/>
        </sqlMapGenerator>

        <!-- targetPackage：mapper接口生成的位置 -->
        <javaClientGenerator type="XMLMAPPER"
                             targetPackage="top.jasonkayzk.generator.mapper"
                             targetProject="./src/main/java">
            <!-- enableSubPackages:是否让schema作为包的后缀 -->
            <property name="enableSubPackages" value="false"/>
        </javaClientGenerator>

        <!-- 指定数据库表 -->
        <table schema="test" tableName="t_user"/>
        <table schema="test" tableName="t_item"/>
        <table schema="test" tableName="t_item_cat"/>
        <table schema="test" tableName="t_item_desc"/>

    </context>
</generatorConfiguration>
```

**第三步：主要看你个人的需求，对注释，分页是否有要求，可以重写几个方法对其进行改造**

如下: 对注释的修改

NewbatisGenerator.java

```java
public class NewbatisGenerator extends DefaultCommentGenerator {
    private Properties properties;
    private Properties systemPro;
    private boolean suppressDate;
    private boolean suppressAllComments;
    private String currentDateStr;

    public NewbatisGenerator() {
        super();
        properties = new Properties();
        systemPro = System.getProperties();
        suppressDate = false;
        suppressAllComments = false;
        currentDateStr = (new SimpleDateFormat("yyyy-MM-dd")).format(new Date());
    }

    /**
     * 对类的注解
     * @param topLevelClass
     * @param introspectedTable
     */
    @Override
    public void addModelClassComment(TopLevelClass topLevelClass, IntrospectedTable introspectedTable) {
        topLevelClass.addJavaDocLine("/**");
        topLevelClass.addJavaDocLine(" * 这是MyBatis Generator自动生成的Model Class.");

        StringBuilder sb = new StringBuilder();
        sb.append(" * 对应的数据表是 : ");
        sb.append(introspectedTable.getFullyQualifiedTable());
        topLevelClass.addJavaDocLine(sb.toString());

        String tableRemarks = introspectedTable.getRemarks();
        if (!StringUtils.isEmpty(tableRemarks)) {
            sb.setLength(0);
            sb.append(" * 数据表注释 : ");
            sb.append(tableRemarks);
            topLevelClass.addJavaDocLine(sb.toString());
        }

        sb.setLength(0);
        sb.append(" * @author ");
        sb.append(systemPro.getProperty("user.name"));
        topLevelClass.addJavaDocLine(sb.toString());

        String curDateString = (new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")).format(new Date());
        sb.setLength(0);
        sb.append(" * @date ");
        sb.append(curDateString);
        topLevelClass.addJavaDocLine(sb.toString());

        topLevelClass.addJavaDocLine(" */");
    }

    /**
     * 生成的实体增加字段的中文注释
     */
    public void addFieldComment(Field field, IntrospectedTable introspectedTable,
                                IntrospectedColumn introspectedColumn) {
        if (suppressAllComments) {
            return;
        }
        StringBuilder sb = new StringBuilder();
        field.addJavaDocLine("/**");
        sb.append(" * ");
        sb.append(introspectedColumn.getRemarks());
        field.addJavaDocLine(sb.toString().replace("\n", " "));
        field.addJavaDocLine(" */");
    }
}
```

**最后一步：运行GeneratorSqlMap生成**

```java
public class GeneratorSqlMap {

    public static void main(String[] args) throws IOException, XMLParserException, InvalidConfigurationException, SQLException, InterruptedException {
        List<String> warnings = new ArrayList<>();
        boolean overwrite = true;

        //指定逆向工程配置文件
        File configFile = new File("src/main/resources/generatorConfig.xml");
        ConfigurationParser cp = new ConfigurationParser(warnings);
        Configuration config = cp.parseConfiguration(configFile);
        DefaultShellCallback callback = new DefaultShellCallback(overwrite);
        MyBatisGenerator myBatisGenerator = new MyBatisGenerator(config,
                callback, warnings);
        myBatisGenerator.generate(null);
    }

}
```

即可生成POJO, Mapper等;

具体详细代码见: https://github.com/JasonkayZK/Java_Samples/tree/mybatis-generator



<br/>