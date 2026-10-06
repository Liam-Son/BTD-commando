export const SIZE = 9;
export const ROUND_MS = 60_000;
export const PATROL_MS = 650;
export type Cell = Readonly<{ x: number; y: number }>;
export type Direction = "up" | "down" | "left" | "right";
export type Phase = "ready" | "running" | "paused" | "over";
export type Run = Readonly<{ phase: Phase; seed: number; player: Cell; patrols: readonly Cell[]; crates: readonly Cell[]; score: number; lives: number; elapsed: number; steps: number }>;
const directions: Record<Direction, Cell> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

export const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
export const inBounds = (p: Cell) => p.x >= 0 && p.y >= 0 && p.x < SIZE && p.y < SIZE;
/** Deterministic LCG, deliberately kept separate from UI/time. */
export function random(seed: number): [number, number] { const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return [next / 4294967296, next]; }
export function spawn(seed: number, occupied: readonly Cell[]): [Cell, number] {
  const free: Cell[] = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) { const cell = { x, y }; if (!occupied.some((p) => same(p, cell))) free.push(cell); }
  if (!free.length) throw new Error("No free supply cell");
  const [value, next] = random(seed); return [free[Math.floor(value * free.length)], next];
}
export function createRun(seed = 1, phase: Phase = "ready"): Run {
  const player = { x: 4, y: 4 }; const patrols: Cell[] = []; const crates: Cell[] = [];
  for (let i = 0; i < 3; i++) { const [p, next] = spawn(seed, [player, ...patrols, ...crates]); seed = next; patrols.push(p); }
  for (let i = 0; i < 4; i++) { const [p, next] = spawn(seed, [player, ...patrols, ...crates]); seed = next; crates.push(p); }
  return { phase, seed, player, patrols, crates, score: 0, lives: 3, elapsed: 0, steps: 0 };
}
export const start = (s: Run): Run => s.phase === "ready" ? { ...s, phase: "running" } : s;
export const pause = (s: Run): Run => s.phase === "running" ? { ...s, phase: "paused" } : s;
export const resume = (s: Run): Run => s.phase === "paused" ? { ...s, phase: "running" } : s;
function hit(s: Run): Run { const lives = s.lives - 1; const [player, seed] = spawn(s.seed, [...s.patrols, ...s.crates]); return { ...s, player, seed, lives, phase: lives ? s.phase : "over" }; }
export function move(s: Run, direction: Direction): Run {
  if (s.phase !== "running") return s;
  const d = directions[direction], player = { x: s.player.x + d.x, y: s.player.y + d.y };
  if (!inBounds(player)) return s;
  let next: Run = { ...s, player };
  if (s.patrols.some((p) => same(p, player))) return hit(next);
  if (s.crates.some((p) => same(p, player))) { const crates = s.crates.filter((p) => !same(p, player)); const [crate, seed] = spawn(s.seed, [player, ...s.patrols, ...crates]); next = { ...next, crates: [...crates, crate], seed, score: s.score + 100 }; }
  return next;
}
function patrol(s: Run): Run {
  let seed = s.seed; const patrols = [...s.patrols]; const order: Direction[] = ["up", "right", "down", "left"];
  for (let i = 0; i < patrols.length; i++) { const [value, next] = random(seed); seed = next; const d = directions[order[Math.floor(value * order.length)]], p = { x: patrols[i].x + d.x, y: patrols[i].y + d.y }; if (inBounds(p) && !s.crates.some((c) => same(c, p)) && !patrols.some((c, j) => j !== i && same(c, p))) patrols[i] = p; }
  const next = { ...s, seed, patrols, steps: s.steps + 1 };
  return patrols.some((p) => same(p, next.player)) ? hit(next) : next;
}
/** Advance with active monotonic milliseconds; callers pause the clock while hidden. */
export function advance(s: Run, activeElapsed: number): Run {
  if (s.phase !== "running" || !Number.isFinite(activeElapsed)) return s;
  const elapsed = Math.min(ROUND_MS, Math.max(s.elapsed, activeElapsed)); let next: Run = { ...s, elapsed };
  for (const target = Math.floor(elapsed / PATROL_MS); next.steps < target && next.phase === "running";) next = patrol(next);
  return elapsed >= ROUND_MS && next.phase === "running" ? { ...next, phase: "over" } : next;
}
