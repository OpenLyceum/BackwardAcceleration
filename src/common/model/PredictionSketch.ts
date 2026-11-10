/**
 * PredictionSketch.ts
 *
 * The students' predicted graphs for one experiment, drawn freehand on the v–t and
 * a–t graphs before the run. The handout asks for two layers: each student's own
 * prediction (red, dashed) and the group's consensus (dotted). Strokes are kept in
 * model coordinates (s, m/s or m/s²) so they stay put when a graph is rescaled.
 */

import { Emitter } from "scenerystack/axon";
import type { Vector2 } from "scenerystack/dot";
import BackwardAccelerationNamespace from "../../BackwardAccelerationNamespace.js";

export const Quantity = {
  VELOCITY: "velocity",
  ACCELERATION: "acceleration",
} as const;

export type QuantityValue = (typeof Quantity)[keyof typeof Quantity];

export const SketchLayer = {
  INDIVIDUAL: "individual",
  GROUP: "group",
} as const;

export type SketchLayerValue = (typeof SketchLayer)[keyof typeof SketchLayer];

export const SKETCH_LAYERS: readonly SketchLayerValue[] = [SketchLayer.INDIVIDUAL, SketchLayer.GROUP];

/** Points closer than this, in model units of time (s), are merged while drawing. */
const MIN_POINT_SPACING = 1e-3;

export type Stroke = readonly Vector2[];

export class PredictionSketch {
  /** Fired whenever any stroke is added to, extended, or erased. */
  public readonly changedEmitter = new Emitter();

  private readonly strokes = new Map<string, Vector2[][]>();
  private activeStroke: Vector2[] | null = null;

  private static key(quantity: QuantityValue, layer: SketchLayerValue): string {
    return `${quantity}/${layer}`;
  }

  public getStrokes(quantity: QuantityValue, layer: SketchLayerValue): readonly Stroke[] {
    return this.strokes.get(PredictionSketch.key(quantity, layer)) ?? [];
  }

  public hasStrokes(layer: SketchLayerValue): boolean {
    return (
      this.getStrokes(Quantity.VELOCITY, layer).length > 0 || this.getStrokes(Quantity.ACCELERATION, layer).length > 0
    );
  }

  public beginStroke(quantity: QuantityValue, layer: SketchLayerValue, point: Vector2): void {
    const key = PredictionSketch.key(quantity, layer);
    const list = this.strokes.get(key) ?? [];
    this.activeStroke = [point.copy()];
    list.push(this.activeStroke);
    this.strokes.set(key, list);
    this.changedEmitter.emit();
  }

  public extendStroke(point: Vector2): void {
    const stroke = this.activeStroke;
    if (stroke === null) {
      return;
    }
    const lastPoint = stroke[stroke.length - 1];
    if (lastPoint !== undefined && lastPoint.distance(point) < MIN_POINT_SPACING) {
      return;
    }
    stroke.push(point.copy());
    this.changedEmitter.emit();
  }

  public endStroke(): void {
    this.activeStroke = null;
  }

  /** Adds a whole stroke at once (keyboard entry and tests). */
  public addStroke(quantity: QuantityValue, layer: SketchLayerValue, points: readonly Vector2[]): void {
    if (points.length === 0) {
      return;
    }
    const key = PredictionSketch.key(quantity, layer);
    const list = this.strokes.get(key) ?? [];
    list.push(points.map((p) => p.copy()));
    this.strokes.set(key, list);
    this.changedEmitter.emit();
  }

  /** Erases one layer on both graphs. */
  public clearLayer(layer: SketchLayerValue): void {
    this.strokes.delete(PredictionSketch.key(Quantity.VELOCITY, layer));
    this.strokes.delete(PredictionSketch.key(Quantity.ACCELERATION, layer));
    this.activeStroke = null;
    this.changedEmitter.emit();
  }

  public reset(): void {
    this.strokes.clear();
    this.activeStroke = null;
    this.changedEmitter.emit();
  }

  public dispose(): void {
    this.changedEmitter.dispose();
  }
}

BackwardAccelerationNamespace.register("PredictionSketch", PredictionSketch);
