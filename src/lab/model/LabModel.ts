/**
 * LabModel.ts
 *
 * The Lab screen: a virtual Smart Cart on a 1.2 m track that can be tilted with
 * track feet (0–10 cm), slowed by a tape brake, and either released from rest or
 * given a brief push. While it runs, the cart reports its position along its own
 * +x arrow at 50 Hz, quantised to whole encoder counts, exactly as the real cart
 * does — so the graphs are built the same way on both screens.
 *
 * ── Lifecycle of a run ────────────────────────────────────────────────────────
 *   READY     cart at its start position; the student may drag it
 *   RUNNING   released (or let go after the push) at t = 0; the clock advances
 *             while playing
 *   FINISHED  the cart came to rest, reached the bumper (low end), was caught at
 *             the raised end, or ran for MAX_RUN_TIME
 * The push itself is not simulated: the run starts the instant the hand lets go,
 * which is where the handout tells students to start graphing.
 */

import { BooleanProperty, DerivedProperty, NumberProperty, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import {
  BRAKE_FRICTION,
  CART_LENGTH,
  ENCODER_RESOLUTION,
  MAX_INCLINE_HEIGHT,
  MAX_PUSH_SPEED,
  MAX_RUN_TIME,
  MIN_INCLINE_HEIGHT,
  MIN_PUSH_SPEED,
  PHYSICS_SUBSTEP,
  ROLLING_FRICTION,
  SAMPLE_PERIOD_MS,
  TRACK_LENGTH,
} from "../../BackwardAccelerationConstants.js";
import BackwardAccelerationNamespace from "../../BackwardAccelerationNamespace.js";
import { accelerationAt, advanceCart, type TrackParameters } from "../../common/model/cartPhysics.js";
import { EXPERIMENT_PRESETS, LaunchMode, type LaunchModeValue } from "../../common/model/Experiment.js";
import { quantize } from "../../common/model/kinematics.js";
import type { PredictionNotebook } from "../../common/model/PredictionNotebook.js";
import { RunLibrary } from "../../common/model/RunLibrary.js";
import type { SmoothingWindows } from "../../common/model/Trace.js";

export const RunState = {
  READY: "ready",
  RUNNING: "running",
  FINISHED: "finished",
} as const;

export type RunStateValue = (typeof RunState)[keyof typeof RunState];

/** Why a run finished, for the status line and the screen summary. */
export const RunEnd = {
  NONE: "none",
  /** Came to rest on its own. */
  REST: "rest",
  /** Caught by the student (the Catch button, or the set-up changed mid-run). */
  STOPPED: "stopped",
  BUMPER: "bumper",
  CAUGHT: "caught",
  TIME: "time",
} as const;

export type RunEndValue = (typeof RunEnd)[keyof typeof RunEnd];

/** Lowest and highest positions of the cart's centre, m: half a cart from each end (a bumper block at the low end). */
export const MIN_CART_POSITION = CART_LENGTH / 2;
export const MAX_CART_POSITION = TRACK_LENGTH - CART_LENGTH / 2 - 0.02;

/** A cart at rest this long after being let go has stopped for good. */
const REST_TIME_TO_FINISH = 0.4;

/** Clock speed in slow motion. */
export const SLOW_MOTION_FACTOR = 0.25;

/** Longest frame dt honoured, s (a backgrounded tab must not teleport the cart). */
const MAX_FRAME_DT = 0.1;

export class LabModel implements TModel {
  public readonly notebook: PredictionNotebook;
  public readonly runs: RunLibrary;

  // ── Set-up (loaded from the experiment preset, then adjustable) ──────────────
  public readonly inclineHeightProperty = new NumberProperty(EXPERIMENT_PRESETS.A.inclineHeight, {
    range: new Range(MIN_INCLINE_HEIGHT, MAX_INCLINE_HEIGHT),
    units: "m",
  });
  public readonly brakeProperty = new BooleanProperty(EXPERIMENT_PRESETS.A.brake);
  /** True when the cart's +x arrow points down the track (to the right). */
  public readonly arrowDownTrackProperty = new BooleanProperty(EXPERIMENT_PRESETS.A.arrowDownTrack);
  public readonly launchModeProperty = new Property<LaunchModeValue>(EXPERIMENT_PRESETS.A.launchMode);
  public readonly pushTowardPlusXProperty = new BooleanProperty(EXPERIMENT_PRESETS.A.pushTowardPlusX);
  public readonly pushSpeedProperty = new NumberProperty(EXPERIMENT_PRESETS.A.pushSpeed, {
    range: new Range(MIN_PUSH_SPEED, MAX_PUSH_SPEED),
    units: "m/s",
  });

  // ── The cart ─────────────────────────────────────────────────────────────────
  /** Where the next run starts (the cart's centre along the track from the left end), m. */
  public readonly startPositionProperty = new NumberProperty(EXPERIMENT_PRESETS.A.startPosition, {
    range: new Range(MIN_CART_POSITION, MAX_CART_POSITION),
    units: "m",
  });
  /** Cart centre along the track, m. */
  public readonly trackPositionProperty = new NumberProperty(EXPERIMENT_PRESETS.A.startPosition, { units: "m" });
  /** Velocity along the track (positive = toward the low end), m/s. */
  public readonly trackVelocityProperty = new NumberProperty(0, { units: "m/s" });

  /** The same, read along the cart's +x arrow — what the Smart Cart would report. */
  public readonly velocityXProperty: TReadOnlyProperty<number>;
  public readonly accelerationXProperty: TReadOnlyProperty<number>;
  /** Position along +x since the release, m. */
  public readonly positionXProperty: TReadOnlyProperty<number>;

  // ── The run ──────────────────────────────────────────────────────────────────
  public readonly runStateProperty = new Property<RunStateValue>(RunState.READY);
  public readonly runEndProperty = new Property<RunEndValue>(RunEnd.NONE);
  public readonly isPlayingProperty = new BooleanProperty(true);
  public readonly slowMotionProperty = new BooleanProperty(false);
  /** Time since release, s. */
  public readonly runTimeProperty = new NumberProperty(0, { units: "s" });

  public readonly showVelocityVectorProperty = new BooleanProperty(true);
  public readonly showAccelerationVectorProperty = new BooleanProperty(true);

  private releasePosition = 0;
  private nextSampleTime = 0;
  private restTime = 0;

  public constructor(notebook: PredictionNotebook, smoothing: SmoothingWindows) {
    this.notebook = notebook;
    this.runs = new RunLibrary(smoothing);

    const arrowSign = () => (this.arrowDownTrackProperty.value ? 1 : -1);
    this.velocityXProperty = new DerivedProperty(
      [this.trackVelocityProperty, this.arrowDownTrackProperty],
      (velocity, down) => (down ? velocity : -velocity),
    );
    this.accelerationXProperty = new DerivedProperty(
      [
        this.trackVelocityProperty,
        this.runStateProperty,
        this.inclineHeightProperty,
        this.brakeProperty,
        this.arrowDownTrackProperty,
      ],
      (velocity, state, _height, _brake, down) => {
        if (state !== RunState.RUNNING) {
          return 0;
        }
        const a = accelerationAt(velocity, this.trackParameters);
        return down ? a : -a;
      },
    );
    this.positionXProperty = new DerivedProperty([this.trackPositionProperty, this.runStateProperty], (s, state) =>
      state === RunState.READY ? 0 : arrowSign() * (s - this.releasePosition),
    );

    // Picking an experiment loads its set-up.
    this.runs.experimentProperty.link(() => this.applyPreset());

    // While READY the cart sits at the start position; dragging it moves the start.
    this.startPositionProperty.link((position) => {
      if (this.runStateProperty.value === RunState.READY) {
        this.trackPositionProperty.value = position;
      }
    });

    // Changing the set-up mid-run abandons the run (the cart stays where it is).
    const abandon = () => {
      if (this.runStateProperty.value === RunState.RUNNING) {
        this.finish(RunEnd.STOPPED);
      }
    };
    this.inclineHeightProperty.lazyLink(abandon);
    this.brakeProperty.lazyLink(abandon);
    this.arrowDownTrackProperty.lazyLink(abandon);
  }

  public get trackParameters(): TrackParameters {
    return {
      inclineHeight: this.inclineHeightProperty.value,
      trackLength: TRACK_LENGTH,
      friction: ROLLING_FRICTION + (this.brakeProperty.value ? BRAKE_FRICTION : 0),
    };
  }

  /** Loads the current experiment's track set-up and returns the cart to its start. */
  public applyPreset(): void {
    const preset = this.runs.currentPreset;
    this.returnCart();
    this.inclineHeightProperty.value = preset.inclineHeight;
    this.brakeProperty.value = preset.brake;
    this.arrowDownTrackProperty.value = preset.arrowDownTrack;
    this.launchModeProperty.value = preset.launchMode;
    this.pushTowardPlusXProperty.value = preset.pushTowardPlusX;
    this.pushSpeedProperty.value = preset.pushSpeed;
    this.startPositionProperty.value = preset.startPosition;
    this.trackPositionProperty.value = preset.startPosition;
  }

  /** Lets the cart go: from rest, or at the push speed in the push direction. Replaces this experiment's last run. */
  public go(): void {
    if (this.runStateProperty.value === RunState.RUNNING) {
      return;
    }
    this.returnCart();
    let velocity = 0;
    if (this.launchModeProperty.value === LaunchMode.PUSH) {
      const towardPlusX = this.pushTowardPlusXProperty.value ? 1 : -1;
      const arrow = this.arrowDownTrackProperty.value ? 1 : -1;
      velocity = towardPlusX * arrow * this.pushSpeedProperty.value;
    }
    this.releasePosition = this.trackPositionProperty.value;
    this.trackVelocityProperty.value = velocity;
    this.runTimeProperty.value = 0;
    this.nextSampleTime = 0;
    this.restTime = 0;
    this.runs.currentTrace.clear();
    this.runEndProperty.value = RunEnd.NONE;
    this.runStateProperty.value = RunState.RUNNING;
    this.isPlayingProperty.value = true;
    this.recordSamplesUpTo(0);
  }

  /** Puts the cart back at its start position, discarding nothing already recorded. */
  public returnCart(): void {
    this.runStateProperty.value = RunState.READY;
    this.runEndProperty.value = RunEnd.NONE;
    this.trackVelocityProperty.value = 0;
    this.trackPositionProperty.value = this.startPositionProperty.value;
    this.runTimeProperty.value = 0;
  }

  /** Stops the run where the cart is (the "catch" button). */
  public stop(): void {
    if (this.runStateProperty.value === RunState.RUNNING) {
      this.finish(RunEnd.STOPPED);
    }
  }

  private finish(reason: RunEndValue): void {
    this.trackVelocityProperty.value = 0;
    this.runEndProperty.value = reason;
    this.runStateProperty.value = RunState.FINISHED;
  }

  /** Records every 20 ms sample up to run time `time`, interpolating the cart's position within the frame. */
  private recordSamplesUpTo(time: number): void {
    const trace = this.runs.currentTrace;
    const sign = this.arrowDownTrackProperty.value ? 1 : -1;
    const period = SAMPLE_PERIOD_MS / 1000;
    while (this.nextSampleTime <= time + 1e-9) {
      const x = sign * (this.trackPositionProperty.value - this.releasePosition);
      trace.addSample(this.nextSampleTime, quantize(x, ENCODER_RESOLUTION));
      this.nextSampleTime += period;
    }
  }

  /** Advances a running cart by dt seconds of run time. */
  public advance(dt: number): void {
    if (this.runStateProperty.value !== RunState.RUNNING) {
      return;
    }
    const params = this.trackParameters;
    const period = SAMPLE_PERIOD_MS / 1000;
    let remaining = dt;
    while (remaining > 1e-12 && this.runStateProperty.value === RunState.RUNNING) {
      // Never step past the next sample instant, so samples land on the right positions.
      const toSample = this.nextSampleTime - this.runTimeProperty.value;
      const h = Math.min(remaining, PHYSICS_SUBSTEP, toSample > 1e-9 ? toSample : period);
      const next = advanceCart(
        { position: this.trackPositionProperty.value, velocity: this.trackVelocityProperty.value },
        h,
        params,
      );
      remaining -= h;
      this.runTimeProperty.value += h;

      if (next.position >= MAX_CART_POSITION || next.position <= MIN_CART_POSITION) {
        this.trackPositionProperty.value = Math.min(MAX_CART_POSITION, Math.max(MIN_CART_POSITION, next.position));
        this.recordSamplesUpTo(this.runTimeProperty.value);
        this.finish(next.position >= MAX_CART_POSITION ? RunEnd.BUMPER : RunEnd.CAUGHT);
        return;
      }
      this.trackPositionProperty.value = next.position;
      this.trackVelocityProperty.value = next.velocity;
      this.recordSamplesUpTo(this.runTimeProperty.value);

      this.restTime = next.velocity === 0 ? this.restTime + h : 0;
      if (this.restTime >= REST_TIME_TO_FINISH) {
        this.finish(RunEnd.REST);
        return;
      }
      if (this.runTimeProperty.value >= MAX_RUN_TIME) {
        this.finish(RunEnd.TIME);
        return;
      }
    }
  }

  /** One sample period forward (the time control's step button). */
  public stepOnce(): void {
    this.advance(SAMPLE_PERIOD_MS / 1000);
    this.runs.flush();
  }

  public step(dt: number): void {
    if (this.isPlayingProperty.value) {
      const speed = this.slowMotionProperty.value ? SLOW_MOTION_FACTOR : 1;
      this.advance(Math.min(dt, MAX_FRAME_DT) * speed);
    }
    this.runs.flush();
  }

  public reset(): void {
    this.runs.reset();
    this.isPlayingProperty.reset();
    this.slowMotionProperty.reset();
    this.showVelocityVectorProperty.reset();
    this.showAccelerationVectorProperty.reset();
    this.applyPreset();
  }
}

BackwardAccelerationNamespace.register("LabModel", LabModel);
