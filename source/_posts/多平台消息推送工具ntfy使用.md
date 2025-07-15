---
title: 多平台消息推送工具ntfy使用
toc: true
cover: 'https://img.paulzzh.com/touhou/random?88'
date: 2025-07-15 16:52:51
categories: 工具分享
tags: [工具分享, 推送, ntfy]
description: ntfy是一个开源的多平台消息推送工具，可以通过HTTP请求发送通知到手机或桌面。本文总结了ntfy的安装、配置和使用方法。
---

ntfy是一个开源的多平台消息推送工具，可以通过HTTP请求发送通知到手机或桌面。

本文总结了ntfy的安装、配置和使用方法。

官方仓库：
- https://github.com/binwiederhier/ntfy

<br/>

<!--more-->

# **ntfy使用**

## **一、简介**

ntfy（发音为“notify”）是一个简单的基于HTTP的发布-订阅通知服务。通过ntfy，可以使用PUT/POST请求从任何计算机的脚本发送通知到手机或桌面，而无需注册或支付费用。

同时ntfy是开源的，可以轻松自托管。

ntfy提供免费的公共实例：ntfy.sh，也有Android和iOS应用可用；

主要特点：
- **简单易用**：通过curl等工具发送通知。
- **自托管**：可以部署自己的实例。
- **多平台**：支持Android、iOS、Web等。
- **访问控制**：支持用户认证和ACL。

<br/>

## **二、使用**

### **1、发送通知**

使用curl：

```bash
curl -d "Hello from ntfy" ntfy.sh/mytopic
```

### **2、订阅主题**

在APP或Web订阅主题接收通知。

<br/>

## **三、自部署**

参考：

-   https://blog.xiaoz.org/archives/20400
-   https://k1r.in/posts/notify-ntfy/

<br/>

# **附录**

参考：
- https://github.com/binwiederhier/ntfy
- https://k1r.in/posts/notify-ntfy/
- https://blog.7theaven.top/2023/06/11/%E4%BD%BF%E7%94%A8-ntfy-%E8%87%AA%E5%BB%BA%E6%B6%88%E6%81%AF%E6%8E%A8%E9%80%81%E6%9C%8D%E5%8A%A1/#toc-head-1
- https://blog.xiaoz.org/archives/20400

<br/>
