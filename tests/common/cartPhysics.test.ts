import { describe, expect, it } from "vitest";
import { GRAVITY, TRACK_LENGTH } from "../../src/BackwardAccelerationConstants.js";
import { accelerationAt, advanceCart, type TrackParameters } from "../../src/common/model/cartPhysics.js";

const incline = (height: number, friction = 0): TrackParameters => ({
  inclineHeight: height,
  trackLength: TRACK_LENGTH,
  friction,
});

describe("cartPhysics", () => {
  it("a frictionless cart on an incline accelerates at g·h/L", () => {
    const params = incline(0.04);
    expect(accelerationAt(0, params)).toBeCloseTo((GRAVITY * 0.04) / TRACK_LENGTH, 12);
    const after = advanceCart({ position: 0, velocity: 0 }, 1, params);
    expect(after.velocity).toBeCloseTo((GRAVITY * 0.04) / TRACK_LENGTH, 12);
    expect(after.position).toBeCloseTo((0.5 * GRAVITY * 0.04) / TRACK_LENGTH, 12);
  });

  it("the steeper incline doubles the acceleration (A vs. B)", () => {
    expect(accelerationAt(0, incline(0.08)) / accelerationAt(0, incline(0.04))).toBeCloseTo(2, 3);
  });

  it("a braked cart slows in either direction and stops for good on a level track", () => {
    const params = incline(0, 0.1);
    for (const v0 of [0.8, -0.8]) {
      expect(Math.sign(accelerationAt(v0, params))).toBe(-Math.sign(v0));
      const after = advanceCart({ position: 0.5, velocity: v0 }, 5, params);
      expect(after.velocity).toBe(0);
      // v² = 2·μ·g·d
      expect(Math.abs(after.position - 0.5)).toBeCloseTo((0.8 * 0.8) / (2 * 0.1 * GRAVITY), 9);
    }
  });

  it("static friction holds a braked cart on a gentle incline", () => {
    expect(accelerationAt(0, incline(0.04, 0.1))).toBe(0);
    expect(advanceCart({ position: 0.3, velocity: 0 }, 1, incline(0.04, 0.1))).toEqual({ position: 0.3, velocity: 0 });
  });

  it("pushed up a frictionless ramp, the cart turns around with one constant acceleration (E)", () => {
    const params = incline(0.04);
    const a = accelerationAt(0, params);
    const start = { position: 1, velocity: -0.7 }; // up the ramp is −s
    const tPeak = 0.7 / a;
    const atPeak = advanceCart(start, tPeak, params);
    expect(atPeak.velocity).toBeCloseTo(0, 9);
    const back = advanceCart(start, 2 * tPeak, params);
    expect(back.position).toBeCloseTo(1, 9);
    expect(back.velocity).toBeCloseTo(0.7, 9);
  });

  it("with rolling friction the acceleration is smaller going down than going up", () => {
    const params = incline(0.04, 0.004);
    expect(Math.abs(accelerationAt(-0.5, params))).toBeGreaterThan(Math.abs(accelerationAt(0.5, params)));
  });
});
