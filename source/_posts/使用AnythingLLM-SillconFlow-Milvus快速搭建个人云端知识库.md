---
title: 使用AnythingLLM+SillconFlow+Milvus快速搭建个人云端知识库
toc: true
cover: 'https://img.paulzzh.com/touhou/random?2'
date: 2025-01-29 13:49:26
categories: 人工智能
tags: [人工智能, Docker]
description: 最近DeepSeek如火如荼，由于目前我也有自己搭建个人知识库的需求，因此结合最新的一些技术搭建了一下。主要是包括AnythingLLM平台、SillconFlow提供免费的大模型API支持、私有部署的Milvus向量数据库供多个人使用！
---

最近DeepSeek如火如荼，由于目前我也有自己搭建个人知识库的需求，因此结合最新的一些技术搭建了一下。主要是包括：

-   AnythingLLM平台
-   SillconFlow提供免费的大模型API支持
-   私有部署的Milvus向量数据库供多个人使用

源代码：

-   https://github.com/JasonkayZK/docker-repo/blob/master/anything-llm.sh
-   https://github.com/JasonkayZK/docker-repo/tree/milvus-standalone

<br/>

<!--more-->

# **使用AnythingLLM+SillconFlow+Milvus快速搭建个人云端知识库**

环境搭建部分完全使用 Docker：

首先部署 Milvus、然后部署 AnythingLLM 平台，最后注册 SillconFlow 并对平台进行配置。

<br/>

## **部署Milvus**

### **部署**

向量数据库 [milvus](https://github.com/milvus-io/milvus) 的部署比较简单，直接通过 docker-compose 部署即可：

```yaml
version: '3.5'

services:
  etcd:
    container_name: milvus-etcd
    image: quay.io/coreos/etcd:v3.5.16
    restart: unless-stopped
    environment:
      - ETCD_AUTO_COMPACTION_MODE=revision
      - ETCD_AUTO_COMPACTION_RETENTION=1000
      - ETCD_QUOTA_BACKEND_BYTES=4294967296
      - ETCD_SNAPSHOT_COUNT=50000
    volumes:
      - ${DOCKER_VOLUME_DIRECTORY:-.}/volumes/etcd:/etcd
    command: etcd -advertise-client-urls=http://127.0.0.1:2379 -listen-client-urls http://0.0.0.0:2379 --data-dir /etcd
    healthcheck:
      test: ["CMD", "etcdctl", "endpoint", "health"]
      interval: 30s
      timeout: 20s
      retries: 3

  minio:
    container_name: milvus-minio
    image: registry.cn-hangzhou.aliyuncs.com/jasonkay/minio:RELEASE.2023-03-20T20-16-18Z
    restart: unless-stopped
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    ports:
      - "9001:9001"
      - "9000:9000"
    volumes:
      - ${DOCKER_VOLUME_DIRECTORY:-.}/volumes/minio:/minio_data
    command: minio server /minio_data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  standalone:
    container_name: milvus-standalone
    image: registry.cn-hangzhou.aliyuncs.com/jasonkay/milvus:v2.5.4
    restart: unless-stopped
    command: ["milvus", "run", "standalone"]
    security_opt:
    - seccomp:unconfined
    environment:
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    volumes:
      - ${DOCKER_VOLUME_DIRECTORY:-.}/volumes/milvus:/var/lib/milvus
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9091/healthz"]
      interval: 30s
      start_period: 90s
      timeout: 20s
      retries: 3
    ports:
      - "19530:19530"
      - "9091:9091"
    depends_on:
      - "etcd"
      - "minio"

networks:
  default:
    name: milvus
```

>   **镜像使用的是我在阿里云上的，国内也可以直接使用；**

使用：

```shell
docker-compose up -d
```

部署即可；

<br/>

### **配置密码**

部署成功后，Milvus 的默认账号、密码为：

```
root
Milvus
```

可以通过在部署的时候提供配置文件来配置账号密码，也可以部署后通过 Python 脚本部署；

例如：

```python
from pymilvus import MilvusClient

client = MilvusClient(
    uri='http://localhost:19530', # replace with your own Milvus server address
    token="root:Milvus"
)

client.update_password('root', 'Milvus', '<your-new-password>', using='default')

print(client.list_users())
```

>   参考：
>
>   -   https://www.milvus-io.com/adminGuide/authenticate

<br/>

### **备注**

在启动 standalone 类型的服务后， Web 界面会有 etcd unhealthy 的报错。

这个是正常现象，忽略即可；

>   参考：
>
>   -   [milvus-io/milvus#39417](https://github.com/milvus-io/milvus/issues/39417)

<br/>

## **注册SiliconFlow**

SiliconFlow 提供了各种大模型的 API，甚至有许多免费的版本；

可以通过下面的链接注册：

-   https://cloud.siliconflow.cn/i/zA7ywKdU

>   **链接包含我的邀请码，注册后可额外获得 2000w 的 token 额度。**

注册成功后，可以在 [API密钥](https://cloud.siliconflow.cn/account/ak) 生成密钥；

>   **保存，后面会用到！**

<br/>

## **部署AnythingLLM**

### **部署**

可以通过 Docker 直接部署 AnythingLLM：

```bash
export STORAGE_LOCATION=$HOME/workspace/anythingllm && \
mkdir -p $STORAGE_LOCATION && \
touch "$STORAGE_LOCATION/.env" && \
chmod -R 0777 $STORAGE_LOCATION && \
docker run -d -p 3001:3001 \
--restart=unless-stopped \
--name my-anything-llm \
--cap-add SYS_ADMIN \
-v ${STORAGE_LOCATION}:/app/server/storage \
-v ${STORAGE_LOCATION}/.env:/app/server/.env \
-e STORAGE_DIR="/app/server/storage" \
registry.cn-hangzhou.aliyuncs.com/jasonkay/anythingllm:latest
```

这里需要注意：

**Docker挂载目录需要给权限 0777，否则可能会报错无权限（尤其是root用户操作）：**

>   https://github.com/Mintplex-Labs/anything-llm/issues/2564

<br/>

### **配置**

在配置 `LLM 提供商` 时，需要选择：`Generic OpenAI` 才能使用我们在 SiliconFlow 中的模型，随后配置：

-   Base URL：https://api.siliconflow.cn
-   API Key：你上面生成的API密钥
-   Chat Model Name：可在 https://cloud.siliconflow.cn/models 查找免费的模型（例如：`Qwen/Qwen2.5-7B-Instruct`）

<br/>

在配置向量数据库时，可以直接使用 AnythingLLM 中内嵌的 LanceDB，此时无需配置；

当然，也可以使用我们上面已经部署好的 Milvus 数据库；

此时，只需要配置：

-   Milvus DB Address：http://172.17.0.1 （可以使用 Docker 的gateway，也可以用其他的）
-   Username、Password：使用你配置的或者默认的即可！

<br/>

### **加载模型**

上面配置完成后，即可正常使用对话功能；

但是，如果想要通过上传文档、图片等形成个人知识库，则还需要对数据进行向量化等操作，此时需要加载模型；

在没有挂梯子的情况下，在上传文档时会报错：`fetch-failed-on-upload`：

- https://docs.anythingllm.com/fetch-failed-on-upload#windows-visual-c-redistributable
- https://github.com/Mintplex-Labs/anything-llm/issues/821#issuecomment-1968382359

此时大概率是一位模型无法下载；

可以通过手动下载并加载的方式来解决：

>   参考：
>
>   -   https://github.com/JasonkayZK/docker-repo/issues/4

首先，在 `<your-anythingllm-path>/models/` 目录下创建 `Xenova` 目录；

随后下载模型压缩包，并上传到这个目录下：

-   [all-MiniLM-L6-v2.zip](https://github.com/user-attachments/files/18596293/all-MiniLM-L6-v2.zip)

最后解压缩即可：

```bash
unzip all-MiniLM-L6-v2.zip
```

解压缩完成后效果：

```
root@VM-12-16-debian:~/workspace/anythingllm/models/Xenova# tree .
.
└── all-MiniLM-L6-v2
    ├── config.json
    ├── onnx
    │   └── model_quantized.onnx
    ├── tokenizer_config.json
    └── tokenizer.json

2 directories, 4 files
```

<br/>

## **功能测试**

全部部署完成后，可以创建新的工作区，并且在工作区中创建 thread 进行新的对话；

同时在工作区中也可以上传文档，在对话时，AnythingLLM 会首先根据你的问题，在向量数据库中匹配，随后发给大模型作为 prompt 来生成对应回答！

<br/>

## **结语**

除了使用 Docker 来部署 AnythingLLM 之外，也提供了桌面的版本；

Desktop 版本和 Web 版的配置非常类似，这里不再赘述！

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/docker-repo/blob/master/anything-llm.sh
-   https://github.com/JasonkayZK/docker-repo/tree/milvus-standalone

<br/>
