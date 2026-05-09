---
layout: home

hero:
  name: "PurrCat"
  text: "Local-First Intelligent Agent Framework"
  tagline: "Sandbox Isolation · 99%+ Cache Hit · Atomic Construction"
  image:
    src: /logo.png
    alt: PurrCat Logo
  actions:
    - theme: alt
      text: Introduction
      link: /en/intro
    - theme: brand
      text: Get Started
      link: /en/guide/usage
    - theme: alt
      text: View on GitHub
      link: https://github.com/PurrPod/purrcat

features:
  - icon: 🛡️
    title: Local-First & Sandbox Isolation
    details: Pure Docker sandbox with strict whitelist permissions. All code execution is confined within containers; host files are accessed only on-demand, eliminating Agent runaway risks at the source.
  - icon: ⚡
    title: 99%+ KV Cache Hit Rate
    details: Proprietary router-based distribution decouples tool schemas from System Prompts, maintaining 99%+ KV Cache hit rates. Delivers extreme token economy and millisecond-level response times.
  - icon: 🧩
    title: Atomic Harness Architecture
    details: Harness DAG workflow engine defines graph topology via graph/ JSON, implements atomic nodes in node/, and schedules concurrently via process.py. Compose them freely to build custom AI workflows.
  - icon: ⚙️
    title: Smart Scheduling & Multi-Core
    details: APIKeyManager auto-balances active task loads across API keys. Background subtasks bind independent keys with persistent state machines — main session never blocks, delivering true multi-core concurrency.
