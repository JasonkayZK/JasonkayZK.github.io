---
title: 实时数据统计
date: 2020-08-29 15:28:33
layout: about
cover: https://img.paulzzh.tech/touhou/random?99
---

*It takes a strong man to save himself, and a great man to save another.*

*强者自救，圣者渡人*  ————电影肖申克的救赎。

<br/>

## **实时数据统计**

**本页面创立于：**2020年8月29日

**页面成立原因：** 用作博客和博主的一些实时数据统计

**技术支持：**

- **实时代码统计：**[Wakatime](https://wakatime.com/)
- **实时文章热榜：**MongoDB + [Tencent SCF](https://cloud.tencent.com/product/scf)

**更多说明：**

-   [使用Wakatime记录你的Coding数据](https://jasonkayzk.github.io/2020/08/28/使用Wakatime记录你的Coding数据/)

<br/>

### **实时文章热榜**

<div id="hot-list">
<table id="hot-list-table" width="100%">
</table>
<style>
    #hot-list-table {
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
        $("#hot-list-table").append(str);
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