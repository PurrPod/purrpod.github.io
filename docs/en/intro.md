# Introduction

## CatInCup Core Features: Why It's Better?

### 1. Absolutely Secure Dual Running Environment

Have you heard others' horror stories: "The Agent ran random commands and messed up my computer / deleted important files!"

::: details 💡 CatInCup's Solution
In CatInCup, you don't have to endure such system-level disasters caused by Agent going rogue. The confidence to let Agent handle high-risk tasks unattended comes from our innovative **two-level environment isolation and whitelist control**:

- **Docker Sandbox Environment**: Agent's "exclusive playground". All code execution and efficient command-line tool usage are forced to run within containers, completely isolated from the physical host.
- **Local File System (Permission Hierarchy)**: Define the interaction boundary between the physical machine and sandbox through strict configuration files:
  - `dont_read`: **Privacy Restricted Zone**. Completely shields personal keys and other private data, preventing unintentional leakage by large models.
  - `sandbox_dir`: **Operation Domain**. Strictly regulates Agent's writable and overwritable space in the local file system.
  - `docker_mount`: **Mounting Channel**. Explicitly opens the bridge between local and sandbox, authorizing sandbox scripts to directly process specified local data. (Note: Files in these folders will be directly affected by the sandbox environment, please pay attention to security)
:::

### 2. Dimensionality Reduction Architecture: Customizable Harness Engineering

Other frameworks are still struggling with basic Skills and prompts, but a new concept of dimensionality reduction is emerging: Harness Engineering!

::: details 💡 CatInCup's Solution
Traditional Agents are often locked by a single system prompt, but in CatInCup, you can seamlessly dispatch multiple **Experts** such as AI research assistants, quantitative traders, and senior programmers within the same system. We expose highly extensible interfaces:

- **Regular Integration**: Supports standard **Skill** (Anthropic-compliant) and **MCP Service** (one-click access to external services with built-in recycling mechanism).
- **Plugin (Native Plugin)**: Shared infrastructure for all Experts in the framework, written in pure Python (package as tool), greatly reducing tool development barriers.
- **Expert (Expert Workflow)**: For complex industry-specific needs, Skill's constraints are often insufficient. Developers can inherit `BaseTask` under `src/models/expert/`, completely rewrite built-in functions and state transitions, tailor-made Harness Engineering workflows, and directly enjoy the framework's API concurrency and polling acceleration.
:::

### 3. Extreme Context Economics

Have you heard others complain: "Asking a certain shrimp to modify a small file actually cost me several dollars in tokens!"

::: details 💡 CatInCup's Solution
In CatInCup, you don't have to worry about bill explosions. After months of in-depth experimental verification, we have made extensive optimizations in context management. Under model vendors with KV Cache mechanism, **these underlying optimizations that save you money and speed up include but are not limited to**:

- **Static Route Allocation**: Abandon the traditional approach of dynamically inserting Tool Schema into System Prompt. Since model vendors usually inject Tool Schema after System Prompt, dynamic mounting causes direct cache invalidation. We use the idea of route tool allocation to ensure that large model KV Cache hit rate always remains at an extremely high level (the latest architecture's main Agent average hit rate has stabilized at 93.1%).
- **Response Speed Transformation**: Extremely high cache hit rate not only significantly reduces token bills but also brings visible improvement in response speed for each round of dialogue.
:::

### 4. Industrial-Grade Stability: 7x24 Unattended Operation

While others are still complaining about using Agent like a supervisor, constantly staring at the screen to prevent errors and interruptions, you can go to sleep peacefully and wait for CatInCup to report results!

::: details 💡 CatInCup's Solution
This benefit from introducing extensive and professional operating system (OS) domain knowledge into the architecture design. To ensure the absolute stable working state of the system, **we have designed a large number of mechanisms at the bottom, including but are not limited to**:

- **RR Scheduling and Anti-blocking**: Adopts API thread-level design and Round-Robin scheduling strategy to ensure that any single API request will not time out or drag down the global system.
- **Cache-Level Task Binding**: Each subtask is independently bound to a specific API Key, avoiding context interleaving caused by concurrent requests, and precisely ensuring KV Cache hits.
- **State Machine Real-time Persistence**: The execution state of subtasks is saved in real-time at the end of each round of dialogue. Even in the event of irreversible power-off termination, the system's built-in fallback repair logic supports you to `reload` at any time and seamlessly resume dialogue. Mom no longer has to worry about Agent messing around and I can only watch - you can interrupt and add new instructions at any time!
:::

### 5. Multi-threaded Non-blocking Background Subtasks: True "Multi-core" Concurrent Experience

Asking Agent to help with a big project only to have the entire chat window freeze for ten minutes while you can't do anything, can't ask new questions, just staring at the screen in a daze - that's the worst!

::: details 💡 CatInCup's Solution
In CatInCup, we completely break the inefficient "one question one answer, single-threaded blocking" mode of traditional Agents, giving you true **multi-task coordination ability**. This benefit from our underlying subtask scheduling design:

- **Background Silent Operation, Main Interface Never Blocked**: When you issue complex instructions (such as batch processing documents, crawling hundreds of web pages), the task will be cut into the background by Agent as a subtask. Your main session window is **absolutely free** - you can continue to discuss other issues with Agent, or directly throw it the next new task.
- **Multi-Agent/Expert Concurrent Collaboration**: Combined with the customizable workflow mentioned earlier, you can truly experience the feeling of "leading a team". Due to the underlying implementation of API thread-level isolation and KV Cache independent binding, you can let Coding Agent run compilation in the background sandbox while letting Trading Agent help you pull the latest A-share research reports. **Your personal assistant is no longer a single-threaded robot, but an elite team that can work concurrently with multiple cores.**
- **God's Eye View of Progress Control**: Even if all tasks are running in the background, you can still check the real-time state machine flow progress of each subtask or dynamically inject instructions through the system's task scheduling center. You are not just a user, but a commander who controls the overall situation.
- **Freedom to Inject Instructions Anytime**: CatInCup provides a forced instruction injection function, allowing you to inject your instructions or opinions at any time while Agent is busy.
:::

### 6. A Personal Assistant with "Soul"

Agent's "amnesia" is so frustrating! The problem you just corrected last time, and it still doesn't learn the lesson this time!

::: details 💡 CatInCup's Solution
In CatInCup, Agent will automatically summarize experience and lessons, update your user profile, and remember your small preferences during interaction.

- **Abandon Bloating**: Through practice, we found that traditional memory systems like RAG or Mem0 are too inefficient and lack logic in **personal use scenarios**. CatInCup simplifies and uses an extremely low-loss lightweight memo-driven memory system.
- **Soul Definition (SOUL.md)**: Open underlying personality interface. You can inject unique "soul" settings and behavioral styles into your exclusive personal assistant by modifying this file.
:::

## 🗺️ Evolution Roadmap

- Add multimodal model interaction interface
- Add model vendor API mapping layer
- Build an exclusive Harness Engineering open source ecosystem community
- Develop more advanced memory system technology suitable for personal scenarios
- Add more and richer Sensors

Looking forward to your participation! Welcome contributions! Let's build a better CatInCup together!
