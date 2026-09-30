import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type Props = {
  active?: "sniper" | "sergeant" | "stocks" | "crypto" | "portfolio" | "armory" | "ops";
  status?: ReactNode;
  signedIn?: boolean;
};

/**
 * Mock-board chrome: pixel title + yellow-frame tabs + ROE plaque.
 * docs/THEME.md · docs/COMMANDO_DOCTRINE.md
 */
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
      ? "mil-tab mil-tab-active inline-flex items-center gap-1.5"
      : "mil-tab inline-flex items-center gap-1.5 border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary";
    if (!to || opts?.soon) {
      return (
        <span className={`${cls} cursor-default opacity-55`} title="Coming soon">
          <span aria-hidden className="text-sm opacity-80">
            {icon}
          </span>
          {label}
        </span>
      );
    }
    return (
      <Link to={to} className={cls}>
        <span aria-hidden className="text-sm opacity-90">
          {icon}
        </span>
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-30 border-b-2 border-primary/40">
      <div className="ops-sky-strip relative">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="group flex min-w-0 items-center gap-3">
            <div className="hidden h-11 w-11 shrink-0 overflow-hidden border-2 border-primary/60 bg-surface sm:block">
              <img
                src="/theme/btd-sprite-sheet.png"
                alt=""
                className="pixel h-full w-full object-cover"
                style={{ objectPosition: "8% 10%" }}
                width={44}
                height={44}
              />
            </div>
            <div className="min-w-0">
              <h1 className="pixel-title truncate text-[1.75rem] leading-none text-primary drop-shadow sm:text-[2.1rem]">
                BTD COMMANDO
              </h1>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-sand/90 text-muted-foreground">
                Find the dip. Control the risk.
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-1.5 rounded-sm border border-border/60 bg-background/70 p-1 backdrop-blur">
            {tab("sniper", "/", "Sniper", "◎")}
            {tab("sergeant", "/sergeant", "Sergeant", "★")}
            {tab("armory", null, "Armory", "▣", { soon: true })}
            {tab("ops", null, "Ops Log", "☰", { soon: true })}
            <span className="mx-0.5 hidden h-5 w-px bg-border sm:inline" />
            {tab("stocks", "/stocks", "Stocks", "·")}
            {tab("crypto", "/crypto", "Crypto", "·")}
            <Link
              to={signedIn ? "/portfolio" : "/auth"}
              className="mil-tab border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary"
            >
              {signedIn ? "Book" : "Sign in"}
            </Link>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            {status ? (
              <div className="hidden items-center gap-2 font-sans text-[10px] uppercase tracking-wider text-muted-foreground lg:flex">
                {status}
              </div>
            ) : null}
            <aside className="mil-panel max-w-[10.5rem] px-2.5 py-2 text-[9px] leading-snug text-muted-foreground">
              <p className="pixel-title mb-1 text-sm text-primary">ROE</p>
              <p>Score ≠ order</p>
              <p>Paper only</p>
              <p>Not financial advice</p>
              <p className="mt-1 tabular text-primary/90">btd_v1_0</p>
            </aside>
          </div>
        </div>
      </div>
      <div className="border-t border-border/50 bg-background/90 px-4 py-1 text-center text-[10px] tracking-wide text-muted-foreground">
        Research / paper tools · not investment advice · formula{" "}
        <span className="tabular text-primary">btd_v1_0</span> · score ≠ order
      </div>
    </header>
  );
}
