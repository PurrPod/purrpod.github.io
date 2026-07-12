# Usage Guide

**One-line guide**: To maximize Agent effectiveness, the core principle is: know what you want. Don't rely on vague instructions — command with clear task objectives and professional knowledge. Never use it just for the sake of using it; instead, explore answers with well-reasoned ideas.

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