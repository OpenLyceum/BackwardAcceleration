/**
 * LabSetupPanel.ts
 *
 * The virtual track's set-up, as the handout describes it: incline height (track
 * feet, in cm), the tape brake, which way the cart's +x arrow points, and how the
 * cart starts — released from rest, or pushed toward +x or −x and let go at a
 * chosen speed. Choosing an experiment loads all of these; any can be changed.
 */

import { DerivedProperty, NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { HBox, type Node, Text, VBox } from "scenerystack/scenery";
import { NumberControl, PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, Checkbox } from "scenerystack/sun";
import BackwardAccelerationColors from "../../BackwardAccelerationColors.js";
import {
  MAX_INCLINE_HEIGHT,
  MAX_PUSH_SPEED,
  MIN_INCLINE_HEIGHT,
  MIN_PUSH_SPEED,
} from "../../BackwardAccelerationConstants.js";
import {
  BACKWARD_ACCELERATION_CHECKBOX_OPTIONS,
  BACKWARD_ACCELERATION_NUMBER_CONTROL_OPTIONS,
} from "../../common/BackwardAccelerationControlOptions.js";
import { BackwardAccelerationPanel } from "../../common/BackwardAccelerationPanel.js";
import { LaunchMode, type LaunchModeValue } from "../../common/model/Experiment.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { LabModel } from "../model/LabModel.js";

const TITLE_FONT = new PhetFont({ size: 14, weight: "bold" });
const LABEL_FONT = new PhetFont(12);
const CM_PER_M = 100;

export class LabSetupPanel extends BackwardAccelerationPanel {
  public readonly focusOrder: readonly Node[];

  public constructor(model: LabModel, width: number) {
    const labels = StringManager.getInstance().getLabels();
    const a11y = StringManager.getInstance().getControlsA11yStrings();
    const innerWidth = width - 24;
    const fill = BackwardAccelerationColors.textColorProperty;
    const text = (property: typeof labels.brakeStringProperty, maxWidth = innerWidth - 28) =>
      new Text(property, { font: LABEL_FONT, fill, maxWidth });

    // Students think of the feet in centimetres; the model is in metres.
    const heightCmProperty = new NumberProperty(model.inclineHeightProperty.value * CM_PER_M, {
      range: new Range(MIN_INCLINE_HEIGHT * CM_PER_M, MAX_INCLINE_HEIGHT * CM_PER_M),
    });
    let syncing = false;
    model.inclineHeightProperty.lazyLink((metres) => {
      if (!syncing) {
        syncing = true;
        heightCmProperty.value = metres * CM_PER_M;
        syncing = false;
      }
    });
    heightCmProperty.lazyLink((cm) => {
      if (!syncing) {
        syncing = true;
        model.inclineHeightProperty.value = cm / CM_PER_M;
        syncing = false;
      }
    });

    const heightControl = new NumberControl(
      labels.inclineHeightStringProperty,
      heightCmProperty,
      heightCmProperty.range,
      {
        ...BACKWARD_ACCELERATION_NUMBER_CONTROL_OPTIONS,
        delta: 1,
        titleNodeOptions: { font: LABEL_FONT, fill, maxWidth: innerWidth - 70 },
        numberDisplayOptions: {
          valuePattern: labels.centimetresPatternStringProperty,
          decimalPlaces: 0,
          textOptions: { font: LABEL_FONT },
        },
        sliderOptions: {
          ...BACKWARD_ACCELERATION_NUMBER_CONTROL_OPTIONS.sliderOptions,
          keyboardStep: 1,
          constrainValue: (value: number) => Math.round(value),
          majorTicks: [0, 4, 8].map((value) => ({ value })),
          majorTickStroke: fill,
        },
        accessibleName: a11y.inclineHeightStringProperty,
      },
    );

    const brakeCheckbox = new Checkbox(model.brakeProperty, text(labels.brakeStringProperty), {
      ...BACKWARD_ACCELERATION_CHECKBOX_OPTIONS,
      accessibleName: a11y.brakeStringProperty,
    });

    const radioOptions = { orientation: "vertical" as const, spacing: 4, radioButtonOptions: { radius: 7 } };

    const arrowGroup = new AquaRadioButtonGroup<boolean>(
      model.arrowDownTrackProperty,
      [
        { value: true, createNode: () => text(labels.downTrackStringProperty), tandemName: "downTrackRadioButton" },
        { value: false, createNode: () => text(labels.upTrackStringProperty), tandemName: "upTrackRadioButton" },
      ],
      { ...radioOptions, accessibleName: a11y.arrowDirectionStringProperty },
    );

    const launchGroup = new AquaRadioButtonGroup<LaunchModeValue>(
      model.launchModeProperty,
      [
        {
          value: LaunchMode.RELEASE,
          createNode: () => text(labels.releaseFromRestStringProperty),
          tandemName: "releaseRadioButton",
        },
        { value: LaunchMode.PUSH, createNode: () => text(labels.pushStringProperty), tandemName: "pushRadioButton" },
      ],
      { ...radioOptions, accessibleName: a11y.startModeStringProperty },
    );

    const pushEnabledProperty = new DerivedProperty([model.launchModeProperty], (mode) => mode === LaunchMode.PUSH);

    const pushDirectionGroup = new AquaRadioButtonGroup<boolean>(
      model.pushTowardPlusXProperty,
      [
        { value: true, createNode: () => text(labels.towardPlusXStringProperty, 30), tandemName: "plusXRadioButton" },
        {
          value: false,
          createNode: () => text(labels.towardMinusXStringProperty, 30),
          tandemName: "minusXRadioButton",
        },
      ],
      {
        orientation: "horizontal",
        spacing: 12,
        radioButtonOptions: { radius: 7 },
        enabledProperty: pushEnabledProperty,
        accessibleName: a11y.pushDirectionStringProperty,
      },
    );

    const pushSpeedControl = new NumberControl(
      labels.pushSpeedStringProperty,
      model.pushSpeedProperty,
      new Range(MIN_PUSH_SPEED, MAX_PUSH_SPEED),
      {
        ...BACKWARD_ACCELERATION_NUMBER_CONTROL_OPTIONS,
        delta: 0.05,
        enabledProperty: pushEnabledProperty,
        titleNodeOptions: { font: LABEL_FONT, fill, maxWidth: innerWidth - 80 },
        numberDisplayOptions: {
          valuePattern: labels.speedPatternStringProperty,
          decimalPlaces: 2,
          textOptions: { font: LABEL_FONT },
        },
        sliderOptions: {
          ...BACKWARD_ACCELERATION_NUMBER_CONTROL_OPTIONS.sliderOptions,
          keyboardStep: 0.05,
          constrainValue: (value: number) => Math.round(value * 20) / 20,
        },
        accessibleName: a11y.pushSpeedStringProperty,
      },
    );

    const velocityVectorCheckbox = new Checkbox(
      model.showVelocityVectorProperty,
      new Text(labels.velocityVectorStringProperty, {
        font: LABEL_FONT,
        fill: BackwardAccelerationColors.velocityVectorColorProperty,
        maxWidth: innerWidth - 28,
      }),
      BACKWARD_ACCELERATION_CHECKBOX_OPTIONS,
    );
    const accelerationVectorCheckbox = new Checkbox(
      model.showAccelerationVectorProperty,
      new Text(labels.accelerationVectorStringProperty, {
        font: LABEL_FONT,
        fill: BackwardAccelerationColors.accelerationVectorColorProperty,
        maxWidth: innerWidth - 28,
      }),
      BACKWARD_ACCELERATION_CHECKBOX_OPTIONS,
    );

    const heading = (property: typeof labels.arrowDirectionStringProperty) =>
      new Text(property, { font: new PhetFont({ size: 12, weight: "bold" }), fill, maxWidth: innerWidth });

    super(
      new VBox({
        align: "left",
        spacing: 6,
        children: [
          new Text(labels.setUpStringProperty, { font: TITLE_FONT, fill, maxWidth: innerWidth }),
          heightControl,
          brakeCheckbox,
          heading(labels.arrowDirectionStringProperty),
          arrowGroup,
          heading(labels.startStringProperty),
          launchGroup,
          new HBox({
            spacing: 8,
            children: [text(labels.pushTowardStringProperty, innerWidth - 90), pushDirectionGroup],
          }),
          pushSpeedControl,
          velocityVectorCheckbox,
          accelerationVectorCheckbox,
        ],
      }),
      { minWidth: width, maxWidth: width, isDisposable: false },
    );

    this.focusOrder = [
      heightControl,
      brakeCheckbox,
      arrowGroup,
      launchGroup,
      pushDirectionGroup,
      pushSpeedControl,
      velocityVectorCheckbox,
      accelerationVectorCheckbox,
    ];
  }
}
