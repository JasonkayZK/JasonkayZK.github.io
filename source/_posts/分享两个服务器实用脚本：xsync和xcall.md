---
title: 分享两个服务器实用脚本：xsync和xcall
toc: true
cover: https://img.paulzzh.com/touhou/random?56
date: 2025-07-21 10:20:51
categories: 工具分享
tags: [工具分享]
description: 如果同时需要维护多台服务器，可能会需要在多台服务器之间同步文件、执行命令。本文介绍了两个简单的脚本实现这一功能！
---

如果同时需要维护多台服务器，可能会需要在多台服务器之间同步文件、执行命令。

本文介绍了两个简单的脚本实现这一功能！

源代码：

-   https://gist.github.com/JasonkayZK/e8bbe840d4b4d9d0ed15d4385e1c0a07
-   https://gist.github.com/JasonkayZK/6847064a739bd08232e2da938d5e34ef

<br/>

<!--more-->

# **分享两个服务器实用脚本：xsync和xcall**

## **文件同步：xsync**

### **1、前置依赖**

xsync 依赖于 rsync 工具，可以通过 yum 或者 apt 简单的安装：

```bash
apt或yum install -y rsync
```

**此外，还需要配置 SSH 无密码登录！**

<br/>

### **2、编写脚本**

脚本内容：

xsync

```bash
#!/bin/bash
# Dependency:
#  1. rsync: yum/apt install -y rsync
#  2. password-less SSH login
#

# 0. Define server list
servers=("server-1" "server-2" "server-3")

# 1. check param num
if [ $# -lt 1 ]; then
  echo "Not Enough Arguement!"
  exit 1
fi

# 2. traverse all machines
for host in "${servers[@]}"; do
  echo "====================  $host  ===================="
  # 3. traverse dir for each file
  for file in "$@"; do
    # 4. check file exist
    if [ -e "$file" ]; then
      # 5. get parent dir
      pdir=$(cd -P "$(dirname "$file")" && pwd)
      # 6. get file name
      fname=$(basename "$file")
      ssh "$host" "mkdir -p $pdir"
      rsync -av "$pdir/$fname" "$host:$pdir"
    else
      echo "$file does not exist!"
    fi
  done
done
```

>   **使用时，上面的文件中 servers 数组中的配置，为你服务器集群！**

<br/>

### **3、使用**

增加可执行权限、并将文件放在 PATH 下；

然后直接使用，例如：

```bash
xsync ~/.bashrc
```

<br/>

## **命令执行：xcall**

和 xsync 类似，编写：

xcall

```bash
#!/bin/bash
# Dependency: password-less SSH login
#

# Define server array (easily extensible)
servers=(
  "server-1"
  "server-2"
  "server-3"
)

# Check if command arguments are provided
if [ $# -eq 0 ]; then
  echo "Error: Please provide a command to execute" >&2
  exit 1
fi

# Execute command across all servers
for server in "${servers[@]}"; do
  echo "--------- $server ----------"
  
  # Execute remote command and handle errors
  if ssh "$server" "$*"; then
    echo "✓ Command executed successfully"
  else
    echo "✗ Command failed on server: $server" >&2
    # Uncomment below line to exit script on first failure
    # exit 1
  fi
done
```

使用也是类似：

增加可执行权限、并将文件放在 PATH 下；

然后直接使用，例如：

```bash
xcall ls
```

<br/>

# **附录**

源代码：

-   https://gist.github.com/JasonkayZK/e8bbe840d4b4d9d0ed15d4385e1c0a07
-   https://gist.github.com/JasonkayZK/6847064a739bd08232e2da938d5e34ef


<br/>
