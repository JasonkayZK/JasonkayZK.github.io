---
title: 使用mongodb和serverless给你的博客添加点赞吧
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?13'
date: 2020-10-26 19:50:59
categories: 博客管理
tags: [博客管理, 博客美化, MongoDB, Serverless, FaaS]
description: 最近，博客上线了点赞功能。使用的是MongoDB+腾讯云云函数的方式，整个功能使用的组件全部是免费。下面，跟随本文的脚步，也给你自己的博客添加点赞功能吧！
---

最近，博客上线了点赞功能。使用的是MongoDB+腾讯云云函数的方式，整个功能使用的组件全部是免费。

下面，跟随本文的脚步，也给你自己的博客添加点赞功能吧！

源代码：

-   serverless后台：[serverless_blog_like](https://github.com/JasonkayZK/JasonkayZK.github.io/tree/save/serverless_blog_like/)
-   前端样式：[Twitter红心点赞CSS3动画按钮特效](https://github.com/JasonkayZK/blog_static/tree/master/component/Twitter%E7%BA%A2%E5%BF%83%E7%82%B9%E8%B5%9ECSS3%E5%8A%A8%E7%94%BB%E6%8C%89%E9%92%AE%E7%89%B9%E6%95%88/)

<br/>

<!--more-->

## 使用mongodb和serverless给你的博客添加点赞吧

### 前言

很久之前就有给我的博客增加点赞功能的想法了；

相比于评论和打赏，点赞基本上是一个轻量级、接近零成本的方式给与读者的参与度；

正好腾讯云有免费的FaaS产品云函数SCF、MongoDB官网有提供免费的分布式DB可以用，就花了两个小时给我的博客加了个点赞的功能；

<br/>

### FaaS后台

#### **① mongodb存储**

整个后台部分使用的是mongodb官方提供的免费mongodb存储；

首先进入mongodb官网：https://www.mongodb.com/

点击中间的`Start free`：

![mongodb_1.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/mongodb_1.png)

注册账号后就有一个免费的分布式mongoDB可以用了！

mongodb的管理界面如下图所示：

![mongodb_2.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/mongodb_2.png)

点击Collections即可查看存储的数据；

点击Connect即可查看连接mongodb的各种连接方式；

>   在这里我们需要记住在`Connect your application`中的连接方式；
>
>   如果你是用的是node，则连接方式如下：
>
>   ```bash
>   mongodb+srv://<username>:<password>@cluster0.atob4.gcp.mongodb.net/<dbname>?retryWrites=true&w=majority
>   ```
>
>   稍后我们需要使用这个连接我们的mongodb；

由于mongodb是不需要提前创建表和表结构的，所以我们直接进入后台serverless部分；

****

#### **② 创建云函数**

进入腾讯云云函数SCF：

https://cloud.tencent.com/product/scf

点击管理控制台进入(**如果你还未开通，这里首先会开通云函数服务，然后再进入云函数SCF控制台**)；

进入控制台之后大概是这个样子的：

![scf_1.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/scf_1.png)

点击函数服务，进入函数服务页面并点击新建：

![scf_2.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/scf_2.png)

进入新建页面后，填写一个函数名称，例如：`BlogLike`；

并选择运行环境Nodejs12.16。这里我选择的是NodeJS环境，因为JS操作mongodb更方便一点，也更容易写；

**（如果你对Java或者Go比较熟悉，也可以使用对应的环境）**

最后选择空白函数，并点击下一步创建：

![scf_3.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/scf_3.png)

函数配置全部保持默认，点击完成即可创建函数；

函数创建完成后，腾讯云会提供一个hello-world的示例：

![scf_4.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/scf_4.png)

从示例中可以看出，整个函数的入口是：`index.main_handler`

通过下面提供的接口测试，也可以查看到具体的参数是在event中的；

这里我们不使用提供的模板，而是自己创建一个node项目，并使用`index.main_handler`作为服务函数入口地址即可；

****

#### **③ 编写后台服务**

使用`npm init`创建一个项目，并引入mongodb的依赖；

package.json

```json
{
  "name": "blog_like",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "mongodb": "^3.6.2"
  }
}
```

然后编辑mongo.js，在其中实现处理数据库的逻辑：

mongo.js

```javascript
const MongoClient = require('mongodb').MongoClient;

const uri = "mongodb+srv://<username>:<password>@<cluster_url><dbname>?retryWrites=true&w=majority";

async function getDocumentLike(docName) {
    const client = new MongoClient(uri, { useNewUrlParser: true });
    await  client.connect();
    const cmd = client.db('blog').collection('doc_like');
    res = await cmd.findOne({"docName": docName});
    if (res ==  null) {
        res = addDocumentLike(docName, 0);
    }

    client.close();
    return res;
}

async function addDocumentLike(docName, num) {
    const client = new MongoClient(uri, { useNewUrlParser: true });
    await client.connect();

    const cmd = client.db('blog').collection('doc_like');
    docObj = await cmd.findOne({"docName": docName});

    if (docObj == null) {
        docObj = {
            "docName": docName,
            "likeNum": 0
        };
    } else {
        docObj.likeNum += num;
    }

    cmd.updateOne(
        {"docName": docName},
        {$set: docObj},
        {"upsert": true},
        function(err, res) {
            if (err) {
                throw err;
            }
            // console.log("1 document updated, res: " + res);
        }
    )
    client.close()

    return docObj
}

async function test(){
    var res1 = await getDocumentLike("Algorithm");
    console.log(res1);
    var res2 = await addDocumentLike("Algorithm", 1);
    console.log(res2);
}

test();

// module.exports = {getDocumentLike, addDocumentLike}
```

上面的uri规定了mongodb对应的连接地址；

而`getDocumentLike`根据传入的文章名称，去寻找文章对应的点赞个数，如果未找到则说明数据库还没有这条数据，此时插入这条数据；

`addDocumentLike`用于增加或者插入一条文章记录：首先取到当前文章点赞数，若不存在则插入一条新的文章记录，然后根据num设置点赞增加的个数，num可以是：

-   0：新增记录；
-   1：增加；
-   -1：取消；

最后，先创建一个test函数，测试上面的函数没问题；

使用下面的命令测试：

```bash
node mongo.js
{ _id: 5f918523bc86842926379ae5, docName: 'Algorithm', likeNum: 3 }
{ _id: 5f918523bc86842926379ae5, docName: 'Algorithm', likeNum: 4 }
```

测试成功后，将test注释，并使用`module.exports`暴露函数即可；

最后在index.js中使用暴露的函数处理接口逻辑：

index.js

```javascript
'use strict';
var {getDocumentLike, addDocumentLike} = require('./mongo')

exports.main_handler = async (event, context) => {
    var body = event.body;
    var jsonObj = JSON.parse(body);
    
    var resObj = {};
    var actionId = jsonObj.actionId;
    var docName = jsonObj.docName;

    if (actionId == 'get') {
        resObj = await getDocumentLike(docName);
    } else if (actionId == 'add') {
        resObj = await addDocumentLike(docName, 1);
    } else if (actionId == 'subtract') {
        resObj = await addDocumentLike(docName, -1);
    }

    return resObj;
};
```

接口采用POST请求，包括了actionId和docName两个参数：

-   actionId用于判断点赞逻辑；
-   docName用于处理对应的文章；

至此，整个简单的云函数开发完毕；

****

#### **④ 上传代码**

将上述三个文件上传：

选择提交方式为本地上传文件夹，上传包括上述三个文件的文件夹，最后点击保存即可上传：

![scf_5.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/scf_5.png)

上传后如果没有安装依赖，可以在下方选择在线安装依赖，并保存后即可安装依赖；

****

#### **⑤ 配置触发器**

选择左侧的触发管理，并创建一个API网关触发器，并选择请求方式为POST：

![scf_6.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/scf_6.png)

触发器创建完成后，即可处理API的POST请求；

可以在触发管理中获取到API的访问路径！

****

#### **⑥ 测试**

最后我们使用控制台进行函数测试（也可以使用POSTMAN根据上面获取到的API路径进行测试）；

返回函数管理中，在下方的测试事件中选择Api Gateway 事件模板，并填写相应的参数进行测试：

![scf_7.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/scf_7.png)

以我的一个记录为例，可见成功被执行了！

<br/>

### 前端展示

>   前端部分参考了这个博客中的实现：[Twitter 红心点赞 CSS3 动画按钮特效](https://www.123si.org/css/article/twitter-red-heart-praise-css3-animation-button-special-effects/)

我的博客是使用Hexo构建的（不过无论使用哪个方式构建都是类似的），在对应主题相加点赞的地方插入html片段即可，比如：

```html
<div id="like-container" style="text-align: center">
    <div class="like-feed">
        <p>觉得本文不错就点个<span>♥</span>再走吧~</p>
        <div class="like-img">
            <div class="like-heart" id="like" rel="like"></div>
            <div class="like-count" id="like-count"></div>
        </div>
    </div>
</div>

<style>
    #like-container {
        margin: 0 auto;
        width: 100%;
    }
    ....
</style>
```

对于点赞逻辑的处理，这里仁者见仁吧，不过基本上就是用户进来就请求get到点赞个数，然后当用户点赞或者取消点赞之后，就请求上面的add或者subtract就行了！

#### **① 前端请求**

>   这里需要注意的是：
>
>   大家尽量使用Promise的风格进行ajax调用，反正我之前用的是ajax+callback这种success回调的方式；
>
>   呃……，有点问题；
>
>   具体可见：[请问云函数中调用数据库查询加插入为什么一直报错？谢谢](https://developers.weixin.qq.com/community/develop/doc/000ec0dbba0540180cf795f265b000)

****

#### **② 跨域问题**

既然牵扯到了API调用，那么另外一个不得不提的问题就是：跨域；

通常跨域问题可以通过jsonp等方式、配合后端解决；

不过既然你已经使用了serverless并配置了API触发器，为什么不直接在控制台管理这些呢？

腾讯云已经提供了API管理，在API网关中：

https://console.cloud.tencent.com/apigateway/

选择你绑定了云函数的服务名称，点击名称进入并勾选支持CORS：

![scf_8.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/scf_8.png)

完成后点击发布即可；

>   具体文章可以参考：
>
>   [腾讯云SCF + 腾讯云API网关实现跨域](https://cloud.tencent.com/developer/article/1531402)

<br/>

### 其他

#### **接口可靠性**

其实对于这种点赞功能的需求，可靠性不是那么重要，多一个少一个也是并不是完全不可接受的事情；

其次，由于免费的mongodb是在海外并且的，所以在查询延时等方面其实问题还是挺严重的；

这个可以通过提高云函数的超时时间来避免调用超时；

对于我的博客来说，由于部署服务器在加州，所以在选择mongodb的时候，尽量选择靠近的区域；

<br/>

## 附录

-   serverless后台：[serverless_blog_like](https://github.com/JasonkayZK/JasonkayZK.github.io/tree/save/serverless_blog_like/)
-   前端样式：[Twitter红心点赞CSS3动画按钮特效](https://github.com/JasonkayZK/blog_static/tree/master/component/Twitter%E7%BA%A2%E5%BF%83%E7%82%B9%E8%B5%9ECSS3%E5%8A%A8%E7%94%BB%E6%8C%89%E9%92%AE%E7%89%B9%E6%95%88/)

<br/>