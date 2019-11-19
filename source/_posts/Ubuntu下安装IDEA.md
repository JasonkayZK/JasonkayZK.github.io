---
title: Ubuntu下安装IDEA
date: 2019-09-04 21:42:35
categories: 软件安装与配置
cover: https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1567614716959&di=beb911c35cb994a43f2238ae6e873cc2&imgtype=0&src=http%3A%2F%2Fblog.didispace.com%2Fcontent%2Fimages%2Fposts%2Fidea-2018-1-17.gif
tags: [软件安装与配置, 软件推荐]
description: 在Ubuntu下IDEA的安装与配置
---



<!--more-->

## Ubuntu下安装IDEA

### 一. 下载与解压

#### 1): 下载文件

​		在jetbrains官网, 选择Ultimate版本的tar.gz包下载: [IDEA官方网站](https://www.jetbrains.com/idea/download/#section=linux)

#### 2): 解压缩到指定文件夹

​		这里安装在/opt/下:

```bash
sudo tar -zxvf ideaIU-2019.X.X.tar.gz -C /opt/
```

#### 3): 赋权限或改变文件所属

```bash
sudo chown zk:zk -R /opt/ideaIU-2019.x.x
```

​		这里是改变了文件所属, **因为如果是Ubuntu, 如果属于root的话, 更新IDEA有点麻烦!**

<br/>

### 二. 安装

```bash
cd /opt/ideaIU-2019.x.x/bin/
./idea.sh
```

​		IDEA本身提供了启动脚步, 首次启动时会进行配置, 建议: **插件全选**, 都挺好用的说实话!

​		此处也可以选择建立快捷方式, 在win中是创建桌面快捷方式, 在Ubuntu中是添加了一个*.desktop的文件, 可以加入到Dock中去, 很方便.

<br/>

### 三. 激活

​		我也是在网上找的别人的激活码, 而没有选择破解, 有效期到2020年1月.

选择Activation code, 复制下面即可完成激活:

```
MNQ043JMTU-eyJsaWNlbnNlSWQiOiJNTlEwNDNKTVRVIiwibGljZW5zZWVOYW1lIjoiR1VPIEJJTiIsImFzc2lnbmVlTmFtZSI6IiIsImFzc2lnbmVlRW1haWwiOiIiLCJsaWNlbnNlUmVzdHJpY3Rpb24iOiIiLCJjaGVja0NvbmN1cnJlbnRVc2UiOmZhbHNlLCJwcm9kdWN0cyI6W3siY29kZSI6IklJIiwiZmFsbGJhY2tEYXRlIjoiMjAxOS0wNC0wNSIsInBhaWRVcFRvIjoiMjAyMC0wNC0wNCJ9XSwiaGFzaCI6IjEyNjIxNDIwLzBwIiwiZ3JhY2VQZXJpb2REYXlzIjo3LCJhdXRvUHJvbG9uZ2F0ZWQiOnRydWUsImlzQXV0b1Byb2xvbmdhdGVkIjp0cnVlfQ==-Zmbxcn7NPlqBNqAURX0uiLzybnruyx6PG+6KYZrpzm/IJJs5nnIogGgdfIJoifO6fbaaJYc5pjds7CHdrt/neIpvF2o/HvIjMEF4/AhNV7HUGsAa9zpMszc6YBIkMmVFh4Y7GPKOStA14/Ld83AC7kGnwL1Fq7eAXKJFljc00GMejPpfE0zDqTN634bC+0ojfklhWXaLqhUt230SiE8onnd3quvEaH5NsW7sIQm2spyONZI+iHvHFtl4EvG7tlRlD1StsfhrbgNNxz61FOEEQ+GtZIzMx+T4sbpfoRyms7lbWQecrbAtE0c2sR98esm4PcDUhrFVBxGorPC1ppOLSQ==-MIIElTCCAn2gAwIBAgIBCTANBgkqhkiG9w0BAQsFADAYMRYwFAYDVQQDDA1KZXRQcm9maWxlIENBMB4XDTE4MTEwMTEyMjk0NloXDTIwMTEwMjEyMjk0NlowaDELMAkGA1UEBhMCQ1oxDjAMBgNVBAgMBU51c2xlMQ8wDQYDVQQHDAZQcmFndWUxGTAXBgNVBAoMEEpldEJyYWlucyBzLnIuby4xHTAbBgNVBAMMFHByb2QzeS1mcm9tLTIwMTgxMTAxMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxcQkq+zdxlR2mmRYBPzGbUNdMN6OaXiXzxIWtMEkrJMO/5oUfQJbLLuMSMK0QHFmaI37WShyxZcfRCidwXjot4zmNBKnlyHodDij/78TmVqFl8nOeD5+07B8VEaIu7c3E1N+e1doC6wht4I4+IEmtsPAdoaj5WCQVQbrI8KeT8M9VcBIWX7fD0fhexfg3ZRt0xqwMcXGNp3DdJHiO0rCdU+Itv7EmtnSVq9jBG1usMSFvMowR25mju2JcPFp1+I4ZI+FqgR8gyG8oiNDyNEoAbsR3lOpI7grUYSvkB/xVy/VoklPCK2h0f0GJxFjnye8NT1PAywoyl7RmiAVRE/EKwIDAQABo4GZMIGWMAkGA1UdEwQCMAAwHQYDVR0OBBYEFGEpG9oZGcfLMGNBkY7SgHiMGgTcMEgGA1UdIwRBMD+AFKOetkhnQhI2Qb1t4Lm0oFKLl/GzoRykGjAYMRYwFAYDVQQDDA1KZXRQcm9maWxlIENBggkA0myxg7KDeeEwEwYDVR0lBAwwCgYIKwYBBQUHAwEwCwYDVR0PBAQDAgWgMA0GCSqGSIb3DQEBCwUAA4ICAQAF8uc+YJOHHwOFcPzmbjcxNDuGoOUIP+2h1R75Lecswb7ru2LWWSUMtXVKQzChLNPn/72W0k+oI056tgiwuG7M49LXp4zQVlQnFmWU1wwGvVhq5R63Rpjx1zjGUhcXgayu7+9zMUW596Lbomsg8qVve6euqsrFicYkIIuUu4zYPndJwfe0YkS5nY72SHnNdbPhEnN8wcB2Kz+OIG0lih3yz5EqFhld03bGp222ZQCIghCTVL6QBNadGsiN/lWLl4JdR3lJkZzlpFdiHijoVRdWeSWqM4y0t23c92HXKrgppoSV18XMxrWVdoSM3nuMHwxGhFyde05OdDtLpCv+jlWf5REAHHA201pAU6bJSZINyHDUTB+Beo28rRXSwSh3OUIvYwKNVeoBY+KwOJ7WnuTCUq1meE6GkKc4D/cXmgpOyW/1SmBz3XjVIi/zprZ0zf3qH5mkphtg6ksjKgKjmx1cXfZAAX6wcDBNaCL+Ortep1Dh8xDUbqbBVNBL4jbiL3i3xsfNiyJgaZ5sX7i8tmStEpLbPwvHcByuf59qJhV/bZOl8KqJBETCDJcY6O2aqhTUy+9x93ThKs1GKrRPePrWPluud7ttlgtRveit/pcBrnQcXOl1rHq7ByB8CFAxNotRUYL9IF5n3wJOgkPojMy6jetQA5Ogc8Sm7RG6vg1yow==
```

<br/>

### 四. 配置:

#### 1): 下载插件

​		主要的Java开发会用到的插件有:

-   .ignore: 生成你要的.gitignore, 很方便
-   Lombok: 自动生成Java Bean的Getter, Setter等
-   Alibaba Java Coding Guidelines: 阿里爸爸的p3c规范
-   VisualVM Launcher: 运行java程序的时候启动visualvm，方便查看jvm的情况 比如堆内存大小的分配
-   MyBatisCodeHelperPro: mybatis代码自动生成插件，大部分单表操作的代码可自动生成 减少重复劳动 大幅提升效率;
-   Translation: 最好用的翻译插件，功能很强大，界面很漂亮;

#### 2): 配置Maven:

​		在Setting中搜索Maven, 并配置你的安装路径, 以及阿里爸爸的镜像源. 最好不要使用自带的Maven!

Maven镜像源配置:

​		在你安装的Maven目录conf文件夹下, 编辑settings.xml, 在mirrors标签添加:

```xml
<mirror> 
    <id>aliyun-maven</id> 
    <mirrorOf>*</mirrorOf> 
    <name>aliyun maven</name> 
    <url>http://maven.aliyun.com/nexus/content/groups/public</url> 
</mirror>
```

