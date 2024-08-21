---
title: Python项目Linter、Formatter和Github-Actions配置
toc: true
cover: 'https://img.paulzzh.com/touhou/random?9'
date: 2024-08-21 15:26:53
categories: 技术杂谈
tags: [技术杂谈]
description: 关于Python项目的一些配置问题，包括：Linter、Formatter和Github-Actions配置；
---

关于Python项目的一些配置问题，包括：

-   Linter
-   Formatter
-   Github-Actions配置；

源代码：

-   https://github.com/JasonkayZK/python-learn

<br/>

<!--more-->

# **Python项目Linter、Formatter和Github-Actions配置**

## **Linter**

Linter 使用的是 PyCharm 自带的，符合 PEP8 规范；

也可以使用：

-   flake8
-   pylint

<br/>

## **Formatter**

直接用  isort 和 black 就可以了：

-   https://github.com/psf/black
-   https://github.com/pycqa/isort

<br/>

## **项目配置**

Pre-Commit：

.pre-commit-config.yaml

```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.1.0
    hooks:
      - id: black
  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort
```

<br/>

PyProject：

pyproject.toml

```toml
[tool.isort]
profile = "black"
```

<br/>

依赖配置：

requirements.txt

```text
-e .[all]

...
```

requirements-dev.txt

```text
-r requirements.txt

# Ci
black
isort
```

<br/>

Github Actions:

.github/workflows/ci.yaml

```yaml
name: CI

on:
  workflow_dispatch:
  push:
  pull_request:


jobs:
  lint_and_test:
    runs-on: ubuntu-latest
    strategy:
      max-parallel: 4
      matrix:
        python-version: ['3.10', '3.11', '3.12']
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python ${{ matrix.python-version }}
        id: setup_python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: 'pip'
          cache-dependency-path: 'requirements-dev.txt'
      - name: Install dependencies
        run: |
          pip install -r requirements-dev.txt
      - name: Run lint
        uses: pre-commit/action@v2.0.0
```

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/python-learn

参考：

-   https://v2ex.com/t/587696
-   https://github.com/psf/black
-   https://github.com/pycqa/isort


<br/>
