# AGENTS.md — Backward Acceleration

Sim-specific context for AI assistants. General SceneryStack guidance:
[OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

Supports the PHY127 lab handout *Backward Acceleration* (Lab 02, velocity and
acceleration with sensors, group carts). Students sketch velocity–time and
acceleration–time predictions (their own in red / dashed, the group's dotted),
run the experiment, and compare with the measured run (blue / solid):

| | Experiment |
|---|---|
| A | release from rest on a 4 cm incline, +x arrow down the track |
| B | the same on an 8 cm incline (compare with A) |
| C | tape brake, level track, brief push toward +x |
| D | tape brake, level track, brief push toward −x |
| E | +x arrow up a 4 cm ramp; push up, it peaks and rolls back down — **a < 0 throughout** |

The **Lab** screen does this with a virtual Smart Cart (true-to-scale 1.2 m track,
feet, bumper, brake, push speed, v and a vectors). The **Smart Cart** screen does it
with one real PASCO ME-1240 Smart Cart over Web Bluetooth. Predictions and the sign
table are shared by both screens (one `PredictionNotebook`, built in `main.ts`).

Physics and measurement model: [`doc/model.md`](doc/model.md). Architecture and the
hardware link: [`doc/implementation-notes.md`](doc/implementation-notes.md). Read both
before changing model code.

## Key files

| File | Purpose |
|---|---|
| `src/common/model/Experiment.ts` | The five experiments and their track presets |
| `src/common/model/cartPhysics.ts` | Pure 1-D cart on an incline with rolling + brake friction; exact piecewise steps, split at v = 0 |
| `src/common/model/kinematics.ts` | Centred least-squares differentiator (v from x, a from v), encoder quantisation, median |
| `src/common/model/Trace.ts` | One run: t, x along the cart's +x; release→catch window; v and a derived **inside the window only** |
| `src/common/model/motionAnalysis.ts` | Finds release and catch in a recording; measured signs per phase for the sign table |
| `src/common/model/RunLibrary.ts` | Per screen: selected experiment, last run of each experiment, full/trimmed view, graph zoom |
| `src/common/model/PredictionNotebook.ts` | Sketches (`PredictionSketch`) and sign tables (`SignTable`) per experiment — **shared by both screens** |
| `src/common/view/KinematicsGraphNode.ts` | bamboo v–t / a–t graph: other runs, measured, group and individual sketches, freehand drawing, trim markers |
| `src/common/view/GraphArea.ts` | Both graphs, zoom buttons, legend; the single place that triggers redraws |
| `src/common/view/SignTableNode.ts` | Cycle-button sign table with check-against-run marks (also the keyboard way to predict) |
| `src/lab/model/LabModel.ts` | Virtual cart: presets, go / catch / return, 50 Hz encoder sampling, run end detection |
| `src/lab/view/TrackNode.ts` | Track, feet, bumper, cart with +x arrow, brake, vectors; drag to set the start |
| `src/smart-cart/model/*` | Smart Cart link copied from CartCollisions (`smartCartStream`, `BluetoothSmartCart`, `SmartCartChannel`, …) |
| `src/smart-cart/model/SmartCartModel.ts` | One cart: record / stop / clear, auto-trim on stop |

## Model notes

- **Acceleration comes from the encoder, never the accelerometer.** An accelerometer
  at rest on an incline reads g·sinθ; the lab is about kinematic acceleration.
- **Derivatives are taken inside the release→catch window.** Differentiating the
  whole recording would smear the hand push and the catch into the first and last
  0.1–0.2 s of the run through the smoothing window.
- **The Smart Cart must stream.** One-shot `pasco-ble` reads return no live encoder
  count; keep `smartCartStream.ts` / `BluetoothSmartCart.ts` in step with CartCollisions.
- **Reset All also clears the shared notebook** (predictions on both screens).
- The virtual push is not simulated: the run starts the instant the hand lets go,
  which is where the handout says graphs start.

## Accessibility

Three layers per Baton/ACCESSIBILITY.md: every control has an `accessibleName` from
`a11y.controls`; each screen has a live `*ScreenSummaryContent` (Lab: experiment,
incline, brake, run status; Smart Cart: experiment, connection, last run length);
traversal order is set by a `pdomOrder` wrapper with Reset All last. The cart and the
release / catch markers are `RichDragListener`s (left/right keys, Shift for fine
steps). Freehand sketching is pointer-only; the **sign table is its keyboard
equivalent** (each cell is a button announcing quantity, phase and answer).

## Compliance carve-outs

- `tests/generators.test.ts` removed: it tested the template's `rename` /
  `scaffold-screens` scripts, which `check-template-drift --fix` removes from a sim.
- `TimeModel` removed: the Lab model keeps its own run clock (sampling on a 20 ms grid
  inside 1 ms physics substeps); the Smart Cart screen has no clock.
- `pasco-ble` is appended after the shared dependency block (same pin as CartCollisions).

### Template-owned files (drift-checked)

Infrastructure files are owned by this template and must stay byte-identical in every sim
(after substituting the sim's own name). `Baton/scripts/check-template-drift.sh <Sim>` compares a
sim against this repo using `Baton/config/template-manifest.json`, which lists the exact files,
the required `package.json` scripts, and the few keys a sim may extend (extra `biome.json`
ignores, extra tsconfig `types`, CSP/Permissions additions).

To diverge on purpose, add a bullet to the sim's own `## Compliance carve-outs` section naming
the file in backticks and the reason, e.g. ``- `tests/setup.ts`: adds a WebGPU mock``. The drift
checker treats a file named there as approved. Fix template-owned files **here first**, then
propagate — never hand-edit one in a single sim.

Toolkit exports that only some sims use (`BackwardAccelerationButtonOptions.ts`, `BackwardAccelerationControlOptions.ts`, the
`memoryLeak.ts` helpers) carry a `@public` JSDoc tag so dead-code checkers such as knip do not
report them as unused in the sims that skip them. Tag any new toolkit export the same way.

### `package.json` overrides

JSON cannot carry comments, so the rationale for forced transitive pins lives here. Prefer
**tilde (`~`) or exact** versions — caret (`^`) lets minors drift under what is meant to be a
hard pin. Dependabot ignores these three names (see `.github/dependabot.yml`) so it does not
open PRs that fight the overrides. Revisit when SceneryStack drops or re-pins them upstream.

| Override | Pin | Why |
|---|---|---|
| `lodash` | `~4.18.1` | SceneryStack declares `~4.17.12`. Bump clears Dependabot/npm advisories patched in 4.18.x (e.g. GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh). |
| `three` | `~0.125.2` | SceneryStack declares `^0.104.0`. Floor is 0.125.0 for GHSA-fq6p-x6j3-cmmq (ReDoS). Staying on the 0.125 line avoids a larger API jump; **0.125.x still has open CVEs** (e.g. XSS GHSA-7vvq-7r29-5vg3, fixed only in ≥0.137.0). Remove this override if/when SceneryStack stops depending on `three` or pins a patched line itself. |
| `brace-expansion` | `~5.0.12` | Transitive via `vite-plugin-pwa` / Workbox. Clears npm audit (originally GHSA-mh99-v99m-4gvg; keep ≥5.0.9 for GHSA-rgw5-rvv9-x895; ≥5.0.12 for the CPU-DoS advisory). |

## Testing

| Path | Purpose |
|---|---|
| `tests/common/cartPhysics.test.ts` | g·h/L on an incline, B ≈ 2×A, brake opposes v both ways, static hold, E turns around with constant a |
| `tests/common/kinematics.test.ts` | Differentiator exact on a parabola; robust to encoder quantisation |
| `tests/common/motionAnalysis.test.ts` | Release / catch found for release-from-rest, braked push, and up-and-down runs; phase signs |
| `tests/lab/LabModel.test.ts` | Experiments A–E end to end through the sampled trace |
| `tests/smart-cart/*.test.ts` | Stream protocol decoding, channel connect / zero / Change Sign, model record → auto-trim |
| `tests/memory-leak.test.ts` | `describeDisposalLeaks` for sketch, sign table, notebook, scales, trace, run library, preferences, Smart Cart model |
| `tests/fuzz/fuzz.spec.ts` | Template-owned pointer + keyboard fuzz |

## Commands

```bash
npm run lint && npm run check && npm test && npm run build
```

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run build:single` | Single-file build mode |
| `npm run check` | TypeScript (`tsc --noEmit` on app, scripts, and tests) |
| `npm run lint` / `npm run fix` | Biome check / auto-fix |
| `npm test` | Vitest unit tests |
| `npm run test:fuzz` | Playwright fuzz smoke (pointer + keyboard, `?ea`, 30s each) |
| `npm run test:fuzz:quick` | 10s fuzz |
| `npm run icons` | Regenerate PWA icons; seed missing screenshots, preserve existing ones |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |

Query parameters: `velocityWindow`, `accelerationWindow` (odd, 3–41 samples),
`smartCartPeriod` (ms, default 20), `showDiagnostics` (Smart Cart stream statistics).
