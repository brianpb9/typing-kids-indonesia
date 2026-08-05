/**
 * Animation & celebration effects — confetti, stars, sparkles
 * Lightweight canvas + DOM; no external libraries.
 */
import { CONFIG } from './config.js';

const CONFETTI_COLORS = [
  '#FF6B6B', '#FFB347', '#FFE566', '#A8E6A1',
  '#74B9FF', '#A29BFE', '#FD79A8', '#55EFC4',
  '#FF9FF3', '#81ECEC',
];

export class AnimationManager {
  constructor() {
    /** @type {HTMLCanvasElement | null} */
    this.canvas = null;
    /** @type {CanvasRenderingContext2D | null} */
    this.ctx = null;
    this.particles = [];
    this.raf = 0;
    this.running = false;
    /** @type {MediaQueryList | null} */
    this._motionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    // If the user switches to reduced motion mid-burst, drop live particles.
    this._motionQuery?.addEventListener?.('change', () => {
      if (this._motionQuery.matches) {
        this.particles.length = 0;
        this._clear();
      }
    });
  }

  /** True when the user prefers reduced motion — particles become no-ops. */
  get _reducedMotion() {
    return !!this._motionQuery?.matches;
  }

  /**
   * @param {HTMLCanvasElement} canvas
   */
  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  /** Burst confetti + stars for word complete */
  celebrate() {
    if (this._reducedMotion) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h * 0.35;
    const count = CONFIG.ui.confettiCount;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 4 + Math.random() * 10;
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed * (0.5 + Math.random()),
        vy: Math.sin(angle) * speed * 0.4 - Math.random() * 8 - 4,
        w: 6 + Math.random() * 8,
        h: 4 + Math.random() * 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.25,
        life: 1,
        decay: 0.008 + Math.random() * 0.01,
        shape: Math.random() > 0.7 ? 'star' : 'rect',
        gravity: 0.18 + Math.random() * 0.08,
      });
    }

    // Extra stars from center
    for (let i = 0; i < CONFIG.ui.starCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        w: 10 + Math.random() * 10,
        h: 10,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rot: 0,
        vr: 0.05,
        life: 1,
        decay: 0.012,
        shape: 'star',
        gravity: 0.1,
      });
    }

    this._startLoop();
  }

  /** Tiny sparkles near an element (correct letter) */
  sparkleAt(element) {
    if (!element || this._reducedMotion) return;
    const rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        w: 4 + Math.random() * 4,
        h: 4,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rot: 0,
        vr: 0.1,
        life: 1,
        decay: 0.03,
        shape: 'star',
        gravity: 0.05,
      });
    }
    this._startLoop();
  }

  _startLoop() {
    if (this.running) return;
    this.running = true;
    const tick = () => {
      this._update();
      this._draw();
      if (this.particles.length) {
        this.raf = requestAnimationFrame(tick);
      } else {
        this.running = false;
        this._clear();
      }
    };
    this.raf = requestAnimationFrame(tick);
  }

  _update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.rot += p.vr;
      p.life -= p.decay;
      if (p.life <= 0 || p.y > window.innerHeight + 40) {
        this.particles.splice(i, 1);
      }
    }
  }

  _draw() {
    if (!this.ctx || !this.canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.ctx.clearRect(0, 0, w, h);

    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rot);
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.fillStyle = p.color;

      if (p.shape === 'star') {
        this._drawStar(0, 0, 5, p.w / 2, p.w / 4);
      } else {
        this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      this.ctx.restore();
    }
  }

  _drawStar(cx, cy, spikes, outer, inner) {
    const ctx = this.ctx;
    if (!ctx) return;
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outer);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
      rot += step;
    }
    ctx.closePath();
    ctx.fill();
  }

  _clear() {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  /**
   * CSS class pulse helpers
   * @param {HTMLElement} el
   * @param {string} className
   * @param {number} ms
   */
  pulseClass(el, className, ms = 400) {
    if (!el) return;
    el.classList.remove(className);
    // force reflow
    void el.offsetWidth;
    el.classList.add(className);
    setTimeout(() => el.classList.remove(className), ms);
  }
}

export default AnimationManager;
