# Quick Deployment

Welcome to PurrCat! A single command installs everything — after launch, simply complete the missing parts inside the frontend UI.

> ⚠️ **macOS / Linux** are not yet tested.

## 1. One-Line Install

Run the command for your platform:

**macOS / Linux**

```bash
curl -fsSL https://raw.githubusercontent.com/PurrPod/purrcat/main/install.sh | bash
```

**Windows (PowerShell)**

```powershell
irm https://raw.githubusercontent.com/PurrPod/purrcat/main/install.ps1 | iex
```

The script handles everything automatically — no manual dependency installation:

- Detects and auto-installs missing prerequisites (Git, uv, Node.js 18+, Docker, embedding model)
- Clones the source to `~/purrcat` and sets up the sandbox image and all dependencies
- Registers a global `purrcat` command

> ⚠️ **Windows note**: Docker Desktop requires one manual first launch to accept its agreement before the install flow can continue.
>
> The process depends on network conditions; the first sandbox image pull may take 5~15 minutes. Please be patient.

## 2. Start

```bash
purrcat desktop start    # Launch the Electron desktop app
```

## 3. Complete Setup in the Frontend

After launch, deploy the remaining missing parts (e.g. model configuration) right inside the UI — no manual file editing:

1. Open the PurrCat interface and click the **Settings** entry in the top-right corner
2. Enter your API Key in the model settings (any OpenAI SDK-compatible model works, e.g. DeepSeek); adjust the Base URL if needed
3. Save, and you are ready to go

> Config files (`~/.purrcat/`) are auto-generated with default templates on first launch, and UI changes are written back to them automatically. To reset to defaults, delete the directory and restart.

## 4. Update

```bash
purrcat desktop update    # Pull latest source & refresh dependencies
```

For other issues, see the [FAQ](./faq).
