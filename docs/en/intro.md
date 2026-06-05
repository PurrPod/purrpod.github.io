# PurrCat Core Technology

PurrCat is a safe, stable, cost-effective, and deeply customizable local Agent framework. Unlike conventional "Q&A" chatbot tools, PurrCat is designed to give Agents true "autonomous work" capabilities — equipped with memory, proactive perception, complex workflow orchestration, and industrial-grade concurrent scheduling.

This document introduces PurrCat's eight core technology modules.

---

## 1. Hybrid Memory & Knowledge Graph System

This is one of PurrCat's most impressive and technically sophisticated modules, solving the fundamental problem of Agents "forgetting things." The memory system draws inspiration from neuroscience literature on memory classification.

### Short-Term Working Memory

An in-memory `memo` variable that spans session boundaries, retaining the most recent Agent summaries. This perfectly solves the pain point of "forgetting what happened just a second ago when switching sessions."

### Core General Memory

System-level archive (`MEMORY.md`) that solidifies user profiles and work experience, injected as System Prompt during session initialization to establish the Agent's behavioral foundation.

### Long-Term Structured Memory (PurrMemo System)

Modeled after the human brain's complex memory mechanisms, comprising two engines:

- **Episodic Memory Engine**: Based on SQLite + FTS5, provides timeline-based and full-text BM25 event traceability — remembering "what happened and when."
- **Semantic Memory Engine**: Based on ChromaDB (vector semantic clustering) and NetworkX (cognitive graph triples). Dynamically builds entity relationships with support for reinforcement (Reinforce) and weakening (Weaken), plus HTML visual graph export.

### Core Technology Support

- **RRF Hybrid Retrieval**: During retrieval, BM25 (keyword) and Vector (semantic) results are fused via Reciprocal Rank Fusion through global thread pool multi-channel concurrency, significantly improving recall accuracy.
- **Asynchronous Memory Digestion & Ebbinghaus Forgetting**: New cognition is first stored in pending, then converted to triples by a background daemon process (dedicated LLM) and silently written to the graph, never blocking user interaction. A dynamic decay mechanism ensures that long-unreinforced memory edges naturally weaken and are cleaned up.

---

## 2. Harness: Orchestrated Chain-of-Thought & DAG Workflow Engine

Harness is PurrCat's "extended brain," decomposing complex tasks into executable Directed Acyclic Graphs (DAGs). It provides a novel approach to Multi-Agent concurrency.

### Solving the Multi-Agent Communication Bottleneck

Traditional Multi-Agent frameworks have different Agents "shouting" at each other through natural language, causing massive Token redundancy. Harness adopts the concept of "one person with multiple brains executing concurrently" through orchestrated chain-of-thought, dramatically reducing communication overhead and inference costs.

### Solving Tool Noise in Production Environments

The Harness module uses a "specific task binds specific tools" graph structure, supporting targeted tool injection at specific workflow stages. This prevents Agent confusion in complex scenarios.

### JSON-Driven Hot-Plugging

Deploying a complex workflow requires only a single JSON configuration file for dynamic loading and hot updates.

### Polymorphic Node Matrix

Including but not limited to:

- **Image Generator Node**: Direct Vision model integration, supporting text-to-image and image-to-image editing.
- **Conditional Router Nodes (if_else_router / switch_router)**: Precise multi-branch routing after intent recognition.
- **Human Intervention Node**: Triggers precise suspension of the current node to `WAITING` state, yielding control to the human.

### State Machine Safe Rollback

Supports injecting human instructions at any specific node. The system can clear downstream node states together, achieving precise checkpoint resumption and state rollback, perfectly preventing "data dirty reads."

---

## 3. Comprehensive Safe Tool Chain

Giving the LLM "hands and feet" with absolute security. PurrCat has designed and polished eight core native tools.

### 1. Bash: Sandbox Command Execution

Lets the model execute commands within a dedicated Docker container. Three key reasons for choosing Docker sandbox over direct host access:

- **Absolute File Safety**: Even the strongest CodingAgents rely on regex pattern matching for command interception, which is error-prone and introduces excessive Human-in-Loop. PurrCat uses Docker to build the Agent its own "virtual machine."
- **Autonomous Assistant Design Philosophy**: PurrCat aims for Agents with independent personalities capable of completing tasks, patrolling, and problem-solving autonomously. A fully isolated sandbox is ideal.
- **Persistent Sandbox for Long-term Tasks**: Agent-collected intelligence, work logs, and test files persist in the sandbox across sessions and restarts. Users can configure mount directories for external access.

### 2. FileSystem: Omnipotent File System Suite

Deeply incorporates design concepts from industry-leading CodingAgents:

- **Codebase Navigation & Operations**: Native `read` (line-precise paginated reading), `edit` (context-aware safe replacements), `write` (full overwrite), `search` (regex global Grep), and `glob` (glob pattern matching).
- **Rich-Text Dimensionality Reduction**: `read` has a built-in MarkItDown engine, automatically converting `.pdf`, `.docx`, `.xlsx` files to clean Markdown on the fly.
- **Safe Cross-Boundary Transfer (Import/Export)**: Whitelist/blacklist physical-level interception; strict 30MB limit with path traversal defense on import; auto Git snapshot (Auto-Commit) on export to prevent catastrophic overwrites.

### 3. CallMCP: Dynamic Route MCP Extension

Interface for MCP tool extensions. Why not pass MCP Schemas directly? Because OpenAISDK appends tool Schema after System Prompt, and adding/removing tools causes full message history reconstruction, devastating KV Cache hit rates. PurrCat uses dynamic routing instead.

### 4. Search: Hybrid Retrieval

Semantic + keyword hybrid retrieval. Supports `web` (URL + summaries) and `local` (installed Skills, MCP tools, memories) routing. Over 90% accuracy in hundreds-scale recall testing.

### 5. Fetch: Deep Information Retrieval

Fetches details: crawls web pages to Markdown, loads Skill files, retrieves MCP tool parameter Schemas, reads system SOLO.md and TODO.md.

### 6. Memo: Memory Interaction

The Agent's interface to the memory system. The task executor distills a concise Summary at necessary checkpoints and passes it to the background PurrMemo engine for digestion — never blocking the main session.

### 7. Cron: Scheduled Wake-up

Enables the Agent to set timed tasks, ensuring it wakes up at specified times to execute tasks.

### 8. Task: Background Subtask Scheduling

Dispatches subtasks to background Agents with support for kill, reload, and real-time instruction injection, scheduling the DAG engine without blocking the main session.

---

## 4. Agent Hub & Session Management

Orchestrates the interaction gateway between the LLM, users, and the external world. Manages Agent lifecycle, memory context segmentation, and Git-like branching.

### Git-Like Session Branching

Supports `new_session`, `branch_session`, and `switch_session`. Users can "branch" within a conversation to try different approaches, then switch back to the main branch anytime.

### Robust Exception Repair

If the LLM initiates multiple tool calls but only partial results return due to network errors or manual interruption, the system automatically detects and "removes dangling nodes" (matching tool_calls against returned tool_call_ids), ejects malformed tool messages, and rolls back to a safe state.

### Agent "Soul" Injection

Define the Agent's personality, values, and underlying work logic through `SOUL.md`.

### Heartbeat + SOLO + TODO Autonomous Patrol

Combined with the System Clock sensor, the Agent has its own heartbeat. During idle time, it proactively loads `SOLO.md` (work standards/expected activities) and `TODO.md` (to-do items) for autonomous system patrol, data maintenance, garbage cleanup, and progress reporting.

### Smart Context Truncation

When approaching Token limits, the system automatically finds safe truncation points (avoiding mid-tool-call truncation, keeping the last 20 safe messages by default). Displaced history is replaced by highly compressed Memo summaries for seamless continuation.

### Dedicated Vision Consultant

For non-multimodal LLMs, a dedicated Vision consultant handles visual understanding, isolating low-signal image information from the main session to reduce hallucinations.

---

## 5. Proactive Perception & Event Gateway

Gives the Agent "life" and initiative, transforming it from a passive Q&A machine into a proactive intelligent assistant. Built on an event-driven architecture for multi-source information aggregation and distribution. The latest refactoring completely abandons traditional tight-coupled plugin loading in favor of an MCP-inspired architecture with physical-level decoupling.

### MCP-Like Independent Process & Instant Isolation

All sensors run as independent sub-processes. Integrated with the uv tool, utilizing PEP 723 single-file inline dependency specification, sensors instantly create virtual environments and auto-install dependencies on launch.

- **Physical Crash Protection**: A crashed sensor (e.g., Feishu WebSocket disconnect or RSS parsing error) never affects the main Agent process.
- **Zero Dependency Conflict**: Audio libraries for voice recognition are perfectly isolated from Feishu SDK and web scraping libraries in their own sandboxes.

### Standard Stream Communication & "Bulletproof Shield"

Communication between the main program and sensors uses OS-level standard I/O (Stdio) pipes with JSON-RPC, zero network overhead and extreme lightweight.

- **Anti-Pollution Shield**: The sensor process intercepts and redirects native `sys.stdout` to `stderr`. Third-party library warnings, errors, and print statements go to the log channel; only compliant JSON protocol data enters the main program parser.

### Configuration-as-Installation

- **No-Code Installation**: Users configure a few lines of JSON in `activate_sensor.json`. If the sensor is missing locally, the system automatically downloads the single-file script from the cloud (GitHub) and runs it instantly. The frontend UI provides visual one-click ON/OFF toggle and hot-reload.
- **Language Agnostic**: As long as a program can launch via command line and read/write JSON via stdio, it can integrate seamlessly — whether written in Node.js, Go, or any other language.

### Multi-Source Sensor Examples

Four built-in, ready-to-use core sensors:

- **System Sensor**: In-memory heartbeat daemon and alarm poller, bridging `cron.json`, proactively emitting events to wake the LLM.
- **Feishu Sensor**: Independent Feishu WebSocket client supporting bidirectional Markdown card communication.
- **RSS Sensor**: Background polling of subscribed tech blogs, proactively pushing new articles to the Agent.
- **Audio Sensor**: Ambient voice monitoring based on Whisper and pyttsx3, capturing voice commands and converting them to text.

> Breaking the reactive boundary: Traditional LLMs can only answer when asked. With this architecture, the Agent truly has the ability to proactively perceive the world — it can say: "Good morning! Your subscribed blog has updates, here's a summary..."

---

## 6. Model Scheduling & High-Concurrency Gateway

LLM resource scheduling for complex concurrent scenarios, built on OS principle knowledge.

### API Key Load Balancing

Uses underlying thread locks (`_usage_lock`) to maintain an available Key list, automatically assigning the least busy Key to prevent single-Key rate limits.

### Concurrency Lock & Exponential Backoff

For 429 Rate Limits, the system implements Semaphore queuing with jitter-added Exponential Backoff retry algorithm.

### Industrial-Grade High Availability

Multi-Agent coordination (multi-Node concurrent requests) easily triggers API rate limits. With up to 8 retries, the system ensures absolute API call availability.

---

## 7. Ultimate KV Cache Hit Rate & Token Economics

In today's era of million-token context windows, a stable KV Cache hit rate is the system's lifeline. One cache miss causes not only increased latency but also significant token cost. PurrCat has achieved a stable **99%+** cache hit rate through hundreds of experiments.

### 99%+ Cache Hit Rate

With DeepSeek as an example, consuming 100M tokens costs about 3 RMB. Minimal prefix recomputation means far faster response times than traditional general Agents.

### DAG Workflow Cost Reduction

Traditional Multi-Agent frameworks have Agents "shouting" at each other through natural language, creating massive communication Token redundancy. PurrCat's DAG system uses "one person with multiple brains concurrent execution," eliminating unnecessary inter-Agent communication.

### Memory Summary Economics

Conventional memory systems dump full conversation history to background for compression, wasting massive tokens. PurrCat has the task executor distill concise Summaries at necessary checkpoints, passing them to the PurrMemo engine — never blocking the main session.

### Lifecycle API Key Binding

The `APIKeyManager` implements strong task/session to single-Key binding, completely preventing the fatal problem of KV Cache being instantly reset when load balancing switches API Keys.

---

## 8. Ultimate Decoupling Topology, No-Code Extension & Engineering Aesthetics

PurrCat completely abandons traditional hard-coded secondary development. Through dynamic routing, microkernel design, and hot-loading, it provides a plug-and-play extension ecosystem.

### Zero-Code MCP Tool Integration

Simply paste standard MCP Server JSON config into `mcp_config.json`. The system asynchronously triggers Schema re-handshake, cache persistence, and automatic hot-update of the dynamic routing tool tree — minutes to new capabilities.

### One-Click Skill Installation

Execute `purrcat install skill <url>` to instantly download and hot-load community SOP workflows into the system's skill retrieval tree.

### Visual DAG Workflow Deployment

Reuse or distribute complex Harness workflows by importing a single JSON graph configuration file. The built-in visual engine supports drag-and-drop, connection, and dynamic node arrangement in the UI.

### Plug-and-Play Proactive Sensors

Configure a few lines of environment settings in `activate_sensor.json`. The system automatically pulls single-file scripts from the cloud when sensors are missing locally. The frontend UI provides one-click ON/OFF toggle and hot-reload.

---

## Roadmap

- Deep multimodal model integration
- Model vendor API mapping layer
- Standardized Skill / Harness open-source ecosystem marketplace
- More sensors and external integrations

Looking forward to your participation! Let's build a better PurrCat together.
