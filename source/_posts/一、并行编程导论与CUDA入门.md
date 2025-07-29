---
title: 一、并行编程导论与CUDA入门
toc: true
cover: 'https://img.paulzzh.com/touhou/random?24'
date: 2025-07-29 17:41:50
categories: CUDA
tags: [CUDA, GPU, 并行计算]
description: 随着人工智能的发展，科学计算（尤其是矩阵/张量计算）越来越重要；因此，基于CUDA的张量编程也越来越重要。在上一篇文章中翻译了《An Even Easier Introduction to CUDA》，但是感觉作者写的不是很好；这里重新写了一篇。同时，也作为CUDA和并行编程的开篇。
---

随着人工智能的发展，科学计算（尤其是矩阵/张量计算）越来越重要；因此，基于CUDA的张量编程也越来越重要。

在[上一篇笔记](https://github.com/JasonkayZK/high-performance-computing-learn/blob/main/cuda/0-an-even-easier-intro-to-cuda.ipynb)中翻译了[《An Even Easier Introduction to CUDA》](https://developer.nvidia.com/blog/even-easier-introduction-cuda/)，但是感觉作者写的不是很好；

这里重新写了一篇。同时，也作为CUDA和并行编程的开篇。

源代码：

-   https://github.com/JasonkayZK/high-performance-computing-learn/blob/main/cuda/1_introduction_to_parallel_programming_and_cuda.ipynb

<br/>

<!--more-->

# **一、并行编程导论与CUDA入门**

>**温馨提示：本文章配合 Colab 一同执行学习效果更佳：**
>
>-   https://colab.research.google.com/github/JasonkayZK/high-performance-computing-learn/blob/main/cuda/1_introduction_to_parallel_programming_and_cuda.ipynb

## **（一）、CUDA编程概述**

### **1、什么是CUDA**

CUDA 是 NVIDIA 开发的并行计算平台和编程模型；

具有以下特点：

-   C/C++ 语法；
-   SIMT（Single Instruction Multiple Threads）模式：**一个指令会被多个线程同时执行！**
-   需要与CPU协作：CPU负责整理结果、处理逻辑；
-   自动调度：根据设定的执行参数，自动调度；

<br/>

### **2、CUDA 运算硬件单元**

#### **（1）SM 单元**

下面是一个 GPU 硬件单元：

![cuda-1.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/cuda-1.png)

每个核心中包含了多个 SM（Stream Multi-processor），任务在 SM 中处理；

SM 中包含了：

-   **CUDA Core/SP**：进行并行的加减法等计算；
-   **Tensor Core：**张量计算
-   ……

<br/>

#### **（2）CPU与GPU协作**

CPU 与 GPU 协同工作的流程如下：

![cuda-2.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/cuda-2.png)

首先，习惯上将：

-   CPU 所在端称为：Host 端，对应内存为 RAM；
-   GPU 所在称为：Device 端，对应内存为 Global Memory（通常对应 GPU RAM，显存）；

>   通常，Global Memory 在其范围和生命周期中是全局的！
>
>   **也就是说，每个在[thread block grid](https://modal.com/gpu-glossary/device-software/thread-block-grid) 中的 [thread](https://modal.com/gpu-glossary/device-software/thread) 都可以访问Global Memory，并且生命周期与程序的执行时间一样长！**
>
>   **更多内容：**
>
>   -   https://modal.com/gpu-glossary/device-software/global-memory

CUDA 程序执行时主要分为以下几个步骤：

-   **CPU 准备（CPU Prepare）**：在主机端（Host ，包含 CPU 和 RAM 主存 ），CPU 负责初始化数据、设置计算参数等准备工作，为后续在 GPU 上的运算任务做铺垫，确定要处理的数据和运算逻辑；
-   **CPU 传输数据至 GPU（CPU Transfers Data to GPU）**：通过总线（Bus），CPU 把主存（RAM）中准备好的数据传输到 GPU 端的全局内存（Global Memory ，GM），因为 GPU 运算需要的数据要先存放到其可访问的内存空间；
-   **从 GM 读数据（Read Data from GM）**：GPU（如 NVIDIA A100 ）从自身的全局内存中读取需要参与运算的数据，将数据加载到运算单元可处理的位置；
-   **运算（Compute）**：NVIDIA A100 等 GPU 设备利用自身的并行运算核心，对读取的数据执行 CUDA 核函数定义的运算操作，发挥 GPU 并行计算优势，高效处理大规模数据计算任务；
-   **写回 GM（Write Back to GM）**：运算完成后，GPU 将运算结果写回到全局内存中，暂存运算产出的数据；
-   **GPU 传输数据至 CPU（GPU Transfers Data to CPU）**：再次通过总线，GPU 把全局内存中存储的运算结果传输回主机端的主存（RAM），供 CPU 进一步处理（如数据展示、后续其他主机端逻辑运算等 ），完成一次 CUDA 编程的计算流程；

CUDA 这种流程实现了 CPU 与 GPU 协同，让 GPU 承担并行计算 heavy - lifting ，提升计算密集型任务效率，广泛用于深度学习训练推理、科学计算等场景！

<br/>

## **（二）、CUDA运算示例：加法**

### **1、CPU加法**

add_cpu.cpp

```c++
#include <cmath>
#include <iostream>
#include <vector>

// Step 2: Define add function
void add_cpu(std::vector<float> &c, const std::vector<float> &a, const std::vector<float> &b) {
    // CPU use loop to calculate
    for (size_t i = 0; i < a.size(); i++) {
        c[i] = a[i] + b[i];
    }
}

int main() {
    // Step 1: Prepare & initialize data
    constexpr size_t N = 1 << 20; // ~1M elements

    // Initialize data
    const std::vector<float> a(N, 1);
    const std::vector<float> b(N, 2);
    std::vector<float> c(N, 0);

    // Step 3: Call the cpu addition function
    add_cpu(c, a, b);
    
    // Step 4: Check for errors (all values should be 3.0f)
    float maxError = 0.0f;
    for (int i = 0; i < N; i++) {
        maxError = fmax(maxError, fabs(c[i] - 3.0f));
    }
    std::cout << "Max error: " << maxError << std::endl;
}
```

主要分为以下几个步骤：

-   准备和初始化数据；
-   定义加法函数
  -   靠**循环**来进行所有的元素加法
-   调用函数
-   验证结果

<br/>

### **2、修改为GPU加法（重点！）**

分为以下几个步骤：

-   **修改文件名为 `*.cu`**：例如`add_cuda.cu`（表示 CUDA 程序）
-   **准备和初始化数据（CPU）**：使用 vector 等进行 Host 端的 RAM 分配；
-   **数据传输到 GPU**：使用 `cudaMalloc` 分配显存、使用 `cudaMemcpy` 复制数据等；
-   **GPU 从 GM 中读取并计算后写回（调用核（kernel）函数计算）**：
    -   修改核函数声明：
    -   修改调用方式：
-   **将 GPU 数据传输回 CPU**：
-   验证结果

下面分别来看；

<br/>

#### （1）修改文件名为 `*.cu`

CUDA 规定其文件扩展名为 `*.cu`，语法和 C++ 类似！

<br/>

#### **（2）准备和初始化数据（CPU）**

这步比较简单：

add_cuda.cu

```c++
// Step 1: Prepare & initialize data
constexpr size_t N = 1 << 20; // ~1M elements
constexpr size_t size_bytes = sizeof(float) * N;

// Initialize data
const std::vector<float> h_a(N, 1);
const std::vector<float> h_b(N, 2);
std::vector<float> h_c(N, 0);
```

此时在 Host 端的 RAM 分配内存；

<br/>

#### **（3）数据传输到 GPU**

数据传输到 GPU 使用 CUDA 提供的函数：

-   使用 `cudaMalloc` 分配显存；
-   使用 `cudaMemcpy` 复制数据；

add_cuda.cu

```c++
float *d_a, *d_b, *d_c;
CUDA_CHECK(cudaMalloc(&d_a, size_bytes));
CUDA_CHECK(cudaMalloc(&d_b, size_bytes));
CUDA_CHECK(cudaMalloc(&d_c, size_bytes));

CUDA_CHECK(cudaMemcpy(d_a, h_a.data(), size_bytes, cudaMemcpyHostToDevice));
CUDA_CHECK(cudaMemcpy(d_b, h_b.data(), size_bytes, cudaMemcpyHostToDevice));
CUDA_CHECK(cudaMemcpy(d_c, h_c.data(), size_bytes, cudaMemcpyHostToDevice));
```

这里使用了：

-   `CUDA_CHECK` 宏进行校验；
-   `cudaMemcpyHostToDevice` 指定数据流方向；

CUDA_CHECK 宏定义如下：

```c++
#define CUDA_CHECK(call) \
{ \
    cudaError_t err = call; \
    if (err != cudaSuccess) { \
        std::cerr << "CUDA Error at " << __FILE__ << ":" << __LINE__ \
        << " - " << cudaGetErrorString(err) << std::endl; \
    } \
}
```

<br/>

#### **（4：补）CUDA层级结构**

##### **i.线程层级结构**

在 CPU 中，使用**循环**进行执行；

**而在 GPU 中，使用的是 `SIMT`，即：`一条命令会同时被多个线程执行！`**

**此时需要指挥每个线程：组织结构和编号！**

在 CUDA 中，包含：

-   Grid：
-   Block：
-   Thread：

如下图：

![cuda-3.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/cuda-3.png)

其中：**每一个 Grid 中包含多个已编号的 Block，而每一个 Block 中包含多个已编号的 Thread！**

同时，**每个 Block 中包含的线程数是一样的！**

**一共有：`0~N-1`个Thread（假设每个 Block 包含 N 个 Thread）；**

![cuda-4.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/cuda-4.png)

<br/>

##### **ii.线程索引计算方法**

在 CUDA 中：

-   每个线程都有 **独一无二** 的编号索引(idx)；
-   `idx = BlockID * BlockSize + ThreadID`；

如下图：

![cuda-5.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/cuda-5.png)

<br/>

#### **（4）编写和调用核函数**

相对于 CPU 中使用循环的方式执行，**在 GPU 中主要使用的是：`多线程并行`；**

步骤如下：

-   定义 block 的数量和大小来指挥线程、进行/并行计算；
-   定义 GPU 上的加法函数（核函数）；
-   结合定义的信息调用 GPU 加法函数；

层级结构定义：

```c++
// Set up kernel configuration
dim3 block_dim(256);
dim3 grid_dim((N + block_dim.x - 1) / block_dim.x);
```

核函数定义：

```c++
template<typename T>
__global__ void add_kernel(T *c, const T *a, const T *b, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        c[idx] = a[idx] + b[idx];
    }
}
```

>   **只能通过指针的方式传递！**
>
>   <font color="#f00">**因为像是 vector 等数据结构，都是在 Host 端定义的，并不能在 Global Memory 中分配！**</font>

核函数调用：

```c++
// Call cuda add kernel
add_kernel<<<grid_dim, block_dim>>>(d_c, d_a, d_b, N);
```

其中：

-   `dim3`：CUDA 表示线程层级结构的类型（包括：x、y、z 三个维度）；
-   `<<<>>>`：传递线程层级信息给核函数；
-   `核函数(kernel)`：设备侧的入口函数；
-   `__global__`：表示这是个核函数；
-   `blockldx`：表示 block 的编号，第几个 block；
-   `blockDim`：表示 block 的大小，一个 block 多少个线程；
-   `threadldx`：表示 thread 的编号，表示第几个 thread；

<br/>

#### **（5）将 GPU 数据传输回 CPU**

同样，使用 `cudaMemcpy`：

```c++
CUDA_CHECK(cudaMemcpy(h_c.data(), d_c, size_bytes, cudaMemcpyDeviceToHost));
```

<br/>

#### **（6）验证结果，释放内存**

验证结果使用已经复制到 `h_c` 中的数据；

释放内存使用 `cudaFree`：

add_cuda.cu

```c++
float maxError = 0.0f;
for (int i = 0; i < N; i++) {
    maxError = fmax(maxError, fabs(h_c[i] - 3.0f));
}
std::cout << "Max error: " << maxError << std::endl;

if (d_a) {
    CUDA_CHECK(cudaFree(d_a));
}
if (d_b) {
    CUDA_CHECK(cudaFree(d_b));
}
if (d_c) {
    CUDA_CHECK(cudaFree(d_c));
}
```

<br/>

### **3、编译&运行CUDA程序**

需要使用 `NVCC（NIVIDEA CUDA Compiler）` 的编译器来编译程序；

>   NVCC 是 CUDA Toolkit 的一部分：
>
>   -   https://developer.nvidia.com/cuda-toolkit

<br/>

#### **（1）编译流程**

如下图所示：

![cuda-6.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/cuda-6.png)

流程如下：

1.   **每个 cu**：Host 代码与 Device 代码分离（部分在CPU执行、部分在GPU执行）
2.   **每个虚拟架构：**Device 代码编译出 fatbin
3.   Host 端使用系统的 C++ 编译器(如 g++)
4.   链接（device，host）
5.   最终获得可使用 GPU 的可执行二进制文件

<br/>

##### **补：GPU虚拟架构**

NVIDIA 不同年代生产的GPU可能有不同的架构，如下图所示：

![cuda-7.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/cuda-7.png)

以 A100 为例，A100 为 Ampere 架构；同时，各个架构间有区别；

因此提出：Compute Capability (CC)

-   类似版本，表示能支持的功能和指令集合
-   A100 (Ampere 架构)是：cc8.0

>   **虽然 A100 举例，但从 CUDA 编程的角度目前各种架构没有本质区别！**
>
>   <font color="#f00">**正因为如此，所以说CUDA是一个编程平台**</font>

同时，在编译时也可以指定架构编译选项：

-   `-arch`：指定虚拟架构，PTX生成目标。决定代码中可使用的CUDA 功能；
-   `-code`：指定实际架构，生成针对特定 GPU 硬件的二进制机器码(cubin)；

<br/>

#### **（2）编译命令**

通过：

```bash
nvcc add_cuda.cu -o add_cuda
```

即可编译！

运行：

```bash
./add_cuda
```

<br/>

## （三）、GPU性能测试

可以通过：

```
nvidia-smi
```

观察 GPU 利用率！

### **1、并行加法性能对比**

分别对比：

-   CPU；
-   `<<<1,1>>>`；
-   `<<<256，256>>>`；
-   GPU 满载；

代码如下：

add_cuda_profiling.cu

```c++
#include <cmath>
#include <iostream>
#include <vector>


#define CUDA_CHECK(call) \
{ \
    cudaError_t err = call; \
    if (err != cudaSuccess) { \
        std::cerr << "CUDA Error at " << __FILE__ << ":" << __LINE__ \
        << " - " << cudaGetErrorString(err) << std::endl; \
    } \
}

// Step 3: Define add kernel
template<typename T>
__global__ void add_kernel(T *c, const T *a, const T *b, const size_t n, const size_t step) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x + step;
    if (idx < n) {
        c[idx] = a[idx] + b[idx];
    }
}

template<typename T>
void vector_add(T *c, const T *a, const T *b, size_t n, const dim3& grid_dim, const dim3& block_dim) {
    size_t step = grid_dim.x * block_dim.x;
    for (size_t i = 0; i < n; i += step) {
        add_kernel<<<grid_dim, block_dim>>>(c, a, b, n, i);
    }
}

int main() {
    // Step 1: Prepare & initialize data
    constexpr size_t N = 1 << 20; // ~1M elements
    constexpr size_t size_bytes = sizeof(float) * N;

    // Initialize data
    const std::vector<float> h_a(N, 1);
    const std::vector<float> h_b(N, 2);
    std::vector<float> h_c(N, 0);

    // Step 2: Allocate device memory & transfer to global memory
    float *d_a, *d_b, *d_c;
    CUDA_CHECK(cudaMalloc(&d_a, size_bytes));
    CUDA_CHECK(cudaMalloc(&d_b, size_bytes));
    CUDA_CHECK(cudaMalloc(&d_c, size_bytes));

    CUDA_CHECK(cudaMemcpy(d_a, h_a.data(), size_bytes, cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(d_b, h_b.data(), size_bytes, cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(d_c, h_c.data(), size_bytes, cudaMemcpyHostToDevice));

    // Step 4: Call the cpu addition function
    // Set up kernel configuration
    dim3 block_dim(1);
    dim3 grid_dim(1);

    // Call cuda add kernel
    vector_add(d_c, d_a, d_b, N, block_dim, grid_dim);

    // Step 5: Transfer data from global mem to host mem
    CUDA_CHECK(cudaMemcpy(h_c.data(), d_c, size_bytes, cudaMemcpyDeviceToHost));

    // Step 6: Check for errors (all values should be 3.0f)
    float sumError = 0.0f;
    for (int i = 0; i < N; i++) {
        sumError += fabs(h_c[i] - 3.0f);
    }
    std::cout << "Sum error: " << sumError << std::endl;

    if (d_a) {
        CUDA_CHECK(cudaFree(d_a));
    }
    if (d_b) {
        CUDA_CHECK(cudaFree(d_b));
    }
    if (d_c) {
        CUDA_CHECK(cudaFree(d_c));
    }
}
```

>   可以修改其中的：
>
>   ```c++
>   dim3 block_dim(1);
>   dim3 grid_dim(1);
>   ```

不同情况下的性能如下：

![cuda-8.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/cuda-8.png)

可以使用 Nsight Systems（nsys，NVIDIA系统级性能分析工具）来分析；

启动 profiling：

```bash
nsys profile -t cuda,nvtx,osrt -o add_cuda_profiling -f true ./add_cuda_profiling
```

解析并统计性能信息：

```bash
nsys stats add_cuda_profiling.nsys-rep


 ** OS Runtime Summary (osrt_sum):

 Time (%)  Total Time (ns)  Num Calls    Avg (ns)       Med (ns)      Min (ns)    Max (ns)     StdDev (ns)            Name         
 --------  ---------------  ---------  -------------  -------------  ----------  -----------  -------------  ----------------------
     56.2    7,592,724,284         84   90,389,574.8  100,130,776.0       2,330  370,626,986   45,049,255.4  poll                  
     42.4    5,736,493,727         26  220,634,374.1  189,702,756.5  41,077,614  752,975,386  124,762,585.8  sem_wait              
      1.2      164,252,099        543      302,490.1       13,509.0         529  111,402,991    4,818,716.4  ioctl                 
      0.1       14,968,499         38      393,907.9      131,267.0         135    5,539,804      890,642.6  pthread_rwlock_wrlock                 
......

 ** CUDA API Summary (cuda_api_sum):

 Time (%)  Total Time (ns)  Num Calls    Avg (ns)     Med (ns)    Min (ns)   Max (ns)     StdDev (ns)            Name         
 --------  ---------------  ---------  ------------  -----------  --------  -----------  -------------  ----------------------
     96.9    6,504,565,162  1,048,576       6,203.2      5,159.0     2,928   37,814,020       99,097.6  cudaLaunchKernel      
      3.0      203,141,797          3  67,713,932.3    103,908.0    73,162  202,964,727  117,130,625.1  cudaMalloc            
      0.1        4,017,591          4   1,004,397.8  1,012,632.0   941,545    1,050,782       45,652.8  cudaMemcpy            
      0.0          524,788          3     174,929.3    136,182.0   122,785      265,821       78,999.0  cudaFree              
      0.0            2,584          1       2,584.0      2,584.0     2,584        2,584            0.0  cuModuleGetLoadingMode

......
```

各个类型 API Summary 分析结果如下：

![cuda-9.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/cuda-9.png)

可以看到：`<<<1,1>>>` cudaLaunchKernel 占比非常高这是由于：

**核函数调用有开销，在外面多次循环调用开销巨大！**

因此，需要进行优化！

<br/>

### **2、将循环放入核函数（Grid-strided loop）**

由于在循环中频繁的调用核函数具有巨大的性能开销，因此可以将循环放入核函数中：

```c++
template<typename T>
__global__ void add_kernel_inner_loop(T *c, const T *a, const T *b, const size_t n, const size_t step) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    for (size_t i = idx; i < n; i += step) {
        if (i < n) {
            c[i] = a[i] + b[i];
        }
    }
}

template<typename T>
void vector_add(T *c, const T *a, const T *b, size_t n, const dim3& grid_dim, const dim3& block_dim) {
    size_t step = grid_dim.x * block_dim.x;
    add_kernel_inner_loop<<<grid_dim, block_dim>>>(c, a, b, n, step);
}
```

分析后结果如下图：

![cuda-10.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/cuda-10.png)

同时使用 nsys 分析：

```bash
 ** CUDA API Summary (cuda_api_sum):

 Time (%)  Total Time (ns)  Num Calls    Avg (ns)     Med (ns)    Min (ns)   Max (ns)     StdDev (ns)            Name         
 --------  ---------------  ---------  ------------  -----------  --------  -----------  -------------  ----------------------
     55.4      204,935,456          3  68,311,818.7    104,741.0    79,097  204,751,618  118,160,333.0  cudaMalloc            
     44.4      164,057,041          4  41,014,260.3  1,000,521.5   926,775  161,129,223   80,076,651.2  cudaMemcpy            
      0.2          653,441          3     217,813.7    204,732.0   194,409      254,300       32,016.9  cudaFree              
      0.1          264,055          1     264,055.0    264,055.0   264,055      264,055            0.0  cudaLaunchKernel      
      0.0            2,429          1       2,429.0      2,429.0     2,429        2,429            0.0  cuModuleGetLoadingMode

```

可以看到 cudaLaunchKernel 的确少了很多！ 

>   这说明：
>
>   <font color="#f00">**核函数的发射数量减少，因此总体执行时间降低！**</font>

<br/>

### **3、CUDA并行加法性能评估（加速比）**

指标：

加速比 = T<sub>cpu</sub> / T<sub>gpu</sub>

其中：

-   **T_cpu** 是任务在 CPU 上的执行时间；
-   **T_gpu** 是任务在 GPU 上的执行时间；

>   **理想加速比与实际加速比**
>
>   1.  **理想加速比**：当任务完全并行化且没有任何开销时，加速比等于处理器核心数之比。例如，一个具有 1000 个 CUDA 核心的 GPU 理论上可以实现 1000 倍的加速（相对于单核 CPU）。
>   2.  **实际加速比**：由于以下因素，实际加速比通常远低于理想值：
>       -   任务中存在无法并行化的串行部分
>       -   数据在 CPU 和 GPU 之间的传输开销
>       -   线程同步和内存访问延迟
>       -   算法在 GPU 架构上的效率低下

#### **为什么`<<<1,1>>>` 比 CPU慢？**

这是由于，单个 GPU 的核心实际上要比 CPU 的能力要弱！

实际上，GPU 是由于干活的人多，所以快！

<br/>

### **4、CUDA并行加法性能评估（总耗时）**

实际上观察 nsys 的输出结果：

```bash
 ** CUDA GPU Kernel Summary (cuda_gpu_kern_sum):

 Time (%)  Total Time (ns)  Instances    Avg (ns)       Med (ns)      Min (ns)     Max (ns)    StdDev (ns)                                              Name                                             
 --------  ---------------  ---------  -------------  -------------  -----------  -----------  -----------  ---------------------------------------------------------------------------------------------
    100.0      160,054,287          1  160,054,287.0  160,054,287.0  160,054,287  160,054,287          0.0  void add_kernel_inner_loop<float>(T1 *, const T1 *, const T1 *, unsigned long, unsigned long)

Processing [add_cuda_profiling2.sqlite] with [/usr/local/cuda-12.1/nsight-systems-2023.1.2/host-linux-x64/reports/cuda_gpu_mem_time_sum.py]... 

 ** CUDA GPU MemOps Summary (by Time) (cuda_gpu_mem_time_sum):

 Time (%)  Total Time (ns)  Count  Avg (ns)   Med (ns)   Min (ns)  Max (ns)  StdDev (ns)      Operation     
 --------  ---------------  -----  ---------  ---------  --------  --------  -----------  ------------------
     78.4        2,318,310      3  772,770.0  763,159.0   761,400   793,751     18,191.4  [CUDA memcpy HtoD]
     21.6          640,473      1  640,473.0  640,473.0   640,473   640,473          0.0  [CUDA memcpy DtoH]
```

总体的耗时应当是三个部分：

-   **总耗时 = T<sub>H2D</sub> + T<sub>kernel</sub> + T<sub>D2H</sub>**

并且，对于 `<<<256,256>>>` 来说：**HtoD 和 DtoH 的耗时会远大于 kernel 的运行时间！**

>   **这就说明，来回的移动和复制数据比计算更消耗时间！**

能否对这一部分进行优化呢？

后面的文章中会讲解！

<br/>

## **（四）、设备信息**

对于 GPU 而言：**越多的线程 => 越大的并行度 => 越好的性能**

GPU 最大可以启动的线程数可以参考：

-   官网查询硬件：https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html#features-and-technical-specifications
-   代码动态获取（cudaDeivceProp）：https://docs.nvidia.com/cuda/cuda-runtime-api/index.html

>   也可以参考：
>
>   -   https://www.nvidia.cn/docs/IO/51635/NVIDIA_CUDA_Programming_Guide_1.1_chs.pdf

<br/>

### **1、cudaDeivceProp**

重点的几个参数：

-   **maxGridSize（int[3]）**：x、y、z三个方向分别最多可支持的 block 数；
-   **maxBlockSize（int[3]）**：每个 Block中x、y、z三个方向分别最多可支持的线程数；
-   **maxThreadsPerBlock（int）**：每个 block 中最多可有的线程数

>   **其中：Blocksize 需同时满足这两组条件：maxBlockSize、maxThreadsPerBlock：**
>
>   -   x、y、z加起来不超过：maxThreadsPerBlock；
>   -   x、y、z各个方向不超过：maxBlockSize；

<br/>

### **2、CUDA版本**

查看 CUDA 版本使用：

```bash
# CUDA版本
nvcc --version

nvcc: NVIDIA (R) Cuda compiler driver
Copyright (c) 2005-2023 NVIDIA Corporation
Built on Tue_Feb__7_19:32:13_PST_2023
Cuda compilation tools, release 12.1, V12.1.66
Build cuda_12.1.r12.1/compiler.32415258_0
```

>   可以看到 CUDA 为 12.1！

而 `nvidia-smi` 命令输出的是：**驱动支持的的最高版本，而非实际正在使用的版本！**

```bash
Tue Jul 29 09:30:09 2025       
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 550.54.15              Driver Version: 550.54.15      CUDA Version: 12.4     |
|-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|                                         |                        |               MIG M. |
|=========================================+========================+======================|
|   0  Tesla T4                       Off |   00000000:00:04.0 Off |                    0 |
| N/A   38C    P8             10W /   70W |       0MiB /  15360MiB |      0%      Default |
|                                         |                        |                  N/A |
+-----------------------------------------+------------------------+----------------------+
                                                                                         
+-----------------------------------------------------------------------------------------+
| Processes:                                                                              |
|  GPU   GI   CI        PID   Type   Process name                              GPU Memory |
|        ID   ID                                                               Usage      |
|=========================================================================================|
|  No running processes found                                                             |
+-----------------------------------------------------------------------------------------+
```

>   **可以看到，最高支持 12.4！**

<br/>

## **后记**

更加详细的内容，可以看：

-   https://qiankunli.github.io/2025/03/22/cuda.html

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/high-performance-computing-learn/blob/main/cuda/1_introduction_to_parallel_programming_and_cuda.ipynb

参考文章：

-   https://beta.infinitensor.com/camp/summer2025/stage/1/course/cuda-programming
-   https://qiankunli.github.io/2025/03/22/cuda.html#simd%E5%92%8Csimt
-   https://www.nvidia.cn/docs/IO/51635/NVIDIA_CUDA_Programming_Guide_1.1_chs.pdf

<br/>
