---
title: gemini-cli使用
toc: true
cover: 'https://img.paulzzh.com/touhou/random?1'
date: 2025-07-14 13:17:01
categories: 工具分享
tags: [AI, 工具分享]
description: 有一段时间没有写博客了，这两年AI的发展日新月异，真是可怕。最近终于把学校的一摊子事忙完了，接下来还有个创新大赛、八月份又要去广州参加国培，不可谓不忙。本文介绍了如何使用 Google 最新出的 gemini-cli。
---

有一段时间没有写博客了，这两年AI的发展日新月异，真是可怕。最近终于把学校的一摊子事忙完了，接下来还有个创新大赛、八月份又要去广州参加国培，不可谓不忙；

本文介绍了如何使用 Google 最新出的 gemini-cli：

-   https://github.com/google-gemini/gemini-cli

<br/>

<!--more-->

# **gemini-cli使用**

## **一、简介**

目前大家可能用的都是 Cursor 或者 VSCode 里的插件（如 Cline）、阿里的通义灵码，以及腾讯的 CodeBuddy 这类界面化的 AI 编码交互方式。

而 [gemini-cli](https://github.com/google-gemini/gemini-cli) 是一个让你可以在命令行使用和上面功能类似的命令行工具！

功能特点：

-   **AI 编程伙伴：** 你可以直接在终端里问它编程问题、让它帮你写代码、解释错误信息或者优化现有代码。
-   **多功能助手：** 不仅仅是代码，你还可以向它提问各种问题，甚至可以发图片（比如错误截图）给它看，让它帮你分析。
-   **简化工作：** 对于开发者和技术人员来说，这意味着不用离开熟悉的终端界面，就能快速获得 AI 的帮助，从而提高工作效率。
-   **开源免费：** 它是开源的，并且在预览期间为个人开发者提供了非常慷慨的免费使用额度。

<br/>

## **二、安装**

直接使用 npm 全局安装即可：

```bash
npm install -g @google/gemini-cli
```

<br/>

## **三、使用**

直接在命令行输入：

```bash
gemini
```

即可打开：

```
➜  blog git:(save) ✗ gemini

 ███            █████████  ██████████ ██████   ██████ █████ ██████   █████ █████
░░░███         ███░░░░░███░░███░░░░░█░░██████ ██████ ░░███ ░░██████ ░░███ ░░███
  ░░░███      ███     ░░░  ░███  █ ░  ░███░█████░███  ░███  ░███░███ ░███  ░███
    ░░░███   ░███          ░██████    ░███░░███ ░███  ░███  ░███░░███░███  ░███
     ███░    ░███    █████ ░███░░█    ░███ ░░░  ░███  ░███  ░███ ░░██████  ░███
   ███░      ░░███  ░░███  ░███ ░   █ ░███      ░███  ░███  ░███  ░░█████  ░███
 ███░         ░░█████████  ██████████ █████     █████ █████ █████  ░░█████ █████
░░░            ░░░░░░░░░  ░░░░░░░░░░ ░░░░░     ░░░░░ ░░░░░ ░░░░░    ░░░░░ ░░░░░


Tips for getting started:
1. Ask questions, edit files, or run commands.
2. Be specific for the best results.
3. Create GEMINI.md files to customize your interactions with Gemini.
4. /help for more information.



╭─────────────────────────────────────────────────────────────────────────────────────────────╮
│ >   Type your message or @path/to/file                                                      │
╰─────────────────────────────────────────────────────────────────────────────────────────────╯

~/workspace/blog (save*)       no sandbox (see /docs)        gemini-2.5-pro (100% context left)
```

首次运行时，它会引导完成几个设置步骤：

-   **选择主题风格：** 为界面选择一个喜欢的颜色主题。
-   **授权登录：** 它会提示您通过 Google 账户进行登录授权。这通常会生成一个链接，需要在浏览器中打开并授权。

>   **授权后，就可以享受免费的调用额度（预览版期间每天有 1000 次请求）。**
>
>   

<br/>

## **四、配置API登陆**

如果你没有配置 API，每次运行 gemini-cli 都要重新登陆一次，可以配置 API 修改登录方式；

### **1、访问 Google AI Studio**

在浏览器中打开网址：

-   **https://aistudio.google.com/app/apikey**



### **2、创建或获取密钥**

-   如果尚未登录，请使用您的 Google 账户登录。
-   点击 **“Create API key”** (创建 API 密钥) 按钮。
-   系统会生成一个新的 API 密钥。这是一个很长的字符串。



### **3、复制并妥善保管**

-   立即点击密钥旁边的复制，复制 key；



### **4、引入环境变量**

配置：

```bash
export GEMINI_API_KEY="YOUR_API_KEY"
```

将你复制的内容替换 `YOUR_API_KEY`；

>   有关 Google Gemini API 的使用也可以看这篇文章：
>
>   -    [Google Gemini API 接口调用教程，图文讲解](http://apifox.com/apiskills/how-to-use-gemini-api/)



### **5、生效**

运行 `source ~/.zshrc` 或重启终端；

随后在登录选项中选择 API Key 的方式即可！

<br/>

## **五、其他说明**

启动 gemini 后，引用本地文件 可以使用 `@` 来选择文件；

更多内容可以通过 `/help` 获取：

```bash
Basics:                                                                                     │
│ Add context: Use @ to specify files for context (e.g., @src/myFile.ts) to target specific   │
│ files or folders.                                                                           │
│ Shell mode: Execute shell commands via ! (e.g., !npm run start) or use natural language     │
│ (e.g. start server).                                                                        │
│                                                                                             │
│ Commands:                                                                                   │
│  /clear - clear the screen and conversation history                                         │
│  /help - for help on gemini-cli                                                             │
│  /memory - Commands for interacting with memory.                                            │
│    show - Show the current memory contents.                                                 │
│    add - Add content to the memory.                                                         │
│    refresh - Refresh the memory from the source.                                            │
│  /theme - change the theme                                                                  │
│  /docs - open full Gemini CLI documentation in your browser                                 │
│  /auth - change the auth method                                                             │
│  /editor - set external editor preference                                                   │
│  /privacy - display the privacy notice                                                      │
│  /stats - check session stats. Usage: /stats [model|tools]                                  │
│  /mcp - list configured MCP servers and tools                                               │
│  /extensions - list active extensions                                                       │
│  /tools - list available Gemini CLI tools                                                   │
│  /about - show version info                                                                 │
│  /bug - submit a bug report                                                                 │
│  /chat - Manage conversation history. Usage: /chat <list|save|resume> <tag>                 │
│  /quit - exit the cli                                                                       │
│  /compress - Compresses the context by replacing it with a summary.                         │
│  ! - shell command                                                                          │
│                                                                                             │
│ Keyboard Shortcuts:                                                                         │
│ Enter - Send message                                                                        │
│ Ctrl+J - New line                                                                           │
│ Up/Down - Cycle through your prompt history                                                 │
│ Alt+Left/Right - Jump through words in the input                                            │
│ Shift+Tab - Toggle auto-accepting edits                                                     │
│ Ctrl+Y - Toggle YOLO mode                                                                   │
│ Esc - Cancel operation                                                                      │
│ Ctrl+C - Quit application
```

官方也提供了大量的经典案例：

-   https://github.com/google-gemini/gemini-cli?tab=readme-ov-file#popular-tasks

<br/>

## **六、后记**

实际上和[这位博主](https://wiki.eryajf.net/)一样，我最开始也不喜欢使用命令行：

>   由于先入为主的一些体验，我一直习惯于使用像 Cursor 或者 VSCode 里的插件（如 Cline）、阿里的通义灵码，以及腾讯的 CodeBuddy 这类界面化的 AI 编码交互方式。相比之下，对于 Claude cli、Gemini cli 这类基于终端、命令行的交互方式，我一直提不起兴趣。
>
>   直到最近，我体验了几次 Claude cli 的编码功能，这才让我对以往的成见有了一些改变。过去我之所以更习惯插件式的交互方式，是因为它们的操作更为直观。无论是选择代码段、文件，还是插入图片，都非常直接简单。因此，我一直认为这种交互方式就是最优雅的 AI 编码方式。
>
>   正因为这种先入为主的心态，我始终对 Cli 这类交互方式有些抵触。我一直不太能理解，在编辑器里写代码，却要用终端来进行 AI 编码，这到底是一种怎样的交互逻辑？总觉得这种方式很割裂，与 AI 的交互以及 AI 的编码过程变成了一种黑盒，很不直观。这也是我迟迟没有尝试这种编码方式的原因。

但是在安装并且体验了之后，发现确实要方便很多！

他最后的总结也是我的体验以及一些个人感想：

>   <font color="#f00">**这让我意识到，很多时候限制我们接受新事物的，并不是事物本身的缺点。那些所谓的缺点，或许只是我们自己想象出来的。真正阻碍我们发展的，往往是自己内心深处那些根深蒂固的成见。我们习惯于依赖以往成功的经验，固守在自己的舒适区，对不熟悉的方式和交互逻辑产生抵触情绪。而正是这种抵触，让我们与更美好的事物始终形同陌路。**</font>
>
>   <font color="#f00">**这次 Claude cli 的体验给了我一个提醒：应该始终保持开放的心态，勇于尝试那些看似不符合直觉的新方法或新工具。也许这样能够带来许多意想不到的效率提升和全新的体验，要善于打破自己的成见，才能真正拥抱进步。**</font>

<br/>

# **附录**

参考：

-   https://www.v2ex.com/t/1144487
-   https://wiki.eryajf.net/pages/d89910/

<br/>
