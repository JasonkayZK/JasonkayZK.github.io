---
title: mini-redis项目-2-存储层
toc: true
cover: 'https://img.paulzzh.com/touhou/random?2'
date: 2022-12-05 19:58:43
categories: Rust
tags: [Rust, Database, Redis]
description: 本篇接上一篇《mini-redis项目-1-简介》，讲解mini-redis存储层的实现；
---

本篇接上一篇[《mini-redis项目-1-简介》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-1-简介/)，讲解mini-redis存储层的实现；

源代码：

-   https://github.com/JasonkayZK/mini-redis

系列文章：

-   [《mini-redis项目-1-简介》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-1-简介/)
-   [《mini-redis项目-2-存储层》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-2-存储层/)
-   [《mini-redis项目-3-连接层》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-3-连接层/)
-   [《mini-redis项目-4-服务端》](https://jasonkayzk.github.io/2022/12/06/mini-redis项目-4-服务端/)
-   [《mini-redis项目-5-客户端》](https://jasonkayzk.github.io/2022/12/07/mini-redis项目-5-客户端/)
-   [《mini-redis项目-6-测试与示例》](https://jasonkayzk.github.io/2022/12/07/mini-redis项目-6-测试与示例/)

<br/>

<!--more-->

# **mini-redis项目-2-存储层**

在 mini-redis 中为了简单起见，数据是直接通过 HashMap 中存储了；

对于实际生产环境中使用的数据库来说，通常会使用：

-   **跳表：内存数据库数据结构实现，增加并发度；**
-   **LSM-Tree：日志数据库数据结构实现，便于通过Append落盘日志；**

<br/>

## **数据接口定义：KvStore Trait**

数据操作接口被定义在 traits.rs 文件的 KvStore Trait 中；

src/storage/traits.rs

```rust
pub trait KvStore {
    fn get(&self, key: &str) -> Option<Bytes>;

    /// Set the value associated with a key along with an optional expiration
    /// Duration.
    ///
    /// If a value is already associated with the key, it is removed.
    fn set(&self, key: String, value: Bytes, expire: Option<Duration>);

    /// Returns a `Receiver` for the requested channel.
    ///
    /// The returned `Receiver` is used to receive values broadcast by `PUBLISH`
    /// commands.
    fn subscribe(&self, key: String) -> broadcast::Receiver<Bytes>;

    /// Publish a message to the channel. Returns the number of subscribers
    /// listening on the channel.
    fn publish(&self, key: &str, value: Bytes) -> usize;
}
```

主要是 get、set、pub、sub 四个接口，非常的简单；

其中 set 可以设置键的过期时间；

<br/>

## **数据存储：Store**

Store 结构体中存放实际的数据，定义如下：

src/storage/store.rs

```rust
#[derive(Debug)]
pub(crate) struct Store {
    pub(crate) entries: HashMap<String, Entry>,

    pub(crate) pub_sub: HashMap<String, broadcast::Sender<Bytes>>,

    pub(crate) expirations: BTreeMap<(Instant, u64), String>,

    pub(crate) next_id: u64,

    pub(crate) shutdown: bool,
}

#[derive(Debug)]
pub(crate) struct Entry {
    pub(crate) id: u64,

    pub(crate) data: Bytes,

    pub(crate) expires_at: Option<Instant>,
}

impl Store {
    pub(crate) fn new() -> Store {
        Store {
            entries: HashMap::new(),
            pub_sub: HashMap::new(),
            expirations: BTreeMap::new(),
            next_id: 0,
            shutdown: false,
        }
    }

    pub(crate) fn next_expiration(&self) -> Option<Instant> {
        self.expirations.keys().next().map(|expire| expire.0)
    }
}
```

Store 的逻辑也非常简单：

-   首先，定义了 Entry 存放实际的 value 数据，因为存在过期键，所以声明了 id、expires_at；
-   在 Store 中定义了：
    -   entries：存放 k-v 数据；
    -   pub_sub：存放 pub-sub 数据；
    -   expirations：类似于优先队列，便于快速扫描过期键并移除；
    -   next_id：为过期键分配的 id，避免找不到对应键；
    -   shutdown：数据库是否已经关闭，如果数据库关闭，则此时不再接受请求，但需要释放连接等资源；
-   最后为 Store 生成了 new 和 next_expiration 方法；

>   **这里的 Store 层用了 `pub(crate)` 即整个 crate 可见，是一个简化操作；**
>
>   **个人感觉应当将 Store 进行封装，这样如果实际上底层的存储结构变化，对于上次的操作是无感知的！**

<br/>

## **数据操作：Db**

### **Db结构体**

Db 封装了上面的 Store，并实现了 KvStore Trait，对外提供了一组数据操作接口，下面来看具体实现；

Db实现：

src/storage/db.rs

```rust
#[derive(Debug, Clone)]
pub(crate) struct Db {
    shared: Arc<SharedDb>,
}

impl Db {
    pub(crate) fn new() -> Db {
        let shared = Arc::new(SharedDb::new());

        tokio::spawn(Db::purge_expired_tasks(shared.clone()));

        Db { shared }
    }

    async fn purge_expired_tasks(shared: Arc<SharedDb>) {
        while !shared.is_shutdown() {
            if let Some(when) = shared.purge_expired_keys() {
                tokio::select! {
                    _ = time::sleep_until(when) => {}
                    _ = shared.background_task.notified() => {}
                }
            } else {
                shared.background_task.notified().await;
            }
        }

        info!("Purge background task shut down")
    }

    fn shutdown_purge_task(&self) {
        let mut store = self.shared.store.lock().unwrap();
        store.shutdown = true;

        drop(store);
        self.shared.background_task.notify_one();
    }
}
```

由于可能会存在多个异步任务同时获取数据库的场景（例如：键过期、Channel订阅都会用到数据库）；

因此需要将 Store 进行封装至 Arc 中，同时封装了 SharedDb（下文会讲）；

**Db 中定义了 new 方法，用于初始化数据库，并且启动 `purge_expired_tasks` 任务；**

当服务器未关闭时：

-   **如果存在过期键：**
    -   **`purge_expired_tasks` 会调用 `shared.purge_expired_keys` 清除最近的过期的键，并获取下一个最新过期的键的时间并等待；**
    -   **除非 `shared.background_task` 再次通知了当前异步任务，此时大概率是加入了更早的过期键，需要重新调用 `shared.purge_expired_keys` 获取最新的最近的过期时间；**
-   **如果不存在过期键，则直接等待即可：`shared.background_task.notified().await`；**

这样，就完成了过期键的处理！

同时，**Db 定义了 `shutdown_purge_task` 方法，提供给 DbDropGuard，用于在服务器停止后清理资源以及其他任务：**

-   这里 `drop(store)` 就显式释放了数据库资源，但是这个方法不能由在 Drop Db 的时候调用，因为还需要停止其他异步任务；
-   同时，也会**调用 `self.shared.background_task.notify_one()` 通知异步过期键任务，此时由于 shutdown 变为了 true，异步任务会直接退出！**

<br/>

### **SharedDb封装**

前面提到了可能会存在多个异步任务同时获取数据库，因此将 Db 封装至了SharedDb 中：

src/storage/db.rs

```rust
#[derive(Debug)]
struct SharedDb {
    store: Mutex<Store>,

    background_task: Notify,
}

impl SharedDb {
    fn new() -> Self {
        SharedDb {
            store: Mutex::new(Store::new()),
            background_task: Notify::new(),
        }
    }

    fn purge_expired_keys(&self) -> Option<Instant> {
        let mut store = self.store.lock().unwrap();

        if store.shutdown {
            return None;
        }

        let store = &mut *store;

        let now = Instant::now();
        while let Some((&(when, id), key)) = store.expirations.iter().next() {
            if when > now {
                return Some(when);
            }

            store.entries.remove(key);
            store.expirations.remove(&(when, id));
        }

        None
    }

    fn is_shutdown(&self) -> bool {
        self.store.lock().unwrap().shutdown
    }
}
```

SharedDb 中的内容非常简单：

-   **`store: Mutex<Store>`：互斥锁保护底层数据不会并发访问；**
-   **`background_task: Notify`：和前面提到的异步任务交互；**

同时定义了几个方法，new、is_shutdown 很简单不说了；

和上文对应，`purge_expired_keys` 方法由 Db 中的异步任务调用，在服务器没有关闭时，通过 `while let Some((&(when, id), key)) = store.expirations.iter().next()` 按照过期时间获取过期键：

-   如果过期了，则从 entries、expirations 中将键删除；
-   如果没过期，则当前为下一个过期的键，返回；
-   如果不存在过期键，返回 None；

<br/>

### **Db实现 KvStore Trait**

下面是 Db 实现的 KvStore Trait：


src/storage/db.rs

```rust
impl KvStore for Db {

    fn get(&self, key: &str) -> Option<Bytes> {
        let store = self.shared.store.lock().unwrap();
        store.entries.get(key).map(|entry| entry.data.clone())
    }

    fn set(&self, key: String, value: Bytes, expire: Option<Duration>) {
        let mut store = self.shared.store.lock().unwrap();

        let id = store.next_id;
        store.next_id += 1;

        let mut notify = false;

        let expires_at = expire.map(|duration| {
            let when = Instant::now() + duration;

            notify = store
                .next_expiration()
                .map(|expiration| expiration > when)
                .unwrap_or(true);

            store.expirations.insert((when, id), key.clone());
            when
        });

        let prev = store.entries.insert(
            key,
            Entry {
                id,
                data: value,
                expires_at,
            },
        );

        if let Some(prev) = prev {
            if let Some(when) = prev.expires_at {
                // clear expiration
                store.expirations.remove(&(when, prev.id));
            }
        }

        drop(store);

        if notify {
            self.shared.background_task.notify_one();
        }
    }

    fn subscribe(&self, key: String) -> broadcast::Receiver<Bytes> {
        use std::collections::hash_map::Entry;

        let mut store = self.shared.store.lock().unwrap();

        match store.pub_sub.entry(key) {
            Entry::Occupied(e) => e.get().subscribe(),
            Entry::Vacant(e) => {
                let (tx, rx) = broadcast::channel(1024);
                e.insert(tx);
                rx
            }
        }
    }

    fn publish(&self, key: &str, value: Bytes) -> usize {
        debug!("publish: (key={}, len(value)={})", key, value.len());

        let state = self.shared.store.lock().unwrap();

        state
            .pub_sub
            .get(key)
            .map(|tx| tx.send(value).unwrap_or(0))
            .unwrap_or(0)
    }
}
```

下面分别来看；

<br/>

#### **Get方法**

Get 方法比较简单：

```rust
fn get(&self, key: &str) -> Option<Bytes> {
  // Acquire the lock, get the entry and clone the value.
  //
  // Because data is stored using `Bytes`, a clone here is a shallow
  // clone. Data is not copied.
  let store = self.shared.store.lock().unwrap();
  store.entries.get(key).map(|entry| entry.data.clone())
}
```

首先获取存储的锁，然后通过 store 中的 HashMap entries 直接获取键值即可；

<font color="#f00">**这里注意：我们使用的是 `bytes::Bytes`，因此这里 clone 的实际上是一个胖指针，而非将整个数据copy了一份！**</font>

<br/>

#### **Set方法**

Set方法如下：

```rust
fn set(&self, key: String, value: Bytes, expire: Option<Duration>) {
  let mut store = self.shared.store.lock().unwrap();

  let id = store.next_id;
  store.next_id += 1;

  let mut notify = false;

  let expires_at = expire.map(|duration| {
    let when = Instant::now() + duration;

    notify = store
    .next_expiration()
    .map(|expiration| expiration > when)
    .unwrap_or(true);

    store.expirations.insert((when, id), key.clone());
    when
  });

  let prev = store.entries.insert(
    key,
    Entry {
      id,
      data: value,
      expires_at,
    },
  );

  if let Some(prev) = prev {
    if let Some(when) = prev.expires_at {
      store.expirations.remove(&(when, prev.id));
    }
  }

  drop(store);

  if notify {
    self.shared.background_task.notify_one();
  }
}
```

我们为当前 set 的 key：

-   分配了 next_id；
-   并定义了 notify：当 set 的 key 的过期时间小于当前过期时间最短的 key 的过期时间时，会发送过期异步任务通知，唤醒前面 Db 中的 `purge_expired_keys` 方法，重新刷新过期任务！

随后，将键加入 store.entries 中，如果是过期键还会加入 store.expirations 中；

然后，需要判断如果 set 的 key 之前在数据库中存在了，则需要将前一个过期任务删除；

最后，显式 drop 掉我们获取的 store 的锁，这样最后通知刷新过期键异步任务后，这个异步任务不用再等待这个函数释放锁了～

<br/>

#### **Subscribe方法**

subscribe方法如下：

```rust
fn subscribe(&self, key: String) -> broadcast::Receiver<Bytes> {
  use std::collections::hash_map::Entry;

  let mut store = self.shared.store.lock().unwrap();

  match store.pub_sub.entry(key) {
    Entry::Occupied(e) => e.get().subscribe(),
    Entry::Vacant(e) => {
      let (tx, rx) = broadcast::channel(1024);
      e.insert(tx);
      rx
    }
  }
}
```

subscribe 方法的逻辑也非常简单：

-   如果当前在 store.pub_sub 中的 key 对应的 channel 已经被 `subscribe` 了，则直接返回一个新的 Receiver 即可；
-   如果还没有任何一个 client `subscribe` 则创建一个新的channel，并将 Receiver 加入 store.pub_sub 存储后返回Receiver即可；

<br/>

#### **Publish方法**

有了 Receiver，则 publish 方法的实现更加简单：

```rust
fn publish(&self, key: &str, value: Bytes) -> usize {
  let state = self.shared.store.lock().unwrap();

  state
  .pub_sub
  .get(key)
  .map(|tx| tx.send(value).unwrap_or(0))
  .unwrap_or(0)
}
```

直接获取 `state.pub_sub` 中 key 对应的 channel 并调用 send 方法即可；

**需要注意的是：如果不存在这个 key，或者发生失败，则返回 0 大小的消息，表示未发送成功；**

<br/>

## **数据回收：DbDropGuard**

最后就是 DbDropGuard 的实现了，DbDropGuard 实际上是 Db 的一个封装；

当通过 DbDropGuard 获取 Db 时，实际上是一个 Db 的 clone，而 Db 内部是一个 Arc 计数智能指针；

**因此，当所有使用 Db 都被回收，仍然需要 DbDropGuard 被 drop 后才会对数据库进行回收（DbDropGuard 中持有第一个 Db）：**

src/storage/db.rs

```rust
/// A wrapper around a `Db` instance. This exists to allow orderly cleanup
/// of the `Db` by signalling the background purge task to shut down when
/// this struct is dropped.
#[derive(Debug)]
pub(crate) struct DbDropGuard {
    /// The `Db` instance that will be shut down when this `DbHolder` struct
    /// is dropped.
    db: Db,
}

impl DbDropGuard {
    /// Create a new `DbHolder`, wrapping a `Db` instance. When this is dropped
    /// the `Db`'s purge task will be shut down.
    pub(crate) fn new() -> DbDropGuard {
        DbDropGuard { db: Db::new() }
    }

    /// Get the shared database. Internally, this is an `Arc`,
    /// so a clone only increments the ref count.
    pub(crate) fn db(&self) -> Db {
        self.db.clone()
    }
}

impl Drop for DbDropGuard {
    fn drop(&mut self) {
        // Signal the 'Db' instance to shut down the task that purges expired keys
        self.db.shutdown_purge_task();
    }
}
```

同时，为 DbDropGuard 实现了 Drop Trait，当 DbDropGuard 被回收后，会调用前文中提到的 db 中的 `shutdown_purge_task` 方法进行资源回收；

<br/>

## **小结**

本小节完成了对 mini-redis 存储层的实现，对外封装了 DbDropGuard；

在使用时只需创建 DbDropGuard 对象，然后通过其内部封装的智能指针 Db 操作底层的 Store 即可！

实际上，真实的存储结构远远要比这里的 HashMap 要复杂，但是本文也能起到一定抛砖引玉的作用！

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/mini-redis

系列文章：

-   [《mini-redis项目-1-简介》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-1-简介/)
-   [《mini-redis项目-2-存储层》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-2-存储层/)
-   [《mini-redis项目-3-连接层》](https://jasonkayzk.github.io/2022/12/05/mini-redis项目-3-连接层/)
-   [《mini-redis项目-4-服务端》](https://jasonkayzk.github.io/2022/12/06/mini-redis项目-4-服务端/)
-   [《mini-redis项目-5-客户端》](https://jasonkayzk.github.io/2022/12/07/mini-redis项目-5-客户端/)
-   [《mini-redis项目-6-测试与示例》](https://jasonkayzk.github.io/2022/12/07/mini-redis项目-6-测试与示例/)

<br/>
