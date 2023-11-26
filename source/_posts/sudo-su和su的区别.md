---
title: sudo-su和su的区别
toc: true
cover: 'https://img.paulzzh.com/touhou/random?4'
date: 2021-03-25 08:46:25
categories: Linux
tags: [技术杂谈, Linux]
description: 我们可以使用sudo su或者su来获取root权限，那么这两个命令有什么区别呢？本文讲述了这两个命令之间的区别。
---

我们可以使用sudo su或者su来获取root权限，那么这两个命令有什么区别呢？

本文讲述了这两个命令之间的区别。

<br/>

<!--more-->

## **sudo-su和su的区别**

>   此知识点视频地址：
>
>   -   https://www.bilibili.com/video/av62836363

### **su命令**

su是直接申请切换root用户，需要使用root用户密码登录；

**在某些Linux发行版中，例如ubuntu，默认没有设置root用户的密码，所以需要我们先使用`sudo passwd root`设置root用户密码，然后再进行登录；**

<br/>

### **sudo su命令**

而sudo su是当前用户暂时申请root权限，所以输入的并不是root用户密码，而是当前用户的密码；

sudo是用户申请管理员权限执行一个操作，而此处的操作就是变成管理员；

<br/>

### **sudo su的安全性**

根据上面的分析我们可以知道，一个普通用户通过直接输入他自己的账号密码就能获取到root权限，这其实是很危险的事情，尤其是在多用户的情况下！

但是其实也并非所有的用户都可以通过`sudo su`轻易的获取root权限，能够获取root权限的用户被定义在`/etc/sudoers`文章中：

```bash
$ cat /etc/sudoers
#
# This file MUST be edited with the 'visudo' command as root.
#
# Please consider adding local content in /etc/sudoers.d/ instead of
# directly modifying this file.
#
# See the man page for details on how to write a sudoers file.
#
Defaults        env_reset
Defaults        mail_badpass
Defaults        secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin"

# Host alias specification

# User alias specification

# Cmnd alias specification

# User privilege specification
root    ALL=(ALL:ALL) ALL

# Members of the admin group may gain root privileges
%admin ALL=(ALL) ALL

# Allow members of group sudo to execute any command
%sudo   ALL=(ALL:ALL) ALL

# See sudoers(5) for more information on "#include" directives:

#includedir /etc/sudoers.d
```

上面规定了，在admin用户组的用户都可以直接获取到root权限，

我们可以通过`id`命令或者`groups`命令查看当前用户包含的用户组：

```bash
jasonkay@jasonkayPC:~$ groups
jasonkay adm cdrom sudo dip plugdev lpadmin lxd sambashare

jasonkay@jasonkayPC:~$ id
uid=1000(jasonkay) gid=1000(jasonkay) groups=1000(jasonkay),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),120(lpadmin),131(lxd),132(sambashare)
```

>   **注释：**
>
>   -   **dialout（拨号）**
>   -   **cdrom（光驱）**
>   -   **plugdev（U盘等）**
>   -   **lpadmin（打印机）**
>   -   **sambashare（smb共享）**
>   -   **admin（sudo）**
>   -   **adm（因为以前的/var/adm就是现在的/var/log，作用是作为非root用户时，该组用户可以查看log）**

很奇怪的是，其实我们的非root用户jasonkay并没有被包含进admin，为什么还是可以直接使用sudo呢？

<font color="#f00">**这是由于，在ubuntu中，默认是没有admin组的！并且此时，如果只有一个非root用户，那么这个用户是拥有sudo权限的；**</font>

我们可以通过查看`/etc/group`文件查看：

```bash
root@jasonkayPC:/home/jasonkay# cat /etc/group | grep admin
lpadmin:x:120:jasonkay
```

<br/>

### **新的用户tester**

下面我们创建一个新的用户tester，来看看他有没有sudo的权限：

```bash
# 增加新用户
root # adduser tester
Adding user `tester' ...
Adding new group `tester' (1001) ...
Adding new user `tester' (1001) with group `tester' ...
Creating home directory `/home/tester' ...
Copying files from `/etc/skel' ...
New password: 
Retype new password: 
passwd: password updated successfully
Changing the user information for tester
Enter the new value, or press ENTER for the default
        Full Name []: 
        Room Number []: 
        Work Phone []: 
        Home Phone []: 
        Other []: 
Is the information correct? [Y/n] y

# 切换用户
root # sudo su tester

# 查看用户组
tester@jasonkayPC:/home/jasonkay$ id
uid=1001(tester) gid=1001(tester) groups=1001(tester)

# 使用sudo
tester@jasonkayPC:/home/jasonkay$ sudo su
[sudo] password for tester: 
tester is not in the sudoers file.  This incident will be reported.
```

在创建tester用户时，我们故意不指定用户组；

可以看到，tester是没有sudo权限的，但是同样不在admin组的jasonkay是有sudo权限的！

>   **之前的Ubuntu系统可能在创建用户时自动添加了admin组，但是我在20.04版本中并未自动添加！**

下面我们将tester加入admin组：

```bash
root@jasonkayPC:/home/jasonkay# usermod -a -G admin tester
usermod: group 'admin' does not exist
```

这是正常的，这是因为我们还没有admin组！

通过下面的命令创建admin组：

```bash
root@jasonkayPC:/home/jasonkay# groupadd admin
```

随后将tester加入admin组：

```bash
root@jasonkayPC:/home/jasonkay# usermod -a -G admin tester
```

完成！

随后切换至tester用户并使用sudo命令进行测试：

```bash
root@jasonkayPC:/home/jasonkay# su tester
tester@jasonkayPC:/home/jasonkay$ sudo su
root@jasonkayPC:/home/jasonkay# 
```

**发现tester已经有了sudo权限！**

实验结束！

>   实验结束后别忘了删除tester用户：
>
>   ```bash
>   root@jasonkayPC:/home/jasonkay# userdel -r tester
>   userdel: tester mail spool (/var/mail/tester) not found
>   ```
>
>   **提示没有邮箱，可以忽略；**
>
>   删除tester用户后，可以看到admin组中的tester用户也被删除了：
>
>   ```bash
>   root@jasonkayPC:/home/jasonkay# cat /etc/group | grep admin
>   lpadmin:x:120:jasonkay
>   admin:x:1002:
>   ```
>
>   关于删除用户：
>
>   -   [Linux userdel命令详解：删除用户](http://c.biancheng.net/view/851.html)
>
>   **我们也可以删除admin用户组，当然保留也可以；**

>   当然我们也可以通过visudo命令编辑`/etc/sudoers`文件，对可以使用sudo命令的用户进行管理；
>
>   关于使用visudo命令，可以自行Google；

<br/>

### **拓展**

或许你已经发现了，如果使用同一个账号在短时间内重复操作 sudo 来运行命令的话， 在第二次运行 sudo 时，并不需要输入自己的口令！为什么呢？

 第一次运行 sudo 需要输入口令，是担心由于用户暂时离开座位，但有人跑来你的座位使用你的账号操作系统之故。 所以需要你输入一次口令重新确认一次身份。

而如果两次运行 sudo 的间隔在五分钟内，那么再次运行 sudo 时就不需要再次输入口令了， 这是因为系统相信你在五分钟内不会离开你的作业，所以运行 sudo 的是同一个人！

不过如果两次 sudo 操作的间隔超过 5 分钟，那就得要重新输入一次你的口令了 ([注4](http://cn.linux.vbird.org/linux_basic/0410accountmanager.php#ps4))

另外要注意的是，因为使用一般账号时，理论上不会使用到 /sbin, /usr/sbin 等目录内的命令，所以 $PATH 变量不会含有这些目录，因此很多管理命令需要使用绝对路径来下达比较妥当喔！

<br/>

## **相关阅读**

-   [第十四章、Linux 账号管理与 ACL 权限配置/su](http://cn.linux.vbird.org/linux_basic/0410accountmanager.php#su)

<br/>