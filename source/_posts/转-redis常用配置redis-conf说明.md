---
title: '[转]redis常用配置redis.conf说明'
toc: false
date: 2020-01-17 22:30:29
cover: http://api.mtyqx.cn/api/random.php?8
categories: [Redis, 软件安装与配置]
tags: [Redis, 软件安装与配置]
description: 本篇总结在redis.conf中常用的配置内容
---

本篇总结在redis.conf中常用的配置内容

文章转自: [Redis常见配置redis.conf](https://www.cnblogs.com/richiewlq/p/8569821.html)

<br/>

<!--more-->

1、redis默认不是以守护进程的方式运行，可以通过该配置项修改，使用yes启用守护进程：

daemonize no



2、当redis以守护进程方式运行时，redis默认会把pid写入/var/run/redis.pid文件，可以通过pidfile指定：

pidfile /var/run/redis.pid



3、指定redis监听端口，默认端口号为6379，作者在自己的一篇博文中解析了为什么选用6379作为默认端口，因为6379在手机按键上MERZ对应的号码，而MERZ取自意大利女歌手Alessia Merz的名字：

port 6379



4、设置tcp的backlog，backlog是一个连接队列，backlog队列总和=未完成三次握手队列+已完成三次握手队列。在高并发环境下你需要一个高backlog值来避免慢客户端连接问题。注意Linux内核会将这个值减小到/proc/sys/net/core/somaxconn 的值，所以需要确认增大somaxconn和tcp_max_syn_backlog两个值来达到想要的

效果：

tcp-backlog 511



5、绑定的主机地址：

bind 127.0.0.1



6、当客户端闲置多长时间后关闭连接，如果指定为0，表示永不关闭：

timeout 300



7、设置检测客户端网络中断时间间隔，单位为秒，如果设置为0，则不检测，建议设置为60：

tcp-keepalive 0



8、指定日志记录级别，redis总共支持四个级别：debug、verbose、notice、warning，默认为verbose：

loglevel verbose



9、日志记录方式，默认为标准输出，如果配置redis为守护进程方式运行，而这里又配置为日志记录方式为标准输出，则日志将会发送给/dev/null：

logfile stdout



10、设置数据库数量，默认值为16，默认当前数据库为0，可以使用`select<dbid>`命令在连接上指定数据库id：

databases 16



11、指定在多长时间内，有多少次更新操作，就将数据同步到数据文件，可以多个条件配合：

`save <seconds><changes>`

save 300 10：表示300秒内有10个更改就将数据同步到数据文件



12、指定存储至本地数据库时是否压缩数据，默认为yes，redis采用LZF压缩，如果为了节省CPU时间，可以关闭该选项，但会导致数据库文件变得巨大：

rdbcompssion yes



13、指定本地数据库文件名，默认值为dump.rdb：

dbfilename dump.rdb



14、指定本地数据库存放目录：

dir ./



15、设置当本机为slave服务时，设置master服务的IP地址及端口，在redis启动时，它会自动从master进行数据同步：

`slaveof <masterip><masterport>`



16、当master服务设置了密码保护时，slave服务连接master的密码：

`masterauth <master-password>`



17、设置redis连接密码，如果配置了连接密码，客户端在连接redis时需要通过`auth <password>`命令提供密码，默认关闭：

requirepass foobared



18、设置同一时间最大客户端连接数，默认无限制，redis可以同时打开的客户端连接数为redis进程可以打开的最大文件描述符数，如果设置maxclients 0，表示不作限制。当客 户端连接数到达限制时，redis会关闭新的连接并向客户端返回 max number of clients  reached错误消息：

maxclients 128



19、指定redis最大内存限制，redis在启动时会把数据加载到内存中，达到最大内存后，redis会先尝试清除已到期或即将到期的key，当次方法处理后，仍然到达最大内存设置，将无法再进行写入操作，但仍然可以进行读取操作。Redis新的vm机制， 会把key存放内存，value会存放在swap区：

`maxmemory <bytes>`



20、设置缓存过期策略，有6种选择：（LRU算法最近最少使用）

volatile-lru：使用LRU算法移除key，只对设置了过期时间的key；

allkeys-lru：使用LRU算法移除key，作用对象所有key；

volatile-random：在过期集合key中随机移除key，只对设置了过期时间的key;

allkeys-random：随机移除key，作用对象为所有key；

volarile-ttl：移除哪些ttl值最小即最近要过期的key；

noeviction：永不过期，针对写操作，会返回错误信息。

maxmemory-policy noeviction



21、指定是否在每次更新操作后进行日志记录，redis在默认情况下是异步的把数据写入磁盘，如果不开启，可能会在断电时导致一段时间内数据丢失。因为redis本身同步数据文件是按上面save条件来同步的，所以有的数据会在一段时间内置存在于内存中。默认为no：

appendonly no



22、指定更新日志文件名，默认为appendonly.aof：

appendfilename appendonly.aof



23、指定更新日志条件，共有3个可选值：

no：表示等操作系统进行数据缓存同步到磁盘（快）；

always：表示每次更新操作后手动调用fsync()将数据写到磁盘（慢，安全）；

everysec：表示每秒同步一次（折中，默认值）

appendfsync everysec



24、指定是否启用虚拟内存机制，默认值为no，简单介绍一下，VM机制将数据分页存放，由redis将访问量较小的页即冷数据 swap到磁盘上，访问多的页面由磁盘自动换出到内存中：

vm-enabled no



25、虚拟内存文件路径，默认值为/tmp/redis.swap，不可多个redis实例共享：

vm-swap-file /tmp/redis.swap



26、将所有大于vm-max-memory的数据存入虚拟内存，无论vm-max-memory设置多小，所有索引数据都是内存存储的（redis的索引数据就是keys），也就是说，当vm-max-memory设置为0的时候，其实是所有value都存在于磁盘。默认值为 0：

vm-max-memory 0



27、redis  swap文件分成了很多的page，一个对象可以保存在多个page上面，但一个page上不能被多个对象共享，vm-page-size是根据存储的数据大小来设定的，作者建议如果储存很多小对象，page大小最好设置为32或者64bytes；如果存储很多大对象，则可以使用更大的page，如果不确定，就使用默认值：

vm-page-size 32



28、设置swap文件中page数量，由于页表（一种表示页面空闲或使用的bitmap）是放在内存中的，在磁盘上每8个pages将消耗1byte的内存：

vm-pages 134217728



29、设置访问swap文件的线程数，最好不要超过机器的核数，如果设置为0，那么所有对swap文件的操作都是串行的，可能会造成长时间的延迟。默认值为4：

vm-max-threads 4



30、设置在客户端应答时，是否把较小的包含并为一个包发送，默认为开启：

glueoutputbuf yes



31、指定在超过一定数量或者最大的元素超过某一临界值时，采用一种特殊的哈希算法：

hash-max-zipmap-entries 64

hash-max-zipmap-value 512



32、指定是否激活重置hash，默认开启：

activerehashing yes



33、指定包含其他配置文件，可以在同一主机上多个redis实例之间使用同一份配置文件，而同时各个实例又拥有自己的特定配置文件：

include /path/to/local.conf

