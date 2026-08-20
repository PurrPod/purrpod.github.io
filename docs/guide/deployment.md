# 从源码开始

欢迎使用 PurrCat！本篇文档将引导您从零开始，通过源代码在本地部署并配置 PurrCat 私人 Agent 框架。

> 💡 不想从源码部署？也可以前往 [GitHub Releases](https://github.com/PurrPod/purrcat/releases) 下载对应的桌面安装包（**Windows 已验证**；macOS 打包无法确保可用性，建议优先使用源码部署）。

## 1. 准备工作

部署 PurrCat 只需一个**核心必需**依赖：**Docker**（用于构建和运行本地沙盒环境）。

另外，**uv**、**Git**、**Node.js** 等工具**不是部署必需的**——缺少它们不会影响 PurrCat 核心功能运行；但它们是你**体验完整拓展功能**（安装 Skill 技能、接入 MCP 扩展、编译桌面端/Web 界面）时的必备依赖，不安装会严重影响拓展功能的玩法，因此建议一并装好。

| 工具 | 作用 | 什么时候需要 |
|------|------|-------------|
| [Docker](https://docs.docker.com/get-docker/) | 沙盒容器引擎 | **部署核心必需**（沙盒 Bash、文件隔离） |
| [uv](https://docs.astral.sh/uv/) | Python 包管理器 | `purrcat setup` 一键部署、Python 依赖管理 |
| Node.js 18+ | 提供 `npm`/`npx` | 构建前端（Electron 桌面端 / Web UI）、部分 MCP 扩展 |
| Git | 版本控制 | `git clone` 获取源码、云端拉取技能/传感器（也可下载压缩包） |

### Docker（核心必需）

用于构建和运行 PurrCat 专属的本地沙盒环境，保障 Agent 文件操作的安全性。

- **Windows：** `winget install Docker.DockerDesktop`
- **macOS：** `brew install --cask docker`
- **Linux：** `curl -fsSL https://get.docker.com | sh`

> **注意：**
> 1. 安装完成后，请**务必重启您的命令行终端**，以确保自动配置的环境变量生效。
> 2. 运行 PurrCat 前，请确认 Docker 后台服务已处于运行状态。

### uv（可选，拓展功能推荐）

用于安装 PurrCat 的所有 Python 依赖，`purrcat setup` 一键部署依赖它。

- **Linux / macOS：**
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
- **Windows（PowerShell）：**
  ```powershell
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```

### Node.js（可选，拓展功能必备）

提供 `npm`/`npx`，用于构建前端界面（Electron 桌面端 / Web UI），以及运行部分 MCP 扩展工具。未安装时不影响核心 Agent 功能，但无法使用桌面端与网页界面。

- **Windows：**
  ```powershell
  winget install OpenJS.NodeJS
  ```
- **macOS：**
  ```bash
  brew install node
  ```
- **Linux（Ubuntu/Debian 为例）：**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

### Git（可选，推荐）

用于 `git clone` 获取源码，以及从社区拉取技能、传感器等扩展。不安装也可通过下载压缩包的方式获取源码。

- **Windows：** `winget install Git.Git`
- **macOS：** `brew install git`
- **Linux（Ubuntu/Debian 为例）：** `sudo apt-get install -y git`

### 验证安装

重启终端后，执行以下命令确认已安装工具正常：

```bash
# 验证 Docker（必需）
docker --version
docker info

# 验证 uv（可选）
uv --version

# 验证 Node.js 和 npx（可选）
node --version
npx --version

# 验证 Git（可选）
git --version
```

带 `（可选）` 的命令未安装时不报错即可，`docker --version` 与 `docker info` 必须能正常输出。

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
# 一键部署（沙盒构建 + Python 依赖安装 + 嵌入模型下载）
purrcat setup
```

> ⚠️ `purrcat setup` 是交互式的，运行过程中会依次提问以下选项，请根据提示做出选择：

执行过程中会依次提问（详见第 4 节拆解说明）：
1. 检测 Docker 引擎（必需，未安装会提示先安装 Docker Desktop）
2. 选择沙盒镜像版本（完整版或轻量版）
3. 选择镜像来源（**推荐从 ghcr.io 拉取**，也可本地构建）
4. 如选择本地构建，再选 APT 镜像源
5. 获取沙盒镜像（拉取或构建）
6. 自动解析并安装 Python 依赖（`uv sync`）
7. 下载 Embedding 向量化模型
8. 可选安装前端依赖（npm install，Electron 桌面端 / Web UI 需要）

> 整个流程取决于网络状况，首次拉取基础镜像可能需要 5~15 分钟，请耐心等待。引擎偏好保存至 `~/.purrcat/settings.json`。

## 4. 分步部署（不推荐）

如果一键部署中途失败，您可以根据下面的拆解说明逐步执行，便于定位问题。

### 4.1 Docker 沙盒镜像获取

`purrcat setup` 提供两种方式获取沙盒镜像：

**方式一：从 ghcr.io 拉取（推荐）**

```bash
# 轻量版
docker pull ghcr.io/purrpod/purrcat-sandbox:light
docker tag ghcr.io/purrpod/purrcat-sandbox:light my_agent_env:latest

# 完整版（包含 Chromium、ffmpeg 等）
docker pull ghcr.io/purrpod/purrcat-sandbox:full
docker tag ghcr.io/purrpod/purrcat-sandbox:full my_agent_env:latest
```

**方式二：本地构建（备选）**

```bash
# 可选：配置 APT 镜像源（优先选官方源，阿里云镜像备选）
# 使用阿里云镜像
docker build -t my_agent_env:latest --build-arg APT_MIRROR="mirrors.aliyun.com" .

# 或使用官方源
docker build -t my_agent_env:latest --build-arg APT_MIRROR="deb.debian.org" .
```

**构建过程简述**：
- 基于 `python:3.10-slim` 基础镜像
- 安装系统依赖：curl、git、vim、ffmpeg、jq 等
- 安装 Node.js 20.x（用于沙盒内的工具链）
- 配置 PyPI 国内镜像（阿里云） + 安装 uv
- 设置工作目录为 `/agent_vm`

**常见失败原因**：
| 问题 | 解决方案 |
|------|---------|
| Docker 未安装或未启动 | 启动 Docker Desktop，确认 `docker info` 能正常执行 |
| 镜像拉取/构建超时 | 切换到 ghcr.io 拉取方式，或配置 Docker 镜像加速器 |
| 磁盘空间不足 | 清理 Docker 无用的镜像/容器：`docker system prune -a` |
| Docker Hub 匿名拉取限额 | 登录 Docker Hub 账号，或等待限额重置 |

### 4.2 Python 依赖安装

```bash
# 使用 uv 一键解析并安装所有依赖
uv sync
```

> `uv sync` 会根据 `pyproject.toml` 自动创建虚拟环境（`.venv`）并安装所有依赖。一键完成。

**环境包含的核心依赖**：
- Python 3.10 + OpenAI SDK + MCP 协议
- Sentence-Transformers + ChromaDB（向量检索与记忆系统）
- Textual（TUI 界面）
- Docker SDK + Playwright（沙盒与自动化）
- Lark SDK（飞书通讯）+ Feedparser（RSS 订阅）
- FastAPI + Uvicorn（Web 后端）
- 其它

**常见失败原因**：
| 问题 | 解决方案 |
|------|---------|
| uv 命令找不到 | Linux/Mac: `curl -LsSf https://astral.sh/uv/install.sh | sh`；Windows: `powershell ... irm https://astral.sh/uv/install.ps1 | iex` |
| 包下载超时 | 配置 uv 镜像源：`uv config set index-url https://mirrors.aliyun.com/pypi/simple/` |
| PyTorch 下载慢 | uv 已自动配置 CPU-only PyTorch 镜像，若仍慢可手动设置 `UV_INDEX_PYTORCH_CPU` |

### 4.3 嵌入模型下载

```bash
uv run python scripts/setup_emb.py
```

该脚本会自动下载 Embedding 模型（默认 `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`），用于 RAG 检索与记忆系统的向量化。

**常见失败原因**：
| 问题 | 解决方案 |
|------|---------|
| HuggingFace 连接超时 | 配置 HuggingFace 镜像源：`export HF_ENDPOINT=https://hf-mirror.com` |
| 磁盘空间不足 | 模型约 100MB，确保有足够空间 |

## 5. 必要配置

一键部署完成后，需要配置模型 API 密钥等核心参数。

### 5.1 生成配置文件

PurrCat **首次启动时会自动检测 `~/.purrcat/` 配置目录**，若不存在则自动生成默认模板，无需手动初始化。如需重置为默认配置，删除该目录后重启即可。

`~/.purrcat/` 目录包含以下文件：

| 文件 | 用途 |
|------|------|
| `.purrcat/model.json` | 模型 API Key、Base URL、速率限制配置 |
| `.purrcat/activate_sensor.json` | 传感器激活配置（默认空，市场安装后自动写入） |
| `.purrcat/file.json` | 文件系统白名单与沙盒挂载配置 |
| `.purrcat/mcp_config.json` | MCP 服务器扩展配置 |
| `.purrcat/app_config.json` | 应用快捷配置（ComputerUse launch_app） |
| `.purrcat/core/cron.json` | 定时任务列表 |
| `.purrcat/core/heartbeat.json` | 心跳配置（间隔/开关） |
| `.purrcat/core/MEMORY.md` | 系统级记忆档案 |
| `.purrcat/core/SOUL.md` | Agent 人格定义 |
| `.purrcat/core/GOAL.md` | 待办目标（心跳注入） |
| `.purrcat/core/PARADIGM.yaml` | Agent 执行范式（触发器/钩子/检查） |

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
- `task` 段配置后台子任务使用的模型（多 Agent 协作时必填，且不能用与 main 相同的 API Key），字段与 `main` 一致，可直接复制过去，换掉 API Key 即可
- `vision` 段配置多模态视觉模型（可选，给不支持多模态的大模型配专属视觉顾问），字段也与 `main` 一致
- 支持为同一模型配置多个 API Key，系统会自动负载均衡

## 6. 启动服务

### 6.1 Electron 桌面端（推荐）

完成上述部署后，安装前端与桌面端依赖并一键启动：

```bash
npm install                 # 根目录依赖（Electron 等）
npm install --prefix ui     # 前端依赖
npm run dev                 # 一键拉起 后端 + 前端 + Electron 桌面窗口
```

### 6.2 Web UI（轻量，无桌面端）

如果只想在浏览器中使用，可跳过 Electron，构建前端静态文件后启动纯 API 模式：

```bash
npm install --prefix ui
npm run build:ui                            # 构建前端静态文件
uv run python main.py --api --headless      # 浏览器打开 http://localhost:8000
```

> 注：本地文件操作、终端等功能依赖 Electron 运行时，纯浏览器模式下可能出现异常。建议使用桌面端获得完整体验。

### 6.3 打包桌面安装包（可选）

```bash
npm run dist    # 构建前端并调用 electron-builder 生成安装包（输出到 release/ 目录）
```

启动后系统会自动完成：
1. 初始化 MCP 连接并拉取工具 Schema
2. 启动 Agent 主循环
3. 自动发现并启动已配置的 Sensor（飞书、RSS 等）

**关闭服务**：Electron 桌面端直接关闭窗口即可；Web UI 模式在终端按下 `Ctrl+C` 即可安全终止所有进程。
