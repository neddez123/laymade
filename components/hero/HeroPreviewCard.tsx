"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { featuredTemplates } from "@/app/data/templates";

const CYCLE_MS = 6000;

export function HeroPreviewCard() {
  const items = featuredTemplates();
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 140, damping: 18, mass: 0.6 };
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), springConfig);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3, -3]), springConfig);
  const lift = useSpring(0, springConfig);

  useEffect(() => {
    if (items.length <= 1 || hovering) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [items.length, hovering]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseEnter() {
    setHovering(true);
    lift.set(-2);
  }

  function handleMouseLeave() {
    setHovering(false);
    mouseX.set(0);
    mouseY.set(0);
    lift.set(0);
  }

  if (items.length === 0) return null;
  const active = items[index];

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <Link
        href={`/templates/${active.slug}`}
        className="block w-full active:scale-[0.985] transition-transform duration-150 ease-out"
        aria-label={`View ${active.name}`}
      >
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateY,
            rotateX,
            y: lift,
            transformPerspective: 1200,
          }}
          className="relative w-full aspect-[4/3] bg-[color:var(--paper)] border border-[color:var(--muted)]/40 overflow-hidden cursor-pointer shadow-[0_1px_2px_rgba(22,22,22,0.04)] will-change-transform"
        >
          {items.map((item, i) => (
            <div
              key={item.slug}
              className="absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{ opacity: i === index ? 1 : 0 }}
              aria-hidden={i !== index}
            >
              <Image
                src={item.heroScreenshot}
                alt={`${item.name} hero`}
                fill
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-top"
              />
            </div>
          ))}

          <div className="absolute bottom-0 left-0 right-0 px-5 py-4 bg-gradient-to-t from-black/65 via-black/25 to-transparent text-white flex items-end justify-between pointer-events-none">
            <div>
              <p className="font-[family-name:var(--font-serif)] text-xl leading-none">
                {active.name}
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] opacity-85 mt-1.5">
                {active.vertical}
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.14em] opacity-85">
              Preview →
            </span>
          </div>
        </motion.div>
      </Link>

      {items.length > 1 && (
        <div className="flex items-center gap-2" role="tablist" aria-label="Featured templates">
          {items.map((t, i) => (
            <button
              key={t.slug}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show ${t.name}`}
              onClick={() => setIndex(i)}
              className={`h-[3px] transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                i === index
                  ? "w-7 bg-[color:var(--accent)]"
                  : "w-3 bg-[color:var(--muted)] hover:bg-[color:var(--ink-soft)]"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
