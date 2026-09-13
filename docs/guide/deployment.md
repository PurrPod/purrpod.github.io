# 快速部署

欢迎使用 PurrCat！只需一条命令即可完成安装，启动后到前端界面内部署缺失的部分即可使用。

> ⚠️ **macOS / Linux** 环境暂未经过测试。

## 1. 一键安装

在终端执行对应系统的命令：

**macOS / Linux**

```bash
curl -fsSL https://raw.githubusercontent.com/PurrPod/purrcat/main/install.sh | bash
```

**Windows（PowerShell）**

```powershell
irm https://raw.githubusercontent.com/PurrPod/purrcat/main/install.ps1 | iex
```

脚本会自动完成全部准备工作，无需手动安装任何依赖：

- 检测并自动安装缺失的前置依赖（Git、uv、Node.js 18+、Docker、Embedding 模型）
- 克隆源码到 `~/purrcat` 并完成沙盒镜像与全部依赖的安装
- 注册全局 `purrcat` 命令

> ⚠️ **Windows 注意**：Docker Desktop 首次安装后需要手动启动一次以接受用户协议，之后安装流程才能继续。
>
> 整个流程取决于网络状况，首次拉取沙盒镜像可能需要 5~15 分钟，请耐心等待。

## 2. 启动

```bash
purrcat desktop start    # 启动 Electron 桌面端
```

## 3. 在前端补全配置

启动后，剩余缺失的部分（如模型配置）直接在界面内完成部署即可，无需手动编辑文件：

1. 打开 PurrCat 界面，点击右上角的**设置**入口
2. 在模型配置中填写 API Key（兼容 OpenAI SDK 的模型均可，如 DeepSeek），必要时修改 Base URL
3. 保存后即可开始使用

> 配置文件（`~/.purrcat/`）会在首次启动时自动生成默认模板，UI 中的修改会自动写回对应文件。如需重置为默认配置，删除该目录后重启即可。

## 4. 更新

```bash
purrcat desktop update    # 拉取最新源码并刷新依赖
```

如需了解 `main` / `task` / `vision` 等模型字段的详细含义、多 API Key 负载均衡等高级配置，请参见[配置指南](./configuration)；遇到其他问题请参见[常见问题](./faq)。
