/**
 * BackwardAccelerationPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation: the acceleration
 * smoothing (light / medium / heavy) applied to both the virtual cart and the
 * Smart Cart. Bound to BackwardAccelerationPreferencesModel.
 */

import { Property } from "scenerystack/axon";
import { RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import BackwardAccelerationColors from "../BackwardAccelerationColors.js";
import BackwardAccelerationNamespace from "../BackwardAccelerationNamespace.js";
import { StringManager } from "../i18n/StringManager.js";
import {
  ACCELERATION_WINDOW_CHOICES,
  type BackwardAccelerationPreferencesModel,
} from "./BackwardAccelerationPreferencesModel.js";

const LABEL_FONT = new PhetFont(14);

export class BackwardAccelerationPreferencesNode extends VBox {
  public constructor(preferencesModel: BackwardAccelerationPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    // The Preferences dialog is always white, so use the dark "light control surface"
    // colors (readable on white in both default and projector profiles).
    const fill = BackwardAccelerationColors.controlSurfaceTextColorProperty;

    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: 18, weight: "bold" }),
      fill,
    });
    const smoothingLabel = new Text(prefStrings.accelerationSmoothingStringProperty, {
      font: new PhetFont({ size: 14, weight: "bold" }),
      fill,
    });
    const description = new RichText(prefStrings.accelerationSmoothingDescriptionStringProperty, {
      font: new PhetFont(12),
      fill,
      lineWrap: 420,
    });

    // The model property is a free integer (query parameters may set any odd window); the
    // radio group needs one of its own values, so it drives a narrower view property.
    const nearest = (value: number) =>
      ACCELERATION_WINDOW_CHOICES.reduce((best, choice) =>
        Math.abs(choice - value) < Math.abs(best - value) ? choice : best,
      );
    const choiceProperty = new Property<number>(nearest(preferencesModel.accelerationWindowProperty.value));
    choiceProperty.lazyLink((choice) => {
      preferencesModel.accelerationWindowProperty.value = choice;
    });

    const labels = [
      prefStrings.smoothingLightStringProperty,
      prefStrings.smoothingMediumStringProperty,
      prefStrings.smoothingHeavyStringProperty,
    ];
    const radioGroup = new AquaRadioButtonGroup(
      choiceProperty,
      ACCELERATION_WINDOW_CHOICES.map((value, index) => ({
        value,
        createNode: () =>
          new Text(labels[index] ?? prefStrings.smoothingMediumStringProperty, { font: LABEL_FONT, fill }),
        tandemName: `smoothing${value}RadioButton`,
      })),
      {
        orientation: "vertical",
        spacing: 6,
        radioButtonOptions: { stroke: fill },
        accessibleName: prefStrings.accelerationSmoothingStringProperty,
        ...(tandem && { tandem: tandem.createTandem("accelerationSmoothingRadioButtonGroup") }),
      },
    );

    super({
      align: "left",
      spacing: 10,
      children: [header, smoothingLabel, description, radioGroup],
    });
  }
}

BackwardAccelerationNamespace.register("BackwardAccelerationPreferencesNode", BackwardAccelerationPreferencesNode);
