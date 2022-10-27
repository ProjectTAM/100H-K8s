# Kubernetes 架构 - 云控制器管理器

!!! info "章节说明"
    本文对官方文档 [Kubernetes 架构 - 云控制器管理器](https://kubernetes.io/zh-cn/docs/concepts/architecture/cloud-controller/) 页面进行了排版修改，并未改动文本内容（删掉了 **接下来**、**反馈**），排版逻辑可参考 [如何贡献](https://github.com/ProjectTAM/100H-K8s/blob/master/CONTRIBUTING.md) 中的书写建议。当前摘录版本：[3B77C73](https://github.com/kubernetes/website/commit/3b77c73288920d74056e541ce28f9ad53d155413)

**特性状态：** {==Kubernetes v1.11 [beta]==}

使用云基础设施技术，你可以在公有云、私有云或者混合云环境中运行 Kubernetes。Kubernetes 的信条是基于自动化的、API 驱动的基础设施，同时避免组件间紧密耦合

组件 cloud-controller-manager 是指云控制器管理器，一个 Kubernetes 控制平面组件，嵌入了特定于云平台的控制逻辑。云控制器管理器（Cloud Controller Manager）允许你将你的集群连接到云提供商的 API 之上，并将与该云平台交互的组件同与你的集群交互的组件分离开来

通过分离 Kubernetes 和底层云基础设置之间的互操作性逻辑，cloud-controller-manager 组件使云提供商能够以不同于 Kubernetes 主项目的步调发布新特征

cloud-controller-manager 组件是基于一种插件机制来构造的，这种机制使得不同的云厂商都能将其平台与 Kubernetes 集成

## 设计 {#design}

![Kubernetes 组件](/assets/images/docs/chapter02-04-01.svg)

云控制器管理器以一组多副本的进程集合的形式运行在控制面中，通常表现为 Pod 中的容器。每个 `cloud-controller-manager` 在同一进程中实现多个控制器

!!! note "说明："
    你也可以用 Kubernetes 插件的形式而不是控制面中的一部分来运行云控制器管理器

## 云控制器管理器的功能 {#functions-of-the-ccm}

云控制器管理器中的控制器包括：

### 节点控制器 {#node-controller}

节点控制器负责在云基础设施中创建了新服务器时为之更新节点（Node）对象。节点控制器从云提供商获取当前租户中主机的信息。节点控制器执行以下功能：

1. 使用从云平台 API 获取的对应服务器的唯一标识符更新 Node 对象
2. 利用特定云平台的信息为 Node 对象添加注解和标签，例如节点所在的区域（Region）和所具有的资源（CPU、内存等等）
3. 获取节点的网络地址和主机名
4. 检查节点的健康状况。如果节点无响应，控制器通过云平台 API 查看该节点是否已从云中禁用、删除或终止。如果节点已从云中删除，则控制器从 Kubernetes 集群中删除 Node 对象

某些云驱动实现中，这些任务被划分到一个节点控制器和一个节点生命周期控制器中

### 路由控制器 {#route-controller}

Route 控制器负责适当地配置云平台中的路由，以便 Kubernetes 集群中不同节点上的容器之间可以相互通信

取决于云驱动本身，路由控制器可能也会为 Pod 网络分配 IP 地址块

### 服务控制器 {#service-controller}

服务（Service）与受控的负载均衡器、IP 地址、网络包过滤、目标健康检查等云基础设施组件集成。服务控制器与云驱动的 API 交互，以配置负载均衡器和其他基础设施组件。你所创建的 Service 资源会需要这些组件服务

## 鉴权 {#authorization}

本节分别讲述云控制器管理器为了完成自身工作而产生的对各类 API 对象的访问需求

### 节点控制器 {#authorization-node-controller}

节点控制器只操作 Node 对象。它需要读取和修改 Node 对象的完全访问权限

`v1/Node`：

- Get
- List
- Create
- Update
- Patch
- Watch
- Delete

### 路由控制器 {#authorization-route-controller}

路由控制器会监听 Node 对象的创建事件，并据此配置路由设施。
它需要读取 Node 对象的 Get 权限。

`v1/Node`：

- Get

### 服务控制器 {#authorization-service-controller}

服务控制器监测 Service 对象的 Create、Update 和 Delete 事件，并配置对应服务的 Endpoints 对象（对于 EndpointSlices，kube-controller-manager 按需对其进行管理）

为了访问 Service 对象，它需要 List 和 Watch 访问权限。为了更新 Service 对象，它需要 Patch 和 Update 访问权限

为了能够配置 Service 对应的 Endpoints 资源，它需要 Create、List、Get、Watch 和 Update 等访问权限

`v1/Service`：

- List
- Get
- Watch
- Patch
- Update

### 其他 {#authorization-miscellaneous}

在云控制器管理器的实现中，其核心部分需要创建 Event 对象的访问权限，并创建 ServiceAccount 资源以保证操作安全性的权限

`v1/Event`：

- Create
- Patch
- Update

`v1/ServiceAccount`：

- Create

用于云控制器管理器 RBAC 的 ClusterRole 如下例所示：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cloud-controller-manager
rules:
- apiGroups:
  - ""
  resources:
  - events
  verbs:
  - create
  - patch
  - update
- apiGroups:
  - ""
  resources:
  - nodes
  verbs:
  - '*'
- apiGroups:
  - ""
  resources:
  - nodes/status
  verbs:
  - patch
- apiGroups:
  - ""
  resources:
  - services
  verbs:
  - list
  - patch
  - update
  - watch
- apiGroups:
  - ""
  resources:
  - serviceaccounts
  verbs:
  - create
- apiGroups:
  - ""
  resources:
  - persistentvolumes
  verbs:
  - get
  - list
  - update
  - watch
- apiGroups:
  - ""
  resources:
  - endpoints
  verbs:
  - create
  - get
  - list
  - watch
  - update
```
