# Configuration Guide

All environment configuration files of the system are uniformly stored in the `data/config/` directory.

## 1. Tool and Plugin Configuration

- **MCP (Model Context Protocol) Configuration**： Directly modify `data/config/configs/mcp_servers.yaml` and fill in the commands and parameters of the target MCP Server.
    
- **Skill Installation**： Drag the skill folder containing `SKILL.md` into the `data/skill/` directory, and it will take effect after restart.
    
- **Native Plugin Installation**： Place your Python plugin package directory under `src/plugins/plugin_collection/`, and the system will automatically scan and parse YAML to register tools.
    

## 2. Sensor Configuration

Currently, the system has built-in support for **Feishu** robot sensing. The configuration method is as follows：

1. Go to the [Feishu Developer Backend](https://open.feishu.cn/app) to create an enterprise self-built application (robot).

2. Obtain `app_id` and `app_secret` on the application credentials page.

3. Obtain `chat_id`： Open the Feishu client, enter the chat window with the robot, click the upper right corner "Settings", and view the corresponding session ID.

4. Fill the above three credentials into the corresponding `data/config/secrets/feishu.yaml` configuration file. After restarting the system, two-way communication can be established.