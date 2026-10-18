export const TEAM_SIZE = 5;
export const HOOP = { x: 0, z: -11.65, y: 3.05 };
export const hoopFor = (side) => ({
  x: 0,
  z: side === 0 ? -11.65 : 11.65,
  y: 3.05,
});
export const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function pointsAt(p) {
  return dist(p, hoopFor(p.side ?? 0)) > 6.75 ? 3 : 2;
}
export function shotProbability(p, charge, pressure = 0) {
  const d = dist(p, hoopFor(p.side ?? 0));
  const quality = Math.max(0, 1 - Math.abs(charge - 0.73) * 3.1);
  return clamp(
    0.33 + quality * 0.68 - d * 0.025 - pressure * 0.25,
    0.03,
    0.985,
  );
}
export class Match {
  constructor({
    practice = false,
    difficulty = "normal",
    mode = "match",
    random = Math.random,
  } = {}) {
    Object.assign(this, {
      practice,
      difficulty,
      mode,
      random,
      score: mode === "comeback" ? [8, 14] : [0, 0],
      time: mode === "comeback" ? 90 : 180,
      clock: 24,
      team: 0,
      active: 0,
      running: true,
      paused: false,
      overtime: false,
      shot: null,
      pass: null,
      loose: null,
      inbound: 0,
      held: false,
      charge: 0,
      lock: 1,
      aiWait: 0,
      elapsed: 0,
      notice: "¡Vamos, Valeria!",
      noticeTime: 3,
      event: { id: 0, type: "start", side: 0 },
      feedback: "",
      feedbackTime: 0,
      heat: 0,
      streak: 0,
      lastInput: { x: 0, z: 0, sprint: false },
      lastPass: null,
      shotQueue: null,
      challenge: 0,
      stats: {
        shots: 0,
        made: 0,
        steals: 0,
        rebounds: 0,
        assists: 0,
        blocks: 0,
        dunks: 0,
        perfect: 0,
      },
    });
    this.players = Array.from({ length: TEAM_SIZE * 2 }, (_, i) => ({
      x: 0,
      z: 0,
      side: i < TEAM_SIZE ? 0 : 1,
      index: i % TEAM_SIZE,
      stamina: 1,
      move: 0,
      speed: 0,
      angle: i < TEAM_SIZE ? Math.PI : 0,
      jump: 0,
      action: "",
      actionTime: 0,
      vx: 0,
      vz: 0,
      reach: 0,
    }));
    this.owner = 0;
    this.reset(0);
  }
  message(s, duration = 2.2) {
    this.notice = s;
    this.noticeTime = duration;
  }
  emit(type, side = 0, extra = {}) {
    this.event = { id: this.event.id + 1, type, side, ...extra };
  }
  get controlled() {
    return this.players[this.active];
  }
  get carrier() {
    return this.players[this.owner];
  }
  get ballFocus() {
    if (this.loose) return this.loose;
    if (this.shot) {
      const s = this.shot,
        t = clamp(s.t / s.duration, 0, 1);
      return {
        x: s.x + (s.target.x - s.x) * t,
        z: s.z + (s.target.z - s.z) * t,
      };
    }
    if (this.pass) {
      const s = this.pass,
        p = this.players[s.to],
        t = clamp(s.t / s.duration, 0, 1);
      return { x: s.x + (p.x - s.x) * t, z: s.z + (p.z - s.z) * t };
    }
    return this.carrier;
  }
  reset(side) {
    this.team = side;
    this.clock = 24;
    this.owner = side * TEAM_SIZE;
    this.active = 0;
    this.shotQueue = null;
    this.lock = 1.4;
    this.aiWait = 0;
    this.held = false;
    this.charge = 0;
    this.pass = this.loose = this.shot = null;
    const dir = side === 0 ? -1 : 1;
    const offense = [
        [-1, -2],
        [-6, 1],
        [6, 1],
        [-3, 4],
        [3, 6],
      ],
      defense = [
        [-1, 1],
        [-5, 3],
        [5, 3],
        [-2, 6],
        [2, 8],
      ];
    this.players.forEach((p) => {
      const a = p.side === side ? offense[p.index] : defense[p.index];
      p.x = a[0];
      p.z = a[1] * dir;
      p.move = p.speed = p.jump = p.actionTime = 0;
    });
  }
  takePossession(i, reason = "") {
    const old = this.team;
    this.owner = i;
    this.team = this.players[i].side;
    this.loose = null;
    this.pass = null;
    this.held = false;
    this.charge = 0;
    this.aiWait = 0;
    this.lock = 0.8;
    if (old !== this.team) {
      this.clock = 24;
      this.lastPass = null;
    } else if (reason === "rebound") this.clock = Math.max(this.clock, 14);
    if (this.team === 0) this.active = i;
    else this.switchToClosest();
  }
  inboundAfter(side) {
    if (this.practice) {
      this.reset(0);
      return;
    }
    this.team = side;
    this.owner = side * TEAM_SIZE;
    this.carrier.x = 0;
    this.carrier.z = side === 0 ? 12.1 : -12.1;
    this.clock = 24;
    this.aiWait = 0;
    this.inbound = 0.85;
    this.lock = 1.6;
    this.held = false;
    this.charge = 0;
    this.lastPass = null;
    if (side === 0) this.active = 0;
    else this.switchToClosest();
  }
  beginShot() {
    if (
      this.running &&
      !this.paused &&
      this.pass?.to === this.active &&
      this.team === 0
    ) {
      this.shotQueue = { released: false };
      return true;
    }
    if (
      !this.running ||
      this.paused ||
      this.shot ||
      this.pass ||
      this.loose ||
      this.inbound > 0 ||
      this.owner !== this.active
    )
      return false;
    this.held = true;
    this.charge = 0;
    return true;
  }
  releaseShot() {
    if (this.shotQueue) {
      this.shotQueue.released = true;
      return;
    }
    if (!this.held) return;
    this.held = false;
    if (
      !this.running ||
      this.paused ||
      this.shot ||
      this.pass ||
      this.loose ||
      this.owner !== this.active
    )
      return;
    const p = this.carrier,
      d = dist(p, hoopFor(p.side));
    const pressure = Math.max(
      0,
      ...this.players
        .filter((a) => a.side !== p.side)
        .map((a) => clamp(1 - dist(a, p) / 2.6, 0, 1)),
    );
    const kind =
      d < 2.5 && p.stamina > 0.2 && this.lastInput.sprint
        ? "dunk"
        : d < 3.5
          ? "layup"
          : "jumper";
    // A quick tap takes an assisted shot. Holding the button rewards precise timing.
    const quick = this.charge < 0.16,
      timing = quick ? 0.54 : this.charge;
    const perfect = !quick && Math.abs(timing - 0.73) < 0.065;
    const chance =
      kind === "dunk"
        ? clamp(0.98 - pressure * 0.14, 0.65, 0.99)
        : kind === "layup"
          ? clamp(0.92 - pressure * 0.25, 0.5, 0.97)
          : clamp(
              shotProbability(p, timing, pressure) + this.heat * 0.06,
              0.03,
              0.99,
            );
    this.launch(this.owner, this.random() < chance, kind, perfect);
    this.stats.shots++;
    if (perfect) this.stats.perfect++;
    this.feedback =
      kind === "dunk"
        ? "¡MATE!"
        : kind === "layup"
          ? "ENTRADA A CANASTA"
          : perfect
            ? "¡PERFECTO!"
            : quick
              ? "TIRO ASISTIDO"
              : timing < 0.65
                ? "ALGO PRONTO"
                : timing > 0.82
                  ? "ALGO TARDE"
                  : "BUEN TIRO";
    this.feedbackTime = 1.9;
    this.emit("release", 0, { perfect, kind });
    this.charge = 0;
  }
  launch(i, made, kind = "jumper", perfect = false) {
    const p = this.players[i],
      target = hoopFor(p.side),
      d = dist(p, target);
    this.shot = {
      from: i,
      side: p.side,
      x: p.x,
      z: p.z,
      t: 0,
      duration: kind === "dunk" ? 0.68 : kind === "layup" ? 0.85 : 1.12,
      made,
      points: pointsAt(p),
      target,
      kind,
      perfect,
      blocked: false,
    };
    p.action = kind;
    p.actionTime = kind === "dunk" ? 0.95 : 0.8;
    p.jump = kind === "dunk" ? 0.85 : 0.5;
    if (kind === "dunk" || kind === "layup") {
      p.actionFrom = { x: p.x, z: p.z };
      p.actionTo = {
        x: target.x + (p.x < 0 ? -0.35 : 0.35),
        z: target.z + (p.side === 0 ? 0.45 : -0.45),
      };
    }
    this.lock = 0.7;
  }
  switchToClosest() {
    const focus = this.ballFocus;
    this.active = this.players
      .slice(0, TEAM_SIZE)
      .map((p, i) => ({ i, d: dist(p, focus) }))
      .sort((a, b) => a.d - b.d)[0].i;
  }
  passOrSwitch(direction = this.lastInput) {
    if (!this.running || this.paused || this.pass || this.inbound > 0) return;
    if (this.shot || this.loose || this.team !== 0) {
      const current = this.active;
      this.switchToClosest();
      if (this.active === current) {
        const n = this.players
          .slice(0, TEAM_SIZE)
          .map((p, i) => ({ i, d: dist(p, this.ballFocus) }))
          .sort((a, b) => a.d - b.d);
        this.active = n[1].i;
      }
      return;
    }
    if (this.owner !== this.active) {
      this.active = this.owner;
      return;
    }
    const from = this.owner,
      origin = this.carrier,
      aim = Math.hypot(direction.x || 0, direction.z || 0);
    const candidates = this.players
      .slice(0, TEAM_SIZE)
      .map((p, i) => {
        const d = dist(p, origin) || 0.01,
          alignment =
            aim > 0.15
              ? ((p.x - origin.x) * direction.x +
                  (p.z - origin.z) * direction.z) /
                (d * aim)
              : 0;
        return { i, value: aim > 0.15 ? alignment * 12 - d * 0.16 : -d };
      })
      .filter((a) => a.i !== from)
      .sort((a, b) => b.value - a.value);
    this.makePass(from, candidates[0].i);
  }
  makePass(from, to) {
    const p = this.players[from];
    this.pass = {
      from,
      to,
      t: 0,
      duration: clamp(dist(p, this.players[to]) / 20, 0.22, 0.7),
      x: p.x,
      z: p.z,
    };
    p.action = "pass";
    p.actionTime = 0.35;
    this.held = false;
    this.charge = 0;
    if (p.side === 0) {
      this.active = to;
      this.lastPass = { from, to, at: this.elapsed };
    }
    this.emit("pass", p.side);
  }
  steal() {
    if (!this.running || this.paused || this.inbound > 0) return;
    const p = this.controlled;
    if (this.loose || this.shot) {
      if (p.actionTime > 0.1) return;
      p.jump = 0.65;
      p.action = "block";
      p.actionTime = 0.7;
      p.reach = 0.65;
      if (
        this.shot &&
        this.shot.side === 1 &&
        this.shot.t < this.shot.duration * 0.55 &&
        dist(p, this.players[this.shot.from]) < 2.25
      ) {
        const s = this.shot;
        this.shot = null;
        this.spawnLoose(p.x, p.z, 2.8, 0.2, 0);
        this.stats.blocks++;
        this.message("¡TAPÓN! Balón suelto");
        this.emit("block", 0);
      } else if (this.loose && dist(p, this.loose) < 2 && this.loose.y < 2.9)
        this.collectRebound(this.active);
      return;
    }
    if (this.pass || this.team === 0 || this.lock > 0) return;
    this.lock = 0.7;
    p.action = "steal";
    p.actionTime = 0.4;
    if (dist(p, this.carrier) < 1.9 && this.random() < 0.78) {
      this.takePossession(this.active);
      this.stats.steals++;
      this.heat = clamp(this.heat + 0.12, 0, 1);
      this.message("¡ROBO! Sal al contraataque");
      this.emit("steal", 0);
    } else this.message("Acércate y anticipa el bote", 1.3);
  }
  crossover() {
    if (
      !this.running ||
      this.paused ||
      this.owner !== this.active ||
      this.shot ||
      this.pass ||
      this.loose ||
      this.controlled.stamina < 0.2 ||
      this.controlled.actionTime > 0.1
    )
      return;
    const p = this.controlled;
    p.stamina -= 0.2;
    p.action = "crossover";
    p.actionTime = 0.5;
    p.x = clamp(
      p.x + (this.lastInput.x || (p.x > 0 ? -1 : 1)) * 0.9,
      -8.5,
      8.5,
    );
    this.lock = 0.9;
    const defender = this.players
      .slice(TEAM_SIZE)
      .sort((a, b) => dist(a, p) - dist(b, p))[0];
    if (dist(defender, p) < 2.7) {
      defender.action = "stumble";
      defender.actionTime = 0.6;
      this.message("¡Cambio de mano!", 1.1);
    }
    this.emit("crossover", 0);
  }
  spawnLoose(x, z, y = 3.05, vx, vz) {
    this.loose = {
      x,
      z,
      y,
      vx: vx ?? (this.random() - 0.5) * 4.2,
      vz: vz ?? (this.random() - 0.5) * 4.2,
      vy: 1,
      t: 0,
    };
    this.held = false;
  }
  collectRebound(i) {
    const offensive = this.players[i].side === this.team;
    this.takePossession(i, "rebound");
    this.players[i].action = "catch";
    this.players[i].actionTime = 0.3;
    if (this.team === 0) {
      this.stats.rebounds++;
      this.heat = clamp(this.heat + 0.06, 0, 1);
    }
    this.message(
      offensive
        ? "¡Rebote ofensivo! Otra oportunidad"
        : this.team === 0
          ? "¡REBOTE! Corre al ataque"
          : "Rebote rival. ¡Repliega!",
    );
    this.emit("rebound", this.team);
  }
  move(p, x, z, speed, dt) {
    const n = Math.hypot(x, z),
      moving = n > 0.08;
    const factor = p.action === "stumble" && p.actionTime > 0 ? 0.25 : 1;
    const desiredX = moving ? (x / Math.max(1, n)) * speed * factor : 0,
      desiredZ = moving ? (z / Math.max(1, n)) * speed * factor : 0;
    const lerp = Math.min(1, dt * 13);
    p.vx += (desiredX - p.vx) * lerp;
    p.vz += (desiredZ - p.vz) * lerp;
    p.x = clamp(p.x + p.vx * dt, -8.7, 8.7);
    p.z = clamp(p.z + p.vz * dt, -12.5, 12.5);
    p.speed = Math.hypot(p.vx, p.vz);
    p.move = clamp(p.speed / 4.3, 0, 1.5);
    if (p.speed > 0.2) p.angle = Math.atan2(p.vx, p.vz);
  }
  runAI(dt) {
    const dir = this.team === 0 ? -1 : 1,
      basket = hoopFor(this.team),
      carrier = this.carrier;
    const difficultySpeed =
      this.difficulty === "hard"
        ? 4.8
        : this.difficulty === "easy"
          ? 3.35
          : 4.1;
    for (let i = 0; i < this.players.length; i++) {
      if (i === this.active) continue;
      const a = this.players[i];
      if (this.practice && a.side === 1) continue;
      if (i === this.owner && this.inbound > 0) {
        a.vx = a.vz = 0;
        a.move = 0;
        continue;
      }
      let tx,
        tz,
        speed = a.side === 1 ? difficultySpeed : 4.55;
      if (this.loose) {
        const closest = this.players
          .filter((p) => p.side === a.side)
          .sort((u, v) => dist(u, this.loose) - dist(v, this.loose))
          .slice(0, 2);
        if (closest.includes(a)) {
          tx = this.loose.x;
          tz = this.loose.z;
          speed += 0.8;
        } else {
          tx = a.x;
          tz = a.z;
        }
      } else if (this.shot) {
        tx = basket.x + (a.index - 2) * 1.3;
        tz = basket.z - dir * (1.8 + a.index * 0.4);
      } else if (a.side === this.team) {
        if (i === this.owner) {
          tx = Math.sin(this.aiWait * 0.9) * 2.8;
          tz = dir * 8.8;
        } else {
          const spots = [
            [0, 3],
            [-6.3, 6.2],
            [6.3, 6.2],
            [-3.4, 9],
            [3.1, 9.5],
          ];
          tx =
            spots[a.index][0] + Math.sin(this.elapsed * 0.65 + a.index) * 0.8;
          const progress = Math.max(-6, carrier.z * dir);
          tz = dir * Math.min(spots[a.index][1], progress + 4 + a.index * 0.25);
          // Off-ball cuts prevent four static teammates standing on fixed marks.
          if (a.index > 2 && Math.sin(this.elapsed * 0.65 + a.index * 2) > 0.65)
            tx *= 0.45;
        }
      } else {
        const mark = this.players[(1 - a.side) * TEAM_SIZE + a.index],
          ownHoop = hoopFor(mark.side);
        const nearest = this.players
          .filter((p) => p.side === a.side)
          .sort((u, v) => dist(u, carrier) - dist(v, carrier))[0];
        const target = nearest === a ? carrier : mark;
        tx = target.x * 0.91;
        tz = target.z * 0.84 + ownHoop.z * 0.16;
        if (nearest === a && dist(a, carrier) < 2) {
          tx = carrier.x;
          tz = carrier.z + (ownHoop.z > carrier.z ? 0.95 : -0.95);
        }
      }
      const dx = tx - a.x,
        dz = tz - a.z;
      this.move(a, dx, dz, Math.hypot(dx, dz) < 0.25 ? 0 : speed, dt);
    }
    if (
      this.team === 1 &&
      !this.shot &&
      !this.pass &&
      !this.loose &&
      this.inbound <= 0
    ) {
      this.aiWait += dt;
      const d = dist(carrier, basket),
        closest = Math.min(
          ...this.players.slice(0, TEAM_SIZE).map((a) => dist(a, carrier)),
        );
      if ((this.aiWait > 1.8 && d < 5.8) || this.clock < 1.5 || d < 2.3) {
        const kind = d < 2.2 ? "layup" : "jumper",
          base =
            this.difficulty === "hard"
              ? 0.76
              : this.difficulty === "easy"
                ? 0.38
                : 0.58;
        this.launch(
          this.owner,
          this.random() <
            base + (kind === "layup" ? 0.2 : 0) - (closest < 1.8 ? 0.24 : 0),
          kind,
        );
      } else if (this.aiWait > 1.1 && closest < 2 && this.random() < dt * 1.4) {
        const candidates = this.players
          .slice(TEAM_SIZE)
          .map((p, j) => ({
            i: j + TEAM_SIZE,
            space:
              Math.min(
                ...this.players.slice(0, TEAM_SIZE).map((d) => dist(p, d)),
              ) -
              dist(p, basket) * 0.12,
          }))
          .filter((p) => p.i !== this.owner)
          .sort((a, b) => b.space - a.space);
        this.makePass(this.owner, candidates[0].i);
        this.aiWait = 0;
      }
    }
    if (
      this.team === 0 &&
      !this.shot &&
      !this.pass &&
      !this.loose &&
      !this.held &&
      this.lock <= 0 &&
      this.inbound <= 0
    ) {
      const near = this.players
        .slice(TEAM_SIZE)
        .filter((a) => a.action !== "stumble" && dist(a, carrier) < 0.95);
      if (
        near.length &&
        this.random() < dt * (this.difficulty === "hard" ? 0.75 : 0.3)
      ) {
        const i = this.players.indexOf(near[0]);
        this.takePossession(i);
        this.message("Balón rival. ¡Vuelve a defender!");
        this.emit("steal", 1);
      }
    }
  }
  update(dt, input = { x: 0, z: 0, sprint: false }) {
    if (!this.running || this.paused) return;
    dt = Math.min(dt, 0.05);
    this.elapsed += dt;
    this.lastInput = input;
    this.noticeTime = Math.max(0, this.noticeTime - dt);
    this.feedbackTime = Math.max(0, this.feedbackTime - dt);
    this.lock -= dt;
    this.inbound = Math.max(0, this.inbound - dt);
    this.heat = Math.max(0, this.heat - dt * 0.006);
    this.players.forEach((p) => {
      p.jump = Math.max(0, p.jump - dt * 1.1);
      p.reach = Math.max(0, p.reach - dt);
      p.actionTime = Math.max(0, p.actionTime - dt);
      if (!p.actionTime) p.action = "";
    });
    if (!this.practice && this.mode !== "twentyone")
      this.time = Math.max(0, this.time - dt);
    if (!this.shot && !this.loose && this.inbound <= 0) this.clock -= dt;
    if (this.held) this.charge = Math.min(1, this.charge + dt * 0.8);
    const p = this.controlled,
      sprint = input.sprint && p.stamina > 0.08;
    p.stamina = clamp(
      p.stamina +
        dt *
          (sprint && Math.hypot(input.x || 0, input.z || 0) > 0.1
            ? -0.17
            : 0.13),
      0,
      1,
    );
    this.move(
      p,
      input.x || 0,
      input.z || 0,
      (sprint ? 6.35 : 4.6) *
        (this.held ? 0.35 : 1) *
        (this.inbound > 0 && this.owner === this.active ? 0 : 1),
      dt,
    );
    if (!this.practice) this.runAI(dt);
    if (this.shot && ["dunk", "layup"].includes(this.shot.kind)) {
      const a = this.players[this.shot.from],
        k = clamp(this.shot.t / this.shot.duration, 0, 1);
      a.x = a.actionFrom.x + (a.actionTo.x - a.actionFrom.x) * k;
      a.z = a.actionFrom.z + (a.actionTo.z - a.actionFrom.z) * k;
    }
    // Resolve physical separation with zero-distance fallback; clamp every player afterwards.
    if (!this.practice)
      for (let i = 0; i < this.players.length; i++)
        for (let j = i + 1; j < this.players.length; j++) {
          const a = this.players[i],
            b = this.players[j],
            dx = a.x - b.x,
            dz = a.z - b.z,
            d = Math.hypot(dx, dz);
          if (d < 0.68) {
            const nx = d > 0.001 ? dx / d : 1,
              nz = d > 0.001 ? dz / d : 0,
              push = (0.68 - d) * 0.5;
            a.x += nx * push;
            a.z += nz * push;
            b.x -= nx * push;
            b.z -= nz * push;
          }
        }
    this.players.forEach((a) => {
      a.x = clamp(a.x, -8.7, 8.7);
      a.z = clamp(a.z, -12.5, 12.5);
    });
    if (this.pass) {
      this.pass.t += dt;
      if (this.pass.t >= this.pass.duration) {
        const to = this.pass.to;
        this.owner = to;
        this.team = this.carrier.side;
        this.pass = null;
        this.lock = 0.45;
        this.carrier.action = "catch";
        this.carrier.actionTime = 0.28;
        if (this.shotQueue) {
          const released = this.shotQueue.released;
          this.shotQueue = null;
          this.held = true;
          this.charge = 0;
          if (released) this.releaseShot();
        }
      }
    }
    if (this.shot) {
      this.shot.t += dt;
      if (this.shot.t >= this.shot.duration) {
        const s = this.shot;
        this.shot = null;
        if (s.made) {
          this.score[s.side] += s.points;
          if (s.side === 0) {
            this.stats.made++;
            this.streak++;
            this.heat = clamp(this.heat + 0.19, 0, 1);
            if (s.kind === "dunk") this.stats.dunks++;
            if (
              this.lastPass?.to === s.from &&
              this.elapsed - this.lastPass.at < 4
            )
              this.stats.assists++;
          } else {
            this.streak = 0;
            this.heat = Math.max(0, this.heat - 0.07);
          }
          this.message(
            s.side === 0
              ? s.kind === "dunk"
                ? "¡MATE! Así se juega"
                : s.points === 3
                  ? "¡TRIPLAZO! +3"
                  : "¡CANASTA! +2"
              : `Canasta rival +${s.points}`,
          );
          this.emit("score", s.side, {
            points: s.points,
            kind: s.kind,
            perfect: s.perfect,
          });
          this.inboundAfter(this.practice ? 0 : 1 - s.side);
        } else {
          this.streak = 0;
          this.spawnLoose(
            s.target.x + (this.random() - 0.5) * 0.5,
            s.target.z,
            3.05,
          );
          this.message("¡REBOTE! Ve a por el balón", 1.5);
          this.emit("rim", s.side);
        }
      }
    }
    if (this.loose) {
      const b = this.loose;
      b.t += dt;
      b.vy -= 9.8 * dt;
      b.x = clamp(b.x + b.vx * dt, -8.5, 8.5);
      b.z = clamp(b.z + b.vz * dt, -12.3, 12.3);
      b.y += b.vy * dt;
      if (b.y < 0.2) {
        b.y = 0.2;
        b.vy = Math.abs(b.vy) * 0.57;
        b.vx *= 0.72;
        b.vz *= 0.72;
        this.emit("bounce", this.team);
      }
      if (b.t > 0.25 && b.y < 2.45) {
        const candidates = this.players
          .map((a, i) => ({ a, i, d: dist(a, b) }))
          .filter((v) => !this.practice || v.a.side === 0)
          .filter(
            (v) =>
              v.d < (v.a.reach > 0 ? 2 : 1.2) && b.y < 1.95 + v.a.jump * 1.2,
          )
          .sort((a, c) => a.d - c.d);
        if (candidates.length) this.collectRebound(candidates[0].i);
      }
      if (this.loose?.t > 7) {
        const nearest = this.players
          .map((a, i) => ({
            i,
            d: !this.practice || a.side === 0 ? dist(a, b) : 1e5,
          }))
          .sort((a, c) => a.d - c.d)[0];
        this.collectRebound(nearest.i);
      }
    }
    if (!this.shot && !this.pass && !this.loose && this.clock <= 0) {
      this.message("24 segundos. Cambio de posesión");
      this.inboundAfter(this.practice ? 0 : 1 - this.team);
    }
    if (this.practice) {
      this.challenge = Math.min(5, this.stats.made);
    }
    if (
      !this.practice &&
      this.mode === "twentyone" &&
      Math.max(...this.score) >= 21 &&
      Math.abs(this.score[0] - this.score[1]) >= 2
    )
      this.running = false;
    if (
      !this.practice &&
      this.mode !== "twentyone" &&
      this.time <= 0 &&
      !this.shot &&
      !this.pass
    ) {
      // A miss at the buzzer does not create an endless post-time rebound.
      if (this.score[0] === this.score[1]) {
        this.time = 30;
        this.overtime = true;
        this.message("¡Prórroga! 30 segundos");
      } else this.running = false;
    }
  }
}
