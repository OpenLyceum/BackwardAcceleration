/**
 * sketchDrawing.ts
 *
 * Freehand prediction strokes on a kinematics graph: converting notebook
 * strokes to a kite Shape, and the DragListener that records new strokes.
 */

import type { ChartTransform } from "scenerystack/bamboo";
import { clamp, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { DragListener, type Node } from "scenerystack/scenery";
import { KINEMATICS_GRAPH_NODE_SETTINGS } from "../../BackwardAccelerationConstants.js";
import type { PredictionNotebook } from "../model/PredictionNotebook.js";
import { type QuantityValue, SketchLayer, type Stroke } from "../model/PredictionSketch.js";
import type { RunLibrary } from "../model/RunLibrary.js";

/** Builds a view-space Shape from model-space strokes, or null when empty. */
export function strokesShape(chartTransform: ChartTransform, strokes: readonly Stroke[]): Shape | null {
  if (strokes.length === 0) {
    return null;
  }
  const shape = new Shape();
  for (const stroke of strokes) {
    stroke.forEach((point, i) => {
      const view = chartTransform.modelToViewPosition(point);
      if (i === 0) {
        shape.moveToPoint(view);
        // A single click leaves a dot.
        if (stroke.length === 1) {
          shape.lineToPoint(view.plusXY(KINEMATICS_GRAPH_NODE_SETTINGS.PLUS_XY_X_OFFSET, 0));
        }
      } else {
        shape.lineToPoint(view);
      }
    });
  }
  return shape;
}

/**
 * Pointer drawing on the plot rectangle. Hidden layers are shown when the
 * student starts a stroke so the ink is visible.
 */
export function installSketchDrawing(
  chartRectangle: Node,
  chartTransform: ChartTransform,
  viewWidth: number,
  viewHeight: number,
  runs: RunLibrary,
  notebook: PredictionNotebook,
  quantity: QuantityValue,
): void {
  const modelPointAt = (globalPoint: Vector2): Vector2 => {
    const local = chartRectangle.globalToLocalPoint(globalPoint);
    return chartTransform.viewToModelPosition(new Vector2(clamp(local.x, 0, viewWidth), clamp(local.y, 0, viewHeight)));
  };
  chartRectangle.addInputListener(
    new DragListener({
      start: (event) => {
        const mode = notebook.drawModeProperty.value;
        if (mode === "off") {
          return;
        }
        // Drawing on a hidden layer would be invisible; show it.
        (mode === SketchLayer.INDIVIDUAL ? notebook.showIndividualProperty : notebook.showGroupProperty).value = true;
        notebook
          .sketchFor(runs.experimentProperty.value)
          .beginStroke(quantity, mode, modelPointAt(event.pointer.point));
      },
      drag: (event) => {
        if (notebook.drawModeProperty.value !== "off") {
          notebook.sketchFor(runs.experimentProperty.value).extendStroke(modelPointAt(event.pointer.point));
        }
      },
      end: () => notebook.sketchFor(runs.experimentProperty.value).endStroke(),
    }),
  );
  notebook.drawModeProperty.link((mode) => {
    chartRectangle.cursor = mode === "off" ? null : "crosshair";
  });
}
