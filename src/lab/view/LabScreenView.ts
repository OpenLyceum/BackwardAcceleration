/**
 * LabScreenView.ts
 *
 * The Lab screen: a virtual Smart Cart on a track, laid out in three columns
 * above the bench.
 *
 *   left    experiment chooser and track set-up
 *   middle  predictions, sign table, and the run buttons with the clock
 *   right   v–t and a–t graphs
 *   bottom  the track and cart (true to scale), live readouts, Reset All
 */

import { DerivedProperty, EnumerationProperty, PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { HBox, Node, Text, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton, TimeControlNode, TimeSpeed } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { RectangularPushButton } from "scenerystack/sun";
import BackwardAccelerationColors from "../../BackwardAccelerationColors.js";
import { CONTROL_PANEL_WIDTH, MIDDLE_COLUMN_WIDTH, SCREEN_VIEW_MARGIN } from "../../BackwardAccelerationConstants.js";
import {
  FLAT_PANEL_PUSH_BUTTON_OPTIONS,
  FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
  TIME_CONTROL_SPEED_RADIO_OPTIONS,
} from "../../common/BackwardAccelerationButtonOptions.js";
import { BackwardAccelerationPanel } from "../../common/BackwardAccelerationPanel.js";
import { LaunchMode } from "../../common/model/Experiment.js";
import { ExperimentPanel } from "../../common/view/ExperimentPanel.js";
import { GraphArea } from "../../common/view/GraphArea.js";
import { PredictionsPanel } from "../../common/view/PredictionsPanel.js";
import { SignTableNode } from "../../common/view/SignTableNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import { type LabModel, RunState } from "../model/LabModel.js";
import { createRunStatusProperty } from "./createRunStatusProperty.js";
import { LabScreenSummaryContent } from "./LabScreenSummaryContent.js";
import { LabSetupPanel } from "./LabSetupPanel.js";
import { TrackNode } from "./TrackNode.js";

export type LabScreenViewOptions = ScreenViewOptions;

const COLUMN_SPACING = 10;
const BUTTON_FONT = new PhetFont({ size: 14, weight: "bold" });
const READOUT_FONT = new PhetFont(13);
const STATUS_FONT = new PhetFont(13);

export class LabScreenView extends ScreenView {
  public constructor(model: LabModel, providedOptions?: LabScreenViewOptions) {
    const options = optionize<LabScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new LabScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const labels = StringManager.getInstance().getLabels();
    const a11y = StringManager.getInstance().getControlsA11yStrings();
    const bounds = this.layoutBounds;
    const top = bounds.minY + SCREEN_VIEW_MARGIN / 2;
    const left = bounds.minX + SCREEN_VIEW_MARGIN;

    // ComboBox lists must float above everything else.
    const listParent = new Node();

    // ── Left column ─────────────────────────────────────────────────────────────
    const experimentPanel = new ExperimentPanel(model.runs, listParent, CONTROL_PANEL_WIDTH);
    const setupPanel = new LabSetupPanel(model, CONTROL_PANEL_WIDTH);
    const leftColumn = new VBox({
      spacing: COLUMN_SPACING,
      align: "left",
      children: [experimentPanel, setupPanel],
      left,
      top,
    });

    // ── Right column: graphs ─────────────────────────────────────────────────────
    const graphArea = new GraphArea(model.runs, model.notebook);
    graphArea.right = bounds.maxX - SCREEN_VIEW_MARGIN / 2;
    graphArea.top = top;

    // ── Middle column ───────────────────────────────────────────────────────────
    const predictionsPanel = new PredictionsPanel(model.notebook, model.runs, MIDDLE_COLUMN_WIDTH);
    const signTable = new SignTableNode(model.notebook, model.runs, MIDDLE_COLUMN_WIDTH);

    const goLabel = new DerivedProperty(
      [model.launchModeProperty, labels.releaseStringProperty, labels.letGoStringProperty],
      (mode, release, push) => (mode === LaunchMode.PUSH ? push : release),
    );
    const buttonText = (property: typeof labels.catchStringProperty, maxWidth: number) =>
      new Text(property, { font: BUTTON_FONT, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth });
    const goButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      baseColor: BackwardAccelerationColors.measuredColorProperty,
      content: new Text(goLabel, { font: BUTTON_FONT, fill: "white", maxWidth: 80 }),
      enabledProperty: new DerivedProperty([model.runStateProperty], (state) => state !== RunState.RUNNING),
      accessibleName: a11y.goStringProperty,
      listener: () => model.go(),
    });
    const catchButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: buttonText(labels.catchStringProperty, 70),
      enabledProperty: new DerivedProperty([model.runStateProperty], (state) => state === RunState.RUNNING),
      accessibleName: a11y.catchStringProperty,
      listener: () => model.stop(),
    });
    const returnButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: buttonText(labels.returnCartStringProperty, MIDDLE_COLUMN_WIDTH - 30),
      accessibleName: a11y.returnCartStringProperty,
      listener: () => model.returnCart(),
    });

    // TimeControlNode speaks TimeSpeed; the model keeps a plain slow-motion flag.
    const timeSpeedProperty = new EnumerationProperty(TimeSpeed.NORMAL, {
      validValues: [TimeSpeed.NORMAL, TimeSpeed.SLOW],
    });
    timeSpeedProperty.link((speed) => {
      model.slowMotionProperty.value = speed === TimeSpeed.SLOW;
    });
    model.slowMotionProperty.link((slow) => {
      timeSpeedProperty.value = slow ? TimeSpeed.SLOW : TimeSpeed.NORMAL;
    });
    const timeControl = new TimeControlNode(model.isPlayingProperty, {
      timeSpeedProperty,
      timeSpeeds: [TimeSpeed.NORMAL, TimeSpeed.SLOW],
      ...TIME_CONTROL_SPEED_RADIO_OPTIONS,
      playPauseStepButtonOptions: {
        ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
        stepForwardButtonOptions: {
          ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS.stepForwardButtonOptions,
          listener: () => model.stepOnce(),
        },
      },
      scale: 0.85,
    });

    const readout = (
      pattern: typeof labels.timeReadoutPatternStringProperty,
      value: TReadOnlyProperty<number>,
      decimals: number,
    ) =>
      new Text(
        new PatternStringProperty(pattern, { value }, { maps: { value: (v: number) => toFixed(v, decimals) } }),
        { font: READOUT_FONT, fill: BackwardAccelerationColors.textColorProperty, maxWidth: 120 },
      );
    const readouts = new VBox({
      align: "left",
      spacing: 3,
      children: [
        readout(labels.timeReadoutPatternStringProperty, model.runTimeProperty, 2),
        readout(labels.positionReadoutPatternStringProperty, model.positionXProperty, 3),
        readout(labels.velocityReadoutPatternStringProperty, model.velocityXProperty, 2),
        readout(labels.accelerationReadoutPatternStringProperty, model.accelerationXProperty, 2),
      ],
    });

    const runControls = new BackwardAccelerationPanel(
      new VBox({
        spacing: 8,
        children: [new HBox({ spacing: 8, children: [goButton, catchButton] }), returnButton, timeControl, readouts],
      }),
      { minWidth: MIDDLE_COLUMN_WIDTH, maxWidth: MIDDLE_COLUMN_WIDTH },
    );

    const middleColumn = new VBox({
      spacing: COLUMN_SPACING,
      align: "left",
      children: [predictionsPanel, signTable, runControls],
      left: leftColumn.right + COLUMN_SPACING,
      top,
    });

    // ── Bottom: the bench ───────────────────────────────────────────────────────
    const trackNode = new TrackNode(model);
    trackNode.left = middleColumn.right + COLUMN_SPACING;
    trackNode.bottom = bounds.maxY - SCREEN_VIEW_MARGIN;

    const statusText = new Text(createRunStatusProperty(model), {
      font: STATUS_FONT,
      fill: BackwardAccelerationColors.textColorProperty,
    });
    statusText.maxWidth = bounds.maxX - SCREEN_VIEW_MARGIN - (middleColumn.right + COLUMN_SPACING);

    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        model.notebook.reset();
        timeSpeedProperty.reset();
      },
      right: bounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: bounds.maxY - SCREEN_VIEW_MARGIN,
    });

    statusText.left = middleColumn.right + COLUMN_SPACING + 4;
    statusText.top = graphArea.bottom + 4;

    this.children = [
      leftColumn,
      middleColumn,
      graphArea,
      statusText,
      trackNode,
      resetAllButton,
      listParent,
      new Node({
        pdomOrder: [
          experimentPanel.comboBox,
          ...setupPanel.focusOrder,
          trackNode.cartNode,
          goButton,
          catchButton,
          returnButton,
          timeControl,
          ...predictionsPanel.focusOrder,
          ...graphArea.focusOrder,
          ...signTable.focusOrder,
          resetAllButton,
        ],
      }),
    ];
  }
}
