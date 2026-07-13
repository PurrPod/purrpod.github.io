# FAQ

## 1. Environment Deployment

**1. What are the prerequisites for running?** Core dependencies are: **uv** (Python package manager, install with one command), **Node.js** (provides `npx`), **Docker** (sandbox isolation).

**2. Installation slow, timeout, or failure?**

Usually a network issue. If it persists, configure domestic mirror sources in advance (uv mirror, Docker image acceleration).

**3. Must Docker be installed?**

**Must be installed**. The framework's local sandbox, Shell execution, and system-level read/write isolation all depend on Docker containers. Core functionality cannot run without Docker.

**4. Do I need Node.js?**
**Must be installed**. Node.js provides the `npx` command, which PurrCat's MCP extensions and WebUI frontend depend on.

**5. `purrcat` command not found?**
Ensure you're executing from the project root directory.

**6. Virtualization conflicts during deployment?** Docker relies on host virtualization support. Common issues:

- **Windows (WSL2 / Hyper-V)**: Docker Desktop requires hardware virtualization (VT-x / AMD-V) enabled in BIOS. Many laptops ship with it disabled, causing Docker to fail on startup.
- **VMware / VirtualBox conflicts**: Running other VM software alongside Hyper-V / WSL2 may cause blue screens or startup failures.
- **Nested Virtualization**: If PurrCat itself runs inside a VM (e.g., cloud server, Parallels), nested virtualization must be enabled, otherwise Docker containers won't start.
- **Linux**: Best native Docker support with minimal conflicts. However, non-default container runtimes (e.g., containerd) may be incompatible with the sandbox initialization script.

## 2. Operation and Usage

**1. Can tasks resume after interruption?** Yes. The framework has built-in checkpoint persistence. State is saved to disk after every round. After unexpected exits, simply restart and ask the Agent to resume — it will automatically load the checkpoint and continue.

**2. How does the Agent remember my preferences?** Built-in **lightweight memo system** (Memo tool + PurrMemo local engine). Simply tell your preferences during conversation, and the system will persist them with extremely low token consumption. You can also proactively write memories using the Memo tool.

**3. What to do if API calls are restricted?** Add multiple API Keys to the `api_keys` list in `.purrcat/model.json`. The system will automatically load-balance via APIKeyManager (least-active-first).

**4. Agent says Docker sandbox environment is restricted?** Most likely Docker Desktop is not running, or the sandbox image hasn't been built with `purrcat setup` after initial installation.

**5. Is the sandbox mechanism secure enough?** All Shell execution is forcibly blocked within Docker containers. Host access uses a **strict whitelist** defined in `.purrcat/file.json` — unauthorized directories are completely invisible. Export operations automatically trigger Git snapshots to prevent overwrite disasters. **Follow the principle of least privilege, at your own risk.**

**6. Agent times out when accessing foreign websites in the sandbox, even with VPN on?** Regular VPN/proxy tools operate at the host's network layer, but **Docker containers use their own isolated network namespace and don't automatically inherit host proxy settings**. Network requests inside the container go through Docker's virtual bridge, not through the host's VPN tunnel. The solution is to enable **TUN mode** (virtual NIC) in your proxy software, which captures container traffic as well. See your proxy software's documentation for configuration details.

## 3. Security and Compliance

**Open Source License**: This project is open-source under the **MIT License**. You are free to use it for personal learning, internal use, commercial monetization, closed-source distribution, or repackaging. The only requirement is to retain the original copyright and license notices in all copies or substantial portions of the software.

**Plugin and Extension Notes**: Any plugins or extensions developed independently based on this framework's standard interfaces (such as Sensor plugins) are not subject to any open-source contagion constraints. Developers retain full copyright and distribution autonomy over their own plugins, free to choose any open-source license or keep them completely closed-source for commercial use.

**Absolute Disclaimer**: Code is provided "as is" without any express or implied warranty. The author is not responsible for data loss, API charges, sandbox escape, or legal disputes arising from misuse. Please comply with relevant laws and regulations. Do not use this framework for illegal data crawling, system intrusion, or other malicious purposes.