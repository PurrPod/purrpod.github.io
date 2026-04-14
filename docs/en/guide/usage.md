# Usage Guide

To maximize the effectiveness of the Agent, the core principle is: know what you want. Don't rely on vague instructions; instead, command with clear task objectives and professional knowledge. Never use it just for the sake of using it.

## Application Scenarios

### 1. Academic and Note-Taking Assistance

During science classes or when reading literature, when encountering complex mathematical formulas or code logic, you can make simple marks and then instruct the Agent to help you organize, derive, or format notes in the background.

::: danger Note
You must mount the target files to the sandbox directory or explicitly grant permissions in the system's **read-write whitelist**; otherwise, the Agent cannot help you modify host files.
:::

### 2. Workflow and Skill Solidification

When you have fixed processing flows, solidifying them into Skills is the most efficient approach.

- **Skill Minimal Structure**: The simplest form is a Markdown document (see development documentation), which explains the standard business流程 and precautions.
  
- **Advanced Usage**: Capable users can package corresponding execution scripts in Skills. When assigning tasks, clearly distinguish between **task planning** and **task triggering**—use `Schedule` (structured calendar files) for long-term planning, and use `Cron` tools for timed alerts and triggers for specific tasks. Before each task execution, simply let the Agent load the corresponding Skill.

::: tip Advanced Usage: Separation of Planning and Triggering
When assigning complex tasks, be sure to clearly distinguish between task planning and triggering mechanisms:
- **Schedule**: Structured calendar files responsible for long-term planning coordination.
- **Cron**: Specific alert/trigger tools focused on timed triggering of specific tasks.
:::