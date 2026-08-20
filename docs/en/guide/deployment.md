# Deployment Guide

Welcome to PurrCat! This document will guide you through deploying and configuring the PurrCat private Agent framework locally from source code.

> 💡 Don't want to deploy from source? You can also grab the packaged desktop installer from [GitHub Releases](https://github.com/PurrPod/purrcat/releases) (**verified on Windows**; the macOS build cannot be guaranteed to work, so source deployment is preferred).

## 1. Prerequisites

Deploying PurrCat requires only one **core dependency**: **Docker** (used to build and run the local sandbox environment).

**uv**, **Git**, and **Node.js** are **not required for deployment** — the core Agent runs fine without them. However, they are the dependencies you need to **fully experience the extension ecosystem** (installing Skills, connecting MCP servers, building the desktop/Web frontend). Skipping them won't block deployment, but will heavily limit the extension gameplay, so installing them is recommended.

| Tool | Purpose | When you need it |
|------|---------|------------------|
| [Docker](https://docs.docker.com/get-docker/) | Sandbox container engine | **Core requirement** (sandboxed Bash, file isolation) |
| [uv](https://docs.astral.sh/uv/) | Python package manager | `purrcat setup` one-click deploy, Python dependency management |
| Node.js 18+ | Provides `npm`/`npx` | Building the frontend (Electron desktop / Web UI), some MCP extensions |
| Git | Version control | `git clone` source code, pulling community skills/sensors (or download the ZIP) |

### Docker (Core Requirement)

Used to build and run PurrCat's exclusive local sandbox environment, ensuring safe file operations.

- **Windows:** `winget install Docker.DockerDesktop`
- **macOS:** `brew install --cask docker`
- **Linux:** `curl -fsSL https://get.docker.com | sh`

> **Note:**
> 1. After installing, **restart your terminal** to ensure the environment variables take effect.
> 2. Before running PurrCat, make sure the Docker service is running in the background.

### uv (Optional, Recommended for Extensions)

Used to install all of PurrCat's Python dependencies; `purrcat setup` relies on it for one-click deployment.

- **Linux / macOS:**
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
- **Windows (PowerShell):**
  ```powershell
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```

### Node.js (Optional, Required for Extensions)

Provides `npm`/`npx` to build the frontend (Electron desktop / Web UI) and run some MCP extension tools. The core Agent works without it, but the desktop and web interfaces won't be available.

- **Windows:**
  ```powershell
  winget install OpenJS.NodeJS
  ```
- **macOS:**
  ```bash
  brew install node
  ```
- **Linux (Ubuntu/Debian):**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

### Git (Optional, Recommended)

Used for `git clone` to fetch the source code and pull community skills/sensors. Alternatively, download the ZIP archive without installing Git.

- **Windows:** `winget install Git.Git`
- **macOS:** `brew install git`
- **Linux (Ubuntu/Debian):** `sudo apt-get install -y git`

### Verify Installation

After restarting your terminal, run the following commands to confirm the installed tools work:

```bash
# Verify Docker (required)
docker --version
docker info

# Verify uv (optional)
uv --version

# Verify Node.js and npx (optional)
node --version
npx --version

# Verify Git (optional)
git --version
```

It's fine if the `(optional)` commands are not installed; `docker --version` and `docker info` must output successfully.

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
1. Detect the Docker engine (required; prompts you to install Docker Desktop if missing)
2. Select sandbox image variant (lightweight or full)
3. Choose image source (**pull from ghcr.io recommended**, or build locally)
4. If building locally, select APT mirror
5. Obtain sandbox image (pull or build)
6. Resolve and install Python dependencies (`uv sync`)
7. Download Embedding model
8. Optionally install frontend dependencies (npm install, needed for the Electron desktop / Web UI)

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

PurrCat **auto-detects the `~/.purrcat/` config directory on first launch** and generates default templates if missing — no manual initialization required. To reset to defaults, delete the directory and restart.

The `~/.purrcat/` directory contains the following files:

| File | Purpose |
|------|---------|
| `.purrcat/model.json` | Model API keys, Base URL, rate limits |
| `.purrcat/activate_sensor.json` | Sensor activation config (empty by default, filled by market installs) |
| `.purrcat/file.json` | File system whitelist & sandbox mounts |
| `.purrcat/mcp_config.json` | MCP server extensions |
| `.purrcat/app_config.json` | App shortcut config (ComputerUse launch_app) |
| `.purrcat/core/cron.json` | Scheduled tasks |
| `.purrcat/core/heartbeat.json` | Heartbeat config (interval / active) |
| `.purrcat/core/MEMORY.md` | System memory archive |
| `.purrcat/core/SOUL.md` | Agent personality |
| `.purrcat/core/GOAL.md` | Goals / to-dos (heartbeat injection) |
| `.purrcat/core/PARADIGM.yaml` | Agent execution paradigm (triggers / hooks / checks) |

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

### 5.3 Frontend Launch

After configuring the model keys, launch the frontend (see Section 6). For the Electron desktop:

```bash
npm install && npm install --prefix ui && npm run dev
```

> Note: All settings live in `~/.purrcat/` files; there are no environment variable overrides in the current version.

## 6. Starting the Service

### 6.1 Electron Desktop (Recommended)

After completing the deployment above, install the frontend and desktop dependencies, then start everything with one command:

```bash
npm install                 # Root dependencies (Electron, etc.)
npm install --prefix ui     # Frontend dependencies
npm run dev                 # Launches backend + frontend + Electron desktop window
```

### 6.2 Web UI (Lightweight, No Desktop)

If you only want to use it in a browser, skip Electron by building the frontend static assets and starting the API-only mode:

```bash
npm install --prefix ui
npm run build:ui                            # Build frontend assets
uv run python main.py --api --headless      # Open http://localhost:8000 in a browser
```

> Note: several features (local file access, terminal, etc.) depend on the Electron runtime and may misbehave in a plain browser. The desktop client is recommended for full functionality.

### 6.3 Package a Desktop Installer (Optional)

```bash
npm run dist    # Build the frontend and invoke electron-builder to produce an installer (output to release/)
```

On startup, the system will:
1. Initialize MCP connections and fetch tool schemas
2. Start the Agent main loop
3. Auto-discover and start configured Sensors (Feishu, RSS, etc.)

**Shutdown**: Close the Electron window, or press `Ctrl+C` in the terminal for Web UI mode to safely terminate all processes.
