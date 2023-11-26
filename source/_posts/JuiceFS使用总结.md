---
title: JuiceFS使用总结
toc: true
cover: 'https://img.paulzzh.com/touhou/random?4'
date: 2022-12-21 10:27:15
categories: JuiceFS
tags: [分布式, JuiceFS]
description: JuiceFS 是一款面向云原生设计的高性能分布式文件系统，在 Apache 2.0 开源协议下发布，提供完备的 POSIX 兼容性，可将几乎所有对象存储接入本地作为海量本地磁盘使用，亦可同时在跨平台、跨地区的不同主机上挂载读写！使用 JuiceFS 将云厂商的对象存储挂载到本地，就得到一个几乎无限容量的存储空间了；目前 JuiceFS 支持大部份主流厂商提供的对象存储服务，例如：S3、COS、OSS等；本文记录了腾讯云COS+腾讯云轻量服务器的方案；
---

JuiceFS 是一款面向云原生设计的高性能分布式文件系统，在 Apache 2.0 开源协议下发布，提供完备的 POSIX 兼容性，可将几乎所有对象存储接入本地作为海量本地磁盘使用，亦可同时在跨平台、跨地区的不同主机上挂载读写！使用 JuiceFS 将云厂商的对象存储挂载到本地，就得到一个几乎无限容量的存储空间了；目前 JuiceFS 支持大部份主流厂商提供的对象存储服务，例如：S3、COS、OSS等；

本文记录了腾讯云COS+腾讯云轻量服务器的方案；

Github：

-   https://github.com/juicedata/juicefs

官方文档：

-   https://juicefs.com/docs/zh/community/introduction/

<br/>

<!--more-->

# **JuiceFS使用总结**

## **前言**

腾讯云轻量服务器 LightHouse 主打的就是便宜，但是扩展性不够好，之前甚至不能随随便便的扩展硬盘空间；

以我的小鸡为例，只有 80G 的硬盘空间，存不了什么东西；

而对于大容量存储来说，云厂商提供了对象存储，例如：S3、COS、OSS等等；

那么能否**将这些对象存储像硬盘一样直接挂载到本地使用**呢？这样的话，只要有钱，就可以挂载一个无限的存储空间的硬盘了！

答案就是：JuiceFS！

Github：

-   https://github.com/juicedata/juicefs

JuiceFS 官方文档：

-   https://juicefs.com/docs/zh/community/introduction/

<br/>

## **使用方法**

JuiceFS 使用方法非常简单，常用的三个命令：

-   `format`：创建并初始化一个 Juice 文件系统；
-   `mount`：挂载一个 Juice 文件系统；
-   `umount`：卸载 Juice 文件系统；

下面分别来看；

<br/>

### **初始化文件系统：format**

JuiceFS 支持多种数据库来存储相关的元数据信息，例如：SQLite、Redis、Postgre等等；

>   **需要注意的是：**
>
>   **SQLite 这种单文件数据库很难实现被多台计算机同时访问，因此只能单机部署；**
>
>   **如果使用 Redis、PostgreSQL、MySQL 等能够通过网络被多台计算机同时读写访问的数据库，那么就可以实现 JuiceFS 文件系统的分布式挂载读写！**

本文以 Redis 分布式部署为例来介绍；

在初始化文件系统之前，需要准备下面这些内容：

-   **JuiceFS**：直接根据官方文档安装：[JuiceFS安装](https://juicefs.com/docs/zh/community/installation)
-   **Redis**：直接使用 Docker 部署即可；
-   **存储桶**：可以在 COS 的控制台创建：[存储桶列表](https://console.cloud.tencent.com/cos/bucket)
-   **API密钥**：即SecretId、SecretKey，在 [API密钥管理获取](https://console.cloud.tencent.com/cam/capi)

上面的资源都准备完毕后，就可以初始化我们的 Juice 文件系统了；

例如，注册后的资源为：

-   **Bucket Endpoint**：`https://jfs.cos.ap-guangzhou.myqcloud.com`
-   **Access Key ID**：`ABCDEFGHIJKLMNopqXYZ`
-   **Access Key Secret**：`ZYXwvutsrqpoNMLkJiHgfeDCBA`
-   **数据库地址**：`127.0.0.1:6379`
-   **数据库密码**：`123456`

>   **在 JuiceFS 中使用 Redis 数据库的格式如下：**
>
>   ```text
>   redis://<username>:<password>@<Database-IP-or-URL>:6379/1
>   ```
>
>   **注：Redis 6.0 之前的版本没有用户名，此时直接 URL 中的 `<username>` 部分，例如 `redis://:mypassword@myjfs-sh-abc.redis.rds.aliyuncs.com:6379/1`（请注意密码前面的冒号是分隔符，需要保留）；**

则可以直接通过下面的命令创建 Juice 文件系统：

```bash
juicefs format \
    --storage cos \
    --bucket https://jfs.cos.ap-guangzhou.myqcloud.com \
    --access-key ABCDEFGHIJKLMNopqXYZ \
    --secret-key ZYXwvutsrqpoNMLkJiHgfeDCBA \
    redis://:123456@127.0.0.1:6379/1 \
    jfs
```

文件系统创建完成后，终端将返回类似下面的内容：

```bash
2022/12/20 22:05:04.059603 juicefs[6343] <INFO>: Meta address: redis://:****@127.0.0.1:6379/1
2022/12/20 22:05:04.062535 juicefs[6343] <INFO>: Ping redis: 161.534µs
2022/12/20 22:05:04.063444 juicefs[6343] <INFO>: Data use cos://jfs/jfs/
2022/12/20 22:05:04.507193 juicefs[6343] <INFO>: Volume is formatted as {
  "Name": "jfs",
  "UUID": "192702b5-b3c1-4e16-8e3b-9dabdfb2d35b",
  "Storage": "cos",
  "Bucket": "https://jfs.cos.ap-guangzhou.myqcloud.com",
  "AccessKey": "ABCDEFGHIJKLMNopqXYZ",
  "SecretKey": "removed",
  "BlockSize": 4096,
  "Compression": "none",
  "KeyEncrypted": true,
  "TrashDays": 1,
  "MetaVersion": 1
}
```

**需要注意的是：**

**文件系统一经创建，相关的信息包括名称、对象存储、访问密钥等信息会完整的记录到数据库中；**

**文件系统的信息被记录在 Redis 数据库中，因此在任何一台计算机上，只要拥有数据库地址、用户名和密码信息，就可以挂载读写该文件系统！**

<br/>

### **挂载文件系统：mount**

上一步初始化了我们的文件系统，并将元数据存储在了 Redis 中；

接下来我们来挂载我们的文件系统到本地；

只需要使用 mount 命令即可：

```bash
juicefs mount redis://:123456@127.0.0.1:6379/1 /mnt/jfs
```

此时便将 COS 中的桶挂载到了本地的 `/mnt/jfs` 下：

```bash
mnt/jfs $ ll

total 10
drwxrwxrwx 2 root root 4096 Dec 20 22:45 .
-r-------- 1 root root    0 Dec 20 22:16 .accesslog
-r-------- 1 root root 1246 Dec 20 22:16 .config
-r--r--r-- 1 root root    0 Dec 20 22:16 .stats
dr-xr-xr-x 2 root root    0 Dec 20 22:16 .trash
drwxr-xr-x 3 root root 4096 Dec 20 22:09 ..
```

此时对于这个目录下所有的读写，实际上都会存储在我们的对象存储中！是不是非常简单？

<br/>

### **卸载文件系统：umount**

当不再需要这个挂载文件时，可以使用 umount 卸载这个文件系统：

```bash
juicefs umount /mnt/jfs
```

<br/>

#### **卸载失败**

如果执行命令后，文件系统卸载失败，提示 `Device or resource busy`：

```shell
fusermount: failed to unmount ~/jfs: Device or resource busy
exit status 1
```

发生这种情况，可能是因为某些程序正在读写文件系统中的文件（**例如，有其他 bash 正在这个挂载的目录下**）；

**为了确保数据安全，应该首先排查是哪些程序正在与文件系统中的文件进行交互（例如通过 `lsof` 命令），并尝试结束它们之间的交互动作，然后再重新执行卸载命令；**

>   **注意：以下内容包含的命令可能会导致文件损坏、丢失，请务必谨慎操作！**

当然，在你能够确保数据安全的前提下，也可以在卸载命令中添加 `--force` 或 `-f` 参数，强制卸载文件系统：

```shell
juicefs umount --force ~/jfs
```

<br/>

## **其他配置**

### **开机自动挂载**

实际使用时，我们不能每次开机都手动的执行一下 mount 命令进行挂载，此时我们可以配置一下自动挂载；

以 Linux 系统为例，假设客户端位于 `/usr/local/bin` 目录；

将 JuiceFS 客户端重命名为 `mount.juicefs` 并复制到 `/sbin` 目录：

```bash
sudo cp /usr/local/bin/juicefs /sbin/mount.juicefs
```

编辑 `/etc/fstab` 配置文件，遵照 fstab 的规则添加一条新记录：

```
redis://:123456@127.0.0.1:6379/1    /mnt/jfs    juicefs    _netdev,max-uploads=50,writeback,cache-size=512000     0  0
```

**使用 `mount -a` 使配置生效即可！**

>   **注意：默认情况下，CentOS 6 在系统启动时不会挂载网络文件系统，你需要执行命令开启网络文件系统的自动挂载支持：`sudo chkconfig --add netfs`**

<br/>

### **限制容量、文件数、缓存等**

JuicsFS 的默认限制数量较高，可以手动限制一下文件系统的容量和文件数量等：

```bash
# 限制文件系统容量 (GiB)
$ juicefs config "redis://:123456@127.0.0.1:6379/1" --capacity 128
# 限制文件数量 (inode 数)
$ juicefs config "redis://:123456@127.0.0.1:6379/1" --inodes 100000
```

<br/>

#### **限制容量**

限制容量，可以看到设定前后挂载点容量的变化：

```bash
$ df -h | grep jfs
Filesystem      Size  Used Avail Use% Mounted on
JuiceFS:jfs     1.0P  8.0K  1.0P   1% /mnt/jfs

# 设定容量上限为 128 GiB
$ juicefs config "redis://:123456@127.0.0.1:6379/1" --capacity 128
2022/12/20 21:07:08.832094 juicefs[2253158] <INFO>: Meta address: redis://:123456@127.0.0.1:6379/1 [interface.go:402]
  capacity: 0 GiB -> 128 GiB

# 再次查看发现大小为 128GiB
$ df -h | grep jfs
JuiceFS:jfs     128G  8.0K  128G   1% /mnt/jfs
```

<br/>

#### **限制文件数**

限制文件 inodes 数量，可以看到设定前后挂载点文件数的变化：

```bash
$ df -i
Filesystem       Inodes  IUsed    IFree IUse% Mounted on
/dev/vda2       3901440 367127  3534313   10% /
JuiceFS:jfs    10485762      2 10485760    1% /mnt/jfs

$ juicefs config "redis://:123456@127.0.0.1:6379/1" --inodes 3901440
2022/12/20 21:13:30.977616 juicefs[2255902] <INFO>: Meta address: redis://:123456@127.0.0.1:6379/1 [interface.go:402]
    inodes: 0 -> 3901440

$ df -i
Filesystem       Inodes  IUsed    IFree IUse% Mounted on
/dev/vda2       3901440 367128  3534312   10% /
JuiceFS:jfs     3901440      2  3901438    1% /mnt/jfs
```

<br/>

#### **修改缓存大小**

由于「对象存储」是基于网络的存储服务，不可避免会产生访问延时；为了解决这个问题，JuiceFS 提供并默认启用了缓存机制，即划拨一部分本地存储作为数据与对象存储之间的一个缓冲层，读取文件时会异步地将数据缓存到本地存储，详情请查阅[「缓存」](https://juicefs.com/docs/zh/community/cache_management)；

缓存机制让 JuiceFS 可以高效处理海量数据的读写任务，默认情况下，JuiceFS 会在 `$HOME/.juicefs/cache` 或 `/var/jfsCache` 目录设置 100GiB 的缓存；在速度更快的 SSD 上设置更大的缓存空间可以有效提升 JuiceFS 的读写性能；

可以使用 `--cache-dir` 调整缓存目录的位置，使用 `--cache-size` 调整缓存空间的大小，例如：

```bash
juicefs mount
    --background \
    --cache-dir /mycache \
    --cache-size 512000 \
    redis://:123456@127.0.0.1:6379/1 \
    /mnt/jfs
```

>   **注意：JuiceFS 进程需要具有读写 `--cache-dir` 目录的权限！**

上述命令将缓存目录设置在了 `/mycache` 目录，并指定缓存空间为 500GiB；

<br/>

### **垃圾清理**

JuiceFS 默认有回收站机制，删除文件默认在回收站保留一天；

可以去挂载目录下执行这条命令彻底删除：

```bash
$ find .trash -name '*.tmp' | xargs rm -f
```

<br/>

## **多机挂载文件系统**

上面的例子在服务器本机挂载了一个 JuiceFS；

前文说到，我们文件系统的信息被记录在 Redis 数据库中，因此在任何一台计算机上，只要拥有数据库地址、用户名和密码信息，就可以挂载读写该文件系统！

我们在另一台机器上也安装 JuiceFS，同时使用：

```bash
juicefs mount redis://username:passwd@server-ip:server-port/1 /mnt/jfs
```

即可将远程的一个文件系统挂载到本地使用，并且多台设备之间的数据是同步的，非常方便！

<br/>

## **总结**

本文介绍了 JuiceFS 的基本使用；

可以看到，JuiceFS 可以将云厂商的对象存储空间挂载到本地，从而使单机无限存储成为了可能；

同时，多台机器可以共享同一个存储空间，十分的方便！

并且，对于 Docker、K8S 等容器设施，JuiceFS 提供了相应的插件，可以像操作默认存储卷一样使用，还可以直接使用挂载在本地的路径！

事不宜迟，还不快去试试！

<br/>

# **附录**

Github：

-   https://github.com/juicedata/juicefs

官方文档：

-   https://juicefs.com/docs/zh/community/introduction/

文章参考：

-   https://blog.frytea.com/archives/660/
-   https://juicefs.com/docs/zh/community/getting-started/for_distributed

<br/>
