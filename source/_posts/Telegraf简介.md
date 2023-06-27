---
title: Telegraf简介
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?x'
date: 2023-06-27 12:09:27
categories:
tags:
description:
---

Content

<br/>

<!--more-->

# ****

简介
Telegraf 是一个用 Go 编写的代理程序，可收集系统和服务的统计数据，并写入到 InfluxDB 数据库；
官网：
- https://www.influxdata.com/time-series-platform/telegraf/
Telegraf是TICK Stack的一部分，是一个插件驱动的服务器代理，用于收集和报告指标。
Telegraf 集成了直接从其运行的容器和系统中提取各种指标，事件和日志，从第三方API提取指标，甚至通过StatsD和Kafka消费者服务监听指标。
它还具有输出插件，可将指标发送到各种其他数据存储，服务和消息队列，包括InfluxDB，Graphite，OpenTSDB，Datadog，Librato，Kafka，MQTT，NSQ等等。
Telegraf作为数据采集模块，需要安装至被监控的目标主机上。Telegraf设计目标是较小的内存使用，通过插件来构建各种服务和第三方组件的metrics收集；
Telegraf由4个独立的插件驱动：
- Input Plugins：输入插件，收集系统、服务、第三方组件的数据；
- Processor Plugins：处理插件，转换、处理、过滤数据；
- Aggregator Plugins：聚合插件，数据特征聚合；
- Output Plugins：输出插件，写metrics数据；

为什么要用telegraf和influxdb？
- 在数据采集和平台监控系统中，Telegraf 可以采集多种组件的运行信息，而不需要自己手写脚本定时采集，降低数据获取的难度；
- Telegraf 配置简单，只要有基本的 Linux 基础即可快速上手；
- Telegraf 按照时间序列采集数据，数据结构中包含时序信息，influxdb就是为此类数据设计而来，使用 Influxdb 可以针采集得到的数据完成各种分析计算操作；

安装
apt install telegraf
安装完成后，telegraf 创建一个后台的 service，因此可以使用 systemctl 管理：
# 启动命令
systemctl start telegraf
# 重启命令
systemctl restart telegraf

配置
Telegraf 提供了大量的配置，配置文件在： vim /etc/telegraf/telegraf.conf；
配置说明
yum 安装后在 /etc/telegraf 下会生成一个 telegraf.conf 文件
配置文件中可以使用 “$ENV_ITEM” 的形式使用环境变量
下是一项主要的配置项：
global_tags
这里记录的内容将作为 Tags 保存到 InfluxDB 的每个 Item 中；
agent
这一部分内容是数据搜集服务的行为定义；
- interval：所有输入的默认数据收集间隔；
- round_interval：将收集间隔舍入为 interval 例如,如果interval = 10s 则始终收集于:00,:10,:20等；
- metric_batch_size：Telegraf将指标发送到大多数metric_batch_size指标的批量输出；
- metric_buffer_limit：Telegraf将缓存metric_buffer_limit每个输出的指标,并在成功写入时刷新此缓冲区；这应该是倍数，metric_batch_size不能少于2倍metric_batch_size；
- collection_jitter：集合抖动用于随机抖动集合。每个插件在收集之前将在抖动内随机休眠一段时间。这可以用来避免许多插件同时查询sysfs之类的东西，这会对系统产生可测量的影响；
- flush_interval：所有输出的默认数据刷新间隔。最大值flush_interval为flush_interval+flush_jitter
- flush_jitter：将刷新间隔抖动一个随机量。这主要是为了避免运行大量Telegraf实例的用户出现大量写入峰值。例如,flush_jitter 5s和flush_interval 10s 意味着每10-15秒就会发生一次flush；
- precision：默认情况下,precision将设置为与收集时间间隔相同的时间戳顺序,最大值为1s 精度不会用于服务输入,例如logparser和statsd 有效值为 ns,us(或 s)ms,和s；
- logfile：指定日志文件名 空字符串表示要登录stderr；
- debug：在调试模式下运行Telegraf；
- quiet：以安静模式运行Telegraf（仅限错误消息）；
- hostname：覆盖默认主机名，如果为空使用os.Hostname()；
- omit_hostname：如果为true，则不host在Telegraf代理中设置标记；
inputs
输入相关，以下配置参数可用于所有输入：
- interval：收集此指标的频率。普通插件使用单个全局间隔，但是如果一个特定输入应该运行得更少或更频繁，则可以在此处进行配置；
- name_override：覆盖度量的基本名称。（默认为输入的名称）。
- name_prefix：指定附加到度量名称的前缀。
- name_suffix：指定附加到度量名称的后缀。
- tags：要应用于特定输入测量的标签映射。
aggregator
以下配置参数可用于所有聚合器：
- period：刷新和清除每个聚合器的时间段。聚合器将忽略在此时间段之外使用时间戳发送的所有度量标准。
- delay：刷新每个聚合器之前的延迟。这是为了控制聚合器在从输入插件接收度量标准之前等待多长时间，如果聚合器正在刷新并且输入在相同的时间间隔内收集。
- drop_original：如果为true，聚合器将丢弃原始度量标准，并且不会将其发送到输出插件。
- name_override：覆盖度量的基本名称。（默认为输入的名称）。
- name_prefix：指定附加到度量名称的前缀。
- name_suffix：指定附加到度量名称的后缀。
- tags：要应用于特定输入测量的标签映射。
processor
以下配置参数可用于所有处理器：
- order：这是执行处理器的顺序。如果未指定，则处理器执行顺序将是随机的。
measurement filtering （测量过滤）
可以根据输入，输出，处理器或聚合器配置过滤器；
- namepass：一个glob模式字符串数组。仅发出测量名称与此列表中的模式匹配的点。
- fieldpass：一个glob模式字符串数组。仅发出其字段键与此列表中的模式匹配的字段。不适用于输出。
- fielddrop：逆的fieldpass。具有匹配其中一个模式的字段键的字段将从该点中丢弃。不适用于输出。
- tagpass：将标记键映射到glob模式字符串数组的表。仅发出表中包含标记键的点和与其模式之一匹配的标记值。
- tagdrop：逆的tagpass。如果找到匹配，则丢弃该点。这是在通过tagpass测试后的点上测试的。
- taginclude：一个glob模式字符串数组。仅发出具有与其中一个模式匹配的标签键的标签。相反tagpass，它将根据其标记传递整个点，taginclude从该点移除所有不匹配的标记。此滤波器可用于输入和输出，但 建议在输入上使用，因为在摄取点过滤掉标签更有效。
- tagexclude：倒数taginclude。具有与其中一个模式匹配的标记键的标记将从该点被丢弃。
outputs
输出相关；

更多参数见：
- https://docs.influxdata.com/telegraf/v1.16/plugins/

生成配置文件
查看帮助：
telegraf --help
生成配置文件：
telegraf config > telegraf-mysql.conf # 比如在当前目录下生成mysql相关的配置文件
建议生成的配置放置在 /etc/telegraf/telegraf.d目录下
telegraf 支持读取多个配置文件，可将多个配置文件放置在 /etc/telegraf/telegraf.d 目录下
生成指定输入和输出插件的配置文件：
telegraf --input-filter <pluginname>[:<pluginname>] --output-filter <outputname>[:<outputname>] config > telegraf.conf

# 例如，生成带 cpu、memroy、disk、diskio、net 和 influxdb 插件的配置文件 telegraf.conf，指定输出到 influxdb 和 opentsdb
telegraf --input-filter cpu:mem:disk:diskio:net --output-filter influxdb:opentsdb config > telegraf.conf

# 也可使用默认的配置文件
telegraf --input-filter cpu:mem:http_listener --output-filter influxdb config

测试配置是否成功：
# 测试 /etc/telegraf/telegraf.conf 配置文件中输入 cpu 配置是否正确
telegraf  -config /etc/telegraf/telegraf.conf -input-filter cpu -test

# 测试 /etc/telegraf/telegraf.conf 输出 influxdb 配置是否正确
telegraf  -config /etc/telegraf/telegraf.conf -output-filter influxdb -test

# 测试 /etc/telegraf/telegraf.d/mysql.conf 输入 cpu 和 输出 influxdb 配置是否正确
telegraf  -config /etc/telegraf/telegraf.d/mysql.conf -input-filter cpu  -output-filter influxdb -test

配置文件保存修改后，记得要重启 telegraf：
service telegraf restart

查看日志
telegraf 日志目录：/var/log/telegraf/telegraf.log；

使用
使用说明
Telegraf 可以结合 InfluxDB、Kafka 等存储来使用；
在使用时只需要编写相应的配置文件，使用不同的插件进行实现即可；
例如，输入插件：
- input.exec：Exec输入插件将支持的Telegraf输入数据格式(line protocol、JSON、Graphite、Value、Nagios、Collectd和Dropwizard)解析为测量指标。每个Telegraf度量包括度量名称、标记、字段和时间戳；
- inputs.zookeeper：采集 zk 信息；
- inputs.cpu：采集CPU信息；
- ...
输出插件：
- outputs.kafka：将结果写入 Kafka 的 Broker 中；
- outputs.elasticsearch：将结果写入 ES；
- outputs.file：将结果写入文件；
通过定义对应的插件逻辑，即可完成对指标的采集；

使用实例1：CPU信息采集
编写配置文件
创建 /etc/telegraf/telegraf.d/cpu.conf：
[global_tags]
    ip = "127.0.0.1"

[agent]
  interval = "5s"
  round_interval = true
  metric_batch_size = 1000
  metric_buffer_limit = 10000
  collection_jitter = "0s"
  flush_interval = "5s"
  flush_jitter = "0s"
  precision = "1ms"
  logtarget = "file"
  logfile = "/tmp/telegraf-cpu.log"
  logfile_rotation_max_size = "10MB"
  logfile_rotation_max_archives = 10
  hostname = ""
  omit_hostname = false

[[inputs.cpu]]
  ## Whether to report per-cpu stats or not
  percpu = true
  ## Whether to report total system cpu stats or not
  totalcpu = true
  ## If true, collect raw CPU time metrics.
  collect_cpu_time = false
  ## If true, compute and report the sum of all non-idle CPU states.
  report_active = false


[[outputs.file]]
  ## Files to write to, "stdout" is a specially handled file.
  files = ["stdout", "/tmp/metrics.out"]

  ## Use batch serialization format instead of line based delimiting.  The
  ## batch format allows for the production of non line based output formats and
  ## may more efficiently encode and write metrics.
  # use_batch_format = false

  ## The file will be rotated after the time interval specified.  When set
  ## to 0 no time based rotation is performed.
  # rotation_interval = "0h"

  ## The logfile will be rotated when it becomes larger than the specified
  ## size.  When set to 0 no size based rotation is performed.
  # rotation_max_size = "0MB"

  ## Maximum number of rotated archives to keep, any older logs are deleted.
  ## If set to -1, no archives are removed.
  # rotation_max_archives = 5

  ## Data format to output.
  ## Each data format has its own unique set of configuration options, read
  ## more about them here:
  ## https://github.com/influxdata/telegraf/blob/master/docs/DATA_FORMATS_OUTPUT.md
  data_format = "json"
具体的 input、output 插件参数可以参考：
- https://github.com/influxdata/telegraf/blob/release-1.16/plugins/inputs/cpu/README.md
- https://github.com/influxdata/telegraf/lob/release-1.16/plugins/outputs/file/README.md
主要实现的功能就是每5秒钟采集 CPU 信息，并以 JSON 格式输出到文件中！

校验配置文件
可以使用 telegraf -config xxx.config -test 来校验：
telegraf -config cpu.conf -test

2023-05-22T06:30:06Z I! Starting Telegraf 1.21.4+ds1-0ubuntu2
> cpu,cpu=cpu0,host=ubuntu,ip=127.0.0.1 usage_guest=0,usage_guest_nice=0,usage_idle=100,usage_iowait=0,usage_irq=0,usage_nice=0,usage_softirq=0,usage_steal=0,usage_system=0,usage_user=0 1684737007400000000
> cpu,cpu=cpu1,host=ubuntu,ip=127.0.0.1 usage_guest=0,usage_guest_nice=0,usage_idle=100,usage_iowait=0,usage_irq=0,usage_nice=0,usage_softirq=0,usage_steal=0,usage_system=0,usage_user=0 1684737007400000000
> cpu,cpu=cpu2,host=ubuntu,ip=127.0.0.1 usage_guest=0,usage_guest_nice=0,usage_idle=100,usage_iowait=0,usage_irq=0,usage_nice=0,usage_softirq=0,usage_steal=0,usage_system=0,usage_user=0 1684737007400000000
> cpu,cpu=cpu3,host=ubuntu,ip=127.0.0.1 usage_guest=0,usage_guest_nice=0,usage_idle=100,usage_iowait=0,usage_irq=0,usage_nice=0,usage_softirq=0,usage_steal=0,usage_system=0,usage_user=0 1684737007400000000
> cpu,cpu=cpu4,host=ubuntu,ip=127.0.0.1 usage_guest=0,usage_guest_nice=0,usage_idle=100,usage_iowait=0,usage_irq=0,usage_nice=0,usage_softirq=0,usage_steal=0,usage_system=0,usage_user=0 1684737007400000000
> cpu,cpu=cpu5,host=ubuntu,ip=127.0.0.1 usage_guest=0,usage_guest_nice=0,usage_idle=100,usage_iowait=0,usage_irq=0,usage_nice=0,usage_softirq=0,usage_steal=0,usage_system=0,usage_user=0 1684737007400000000
> cpu,cpu=cpu6,host=ubuntu,ip=127.0.0.1 usage_guest=0,usage_guest_nice=0,usage_idle=100,usage_iowait=0,usage_irq=0,usage_nice=0,usage_softirq=0,usage_steal=0,usage_system=0,usage_user=0 1684737007400000000
> cpu,cpu=cpu7,host=ubuntu,ip=127.0.0.1 usage_guest=0,usage_guest_nice=0,usage_idle=100,usage_iowait=0,usage_irq=0,usage_nice=0,usage_softirq=0,usage_steal=0,usage_system=0,usage_user=0 1684737007400000000
> cpu,cpu=cpu8,host=ubuntu,ip=127.0.0.1 usage_guest=0,usage_guest_nice=0,usage_idle=100,usage_iowait=0,usage_irq=0,usage_nice=0,usage_softirq=0,usage_steal=0,usage_system=0,usage_user=0 1684737007400000000
检验没有问题后，重启 telegraf 服务：
systemctl restart telegraf

查看输出
cat /tmp/metrics.out

{"fields":{"active":234635264,"available":68976783360,"available_percent":98.43237993042763,"buffered":20967424,"cached":475803648,"commit_limit":39332610048,"committed_as":390959104,"dirty":0,"free":69279043584,"high_free":0,"high_total":0,"huge_page_size":2097152,"huge_pages_free":0,"huge_pages_total":0,"inactive":306810880,"low_free":0,"low_total":0,"mapped":129556480,"page_tables":1888256,"shared":737280,"slab":101105664,"sreclaimable":48656384,"sunreclaim":52449280,"swap_cached":0,"swap_free":4294963200,"swap_total":4294963200,"total":70075297792,"used":299483136,"used_percent":0.42737333330917343,"vmalloc_chunk":0,"vmalloc_total":35184372087808,"vmalloc_used":20594688,"write_back":0,"write_back_tmp":0},"name":"mem","tags":{"host":"ubuntu","ip":"127.0.0.1"},"timestamp":1684736700}
{"fields":{"boot_time":1684724406,"context_switches":1591707,"entropy_avail":256,"interrupts":1575945,"processes_forked":1567},"name":"kernel","tags":{"host":"ubuntu","ip":"127.0.0.1"},"timestamp":1684736700}
{"fields":{"free":4294963200,"total":4294963200,"used":0,"used_percent":0},"name":"swap","tags":{"host":"ubuntu","ip":"127.0.0.1"},"timestamp":1684736700}
{"fields":{"in":0,"out":0},"name":"swap","tags":{"host":"ubuntu","ip":"127.0.0.1"},"timestamp":1684736700}
{"fields":{"load1":0,"load15":0,"load5":0,"n_cpus":16,"n_users":1},"name":"system","tags":{"host":"ubuntu","ip":"127.0.0.1"},"timestamp":1684736700}
{"fields":{"uptime":12294},"name":"system","tags":{"host":"ubuntu","ip":"127.0.0.1"},"timestamp":1684736700}
......

使用实例2：system-monitor
在实际项目中也用到了 telegraf，让我们来看看是如何使用的；
实际的配置文件如下：
[global_tags]
  ip = "$CUR_IP"

[agent]
  interval = "60s"
  round_interval = true
  metric_batch_size = 1000
  metric_buffer_limit = 10000
  collection_jitter = "0s"
  flush_interval = "5s"
  flush_jitter = "0s"
  precision = "1ms"
  # debug = true
  # quiet = false
  logtarget = "file"
  logfile = "/ibnsdata/mscp/telegraf/logs/telegraf.log"
  # logfile_rotation_interval = "0d"
  logfile_rotation_max_size = "10MB"
  logfile_rotation_max_archives = 10
  hostname = ""
  omit_hostname = false

[[inputs.exec]]
   interval = "$CHECK_RELOAD_INTERVAL"
   commands = [
     "python /ibnsdata/mscp/telegraf/scripts/check_reload.py"
   ]
   timeout = "$CHECK_RELOAD_INTERVAL"

[[outputs.kafka]]
   # Kafka 集群的地址列表。
   brokers = [{{ TELEGRAF_KAFKA_BROKERS_STRING }}]
   # 数据写入的 Kafka 主题名称，此处设置为 "system-monitor"。
   topic = "system-monitor"
   # 可选的标签，用于添加到每个输出的数据点中，其值设置为上述 "system-monitor" 主题，该标签将始终存在于指标集中。
   topic_tag = "topic"
   # 可选的标志，确定是否要将 'topic' 标签从写入 Kafka 的数据中排除掉。在这里，设置为 true 是将该标签排除的意思
   exclude_topic_tag = true
   # 可选的标签，用于基于路由键向不同的主题发送数据。在此，通过选择一个名为 "ip" 的字段作为路由健来将数据分配到不同的主题中。
   routing_tag = "ip"
   # 指定了用于压缩传输数据的编解码器类型，其中 1 表示使用 Gzip 编解码器进行压缩
   compression_codec = 1
   # 指定了数据的格式，这里设置为 JSON 格式
   data_format = "json"
   # 用于指定时间戳的单位，1ms 表示时间戳以毫秒为单位
   json_timestamp_units = "1ms"
通过 inputs、outputs 可以看到：
- 输入主要是通过执行 python 脚本；
- 输出写入到 Kafka 中；

check_reload 主要是检测是否具有新增的采集配置（telegraf.d 目录下），如果有则重启服务，增加新配置，而具体的每个参数采集都在 telegraf.d 下！

参考文章
- https://www.cnblogs.com/imyalost/p/9873621.html
- https://ephrain.net/telemetry-%E4%BD%BF%E7%94%A8-telegraf-%E5%92%8C-influxdb%EF%BC%8C%E8%A8%98%E9%8C%84%E7%B3%BB%E7%B5%B1%E8%B3%87%E6%BA%90%E4%BD%BF%E7%94%A8%E9%87%8F/
- https://www.cnblogs.com/duanxz/p/10432512.html
- https://blog.fleeto.us/post/telegraf-monitor/


<br/>

# **附录**


<br/>
