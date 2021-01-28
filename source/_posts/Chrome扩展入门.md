---
title: Chrome扩展入门
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?2'
date: 2020-10-23 21:46:58
categories: Chrome扩展
tags: [Chrome扩展]
description: 最近我还是放弃了Firefox，转而拥抱Chrome；一个很重要的原因就是Firefox经常抽风，各种无法访问，各种4xx的证书错误实在是让我受不了；转到Chrome之后，做了书签、密码、扩展等数据迁移；然后最近阮一峰推送了一个Chrome扩展入门。我大概看了一下，在这里总结一下；
---

最近我还是放弃了Firefox，转而拥抱Chrome；一个很重要的原因就是Firefox经常抽风，各种无法访问，各种4xx的证书错误实在是让我受不了；转到Chrome之后，做了书签、密码、扩展等数据迁移；

然后，最近阮一峰推送了一个Chrome扩展入门；

我大概看了一下，在这里总结一下；

源代码：

-   https://github.com/JasonkayZK/chrome-extension-demo

<br/>

<!--more-->

## Chrome扩展入门

### 前言 - 碎碎念

先说一下我从Firefox到Chrome迁移的一个感受：

首先，Chrome在关闭最后一个标签之后，会直接退出。这一点一开始让我很不适应，现在慢慢习惯了；

然后，对于同步来说，目前在国内的环境来看，还是必须要搭梯子才能流畅的同步，这一点还是有些麻烦的；

最后就是Chrome对于安全的管控越来越严格，比如我博客中使用到了一个非HTTPS的随机封面图片的链接，而我博客本身是HTTPS协议的所以不修改信任配置，封面就无法显示；(不过这也是为了更安全的通信，后面我也会整体迁移到HTTPS上)；

再来就是安装了一些插件：

-   **超级拖曳**
-   **捕捉网页截图**
-   **划词翻译**
-   **二维码生成器**
-   **Wappalyzer**
-   **Video DownloadHelper**
-   **Tampermonkey**
-   **SimpleUndoClose**
-   **SetupVPN**
-   **Hoxx VPN Proxy**
-   **RSSHub Radar**
-   **Quick Bookmark Cleaner**
-   **Bookmarks clean up**
-   **OneTab**
-   **Octotree - GitHub code tree**
-   **LastPass: Free Password Manager**
-   **Infinity 新标签页**
-   **Distill Web Monitor**
-   **Dark Reader**
-   **Adobe Acrobat**

上面的这些插件都是我强烈推荐的，大家可以试试。

既然别人都做了这么多的插件，所以为什么我们不自己定制一个属于自己的插件呢？

正好，最近阮一峰推送了一个Chrome扩展入门；

我大概看了一下，在这里总结一下；

<br/>

### **动手做一个Chrome插件**

Chrome扩展程序由HTML，JavaScript和CSS组成，因此对于Web开发的人来说学习曲线很小。

下面我们通过动手做一个识别当前页面是否支持jQuery的插件，来了解Chrome插件的开发过程；

在下面的展示代码中，包括：

-   manifest.json@
-   popup.html
-   popup.js
-   content.js
-   其他图片信息

>   源代码：https://github.com/JasonkayZK/chrome-extension-demo

下面我们一个一个来看。

#### **① manifest.json**

manifest.json声明了一个扩展：它包含基本信息，如名称、版本、说明、图标、脚本、操作类型等；

在我们的例子中声明如下所示：

```json
{
  "manifest_version": 2,
  "name": "jQuery Checker",
  "version": "1.0.0",
  "description": "This extension verifies jQuery exists somewhere on this page",
  "icons": {
    "128": "icon128.png",
    "32": "icon32.png",
    "48": "icon48.png"
  },
  "browser_action": {
    "default_icon": {
      "16": "icon16.png",
      "32": "icon32.png"
    },
    "default_popup": "popup.html",
    "default_title": "Check to see if jQuery is on this page"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_end"
    }
  ]
}
```

在上面的示例中：

-   manifest_version：声明了配置版本，目前为2；
-   name：声明了插件的名称；
-   version：声明了插件版本，可用于更新插件；
-   description：插件的介绍，这个会在Chrome的插件中显示；
-   browser_action：使用浏览器操作，将图标放在地址栏右侧的Google Chrome浏览器主工具栏中。除了展示图标之外，浏览器操作还可以具有工具提示、徽章和弹出窗口等；
-   content_scripts：配置需要注入JS代码；
    -   matches：指定此内容脚本将被注入到哪些页面；
    -   js：要插入匹配页面的JavaScript文件列表，以它们在数组中出现的顺序注入；
    -   run_at：控制何时js注入文件。可以是“ document_start”，“ document_end”或“ document_idle”。默认为“ document_idle”；

>   更多关于Chrome插件文档：https://chrome-apps-doc2.appspot.com/extensions/devguide.html

 上面的配置将`popup.html`指定为我们的默认页面：该HTML文件包含了单击Chrome扩展程序时将显示的弹出窗口；

<font color="#f00">**注意：此页面不能包含任何JavaScript，只能包含指向单独的.js文件的链接（允许使用CSS，但为了简单起见，我们仅使用内联CSS）**</font>

****

#### **② popup.html**

下面是我们Chrome弹出插件的样子：

```html
<!doctype html>
<html>
  <head>
    <title>jQuery Checker</title>
    <script src="popup.js"></script>
  </head>
  <body style="background-color:#0F0;width:160px;height:90px;">
    <div id="status">
      <button id="getResults">Check jQuery</button>
      <h4 id="results"></h4>
    </div>
  </body>
</html>
```

popup.html中引入了popup.js，下面我们来看这个js；

****

#### **③ popup.js**

下面是`popup.js`中的内容：

```javascript
document.addEventListener('DOMContentLoaded', function(event) {
  var resultsButton = document.getElementById('getResults');
  resultsButton.onclick = getResults;
});

function getResults() {
  chrome.tabs.query(
    { active: true, currentWindow: true },
    function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'checkForWord' },
        function (response) {
          showResults(response.results);
        }
      );
    }
  );
}

function showResults(results) {
  var resultsElement = document.getElementById('results');
  resultsElement.innerText = results ?
    'This page uses jQuery' :
    'This page does NOT use jQuery';
}
```

首先`addEventListener`给popup.html中的按钮添加了`getResults`点击事件；

然后通过`chrome.tabs.query`指定活动标签来找到当前活动的标签：

```js
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    //...
});
```

 在获得该选项卡的句柄之后，我们指定要调用的函数并处理结果：

```javascript
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "checkForWord" }, function (response) {
        showResults(response);
    });
});
```

对于`checkForWord`函数，我们是在`content.js`中，通过manifest.js引入的；

最后，我们来看一下`content.js`；

****

#### **④ content.js**

content.js中的内容：

```javascript
// listen for checkForWord request, call getTags which includes callback to sendResponse
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.action === 'checkForWord') {
      checkForWord(request, sender, sendResponse);
      // this is required to use sendResponse asynchronously
      return true;
    }
  }
);

// Returns the index of the first instance of the desired word on the page.
function checkForWord(request, sender, sendResponse) {
  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src.toLowerCase().indexOf('jquery') > -1) {
      return sendResponse({ results: i + 1 });
    }
  }
  return sendResponse({ results: 0 });
}
```

在上述`checkForWord`中，实现了检查当前页面中是否包括jquery的逻辑；

而`chrome.runtime.onMessage.addListener`接受一个`checkForWord request`，并调用`checkForWord`；

至此，我们的Chrome插件已经开发完成！

<br/>

### Chrome导入本地插件

 打开Chrome浏览器，然后转到`chrome://extensions/`；

>   此处需要确保右上角的“开发人员模式”已打开！

随后单击**加载已解压的扩展程序**，然后导航到本地文件系统中包含我们扩展的文件夹；

随后，就可以在扩展栏中看到一个新的扩展，如下图：

![jQuery_Checker.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/jQuery_Checker.png)

<br/>

### 使用插件

点击插件后显示popup.html页面，点击`Check jQuery`按钮即可查看当前页面是否采用了jQuery：

![jQuery_Checker_2.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/jQuery_Checker_2.png)

<br/>

### 开发插件时一些技巧

上面我们开发了一个属于自己的插件。

下面有一些和大家分享的插件开发技巧：

#### **① 调试**

和Web开发类似，在插件上面使用右键 -> 检查(Inspect)，一样可以打开插件的控制台，并可在其中进行调试；

****

#### **② 重新加载**

在开发和调试扩展工具时，可以在插件的控制台通过输入`location.reload()`：手动重新加载扩展代码，以避免不断重新打开扩展和开发工具 ；

****

#### **③ 调试js**

对于content.js来说，由于我们已经将它注入到了实际的网页本身。

所以可以通过页面本身打开Chrome控制台，选择Sources下的Content Scripts标签。

我们的脚本通常在这个标签下面，

如下图所示：

![content_scripts.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/content_scripts.png)

<br/>

### 后记

 关于插件脚本的最后一点是：它们以Chrome扩展程序使用的“Isolated World”模式运行；

这意味着它们仅能访问选项卡内网页的DOM，但无权访问该页面上可能存在的任何JavaScript对象！

<br/>

## 附录

源代码：

-   https://github.com/JasonkayZK/chrome-extension-demo

<br/>