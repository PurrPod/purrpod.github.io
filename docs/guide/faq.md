# 常见问题

## 一、环境部署类

**1. 运行需要哪些前置依赖？如何检验？** 
需要以下依赖：
**Docker**（windows还需要desktop）
**uv**
**Node.js**
**Git** 
运行以下命令不报错即安装成功：
```
--version
```

**2. 安装很慢、超时或失败？** 

一般是网络问题，尤其是docker镜像拉取，需要网络/VPN比较稳定。

**3. 部署和虚拟化技术冲突？** Docker 的正常运行依赖宿主机的虚拟化支持，常见问题：

- **Windows（WSL2 / Hyper-V）**：Docker Desktop 需要主板开启硬件虚拟化（VT-x / AMD-V），很多笔记本出厂默认关闭，启动 Docker 会直接报错。需进 BIOS 开启。
- **VMware / VirtualBox 冲突**：宿主机同时运行其他虚拟机软件时，可能与 Hyper-V / WSL2 产生冲突，导致蓝屏或无法启动。
- **嵌套虚拟化（Nested Virtualization）**：如果 PurrCat 本身跑在虚拟机里（如云服务器、Parallels），需要额外开启嵌套虚拟化支持，否则 Docker 容器无法启动。
- **Linux**：Docker 原生支持最好，几乎没有冲突问题。但如果使用了非默认的容器运行时（如 containerd），可能与沙盒初始化脚本不兼容。
