#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 data/updates/ 下的动态 JSON 重建 data/updates.js。

每条动态一个 JSON 文件，字段：
    time    "YYYY-MM-DD HH:MM"（排序键，倒序输出）
    link    跳转链接（站内相对路径或完整 URL）
    content 动态内容

输出的 data/updates.js 定义 window.PURRCAT_UPDATES，
供 updates.html（动态页）和 index.html（首页最新动态）渲染。
"""
import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UPDATES_DIR = ROOT / "data" / "updates"
DATA_FILE = ROOT / "data" / "updates.js"
TIME_FMT = "%Y-%m-%d %H:%M"
FILE_HEADER = "/* PurrCat 动态列表：由 scripts/build_updates.py 从 data/updates/*.json 生成，请勿手改 */"


def load_entries():
    """读取全部动态 JSON，校验字段并按时间倒序返回。"""
    entries = []
    for fp in sorted(UPDATES_DIR.glob("*.json")):
        try:
            raw = json.loads(fp.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            sys.exit(f"{fp.name} 不是合法 JSON：{e}")
        entry = {
            "time": str(raw.get("time", "")).strip(),
            "link": str(raw.get("link", "")).strip(),
            "content": str(raw.get("content", "")).strip(),
        }
        if not entry["time"] or not entry["content"]:
            sys.exit(f"{fp.name} 缺少 time 或 content 字段")
        try:
            datetime.strptime(entry["time"], TIME_FMT)
        except ValueError:
            sys.exit(f'{fp.name} 的 time 格式应为 "{TIME_FMT}"，收到 "{entry["time"]}"')
        entries.append(entry)
    entries.sort(key=lambda e: e["time"], reverse=True)
    return entries


def build():
    """把 data/updates/*.json 重建为 data/updates.js。"""
    entries = load_entries()
    if not entries:
        sys.exit(f"data/updates/ 里没有任何动态 JSON：{UPDATES_DIR}")
    body = json.dumps(entries, ensure_ascii=False, indent=2)
    DATA_FILE.write_text(
        FILE_HEADER + "\nwindow.PURRCAT_UPDATES = " + body + ";\n",
        encoding="utf-8",
    )
    print(f"✓ 已重建 data/updates.js，共 {len(entries)} 条动态")


if __name__ == "__main__":
    build()
