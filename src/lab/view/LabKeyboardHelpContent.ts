/**
 * LabKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for the Lab screen: moving the cart along the track before
 * a run, the sliders (incline height, push speed), the time controls, and the
 * basic actions (radio buttons, checkboxes, the sign-table buttons).
 */

import {
  BasicActionsKeyboardHelpSection,
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  SliderControlsKeyboardHelpSection,
  TimeControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export class LabKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const help = StringManager.getInstance().getKeyboardHelp();

    const cartSection = new KeyboardHelpSection(help.cartHeadingStringProperty, [
      KeyboardHelpSectionRow.labelWithIcon(
        help.moveCartStringProperty,
        KeyboardHelpIconFactory.leftRightArrowKeysRowIcon(),
      ),
      KeyboardHelpSectionRow.labelWithIcon(
        help.moveCartSlowlyStringProperty,
        KeyboardHelpIconFactory.shiftPlusIcon(KeyboardHelpIconFactory.leftRightArrowKeysRowIcon()),
      ),
    ]);

    super(
      [cartSection, new SliderControlsKeyboardHelpSection()],
      [new TimeControlsKeyboardHelpSection(), new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })],
    );
  }
}
