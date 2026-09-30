import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type Props = {
  active?: "sniper" | "sergeant" | "stocks" | "crypto" | "portfolio" | "armory" | "ops";
  status?: ReactNode;
  signedIn?: boolean;
};

/** Compact solid chrome — no transparent sticky glass over content. */
export function CommandoHeader({ active = "sniper", status, signedIn }: Props) {
  const tab = (
    key: Props["active"],
    to: string | null,
    label: string,
    icon: string,
    opts?: { soon?: boolean },
  ) => {
    const on = active === key;
    const cls = on
      ? "mil-tab mil-tab-active inline-flex items-center gap-1"
      : "mil-tab inline-flex items-center gap-1 border-border/60 text-muted-foreground hover:border-primary/50 hover:text-primary";
    if (!to || opts?.soon) {
      return (
        <span className={`${cls} cursor-default opacity-50`} title="Coming soon">
          <span aria-hidden>{icon}</span>
          {label}
        </span>
      );
    }
    return (
      <Link to={to} className={cls}>
        <span aria-hidden>{icon}</span>
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b-2 border-primary/50 bg-background">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img
            src="/theme/hero-sniper.png"
            alt=""
            className="pixel hidden h-9 w-9 border border-primary/50 object-cover object-top sm:block"
            width={36}
            height={36}
          />
          <div className="min-w-0">
            <h1 className="pixel-title text-xl leading-none text-primary sm:text-2xl">BTD COMMANDO</h1>
            <p className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:block">
              Find the dip. Control the risk.
            </p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 border border-border bg-surface px-1 py-0.5">
          {tab("sniper", "/", "Sniper", "◎")}
          {tab("sergeant", "/sergeant", "Sergeant", "★")}
          {tab("armory", "/armory", "Armory", "▣")}
          {tab("ops", "/ops", "Ops Log", "☰")}
          <span className="mx-0.5 hidden h-4 w-px bg-border sm:inline" />
          {tab("stocks", "/stocks", "Stocks", "·")}
          {tab("crypto", "/crypto", "Crypto", "·")}
          <Link
            to={signedIn ? "/portfolio" : "/auth"}
            className="mil-tab border-border/60 text-muted-foreground hover:border-primary/50 hover:text-primary"
          >
            {signedIn ? "Book" : "Sign in"}
          </Link>
        </nav>

        {status ? (
          <div className="flex flex-wrap items-center gap-2 font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
            {status}
          </div>
        ) : null}
      </div>
      <div className="border-t border-border bg-surface px-3 py-1 text-center text-[10px] text-muted-foreground sm:px-4">
        ROE · score ≠ order · paper only · not advice ·{" "}
        <span className="tabular text-primary">btd_v1_0</span>
      </div>
    </header>
  );
}