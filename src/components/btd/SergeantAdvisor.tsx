import { useDataset, consent } from "@/lib/data-resilience";
import type { SergeantDeskContext } from "@/lib/sergeant-chat/desk_context";
import { useEffect, useRef, useState, type FormEvent } from "react";

type Rank = "CORPORAL" | "SERGEANT";
type Line = { role: "user" | "assistant"; content: string; rank?: Rank; status?: string };
const starters = ["How is my paper book?", "Why this risk posture?", "What is my paper risk ceiling?", "Stress my paper book by 20%."];
const LOCAL_KEY = "btd-sergeant-local";
const LOCAL_SERGEANT = "http://127.0.0.1:8765";

export function SergeantAdvisor({ deskContext }: { deskContext?: SergeantDeskContext | null }) {
  const storedChat = useDataset<Line[]>("chat", () => []);
  const [sessionHistory, setSessionHistory] = useState<Line[]>([]);
  const localChatEnabled = typeof window !== "undefined" && consent(storedChat.owner)?.localChat === true;
  const history = localChatEnabled ? storedChat.value : sessionHistory;
  const setHistory = localChatEnabled ? storedChat.setValue : setSessionHistory;
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [localOn, setLocalOn] = useState(false);
  const [localReady, setLocalReady] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const pendingId = useRef<string | null>(null);
  useEffect(() => { setSessionHistory([]); }, [storedChat.owner]);
  useEffect(() => {
    setLocalOn(window.localStorage.getItem(LOCAL_KEY) === "on");
  }, []);
  useEffect(() => {
    if (!localOn) {
      setLocalReady(false);
      return;
    }
    let alive = true;
    const probe = async () => {
      try {
        const response = await fetch(`${LOCAL_SERGEANT}/ready`, { cache: "no-store" });
        const data = await response.json();
        if (alive) setLocalReady(response.ok && data?.ready === true);
      } catch {
        if (alive) setLocalReady(false);
      }
    };
    void probe();
    const timer = window.setInterval(probe, 5000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [localOn]);
  function setSergeant(on: boolean) {
    setLocalOn(on);
    window.localStorage.setItem(LOCAL_KEY, on ? "on" : "off");
  }
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [history, busy]);

  async function send(event?: FormEvent, prompt?: string) {
    event?.preventDefault();
    const message = (prompt ?? draft).trim();
    if (!message || busy) return;
    if (message.length > 4000) {
      setError("Keep your question under 4,000 characters.");
      return;
    }
    setBusy(true);
    setError("");
    const prior = history.map(({ role, content }) => ({ role, content })).slice(-8);
    setHistory((lines) => [...lines, { role: "user", content: message }]);
    setDraft("");
    const requestId = pendingId.current ?? crypto.randomUUID();
    pendingId.current = requestId;
    try {
      const response = localOn
        ? await fetch(`${LOCAL_SERGEANT}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
          })
        : await fetch("/api/sergeant-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message,
              history: prior,
              requestId,
              context: deskContext ?? null,
              localSergeant: "off",
            }),
          });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          localOn
            ? "Local Sergeant refused the question."
            : data?.error === "rate_limited"
              ? "Too many requests. Wait a moment, then retry."
              : "Advisor unavailable. Please retry.",
        );
      if (typeof data.message !== "string" || !["CORPORAL", "SERGEANT"].includes(data.rank))
        throw new Error("Advisor returned an invalid response.");
      setHistory((lines) => [
        ...lines,
        { role: "assistant", content: data.message, rank: data.rank, status: data.status },
      ]);
      pendingId.current = null;
    } catch (cause) {
      setHistory((lines) => lines.slice(0, -1));
      setDraft(message);
      setError(
        localOn
          ? "Sergeant is on for this computer, but the local terminal is not running. Open PowerShell, cd to tools\\sergeant-local, and run: python sergeant_local.py --serve --project C:\\path\\to\\a\\real\\folder"
          : cause instanceof Error
            ? cause.message
            : "Advisor unavailable. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="advisor"
      className="rounded border-2 border-primary/50 bg-surface shadow-[0_0_0_1px_rgba(0,0,0,.5)]"
      aria-label="Sergeant advisor chat"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/30 bg-primary/10 p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden border-2 border-primary bg-background">
            <img
              src="/theme/sergeant/sergeant_buddy.png"
              alt="SGT COMMAND advisor"
              className="h-full w-full object-contain object-center"
              loading="eager"
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.25em] text-primary">
              Comms channel · paper only
            </p>
            <h2 className="text-lg font-extrabold uppercase tracking-wide text-foreground">
              Ask the advisor
            </h2>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex overflow-hidden border border-primary/40 text-[10px] font-bold uppercase tracking-widest">
            <button
              type="button"
              aria-pressed={!localOn}
              onClick={() => setSergeant(false)}
              className={`px-2 py-1 ${localOn ? "text-muted-foreground" : "bg-primary text-primary-foreground"}`}
            >
              Off
            </button>
            <button
              type="button"
              aria-pressed={localOn}
              onClick={() => setSergeant(true)}
              className={`px-2 py-1 ${localOn ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              On
            </button>
          </div>
          <span
            className="border border-primary/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary"
            aria-live="polite"
          >
            {localOn
              ? localReady
                ? "Sergeant on · this computer"
                : "Sergeant on · start local terminal"
              : "Sergeant off · this computer"}
          </span>
        </div>
      </div>
      <div className="px-4 pt-4 text-xs leading-relaxed text-muted-foreground">
        Chat is session-only unless local saving is enabled in Data tools. {storedChat.issue} Corporal can explain the current deterministic paper-desk snapshot; Sergeant handles deeper paper-only analysis when the private
        engine is online. Responses do not place orders or constitute personalized investment
        advice. No live market or news connector is enabled here. The attached desk context excludes broker credentials and the ops log.
      </div>
      <div
        className="mx-4 mt-4 max-h-[380px] min-h-[180px] space-y-3 overflow-y-auto rounded border border-border bg-background p-3"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {history.length === 0 && (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>How can I help with the BTD method or paper risk controls?</p>
            <div className="flex flex-wrap gap-2">
              {starters.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => void send(undefined, item)}
                  className="border border-primary/30 px-3 py-2 text-left text-xs text-foreground hover:bg-primary/10"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
        {history.map((line, index) => (
          <div
            key={index}
            className={`max-w-[92%] rounded border px-3 py-2 text-sm whitespace-pre-wrap ${line.role === "user" ? "ml-auto border-primary/30 bg-primary/10 text-foreground" : "border-border bg-surface text-foreground"}`}
          >
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {line.role === "user"
                ? "You"
                : `${line.rank ?? "Advisor"} · ${line.status ?? "Info"}`}
            </p>
            {line.content}
          </div>
        ))}
        {busy && (
          <p className="text-xs text-primary" role="status">
            Checking the desk…
          </p>
        )}
        <div ref={bottom} />
      </div>
      <form onSubmit={(event) => void send(event)} className="space-y-2 p-4">
        <label
          htmlFor="advisor-question"
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
        >
          Your question
        </label>
        <div className="flex gap-2">
          <input
            id="advisor-question"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={4000}
            autoComplete="off"
            placeholder="Ask about BTD or paper risk…"
            className="min-w-0 flex-1 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="border border-primary bg-primary px-4 py-2 text-xs font-bold uppercase text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Working" : "Send"}
          </button>
        </div>
        {error && (
          <p className="text-xs text-warn" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
