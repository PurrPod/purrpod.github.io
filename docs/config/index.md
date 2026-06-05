# 配置说明

系统的所有配置文件均由 CLI 统一管理，存放在项目根目录的 `.purrcat/` 文件夹下。使用 `purrcat init` 交互式生成。

---

## 1. 模型配置 (`.purrcat/.model.yaml`)

配置模型 API Key、Base URL、速率限制等。

### 主模型 (main)

全局 Agent 使用的模型，必须配置至少一个有效的 API Key：

```yaml
main:
  openai:deepseek-v4-flash:
    api_keys:
      - sk-your-first-api-key-here
    base_url: https://api.deepseek.com
    rpm: 60                # 每分钟请求数上限
    tpm: 1000000           # 每分钟 Token 上限
    concurrency: 3         # 最大并发数
    max_token: 500000      # 记忆窗口 Token 上限
```

### 任务模型 (task)

后台子任务（多 Agent 协作）使用的模型，可用同型号但**必须使用不同的 API Key**：

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

### 视觉模型


### 嵌入模型

```yaml
embedding_model: BAAI/bge-small-zh-v1.5
```

### 多 Key 负载均衡

`api_keys` 列表支持填入多个 Key，系统通过 `APIKeyManager` 自动选择**当前最空闲**的 Key 进行调度，无需手动干预。

---

## 2. Sensor 配置 (`.purrcat/.sensor.yaml`)

配置系统内置的传感器，所有传感器默认关闭，需将 `enabled` 设为 `true` 才能激活。

### 飞书机器人 (Feishu)

```yaml
feishu:
  enabled: false
  app_id: ""
  app_secret: ""
  chat_id: ""
```

配置步骤：
1. 前往 [飞书开发者后台](https://open.feishu.cn/app) 创建企业自建应用（机器人）
2. 在应用凭证页面获取 `app_id` 和 `app_secret`
3. 打开飞书客户端，进入与机器人的聊天框，点击右上角"设置"，查看会话 ID 作为 `chat_id`
4. 填入配置后重启系统即可打通双向通讯

### RSS 订阅

```yaml
rss:
  enabled: false
  subscriptions:
    - name: Lilian Weng's Blog
      url: https://lilianweng.github.io/lil-log/feed.xml
    - name: Ahead of AI
      url: https://magazine.sebastianraschka.com/feed
```

### 心跳传感器

```yaml
heartbeat:
  enabled: false
  interval: 1800          # 心跳间隔（秒），默认 30 分钟
```

### PurrMemo 记忆系统

```yaml
purrmemo:
  enabled: false
  host: http://127.0.0.1:8000
  api_key: ""
  timeout: 5
```

---

## 3. 文件系统配置 (`.purrcat/.file.yaml`)

定义 Agent 在宿主机上的文件操作权限边界。

```yaml
# 禁止读取/导入的目录（隐私保护）
dont_read_dirs:
  - src/

# 允许 export 写入的目录
allowed_export_dirs:
  - .

# 挂载到 Docker 沙盒的目录
docker_mount:
  - sandbox/

# 沙盒可操作目录
sandbox_dirs:
  - sandbox/
  - agent_vm/

# 技能包目录
skill_dir:
  - skill
```

---

## 4. MCP 扩展配置 (`.purrcat/mcp_config.json`)

配置 Model Context Protocol (MCP) 服务器扩展：

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

系统启动时 `initialize_mcp()` 会自动拉取所有配置的 MCP Server 的完整工具 Schema 并缓存。

---

## 5. 扩展接入

### Skill 技能安装

将包含 `SKILL.md` 的技能文件夹完整放入 `skill/` 目录，重启系统后即可生效。Agent 可通过 `Fetch(source="skill", name="your_skill")` 加载使用。

### Harness / DAG 流程接入

在 `src/harness/graph/` 下创建 JSON 图定义文件，在 `src/harness/node/` 下创建节点实现（每个节点独立文件夹）。系统通过 `importlib.import_module` 自动发现节点，无需注册。

### Tool 模块

自定义工具放置在 `src/tool/` 下（详见二次开发文档），在 `src/tool/utils/route.py` 中注册路由。

---

## 6. 工具配置

部分工具需要对应 API 才能调用：

- **MCP 服务**：需在 `mcp_config.json` 中配置对应 Server 的启动命令和参数
