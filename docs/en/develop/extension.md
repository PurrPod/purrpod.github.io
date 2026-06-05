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

Edit `.purrcat/core/SOUL.md` to change the Agent's personality, tone, and values.

**Note**: Only modify `SOUL.md`. Do not touch files under `src/agent/system_rules/` — they contain tool guidelines and behavior rules essential for proper tool calling.

---

## 2. Skill Development (No-Code / Low-Code)

Follow the Anthropic standard. A Skill is a directory under `skills/` with `SKILL.md` as its core.

### Directory Structure

```
skills/your_skill/
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

To operate host files, use the FileSystem tool (controlled by `.purrcat/file.json` whitelist).

---

## 3. Harness / Node Development (DAG Workflow)

Harness is PurrCat's DAG workflow engine that orchestrates AI pipelines through **configuration-driven + atomic nodes**. Each node is an independent Python module inheriting `BaseNode` implementing the `execute` method.

### Key Concepts

- **`process.py`**: Main scheduler using `asyncio.gather(return_exceptions=True)` for concurrent scheduling
- **`BaseNode`**: Base node class — inherit and implement `async execute(inputs, force_push_msgs, context)`
- **`graph/*.json`**: DAG definition files describing topology and dependencies
- **Node states**: `READY → WAITING → RUNNING → COMPLETED | ERROR`, with checkpoint recovery
- **`yield_to_human`**: Built-in tool allowing Agent to surrender control when stuck
- **Error isolation**: Failed nodes don't affect independent branches; human fixes only retry the errored node

### Creating a New Node

Extension nodes go in `src/harness/node/extensions/`. Create folder `src/harness/node/extensions/your_node/` with two files:

**`node.py`**:
```python
from src.harness.node.base import BaseNode

class Node(BaseNode):
    async def execute(self, inputs, force_push_msgs, context):
        # Implement your logic
        result = await self._process(inputs)
        return {"output": result}
```

**`your_node.json`** (input/output schema):
```json
{
    "inputs": {
        "input1": {"type": "str", "description": "Input description"}
    },
    "outputs": {
        "output": {"type": "str", "description": "Output description"}
    }
}
```

Nodes are auto-discovered via `importlib.import_module` — no registry needed.

### Node I/O Specification

Each node declares its input/output Schema in `your_node.json`. The engine auto-validates type matching during scheduling.

| Basic Type | Description |
|------|------|
| `MessageCard` | OpenAI format message dict |
| `MessageList` | OpenAI format message list |
| `ToolSchema` | OpenAI Function Calling Schema |
| `ToolList` | List of ToolSchema |
| `ToolMessage` | Tool return message |
| `Str` | String |

Nodes receive inputs via `async execute(inputs, force_push_msgs, context)` and return `Dict[str, Any]`. A node executes automatically once all its inputs are ready.

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
