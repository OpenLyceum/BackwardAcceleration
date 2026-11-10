/**
 * LabScreenSummaryContent.ts
 *
 * The accessible screen summary of the Lab screen. Its "current details" paragraph
 * is live: the experiment, the incline height, the brake, and what the cart is doing.
 */

import { DerivedProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { StringManager } from "../../i18n/StringManager.js";
import type { LabModel } from "../model/LabModel.js";
import { createRunStatusProperty } from "./createRunStatusProperty.js";

export class LabScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: LabModel) {
    const strings = StringManager.getInstance();
    const a11y = strings.getLabA11yStrings();

    const statusProperty = createRunStatusProperty(model);

    const currentDetailsProperty = new DerivedProperty(
      [
        a11y.currentDetailsPatternStringProperty,
        model.runs.experimentProperty,
        model.inclineHeightProperty,
        model.brakeProperty,
        a11y.brakeOnStringProperty,
        a11y.brakeOffStringProperty,
        statusProperty,
      ],
      (pattern, experiment, height, brake, on, off, status) =>
        pattern
          .replace("{{experiment}}", experiment)
          .replace("{{height}}", (height * 100).toFixed(0))
          .replace("{{brake}}", brake ? on : off)
          .replace("{{status}}", status),
    );

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: currentDetailsProperty,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
