---
hide:
  - toc
---

# 使用 Minikube 搭建单节点集群

## 前言

[Minikube](https://minikube.sigs.k8s.io/docs/start/) 是 Kubernetes 官方社区推荐使用的单节点学习环境工具，也是我们本课程之后需要使用的学习环境，由于单节点的特点，并不能完全展示多集群管理的特性，对于这部分缺失的内容将进行特别标注

Minikube 可以支持 Kubernetes 的许多特性，以下为正在支持的特性

```bash
# supported for standard Kubernetes features
LoadBalancer - using minikube tunnel
Multi-cluster - using minikube start -p <name>
NodePorts - using minikube service
Persistent Volumes
Ingress
Dashboard - minikube dashboard
Container runtimes - minikube start --container-runtime
Configure apiserver and kubelet options via command-line flags
Supports common CI environments

# Developer-friendly features
Addons - a marketplace for developers to share configurations for running services on minikube
NVIDIA GPU support - for machine learning
Filesystem mounts
```

## 实验环境

K8s 原生镜像需要从 [k8s.gcr.io](https://k8s.gcr.io) 上拉取，在网络环境并不太好的地区可能会存在多次拉取失败的情况，为了能够在接下来的学习中不被网络问题打扰，推荐购买香港地区的云服务器进行搭建工作。这里选择腾讯云提供的云服务器，详细配置如下：

- Region: ap-hongkong
- InstanceType: S5.LARGE8
- CPUS: 4
- MEMS: 8
- DISK: 50GB
- SYSM: TencentOS Server 2.4

## 环境初始化

TencentOS 在设计的时候已经对容器进行了内核优化，基本不用再进行特别改造，可以查阅 [TencentOS 产品特性](https://cloud.tencent.com/document/product/1397/72787) 用于了解进行了哪些特别优化

并且 TencentOS 默认安装了 Docker，只需要在使用前进行一次更新并启用即可，如果是在其他环境中则需要重新安装配置 Docker 环境，可以参考 [Install Docker Engine](https://docs.docker.com/engine/install/) 页面了解如何进行安装配置

## 开始部署

### 创建普通用户

Minikube 推荐使用普通用户进行工作，这里创建一个普通用户 `minikube` 用于运行主程序

```bash
# 创建 minikube 用户
useradd -m minikube

# 添加 minikube 到 docker 用户组
usermod -aG docker minikube

# 可选：为 minikube 用户设置密码
passwd minikube
```

创建完成后使用 `su - minikube` 切换到 minikube 用户，并执行 `docker info` 用于验证是否可以使用 Docker

### 安装 Minikube 程序包

TencentOS 2.4 是基于 CentOS 7 进行的定制，所以这里下载安装 `RPM package`

```bash
# 下载安装包
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-latest.x86_64.rpm

# 安装 Minikube。注意在刚刚创建用户的时候并没有配置 sudoers，可以在 root 用户中进行安装
rpm -Uvh minikube-latest.x86_64.rpm
```

输入 `minikube status` 命令验证是否正确安装

### Minikube 基本配置

Minikube 在安装后如果直接 `start`，会默认最大程度的使用系统资源，不管是开发测试环境还是正式生产环境这样都是高风险的操作，所以需要在正式运行前进行特别配置，以下为默认可配置参数

```bash
# 获取默认配置参数
minikube config

# 详细配置参数列表
 * driver
 * vm-driver
 * container-runtime
 * feature-gates
 * v
 * cpus
 * disk-size
 * host-only-cidr
 * memory
 * log_dir
 * kubernetes-version
 * iso-url
 * WantUpdateNotification
 * WantBetaUpdateNotification
 * ReminderWaitPeriodInHours
 * WantNoneDriverWarning
 * WantVirtualBoxDriverWarning
 * profile
 * bootstrapper
 * insecure-registry
 * hyperv-virtual-switch
 * disable-driver-mounts
 * cache
 * EmbedCerts
 * native-ssh
 * rootless
 * MaxAuditEntries
```

根据我们购买的云服务器配置，这里推荐使用以下配置

```bash
# 配置文件地址：/home/minikube/.minikube/config/config.json
- container-runtime: docker
- cpus: 2
- disk-size: 20GB
- driver: docker
- memory: 4096MB
```

除此之外，我们推荐同时禁用 Emoji，在 CLI 模式下看 Emoji 确实有点怪怪的~

```bash
# 配置项写入 ~/.bashrc
echo "export MINIKUBE_IN_STYLE=false" >> ~/.bashrc

# 激活配置
source ~/.bashrc
```

### 可选 - 配置网络代理

在我们即将搭建的学习环境中其实并不是很需要进行这一项配置，但对于生产环境或者有代理配置的环境，进行网络代理配置是非常必要的，以下是推荐的配置

```bash
# 网络代理配置参考，根据实际情况进行配置
echo "export HTTP_PROXY=http://<proxy hostname:port>" >> ~/.bashrc
echo "export HTTPS_PROXY=https://<proxy hostname:port>" >> ~/.bashrc

# 不使用代理的网段
echo "export NO_PROXY=localhost,127.0.0.1,10.96.0.0/12,192.168.59.0/24,192.168.49.0/24,192.168.39.0/24" >> ~/.bashrc
```

### Minikube 启动

在以上配置参数完成后，即可正式启动 Minikube，启动 Minikube 的方式也非常简单，仅需要执行 `minikube start` 命令即可，以下为初次启动时的状态参考

```bash
# Minikube 初次启动状态
* minikube v1.27.1 on Tencentos  (amd64)
  - MINIKUBE_IN_STYLE=false
* Using the docker driver based on user configuration
* Using Docker driver with root privileges
* Starting control plane node minikube in cluster minikube
* Pulling base image ...
* Downloading Kubernetes v1.25.2 preload ...
    > preloaded-images-k8s-v18-v1...:  385.41 MiB / 385.41 MiB  100.00% 6.52 Mi
    > gcr.io/k8s-minikube/kicbase:  387.11 MiB / 387.11 MiB  100.00% 5.74 MiB p
    > gcr.io/k8s-minikube/kicbase:  0 B [________________________] ?% ? p/s 36s
* Creating docker container (CPUs=2, Memory=4096MB) ...
* Preparing Kubernetes v1.25.2 on Docker 20.10.18 ...
  - Generating certificates and keys ...
  - Booting up control plane ...
  - Configuring RBAC rules ...
* Verifying Kubernetes components...
  - Using image gcr.io/k8s-minikube/storage-provisioner:v5
* Enabled addons: storage-provisioner, default-storageclass
* kubectl not found. If you need it, try: 'minikube kubectl -- get pods -A'
* Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
```

### Minikube Addons

为了继续后面的学习，这里推荐同时启用插件功能，推荐启用 `dashboard` `default-storageclass` `ingress` `ingress-dns` `storage-provisioner`

```bash
# 获取插件清单
minikube addons list

# 完整的插件列表
|-----------------------------|----------|--------------|--------------------------------|
|         ADDON NAME          | PROFILE  |    STATUS    |           MAINTAINER           |
|-----------------------------|----------|--------------|--------------------------------|
| ambassador                  | minikube | disabled     | 3rd party (Ambassador)         |
| auto-pause                  | minikube | disabled     | Google                         |
| csi-hostpath-driver         | minikube | disabled     | Kubernetes                     |
| dashboard                   | minikube | enabled ✅   | Kubernetes                     |
| default-storageclass        | minikube | enabled ✅   | Kubernetes                     |
| efk                         | minikube | disabled     | 3rd party (Elastic)            |
| freshpod                    | minikube | disabled     | Google                         |
| gcp-auth                    | minikube | disabled     | Google                         |
| gvisor                      | minikube | disabled     | Google                         |
| headlamp                    | minikube | disabled     | 3rd party (kinvolk.io)         |
| helm-tiller                 | minikube | disabled     | 3rd party (Helm)               |
| inaccel                     | minikube | disabled     | 3rd party (InAccel             |
|                             |          |              | [info@inaccel.com])            |
| ingress                     | minikube | enabled ✅   | Kubernetes                     |
| ingress-dns                 | minikube | enabled ✅   | Google                         |
| istio                       | minikube | disabled     | 3rd party (Istio)              |
| istio-provisioner           | minikube | disabled     | 3rd party (Istio)              |
| kong                        | minikube | disabled     | 3rd party (Kong HQ)            |
| kubevirt                    | minikube | disabled     | 3rd party (KubeVirt)           |
| logviewer                   | minikube | disabled     | 3rd party (unknown)            |
| metallb                     | minikube | disabled     | 3rd party (MetalLB)            |
| metrics-server              | minikube | disabled     | Kubernetes                     |
| nvidia-driver-installer     | minikube | disabled     | Google                         |
| nvidia-gpu-device-plugin    | minikube | disabled     | 3rd party (Nvidia)             |
| olm                         | minikube | disabled     | 3rd party (Operator Framework) |
| pod-security-policy         | minikube | disabled     | 3rd party (unknown)            |
| portainer                   | minikube | disabled     | 3rd party (Portainer.io)       |
| registry                    | minikube | disabled     | Google                         |
| registry-aliases            | minikube | disabled     | 3rd party (unknown)            |
| registry-creds              | minikube | disabled     | 3rd party (UPMC Enterprises)   |
| storage-provisioner         | minikube | enabled ✅   | Google                         |
| storage-provisioner-gluster | minikube | disabled     | 3rd party (Gluster)            |
| volumesnapshots             | minikube | disabled     | Kubernetes                     |
|-----------------------------|----------|--------------|--------------------------------|
```

### 安装 kubectl 工具

Minikube 默认提供了 kubectl 工具，使用方法是 `minikube kubectl`，对于已经形成肌肉记忆的操作不太友好，所以这里安装 Kubernetes 自带的 kubectl 工具进行集群管理

```bash
# 下载 kubectl 工具
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# 移动至 /usr/local/bin/ 目录
mv ~/kubectl /usr/local/bin/

# 授权可执行权限。注意我们的 minikube 用户并没有配置 sudoers，需要在 root 用户下操作
chmod +x /usr/local/bin/kubectl
```

输入命令 `kubectl version` 验证可用性，正常情况下会返回以下内容

```bash
# kubectl version 命令结果
Client Version: version.Info{Major:"1", Minor:"25", GitVersion:"v1.25.3", GitCommit:"434bfd82814af038ad94d62ebe59b133fcb50506", GitTreeState:"clean", BuildDate:"2022-10-12T10:57:26Z", GoVersion:"go1.19.2", Compiler:"gc", Platform:"linux/amd64"}
Kustomize Version: v4.5.7
```

## 开始使用

到此为止我们已经使用 Minikube 完整搭建了单节点集群，下面简单介绍一些基本操作

### 状态检查

#### 查看集群状态

```bash
# 查看集群状态
kubectl cluster-info

Kubernetes control plane is running at https://192.168.49.2:8443
CoreDNS is running at https://192.168.49.2:8443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
```

#### 查看 Nodes 状态

```bash
# 查看 nodes 状态，指定打印所有 namespace 和所有信息
kubectl get nodes -A -o wide

NAME       STATUS   ROLES           AGE     VERSION   INTERNAL-IP    EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION     CONTAINER-RUNTIME
minikube   Ready    control-plane   5d20h   v1.25.2   192.168.49.2   <none>        Ubuntu 20.04.5 LTS   4.14.105-19-0024   docker://20.10.18
```

#### 查看 Pods 状态

```bash
# 查看 pods 状态，指定打印所有 namespace 和所有信息
kubectl get pods -A -o wide

NAMESPACE              NAME                                        READY   STATUS      RESTARTS        AGE     IP             NODE       NOMINATED NODE   READINESS GATES
ingress-nginx          ingress-nginx-admission-create-6f969        0/1     Completed   0               5d20h   172.17.0.3     minikube   <none>           <none>
ingress-nginx          ingress-nginx-admission-patch-qbdl6         0/1     Completed   0               5d20h   172.17.0.4     minikube   <none>           <none>
ingress-nginx          ingress-nginx-controller-5959f988fd-2dt6b   1/1     Running     1 (5d20h ago)   5d20h   172.17.0.5     minikube   <none>           <none>
kube-system            coredns-565d847f94-lr6hk                    1/1     Running     1 (5d20h ago)   5d20h   172.17.0.2     minikube   <none>           <none>
kube-system            etcd-minikube                               1/1     Running     1 (5d20h ago)   5d20h   192.168.49.2   minikube   <none>           <none>
kube-system            kube-apiserver-minikube                     1/1     Running     1 (5d20h ago)   5d20h   192.168.49.2   minikube   <none>           <none>
kube-system            kube-controller-manager-minikube            1/1     Running     1 (5d20h ago)   5d20h   192.168.49.2   minikube   <none>           <none>
kube-system            kube-ingress-dns-minikube                   1/1     Running     1 (5d20h ago)   5d20h   192.168.49.2   minikube   <none>           <none>
kube-system            kube-proxy-d8zpf                            1/1     Running     1 (5d20h ago)   5d20h   192.168.49.2   minikube   <none>           <none>
kube-system            kube-scheduler-minikube                     1/1     Running     1 (5d20h ago)   5d20h   192.168.49.2   minikube   <none>           <none>
kube-system            storage-provisioner                         1/1     Running     2 (3m56s ago)   5d20h   192.168.49.2   minikube   <none>           <none>
kubernetes-dashboard   dashboard-metrics-scraper-b74747df5-prqfq   1/1     Running     1 (5d20h ago)   5d20h   172.17.0.4     minikube   <none>           <none>
kubernetes-dashboard   kubernetes-dashboard-57bbdc5f89-gx8zs       1/1     Running     2 (3m56s ago)   5d20h   172.17.0.3     minikube   <none>           <none>

# 查看指定 namespace pods 状态
kubectl get pods -n ingress-nginx -o wide

NAME                                        READY   STATUS      RESTARTS        AGE     IP           NODE       NOMINATED NODE   READINESS GATES
ingress-nginx-admission-create-6f969        0/1     Completed   0               5d20h   172.17.0.3   minikube   <none>           <none>
ingress-nginx-admission-patch-qbdl6         0/1     Completed   0               5d20h   172.17.0.4   minikube   <none>           <none>
ingress-nginx-controller-5959f988fd-2dt6b   1/1     Running     1 (5d20h ago)   5d20h   172.17.0.5   minikube   <none>           <none>
```

#### 检查 Pods 详细信息

```bash
# 查看 namespace 为 kube-system，pod 为 etcd-minikube 的详细信息
kubectl describe -n kube-system pod etcd-minikube

Name:                 etcd-minikube
Namespace:            kube-system
Priority:             2000001000
Priority Class Name:  system-node-critical
Node:                 minikube/192.168.49.2
Start Time:           Tue, 18 Oct 2022 14:25:42 +0800
Labels:               component=etcd
                      tier=control-plane
Annotations:          kubeadm.kubernetes.io/etcd.advertise-client-urls: https://192.168.49.2:2379
                      kubernetes.io/config.hash: bd495b7643dfc9d3194bd002e968bc3d
                      kubernetes.io/config.mirror: bd495b7643dfc9d3194bd002e968bc3d
                      kubernetes.io/config.seen: 2022-10-18T06:25:31.559325794Z
                      kubernetes.io/config.source: file
Status:               Running
IP:                   192.168.49.2
IPs:
  IP:           192.168.49.2
Controlled By:  Node/minikube
...

# 最常查看的是 Events 项，可以帮我们分析 Pods 问题
Events:
  Type    Reason          Age   From     Message
  ----    ------          ----  ----     -------
  Normal  SandboxChanged  18m   kubelet  Pod sandbox changed, it will be killed and re-created.
  Normal  Pulled          18m   kubelet  Container image "registry.k8s.io/etcd:3.5.4-0" already present on machine
  Normal  Created         18m   kubelet  Created container etcd
  Normal  Started         18m   kubelet  Started container etcd
```


#### 以 JSON 格式输出 Pods 信息

```bash
# 输出 namespace 为 kube-system，pod 为 etcd-minikube 的详细信息，使用 JSON 格式打印出来
kubectl get -o json -n kube-system pod etcd-minikube

{
    "apiVersion": "v1",
    "kind": "Pod",
    "metadata": {
        "annotations": {
            "kubeadm.kubernetes.io/etcd.advertise-client-urls": "https://192.168.49.2:2379",
            "kubernetes.io/config.hash": "bd495b7643dfc9d3194bd002e968bc3d",
            "kubernetes.io/config.mirror": "bd495b7643dfc9d3194bd002e968bc3d",
            "kubernetes.io/config.seen": "2022-10-18T06:25:31.559325794Z",
            "kubernetes.io/config.source": "file"
        },
        "creationTimestamp": "2022-10-18T06:25:40Z",
        "labels": {
            "component": "etcd",
            "tier": "control-plane"
        },
        "name": "etcd-minikube",
        "namespace": "kube-system",
        "ownerReferences": [
            {
                "apiVersion": "v1",
                "controller": true,
                "kind": "Node",
                "name": "minikube",
                "uid": "7e1475aa-5bf6-4c76-8180-ae8f006b6adf"
            }
        ],
...
```

#### 列出所有的 Services

```bash
# 列出所有的 services，-o wide 打印出所有的信息
kubectl get services -o wide

NAME         TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE     SELECTOR
kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   5d20h   <none>
```

### 创建一个简单的服务

#### 创建资源对象

这里我们尝试创建 NGINX 服务用于验证集群可用性

```bash
# 创建一个新的资源对象，命名为 nginx-master，pod 数量指定为 2 个
kubectl create deployment nginx-master --image=docker.io/nginx:latest --replicas=2

deployment.apps/nginx-master created

# 使用刚刚创建的 nginx-master 创建新的 services
kubectl expose deployment nginx-master --type=NodePort --port=80

service/nginx-master exposed
```

#### 对外开启服务

刚刚创建的 NGINX 服务是对外提供服务使用的，所以我们使用 `port-forward` 功能对外提供服务

```bash
# 由于是云服务器不是本地服务器，所以完全开放网络以便验证，对外端口 7080
kubectl port-forward --address 0.0.0.0 service/nginx-master 7080:80
```

如果一切正常会返回如下页面

![nginx-master](/assets/images/docs/chapter04-01.png)

### 配置负载均衡

对于生产环境使用负载均衡是非常安全的方式，这里简单的介绍负载均衡的配置，更详细的配置可以参考 [Kubernetes 负载均衡](chapter09.md)

与刚刚进行的服务部署类似，这里我们在创建负载均衡的时候需要指定 `--type=LoadBalancer`，之后使用 Minikube 提供的 `tunnel` 工具可以快速开启负载均衡配置

```bash
# 创建一个新的资源对象，命名为 nginx-lb，pod 数量指定为 2 个
# kubectl create deployment nginx-lb --image=docker.io/nginx:latest --replicas=2
deployment.apps/nginx-lb created

# 使用刚刚创建的 nginx-lb 创建新的 services
# kubectl expose deployment nginx-lb --type=LoadBalancer --port=80
service/nginx-lb exposed

# sudoers 文件中添加 minikube，root 用户下执行
sudoedit /etc/sudoers

# 为用户 minikube 创建一个密码
passwd minikube

# 开启负载均衡
minikube tunnel

# 负载均衡状态输出
Status:	
	machine: minikube
	pid: 257973
	route: 10.96.0.0/12 -> 192.168.49.2
	minikube: Running
	services: [nginx-lb]
    errors: 
		minikube: no errors
		router: no errors
		loadbalancer emulator: no errors
```

## 结语

至此我们已经学习了使用 Minikube 搭建单节点集群课程、了解了基本的 K8s 常用的操作命令，并启用和实施了一次服务搭建，之后的课程我们讲围绕 K8s 的关键组件进行更加细致的学习，欢迎继续进行阅读
