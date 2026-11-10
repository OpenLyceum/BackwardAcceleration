/**
 * LabScreen.ts
 *
 * The Lab screen: the handout's five experiments with a virtual Smart Cart.
 * Registered in src/main.ts; its icons come from createLabIcon() in
 * src/common/BackwardAccelerationScreenIcons.ts.
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import BackwardAccelerationColors from "../BackwardAccelerationColors.js";
import { createLabIcon } from "../common/BackwardAccelerationScreenIcons.js";
import type { PredictionNotebook } from "../common/model/PredictionNotebook.js";
import type { SmoothingWindows } from "../common/model/Trace.js";
import { LabModel } from "./model/LabModel.js";
import { LabKeyboardHelpContent } from "./view/LabKeyboardHelpContent.js";
import { LabScreenView } from "./view/LabScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type LabScreenOptions = ScreenOptions & {
  tandem: Tandem;
  /** Predictions and sign tables, shared with the Smart Cart screen. */
  notebook: PredictionNotebook;
  /** Derivative smoothing from Preferences. */
  smoothing: SmoothingWindows;
};

export class LabScreen extends Screen<LabModel, LabScreenView> {
  public constructor(options: LabScreenOptions) {
    super(
      () => new LabModel(options.notebook, options.smoothing),
      (model) =>
        new LabScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<LabScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: BackwardAccelerationColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new LabKeyboardHelpContent(),
          homeScreenIcon: createLabIcon(),
          navigationBarIcon: createLabIcon(),
        },
        options,
      ),
    );
  }
}
