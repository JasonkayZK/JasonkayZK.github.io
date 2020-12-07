---
title: Github Actions总结
cover: 'https://acg.yanwz.cn/api.php?86'
date: 2020-08-28 16:00:13
categories: [Github]
tags: [技术杂谈, Github]
toc: true
description: GitHub Actions是 GitHub 的持续集成服务,于2018年10月推出。
---

[GitHub Actions](https://github.com/features/actions) 是 GitHub 的[持续集成服务](http://www.ruanyifeng.com/blog/2015/09/continuous-integration.html)，于2018年10月[推出](https://github.blog/changelog/2018-10-16-github-actions-limited-beta/)。

<!--more-->

<!-- **目录:** -->

<!-- toc -->

<!-- <br/> -->

## Github Actions总结

### Github Action VS Travis CI

在`github`推出`action`之前，[Travis CI](https://travis-ci.org/)是一个很好对Github中仓库做自动化的一个工具，其语法也很简单，功能强大，深受用户的青睐。那么`action`出来后，势必会和`travis`对比。

在笔者的实际体验中，觉得`action`比较吸引我的点：

-   支持私有仓库
-   `action`对`github`各个事件的支持更为全面，如果`release`，`pull-request`，`issue`事件等等
-   `github`对`action`编写的支持更为友好，包括在线编辑器和`marketplace`的共享actions

<br/>

### GitHub Actions 是什么？

大家知道，持续集成由很多操作组成，比如抓取代码、运行测试、登录远程服务器，发布到第三方服务等等。

GitHub 把这些操作就称为 actions。

很多操作在不同项目里面是类似的，完全可以共享。GitHub 注意到了这一点，想出了一个很妙的点子，允许开发者把每个操作写成独立的脚本文件，存放到代码仓库，使得其他开发者可以引用。

**如果你需要某个 action，不必自己写复杂的脚本，直接引用他人写好的 action 即可，整个持续集成过程，就变成了一个 actions 的组合。**

这就是 GitHub Actions 最特别的地方。

GitHub 做了一个[官方市场](https://github.com/marketplace?type=actions)，可以搜索到他人提交的 actions。另外，还有一个 [awesome actions](https://github.com/sdras/awesome-actions) 的仓库，也可以找到不少 action。

![Github Action](https://www.wangbase.com/blogimg/asset/201909/bg2019091105.jpg)

上面说了，**每个 action 就是一个独立脚本**，因此可以做成代码仓库，**使用`userName/repoName`的语法引用 action。**

比如，`actions/setup-node`就表示`github.com/actions/setup-node`这个[仓库](https://github.com/actions/setup-node)，它代表一个 action，作用是安装 Node.js。事实上，GitHub 官方的 actions 都放在 [github.com/actions](https://github.com/actions) 里面。

既然 actions 是代码仓库，当然就有版本的概念，用户可以引用某个具体版本的 action。下面都是合法的 action 引用，用的就是 Git 的指针概念，详见[官方文档](https://help.github.com/en/articles/about-actions#versioning-your-action)。

```
actions/setup-node@74bc508 # 指向一个 commit
actions/setup-node@v1.0    # 指向一个标签
actions/setup-node@master  # 指向一个分支
```

<br/>

### 基本概念

GitHub Actions 有一些自己的术语。

（1）**workflow** （工作流程）：持续集成一次运行的过程，就是一个 workflow。

（2）**job** （任务）：一个 workflow 由一个或多个 jobs 构成，含义是一次持续集成的运行，可以完成多个任务。

（3）**step**（步骤）：每个 job 由多个 step 构成，一步步完成。

（4）**action** （动作）：每个 step 可以依次执行一个或多个命令（action）。

<br/>

### 为项目创建Action

如果想在仓库中开始`action`, 可以手动在**仓库的根目录下新建`.github/workflows`文件夹，然后新建任意以`.yml`或者`.yaml`结尾的多个文件，这些文件都是`action`的配置文件，相当于travis中的`.travis.yml`**

启动`action`也可以通过`github`仓库界面创建（后续查看`action`记录也是在这），点击`Actions`选项；

点击后会进入以下界面，此时我们可以直接使用官方的一些预设的模块，或者使用空模板：

![Action2](https://user-gold-cdn.xitu.io/2020/3/9/170beafb84f175a4?imageView2/0/w/1280/h/960/ignore-error/1)

下图就是`github`官方提供的`action`编辑器，能提供简单的语法提示和错误检测；右边可以直接搜索`Marketplace`里面的一下`action`使用，也可以通过`Documentation`查看文档。

![](https://user-gold-cdn.xitu.io/2020/3/9/170beb25f3b5af7a?imageView2/0/w/1280/h/960/ignore-error/1)

<br/>

### workflow 文件

<font color="#f00">**GitHub Actions 的配置文件叫做 workflow 文件，存放在代码仓库的`.github/workflows`目录。**</font>

workflow 文件**采用 [YAML 格式](http://www.ruanyifeng.com/blog/2016/07/yaml.html)**，文件名可以任意取，但是后缀名统一为`.yml`，比如`foo.yml`。

<font color="#f00">**一个库可以有多个 workflow 文件。GitHub 只要发现`.github/workflows`目录里面有`.yml`文件，就会自动运行该文件。**</font>

workflow 文件的配置字段非常多，详见[官方文档](https://help.github.com/en/articles/workflow-syntax-for-github-actions)。

下面是一些基本字段：

#### 触发条件

`on`规定`action`的触发条件:

-   使用web事件触发工作流，并且可以具体指定`branches`，`tags`以及文件路径；
-   使用`cron`语法指定时间触发工作流；

其中web事件可以指定如上述例子的`push`事件，如果想指定多个事件，格式为：

```yaml
on: [push, pull_request]
# 或
on:
  push:
  pull_request:
```

**如果不特别指定某一个分支，触发机制会应用到所有分支；**

**如果要具体指定到某一个分支，可使用`branch`选项：**

```yaml
on:
  push:
    branches: [master]
  pull_request:
    branches: [other]
```

触发条件还可以过滤特定的`tag`或者文件路径，通过使用`tags`或者`paths`选项；

例如：如果想只在v1这个`tag`被推送时或者是当前推送包含`test`的文件时，构建操作被触发，可以使用下面配置 ：

```yaml
on:
  push:
    tags: [v1]
    paths: ['test/*']
```

同时，还可以忽略某些`branch`, `tag`或者文件，通过使用`branches-ignore`，`tags-ignore`, `paths-ignore`, 如`branches-ignore:[second]`，可以排除second分支的更改，它等同于`braches:[!second]`。

**需要特别注意的是：无法对工作流程中的同一事件同时使用 branches 和 branches-ignore 过滤器。 需要过滤肯定匹配的分支和排除分支时，建议使用 branches 过滤器。 只需要排除分支名称时，建议使用 branches-ignore 过滤器，tags-ignore和paths-ignore也是如此。**

如果希望定时触发工作流，此时`schedule`就登场了；

例如：如果希望每10分钟运行一次，配置为：

```yaml
on:
  schedule:
    - cron:  '*/10 * * * *'
```

简单说明`cron`中每一项的含义：

第一项是分钟，第二项是小时，第三项是天，第四项是月，第五项是星期几。可使用[crontab](https://crontab.guru/)在线配置想要的时间。

<font color="#f00">**action中可以运行预定工作流程的最短间隔是每 5 分钟一次**</font>

完整事件详见[触发工作流程的事件](https://help.github.com/cn/actions/reference/events-that-trigger-workflows#webhook-events)。

****

#### jobs

工作流默认包含一个或者多个`job`，每一个`job`都是一个独立的工作单元；

job`属性主要包含：

-   **name**: job显示的名字
-   **runs-on**: 指定job运行的机器
-   **steps**: 一个job包含多个step, step是job的最小单元，所有step配置在steps中
-   **env**: 指定环境变量
-   **needs**: 指定job的依赖

**① id和name**

其中`name`和`job id`可能一开始会让人有点混淆，如：

```yaml
jobs:
  build:
    name: Greeting
```

其中`job id`指的是`build`，是在配置文件中可别其他部分引用；

name指的是`Greeting`, 他将会显示在`action`的记录页面中；

**② runs-on**

`action`可使用的机器包括：

| 虚拟环境             | YAML 工作流程标签              |
| -------------------- | ------------------------------ |
| Windows Server 2019  | windows-latest 或 windows-2019 |
| Ubuntu 18.04         | ubuntu-latest 或 ubuntu-18.04  |
| Ubuntu 16.04         | ubuntu-16.04                   |
| macOS Catalina 10.15 | macos-latest or macos-10.15    |

并且每台机器的配置都是：

2-core CPU，7 GB RAM 内存，14 GB SSD 硬盘空间。

可以说是相当良心了。

#### needs

**当`action`中有多个`job`时，默认是并行运行**；

如果某一个`job`需要依赖另一个`job`，可使用`needs`属性，如：

```yaml
jobs:
  job1:
  job2:
    needs: job1
```

此时`job2`会在`job1`成功完成后才会开始执行

#### steps

`job`中所有的操作都在`steps`中，每个`step`主要包含`id`,`name`, `run`, `uses`等属性。

如：

```yaml
jobs:
  first_job:
    steps:
      - name: first step
        uses: actions/heroku@master
      - name: second step
        run: echo 'finish'
```

`run`指定具体命令，如果是多条命令，格式为：

```yaml
run: |
  echo 'first line'
  echo 'second line'
```

**`uses`用于使用其他用户所发布的`action`**；

如：`actions/heroku@master`；

如果其他`action`需要参数，使用`with`传参，如：

```yaml
- name: Setup Node.js for use with actions
  uses: actions/setup-node@v1.1.0
  with:
    version:10.x
```

可以在[github action marketplace](https://github.com/marketplace?type=actions)查看更多好用的action。

至此就是`acion`的基础语法，更多细节参见[完整语法](https://help.github.com/cn/actions/reference/workflow-syntax-for-github-actions)

<br/>

### Action进阶用法

#### 为工作流加一个Badge

在action的面板中，点击`Create status badge`就可以复制badge的markdown内容到`README.md`中；

之后就可以直接在`README.md`中看到当前的构建结果：

![](https://user-gold-cdn.xitu.io/2020/3/11/170c7796274a6356?imageView2/0/w/1280/h/960/ignore-error/1)

<br/>

### 使用构建矩阵

如果我们想在多个系统或者多个语言版本上测试构建，就该构建矩阵发挥作用了。

例如：我们想在多个`node`版本下跑测试，可以使用如下配置，`action`会分别使用`10.x`和`12.x`的版本各运行一次`job`

```
jobs:
  build:
    strategy:
      matrix:
        node-version: [10.x, 12.x]

    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v1
        with:
          node-version: ${{ matrix.node-version }}

      - run: npm ci
      - run: npm test
```

<br/>

### 使用Secrets

构建过程可能需要用到`ssh`或者`token`等敏感数据，而我们是不希望这些数据直接暴露在仓库中，此时就可以使用`secrets`：

在对应项目中选择`Settings`-> `Secrets`即可创建`secret`；

![](https://user-gold-cdn.xitu.io/2020/3/9/170bff282aa37e79?imageView2/0/w/1280/h/960/ignore-error/1)

配置文件中的使用方法：

```yaml
steps:
  - name: use secrets
    env: 
      super_secret: ${{ secrets.YourSecrets }}
```

<font color="#f00">**`secret name`不区别大小写**；</font>

所以如果新建`secret`的的名字是`name`，使用时`secrets.name`或者`secrets.Name`都是ok的；

**并且就算此时直接使用`echo`打印`secret`, 控制台也只会打印出*来保护secret！**

<br/>

### Cache

在构建过程中，会安装很多第三方依赖，而这些依赖并不需要每次都重新下载，可以将这些依赖缓存起来，加快构建速度。

主要使用[action/cache](https://github.com/actions/cache)。

该`action`主要包含三个属性：

-   **path: 需要缓存的文件的路径**
-   **key: 对缓存的文件指定的唯一表示**
-   **restore-key: 主要用于没有再找目标key的缓存的backup选项（可选项）**

下面以`node`项目为例，将`node_modules`缓存起来。

这里只列出关键步骤：

```yaml
steps:
      - name: Cache Node Dependencies
        id: cache
        uses: actions/cache@v1
        with:
          path: node_modules
          key: ${{runner.OS}}-npm-caches-${{ hashFiles('package-lock.json') }}

      - name: Install Dependencies
        if: steps.cache.outputs.cache-hit != 'true'
        run: npm install
```

首先使用`action/cache`指定`path`和`key`；

这里的`key`包含OS信息和`package-lock.json`文件的hash值，通常OS是固定下来的；

而一旦使用了新的第三方库，`package-lock.json`的hash值就会改变，得到一个新的`key`；

`action/cache`会抛出一个`cache-hit`的输出，如果找到对应`key`的缓存，值为`true`。

在随后的安装步骤中，可以使用`if`对`cache-hit`做判断。如果找到缓存就跳过，否则就安装依赖。

在第一次运行时，cache找不到，执行`npm install`，在随后的post cache步骤中对`node_modules`做缓存。

![](https://user-gold-cdn.xitu.io/2020/3/11/170c76700c32b5ba?imageView2/0/w/1280/h/960/ignore-error/1)

第二次运行时，找到cache, 则跳过`npm install`，直接使用缓存：

![](https://user-gold-cdn.xitu.io/2020/3/11/170c7666341548df?imageView2/0/w/1280/h/960/ignore-error/1)

<br/>

### artifact

在构建过程中，可能需要输出一些构建产物，并且不同于cache，这些构建产物在`action`执行完成后，用户还是可以下载查看。

通常`artifact`主要有：日志文件，测试结果等等；

主要使用[action/upload-artifact](https://github.com/actions/upload-artifact) 和 [download-artifact](https://github.com/actions/download-artifact) 进行构建参悟的相关操作。

这里以输出`jest`测试报告为例，jest测试后的测试报告的路径是`coverage`:

```yaml
steps:
      - run: npm ci
      - run: npm test

      - name: Collect Test Coverage File
        uses: actions/upload-artifact@v1.0.0
        with:
          name: coverage-output
          path: coverage
```

执行成功后就能在对应action面板看到生成的`artifact`：

![](https://user-gold-cdn.xitu.io/2020/3/11/170c77672c469f98?imageView2/0/w/1280/h/960/ignore-error/1)

<br/>

### Action限制

这里简单列出action的各种使用限制：

-   action的最大执行时间是72小时，超过该时间，action会自动失败
-   action一小时最大的API请求数量是1000
-   action中每个job最大执行时间为6小时，超过该时间，job会自动失败
-   action中矩阵最多能构建256个job
-   action中多个job默认会并行执行，但对于最大的并行数也是有限制的：

| GitHub 计划 | 同时运行的作业总数 | MacOS 作业同时运行的最大数量 |
| ----------- | ------------------ | ---------------------------- |
| 免费        | 20                 | 5                            |
| Pro         | 40                 | 5                            |
| 团队        | 60                 | 5                            |
| 企业        | 180                | 50                           |

关于`GitHub Actions`付费条款详见[About billing for GitHub Actions](https://help.github.com/cn/github/setting-up-and-managing-billing-and-payments-on-github/about-billing-for-github-actions)。

<br/>

### GitHub Actions相关资源

GitHub Actions官方文档：

-   https://docs.github.com/en/actions

GitHub Actions的相关资源有：

-   https://github.com/marketplace?type=actions
-   https://github.com/actions

<br/>

### 附录

本文摘自：

-   [GitHub Actions 入门教程](http://www.ruanyifeng.com/blog/2019/09/getting-started-with-github-actions.html)
-   [是时候体验一下github action的魅力了](https://juejin.im/post/6844904086953787400)

<br/>

