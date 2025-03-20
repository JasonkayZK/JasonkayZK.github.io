---
title: 实时数据统计
date: 2020-08-29 15:28:33
layout: about
cover: https://img.paulzzh.com/touhou/random?99
---

*It takes a strong man to save himself, and a great man to save another.*

*强者自救，圣者渡人*  ————电影肖申克的救赎。

<br/>

## **实时数据统计**

**本页面创立于：**2020年8月29日

**页面成立原因：** 用作博客和博主的一些实时数据统计

**技术支持：**

- **实时代码统计：**[Wakatime](https://wakatime.com/)
- **实时文章热榜：**MongoDB + ~~[Tencent SCF](https://cloud.tencent.com/product/scf)~~
- **实时应用热榜：**[ManicTime](https://www.manictime.com/) + [ManicTime Server](https://manictime.uservoice.com/knowledgebase/articles/686154-what-is-manictime-server) + ~~[Tencent SCF](https://cloud.tencent.com/product/scf)~~

**更多说明：**

-   **2022年6月26日，由于 [Tencent SCF](https://cloud.tencent.com/product/scf) 开始收费，云函数下线，改用后端接口服务；**
-   [使用Wakatime记录你的Coding数据](https://jasonkayzk.github.io/2020/08/28/使用Wakatime记录你的Coding数据/)

<br/>

### **实时访问数据**


</div>
<div class = "page-container">
    <iframe id="page"
        title="page"
        style='position:inherit; top:0px; left:0px; width:100%; height:550px; z-index:999'
        frameborder='no'
        scrolling='true'
        src="https://us.umami.is/share/j5SVhZLblKH5HIbJ/jasonkayzk.github.io/">
    </iframe>
</div>


> **来源：**
>
> -   https://us.umami.is/share/j5SVhZLblKH5HIbJ/jasonkayzk.github.io

<br/>


### **实时文章热榜**

<div>
<table id="passage-hot-list" class="hot-list-table" width="100%">
</table>
<style>
    .hot-list-table {
        line-height: 3.1;
        text-align: left;
        box-shadow: 0 0 0 2px #EED
    }
    article table td {
        border-right: 1px solid #eee;
        padding: 0px 40px;
        padding-top: 0px;
        padding-right: 80px;
        padding-bottom: 0px;
        padding-left: 20px;
    }
}
</style>
</div>
<script type="text/javascript">
$.get("https://service-rvqf6dam-1257829547.gz.apigw.tencentcs.com/hot_list/", (res) => {
        var data = res.data;
        var str = '';
        str += '<tr>'
        str += '<td valign="top" width="70%"><h3><b>文章名称</b></h3></td>';
        str += '<td><h3><b>日阅读数</b></h3></td>';
        str += '/<tr>'
        $.each(data, function(i, obj) {
            str += '<tr>'
            str += '<td valign="top" width="80%"><h4>' + obj.name + '</h4></td>';
            str += '<td valign="top" width="20%"><span>' + obj.view_count + '</span></td>';
            str += '</tr>'
        });
        $("#passage-hot-list").append(str);
    }
);
</script>
<br/>

### **实时应用热榜**

<font color="#f00">**实时应用热榜记录了博主最近24H内使用软件时长的排行榜。**</font>

<div>
<table id="app-hot-list" class="hot-list-table" width="100%">
</table>
<style>
    .hot-list-table {
        line-height: 3.1;
        text-align: left;
        box-shadow: 0 0 0 2px #EED
    }
    article table td {
        border-right: 1px solid #eee;
        padding: 0px 40px;
        padding-top: 0px;
        padding-right: 80px;
        padding-bottom: 0px;
        padding-left: 20px;
    }
}
</style>
</div>
<script type="text/javascript">
let query_length = 15;
let before_timespan = 24;
$.get("https://service-rvqf6dam-1257829547.gz.apigw.tencentcs.com/app_hot_list?query_length="+query_length+"&before_timespan="+before_timespan, (res) => {
        var data = res.data;
        var str = '';
        str += '<tr>'
        str += '<td valign="top" width="70%"><h3><b>应用软件名称</b></h3></td>';
        str += '<td><h3><b>使用时长/分钟</b></h3></td>';
        str += '/<tr>'
        $.each(data, function(i, obj) {
            str += '<tr>'
            str += '<td valign="top" width="80%"><h4>' + obj[0] + '</h4></td>';
            str += '<td valign="top" width="20%"><span>' + obj[1].toFixed(2) + '</span></td>';
            str += '</tr>'
        });
        $("#app-hot-list").append(str);
    }
);
</script>

<br/>

### **实时代码统计**

<table width="800px">
<tr>
<td valign="top" width="50%">
#### 🏊‍♂️ Coding Activity

<a href="https://wakatime.com"><img src="https://wakatime.com/share/@Jasonkay/a46bf7c6-ccbf-43e5-b141-7e841f581d87.png" /></a>

</td>

<td valign="top" width="50%">

#### 🤹‍♀️ Languages

<a href="https://wakatime.com"><img src="https://wakatime.com/share/@Jasonkay/4af7e151-248b-4260-8618-fdf60beec5d1.png" /></a>

</td>
</tr>
</table>

<br/>

<br/>