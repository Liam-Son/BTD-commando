#!/usr/bin/env python3
"""Apply Sergeant SP3 desk-aware chat wiring to an SP2-integrated BTD-commando tree.

Safety properties:
- computes every edit before writing anything
- refuses if an expected anchor is missing/duplicated
- refuses if SP3 appears already applied
- creates .sp3.bak for every modified file before writes
- does not touch btd_v1_0 scoring, sergeant_policy_v1, paper ledger, or broker code
"""
from __future__ import annotations

from pathlib import Path
import shutil
import sys

FILES = {
    "route": Path("src/routes/sergeant.tsx"),
    "advisor": Path("src/components/btd/SergeantAdvisor.tsx"),
    "api": Path("src/routes/api.sergeant-chat.ts"),
    "corporal": Path("src/lib/sergeant-chat/corporal_engine.ts"),
    "router": Path("src/lib/sergeant-chat/dual_rank_router_core.ts"),
}


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected anchor exactly once, found {count}")
    return text.replace(old, new, 1)


def apply_route(text: str) -> str:
    if "buildSergeantDeskContext" in text:
        raise RuntimeError("route: SP3 already appears integrated")
    if "SergeantRiskBrief" not in text or "riskCeilingBlocked" not in text:
        raise RuntimeError("route: SP2 integration not found; apply SP2 first")
    text = replace_once(
        text,
        'import { assessSergeantRisk, sergeantRiskCeilingBlocksIncrease } from "@/lib/sergeant-risk";\n',
        'import { assessSergeantRisk, sergeantRiskCeilingBlocksIncrease } from "@/lib/sergeant-risk";\n'
        'import { buildSergeantDeskContext } from "@/lib/sergeant-chat/desk_context";\n',
        "route import",
    )
    anchor = '''  const riskCeilingBlocked = sergeantRiskCeilingBlocksIncrease(\n    currentPosition?.targetSleeve ?? 0,\n    appliedSleeve,\n    riskBrief,\n  );\n'''
    new = anchor + '''  const deskContext = useMemo(\n    () => buildSergeantDeskContext({\n      book,\n      metrics: marked.metrics,\n      kills,\n      risk: riskBrief,\n      selected: selected && flag\n        ? {\n            symbol: selected.symbol,\n            btdScore: selected.btdScore,\n            confidence: selected.confidence,\n            flag,\n            currentSleevePct: (currentPosition?.targetSleeve ?? 0) * 100,\n            requestedSleevePct: appliedSleeve * 100,\n          }\n        : null,\n    }),\n    [\n      appliedSleeve, book, currentPosition?.targetSleeve, flag, kills, marked.metrics, riskBrief,\n      selected?.btdScore, selected?.confidence, selected?.symbol,\n    ],\n  );\n'''
    text = replace_once(text, anchor, new, "route desk context")
    text = replace_once(
        text,
        '        <SergeantAdvisor />\n',
        '        <SergeantAdvisor deskContext={deskContext} />\n',
        "route advisor prop",
    )
    return text


def apply_advisor(text: str) -> str:
    if "deskContext" in text and "SergeantDeskContext" in text:
        raise RuntimeError("advisor: SP3 already appears integrated")
    text = replace_once(
        text,
        'import { useDataset, consent } from "@/lib/data-resilience";\n',
        'import { useDataset, consent } from "@/lib/data-resilience";\n'
        'import type { SergeantDeskContext } from "@/lib/sergeant-chat/desk_context";\n',
        "advisor import",
    )
    text = replace_once(
        text,
        'const starters = ["What is the BTD score?", "How do kill switches work?", "What is look-ahead bias?", "How does the paper book work?"];\n\nexport function SergeantAdvisor() {\n',
        'const starters = ["How is my paper book?", "Why this risk posture?", "What is my paper risk ceiling?", "Stress my paper book by 20%."];\n\nexport function SergeantAdvisor({ deskContext }: { deskContext?: SergeantDeskContext | null }) {\n',
        "advisor signature",
    )
    text = replace_once(
        text,
        '        body: JSON.stringify({ message, history: prior, requestId }),\n',
        '        body: JSON.stringify({ message, history: prior, requestId, context: deskContext ?? null }),\n',
        "advisor request context",
    )
    copy_anchor = '''        Chat is session-only unless local saving is enabled in Data tools. {storedChat.issue} Corporal explains basics; Sergeant handles deeper paper-only analysis when the private\n        engine is online. Responses do not place orders or constitute personalized investment\n        advice. No live market or news connector is enabled here.\n'''
    copy_new = '''        Chat is session-only unless local saving is enabled in Data tools. {storedChat.issue} Corporal can explain the current deterministic paper-desk snapshot; Sergeant handles deeper paper-only analysis when the private\n        engine is online. Responses do not place orders or constitute personalized investment\n        advice. No live market or news connector is enabled here. The attached desk context excludes broker credentials and the ops log.\n'''
    text = replace_once(text, copy_anchor, copy_new, "advisor copy")
    return text


def apply_api(text: str) -> str:
    if "sanitizeSergeantDeskContext" in text:
        raise RuntimeError("api: SP3 already appears integrated")
    text = replace_once(
        text,
        'import { createDualRankRouter } from "@/lib/sergeant-chat/dual_rank_router_core";\n',
        'import { createDualRankRouter } from "@/lib/sergeant-chat/dual_rank_router_core";\n'
        'import { sanitizeSergeantDeskContext } from "@/lib/sergeant-chat/desk_context";\n',
        "api import",
    )
    text = replace_once(
        text,
        '        const input = body as { message?: unknown; history?: unknown; requestId?: unknown } | null;\n',
        '        const input = body as { message?: unknown; history?: unknown; requestId?: unknown; context?: unknown } | null;\n',
        "api body type",
    )
    anchor = '''        const supplied = typeof input?.requestId === "string" ? input.requestId.trim() : "";\n        const requestId = /^[A-Za-z0-9._:-]{8,96}$/.test(supplied) ? supplied : crypto.randomUUID();\n        const reply = await router.resolve(message, input?.history, requestId);\n'''
    new = '''        const supplied = typeof input?.requestId === "string" ? input.requestId.trim() : "";\n        const requestId = /^[A-Za-z0-9._:-]{8,96}$/.test(supplied) ? supplied : crypto.randomUUID();\n        const deskContext = sanitizeSergeantDeskContext(input?.context);\n        const reply = await router.resolve(message, input?.history, requestId, deskContext);\n'''
    text = replace_once(text, anchor, new, "api sanitized context")
    return text


def apply_corporal(text: str) -> str:
    if "contextualSergeantDeskReply" in text:
        raise RuntimeError("corporal: SP3 already appears integrated")
    intro = '''// Voice: calm field sergeant. No live orders. Score is not an order.\n\n'''
    text = replace_once(
        text,
        intro,
        intro + 'import { contextualSergeantDeskReply, type SergeantDeskContext } from "./desk_context";\n\n',
        "corporal import",
    )
    text = replace_once(
        text,
        'export function corporalReply(message: string): CorporalReply {\n',
        'export function corporalReply(message: string, context?: SergeantDeskContext | null): CorporalReply {\n',
        "corporal signature",
    )
    action_anchor = '''  const meta = matchesAny(META_OR_NEGATION, q) && !matchesAny(ACTION_FOLLOWUP, q);\n  if (!meta && matchesAny(ACTION, q)) {\n'''
    action_new = '''  const meta = matchesAny(META_OR_NEGATION, q) && !matchesAny(ACTION_FOLLOWUP, q);\n  const deskReply = contextualSergeantDeskReply(q, context);\n  if (deskReply) {\n    return base('BASIC_INFO', deskReply.message, 'deterministic_desk_context', false, false, deskReply.topic);\n  }\n  if (!meta && matchesAny(ACTION, q)) {\n'''
    text = replace_once(text, action_anchor, action_new, "corporal desk reply")
    return text


def apply_router(text: str) -> str:
    if "sanitizeSergeantDeskContext" in text:
        raise RuntimeError("router: SP3 already appears integrated")
    text = replace_once(
        text,
        "import { corporalReply, type CorporalReply } from './corporal_engine';\n",
        "import { corporalReply, type CorporalReply } from './corporal_engine';\n"
        "import { sanitizeSergeantDeskContext, type SergeantDeskContext } from './desk_context';\n",
        "router import",
    )
    text = replace_once(
        text,
        "  async resolve(message: string, history: unknown, requestId?: string): Promise<SergeantReply | CorporalReply> {\n    const q = String(message ?? '').trim();\n    const safeHistory = sanitizeHistory(history);\n    const local = corporalReply(q);\n",
        "  async resolve(message: string, history: unknown, requestId?: string, context?: unknown): Promise<SergeantReply | CorporalReply> {\n    const q = String(message ?? '').trim();\n    const safeHistory = sanitizeHistory(history);\n    const safeContext: SergeantDeskContext | null = sanitizeSergeantDeskContext(context);\n    const local = corporalReply(q, safeContext);\n",
        "router resolve context",
    )
    text = replace_once(
        text,
        "          body: JSON.stringify({message: q, history: safeHistory}),\n",
        "          body: JSON.stringify({\n"
        "            message: q,\n"
        "            history: safeHistory,\n"
        "            deskContext: safeContext,\n"
        "            constraints: {\n"
        "              paperOnly: true,\n"
        "              noBroker: true,\n"
        "              noPortfolioMutation: true,\n"
        "              deterministicRiskAuthoritative: true,\n"
        "            },\n"
        "          }),\n",
        "router advanced body",
    )
    return text


APPLIERS = {
    "route": apply_route,
    "advisor": apply_advisor,
    "api": apply_api,
    "corporal": apply_corporal,
    "router": apply_router,
}


def main() -> int:
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
    originals: dict[str, str] = {}
    updates: dict[str, str] = {}
    try:
        for key, rel in FILES.items():
            path = root / rel
            if not path.exists():
                raise RuntimeError(f"missing {rel}")
            backup = path.with_suffix(path.suffix + ".sp3.bak")
            if backup.exists():
                raise RuntimeError(f"backup already exists: {backup}")
            originals[key] = path.read_text(encoding="utf-8")
        for key in FILES:
            updates[key] = APPLIERS[key](originals[key])
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        print("No files were changed.", file=sys.stderr)
        return 3

    # Only after every edit has validated do we create rollback copies and write.
    for key, rel in FILES.items():
        path = root / rel
        shutil.copy2(path, path.with_suffix(path.suffix + ".sp3.bak"))
    for key, rel in FILES.items():
        (root / rel).write_text(updates[key], encoding="utf-8")

    print("SP3 integrated successfully. Backups created:")
    for rel in FILES.values():
        print(f"- {rel}.sp3.bak")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
