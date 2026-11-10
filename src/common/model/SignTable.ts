/**
 * SignTable.ts
 *
 * The handout's sign table for one experiment: the student's answer — positive,
 * zero, or negative — for velocity and acceleration in each of three phases of the
 * motion (for experiment E: moving up, at the turning point, moving down). Each
 * cell starts unanswered and cycles through the three signs. It doubles as the
 * keyboard-accessible way to state a prediction.
 */

import { BooleanProperty, Property, type TProperty } from "scenerystack/axon";
import BackwardAccelerationNamespace from "../../BackwardAccelerationNamespace.js";
import { Sign, type SignValue } from "./motionAnalysis.js";

export const PHASE_COUNT = 3;

export type CellAnswer = SignValue | null;

const CYCLE: readonly CellAnswer[] = [null, Sign.POSITIVE, Sign.ZERO, Sign.NEGATIVE];

export class SignTable {
  public readonly velocityCells: readonly Property<CellAnswer>[];
  public readonly accelerationCells: readonly Property<CellAnswer>[];

  /** When true, the view marks each answered cell right or wrong against the measured run. */
  public readonly checkProperty = new BooleanProperty(false);

  public constructor() {
    this.velocityCells = Array.from({ length: PHASE_COUNT }, () => new Property<CellAnswer>(null));
    this.accelerationCells = Array.from({ length: PHASE_COUNT }, () => new Property<CellAnswer>(null));
  }

  /** Advances a cell to its next answer: unanswered → + → 0 → − → unanswered. */
  public static cycle(cell: TProperty<CellAnswer>): void {
    const index = CYCLE.indexOf(cell.value);
    cell.value = CYCLE[(index + 1) % CYCLE.length] ?? null;
  }

  public reset(): void {
    for (const cell of [...this.velocityCells, ...this.accelerationCells]) {
      cell.reset();
    }
    this.checkProperty.reset();
  }

  public dispose(): void {
    for (const cell of [...this.velocityCells, ...this.accelerationCells]) {
      cell.dispose();
    }
    this.checkProperty.dispose();
  }
}

BackwardAccelerationNamespace.register("SignTable", SignTable);
