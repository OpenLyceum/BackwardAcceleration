/**
 * graphZoom.ts
 *
 * Wires value and time zoom level properties to a bamboo ChartTransform and its
 * grid / tick spacing. LinePlot follows the transform; callers must refresh
 * sketch paths and markers on chartTransform.changedEmitter.
 */

import type { NumberProperty } from "scenerystack/axon";
import type { ChartTransform, GridLineSet, TickLabelSet, TickMarkSet } from "scenerystack/bamboo";
import { Range } from "scenerystack/dot";
import { TIME_LEVELS, type ZoomLevel } from "../model/GraphScales.js";

export type GraphZoomTargets = {
  readonly chartTransform: ChartTransform;
  readonly horizontalGrid: GridLineSet;
  readonly verticalGrid: GridLineSet;
  readonly yTicks: TickMarkSet;
  readonly yLabels: TickLabelSet;
  readonly xTicks: TickMarkSet;
  readonly xLabels: TickLabelSet;
};

/** Links zoom properties to axis ranges and tick spacing. */
export function installGraphZoom(
  targets: GraphZoomTargets,
  valueLevels: readonly ZoomLevel[],
  valueLevelProperty: NumberProperty,
  timeLevelProperty: NumberProperty,
): void {
  const { chartTransform, horizontalGrid, verticalGrid, yTicks, yLabels, xTicks, xLabels } = targets;

  valueLevelProperty.link((index) => {
    const level = valueLevels[index];
    if (level) {
      chartTransform.setModelYRange(new Range(-level.max, level.max));
      horizontalGrid.setSpacing(level.step);
      yTicks.setSpacing(level.step);
      yLabels.setSpacing(level.step);
    }
  });
  timeLevelProperty.link((index) => {
    const level = TIME_LEVELS[index];
    if (level) {
      chartTransform.setModelXRange(new Range(0, level.max));
      verticalGrid.setSpacing(level.step);
      xTicks.setSpacing(level.step);
      xLabels.setSpacing(level.step);
    }
  });
}
