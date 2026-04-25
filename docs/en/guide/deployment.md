# Deployment Guide

Welcome to PurrCat! This document will guide you through deploying and configuring the PurrCat private Agent framework locally from source code.

## 1. Prerequisites

Before you begin, ensure that the following basic dependencies are installed on your computer:

- **Miniconda or Anaconda**: Used to manage and isolate Python virtual environments.

- **Node.js**: Used to build and run the Next.js frontend application interface.

- **Docker**: Used to build and run PurrCat's exclusive local sandbox environment, ensuring the security of file operations.

## 2. Obtaining Source Code

Please clone the PurrCat source code repository to your local machine and navigate to the project root directory:

```
git clone <your repository address>
cd PurrCat
```

## 3. Environment Initialization

PurrCat provides cross-platform one-click deployment scripts designed to automatically complete sandbox image building, backend environment configuration, and frontend dependency installation.

**Recommended automatic installation method**:

- **Windows users**: Right-click on `setup.bat` in the `scripts` folder and select **"Run as administrator"**. This script will automatically resolve network retry issues and download missing dependencies.

- **macOS / Linux users**: Open the terminal and run the `scripts/setup.sh` script.

**Manual installation process breakdown** (for understanding the script's underlying principles or in case of automatic installation failure):

1. **Build Docker sandbox image**: The script executes `docker build -t my_agent_env:latest .` to create a Docker isolation environment named `my_agent_env`, with automatic switching to domestic acceleration sources to ensure build success rate.

2. **Configure Python backend**: Execute `conda env create -f environment.yml` to create a virtual environment named `PurrCat`. This environment includes Python 3.10 and core dependencies such as OpenAI SDK, Playwright, Faiss, and MCP protocol.

3. **Configure frontend dependencies**: The script automatically navigates to the `ui` directory and runs `npm install` to install React, Next.js, Tailwind CSS, and related UI component libraries.

## 4. Necessary Configuration

Before officially starting the system, you must configure the model API keys and some core system parameters. All configuration files are stored in the `data/config/` directory.

### 4.1 Model Key Configuration (`secrets/models.yaml`)

The Agent needs to call Large Language Models (LLM) and Vision Language Models (VLM) to process tasks. You need to fill in your API credentials in this file. Please open the `data/config/secrets/models.yaml` file:

- **Large Language Model (LLM)**: The default configuration identifier is `"openai:deepseek-chat"`. Find the `api_keys` node and replace the placeholder `"api-key-1"` with your actual API Key.

- **Vision Language Model (VLM)**: The default configuration identifier is `"openai:qwen3-vl-plus"`. Similarly, replace the placeholder under `api_keys` with your actual API Key.

- **Specialized Models**: If you want to enable advanced features such as image generation, audio processing, or video conversion, you can fill in the corresponding API Key and Base URL in the `specialized_models` configuration block of the same file.

Note: Currently, PurrCat only supports models that can be called via the OpenAI SDK.

### 4.2 System Basic Configuration (`configs/system.yaml`)

Open the `data/config/configs/system.yaml` file:

- **agent_model**: Used to specify the Agent's default driving model. The system default value is `"openai:deepseek-chat"`. If you modified the main model's name mapping in `models.yaml`, ensure that the value here matches it.

- **embedding_model**: Configures the text vectorization model used by the system. The default value is `"BAAI/bge-small-zh-v1.5"`.

### 4.3 MCP Server Extension Configuration (Optional)

If you need to configure Model Context Protocol (MCP) related extensions, the system has preset configuration items such as `bilibili-search`. You can add or modify execution commands and their parameters in `data/config/configs/mcp_servers.yaml`.

### 4.4 Feishu Service Extension (Optional)

If you need to chat with the Agent via Feishu (Lark), you can refer to the introduction document on the "Configuration" page to obtain the corresponding keys and fill them in the corresponding fields of `data/config/secrets/feishu.yaml`.

## 5. Starting the Service

After completing dependency installation and key configuration, you can start the entire framework:

- **Windows users**: Double-click to run `start.bat` in the `scripts` folder.

- **macOS / Linux users**: Run the `scripts/start.sh` script.

The startup script will automatically activate the `PurrCat` conda environment, start the backend service driven by `backend.py`, and simultaneously start the Next.js frontend service (`npm run dev`). After the service is successfully mounted, you can access the local address according to the prompts in the terminal. If you need to close the application, press `Ctrl+C` in the terminal to safely terminate all associated processes.