/**
 * BackwardAccelerationScreenIcons.ts
 *
 * Programmatic home-screen / navigation-bar icons for each screen, drawn on the
 * standard PhET 548 × 373 canvas using BackwardAccelerationColors.
 *
 *   Lab         a cart on an incline with its velocity (down) and acceleration (back) vectors
 *   Smart Cart  a cart above a v–t graph that crosses zero with constant negative slope
 */
import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path, Rectangle } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { ScreenIcon } from "scenerystack/sim";
import BackwardAccelerationColors from "../BackwardAccelerationColors.js";
import { BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS } from "../BackwardAccelerationConstants.js";

const W = 548;
const H = 373;

function background(): Rectangle {
  return new Rectangle(0, 0, W, H, { fill: BackwardAccelerationColors.backgroundColorProperty });
}

function iconFrom(content: Node): ScreenIcon {
  return new ScreenIcon(content, {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: BackwardAccelerationColors.backgroundColorProperty,
  });
}

/** A cart (body and wheels) centred on x = 0, sitting on y = 0. */
function cart(width: number): Node {
  const height = width * 0.3;
  const wheel = width * 0.07;
  return new Node({
    children: [
      new Rectangle(-width / 2, -height - wheel, width, height, {
        fill: BackwardAccelerationColors.cartBodyColorProperty,
        cornerRadius: BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.CART_CORNER_RADIUS,
      }),
      new Circle(wheel, {
        x: -width * BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.CART_X_FACTOR,
        y: -wheel,
        fill: BackwardAccelerationColors.cartWheelColorProperty,
      }),
      new Circle(wheel, {
        x: width * BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.CART_X_FACTOR,
        y: -wheel,
        fill: BackwardAccelerationColors.cartWheelColorProperty,
      }),
    ],
  });
}

export function createLabIcon(): ScreenIcon {
  const slope = 0.22;
  const track = new Path(
    new Shape()
      .moveTo(BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.TRACK_X, BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.TRACK_Y)
      .lineTo(BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.TRACK_END_X, 260 + 468 * slope)
      .lineTo(BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.TRACK_END_X, 260 + 468 * slope + 14)
      .lineTo(
        BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.TRACK_X,
        BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.TRACK_X_LINE_TO_Y,
      )
      .close(),
    { fill: BackwardAccelerationColors.trackColorProperty },
  );
  const angle = Math.atan(slope);
  const vectorOptions = {
    headHeight: BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.VECTOR_OPTIONS_HEAD_HEIGHT,
    headWidth: BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.VECTOR_OPTIONS_HEAD_WIDTH,
    tailWidth: BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.VECTOR_OPTIONS_TAIL_WIDTH,
    stroke: null,
  };
  const cartNode = new Node({
    x: BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.CART_NODE_X,
    y:
      BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.CART_NODE_Y_OFFSET +
      BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.CART_NODE_Y_FACTOR * slope,
    rotation: angle,
    children: [
      cart(BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.CART_NODE_WIDTH),
      new ArrowNode(
        BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.CART_NODE_START_X,
        BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.CART_NODE_START_Y,
        BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.CART_NODE_END_X,
        BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.CART_NODE_END_Y,
        {
          ...vectorOptions,
          fill: BackwardAccelerationColors.velocityVectorColorProperty,
        },
      ),
      new ArrowNode(
        BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.ACCEL_ARROW_START_X,
        BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.ACCEL_ARROW_START_Y,
        BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.ACCEL_ARROW_END_X,
        BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.ACCEL_ARROW_END_Y,
        {
          ...vectorOptions,
          fill: BackwardAccelerationColors.accelerationVectorColorProperty,
        },
      ),
    ],
  });
  return iconFrom(new Node({ children: [background(), track, cartNode] }));
}

export function createSmartCartIcon(): ScreenIcon {
  const left: number = BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.LEFT;
  const right: number = BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.RIGHT;
  const axisY = 260;
  const axes = new Path(
    new Shape()
      .moveTo(left, BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.AXES_Y)
      .lineTo(left, BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.AXES_BOTTOM_Y)
      .moveTo(left, axisY)
      .lineTo(right, axisY),
    {
      stroke: BackwardAccelerationColors.textColorProperty,
      lineWidth: BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.AXES_LINE_WIDTH,
    },
  );
  const velocity = new Line(
    left,
    BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.VELOCITY_START_Y,
    right - 20,
    BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.VELOCITY_END_Y,
    {
      stroke: BackwardAccelerationColors.measuredColorProperty,
      lineWidth: BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.VELOCITY_LINE_WIDTH,
      lineCap: "round",
    },
  );
  const cartNode = cart(BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.SMART_CART_ICON_CART_WIDTH);
  cartNode.x = BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.SMART_CART_ICON_CART_X;
  cartNode.y = BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS.SMART_CART_ICON_CART_Y;
  return iconFrom(new Node({ children: [background(), axes, velocity, cartNode] }));
}
