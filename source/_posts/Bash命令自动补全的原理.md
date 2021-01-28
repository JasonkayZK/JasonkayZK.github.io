---
title: Bash命令自动补全的原理
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?24'
date: 2020-12-06 16:21:54
categories: Linux
tags: [Linux, 技术杂谈, Bash]
description: 在Bash中输入命令时，可以使用Tab根据已输入的字符自动补全路径名、文件名和可执行程序；自动补全依赖于Bash的内置命令complete、compgen和在/etc/bash_completion.d/路径下创建的自动补全脚本；本文讲述了Bash自动补全的原理；
---

在Bash中输入命令时，可以使用Tab根据已输入的字符自动补全**路径名**、**文件名**和**可执行程序**；

自动补全依赖于Bash的内置命令`complete`、`compgen`和在`/etc/bash_completion.d/`路径下创建的自动补全脚本；

本文讲述了Bash自动补全的原理；

系列文章：

-   [Bash命令自动补全的原理](https://jasonkayzk.github.io/2020/12/06/Bash命令自动补全的原理/)
-   [Bash命令自动补全实战](https://jasonkayzk.github.io/2020/12/07/Bash命令自动补全实战/)

<br/>

<!--more-->

## **Bash命令自动补全的原理**

在Bash中的自动补全是通过内置命令`complete`实现的：

```bash
$ type complete
complete is a shell builtin
```

实际上，补齐功能可以通过脚本指定命令参数如何补全，默认的补全脚本保存在 `/etc/bash_completion.d` 目录下；

>   CentOS 默认会安装一个 `bash-completion` 包，这里面包含了常用命令的大部分自动补齐脚本，在编写脚本时可以直接参考这个包里的内容；

### **简单示例**

假设有一个命令 `foobar` ，接下来为该命令添加自动补齐功能：

在`/etc/bash_completion.d`编辑`foobar.bash`文件：

```bash
$ cat /etc/bash_completion.d/foobar.bash
_foobar()
{
	local cur=${COMP_WORDS[COMP_CWORD]}
	COMPREPLY=( $(compgen -W "exec help test" -- $cur) )
}
complete -F _foobar foobar
```

测试 `foobar` 命令是否可以自动补全。

>   注意，`foobar` 命令本身没有自动补全，需要手动输入。

```bash
$ source /etc/bash_completion.d/foobar.bash
$ foobar <Tab><Tab>
exec  help  test  
```

如上，source 命令加载了 `foobar.bash` 使其能在当前会话生效，为了可以自动生效，可以将上述的 source 命令添加到 bashrc 或者 profile 中；

<br/>

### **常用命令**

上述的示例中使用到了两个命令 `complete` 和 `compgen` ，常用的补全命令还有 `compopt`；

下面分别介绍这三个命令：

#### **① complete**

补全命令，这是最核心的命令了；

简单看下该命令的常用参数说明，可以通过 `help complete` 以及 `man complete` 查看详细帮助，这里简单列举一下常用参数：

```bash
-F function	执行 shell 函数，函数中生成COMPREPLY作为候选的补全结果
-C command	将 command 命令的执行结果作为候选的补全结果
-G pattern	将匹配 pattern 的文件名作为候选的补全结果
-W wordlist	分割 wordlist 中的单词，作为候选的补全结果
-p [name]	列出当前所有的补全命令；
-r [name]	删除某个补全命令；
```

另外，可以通过 `-o` 设置一些选项，常用的有：

-   nospace    默认会自动填充一个空格，用来区分，可以通过该参数关闭；
-   filenames  在补全的时候会具体到文件，而不是目录，对于文件补齐比较有用；

示例如下：

```bash
$ complete -W 'word1 word2 word3 test' foobar
$ foobar w<Tab>
$ foobar word<Tab>
$ complete -p
complete -W 'word1 word2 word3 test' foobar
... ...
$ complete -r foobar
$ complete -p
... ...
```

#### **② compgen**

筛选命令，用来筛选生成匹配单词的候选补全结果，如下是一些简单的示例。

```bash
# 单词匹配
$ compgen -W "hello world" -- h
hello

# 文件匹配
$ compgen -f -- h
hello.txt
```

#### **③ compopt**

compopt命令修改每个名称指定的补全选项，如果没有指定名称则修改当前执行的补全的选项，如果也没有指定选项，则显示每个名称或当前补全所用的选项。选项可能的取值就是上面的内建命令complete的有效选项：

```
compopt [-o option] [-DE] [+o option] [name]
+o option				启用 option 配置
-o option				弃用 option 配置
```

<br/>

### **变量**

除了上面常用的命令外，Bash 还提供了几个内置变量来辅助补全功能，如下：

-   `COMP_WORDS` 数组，存放当前命令行中输入的所有单词；
-   `COMP_CWORD` 整数，当前输入的单词在 `COMP_WORDS` 中的索引；
-   `COMPREPLY` 数组，候选的补全结果；
-   `COMP_LINE` 字符串，当前的命令行输入字符。

通过这些变量，可以在不同的场景下使用；

<br/>

### **其他函数**

另外，在库中还提供了一些常用的函数，在 CentOS 中可以通过 `rpm -ql bash-completion` 命令查看，一般在 `/usr/share/bash-completion/bash_completion` 文件中定义；

例如，如果想补齐文件路径，有如下的两种方式；

```bash
if [[ ${prev} == --*file ]]; then
	COMPREPLY=( $(compgen -f -- ${curr}) )
fi

if [[ ${prev} == --*file ]]; then
	_filedir
fi
```

上述的 `_filedir` 就是 `bash-completion` 提供的，在执行了上述内容之后，可以通过 `declare -f _filedir` 查看该函数的定义；

<br/>

### **多层命令补全**

在上述的示例中，如果多次输入 `<tab>` 会导致重复填充一个字符串，如果一个命令包含了多层的子命令，例如 `git checkout` 后面需要再跟分支等信息，那么可以参考如下示例。

```bash
_foobar_completion()
{
	local curr prev

	COMPREPLY=()
	curr=${COMP_WORDS[COMP_CWORD]}
	prev=${COMP_WORDS[COMP_CWORD-1]}

	opts="hi hello"
	if [[ ${COMP_CWORD} -eq 1 ]]; then
		COMPREPLY=( $(compgen -W "${opts}" -- ${curr}) )
	fi

	case "${prev}" in
		"hi")
			COMPREPLY=( $(compgen -W "world foobar" -- ${curr}) )
			;;
		"hello")
			COMPREPLY=( $(compgen -W "ldrow raboof" -- ${curr}) )
			;;
		*)
			;;
	esac
}
complete -F _foobar_completion foobar
```

<br/>

### **使用bash-completion**

使用complete命令创建的自动补全仅在当前的bash会话中有效，一旦退出当前会话就会失效；

比较好的做法是将自动补全加入`/etc/profile`中，这样每次开启会话后都会读入自动补全配置；

方便起见，我们也可以安装`bash-completion`：

`bash-completion`通过一个复杂的脚本实现可编程的补全程序，减少系统管理员日常维护工作，减少差错，提高工作效率；

使用它，只需要做简单的配置，其他复杂配置都让该软件自己做了；

`bash-completion`在GitHub上的网址：

-   https://github.com/scop/bash-completion

#### **① 安装**

各个平台可以通过包管理器安装bash-completion：

| 操作系统                                                     | 包管理器                                                     | 安装命令                                                     |
| :----------------------------------------------------------- | :----------------------------------------------------------- | :----------------------------------------------------------- |
| [macOS](http://blog.fpliu.com/it/os/macOS)                   | [HomeBrew](http://blog.fpliu.com/it/os/macOS/software/HomeBrew) | `brew install bash-completion`                               |
| [GNU/Linux](http://blog.fpliu.com/it/os/Unix-like/GNU-Linux) | [LinuxBrew](http://blog.fpliu.com/it/software/LinuxBrew)     | `brew install bash-completion`                               |
| [Debian](http://blog.fpliu.com/it/os/Unix-like/GNU-Linux/distribution/Debian-GNU-Linux) | [apt](http://blog.fpliu.com/it/software/apt)                 | `sudo apt-get install -y bash-completion`                    |
| [CentOS](http://blog.fpliu.com/it/os/Unix-like/GNU-Linux/distribution/CentOS) | [yum](http://blog.fpliu.com/it/software/yum)                 | `sudo yum install -y bash-completion`                        |
| [Fedora](http://blog.fpliu.com/it/os/Unix-like/GNU-Linux/distribution/Fedora) / [Mageia](http://blog.fpliu.com/it/os/Unix-like/GNU-Linux/distribution/Mageia) | [dnf](http://blog.fpliu.com/it/software/dnf)                 | `sudo dnf install -y bash-completion`                        |
| [openSUSE](http://blog.fpliu.com/it/os/Unix-like/GNU-Linux/distribution/openSUSE) | [zypper](http://blog.fpliu.com/it/software/zypper)           | `sudo zypper install -y bash-completion`                     |
| [Alpine Linux](http://blog.fpliu.com/it/os/Unix-like/GNU-Linux/distribution/AlpineLinux) | [apk](http://blog.fpliu.com/it/software/apk)                 | `sudo apk add bash-completion`                               |
| [Arch Linux](http://blog.fpliu.com/it/os/Unix-like/GNU-Linux/distribution/ArchLinux) | [pacman](http://blog.fpliu.com/it/software/pacman)           | `sudo pacman -Syyu --noconfirmsudo pacman -S  --noconfirm bash-completion` |

#### **② 配置**

实际上，要想让`bash-completion`起作用，**必须在[bash](http://blog.fpliu.com/it/software/GNU/bash)启动的时候， 加载一段名字为`bash_completion`的[bash](http://blog.fpliu.com/it/software/GNU/bash)脚本！**

不同平台的脚本位置也不同：

-   如果你使用的是[apt-get](http://blog.fpliu.com/it/software/apt/bin/apt-get)或者[yum](http://blog.fpliu.com/it/software/yum)进行安装的， 那么`bash_completion`这个脚本文件的位置在`/usr/local/etc/bash_completion`；
-   如果你使用的是[LinuxBrew](http://blog.fpliu.com/it/software/LinuxBrew)进行安装的， 那么`bash_completion`这个脚本文件的位置在`~/.linuxbrew/etc/bash_completion`；
-   如果你使用的是[HomeBrew](http://blog.fpliu.com/it/os/macOS/software/HomeBrew)进行安装的， 那么`bash-completion`这个脚本文件的位置在`/usr/local/etc/bash_completion`；

最好配置到`/etc/profile`里面， 这样就是全部用户都支持了；如果配置到`~/.bash_profile`里面，就只能当前用户使用；

下面是一个配置示例：

```bash
# Use bash-completion, if available
[[ $PS1 && -f /usr/share/bash-completion/bash_completion ]] && \
    . /usr/share/bash-completion/bash_completion
```

配置的方法很简单，其实就是判断这个文件是否存在，如果存在就使用`.`命令加载这个文件；

>   **需要注意的是`.`命令是[bash](http://blog.fpliu.com/it/software/GNU/bash)特有的命令， 其他的[Shell](http://blog.fpliu.com/it/os/component/Shell)很可能没有这个命令！**

#### **③ 扩展bash-completion**

很多特有命令的自动补全支持不在`bash-completion`内，这时候可以手动添加进去。 比如[git](http://blog.fpliu.com/it/software/git)、[docker](http://blog.fpliu.com/it/software/Docker)等经常使用的命令。

**安装`bash-completion`之后，一般会生成一个`bash_completion.d`的目录， 这个目录下的配置会被`bash_completion`加载，所以不用配置，只是，你需要把自己的配置脚本放到这个目录下！**

`bash_completion.d`这个目录在哪儿呢？可以搜索一下：

```bash
sudo find / -name "bash_completion.d"
```

这样就可以找到了！

##### **1.添加git的自动补全**

```bash
cd /usr/local/etc/bash_completion.d
curl -L -O https://raw.github.com/git/git/master/contrib/completion/git-completion.bash
```

##### **2.添加docker的自动补全**

```bash
cd /usr/local/etc/bash_completion.d
curl -L -O https://raw.githubusercontent.com/docker/compose/$(docker-compose version --short)/contrib/completion/bash/docker-compose
```

>   <font color="#f00">**自动补全会在重启bash后生效！**</font>

<br/>

## 附录

系列文章：

-   [Bash命令自动补全的原理](https://jasonkayzk.github.io/2020/12/06/Bash命令自动补全的原理/)
-   [Bash命令自动补全实战](https://jasonkayzk.github.io/2020/12/07/Bash命令自动补全实战/)

参考文章：

-   https://tuzz.tech/blog/how-bash-completion-works
-   https://tuzz.tech/blog/adding-bash-completion
-   http://blog.fpliu.com/it/software/bash-completion
-   https://dulunar.github.io/2020/07/18/Ubuntu%E4%B8%8B%E5%91%BD%E4%BB%A4TAB%E8%87%AA%E5%8A%A8%E8%A1%A5%E5%85%A8-complete%E4%BD%BF%E7%94%A8/
-   https://www.infoq.cn/article/bash-programmable-completion-tutorial
-   https://gohalo.me/post/bash-auto-completion-introduce.html
-   https://www.huww98.cn/bash-completion

<br/>