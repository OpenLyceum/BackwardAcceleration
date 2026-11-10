import { describe, expect, it } from "vitest";
import { EXPERIMENT_PRESETS } from "../../src/common/model/Experiment.js";
import { differentiate } from "../../src/common/model/kinematics.js";
import { findRunWindow, phaseSigns, Sign } from "../../src/common/model/motionAnalysis.js";

const DT = 0.02;

/** Samples x(t) at 50 Hz from 0 to `duration`. */
function sample(duration: number, x: (t: number) => number) {
  const times = Array.from({ length: Math.round(duration / DT) + 1 }, (_, i) => i * DT);
  const positions = times.map(x);
  return { times, positions, velocities: differentiate(times, positions, 5) };
}

describe("findRunWindow", () => {
  it("release from rest: starts as the cart starts, ends at the bumper (A)", () => {
    // At rest 0.5 s, then a = 0.32 m/s² for 2 s, then the bumper reverses it.
    const a = 0.32;
    const vEnd = a * 2;
    const xEnd = 0.5 * a * 4;
    const run = sample(3.5, (t) => (t < 0.5 ? 0 : t < 2.5 ? 0.5 * a * (t - 0.5) ** 2 : xEnd - 0.5 * vEnd * (t - 2.5)));
    const window = findRunWindow(run.times, run.velocities, EXPERIMENT_PRESETS.A);
    expect(window).not.toBeNull();
    const start = run.times[window!.start] as number;
    const end = run.times[window!.end] as number;
    expect(start).toBeGreaterThan(0.35);
    expect(start).toBeLessThan(0.75);
    expect(end).toBeGreaterThan(2.3);
    expect(end).toBeLessThan(2.55);
  });

  it("push with brake: starts when the hand lets go, ends when the cart stops (C)", () => {
    // 0.3 s still, 0.2 s push to 0.8 m/s, then braking at −0.98 m/s² until stopped.
    const push = 4; // m/s²
    const brake = 0.98;
    const tRelease = 0.5;
    const xRelease = 0.5 * push * 0.2 ** 2;
    const tStop = tRelease + 0.8 / brake;
    const run = sample(2.5, (t) => {
      if (t < 0.3) {
        return 0;
      }
      if (t < tRelease) {
        return 0.5 * push * (t - 0.3) ** 2;
      }
      const u = Math.min(t, tStop) - tRelease;
      return xRelease + 0.8 * u - 0.5 * brake * u * u;
    });
    const window = findRunWindow(run.times, run.velocities, EXPERIMENT_PRESETS.C);
    expect(window).not.toBeNull();
    expect(run.times[window!.start]).toBeGreaterThan(0.42);
    expect(run.times[window!.start]).toBeLessThan(0.6);
    expect(run.times[window!.end]).toBeGreaterThan(tStop - 0.15);
    expect(run.times[window!.end]).toBeLessThan(tStop + 0.1);
  });

  it("up and down: keeps the turning point and ends at the catch (E)", () => {
    const a = -0.33;
    const tPeak = 0.7 / 0.33;
    const tCatch = 2 * tPeak;
    const run = sample(tCatch + 0.6, (t) => {
      if (t < 0.2) {
        return 0.5 * 3.5 * t * t; // the push
      }
      const u = Math.min(t, tCatch) - 0.2;
      return 0.07 + 0.7 * u + 0.5 * a * u * u;
    });
    const window = findRunWindow(run.times, run.velocities, EXPERIMENT_PRESETS.E);
    expect(window).not.toBeNull();
    expect(run.times[window!.start]).toBeLessThan(0.35);
    expect(run.times[window!.end]).toBeGreaterThan(tCatch - 0.1);
  });

  it("returns null when the cart never moved", () => {
    const still = sample(1, () => 0);
    expect(findRunWindow(still.times, still.velocities, EXPERIMENT_PRESETS.A)).toBeNull();
  });
});

describe("phaseSigns", () => {
  it("up and down: v + then 0 then −, a − throughout", () => {
    const times = Array.from({ length: 200 }, (_, i) => i * DT);
    const velocities = times.map((t) => 0.7 - 0.33 * t);
    const accelerations = times.map(() => -0.33);
    expect(phaseSigns(velocities, accelerations, true)).toEqual({
      velocity: [Sign.POSITIVE, Sign.ZERO, Sign.NEGATIVE],
      acceleration: [Sign.NEGATIVE, Sign.NEGATIVE, Sign.NEGATIVE],
    });
  });

  it("braked push toward −x: v −, a +", () => {
    const velocities = Array.from({ length: 40 }, (_, i) => -0.8 + i * 0.019);
    const accelerations = velocities.map(() => 0.98);
    const signs = phaseSigns(velocities, accelerations, false);
    expect(signs?.acceleration).toEqual([Sign.POSITIVE, Sign.POSITIVE, Sign.POSITIVE]);
    expect(signs?.velocity[0]).toBe(Sign.NEGATIVE);
  });

  it("needs enough samples", () => {
    expect(phaseSigns([1, 2], [0, 0], false)).toBeNull();
  });
});
