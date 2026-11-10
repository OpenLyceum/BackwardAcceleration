/**
 * SmartCartPanel.ts
 *
 * The real Smart Cart's connection: Connect / Disconnect, the cart's name or
 * connection state, any error, Change Sign, and a live position readout that moves
 * when the cart is pushed — the quickest check that the right cart is connected and
 * that its sign is the way the student wants. When the browser cannot use Web
 * Bluetooth at all, the panel says why instead. Adapted from CartCollisions.
 */

import { DerivedProperty } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, type Node, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox, RectangularPushButton } from "scenerystack/sun";
import BackwardAccelerationColors from "../../BackwardAccelerationColors.js";
import {
  FLAT_PANEL_PUSH_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../../common/BackwardAccelerationButtonOptions.js";
import { BACKWARD_ACCELERATION_CHECKBOX_OPTIONS } from "../../common/BackwardAccelerationControlOptions.js";
import { BackwardAccelerationPanel } from "../../common/BackwardAccelerationPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import backwardAccelerationQueryParameters from "../../preferences/backwardAccelerationQueryParameters.js";
import { BluetoothStatus, type BluetoothStatusValue } from "../model/bluetoothSupport.js";
import { ConnectionState, type SmartCartChannel } from "../model/SmartCartChannel.js";

const FONT = new PhetFont(12);

export class SmartCartPanel extends BackwardAccelerationPanel {
  public readonly focusOrder: readonly Node[];

  public constructor(channel: SmartCartChannel, bluetoothStatus: BluetoothStatusValue, width: number) {
    const labels = StringManager.getInstance().getLabels();
    const a11y = StringManager.getInstance().getControlsA11yStrings();
    const innerWidth = width - 24;
    const bluetoothAvailable = bluetoothStatus === BluetoothStatus.AVAILABLE;

    const status = new DerivedProperty(
      [
        channel.connectionStateProperty,
        channel.deviceNameProperty,
        labels.notConnectedStringProperty,
        labels.connectingStringProperty,
      ],
      (state, name, notConnected, connecting) =>
        state === ConnectionState.CONNECTED
          ? (name ?? "")
          : state === ConnectionState.CONNECTING
            ? connecting
            : notConnected,
    );
    const error = new DerivedProperty(
      [channel.errorMessageProperty, labels.connectionLostStringProperty],
      (message, lost) => (message === null ? "" : message === "disconnected" ? lost : message),
    );
    const live = new DerivedProperty(
      [channel.livePositionProperty, channel.connectionStateProperty, labels.livePositionPatternStringProperty],
      (position, state, pattern) =>
        state === ConnectionState.CONNECTED ? StringUtils.fillIn(pattern, { value: toFixed(position, 3) }) : "",
    );
    const buttonLabel = new DerivedProperty(
      [channel.connectionStateProperty, labels.connectStringProperty, labels.disconnectStringProperty],
      (state, connect, disconnect) => (state === ConnectionState.CONNECTED ? disconnect : connect),
    );
    const canPress = new DerivedProperty(
      [channel.connectionStateProperty],
      (state) => bluetoothAvailable && state !== ConnectionState.CONNECTING,
    );

    const connectButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(buttonLabel, {
        font: new PhetFont({ size: 13, weight: "bold" }),
        fill: LIGHT_SURFACE_TEXT_FILL,
        maxWidth: 100,
      }),
      enabledProperty: canPress,
      accessibleName: a11y.connectStringProperty,
      // Synchronous listener so the browser still sees a user gesture; connect() never rejects.
      listener: () => {
        if (channel.connectionStateProperty.value === ConnectionState.CONNECTED) {
          channel.disconnect().catch(() => undefined);
        } else {
          channel.connect().catch(() => undefined);
        }
      },
    });

    const changeSignCheckbox = new Checkbox(
      channel.changeSignProperty,
      new Text(labels.changeSignStringProperty, {
        font: FONT,
        fill: BackwardAccelerationColors.textColorProperty,
        maxWidth: innerWidth - 30,
      }),
      { ...BACKWARD_ACCELERATION_CHECKBOX_OPTIONS, accessibleName: a11y.changeSignStringProperty },
    );

    const unsupportedMessage =
      bluetoothStatus === BluetoothStatus.INSECURE_CONTEXT
        ? labels.bluetoothInsecureStringProperty
        : bluetoothStatus === BluetoothStatus.UNSUPPORTED_BROWSER
          ? labels.bluetoothUnsupportedStringProperty
          : null;

    super(
      new VBox({
        align: "left",
        spacing: 5,
        children: [
          new HBox({
            spacing: 10,
            children: [
              new Text(labels.smartCartStringProperty, {
                font: new PhetFont({ size: 14, weight: "bold" }),
                fill: BackwardAccelerationColors.cartBodyColorProperty,
                maxWidth: 100,
              }),
              connectButton,
            ],
          }),
          new Text(status, { font: FONT, fill: BackwardAccelerationColors.textColorProperty, maxWidth: innerWidth }),
          new Text(error, {
            font: new PhetFont(11),
            fill: BackwardAccelerationColors.warningColorProperty,
            maxWidth: innerWidth,
          }),
          ...(unsupportedMessage
            ? [
                new RichText(unsupportedMessage, {
                  font: new PhetFont(11),
                  fill: BackwardAccelerationColors.warningColorProperty,
                  lineWrap: innerWidth,
                }),
              ]
            : []),
          changeSignCheckbox,
          new Text(live, { font: FONT, fill: BackwardAccelerationColors.textColorProperty, maxWidth: innerWidth }),
          ...(backwardAccelerationQueryParameters.showDiagnostics
            ? [
                new Text(channel.diagnosticProperty, {
                  font: new PhetFont(10),
                  fill: BackwardAccelerationColors.warningColorProperty,
                  maxWidth: innerWidth,
                }),
              ]
            : []),
        ],
      }),
      { minWidth: width, maxWidth: width, isDisposable: false },
    );

    this.focusOrder = [connectButton, changeSignCheckbox];
  }
}
