# 从源码开始

欢迎使用 PurrCat！本篇文档将引导您从零开始，通过源代码在本地部署并配置 PurrCat 私人 Agent 框架。

## 1. 准备工作

在开始之前，请确保您的计算机上已安装以下基础依赖：

- **Miniconda 或 Anaconda**：用于管理和隔离 Python 虚拟环境（确保已添加进系统变量里，否则后续脚本可能出现找不到 conda 命令的错误）
- **Docker 或 Podman**：用于构建和运行 PurrCat 专属的本地沙盒环境，保障文件操作的安全性。系统会自动检测可用的容器引擎（Docker 优先）。请确保引擎服务已启动并在运行状态。

> 注意：PurrCat 使用 Python Textual TUI 作为用户界面。但如果需要使用 MCP 扩展（如 Playwright、GitHub 等），宿主机仍需安装 **Node.js**（提供 `npx` 命令）和可选的 **uv**（Python 包管理器），具体取决于配置的 MCP Server 类型。

## 2. 获取源代码

请先将 PurrCat 的源代码仓库克隆到您的本地机器，并进入项目根目录：

```bash
git clone https://github.com/PurrPod/purrcat.git
cd purrcat
```

或者，直接在本网页下载压缩包（见导航栏）并正确解压和重命名。

## 3. 一键部署（推荐）

PurrCat 提供了统一的 CLI 入口 `purrcat`，一键完成环境初始化：

```bash
# 一键部署（沙盒构建 + Conda 环境 + 嵌入模型下载）
purrcat setup
```



系统会自动完成以下步骤（详见第 4 节拆解说明）：
1. 自动检测容器引擎（支持 **Docker / Podman**）
2. 选择沙盒镜像版本（完整版 `Dockerfile.full` 或轻量版 `Dockerfile.light`）
3. 交互选择 APT 镜像源（国内用户选 2 阿里云镜像可大幅加速）
4. 构建沙盒镜像 `my_agent_env:latest`
5. 创建/更新 Conda 环境 `PurrCat`
6. 下载 Embedding 向量化模型
7. 可选安装 **WebUI** 前端依赖（npm install）

> 整个流程取决于网络状况，首次拉取基础镜像可能需要 5~15 分钟，请耐心等待。引擎偏好保存至 `~/.purrcat/settings.json`。

## 4. 脚本拆解与手动分步

如果一键部署中途失败，您可以根据下面的拆解说明逐步执行，便于定位问题。

### 4.1 Docker 沙盒构建

```bash
# 可选：配置国内镜像加速（国内用户推荐）
# 阿里云镜像
docker build -t my_agent_env:latest --build-arg APT_MIRROR="mirrors.aliyun.com" .

# 或使用官方源
docker build -t my_agent_env:latest --build-arg APT_MIRROR="deb.debian.org" .
```

**脚本做了哪些事**：
- 基于 `python:3.10-slim` 基础镜像
- 安装系统依赖：curl、git、vim、ffmpeg、jq 等
- 安装 Node.js 20.x（用于沙盒内的工具链）
- 配置 PyPI 国内镜像（阿里云）
- 设置工作目录为 `/agent_vm`

**常见失败原因**：
| 问题 | 解决方案 |
|------|---------|
| Docker 未安装或未启动 | 启动 Docker Desktop，确认 `docker info` 能正常执行 |
| 镜像拉取超时 | 切换 APT 镜像源（阿里云），或配置 Docker 镜像加速器 |
| 磁盘空间不足 | 清理 Docker 无用的镜像/容器：`docker system prune -a` |
| Docker Hub 匿名拉取限额 | 登录 Docker Hub 账号，或等待限额重置 |

### 4.2 Conda 环境配置

```bash
# 创建 Conda 环境
conda env create -f environment.yml

# 如果环境已存在，更新依赖
conda env update -f environment.yml --prune
```

**环境包含的核心依赖**：
- Python 3.10 + OpenAI SDK + MCP 协议
- Faiss（向量检索）+ Sentence-Transformers（嵌入模型）
- Textual（TUI 界面）
- Docker SDK + Playwright（沙盒与自动化）
- Lark SDK（飞书通讯）+ Feedparser（RSS 订阅）

**常见失败原因**：
| 问题 | 解决方案 |
|------|---------|
| Conda 命令找不到 | 确保 Miniconda 已添加到系统 PATH |
| 包下载超时 | 配置 Conda 清华镜像源，或使用 VPN |
| 环境冲突 | 删除旧环境重新创建：`conda env remove -n PurrCat` |

### 4.3 嵌入模型下载

```bash
conda run -n PurrCat python scripts/setup_emb.py
```

该脚本会自动下载 Embedding 模型（默认 `BAAI/bge-small-zh-v1.5`），用于 RAG 检索与记忆系统的向量化。

**常见失败原因**：
| 问题 | 解决方案 |
|------|---------|
| HuggingFace 连接超时 | 配置 HuggingFace 镜像源：`export HF_ENDPOINT=https://hf-mirror.com` |
| 磁盘空间不足 | 模型约 100MB，确保有足够空间 |

## 5. 必要配置

一键部署完成后，需要配置模型 API 密钥等核心参数。

### 5.1 生成配置文件

```bash
# 交互式生成 .purrcat/ 配置目录（逐个确认）
purrcat init

# 如需覆盖已有配置
purrcat init --force
```

该命令会在项目根目录生成 `.purrcat/` 文件夹，包含以下文件：

| 文件 | 用途 |
|------|------|
| `.purrcat/model.json` | 模型 API Key、Base URL、速率限制配置 |
| `.purrcat/activate_sensor.json` | 传感器（飞书/RSS/时钟/语音）配置 |
| `.purrcat/file.json` | 文件系统白名单与沙盒挂载配置 |
| `.purrcat/mcp_config.json` | MCP 服务器扩展配置 |
| `.purrcat/memory.json` | 记忆系统配置 |
| `.purrcat/note.json` | 笔记工具偏好配置 |
| `.purrcat/core/cron.json` | 定时任务列表 |
| `.purrcat/core/MEMORY.md` | 系统级记忆档案 |
| `.purrcat/core/SOUL.md` | Agent 人格定义 |
| `.purrcat/core/SOLO.md` | 自主巡查规约 |

### 5.2 配置模型密钥

编辑 `.purrcat/model.json`，替换 API Key 占位符：

```json
{
  "embedding": "embedding",
  "main": {
    "openai:deepseek-v4-flash": {
      "api_keys": ["sk-your-first-api-key-here"],
      "base_url": "https://api.deepseek.com",
      "description": "LLM worker",
      "rpm": 60,
      "tpm": 1000000,
      "concurrency": 3,
      "max_token": 500000
    }
  },
  "task": {},
  "vision": {}
}
```




**注意事项**：
- 目前 PurrCat 仅支持可通过 OpenAI SDK 调用的模型
- `main` 段配置全局 Agent 使用的模型
- `task` 段配置后台子任务使用的模型（多 Agent 协作时必填，且不能用与 main 相同的 API Key）
- 支持为同一模型配置多个 API Key，系统会自动负载均衡

### 5.3 查看环境变量参考

```bash
purrcat env
```

> 注意：当前版本不支持环境变量覆盖配置，请直接编辑 `.purrcat/` 目录下的文件。

## 6. 启动服务

### 6.1 标准启动（TUI 界面）

```bash
purrcat start
```

### 6.2 无界面启动（Headless）

```bash
purrcat start --webui
```


启动后系统会自动完成：
1. 初始化 MCP 连接并拉取工具 Schema
2. 启动 Agent 主循环
3. 自动发现并启动已配置的 Sensor（飞书、RSS 等）
4. 加载 TUI 界面（headless 模式跳过）

**关闭服务**：在终端按下 `Ctrl+C` 即可安全终止所有进程。
