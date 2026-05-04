# Extension Guide

Welcome to PurrCat development. The framework's design philosophy is modular and decoupled, providing four layers of extension mechanisms.

## Development Roadmap

```
                      Difficulty
                         ↑
          Harness (Atomic Expert)     ← Highest
     Sensor (Gateway)                 ← High
   Tool (Modular)                    ← Medium
Skill / SOUL.md                      ← Low
```

---

## 1. Modify Agent Personality (SOUL.md)

Edit `src/agent/core/SOUL.md` to change the Agent's personality, tone, and values.

**Note**: Only modify `SOUL.md`. Do not touch files under `src/agent/system_rules/` — they contain tool guidelines and behavior rules essential for proper tool calling.

---

## 2. Skill Development (No-Code / Low-Code)

Follow the Anthropic standard. A Skill is a directory under `skill/` with `SKILL.md` as its core.

### Directory Structure

```
skill/your_skill/
├── SKILL.md           # ★ Core: skill instruction document
├── LICENSE.txt        # Optional: license
└── scripts/           # Optional: helper scripts
    └── your_script.py
```

### SKILL.md Format

```yaml
---
name: your_skill
description: "Trigger condition. When should this skill be used?"
---

# Skill Title

## Usage

```bash
command_to_run
```
```

### Skill Limitations

Skill scripts run inside the **Docker sandbox** via the `Bash` tool, only accessing files under `/agent_vm/`. They **cannot directly read/write host files**.

To operate host files, use an Expert's extend_tool (see below).

---

## 3. Expert / Harness Development (Domain Expert)

The Expert system is used for **complex workflow orchestration** and **host file operations**.

### Directory Structure

```
src/harness/expert/your_expert/
├── task.py                # Task definition (inherits BaseTask)
└── extend_tool/           # Extended tools (optional)
    ├── __init__.py
    └── your_tool.py
```

### Minimal Implementation

```python
from src.harness.task import BaseTask

class YourExpertTask(
    BaseTask,
    expert_type="your_expert",        # Value used in add_task's expert parameter
    description="Your expert description",
    parameters={}
):
    def __init__(self, task_name, prompt, core):
        super().__init__(task_name, prompt, core)

    def _build_system_prompt(self):
        return """# Role Definition\nYou are a..."""
```

### Auto-Registration

Expert classes are **auto-registered** via `BaseTask.__init_subclass__`. The `Task` tool calls `auto_discover_experts()` to scan `src/harness/expert/` — no manual config changes needed.

### Overridable Hooks

| Method | Purpose |
|--------|---------|
| `_build_system_prompt()` | Custom System Prompt |
| `get_available_tools()` | Inject domain tool schemas (including extend_tool) |
| `_handle_extend_tool()` | Intercept and execute extended tools |
| `_on_save_state()` / `_on_restore_state()` | State persistence and recovery |
| `run()` | Completely override execution logic |

### Atomic Methods (Provided by BaseTask)

BaseTask provides a complete set of atomic modules for composing custom workflows:

| Method | Purpose |
|--------|---------|
| `check_kill()` | Detect external kill signal, abort gracefully |
| `check_request()` | Pop pending force-push instructions |
| `check_tool(history)` | Sanitize broken Tool Calls from history |
| `run_llm_step(messages, tools)` | Pure LLM communication |
| `track_token(response)` | Extract token usage stats |
| `_extract_tool_calling(response)` | Extract and clean OpenAI-format tool_calls |
| `check_completed(tool_calling)` | Detect task_done flag |
| `handle_completed(tool_calling)` | Completion audit + hallucination check + cleanup |
| `run_tool_calling(response)` | Full tool execution loop |
| `check_memory()` | Monitor token/history limits, auto compact |
| `save_checkpoints()` | Persist state to disk |

### Extend Tool Development

extend_tool runs on the **host process** and can directly read/write host files (limited by project_root).

Reference the existing coding extend_tool suite:

```
src/harness/expert/coding/extend_tool/
├── __init__.py       # Unified registration
├── path_utils.py     # Path security validation
├── file_edit.py      # search/replace editing
├── code_search.py    # glob + grep search
├── file_read.py      # Smart file reading
├── file_create.py    # File creation
├── lsp_tool.py       # Code intelligence
└── planning.py       # Plan manager
```

An extend_tool file structure:

```python
import json

YOUR_TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "your_tool",
        "description": "Tool description",
        "parameters": {
            "type": "object",
            "properties": {
                "param": {"type": "string", "description": "Parameter description"}
            },
            "required": ["param"]
        }
    }
}

def execute_your_tool(arguments: dict, task=None) -> str:
    param = arguments.get("param", "")
    result = f"Processed: {param}"
    return json.dumps({"type": "text", "content": result})
```

Register in `extend_tool/__init__.py`:

```python
from .your_tool import YOUR_TOOL_SCHEMA, execute_your_tool

EXTEND_TOOLS_SCHEMA = [..., YOUR_TOOL_SCHEMA]
EXTEND_TOOL_FUNCTIONS = {..., "your_tool": execute_your_tool}
```

Then in your Expert's `task.py`:

```python
from src.harness.expert.your_expert.extend_tool import (
    handle_extend_tool, get_extend_tools_schema
)

class YourExpertTask(BaseTask, expert_type=..., ...):
    def get_base_tool_schema(self) -> list:
        return super().get_base_tool_schema() + get_extend_tools_schema()

    def _handle_extend_tool(self, tool_name: str, arguments: dict) -> str:
        success, result = handle_extend_tool(tool_name, arguments, self)
        return result if success else super()._handle_extend_tool(tool_name, arguments)
```

---

## 4. Modular Tool Development (Tool)

Each tool is an independent module under `src/tool/`:

```
src/tool/your_tool/
├── __init__.py       # Module init
├── your_tool.py      # Main entry function
├── schema.py         # Tool schema definition
└── exceptions.py     # Custom exceptions
```

### Requirements

1. **Entry function**: Export a function with the same name as the tool (e.g., `Bash()`, `Fetch()`)
2. **Return format**: Use `src.tool.utils.format`:
   - `text_response(data, snip)` — Success
   - `warning_response(msg, snip)` — Warning
   - `error_response(msg, snip)` — Error (with guidance)
3. **Error handling**: Every known error should provide clear guidance

### Registration

Add to `TOOL_FUNC_MAP` in `src/tool/utils/route.py`:

```python
TOOL_FUNC_MAP = {
    ...
    "your_tool": "YourTool",
}
```

Then import and register in the routing system.

---

## 5. Sensor Development

Sensors connect the Agent to the physical world. The framework uses a **BaseSensor + SensorGateway** architecture.

### BaseSensor

```python
from src.sensor.base import BaseSensor

class YourSensor(BaseSensor):
    config_key = "your_sensor"  # Matches config key

    def __init__(self, config_dict: dict):
        super().__init__(
            sensor_type="message",    # message / subscribe / system
            sensor_name="your_sensor",
            config_dict=config_dict
        )

    def _observe(self, *args, **kwargs):
        """Continuously receive external data (requires enabled)"""
        while self.is_enabled:
            data = ...
            if data:
                from src.sensor.gateway import get_gateway
                get_gateway().push(self, data)

    def _express(self, message, **kwargs) -> bool:
        """Send message externally (requires enabled)"""
        ...
        return True
```

### SensorGateway

The system auto-scans and registers enabled sensors at startup:

- **`push(sensor, content)`** — Push message to queue, auto-wake Agent
  - `/unbind` command → Remove from active list
  - type=message → Auto-mark as active channel
- **`send(message)`** — After Agent replies, iterate active channels

---

## 6. Tool Routing

`dispatch_tool()` is the core routing hub. It dynamically imports `src.tool.{name}.{name}` by tool name. Mapping via `TOOL_FUNC_MAP`:

```python
TOOL_FUNC_MAP = {
    "filesystem": "FileSystem",
    "bash": "Bash",
    "cron": "Cron",
    "callmcp": "CallMCP",
    "memo": "Memo",
    "search": "Search",
    "fetch": "Fetch",
    "task": "Task"
}
```

Eight native tools:

| Tool | Description |
|------|-------------|
| Bash | Docker sandbox shell execution |
| FileSystem | Host file import/export/browse |
| Fetch | Get skill/MCP/web/Harness/TODO content |
| Search | Web search or local skill/MCP search |
| Cron | Scheduled alarms |
| Memo | Long-term memory write & search |
| CallMCP | Dispatch MCP external tools |
| Task | Sub-task create/kill/list |

MCP tools are dispatched via `CallMCP`, separate from native tool routing.

---

## 7. Development Principles

1. **One PR, one problem** — avoid giant mixed commits
2. **Backward compatibility** — don't break existing features
3. **Path safety** — validate all host file paths are within project_root
4. **Commit messages in English**
5. **Human-friendly errors** — every known error should provide clear guidance
