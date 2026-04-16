# 配置说明

系统的所有环境配置文件均统一存放在 `data/config/` 目录下。

## 1. 工具与插件配置

- **MCP (Model Context Protocol) 配置**： 直接修改 `data/config/configs/mcp_servers.yaml`，填入目标 MCP Server 的命令和参数。
    
- **Skill 技能安装**： 将包含 `SKILL.md` 的技能文件夹完整拖入 `data/skill/` 目录，重启生效。
    
- **原生 Plugin 安装**： 将你的 Python 插件包目录放置到 `src/plugins/plugin_collection/` 下，系统会自动扫描解析 YAML 并注册工具。

- **外部 Harness Engineering 接入**：参考对应 README.md 操作即可。
    

## 2. Sensor (传感器) 配置

目前系统内置支持 **飞书 (Feishu)** 机器人感知，配置方式如下：

1. 前往 [飞书开发者后台](https://open.feishu.cn/app) 创建一个企业自建应用（机器人）。

2. 在应用凭证页面获取 `app_id` 和 `app_secret`。

3. 获取 `chat_id`：打开飞书客户端，进入你与机器人的聊天框，点击右上角“设置”，查看对应的会话 ID。

4. 将上述三个凭证填入对应的 `data/config/secrets/feishu.yaml` 配置文件中。重启系统后即可打通双向通讯。