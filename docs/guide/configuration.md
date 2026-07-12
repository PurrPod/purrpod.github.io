# 配置说明

系统的所有配置文件均由 CLI 统一管理，存放在项目根目录的 `.purrcat/` 文件夹下。使用 `purrcat init` 交互式生成。

所有配置文件均为 **JSON 格式**，编辑后保存即可生效（部分配置需重启）。

## 目录结构

```
.purrcat/
├── model.json               # 模型 API Key 与速率限制
├── activate_sensor.json     # 传感器（飞书/RSS/时钟/语音）开关
├── file.json                # 文件系统白名单与沙盒挂载
├── memory.json              # PurrMemo 记忆系统配置
├── mcp_config.json          # MCP 服务器扩展配置
├── note.json                # 笔记工具偏好设置
└── core/
    ├── MEMORY.md            # 核心通用记忆（用户画像/工作经验）
    ├── SOLO.md              # 自主巡查规约（挂机行为规范）
    ├── SOUL.md              # Agent 人格定义（灵魂注入）
    └── cron.json            # 定时任务列表
```

---

## 1. 模型配置 (`model.json`)

配置模型 API Key、Base URL、速率限制等。**注意：旧版 `.model.yaml` 已弃用，统一使用 JSON 格式。**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Embedding model for RAG retrieval, skill search, memory operations",
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

### 字段说明

| 字段 | 说明 |
|------|------|
| `embedding` | 嵌入模型路径或 HuggingFace 名称，默认读取本地 `embedding/` 文件夹 |
| `main` | 全局 Agent 使用的主模型。键名为 `{适配器}:{模型名}` 格式 |
| `task` | 后台子任务使用的模型，键结构与 `main` 相同，**必须用不同的 API Key** |
| `vision` | 多模态视觉模型配置（可选） |
| `api_keys` | 列表，支持填入多个 Key，系统自动选择最空闲的 Key 调度 |
| `rpm` / `tpm` | 每分钟请求数 / Token 上限 |
| `concurrency` | 最大并发数 |
| `max_token` | 记忆窗口 Token 上限 |

### 多 Key 负载均衡

`api_keys` 列表支持多个 Key，系统通过 `APIKeyManager` 自动选择**当前最空闲**的 Key。

---

## 2. 传感器配置 (`activate_sensor.json`)

所有传感器默认关闭，需将 `enabled` 设为 `true` 才能激活。

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
      "SUBSCRIPTIONS": "[{\"name\":\"Lilian Weng's Blog\",\"rss_url\":\"https://lilianweng.github.io/lil-log/feed.xml\"}]"
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

### 传感器列表

| 配置键名 | 传感器 | 类型 | 功能 |
|----------|--------|------|------|
| `feishu_bot` | 飞书机器人 | message | 双向 Markdown 卡片通讯 |
| `system_clock` | 系统时钟 | system | 定时心跳 + cron 闹钟轮询 |
| `rss_watcher` | RSS 订阅 | subscribe | 定时抓取博客文章更新 |
| `audio_assistant` | 语音助手 | system | 环境语音监听（Whisper + TTS） |

每个传感器通过独立子进程运行，由 `manager.py` 统一管理，崩溃互不影响。

---

## 3. 文件系统配置 (`file.json`)

定义 Agent 在宿主机上的文件操作权限边界。

```json
{
  "dont_read_dirs": [
    ".git",
    "src",
    "node_modules",
    "miniconda3",
    ".baoyu-skills",
    ".env",
    ".purrcat"
  ],
  "allowed_export_dirs": ["D:/test", "./agent_vm", "./exports"],
  "docker_mount": ["sandbox/"],
  "sandbox_dirs": ["sandbox/", "agent_vm/"],
  "skill_dir": ["skills"]
}
```

### 字段说明

| 字段 | 说明 |
|------|------|
| `dont_read_dirs` | **隐私黑名单**。禁止读取/导入的目录，保护敏感文件 |
| `allowed_export_dirs` | **导出白名单**。沙盒文件可导出到宿主机的目录 |
| `docker_mount` | **挂载通道**。挂载到 Docker 沙盒的宿主机目录 |
| `sandbox_dirs` | **操作域**。Agent 在本地文件系统中的可读写空间 |
| `skill_dir` | 技能包目录（默认 `skills/`） |

---

## 4. 记忆系统配置 (`memory.json`)

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

**注意**：`openai` 段的模型专用于 PurrMemo 记忆引擎的后台异步消化与图谱构建，不会影响主 Agent 的对话。

---

## 5. MCP 扩展配置 (`mcp_config.json`)

配置 Model Context Protocol (MCP) 服务器扩展：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--user-data-dir=agent_vm/.buffer/playwright",
        "--output-dir=agent_vm/.buffer/screenshots"
      ]
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

系统启动时自动拉取所有 MCP Server 的工具 Schema 并缓存。

---

## 6. 笔记配置 (`note.json`)

配置笔记工具的行为偏好：

```json
{
  "skill": ["docx", "pptx", "xlsx"],
  "expectation": [
    "when ask you for analyse the note, please read all the content before starting analysis"
  ]
}
```

---

## 7. 核心文件 (`.purrcat/core/`)

| 文件 | 用途 | 说明 |
|------|------|------|
| `MEMORY.md` | 系统级记忆档案 | 固化用户画像与工作经验，会话启动时注入 System Prompt |
| `SOUL.md` | Agent 人格定义 | 定义性格、语气、价值观，从根本上决定 Agent 行为基调 |
| `SOLO.md` | 自主巡查规约 | 定义挂机时的活动清单与安全底线（沙盒清理/本体追踪/项目巡查） |
| `cron.json` | 定时任务清单 | 由系统时钟传感器轮询，触发定时唤醒 |

---

## 8. CLI 命令参考

| 命令 | 用途 | 示例 |
|------|------|------|
| `purrcat setup` | 一键部署（沙盒构建 + Python 依赖安装 + 嵌入模型） | `purrcat setup` |
| `purrcat init` | 交互式生成 `.purrcat/` 配置 | `purrcat init --force` |
| `purrcat install` | 安装扩展（skill / node / graph） | `purrcat install skill <url>` |
| `purrcat update` | 从 GitHub Releases 更新框架 | `purrcat update --version="2026.05.15"` |
| `purrcat start` | 启动 PurrCat | `purrcat start --webui` |
| `purrcat help` | 显示帮助菜单（含 ASCII 猫猫 Logo） | `purrcat help` |

### 扩展安装详解

```bash
# 安装社区 Skill（任意 GitHub 仓库的子目录）
purrcat install skill https://github.com/user/repo/tree/main/path/to/skill

# 安装官方节点/图（从 PurrPod 官方仓库）
purrcat install node web_search
purrcat install graph daily_summary
```

### 版本更新

```bash
# 更新到最新稳定版
purrcat update

# 更新到指定版本
purrcat update --version="2026.05.15"
```

更新流程：拉取 tag → checkout → 同步 Python 依赖（uv sync）→ 执行 post-update 迁移脚本。

---

## 辅助配置

### 容器引擎

`purrcat setup` 会自动检测 Docker 和 Podman，并将选择结果保存到 `~/.purrcat/settings.json`。

### WebUI

`purrcat setup` 可选安装 WebUI 前端依赖。启动时加 `--webui` 参数即可同时启动后端 API 与前端开发服务器：

```bash
purrcat start --webui
```
