import { useCloudSync } from "@/lib/data-resilience";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ICONS, PixelIcon } from "@/components/btd/PixelIcon";

type Props = {
  active?:
    | "sniper"
    | "sergeant"
    | "ranger"
    | "hunter"
    | "arcade"
    | "communication"
    | "intel"
    | "medic"
    | "stocks"
    | "crypto"
    | "portfolio"
    | "armory"
    | "ops";
  status?: ReactNode;
  signedIn?: boolean;
};

export function CommandoHeader({ active = "sniper", status, signedIn }: Props) {
  useCloudSync();
  const tab = (key: Props["active"], to: string, label: string, iconFile: string) => {
    const on = active === key;
    return (
      <Link
        to={to}
        aria-current={on ? "page" : undefined}
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
          <img
            src="/theme/brand/commando-patch.png"
            alt=""
            aria-hidden="true"
            width={40}
            height={40}
            className="pixel h-10 w-10 shrink-0 object-contain"
          />
          <div className="min-w-0">
            <h1 className="pixel-title text-xl leading-none text-primary">BTD COMMANDO</h1>
            <p className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:block">
              Find the dip. Control the risk.
            </p>
          </div>
        </Link>
        <nav
          aria-label="Main navigation"
          className="hidden flex-wrap items-center gap-0.5 border border-border bg-surface px-1 py-0.5 md:flex"
        >
          <span
            className="flex items-center gap-1 border-r border-border px-1.5 py-0.5 text-primary"
            title="WAYFINDER navigation companion"
            aria-label="WAYFINDER navigation companion"
          >
            <img
              src="/theme/navigation/wayfinder_buddy.png"
              alt="WAYFINDER"
              className="h-5 w-5 object-contain"
              loading="eager"
            />
            <span className="hidden text-[9px] font-bold uppercase tracking-widest lg:inline">
              WAYFINDER
            </span>
          </span>
          {tab("sniper", "/", "Sniper", ICONS.target)}
          {tab("sergeant", "/sergeant", "Sergeant", ICONS.sergeant)}
          {tab("intel", "/intel", "Intel", ICONS.radar)}
          {tab("ranger", "/ranger", "Ranger", ICONS.idle)}
          {tab("hunter", "/hunter", "Hunter", ICONS.radar)}
          {tab("medic", "/medic", "Medic", ICONS.medkit)}
          {tab("arcade", "/arcade", "Arcade", ICONS.supply)}
          <details className="relative">
            <summary className="mil-tab cursor-pointer text-primary">Tools</summary>
            <div className="absolute right-0 top-full z-50 flex min-w-44 flex-col gap-1 border-2 border-primary/40 bg-background p-2 shadow-xl">
              <Link to="/data-tools" className="mil-tab">
                Data tools
              </Link>
              {tab("communication", "/communication", "Communication", ICONS.signal)}
              {tab("armory", "/armory", "Armory", ICONS.supply)}
              {tab("ops", "/ops", "Ops Log", ICONS.opsLog)}
              {tab("stocks", "/stocks", "Stocks", ICONS.score)}
              {tab("crypto", "/crypto", "Crypto", ICONS.signal)}
            </div>
          </details>
          <span className="mx-0.5 hidden h-4 w-px bg-border sm:inline" />
          <Link
            to={signedIn ? "/portfolio" : "/auth"}
            className="mil-tab inline-flex items-center gap-1 border-border/60 text-muted-foreground hover:border-primary/50 hover:text-primary"
          >
            <PixelIcon name={ICONS.paperBook} className="pixel h-4 w-4" />
            {signedIn ? "Book" : "Sign in"}
          </Link>
        </nav>
        <details className="relative md:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 border border-primary/60 bg-surface px-2 py-1 text-primary [&::-webkit-details-marker]:hidden">
            <img
              src="/theme/navigation/wayfinder_buddy.png"
              alt=""
              className="h-5 w-5 object-contain"
              loading="eager"
            />
            <span className="pixel-title text-base">WAYFINDER</span>
            <span className="text-[10px] text-muted-foreground">MENU</span>
          </summary>
          <div className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,360px)] border-2 border-primary/60 bg-background p-2 shadow-2xl">
            <p className="mb-2 border-b border-border pb-2 text-[10px] uppercase tracking-widest text-primary">
              Navigation deck
            </p>
            <div className="grid gap-1">
              <Link to="/" className="mil-tab">
                Sniper
              </Link>
              <Link to="/sergeant" className="mil-tab">
                Sergeant
              </Link>
              <Link to="/intel" className="mil-tab">
                Intel
              </Link>
              <Link to="/ranger" className="mil-tab">
                Ranger
              </Link>
              <Link to="/hunter" className="mil-tab">
                Hunter
              </Link>
              <Link to="/medic" className="mil-tab">
                Medic
              </Link>
              <Link to="/arcade" className="mil-tab">
                Arcade
              </Link>
            </div>
            <p className="mb-1 mt-3 border-t border-border pt-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Tools &amp; boards
            </p>
            <div className="grid gap-1">
              <Link to="/data-tools" className="mil-tab">
                Data tools
              </Link>
              <Link to="/communication" className="mil-tab">
                Communication
              </Link>
              <Link to="/armory" className="mil-tab">
                Armory
              </Link>
              <Link to="/ops" className="mil-tab">
                Ops Log
              </Link>
              <Link to="/stocks" className="mil-tab">
                Stocks
              </Link>
              <Link to="/crypto" className="mil-tab">
                Crypto
              </Link>
            </div>
          </div>
        </details>
        {status ? (
          <div className="flex w-full flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground md:w-auto">
            <div
              className="flex items-center gap-1 border border-primary/30 bg-surface px-1.5 py-0.5 text-primary"
              title="SENTINEL system status monitor"
              aria-label="SENTINEL system status monitor"
            >
              <img
                src="/theme/system/sentinel_buddy.png"
                alt="SENTINEL"
                className="h-5 w-5 object-contain"
                loading="eager"
              />
              <span className="hidden sm:inline">SENTINEL</span>
            </div>
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
