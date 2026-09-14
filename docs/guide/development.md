# 开发指南

欢迎参与 PurrCat 开发。框架按扩展深度提供五层机制：人格（SOUL.md）、Skill、Graph、自定义工具（MCP）、Sensor 与 AgentLoop（PARADIGM）。

## 1. 修改 Agent 人格（SOUL.md）

编辑 `.purrcat/core/SOUL.md`，修改 Agent 的性格、语气和价值观，或直接在前端界面修改。

## 2. Skill 开发

遵循 [Anthropic Skill 官方规范](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills)。一个 Skill 就是 `skills/` 下的一个目录，核心是 `SKILL.md` 文件。可以在前端界面使用 Trace2Skill 功能从一次经历中汲取相关经验生成技能，也可以对已有技能进行升级。

### 目录结构

```
skills/your_skill/
├── SKILL.md           # ★ 核心：技能说明文档
├── LICENSE.txt        # 可选：许可证
└── scripts/           # 可选：辅助脚本
    └── your_script.py
```

### SKILL.md 格式

文件开头是两个必填的 frontmatter 字段：

```markdown
---
name: your_skill_name
description: "触发条件描述。何时应该使用此技能？"
---

# 技能标题

## Usage

xxx
```

使用 Trace2Skill 完成 Skill 开发后，可以进行 Trigger 测试验证 description 的语义竞争力，以提高日常使用时 Skill 可被正常召回的概率。

## 3. Graph 开发

在前端 Editor 通过拖拽搭建思维链和工作流。

::: tip KVCache 接线原则
Agent 节点之间应传递 `messages` 输出（完整消息历史）：下游 Agent 以「前序对话 + 新增指令」续写，请求前缀稳定，KV Cache 命中率高。仅在汇聚多个独立分支时才使用 `summary` 输出（各分支无共享前缀，汇总摘要更省 token）。
:::

### 节点类型矩阵

内置节点位于 `node/extensions/`：

- `agent_loop` — LLM 循环思考对话
- `appender` — 消息追加
- `env_loader` — 环境变量加载
- `file_writer` / `text_file_reader` — 文件读写
- `html_viewer` — HTML 预览渲染
- `human_intervention` — 人工干预，挂起至 `WAITING` 交出控制权
- `if_else_router` / `switch_router` — 条件路由与多路分支分流
- `image_generator` — 图片生成（文生图/图生图编辑）
- `json_builder` / `json_extractor` — JSON 构建与提取
- `mcp_info` — MCP 知识包，向下游注入推荐 MCP 工具的提示词
- `message_card_builder` — 消息卡片构建
- `task_input` / `task_output` — 任务入口与出口
- `template_renderer` — 模板渲染（Jinja2 语法）

### 格式参考

下面是一个精简的多分析师股票决策图谱（`position` / `configSchema` 等编辑器元数据已省略，前端 Editor 会自动补全；资金面、情绪面分支与技术面同构，此处仅保留一条示范）：

```json
{
  "version": "2.0",
  "name": "trading",
  "description": "股票操作分析",
  "global_schema": {
    "ticker": { "type": "any", "required": true, "description": "股票代码" }
  },
  "nodes": [
    {
      "id": "task_input",
      "type": "task_input",
      "name": "全局输入",
      "config": {
        "global_vars": [
          { "name": "ticker", "required": true, "description": "股票代码" }
        ]
      }
    },
    {
      "id": "mcp_kit",
      "type": "mcp_info",
      "name": "MCP 知识包",
      "config": { "mcp_servers": [{ "name": "tdx" }] }
    },
    {
      "id": "collect_tpl",
      "type": "template_renderer",
      "name": "采集模板",
      "config": {
        "template": "请为股票 【{{ticker}}】 收集所有必要的原始数据（基础信息、量价数据、近期新闻）。收集完毕后，使用 task_done 工具输出包含所有数据的结构化 summary。\n\n可用的参考工具：{{mcp}}"
      }
    },
    {
      "id": "sys_collector",
      "type": "message_card_builder",
      "name": "Sys-数据采集员",
      "config": {
        "role": "system",
        "content": "你是一位高效的【数据采集工程师】。你的任务是使用工具客观地收集市场数据，不做任何主观分析。"
      }
    },
    {
      "id": "user_collect",
      "type": "message_card_builder",
      "name": "User-采集",
      "config": { "role": "user" }
    },
    {
      "id": "appender_collect",
      "type": "appender",
      "name": "组装-采集"
    },
    {
      "id": "agent_collect",
      "type": "agent_loop",
      "name": "Agent-数据采集",
      "config": {
        "task_done_info": {
          "company_info": "公司基础行情与宏观状态",
          "price_data": "最新报价数据",
          "news_headlines": "近期重要新闻列表"
        }
      }
    },
    {
      "id": "user_tech",
      "type": "message_card_builder",
      "name": "User-分配技术面",
      "config": {
        "role": "user",
        "content": "你现在是【技术面分析师】。请阅读上述已采集的数据，分析对应股票的技术面，预测短期趋势，并输出 summary。"
      }
    },
    {
      "id": "appender_tech",
      "type": "appender",
      "name": "追加上下文-技术面"
    },
    {
      "id": "agent_tech",
      "type": "agent_loop",
      "name": "Agent-技术面",
      "config": {
        "task_done_info": {
          "trend": "上涨/下跌/震荡",
          "key_levels": "关键技术支撑/阻力",
          "analysis": "技术指标正文分析"
        }
      }
    },
    {
      "id": "pm_tpl",
      "type": "template_renderer",
      "name": "PM决策板",
      "config": {
        "template": "以下是分析师对该股票的独立分析报告：\n\n【技术面】\n{{tech}}\n\n请结合以上维度进行最终投资决策。"
      }
    },
    {
      "id": "sys_pm",
      "type": "message_card_builder",
      "name": "Sys-投资经理",
      "config": {
        "role": "system",
        "content": "你是首席【投资组合经理 (PM)】。请综合下属提交的报告进行多空逻辑辩论，评估潜在风险并给出操作评级。最后输出包含 'action' 的最终决策。"
      }
    },
    {
      "id": "user_pm",
      "type": "message_card_builder",
      "name": "User-PM提问",
      "config": { "role": "user" }
    },
    {
      "id": "appender_pm",
      "type": "appender",
      "name": "组装-PM"
    },
    {
      "id": "agent_pm",
      "type": "agent_loop",
      "name": "Agent-PM决策",
      "config": {
        "task_done_info": {
          "action": "Buy/Sell/Hold",
          "confidence": "0-100",
          "final_reason": "核心决策逻辑"
        }
      }
    },
    {
      "id": "human_review",
      "type": "human_intervention",
      "name": "人工风控审核",
      "config": {
        "prompt_message": "🚨 投资方案已生成，请检查。输入 'ok' 批准交易，或输入理由打回重审："
      }
    },
    {
      "id": "task_output",
      "type": "task_output",
      "name": "全局输出",
      "config": {
        "target_vars": [
          { "name": "final_decision", "type": "any" },
          { "name": "human_instruction", "type": "string" }
        ]
      }
    }
  ],
  "edges": [
    { "source": "task_input", "target": "collect_tpl", "sourceHandle": "ticker", "targetHandle": "ticker" },
    { "source": "mcp_kit", "target": "collect_tpl", "sourceHandle": "mcp_kit_string", "targetHandle": "mcp" },
    { "source": "collect_tpl", "target": "user_collect", "sourceHandle": "rendered_text", "targetHandle": "content" },
    { "source": "sys_collector", "target": "appender_collect", "sourceHandle": "message_list", "targetHandle": "base_list" },
    { "source": "user_collect", "target": "appender_collect", "sourceHandle": "message_list", "targetHandle": "append_list" },
    { "source": "appender_collect", "target": "agent_collect", "sourceHandle": "merged_list", "targetHandle": "messages" },
    { "source": "agent_collect", "target": "appender_tech", "sourceHandle": "messages", "targetHandle": "base_list" },
    { "source": "user_tech", "target": "appender_tech", "sourceHandle": "message_list", "targetHandle": "append_list" },
    { "source": "appender_tech", "target": "agent_tech", "sourceHandle": "merged_list", "targetHandle": "messages" },
    { "source": "agent_tech", "target": "pm_tpl", "sourceHandle": "summary", "targetHandle": "tech" },
    { "source": "pm_tpl", "target": "user_pm", "sourceHandle": "rendered_text", "targetHandle": "content" },
    { "source": "sys_pm", "target": "appender_pm", "sourceHandle": "message_list", "targetHandle": "base_list" },
    { "source": "user_pm", "target": "appender_pm", "sourceHandle": "message_list", "targetHandle": "append_list" },
    { "source": "appender_pm", "target": "agent_pm", "sourceHandle": "merged_list", "targetHandle": "messages" },
    { "source": "agent_pm", "target": "human_review", "sourceHandle": "summary", "targetHandle": "context_data" },
    { "source": "human_review", "target": "task_output", "sourceHandle": "context_data", "targetHandle": "final_decision" },
    { "source": "human_review", "target": "task_output", "sourceHandle": "human_reply", "targetHandle": "human_instruction" }
  ],
  "dependencies": {
    "skills": [],
    "mcps": ["tdx"]
  }
}
```

### 注册方式

- **前端 Editor 拖拽生成**：编辑完成后直接点击部署按钮即可完成注册；
- **手写 JSON 文件**：将文件放入 `~/.purrcat/graph/` 目录即可完成注册。

## 4. 自定义工具（通过 MCP 协议）

PurrCat 的八大原生工具（Bash / FileSystem / Fetch / Search / Cron / Memo / CallMCP / Task）不可修改。如需新增工具，请走标准 **MCP (Model Context Protocol)** 协议：

1. 按照 MCP 官方教程使用任意语言编写 MCP Server
2. 在 `.purrcat/mcp_config.json` 的 `mcpServers` 中注册
3. 系统启动时自动拉取 Schema 并热加载

```json
{
  "mcpServers": {
    "your-tool": {
      "command": "node",
      "args": ["path/to/mcp-server.js"],
      "env": {}
    }
  }
}
```

详见 [MCP 官方文档](https://modelcontextprotocol.io)。

## 5. Sensor 开发（ACP 方言）

最新架构采用 ACP 方言 + PurrCat 自定义方言的词汇表，通过 stdio JSON-RPC 与宿主通信：

- **独立子进程**：每个 Sensor 由 Manager 以 `uv run` 拉起，PEP 723 内联依赖即装即用，单个 Sensor 崩溃不影响主进程，watchdog 每 10 秒巡检并自动重启；
- **零网络端口**：全部通信走 stdin/stdout 管道，**stdout 只能输出 JSON-RPC 行**（日志请打到 stderr，否则会被宿主忽略）；
- **跟随活跃会话**：stdio Sensor 的 `session/new` 会自动绑定当前活跃会话，Sensor 端零决策零配置。

### 可用接口

**入向（Sensor → 宿主，JSON-RPC 请求）：**

| 方法 | 说明 |
|------|------|
| `initialize` | 握手，返回协议版本与宿主能力 |
| `session/new` | 新建会话（自动跟随当前活跃会话） |
| `session/prompt` | 向活跃会话注入消息。异步语义：立即返回 `promptId`，最终 `stopReason` 由 `_purrcat/turn_end` 通知回填 |
| `session/load` | 绑定既有会话并回放历史 |
| `session/list` / `session/delete` | 会话列举 / 删除 |
| `session/cancel` | 通知：取消当前轮次 |
| `_purrcat/upload_file` | 上传文件（base64，上限 20MB，按 Sensor 名落盘） |
| `_purrcat/launch_task` | 后台拉起 Harness 图谱任务（`graph_name` / `inputs` / `title`） |

**出向（宿主 → Sensor，通知）：**

| 通知 | 说明 |
|------|------|
| `session/update` | 会话更新流。默认只含 `agent_message` 正文；配置 `tool_detail: true` 后额外含思考与工具调用细节 |
| `_purrcat/turn_end` | 轮次结束（携带 `stopReason`），Sensor 据此收尾（如关闭流式卡片） |
| `_purrcat/file` | Agent 消息中提及本地文件路径时推送文件内容（`name` / `mime` / `size` / `content_b64`） |

### 最简实现

开发时只需完成「配置 + 单文件代码」。一个最小可用的 Sensor 如下：

```python
# /// script
# requires-python = ">=3.10"
# dependencies = []   # PEP 723 内联依赖，uv 拉起时自动安装
# ///
import sys
import json
import threading

_REAL_STDOUT = sys.stdout
sys.stdout = sys.stderr  # 防污染：stdout 只输出 JSON-RPC，日志全部转 stderr

SENSOR_NAME = "my_sensor"
_SID = ""
_SID_READY = threading.Event()


def _send(method: str, params: dict, rid: int = None):
    _REAL_STDOUT.write(json.dumps(
        {"jsonrpc": "2.0", "id": rid, "method": method, "params": params},
        ensure_ascii=False,
    ) + "\n")
    _REAL_STDOUT.flush()


def acp_connect():
    """握手：initialize + session/new（网关自动绑定当前活跃会话）"""
    _send("initialize", {"clientInfo": {"name": SENSOR_NAME}}, rid=1)
    _send("session/new", {"clientInfo": {"name": SENSOR_NAME}}, rid=2)


def prompt_agent(text: str):
    """向当前活跃会话注入消息（fire-and-forget，stopReason 异步回填）"""
    _SID_READY.wait(timeout=30)
    if _SID:
        _send("session/prompt", {
            "sessionId": _SID,
            "prompt": [{"type": "text", "text": text}],
        })


def _stdin_loop():
    """消费宿主下发：记住 sessionId；需要消费 Agent 回复的传感器在此处理通知"""
    global _SID
    for line in sys.stdin:
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            continue
        if "method" in msg:
            # 通知：session/update / _purrcat/turn_end / _purrcat/file
            continue
        if msg.get("id") == 2 and "result" in msg:
            _SID = (msg.get("result") or {}).get("sessionId", "")
            _SID_READY.set()


acp_connect()
# TODO: 在后台线程中监听外部事件，调用 prompt_agent() 注入给 Agent
_stdin_loop()
```

### 注册与安装

- **代码**：单文件放置到 `~/.purrcat/sensor/<name>.py`；
- **配置**：在传感器配置（`~/.purrcat/activate_sensor.json`）中写一条：

```json
{
  "my_sensor": {
    "enabled": true,
    "env": {},
    "tool_detail": false
  }
}
```

| 字段 | 说明 |
|------|------|
| `enabled` | 启动开关 |
| `env` | 注入子进程的环境变量 |
| `tool_detail` | 是否接收思考 / 工具调用细节（默认只接收正文） |

> **配置即安装**：本地缺失代码文件时，系统会自动从官方传感器仓库 [PurrPod/sensors](https://github.com/PurrPod/sensors) 下载对应单文件脚本并启动；前端 UI 提供可视化一键 ON/OFF 拨动开关。

## 6. AgentLoop 开发（PARADIGM）

AgentLoop 由 `PARADIGM.yaml` 声明式定义（存放于 `~/.purrcat/paradigms/`，其中 `PARADIGM.yaml` 是默认 Agent Loop），用近自然语言的规则描述触发器、生命周期 Hook、工具使用检查与循环退出条件——编辑配置即可重写 Agent 循环，无需改代码。

### 五个 Hook

| Hook | 时机 |
|------|------|
| `on_build_system_prompt` | 构建系统提示词时 |
| `on_loop_start` | 每次对话循环开始时 |
| `on_loop_epoch` | 循环轮次节点：`delay` 在第 n 轮触发一次，`interval` 每隔 n 轮触发 |
| `on_tool_calling` | 每次工具调用后 |
| `on_loop_end` | 循环结束时的退出关卡 |

### 动作类型

Hook 内可编排以下动作：

| 动作 | 关键参数 | 说明 |
|------|---------|------|
| `injection` | `content`、`delay`、`interval` | 注入固定提示词 |
| `file_operation` | `path`、`action`、`content`、`failed_prompt` | 文件操作：`read`（内容注入上下文）/ `exist_check` / `write_in` / `add_in` / `delete` |
| `command_on` / `command_run` | `command`、`return_log`、`failed_prompt` | 宿主机命令执行；`return_log: true` 时把 stdout 注入上下文 |
| `tool_use_check` | `name`、`parameter_check`、`successed_prompt`、`failed_prompt` | 检查本轮/本循环是否调用了指定工具（可匹配调用参数） |
| `skill_info` | `skills` | 注入指定技能的 name + description（部分技能披露） |
| `memo_injection` | `type`、`count` | 注入短期记忆：`full` 全量 / `light` 轻量 / 指定字段名，`count` 上限 30 |

**路径符号**：`path` 支持别名 `@RULES`、`@SOUL`、`@MEMORY`、`@INFO` 与 `@SYS`（注入当前系统信息：OS / CPU / GPU / 沙盒目录），以及 `.purrcat/`、`agent_vm` 前缀。

**退出关卡**：`on_loop_end` 中所有检查项通过才允许退出循环；检查项可声明 `expect: fail` 表示「未满足才算通过」。`loop_end_max_retry`（默认 3）限制重试次数，超限强制放行，防止死循环。

### 默认 PARADIGM 示例

```yaml
name: "default"
description: "default system loop"
loop_end_max_retry: 3

# 触发器：定时将消息注入 Agent
trigger:
  - cron:
      time: "08:08"
      injection: "【Demo】闹钟响了"

hooks:
  on_build_system_prompt:
    - file_operation:
        path: "@RULES"
        action: "read"
    - file_operation:
        path: "@SOUL"
        action: "read"
    - memo_injection:
        type: "full"
        count: 10
    - file_operation:
        action: "read"
        path: "@SYS"          # 注入当前系统信息
  on_loop_start:
    - injection:
        content: "如遇复杂任务，请先编排好主线路的执行计划，先规划TODO后执行"
  on_loop_epoch:
    - injection:
        interval: 10
        content: "[system regular hint]请随时按进度更新主路规划或与用户对齐需求，防止跑偏"
  on_tool_calling:
    - tool_use_check:
        name: "ComputerUse"
        successed_prompt: "组件找不到时使用 Vision 顾问进行询问。"
  on_loop_end:
    # 全部检查通过才允许退出循环
    - tool_use_check:
        name: "Memo"
        parameter_check:
          - action: "add"
        failed_prompt: "检测到本轮对话你未调用 Memo 工具进行记忆总结，最好总结一下"
```

## 7. 开发原则

1. **一个 PR 只解决一个问题**：避免巨型混合提交
2. 在涉及项目核心的更改时，应先通过 issue 进行讨论
3. **路径安全**：涉及宿主机文件操作时，必须校验路径映射是否正确
4. **提交信息用英文**
5. **异常提示人性化**：每个已知异常场景都应有明确的引导提示
