---
title: Promise中的all、race和any
toc: true
cover: 'https://img.paulzzh.com/touhou/random?43'
date: 2021-05-14 11:12:57
categories: Node.js
tags: [Node.js, Promise]
description: 为了解决回调地狱问题，在现代JS中加入了Promise；并且Promise包括了all、race和any三个不同的方法；本文分别讲述了这三个方法，以及具体的使用场景；
---

为了解决回调地狱问题，在现代JS中加入了Promise；并且Promise包括了all、race和any三个不同的方法；

本文分别讲述了这三个方法，以及具体的使用场景；

文章源代码：

-   https://github.com/JasonkayZK/node_learn/tree/promise

<br/>

<!--more-->

## **Promise中的all、race和any**

### **All方法**

#### **方法介绍**

`Promise.all`可以将多个Promise实例包装成一个新的Promise实例；

同时，整个Promise数组在成功和失败的返回值是不同的：

-   **Promise序列会全部执行通过才认为是成功，否则认为是失败；**
-   **当所有Promise都成功时，返回一个结果数组；**
-   **只要存在一个失败的Promise，则返回最先被reject失败状态的值；**

下面是一个使用all的例子：

all_demo.js

```javascript
let p1 = Promise.resolve("p1成功");
let p2 = Promise.resolve("p2成功");
let p3 = Promise.reject("p3失败");

Promise.all([p1, p2]).then((res) => {
    console.log(res); // [ 'p1成功', 'p2成功' ]
}).catch(err => {
    console.log(err);
});

Promise.all([p1, p2, p3]).then((res) => {
    console.log(res);
}).catch(err => {
    console.log(err); // p3失败
});
```

<br/>

#### **使用场景**

##### **① 同时处理多个异步请求**

Promse.all在处理多个异步处理时非常有用，比如：

**一个页面上需要等两个或多个ajax的数据全部返回以后才正常显示，在此之前只显示loading图标；**

下面为一个例子：

all_demo_2.js

```javascript
let wake = (time) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(`${time / 1000}秒后醒来`)
        }, time)
    })
}

let p1 = wake(3000)
let p2 = wake(2000)

Promise.all([p1, p2]).then((result) => {
    console.log(result)       // [ '3秒后醒来', '2秒后醒来' ]
}).catch((error) => {
    console.log(error)
})
```

>   **需要特别注意的是：**
>
>   -   <font color="#f00">**Promise.all获得的成功结果的数组里面的数据顺序和Promise.all接收到的数组顺序是一致的，即p1的结果在前，即便p1的结果获取的比p2要晚！**</font>
>   -   <font color="#f00">**Promisze.all会等待所有的Promise返回后**</font>

<font color="#f00">**这带来了一个绝大的好处：在前端开发请求数据的过程中，偶尔会遇到发送多个请求并根据请求顺序获取和使用数据的场景，使用Promise.all毫无疑问可以解决这个问题；**</font>

**例如，在图片批量上传的时候很有用，可以知道什么时候这批图片全部上传完毕，保证了并行，同时知道最终的上传结果；**

<br/>

##### **② 保证最低加载时间**

当进行页面请求时，如果请求时间太短，Loading图标就会一闪而过，体验并不好；

这时可以使用`Promise.all()`保证最低Loading时间；

例如，下面的代码可以保证加载动画至少出现200ms：

all_demo_3.js

```javascript
let getUserInfo = function (user) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve('Hello'), Math.floor(400 * Math.random()));
    });
}

let showUserInfo = function (user) {
    return getUserInfo().then(info => {
        console.log('用户信息', info);
        return true;
    });
}

let timeout = function (delay, result) {
    return new Promise(resolve => {
        setTimeout(() => resolve(result), delay);
    });
}

// loading时间显示需要
const time = +new Date();
let showToast = function () {
    console.log('show loading...');
}
let hideToast = function () {
    console.log('hide loading time: ' + (new Date() - time) + " ms");
}

// 执行代码示意
showToast();
Promise.all([showUserInfo(), timeout(200)]).then(() => {
    hideToast();
});
```

多次执行结果：

```
show loading...
用户信息 Hello
hide loading time: 266 ms
show loading...
用户信息 Hello
hide loading time: 205 ms
show loading...
用户信息 Hello
hide loading time: 358 ms
```

可以看到加载从显示到隐藏，一定不会小于200ms；

<br/>

### **Race方法**

#### **方法介绍**

Promse.race就是赛跑的意思，就是说`Promise.race([p1, p2, p3…])`中哪个Promise的结果获得的快，就返回那个结果，不管结果本身是成功状态还是失败状态；

总结来说就是：

-   <font color="#f00">**Promise序列中第一个执行完毕的是通过，则认为成功，如果第一个执行完毕的Promise是拒绝，则认为失败；（即只看第一个执行完毕的Promise）；**</font>

例如：

race_demo.js

```javascript
let p1 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('success')
    }, 1000)
})

let p2 = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject('failed')
    }, 500)
})

Promise.race([p1, p2]).then((result) => {
    console.log(result)
}).catch((error) => {
    console.log(error)  // 返回的是 'failed'
})
```

<br/>

#### **使用场景**

##### **① 根据加载时长展示**

在上面上面的加载例子中仔细一想，有些怪怪的：如果请求本来很快，还非要显示一个Loading过程，这不是舍本逐末了吗？

所以需求应该是这样：

-   如果请求可以在200ms内完成，则不显示loading；
-   如果要超过200ms，则至少显示200ms的loading；

此时，这个需求可以考虑使用`Promise.race()`方法，执行代码示意如下（getUserInfo、showUserInfo等方法都不变）：

race_demo_2.js

```javascript
let getUserInfo = function (user) {
    ...
}

let showUserInfo = function (user) {
    ...
}

let timeout = function (delay, result) {
    ...
}

const time = +new Date();

let showToast = function () {
    ...
}

let hideToast = function () {
    ...
}

// 执行代码示意
let promiseUserInfo = showUserInfo();
Promise.race([promiseUserInfo, timeout(200)]).then((display) => {
    if (!display) {
        showToast();
        Promise.all([promiseUserInfo, timeout(200)]).then(() => {
            hideToast();
        });
    }
});
```

于是，要么用户信息无Loading瞬间显示，要么显示至少200ms的loading，这样的体验就会更细致了；

执行结果如下：

```
用户信息 Hello

show loading...
用户信息 Hello
hide loading time: 407 ms
```

<br/>

##### **② 可取消的Promise**

案例出自Michael Clark，代码如下：

race_demo_3.js

```javascript
function timeout(delay) {
    let cancel;
    const wait = new Promise(resolve => {
        const timer = setTimeout(() => resolve(false), delay);
        cancel = () => {
            clearTimeout(timer);
            resolve(true);
        };
    });
    wait.cancel = cancel;
    return wait;
}

function doWork() {
    const workFactor = Math.floor(600 * Math.random());
    const work = timeout(workFactor);

    const result = work.then(canceled => {
        if (canceled)
            console.log('Work canceled');
        else
            console.log('Work done in', workFactor, 'ms');
        return !canceled;
    });
    result.cancel = work.cancel;
    return result;
}

function attemptWork() {
    const work = doWork();
    return Promise.race([work, timeout(300)])
        .then(done => {
            if (!done)
                work.cancel();
            return (done ? 'Work complete!' : 'I gave up');
        });
}

attemptWork().then(console.log);
```

执行结果：

```
Work done in 21 ms
Work complete!

Work canceled
I gave up
```

所示例子中，doWork是一个花费0~600ms的工作，如果工作大于300ms则撤销，如果工作小于300ms则完成；

<br/>

##### **③ 长时间执行的批处理**

代码出自Chris Jensen，可以保持并行请求的数量固定；

```javascript
const _ = require('lodash')

async function batchRequests(options) {
    let query = { offset: 0, limit: options.limit };

    do {
        batch = await model.findAll(query);
        query.offset += options.limit;

        if (batch.length) {
            const promise = doLongRequestForBatch(batch).then(() => {
                // Once complete, pop this promise from our array
                // so that we know we can add another batch in its place
                _.remove(promises, p => p === promise);
            });
            promises.push(promise);

            // Once we hit our concurrency limit, wait for at least one promise to
            // resolve before continuing to batch off requests
            if (promises.length >= options.concurrentBatches) {
                await Promise.race(promises);
            }
        }
    } while (batch.length);

    // Wait for remaining batches to finish
    return Promise.all(promises);
}

batchRequests({ limit: 100, concurrentBatches: 5 });
```

<br/>

### **Any方法**

#### **方法介绍**

和All方法类似，Any也是接收一个Promise数组；

同时，整个Promise数组在成功和失败的返回值也是不同的：

-   **Promise序列只要有一个执行通过，则认为成功，如果全部拒绝，则认为失败；**

下面是一个使用Any的例子：

```javascript
let p1 = Promise.resolve("p1成功");
let p2 = Promise.resolve("p2成功");
let p3 = Promise.reject("p3失败");
let p4 = Promise.reject("p4失败")

Promise.any([p1, p2]).then((res) => {
    console.log(res); // p1成功
}).catch(err => {
    console.log(err);
});

Promise.any([p1, p2, p3]).then((res) => {
    console.log(res); // p1成功
}).catch(err => {
    console.log(err);
});

Promise.any([p3, p4]).then((res) => {
    console.log(res);
}).catch(err => {
    console.log(err); // AggregateError: All promises were rejected
});
```

>   <font color="#f00">**注意：Promise.any尚未添加至Node中，所以上面的代码可能无法在Node中执行，需要在Chrome等浏览器中执行；**</font>
>
>   具体：
>
>   -   https://stackoverflow.com/questions/63123579/getting-error-typeerror-promise-any-is-not-a-function

<br/>

#### **使用场景**

`Promise.any()`**适合用在通过不同路径请求同一个资源的需求上；**

例如，Vue3.0在unpkg和jsdelivr都有在线的CDN资源，都是国外的CDN，国内直接调用不确定哪个站点会抽风，加载慢，这时候可以两个资源都请求，哪个请求先成功就使用哪一个；

比方说：

-   unpkg的地址是：https://unpkg.com/vue@3.0.11/dist/vue.global.js
-   jsdelivr的地址是：https://cdn.jsdelivr.net/npm/vue@3.0.11/dist/vue.global.js

我们就可以使用下面代码进行请求（使用动态 import 示意）：

any_demo_2.js

```javascript
let startTime = +new Date();
let importUnpkg = import('https://unpkg.com/vue@3.0.11/dist/vue.runtime.esm-browser.js');
let importJsdelivr = import('https://cdn.jsdelivr.net/npm/vue@3.0.11/dist/vue.runtime.esm-browser.js');
Promise.any([importUnpkg, importJsdelivr]).then(vue => {
  console.log('加载完毕，时间是：' + (+new Date() - startTime) + 'ms');
  console.log(vue.version);
});
```

输出如下：

```
You are running a development build of Vue.
Make sure to use the production build (*.prod.js) when deploying for production.
加载完毕，时间是：620ms
3.0.11
You are running a development build of Vue.
Make sure to use the production build (*.prod.js) when deploying for production.
```

620ms完成，但是实际上，两个JS的请求时间差异是挺大的；

不过没关系，有了 `Promise.any()` ，就可以使用最快的那一个；

<font color="#f00">**此外，`Promise.any()`还有一个好处，那就是如果 unpkg 这个网站挂了，也不会影响 Vue 资源的加载，因为一个请求失败了，会继续请求其他的资源，也就是会去请求 jsdelivr 的资源；**</font>

<font color="#f00">**这样保证了资源尽可能可用，但是尽可能使用加载最快的资源；**</font>

<font color="#f00">**在这种场景下就很实用；**</font>

<br/>

## **附录**

源代码：

-   https://github.com/JasonkayZK/node_learn/tree/promise

文章参考：

-   https://www.jianshu.com/p/7e60fc1be1b2
-   https://www.zhangxinxu.com/wordpress/2021/05/promise-all-race-any/?shrink=1


