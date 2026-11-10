# Backward Acceleration — implementation notes

## Layout

```
src/
  common/model/   Experiment, cartPhysics, kinematics, motionAnalysis, Trace, RunLibrary,
                  PredictionSketch, SignTable, PredictionNotebook, GraphScales
  common/view/    ExperimentPanel, PredictionsPanel, SignTableNode, KinematicsGraphNode, GraphArea
  lab/            virtual cart: LabModel; TrackNode, LabSetupPanel, LabScreenView
  smart-cart/     real cart: smartCartStream, BluetoothSmartCart, SmartCartChannel, SmartCartModel;
                  SmartCartPanel, RecordingPanel, SmartCartScreenView
```

## Shared state

`main.ts` builds one `PredictionNotebook` and passes it to both screens, so a
prediction drawn on the Lab screen is there to compare with the real cart. Each screen
has its own `RunLibrary` (the last run of each experiment, the trim view, the zoom).
The derivative windows come from `BackwardAccelerationPreferencesModel`, which both
`Trace`s observe (changing smoothing re-derives every run).

## One data path for both carts

Both screens produce the same thing: `Trace.addSample(t, x)` at 50 Hz, x along the
cart's +x in whole encoder counts. Everything downstream — derivatives, trimming,
graphs, sign checks — is shared. The virtual cart steps physics in ≤ 1 ms substeps and
never steps past the next 20 ms sample instant, so samples are exact positions.

`Trace` caches the full and trimmed series and marks itself changed; `RunLibrary.flush()`
(once per frame from `step`) emits `dataChangedEmitter` at most once per frame, and
`GraphArea` is the only listener that redraws graphs. Sketch changes, experiment
changes, layer visibility, and zoom also funnel into that one `refresh`.

## Graphs

`KinematicsGraphNode` is bamboo: `ChartTransform`, `ChartRectangle`, grid and tick sets,
`LinePlot` for the measured run and the other runs, and two `Path`s for the sketch
layers (dashed red individual, dotted purple group). Sketch strokes are stored in model
units and re-projected on every refresh, so zooming keeps them in place. A `DragListener`
on the plot rectangle draws when Predictions → draw mode is not "Don't draw".

Value zoom is per quantity, time zoom is shared; `GraphScales.fitPreset` picks ±2 m/s²
for the braked experiments and ±1 m/s² otherwise whenever the experiment changes.

## Smart Cart link

Copied from CartCollisions (`src/smart-carts/model/`), single cart. `pasco-ble` handles
discovery, connection and command writes; the cart's own sampler is started with
`[0x01, period µs]` per sensor service and `[0x06, period ms × channels]` on service 0,
and packets are acknowledged every 8. One-shot reads must not be used: they return no
live encoder count. `pasco-ble` is loaded lazily the first time the Smart Cart screen's
model is built in a browser with Web Bluetooth. `SmartCartChannel.connect()` never
rejects; every outcome lands on its properties for the panel to show.

## Accessibility

Every control has an `accessibleName` from `a11y.controls`. The sketch is pointer-only;
the sign table (buttons that cycle ?, +, 0, − and announce "quantity, phase: answer") is
the keyboard path for a prediction, and "Check against the run" gives the same feedback.
The cart and the trim markers use `RichDragListener` (arrow keys, Shift for fine steps).
