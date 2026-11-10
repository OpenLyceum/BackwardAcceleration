/**
 * BackwardAccelerationColors.ts
 *
 * Defines all dynamic colors for the simulation using ProfileColorProperty.
 *
 * Each color has two profiles:
 *   - "default"   — used in standard (dark) mode
 *   - "projector" — used when the user enables Projector Mode in Preferences
 *
 * SceneryStack switches profiles automatically; no manual toggling is needed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * Import BackwardAccelerationColors and pass properties directly to Node's fillProperty or
 * strokeProperty options:
 *
 *   import BackwardAccelerationColors from "../../BackwardAccelerationColors.js";
 *
 *   new Rectangle( 0, 0, 100, 50, {
 *     fillProperty: BackwardAccelerationColors.backgroundColorProperty,
 *   });
 *
 * ── How to add a color ────────────────────────────────────────────────────────
 * Add a new ProfileColorProperty entry to the BackwardAccelerationColors object below.
 * Always provide both "default" and "projector" values.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import BackwardAccelerationNamespace from "./BackwardAccelerationNamespace.js";

const BackwardAccelerationColors = {
  /**
   * Background color for the simulation screen.
   * Deep navy in default mode; white in projector mode.
   */
  backgroundColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "background", {
    default: "#1a1a2e",
    projector: "#ffffff",
  }),

  /**
   * Primary accent color for highlights, selected items, and key UI elements.
   * Sky blue in default mode; dark navy in projector mode.
   */
  accentColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#1a1a2e",
  }),

  /**
   * Background fill for control panels and dialogs.
   * Deep blue in default mode; light gray in projector mode.
   */
  panelBackgroundColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "panelBackground", {
    default: "#16213e",
    projector: "#f5f5f5",
  }),

  /**
   * Border/stroke color for control panels and dialogs.
   * Teal-navy in default mode; medium gray in projector mode.
   */
  panelBorderColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "panelBorder", {
    default: "#0f3460",
    projector: "#999999",
  }),

  /**
   * Text color for labels, readouts, and general UI text.
   * Near-white in default mode; near-black in projector mode.
   */
  textColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays light
  // in both profiles; its text stays dark. Same values in default and projector mode,
  // but defined here so every color lives in one themeable place.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(
    BackwardAccelerationNamespace,
    "controlSurfaceDisabled",
    {
      default: "#cccccc",
      projector: "#cccccc",
    },
  ),

  /** Text on light control surfaces: combo items, flat-button labels, field values, preferences. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),

  // ── Graphs ──────────────────────────────────────────────────────────────────

  /** Plot-area fill of the v–t and a–t graphs (white in both profiles, like lab graph paper). */
  graphBackgroundColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "graphBackground", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  graphGridColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "graphGrid", {
    default: "#dddddd",
    projector: "#dddddd",
  }),

  /** Graph border, zero line and tick labels. */
  graphAxisColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "graphAxis", {
    default: "#333333",
    projector: "#333333",
  }),

  /** Measured run — the handout's "blue / solid line". */
  measuredColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "measured", {
    default: "#1565c0",
    projector: "#0d47a1",
  }),

  /** Each student's own prediction — the handout's "red / dashed line". */
  individualPredictionColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "individualPrediction", {
    default: "#d32f2f",
    projector: "#c62828",
  }),

  /** The group's consensus prediction — the handout's "dotted line". */
  groupPredictionColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "groupPrediction", {
    default: "#7b1fa2",
    projector: "#6a1b9a",
  }),

  /** Other experiments' runs, drawn faintly behind the current one. */
  otherRunsColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "otherRuns", {
    default: "#9e9e9e",
    projector: "#9e9e9e",
  }),

  /** Shading over the parts of a full recording outside release → catch. */
  trimShadeColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "trimShade", {
    default: "rgba(120,120,120,0.25)",
    projector: "rgba(120,120,120,0.25)",
  }),

  /** Draggable release / catch markers. */
  trimHandleColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "trimHandle", {
    default: "#ef6c00",
    projector: "#e65100",
  }),

  // ── Track and cart ──────────────────────────────────────────────────────────

  trackColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "track", {
    default: "#b0bec5",
    projector: "#78909c",
  }),

  trackFeetColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "trackFeet", {
    default: "#607d8b",
    projector: "#455a64",
  }),

  bumperColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "bumper", {
    default: "#ffb300",
    projector: "#ff8f00",
  }),

  cartBodyColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "cartBody", {
    default: "#e53935",
    projector: "#c62828",
  }),

  cartWheelColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "cartWheel", {
    default: "#212121",
    projector: "#212121",
  }),

  /** The +x arrow printed on the cart. */
  cartArrowColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "cartArrow", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  brakeColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "brake", {
    default: "#c8b98a",
    projector: "#a1887f",
  }),

  velocityVectorColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "velocityVector", {
    default: "#42a5f5",
    projector: "#1565c0",
  }),

  accelerationVectorColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "accelerationVector", {
    default: "#66bb6a",
    projector: "#2e7d32",
  }),

  // ── Feedback ────────────────────────────────────────────────────────────────

  correctColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "correct", {
    default: "#66bb6a",
    projector: "#2e7d32",
  }),

  incorrectColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "incorrect", {
    default: "#ef5350",
    projector: "#c62828",
  }),

  warningColorProperty: new ProfileColorProperty(BackwardAccelerationNamespace, "warning", {
    default: "#ffb74d",
    projector: "#e65100",
  }),
};

export default BackwardAccelerationColors;
