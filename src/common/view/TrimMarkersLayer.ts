/**
 * TrimMarkersLayer.ts
 *
 * Release / catch markers and the grey bands outside the trim window on the
 * full Smart Cart recording. Pointer and keyboard drag set the window; the
 * owning graph calls refresh when the transform or window changes.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import type { ChartTransform } from "scenerystack/bamboo";
import { clamp, Matrix3 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Line, Node, Path, Rectangle, RichDragListener } from "scenerystack/scenery";
import BackwardAccelerationColors from "../../BackwardAccelerationColors.js";
import { KINEMATICS_GRAPH_NODE_SETTINGS, MAX_RUN_TIME } from "../../BackwardAccelerationConstants.js";
import type { RunLibrary } from "../model/RunLibrary.js";
import type { Trace } from "../model/Trace.js";

/** Keyboard step of a trim marker, in view px (the time per px depends on zoom). */
const MARKER_DRAG_DELTA: number = KINEMATICS_GRAPH_NODE_SETTINGS.MARKER_DRAG_DELTA;

export type TrimMarkersOptions = {
  readonly releaseName: TReadOnlyProperty<string>;
  readonly catchName: TReadOnlyProperty<string>;
  readonly helpText: TReadOnlyProperty<string>;
};

export class TrimMarkersLayer extends Node {
  public readonly releaseMarker: Node;
  public readonly catchMarker: Node;
  public readonly shadeBefore: Rectangle;
  public readonly shadeAfter: Rectangle;

  private readonly chartTransform: ChartTransform;
  private readonly viewWidth: number;
  private readonly viewHeight: number;

  public constructor(
    runs: RunLibrary,
    chartTransform: ChartTransform,
    chartLocal: Node,
    viewWidth: number,
    viewHeight: number,
    options: TrimMarkersOptions,
  ) {
    super();
    this.chartTransform = chartTransform;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;

    this.shadeBefore = new Rectangle(0, 0, 0, viewHeight, {
      fill: BackwardAccelerationColors.trimShadeColorProperty,
      pickable: false,
    });
    this.shadeAfter = new Rectangle(0, 0, 0, viewHeight, {
      fill: BackwardAccelerationColors.trimShadeColorProperty,
      pickable: false,
    });

    const createMarker = (accessibleName: TReadOnlyProperty<string>) =>
      new Node({
        cursor: "ew-resize",
        tagName: "div",
        focusable: true,
        accessibleName,
        accessibleHelpText: options.helpText,
        children: [
          new Rectangle(
            KINEMATICS_GRAPH_NODE_SETTINGS.CREATE_MARKER_X,
            0,
            KINEMATICS_GRAPH_NODE_SETTINGS.CREATE_MARKER_WIDTH,
            viewHeight,
            { fill: "transparent" },
          ),
          new Line(0, 0, 0, viewHeight, {
            stroke: BackwardAccelerationColors.trimHandleColorProperty,
            lineWidth: KINEMATICS_GRAPH_NODE_SETTINGS.CREATE_MARKER_LINE_WIDTH,
          }),
          new Path(
            Shape.regularPolygon(3, KINEMATICS_GRAPH_NODE_SETTINGS.CREATE_MARKER_RADIUS).transformed(
              Matrix3.rotation2(Math.PI / 2),
            ),
            {
              fill: BackwardAccelerationColors.trimHandleColorProperty,
              y: KINEMATICS_GRAPH_NODE_SETTINGS.CREATE_MARKER_Y,
            },
          ),
        ],
      });

    this.releaseMarker = createMarker(options.releaseName);
    this.catchMarker = createMarker(options.catchName);

    const timeFromViewX = (x: number) => clamp(chartTransform.viewToModelX(clamp(x, 0, viewWidth)), 0, MAX_RUN_TIME);

    const attach = (marker: Node, isStart: boolean) => {
      const set = (t: number) => {
        const trace = runs.currentTrace;
        if (trace.isEmpty) {
          return;
        }
        const end = Math.min(trace.windowEndProperty.value, trace.duration);
        const start = trace.windowStartProperty.value;
        if (isStart) {
          trace.windowStartProperty.value = clamp(t, 0, end - 0.1);
        } else {
          trace.windowEndProperty.value = clamp(t, start + 0.1, trace.duration);
        }
      };
      marker.addInputListener(
        new RichDragListener({
          dragListenerOptions: {
            drag: (event) => set(timeFromViewX(chartLocal.globalToLocalPoint(event.pointer.point).x)),
          },
          keyboardDragListenerOptions: {
            keyboardDragDirection: "leftRight",
            dragDelta: MARKER_DRAG_DELTA,
            shiftDragDelta: 1,
            drag: (_event, listener) => set(timeFromViewX(marker.x + listener.modelDelta.x)),
          },
        }),
      );
    };
    attach(this.releaseMarker, true);
    attach(this.catchMarker, false);

    this.children = [this.releaseMarker, this.catchMarker];
  }

  /** Updates shade bands and marker positions for the current experiment's window. */
  public refresh(trace: Trace, showTrim: boolean): void {
    this.shadeBefore.visible = showTrim;
    this.shadeAfter.visible = showTrim;
    this.releaseMarker.visible = showTrim;
    this.catchMarker.visible = showTrim;
    if (!showTrim) {
      return;
    }
    const toX = (t: number) => clamp(this.chartTransform.modelToViewX(t), 0, this.viewWidth);
    const startX = toX(trace.windowStartProperty.value);
    const endX = toX(Math.min(trace.windowEndProperty.value, trace.duration));
    this.shadeBefore.setRect(0, 0, startX, this.viewHeight);
    this.shadeAfter.setRect(endX, 0, Math.max(0, this.viewWidth - endX), this.viewHeight);
    this.releaseMarker.x = startX;
    this.catchMarker.x = endX;
  }
}
