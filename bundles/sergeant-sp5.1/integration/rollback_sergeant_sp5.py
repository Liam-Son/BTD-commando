#!/usr/bin/env python3
"""Rollback Sergeant SP5 working-tree changes to the pinned HEAD.

No remote actions. No broker actions. It restores only the Sergeant files introduced
or modified by SP1-SP4 and removes generated qualification artifacts.
"""
from pathlib import Path
import shutil
import subprocess
import sys

TRACKED = [
    "src/routes/sergeant.tsx",
    "src/components/btd/SergeantAdvisor.tsx",
    "src/routes/api.sergeant-chat.ts",
    "src/lib/sergeant-chat/corporal_engine.ts",
    "src/lib/sergeant-chat/dual_rank_router_core.ts",
]
ADDED = [
    "src/lib/sergeant-risk.ts",
    "src/lib/sergeant-risk.test.ts",
    "src/lib/sergeant-chat/desk_context.ts",
    "src/lib/sergeant-chat/desk_context.test.ts",
    "src/lib/sergeant-chat/sergeant_sp4.test.ts",
    "src/components/btd/SergeantRiskBrief.tsx",
    "docs/SERGEANT_SP1.md",
    "docs/SERGEANT_SP2.md",
    "docs/SERGEANT_SP3.md",
    "docs/SERGEANT_SP4.md",
]
GENERATED = [
    "sergeant-sp4-npm-test.log", "sergeant-sp4-build.log", "sergeant-sp4-report.json",
    "sergeant-sp4-failed-report.json", "SP5_SP4_INSTALL.log", "SP5_TYPESCRIPT.log",
    "SP5_STATIC_VERIFY.log", "SP5_DIFF_CHECK.log", "SP5_QUALIFICATION_REPORT.json",
]


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python rollback_sergeant_sp5.py /path/to/BTD-commando", file=sys.stderr)
        return 2
    repo = Path(sys.argv[1]).resolve()
    if not (repo / ".git").exists():
        print("ERROR: not a git checkout", file=sys.stderr)
        return 2

    # Git is the authoritative rollback source for files that existed at HEAD.
    p = subprocess.run(["git", "restore", "--source=HEAD", "--worktree", "--staged", "--", *TRACKED], cwd=repo, text=True, capture_output=True)
    if p.returncode != 0:
        print(p.stdout + p.stderr, file=sys.stderr)
        return 3

    for rel in ADDED:
        path = repo / rel
        if path.exists():
            path.unlink()
    for rel in TRACKED:
        path = repo / rel
        for suffix in (".sp2.bak", ".sp3.bak"):
            bak = path.with_suffix(path.suffix + suffix)
            if bak.exists():
                bak.unlink()
    for rel in GENERATED:
        pth = repo / rel
        if pth.exists():
            pth.unlink()
    rb = repo / ".sergeant-sp5-rollback"
    if rb.exists():
        shutil.rmtree(rb)
    print("Sergeant SP5 working-tree changes rolled back to HEAD.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
