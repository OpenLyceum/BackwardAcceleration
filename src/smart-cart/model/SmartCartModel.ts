/**
 * SmartCartModel.ts
 *
 * The Smart Cart screen: one real PASCO Smart Cart (ME-1240) streaming its encoder
 * position over Web Bluetooth at 50 Hz. The student picks which experiment the run
 * is, presses Record, does the experiment, and presses Stop. Recording zeroes the
 * cart where it stands, like Capstone's default.
 *
 * When the run stops, the recording is trimmed automatically to "after the hand
 * lets go, before the cart is caught" (see motionAnalysis.ts), which is the part the
 * handout asks students to graph. The trim can be widened to the whole recording
 * and its ends dragged on the graph.
 */

import { BooleanProperty, DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { MAX_RUN_TIME } from "../../BackwardAccelerationConstants.js";
import BackwardAccelerationNamespace from "../../BackwardAccelerationNamespace.js";
import type { PredictionNotebook } from "../../common/model/PredictionNotebook.js";
import { RunLibrary } from "../../common/model/RunLibrary.js";
import type { SmoothingWindows } from "../../common/model/Trace.js";
import backwardAccelerationQueryParameters from "../../preferences/backwardAccelerationQueryParameters.js";
import { BluetoothSmartCart, preloadPascoBle } from "./BluetoothSmartCart.js";
import { type ChannelSample, type Clock, ConnectionState, SmartCartChannel } from "./SmartCartChannel.js";
import type { TSmartCartDevice } from "./SmartCartDevice.js";

export type SmartCartModelOptions = {
  /** Builds the device; defaults to Web Bluetooth. Tests pass a fake. */
  readonly createDevice?: () => TSmartCartDevice;
  readonly clock?: Clock;
};

export class SmartCartModel implements TModel {
  public readonly notebook: PredictionNotebook;
  public readonly runs: RunLibrary;
  public readonly cart: SmartCartChannel;

  private readonly isRecordingWritable = new BooleanProperty(false);
  public readonly isRecordingProperty: TReadOnlyProperty<boolean> = this.isRecordingWritable;
  public readonly canRecordProperty: TReadOnlyProperty<boolean>;

  /** True after a stop when release and catch could not be found (the cart never moved). */
  public readonly trimFailedProperty = new BooleanProperty(false);

  private readonly clock: Clock;
  private startTimeMs = 0;

  public constructor(notebook: PredictionNotebook, smoothing: SmoothingWindows, options?: SmartCartModelOptions) {
    this.notebook = notebook;
    this.runs = new RunLibrary(smoothing);
    this.clock = options?.clock ?? (() => performance.now());
    const createDevice = options?.createDevice ?? (() => new BluetoothSmartCart());
    if (options?.createDevice === undefined && typeof window !== "undefined" && "bluetooth" in navigator) {
      preloadPascoBle().catch(() => undefined);
    }

    this.cart = new SmartCartChannel(
      createDevice(),
      this.clock,
      undefined,
      backwardAccelerationQueryParameters.smartCartPeriod,
    );
    this.cart.sampleListener = (sample) => this.onSample(sample);

    this.canRecordProperty = new DerivedProperty(
      [this.cart.connectionStateProperty],
      (state) => state === ConnectionState.CONNECTED,
    );
    this.canRecordProperty.lazyLink((canRecord) => {
      if (!canRecord) {
        this.stop();
      }
    });

    // Switching experiment mid-recording ends the run on the experiment it began with.
    this.runs.experimentProperty.lazyLink(() => this.stop());
  }

  private onSample(sample: ChannelSample): void {
    if (!this.isRecordingWritable.value) {
      return;
    }
    const time = (sample.timeMs - this.startTimeMs) / 1000;
    if (time < 0) {
      return;
    }
    if (time > MAX_RUN_TIME) {
      this.stop();
      return;
    }
    this.runs.currentTrace.addSample(time, sample.position);
  }

  /** Starts a new run of the current experiment, replacing its last one. */
  public record(): void {
    if (!this.canRecordProperty.value || this.isRecordingWritable.value) {
      return;
    }
    this.runs.currentTrace.clear();
    this.trimFailedProperty.value = false;
    this.cart.zero();
    this.startTimeMs = this.clock();
    this.isRecordingWritable.value = true;
  }

  /** Ends the run and trims it to release → catch. */
  public stop(): void {
    if (!this.isRecordingWritable.value) {
      return;
    }
    this.isRecordingWritable.value = false;
    const trace = this.runs.currentTrace;
    this.trimFailedProperty.value = !trace.autoTrim(this.runs.currentPreset);
    this.runs.scales.fitTime(
      this.runs.showFullRecordingProperty.value ? trace.duration : (trace.trimmedSeries.times.at(-1) ?? 0),
    );
  }

  /** Re-runs the automatic trim on the current experiment's recording. */
  public autoTrim(): void {
    this.trimFailedProperty.value = !this.runs.currentTrace.autoTrim(this.runs.currentPreset);
  }

  /** Erases the current experiment's run. */
  public clear(): void {
    this.isRecordingWritable.value = false;
    this.trimFailedProperty.value = false;
    this.runs.currentTrace.clear();
  }

  public step(_dt: number): void {
    this.runs.flush();
  }

  public reset(): void {
    this.isRecordingWritable.value = false;
    this.trimFailedProperty.reset();
    this.runs.reset();
    this.cart.reset();
  }

  public dispose(): void {
    this.cart.dispose();
    this.runs.dispose();
  }
}

BackwardAccelerationNamespace.register("SmartCartModel", SmartCartModel);
