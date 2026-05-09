# 架构介绍

## 项目结构树

PurrCat 采用极致的解耦设计，核心代码位于 `src/` 目录：

```
src/
├── agent/                  # Agent 核心大脑
│   ├── agent.py            # 主循环与对话管理
│   ├── manager.py          # 全局单例管理器
│   ├── core/               # Agent 内核定义
│   │   ├── HARNESS.md      # 系统心跳 Harness
│   │   ├── MEMORY.md       # 记忆系统指南
│   │   └── SOUL.md         # Agent 人格定义
│   └── system_rules/       # 系统指令层
│
├── harness/                # DAG 工作流引擎
│   ├── process.py          # 主调度引擎（异步并发）
│   ├── enums.py            # 状态枚举（READY/WAITING/RUNNING/ERROR/COMPLETED）
│   ├── graph/              # DAG 图定义 (JSON)
│   │   └── default.json
│   ├── node/               # 节点实现（模块化，每个节点独立文件夹）
│   │   ├── base.py         # BaseNode 抽象基类
│   │   ├── appender/       # 消息追加节点
│   │   ├── file_input/     # 文件输入节点
│   │   ├── file_output_loop/ # LLM 循环思考节点
│   │   ├── flusher/        # 记忆压缩节点
│   │   ├── llm_chat/       # 单次 LLM 调用节点
│   │   ├── log/            # 日志节点
│   │   ├── message_card_builder/ # 消息卡片构建
│   │   ├── skill_fetcher/  # 技能提取节点
│   │   ├── str_adapter/    # 字符串适配节点
│   │   ├── summary_output_loop/ # 摘要输出循环
│   │   ├── task_input/     # 任务入口节点
│   │   ├── task_output/    # 任务出口节点
│   │   ├── tool_executor/  # 工具执行节点
│   │   ├── tool_kit/       # 工具包装配节点
│   │   └── truncker/       # 截断节点
│   ├── tools/              # 内置工具
│   │   └── core/
│   │       ├── task_done/      # 完成任务
│   │       └── yield_to_human/ # 交还控制权给人类
│   └── utils/              # 辅助函数
│
├── model/                  # 大模型调度层
│   ├── facade/model.py     # Model 轻量级入口
│   ├── manager/
│   │   ├── key_manager.py  # APIKeyManager 智能调度
│   │   └── concurrency.py  # 并发控制
│   └── core/llm_client.py  # LLM 客户端
│
├── sensor/                 # 传感器感知层（网关架构）
│   ├── base.py             # BaseSensor 抽象基类
│   ├── gateway.py          # SensorGateway 消息网关
│   ├── message/feishu.py   # 飞书传感器
│   ├── subscribe/rss.py    # RSS 订阅传感器
│   └── system/const.py     # 时钟/闹钟传感器
│
├── memory/                 # 记忆系统
│   └── purrmemo/           # 本地记忆引擎
│
├── tool/                   # 工具层（模块化）
│   ├── bash/               # Bash 沙盒执行
│   ├── callmcp/            # MCP 调用（全 Schema 缓存）
│   ├── cron/               # 定时任务
│   ├── fetch/              # 统一获取
│   ├── filesystem/         # 文件系统
│   ├── memo/               # 记忆工具
│   ├── search/             # 统一搜索
│   ├── task/               # 任务调度
│   └── utils/              # 工具路由与格式化
│
└── utils/
    ├── config.py           # 分级配置加载
    └── enums.py            # 枚举定义
```

## 核心架构分层

```
┌─────────────────────────────────────────┐
│  Sensor 层 (网关架构)                     │
│  Feishu / RSS / Clock                   │
│    → observe() → Gateway.push()         │
└─────────────────────────────────────────┘
                   
┌─────────────────────────────────────────┐
│  Agent 层                               │
│  对话管理 / force_push / 记忆整理          │
│  Gateway.send() ← 回复                  │
└─────────────────────────────────────────┘
                   
┌─────────────────────────────────────────┐
│  Model 层 (APIKeyManager)               │
│  Model.chat() → LLMClient               │
│  智能分配最闲 Key / 按前缀恢复              │
└─────────────────────────────────────────┘
                  
┌─────────────────────────────────────────┐
│  Tool 层 (动态加载)                       │
│  dispatch_tool() 动态 import 模块        │
│  Bash / Fetch / FileSystem / Search     │
│  Memo / CallMCP / Cron / Task           │
│  统一异常链路 + 超长截断落盘                │
└─────────────────────────────────────────┘
                  
┌─────────────────────────────────────────┐
│  Harness 层 (DAG 工作流引擎)              │
│  process.py 后台异步并发调度                  │
│  graph/ + node/ 原子节点编排              │
└─────────────────────────────────────────┘
```

## 关键设计决策

### 两层文件系统

```
宿主机:  本地文件系统                                ← FileSystem 工具 (受白名单约束)
宿主机:  agent_vm/  ──→  沙盒: /agent_vm/           ← Bash 工具读写
```

- `Bash` 工具运行在 Docker 沙盒，只能访问 `/agent_vm/`
- `FileSystem` 工具负责宿主机文件导入/导出，受 `.purrcat/.file.yaml` 白名单约束

### 工具路由

`dispatch_tool()` 作为核心路由枢纽，根据工具名称**动态 import** `src.tool.{name}.{name}` 模块并执行对应函数。通过 `TOOL_FUNC_MAP` 映射工具名到函数名：

```python
TOOL_FUNC_MAP = {
    "filesystem": "FileSystem",
    "bash": "Bash",
    "cron": "Cron",
    "callmcp": "CallMCP",
    "memo": "Memo",
    "search": "Search",
    "fetch": "Fetch",
    "task": "Task"
}
```

八大原生工具：

| 工具 | 说明 |
|------|------|
| Bash | Docker 沙盒内命令行执行 |
| FileSystem | 宿主机文件导入/导出/目录浏览 |
| Fetch | 获取技能/MCP/网页/Harness/TODO 内容 |
| Search | 互联网搜索或本地技能/MCP 搜索 |
| Cron | 定时闹钟管理 |
| Memo | 长期记忆写入与检索 |
| CallMCP | 调度 MCP 外部工具 |
| Task | 子任务创建/终止/列表 |

MCP 工具通过 `CallMCP` 统一入口调度，不参与原生工具路由。

## 演进路线图

1. **多模型支持**：深度适配主流开源/闭源模型，增加模型厂商 API 映射层
2. **多模态融合**：接入视觉/听觉等多模态大模型接口
3. **Skill 生态市场**：搭建标准化的插件/Skill/Harness 市场
4. **记忆系统进化**：研发更加先进且适合个人场景的记忆系统
