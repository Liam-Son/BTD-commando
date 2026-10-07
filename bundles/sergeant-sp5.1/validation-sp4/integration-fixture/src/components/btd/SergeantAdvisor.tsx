import { useDataset, consent } from "@/lib/data-resilience";
import type { SergeantDeskContext } from "@/lib/sergeant-chat/desk_context";
import { useEffect, useRef, useState, type FormEvent } from "react";
type Line = any;
const starters = ["How is my paper book?", "Why this risk posture?", "What is my paper risk ceiling?", "Stress my paper book by 20%."];

export function SergeantAdvisor({ deskContext }: { deskContext?: SergeantDeskContext | null }) {
  const storedChat:any={issue:""};
  async function send(){
    const message="x", prior=[], requestId="12345678";
    await fetch("/api/sergeant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: prior, requestId, context: deskContext ?? null }),
      });
  }
  return <div>
      <div className="px-4 pt-4 text-xs leading-relaxed text-muted-foreground">
        Chat is session-only unless local saving is enabled in Data tools. {storedChat.issue} Corporal can explain the current deterministic paper-desk snapshot; Sergeant handles deeper paper-only analysis when the private
        engine is online. Responses do not place orders or constitute personalized investment
        advice. No live market or news connector is enabled here. The attached desk context excludes broker credentials and the ops log.
      </div>
  </div>;
}
