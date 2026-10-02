import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CommandoHeader } from "@/components/btd/CommandoHeader";
import { useAuth } from "@/hooks/useAuth";
import {
  formatDate,
  formatTime,
  loadMedic,
  makeCheckin,
  MEDIC_READINESS_VERSION,
  newLog,
  readinessBand,
  type Checkin,
  type LogEntry,
  type Reminder,
} from "@/lib/medic";

export const Route = createFileRoute("/medic")({
  head: () => ({
    meta: [
      { title: "MEDIC — Human readiness | BTD Commando" },
      {
        name: "description",
        content:
          "BTD Commando MEDIC: a local-first wellness and readiness tool, not medical advice.",
      },
    ],
  }),
  component: MedicPage,
});

const ART = "/theme/medic";
const initialForm = {
  energy: 3,
  mood: 3,
  stress: 3,
  focus: 3,
  recovery: 3,
  sleepHours: 7,
  sleepQuality: 3,
  hydrationMl: 0,
  activity: "planned" as Checkin["activity"],
  note: "",
};
const modules = [
  [
    "MEDIC BAY",
    "01_medic_bay.png",
    "Today's command center for self-reported readiness, reminders, and recovery.",
  ],
  [
    "VITALS",
    "02_vitals.png",
    "Quick wellness snapshot — manually entered, not hospital-grade monitoring.",
  ],
  ["RECOVERY TENT", "03_recovery_tent.png", "Sleep, rest, fatigue, soreness, and recovery days."],
  [
    "RATIONS",
    "04_rations.png",
    "Practical nutrition and hydration routines without extreme targets.",
  ],
  [
    "CONDITIONING",
    "05_conditioning.png",
    "Walks, workouts, mobility, sport, and planned recovery.",
  ],
  [
    "MENTAL READINESS",
    "06_mental_readiness.png",
    "Neutral mood, stress, focus, energy, and reset actions.",
  ],
  ["FIELD LOG", "07_field_log.png", "A timeline of user-entered wellness events."],
  [
    "CHECKUP QUEUE",
    "08_checkup_queue.png",
    "User-controlled reminders for appointments and routine checkups.",
  ],
] as const;
const buddyOptions = [
  [
    "good",
    "GOOD TO GO",
    "PATCH: Status received. Keep the plan measured.",
    "Ready to share a simple green signal.",
  ],
  [
    "recovery",
    "RECOVERY DAY",
    "PATCH: Recovery is part of the plan. Keep it light.",
    "A rest signal, not a failure signal.",
  ],
  [
    "checkin",
    "NEED A CHECK-IN",
    "PATCH: Copy. A buddy signal is out; no private details shared.",
    "Ask for contact without explaining everything.",
  ],
  [
    "offline",
    "OFFLINE",
    "PATCH: Understood. Status will stay quiet until you return.",
    "Pause communication for the next 24 hours.",
  ],
] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-10 border-2 border-border bg-background px-2 text-sm text-foreground outline-none focus:border-primary ${props.className ?? ""}`}
    />
  );
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="min-h-10 border-2 border-border bg-background px-2 text-sm text-foreground outline-none focus:border-primary"
    />
  );
}
function Section({
  title,
  image,
  children,
}: {
  title: string;
  image: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mil-panel overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border bg-surface-2 p-3">
        <img src={`${ART}/${image}`} alt="" className="pixel h-14 w-20 object-cover" />
        <div>
          <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            BTD COMMando / MEDIC
          </p>
          <h2 className="pixel-title text-xl text-primary">{title}</h2>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="border border-dashed border-border bg-background/50 p-4 text-center">
      <p className="pixel-title text-lg text-primary">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

function MedicPage() {
  const { user } = useAuth();
  const [data, setData] = useState(() => ({
    checkins: [] as Checkin[],
    logs: [] as LogEntry[],
    reminders: [] as Reminder[],
    settings: loadMedic(null).settings,
    buddy: loadMedic(null).buddy,
  }));
  const [hydrated, setHydrated] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [reminder, setReminder] = useState({
    title: "",
    category: "Routine",
    dueDate: "",
    notes: "",
  });
  const [breathing, setBreathing] = useState(0);
  const [buddyNote, setBuddyNote] = useState("");

  useEffect(() => {
    setData(loadMedic(window.localStorage));
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem("btd.medic.checkins.v1", JSON.stringify(data.checkins));
      window.localStorage.setItem("btd.medic.logs.v1", JSON.stringify(data.logs));
      window.localStorage.setItem("btd.medic.reminders.v1", JSON.stringify(data.reminders));
      window.localStorage.setItem("btd.medic.settings.v1", JSON.stringify(data.settings));
      window.localStorage.setItem("btd.medic.buddy.v1", JSON.stringify(data.buddy));
    } catch {
      setNotice("Storage unavailable; this session may not survive refresh.");
    }
  }, [data, hydrated]);
  useEffect(() => {
    if (!breathing) return;
    const timer = window.setInterval(
      () => setBreathing((value) => (value <= 1 ? 0 : value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [breathing]);

  const latest = data.checkins[0];
  const readiness = latest ? readinessBand(latest.readinessScore) : null;
  const weekSleep = data.checkins.slice(0, 7);
  const activityCount = data.checkins.filter((item) => item.activity === "yes").length;
  const recommendation = latest
    ? latest.sleepHours < 6
      ? "Sleep was short. Consider an earlier night or lighter schedule."
      : latest.stress >= 4
        ? "Stress is elevated. A short break or breathing session may help."
        : latest.hydrationMl < data.settings.hydrationTarget
          ? "Hydration is below today's target."
          : "Routine is holding. Protect the recovery window."
    : "Log today's check-in to activate recommendations.";

  function setField(key: keyof typeof initialForm, value: string) {
    setForm(
      (current) =>
        ({
          ...current,
          [key]: ["energy", "mood", "stress", "focus", "recovery", "sleepQuality"].includes(key)
            ? Number(value)
            : key === "sleepHours" || key === "hydrationMl"
              ? Number(value)
              : value,
        }) as typeof initialForm,
    );
  }
  function submitCheckin(event: React.FormEvent) {
    event.preventDefault();
    const existing = editing ? data.checkins.find((item) => item.id === editing) : undefined;
    const entry = makeCheckin({ ...form, date: new Date().toISOString().slice(0, 10) }, existing);
    setData((current) => ({
      ...current,
      checkins: [entry, ...current.checkins.filter((item) => item.id !== entry.id)].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
      logs: [
        newLog("Daily check-in", `${entry.readinessScore} / 100`, "readiness"),
        ...current.logs,
      ],
    }));
    setEditing(null);
    setForm(initialForm);
    setNotice(
      `Check-in logged — ${entry.readinessScore} / 100 ${readinessBand(entry.readinessScore).band}.`,
    );
  }
  function editCheckin(item: Checkin) {
    setEditing(item.id);
    setForm({
      energy: item.energy,
      mood: item.mood,
      stress: item.stress,
      focus: item.focus,
      recovery: item.recovery,
      sleepHours: item.sleepHours,
      sleepQuality: item.sleepQuality,
      hydrationMl: item.hydrationMl,
      activity: item.activity,
      note: item.note,
    });
    document.getElementById("check-in")?.scrollIntoView({ behavior: "smooth" });
  }
  function addLog(type: string, value: string, unit?: string) {
    setData((current) => ({ ...current, logs: [newLog(type, value, unit), ...current.logs] }));
    setNotice(`${type} added to Field Log.`);
  }
  function addReminder(event: React.FormEvent) {
    event.preventDefault();
    if (!reminder.title.trim()) return;
    setData((current) => ({
      ...current,
      reminders: [
        { ...reminder, id: crypto.randomUUID(), status: "open" as const },
        ...current.reminders,
      ],
    }));
    setReminder({ title: "", category: "Routine", dueDate: "", notes: "" });
    setNotice("Reminder added to Checkup Queue.");
  }
  function setBuddyStatus(status: (typeof buddyOptions)[number][0]) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    setData((current) => ({
      ...current,
      buddy: { status, note: buddyNote.trim(), updatedAt: now.toISOString(), expiresAt },
    }));
    setNotice(`PATCH updated — ${buddyOptions.find(([key]) => key === status)?.[1] ?? "status"}.`);
  }

  return (
    <main className="min-h-screen bg-background">
      <CommandoHeader
        active="medic"
        signedIn={!!user}
        status={
          <span className="flex items-center gap-1.5">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-destructive" /> Readiness desk
          </span>
        }
      />
      <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-6">
        <section className="mil-panel grid gap-0 overflow-hidden lg:grid-cols-[1.25fr_0.75fr]">
          <div className="relative min-h-[260px] overflow-hidden bg-[#171e17]">
            <img
              src={`${ART}/01_medic_bay.png`}
              alt="Pixel-art medic bay"
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/45 to-transparent" />
            <div className="relative flex h-full flex-col justify-end p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                MEDIC // HUMAN READINESS
              </p>
              <h1 className="pixel-title mt-2 text-5xl text-primary sm:text-7xl">
                RECOVER. RESET.
                <br />
                RETURN READY.
              </h1>
              <p className="mt-3 max-w-lg text-sm text-foreground/80">
                A private, local-first routine desk for tracking readiness, recovery, and healthy
                habits. No diagnosis. No medical clearance.
              </p>
            </div>
          </div>
          <div className="border-t-2 border-primary/40 p-5 lg:border-l-2 lg:border-t-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  TODAY'S READINESS
                </p>
                <p className="mt-2 text-5xl font-black tabular text-primary">
                  {latest ? latest.readinessScore : "—"}
                </p>
              </div>
              <span
                className={`border-2 px-2 py-1 text-xs font-black ${readiness?.band === "GREEN" ? "border-up text-up" : readiness?.band === "RED" ? "border-destructive text-destructive" : "border-primary text-primary"}`}
              >
                {readiness?.band ?? "NO CHECK-IN"}
              </span>
            </div>
            {latest ? (
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                {[
                  ["Energy", latest.energy],
                  ["Sleep", `${latest.sleepHours}h`],
                  ["Stress", latest.stress],
                  ["Focus", latest.focus],
                  ["Recovery", latest.recovery],
                  ["Water", `${latest.hydrationMl} ml`],
                ].map(([label, value]) => (
                  <div key={String(label)} className="border border-border bg-surface p-2">
                    <span className="block text-[9px] uppercase text-muted-foreground">
                      {label}
                    </span>
                    <b className="tabular text-primary">{value}</b>
                  </div>
                ))}
              </div>
            ) : (
              <Empty title="NO CHECK-IN YET" text="Log today's readiness to activate MEDIC." />
            )}
            <p className="mt-4 border-l-2 border-destructive pl-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              MEDIC READINESS ≠ MEDICAL ASSESSMENT
            </p>
          </div>
        </section>

        {notice && (
          <div
            className="border-2 border-up bg-up/10 px-3 py-2 text-xs font-bold text-up"
            role="status"
          >
            {notice}
          </div>
        )}
        <section id="check-in" className="mil-panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                UNDER 30 SECONDS
              </p>
              <h2 className="pixel-title text-2xl text-primary">
                {editing ? "EDIT DAILY CHECK-IN" : "DAILY CHECK-IN"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Self-reported inputs only. The score is deterministic and transparent.
              </p>
            </div>
            <span className="border border-border px-2 py-1 text-[10px] tabular text-muted-foreground">
              {MEDIC_READINESS_VERSION}
            </span>
          </div>
          <form onSubmit={submitCheckin} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(["energy", "mood", "stress", "focus", "recovery"] as const).map((key) => (
              <Field key={key} label={`${key} / 1–5`}>
                <Select value={form[key]} onChange={(e) => setField(key, e.target.value)}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </Select>
              </Field>
            ))}
            <Field label="Sleep hours">
              <Input
                type="number"
                min="0"
                max="24"
                step="0.25"
                value={form.sleepHours}
                onChange={(e) => setField("sleepHours", e.target.value)}
              />
            </Field>
            <Field label="Sleep quality / 1–5">
              <Select
                value={form.sleepQuality}
                onChange={(e) => setField("sleepQuality", e.target.value)}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
            </Field>
            <Field label="Water / ml">
              <Input
                type="number"
                min="0"
                step="250"
                value={form.hydrationMl}
                onChange={(e) => setField("hydrationMl", e.target.value)}
              />
            </Field>
            <Field label="Activity today">
              <Select value={form.activity} onChange={(e) => setField("activity", e.target.value)}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="planned">Planned</option>
              </Select>
            </Field>
            <Field label="Short note">
              <Input
                value={form.note}
                onChange={(e) => setField("note", e.target.value)}
                placeholder="Optional"
              />
            </Field>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
              <button
                className="min-h-10 border-2 border-primary bg-primary px-4 text-xs font-black uppercase tracking-widest text-primary-foreground hover:bg-primary/80"
                type="submit"
              >
                {editing ? "UPDATE CHECK-IN" : "LOG CHECK-IN"}
              </button>
              {editing && (
                <button
                  type="button"
                  className="min-h-10 border-2 border-border px-4 text-xs font-black uppercase tracking-widest"
                  onClick={() => {
                    setEditing(null);
                    setForm(initialForm);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="mil-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center border-2 border-primary bg-background">
                <img
                  src="/theme/icons/25_medkit.png"
                  alt="PATCH medkit"
                  className="pixel h-10 w-10"
                />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  PATCH // MEDIC BUDDY
                </p>
                <h2 className="pixel-title text-2xl text-primary">BUDDY CHECK-IN</h2>
              </div>
            </div>
            <span className="border border-up px-2 py-1 text-[10px] font-bold text-up">
              NO MEDICAL DETAILS SHARED
            </span>
          </div>
          <div className="grid gap-4 p-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm text-foreground/85">
                Choose a simple status to keep your people informed. PATCH never asks for private
                health details.
              </p>
              <p className="mt-3 border-l-2 border-primary pl-3 text-xs text-muted-foreground">
                {data.buddy.updatedAt
                  ? `${data.buddy.status.toUpperCase()} · expires ${formatTime(data.buddy.expiresAt)}`
                  : "No status shared yet · statuses expire after 24 hours."}
              </p>
              {data.buddy.note && (
                <p className="mt-2 text-xs text-muted-foreground">Note: {data.buddy.note}</p>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {buddyOptions.map(([status, label, response, helper]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setBuddyStatus(status)}
                  className={`border-2 p-3 text-left transition-colors hover:border-primary ${data.buddy.status === status ? "border-primary bg-primary/10" : "border-border bg-background"}`}
                >
                  <span className="block text-xs font-black tracking-widest text-primary">
                    {label}
                  </span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">{helper}</span>
                  <span className="mt-2 block text-[10px] text-foreground/75">{response}</span>
                </button>
              ))}
              <Input
                className="sm:col-span-2"
                value={buddyNote}
                onChange={(event) => setBuddyNote(event.target.value)}
                placeholder="Optional note — keep it non-medical"
                maxLength={120}
              />
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          {modules.slice(0, 6).map(([title, image, description]) => (
            <Section key={title} title={title} image={image}>
              <p className="text-xs text-muted-foreground">{description}</p>
              {title === "RECOVERY TENT" ? (
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    ["LAST NIGHT", latest ? `${latest.sleepHours}h` : "—"],
                    ["QUALITY", latest ? `${latest.sleepQuality}/5` : "NO DATA"],
                    [
                      "7-DAY AVG",
                      weekSleep.length
                        ? `${(weekSleep.reduce((sum, x) => sum + x.sleepHours, 0) / weekSleep.length).toFixed(1)}h`
                        : "NO DATA",
                    ],
                  ].map(([a, b]) => (
                    <div key={a} className="border border-border bg-surface p-2">
                      <b className="block text-[9px] text-muted-foreground">{a}</b>
                      <span className="tabular text-lg text-primary">{b}</span>
                    </div>
                  ))}
                </div>
              ) : title === "RATIONS" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="border border-primary px-3 py-2 text-xs font-bold text-primary"
                    onClick={() => addLog("Hydration", "+250", "ml")}
                  >
                    +250 ML
                  </button>
                  <button
                    className="border border-primary px-3 py-2 text-xs font-bold text-primary"
                    onClick={() => addLog("Hydration", "+500", "ml")}
                  >
                    +500 ML
                  </button>
                  <span className="border border-border px-3 py-2 text-xs text-muted-foreground">
                    TODAY: {latest?.hydrationMl ?? 0} ML
                  </span>
                </div>
              ) : title === "CONDITIONING" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="border border-primary px-3 py-2 text-xs font-bold text-primary"
                    onClick={() => addLog("Conditioning", "Workout")}
                  >
                    LOG WORKOUT
                  </button>
                  <span className="border border-border px-3 py-2 text-xs text-muted-foreground">
                    THIS WEEK: {activityCount} ACTIVE CHECK-IN{activityCount === 1 ? "" : "S"}
                  </span>
                </div>
              ) : title === "MENTAL READINESS" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="border border-border px-3 py-2 text-xs font-bold"
                    onClick={() => addLog("Mood", "Check-in")}
                  >
                    MOOD CHECK
                  </button>
                  <button
                    className="border border-border px-3 py-2 text-xs font-bold"
                    onClick={() => addLog("Stress", "Check-in")}
                  >
                    STRESS CHECK
                  </button>
                  <p className="w-full border-l-2 border-primary pl-3 text-xs text-muted-foreground">
                    {recommendation}
                  </p>
                </div>
              ) : (
                <div className="mt-4 border-l-2 border-primary pl-3 text-xs text-muted-foreground">
                  {title === "MEDIC BAY"
                    ? (readiness?.guidance ?? "No readiness summary yet.")
                    : title === "VITALS"
                      ? latest
                        ? "Latest snapshot is self-reported and time-stamped in Field Log."
                        : "No self-reported vitals yet."
                      : "Use the check-in above to keep this module honest and current."}
                </div>
              )}
            </Section>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          {" "}
          <Section title="FIELD LOG" image="07_field_log.png">
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                className="border border-primary px-3 py-2 text-xs font-bold text-primary"
                onClick={() => setBreathing(60)}
              >
                BREATHE 1:00
              </button>
              <button
                className="border border-primary px-3 py-2 text-xs font-bold text-primary"
                onClick={() => setBreathing(180)}
              >
                BREATHE 3:00
              </button>
              <button
                className="border border-primary px-3 py-2 text-xs font-bold text-primary"
                onClick={() => setBreathing(300)}
              >
                BREATHE 5:00
              </button>
              {breathing > 0 && (
                <span className="border border-up px-3 py-2 text-xs font-bold text-up">
                  TIMER {Math.floor(breathing / 60)}:{String(breathing % 60).padStart(2, "0")}
                </span>
              )}
            </div>
            {data.logs.length ? (
              <div className="space-y-2">
                {data.logs.slice(0, 8).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-2 border-b border-border py-2 text-xs"
                  >
                    <div>
                      <span className="tabular text-primary">{formatTime(entry.timestamp)}</span>
                      <span className="ml-3 font-bold">{entry.type}</span>{" "}
                      <span className="text-muted-foreground">
                        {entry.value}
                        {entry.unit ? ` ${entry.unit}` : ""}
                      </span>
                    </div>
                    <button
                      className="text-[10px] uppercase text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setData((current) => ({
                          ...current,
                          logs: current.logs.filter((item) => item.id !== entry.id),
                        }))
                      }
                    >
                      delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <Empty title="NO FIELD LOG" text="Your self-entered events will appear here." />
            )}
          </Section>
          <Section title="CHECKUP QUEUE" image="08_checkup_queue.png">
            <form onSubmit={addReminder} className="grid gap-2">
              <Input
                placeholder="Reminder title"
                value={reminder.title}
                onChange={(e) => setReminder({ ...reminder, title: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={reminder.category}
                  onChange={(e) => setReminder({ ...reminder, category: e.target.value })}
                >
                  <option>Routine</option>
                  <option>Dental</option>
                  <option>Eye exam</option>
                  <option>Vaccination</option>
                  <option>Appointment</option>
                  <option>Other</option>
                </Select>
                <Input
                  type="date"
                  value={reminder.dueDate}
                  onChange={(e) => setReminder({ ...reminder, dueDate: e.target.value })}
                />
              </div>
              <Input
                placeholder="Notes (optional)"
                value={reminder.notes}
                onChange={(e) => setReminder({ ...reminder, notes: e.target.value })}
              />
              <button
                className="min-h-10 border-2 border-primary bg-primary px-3 text-xs font-black text-primary-foreground"
                type="submit"
              >
                ADD REMINDER
              </button>
            </form>
            <div className="mt-4 space-y-2">
              {data.reminders.length ? (
                data.reminders.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-2 border p-2 text-xs ${item.status === "completed" ? "opacity-50" : "border-primary/50"}`}
                  >
                    <div>
                      <b className={item.status === "completed" ? "line-through" : ""}>
                        {item.title}
                      </b>
                      <span className="ml-2 text-muted-foreground">
                        {item.dueDate ? formatDate(item.dueDate) : "No date"}
                      </span>
                    </div>
                    <button
                      className="text-[10px] uppercase text-primary"
                      onClick={() =>
                        setData((current) => ({
                          ...current,
                          reminders: current.reminders.map((x) =>
                            x.id !== item.id
                              ? x
                              : x.status === "open"
                                ? {
                                    ...x,
                                    status: "completed" as const,
                                    completedAt: new Date().toISOString(),
                                  }
                                : (() => {
                                    const { completedAt: _completedAt, ...reopened } = x;
                                    return { ...reopened, status: "open" as const };
                                  })(),
                          ),
                        }))
                      }
                    >
                      {item.status === "open" ? "complete" : "reopen"}
                    </button>
                  </div>
                ))
              ) : (
                <Empty
                  title="NO CHECKUPS SCHEDULED"
                  text="Add reminders you control; MEDIC never infers medical need."
                />
              )}
            </div>
          </Section>
        </div>

        <Section title="MEDIC BAY / RECENT CHECK-INS" image="01_medic_bay.png">
          <div className="flex flex-wrap gap-2">
            {data.checkins.length ? (
              data.checkins.slice(0, 7).map((item) => (
                <button
                  key={item.id}
                  className="min-w-28 border border-border bg-surface p-3 text-left hover:border-primary"
                  onClick={() => editCheckin(item)}
                >
                  <span className="block text-[10px] text-muted-foreground">
                    {formatDate(item.date)}
                  </span>
                  <b className="tabular text-xl text-primary">{item.readinessScore}</b>
                  <span className="ml-2 text-[10px]">
                    {readinessBand(item.readinessScore).band}
                  </span>
                </button>
              ))
            ) : (
              <Empty title="NO CHECK-IN YET" text="No fake vitals or history are shown here." />
            )}
          </div>
        </Section>
        <footer className="border-t-2 border-primary/30 px-2 py-4 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          MEDIC // WELLNESS TOOL · Not a medical device · Not medical advice · Readiness is
          self-reported, not medical fitness. For potentially urgent symptoms, contact appropriate
          professional or emergency care.
        </footer>
      </div>
    </main>
  );
}
