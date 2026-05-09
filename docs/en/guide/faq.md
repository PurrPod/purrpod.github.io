# FAQ

## 1. Environment Deployment

**1. What are the prerequisites for running?** Core dependencies are: **Miniconda** (Python environment), **Docker** (sandbox isolation). **Node.js** (providing `npx`) is optional — only needed if using MCP extensions.


**2. What to do if script execution has permission errors?**




**3. Installation timeout or failure?**

Built-in retry logic. If it continues to fail, configure domestic mirror sources (Conda Tsinghua source, Docker image acceleration), or install dependencies offline first.

**4. Must Docker be installed?**

**Must be installed**. The framework's local sandbox, Shell execution, and read-write isolation all depend on Docker. Core functionality cannot run without it.

**5. Do I need Node.js?**
PurrCat itself doesn't require Node.js (UI is Python TUI). However, if you plan to use MCP extensions (Playwright, GitHub, etc.), you need **Node.js** (provides `npx`) and optionally **uv** (Python package manager).

**6. Docker build fails with network errors?**
Select the Aliyun mirror (option 2) during `purrcat setup`, or configure a Docker mirror accelerator manually.

**7. Conda environment creation very slow?**
Configure a Conda mirror:
```bash
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/free/
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/main/
conda config --set show_channel_urls yes
```

**8. `purrcat` command not found?**
Ensure you're in the project root directory. You can also use `purrcat setup` and `purrcat start` directly.

## 2. Operation and Usage

**1. Can tasks resume after interruption?** Yes. The framework has built-in checkpoint persistence. State is saved to disk after every round. For unexpected exits, simply restart and ask the Agent to resume — it will reload the checkpoint and continue.

**2. How does the Agent remember my preferences?** Built-in **lightweight memo system** (Memo tool + PurrMemo local engine). Simply tell your preferences in the conversation, and the system will persist them with extremely low token consumption.

**3. What to do if API calls are restricted?** Add multiple API Keys to the `api_keys` list in `.purrcat/.model.yaml`. The system will automatically load-balance via APIKeyManager (least-busy-first).

**4. Agent says Docker sandbox is unavailable?** Docker Desktop may not be running, or the sandbox image hasn't been built yet. Run `purrcat setup` first.

**5. Is the sandbox mechanism secure enough?** All Shell and code execution is forcibly blocked within Docker containers. Host access uses **strict whitelist** (`.purrcat/.file.yaml`); unauthorized directories are completely invisible. **Follow the principle of least privilege.**

**6. How to add multiple API keys?**
Add them to the `api_keys` list in `.purrcat/.model.yaml`. The system automatically selects the least busy key via APIKeyManager.

**7. How to configure Feishu/Lark bot?**
Edit `.purrcat/.sensor.yaml`, set `feishu.enabled` to `true`, and fill in `app_id`, `app_secret`, `chat_id`.

**8. TUI doesn't show up on startup?**
Your terminal may not support Textual. Try `purrcat start --headless` for headless mode.

**9. How to update to the latest version?**
Run `git pull` to fetch the latest code, then re-run `purrcat setup` to update the environment and sandbox image.

## 3. Architecture and Features

**1. What are the advantages compared to similar Agent frameworks?**

- **Local-First**: Pure Docker sandbox with strict whitelist permissions.
- **99%+ KV Cache Hit Rate**: `dispatch_tool()` decouples tool schemas from System Prompts, ensuring stable cache hits.
- **Atomic Harness Architecture**: Harness DAG engine uses graph/ + node/ for composing custom workflows.
- **APIKeyManager Smart Scheduling**: Auto load-balances across API keys (least-busy-first).
- **Sensor Gateway**: Unified message gateway for multi-channel communication.

**2. Is the sandbox mechanism secure enough?** All Shell execution is forcibly blocked within Docker containers. Host access uses a **strict whitelist** defined in `.purrcat/.file.yaml`; unauthorized directories are completely invisible. However, if you actively add high-risk directories to the whitelist, there is still a risk. **Follow the principle of least privilege, at your own risk.**

## 4. Security and Compliance

- **Open Source License**: This project's core framework is based on **GNU GPL-3.0**. Internal use does not require open source; any external distribution (including SaaS delivery) must fully open source derivative code and retain copyright notices. Plugins, Harness/Expert, and extensions are **not subject to GPL contagion** and can be closed-source for commercial use.

- **Absolute Disclaimer**: Code is provided "as is". The author is not responsible for data loss, API charges, sandbox escape, or legal disputes caused by misuse. Do not use it for illegal data crawling or system intrusion.