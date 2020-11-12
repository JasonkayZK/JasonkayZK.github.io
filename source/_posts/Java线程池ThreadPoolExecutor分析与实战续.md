---
title: Java线程池ThreadPoolExecutor分析与实战续
cover: https://acg.yanwz.cn/api.php?8
toc: true
date: 2020-03-04 17:07:47
categories: 并发编程
tags: [并发编程, 线程池, Java源码]
description: 在上一篇线程池的文章中, 手写了一个简单的线程池. 这篇紧接着上一篇, 通过分析JUC线程池源码, 来看看JDK中是如何设计线程池的
---

在上一篇[Java线程池ThreadPoolExecutor分析与实战](https://jasonkayzk.github.io/2020/02/06/Java线程池ThreadPoolExecutor分析与实战/)的文章中, 手写了一个简单的线程池. 这篇紧接着上一篇, 通过分析JUC线程池源码, 来看看JDK中是如何设计线程池的


本文内容包括:

- Executor接口
    -   Executor接口源码分析
    -   Executor两级调度模型
    -   Executor结构
- ExecutorService接口源码分析
- AbstractExecutorService抽象类源码分析
- 四种类型的线程池
    -   ThreadPoolExecutor提供的构造函数
    -   线程池的处理流程
    -   四种线程池(Fixed, Cached, Single, Scheduled
    -   如何选择合适的线程池

文章部分节选自: [Java线程池-ThreadPoolExecutor原理分析与实战](https://blog.csdn.net/z_s_z2016/article/details/81674893)

源代码分析基于JDK11.0.5

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>

<!--more-->

系列文章入口:

-   [Java线程池ThreadPoolExecutor分析与实战](https://jasonkayzk.github.io/2020/02/06/Java线程池ThreadPoolExecutor分析与实战/)
-   [Java线程池ThreadPoolExecutor分析与实战续](https://jasonkayzk.github.io/2020/03/04/Java线程池ThreadPoolExecutor分析与实战续/)
-   [Java线程池ThreadPoolExecutor分析与实战终](https://jasonkayzk.github.io/2020/03/05/Java线程池ThreadPoolExecutor分析与实战终/)

<br/>

## Java线程池ThreadPoolExecutor分析与实战续

在上一篇[Java线程池ThreadPoolExecutor分析与实战](https://jasonkayzk.github.io/2020/02/06/Java线程池ThreadPoolExecutor分析与实战/)的文章中, 手写了一个简单的线程池. 展示了线程池实现的基本原理;

在讲述线程池源码之前, (不厌其烦的)先来看看, 我们为什么需要使用线程池:

-   **减少资源的开销:** 减少了每次创建线程、销毁线程的开销
-   **提高响应速度:** 每次请求到来时，由于线程的创建已经完成，故可以直接执行任务，因此提高了响应速度
-   **提高线程的可管理性:** 线程是一种稀缺资源，若不加以限制，不仅会占用大量资源，而且会影响系统的稳定性; 线程池可以对线程的创建与停止、线程数量等等因素加以控制，使得线程在一种可控的范围内运行，不仅能保证系统稳定运行，而且方便性能调优

下图为ThreadPoolExecutor的继承关系:

![Executor.png](https://img-blog.csdn.net/20180814213209369?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3pfc196MjAxNg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

-   最底层为Executor接口
-   ExecutorService接口继承了Executor, 进一步抽象了一个(执行服务)线程池应该具有的方法, 如: 提交任务, 关闭等;
-   AbstractExecutorService实现了ExecutorService的所有方法, 但是被声明为abstract(作为抽象)被ThreadPoolExecutor和ForkJoinPool继承
-   ThreadPoolExecutor继承了AbstractExecutorService, 是线程池的底层实现类

><br/>
>
>有关ForkJoin的介绍参考我的另一篇文章: [并发排序从ForkJoin到Stream](https://jasonkayzk.github.io/2020/02/25/并发排序从ForkJoin到Stream/)
>
>**ForkJoin在JDK 7加入的, 是实现Java Stream流并发操作底层实现的核心!**

下面让我们自底向上看一看线程池的实现原理

<br/>

## 一.Executor接口

首先来看一下Executor接口:

```java
package java.util.concurrent;

/**
 * 执行提交{@link Runnable}任务的对象
 * 此接口提供了一种将任务提交与每个任务的运行机制分离的方法: 包括线程使用、调度等的详细信息
 * (使用时)通常使用{@code Executor}，而不是显式创建线程
 *
 * 例如，与其为一组任务调用:
 * new Thread(new RunnableTask().start()
 * new Thread(new RunnableTask().start()
 * new Thread(new RunnableTask().start()
 * 不如使用：
 * Executor executor = anExecutor();
 * executor.execute(new RunnableTask1());
 * executor.execute(new RunnableTask2());
 *
 * An object that executes submitted {@link Runnable} tasks. This
 * interface provides a way of decoupling task submission from the
 * mechanics of how each task will be run, including details of thread
 * use, scheduling, etc.  An {@code Executor} is normally used
 * instead of explicitly creating threads. For example, rather than
 * invoking {@code new Thread(new RunnableTask()).start()} for each
 * of a set of tasks, you might use:
 *
 * <pre> {@code
 * Executor executor = anExecutor();
 * executor.execute(new RunnableTask1());
 * executor.execute(new RunnableTask2());
 * ...}</pre>
 *
 * 但是{@code Executor}接口并不严格要求执行是异步的
 * 在最简单的情况下，执行器可以在调用线程中立即运行提交的任务：
 * 
 * class DirectExecutor implements Executor {
 *   public void execute(Runnable r) {
 *     r.run();
 *   }
 *
 * However, the {@code Executor} interface does not strictly require
 * that execution be asynchronous. In the simplest case, an executor
 * can run the submitted task immediately in the caller's thread:
 *
 * <pre> {@code
 * class DirectExecutor implements Executor {
 *   public void execute(Runnable r) {
 *     r.run();
 *   }
 * }}</pre>
 *
 * 更经典的使用是: 任务是在调用线程以外的某个线程中执行的
 * 下面的执行器为每个任务生成一个新线程:
 * 
 * class ThreadPerTaskExecutor implements Executor {
 *   public void execute(Runnable r) {
 *     new Thread(r).start();
 * }
 *
 * More typically, tasks are executed in some thread other than the
 * caller's thread.  The executor below spawns a new thread for each
 * task.
 *
 * <pre> {@code
 * class ThreadPerTaskExecutor implements Executor {
 *   public void execute(Runnable r) {
 *     new Thread(r).start();
 *   }
 * }}</pre>
 *
 * 许多{@code Executor}实现对任务的调度方式和时间施加某种限制
 * 下面的执行器将任务的提交序列化到第二个执行器，以展示复合执行器的使用:
 *
 * class SerialExecutor implements Executor {
 *   final Queue<Runnable> tasks = new ArrayDeque<>();
 *   final Executor executor;
 *   Runnable active;
 *
 *   SerialExecutor(Executor executor) {
 *     this.executor = executor;
 *   }
 *
 *   public synchronized void execute(Runnable r) {
 *     tasks.add(() -> {
 *       try {
 *         r.run();
 *       } finally {
 *         scheduleNext();
 *       }
 *     });
 *     if (active == null) {
 *       scheduleNext();
 *     }
 *   }
 *
 *   protected synchronized void scheduleNext() {
 *     if ((active = tasks.poll()) != null) {
 *       executor.execute(active);
 *     }
 *   }
 * }
 *
 * Many {@code Executor} implementations impose some sort of
 * limitation on how and when tasks are scheduled.  The executor below
 * serializes the submission of tasks to a second executor,
 * illustrating a composite executor.
 *
 * <pre> {@code
 * class SerialExecutor implements Executor {
 *   final Queue<Runnable> tasks = new ArrayDeque<>();
 *   final Executor executor;
 *   Runnable active;
 *
 *   SerialExecutor(Executor executor) {
 *     this.executor = executor;
 *   }
 *
 *   public synchronized void execute(Runnable r) {
 *     tasks.add(() -> {
 *       try {
 *         r.run();
 *       } finally {
 *         scheduleNext();
 *       }
 *     });
 *     if (active == null) {
 *       scheduleNext();
 *     }
 *   }
 *
 *   protected synchronized void scheduleNext() {
 *     if ((active = tasks.poll()) != null) {
 *       executor.execute(active);
 *     }
 *   }
 * }}</pre>
 *
 * 此包中提供的{@code Executor}实现了{@link ExecutorService}，这是一个更广泛的接口
 * 而{@link ThreadPoolExecutor}类提供了一个可扩展的线程池实现
 * {@link Executors}类为这些执行器提供了方便的工厂方法
 *
 * The {@code Executor} implementations provided in this package
 * implement {@link ExecutorService}, which is a more extensive
 * interface.  The {@link ThreadPoolExecutor} class provides an
 * extensible thread pool implementation. The {@link Executors} class
 * provides convenient factory methods for these Executors.
 *
 * 内存一致性影响: 
 * 先前提交给Executor中的对象，线程中操作的执行可能是在另一个线程中
 * (此处想说的可能是不要忽略了内存一致性问题, 即一个对象可能在两个线程中同时访问?)
 *
 * <p>Memory consistency effects: Actions in a thread prior to
 * submitting a {@code Runnable} object to an {@code Executor}
 * <a href="package-summary.html#MemoryVisibility"><i>happen-before</i></a>
 * its execution begins, perhaps in another thread.
 *
 * @since 1.5
 * @author Doug Lea
 */
public interface Executor {

    /**
     * 在将来的某个时间执行给定的任务
     * 该任务可以在新线程、线程池或调用线程中执行，具体由{@code Executor}实现决定
     *
     * Executes the given command at some time in the future.  The command
     * may execute in a new thread, in a pooled thread, or in the calling
     * thread, at the discretion of the {@code Executor} implementation.
     *
     * @param command 可运行的任务(继承自Runnable接口)
     * @throws 如果无法接受执行此任务抛出: RejectedExecutionException
     * @throws 如果command为空抛出: NullPointerException 
     *
     * @param command the runnable task
     * @throws RejectedExecutionException if this task cannot be
     * accepted for execution
     * @throws NullPointerException if command is null
     */
    void execute(Runnable command);
}
```

上面为Executor的源码, 其中仅仅定义了一个方法: `void execute(Runnable command);`

><br/>
>
>**小贴士:**
>
>**上面代码含有大量的英文注释. 实际上在阅读源码时, 应当仔细阅读这些注释.**
>
>此外, 保留了JDK 1.5: 说明是JDK 1.5加入的
>
>另外保留了**代码的作者[Doug Lea](https://baike.baidu.com/item/Doug%20Lea/6319404?fr=aladdin), 整个JUC包几乎全部出自此人之手, JCP([Java](https://baike.baidu.com/item/Java/85979)社区项目)中的一员**

上面注释所说的, 简单来说其实就2个事情:

-   **为什么定义这个接口？**

**让任务的执行和如何执行这个任务(包括线程，调度等)这两个方面解耦**

-   **这个接口的主要用法:**

```java
Executor executor = anExecutor;
executor.execute(new RunnableTask1());
executor.execute(new RunnableTask2());

其中，不同的实现类中的execute执行方式都不尽相同
可以在execute方法中再新建一个线程执行，也可以在execute方法中按某一调度策略执行任务
```

****

### Executor两级调度模型

![Executor两级调度模型.png](https://img-blog.csdn.net/20180814215814755?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3pfc196MjAxNg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

<font color="#f00">在HotSpot虚拟机中: **Java中的线程将会被一一映射为操作系统的线程(所以创建和销毁线程的需要从用户态切换到内核态, 开销很大!)**</font>

Java虚拟机层面，用户将多个任务提交给Executor框架, Executor负责分配线程执行它们;

转入操作系统层面，操作系统再将这些线程分配给处理器执行;

****

### Executor结构

![Executor结构.png](https://img-blog.csdn.net/20180814220037405?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3pfc196MjAxNg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

Executor框架中的所有类可以分成三类:

**① 任务**

任务有两种类型: 

<font color="#f00">**Runnable接口和Callable接口, 分别代表无返回值和有返回值的并发调用**</font>

**② 任务执行器**

Executor框架**最核心的接口是Executor，它表示任务的执行器**

Executor的**子接口为ExecutorService**

而ExecutorService有两大实现类：ThreadPoolExecutor和ScheduledThreadPoolExecutor

<font color="#f00">**在调用时, execute代表无返回调用, 而submit方法为有返回值调用**</font>

**③ 执行结果**

**Future接口表示异步的执行结果，它的实现类为FutureTask**

<br/>

## 二.ExecutorService接口

前面讲到, ExecutorService继承了Executor, 进一步抽象了一个执行类服务的方法

下面来看他的源码:

```java
package java.util.concurrent;

import java.util.Collection;
import java.util.List;

/**
 * (本接口是一个)提供终止的方法的Executor
 * 以及可以生成Future以跟踪一个或多个异步任务的进度的方法的Executor
 *
 * An {@link Executor} that provides methods to manage termination and
 * methods that can produce a {@link Future} for tracking progress of
 * one or more asynchronous tasks.
 *
 * 实现了ExecutorService接口的类可以关闭，这将导致它拒绝新任务
 * 它提供了两种不同的方法来关闭:
 * shutdown方法将允许在终止之前执行以前提交的任务;
 * 而shutdownNow方法将阻止等待的任务启动并尝试停止当前执行的任务
 * 在终止时，(应当保证)执行者没有正在执行的任务，没有等待执行的任务，并且不能提交新任务
 * 应该关闭未使用的ExecutorService，以允许回收其资源
 *
 * <p>An {@code ExecutorService} can be shut down, which will cause
 * it to reject new tasks.  Two different methods are provided for
 * shutting down an {@code ExecutorService}. The {@link #shutdown}
 * method will allow previously submitted tasks to execute before
 * terminating, while the {@link #shutdownNow} method prevents waiting
 * tasks from starting and attempts to stop currently executing tasks.
 * Upon termination, an executor has no tasks actively executing, no
 * tasks awaiting execution, and no new tasks can be submitted.  An
 * unused {@code ExecutorService} should be shut down to allow
 * reclamation of its resources.
 *
 * 方法submit扩展了父接口Executor通过创建并返回Future来执行Runnable
 * 该Future用于取消执行或等待完成
 * 方法invokeAny和invokeAll使用最常用的批量执行形式，执行任务集合
 * 然后等待至少一个或所有任务完成
 * 类ExecutorCompletionService可用于编写这些方法的自定义变体
 *
 * <p>Method {@code submit} extends base method {@link
 * Executor#execute(Runnable)} by creating and returning a {@link Future}
 * that can be used to cancel execution and/or wait for completion.
 * Methods {@code invokeAny} and {@code invokeAll} perform the most
 * commonly useful forms of bulk execution, executing a collection of
 * tasks and then waiting for at least one, or all, to
 * complete. (Class {@link ExecutorCompletionService} can be used to
 * write customized variants of these methods.)
 *
 * Executors类为此包中提供的执行器服务提供工厂方法
 *
 * <p>The {@link Executors} class provides factory methods for the
 * executor services provided in this package.
 *
 *  使用例子
 *
 * <h3>Usage Examples</h3>
 *
 * 下面是一个网络服务的草图，其中线程池中的线程服务接收请求
 * 它使用预配置的Executors.newFixedThreadPool工厂方法：
 *
 * Here is a sketch of a network service in which threads in a thread
 * pool service incoming requests. It uses the preconfigured {@link
 * Executors#newFixedThreadPool} factory method:
 *
 * <pre> {@code
 * // 网络业务Server类
 * class NetworkService implements Runnable {
 *   private final ServerSocket serverSocket;
 *   private final ExecutorService pool;
 *
 *   // 初始化Server
 *   public NetworkService(int port, int poolSize)
 *       throws IOException {
 *     serverSocket = new ServerSocket(port);
 *     pool = Executors.newFixedThreadPool(poolSize);
 *   }
 *
 *   public void run() { // run the service
 *     try {
 *       for (;;) {
 *        // 每接收到一个请求, 就从线程池中取出一个线程进行操作
 *         pool.execute(new Handler(serverSocket.accept()));
 *       }
 *     } catch (IOException ex) {
 *       pool.shutdown();
 *     }
 *   }
 * }
 *
 * // 业务方法, 处理客户端请求
 * class Handler implements Runnable {
 *   private final Socket socket;
 *   Handler(Socket socket) { this.socket = socket; }
 *   public void run() {
 *     // read and service request on socket
 *   }
 * }}</pre>
 *
 * 以下方法分两个阶段关闭ExecutorService:
 * 首先通过调用shutdown拒绝传入任务，然后在必要时调用shutdownNow取消任何延迟的任务
 *
 * <pre> {@code
 * void shutdownAndAwaitTermination(ExecutorService pool) {
 *   pool.shutdown(); // 停止新任务的加入
 *   try {
 *     // 等待当前任务的结束
 *     if (!pool.awaitTermination(60, TimeUnit.SECONDS)) {
 *       pool.shutdownNow(); // 撤销当前执行中的任务
 *       // 等待任务响应被取消
 *       if (!pool.awaitTermination(60, TimeUnit.SECONDS))
 *           System.err.println("Pool did not terminate");
 *     }
 *   } catch (InterruptedException ie) {
 *     // 如果当前线程也被中断，则(重新-)取消
 *     pool.shutdownNow();
 *     // Preserve interrupt status
 *     Thread.currentThread().interrupt();
 *   }
 * }}</pre>
 * @since 1.5
 * @author Doug Lea
 */
public interface ExecutorService extends Executor {

    /**
     * 启动有序关闭，在该关闭中: 继续执行以前提交的任务，但不接受新任务
     * 如果已关闭，则调用没有其他效果
     *
     * Initiates an orderly shutdown in which previously submitted
     * tasks are executed, but no new tasks will be accepted.
     * Invocation has no additional effect if already shut down.
     *
     * 此方法不等待以前提交的任务完成执行
     * 使用awaitTermination方法执行此操作
     *
     * <p>This method does not wait for previously submitted tasks to
     * complete execution.  Use {@link #awaitTermination awaitTermination}
     * to do that.
     *
     * 如果安全管理器存在并且关闭此执行器服务可能会操作调用方不允许修改的线程
     * (因为它不持有java.lang.RuntimePermission)
     * 或者安全管理器的{@code checkAccess}方法拒绝访问
     * 将会抛出SecurityException
     *
     * @throws SecurityException if a security manager exists and
     *         shutting down this ExecutorService may manipulate
     *         threads that the caller is not permitted to modify
     *         because it does not hold {@link
     *         java.lang.RuntimePermission}{@code ("modifyThread")},
     *         or the security manager's {@code checkAccess} method
     *         denies access.
     */
    void shutdown();

    /**
     * 尝试停止所有正在执行的任务，停止处理等待的任务，并返回等待执行的任务列表
     *
     * Attempts to stop all actively executing tasks, halts the
     * processing of waiting tasks, and returns a list of the tasks
     * that were awaiting execution.
     *
     * 此方法不等待以前提交的任务完成执行
     * 使用awaitTermination方法执行此操作
     *
     * <p>This method does not wait for actively executing tasks to
     * terminate.  Use {@link #awaitTermination awaitTermination} to
     * do that.
     *
     * 除了尽最大努力尝试停止处理正在积极执行的任务之外，没有任何保证
     * 例如，典型的实现将通过Thread#interrupt取消
     * 因此任何未能响应中断的任务都可能永远不会终止
     *
     * <p>There are no guarantees beyond best-effort attempts to stop
     * processing actively executing tasks.  For example, typical
     * implementations will cancel via {@link Thread#interrupt}, so any
     * task that fails to respond to interrupts may never terminate.
     *
     * @return 从未开始执行的任务列表
     * @throws SecurityException if a security manager exists and
     *         shutting down this ExecutorService may manipulate
     *         threads that the caller is not permitted to modify
     *         because it does not hold {@link
     *         java.lang.RuntimePermission}{@code ("modifyThread")},
     *         or the security manager's {@code checkAccess} method
     *         denies access.
     */
    List<Runnable> shutdownNow();

    /**
     * 如果此执行器已关闭，则返回true
     *
     * @return {@code true} if this executor has been shut down
     */
    boolean isShutdown();

    /**
     * 如果关闭后所有任务都已完成，则返回true
     * 注意isTerminated永远不是true，除非首先调用shutdownshutdownNow方法
     *
     * Returns {@code true} if all tasks have completed following shut down.
     * Note that {@code isTerminated} is never {@code true} unless
     * either {@code shutdown} or {@code shutdownNow} was called first.
     *
     * @return {@code true} if all tasks have completed following shut down
     */
    boolean isTerminated();

    /**
     * 阻塞，直到所有任务在关闭请求后完成执行
     * 或发生超时，或当前线程中断(以先发生者为准)
     *
     * Blocks until all tasks have completed execution after a shutdown
     * request, or the timeout occurs, or the current thread is
     * interrupted, whichever happens first.
     *
     * @param timeout 最长等待时间
     * @param unit timeout参数的时间单位
     * @return {@code true}如果此执行器终止，{@code false}如果在终止之前超时
     * @throws InterruptedException if interrupted while waiting
     */
    boolean awaitTermination(long timeout, TimeUnit unit)
        throws InterruptedException;

    /**
     * 提交一个有返回值的任务以供执行，并返回表示该任务的执行结果的Future类
     * Future的{@code get}方法将在任务成功完成后返回任务的结果(否则阻塞)
     *
     * Submits a value-returning task for execution and returns a
     * Future representing the pending results of the task. The
     * Future's {@code get} method will return the task's result upon
     * successful completion.
     *
     * 如果要立即阻止等待任务
     * 可以使用result = exec.submit(aCallable.get())格式的构造方法
     *
     * If you would like to immediately block waiting
     * for a task, you can use constructions of the form
     * {@code result = exec.submit(aCallable).get();}
     *
     * 注意：Executors类包含一组方法
     * 这些方法可以将其他一些类似于闭包的对象
     * (例如java.security.PrivilegedAction)转换为Callable表单，以便提交它们
     *
     * <p>Note: The {@link Executors} class includes a set of methods
     * that can convert some other common closure-like objects,
     * for example, {@link java.security.PrivilegedAction} to
     * {@link Callable} form so they can be submitted.
     *
     * @param task 要提交的任务
     * @param <T> 任务结果的类型
     * @return 代表任务即将完成的Future类
     * @throws 如果无法计划执行任务，遭到拒绝抛出RejectedExecutionException
     * @throws NullPointerException if the task is null
     */
    <T> Future<T> submit(Callable<T> task);

    /**
     * 提交可运行的任务以供执行，并返回表示该任务的Future类
     * Future的get方法将在成功完成后返回给定的结果
     *
     * Submits a Runnable task for execution and returns a Future
     * representing that task. The Future's {@code get} method will
     * return the given result upon successful completion.
     *
     * @param task the task to submit
     * @param result 要返回的结果
     * @param <T> the type of the result
     * @return a Future representing pending completion of the task
     * @throws RejectedExecutionException if the task cannot be
     *         scheduled for execution
     * @throws NullPointerException if the task is null
     */
    <T> Future<T> submit(Runnable task, T result);

    /**
     * 提交可运行的任务以供执行，并返回表示该任务结果的Future类
     * Future的get方法将在成功完成后返回null!
     *
     * Submits a Runnable task for execution and returns a Future
     * representing that task. The Future's {@code get} method will
     * return {@code null} upon <em>successful</em> completion.
     *
     * @param task the task to submit
     * @return a Future representing pending completion of the task
     * @throws RejectedExecutionException if the task cannot be
     *         scheduled for execution
     * @throws NullPointerException if the task is null
     */
    Future<?> submit(Runnable task);

    /**
     * 执行给定的任务，在所有任务完成时返回一个保存其状态和结果的Future列表
     * Future.isDone()对于返回列表的每个元素都是true
     * 请注意，已完成的任务可以正常终止，也可以引发异常
     * 如果在执行此操作时修改了给定集合，则此方法的结果未定义
     *
     * Executes the given tasks, returning a list of Futures holding
     * their status and results when all complete.
     * {@link Future#isDone} is {@code true} for each
     * element of the returned list.
     * Note that a <em>completed</em> task could have
     * terminated either normally or by throwing an exception.
     * The results of this method are undefined if the given
     * collection is modified while this operation is in progress.
     *
     * @param tasks 任务的集合
     * @param <T> 从任务返回的值的类型
     * @return 表示任务的Future列表，其顺序与迭代器为给定任务列表生成的顺序相同，每个任务列表都已完成
     * @throws InterruptedException if interrupted while waiting, in
     *         which case unfinished tasks are cancelled
     * @throws NullPointerException if tasks or any of its elements are {@code null}
     * @throws RejectedExecutionException if any task cannot be
     *         scheduled for execution
     */
    <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks)
        throws InterruptedException;

    /**
     * 执行给定的任务，在所有任务完成时返回一个保存其状态和结果的Future列表(含有超时时间)
     * Future.isDone()对于返回列表的每个元素都是true
     * 请注意，已完成的任务可以正常终止，也可以引发异常
     * 如果在执行此操作时修改了给定集合，则此方法的结果未定义
     *
     * Executes the given tasks, returning a list of Futures holding
     * their status and results
     * when all complete or the timeout expires, whichever happens first.
     * {@link Future#isDone} is {@code true} for each
     * element of the returned list.
     * Upon return, tasks that have not completed are cancelled.
     * Note that a <em>completed</em> task could have
     * terminated either normally or by throwing an exception.
     * The results of this method are undefined if the given
     * collection is modified while this operation is in progress.
     *
     * @param tasks the collection of tasks
     * @param timeout the maximum time to wait
     * @param unit the time unit of the timeout argument
     * @param <T> the type of the values returned from the tasks
     * @return 代表任务的Future列表，其顺序与迭代器为给定任务列表生成的顺序相同
     * 如果操作没有超时，则每个任务都将完成
     * 如果它超时了，其中一些任务将不会完成
     * @throws InterruptedException if interrupted while waiting, in
     *         which case unfinished tasks are cancelled
     * @throws NullPointerException if tasks, any of its elements, or
     *         unit are {@code null}
     * @throws RejectedExecutionException if any task cannot be scheduled
     *         for execution
     */
    <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks,
                                  long timeout, TimeUnit unit)
        throws InterruptedException;

    /**
     * 执行给定的任务，返回已成功完成的任务(即不引发异常的结果)[如果有]
     * 在正常或异常返回时，未完成的任务将被取消
     * 如果在执行此操作时修改了给定集合，则此方法的结果未知
     *
     * Executes the given tasks, returning the result
     * of one that has completed successfully (i.e., without throwing
     * an exception), if any do. Upon normal or exceptional return,
     * tasks that have not completed are cancelled.
     * The results of this method are undefined if the given
     * collection is modified while this operation is in progress.
     *
     * @param tasks the collection of tasks
     * @param <T> the type of the values returned from the tasks
     * @return the result returned by one of the tasks
     * @throws InterruptedException if interrupted while waiting
     * @throws NullPointerException if tasks or any element task
     *         subject to execution is {@code null}
     * @throws IllegalArgumentException if tasks is empty
     * @throws ExecutionException if no task successfully completes
     * @throws RejectedExecutionException if tasks cannot be scheduled
     *         for execution
     */
    <T> T invokeAny(Collection<? extends Callable<T>> tasks)
        throws InterruptedException, ExecutionException;

    /**
     * 执行给定的任务
     * 如果在给定的超时时间之前执行了某个任务，则返回已成功完成的任务的结果(不引发异常)
     * 在正常或异常返回时，未完成的任务将被取消
     * 如果在执行此操作时修改了给定集合，则此方法的结果未知
     *
     * Executes the given tasks, returning the result
     * of one that has completed successfully (i.e., without throwing
     * an exception), if any do before the given timeout elapses.
     * Upon normal or exceptional return, tasks that have not
     * completed are cancelled.
     * The results of this method are undefined if the given
     * collection is modified while this operation is in progress.
     *
     * @param tasks the collection of tasks
     * @param timeout the maximum time to wait
     * @param unit the time unit of the timeout argument
     * @param <T> the type of the values returned from the tasks
     * @return the result returned by one of the tasks
     * @throws InterruptedException if interrupted while waiting
     * @throws NullPointerException if tasks, or unit, or any element
     *         task subject to execution is {@code null}
     * @throws TimeoutException if the given timeout elapses before
     *         any task successfully completes
     * @throws ExecutionException if no task successfully completes
     * @throws RejectedExecutionException if tasks cannot be scheduled
     *         for execution
     */
    <T> T invokeAny(Collection<? extends Callable<T>> tasks,
                    long timeout, TimeUnit unit)
        throws InterruptedException, ExecutionException, TimeoutException;
}
```

上面为本人翻译过的ExecutorService的源码, 总结一下大概有这么几类方法:

-   关闭相关方法
-   任务提交相关方法
-   批量任务激活相关方法

这些方法在上面的注释都解释的很清楚了, 在这里说几个比较重要的点:

**① 关闭相关方法**

-   `void shutdown();`
-   `List<Runnable> shutdownNow();`
-   `boolean isShutdown();`
-   `boolean isTerminated();`
-   `boolean awaitTermination(long timeout, TimeUnit unit)`

其中shutdown方法会调用awaitTermination, 经过timeout时间才会调用shutdownNow方法强制关闭;

shutdownNow方法可能会造成任务的丢失;

isShutdown方法判断线程池是否已经关闭;

而isTerminated方法仅在关闭后所有任务都已完成时返回true

**需要注意的是: 除非首先调用shutdown或者shutdownNow方法, 否则isTerminated永远不是true**

><br/>
>
>**上面的逻辑和上一文中手动实现的线程池的逻辑基本相同**

****

**② 任务提交方法**

-   `<T> Future<T> submit(Callable<T> task);`
-   `<T> Future<T> submit(Runnable task, T result);`
-   `Future<?> submit(Runnable task);`

前面说到, 任务提交包括Runnable这种无返回值的, 也包括Callable这种有返回值的;

比较有意思的是`<T> Future<T> submit(Runnable task, T result);`方法:

**他可以通过传入一个表示结果的result和Runnable任务配合实现有返回值调用**

<font color="#f00">**注意到:在Java中所以对象全部是引用传参(包括Integer这种包装类, 这个也是大坑!)**</font>

****

**③ 批量任务激活方法**

-   `<T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks)`
-   `<T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks, long timeout, TimeUnit unit)`
-   `<T> T invokeAny(Collection<? extends Callable<T>> tasks)`
-   `<T> T invokeAny(Collection<? extends Callable<T>> tasks, long timeout, TimeUnit unit)`

这两个方法可以做到批量提交任务, 区别在于:

-   **invokeAny: 取得第一个方法的返回值, 当第一个任务结束后，会调用interrupt方法中断其它任务**
-   **invokeAll: 等线程任务全部执行完毕后,取得全部任务的结果值**

><br/>
>
>**注意: 方法invokeAny, invokeAll具有阻塞性**

接下来看一看AbstractExecutorService, 他实现了ExecutorService部分方法;

<br/>

## 三.AbstractExecutorService抽象类

AbstractExecutorService.java

```java
package java.util.concurrent;

import static java.util.concurrent.TimeUnit.NANOSECONDS;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;

/**
 * 提供ExecutorService执行方法的默认实现
 * 此类使用newTaskFor返回的RunnableFuture实现了submit, invokeAny和invokeAll}方法
 * 该方法默认为此包中提供的FutureTask
 * 例如，submit(Runnable)的实现创建了一个关联的RunnableFuture它被执行并返回
 * 子类可以重写newTaskFor方法以返回RunnableFuture实现，而不是FutureTask
 *
 * Provides default implementations of {@link ExecutorService}
 * execution methods. This class implements the {@code submit},
 * {@code invokeAny} and {@code invokeAll} methods using a
 * {@link RunnableFuture} returned by {@code newTaskFor}, which defaults
 * to the {@link FutureTask} class provided in this package.  For example,
 * the implementation of {@code submit(Runnable)} creates an
 * associated {@code RunnableFuture} that is executed and
 * returned. Subclasses may override the {@code newTaskFor} methods
 * to return {@code RunnableFuture} implementations other than
 * {@code FutureTask}.
 *
 * 扩展示例
 * 下面是自定义ThreadPoolExecutor
 * 使用了CustomTask类而不是默认FutureTask类
 *
 * <p><b>Extension example</b>. Here is a sketch of a class
 * that customizes {@link ThreadPoolExecutor} to use
 * a {@code CustomTask} class instead of the default {@code FutureTask}:
 * <pre> {@code
 * public class CustomThreadPoolExecutor extends ThreadPoolExecutor {
 *
 *   static class CustomTask<V> implements RunnableFuture<V> {...}
 *
 *   protected <V> RunnableFuture<V> newTaskFor(Callable<V> c) {
 *       return new CustomTask<V>(c);
 *   }
 *   protected <V> RunnableFuture<V> newTaskFor(Runnable r, V v) {
 *       return new CustomTask<V>(r, v);
 *   }
 *   // ... add constructors, etc.
 * }}</pre>
 *
 * @since 1.5
 * @author Doug Lea
 */
public abstract class AbstractExecutorService implements ExecutorService {

    /**
     * 为给定的runnable和默认值返回RunnableFuture
     *
     * Returns a {@code RunnableFuture} for the given runnable and default
     * value.
     *
     * @param runnable 要被包装的Runnable
     * @param value 返回的Future的默认值
     * @param <T> the type of the given value
     * @return 一个RunnableFuture
     * 当运行时，它将运行底层runnable，作为Future
     * 它将产生给定的值作为其结果，并提供底层任务的取消
     * @since 1.6
     */
    protected <T> RunnableFuture<T> newTaskFor(Runnable runnable, T value) {
        return new FutureTask<T>(runnable, value);
    }

    /**
     * 返回给定可调用任务的RunnableFuture
     *
     * @param callable the callable task being wrapped
     * @param <T> the type of the callable's result
     * @return a {@code RunnableFuture} which, when run, will call the
     * underlying callable and which, as a {@code Future}, will yield
     * the callable's result as its result and provide for
     * cancellation of the underlying task
     * @since 1.6
     */
    protected <T> RunnableFuture<T> newTaskFor(Callable<T> callable) {
        return new FutureTask<T>(callable);
    }

    /**
     * 无返回值的任务提交
     * @throws RejectedExecutionException {@inheritDoc}
     * @throws NullPointerException       {@inheritDoc}
     */
    public Future<?> submit(Runnable task) {
        if (task == null) throw new NullPointerException();
        RunnableFuture<Void> ftask = newTaskFor(task, null);
        execute(ftask);
        return ftask;
    }

    /**
     * 与Runnable配合有返回值的任务提交
     * @throws RejectedExecutionException {@inheritDoc}
     * @throws NullPointerException       {@inheritDoc}
     */
    public <T> Future<T> submit(Runnable task, T result) {
        if (task == null) throw new NullPointerException();
        RunnableFuture<T> ftask = newTaskFor(task, result);
        execute(ftask);
        return ftask;
    }

    /**
     * 有返回值的Callable的任务提交
     * @throws RejectedExecutionException {@inheritDoc}
     * @throws NullPointerException       {@inheritDoc}
     */
    public <T> Future<T> submit(Callable<T> task) {
        if (task == null) throw new NullPointerException();
        RunnableFuture<T> ftask = newTaskFor(task);
        execute(ftask);
        return ftask;
    }

    /**
     * invokeAny批量调用的主要机制
     */
    private <T> T doInvokeAny(Collection<? extends Callable<T>> tasks,
                              boolean timed, long nanos)
        throws InterruptedException, ExecutionException, TimeoutException {
        // 任务为空
        if (tasks == null)
            throw new NullPointerException();
        // 任务数
        int ntasks = tasks.size();
        // 任务数为0
        if (ntasks == 0)
            throw new IllegalArgumentException();
        // ArrayList接收任务, 并创建ExecutorCompletionService
        // 简单理解就是ExecutorCompletionService是一个批量任务管理接口
        ArrayList<Future<T>> futures = new ArrayList<>(ntasks);
        ExecutorCompletionService<T> ecs =
            new ExecutorCompletionService<T>(this);

        // 为了提高效率(特别是在并行性有限的执行器中)
        // 请在提交更多任务之前检查以前提交的任务是否已完成
        // 这种交错加上异常机制解释了(此方法中)主循环的混乱
        try {
            // 记录异常，以便如果我们无法获得任何结果，我们可以抛出最后一个异常
            ExecutionException ee = null;
            final long deadline = timed ? System.nanoTime() + nanos : 0L;
            Iterator<? extends Callable<T>> it = tasks.iterator();

            // 确保开始一项任务；其余的逐步进行
            futures.add(ecs.submit(it.next()));
            --ntasks;
            int active = 1;

            // 等待某个任务完成或者超时
            for (;;) {
                // 获取任务
                Future<T> f = ecs.poll();
                // 如果任务为空
                if (f == null) {
                    // 当前任务数大于0
                    if (ntasks > 0) {
                        // 任务数减一
                        --ntasks;
                        // 加入下一个任务, 并且任务激活数+1
                        futures.add(ecs.submit(it.next()));
                        ++active;
                    }
                    // 如果当前无激活任务
                    // 注意: 前面保证了一定会激活一个任务!
                    // 退出循环
                    else if (active == 0)
                        break;
                    // 如果是任务超时, 抛出TimeoutException(), 退出循环
                    else if (timed) {
                        f = ecs.poll(nanos, NANOSECONDS);
                        if (f == null)
                            throw new TimeoutException();
                        nanos = deadline - System.nanoTime();
                    }
                    // 从批处理队列中获取future
                    else
                        f = ecs.take();
                }
                // 如果future不为空(这时候已经说明了有任务完成)
                // 在这个里面一定会返回!!!
                if (f != null) {
                    // 激活数-1
                    --active;
                    try {
                        // 获取Future接口结果
                        return f.get();
                    } catch (ExecutionException eex) {
                        ee = eex;
                    } catch (RuntimeException rex) {
                        ee = new ExecutionException(rex);
                    }
                }
            }

            // 上面如果有异常, 直接抛出, 返回
            if (ee == null)
                ee = new ExecutionException();
            throw ee;

        } finally {
            // 最后取消其他所有任务!!!
            cancelAll(futures);
        }
    }

    public <T> T invokeAny(Collection<? extends Callable<T>> tasks)
        throws InterruptedException, ExecutionException {
        try {
            return doInvokeAny(tasks, false, 0);
        } catch (TimeoutException cannotHappen) {
            assert false;
            return null;
        }
    }

    public <T> T invokeAny(Collection<? extends Callable<T>> tasks,
                           long timeout, TimeUnit unit)
        throws InterruptedException, ExecutionException, TimeoutException {
        return doInvokeAny(tasks, true, unit.toNanos(timeout));
    }

    // 其他invokeAll方法的实现方法
    public <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks)
        throws InterruptedException {
        // 如果任务列表为空, 返回NullPointerException()
        if (tasks == null)
            throw new NullPointerException();
        
        // futures为一个ArrayList, 用于接收任务
        ArrayList<Future<T>> futures = new ArrayList<>(tasks.size());
        try {
            // 加入执行列表
            for (Callable<T> t : tasks) {
                RunnableFuture<T> f = newTaskFor(t);
                futures.add(f);
                execute(f);
            }
            // 执行任务, 并忽略所以异常!
            for (int i = 0, size = futures.size(); i < size; i++) {
                Future<T> f = futures.get(i);
                if (!f.isDone()) {
                    try { f.get(); }
                    catch (CancellationException | ExecutionException ignore) {}
                }
            }
            // 返回列表
            return futures;
        } catch (Throwable t) {
            cancelAll(futures);
            throw t;
        }
    }

    // 含有超时的执行全部任务的方法
    // 只是多了超时判断
    public <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks,
                                         long timeout, TimeUnit unit)
        throws InterruptedException {
        if (tasks == null)
            throw new NullPointerException();
        final long nanos = unit.toNanos(timeout);
        final long deadline = System.nanoTime() + nanos;
        ArrayList<Future<T>> futures = new ArrayList<>(tasks.size());
        int j = 0;
        timedOut: try {
            for (Callable<T> t : tasks)
                futures.add(newTaskFor(t));

            final int size = futures.size();

            // Interleave time checks and calls to execute in case
            // executor doesn't have any/much parallelism.
            for (int i = 0; i < size; i++) {
                if (((i == 0) ? nanos : deadline - System.nanoTime()) <= 0L)
                    break timedOut;
                execute((Runnable)futures.get(i));
            }

            for (; j < size; j++) {
                Future<T> f = futures.get(j);
                if (!f.isDone()) {
                    try { f.get(deadline - System.nanoTime(), NANOSECONDS); }
                    catch (CancellationException | ExecutionException ignore) {}
                    catch (TimeoutException timedOut) {
                        break timedOut;
                    }
                }
            }
            return futures;
        } catch (Throwable t) {
            cancelAll(futures);
            throw t;
        }
        // 在完成所有任务之前超时；取消剩余任务
        cancelAll(futures, j);
        return futures;
    }

    private static <T> void cancelAll(ArrayList<Future<T>> futures) {
        cancelAll(futures, 0);
    }

    // 撤销ArrayList中j索引之后全部的任务
    /** Cancels all futures with index at least j. */
    private static <T> void cancelAll(ArrayList<Future<T>> futures, int j) {
        for (int size = futures.size(); j < size; j++)
            futures.get(j).cancel(true);
    }
}
```

可以看出AbstractExecutorService这个抽象类还是比较简单的

首先, 他**实现了ExecutorService中除了关闭类型以外的其他所有方法(各个线程池关闭的方式可能会有所不同)**

其中需要注意的是submit方法:

<font color="#f00">**submit方法使用newTaskFor返回一个RunnableFuture类型, 并通过execute执行;**</font>

其中: 这个RunnableFuture继承了Runnable, Future, 可以说是两者的结合;

然后加入了三个方法: doInvokeAny, cancelAll和newTaskFor方法;

**① newTaskFor**

newTaskFor方法完成了对Runnable和Callable接口的包装, 并通过RunnableFuture实现了对一个方法的抽象;

****

**② doInvokeAny**

遍历给定的任务队列, 并调用Future的cancel方法, 取消任务;

****

**③ doInvokeAny**

该方法是invokeAny方法的具体实现, 首先通过获取所有的任务方法, 生成任务队列; 然后通过判断是否有任务完成, 如果完成则返回该结果; 在finally块中取消所有其他任务;

需要注意的有:

1.  在这个方法中定义了:
    -   ntasks表示剩余任务数;
    -   任务队列futures;
    -   ExecutorCompletionService类型的ecs负责管理批量任务;
    -   ExecutionException ee负责处理整个方法的异常, 并在返回时抛出;
2.  其次**在执行for循环之前, 就已经执行了一个任务(确保一定有一个任务被执行)**

更多细节可以看上面源码分析;

<br/>

## 四.四种类型的线程池

在正式查看ThreadPoolExecutor之前, 先简单总结一下Java中四种类型的线程池;

<font color="#f00">**这四种类型的线程池其实底层都是通过ThreadPoolExecutor实现的**</font>

对于这些类型线程池的原理在下面这个UP的视频中讲的很不错

<iframe src="//player.bilibili.com/player.html?aid=80930944&cid=138521148&page=1" height=320 width=638 scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>

><br/>
>
>**如果视频过小可以访问原网站:** https://www.bilibili.com/video/av80930944/

下面做一下总结, 在下一篇文章中会继续从源码分析实现:

### 1.ThreadPoolExecutor提供的构造函数

```java
//五个参数的构造函数
public ThreadPoolExecutor(int corePoolSize,
                          int maximumPoolSize,
                          long keepAliveTime,
                          TimeUnit unit,
                          BlockingQueue<Runnable> workQueue)
//六个参数的构造函数-1
public ThreadPoolExecutor(int corePoolSize,
                          int maximumPoolSize,
                          long keepAliveTime,
                          TimeUnit unit,
                          BlockingQueue<Runnable> workQueue,
                          ThreadFactory threadFactory)
//六个参数的构造函数-2
public ThreadPoolExecutor(int corePoolSize,
                          int maximumPoolSize,
                          long keepAliveTime,
                          TimeUnit unit,
                          BlockingQueue<Runnable> workQueue,
                          RejectedExecutionHandler handler)
//七个参数的构造函数
public ThreadPoolExecutor(int corePoolSize,
                          int maximumPoolSize,
                          long keepAliveTime,
                          TimeUnit unit,
                          BlockingQueue<Runnable> workQueue,
                          ThreadFactory threadFactory,
                          RejectedExecutionHandler handler)
```

**参数解释**

-   **int corePoolSize:**

该线程池中核心线程数最大值

核心线程：线程池新建线程的时候，如果当前线程总数小于corePoolSize，则新建的是核心线程，如果超过corePoolSize，则新建的是非核心线程核心线程默认情况下会一直存活在线程池中，即使这个核心线程啥也不干(闲置状态)

如果指定ThreadPoolExecutor的allowCoreThreadTimeOut这个属性为true，那么核心线程如果不干活(闲置状态)的话，超过一定时间(时长下面参数决定)，就会被销毁掉

-   **int maximumPoolSize:**

该线程池中线程总数最大值

线程总数 = 核心线程数 + 非核心线程数

****

-   **long keepAliveTime:**

该线程池中非核心线程闲置超时时长

一个非核心线程，如果不干活(闲置状态)的时长超过这个参数所设定的时长，就会被销毁掉，如果设置`allowCoreThreadTimeOut = true`，则会作用于核心线程

****

-   **BlockingQueue workQueue:**

该线程池中的任务队列：维护着等待执行的Runnable对象

当所有的核心线程都在干活时，新添加的任务会被添加到这个队列中等待处理，如果队列满了，则新建非核心线程执行任务

><br/>
>
>**常用的workQueue类型:**
>
>-   **SynchronousQueue:** 这个队列接收到任务的时候，会直接提交给线程处理，而不保留它，如果所有线程都在工作怎么办？那就新建一个线程来处理这个任务！所以为了保证不出现`线程数达到了maximumPoolSize而不能新建线程`的错误，使用这个类型队列的时候，maximumPoolSize一般指定成Integer.MAX_VALUE，即无限大
>-   **LinkedBlockingQueue:** 这个队列接收到任务的时候，如果当前线程数小于核心线程数，则新建线程(核心线程)处理任务；如果当前线程数等于核心线程数，则进入队列等待。由于这个队列没有最大值限制，即所有超过核心线程数的任务都将被添加到队列中，这也就导致了maximumPoolSize的设定失效，因为总线程数永远不会超过corePoolSize
>-   **ArrayBlockingQueue:** 可以限定队列的长度，接收到任务的时候，如果没有达到corePoolSize的值，则新建线程(核心线程)执行任务，如果达到了，则入队等候，如果队列已满，则新建线程(非核心线程)执行任务，又如果总线程数到了maximumPoolSize，并且队列也满了，则发生错误
>-   **DelayQueue:** 队列内元素必须实现Delayed接口，这就意味着你传进去的任务必须先实现Delayed接口。这个队列接收到任务时，首先先入队，只有达到了指定的延时时间，才会执行任务

****

-   **ThreadFactory threadFactory:**

创建线程的方式

这是一个接口，你new他的时候需要实现他的Thread newThread(Runnable r)方法

****

-   **RejectedExecutionHandler handler:** 

当提交任务数超过maxmumPoolSize + workQueue之和时

任务会交给RejectedExecutionHandler来处理;

><br/>
>
>**JDK提供了四种拒绝策略(在ThreadPoolExecutor中以内部类形式存在):**
>
>-   **AbortPolicy:** 默认。直接抛异常
>-   **CallerRunsPolicy:** 只用调用者所在的线程执行任务,重试添加当前的任务，它会自动重复调用execute()方法
>-   **DiscardOldestPolicy:** 丢弃任务队列中最久的任务
>-   **DiscardPolicy:** 丢弃当前任务

<br/>

### 2.线程池的处理流程

如下图所示:

![线程池的处理流程.png](https://img-blog.csdn.net/20180814214752746?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3pfc196MjAxNg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

一个线程从被提交(submit)到执行共经历以下流程:

-   线程池**判断核心线程池**里是的线程是否都在执行任务?
    -   如果不是，则创建一个新的工作线程来执行任务; 
    -   如果核心线程池里的线程都在执行任务，则进入下一个流程;
-   线程池**判断工作队列**是否已满?
    -   如果工作队列没有满，则将新提交的任务储存在这个工作队列里;
    -   如果工作队列满了，则进入下一个流程;
-   线程池判断其**内部线程是否都处于工作状态**?
    -   如果没有，则创建一个新的工作线程来执行任务
    -   如果已满了，则交给饱和策略来处理这个任务

****

从线程池在执行execute方法的角度来看, 主要有以下四种情况:

-   如果当前运行的线程少于corePoolSize，则创建新线程来执行任务(需要获得全局锁)
-   如果运行的线程等于或多于corePoolSize, 则将任务加入BlockingQueue
-   如果无法将任务加入BlockingQueue(队列已满), 则创建新的线程来处理任务(需要获得全局锁)
-   如果创建新线程将使当前运行的线程超出maxiumPoolSize，任务将被拒绝，并调用RejectedExecutionHandler.rejectedExecution()方法

><br/>
>
>**注意:**
>
><font color="#f00">**线程池采取上述的流程进行设计是: 为了减少获取全局锁的次数**</font>
>
>**在线程池完成预热(当前运行的线程数大于或等于corePoolSize)之后，几乎所有的execute方法调用都会执行步骤2**

<br/>

### 3.四种线程池

#### **1. FixedThreadPool 定长线程池**

首先看一下这个类的构造方法:

```java
public static ExecutorService newFixedThreadPool(int nThreads) {
    return new ThreadPoolExecutor(nThreads, nThreads,
                                  0L, TimeUnit.MILLISECONDS,
                                  new LinkedBlockingQueue<Runnable>());
}
```

下图是FixedThreadPool的实现原理:

![FixedThreadPool.png](https://img-blog.csdn.net/20180814222111804?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3pfc196MjAxNg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

FixedThreadPool通过execute方法执行任务:

-   如果线程池未满则通过corePool直接执行
-   如果线程池已满则加入阻塞队列等待
-   如果阻塞队列也满了, 则根据拒绝策略进行处理(下一篇文章会分析)

总结:

-   它是一种**固定大小的线程池**;
-   **corePoolSize和maximunPoolSize都为用户设定的线程数量nThreads；**
-   **keepAliveTime为0**，意味着一旦有多余的空闲线程，就会被立即停止掉；但这里keepAliveTime无效；
-   **阻塞队列采用了LinkedBlockingQueue，它是一个无界队列；**
-   由于阻塞队列是一个无界队列，因此**永远不可能拒绝任务；**
-   **由于采用了无界队列，实际线程数量将永远维持在nThreads，因此maximumPoolSize和keepAliveTime将无效**

****

#### 2.**CachedThreadPool 可缓存线程池**

构造方法:

```java
public static ExecutorService newCachedThreadPool() {
    return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                  60L, TimeUnit.SECONDS,
                                  new SynchronousQueue<Runnable>());
}
```

下图为CachedThreadPool的实现原理:

![CachedThreadPool.png](https://img-blog.csdn.net/20180814222325597?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3pfc196MjAxNg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

CachedThreadPool通过execute方法执行任务:

-   当corePool存在空余线程**(核心虽然为0, 但是线程存在默认60秒回收时间)**, 则直接执行
-   当corePool不存在空余线程, 则放入SynchronousQueue等待; 而**SynchronousQueue没有存储空间，这意味着只要有请求到来，就必须要找到一条工作线程处理他，如果当前没有空闲的线程，那么就会再创建一条新的线程**

总结:

-   CachedThreadPool是一个可以无限扩大的线程池;

-   CachedThreadPool比较**适合处理执行时间比较小的任务;**

-   **corePoolSize为0，maximumPoolSize为无限大，意味着线程数量理论上可以无限大;(当然操作系统会有所限制, 不可能无限大)**

-   keepAliveTime为60S，意味着**线程空闲时间超过60S就会被杀死;**

-   采用SynchronousQueue装等待的任务，这个阻塞队列**没有存储空间，这意味着只要有请求到来，就必须要找到一条工作线程处理他，如果当前没有空闲的线程，那么就会再创建一条新的线程;**


****

#### 3.**SingleThreadExecutor 单一线程池**

SingleThreadExecutor构造方法:

```java
    public static ExecutorService newSingleThreadExecutor() {
        return new FinalizableDelegatedExecutorService
            (new ThreadPoolExecutor(1, 1,
                                    0L, TimeUnit.MILLISECONDS,
                                    new LinkedBlockingQueue<Runnable>()));
    }
```

下图为SingleThreadExecutor的实现原理:

![SingleThreadExecutor.png](https://img-blog.csdn.net/20180814222550617?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3pfc196MjAxNg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

由于使用的是LinkedBlockingQueue, 所以理论上等待的任务可以是无穷多

总结:

-   它只会创建一条工作线程处理任务;
-   采用的阻塞队列为LinkedBlockingQueue;

****

#### 4.**ScheduledThreadPool 可调度的线程池**

它用来处理延时任务或定时任务, 他的构造方法如下:

```java
public static ScheduledExecutorService newScheduledThreadPool(
    int corePoolSize, ThreadFactory threadFactory) {
    return new ScheduledThreadPoolExecutor(corePoolSize, threadFactory);
}
```

即他是通过ScheduledThreadPoolExecutor(它继承了ThreadPoolExecutor)实现的;

ScheduledThreadPool的实现原理如下图:

![ScheduledThreadPool.png](https://img-blog.csdn.net/20180814222732879?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3pfc196MjAxNg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

**① 提交任务**

它接收SchduledFutureTask类型的任务，有两种提交任务的方式:

-   scheduledAtFixedRate
-   scheduledWithFixedDelay

****

**② SchduledFutureTask任务参数**

SchduledFutureTask接收的参数:

-   time: 任务开始的时间
-   sequenceNumber: 任务的序号
-   period: 任务执行的时间间隔

****

它采用DelayQueue存储等待的任务:

DelayQueue内部封装了一个PriorityQueue，它会根据time的先后时间排序: 若time相同则根据sequenceNumber排序；DelayQueue也是一个无界队列；

工作线程的执行过程:

**工作线程会从DelayQueue取已经到期的任务去执行；**

**执行结束后重新设置任务的到期时间，再次放回DelayQueue**

<br/>

### 4.如何选择合适的线程池

任务一般可分为: CPU密集型、IO密集型、混合型

对于不同类型的任务需要分配不同大小的线程池

**① CPU密集型任务**

尽量使用较小的线程池，一般为CPU核心数+1

因为CPU密集型任务使得CPU使用率很高，若开过多的线程数，只能增加上下文切换的次数，因此会带来额外的开销

**② IO密集型任务**

可以使用稍大的线程池，一般为2*CPU核心数

IO密集型任务(比如下载, 上传)CPU使用率并不高，因此可以让CPU在等待IO的时候去处理别的任务，充分利用CPU时间

**③ 混合型任务**

可以将任务分成IO密集型和CPU密集型任务，然后分别用不同的线程池去处理

只要分完之后两个任务的执行时间相差不大，那么就会比串行执行来的高效

因为如果划分之后两个任务执行时间相差甚远，那么先执行完的任务就要等后执行完的任务，最终的时间仍然取决于后执行完的任务，而且还要加上任务拆分与合并的开销，得不偿失

<br/>

以上部分内容参考自[Java线程池-ThreadPoolExecutor原理分析与实战](https://blog.csdn.net/z_s_z2016/article/details/81674893)

><br/>
>
>**后记:**
>
>下一篇文章, 也是最终篇将会分析ThreadPoolExecutor和Executors的源码
>
>文章地址: [Java线程池ThreadPoolExecutor分析与实战终](https://jasonkayzk.github.io/2020/03/05/Java线程池ThreadPoolExecutor分析与实战终/)

## 附录

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~



文章参考:

-   [Java线程池-ThreadPoolExecutor原理分析与实战](https://blog.csdn.net/z_s_z2016/article/details/81674893)

<br/>