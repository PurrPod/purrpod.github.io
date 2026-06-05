# Configuration Guide

All configuration files are managed by the CLI and stored in the `.purrcat/` directory under the project root. Generate them interactively with `purrcat init`.

---

## 1. Model Configuration (`.purrcat/.model.yaml`)

Configure model API keys, Base URL, rate limits, etc.

### Main Model

The model used by the global Agent. At least one valid API key is required:

```yaml
main:
  openai:deepseek-v4-flash:
    api_keys:
      - sk-your-first-api-key-here
    base_url: https://api.deepseek.com
    rpm: 60                # requests per minute limit
    tpm: 1000000           # tokens per minute limit
    concurrency: 3         # max concurrency
    max_token: 500000      # memory window token limit
```

### Task Model

The model used by background subtasks (multi-agent collaboration). Can use the same model but **must use a different API key**:

```yaml
task:
  openai:deepseek-v4-flash:
    api_keys:
      - sk-your-task-api-key
    base_url: https://api.deepseek.com
    rpm: 60
    tpm: 1000000
    concurrency: 3
    max_token: 500000
```

### Embedding Model

```yaml
embedding_model: BAAI/bge-small-zh-v1.5
```

### Multi-Key Load Balancing

Multiple keys can be added to the `api_keys` list. The `APIKeyManager` automatically selects the **least busy** key for each task.

---

## 2. Sensor Configuration (`.purrcat/.sensor.yaml`)

Configure built-in sensors. All sensors are disabled by default — set `enabled` to `true` to activate.

### Feishu/Lark Bot

```yaml
feishu:
  enabled: false
  app_id: ""
  app_secret: ""
  chat_id: ""
```

Setup:
1. Go to [Feishu Developer Console](https://open.feishu.cn/app) to create an enterprise self-built application (robot)
2. Get `app_id` and `app_secret` from the app credentials page
3. Open the Feishu client, enter the chat with your robot, click "Settings" to get the chat ID
4. Fill in the values and restart the system

### RSS Subscriptions

```yaml
rss:
  enabled: false
  subscriptions:
    - name: Lilian Weng's Blog
      url: https://lilianweng.github.io/lil-log/feed.xml
    - name: Ahead of AI
      url: https://magazine.sebastianraschka.com/feed
```

### Heartbeat Sensor

```yaml
heartbeat:
  enabled: false
  interval: 1800          # heartbeat interval (seconds), default 30 min
```

### PurrMemo Memory System

```yaml
purrmemo:
  enabled: false
  host: http://127.0.0.1:8000
  api_key: ""
  timeout: 5
```

---

## 3. File System Configuration (`.purrcat/.file.yaml`)

Define the Agent's file operation permission boundaries on the host.

```yaml
# Directories prohibited from reading/importing (privacy protection)
dont_read_dirs:
  - src/

# Directories allowed for export writing
allowed_export_dirs:
  - .

# Directories mounted to Docker sandbox
docker_mount:
  - sandbox/

# Sandbox-accessible directories
sandbox_dirs:
  - sandbox/
  - agent_vm/

# Skill package directories
skill_dir:
  - skill
```

---

## 4. MCP Extension Configuration (`.purrcat/mcp_config.json`)

Configure Model Context Protocol (MCP) server extensions:

```json
{
  "mcpServers": {
    "bilibili-search": {
      "command": "node",
      "args": ["path/to/mcp-server.js"],
      "env": {}
    }
  }
}
```

On system startup, `initialize_mcp()` automatically fetches and caches the complete tool schemas from all configured MCP servers.

---

## 5. Extension Integration

### Skill Installation

Place a skill folder containing `SKILL.md` into the `skill/` directory. It will take effect after restart. The Agent can load it via `Fetch(source="skill", name="your_skill")`.

### Harness / DAG Workflow Setup

Create a JSON graph definition in `src/harness/graph/` and node implementations in `src/harness/node/` (one folder per node). Nodes are auto-discovered via `importlib.import_module` — no registration needed.

### Tool Module

Place custom tools under `src/tool/` (see Extension Guide for details) and register them in `src/tool/utils/route.py`.

---

## 6. Tool Configuration

Some tools require API keys to function:

- **Web Search**: Requires [Tavily API](https://www.tavily.com/) (can also use Playwright MCP as an alternative with more structured results)
- **MCP Services**: Must be configured in `mcp_config.json` with the server's startup command and arguments
