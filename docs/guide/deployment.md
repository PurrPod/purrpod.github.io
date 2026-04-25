# 从源码开始

欢迎使用 PurrCat！本篇文档将引导您从零开始，通过源代码在本地部署并配置 PurrCat 私人 Agent 框架。

## 1. 准备工作

在开始之前，请确保您的计算机上已安装以下基础依赖：

- **Miniconda 或 Anaconda**：用于管理和隔离 Python 虚拟环境（确保已添加进系统变量里，否则后续一键安装/一键启动脚本可能会出现找不到 conda 命令的错误）

- **Node.js**：用于构建和运行 Next.js 前端应用界面。

- **Docker**：用于构建和运行 PurrCat 专属的本地沙盒环境，保障文件操作的安全性。

## 2. 获取源代码

请先将 PurrCat 的源代码仓库克隆到您的本地机器，并进入项目根目录：

```
git clone https://github.com/PurrPod/purrcat.git
cd purrcat
```

或者，直接在本网页下载压缩包（见导航栏）并正确解压和重命名。

## 3. 环境初始化

PurrCat 提供了跨平台的一键部署脚本，旨在自动完成沙盒镜像构建、后端环境配置和前端依赖安装。

**推荐的自动安装方式**：

- **Windows 用户**：右键点击 `scripts` 文件夹下的 `setup.bat`，选择"以管理员身份运行"。该脚本会自动解决网络重试问题并下载缺失环境。

- **macOS / Linux 用户**：打开终端，运行 `scripts/setup.sh` 脚本。

**手动安装过程解析**（仅供了解脚本后台原理或在自动安装失败时参考）：

1. **构建 Docker 沙盒镜像**：脚本会执行 `docker build -t my_agent_env:latest .` 命令来创建名为 `my_agent_env` 的 Docker 隔离环境，并支持自动切换国内加速源以保证构建成功率。

2. **配置 Python 后端**：通过 `conda env create -f environment.yml` 创建一个名为 `PurrCat` 的虚拟环境。该环境内置了 Python 3.10，并安装了 OpenAI SDK、Playwright、Faiss 及 MCP 协议等核心依赖。

3. **配置前端依赖**：脚本会自动进入 `ui` 目录，并运行 `npm install` 来安装 React、Next.js、Tailwind CSS 及相关 UI 组件库。

## 4. 必要配置

在正式启动系统之前，必须配置模型 API 密钥以及部分核心系统参数。所有配置文件均存放在 `data/config/` 目录下。

### 4.1 模型密钥配置 (`secrets/models.yaml`)

Agent 需要调用大语言模型（LLM）来处理任务。您需要在这个文件中填入您的 API 凭据。请打开 `data/config/secrets/models.yaml` 文件：

- **大语言模型 (LLM)**：默认配置标识为 `"openai:deepseek-chat"`。请找到 `api_keys` 节点，将 `"api-key-1"` 等占位符替换为您申请的真实 API Key。

- **扩展专用模型 (可选)**：如果您希望启用图像生成、音频处理或视频转换等高级功能，可在同一文件的 `specialized_models` 配置块中填入对应的 API Key 和 Base URL。

注意：

- 目前 PurrCat 仅支持可通过 OpenAI SDK 调用的模型。
- 请确保至少配置了一个模型（包含名称、 至少一个API Key 、base url）

### 4.2 系统基本配置 (`configs/system.yaml`)

打开 `data/config/configs/system.yaml` 文件：

- **agent_model**：用于指定 Agent 默认驱动模型。系统默认值为 `"openai:deepseek-chat"`。如果您在 `models.yaml` 中修改了主模型的名称映射，请确保此处的值与之匹配。

- **embedding_model**：配置系统使用的文本向量化模型。默认值为 `"BAAI/bge-small-zh-v1.5"`。

### 4.3 MCP 服务器扩展配置（可选）

如果您需要配置 Model Context Protocol (MCP) 相关扩展，系统已预设了例如 `bilibili-search` 的配置项。您可以在 `data/config/configs/mcp_servers.yaml` 中添加或修改执行命令及其参数。

### 4.4 飞书服务扩展（可选）

如果您需要通过飞书与 Agent 对话，可以参考"配置"页的介绍文档获取对应的密钥，填写在 `data/config/secrets/feishu.yaml` 对应字段里。

## 5. 启动服务

完成依赖安装和密钥配置后，即可启动整个框架：

- **Windows 用户**：双击运行 `scripts` 文件夹下的 `start.bat`。

- **macOS / Linux 用户**：运行 `scripts/start.sh` 脚本。

当然，你也可以开启两个终端（进入项目根目录），分别运行：

```
# 第一个终端
python backend.py

# 第二个终端
cd ui
npm run dev
```

启动脚本在运行时会自动激活 `PurrCat` 的 conda 环境，启动由 `backend.py` 驱动的后台服务，并同时启动 Next.js 的前端服务 (`npm run dev`)。服务成功挂载后，您可以根据终端中的提示用浏览器访问本地地址（默认为 `localhost:3000`，具体以实际为准）。如果您需要关闭应用，在终端按下 `Ctrl+C` 即可安全终止所有关联进程。在程序运行过程中，请确保后端和前端终端窗口保持运行！