---
title: 【译】BT下载的工作原理
toc: true
cover: 'https://img.paulzzh.com/touhou/random?74'
date: 2020-09-25 22:42:39
categories: 技术杂谈
tags: [技术杂谈, BitTorrent]
description: 之前有写过几篇关于如何下载、部署Aria2并且进行离线BT下载的文章；但是对于BT的基本原理，如何实现的还是不太明白；今天RSS上看到一篇非常好的文章，讲的很清楚，但是是英文的，就翻译了一下，分享给大家；
---

之前有写过几篇关于如何下载、部署Aria2并且进行离线BT下载的文章；但是对于BT的基本原理，如何实现的还是不太明白；

今天RSS上看到一篇非常好的文章，讲的很清楚，但是是英文的，就翻译了一下，分享给大家；

原文链接：

-   [How Does BitTorrent Work? a Plain English Guide](https://skerritt.blog/bit-torrent/)

对于搭建Aria2离线下载服务器感兴趣的可以看我的这几篇文章：

-   [Aria2安装与配置](https://jasonkayzk.github.io/2020/05/01/Aria2安装与配置/)
-   [使用Aria2搭建你自己的离线下载服务器](https://jasonkayzk.github.io/2020/05/02/使用Aria2搭建你自己的离线下载服务器/)
-   [解决Aria2的BT下载速度慢或没速度的问题](https://jasonkayzk.github.io/2020/05/02/解决Aria2的BT下载速度慢或没速度的问题/)

<!--more-->

<br/>

## 【译】BT下载的工作原理

><BR/>
>
>BitTorrent是用于传输大文件的最常见协议之一。2013年2月，BitTorrent占全球所有带宽的3.35％，占文件共享专用总带宽6％的一半以上。-- [3.35% of all worldwide bandwidth](https://blog.paloaltonetworks.com/app-usage-risk-report-visualization/)

本文不会讲解如何通过BT下载文件(这是一个好的客户端需要做的)；

我们之间进入正题，来看一看BT使用到了哪些技术；

任何人都可以阅读这篇文章，即使是那些对于网络或BitTorrent的知识一无所知的读者；

<br/>

### 谁创造了BitTorrent？

 [Bram Cohen](https://en.wikipedia.org/wiki/Bram_Cohen)于2001年发明了BitTorrent协议，并且Cohen用Python编写了第一个客户端实现。

科恩收集了一些免费的不可描述内容，来吸引Beta测试人员在2002年夏天使用BitTorrent。

<br/>

### BT vs 传统CS下载模式

在传统下载中，服务器上传文件，而客户端下载文件。

![bt1.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/bt1.png)

而由于服务器的带宽限制，导致一些热门的文件下载效率变得十分低下，例如：500个人下载同一个文件将使服务器承受巨大压力。这种压力会限制服务器的上传速度，因此客户端无法快速下载文件。

其次，CS模式的成本很高。我们支付的带宽会随着文件的热门程度而增加。

最后，CS模式是中心化的。如果服务器挂了，则这个文件就无法被任何人下载了！

而BT下载致力于解决这些问题：

| **Client-Server**                        | **BitTorrent**                 |
| ---------------------------------------- | ------------------------------ |
| 中心化                                   | 去中心化                       |
| 热门资源限制服务器性能                   | 热门资源无性能限制             |
| 设备费用昂贵；资源热门程度决定了设备开销 | 设备开销不会随着资源热门而变化 |

我们知道，BT下载是通过对等网实现的(peer-to-peer，P2P)；而在对等网络中，每个对等点都连接到网络中的每个其他对等点。

![bt2.svg](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/bt2.svg)



而半中心化的对等网络是：拥有一个或多个权限比其他大多数对等点更高的对等网络。

![bt3.svg](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/bt3.svg)

<br/>

### BitTorrent概述

BitTorrent是一种共享文件的方式，通常用于大型文件。 BitTorrent是单个下载源共享文件（例如服务器）的一种替代方法。并且，BitTorrent可以有效地在较低带宽上工作。

BitTorrent客户端的第一版没有搜索引擎，也没有对等交换，想要上传文件的用户必须创建一个小的torrent描述符文件(*torrent descriptor file*)，然后将其上传到torrent索引站点。

当用户想要共享文件时，他们会将文件做成种子文件(seed their file)。该用户称为做种人(*seeder*)。他们将种子文件上传到交换站点(exchange)（我们稍后再讨论）。想要下载该文件的任何人都将首先下载此种子描述符。

![bt4.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/bt4.png)

我们称呼那些下载用户为对等点(peers)。他们的BT客户端将连接到BT tracker服务器（稍后讨论），并且tracker将向对等点发送种子集群中其他种子和对等点的IP地址列表。此处的集群指的是与某种子相关的所有PC。

种子文件描述符中包含了我们正在下载的文件的tracker服务器和元数据的列表。

![bt5.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/bt5.png)

对等点将会连接到种子对应的IP并下载文件的**一个部分**。

![bt6.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/bt6.png)

当对等点完成下载(一个文件分片)后，它们可以充当种子提供者。虽然，可以在下载种子的同时充当种子提供者（这是很常见的）。

种子被文件共享给对等点后，该对等点也将充当种子提供者。在BitTorrent中，多个人可以上传相同的文件，而对于CS来说，只有一个服务器可以上传文件。

BitTorrent会将文件切分成称为pieces的块，每个块都有固定的大小(最后一个文件除外)。但是切分的块大小是不固定的，有时是256KB，有时是1MB。当每个对等点收到一个块时，它们就成为这个文件块的其他对等点的种子(become a seed of that piece for other peers)。

在使用BitTorrent时，我们没有使用单一的下载源。因此，我们可能会从国内下载一些文件块，然后从国外下载一些国内没有的文件块。

协议会对文件块进行哈希([hashes](https://skerritt.blog/hash-functions/))处理，以确保种子对应的原始文件没有被篡改。然后将哈希值存储在torrent描述符中，并上传至tracker服务器。

这就是BT下载的基本概述了。接下来我会深入讲解BT下载的底层原理。并回答下列问题：

-   如果对等点仅下载文件但从不上传，会发生什么？
-   我们从哪里下载，又在给谁上传？
-   什么是磁力链接( magnet link )？
-   什么是种子描述符( torrent descriptor )？
-   哈希使用到的是什么算法？
-   BT是如何选择下载的文件块的？
-   ……

<br/>

### 种子描述文件中有什么？

种子描述文件是一个字典(dictionary)（或被称为哈希表，HashMap）文件。

文件被定义为：

#### **① 声明(Announce)**

这个字段中包括了tracker服务器的URL。还记得我们之前需要连接tracker服务器来查找使用同一文件的其他对等点吗？我们通过使用torrent描述文件中的announce key来找到tracker服务器。

****

#### **② 信息(Info)**

这个字段映射到了另一个词典列表，而字典列表中的元素个数取决于该种子共享的文件个数。字典列表中的key包括：

-   **Files(Info中的子字典，是一个列表)**：Files仅在共享多个文件时存在，Files中的每个字典对应一个文件。这些列表中的每一个字典都有2个key：
    -   **Length：**文件大小（以字节为单位）。
    -   **Path：**对应于子目录名称的字符串列表，最后一个是实际文件名。

****

#### **③ 共享文件大小(Length)**

文件大小（以字节为单位）（仅在共享一个文件时）

****

#### **④ 文件名(Name)**

建议的文件名。或建议的目录名称。

****

#### **⑤ 文件块大小(Pieces Length)**

单个文件块字节数。

文件块大小必须是2的幂，并且至少为16Kb；

>   <BR/>
>
>   注： 2^8Kb = 256Kb = 262144b



****

#### **⑥ 文件块(Pieces)**

一个存放文件块哈希值的列表：我们将文件数据分成几块。分别计算这些块的哈希值，并将其存储在列表中。

BitTorrent使用SHA-1算法，而SHA-1返回160位的哈希值，所以所有文件块的哈希值都将是一个长度为20个字节的倍数的字符串。

如果单个种子文件中包含了多个文件，则将会按照文件在文件目录中出现的顺序串联起来，形成文件块。

种子中的所有文件块均为完整块长度，只有单个文件中的最后一个块可能较短。

现在，我能猜到你在想什么。

>   <BR/>
>
>   这都0202年了，还在用SHA-1？

我也同意，并且现在BT下载的哈希算法已经慢慢迁移到了SHA265：[BitTorrent is moving from SHA-1 to SHA256.](http://bittorrent.org/beps/bep_0052.html) 

如果你对于种子描述文件的结构还是很困惑也不用担心！我设计了下面这个JSON文件，描述了种子文件的结构。

```json
{
    "Announce": "url of tracker",
    "Info": {
        "Files": [
            {
                "Length": 16,
                "path": "/folder/to/path"
            },
            {
                "length": 193,
                "path": "/another/folder"
            }
        ]
    },
    "length": 192,
    "name":" Ubuntu.iso",
    "Pieces length": 262144,
    "Pieces": [AAF4C61DDCC5E8A2DABEDE0F3B482CD9AEA9434D, CFEA2496442C091FDDD1BA215D62A69EC34E94D0]
}
```

<BR/>

### BT下载中的块选择算法(Piece Selection Algorithm)

BitTorrent下载中最大的问题之一是“我应该选择下载哪些文件？”

对于传统的CS模型，我们将下载整个文件；但是现在，我们需要选择要下载的部分。

 选择一个好的顺序来下载片断，对提高性能非常重要。一个差的文件块选择算法可能导致所有的文件块都处于下载中，或者另一种情况，没有任何一个片段会被上载给其它对等点。

在BT中块选择的算法思想就是：下载其他人没有的文件块，即稀有文件块。通过下载稀有的文件块，我们可以通过上传该块来减少稀有文件块的稀有度。

<BR/>

### 什么是子块(Sub-Pieces)和块选择算法(Piece Selection Algorithm)

BitTorrent使用TCP，一种用于数据包的传输协议。TCP具有一种被称为慢启动([slow start](https://www.isi.edu/nsnam/DIRECTED_RESEARCH/DR_HYUNAH/D-Research/slow-start-tcp.html))的机制。

慢启动是一种平衡TCP网络连接速度的机制。它会逐步增加传输的数据量，直到找到网络的最大承载能力，如下图：

![bt7.svg](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/bt7.svg)

其中，cwdn代表拥塞窗口。

TCP之所以这样做，是因为：如果我们一次发送16个连接请求，可能会导致服务器无法使用该流量，最终网络发生拥塞。所有，如果我们不定期发送数据，则TCP可能会以比正常速度慢的速度限制网络连接。

BitTorrent协议会保证将数据细分为更多的子数据块来发送数据，每个子块的大小约为16KB。一个块的大小不是固定的，但大约为1MB。

同时BitTorrent协议始终有一定数量的请求连接（五个），用于子块管道(sub-piece pipe-lined)。当下载一个新的子块时，客户端将发送一个新请求，从而有助于加快速度。

![bt8.svg](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/bt8.svg)

同时子块可以被其他的对等点下载；

对于块选择算法来说，有两大原则：

-   严格规则(Strict Policy)；
-   稀有度优先(Rarest First)；

#### **① 严格优先级(Strict Policy)**

一旦BitTorrent客户端发起了一个文件块的子块的请求，则该文件块的任何剩余子块都将先于其他文件块的任何子块被请求。 这样，可以尽可能快的获得一个完整的片断。

><BR/>
>
> Once the BitTorrent client requests a sub-piece of a piece, any  remaining sub-pieces of that piece are requested before any sub-pieces  from other pieces. 

![bt9.svg](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/bt9.svg)

在此图中，就是需要先下载该文件块的其他的所有子块，而不是开始下载另一个文件块。

****

#### **② 稀有度优先(Rarest First)**

BitTorrent下载的核心策略就是选择最稀有的文件块(pick the rarest first)，所以我们要下载其他对等点拥有的最少的文件块。

这样我们就可以将那些稀有的文件块变得不再稀有(‘un-rare’)。因为，如果只有一个对等点有这个文件块并且他下线了，则将没有人能够获得完整文件。

这个原则带来了很多好处：

**Ⅰ。提高种子可靠性(Growing the seed)**

首先，选择最稀有的文件块确保了我们仅从种子中下载新的文件块。

例如：稀有种子在一开始会成为下载瓶颈，仅有单个对等点含有该文件快。

而一个下载者可以看到他的对等点拥有哪些文件块，从而最稀有优先原则将使我们从种子中获取那些尚未由其他对等点上传的文件块。

让我们将其可视化：

![bt10.svg](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/bt10.svg)

虽然图中没有画出，但是各个对等点之间也是是相互连接的。

每个指向子文件块的箭头代表该对等点已下载对应内容。所以可以看到，我们已经下载了除了种子没有其他人拥有的子块，这意味着此子块很稀有。

同时可以看到，我们的上传速度高于种子的上传速度，因此所有其他的对等点都希望从我们这里下载。此外，他们也希望首先下载到最稀有的子块，因为我们是最稀有子块的2位持有者之一。

当每个对等点都从我们这里下载时，我们也可以从他们那里更快地下载。这就是针锋相对算法(“tit-for-tat algorithm”)（稍后讨论）。

**Ⅱ。提高下载速度(Increased download speed)**

持有文件块的对等点越多，下载速度就越快。这是因为我们可以从其他对等点那里下载子块。

**Ⅲ。上传支持(Enable uploading)**

稀有文件块是其他对等点最想要的，而获得稀有文件块也意味着对等点会对从我们的上传感兴趣。稍后我们将看到，我们上传的越多，我们可以下载的也越多。

**Ⅳ。最常见的块在最后(Most common last)**

将最常见的文件块留在下载末尾是明智的。由于许多对等点都拥有此文件块，因此能够下载它们的可能性比稀有文件块大得多。

**Ⅴ。避免稀有块丢失(Prevent rarest piece missing)**

当种子提供者断开连接时，稀有度优先原则保证了文件的所有部分都会分配到其余对等点。

****

#### **③ 随机开始下载的第一个文件块(Random First Piece)**

当我们刚下载时，我们还没有任何可以上传的内容，所以我们需要很快的获取到第一块。而此时，稀有度优先原则是很慢的，所以BT协议会随机选择一块开始下载；直到第一块下载并检查完成。此后，“稀有优先”策略才会开始。

****

#### **④ 残局模式(Endgame Mode)**

当(某个块)下载接近完成，但是还需要等待传输速率较慢的对等点上传时，可能会造成下载延迟，从而降低了传输效率。为了防止这种情况，其余的子块是从当前集群中的所有对等点中请求的。

还记得严格原则(Strict-Policy)吗？BT下载时，总是有数个待处理的子块请求：

![bt11.svg](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/bt11.svg)

假设我们正在从2个对等点下载，而还有另外1个我们未从中下载的对等点。

当请求的对等点缺少相应的子块时，BT协议会将请求广播给集群中所有对等点，而这有助于我们获取文件的最后一块。

![bt12.svg](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/bt12.svg)

如果对等点缺少子块，他们会将消息发送回我们。

一旦一个子块到达，我们将发送一条取消消息，告诉其他对等方忽略我们的请求。

![bt13.svg](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/bt13.svg)

<BR/>

### 使用“以牙还牙”算法分配资源

 **以牙还牙**（英语：tit-for-tat）是一个用于[博弈论](https://zh.wikipedia.org/wiki/博弈論)的重复[囚徒困境](https://zh.wikipedia.org/wiki/囚徒困境)（reiterated prisoner's dilemma）非常有效的策略。这策略最先由数学家[阿纳托·拉普伯特](https://zh.wikipedia.org/w/index.php?title=阿納托·拉普伯特&action=edit&redlink=1)（Anatol Rapoport）提出，并在密歇根大学社会学家[罗伯特·阿克塞尔罗](https://zh.wikipedia.org/wiki/羅伯特·阿克塞爾羅)（Robert Axelrod）有关囚徒困境的研究中击败其他方法，脱颖而出，成为解决囚徒困境的最佳策略。

这一策略有两个步骤：

1.  第一个回合选择合作；
2.  下一回合是否选合作要看上一回对方是否合作，若对方上一回背叛，此回合我亦背叛；若对方上一回合作，此回合继续合作；

“以牙还牙”策略有四个特点： 

1.  友善：“以牙还牙”者开始一定采取合作态度，不会背叛对方；
2.  报复性：遭到对方背叛，“以牙还牙”者一定会还击报复；
3.  宽恕：当对方停止背叛，“以牙还牙”者会原谅对方，继续合作；
4.  不羡慕对手：“以牙还牙”者个人永远不会得到最大利益，整个策略以全体的最大利益为依归；

<BR/>

### 阻塞算法(The choking Algorithm)

当一个对等点收到另一个对等点的请求时，它可以选择拒绝向该请求发送文件块(但我们仍然可以从他们那里下载)。如果发生这种情况，则称对方被“choked”了。

当对等点合作时，他们上传文件；而当对等点不合作时，他们“阻塞”了与其他对等点的连接；而原则就是上传文件块给那些已上传给过我们的对等点；

![bt14.svg](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/bt14.svg)

而阻塞算法最终理想的结果就是：同时进行多个双向连接并最终达到帕累托最优(Pareto Efficiency)

>   <BR/>
>
>   如果没有其他分配方式能够使某个人的状况更好也没有一个人的状况更差，那么我们认为分配是帕累托最优的。

因此，最大的问题是，如何确定哪些对等点会被阻塞而哪些不会被阻塞呢？

在默认情况下，客户端将仅保留默认的同时上传数量(max_uploads，max_uploads的默认值为4)，而所有对该客户端的其他请求都将标记为“choked”。

![bt15.png](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/bt15.png)

如上图中，种子阻塞了与对等点的连接，因为它已达到其最大上传数量。此后，对等点将保持阻塞状态，直到发送了取消阻塞消息为止。

而当前的下载速率决定了要取消阻塞对等点。这里以每10秒计算一次最近20秒的下载速率平均值来决定。因为BT下载使用的是TCP协议（慢启动），因此快速阻塞和取消阻塞的效率并不高( 频繁的阻塞和疏通peers造成资源浪费)。

所以，根据这个原则：如果我们的上传速率很高，则会有更多的对等点允许我们从他们那里下载。即，**如果我们是优秀的上传者，我们可以获得更高的下载率(This means that we can get a higher download rate if we are a good uploader)**。这是BitTorrent协议的最重要功能。

><BR/>
>
> 文件下载片断选择是为了提高系统的总效率，而阻塞算法是为了提高个人用户的公平性和效率：作为取自于用户并用之于用户的分布式系统，整个系统的效率和个人用户的公平性至关重要！
>
>BitTorrent的片断下载策略保证了最大的下载效率和稳健的完整性，而阻塞算法鼓励个人用户上传。BitTorrent的阻塞算法并不记录历史，也就是对用户以前的上传、下载行为没有记录。
>
>而有些最近版本的BitTorrent已经能对帐户的上传、下载信息做出统计，然后转化为积分，但积分还没有和用户的下载优先级绑定，而且积分也只是简单的统计上传流量，上传的内容和上传的目标用户也没有分析，简单的积分策略并不能应对五花八门Spamming技术，积分算法应该是上传和下载流量的比数，且积分增加速度随着上传的不同目标用户和不同上传内容数量的增加而增加！

这个协议禁止了许多“搭便车的人(free riders)”，即：只下载但不上传的对等点。这是为了使整个对等网络高效，所以所有对等都需要为网络做出贡献；

><BR/>
>
>除此之外：
>
>对方被阻塞的另一个常见例子是，对等点不需要下载文件块。

同时，为了确保对等点之间的公平，有一个适当的机制确保了各对等点可以轮流下载其他对等点的文件块，这个机制被称为：“开放检测”(optimistic unchoking)。

<BR/>

### 开放检测(optimistic unchoking)

 如果只是简单的为提供最好的下载速率的对等点们提供上传速度，那么就没有办法来发现那些空闲的连接是否比当前正使用的连接更好。

为了解决这个问题，在任何时候，每个对等点都拥有一个被称为“optimistic  unchoking”的连接，这个连接总是保持畅通状态，而不论它的下载速率是怎样的。

每隔30秒，会重新计算一次哪个连接应该是“optimistic  unchoking”。如果此“optimistic  unchoking”连接比当前连接的某个非阻塞的连接下载速率要快，那么这个“optimistic  unchoking”将会取代那个连接；

>   <BR/>
>
>   因为即使是TPC协议，30秒足以让上传能力达到最大，下载能力也相应的达到最大。

“optimistic  unchoking”连接是随机选择的。同时，这也允许了那些不上传并仅下载文件的对等设备下载文件，即使他们拒绝合作（尽管它们将以慢得多的速度下载）

<BR/>

### 反对歧视(Anti-snubbing)

 某些情况下，一个对等点可能会被它所有的对等点都阻塞了，这种情况下，它将会保持较低的下载速率直到通过“optimistic  unchoking”找到了更好peers。

为了减轻这种问题，如果某个对等点在60秒钟内没有收到来自特定对等点的任何文件，则将认为它已被对方对等点 “怠慢”了，于是不再为对方提供上传，除非对方是“optimistic  unchoking”。如果这种情况频繁发生，会导致多于一个的并发的“optimistic unchoking”。  

<BR/>

### 仅上传对等点(Upload Only)

我们看到，使用在BitTorrent中实现的阻塞算法，我们更喜欢对我们友好的对等点。如果我可以从他们那里快速下载，我们也允许他们从我那里快速上传。

但是如果某个对等点完成了下载，它就无法使用此阻塞算法判断要取消阻塞哪些对等点；

此时，将使用新的阻塞算法：不再通过下载速率（因为下载速率已经为0了）来决定为哪些对等点提供上载，而是优先选择那些从它这里得到更好的上载速率的对等点。这样做的理由是可以尽可能的利用上载带宽，从而确保文件块上传速度更快，并且复制速度更快。           

<BR/>

### 什么是跟踪器(Tracker)？

Tracker是一种特殊类型的服务器，可帮助对等点之间进行通信。

BitTorrent中的通信很重要。想一下，我们是如何了解其他对等点的存在的？

Tracker知道文件的拥有者以及拥有量。

但是，当对等下载开始后，就无需Tracker即可继续通信。

实际上，自从为无追踪程序的种子创建分布式哈希表(distributed hash table，DHT)方法以来，BitTorrent Tracker在很大程度上是多余的。

#### 公共Tracker

公共Tracker是任何人都可以使用的Tracker。

海盗湾（Pirate Bay）是最受欢迎的公共Tracker之一，直到2009年其禁用了Tracker，而选择了磁链（即将讨论）。

><BR/>
>
>引自： [The Pirate Bay operated one of the most popular public trackers until disabling it in 2009](https://arstechnica.com/tech-policy/2009/11/pirate-bay-kills-its-own-bittorrent-tracker/)

****

#### 私有Tracker

私人Tracker是私人的，它们通过要求用户在网站上注册来限制使用。

控制注册的方法通常是邀请系统。要使用此类Tracker，我们需要被邀请。

****

#### 多Tracker种子

多Tracker种子是在一个种子文件中包含多个Tracker。如果一个Tracker发生故障，这将提供冗余，其他Tracker可以继续维护种子文件创建的集群。

但是，使用此配置，单个种子可能有多个未互相连接的集群：一些用户可以连接到一个特定的Tracker，而无法连接到另一个，这很糟糕！因为，这会创建很多不相交的集群，这会阻碍torrent传输其描述的文件的效率。

<BR/>

### 磁力链接 - 无Tracker种子(Magnet Links - Trackerless Torrents)

之前，我谈到了Pirate Bay停用了Tracker并开始使用无tracker的种子。

当我们下载种子时，我们会得到该种子的哈希值。要在没有tracker的情况下下载种子，我们需要找到其他也在下载种子的对等点。为此，我们需要使用分布式哈希表(distributed hash table，DHT)。

下面让我们探索分布式哈希表。

<BR/>

### 分布式哈希表(Distributed Hash Tables)和Kademlia协议

分布式哈希表是一种分布式存储方法。这种网络不需要中心节点服务器，而是每个客户端负责一个小范围的路由，并负责存储一小部分资料，从而实现整个DHT网络的定位和存储。和中心节点服务器不同，DHT网络中的各节点并不需要维护整个网络的信息，而是只在节点中存储其临近的后继节点信息，大幅减少了带宽的占用和资源的消耗。DHT网络还在与关键字最接近的节点上复制备份冗余信息，避免了单一节点失效问题。 

 BitTorrent的DHT网络是使用Kademlia协议（以下简称Kad），一个点对点（P2P）的< 键,  值>元组存储和查询系统。

>   <BR/>
>
>   Kad是美国纽约大学的PetarP. Maymounkov和David  Mazieres.在2002年发布的一项研究结果：《Kademlia: A peerto -peer information system  based on the XOR  metric》。
>
>   Kademlia拥有许多的令人惊喜的特点，这些特点是任何以前的P2P系统所无法同时提供的。它减少了节点必须发送的用来相互认识的配置消息的数量。在做键查询的同时,  配置消息将会被自动传播。节点拥有足够的知识和灵活性来通过低时延路径发送查询请求。
>
>   Kademlia使用平行的、异步的查询请求来避免节点失效所带来的超时时延。通过节点记录相互的存在的算法可以抵抗某些基本的拒绝服务（DoS）攻击。 

分布式哈希表为我们提供了类似于字典的接口，但是节点分布在整个网络中。DHT的核心在于：通过散列特定的key可以找到存储对应的特定key的节点。

实际上，这意味着，每个对等点都将成为一个微型tracker(mini-tracker)。

每个节点（实现DHT协议的客户端/服务器）都有一个唯一的标识符，称为“节点ID”(Node Id)。我们从与BitTorrent信息哈希相同的160位空间中随机选择节点ID。

信息哈希(Infohashes)是以下内容的SHA-1哈希：

-    ITEM：文件大小和路径（带文件名的路径）；
-   Name：被索引时的名称；
-   Piece length：单块文件大小；
-   Pieces：该种子文件的每一块的SHA-1哈希值；
-   Private：限制访问标记；

><br/>
>
>关于Infohashes：[What exactly is the info_Hash in a torrent file](https://stackoverflow.com/questions/28348678/what-exactly-is-the-info-hash-in-a-torrent-file)

我们使用距离度量(distance metric)来比较两个节点ID或 一个节点ID和一个infohash的“接近度”(closeness)；

节点必须具有包含其他几个节点的联系信息的路由表。从而，节点在DHT中知道彼此。他们知道许多节点的id与他们自己的很接近，但也有很少节点的id与他们很远。

距离度量是XOR(异或)，被解释为一个整数：

 distance(A,B)=|A⊕B| 

数值越小越接近。

当一个节点想要为一个种子找到对等节点时，他们使用distance metric来比较种子的infohash和路由表中节点的ID，或者一个节点的ID和另一个节点的ID。

然后，他们联系路由表中最靠近infohash的节点，并向他们请求下载种子的对等点的联系信息。

如果这个被联系的节点知道种子的对等点，他们返回对等点的联系信息响应。否则，被联系的节点必须用他的路由表中最靠近infohash的节点来响应请求种子的信息。

![bt16.svg](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/bt16.svg)

原始节点查询更接近infohash的节点，直到找不到更接近的节点为止。在节点完成搜索后，客户端将自己的对等联系信息(peer contact information)插入到与种子信息最接近的id响应节点上。在未来，其他节点可以很容易地找到我们（原始节点）。

对等点查询的返回值包括一个被称为“token”的不透明值(opaque value)。一个节点要宣布它的控制对等点正在下载一个种子，它必须在最近的一次对等查询中展示从同一被查询的对等点接收到的令牌。

当一个节点试图“发布(announce)”一个种子时，被查询的节点会根据查询节点的IP地址检查令牌。这是为了防止恶意主机为种子注册其他主机。(This is to prevent malicious hosts from signing up other hosts for torrents)

查询节点也会将一个令牌返回到他接收令牌的同一个节点。在令牌被分发后，我们必须在一个合理的时间内接受令牌(We must accept tokens for a reasonable amount of time after they have been distributed.)。

BitTorrent对于这个令牌的实现是：使用IP地址和每5分钟更改一次的密码的SHA-1哈希，并且接受最多10分钟以前的令牌。

<br/>

### 路由表(Routing Table)

每个节点都会维护一个已知的好节点(known good nodes)的路由表。我们在DHT中使用路由表起始点(starting points)进行查询，同时我们从路由表返回节点以响应来自其他节点的查询。

并非我们了解的所有节点都是平等的。有些是“好”的，有些则不是。许多使用DHT的节点可以发送查询和接收响应，但是不能响应来自其他节点的查询。并且每个节点的路由表必须只包含已知的好节点(good node)：

一个好的节点是一个节点在过去15分钟内响应了我们的一个查询。如果一个节点在过去15分钟内响应了我们的查询并向我们发送了一个查询，那么它也是一个好节点。

一个节点在15分钟不活动之后，节点就会变得可疑(questionable)。

而当节点无法响应一个或者多个连续的查询时(fail to respond to multiple queries in a row)，它们就会变得糟糕(bad)。

并且我们在查询时良好的节点会优先于状态未知的节点。

![bt17.svg](https://raw.gitmirror.com/JasonkayZK/blog_static/master/images/bt17.svg)

一个路由表覆盖了从0到2^160的整个节点ID空间。我们将路由表细分为“桶(buckets)”，每个桶覆盖部分空间。

一个空表有一个bucket，其ID空间范围为min=0, max=2^160。

空表只有一个bucket，因此任何节点都必须包含在其中。在一个桶变“满(full)*”之前，每个桶只能容纳K个节点，目前是8个。

当一个bucket中已经填满已知的好节点(full of known good nodes)时，我们可以不再添加节点，除非我们自己的节点ID在bucket的范围内。此时，这个桶会被两个桶替换，每个桶都是旧桶的一半。旧桶中的节点被分布在新桶中。

对于只有一个bucket的新表，我们总是将完整的bucket分割为覆盖范围为0 - 2^159 和 2^159 - 2^160。

当桶中满是好的节点时，我们只需丢弃新节点。当桶中的节点变坏(被确认变坏)时，我们才用一个新节点替换它们。

>   <BR/>
>
>   当节点被认为是有问题(questionable)的，并且在过去15分钟内没有任何响应，那么最近最少无响应的节点将被ping。节点响应或不响应。响应意味着我们移动到下一个节点。我们重复这样做，直到找到一个没有响应的节点。
>
>   如果我们没有找到，那么这个桶就被认为是好的。
>
>   当我们确实找到一个节点无响应时，我们会在丢弃该节点并用新的好节点替换它们之前，再尝试ping一次。

同时，每个桶都维护了一个“最后更改(last changed)”属性，以显示其存储内容的“新鲜程度(fresh)”。

当桶中的一个节点被ping并响应，或一个新节点被添加到桶中，或一个节点被另一个节点替换时，将会更新桶的last changed属性。

如果last changed属性在最近15分钟内没有更新，则会刷新bucket。

<br/>

### 攻击BitTorrent

对BitTorrent网络的攻击很少，因为一切都是公开的，比如：我们的IP地址，我们下载的东西等；

有人可能会问，为什么要攻击开放网络？为什么要攻击一个完全开放的网络？

在[Exploit-DB](https://www.exploit-db.com/)上只列出了7个条目，并且大多数都是针对特定的客户。

对BitTorrent网络的主要攻击目的是阻止盗版。我们谈到这里还没有谈到盗版，但它通常是BitTorrent的同义词。

bt的主要攻击手段是bt中毒(Torrent Poisoning)。

#### Torrent Poisoning

这种攻击的目的是获取盗版内容的对等点的IP地址或以某种方式修改文件内容。

麦当娜(Madonna)发行的《Madonna’s American Life》专辑就是内容中毒的一个例子。在发行之前，曲目发行的长度和文件大小类似。歌曲中有一段麦当娜说：

><BR/>
>
>"What the fuck do you think you're doing?"

随后是几分钟的沉默。

下面是一些使种子中毒的方法。

**① Index Poisoning**

索引允许用户定位具有所需内容的对等节点的IP地址。这种攻击方法可以让对等点的搜索变得困难。

攻击者会在索引中插入大量无效信息，以阻止用户找到正确的信息。

其思想是通过让对等点尝试从无效对等点下载片段来减慢下载速度。

**② Decoy Insertion**

他们将文件的损坏版本插入网络。

想象一下，一个文件有500份拷贝，其中只有2份是真正的文件，这会阻止盗版者找到真正的文件。

但是，大多数有种子列表的网站都有投票系统。这阻止了这种攻击，因为搜索的顶部充满了未损坏的文件。

在GameDevTycoon中，损坏的文件是在正版文件上传到盗版网站之前发布的。盗版者不知道的是，文件已经损坏。在盗版游戏中除了无法获得胜利，其他一切都是正常的！

<BR/>

### 防御BitTorrent攻击

最受欢迎的种子是由多年来建立融洽关系的个人或团体发布的。而在私人tracker上，种子的资源可以指向个人。所有，有毒的种子可以很快被贴上标签，从而传播也可以被禁止。

换而言之，在公共tracker上，下载由受信任团体制作的种子更可取。毕竟，你是喜欢从Ubuntu团队下载Ubuntu，还是从用户xxx- hackers - elite - ghost - protocol- xxx下载？

在公共tracker中，如果一个种子是有毒的，该种子会被报告和删除。

防御bt攻击最简单的方法是使用一个与你无关的IP地址，无论这是通过VPN还是其他服务(The simplest way to defend against a BitTorrent attack is to use an IP address not associated with you. Whether this is through a VPN or some other service)。

<br/>

### 总结

通过阅读本文，我想你学到了：

-   什么是BitTorrent；
-   什么是Torrent描述符文件；
-   BitTorrent如何选择对等点；
-   BitTorrent如何选择文件块；
-   严格的优先级（Strict Priority）；
-   最少的优先（Rarest First） 
-   残局模式（Endgame Mode） 
-   阻塞算法（Choking Algorithms） 
-   以牙还牙算法（tit-for-tat）；
-   帕累托效率（Pareto Efficiency） 
-   开放检测（Optimistic Unchoking） 
-   反对歧视（Anti-snubbing） 
-   仅仅上传（Upload Only） 
-   什么是tracker；
-   对BitTorrent网络的攻击；
-   ……

如果你想继续深入了解BitTorrent：

-   [Build your own BitTorrent client](https://allenkim67.github.io/programming/2016/05/04/how-to-make-your-own-bittorrent-client.html)
-   [Explore BitTorrent's proposals (BEPs) to learn more about how it works, and what's next for the algorithm](https://www.bittorrent.org/beps/bep_0000.html)
-   [Read the official BitTorrent specification](https://www.bittorrent.org/beps/bep_0003.html)

<br/>

## 附录

原文链接：

-   [How Does BitTorrent Work? a Plain English Guide](https://skerritt.blog/bit-torrent/)

对于搭建Aria2离线下载服务器感兴趣的可以看我的这几篇文章：

-   [Aria2安装与配置](https://jasonkayzk.github.io/2020/05/01/Aria2安装与配置/)
-   [使用Aria2搭建你自己的离线下载服务器](https://jasonkayzk.github.io/2020/05/02/使用Aria2搭建你自己的离线下载服务器/)
-   [解决Aria2的BT下载速度慢或没速度的问题](https://jasonkayzk.github.io/2020/05/02/解决Aria2的BT下载速度慢或没速度的问题/)

