# Deployment Guide

Welcome to PurrCat! This document will guide you through deploying and configuring the PurrCat private Agent framework locally from source code.

> 💡 **Windows users** can download the desktop installer directly from the **latest** [GitHub Releases](https://github.com/PurrPod/purrcat/releases/latest) and run it out of the box. **macOS / Linux builds** are not yet tested due to limited manpower, so source deployment is currently the only option on those platforms. That said, the project is still evolving rapidly — deploying from source is always the best choice to get the latest features and fixes as soon as they land.

## 1. Prerequisites

What you need depends on how you deploy:

- **Installer (Windows)**: grab the desktop installer directly from the [latest Release](https://github.com/PurrPod/purrcat/releases/latest). This path **only requires Docker** as a core dependency — no extra tools needed;
- **From source**: besides **Docker**, you also need **uv** and **Node.js** (uv powers `purrcat setup` one-click deployment and Python dependency management; Node.js builds the Electron desktop / Web UI frontend), plus **Git** to fetch the source code.

| Tool | Purpose | When you need it |
|------|---------|------------------|
| [Docker](https://docs.docker.com/get-docker/) | Sandbox container engine | **Required for both paths** (sandboxed Bash, file isolation) |
| [uv](https://docs.astral.sh/uv/) | Python package manager | **Source deployment only** (`purrcat setup` one-click deploy, Python deps) |
| Node.js 18+ | Provides `npm`/`npx` | **Source deployment only** (builds the Electron desktop / Web UI frontend) |
| Git | Version control | **Source deployment recommended** (`git clone`, community skills/sensors; or download the ZIP) |

### Docker (Core Requirement)

Used to build and run PurrCat's exclusive local sandbox environment, ensuring safe file operations.

- **Windows:** `winget install Docker.DockerDesktop`
- **macOS:** `brew install --cask docker`
- **Linux:** `curl -fsSL https://get.docker.com | sh`

> **Note:**
> 1. After installing, **restart your terminal** to ensure the environment variables take effect.
> 2. Before running PurrCat, make sure the Docker service is running in the background.

### uv (Required for Source Deployment)

Required when deploying from source: installs all Python dependencies, and `purrcat setup` relies on it for one-click deployment.

- **Linux / macOS:**
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
- **Windows (PowerShell):**
  ```powershell
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```

### Node.js (Required for Source Deployment)

Required when deploying from source: provides `npm`/`npx` to build the frontend (Electron desktop / Web UI) from source and run some MCP extension tools. The installer already bundles the compiled frontend, so none of this is needed on that path.

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

### Git (Recommended for Source Deployment)

Recommended when deploying from source: `git clone` the source code and pull community skills/sensors. Alternatively, download the ZIP archive without installing Git.

- **Windows:** `winget install Git.Git`
- **macOS:** `brew install git`
- **Linux (Ubuntu/Debian):** `sudo apt-get install -y git`

### Verify Installation

After restarting your terminal, run the following commands to confirm the installed tools work:

```bash
# Verify Docker (required for both paths)
docker --version
docker info

# Verify uv (source deployment only)
uv --version

# Verify Node.js and npx (source deployment only)
node --version
npx --version

# Verify Git (source deployment only)
git --version
```

For the installer path, only Docker needs to pass. For source deployment, all of the above should be ready.

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

## 5. Starting the Service

### 5.1 Electron Desktop (Recommended)

After completing the deployment above, install the frontend and desktop dependencies, then start everything with one command:

```bash
npm install                 # Root dependencies (Electron, etc.)
npm install --prefix ui     # Frontend dependencies
npm run dev                 # Launches backend + frontend + Electron desktop window
```

### 5.2 Web UI (Lightweight, No Desktop)

If you only want to use it in a browser, skip Electron by building the frontend static assets and starting the API-only mode:

```bash
npm install --prefix ui
npm run build:ui                            # Build frontend assets
uv run python main.py --api --headless      # Open http://localhost:8000 in a browser
```

> Note: several features (local file access, terminal, etc.) depend on the Electron runtime and may misbehave in a plain browser. The desktop client is recommended for full functionality.

**Shutdown**: Close the Electron window, or press `Ctrl+C` in the terminal for Web UI mode to safely terminate all processes.

## 6. Configure Models & Start Using

Once the service is running, finish all model configuration right in the UI — no manual file editing required:

1. Open the PurrCat interface and click the **Settings** entry in the top-right corner
2. Enter your API Key in the model settings (any OpenAI SDK-compatible model works, e.g. DeepSeek); adjust the Base URL if needed
3. Save, and you are ready to go

> Config files (`~/.purrcat/`) are auto-generated with default templates on first launch, and UI changes are written back to them automatically. To reset to defaults, delete the directory and restart.

For the meaning of the `main` / `task` / `vision` model fields, multi-key load balancing, and other advanced settings, see the [Configuration Guide](./configuration).
