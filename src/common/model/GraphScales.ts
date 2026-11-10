/**
 * GraphScales.ts
 *
 * Zoom state of one screen's graphs: a shared time axis and a value axis per
 * quantity, each an index into a list of "nice" extents with matching tick spacing.
 */

import { NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import BackwardAccelerationNamespace from "../../BackwardAccelerationNamespace.js";
import type { ExperimentPreset } from "./Experiment.js";
import { Quantity, type QuantityValue } from "./PredictionSketch.js";

/** One zoom level: axis extent `max` and tick/grid `step`, both in model units. */
export type ZoomLevel = { readonly max: number; readonly step: number };

export const TIME_LEVELS: readonly ZoomLevel[] = [
  { max: 2, step: 0.5 },
  { max: 3, step: 0.5 },
  { max: 5, step: 1 },
  { max: 8, step: 1 },
  { max: 12, step: 2 },
  { max: 20, step: 5 },
];

/** Velocity extent ±max, m/s. */
export const VELOCITY_LEVELS: readonly ZoomLevel[] = [
  { max: 0.25, step: 0.05 },
  { max: 0.5, step: 0.1 },
  { max: 1, step: 0.25 },
  { max: 1.5, step: 0.5 },
  { max: 2, step: 0.5 },
];

/** Acceleration extent ±max, m/s². */
export const ACCELERATION_LEVELS: readonly ZoomLevel[] = [
  { max: 0.25, step: 0.05 },
  { max: 0.5, step: 0.1 },
  { max: 1, step: 0.25 },
  { max: 2, step: 0.5 },
  { max: 5, step: 1 },
];

const DEFAULT_TIME_LEVEL = 2; // 5 s
const DEFAULT_VALUE_LEVEL = 2; // ±1
const BRAKE_ACCELERATION_LEVEL = 3; // ±2 m/s²

function levelProperty(levels: readonly ZoomLevel[], initial: number): NumberProperty {
  return new NumberProperty(initial, { range: new Range(0, levels.length - 1), numberType: "Integer" });
}

export class GraphScales {
  public readonly timeLevelProperty = levelProperty(TIME_LEVELS, DEFAULT_TIME_LEVEL);
  public readonly velocityLevelProperty = levelProperty(VELOCITY_LEVELS, DEFAULT_VALUE_LEVEL);
  public readonly accelerationLevelProperty = levelProperty(ACCELERATION_LEVELS, DEFAULT_VALUE_LEVEL);

  public valueLevelProperty(quantity: QuantityValue): NumberProperty {
    return quantity === Quantity.VELOCITY ? this.velocityLevelProperty : this.accelerationLevelProperty;
  }

  public static valueLevels(quantity: QuantityValue): readonly ZoomLevel[] {
    return quantity === Quantity.VELOCITY ? VELOCITY_LEVELS : ACCELERATION_LEVELS;
  }

  /** Smallest time level that fits `duration` seconds. */
  public fitTime(duration: number): void {
    const index = TIME_LEVELS.findIndex((level) => level.max >= duration);
    this.timeLevelProperty.value = index < 0 ? TIME_LEVELS.length - 1 : Math.max(index, 0);
  }

  /** Default axes for an experiment: ±2 m/s² when the brake is on, otherwise ±1 m/s²; 5 s of time. */
  public fitPreset(preset: ExperimentPreset): void {
    this.timeLevelProperty.value = DEFAULT_TIME_LEVEL;
    this.velocityLevelProperty.value = DEFAULT_VALUE_LEVEL;
    this.accelerationLevelProperty.value = preset.brake ? BRAKE_ACCELERATION_LEVEL : DEFAULT_VALUE_LEVEL;
  }

  public reset(): void {
    this.timeLevelProperty.reset();
    this.velocityLevelProperty.reset();
    this.accelerationLevelProperty.reset();
  }

  public dispose(): void {
    this.timeLevelProperty.dispose();
    this.velocityLevelProperty.dispose();
    this.accelerationLevelProperty.dispose();
  }
}

BackwardAccelerationNamespace.register("GraphScales", GraphScales);
