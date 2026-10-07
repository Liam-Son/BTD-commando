#!/usr/bin/env python3
"""Sergeant Local Terminal.

Paper-only advisor. Reads a local project folder and answers in the terminal.
No broker, no network, no live orders.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build"}
CODE_SUFFIXES = {".py", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".pine", ".md", ".json"}
LIVE_WORDS = (
    "place order",
    "submit order",
    "broker api",
    "api key",
    "live trading",
    "real money",
    "market order",
)


def safe_root(path: str) -> Path:
    root = Path(path).expanduser().resolve()
    if not root.exists() or not root.is_dir():
        raise SystemExit(f"Standby. Folder not found: {root}")
    return root


def scan(root: Path, limit: int = 80) -> list[str]:
    found: list[str] = []
    for path in root.rglob("*"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.is_file() and path.suffix.lower() in CODE_SUFFIXES:
            found.append(str(path.relative_to(root)))
            if len(found) >= limit:
                break
    return found


def read_snippets(root: Path, files: list[str], max_chars: int = 12000) -> str:
    chunks: list[str] = []
    used = 0
    for name in files[:12]:
        path = (root / name).resolve()
        if root not in path.parents and path != root:
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        piece = text[:1500]
        used += len(piece)
        chunks.append(f"\n## {name}\n{piece}")
        if used >= max_chars:
            break
    return "".join(chunks)


def flags(text: str) -> list[str]:
    lowered = text.lower()
    notes: list[str] = []
    if any(word in lowered for word in LIVE_WORDS):
        notes.append("Negative. I see live-order or credential language. Strip it. This terminal stays paper-only.")
    if "close" in lowered and "signal" in lowered and "next" not in lowered:
        notes.append("Hold. Check that signals use completed data and fills happen on a later bar, not the same close.")
    if "sharpe" in lowered or "cagr" in lowered:
        notes.append("Report the costs, the benchmark, and the worst drawdown next to any return number.")
    if "random" in lowered or "best" in lowered:
        notes.append("If parameters were picked after seeing results, label the run exploratory. Do not call it untouched out-of-sample.")
    return notes


def answer(question: str, folder_notes: str) -> str:
    q = question.strip()
    if not q:
        return "Report in. Ask about the code, the backtest, or the risk."
    if any(word in q.lower() for word in ("buy now", "sell now", "place order", "api key", "broker")):
        return "Negative. I do not place orders, store keys, or connect to a broker. Ask for a paper checklist instead."
    lines = ["Assessment: paper review only. No order, no broker, no return guarantee."]
    lines.extend(flags(q + "\n" + folder_notes))
    if not lines[1:]:
        lines.append("I do not see an obvious live-order request in the question. Still verify costs, data timing, and the benchmark.")
    lines.append("Next step: write the rule, the fill time, the cost, and the benchmark before you trust a result.")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Local paper-only Sergeant terminal")
    parser.add_argument("--project", required=True, help="Local project folder to review")
    args = parser.parse_args()
    root = safe_root(args.project)
    files = scan(root)
    snippets = read_snippets(root, files)
    print("Sergeant Local Terminal")
    print("Paper only. Local folder only. No broker path.")
    print(f"Folder: {root}")
    print(f"Files seen: {len(files)}")
    print("Type a question, or exit.")
    while True:
        try:
            question = input("\nYou> ")
        except (EOFError, KeyboardInterrupt):
            print("\nHold. Terminal closed.")
            return
        if question.strip().lower() in {"exit", "quit"}:
            print("Hold. Terminal closed.")
            return
        print(answer(question, snippets))


if __name__ == "__main__":
    main()
