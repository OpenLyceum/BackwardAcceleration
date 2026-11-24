import { RECORDING_PANEL_SETTINGS } from "../../BackwardAccelerationConstants.js";
/**
 * RecordingPanel.ts
 *
 * Record / Stop for a Smart Cart run of the selected experiment, Clear, and the
 * trim controls: show the whole recording (with draggable release and catch
 * markers) or only release → catch, and re-run the automatic search.
 */

import { DerivedProperty, Multilink } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, type Node, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox, RectangularPushButton } from "scenerystack/sun";
import BackwardAccelerationColors from "../../BackwardAccelerationColors.js";
import {
  FLAT_PANEL_PUSH_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../../common/BackwardAccelerationButtonOptions.js";
import { BACKWARD_ACCELERATION_CHECKBOX_OPTIONS } from "../../common/BackwardAccelerationControlOptions.js";
import { BackwardAccelerationPanel } from "../../common/BackwardAccelerationPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { SmartCartModel } from "../model/SmartCartModel.js";

const FONT = new PhetFont(RECORDING_PANEL_SETTINGS.FONT_SIZE);
const BUTTON_FONT = new PhetFont({ size: RECORDING_PANEL_SETTINGS.BUTTON_FONT_SIZE, weight: "bold" });

export class RecordingPanel extends BackwardAccelerationPanel {
  public readonly focusOrder: readonly Node[];

  public constructor(model: SmartCartModel, width: number) {
    const labels = StringManager.getInstance().getLabels();
    const a11y = StringManager.getInstance().getControlsA11yStrings();
    const innerWidth = width - 24;
    const fill = BackwardAccelerationColors.textColorProperty;

    const recordLabelProperty = new DerivedProperty(
      [model.isRecordingProperty, labels.recordStringProperty, labels.stopRecordingStringProperty],
      (recording, record, stop) => (recording ? stop : record),
    );
    const recordButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      baseColor: BackwardAccelerationColors.incorrectColorProperty,
      content: new Text(recordLabelProperty, {
        font: BUTTON_FONT,
        fill: BackwardAccelerationColors.accentButtonTextColorProperty,
        maxWidth: RECORDING_PANEL_SETTINGS.RECORD_BUTTON_MAX_WIDTH,
      }),
      enabledProperty: model.canRecordProperty,
      accessibleName: a11y.recordStringProperty,
      listener: () => (model.isRecordingProperty.value ? model.stop() : model.record()),
    });
    const clearButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(labels.clearRunStringProperty, {
        font: FONT,
        fill: LIGHT_SURFACE_TEXT_FILL,
        maxWidth: RECORDING_PANEL_SETTINGS.CLEAR_BUTTON_MAX_WIDTH,
      }),
      listener: () => model.clear(),
    });

    const recordingText = new Text("", { font: FONT, fill, maxWidth: innerWidth });
    const updateRecordingText = () => {
      recordingText.string = model.isRecordingProperty.value
        ? StringUtils.fillIn(labels.recordingPatternStringProperty.value, {
            value: toFixed(model.runs.currentTrace.duration, 1),
          })
        : "";
    };
    model.runs.dataChangedEmitter.addListener(updateRecordingText);
    Multilink.multilink([model.isRecordingProperty, labels.recordingPatternStringProperty], updateRecordingText);

    const fullRecordingCheckbox = new Checkbox(
      model.runs.showFullRecordingProperty,
      new Text(labels.showFullRecordingStringProperty, {
        font: FONT,
        fill,
        maxWidth: innerWidth - RECORDING_PANEL_SETTINGS.FULL_RECORDING_CHECKBOX_MAX_WIDTH_OFFSET,
      }),
      BACKWARD_ACCELERATION_CHECKBOX_OPTIONS,
    );
    const autoTrimButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(labels.autoTrimStringProperty, {
        font: FONT,
        fill: LIGHT_SURFACE_TEXT_FILL,
        maxWidth: innerWidth - RECORDING_PANEL_SETTINGS.AUTO_TRIM_BUTTON_MAX_WIDTH_OFFSET,
      }),
      enabledProperty: new DerivedProperty([model.isRecordingProperty], (recording) => !recording),
      listener: () => model.autoTrim(),
    });
    const trimHint = new RichText(labels.trimHintStringProperty, {
      font: new PhetFont(RECORDING_PANEL_SETTINGS.TRIM_HINT_FONT_SIZE),
      fill,
      lineWrap: innerWidth,
    });
    model.runs.showFullRecordingProperty.link((full) => {
      trimHint.visible = full;
    });
    const trimFailed = new RichText(labels.trimFailedStringProperty, {
      font: new PhetFont(RECORDING_PANEL_SETTINGS.TRIM_FAILED_FONT_SIZE),
      fill: BackwardAccelerationColors.warningColorProperty,
      lineWrap: innerWidth,
    });
    model.trimFailedProperty.link((failed) => {
      trimFailed.visible = failed;
    });

    super(
      new VBox({
        align: "left",
        spacing: RECORDING_PANEL_SETTINGS.SPACING,
        children: [
          new HBox({ spacing: RECORDING_PANEL_SETTINGS.ITEM_1_SPACING, children: [recordButton, clearButton] }),
          recordingText,
          trimFailed,
          fullRecordingCheckbox,
          autoTrimButton,
          trimHint,
        ],
      }),
      { minWidth: width, maxWidth: width, isDisposable: false },
    );

    this.focusOrder = [recordButton, clearButton, fullRecordingCheckbox, autoTrimButton];
  }
}
