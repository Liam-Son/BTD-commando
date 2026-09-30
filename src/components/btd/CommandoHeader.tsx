import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type Props = {
  /** Active nav key */
  active?: "sniper" | "sergeant" | "stocks" | "crypto" | "portfolio";
  /** Right-side status cluster (live dots, countdowns) */
  status?: ReactNode;
  signedIn?: boolean;
};

/**
 * BTD Commando shell — platform chrome for Sniper (score) + Sergeant (paper RA).
 * Doctrine: docs/COMMANDO_DOCTRINE.md
 */
export function CommandoHeader({ active = "sniper", status, signedIn }: Props) {
  const tab = (key: Props["active"], to: string, label: string) => {
    const on = active === key;
    return (
      <Link
        to={to}
        className={
          on
            ? "rounded-sm border border-primary/50 bg-primary/10 px-2 py-1 font-semibold uppercase tracking-widest text-primary"
            : "rounded-sm border border-border px-2 py-1 uppercase tracking-widest hover:text-foreground"
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <Link to="/" className="group flex items-baseline gap-2">
            <h1 className="text-lg font-bold tracking-tight">
              BTD<span className="text-primary">.</span>COMMANDO
              <span className="align-super text-[9px] text-muted-foreground">™</span>
            </h1>
          </Link>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground md:inline">
            Sniper scores the dip · Sergeant runs paper discipline
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          {tab("sniper", "/", "Sniper")}
          {tab("sergeant", "/sergeant", "Sergeant")}
          {tab("stocks", "/stocks", "Stocks")}
          {tab("crypto", "/crypto", "Crypto")}
          <Link
            to={signedIn ? "/portfolio" : "/auth"}
            className="rounded-sm border border-border px-2 py-1 hover:text-foreground"
          >
            {signedIn ? "My portfolio" : "Sign in"}
          </Link>
          {status}
        </nav>
      </div>
      <div className="border-t border-border/60 bg-surface/40 px-4 py-1 text-center text-[10px] tracking-wide text-muted-foreground">
        ROE: score ≠ order · research / paper tools · not investment advice · formula{" "}
        <span className="tabular text-foreground/80">btd_v1_0</span>
      </div>
    </header>
  );
}
