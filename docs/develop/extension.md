# 二次开发文档

欢迎参与 PurrCat 的二次开发。本框架的设计哲学是模块化与解耦，提供四层扩展机制。

## 开发路线图

```
                       难度
                        ↑
               Plugin (底层工具)     ← 最高
          Harness/Expert (领域专家)  ← 较高
        Skill (能力包)              ← 低
   SOUL.md (改人格)                 ← 最低
```

---

## 1. 修改 Agent 人格（SOUL.md）

编辑 `src/agent/SOUL.md`，修改 Agent 的性格、语气和价值观。

**注意**：只改 `SOUL.md`，不要动 `src/agent/system_rules/` 目录下的系统指令文件。系统指令包含工具指南和行为规范，改了可能导致工具调用异常。

---

## 2. Skill 开发（无代码/低代码扩展）

遵循 Anthropic 官方规范。一个 Skill 就是 `data/skill` 下的一个目录，核心是 `SKILL.md` 文件。

### 目录结构

```
data/skill/your_skill/
├── SKILL.md           # ★ 核心：技能说明文档
├── LICENSE.txt        # 可选：许可证
└── scripts/           # 可选：辅助脚本
    └── your_script.py
```

### SKILL.md 格式

```markdown
---
name: your_skill
description: "触发条件描述。何时应该使用此技能？"
---

# 技能标题

## Usage

```bash
command_to_run
```
```

### Skill 的限制

Skill 的脚本通过 `execute_command` 运行在 **Docker 沙盒**中，只能访问 `/agent_vm/` 目录下的文件，**不能直接读写宿主机文件**。

如果需要操作宿主机文件，请使用 Expert 的 extend_tool（见下文）。

---

## 3. Expert / Harness 开发（领域专家）

Expert 系统用于实现**复杂工作流编排**和**宿主机文件操作**。

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

### 可重写的钩子

| 方法 | 用途 |
|------|------|
| `_build_system_prompt()` | 定制 System Prompt |
| `get_available_tools()` | 注入领域工具 Schema |
| `_handle_expert_tool()` | 拦截执行扩展工具 |
| `_on_save_state()` / `_on_restore_state()` | 状态持久化与恢复 |
| `run()` | 完全重写执行逻辑 |

### Extend Tool 开发

extend_tool 运行在**宿主机进程**中，可以直接读写宿主机文件系统（受 project_root 限制），适合实现与本地文件交互的工具。

参考已有的 coding extend_tool 工具集：

```
src/harness/expert/coding/extend_tool/
├── __init__.py       # 统一注册入口
├── path_utils.py     # 路径安全校验
├── file_edit.py     # search/replace 精准编辑
├── code_search.py   # glob + grep 代码搜索
├── file_read.py     # 智能文件读取
├── lsp_tool.py      # 代码智能分析
└── planning.py      # 计划管理器
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

### 注册到系统

Expert 通过 `BaseTask.__init_subclass__` **自动注册**，但需要确保被 import。

在 `src/plugins/route/agent_tool.py` 中加入：

```python
from src.harness.expert.your_expert.task import YourExpertTask
```

### 完整示例：CodeReviewTask

参见 `data/skill/self_improve/SKILL.md` 中的完整代码示例。

---

## 4. 原生插件开发（Plugin）

原生插件用于拓展框架的硬能力边界（Python 库级别）。存放在 `src/plugins/plugin_collection`，必须包含三个文件：

```
__init__.py       # 插件对外暴露的函数接口
plugin_name.py    # 插件的具体业务逻辑实现
plugin_name.yaml  # 参数与 Schema 的详细描述
```

### 插件示例

```python
# src/plugins/plugin_collection/weather/__init__.py
import requests

def get_weather(city: str) -> str:
    resp = requests.get(f"https://wttr.in/{city}?format=%C+%t")
    return f"{city} 天气：{resp.text}"
```

```yaml
# src/plugins/plugin_collection/weather/weather.yaml
tools:
  - name: get_weather
    description: "查询城市天气"
    parameters:
      type: object
      properties:
        city:
          type: string
          description: "城市名"
      required: ["city"]
```

---

## 5. Sensor 开发（环境感知）

Sensor 是 Agent 连接物理世界和外部应用的触角（如 RSS 订阅、外部聊天软件）。

- **实现方式**：编写 Python 脚本，开启独立后台线程持续监听外部事件
- **数据推入**：通过 `get_agent().force_push(content, type)` 推入 Agent 消息队列
- **注册**：在 `tui/app.py` 的 `on_mount()` 中调用启动函数

---

## 6. 开发原则

1. **一个 PR 只解决一个问题**，避免巨型混合提交
2. **向后兼容**：修改核心代码时确保不影响已有功能
3. **路径安全**：涉及宿主机文件操作时，必须校验路径在 project_root 内
4. **提交信息用英文**
