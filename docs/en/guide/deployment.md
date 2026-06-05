# Deployment Guide

Welcome to PurrCat! This document will guide you through deploying and configuring the PurrCat private Agent framework locally from source code.

## 1. Prerequisites

Before you begin, ensure that the following basic dependencies are installed on your computer:

- **Miniconda or Anaconda**: Used to manage and isolate Python virtual environments (ensure it's added to your system PATH).
- **Docker or Podman**: Used to build and run PurrCat's exclusive local sandbox environment. The system auto-detects available container engines (Docker preferred). Make sure the engine service is running.

> Note: PurrCat uses a Python Textual TUI as its user interface. However, if you plan to use MCP extensions (Playwright, GitHub, etc.), **Node.js** (providing `npx`) and optionally **uv** (Python package manager) are still required on the host, depending on your MCP Server configuration.

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
purrcat setup
```



The script will automatically complete the following steps (see Section 4 for detailed breakdown):
1. Auto-detect container engine (supports **Docker / Podman**)
2. Select sandbox image variant (full `Dockerfile.full` or light `Dockerfile.light`)
3. Interactive APT mirror selection (select 2 for Aliyun mirror if you're in China)
4. Build sandbox image `my_agent_env:latest`
5. Create/update Conda environment `PurrCat`
6. Download Embedding model
7. Optionally install **WebUI** frontend dependencies (npm install)

> The entire process depends on network conditions. The first image pull may take 5~15 minutes. Engine preference is saved to `~/.purrcat/settings.json`.

## 4. Script Breakdown & Manual Steps

If the one-click deployment fails, use the breakdown below to execute steps individually and locate the issue.

### 4.1 Docker Sandbox Build

```bash
# For users in China (faster with Aliyun mirror):
docker build -t my_agent_env:latest --build-arg APT_MIRROR="mirrors.aliyun.com" .

# Using official source:
docker build -t my_agent_env:latest --build-arg APT_MIRROR="deb.debian.org" .
```

**What the script does**:
- Builds on `python:3.10-slim` base image
- Installs system packages: curl, git, vim, ffmpeg, jq, etc.
- Installs Node.js 20.x (for in-sandbox toolchains)
- Configures PyPI mirror (Aliyun)
- Sets working directory to `/agent_vm`

**Common failures**:

| Issue | Solution |
|-------|----------|
| Docker not installed or not running | Start Docker Desktop, verify `docker info` works |
| Image pull timeout | Switch APT mirror, or configure Docker mirror accelerator |
| Insufficient disk space | Clean up: `docker system prune -a` |
| Docker Hub anonymous pull limit | Log in to a Docker Hub account or wait for reset |

### 4.2 Conda Environment Setup

```bash
# Create Conda environment
conda env create -f environment.yml

# Update if environment already exists
conda env update -f environment.yml --prune
```

**Core dependencies**:
- Python 3.10 + OpenAI SDK + MCP protocol
- Faiss (vector search) + Sentence-Transformers (embeddings)
- Textual (TUI framework)
- Docker SDK + Playwright (sandbox & automation)
- Lark SDK (Feishu) + Feedparser (RSS)

**Common failures**:

| Issue | Solution |
|-------|----------|
| Conda command not found | Ensure Miniconda is in your system PATH |
| Package download timeout | Configure Conda mirror or use a VPN |
| Environment conflict | Remove and recreate: `conda env remove -n PurrCat` |

### 4.3 Embedding Model Download

```bash
conda run -n PurrCat python scripts/setup_emb.py
```

Downloads the Embedding model (default: `BAAI/bge-small-zh-v1.5`) for RAG and memory vectorization.

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

### 6.2 Headless Mode (No UI)

```bash
purrcat start --headless
```

### 6.3 Using Scripts Directly

```bash
# macOS / Linux
bash `purrcat start`

# Windows
# Double-click `purrcat start`
```

On startup, the system will:
1. Initialize MCP connections and fetch tool schemas
2. Start the Agent main loop
3. Auto-discover and start configured Sensors (Feishu, RSS, etc.)
4. Launch the TUI interface (skipped in headless mode)

**Shutdown**: Press `Ctrl+C` in the terminal to safely terminate all processes.
