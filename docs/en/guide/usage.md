# Usage Guide

## Start with a Scam

> **One prompt to build the website you envisioned? That's a narrative scam.**

There's a brilliant answer on Zhihu ([source](https://www.zhihu.com/question/1999136031413384196/answer/2013204899521914097)) that cuts through the current AI hype with just five words: **"Information entropy + irreversibility."**

**Information entropy irreversibility** — this is the first-principles understanding of AI's capability boundary. In information theory, pixelation is an irreversible process. Lost information doesn't magically return just because the model is bigger or has more parameters.

Imagine handing AI a heavily pixelated image and asking it to restore the original高清 version. AI can certainly produce something — a complete picture with plausible-looking details. But here's the problem: the information lost in those pixels is **irreversible**. Those details AI filled in — are they really what you wanted?

Code works exactly the same way. You tell AI "build me a expense tracker," and five minutes later you have a working website. Impressive. But when you start using it, you realize there's no category filtering, no data export, and the UI doesn't match your taste. So you start "expanding the sentence" — adding qualifiers, filling in details, tweaking the prompt over and over. But as the prompt grows longer, you hit a wall that every large language model shares: **limited attention**. The more you add upfront, the more it forgets downstream. Output quality doesn't just plateau — it collapses.

The root cause: **the full picture in your head cannot be precisely extracted into a single prompt.** The more complex the requirement, the greater the information entropy, and the more uncontrollable the AI's deviation becomes. The idea that "one prompt can generate exactly what you want" is a consumer-grade包装 of something that's information-theoretically impossible — impressive in demos, broken in production.

This isn't an AI capability problem. It's a physical limit of information theory.

### So what's the right approach?

PurrCat's design philosophy acknowledges this from day one: **Don't try to solve complex problems with a single prompt. Instead, break big tasks into small steps, injecting human judgment at every checkpoint.**

Specifically:

- **Know what you want**: Don't rely on vague "build me an X." Come with clear goals and constraints.
- **Iterate step by step**: Generate a skeleton first, then refine details. Focus on one sub-problem at a time.
- **Orchestrate with DAG workflows**: Break complex tasks into a directed acyclic graph. Each node handles one responsibility, and context flows through state transitions between nodes.
- **Intervene at key nodes**: Don't追求 full automation. Stop at value-judgment points, let humans decide, and let the Agent execute.

Bottom line: **AI is an efficient executor, not a magical需求 translator.** What PurrCat does is make the execution process controllable, incremental, and correctable.

---

## How to Use the DAG Workflow Engine

The DAG (Directed Acyclic Graph) workflow is PurrCat's core mechanism for orchestrating complex tasks. Break a complex requirement into multiple nodes, connect them with directed edges, and you get an executable pipeline that's traceable, intervenable, and reusable.

### How to Orchestrate

Just like Coze, Dify, or any low-code platform — **drag and drop**. In the frontend UI editor, drag nodes onto the canvas, draw connections to define the flow direction, save it, and it's ready to run. No coding required.

### Two Orchestration Approaches

The DAG engine supports two fundamentally different collaboration modes, determined by how tightly coupled your nodes are:

#### Approach 1: Chain-of-Thought (Message History Inherited)

Nodes **inherit message history** from their predecessors. The output of the previous node automatically becomes the context for the next. Best for tasks that require coherent reasoning and progressive refinement.

> Example: Requirements Analysis → Architecture Design → Code Implementation → Testing. Each step builds on the previous one's output, like an assembly line.

#### Approach 2: Multi-Agent Collaboration (Message History Not Inherited)

Nodes **do not inherit message history**. Each node runs independently with its own context. Best for clearly separated subtasks that can execute in parallel.

> Example: Market research, tech stack evaluation, and UI design can be assigned to three independent nodes running simultaneously — no interference, results aggregated at the end.

### How to Choose?

**It depends on how correlated your node tasks are.**

- If node B needs to know what node A did to proceed → use **Chain-of-Thought** mode (inherit history)
- If nodes A and B each handle independent domains with no cross-dependency → use **Multi-Agent Collaboration** mode (no history inheritance)

### Core Advantage: Solving the "Limited Attention" Problem

Remember "information entropy irreversibility" from earlier? An LLM's attention window is finite — the longer the prompt and the more complex the task, the less controllable the output quality becomes.

The DAG workflow solution is elegantly simple: **Break a long SOP into multiple nodes, each with its own focused prompt and toolset.**

- Each node handles one thing only — short, targeted prompts keep the LLM's attention sharp
- Each node can have its own dedicated tool list, eliminating tool noise
- Each node can be debugged and optimized independently — fixing one node doesn't affect the rest

This is how DAG workflows enable the Agent to maintain high-quality, stable output even when facing complex, multi-step tasks.

---

## How to Use the Self-Evolution Factory

PurrCat comes with a built-in mechanism that lets the Agent write its own capabilities (KernelUpgrade tool + `src/evolve` evaluation pipeline). The most practical feature is **Trace to Skill** — turning a successful execution trace into a reusable Skill.

### Best Practice: Run First, Summarize Later

What's the biggest mistake when creating a Skill? **Writing it from scratch.**

The natural instinct is: draft a complete SOP, write Prompt templates and guidelines, then hand it to the Agent to follow. The result — you think you've covered everything, but when it actually runs, you discover missing error handling, missing edge cases, wrong context衔接... Endless revisions, exhausting and unstable.

**The counterintuitive but highly effective approach: execute first, then summarize.**

Here's the flow:

1. **Just do it**: Without any Skill, guide the Agent through the complete task using natural language.
2. **Embrace the bumps**: Every error, omission, ambiguity, and edge case you encounter is valuable material for your Skill. Only after running the real process does the Agent truly know what pitfalls exist, where things break, and which steps need special attention.
3. **Summarize after success**: Once the execution succeeds and the output meets expectations, use KernelUpgrade's `trace_to_skill` tool to automatically solidify the successful trace into a Skill. The system extracts key steps, Prompt context, tool call sequences, and注意事项 from the trace.
4. **Iterate continuously**: A solidified Skill is not the终点. When facing similar but more complex tasks later, upgrade the existing Skill to gradually完善 it.

### Why This Works Better

- **Experience-driven, not imagination-driven**: Writing from scratch is "predicting" problems; Trace to Skill is "summarizing" problems. One relies on guessing, the other on real experience.
- **Authentic context**: Traces capture real execution context, real inputs/outputs, real errors and fixes — far more reliable than人工臆想的 Prompt templates.
- **Full pitfall coverage**: Every detour and fix from a successful run is recorded in the Skill's guidelines. The next person (including yourself) won't fall into the same trap twice.

### When to Use Trace to Skill?

- ✅ You just completed a complex task and know you'll need this flow again
- ✅ You notice certain steps are fixed and reproducible
- ✅ You want to沉淀 personal work experience into reusable team assets

- ❌ The task is one-off — no need to solidify
- ❌ The workflow is still changing frequently — wait until it stabilizes

Bottom line: **The best Skill isn't written — it's run into existence.**

---

## Unattended Mode: Let the Agent Work While You're Away

PurrCat supports **unattended mode** — when you're not at the computer, the Agent can be repeatedly woken up according to your rules to execute tasks autonomously. The core mechanism: **Heartbeat + SOLO.md behavior rules + TODO.md task list**.

### Setup Steps

#### 1. Write SOLO.md — The Behavioral Constitution

SOLO.md defines the Agent's **absolute底线** and **expected activities** during unsupervised periods. It includes:

- **Inviolable Rules** (red lines):
  - Host filesystem is **read-only**: Never modify or delete any host files when the user is away
  - Information security: Never leak API keys, passwords, or sensitive data
  - Record ideas only — don't execute actions with potential side effects without approval

- **Expected Activities** (what the Agent should do in idle time):
  - **Sandbox cleanup**: Check and clean up temp files, test artifacts, expired caches
  - **Memory organization**: Review recent interactions, archive new knowledge into memory and knowledge graph
  - **Self-tracking**: Check the PurrCat repository for latest updates and Releases
  - **Project patrol**: Review active project code, log potential bugs or improvements

#### 2. Write TODO.md — The Task List

If you have **specific tasks** for the Agent to work on during idle time, write them in TODO.md. The Agent reads this file every time it wakes up and tries to make progress.

#### 3. Enable Heartbeat

Set `system_clock`'s `enabled` to `true` in `activate_sensor.json`. The Heartbeat will **repeatedly wake** the Agent at the configured interval.

```json
{
  "system_clock": {
    "enabled": true,
    "env": {
      "CRON_FILE": ".purrcat/core/cron.json"
    },
    "capabilities": { "observe": true, "express": false }
  }
}
```

**Recommended interval**: Don't set it too frequent. **30 minutes (1800 seconds)** is a good starting point. Waking up too often is unnecessary and wastes tokens.

### Workflow

1. Agent enters idle state
2. Heartbeat triggers → Agent wakes up
3. Agent reads **SOLO.md** to understand behavioral boundaries and expected activities
4. Agent checks **TODO.md** for pending tasks
5. Tasks exist → Execute tasks and update TODO.md progress
6. No tasks → Pick an activity from SOLO.md's expected activities (cleanup/reflect/patrol)
7. After execution, wait for the next Heartbeat

### When to Use?

- ✅ You want the Agent to patrol project code overnight and deliver a morning report
- ✅ You have data processing tasks with no urgent deadline — let the Agent work on them gradually
- ✅ You want the Agent to continuously monitor a domain and push updates proactively

- ❌ Tasks requiring real-time decisions or frequent confirmations aren't suitable
- ❌ Tasks involving host filesystem modifications (unless authorized in file.json whitelist)

Bottom line: **Write a good SOLO.md, turn on Heartbeat, and the Agent will work for you while you sleep.**

---

## Application Examples

### 1. Multi-Source Information Aggregation

Every morning, the Agent automatically fetches your subscribed RSS feeds, new arXiv papers, competitor website updates, and specific forum posts, filters them by your interests, and generates a summary briefing.

### 2. Academic and Note-Taking Assistance

During science lectures or when reading literature, when encountering complex mathematical formulas or code logic, you can make simple marks and instruct the Agent to help you organize, derive, or format notes in the background.

### 3. Organize Feishu Sheets, Files, and Information

Many official platforms like Feishu provide open-source CLI tools. Since the Agent has absolute execution permissions inside its isolated sandbox, it can "arm itself" — directly install and configure these external CLIs in the terminal.

Combining this sandbox-level command execution capability with specific Skills, the Agent can natively interface with and automate complex cloud-based spreadsheets, documents, and information aggregation tasks, easily breaking down application silos.

### 4. Assist with Financial Data Analysis

Integrate community financial Harness Engineering extension workflows to give your Agent strong professional analytical capabilities, saving you significant time and effort.

### 5. Scheduled Project Maintenance and Health Monitoring

PurrCat's built-in Heartbeat + SOLO autonomous patrol mechanism allows you to set intervals for automatic wake-ups. It will retrieve the to-do list and SOLO rules to automatically monitor project health, clean up garbage, fix TODO/FIXME items, and achieve unattended autonomous iteration.


## Engineer Your Instructions
Deeply understand the system's underlying routing and tool calling mechanisms (such as MCP protocol and sandbox environment) — this can bring a qualitative leap to your instruction execution efficiency. When assigning tasks, clearly specifying execution paths is far superior to vague requests.

Example — instructing the Agent to integrate Feishu CLI:

❌ Inefficient instruction: "Install the Feishu CLI tool for yourself" (prone to blind trial-and-error or hallucination)

✅ Efficient instruction: "Use the GitHub MCP tool to search for Feishu-related CLI tools and download/install them in the sandbox as your permanent extension capability."

By explicitly specifying the search source (GitHub MCP) and destination (sandbox), the Agent's execution process will be extremely precise and efficient.

::: tip Advanced: Document Problem-Solving Patterns
You can write frequently used "solution strategies" directly into the system's multi-layer memos. For example, append a meta-rule in the global MEMORY.md: "When encountering capability gaps, prioritize using GitHub search to find and install suitable open-source tools to expand your capabilities." This way, the Agent can achieve a certain degree of autonomous evolution.
:::