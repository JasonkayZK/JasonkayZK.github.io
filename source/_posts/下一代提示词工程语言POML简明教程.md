---
title: 下一代提示词工程语言POML简明教程
toc: true
cover: 'https://img.paulzzh.com/touhou/random?29'
date: 2025-08-20 20:39:59
categories: 人工智能
tags: [人工智能, POML, Python]
description: 传统的提示词工程通常涉及编写自由文本，随着应用的发展，提示词文本会变得越来越复杂。从而引出：提示词难以维护、难以进行版本控制、在不同场景下难以重用，几乎不可能进行系统化测试等一系列问题。如何解决这些问题呢？Microsoft给出了一个工程化的答案：POML！
---

传统的提示词工程通常涉及编写自由文本，随着应用的发展，提示词文本会变得越来越复杂。

从而引出：提示词难以维护、难以进行版本控制、在不同场景下难以重用，几乎不可能进行系统化测试等一系列问题。

如何解决这些问题呢？

Microsoft给出了一个工程化的答案：POML！

文章和 Colab 配合，学习效果更佳：

-   https://colab.research.google.com/drive/1RrZyqB16XMvsFBjir90m-NCXE35kWFdy?usp=sharing

<br/>

<!--more-->

# **下一代提示词工程语言POML简明教程**

## **一、简介**

**POML通过引入一种结构化方法，使用类似于 HTML 的格式编写提示词内容；**

**用户无需编写纯文本提示词，而是可以使用 `<role>`、`<task>` 和 `<example>` 等语义组件来组织提示词意图，从而带来更好的 LLM 性能和更便捷的提示词维护。**

**同时，POML具有类似CSS的样式系统，将内容与定义表示分离；**

### **（一）核心架构**

POML采用三层架构运行，分离关注点并支持灵活的提示词开发：

![poml-structure](https://hub.gitmirror.com/raw.githubusercontent.com/JasonkayZK/blog_static/master/images/poml-structure.png)

该架构通过几个阶段处理POML文件：

1.  **解析**：将类似XML的语法转换为结构化的中间表示；
2.  **处理**：应用样式表、解析模板并集成外部数据；
3.  **生成**：以各种格式生成最终的优化提示词；

这种分离使开发者能够在不改变核心逻辑的情况下修改表示样式，无缝集成外部数据源，并在项目中保持一致的提示词结构。

<br/>

### **（二）主要特性**

#### **1、结构化标记系统**

POML使用类似HTML的语法和语义组件，使提示词更具可读性和可维护性。

主要组件包括：

-   `<role>`：定义LLM应采用的角色或身份；
-   `<task>`：指定LLM需要完成的任务；
-   `<example>`：提供少样本学习示例；
-   `<output-format>`：控制预期的响应格式；
-   `<hint>`：提供额外的上下文或约束；

例如：

```xml
<poml>
  <role>You are a patient teacher explaining concepts to a 10-year-old.</role>
  <task>Explain the concept of photosynthesis using the provided image as a reference.</task>
 
  <img src="photosynthesis.png" alt="Diagram of photosynthesis" />
  
  <output-format>
    Keep the explanation simple, engaging, and under 100 words.
    Start with "Hey there, future scientist!".
  </output-format>
</poml>
```

<br/>

#### **2、外部数据集成**

POML通过专用组件来集成外部数据：

-   `<document>`：嵌入文本文件、PDF或Word文档；
-   `<table>`：集成电子表格或CSV文件中的结构化数据
-   `<img>`：包含带有替代文本的图像，用于支持视觉的模型
-   `<audio>`：处理多模态应用的音频文件；

例如：

```xml
<hint captionStyle="header" caption="Background Knowledge">
  <Document src="assets/tom_and_jerry.docx"/>
</hint>
 
<example>
  <input>
    <img src="assets/tom_cat.jpg" alt="The image contains the Tom cat character." syntax="multimedia" />
  </input>
  <output>
    <Document src="assets/tom_introduction.txt"/>
  </output>
</example>
```

<br/>

#### **3、解耦的表示样式**

POML具有类似CSS的样式系统，将内容与表示分离。

例如：

```css
<stylesheet>
  role {
    verbosity: concise;
    format: markdown;
  }
  task {
    emphasis: strong;
  }
</stylesheet>
```

这允许开发者修改详细程度、输出格式和强调等样式方面，而无需改变核心提示词逻辑，显著降低调整提示词时格式漂移的风险。

<br/>

#### **4、模板引擎**

POML包含强大的模板引擎，用于动态提示词生成：

-   变量：`{ { variable_name } }`
-   循环：`<for each="item in items">...</for>`
-   条件：`<if condition="variable > 0">...</if>`
-   定义：`<let name="variable" value="expression" />`

这支持创建数据驱动的提示词，能够适应不同的上下文和输入。

<br/>

### （三）开发生态

POML提供全面的开发工具包，提高生产力：

#### **1、VSCode扩展**

Visual Studio Code扩展提供：

-   语法高亮和语言支持
-   上下文感知的自动补全
-   实时预览功能
-   与LLM提供商的集成测试
-   错误诊断和验证
-   可重用组件的提示词库

<br/>

#### **2、多语言SDK**

POML为Python和TypeScript/JavaScript提供SDK：

**Python SDK:**

```python
from poml import load, render
 
# Load and render a POML file
prompt = load("example.poml")
result = render(prompt, variables={"topic": "photosynthesis"})
```

**TypeScript SDK:**

```typescript
import { loadPoml, renderPoml } from 'pomljs';
 
// Load and render a POML file
const prompt = await loadPoml('example.poml');
const result = await renderPoml(prompt, { topic: 'photosynthesis' });
```

<br/>

## 二、基本使用

### **（一）安装**

Node.js (via npm)：

```shell
npm install pomljs
```

Python (via pip)：

```bash
pip install poml
```

<br/>

### **（二）第一个案例**

#### **1、编写POML文件**

编写一个名为 `example.poml` 的文件，内容如下：

example.poml

```xml
<poml>
  <role>You are a patient teacher(named {{teacher_name}}) explaining concepts to a 10-year-old.</role>
  <task>Explain the concept of photosynthesis using the provided image as a reference.</task>

  <input>
  <img src="photosynthesis.jpg" alt="Diagram of photosynthesis" syntax="multimedia"/>
  </input>
  <output-format>
    Keep the explanation simple, engaging, and under 100 words.
    Start with "Hey there, future scientist!".
  </output-format>
</poml>
```

示例定义了：

-   LLM 的角色和任务，包含一张图片作为上下文，并指定了所需的输出格式。
-   同时，包含了一个变量 `teacher_name`；

编写完成后，如果你安装了 [Visual Studio Code poml](https://marketplace.visualstudio.com/items?itemName=poml-team.poml)  插件，则可以进行预览：

<img src="https://hub.gitmirror.com/raw.githubusercontent.com/JasonkayZK/blog_static/master/images/poml-preview.jpg" width="50%" height="50%" />

<br/>

#### **2、解析并渲染POML**

借助 POML 工具包，此提示词可以轻松渲染为灵活的格式，并可通过 LLM 进行测试。

例如在 Python 中：

```python
from poml import poml
 
# Process a POML file
# result = poml("example.poml")
 
# Process with context variables
result = poml("example.poml", context={"teacher_name": "Jasonkay"})
print(f"Process with context variables: {result}")

# Get OpenAI chat format(Within the higher version)
# messages = poml("example.poml", format="openai_chat")
# print(f"Get OpenAI chat format: {messages}")
```

`poml` 函数接受以下参数：

-   `markup`：POML 内容（字符串或文件路径）
-   `context`：可选的模板注入数据
-   `stylesheet`：可选的样式自定义
-   `format`：输出格式（"dict"、"openai_chat"、"langchain"、"pydantic" 或 "raw"）

执行代码后，输出结果为：

```bash
Process with context variables: [{'speaker': 'system', 'content': '# Role\n\nYou are a patient teacher(named Jasonkay) explaining concepts to a 10-year-old.\n\n# Task\n\nExplain the concept of photosynthesis using the provided image as a reference.'}, {'speaker': 'human', 'content': [{'type': 'image/webp', 'base64': 'UklGRg......', 'alt': 'Diagram of photosynthesis'}, '# Output Format\n\nKeep the explanation simple, engaging, and under 100 words. Start with "Hey there, future scientist!".']}]
```

可以看到，输出的内容将内容进行了渲染！

<br/>

#### **3、与LLM系统集成(Gemini)**

最后，将我们的提示词和外部 LLM 系统相结合！

>   由于目前最新的 POML SDK 还不支持使用 `format` 参数来渲染 `openai_chat` 类型的 Prompt；
>
>   因此，这里使用 Gemini API 来发送图片！

使用下面的 poml 文件来渲染：

example.poml

```xml
<poml>
  <role>You are a patient teacher(named {{teacher_name}}) explaining concepts to a 10-year-old.</role>
  <task>Explain the concept of photosynthesis using the provided image as a reference.</task>

  <output-format>
    Keep the explanation simple, engaging, and under 100 words.
    Start with "Hey there, future scientist!".
  </output-format>
</poml>
```

<br/>

首先安装 Gemini SDK：

```bash
pip install -U google-genai
```

>   **要运行下面的代码，你需要创建一个 Gemini 的 API Key：**
>
>   -   https://aistudio.google.com/app/apikey
>
>   **随后，将下面的 `YOUR_API_KEY` 替换为你生成的 Key！**

```python
from google import genai
from poml import poml
from google.genai import types

 
GEMINI_API_KEY="YOUR_API_KEY"

client = genai.Client(api_key=GEMINI_API_KEY)

# Read the picture
with open('photosynthesis.jpg', 'rb') as f:
    image_bytes = f.read()

# Render the POML file
result = poml("example.poml", context={"teacher_name": "Jasonkay"}, chat=False)
# print(f"Process with context variables: {result}")

response = client.models.generate_content(
    model="gemini-2.5-flash", 
    contents=[
        result,
        types.Part.from_bytes(
          data=image_bytes,
          mime_type='image/jpeg',
      ),
    ]
)
print(response.text)
```

最后，执行即可输出内容：

```
Look at our amazing plant friend! Just like you need food, plants need to eat too! This image shows how they do it, a process called **photosynthesis**. Plants use sunlight from the sun, and "drink" water through their roots. They also breathe in a gas called CO2 (carbon dioxide) from the air, shown by the blue arrow going in. Using these, they make their own sugary food to grow! As a super cool bonus, they release O2 (oxygen) for us to breathe, shown by the blue arrow going out. Amazing, right?
```

<br/>

### **（三）使用样式**

现在，让我们为上面的例子增加相关的样式，来优化的 Prompt 配置！

example-2.poml

```xml
<poml>
  <role>You are a patient teacher(named {{teacher_name}}) explaining concepts to a 10-year-old.</role>
  <task>Explain the concept of photosynthesis using the provided image as a reference.</task>

  <output-format>
    <list listStyle="dash">
        <item className="explanation">Keep the explanation simple, engaging, and under 100 words.</item>
        <item className="greeting">    Start with "Hey there, future scientist!".     </item>
    </list>
  </output-format>
</poml>

<stylesheet>
  {
    ".explanation": {
      "syntax": "json"
    },
    "list" : {
      "whiteSpace": "trim"
    }
  }
</stylesheet>
```

渲染结果如下：

````bash
# Role

You are a patient teacher(named ) explaining concepts to a 10-year-old.

# Task

Explain the concept of photosynthesis using the provided image as a reference.

# Output Format

```json
"Keep the explanation simple, engaging, and under 100 words."
```

- Start with "Hey there, future scientist!".     
````

>   更多内容可以参考官方文档：
>
>   -   https://microsoft.github.io/poml/latest/language/standalone/#stylesheet

<br/>

## **三、深入学习**

在完成了基础学习之后，可以继续阅读下面的内容：

-   [更多官方的案例](https://github.com/microsoft/poml/tree/main/examples)
-   [官方文档](https://microsoft.github.io/poml/latest/)
-   [POML语法结构](https://zread.ai/microsoft/poml/6-poml-syntax-and-structure)
-   [POML中间表示](https://zread.ai/microsoft/poml/8-intermediate-representation)
-   [API参考](https://zread.ai/microsoft/poml/11-api-reference)
-   [外部系统集成](https://zread.ai/microsoft/poml/13-integration-with-external-systems)
-   [自定义组件](https://zread.ai/microsoft/poml/14-custom-component-development)

进行更加深度的学习！

<br/>

# **附录**

文章和 Colab 配合，学习效果更佳：

-   https://colab.research.google.com/drive/1RrZyqB16XMvsFBjir90m-NCXE35kWFdy?usp=sharing

参考文章：

-   https://github.com/microsoft/poml
-   https://zread.ai/microsoft/poml
-   https://microsoft.github.io/poml/latest/
-   https://ai.google.dev/gemini-api/docs/image-understanding

<br/>
