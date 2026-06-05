# 架构介绍

## 项目结构树

PurrCat 采用极致的解耦设计，核心代码位于 `src/` 目录：

```
src/
├── agent/                  # Agent 核心大脑
│   ├── agent.py            # 主循环与对话管理
│   ├── manager.py          # 全局单例管理器
│   ├── session_store.py    # 会话存储与分支管理
│   └── system_rules/
│       └── AGENTS.md       # 系统指令层
│
├── harness/                # DAG 工作流引擎
│   ├── process.py          # 主调度引擎（异步并发，支持断点重连）
│   ├── enums.py            # 状态枚举（READY/WAITING/RUNNING/COMPLETED/ERROR）
│   ├── graph/              # DAG 图定义 (JSON)
│   │   ├── financial.json
│   │   ├── my_awesome_flow2.json
│   │   └── test_all_nodes.json
│   ├── node/               # 节点实现
│   │   ├── base.py         # BaseNode 抽象基类
│   │   ├── agent_node.py   # Agent 会话节点
│   │   └── extensions/     # 扩展节点（每个独立文件夹）
│   │       ├── agent_loop/           # LLM 循环思考
│   │       ├── appender/            # 消息追加
│   │       ├── env_loader/          # 环境变量加载
│   │       ├── file_writer/         # 文件写入
│   │       ├── html_viewer/         # HTML 预览
│   │       ├── human_intervention/  # 人工干预（挂起等待人类）
│   │       ├── if_else_router/      # 条件路由（意图分流）
│   │       ├── image_generator/     # 图片生成（文生图/图生图）
│   │       ├── json_builder/        # JSON 构建
│   │       ├── json_extractor/      # JSON 提取
│   │       ├── message_card_builder/ # 消息卡片构建
│   │       ├── switch_router/       # 多路开关路由
│   │       ├── task_input/          # 任务入口
│   │       ├── task_output/         # 任务出口
│   │       ├── template_renderer/   # 模板渲染
│   │       └── text_file_reader/    # 文本文件读取
│   └── utils/
│       ├── llm_helper.py   # LLM 调用辅助
│       └── tool_helper.py  # 工具调用辅助
│
├── memory/                 # 记忆系统
│   └── purrmemo/           # PurrMemo 本地记忆引擎
│       ├── client.py               # 记忆客户端
│       ├── visualize_graph.py      # 图谱 HTML 可视化
│       └── core/
│           ├── search_tool.py      # 混合检索（BM25+Vector RRF）
│           ├── utils.py            # 工具函数
│           ├── memory_worker/      # 记忆消化守护进程
│           └── storage/            # 存储引擎
│               ├── event_engine.py   # 情景记忆 (SQLite+FTS5)
│               ├── graph_engine.py   # 语义图谱 (NetworkX)
│               └── vector_engine.py  # 向量引擎 (ChromaDB)
│
├── model/                  # 大模型调度层
│   ├── facade/model.py     # Model 轻量级入口
│   ├── manager/
│   │   ├── key_manager.py  # APIKeyManager 智能调度（最少活跃优先）
│   │   └── concurrency.py  # 并发控制（Semaphore + 指数退避）
│   └── core/llm_client.py  # LLM 客户端
│
├── sensor/                 # 传感器感知层
│   ├── base.py             # BaseSensor 抽象基类
│   ├── gateway.py          # SensorGateway 消息网关
│   ├── manager.py          # 传感器子进程管理器（uv + PEP 723）
│   └── extension/          # 传感器实现
│       ├── feishu_bot.py       # 飞书机器人（双向 Markdown 卡片）
│       ├── rss_watcher.py      # RSS 订阅定时抓取
│       ├── system_clock.py     # 系统时钟 / 闹钟轮询
│       └── audio_assistant.py  # 环境语音监听（Whisper + TTS）
│
├── tool/                   # 工具层（八大原生工具）
│   ├── bash/               # Bash 沙盒执行
│   │   ├── bash.py
│   │   ├── docker_env.py
│   │   ├── schema.py
│   │   └── exceptions.py
│   ├── callmcp/            # MCP 动态路由调用
│   │   ├── callmcp.py
│   │   ├── schema_manager.py
│   │   ├── session_manager.py
│   │   ├── tool_caller.py
│   │   ├── schema.py
│   │   └── exceptions.py
│   ├── cron/               # 定时任务
│   │   ├── cron.py
│   │   ├── cron_operations.py
│   │   ├── schema.py
│   │   └── exceptions.py
│   ├── fetch/              # 统一获取
│   │   ├── fetch.py
│   │   ├── mcp_fetch.py
│   │   ├── skill_fetch.py
│   │   ├── web_content_fetch.py
│   │   ├── schema.py
│   │   └── exceptions.py
│   ├── filesystem/         # 文件系统
│   │   ├── filesystem.py
│   │   ├── export_file.py
│   │   ├── import_file.py
│   │   ├── list_filesystem.py
│   │   ├── read_picture.py
│   │   ├── text_ops.py
│   │   ├── utils.py
│   │   ├── schema.py
│   │   └── exceptions.py
│   ├── memo/               # 记忆交互
│   │   ├── memo.py
│   │   ├── memo_operations.py
│   │   ├── schema.py
│   │   └── exceptions.py
│   ├── search/             # 统一搜索
│   │   ├── search.py
│   │   ├── mcp_search.py
│   │   ├── skill_search.py
│   │   ├── semantic_utils.py
│   │   ├── web_search.py
│   │   ├── schema.py
│   │   └── exceptions.py
│   ├── task/               # 子任务调度
│   │   ├── task.py
│   │   ├── task_operations.py
│   │   ├── schema.py
│   │   └── exceptions.py
│   └── utils/              # 工具路由与格式化
│       ├── route.py
│       └── format.py
│
├── utils/                  # 通用工具
│   ├── config.py           # 分级配置加载
│   ├── graph_api.py        # Harness 图 API
│   ├── log_api.py          # 日志
│   ├── skill_helper.py     # 技能辅助
│   ├── task_api.py         # 任务 API
│   └── tracker.py          # 性能追踪器
│
├── server/                 # API 服务
└── tui/                    # 终端 UI
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
