---
title: CentOS7安装MongoDB
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?77'
date: 2021-03-10 16:58:31
categories: 软件安装与配置
tags: [软件安装与配置, MongoDB]
description: 本文讲解了如何在CentOS7环境下安装和配置MongoDB；
---

本文讲解了如何在CentOS7环境下安装和配置MongoDB；

<br/>

<!--more-->

## **CentOS7安装MongoDB**

本安装教程使用Yum源安装MongoDB；

>   MongoDB官方安装文档：
>
>   -   https://docs.mongodb.com/manual/installation/

### **安装MongoDB**

#### **配置系统yum源**

创建.repo文件，生成mongodb的源：

```bash
vi /etc/yum.repos.d/mongodb-org-4.4.repo
```

添加以下配置信息：

```
[mongodb-enterprise-4.4]
name=MongoDB Enterprise Repository
baseurl=https://repo.mongodb.com/yum/redhat/$releasever/mongodb-enterprise/4.4/$basearch/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-4.4.asc
```

>   **详解：**
>
>   -   name         # 名称
>   -   baseurl      # 获得下载的路径
>   -   gpkcheck=1   # 表示对从这个源下载的rpm包进行校验；
>   -   enable=1     # 表示启用这个源
>   -   gpgkey       # gpg验证

<br/>

#### **使用yum安装MongoDB**

使用yum安装：

```bash
sudo yum install -y mongodb-org
```

<br/>

#### **验证安装结果**

输入下面的命令：

```bash
$ rpm -qa |grep mongodb
mongodb-org-mongos-4.4.4-1.el7.x86_64
mongodb-org-shell-4.4.4-1.el7.x86_64
mongodb-org-database-tools-extra-4.4.4-1.el7.x86_64
mongodb-org-server-4.4.4-1.el7.x86_64
mongodb-org-tools-4.4.4-1.el7.x86_64
mongodb-org-4.4.4-1.el7.x86_64
mongodb-database-tools-100.3.0-1.x86_64

$ rpm -ql mongodb-org-server
/etc/mongod.conf
/lib/systemd/system/mongod.service
/usr/bin/mongod
/usr/share/doc/mongodb-org-server-4.4.4
/usr/share/doc/mongodb-org-server-4.4.4/LICENSE-Community.txt
/usr/share/doc/mongodb-org-server-4.4.4/MPL-2
/usr/share/doc/mongodb-org-server-4.4.4/README
/usr/share/doc/mongodb-org-server-4.4.4/THIRD-PARTY-NOTICES
/usr/share/man/man1/mongod.1
/var/lib/mongo
/var/log/mongodb
/var/log/mongodb/mongod.log
/var/run/mongodb
```

<br/>

### **启动并检查MongoDB**

启动MongoDB服务：

```bash
systemctl start mongod.service
```

MongoDB默认端口是27017，查看是否开启：

```bash
netstat -natp | grep 27017
```

检查数据库是否安装成功：

```bash
ps -aux | grep mongod    # 查看数据库的进程是否存在
```

验证服务开启：

```bash
mongo
```

<br/>

### **设置开机自启动**

命令如下：

```bash
systemctl enable mongod
```

<br/>

### **常用命令**

```bash
# 开启MongoDB
sudo service mongod start  或 systemctl start mongod.service
# 加入开机启动
sudo systemctl enable mongod  
# 重启MongoDB
sudo systemctl restart mongod 
# 关闭MongoDB
sudo service mongod stop
# 卸载MongoDB
sudo yum erase $(rpm -qa | grep mongodb-org)
# 删除日志文件
sudo rm -r /var/log/mongodb  
# 删除数据文件
sudo rm -r /var/lib/mongo    
```

<br/>

### **修改配置**

#### **远程连接**

修改配置文件mongodb.conf：

```bash
vi /etc/mongod.conf

# network interfaces
net:
  port: 27017
  bindIp: 0.0.0.0  # Enter 0.0.0.0,:: to bind to all IPv4 and IPv6 addresses or, alternatively, use the net.bindIpAll setting.

```

**修改绑定ip默认127.0.0.1只允许本地连接， 所以修改为bindIp:0.0.0.0**

重启mongodb服务：

```bash
sudo service mongod restart
```

>   某些具有防火墙的系统需要修改配置、云服务器还需要修改安全组；
>
>   开放对外端口如下：
>
>   **方法一**
>
>   ```bash
>   systemctl status firewalld  # 查看防火墙状态
>   firewall-cmd --zone=public --add-port=27017/tcp --permanent # mongodb默认端口号
>   firewall-cmd --reload  # 重新加载防火墙
>   
>   firewall-cmd --zone=public --query-port=27017/tcp # 查看端口号是否开放成功，输出yes开放成功，no则失败
>   ```
>
>   **方法二**
>
>   ```bash
>   iptables -A INPUT -p tcp -m state --state NEW -m tcp --dport 27017 -j ACCEPT
>   ```

<br/>

#### **用户配置**

创建用户，设置账号，密码，权限：

```mysql
# admin数据库
> use admin
switched to db admin
> db.createUser({ user:"root", pwd:"123456", roles:["root"] })
Successfully added user: { "user" : "root", "roles" : [ "root" ] }

# 其他数据库
> use test
switched to db test
> db.createUser({ user:"admin", pwd:"123456", roles:["readWrite", "dbAdmin"] })
Successfully added user: { "user" : "root", "roles" : [ "root" ] }
```

修改mongodb.conf文件，启用身份验证

```diff
vi /etc/mongod.conf

+security:
+  authorization: "enabled"   # disable or enabled
```

重启MongoDB

```bash
sudo service mongod restart 
```

用户认证

```mysql
> use admin
switched to db admin
> db.auth("root", "123456")
1 # 授权成功

# 其他常用命令
db.updateUser(user, writeConcern) # 更新用户
db.dropUser('test') # 删除用户
```

远程连接

```bash
# 终端连接
mongo 10.128.218.14:27017/database -u username -p password

# mongoose方式连接
mongoose.connect('mongodb://username:password@host:port/database?options...', {useNewUrlParser: true});
```

<br/>

#### **用户权限角色说明**

| **规则**             | **说明**                                                     |
| -------------------- | ------------------------------------------------------------ |
| root                 | 只在admin数据库中可用。超级账号，超级权限                    |
| Read                 | 允许用户读取指定数据库                                       |
| readWrite            | 允许用户读写指定数据库                                       |
| dbAdmin              | 允许用户在指定数据库中执行管理函数，如索引创建、删除，查看统计或访问system.profile |
| userAdmin            | 允许用户向system.users集合写入，可以找指定数据库里创建、删除和管理用户 |
| clusterAdmin         | 只在admin数据库中可用，赋予用户所有分片和复制集相关函数的管理权限 |
| readAnyDatabase      | 只在admin数据库中可用，赋予用户所有数据库的读权限            |
| readWriteAnyDatabase | 只在admin数据库中可用，赋予用户所有数据库的读写权限          |
| userAdminAnyDatabase | 只在admin数据库中可用，赋予用户所有数据库的userAdmin权限     |
| dbAdminAnyDatabase   | 只在admin数据库中可用，赋予用户所有数据库的dbAdmin权限       |

<br/>

## **附录**

文章参考：

-   [Linux Centos 7安装MongoDB（简单！详细！）](https://juejin.cn/post/6844903828811153421)

<br/>