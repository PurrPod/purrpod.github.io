#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""往官网「动态」列表追加一条记录，按时间倒序合并进 data/updates.js。

用法：
    python add_update.py "动态内容" "https://example.com/link"
    python add_update.py "补录一条旧动态" "blog/xx.html" --time "2026-09-01 10:00"

参数：
    content  动态内容（必填）
    link     跳转链接（必填，站内相对路径或完整 URL）
    --time   发布时间，默认当前时间，格式 "YYYY-MM-DD HH:MM"
"""
import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parents[1] / "data" / "updates.js"
FILE_HEADER = "/* PurrCat 动态列表：由 scripts/add_update.py 维护，按时间倒序排列 */"
ARRAY_RE = re.compile(r"window\.PURRCAT_UPDATES\s*=\s*(\[.*\])\s*;", re.S)
TIME_FMT = "%Y-%m-%d %H:%M"


def load_updates():
    if not DATA_FILE.exists():
        sys.exit(f"找不到 {DATA_FILE}")
    text = DATA_FILE.read_text(encoding="utf-8")
    m = ARRAY_RE.search(text)
    if not m:
        sys.exit("解析 updates.js 失败：找不到 window.PURRCAT_UPDATES 数组")
    return json.loads(m.group(1))


def save_updates(updates):
    body = json.dumps(updates, ensure_ascii=False, indent=2)
    DATA_FILE.write_text(
        FILE_HEADER + "\nwindow.PURRCAT_UPDATES = " + body + ";\n",
        encoding="utf-8",
    )


def main():
    parser = argparse.ArgumentParser(description="往官网动态列表追加一条记录")
    parser.add_argument("content", help="动态内容")
    parser.add_argument("link", help="跳转链接（站内相对路径或完整 URL）")
    parser.add_argument("--time", default=None,
                        help='发布时间，默认当前时间，格式 "YYYY-MM-DD HH:MM"')
    args = parser.parse_args()

    if args.time:
        try:
            when = datetime.strptime(args.time, TIME_FMT)
        except ValueError:
            sys.exit(f'时间格式不对，应为 "{TIME_FMT}"，收到 "{args.time}"')
    else:
        when = datetime.now()

    entry = {
        "time": when.strftime(TIME_FMT),
        "content": args.content.strip(),
        "link": args.link.strip(),
    }
    if not entry["content"] or not entry["link"]:
        sys.exit("内容和链接都不能为空")

    updates = load_updates()
    if any(u.get("time") == entry["time"] and u.get("content") == entry["content"]
           for u in updates):
        sys.exit("已存在相同时间和内容的动态，未重复添加")

    updates.append(entry)
    updates.sort(key=lambda u: u.get("time", ""), reverse=True)
    save_updates(updates)
    print(f"✓ 已加入动态（{entry['time']}），当前共 {len(updates)} 条")
    print(f"  {entry['content']} → {entry['link']}")


if __name__ == "__main__":
    main()
