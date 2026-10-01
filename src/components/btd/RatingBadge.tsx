import { ratingFor, type RatingTone } from "@/lib/btd-core";
import { ICONS } from "@/components/btd/PixelIcon";

export type MilSignal = "ACQUIRE" | "HOT" | "WATCH" | "TRACK" | "STAND DOWN";
export function milSignalFor(score: number): MilSignal {
  if (score >= 90) return "ACQUIRE";
  if (score >= 75) return "HOT";
  if (score >= 50) return "WATCH";
  if (score >= 25) return "TRACK";
  return "STAND DOWN";
}
const MIL_ICON: Record<MilSignal, string> = {
  ACQUIRE: ICONS.acquire,
  HOT: ICONS.alert,
  WATCH: ICONS.watch,
  TRACK: ICONS.reduce,
  "STAND DOWN": ICONS.standDown,
};
const MIL_CLASS: Record<MilSignal, string> = {
  ACQUIRE: "sig-acquire",
  HOT: "sig-hot",
  WATCH: "sig-watch",
  TRACK: "sig-track",
  "STAND DOWN": "sig-stand",
};
const TONE_CLASS: Record<RatingTone, string> = {
  extreme: "bg-up/20 text-up border-up/50",
  exceptional: "bg-up/15 text-up border-up/35",
  strong: "bg-up/10 text-up border-up/25",
  buy: "bg-primary/8 text-primary border-primary/20",
  watch: "bg-warn/10 text-warn border-warn/25",
  neutral: "bg-muted text-muted-foreground border-border",
  weak: "bg-down/8 text-down/85 border-down/20",
  avoid: "bg-down/15 text-down border-down/35",
};
export function RatingBadge({ score }: { score: number }) {
  const sig = milSignalFor(score);
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${MIL_CLASS[sig]}`} title={`Research signal · ${ratingFor(score).label} · not an order`}>
      <img src={`/theme/icons/${MIL_ICON[sig]}`} alt="" className="pixel h-3.5 w-3.5" width={14} height={14} />
      {sig}
    </span>
  );
}
export function MethodologyBadge({ score }: { score: number }) {
  const rating = ratingFor(score);
  return (
    <span className={`inline-flex whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TONE_CLASS[rating.tone]}`}>
      {rating.label}
    </span>
  );
}
export function ScoreCell({ score }: { score: number }) {
  const sig = milSignalFor(score);
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="hidden h-1.5 w-16 overflow-hidden border border-border/80 bg-secondary sm:block">
        <div className="score-bar h-full" style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
      <span className="tabular w-12 text-right text-sm font-bold text-foreground">{score.toFixed(1)}</span>
      <span className={`hidden items-center gap-1 px-1 text-[9px] font-bold uppercase md:inline-flex ${MIL_CLASS[sig]}`}>
        <img src={`/theme/icons/${MIL_ICON[sig]}`} alt="" className="pixel h-3 w-3" />
        {sig}
      </span>
    </div>
  );
}