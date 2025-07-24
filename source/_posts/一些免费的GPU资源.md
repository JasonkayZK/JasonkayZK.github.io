---
title: 一些免费的GPU资源
toc: true
cover: 'https://img.paulzzh.com/touhou/random?43'
date: 2025-07-24 15:37:04
categories: 工具分享
tags: [工具分享, 人工智能]
description: 在学习AI时，经常需要用到GPU资源；而有些时候我们手头并没有老黄的显卡，或者显卡已经不支持进行人工智能的学习了；本文总结了一些常用的GPU资源；同时，后续也会在博客更新一些和并行计算、人工智能相关的内容，敬请期待！
---

在学习AI时，经常需要用到GPU资源；而有些时候我们手头并没有老黄的显卡，或者显卡已经不支持进行人工智能的学习了；

本文总结了一些常用的GPU资源；

同时，后续也会在博客更新一些和并行计算、人工智能相关的内容，敬请期待！

<br/>

<!--more-->

# **一些免费的GPU资源**

## **一、Google Colab（推荐）**

网址：

-   https://colab.research.google.com/notebooks/

特点：

-   提供 **NVIDIA T4/P100/V100/A100**（具体型号随机分配）；
-   免费用户每天最多可使用 12 小时（可能因资源调度而中断）；
-   可升级至 **Colab Pro（9.99 美元/月）**或 **Colab Pro+（49.99 美元/月）**，享受更长运行时间和优惠优先级；
-   集成 Jupyter Notebook 环境，适合深度学习和机器学习任务

<br/>

## **二、Kaggle**

网址：

-   https://www.kaggle.com/

特点：

-   **GPU小时数**：每周30小时。
-   **GPU**：提供Tesla P100，与Google Colab的T4相当。
-   **使用质量**：非常好，很少断连。
-   **CPU和内存**：提供四个CPU和29GB RAM。
-   **易用性**：易用，有类似笔记本的界面。
-   **存储**：无持久性存储。

<br/>

## **三、Paperspace Gradient**

网址：

-   https://www.paperspace.com/

特点：

-   **GPU小时数**：无具体限制，质量不佳。
-   **存储**：有持久性存储，数据不会丢失。
-   **GPU**：提供M4000 GPU，质量低于Google Colab的T4。

<br/>

## **四、其他**

### **1、AWS Sagemaker Studio Lab**

特点：

-   **GPU小时数**：每天4小时，CPU小时数12小时。
-   **GPU**：提供T4 GPU，与Google Colab相同。
-   **使用质量**：非常好，很少断连。
-   **易用性**：需要在网站上注册。
-   **存储**：有持久性存储。

<br/>

### **2、Lightning AI**

网址：

-   https://lightning.ai/

特点：

-   **GPU小时数**：每月22小时。
-   **CPU**：提供一个Studio，4个CPU完全免费。
-   **使用质量**：非常好，连接稳定。
-   **易用性**：非常好，提供VS Code界面。

<br/>

### **3、百度 AI Studio**

网址：

-   https://aistudio.baidu.com/index

特点：

-   免费提供 GPU 运行环境，支持常见型号（如 T4、P40 等，具体配置可能随时调整）；
-   集成 PaddlePaddle 以及 TensorFlow、PyTorch 等主流深度学习框架；
-   类似 Jupyter Notebook 的在线编程环境，适合快速上手、学习和实验；

<br/>

### **4、云平台注册赠费**

-   **Google Cloud Free Tier**
    -   新用户可获得 300 美元免费试用额度（90 天内有效），体验包括 GPU 实例在内的众多云服务
    -   用户可自行创建 NVIDIA T4/V100/A100 GPU 实例（需手动配置）
    -   适用于大规模机器学习和 AI 训练
    -   注册时需绑定信用卡，但试用期间不会产生扣费
-   **Microsoft Azure Free Tier**
    -   新用户可获得 200 美元免费试用额度（30 天内有效），支持 GPU 虚拟机（如 NC/ND 系列）
    -   适用于 AI 深度学习训练和企业级应用开发
    -   需要信用卡验证，但试用期间不收费
-   **AWS Free Tier（Amazon Web Services）**
    -   免费层主要提供 750 小时 t2.micro 实例（不含 GPU），部分新用户可额外申请 GPU 实例（如 p3/g4 系列）
    -   提供 Amazon SageMaker 平台，支持机器学习项目的快速部署
    -   注册需绑定信用卡，确保试用过程不产生费用

>   其他资源：
>
>   -   https://www.reddit.com/r/KoboldAI/comments/13taldr/google_colabs_possible_alternatives/
>   -   https://deepnote.com/compare/alternatives/colab

<br/>

# **附录**

参考文章：

-   https://zhuanlan.zhihu.com/p/1906295351289308808
-   https://www.bilibili.com/read/cv34465418/
-   https://www.reddit.com/r/KoboldAI/comments/13taldr/google_colabs_possible_alternatives/
-   https://deepnote.com/compare/alternatives/colab


<br/>
