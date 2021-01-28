---
title: Golang实现自定义协程池
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?98'
date: 2020-09-25 17:34:17
categories: Golang
tags: [Golang, 协程池]
description: 在某些场景下，我们需要连接池的实现来避免每次使用组件都重新创建连接，以提升效率；但是某些情况下我们所使用的组件并未提供连接池给我们使用(例如消息队列nsq)，这个时候我们就需要一个能够自定义的连接池来面对各种需要协程池的场景！本文即实现了一个自定义的连接池；
---

在某些场景下，我们需要连接池的实现来避免每次使用组件都重新创建连接，以提升效率；但是某些情况下我们所使用的组件并未提供连接池给我们使用(例如消息队列nsq)，这个时候我们就需要一个能够自定义的连接池来面对各种需要协程池的场景！

本文首先分析了几种常见连接池的实现方式，最后实现了一个开箱即用的自定义的连接池；


源代码：

- https://github.com/JasonkayZK/pool

<br/>

<!--more-->

<br/>

## Golang实现自定义协程池

连接池是一个用来维护可复用连接的数据结构，正确地使用连接池可以达到减少网络往返损耗，降低系统资源占用，提升响应性能的目的。连接池主要的思想是把新建的连接暂存到池子中，当请求结束后不关闭连接，而是放回到连接池中，需要的时候从连接池中取出连接使用。

### 不同连接池实现方式

[go-redis](https://link.zhihu.com/?target=https%3A//github.com/go-redis/redis)，[redigo](https://link.zhihu.com/?target=https%3A//github.com/gomodule/redigo)和[radix.v2](https://link.zhihu.com/?target=https%3A//github.com/mediocregopher/radix.v2)都是用Go实现的Redis客户端，它们都在代码中实现了健壮的连接池，而它们实现的方式又各不一样，接下来就一起窥探它们的连接池实现的区别；

下面这个表格展示了它们的特点：

| **特性**             | **go-redis** | **redigo** | **radix.v2** |
| -------------------- | ------------ | ---------- | ------------ |
| **连接池实现方式**   | slice        | linkedlist | channel      |
| **自动关闭空闲连接** | √            | √          | ×            |
| **连接最大生存时间** | √            | √          | ×            |
| **连接健康检测**     | ×            | √          | √            |
| **连接池**stats      | √            | √          | ×            |

下面我们一个一个来看：

#### go-redis

`ConnPool`是go-redis中连接池的实现，其数据结构如下：

```go
type ConnPool struct {
    opt *Options

    dialErrorsNum uint32 // atomic

    lastDialErrorMu sync.RWMutex
    lastDialError   error

    queue chan struct{}

    connsMu      sync.Mutex
    conns        []*Conn
    idleConns    []*Conn
    poolSize     int
    idleConnsLen int

    stats Stats

    _closed uint32 // atomic
}
```

主要字段说明：

-   opt：连接池的参数选项。
-   dialErrorsNum：连接失败的错误数。
-   lastDialError：最近一次的连接错误。
-   queue：轮转队列，是一个channel结构。
-   conns：连接队列，维护了未被删除所有连接。
-   idleConns：空闲连接队列，维护了所有的空闲连接。
-   poolSize：连接池大小。
-   idleConnsLen：空闲连接数。
-   stats：连接池的使用数据。
-   _closed：连接池是否关闭。

连接池的选项如下：

```go
type Options struct {
    Dialer  func() (net.Conn, error)
    OnClose func(*Conn) error

    PoolSize           int
    MinIdleConns       int
    MaxConnAge         time.Duration
    PoolTimeout        time.Duration
    IdleTimeout        time.Duration
    IdleCheckFrequency time.Duration
}
```

字段说明：

-   Dialer：新建连接的工厂函数。
-   OnClose：关闭连接的回调函数。
-   PoolSize：连接池大小。
-   MinIdleConns：最小空闲连接数。
-   PoolTimeout：连接池获取的超时时间。
-   IdleTimeout：空闲连接的超时时间。
-   IdleCheckFrequency：超时空闲连接清理的间隔时间。

新建连接池的过程如下：

```go
func NewConnPool(opt *Options) *ConnPool {
    p := &ConnPool{
        opt: opt,

        queue:     make(chan struct{}, opt.PoolSize),
        conns:     make([]*Conn, 0, opt.PoolSize),
        idleConns: make([]*Conn, 0, opt.PoolSize),
    }

    for i := 0; i < opt.MinIdleConns; i++ {
        p.checkMinIdleConns()
    }

    if opt.IdleTimeout > 0 && opt.IdleCheckFrequency > 0 {
        go p.reaper(opt.IdleCheckFrequency)
    }

    return p
}
```

首先会初始化一个ConnPool实例，赋予`PoolSize`大小的连接队列和轮转队列，接着会根据`MinIdleConns`参数维持一个最小连接数，以保证连接池中有这么多数量的连接处于活跃状态。`IdleTimeout`和`IdleCheckFrequency`参数用来在每过一段时间内会对连接池中不活跃的连接做清理操作。

从连接池中获取一个连接的过程如下：

1.检查连接池是否被关闭，如果被关闭直接返回`ErrClosed`错误。否则尝试在轮转队列中占据一个位置，如果抢占的等待时间超过连接池的超时时间，会返回`ErrPoolTimeout`错误。

```go
if p.closed() {
    return nil, ErrClosed
}

err := p.waitTurn()
if err != nil {
    return nil, err
}
```

这里面的等待过程如下：

```go
func (p *ConnPool) waitTurn() error {
    select {
    case p.queue <- struct{}{}:
        return nil
    default:
        timer := timers.Get().(*time.Timer)
        timer.Reset(p.opt.PoolTimeout)

        select {
        case p.queue <- struct{}{}:
            if !timer.Stop() {
                <-timer.C
            }
            timers.Put(timer)
            return nil
        case <-timer.C:
            timers.Put(timer)
            return ErrPoolTimeout
        }
    }
}
```

轮转队列的主要作用是协调连接池的生产-消费过程，每往轮转队列中添加一个元素时，可用的连接资源的数量就减少一。若无法立即写入，该过程将尝试等待`PoolTimeout`大小的时间后，返回相应结果。

2.尝试从连接池的空闲连接队列中获取一个已有连接，如果该连接已过期，则关闭并丢弃该连接，继续重复相同尝试操作，直至获取到一个连接或连接队列为空为止。

```go
for {
    p.connsMu.Lock()
    cn := p.popIdle()
    p.connsMu.Unlock()

    if cn == nil {
        break
    }

    if p.isStaleConn(cn) {
        _ = p.CloseConn(cn)
        continue
    }

    return cn, nil
}
```

3.如果上一步无法获取到已有连接，则新建一个连接，如果没有返回错误则直接返回，如果新建连接时返回错误，则释放掉轮转队列中的位置，返回连接错误。

```go
newcn, err := p._NewConn(true)
if err != nil {
    p.freeTurn()
    return nil, err
}

return newcn, nil
```

其中新建连接的过程如下：

```go
cn, err := p.newConn(pooled)
if err != nil {
    return nil, err
}

p.connsMu.Lock()
p.conns = append(p.conns, cn)
if pooled {
    if p.poolSize < p.opt.PoolSize {
        p.poolSize++
    } else {
        cn.pooled = false
    }
}
p.connsMu.Unlock()
return cn, nil
```

新建的连接会插入到连接池的`conns`队列中，当发现连接池的大小超出了设定的连接大小时，这时候会触发超卖，新建的连接的`pooled`属性被设置为false，也就是说这个连接不会再落地，未来将会被删除。

从连接池中取出的连接一般来说都是要放回到连接池中的，放回的过程如下：

```go
func (p *ConnPool) Put(cn *Conn) {
    if !cn.pooled {
        p.Remove(cn)
        return
    }

    p.connsMu.Lock()
    p.idleConns = append(p.idleConns, cn)
    p.idleConnsLen++
    p.connsMu.Unlock()
    p.freeTurn()
}
```

简单地说就是直接放空闲连接队列中插入这个连接，并把轮转队列的资源释放掉。若连接被标记为不要被池化，则会从连接池中删除这个连接。

删除的过程如下，删除会从连接池的`conns`队列中移除这个连接：

```go
func (p *ConnPool) removeConn(cn *Conn) {
    p.connsMu.Lock()
    for i, c := range p.conns {
        if c == cn {
            p.conns = append(p.conns[:i], p.conns[i+1:]...)
            if cn.pooled {
                p.poolSize--
                p.checkMinIdleConns()
            }
            break
        }
    }
    p.connsMu.Unlock()
}
```

最后再来看下连接池是怎么自动收割长时间不使用的空闲连接的，后台的goroutine会定时执行任务，不断地从空闲连接队列中取出过时连接，做删除和关闭连接操作，并释放轮转资源：

```go
var n int
for {
    p.getTurn()

    p.connsMu.Lock()
    cn := p.reapStaleConn()
    p.connsMu.Unlock()

    if cn != nil {
        p.removeConn(cn)
    }

    p.freeTurn()

    if cn != nil {
        p.closeConn(cn)
        n++
    } else {
        break
    }
}
return n, nil
```

#### **redigo**

`Pool`是redigo中连接池的实现，其数据结构如下：

```go
type Pool struct {
    Dial func() (Conn, error)

    TestOnBorrow func(c Conn, t time.Time) error

    MaxIdle int
    MaxActive int

    IdleTimeout time.Duration

    Wait bool

    MaxConnLifetime time.Duration

    chInitialized uint32

    mu     sync.Mutex
    closed bool
    active int
    ch     chan struct{}
    idle   idleList
}
```

主要字段说明：

-   Dial：新建连接的工厂函数。
-   TestOnBorrow：连接的健康检测函数。
-   MaxIdle：最大空闲连接数。
-   MaxActive：最大活跃连接数。
-   IdleTimeout：空闲连接的超时时间
-   Wait：如果连接池达到了最大的活跃连接数，Wait用以指示是否需要继续等待。
-   active：活跃连接数量。
-   closed：连接池是否关闭。
-   idle：维护空闲连接的集合，`idleList`的实现与链表类似，不多介绍。

可以看出连接池的参数选项和数据都集中在了连接池的结构体中，区别于go-redis中连接池和连接选项分开的情况。

redigo推荐用类似以下的方式来新建一个连接池，而不是使用一个它自带的工厂方法：

```go
func newPool(addr string) *redis.Pool {
   return &redis.Pool{
     MaxIdle: 3,
     IdleTimeout: 240 * time.Second,
     Dial: func () (redis.Conn, error) { return redis.Dial("tcp", addr)},
   }
 }
```

从连接池中获取一个连接的过程如下：

1.检测是否设置了`Wait`和`MaxActive`选项，若是，则对连接池的`ch`属性进行懒加载，`ch`是一个设置了`MaxActive`大小的channel，用以维护活跃连接资源，如果`ch`已经被初始化了则会马上返回。

接下来再尝试从`ch`中获取一个资源，这里会进行一个阻塞获取操作，等待直至有可用资源。

```go
// Handle limit for p.Wait == true.
if p.Wait && p.MaxActive > 0 {
    p.lazyInit()
    if ctx == nil {
        <-p.ch
    } else {
        select {
        case <-p.ch:
        case <-ctx.Done():
            return nil, ctx.Err()
        }
    }
}
```

2.接下来会进行几个动作，首先会遍历空闲连接的链表，逐个检测连接是否过时，如果连接已超过设定的过时时间，则从链表中摘走该连接，并关闭底层连接，把活跃连接数减少一；接着尝试从链表头部中获取一个可用连接，调用测活函数和检查生命周期，如果通过判断则返回该连接，如果不通过则丢弃掉该连接，并把活跃连接数减少一，如果连接池被关闭的话，函数会在这时候返回错误。

```go
p.mu.Lock()

// Prune stale connections at the back of the idle list.
if p.IdleTimeout > 0 {
    n := p.idle.count
    for i := 0; i < n && p.idle.back != nil && p.idle.back.t.Add(p.IdleTimeout).Before(nowFunc()); i++ {
        pc := p.idle.back
        p.idle.popBack()
        p.mu.Unlock()
        pc.c.Close()
        p.mu.Lock()
        p.active--
    }
}

// Get idle connection from the front of idle list.
for p.idle.front != nil {
    pc := p.idle.front
    p.idle.popFront()
    p.mu.Unlock()
    if (p.TestOnBorrow == nil || p.TestOnBorrow(pc.c, pc.t) == nil) &&
        (p.MaxConnLifetime == 0 || nowFunc().Sub(pc.created) < p.MaxConnLifetime) {
        return pc, nil
    }
    pc.c.Close()
    p.mu.Lock()
    p.active--
}

// Check for pool closed before dialing a new connection.
if p.closed {
    p.mu.Unlock()
    return nil, errors.New("redigo: get on closed pool")
}

// Handle limit for p.Wait == false.
if !p.Wait && p.MaxActive > 0 && p.active >= p.MaxActive {
    p.mu.Unlock()
    return nil, ErrPoolExhausted
}

p.active++
p.mu.Unlock()
```

3.如果无法在上一步获取连接，连接池则会新建一个连接返回，如果连接返回失败，则释放掉`ch`中的资源，可以看出这里的`ch`的作用跟go-redis连接池实现中的轮转队列的作用是类似的。

```go
c, err := p.Dial()
if err != nil {
    c = nil
    p.mu.Lock()
    p.active--
    if p.ch != nil && !p.closed {
        p.ch <- struct{}{}
    }
    p.mu.Unlock()
}
return &poolConn{c: c, created: nowFunc()}, err
```

在redigo的连接池的`Get`方法中无论成功或失败，是只返回一个连接结构体作为返回结果的，而在go-redis中的`Get`方法则返回两个结果，一个代表连接，另一个是错误，这里也可以看出它们在接口设计上的区别。

```go
func (p *ConnPool) Get() (*Conn, error) // go-redis
func (p *Pool) Get() Conn // redigo
```

把连接放回到连接池的过程如下：

```go
p.mu.Lock()
if !p.closed && !forceClose {
    pc.t = nowFunc()
    p.idle.pushFront(pc)
    if p.idle.count > p.MaxIdle {
        pc = p.idle.back
        p.idle.popBack()
    } else {
        pc = nil
    }
}

if pc != nil {
    p.mu.Unlock()
    pc.c.Close()
    p.mu.Lock()
    p.active--
}

if p.ch != nil && !p.closed {
    p.ch <- struct{}{}
}
p.mu.Unlock()
return nil
```

当连接池没被关闭时，放回连接池的连接会被重新插入到链表头中，如果链表长度超过最大空闲数量了，则会从链表尾部摘除一个连接。否则连接会被关闭并释放相应资源。

注意这里的`put`方法是不对外暴露的，而是通过对外暴露的`Close`方法的内部进行调用，使用者无须关心把连接放回池中的逻辑，而只需要像使用普通网络连接一样使用就好了：

```go
func serveHome(w http.ResponseWriter, r *http.Request) {
     conn := pool.Get()
     defer conn.Close()
     //...
 }
```

#### radix.v2

`Pool`是radix.v2中的连接池的实现，其数据结构如下：

```go
type Pool struct {
    pool        chan *redis.Client
    reservePool chan *redis.Client
    df          DialFunc

    po opts

    limited chan bool

    initDoneCh chan bool // used for tests
    stopCh     chan bool

    Network, Addr string
}
```

主要字段说明：

-   pool：维护连接的channel。
-   reservePool：连接保留池，若pool的连接满了，额外的连接会放到这里面来，其中的连接会定期尝试回到pool中。
-   df：连接的工厂函数。
-   po：连接选项。
-   limited：连接限制池。

radix.v2的连接池实现对比其他两个来说要比较简洁一些，其新建一个连接池的过程如下：

1.初始化构造参数，新建一个`Pool`实例：

```go
var defaultPoolOpts []Opt
// if pool size is 0 don't do any pinging, cause there'd be no point
if size > 0 {
    defaultPoolOpts = append(defaultPoolOpts, PingInterval(10*time.Second/time.Duration(size)))
}

var po opts
for _, opt := range append(defaultPoolOpts, os...) {
    opt(&po)
}

p := Pool{
    Network:     network,
    Addr:        addr,
    po:          po,
    pool:        make(chan *redis.Client, size),
    reservePool: make(chan *redis.Client, po.overflowSize),
    limited:     make(chan bool, po.createLimitBuffer),
    df:          df,
    initDoneCh:  make(chan bool),
    stopCh:      make(chan bool),
}
```

这里面会构造一些默认参数，例如设置了连接定期发送ping命令的配置，以及对`Pool`实例中的数据结构进行初始化。

2.启动后台任务，分别定时进行连接健康检测，以及定时从保留连接池中清理连接：

```go
if po.pingInterval > 0 {
    doEvery(po.pingInterval, func() {
        // instead of using Cmd/Get, which might make a new connection,
        // we only check from the pool
        select {
        case conn := <-p.pool:
            // we don't care if PING errors since Put will handle that
            conn.Cmd("PING")
            p.Put(conn)
        default:
        }
    })
}

if po.overflowSize > 0 {
    doEvery(po.overflowDrainInterval, func() {
        // remove one from the reservePool, if there is any, and try putting it
        // into the main pool
        select {
        case conn := <-p.reservePool:
            select {
            case p.pool <- conn:
            default:
                // if the main pool is full then just close it
                conn.Close()
            }
        default:
        }
    })
}
```

3.新建一个连接并检测server是否存活，如果存在错误直接返回，否则继续新建`size-1`数量的连接，存放在连接池供使用：

```go
mkConn := func() error {
    client, err := df(network, addr)
    if err == nil {
        p.pool <- client
    }
    return err
}

if size > 0 {
    // make one connection to make sure the redis instance is actually there
    if err := mkConn(); err != nil {
        return &p, err
    }
}

// make the rest of the connections in the background, if any fail it's fine
go func() {
    for i := 0; i < size-1; i++ {
        mkConn()
    }
    close(p.initDoneCh)
}()

return &p, nil
```

从连接池中获取一个连接的过程如下：

```go
select {
case conn := <-p.pool:
    return conn, nil
case conn := <-p.reservePool:
    return conn, nil
case <-p.stopCh:
    return nil, errors.New("pool emptied")
default:
    var timeoutCh <-chan time.Time
    if p.po.getTimeout > 0 {
        timer := time.NewTimer(p.po.getTimeout)
        defer timer.Stop()
        timeoutCh = timer.C
    }

    select {
    case conn := <-p.pool:
        return conn, nil
    case conn := <-p.reservePool:
        return conn, nil
    case <-timeoutCh:
        return nil, ErrGetTimeout
    case <-p.limited:
        return p.df(p.Network, p.Addr)
    }
}
```

连接池首先尝试从`pool`中获取一个连接，其次会尝试从`reservePool`中获取一个连接，如果都无法获取到连接，则会等待一段时间获取连接，直至超时或返回。

把连接放回到连接池的过程如下：

```go
select {
case <-p.stopCh:
    conn.Close()
    return
default:
}

select {
case p.pool <- conn:
default:
    if p.po.overflowSize == 0 {
        conn.Close()
        return
    }

    // we need a separate select here since it's indeterminate which case go
    // will select and we want to always prefer the main pool over the reserve
    select {
    case p.reservePool <- conn:
    default:
        conn.Close()
    }
}
```

同样地，连接会首先尝试放回到`pool`中，如果失败则会尝试放到`reservePool`中，当还是出现失败则直接丢弃并关闭连接。

#### 总结

用不同方式实现的连接池都有各自的特点，比如用channel实现的话代码会更加简单和清晰，用slice或linkedlist实现的话则整体性能会更高一些，但良好的连接池共同的特点是：提供对用户友好的接口，安全可靠，以及能保证在并发环境下的正确性。

<BR/>

### 实现自己的连接池

经过上面对几种常见的连接池实现方式的比较，接下来我们使用channel实现一个我们自定义的连接池；

首先，根据上面的分析，我们希望我们的连接池具备一下特性：

-   通用协程池：适合任意需要协程池的场景；
-   自动关闭空闲连接：可设置连接的最大空闲时间，超时的连接将关闭丢弃，避免空闲时连接自动失效问题；
-   请求连接超时：用户可自行设定请求连接超时时间；
-   连接健康检查：支持用户设定 ping 方法，检查连接的连通性，无效的连接将丢弃；

#### 定义Pool接口

Pool接口的定义如下：

```go
package channel_pool

// The pool interface
type Pool interface {
	// Get returns a new connection from the pool. Closing the connections puts
	// it back to the Pool. Closing it when the pool is destroyed or full will
	// be counted as an error.
	Get() (interface{}, error)

	// Put puts the connection into the pool instead of closing it.
	Put(interface{}) error

	// CloseConn directly close the connection
	CloseConn(interface{}) error

	// ShutDown closes the pool and all its connections.
	// After ShutDown() the pool is no longer usable.
	ShutDown() error

	// Len returns the current number of connections of the pool.
	Len() int
}
```

包括了一个线程池都应该具备的一些基本方法，例如：获取连接Get、放回资源Put、关闭协程池ShutDown等；

下面我们看看对于线程池中的单个连接资源的定义；

****

#### 定义连接

对于连接池中单个连接的定义在generalConn中：

```go
// generalConn is a wrapper around the connection
type generalConn struct {
	conn     interface{}
	t        time.Time
	unusable bool
}
```

generalConn相当于一般连接conn的一个包装类，其内部封装了实际连接资源conn、创建时间t用于判断是否超时/闲置连接、unusable作为不可用(待回收标记，目前实现中尚未使用)；

接下来看看连接池是如何定义的；

****

#### 定义连接池

连接池的定义如下：

```go
// the pool
type channelPool struct {
	mu           sync.RWMutex
	conns        chan *generalConn
	factory      func() (interface{}, error)
	close        func(interface{}) error
	ping         func(interface{}) error
	idleTimeout  time.Duration
	waitTimeOut  time.Duration
	maxActive    int
	openingConns int
	connReqs     []chan *generalConn
}
```

其中：

-   mu：取用连接池资源时的读写锁；
-   conns：在调用Get方法后向用户返回具体连接的chan；
-   factory：用户提供的创建连接的具体工厂方法，初始化连接池时必须指定；
-   close：用户提供的具体关闭连接的方法，默认为nil；
-   ping：用户提供的具体进行连接健康检测的方法，默认为nil；
-   idleTimeout：协程的最大闲置时长(懒删除)，设置为小于等于0时不删除；
-   waitTimeout：使用Get方法获取协程连接的最大等待时长(当协程池资源被完全使用时，使用Get获取连接会导致当前协程被阻塞！)，超过该时间会导致WaitConnectionTimeoutErr错误；
-   maxActive：池中最多可存在的连接数，当所有的协程连接资源都被占用时，再次获取将会被等待至多WaitTimeout时长，然后报WaitConnectionTimeoutErr错误；
-   openingConns：目前存在的连接数；
-   connReqs：用户调用Get请求获取的连接资源chan；
    -   当线程池中资源已经全部被占用(使用中的资源打到MaxCap)，此时请求会被丢入此chan数组中等待分配(直到获取超时)；
    -   当用户调用Put方法释放资源时、释放的是connReqs的资源；

接下来看看连接池中各个方法是如何实现的；

****

#### 具体实现

##### **① 创建连接池 - NewChannelPool**

创建连接池使用的是Golang经典的创建资源的方法：通过传入一个配置类进行资源的创建；

这里使用到的类是：

```go
// Configs for pool
type Options struct {
	// The number of the connections when initiate the pool
	// Also, the least connection number of the pool
	InitialCap int

	// Max connection number in the pool
	MaxCap int

	// Max idle number in the pool
	MaxIdle int

	// The method the build the connection
	Factory func() (interface{}, error)

	// The method to close the connection
	Close func(interface{}) error

	// Check connection health
	Ping func(interface{}) error

	// Max life time for idle connection
	IdleTimeout time.Duration

	// Max time to get a connection from pool
	// Else this will return a errs.MaxActiveConnectionErr
	WaitTimeout time.Duration
}
```

初始化时需要传入协程池的相关参数；

各个参数说明如下：

-   InitialCap：初始化连接数；
-   MaxCap：池中最多可存在的连接数，当所有的协程连接资源都被占用时，再次获取将会被等待至多WaitTimeout时长，然后报WaitConnectionTimeoutErr错误；
-   MaxIdle：最多可闲置的协程数；
-   Factory：创建连接时使用的工厂方法；
-   Ping：健康检查时使用的Ping方法；
-   Close：关闭连接使用的方法；
-   IdleTimeout：协程的最大闲置时长(懒删除)，设置为小于等于0时不删除；
-   WaitTimeout：使用Get方法获取协程连接的最大等待时长(当协程池资源被完全使用时，使用Get获取连接会导致当前协程被阻塞！)，超过该时间会导致WaitConnectionTimeoutErr错误；

此后调用NewChannelPool方法，创建一个generalPool实例：

在NewChannelPool中进行了：参数校验、参数装配、然后创建了InitialCap个连接；

##### **② 获取连接 - Get**

连接的获取、空置超时、健康检测都是在Get方法中以Lazy方式实现的：

在获取连接时，首先会判断是否达到了MaxCap：

-   如果存在可以使用的连接(在Put释放时阻塞)，则会判断是否空置超时、健康检查，并最终返回；
-   如果不存在，则：
    -   数量未达到maxActive，则创建新的连接，并返回；
    -   数量达到maxActive，则阻塞(由`<-req`实现)；当阻塞超过时间规定时刻，则会抛出NewWaitConnectionTimeoutErr错误，并清除当前chan；

##### **③ 释放连接 - Put**

连接的释放取决于连接的请求状况：

-   如果当前存在连接请求，则待释放的资源会直接通过req传递至Get方法；
-   如果当前不存在连接请求：则会释放该资源；

##### **④ 关闭连接池 - ShutDown**

使用ShutDown关闭连接池会将协程池的所有配置置空(防止内存泄漏、并便于垃圾回收)，同时尝试调用协程池中配置的close方法关闭各个协程；

><BR/>
>
>与Java中的线程池尽最大可能保证线程安全执行不同，这里由close方法来保证各个连接资源的关闭；
>
>这是考虑到，不同类型连接处理close的逻辑各异，同时，不少第三方连接已经提供了较为合理的关闭方式，所以就不重复造轮子了！
>
>但是还是要提醒一句：
>
><font color="#f00">**如果close处理不当，如：单个协程出现死循环无法退出，是一定会造成内存泄漏的！这里的ShutDown仅仅是尝试关闭连接，并不保证强制关闭(有需要的可以使用context改进本协程池)**</font>

****

#### 定义错误类型

自定义了几个错误：

-   ClosedErr：协程池已经关闭(调用ShutDown方法)/初始化失败时，使用协程池资源时报错；
-   MaxActiveConnectionErr：达到最大的连接数，并创建连接失败时报错；
-   WaitConnectionTimeoutErr：达到最大的连接数，并达到最大等待时间WaitTimeout时报错；

其内部的NewXXXErr方法用于创建一个错误，并且可以通过IsXXXErr来判断是否发生了该错误；

****

#### 使用方式

通过下面的方式引入仓库即可：

```bash
go get -u github.com/jasonkayzk/pool/channel_pool
```

##### **① 创建协程池**

使用`NewChannelPool`创建一个协程池：

```go
func newChannelPool() (Pool, error) {
	ops := Options{
		InitialCap:  InitialCap,
		MaxCap:      MaximumCap,
		MaxIdle:     MaxIdleCap,
		Factory:     factory,
		Ping:        pingFunc,
		Close:       closeFunc,
		IdleTimeout: IdleTimeout,
		WaitTimeout: WaitTimeout,
	}
	return NewChannelPool(&ops)
}
```

##### **② 使用连接**

通过Get方法从协程池中取出连接，并通过类型转换，将interface{}转换为对应的连接类型；

然后使用连接处理逻辑，最后通过Put方法释放连接；

```go
func xxx() {
    conn, _ := p.Get()
    cli := conn.(*rpc.Client)
    defer p.Put(conn)
	
    // 使用cli连接处理逻辑
    ...
}
```

##### **③ 获取池中可用连接数**

通过Len方法，可以获取到线程池中可用的连接数；

例如：

```go
func TestPool_Get(t *testing.T) {
	p, err := newChannelPool()
	if err != nil {
		t.Errorf("create pool error: %s", err)
	}
	defer p.ShutDown()

	_, err = p.Get()
	if err != nil {
		t.Errorf("Get error: %s", err)
	}

	// after one get, current capacity should be lowered by one.
	if p.Len() != (InitialCap - 1) {
		t.Errorf("Get error. Expecting %d, got %d", InitialCap-1, p.Len())
	}
}
```

<BR/>

#### 性能测试

为了进行协程池的性能测试，首先我们建立一个rpc服务：

```go
type Number int

type Args struct {
	A, B int
}

func rpcServer() {
	number := new(Number)
	_ = rpc.Register(number)
	rpc.HandleHTTP()

	l, e := net.Listen("tcp", address)
	if e != nil {
		panic(e)
	}
	go http.Serve(l, nil)
}

func (n *Number) Multiply(args *Args, reply *int) error {
	*reply = args.A * args.B
	return nil
}

```

这个rpc服务注册了Number中的服务，好让我们可以远程调用其Multiply方法，返回两个数的乘积；

接下来我们分别通过协程池和非协程池(每次调用创建一个连接)进行rpc调用，并调用5000次，比较时间：

```
poolMethod elapsed:  1.6118875s
simpleMethod elapsed:  9.0750414s
```

>   具体测试代码见example目录；

经过测试，这个协程池的性能还是不错的，速度的确提升了很多；

<br/>

### 后记

本协程池的实现参考了Github中star数较多的协程池，并根据自己的需求做了一定的修改：

-   [fatih/pool](https://github.com/fatih/pool)
-   [silenceper/pool](https://github.com/silenceper/pool)

当然，相比于Java中线程池的实现是小巫见大巫了；

如果对Java中线程池实现感兴趣，并且想尝试自己写一个类似于Java这种大而全的协程池的，可以先看一下我之前写的JDK11中的线程池的源码解析；

系列文章入口：

-   [Java线程池ThreadPoolExecutor分析与实战](https://jasonkayzk.github.io/2020/02/06/Java线程池ThreadPoolExecutor分析与实战/)
-   [Java线程池ThreadPoolExecutor分析与实战续](https://jasonkayzk.github.io/2020/03/04/Java线程池ThreadPoolExecutor分析与实战续/)
-   [Java线程池ThreadPoolExecutor分析与实战终](https://jasonkayzk.github.io/2020/03/05/Java线程池ThreadPoolExecutor分析与实战终/)

<br/>

## 附录

参考文章：

-   [实现连接池的几种姿势](https://zhuanlan.zhihu.com/p/47480504)

源代码：

- https://github.com/JasonkayZK/pool

<br/>

