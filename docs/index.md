---
layout: home

hero:
  name: "PurrCat"
  text: "安全、稳定、轻量、经济的本地 Agent 框架"
  tagline: "沙盒隔离 · 99%+ 缓存命中 · 原子化构建"
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
  - icon: 🛡️
    title: 本地优先与沙盒隔离
    details: 纯 Docker 沙盒执行环境配合严格白名单权限体系，所有代码执行均封锁在容器内，物理主机文件按需授权，从源头杜绝 Agent 暴走风险。
  - icon: ⚡
    title: 99%+ KV Cache 命中率
    details: 自研路由分发机制将工具 Schema 从 System Prompt 中剥离，确保大模型 KV Cache 稳定维持在 99%+ 命中率，实现极致的 Token 经济性与毫秒级响应。
  - icon: 🧩
    title: 原子化 Harness 架构
    details: Harness DAG 工作流引擎通过 graph/ 定义图拓扑、node/ 实现原子节点，process.py 后台异步并发调度，快速构建专属 AI 工作流。
  - icon: ⚙️
    title: 智能调度与多核并发
    details: APIKeyManager 自动负载均衡各 API Key 的活跃任务数；后台子任务独立绑定 Key、独立状态机落盘，主会话永不阻塞，真正实现多核级并发体验。
