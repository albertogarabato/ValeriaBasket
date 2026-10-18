import { TEAMS, SOURCES, NUMBERS, ROLES } from "./teams.js?v=0.3.0";
import { Match, pointsAt, dist, hoopFor, TEAM_SIZE } from "./match.js?v=0.3.0";
import { createScene } from "./scene.js?v=0.3.0";
import { bindInput } from "./input.js?v=0.3.0";
import { CourtAudio } from "./audio.js?v=0.3.0";
const $ = (id) => document.getElementById(id);
let scene,
  match = null,
  home = 0,
  away = 1,
  mode = "menu",
  gameMode = "match",
  last = 0,
  t = 0,
  ended = false,
  previousEvent = 0;
const audio = new CourtAudio();
function fillTeams() {
  $("teams").innerHTML = TEAMS.map(
    (a, i) =>
      `<button class="team ${i === home ? "active" : ""}" data-team="${i}" aria-pressed="${i === home}" style="--color:#${a.color.toString(16).padStart(6, "0")}"><span class="badge">${i === 0 ? "RDC" : a.short.slice(0, 2)}</span><strong>${a.name}</strong></button>`,
  ).join("");
  if (away === home) away = (home + 1) % TEAMS.length;
  $("opponent").innerHTML = TEAMS.map((a, i) =>
    i !== home ? `<option value="${i}">${a.name}</option>` : "",
  ).join("");
  $("opponent").value = away;
  $("hero-team").textContent = TEAMS[home].name.toUpperCase() + " / #7";
  $("hero-player").textContent = TEAMS[home].players[0] + ".";
  $("roster").innerHTML = TEAMS[home].players
    .map(
      (n, i) =>
        `<span><b>${NUMBERS[i]}</b>${n}<small>${ROLES[i]}</small></span>`,
    )
    .join("");
  scene?.setTeams(TEAMS[home], TEAMS[away]);
}
function start(practice = false) {
  match = new Match({
    practice,
    difficulty: $("difficulty").value,
    mode: gameMode,
  });
  mode = "play";
  ended = false;
  previousEvent = 0;
  scene.setMode("play");
  input.clear();
  $("menu").hidden = true;
  $("hud").hidden = false;
  $("panel").hidden = true;
  document.body.classList.add("playing");
  $("homeLabel").textContent = TEAMS[home].short;
  $("awayLabel").textContent = practice ? "ENTRENO" : TEAMS[away].short;
  document.querySelector(".home").style.borderColor =
    "#" + TEAMS[home].color.toString(16).padStart(6, "0");
  document.querySelector(".away").style.borderColor =
    "#" + TEAMS[away].color.toString(16).padStart(6, "0");
  match.message(
    practice
      ? "Reto: anota cinco canastas. Toca para tirar."
      : gameMode === "comeback"
        ? "Pierdes 8–14. Tienes 90 segundos. ¡Remonta!"
        : `¡Vamos, ${TEAMS[home].players[0]}!`,
  );
  if (audio.enabled) audio.enable(true);
  document.activeElement?.blur();
  updateUI();
}
function pause() {
  if (!match?.running || mode !== "play") return;
  match.paused = !match.paused;
  match.held = false;
  match.charge = 0;
  input.clear();
  $("panel").hidden = !match.paused;
  if (match.paused) {
    $("panelKicker").textContent = "TIEMPO MUERTO";
    $("panelTitle").textContent = "Toma aire.";
    $("panelText").textContent =
      "Toca para tirar. Mantén para buscar un tiro perfecto. Sprint + tiro cerca del aro: mate.";
    $("resume").hidden = false;
    $("stats").innerHTML = "";
    $("restart").hidden = false;
  }
}
function end() {
  if (ended) return;
  ended = true;
  input.clear();
  $("panel").hidden = false;
  $("panelKicker").textContent =
    gameMode === "comeback" ? "RETO DE REMONTADA" : "FINAL DEL PARTIDO";
  $("panelTitle").textContent =
    match.score[0] > match.score[1] ? "¡Es tu pista!" : "Una más.";
  $("panelText").textContent =
    `${TEAMS[home].name} ${match.score[0]} — ${match.score[1]} ${TEAMS[away].name}`;
  $("resume").hidden = true;
  $("stats").innerHTML =
    `<span><b>${match.stats.made}/${match.stats.shots}</b>tiros</span><span><b>${match.stats.rebounds}</b>rebotes</span><span><b>${match.stats.assists}</b>asistencias</span><span><b>${match.stats.steals + match.stats.blocks}</b>robos / tapones</span>`;
  try {
    const best = Number(localStorage.getItem("valeribasquet-best") || "0");
    localStorage.setItem(
      "valeribasquet-best",
      String(Math.max(best, match.score[0])),
    );
    const wins = Number(localStorage.getItem("valeribasquet-wins") || "0");
    if (match.score[0] > match.score[1])
      localStorage.setItem("valeribasquet-wins", String(wins + 1));
  } catch {}
}
function back() {
  mode = "menu";
  match = null;
  input.clear();
  scene.setMode("menu");
  $("menu").hidden = false;
  $("hud").hidden = true;
  $("panel").hidden = true;
  document.body.classList.remove("playing");
}
function drawRadar() {
  const canvas = $("radar"),
    c = canvas.getContext("2d");
  c.clearRect(0, 0, 120, 180);
  c.fillStyle = "#0a1927c9";
  c.fillRect(0, 0, 120, 180);
  c.strokeStyle = "#ffffff35";
  c.lineWidth = 1;
  c.strokeRect(8, 8, 104, 164);
  c.beginPath();
  c.moveTo(8, 90);
  c.lineTo(112, 90);
  c.stroke();
  c.beginPath();
  c.arc(60, 90, 12, 0, 7);
  c.stroke();
  const at = (p) => [60 + (p.x / 9) * 51, 90 + (p.z / 14) * 80];
  match.players.forEach((p, i) => {
    if (match.practice && p.side) return;
    const [x, y] = at(p);
    c.fillStyle =
      i === match.active ? "#ffd264" : p.side ? "#ef7391" : "#6bb8ff";
    c.beginPath();
    c.arc(x, y, i === match.active ? 4 : 2.5, 0, 7);
    c.fill();
  });
  const [x, y] = at(match.ballFocus);
  c.fillStyle = "white";
  c.beginPath();
  c.arc(x, y, 1.7, 0, 7);
  c.fill();
}
function updateUI() {
  if (!match) return;
  $("homeScore").textContent = match.score[0];
  $("awayScore").textContent = match.score[1];
  const n = Math.ceil(match.time);
  $("timer").textContent = match.practice
    ? "LIBRE"
    : gameMode === "twentyone"
      ? "A 21"
      : `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
  $("period").textContent = match.practice
    ? "TIRO LIBRE"
    : match.overtime
      ? "PRÓRROGA"
      : gameMode === "comeback"
        ? "REMONTADA"
        : "5 CONTRA 5";
  $("shotClock").textContent = Math.max(0, Math.ceil(match.clock));
  $("shotClock").style.color = match.clock < 5 ? "#ff8b6e" : "";
  $("possession").textContent = match.loose
    ? "¡REBOTE!"
    : match.inbound > 0
      ? "SAQUE DE FONDO"
      : match.team === 0
        ? "TU BALÓN"
        : "¡A DEFENDER!";
  $("playerName").textContent = TEAMS[home].players[match.active].toUpperCase();
  document.querySelector(".jersey").textContent = NUMBERS[match.active];
  $("staminaFill").style.width = match.controlled.stamina * 100 + "%";
  $("announcement").textContent = match.notice;
  $("announcement").style.opacity = match.noticeTime > 0 ? 1 : 0;
  $("shotUI").hidden = !match.held;
  $("chargeFill").style.width = match.charge * 100 + "%";
  const d = dist(match.controlled, hoopFor(0));
  $("shotHint").textContent =
    `${pointsAt(match.controlled)} PUNTOS / ${d.toFixed(1)} M`;
  $("playFeedback").textContent = match.feedback;
  $("playFeedback").style.opacity = match.feedbackTime > 0 ? 1 : 0;
  $("playFeedback").classList.toggle(
    "perfect",
    match.feedback === "¡PERFECTO!",
  );
  $("heatFill").style.width = match.heat * 100 + "%";
  $("heatLabel").textContent =
    match.heat > 0.8 ? "¡EQUIPO EN LLAMAS!" : "RITMO DEL EQUIPO";
  $("heatCard").classList.toggle("onfire", match.heat > 0.8);
  $("objective").textContent = match.practice
    ? `RETO DE TIRO / ${match.challenge} DE 5${match.challenge === 5 ? " · ¡HECHO!" : ""}`
    : gameMode === "twentyone"
      ? "LLEGA A 21 / GANA POR DOS"
      : gameMode === "comeback"
        ? "REMONTAR EL 8–14"
        : match.streak > 1
          ? `${match.streak} CANASTAS SEGUIDAS`
          : "GANA EL DERBI";
  $("defendLabel").textContent = match.loose
    ? "REBOTE"
    : match.shot?.side === 1
      ? "TAPÓN"
      : "ROBO";
  $("shootLabel").textContent =
    d < 2.5 && input.read().sprint ? "MATE" : d < 3.5 ? "ENTRADA" : "TIRAR";
  if (match.event.id !== previousEvent) {
    previousEvent = match.event.id;
    if (match.event.type === "score") {
      document.body.classList.remove("scored");
      void document.body.offsetWidth;
      document.body.classList.add("scored");
    }
  }
  drawRadar();
  audio.update(match);
}
const input = bindInput({
  onShootStart: () => match?.beginShot(),
  onShootEnd: () => match?.releaseShot(),
  onPass: () => match?.passOrSwitch(scene.mapInput(input.read())),
  onSteal: () => match?.steal(),
  onCross: () => match?.crossover(),
  onPause: pause,
  onBlur: () => {
    if (match?.running && !match.paused) pause();
  },
  isPlaying: () => mode === "play",
});
$("teams").onclick = (e) => {
  const b = e.target.closest("[data-team]");
  if (b) {
    home = +b.dataset.team;
    fillTeams();
  }
};
$("opponent").onchange = (e) => {
  away = +e.target.value;
  scene.setTeams(TEAMS[home], TEAMS[away]);
};
for (const b of document.querySelectorAll("[data-mode]"))
  b.onclick = () => {
    gameMode = b.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach((a) => {
      a.classList.toggle("selected", a === b);
      a.setAttribute("aria-pressed", a === b);
    });
  };
$("start").onclick = () => start();
$("practice").onclick = () => start(true);
$("pause").onclick = pause;
$("resume").onclick = pause;
$("restart").onclick = () => start(match?.practice);
$("back").onclick = back;
$("camera").onclick = () => {
  const name = scene?.toggleCamera();
  $("camera").textContent = `Cámara: ${name} ↻`;
  document.activeElement?.blur();
};
$("sound").onclick = () => {
  try {
    audio.enable(!audio.enabled);
    $("sound").textContent = audio.enabled ? "Sonido on" : "Sonido off";
    $("sound").setAttribute("aria-pressed", audio.enabled);
  } catch {}
};
function info(html) {
  if (match?.running && !match.paused) pause();
  $("infoBody").innerHTML = html;
  $("info").showModal();
}
$("help").onclick = () =>
  info(
    `<p class="eyebrow">GUÍA DE LA PISTA / TEMPORADA 03</p><h2>Juega, corre, disfruta.</h2><p><b>Movimiento:</b> WASD, flechas o joystick. Los controles siguen la cámara. El círculo dorado marca tu jugadora.</p><p><b>Tiro rápido:</b> toca Espacio o TIRAR. <b>Tiro preciso:</b> mantén y suelta en verde. Cerca del aro haces una entrada; con sprint y a menos de 2,5 m, un mate.</p><p><b>Pases:</b> E / PASE. Mantén una dirección para elegir a la compañera en esa dirección; sin dirección pasa a la más cercana. En defensa cambia a una jugadora cerca de la acción.</p><p><b>Defensa:</b> F / ROBO cerca de la rival. Durante el tiro salta para taponar; con balón suelto salta por el rebote. C / FINTA cambia de mano y consume energía. Shift o mantén ROBO para correr.</p><p>Tras un fallo, el balón sigue vivo. Los rebotes ofensivos recuperan al menos 14 segundos; el cambio de equipo da 24. Tras una canasta el rival saca de fondo y vuelve al ataque.</p><p>Modos: partido de 3 minutos; a 21 con dos puntos de ventaja; remontada desde 8–14 en 90 segundos; entrenamiento con reto de cinco canastas. P / Escape: pausa. Cámara: TV, ataque o táctica.</p><p>Es baloncesto arcade: sin faltas ni reglamento completo. Las entradas y mates son acciones asistidas; los tiros tienen probabilidad según timing, distancia y presión.</p>`,
  );
$("sources").onclick = () =>
  info(
    `<p class="eyebrow">VALERIBASQUET / 0.3</p><h2>Baloncesto de aquí.</h2><p>Clubes locales reales, plantillas femeninas ficticias. Valeria es una jugadora personalizada del Rosalía. No se afirman plantillas, categorías ni secciones femeninas actuales de los clubes. Equipaciones e identidad gráfica originales, sin licencias ni afiliación oficial.</p><p>${SOURCES.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n}</a>`).join(" / ")}</p><p>Three.js, licencia MIT. Efectos de audio sintetizados, sin muestras comerciales. Récords guardados solo en este navegador.</p>`,
  );
$("closeInfo").onclick = () => $("info").close();
try {
  scene = createScene($("scene"));
  fillTeams();
  $("loading").hidden = true;
  function frame(now) {
    const dt = Math.min((now - last) / 1000 || 0, 0.05);
    last = now;
    if (!match?.paused) t += dt;
    if (match && mode === "play") {
      match.update(dt, scene.mapInput(input.read()));
      updateUI();
      if (!match.running) end();
    }
    scene.render(match, t, dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
} catch (e) {
  console.error(e);
  $("loadText").textContent =
    "Abre el juego desde HTTP en un navegador moderno compatible con WebGL 2. Consulta LEEME si usas el proyecto descargado.";
  $("loading").querySelector("h2").textContent = "No se pudo abrir la pista 3D";
}
