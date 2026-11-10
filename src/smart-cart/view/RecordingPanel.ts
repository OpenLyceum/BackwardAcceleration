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

const FONT = new PhetFont(12);
const BUTTON_FONT = new PhetFont({ size: 14, weight: "bold" });

export class RecordingPanel extends BackwardAccelerationPanel {
  public readonly focusOrder: readonly Node[];

  public constructor(model: SmartCartModel, width: number) {
    const labels = StringManager.getInstance().getLabels();
    const a11y = StringManager.getInstance().getControlsA11yStrings();
    const innerWidth = width - 24;
    const fill = BackwardAccelerationColors.textColorProperty;

    const recordLabel = new DerivedProperty(
      [model.isRecordingProperty, labels.recordStringProperty, labels.stopRecordingStringProperty],
      (recording, record, stop) => (recording ? stop : record),
    );
    const recordButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      baseColor: BackwardAccelerationColors.incorrectColorProperty,
      content: new Text(recordLabel, { font: BUTTON_FONT, fill: "white", maxWidth: 90 }),
      enabledProperty: model.canRecordProperty,
      accessibleName: a11y.recordStringProperty,
      listener: () => (model.isRecordingProperty.value ? model.stop() : model.record()),
    });
    const clearButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(labels.clearRunStringProperty, { font: FONT, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 90 }),
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
      new Text(labels.showFullRecordingStringProperty, { font: FONT, fill, maxWidth: innerWidth - 30 }),
      BACKWARD_ACCELERATION_CHECKBOX_OPTIONS,
    );
    const autoTrimButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(labels.autoTrimStringProperty, {
        font: FONT,
        fill: LIGHT_SURFACE_TEXT_FILL,
        maxWidth: innerWidth - 20,
      }),
      enabledProperty: new DerivedProperty([model.isRecordingProperty], (recording) => !recording),
      listener: () => model.autoTrim(),
    });
    const trimHint = new RichText(labels.trimHintStringProperty, {
      font: new PhetFont(11),
      fill,
      lineWrap: innerWidth,
    });
    model.runs.showFullRecordingProperty.link((full) => {
      trimHint.visible = full;
    });
    const trimFailed = new RichText(labels.trimFailedStringProperty, {
      font: new PhetFont(11),
      fill: BackwardAccelerationColors.warningColorProperty,
      lineWrap: innerWidth,
    });
    model.trimFailedProperty.link((failed) => {
      trimFailed.visible = failed;
    });

    super(
      new VBox({
        align: "left",
        spacing: 6,
        children: [
          new HBox({ spacing: 8, children: [recordButton, clearButton] }),
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
