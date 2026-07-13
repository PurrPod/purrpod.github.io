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

## Experience & Tips

### 1. Workflow and Skill Solidification

When you have fixed processing flows, solidifying them into Skills is the most efficient approach.

- **Skill Minimal Structure**: The simplest form is a Markdown document (see Development Guide), which explains the standard business process and precautions.
  
- **Advanced Usage**: Capable users can package corresponding execution scripts in Skills. When assigning tasks, clearly distinguish between **task planning** and **task triggering**. Before each task execution, simply let the Agent load the corresponding Skill.

### 2. Engineer Your Instructions

Deeply understand the system's underlying routing and tool calling mechanisms (such as MCP protocol and sandbox environment) — this can bring a qualitative leap to your instruction execution efficiency. When assigning tasks, clearly specifying execution paths is far superior to vague requests.

Example — instructing the Agent to integrate Feishu CLI:

❌ Inefficient instruction: "Install the Feishu CLI tool for yourself" (prone to blind trial-and-error or hallucination)

✅ Efficient instruction: "Use the GitHub MCP tool to search for Feishu-related CLI tools and download/install them in the sandbox as your permanent extension capability."

By explicitly specifying the search source (GitHub MCP) and destination (sandbox), the Agent's execution process will be extremely precise and efficient.

::: tip Advanced: Document Problem-Solving Patterns
You can write frequently used "solution strategies" directly into the system's multi-layer memos. For example, append a meta-rule in the global MEMORY.md: "When encountering capability gaps, prioritize using GitHub search to find and install suitable open-source tools to expand your capabilities." This way, the Agent can achieve a certain degree of autonomous evolution.
:::