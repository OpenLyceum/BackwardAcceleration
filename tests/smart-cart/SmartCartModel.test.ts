import { NumberProperty } from "scenerystack/axon";
import { describe, expect, it } from "vitest";
import { ACCELERATION_WINDOW, VELOCITY_WINDOW } from "../../src/BackwardAccelerationConstants.js";
import { Experiment } from "../../src/common/model/Experiment.js";
import { PredictionNotebook } from "../../src/common/model/PredictionNotebook.js";
import type { SmartCartStreamSample } from "../../src/smart-cart/model/SmartCartDevice.js";
import { SmartCartModel } from "../../src/smart-cart/model/SmartCartModel.js";
import { FakeSmartCart } from "../helpers/FakeSmartCart.js";

/** A fake cart that streams, with an emit() the test drives. */
function streamingFake() {
  const device = new FakeSmartCart();
  const control: { emit: ((sample: SmartCartStreamSample) => void) | null } = { emit: null };
  Object.assign(device, {
    startStreaming: (_period: number, onSample: (sample: SmartCartStreamSample) => void) => {
      control.emit = onSample;
      return Promise.resolve();
    },
    stopStreaming: () => Promise.resolve(),
  });
  return { device, control };
}

describe("SmartCartModel", () => {
  it("records a run of the selected experiment and trims it to release → catch", async () => {
    const { device, control } = streamingFake();
    let now = 0;
    const model = new SmartCartModel(
      new PredictionNotebook(),
      {
        velocityWindowProperty: new NumberProperty(VELOCITY_WINDOW),
        accelerationWindowProperty: new NumberProperty(ACCELERATION_WINDOW),
      },
      { createDevice: () => device, clock: () => now },
    );
    await model.cart.connect();
    expect(model.canRecordProperty.value).toBe(true);

    model.runs.experimentProperty.value = Experiment.A;
    model.record();
    // 0.5 s at rest, then a = 0.3 m/s² for 2 s, then held still (caught).
    for (let i = 0; i <= 175; i++) {
      const t = i * 0.02;
      const u = Math.min(Math.max(t - 0.5, 0), 2);
      now = t * 1000;
      control.emit?.({ timeMs: now, position: 0.5 * 0.3 * u * u, force: Number.NaN });
    }
    model.stop();
    model.step(0);

    const trace = model.runs.traceFor(Experiment.A);
    expect(trace.length).toBe(176);
    expect(trace.windowStartProperty.value).toBeGreaterThan(0.3);
    expect(trace.windowEndProperty.value).toBeLessThan(2.7);
    const series = trace.trimmedSeries;
    expect(series.times[0]).toBe(0);
    const middle = series.accelerations.slice(15, -15);
    for (const a of middle) {
      expect(a).toBeCloseTo(0.3, 1);
    }
    expect(model.trimFailedProperty.value).toBe(false);

    model.clear();
    expect(trace.isEmpty).toBe(true);
    await model.cart.disconnect();
    expect(model.canRecordProperty.value).toBe(false);
    model.dispose();
  });
});
