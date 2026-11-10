/**
 * ExperimentPanel.ts
 *
 * Which of the handout's five experiments this run is, with the handout's
 * instruction for it. On the Lab screen, choosing an experiment also loads its
 * track set-up.
 */

import { DerivedProperty } from "scenerystack/axon";
import { type Node, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { ComboBox } from "scenerystack/sun";
import BackwardAccelerationColors from "../../BackwardAccelerationColors.js";
import { StringManager } from "../../i18n/StringManager.js";
import {
  BACKWARD_ACCELERATION_COMBO_BOX_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../BackwardAccelerationButtonOptions.js";
import { BackwardAccelerationPanel } from "../BackwardAccelerationPanel.js";
import { EXPERIMENTS, type ExperimentValue } from "../model/Experiment.js";
import type { RunLibrary } from "../model/RunLibrary.js";

const TITLE_FONT = new PhetFont({ size: 14, weight: "bold" });
const ITEM_FONT = new PhetFont(13);
const INSTRUCTION_FONT = new PhetFont(12);

export class ExperimentPanel extends BackwardAccelerationPanel {
  public readonly comboBox: ComboBox<ExperimentValue>;

  public constructor(runs: RunLibrary, listParent: Node, width: number) {
    const strings = StringManager.getInstance();
    const labels = strings.getLabels();
    const names = strings.getExperimentNames();
    const instructions = strings.getInstructions();
    const innerWidth = width - 24;

    const nameOf = (experiment: ExperimentValue) => names[`${experiment}StringProperty`];
    const comboBox = new ComboBox(
      runs.experimentProperty,
      EXPERIMENTS.map((experiment) => ({
        value: experiment,
        createNode: () =>
          new Text(nameOf(experiment), { font: ITEM_FONT, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: innerWidth - 40 }),
        tandemName: `experiment${experiment}Item`,
      })),
      listParent,
      {
        ...BACKWARD_ACCELERATION_COMBO_BOX_OPTIONS,
        xMargin: 8,
        yMargin: 4,
        accessibleName: strings.getControlsA11yStrings().experimentStringProperty,
      },
    );

    const instructionProperty = new DerivedProperty(
      [
        runs.experimentProperty,
        instructions.AStringProperty,
        instructions.BStringProperty,
        instructions.CStringProperty,
        instructions.DStringProperty,
        instructions.EStringProperty,
      ],
      (experiment, a, b, c, d, e) => ({ A: a, B: b, C: c, D: d, E: e })[experiment],
    );

    super(
      new VBox({
        align: "left",
        spacing: 6,
        children: [
          new Text(labels.experimentStringProperty, {
            font: TITLE_FONT,
            fill: BackwardAccelerationColors.textColorProperty,
            maxWidth: innerWidth,
          }),
          comboBox,
          new RichText(instructionProperty, {
            font: INSTRUCTION_FONT,
            fill: BackwardAccelerationColors.textColorProperty,
            lineWrap: innerWidth,
          }),
        ],
      }),
      { minWidth: width, maxWidth: width, isDisposable: false },
    );
    this.comboBox = comboBox;
  }
}
