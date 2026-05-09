# 二次开发文档

欢迎参与 PurrCat 的二次开发。本框架的设计哲学是模块化与解耦，提供四层扩展机制。

## 开发路线图

```
                       难度
                        ↑
               Harness (DAG 工作流)      ← 最高
          Sensor (感知器/网关)            ← 较高
        Tool (模块化工具)                ← 中等
   Skill (能力包) / SOUL.md (人格)       ← 低
```

---

## 1. 修改 Agent 人格（SOUL.md）

编辑 `src/agent/SOUL.md`，修改 Agent 的性格、语气和价值观。

**注意**：只改 `SOUL.md`，不要动 `src/agent/system_rules/` 目录下的系统指令文件。系统指令包含工具指南和行为规范，改了可能导致工具调用异常。

---

## 2. Skill 开发（无代码/低代码扩展）

遵循 Anthropic 官方规范。一个 Skill 就是 `skill/` 下的一个目录，核心是 `SKILL.md` 文件。

### 目录结构

```
skill/your_skill/
├── SKILL.md           # ★ 核心：技能说明文档
├── LICENSE.txt        # 可选：许可证
└── scripts/           # 可选：辅助脚本
    └── your_script.py
```

### SKILL.md 格式


```
开头必须有的两个字段：

---
name: your_skill_name
description: "触发条件描述。何时应该使用此技能？"
---


# 技能标题

## Usage

xxx

```
### Skill 的限制

Skill 的脚本通过 `Bash` 工具运行在 **Docker 沙盒**中，只能访问 `/agent_vm/` 目录下的文件，**不能直接读写宿主机文件**。

如需操作宿主机文件，请使用 FileSystem 工具（受 `.purrcat/.file.yaml` 白名单约束）。

---

## 3. Harness / 节点开发（DAG 工作流）

Harness 是 PurrCat 的 DAG 工作流引擎，通过 **配置驱动 + 原子节点** 的方式编排 AI 流程。每个节点是一个独立的 Python 模块，继承 `BaseNode` 实现 `execute` 方法。

::: tip 低代码可视化构建工作流项目即将到来
PurrCat 正在致力于构建一个可视化编排并编译为json文件的可视化平台，预计在不久后即可和大家见面，敬请期待。
:::

### 关键概念

- **`process.py`**：主调度引擎，使用 `asyncio.gather(return_exceptions=True)` 实现并发调度
- **`BaseNode`**：节点基类，所有节点继承它并实现 `async execute(inputs, force_push_msgs, context)`
- **`graph/*.json`**：DAG 图定义，描述节点间的拓扑关系和依赖
- **节点状态**：`READY → WAITING → RUNNING → COMPLETED | ERROR`，支持断点恢复
- **`yield_to_human`**：内置工具，允许 Agent 在无法完成任务时主动交还控制权
- **错误隔离**：失败的节点不影响其他独立分支，人类修复后仅重跑报错节点

### 创建新的节点

新建文件夹 `src/harness/node/your_node/`，包含两个文件：

**`node.py`**：
```python
from src.harness.node.base import BaseNode

class Node(BaseNode):
    async def execute(self, inputs, force_push_msgs, context):
        # 实现你的节点逻辑
        result = await self._process(inputs)
        return {"output": result}
```

**`your_node.json`**（描述输入输出 Schema）：
```json
{
    "inputs": {
        "input1": {"type": "str", "description": "输入描述"}
    },
    "outputs": {
        "output": {"type": "str", "description": "输出描述"}
    }
}
```

系统通过 `importlib.import_module` 动态加载节点，无需维护注册表。

---

## 4. 模块化工具开发（Tool）

每个工具是 `src/tool/` 下的独立模块，拥有自己的目录结构：

```
src/tool/your_tool/
├── __init__.py       # 模块初始化
├── your_tool.py      # 主入口函数
├── schema.py         # 工具 Schema 定义
└── exceptions.py     # 自定义异常
```

### 规范要求

1. **主入口函数**：导出一个与工具名同名的函数（如 `Bash()`、`Fetch()`），接收 `**kwargs`
2. **返回值**：必须返回 JSON 字符串，通过 `src.tool.utils.format` 格式化：
   - `text_response(data, snip)` — 成功返回
   - `warning_response(msg, snip)` — 警告返回
   - `error_response(msg, snip)` — 错误返回
3. **异常处理**：每个已知异常场景都应有明确的错误提示，引导用户/Agent 下一步操作

### 注册到系统

在 `src/tool/utils/route.py` 的 `TOOL_FUNC_MAP` 中添加映射：

```python
TOOL_FUNC_MAP = {
    ...
    "your_tool": "YourTool",  # 驼峰命名
}
```

然后在 `base_tool` 路由中 import 并注册调用即可。

---

## 5. Sensor 开发（环境感知）

Sensor 是 Agent 连接物理世界和外部应用的触角。重构后的 Sensor 体系基于 **BaseSensor 基类 + SensorGateway 网关** 架构。

### 目录结构

```
src/sensor/your_sensor/
├── __init__.py
└── your_sensor.py
```

### BaseSensor 基类

```python
from src.sensor.base import BaseSensor

class YourSensor(BaseSensor):
    config_key = "your_sensor"  # 对应配置文件中的键名

    def __init__(self, config_dict: dict):
        super().__init__(
            sensor_type="message",    # message / subscribe / system
            sensor_name="your_sensor",
            config_dict=config_dict
        )

    def _observe(self, *args, **kwargs):
        """持续从外界接收信息（需 enable）"""
        while self.is_enabled:
            data = ...  # 从外部获取数据
            if data:
                from src.sensor.gateway import get_gateway
                get_gateway().push(self, data)

    def _express(self, message, **kwargs) -> bool:
        """向该 Sensor 发送信息（需 enable）"""
        ...  # 将 message 发送到外部
        return True
```

### SensorGateway 网关

网关维护一个**消息队列**和**活跃通道集合**：

- **`push(sensor, content)`** — Sensor 调用此方法将消息推入队列，自动唤醒 Agent
  - 收到 `/unbind` 命令 → 从 active_channels 移除
  - type=message → 自动标记为活跃通道
- **`send(message)`** — Agent 回复后调用，遍历 active_channels 逐一发送

### 自动发现与注册

系统启动时 `auto_discover_and_start()` 自动扫描 `src/sensor/` 下所有 `BaseSensor` 子类：

1. 检查 `config_key` 属性
2. 读取配置文件中对应键的 `enabled` 状态
3. 若 enable，自动实例化并注册到网关，调用 `observe()`

开发者只需确保 Sensor 类定义在 `src/sensor/` 目录下，配置好 `config_key` 即可。

### 内置 Sensor 参考

| Sensor | config_key | 类型 | 功能 |
|--------|-----------|------|------|
| Feishu | feishu | message | 飞书机器人双向通讯 |
| RSS | rss | subscribe | RSS 订阅定时抓取 |
| Clock | heartbeat | system | 定时心跳 / 闹钟触发 |

---

## 6. 工具路由

工具通过 `dispatch_tool()` 统一调度四路路由：

| 路由 | 用途 | 示例 |
|------|------|------|
| base_tool | 原生工具（`src/tool/`） | Bash, Fetch, FileSystem, Search |
| agent_tool | Agent 操作 | add_task, send_message, update_memo |
| local_tool | 本地插件 | 自定义 Plugin（旧架构兼容） |
| mcp_tool | MCP 服务 | 动态加载的外部工具 |

---

## 7. 开发原则

1. **一个 PR 只解决一个问题**，避免巨型混合提交
2. **向后兼容**：修改核心代码时确保不影响已有功能
3. **路径安全**：涉及宿主机文件操作时，必须校验路径在 project_root 内
4. **提交信息用英文**
5. **异常提示人性化**：每个已知异常场景都应有明确的引导提示
