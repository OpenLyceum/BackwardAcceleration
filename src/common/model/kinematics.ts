/**
 * kinematics.ts
 *
 * Numerical derivatives of sampled motion, as pure functions. Velocity and
 * acceleration are both centred least-squares slopes over a sliding window — the
 * same kind of smoothing PASCO Capstone applies — so the virtual cart and a real
 * Smart Cart produce the same kind of trace. Adapted from CartCollisions
 * `src/common/model/fitMath.ts`.
 *
 * Acceleration comes from differentiating the encoder position twice, never from
 * the Smart Cart's accelerometer: an accelerometer at rest on an incline reads
 * g·sinθ, which is not the kinematic acceleration the lab asks about.
 */

/** Least-squares slope of `values` against `times` over the window [start, end). */
function slopeOver(times: readonly number[], values: readonly number[], start: number, end: number): number {
  const n = end - start;
  let sumT = 0;
  let sumV = 0;
  for (let i = start; i < end; i++) {
    sumT += times[i] as number;
    sumV += values[i] as number;
  }
  const meanT = sumT / n;
  const meanV = sumV / n;
  let numerator = 0;
  let denominator = 0;
  for (let i = start; i < end; i++) {
    const dt = (times[i] as number) - meanT;
    numerator += dt * ((values[i] as number) - meanV);
    denominator += dt * dt;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Derivative of `values` with respect to `times` at every sample: the slope of a
 * least-squares line through the `windowSize` samples centred on it (the window
 * slides inward at both ends so it never runs off the data).
 */
export function differentiate(times: readonly number[], values: readonly number[], windowSize: number): number[] {
  const n = Math.min(times.length, values.length);
  if (n < 2) {
    return new Array<number>(n).fill(0);
  }
  const width = Math.max(2, Math.min(windowSize, n));
  const half = Math.floor(width / 2);
  const result = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const start = Math.min(Math.max(i - half, 0), n - width);
    result[i] = slopeOver(times, values, start, start + width);
  }
  return result;
}

/** Rounds `position` to the nearest whole encoder count of size `resolution`. */
export function quantize(position: number, resolution: number): number {
  return Math.round(position / resolution) * resolution;
}

/** Median of a non-empty list (NaN when empty). */
export function median(values: readonly number[]): number {
  if (values.length === 0) {
    return Number.NaN;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[middle] as number)
    : ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
}
