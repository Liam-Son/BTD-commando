#!/usr/bin/env python3
"""Safely apply Sergeant SP4 to a clean BTD-commando checkout.

Default behavior is strict and rollback-oriented:
- requires the pinned production baseline commit
- requires a clean git worktree
- copies SP4 new modules/docs/tests
- applies the existing SP2 and SP3 wiring scripts
- runs static SP4 verification, npm test, and npm run build
- rolls the edited Sergeant files back to the original checkout if qualification fails

The script never commits, pushes, deploys, or touches broker configuration.
"""
from __future__ import annotations
from pathlib import Path
import json
import shutil
import subprocess
import sys

BASELINE = "c0c0a9799770a4f33440193379c833608c351b61"
NEW_FILES = [
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
MODIFIED_BY_WIRING = [
    "src/routes/sergeant.tsx",
    "src/components/btd/SergeantAdvisor.tsx",
    "src/routes/api.sergeant-chat.ts",
    "src/lib/sergeant-chat/corporal_engine.ts",
    "src/lib/sergeant-chat/dual_rank_router_core.ts",
]


def run(args, cwd: Path, *, check=True):
    return subprocess.run(args, cwd=cwd, text=True, capture_output=True, check=check)


def restore(root: Path, copied: list[Path]) -> None:
    # Route existed before both SP2 and SP3; SP2 backup is the true SP0 source.
    route = root / "src/routes/sergeant.tsx"
    route_sp2 = route.with_suffix(route.suffix + ".sp2.bak")
    if route_sp2.exists():
        shutil.copy2(route_sp2, route)
    # Other four existing files were first modified at SP3.
    for rel in MODIFIED_BY_WIRING[1:]:
        path = root / rel
        bak = path.with_suffix(path.suffix + ".sp3.bak")
        if bak.exists():
            shutil.copy2(bak, path)
    for path in copied:
        if path.exists():
            path.unlink()
    for rel in MODIFIED_BY_WIRING:
        path = root / rel
        for suffix in (".sp2.bak", ".sp3.bak"):
            bak = path.with_suffix(path.suffix + suffix)
            if bak.exists():
                bak.unlink()


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python apply_sergeant_sp4.py /path/to/BTD-commando", file=sys.stderr)
        return 2
    repo = Path(sys.argv[1]).resolve()
    bundle = Path(__file__).resolve().parents[1]
    if not (repo / ".git").exists():
        print("ERROR: target is not a git checkout", file=sys.stderr)
        return 2
    head = run(["git", "rev-parse", "HEAD"], repo).stdout.strip()
    if head != BASELINE:
        print(f"ERROR: expected baseline {BASELINE}, found {head}. Refusing source drift.", file=sys.stderr)
        return 3
    if run(["git", "status", "--porcelain"], repo).stdout.strip():
        print("ERROR: worktree is not clean. Save/commit/stash your work first.", file=sys.stderr)
        return 4

    copied: list[Path] = []
    report = {"baseline": head, "steps": [], "qualified": False}
    try:
        for rel in NEW_FILES:
            src = bundle / rel
            dst = repo / rel
            if dst.exists():
                raise RuntimeError(f"refusing to overwrite pre-existing SP4 file: {rel}")
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            copied.append(dst)
        report["steps"].append("copied SP1-SP4 additive source/docs/tests")

        for script in ("apply_sergeant_sp2.py", "apply_sergeant_sp3.py"):
            result = run([sys.executable, str(bundle / "integration" / script), str(repo)], repo, check=False)
            if result.returncode != 0:
                raise RuntimeError(f"{script} failed:\n{result.stdout}\n{result.stderr}")
            report["steps"].append(script)

        verify = run([sys.executable, str(bundle / "integration" / "verify_sergeant_sp4.py"), str(repo)], repo, check=False)
        if verify.returncode != 0:
            raise RuntimeError(f"SP4 static verification failed:\n{verify.stdout}\n{verify.stderr}")
        report["steps"].append("static SP4 verifier")

        tests = run(["npm", "test"], repo, check=False)
        (repo / "sergeant-sp4-npm-test.log").write_text(tests.stdout + tests.stderr, encoding="utf-8")
        if tests.returncode != 0:
            raise RuntimeError("npm test failed; see sergeant-sp4-npm-test.log")
        report["steps"].append("npm test")

        build = run(["npm", "run", "build"], repo, check=False)
        (repo / "sergeant-sp4-build.log").write_text(build.stdout + build.stderr, encoding="utf-8")
        if build.returncode != 0:
            raise RuntimeError("npm run build failed; see sergeant-sp4-build.log")
        report["steps"].append("npm run build")

        report["qualified"] = True
        (repo / "sergeant-sp4-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
        print("SP4 QUALIFIED LOCALLY. Review /sergeant manually, then commit as a savepoint.")
        return 0
    except Exception as exc:
        report["error"] = str(exc)
        try:
            restore(repo, copied)
            report["rolledBack"] = True
        except Exception as rollback_exc:
            report["rolledBack"] = False
            report["rollbackError"] = str(rollback_exc)
        (repo / "sergeant-sp4-failed-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
        print(f"ERROR: {exc}", file=sys.stderr)
        print("SP4 qualification failed. Sergeant source was rolled back where possible.", file=sys.stderr)
        return 5

if __name__ == "__main__":
    raise SystemExit(main())
