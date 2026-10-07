#!/usr/bin/env python3
"""Final Sergeant SP5.1 qualification gate.

Run from a clean checkout of Liam-Son/BTD-commando pinned to the baseline commit.
This script does NOT commit, push, merge, deploy, or touch broker configuration.

It:
1. creates a local rollback snapshot of the tracked Sergeant files;
2. invokes the SP4 transactional installer (which runs npm test + npm run build);
3. additionally runs strict TypeScript and git diff checks;
4. writes SP5_1_QUALIFICATION_REPORT.json;
5. leaves the qualified changes uncommitted for review.

If the SP4 installer fails, its own rollback runs. If a later SP5 gate fails,
this script invokes rollback_sergeant_sp5_1.py.
"""
from __future__ import annotations
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone

BASELINE = "c0c0a9799770a4f33440193379c833608c351b61"
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


def run(args, cwd: Path, check=False):
    return subprocess.run(args, cwd=cwd, text=True, capture_output=True, check=check)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python qualify_sergeant_sp5.py /path/to/BTD-commando", file=sys.stderr)
        return 2
    repo = Path(sys.argv[1]).resolve()
    bundle = Path(__file__).resolve().parents[1]
    report = {
        "baselineExpected": BASELINE,
        "startedAt": datetime.now(timezone.utc).isoformat(),
        "qualified": False,
        "checks": [],
    }
    report_path = repo / "SP5_1_QUALIFICATION_REPORT.json"

    try:
        if not (repo / ".git").exists():
            raise RuntimeError("target is not a git checkout")
        head = run(["git", "rev-parse", "HEAD"], repo, True).stdout.strip()
        report["baselineObserved"] = head
        if head != BASELINE:
            raise RuntimeError(f"source drift: expected {BASELINE}, found {head}")
        if run(["git", "status", "--porcelain"], repo, True).stdout.strip():
            raise RuntimeError("worktree is not clean")
        report["checks"].append("clean pinned baseline")

        rollback = repo / ".sergeant-sp5-rollback"
        if rollback.exists():
            raise RuntimeError(f"rollback directory already exists: {rollback}")
        rollback.mkdir()
        backup_manifest = {}
        for rel in TRACKED:
            src = repo / rel
            if not src.exists():
                raise RuntimeError(f"missing baseline file: {rel}")
            dst = rollback / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            backup_manifest[rel] = sha256(src)
        (rollback / "manifest.json").write_text(json.dumps({"baseline": head, "sha256": backup_manifest}, indent=2), encoding="utf-8")
        report["checks"].append("rollback snapshot created")

        installer = bundle / "integration" / "apply_sergeant_sp4.py"
        applied = run([sys.executable, str(installer), str(repo)], repo)
        (repo / "SP5_1_SP4_INSTALL.log").write_text(applied.stdout + applied.stderr, encoding="utf-8")
        if applied.returncode != 0:
            raise RuntimeError("SP4 transactional installer failed; see SP5_1_SP4_INSTALL.log")
        report["checks"].append("SP4 installer: npm test + npm run build passed")

        tsc = repo / "node_modules" / ".bin" / ("tsc.cmd" if sys.platform.startswith("win") else "tsc")
        if not tsc.exists():
            raise RuntimeError("local TypeScript binary missing after build qualification")
        tc = run([str(tsc), "--noEmit", "--pretty", "false"], repo)
        (repo / "SP5_1_TYPESCRIPT.log").write_text(tc.stdout + tc.stderr, encoding="utf-8")
        if tc.returncode != 0:
            raise RuntimeError("strict project TypeScript check failed; see SP5_1_TYPESCRIPT.log")
        report["checks"].append("project TypeScript check passed")

        verify = run([sys.executable, str(bundle / "integration" / "verify_sergeant_sp4.py"), str(repo)], repo)
        (repo / "SP5_1_STATIC_VERIFY.log").write_text(verify.stdout + verify.stderr, encoding="utf-8")
        if verify.returncode != 0:
            raise RuntimeError("SP4 invariant verifier failed")
        report["checks"].append("Sergeant invariant verifier passed")

        dc = run(["git", "diff", "--check"], repo)
        (repo / "SP5_1_DIFF_CHECK.log").write_text(dc.stdout + dc.stderr, encoding="utf-8")
        if dc.returncode != 0:
            raise RuntimeError("git diff --check failed")
        report["checks"].append("git diff --check passed")

        names = run(["git", "status", "--short"], repo, True).stdout.splitlines()
        report["changedFiles"] = names
        report["qualified"] = True
        report["finishedAt"] = datetime.now(timezone.utc).isoformat()
        report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        print("SP5.1 QUALIFIED. Changes remain uncommitted for review; nothing was pushed or deployed.")
        print(f"Report: {report_path}")
        return 0
    except Exception as exc:
        report["error"] = str(exc)
        report["finishedAt"] = datetime.now(timezone.utc).isoformat()
        report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        rollback_script = bundle / "integration" / "rollback_sergeant_sp5_1.py"
        rb = run([sys.executable, str(rollback_script), str(repo)], repo)
        (repo / "SP5_ROLLBACK.log").write_text(rb.stdout + rb.stderr, encoding="utf-8")
        print(f"SP5.1 QUALIFICATION FAILED: {exc}", file=sys.stderr)
        print("Rollback attempted. See SP5_1_QUALIFICATION_REPORT.json and SP5_ROLLBACK.log.", file=sys.stderr)
        return 5


if __name__ == "__main__":
    raise SystemExit(main())
