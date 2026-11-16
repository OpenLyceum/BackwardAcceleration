import { TRACK_NODE_SETTINGS } from "../../BackwardAccelerationConstants.js";
/**
 * TrackNode.ts
 *
 * The virtual lab bench, true to scale: a 1.2 m track whose left end rests on
 * feet of the chosen height, an elastic bumper at the low (right) end, and the
 * cart with its printed +x arrow, its tape brake when fitted, and — optionally —
 * its velocity and acceleration vectors drawn along the track.
 *
 * Between runs the cart can be dragged (or moved with the arrow keys) to set where
 * the next run starts.
 */

import { Multilink } from "scenerystack/axon";
import { Bounds2, clamp, toFixed, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path, Rectangle, RichDragListener, Text } from "scenerystack/scenery";
import { ArrowNode, PhetFont } from "scenerystack/scenery-phet";
import BackwardAccelerationColors from "../../BackwardAccelerationColors.js";
import {
  ACCELERATION_VECTOR_SCALE,
  CART_LENGTH,
  MAX_INCLINE_HEIGHT,
  TRACK_LENGTH,
  TRACK_VIEW_SCALE,
  VELOCITY_VECTOR_SCALE,
} from "../../BackwardAccelerationConstants.js";
import { accelerationAt } from "../../common/model/cartPhysics.js";
import { StringManager } from "../../i18n/StringManager.js";
import { type LabModel, MAX_CART_POSITION, MIN_CART_POSITION, RunState } from "../model/LabModel.js";

const CART_BODY_HEIGHT: number = TRACK_NODE_SETTINGS.CART_BODY_HEIGHT;
const WHEEL_RADIUS: number = TRACK_NODE_SETTINGS.WHEEL_RADIUS;
const TRACK_THICKNESS: number = TRACK_NODE_SETTINGS.TRACK_THICKNESS;
const BUMPER_WIDTH: number = TRACK_NODE_SETTINGS.BUMPER_WIDTH;
const VECTOR_OFFSET: number = TRACK_NODE_SETTINGS.VECTOR_OFFSET; // px above the cart body
const VECTOR_SPACING: number = TRACK_NODE_SETTINGS.VECTOR_SPACING;
const MIN_VECTOR_LENGTH: number = TRACK_NODE_SETTINGS.MIN_VECTOR_LENGTH; // px; shorter arrows are hidden
const LABEL_FONT = new PhetFont(TRACK_NODE_SETTINGS.LABEL_FONT_SIZE);

/** Keyboard step for moving the cart, in px (≈ 1.4 cm). */
const CART_DRAG_DELTA: number = TRACK_NODE_SETTINGS.CART_DRAG_DELTA;

export class TrackNode extends Node {
  /** The draggable cart, for pdomOrder. */
  public readonly cartNode: Node;

  public constructor(model: LabModel) {
    super({ isDisposable: false });
    const labels = StringManager.getInstance().getLabels();
    const a11y = StringManager.getInstance().getControlsA11yStrings();
    const scale = TRACK_VIEW_SCALE;

    // The low (right) end of the track sits at the origin; everything is placed relative to it.
    const lowEnd = new Vector2(TRACK_LENGTH * scale, 0);
    const trackDirection = () => {
      const sin = model.inclineHeightProperty.value / TRACK_LENGTH;
      return new Vector2(Math.sqrt(1 - sin * sin), sin);
    };
    const highEnd = () => lowEnd.minus(trackDirection().timesScalar(TRACK_LENGTH * scale));
    const pointAt = (s: number) => highEnd().plus(trackDirection().timesScalar(s * scale));

    // ── Bench, feet, track, bumper ──────────────────────────────────────────────
    const bench = new Line(TRACK_NODE_SETTINGS.BENCH_START_X, TRACK_THICKNESS, lowEnd.x + 10, TRACK_THICKNESS, {
      stroke: BackwardAccelerationColors.trackFeetColorProperty,
      lineWidth: TRACK_NODE_SETTINGS.BENCH_LINE_WIDTH,
    });
    const feet = new Rectangle(0, 0, TRACK_NODE_SETTINGS.FEET_WIDTH, 0, {
      fill: BackwardAccelerationColors.trackFeetColorProperty,
    });
    const heightLabel = new Text("", { font: LABEL_FONT, fill: BackwardAccelerationColors.textColorProperty });
    const track = new Path(null, { fill: BackwardAccelerationColors.trackColorProperty });
    const bumper = new Rectangle(0, TRACK_NODE_SETTINGS.BUMPER_Y, BUMPER_WIDTH, TRACK_NODE_SETTINGS.BUMPER_HEIGHT, {
      fill: BackwardAccelerationColors.bumperColorProperty,
      cornerRadius: TRACK_NODE_SETTINGS.BUMPER_CORNER_RADIUS,
    });

    // ── Cart (drawn level; rotated with the track) ───────────────────────────────
    const half = (CART_LENGTH * scale) / 2;
    const body = new Rectangle(-half, -CART_BODY_HEIGHT - WHEEL_RADIUS, 2 * half, CART_BODY_HEIGHT, {
      fill: BackwardAccelerationColors.cartBodyColorProperty,
      cornerRadius: TRACK_NODE_SETTINGS.BODY_CORNER_RADIUS,
    });
    const wheels = [-half + 10, half - 10].map(
      (x) => new Circle(WHEEL_RADIUS, { x, y: -WHEEL_RADIUS, fill: BackwardAccelerationColors.cartWheelColorProperty }),
    );
    const plusXArrow = new ArrowNode(-half + 12, 0, half - 22, 0, {
      y: -WHEEL_RADIUS - CART_BODY_HEIGHT / 2,
      headHeight: TRACK_NODE_SETTINGS.PLUS_X_ARROW_HEAD_HEIGHT,
      headWidth: TRACK_NODE_SETTINGS.PLUS_X_ARROW_HEAD_WIDTH,
      tailWidth: TRACK_NODE_SETTINGS.PLUS_X_ARROW_TAIL_WIDTH,
      fill: BackwardAccelerationColors.cartArrowColorProperty,
      stroke: null,
    });
    const plusXLabel = new Text(labels.plusXStringProperty, {
      font: new PhetFont({ size: TRACK_NODE_SETTINGS.PLUS_X_LABEL_FONT_SIZE, weight: "bold" }),
      fill: BackwardAccelerationColors.cartArrowColorProperty,
      centerY: -WHEEL_RADIUS - CART_BODY_HEIGHT / 2,
      maxWidth: TRACK_NODE_SETTINGS.PLUS_X_LABEL_MAX_WIDTH,
    });
    // The tape brake: a strip under the body, rubbing on the track between the wheels.
    const brake = new Rectangle(
      -half + 16,
      TRACK_NODE_SETTINGS.BRAKE_Y,
      2 * half - 32,
      TRACK_NODE_SETTINGS.BRAKE_HEIGHT,
      {
        fill: BackwardAccelerationColors.brakeColorProperty,
      },
    );

    const velocityArrow = new ArrowNode(0, 0, 1, 0, {
      y: -WHEEL_RADIUS - CART_BODY_HEIGHT - VECTOR_OFFSET - VECTOR_SPACING,
      headHeight: TRACK_NODE_SETTINGS.VELOCITY_ARROW_HEAD_HEIGHT,
      headWidth: TRACK_NODE_SETTINGS.VELOCITY_ARROW_HEAD_WIDTH,
      tailWidth: TRACK_NODE_SETTINGS.VELOCITY_ARROW_TAIL_WIDTH,
      fill: BackwardAccelerationColors.velocityVectorColorProperty,
      stroke: null,
    });
    const accelerationArrow = new ArrowNode(0, 0, 1, 0, {
      y: -WHEEL_RADIUS - CART_BODY_HEIGHT - VECTOR_OFFSET,
      headHeight: TRACK_NODE_SETTINGS.ACCELERATION_ARROW_HEAD_HEIGHT,
      headWidth: TRACK_NODE_SETTINGS.ACCELERATION_ARROW_HEAD_WIDTH,
      tailWidth: TRACK_NODE_SETTINGS.ACCELERATION_ARROW_TAIL_WIDTH,
      fill: BackwardAccelerationColors.accelerationVectorColorProperty,
      stroke: null,
    });
    const vectorLabel = (
      text: string,
      arrow: ArrowNode,
      fill: typeof BackwardAccelerationColors.velocityVectorColorProperty,
    ) =>
      new Text(text, {
        font: new PhetFont({ size: TRACK_NODE_SETTINGS.VECTOR_LABEL_FONT_SIZE, style: "italic", weight: "bold" }),
        fill,
        right: -half - TRACK_NODE_SETTINGS.VECTOR_LABEL_RIGHT_OFFSET,
        centerY: arrow.y,
      });
    const vLabel = vectorLabel("v", velocityArrow, BackwardAccelerationColors.velocityVectorColorProperty);
    const aLabel = vectorLabel("a", accelerationArrow, BackwardAccelerationColors.accelerationVectorColorProperty);
    /** Puts a vector's label just beyond its tip. */
    const placeLabel = (label: Text, length: number) => {
      if (length >= 0) {
        label.left = length + TRACK_NODE_SETTINGS.PLACE_LABEL_LEFT_OFFSET;
      } else {
        label.right = length - TRACK_NODE_SETTINGS.PLACE_LABEL_RIGHT_OFFSET;
      }
    };

    const cart = new Node({
      children: [brake, ...wheels, body, plusXArrow, plusXLabel, velocityArrow, accelerationArrow, vLabel, aLabel],
      cursor: "pointer",
      tagName: "div",
      focusable: true,
      accessibleName: a11y.cartStringProperty,
      accessibleHelpText: a11y.cartHelpStringProperty,
    });
    this.cartNode = cart;

    this.children = [bench, feet, heightLabel, track, bumper, cart];

    // Fixed bounds (room for the highest feet and the vectors), so layout does not jump as the incline changes.
    this.localBounds = new Bounds2(
      TRACK_NODE_SETTINGS.LOCAL_BOUNDS_MIN_X,
      -MAX_INCLINE_HEIGHT * scale - 90,
      lowEnd.x + 10,
      TRACK_THICKNESS + 2,
    );

    // ── Geometry updates ────────────────────────────────────────────────────────
    const updateTrack = () => {
      const direction = trackDirection();
      const normal = new Vector2(direction.y, -direction.x); // up, perpendicular to the track
      const high = highEnd();
      const shape = new Shape()
        .moveToPoint(high)
        .lineToPoint(lowEnd)
        .lineToPoint(lowEnd.plus(normal.timesScalar(-TRACK_THICKNESS)))
        .lineToPoint(high.plus(normal.timesScalar(-TRACK_THICKNESS)))
        .close();
      track.shape = shape;
      const feetHeight = Math.max(0, -high.y);
      feet.setRect(high.x + 6, high.y + TRACK_THICKNESS, 14, feetHeight);
      feet.visible = feetHeight > 0.5;
      heightLabel.visible = feet.visible;
      bumper.rotation = Math.atan2(direction.y, direction.x);
      bumper.translation = lowEnd.minus(direction.timesScalar(BUMPER_WIDTH));
      heightLabel.string = labels.heightPatternStringProperty.value.replace(
        "{{value}}",
        toFixed(model.inclineHeightProperty.value * 100, 1).replace(/\.0$/, ""),
      );
      heightLabel.right = high.x - TRACK_NODE_SETTINGS.UPDATE_TRACK_RIGHT_OFFSET;
      heightLabel.centerY = high.y + feetHeight / 2;
    };

    const updateCart = () => {
      const direction = trackDirection();
      cart.rotation = Math.atan2(direction.y, direction.x);
      cart.translation = pointAt(model.trackPositionProperty.value);
      const down = model.arrowDownTrackProperty.value;
      plusXArrow.setTailAndTip(down ? -half + 12 : half - 12, 0, down ? half - 22 : -half + 22, 0);
      plusXLabel.centerX = down
        ? half - TRACK_NODE_SETTINGS.UPDATE_CART_CENTER_X_OFFSET
        : -half + TRACK_NODE_SETTINGS.UPDATE_CART_CENTER_X_OFFSET;
      brake.visible = model.brakeProperty.value;

      const running = model.runStateProperty.value === RunState.RUNNING;
      const velocityLength = model.trackVelocityProperty.value * VELOCITY_VECTOR_SCALE;
      const accelerationLength = running
        ? accelerationAt(model.trackVelocityProperty.value, model.trackParameters) * ACCELERATION_VECTOR_SCALE
        : 0;
      velocityArrow.visible = model.showVelocityVectorProperty.value && Math.abs(velocityLength) > MIN_VECTOR_LENGTH;
      accelerationArrow.visible =
        model.showAccelerationVectorProperty.value && Math.abs(accelerationLength) > MIN_VECTOR_LENGTH;
      vLabel.visible = velocityArrow.visible;
      aLabel.visible = accelerationArrow.visible;
      if (velocityArrow.visible) {
        velocityArrow.setTailAndTip(0, 0, velocityLength, 0);
        placeLabel(vLabel, velocityLength);
      }
      if (accelerationArrow.visible) {
        accelerationArrow.setTailAndTip(0, 0, accelerationLength, 0);
        placeLabel(aLabel, accelerationLength);
      }
    };

    model.inclineHeightProperty.link(() => {
      updateTrack();
      updateCart();
    });
    labels.heightPatternStringProperty.lazyLink(updateTrack);
    Multilink.multilink(
      [
        model.trackPositionProperty,
        model.trackVelocityProperty,
        model.arrowDownTrackProperty,
        model.brakeProperty,
        model.runStateProperty,
        model.showVelocityVectorProperty,
        model.showAccelerationVectorProperty,
      ],
      updateCart,
    );

    // ── Dragging the cart between runs ──────────────────────────────────────────
    const positionFromPoint = (local: Vector2) => {
      const s = local.minus(highEnd()).dot(trackDirection()) / scale;
      return clamp(s, MIN_CART_POSITION, MAX_CART_POSITION);
    };
    let grabOffset = 0;
    const canDrag = () => model.runStateProperty.value !== RunState.RUNNING;
    const moveTo = (s: number) => {
      if (model.runStateProperty.value === RunState.FINISHED) {
        model.returnCart();
      }
      model.startPositionProperty.value = clamp(s, MIN_CART_POSITION, MAX_CART_POSITION);
      model.trackPositionProperty.value = model.startPositionProperty.value;
    };
    cart.addInputListener(
      new RichDragListener({
        dragListenerOptions: {
          start: (event) => {
            if (canDrag()) {
              grabOffset =
                positionFromPoint(this.globalToLocalPoint(event.pointer.point)) - model.trackPositionProperty.value;
            }
          },
          drag: (event) => {
            if (canDrag()) {
              moveTo(positionFromPoint(this.globalToLocalPoint(event.pointer.point)) - grabOffset);
            }
          },
        },
        keyboardDragListenerOptions: {
          keyboardDragDirection: "leftRight",
          dragDelta: CART_DRAG_DELTA,
          shiftDragDelta: 1,
          drag: (_event, listener) => {
            if (canDrag()) {
              moveTo(model.trackPositionProperty.value + listener.modelDelta.x / scale);
            }
          },
        },
      }),
    );
    model.runStateProperty.link((state) => {
      cart.cursor = state === RunState.RUNNING ? null : "pointer";
    });
  }
}
