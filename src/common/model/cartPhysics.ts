/**
 * cartPhysics.ts
 *
 * One-dimensional motion of a cart along a straight track, as pure functions.
 *
 * Coordinate: `s` runs along the track from its left (raised) end toward the
 * right (low) end, so gravity's component along the track is +g·sinθ. Friction —
 * the cart's small rolling resistance plus, when the brake is on, the tape
 * dragging on the track — opposes the motion with magnitude μ·g·cosθ:
 *
 *   a = g·sinθ − sign(u)·μ·g·cosθ        (u = ds/dt ≠ 0)
 *
 * Between turning points the acceleration is constant, so each step is advanced
 * exactly (s += u·t + ½·a·t²). When the velocity would pass through zero the step
 * is split at that instant: the cart then either stays put (static friction can
 * hold it, |g·sinθ| ≤ μ·g·cosθ) or sets off the other way with the new sign of
 * friction. That is what makes the up-and-down run (experiment E) come out with
 * one constant, negative acceleration through the turning point.
 */

import { GRAVITY } from "../../BackwardAccelerationConstants.js";

export type CartState = {
  /** Position of the cart's centre along the track, m. */
  readonly position: number;
  /** Velocity along the track, m/s (positive = toward the low end). */
  readonly velocity: number;
};

export type TrackParameters = {
  /** Height of the raised end above the low end, m. */
  readonly inclineHeight: number;
  /** Track length, m. */
  readonly trackLength: number;
  /** Total friction coefficient (rolling plus brake). */
  readonly friction: number;
};

export function sinTheta(params: TrackParameters): number {
  return Math.min(1, Math.max(0, params.inclineHeight / params.trackLength));
}

/** Component of gravity along the track toward the low end, m/s². */
export function gravityAlongTrack(params: TrackParameters): number {
  return GRAVITY * sinTheta(params);
}

/** Magnitude of the friction acceleration, m/s². */
export function frictionMagnitude(params: TrackParameters): number {
  const sin = sinTheta(params);
  return params.friction * GRAVITY * Math.sqrt(1 - sin * sin);
}

/**
 * Acceleration along the track for a cart with this velocity. A cart at rest
 * gets the acceleration it would start off with, or 0 if friction holds it.
 */
export function accelerationAt(velocity: number, params: TrackParameters): number {
  const gravity = gravityAlongTrack(params);
  const friction = frictionMagnitude(params);
  if (velocity !== 0) {
    return gravity - Math.sign(velocity) * friction;
  }
  if (Math.abs(gravity) <= friction) {
    return 0;
  }
  return gravity - Math.sign(gravity) * friction;
}

/** Advances the cart by `dt` seconds, exactly, splitting the step where the velocity reaches zero. */
export function advanceCart(state: CartState, dt: number, params: TrackParameters): CartState {
  let { position, velocity } = state;
  let remaining = dt;
  // At most two pieces: up to a stop, then (maybe) away from it.
  for (let piece = 0; piece < 3 && remaining > 0; piece++) {
    const a = accelerationAt(velocity, params);
    if (velocity === 0 && a === 0) {
      break;
    }
    const newVelocity = velocity + a * remaining;
    const crossesZero = velocity !== 0 && Math.sign(newVelocity) !== Math.sign(velocity);
    if (!crossesZero) {
      position += velocity * remaining + 0.5 * a * remaining * remaining;
      velocity = newVelocity;
      remaining = 0;
    } else {
      const tStop = -velocity / a;
      position += velocity * tStop + 0.5 * a * tStop * tStop;
      velocity = 0;
      remaining -= tStop;
    }
  }
  return { position, velocity };
}
