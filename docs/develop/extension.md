# 二次开发文档

欢迎参与 PurrCat 的二次开发。本框架的设计哲学是模块化与解耦，提供四层扩展机制。

## 开发路线图

```
                       难度
                        ↑
               Harness (原子化 Expert)   ← 最高
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

如果需要操作宿主机文件，请使用 Expert 的 extend_tool（见下文）。

---

## 3. Expert / Harness 开发（领域专家）

Expert 系统用于实现**复杂工作流编排**、**宿主机文件操作**或**需要敏感令牌或权限才可运行的行为**。

### 目录结构

```
src/harness/expert/your_expert/
├── task.py                # 任务定义（继承 BaseTask）
└── extend_tool/           # 扩展工具（可选）
    ├── __init__.py
    └── your_tool.py
```

### 最小实现

```python
from src.harness.task import BaseTask

class YourExpertTask(
    BaseTask,
    expert_type="your_expert",        # add_task 时的 expert 参数值
    description="你的领域专家描述",
    parameters={}
):
    def __init__(self, task_name, prompt, core):
        super().__init__(task_name, prompt, core)

    def _build_system_prompt(self):
        return """# 角色定义\n你是一个..."""
```

### 自动注册

Expert 通过 `BaseTask.__init_subclass__` **自动注册**。只需确保 `task.py` 被导入即可——`Task` 工具在调用 `add` 操作时会自动调用 `auto_discover_experts()` 扫描 `src/harness/expert/` 下的所有子类。

无需手动修改任何注册文件。

### 原子方法（BaseTask 提供）

BaseTask 提供了完整的原子模块清单，可在自定义 `run()` 中自由调用：

| 方法 | 用途 |
|------|------|
| `check_kill()` | 检测外部强杀标志位，主动中断 |
| `check_request()` | 弹出队列中的临时强制追加指令 |
| `check_tool(history)` | 清理断层 Tool Calls，返回安全 History |
| `run_llm_step(messages, tools)` | 纯粹的大模型通讯发包 |
| `track_token(response)` | 提取 Token 用量统计 |
| `_extract_tool_calling(response)` | 提取并清洗 OpenAI 格式的 tool_calls |
| `check_completed(tool_calling)` | 检测 task_done 标识判断完结 |
| `handle_completed(tool_calling)` | 完结审计 + 幻觉检测 + 资源回收 |
| `run_tool_calling(response)` | 工具解析与执行闭环（JSON 纠错 → 参数抽取 → 分发执行 → 回传入栈） |
| `check_memory()` | 监控 window_token 与历史长度，超标自动压缩 |
| `save_checkpoints()` | 即时封印类状态、Token 数据、通信历史到硬盘 |

### 可重写的钩子

| 方法 | 用途 |
|------|------|
| `_build_system_prompt()` | 定制 System Prompt |
| `get_available_tools()` | 注入领域工具 Schema（含 extend_tool） |
| `_handle_extend_tool()` | 拦截执行扩展工具 |
| `_on_save_state()` / `_on_restore_state()` | 状态持久化与恢复 |
| `run()` | 完全重写执行逻辑 |

### 典型线性任务循环

```python
def run(self):
    while not self.check_completed(...):
        self.check_kill()              # 检测强杀
        self.check_request()           # 弹出追加指令
        history = self.check_tool(history)  # 清理断层
        response = self.run_llm_step(history, tools)  # LLM 通讯
        self.track_token(response)     # 统计 Token
        tool_calling = self._extract_tool_calling(response)
        if self.check_completed(tool_calling):
            self.handle_completed(tool_calling)
            break
        history = self.run_tool_calling(response)  # 工具执行
        self.check_memory()            # 记忆压缩
        self.save_checkpoints()        # 状态持久化
```

### Extend Tool 开发

extend_tool 运行在**宿主机进程**中，可以直接读写宿主机文件系统（受 project_root 限制），适合实现与本地文件交互的工具。

参考已有的 coding extend_tool 工具集：

```
src/harness/expert/coding/extend_tool/
├── __init__.py       # 统一注册入口
├── path_utils.py     # 路径安全校验
├── file_edit.py      # search/replace 精准编辑
├── code_search.py    # glob + grep 代码搜索
├── file_read.py      # 智能文件读取
├── file_create.py    # 新建文件
├── lsp_tool.py       # 代码智能分析
└── planning.py       # 计划管理器
```

一个 extend_tool 文件的基本结构：

```python
import json

YOUR_TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "your_tool",
        "description": "工具描述",
        "parameters": {
            "type": "object",
            "properties": {
                "param": {"type": "string", "description": "参数说明"}
            },
            "required": ["param"]
        }
    }
}

def execute_your_tool(arguments: dict, task=None) -> str:
    param = arguments.get("param", "")
    result = f"处理结果: {param}"
    return json.dumps({"type": "text", "content": result})
```

在 `extend_tool/__init__.py` 中注册：

```python
from .your_tool import YOUR_TOOL_SCHEMA, execute_your_tool

# 加入 Schema 列表
EXTEND_TOOLS_SCHEMA = [..., YOUR_TOOL_SCHEMA]

# 加入执行函数映射
EXTEND_TOOL_FUNCTIONS = {
    ..., 
    "your_tool": execute_your_tool,
}
```

然后在 Expert 的 `task.py` 中重写 `_handle_extend_tool` 指向统一入口：

```python
from src.harness.expert.your_expert.extend_tool import (
    handle_extend_tool, get_extend_tools_schema
)

class YourExpertTask(BaseTask, expert_type=..., ...):
    def get_base_tool_schema(self) -> list:
        base_schemas = super().get_base_tool_schema()
        return base_schemas + get_extend_tools_schema()

    def _handle_extend_tool(self, tool_name: str, arguments: dict) -> str:
        success, result = handle_extend_tool(tool_name, arguments, self)
        if success:
            return result
        return super()._handle_extend_tool(tool_name, arguments)
```

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
