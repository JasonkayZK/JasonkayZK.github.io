---
title: AppleScript介绍与简单实战
toc: true
cover: 'https://img.paulzzh.com/touhou/random?66'
date: 2025-07-15 14:23:25
categories: 工具分享
tags: [工具分享, AppleScript, MacOS]
description: AppleScript是MacOS内置的脚本语言，可以自动化操作应用程序。本文介绍了AppleScript的基本概念、语法和一个简单实战示例。
---

AppleScript是macOS内置的脚本语言，可以自动化操作应用程序。本文介绍了AppleScript的基本概念、语法和一个简单实战示例。

<br/>

<!--more-->

# **AppleScript介绍与简单实战**

## **一、什么是AppleScript**

AppleScript是苹果公司推出的一种脚本语言，内置于macOS中，可以直接操作和控制macOS及其应用程序。它是一个实现macOS自动化的强大工具，AppleScript的前身是HyperCard所使用的脚本语言HyperTalk。

与其他脚本语言如Python和JavaScript相比，AppleScript最显著的特点是能够控制其他macOS上的应用程序。通过AppleScript，我们可以完成一些繁琐重复的工作。其语法简单，接近自然语言，就像在和系统对话一样。此外，系统提供了语法查询字典，方便查询语法。

<br/>

## **二、基础语法**

按照惯例，用AppleScript写一个Hello World：

```applescript
display dialog "Hello, world!"
```

命令行执行：

```bash
osascript -e 'display dialog "Hello, world!"'
```

运行后，系统会弹出“Hello, world!”的弹窗。

<br/>

下面介绍几种常用语法：

### **1、告诉应用做某事**

AppleScript的语法接近自然语言，例如：

```applescript
tell application "Safari"
    activate
    open location "https://qq.com/"
end tell
```

这告诉Safari启动并打开指定网址。

### **2、设置变量**

```applescript
set qq to "https://qq.com/"
tell application "Safari"
    activate
    open location qq
end tell
```

<br/>

### **3、条件语句**

```applescript
if num > 2 then
    // ...
else
    // ...
end if
```

<br/>

### **4、循环语句**

```applescript
repeat with num in {1, 2, 3}
    display dialog "hello, world"
end repeat
```

<br/>

### **5、模拟点击和输入**

可以使用`click`命令模拟点击，或`keystroke`输入文本。

<br/>

## **三、简单实战：命令完成后显示通知**

执行以下命令可以展示一条通知：

```bash
osascript -e 'display notification "The command finished" with title "Success"'
```

在.zshrc中定义一个函数：

```bash
function notifyResult () {
  if [ $? -eq 0 ]; then
    osascript -e 'display notification "The command finished" with title "Success"'
  else
    osascript -e 'display notification "The command failed" with title "Failed"'
  fi
}
```

运行长时间命令时：

```bash
some_program; notifyResult
```

执行完后会收到通知是否执行成功！

>   可以设置通知音效：
>
>   -   [MacOS: notify when the terminal command is finished](https://strdr4605.com/mac-os-notify-when-the-terminal-command-is-finished)

<br/>

## **四、一些常用脚本**

### **1、通过参数发送系统通知**

>   源代码：
>
>   -   https://gist.github.com/JasonkayZK/c32cc4af8582b12d785619f6c999999f

代码如下：

sys-notify

```bash
#!/bin/bash

# 帮助函数
show_help() {
    echo "Usage: $0 [Option] [message]"
    echo "Show system notification"
    echo
    echo "Option:"
    echo "  -h, --help         Show help info"
    echo "  -t, --title TITLE  Set notification title (Default: Notify)"
    exit 0
}

# 默认值
title="Notify"

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            show_help
            ;;
        -t|--title)
            if [[ -z "$2" ]]; then
                echo "错误: --title 需要一个参数" >&2
                exit 1
            fi
            title="$2"
            shift 2
            ;;
        *)
            # 第一个非选项参数视为消息内容
            message="$1"
            shift
            break
            ;;
    esac
done

# 如果没有提供消息内容，则从标准输入读取
if [[ -z "$message" ]]; then
    if [[ -t 0 ]]; then
        echo "错误: 没有提供消息内容" >&2
        show_help
        exit 1
    else
        message=$(cat)
    fi
fi

# 发送通知
case "$(uname -s)" in
    Darwin)
        # macOS 使用 AppleScript
        osascript -e "display notification \"$message\" with title \"$title\""
        ;;
    Linux)
        # Linux 使用 notify-send (libnotify)
        if command -v notify-send &>/dev/null; then
            notify-send "$title" "$message"
        else
            echo "错误: 未找到 notify-send 命令。请安装 libnotify 包。" >&2
            exit 1
        fi
        ;;
    *)
        echo "错误: 不支持的操作系统" >&2
        exit 1
        ;;
esac    
```

准备：

-   编写 `sys-notify`；
-   增加可执行权限 `chmod +x sys-notify`；
-   加入到 PATH 环境变量；

使用方法：

-   基本用法：`sys-notify "操作已完成"`
-   自定义标题：`sys-notify -t "操作结果" "操作已完成"`
-   从标准输入读取内容：`echo "操作已完成" | sys-notify -t "操作结果"`

<br/>

### **2、命令完成后展示结果**

>   源代码：
>
>   -   https://gist.github.com/JasonkayZK/d5c4e3adadf3478ded5896becf01f08c

```bash
function notifyResult () {
  if [ $? -eq 0 ]; then
    osascript -e 'display notification "The command finished" with title "Success"'
  else
    osascript -e 'display notification "The command failed" with title "Failed"'
  fi
}
```

在运行某些需要比较长时间的程序时，执行以下命令：

```node-repl
some_program; notifyResult
```

<br/>

## **五、后记**

AppleScript是一个简单而强大的工具，能自动化macOS操作；

更多内容可参考附录链接；

<br/>

# **附录**

源代码：

-   https://gist.github.com/JasonkayZK/c32cc4af8582b12d785619f6c999999f
-   https://gist.github.com/JasonkayZK/d5c4e3adadf3478ded5896becf01f08c

官方文档：

-   https://developer.apple.com/library/archive/documentation/AppleScript/Conceptual/AppleScriptLangGuide/introduction/ASLR_intro.html

参考文章：

- https://zhuanlan.zhihu.com/p/149893274
- https://ameow.xyz/archives/display-notification-after-command-finishes-macos

<br/>
