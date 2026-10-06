import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const source = await readFile(new URL("../src/lib/supply-run.ts", import.meta.url), "utf8");
const js = stripTypeScriptTypes(source, { mode: "strip", sourceUrl: "supply-run.ts" });
const game = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const { ROUND_MS, advance, createRun, move, pause, random, resume, same, spawn, start } = game;
const running = (seed = 42) => start(createRun(seed));

assert.deepEqual(createRun(42), createRun(42), "a seed must reproduce an identical board");
const [r, next] = random(9); assert.ok(r >= 0 && r < 1 && Number.isInteger(next), "PRNG has a bounded value and integer state");
const [cell] = spawn(1, [{ x: 0, y: 0 }]); assert.ok(!same(cell, { x: 0, y: 0 }), "spawning never uses occupied cells");
const initial = createRun(1); assert.equal(start(initial).phase, "running"); assert.equal(resume(pause(start(initial))).phase, "running", "pause/resume are explicit phase transitions");
assert.deepEqual(move(running(), "left"), move(running(), "left"), "pure moves are repeatable");
for (let seed = 1; seed <= 100; seed++) {
  const board = createRun(seed);
  assert.equal(new Set([board.player, ...board.crates, ...board.patrols].map((p) => `${p.x},${p.y}`)).size, 8, "initial occupants must not overlap");
  assert.equal(move(board, "left"), board, "ready runs cannot move");
}
assert.equal(move(pause(running()), "right").phase, "paused", "paused runs cannot move");
assert.equal(advance(pause(running()), 5_000).elapsed, 0, "paused clocks cannot advance");
const collect = { ...running(2), player: { x: 0, y: 0 }, crates: [{ x: 1, y: 0 }], patrols: [{ x: 8, y: 8 }] };
const collected = move(collect, "right"); assert.equal(collected.score, 100, "a crate awards supplies"); assert.equal(collected.crates.length, 1, "crate is respawned after collection");
const danger = { ...running(2), player: { x: 0, y: 0 }, crates: [], patrols: [{ x: 1, y: 0 }] };
assert.equal(move(danger, "right").lives, 2, "a patrol costs exactly one life");
const a = advance(running(77), 4_000), b = advance(running(77), 4_000); assert.deepEqual(a, b, "patrol simulation is deterministic");
const timed = { ...running(), patrols: [], crates: [] };
assert.equal(advance(timed, ROUND_MS).phase, "over", "round expires at sixty seconds without requiring a collision");
const moving = running(42); const preserved = JSON.stringify(moving);
move(moving, "right"); advance(moving, 1000);
assert.equal(JSON.stringify(moving), preserved, "transitions do not mutate their input");
const lastLife = { ...danger, lives: 1 };
assert.equal(move(lastLife, "right").phase, "over", "the final collision ends the round");
const frozen = running(); assert.equal(advance(frozen, Number.NaN), frozen, "invalid clocks cannot mutate state");
console.log("Supply Run checks passed: deterministic seed, spawn safety, phases, collect, collision, patrols, timer.");
