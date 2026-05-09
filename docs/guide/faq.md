# 常见问题

## 一、环境部署类

**1. 运行需要哪些前置依赖？** 核心依赖为：**Miniconda**（Python 环境）、**Docker**（沙盒隔离）。**Node.js**（提供 `npx`）为可选，仅在使用 MCP 扩展时需要。


**2. 脚本执行无权限报错怎么办？**

- 

**3. 安装超时或失败？** 

自带重试逻辑，若持续失败，请提前配置国内镜像源（Conda 清华源、Docker 镜像加速），或离线安装基础依赖后再运行脚本。

**4. 必须安装 Docker 吗？** 

**必须安装**。框架的本地沙盒、Shell 命令执行、系统级读写隔离均强依赖 Docker 容器，无 Docker 无法运行核心功能。

**5. 需要安装 Node.js 吗？** 
PurrCat 本身不依赖 Node.js（界面是 Python TUI），但如果你需要使用 MCP 扩展工具（默认配置包含 Playwright、GitHub 等），宿主机需要安装 Node.js（提供 `npx` 命令）和可选的 `uv`（Python 包管理器）。

**6. Docker 镜像构建失败，提示网络错误？**
在 `purrcat setup` 的交互提示中选择阿里云镜像（选项 2），或手动配置 Docker 镜像加速器。

**7. Conda 环境创建非常慢？**
配置 Conda 清华镜像源：
```bash
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/free/
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/main/
conda config --set show_channel_urls yes
```

**8. purrcat 命令找不到？**
确保在项目根目录下执行。也可以直接使用 `purrcat setup` 和 `purrcat start`。

## 二、运行与使用类

**1. 任务中断后能断点续跑吗？** 支持。框架内置 Checkpoint 持久化机制，每轮对话状态实时落盘。意外退出后重启，只需让 Agent 恢复任务即可自动加载 Checkpoint 继续执行。

**2. Agent 如何记住我的偏好？** 框架内置**轻量级备忘录系统**（Memo 工具 + PurrMemo 本地引擎）。对话中直接告知偏好即可，系统会以极低 token 消耗将其持久化。你也可以通过 Memo 工具主动写入记忆。

**3. API 调用受限怎么办？** 在 `.purrcat/.model.yaml` 的 `api_keys` 列表中添加多个 Key，系统会通过 APIKeyManager 自动进行负载均衡（最少活跃优先）。

**4. Agent 为什么说 Docker 沙盒环境受限？** 大概率是没有启动 Docker 桌面软件，或首次安装后未运行 `purrcat setup` 构建沙盒镜像。

**5. 沙盒机制足够安全吗？** 所有 Shell 执行被强制封锁在 Docker 容器内。对主机的访问通过 `.purrcat/.file.yaml` 定义**严格的白名单机制**，未授权目录绝对不可见。**请遵循最小权限原则，后果自负。**

**6. 如何添加多个 API Key？**
在 `.purrcat/.model.yaml` 的 `api_keys` 列表中添加多个 Key，系统会自动选最空闲的 Key 使用。

**7. 如何配置飞书机器人？**
编辑 `.purrcat/.sensor.yaml`，将 `feishu.enabled` 设为 `true`，填入 `app_id`、`app_secret`、`chat_id`。

**8. 启动后看不到 TUI 界面？**
可能是终端不支持 Textual，尝试 `purrcat start --headless` 运行无界面模式。

**9. 如何更新到最新版本？**
`git pull` 拉取最新代码，然后重新运行 `purrcat setup` 更新环境和沙盒镜像。

## 三、安全与合规

* **开源协议**：本项目核心框架基于 **GNU GPL-3.0** 协议。内部使用无需开源；任何针对核心框架本身的对外分发（含 SaaS 化交付或二次打包）必须完整开源衍生代码，并保留版权声明。

* **插件/扩展豁免声明**：基于本框架标准接口（Harness DAG、Tool 模块等）独立开发的插件及扩展，**均不受 GPL-3.0 协议的传染约束**。开发者拥有完全的版权和分发自主权，可自由选择任何开源协议，亦可完全**闭源并用于商业化变现**。

* **绝对免责**：代码"按原样"提供，作者不提供任何明示或暗示的担保。因误操作导致的数据丢失、API 扣费、沙箱逃逸或违规引发的法律纠纷，作者概不负责。请自觉遵守相关法律法规，严禁将本框架用于非法数据爬取、系统入侵或其他恶意用途。
