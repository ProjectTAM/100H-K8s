# 更新说明

本镜像基于 Tlinux 2.4 构建打造，内核版本 4.14.105-19-0024，本文档记录执行的主要操作

- 更新系统至最新版本
- 安装 Development Tools 工具包
- 系统默认安装了 Docker-engine，新安装 Docker-compose，参考 [官方文档](https://docs.docker.com/engine/install/centos/) 执行安装动作
- 下载 busybox 镜像验证网络可用性
- 增加 minikube 用户，添加进 docker 用户组，新用户不设置密码
- 安装 minikube 程序，参考 [官方文档](https://minikube.sigs.k8s.io/docs/start/) 执行安装动作
- 使用 minikube 用户配置 minikube，设定以下配置值：
    - container-runtime: docker
    - cpus: 2
    - disk-size: 20GB
    - driver: docker
    - memory: 4096MB
- 使用 minikube 安装 k8s 的最新版本，当前版本：v1.27.1
- 配置 kubectl 至 /usr/local/bin 目录，给予执行权限

