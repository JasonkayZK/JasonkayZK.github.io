---
title: LevelDB使用示例
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?33'
date: 2022-12-09 11:57:24
categories: 数据库
tags: [数据库, LevelDB, C++]
description: LevelDB 是一个持久化的 k/v 数据库，Chrome浏览器中涉及的 IndexedDB，就是基于 LevelDB 构建而成的，本文讲解了如何简单的使用 LevelDB，后面也会继续写系列文章对LevelDB的源码进行分析；
---

[LevelDB](https://github.com/google/leveldb) 是一个持久化的 k/v 数据库，Chrome浏览器中涉及的 IndexedDB，就是基于 LevelDB 构建而成的；

本文讲解了如何简单的使用 LevelDb，后面也会继续写系列文章对LevelDB的源码进行分析；

源代码：

-   https://github.com/JasonkayZK/leveldb

<br/>

<!--more-->

# **LevelDB使用示例**

## **前言**

关于 LevelDB 的介绍网上有很多了，下面是它的一些特性：

-   **嵌入式数据库，没有 Server 的概念而是采用库的方式引入；**
-   keys 和 values 是任意的字节数组；
-   数据按 key 值排序存储；
-   调用者可以提供一个自定义的比较函数来重写排序顺序；
-   提供基本的 `Put(key,value)`，`Get(key)`，`Delete(key)` 操作；
-   多个更改可以在一个原子批处理中生效；
-   用户可以创建一个快照（snapshot），以获得数据的一致性视图；
-   在数据上支持向前和向后迭代；
-   使用 Snappy 压缩库对数据进行自动压缩；
-   与外部交互的操作都被抽象成了接口(如文件系统操作等)，因此用户可以根据接口自定义操作系统交互；

上面是从官方文档中翻译的特性，下面是它的一些不足：

-   不是一个 SQL 数据库，它没有关系数据模型，不支持 SQL 查询，也不支持索引；
-   同时只能有一个进程(可能是具有多线程的进程)访问一个特定的数据库；
-   没有内置的 client-server 支持，有需要的必须自己封装；

<br/>

## **编译LevelDb**

LevelDB 的编译也非常简单（首先要有 C++ 开发环境，例如：gcc、cmake等等）；

首先，clone 包含子模块的项目（你也可以 fork 一个自己的repo）：

```bash
git clone --recurse-submodules https://github.com/google/leveldb.git
```

随后，编译：

```bash
mkdir -p build && cd build
cmake -DCMAKE_BUILD_TYPE=Release .. && cmake --build .
```

>   **这里可能会提示 benchmark 库中有个变量未使用：**
>
>   ```
>   [ 71%] Building CXX object third_party/benchmark/src/CMakeFiles/benchmark.dir/complexity.cc.o
>   third_party/benchmark/src/complexity.cc:85:10: error: variable 'sigma_gn' set but not used [-Werror,-Wunused-but-set-variable]
>     double sigma_gn = 0.0;
>            ^
>   1 error generated.
>   make[2]: *** [third_party/benchmark/src/CMakeFiles/benchmark.dir/complexity.cc.o] Error 1
>   make[1]: *** [third_party/benchmark/src/CMakeFiles/benchmark.dir/all] Error 2
>   make: *** [all] Error 2
>   ```
>
>   此时修改 `third_party/benchmark/src/complexity.cc` 文件，将变量注释掉即可：
>
>   ```diff
>   LeastSq MinimalLeastSq(const std::vector<int64_t>& n,
>                          const std::vector<double>& time,
>                          BigOFunc* fitting_curve) {
>   -  double sigma_gn = 0.0;
>   + //  double sigma_gn = 0.0;
>     double sigma_gn_squared = 0.0;
>     double sigma_time = 0.0;
>     double sigma_time_gn = 0.0;
>   
>     // Calculate least square fitting parameter
>     for (size_t i = 0; i < n.size(); ++i) {
>       double gn_i = fitting_curve(n[i]);
>   -     sigma_gn += gn_i;
>   + //    sigma_gn += gn_i;
>       sigma_gn_squared += gn_i * gn_i;
>       sigma_time += time[i];
>       sigma_time_gn += time[i] * gn_i;
>   }
>   ```
>
>   见我提的这个 issue：
>
>   -   https://github.com/google/leveldb/issues/1074
>

编译完成后可以看到静态链接库 `libleveldb.a` 以及一些测试用执行文件：

```bash
$ tree -L 2
.
├── c_test
├── db_bench
├── db_bench_sqlite3
├── env_posix_test
├── leveldb_tests
├── leveldbutil
├── libleveldb.a
...
```

<br/>

## **LevelDB头文件简介**

**LevelDB 对外暴露的接口都在 `include/*.h` 中**，库使用者不应该依赖任何其它目录下的头文件（这些内部 API 可能会在没有警告的情况下被改变）；

-   `include/leveldb/db.h`：主要的 DB 接口，入口文件；
-   `include/leveldb/options.h`： 控制数据库的行为，也控制读和写的行为；
-   `include/leveldb/comparator.h`： 抽象的比较函数。如果只想对 key 逐字节比较，可以直接使用默认的比较器，如果想要自定义排序（例如处理不同的字符编码、解码等），可以实现自己的比较器；
-   `include/leveldb/iterator.h`：迭代数据的接口，你可以从一个 DB 对象获取到一个迭代器；
-   `include/leveldb/write_batch.h`：原子地将多个操作应用到数据库；
-   `include/leveldb/slice.h`：类似 string，维护着指向字节数组的指针和对应的长度；
-   `include/leveldb/status.h`：许多公共接口都会返回 `Status`，用于报告成功或各种错误；
-   `include/leveldb/env.h`：操作系统环境的抽象，该接口的 posix 实现位于 `util/env_posix.cc` 中；
-   `include/leveldb/table.h, include/leveldb/table_builder.h`：存储底层模块，用于 Build immutable 和 sorted map，库使用者一般不会用到；

更多关于各个头文件包含的内容见各个头文件顶部的注释；

<br/>

## **LevelDB使用方法**

作为嵌入式类型的数据库，LevelDB 并没有提供 server，我们可以通过下面几种方式来使用：

-   **clone 源码，并引入至其他 CMake 工程中：**由于 LevelDB 的代码是开源的，我们可以直接将源代码 clone 到本地，然后通过 CMake 引入即可使用；
-   **编译为静态库：**上面使用CMake工程引入的方式只适合其他C++项目，我们在之前将 LevelDB 的源码编译为了静态链接库 `libleveldb.a`，因此可以在编译时直接链接这个静态库，这样其他语言也可以使用；

在本文中，为了简单起见，我们直接在 LevelDB 源码中创建使用的示例，并使用其内部的 gtest 测试；

首先，创建 `examples` 目录，并创建 `main.cc` 文件作为编译我们自己用例的二进制文件，内容如下：

examples/main.cc

```c++
#include <cassert>
#include <iostream>

#include "leveldb/db.h"

#include "gtest/gtest.h"

TEST(Usage, InitDb) {
  leveldb::DB* db;
  leveldb::Options options;
  options.create_if_missing = true;
  leveldb::Status status = leveldb::DB::Open(options, "/tmp/test_db", &db);

  std::cout << "db started, status: " << status.ToString() << std::endl;
  assert(status.ok());
  delete db;
}

int main(int argc, char** argv) {
  printf("Running main() from %s\n", __FILE__);
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
```

随后，在 `CMakeLists.txt` 配置中加入我们的测试文件：

```diff
leveldb_test("db/c_test.c")
+ leveldb_test("examples/main.cc")
```

即可编译出我们的测试文件（Clion 导入项目后甚至可以直接编译出 debug 版本的二进制）；

执行后输出如下：

```bash
Running main() from leveldb/examples/main.cc
[==========] Running 1 test from 1 test suite.
[----------] Global test environment set-up.
[----------] 1 test from Usage
[ RUN      ] Usage.InitDb
db started, status: OK
[       OK ] Usage.InitDb (71 ms)
[----------] 1 test from Usage (71 ms total)

[----------] Global test environment tear-down
[==========] 1 test from 1 test suite ran. (71 ms total)
[  PASSED  ] 1 test.
```

测试OK，下面我们来看具体 LevelDB 的功能；

<br/>

## **LevelDB功能**

### **开启/关闭数据库**

在 LevelDB 中，每个数据库都有一个名字，该名字直接对应文件系统上的一个目录，该数据库中的内容全都存在该目录下；

下面的例子展示了如何打开一个数据库，如果不存在则创建数据库：

```c++
const std::string db_name = "/tmp/test_db";

TEST(LevelDBDemo, OpenDB) {
  leveldb::DB* db;
  leveldb::Options options;
  options.create_if_missing = true;
  //  options.error_if_exists = true;
  leveldb::Status status = leveldb::DB::Open(options, db_name, &db);

  std::cout << "db started, status: " << status.ToString() << std::endl;
  ASSERT_TRUE(status.ok());
  delete db;
}
```

**`leveldb::Status` 中封装了 LevelDB 接口返回的详细信息；**

如果想在数据库已存在的时候触发一个异常，可以使用 Options 中的其他配置：

```
options.error_if_exists = true;
```

执行后，会在 `/tmp` 下创建对应的目录 `test_db/` 其中存放了数据库相关的所有文件：

```bash
$ tree /tmp/test_db 
/tmp/test_db
├── 000013.log
├── CURRENT
├── LOCK
├── LOG
├── LOG.old
└── MANIFEST-000012
```

看起来是不是和 Chrome 中存储的数据非常的类似？

**关闭数据库就更加简单了，只需要：`delete db;` 即可！**

<br/>

为了简单起见，我们将数据库初始化直接封装：

```c++
const std::string db_name = "/tmp/test_db";

leveldb::Options get_options() {
  leveldb::Options options;
  options.create_if_missing = true;
  return options;
}

leveldb::DB* init_db(leveldb::Options&& options) {
  leveldb::DB* db;
  leveldb::Status status = leveldb::DB::Open(options, db_name, &db);
  assert(status.ok());
  return db;
}
```

使用时直接用下面的代码即可：

```c++
leveldb::DB* db = init_db(get_options());

// Some logic...

delete db;
```

<br/>

### **数据库读写**

LevelDB 提供了 `Put`、`Delete` 和 `Get` 方法来修改/查询数据库，下面的代码展示了这些操作的用法：

```c++
TEST(LevelDBDemo, CRUD) {
  leveldb::DB* db = init_db(get_options());
  std::string k = "name";

  // Write data.
  leveldb::Status status = db->Put(leveldb::WriteOptions(), k, "test");
  ASSERT_TRUE(status.ok());

  // Read data.
  std::string val;
  status = db->Get(leveldb::ReadOptions(), k, &val);
  ASSERT_TRUE(status.ok());
  std::cout << "Get key: " << k << ", val: " << val << std::endl;
  ASSERT_EQ(val, "test");

  // Delete data.
  status = db->Delete(leveldb::WriteOptions(), "name");
  ASSERT_TRUE(status.ok());

  // Re-Get the key:
  status = db->Get(leveldb::ReadOptions(), k, &val);
  ASSERT_FALSE(status.ok());
  std::cout << "Get key after delete, status: " << status.ToString()
            << std::endl;
  ASSERT_TRUE(status.IsNotFound());

  delete db;
}
```

<br/>

#### **Put方法**

Put 方法用于写入一个 k-v；

写入方法第一个入参是一个 WriteOptions，可选参数为：

-   sync：默认情况下，LevelDB 每个写操作都是异步的：进程把要写的内容丢给操作系统后立即返回，从操作系统内存到底层持久化存储的传输是异步进行的；将 sync 设置为 true 可以为某个特定的写操作打开同步标识，此时写操作会等到数据真正被刷到持久化存储（硬盘）后再返回（在 Posix 系统上，这是通过在写操作返回前调用 `fsync(...)` 或 `fdatasync(...)` 或 `msync(..., MS_SYNC)` 来实现的）；

>   **异步写通常比同步写快 1000 倍；**
>
>   异步写的缺点是：一旦机器崩溃可能会导致最后几个更新操作丢失；
>
>   <red>**注意：如果仅仅是写进程崩溃（而非机器重启）不会造成任何损失，因为哪怕 sync 标识为 false，在进程退出之前，写操作也已经从进程内存推到了操作系统；**</font>
>
>   异步写通常可以安全使用，比如你要将大量的数据写入数据库，如果丢失了最后几个更新操作，也可以重做整个写过程；
>
>   如果数据量非常大，一个优化点是采用混合方案：
>
>   每进行 N 个异步写操作则进行一次同步写，如果期间发生了崩溃，重启从上一个成功的同步写操作开始即可（同步写操作可以同时更新一个标识，描述崩溃时重启的位置）；
>
>   `WriteBatch` 可以作为异步写操作的替代品，多个更新操作可以放到同一个 `WriteBatch` 中然后通过一次同步写(即 `write_options.sync = true`)一起落盘；

<br/>

#### **Get方法**

和 Put 方法类似，Get 方法的第一个入参是一个 ReadOptions，可选参数有：

-   `verify_checksums`：可以设置为 true，以强制对所有从文件系统读取的数据进行校验；默认为 false，即，不进行校验；
-   `fill_cache`：是否将查询结果存入缓存块中；
-   `snapshot`：从某次快照中读取数据（可以实现 MVCC，后文会讲）；

如果 Get 一个不存在的 key，则返回的 status 不是 ok 的，可以通过 `status.IsNotFound()` 判断：

```c++
ASSERT_FALSE(status.ok());
ASSERT_TRUE(status.IsNotFound());
```

<br/>

#### **Delete方法**

由于 Delete 方法也是写入操作，因此也有和 Put 方法一样的 WriteOptions 入参；

Delete 一个不存在的 key 不会报错！

<br/>

### **原子操作**

有的时候，我们想要同时执行多个写入操作，这些操作要么成功，要么失败；

LevelDB 中提供了原子操作：

```c++
TEST(LevelDBDemo, Atomic) {
  leveldb::DB* db = init_db(get_options());
  db->Put(leveldb::WriteOptions{}, "k1", "v1");
  db->Put(leveldb::WriteOptions{}, "k2", "v2");

  // Batch write
  leveldb::WriteBatch batch;
  batch.Delete("k1");
  batch.Put("k2", "new-v2");
  auto s = db->Write(leveldb::WriteOptions{}, &batch);
  ASSERT_TRUE(s.ok());

  std::string v1;
  s = db->Get(leveldb::ReadOptions(), "k1", &v1);
  ASSERT_TRUE(s.IsNotFound());

  std::string v2;
  s = db->Get(leveldb::ReadOptions(), "k2", &v2);
  ASSERT_TRUE(s.ok());
  ASSERT_EQ(v2, "new-v2");

  delete db;
}
```

首先创建了一个 `WriteBatch`，然后通过 batch 进行了 Delete 和 Put 两个操作；

最后调用 `db->Write` 传入 batch 操作，即可；

<br/>

### **同步写操作**

前面提到，在进行写操作时，可以设置 `sync` 为 true，此时会将结果同步的刷入磁盘中；

代码如下：

```c++
TEST(LevelDBDemo, SyncWrite) {
  leveldb::DB* db = init_db(get_options());

  // Sync write
  leveldb::WriteOptions write_options;
  write_options.sync = true;
  auto s = db->Put(write_options, "sync-write-key", "sync-write");
  ASSERT_TRUE(s.ok());

  delete db;
}
```

可以尝试在同步状态下循环写入多个 k-v，肉眼可见的慢～

<br/>

### **迭代数据库数据**

在 LevelDB 中数据是按顺序存储的，有时我们想要遍历某个区间内的数据，此时就用到了迭代器；

迭代的场景有：

-   从头到尾遍历：SeekToFirst + Valid + Next；
-   从尾到头遍历：SeekToLast + Valid + Prev；
-   从某个位置开始、另一个位置结束遍历：Seek(start) + Valid && `it->key().ToString() < limit` + Next；

使用起来非常灵活，下面的代码展示了这些场景：

```c++
TEST(LevelDBDemo, Iteration) {
  leveldb::DB* db = init_db(get_options());
  leveldb::WriteBatch batch;
  for (int i = 0; i < 100; ++i) {
    std::string idx = std::to_string(i);
    batch.Put("iter-key-" + idx, "iter-value-" + idx);
  }
  auto s = db->Write(leveldb::WriteOptions{}, &batch);

  // Iteration
  std::cout << "\n###### Iteration ######\n" << std::endl;
  leveldb::Iterator* it = db->NewIterator(leveldb::ReadOptions());
  for (it->SeekToFirst(); it->Valid(); it->Next()) {
    std::cout << it->key().ToString() << ": " << it->value().ToString()
              << std::endl;
  }
  ASSERT_TRUE(it->status().ok());  // Check for any errors found during the scan
  delete it;

  // Reverse Iteration
  std::cout << "\n###### Reverse Iteration ######\n" << std::endl;
  it = db->NewIterator(leveldb::ReadOptions());
  for (it->SeekToLast(); it->Valid(); it->Prev()) {
    std::cout << it->key().ToString() << ": " << it->value().ToString()
              << std::endl;
  }
  ASSERT_TRUE(it->status().ok());  // Check for any errors found during the scan
  delete it;

  // Iterate Range: [start, limit)
  std::cout << "\n###### Iterate Range: [start, limit) ######\n" << std::endl;
  std::string limit = "iter-key-2";
  it = db->NewIterator(leveldb::ReadOptions());
  for (it->SeekToFirst(); it->Valid() && it->key().ToString() < limit;
       it->Next()) {
    std::cout << it->key().ToString() << ": " << it->value().ToString()
              << std::endl;
  }
  ASSERT_TRUE(it->status().ok());  // Check for any errors found during the scan
  delete it;

  // Iterate Range: [seek, limit)
  std::cout << "\n###### Iterate Range: [seek, limit) ######\n" << std::endl;
  std::string seek = "iter-key-2";
  limit = "iter-key-3";
  it = db->NewIterator(leveldb::ReadOptions());
  for (it->Seek(seek); it->Valid() && it->key().ToString() < limit;
       it->Next()) {
    std::cout << it->key().ToString() << ": " << it->value().ToString()
              << std::endl;
  }
  ASSERT_TRUE(it->status().ok());  // Check for any errors found during the scan
  delete it;

  delete db;
}
```

需要注意的是：

-   **所有的迭代器都通过 `NewIterator` 创建；**
-   **当迭代结束后要通过 `delete it` 释放掉迭代器资源！**

<br/>

### **快照（Snapshot）**



代码如下：

```c++
TEST(LevelDBDemo, Snapshot) {
  leveldb::DB* db = init_db(get_options());
  std::string k = "snapshot-key", v = "snapshot-value";
  db->Put(leveldb::WriteOptions{}, k, v);

  // Create snapshot
  leveldb::ReadOptions snapshot_options;
  snapshot_options.snapshot = db->GetSnapshot();

  // Do some updates
  db->Put(leveldb::WriteOptions{}, k, v + "-updated");

  // Read not using snapshot
  std::string updated_val;
  db->Get(leveldb::ReadOptions{}, k, &updated_val);
  std::cout << "Read with no snapshots: " << updated_val << std::endl;
  ASSERT_EQ(updated_val, v + "-updated");

  // Read using snapshot
  std::string snapshot_read_val;
  db->Get(snapshot_options, k, &snapshot_read_val);
  std::cout << "Read with snapshot: " << snapshot_read_val << std::endl;
  ASSERT_EQ(snapshot_read_val, v);

  // Release snapshot
  db->ReleaseSnapshot(snapshot_options.snapshot);

  delete db;
}
```







<br/>

### **比较器（Comparator）**





<br/>

### **过滤器（Filter）**





<br/>

### **估算某个区间空间大小**









<br/>

## **其他内容**

### **并发**

<red>**对于 LevelDB 来说，一个数据库同时只能被一个进程打开：LevelDB 会从操作系统获取一把锁来防止多进程同时打开同一个数据库；**</font>

<red>在单个进程中，同一个 leveldb::DB 对象则可以被多个并发线程安全地使用，不同的线程可以在**不需要任何外部同步原语**的情况下，写入、获取迭代器或者调用 `Get`（leveldb 实现会确保所需的同步）；</font>

**但是其它对象，比如 `Iterator` 或者 `WriteBatch` 则需要外部自己提供同步保证，如果两个线程共享此类对象，需要使用自己的锁进行互斥访问；**

<br/>





<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/leveldb

参考文章；

-   https://juejin.cn/post/6901257330524946445
-   https://github.com/google/leveldb/issues/1074

<br/>
