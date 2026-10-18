import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { HOOP, hoopFor, TEAM_SIZE } from "./match.js?v=0.3.0";
import { NUMBERS } from "./teams.js?v=0.3.0";
const V = THREE.Vector3;
export function createScene(container) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#192c3f");
  scene.fog = new THREE.Fog("#192c3f", 42, 95);
  const camera = new THREE.PerspectiveCamera(
    45,
    innerWidth / innerHeight,
    0.1,
    160,
  );
  camera.position.set(22, 19, 25);
  const target = new V(0, 1, -3);
  scene.add(new THREE.HemisphereLight(0xdcecff, 0x5a4936, 2));
  const light = new THREE.DirectionalLight(0xffe7c1, 3.1);
  light.position.set(-8, 22, 10);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  Object.assign(light.shadow.camera, {
    left: -22,
    right: 22,
    top: 22,
    bottom: -22,
    near: 1,
    far: 65,
  });
  light.shadow.bias = -0.0005;
  scene.add(light);
  const blue = new THREE.DirectionalLight(0x91bcff, 1.4);
  blue.position.set(10, 7, -15);
  scene.add(blue);
  const mat = (c, rough = 0.65, metal = 0) =>
    new THREE.MeshStandardMaterial({
      color: c,
      roughness: rough,
      metalness: metal,
    });
  const floorMat = mat(0xc69c68, 0.3);
  const wood = document.createElement("canvas");
  wood.width = 1024;
  wood.height = 1024;
  const wc = wood.getContext("2d");
  let seed = 13;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let x = 0; x < 1024; x += 32) {
    const v = Math.floor(rnd() * 25);
    wc.fillStyle = `rgb(${183 + v},${136 + v},${84 + v})`;
    wc.fillRect(x, 0, 32, 1024);
    wc.strokeStyle = "#4e37142a";
    wc.lineWidth = 1;
    wc.strokeRect(x, 0, 32, 1024);
    for (let i = 0; i < 130; i++) {
      wc.strokeStyle = rnd() > 0.5 ? "#ffe4aa16" : "#50300b14";
      wc.beginPath();
      let a = x + rnd() * 32;
      wc.moveTo(a, rnd() * 1024);
      wc.bezierCurveTo(a - 2, rnd() * 1024, a + 2, rnd() * 1024, a, 1024);
      wc.stroke();
    }
    for (let y = (x % 64) * 4; y < 1024; y += 256) {
      wc.fillStyle = "#5537143a";
      wc.fillRect(x, y, 32, 1);
    }
  }
  const wt = new THREE.CanvasTexture(wood);
  wt.colorSpace = THREE.SRGBColorSpace;
  wt.wrapS = wt.wrapT = THREE.RepeatWrapping;
  wt.repeat.set(2, 2);
  wt.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  floorMat.map = wt;
  const white = mat(0xfff5d7),
    dark = mat(0x142433),
    metal = mat(0x506778, 0.35, 0.6),
    orange = mat(0xff7137, 0.45),
    netMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.62,
    });
  function mesh(geo, m, x, y, z, parent = scene) {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  function box(w, h, d, m, x, y, z, parent) {
    return mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z, parent);
  }
  function cyl(r1, r2, h, m, x, y, z, parent) {
    return mesh(new THREE.CylinderGeometry(r1, r2, h, 24), m, x, y, z, parent);
  }
  function line(points, color = 0xfff4cd, width) {
    const geo = new THREE.BufferGeometry().setFromPoints(
      points.map((p) => new V(...p)),
    );
    const o = new THREE.Line(geo, new THREE.LineBasicMaterial({ color }));
    scene.add(o);
    return o;
  }
  function arc(x, z, r, a, b) {
    return Array.from({ length: 100 }, (_, i) => [
      x + Math.sin(a + ((b - a) * i) / 99) * r,
      0.031,
      z + Math.cos(a + ((b - a) * i) / 99) * r,
    ]);
  }
  // Complete court with two painted keys and three-point lines.
  box(80, 0.3, 85, mat(0x233545), 0, -0.3, 0);
  box(20, 0.12, 30, floorMat, 0, -0.06, 0);
  const grain = [];
  for (let i = 0; i < 80; i++) {
    let x = -10 + i * 0.25;
    grain.push(x, 0.007, -15, x, 0.007, 15);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(grain, 3));
  scene.add(
    new THREE.LineSegments(
      geom,
      new THREE.LineBasicMaterial({
        color: 0x805e3e,
        transparent: true,
        opacity: 0.3,
      }),
    ),
  );
  for (let i = 0; i < 15; i++)
    box(
      20,
      0.003,
      1,
      new THREE.MeshBasicMaterial({
        color: 0xffe6bc,
        transparent: true,
        opacity: 0.035,
      }),
      0,
      0.01,
      -14.5 + i * 2,
    );
  box(20, 0.01, 1, mat(0x24436a), 0, 0.001, -14.5);
  box(20, 0.01, 1, mat(0x24436a), 0, 0.001, 14.5);
  box(1, 0.01, 29, mat(0x24436a), -9.5, 0.001, 0);
  box(1, 0.01, 29, mat(0x24436a), 9.5, 0.001, 0);
  line([
    [-9, 0.03, 14],
    [-9, 0.03, -14],
    [9, 0.03, -14],
    [9, 0.03, 14],
    [-9, 0.03, 14],
  ]);
  line([
    [-9, 0.03, 0],
    [9, 0.03, 0],
  ]);
  line(arc(0, 0, 1.8, 0, Math.PI * 2));
  for (const side of [0, 1]) {
    const dir = side === 0 ? 1 : -1,
      z = side === 0 ? -11.65 : 11.65;
    box(
      4.9,
      0.012,
      5.8,
      mat(side === 0 ? 0x366b91 : 0x8c3e57, 0.4),
      0,
      0.014,
      -10.6 * dir,
    );
    line([
      [-2.45, 0.03, -13.5 * dir],
      [-2.45, 0.03, -7.7 * dir],
      [2.45, 0.03, -7.7 * dir],
      [2.45, 0.03, -13.5 * dir],
    ]);
    line(
      arc(
        0,
        -7.7 * dir,
        1.8,
        side === 0 ? -Math.PI / 2 : Math.PI / 2,
        side === 0 ? Math.PI / 2 : Math.PI * 1.5,
      ),
    );
    line(
      arc(
        0,
        z,
        6.75,
        side === 0 ? -1.54 : Math.PI - 1.54,
        side === 0 ? 1.54 : Math.PI + 1.54,
      ),
    );
    for (const x of [-6.75, 6.75])
      line([
        [x, 0.03, z],
        [x, 0.03, -14 * dir],
      ]);
  }
  function textTexture(text, w = 1024, h = 256, color = "#fff4dc", bg = null) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const x = c.getContext("2d");
    if (bg) {
      x.fillStyle = bg;
      x.fillRect(0, 0, w, h);
    }
    x.fillStyle = color;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.font = `800 ${h * 0.46}px Arial`;
    x.fillText(text, w / 2, h / 2, w * 0.95);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 2),
    new THREE.MeshBasicMaterial({
      map: textTexture("VALERIBASQUET"),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  );
  logo.rotation.x = -Math.PI / 2;
  logo.position.set(0, 0.035, 0);
  scene.add(logo);
  // Both baskets share the same construction, mirrored at the other end.
  const hoopStart = scene.children.length;
  box(0.4, 3.7, 0.4, metal, 0, 1.85, -12.4);
  box(2.1, 0.6, 1.6, dark, 0, 0.3, -12.1);
  box(0.25, 0.25, 2.3, metal, 0, 3.5, -11.5);
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xb7deec,
    roughness: 0.12,
    metalness: 0.15,
    transparent: true,
    opacity: 0.27,
    side: THREE.DoubleSide,
  });
  box(1.85, 1.15, 0.07, glass, 0, 3.65, -10.25);
  const frame = mat(0xf4f5e3);
  box(1.9, 0.07, 0.09, frame, 0, 4.24, -10.25);
  box(1.9, 0.07, 0.09, frame, 0, 3.06, -10.25);
  box(0.07, 1.2, 0.09, frame, -0.95, 3.65, -10.25);
  box(0.07, 1.2, 0.09, frame, 0.95, 3.65, -10.25);
  const square = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new V(-0.3, 3.1, -10.19),
      new V(-0.3, 3.62, -10.19),
      new V(0.3, 3.62, -10.19),
      new V(0.3, 3.1, -10.19),
    ]),
    new THREE.LineBasicMaterial({ color: 0xfaf7df }),
  );
  square.position.z = -2;
  scene.add(square);
  const rim = mesh(
    new THREE.TorusGeometry(0.235, 0.025, 12, 40),
    orange,
    0,
    3.05,
    HOOP.z,
  );
  rim.rotation.x = Math.PI / 2;
  box(0.12, 0.06, 0.4, orange, 0, 3.05, -10);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2,
      b = a + 0.36;
    const pts = [
      new V(Math.cos(a) * 0.235, 3.05, HOOP.z + Math.sin(a) * 0.235),
      new V(Math.cos(b) * 0.17, 2.82, HOOP.z + Math.sin(b) * 0.17),
      new V(Math.cos(a) * 0.13, 2.6, HOOP.z + Math.sin(a) * 0.13),
    ];
    scene.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), netMat),
    );
  }
  for (let i = 0; i < 3; i++) {
    const pts = [];
    for (let j = 0; j <= 32; j++) {
      let a = (j / 32) * Math.PI * 2,
        r = 0.22 - i * 0.045;
      pts.push(
        new V(Math.cos(a) * r, 2.98 - i * 0.15, HOOP.z + Math.sin(a) * r),
      );
    }
    scene.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), netMat),
    );
  }
  const basketParts = scene.children.slice(hoopStart);
  for (const o of basketParts) {
    if (
      !(o instanceof THREE.Line) &&
      !(o.geometry instanceof THREE.TorusGeometry)
    )
      o.position.z -= 2;
    const clone = o.clone();
    clone.position.set(-o.position.x, o.position.y, -o.position.z);
    clone.rotation.y += Math.PI;
    scene.add(clone);
  }
  // Architecture, lamps and stands surround the court.
  const wall = mat(0x233c51),
    seat = mat(0x315875),
    step = mat(0x213447);
  box(42, 10, 0.5, wall, 0, 5, -19);
  box(0.5, 10, 42, wall, -22, 5, 0);
  box(0.5, 10, 42, wall, 22, 5, 0);
  for (let i = -2; i <= 2; i++) {
    box(0.25, 9, 0.3, metal, i * 9, 4.5, -18.6);
    box(7, 2.2, 0.1, mat(0x769bb2), i * 9, 7, -18.68);
    const lamp = box(
      4,
      0.08,
      0.25,
      new THREE.MeshBasicMaterial({ color: 0xfff3d8 }),
      i * 8,
      9,
      -4,
    );
    lamp.castShadow = false;
    lamp.userData.overhead = true;
  }
  for (let side of [-1, 1])
    for (let row = 0; row < 4; row++) {
      box(
        2,
        0.45 + row * 0.5,
        24,
        step,
        side * (14 + row * 1.8),
        (0.45 + row * 0.5) / 2,
        -1,
      );
      for (let j = 0; j < 15; j++) {
        box(
          0.8,
          0.15,
          0.7,
          seat,
          side * (14 + row * 1.8),
          0.7 + row * 0.5,
          -11 + j * 1.5,
        );
        if ((j + row) % 3 !== 0) {
          const skin = mat([0xb97e59, 0xe2b68c, 0x8d5b43][(j + row) % 3]),
            shirt = mat([0x294958, 0x577b91, 0xc6ae73, 0x4e6557][j % 4]);
          const x = side * (14 + row * 1.8),
            z = -11 + j * 1.5;
          cyl(0.18, 0.21, 0.48, shirt, x, 1 + row * 0.5, z);
          mesh(
            new THREE.SphereGeometry(0.15, 10, 8),
            skin,
            x,
            1.4 + row * 0.5,
            z,
          );
        }
      }
    }
  for (let r = 0; r < 3; r++)
    box(30, 0.5 + r * 0.5, 1.5, step, 0, (0.5 + r * 0.5) / 2, -17 - r * 1.3);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 1.5),
    new THREE.MeshBasicMaterial({
      map: textTexture(
        "COMPOSTELA · A NOSA PISTA",
        1536,
        256,
        "#f5dc96",
        "#173248",
      ),
    }),
  );
  sign.position.set(0, 5.8, -18.7);
  scene.add(sign);
  for (let x of [-8, 8]) {
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(4.5, 1),
      new THREE.MeshBasicMaterial({
        map: textTexture("VALERIBASQUET", 1024, 256, "#183549", "#f2ce78"),
      }),
    );
    banner.position.set(x, 0.65, -15.8);
    scene.add(banner);
  }
  const actors = [];
  function createPlayer(team, name, index, skinColor) {
    const root = new THREE.Group();
    scene.add(root);
    const skin = mat(skinColor, 0.75),
      kit = mat(team.color, 0.6),
      trim = mat(team.accent),
      shoe = mat(0xe9ecdf, 0.5),
      hair = mat(index % 2 ? 0x35241e : 0x171a1e);
    const profile = [
      [0.23, 0.92],
      [0.235, 1.04],
      [0.22, 1.2],
      [0.26, 1.4],
      [0.31, 1.52],
      [0.25, 1.58],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const torso = mesh(
      new THREE.LatheGeometry(profile, 24),
      kit,
      0,
      0,
      0,
      root,
    );
    torso.scale.z = 0.74;
    const collar = mesh(
      new THREE.TorusGeometry(0.14, 0.018, 6, 24),
      trim,
      0,
      1.6,
      0,
      root,
    );
    collar.rotation.x = Math.PI / 2;
    for (const side of [-1, 1]) {
      const stripe = box(0.025, 0.52, 0.32, trim, side * 0.255, 1.25, 0, root);
      stripe.rotation.z = side * -0.05;
    }
    const head = mesh(
      new THREE.SphereGeometry(0.22, 20, 16),
      skin,
      0,
      1.97,
      0,
      root,
    );
    head.scale.set(0.88, 1.08, 0.9);
    const h = mesh(
      new THREE.SphereGeometry(
        0.226,
        16,
        10,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.47,
      ),
      hair,
      0,
      2.02,
      0,
      root,
    );
    h.scale.set(0.9, 1, 0.9);
    const pony = new THREE.Group();
    pony.position.set(0, 2.06, -0.16);
    root.add(pony);
    mesh(new THREE.SphereGeometry(0.1, 12, 10), hair, 0, 0, -0.07, pony);
    const tail = mesh(
      new THREE.CapsuleGeometry(0.065, 0.23, 5, 10),
      hair,
      0,
      -0.16,
      -0.12,
      pony,
    );
    tail.rotation.x = -0.35;
    // Eyes and a simple face make the players readable from courtside.
    for (const side of [-1, 1]) {
      mesh(
        new THREE.SphereGeometry(0.023, 8, 6),
        dark,
        side * 0.075,
        1.99,
        0.177,
        root,
      );
    }
    cyl(0.095, 0.12, 0.13, skin, 0, 1.73, 0, root);
    const shorts = cyl(0.285, 0.31, 0.29, kit, 0, 0.85, 0, root);
    shorts.scale.z = 0.78;
    const waistband = cyl(0.31, 0.31, 0.06, trim, 0, 1, 0, root);
    waistband.scale.z = 0.79;
    const limbs = [];
    for (let side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(side * 0.16, 0.89, 0);
      root.add(leg);
      mesh(
        new THREE.CapsuleGeometry(0.112, 0.23, 5, 12),
        skin,
        0,
        -0.18,
        0,
        leg,
      );
      const knee = new THREE.Group();
      knee.position.set(0, -0.37, 0);
      leg.add(knee);
      mesh(
        new THREE.CapsuleGeometry(0.085, 0.25, 5, 12),
        skin,
        0,
        -0.16,
        0,
        knee,
      );
      cyl(0.09, 0.095, 0.17, white, 0, -0.28, 0, knee);
      const foot = mesh(
        new THREE.CapsuleGeometry(0.095, 0.17, 5, 12),
        shoe,
        0,
        -0.39,
        0.065,
        knee,
      );
      foot.rotation.x = Math.PI / 2;
      box(0.15, 0.025, 0.3, trim, 0, -0.46, 0.06, knee);
      const arm = new THREE.Group();
      arm.position.set(side * 0.31, 1.49, 0);
      root.add(arm);
      mesh(
        new THREE.CapsuleGeometry(0.079, 0.19, 5, 12),
        skin,
        side * 0.015,
        -0.16,
        0,
        arm,
      );
      const elbow = new THREE.Group();
      elbow.position.set(side * 0.015, -0.31, 0);
      arm.add(elbow);
      mesh(
        new THREE.CapsuleGeometry(0.063, 0.2, 5, 12),
        skin,
        0,
        -0.15,
        0,
        elbow,
      );
      mesh(new THREE.SphereGeometry(0.083, 12, 10), skin, 0, -0.29, 0, elbow);
      if (side === -1)
        mesh(
          new THREE.CapsuleGeometry(0.084, 0.05, 4, 10),
          trim,
          0,
          -0.22,
          0,
          arm,
        );
      limbs.push({ leg, knee, arm, elbow, side });
    }
    for (let z of [-0.232, 0.232]) {
      const num = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.35),
        new THREE.MeshBasicMaterial({
          map: textTexture(String(NUMBERS[index]), 128, 128, "#fff7e5"),
          transparent: true,
          side: THREE.DoubleSide,
        }),
      );
      num.position.set(0, 1.3, z);
      if (z < 0) num.rotation.y = Math.PI;
      root.add(num);
    }
    const label = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: textTexture(name.toUpperCase(), 512, 128, "#fff4de", "#102333"),
        transparent: true,
        depthTest: false,
      }),
    );
    label.position.set(0, 2.57, 0);
    label.scale.set(1.55, 0.38, 1);
    root.add(label);
    actors.push({ root, limbs, label, pony });
    return root;
  }
  const ring = mesh(
    new THREE.RingGeometry(0.48, 0.57, 48),
    new THREE.MeshBasicMaterial({
      color: 0xffd264,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    }),
    0,
    0.05,
    0,
  );
  ring.rotation.x = -Math.PI / 2;
  const ball = mesh(
    new THREE.SphereGeometry(0.18, 28, 20),
    mat(0xe77a27, 0.78),
    0,
    1,
    0,
  );
  for (let i = 0; i < 3; i++) {
    const seam = new THREE.Mesh(
      new THREE.TorusGeometry(0.181, 0.006, 5, 48),
      mat(0x3d2114),
    );
    if (i === 1) seam.rotation.x = Math.PI / 2;
    if (i === 2) seam.rotation.y = Math.PI / 2;
    ball.add(seam);
  }
  const ballShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.23, 20),
    new THREE.MeshBasicMaterial({
      color: 0x161a1d,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    }),
  );
  ballShadow.rotation.x = -Math.PI / 2;
  ballShadow.position.y = 0.045;
  scene.add(ballShadow);
  let cameraMode = 0,
    look = new V(0, 1, 0),
    mode = "menu",
    home,
    away,
    lastEvent = 0,
    shake = 0,
    scoreFlash = 0;
  const passRing = mesh(
    new THREE.RingGeometry(0.43, 0.47, 32),
    new THREE.MeshBasicMaterial({
      color: 0x89d9ff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    }),
    0,
    0.05,
    0,
  );
  passRing.rotation.x = -Math.PI / 2;
  const sparkGeo = new THREE.BufferGeometry(),
    sparkPositions = new Float32Array(48 * 3);
  sparkGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(sparkPositions, 3),
  );
  const sparks = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({
      color: 0xffd66c,
      size: 0.075,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  scene.add(sparks);
  const trailPositions = new Float32Array(24 * 3),
    trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(trailPositions, 3),
  );
  const trail = new THREE.Line(
    trailGeo,
    new THREE.LineBasicMaterial({
      color: 0xffbd53,
      transparent: true,
      opacity: 0.6,
    }),
  );
  scene.add(trail);
  const history = [];
  const nameFlags = [];
  for (let i = 0; i < 5; i++) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: textTexture(String(i + 1), 64, 64, "#fff8e6", "#19466a"),
        transparent: true,
        depthTest: false,
      }),
    );
    sprite.scale.set(0.35, 0.35, 1);
    scene.add(sprite);
    nameFlags.push(sprite);
  }
  const basketNet = basketParts.filter(
    (o) => o instanceof THREE.Line && o !== square,
  );
  const dunkRing = mesh(
    new THREE.RingGeometry(0.65, 0.72, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffce63,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    }),
    0,
    0.04,
    0,
  );
  dunkRing.rotation.x = -Math.PI / 2;
  function setTeams(a, b) {
    home = a;
    away = b;
    for (const a of actors) {
      scene.remove(a.root);
      a.root.traverse((o) => {
        o.geometry?.dispose();
        if (o.material) {
          o.material.map?.dispose();
          o.material.dispose();
        }
      });
    }
    actors.length = 0;
    const skins = [
      0xe6b28c, 0x9d6344, 0xc5916b, 0x69412c, 0xd7a17b, 0x95664c, 0xc08761,
      0x744936, 0xdba479, 0xa57150,
    ];
    for (let i = 0; i < TEAM_SIZE * 2; i++) {
      let t = i < TEAM_SIZE ? a : b;
      createPlayer(t, t.players[i % TEAM_SIZE], i % TEAM_SIZE, skins[i]);
    }
  }

  function render(match, t, dt) {
    const menu = mode === "menu",
      layout = [
        { x: 2, z: 4 },
        { x: -5, z: 0 },
        { x: 6, z: -1 },
        { x: -3, z: -5 },
        { x: 3, z: -7 },
        { x: 0, z: -2 },
        { x: -5, z: -4 },
        { x: 5, z: -6 },
        { x: -2, z: -8 },
        { x: 2, z: -9 },
      ];
    if (!menu && match.event.id !== lastEvent) {
      lastEvent = match.event.id;
      if (match.event.type === "score") {
        scoreFlash = 1.1;
        shake = match.event.kind === "dunk" ? 0.22 : 0.065;
      } else if (match.event.type === "block") {
        shake = 0.08;
      }
    }
    actors.forEach((a, i) => {
      const p = menu ? layout[i] : match.players[i];
      a.root.visible = menu || !match.practice || i < TEAM_SIZE;
      const action = menu ? "" : p.action,
        walk = menu ? 0.025 : p.move;
      const leap = menu
        ? 0
        : p.jump > 0
          ? Math.sin(
              clamp01(p.jump / (action === "dunk" ? 0.85 : 0.65)) * Math.PI,
            ) * (action === "dunk" ? 1.05 : 0.6)
          : 0;
      a.root.position.set(
        p.x,
        leap + Math.abs(Math.sin(t * 12 + i)) * 0.025 * walk,
        p.z,
      );
      let facing = menu ? Math.PI * 0.14 : p.angle;
      if (
        !menu &&
        ((match.held && match.owner === i) ||
          ["jumper", "layup", "dunk", "block"].includes(action))
      )
        facing = Math.atan2(-p.x, hoopFor(p.side).z - p.z);
      // Shortest-angle interpolation avoids spinning 360 degrees at a direction change.
      let delta = Math.atan2(
        Math.sin(facing - a.root.rotation.y),
        Math.cos(facing - a.root.rotation.y),
      );
      a.root.rotation.y += delta * Math.min(1, dt * 14);
      a.root.rotation.z = menu ? 0 : Math.sin(t * 9 + i) * walk * 0.025;
      a.pony.rotation.x = Math.sin(t * 12 + i) * walk * 0.28;
      for (const l of a.limbs) {
        const phase = t * (8 + walk * 3) + (l.side * Math.PI) / 2;
        l.leg.rotation.x = Math.sin(phase) * 0.72 * walk;
        l.knee.rotation.x = Math.max(0, -Math.sin(phase)) * 0.95 * walk;
        l.arm.rotation.x = -Math.sin(phase) * 0.5 * walk;
        l.arm.rotation.z = l.side * 0.12;
        l.elbow.rotation.x = -0.25;
        if (
          !menu &&
          match.owner === i &&
          !match.shot &&
          !match.pass &&
          !match.loose
        ) {
          if (l.side === 1) {
            l.arm.rotation.x = -0.4 + Math.sin(t * 9) * 0.22;
            l.elbow.rotation.x = -0.25 - Math.abs(Math.sin(t * 9)) * 0.3;
          }
        }
        if (
          !menu &&
          ((match.held && match.owner === i) ||
            ["jumper", "layup", "dunk"].includes(action))
        ) {
          l.arm.rotation.x = action === "dunk" ? -2.9 : -2.15;
          l.elbow.rotation.x = action === "jumper" ? -0.12 : -0.65;
          l.arm.rotation.z = l.side * 0.12;
          l.leg.rotation.x = l.side * 0.23;
          l.knee.rotation.x = 0.35;
        }
        if (action === "pass" || action === "catch") {
          l.arm.rotation.x = -1.2;
          l.elbow.rotation.x = -0.25;
        }
        if (action === "block") {
          l.arm.rotation.x = -2.9;
          l.elbow.rotation.x = 0;
        }
        if (action === "steal") {
          l.arm.rotation.x = -1.4;
          l.elbow.rotation.x = -0.1;
        }
        if (action === "crossover") {
          l.arm.rotation.x = -0.7;
          l.arm.rotation.z = l.side * 0.45;
          a.root.rotation.z = Math.sin(p.actionTime * 15) * 0.15;
        }
        if (action === "stumble") {
          a.root.rotation.z = 0.16;
          l.arm.rotation.z = l.side * 0.7;
        }
      }
      a.label.visible = menu ? i === 0 : !match.practice || i < TEAM_SIZE;
      a.label.material.opacity = menu || i === match.active ? 1 : 0.65;
      a.label.scale.set(
        i === match?.active ? 1.7 : 1.3,
        i === match?.active ? 0.42 : 0.32,
        1,
      );
    });
    const selected = menu ? layout[0] : match.controlled;
    ring.position.set(selected.x, 0.045, selected.z);
    ring.scale.setScalar(1 + Math.sin(t * 5) * 0.03);
    ring.material.color.set(!menu && match.heat > 0.8 ? 0xff8043 : 0xffd264);
    passRing.visible = !menu && !!match.pass && match.team === 0;
    if (passRing.visible) {
      const p = match.players[match.pass.to];
      passRing.position.set(p.x, 0.047, p.z);
    }
    nameFlags.forEach((f, i) => {
      f.visible =
        !menu &&
        match.team === 0 &&
        !match.shot &&
        !match.loose &&
        i !== match.owner;
      if (f.visible) {
        const p = match.players[i];
        f.position.set(p.x, 0.45, p.z);
      }
    });
    let pos = new V();
    if (!menu && match.shot) {
      const s = match.shot,
        k = clamp01(s.t / s.duration),
        endZ = s.target.z + (s.made ? 0 : s.side === 0 ? 0.2 : -0.2);
      const arcHeight =
        s.kind === "dunk" ? 0.4 : s.kind === "layup" ? 1.6 : 3.4;
      pos.set(
        THREE.MathUtils.lerp(s.x, s.made ? 0 : 0.35, k),
        THREE.MathUtils.lerp(s.kind === "dunk" ? 2.5 : 2.1, 3.05, k) +
          Math.sin(k * Math.PI) * arcHeight,
        THREE.MathUtils.lerp(s.z, endZ, k),
      );
      if (k > 0.88 && s.made) pos.y -= ((k - 0.88) / 0.12) * 0.62;
    } else if (!menu && match.loose) {
      pos.set(match.loose.x, match.loose.y, match.loose.z);
    } else if (!menu && match.pass) {
      const s = match.pass,
        to = match.players[s.to],
        k = clamp01(s.t / s.duration);
      pos.set(
        THREE.MathUtils.lerp(s.x, to.x, k),
        1.3 + Math.sin(k * Math.PI) * 0.27,
        THREE.MathUtils.lerp(s.z, to.z, k),
      );
    } else {
      const p = menu ? layout[0] : match.carrier;
      const a = menu ? Math.PI * 0.14 : p.angle;
      const bounce = 0.23 + Math.abs(Math.sin(t * 9)) * 1.02,
        side = !menu && p.action === "crossover" ? Math.sin(t * 18) * 0.5 : 0.4;
      pos.set(
        p.x + Math.cos(a) * side + Math.sin(a) * 0.17,
        bounce,
        p.z - Math.sin(a) * side + Math.cos(a) * 0.17,
      );
      if (!menu && match.held)
        pos.set(p.x, 2.12, p.z + (p.side === 0 ? -0.22 : 0.22));
    }
    ball.position.copy(pos);
    ball.rotation.x = t * 4;
    ball.rotation.z = t * 2;
    ballShadow.position.set(pos.x, 0.047, pos.z);
    ballShadow.material.opacity = Math.max(0.04, 0.25 - pos.y * 0.035);
    trail.visible = !menu && !!match.shot;
    if (trail.visible) {
      history.push(pos.clone());
      if (history.length > 24) history.shift();
      history.forEach((p, i) => {
        trailPositions[i * 3] = p.x;
        trailPositions[i * 3 + 1] = p.y;
        trailPositions[i * 3 + 2] = p.z;
      });
      trailGeo.setDrawRange(0, history.length);
      trailGeo.attributes.position.needsUpdate = true;
    } else history.length = 0;
    scoreFlash = Math.max(0, scoreFlash - dt);
    shake = Math.max(0, shake - dt * 0.2);
    sparks.material.opacity = scoreFlash;
    dunkRing.material.opacity = scoreFlash * 0.7;
    if (!menu && scoreFlash > 0) {
      const hoop = hoopFor(match.event.side),
        age = 1.1 - scoreFlash;
      for (let i = 0; i < 48; i++) {
        const a = i * 2.399,
          r = age * (1 + (i % 4) * 0.2);
        sparkPositions[i * 3] = hoop.x + Math.cos(a) * r;
        sparkPositions[i * 3 + 1] = 3.05 + Math.sin(i * 3) * age - age * age;
        sparkPositions[i * 3 + 2] = hoop.z + Math.sin(a) * r;
      }
      sparkGeo.attributes.position.needsUpdate = true;
      dunkRing.position.set(hoop.x, 0.04, hoop.z);
      dunkRing.scale.setScalar(1 + age * 4);
    }
    let desired, aim;
    if (menu) {
      desired = new V(20, 13, 24);
      aim = new V(0, 1, 0);
    } else {
      const portrait = innerWidth < 700,
        focus = match.ballFocus,
        z = THREE.MathUtils.clamp(focus.z * 0.75, -8, 8),
        x = THREE.MathUtils.clamp(focus.x * 0.3, -2, 2);
      if (cameraMode === 2) {
        desired = new V(1, portrait ? 48 : 33, portrait ? 38 : 32);
        aim = new V(0, 0, 0);
      } else if (cameraMode === 1 || portrait) {
        desired = new V(x, portrait ? 24 : 18, z + 22);
        aim = new V(x, 1, z - 2);
      } else {
        desired = new V(24, 20, z + 4);
        aim = new V(0, 1, z);
      }
    }
    const wantedFov = innerWidth < 700 && mode !== "menu" ? 57 : 43;
    if (Math.abs(camera.fov - wantedFov) > 0.05) {
      camera.fov = THREE.MathUtils.lerp(
        camera.fov,
        wantedFov,
        Math.min(1, dt * 5),
      );
      camera.updateProjectionMatrix();
    }
    camera.position.lerp(desired, Math.min(1, dt * (menu ? 2.5 : 3.8)));
    look.lerp(aim, Math.min(1, dt * 4.2));
    camera.lookAt(look);
    if (shake > 0) camera.position.y += Math.sin(t * 90) * shake;
    renderer.render(scene, camera);
  }
  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }
  function mapInput(input) {
    const back = new V(
        camera.position.x - look.x,
        0,
        camera.position.z - look.z,
      ).normalize(),
      right = new V(back.z, 0, -back.x);
    return {
      ...input,
      x: right.x * input.x + back.x * input.z,
      z: right.z * input.x + back.z * input.z,
    };
  }
  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  camera.lookAt(target);
  return {
    setTeams,
    render,
    setMode(m) {
      mode = m;
      scene.children.forEach((o) => {
        if (o.userData.overhead) o.visible = m === "menu";
      });
    },
    toggleCamera() {
      cameraMode = (cameraMode + 1) % 3;
      return ["TV", "Ataque", "Táctica"][cameraMode];
    },
    mapInput,
    renderer,
  };
}
