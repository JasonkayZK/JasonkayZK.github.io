---
title: 在k3s集群上部署ClickHouse集群
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?33'
date: 2022-10-25 08:38:34
categories: ClickHouse
tags: [ClickHouse, k3s, Kubernetes]
description: ClickHouse是一个用于联机分析(OLAP)的列式数据库管理系统(DBMS)，由俄罗斯搜索引擎Yandex开源；本文在前文搭建了k3s集群的基础之上，部署ClickHouse；
---

ClickHouse是一个用于联机分析(OLAP)的列式数据库管理系统(DBMS)，由俄罗斯搜索引擎Yandex开源；

本文在前文 [《单机部署autok3s》](https://jasonkayzk.github.io/2022/10/22/单机部署autok3s/) 搭建了k3s集群的基础之上，部署ClickHouse；

clickhouse-operator repo：

-   https://github.com/Altinity/clickhouse-operator

clickhouse-operator文档：

-   https://docs.altinity.com/clickhouseonkubernetes/kubernetesquickstartguide/quickcluster/

ClickHouse文档：

-   https://clickhouse.com/docs/zh/

<br/>

<!--more-->

# **在k3s集群上部署ClickHouse集群**

## **安装clickhouse-operator**

如果直接部署 ClickHouse 集群，需要手动修改一些配置，比较麻烦；

我们可以借助：[clickhouse-operator](https://github.com/Altinity/clickhouse-operator) 来管理和部署 ClickHouse 集群；

>   **通常情况下，xxx-operator 都提供了一系列组件，例如：**
>
>   -   **Cluster 定义：通过 CRD（`CustomResourceDefinition`）定义 `Cluster` 等自定义资源，使得 Kubernetes 世界认识该 Cluster 并让其与 `Deployment`、`StatefulSet` 一同享受 Kubernetes 的头等公民待遇；**
>   -   **控制器`xxx-controller-manager`：包含一组自定义控制器，控制器通过循环不断比对被控制对象的期望状态与实际状态，并通过自定义的逻辑驱动被控制对象达到期望状态（类似于K8S中的Controller）；**
>   -   **调度器`scheduler`：通常情况下，调度器是一个 Kubernetes 调度器扩展，它为 Kubernetes 调度器注入集群特有的调度逻辑，如：为保证高可用，任一 Node 不能调度超过集群半数以上的实例等；**
>
>   **[tidb](https://github.com/pingcap/tidb) 也提供了对应的：[tidb-operator](https://github.com/pingcap/tidb-operator)！**

因此，在部署 ClickHouse 之前，我们应当先安装 [clickhouse-operator](https://github.com/Altinity/clickhouse-operator)；

可以使用配置文件直接安装：

```bash
kubectl apply -f https://github.com/Altinity/clickhouse-operator/raw/0.18.3/deploy/operator/clickhouse-operator-install-bundle.yaml
```

>   **上面在应用配置时指定了版本为 `0.18.3`，这也是官方推荐的方式；**

>   **同时注意：**
>
>   **如果还存在使用 clickhouse-operator 部署的Click House，此时不要使用 `kubectl delete` 删除 operator！**
>
>   详见：
>
>   -   [Altinity/clickhouse-operator#830](https://github.com/Altinity/clickhouse-operator/issues/830)

上面的命令执行成功后会输出：

```
customresourcedefinition.apiextensions.k8s.io/clickhouseinstallations.clickhouse.altinity.com created
customresourcedefinition.apiextensions.k8s.io/clickhouseinstallationtemplates.clickhouse.altinity.com created
customresourcedefinition.apiextensions.k8s.io/clickhouseoperatorconfigurations.clickhouse.altinity.com created
serviceaccount/clickhouse-operator created
clusterrole.rbac.authorization.k8s.io/clickhouse-operator-kube-system created
clusterrolebinding.rbac.authorization.k8s.io/clickhouse-operator-kube-system created
configmap/etc-clickhouse-operator-files created
configmap/etc-clickhouse-operator-confd-files created
configmap/etc-clickhouse-operator-configd-files created
configmap/etc-clickhouse-operator-templatesd-files created
configmap/etc-clickhouse-operator-usersd-files created
deployment.apps/clickhouse-operator created
service/clickhouse-operator-metrics created
```

表示成功创建了一系列资源：

-   [Altinity Kubernetes Operator Resources](https://docs.altinity.com/clickhouseonkubernetes/kubernetesoperatorguide/operatorresources/)

我们可以通过命令查看：

```bash
$ kubectl -n kube-system get po | grep click
clickhouse-operator-857c69ffc6-njw97      2/2     Running     0          33h
```

下面通过 `clickhouse-operator` 安装 ClickHouse；

<br/>

## **安装ClickHouse**

首先创建一个 namespace：

```bash
$ kubectl create ns my-ch

namespace/my-ch created
```

随后声明资源：

sample01.yaml

```yaml
apiVersion: "clickhouse.altinity.com/v1"
kind: "ClickHouseInstallation"
metadata:
  name: "demo-01"
spec:
  configuration:
    clusters:
      - name: "demo-01"
        layout:
          shardsCount: 1
          replicasCount: 1
```

这里就用到了我们在之前安装 clickhouse-operator 时加载的组件配置；

随后直接应用配置：

```bash
$ kubectl apply -n my-ch -f sample01.yaml

clickhouseinstallation.clickhouse.altinity.com/demo-01 created
```

即可成功部署：

```bash
$ kubectl -n my-ch get chi -o wide
NAME      VERSION   CLUSTERS   SHARDS   HOSTS   TASKID                                 STATUS      UPDATED   ADDED   DELETED   DELETE   ENDPOINT
demo-01   0.18.1    1          1        1       6d1d2c3d-90e5-4110-81ab-8863b0d1ac47   Completed             1                          clickhouse-demo-01.test.svc.cluster.local
```

同时可以查看服务：

```bash
NAME                      TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)                         AGE
chi-demo-01-demo-01-0-0   ClusterIP      None           <none>        8123/TCP,9000/TCP,9009/TCP      2s
clickhouse-demo-01        LoadBalancer   10.111.27.86   <pending>     8123:31126/TCP,9000:32460/TCP   19s
```

此时可以通过进入容器连接：

```bash
$ kubectl -n my-ch exec -it chi-demo-01-demo-01-0-0-0 -- clickhouse-client
ClickHouse client version 22.1.3.7 (official build).
Connecting to localhost:9000 as user default.
Connected to ClickHouse server version 22.1.3 revision 54455.

chi-demo-01-demo-01-0-0-0.chi-demo-01-demo-01-0-0.my-ch.svc.cluster.local :)
```

同时也可以远程连接，默认账号、密码：

-   Default Username: `clickhouse_operator`
-   Default Password: `clickhouse_operator_password`

<br/>

## **升级集群为2个分片**

Copy sample01.yaml 为 sample02.yaml：

sample02.yaml

```yaml
apiVersion: "clickhouse.altinity.com/v1"
kind: "ClickHouseInstallation"
metadata:
  name: "demo-01"
spec:
  configuration:
    clusters:
      - name: "demo-01"
        layout:
          shardsCount: 2
          replicasCount: 1
```

**注意：由于我们没有改 name 配置，所以k8s知道我们是在更新配置；**

应用最新配置：

```bash
kubectl apply -n my-ch -f sample02.yaml

clickhouseinstallation.clickhouse.altinity.com/demo-01 configured
```

此时我们有了两个分片：

```bash
$ kubectl get service -n my-ch
NAME                      TYPE           CLUSTER-IP     EXTERNAL-IP                                   PORT(S)                         AGE
clickhouse-demo-01        LoadBalancer   10.43.93.132   172.19.0.2,172.19.0.3,172.19.0.4,172.19.0.5   8123:30842/TCP,9000:31655/TCP   33h
chi-demo-01-demo-01-0-0   ClusterIP      None           <none>                                        8123/TCP,9000/TCP,9009/TCP      33h
chi-demo-01-demo-01-1-0   ClusterIP      None           <none>                                        8123/TCP,9000/TCP,9009/TCP      33h
```

查看集群信息：

```bash
$ kubectl -n my-ch exec -it chi-demo-01-demo-01-0-0-0 -- clickhouse-client
ClickHouse client version 22.1.3.7 (official build).
Connecting to localhost:9000 as user default.
Connected to ClickHouse server version 22.1.3 revision 54455.

chi-demo-01-demo-01-0-0-0.chi-demo-01-demo-01-0-0.my-ch.svc.cluster.local :) SELECT * FROM system.clusters
                                                                             

SELECT *
FROM system.clusters

Query id: 587358e9-aeed-4df0-abe7-ee32543c418c

┌─cluster─────────────────────────────────────────┬─shard_num─┬─shard_weight─┬─replica_num─┬─host_name───────────────┬─host_address─┬─port─┬─is_local─┬─user────┬─default_database─┬─errors_count─┬─slowdowns_count─┬─estimated_recovery_time─┐
│ all-replicated                                  │         1 │            1 │           1 │ chi-demo-01-demo-01-0-0 │ 127.0.0.1    │ 9000 │        1 │ default │                  │            0 │               0 │                       0 │
│ all-replicated                                  │         1 │            1 │           2 │ chi-demo-01-demo-01-1-0 │ 10.42.1.15   │ 9000 │        0 │ default │                  │            0 │               0 │                       0 │
│ all-sharded                                     │         1 │            1 │           1 │ chi-demo-01-demo-01-0-0 │ 127.0.0.1    │ 9000 │        1 │ default │                  │            0 │               0 │                       0 │
│ all-sharded                                     │         2 │            1 │           1 │ chi-demo-01-demo-01-1-0 │ 10.42.1.15   │ 9000 │        0 │ default │                  │            0 │               0 │                       0 │
│ demo-01                                         │         1 │            1 │           1 │ chi-demo-01-demo-01-0-0 │ 127.0.0.1    │ 9000 │        1 │ default │                  │            0 │               0 │                       0 │
│ demo-01                                         │         2 │            1 │           1 │ chi-demo-01-demo-01-1-0 │ 10.42.1.15   │ 9000 │        0 │ default │                  │            0 │               0 │                       0 │
│ test_cluster_one_shard_three_replicas_localhost │         1 │            1 │           1 │ 127.0.0.1               │ 127.0.0.1    │ 9000 │        1 │ default │                  │            0 │               0 │                       0 │
│ test_cluster_one_shard_three_replicas_localhost │         1 │            1 │           2 │ 127.0.0.2               │ 127.0.0.2    │ 9000 │        0 │ default │                  │            0 │               0 │                       0 │
│ test_cluster_one_shard_three_replicas_localhost │         1 │            1 │           3 │ 127.0.0.3               │ 127.0.0.3    │ 9000 │        0 │ default │                  │            0 │               0 │                       0 │
│ test_cluster_two_shards                         │         1 │            1 │           1 │ 127.0.0.1               │ 127.0.0.1    │ 9000 │        1 │ default │                  │            0 │               0 │                       0 │
│ test_cluster_two_shards                         │         2 │            1 │           1 │ 127.0.0.2               │ 127.0.0.2    │ 9000 │        0 │ default │                  │            0 │               0 │                       0 │
│ test_cluster_two_shards_internal_replication    │         1 │            1 │           1 │ 127.0.0.1               │ 127.0.0.1    │ 9000 │        1 │ default │                  │            0 │               0 │                       0 │
│ test_cluster_two_shards_internal_replication    │         2 │            1 │           1 │ 127.0.0.2               │ 127.0.0.2    │ 9000 │        0 │ default │                  │            0 │               0 │                       0 │
│ test_cluster_two_shards_localhost               │         1 │            1 │           1 │ localhost               │ ::1          │ 9000 │        1 │ default │                  │            0 │               0 │                       0 │
│ test_cluster_two_shards_localhost               │         2 │            1 │           1 │ localhost               │ ::1          │ 9000 │        1 │ default │                  │            0 │               0 │                       0 │
│ test_shard_localhost                            │         1 │            1 │           1 │ localhost               │ ::1          │ 9000 │        1 │ default │                  │            0 │               0 │                       0 │
│ test_shard_localhost_secure                     │         1 │            1 │           1 │ localhost               │ ::1          │ 9440 │        0 │ default │                  │            0 │               0 │                       0 │
│ test_unavailable_shard                          │         1 │            1 │           1 │ localhost               │ ::1          │ 9000 │        1 │ default │                  │            0 │               0 │                       0 │
│ test_unavailable_shard                          │         2 │            1 │           1 │ localhost               │ ::1          │    1 │        0 │ default │                  │            0 │               0 │                       0 │
└─────────────────────────────────────────────────┴───────────┴──────────────┴─────────────┴─────────────────────────┴──────────────┴──────┴──────────┴─────────┴──────────────────┴──────────────┴─────────────────┴─────────────────────────┘

19 rows in set. Elapsed: 0.001 sec.
```

可以看到，通过 clickhouse-operator 安装 ClickHouse 是非常简单的！

>   更多关于安装：
>
>   -   https://docs.altinity.com/clickhouseonkubernetes/kubernetesquickstartguide/

<br/>

# **附录**

clickhouse-operator repo：

-   https://github.com/Altinity/clickhouse-operator

clickhouse-operator文档：

-   https://docs.altinity.com/clickhouseonkubernetes/kubernetesquickstartguide/quickcluster/

ClickHouse文档：

-   https://clickhouse.com/docs/zh/


<br/>
