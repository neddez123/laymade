"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { featuredTemplates } from "@/app/data/templates";

// Orbit keyframes reverse-engineered from tasteskill.dev DOM inspection.
// x, y = % of card's own dimensions; z = px depth; s = scale; o = opacity
const ORBIT = [
  { t: 0.00, x: -60, y: -350, z: -1000, s: 0.44, o: 0.00 },
  { t: 0.16, x: -60, y: -306, z:  -690, s: 0.62, o: 0.55 },
  { t: 0.30, x: -60, y: -175, z:    63, s: 1.05, o: 0.90 },
  { t: 0.42, x: -56, y:  -44, z:   273, s: 1.18, o: 1.00 },
  { t: 0.55, x:  46, y:   20, z:    21, s: 1.03, o: 0.88 },
  { t: 0.68, x: 177, y:   20, z:  -522, s: 0.72, o: 0.62 },
  { t: 0.80, x: 270, y:   20, z: -1000, s: 0.44, o: 0.00 },
  { t: 1.00, x: -60, y: -350, z: -1000, s: 0.44, o: 0.00 },
];

function lerp(a: number, b: number, u: number) {
  return a + (b - a) * u;
}

function orbitAt(t: number) {
  t = ((t % 1) + 1) % 1;
  let k = ORBIT.length - 2;
  for (let i = 0; i < ORBIT.length - 1; i++) {
    if (t < ORBIT[i + 1].t) { k = i; break; }
  }
  const a = ORBIT[k], b = ORBIT[k + 1];
  const u = (t - a.t) / (b.t - a.t);
  return {
    x: lerp(a.x, b.x, u),
    y: lerp(a.y, b.y, u),
    z: lerp(a.z, b.z, u),
    s: lerp(a.s, b.s, u),
    o: lerp(a.o, b.o, u),
  };
}

// One full revolution ≈ 55 seconds
const SPEED = 0.000018;

export function HeroPreviewCard() {
  const router = useRouter();
  const source = featuredTemplates();

  const padFactor = source.length > 0 ? Math.ceil(8 / source.length) : 1;
  const cards = source.length > 0
    ? Array.from({ length: padFactor }, () => source).flat()
    : [];
  const N = cards.length;

  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const angleRef     = useRef(0);
  const tiltX        = useRef(0);
  const tiltY        = useRef(0);
  const targetTiltX  = useRef(0);
  const targetTiltY  = useRef(0);
  const dragging     = useRef(false);
  const dragX0       = useRef(0);
  const angle0       = useRef(0);
  const moved        = useRef(false);
  const lastT        = useRef<number | null>(null);

  useEffect(() => {
    if (N === 0) return;
    let raf: number;

    function tick(now: number) {
      const dt = lastT.current != null ? now - lastT.current : 16;
      lastT.current = now;

      // Only pause auto-rotation while actively dragging
      if (!dragging.current) {
        angleRef.current = ((angleRef.current - SPEED * dt) % 1 + 1) % 1;
      }

      // Smooth tilt toward mouse target
      tiltX.current += (targetTiltX.current - tiltX.current) * 0.06;
      tiltY.current += (targetTiltY.current - tiltY.current) * 0.06;
      if (wrapRef.current) {
        wrapRef.current.style.transform =
          `rotateX(${tiltX.current}deg) rotateY(${tiltY.current}deg)`;
      }

      for (let i = 0; i < N; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const p = orbitAt(angleRef.current + i / N);
        el.style.transform =
          `translate3d(calc(${p.x}%), calc(${p.y}%), ${p.z}px) scale(${p.s})`;
        el.style.opacity       = String(p.o);
        el.style.zIndex        = String(Math.round(50 + p.z / 25));
        el.style.pointerEvents = p.o > 0.5 ? "auto" : "none";
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [N]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    moved.current    = false;
    dragX0.current   = e.clientX;
    angle0.current   = angleRef.current;
    lastT.current    = null;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const dx = e.clientX - dragX0.current;
    if (Math.abs(dx) > 5) moved.current = true;
    const w = wrapRef.current?.clientWidth ?? 700;
    angleRef.current = ((angle0.current + dx / w * 0.6) % 1 + 1) % 1;
  }

  function onPointerUp() {
    dragging.current = false;
    lastT.current    = null;
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (dragging.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left)  / rect.width  - 0.5;
    const ny = (e.clientY - rect.top)   / rect.height - 0.5;
    targetTiltX.current = ny * -6;
    targetTiltY.current = nx *  8;
  }

  function onMouseLeave() {
    targetTiltX.current = 0;
    targetTiltY.current = 0;
  }

  if (cards.length === 0) return null;

  return (
    <div
      className="relative w-full h-full"
      style={{ perspective: "900px" }}
    >
      <div
        ref={wrapRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
        style={{ transformStyle: "preserve-3d" }}
        onMouseLeave={onMouseLeave}
        onMouseMove={onMouseMove}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {cards.map((item, i) => (
          <div
            key={`${item.slug}-${i}`}
            ref={el => { cardRefs.current[i] = el; }}
            className="absolute left-1/2 top-1/2 w-[48%] overflow-hidden rounded-[18px]"
            style={{
              willChange: "transform, opacity",
              boxShadow: "0 22px 32px rgba(20,20,20,0.18)",
            }}
            onClick={() => {
              if (!moved.current) router.push(`/templates/${item.slug}`);
            }}
          >
            <div className="relative w-full" style={{ aspectRatio: "3/2" }}>
              <Image
                src={item.heroScreenshot}
                alt={item.name}
                fill
                sizes="(max-width: 768px) 80vw, 40vw"
                className="object-cover object-top pointer-events-none"
                draggable={false}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent text-white pointer-events-none">
              <p className="font-[family-name:var(--font-serif)] text-sm leading-none">
                {item.name}
              </p>
              <p className="text-[9px] uppercase tracking-[0.14em] opacity-80 mt-1">
                {item.vertical}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
