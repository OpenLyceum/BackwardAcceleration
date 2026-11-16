import { KINEMATICS_GRAPH_NODE_SETTINGS } from "../../BackwardAccelerationConstants.js";
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
 *
 * Trim markers live in TrimMarkersLayer; freehand strokes and zoom wiring in
 * sketchDrawing / graphZoom.
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
import { Range, toFixed, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Orientation } from "scenerystack/phet-core";
import { Node, Path, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import BackwardAccelerationColors from "../../BackwardAccelerationColors.js";
import { EXPERIMENTS } from "../model/Experiment.js";
import { GraphScales, TIME_LEVELS } from "../model/GraphScales.js";
import type { PredictionNotebook } from "../model/PredictionNotebook.js";
import { Quantity, type QuantityValue, SketchLayer } from "../model/PredictionSketch.js";
import type { RunLibrary } from "../model/RunLibrary.js";
import type { MotionSeries } from "../model/Trace.js";
import { installGraphZoom } from "./graphZoom.js";
import { installSketchDrawing, strokesShape } from "./sketchDrawing.js";
import { TrimMarkersLayer, type TrimMarkersOptions } from "./TrimMarkersLayer.js";

const LEFT_INSET: number = KINEMATICS_GRAPH_NODE_SETTINGS.LEFT_INSET; // axis title + tick labels
const BOTTOM_INSET: number = KINEMATICS_GRAPH_NODE_SETTINGS.BOTTOM_INSET; // tick labels + axis title
const TOP_INSET: number = KINEMATICS_GRAPH_NODE_SETTINGS.TOP_INSET;
const RIGHT_INSET: number = KINEMATICS_GRAPH_NODE_SETTINGS.RIGHT_INSET;

const TICK_FONT = new PhetFont(KINEMATICS_GRAPH_NODE_SETTINGS.TICK_FONT_SIZE);
const AXIS_TITLE_FONT = new PhetFont(KINEMATICS_GRAPH_NODE_SETTINGS.AXIS_TITLE_FONT_SIZE);

const MEASURED_LINE_WIDTH: number = KINEMATICS_GRAPH_NODE_SETTINGS.MEASURED_LINE_WIDTH;
const OTHER_RUN_LINE_WIDTH: number = KINEMATICS_GRAPH_NODE_SETTINGS.OTHER_RUN_LINE_WIDTH;
const SKETCH_LINE_WIDTH: number = KINEMATICS_GRAPH_NODE_SETTINGS.SKETCH_LINE_WIDTH;
const INDIVIDUAL_DASH = [9, 5];
const GROUP_DASH = [2, 4];

export type KinematicsGraphNodeOptions = {
  readonly quantity: QuantityValue;
  readonly width: number;
  readonly height: number;
  readonly axisTitle: TReadOnlyProperty<string>;
  readonly timeAxisTitle: TReadOnlyProperty<string>;
  readonly accessibleName: TReadOnlyProperty<string>;
  readonly accessibleHelpText: TReadOnlyProperty<string>;
  /** Shows the release / catch markers on the full recording (Smart Cart screen). */
  readonly trimMarkers?: TrimMarkersOptions;
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
  private readonly trimLayer: TrimMarkersLayer | null = null;

  public constructor(runs: RunLibrary, notebook: PredictionNotebook, options: KinematicsGraphNodeOptions) {
    super({ isDisposable: false });
    this.quantity = options.quantity;
    this.runs = runs;
    this.notebook = notebook;

    const viewWidth = options.width - LEFT_INSET - RIGHT_INSET;
    const viewHeight = options.height - TOP_INSET - BOTTOM_INSET;

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

    const gridOptions = {
      stroke: BackwardAccelerationColors.graphGridColorProperty,
      lineWidth: KINEMATICS_GRAPH_NODE_SETTINGS.GRID_OPTIONS_LINE_WIDTH,
    };
    const horizontalGrid = new GridLineSet(chartTransform, Orientation.VERTICAL, valueLevel.step, gridOptions);
    const verticalGrid = new GridLineSet(chartTransform, Orientation.HORIZONTAL, timeLevel.step, gridOptions);
    const zeroAxis = new AxisLine(chartTransform, Orientation.HORIZONTAL, {
      stroke: BackwardAccelerationColors.graphAxisColorProperty,
      lineWidth: KINEMATICS_GRAPH_NODE_SETTINGS.ZERO_AXIS_LINE_WIDTH,
    });

    const label = (value: number) =>
      new Text(
        Number.isInteger(value)
          ? value.toString()
          : toFixed(value, KINEMATICS_GRAPH_NODE_SETTINGS.LABEL_DECIMAL_PLACES).replace(/0$/, ""),
        {
          font: TICK_FONT,
          fill: BackwardAccelerationColors.textColorProperty,
        },
      );
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

    installSketchDrawing(chartRectangle, chartTransform, viewWidth, viewHeight, runs, notebook, options.quantity);

    const clippedChildren: Node[] = [
      verticalGrid,
      horizontalGrid,
      zeroAxis,
      this.otherRunsLayer,
      this.measuredPlot,
      this.groupPath,
      this.individualPath,
    ];

    let markerLayer: Node = new Node();
    if (options.trimMarkers) {
      const trimLayer = new TrimMarkersLayer(
        runs,
        chartTransform,
        chartRectangle,
        viewWidth,
        viewHeight,
        options.trimMarkers,
      );
      this.trimLayer = trimLayer;
      this.releaseMarker = trimLayer.releaseMarker;
      this.catchMarker = trimLayer.catchMarker;
      // Shades sit under the plots; markers sit above the clipped layer.
      clippedChildren.splice(3, 0, trimLayer.shadeBefore, trimLayer.shadeAfter);
      markerLayer = trimLayer;
    }

    const plotLayer = new Node({
      x: LEFT_INSET,
      y: TOP_INSET,
      children: [
        chartRectangle,
        new Node({
          clipArea: Shape.rect(0, 0, viewWidth, viewHeight),
          pickable: false,
          children: clippedChildren,
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

    installGraphZoom(
      { chartTransform, horizontalGrid, verticalGrid, yTicks, yLabels, xTicks, xLabels },
      valueLevels,
      valueLevelProperty,
      runs.scales.timeLevelProperty,
    );
    // LinePlot follows the transform itself; the sketch paths and markers do not.
    chartTransform.changedEmitter.addListener(() => this.refresh());

    this.refresh();
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
    this.individualPath.shape = strokesShape(
      this.chartTransform,
      sketch.getStrokes(this.quantity, SketchLayer.INDIVIDUAL),
    );
    this.groupPath.shape = strokesShape(this.chartTransform, sketch.getStrokes(this.quantity, SketchLayer.GROUP));
    this.individualPath.visible = this.notebook.showIndividualProperty.value;
    this.groupPath.visible = this.notebook.showGroupProperty.value;

    // Trim shading and markers only make sense on the full recording.
    const trace = runs.traceFor(experiment);
    const showTrim = runs.showFullRecordingProperty.value && !trace.isEmpty && this.trimLayer !== null;
    this.trimLayer?.refresh(trace, showTrim);
  }
}
