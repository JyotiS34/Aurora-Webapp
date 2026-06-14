import { useRef, useEffect } from 'react';

/**
 * AuroraField
 *
 * Props:
 *   series:   [{ data: number[], color: string, label?: string }]
 *   height:   canvas height in px (default 120)
 *   animated: add ambient sine-wave drift (default true)
 *   showAxes: draw light axis lines (default false)
 *   padding:  horizontal padding inside canvas (default 12)
 */
export default function AuroraField({
  series = [],
  height = 120,
  animated = true,
  showAxes = false,
  padding = 12,
}) {
  const canvasRef = useRef(null);
  const frameRef  = useRef(null);
  const timeRef   = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Resolve CSS custom properties for colors
    const style = getComputedStyle(document.documentElement);
    const surface2 = style.getPropertyValue('--surface-2').trim() || '#1A2436';

    let w, h;

    function resize() {
      const dpr  = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    function drawSeries(data, color, time, index) {
      if (!data || data.length < 2) return;
      const n   = data.length;
      const xStep = (w - padding * 2) / (n - 1);

      // Glow pass (wider, lower opacity)
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur  = 18;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = padding + i * xStep;
        const drift = animated
          ? Math.sin(time * 0.9 + i * 0.25 + index * 1.3) * 0.025
          : 0;
        const y = h - padding - (data[i] + drift) * (h - padding * 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth   = 8;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.stroke();
      ctx.restore();

      // Crisp ribbon pass
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = padding + i * xStep;
        const drift = animated
          ? Math.sin(time * 0.9 + i * 0.25 + index * 1.3) * 0.025
          : 0;
        const y = h - padding - (data[i] + drift) * (h - padding * 2);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // Smooth catmull-rom-like bezier
          const px = padding + (i - 1) * xStep;
          const cpx = (px + x) / 2;
          const py  = h - padding - (data[i - 1] + (animated ? Math.sin(time * 0.9 + (i-1) * 0.25 + index * 1.3) * 0.025 : 0)) * (h - padding * 2);
          ctx.bezierCurveTo(cpx, py, cpx, y, x, y);
        }
      }
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      ctx.restore();
    }

    function draw(time) {
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = surface2;
      ctx.fillRect(0, 0, w, h);

      // Subtle grid lines
      if (showAxes) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth   = 1;
        for (let i = 1; i < 4; i++) {
          const y = (h / 4) * i;
          ctx.beginPath();
          ctx.moveTo(padding, y);
          ctx.lineTo(w - padding, y);
          ctx.stroke();
        }
        ctx.restore();
      }

      series.forEach((s, idx) => drawSeries(s.data, s.color, time, idx));
    }

    function tick(ts) {
      timeRef.current = ts / 1000;
      resize();
      draw(timeRef.current);
      if (animated) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    resize();
    if (animated) {
      frameRef.current = requestAnimationFrame(tick);
    } else {
      draw(0);
    }

    const ro = new ResizeObserver(() => { resize(); if (!animated) draw(0); });
    ro.observe(canvas);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, [series, animated, showAxes, padding]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: `${height}px`, borderRadius: 'var(--radius)' }}
    />
  );
}
