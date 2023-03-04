---
title: 安装和配置rbenv与Ruby
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?1'
date: 2023-03-04 16:21:16
categories: Ruby
tags: [Ruby, 软件安装与配置]
description: 本文介绍了如何安装和配置rbenv和Ruby；
---

本文介绍了如何安装和配置rbenv和Ruby；

源代码：

-   https://github.com/JasonkayZK/ruby-learn

<br/>

<!--more-->

# **安装和配置rbenv与Ruby**

## **安装rbenv**

rbenv 用来管理多个版本的 ruby 在用户目录的安装和使用，和 rvm 二选一使用；

本文介绍了 rbenv 的安装和使用，官方文档：

-   https://github.com/rbenv/rbenv

安装过程如下：

```bash
mkdir -p ~/.rbenv

# 安装Ruby
git clone https://github.com/rbenv/rbenv.git ~/.rbenv
# 用来编译安装 ruby
git clone https://github.com/rbenv/ruby-build.git ~/.rbenv/plugins/ruby-build
# 通过 rbenv update 命令来更新 rbenv 以及所有插件, 推荐
git clone git://github.com/rkh/rbenv-update.git ~/.rbenv/plugins/rbenv-update
# 使用 Ruby China 的镜像安装 Ruby, 国内用户推荐
git clone git://github.com/AndorChen/rbenv-china-mirror.git ~/.rbenv/plugins/rbenv-china-mirror
```

>   **需要注意的是：**
>
>   **`ruby-build` 是必须要安装的（我在没安装之前安装一些其他版本的 Ruby 会报错！）**

然后把下面的代码放到 `~/.bashrc` 里：

```bash
export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init -)"
export RUBY_BUILD_MIRROR_URL=https://cache.ruby-china.com
```

>   **Mac 为 `~/.bash_profile` 或者 `~/.zshrc`；**

然后重开一个终端就可以执行 rbenv 了；

<br/>

## **rbenv使用**

### **安装 Ruby**

```bash
rbenv install --list  # 列出所有可安装的 ruby 版本
rbenv install 1.9.3-p392     # 安装 1.9.3-p392
rbenv install jruby-1.7.3    # 安装 jruby-1.7.3
```

>   **这里需要注意的是：**
>
>   安装某些版本的Ruby时可能会报错，报错会有具体的提示，例如：
>
>   ```
>   /usr/local/rvm/rubies/ruby-1.9.3-p194/lib/ruby/1.9.1/yaml.rb:56:in `<top (required)>':
>   It seems your ruby installation is missing psych (for YAML output).
>   To eliminate this warning, please install libyaml and reinstall your ruby.
>   ```
>
>   **通过安装 `libyaml` 可以解决该问题**；以下是最受欢迎发行版的相应软件包：
>
>   -   **Fedora `libyaml`**
>   -   **Ubuntu和其他基于Debian的 `libyaml-dev`**
>   -   **其他一些像CentOS `libyaml-devel`**
>
>   并且还应安装以下组件，以避免将来出现类似问题：
>
>   ```bash
>   ruby-devel libxml2 libxml2-devel libxslt libxslt-devel
>   ```



### **列出版本**

```bash
rbenv versions               # 列出安装的版本
rbenv version                # 列出正在使用的版本
```



### **设置版本**

```bash
rbenv global 1.9.3-p392      # 全局默认使用 1.9.3-p392
rbenv shell 1.9.3-p392       # 当前的 shell 使用 1.9.3-p392, 会设置一个 `RBENV_VERSION` 环境变量
rbenv local jruby-1.7.3      # 当前目录使用 jruby-1.7.3, 会生成一个 `.rbenv-version` 文件
```



### **其他**

```bash
rbenv rehash                 # 每当切换 ruby 版本和执行 bundle install 之后必须执行这个命令
rbenv which irb              # 列出 irb 这个命令的完整路径
rbenv whence irb             # 列出包含 irb 这个命令的版本
```

<br/>

## **通过rbenv安装Ruby**

查看可安装的 Ruby 版本：

```bash
$ rbenv install -l

2.7.7
3.0.5
3.1.3
3.2.0
jruby-9.4.0.0
mruby-3.1.0
picoruby-3.0.0
truffleruby-22.3.1
truffleruby+graalvm-22.3.1
```

安装某个版本：

```bash
$ rbenv install 3.2.1
```

设置 Ruby 版本：

```bash
$ rbenv global 3.2.1
```

查看：

```bash
$ ruby -v
ruby 3.2.1 (2023-02-08 revision 31819e82c8) [x86_64-linux]
```

<br/>

## **配置和使用Gem**

Gem 用来管理 Ruby 的库；

通常情况下，当安装一个 gem 库时，会生成他的文档，非常耗时；

添加下面的配置来避免：

```bash
$ echo "gem: --no-document" > ~/.gemrc
```

[Bundler](https://bundler.io/) 用来管理项目的依赖库，安装 bundler：

```bash
$ gem install bundler

Successfully installed bundler-2.4.7
1 gem installed
```

可以使用 `gem env` 来查看环境变量：

```bash
$ gem env
RubyGems Environment:
  - RUBYGEMS VERSION: 3.4.6
  - RUBY VERSION: 3.2.1 (2023-02-08 patchlevel 31) [x86_64-linux]
...

$ gem env home
/home/zk/.rbenv/versions/3.2.1/lib/ruby/gems/3.2.0
```

<br/>

## **安装Rails**

直接使用 gem 安装 Rails：

```bash
$ gem install rails -v 7.0.4

...
Successfully installed rails-7.0.4
35 gems installed
```

>   查找版本：
>
>   ```bash
>   gem search '^rails$' --all
>   ```
>
>   安装最新版：
>
>   ```bash
>   gem install rails
>   ```

安装完成后执行：

```bash
$ rbenv rehash
```

这是由于：

**rbenv 通过创建一个 `shim`（中间层） 目录来工作，该目录指向当前启用的 Ruby 版本所使用的文件；**

**通过执行 `rehash` 子命令，可以确保每一次已安装的 Ruby 版本中在 rbenv 目录 shim 能匹配正确的 Ruby 命令；**

<red>**因此，每次你安装了新的 Ruby 版本或者提供命令行命令的 Gem（比如 Rails），都应当执行 `rbenv rehash`！**</font>

```
rbenv works by creating a directory of shims, which point to the files used by the Ruby version that’s currently enabled. Through the rehash sub-command, rbenv maintains shims in that directory to match every Ruby command across every installed version of Ruby on your server. Whenever you install a new version of Ruby or a gem that provides commands as Rails does, you should run the following:

$ rbenv rehash
```

验证 Rails 安装：

```bash
$ rails -v

Rails 7.0.4
```

<br/>

## **更新 rbenv**

直接执行命令：

```bash
cd ~/.rbenv
git pull
```

即可！

<br/>

## **卸载 Ruby 或 rbenv**

卸载 Ruby 版本：

```bash
rbenv uninstall 3.2.1
```

<br/>

卸载 rbenv：

首先，删除配置中的下面两行：

```bash
export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init -)"
```

删除 rbenv：

```bash
 rm -rf `rbenv root`
```

<br/>

# **附录 rm -rf `rbenv root`**

源代码：

-   https://github.com/JasonkayZK/ruby-learn

参考文章：

-   https://github.com/rbenv/rbenv
-   https://www.digitalocean.com/community/tutorials/how-to-install-ruby-on-rails-with-rbenv-on-ubuntu-22-04
-   https://ruby-china.org/wiki/rbenv-guide
-   https://www.codenong.com/12882190/


<br/>
