# Development Guide

Welcome to PurrCat development. The framework's design philosophy is modular and decoupled, providing four layers of extension mechanisms.

## Development Roadmap

```
                      Difficulty
                         ↑
         Node / Sensor / MCP Tool      ← Highest
          Skill / Graph                 ← Medium
          SOUL.md / SOLO.md             ← Low
```

---

## 1. Modify Agent Personality (SOUL.md)

Edit `.purrcat/core/SOUL.md` to change the Agent's personality, tone, and values.

**Note**: Only modify `SOUL.md`. Do not touch files under `src/agent/system_rules/` — they contain tool guidelines and behavior rules essential for proper tool calling.

---

## 2. Skill Development (No-Code / Low-Code)

Follow the [Anthropic Skill specification](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills). A Skill is a directory under `skills/` with `SKILL.md` as its core.

### Directory Structure

```
skills/your_skill/
├── SKILL.md           # ★ Core: skill instruction document
├── LICENSE.txt        # Optional: license
└── scripts/           # Optional: helper scripts
    └── your_script.py
```

### SKILL.md Format

```
Two required fields at the beginning:

---
name: your_skill_name
description: "Trigger condition description. When should this skill be used?"
---

# Skill Title

## Usage

xxx
```

### Skill Limitations

Skill scripts run inside the **Docker sandbox** via the `Bash` tool, only accessing files under `/agent_vm/`. They **cannot directly read/write host files**.

To operate host files, use the FileSystem tool (controlled by `.purrcat/file.json` whitelist).

---

## 3. Harness / Node Development (DAG Workflow)

Harness is PurrCat's DAG workflow engine that orchestrates AI pipelines through **configuration-driven + atomic nodes**. Each node is an independent Python module inheriting `BaseNode` implementing the `execute` method.

::: tip Visual DAG Editing
The WebUI supports drag-and-drop node wiring for dynamic workflow orchestration. Click deploy after editing to auto-compile into JSON graph definitions and hot-load.
:::

### Key Concepts

- **`process.py`**: Main scheduler using `asyncio.gather(return_exceptions=True)` for concurrent scheduling, supporting checkpoint recovery and state rollback
- **`BaseNode`**: Base node class — inherit and implement `async execute(inputs, force_push_msgs, context)`
- **`graph/*.json`**: DAG definition files describing topology and dependencies, supporting dynamic hot-plugging
- **Node states**: `READY → WAITING → RUNNING → COMPLETED | ERROR`, with checkpoint recovery and cascading downstream cleanup
- **Node type matrix** (built-in nodes located in `node/extensions/`):
  - `agent_loop` — LLM loop thinking conversation
  - `appender` — message appending
  - `env_loader` — environment variable loading
  - `file_writer` / `text_file_reader` — file read/write
  - `html_viewer` — HTML preview rendering
  - `human_intervention` — human intervention, suspends to `WAITING` and surrenders control
  - `if_else_router` / `switch_router` — conditional routing and multi-branch splitting
  - `image_generator` — image generation (text-to-image / image-to-image editing)
  - `json_builder` / `json_extractor` — JSON construction and extraction
  - `message_card_builder` — message card construction
  - `task_input` / `task_output` — task entry and exit
  - `template_renderer` — template rendering
- **`yield_to_human`**: Built-in tool allowing Agent to proactively surrender control when unable to complete a task
- **Safe rollback**: Supports injecting human instructions at specific nodes, cascading downstream cleanup of old state to prevent data dirty reads
- **Error isolation**: Failed nodes don't affect other independent branches; human fixes only retry the errored node

### Creating a New Node

Extension nodes go in `src/harness/node/extensions/`. Create folder `src/harness/node/extensions/your_node/` with two files:

**`node.py`**:
```python
from src.harness.node.base import BaseNode

class Node(BaseNode):
    async def execute(self, inputs, force_push_msgs, context):
        # Implement your node logic
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

---

## 4. Custom Tools (via MCP Protocol)

PurrCat's 8 native tools (Bash / FileSystem / Fetch / Search / Cron / Memo / CallMCP / Task) are not modifiable. To add custom tools, use the standard **MCP (Model Context Protocol)**:

1. Write an MCP Server in any language following the MCP docs
2. Register it in `.purrcat/mcp_config.json` under `mcpServers`
3. The system auto-fetches Schema and hot-loads on startup

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

See [MCP Documentation](https://modelcontextprotocol.io).

---

## 5. Sensor Development (Environmental Perception)

Sensors are the Agent's antennae connecting to the physical world and external applications. The latest refactored Sensor architecture is based on **independent subprocess + manager.py management + BaseSensor base class + SensorGateway gateway**, completely abandoning the traditional tightly coupled plugin pattern.

### Directory Structure

Sensors are placed in `src/sensor/extension/`:

```
src/sensor/
├── base.py                 # BaseSensor base class
├── gateway.py              # Message gateway
├── manager.py              # Subprocess manager
└── extension/              # ← Sensor implementations go here
    ├── feishu_bot.py       # Feishu bot
    ├── rss_watcher.py      # RSS watcher
    ├── system_clock.py     # System clock
    └── your_sensor.py      # Your custom sensor
```

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
            data = ...  # Get data from external source
            if data:
                from src.sensor.gateway import get_gateway
                get_gateway().push(self, data)

    def _express(self, message, **kwargs) -> bool:
        """Send message externally (requires enabled)"""
        ...  # Send message to external
        return True
```

### SensorGateway

The gateway maintains a **message queue** and **active channel set**:

- **`push(sensor, content)`** — Sensor pushes messages to queue, auto-wakes Agent
  - Receives `/unbind` command → removes from active_channels
  - type=message → auto-marks as active channel
- **`send(message)`** — Called after Agent replies, iterates active_channels

### Auto-Discovery & Registration

The system auto-scans all `BaseSensor` subclasses under `src/sensor/extension/` at startup:

1. Check `config_key` attribute
2. Read `enabled` status from corresponding key in `activate_sensor.json`
3. If enabled, launch independent subprocess via `manager.py` (uv + PEP 723)

Developers only need to create sensor files in `src/sensor/extension/` with proper `config_key`.

### Independent Subprocess Architecture (MCP-like)

After the latest refactoring, all Sensors run as independent subprocesses managed by `manager.py`:

- **uv + PEP 723 instant environment**: Integrated with Astral uv tool, leveraging single-file inline dependency specification. When launching a Sensor, it automatically creates a virtual environment and installs dependencies.
- **Physical crash protection**: A single Sensor crash does not affect the main Agent process.
- **Stdio JSON-RPC communication**: Uses standard input/output pipes with zero network overhead.
- **Anti-pollution shield**: Intercepts `sys.stdout` in subprocess and redirects to `stderr`. Only valid JSON protocol data enters the main program parser.
- **Configuration-as-installation**: Configure a few lines of JSON in `activate_sensor.json`, and the system automatically downloads scripts from the cloud and runs them.

### Built-in Sensor Reference

| Sensor | config_key | Type | Description |
|--------|-----------|------|-------------|
| Feishu | feishu | message | Feishu bot bidirectional communication (Markdown cards) |
| RSS | rss | subscribe | RSS subscription timed fetching |
| Clock | heartbeat | system | Timed heartbeat / alarm triggering |
| Audio | audio | system | Ambient voice monitoring (Whisper + pyttsx3) |

---

## 6. Graph Workflow (Visual Orchestration)

A Graph is the **workflow definition file** (JSON format) for the Harness engine, describing the topological relationships and dependency order between nodes. You can create a Graph in two ways:

- **Visual drag-and-drop**: In the WebUI editor page, drag and connect nodes visually, then save to auto-generate the JSON graph file
- **Write JSON manually**: Edit `harness/graph/*.json` directly to define node types, inputs/outputs, and connections

A Graph file contains a list of nodes and edges. Each node references an extension implementation under `node/extensions/`. The system auto-discovers nodes via `importlib.import_module` — no manual registry maintenance needed.

Graphs support hot-plugging: import a JSON config file to dynamically load and hot-update a workflow, making it easy to distribute and reuse complex workflows.

---

## 7. Configure Autonomous Patrol Rules (SOLO.md)

SOLO.md is the **behavior specification file** for when the Agent is idle, located at `.purrcat/core/SOLO.md`. When the system clock triggers a heartbeat and there is no user interaction, the Agent automatically reads SOLO.md and follows the rules to execute tasks.

SOLO.md consists of two parts:

- **Absolute Rules**: Non-negotiable safety and behavior boundaries, such as "Host system read-only principle" and "Information security code"
- **Expected Activities**: A list of tasks the Agent can autonomously perform during idle time, such as cleaning temporary files, auditing project code, checking for version updates, organizing memories, etc.

You are free to edit SOLO.md and add new expected activities to customize the Agent's autonomous behavior.

---

## 8. Development Principles

1. **One PR, one problem** — avoid giant mixed commits
2. **Backward compatibility** — don't break existing features
3. **Path safety** — validate all host file paths are within project_root
4. **Commit messages in English**
5. **Human-friendly errors** — every known error should provide clear guidance