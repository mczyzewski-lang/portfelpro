"use client";

import { useEffect, useRef, useState } from "react";
import type { StarTier } from "@/lib/gamification";
import { StarMark } from "./star";

const COLORS: Record<Exclude<StarTier, "ice">, { base: number; emissive: number; metalness: number; roughness: number; opacity: number }> = {
  glass: { base: 0xa8ece1, emissive: 0x0a2f2a, metalness: 0.25, roughness: 0.35, opacity: 0.94 },
  bronze: { base: 0xd9925a, emissive: 0x241004, metalness: 0.5, roughness: 0.42, opacity: 1 },
  silver: { base: 0xe6ebf1, emissive: 0x121519, metalness: 0.5, roughness: 0.4, opacity: 1 },
  gold: { base: 0xf3cb62, emissive: 0x2e1d02, metalness: 0.5, roughness: 0.4, opacity: 1 },
};

/**
 * Aktywna gwiazda poziomu w szklanej bańce — całość w 3D (Three.js): fasetowana gwiazda obraca się wewnątrz przezroczystej kuli.
 * Biblioteka ładuje się dopiero na tym ekranie. Bez WebGL, przy „ogranicz ruch” i dla gwiazdy Lodowej (sople, topnienie) zostaje wersja SVG.
 */
export function Star3D({ tier, size = 60, melt = 0 }: { tier: StarTier; size?: number; melt?: number }) {
  const mount = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mount.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let disposed = false; let raf = 0; let cleanup = () => {};
    (async () => {
      try {
        const THREE = await import("three");
        if (disposed || !mount.current) return;
        const cfg = tier === "ice" ? null : COLORS[tier]; // Lodowa zostaje rysowana (sople, topnienie) — w 3D jest wtedy sama kula
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(size, size);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
        camera.position.set(0, 0, 5.6);

        // gwiazda: 5 ramion, wierzchołki na płaszczyźnie z=0 i dwa szczyty (przód / tył) — daje ostre fasety jak w logo
        const R = 1.0, r = 0.4, depth = 0.36;
        const ring: [number, number][] = [];
        for (let k = 0; k < 10; k++) { const a = Math.PI / 2 + (k * Math.PI) / 5; const rad = k % 2 === 0 ? R : r; ring.push([Math.cos(a) * rad, Math.sin(a) * rad]); }
        const pos: number[] = [];
        for (let k = 0; k < 10; k++) {
          const [ax, ay] = ring[k], [bx, by] = ring[(k + 1) % 10];
          pos.push(0, 0, depth, ax, ay, 0, bx, by, 0);   // przód
          pos.push(0, 0, -depth, bx, by, 0, ax, ay, 0);  // tył
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        geo.computeVertexNormals();
        const c = cfg ?? COLORS.glass;
        const mat = new THREE.MeshStandardMaterial({ color: c.base, emissive: c.emissive, metalness: c.metalness, roughness: c.roughness, flatShading: true, transparent: c.opacity < 1, opacity: c.opacity, side: THREE.DoubleSide });
        const star = new THREE.Mesh(geo, mat);
        if (cfg) scene.add(star);

        // szklana bańka: przezroczysta kula, widoczna dzięki jaśniejszej krawędzi (efekt Fresnela) — bez odblasków
        const bubbleGeo = new THREE.SphereGeometry(1.5, 48, 32);
        const bubbleMat = new THREE.ShaderMaterial({
          transparent: true, depthWrite: false,
          vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
          fragmentShader: "varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 2.4); gl_FragColor = vec4(vec3(1.0, 0.96, 0.88), f * 0.7 + 0.045); }",
        });
        const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
        bubble.renderOrder = 2;
        scene.add(bubble);
        scene.add(new THREE.AmbientLight(0xffffff, 0.28));
        const key = new THREE.DirectionalLight(0xffffff, 4.2); key.position.set(3.5, 4, 2.5); scene.add(key);
        const rim = new THREE.DirectionalLight(0xffe2a8, 1.6); rim.position.set(-4, -2, 1.5); scene.add(rim);
        const back = new THREE.PointLight(0xffffff, 6); back.position.set(0, 1.5, -3); scene.add(back);

        mount.current.appendChild(renderer.domElement);
        setReady(true);
        const t0 = performance.now();
        const tick = (now: number) => {
          const t = (now - t0) / 1000;
          star.rotation.y = t * 0.75;
          star.rotation.x = Math.sin(t * 0.6) * 0.28;
          star.rotation.z = Math.sin(t * 0.4) * 0.08;
          renderer.render(scene, camera);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        cleanup = () => { cancelAnimationFrame(raf); geo.dispose(); mat.dispose(); bubbleGeo.dispose(); bubbleMat.dispose(); renderer.dispose(); renderer.domElement.remove(); };
        if (disposed) cleanup();
      } catch { /* brak WebGL — zostaje gwiazda SVG */ }
    })();
    return () => { disposed = true; cleanup(); };
  }, [tier, size]);

  return (
    <span className={ready ? "relative grid place-items-center" : "orb-plain relative grid place-items-center"} style={{ width: size, height: size }} data-testid="star-3d" data-ready={ready}>
      {(!ready || tier === "ice") && <StarMark tier={tier} size={size * 0.58} melt={melt} className="relative z-10" />}
      <span ref={mount} className="absolute inset-0" aria-hidden />
    </span>
  );
}
