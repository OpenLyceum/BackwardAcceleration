/**
 * BackwardAccelerationConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * simulation. Physics / model values use SI units (noted on each value);
 * layout values are screen pixels. Colours live in BackwardAccelerationColors.ts.
 */

import BackwardAccelerationNamespace from "./BackwardAccelerationNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 20;

/** Corner radius shared by control panels and dialogs. */
export const PANEL_CORNER_RADIUS = 6;

/** Width and height of one v–t or a–t graph, tick labels included. */
export const GRAPH_WIDTH = 480;
export const GRAPH_HEIGHT = 195;

/** Vertical gap between the stacked graphs. */
export const GRAPH_SPACING = 8;

/** Width of the left-hand control column. */
export const CONTROL_PANEL_WIDTH = 236;

/** Width of the middle column (Predictions and sign table). */
export const MIDDLE_COLUMN_WIDTH = 206;

/** Screen pixels per metre of track on the Lab screen (true to scale in both directions). */
export const TRACK_VIEW_SCALE = 320;

/** Screen pixels per m/s of the velocity vector and per m/s² of the acceleration vector. */
export const VELOCITY_VECTOR_SCALE = 70;
export const ACCELERATION_VECTOR_SCALE = 70;

// ── Track and cart (SI units) ─────────────────────────────────────────────────

/** Standard gravitational acceleration (m/s²). */
export const GRAVITY = 9.81;

/** Length of the PASCO aluminium track used in the lab (m). */
export const TRACK_LENGTH = 1.2;

/** Length of a Smart Cart body (m). */
export const CART_LENGTH = 0.16;

/** Range of the track-feet height under the raised end (m). The handout uses 4 cm and 8 cm. */
export const MIN_INCLINE_HEIGHT = 0;
export const MAX_INCLINE_HEIGHT = 0.1;

/** Rolling-resistance coefficient of a free Smart Cart on the aluminium track (dimensionless). */
export const ROLLING_FRICTION = 0.004;

/** Effective sliding-friction coefficient of the tape "brake" dragging on the track (dimensionless). */
export const BRAKE_FRICTION = 0.1;

/** Range of the speed the cart has when the hand lets go after a push (m/s). */
export const MIN_PUSH_SPEED = 0.1;
export const MAX_PUSH_SPEED = 1.5;

/** Integration sub-step of the virtual cart (s). Motion is piecewise-exact; this only bounds bumper overshoot. */
export const PHYSICS_SUBSTEP = 0.001;

/** Longest run, virtual or real, before recording stops on its own (s). */
export const MAX_RUN_TIME = 20;

// ── Sampling and derivatives ──────────────────────────────────────────────────

/** Distance per encoder count of the Smart Cart's wheel (m): 0.09895 m per 816 counts. */
export const ENCODER_RESOLUTION = 0.09895 / 816;

/** Sample period of both the virtual cart and the Smart Cart stream (ms) — 50 Hz. */
export const SAMPLE_PERIOD_MS = 20;

/** Fallback poll interval for devices that cannot stream (ms). */
export const HARDWARE_POLL_INTERVAL_MS = 20;

/** Default least-squares window (samples) used to differentiate position into velocity. */
export const VELOCITY_WINDOW = 5;

/** Default least-squares window (samples) used to differentiate velocity into acceleration. */
export const ACCELERATION_WINDOW = 11;

/** Speeds below this count as "at rest" when finding release and catch in a recording (m/s). */
export const MOTION_THRESHOLD = 0.03;

/** Velocities and accelerations whose magnitude is below these count as zero in the sign table. */
export const ZERO_VELOCITY_TOLERANCE = 0.05; // m/s
export const ZERO_ACCELERATION_TOLERANCE = 0.08; // m/s²

BackwardAccelerationNamespace.register("BackwardAccelerationConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  GRAVITY,
  TRACK_LENGTH,
  ENCODER_RESOLUTION,
  SAMPLE_PERIOD_MS,
});
