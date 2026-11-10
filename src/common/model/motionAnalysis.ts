/**
 * motionAnalysis.ts
 *
 * Finds the part of a recording the handout asks students to graph — after the
 * hand lets go and before the cart is caught or hits the bumper — and reads the
 * signs of velocity and acceleration off it for the sign table.
 *
 * ── Release ───────────────────────────────────────────────────────────────────
 * Release from rest (A, B): the moment just before the speed first rises above
 *   MOTION_THRESHOLD.
 * Push (C, D, E): the hand speeds the cart up, and once it lets go friction and
 *   gravity only slow it down, so release is the first peak in speed.
 *
 * ── Catch ─────────────────────────────────────────────────────────────────────
 * The run ends at whichever comes first: the cart comes to rest, or its speed
 * drops abruptly from a peak (a hand or the bumper). For a run that turns around
 * (E) the speed falls to zero at the turning point, so the search for an abrupt
 * drop starts only once the velocity has changed sign.
 */

import {
  MOTION_THRESHOLD,
  ZERO_ACCELERATION_TOLERANCE,
  ZERO_VELOCITY_TOLERANCE,
} from "../../BackwardAccelerationConstants.js";
import { type ExperimentPreset, LaunchMode } from "./Experiment.js";
import { median } from "./kinematics.js";

/** A speed this far below its running peak (m/s) marks the end of a push: the hand has let go. */
const PEAK_DROP = 0.02;

/**
 * Slowing faster than this (m/s²) is a hand or the bumper, not the track: the
 * tape brake gives about 1 m/s² and gravity on the steepest incline under 1 m/s².
 */
const ABRUPT_DECELERATION = 4;

export type RunWindow = {
  /** Index of the first sample to keep. */
  readonly start: number;
  /** Index of the last sample to keep (inclusive). */
  readonly end: number;
};

const speedAt = (velocities: readonly number[], i: number) => Math.abs(velocities[i] as number);

/** Index of the first speed peak at or after `from`: where speed has fallen PEAK_DROP below its running maximum. */
function firstSpeedPeak(velocities: readonly number[], from: number, until: number): number {
  let peak = from;
  for (let i = from; i <= until; i++) {
    const speed = speedAt(velocities, i);
    if (speed > speedAt(velocities, peak)) {
      peak = i;
    } else if (speed < speedAt(velocities, peak) - PEAK_DROP) {
      return peak;
    }
  }
  return peak;
}

/** Rate at which speed falls between samples i−1 and i, m/s² (negative when speeding up). */
function slowingRate(times: readonly number[], velocities: readonly number[], i: number): number {
  const dt = (times[i] as number) - (times[i - 1] as number);
  return dt > 0 ? (speedAt(velocities, i - 1) - speedAt(velocities, i)) / dt : 0;
}

/** End of the run from `from`: the cart comes to rest, or something stops it abruptly. */
function runEnd(times: readonly number[], velocities: readonly number[], from: number, last: number): number {
  for (let i = from + 1; i <= last; i++) {
    if (speedAt(velocities, i) < MOTION_THRESHOLD) {
      return i;
    }
    if (slowingRate(times, velocities, i) > ABRUPT_DECELERATION) {
      // Back up to where the abrupt slowing began.
      let j = i - 1;
      while (j > from && slowingRate(times, velocities, j) > ABRUPT_DECELERATION / 4) {
        j--;
      }
      return j;
    }
  }
  return last;
}

/**
 * The release-to-catch window of a recording, or null when the cart never moved.
 * `velocities` must be sampled at the instants in `times`.
 */
export function findRunWindow(
  times: readonly number[],
  velocities: readonly number[],
  preset: ExperimentPreset,
): RunWindow | null {
  const last = Math.min(times.length, velocities.length) - 1;
  const onset = velocities.findIndex((v) => Math.abs(v) > MOTION_THRESHOLD);
  if (onset < 0 || onset >= last) {
    return null;
  }

  let start: number;
  if (preset.launchMode === LaunchMode.RELEASE) {
    start = onset;
    while (start > 0 && speedAt(velocities, start - 1) > MOTION_THRESHOLD / 3) {
      start--;
    }
  } else {
    start = firstSpeedPeak(velocities, onset, last);
  }

  // From rest, `start` sits just before the motion; look for the catch only once it is moving.
  let searchFrom = Math.max(start, onset);
  if (preset.reverses) {
    // Coast through the turning point before looking for the catch.
    const startSign = Math.sign(velocities[searchFrom] as number);
    const reversal = velocities.findIndex(
      (v, i) => i > searchFrom && Math.sign(v) === -startSign && Math.abs(v) > MOTION_THRESHOLD,
    );
    if (reversal < 0) {
      // Never turned around: stop where it came to rest.
      const rest = velocities.findIndex((v, i) => i > searchFrom && Math.abs(v) < MOTION_THRESHOLD);
      const end = rest < 0 ? last : rest;
      return end > start ? { start, end } : null;
    }
    searchFrom = reversal;
  }
  const end = runEnd(times, velocities, searchFrom, last);
  return end > start ? { start, end } : null;
}

// ── Sign table ───────────────────────────────────────────────────────────────

export const Sign = {
  POSITIVE: "positive",
  ZERO: "zero",
  NEGATIVE: "negative",
} as const;

export type SignValue = (typeof Sign)[keyof typeof Sign];

export function signOf(value: number, tolerance: number): SignValue {
  return value > tolerance ? Sign.POSITIVE : value < -tolerance ? Sign.NEGATIVE : Sign.ZERO;
}

/** Measured signs of velocity and acceleration in each of the three phases of a run. */
export type PhaseSigns = {
  readonly velocity: readonly [SignValue, SignValue, SignValue];
  readonly acceleration: readonly [SignValue, SignValue, SignValue];
};

/**
 * Signs in three phases of an already-trimmed run. For a run that turns around,
 * the phases are before, at, and after the turning point (where v changes sign);
 * otherwise the run is split into thirds (start, middle, end). Each phase's
 * value is the median over its samples, so a stray spike does not flip a sign.
 * Returns null when there are too few samples to tell.
 */
export function phaseSigns(
  velocities: readonly number[],
  accelerations: readonly number[],
  reverses: boolean,
): PhaseSigns | null {
  const n = Math.min(velocities.length, accelerations.length);
  if (n < 9) {
    return null;
  }
  let ranges: [number, number][];
  if (reverses) {
    const firstSign = Math.sign(median(velocities.slice(0, 3)));
    const turn = velocities.findIndex((v) => Math.sign(v) !== firstSign);
    if (turn <= 2 || turn >= n - 3) {
      return null;
    }
    const margin = Math.max(1, Math.floor(n / 20));
    ranges = [
      [0, Math.max(1, turn - margin)],
      [turn - 1, turn + 1],
      [Math.min(n - 1, turn + margin), n],
    ];
  } else {
    const third = Math.floor(n / 3);
    ranges = [
      [0, third],
      [third, 2 * third],
      [2 * third, n],
    ];
  }
  const sign = (values: readonly number[], tolerance: number, [from, to]: [number, number]) =>
    signOf(median(values.slice(from, to)), tolerance);
  const [r0, r1, r2] = ranges as [[number, number], [number, number], [number, number]];
  return {
    velocity: [
      sign(velocities, ZERO_VELOCITY_TOLERANCE, r0),
      reverses ? Sign.ZERO : sign(velocities, ZERO_VELOCITY_TOLERANCE, r1),
      sign(velocities, ZERO_VELOCITY_TOLERANCE, r2),
    ],
    acceleration: [
      sign(accelerations, ZERO_ACCELERATION_TOLERANCE, r0),
      sign(accelerations, ZERO_ACCELERATION_TOLERANCE, r1),
      sign(accelerations, ZERO_ACCELERATION_TOLERANCE, r2),
    ],
  };
}
