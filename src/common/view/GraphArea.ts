/**
 * GraphArea.ts
 *
 * The stacked v–t and a–t graphs shared by both screens, each with its own
 * vertical zoom, a shared time zoom, and a legend that ties the line styles to
 * the handout's instructions (red dashed = my prediction, dotted = group,
 * blue solid = measured). It owns the one place that decides when to redraw.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { HBox, Line, type Node, Text, VBox } from "scenerystack/scenery";
import { PhetFont, PlusMinusZoomButtonGroup } from "scenerystack/scenery-phet";
import BackwardAccelerationColors from "../../BackwardAccelerationColors.js";
import { GRAPH_HEIGHT, GRAPH_SPACING, GRAPH_WIDTH } from "../../BackwardAccelerationConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { FLAT_BUTTON_APPEARANCE_OPTIONS } from "../BackwardAccelerationButtonOptions.js";
import { EXPERIMENTS } from "../model/Experiment.js";
import type { PredictionNotebook } from "../model/PredictionNotebook.js";
import { Quantity } from "../model/PredictionSketch.js";
import type { RunLibrary } from "../model/RunLibrary.js";
import { KinematicsGraphNode } from "./KinematicsGraphNode.js";

const LEGEND_FONT = new PhetFont(12);
const LEGEND_LINE_LENGTH = 28;

export type GraphAreaOptions = {
  /** Smart Cart screen: release / catch markers on the full recording. */
  readonly trimMarkers?: boolean;
};

export class GraphArea extends VBox {
  public readonly velocityGraph: KinematicsGraphNode;
  public readonly accelerationGraph: KinematicsGraphNode;
  /** Focusable nodes in traversal order. */
  public readonly focusOrder: Node[];

  public constructor(runs: RunLibrary, notebook: PredictionNotebook, options?: GraphAreaOptions) {
    const labels = StringManager.getInstance().getLabels();
    const a11y = StringManager.getInstance().getControlsA11yStrings();

    const trimMarkers = options?.trimMarkers
      ? {
          releaseName: a11y.releaseMarkerStringProperty,
          catchName: a11y.catchMarkerStringProperty,
          helpText: a11y.markerHelpStringProperty,
        }
      : undefined;

    const velocityGraph = new KinematicsGraphNode(runs, notebook, {
      quantity: Quantity.VELOCITY,
      width: GRAPH_WIDTH,
      height: GRAPH_HEIGHT,
      axisTitle: labels.velocityAxisStringProperty,
      timeAxisTitle: labels.timeAxisStringProperty,
      accessibleName: a11y.velocityGraphStringProperty,
      accessibleHelpText: a11y.graphHelpStringProperty,
      ...(trimMarkers && { trimMarkers }),
    });
    const accelerationGraph = new KinematicsGraphNode(runs, notebook, {
      quantity: Quantity.ACCELERATION,
      width: GRAPH_WIDTH,
      height: GRAPH_HEIGHT,
      axisTitle: labels.accelerationAxisStringProperty,
      timeAxisTitle: labels.timeAxisStringProperty,
      accessibleName: a11y.accelerationGraphStringProperty,
      accessibleHelpText: a11y.graphHelpStringProperty,
      ...(trimMarkers && { trimMarkers }),
    });

    // Zoom levels run from small extents (zoomed in) to large; "zoom in" steps down.
    const zoomGroup = (
      property: ReturnType<typeof runs.scales.valueLevelProperty>,
      orientation: "vertical" | "horizontal",
      zoomInName: TReadOnlyProperty<string>,
      zoomOutName: TReadOnlyProperty<string>,
    ) =>
      new PlusMinusZoomButtonGroup(property, {
        orientation,
        spacing: 4,
        applyZoomIn: (level: number) => level - 1,
        applyZoomOut: (level: number) => level + 1,
        buttonOptions: FLAT_BUTTON_APPEARANCE_OPTIONS,
        accessibleNameZoomIn: zoomInName,
        accessibleNameZoomOut: zoomOutName,
      });

    const velocityZoom = zoomGroup(
      runs.scales.velocityLevelProperty,
      "vertical",
      a11y.zoomInValueStringProperty,
      a11y.zoomOutValueStringProperty,
    );
    const accelerationZoom = zoomGroup(
      runs.scales.accelerationLevelProperty,
      "vertical",
      a11y.zoomInValueStringProperty,
      a11y.zoomOutValueStringProperty,
    );
    const timeZoom = zoomGroup(
      runs.scales.timeLevelProperty,
      "horizontal",
      a11y.zoomInTimeStringProperty,
      a11y.zoomOutTimeStringProperty,
    );

    const legendItem = (
      label: TReadOnlyProperty<string>,
      stroke: typeof BackwardAccelerationColors.measuredColorProperty,
      lineDash: number[],
    ) =>
      new HBox({
        spacing: 5,
        children: [
          new Line(0, 0, LEGEND_LINE_LENGTH, 0, { stroke, lineWidth: 2.5, lineDash }),
          new Text(label, { font: LEGEND_FONT, fill: BackwardAccelerationColors.textColorProperty, maxWidth: 120 }),
        ],
      });
    const legend = new HBox({
      spacing: 16,
      children: [
        legendItem(labels.measuredStringProperty, BackwardAccelerationColors.measuredColorProperty, []),
        legendItem(
          labels.showIndividualStringProperty,
          BackwardAccelerationColors.individualPredictionColorProperty,
          [9, 5],
        ),
        legendItem(labels.showGroupStringProperty, BackwardAccelerationColors.groupPredictionColorProperty, [2, 4]),
      ],
    });

    super({
      isDisposable: false,
      spacing: GRAPH_SPACING,
      align: "right",
      children: [
        new HBox({ spacing: 6, align: "center", children: [velocityGraph, velocityZoom] }),
        new HBox({ spacing: 6, align: "center", children: [accelerationGraph, accelerationZoom] }),
        new HBox({ spacing: 20, children: [legend, timeZoom] }),
      ],
    });

    this.velocityGraph = velocityGraph;
    this.accelerationGraph = accelerationGraph;
    this.focusOrder = [
      velocityGraph.plotNode,
      ...(velocityGraph.releaseMarker ? [velocityGraph.releaseMarker] : []),
      ...(velocityGraph.catchMarker ? [velocityGraph.catchMarker] : []),
      velocityZoom,
      accelerationGraph.plotNode,
      ...(accelerationGraph.releaseMarker ? [accelerationGraph.releaseMarker] : []),
      ...(accelerationGraph.catchMarker ? [accelerationGraph.catchMarker] : []),
      accelerationZoom,
      timeZoom,
    ];

    const refresh = () => {
      velocityGraph.refresh();
      accelerationGraph.refresh();
    };
    runs.dataChangedEmitter.addListener(refresh);
    runs.experimentProperty.lazyLink(refresh);
    runs.showOtherRunsProperty.lazyLink(refresh);
    notebook.showIndividualProperty.lazyLink(refresh);
    notebook.showGroupProperty.lazyLink(refresh);
    for (const experiment of EXPERIMENTS) {
      notebook.sketchFor(experiment).changedEmitter.addListener(refresh);
    }
  }
}
