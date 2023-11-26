---
title: FFmpeg常用API总结
toc: true
cover: 'https://img.paulzzh.com/touhou/random?77'
date: 2021-05-22 09:19:39
categories: [技术杂谈]
tags: [技术杂谈, FFmpeg]
description: FFmpeg作为开源的视频处理工具，有着相当强大的功能；本文总结了FFmpeg中一些常用的API；
---

FFmpeg作为开源的视频处理工具，有着相当强大的功能；

本文总结了FFmpeg中一些常用的API；

<br/>

<!--more-->

## **FFmpeg常用API总结**

### **前言**

FFmpeg 本身是一个庞大的项目，包含许多组件和库文件，最常用的是它的命令行工具；

FFmpeg下载：

-   https://www.ffmpeg.org/download.html

FFmpeg官方文档：

-   https://www.ffmpeg.org/ffmpeg.html

<br/>

### **视频处理相关概念**

介绍 FFmpeg 用法之前，需要先了解一些视频处理的基本概念；

#### **① 容器**

视频文件本身其实是一个容器（container），里面包括了视频和音频，也可能有字幕等其他内容；

<font color="#f00">**一般来说，视频文件的后缀名反映了它的容器格式；**</font>

常见的容器格式有以下几种：

-   MP4
-   MKV
-   WebM
-   AVI

下面的命令可以查看 FFmpeg 支持的容器：

```bash
ffmpeg -formats
```

****

#### **② 编码格式**

视频和音频都需要经过编码，才能保存成文件；

不同的编码格式（CODEC），有不同的压缩率，会导致文件大小和清晰度的差异；

常用的视频编码格式如下：

-   H.262
-   H.264
-   H.265

上面的编码格式都是有版权的，但是可以免费使用；

此外，还有几种无版权的视频编码格式：

-   VP8
-   VP9
-   AV1

另外，常用的音频编码格式如下：

-   MP3
-   AAC

上面所有这些都是有损的编码格式，编码后会损失一些细节，以换取压缩后较小的文件体积；

无损的编码格式压缩出来的文件体积较大，这里就不介绍了；

下面的命令可以查看 FFmpeg 支持的编码格式，视频编码和音频编码都在内：

```bash
ffmpeg -codecs
```

****

#### **③ 编码器**

编码器（encoders）是实现某种编码格式的库文件；

<font color="#f00">**只有安装了某种格式的编码器，才能实现该格式视频/音频的编码和解码；**</font>

以下是一些 FFmpeg 内置的视频编码器：

-   libx264：最流行的开源 H.264 编码器；
-   NVENC：基于 NVIDIA GPU 的 H.264 编码器；
-   libx265：开源的 HEVC 编码器；
-   libvpx：谷歌的 VP8 和 VP9 编码器；
-   libaom：AV1 编码器；

音频编码器如下：

-   libfdk-aac
-   aac

下面的命令可以查看 FFmpeg 已安装的编码器：

```bash
ffmpeg -encoders
```

<br/>

### **FFmpeg的使用格式**

FFmpeg 的命令行参数非常多，大体可以分成五个部分：

```bash
ffmpeg {1} {2} -i {3} {4} {5}
```

上面命令中，五个部分的参数依次如下：

1.  全局参数；
2.  输入文件参数；
3.  输入文件；
4.  输出文件参数；
5.  输出文件；

参数太多的时候，为了便于查看，ffmpeg 命令可以写成多行：

```bash
ffmpeg \
[全局参数] \
[输入文件参数] \
-i [输入文件] \
[输出文件参数] \
[输出文件]
```

下面是一个例子：

```bash
ffmpeg \
-y \ # 全局参数
-c:a libfdk_aac -c:v libx264 \ # 输入文件参数
-i input.mp4 \ # 输入文件
-c:v libvpx-vp9 -c:a libvorbis \ # 输出文件参数
output.webm # 输出文件
```

上面的命令：

-   将 mp4 文件转成 webm 文件，这两个都是容器格式；
-   输入的 mp4 文件的音频编码格式是 aac，视频编码格式是 H.264；
-   输出的 webm 文件的视频编码格式是 VP9，音频格式是 Vorbis；

**如果不指明编码格式，FFmpeg 会自己判断输入文件的编码；**

因此，上面的命令可以简单写成下面的样子：

```bash
ffmpeg -i input.avi output.mp4
```

<br/>

### **FFmpeg常用API**

#### **常用命令行参数**

FFmpeg 常用的命令行参数如下：

-   `-c`：指定编码器；
-   `-c copy`：直接复制，不经过重新编码（这样比较快）；
-   `-c:v`：指定视频编码器；
-   `-c:a`：指定音频编码器；
-   `-i`：指定输入文件；
-   `-an`：去除音频流；
-   `-vn`： 去除视频流；
-   `-preset`：指定输出的视频质量，会影响文件的生成速度，有以下几个可用的值 ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow；
-   `-y`：不经过确认，输出时直接覆盖同名文件；

<br/>

#### **常见用法**

##### **① 查看文件信息**

查看视频文件的元信息，比如编码格式和比特率，可以只使用`-i`参数：

```bash
$ ffmpeg.exe -i input.mp4

ffmpeg version n4.4-17-gf7468a9c40 Copyright (c) 2000-2021 the FFmpeg developers
  built with gcc 10-win32 (GCC) 20210408
  libavutil      56. 70.100 / 56. 70.100
  libavcodec     58.134.100 / 58.134.100
  libavformat    58. 76.100 / 58. 76.100
  libavdevice    58. 13.100 / 58. 13.100
  libavfilter     7.110.100 /  7.110.100
  libswscale      5.  9.100 /  5.  9.100
  libswresample   3.  9.100 /  3.  9.100
  libpostproc    55.  9.100 / 55.  9.100
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'input.mp4':
  Metadata:
    major_brand     : mp42
    minor_version   : 0
    compatible_brands: isommp42
    creation_time   : 2019-11-08T19:03:40.000000Z
  Duration: 00:15:00.80, start: 0.000000, bitrate: 445 kb/s
  Stream #0:0(und): Video: h264 (Constrained Baseline) (avc1 / 0x31637661), yuv420p(tv, smpte170m/smpte170m/bt709), 472x360 [SAR 1:1 DAR 59:45], 347 kb/s, 25 fps, 25 tbr, 12800 tbn, 50 tbc (default)
    Metadata:
      creation_time   : 2019-11-08T19:03:40.000000Z
      handler_name    : ISO Media file produced by Google Inc. Created on: 11/08/2019.
      vendor_id       : [0][0][0][0]
  Stream #0:1(und): Audio: aac (LC) (mp4a / 0x6134706D), 44100 Hz, stereo, fltp, 96 kb/s (default)
    Metadata:
      creation_time   : 2019-11-08T19:03:40.000000Z
      handler_name    : ISO Media file produced by Google Inc. Created on: 11/08/2019.
      vendor_id       : [0][0][0][0]
```

上面命令会输出很多冗余信息，加上`-hide_banner`参数，可以只显示元信息：

```bash
$ ffmpeg.exe -hide_banner -i input.mp4

Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'input.mp4':
  Metadata:
    major_brand     : mp42
    minor_version   : 0
    compatible_brands: isommp42
    creation_time   : 2019-11-08T19:03:40.000000Z
  Duration: 00:15:00.80, start: 0.000000, bitrate: 445 kb/s
  Stream #0:0(und): Video: h264 (Constrained Baseline) (avc1 / 0x31637661), yuv420p(tv, smpte170m/smpte170m/bt709), 472x360 [SAR 1:1 DAR 59:45], 347 kb/s, 25 fps, 25 tbr, 12800 tbn, 50 tbc (default)
    Metadata:
      creation_time   : 2019-11-08T19:03:40.000000Z
      handler_name    : ISO Media file produced by Google Inc. Created on: 11/08/2019.
      vendor_id       : [0][0][0][0]
  Stream #0:1(und): Audio: aac (LC) (mp4a / 0x6134706D), 44100 Hz, stereo, fltp, 96 kb/s (default)
    Metadata:
      creation_time   : 2019-11-08T19:03:40.000000Z
      handler_name    : ISO Media file produced by Google Inc. Created on: 11/08/2019.
      vendor_id       : [0][0][0][0]
```

<br/>

##### **② 转换编码格式**

<font color="#f00">**转换编码格式（transcoding）指的是：将视频文件从一种编码转成另一种编码；**</font>

比如：转成 H.264 编码；

<font color="#f00">**一般使用编码器`libx264`，所以只需指定输出文件的视频编码器即可；**</font>

```bash
ffmpeg \
 \
 \
-i input.file \
-c:v libx264 \
output.mp4
```

下面是转成 H.265 编码的写法：

```bash
ffmpeg \
 \
 \
-i input.file \
-c:v libx265 \
output.mp4
```

<br/>

##### **③ 转换容器格式**

<font color="#f00">**转换容器格式（transmuxing）指的是，将视频文件从一种容器（格式）转到另一种容器（格式）；**</font>

下面是 mp4 转 webm 的写法：

```bash
ffmpeg \
-i input.mp4 \
-c copy \
output.webm
# 下同
ffmpeg \
-i input.mp4 \
-c:v copy -c:a copy \
output.webm
```

在上面例子中：

<font color="#f00">**只是转一下容器，内部的编码格式不变，所以使用`-c copy`指定直接拷贝，不经过转码，这样比较快；**</font>

在进行转换时可以指定转换前后的视频质量以及转换速度；

使用`crf`（Constant Rate Factor，恒定速率因子）参数来控制输出质量：

-   **`crf`取值越低，质量越高（范围：0-51）；**
-   **`crf`默认值为23，视觉上无损压缩对应于`-crf 18`；**

同时，使用`preset`（预设参数）控制压缩过程的速度；

例如：

```bash
ffmpeg \
-i input.mp4 \
-preset slower -crf 18 \
output.mp4
```

>   更多信息：
>
>   -   https://trac.ffmpeg.org/wiki/Encode/H.264

<br/>

##### **④ 调整码率**

<font color="#f00">**调整码率（transrating）指的是，改变编码的比特率，一般用来将视频文件的体积变小；**</font>

下面的例子指定码率最小为964K，最大为3856K，缓冲区大小为 2000K；

```bash
ffmpeg \
-i input.mp4 \
-minrate 964K -maxrate 3856K -bufsize 2000K \
output.mp4
```

<br/>

##### **⑤ 改变分辨率**

下面是改变视频分辨率（transsizing）的例子，从 1080p 转为 480p：

```bash
ffmpeg \
-i input.mp4 \
-vf scale=480:-1 \
output.mp4
```

<br/>

##### **⑥ 提取音频**

有时，需要从视频里面提取音频（demuxing），可以像下面这样写：

```bash
ffmpeg \
-i input.mp4 \
-vn -c:a copy \
output.aac
```

上面例子中：

-   `-vn`表示去掉视频；
-   `-c:a copy`表示不改变音频编码，直接拷贝；

<br/>

##### **⑦ 添加音轨**

<font color="#f00">**添加音轨（muxing）指的是：将外部音频加入视频，比如添加背景音乐或旁白；**</font>

下面是一个例子：

```bash
ffmpeg \
-i input.aac -i input.mp4 \
output.mp4
```

<font color="#f00">**上面例子中，有音频和视频两个输入文件，FFmpeg 会将它们合成为一个文件；**</font>

当然FFmpeg还有更强大的用法，分别抽取两个视频中的声音和画面组成新的视频：

```bash
ffmpeg \
-i in0.mp4 -i in1.mp4 \
-c copy -map 0:0 -map 1:1 -shortest \
out.mp4
```

-   **`-shortest`参数表示音频文件结束，输出视频就结束；**
-   `-map`参数将视频的不同部分进行了映射；

>   **更多关于`-map`参数：**
>
>   -   [`-map` option documentation](http://ffmpeg.org/ffmpeg.html#Advanced-options)

<br/>

##### **⑧ 截图**

下面的例子是从指定时间开始，连续对1秒钟的视频进行截图：

```bash
ffmpeg \
-y \
-i input.mp4 \
-ss 00:01:24 -t 00:00:01 \
output_%3d.jpg
```

如果只需要截一张图，可以指定只截取一帧：

```bash
ffmpeg \
-ss 01:23:45 \
-i input \
-vframes 1 -q:v 2 \
output.jpg
```

上面例子中：

-   **`-vframes 1`指定只截取一帧；**
-   **`-q:v 2`表示输出的图片质量，一般是1到5之间（1 为质量最高）；**

<br/>

##### **⑨ 裁剪**

<font color="#f00">**裁剪（cutting）指的是，截取原始视频里面的一个片段，输出为一个新视频；**</font>

可以指定开始时间（start）和持续时间（duration），也可以指定结束时间（end）；

```bash
ffmpeg \
-ss [start] \
-i [input] \
-t [duration] -c copy \
[output]

# 或者
ffmpeg \
-ss [start] \
-i [input] \
-to [end] -c copy \
[output]
```

下面是实际的例子：

```bash
$ ffmpeg \
-ss 00:01:50 \
-i [input] \
-t 10.5 -c copy \
[output]


$ ffmpeg -ss 2.5 -i [input] -to 10 -c copy [output]
```

上面例子中，`-c copy`表示不改变音频和视频的编码格式，直接拷贝，这样会快很多；

>   <font color="#f00">**当对视频进行裁剪的同时进行视频码率的转换时需要注意：**</font>
>
>   <font color="#f00">**如果不使用`-c copy`选项，则ffmpeg将自动根据所选择的编码格式对输出的视频和音频重新编码；**</font>
>
>   如果要获得高质量的视频和音频，见：
>
>   -   [x264 Encoding Guide](https://ffmpeg.org/trac/ffmpeg/wiki/x264EncodingGuide)
>   -   [AAC Encoding Guide](http://ffmpeg.org/trac/ffmpeg/wiki/AACEncodingGuide)
>
>   <br/>
>
>   例如：
>
>   
>
>   ```bash
>   ffmpeg \
>   -ss [start] \
>   -i in.mp4 \
>   -t [duration] -c:v libx264 -c:a aac -strict experimental -b:a 128k \
>   out.mp4
>   ```

<br/>

##### **⑩ 为音频添加封面**

有些视频网站只允许上传视频文件，如果要上传音频文件，必须为音频添加封面，将其转为视频，然后上传；

下面命令可以将音频文件，转为带封面的视频文件：

```bash
ffmpeg \
-loop 1 \
-i cover.jpg -i input.mp3 \
-c:v libx264 -c:a aac -b:a 192k -shortest \
output.mp4
```

上面命令中：

-   **两个输入文件，一个是封面图片`cover.jpg`，另一个是音频文件`input.mp3`；**
-   **`-loop 1`参数表示图片无限循环；**
-   **`-shortest`参数表示音频文件结束，输出视频就结束；**

<br/>

##### **⑪ 并行解码拼接**

首先创建一个txt文件，指定需要拼接的视频列表：

list.txt

```
file 'in1.mp4'
file 'in2.mp4'
file 'in3.mp4'
file 'in4.mp4'
```

随后执行：

```bash
ffmpeg \
-f concat \
-i list.txt \
-c copy \
out.mp4
```

<br/>

##### **⑫ 延迟音频/视频**

<font color="#f00">**延迟音频/视频专治各种音画不同步；**</font>

延迟视频3.84秒：

```bash
ffmpeg \
-i in.mp4 -itsoffset 3.84 \
-i in.mp4 \
-map 1:v -map 0:a -vcodec copy -acodec copy \
out.mp4
```

延迟音频3.84秒：

```bash
ffmpeg \
-i in.mp4 -itsoffset 3.84 \
-i in.mp4 \
-map 0:v -map 1:a -vcodec copy -acodec copy \
out.mp4
```

<font color="#f00">**其实就是分别提取视频的音频和视频部分，将某个部分延迟后重新拼接为新的视频；**</font>

<br/>

##### **⑬ 添加字幕**

字幕转换依赖于[libass](http://ffmpeg.org/ffmpeg.html#ass)库，在使用时需要确保你使用的ffmpeg已经安装了这个库；

首先将字幕转换为`.ass`格式：

```bash
ffmpeg -i sub.srt sub.ass
```

然后将字幕添加到视频中：

```bash
ffmpeg \
-i in.mp4 \
-vf ass=sub.ass \
out.mp4
```

<br/>

##### **⑭ 旋转视频**

顺时针旋转90度：

```bash
ffmpeg -i in.mov -vf "transpose=1" out.mov
```

`transpose `参数说明：

-   0：逆时针旋转90度，并且垂直翻转；
-   1：顺时针旋转90度；
-   2：逆时针旋转90度；
-   3：顺时针旋转90度，并且垂直翻转；

>   **扩展：**
>
>   <font color="#f00">**使用`-vf "transpose=2,transpose=2"`可以旋转180度；**</font>

<br/>

##### **⑮ 下载数据流**

可以下载m3u8视频流；

首先，定位`m3u8`文件：打开Chrome控制台(F12) → 网络 → `Filter: m3u8`，查看文件地址；

下载文件并连接：

```bash
ffmpeg -i "path_to_playlist.m3u8" -c copy -bsf:a aac_adtstoasc out.mp4
```

>   <font color="#f00">**如果遇到：`"Protocol 'https not on whitelist 'file,crypto'!"`错误；**</font>
>
>   <font color="#f00">**添加`protocol_whitelist`选项：**</font>
>
>   ```bash
>   ffmpeg \
>   -protocol_whitelist "file,http,https,tcp,tls" \
>   -i "path_to_playlist.m3u8" \
>   -c copy -bsf:a aac_adtstoasc \
>   out.mp4
>   ```

<br/>

##### **⑯ 视频部分消音**

视频前90秒消音：

```bash
ffmpeg -i in.mp4 -vcodec copy -af "volume=enable='lte(t,90)':volume=0" out.mp4
```

视频`1'20''~1'30''`消音：

```bash
ffmpeg -i in.mp4 -vcodec copy -af "volume=enable='between(t,80,90)':volume=0" out.mp4
```

<br/>

##### **⑰ 从视频创建幻灯片**

使用参数：`-r`，标记提取图像的帧速率（每个图像的时间间隔）； 

例如：`-vf fps = 25`表示标记输出的帧率为25；

```bash
ffmpeg -r 1/5 -i img%03d.png -c:v libx264 -vf fps=25 -pix_fmt yuv420p out.mp4
```

<br/>

##### **⑱ 更改视频标题**

命令：

```bash
ffmpeg -i in.mp4 -map_metadata -1 -metadata title="My Title" -c:v copy -c:a copy out.mp4
```

<br/>

## **附录**

文章参考：

-   [FFmpeg cheat sheet](https://gist.github.com/steven2358/ba153c642fe2bb1e47485962df07c730)
-   [FFmpeg 视频处理入门教程](http://www.ruanyifeng.com/blog/2020/01/ffmpeg.html)

<br/>