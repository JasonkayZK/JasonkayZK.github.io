---
title: 在Go中仅使用MySQL实现高性能分布式ID生成器
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?8'
date: 2021-06-20 22:14:32
categories: Golang
tags: [Golang, 分布式, ID生成器]
description: 在上一篇文章《高性能分布式ID生成器实现方法总结》中，主要介绍了一些常用的分布式ID生成器；本文在上一篇文章的基础之上，采用Leaf算法结合Go实现双Buffer桶的ID生成器！
---

在上一篇文章[《高性能分布式ID生成器实现方法总结》](/2021/06/20/高性能分布式ID生成器实现方法总结/)中，主要介绍了一些常用的分布式ID生成器；本文在上一篇文章的基础之上，采用Leaf算法结合Go实现双Buffer桶的ID生成器！

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/distributed-id-generator-mysql

系列文章：

-   [UUID生成算法-UUID还是snowflake](/2020/02/09/UUID生成算法-UUID还是snowflake/)
-   [高性能分布式ID生成器实现方法总结](/2021/06/20/高性能分布式ID生成器实现方法总结/)
-   [在Go中仅使用MySQL实现高性能分布式ID生成器](/2021/06/20/在Go中仅使用MySQL实现高性能分布式ID生成器/)

<br/>

<!--more-->

## **在Go中仅使用MySQL实现高性能分布式ID生成器**

上一篇文章[《高性能分布式ID生成器实现方法总结》](/2021/06/20/高性能分布式ID生成器实现方法总结/)中，介绍了一些常用的分布式ID生成器；

接下来，在上一篇文章的基础之上，采用Leaf算法结合Go来实现一个双Buffer桶的ID生成器吧！

>   项目源代码：
>
>   -   https://github.com/JasonkayZK/Go_Learn/tree/distributed-id-generator-mysql

<br/>

### **项目结构**

整个项目的目录结构如下：

```bash
$ tree .
.
├── config
|  └── config.go
├── config.json
├── core
|  └── alloc.go
├── go.mod
├── main.go
├── mysql
|  └── mysql.go
├── schema.sql
└── server
   └── server.go
```

各个目录内容：

-   config：读取`config.json`相关配置；
-   core：分配分布式ID的核心代码；
-   mysql：分配ID的数据库交互逻辑；
-   server：启动后台生成分布式ID服务；

下面来一个一个看；

<br/>

### **数据库设计&配置文件**

数据库设计与文章[《高性能分布式ID生成器实现方法总结》](/2021/06/20/高性能分布式ID生成器实现方法总结/)中所述完全相同：

schema.sql

```mysql
CREATE DATABASE IF NOT EXISTS `id_alloc_db`;

USE `id_alloc_db`;

CREATE TABLE `segments`
(
    `app_tag`     VARCHAR(32) NOT NULL,
    `max_id`      BIGINT      NOT NULL,
    `step`        BIGINT      NOT NULL,
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`app_tag`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8
    COMMENT ='test业务ID池';

INSERT INTO segments(`app_tag`, `max_id`, `step`)
VALUES ('test_business', 0, 100000);
```

重要字段说明：

-   app_tag：用来区分业务；
-   max_id表示：该app_tag目前所被分配的ID号段的最大值；
-   step表示：每次分配的号段长度；

>   更多说明见：
>
>   -   [《高性能分布式ID生成器实现方法总结》](/2021/06/20/高性能分布式ID生成器实现方法总结/)

同时，在配置文件中展示了数据库连接、服务启动端口以及服务超时等相关配置：

config.json

```json
{
  "DSN": "root:123456@tcp(127.0.0.1:3306)/id_alloc_db",
  "table": "segments",

  "HttpPort": 8880,
  "HttpReadTimeout": 5000,
  "HttpWriteTimeout": 5000
}
```

<br/>

### **项目说明**

整个项目主要由四个部分组成：

-   config：读取`config.json`相关配置；
-   core：分配分布式ID的核心代码；
-   mysql：分配ID的数据库交互逻辑；
-   server：启动后台生成分布式ID服务；

下面我们挨个来看；

#### **Config包**

首先从最简单的Config包来看：

config/config.go

```go
package config

var AppConfig *Config

type Config struct {
	DSN   string `json:"DSN"`
	Table string `json:"table"`

	HttpPort         int `json:"httpPort"`
	HttpReadTimeout  int `json:"httpReadTimeout"`
	HttpWriteTimeout int `json:"httpWriteTimeout"`
}

func LoadConf(filename string) error {
	content, err := ioutil.ReadFile(filename)
	if err != nil {
		return err
	}

	conf := Config{}
	err = json.Unmarshal(content, &conf)
	if err != nil {
		return err
	}
	AppConfig = &conf
	return nil
}
```

config包主要是根据传入的`filename`解析配置，并将配置保存在`Config`类型的`AppConfig`中；

<br/>

#### **mysql包**

mysql包主要完成了向MySQL申请ID的任务，代码如下：

mysql/mysql.go

```go
package mysql

var DbHandler *sql.DB

func InitDB() error {
	db, err := sql.Open("mysql", config.AppConfig.DSN)
	if err != nil {
		return err
	}
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(0)
	DbHandler = db
	return nil
}

func NextId(appTag string) (int, int, error) {
	// 总耗时小于2秒
	ctx, cancelFunc := context.WithTimeout(context.Background(), time.Duration(2000)*time.Millisecond)
	defer cancelFunc()

	// 开启事务
	tx, err := DbHandler.BeginTx(ctx, nil)
	if err != nil {
		return 0, 0, err
	}

	// 1：前进一个步长, 即占用一个号段(更新操作是悲观行锁)
	query := "UPDATE " + config.AppConfig.Table + " SET max_id=max_id+step WHERE app_tag=?"
	stmt, err := tx.PrepareContext(ctx, query)
	if err != nil {
		if err = tx.Rollback(); err != nil {
			return 0, 0, err
		}
		return 0, 0, err
	}

	result, err := stmt.ExecContext(ctx, appTag)
	if err != nil {
		if err = tx.Rollback(); err != nil {
			return 0, 0, err
		}
		return 0, 0, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil { // 失败
		if err = tx.Rollback(); err != nil {
			return 0, 0, err
		}
		return 0, 0, err
	} else if rowsAffected == 0 { // 记录不存在
		if err = tx.Rollback(); err != nil {
			return 0, 0, err
		}
		return 0, 0, fmt.Errorf("app_tag not found")
	}

	// 2：查询更新后的最新max_id, 此时仍在事务内, 行锁保护下
	var maxId, step int
	query = "SELECT max_id, step FROM " + config.AppConfig.Table + " WHERE app_tag=?"
	if stmt, err = tx.PrepareContext(ctx, query); err != nil {
		if err = tx.Rollback(); err != nil {
			return 0, 0, err
		}
		return 0, 0, err
	}
	if err = stmt.QueryRowContext(ctx, appTag).Scan(&maxId, &step); err != nil {
		if err = tx.Rollback(); err != nil {
			return 0, 0, err
		}
		return 0, 0, err
	}

	// 3, 提交事务
	err = tx.Commit()
	return maxId, step, err
}
```

主要包括了两个方法：

-   InitDB：初始化数据库；
-   NextId：请求下一个ID端，并更新数据库；

核心部分在`NextId`方法，它主要就是执行了下面的SQL逻辑：

```mysql
Begin
UPDATE table SET max_id=max_id+step WHERE app_tag=xxx
SELECT tag, max_id, step FROM table WHERE app_tag=xxx
Commit
```

即首先，更新了数据库中当前ID段的最大值，随后查询；

<br/>

#### **core包**

core是整个算法核心中的核心部分，代码如下：

alloc.go

```go
package core

// 号段：[left,right)
type Segment struct {
	offset int // 消费偏移
	left   int // 左区间
	right  int // 右区间
}

// 关联到AppTag的号码池
type AppIdAllocator struct {
	mutex        sync.Mutex
	appTag       string      // 业务标识
	segments     []*Segment  // 双Buffer, 最少0个, 最多2个号段在内存
	isAllocating bool        // 是否正在分配中(远程获取)
	waiting      []chan byte // 因号码池空而挂起等待的客户端
}

// 全局分配器, 管理所有App的号码分配
type IdAllocator struct {
	mutex  sync.Mutex
	appMap map[string]*AppIdAllocator
}

var GlobalIdAllocator *IdAllocator

func InitAlloc() (err error) {
	GlobalIdAllocator = &IdAllocator{
		appMap: map[string]*AppIdAllocator{},
	}
	return
}

func (i *IdAllocator) LeftCount(appTag string) int {
	i.mutex.Lock()
	appIdAllocator, _ := i.appMap[appTag]
	i.mutex.Unlock()

	if appIdAllocator != nil {
		return appIdAllocator.leftCountWithMutex()
	}
	return 0
}

func (a *AppIdAllocator) leftCountWithMutex() (count int) {
	a.mutex.Lock()
	defer a.mutex.Unlock()
	return a.leftCount()
}

func (a *AppIdAllocator) leftCount() int {
	var count int
	for i := 0; i < len(a.segments); i++ {
		count += a.segments[i].right - a.segments[i].left - a.segments[i].offset
	}
	return count
}

func (i *IdAllocator) NextId(appTag string) (int, error) {
	var (
		appIdAlloc *AppIdAllocator
		exist      bool
	)

	i.mutex.Lock()
	if appIdAlloc, exist = i.appMap[appTag]; !exist {
		appIdAlloc = &AppIdAllocator{
			appTag:       appTag,
			segments:     make([]*Segment, 0),
			isAllocating: false,
			waiting:      make([]chan byte, 0),
		}
		i.appMap[appTag] = appIdAlloc
	}
	i.mutex.Unlock()

	return appIdAlloc.nextId()
}

func (a *AppIdAllocator) nextId() (int, error) {
	var (
		nextId    int
		waitChan  chan byte
		waitTimer *time.Timer
		hasId     = false
	)

	a.mutex.Lock()
	defer a.mutex.Unlock()

	// 1:有剩余号码, 立即分配
	if a.leftCount() != 0 {
		nextId = a.popNextId()
		hasId = true
	}

	// 2:段<=1个, 启动补偿线程
	if len(a.segments) <= 1 && !a.isAllocating {
		a.isAllocating = true
		go a.fillSegments()
	}

	if hasId {
		return nextId, nil
	}

	// 3:没有剩余号码, 此时补偿线程一定正在运行, 等待其至多一段时间
	waitChan = make(chan byte, 1)
	a.waiting = append(a.waiting, waitChan) // 排队等待唤醒

	// 释放锁, 等待补偿线程唤醒
	a.mutex.Unlock()

	waitTimer = time.NewTimer(2 * time.Second) // 最多等待2秒
	select {
	case <-waitChan:
	case <-waitTimer.C:
	}

	// 4:再次上锁尝试获取号码
	a.mutex.Lock()
	if a.leftCount() != 0 {
		nextId = a.popNextId()
		return nextId, nil
	} else {
		return 0, fmt.Errorf("no available id")
	}
}

func (a *AppIdAllocator) popNextId() int {
	var nextId = a.segments[0].left + a.segments[0].offset
	a.segments[0].offset++
	if nextId+1 >= a.segments[0].right {
		a.segments = append(a.segments[:0], a.segments[1:]...) // 弹出第一个seg, 后续seg向前移动
	}
	return nextId
}

// 分配号码段, 直到足够2个segment, 否则始终不会退出
func (a *AppIdAllocator) fillSegments() {
	var failTimes = 0
	for {
		a.mutex.Lock()
		if len(a.segments) <= 1 { // 只剩余<=1段, 那么继续获取新号段
			a.mutex.Unlock()
			// 请求mysql获取号段
			if seg, err := a.newSegment(); err != nil {
				failTimes++
				if failTimes > 3 { // 连续失败超过3次则停止分配
					a.mutex.Lock()
					a.wakeup() // 唤醒等待者, 让它们立马失败
					goto LEAVE
				}
			} else {
				failTimes = 0 // 分配成功则失败次数重置为0
				// 新号段补充进去
				a.mutex.Lock()
				a.segments = append(a.segments, seg)
				a.wakeup()               // 尝试唤醒等待资源的调用
				if len(a.segments) > 1 { // 已生成2个号段, 停止继续分配
					goto LEAVE
				} else {
					a.mutex.Unlock()
				}
			}
		} else {
			// never reach
			break
		}
	}

LEAVE:
	a.isAllocating = false
	a.mutex.Unlock()
}

func (a *AppIdAllocator) newSegment() (*Segment, error) {
	maxId, step, err := mysql.NextId(a.appTag)
	if err != nil {
		return nil, err
	}

	return &Segment{
		left:  maxId - step,
		right: maxId,
	}, nil
}

func (a *AppIdAllocator) wakeup() {
	var waitChan chan byte

	for _, waitChan = range a.waiting {
		close(waitChan)
	}
	a.waiting = a.waiting[:0]
}
```

alloc包比较复杂，我们一点一点来看；

##### **几个分配器类型**

代码首先声明了几个类型：

-   Segment：具体的双Buffer中单个ID池的抽象，ID区间为：`[left,right)`；
-   AppIdAllocator：关联到AppTag的ID Buffer池，即具体某个业务的ID分配器；
-   IdAllocator：全局ID分配器, 管理所有业务的ID分配；

函数`InitAlloc`用于在main中初始化全局变量`GlobalIdAllocator`，即全局的ID分配器；

<br/>

##### **查询当前剩余ID：LeftCount**

在`IdAllocator`中的`LeftCount`方法用于查询当前某个`appTag`下ID Buffer池中的剩余ID数；

具体方式就是首先获取`IdAllocator`中`appMap`存储的对应`appTag`下的`AppIdAllocator`，然后调用`AppIdAllocator`的`leftCountWithMutex`方法；

而`leftCountWithMutex`方法最终调用`leftCount`方法进行计算；

计算的方式和前一篇文章所述基本一致，只是需要计算两个Buffer的和，即：

```
单个segment：
(right - left) - offset = 区间长度 - 已使用区间长度

总计：
count = sum(<all_segment_remain>)
```

<br/>

##### **计算下一个ID：popNextId**

当ID充足时，我们通过`popNextId`方法计算下一个ID；

下面是`popNextId`的代码，非常简单：

```go
func (a *AppIdAllocator) popNextId() int {
	var nextId = a.segments[0].left + a.segments[0].offset
	a.segments[0].offset++
	if nextId+1 >= a.segments[0].right {
        // 弹出第一个seg, 后续seg向前移动
		a.segments = append(a.segments[:0], a.segments[1:]...)
	}
	return nextId
}
```

首先，下一个分配的ID一定是：`Buffer[0]min + offset`；

分配ID后，当前`Buffer[0]`中的`offset`值加1，指向下一个ID；

当然，如果下一个值已经到了`Buffer[0]`的末尾，即当前Buffer中的ID已经全部分配，则将`Buffer[1]`中的值移入`Buffer[0]`中，进行填充；

<br/>

##### **分配ID：NextId**

在`IdAllocator`中的`NextId`方法用于分配当前某个`appTag`下ID Buffer池中的ID；

>   <font color="#f00">**需要注意的是：整个ID分配的过程是惰性的，即懒加载**</font>
>
>   <font color="#f00">**在分配时，如果发现`IdAllocator`中`appMap`尚无存储这个`appTag`，则会首先创建，然后再对这个`appTag`进行ID生成；**</font>

分配主要使用对应`appTag`下的`AppIdAllocator`的`nextId`方法：

下面具体来看`nextId`方法：

```go
func (a *AppIdAllocator) nextId() (int, error) {
	……
	a.mutex.Lock()
	defer a.mutex.Unlock()

	// 1:有剩余号码, 立即分配
	if a.leftCount() != 0 {
		nextId = a.popNextId()
		hasId = true
	}

	// 2:段<=1个, 启动补偿线程
	if len(a.segments) <= 1 && !a.isAllocating {
		a.isAllocating = true
		go a.fillSegments()
	}

	if hasId {
		return nextId, nil
	}

	// 3:没有剩余号码, 此时补偿线程一定正在运行, 等待其至多一段时间
	waitChan = make(chan byte, 1)
	a.waiting = append(a.waiting, waitChan) // 排队等待唤醒

	// 释放锁, 等待补偿线程唤醒
	a.mutex.Unlock()

	waitTimer = time.NewTimer(2 * time.Second) // 最多等待2秒
	select {
	case <-waitChan:
	case <-waitTimer.C:
	}

	// 4:再次上锁尝试获取号码
	a.mutex.Lock()
	if a.leftCount() != 0 {
		nextId = a.popNextId()
		return nextId, nil
	} else {
		return 0, fmt.Errorf("no available id")
	}
    ……
}
```

上面是`nextId`方法的内容，在生成ID时主要分为了几种情况：

-   Buffer中仍然存在ID（这也是最多的情况）：直接返回ID；
-   Buffer中不存在ID：需要等待分配；

>   **通过`leftCount`方法可以查看是否存在剩余ID缓存；**

下面分类来讨论；

**① 有剩余号码**

当有剩余号码时，会立即通过`popNextId`方法分配ID；

随后，如果分配后剩余的Buffer桶不足，则会异步对Buffer桶进行填充；

****

**② 无剩余号码（通常是在初始化时）**

当ID Buffer中无剩余号码时，此时由于经过了上面的异步填充代码，因此，此时一定处于补偿协程在工作的状态（也有可能已经补偿完毕）；

此时，将当前协程挂起等待，直到被`fillSegments`方法调用的`wakeup`方法唤醒或2秒钟后超时：

```go
// 3:没有剩余号码, 此时补偿线程一定正在运行, 等待其至多一段时间
waitChan = make(chan byte, 1)
a.waiting = append(a.waiting, waitChan) // 排队等待唤醒

// 释放锁, 等待补偿线程唤醒
a.mutex.Unlock()

waitTimer = time.NewTimer(2 * time.Second) // 最多等待2秒
select {
	case <-waitChan:
	case <-waitTimer.C:
}
```

等待结束后，通常情况下是因为`fillSegments`方法补偿完毕，此时再次尝试获取ID；

<br/>

##### **异步双Buffer池ID填充：fillSegments**

`fillSegments`方法是在NextId方法分配ID后发现双Buffer中的某个Segment已经用尽或在初始化时才调用的；

`fillSegments`方法也比较简单，主要是通过`mysql包`请求MySQL分配ID段，然后向具体的某个`AppIdAllocator`添加对应的Segment即可；

<br/>

#### **server包**

server包就比较简单了，主要是创建了两个路由：

-   `/alloc?app_tag=<app_name>`：请求一个ID；
-   `/health?app_tag=<app_name>`：ID生成器健康查询；

下面是代码：

server.go

```go
package server

type allocResponse struct {
	RespCode int    `json:"resp_code"`
	Msg      string `json:"msg"`
	Id       int    `json:"id"`
}

type healthResponse struct {
	RespCode int    `json:"resp_code"`
	Msg      string `json:"msg"`
	Left     int    `json:"left"`
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	var (
		appTag string
	)
	healthResp := healthResponse{}
	err := r.ParseForm()
	if err != nil {
		goto RESP
	}
	if appTag = r.Form.Get("app_tag"); appTag == "" {
		err = fmt.Errorf("need app_tag param")
		goto RESP
	}
	healthResp.Left = core.GlobalIdAllocator.LeftCount(appTag)
	if healthResp.Left == 0 {
		err = fmt.Errorf("no available id")
		goto RESP
	}

RESP:
	if err != nil {
		healthResp.RespCode = -1
		healthResp.Msg = fmt.Sprintf("%v", err)
		w.WriteHeader(500)
	} else {
		healthResp.Msg = "success"
	}
	if bytes, err := json.Marshal(&healthResp); err == nil {
		_, _ = w.Write(bytes)
	} else {
		w.WriteHeader(500)
		healthResp.Msg = fmt.Sprintf("%v", err)
	}
}

func handleAlloc(w http.ResponseWriter, r *http.Request) {
	var (
		resp   = allocResponse{}
		err    error
		bytes  []byte
		appTag string
	)

	if err = r.ParseForm(); err != nil {
		goto RESP
	}
	if appTag = r.Form.Get("app_tag"); appTag == "" {
		err = fmt.Errorf("need app_tag param")
		goto RESP
	}

	for {
		if resp.Id, err = core.GlobalIdAllocator.NextId(appTag); err != nil {
			goto RESP
		}
		if resp.Id != 0 { // 跳过ID=0, 一般业务不支持ID=0
			break
		}
	}
RESP:
	if err != nil {
		resp.RespCode = -1
		resp.Msg = fmt.Sprintf("%v", err)
		w.WriteHeader(500)
	} else {
		resp.Msg = "success"
	}
	if bytes, err = json.Marshal(&resp); err == nil {
		_, _ = w.Write(bytes)
	} else {
		w.WriteHeader(500)
		resp.Msg = fmt.Sprintf("%v", err)
	}
}

func StartServer() error {
	mux := http.NewServeMux()
	mux.HandleFunc("/alloc", handleAlloc)
	mux.HandleFunc("/health", handleHealth)

	srv := &http.Server{
		ReadTimeout:  time.Duration(config.AppConfig.HttpReadTimeout) * time.Millisecond,
		WriteTimeout: time.Duration(config.AppConfig.HttpWriteTimeout) * time.Millisecond,
		Handler:      mux,
	}
	listener, err := net.Listen("tcp", ":"+strconv.Itoa(config.AppConfig.HttpPort))
	if err != nil {
		return err
	}

	fmt.Printf("server started at: localhoost:%d\n", config.AppConfig.HttpPort)
	return srv.Serve(listener)
}
```

由于代码非常简单，这里就不再解释了；

<br/>

#### **main函数**

main函数可以解析config参数，用于指定具体配置文件的路径，如：

```bash
$ ./distributed-id-generator --config ./config.json
```

当然，默认就是当前路径下的`config.json`文件了；

下面是main函数代码：

main.go

```go
package main

func main() {
	var configFile string
	flag.StringVar(&configFile, "config", "config.json", "the config file: config.json")
	flag.Parse()

	err := config.LoadConf(configFile)
	if err != nil {
		panic(err)
	}
	err = mysql.InitDB()
	if err != nil {
		panic(err)
	}
	err = core.InitAlloc()
	if err != nil {
		panic(err)
	}
	err = server.StartServer()
	if err != nil {
		panic(err)
	}
}
```

main函数主要完成了这么几项内容：

-   从命令行参数中解析配置文件路径；
-   解析配置文件并加载配置；
-   初始化数据库；
-   初始化ID生成器；
-   初始化ID生成服务；

至此，整个项目完成，下面进行测试；

<br/>

### **测试**

#### **启动项目**

**① 初始化数据库**

创建数据库：

schema.sql

```mysql
CREATE DATABASE IF NOT EXISTS `id_alloc_db`;

USE `id_alloc_db`;

CREATE TABLE `segments`
(
    `app_tag`     VARCHAR(32) NOT NULL,
    `max_id`      BIGINT      NOT NULL,
    `step`        BIGINT      NOT NULL,
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`app_tag`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8
    COMMENT ='业务ID池';

INSERT INTO segments(`app_tag`, `max_id`, `step`)
VALUES ('test_business', 0, 100000);
```

**② 修改配置**

config.json

```json
{
  "DSN": "root:123456@tcp(127.0.0.1:3306)/id_alloc_db",
  "table": "segments",
  "HttpPort": 8880,
  "HttpReadTimeout": 5000,
  "HttpWriteTimeout": 5000
}
```

修改`DSN`为你实际数据库的配置；

**③ 安装依赖并运行**

执行下面的命令安装依赖并启动服务：

```bash
go mod tidy && go run main.go
```

打印出Server启动信息则成功：

```bash
$ go mod tidy && go run main.go
server started at: localhoost:8880
```

<br/>

#### **功能测试**

##### **① 请求分配ID**

请求分配ID路由为，`/alloc?app_tag=<app_name>`；

下面为结果：

```bash
$ curl http://localhost:8880/alloc?app_tag=test_business
{"resp_code":0,"msg":"success","id":1}

$ curl http://localhost:8880/alloc?app_tag=test_business
{"resp_code":0,"msg":"success","id":2}
```

##### **② 健康检查**

请求分配ID路由为，`/health?app_tag=<app_name>`；

下面为结果：

```bash
$ curl http://localhost:8880/health?app_tag=test_business
{"resp_code":0,"msg":"success","left":199996}

$ curl http://localhost:8880/health?app_tag=test_business
{"resp_code":0,"msg":"success","left":199996}
```

此时数据库中的内容：

```
mysql> select * from id_alloc_db.segments;

+---------------+--------+--------+---------------------+
| app_tag       | max_id | step   | update_time         |
+---------------+--------+--------+---------------------+
| test_business | 200000 | 100000 | 2021-06-20 13:07:23 |
+---------------+--------+--------+---------------------+
1 row in set (0.00 sec)
```

此时ID已经缓存至了200000！

<br/>

## **附录**

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/distributed-id-generator-mysql

系列文章：

-   [UUID生成算法-UUID还是snowflake](/UUID生成算法-UUID还是snowflake/)
-   [高性能分布式ID生成器实现方法总结](/2021/06/20/高性能分布式ID生成器实现方法总结/)
-   [在Go中仅使用MySQL实现高性能分布式ID生成器](/2021/06/20/在Go中仅使用MySQL实现高性能分布式ID生成器/)

文章参考：

-   [浅谈分布式 ID 的实践与应用](https://mp.weixin.qq.com/s/uqfbmr8oJFr8riPNl59crw)
-   [Leaf——美团点评分布式ID生成系统](https://tech.meituan.com/MT_Leaf.html)
-   [go-id-alloc](https://github.com/owenliang/go-id-alloc)

<br/>

