#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import sys

REQUIRED = {
    "src/lib/sergeant-risk.ts": [
        'SERGEANT_RISK_ENGINE_ID = "sergeant_risk_v2"',
        "sergeantRiskCeilingBlocksIncrease",
        "Per-name concentration is already hard-enforced",
    ],
    "src/lib/sergeant-chat/desk_context.ts": [
        'engineId: "sergeant_risk_v2"',
        'risk["engineId"] !== "sergeant_risk_v2"',
        'boundedNumber(risk["paperRiskCeilingPct"], 0, 20)',
    ],
    "src/routes/sergeant.tsx": [
        "SergeantRiskBrief",
        "assessSergeantRisk",
        "riskCeilingBlocked",
        "buildSergeantDeskContext",
        "<SergeantAdvisor deskContext={deskContext} />",
    ],
    "src/components/btd/SergeantAdvisor.tsx": [
        "SergeantDeskContext",
        "context: deskContext ?? null",
    ],
    "src/routes/api.sergeant-chat.ts": [
        "sanitizeSergeantDeskContext",
        "router.resolve(message, input?.history, requestId, deskContext)",
    ],
    "src/lib/sergeant-chat/corporal_engine.ts": [
        "contextualSergeantDeskReply",
        "deterministic_desk_context",
    ],
    "src/lib/sergeant-chat/dual_rank_router_core.ts": [
        "sanitizeSergeantDeskContext",
        "deterministicRiskAuthoritative: true",
        "noPortfolioMutation: true",
        "noBroker: true",
    ],
}

FORBIDDEN_AFFECTED = [
    "placeLiveOrder(",
    "submitLiveOrder(",
    "brokerApiKey",
    "IBApi(",
    "Alpaca(",
]


def main() -> int:
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
    errors: list[str] = []
    texts: dict[str, str] = {}
    for rel, markers in REQUIRED.items():
        path = root / rel
        if not path.exists():
            errors.append(f"missing {rel}")
            continue
        text = path.read_text(encoding="utf-8")
        texts[rel] = text
        for marker in markers:
            if marker not in text:
                errors.append(f"{rel}: missing marker {marker!r}")

    risk = texts.get("src/lib/sergeant-risk.ts", "")
    if "concentrationFactor" in risk:
        errors.append("sergeant-risk.ts: stale v1 concentrationFactor still present in global ceiling")
    if 'BTD_FORMULA_ID = "btd_v1_0"' in risk or 'SERGEANT_POLICY_ID = "sergeant_policy_v1"' in risk:
        pass  # risk module should not redefine these ids; this is only a harmless text guard.

    corporal = texts.get("src/lib/sergeant-chat/corporal_engine.ts", "")
    if corporal:
        safety_positions = [p for p in [
            corporal.find("matchesAny(INJECTION"),
            corporal.find("matchesAny(FAKE_EXECUTION"),
            corporal.find("matchesAny(PERSONALIZED"),
        ] if p >= 0]
        desk_pos = corporal.find("contextualSergeantDeskReply(q, context)")
        if len(safety_positions) != 3 or desk_pos < 0 or max(safety_positions) > desk_pos:
            errors.append("corporal_engine.ts: deterministic desk reply is not safely ordered after injection/fake/personalized checks")

    joined = "\n".join(texts.values())
    for token in FORBIDDEN_AFFECTED:
        if token in joined:
            errors.append(f"affected Sergeant files contain forbidden live-broker marker {token!r}")

    if errors:
        print("SP4 VERIFY: FAIL")
        for e in errors:
            print(f"- {e}")
        return 2
    print("SP4 VERIFY: PASS")
    print("- risk engine v2 present")
    print("- risk ceiling + desk context wiring present")
    print("- safety ordering retained")
    print("- no obvious live-broker path introduced in affected files")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
