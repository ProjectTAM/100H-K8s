# Kubernetes 架构 - 容器运行时接口（CRI）

!!! info "章节说明"
    本文对官方文档 [Kubernetes 架构 - 容器运行时接口（CRI）](https://kubernetes.io/zh-cn/docs/concepts/architecture/cri/) 页面进行了排版修改，并未改动文本内容（删掉了 **接下来**、**反馈**），排版逻辑可参考 [如何贡献](https://github.com/ProjectTAM/100H-K8s/blob/master/CONTRIBUTING.md) 中的书写建议。当前摘录版本：[5E58C40](https://github.com/kubernetes/website/commit/5e58c40edfcc1bd3c9a960cbdfc77167eb9bb853)

CRI 是一个插件接口，它使 kubelet 能够使用各种容器运行时，无需重新编译集群组件

你需要在集群中的每个节点上都有一个可以正常工作的容器运行时， 这样 kubelet 能启动 Pod 及其容器

容器运行时接口（CRI）是 kubelet 和容器运行时之间通信的主要协议

Kubernetes 容器运行时接口（Container Runtime Interface；CRI）定义了主要 [gRPC](https://grpc.io/) 协议，用于 [集群组件](https://kubernetes.io/zh-cn/docs/concepts/overview/components/#node-components) kubelet 和容器运行时

## API {#api}

**特性状态：** {==Kubernetes v1.23 [stable]==}

当通过 gRPC 连接到容器运行时时，kubelet 充当客户端。运行时和镜像服务端点必须在容器运行时中可用，可以使用 [命令行标志](https://kubernetes.io/zh-cn/docs/reference/command-line-tools-reference/kubelet) 的 `--image-service-endpoint` 和 `--container-runtime-endpoint` 在 kubelet 中单独配置

对 Kubernetes v1.25，kubelet 偏向于使用 CRI `v1` 版本。如果容器运行时不支持 CRI 的 `v1` 版本，那么 kubelet 会尝试协商任何旧的其他支持版本。如果 kubelet 无法协商支持的 CRI 版本，则 kubelet 放弃并且不会注册为节点

## 升级 {#upgrading}

升级 Kubernetes 时，kubelet 会尝试在组件重启时自动选择最新的 CRI 版本。如果失败，则将如上所述进行回退。如果由于容器运行时已升级而需要 gRPC 重拨，则容器运行时还必须支持最初选择的版本，否则重拨预计会失败。这需要重新启动 kubelet
