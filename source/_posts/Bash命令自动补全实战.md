---
title: Bash命令自动补全实战
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?123'
date: 2020-12-07 11:29:21
categories: Linux
tags: [Linux, 技术杂谈, Bash]
description: 在上一篇文章《Bash命令自动补全的原理》中我们介绍了自动补全的原理，并介绍了bash-completion工具的安装和使用；接上篇，我们来看看如何编写一个简单的命令自动补全脚本；
---

在上一篇文章[《Bash命令自动补全的原理》](https://jasonkayzk.github.io/2020/12/06/Bash命令自动补全的原理/)中我们介绍了自动补全的原理，并介绍了bash-completion工具的安装和使用；

接上篇，我们来看看如何编写一个简单的命令自动补全脚本；

系列文章：

-   [Bash命令自动补全的原理](https://jasonkayzk.github.io/2020/12/06/Bash命令自动补全的原理/)
-   [Bash命令自动补全实战](https://jasonkayzk.github.io/2020/12/07/Bash命令自动补全实战/)

<br/>

<!--more-->

## **Bash命令自动补全实战**

### **实验概述**

为了展示代码补全，我们首先编写一个简单的脚本命令：`dothis`：

该脚本接受一个参数，表示用户执行历史(`history`)中的序号，并执行序号对应的历史命令；

例如，以下命令将会执行用户历史命令中序号为 235 的命令：

```bash
dothis 235
```

随后，我们将创建一个 bash 自动补全脚本，用以展示用户历史命令信息，并和**dothis**命令“绑定”起来；

如下：

```bash
$ dothis <tab><tab>
215 ls
216 ls -la
217 cd ~
218 man history
219 git status
220 history | cut -c 8-
```

<br/>

### **前期准备**

首先我们编写dothis命令；

在工作目录中创建名为**dothis**的文件，并添加以下代码：

```sh
$ vim dothis

# 添加如下代码
if [ -z "$1" ]; then
  echo "No command number passed"
  exit 2
fi

exists=$(fc -l -1000 | grep ^$1 -- 2>/dev/null)

if [ -n "$exists" ]; then
  fc -s -- "$1"
else
  echo "Command with number $1 was not found in recent history"
  exit 2
fi
```

脚本首先检查调用时是否跟随这一个参数；

检查输入的数字是否在最近 1000 个命令中：

-   如果存在则使用`fc`命令执行对应的命令；
-   如果不存在则显示错误信息；

随后，使用以下命令给脚本添加可执行权限：

```bash
chmod +x ./dothis
```

>   为了方便测试，可以将dothis放在PATH变量的路径下；

最后测试一下：

```bash
$ dothis
No command number passed
```

成功！

<br/>

### **创建自动补全脚本**

创建一个名为**dothis-completion.bash**的文件，为了方便描述，从现在开始称该文件为自动补全脚本；

>   **为了让脚本立即生效，每次修改自动补全脚本文件后都要手动source一下！**

#### **① 静态补全**

假设dothis命令支持一系列子命令，例如：

-   now
-   tomorrow
-   never

我们可以使用 bash 内置的**complete**命令来注册这个补全列表。

用专业术语来说，我们通过**complete**命令为我们的dothis应用定义了一个补全规范（completion specification，或compspec）；

将以下内容添加到自动补全脚本中：

```bash
#/usr/bin/env bash
complete -W "now tomorrow never" dothisba
```

上述内容使用 complete 命令：

-   通过 **-W 参数提供了补全词列表**；
-   指定该补全词列表适用的应用程序（这里作为**dothis**命令参数）；

source该文件：

```bash
source ./dothis-completion.bash
```

现在让我们尝试在命令行中敲击两次 tab 键：

```bash
$ dothis <tab><tab>
never     now       tomorrow
```

再来试下输入字母 n 之后的效果：

```bash
$ dothis n<tab><tab>
never now
```

补全列表自动过滤出了只以字母 n 开头的选项！

>   **注意：**
>
>   补全参数列表显示的顺序和我们在补全脚本中定义的顺序不同，它们会以编码的字典顺序自动排序；

除了这里使用的**-W**参数之外，**command**命令还有许多其他参数；

其中大部分参数都以固定的方式生成补全列表，这意味着我们无法动态干预过滤它们的输出结果；

例如，如果我们想将当前目录下的子目录名作为**dothis**应用程序的补全列表，可以将**complete**命令做如下修改：

```bash
complete -A directory dothis
```

此时，在 dothis 命令之后敲 tab 键，我们可以获取当前目录下子目录的列表：

```bash
$ dothis <tab><tab>
dir1/ dir2/ dir3/
```

>   更多关于**complete**命令的参数参见：
>
>   -   [Bash命令自动补全的原理](https://jasonkayzk.github.io/2020/12/06/Bash命令自动补全的原理/)
>   -   [Programmable-Completion-Builtins](https://www.gnu.org/software/bash/manual/html_node/Programmable-Completion-Builtins.html#Programmable-Completion-Builtins)；

#### **② 动态补全**

本小节中，我们将实现带有以下逻辑的**dothis**命令的自动补全：

-   如果用户在命令后面直接按 tab 键，将显示用户执行历史中的最近 50 个命令；
-   如果用户在输入一个能够从执行历史中匹配到多个命令的数字后按 tab 键，将显示这些命令以及它们的序号；
-   如果用户在输入一个从执行历史中只能匹配到一个命令的数字后按 tab 键，将自动补全这个数字，但不显示命令内容；

让我们从定义一个每次**dothis**命令补全时都会调用的函数`_dothis_completions`：

```bash
#/usr/bin/env bash
_dothis_completions()
{
  COMPREPLY+=("now")
  COMPREPLY+=("tomorrow")
  COMPREPLY+=("never")
}
 
complete -F _dothis_completions dothis
```

>   对该脚本的一些说明：
>
>   -   我们使用**complete**命令的**-F**参数定义**_dothis_completions**函数为 dothis 命令提供补全功能；
>   -   **COMPREPLY 是一个存储补全列表的数组，自动补全机制使用该变量来显示补全内容；**

现在让我们重新 source 下补全脚本，验证下补全功能：

```bash
$ dothis <tab><tab>
never now tomorrow
```

是可以自动补全的，补全脚本能够输出和之前一样的补全词列表。

再来试下：

```bash
$ dothis nev<tab><tab>
never     now       tomorrow
```

<font color="#f00">**我们可以看到，虽然我们在输入了nev字母后再触发了自动补全，显示的补全列表之前的一样并没有做自动过滤！**</font>

这是为什么呢？

-   <font color="#f00">**COMPREPLY变量的内容总是会显示，补全函数需要自己处理其中的内容；**</font>
-   <font color="#f00">**如果COMPREPLY变量中只有一个元素，那么这个词会自动补全到命令之后**</font>（由于目前的实现总是返回相同的三个词，不会触发这个功能）；

我们可以使用**compgen**命令：

它是一个用于生成补全列表的内置命令，支持**complete**命令的大部分参数（例如**-W**参数指定补全词列表，**-d**参数补全目录），并能够基于用户已经输入的内容进行过滤；

下面通过一些命令及其输出来展示它的使用：

```bash
$ compgen -W "now tomorrow never"
now
tomorrow
never
$ compgen -W "now tomorrow never" n
now
never
$ compgen -W "now tomorrow never" t
tomorrow
```

通过这些示例，详细你已经可以简单使用该命令了；不过在此之前，还需要了解为**dothis**命令获取已经输入的内容；

bash 自动补全功能提供了相关[变量](https://www.gnu.org/software/bash/manual/html_node/Bash-Variables.html#Bash-Variables)以支撑这个自动补全，下面是一些比较重要的变量：

-   **COMP_WORDS**：当前命令行中已经输入的词数组；
-   **COMP_CWORD**：当前光标所处词位于**COMP_WORDS**数组中的索引值；即，当按下 tab 键时光标所处词的索引；
-   **COMP_LINE**：当前命令行；

为了获取**dothis**命令后面的词，我们可以使用**COMP_WORDS[1]**的值；

再次修改自动补全脚本：

```bash
#/usr/bin/env bash
_dothis_completions()
{
  COMPREPLY=($(compgen -W "now tomorrow never" "${COMP_WORDS[1]}"))
}

complete -F _dothis_completions dothis
```

source 该文件，并查看效果：

```bash
$ dothis
never     now       tomorrow  
$ dothis n
never  now
```

现在，让我们抛开now、never、tomorrow这些词，从命令执行历史中抓取真实的数字；

>   **补充：**
>
>   **fc -l**命令后面增加一个负数 -n 可以显示最近执行过的 n 条命令；
>
>   因此我们将会使用：
>
>   ```bash
>   fc -l -50
>   ```
>
>   命令来显示执行历史中的最近 50 条命令以及它们的序号；
>
>   这里我们唯一需要处理的就是将原始命令输出的制表符替换成空格，以便于更好的展示，使用**sed**命令即可；

将自动补全脚本做如下改动：

```bash
#/usr/bin/env bash
_dothis_completions()
{
  COMPREPLY=($(compgen -W "$(fc -l -50 | sed 's/\t//')" -- "${COMP_WORDS[1]}"))
}

complete -F _dothis_completions dothis
```

在控制台中 source 该脚本并验证：

```bash
$ dothis <tab><tab>
632 source dothis-completion.bash   649 source dothis-completion.bash   666 cat ~/.bash_profile
633 clear                           650 clear                           667 cat ~/.bashrc
634 source dothis-completion.bash   651 source dothis-completion.bash   668 clear
635 source dothis-completion.bash   652 source dothis-completion.bash   669 install ./dothis ~/bin/dothis
636 clear                           653 source dothis-completion.bash   670 dothis
637 source dothis-completion.bash   654 clear                           671 dothis 6546545646
638 clear                           655 dothis 654                      672 clear
639 source dothis-completion.bash   656 dothis 631                      673 dothis
640 source dothis-completion.bash   657 dothis 150                      674 dothis 651
641 source dothis-completion.bash   658 dothis                          675 source dothis-completion.bash
642 clear                           659 clear                           676 dothis 651
643 dothis 623  ls -la              660 dothis                          677 dothis 659
644 clear                           661 install ./dothis ~/bin/dothis   678 clear
645 source dothis-completion.bash   662 dothis                          679 dothis 665
646 clear                           663 install ./dothis ~/bin/dothis   680 clear
647 source dothis-completion.bash   664 dothis                          681 clear
648 clear                           665 cat ~/.bashrc
```

效果不错；

但是还存在一个问题，当我们输入一个数字之后再按 tab 键，会出现：

```bash
$ dothis 623<tab>
$ dothis 623  ls 623  ls -la
...
$ dothis 623  ls 623  ls 623  ls 623  ls 623  ls -la
```

出现这个问题是因为在自动补全脚本中，我们使用了**${COMP_WORDS[1]}**来获取**dothis**命令之后的第一个词（在上述代码片段中为 623）；

因此当 tab 键按下时，相同的自动补全列表会一再出现；

要修复这个问题，我们将在已经输入了至少一个参数之后，不再允许继续进行自动补全，因此需要在函数中增加对**COMP_WORDS**数组大小的前置判断：

```bash
#/usr/bin/env bash
_dothis_completions()
{
  if [ "${#COMP_WORDS[@]}" != "2" ]; then
    return
  fi

  COMPREPLY=($(compgen -W "$(fc -l -50 | sed 's/\t//')" -- "${COMP_WORDS[1]}"))
}

complete -F _dothis_completions dothis
```

source 脚本并重试：

```bash
$ dothis 623<tab>
$ dothis 623 ls -la<tab> # 成功：此时没有触发自动补全
```

当前脚本还有一个不尽如人意的地方；

我们希望展示历史记录序号给用户的同时展示对应的命令，以帮助用户决定选择哪个历史命令；但是当补全建议中有且只有一个时候，应该能够通过自动补全机制自动选择，而**不要追加命令文本**；

因为**dothis**命令实际只接受一个表示执行历史序号的参数，并且没有对多余参数进行校验；当我们的自动补全函数计算出只有一个结果时，应该去除序号后面的命令文本，只返回命令序号；

为了实现这个功能，我们需要将**compgen**命令的返回值保存到数组变量中，并且检查当其大小，当大小为 1 时，去除这个唯一的值数字后面跟随的文本；否则直接返回这个数组；

将自动补全脚本修改成：

```bash
#/usr/bin/env bash
_dothis_completions()
{
  if [ "${#COMP_WORDS[@]}" != "2" ]; then
    return
  fi

  # keep the suggestions in a local variable
  local suggestions=($(compgen -W "$(fc -l -50 | sed 's/\t/ /')" -- "${COMP_WORDS[1]}"))

  if [ "${#suggestions[@]}" == "1" ]; then
    # if there's only one match, we remove the command literal
    # to proceed with the automatic completion of the number
    local number=$(echo ${suggestions[0]/%\ */})
    COMPREPLY=("$number")
  else
    # more than one suggestions resolved,
    # respond with the suggestions intact
    COMPREPLY=("${suggestions[@]}")
  fi
}

complete -F _dothis_completions dothis
```

<br/>

### **注册自动补全脚本**

如果我们希望将自动补全脚本应用到个人账户，可以在 `~/.bashrc` 文件中 source 这个脚本：

```bash
source <path-to-your-script>/dothis-completion.bash
```

如果我们需要为机器上的所有用户启动这个自动补全脚本可以将该脚本复制到**/etc/bash_completion.d/**目录中，这样 bash 会自动加载；

<br/>

### **最后调优**

为了有更好的展示效果，额外增加几个步骤：

#### **① 在新行中展示每个条目**

为了更好的展示效果，我们可以将每一个补全项换行显示；

这个方案实现起来并没有那么方便，因为我们无法简单的通过在每个**COMPREPLY**项后追加换行符来实现；

为了实现这个功能，这里采用了[ hach 的方式](https://unix.stackexchange.com/questions/166908/is-there-anyway-to-get-compreply-to-be-output-as-a-vertical-list-of-words-instea)将补全建议文本填充到控制台的宽度（通过**printf**命令可以实现将字符串填充到指定长度）；

将自动补全脚本做如下修改：

```bash
#/usr/bin/env bash
_dothis_completions()
{
  if [ "${#COMP_WORDS[@]}" != "2" ]; then
    return
  fi

  local IFS=$'\n'
  local suggestions=($(compgen -W "$(fc -l -50 | sed 's/\t//')" -- "${COMP_WORDS[1]}"))

  if [ "${#suggestions[@]}" == "1" ]; then
    local number="${suggestions[0]/%\ */}"
    COMPREPLY=("$number")
  else
    for i in "${!suggestions[@]}"; do
      suggestions[$i]="$(printf '%*s' "-$COLUMNS"  "${suggestions[$i]}")"
    done

    COMPREPLY=("${suggestions[@]}")
  fi
}

complete -F _dothis_completions dothis
```

source 并验证：

```bash
dothis <tab><tab>
...
499 source dothis-completion.bash                   
500 clear
...       
503 dothis 500
```

#### **② 自定义选择历史条目数**

在之前的自动补全脚本中，将补全项数量写死了最后 50 个执行历史，这在实际使用中不太友好；

我们应该让每个用户能够自己选择，如果他们没有选择，再使用默认值 50；

为了实现这个功能，我们将检查是否设置了环境变量`DOTHIS_COMPLETION_COMMANDS_NUMBER`；

最后一次修改自动补全脚本：

```bash
#/usr/bin/env bash
_dothis_completions()
{
  if [ "${#COMP_WORDS[@]}" != "2" ]; then
    return
  fi

  local commands_number=${DOTHIS_COMPLETION_COMMANDS_NUMBER:-50}
  local IFS=$'\n'
  local suggestions=($(compgen -W "$(fc -l -$commands_number | sed 's/\t//')" -- "${COMP_WORDS[1]}"))

  if [ "${#suggestions[@]}" == "1" ]; then
    local number="${suggestions[0]/%\ */}"
    COMPREPLY=("$number")
  else
    for i in "${!suggestions[@]}"; do
      suggestions[$i]="$(printf '%*s' "-$COLUMNS"  "${suggestions[$i]}")"
    done

    COMPREPLY=("${suggestions[@]}")
  fi
}

complete -F _dothis_completions dothis
```

source 并验证：

```bash
export DOTHIS_COMPLETION_COMMANDS_NUMBER=5
$ dothis <tab><tab>
505 clear
506 source ./dothis-completion.bash
507 dothis clear
508 clear
509 export DOTHIS_COMPLETION_COMMANDS_NUMBER=5
```

<br/>

## 附录

系列文章：

-   [Bash命令自动补全的原理](https://jasonkayzk.github.io/2020/12/06/Bash命令自动补全的原理/)
-   [Bash命令自动补全实战](https://jasonkayzk.github.io/2020/12/07/Bash命令自动补全实战/)

参考文章：

-   [Creating a bash completion script](https://iridakos.com/programming/2018/03/01/bash-programmable-completion-tutorial)

<br/>