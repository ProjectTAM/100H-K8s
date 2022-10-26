# Kubernetes 组件

!!! info "章节说明"
    本文对官方文档 [Kubernetes 组件](https://kubernetes.io/zh-cn/docs/concepts/overview/components/#node-components) 页面进行了排版修改，并对文本中的书写错误进行了修改，排版逻辑可参考 [如何贡献](https://github.com/ProjectTAM/100H-K8s/blob/master/CONTRIBUTING.md) 中的书写建议。当前摘录版本：[9318636](https://github.com/kubernetes/website/commit/931863635e9d7540e08026e78a722e02fed259e8)

当你部署完 Kubernetes，便拥有了一个完整的集群

一组工作机器，称为节点，会运行容器化应用程序。每个集群至少有一个工作节点

工作节点会托管 Pod，而 Pod 就是作为应用负载的组件。控制平面管理集群中的工作节点和 Pod。在生产环境中，控制平面通常跨多台计算机运行，一个集群通常运行多个节点，提供容错性和高可用性

本文档概述了一个正常运行的 Kubernetes 集群所需的各种组件

![Kubernetes 集群的组件](/assets/images/docs/chapter03-01.svg)

## 控制平面组件（Control Plane Components）

控制平面组件会为集群做出全局决策，比如资源的调度。以及检测和响应集群事件，例如当不满足部署的 `replicas` 字段时，要启动新的 pod

控制平面组件可以在集群中的任何节点上运行。然而，为了简单起见，设置脚本通常会在同一个计算机上启动所有控制平面组件，并且不会在此计算机上运行用户容器。请参阅 [使用 kubeadm 构建高可用性集群](/zh-cn/docs/setup/production-environment/tools/kubeadm/high-availability/) 中关于跨多机器控制平面设置的示例

### kube-apiserver

API 服务器是 Kubernetes 控制平面的组件，该组件负责公开 Kubernetes API [^1]，负责处理接受请求的工作。API 服务器是 Kubernetes 控制平面的前端

Kubernetes API 服务器的主要实现是 [kube-apiserver](https://kubernetes.io/zh-cn/docs/reference/command-line-tools-reference/kube-apiserver/)。`kube-apiserver` 设计上考虑了水平扩缩，也就是说，它可通过部署多个实例来进行扩缩。你可以运行 `kube-apiserver` 的多个实例，并在这些实例之间平衡流量

### etcd

一致且高度可用的键值存储，用作 Kubernetes 的所有集群数据的后台数据库

如果你的 Kubernetes 集群使用 etcd 作为其后台数据库，请确保你针对这些数据有一份 [备份](https://kubernetes.io/zh-cn/docs/tasks/administer-cluster/configure-upgrade-etcd/#backing-up-an-etcd-cluster) 计划

你可以在官方 [文档](https://etcd.io/docs/) 中找到有关 etcd 的深入知识

### kube-scheduler

`kube-scheduler` 是控制平面的组件，负责监视新创建的、未指定运行节点（node）的 Pods，并选择节点来让 Pod 在上面运行

调度决策考虑的因素包括单个 Pod 及 Pods 集合的资源需求、软硬件及策略约束、亲和性及反亲和性规范、数据位置、工作负载间的干扰及最后时限

### kube-controller-manager

[kube-controller-manager](https://kubernetes.io/zh-cn/docs/reference/command-line-tools-reference/kube-controller-manager/) 是控制平面的组件，负责运行控制器进程

从逻辑上讲，每个控制器都是一个单独的进程，但是为了降低复杂性，它们都被编译到同一个可执行文件，并在同一个进程中运行

这些控制器包括：

* 节点控制器（Node Controller）：负责在节点出现故障时进行通知和响应
* 任务控制器（Job Controller）：监测代表一次性任务的 Job 对象，然后创建 Pods 来运行这些任务直至完成
* 端点控制器（Endpoints Controller）：填充端点（Endpoints）对象（即加入 Service 与 Pod）
* 服务帐户和令牌控制器（Service Account & Token Controllers）：为新的命名空间创建默认帐户和 API 访问令牌

### cloud-controller-manager

一个 Kubernetes 控制平面组件，嵌入了特定于云平台的控制逻辑。云控制器管理器（Cloud Controller Manager）允许你将你的集群连接到云提供商的 API 之上，并将与该云平台交互的组件同与你的集群交互的组件分离开来

`cloud-controller-manager` 仅运行特定于云平台的控制器。因此如果你在自己的环境中运行 Kubernetes，或者在本地计算机中运行学习环境，所部署的集群不需要有云控制器管理器

与 `kube-controller-manager` 类似，`cloud-controller-manager` 将若干逻辑上独立的控制回路组合到同一个可执行文件中，供你以同一进程的方式运行。你可以对其执行水平扩容（运行不止一个副本）以提升性能或者增强容错能力

下面的控制器都包含对云平台驱动的依赖：

* 节点控制器（Node Controller）：用于在节点终止响应后检查云提供商以确定节点是否已被删除
* 路由控制器（Route Controller）：用于在底层云基础架构中设置路由
* 服务控制器（Service Controller）：用于创建、更新和删除云提供商负载均衡器

## Node 组件

节点组件会在每个节点上运行，负责维护运行的 Pod 并提供 Kubernetes 运行环境

### kubelet

`kubelet` 会在集群中每个节点（node）上运行。它保证容器（containers）都运行在 Pod 中

kubelet 接收一组通过各类机制提供给它的 PodSpecs，确保这些 PodSpecs 中描述的容器处于运行状态且健康。kubelet 不会管理不是由 Kubernetes 创建的容器

### kube-proxy

[kube-proxy](https://kubernetes.io/zh-cn/docs/reference/command-line-tools-reference/kube-proxy/) 是集群中每个节点（node）所上运行的网络代理，实现 Kubernetes 服务（Service）概念的一部分

kube-proxy 维护节点上的一些网络规则，这些网络规则会允许从集群内部或外部的网络会话与 Pod 进行网络通信

如果操作系统提供了可用的数据包过滤层，则 kube-proxy 会通过它来实现网络规则。否则，kube-proxy 仅做流量转发

### 容器运行时（Container Runtime）

容器运行环境是负责运行容器的软件

Kubernetes 支持许多容器运行环境，例如 containerd、CRI-O 以及 [Kubernetes CRI (容器运行环境接口)](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-node/container-runtime-interface.md) 的其他任何实现

## 插件（Addons）

插件使用 Kubernetes 资源（DaemonSet、 Deployment 等）实现集群功能。因为这些插件提供集群级别的功能，插件中命名空间域的资源属于 kube-system 命名空间

下面描述众多插件中的几种。有关可用插件的完整列表，请参见 [插件（Addons）](https://kubernetes.io/zh-cn/docs/concepts/cluster-administration/addons/)

### DNS

尽管其他插件都并非严格意义上的必需组件，但几乎所有 Kubernetes 集群都应该有 [集群 DNS](https://kubernetes.io/zh-cn/docs/concepts/services-networking/dns-pod-service/)，因为很多示例都需要 DNS 服务

集群 DNS 是一个 DNS 服务器，和环境中的其他 DNS 服务器一起工作，它为 Kubernetes 服务提供 DNS 记录

Kubernetes 启动的容器自动将此 DNS 服务器包含在其 DNS 搜索列表中

### Web 界面（仪表盘）

[Dashboard](https://kubernetes.io/zh-cn/docs/tasks/access-application-cluster/web-ui-dashboard/) 是 Kubernetes 集群的通用的、基于 Web 的用户界面。它使用户可以管理集群中运行的应用程序以及集群本身，并进行故障排除

### 容器资源监控

[容器资源监控](https://kubernetes.io/zh-cn/docs/tasks/debug/debug-cluster/resource-usage-monitoring/) 将关于容器的一些常见的时间序列度量值保存到一个集中的数据库中，并提供浏览这些数据的界面

### 集群层面日志

[集群层面日志](https://kubernetes.io/zh-cn/docs/concepts/cluster-administration/logging/) 机制负责将容器的日志数据保存到一个集中的日志存储中，这种集中日志存储提供搜索和浏览接口

[^1]:原文描述“该组件负责公开了 Kubernetes API” 修改为 “该组件负责公开 {--了--} Kubernetes API”
