/**
 * SmartCartKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for the Smart Cart screen: moving the release and catch
 * markers on the full recording, and the basic actions (buttons, checkboxes,
 * radio buttons, the sign-table buttons).
 */

import {
  BasicActionsKeyboardHelpSection,
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export class SmartCartKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const help = StringManager.getInstance().getKeyboardHelp();
    const markerSection = new KeyboardHelpSection(help.markersHeadingStringProperty, [
      KeyboardHelpSectionRow.labelWithIcon(
        help.moveMarkerStringProperty,
        KeyboardHelpIconFactory.leftRightArrowKeysRowIcon(),
      ),
    ]);
    super([markerSection], [new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })]);
  }
}
