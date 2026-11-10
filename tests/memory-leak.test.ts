/**
 * Memory-leak regression suite (fleet standard).
 *
 * Every model object that links Properties or adds listeners, with a factory that
 * builds a fresh instance. The shared harness in tests/helpers/memoryLeak.ts
 * (template-owned) checks each is garbage collected after dispose() and leaves no
 * survivors across repeated cycles.
 */

import { NumberProperty } from "scenerystack/axon";
import { ACCELERATION_WINDOW, VELOCITY_WINDOW } from "../src/BackwardAccelerationConstants.js";
import { GraphScales } from "../src/common/model/GraphScales.js";
import { PredictionNotebook } from "../src/common/model/PredictionNotebook.js";
import { PredictionSketch } from "../src/common/model/PredictionSketch.js";
import { RunLibrary } from "../src/common/model/RunLibrary.js";
import { SignTable } from "../src/common/model/SignTable.js";
import { Trace } from "../src/common/model/Trace.js";
import { BackwardAccelerationPreferencesModel } from "../src/preferences/BackwardAccelerationPreferencesModel.js";
import { SmartCartModel } from "../src/smart-cart/model/SmartCartModel.js";
import { FakeSmartCart } from "./helpers/FakeSmartCart.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

const smoothing = {
  velocityWindowProperty: new NumberProperty(VELOCITY_WINDOW),
  accelerationWindowProperty: new NumberProperty(ACCELERATION_WINDOW),
};

describeDisposalLeaks([
  { name: "PredictionSketch", create: () => new PredictionSketch() },
  { name: "SignTable", create: () => new SignTable() },
  { name: "PredictionNotebook", create: () => new PredictionNotebook() },
  { name: "GraphScales", create: () => new GraphScales() },
  { name: "Trace", create: () => new Trace(smoothing) },
  { name: "RunLibrary", create: () => new RunLibrary(smoothing) },
  { name: "BackwardAccelerationPreferencesModel", create: () => new BackwardAccelerationPreferencesModel() },
  {
    name: "SmartCartModel",
    create: () => new SmartCartModel(new PredictionNotebook(), smoothing, { createDevice: () => new FakeSmartCart() }),
  },
]);
