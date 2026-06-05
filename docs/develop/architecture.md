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
│   │   ├── image_generator/ # 图片生成节点（文生图/图生图）
│   │   ├── if_else_router/ # 条件路由节点（意图分流）
│   │   ├── human_intervention/ # 人工干预节点（挂起等待人类输入）
│   │   ├── llm_chat/       # 单次 LLM 调用节点
│   │   ├── log/            # 日志节点
│   │   ├── message_card_builder/ # 消息卡片构建
│   │   ├── skill_fetcher/  # 技能提取节点
│   │   ├── str_adapter/    # 字符串适配节点
│   │   ├── summary_output_loop/ # 摘要输出循环
│   │   ├── switch_router/  # 多路开关路由节点
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
│   ├── audio/              # 环境语音传感器（Whisper）
│   ├── message/feishu.py   # 飞书传感器（双向Markdown卡片）
│   ├── subscribe/rss.py    # RSS 订阅传感器
│   └── system/const.py     # 系统时钟/闹钟传感器
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

### 混合记忆与知识图谱系统 (PurrMemo)

PurrCat 的记忆系统设计参考了神经科学对记忆类型的理论模型：

- **短时工作记忆**：常驻内存的 `memo` 变量，保留最近多次 Agent 浓缩总结，跨越会话断层。
- **核心通用记忆**：`MEMORY.md` 系统级档案，固化用户画像与工作经验，会话初始化时作为 System Prompt 注入。
- **长期结构化记忆 (PurrMemo)**：
  - **情景记忆引擎**：基于 SQLite + FTS5，时间线与全文 BM25 的事件溯源。
  - **语义记忆引擎**：基于 ChromaDB（向量语义聚类）与 NetworkX（认知图谱三元组），支持关系的强化与削弱，提供 HTML 可视化图谱导出。
- **RRF 混合检索**：BM25（关键词）与 Vector（语义）进行倒数排名融合（Reciprocal Rank Fusion）。
- **异步记忆消化与艾宾浩斯遗忘**：前台认知先存入 pending，后台守护进程转化为三元组写入图谱。长时间未强化的记忆边权重自然衰减并清理。

### 传感器独立进程架构（类 MCP）

最新重构后的 Sensor 系统全面摒弃传统强耦合插件模式：

- 所有 Sensor 作为独立子进程运行，集成 uv + PEP 723 单文件内联依赖规范，拉起时自动创建虚拟环境并安装依赖。
- **物理级防崩溃**：单个 Sensor 崩溃不影响主 Agent 存活。
- **Stdio JSON-RPC 通信**：采用标准输入输出管道进行通信，零网络开销。
- **防污染护盾**：拦截重定向子进程 `sys.stdout` 到 `stderr`，仅合法 JSON 协议数据进入主程序解析器。

### 生命周期 API Key 强绑定

在 `APIKeyManager` 中实现任务/会话与单一密钥的强绑定，杜绝因负载均衡切换 API Key 导致 KV Cache 瞬间清零、命中率雪崩的致命问题。

### 两层文件系统

```
宿主机:  本地文件系统                                ← FileSystem 工具 (受白名单约束)
宿主机:  agent_vm/  ──→  沙盒: /agent_vm/           ← Bash 工具读写
```

- `Bash` 工具运行在 Docker 沙盒，只能访问 `/agent_vm/`
- `FileSystem` 工具负责宿主机文件导入/导出，受 `.purrcat/file.json` 白名单约束

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
