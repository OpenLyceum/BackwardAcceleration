/**
 * SmartCartScreenSummaryContent.ts
 *
 * The accessible screen summary of the Smart Cart screen. "Current details" is
 * live: the experiment, whether a cart is connected, and the last run's length.
 */

import { DerivedProperty, NumberProperty } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { ScreenSummaryContent } from "scenerystack/sim";
import { StringManager } from "../../i18n/StringManager.js";
import { ConnectionState } from "../model/SmartCartChannel.js";
import type { SmartCartModel } from "../model/SmartCartModel.js";

export class SmartCartScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: SmartCartModel) {
    const a11y = StringManager.getInstance().getSmartCartA11yStrings();

    // Updated after each run (not every sample) so the summary does not churn while recording.
    const runDurationProperty = new NumberProperty(0);
    const updateDuration = () => {
      if (!model.isRecordingProperty.value) {
        runDurationProperty.value = model.runs.currentTrace.trimmedSeries.times.at(-1) ?? 0;
      }
    };
    model.runs.dataChangedEmitter.addListener(updateDuration);
    model.runs.experimentProperty.lazyLink(updateDuration);
    model.isRecordingProperty.lazyLink(updateDuration);

    const currentDetailsProperty = new DerivedProperty(
      [
        a11y.currentDetailsPatternStringProperty,
        model.runs.experimentProperty,
        model.cart.connectionStateProperty,
        a11y.connectedStringProperty,
        a11y.disconnectedStringProperty,
        runDurationProperty,
        a11y.noRunStringProperty,
        a11y.runPatternStringProperty,
      ],
      (pattern, experiment, connection, connected, disconnected, duration, noRun, runPattern) =>
        pattern
          .replace("{{experiment}}", experiment)
          .replace("{{connection}}", connection === ConnectionState.CONNECTED ? connected : disconnected)
          .replace("{{run}}", duration > 0 ? runPattern.replace("{{value}}", toFixed(duration, 1)) : noRun),
    );

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: currentDetailsProperty,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
