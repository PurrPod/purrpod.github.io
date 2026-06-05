---
layout: home

hero:
  name: "PurrCat"
  text: "安全、稳定、经济的本地 Agent 框架"
  tagline: "混合记忆 · DAG 工作流 · 99%+ KV Cache 命中 · 无代码拓展"
  image:
    src: /purrcat-logo.svg
    alt: PurrCat Logo
  actions:
    - theme: alt
      text: 介绍
      link: /intro
    - theme: brand
      text: 开始使用
      link: /guide/deployment
    - theme: alt
      text: GitHub 查看
      link: https://github.com/PurrPod/purrcat

features:
  - icon: 🧠
    title: 混合记忆与知识图谱
    details: 短时工作记忆 + 长期结构化记忆（PurrMemo），情景记忆引擎（SQLite+FTS5）与语义记忆引擎（ChromaDB+NetworkX）协同，RRF 混合检索 + 艾宾浩斯遗忘机制。
  - icon: ⚙️
    title: Harness DAG 可编排工作流
    details: 有向无环图引擎，JSON 热插拔部署，多态节点矩阵（条件路由、图片生成、人工干预），状态机安全回滚，断点重连。
  - icon: 🛡️
    title: 沙盒隔离与全能工具链
    details: Docker 沙盒隔离执行，八大原生工具（Bash/FileSystem/Fetch/Search/Memo/CallMCP/Cron/Task），富文本降维阅读，文件操作安全审计。
  - icon: ⚡
    title: 99%+ KV Cache 命中率
    details: 自研动态路由将工具 Schema 从 System Prompt 剥离，生命周期 API Key 强绑定，记忆摘要经济学，实现极致 Token 经济性与毫秒级响应。
  - icon: 🌐
    title: 主动感知与事件网关
    details: 类 MCP 独立进程传感器架构，Stdio JSON-RPC 通信，防崩溃隔离，即插即用安装。内置飞书、RSS、语音、系统时钟四大传感器。
  - icon: 🧩
    title: 无代码拓展生态
    details: 零代码接入 MCP 工具、一键装载 Skill、可视化 DAG 编排、传感器配置即安装。动态路由 + 微内核设计，无需修改主程序一行代码。
  - icon: 🔄
    title: 会话分支与智能中枢
    details: Git 式会话分支管理，智能上下文截断，SOUL.md 人格注入，Heartbeat + SOLO + TODO 自主巡查，异常悬空节点自动修复。
  - icon: 🚀
    title: 高并发模型调度
    details: API Key 负载均衡，Semaphore 信号量排队，带 Jitter 的指数退避重试，8 次退避保障工业级高可用，多 Agent 并发无阻塞。

