import { RefreshCw } from "lucide-react";

export type DataStatusState = "loading" | "live" | "snapshot" | "empty" | "offline";

type Props = {
  state: DataStatusState;
  label?: string;
  detail?: string;
  updatedAt?: number | string | undefined;
  sources?: string;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
};

const STATE_COPY: Record<DataStatusState, { label: string; tone: string; dot: string }> = {
  loading: { label: "SYNCING", tone: "text-warn", dot: "bg-warn live-dot" },
  live: { label: "LIVE", tone: "text-up", dot: "bg-up" },
  snapshot: { label: "SNAPSHOT", tone: "text-primary", dot: "bg-primary" },
  empty: { label: "NO DATA", tone: "text-warn", dot: "bg-warn" },
  offline: { label: "OFFLINE", tone: "text-down", dot: "bg-down" },
};

function formatUpdatedAt(value: number | string | undefined) {
  if (!value) return "—";
  const timestamp = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(timestamp)) return "—";
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function DataStatus({
  state,
  label = "DATA STATUS",
  detail,
  updatedAt,
  sources,
  onRetry,
  compact = false,
  className = "",
}: Props) {
  const copy = STATE_COPY[state];

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 uppercase tracking-wider ${copy.tone} ${className}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${copy.dot}`} />
        <span>{label}</span>
        <span className="text-muted-foreground">· {copy.label}</span>
      </span>
    );
  }

  return (
    <section
      className={`mil-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${className}`}
      aria-label={label}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${copy.dot}`} aria-hidden="true" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </p>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${copy.tone}`}>
              {copy.label}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {detail ??
              (state === "loading"
                ? "Waiting for a verified snapshot."
                : state === "offline"
                  ? "The source did not return a usable snapshot."
                  : state === "empty"
                    ? "The source responded, but no records are available."
                    : "Research data is available for this screen.")}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {sources ? <span>{sources}</span> : null}
        {updatedAt ? <span className="tabular">UPDATED {formatUpdatedAt(updatedAt)}</span> : null}
        {onRetry && (state === "offline" || state === "empty") ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 border border-primary/50 px-2 py-1 font-bold text-primary hover:bg-primary/10"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Retry
          </button>
        ) : null}
      </div>
    </section>
  );
}
