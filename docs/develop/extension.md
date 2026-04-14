# 二次开发文档

欢迎参与 CatInCup 的二次开发。本框架的设计哲学是模块化与解耦。

## 1. Skill 开发 (无代码/低代码扩展)

遵循 Anthropic 官方规范。一个 Skill 就是 `data/skill` 下的一个目录，核心是 `SKILL.md` 文件。

- **要求**：`SKILL.md` 顶部必须包含 `name` 和 `description` 元数据。

- **内容**：用自然语言详细描述该技能的工作流、约束条件，可搭配脚本一并放入文件夹。


## 2. 原生插件开发 (Plugin)

原生插件用于拓展框架的硬能力边界（Python 库级别）。 存放在 `src/plugins/plugin_collection`，必须包含三个文件：

```python
__init__.py       # 插件对外暴露的函数接口
plugin_name.py    # 插件的具体业务逻辑实现
plugin_name.yaml  # 参数与 Schema 的详细描述（格式参考现有插件）
```

_注：务必在代码中处理好第三方依赖的隔离与引入。_

## 3. Harness Engineering 开发

框架的调度大脑。核心逻辑集中在 `src/agent/agent.py` 与 `src/models/task.py`。

- 开发者可根据业务需求，直接修改任务流转逻辑。

- _预告：未来版本将接入 MoE (Mixture of Experts) 路由系统，支持更细粒度的任务分发。_


## 4. Sensor 开发 (环境感知)

Sensor 是 Agent 连接物理世界和外部应用的触角（如 RSS 订阅、外部聊天软件）。

- **实现方式**：编写 Python 脚本，开启独立后台线程持续监听外部事件。

- **数据推入**：监听到事件后，通过调用 `add_message` 函数，将外部信息异步推入 Agent 的消息队列进行处理。你可以结合 `Cron` 工具开发基于时间的定时 Sensor 触发器。


## 5. 贡献指南

- 提交 PR 时，请保证 **一个 PR 只解决一个具体问题**，避免巨型混合提交。

- 遇到 Bug 或有新 Feature 构想，请先在 GitHub 提交 Issue 讨论。