export const MEDIC_READINESS_VERSION = "medic_readiness_v1" as const;
export const MEDIC_STORAGE_KEYS = {
  checkins: "btd.medic.checkins.v1",
  logs: "btd.medic.logs.v1",
  reminders: "btd.medic.reminders.v1",
  settings: "btd.medic.settings.v1",
} as const;

export type ReadinessBand = "GREEN" | "AMBER" | "ORANGE" | "RED";
export type Checkin = {
  id: string;
  date: string;
  energy: number;
  mood: number;
  stress: number;
  focus: number;
  recovery: number;
  sleepHours: number;
  sleepQuality: number;
  hydrationMl: number;
  activity: "yes" | "no" | "planned";
  note: string;
  readinessScore: number;
  readinessVersion: typeof MEDIC_READINESS_VERSION;
  createdAt: string;
  updatedAt: string;
};
export type LogEntry = {
  id: string;
  timestamp: string;
  type: string;
  value: string;
  unit?: string;
  note?: string;
  source: "self-reported";
};
export type Reminder = {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  status: "open" | "completed";
  notes: string;
  completedAt?: string;
};
export type MedicSettings = {
  hydrationTarget: number;
  sleepTarget: number;
  weeklyActivityTarget: number;
};

export const DEFAULT_SETTINGS: MedicSettings = {
  hydrationTarget: 2000,
  sleepTarget: 8,
  weeklyActivityTarget: 3,
};
export const READINESS_WEIGHTS = {
  sleep: 0.25,
  energy: 0.2,
  stress: 0.2,
  recovery: 0.15,
  mood: 0.1,
  focus: 0.1,
} as const;

const finite = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const score5 = (value: number) => clamp(value, 1, 5) * 20;

export function readinessScore(
  input: Pick<Checkin, "sleepHours" | "energy" | "stress" | "recovery" | "mood" | "focus">,
) {
  const sleep = clamp((input.sleepHours / 8) * 100, 0, 100);
  const stress = 100 - score5(input.stress) + 20;
  return Math.round(
    sleep * READINESS_WEIGHTS.sleep +
      score5(input.energy) * READINESS_WEIGHTS.energy +
      stress * READINESS_WEIGHTS.stress +
      score5(input.recovery) * READINESS_WEIGHTS.recovery +
      score5(input.mood) * READINESS_WEIGHTS.mood +
      score5(input.focus) * READINESS_WEIGHTS.focus,
  );
}

export function readinessBand(score: number): {
  band: ReadinessBand;
  label: string;
  guidance: string;
} {
  if (score >= 80)
    return {
      band: "GREEN",
      label: "READY",
      guidance: "Maintain the routine and protect recovery.",
    };
  if (score >= 60)
    return {
      band: "AMBER",
      label: "MANAGE LOAD",
      guidance: "Keep today's workload manageable and support recovery.",
    };
  if (score >= 40)
    return {
      band: "ORANGE",
      label: "RECOVERY PRIORITY",
      guidance: "Consider lighter activity, rest, and a simple reset.",
    };
  return {
    band: "RED",
    label: "REST / CHECK IN",
    guidance: "Pause, rest, and consider appropriate professional support if concerned.",
  };
}

export function makeCheckin(
  values: Omit<Checkin, "id" | "readinessScore" | "readinessVersion" | "createdAt" | "updatedAt">,
  existing?: Checkin,
): Checkin {
  const now = new Date().toISOString();
  return {
    ...values,
    id: existing?.id ?? crypto.randomUUID(),
    readinessScore: readinessScore(values),
    readinessVersion: MEDIC_READINESS_VERSION,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function read<T>(storage: Storage | null, key: string, fallback: T): T {
  if (!storage) return fallback;
  try {
    const value = JSON.parse(storage.getItem(key) ?? "null");
    return value === null ? fallback : (value as T);
  } catch {
    return fallback;
  }
}
function write(storage: Storage | null, key: string, value: unknown) {
  try {
    storage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function loadMedic(storage: Storage | null) {
  const checkins = read<Checkin[]>(storage, MEDIC_STORAGE_KEYS.checkins, []).filter(
    (x) => x && typeof x.id === "string",
  );
  const logs = read<LogEntry[]>(storage, MEDIC_STORAGE_KEYS.logs, []).filter(
    (x) => x && typeof x.id === "string",
  );
  const reminders = read<Reminder[]>(storage, MEDIC_STORAGE_KEYS.reminders, []).filter(
    (x) => x && typeof x.id === "string",
  );
  const raw = read<Partial<MedicSettings>>(storage, MEDIC_STORAGE_KEYS.settings, {});
  const settings = {
    hydrationTarget: finite(raw.hydrationTarget, DEFAULT_SETTINGS.hydrationTarget),
    sleepTarget: finite(raw.sleepTarget, DEFAULT_SETTINGS.sleepTarget),
    weeklyActivityTarget: finite(raw.weeklyActivityTarget, DEFAULT_SETTINGS.weeklyActivityTarget),
  };
  return { checkins, logs, reminders, settings };
}
export function saveMedic(storage: Storage | null, data: ReturnType<typeof loadMedic>) {
  return [
    write(storage, MEDIC_STORAGE_KEYS.checkins, data.checkins),
    write(storage, MEDIC_STORAGE_KEYS.logs, data.logs),
    write(storage, MEDIC_STORAGE_KEYS.reminders, data.reminders),
    write(storage, MEDIC_STORAGE_KEYS.settings, data.settings),
  ].every(Boolean);
}
export function newLog(type: string, value: string, unit?: string, note?: string): LogEntry {
  const entry: LogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    value,
    source: "self-reported",
  };
  if (unit !== undefined) entry.unit = unit;
  if (note !== undefined) entry.note = note;
  return entry;
}
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
