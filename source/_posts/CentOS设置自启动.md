---
title: CentOS设置自启动
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?7'
date: 2021-06-24 12:32:56
categories: [Linux]
tags: [Linux, CentOS, 技术杂谈, 自启动]
description: 开发中我们经常需要设置一些自启动服务，用来做一些定时任务或者是服务器遇到问题重启时自动启动服务；
---

开发中我们经常需要设置一些自启动服务，用来做一些定时任务或者是服务器遇到问题重启时自动启动服务；

<br/>

<!--more-->

## **CentOS设置自启动**

在CentOS 6中，可以通过在`/etc/init.d/`添加自启动脚本来设置自启动；

在CentOS 7中，设置自启动的方法发生了改变：虽然我们仍然可以使用脚本来添加自启动，但是**官方更建议使用服务来设置自启动**；

<br/>

### **通过配置系统服务来设置自启动**

#### **已经存在的系统服务**

在CentOS 7中，一些软件程序会在安装时自动创建服务，比如：Apache、PHP、MySQL、Nginx等等；

因此，**对于已经创建好的服务，唯一要做的就是把服务设置成自启动就可以了；**

以MySQL为例：

安装完成MySQL之后，执行语句把MySQL服务设置成自启动：

```bash
# systemctl enable mysqld
```

设置完成之后，检查一下状态：

```bash
# systemctl status mysqld
```

会打印出类似下列信息：

```bash
● mysqld.service - MySQL Server
Loaded: loaded (/usr/lib/systemd/system/mysqld.service; enabled; vendor preset: disabled)
Active: active (running) since 五 2018-04-27 16:38:40 CST; 1 weeks 3 days ago
  Docs: man:mysqld(8)
       http://dev.mysql.com/doc/refman/en/using-systemd.html
Main PID: 18169 (mysqld)
  CGroup: /system.slice/mysqld.service
          └─18169 /usr/sbin/mysqld --daemonize --pid-file=/var/run/mysqld/mysqld.pid
```

如果不需要自启动了，可以取消服务的自启动：

```bash
# systemctl disable mysqld
```

<br/>

#### **创建自定义服务**

当然，我们也可以自己创建服务；

例如，创建一个名为`sample.service`的服务：

```bash
# vi /etc/systemd/system/sample.service

[Unit]
Description=Description for sample script goes here
After=network.target

[Service]
Type=simple
ExecStart=/var/tmp/test_script.sh
TimeoutStartSec=0

[Install]
WantedBy=default.target
```

其中：

-   **After**：代表要**在其他的某些程序完成之后再执行；**
-   **Type**：代表**服务执行顺序和方式；**
    -   `Type=simple`(默认值)：systemd认为该服务将立即启动，服务进程不会fork，如果该服务要启动其他服务，不要使用此类型启动，除非该服务是socket激活型；
    -   `Type=forking`：systemd认为当该服务进程fork，且父进程退出后服务启动成功；对于常规的守护进程(daemon)；使用此启动类型应同时指定 `PIDFile`，以便systemd能够跟踪服务的主进程；
    -   `Type=oneshot`：这一选项适用于只执行一项任务、随后立即退出的服务；可能需要同时设置 `RemainAfterExit=yes` 使得 systemd 在服务进程退出之后仍然认为服务处于激活状态；
    -   `Type=notify`: 与 `Type=simple` 相同，但约定服务会在就绪后向 systemd 发送一个信号；这一通知实现由 `libsystemd-daemon.so` 提供；
    -   `Type=dbus`：若以此方式启动，当指定的 BusName 出现在DBus系统总线上时，systemd认为服务就绪；
    -   `Type=idle`: 服务会延迟启动，一直到其他服务都启动完成之后才会启动此服务；
-   **WantedBy**代表启动目标；
-   **target**是一个类似而又不同于启动级别`(runlevel)`的概念；参考：[Systemd服务简介](https://link.jianshu.com?t=http%3A%2F%2Fwww.360doc.com%2Fcontent%2F14%2F0711%2F12%2F9075092_393633966.shtml)；

>   其他配置可以参考一下其他软件的配置：
>
>   ```bash
>   # cat /usr/lib/systemd/system/postgresql-10.service
>   ```
>
>   比如PostgreSQL的service文件：
>
>   ```bash
>   # It's not recommended to modify this file in-place，because it will be
>   # overwritten during package upgrades.  If you want to customize，the
>   # best way is to create a file "/etc/systemd/system/postgresql-10.service",
>   # containing
>   #   .include /usr/lib/systemd/system/postgresql-10.service
>   #   ...make your changes here...
>   # For more info about custom unit files，see
>   # http://fedoraproject.org/wiki/Systemd#How_do_I_customize_a_unit_file.2F_add_a_custom_unit_file.3F
>   
>   # Note: changing PGDATA will typically require adjusting SELinux
>   # configuration as well.
>   
>   # Note: do not use a PGDATA pathname containing spaces，or you will
>   # break postgresql-setup.
>   [Unit]
>   Description=PostgreSQL 10 database server
>   Documentation=https://www.postgresql.org/docs/10/static/
>   After=syslog.target
>   After=network.target
>   
>   [Service]
>   Type=notify
>   
>   User=postgres
>   Group=postgres
>   
>   # Note: avoid inserting whitespace in these Environment= lines，or you may
>   # break postgresql-setup.
>   
>   # Location of database directory
>   Environment=PGDATA=/var/lib/pgsql/10/data/
>   
>   # Where to send early-startup messages from the server (before the logging
>   # options of postgresql.conf take effect)
>   # This is normally controlled by the global default set by systemd
>   # StandardOutput=syslog
>   
>   # Disable OOM kill on the postmaster
>   OOMScoreAdjust=-1000
>   Environment=PG_OOM_ADJUST_FILE=/proc/self/oom_score_adj
>   Environment=PG_OOM_ADJUST_VALUE=0
>   
>   ExecStartPre=/usr/pgsql-10/bin/postgresql-10-check-db-dir ${PGDATA}
>   ExecStart=/usr/pgsql-10/bin/postmaster -D ${PGDATA}
>   ExecReload=/bin/kill -HUP $MAINPID
>   KillMode=mixed
>   KillSignal=SIGINT
>   
>   
>   # Do not set any timeout value，so that systemd will not kill postmaster
>   # during crash recovery.
>   TimeoutSec=0
>   
>   [Install]
>   WantedBy=multi-user.target
>   ```

<br/>

### **通过自启动脚本来设置**

创建一个名为`test_script.sh`的脚本并写入内容：

```bash
# vi /var/tmp/test_script.sh
#!/bin/bash
echo "This is a sample script to test auto run during boot" > /var/tmp/script.out
echo "The time the script run was -->  `date`" >> /var/tmp/script.out
```

检查文件权限：

```bash
# ls -lrt /var/tmp/test_script.sh
```

如果没有权限，则添加可执行权限：

```bash
# chmod +x /var/tmp/test_script.sh
```

将`/etc/rc.d/rc.local`标记为可执行文件：

<font color="#f00">**在CentOS 7中`/etc/rc.d/rc.local`文件的权限被降低了，开机的时候执行的脚本是不能启动一些服务的，执行下面的命令将文件标记为可执行的文件：**</font>

```bash
# chmod +x /etc/rc.d/rc.local
```

随后，打开`/etc/rc.d/rc.local`文件，写入上面的文件：

```csharp
# vi /etc/rc.d/rc.local
/var/tmp/test_script.sh
```

<font color="#f00">**虽然两种方法都可以设置自启动，但是不建议通过脚本来设置，建议通过设置服务来启动；**</font>

<br/>

## **附录**

文章参考：

-   [CentOS 7 设置自启动](https://www.jianshu.com/p/33ef443bc05e)

<br/>