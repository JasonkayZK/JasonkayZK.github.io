---
title: Golang中的进度条使用
toc: true
cover: 'https://img.paulzzh.com/touhou/random?88'
date: 2020-09-29 23:50:12
categories: Golang
tags: [Golang, 进度条, Cli]
description: 使用Golang开发命令行应用是个不错的选择，但是有时候我们希望加入进度条来优化用户体验；本文就讲述了如何在Golang中加入进度条；
---

使用Golang开发命令行应用是个不错的选择，但是有时候我们希望加入进度条来优化用户体验；本文就讲述了如何在Golang中加入进度条；

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/progress-bar

<br/>

<!--more-->

## Golang中的进度条使用

在github中，比较star数比较多的进度条仓库有这么几个：

-   [progressbar](https://github.com/schollz/progressbar)
-   [uiprogress](https://github.com/gosuri/uiprogress)
-   [mpb](https://github.com/vbauerster/mpb)
-   [pb](https://github.com/cheggaaa/pb)

下面我们一一来看：

### progressbar

下面是使用progressbar的一个例子：

```go
req, _ := http.NewRequest("GET", "https://dl.google.com/go/go1.14.2.src.tar.gz", nil)
resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()

f, _ := os.OpenFile("go1.14.2.src.tar.gz", os.O_CREATE|os.O_WRONLY, 0644)
defer f.Close()

bar := progressbar.DefaultBytes(
    resp.ContentLength,
    "downloading",
)
_, _ = io.Copy(io.MultiWriter(f, bar), resp.Body)
```

`progressbar.DefaultBytes`返回了一个ProgressBar指针，而ProgressBar在内部实现了Write和Read方法，即：

实现了Reader、Writer、ReadWriter接口，所以我们可以很方便的使用`io.MultiWriter`方法，同时向文件(或是其他流处理接口)和ProgressBar写入，而不需要我们自己处理并发修改进度条；

这是一个比较好的设计，在使用上比较方便；

<br/>

### uiprogress

下面是uiprogress的一些特点：

-   多个进度条：uiprogress可以呈现多个可并发跟踪的进度条；
-   动态添加：随时添加额外的进度条，即使在进度跟踪已经开始之后；
-   Prepend和Append函数：向进度条追加或Prepend完成百分比和时间；
-   自定义装饰函数：在工具条周围添加自定义函数和辅助函数；

#### **① 简单示例**

下面是uiprogress给出的一个例子：

```go
uiprogress.Start()            // start rendering
bar := uiprogress.AddBar(100) // Add a new bar

// optionally, append and prepend completion and elapsed time
bar.AppendCompleted()
bar.PrependElapsed()

for bar.Incr() {
    time.Sleep(time.Millisecond * 20)
}
```

调用`uiprogress.Start()`开始监听进度条，并使用 `uiprogress.AddBar(total int)`添加一个进度条；

`bar.AppendCompleted()`用于添加完成的百分比；

`bar.PrependElapsed()`用于添加当前进度条已耗时长；

使用`bar.Incr()`或者 `bar.Set(n int)`设置进度条；

****

#### **② 自定义装饰**

AddBar函数定义了进度条的总长度，而如果我们想要在一个进度条中添加多个步骤，并且每个步骤不同；

可以使用`PrependFunc`：

```go
uiprogress.Start() // start rendering

var steps = []string{
    "downloading source",
    "installing deps",
    "compiling",
    "packaging",
    "seeding database",
    "deploying",
    "staring servers",
}
bar := uiprogress.AddBar(len(steps))

// prepend the current step to the bar
bar.PrependFunc(func(b *uiprogress.Bar) string {
    return "app: " + steps[b.Current()-1]
})

for bar.Incr() {
    time.Sleep(time.Millisecond * 1000)
}
```

#### **③ 多个进度条**

uiprogress还支持多个进度条，例如下面的例子：

```go
waitTime := time.Millisecond * 100
uiprogress.Start()

var wg sync.WaitGroup

bar1 := uiprogress.AddBar(20).AppendCompleted().PrependElapsed()
wg.Add(1)
go func() {
    defer wg.Done()
    for bar1.Incr() {
        time.Sleep(waitTime)
    }
}()

bar2 := uiprogress.AddBar(40).AppendCompleted().PrependElapsed()
wg.Add(1)
go func() {
    defer wg.Done()
    for bar2.Incr() {
        time.Sleep(waitTime)
    }
}()

time.Sleep(time.Second)
bar3 := uiprogress.AddBar(20).PrependElapsed().AppendCompleted()
wg.Add(1)
go func() {
    defer wg.Done()
    for bar3.Incr() {
        time.Sleep(waitTime)
    }
}()

wg.Wait()
```

****

#### **不足**

体验了uiprogress，我发现，uiprogress仅仅是帮助你显示进度条，而所有的进度条增加等操作，还是需要自己操作(也可以设置自动增加间隔)；

<br/>

### pb

pb使用起来也很方便，下面是一个简单的例子：

```GO	
count := 100
// create and start new bar
bar := pb.StartNew(count)

// start bar from 'default' template
// bar := pb.Default.Start(count)

// start bar from 'simple' template
// bar := pb.Simple.Start(count)

// start bar from 'full' template
//bar := pb.Full.Start(count)

for i := 0; i < count; i++ {
    bar.Increment()
    time.Sleep(time.Millisecond * 1000)
}
bar.Finish()
```

同时pb也支持如下设置：

```GO
// create bar
bar := pb.New(count)

// refresh info every second (default 200ms)
bar.SetRefreshRate(time.Second)

// force set io.Writer, by default it's os.Stderr
bar.SetWriter(os.Stdout)

// bar will format numbers as bytes (B, KiB, MiB, etc)
bar.Set(pb.Bytes, true)

// bar use SI bytes prefix names (B, kB) instead of IEC (B, KiB)
bar.Set(pb.SIBytesPrefix, true)

// set custom bar template
bar.SetTemplateString(myTemplate)

// check for error after template set
if err = bar.Err(); err != nil {
    return
}

// start bar
bar.Start()
```

可以看出，pb支持主动设置：刷新率、进度条输出位置、进度条单位等；

同时，pb支持创建类似于progressbar中直接接管io操作的进度条，但是pb还使用代理模式实现了这一功能：

```go
var limit int64 = 1024 * 1024 * 500
// we will copy 200 Mb from /dev/rand to /dev/null
reader := io.LimitReader(rand.Reader, limit)
writer := ioutil.Discard

// start new bar
bar := pb.Full.Start64(limit)

// create proxy reader
barReader := bar.NewProxyReader(reader)
// copy from proxy reader
_, _ = io.Copy(writer, barReader)
// finish bar
bar.Finish()
```

在上面的代码中，使用`NewProxyReader`创建了一个代理包装类`*pb.Reader `：

```go
type Reader struct {
	io.Reader
	bar *ProgressBar
}
```

此时，调用返回的这个包装类的方法，pb会直接接管进度条，比起progressbar更方便了有没有！

当然，在pb中`pb.Reader`也实现了Writer接口：

```go
// Write performs write to the output
func (pb *ProgressBar) Write() *ProgressBar {
	pb.mu.RLock()
	finished := pb.finished
	pb.mu.RUnlock()
	pb.write(finished)
	return pb
}

func (pb *ProgressBar) write(finish bool) {
	result, width := pb.render()
	if pb.Err() != nil {
		return
	}
	if pb.GetBool(Terminal) {
		if r := (width - CellCount(result)); r > 0 {
			result += strings.Repeat(" ", r)
		}
	}
	if ret, ok := pb.Get(ReturnSymbol).(string); ok {
		result = ret + result
		if finish && ret == "\r" {
			result += "\n"
		}
	}
	if pb.GetBool(Color) {
		pb.coutput.Write([]byte(result))
	} else {
		pb.nocoutput.Write([]byte(result))
	}
}
```

理所应当的，也可以使用类似于progressbar的方式进行进度条操作(但是不推荐，毕竟pb已经提供了更为高级的方式实现了！)

<br/>

### mpb

虽然pb已经很好用了，但是pb的多进度条功能目前还是在测试阶段，所以就有了mpb(multiple-pb)；

mpb有以下的功能：

-   多进度条：支持多个进度条；
-   动态计算：可以在进度条跑的时候动态修改值；
-   动态添加/删除：动态添加或删除进度条；
-   取消：取消整个渲染过程；
-   预定义的装饰器：运行时间，基于的[ewma](https://github.com/VividCortex/ewma) 时间估计(ETA)、百分比，字节计数器；
-   Decorator的宽度同步：在多个条之间同步Decorator的宽度；

下面是mpb一个简单的例子：

```go
// initialize progress container, with custom width
p := mpb.New(mpb.WithWidth(64))

total := 100
name := "Single Bar:"
// adding a single bar, which will inherit container's width
bar := p.AddBar(int64(total),
                // override DefaultBarStyle, which is "[=>-]<+"
                mpb.BarStyle("╢▌▌░╟"),
                mpb.PrependDecorators(
                    // display our name with one space on the right
                    decor.Name(name, decor.WC{W: len(name) + 1, C: decor.DidentRight}),
                    // replace ETA decorator with "done" message, OnComplete event
                    decor.OnComplete(
                        decor.AverageETA(decor.ET_STYLE_GO, decor.WC{W: 4}), "done",
                    ),
                ),
                mpb.AppendDecorators(decor.Percentage()),
               )
// simulating some work
max := 100 * time.Millisecond
for i := 0; i < total; i++ {
    time.Sleep(time.Duration(rand.Intn(10)+1) * max / 10)
    bar.Increment()
}
// wait for our bar to complete and flush
p.Wait()
```

代码比起pb还是复杂了不少；

下面是一个多进度条的例子：

```go
var wg sync.WaitGroup
// pass &wg (optional), so p will wait for it eventually
p := mpb.New(mpb.WithWaitGroup(&wg))
total, numBars := 100, 3
wg.Add(numBars)

for i := 0; i < numBars; i++ {
    name := fmt.Sprintf("Bar#%d:", i)
    bar := p.AddBar(int64(total),
                    mpb.PrependDecorators(
                        // simple name decorator
                        decor.Name(name),
                        // decor.DSyncWidth bit enables column width synchronization
                        decor.Percentage(decor.WCSyncSpace),
                    ),
                    mpb.AppendDecorators(
                        // replace ETA decorator with "done" message, OnComplete event
                        decor.OnComplete(
                            // ETA decorator with ewma age of 60
                            decor.EwmaETA(decor.ET_STYLE_GO, 60), "done",
                        ),
                    ),
                   )
    // simulating some work
    go func() {
        defer wg.Done()
        rng := rand.New(rand.NewSource(time.Now().UnixNano()))
        max := 100 * time.Millisecond
        for i := 0; i < total; i++ {
            // start variable is solely for EWMA calculation
            // EWMA's unit of measure is an iteration's duration
            start := time.Now()
            time.Sleep(time.Duration(rng.Intn(10)+1) * max / 10)
            bar.Increment()
            // we need to call DecoratorEwmaUpdate to fulfill ewma decorator's contract
            bar.DecoratorEwmaUpdate(time.Since(start))
        }
    }()
}
// Waiting for passed &wg and for all bars to complete and flush
p.Wait()
```

除此之外，仓库还提供了动态修改，字节下载等例子，这里不再展示了；

<BR/>

### 总结

mpb可以实现很复杂的进度条功能，但是实现较为复杂；

如果只是做一些简单的展示，使用pb库即可；

而uiprogress和progressbar也是不错的选择；

<br/>

## 附录

源代码：

-   https://github.com/JasonkayZK/Go_Learn/tree/progress-bar

示例中的仓库：

-   [progressbar](https://github.com/schollz/progressbar)
-   [uiprogress](https://github.com/gosuri/uiprogress)
-   [mpb](https://github.com/vbauerster/mpb)
-   [pb](https://github.com/cheggaaa/pb)


<br/>