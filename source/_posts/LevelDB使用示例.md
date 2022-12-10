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
>   - double sigma_gn = 0.0;
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
>   <font color="#f00">**注意：如果仅仅是写进程崩溃（而非机器重启）不会造成任何损失，因为哪怕 sync 标识为 false，在进程退出之前，写操作也已经从进程内存推到了操作系统；**</font>
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

快照提供了针对整个 K-V 存储的一致性只读视图（consistent read-only views）；例如，我们熟悉的 MySQL 中各个事务在未提交时，都拥有自己独立的视图（如果配置了对应的事务隔离级别不是脏读），各个事务之间相互独立，即 MVCC；

对于读操作而言：

-   **如果 `ReadOptions::snapshot` 不为 null 则表示读操作作用在当前 DB 的特定快照版本上；**
-   **若为 null，则读操作将会作用在当前版本的一个隐式的快照上；**

测试代码如下：

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

首先，我们写入了 k-v 对 `("snapshot-key", "snapshot-value")` ，并创建了对应的视图；

随后，我们更新了 value 变为：`"snapshot-value-updated"`；

然后：

-   当不用 snapshot 查询时，查询结果为 `"snapshot-value-updated"`；
-   当使用了 snapshot 查询后，查询结果为 Put 之前的值：`"snapshot-value"`；

输出结果如下：

```
Read with no snapshots: snapshot-value-updated
Read with snapshot: snapshot-value
```

<font color="#f00">**注意，当一个快照不再使用的时候，应该通过 `DB::ReleaseSnapshot` 接口进行释放；**</font>

<br/>

### **比较器（Comparator）**

#### **创建并使用自定义比较器**

在 LevelDB 中，所有的数据都是顺序存储的，并且默认情况下的比较函数，是按照逐字节字典序比较；

此外，<font color="#f00">**LevelDB 还允许自定义比较函数，在首次打开数据库时传入！**</font>

自定义比较函数，只需要继承 `leveldb::Comparator` 然后定义相关逻辑即可；

例如：

```c++
class TwoPartComparator : public leveldb::Comparator {
  public:
  // Three-way comparison function:
  //   if a < b: negative result
  //   if a > b: positive result
  //   else: zero result
  int Compare(const leveldb::Slice& a,
              const leveldb::Slice& b) const override {
    long a1, a2, b1, b2;
    ParseKey(a, &a1, &a2);
    ParseKey(b, &b1, &b2);
    if (a1 < b1) return -1;
    if (a1 > b1) return +1;
    if (a2 < b2) return -1;
    if (a2 > b2) return +1;
    return 0;
  }

  const char* Name() const override { return "TwoPartComparator"; }
  void FindShortestSeparator(std::string*,
                             const leveldb::Slice&) const override {}
  void FindShortSuccessor(std::string*) const override {}

  private:
  static void ParseKey(const leveldb::Slice& k, long* x1, long* x2) {
    std::string parts = k.ToString();
    auto index = parts.find_first_of(':');
    *x1 = strtol(parts.substr(0, index).c_str(), nullptr, 10);
    *x2 = strtol(parts.substr(index + 1, parts.size()).c_str(), nullptr, 10);
  }
};
```

上面的自定义比较函数将一个字符串通过 `:` 拆分为两个整数部分，首先比较前半部分数值的大小，如果前半部分相同，则再比较后半部分数值；

测试代码如下：

```c++
TEST(LevelDBDemo, Comparator) {
  leveldb::DB* db;
  leveldb::Options options;
  TwoPartComparator cmp;
  options.create_if_missing = true;
  options.comparator = &cmp;
  leveldb::Status status =
      leveldb::DB::Open(options, "/tmp/comparator-demo", &db);
  ASSERT_TRUE(status.ok());

  // populate the database
  leveldb::Slice key1 = "1:3";
  leveldb::Slice key2 = "2:3";
  leveldb::Slice key3 = "2:1";
  leveldb::Slice key4 = "2:100";
  std::string val1 = "one";
  std::string val2 = "two";
  std::string val3 = "three";
  std::string val4 = "four";
  db->Put(leveldb::WriteOptions(), key1, val1);
  db->Put(leveldb::WriteOptions(), key2, val2);
  db->Put(leveldb::WriteOptions(), key3, val3);
  db->Put(leveldb::WriteOptions(), key4, val4);

  // iterate the database
  leveldb::Iterator* it = db->NewIterator(leveldb::ReadOptions());
  for (it->SeekToFirst(); it->Valid(); it->Next()) {
    std::cout << it->key().ToString() << ": " << it->value().ToString()
              << std::endl;
  }
  // 1:3: one
  // 2:1: three
  // 2:3: two
  // 2:100: four
  delete it;

  // Open a wrong comparator database cause error
  status = leveldb::DB::Open(options, db_name, &db);
  ASSERT_FALSE(status.ok());
  std::cout << "Open a wrong comparator database: " << status.ToString()
            << std::endl;
  ASSERT_TRUE(status.IsInvalidArgument());

  delete db;
}
```

我们创建了自定义比较器 TwoPartComparator 对象，将其传入 options 中，并使用这个 options 创建了一个新的数据库：`"/tmp/comparator-demo"`；

随后加入了几个 k-v 对，key 值如下：

-   `1:3`；
-   `2:3`；
-   `2:1`；
-   `2:100`；

随后通过迭代器遍历，输出结果如下：

```bash
1:3: one
2:1: three
2:3: two
2:100: four
```

如果按照自然顺序，则应当输出：

```
1:3: one
2:1: three
2:100: four
2:3: two
```

说明我们的自定义比较器生效；

<br/>

#### **无法为已存在数据库指定比较器**

需要特别注意的是：由于在 LevelDB 中，数据的比较顺序是非常重要的，因此一旦创建了数据库就不能再更改比较顺序了；

如上面的例子中所展示的，这段代码将会报错：

```c++
// Open a wrong comparator database cause error
status = leveldb::DB::Open(options, db_name, &db);
ASSERT_FALSE(status.ok());
std::cout << "Open a wrong comparator database: " << status.ToString()
  << std::endl;
ASSERT_TRUE(status.IsInvalidArgument());
```

错误内容：

```
Open a wrong comparator database: Invalid argument: leveldb.BytewiseComparator does not match existing comparator : TwoPartComparator
```

从而保证了数据的向后兼容性；

<br/>

#### **比较顺序的向后兼容性**

<font color="#f00">**比较器的 `Name()` 方法返回的结果在创建数据库时会被绑定到数据库上，后续每次打开都会进行检查：如果名称改变，则对 `leveldb::DB::Open` 的调用就会失败；**</font>

**因此，当且仅当在新的 key 格式和比较函数与已有的数据库不兼容而且已有数据不再被需要的时候，才能够修改比较器名称；总而言之，一个数据库只能对应一个比较器，而且比较器由名字唯一确定，一旦修改名称或比较器逻辑，数据库的操作逻辑均会出错！**

如果一定要修改比较逻辑，可以根据预先规划一点点的改进 key 格式（注意，事先的改进规划非常重要）；

比如，你可以先在每个 key 的结尾存储一个版本号（通常一个字节足矣），当需要切换到新的 key 格式的时（例如前面 `TwoPartComparator` 处理的 keys），那么需要做的是：

-   保持相同的比较器名称；
-   递增新 keys 的版本号；
-   修改比较器函数以让其通过判断版本号来决定如何进行排序；

<br/>

### **过滤器（Filter）**

考虑到 LevelDB 数据在磁盘上的组织形式，一次 `Get` 调用可能涉及多次磁盘的 IO 操作，因此可以配置 FilterPolicy 来大幅减少磁盘读次数；

例如，启用 BloomFilter：

```c++
leveldb::Options options;
// 设置启用基于布隆过滤器的过滤策略
options.filter_policy = NewBloomFilterPolicy(10);
leveldb::DB* db;
// 用该设置打开数据库
leveldb::DB::Open(options, "/tmp/test_db", &db);
... use the database ...
delete db;
delete options.filter_policy;
```

上面的代码将一个布隆过滤器的过滤策略与数据库进行了关联，<font color="#f00">**如果数据集无法全部放入内存同时又存在大量随机读的应用应当设置一个过滤器策略！**</font>

>   **基于布隆过滤器的过滤方式依赖于如下事实：**
>
>   在内存中保存每个 key 的部分位（在上面例子中是 10 位，因为我们传给 `NewBloomFilterPolicy` 的参数是 10），这个过滤器将会使得 Get() 调用中非必须的磁盘读操作大约减少 100 倍，每个 key 用于过滤器的位数增加将会进一步减少读磁盘次数，当然也会占用更多内存空间；

<br/>

此外，我们也可以自定义过滤器；

需要注意的是：<font color="#f00">**如果你使用的是自定义的比较器，则应该确保你自定义的过滤器策略与你的比较器逻辑上兼容；**</font>

举个例子：如果一个比较器在比较 key 的时候忽略结尾的空格，那么 `NewBloomFilterPolicy` 一定不能与此比较器共存；相反，应该提供一个自定义的过滤器策略，而且它也应该忽略 key 的尾部空格，例如：

```c++
class CustomFilterPolicy : public leveldb::FilterPolicy {
  public:
  explicit CustomFilterPolicy(int i)
    : builtin_policy_(leveldb::NewBloomFilterPolicy(i)) {}
  ~CustomFilterPolicy() override { delete builtin_policy_; }

  const char* Name() const override { return "IgnoreTrailingSpacesFilter"; }

  void CreateFilter(const leveldb::Slice* keys, int n,
                    std::string* dst) const override {
    // Use builtin bloom filter code after removing trailing spaces
    std::vector<leveldb::Slice> trimmed(n);
    int i;
    for (i = 0; i < n; i++) {
      trimmed[i] = RemoveTrailingSpaces(keys[i]);
    }
    return builtin_policy_->CreateFilter(&trimmed[i], n, dst);
  }

  bool KeyMayMatch(const leveldb::Slice& key,
                   const leveldb::Slice& filter) const override {
    // Use builtin bloom filter code after removing trailing spaces
    return builtin_policy_->KeyMayMatch(RemoveTrailingSpaces(key), filter);
  }

  private:
  static leveldb::Slice RemoveTrailingSpaces(leveldb::Slice s) {
    std::string str = s.ToString();
    const auto strBegin = str.find_first_not_of(' ');
    if (strBegin == std::string::npos) return "";  // no content

    const auto strEnd = str.find_last_not_of(' ');
    const auto strRange = strEnd - strBegin + 1;

    return str.substr(strBegin, strRange);
  }

  private:
  const FilterPolicy* builtin_policy_;
};
```

上面的自定义过滤器去除了前后的空格之后，再使用 BloomFilter 进行匹配；

使用如下：

```c++
TEST(LevelDBDemo, Filter) {
  leveldb::DB* db;
  leveldb::Options options;
  CustomFilterPolicy filter(100);
  options.create_if_missing = true;
  options.filter_policy = &filter;
  leveldb::Status status = leveldb::DB::Open(options, "/tmp/filter-demo", &db);
  ASSERT_TRUE(status.ok());

  // populate the database
  leveldb::Slice key1 = "hello";
  leveldb::Slice key2 = " hello";
  leveldb::Slice key3 = "hello ";
  leveldb::Slice key4 = " hello ";
  std::string val1 = "one";
  std::string val2 = "two";
  std::string val3 = "three";
  std::string val4 = "four";
  db->Put(leveldb::WriteOptions(), key1, val1);
  db->Put(leveldb::WriteOptions(), key2, val2);
  db->Put(leveldb::WriteOptions(), key3, val3);
  db->Put(leveldb::WriteOptions(), key4, val4);

  // iterate the database
  leveldb::Iterator* it = db->NewIterator(leveldb::ReadOptions());
  for (it->SeekToFirst(); it->Valid(); it->Next()) {
    std::cout << it->key().ToString() << ": " << it->value().ToString()
              << std::endl;
  }
  // hello: two
  // hello : four
  // hello: one
  // hello : three
  delete it;

  delete db;
}
```

当然也可以提供非基于布隆过滤器的过滤器策略，具体见 `leveldb/filter_policy.h`；

<br/>

## **其他内容**

### **Slice**

对于迭代器而言，`it->key()` 和 `it->value()` 调用返回的值是 `leveldb::Slice` 类型；

熟悉 Go 的同学应该对 Slice 不陌生：Slice 是一个简单的数据结构，包含一个长度和一个指向外部字节数组的指针，<font color="#f00">**返回一个 Slice 比直接返回一个 `std::string` 更高效，因为不需要隐式地拷贝大量的 keys 和 values；**</font>

<font color="#f00">**另外，LevelDB 中的方法不会返回以 `\0` 结尾的 C 风格的字符串，因为 LevelDB 中的 keys 和 values 允许包含 `\0` ；**</font>

C++ 风格的 string 和 C 风格 `\0` 结尾的字符串都可以很容易地转换为一个 Slice：

```c++
leveldb::Slice s1 = "hello";

std::string str("world");
leveldb::Slice s2 = str;
```

一个 Slice 也很容易转换回 C++ 风格的字符串：

```c++
std::string str = s1.ToString();
assert(str == std::string("hello"));
```

但是，在使用 Slice 时要小心：<font color="#f00">**要由调用者来确保 Slice 指向的外部字节数组的有效性；**</font>

例如，下面的代码就有 bug ：

```c++
leveldb::Slice slice;
if (...) {
  std::string str = ...;
  slice = str;
}
Use(slice);
```

**当 if 语句结束的时候，str 将会被销毁，Slice 的指向也随之消失，后面再用就会出问题！**

<br/>

### **并发**

<font color="#f00">**对于 LevelDB 来说，一个数据库同时只能被一个进程打开：LevelDB 会从操作系统获取一把锁来防止多进程同时打开同一个数据库；**</font>

<font color="#f00">在单个进程中，同一个 leveldb::DB 对象则可以被多个并发线程安全地使用，不同的线程可以在**不需要任何外部同步原语**的情况下，写入、获取迭代器或者调用 `Get`（leveldb 实现会确保所需的同步）；</font>

**但是其它对象，比如 `Iterator` 或者 `WriteBatch` 则需要外部自己提供同步保证，如果两个线程共享此类对象，需要使用自己的锁进行互斥访问；**

<br/>

### **性能调优**

LevelDB 提供了各种运行参数，可以通过修改 `include/leveldb/options.h` 中定义的类型的默认值来对 LevelDB 的性能进行调优；

#### **Block 大小**

LevelDB 把相邻的 keys 组织在同一个 block 中（具体见后续系列文章对 sstable 文件格式的描述），block 是数据在内存和持久化存储之间传输的基本单位；

**默认情况下，未压缩的 block 大小大约为 4KB，而对于：**

-   **经常需要批量扫描大量数据的应用可以把这个值调大；**
-   **针对只做“单点读”的应用则可以将这个值调小一些；**

**但是，没有证据表明该值小于 1KB 或者大于几个 MB 的时候性能会表现得更好；**

<font color="#f00">**另外要注意的是：使用较大的 block size，压缩效率会更高效；**</font>

<br/>

#### **关闭压缩**

<font color="#f00">**每一块 block 在写入持久化存储之前都会被单独压缩；**</font>

**压缩默认是开启的，因为默认的压缩算法非常快，且对于不可压缩的数据会自动关闭压缩功能，极少有场景会需要完全关闭压缩功能，除非基准测试显示关闭压缩会显著改善性能；**

此时可以按照下面的方式关闭压缩功能：

```c++
leveldb::Options options;
options.compression = leveldb::kNoCompression;
... leveldb::DB::Open(options, name, ...) ....
```

<br/>

#### **缓存**

数据库的内容存储在文件系统中的一组文件中，每个文件都存储了一系列压缩后的 blocks，如果 `options.block_cache` 不是 NULL，则可以缓存经常使用的已解压缩 block 内容：

```c++
#include "leveldb/cache.h"

leveldb::Options options;
options.block_cache = leveldb::NewLRUCache(100 * 1048576);  // 100MB cache
leveldb::DB* db;
leveldb::DB::Open(options, name, &db);
... use the db ...
delete db
delete options.block_cache;
```

<font color="#f00">**注意：在 cache 中保存的是未压缩的数据，因此应该根据应用所需数据大小来设置它的大小**</font>（已压缩数据的缓存工作是由操作系统的 buffer cache 或者用户自定义 `Env` 实现完成）；

<font color="#f00">**当执行一个大块数据读操作时，应用程序可能想要取消缓存功能：此时，读进来的大块数据就不会导致当前 cache 中的大部分数据被替换出去；**</font>

这种情况下，可以提供一个单独的 iterator 来达到该目的：

```c++
leveldb::ReadOptions options;
options.fill_cache = false;
leveldb::Iterator* it = db->NewIterator(options);
for (it->SeekToFirst(); it->Valid(); it->Next()) {
  ...
}
```

<br/>

#### **Key 的布局**

前面说过，磁盘传输和缓存的基本单位都是一个 block；而对于 key 的排列而言，相邻的 keys（已排序）总是在同一个 block 中；

因此，应用可以通过将需要一起访问的 keys 放在一起，同时把不经常使用的 keys 放到一个独立的键空间区域来提升性能；

例如，假设我们正基于 LevelDB 来实现一个简单的文件系统，而存储到这个文件系统的数据类型如下：

```rust
filename -> permission-bits, length, list of file_block_ids
file_block_id -> data
```

则可以**给上面表示 filename 的 key 增加一个字符前缀，例如 `'/'`，然后给表示 file_block_id 的 key 增加另一个不同的前缀，例如 `'0'`；**

这样，这些不同用途的 key 就具有了各自独立的键空间，扫描元数据时就不用读取和缓存大块文件内容数据了；

<br/>

### **校验和（Checksum）**

LevelDB 将校验和和它存储在文件系统中的所有数据进行关联，对于这些校验和，有两个独立的控制：

-   `ReadOptions::verify_checksums`：可以设置为 true，以**强制对所有从文件系统读取的数据进行校验；**默认为 false，即不会进行这样的校验；
-   `Options::paranoid_checks`：在数据库打开之前设置为 true ，以使得**一旦数据库检测到数据损毁则立即报错退出**；该配置默认是关闭，即持久化存储在部分损坏时数据库也能继续使用；

<font color="#f00">**注：如果数据库损坏了（当开启 Options::paranoid_checks 的时候可能就打不开了），`leveldb::RepairDB()` 函数可以用于对尽可能多的数据进行修复；**</font>

<br/>

### **近似空间大小**

`GetApproximateSizes` 方法用于获取一个或多个键区间占据的文件系统近似大小（单位, 字节）；

例如：

```c++
TEST(LevelDBDemo, GetApproximateSizes) {
  leveldb::DB* db = init_db(get_options());

  // GetApproximateSizes
  leveldb::Range ranges[2];
  ranges[0] = leveldb::Range("a", "c");
  ranges[1] = leveldb::Range("x", "z");
  uint64_t sizes[2];
  db->GetApproximateSizes(ranges, 2, sizes);

  std::cout << "sizes[0]: " << sizes[0] << ", sizes[1]: " << sizes[1]
            << std::endl;

  delete db;
}
```

上述代码结果是，`size[0]` 保存 `[a..c)` 区间对应的文件系统大致字节数。`size[1]` 保存 `[x..z)` 键区间对应的文件系统大致字节数；

<br/>

### **环境变量**

<font color="#f00">**由 LevelDB 发起的全部文件操作以及对应的操作系统调用，最后都会被路由给一个 `leveldb::Env` 对象；**</font>

库使用者也可以提供自己的 Env 实现以达到更好的控制；

比如：如果应用程序想要针对 LevelDB 的文件 IO 引入一个人工延迟以限制 LevelDB 对同一系统中其它应用的影响：

```c++
// 定制自己的 Env 
class SlowEnv : public leveldb::Env {
  ... implementation of the Env interface ...
};

SlowEnv env;
leveldb::Options options;
// 用定制的 Env 打开数据库
options.env = &env;
Status s = leveldb::DB::Open(options, ...);
```

<br/>

### **可移植**

如果某个特定平台提供 `leveldb/port/port.h` 导出的类型/方法/函数实现，那么 LevelDB 可以被移植到该平台上，更多细节见 `leveldb/port/port_example.h`；

另外，新平台可能还需要一个新的默认的 leveldb::Env 实现。具体可参考 `leveldb/util/env_posix.h` 实现；

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/leveldb

参考文章；

-   https://juejin.cn/post/6901257330524946445
-   https://github.com/google/leveldb/issues/1074
-   https://leveldb-handbook.readthedocs.io/zh/latest/index.html
-   https://yuerblog.cc/wp-content/uploads/leveldb%E5%AE%9E%E7%8E%B0%E8%A7%A3%E6%9E%90.pdf
-   https://github.com/balloonwj/CppGuide/blob/master/articles/leveldb%E6%BA%90%E7%A0%81%E5%88%86%E6%9E%90/leveldb%E6%BA%90%E7%A0%81%E5%88%86%E6%9E%901.md

<br/>
