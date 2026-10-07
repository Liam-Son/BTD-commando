#!/usr/bin/env python3
"""Sergeant Local Terminal V2. Paper-only. No broker."""
from __future__ import annotations
import argparse, re
from pathlib import Path
SKIP_DIRS={".git","node_modules","__pycache__",".venv","venv","dist","build",".aside"}
CODE_SUFFIXES={".py",".ts",".tsx",".js",".mjs",".cjs",".pine",".md",".json",".csv"}
LIVE_WORDS=("place order","submit order","broker api","api key","live trading","real money","market order","ibkr","alpaca","create_order")

def safe_root(path:str)->Path:
    root=Path(path).expanduser().resolve()
    if not root.exists() or not root.is_dir():
        raise SystemExit(f"Standby. Folder not found: {root}")
    return root

def scan(root:Path, limit:int=120)->list[str]:
    found=[]
    for path in root.rglob("*"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.is_file() and path.suffix.lower() in CODE_SUFFIXES:
            found.append(str(path.relative_to(root)).replace("\\","/"))
            if len(found)>=limit: break
    return found

def read_snippets(root:Path, files:list[str], max_chars:int=20000)->str:
    chunks=[]; used=0
    for name in files[:20]:
        path=(root/name).resolve()
        if root not in path.parents and path!=root: continue
        try: text=path.read_text(encoding="utf-8", errors="replace")
        except OSError: continue
        piece=text[:2000]; used+=len(piece); chunks.append(f"\n## {name}\n{piece}")
        if used>=max_chars: break
    return "\n".join(chunks)

def flags(text:str)->list[str]:
    lowered=text.lower(); notes=[]
    if any(w in lowered for w in LIVE_WORDS):
        notes.append("Negative. Live-order or credential language found. Strip it. Paper only.")
    if "signal" in lowered and "close" in lowered and "next open" not in lowered and "next_open" not in lowered:
        notes.append("Hold. Confirm signal uses completed data and fill is next open, not same close.")
    if re.search(r"\b(cagr|sharpe|alpha)\b", lowered) and not re.search(r"\b(cost|bps|fee|slippage)\b", lowered):
        notes.append("Hold. Return metrics without costs are incomplete. Add buy and sell costs.")
    if re.search(r"\b(best|optimize|grid search|optuna|hyperparam)\b", lowered) and "out of sample" not in lowered and "holdout" not in lowered:
        notes.append("Hold. Parameter search without a frozen holdout is exploratory, not validated edge.")
    if "leverage" in lowered or "margin" in lowered:
        notes.append("Hold. Leverage changes the risk contract. State max gross exposure explicitly.")
    if "spy" in lowered and "benchmark" not in lowered and "buy and hold" not in lowered:
        notes.append("Note. If SPY appears, compare on identical dates, capital, and costs.")
    if "guaranteed" in lowered or "sure alpha" in lowered:
        notes.append("Negative. No guaranteed alpha language in a research book.")
    return notes

def checklist()->str:
    return "\n".join([
        "Assessment: paper checklist before you trust a result.",
        "1. Rule frozen before the test window.",
        "2. Signal on completed bar; fill next open or later.",
        "3. Costs on buys and sells, including initial deployment.",
        "4. Identical-date benchmark, usually dividend-aware SPY.",
        "5. Drawdown, exposure, and turnover reported with return.",
        "6. Holdout or era split labeled honestly.",
        "7. No broker keys, no live path, score != order.",
    ])

def answer(question:str, folder_notes:str, files=None)->str:
    files=files or []; q=question.strip(); ql=q.lower().rstrip("?!.").strip()
    if not q: return "Report in. Ask for review, checklist, costs, look-ahead, or a specific file risk."
    if any(w in ql for w in ("buy now","sell now","place order","api key","broker login")):
        return "Negative. I do not place orders, store keys, or connect to a broker. Ask for a paper checklist instead."
    if ql in {"hello","hi","hey","you good"}:
        return "Sergeant local is on. Paper only. No broker. Ask for checklist, files, look-ahead, or a review of this folder."
    if ql in {"checklist","paper checklist","review checklist"}: return checklist()
    if "look-ahead" in ql or "lookahead" in ql:
        return "Assessment: look-ahead means using future information at decision time. Fail the test if signal and fill share the same close without a delay rule."
    if ql.startswith("files") or ql=="list":
        preview="\n".join(f"- {n}" for n in files[:30]) or "- none"
        return f"Assessment: tracked files ({len(files)}).\n{preview}"
    notes=flags(q+"\n"+folder_notes)
    lines=["Assessment: paper review only. No order, no broker, no return guarantee.", f"Folder scan: {len(files)} files.", *notes]
    if not notes: lines.append("No hard live-order flag in the sampled text. Still verify costs, timing, benchmark, and holdout labels.")
    lines.append("Next step: freeze the rule, next-open fill, costs both ways, SPY on the same dates, then reread the drawdown.")
    return "\n".join(lines)

ALLOWED_ORIGINS={
    "https://btd.noviark.net",
    "https://btd-commando.vercel.app",
    "http://127.0.0.1:8080",
    "http://localhost:8080",
}

def reply_payload(message:str, folder_notes:str, files:list[str])->dict:
    return {
        "rank":"SERGEANT",
        "mode":"LOCAL",
        "status":"BASIC_INFO",
        "message":answer(message, folder_notes, files),
        "paperOnly":True,
        "advancedAvailable":True,
        "reason":"local_sergeant",
        "retryable":False,
        "sergeantRequired":False,
        "topic":"local",
    }

def serve(root:Path, host:str="127.0.0.1", port:int=8765)->None:
    import json
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
    files=scan(root); snippets=read_snippets(root, files)

    class Handler(BaseHTTPRequestHandler):
        protocol_version="HTTP/1.1"
        def log_message(self, fmt:str, *args)->None:
            return
        def _cors(self)->None:
            origin=self.headers.get("Origin","")
            if origin in ALLOWED_ORIGINS or origin.startswith("http://127.0.0.1:") or origin.startswith("http://localhost:"):
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Private-Network", "true")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
        def _send(self, code:int, payload:dict)->None:
            raw=json.dumps(payload).encode("utf-8")
            self.send_response(code)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(raw)
        def do_OPTIONS(self)->None:
            self.send_response(204)
            self._cors()
            self.send_header("Content-Length", "0")
            self.end_headers()
        def do_GET(self)->None:
            if self.path.split("?",1)[0] != "/ready":
                self._send(404, {"ready":False}); return
            self._send(200, {"ready":True, "rank":"SERGEANT", "paperOnly":True})
        def do_POST(self)->None:
            if self.path.split("?",1)[0] != "/chat":
                self._send(404, {"error":"not_found"}); return
            length=int(self.headers.get("Content-Length") or 0)
            if length > 65536:
                self._send(413, {"error":"body_too_large"}); return
            try:
                body=json.loads(self.rfile.read(length).decode("utf-8") or "{}")
            except json.JSONDecodeError:
                self._send(400, {"error":"invalid_json"}); return
            message=body.get("message") if isinstance(body, dict) else ""
            if not isinstance(message, str) or not message.strip() or len(message) > 4000:
                self._send(400, {"error":"invalid_message"}); return
            self._send(200, reply_payload(message, snippets, files))

    if host not in {"127.0.0.1", "localhost"}:
        raise SystemExit("Standby. Local Sergeant binds to 127.0.0.1 only.")
    try:
        httpd=ThreadingHTTPServer((host, port), Handler)
    except OSError as exc:
        raise SystemExit(f"Standby. Could not listen on {host}:{port}. {exc}") from exc
    print(f"Sergeant local ON at http://{host}:{port}")
    print("Paper only. This computer only. No broker path.")
    print(f"Folder: {root}"); print(f"Files seen: {len(files)}")
    print("Leave this window open. Ctrl+C turns Sergeant off.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nHold. Local Sergeant off.")
    finally:
        httpd.server_close()

def main()->None:
    p=argparse.ArgumentParser(description="Local paper-only Sergeant terminal")
    p.add_argument("--project", required=True)
    p.add_argument("--serve", action="store_true", help="Listen on 127.0.0.1:8765 for the website toggle")
    p.add_argument("--port", type=int, default=8765)
    args=p.parse_args(); root=safe_root(args.project)
    if args.serve:
        serve(root, port=args.port); return
    files=scan(root); snippets=read_snippets(root, files)
    print("Sergeant Local Terminal V2"); print("Paper only. Local folder only. No broker path.")
    print(f"Folder: {root}"); print(f"Files seen: {len(files)}"); print("Commands: checklist | files | exit")
    while True:
        try: question=input("\nYou> ")
        except (EOFError, KeyboardInterrupt):
            print("\nHold. Terminal closed."); return
        if question.strip().lower() in {"exit","quit"}:
            print("Hold. Terminal closed."); return
        print(answer(question, snippets, files))

if __name__=="__main__":
    main()
