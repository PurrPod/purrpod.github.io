# 从源码开始

欢迎使用 PurrCat！本篇文档将引导您从零开始，通过源代码在本地部署并配置 PurrCat 私人 Agent 框架。

> 💡 **Windows 用户**可直接前往 [GitHub Releases](https://github.com/PurrPod/purrcat/releases/latest) 的 **latest** 版本下载桌面安装包，开箱即用；**macOS / Linux 版本**因人力原因暂时未经测试，目前只能从源码部署。不过本项目仍处于快速迭代期，从源码部署始终是最好的选择——可以第一时间体验到最新功能与修复。

## 1. 准备工作

需要的依赖取决于您的部署方式：

- **安装包方式（Windows）**：可直接从 [latest Release](https://github.com/PurrPod/purrcat/releases/latest) 下载桌面安装包。该方式**只需安装 Docker 一个核心依赖**即可运行，无需额外工具；
- **从源码部署**：除 **Docker** 外，还需要 **uv** 与 **Node.js**（uv 负责 `purrcat setup` 一键部署与 Python 依赖管理，Node.js 用于构建 Electron 桌面端 / Web UI），并推荐安装 **Git** 以获取源码。

| 工具 | 作用 | 什么时候需要 |
|------|------|-------------|
| [Docker](https://docs.docker.com/get-docker/) | 沙盒容器引擎 | **两种方式都必需**（沙盒 Bash、文件隔离） |
| [uv](https://docs.astral.sh/uv/) | Python 包管理器 | **源码部署必需**（`purrcat setup` 一键部署、Python 依赖管理） |
| Node.js 18+ | 提供 `npm`/`npx` | **源码部署必需**（构建 Electron 桌面端 / Web UI 前端） |
| Git | 版本控制 | **源码部署推荐**（`git clone` 获取源码、云端拉取技能/传感器，也可下载压缩包） |

### Docker（核心必需）

用于构建和运行 PurrCat 专属的本地沙盒环境，保障 Agent 文件操作的安全性。

- **Windows：** `winget install Docker.DockerDesktop`
- **macOS：** `brew install --cask docker`
- **Linux：** `curl -fsSL https://get.docker.com | sh`

> **注意：**
> 1. 安装完成后，请**务必重启您的命令行终端**，以确保自动配置的环境变量生效。
> 2. 运行 PurrCat 前，请确认 Docker 后台服务已处于运行状态。

### uv（源码部署必需）

源码部署时必需，用于安装 PurrCat 的所有 Python 依赖，`purrcat setup` 一键部署依赖它。

- **Linux / macOS：**
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
- **Windows（PowerShell）：**
  ```powershell
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```

### Node.js（源码部署必需）

源码部署时必需，提供 `npm`/`npx`，用于从源码构建前端界面（Electron 桌面端 / Web UI），以及运行部分 MCP 扩展工具。安装包方式已内置编译好的前端，无需再安装。

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

### Git（源码部署推荐）

源码部署时推荐，用于 `git clone` 获取源码，以及从社区拉取技能、传感器等扩展。不安装也可通过下载压缩包的方式获取源码。

- **Windows：** `winget install Git.Git`
- **macOS：** `brew install git`
- **Linux（Ubuntu/Debian 为例）：** `sudo apt-get install -y git`

### 验证安装

重启终端后，执行以下命令确认已安装工具正常：

```bash
# 验证 Docker（两种方式都必需）
docker --version
docker info

# 验证 uv（源码部署需要）
uv --version

# 验证 Node.js 和 npx（源码部署需要）
node --version
npx --version

# 验证 Git（源码部署需要）
git --version
```

安装包方式只需确保 Docker 验证通过；从源码部署则需上述工具全部就绪。

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

## 5. 启动服务

### 5.1 Electron 桌面端（推荐）

完成上述部署后，安装前端与桌面端依赖并一键启动：

```bash
npm install                 # 根目录依赖（Electron 等）
npm install --prefix ui     # 前端依赖
npm run dev                 # 一键拉起 后端 + 前端 + Electron 桌面窗口
```

### 5.2 Web UI（轻量，无桌面端）

如果只想在浏览器中使用，可跳过 Electron，构建前端静态文件后启动纯 API 模式：

```bash
npm install --prefix ui
npm run build:ui                            # 构建前端静态文件
uv run python main.py --api --headless      # 浏览器打开 http://localhost:8000
```

> 注：本地文件操作、终端等功能依赖 Electron 运行时，纯浏览器模式下可能出现异常。建议使用桌面端获得完整体验。

**关闭服务**：Electron 桌面端直接关闭窗口即可；Web UI 模式在终端按下 `Ctrl+C` 即可安全终止所有进程。

## 6. 配置模型并开始使用

启动服务后，在 UI 中即可完成全部模型配置，无需手动编辑文件：

1. 打开 PurrCat 界面，点击右上角的**设置**入口
2. 在模型配置中填写 API Key（兼容 OpenAI SDK 的模型均可，如 DeepSeek），必要时修改 Base URL
3. 保存后即可开始使用

> 配置文件（`~/.purrcat/`）会在首次启动时自动生成默认模板，UI 中的修改会自动写回对应文件。如需重置为默认配置，删除该目录后重启即可。

如需了解 `main` / `task` / `vision` 等模型字段的详细含义、多 API Key 负载均衡等高级配置，请参见 [配置指南](./configuration)。
