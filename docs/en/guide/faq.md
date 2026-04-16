# FAQ

## 1. Environment Deployment

**1. What are the prerequisites for running?** Core dependencies are: **Miniconda** (Python environment), **Node.js** (frontend UI), **Docker** (sandbox isolation).

- _Note_: Windows `setup.bat` will automatically download missing Node/Miniconda, while macOS/Linux requires manual pre-installation of basic environments.

**2. What to do if script execution has permission errors?**

- **Windows**: For first installation and subsequent startups, right-click and select **"Run as administrator"**. This is necessary for environment variable writing and Docker mounting.
- **macOS/Linux**: Execute `chmod +x scripts/setup.sh scripts/start.sh` in the terminal to grant execution permissions.

**3. Installation timeout or failure?** 

Built-in retry logic. If it continues to fail, please configure domestic mirror sources in advance (Conda Tsinghua source, npm Taobao source, Docker image acceleration), or run the script after offline installation of basic dependencies.

**4. Must Docker be installed?** 

**Must be installed**. The framework's local sandbox, Shell command execution, and system-level read-write isolation all strongly depend on Docker containers. Core functionality cannot run without Docker.

## 2. Operation and Usage

**1. Can tasks resume after interruption?** Yes. The framework has built-in breakpoint reconnection and data backup. For unexpected exits due to API blocking or system restart, simply ask the Agent to resume the task in the conversation after restarting, and it will read the backup context and continue execution.

**2. How does the Agent remember my preferences?** The framework has a built-in **lightweight memo**. Simply tell your preferences in the conversation, and the system will persist them with extremely low token consumption. You can also manually edit `src/agent/core/memory.md`.

**3. What to do if API calls are restricted?** Add multiple API Keys from different accounts for a single model in the configuration, and the system will automatically perform round-robin scheduling.

## 3. Architecture and Features

**1. What are the advantages compared to similar Agent frameworks?**

- **Local-First**: Data is completely localized, with secure local file operation capabilities.
- **Minimal & Efficient (Harness Engineering)**: Eliminates redundant prompts, router-based tool calls do not disrupt context order, ensuring stable KV Cache hits for large models, greatly reducing API consumption.
- **Secure Isolation**: Pure Docker sandbox execution environment with whitelist permissions.
- **Highly Customizable**: Minimal Python build, supports no-code extensions.
  

**2. Is the sandbox mechanism secure enough?** All Shell and code execution is forcibly blocked within Docker containers. Access to the host uses a **strict whitelist mechanism**; unauthorized directories are completely invisible. However, if you actively add high-risk directories (such as system disk root directory) to the whitelist, there is still a risk of accidental operation. **Please follow the principle of least privilege, at your own risk.**

## 4. Security and Compliance

- **Open Source License**: This project is based on **GNU GPL-3.0**. Internal use does not require open source; any external distribution (including SaaS delivery) must fully open source derivative code and retain copyright notices.

- **Absolute Disclaimer**: Code is provided "as is". The author is not responsible for data loss, API charges, or legal disputes caused by misuse. Do not use it for illegal data crawling or system intrusion.