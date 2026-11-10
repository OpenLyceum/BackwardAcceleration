/**
 * PredictionNotebook.ts
 *
 * Everything the students write down, shared by both screens so a prediction made
 * once can be compared with the virtual cart and with the real Smart Cart: one
 * sketch and one sign table per experiment, which sketch layer the pointer draws
 * on, and which layers are shown.
 */

import { BooleanProperty, Property } from "scenerystack/axon";
import BackwardAccelerationNamespace from "../../BackwardAccelerationNamespace.js";
import { EXPERIMENTS, type ExperimentValue } from "./Experiment.js";
import { PredictionSketch, type SketchLayerValue } from "./PredictionSketch.js";
import { SignTable } from "./SignTable.js";

/** What a drag on a graph does: nothing, or draw on one of the two prediction layers. */
export type DrawModeValue = SketchLayerValue | "off";

export class PredictionNotebook {
  private readonly sketches: ReadonlyMap<ExperimentValue, PredictionSketch>;
  private readonly signTables: ReadonlyMap<ExperimentValue, SignTable>;

  public readonly drawModeProperty = new Property<DrawModeValue>("off");
  public readonly showIndividualProperty = new BooleanProperty(true);
  public readonly showGroupProperty = new BooleanProperty(true);

  public constructor() {
    this.sketches = new Map(EXPERIMENTS.map((experiment) => [experiment, new PredictionSketch()]));
    this.signTables = new Map(EXPERIMENTS.map((experiment) => [experiment, new SignTable()]));
  }

  public sketchFor(experiment: ExperimentValue): PredictionSketch {
    return this.sketches.get(experiment) as PredictionSketch;
  }

  public signTableFor(experiment: ExperimentValue): SignTable {
    return this.signTables.get(experiment) as SignTable;
  }

  public reset(): void {
    for (const sketch of this.sketches.values()) {
      sketch.reset();
    }
    for (const table of this.signTables.values()) {
      table.reset();
    }
    this.drawModeProperty.reset();
    this.showIndividualProperty.reset();
    this.showGroupProperty.reset();
  }

  public dispose(): void {
    for (const sketch of this.sketches.values()) {
      sketch.dispose();
    }
    for (const table of this.signTables.values()) {
      table.dispose();
    }
    this.drawModeProperty.dispose();
    this.showIndividualProperty.dispose();
    this.showGroupProperty.dispose();
  }
}

BackwardAccelerationNamespace.register("PredictionNotebook", PredictionNotebook);
