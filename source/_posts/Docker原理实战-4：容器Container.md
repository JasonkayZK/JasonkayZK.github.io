---
title: Docker原理实战-4：容器Container
toc: true
cover: 'https://img.paulzzh.com/touhou/random?4'
date: 2021-09-05 15:24:47
categories: Docker
tags: [Docker, Linux, Container, 容器]
description: 前三篇分别讲解了Linux内核所以提供的功能：Namespace、Cgroups和UnionFS，本篇使用这些技术，真正的实现一个类似于Docker运行环境下的容器；
---

前三篇分别讲解了Linux内核所以提供的功能：Namespace、Cgroups和UnionFS，本篇使用这些技术，真正的实现一个类似于Docker运行环境下的容器；

系列文章：

-   [Docker原理实战-1：Namespace](/2021/08/29/Docker原理实战-1：Namespace/)
-   [Docker原理实战-2：Cgroups](/2021/08/29/Docker原理实战-2：Cgroups/)
-   [Docker原理实战-3：UnionFS](/2021/08/29/Docker原理实战-3：UnionFS/)
-   [Docker原理实战-4：容器Container](/2021/09/05/Docker原理实战-4：容器Container/)

源代码：

-   https://github.com/JasonkayZK/my_docker

<br/>

<!--more-->

# **Docker原理实战-4：容器Container**

## **前言：proc文件系统**

在手写我们的Container之前，先简单介绍一下Linux中的`/proc`；

众所周知，在Linux中，一切皆文件；而`/proc`文件系统是由内核提供的，它**并非真正的文件系统，而是存在于内存中的、包含了整个系统运行时的信息（硬件配置、系统mount设备等）；**

`/proc`以文件的形式存在，为访问内核数据的操作提供了接口；

>   **实际上，很多系统工具就是简单读取`/proc`下的某个文件内容实现的；**
>
>   **如：`lsmod`命令，实际上就是`cat /proc/modules`**

下面是关于`/proc`下的一些目录的总结：

| 路径            | 说明                                  |
| :-------------- | ------------------------------------- |
| /proc/N         | PID为Ν的进程信息                      |
| /proc/N/cmdline | 进程启动命令                          |
| /proc/N/cwd     | 链接到进程当前工作目录                |
| /proc/N/environ | 进程环境变量列表                      |
| /proc/N/exe     | 链接到进程的执行命令文件              |
| /proc/N/fd      | 包含进程相关的所有文件描述符          |
| /proc/N/maps    | 与进程相关的内存映射信息              |
| /proc/N/mem     | 指代进程持有的内存，不可读            |
| /proc/N/root    | 链接到进程的根目录                    |
| /proc/N/stat    | 进程的状态                            |
| /proc/N/statm   | 进程使用的内存状态                    |
| /proc/N/status  | 进程状态信息，比 stat/statm更具可读性 |
| /proc/self/     | 链接到当前正在运行的进程              |

对于`/proc/N`下的各个目录，基本上完整的描述了一个进程在操作系统中的内容；

>   **尤其要注意的是：`/proc/self/`；**
>
>   **看似比较鸡肋，但是是后面我们构造容器时具有终于作用！**

了解了`/proc`之后，我们开始真正的构建一个容器吧！

为了简单起见，我们先按照自底向上的顺序，介绍容器内资源限制的组件，然后再自顶向下地构建命令行工具；

<br/>

## **一、使用Cgroups限制容器资源组件**

本小节从定义Subsystem接口开始，自底向上地介绍如何使用Cgroups限制进程资源；

首先，为了简单起见，我们仅仅对下面三种资源进行限制，其他资源也是完全类似的实现方式：

-   内存限制；
-   CPU核心数；
-   CPU时间片权重；

### **1、Subsystem接口抽象**

根据上面的资源限制类型，抽象出对应的Subsystem接口：

chapter3_container/3_3_container_with_limit_and_pipe/cgroups/subsystems/subsystems.go

```go
package subsystems

var (
	SubsystemIns = []Subsystem{
		&CpuSetSubSystem{},
		&MemorySubSystem{},
		&CpuSubSystem{},
	}

	CgroupConfigPath = "tasks"
)

// ResourceConfig 用于传递资源限制的结构体
type ResourceConfig struct {
	MemoryLimit string // 内存限制
	CpuShare    string // CPU时间片权重
	CpuSet      string // CPU核心数
}

// Subsystem Subsystem接口
// 这里将 cgroups 抽象为了 path，因为 cgroups 在 hierarchy 的路径就是虚拟文件系统中的路径！
type Subsystem interface {
	// Name 返回subsystem的名称，如：cpu、memory等
	Name() string

	// Set 设置某个cgroup在这个subsystem中的资源限制
	Set(path string, res *ResourceConfig) error

	// Apply 将指定pid对应的进程添加至某个cgroup中
	Apply(path string, pid int) error

	// Remove 移除某个cgroup
	Remove(path string) error
}
```

Subsystem接口共包含了四个方法：

-   `Name()`：返回对应subsystem的名称，如：`memory`、`cpuset`等；
-   `Set(path string, res *ResourceConfig)`：用于设置某个cgroup在这个subsystem中的资源限制；
-   `Apply(path string, pid int)`：将指定pid对应的进程添加至某个cgroup中；
-   `Remove(path string)`：移除某个cgroup；

这样，我们就**可以使用`Set`方法设置一个对应的硬件资源，并使用`Apply`方法让其对某个PID生效！**

<br/>

### **2、一些辅助函数**

在之前第二篇对于Cgroups的讲解中，我们知道：

<font color="#f00">**Cgroups是目录型的结构，而如果我们想要限制进程资源，只需要在Cgroups的根路径下创建新的目录，并修改该目录下的配置，并将进程的PID移至这个新目录下的`tasks`文件中即可；**</font>

为了实现这个目的，我创建了两个工具函数，如下：

chapter3_container/3_3_container_with_limit_and_pipe/cgroups/utils/utils.go

```go
package utils

var (
	DefaultCgroupFilePerm os.FileMode = 0755

	DefaultCgroupConfigFilePerm os.FileMode = 0755
)

// FindCgroupMountPoint 查询对应subsystem在当前进程中的挂载点路径
// /proc/self/mountinfo 文件格式：
// 43 35 0:37 / /sys/fs/cgroup/memory rw,nosuid,nodev,noexec,relatime shared:18 - cgroup cgroup rw,memory
// 查找最后一部分的逗号分隔字段，如：memory
func FindCgroupMountPoint(subsystem string) string {
	// 打开当前进程挂载文件（后面会查询信息）
	f, err := os.Open("/proc/self/mountinfo")
	if err != nil {
		return ""
	}
	defer func(f *os.File) {
		err := f.Close()
		if err != nil {
			log.Error(err)
		}
	}(f)

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		content := scanner.Text()
		fields := strings.Split(content, " ")
		for _, opt := range strings.Split(fields[len(fields)-1], ",") {
			if opt == subsystem {
				return fields[4]
			}
		}
	}
	if err := scanner.Err(); err != nil {
		log.Error(err)
		return ""
	}
	return ""
}

// GetCgroupPath 获取当前进程中指定cgroup对应的路径
func GetCgroupPath(subsystem string, cgroupPath string) (string, error) {
	cgroupRoot := FindCgroupMountPoint(subsystem)

	// 查询文件是否已经存在
	_, err := os.Stat(path.Join(cgroupRoot, cgroupPath))
	if err != nil {
		// 非文件不存在错误，返回错误
		if !os.IsNotExist(err) {
			return "", fmt.Errorf("cgroup path error %v", err)
		} else { // 如果是文件不存在错误，创建
			if err := os.Mkdir(path.Join(cgroupRoot, cgroupPath), DefaultCgroupFilePerm); err != nil {
				return "", fmt.Errorf("error create cgroup %v", err)
			}
		}
	}

	return path.Join(cgroupRoot, cgroupPath), nil
}
```

上面定义了两个辅助工具函数：

-   `FindCgroupMountPoint`：查询对应subsystem在当前进程中的挂载点路径；
-   `GetCgroupPath`：获取当前进程中指定子cgroup对应的路径（如不存在，则创建）；

>   **由于不同的subsystem所在的系统Cgroups配置根路径是不同的，因此：**
>
>   <font color="#f00">**我们需要一个函数来帮助我们寻找对应Cgroups下的subsystem在`/proc`中的路径，即`GetCgroupPath`函数**</font>
>
>   <font color="#f00">**需要注意的是：对于不同的进程，其所挂载的文件系统也是不同的！**</font>
>
>   <font color="#f00">**我们可以在当前进程中通过查看`/proc/self/mountinfo`文件，获取当前进程所对应subsystem的挂载点根路径！**</font>
>
>   文件格式如下：
>
>   `43 35 0:37 / /sys/fs/cgroup/memory rw,nosuid,nodev,noexec,relatime shared:18 - cgroup cgroup rw,memory`
>
>   可以看到最后一部分的逗号分隔字段，如：memory；
>
>   则当前进程的cgroup根路径为：`/sys/fs/cgroup/memory`；


#### **① `FindCgroupMountPoint`函数**

`FindCgroupMountPoint`主要是用在`GetCgroupPath`函数中的，因此我们先来看`FindCgroupMountPoint`函数；

```go
// FindCgroupMountPoint 查询对应subsystem在当前进程中的挂载点路径
// /proc/self/mountinfo 文件格式：
// 43 35 0:37 / /sys/fs/cgroup/memory rw,nosuid,nodev,noexec,relatime shared:18 - cgroup cgroup rw,memory
// 查找最后一部分的逗号分隔字段，如：memory
func FindCgroupMountPoint(subsystem string) string {
	// 打开当前进程挂载文件（后面会查询信息）
	f, err := os.Open("/proc/self/mountinfo")
	if err != nil {
		return ""
	}
	defer func(f *os.File) {
		err := f.Close()
		if err != nil {
			log.Error(err)
		}
	}(f)

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		content := scanner.Text()
		fields := strings.Split(content, " ")
		for _, opt := range strings.Split(fields[len(fields)-1], ",") {
			if opt == subsystem {
				return fields[4]
			}
		}
	}
	if err := scanner.Err(); err != nil {
		log.Error(err)
		return ""
	}
	return ""
}
```

根据上文所述，`FindCgroupMountPoint`函数首先打开当前进程挂载文件：`/proc/self/mountinfo`；

并在文件中按行查找函数入参中指定的`subsystem`名称的配置，如果找到则返回第五项，即：`/sys/fs/cgroup/memory`；

<br/>

#### **② `GetCgroupPath`函数**

再来看函数`GetCgroupPath`：

```go
// GetCgroupPath 获取当前进程中指定cgroup对应的路径
func GetCgroupPath(subsystem string, cgroupPath string) (string, error) {
	cgroupRoot := FindCgroupMountPoint(subsystem)

	// 查询文件是否已经存在
	_, err := os.Stat(path.Join(cgroupRoot, cgroupPath))
	if err != nil {
		// 非文件不存在错误，返回错误
		if !os.IsNotExist(err) {
			return "", fmt.Errorf("cgroup path error %v", err)
		} else { // 如果是文件不存在错误，创建
			if err := os.Mkdir(path.Join(cgroupRoot, cgroupPath), DefaultCgroupFilePerm); err != nil {
				return "", fmt.Errorf("error create cgroup %v", err)
			}
		}
	}

	return path.Join(cgroupRoot, cgroupPath), nil
}
```

在函数`GetCgroupPath`中，首先通过`FindCgroupMountPoint(subsystem)`获取到了对于指定Subsystem对应Cgroup的根路径；

随后，判断在Cgroup的根路径下是否存在子cgroupPath，如果不存在则创建；

最后，返回这个子Cgroup的路径；

<br/>

### **3、具体Subsystem接口实现**

下面以内存为例，来看一下如何实现Subsystem接口；

chapter3_container/3_3_container_with_limit_and_pipe/cgroups/subsystems/memory.go

```go
package subsystems

import (
	"fmt"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"my_docker/cgroups/utils"
	"os"
	"path"
	"strconv"
)

var (
	MemoryName = `memory`

	MemoryNameCgroupConfig = "memory.limit_in_bytes"
)

type MemorySubSystem struct {
}

func (m *MemorySubSystem) Name() string {
	return MemoryName
}

func (m *MemorySubSystem) Set(cgroupPath string, res *ResourceConfig) error {
	subsystemCgroupPath, err := utils.GetCgroupPath(m.Name(), cgroupPath)
	if err != nil {
		return err
	}

	configPath := path.Join(subsystemCgroupPath, MemoryNameCgroupConfig)
	// 如果存在内存限制的配置
	if res.MemoryLimit != "" {
		err = ioutil.WriteFile(configPath,
			[]byte(res.MemoryLimit), utils.DefaultCgroupConfigFilePerm)
		if err != nil {
			return fmt.Errorf("set cgroup cpuset fail %v", err)
		}
	}

	log.Infof("set memory success, file: %s, size: %s",
		configPath,
		res.MemoryLimit,
	)
	return nil
}

func (m *MemorySubSystem) Apply(cgroupPath string, pid int) error {
	subsystemCgroupPath, err := utils.GetCgroupPath(m.Name(), cgroupPath)
	if err != nil {
		return fmt.Errorf("get cgroup %s error: %v", cgroupPath, err)
	}

	configPath := path.Join(subsystemCgroupPath, CgroupConfigPath)
	err = ioutil.WriteFile(configPath,
		[]byte(strconv.Itoa(pid)), utils.DefaultCgroupConfigFilePerm)
	if err != nil {
		return fmt.Errorf("set cgroup proc fail %v", err)
	}

	log.Infof("apply memory success, file: %s, pid: %d",
		path.Join(subsystemCgroupPath, CgroupConfigPath),
		pid,
	)
	return nil
}

func (m *MemorySubSystem) Remove(cgroupPath string) error {
	subsystemCgroupPath, err := utils.GetCgroupPath(m.Name(), cgroupPath)
	if err != nil {
		return fmt.Errorf("get cgroup %s error: %v", cgroupPath, err)
	}
	return os.RemoveAll(subsystemCgroupPath)
}
```

#### **① Name方法**

首先，Name方法返回了内存限制subsystem的名称：`MemoryName = "memory"`；

#### **② Set方法**

Set方法的实现如下：

```go
func (m *MemorySubSystem) Set(cgroupPath string, res *ResourceConfig) error {
	subsystemCgroupPath, err := utils.GetCgroupPath(m.Name(), cgroupPath)
	if err != nil {
		return err
	}

	configPath := path.Join(subsystemCgroupPath, MemoryNameCgroupConfig)
	// 如果存在内存限制的配置
	if res.MemoryLimit != "" {
		err = ioutil.WriteFile(configPath,
			[]byte(res.MemoryLimit), utils.DefaultCgroupConfigFilePerm)
		if err != nil {
			return fmt.Errorf("set cgroup cpuset fail %v", err)
		}
	}

	log.Infof("set memory success, file: %s, size: %s",
		configPath,
		res.MemoryLimit,
	)
	return nil
}
```

Set方法首先通过工具函数GetCgroupPath获取到了子Cgroup的路径；

随后，通过`path.Join`拼接出了具体内存限制所对应的子Cgroup的配置文件路径，如：

`/sys/fs/cgroup/memory/testmemlimit/memory.limit_in_bytes`

可以看到：

-   内存限制的根Cgroup配置路径为：`/sys/fs/cgroup/memory`;
-   子Cgroup为：`testmemlimit`；
-   内存限制文件为：`MemoryNameCgroupConfig = "memory.limit_in_bytes"`，是一个固定的值！

然后，如果传入的配置中存在关于内存限制的配置，则将配置大小写入文件中，如：`1000m`；

同时，如果不存在此文件，则创建文件后再写入；

#### **③ Apply方法**

Apply方法的实现也是非常简单，代码如下：

```go
func (m *MemorySubSystem) Apply(cgroupPath string, pid int) error {
	subsystemCgroupPath, err := utils.GetCgroupPath(m.Name(), cgroupPath)
	if err != nil {
		return fmt.Errorf("get cgroup %s error: %v", cgroupPath, err)
	}

	configPath := path.Join(subsystemCgroupPath, CgroupConfigPath)
	err = ioutil.WriteFile(configPath,
		[]byte(strconv.Itoa(pid)), utils.DefaultCgroupConfigFilePerm)
	if err != nil {
		return fmt.Errorf("set cgroup proc fail %v", err)
	}

	log.Infof("apply memory success, file: %s, pid: %d",
		path.Join(subsystemCgroupPath, CgroupConfigPath),
		pid,
	)
	return nil
}
```

首先也是通过` utils.GetCgroupPath(m.Name(), cgroupPath)`找到内存对应的子Cgroup路径（和Set方法相同）；

随后，向路径下的`tasks`文件写入指定的PID号即可！

>   **在Linux中对于资源的限制就是这么简单！**

#### **④ Remove方法**

Remove方法就更简单了，代码如下：

```go
func (m *MemorySubSystem) Remove(cgroupPath string) error {
	subsystemCgroupPath, err := utils.GetCgroupPath(m.Name(), cgroupPath)
	if err != nil {
		return fmt.Errorf("get cgroup %s error: %v", cgroupPath, err)
	}
	return os.RemoveAll(subsystemCgroupPath)
}
```

直接获取当前配置路径，并删除整个配置目录即可！

<br/>

### **4、其他Subsystem实现**

下面是CPU核心数和CPU时间片限制对应Subsystem接口实现的代码，和内存限制完全类似，这里不再赘述！

#### **① CPU核心数**

chapter3_container/3_3_container_with_limit_and_pipe/cgroups/subsystems/cpuset.go

```go
package subsystems

import (
	"fmt"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"my_docker/cgroups/utils"
	"os"
	"path"
	"strconv"
)

var (
	CpuSetName = `cpuset`

	CpuSetCgroupConfig = "cpuset.cpus"
)

type CpuSetSubSystem struct {
}

func (c *CpuSetSubSystem) Name() string {
	return CpuSetName
}

func (c *CpuSetSubSystem) Set(cgroupPath string, res *ResourceConfig) error {
	subsystemCgroupPath, err := utils.GetCgroupPath(c.Name(), cgroupPath)
	if err != nil {
		return err
	}

	// 如果存在CPU核心数的配置
	configPath := path.Join(subsystemCgroupPath, CpuSetCgroupConfig)
	if res.CpuSet != "" {
		err = ioutil.WriteFile(configPath,
			[]byte(res.CpuSet), utils.DefaultCgroupConfigFilePerm)
		if err != nil {
			return fmt.Errorf("set cgroup cpuset fail %v", err)
		}
	}

	log.Infof("set cpu-set success, file: %s, cpu-set num: %s",
		configPath,
		res.CpuSet,
	)
	return nil
}

func (c *CpuSetSubSystem) Apply(cgroupPath string, pid int) error {
	subsystemCgroupPath, err := utils.GetCgroupPath(c.Name(), cgroupPath)
	if err != nil {
		return fmt.Errorf("get cgroup %s error: %v", cgroupPath, err)
	}

	configPath := path.Join(subsystemCgroupPath, CgroupConfigPath)
	err = ioutil.WriteFile(configPath,
		[]byte(strconv.Itoa(pid)), utils.DefaultCgroupConfigFilePerm)
	if err != nil {
		return fmt.Errorf("set cpuset cgroup proc fail %v", err)
	}

	log.Infof("apply cpu-set success, file: %s, pid: %d",
		path.Join(subsystemCgroupPath, CgroupConfigPath),
		pid,
	)
	return nil
}

func (c *CpuSetSubSystem) Remove(cgroupPath string) error {
	subsystemCgroupPath, err := utils.GetCgroupPath(c.Name(), cgroupPath)
	if err != nil {
		return fmt.Errorf("get cgroup %s error: %v", cgroupPath, err)
	}
	return os.RemoveAll(subsystemCgroupPath)
}
```

#### **② CPU时间片**

chapter3_container/3_3_container_with_limit_and_pipe/cgroups/subsystems/cpu.go

```go
package subsystems

import (
	"fmt"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"my_docker/cgroups/utils"
	"os"
	"path"
	"strconv"
)

var (
	CpuName = `cpu`

	CpuCgroupConfig = "cpu.shares"
)

type CpuSubSystem struct {
}

func (c *CpuSubSystem) Name() string {
	return CpuName
}

func (c *CpuSubSystem) Set(cgroupPath string, res *ResourceConfig) error {
	subsystemCgroupPath, err := utils.GetCgroupPath(c.Name(), cgroupPath)
	if err != nil {
		return err
	}

	configPath := path.Join(subsystemCgroupPath, CpuCgroupConfig)
	// 如果存在CPU时间片的配置
	if res.CpuShare != "" {
		err = ioutil.WriteFile(configPath,
			[]byte(res.CpuShare), utils.DefaultCgroupConfigFilePerm)
		if err != nil {
			return fmt.Errorf("set cgroup cpu share fail %v", err)
		}
	}

	log.Infof("set cpu-share success, file: %s, cpu-share: %s",
		configPath,
		res.CpuShare,
	)
	return nil
}

func (c *CpuSubSystem) Apply(cgroupPath string, pid int) error {
	subsystemCgroupPath, err := utils.GetCgroupPath(c.Name(), cgroupPath)
	if err != nil {
		return fmt.Errorf("get cgroup %s error: %v", cgroupPath, err)
	}

	configPath := path.Join(subsystemCgroupPath, CgroupConfigPath)
	err = ioutil.WriteFile(configPath,
		[]byte(strconv.Itoa(pid)), utils.DefaultCgroupConfigFilePerm)
	if err != nil {
		return fmt.Errorf("set cgroup proc fail %v", err)
	}

	log.Infof("apply cpu-share success, file: %s, pid: %d",
		path.Join(subsystemCgroupPath, CgroupConfigPath),
		pid,
	)
	return nil
}

func (c *CpuSubSystem) Remove(cgroupPath string) error {
	subsystemCgroupPath, err := utils.GetCgroupPath(c.Name(), cgroupPath)
	if err != nil {
		return fmt.Errorf("get cgroup %s error: %v", cgroupPath, err)
	}
	return os.RemoveAll(subsystemCgroupPath)
}
```

<br/>

### **5、Cgroup整体管理者：CgroupManager**

为了方便使用，在所有的Subsystem之上封装一个CgroupManager，通过传入ResourceConfig配置直接对资源进行限制；

代码如下：

chapter3_container/3_3_container_with_limit_and_pipe/cgroups/cgroups_manager.go

```go
package cgroups

import (
	"github.com/sirupsen/logrus"
	"my_docker/cgroups/subsystems"
)

// CgroupManager cgroups的整体管理者(同时管理多种类型的cgroup)
type CgroupManager struct {
	// cgroup在hierarchy中的路径 相当于创建的cgroup目录相对于root cgroup目录的路径
	Path string
	// 资源配置
	Resource *subsystems.ResourceConfig
}

func NewCgroupManager(path string) *CgroupManager {
	return &CgroupManager{
		Path: path,
	}
}

// Apply 将进程pid加入到这个cgroup中
func (c *CgroupManager) Apply(pid int) error {
	for _, subSysIns := range subsystems.SubsystemIns {
		err := subSysIns.Apply(c.Path, pid)
		if err != nil {
			return err
		}
	}
	return nil
}

// Set 设置cgroup资源限制
func (c *CgroupManager) Set(res *subsystems.ResourceConfig) error {
	for _, subSysIns := range subsystems.SubsystemIns {
		err := subSysIns.Set(c.Path, res)
		if err != nil {
			return err
		}
	}
	return nil
}

// Destroy 释放cgroup
func (c *CgroupManager) Destroy() error {
	for _, subSysIns := range subsystems.SubsystemIns {
		if err := subSysIns.Remove(c.Path); err != nil {
			logrus.Warnf("remove cgroup fail %v", err)
		}
	}
	return nil
}
```

CgroupManager包括两个配置信息：

-   Path：子cgroup在hierarchy中的路径，即所创建的子cgroup目录相对于根Cgroup目录的路径；
-   Resource：即各个Subsystem所对应的资源限制；

同时，CgroupManager包括了三个方法：Set、Apply和Destroy；

实现非常简单，就是通过调用具体Subsystem数组中各个Subsystem的方法实现；

<br/>

## **二、构建命令行工具**

有了资源限制器之后，接下来我们开始创建我们的命令行工具（众所周知，Docker就是一个命令行工具）；

>   构建命令行工具时我们使用了著名的`cli`工具库：
>
>   -   github.com/urfave/cli

#### **1、命令行预期功能实现**

在本篇实现的命令行中，我们会实现：

-   使用类似于`docker run -it [command]`的命令创建一个容器；
-   使用`-m 100m -cpuset 1 -cpushare 512`等Flag对容器内资源进行限制；

#### **2、命令行入口**

在构建命令行工具时，我将采用自上而下的方式进行构建：从函数的入口开始，然后是每一个命令行Flag的实现；

首先来看main函数：

chapter3_container/3_3_container_with_limit_and_pipe/main.go

```go
package main

import (
	log "github.com/sirupsen/logrus"
	"github.com/urfave/cli"
	"my_docker/cmd"
	"os"
)

const usage = `my-docker is a simple container runtime implementation.
			   The purpose of this project is to learn how docker works and how to write a docker by ourselves
			   Enjoy it, just for fun.`

func main() {
	app := cli.NewApp()
	app.Name = "my-docker"
	app.Usage = usage

	app.Commands = []cli.Command{
		cmd.InitCommand,
		cmd.RunCommand,
	}

	app.Before = func(context *cli.Context) error {
		// Log as JSON instead of the default ASCII formatter.
		log.SetFormatter(&log.JSONFormatter{})
		log.SetOutput(os.Stdout)
		return nil
	}

	if err := app.Run(os.Args); err != nil {
		log.Fatal(err)
	}
}
```

代码非常简单：

首先，使用`cli.NewApp()`创建了一个命令行应用，并指定了应用的名称和说明；

随后，加入了两个命令：

-   `InitCommand`；
-   `RunCommand`；

<font color="#f00">**注：上面这两个命令非常的重要，是实现整个容器的核心！**</font>

最后，在`app.Before`中，配置了日志输出格式和地址（标准输出流），并使用`app.Run(os.Args)`启动了应用；

>   <font color="#f00">**在Run方法中会匹配用户指定的命令，进入到对应的`XxxCommand`函数中！**</font>

<br/>

## **三、具体命令行参数实现**

### **1、进程间通信方式管道：Pipe概述**

上面我们实现了命令行工具的入口方法，在接下来继续进行命令行命令的具体实现前，还需要补充一些关于Linix进程间通信管道（Pipe）的知识；

>   <font color="#f00">**因为我们所创建的容器是在一个新的进程中，因此需要通过管道进行进程间通信！**</font>

进程间通信包括了很多种方式，管道只是其中一种；

所谓管道（Pipe），就是一个连接两个进程的通道，他是Linux支持IPC的一种方式；

通常，管道都是半双工的：一端进行写操作，而另一端进行读操作！

同时，管道可以分为两种类型：

-   **无名管道**：通常用于具有亲缘关系的进程之间直接进行通信；
-   **有名管道（FIFO管道）**：它是一种存在于文件系统中的管道，可以被两个没有任何亲缘关系的进程进行访问；有名管道可以通过`mkfifo()`函数来创建；

>   <font color="#f00">**本质上来说：管道也是文件的一种！**</font>
>
>   但是它和文件通信的区别在于：
>
>   <font color="#f00">**管道有一个固定大小的缓冲区（大小一般是4KB）：**</font>
>
>   -   <font color="#f00">**当管道被写满时，写进程就会被阻塞，直到有读进程把管道的内容读出来；**</font>
>   -   <font color="#f00">**同样地，当读进程从管道内拿数据的时候，如果这时管道的内容是空的，那么读进程同样会被阻塞，一直等到有写进程向管道内写数据！**</font>

在Go中，可以使用`os.Pipe()`创建一个匿名管道：

-   `func Pipe() (r *File, w *File, err error)`；

函数返回两个变量，一个是读、一个是写，其类型都是文件类型；

**在后文中，我们会使用这个函数创建宿主进程和容器进程之间的通道，将初始化命令通过宿主进程传递给容器进程中！**

接下来进行命令的具体实现！

<br/>

### **2、具体命令实现**

对于InitCommand而言，是在容器中进行初始化时，由我们的命令行工具调用的，而非用户调用的；

因此我们直接来看RunCommand命令的实现：

chapter3_container/3_3_container_with_limit_and_pipe/cmd/run_command.go

```go
package cmd

import (
	"fmt"
	log "github.com/sirupsen/logrus"
	"github.com/urfave/cli"
	"my_docker/cgroups"
	"my_docker/cgroups/subsystems"
	"my_docker/container"
	"os"
	"strings"
)

var (
	defaultCgroupPath = "mydocker-cgroup"
)

var RunCommand = cli.Command{
	Name: "run",
	Usage: `Create a container with namespace and cgroups limit
			my-docker run -ti [command]`,
	Flags: []cli.Flag{
		cli.BoolFlag{
			Name:  "ti",
			Usage: "enable tty",
		},
		cli.BoolFlag{
			Name:  "it",
			Usage: "enable tty",
		},
		cli.StringFlag{
			Name:  "m",
			Usage: "memory limit",
		},
		cli.StringFlag{
			Name:  "cpushare",
			Usage: "cpushare limit",
		},
		cli.StringFlag{
			Name:  "cpuset",
			Usage: "cpuset limit",
		},
	},
	Action: func(context *cli.Context) error {
		// Step 1：用户初始化命令校验
		if len(context.Args()) < 1 {
			return fmt.Errorf("missing container command")
		}

		// Step 2：获取用户命令行命令
		// Step 2.1：从Context中获取容器内初始化命令
		var cmdArray []string
		for _, arg := range context.Args() {
			cmdArray = append(cmdArray, arg)
		}

		// Step 2.2：从Context中获取容器配置相关命令
		tty := context.Bool("ti") || context.Bool("it") // tty参数
		resourceConfig := getResourceConfig(context)    // 容器资源限制参数

		run(tty, cmdArray, resourceConfig)
		return nil
	},
}

func run(tty bool, comArray []string, res *subsystems.ResourceConfig) {
	parent, writePipe := container.NewParentProcess(tty)
	if parent == nil {
		log.Errorf("New parent process error")
		return
	}
	err := parent.Start()
	if err != nil {
		log.Error(err)
	}

	cgroupManager := cgroups.NewCgroupManager(defaultCgroupPath)
	defer func(cgroupManager *cgroups.CgroupManager) {
		err := cgroupManager.Destroy()
		if err != nil {
			log.Error(err)
		}
	}(cgroupManager)

	err = cgroupManager.Set(res)
	if err != nil {
		goto FASTEND
	}
	err = cgroupManager.Apply(parent.Process.Pid)
	if err != nil {
		goto FASTEND
	}

	sendInitCommand(comArray, writePipe)
	err = parent.Wait()

FASTEND:
	if err != nil {
		log.Error(err)
	}

	os.Exit(0)
}

func getResourceConfig(context *cli.Context) *subsystems.ResourceConfig {
	var (
		memoryLimit = `256m`
		cpuset      = `1`
		cpuShare    = `512`
	)

	if context.String("m") != "" {
		memoryLimit = context.String("m")
	}
	if context.String("cpuset") != "" {
		cpuset = context.String("cpuset")
	}
	if context.String("cpushare") != "" {
		cpuShare = context.String("cpushare")
	}

	return &subsystems.ResourceConfig{
		MemoryLimit: memoryLimit,
		CpuSet:      cpuset,
		CpuShare:    cpuShare,
	}
}

// sendInitCommand 向管道中写入用户自定义初始化命令参数
func sendInitCommand(comArray []string, writePipe *os.File) {
	defer func(writePipe *os.File) {
		err := writePipe.Close()
		if err != nil {
			log.Errorf("close write pipe err: %v", err)
		}
	}(writePipe)

	command := strings.Join(comArray, " ")
	log.Infof("command all is %s", command)
	_, err := writePipe.WriteString(command)
	if err != nil {
		log.Errorf("write pipe err: %v", err)
		return
	}
}
```

#### **① 声明命令变量**

首先，我们声明了一个命令变量：`RunCommand`；

```go
var RunCommand = cli.Command{
	Name: "run",
	Usage: `Create a container with namespace and cgroups limit
			my-docker run -ti [command]`,
	Flags: []cli.Flag{
		cli.BoolFlag{
			Name:  "ti",
			Usage: "enable tty",
		},
		cli.BoolFlag{
			Name:  "it",
			Usage: "enable tty",
		},
		cli.StringFlag{
			Name:  "m",
			Usage: "memory limit",
		},
		cli.StringFlag{
			Name:  "cpushare",
			Usage: "cpushare limit",
		},
		cli.StringFlag{
			Name:  "cpuset",
			Usage: "cpuset limit",
		},
	},
	Action: func(context *cli.Context) error {
		// Step 1：用户初始化命令校验
		if len(context.Args()) < 1 {
			return fmt.Errorf("missing container command")
		}

		// Step 2：获取用户命令行命令
		// Step 2.1：从Context中获取容器内初始化命令
		var cmdArray []string
		for _, arg := range context.Args() {
			cmdArray = append(cmdArray, arg)
		}

		// Step 2.2：从Context中获取容器配置相关命令
		tty := context.Bool("ti") || context.Bool("it") // tty参数
		resourceConfig := getResourceConfig(context)    // 容器资源限制参数

		run(tty, cmdArray, resourceConfig)
		return nil
	},
}
```

在变量中，我们声明了子命令的一些内容：

-   Name：命令名称；
-   Usage：命令说明；
-   Flags：命令占位符：
    -   `ti & it`：启用tty交互；
    -   `m & cpushare & cpuset`：内存、CPU时间片以及CPU核心数资源限制；
-   Action：命令具体执行的函数，其中：<font color="#f00">**Action函数的入参context中包含了用户所指定的上述所声明的Flags参数以及其他参数（用于指定容器创建后的初始化命令）**</font>

>   这里补充说明一点：
>
>   **在Action函数的入参context中：**
>
>   -   **Flags对应的参数使用例如：`context.Bool("it")`进行取值；**
>   -   **用户定义的其他参数通过`context.Args()`进行取值；**
>
>   例如命令：`./my_docker run -ti -m 100m -- stress --vm-bytes 200m --vm-keep -m 1`
>
>   -   `context.String("m")`会取到：`100m`；
>   -   `context.Args()`会取到：`stress --vm-bytes 200m --vm-keep -m 1`；

Action函数也是非常简单：

-   使用`context.Args()`获取用户初始化命令；
-   使用`getResourceConfig(context)`获取用户所定义的容器限制命令；
-   调用`run(tty, cmdArray, resourceConfig)`函数，开启新的进程，启动容器！

在`run(tty, cmdArray, resourceConfig)`函数中实现了整个容器的核心内容，下面我们来看这个函数；

<br/>

#### **② 开启新的容器进程：NewParentProcess**

run函数的整体实现如下：

chapter3_container/3_3_container_with_limit_and_pipe/cmd/run_command.go

```go
func run(tty bool, comArray []string, res *subsystems.ResourceConfig) {
	parent, writePipe := container.NewParentProcess(tty)
	if parent == nil {
		log.Errorf("New parent process error")
		return
	}
	err := parent.Start()
	if err != nil {
		log.Error(err)
	}

	cgroupManager := cgroups.NewCgroupManager(defaultCgroupPath)
	defer func(cgroupManager *cgroups.CgroupManager) {
		err := cgroupManager.Destroy()
		if err != nil {
			log.Error(err)
		}
	}(cgroupManager)

	err = cgroupManager.Set(res)
	if err != nil {
		goto FASTEND
	}
	err = cgroupManager.Apply(parent.Process.Pid)
	if err != nil {
		goto FASTEND
	}

	sendInitCommand(comArray, writePipe)
	err = parent.Wait()

FASTEND:
	if err != nil {
		log.Error(err)
	}
	os.Exit(0)
}
```

在run函数中，首先我们调用了container包中的`NewParentProcess(tty)`函数创建了一个子进程：

chapter3_container/3_3_container_with_limit_and_pipe/container/container.go

```go
func NewParentProcess(tty bool) (*exec.Cmd, *os.File) {
	readPipe, writePipe, err := utils.NewPipe()
	if err != nil {
		log.Errorf("New pipe error %v", err)
		return nil, nil
	}

	// 子进程中调用自己，并发送init参数，在子进程中初始化容器资源（自己的init命令！）
	cmd := exec.Command("/proc/self/exe", "init")
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWIPC |
			syscall.CLONE_NEWPID | syscall.CLONE_NEWNS | syscall.CLONE_NEWNET,
	}
	// 如果支持tty
	if tty {
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
	}

	cmd.ExtraFiles = []*os.File{readPipe}
	return cmd, writePipe
}
```

在`NewParentProcess`函数中，首先创建了一个前文中所提到的管道；

随后，创建了一个命令行：

-   `/proc/self/exe init`；

<font color="#f00">**注：上面的这个命令行可以说是整个容器实现中最为巧妙的地方！（Docker也是使用这个方式进行容器内资源初始化的！）**</font>

>   <font color="#f00">**这里重点介绍一下上面创建的命令的含义：**</font>
>
>   <font color="#f00">**由本篇最开始的`/proc`介绍可知：`/proc/self/exe`链接到了当前进程的执行命令文件；**</font>
>
>   <font color="#f00">**因此：`/proc/self/exe init`命令将会再次调用docker命令本身，即：`docker init`，从而执行到我们所声明的`InitCommand`函数中（注：此时已经进入到了容器进程中！）并完成初始化！**</font>

随后，对命令进行了Namespace绑定：

```go
cmd.SysProcAttr = &syscall.SysProcAttr{
	Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWIPC |
		syscall.CLONE_NEWPID | syscall.CLONE_NEWNS | syscall.CLONE_NEWNET,
}
```

同时，如果支持tty，还会将子进程中的标准流和当前进程中的流进行绑定：

```go
if tty {
    cmd.Stdin = os.Stdin
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr
}
```

最后，将所创建的管道对应的`readPipe`传递给命令**（之后会传入容器进程中，用于接收宿主进程发送的初始化消息）**，并返回创建的命令和`writePipe`**（用于宿主进程向容器进程发送消息）；**

<br/>

接着，我们回到`run`函数中：

```go
err := parent.Start()
if err != nil {
    log.Error(err)
}
```

<font color="#f00">**`run`函数调用返回的命令的`Start`函数`parent.Start()`创建新的进程，即：容器进程！**</font>

这时就会调用我们的`InitCommand`函数；

让我们看一下`init`命令的实现；

<br/>

#### **③ 初始化容器：InitCommand**

下面是InitCommand的声明：

chapter3_container/3_3_container_with_limit_and_pipe/cmd/init_command.go

```go
var InitCommand = cli.Command{
	Name:  "init",
	Usage: "Init container process run user's process in container. Do not call it outside",
	Action: func(context *cli.Context) error {
		log.Infof("init come on")
		err := container.RunContainerInitProcess()
		return err
	},
}
```

可以看到，InitCommand调用了container包中的`RunContainerInitProcess`函数：

chapter3_container/3_3_container_with_limit_and_pipe/container/container.go

```go
// RunContainerInitProcess 在容器中创建初始化进程！（本函数在容器内部，作为第一个进程被执行）
func RunContainerInitProcess() error {
	// systemd 加入linux之后, mount namespace 就变成 shared by default, 所以你必须显式声明你要这个新的mount namespace独立！
	// Issue：https://github.com/xianlubird/mydocker/issues/41
	err := syscall.Mount("", "/", "", syscall.MS_PRIVATE|syscall.MS_REC, "")
	if err != nil {
		return err
	}

	// 从无名管道中获取用户的参数（从WritePipe过来！）
	cmdArray := readUserCommand()
	if cmdArray == nil || len(cmdArray) == 0 {
		return fmt.Errorf("run container get user command error, cmdArray is nil")
	}

	// 使用 mount 挂载 proc 文件系统（以便后面通过 ps 命令查看当前进程资源）
	// MS_NOEXEC：本文件系统不允许运行其他程序
	// MS_NOSUID：本系统运行程序时，不允许 set-user-id, set-group-id
	// MS_NODEV：mount系统的默认参数
	defaultMountFlags := syscall.MS_NOEXEC | syscall.MS_NOSUID | syscall.MS_NODEV
	err = syscall.Mount("proc", "/proc", "proc", uintptr(defaultMountFlags), "")
	if err != nil {
		return err
	}

	// 查询命令的绝对路径，此时用户可以不再输入绝对路径！
	absPath, err := exec.LookPath(cmdArray[0])
	if err != nil {
		log.Errorf("Exec loop path error %v", err)
		return err
	}
	log.Infof("find cmd absolute path %s", absPath)

	// 完成容器内初始化，并将用户进程运行起来！
	// syscall.Exec 最终调用 execve 系统函数，执行当前 filename 对应程序
	// 并”覆盖“当前进程的镜像、数据和堆栈等信息，包括PID，因此将容器最开始的 init 进程替换掉！
	if err := syscall.Exec(absPath, cmdArray, os.Environ()); err != nil {
		log.Errorf("init container err: %v", err.Error())
	}
	return nil
}
```

在`RunContainerInitProcess`函数中：

首先，**我们重新挂载了`/`，这是为了解决在 `systemd` 加入linux之后, mount namespace 默认就变成了 shared by default，因此需要显式声明新的mount namespace独立！**

随后，调用了`readUserCommand()`从无名管道中获取用户的容器初始化参数，代码如下：

```go
// 从无名管道中获取输入
func readUserCommand() []string {
	// 这里用3号文件描述符是因为，我们只创建了一个管道流，而默认是0、1、2（标准输入+输出，错误输出）
	pipe := os.NewFile(uintptr(3), "pipe")
	msg, err := ioutil.ReadAll(pipe)
	if err != nil {
		log.Errorf("init read pipe error %v", err)
		return nil
	}
	msgStr := string(msg)
	return strings.Split(msgStr, " ")
}
```

这里通过3号文件描述符**（这里用3号文件描述符是因为，我们只创建了一个管道流，而默认是0、1、2【标准输入+输出，错误输出】）**取出了我们的父进程输入流，

<font color="#f00">**注：此时父进程（宿主进程）还没有向管道中写入数据！因此，此时`容器进程`会在此阻塞（`ioutil.ReadAll(pipe)`）！**</font>

<font color="#f00">**直到宿主进程向子进程中发送了初始化命令后，容器进程才会继续执行！**</font>

当宿主进程通过管道向子进程发送了初始化命令后，`readUserCommand`函数获取用户的初始化命令数组，并返回；

随后，容器进程重新挂载 proc 文件系统，并从`$PATH`中获取用户初始化命令的绝对路径`absPath`；

最终，调用`syscall.Exec(absPath, cmdArray, os.Environ())`，使用用户传输的命令进行容器的初始化！

>   <font color="#f00">**注：Go语言中的 `syscall.Exec` 函数最终会调用 `execve` 系统函数，执行当前 filename 对应程序，并`覆盖`当前进程的镜像、数据和堆栈等信息，包括PID，因此会将将容器最开始的 init 进程替换掉！**</font>
>
>   <font color="#f00">**即：PID为1的进程不再是init，而是用户指定的初始化命令所对应的进程！**</font>

<br/>

#### **④ 挂载Cgroup进行资源限制**

让我们把视线再转移回 `run`函数！

当调用了`parent.Start()`后，容器进程被创建，并等待宿主进程中的初始化命令，随后完成容器初始化；

此时正是我们对容器进程进行资源限制的最好时机！

因此，在 `run` 函数中，接下来进行了Cgroup和PID之间的绑定，进行资源的限制：

```go
cgroupManager := cgroups.NewCgroupManager(defaultCgroupPath)
defer func(cgroupManager *cgroups.CgroupManager) {
    err := cgroupManager.Destroy()
    if err != nil {
        log.Error(err)
    }
}(cgroupManager)

err = cgroupManager.Set(res)
if err != nil {
    goto FASTEND
}
err = cgroupManager.Apply(parent.Process.Pid)
if err != nil {
    goto FASTEND
}
```

>   <font color="#f00">**注1：如果先初始化，后绑定，则不会对初始化命令的资源进行限制！**</font>
>
>   <font color="#f00">**注2：直接使用`parent.Process.Pid`获取容器进程的PID即可！**</font>

<br/>

#### **⑤ 宿主进程向容器进程发送初始化命令：sendInitCommand**

在对容进程进行了资源限制之后，宿主进程可以向容器进程发送初始化命令，完成容器的初始化；

发送命令主要是通过`sendInitCommand`函数完成的：

```go
// sendInitCommand 向管道中写入用户自定义初始化命令参数
func sendInitCommand(comArray []string, writePipe *os.File) {
	defer func(writePipe *os.File) {
		err := writePipe.Close()
		if err != nil {
			log.Errorf("close write pipe err: %v", err)
		}
	}(writePipe)

	command := strings.Join(comArray, " ")
	log.Infof("command all is %s", command)
	_, err := writePipe.WriteString(command)
	if err != nil {
		log.Errorf("write pipe err: %v", err)
		return
	}
}
```

`sendInitCommand`函数很简单：就是通过`writePipe`向容器进程发送了用户初始化命令；

当发送完成后，容器进程便开始进行初始化；

同时，宿主进程等待容器进程完成：

```go
err = parent.Wait()
```

此时，我们的容器进程初始化完毕，可以使用！

至此，我们的容器创建完毕！

<br/>

## **四、命令测试**

我们的容器已经写完了，那么效果如何呢？是骡子是马，拉出来溜溜吧！

首先使用`go build`编译我们的Docker：

```bash
root@jasonkay:~/workspace/my_docker/chapter3_container/3_3_container_with_limit_and_pipe# go build
root@jasonkay:~/workspace/my_docker/chapter3_container/3_3_container_with_limit_and_pipe# ll
total 4684
drwxr-xr-x 6 root root    4096 Sep  5 20:04 ./
drwxr-xr-x 5 root root    4096 Aug 28 18:54 ../
drwxr-xr-x 4 root root    4096 Aug 28 18:54 cgroups/
drwxr-xr-x 2 root root    4096 Aug 28 19:16 cmd/
drwxr-xr-x 2 root root    4096 Aug 28 19:18 container/
-rw-r--r-- 1 root root     105 Aug 27 19:53 go.mod
-rw-r--r-- 1 root root    1965 Aug 27 16:19 go.sum
-rw-r--r-- 1 root root     719 Aug 27 19:54 main.go
-rwxr-xr-x 1 root root 4747218 Sep  5 20:04 my_docker*
-rw-r--r-- 1 root root     136 Aug 28 19:25 README.md
-rw-r--r-- 1 root root    1540 Aug 28 19:27 test-ls.sh
-rw-r--r-- 1 root root    2117 Aug 28 19:29 test-memory.sh
drwxr-xr-x 2 root root    4096 Aug 28 18:59 utils/
```

### **1、无资源限制测试**

#### **① ls命令测试**

直接执行下面的命令进行测试：

```bash
./my_docker run -ti /bin/ls
```

输出如下：

```bash
{"level":"info","msg":"init come on","time":"2021-09-05T20:05:20Z"}
{"level":"info","msg":"set cpu-set success, file: /sys/fs/cgroup/cpuset/mydocker-cgroup/cpuset.cpus, cpu-set num: 1","time":"2021-09-05T20:05:20Z"}
{"level":"info","msg":"set memory success, file: /sys/fs/cgroup/memory/mydocker-cgroup/memory.limit_in_bytes, size: 256m","time":"2021-09-05T20:05:20Z"}
{"level":"info","msg":"set cpu-share success, file: /sys/fs/cgroup/cpu,cpuacct/mydocker-cgroup/cpu.shares, cpu-share: 512","time":"2021-09-05T20:05:20Z"}
{"level":"info","msg":"apply cpu-set success, file: /sys/fs/cgroup/cpuset/mydocker-cgroup/tasks, pid: 355195","time":"2021-09-05T20:05:20Z"}
{"level":"info","msg":"apply memory success, file: /sys/fs/cgroup/memory/mydocker-cgroup/tasks, pid: 355195","time":"2021-09-05T20:05:20Z"}
{"level":"info","msg":"apply cpu-share success, file: /sys/fs/cgroup/cpu,cpuacct/mydocker-cgroup/tasks, pid: 355195","time":"2021-09-05T20:05:20Z"}
{"level":"info","msg":"command all is /bin/ls","time":"2021-09-05T20:05:20Z"}
{"level":"info","msg":"find cmd absolute path /bin/ls","time":"2021-09-05T20:05:20Z"}

cgroups  cmd  container  go.mod  go.sum  main.go  my_docker  README.md  test-ls.sh  test-memory.sh  utils
```

容器执行`ls`命令完成后退出，这和 Docker 中：**无前台进程启动时容器自动退出的逻辑完全一致！**

同时，可以看到整个Docker执行的日志，以及执行顺序：

-   初始化；
-   设置资源限制**（这里命令行并未给定资源限制，使用的是资源限制的默认值！）；**
-   子进程查找`ls`命令的绝对路径（**这里能够看到子进程的日志是因为我们指定了`tty`将标准流和当前进程绑定）**；
-   执行命令`/bin/ls`，打印出结果！

>   <font color="#f00">**注意到：我们并未挂载新的目录，因此容器进程可以打印出宿主进程中当前目录下的文件！**</font>

<br/>

#### **② sh命令测试**

除了`ls`命令外，我们还可以直接执行`sh`命令进入容器环境！

执行下面的命令：

```bash
./my_docker run -ti /bin/sh
```

此时输出日志，并进入容器进程中：

```bash
root@jasonkay:~/workspace/my_docker/chapter3_container/3_3_container_with_limit_and_pipe# ./my_docker run -ti /bin/sh
{"level":"info","msg":"init come on","time":"2021-09-05T20:12:02Z"}
{"level":"info","msg":"set cpu-set success, file: /sys/fs/cgroup/cpuset/mydocker-cgroup/cpuset.cpus, cpu-set num: 1","time":"2021-09-05T20:12:03Z"}
{"level":"info","msg":"set memory success, file: /sys/fs/cgroup/memory/mydocker-cgroup/memory.limit_in_bytes, size: 256m","time":"2021-09-05T20:12:03Z"}
{"level":"info","msg":"set cpu-share success, file: /sys/fs/cgroup/cpu,cpuacct/mydocker-cgroup/cpu.shares, cpu-share: 512","time":"2021-09-05T20:12:03Z"}
{"level":"info","msg":"apply cpu-set success, file: /sys/fs/cgroup/cpuset/mydocker-cgroup/tasks, pid: 355424","time":"2021-09-05T20:12:03Z"}
{"level":"info","msg":"apply memory success, file: /sys/fs/cgroup/memory/mydocker-cgroup/tasks, pid: 355424","time":"2021-09-05T20:12:03Z"}
{"level":"info","msg":"apply cpu-share success, file: /sys/fs/cgroup/cpu,cpuacct/mydocker-cgroup/tasks, pid: 355424","time":"2021-09-05T20:12:03Z"}
{"level":"info","msg":"command all is /bin/sh","time":"2021-09-05T20:12:03Z"}
{"level":"info","msg":"find cmd absolute path /bin/sh","time":"2021-09-05T20:12:03Z"}
# 
```

查看容器中的进程列表：

```bash
# ps -ef
UID          PID    PPID  C STIME TTY          TIME CMD
root           1       0  0 20:12 pts/0    00:00:00 /bin/sh
root           6       1  0 20:12 pts/0    00:00:00 ps -ef
```

可以看到，容器中PID为1的进程就是我们所指定的进程：`sh`！

接下来对资源限制功能进行测试！

<br/>

### **2、资源限制测试**

执行下面的命令，在容器中执行`stress`命令模拟系统负载较高时的场景；

```bash
# ./my_docker run -ti -m 100m -- stress --vm-bytes 200m --vm-keep -m 1

{"level":"info","msg":"init come on","time":"2021-09-05T20:15:30Z"}
{"level":"info","msg":"set cpu-set success, file: /sys/fs/cgroup/cpuset/mydocker-cgroup/cpuset.cpus, cpu-set num: 1","time":"2021-09-05T20:15:30Z"}
{"level":"info","msg":"set memory success, file: /sys/fs/cgroup/memory/mydocker-cgroup/memory.limit_in_bytes, size: 100m","time":"2021-09-05T20:15:30Z"}
{"level":"info","msg":"set cpu-share success, file: /sys/fs/cgroup/cpu,cpuacct/mydocker-cgroup/cpu.shares, cpu-share: 512","time":"2021-09-05T20:15:30Z"}
{"level":"info","msg":"apply cpu-set success, file: /sys/fs/cgroup/cpuset/mydocker-cgroup/tasks, pid: 355573","time":"2021-09-05T20:15:30Z"}
{"level":"info","msg":"apply memory success, file: /sys/fs/cgroup/memory/mydocker-cgroup/tasks, pid: 355573","time":"2021-09-05T20:15:30Z"}
{"level":"info","msg":"apply cpu-share success, file: /sys/fs/cgroup/cpu,cpuacct/mydocker-cgroup/tasks, pid: 355573","time":"2021-09-05T20:15:30Z"}
{"level":"info","msg":"command all is stress --vm-bytes 200m --vm-keep -m 1","time":"2021-09-05T20:15:30Z"}
{"level":"info","msg":"find cmd absolute path /usr/bin/stress","time":"2021-09-05T20:15:30Z"}
stress: info: [1] dispatching hogs: 0 cpu, 0 io, 1 vm, 0 hdd
```

我们`stress`命令指定的内存占用为`200m`，而对容器进程的资源占用限制为`100m`；

可以在宿主机中查看资源占用情况：

```bash
# top

top - 20:16:37 up 8 days,  4:01,  2 users,  load average: 0.79, 0.27, 0.08
Tasks: 267 total,   2 running, 265 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.4 us,  9.7 sy,  0.0 ni, 87.2 id,  2.6 wa,  0.0 hi,  0.1 si,  0.0 st
MiB Mem :  15985.9 total,   9795.9 free,   2824.4 used,   3365.6 buff/cache
MiB Swap:  12288.0 total,  12184.2 free,    103.8 used.  12832.9 avail Mem 

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND                             
 355578 root      20   0  208660 101456    272 R  73.3   0.6   0:50.78 stress  
```

可以看到，仅仅占用了 `15985.9 * 0.6% = 95.9154 ≈ 100M` 内存，我们成功限制了容器进程的内存占用！

其他的资源限制也是可以生效的，这里由于篇幅的原因，不再赘述了！

<br/>

## **其他内容**

在执行命令时可能会报错：`cgroup：no space left on device`，即：`cpuset中tasks无法加入新的pid`！

这是由于默认的Cgroups的mems文件是空的，我们只需要写入一个值，分配内存即可，如：

```bash
echo 0 > /sys/fs/cgroup/cpuset/mydocker-cgroup/cpuset.mems
```

>   对应Issue：https://github.com/xianlubird/mydocker/issues/74
>
>   相关文章：https://blog.csdn.net/xftony/article/details/80536562

<br/>

## **本篇小结**

本篇主要在前面Namespace、Cgroups等概念的基础之上，手动实现了一个能够进行资源占用的类Docker容器！

期间主要穿插讲解了，如：

-   `/proc`文件系统；
-   进程间通信管道；
-   ……

等内容；

可以注意到，在执行时容器环境和宿主环境还并未完全隔离；

当然，这也是下一篇文章的内容，下一篇文章将会构建一个资源完全隔离的Docker镜像，尽请期待！

<br/>

# **附录**

系列文章：

-   [Docker原理实战-1：Namespace](/2021/08/29/Docker原理实战-1：Namespace/)
-   [Docker原理实战-2：Cgroups](/2021/08/29/Docker原理实战-2：Cgroups/)
-   [Docker原理实战-3：UnionFS](/2021/08/29/Docker原理实战-3：UnionFS/)
-   [Docker原理实战-4：容器Container](/2021/09/05/Docker原理实战-4：容器Container/)

源代码：

-   https://github.com/JasonkayZK/my_docker


<br/>
