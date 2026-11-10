/**
 * Trace.ts
 *
 * One recorded run: timestamped positions along the cart's own +x axis, as the
 * Smart Cart's encoder (or the virtual cart) reports them, plus the analysis
 * window — release to catch — that the graphs show.
 *
 * Velocity and acceleration are derived on demand from the positions *inside the
 * window only*, so the large spike of a hand push or a catch never smears, through
 * the smoothing window, into the motion the student is asked to graph. Times on
 * the trimmed series start at 0 at the release, which is where the students'
 * predictions start too.
 */

import { Emitter, Property, type TReadOnlyProperty } from "scenerystack/axon";
import BackwardAccelerationNamespace from "../../BackwardAccelerationNamespace.js";
import type { ExperimentPreset } from "./Experiment.js";
import { differentiate } from "./kinematics.js";
import { findRunWindow } from "./motionAnalysis.js";

/** Plot-ready arrays; all the same length. */
export type MotionSeries = {
  readonly times: readonly number[];
  readonly positions: readonly number[];
  readonly velocities: readonly number[];
  readonly accelerations: readonly number[];
};

const EMPTY_SERIES: MotionSeries = { times: [], positions: [], velocities: [], accelerations: [] };

export type SmoothingWindows = {
  readonly velocityWindowProperty: TReadOnlyProperty<number>;
  readonly accelerationWindowProperty: TReadOnlyProperty<number>;
};

export class Trace {
  public readonly times: number[] = [];
  public readonly positions: number[] = [];

  /** Start and end of the analysis window, in recording time (s). End is Infinity for "to the last sample". */
  public readonly windowStartProperty = new Property<number>(0);
  public readonly windowEndProperty = new Property<number>(Number.POSITIVE_INFINITY);

  /** Fired at most once per frame (from flush) after samples, the window, or smoothing changed. */
  public readonly changedEmitter = new Emitter();

  private readonly smoothing: SmoothingWindows;
  private fullCache: MotionSeries | null = null;
  private trimmedCache: MotionSeries | null = null;
  private pendingChange = false;
  private readonly invalidate = () => {
    this.fullCache = null;
    this.trimmedCache = null;
    this.pendingChange = true;
  };

  public constructor(smoothing: SmoothingWindows) {
    this.smoothing = smoothing;
    smoothing.velocityWindowProperty.lazyLink(this.invalidate);
    smoothing.accelerationWindowProperty.lazyLink(this.invalidate);
    this.windowStartProperty.lazyLink(this.invalidate);
    this.windowEndProperty.lazyLink(this.invalidate);
  }

  public get length(): number {
    return this.times.length;
  }

  public get isEmpty(): boolean {
    return this.times.length === 0;
  }

  /** Recording time of the last sample, s (0 when empty). */
  public get duration(): number {
    return this.times.length === 0 ? 0 : (this.times[this.times.length - 1] as number);
  }

  /** True when the window has been narrowed from the whole recording. */
  public get isTrimmed(): boolean {
    return this.windowStartProperty.value > (this.times[0] ?? 0) || this.windowEndProperty.value < this.duration;
  }

  public addSample(time: number, position: number): void {
    this.times.push(time);
    this.positions.push(position);
    this.invalidate();
  }

  public clear(): void {
    this.times.length = 0;
    this.positions.length = 0;
    this.windowStartProperty.reset();
    this.windowEndProperty.reset();
    this.invalidate();
  }

  /** Emits changedEmitter if anything changed since the last flush. Call once per frame. */
  public flush(): void {
    if (this.pendingChange) {
      this.pendingChange = false;
      this.changedEmitter.emit();
    }
  }

  /** The whole recording, on recording time. */
  public get fullSeries(): MotionSeries {
    if (this.fullCache === null) {
      this.fullCache = this.derive(0, this.times.length - 1, 0);
    }
    return this.fullCache;
  }

  /** The analysis window only, with time 0 at the window's start (the release). */
  public get trimmedSeries(): MotionSeries {
    if (this.trimmedCache === null) {
      const start = this.times.findIndex((t) => t >= this.windowStartProperty.value);
      let end = this.times.length - 1;
      while (end >= 0 && (this.times[end] as number) > this.windowEndProperty.value) {
        end--;
      }
      this.trimmedCache =
        start < 0 || end <= start ? EMPTY_SERIES : this.derive(start, end, this.times[start] as number);
    }
    return this.trimmedCache;
  }

  /** Sets the window to release → catch as found in the data; leaves it alone if the cart never moved. */
  public autoTrim(preset: ExperimentPreset): boolean {
    const window = findRunWindow(this.fullSeries.times, this.fullSeries.velocities, preset);
    if (window === null) {
      return false;
    }
    this.windowStartProperty.value = this.times[window.start] as number;
    this.windowEndProperty.value = this.times[window.end] as number;
    return true;
  }

  /** Widens the window to the whole recording. */
  public untrim(): void {
    this.windowStartProperty.reset();
    this.windowEndProperty.reset();
  }

  private derive(start: number, end: number, timeOffset: number): MotionSeries {
    if (end < start) {
      return EMPTY_SERIES;
    }
    const times = this.times.slice(start, end + 1).map((t) => t - timeOffset);
    const positions = this.positions.slice(start, end + 1);
    const velocities = differentiate(times, positions, this.smoothing.velocityWindowProperty.value);
    const accelerations = differentiate(times, velocities, this.smoothing.accelerationWindowProperty.value);
    return { times, positions, velocities, accelerations };
  }

  public dispose(): void {
    this.smoothing.velocityWindowProperty.unlink(this.invalidate);
    this.smoothing.accelerationWindowProperty.unlink(this.invalidate);
    this.windowStartProperty.dispose();
    this.windowEndProperty.dispose();
    this.changedEmitter.dispose();
  }
}

BackwardAccelerationNamespace.register("Trace", Trace);
