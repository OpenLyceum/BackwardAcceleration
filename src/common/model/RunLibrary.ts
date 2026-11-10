/**
 * RunLibrary.ts
 *
 * What a screen keeps between runs: the selected experiment, the last run of each
 * experiment (so B can be laid over A), whether graphs show the trimmed run or the
 * whole recording, and the graph zoom. Both screen models compose one.
 */

import { BooleanProperty, Emitter, Property } from "scenerystack/axon";
import BackwardAccelerationNamespace from "../../BackwardAccelerationNamespace.js";
import { EXPERIMENT_PRESETS, EXPERIMENTS, Experiment, type ExperimentValue } from "./Experiment.js";
import { GraphScales } from "./GraphScales.js";
import { type MotionSeries, type SmoothingWindows, Trace } from "./Trace.js";

export class RunLibrary {
  public readonly experimentProperty = new Property<ExperimentValue>(Experiment.A);
  public readonly scales = new GraphScales();

  /** Draw the other experiments' runs, faintly, behind the current one. */
  public readonly showOtherRunsProperty = new BooleanProperty(false);

  /** Show the whole recording instead of release → catch (Smart Cart screen). */
  public readonly showFullRecordingProperty = new BooleanProperty(false);

  /** Fired at most once per frame after any run's data changed. */
  public readonly dataChangedEmitter = new Emitter();

  private readonly traces: ReadonlyMap<ExperimentValue, Trace>;
  private readonly forward = () => this.dataChangedEmitter.emit();

  public constructor(smoothing: SmoothingWindows) {
    this.traces = new Map(EXPERIMENTS.map((experiment) => [experiment, new Trace(smoothing)]));
    for (const trace of this.traces.values()) {
      trace.changedEmitter.addListener(this.forward);
    }
    this.showFullRecordingProperty.lazyLink(this.forward);

    // A braked cart decelerates at about 1 m/s², which would sit on the edge of the default ±1 m/s² axis.
    this.experimentProperty.link((experiment) => this.scales.fitPreset(EXPERIMENT_PRESETS[experiment]));
  }

  public traceFor(experiment: ExperimentValue): Trace {
    return this.traces.get(experiment) as Trace;
  }

  public get currentTrace(): Trace {
    return this.traceFor(this.experimentProperty.value);
  }

  public get currentPreset() {
    return EXPERIMENT_PRESETS[this.experimentProperty.value];
  }

  /** The series a graph shows for this experiment: trimmed, unless the full recording is asked for. */
  public seriesFor(experiment: ExperimentValue): MotionSeries {
    const trace = this.traceFor(experiment);
    return this.showFullRecordingProperty.value ? trace.fullSeries : trace.trimmedSeries;
  }

  /** Call once per frame. */
  public flush(): void {
    for (const trace of this.traces.values()) {
      trace.flush();
    }
  }

  public clearAll(): void {
    for (const trace of this.traces.values()) {
      trace.clear();
    }
  }

  public reset(): void {
    this.clearAll();
    this.experimentProperty.reset();
    this.scales.reset();
    this.showOtherRunsProperty.reset();
    this.showFullRecordingProperty.reset();
    this.flush();
  }

  public dispose(): void {
    for (const trace of this.traces.values()) {
      trace.changedEmitter.removeListener(this.forward);
      trace.dispose();
    }
    this.experimentProperty.dispose();
    this.scales.dispose();
    this.showOtherRunsProperty.dispose();
    this.showFullRecordingProperty.dispose();
    this.dataChangedEmitter.dispose();
  }
}

BackwardAccelerationNamespace.register("RunLibrary", RunLibrary);
