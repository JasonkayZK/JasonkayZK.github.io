---
title: uv使用
toc: true
cover: 'https://img.paulzzh.com/touhou/random?44'
date: 2025-07-14 14:02:30
categories: 工具分享
tags: [工具分享, Python, uv]
description: uv是一个Python项目管理工具，类似于pip、venv、virtualenv和pip-tools的组合体，但它非常快。本文总结了如何安装和使用uv。
---

`uv` 是一个用 Rust 编写的、速度极快的 Python 包和项目管理工具，由 `ruff` 的作者开发。它的目标是成为 `pip`、`venv`、`virtualenv` 和 `pip-tools` 等工具的直接替代品，提供一个统一、快速且易于使用的体验。

本文总结了如何安装和使用 `uv`。

官方仓库：
-   https://github.com/astral-sh/uv

<br/>

<!--more-->

# **uv使用**

## **一、简介**

如果你对 Python 的包管理生态有所了解，你可能用过 `pip` 来安装包，用 `venv` 或 `virtualenv` 来创建虚拟环境，用 `pip-tools` 来锁定依赖。这些工具各司其职，但组合使用起来有时会显得有些繁琐。

`uv` 的出现就是为了解决这个问题。它将包安装、虚拟环境管理和依赖解析等功能集成到了一个单一的命令行工具中，并且性能极高。

**主要特点：**

-   **极速：** `uv` 利用了先进的依赖解析算法和全局缓存，安装和解析包的速度比 `pip` 快得多。
-   **一体化：** 无需在 `pip` 和 `venv` 之间切换，`uv` 提供了统一的命令来处理大多数包和环境管理任务。
-   **直接替代：** `uv` 的命令设计与 `pip` 非常相似（例如 `uv pip install`），使得迁移成本非常低。
-   **依赖锁定：** 内置了类似 `pip-tools` 的功能，可以从 `pyproject.toml` 或 `requirements.in` 文件编译生成锁定的 `requirements.txt` 文件。

<br/>

## **二、安装**

`uv` 提供了多种安装方式：

#### **macOS 和 Linux**

使用 `curl`:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### **Windows**

使用 PowerShell:

```bash
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

#### **其他方式**

也可以通过 `pip`、`brew` 等包管理器安装：

```bash
# 通过 pip
pip install uv

# 通过 Homebrew
brew install uv
```

安装完成后，可以通过 `uv --version` 来验证是否成功。

<br/>

## **三、基本使用**

`uv` 的使用非常直观，特别是对于熟悉 `pip` 和 `venv` 的用户。

### **1、管理python版本**

使用如下命令，显示出当前环境中所有可用的python版本（包括已经安装的和可以安装的）

```bash
uv python list
```

如果需要安装其他版本的python，使用如下命令

```
uv python install 3.12
```

除了标准python之外，还可以安装其他的Python实现，比如PyPy实现的python：

```sh
uv python install pypy@3.10
```

查找某个python版本的路径：

```sh
❯ uv python find 3.10
/Library/Frameworks/Python.framework/Versions/3.10/bin/python3.10
```

<br/>

## **四、单个脚本使用**

>   参考：
>
>   -   https://github.com/astral-sh/uv?tab=readme-ov-file#scripts

uv 可以管理单文件脚本的依赖项和环境；

例如：创建一个新脚本并添加内联元数据来声明其依赖项：

```bash
$ echo 'import requests; print(requests.get("https://astral.sh"))' > example.py

$ uv add --script example.py requests
Updated `example.py`
```

然后，在隔离的虚拟环境中运行脚本：

```bash
$ uv run example.py
Reading inline script metadata from: example.py
Installed 5 packages in 12ms
<Response [200]>
```

<br/>

## **五、项目中使用**

### **1、选用python版本**

在具体的某个项目中，进入项目目录，使用如下命令指定选用的python版本：

```bash
uv python pin 版本号
```

这个命令会在指定目录下创建一个`.python-version`文件，内容如下：

```bash
❯ uv python pin 3.10                                    
Pinned `.python-version` to `3.10`

❯ cat .python-version  
3.10
```

>    **注意：这里选用的python版本只和uv管理的虚拟环境有关系，和我们全局的python、python3命令都没有关系！**

<br/>

### 2、创建虚拟环境

创建项目有两种方式，第一种方式，先创建好项目目录，然后设置python版本并初始化uv虚拟环境：

```sh
uv python pin 3.10
uv init # 初始化
```

执行了uv init之后，会在当前目录下创建几个文件，同时也会在当前目录下执行git init创建出一个新的git仓库来：

```sh
❯ uv python pin 3.13
Pinned `.python-version` to `3.13`

❯ uv init
Initialized project `test-code`
                                         
❯ ls
README.md      main.py        pyproject.toml
```

另外一个方式是在init之后添加一个项目名，会自动创建项目文件夹

```sh
uv init 项目名
```

>   **如果需要指定特定python版本，建议使用第一种方式来创建项目；**
>
>   **否则还需要手动修改pyproject.toml配置文件里面需要的python版本。**

<br/>

### **3、添加依赖**

```sh
uv add 依赖项
```

比如添加requests库：

```
uv add requests
```

还可以指定具体版本：

```
uv add requests==版本号
```

执行了这个命令后，会在当前目录下创建`.venv`虚拟环境目录（在vscode里面可以选择这个目录作为虚拟环境，否则代码解析会有问题）；

并添加我们要的依赖项，同时会新增一个uv.lock文件，用于存放依赖项版本相关的信息。

pyproject.toml文件中的dependencies字段也会包含需要的依赖项：

```sh
❯ uv add requests
Using CPython 3.13.1 interpreter at: /opt/homebrew/opt/python@3.13/bin/python3.13
Creating virtual environment at: .venv
Resolved 6 packages in 13.85s
Prepared 5 packages in 5.55s
Installed 5 packages in 13ms
 + certifi==2025.1.31
 + charset-normalizer==3.4.1
 + idna==3.10
 + requests==2.32.3
 + urllib3==2.4.0
```

而且，从这个输出中也能看到，它自动使用了`.python-version`指定的3.13版本的python；

和当前全局配置下的python3指向什么版本没有关系（全局python3指向的是3.10版本）；

<br/>

### 4、运行程序

依赖添加好后，就可以使用uv来运行python程序了

```sh
uv run 程序文件名 [命令行参数]
```

uv会自动按照我们的配置来运行程序，无序我们手动维护依赖项，也不需要手动去source各式各样的虚拟环境！

<br/>

### **5、其他机器中配置环境**

在其他机器拉取代码后，也需要配置虚拟环境、下载项目依赖；

如果使用 uv 进行管理只需要一步：

```bash
uv sync
```

即可同步环境，随后使用：

```bash
uv run 程序文件名 [命令行参数]
```

即可运行！

<br/>

## **六、uvx命令**

随着uv下载的还有一个uvx命令，和 `pipx` 类似；

使用 uvx 命令可以执行或安装一些使用 Python 编写的命令行工具；

>   参考：
>
>   -   https://github.com/astral-sh/uv?tab=readme-ov-file#tools

### **1、临时使用命令**

例如，在一个临时环境中执行一个工具：

```bash
➜  blog git:(save) ✗ uvx pycowsay 'hello world!'
Installed 1 package in 6ms
/Users/zk/.cache/uv/archive-v0/C-520Z4yR2_MYfgN_xvWl/lib/python3.12/site-packages/pycowsay/main.py:23: SyntaxWarning: invalid escape sequence '\ '
  """

  ------------
< hello world! >
  ------------
   \   ^__^
    \  (oo)\_______
       (__)\       )\/\
           ||----w |
           ||     ||
```

可以看到，工具会被临时下载到 `~/.cache/uv` 中！

<br/>

### **2、全局安装工具**

也可以全局安装一个工具：

```bash
$ uv tool install ruff
Resolved 1 package in 6ms
Installed 1 package in 2ms
 + ruff==0.5.0
Installed 1 executable: ruff

$ ruff --version
ruff 0.5.0
```

>   参考：
>
>   -   [tools documentation](https://docs.astral.sh/uv/guides/tools/)

<br/>

uvx命令本质上是uv tool run命令的别名：

```bash
uvx python main.py
# 等价于
uv run main.py
# 等价于
uv tool run main.py
```

实际例子，如下这两个命令是等价的：

```bash
❯ uvx --directory ~/data/code/python/test_code python main.py
Hello from test-code!
    
❯ uv tool run --directory ~/data/code/python/test_code python main.py
Hello from test-code!
```

<br/>

## **七、配置**

### **1、依赖镜像源配置**

>   参考：
>
>   -   https://blog.csdn.net/qq_41472205/article/details/145686414

#### **（1）项目级**

uv下载第三方库本质上也是通过pypi源下载的，所以在国内网络环境中默认链接速度会很慢，可以在项目目录的pyproject.toml中添加如下内容来使用清华源：

```toml
[[tool.uv.index]]
url = "https://pypi.tuna.tsinghua.edu.cn/simple"
default = true
```

#### **（2）命令行级**

运行uv add命令的时候也可以指定镜像源

```bash
uv add --default-index https://pypi.tuna.tsinghua.edu.cn/simple requests
```

#### **（3）全局**

uv也提供了全局的配置项，可以通过环境变量`UV_DEFAULT_INDEX`配置镜像源

```bash
export UV_DEFAULT_INDEX=https://pypi.tuna.tsinghua.edu.cn/simple
```

>   **注意：全局的配置项优先级低于pyproject.toml中配置的镜像源；**

<br/>

# **附录**

**官方仓库:**

-   https://github.com/astral-sh/uv

**官方文档:**

-   https://docs.astral.sh/uv/

**参考文章:**

-   https://blog.csdn.net/muxuen/article/details/147544307

<br/>