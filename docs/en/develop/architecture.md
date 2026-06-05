# Architecture

## Project Structure

PurrCat adopts a highly decoupled modular design. Core code lives under `src/`:

```
src/
├── agent/                  # Agent brain
│   ├── agent.py            # Main loop & dialog
│   ├── manager.py          # Global singleton
│   ├── core/               # Agent kernel definitions
│   │   ├── HARNESS.md      # Heartbeat Harness
│   │   ├── MEMORY.md       # Memory system guide
│   │   └── SOUL.md         # Personality definition
│   └── system_rules/       # System instructions
│
├── harness/                # DAG Workflow Engine
│   ├── process.py          # Async concurrent scheduler
│   ├── enums.py            # State enums (READY/WAITING/RUNNING/ERROR/COMPLETED)
│   ├── graph/              # DAG graph definitions (JSON)
│   │   └── default.json
│   ├── node/               # Node implementations (modular)
│   │   ├── base.py         # BaseNode abstract class
│   │   ├── appender/       # Message appender
│   │   ├── file_input/     # File input node
│   │   ├── file_output_loop/ # LLM thinking loop
│   │   ├── flusher/        # Memory compression
│   │   ├── llm_chat/       # Single LLM call
│   │   ├── log/            # Log node
│   │   ├── message_card_builder/ # Feishu card builder
│   │   ├── skill_fetcher/  # Skill extraction
│   │   ├── str_adapter/    # String adapter
│   │   ├── summary_output_loop/ # Summary output loop
│   │   ├── task_input/     # Task entry
│   │   ├── task_output/    # Task exit
│   │   ├── tool_executor/  # Tool execution
│   │   ├── tool_kit/       # Tool assembly
│   │   └── truncker/       # Message truncation
│   ├── tools/              # Built-in tools
│   │   └── core/
│   │       ├── task_done/      # Task completion
│   │       └── yield_to_human/ # Yield control to human
│   └── utils/              # Helper functions
│
├── model/                  # LLM scheduling layer
│   ├── facade/model.py     # Model lightweight entry
│   ├── manager/
│   │   ├── key_manager.py  # APIKeyManager
│   │   └── concurrency.py  # Concurrency control
│   └── core/llm_client.py  # LLM client
│
├── sensor/                 # Sensor layer (gateway)
│   ├── base.py             # BaseSensor abstract
│   ├── gateway.py          # SensorGateway
│   ├── message/feishu.py   # Feishu sensor
│   ├── subscribe/rss.py    # RSS sensor
│   └── system/const.py     # Clock sensor
│
├── memory/                 # Memory system
│   └── purrmemo/           # Local memory engine
│
├── tool/                   # Tool layer (modular)
│   ├── bash/               # Sandbox shell
│   ├── callmcp/            # MCP calling
│   ├── cron/               # Scheduled tasks
│   ├── fetch/              # Unified fetch
│   ├── filesystem/         # File system
│   ├── memo/               # Memory tool
│   ├── search/             # Unified search
│   ├── task/               # Task scheduling
│   └── utils/              # Tool routing & format
│
└── utils/
    ├── config.py           # Config loading
    └── enums.py            # Enums

data/
├── skill/                  # Skill packages
├── memory/                 # Conversation storage
├── database/               # RAG knowledge base
└── checkpoints/            # Task checkpoints
```

## Architecture Layers

```
┌─────────────────────────────────────────┐
│  Sensor Layer (Gateway)                 │
│  Feishu / RSS / Clock                   │
│    → observe() → Gateway.push()         │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│  Agent Layer                            │
│  Dialog / force_push / Memory           │
│  Gateway.send() ← reply                 │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│  Model Layer (APIKeyManager)            │
│  Model.chat() → LLMClient               │
│  Least-busy key allocation              │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│  Tool Layer (Dynamic Loading)           │
│  dispatch_tool() dynamic import         │
│  Bash / Fetch / FileSystem / Search     │
│  Memo / CallMCP / Cron / Task           │
│  Unified error handling + truncation    │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│  Harness Layer (DAG Workflow Engine)    │
│  process.py: async concurrent           │
│  graph/ + node/ atomic nodes            │
└─────────────────────────────────────────┘
```

## Key Design Decisions

### Two-Layer File System

```
Host:      project_root/    ← FileSystem tool (whitelist-based)
Host:      agent_vm/  ──→  Sandbox: /agent_vm/  ← Bash tool read/write
```

- `Bash` tool runs in Docker sandbox, only accesses `/agent_vm/`
- `FileSystem` tool handles host file import/export, controlled by `.purrcat/file.json` whitelist

### Tool Routing

`dispatch_tool()` serves as the core routing hub, dynamically **imports** by tool name `src.tool.{name}.{name}` and executes the function.Mapped via `TOOL_FUNC_MAP`:

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

MCP tools are dispatched via the unified `CallMCP` entry point, separate from native tool routing.

## Roadmap

1. **Multi-model support**: Deep adaptation of mainstream open-source/closed-source models
2. **Multi-modal fusion**: Visual/audio model interfaces
3. **Skill marketplace**: Standardized plugin/Skill/Harness ecosystem
4. **Memory evolution**: More advanced personal memory system
