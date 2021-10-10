---
title: 在Git项目中增加pre-commit校验
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?22'
date: 2021-10-10 15:50:46
categories: 技术杂谈
tags: [技术杂谈, Git]
description: 有些编程语言提供了代码格式化检查等工具，如：Go、Rust等，我们可以在commit之前，对代码进行格式化检查，保证代码规范，而pre-commit正是这样的工具；
---

有些编程语言提供了代码格式化检查等工具，如：Go、Rust等，我们可以在commit之前，对代码进行格式化检查，保证代码规范，而`pre-commit`正是这样的工具；

<br/>

<!--more-->

# **在Git项目中增加pre-commit校验**

## **pre-commit 概述**

>   `pre-commit`官方网站：
>
>   -   https://pre-commit.com/

`pre-commit`支持的功能有：

-   只需要提供配置文件地址，自动从中央hooks仓库获取脚本（如果有多个项目，就不需要再每个项目都拷贝一份hooks了）；
-   可以定义本地脚本仓库，允许开发人员自定义脚本，且无需修改配置文件：
-   每个阶段允许定义多个脚本：
    -   多个脚本可以使得功能划分而无需整合到一个臃肿的文件中；
-   脚本支持多种语言

>   **需要注意的是：`pre-commit`这个工具不仅仅可以在pre-commit阶段执行，其实可以在git-hooks的任意阶段；**

<br/>

## **安装pre-commit**

### **在系统中安装`pre-commit`**

```bash
brew install pre-commit
# 或者
pip install pre-commit --user

# 查看版本
pre-commit --version
```



### **在项目中安装`pre-commit`**

除了需要在系统中安装`pre-commit`，还需要在Git项目中安装：

```bash
cd <git-repo>
pre-commit install

# 卸载
pre-commit uninstall
```

上面的操作将会在项目的`.git/hooks`下生成一个`pre-commit`文件（覆盖原pre-commit文件），该hook会根据项目根目录下的`.pre-commit-config.yaml `执行任务；

>   **如果`vim .git/hooks/pre-commit`可以看到代码的实现，基本逻辑是利用`pre-commit`文件去拓展更多的pre-commit；**

安装/卸载其他阶段的hook：

```bash
pre-commit install
pre-commit uninstall
-t {pre-commit,pre-merge-commit,pre-push,prepare-commit-msg,commit-msg,post-checkout,post-commit,post-merge}
--hook-type {pre-commit,pre-merge-commit,pre-push,prepare-commit-msg,commit-msg,post-checkout,post-commit,post-merge}

# 如 pre-commit install --hook-type prepare-commit-msg
```



### **常用指令**

```bash
# 手动对所有的文件执行hooks，新增hook的时候可以执行，使得代码均符合规范。直接执行该指令则无需等到pre-commit阶段再触发hooks
pre-commit run --all-files

# 执行特定hooks
pre-commit run <hook_id>

# 将所有的hook更新到最新的版本/tag
pre-commit autoupdate

# 指定更新repo
pre-commit autoupdate --repo https://github.com/DoneSpeak/gromithooks
```

更多指令及指令参数请直接访问pre-commit官方网站；

<br/>

## **添加第三方hooks**

在Git仓库初始化`pre-commit`：

```bash
cd <git-repo>
pre-commit install
touch .pre-commit-config.yaml
```

如下为一个基本的配置样例：

.pre-commit-config.yaml

```yaml
# 该config文件为该项目的pre-commit的配置文件，用于指定该项目可以执行的git hooks

# 这是pre-commit的全局配置之一，fail_fast：遇到错误不会向下执行直接退出
fail_fast: false 

repos:
# hook所在的仓库
- repo: https://github.com/pre-commit/pre-commit-hooks
  # 仓库的版本，可以直接用tag或者分支，但分支是容易发生变化的
  # 如果使用分支，则会在第一次安装之后不自动更新
  # 通过 `pre-commit autoupdate`指令可以将tag更新到默认分支的最新tag
  rev: v4.0.1
  # 仓库中的hook id
  hooks:
  # 定义的hook脚本，在repo的.pre-commit-hooks.yaml中定义
  - id: check-added-large-files
  # 移除尾部空格符
  - id: trailing-whitespace
    # 传入参数，不处理makedown
    args: [--markdown-linebreak-ext=md]
  # 检查是否含有合并冲突符号
  - id: check-merge-conflict
  
- repo: https://github.com/macisamuele/language-formatters-pre-commit-hooks
  rev: v2.0.0
  hooks:
  - id: pretty-format-yaml
    # https://github.com/macisamuele/language-formatters-pre-commit-hooks/blob/v2.0.0/language_formatters_pre_commit_hooks/pretty_format_yaml.py
    # hook脚本需要的参数，可以在该hook脚本文件中看到
    args: [--autofix, --indent, '2']
```

上面我们引入了两个配置：

-   https://github.com/pre-commit/pre-commit-hooks
-   https://github.com/macisamuele/language-formatters-pre-commit-hooks

在`run`之后，`pre-commit`会下载指定仓库代码，并安装配置所需要的运行环境；

配置完成之后可以通过`pre-commit run --all-files`运行一下添加的hooks；

下表为`.pre-commit-hooks.yaml`可选配置项：

| key word                     | description                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| `id`                         | the id of the hook - used in pre-commit-config.yaml.         |
| `name`                       | the name of the hook - shown during hook execution.          |
| `entry`                      | the entry point - the executable to run. `entry` can also contain arguments that will not be overridden such as `entry: autopep8 -i`. |
| `language`                   | the language of the hook - tells pre-commit how to install the hook. |
| `files`                      | (optional: default `''`) the pattern of files to run on.     |
| `exclude`                    | (optional: default `^$`) exclude files that were matched by `files` |
| `types`                      | (optional: default `[file]`) list of file types to run on (AND). See [Filtering files with types](https://link.segmentfault.com/?enc=hHlrnN%2BTh2KiT3ZIi%2BaBvg%3D%3D.H27MK4zaK53npMDCPzrJU2AgnJXHXn9mdUDOzALELAvfIkqsJVtspeYAk00me1fXw3HOsLoPKQsnRoaZ%2BOGP0g%3D%3D). |
| `types_or`                   | (optional: default `[]`) list of file types to run on (OR). See [Filtering files with types](https://link.segmentfault.com/?enc=5PKCf6C29VA00f0yZj%2BgNQ%3D%3D.wId2CZ4fQju9G%2BYowPgAelG9Ji4ncJng9LRHE3uNVuswXVM4Lg7ihaANnj0%2Fo5OI9bVFBSu%2BDlyVZ645mhotfA%3D%3D). *new in 2.9.0*. |
| `exclude_types`              | (optional: default `[]`) the pattern of files to exclude.    |
| `always_run`                 | (optional: default `false`) if `true` this hook will run even if there are no matching files. |
| `verbose`                    | (optional) if `true`, forces the output of the hook to be printed even when the hook passes. *new in 1.6.0*. |
| `pass_filenames`             | (optional: default `true`) if `false` no filenames will be passed to the hook. |
| `require_serial`             | (optional: default `false`) if `true` this hook will execute using a single process instead of in parallel. *new in 1.13.0*. |
| `description`                | (optional: default `''`) description of the hook. used for metadata purposes only. |
| `language_version`           | (optional: default `default`) see [Overriding language version](https://link.segmentfault.com/?enc=vRu6ytkxK%2B56J5QlEkJsOA%3D%3D.ANOtOYU%2B7KQxSjs2gUJfU1HfNVWsoIGk3Un2lKobPE%2FcrtcwxHIT8Vky66Zbep1SDnIjhssvtaWE%2FzOfTpfEQw%3D%3D). |
| `minimum_pre_commit_version` | (optional: default `'0'`) allows one to indicate a minimum compatible pre-commit version. |
| `args`                       | (optional: default `[]`) list of additional parameters to pass to the hook. |
| `stages`                     | (optional: default (all stages)) confines the hook to the `commit`, `merge-commit`, `push`, `prepare-commit-msg`, `commit-msg`, `post-checkout`, `post-commit`, `post-merge`, or `manual` stage. See [Confining hooks to run at certain stages](https://link.segmentfault.com/?enc=TcQIRjRamLP2RRuc2nxFpw%3D%3D.9agCI5Q%2FVR2H2CyQdcOhJediQPO9oPhyV7hSV6B9rCMlL5Ict0ZwhJlfRWvbu1gD0gFdHirQX3RQIMbgpAvGeZyMge7Xy%2BKso1cntyJsXGo%3D). |

>   **关于开发hooks仓库：**
>
>   -   [开发hooks仓库](https://segmentfault.com/a/1190000040288064#:~:text=at%20certain%20stages.-,%E5%BC%80%E5%8F%91hooks%E4%BB%93%E5%BA%93,-%E4%B8%8A%E9%9D%A2%E5%B7%B2%E7%BB%8F%E8%AE%B2%E8%A7%A3)

<br/>

## **本地hooks**

pre-commit 也提供了`local`的hook，允许在`entry`中配置执行指令或指向本地一个可执行的脚本文件，使用起来和`husky`类似；

-   脚本与代码仓库紧密耦合，并且与代码仓库一起分发；
-   Hooks需要的状态只存在于代码仓库的build artifact中(比如应用程序的pylint的virtualenv)；
-   linter的官方代码仓库没有提供pre-commit metadata；

local hooks可以使用支持`additional_dependencies` 的语言或者 `docker_image` / `fail` / `pygrep` / `script` / `system`；

>   **在使用时，需要定义`repo: local`，即：本地仓库；**

例如：

```yaml
# 定义repo为local，表示该repo为本地仓库
- repo: local
  hooks:
  - id: pylint
    name: pylint
    entry: pylint
    language: system
    types: [python]
  - id: changelogs-rst
    name: changelogs must be rst
    entry: changelog filenames must end in .rst
    language: fail # fail 是一种用于通过文件名禁止文件的轻语言
    files: 'changelog/.*(?<!\.rst)$'
```

上面给hooks定义了两个步骤：

-   pylint
-   changelogs-rst

<br/>

## **一个Rust项目的配置例子**

https://github.com/JasonkayZK/rust-learn/blob/main/.pre-commit-config.yaml

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.0.1
    hooks:
      - id: check-merge-conflict
      - id: check-toml
      - id: check-yaml
      - id: end-of-file-fixer
      - id: trailing-whitespace
        args: [ --markdown-linebreak-ext=md ]

  - repo: local
    hooks:
      - id: cargo-fmt
        name: cargo fmt
        entry: cargo fmt --
        language: rust
        types: [ rust ]
```

<br/>

# **附录**

文章参考：

-   [Continuous Integration with Github Actions and Rust](https://www.homeops.dev/continuous-integration-with-github-actions-and-rust/)
-   [在Git项目中使用pre-commit统一管理hooks](https://segmentfault.com/a/1190000040288064)

