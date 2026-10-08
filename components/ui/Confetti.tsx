"use client";

import { useEffect, useRef, useState } from "react";

const COLORS = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#9b5de5", "#f15bb5"];
const PARTICLE_COUNT = 80;
const GRAVITY = 0.15;
const DRAG = 0.02;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  color: string;
  shape: "rect" | "circle";
}

function createParticle(width: number): Particle {
  const angle = (Math.random() * Math.PI * 2);
  const speed = 8 + Math.random() * 8;
  return {
    x: width / 2,
    y: 0,
    vx: Math.cos(angle) * speed,
    vy: -Math.abs(Math.sin(angle) * speed) - 4,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 15,
    size: 6 + Math.random() * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: Math.random() > 0.5 ? "rect" : "circle",
  };
}

export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!active || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(canvas.width));
    }

    let animationId: number;
    let frame = 0;
    const maxFrames = 300;

    const animate = () => {
      if (frame >= maxFrames) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.vy += GRAVITY;
        p.vx *= (1 - DRAG);
        p.vy *= (1 - DRAG);
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      }

      frame++;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [active, prefersReducedMotion]);

  if (!active || prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      aria-hidden="true"
    />
  );
}
