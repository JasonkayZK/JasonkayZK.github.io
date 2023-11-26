---
title: Java高性能缓存库Caffeine
toc: true
cover: 'https://img.paulzzh.com/touhou/random?22'
date: 2023-03-28 11:30:08
categories: Java
tags: [Java, Caffeine, Cache]
description: Caffeine是基于Java的一个高性能本地缓存库，由Guava改进而来；本文介绍了如何在Java中使用Caffeine缓存，以及如何在SpringBoot中集成Caffeine缓存；
---

Caffeine是基于Java的一个高性能本地缓存库，由Guava改进而来；

本文介绍了如何在Java中使用Caffeine缓存，以及如何在SpringBoot中集成Caffeine缓存；

源代码：

-   https://github.com/JasonkayZK/java-all/tree/main/cache/caffeine
-   https://github.com/ben-manes/caffeine

<br/>

<!--more-->

# **Java高性能缓存库Caffeine**

## **Caffeine简介**

Caffeine是一个Java高性能的本地缓存库。其官方说明指出，其缓存命中率已经接近最优值。

<font color="#f00">**实际上，Caffeine这样的本地缓存和ConcurrentMap很像：支持并发，并且支持O(1)时间复杂度的数据存取。二者的主要区别在于：**</font>

-   <font color="#f00">**ConcurrentMap将存储所有存入的数据，直到你显式将其移除；**</font>
-   <font color="#f00">**Caffeine将通过给定的配置，自动移除“不常用”的数据，以保持内存的合理占用。**</font>

>   因此，一种更好的理解方式是：
>
>   **Cache是一种带有存储和移除策略的Map**

Caffeine提供如下的一些功能：

```
- automatic loading of entries into the cache, optionally asynchronously
# 自动加载条目到缓存中，支持异步加载
- size-based eviction when a maximum is exceeded based on frequency and recency
# 根据频率和最近访问情况，支持将缓存数量设为移除策略
- time-based expiration of entries, measured since last access or last write
# 根据最近访问和修改时间，支持将时间设为移除策略
- asynchronously refresh when the first stale request for an entry occurs
# 过期条目再次访问时异步加载
- keys automatically wrapped in weak references
# key自动包装为弱引用
- values automatically wrapped in weak or soft references
# value自动包装为弱引用/软引用
- notification of evicted (or otherwise removed) entries
# 条目移除通知
- writes propagated to an external resource
# 对外部资源的写入
- accumulation of cache access statistics
# 累计缓存使用统计
```

<br/>

## **Caffeine基本使用**

在项目中添加依赖：

```xml
<dependency>
  <groupId>com.github.ben-manes.caffeine</groupId>
  <artifactId>caffeine</artifactId>
  <version>2.9.3</version>
</dependency>
```

本文基于 2.9.3 版本；

<br/>

### **缓存类型**

Caffeine提供了四种类型的Cache，对应着四种加载策略：

-   Cache；
-   LoadingCache；
-   AsyncCache；
-   AsyncLoadingCache；

下面分别来看；

<br/>

#### **Cache**

最普通的一种缓存，无需指定加载方式，需要手动调用`put()`进行加载；

**需要注意的是：`put()`方法对于已存在的key将进行覆盖，这点和Map的表现是一致的；**

**在获取缓存值时，如果想要在缓存值不存在时，原子地将值写入缓存，则可以调用`get(key, k -> value)`方法，该方法将避免写入竞争；**

调用`invalidate()`方法，将手动移除缓存；

多线程情况下，当使用`get(key, k -> value)`时，如果有另一个线程同时调用本方法进行竞争，则后一线程会被阻塞，直到前一线程更新缓存完成；

**而若另一线程调用`getIfPresent()`方法，则会立即返回null，不会被阻塞；**

cache/caffeine/basic/src/main/java/io/github/jasonkayzk/type/CacheDemo.java

```java
public class CacheDemo {

    public static void main(String[] args) {
        Cache<String, String> cache = Caffeine.newBuilder().build();

        System.out.println(cache.getIfPresent("123")); // null
        System.out.println(cache.get("123", k -> "456")); // 456
        System.out.println(cache.getIfPresent("123"));    // 456
        cache.put("123", "789");
        System.out.println(cache.getIfPresent("123"));    // 789
    }

}
```

<br/>

#### **LoadingCache**

LoadingCache是一种自动加载的缓存；

**和普通缓存不同的地方在于：当缓存不存在/缓存已过期时，若调用`get()`方法，则会自动调用`CacheLoader.load()`方法加载最新值；**

**调用`getAll()`方法将遍历所有的key调用`get()`，除非实现了`CacheLoader.loadAll()`方法。**

使用LoadingCache时，需要指定CacheLoader，并实现其中的`load()`方法供缓存缺失时自动加载。

多线程情况下，当两个线程同时调用`get()`，则后一线程将被阻塞，直至前一线程更新缓存完成。

cache/caffeine/basic/src/main/java/io/github/jasonkayzk/type/LoadingCacheDemo.java

```java
public class LoadingCacheDemo {

    public static void main(String[] args) {
        LoadingCache<String, String> cache = Caffeine.newBuilder()
                .build(new CacheLoader<String, String>() {
                    @Override
                    // 该方法必须实现
                    public String load(@NonNull String k) throws Exception {
                        return "456";
                    }

                    @Override
                    // 如果需要批量加载
                    public @NonNull Map<String, String> loadAll(@NonNull Iterable<? extends String> keys) throws Exception {
                        return new HashMap<String, String>() {
                        };
                    }
                });

        System.out.println(cache.getIfPresent("123")); // null
        System.out.println(cache.get("123"));          // 456
        System.out.println(cache.getAll(Arrays.asList("123", "456")));        // Map<String, String>
    }
}
```

<br/>

#### **AsyncCache**

AsyncCache是Cache的一个变体，其响应结果均为CompletableFuture，通过这种方式，AsyncCache对异步编程模式进行了适配；

默认情况下，缓存计算使用`ForkJoinPool.commonPool()`作为线程池，如果想要指定线程池，则可以覆盖并实现`Caffeine.executor(Executor)`方法。

`synchronous()`提供了阻塞直到异步缓存生成完毕的能力，它将以Cache进行返回。

多线程情况下，当两个线程同时调用`get(key, k -> value)`，则会返回**同一个CompletableFuture**对象。由于返回结果本身不进行阻塞，可以根据业务设计自行选择阻塞等待或者非阻塞。

cache/caffeine/basic/src/main/java/io/github/jasonkayzk/type/AsyncCacheDemo.java

```java
public class AsyncCacheDemo {

    public static void main(String[] args) throws ExecutionException, InterruptedException {
        String key = "123";
        AsyncCache<String, String> cache = Caffeine.newBuilder().buildAsync();

        CompletableFuture<String> completableFuture = cache.get(key, k -> "456");
        System.out.println(completableFuture.get()); // 阻塞，直至缓存更新完成
    }
}
```

<br/>

#### **AsyncLoadingCache**

显然这是Loading Cache和Async Cache的功能组合。AsyncLoadingCache支持以异步的方式，对缓存进行自动加载。

类似LoadingCache，同样需要指定CacheLoader，并实现其中的`load()`方法供缓存缺失是自动加载，该方法将自动在`ForkJoinPool.commonPool()`线程池中提交。如果想要指定Executor，则可以实现`AsyncCacheLoader().asyncLoad()`方法。

cache/caffeine/basic/src/main/java/io/github/jasonkayzk/type/AsyncLoadingCacheDemo.java

```java
public class AsyncLoadingCacheDemo {

    public static void main(String[] args) throws ExecutionException, InterruptedException {
        String key = "123";

        AsyncLoadingCache<String, String> cache = Caffeine.newBuilder()
                .buildAsync(new AsyncCacheLoader<String, String>() {
                    @Override
                    // 自定义线程池加载
                    public @NonNull CompletableFuture<String> asyncLoad(@NonNull String key, @NonNull Executor executor) {
                        return CompletableFuture.completedFuture("456");
                    }
                });
//                .buildAsync(new CacheLoader<String, String>() {
//                    @Override
//                    // OR，使用默认线程池加载（二者选其一）
//                    public String load(@NonNull String key) throws Exception {
//                        return "456";
//                    }
//                });

        CompletableFuture<String> completableFuture = cache.get(key); // CompletableFuture<String>
        System.out.println(completableFuture.get());; // 阻塞，直至缓存更新完成
    }
}
```

<br/>

### **驱逐策略**

驱逐策略在创建缓存的时候进行指定；

常用的有：基于容量的驱逐和基于时间的驱逐；

-   基于容量的驱逐：需要指定缓存容量的最大值；当缓存容量达到最大时，Caffeine将使用LRU策略对缓存进行淘汰；
-   基于时间的驱逐：可以设置在最后访问/写入一个缓存经过指定时间后，自动进行淘汰；

**驱逐策略可以组合使用，任意驱逐策略生效后，该缓存条目即被驱逐；**

cache/caffeine/basic/src/main/java/io/github/jasonkayzk/evict/EvictDemo.java

```java
public class EvictDemo {

    public static void main(String[] args) {
        // 创建一个最大容量为10的缓存
        Cache<String, String> cache1 = Caffeine.newBuilder().
                maximumSize(10).build();

        // 创建一个写入5s后过期的缓存
        Cache<String, String> cache2 = Caffeine.newBuilder().
                expireAfterWrite(5, TimeUnit.SECONDS).build();

        // 创建一个访问1s后过期的缓存
        Cache<String, String> cache3 = Caffeine.newBuilder().
                expireAfterAccess(1, TimeUnit.SECONDS).build();
    }
}
```

<br/>

### **刷新机制**

试想这样一种情况：当缓存运行过程中，有些缓存值我们需要定期进行刷新，以确保信息可以正确被同步到缓存中来；

我们当然可以使用基于时间的驱逐策略`expireAfterWrite()`，但带来的问题是：一旦缓存过期，下次重新加载缓存时将使得调用线程处于阻塞状态；

而使用刷新机制`refreshAfterWrite()`，Caffeine将在key允许刷新后的首次访问时，立即返回旧值，同时异步地对缓存值进行刷新，这使得调用方不至于因为缓存驱逐而被阻塞；

**需要注意的是：刷新机制只支持LoadingCache和AsyncLoadingCache；**

通过覆写`CacheLoader.reload()`方法，将在刷新时使得旧缓存值参与其中；

cache/caffeine/basic/src/main/java/io/github/jasonkayzk/refresh/RefreshDemo.java

```java
public class RefreshDemo {

    public static void main(String[] args) {
        LoadingCache<String, String> cache1 = Caffeine.newBuilder().
                refreshAfterWrite(10, TimeUnit.MINUTES).
                build(RefreshDemo::create);
    }

    private static String create(String k) {
        return k;
    }
}
```

<br/>

### **统计**

Caffeine内置了数据收集功能，通过`Caffeine.recordStats()`方法，可以打开数据收集；

这样`Cache.stats()`方法将会返回当前缓存的一些统计指标，例如：

-   `hitRate`：查询缓存的命中率
-   `evictionCount`：被驱逐的缓存数量
-   `averageLoadPenalty`：新值被载入的平均耗时

cache/caffeine/basic/src/main/java/io/github/jasonkayzk/record/RecordDemo.java

```java
public class RecordDemo {

    public static void main(String[] args) {
        // 获取统计指标
        Cache<String, String> cache = Caffeine.newBuilder().
                recordStats().build();
        System.out.println(cache.stats());
        System.out.println(cache.estimatedSize());
    }
}
```

输出：

```
CacheStats{hitCount=0, missCount=0, loadSuccessCount=0, loadFailureCount=0, totalLoadTime=0, evictionCount=0, evictionWeight=0}
0
```

<br/>

## **SpringBoot中集成Caffeine**

### **SpringBoot缓存管理器**

Spring从3.1开始就引入了对Cache的支持。定义了`org.springframework.cache.Cache`和`org.springframework.cache.CacheManager`接口，来统一不同的缓存技术，并支持使用`JCache(JSR-107)`注解来简化开发。

-   Cache接口包括了缓存的各种操作集合，实际操作缓存时，即通过这些接口进行操作。
-   Cache接口下Spring提供了各种xxxCache的实现。由于官方从SpringBoot 2.x后，将Caffeine代替Guava作为默认的缓存组件，因此这里我们需要用到的就是`CaffeineCache`这个类。如果需要自定义Cache实现，只需要实现Cache接口即可。
-   CacheManager 定义了创建、配置、获取、管理和控制多个唯一命名的 Cache。这些 Cache 存在于 CacheManager 的上下文中。

创建一个缓存管理器：

```java
@Bean
public CacheManager cacheManager() {
    SimpleCacheManager cacheManager = new SimpleCacheManager();
    ArrayList<CaffeineCache> caches = new ArrayList<>();
    // String cacheName(): 创建缓存名称
    // Cache<Object, Object> generateCache(): 创建一个Caffeine缓存
    caches.add(new CaffeineCache(cacheName(), generateCache()));
    cacheManager.setCaches(caches);
    return cacheManager;
}
```

使用这种方式，可以同时在缓存管理器中添加多个缓存。需要注意的是，**SimpleCacheManager只能使用Cache和LoadingCache，异步缓存将无法支持**。

<br/>

### **使用@Cacheable相关注解**

#### **@Cacheable相关注解**

添加完成缓存管理器后，我们可以方便地使用`@Cacheable`相关注解对缓存进行管理了。为了使用该注解，需要引入如下依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

和@Cacheable相关的常用的注解包括：

-   `@Cacheable`：表示该方法支持缓存。当调用被注解的方法时，如果对应的键已经存在缓存，则不再执行方法体，而从缓存中直接返回。当方法返回null时，将不进行缓存操作。
-   `@CachePut`：表示执行该方法后，其值将作为最新结果更新到缓存中。**每次都会执行该方法**。
-   `@CacheEvict`：表示执行该方法后，将触发缓存清除操作。
-   `@Caching`：用于组合前三个注解，例如：

```java
@Caching(cacheable = @Cacheable("users"),
         evict = {@CacheEvict("cache2"), @CacheEvict(value = "cache3", allEntries = true)})
public User find(Integer id) {
    return null;
}
```

这类注解也同时可以标记在一个类上，表示该类的所有方法都支持对应的缓存注解。

<br/>

#### **常用注解属性**

`@Cacheable`常用的注解属性如下：

-   `cacheNames/value`：缓存组件的名字，即cacheManager中缓存的名称。
-   `key`：缓存数据时使用的key。默认使用方法参数值，也可以使用[SpEL](https://docs.spring.io/spring-framework/docs/3.0.x/reference/expressions.html)表达式进行编写。
-   `keyGenerator`：和key二选一使用。
-   `cacheManager`：指定使用的缓存管理器。
-   `condition`：在方法执行开始前检查，在符合condition的情况下，进行缓存
-   `unless`：在方法执行完成后检查，在符合unless的情况下，不进行缓存
-   `sync`：是否使用同步模式。若使用同步模式，在多个线程同时对一个key进行load时，其他线程将被阻塞。

下面是一个注解使用示例：

```java
@Cacheable(value = "UnitCache",
        key = "#unitType + T(top.kotoumi.constants.Constants).SPLIT_STR + #unitId",
        condition = "#unitType != 'weapon'")
public Unit getUnit(String unitType, String unitId) {
    return getUnit(unitType, unitId);
}
```

该方法使用的缓存为UnitCache，并且手动指定缓存的key是`#unitType + Constants.SPLIT_STR + #unitId`的拼接结果。该缓存将在`#unitType != 'weapon'`时生效。

#### **缓存同步模式**

`@Cacheable`注解支持配置同步模式。在不同的Caffeine配置下，对是否开启同步模式进行观察。

| Caffeine缓存类型 | 是否开启同步 | 多线程读取不存在/已驱逐的key                       | 多线程读取待刷新的key                                        |
| :--------------- | :----------- | :------------------------------------------------- | :----------------------------------------------------------- |
| Cache            | 否           | 各自独立执行被注解方法                             | -                                                            |
| Cache            | 是           | 线程1执行被注解方法，线程2被阻塞，直至缓存更新完成 | -                                                            |
| LoadingCache     | 否           | 线程1执行`load()`，线程2被阻塞，直至缓存更新完成   | 线程1使用老值立即返回，并异步更新缓存值；线程2立即返回，不进行更新。 |
| LoadingCache     | 是           | 线程1执行被注解方法，线程2被阻塞，直至缓存更新完成 | 线程1使用老值立即返回，并异步更新缓存值；线程2立即返回，不进行更新。 |

从上面的总结可以看到，sync开启或关闭，在Cache和LoadingCache中的表现是不一致的：

-   Cache中，sync表示是否需要所有线程同步等待
-   LoadingCache中，sync表示在读取不存在/已驱逐的key时，是否执行被注解方法

事实上，Cache AOP的读取流程中并没有进行加锁处理，这个参数的实际表现形式是由缓存实现方决定的。在使用Caffeine Cache时，可以根据上表，快速找到合适的组合方式。

<br/>

### **Caffeine集成实战**

引入相关依赖：

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
  </dependency>
</dependencies>
```

这一部分主要是通过使用 Caffeine 对 User 进行缓存；

<br/>

#### **User结构**

User POJO 结构如下：

cache/caffeine/spring-boot/src/main/java/io/github/jasonkayzk/entity/User.java

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    private String id;

    private String userType;

    private String password;

}
```

<br/>

#### **缓存组件**

对于一个缓存，我们主要关心如下几个方面：

-   缓存名称：在`@Cacheable`注解中使用；
-   最大容量/缓存过期时间：驱逐策略使用；
-   更新时间：更新策略使用；
-   更新方法：用于`CacheLoader.load()`的实现；

因此可以定义一个基本配置类，使得我们实际使用的缓存配置都继承于它：

cache/caffeine/spring-boot/src/main/java/io/github/jasonkayzk/cache/BaseCaffeineCacheConfig.java

```java
@Data
public abstract class BaseCaffeineCacheConfig {

    /**
     * 缓存名称
     */
    private String name = "caffeine";
    /**
     * 默认最大容量，大于0生效
     */
    private int maxSize = 100;
    /**
     * 缓存过期时间（秒），大于0生效
     */
    private int expireDuration = -1;
    /**
     * 缓存刷新时间（秒），大于0生效，且表示这是一个LoadingCache，否则表示是一个普通Cache
     */
    private int refreshDuration = -1;

    private Cache<Object, Object> cache;

    /**
     * 获取特定缓存值
     * @param key key
     * @return 缓存值
     */
    public abstract Object getValue(Object key);

}
```

实际缓存类：

cache/caffeine/spring-boot/src/main/java/io/github/jasonkayzk/cache/UserCache.java

```java
@Service
@Getter
@EqualsAndHashCode(callSuper = true)
public class UserCache extends BaseCaffeineCacheConfig {

    /**
     * 缓存名称
     */
    private final String name = "UserCache";

    /**
     * 默认最大容量，大于0生效
     */
    private final int maxSize = 100;

    /**
     * 缓存过期时间（秒），大于0生效
     */
    private final int expireDuration = 86400;

    /**
     * 缓存刷新时间（秒），大于0生效，且表示这是一个LoadingCache，否则表示是一个普通Cache
     */
    private final int refreshDuration = 600;

    /**
     * 获取特定缓存值
     *
     * @param key key
     * @return 缓存值
     */
    public Object getValue(Object key) {
        String[] param = ((String) key).split(Constants.SPLIT_STR);
        return getUser(param[0], param[1]);
    }

    @Cacheable(value = "UserCache",
            key = "#userType + T(io.github.jasonkayzk.consts.Constants).SPLIT_STR + #userId",
            condition = "#userType != 'root'")
    public User getUser(String userType, String userId) {
        if ("1".equals(userId) && "admin".equals(userType)) {
            return new User("1", "admin", "admin-password");
        } else {
            return new User("999", "visitor", "no-password");
        }
    }

    @CacheEvict(value = "UserCache",
            key = "#userType + T(io.github.jasonkayzk.consts.Constants).SPLIT_STR + #userId",
            condition = "#userType != 'root'")
    public void deleteUser(String userType, String userId) {
    }
}
```

这里我们该类注解为`@Service`，方便后续调用方进行执行；

另外可以看到：`@Cacheable`注解在了实际业务使用的方法上，其缓存名正好是name自定指定的名称。另外，我们还需要使得`getValue()`方法调用被注解的业务方法，这一点是为了保证`load()`方法的正确执行；

在 SpringBoot 中注册：

cache/caffeine/spring-boot/src/main/java/io/github/jasonkayzk/cache/CaffeineCacheConfig.java

```java
@Slf4j
@Configuration
@EnableCaching
public class CaffeineCacheConfig {

    Logger logger = LoggerFactory.getLogger(CaffeineCacheConfig.class);

    @Resource
    private UserCache userCache;

    @Bean
    public CacheManager cacheManager() {
        // 添加所有创建的缓存，这里仅添加一个用于示例
        List<BaseCaffeineCacheConfig> cacheConfigs = new ArrayList<>();
        cacheConfigs.add(userCache);

        // 创建缓存管理器下的所有缓存
        SimpleCacheManager cacheManager = new SimpleCacheManager();
        ArrayList<CaffeineCache> caches = new ArrayList<>();
        for (BaseCaffeineCacheConfig config : cacheConfigs) {
            caches.add(new CaffeineCache(config.getName(), generateCache(config)));
            logger.info("registered cache: {}", config.getName());
        }
        cacheManager.setCaches(caches);
        return cacheManager;
    }

    /**
     * 生成cache，并开启统计功能
     *
     * @param config 配置信息
     * @return cache
     */
    private Cache<Object, Object> generateCache(BaseCaffeineCacheConfig config) {
        // 创建缓存
        Cache<Object, Object> cache;
        Caffeine<Object, Object> builder = Caffeine.newBuilder().recordStats();
        if (config.getMaxSize() > 0) {
            builder.maximumSize(config.getMaxSize());
        }
        if (config.getExpireDuration() > 0) {
            builder.expireAfterWrite(config.getExpireDuration(), TimeUnit.SECONDS);
        }
        if (config.getRefreshDuration() > 0) {
            // 创建LoadingCache，需要传入CacheLoader
            builder.refreshAfterWrite(config.getRefreshDuration(), TimeUnit.SECONDS);
            cache = builder.build(cacheLoader(config));
        } else {
            // 创建普通Cache
            cache = builder.build();
        }
        config.setCache(cache);
        return cache;
    }

    /**
     * 构造cache loader
     *
     * @param config 配置
     * @return cache loader
     */
    private CacheLoader<Object, Object> cacheLoader(BaseCaffeineCacheConfig config) {
        // 使用配置类中的getValue()方法
        return config::getValue;
    }
}
```

缓存管理器中，使用`@Resource`注解获得缓存配置类的实例，并将使用该配置生成对应的Cache交由SpringBoot管理；

需要注意：由于只有LoadingCache才可以使用`refreshAfterWrite()`方法，因此需要根据传入参数确定生成LoadingCache还是普通Cache；

另外需要注意的是，如果需要开启缓存功能，需要在SpringBoot启动类或者任意配置类上使用`@EnableCaching`注解；

<br/>

#### **在控制器中使用缓存**

cache/caffeine/spring-boot/src/main/java/io/github/jasonkayzk/controller/UserController.java

```java
@Slf4j
@RestController
@RequestMapping("/user")
public class UserController {

    @Resource
    private UserCache userCache;

    Logger logger = LoggerFactory.getLogger(UserController.class);

    @GetMapping("/{userType}/{userId}")
    public User getUser(@PathVariable String userType,
                        @PathVariable String userId) {
        logger.info("getUser: userType: {}, userId: {}", userType, userId);

        userCache.getCache().asMap().forEach((key, user) -> logger.info(user.toString()));
        return userCache.getUser(userType, userId);
    }

    @DeleteMapping("/{userType}/{userId}")
    public void deleteUser(@PathVariable String userType,
                           @PathVariable String userId) {
        userCache.deleteUser(userType, userId);
    }

    @GetMapping("/cachestat")
    public String cacheStat() {
        // 获取Cache实例，并调用stat()方法查看缓存情况
        return userCache.getCache().stats().toString();
    }
}
```

**注意：`@Cacheable` 注解是通过Spring AOP机制进行的，因此类内的调用将无法触发缓存操作，必须由外部进行调用；**

**同时注意到，在缓存配置类中增加了一个成员变量，并在`generateCache()`方法中将缓存对象传递过去：**

```java
public abstract class BaseCaffeineCacheConfig {
    private Cache<Object, Object> cache;
}

private Cache<Object, Object> generateCache(BaseCaffeineCacheConfig config) {
  config.setCache(cache);
  return cache;
}
```

**就可以调用相关统计方法了；**

<br/>

#### **测试**

启动服务，首先访问：http://127.0.0.1:8848/user/root/1

由于在上面的配置中：

```java
@Cacheable(value = "UserCache",
            key = "#userType + T(io.github.jasonkayzk.consts.Constants).SPLIT_STR + #userId",
            condition = "#userType != 'root'")
```

对于 `userType==root` 的不会缓存，因此返回默认的数据：

```json
{"id":"999","userType":"visitor","password":"no-password"}
```

并且访问：http://127.0.0.1:8848/user/cachestat

显示此时没有缓存：

```
CacheStats{hitCount=0, missCount=0, loadSuccessCount=0, loadFailureCount=0, totalLoadTime=0, evictionCount=0, evictionWeight=0}
```

随后，访问：http://127.0.0.1:8848/user/admin/1，返回：

```json
{"id":"1","userType":"admin","password":"admin-password"}
```

再访问：http://127.0.0.1:8848/user/visitor/1，返回：

```json
{"id":"999","userType":"visitor","password":"no-password"}
```

再次访问：http://127.0.0.1:8848/user/cachestat，查看缓存状态：

```
CacheStats{hitCount=0, missCount=2, loadSuccessCount=2, loadFailureCount=0, totalLoadTime=395541, evictionCount=0, evictionWeight=0}
```

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/java-all/tree/main/cache/caffeine
-   https://github.com/ben-manes/caffeine

参考文章：

-   https://www.javadevjournal.com/spring-boot/spring-boot-with-caffeine-cache/
-   https://www.baeldung.com/java-caching-caffeine
-   https://ghh3809.github.io/2021/05/31/caffeine/


<br/>
