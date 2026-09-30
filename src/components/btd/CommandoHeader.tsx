import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type Props = {
  /** Active nav key */
  active?: "sniper" | "sergeant" | "stocks" | "crypto" | "portfolio" | "armory" | "ops";
  /** Right-side status cluster (live dots, countdowns) */
  status?: ReactNode;
  signedIn?: boolean;
};

/**
 * BTD Commando shell — soft pixel military chrome.
 * Doctrine: docs/COMMANDO_DOCTRINE.md · Theme: docs/THEME.md
 */
export function CommandoHeader({ active = "sniper", status, signedIn }: Props) {
  const tab = (
    key: Props["active"],
    to: string | null,
    label: string,
    opts?: { soon?: boolean },
  ) => {
    const on = active === key;
    const cls = on
      ? "mil-tab mil-tab-active"
      : "mil-tab border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary";
    if (!to || opts?.soon) {
      return (
        <span className={`${cls} cursor-default opacity-60`} title="Coming soon">
          {label}
          <span className="ml-1 text-[9px] font-sans tracking-normal opacity-70">soon</span>
        </span>
      );
    }
    return (
      <Link to={to} className={cls}>
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-20 border-b-2 border-primary/30 bg-background/95 backdrop-blur">
      <div className="relative mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          <Link to="/" className="group flex items-center gap-3">
            <img
              src="/theme/btd-sprite-sheet.png"
              alt=""
              className="pixel hidden h-10 w-10 object-cover object-left sm:block"
              style={{ objectPosition: "8% 8%" }}
              width={40}
              height={40}
            />
            <div>
              <h1 className="pixel-title text-2xl leading-none text-primary sm:text-3xl">
                BTD COMMANDO
              </h1>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Find the dip. Control the risk.
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {tab("sniper", "/", "Sniper")}
          {tab("sergeant", "/sergeant", "Sergeant")}
          {tab("armory", null, "Armory", { soon: true })}
          {tab("ops", null, "Ops Log", { soon: true })}
          {tab("stocks", "/stocks", "Stocks")}
          {tab("crypto", "/crypto", "Crypto")}
          <Link
            to={signedIn ? "/portfolio" : "/auth"}
            className="mil-tab border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary"
          >
            {signedIn ? "Book" : "Sign in"}
          </Link>
          {status ? (
            <div className="ml-1 flex flex-wrap items-center gap-2 font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
              {status}
            </div>
          ) : null}
        </nav>

        {/* ROE plaque — matches mockup corner card */}
        <aside className="mil-panel hidden max-w-[11rem] px-2 py-1.5 text-[9px] leading-snug text-muted-foreground xl:block">
          <p className="pixel-title text-xs text-primary">ROE</p>
          <p>Score ≠ order</p>
          <p>Paper only</p>
          <p>Not financial advice</p>
          <p className="tabular text-foreground/80">btd_v1_0</p>
        </aside>
      </div>
      <div className="border-t border-border/60 bg-surface/50 px-4 py-1 text-center text-[10px] tracking-wide text-muted-foreground">
        ROE: score ≠ order · research / paper tools · not investment advice · formula{" "}
        <span className="tabular text-primary/90">btd_v1_0</span>
      </div>
    </header>
  );
}
