# Backward Acceleration — model

## The handout

PHY127 Lab 02, *Backward Acceleration*. Students predict velocity–time and
acceleration–time graphs, do the experiment with a PASCO Smart Cart, graph a
smoothed version of the result, and analyse their mistakes. The lab's point is
experiment E: as the cart rolls **down** the ramp after its peak it speeds up, yet
its acceleration is **negative**, because its velocity (not its speed) is
decreasing. Checking the v–t and a–t graphs for consistency (a is the slope of v)
settles the argument.

| | Set-up | v | a |
|---|---|---|---|
| A | 4 cm incline, release from rest, +x down the track | rises linearly from 0 | constant, ≈ g·h/L ≈ +0.33 m/s² |
| B | 8 cm incline, otherwise as A | rises twice as fast | constant, about twice A |
| C | level, brake, push toward +x | positive, falls linearly to 0 | constant, negative (≈ −1 m/s²) |
| D | level, brake, push toward −x | negative, rises linearly to 0 | constant, **positive** |
| E | 4 cm incline, +x up the ramp, push up | +, through 0 at the peak, then − | negative throughout, **including at the peak and on the way down** |

## The apparatus (Lab screen)

A 1.2 m PASCO track. The left end rests on feet of height h (0–10 cm); the right end
carries an elastic bumper. Position `s` runs along the track from the left end, so
gravity's component along it is `+g sinθ` with `sinθ = h / L`. The cart is 0.16 m long.

Friction opposes the motion with magnitude `μ g cosθ`:

- rolling resistance, μ = 0.004 (always);
- the tape brake, μ = 0.1 more when fitted (≈ 1 m/s² of deceleration on a level track).

```
a = g sinθ − sign(u) μ g cosθ            (u = ds/dt ≠ 0)
```

A cart at rest stays at rest if `g sinθ ≤ μ g cosθ` (the brake holds the cart on
the 4 cm incline). Between turning points `a` is constant, so `cartPhysics.advanceCart`
advances each step exactly (`s += u t + ½ a t²`) and splits a step at the instant
`u` reaches zero, re-evaluating friction's sign there. That is why the up-and-down
run has one unbroken negative acceleration through the turning point: going up it
is `−(g sinθ + μ g cosθ)`, coming down `−(g sinθ − μ g cosθ)` — slightly smaller in
magnitude, exactly as a real track shows.

**Launch.** "Release from rest" sets `u = 0`. "Push" gives the cart the chosen speed
in the chosen direction (toward the cart's +x or −x) at t = 0: the push itself is
not simulated, because the handout graphs only the motion after the hand lets go.

**End of a run.** The cart reaching the bumper (low end), being caught at the raised
end, coming to rest for 0.4 s, the Catch button, or 20 s.

## What is measured

The Smart Cart's wheel encoder reports position along the cart's own +x arrow in
counts of 0.09895 m / 816 ≈ 0.121 mm. The virtual cart reports exactly that: every
20 ms (50 Hz, the Smart Cart's default) it records `x = ±(s − s₀)`, quantised to
whole counts, with the sign set by which way the cart's +x arrow points.

Both screens then compute, from the positions inside the release→catch window only:

- **velocity** — slope of a least-squares line through 5 samples (0.1 s) centred on
  each sample;
- **acceleration** — the same, applied to the velocity, over 11 samples (0.2 s).
  Preferences → Simulation offers 5 / 11 / 21; query parameters allow any odd window.

Acceleration is never read from the cart's accelerometer: at rest on an incline it
reads g·sinθ, which is not the kinematic acceleration the lab asks about.

## Finding release and catch (Smart Cart screen)

A real recording includes the cart sitting still, the hand's push, and the catch or
the bumper. `motionAnalysis.findRunWindow` keeps release → catch:

- **Release from rest (A, B):** just before the speed first exceeds 0.03 m/s.
- **Push (C, D, E):** the hand speeds the cart up, and afterwards only friction and
  gravity act, which slow it; release is the first peak in speed (speed falls 0.02 m/s
  below its running maximum).
- **Catch:** the cart comes to rest (speed < 0.03 m/s), or slows faster than 4 m/s²
  (a hand or the bumper; the brake gives about 1 m/s²). For E the search starts only
  after the velocity has changed sign, since the cart passes through rest at the peak.

Students can show the whole recording and drag either marker.

## The sign table

For each experiment, three phases × {velocity, acceleration}, each answered +, 0 or −.
For E the phases are moving up, at the peak, moving down (split at the sign change of
v); otherwise early, middle and late thirds of the run. "Check against the run" marks
each answer against the median of the measured value in that phase, with ±0.05 m/s and
±0.08 m/s² counting as zero. At the peak the measured velocity is zero by definition.
