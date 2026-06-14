/**
 * lib/sampleData.js — deterministic synthetic data for visualisations.
 *
 * Uses a seeded pseudo-random function so the charts look the same on every
 * render without needing useState/useRef to freeze values.
 */

/** Seeded LCG pseudo-random — returns [0, 1) */
function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

/**
 * Generate a smooth decaying-noise curve (suitable for loss).
 * start: initial value (~0.8-1.0)
 * end:   final value (~0.1-0.3)
 * n:     number of data points
 */
export function lossCurve(start, end, n = 40, noiseMag = 0.04, seed = 42) {
  const rand = seededRng(seed);
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const base = start + (end - start) * (1 - Math.exp(-4 * t));
    const noise = (rand() - 0.5) * noiseMag * (1 - t * 0.6);
    return Math.max(0.01, Math.min(1, base + noise));
  });
}

/**
 * Generate a smooth rising curve (suitable for accuracy).
 * Mirrors a sigmoid ramp from start to end.
 */
export function accCurve(start, end, n = 40, noiseMag = 0.025, seed = 99) {
  const rand = seededRng(seed);
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const sigmoid = 1 / (1 + Math.exp(-8 * (t - 0.45)));
    const base = start + (end - start) * sigmoid;
    const noise = (rand() - 0.5) * noiseMag * (1 - Math.abs(t - 0.5));
    return Math.max(0.01, Math.min(1, base + noise));
  });
}

/**
 * GPU utilisation series — alternating high-compute / sync valleys.
 * Simulates the compute → all_reduce → step cycle of DDP.
 */
export function gpuUtilSeries(n = 60, baseUtil = 0.82, seed = 7) {
  const rand = seededRng(seed);
  return Array.from({ length: n }, (_, i) => {
    const cycle = i % 8; // 8 steps per DDP cycle
    if (cycle === 5 || cycle === 6) {
      // all_reduce valley — brief dip
      return 0.35 + rand() * 0.15;
    }
    return baseUtil + (rand() - 0.5) * 0.1;
  });
}

/**
 * Phase 1 training curves (frozen encoder, training classifier head only).
 * Faster convergence, less noise.
 */
export const phase1Loss = lossCurve(0.92, 0.38, 30, 0.035, 11);
export const phase1Acc  = accCurve(0.41, 0.71, 30, 0.020, 22);

/**
 * Phase 2 training curves (top 4 layers unfrozen).
 * Starts where Phase 1 ended, improves further.
 */
export const phase2Loss = lossCurve(0.40, 0.18, 30, 0.025, 33);
export const phase2Acc  = accCurve(0.70, 0.84, 30, 0.018, 44);

/** Full combined curves (for hero aurora) */
export const heroLoss = [...lossCurve(0.92, 0.18, 60, 0.03, 55)];
export const heroAcc  = [...accCurve(0.41, 0.84, 60, 0.02, 66)];

/** GPU utilisation for rank 0 and rank 1 */
export const rank0Util = gpuUtilSeries(60, 0.84, 7);
export const rank1Util = gpuUtilSeries(60, 0.80, 13);

/** Normalize an array to [0, 1] range */
export function normalize(arr) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  return arr.map(v => (v - min) / (max - min || 1));
}
