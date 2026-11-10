/**
 * createRunStatusProperty.ts
 *
 * The one-line status of the virtual cart — ready, running, or why the run ended —
 * shared by the status text on the bench and the screen summary.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringManager } from "../../i18n/StringManager.js";
import { type LabModel, RunEnd, type RunEndValue, RunState } from "../model/LabModel.js";

export function createRunStatusProperty(model: LabModel): TReadOnlyProperty<string> {
  const labels = StringManager.getInstance().getLabels();
  return new DerivedProperty(
    [
      model.runStateProperty,
      model.runEndProperty,
      labels.statusReadyStringProperty,
      labels.statusRunningStringProperty,
      labels.statusStoppedStringProperty,
      labels.statusBumperStringProperty,
      labels.statusCaughtStringProperty,
      labels.statusTimeStringProperty,
      labels.statusCaughtByHandStringProperty,
    ],
    (state, end, ready, running, rest, bumper, caught, time, byHand) => {
      if (state === RunState.READY) {
        return ready;
      }
      if (state === RunState.RUNNING) {
        return running;
      }
      const reasons: Record<RunEndValue, string> = {
        [RunEnd.NONE]: byHand,
        [RunEnd.REST]: rest,
        [RunEnd.STOPPED]: byHand,
        [RunEnd.BUMPER]: bumper,
        [RunEnd.CAUGHT]: caught,
        [RunEnd.TIME]: time,
      };
      return reasons[end];
    },
  );
}
