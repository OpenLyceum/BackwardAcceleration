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

/** Settings for common/BackwardAccelerationControlOptions.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const BACKWARD_ACCELERATION_CONTROL_OPTIONS_SETTINGS = {
  SLIDER_THUMB_SIZE_WIDTH: 12,
  SLIDER_THUMB_SIZE_HEIGHT: 22,
  STANDALONE_SLIDER_TRACK_SIZE_WIDTH: 150,
  STANDALONE_SLIDER_TRACK_SIZE_HEIGHT: 3,
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_WIDTH: 110,
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_HEIGHT: 3,
  CHECKBOX_BOX_WIDTH: 16,
  /** Backward acceleration number control options scale (dimensionless). */
  BACKWARD_ACCELERATION_NUMBER_CONTROL_OPTIONS_SCALE: 0.75,
  BACKWARD_ACCELERATION_NUMBER_CONTROL_OPTIONS_SLIDER_PADDING: 4,
  BACKWARD_ACCELERATION_NUMBER_CONTROL_OPTIONS_ARROW_BUTTON_SPACING: 3,
  BACKWARD_ACCELERATION_NUMBER_CONTROL_OPTIONS_VERTICAL_SPACING: 4,
  BACKWARD_ACCELERATION_CHECKBOX_OPTIONS_SPACING: 4,
} as const;

/** Settings for common/BackwardAccelerationPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const BACKWARD_ACCELERATION_PANEL_SETTINGS = {
  OPTIONS_X_MARGIN: 12,
  OPTIONS_Y_MARGIN: 10,
} as const;

/** Settings for common/BackwardAccelerationScreenIcons.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const BACKWARD_ACCELERATION_SCREEN_ICONS_SETTINGS = {
  TRACK_X_SEGMENT_2: 508, // px
  TRACK_X_LINE_TO_Y: 274, // px
  CART_NODE_WIDTH: 170, // px
  CART_NODE_START_X_SEGMENT_2: 30, // px
  CART_NODE_START_Y_SEGMENT_2: -140, // px
  CART_NODE_END_X_SEGMENT_2: -100, // px
  CART_NODE_END_Y_SEGMENT_2: -140, // px
  AXES_Y_SEGMENT_2: 345, // px
  CART_NODE_WIDTH_SEGMENT_2: 190, // px

  CART_X_FACTOR: 0.32, // dimensionless
  CART_NODE_Y_OFFSET: 260, // px
  CART_NODE_Y_FACTOR: 230, // dimensionless

  CART_CORNER_RADIUS: 8,
  TRACK_X: 40,
  TRACK_Y: 260,
  VECTOR_OPTIONS_HEAD_HEIGHT: 26,
  VECTOR_OPTIONS_HEAD_WIDTH: 34,
  VECTOR_OPTIONS_TAIL_WIDTH: 13,
  CART_NODE_X: 270,
  CART_NODE_START_X: -20,
  CART_NODE_START_Y: -95,
  CART_NODE_END_X: 110,
  CART_NODE_END_Y: -95,
  LEFT: 70,
  RIGHT: 500,
  AXES_Y: 175,
  AXES_LINE_WIDTH: 4,
  VELOCITY_START_Y: 185,
  VELOCITY_END_Y: 335,
  VELOCITY_LINE_WIDTH: 10,
  /** Cart placement on the Smart Cart home-screen icon (px). */
  SMART_CART_ICON_CART_X: 274,
  SMART_CART_ICON_CART_Y: 140,
} as const;

/** Settings for common/model/GraphScales.ts. */
export const GRAPH_SCALES_SETTINGS = {
  /** Initial TIME_LEVELS index (5 s at index 2). */
  DEFAULT_TIME_LEVEL: 2,
  /** Initial VELOCITY_LEVELS / ACCELERATION_LEVELS index (±1 at index 2). */
  DEFAULT_VALUE_LEVEL: 2,
  /** ACCELERATION_LEVELS index used after a brake run (±2 m/s² at index 3). */
  BRAKE_ACCELERATION_LEVEL: 3,
} as const;

/** Settings for common/model/PredictionSketch.ts. */
export const PREDICTION_SKETCH_SETTINGS = {
  /** Points closer than this, in model units of time (s), are merged while drawing. */
  MIN_POINT_SPACING: 1e-3,
} as const;

/** Settings for common/model/SignTable.ts. */
export const SIGN_TABLE_SETTINGS = {
  /** Phase count (dimensionless). */
  PHASE_COUNT: 3,
} as const;

/** Settings for common/model/motionAnalysis.ts. */
export const MOTION_ANALYSIS_SETTINGS = {
  /** Catch threshold hysteresis divisor (dimensionless). */
  CATCH_HYSTERESIS_DIVISOR: 4,
  /** Release threshold hysteresis divisor (dimensionless). */
  RELEASE_HYSTERESIS_DIVISOR: 3,
  /** Minimum samples for a three-phase sign analysis (count). */
  MIN_PHASE_SAMPLES: 9,
  /** Initial velocity samples used for the robust sign estimate (count). */
  INITIAL_SIGN_SAMPLES: 3,
  /** Samples required after a detected turn (count). */
  TURN_END_MARGIN: 3,
  /** Run-length divisor for the exclusion margin around a turn (dimensionless). */
  PHASE_MARGIN_DIVISOR: 20,
  /** A speed this far below its running peak (m/s) marks the end of a push: the hand has let go. */
  PEAK_DROP: 0.02,
  /** Slowing faster than this (m/s²) is a hand or the bumper, not the track: the  tape brake gives about 1 m/s² and gravity on the steepest incline under 1 m/s². */
  ABRUPT_DECELERATION: 4,
} as const;

/** Settings for common/view/ExperimentPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const EXPERIMENT_PANEL_SETTINGS = {
  COMBO_BOX_MAX_WIDTH_OFFSET: 40, // px

  TITLE_FONT_SIZE: 14,
  ITEM_FONT_SIZE: 13,
  INSTRUCTION_FONT_SIZE: 12,
  COMBO_BOX_X_MARGIN: 8,
  COMBO_BOX_Y_MARGIN: 4,
  CONSTRUCTOR_SPACING: 6,
} as const;

/** Settings for common/view/GraphArea.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const GRAPH_AREA_SETTINGS = {
  ITEM_3_SPACING: 20, // px

  LEGEND_FONT_SIZE: 12,
  LEGEND_LINE_LENGTH: 28,
  ZOOM_GROUP_SPACING: 4,
  LEGEND_ITEM_SPACING: 5,
  LEGEND_ITEM_LINE_WIDTH: 2.5,
  LEGEND_ITEM_MAX_WIDTH: 120,
  LEGEND_SPACING: 16,
  CONSTRUCTOR_SPACING: 6,
} as const;

/** Settings for common/view/KinematicsGraphNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const KINEMATICS_GRAPH_NODE_SETTINGS = {
  LABEL_DECIMAL_PLACES: 2, // digits
  PLUS_XY_X_OFFSET: 0.5, // px

  LEFT_INSET: 52,
  BOTTOM_INSET: 30,
  TOP_INSET: 6,
  RIGHT_INSET: 8,
  TICK_FONT_SIZE: 10,
  AXIS_TITLE_FONT_SIZE: 12,
  MEASURED_LINE_WIDTH: 2.5,
  OTHER_RUN_LINE_WIDTH: 1.5,
  SKETCH_LINE_WIDTH: 2.5,
  /** Keyboard step of a trim marker, in view px (the time per px depends on zoom). */
  MARKER_DRAG_DELTA: 4,
  GRID_OPTIONS_LINE_WIDTH: 0.5,
  ZERO_AXIS_LINE_WIDTH: 1.5,
  CREATE_MARKER_X: -6,
  CREATE_MARKER_WIDTH: 12,
  CREATE_MARKER_LINE_WIDTH: 2,
  CREATE_MARKER_RADIUS: 6,
  CREATE_MARKER_Y: 4,
} as const;

/** Settings for common/view/PredictionsPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const PREDICTIONS_PANEL_SETTINGS = {
  SHOW_INDIVIDUAL_TEXT_MAX_WIDTH: 90, // px
  SHOW_GROUP_TEXT_MAX_WIDTH: 90, // px
  ITEM_3_SPACING: 8, // px
  ITEM_4_SPACING: 6, // px

  ERASE_BUTTON_MAX_WIDTH_OFFSET: 20, // px

  TITLE_FONT_SIZE: 14,
  FONT_SIZE: 12,
  DRAW_MODE_GROUP_SPACING: 5,
  DRAW_MODE_GROUP_RADIUS: 7,
  ERASE_BUTTON_X_MARGIN: 6,
  ERASE_BUTTON_Y_MARGIN: 3,
  CONSTRUCTOR_SPACING: 7,
} as const;

/** Settings for common/view/SignTableNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const SIGN_TABLE_NODE_SETTINGS = {
  GRID_LINE_WRAP_OFFSET: 30, // px
  GRID_MAX_WIDTH_OFFSET: 30, // px
  CHECKBOX_MAX_WIDTH_OFFSET: 60, // px
  NO_RUN_TEXT_MAX_WIDTH_OFFSET: 24, // px
  CONSTRUCTOR_MAX_WIDTH_OFFSET: 24, // px

  TITLE_FONT_SIZE: 14,
  HEADER_FONT_SIZE: 11,
  CELL_FONT_SIZE: 15,
  MARK_FONT_SIZE: 13,
  CELL_WIDTH: 22,
  ROW_LABEL_WIDTH: 46,
  HEADER_WIDTH: 50,
  BUTTON_X_MARGIN: 6,
  BUTTON_Y_MARGIN: 2,
  HEADER_MAX_HEIGHT: 30,
  GRID_X_SPACING: 4,
  GRID_Y_SPACING: 6,
  CHECKBOX_FONT_SIZE: 12,
  NO_RUN_TEXT_FONT_SIZE: 11,
  CONSTRUCTOR_SPACING: 6,
} as const;

/** Settings for lab/model/LabModel.ts. */
export const LAB_MODEL_SETTINGS = {
  /** Minimum clearance from the track bumper (m). */
  BUMPER_CLEARANCE: 0.02,
  /** Tolerance at a sampling boundary (s). */
  SAMPLE_TIME_EPSILON: 1e-9,
  /** Smallest remaining interval worth integrating (s). */
  REMAINING_TIME_EPSILON: 1e-12,
  /** A cart at rest this long after being let go has stopped for good. */
  REST_TIME_TO_FINISH: 0.4,
  /** Clock speed in slow motion. */
  SLOW_MOTION_FACTOR: 0.25,
  /** Longest frame dt honoured, s (a backgrounded tab must not teleport the cart). */
  MAX_FRAME_DT: 0.1,
} as const;

/** Settings for lab/view/LabScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const LAB_SCREEN_VIEW_SETTINGS = {
  CATCH_BUTTON_TEXT_MAX_WIDTH: 70, // px
  READOUTS_DECIMALS: 2, // digits
  POSITION_READOUT_PATTERN_READOUT_DECIMALS: 3, // digits

  CONSTRUCTOR_LEFT_OFFSET: 4, // px
  CONSTRUCTOR_TOP_OFFSET: 4, // px

  COLUMN_SPACING: 10,
  BUTTON_FONT_SIZE: 14,
  READOUT_FONT_SIZE: 13,
  STATUS_FONT_SIZE: 13,
  GO_BUTTON_MAX_WIDTH: 80,
  /** Time control scale (dimensionless). */
  TIME_CONTROL_SCALE: 0.85,
  READOUT_MAX_WIDTH: 120,
  READOUTS_SPACING: 3,
  RUN_CONTROLS_SPACING: 8,
} as const;

/** Settings for lab/view/LabSetupPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const LAB_SETUP_PANEL_SETTINGS = {
  TOWARD_PLUS_X_TEXT_MAX_WIDTH: 30, // px
  TOWARD_MINUS_X_TEXT_MAX_WIDTH: 30, // px
  ITEM_8_SPACING: 8, // px

  HEIGHT_CONTROL_MAX_WIDTH_OFFSET: 70, // px
  PUSH_SPEED_CONTROL_MAX_WIDTH_OFFSET: 80, // px
  VELOCITY_VECTOR_CHECKBOX_MAX_WIDTH_OFFSET: 28, // px
  ACCELERATION_VECTOR_CHECKBOX_MAX_WIDTH_OFFSET: 28, // px

  TITLE_FONT_SIZE: 14,
  LABEL_FONT_SIZE: 12,
  CM_PER_M: 100,
  RADIO_OPTIONS_SPACING: 4,
  RADIO_OPTIONS_RADIUS: 7,
  PUSH_DIRECTION_GROUP_SPACING: 12,
  PUSH_DIRECTION_GROUP_RADIUS: 7,
  /** Push speed control delta (dimensionless). */
  PUSH_SPEED_CONTROL_DELTA: 0.05,
  /** Push speed control decimal places (dimensionless). */
  PUSH_SPEED_CONTROL_DECIMAL_PLACES: 2,
  /** Push speed control keyboard step (dimensionless). */
  PUSH_SPEED_CONTROL_KEYBOARD_STEP: 0.05,
  HEADING_FONT_SIZE: 12,
  CONSTRUCTOR_SPACING: 6,
} as const;

/** Settings for lab/view/TrackNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const TRACK_NODE_SETTINGS = {
  VECTOR_LABEL_RIGHT_OFFSET: 6, // px
  PLACE_LABEL_LEFT_OFFSET: 4, // px
  PLACE_LABEL_RIGHT_OFFSET: 4, // px
  UPDATE_TRACK_RIGHT_OFFSET: 4, // px
  UPDATE_CART_CENTER_X_OFFSET: 14, // px

  CART_BODY_HEIGHT: 20,
  WHEEL_RADIUS: 5,
  TRACK_THICKNESS: 6,
  BUMPER_WIDTH: 9,
  VECTOR_OFFSET: 18,
  VECTOR_SPACING: 16,
  MIN_VECTOR_LENGTH: 1.5,
  LABEL_FONT_SIZE: 12,
  /** Keyboard step for moving the cart, in px (≈ 1.4 cm). */
  CART_DRAG_DELTA: 6,
  BENCH_START_X: -20,
  BENCH_LINE_WIDTH: 2,
  FEET_WIDTH: 14,
  BUMPER_Y: -14,
  BUMPER_HEIGHT: 14,
  BUMPER_CORNER_RADIUS: 2,
  BODY_CORNER_RADIUS: 4,
  PLUS_X_ARROW_HEAD_HEIGHT: 7,
  PLUS_X_ARROW_HEAD_WIDTH: 9,
  PLUS_X_ARROW_TAIL_WIDTH: 2.5,
  PLUS_X_LABEL_FONT_SIZE: 11,
  PLUS_X_LABEL_MAX_WIDTH: 20,
  BRAKE_Y: -3,
  BRAKE_HEIGHT: 3,
  VELOCITY_ARROW_HEAD_HEIGHT: 10,
  VELOCITY_ARROW_HEAD_WIDTH: 12,
  VELOCITY_ARROW_TAIL_WIDTH: 5,
  ACCELERATION_ARROW_HEAD_HEIGHT: 10,
  ACCELERATION_ARROW_HEAD_WIDTH: 12,
  ACCELERATION_ARROW_TAIL_WIDTH: 5,
  VECTOR_LABEL_FONT_SIZE: 13,
  LOCAL_BOUNDS_MIN_X: -70,
} as const;

/** Settings for preferences/BackwardAccelerationPreferencesModel.ts. */
export const BACKWARD_ACCELERATION_PREFERENCES_MODEL_SETTINGS = {
  /** Velocity window range min (dimensionless). */
  VELOCITY_WINDOW_RANGE_MIN: 3,
  /** Velocity window range max (dimensionless). */
  VELOCITY_WINDOW_RANGE_MAX: 41,
  /** Acceleration window range min (dimensionless). */
  ACCELERATION_WINDOW_RANGE_MIN: 3,
  /** Acceleration window range max (dimensionless). */
  ACCELERATION_WINDOW_RANGE_MAX: 41,
} as const;

/** Settings for preferences/BackwardAccelerationPreferencesNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const BACKWARD_ACCELERATION_PREFERENCES_NODE_SETTINGS = {
  DESCRIPTION_LINE_WRAP: 420, // px

  LABEL_FONT_SIZE: 14,
  HEADER_FONT_SIZE: 18,
  SMOOTHING_LABEL_FONT_SIZE: 14,
  DESCRIPTION_FONT_SIZE: 12,
  RADIO_GROUP_SPACING: 6,
  CONSTRUCTOR_SPACING: 10,
} as const;

/** Settings for smart-cart/model/BluetoothSmartCart.ts. */
export const BLUETOOTH_SMART_CART_SETTINGS = {
  /** Maximum Bluetooth connection wait (ms). */
  CONNECTION_TIMEOUT_MS: 15000,
  /** PASCO sensor ids of the cart's position and force channels (datasheets). */
  POSITION_SENSOR_ID: 2027,
  /** PASCO sensor ids of the cart's position and force channels (datasheets). */
  FORCE_SENSOR_ID: 2025,
} as const;

/** Settings for smart-cart/model/SmartCartChannel.ts. */
export const SMART_CART_CHANNEL_SETTINGS = {
  /** Window used to report sample rate (ms). */
  RATE_WINDOW_MS: 1000,
  /** Consecutive failed reads after which the link is considered lost. */
  MAX_FAILURES: 5,
} as const;

/** Settings for smart-cart/model/smartCartStream.ts. */
export const SMART_CART_STREAM_SETTINGS = {
  /** Microseconds in one millisecond. */
  MICROSECONDS_PER_MILLISECOND: 1000,
  /** Raw force code at zero force (encoder counts). */
  FORCE_RAW_ZERO: 32768,
  /** Raw code at the calibration reference force (encoder counts). */
  FORCE_REFERENCE_CODE: 1000,
  /** Reference force used by the upstream Smart Cart calibration (N). */
  FORCE_REFERENCE_NEWTONS: 100,
  /** Set sample period (protocol byte). */
  SET_SAMPLE_PERIOD: 0x01,
  /** Start sampling (protocol byte). */
  START_SAMPLING: 0x06,
  /** Stop sampling (protocol byte). */
  STOP_SAMPLING: 0x07,
  /** Streamed packets carry a five-bit sequence number; anything at or above is a reply or event. */
  STREAM_SEQUENCE_MODULUS: 0x20,
  /** Acknowledge every this many packets, or the cart stops sending. */
  STREAM_ACK_INTERVAL: 8,
} as const;

/** Settings for smart-cart/view/RecordingPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const RECORDING_PANEL_SETTINGS = {
  ITEM_1_SPACING: 8, // px

  FULL_RECORDING_CHECKBOX_MAX_WIDTH_OFFSET: 30, // px
  AUTO_TRIM_BUTTON_MAX_WIDTH_OFFSET: 20, // px

  FONT_SIZE: 12,
  BUTTON_FONT_SIZE: 14,
  RECORD_BUTTON_MAX_WIDTH: 90,
  CLEAR_BUTTON_MAX_WIDTH: 90,
  TRIM_HINT_FONT_SIZE: 11,
  TRIM_FAILED_FONT_SIZE: 11,
  CONSTRUCTOR_SPACING: 6,
} as const;

/** Settings for smart-cart/view/SmartCartPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const SMART_CART_PANEL_SETTINGS = {
  ITEM_1_SPACING: 10, // px
  /** Font size for error / unsupported messages (px). */
  ERROR_FONT_SIZE: 11, // px
  /** Font size for the diagnostics readout (px). */
  DIAGNOSTIC_FONT_SIZE: 10, // px

  CHANGE_SIGN_CHECKBOX_MAX_WIDTH_OFFSET: 30, // px

  FONT_SIZE: 12,
  CONNECT_BUTTON_FONT_SIZE: 13,
  CONNECT_BUTTON_MAX_WIDTH: 100,
  CONSTRUCTOR_SPACING: 5,
  CONSTRUCTOR_FONT_SIZE: 14,
  CONSTRUCTOR_MAX_WIDTH: 100,
} as const;

/** Settings for smart-cart/view/SmartCartScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const SMART_CART_SCREEN_VIEW_SETTINGS = {
  COLUMN_SPACING: 10,
} as const;

/** Numerical settings; units are specified per value. */
export const ACQUISITION_UNITS = {
  /** Milliseconds in one second. */
  MILLISECONDS_PER_SECOND: 1000,
} as const;

BackwardAccelerationNamespace.register("BackwardAccelerationConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  GRAVITY,
  TRACK_LENGTH,
  ENCODER_RESOLUTION,
  SAMPLE_PERIOD_MS,
});
