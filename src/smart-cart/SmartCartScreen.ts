/**
 * SmartCartScreen.ts
 *
 * The Smart Cart screen: the handout's experiments with a real PASCO Smart Cart
 * over Web Bluetooth. Registered in src/main.ts; its icons come from
 * createSmartCartIcon() in src/common/BackwardAccelerationScreenIcons.ts.
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import BackwardAccelerationColors from "../BackwardAccelerationColors.js";
import { createSmartCartIcon } from "../common/BackwardAccelerationScreenIcons.js";
import type { PredictionNotebook } from "../common/model/PredictionNotebook.js";
import type { SmoothingWindows } from "../common/model/Trace.js";
import { SmartCartModel } from "./model/SmartCartModel.js";
import { SmartCartKeyboardHelpContent } from "./view/SmartCartKeyboardHelpContent.js";
import { SmartCartScreenView } from "./view/SmartCartScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type SmartCartScreenOptions = ScreenOptions & {
  tandem: Tandem;
  /** Predictions and sign tables, shared with the Lab screen. */
  notebook: PredictionNotebook;
  /** Derivative smoothing from Preferences. */
  smoothing: SmoothingWindows;
};

export class SmartCartScreen extends Screen<SmartCartModel, SmartCartScreenView> {
  public constructor(options: SmartCartScreenOptions) {
    super(
      () => new SmartCartModel(options.notebook, options.smoothing),
      (model) =>
        new SmartCartScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<SmartCartScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: BackwardAccelerationColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new SmartCartKeyboardHelpContent(),
          homeScreenIcon: createSmartCartIcon(),
          navigationBarIcon: createSmartCartIcon(),
        },
        options,
      ),
    );
  }
}
