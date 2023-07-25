---
title: Linux下自制OCR软件
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?44'
date: 2021-05-07 19:48:56
categories: 软件安装与配置
tags: [软件安装与配置, 技术杂谈]
description: OCR基本上算是一个日常比较实用的工具了，本文基于开源OCR引擎tesseract以及gnome-screenshot，在Linux下创建自己的OCR工具；
---

OCR基本上算是一个日常比较实用的工具了，本文基于开源OCR引擎tesseract以及gnome-screenshot，在Linux下创建自己的OCR工具；

资源下载：

-   https://www.90pan.com/o157416

<br/>

<!--more-->

## **Linux下自制OCR软件**

### **前言**

在进行OCR时的思路如下：

-   首先，利用截图软件 gnome-screenshot 进行截取需要被文字识别的图片；
-   随后，利用文字识别OCR软件tesseract，进行识别；
-   最后，将结果输出，复制到文件和剪切板；

<br/>

### **步骤1：安装依赖软件**

#### **安装tesseract**

`tesseract`是一个开源的OCR引擎，最初是由惠普公司开发用来作为其平板扫描仪的OCR引擎，2005年惠普将其开源出来，之后google接手负责维护；

目前稳定的版本是4.0（当然也已经出现了5.0版本）；

4.0版本加入了基于LSTM的神经网络技术，中文字符识别准确率有所提高；

>   tesseract的GitHub官方地址：
>
>   -   https://github.com/tesseract-ocr

这里以Ubuntu为例，安装tesseract只需要几个步骤：

```bash
# 添加源
sudo add-apt-repository ppa:alex-p/tesseract-ocr
# 更新源 
sudo apt update 
# 安装
sudo apt install tesseract-ocr 
```

<font color="#f00">**此外，还需要安装中文词库：**</font>

`tesseract`支持60多种语言的识别不同，**使用之前需要先下载对应语言的字库；**

下载地址：

-   https://github.com/tesseract-ocr/tessdata

下载速度慢的朋友可以从我的分享下载（仅有简体中英文识别库）：

-   https://www.90pan.com/o157416

<font color="#f00">**下载完成后需要将`*.traineddata`字库文件放到tessdata目录下，默认路径是`/usr/share/tesseract-ocr/4.00/tessdata`；**</font>

>   **eng.traineddata是英文识别库；**
>
>   **chi_*.traineddata是中文识别库；**

<br/>

#### **安装gnome-screenshot，xclip，imagemagick**

这3个不需要添加源，直接终端输入代码：

```bash
sudo apt install gnome-screenshot
sudo apt install xclip
sudo apt install imagemagick
```

<br/>

### **步骤2：制作shell脚本**

将以下代码复制到文档，并将后缀改成 .sh 并增加运行权限 `sudo chmod a+x *.sh`；

<font color="#f00">**注意：将变量SCR路径部分替换成你想要存放截图以及识别结果txt文档的路径；**</font>

```bash
#!/bin/env bash 
# Dependencies: tesseract-ocr imagemagick gnome-screenshot xclip

#Name: OCR Picture
#Fuction: take a screenshot and OCR the letters in the picture
#Path: /home/Username/...

#you can only scan one character at a time
SCR="/home/{Username}/Documents/temp"

# take a shot what you wana to OCR to text
gnome-screenshot -a -f $SCR.png

# increase the png
mogrify -modulate 100,0 -resize 400% $SCR.png 
# should increase detection rate

# OCR by tesseract
tesseract $SCR.png $SCR &> /dev/null -l eng+chi1

# get the text and copy to clipboard
cat $SCR.txt | xclip -selection clipboard

exit
```

<br/>

### **步骤3：设置快捷键，一键调用shell脚本**

为了方便使用，本小结为ocr创建键盘快捷键；

打开系统设置，拉到底部，点击`+`；

![ubuntu_settings.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/ubuntu_settings.png)

创建快捷键：

-   名称：自由设置，建议以shell脚本名称命名；
-   命令：bash 这里换成你自己shell脚本所在的路径/ocr.sh；

<font color="#f00">**注意bash后面有一个空格！**</font>

![ubuntu_settings_2.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/ubuntu_settings_2.png)

<br/>

### **使用脚本**

直接使用快捷键即可进入截屏模式；

截取想要识别的文字区域，等待片刻后便可在指定目录生成`temp.png`和`temp.txt`文件；

同时，文字会自动复制到剪切板，可以直接粘贴使用；

**Enjoy！**

<br/>

## **附录**

资源下载：

-   https://www.90pan.com/o157416

参考视频：

-   [ubuntu linux 下实现一键截屏截图OCR文字识别](https://www.bilibili.com/video/av90573946/)

<br/>