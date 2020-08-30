---
title: EZShare项目总结-3
toc: true
date: 2020-01-25 13:50:28
cover: http://api.mtyqx.cn/api/random.php?21
categories: 项目总结
tags: [项目总结]
description: 本篇在第二篇的基础之上完成项目配置和Spring-Boot框架之间的整合, 最后通过完成Dict类的相关业务逻辑, 完成配置集成测试
---

本篇在第二篇的基础之上完成项目配置和Spring-Boot框架之间的整合, 然后完成了一些工具类的创建和单元测试, 最后通过完成Dict类的相关业务逻辑, 完成配置集成测试

具体代码见: https://github.com/JasonkayZK/EZShare

欢迎PR❤

<br/>

<!--more-->

## EZShare项目总结-3

本篇主要分为三个部分:

-   配置整合
-   通用工具类
-   Dict业务代码测试

<br/>

### 配置整合

**① Mybatis-Plus配置**

application.yml

```yaml
mybatis-plus:
  type-aliases-package: top.jasonkayzk.ezshare.system.entity,top.jasonkayzk.ezshare.job.entity,top.jasonkayzk.ezshare.file.entity
  mapper-locations: classpath:mapper/*/*.xml
  configuration:
    jdbc-type-for-null: null
  global-config:
    # 关闭mybatis-plus的banner
    banner: false
```

MybatisPlusConfig.java

```java
@Configuration
@MapperScan(value = {"top.jasonkayzk.ezshare.*.dao.mapper"})
public class MybatisPlusConfig {
    /**
     * 分页插件
     */
    @Bean
    public PaginationInterceptor paginationInterceptor() {
        return new PaginationInterceptor();
    }
}
```

><br/>
>
>**配置说明:**
>
>-   **type-aliases-package:** Model类存放处, 对象映射类
>-   **mapper-locations:** mapper.xml配置存放位置
>-   **MapperScan:** Mapper接口类存放位置
>-   **PaginationInterceptor:** 分页插件
>
>另外还需要加入依赖, 见: [关于Mybatis-plus调用baseMapper报错Invalid-bound-statement的解决](https://jasonkayzk.github.io/2020/01/25/关于Mybatis-plus调用baseMapper报错Invalid-bound-statement的解决/)

<br/>

**② Swagger配置**

application.yml

```yaml
# Swagger相关配置
swagger:
  enabled: true
  title: EZShare Application API
  basePackage: top.jasonkayzk.ezshare
  basePath=/**:
  description: upload, download, share, file-sharing system
  version: 1.0
  author: Jasonkay
  url: https://github.com/JasonkayZK/EZShare
  email: 271226192@qq.com
  license: Apache 2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0.html
  exclude-path: error, /ops/**
```

SwaggerConfig.java

```java
@Configuration
@EnableSwagger2
public class SwaggerConfig {

    @Value("${swagger.enabled}")
    private boolean enabled;

    @Value("${swagger.basePackage}")
    private String basePackage;

    @Value("${swagger.title}")
    private String title;

    @Value("${swagger.description}")
    private String description;

    @Value("${swagger.version}")
    private String version;

    @Value("${swagger.author}")
    private String author;

    @Value("${swagger.url}")
    private String url;

    @Value("${swagger.email}")
    private String email;

    @Value("${swagger.license}")
    private String license;

    @Value("${swagger.licenseUrl}")
    private String licenseUrl;

    @Bean
    public Docket createRestApi() {
        return new Docket(DocumentationType.SWAGGER_2)
                .enable(enabled)
                .apiInfo(apiInfo())
                .select()
                .apis(RequestHandlerSelectors.basePackage(basePackage))
                .paths(PathSelectors.any())
                .build()
                .securitySchemes(securitySchemes())
                .securityContexts(securityContexts());
    }

    /**
     * 项目信息
     */
    private ApiInfo apiInfo() {
        return new ApiInfoBuilder()
                .title(title)
                .description(description)
                .contact(new Contact(author, url, email))
                .termsOfServiceUrl(url)
                .license(license)
                .licenseUrl(licenseUrl)
                .version(version)
                .build();
    }

    /**
     * 配置认证模式
     */
    private List<ApiKey> securitySchemes() {
        return newArrayList(new ApiKey("Authorization", "Authorization", "header"));
    }

    /**
     * 配置认证上下文
     */
    private List<SecurityContext> securityContexts() {
        return newArrayList(SecurityContext.builder()
                .securityReferences(defaultAuth())
                .forPaths(PathSelectors.any())
                .build());
    }

    private List<SecurityReference> defaultAuth() {
        AuthorizationScope authorizationScope = new AuthorizationScope("global", "accessEverything");
        AuthorizationScope[] authorizationScopes = new AuthorizationScope[1];
        authorizationScopes[0] = authorizationScope;
        return newArrayList(new SecurityReference("Authorization", authorizationScopes));
    }
}
```

><br/>
>
>**更多详情见:** [SpringBoot集成Swagger](https://jasonkayzk.github.io/2020/01/02/SpringBoot集成Swagger/)

<br/>

**③ 缓存配置**

application.yml

```yaml
  redis:
    host: 127.0.0.1
    port: 6379
    password:
    jedis:
      pool:
        min-idle: 8
        max-idle: 500
        max-active: 2000
        max-wait: 10000
    timeout: 0
```

RedisConfig.java

```java
@Configuration
public class RedisConfig {

    @Value("${spring.redis.host}")
    private String host;

    @Value("${spring.redis.port}")
    private int port;

    @Value("${spring.redis.password}")
    private String password;

    @Value("${spring.redis.jedis.pool.min-idle}")
    private int minIdle;

    @Value("${spring.redis.jedis.pool.max-idle}")
    private int maxIdle;

    @Value("${spring.redis.jedis.pool.max-active}")
    private int maxActive;

    @Value("${spring.redis.jedis.pool.max-wait}")
    private long maxWaitMillis;

    @Value("${spring.redis.timeout}")
    private int timeout;

    @Value("${spring.redis.database:0}")
    private int database;

    /**
     * Jedis连接池配置
     *
     * @return JedisPool
     */
    @Bean
    public JedisPool redisPoolFactory() {
        JedisPoolConfig jedisPoolConfig = new JedisPoolConfig();

        jedisPoolConfig.setMaxIdle(maxIdle);
        jedisPoolConfig.setMaxWaitMillis(maxWaitMillis);
        jedisPoolConfig.setMaxTotal(maxActive);
        jedisPoolConfig.setMinIdle(minIdle);

        return StringUtils.isNotBlank(password) ?
                new JedisPool(jedisPoolConfig, host, port, timeout, password, database)
                :
                new JedisPool(jedisPoolConfig, host, port, timeout, null, database);
    }

    /**
     * Jedis连接配置: Standalone, Sentinel或RedisCluster
     *
     * @return JedisConnectionFactory
     */
    @Bean(name = "redisConnectionFactory")
    public JedisConnectionFactory jedisConnectionFactory() {
        RedisStandaloneConfiguration redisStandaloneConfiguration = new RedisStandaloneConfiguration();
        redisStandaloneConfiguration.setHostName(host);
        redisStandaloneConfiguration.setPort(port);
        redisStandaloneConfiguration.setPassword(RedisPassword.of(password));
        redisStandaloneConfiguration.setDatabase(database);

        JedisClientConfiguration.JedisClientConfigurationBuilder jedisClientConfiguration = JedisClientConfiguration.builder();
        jedisClientConfiguration.connectTimeout(Duration.ofMillis(timeout));
        jedisClientConfiguration.usePooling();
        return new JedisConnectionFactory(redisStandaloneConfiguration, jedisClientConfiguration.build());
    }

    @Bean
    @ConditionalOnMissingBean(StringRedisTemplate.class)
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory redisConnectionFactory) {
        StringRedisTemplate template = new StringRedisTemplate();
        template.setConnectionFactory(redisConnectionFactory);
        return template;
    }

    /**
     * 自定义redis序列化的机制,重新定义一个ObjectMapper.防止和MVC的冲突
     *
     * @return RedisSerializer
     */
    @Bean
    public RedisSerializer<Object> redisSerializer() {
        ObjectMapper objectMapper = new ObjectMapper();

        //反序列化时候遇到不匹配的属性并不抛出异常
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        //序列化时候遇到空对象不抛出异常
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);

        //反序列化的时候如果是无效子类型,不抛出异常
        objectMapper.configure(DeserializationFeature.FAIL_ON_INVALID_SUBTYPE, false);

        //不使用默认的dateTime进行序列化,
        objectMapper.configure(SerializationFeature.WRITE_DATE_KEYS_AS_TIMESTAMPS, false);

        //使用JSR310提供的序列化类,里面包含了大量的JDK8时间序列化类
        objectMapper.registerModule(new JavaTimeModule());

        //启用反序列化所需的类型信息,在属性中添加@class
        objectMapper.activateDefaultTyping(LaissezFaireSubTypeValidator.instance, ObjectMapper.DefaultTyping.NON_FINAL, JsonTypeInfo.As.PROPERTY);

        //配置null值的序列化器
        GenericJackson2JsonRedisSerializer.registerNullValueSerializer(objectMapper, null);

        return new GenericJackson2JsonRedisSerializer(objectMapper);
    }

    @Bean
    public RedisTemplate<Object, Object> redisTemplate(RedisConnectionFactory redisConnectionFactory, RedisSerializer<Object> redisSerializer) {
        RedisTemplate<Object, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(redisConnectionFactory);
        template.setDefaultSerializer(redisSerializer);
        template.setValueSerializer(redisSerializer);
        template.setHashValueSerializer(redisSerializer);
        template.setKeySerializer(StringRedisSerializer.UTF_8);
        template.setHashKeySerializer(StringRedisSerializer.UTF_8);
        template.afterPropertiesSet();
        return template;
    }

}
```

CacheConfig.java

```java
@Configuration
@EnableCaching
public class CacheConfig extends CachingConfigurerSupport {

    @Value("${ezshare.cache.prefix}")
    private String cachePrefix;

    /**
     * 缓存管理器, 选择redis作为默认缓存工具
     *
     * @return CacheManager
     */
    @Bean
    public CacheManager cacheManager(@Qualifier("redisConnectionFactory") RedisConnectionFactory factory, RedisSerializer<Object> redisSerializer) {
        return RedisCacheManager.builder(factory)
                .cacheDefaults(getRedisCacheConfigurationWithTtl(redisSerializer))
                .build();
    }

    private RedisCacheConfiguration getRedisCacheConfigurationWithTtl(RedisSerializer<Object> redisSerializer) {
        RedisCacheConfiguration redisCacheConfiguration = RedisCacheConfiguration.defaultCacheConfig();
        redisCacheConfiguration = redisCacheConfiguration
                .prefixKeysWith(cachePrefix)
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(redisSerializer))
                .entryTtl(Duration.ofMinutes(60));

        return redisCacheConfiguration;
    }

    /**
     * Key生成策略
     * <p>
     * 当没有指定缓存的 key时来根据类名、方法名和方法参数来生成key
     *
     * @return KeyGenerator
     */
    @Bean
    public KeyGenerator wiselyKeyGenerator() {
        return (target, method, params) -> {
            StringBuilder sb = new StringBuilder();
            sb.append(target.getClass().getName())
                    .append(':')
                    .append(method.getName());
            if (params.length > 0) {
                sb.append('[');
                for (Object obj : params) {
                    if (obj != null) {
                        sb.append(obj.toString());
                    }
                }
                sb.append(']');
            }
            return sb.toString();
        };
    }

}
```

><br/>
>
>**配置说明:**
>
>-   **RedisConfig**: 主要进行Jedis连接, 连接池配置, 以及Redis的序列化和模板配置
>-   **CacheConfig**: 主要进行Spring Cache相关的配置, 包括: 缓存管理器, 键生成策略, 缓存前缀, 连接管理(重试等)

<br/>

**④ 异步线程池配置**

AsyncExecutorPoolConfig.java

```java
@Configuration
public class AsyncExecutorPoolConfig extends AsyncConfigurerSupport {

    @Bean
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(100);
        executor.setKeepAliveSeconds(30);
        executor.setThreadNamePrefix("asyncTaskExecutor-");

        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        return executor;
    }

}
```

<br/>

### 通用工具类

|      **类名**       |            **说明**            |                           **注释**                           |
| :-----------------: | :----------------------------: | :----------------------------------------------------------: |
| **ApplicationUtil** |            应用整体            |                        应用整体工具类                        |
|    **SortUtil**     | 封装Mybatis-Plus分页策略的排序 |                 针对分页请求和Wrapper包装类                  |
|  **QueryRequest**   |         分页请求实体类         | 对pageSize, pageNum, sortField和sortOrder等分页参数的包装POJO |
|  **TimeConverter**  |       时间日期转换工具类       |                 Excel导出时间类型字段格式化                  |
|  **CronValidator**  |        Cron表达式校验类        |                  校验是否为合法的Cron表达式                  |
| **BaseController**  |        通用Controller类        |               用在存在分页场景下(返回分页信息)               |

<br/>

### Dict业务代码测试

**Entity实体类**

```java
/**
 * @author Jasonkay
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("t_dict")
@Excel("应用字典表")
public class Dict implements Serializable {

    private static final long serialVersionUID = 285231985684474002L;

    /**
     * 字典ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 键
     */
    @NotBlank(message = "{required}")
    @Size(max = 10, message = "{noMoreThan}")
    @ExcelField(value = "键")
    private String dictKey;

    /**
     * 值
     */
    @NotBlank(message = "{required}")
    @Size(max = 20, message = "{noMoreThan}")
    @ExcelField(value = "值")
    private String dictValue;

    /**
     * 字段名称
     */
    @NotBlank(message = "{required}")
    @Size(max = 20, message = "{noMoreThan}")
    @ExcelField(value = "字段名")
    private String fieldName;

    /**
     * 表名
     */
    @NotBlank(message = "{required}")
    @Size(max = 20, message = "{noMoreThan}")
    @ExcelField(value = "表名")
    private String tableName;

    /**
     * 创建时间
     */
    @ExcelField(value = "创建时间", writeConverter = TimeConverter.class)
    private LocalDateTime createTime;

    /**
     * 修改时间
     */
    @ExcelField(value = "修改时间", writeConverter = TimeConverter.class)
    private LocalDateTime modifyTime;

    /**
     * 做数据库时间段的查询字段
     */
    private transient String timeFrom;
    private transient String timeTo;

}
```

<br/>

**Mapper映射类**

DictMapper.java和DictMapper.xml均为代码生成

具体见: [EZShare项目总结-2](https://jasonkayzk.github.io/2020/01/22/EZShare项目总结-2/)

<br/>

**Service业务类**

IDictService.java

```java
/**
 * @author Jasonkay
 */
public interface IDictService extends IService<Dict> {

    /**
     * 分页查询字典
     *
     * @param request 分页请求
     *
     * @param dict 查询字典实体
     *
     * @return 字典列表
     */
    IPage<Dict> findDicts(QueryRequest request, Dict dict);

    /**
     * 根据Id查询Dict
     *
     * @param id 字典的Id
     *
     * @return Dict
     */
    Dict findDictById(Long id);

    /**
     * 插入字典
     *
     * @param dict 字典实体
     */
    void createDict(Dict dict);

    /**
     * 更新字典
     *
     * @param dict 字典实体
     */
    void updateDict(Dict dict);

    /**
     * 根据Id批量删除字典
     *
     * @param dictIds 字典Id列表
     */
    void deleteDicts(String[] dictIds);

}
```

DictServiceImpl.java

```java
/**
 * @author Jasonkay
 */
@Slf4j
@Service("dictService")
@Transactional(propagation = Propagation.SUPPORTS, readOnly = true, rollbackFor = Exception.class)
public class DictServiceImpl extends ServiceImpl<DictMapper, Dict> implements IDictService {

    @Override
    public IPage<Dict> findDicts(QueryRequest request, Dict dict) {
        try {
            LambdaQueryWrapper<Dict> queryWrapper = new LambdaQueryWrapper<>();

            if (StringUtils.isNotBlank(dict.getDictKey())) {
                queryWrapper.eq(Dict::getDictKey, dict.getDictKey());
            }
            if (StringUtils.isNotBlank(dict.getDictValue())) {
                queryWrapper.eq(Dict::getDictValue, dict.getDictValue());
            }
            if (StringUtils.isNotBlank(dict.getTableName())) {
                queryWrapper.eq(Dict::getTableName, dict.getTableName());
            }
            if (StringUtils.isNotBlank(dict.getFieldName())) {
                queryWrapper.eq(Dict::getFieldName, dict.getFieldName());
            }

            Page<Dict> page = new Page<>();
            SortUtil.handlePageSort(request, page, true);

            return this.page(page, queryWrapper);
        } catch (Exception e) {
            log.error("获取字典信息失败", e);
            return null;
        }
    }

    @Override
    public Dict findDictById(Long id) {
        return this.baseMapper.selectById(id);
    }

    @Override
    @Transactional
    public void createDict(Dict dict) {
        this.baseMapper.insert(dict);
    }

    @Override
    @Transactional
    public void updateDict(Dict dict) {
        this.baseMapper.updateById(dict);
    }

    @Override
    @Transactional
    @CacheEvict(value = "dicts", allEntries = true)
    public void deleteDicts(String[] dictIds) {
        this.baseMapper.deleteBatchIds(Arrays.asList(dictIds));
    }

}
```

<br/>

**Controller视图控制器**

DictController.java

```java
/**
 * @author Jasonkay
 */
@Slf4j
@Validated
@RestController
@RequestMapping("/system/dict")
public class DictController extends BaseController {

    private String logMessage;

    private final IDictService dictService;

    public DictController(IDictService dictService) {
        this.dictService = dictService;
    }

    @GetMapping
//    @RequiresPermissions("dict:view")
    public Map<String, Object> getDictList(QueryRequest request, Dict dict) {
        return getDataTable(this.dictService.findDicts(request, dict));
    }

    @GetMapping("/{id}")
//    @RequiresPermissions("dict:select")
    public Dict getDict(@PathVariable Long id) {
        return this.dictService.findDictById(id);
    }

    @Log("新增字典")
    @PostMapping
//    @RequiresPermissions("dict:add")
    public void addDict(@Valid Dict dict) throws EzShareException {
        try {
            this.dictService.createDict(dict);
        } catch (Exception e) {
            logMessage = "新增字典失败";
            log.error(logMessage, e);
            throw new EzShareException(logMessage);
        }
    }

    @Log("修改字典")
    @PutMapping
//    @RequiresPermissions("dict:update")
    public void updateDict(@Valid Dict dict) throws EzShareException {
        try {
            this.dictService.updateDict(dict);
        } catch (Exception e) {
            logMessage = "修改字典失败";
            log.error(logMessage, e);
            throw new EzShareException(logMessage);
        }
    }

    @Log("删除字典")
    @DeleteMapping("/{dictIds}")
//    @RequiresPermissions("dict:delete")
    public void deleteDicts(@NotBlank(message = "{required}") @PathVariable String dictIds) throws EzShareException {
        try {
            String[] ids = dictIds.split(StringPool.COMMA);
            this.dictService.deleteDicts(ids);
        } catch (Exception e) {
            logMessage = "删除字典失败";
            log.error(logMessage, e);
            throw new EzShareException(logMessage);
        }
    }

    @PostMapping("excel")
//    @RequiresPermissions("dict:export")
    public void export(QueryRequest request, Dict dict, HttpServletResponse response) throws EzShareException {
        try {
            List<Dict> dicts = this.dictService.findDicts(request, dict).getRecords();
            ExcelKit.$Export(Dict.class, response).downXlsx(dicts, false);
        } catch (Exception e) {
            logMessage = "导出Excel失败";
            log.error(logMessage, e);
            throw new EzShareException(logMessage);
        }
    }

}
```

><br/>
>
>**说明:**
>
>**Mapper, Service分别继承了BaseMapper和ServiceImpl实现了基本的CRUD方法**
>
>**无mapper.xml也可直接进行单表操作**

<br/>

**测试**

通过IDEA的REST Client插件进行CRUD测试和Excel导出测试, 并看到Redis中成功加入K-V, 没问题~

<br/>

### 总结

因为一个Mybatis-Plus的依赖没有添加, 浪费了很长时间, 加上大年初一头脑也不太清晰, 不过最终还是完成~

>   <br/>
>
>   **说明: 由于缓存暂时不需要, 代码中未体现, 可通过在业务方法加入@Cacheable注解测试**

<br/>