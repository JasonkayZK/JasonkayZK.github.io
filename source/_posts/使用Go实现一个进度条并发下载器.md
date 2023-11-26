---
title: 使用Go实现一个进度条并发下载器
toc: true
cover: 'https://img.paulzzh.com/touhou/random?2'
date: 2020-09-30 20:53:04
categories: Golang
tags: [Golang, 进度条, 多线程下载]
description: 在前一篇文章中，我讲解了如何在命令行工具中添加进度条，在这篇文章中，我们使用mpb实现一个可以多线程、多文件下载的下载工具；
---

在前一篇文章[Golang中的进度条使用](https://jasonkayzk.github.io/2020/09/29/Golang中的进度条使用/)中，我讲解了如何在命令行工具中添加进度条，在这篇文章中，我们使用mpb实现一个可以多线程、多文件下载并含有进度条的下载工具；

源代码：

- https://github.com/JasonkayZK/Go_Learn/tree/progress-bar

<br/>

<!--more-->

## 使用Go实现一个进度条并发下载器

### 下载文件

我们正常使用 go 语言下载一个文件应该是这样的：

```go
package main

import (
    "net/http"
    "io/ioutil"
)

func main() {
    resourceUrl := "https://www.xxx.yyy/aaa.jpg"

    // Get the data
    resp, err := http.Get(resourceUrl)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    if data, err := ioutil.ReadAll(resp.Body); err = nil {
        ioutil.WriteFile("aaa.jpg", data, 0644)
    }
}
```

这种写法处理小文件没有什么问题；

但是`ioutil.ReadAll` 方法会将文件先读取到内存中，一旦需要下载视频类或其他大文件时，很有可能造成 OOM 的问题。

为了避免这个问题我们通常会使用 `io.Copy`：

```go
// Copy copies from src to dst until either EOF is reached
// on src or an error occurs. It returns the number of bytes
// copied and the first error encountered while copying, if any.
//
// A successful Copy returns err == nil, not err == EOF.
// Because Copy is defined to read from src until EOF, it does
// not treat an EOF from Read as an error to be reported.
//
// If src implements the WriterTo interface,
// the copy is implemented by calling src.WriteTo(dst).
// Otherwise, if dst implements the ReaderFrom interface,
// the copy is implemented by calling dst.ReadFrom(src).
func Copy(dst Writer, src Reader) (written int64, err error)
```

那么我们下载文件的代码可以改成这样：

```go
func main {
    resp, err := http.Get(resourceUrl)
    if err != nil {
        return nil
    }
    defer resp.Body.Close()
    tmpFile, err := os.Create("filename.tmp")
    if err != nil {
        tmpFile.Close()
        return err
    }
    if _, err := io.Copy(tmpFile, resp.Body; err != nil {
        return err
    }
    os.Rename("filename.tmp", "filename")
}
```

<br/>

### 异步化

同步下载文件效率太低，无法重复利用到带宽，我们利用协程将这一过程异步化，最简单的外面包一层 go 就完事了：

```go
go func() {
    // 省略下载过程
}()
```

go 语言开协程的开销很低，为了避免协程开太多导致一些不可预知的意外我们需要控制一下协程的数量，实现一个简单的协程池：

```go
// 默认协程池的长度等于CPU的核数
pool := make(chan int, runtime.NumCPU)

for {
    go func() {
        pool <- 1
        // 省略下载过程
        <- pool
    }()
}
```

任务开始前将ID塞入协程池，任务结束后退出，这样就可以控制到同时进行下载的协程数量。

为了避免协程还在运行时主进程退出，我们还需要加入 WaitGroup 等待所有协程运行结束：

```go
pool := make(chan int, runtime.NumCPU)
wg := sync.WaitGroup{}
for {
    wg.Add(1)
    go func() {
        defer wg.Done()
        pool <- 1
        // 省略下载过程
        <- pool
    }()
}
wg.Wait()
```

<br/>

### 加入进度条

最后，我们加入mpb进度条库：

```GO
package main

import (
	"fmt"
	"github.com/vbauerster/mpb/v5"
	"github.com/vbauerster/mpb/v5/decor"
	"io"
	"net/http"
	"os"
	"runtime"
	"strconv"
	"sync"
)

type Resource struct {
	Filename string
	Url      string
}

type Downloader struct {
	wg         *sync.WaitGroup
	pool       chan *Resource
	Concurrent int
	HttpClient http.Client
	TargetDir  string
	Resources  []Resource
}

func NewDownloader(targetDir string) *Downloader {
	concurrent := runtime.NumCPU()
	return &Downloader{
		wg:         &sync.WaitGroup{},
		TargetDir:  targetDir,
		Concurrent: concurrent,
	}
}

func (d *Downloader) AppendResource(filename, url string) {
	d.Resources = append(d.Resources, Resource{
		Filename: filename,
		Url:      url,
	})
}

func (d *Downloader) Download(resource Resource, progress *mpb.Progress) error {
	defer d.wg.Done()
	d.pool <- &resource
	finalPath := d.TargetDir + "/" + resource.Filename
	// 创建临时文件
	target, err := os.Create(finalPath + ".tmp")
	if err != nil {
		return err
	}

	// 开始下载
	req, err := http.NewRequest(http.MethodGet, resource.Url, nil)
	if err != nil {
		return err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		target.Close()
		return err
	}
	defer resp.Body.Close()
	fileSize, _ := strconv.Atoi(resp.Header.Get("Content-Length"))
	// 创建一个进度条
	bar := progress.AddBar(
		int64(fileSize),
		// 进度条前的修饰
		mpb.PrependDecorators(
			decor.CountersKibiByte("% .2f / % .2f"), // 已下载数量
			decor.Percentage(decor.WCSyncSpace),     // 进度百分比
		),
		// 进度条后的修饰
		mpb.AppendDecorators(
			decor.EwmaETA(decor.ET_STYLE_GO, 90),
			decor.Name(" ] "),
			decor.EwmaSpeed(decor.UnitKiB, "% .2f", 60),
		),
	)
	reader := bar.ProxyReader(resp.Body)
	defer reader.Close()
	// 将下载的文件流拷贝到临时文件
	if _, err := io.Copy(target, reader); err != nil {
		target.Close()
		return err
	}

	// 关闭临时并修改临时文件为最终文件
	target.Close()
	if err := os.Rename(finalPath+".tmp", finalPath); err != nil {
		return err
	}
	<-d.pool
	return nil
}

func (d *Downloader) Start() error {
	d.pool = make(chan *Resource, d.Concurrent)
	fmt.Println("开始下载，当前并发：", d.Concurrent)
	p := mpb.New(mpb.WithWaitGroup(d.wg))
	for _, resource := range d.Resources {
		d.wg.Add(1)
		go d.Download(resource, p)
	}
	p.Wait()
	d.wg.Wait()
	return nil
}
```

<br/>

### 使用

```go
func main() {
	downloader := NewDownloader("./")
	downloader.AppendResource("goland-2020.2.3.exe", "https://download.jetbrains.com/go/goland-2020.2.3.exe?_ga=2.114503552.60453461.1601469960-1376212225.1599435104&_gac=1.149242114.1599435187.EAIaIQobChMIzeKp943D6wIVCLaWCh2JBAHhEAAYASAAEgL3gPD_BwE")
	downloader.AppendResource("ideaIC-2020.2.2.exe", "https://download.jetbrains.com/idea/ideaIC-2020.2.2.exe")
	downloader.AppendResource("WebStorm-2020.2.2.exe", "https://download.jetbrains.com/webstorm/WebStorm-2020.2.2.exe")
	downloader.AppendResource("pycharm-community-2020.2.2.exe", "https://download.jetbrains.com/python/pycharm-community-2020.2.2.exe?_ga=2.7129269.60453461.1601469960-1376212225.1599435104&_gac=1.237846964.1599435187.EAIaIQobChMIzeKp943D6wIVCLaWCh2JBAHhEAAYASAAEgL3gPD_BwE")
	// 可自主调整协程数量，默认为CPU核数
	downloader.Concurrent = 4
	err := downloader.Start()
	if err != nil {
		panic(err)
	}
}
```

<br/>

## 附录

源代码：

- https://github.com/JasonkayZK/Go_Learn/tree/progress-bar


<br/>