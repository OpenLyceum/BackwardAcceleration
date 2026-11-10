/**
 * KinematicsGraphNode.ts
 *
 * One graph of the handout — velocity vs. time or acceleration vs. time — drawn
 * with bamboo. Its layers, back to front:
 *
 *   the other experiments' runs (faint grey, optional)
 *   the measured run (blue, solid — the handout's "blue / solid line")
 *   the group prediction (purple, dotted)
 *   each student's prediction (red, dashed — the handout's "red / dashed line")
 *
 * When drawing is turned on in the Predictions panel, dragging on the plot adds a
 * stroke to that layer. On the Smart Cart screen, with "Show whole recording" on,
 * the parts outside release → catch are shaded and two orange markers set them.
 *
 * Redrawing is explicit (refresh): the owning GraphArea calls it when data, the
 * experiment, a sketch, or the zoom changes, so a frame costs nothing when idle.
 */

import type { NumberProperty, TReadOnlyProperty } from "scenerystack/axon";
import {
  AxisLine,
  ChartRectangle,
  ChartTransform,
  GridLineSet,
  LinePlot,
  TickLabelSet,
  TickMarkSet,
} from "scenerystack/bamboo";
import { clamp, Matrix3, Range, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Orientation } from "scenerystack/phet-core";
import { DragListener, Line, Node, Path, Rectangle, RichDragListener, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import BackwardAccelerationColors from "../../BackwardAccelerationColors.js";
import { MAX_RUN_TIME } from "../../BackwardAccelerationConstants.js";
import { EXPERIMENTS } from "../model/Experiment.js";
import { GraphScales, TIME_LEVELS } from "../model/GraphScales.js";
import type { PredictionNotebook } from "../model/PredictionNotebook.js";
import { Quantity, type QuantityValue, SketchLayer, type Stroke } from "../model/PredictionSketch.js";
import type { RunLibrary } from "../model/RunLibrary.js";
import type { MotionSeries } from "../model/Trace.js";

const LEFT_INSET = 52; // axis title + tick labels
const BOTTOM_INSET = 30; // tick labels + axis title
const TOP_INSET = 6;
const RIGHT_INSET = 8;

const TICK_FONT = new PhetFont(10);
const AXIS_TITLE_FONT = new PhetFont(12);

const MEASURED_LINE_WIDTH = 2.5;
const OTHER_RUN_LINE_WIDTH = 1.5;
const SKETCH_LINE_WIDTH = 2.5;
const INDIVIDUAL_DASH = [9, 5];
const GROUP_DASH = [2, 4];

/** Keyboard step of a trim marker, in view px (the time per px depends on zoom). */
const MARKER_DRAG_DELTA = 4;

export type KinematicsGraphNodeOptions = {
  readonly quantity: QuantityValue;
  readonly width: number;
  readonly height: number;
  readonly axisTitle: TReadOnlyProperty<string>;
  readonly timeAxisTitle: TReadOnlyProperty<string>;
  readonly accessibleName: TReadOnlyProperty<string>;
  readonly accessibleHelpText: TReadOnlyProperty<string>;
  /** Shows the release / catch markers on the full recording (Smart Cart screen). */
  readonly trimMarkers?: {
    readonly releaseName: TReadOnlyProperty<string>;
    readonly catchName: TReadOnlyProperty<string>;
    readonly helpText: TReadOnlyProperty<string>;
  };
};

function valuesOf(series: MotionSeries, quantity: QuantityValue): readonly number[] {
  return quantity === Quantity.VELOCITY ? series.velocities : series.accelerations;
}

function toDataSet(series: MotionSeries, quantity: QuantityValue): Vector2[] {
  const values = valuesOf(series, quantity);
  return series.times.map((t, i) => new Vector2(t, values[i] as number));
}

export class KinematicsGraphNode extends Node {
  /** The focusable plot rectangle, for pdomOrder. */
  public readonly plotNode: Node;
  public readonly releaseMarker: Node | null = null;
  public readonly catchMarker: Node | null = null;

  private readonly quantity: QuantityValue;
  private readonly runs: RunLibrary;
  private readonly notebook: PredictionNotebook;
  private readonly chartTransform: ChartTransform;
  private readonly measuredPlot: LinePlot;
  private readonly otherRunsLayer: Node;
  private readonly individualPath: Path;
  private readonly groupPath: Path;
  private readonly shadeBefore: Rectangle;
  private readonly shadeAfter: Rectangle;
  private readonly viewWidth: number;
  private readonly viewHeight: number;

  public constructor(runs: RunLibrary, notebook: PredictionNotebook, options: KinematicsGraphNodeOptions) {
    super({ isDisposable: false });
    this.quantity = options.quantity;
    this.runs = runs;
    this.notebook = notebook;

    const viewWidth = options.width - LEFT_INSET - RIGHT_INSET;
    const viewHeight = options.height - TOP_INSET - BOTTOM_INSET;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;

    const valueLevels = GraphScales.valueLevels(options.quantity);
    const valueLevelProperty: NumberProperty = runs.scales.valueLevelProperty(options.quantity);
    const valueLevel = valueLevels[valueLevelProperty.value] ?? valueLevels[0];
    const timeLevel = TIME_LEVELS[runs.scales.timeLevelProperty.value] ?? TIME_LEVELS[0];
    if (valueLevel === undefined || timeLevel === undefined) {
      throw new Error("KinematicsGraphNode needs at least one zoom level per axis");
    }

    const chartTransform = new ChartTransform({
      viewWidth,
      viewHeight,
      modelXRange: new Range(0, timeLevel.max),
      modelYRange: new Range(-valueLevel.max, valueLevel.max),
    });
    this.chartTransform = chartTransform;

    const chartRectangle = new ChartRectangle(chartTransform, {
      fill: BackwardAccelerationColors.graphBackgroundColorProperty,
      stroke: BackwardAccelerationColors.graphAxisColorProperty,
      lineWidth: 1,
      tagName: "div",
      focusable: true,
      accessibleName: options.accessibleName,
      accessibleHelpText: options.accessibleHelpText,
    });
    this.plotNode = chartRectangle;

    const gridOptions = { stroke: BackwardAccelerationColors.graphGridColorProperty, lineWidth: 0.5 };
    const horizontalGrid = new GridLineSet(chartTransform, Orientation.VERTICAL, valueLevel.step, gridOptions);
    const verticalGrid = new GridLineSet(chartTransform, Orientation.HORIZONTAL, timeLevel.step, gridOptions);
    const zeroAxis = new AxisLine(chartTransform, Orientation.HORIZONTAL, {
      stroke: BackwardAccelerationColors.graphAxisColorProperty,
      lineWidth: 1.5,
    });

    const label = (value: number) =>
      new Text(Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/0$/, ""), {
        font: TICK_FONT,
        fill: BackwardAccelerationColors.textColorProperty,
      });
    const yTicks = new TickMarkSet(chartTransform, Orientation.VERTICAL, valueLevel.step, { edge: "min" });
    const yLabels = new TickLabelSet(chartTransform, Orientation.VERTICAL, valueLevel.step, {
      edge: "min",
      createLabel: label,
    });
    const xTicks = new TickMarkSet(chartTransform, Orientation.HORIZONTAL, timeLevel.step, { edge: "min" });
    const xLabels = new TickLabelSet(chartTransform, Orientation.HORIZONTAL, timeLevel.step, {
      edge: "min",
      createLabel: label,
    });

    this.otherRunsLayer = new Node({ pickable: false });
    this.measuredPlot = new LinePlot(chartTransform, [], {
      stroke: BackwardAccelerationColors.measuredColorProperty,
      lineWidth: MEASURED_LINE_WIDTH,
      pickable: false,
    });
    this.groupPath = new Path(null, {
      stroke: BackwardAccelerationColors.groupPredictionColorProperty,
      lineWidth: SKETCH_LINE_WIDTH,
      lineDash: GROUP_DASH,
      lineCap: "round",
      lineJoin: "round",
      pickable: false,
    });
    this.individualPath = new Path(null, {
      stroke: BackwardAccelerationColors.individualPredictionColorProperty,
      lineWidth: SKETCH_LINE_WIDTH,
      lineDash: INDIVIDUAL_DASH,
      lineJoin: "round",
      pickable: false,
    });

    this.shadeBefore = new Rectangle(0, 0, 0, viewHeight, {
      fill: BackwardAccelerationColors.trimShadeColorProperty,
      pickable: false,
    });
    this.shadeAfter = new Rectangle(0, 0, 0, viewHeight, {
      fill: BackwardAccelerationColors.trimShadeColorProperty,
      pickable: false,
    });

    // ── Drawing predictions ────────────────────────────────────────────────────
    const modelPointAt = (globalPoint: Vector2): Vector2 => {
      const local = chartRectangle.globalToLocalPoint(globalPoint);
      return chartTransform.viewToModelPosition(
        new Vector2(clamp(local.x, 0, viewWidth), clamp(local.y, 0, viewHeight)),
      );
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
            .beginStroke(options.quantity, mode, modelPointAt(event.pointer.point));
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

    // ── Trim markers (Smart Cart screen) ─────────────────────────────────────────
    const markerLayer = new Node();
    if (options.trimMarkers) {
      const createMarker = (accessibleName: TReadOnlyProperty<string>) =>
        new Node({
          cursor: "ew-resize",
          tagName: "div",
          focusable: true,
          accessibleName,
          accessibleHelpText: options.trimMarkers?.helpText ?? null,
          children: [
            new Rectangle(-6, 0, 12, viewHeight, { fill: "transparent" }),
            new Line(0, 0, 0, viewHeight, { stroke: BackwardAccelerationColors.trimHandleColorProperty, lineWidth: 2 }),
            new Path(Shape.regularPolygon(3, 6).transformed(Matrix3.rotation2(Math.PI / 2)), {
              fill: BackwardAccelerationColors.trimHandleColorProperty,
              y: 4,
            }),
          ],
        });
      const releaseMarker = createMarker(options.trimMarkers.releaseName);
      const catchMarker = createMarker(options.trimMarkers.catchName);
      this.releaseMarker = releaseMarker;
      this.catchMarker = catchMarker;

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
              drag: (event) => set(timeFromViewX(chartRectangle.globalToLocalPoint(event.pointer.point).x)),
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
      attach(releaseMarker, true);
      attach(catchMarker, false);
      markerLayer.children = [releaseMarker, catchMarker];
    }

    const plotLayer = new Node({
      x: LEFT_INSET,
      y: TOP_INSET,
      children: [
        chartRectangle,
        new Node({
          clipArea: Shape.rect(0, 0, viewWidth, viewHeight),
          pickable: false,
          children: [
            verticalGrid,
            horizontalGrid,
            zeroAxis,
            this.shadeBefore,
            this.shadeAfter,
            this.otherRunsLayer,
            this.measuredPlot,
            this.groupPath,
            this.individualPath,
          ],
        }),
        markerLayer,
        yTicks,
        yLabels,
        xTicks,
        xLabels,
      ],
    });

    const yTitle = new Text(options.axisTitle, {
      font: AXIS_TITLE_FONT,
      fill: BackwardAccelerationColors.textColorProperty,
      rotation: -Math.PI / 2,
      maxWidth: viewHeight,
    });
    const xTitle = new Text(options.timeAxisTitle, {
      font: AXIS_TITLE_FONT,
      fill: BackwardAccelerationColors.textColorProperty,
      maxWidth: viewWidth,
    });
    const placeTitles = () => {
      yTitle.centerY = TOP_INSET + viewHeight / 2;
      yTitle.left = 0;
      xTitle.centerX = LEFT_INSET + viewWidth / 2;
      xTitle.bottom = options.height;
    };
    yTitle.boundsProperty.lazyLink(placeTitles);
    xTitle.boundsProperty.lazyLink(placeTitles);
    placeTitles();

    this.children = [plotLayer, yTitle, xTitle];

    // ── Zoom ────────────────────────────────────────────────────────────────────
    valueLevelProperty.link((index) => {
      const level = valueLevels[index];
      if (level) {
        chartTransform.setModelYRange(new Range(-level.max, level.max));
        horizontalGrid.setSpacing(level.step);
        yTicks.setSpacing(level.step);
        yLabels.setSpacing(level.step);
      }
    });
    runs.scales.timeLevelProperty.link((index) => {
      const level = TIME_LEVELS[index];
      if (level) {
        chartTransform.setModelXRange(new Range(0, level.max));
        verticalGrid.setSpacing(level.step);
        xTicks.setSpacing(level.step);
        xLabels.setSpacing(level.step);
      }
    });
    // LinePlot follows the transform itself; the sketch paths and markers do not.
    chartTransform.changedEmitter.addListener(() => this.refresh());

    this.refresh();
  }

  private strokesShape(strokes: readonly Stroke[]): Shape | null {
    if (strokes.length === 0) {
      return null;
    }
    const shape = new Shape();
    for (const stroke of strokes) {
      stroke.forEach((point, i) => {
        const view = this.chartTransform.modelToViewPosition(point);
        if (i === 0) {
          shape.moveToPoint(view);
          // A single click leaves a dot.
          if (stroke.length === 1) {
            shape.lineToPoint(view.plusXY(0.5, 0));
          }
        } else {
          shape.lineToPoint(view);
        }
      });
    }
    return shape;
  }

  /** Redraws data, other runs, sketches, and trim shading for the current experiment. */
  public refresh(): void {
    const runs = this.runs;
    const experiment = runs.experimentProperty.value;

    this.measuredPlot.setDataSet(toDataSet(runs.seriesFor(experiment), this.quantity));

    if (runs.showOtherRunsProperty.value) {
      this.otherRunsLayer.children = EXPERIMENTS.filter((other) => other !== experiment)
        .map((other) => toDataSet(runs.seriesFor(other), this.quantity))
        .filter((dataSet) => dataSet.length > 0)
        .map(
          (dataSet) =>
            new LinePlot(this.chartTransform, dataSet, {
              stroke: BackwardAccelerationColors.otherRunsColorProperty,
              lineWidth: OTHER_RUN_LINE_WIDTH,
            }),
        );
    } else {
      this.otherRunsLayer.children = [];
    }

    const sketch = this.notebook.sketchFor(experiment);
    this.individualPath.shape = this.strokesShape(sketch.getStrokes(this.quantity, SketchLayer.INDIVIDUAL));
    this.groupPath.shape = this.strokesShape(sketch.getStrokes(this.quantity, SketchLayer.GROUP));
    this.individualPath.visible = this.notebook.showIndividualProperty.value;
    this.groupPath.visible = this.notebook.showGroupProperty.value;

    // Trim shading and markers only make sense on the full recording.
    const trace = runs.traceFor(experiment);
    const showTrim = runs.showFullRecordingProperty.value && !trace.isEmpty && this.releaseMarker !== null;
    this.shadeBefore.visible = showTrim;
    this.shadeAfter.visible = showTrim;
    if (this.releaseMarker && this.catchMarker) {
      this.releaseMarker.visible = showTrim;
      this.catchMarker.visible = showTrim;
    }
    if (showTrim) {
      const toX = (t: number) => clamp(this.chartTransform.modelToViewX(t), 0, this.viewWidth);
      const startX = toX(trace.windowStartProperty.value);
      const endX = toX(Math.min(trace.windowEndProperty.value, trace.duration));
      this.shadeBefore.setRect(0, 0, startX, this.viewHeight);
      this.shadeAfter.setRect(endX, 0, Math.max(0, this.viewWidth - endX), this.viewHeight);
      if (this.releaseMarker && this.catchMarker) {
        this.releaseMarker.x = startX;
        this.catchMarker.x = endX;
      }
    }
  }
}
