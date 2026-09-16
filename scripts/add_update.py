#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""往官网「动态」追加一条记录。

在 data/updates/ 下生成一个 JSON 文件（字段：time / link / content），
然后重建 data/updates.js 供 updates.html 和 index.html 使用。

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
import sys
from datetime import datetime
from pathlib import Path

from build_updates import TIME_FMT, UPDATES_DIR, build, load_entries


def entry_path(when):
    """按时间命名 JSON 文件，重名时追加 -2、-3 …"""
    stem = when.strftime("%Y%m%d-%H%M")
    path = UPDATES_DIR / f"{stem}.json"
    n = 2
    while path.exists():
        path = UPDATES_DIR / f"{stem}-{n}.json"
        n += 1
    return path


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
        "link": args.link.strip(),
        "content": args.content.strip(),
    }
    if not entry["content"] or not entry["link"]:
        sys.exit("内容和链接都不能为空")

    if any(u["time"] == entry["time"] and u["content"] == entry["content"]
           for u in load_entries()):
        sys.exit("已存在相同时间和内容的动态，未重复添加")

    path = entry_path(when)
    path.write_text(json.dumps(entry, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8")
    build()
    print(f"✓ 已加入动态（{entry['time']}）→ data/updates/{path.name}")
    print(f"  {entry['content']} → {entry['link']}")


if __name__ == "__main__":
    main()
