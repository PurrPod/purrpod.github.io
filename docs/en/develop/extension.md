# Extension Development Guide

Welcome to participate in the secondary development of CatInCup. The design philosophy of this framework is modularity and decoupling.

## 1. Skill Development (No-Code/Low-Code Extension)

Follow Anthropic's official specifications. A Skill is a directory under `data/skill`, with the core being the `SKILL.md` file.

- **Requirements**: `SKILL.md` must include `name` and `description` metadata at the top.

- **Content**: Use natural language to detailedly describe the workflow and constraints of the skill, and you can put scripts together in the folder.


## 2. Native Plugin Development

Native plugins are used to expand the framework's hard capability boundaries (Python library level). They are stored in `src/plugins/plugin_collection` and must contain three files:

```python
__init__.py       # Plugin's exposed function interface
plugin_name.py    # Plugin's specific business logic implementation
plugin_name.yaml  # Detailed description of parameters and Schema (refer to existing plugins for format)
```

_Note: Be sure to handle third-party dependency isolation and introduction in the code._

## 3. Harness Engineering Development

For certain specific industries, you can customize your own Harness Engineering according to the industry's work characteristics.

In this framework, we provide developers with a BaseTask class, defined as a general task, providing many basic built-in functions and class attributes.

Developers can define their own Harness Engineering in the `src/models/expert/` folder, that is, give a class inheriting BaseTask, modify or use the basic built-in functions (refer to the trading task), and implement their own workflow.

The expert interface provides developers with out-of-the-box native tools and plugin ecosystem, and enjoys the framework's API polling, concurrency compatibility and other features


## 4. Sensor Development (Environmental Sensing)

Sensors are the tentacles through which the Agent connects to the physical world and external applications (such as RSS subscriptions, external chat software).

- **Implementation**: Write Python scripts, start independent background threads to continuously monitor external events.

- **Data Push**: After monitoring events, call the `add_message` function to asynchronously push external information into the Agent's message queue for processing. You can combine with `Cron` tools to develop time-based定时 Sensor triggers.


## 5. Contribution Guide

- When submitting a PR, please ensure **one PR solves one specific problem** to avoid giant mixed submissions.

- When encountering bugs or having new Feature ideas, please first submit an Issue on GitHub for discussion.