# Configuration Guide

All configuration files are managed by the CLI and stored in the `.purrcat/` directory at the project root. Use `purrcat init` to interactively generate them.

All configuration files are in **JSON format** — edit and save to apply (some require restart).

## Directory Structure

```
.purrcat/
├── model.json               # Model API Keys & rate limits
├── activate_sensor.json     # Sensor config (Feishu/RSS/Clock/Audio)
├── file.json                # File system permission management (allow/block lists)
├── memory.json              # PurrMemo memory system config
├── mcp_config.json          # MCP server extensions config
├── app_config.json          # App shortcut config (ComputerUse launch_app)
└── core/
    ├── MEMORY.md            # Core general memory (user profile / work experience)
    ├── SOUL.md              # Agent personality definition (soul injection)
    ├── SOLO.md              # Autonomous patrol rules (idle behavior)
    ├── cron.json            # Scheduled task list
    ├── loop.json            # Periodic polling tasks (e.g., heartbeat check)
    ├── TODO.md              # To-do list
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

All sensors are disabled by default — set `enabled` to `true` to activate.

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
| `system_clock` | System Clock | system | Heartbeat + cron alarm polling |
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
| `MEMORY.md` | System memory archive | User profile & work experience, injected as System Prompt on session start |
| `SOUL.md` | Agent personality | Defines tone, values, and behavior baseline |
| `SOLO.md` | Autonomous patrol rules | Idle activity checklist & security boundaries (sandbox cleanup, self-tracking, project patrol) |
| `cron.json` | Scheduled tasks | Polled by system clock sensor for timed wake-ups |
| `loop.json` | Periodic polling tasks | Recurring tasks (e.g., heartbeat check) with interval and task hook |
| `TODO.md` | To-do list | Current to-do items, maintained by the Agent |
| `info.json` | Installation index | Tracks installed Skills and Workshops |

---

## 8. CLI Command Reference

| Command | Purpose | Example |
|---------|---------|---------|
| `purrcat setup` | One-click deploy (sandbox + Python deps + embedding model) | `purrcat setup` |
| `purrcat init` | Generate `.purrcat/` config interactively | `purrcat init --force` |
| `purrcat install` | Install extensions (skill / graph / mcp / sensor) | `purrcat install mcp tradingview` |
| `purrcat update` | Update framework from GitHub Releases | `purrcat update --version="2026.05.15"` |
| `purrcat start` | Launch PurrCat | `purrcat start --webui` |
| `purrcat help` | Show help (with ASCII cat logo) | `purrcat help` |

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
# Update to latest stable release
purrcat update

# Update to a specific version
purrcat update --version="2026.05.15"
```

Update process: pull tag → checkout → sync Python dependencies (`uv sync`) → execute post-update migration scripts.

---

## Miscellaneous

### Container Engine

`purrcat setup` auto-detects Docker and Podman, saving the preference to `~/.purrcat/settings.json`.

### WebUI

Optionally install WebUI dependencies during `purrcat setup`. Launch with `--webui` to start both the backend API and frontend dev server:

```bash
purrcat start --webui
```
