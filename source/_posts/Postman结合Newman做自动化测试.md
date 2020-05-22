---
title: Postman结合Newman做自动化测试
cover: http://api.mtyqx.cn/api/random.php?62
date: 2020-05-22 20:52:08
categories: [软件测试]
tags: [软件测试, Postman, Newman]
description: 本文讲述了如何使用Newman配合Postman进行自动化测试;
---


本文讲述了如何使用Newman配合Postman进行自动化测试;

<br/>

<!--more-->

**目录:**

<!-- toc -->

<br/>

## Postman结合Newman做自动化测试

在Postman通过Collection进行一组测试的基础上，Postman官方提供了Newman这个命令行工具，可以通过Newman对Collection导出的测试集进行测试

Newman的Github仓库：

https://github.com/postmanlabs/newman

>   关于Postman的用法以及Postman中的tests脚本编写见：
>
>   -   [Postman简明教程](https://iwiki.oa.tencent.com/pages/viewpage.action?pageId=163038421)
>   -   [Postman中Tests脚本总结](https://iwiki.oa.tencent.com/pages/viewpage.action?pageId=163036724)
>
>   这里不多做介绍；

### Newman安装

Newman依赖于node.js > v10，并且需要npm；

>   关于Node.js的安装参考Node官网：
>
>   https://nodejs.org/en/download/package-manager/

安装Newman：

通过npm即可很方便的安装newman：

```bash
npm install -g newman
```

安装完成后，可以执行下面的命令测试是否成功安装：

```bash
newman -version
5.0.0
```

### Newman使用

Newman支持两种使用方式，一种是通过命令行+参数的方式进行测试，另一种是编写js文件，并通过node运行测试，下面分别介绍这两种方式；

#### 使用cli运行Newman

例如我从Postman中导出了`api-pl-kylinkzhang-helloworld.proto.postman_collection.json`的测试集以及对应的测试环境`local-test.postman_environment.json`；

则可以简单通过下面的命令进行整体测试：

```bash
newman run api-pl-kylinkzhang-helloworld.proto.postman_collection.json --reporters cli --environment local-test.postman_environment.json
```

上面的命令通过`newman run collection.json`指定Postman导出的Collection测试集；

通过`--reporters`指定测试结果输出的格式，如需要输出多种结果可使用逗号分割，类似于： `--reporters cli, html`

通过`--environment environment.json`指定Postman导出的测试环境文件；

执行完成后，测试接口和测试结果都会列出在Terminal中，如下：

```bash
api/pl-kylinkzhang-helloworld.proto

→ HelloWorld Stub
  POST http://9.134.243.6:8080/HelloWorld [502 Bad Gateway, 531B, 95ms]
  1. status code test
  2⠄ JSONError in test-script

→ HelloWorld Stub2
  POST http://9.134.243.6:8080/HelloWorld [502 Bad Gateway, 531B, 62ms]
  3. status code test
  4⠄ JSONError in test-script

┌─────────────────────────┬───────────────────┬──────────────────┐
│                         │          executed │           failed │
├─────────────────────────┼───────────────────┼──────────────────┤
│              iterations │                 1 │                0 │
├─────────────────────────┼───────────────────┼──────────────────┤
│                requests │                 2 │                0 │
├─────────────────────────┼───────────────────┼──────────────────┤
│            test-scripts │                 2 │                2 │
├─────────────────────────┼───────────────────┼──────────────────┤
│      prerequest-scripts │                 0 │                0 │
├─────────────────────────┼───────────────────┼──────────────────┤
│              assertions │                 2 │                2 │
├─────────────────────────┴───────────────────┴──────────────────┤
│ total run duration: 377ms                                      │
├────────────────────────────────────────────────────────────────┤
│ total data received: 694B (approx)                             │
├────────────────────────────────────────────────────────────────┤
│ average response time: 78ms [min: 62ms, max: 95ms, s.d.: 16ms] │
└────────────────────────────────────────────────────────────────┘

  #  failure                  detail

 1.  AssertionError           status code test
                              expected response to have status code 200 but got 502
                              at assertion:0 in test-script
                              inside "HelloWorld Stub"

 2.  JSONError                Unexpected token '<' at 1:1
                              <h1>无法访问此网站</h1>9.134.243.6:8080
                              拒绝了您的连接请求。<br><br>请试试以下办法：<ul><li>确认目标服务器是否宕机：
                              ^
                              at test-script
                              inside "HelloWorld Stub"

 3.  AssertionError           status code test
                              expected response to have status code 400 but got 502
                              at assertion:0 in test-script
                              inside "HelloWorld Stub2"

 4.  JSONError                Unexpected token '<' at 1:1
                              <h1>无法访问此网站</h1>9.134.243.6:8080
                              拒绝了您的连接请求。<br><br>请试试以下办法：<ul><li>确认目标服务器是否宕机：
                              ^
                              at test-script
                              inside "HelloWorld Stub2"
```

可以通过`--reporters`指定多种形式的输出，官方提供的格式有：`cli`, `json`, `junit`, `progress` and `emojitrain`；

第三方例如：[newman-reporter-html](https://github.com/postmanlabs/newman-reporter-html)提供了html的测试结果输出格式，可以使用`npm install -g newman-reporter-html`安装，并通过下面的命令生成测试结果：

```bash
newman run api-pl-kylinkzhang-helloworld.proto.postman_collection.json --reporters cli,html --environment local-test.postman_environment.json --reporter-html-export result.html
```

当然你也可以自己编写相应的reporter，详见：[lib/reporters](https://github.com/postmanlabs/newman/tree/develop/lib/reporters)

更多的，官方提供的所有命令行参数如下：

```bash
-h, --help output usage information

-V, --version output the version number

-c, --collection [file] Specify a Postman collection as a JSON [file]

-u, --url [url] Specify a Postman collection as a [url]

-f, --folder [folder-name] Run a single folder from a collection. To be used with -c or -u

-e, --environment [file] Specify a Postman environment as a JSON [file]

    --environment-url [url] Specify a Postman environment as a URL

-E, --exportEnvironment [file] Specify an output file to dump the Postman environment before exiting [file]

-d, --data [file] Specify a data file to use either json or csv

-g, --global [file] Specify a Postman globals file [file]

-G, --exportGlobals [file] Specify an output file to dump Globals before exiting [file]

-y, --delay [number] Specify a delay (in ms) between requests

-r, --requestTimeout [number] Specify a request timeout (in ms) for requests (Defaults to 15000 if not set)

-R, --avoidRedirects Prevents Newman from automatically following redirects

-s, --stopOnError Stops the runner with code=1 when a test case fails

-j, --noSummary Doesn't show the summary for each iteration

-n, --number [number] Define the number of iterations to run

-C, --noColor Disable colored output

-S, --noTestSymbols Disable symbols in test output and use PASS|FAIL instead

-k, --insecure Disable strict ssl

-l, --tls Use TLSv1

-N, --encoding [encoding-type] Specify an encoding for the response. Supported values are ascii,utf8,utf16le,ucs2,base64,binary,hex

-x, --exitCode Continue running tests even after a failure, but exit with code=1. Incompatible with --stopOnError

-o, --outputFile [file] Path to file where output should be written [file]

-O, --outputFileVerbose [file] Path to file where full request and responses should be logged [file]

-t, --testReportFile [file] Path to file where results should be written as JUnit XML [file]

-i, --import [file] Import a Postman backup file, and save collections, environments, and globals [file] (Incompatible with any option except pretty)

-p, --pretty Enable pretty-print while saving imported collections, environments, and globals

-H, --html [file] Export a HTML report to a specified file [file]

-W, --whiteScreen Black text for white screen

-L, --recurseLimit [limit] Do not run recursive resolution more than [limit] times. Default = 10. Using 0 will prevent any variable resolution
```

可通过`newman -h`和`newman run -h`查看更多；

#### 编写js运行Newman

如果你想更自由的定制自动化测试方案，可以通过编写js脚本并通过node执行来实现；

Newman提供了相当丰富的API供用户使用，具体可见：

https://github.com/postmanlabs/newman#api-reference

下面以一个简单的例子来展示如何编写js来调用Newman的API进行自动化测试；

```javascript
const newman = require('newman');
const mail = require('./mail');

// 错误消息
var messages = "";

newman.run({
    collection: require('./data/api-pl-kylinkzhang-helloworld.proto.postman_collection.json'),
    reporters: ['cli', 'html'],
    environment: require('./data/local-test.postman_environment.json'),
    // 禁止SSL检查，并允许自签名的SSL证书
    insecure: true,
}).on('start', function(err) {
    if (err) { throw err; }
    console.log('running a collection..');
}).on('done', function (err, summary) {
    if (err) { throw err; }
    var failures = summary.run.failures;
    if (failures.length) {
        messages += "Test failed count: " + failures.length + "<br/><br/>"
        failures.forEach(e => {
            messages += "Test failed from: " + e.source.name + "<br/>"
                + "error case: " + e.error.test + "<br/>"
                + "error at: " + e.at + "<br/><br/>"
        });

        var mailOptions = {
          // 发送邮件的地址
          from: '"<username>" <sender_email>',
          // 接收邮件的地址
          to: "receiver_email",
          // 邮件主题
          subject: "项目自动化测试未通过",
          // 以HTML的格式显示，这样可以显示图片、链接、字体颜色等信息
          html: messages
        };
        
        mail.sendMail(mailOptions, (error, info = {}) => {
            if (error) {
              return console.log(error);
            }
            console.log('Test failed messages sent');
        });
    } else {
        console.log("项目测试通过!")
    }
    console.log('collection run complete!');
});
```

上面的js文件通过collection指定待测试数据集，reporters指定测试结果输出的格式，environment指定测试环境文件；

之后通过`on`方法指定各个阶段，以及各个阶段的回调函数。在整个测试过程中，在不同阶段会调用对应的回调函数；官方提供的阶段有：

| **Event**        | **Description**                                              |
| ---------------- | ------------------------------------------------------------ |
| start            | The start of a collection run                                |
| beforeIteration  | Before an iteration commences                                |
| beforeItem       | Before an item execution begins (the set of prerequest->request->test) |
| beforePrerequest | Before `prerequest` script is execution starts               |
| prerequest       | After `prerequest` script execution completes                |
| beforeRequest    | Before an HTTP request is sent                               |
| request          | After response of the request is received                    |
| beforeTest       | Before `test` script is execution starts                     |
| test             | After `test` script execution completes                      |
| beforeScript     | Before any script (of type `test` or `prerequest`) is executed |
| script           | After any script (of type `test` or `prerequest`) is executed |
| item             | When an item (the whole set of prerequest->request->test) completes |
| iteration        | After an iteration completes                                 |
| assertion        | This event is triggered for every test assertion done within `test` scripts |
| console          | Every time a `console` function is called from within any script, this event is propagated |
| exception        | When any asynchronous error happen in `scripts` this event is triggered |
| beforeDone       | An event that is triggered prior to the completion of the run |
| done             | This event is emitted when a collection run has completed, with or without errors |

通过编写在测试不同阶段的回调函数，即可定制你自己的自动化测试方案；

例如上例中就通过调用mail模块封装的发送邮件接口完成了在测试未通过时向指定用户发送测试未通过邮件警告；

<br/>


## 附录

如果觉得文章写的不错, 可以关注微信公众号: Coder张小凯

内容和博客同步更新~

<br/>