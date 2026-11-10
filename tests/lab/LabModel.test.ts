import { NumberProperty } from "scenerystack/axon";
import { describe, expect, it } from "vitest";
import {
  ACCELERATION_WINDOW,
  GRAVITY,
  TRACK_LENGTH,
  VELOCITY_WINDOW,
} from "../../src/BackwardAccelerationConstants.js";
import { Experiment, type ExperimentValue } from "../../src/common/model/Experiment.js";
import { phaseSigns, Sign } from "../../src/common/model/motionAnalysis.js";
import { PredictionNotebook } from "../../src/common/model/PredictionNotebook.js";
import { LabModel, RunEnd, RunState } from "../../src/lab/model/LabModel.js";

function createModel() {
  return new LabModel(new PredictionNotebook(), {
    velocityWindowProperty: new NumberProperty(VELOCITY_WINDOW),
    accelerationWindowProperty: new NumberProperty(ACCELERATION_WINDOW),
  });
}

/** Runs one experiment to the end in 1/60 s frames. */
function run(model: LabModel, experiment: ExperimentValue) {
  model.runs.experimentProperty.value = experiment;
  model.go();
  for (let i = 0; i < 60 * 25 && model.runStateProperty.value === RunState.RUNNING; i++) {
    model.step(1 / 60);
  }
  return model.runs.traceFor(experiment).trimmedSeries;
}

const middle = (values: readonly number[]) =>
  values.slice(Math.floor(values.length * 0.2), Math.floor(values.length * 0.8));

describe("LabModel", () => {
  it("A: released from rest, v rises steadily and a is constant ≈ g·h/L", () => {
    const model = createModel();
    const series = run(model, Experiment.A);
    expect(model.runEndProperty.value).toBe(RunEnd.BUMPER);
    expect(series.times.length).toBeGreaterThan(50);
    const expected = (GRAVITY * 0.04) / TRACK_LENGTH - 0.004 * GRAVITY;
    for (const a of middle(series.accelerations)) {
      expect(a).toBeCloseTo(expected, 1);
    }
  });

  it("B accelerates about twice as hard as A", () => {
    const model = createModel();
    const a = middle(run(model, Experiment.A).accelerations);
    const b = middle(run(model, Experiment.B).accelerations);
    const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;
    expect(mean(b) / mean(a)).toBeGreaterThan(1.8);
    expect(mean(b) / mean(a)).toBeLessThan(2.4);
  });

  it("C and D: the braked cart's acceleration opposes its velocity", () => {
    const model = createModel();
    const c = run(model, Experiment.C);
    expect(model.runEndProperty.value).toBe(RunEnd.REST);
    expect(phaseSigns(c.velocities, c.accelerations, false)?.acceleration[1]).toBe(Sign.NEGATIVE);
    expect(c.velocities[2]).toBeGreaterThan(0);
    const d = run(model, Experiment.D);
    expect(d.velocities[2]).toBeLessThan(0);
    expect(phaseSigns(d.velocities, d.accelerations, false)?.acceleration[1]).toBe(Sign.POSITIVE);
  });

  it("E: a is negative throughout, even while the cart speeds up on the way down", () => {
    const model = createModel();
    const series = run(model, Experiment.E);
    expect(model.runEndProperty.value).toBe(RunEnd.BUMPER);
    expect(phaseSigns(series.velocities, series.accelerations, true)).toEqual({
      velocity: [Sign.POSITIVE, Sign.ZERO, Sign.NEGATIVE],
      acceleration: [Sign.NEGATIVE, Sign.NEGATIVE, Sign.NEGATIVE],
    });
  });

  it("keeps the last run of each experiment and resets cleanly", () => {
    const model = createModel();
    run(model, Experiment.A);
    run(model, Experiment.B);
    expect(model.runs.traceFor(Experiment.A).isEmpty).toBe(false);
    expect(model.runs.traceFor(Experiment.B).isEmpty).toBe(false);
    model.reset();
    expect(model.runs.traceFor(Experiment.A).isEmpty).toBe(true);
    expect(model.runStateProperty.value).toBe(RunState.READY);
    expect(model.inclineHeightProperty.value).toBe(0.04);
  });
});
