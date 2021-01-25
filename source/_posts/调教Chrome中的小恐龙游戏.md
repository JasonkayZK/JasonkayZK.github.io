---
title: 调教Chrome中的小恐龙游戏
toc: true
cover: 'https://acg.toubiec.cn/random?56'
date: 2020-12-07 17:15:15
categories: 技术杂谈
tags: [技术杂谈]
description: 几年前，Google给Chrome浏览器加了一个有趣的彩蛋，如果你在未联网的情况下访问网页，会看到No Internet的提示，旁边是一只像素恐龙；按下空格键，小恐龙开始奔跑！
---

几年前，Google给Chrome浏览器加了一个有趣的彩蛋，如果你在未联网的情况下访问网页，会看到No Internet的提示，旁边是一只像素恐龙；

按下空格键，小恐龙开始奔跑！

<br/>

<!--more-->

## **调教Chrome中的小恐龙游戏**

通常当Chrome用户在无网络时访问某一网址，浏览器会提示“无网络链接”，按下空格键，就会唤醒一个小恐龙跑步；

如果在有网络连接时也想玩的话，可以直接在地址栏输入：

-   chrome://dino

开始游戏！

既然这个游戏是纯JS实现的，所有的东西都在前端，当然我们可以魔改啦！

<br/>

### **几种魔改方法**

按F12打开控制台；执行下面的JS即可；

#### **① 游戏不会结束**

```javascript
Runner.instance_.gameOver=function(){}
```

将gameOver函数赋值为空…；

游戏就不会结束了；

**② 自动跳跃判断**

```javascript
// 判断障碍 自动跳
 const __checkForCollision = checkForCollision
 checkForCollision = function (obstacle, tRex, opt_canvasCtx) {
   const __instance_ = new Runner()
   const _obstacle = {
     ...obstacle,
     xPos: obstacle.xPos - (46 + 3 * parseInt(__instance_.currentSpeed))
   }
   if (__checkForCollision(_obstacle, tRex, opt_canvasCtx)) {
     __instance_.tRex.startJump(__instance_.currentSpeed)
   }
   return __checkForCollision(obstacle, tRex, opt_canvasCtx)
 }
```

#### **③ 游戏加速**

```javascript
Runner.instance_.setSpeed(1000);
```

#### **④ 调整跳跃的高度**

```javascript
Runner.instance_.tRex.setJumpVelocity(100);
```

>   大部分的方法都在Runner.instance_中；
>
>   更多的玩法等待大家去发掘，Enjoy！

<br/>

### **游戏有没有尽头**

设计师 Edward Jung 说，只要你坚持玩 1700 万年，游戏就会结束了，而1700 万年正是暴龙在地球上存在的总的时间；

<br/>