# Development Guide

Welcome to PurrCat development. The framework provides five layers of extension mechanisms by depth: personality (SOUL.md), Skill, Graph, custom tools (MCP), and Sensor & AgentLoop (PARADIGM).

## 1. Modify Agent Personality (SOUL.md)

Edit `.purrcat/core/SOUL.md` to change the Agent's personality, tone, and values — or edit it directly in the frontend UI.

## 2. Skill Development

Follow the [Anthropic Skill specification](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills). A Skill is a directory under `skills/` with `SKILL.md` as its core. You can use the Trace2Skill feature in the frontend UI to distill a skill from a past experience, or upgrade existing skills.

### Directory Structure

```
skills/your_skill/
├── SKILL.md           # ★ Core: skill instruction document
├── LICENSE.txt        # Optional: license
└── scripts/           # Optional: helper scripts
    └── your_script.py
```

### SKILL.md Format

The file starts with two required frontmatter fields:

```markdown
---
name: your_skill_name
description: "Trigger condition description. When should this skill be used?"
---

# Skill Title

## Usage

xxx
```

After building a skill with Trace2Skill, run a Trigger test to verify the semantic competitiveness of the `description` — this improves the probability that the skill gets correctly recalled in daily use.

## 3. Graph Development

Build chains of thought and workflows by dragging and dropping in the frontend Editor.

::: tip KVCache Wiring Principle
Pass the `messages` output (full message history) between Agent nodes: downstream Agents continue from "prior conversation + new instructions", keeping a stable request prefix with high KV Cache hit rates. Only use the `summary` output when merging independent branches (branches share no prefix, so a condensed summary saves tokens).
:::

### Node Type Matrix

Built-in nodes are located in `node/extensions/`:

- `agent_loop` — LLM loop thinking conversation
- `appender` — message appending
- `env_loader` — environment variable loading
- `file_writer` / `text_file_reader` — file read/write
- `html_viewer` — HTML preview rendering
- `human_intervention` — human intervention, suspends to `WAITING` and surrenders control
- `if_else_router` / `switch_router` — conditional routing and multi-branch splitting
- `image_generator` — image generation (text-to-image / image-to-image editing)
- `json_builder` / `json_extractor` — JSON construction and extraction
- `mcp_info` — MCP kit, injects recommended MCP tool prompts into downstream nodes
- `message_card_builder` — message card construction
- `task_input` / `task_output` — task entry and exit
- `template_renderer` — template rendering (Jinja2 syntax)

### Format Reference

Below is a trimmed multi-analyst stock decision graph (editor metadata such as `position` / `configSchema` is omitted — the frontend Editor fills it in automatically; the fundamentals and sentiment branches are isomorphic to the technical branch, so only one is shown):

```json
{
  "version": "2.0",
  "name": "trading",
  "description": "Stock operation analysis",
  "global_schema": {
    "ticker": { "type": "any", "required": true, "description": "Stock ticker" }
  },
  "nodes": [
    {
      "id": "task_input",
      "type": "task_input",
      "name": "Global Input",
      "config": {
        "global_vars": [
          { "name": "ticker", "required": true, "description": "Stock ticker" }
        ]
      }
    },
    {
      "id": "mcp_kit",
      "type": "mcp_info",
      "name": "MCP Kit",
      "config": { "mcp_servers": [{ "name": "tdx" }] }
    },
    {
      "id": "collect_tpl",
      "type": "template_renderer",
      "name": "Collect Template",
      "config": {
        "template": "Please collect all necessary raw data for stock [{{ticker}}] (fundamentals, price/volume, recent news). Once done, use the task_done tool to output a structured summary containing all data.\n\nAvailable reference tools: {{mcp}}"
      }
    },
    {
      "id": "sys_collector",
      "type": "message_card_builder",
      "name": "Sys-Collector",
      "config": {
        "role": "system",
        "content": "You are an efficient [Data Collection Engineer]. Your task is to objectively collect market data using tools — no subjective analysis."
      }
    },
    {
      "id": "user_collect",
      "type": "message_card_builder",
      "name": "User-Collect",
      "config": { "role": "user" }
    },
    {
      "id": "appender_collect",
      "type": "appender",
      "name": "Assemble-Collect"
    },
    {
      "id": "agent_collect",
      "type": "agent_loop",
      "name": "Agent-Collect",
      "config": {
        "task_done_info": {
          "company_info": "Company fundamentals and macro state",
          "price_data": "Latest quote data",
          "news_headlines": "Recent important news list"
        }
      }
    },
    {
      "id": "user_tech",
      "type": "message_card_builder",
      "name": "User-Assign Technical",
      "config": {
        "role": "user",
        "content": "You are now the [Technical Analyst]. Read the collected data above, analyze the stock's technicals, forecast the short-term trend, and output a summary."
      }
    },
    {
      "id": "appender_tech",
      "type": "appender",
      "name": "Append Context-Technical"
    },
    {
      "id": "agent_tech",
      "type": "agent_loop",
      "name": "Agent-Technical",
      "config": {
        "task_done_info": {
          "trend": "up/down/sideways",
          "key_levels": "key support/resistance levels",
          "analysis": "technical indicator analysis"
        }
      }
    },
    {
      "id": "pm_tpl",
      "type": "template_renderer",
      "name": "PM Decision Board",
      "config": {
        "template": "Below is the analyst's independent report on this stock:\n\n[Technical]\n{{tech}}\n\nPlease make the final investment decision based on the above dimensions."
      }
    },
    {
      "id": "sys_pm",
      "type": "message_card_builder",
      "name": "Sys-Portfolio Manager",
      "config": {
        "role": "system",
        "content": "You are the chief [Portfolio Manager]. Debate long/short logic based on the reports submitted by your analysts, assess risks, and give an operation rating. Finally output the decision containing an 'action'."
      }
    },
    {
      "id": "user_pm",
      "type": "message_card_builder",
      "name": "User-PM Question",
      "config": { "role": "user" }
    },
    {
      "id": "appender_pm",
      "type": "appender",
      "name": "Assemble-PM"
    },
    {
      "id": "agent_pm",
      "type": "agent_loop",
      "name": "Agent-PM Decision",
      "config": {
        "task_done_info": {
          "action": "Buy/Sell/Hold",
          "confidence": "0-100",
          "final_reason": "core decision logic"
        }
      }
    },
    {
      "id": "human_review",
      "type": "human_intervention",
      "name": "Human Risk Review",
      "config": {
        "prompt_message": "🚨 Investment plan generated, please review. Type 'ok' to approve the trade, or type a reason to reject:"
      }
    },
    {
      "id": "task_output",
      "type": "task_output",
      "name": "Global Output",
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

### Registration

- **Generated in the frontend Editor**: click the deploy button after editing to register the graph;
- **Hand-written JSON file**: drop the file into the `~/.purrcat/graph/` directory to register it.

## 4. Custom Tools (via MCP Protocol)

PurrCat's 8 native tools (Bash / FileSystem / Fetch / Search / Cron / Memo / CallMCP / Task) are not modifiable. To add custom tools, use the standard **MCP (Model Context Protocol)**:

1. Write an MCP Server in any language following the MCP docs
2. Register it in `.purrcat/mcp_config.json` under `mcpServers`
3. The system auto-fetches the Schema and hot-loads it on startup

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

See the [MCP Documentation](https://modelcontextprotocol.io).

## 5. Sensor Development (ACP Dialect)

The latest architecture uses a vocabulary of the ACP dialect plus PurrCat custom extensions, communicating with the host via stdio JSON-RPC:

- **Independent subprocess**: each Sensor is launched by the Manager via `uv run`, with PEP 723 inline dependencies installed on the fly. A single Sensor crash never affects the main process; a watchdog patrols every 10 seconds and restarts it automatically;
- **Zero network ports**: all communication goes through stdin/stdout pipes. **stdout must only emit JSON-RPC lines** (send logs to stderr — anything else is ignored by the host);
- **Follow the active session**: `session/new` from a stdio Sensor automatically binds to the current active session — zero decisions, zero configuration on the Sensor side.

### Available Interfaces

**Inbound (Sensor → host, JSON-RPC requests):**

| Method | Description |
|--------|-------------|
| `initialize` | Handshake; returns protocol version and host capabilities |
| `session/new` | Create a session (automatically follows the current active session) |
| `session/prompt` | Inject a message into the active session. Async semantics: returns a `promptId` immediately; the final `stopReason` arrives later via the `_purrcat/turn_end` notification |
| `session/load` | Bind to an existing session and replay history |
| `session/list` / `session/delete` | List / delete sessions |
| `session/cancel` | Notification: cancel the current turn |
| `_purrcat/upload_file` | Upload a file (base64, max 20MB, saved with the Sensor name as source) |
| `_purrcat/launch_task` | Launch a Harness graph task in the background (`graph_name` / `inputs` / `title`) |

**Outbound (host → Sensor, notifications):**

| Notification | Description |
|--------------|-------------|
| `session/update` | Session update stream. Contains only `agent_message` text by default; with `tool_detail: true` it additionally includes reasoning and tool-call details |
| `_purrcat/turn_end` | Turn finished (carries `stopReason`); the Sensor uses it to finalize (e.g. close a streaming card) |
| `_purrcat/file` | Pushed when the Agent message mentions a local file path (`name` / `mime` / `size` / `content_b64`) |

### Minimal Implementation

Development only requires "config + a single code file". A minimal working Sensor:

```python
# /// script
# requires-python = ">=3.10"
# dependencies = []   # PEP 723 inline deps, auto-installed by uv at launch
# ///
import sys
import json
import threading

_REAL_STDOUT = sys.stdout
sys.stdout = sys.stderr  # anti-pollution: stdout only carries JSON-RPC, logs go to stderr

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
    """Handshake: initialize + session/new (the gateway auto-binds the active session)"""
    _send("initialize", {"clientInfo": {"name": SENSOR_NAME}}, rid=1)
    _send("session/new", {"clientInfo": {"name": SENSOR_NAME}}, rid=2)


def prompt_agent(text: str):
    """Inject a message into the current active session (fire-and-forget, stopReason backfilled async)"""
    _SID_READY.wait(timeout=30)
    if _SID:
        _send("session/prompt", {
            "sessionId": _SID,
            "prompt": [{"type": "text", "text": text}],
        })


def _stdin_loop():
    """Consume host messages: remember sessionId; sensors that need Agent replies handle notifications here"""
    global _SID
    for line in sys.stdin:
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            continue
        if "method" in msg:
            # notifications: session/update / _purrcat/turn_end / _purrcat/file
            continue
        if msg.get("id") == 2 and "result" in msg:
            _SID = (msg.get("result") or {}).get("sessionId", "")
            _SID_READY.set()


acp_connect()
# TODO: listen for external events in a background thread, call prompt_agent() to inject
_stdin_loop()
```

### Registration & Installation

- **Code**: place the single file at `~/.purrcat/sensor/<name>.py`;
- **Config**: add an entry to the sensor config (`~/.purrcat/activate_sensor.json`):

```json
{
  "my_sensor": {
    "enabled": true,
    "env": {},
    "tool_detail": false
  }
}
```

| Field | Description |
|-------|-------------|
| `enabled` | Startup switch |
| `env` | Environment variables injected into the subprocess |
| `tool_detail` | Whether to receive reasoning / tool-call details (text only by default) |

> **Configuration-as-installation**: if the local code file is missing, the system automatically downloads the single-file script from the official sensor repository [PurrPod/sensors](https://github.com/PurrPod/sensors) and starts it. The frontend UI provides a visual one-click ON/OFF toggle.

## 6. AgentLoop Development (PARADIGM)

The AgentLoop is declaratively defined by `PARADIGM.yaml` (stored in `~/.purrcat/paradigms/`, where `PARADIGM.yaml` is the default Agent Loop). It describes triggers, lifecycle hooks, tool-use checks, and loop exit conditions in near-natural-language rules — edit the config to rewrite the Agent loop, no code changes needed.

### The Five Hooks

| Hook | When |
|------|------|
| `on_build_system_prompt` | When building the system prompt |
| `on_loop_start` | At the start of each conversation loop |
| `on_loop_epoch` | At loop epochs: `delay` fires once at round n, `interval` fires every n rounds |
| `on_tool_calling` | After each tool call |
| `on_loop_end` | The exit gate when the loop ends |

### Action Types

The following actions can be orchestrated inside hooks:

| Action | Key Parameters | Description |
|--------|----------------|-------------|
| `injection` | `content`, `delay`, `interval` | Inject a fixed prompt |
| `file_operation` | `path`, `action`, `content`, `failed_prompt` | File operations: `read` (injects content into context) / `exist_check` / `write_in` / `add_in` / `delete` |
| `command_on` / `command_run` | `command`, `return_log`, `failed_prompt` | Execute host commands; with `return_log: true`, stdout is injected into context |
| `tool_use_check` | `name`, `parameter_check`, `successed_prompt`, `failed_prompt` | Check whether a specific tool was called this round (with parameter matching) |
| `skill_info` | `skills` | Inject the name + description of the given skills (partial skill disclosure) |
| `memo_injection` | `type`, `count` | Inject short-term memory: `full` / `light` / a specific field name, `count` capped at 30 |

**Path aliases**: `path` supports the aliases `@RULES`, `@SOUL`, `@MEMORY`, `@INFO`, and `@SYS` (injects current system info: OS / CPU / GPU / sandbox directory), plus the prefixes `.purrcat/`, `src/`, and `agent_vm`.

**Exit gate**: in `on_loop_end`, all checks must pass before the loop may exit; a check may declare `expect: fail`, meaning "unfulfilled counts as passed". `loop_end_max_retry` (default 3) caps the retries — beyond the limit the loop is force-released to prevent infinite loops.

### Default PARADIGM Example

```yaml
name: "default"
description: "default system loop"
loop_end_max_retry: 3

# Triggers: inject messages into the Agent on schedule
trigger:
  - cron:
      time: "08:08"
      injection: "[Demo] The alarm is ringing"

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
        path: "@SYS"          # inject current system info
  on_loop_start:
    - injection:
        content: "For complex tasks, plan the main execution route first — plan TODOs before executing"
  on_loop_epoch:
    - injection:
        interval: 10
        content: "[system regular hint] Keep the main plan updated or align requirements with the user to stay on track"
  on_tool_calling:
    - tool_use_check:
        name: "ComputerUse"
        successed_prompt: "Use the Vision consultant when components are not found."
  on_loop_end:
    # the loop may only exit when ALL checks pass
    - tool_use_check:
        name: "Memo"
        parameter_check:
          - action: "add"
        failed_prompt: "You did not call the Memo tool for memory summarization this round — better summarize"
```

## 7. Development Principles

1. **One PR, one problem** — avoid giant mixed commits
2. Discuss core changes via an issue first
3. **Path safety** — when touching host files, always validate path mappings
4. **Commit messages in English**
5. **Human-friendly errors** — every known error scenario should provide clear guidance
