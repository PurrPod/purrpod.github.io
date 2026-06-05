# Deployment Guide

Welcome to PurrCat! This document will guide you through deploying and configuring the PurrCat private Agent framework locally from source code.

## 1. Prerequisites

Before you begin, ensure that the following basic dependencies are installed on your computer:

- **uv**: Python package manager for resolving and installing all Python dependencies.
  - Linux / macOS: `curl -LsSf https://astral.sh/uv/install.sh | sh`
  - Windows: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`
- **Node.js**: Provides `npx`, required for running MCP extensions and the WebUI frontend.
- **Docker or Podman**: Used to build and run PurrCat's exclusive local sandbox environment. The system auto-detects available container engines (Docker preferred). Make sure the engine service is running.

## 2. Obtaining Source Code

Clone the PurrCat source code repository to your local machine and navigate to the project root directory:

```bash
git clone https://github.com/PurrPod/purrcat.git
cd purrcat
```

Alternatively, download the ZIP archive from the navigation bar above and extract it.

## 3. One-Click Deployment (Recommended)

PurrCat provides a unified CLI entry point `purrcat` for environment initialization:

```bash
# One-click deploy (sandbox build + Python deps + embedding model)
purrcat setup
```

> ⚠️ `purrcat setup` is interactive. It will prompt you with the following questions during execution:

The script will guide you through the following steps (see Section 4 for detailed breakdown):
1. Auto-detect container engine (supports **Docker / Podman**)
2. Select sandbox image variant (lightweight or full)
3. Choose image source (**pull from ghcr.io recommended**, or build locally)
4. If building locally, select APT mirror
5. Obtain sandbox image (pull or build)
6. Resolve and install Python dependencies (`uv sync`)
7. Download Embedding model
8. Optionally install **WebUI** frontend dependencies (npm install)

> The entire process depends on network conditions. The first image pull may take 5~15 minutes. Engine preference is saved to `~/.purrcat/settings.json`.

## 4. Script Breakdown & Manual Steps

If the one-click deployment fails, use the breakdown below to execute steps individually and locate the issue.

### 4.1 Docker Sandbox Image

`purrcat setup` offers two ways to get the sandbox image:

**Option A: Pull from ghcr.io (recommended)**

```bash
# Lightweight
docker pull ghcr.io/purrpod/purrcat-sandbox:light
docker tag ghcr.io/purrpod/purrcat-sandbox:light my_agent_env:latest

# Full (includes Chromium, ffmpeg, etc.)
docker pull ghcr.io/purrpod/purrcat-sandbox:full
docker tag ghcr.io/purrpod/purrcat-sandbox:full my_agent_env:latest
```

> Pre-built images are maintained by CI. Pulling is much faster than building locally.

**Option B: Build locally (fallback)**

```bash
# Using Aliyun mirror (faster for users in China):
docker build -t my_agent_env:latest --build-arg APT_MIRROR="mirrors.aliyun.com" .

# Using official source:
docker build -t my_agent_env:latest --build-arg APT_MIRROR="deb.debian.org" .
```

**What the build does**:
- Builds on `python:3.10-slim` base image
- Installs system packages: curl, git, vim, ffmpeg, jq, etc.
- Installs Node.js 20.x (for in-sandbox toolchains)
- Configures PyPI mirror (Aliyun) + installs uv
- Sets working directory to `/agent_vm`

**Common failures**:

| Issue | Solution |
|-------|----------|
| Docker not installed or not running | Start Docker Desktop, verify `docker info` works |
| Image pull/build timeout | Switch to ghcr.io pull method, or configure Docker mirror accelerator |
| Insufficient disk space | Clean up: `docker system prune -a` |
| Docker Hub anonymous pull limit | Log in to a Docker Hub account or wait for reset |

### 4.2 Python Dependencies with uv

```bash
# One command to resolve and install all dependencies
uv sync
```

> `uv sync` automatically creates a virtual environment (`.venv`) and installs all dependencies from `pyproject.toml`. No manual `activate` needed.

**Core dependencies**:
- Python 3.10 + OpenAI SDK + MCP protocol
- Sentence-Transformers + ChromaDB (vector search & memory system)
- Textual (TUI framework)
- Docker SDK + Playwright (sandbox & automation)
- Lark SDK (Feishu) + Feedparser (RSS)
- FastAPI + Uvicorn (Web backend)

**Common failures**:

| Issue | Solution |
|-------|----------|
| uv command not found | Linux/Mac: `curl -LsSf https://astral.sh/uv/install.sh | sh`; Windows: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"` |
| Package download timeout | Set uv mirror: `uv config set index-url https://mirrors.aliyun.com/pypi/simple/` |
| Python version too low | Ensure Python >= 3.10, or use `uv python install 3.10` to auto-install |
| PyTorch download slow | uv auto-configures CPU-only PyTorch; set `UV_INDEX_PYTORCH_CPU` if needed |

### 4.3 Embedding Model Download

```bash
uv run python scripts/setup_emb.py
```

Downloads the Embedding model (default: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`) for RAG and memory vectorization.

**Common failures**:

| Issue | Solution |
|-------|----------|
| HuggingFace connection timeout | Set mirror: `export HF_ENDPOINT=https://hf-mirror.com` |
| Disk space | Model is ~100MB, ensure sufficient space |

## 5. Configuration

After deployment, configure the model API keys and core parameters.

### 5.1 Generate Config Files

```bash
# Interactive config generation (confirm one by one)
purrcat init

# Force overwrite existing configs
purrcat init --force
```

This creates a `.purrcat/` directory in the project root with the following files:

| File | Purpose |
|------|---------|
| `.purrcat/model.json` | Model API keys, Base URL, rate limits |
| `.purrcat/activate_sensor.json` | Sensor config (Feishu/RSS/Clock/Audio) |
| `.purrcat/file.json` | File system whitelist & sandbox mounts |
| `.purrcat/mcp_config.json` | MCP server extensions |
| `.purrcat/memory.json` | Memory system config |
| `.purrcat/note.json` | Note tool preferences |
| `.purrcat/core/cron.json` | Scheduled tasks |
| `.purrcat/core/MEMORY.md` | System memory archive |
| `.purrcat/core/SOUL.md` | Agent personality |
| `.purrcat/core/SOLO.md` | Autonomous patrol rules |

### 5.2 Configure Model Keys

Edit `.purrcat/model.json` and replace the API key placeholders:

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

**Notes**:
- PurrCat currently supports only OpenAI SDK-compatible models
- `main` section: model used by the global Agent
- `task` section: model used by background subtasks (must use a different API key from `main`)
- `vision` section: multimodal vision model (optional, provides a dedicated Vision consultant for non-vision LLMs)
- Multiple API keys can be configured — the system will auto-balance load

### 5.3 View Environment Reference

```bash
purrcat env
```

> Note: The current version does not support environment variable overrides. Edit `.purrcat/` files directly.

## 6. Starting the Service

### 6.1 Standard Mode (TUI)

```bash
purrcat start
```

### 6.2 WebUI Mode

```bash
purrcat start --webui
```

On startup, the system will:
1. Initialize MCP connections and fetch tool schemas
2. Start the Agent main loop
3. Auto-discover and start configured Sensors (Feishu, RSS, etc.)
4. Launch the TUI interface (skipped in --webui mode, only API + frontend are started)

**Shutdown**: Press `Ctrl+C` in the terminal to safely terminate all processes.
