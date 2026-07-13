# 配置说明

系统的所有配置文件均由 CLI 统一管理，存放在项目根目录的 `.purrcat/` 文件夹下。使用 `purrcat init` 交互式生成，亦可以直接在前端编辑后保存。

所有配置文件均为 **JSON 格式**，编辑后保存即可生效（部分配置需重启）。

## 目录结构

```
.purrcat/
├── model.json               # 模型 API Key 与速率限制
├── activate_sensor.json     # 传感器配置（飞书/RSS/时钟/语音）
├── file.json                # 文件系统权限模型
├── memory.json              # PurrMemo 记忆系统配置
├── mcp_config.json          # MCP 服务器扩展配置
├── app_config.json          # 应用快捷配置
└── core/
    ├── MEMORY.md            # 核心通用记忆（用户画像/工作经验）
    ├── SOLO.md              # 自主巡查规约（挂机行为规范）
    ├── SOUL.md              # Agent 人格定义（灵魂注入）
    ├── TODO.md              # 待办事项清单
    ├── cron.json            # 定时任务列表
    ├── loop.json            # 循环轮询任务
    └── info.json            # 已安装技能/工作坊索引
```

---

## 1. 模型配置 (`model.json`)

配置模型 API Key、Base URL、速率限制等。

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

### 字段说明

| 字段 | 说明 |
|------|------|
| `embedding` | 嵌入模型路径或 HuggingFace 模型名，默认读取本地 `embedding/` 文件夹 |
| `main` | 全局 Agent 使用的主模型。键名为 `{适配器}:{模型名}` 格式 |
| `task` | 后台子任务使用的模型（可选，为空则复用 `main`） |
| `vision` | 多模态视觉模型配置（可选，为空则不启用） |
| `api_keys` | 列表，支持填入多个 Key，系统自动选择最空闲的 Key 调度 |
| `rpm` / `tpm` | 每分钟请求数 / Token 上限 |
| `concurrency` | 最大并发数 |
| `max_token` | 记忆窗口 Token 上限 |

### 多 Key 负载均衡

`api_keys` 列表支持多个 Key，系统通过 `APIKeyManager` 自动选择**当前最空闲**的 Key。

---

## 2. 传感器激活配置 (`activate_sensor.json`)

定义哪些传感器被激活及其运行参数。所有传感器默认关闭，需将 `enabled` 设为 `true` 才能激活。

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
      "RSS_SUBSCRIPTIONS_JSON": "[{\"name\":\"Lilian Weng's Blog\",\"rss_url\":\"https://lilianweng.github.io/lil-log/feed.xml\"}]"
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
| `rss_watcher` | RSS 订阅 | subscribe | 定时抓取博客文章更新，订阅源通过 `RSS_SUBSCRIPTIONS_JSON` 传入 |
| `audio_assistant` | 语音助手 | system | 环境语音监听（Whisper + TTS） |

每个传感器通过独立子进程运行，由 `manager.py` 统一管理，崩溃互不影响。

---

## 3. 文件系统配置 (`file.json`)

定义 Agent 在宿主机上的文件操作权限边界，采用三级权限模型：

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

### 字段说明

| 字段 | 说明 |
|------|------|
| `default_permission` | 默认权限：`readonly`（只读）或 `writable`（可写） |
| `permissions.blocked` | **隐私黑名单**。禁止读取/导入的目录，保护敏感文件 |
| `permissions.readonly` | **只读白名单**。Agent 可读但不可修改的目录/文件 |
| `permissions.writable` | **读写白名单**。Agent 可自由读写的目录/文件 |

权限判断优先级：`blocked` > `readonly` > `default_permission`。若路径不在任何白名单中，则按 `default_permission` 处理。

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

系统启动时自动拉取所有 MCP Server 的工具 Schema 并缓存。支持自定义 MCP Server（Python 脚本 / npx 包），配置后即时生效。

---

## 6. 应用快捷配置 (`app_config.json`)

为 Agent 的 ComputerUse 工具提供「一键启动」应用的白名单映射，格式为键值对：

```json
{
  "微信": "D:\\\\Path\\\\to\\\\WeChat.exe",
  "GitHub": "https://github.com"
}
```

当 Agent 调用 ComputerUse 的 `launch_app` 动作时，会查询此映射表。value 支持三种格式：

| 格式 | 说明 | 示例 |
|------|------|------|
| **URL** | 在默认浏览器中打开 | `"https://github.com"` |
| **可执行文件路径** | 直接启动本地程序 | `"D:\\\\Program Files\\\\App\\\\app.exe"` |
| **协议 URL** | 通过系统协议启动应用 | `"obsidian://open?vault=notes"` |

---

## 7. 核心文件 (`.purrcat/core/`)

| 文件 | 用途 | 说明 |
|------|------|------|
| `MEMORY.md` | 系统级记忆档案 | 固化用户画像与工作经验，会话启动时注入 System Prompt |
| `SOUL.md` | Agent 人格定义 | 定义性格、语气、价值观，从根本上决定 Agent 行为基调 |
| `SOLO.md` | 自主巡查规约 | 定义挂机时的活动清单与安全底线（沙盒清理/本体追踪/项目巡查） |
| `TODO.md` | 待办事项 | Agent 自主记录的待办清单 |
| `cron.json` | 定时任务 | 由系统时钟传感器轮询，触发定时唤醒 |
| `loop.json` | 循环轮询 | 定时循环执行的任务配置（如系统心跳） |
| `info.json` | 安装索引 | 记录已安装的技能包与工作坊清单 |

---

## 8. CLI 命令参考

| 命令 | 用途 | 示例 |
|------|------|------|
| `purrcat setup` | 一键部署（沙盒构建 + Python 依赖安装 + 嵌入模型） | `purrcat setup` |
| `purrcat init` | 交互式生成 `.purrcat/` 配置 | `purrcat init --force` |
| `purrcat install` | 安装扩展（skill / graph / mcp / sensor） | `purrcat install mcp tradingview` |
| `purrcat update` | 从 GitHub Releases 更新框架 | `purrcat update --version="2026.05.15"` |
| `purrcat start` | 启动 PurrCat | `purrcat start --webui` |
| `purrcat help` | 显示帮助菜单（含 ASCII 猫猫 Logo） | `purrcat help` |

### 扩展安装详解

```bash
# 安装社区 Skill（任意 GitHub 仓库的子目录）
purrcat install skill https://github.com/user/repo/tree/main/path/to/skill

# 从官方 Registry 安装 MCP 服务器
purrcat install mcp tradingview

# 安装传感器
purrcat install sensor feishu_bot

# 安装官方 Graph（自动解析其 MCP/Skill 依赖）
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
