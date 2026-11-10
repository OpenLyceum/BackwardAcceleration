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
        cornerRadius: 8,
      }),
      new Circle(wheel, { x: -width * 0.32, y: -wheel, fill: BackwardAccelerationColors.cartWheelColorProperty }),
      new Circle(wheel, { x: width * 0.32, y: -wheel, fill: BackwardAccelerationColors.cartWheelColorProperty }),
    ],
  });
}

export function createLabIcon(): ScreenIcon {
  const slope = 0.22;
  const track = new Path(
    new Shape()
      .moveTo(40, 260)
      .lineTo(508, 260 + 468 * slope)
      .lineTo(508, 260 + 468 * slope + 14)
      .lineTo(40, 274)
      .close(),
    { fill: BackwardAccelerationColors.trackColorProperty },
  );
  const angle = Math.atan(slope);
  const vectorOptions = { headHeight: 26, headWidth: 34, tailWidth: 13, stroke: null };
  const cartNode = new Node({
    x: 270,
    y: 260 + 230 * slope,
    rotation: angle,
    children: [
      cart(170),
      new ArrowNode(-20, -95, 110, -95, {
        ...vectorOptions,
        fill: BackwardAccelerationColors.velocityVectorColorProperty,
      }),
      new ArrowNode(30, -140, -100, -140, {
        ...vectorOptions,
        fill: BackwardAccelerationColors.accelerationVectorColorProperty,
      }),
    ],
  });
  return iconFrom(new Node({ children: [background(), track, cartNode] }));
}

export function createSmartCartIcon(): ScreenIcon {
  const left = 70;
  const right = 500;
  const axisY = 260;
  const axes = new Path(new Shape().moveTo(left, 175).lineTo(left, 345).moveTo(left, axisY).lineTo(right, axisY), {
    stroke: BackwardAccelerationColors.textColorProperty,
    lineWidth: 4,
  });
  const velocity = new Line(left, 185, right - 20, 335, {
    stroke: BackwardAccelerationColors.measuredColorProperty,
    lineWidth: 10,
    lineCap: "round",
  });
  const cartNode = cart(190);
  cartNode.x = 274;
  cartNode.y = 140;
  return iconFrom(new Node({ children: [background(), axes, velocity, cartNode] }));
}
