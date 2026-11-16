import { SIGN_TABLE_NODE_SETTINGS } from "../../BackwardAccelerationConstants.js";
/**
 * SignTableNode.ts
 *
 * The handout's table: is the velocity — and the acceleration — positive, zero, or
 * negative in each phase of the motion? For experiment E the phases are "moving
 * up", "at the peak", and "moving down"; for the others, early / middle / late in
 * the run. Each cell is a button that cycles ? → + → 0 → −. With "Check against
 * the run" on, every answered cell is marked right or wrong against the measured
 * run's signs (see motionAnalysis.phaseSigns).
 *
 * The cells follow the selected experiment: each experiment keeps its own answers.
 */

import { DerivedProperty, DynamicProperty, Multilink, type TProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { GridBox, type Node, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox, RectangularPushButton } from "scenerystack/sun";
import BackwardAccelerationColors from "../../BackwardAccelerationColors.js";
import { StringManager } from "../../i18n/StringManager.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../BackwardAccelerationButtonOptions.js";
import { BACKWARD_ACCELERATION_CHECKBOX_OPTIONS } from "../BackwardAccelerationControlOptions.js";
import { BackwardAccelerationPanel } from "../BackwardAccelerationPanel.js";
import { EXPERIMENT_PRESETS, EXPERIMENTS } from "../model/Experiment.js";
import { type PhaseSigns, phaseSigns, Sign } from "../model/motionAnalysis.js";
import type { PredictionNotebook } from "../model/PredictionNotebook.js";
import type { RunLibrary } from "../model/RunLibrary.js";
import { type CellAnswer, SignTable } from "../model/SignTable.js";

const TITLE_FONT = new PhetFont({ size: SIGN_TABLE_NODE_SETTINGS.TITLE_FONT_SIZE, weight: "bold" });
const HEADER_FONT = new PhetFont(SIGN_TABLE_NODE_SETTINGS.HEADER_FONT_SIZE);
const CELL_FONT = new PhetFont({ size: SIGN_TABLE_NODE_SETTINGS.CELL_FONT_SIZE, weight: "bold" });
const MARK_FONT = new PhetFont({ size: SIGN_TABLE_NODE_SETTINGS.MARK_FONT_SIZE, weight: "bold" });
const CELL_WIDTH: number = SIGN_TABLE_NODE_SETTINGS.CELL_WIDTH;
const ROW_LABEL_WIDTH: number = SIGN_TABLE_NODE_SETTINGS.ROW_LABEL_WIDTH;
const HEADER_WIDTH: number = SIGN_TABLE_NODE_SETTINGS.HEADER_WIDTH;

export class SignTableNode extends BackwardAccelerationPanel {
  public readonly focusOrder: readonly Node[];

  public constructor(notebook: PredictionNotebook, runs: RunLibrary, width: number) {
    const labels = StringManager.getInstance().getLabels();
    const a11y = StringManager.getInstance().getControlsA11yStrings();
    const textFill = BackwardAccelerationColors.textColorProperty;

    const tableProperty = new DerivedProperty([runs.experimentProperty], (experiment) =>
      notebook.signTableFor(experiment),
    );
    const reversesProperty = new DerivedProperty(
      [runs.experimentProperty],
      (experiment) => EXPERIMENT_PRESETS[experiment].reverses,
    );

    const phaseNames: TReadOnlyProperty<string>[] = [
      [labels.movingUpStringProperty, labels.earlyPhaseStringProperty],
      [labels.turningPointStringProperty, labels.middlePhaseStringProperty],
      [labels.movingDownStringProperty, labels.latePhaseStringProperty],
    ].map(
      ([reversing, plain]) =>
        new DerivedProperty(
          [reversesProperty, reversing as TReadOnlyProperty<string>, plain as TReadOnlyProperty<string>],
          (reverses, r, p) => (reverses ? r : p),
        ),
    );

    const symbolFor = (answer: CellAnswer, plus: string, zero: string, minus: string, unanswered: string) =>
      answer === Sign.POSITIVE ? plus : answer === Sign.ZERO ? zero : answer === Sign.NEGATIVE ? minus : unanswered;
    const wordFor = (answer: CellAnswer, plus: string, zero: string, minus: string, unanswered: string) =>
      symbolFor(answer, plus, zero, minus, unanswered);

    // Measured signs of the current run (null when there is no usable run).
    let measured: PhaseSigns | null = null;
    const marks: Text[] = [];

    const cellNode = (
      row: "velocity" | "acceleration",
      phase: number,
      quantityName: TReadOnlyProperty<string>,
    ): { button: RectangularPushButton; mark: Text } => {
      const cellProperty: TProperty<CellAnswer> = new DynamicProperty<CellAnswer, CellAnswer, SignTable>(
        tableProperty,
        {
          derive: (table) =>
            (row === "velocity" ? table.velocityCells : table.accelerationCells)[phase] as TProperty<CellAnswer>,
          bidirectional: true,
        },
      );
      const symbol = new DerivedProperty(
        [
          cellProperty,
          labels.signPositiveStringProperty,
          labels.signZeroStringProperty,
          labels.signNegativeStringProperty,
          labels.signUnansweredStringProperty,
        ],
        symbolFor,
      );
      const accessibleName = new DerivedProperty(
        [
          cellProperty,
          quantityName,
          phaseNames[phase] as TReadOnlyProperty<string>,
          a11y.signCellPatternStringProperty,
          a11y.positiveStringProperty,
          a11y.zeroStringProperty,
          a11y.negativeStringProperty,
          a11y.unansweredStringProperty,
        ],
        (answer, quantity, phaseName, pattern, plus, zero, minus, unanswered) =>
          pattern
            .replace("{{quantity}}", quantity)
            .replace("{{phase}}", phaseName)
            .replace("{{answer}}", wordFor(answer, plus, zero, minus, unanswered)),
      );
      const button = new RectangularPushButton({
        ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
        content: new Text(symbol, { font: CELL_FONT, fill: LIGHT_SURFACE_TEXT_FILL }),
        minWidth: CELL_WIDTH,
        xMargin: SIGN_TABLE_NODE_SETTINGS.BUTTON_X_MARGIN,
        yMargin: SIGN_TABLE_NODE_SETTINGS.BUTTON_Y_MARGIN,
        accessibleName,
        accessibleHelpText: a11y.signCellHelpStringProperty,
        listener: () => SignTable.cycle(cellProperty),
      });
      const mark = new Text("", { font: MARK_FONT });
      return { button, mark };
    };

    // Phase names wrap onto two lines rather than shrink.
    const header = (property: TReadOnlyProperty<string>) =>
      new RichText(property, {
        font: HEADER_FONT,
        fill: textFill,
        lineWrap: HEADER_WIDTH,
        align: "center",
        maxHeight: SIGN_TABLE_NODE_SETTINGS.HEADER_MAX_HEIGHT,
      });

    const rows: { button: RectangularPushButton; mark: Text }[][] = [
      [0, 1, 2].map((phase) => cellNode("velocity", phase, labels.velocityStringProperty)),
      [0, 1, 2].map((phase) => cellNode("acceleration", phase, labels.accelerationStringProperty)),
    ];

    const grid = new GridBox({
      xSpacing: SIGN_TABLE_NODE_SETTINGS.GRID_X_SPACING,
      ySpacing: SIGN_TABLE_NODE_SETTINGS.GRID_Y_SPACING,
      xAlign: "center",
      rows: [
        [null, ...phaseNames.map(header)],
        ...rows.map((cells, r) => [
          new RichText(r === 0 ? labels.velocityStringProperty : labels.accelerationStringProperty, {
            font: HEADER_FONT,
            fill: textFill,
            lineWrap: ROW_LABEL_WIDTH + SIGN_TABLE_NODE_SETTINGS.GRID_LINE_WRAP_OFFSET,
            maxWidth: ROW_LABEL_WIDTH + SIGN_TABLE_NODE_SETTINGS.GRID_MAX_WIDTH_OFFSET,
            layoutOptions: { xAlign: "left" },
          }),
          ...cells.map(
            ({ button, mark }) =>
              new VBox({ spacing: 0, children: [button, mark], excludeInvisibleChildrenFromBounds: false }),
          ),
        ]),
      ],
    });
    for (const row of rows) {
      for (const cell of row) {
        marks.push(cell.mark);
      }
    }

    const checkProperty = new DynamicProperty<boolean, boolean, SignTable>(tableProperty, {
      derive: (table) => table.checkProperty,
      bidirectional: true,
    });
    const checkbox = new Checkbox(
      checkProperty,
      new Text(labels.checkAnswersStringProperty, {
        font: new PhetFont(SIGN_TABLE_NODE_SETTINGS.CHECKBOX_FONT_SIZE),
        fill: textFill,
        maxWidth: width - SIGN_TABLE_NODE_SETTINGS.CHECKBOX_MAX_WIDTH_OFFSET,
      }),
      BACKWARD_ACCELERATION_CHECKBOX_OPTIONS,
    );
    const noRunText = new Text(labels.noRunToCheckStringProperty, {
      font: new PhetFont(SIGN_TABLE_NODE_SETTINGS.NO_RUN_TEXT_FONT_SIZE),
      fill: BackwardAccelerationColors.warningColorProperty,
      maxWidth: width - SIGN_TABLE_NODE_SETTINGS.NO_RUN_TEXT_MAX_WIDTH_OFFSET,
    });

    super(
      new VBox({
        align: "left",
        spacing: SIGN_TABLE_NODE_SETTINGS.CONSTRUCTOR_SPACING,
        children: [
          new Text(labels.signTableStringProperty, {
            font: TITLE_FONT,
            fill: textFill,
            maxWidth: width - SIGN_TABLE_NODE_SETTINGS.CONSTRUCTOR_MAX_WIDTH_OFFSET,
          }),
          grid,
          checkbox,
          noRunText,
        ],
      }),
      { minWidth: width, maxWidth: width, isDisposable: false },
    );

    const update = () => {
      const experiment = runs.experimentProperty.value;
      const series = runs.traceFor(experiment).trimmedSeries;
      measured = phaseSigns(series.velocities, series.accelerations, EXPERIMENT_PRESETS[experiment].reverses);
      const checking = checkProperty.value;
      noRunText.visible = checking && measured === null;
      const table = tableProperty.value;
      const answers = [...table.velocityCells, ...table.accelerationCells].map((cell) => cell.value);
      const truth = measured === null ? null : [...measured.velocity, ...measured.acceleration];
      marks.forEach((mark, i) => {
        const answer = answers[i] ?? null;
        if (!checking || truth === null || answer === null) {
          mark.string = "";
          return;
        }
        const right = answer === truth[i];
        mark.string = right ? "✓" : "✗";
        mark.fill = right
          ? BackwardAccelerationColors.correctColorProperty
          : BackwardAccelerationColors.incorrectColorProperty;
      });
    };
    runs.dataChangedEmitter.addListener(update);
    Multilink.multilink([runs.experimentProperty, checkProperty], update);
    for (const experiment of EXPERIMENTS) {
      const table = notebook.signTableFor(experiment);
      for (const cell of [...table.velocityCells, ...table.accelerationCells]) {
        cell.lazyLink(update);
      }
    }

    this.focusOrder = [...rows.flat().map((cell) => cell.button), checkbox];
  }
}
