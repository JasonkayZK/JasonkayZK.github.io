---
title: 【转】使用telnet测试端口连通性
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?66'
date: 2022-12-21 15:03:39
categories: 技术杂谈
tags: [技术杂谈, telnet]
description: telnet命令是TELNET协议的用户接口，它支持两种模式：命令模式和会话模式，虽然telnet支持许多命令，但大部分情况下，我们只是使用它查看目标主机是否打开了某端口（默认是23）；
---

telnet命令是TELNET协议的用户接口，它支持两种模式：命令模式和会话模式；

虽然telnet支持许多命令，但大部分情况下，我们只是使用它查看目标主机是否打开了某端口（默认是23）；

<br/>

<!--more-->

# **【转】使用telnet测试端口连通性**

## **基本使用**

可以使用下面的命令来测试：

```bash
telnet server-ip port
```

例如：

```bash
telnet localhost 22
```

当端口未打开时，返回：

```bash
$ telnet localhost 4000
Trying ::1...
telnet: connect to address ::1: Connection refused
Trying 127.0.0.1...
telnet: connect to address 127.0.0.1: Connection refused
telnet: Unable to connect to remote host
```

当端口打开后，返回：

```bash
$ telnet localhost 4000
Trying ::1...
Connected to localhost.
Escape character is '^]'.
```

此时命令未退出！

根据提示 `Escape character is '^]'.`，可知：退出字符为 `'^]'（CTRL+]）`；

>   此时输入其它字符不能使其退出，CTRL+C 都不行！

输入 `CTRL+]` 后会进入命令模式：

```bash
^]
telnet>
```

此时再执行 **quit** 才会真正退出：

```bash
telnet> quit
Connection closed.
```

其中，Escape character 可以自定义，使用参数-e：

```bash
# 使用p字符
$ telnet -e p localhost 4000
Telnet escape character is 'p'.
Trying ::1...
Connected to localhost.
Escape character is 'p'.
p
telnet> quit
Connection closed.
```

即便如此，退出telnet还是麻烦；

那么，更进一步，如果出现在[脚本](https://www.linuxcool.com/)中应该如何（优雅地）退出telnet呢？

<br/>

## **telnet直接退出**

输出结果后直接退出：

```bash
# 成功连通端口并自动退出
$ echo "" | telnet localhost 4000   
Trying ::1...
Connected to localhost.
Escape character is '^]'.
Connection closed by foreign host.

# 端口未开放
$ echo "" | telnet localhost 4000
Trying ::1...
telnet: connect to address ::1: Connection refused
Trying 127.0.0.1...
telnet: connect to address 127.0.0.1: Connection refused
telnet: Unable to connect to remote host
```

输出结果后延迟退出：可以使用 `sleep` 使得 telnet 输出结果后，停留2秒后退出命令模式：

```bash
$ sleep 2 | telnet localhost 4000
Trying ::1...
Connected to localhost.
Escape character is '^]'.
Connection closed by foreign host.
```

这种方式可以将标准输出和标准错误重定向到文件中，通过分析文件的内容来判断端口打开状态；

<br/>

# **附录**

文章参考：

-   https://www.linuxprobe.com/telnet-test-port.html
-   https://www.linuxidc.com/Linux/2017-06/145164.htm
