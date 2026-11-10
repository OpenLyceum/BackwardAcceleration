/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import BackwardAccelerationColors from "./BackwardAccelerationColors.js";
import { PredictionNotebook } from "./common/model/PredictionNotebook.js";
import { StringManager } from "./i18n/StringManager.js";
import { LabScreen } from "./lab/LabScreen.js";
import { BackwardAccelerationPreferencesModel } from "./preferences/BackwardAccelerationPreferencesModel.js";
import { BackwardAccelerationPreferencesNode } from "./preferences/BackwardAccelerationPreferencesNode.js";
import { SmartCartScreen } from "./smart-cart/SmartCartScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  // Simulation-specific preferences; initial values come from backwardAccelerationQueryParameters.
  const simPreferences = new BackwardAccelerationPreferencesModel(Tandem.ROOT.createTandem("preferences"));

  // One notebook of predictions and sign tables for both screens: predict once, then
  // compare with the virtual cart and with the real Smart Cart.
  const notebook = new PredictionNotebook();

  const screens = [
    new LabScreen({
      name: stringManager.getScreenNames().labStringProperty,
      tandem: Tandem.ROOT.createTandem("labScreen"),
      notebook,
      smoothing: simPreferences,
      backgroundColorProperty: BackwardAccelerationColors.backgroundColorProperty,
    }),
    new SmartCartScreen({
      name: stringManager.getScreenNames().smartCartStringProperty,
      tandem: Tandem.ROOT.createTandem("smartCartScreen"),
      notebook,
      smoothing: simPreferences,
      backgroundColorProperty: BackwardAccelerationColors.backgroundColorProperty,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new BackwardAccelerationPreferencesNode(simPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Optional: fill in credits shown in Help → About
    credits: {
      leadDesign: "Martin Veillette",
      softwareDevelopment: "Martin Veillette",
      team: "OpenLyceum",
      qualityAssurance: "",
    },
  });

  sim.start();
});
