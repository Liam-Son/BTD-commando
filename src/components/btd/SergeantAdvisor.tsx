import { useDataset, consent } from "@/lib/data-resilience";
import { useEffect, useRef, useState, type FormEvent } from "react";

type Rank = "CORPORAL" | "SERGEANT";
type Status = { rank: Rank; advancedAvailable: boolean; sergeantState: string; mode: string };
type Line = { role: "user" | "assistant"; content: string; rank?: Rank; status?: string };
const starters = ["What is the BTD score?", "Explain paper-only risk", "What is diversification?"];

export function SergeantAdvisor() {
  const [status, setStatus] = useState<Status>({
    rank: "CORPORAL",
    advancedAvailable: false,
    sergeantState: "CHECKING",
    mode: "BASIC",
  });
  const storedChat = useDataset<Line[]>("chat", () => []);
  const [sessionHistory, setSessionHistory] = useState<Line[]>([]);
  const localChatEnabled = typeof window !== "undefined" && consent(storedChat.owner)?.localChat === true;
  const history = localChatEnabled ? storedChat.value : sessionHistory;
  const setHistory = localChatEnabled ? storedChat.setValue : setSessionHistory;
  useEffect(() => { setSessionHistory([]); }, [storedChat.owner]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const pendingId = useRef<string | null>(null);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/sergeant-chat", { cache: "no-store" });
        if (!response.ok) throw new Error("status_unavailable");
        const data = await response.json();
        if (alive) setStatus(data);
      } catch {
        if (alive)
          setStatus({
            rank: "CORPORAL",
            advancedAvailable: false,
            sergeantState: "OFFLINE",
            mode: "BASIC",
          });
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);
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
      const response = await fetch("/api/sergeant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: prior, requestId }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data?.error === "rate_limited"
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
      setError(cause instanceof Error ? cause.message : "Advisor unavailable. Please retry.");
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
        <span
          className="border border-primary/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary"
          aria-live="polite"
        >
          {status.advancedAvailable
            ? status.sergeantState === "BUSY"
              ? "Sergeant busy · Corporal standing by"
              : "Sergeant online"
            : `Corporal active · Sergeant ${status.sergeantState.toLowerCase()}`}
        </span>
      </div>
      <div className="px-4 pt-4 text-xs leading-relaxed text-muted-foreground">
        Chat is session-only unless local saving is enabled in Data tools. {storedChat.issue} Corporal explains basics; Sergeant handles deeper paper-only analysis when the private
        engine is online. Responses do not place orders or constitute personalized investment
        advice. No live market or news connector is enabled here.
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
