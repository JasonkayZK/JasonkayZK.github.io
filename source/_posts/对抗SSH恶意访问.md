---
title: 对抗SSH恶意访问
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?99'
date: 2020-12-08 10:42:28
categories: Linux
tags: [Linux, SSH]
description: 在使用腾讯云或者阿里云时，每次登录都会看到成千上万次的SSH登录失败提示；由于我们的服务器是暴露在公网IP之下的，每天都会被恶意扫描，本文分析了这些恶意扫描，并尽可能给出解决方案；
---

在使用腾讯云或者阿里云时，每次登录都会看到成千上万次的SSH登录失败提示；

由于我们的服务器是暴露在公网IP之下的，每天都会被恶意扫描，本文分析了这些恶意扫描，并尽可能给出解决方案；

<br/>

<!--more-->

## 对抗SSH恶意访问

几乎每次登录的时候都能看到SSH的提示：

```bash
Last failed login: Tue Dec  8 10:44:59 CST 2020 from 54.38.188.231 on ssh:notty
There were 8729 failed login attempts since the last successful login.
Last login: Mon Dec  7 11:01:39 2020 from 116.57.96.116
```

最近偶尔在V2EX上看到了一些关于这个的帖子：

-   [防止 vps 上 ssh 端口被恶意扫描](https://cn.v2ex.com/t/646807)
-   [服务器无时无刻不被 SSH 爆破](https://www.v2ex.com/t/191130)

除了选择云厂商提供的收费防护服务之外，我们这些口袋不富裕的人有什么简单的解决方案呢？

<br/>

### **配置SSH**

更改SSH配置可以：

-   更换SSH端口；
-   安装fail2ban：使用 fail2ban 去屏蔽多次尝试密码的 IP；
-   禁止root登录；
-   使用密码加 Google Authenticator 2步验证进行登录；
-   禁止使用密码登录：只使用密钥登录；

下面一一来讲述：

#### **① 更换SSH端口**

修改ssh端口需要修改ssh配置、修改firewall配置、修改SElinux配置三个文件；

以下均是使用root权限执行；

##### **1.修改`/etc/ssh/sshd_config`文件**

使用vi编辑配置文件：

```bash
vi /etc/ssh/sshd_config
```

进入该文件，找到`Port 22`这一行，然后在下面添加一行：如`Port 43`作为新的端口；

>   **注意：在确定可以使用新端口登录前，不要注释`Port 22`这一行，以免无法登录；**

##### **2.修改firewall配置**

```bash
# firewall添加你选择的ssh端口，--permanent是保存设置，否则下次重启后不生效
firewall-cmd --zone=public --add-port={port}/tcp --permanent 
# 若firewall未启动，则先启动
systemctl start firewalld 
# 重新加载firewall
firewall-cmd --reload 
# 查看端口是否添加成功，yes表示成功，no表示未添加成功
firewall-cmd --zone=public --query-port={port}/tcp 
```

将上面的`{port}`改为你对应的端口即可；

##### **3.修改SELinux配置**

这一步有的云服务器可能是关闭SELinux的，就不需要修改；

但是默认应该是打开了SELinux的，因此推荐修改；

```bash
# 查看当前SELinux允许的ssh端口
semanage port -l | grep ssh 
```

如果显示`semanage command not found`，则：

```bash
yum provides semanage # 或 yum whatprovides semanage
yum -y install policycoreutils-python # 安装
/usr/sbin/sestatus -v # 查看SELinux状态，enabled即为开启状态
```

若未开启，则`vi /etc/selinux/config`，将`SELINUX=disabled`修改为`SELINUX=enforcing`，需要重启；

```bash
semanage port -a -t ssh_port_t -p tcp {port} # 添加ssh端口
semanage port -l | grep ssh # 再执行一次查看是否添加成功
```

##### **4.重启服务并测试**

```bash
systemctl restart sshd  
systemctl restart firewalld.service  
shutdown -r now # 重启机器，最好重启一下
```

重启后使用新端口进行ssh登录，测试是否添加成功；

```bash
ssh usrname@server -p {port} # 使用-p指定端口
```

登录成功后`vi /etc/ssh/sshd_config`将`Port 22`这一行注释，并继续重启服务以生效；

<br/>

#### **② 使用fail2ban去屏蔽多次尝试密码的IP**

修改默认ssh端口后已经可以防御很多只扫描特定端口的脚本，但是还是有被密码爆破的风险，因此我们安装fail2ban来屏蔽多次尝试密码的坏人；

```bash
yum -y install epel-release # CentOS内置源并未包含fail2ban，需要先安装epel源
yum -y install fail2ban # 安装fail2ban
```

`vi /etc/fail2ban/jail.local`来新建fail2ban的配置，复制以下配置作为默认规则：

```bash
[DEFAULT]
ignoreip = 127.0.0.1/8
bantime  = 86400
findtime = 600
maxretry = 5
#这里banaction必须用firewallcmd-ipset,这是fiewalll支持的关键，如果是用Iptables请不要这样填写
banaction = firewallcmd-ipset
action = %(action_mwl)s

[sshd]
enabled = true
filter  = sshd
port    = {port}
# 这里的{port}为你修改后的端口，如43
action = %(action_mwl)s
logpath = /var/log/secure
```

上面的配置为十分钟内，如果连续错误超过5次，就ban掉这个IP；

输入`systemctl start fail2ban`启动fail2ban；

`fail2ban-client status sshd`可以显示fail2ban的状态，查看是否有被攻击的记录；

<br/>

#### **③ 禁止root用户直接登录**

前面由于要修改、安装各种服务，因此使用root账户比较方便；

但在VPS的实际使用中，首先我们要避免被坏人攻陷，直接root登录；其次我们要避免使用root用户执行危险的操作，发生意外，所以我们禁止root用户直接登录，新建一个拥有sudo权限的用户，平时使用其来登录和执行操作，减低风险；

```bash
useradd newone # 新建名为newone的用户
passwd newone # 设置newone的密码
```

>   **注意！！！下面这步非常重要，否则新用户可能无法登录。**
>
>   输入`vi /etc/ssh/sshd_config`，使用`AllowUsers newone`添加可以ssh登录的用户；
>
>   `systemctl restart sshd`重启ssh服务；

修改上一步后，保留一个终端窗口，测试新用户是否能成功登录，如果能成功登录，则禁用root用户登录；

`vi /etc/ssh/sshd_config`修改其中`PermitRootLogin yes`为`PermitRootLogin no`。`systemctl restart sshd`重启ssh服务；

此时root账户已经无法登录；

<br/>

#### **④ 使用密码加 Google Authenticator 2步验证进行登录**

比较安全的SSH登录方式，一种是禁止密码且只允许密钥登录，只要保证密钥的安全，就能保证登录的安全；而另外一种2步验证的方法了；

这里我们会用到Google Authentication，其实很多网站/App已经运用到2步验证了；

##### **1.安装Google Authenticator**

```bash
yum install https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
yum install google-authenticator
```

切换到要使用Google Authenticator的用户，然后输入`google-authenticator`，屏幕会显示一个超大的二维码，你需要使用支持Google Authenticator的软件，扫描该二维码或者输入“secret key”以生成动态的验证码；

##### **2.修改配置**

修改pam配置文件：`vi /etc/pam.d/sshd`；

在首行加入`auth required pam_google_authenticator.so`，这样子在输入密码登录之前，会先要求输入Google Authentication的验证码，如果是希望反过来，则将这行代码写入到pam配置文件的最后则可；

修改ssh配置文件：`vi /etc/ssh/sshd_config`；

将`ChallengeResponseAuthentication no`修改为`ChallengeResponseAuthentication yes`；

检查系统时间：

```bash
#查看下服务器时间
date
#如果时区不一样，再使用命令修改为本地时间
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```

最后，在保留一个活动的终端窗口的前提下，重启ssh服务，`systemctl restart sshd`，然后重新登录该用户测试是否成功（登录失败也有可能是因为终端软件的问题，比如，尝试更换软件）；

<br/>

#### **⑤ 使用有密码的SSH密钥进行登录**

其实，使用密钥进行登录已经算非常安全了，但是为了更加安全，我们还可以给密钥文件添加密码；

>   建议在自己的常用工作电脑上使用密钥登录服务器，而在其他电脑上则保留使用密码登录的方式；

使用密钥登录，我们会生成非对称加密的一对密钥，分别称之为“私钥”和“公钥”；

如果公钥加密的信息只有私钥才能解开，那么只要私钥不泄露，通信就是安全的；

>   不清楚非对称加密是什么？看看阮一峰老师的：
>
>   -   [RSA算法原理（一）](https://www.ruanyifeng.com/blog/2013/06/rsa_algorithm_part_one.html)

##### **1.生成密钥对**

在终端输入`ssh-keygen`来生成密钥，默认会保存在`~/.ssh/id_rsa`，可以自定义该文件的地址和名称，例如`~/.ssh/remote_server`；

然后会询问是否添加密钥，默认是不设置密码的，这里可以设定密码；

然后会生成密钥文件，其中你指定的路径就是私钥文件，而`.pub`结尾的就是公钥文件；

然后在本地的`~/.ssh/config`中添加以下代码，用于指定密钥：

```bash
Host RemoteServer # 随意自己起，但是要用到
HostName 102.133.250.111 # 修改为服务器的地址、域名或IP
User newone # 指定登录的用户
PreferredAuthentications publickey
IdentityFile ~/.ssh/remote_server # 指定私钥的地址
Port {port} # 默认端口为22，如果你修改了端口，则修改为对应的端口
```

##### **2.将公钥存放到目标服务器上**

打开目标服务器的目标用户的`~/.ssh`路径，然后将`.ssh/remote_server.pub`文件的内容复制到`~/.ssh/authorized_keys`里，如果没有`~/.ssh`文件夹则参考以下代码，先localhost登录一次；

```bash
$ ssh localhost # 输入密码登录
The authenticity of host 'localhost (::1)' can't be established.
ECDSA key fingerprint is SHA256:DYd7538oOsqpIIDTs01C3G4S6PRE7msA91yUgk9Dzxk.
ECDSA key fingerprint is MD5:88:80:21:03:b2:52:6b:06:ff:c7:3b:d5:2d:47:c9:ad.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added 'localhost' (ECDSA) to the list of known hosts.
newone@localhost's password: 
Last login: Sat Dec 14 19:49:07 2019 from localhost
$ exit
```

登录过后就会生成`~/.ssh`文件夹了；

>   注意`~/.ssh`目录权限必须为700，`~/.ssh/authorized_keys`权限必须为600；

### 3.修改配置文件

输入`vi /etc/ssh/sshd_config`，将该文件添加以下3行，如果已有则改成一样的：

```bash
RSAAuthentication yes
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
```

然后`systemctl restart sshd`重启ssh服务；

在本地使用类似`ssh newone@RemoteServer`的命令进行登录，如果登录成功则说明设置生效了；

<br/>

### **配置云服务器白名单**

在云厂商后台管理中配置白名单，只允许自己的IP登录，也可以解决问题；

<br/>