#!/usr/bin/env python3
"""Apply Sergeant SP2 UI wiring to src/routes/sergeant.tsx safely.

The script is intentionally strict: every baseline anchor must occur exactly once.
It creates a .sp2.bak copy before writing and refuses to continue on drift.
"""
from __future__ import annotations

from pathlib import Path
import shutil
import sys

TARGET = Path("src/routes/sergeant.tsx")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected baseline anchor exactly once, found {count}")
    return text.replace(old, new, 1)


def apply(text: str) -> str:
    if "SergeantRiskBrief" in text and "assessSergeantRisk" in text and "riskCeilingBlocked" in text:
        raise RuntimeError("SP2 appears to be already integrated; refusing to apply twice")

    text = replace_once(
        text,
        'import { SergeantAdvisor } from "@/components/btd/SergeantAdvisor";\n',
        'import { SergeantAdvisor } from "@/components/btd/SergeantAdvisor";\n'
        'import { SergeantRiskBrief } from "@/components/btd/SergeantRiskBrief";\n'
        'import { assessSergeantRisk, sergeantRiskCeilingBlocksIncrease } from "@/lib/sergeant-risk";\n',
        "imports",
    )

    feed_anchor = '''  const feedState: FeedState = error || (!isPending && assets.length === 0)\n    ? "down"\n    : data?.degraded.length\n      ? "degraded"\n      : isLive\n        ? "live"\n        : "snapshot";\n'''
    feed_new = feed_anchor + '''  const riskBrief = useMemo(\n    () => assessSergeantRisk({\n      book,\n      metrics: marked.metrics,\n      kills,\n      feedState,\n      inputReliability: selected?.confidence ?? null,\n    }),\n    [book, feedState, kills, marked.metrics, selected?.confidence],\n  );\n'''
    text = replace_once(text, feed_anchor, feed_new, "risk brief computation")

    increasing_anchor = '''  const increasing = appliedSleeve > (currentPosition?.targetSleeve ?? 0) + 1e-9;\n'''
    increasing_new = increasing_anchor + '''  const riskCeilingBlocked = sergeantRiskCeilingBlocksIncrease(\n    currentPosition?.targetSleeve ?? 0,\n    appliedSleeve,\n    riskBrief,\n  );\n'''
    text = replace_once(text, increasing_anchor, increasing_new, "risk ceiling guard")

    export_anchor = '''  function exportCsv() {\n    const blob = new Blob([opsLogCsv(book.log)], { type: "text/csv;charset=utf-8" });\n    const url = URL.createObjectURL(blob);\n    const a = document.createElement("a");\n    a.href = url;\n    a.download = `sergeant-ops-${new Date().toISOString().slice(0, 10)}.csv`;\n    a.click();\n    URL.revokeObjectURL(url);\n  }\n'''
    export_new = export_anchor + '''\n  function exportRiskBrief() {\n    const snapshot = {\n      createdAt: new Date().toISOString(),\n      formulaId: BTD_FORMULA_ID,\n      policyId: SERGEANT_POLICY_ID,\n      selected: selected\n        ? {\n            symbol: selected.symbol,\n            btdScore: selected.btdScore,\n            confidence: selected.confidence,\n          }\n        : null,\n      risk: riskBrief,\n    };\n    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json;charset=utf-8" });\n    const url = URL.createObjectURL(blob);\n    const a = document.createElement("a");\n    a.href = url;\n    a.download = `sergeant-risk-brief-${new Date().toISOString().slice(0, 10)}.json`;\n    a.click();\n    URL.revokeObjectURL(url);\n  }\n'''
    text = replace_once(text, export_anchor, export_new, "risk brief export")

    grid_anchor = '        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">\n'
    grid_new = '''        <SergeantRiskBrief\n          brief={riskBrief}\n          selectedSymbol={selected?.symbol ?? null}\n          onExport={exportRiskBrief}\n        />\n\n''' + grid_anchor
    text = replace_once(text, grid_anchor, grid_new, "risk brief render")

    block_anchor = '''                {(hardIncreaseBlocked || newNameBlocked || sleeveBlocked) && (\n                  <p className="mt-3 text-[12px] text-down">\n                    This increase is blocked by an active kill/cap. Lower the paper sleeve or reduce exposure first.\n                  </p>\n                )}\n'''
    block_new = '''                {(hardIncreaseBlocked || newNameBlocked || sleeveBlocked || riskCeilingBlocked) && (\n                  <p className="mt-3 text-[12px] text-down">\n                    {riskCeilingBlocked\n                      ? `SP2 safety overlay caps new/increased per-name paper exposure at ${riskBrief.paperRiskCeilingPct.toFixed(1)}%. Reductions remain available.`\n                      : "This increase is blocked by an active kill/cap. Lower the paper sleeve or reduce exposure first."}\n                  </p>\n                )}\n'''
    text = replace_once(text, block_anchor, block_new, "blocked-state copy")

    disabled_anchor = '''                  disabled={!hydrated || hardIncreaseBlocked || newNameBlocked || sleeveBlocked || (Math.abs(appliedSleeve - suggestedSleeve) > 1e-9 && !reason.trim())}\n'''
    disabled_new = '''                  disabled={!hydrated || hardIncreaseBlocked || newNameBlocked || sleeveBlocked || riskCeilingBlocked || (Math.abs(appliedSleeve - suggestedSleeve) > 1e-9 && !reason.trim())}\n'''
    text = replace_once(text, disabled_anchor, disabled_new, "apply button guard")

    return text


def main() -> int:
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else TARGET
    if not target.exists():
        print(f"ERROR: {target} does not exist", file=sys.stderr)
        return 2
    original = target.read_text(encoding="utf-8")
    try:
        updated = apply(original)
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 3
    backup = target.with_suffix(target.suffix + ".sp2.bak")
    if backup.exists():
        print(f"ERROR: backup already exists at {backup}; refusing to overwrite", file=sys.stderr)
        return 4
    shutil.copy2(target, backup)
    target.write_text(updated, encoding="utf-8")
    print(f"SP2 integrated: {target}")
    print(f"Backup: {backup}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
