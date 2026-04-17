---
layout: home

hero:
  name: "CatInCup"
  text: "现代化的本地优先 Agent 执行框架"
  tagline: "安全隔离 · 极简大脑 · 强扩展性"
  image:
    src: /logo.png
    alt: CatInCup Logo
  actions:
    - theme: alt
      text: 介绍
      link: /intro
    - theme: brand
      text: 开始使用
      link: /guide/deployment
    - theme: alt
      text: GitHub 查看
      link: https://github.com/PurrPod/cat-in-cup

features:
  - icon: 🛡️
    title: 本地优先与沙盒隔离
    details: 纯 Docker 沙盒执行环境配合严格白名单权限，保障本地文件读写操作安全。
  - icon: ⚡
    title: 极简、经济又高效
    details: 自研 Harness Engineering 保障大模型 KV Cache 稳定命中，极大降低 Token 消耗并提高响应速度。
  - icon: 🧩
    title: 解耦与强扩展性
    details: 模块化架构设计，支持从 Skill 、原生 Plugin 到 Harness 的无缝接入。
  - icon: ⚙️
    title: 工业级稳定与多核并发
    details: 底层专为高负载场景设计，原生支持多核并发调度。无论是海量文件批处理，还是复杂的长时间任务流编排，均能提供全天候的高可用保障。

