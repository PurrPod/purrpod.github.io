# 架构介绍

## 项目结构树

PurrCat 采用极致的解耦设计，核心代码位于 `src/` 目录：

```
src/
├── agent/              # Agent 核心大脑
│   ├── SOUL.md         # Agent 人格定义
│   ├── agent.py        # 主循环与对话管理
│   ├── manager.py      # 全局单例管理器
│   └── system_rules/   # 系统指令层
│
├── harness/            # 任务与专家系统
│   ├── task.py         # BaseTask 基类
│   └── expert/
│       ├── coding/     # 代码专家（含 extend_tool 工具集）
│       └── trading/    # 交易专家（多角色辩论工作流）
│
├── loader/             # 数据加载层
│   ├── memory.py       # 分层对话记忆（日/月归档）
│   └── rag.py          # RAG 检索器（FAISS + BM25 + RRF）
│
├── model/              # 大模型调度层
│   └── model.py        # LLMDispatcher + Worker 线程池
│
├── plugins/            # 工具与执行层
│   ├── plugin_manager.py   # 工具调度核心（parse_tool）
│   ├── plugin_collection/  # 本地插件集合
│   └── route/              # 工具路由（base/agent/local/mcp）
│
├── sensor/             # 异步感知层
│   ├── const.py        # 时钟/闹钟传感器
│   ├── feishu.py       # 飞书 WebSocket
│   └── rss.py          # RSS 订阅
│
└── utils/
    └── config.py       # 分级配置加载

data/
├── skill/              # 技能包（SKILL.md + 脚本）
├── config/             # 配置（secrets/ + configs/）
├── memory/             # 对话记忆存储
├── database/           # RAG 知识库
└── checkpoints/        # 任务检查点
```

## 核心架构分层

```
┌─────────────────────────────────────────┐
│  Sensor 层                              │
│  飞书 / RSS / 时钟 → force_push()       │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│  Agent 层                               │
│  对话管理 / 记忆整理 / 调度              │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│  Model 层 (LLMDispatcher)               │
│  Worker 线程池 / TPM 限流 / 重试        │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│  Tool 层 (parse_tool)                   │
│  base / agent / local / mcp 四路路由    │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│  Harness 层 (BaseTask)                  │
│  CodingTask / TradingTask / 自定义专家  │
└─────────────────────────────────────────┘
```

## 关键设计决策

### 两层文件系统

```
宿主机:  project_root/    ← extend_tool / file_edit 等读写
宿主机:  agent_vm/  ──→  沙盒: /agent_vm/  ← execute_command 读写
```

- `execute_command` 运行在 Docker 沙盒，只能访问 `/agent_vm/`
- extend_tool（file_edit/code_search 等）运行在宿主机进程，可直接读写项目文件

### 工具路由

`parse_tool()` 统一调度四路路由：

| 路由 | 用途 | 示例 |
|------|------|------|
| base_tool | 基础操作 | execute_command, search_in_system |
| agent_tool | Agent 操作 | add_task, send_message, update_memo |
| local_tool | 本地插件 | filesystem, web, schedule |
| mcp_tool | MCP 服务 | 动态加载的外部工具 |

## 演进路线图

1. **核心引擎优化**：打磨 Harness Engineering，提升 KV Cache 命中率
2. **多模型与高可用**：深度适配主流开源/闭源模型
3. **多模态融合**：接入视觉/听觉等多模态大模型接口
4. **生态与记忆系统**：搭建标准化的插件/Skill/Harness 市场
