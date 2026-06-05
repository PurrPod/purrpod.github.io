# Architecture

## Project Structure

PurrCat adopts a highly decoupled modular design. Core code lives under `src/`:

```
src/
├── agent/                  # Agent brain
│   ├── agent.py            # Main loop & dialog
│   ├── manager.py          # Global singleton
│   ├── session_store.py    # Session storage & branching
│   └── system_rules/
│       └── AGENTS.md       # System instructions
│
├── harness/                # DAG Workflow Engine
│   ├── process.py          # Async concurrent scheduler with checkpoint resume
│   ├── enums.py            # State enums (READY/WAITING/RUNNING/COMPLETED/ERROR)
│   ├── graph/              # DAG graph definitions (JSON)
│   │   ├── financial.json
│   │   ├── my_awesome_flow2.json
│   │   └── test_all_nodes.json
│   ├── node/               # Node implementations
│   │   ├── base.py         # BaseNode abstract class
│   │   ├── agent_node.py   # Agent session node
│   │   └── extensions/     # Extension nodes (one folder per node)
│   │       ├── agent_loop/           # LLM thinking loop
│   │       ├── appender/            # Message appender
│   │       ├── env_loader/          # Environment variable loader
│   │       ├── file_writer/         # File writer
│   │       ├── html_viewer/         # HTML preview
│   │       ├── human_intervention/  # Human intervention (pause & wait)
│   │       ├── if_else_router/      # Conditional routing
│   │       ├── image_generator/     # Image generator (txt2img/img2img)
│   │       ├── json_builder/        # JSON builder
│   │       ├── json_extractor/      # JSON extractor
│   │       ├── message_card_builder/ # Message card builder
│   │       ├── switch_router/       # Multi-way switch router
│   │       ├── task_input/          # Task entry
│   │       ├── task_output/         # Task exit
│   │       ├── template_renderer/   # Template renderer
│   │       └── text_file_reader/    # Text file reader
│   └── utils/
│       ├── llm_helper.py   # LLM helper
│       └── tool_helper.py  # Tool helper
│
├── memory/                 # Memory system
│   └── purrmemo/           # PurrMemo local memory engine
│       ├── client.py               # Memory client
│       ├── visualize_graph.py      # Graph HTML visualization
│       └── core/
│           ├── search_tool.py      # Hybrid search (BM25+Vector RRF)
│           ├── utils.py            # Utilities
│           ├── memory_worker/      # Background memory digestion daemon
│           └── storage/            # Storage engines
│               ├── event_engine.py   # Episodic memory (SQLite+FTS5)
│               ├── graph_engine.py   # Semantic graph (NetworkX)
│               └── vector_engine.py  # Vector engine (ChromaDB)
│
├── model/                  # LLM scheduling layer
│   ├── facade/model.py     # Model lightweight entry
│   ├── manager/
│   │   ├── key_manager.py  # APIKeyManager (least-busy-first)
│   │   └── concurrency.py  # Concurrency (Semaphore + Exponential Backoff)
│   └── core/llm_client.py  # LLM client
│
├── sensor/                 # Sensor layer
│   ├── base.py             # BaseSensor abstract
│   ├── gateway.py          # SensorGateway
│   ├── manager.py          # Sensor subprocess manager (uv + PEP 723)
│   └── extension/          # Sensor implementations
│       ├── feishu_bot.py       # Feishu bot (bidirectional Markdown)
│       ├── rss_watcher.py      # RSS subscription watcher
│       ├── system_clock.py     # System clock / alarm poller
│       └── audio_assistant.py  # Audio assistant (Whisper + TTS)
│
├── memory/                 # Memory system
│   └── purrmemo/           # Local memory engine
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
