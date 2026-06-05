# Usage Guide

**One-line guide**: To maximize Agent effectiveness, the core principle is: know what you want. Don't rely on vague instructions — command with clear task objectives and professional knowledge. Never use it just for the sake of using it.

## Application Scenarios

### 1. Multi-Source Information Aggregation

Every morning, the Agent automatically fetches your subscribed RSS feeds, arXiv preprints, competitor website updates, and forum posts, filters them by your interests, and generates a summary briefing.

### 2. Academic and Note-Taking Assistance

During lectures or when reading literature, when encountering complex mathematical formulas or code logic, you can make simple marks and instruct the Agent to help you organize, derive, or format notes in the background.

::: danger Note
You must mount the target files to the sandbox directory or explicitly grant permissions in the system's **read-write whitelist** (`.purrcat/file.json`); otherwise, the Agent cannot modify host files.
:::

### 3. Feishu / Cloud Platform Automation

Many platforms like Feishu provide open-source CLI tools. Since the Agent has full execution permissions inside its isolated Docker sandbox, it can "arm itself" — directly install and configure these external CLIs in the terminal.

Combine this sandbox-level execution capability with specific Skills, and the Agent can natively interface with and automate complex cloud-based spreadsheets, documents, and information aggregation tasks.

### 4. Financial Data Analysis (Coming Soon)

Integrate community financial Harness Engineering expert plugins to give your Agent professional analytical capabilities.

::: tip Coming soon!
This domain expert is still under development...
:::

## Experience & Tips

### 1. Workflow and Skill Solidification

When you have fixed processing flows, solidifying them into Skills is the most efficient approach.

- **Skill Minimal Structure**: The simplest form is a Markdown document (see Extension Guide), which explains the standard business process and precautions.
  
- **Advanced Usage**: Capable users can package execution scripts in Skills. When assigning tasks, clearly distinguish between **task planning** and **task triggering** — use `Schedule` (structured calendar files) for long-term planning, and use `Cron` (the built-in tool) for timed alerts and triggers. Before each task execution, simply let the Agent load the corresponding Skill via `Fetch`.

::: tip Advanced: Separation of Planning and Triggering
When assigning complex tasks, clearly separate planning from triggering:
- **Schedule**: Structured calendar files for long-term planning.
- **Cron**: Specific alert/trigger tool for timed execution.
:::

### 2. Engineer Your Instructions

Understanding the underlying routing and tool calling mechanisms (MCP protocol, sandbox environment) can dramatically improve instruction efficiency. Specify execution paths rather than vague requests.

Example — instructing the Agent to integrate Feishu CLI:

❌ **Inefficient**: "Install the Feishu CLI tool" (prone to trial-and-error or hallucination)

✅ **Efficient**: "Use GitHub MCP to search for Feishu-related CLI tools, then download and install them in the sandbox as a permanent extension."

By explicitly specifying the search source (GitHub MCP) and destination (sandbox), the Agent executes precisely and efficiently.

::: tip Advanced: Document Problem-Solving Patterns
You can write frequently used "solution strategies" into the system's layered memos. For example, add a meta-rule in SOUL.md: "When encountering capability gaps, prioritize using GitHub search to find and install suitable open-source tools." This enables the Agent to achieve a degree of autonomous evolution.
:::
