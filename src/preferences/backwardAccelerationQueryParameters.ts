/**
 * backwardAccelerationQueryParameters.ts
 *
 * Sim-specific startup query parameters. This is the single place where every
 * sim-specific query parameter is declared and documented. Public-facing
 * parameters (intended for end users / sharing links) set `public: true`.
 *
 * Usage: append e.g. `?accelerationWindow=21` to the sim URL.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import { ACCELERATION_WINDOW, SAMPLE_PERIOD_MS, VELOCITY_WINDOW } from "../BackwardAccelerationConstants.js";
import BackwardAccelerationNamespace from "../BackwardAccelerationNamespace.js";

const isOddWindow = (value: number) => Number.isInteger(value) && value >= 3 && value <= 41 && value % 2 === 1;

const backwardAccelerationQueryParameters = QueryStringMachine.getAll({
  /**
   * Samples in the least-squares window that turns position into velocity (odd, 3–41).
   * Initial value of the Preferences → Simulation velocity smoothing.
   */
  velocityWindow: {
    type: "number",
    defaultValue: VELOCITY_WINDOW,
    isValidValue: isOddWindow,
    public: true,
  },

  /**
   * Samples in the least-squares window that turns velocity into acceleration (odd, 3–41).
   * Initial value of the Preferences → Simulation acceleration smoothing.
   */
  accelerationWindow: {
    type: "number",
    defaultValue: ACCELERATION_WINDOW,
    isValidValue: isOddWindow,
    public: true,
  },

  /** Smart Cart sample period in ms (10–100). The default, 20 ms, is PASCO's 50 Hz. */
  smartCartPeriod: {
    type: "number",
    defaultValue: SAMPLE_PERIOD_MS,
    isValidValue: (value: number) => Number.isInteger(value) && value >= 10 && value <= 100,
    public: true,
  },

  /** Shows raw stream statistics (counts, packets, missed packets, sample rate) under the Smart Cart status. */
  showDiagnostics: {
    type: "flag",
    public: true,
  },
});

BackwardAccelerationNamespace.register("backwardAccelerationQueryParameters", backwardAccelerationQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default backwardAccelerationQueryParameters;
