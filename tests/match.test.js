import test from "node:test";
import assert from "node:assert/strict";
import { Match, pointsAt, shotProbability, hoopFor } from "../js/match.js";
import { TEAMS } from "../js/teams.js";
const tick = (m, seconds, input) => {
  for (let t = 0; t < seconds; t += 0.025) m.update(0.025, input);
};
test("Valeria leads a fictional women’s five-player roster for every club", () => {
  assert.equal(TEAMS[0].players[0], "Valeria");
  assert(TEAMS.every((t) => t.players.length === 5));
  const m = new Match();
  assert.equal(m.players.length, 10);
  assert.equal(m.players.filter((p) => p.side === 1).length, 5);
});
test("movement accelerates, sprint drains stamina, court bounds and pause hold", () => {
  const m = new Match({ practice: true });
  const x = m.controlled.x;
  tick(m, 8, { x: 1, z: 1, sprint: true });
  assert(m.controlled.x > x);
  assert(m.controlled.x <= 8.7);
  assert(m.controlled.z <= 12.5);
  assert(m.controlled.stamina < 1);
  m.paused = true;
  const p = { ...m.controlled },
    time = m.time;
  tick(m, 2, { x: -1, z: -1 });
  assert.deepEqual(m.controlled, p);
  assert.equal(m.time, time);
});
test("timing, pressure and distance affect shots at opposite baskets", () => {
  const p = { x: 0, z: -7, side: 0 };
  assert.equal(pointsAt(p), 2);
  assert.equal(pointsAt({ x: 0, z: 0, side: 0 }), 3);
  assert.equal(pointsAt({ x: 0, z: 8, side: 1 }), 2);
  assert.equal(pointsAt({ x: 0, z: -8, side: 1 }), 3);
  assert(shotProbability(p, 0.73) > shotProbability(p, 0.1));
  assert(shotProbability(p, 0.73, 1) < shotProbability(p, 0.73));
  assert.equal(hoopFor(0).z, -hoopFor(1).z);
});
test("perfect shot counts once and made basket inbounds without resetting all positions", () => {
  const m = new Match({ random: () => 0 });
  m.players[0].x = 0;
  m.players[0].z = -6;
  m.players[2].x = 7.2;
  const untouched = { ...m.players[2] };
  m.beginShot();
  m.charge = 0.73;
  m.releaseShot();
  assert(m.shot.perfect);
  assert.equal(m.stats.perfect, 1);
  // Resolve only the final frame: the AI may move, but a reset would teleport this player to x=6.
  m.shot.t = m.shot.duration - 0.01;
  tick(m, 0.025);
  assert.equal(m.score[0], 2);
  assert.equal(m.stats.made, 1);
  assert.equal(m.team, 1);
  assert.equal(m.owner, 5);
  assert(m.inbound > 0);
  assert(Math.abs(m.players[2].x - untouched.x) < 0.2);
});
test("tap shot is assisted; close sprint produces a dunk and close normal shot a layup", () => {
  const m = new Match({ practice: true, random: () => 0 });
  m.beginShot();
  m.releaseShot();
  assert(m.shot);
  assert.equal(m.feedback, "TIRO ASISTIDO");
  m.reset(0);
  m.players[0].x = 0;
  m.players[0].z = -10;
  m.lastInput.sprint = true;
  m.beginShot();
  m.releaseShot();
  assert.equal(m.shot.kind, "dunk");
  tick(m, 1);
  assert.equal(m.stats.dunks, 1);
  assert.equal(m.score[0], 2);
  m.players[0].x = 0;
  m.players[0].z = -9;
  m.lastInput.sprint = false;
  m.beginShot();
  m.releaseShot();
  assert.equal(m.shot.kind, "layup");
});
test("miss keeps the ball live with gravity and offensive rebounds reset to fourteen", () => {
  const m = new Match({ random: () => 0.5 });
  m.players[0].z = -6;
  m.launch(0, false);
  m.shot.t = m.shot.duration - 0.01;
  tick(m, 0.025);
  assert(m.loose);
  assert.equal(m.team, 0);
  const y = m.loose.y;
  tick(m, 0.4);
  if (m.loose) assert(m.loose.y < y + 0.1);
  m.clock = 3;
  m.collectRebound(2);
  assert.equal(m.team, 0);
  assert.equal(m.owner, 2);
  assert.equal(m.active, 2);
  assert.equal(m.clock, 14);
  assert.equal(m.stats.rebounds, 1);
});
test("defensive rebound starts new possession and preserves court positions", () => {
  const m = new Match();
  m.clock = 3;
  m.spawnLoose(0, -10, 1);
  m.collectRebound(8);
  assert.equal(m.team, 1);
  assert.equal(m.owner, 8);
  assert.equal(m.clock, 24);
  assert.equal(m.loose, null);
});
test("pass direction selects teammate and a shot can be queued while ball arrives", () => {
  const m = new Match({ practice: true, random: () => 0 });
  m.players[0].x = 0;
  m.players[0].z = 0;
  m.players[1].x = -5;
  m.players[1].z = 0;
  m.players[2].x = 5;
  m.players[2].z = 0;
  m.passOrSwitch({ x: 1, z: 0 });
  assert.equal(m.pass.to, 2);
  assert.equal(m.active, 2);
  assert(m.beginShot());
  m.releaseShot();
  tick(m, 0.35);
  assert(m.shot);
  assert.equal(m.shot.from, 2);
  assert.equal(m.stats.shots, 1);
});
test("all five teammates can be targets and catches switch control", () => {
  for (let to = 0; to < 5; to++) {
    const m = new Match({ practice: true });
    m.owner = (to + 1) % 5;
    m.active = m.owner;
    const from = m.owner;
    m.makePass(from, to);
    tick(m, 0.8);
    assert.equal(m.owner, to);
    assert.equal(m.active, to);
    assert.equal(m.pass, null);
  }
});
test("close steal changes possession without teleporting everyone", () => {
  const m = new Match({ random: () => 0 });
  m.reset(1);
  m.lock = 0;
  m.players[0].x = m.carrier.x + 0.5;
  m.players[0].z = m.carrier.z;
  const x = m.players[4].x,
    z = m.players[4].z;
  m.steal();
  assert.equal(m.team, 0);
  assert.equal(m.stats.steals, 1);
  assert.equal(m.players[4].x, x);
  assert.equal(m.players[4].z, z);
});
test("timed block deflects shot into live ball; cannot block from across court", () => {
  const m = new Match();
  m.reset(1);
  m.launch(5, true);
  m.active = 0;
  m.players[0].x = m.players[5].x + 1;
  m.players[0].z = m.players[5].z;
  m.steal();
  assert.equal(m.shot, null);
  assert(m.loose);
  assert.equal(m.stats.blocks, 1);
  const other = new Match();
  other.reset(1);
  other.launch(5, true);
  other.players[0].x = 8;
  other.players[0].z = 12;
  other.steal();
  assert(other.shot);
  assert.equal(other.stats.blocks, 0);
});
test("crossover costs energy, protects the dribble and cannot be spammed", () => {
  const m = new Match();
  m.lastInput = { x: 1, z: 0, sprint: false };
  const x = m.controlled.x;
  m.crossover();
  assert(m.controlled.x > x);
  assert.equal(m.controlled.stamina, 0.8);
  m.crossover();
  assert.equal(m.controlled.stamina, 0.8);
  assert(m.lock > 0);
});
test("assist is recorded after a quick pass and made shot", () => {
  const m = new Match({ practice: true, random: () => 0 });
  m.makePass(0, 1);
  tick(m, 1);
  m.beginShot();
  m.charge = 0.73;
  m.releaseShot();
  tick(m, 1.3);
  assert.equal(m.stats.assists, 1);
});
test("shot clock turnover uses an inbound, not a court reset", () => {
  const m = new Match();
  m.clock = 0.001;
  tick(m, 0.025);
  assert.equal(m.team, 1);
  assert(m.inbound > 0);
  assert.equal(m.clock, 24);
});
test("practice never runs down match time and advances five-canasta challenge", () => {
  const m = new Match({ practice: true });
  for (let i = 0; i < 5; i++) {
    m.launch(0, true);
    tick(m, 1.3);
  }
  assert.equal(m.time, 180);
  assert.equal(m.team, 0);
  assert.equal(m.challenge, 5);
  assert(m.running);
});
test("comeback starts 8-14 at 90s; first-to-21 requires two-point margin", () => {
  const c = new Match({ mode: "comeback" });
  assert.deepEqual(c.score, [8, 14]);
  assert.equal(c.time, 90);
  const m = new Match({ mode: "twentyone" });
  m.score = [21, 20];
  tick(m, 0.025);
  assert(m.running);
  m.score = [22, 20];
  tick(m, 0.025);
  assert.equal(m.running, false);
});
test("ties enter overtime and a shot in flight at the buzzer finishes first", () => {
  const m = new Match();
  m.time = 0.01;
  tick(m, 0.025);
  assert(m.overtime);
  assert.equal(m.time, 30);
  m.score = [2, 0];
  m.time = 0.01;
  m.launch(5, true);
  tick(m, 0.2);
  assert(m.running);
  tick(m, 1);
  assert.equal(m.score[1], 3);
  assert.equal(m.running, false);
});
test("long simulation keeps state finite, bounded, live and ends normally", () => {
  const m = new Match({ random: () => 0.23 });
  for (let i = 0; i < 16000 && m.running; i++) {
    if (m.owner === m.active && !m.shot && !m.pass && !m.loose && !m.inbound) {
      m.beginShot();
      m.charge = 0.73;
      m.releaseShot();
    }
    if (m.loose && i % 15 === 0) {
      m.switchToClosest();
      m.steal();
    }
    m.update(0.025, {
      x: Math.sin(i * 0.02),
      z: Math.cos(i * 0.02),
      sprint: false,
    });
    assert(
      m.players.every(
        (p) =>
          Number.isFinite(p.x) &&
          Number.isFinite(p.z) &&
          Math.abs(p.x) <= 8.7 &&
          Math.abs(p.z) <= 12.5,
      ),
    );
    assert(Number.isFinite(m.clock));
  }
  assert.equal(m.running, false);
  assert(m.score[0] + m.score[1] > 0);
});
