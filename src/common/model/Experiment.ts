/**
 * Experiment.ts
 *
 * The five cart experiments of the "Backward Acceleration" lab handout, and the
 * track set-up each one calls for. The virtual Lab screen loads a preset when the
 * student picks an experiment; the Smart Cart screen uses the experiment only to
 * label the run, to find the release and catch in the recording, and to choose
 * which sign-table columns apply.
 *
 *   A  release from rest, 4 cm incline, +x arrow down the track
 *   B  release from rest, 8 cm incline, +x arrow down the track
 *   C  brake on, level track, brief push toward +x
 *   D  brake on, level track, brief push toward −x
 *   E  +x arrow up a 4 cm incline, push up; the cart peaks and rolls back down
 */

export const Experiment = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  E: "E",
} as const;

export type ExperimentValue = (typeof Experiment)[keyof typeof Experiment];

export const EXPERIMENTS: readonly ExperimentValue[] = [
  Experiment.A,
  Experiment.B,
  Experiment.C,
  Experiment.D,
  Experiment.E,
];

/** How the cart starts moving: let go from rest, or a brief push and then let go. */
export const LaunchMode = {
  RELEASE: "release",
  PUSH: "push",
} as const;

export type LaunchModeValue = (typeof LaunchMode)[keyof typeof LaunchMode];

export type ExperimentPreset = {
  /** Height of the track feet under the raised (left) end, in m. */
  readonly inclineHeight: number;
  readonly brake: boolean;
  /** True when the cart's +x arrow points down the track (to the right). */
  readonly arrowDownTrack: boolean;
  readonly launchMode: LaunchModeValue;
  /** For a push: true when the push is toward the cart's +x. */
  readonly pushTowardPlusX: boolean;
  /** For a push: the cart's speed when the hand lets go, in m/s. */
  readonly pushSpeed: number;
  /** Where the cart's centre starts, measured along the track from its left end, in m. */
  readonly startPosition: number;
  /** True when the cart is expected to turn around during the run (experiment E). */
  readonly reverses: boolean;
};

export const EXPERIMENT_PRESETS: Readonly<Record<ExperimentValue, ExperimentPreset>> = {
  A: {
    inclineHeight: 0.04,
    brake: false,
    arrowDownTrack: true,
    launchMode: LaunchMode.RELEASE,
    pushTowardPlusX: true,
    pushSpeed: 0.6,
    startPosition: 0.15,
    reverses: false,
  },
  B: {
    inclineHeight: 0.08,
    brake: false,
    arrowDownTrack: true,
    launchMode: LaunchMode.RELEASE,
    pushTowardPlusX: true,
    pushSpeed: 0.6,
    startPosition: 0.15,
    reverses: false,
  },
  C: {
    inclineHeight: 0,
    brake: true,
    arrowDownTrack: true,
    launchMode: LaunchMode.PUSH,
    pushTowardPlusX: true,
    pushSpeed: 0.8,
    startPosition: 0.2,
    reverses: false,
  },
  D: {
    inclineHeight: 0,
    brake: true,
    arrowDownTrack: true,
    launchMode: LaunchMode.PUSH,
    pushTowardPlusX: false,
    pushSpeed: 0.8,
    startPosition: 1.0,
    reverses: false,
  },
  E: {
    inclineHeight: 0.04,
    brake: false,
    arrowDownTrack: false,
    launchMode: LaunchMode.PUSH,
    pushTowardPlusX: true,
    pushSpeed: 0.7,
    startPosition: 1.0,
    reverses: true,
  },
};
