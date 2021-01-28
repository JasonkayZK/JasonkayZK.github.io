---
title: '使用Golang建立一个简单的全文搜索引擎'
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?21'
date: 2020-08-31 15:48:14
categories: [ElasticSearch]
tags: [ElasticSearch, Golang]
description: 全文搜索是我们每天都在不知不觉中使用的工具之一。如果你曾经在google上搜索过“golang coverage report”或试图在电商网站上搜索“indoor wireless camera”，你就会使用全文搜索。全文搜索（FTS, Full-Text Search）是一种在文档集合中搜索文本的技术。文档可以引用网页、报纸文章、电子邮件或任何结构化文本。今天我们尝试建造我们自己的FTS引擎。在这篇文章的最后，我们将能够在不到一毫秒的时间内搜索数百万个文档。我们将从简单的搜索查询开始，比如搜索含有“cat”的文章，然后扩展引擎以支持更复杂的布尔查询。
---

全文搜索是我们每天都在不知不觉中使用的工具之一。如果你曾经在google上搜索过“golang coverage report”或试图在电商网站上搜索“indoor wireless camera”，你就会使用全文搜索

全文搜索（FTS, Full-Text Search）是一种在文档集合中搜文本的技术。文档可以引用网页、报纸文章、电子邮件或任何结构化文本

今天我们尝试建造我们自己的FTS引擎。在这篇文章的最后，我们将能够在不到一毫秒的时间内搜索数百万个文档。我们将从简单的搜索查询开始，比如搜索含有“cat”的文章，然后扩展引擎以支持更复杂的布尔查询

小贴士：最著名的FTS引擎是[Lucene](https://lucene.apache.org/)（以及在此基础上构建的[Elasticsearch](https://github.com/elastic/elasticsearch)和Solr）

本文译自：

-   [Let's build a Full-Text Search engine](https://artem.krylysov.com/blog/2020/07/28/lets-build-a-full-text-search-engine/#querying)

源代码：

-   https://github.com/JasonkayZK/fts-demo

<br/>

<!--more-->

<br/>

## 使用Golang建立一个简单的全文搜索引擎

### 为什么要构造FTS

有的人可能会问：“我们难道不能使用grep，或者使用一个循环来检查每个文档是否包含我要查找的单词吗？”。

是的，我们当然可以。然而，有时候这样做的效率并不是很高；

<BR/>

### 全文搜索资源

我们将搜索英文维基百科摘要的一部分，最新的dump文件可在[dumps.wikimedia.org](https://dumps.wikimedia.org/enwiki/latest/enwiki-latest-abstract1.xml.gz)获取；

到目前为止，解压后的文件大小为913MB，XML文件包含超过60万个文档；

文档实例：

```xml
<title>Wikipedia: Kit-Cat Klock</title>
<url>https://en.wikipedia.org/wiki/Kit-Cat_Klock</url>
<abstract>The Kit-Cat Klock is an art deco novelty wall clock shaped like a grinning cat with cartoon eyes that swivel in time with its pendulum tail.</abstract>
```

<BR/>

### 加载文档

首先我们从下载下来的gz压缩包中直接读取文件：

```go
package main

import (
	"compress/gzip"
	"encoding/xml"
	"os"
)

// Document represents a Wikipedia abstract dump Document.
type Document struct {
	Title string `xml:"title"`
	URL   string `xml:"url"`
	Text  string `xml:"abstract"`
	ID    int
}

// loadDocuments loads a Wikipedia abstract dump and returns a slice of documents.
// Dump example: https://dumps.wikimedia.org/enwiki/latest/enwiki-latest-abstract1.xml.gz
func loadDocuments(path string) ([]Document, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	gz, err := gzip.NewReader(f)
	if err != nil {
		return nil, err
	}
	defer gz.Close()

	dec := xml.NewDecoder(gz)
	dump := struct {
		Documents []Document `xml:"doc"`
	}{}
	if err := dec.Decode(&dump); err != nil {
		return nil, err
	}
	docs := dump.Documents
	for i := range docs {
		docs[i].ID = i
	}
	return docs, nil
}
```

每个加载的文档都会被分配一个唯一的标识符。

为了简单起见，第一个加载的文档分配ID=0，第二个ID=1，依此类推……

<BR/>

### 首次尝试

#### 直接匹配内容

现在我们已经将所有文档加载到内存中，我们可以尝试找到包含“cat”的文档；

首先，让我们遍历所有文档并检查它们是否包含子字符串cat：

```go
package main

import (
	"log"
	"strings"
	"testing"
	"time"
)

func TestSearchContent(t *testing.T) {
	dumpPath := "enwiki-latest-abstract1.xml.gz"
	query := "cat"

	log.Println("Starting")

	start := time.Now()
	docs, err := loadDocuments(dumpPath)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Loaded %d documents in %v", len(docs), time.Since(start))

	start = time.Now()
	matchedDocs := searchContent(docs, query)
	log.Printf("Search found %d documents in %v", len(matchedDocs), time.Since(start))
}

func searchContent(docs []Document, term string) []Document {
	var r []Document
	for _, doc := range docs {
		if strings.Contains(doc.Text, term) {
			r = append(r, doc)
		}
	}
	return r
}
```

最终输出：

```bash
2020/08/31 23:57:28 Starting
2020/08/31 23:58:02 Loaded 613149 documents in 34.0629694s
2020/08/31 23:58:02 Search found 29658 documents in 58.0522ms
```

在我的3700X台式机上，搜索阶段需要58毫秒，还不错；

但是如果查看了输出中的一些文档，可能会注意到该函数与caterpillar和category等包含cat字符的也匹配，但Cat与大写字母C不匹配，这不是我们想要的结果；

所以，我们需要解决两个问题：

-   使搜索不区分大小写（因此Cat也匹配）
-   匹配单词边界而不是子字符串（因此caterpiller和communication不匹配）

<BR/>

#### 正则匹配内容

一个很容易实现这两个需求的解决方案是：使用正则表达式

正则模式在这里：`(?i)\bcat\b:`

-   `(?i)`使正则表达式不区分大小写
-   `\b`匹配单词边界（一边是单词字符，另一边不是单词字符的位置）

下面是测试代码：

```go
package main

import (
	"log"
	"regexp"
	"testing"
	"time"
)

func TestRegexpSearch(t *testing.T) {
	dumpPath := "enwiki-latest-abstract1.xml.gz"
	query := "cat"

	log.Println("Starting")

	start := time.Now()
	docs, err := loadDocuments(dumpPath)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Loaded %d documents in %v", len(docs), time.Since(start))

	start = time.Now()
	matchedDocs := regexpSearch(docs, query)
	log.Printf("Search found %d documents in %v", len(matchedDocs), time.Since(start))
}

func regexpSearch(docs []Document, term string) []Document {
	// Don't do this in production, it's a security risk. term needs to be sanitized.
	re := regexp.MustCompile(`(?i)\b` + term + `\b`)
	var r []Document
	for _, doc := range docs {
		if re.MatchString(doc.Text) {
			r = append(r, doc)
		}
	}
	return r
}
```

输出结果如下：

```bash
2020/09/01 00:17:55 Starting
2020/09/01 00:18:30 Loaded 613149 documents in 34.9838063s
2020/09/01 00:18:33 Search found 292 documents in 2.2390365s
```

可以看到搜索花了2秒多；

随着数据集越来越大，我们需要扫描越来越多的文档；

该算法的时间复杂度是线性的-需要扫描的文档数等于文档总数；

如果我们有600万份文档，而不是60万份，搜索需要20秒！

所以我们需要更优的算法；

<BR/>

### 倒排索引

为了使搜索查询更快，我们将对文本进行预处理并预先建立索引；

FTS的核心是使用一种称为倒排索引的数据结构，倒排索引将文档中的每个单词与包含该单词的文档相关联；

例如：

```go
documents = {
    1: "a donut on a glass plate",
    2: "only the donut",
    3: "listen to the drum machine",
}

index = {
    "a": [1],
    "donut": [1, 2],
    "on": [1],
    "glass": [1],
    "plate": [1],
    "only": [2],
    "the": [2, 3],
    "listen": [3],
    "to": [3],
    "drum": [3],
    "machine": [3],
}
```

下面是一个倒排索引的真实例子：

书名索引书中一个术语引用页码的索引：

![book_index.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/book_index.png)

<BR/>

#### 文本分析器

在开始构建索引之前，我们需要将原始文本分解为一个适合索引和搜索的单词（标记）列表；

文本分析器由一个分词器和多个过滤器组成：

![text_analysis.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/text_analysis.png)

**① 分词器**

分词器是文本分析的第一步：它的工作是将文本转换为标记列表；

我们的实现在单词边界上拆分文本并删除标点符号：

```go
// tokenize returns a slice of tokens for the given text.
func tokenize(text string) []string {
	return strings.FieldsFunc(text, func(r rune) bool {
		// Split on any character that is not a letter or a number.
		return !unicode.IsLetter(r) && !unicode.IsNumber(r)
	})
}

func TestTokenizer(t *testing.T) {
	testCases := []struct {
		text   string
		tokens []string
	}{
		{
			text:   "",
			tokens: []string{},
		},
		{
			text:   "a",
			tokens: []string{"a"},
		},
		{
			text:   "small wild,cat!",
			tokens: []string{"small", "wild", "cat"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.text, func(st *testing.T) {
			assert.EqualValues(st, tc.tokens, tokenize(tc.text))
		})
	}
}
```

例如：

```go
> tokenize("A donut on a glass plate. Only the donuts.")
["A", "donut", "on", "a", "glass", "plate", "Only", "the", "donuts"]
```

****

**② 过滤器**

在大多数情况下，仅仅将文本转换为标记列表是不够的；

为了使文本更易于索引和搜索，我们需要进行额外的规范化；

1.  **小写转换**

为了使搜索不区分大小写，小写过滤器将标记转换为小写；

cAt、cAt和cAt规范化为cat；

稍后，当我们查询索引时，我们也会使用小写作为搜索词，这将使搜索词cAt与文本Cat匹配；

```go
func lowercaseFilter(tokens []string) []string {
    r := make([]string, len(tokens))
    for i, token := range tokens {
        r[i] = strings.ToLower(token)
    }
    return r
}
```

输出如下：

```bash
> lowercaseFilter([]string{"A", "donut", "on", "a", "glass", "plate", "Only", "the", "donuts"}
["a", "donut", "on", "a", "glass", "plate", "only", "the", "donuts"]
```

2.  **删除常用词**

几乎所有的英语文本都包含了像a，I，the或be这样的常用词，这样的词叫做停止语；我们将删除它们，因为几乎所有文档都会匹配停止字。

没有“官方”的停止语列表，我们会把[OEC rank](https://en.wikipedia.org/wiki/Most_common_words_in_English)上前10名排除在外；

你也可以随意添加：

```go
var stopwords = map[string]struct{}{ // I wish Go had built-in sets.
    "a": {}, "and": {}, "be": {}, "have": {}, "i": {},
    "in": {}, "of": {}, "that": {}, "the": {}, "to": {},
}

func stopwordFilter(tokens []string) []string {
    r := make([]string, 0, len(tokens))
    for _, token := range tokens {
        if _, ok := stopwords[token]; !ok {
            r = append(r, token)
        }
    }
    return r
}
```

输出如下：

```bash
> stopwordFilter([]string{"a", "donut", "on", "a", "glass", "plate", "only", "the", "donuts"})
["donut", "on", "glass", "plate", "only", "donuts"]
```

3.  **提取词根**

由于语法规则，文档可能包含同一单词的不同形式，词干分析将单词简化为基本形式；

例如， *fishing*, *fished* 和 *fisher*可以变为基形fish；

实现词干分析器是一项非常复杂的任务，本文暂不讨论它；

我们将使用现有模块[github.com/kljensen/snowball/english](https://github.com/kljensen/snowball)：

```go
import snowballeng "github.com/kljensen/snowball/english"

func stemmerFilter(tokens []string) []string {
    r := make([]string, len(tokens))
    for i, token := range tokens {
        r[i] = snowballeng.Stem(token, false)
    }
    return r
}
```

效果如下：

```BASH
> stemmerFilter([]string{"donut", "on", "glass", "plate", "only", "donuts"})
["donut", "on", "glass", "plate", "only", "donut"]
```

>   **注意：词干并不总是合法的词；**
>
>   例如，一些词干分析器可能会将*airline* 转为 *airlin*；

4.  **整合所有过滤器**

```go
func analyze(text string) []string {
    tokens := tokenize(text)
    tokens = lowercaseFilter(tokens)
    tokens = stopwordFilter(tokens)
    tokens = stemmerFilter(tokens)
    return tokens
}
```

标记器和过滤器可以将句子转换为标记列表：

```BASH
> analyze("A donut on a glass plate. Only the donuts.")
["donut", "on", "glass", "plate", "only", "donut"]
```

下面我们利用这些标记来建立倒排索引；

<BR/>

#### 创建倒排索引

回到倒排索引，它将文档中的每个单词映射到文档id；

内置map是存储映射的一个很好的候选对象；

映射中的键是一个令牌（字符串），值是一个文档ID列表：

```go
type index map[string][]int
```

建立索引包括分析文档并将其ID添加到map中：

```go
func (idx index) add(docs []document) {
    for _, doc := range docs {
        for _, token := range analyze(doc.Text) {
            ids := idx[token]
            if ids != nil && ids[len(ids)-1] == doc.ID {
                // Don't add same ID twice.
                continue
            }
            idx[token] = append(ids, doc.ID)
        }
    }
}

func main() {
    idx := make(index)
    idx.add([]document{{ID: 1, Text: "A donut on a glass plate. Only the donuts."}})
    idx.add([]document{{ID: 2, Text: "donut is a donut"}})
    fmt.Println(idx)
}
```

map中的每个token引用包含该token的文档的ID：

```bash
map[donut:[1 2] glass:[1] is:[2] on:[1] only:[1] plate:[1]]
```

<BR/>

#### 使用倒排索引查询

要查询索引，我们使用索引的相同标记器和过滤器：

```go
func (idx index) search(text string) [][]int {
    var r [][]int
    for _, token := range analyze(text) {
        if ids, ok := idx[token]; ok {
            r = append(r, ids)
        }
    }
    return r
}
```

结果如下：

```bash
> idx.search("Small wild cat")
[[24, 173, 303, ...], [98, 173, 765, ...], [[24, 51, 173, ...]]
```

最后，我们可以找到所有提到cat的文件：检索60万个文档所用时间不到1毫秒（18微秒）！

使用反向索引时，搜索查询的时间复杂度与搜索令牌的数量成线性关系：在上面的示例查询中，除了分析输入文本外，search只需执行三次map查找；

<BR/>

### 多关键字布尔查询

上一节中的查询为每个token返回一个分离的文档列表；

但是，当我们在搜索框中输入`small wild cat`时，我们通常期望找到的是同时包含small、wild和cat的结果列表；

下一步是计算列表之间的集合交集，这样我们将得到一个匹配所有令牌的文档列表：

![venn.png](https://cdn.jsdelivr.net/gh/jasonkayzk/blog_static@master/images/venn.png)

由于我们的倒排索引中的id是按升序排序插入的，所以可以在线性时间内计算两个列表之间的交集：

intersection函数同时迭代两个列表，并收集两个列表中存在的ID：

```go
func intersection(a []int, b []int) []int {
    maxLen := len(a)
    if len(b) > maxLen {
        maxLen = len(b)
    }
    r := make([]int, 0, maxLen)
    var i, j int
    for i < len(a) && j < len(b) {
        if a[i] < b[j] {
            i++
        } else if a[i] > b[j] {
            j++
        } else {
            r = append(r, a[i])
            i++
            j++
        }
    }
    return r
}
```

同时，我们需要更新search函数：

分析给定的查询文本、查找标记并计算ID列表之间的集合交集：

```go
func (idx index) search(text string) []int {
    var r []int
    for _, token := range analyze(text) {
        if ids, ok := idx[token]; ok {
            if r == nil {
                r = ids
            } else {
                r = intersection(r, ids)
            }
        } else {
            // Token doesn't exist.
            return nil
        }
    }
    return r
}
```

通过多关键字查询，我们可以发现，Wikipedia dump只包含同时匹配small、wild和cat的两个文档：

```go
> idx.search("Small wild cat")

130764  The wildcat is a species complex comprising two small wild cat species, the European wildcat (Felis silvestris) and the African wildcat (F. lybica).
131692  Catopuma is a genus containing two Asian small wild cat species, the Asian golden cat (C. temminckii) and the bay cat.
```

<BR/>

### 结论

我们刚刚建立了一个全文搜索引擎，尽管它简单，它可以为更复杂的项目奠定坚实的基础。

以下是一些可以进一步优化的想法：

-   扩展多键值布尔查询以支持OR和NOT；
-   在磁盘上存储索引：
    -   每次重新启动应用程序时重建索引可能需要一段时间；
    -   大索引可能无法放入内存；
-   支持索引多个文档字段；
-   按相关性对结果排序；

## 附录

本文译自：

-   [Let's build a Full-Text Search engine](https://artem.krylysov.com/blog/2020/07/28/lets-build-a-full-text-search-engine/#querying)

源代码：

-   https://github.com/JasonkayZK/fts-demo

<br/>