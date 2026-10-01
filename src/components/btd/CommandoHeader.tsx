import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ICONS, PixelIcon } from "@/components/btd/PixelIcon";

type Props = {
  active?:
    "sniper" | "sergeant" | "communication" | "stocks" | "crypto" | "portfolio" | "armory" | "ops";
  status?: ReactNode;
  signedIn?: boolean;
};

export function CommandoHeader({ active = "sniper", status, signedIn }: Props) {
  const tab = (key: Props["active"], to: string, label: string, iconFile: string) => {
    const on = active === key;
    return (
      <Link
        to={to}
        className={
          on
            ? "mil-tab mil-tab-active inline-flex items-center gap-1.5"
            : "mil-tab inline-flex items-center gap-1.5 border-border/60 text-muted-foreground hover:border-primary/50 hover:text-primary"
        }
      >
        <PixelIcon name={iconFile} className="pixel h-4 w-4 shrink-0" />
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b-2 border-primary/50 bg-background">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <PixelIcon name={ICONS.aim} className="pixel h-8 w-8 shrink-0" />
          <div className="min-w-0">
            <h1 className="pixel-title text-xl leading-none text-primary sm:text-2xl">
              BTD COMMANDO
            </h1>
            <p className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:block">
              Find the dip. Control the risk.
            </p>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 border border-border bg-surface px-1 py-0.5">
          {tab("sniper", "/", "Sniper", ICONS.target)}
          {tab("sergeant", "/sergeant", "Sergeant", ICONS.sergeant)}
          {tab("communication", "/communication", "Communication", ICONS.signal)}
          {tab("intel", "/intel", "Intel", ICONS.radar)}
          {tab("armory", "/armory", "Armory", ICONS.supply)}
          {tab("ops", "/ops", "Ops Log", ICONS.opsLog)}
          <span className="mx-0.5 hidden h-4 w-px bg-border sm:inline" />
          {tab("stocks", "/stocks", "Stocks", ICONS.score)}
          {tab("crypto", "/crypto", "Crypto", ICONS.signal)}
          <Link
            to={signedIn ? "/portfolio" : "/auth"}
            className="mil-tab inline-flex items-center gap-1 border-border/60 text-muted-foreground hover:border-primary/50 hover:text-primary"
          >
            <PixelIcon name={ICONS.paperBook} className="pixel h-4 w-4" />
            {signedIn ? "Book" : "Sign in"}
          </Link>
        </nav>
        {status ? (
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            {status}
          </div>
        ) : null}
      </div>
      <div className="border-t border-border bg-surface px-3 py-1 text-center text-[10px] text-muted-foreground">
        ROE · score ≠ order · paper only · not advice ·{" "}
        <span className="tabular text-primary">btd_v1_0</span>
      </div>
    </header>
  );
}
