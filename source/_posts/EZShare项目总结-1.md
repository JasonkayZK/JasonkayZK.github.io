---
title: EZShare项目总结-1
date: 2020-01-22 15:35:56
cover: http://api.mtyqx.cn/api/random.php?2
categories: 项目总结
tags: [项目总结]
toc: true
description: 本篇总结了EZShare项目的数据库表设计等方面的问题
---

本篇总结了EZShare项目的数据库表设计等方面的问题

具体代码见: https://github.com/JasonkayZK/EZShare

欢迎PR❤

<br/>

<!--more-->

## EZShare项目总结-1

首先对项目的数据库层进行了初步构建, 整体结构图如下所示:

![EZShare-schema.png](https://jasonkay_image.imfast.io/images/EZShare-schema.png)

>   <br/>
>
>   项目参考了[FEBS-Vue](https://github.com/wuyouzhuguli/FEBS-Vue)用到的动态路由和权限控制思想

### 管理权限控制

用户，角色和权限之间的关系使用的是经典的RBAC(Role-Based Access  Control，基于角色的访问控制)模型

即一个用户拥有若干角色，每一个角色拥有若干权限。这样，就构造成“用户-角色-权限”的授权模型。 在这种模型中，用户与角色之间，角色与权限之间，一般者是多对多的关系。如下图所示：

![RBAC.png](https://jasonkay_image.imfast.io/images/RBAC.png)

比如获取用户名为Jasonkay的用户权限过程为:

1.  通过Jasonkay的user_id从t_user_role表获取对应的role_id；
2.  通过第1步获取的role_id从t_role_menu表获取对应的menu_id；
3.  通过第2步获取的menu_id从t_menu获取menu相关信息(t_menu表的permission为权限信息)

<br/>

### 文件权限控制

文件权限控制也采用上述的RBAC模式进行

比如某个用户Jasonkay在请求文件列表的过程:

1.  通过Jasonkay的user_id从t_user_role表获取对应的role_id；
2.  通过第1步获取的role_id从t_file_auth表获取对应角色的文件权限；
3.  通过请求文件的id在t_file表中查找对应的file(file中包括这个文件的权限);
4.  比较用户权限和文件权限的大小:
    -   用户权限 >= 文件权限: 允许操作;
    -   用户权限 < 文件权限: 操作失败, 返回403等;

><br/>
>
>**说明: 文件权限规则**
>
>-   查看权限: 0游客不允许 1游客允许 2用户允许 3会员查看
>
>-   下载权限: 0游客不允许 1游客下载 2用户允许 3会员下载
>
><font color="#f00">**同时与用户和文件相关的采用这种方式进行权限设定, 而修改, 上传和删除在管理权限中进行配置**</font>

<br/>

### 定时任务

以qrtz_开头的为定时任务表

定时任务有基于内存和基于数据库的，本项目使用的是基于数据库持久化的方案

要详细了解这些表可以参考文章：http://www.ibloger.net/article/2650.html

<br/>

### 总结

**① 基于数据库的定时任务的创建**

**② 数据库表创建相关**

例如:

```mysql
DROP TABLE IF EXISTS `t_file_download_log`;
CREATE TABLE `t_file_download_log`
(
    `id`          BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '编号',
    `user_id`     BIGINT(20) NOT NULL,
    `file_id`     BIGINT(20) NOT NULL,
    `create_time` DATETIME   NOT NULL DEFAULT current_timestamp COMMENT '下载时间',
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `fk_download_user_idx` (`user_id` ASC),
    CONSTRAINT `fk_download_user_idx`
        FOREIGN KEY (`user_id`)
            REFERENCES `t_user` (`id`)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION,
    INDEX `fk_download_file_idx` (`file_id` ASC),
    CONSTRAINT `fk_download_file_idx`
        FOREIGN KEY (`file_id`)
            REFERENCES `t_file` (`id`)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8
    ROW_FORMAT = DYNAMIC
    COMMENT = '下载历史表';
```

<br/>

-   创建主键和BTREE索引: **PRIMARY KEY (`id`) USING BTREE**

-   指定存储引擎: **ENGINE = InnoDB**

-   指定表存储编码: **DEFAULT CHARSET = utf8**

-   指定行记录格式动态还是静态: **ROW_FORMAT = DYNAMIC/FIXED**

    ><br/>
    >
    >**说明:**
    >
    >-   **静态表:**
    >
    >    在MYSQL中, 若一张表里面不存在varchar、text以及其变形、blob以及其变形的字段的话，那么张这个表其实也叫静态表(static/fixed), 即该表的row_format是fixed，就是说每条记录所占用的字节一样
    >
    >    其优点读取快，缺点浪费额外一部分空间
    >
    >-   **动态表:**
    >
    >    那么实际开发中,这种表很少,大部分表的字段类型都是有很多种的,那么这种表就叫做:dynamic :动态表 ,优点是节省空间,缺点是读取的时间的开销
    >
    ><br/>
    >
    >其他形式的ROW_FORMAT的值如下:
    >
    >-   DEFAULT
    >-   FIXED
    >-   DYNAMIC
    >-   COMPRESSED
    >-   REDUNDANT
    >-   COMPACT
    >
    >更多行记录格式相关: https://blog.csdn.net/banxia727706033/article/details/92401573

-   创建索引和外键:

    ```mysql
    INDEX `fk_download_file_idx` (`file_id` ASC),
    CONSTRAINT `fk_download_file_idx`
        FOREIGN KEY (`file_id`)
            REFERENCES `t_file` (`id`)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
    ```

**③ 创建表前和表后开启和关闭外键检查等**

```mysql
-- 将原配置变量的值保存并修改(外键检查, 唯一索引检查等)
SET @OLD_UNIQUE_CHECKS = @@UNIQUE_CHECKS, UNIQUE_CHECKS = 0;
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0;
SET @OLD_SQL_MODE = @@SQL_MODE, SQL_MODE = 'TRADITIONAL,ALLOW_INVALID_DATES';

--- DDL

-- 将原配置变量的值修改回去
SET SQL_MODE = @OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS = @OLD_UNIQUE_CHECKS;
```

<br/>

>   <br/>
>
>   项目SQL内容: https://github.com/JasonkayZK/EZShare/tree/master/backend/sql

<br/>