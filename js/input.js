export function bindInput({
  onShootStart,
  onShootEnd,
  onPass,
  onSteal,
  onCross,
  onPause,
  onBlur,
  isPlaying,
}) {
  const keys = new Set(),
    touch = { x: 0, z: 0, sprint: false };
  let pointer = null;
  const movement = new Set([
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "w",
    "a",
    "s",
    "d",
    " ",
    "Shift",
  ]);
  function clear() {
    keys.clear();
    touch.x = touch.z = 0;
    touch.sprint = false;
    document.getElementById("stick").style.transform = "translate(0,0)";
    pointer = null;
  }
  window.addEventListener("keydown", (e) => {
    if (!isPlaying() || document.querySelector("dialog[open]")) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (e.target.matches("select,input")) return;
    if (movement.has(k) || ["e", "f", "c", "p", "Escape"].includes(k))
      e.preventDefault();
    keys.add(k);
    if (e.repeat) return;
    if (e.code === "Space") onShootStart();
    if (k === "e") onPass();
    if (k === "f") onSteal();
    if (k === "c") onCross();
    if (k === "p" || k === "Escape") onPause();
  });
  window.addEventListener("keyup", (e) => {
    keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    if (e.code === "Space") onShootEnd();
  });
  window.addEventListener("blur", () => {
    clear();
    onBlur();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clear();
      onBlur();
    }
  });
  const pad = document.getElementById("joystick"),
    stick = document.getElementById("stick");
  function move(e) {
    const r = pad.getBoundingClientRect(),
      dx = e.clientX - r.left - r.width / 2,
      dz = e.clientY - r.top - r.height / 2,
      max = r.width * 0.35,
      n = Math.hypot(dx, dz),
      f = Math.min(1, max / Math.max(1, n));
    touch.x = (dx * f) / max;
    touch.z = (dz * f) / max;
    stick.style.transform = `translate(${dx * f}px,${dz * f}px)`;
  }
  pad.onpointerdown = (e) => {
    e.preventDefault();
    pointer = e.pointerId;
    pad.setPointerCapture(pointer);
    move(e);
  };
  pad.onpointermove = (e) => {
    if (e.pointerId === pointer) move(e);
  };
  pad.onpointerup =
    pad.onpointercancel =
    pad.onlostpointercapture =
      (e) => {
        if (e.pointerId === pointer) {
          pointer = null;
          touch.x = touch.z = 0;
          stick.style.transform = "translate(0,0)";
        }
      };
  const shoot = document.getElementById("touchShoot");
  shoot.onpointerdown = (e) => {
    e.preventDefault();
    shoot.setPointerCapture(e.pointerId);
    onShootStart();
  };
  shoot.onpointerup = onShootEnd;
  shoot.onpointercancel = () => {
    onBlur();
    clear();
  };
  document.getElementById("touchCross").onpointerdown = (e) => {
    e.preventDefault();
    onCross();
  };
  document.getElementById("touchPass").onpointerdown = (e) => {
    e.preventDefault();
    onPass();
  };
  const steal = document.getElementById("touchSteal");
  steal.onpointerdown = (e) => {
    e.preventDefault();
    steal.setPointerCapture(e.pointerId);
    touch.sprint = true;
    onSteal();
  };
  steal.onpointerup =
    steal.onpointercancel =
    steal.onlostpointercapture =
      () => (touch.sprint = false);
  return {
    clear,
    read() {
      return {
        x:
          touch.x +
          Number(keys.has("d") || keys.has("ArrowRight")) -
          Number(keys.has("a") || keys.has("ArrowLeft")),
        z:
          touch.z +
          Number(keys.has("s") || keys.has("ArrowDown")) -
          Number(keys.has("w") || keys.has("ArrowUp")),
        sprint: touch.sprint || keys.has("Shift"),
      };
    },
  };
}
