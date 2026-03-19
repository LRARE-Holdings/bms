"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Dramatic, cinematic heat. Intense warm gradients concentrate at centre,
 * pulse like a heartbeat, and shift with cursor movement.
 */

interface Orb {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  rgb: string;
  alpha: number;
  phaseX: number;
  phaseY: number;
  speedX: number;
  speedY: number;
  breathPhase: number;
  breathSpeed: number;
}

const ORB_CONFIGS = [
  // CORE — intense gold flood behind wordmark
  { bx: 0.5, by: 0.48, r: 0.55, color: "196,169,90", alpha: 0.4, sX: 0.08, sY: 0.06, bS: 0.18 },
  // Hot ember core — smaller, brighter, pulsing
  { bx: 0.48, by: 0.5, r: 0.3, color: "212,113,58", alpha: 0.35, sX: 0.2, sY: 0.18, bS: 0.4 },
  // Blush haze — offset right, warmth spill
  { bx: 0.65, by: 0.55, r: 0.4, color: "232,147,106", alpha: 0.25, sX: 0.14, sY: 0.16, bS: 0.3 },
  // Wide gold wash — bottom, rising heat
  { bx: 0.35, by: 0.8, r: 0.65, color: "196,169,90", alpha: 0.28, sX: 0.1, sY: 0.07, bS: 0.2 },
  // Wheat bloom — upper atmosphere
  { bx: 0.7, by: 0.15, r: 0.45, color: "223,208,165", alpha: 0.18, sX: 0.12, sY: 0.14, bS: 0.22 },
  // Secondary ember — left side drama
  { bx: 0.2, by: 0.45, r: 0.35, color: "212,113,58", alpha: 0.2, sX: 0.16, sY: 0.12, bS: 0.35 },
  // Gold accent — top left
  { bx: 0.15, by: 0.2, r: 0.3, color: "196,169,90", alpha: 0.14, sX: 0.18, sY: 0.1, bS: 0.32 },
  // Huge ambient glow — entire canvas, barely there
  { bx: 0.5, by: 0.5, r: 0.85, color: "223,208,165", alpha: 0.06, sX: 0.04, sY: 0.04, bS: 0.1 },
];

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 });
  const orbsRef = useRef<Orb[]>([]);
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const initOrbs = useCallback((w: number, h: number) => {
    orbsRef.current = ORB_CONFIGS.map((cfg, i) => ({
      x: cfg.bx * w,
      y: cfg.by * h,
      baseX: cfg.bx * w,
      baseY: cfg.by * h,
      radius: cfg.r * Math.max(w, h),
      rgb: cfg.color,
      alpha: cfg.alpha,
      phaseX: (i * Math.PI * 2) / ORB_CONFIGS.length,
      phaseY: (i * Math.PI * 2) / ORB_CONFIGS.length + Math.PI * 0.5,
      speedX: cfg.sX,
      speedY: cfg.sY,
      breathPhase: (i * Math.PI) / 3,
      breathSpeed: cfg.bS,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      initOrbs(rect.width, rect.height);
    }

    resize();
    window.addEventListener("resize", resize);

    function handleMouseMove(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      targetMouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    }

    function handleMouseLeave() {
      targetMouseRef.current = { x: 0.5, y: 0.5 };
    }

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    let lastTime = performance.now();

    function animate(now: number) {
      if (!canvas || !ctx) return;

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      timeRef.current += dt;

      const lerp = 1 - Math.pow(0.025, dt);
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * lerp;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * lerp;

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, w, h);

      const t = timeRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const orb of orbsRef.current) {
        const driftX = Math.sin(t * orb.speedX + orb.phaseX) * w * 0.14;
        const driftY = Math.cos(t * orb.speedY + orb.phaseY) * h * 0.14;

        const cursorOffsetX = (mx - 0.5) * w * 0.25;
        const cursorOffsetY = (my - 0.5) * h * 0.25;

        orb.x = orb.baseX + driftX + cursorOffsetX;
        orb.y = orb.baseY + driftY + cursorOffsetY;

        const breathScale = 1 + Math.sin(t * orb.breathSpeed + orb.breathPhase) * 0.3;
        const r = orb.radius * breathScale;

        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r);
        const { rgb, alpha } = orb;
        grad.addColorStop(0, `rgba(${rgb},${alpha})`);
        grad.addColorStop(0.2, `rgba(${rgb},${alpha * 0.9})`);
        grad.addColorStop(0.5, `rgba(${rgb},${alpha * 0.4})`);
        grad.addColorStop(1, `rgba(${rgb},0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [initOrbs]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
