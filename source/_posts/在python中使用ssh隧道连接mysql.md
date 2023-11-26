---
title: 在python中使用ssh隧道连接mysql
toc: true
cover: 'https://img.paulzzh.com/touhou/random?23'
date: 2020-11-22 14:37:12
categories: Python
tags: [Python, SSH, MySQL]
description: 通常为了保证数据库安全，不会允许直接连接数据库，而是需要通过SSH隧道去连接服务器背后的数据库；今天我在用Python连接远程的MySQL时，直连遇到了无法连接的情况，使用了SSH隧道之后解决了问题；
---

通常为了保证数据库安全，不会允许直接连接数据库，而是需要通过SSH隧道去连接服务器背后的数据库；

今天我在用Python连接远程的MySQL时，直连遇到了无法连接的情况，使用了SSH隧道之后解决了问题；

<br/>

<!--more-->

## 在python中使用ssh隧道连接mysql

通常在python中，我们是使用下面的代码连接MySQL的：

```python
import pymysql
 
# 打开数据库连接
db = pymysql.connect("localhost","testuser","test123","TESTDB" )
```

>   依赖库PyMySQL；
>
>   安装：
>
>   `pip install PyMySQL`

此时直接连接可能会报错：

```
ConnectionRefusedError: [WinError 10061] 由于目标计算机积极拒绝，无法连接。
```

此时，我们需要通过SSH隧道的方式进行访问！

<br/>

首先使用SSH隧道需要安装依赖`sshtunnel`，使用pip安装即可：

`pip install sshtunnel`

其次，首先创建SSH隧道，然后在创建MySQL连接时，使用隧道即可：

```python
import pymysql
from sshtunnel import SSHTunnelForwarder

server = SSHTunnelForwarder(
    ssh_address_or_host=('<服务器地址>', 22),  # 指定ssh登录的跳转机的address
    ssh_username='root',  # 跳转机的用户
    ssh_password='your_passwd',  # 跳转机的密码
    remote_bind_address=('<数据库地址>', 3306))
server.start()
db = 'dbname'
myConfig = pymysql.connect(
    user="root",
    passwd="password",
    host="127.0.0.1",  # 此处必须是 127.0.0.1
    db=db,
    port=server.local_bind_port)
cursor =myConfig.cursor()
cursor.execute('SELECT COUNT(*) FROM table;')
print(cursor.fetchall())
server.stop()
cursor.close()
```

也可以使用with语句：

```python
import pymysql
from sshtunnel import SSHTunnelForwarder

if __name__ == '__main__':
     with SSHTunnelForwarder(
        ssh_address_or_host=('<服务器地址>', 22),  # 指定ssh登录的跳转机的address
        ssh_username='root',  # 跳转机的用户
        ssh_password='ZHIrensha123456',  # 跳转机的密码
        remote_bind_address=('<数据库地址>', 3306)) as server:
        db = 'resultdb'
        myConfig = pymysql.connect(
            user="root",
            passwd="password",
            host="127.0.0.1", # 此处必须是 127.0.0.1
            db=db,
            port=server.local_bind_port)
        cursor =myConfig.cursor()
        cursor.execute('SELECT COUNT(*) FROM table;')
        print(cursor.fetchall())
        cursor.close()
```

<br/>