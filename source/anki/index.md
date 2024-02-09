---
title: Anki笔记
layout: about
date: 2024-02-09 18:39:08
cover: 'https://img.paulzzh.com/touhou/random?100'
toc: true
---

*Le vent se lve, il faut tenter de vivre.*

*風立ちぬ、いざ生きめやも* ———— 《風立ちぬ》

<br/>

# **Anki笔记**

**本页面创立于：**2024年2月9日

**页面成立原因：** 记录Anki学习进度

**技术支持：**

- **Anki官网：**[AnkiWeb](https://ankiweb.net/)
- **存储实现：**[DoltDB](https://www.dolthub.com/repositories/jasonkayzk/sync)


<br/>

# **学习记录**

<div id="content"></div>

<script>
    const MAX_CONTENT_LENGTH = 50;

    function truncateString(str, maxLength) {
        if (str.length <= maxLength) {
            return str;  // 如果字符串长度小于等于 maxLength，则返回完整字符串
        }
        return str.substring(0, maxLength) + "...";  // 否则，返回截取的子串
    }

    // 获取当前日期
    function getCurrentDateStr(currentDate) {
        // 获取年份、月份和日期
        var year = currentDate.getFullYear();
        var month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        var day = currentDate.getDate().toString().padStart(2, '0');

        // 格式化日期为 "YYYY-MM-DD"
        var formattedDate = year + '-' + month + '-' + day;
        return formattedDate;
    }

    function shiftTimezone(dateString) {
        const dateObj = new Date(dateString);

        // 根据时区调整时间
        const timeZoneOffset = 8; // 设置东八区时间偏移量
        const utc = dateObj.getTime(); // 获取日期对象的 UTC 时间
        const chinaTime = new Date(utc + (3600000 * timeZoneOffset)); // 根据偏移量计算中国时间
        
        // 获取年份、月份、日期、小时、分钟和秒钟
        const year = chinaTime.getFullYear();
        const month = String(chinaTime.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始，所以要加 1；使用padStart()方法确保两位数格式
        const day = String(chinaTime.getDate()).padStart(2, '0');
        const hours = String(chinaTime.getHours()).padStart(2, '0');
        const minutes = String(chinaTime.getMinutes()).padStart(2, '0');
        const seconds = String(chinaTime.getSeconds()).padStart(2, '0');

        // 格式化为年月日时分秒的形式
        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        // 输出中国东八区时间
        return formattedDate;
    }

    // 创建一个表格的函数
    function createTable(container, data) {
        if (data.length <= 0) {
            var p = document.createElement("p");
            p.textContent = "这个人有点懒，今日无数据～";
            container.appendChild(p);
            container.appendChild(document.createElement("br"));
            return;
        }

        // 创建表格
        var table = document.createElement("table");

        // 创建表头
        var thead = document.createElement("thead");
        var tr = document.createElement("tr");

        var th1 = document.createElement("th");
        th1.textContent = "内容";
        var th2 = document.createElement("th");
        th2.textContent = "时间";

        tr.appendChild(th1);
        tr.appendChild(th2);
        thead.appendChild(tr);

        // 创建表身
        var tbody = document.createElement("tbody");
        for (var i = 0; i < data.length; i++) {
            var tr = document.createElement("tr");
            var td1 = document.createElement("td");
            td1.textContent = shiftTimezone(data[i].insert_time);
            var td2 = document.createElement("td");
            td2.textContent = truncateString(data[i].content, MAX_CONTENT_LENGTH);
            td2.setAttribute('style', 'text-align: left;');

            tr.appendChild(td1);
            tr.appendChild(td2);
            tbody.appendChild(tr);
        }

        // 添加表头和表身到表格
        table.appendChild(thead);
        table.appendChild(tbody);

         // 将表格添加到页面中
        container.appendChild(table);
        container.appendChild(document.createElement("br"));
    }

    async function getData(currentDate) {
        var requestOptions = {
            method: 'GET',
            redirect: 'follow'
        };
        try {
            const response = await fetch(`https://www.dolthub.com/api/v1alpha1/jasonkayzk/sync/main?q=select insert_time,content from anki where insert_date='${currentDate}'`, requestOptions); // 发起网络请求
            const result = await response.json(); // 解析响应数据
            var rows = result["rows"];
            if (rows !== undefined && rows.length !== undefined && rows.length > 0) {
                return rows;
            } else {
                return [];
            }
        } catch (error) {
            console.log(error);
        }
    }

    async function createContainer() {
        // 获取当前日期
        var currentDate = new Date();

        // 获取最近一个星期的日期
        var recentWeekDates = [];
        for (var i = 6; i >= 0; i--) {
            var date = new Date(currentDate);
            date.setDate(date.getDate() - i);
            recentWeekDates.push(getCurrentDateStr(date));
        }

        // 获取容器
        var container = document.getElementById('content');

        // 将日期输出为 H2 标签和列表
        for (var j = recentWeekDates.length-1; j >= 0; j--) {
            var dateElement = document.createElement('h2');
            dateElement.textContent = recentWeekDates[j];
            container.appendChild(dateElement);
            // 创建表格
            var rows = await getData(recentWeekDates[j]);
            createTable(container, rows);
        }
    }

    createContainer().then(resolve => console.log(resolve)).catch(error => console.log('error', error));
</script>

<br/>

