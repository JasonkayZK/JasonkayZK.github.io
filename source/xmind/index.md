---
title: 思维导图
date: 2021-04-17 22:41:51
layout: false
---
{% raw %}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mind Map</title>
  <style type="text/css">
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
<div id="app" style="width: 100%;height: 100%;"></div>
<script src="https://cdn.jsdelivr.net/npm/janvas"></script>
<script src="https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/component/思维导图/xmind.js"></script>
 <!-- 站内通知 -->
  <script type="text/javascript" src="https://libs.baidu.com/jquery/1.11.1/jquery.min.js"></script>
  <link href='https://apps.bdimg.com/libs/bootstrap/3.3.4/css/bootstrap.css' rel='stylesheet' type='text/css'>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/component/思维导图/css/default.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/component/思维导图/css/notification.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/component/思维导图/css/index.css">
  <script src="https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/component/思维导图/notification.js"></script>
  <script>
    'use strict';
    (function () {
      $(function () {
        $('.position').click(function (event) {
          var el = $(event.target);
          $('.position').removeClass('selected');
          el.addClass('selected');
          position = el.attr('data-position');
        });
      });
    });
    var position = 2;
    // 关闭百毫秒数
    var closeTime = 50;
    var notifyFunc = function () {
      Notification.create(
        // Title
        "欢迎使用思维导图✒️",
        // Text
        "思维导图操作说明：<BR/><a href='https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/component/思维导图/Manual.jpg' target='_blank'>JMind使用手册</a>",
        // Illustration
        "https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/component/思维导图/images/avatar4.jpg",
        // Effect
        'fadeInRight',
        // Position 1, 2, 3, 4
        1,
        closeTime
      );
    };
    notifyFunc();
  </script>
</body>
</html>
{% endraw %}