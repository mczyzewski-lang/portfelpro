import type { StarTier } from "@/lib/gamification";

type Three = typeof import("three");
const MATERIAL: Record<StarTier, { base: number; emissive: number; metalness: number; roughness: number; opacity: number }> = {
  ice: { base: 0xbfe6ff, emissive: 0x2f7fb5, metalness: 0.05, roughness: 0.2, opacity: 0.82 },
  glass: { base: 0xa8ece1, emissive: 0x0a2f2a, metalness: 0.25, roughness: 0.35, opacity: 0.72 },
  bronze: { base: 0xd9925a, emissive: 0x241004, metalness: 0.5, roughness: 0.42, opacity: 1 },
  silver: { base: 0xe6ebf1, emissive: 0x121519, metalness: 0.5, roughness: 0.4, opacity: 1 },
  gold: { base: 0xf3cb62, emissive: 0x2e1d02, metalness: 0.5, roughness: 0.4, opacity: 1 },
};

/** Fasetowana gwiazda z zaokrąglonymi ramionami (kształt z logo). */
function starGeometry(THREE: Three) {
  const R = 1.02, r = 0.5, depth = 0.4;
  const pts: [number, number][] = [];
  for (let k = 0; k < 10; k++) { const a = Math.PI / 2 + (k * Math.PI) / 5; const rad = k % 2 === 0 ? R : r; pts.push([Math.cos(a) * rad, Math.sin(a) * rad]); }
  const shape = new THREE.Shape();
  pts.forEach((p, i) => {
    const prev = pts[(i + 9) % 10], next = pts[(i + 1) % 10];
    const cut = i % 2 === 0 ? 0.22 : 0.1;
    const toward = (q: [number, number]) => { const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy); return [p[0] + (dx / len) * cut, p[1] + (dy / len) * cut]; };
    const s1 = toward(prev), s2 = toward(next);
    if (i === 0) shape.moveTo(s1[0], s1[1]); else shape.lineTo(s1[0], s1[1]);
    shape.quadraticCurveTo(p[0], p[1], s2[0], s2[1]);
  });
  shape.closePath();
  const outline = shape.getPoints(10), pos: number[] = [];
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    if (a.distanceTo(b) < 1e-6) continue;
    pos.push(0, 0, depth, a.x, a.y, 0, b.x, b.y, 0, 0, 0, -depth, b.x, b.y, 0, a.x, a.y, 0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Buduje gwiazdę danego poziomu. Lodowa ma sople, śnieg i zaspę, a wraz z topnieniem (melt 0→1) maleje i zostawia kałużę.
 * Zwraca grupę i część obracaną (sama gwiazda z soplami) — otoczenie stoi w miejscu.
 */
export function buildStar(THREE: Three, tier: StarTier, melt = 0) {
  const m = Math.min(1, Math.max(0, melt));
  const cfg = MATERIAL[tier];
  const group = new THREE.Group(), spin = new THREE.Group();
  group.add(spin);
  const trash: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => { trash.push(x); return x; };
  const starMat = keep(new THREE.MeshStandardMaterial({ color: cfg.base, emissive: cfg.emissive, metalness: cfg.metalness, roughness: cfg.roughness, flatShading: true, transparent: cfg.opacity < 1, opacity: cfg.opacity, side: THREE.DoubleSide }));
  if (tier !== "ice" || m < 1) spin.add(new THREE.Mesh(keep(starGeometry(THREE)), starMat));

  if (tier === "ice") {
    const scale = 1 - 0.72 * m;
    spin.scale.setScalar(scale * 0.86);
    spin.position.y = 0.12 - 0.75 * m;
    if (m < 1) {
      const iceMat = keep(new THREE.MeshStandardMaterial({ color: 0xdcf2ff, emissive: 0x3a8ec4, roughness: 0.12, metalness: 0.05, transparent: true, opacity: 0.86, flatShading: true }));
      for (const [x, y, len, rad] of [[-0.86, 0.24, 0.5, 0.1], [-0.56, 0.16, 0.3, 0.07], [0.86, 0.24, 0.5, 0.1], [0.56, 0.16, 0.3, 0.07], [-0.52, -0.74, 0.36, 0.09], [-0.24, -0.46, 0.44, 0.07], [0, -0.42, 0.62, 0.1], [0.24, -0.46, 0.42, 0.07], [0.52, -0.74, 0.34, 0.09]]) {
        const l = len * (1 - 0.55 * m);
        const cone = new THREE.Mesh(keep(new THREE.ConeGeometry(rad, l, 6)), iceMat);
        cone.rotation.x = Math.PI; cone.position.set(x, y - l / 2, 0);
        spin.add(cone);
      }
    }
    const snowiness = Math.max(0, 1 - m * 2.6);
    if (snowiness > 0) {
      const snowMat = keep(new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x9fb6c6, roughness: 0.9, transparent: true, opacity: snowiness }));
      const mound = new THREE.Mesh(keep(new THREE.SphereGeometry(1, 24, 12)), snowMat);
      mound.scale.set(1.15, 0.16, 0.7); mound.position.y = -1.28; group.add(mound);
      const flake = keep(new THREE.IcosahedronGeometry(1, 0));
      for (const [x, y, z, s] of [[-1.25, 0.95, 0.2, 0.055], [-0.75, 1.3, -0.3, 0.04], [0.8, 1.25, 0.1, 0.05], [1.3, 0.75, -0.2, 0.04], [-1.4, -0.2, 0.3, 0.04], [1.42, -0.3, 0.2, 0.05], [-1.05, -0.85, 0.5, 0.035], [1.1, -0.9, 0.4, 0.04], [0.3, 1.42, 0.3, 0.035], [-0.2, 1.05, 0.6, 0.03]]) {
        const f = new THREE.Mesh(flake, snowMat); f.scale.setScalar(s); f.position.set(x, y, z); group.add(f);
      }
    }
    if (m > 0) {
      const water = keep(new THREE.MeshStandardMaterial({ color: 0x8fd0f5, emissive: 0x1d5f8a, roughness: 0.15, transparent: true, opacity: 0.85 }));
      const puddle = new THREE.Mesh(keep(new THREE.SphereGeometry(1, 28, 10)), water);
      puddle.scale.set(0.2 + 1.05 * m, 0.05, 0.12 + 0.55 * m); puddle.position.y = -1.3; group.add(puddle);
    }
  }
  return { group, spin, dispose: () => trash.forEach((t) => t.dispose()) };
}

export function addLights(THREE: Three, scene: import("three").Scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));
  const key = new THREE.DirectionalLight(0xffffff, 4.2); key.position.set(3.5, 4, 2.5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe2a8, 1.6); rim.position.set(-4, -2, 1.5); scene.add(rim);
  const back = new THREE.PointLight(0xffffff, 6); back.position.set(0, 1.5, -3); scene.add(back);
}

/* ---- statyczne obrazki: jeden wspólny renderer, wynik w pamięci podręcznej ---- */
const cache = new Map<string, Promise<string | null>>();
let shared: Promise<{ THREE: Three; renderer: import("three").WebGLRenderer } | null> | null = null;

/** Renderuje gwiazdę raz, w stałej pozie, do obrazka PNG (data URL). Bez WebGL zwraca null. */
export function renderStarImage(tier: StarTier, melt = 0, px = 160): Promise<string | null> {
  const key = `${tier}|${melt.toFixed(2)}|${px}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = (async () => {
      try {
        shared ??= (async () => {
          const THREE = await import("three");
          const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
          return { THREE, renderer };
        })().catch(() => null);
        const ctx = await shared; if (!ctx) return null;
        const { THREE, renderer } = ctx;
        renderer.setSize(px, px, false);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20); camera.position.set(0, tier === "ice" ? -0.14 : 0, tier === "ice" ? 5.3 : 4.3);
        addLights(THREE, scene);
        const star = buildStar(THREE, tier, melt);
        star.spin.rotation.set(0.16, -0.42, 0.03); // stała poza: lekko z boku, żeby było widać bryłę
        scene.add(star.group);
        renderer.render(scene, camera);
        const url = renderer.domElement.toDataURL("image/png");
        star.dispose();
        return url;
      } catch { return null; }
    })();
    cache.set(key, hit);
  }
  return hit;
}
