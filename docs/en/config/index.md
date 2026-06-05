# Configuration Guide

All configuration files are managed by the CLI and stored in the `.purrcat/` directory at the project root. Use `purrcat init` to interactively generate them.

All configuration files are in **JSON format** — edit and save to apply (some require restart).

## Directory Structure

```
.purrcat/
├── model.json               # Model API Keys & rate limits
├── activate_sensor.json     # Sensor toggles (Feishu/RSS/Clock/Audio)
├── file.json                # File system whitelist & sandbox mounts
├── memory.json              # PurrMemo memory system config
├── mcp_config.json          # MCP server extensions config
├── note.json                # Note tool preferences
└── core/
    ├── MEMORY.md            # Core general memory (user profile/experience)
    ├── SOLO.md              # Autonomous patrol rules (idle behavior)
    ├── SOUL.md              # Agent personality definition
    └── cron.json            # Scheduled task list
```

---

## 1. Model Configuration (`model.json`)

Configure API Keys, Base URL, rate limits. **Note: Legacy `.model.yaml` is deprecated — use JSON format.**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
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

| Field | Description |
|-------|-------------|
| `embedding` | Embedding model path or HuggingFace name, defaults to local `embedding/` folder |
| `main` | Main model for global Agent. Key format is `{adapter}:{model_name}` |
| `task` | Model for background subtasks, **must use different API Keys** from `main` |
| `vision` | Multimodal vision model (optional) |
| `api_keys` | List of API Keys; system auto-selects the least busy one |
| `rpm` / `tpm` | Requests / Tokens per minute limit |
| `concurrency` | Max concurrent requests |
| `max_token` | Memory window token limit |

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
    "enabled": true,
    "env": {
      "INTERVAL": "1800",
      "CRON_FILE": ".purrcat/core/cron.json"
    },
    "capabilities": { "observe": true, "express": false }
  },
  "rss_watcher": {
    "enabled": false,
    "env": {
      "INTERVAL": "1800",
      "SUBSCRIPTIONS": "[{\"name\":\"Blog\",\"rss_url\":\"https://example.com/feed.xml\"}]"
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

| Config Key | Sensor | Type | Description |
|------------|--------|------|-------------|
| `feishu_bot` | Feishu Bot | message | Bidirectional Markdown card communication |
| `system_clock` | System Clock | system | Heartbeat + cron alarm polling |
| `rss_watcher` | RSS Watcher | subscribe | Blog article push monitoring |
| `audio_assistant` | Audio Assistant | system | Ambient voice capture (Whisper + TTS) |

Each sensor runs as an independent sub-process managed by `manager.py` — crashes are isolated.

---

## 3. File System Configuration (`file.json`)

Defines Agent file operation permissions on the host.

```json
{
  "dont_read_dirs": [
    ".git", "src", "node_modules", "miniconda3",
    ".baoyu-skills", ".env", ".purrcat"
  ],
  "allowed_export_dirs": ["D:/test", "./agent_vm", "./exports"],
  "docker_mount": ["sandbox/"],
  "sandbox_dirs": ["sandbox/", "agent_vm/"],
  "skill_dir": ["skills"]
}
```

| Field | Description |
|-------|-------------|
| `dont_read_dirs` | Privacy blacklist — directories Agent cannot read/import |
| `allowed_export_dirs` | Export whitelist — where sandbox files can be exported |
| `docker_mount` | Mount channel — host directories mounted into Docker sandbox |
| `sandbox_dirs` | Operation domain — Agent's writable space on the host |
| `skill_dir` | Skill package directory (default: `skills/`) |

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

**Note**: The `openai` section is dedicated to the PurrMemo memory engine's background digestion — it does not affect the main Agent conversation.

---

## 5. MCP Extension Configuration (`mcp_config.json`)

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest",
        "--user-data-dir=agent_vm/.buffer/playwright",
        "--output-dir=agent_vm/.buffer/screenshots"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "" }
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

The system auto-fetches all MCP Server tool Schemas on startup and caches them.

---

## 6. Note Configuration (`note.json`)

```json
{
  "skill": ["docx", "pptx", "xlsx"],
  "expectation": [
    "when ask you for analyse the note, please read all the content before starting analysis"
  ]
}
```

---

## 7. Core Files (`.purrcat/core/`)

| File | Purpose | Description |
|------|---------|-------------|
| `MEMORY.md` | System memory archive | User profile & work experience, injected as System Prompt |
| `SOUL.md` | Agent personality | Defines tone, values, behavior baseline |
| `SOLO.md` | Autonomous patrol rules | Idle activity checklist & security boundaries |
| `cron.json` | Scheduled tasks | Polled by system clock sensor for timed wake-ups |

---

## 8. CLI Command Reference

| Command | Purpose | Example |
|---------|---------|---------|
| `purrcat setup` | One-click deploy (sandbox + Python deps + model) | `purrcat setup` |
| `purrcat init` | Generate `.purrcat/` config interactively | `purrcat init --force` |
| `purrcat install` | Install extensions (skill/node/graph) | `purrcat install skill <url>` |
| `purrcat update` | Update framework from GitHub Releases | `purrcat update --version="2026.05.15"` |
| `purrcat start` | Launch PurrCat | `purrcat start --webui` |
| `purrcat help` | Show help (with ASCII cat logo) | `purrcat help` |

### Extension Installation

```bash
# Install community Skill from any GitHub repo subdirectory
purrcat install skill https://github.com/user/repo/tree/main/path/to/skill

# Install official node/graph from PurrPod repos
purrcat install node web_search
purrcat install graph daily_summary
```

### Version Update

```bash
# Update to latest stable release
purrcat update

# Update to a specific version
purrcat update --version="2026.05.15"
```

---

## Miscellaneous

### Container Engine

`purrcat setup` auto-detects Docker and Podman, saving the preference to `~/.purrcat/settings.json`.

### WebUI

Optionally install WebUI dependencies during `purrcat setup`. Launch with `--webui` to start both the backend API and frontend dev server:

```bash
purrcat start --webui
```
