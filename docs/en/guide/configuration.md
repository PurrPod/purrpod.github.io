# Configuration Guide

All configuration files are stored in the `~/.purrcat/` directory under your home folder. They are auto-generated on first launch — no manual initialization needed. You can also edit and save them from the frontend.

All configuration files are in **JSON format** — edit and save to apply (some require restart).

## Directory Structure

```
~/.purrcat/
├── model.json               # Model API Keys & rate limits
├── activate_sensor.json     # Sensor activation config (empty by default, filled by market installs)
├── file.json                # File system permission model
├── mcp_config.json          # MCP server extensions config
├── app_config.json          # App shortcut config (ComputerUse launch_app)
├── settings.json            # Global settings (data_root, etc.)
└── core/
    ├── MEMORY.md            # Core general memory (user profile / work experience)
    ├── SOUL.md              # Agent personality definition (soul injection)
    ├── GOAL.md              # Goals / to-dos (heartbeat injection)
    ├── PARADIGM.yaml        # Agent execution paradigm (triggers / hooks / tool checks)
    ├── cron.json            # Scheduled task list
    ├── heartbeat.json       # Heartbeat config (interval / active)
    └── info.json            # Installed skills & workshops index
```

---

## 1. Model Configuration (`model.json`)

Configure API Keys, Base URL, rate limits, etc.

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

### Field Reference

| Field | Description |
|-------|-------------|
| `embedding` | Embedding model path or HuggingFace name, defaults to local `embedding/` folder |
| `main` | Main model for global Agent. Key format is `{adapter}:{model_name}` |
| `task` | Model for background subtasks (optional, empty falls back to `main`) |
| `vision` | Multimodal vision model (optional, empty means disabled) |
| `api_keys` | List of API Keys; system auto-selects the least busy one |
| `rpm` / `tpm` | Requests / Tokens per minute limit |
| `concurrency` | Max concurrent requests |
| `max_token` | Memory window token limit |

### Multi-Key Load Balancing

The `api_keys` list supports multiple keys. The system's `APIKeyManager` automatically selects the **least busy** key. Using separate keys for `main` and `task` prevents background tasks from competing with the main model.

---

## 2. Sensor Configuration (`activate_sensor.json`)

PurrCat adopts a **configuration-as-installation** model: sensor scripts are not pre-installed — install them from the UI market's "Sensors" page and they are written into this file automatically. You can also add entries manually; if the local script is missing at startup, the system pulls it from the cloud (GitHub) automatically. All sensors are disabled by default — set `enabled` to `true` to activate.

```json
{
  "feishu_bot": {
    "enabled": false,
    "env": {
      "FEISHU_APP_ID": "",
      "FEISHU_APP_SECRET": "",
      "FEISHU_CHAT_ID": ""
    },
    "capabilities": { "observe": true, "express": true }
  },
  "system_clock": {
    "enabled": false,
    "env": {
      "CRON_FILE": ".purrcat/core/cron.json"
    },
    "capabilities": { "observe": true, "express": false }
  },
  "rss_watcher": {
    "enabled": false,
    "env": {
      "INTERVAL": "1800",
      "RSS_SUBSCRIPTIONS_JSON": "[{\"name\":\"Blog\",\"rss_url\":\"https://example.com/feed.xml\"}]"
    },
    "capabilities": { "observe": true, "express": false }
  },
  "audio_assistant": {
    "enabled": false,
    "env": {
      "WHISPER_MODEL": "small",
      "LANGUAGE": "zh",
      "TTS_RATE": "150",
      "TTS_VOLUME": "1.0"
    },
    "capabilities": { "observe": true, "express": true }
  }
}
```

### Sensor Table

| Config Key | Sensor | Type | Description |
|------------|--------|------|-------------|
| `feishu_bot` | Feishu Bot | message | Bidirectional Markdown card communication |
| `system_clock` | System Clock | system | cron alarm polling (heartbeat lives in `core/heartbeat.json`) |
| `rss_watcher` | RSS Watcher | subscribe | Blog article push monitoring |
| `audio_assistant` | Audio Assistant | system | Ambient voice capture (Whisper + TTS) |

Each sensor runs as an independent sub-process managed by `manager.py` — crashes are isolated and don't affect the main process.

> **Note**: The RSS env var is `RSS_SUBSCRIPTIONS_JSON` (not `SUBSCRIPTIONS`). Pass a JSON-encoded array of `{name, rss_url}` objects.

---

## 3. File System Configuration (`file.json`)

Defines Agent file operation permissions on the host using a three-tier permission model:

```json
{
  "default_permission": "readonly",
  "permissions": {
    "blocked": [
      ".git",
      "src",
      "node_modules",
      "miniconda3",
      ".env",
      ".purrcat"
    ],
    "readonly": [
      "D:/cat-in-cup/.purrcat"
    ],
    "writable": [
      "./agent_vm",
      "./exports",
      "skills",
      "D:/test"
    ]
  }
}
```

### Permission Model

| Field | Description |
|-------|-------------|
| `default_permission` | Default permission for unlisted paths: `readonly` or `blocked` |
| `blocked` | **Privacy blacklist** — directories Agent cannot read, write, or import |
| `readonly` | **Read-only whitelist** — Agent can read but not modify |
| `writable` | **Read-write whitelist** — Agent can freely create, modify, and delete |

The system matches whitelist entries first; unlisted paths fall back to `default_permission`. This three-tier model is more flexible than the previous flat structure — for instance, `.purrcat` itself can be set to `readonly` to prevent accidental edits, rather than being completely blocked.

## 4. File System Configuration (`file.json`)

Defines the Agent's file operation permission boundary on the host using a **three-tier permission model**.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$comment": "PurrCat File System Configuration File",
  "default_permission": "readonly",
  "permissions": {
    "blocked": [
      ".git",
      "src",
      "node_modules",
      "miniconda3",
      ".env",
      ".purrcat"
    ],
    "readonly": [],
    "writable": [
      "./agent_vm",
      "./exports",
      "skills",
      "D:/test"
    ]
  }
}
```

### Fields

| Field | Description |
|-------|-------------|
| `default_permission` | Default access level: `"readonly"` or `"blocked"` |
| `permissions.blocked` | **Privacy blacklist** — directories the Agent cannot read, import, or write to. Protects sensitive system files |
| `permissions.readonly` | **Read-only whitelist** — directories the Agent can read but not modify |
| `permissions.writable` | **Write whitelist** — directories where the Agent can create, edit, and delete files |

The system enforces these rules at the physical filesystem level. Any attempted access outside the defined permissions is intercepted and requires human approval via `Request` tool.

---

## 4. Memory System Configuration (`memory.json`)

```json
{
  "openai": {
    "api_key": "",
    "base_url": "https://api.deepseek.com",
    "model_name": "deepseek-v4-flash"
  },
  "chromadb": {
    "persist_directory": "data/memory/chromadb",
    "collection_name": "experiences",
    "embedding_model": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
  },
  "eventdb": { "db_path": "data/memory/events.db", "table_name": "events" },
  "graphdb": { "graph_path": "data/memory/graph.pkl", "min_confidence": 0.3 },
  "buffer": {
    "buffer_dir": "data/memory/buffer",
    "pending_dir": "data/memory/buffer/pending",
    "archived_dir": "data/memory/buffer/archived",
    "error_dir": "data/memory/buffer/error"
  },
  "memory_agent": { "polling_interval": 5 },
  "rag": {
    "top_k_events": 5,
    "top_k_experiences": 5,
    "top_k_graph_nodes": 3,
    "max_graph_depth": 2
  }
}
```

**Note**: The `openai` section is dedicated to the PurrMemo memory engine's background asynchronous digestion and graph construction — it does not affect the main Agent conversation.

---

## 5. MCP Extension Configuration (`mcp_config.json`)

Configure Model Context Protocol (MCP) server extensions:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "" }
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    },
    "tradingview": {
      "command": "uvx",
      "args": ["--from", "tradingview-mcp-server", "tradingview-mcp"]
    }
  }
}
```

The system auto-fetches all MCP Server tool Schemas on startup and caches them.

Supported MCP launch methods:

| Method | Example | Use Case |
|--------|---------|----------|
| `npx` | `npx -y @modelcontextprotocol/server-github` | npm-published MCP packages |
| `uvx` | `uvx --from tradingview-mcp-server tradingview-mcp` | Python-published MCP packages |
| `uv run` | `uv run --directory ./mcps/my-server server.py` | Locally-developed MCP servers |

---

## 6. App Shortcut Configuration (`app_config.json`)

Provides a whitelist mapping for the Agent's ComputerUse `launch_app` action, enabling one-click app launching:

```json
{
  "WeChat": "D:\\\\Path\\\\to\\\\WeChat.exe",
  "GitHub": "https://github.com"
}
```

When the Agent calls ComputerUse's `launch_app` action, it queries this mapping. Each value supports three formats:

| Format | Description | Example |
|--------|-------------|---------|
| **URL** | Opens in default browser | `"https://github.com"` |
| **Executable path** | Launches local program directly | `"D:\\\\Program Files\\\\App\\\\app.exe"` |
| **Protocol URL** | Opens app via system protocol | `"obsidian://open?vault=notes"` |

---

## 7. Core Files (`.purrcat/core/`)

| File | Purpose | Description |
|------|---------|-------------|
| `MEMORY.md` | System memory archive | Fixes user profile & work experience, injected into System Prompt at startup |
| `SOUL.md` | Agent personality | Defines character, tone, values — the behavioral baseline |
| `GOAL.md` | Goals / to-dos | Current goals injected periodically by the heartbeat; empty file triggers a fallback prompt |
| `PARADIGM.yaml` | Execution paradigm | Declaratively defines triggers, lifecycle hooks, tool-use checks, and loop exit conditions |
| `cron.json` | Scheduled tasks | Polled by the system clock sensor to trigger timed wake-ups |
| `heartbeat.json` | Heartbeat config | Wakes the Agent at intervals while idle (interval / active) |
| `info.json` | Install index | Tracks installed Skills and Workshops |

### PARADIGM.yaml: Declarative Execution Paradigm

`~/.purrcat/core/PARADIGM.yaml` declaratively defines the Agent main loop's execution behavior with **near-natural-language rules**. Changes take effect after a restart — no core code changes needed:

```yaml
name: "default"
description: "default system loop"
loop_end_max_retry: 3          # Max retries for the main loop (prevents infinite loops)
trigger:                       # Scheduled triggers: wake the Agent and inject content
  - cron:
      time: "08:08"
      injection: "【Demo】闹钟响了"
hooks:                         # Lifecycle hooks: mount actions at key moments
  on_build_system_prompt:      # When building the system prompt
    - file_operation:
        path: "@RULES"
        action: "read"
  on_loop_end:                 # Before the loop exits
    - tool_use_check:          # Tool-use check: inject a reminder if not satisfied
        name: "Memo"
        parameter_check:
          - action: "add"
        failed_prompt: "You did not call Memo to summarize memory this round"
```

Key fields:

| Field | Description |
|-------|-------------|
| `trigger` | cron-based scheduled triggers and injections |
| `hooks.on_build_system_prompt` | File reads / memory injections when building the prompt |
| `hooks.on_loop_start` / `on_loop_epoch` | Prompt injections at loop start / per epoch |
| `hooks.on_loop_end` | Pre-exit checks (e.g., force memory archiving) |
| `hooks.on_tool_calling` | Checks and hints during tool calls |
| `loop_end_max_retry` | Loop exit condition (max retry count) |

`@symbol` references to system files (e.g., `@RULES`, `@SOUL`, `@MEMORY`) are supported; the default template ships at `src/agent/system_rules/PARADIGM.yaml`.

---

## 8. CLI Command Reference

| Command | Purpose | Example |
|---------|---------|---------|
| `purrcat setup` | One-click deploy (sandbox + Python deps + embedding model) | `purrcat setup` |
| `purrcat install` | Install extensions (skill / graph / mcp / sensor) | `purrcat install mcp tradingview` |
| `purrcat help` | Show help (with ASCII cat logo) | `purrcat help` |

> To launch PurrCat: **Electron desktop** `npm run dev`; **Web UI** `uv run python main.py --api --headless`. Config files are auto-generated on first launch — no CLI init needed.

### Extension Installation

```bash
# Install community Skill from any GitHub repo subdirectory
purrcat install skill https://github.com/user/repo/tree/main/path/to/skill

# Install MCP server from official registry
purrcat install mcp tradingview

# Install a sensor
purrcat install sensor feishu_bot

# Install Graph from PurrPod/graphs (auto-resolves MCP/Skill dependencies)
purrcat install graph daily_summary
```

### Version Update

```bash
# Pull the latest code and sync dependencies
git pull
uv sync

# Or check out a specific version
git checkout <tag>
uv sync
```

---

## Miscellaneous

### Container Engine

`purrcat setup` auto-detects the **Docker** engine (the current version only supports Docker; Podman is no longer supported), saving the preference to `~/.purrcat/settings.json`.

### Frontend (Electron Desktop / Web UI)

`purrcat setup` can optionally install frontend dependencies (npm install) for the Electron desktop or Web UI.

**Electron desktop (recommended)**:

```bash
npm install                 # Root dependencies (Electron, etc.)
npm install --prefix ui     # Frontend dependencies
npm run dev                 # Launches backend + frontend + Electron desktop window
```

**Web UI (lightweight, no desktop)**:

```bash
npm install --prefix ui
npm run build:ui                            # Build frontend assets
uv run python main.py --api --headless      # Open http://localhost:8000 in a browser
```
