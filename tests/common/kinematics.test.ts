import { describe, expect, it } from "vitest";
import { differentiate, median, quantize } from "../../src/common/model/kinematics.js";

describe("kinematics", () => {
  it("recovers v and a from a parabola x = ½·a·t² + v₀·t", () => {
    const times = Array.from({ length: 100 }, (_, i) => i * 0.02);
    const positions = times.map((t) => 0.5 * -0.33 * t * t + 0.7 * t);
    const velocities = differentiate(times, positions, 5);
    const accelerations = differentiate(times, velocities, 11);
    // Away from the ends, where the window is centred, the fits are exact for a parabola.
    for (let i = 8; i < times.length - 8; i++) {
      expect(velocities[i]).toBeCloseTo(0.7 - 0.33 * (times[i] as number), 9);
      expect(accelerations[i]).toBeCloseTo(-0.33, 9);
    }
  });

  it("survives encoder quantisation with a steady acceleration", () => {
    const resolution = 0.09895 / 816;
    const times = Array.from({ length: 120 }, (_, i) => i * 0.02);
    const positions = times.map((t) => quantize(0.5 * 0.32 * t * t, resolution));
    const accelerations = differentiate(times, differentiate(times, positions, 5), 11);
    const middle = accelerations.slice(10, -10);
    for (const a of middle) {
      expect(a).toBeGreaterThan(0.25);
      expect(a).toBeLessThan(0.4);
    }
  });

  it("handles tiny inputs and medians", () => {
    expect(differentiate([], [], 5)).toEqual([]);
    expect(differentiate([0], [1], 5)).toEqual([0]);
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeNaN();
  });
});
