/**
 * BackwardAccelerationPreferencesModel.ts
 *
 * Simulation-specific preferences shown in Preferences → Simulation: how much
 * smoothing turns position into velocity and velocity into acceleration. Real
 * encoder data is noisy once differentiated twice, so a teacher may want a wider
 * acceleration window; the virtual cart uses the same setting so both screens
 * show the same kind of trace. Initial values come from the query parameters of
 * the same names.
 */

import { NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { Tandem } from "scenerystack/tandem";
import BackwardAccelerationNamespace from "../BackwardAccelerationNamespace.js";
import type { SmoothingWindows } from "../common/model/Trace.js";
import backwardAccelerationQueryParameters from "./backwardAccelerationQueryParameters.js";

/** The acceleration-smoothing choices offered in the dialog, in samples. */
export const ACCELERATION_WINDOW_CHOICES = [5, 11, 21] as const;

export class BackwardAccelerationPreferencesModel implements SmoothingWindows {
  public readonly velocityWindowProperty: NumberProperty;
  public readonly accelerationWindowProperty: NumberProperty;

  public constructor(tandem?: Tandem) {
    this.velocityWindowProperty = new NumberProperty(backwardAccelerationQueryParameters.velocityWindow, {
      range: new Range(3, 41),
      numberType: "Integer",
      ...(tandem && { tandem: tandem.createTandem("velocityWindowProperty") }),
    });
    this.accelerationWindowProperty = new NumberProperty(backwardAccelerationQueryParameters.accelerationWindow, {
      range: new Range(3, 41),
      numberType: "Integer",
      ...(tandem && { tandem: tandem.createTandem("accelerationWindowProperty") }),
    });
  }

  public reset(): void {
    this.velocityWindowProperty.reset();
    this.accelerationWindowProperty.reset();
  }

  public dispose(): void {
    this.velocityWindowProperty.dispose();
    this.accelerationWindowProperty.dispose();
  }
}

BackwardAccelerationNamespace.register("BackwardAccelerationPreferencesModel", BackwardAccelerationPreferencesModel);
