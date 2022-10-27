# Kubernetes 架构 - 节点与控制面之间的通信

!!! info "章节说明"
    本文对官方文档 [Kubernetes 架构 - 节点与控制面之间的通信](https://kubernetes.io/zh-cn/docs/concepts/architecture/control-plane-node-communication/) 页面进行了排版修改，并未改动文本内容，排版逻辑可参考 [如何贡献](https://github.com/ProjectTAM/100H-K8s/blob/master/CONTRIBUTING.md) 中的书写建议。当前摘录版本：[2C80A24](https://github.com/kubernetes/website/commit/2c80a24f237fe09d05772c704b425499bd8b206a)

本文列举控制面节点（确切说是 API 服务器）和 Kubernetes 集群之间的通信路径。目的是为了让用户能够自定义他们的安装，以实现对网络配置的加固，使得集群能够在不可信的网络上（或者在一个云服务商完全公开的 IP 上）运行

## 节点到控制面

Kubernetes 采用的是中心辐射型（Hub-and-Spoke）API 模式。所有从节点（或运行于其上的 Pod）发出的 API 调用都终止于 API 服务器。其它控制面组件都没有被设计为可暴露远程服务。API 服务器被配置为在一个安全的 HTTPS 端口（通常为 443）上监听远程连接请求，并启用一种或多种形式的客户端 [身份认证](https://kubernetes.io/zh-cn/docs/reference/access-authn-authz/authentication/) 机制。一种或多种客户端 [鉴权机制](https://kubernetes.io/zh-cn/docs/reference/access-authn-authz/authorization/) 应该被启用，特别是在允许使用 [匿名请求](https://kubernetes.io/zh-cn/docs/reference/access-authn-authz/authentication/#anonymous-requests) 或 [服务账户令牌](https://kubernetes.io/zh-cn/docs/reference/access-authn-authz/authentication/#service-account-tokens) 的时候

应该使用集群的公共根证书开通节点，这样它们就能够基于有效的客户端凭据安全地连接 API 服务器。一种好的方法是以客户端证书的形式将客户端凭据提供给 kubelet。请查看 [kubelet TLS 启动引导](https://kubernetes.io/zh-cn/docs/reference/access-authn-authz/kubelet-tls-bootstrapping/) 以了解如何自动提供 kubelet 客户端证书

想要连接到 API 服务器的 Pod 可以使用服务账号安全地进行连接。当 Pod 被实例化时，Kubernetes 自动把公共根证书和一个有效的持有者令牌注入到 Pod 里。`kubernetes` 服务（位于 `default` 名字空间中）配置了一个虚拟 IP 地址，用于（通过 kube-proxy）转发请求到 API 服务器的 HTTPS 末端

控制面组件也通过安全端口与集群的 API 服务器通信

这样，从集群节点和节点上运行的 Pod 到控制面的连接的缺省操作模式即是安全的，能够在不可信的网络或公网上运行

## 控制面到节点

从控制面（API 服务器）到节点有两种主要的通信路径。第一种是从 API 服务器到集群中每个节点上运行的 kubelet 进程。第二种是从 API 服务器通过它的代理功能连接到任何节点、Pod 或者服务

### API 服务器到 kubelet

从 API 服务器到 kubelet 的连接用于：

* 获取 Pod 日志
* 挂接（通过 kubectl）到运行中的 Pod
* 提供 kubelet 的端口转发功能。

这些连接终止于 kubelet 的 HTTPS 末端。默认情况下，API 服务器不检查 kubelet 的服务证书。这使得此类连接容易受到中间人攻击，在非受信网络或公开网络上运行也是 **不安全的**

为了对这个连接进行认证，使用 `--kubelet-certificate-authority` 标志给 API 服务器提供一个根证书包，用于 kubelet 的服务证书

如果无法实现这点，又要求避免在非受信网络或公共网络上进行连接，可在 API 服务器和 kubelet 之间使用 **SSH 隧道**

最后，应该启用 [Kubelet 认证/鉴权](https://kubernetes.io/zh-cn/docs/reference/access-authn-authz/kubelet-authn-authz/) 来保护 kubelet API

### API 服务器到节点、Pod 和服务

从 API 服务器到节点、Pod 或服务的连接默认为纯 HTTP 方式，因此既没有认证，也没有加密。这些连接可通过给 API URL 中的节点、Pod 或服务名称添加前缀 `https:` 来运行在安全的 HTTPS 连接上。不过这些连接既不会验证 HTTPS 末端提供的证书，也不会提供客户端证书。因此，虽然连接是加密的，仍无法提供任何完整性保证。这些连接 **目前还不能安全地** 在非受信网络或公共网络上运行

### SSH 隧道

Kubernetes 支持使用 SSH 隧道来保护从控制面到节点的通信路径。在这种配置下，API 服务器建立一个到集群中各节点的 SSH 隧道（连接到在 22 端口监听的 SSH 服务器）并通过这个隧道传输所有到 kubelet、节点、Pod 或服务的请求。这一隧道保证通信不会被暴露到集群节点所运行的网络之外

!!! warning "说明："
        SSH 隧道目前已被废弃。除非你了解个中细节，否则不应使用。**Konnectivity 服务** 是 SSH 隧道的替代方案

### Konnectivity 服务

**特性状态：** {==Kubernetes v1.18 [beta]==}

作为 SSH 隧道的替代方案，Konnectivity 服务提供 TCP 层的代理，以便支持从控制面到集群的通信。Konnectivity 服务包含两个部分：Konnectivity 服务器和 Konnectivity 代理，分别运行在控制面网络和节点网络中。Konnectivity 代理建立并维持到 Konnectivity 服务器的网络连接。启用 Konnectivity 服务之后，所有控制面到节点的通信都通过这些连接传输

请浏览 [Konnectivity 服务任务](https://kubernetes.io/zh-cn/docs/tasks/extend-kubernetes/setup-konnectivity/) 在你的集群中配置 Konnectivity 服务
