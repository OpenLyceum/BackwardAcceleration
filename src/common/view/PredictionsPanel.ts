/**
 * PredictionsPanel.ts
 *
 * The handout's predict → discuss → compare workflow: choose which prediction a
 * drag on the graphs draws (mine, the group's, or none), show or hide each layer,
 * erase a layer for the current experiment, and lay the other experiments' runs
 * behind this one (to compare B with A, or C with D).
 */

import { HBox, type Node, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, Checkbox, RectangularPushButton } from "scenerystack/sun";
import BackwardAccelerationColors from "../../BackwardAccelerationColors.js";
import { StringManager } from "../../i18n/StringManager.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../BackwardAccelerationButtonOptions.js";
import { BACKWARD_ACCELERATION_CHECKBOX_OPTIONS } from "../BackwardAccelerationControlOptions.js";
import { BackwardAccelerationPanel } from "../BackwardAccelerationPanel.js";
import type { DrawModeValue, PredictionNotebook } from "../model/PredictionNotebook.js";
import { SketchLayer } from "../model/PredictionSketch.js";
import type { RunLibrary } from "../model/RunLibrary.js";

const TITLE_FONT = new PhetFont({ size: 14, weight: "bold" });
const FONT = new PhetFont(12);

export class PredictionsPanel extends BackwardAccelerationPanel {
  public readonly focusOrder: readonly Node[];

  public constructor(notebook: PredictionNotebook, runs: RunLibrary, width: number) {
    const labels = StringManager.getInstance().getLabels();
    const a11y = StringManager.getInstance().getControlsA11yStrings();
    const innerWidth = width - 24;
    const text = (property: typeof labels.drawOffStringProperty, maxWidth = innerWidth - 30) =>
      new Text(property, { font: FONT, fill: BackwardAccelerationColors.textColorProperty, maxWidth });

    const drawModeGroup = new AquaRadioButtonGroup<DrawModeValue>(
      notebook.drawModeProperty,
      [
        { value: "off", createNode: () => text(labels.drawOffStringProperty), tandemName: "drawOffRadioButton" },
        {
          value: SketchLayer.INDIVIDUAL,
          createNode: () => text(labels.drawIndividualStringProperty),
          tandemName: "drawIndividualRadioButton",
        },
        {
          value: SketchLayer.GROUP,
          createNode: () => text(labels.drawGroupStringProperty),
          tandemName: "drawGroupRadioButton",
        },
      ],
      {
        orientation: "vertical",
        spacing: 5,
        radioButtonOptions: { radius: 7 },
        accessibleName: a11y.drawModeStringProperty,
      },
    );

    const showIndividual = new Checkbox(
      notebook.showIndividualProperty,
      text(labels.showIndividualStringProperty, 90),
      {
        ...BACKWARD_ACCELERATION_CHECKBOX_OPTIONS,
        checkboxColor: BackwardAccelerationColors.individualPredictionColorProperty,
      },
    );
    const showGroup = new Checkbox(notebook.showGroupProperty, text(labels.showGroupStringProperty, 90), {
      ...BACKWARD_ACCELERATION_CHECKBOX_OPTIONS,
      checkboxColor: BackwardAccelerationColors.groupPredictionColorProperty,
    });

    const eraseButton = (label: typeof labels.eraseIndividualStringProperty, listener: () => void) =>
      new RectangularPushButton({
        ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
        content: new Text(label, { font: FONT, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: innerWidth / 2 - 20 }),
        xMargin: 6,
        yMargin: 3,
        listener,
      });
    const eraseIndividual = eraseButton(labels.eraseIndividualStringProperty, () =>
      notebook.sketchFor(runs.experimentProperty.value).clearLayer(SketchLayer.INDIVIDUAL),
    );
    const eraseGroup = eraseButton(labels.eraseGroupStringProperty, () =>
      notebook.sketchFor(runs.experimentProperty.value).clearLayer(SketchLayer.GROUP),
    );

    const showOtherRuns = new Checkbox(runs.showOtherRunsProperty, text(labels.showOtherRunsStringProperty), {
      ...BACKWARD_ACCELERATION_CHECKBOX_OPTIONS,
    });

    super(
      new VBox({
        align: "left",
        spacing: 7,
        children: [
          new Text(labels.predictionsStringProperty, {
            font: TITLE_FONT,
            fill: BackwardAccelerationColors.textColorProperty,
            maxWidth: innerWidth,
          }),
          drawModeGroup,
          new HBox({ spacing: 8, children: [showIndividual, showGroup] }),
          new HBox({ spacing: 6, children: [eraseIndividual, eraseGroup] }),
          showOtherRuns,
        ],
      }),
      { minWidth: width, maxWidth: width },
    );

    this.focusOrder = [drawModeGroup, showIndividual, showGroup, eraseIndividual, eraseGroup, showOtherRuns];
  }
}
