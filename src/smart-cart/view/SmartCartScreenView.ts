/**
 * SmartCartScreenView.ts
 *
 * The Smart Cart screen: the same predictions, sign table and graphs as the Lab
 * screen, fed by a real PASCO Smart Cart over Web Bluetooth.
 *
 *   left    experiment, connection, recording and trim
 *   middle  predictions and sign table
 *   right   v–t and a–t graphs (with release / catch markers on the full recording)
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { Node, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { CONTROL_PANEL_WIDTH, MIDDLE_COLUMN_WIDTH, SCREEN_VIEW_MARGIN } from "../../BackwardAccelerationConstants.js";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/BackwardAccelerationButtonOptions.js";
import { ExperimentPanel } from "../../common/view/ExperimentPanel.js";
import { GraphArea } from "../../common/view/GraphArea.js";
import { PredictionsPanel } from "../../common/view/PredictionsPanel.js";
import { SignTableNode } from "../../common/view/SignTableNode.js";
import { getBluetoothStatus } from "../model/bluetoothSupport.js";
import type { SmartCartModel } from "../model/SmartCartModel.js";
import { RecordingPanel } from "./RecordingPanel.js";
import { SmartCartPanel } from "./SmartCartPanel.js";
import { SmartCartScreenSummaryContent } from "./SmartCartScreenSummaryContent.js";

export type SmartCartScreenViewOptions = ScreenViewOptions;

const COLUMN_SPACING = 10;

export class SmartCartScreenView extends ScreenView {
  public constructor(model: SmartCartModel, providedOptions?: SmartCartScreenViewOptions) {
    const options = optionize<SmartCartScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new SmartCartScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const bounds = this.layoutBounds;
    const top = bounds.minY + SCREEN_VIEW_MARGIN / 2;
    const listParent = new Node();

    const experimentPanel = new ExperimentPanel(model.runs, listParent, CONTROL_PANEL_WIDTH);
    const cartPanel = new SmartCartPanel(model.cart, getBluetoothStatus(), CONTROL_PANEL_WIDTH);
    const recordingPanel = new RecordingPanel(model, CONTROL_PANEL_WIDTH);
    const leftColumn = new VBox({
      spacing: COLUMN_SPACING,
      align: "left",
      children: [experimentPanel, cartPanel, recordingPanel],
      left: bounds.minX + SCREEN_VIEW_MARGIN,
      top,
    });

    const predictionsPanel = new PredictionsPanel(model.notebook, model.runs, MIDDLE_COLUMN_WIDTH);
    const signTable = new SignTableNode(model.notebook, model.runs, MIDDLE_COLUMN_WIDTH);
    const middleColumn = new VBox({
      spacing: COLUMN_SPACING,
      align: "left",
      children: [predictionsPanel, signTable],
      left: leftColumn.right + COLUMN_SPACING,
      top,
    });

    const graphArea = new GraphArea(model.runs, model.notebook, { trimMarkers: true });
    graphArea.right = bounds.maxX - SCREEN_VIEW_MARGIN / 2;
    graphArea.top = top;

    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        model.notebook.reset();
      },
      right: bounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: bounds.maxY - SCREEN_VIEW_MARGIN,
    });

    this.children = [
      leftColumn,
      middleColumn,
      graphArea,
      resetAllButton,
      listParent,
      new Node({
        pdomOrder: [
          experimentPanel.comboBox,
          ...cartPanel.focusOrder,
          ...recordingPanel.focusOrder,
          ...predictionsPanel.focusOrder,
          ...graphArea.focusOrder,
          ...signTable.focusOrder,
          resetAllButton,
        ],
      }),
    ];
  }
}
