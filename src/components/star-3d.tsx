"use client";

import { useEffect, useRef, useState } from "react";
import type { StarTier } from "@/lib/gamification";
import { cn } from "@/lib/cn";
import { StarMark } from "./star";
import { addLights, buildStar, renderStarImage } from "./star-three";

/** Statyczna gwiazda wyrenderowana w Three.js (raz, do obrazka). Zanim się wyrenderuje albo bez WebGL — wersja SVG. */
export function StarImage({ tier, size, melt = 0, dimmed = false, className }: { tier: StarTier; size: number; melt?: number; dimmed?: boolean; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { let on = true; renderStarImage(tier, melt, 192).then((u) => { if (on) setUrl(u); }); return () => { on = false; }; }, [tier, melt]);
  if (!url) return <StarMark tier={tier} size={size} melt={melt} dimmed={dimmed} className={className} />;
  // eslint-disable-next-line @next/next/no-img-element -- obrazek wyrenderowany lokalnie w przeglądarce
  return <img src={url} alt="" width={size} height={size} style={{ width: size, height: size }} className={cn(dimmed && "opacity-70 saturate-[.85]", className)} data-star-3d={tier} />;
}

/**
 * Aktywna gwiazda poziomu w szklanej bańce — całość w 3D (Three.js): gwiazda obraca się wewnątrz przezroczystej kuli.
 * Lodowa ma sople, śnieg i topnienie także w 3D. Bez WebGL i przy „ogranicz ruch” zostaje wersja SVG.
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
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(size, size);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
        camera.position.set(0, 0, 5.6);
        addLights(THREE, scene);
        const star = buildStar(THREE, tier, melt);
        star.group.scale.setScalar(tier === "ice" ? 0.82 : 1);
        scene.add(star.group);

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

        mount.current.appendChild(renderer.domElement);
        setReady(true);
        const t0 = performance.now();
        const tick = (now: number) => {
          const t = (now - t0) / 1000;
          star.spin.rotation.y = t * 0.75;
          star.spin.rotation.x = Math.sin(t * 0.6) * 0.22;
          renderer.render(scene, camera);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        cleanup = () => { cancelAnimationFrame(raf); star.dispose(); bubbleGeo.dispose(); bubbleMat.dispose(); renderer.dispose(); renderer.domElement.remove(); };
        if (disposed) cleanup();
      } catch { /* brak WebGL — zostaje gwiazda SVG */ }
    })();
    return () => { disposed = true; cleanup(); };
  }, [tier, size, melt]);

  return (
    <span className={ready ? "relative grid place-items-center" : "orb-plain relative grid place-items-center"} style={{ width: size, height: size }} data-testid="star-3d" data-ready={ready}>
      {!ready && <StarMark tier={tier} size={size * 0.58} melt={melt} className="relative z-10" />}
      <span ref={mount} className="absolute inset-0" aria-hidden />
    </span>
  );
}
