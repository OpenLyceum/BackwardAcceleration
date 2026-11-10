# Backward Acceleration

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

Predict, then measure, the velocity–time and acceleration–time graphs of a cart:
released down an incline, slowed by a brake on a level track, and pushed up a ramp
so that it rolls back down — with a virtual cart or a real PASCO Smart Cart over
Web Bluetooth. Built for the PHY127 lab *Backward Acceleration*.

## Features

- **Five experiments from the handout**: 4 cm and 8 cm inclines (A, B), braked pushes
  toward +x and −x (C, D), and up-and-down the ramp (E), where the acceleration stays
  negative while the cart speeds up on the way down
- **Lab screen**: a true-to-scale virtual Smart Cart with track feet, tape brake,
  bumper, push speed and direction, velocity and acceleration vectors, slow motion
  and single-step
- **Smart Cart screen**: one PASCO ME-1240 Smart Cart streaming its encoder at 50 Hz;
  the run is trimmed automatically to release → catch, with draggable markers
- **Predictions on the graphs**: draw your own (red, dashed) and your group's
  (dotted), then compare with the measured run (blue, solid); overlay other runs
- **Sign table** for each phase of the motion, checked against the run
- Velocity and acceleration from the encoder by centred least squares, with
  adjustable smoothing; English, Spanish, and French; default and projector color
  profiles; installable PWA

## Quick Start

```bash
npm install
npm start        # dev server → http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest unit tests (includes memory-leak suite) |
| `npm run test:fuzz` | Optional Playwright fuzz smoke: pointer (`?fuzz`) + keyboard (`?fuzzBoard`), with `?ea`, 30s each |
| `npm run test:fuzz -- 90` | Same fuzz for 90 seconds (`--duration 90` or `FUZZ_DURATION=90` also work) |
| `npm run test:fuzz:quick` | Shorter fuzz smoke (10s) |
| `npm run test:fuzz:long` | Longer fuzz smoke (300s) |
| `npm run check` | TypeScript type check |
| `npm run lint` | Biome lint check |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg` |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |
| `npm run clean` | Remove `dist/` |

The Smart Cart screen needs Chrome or Edge (Web Bluetooth) on `https://` or `localhost`.
Query parameters: `?accelerationWindow=21`, `?velocityWindow=7`, `?smartCartPeriod=20`,
`?showDiagnostics`.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [SceneryStack](https://scenerystack.org/) | ^3.0.0 | Simulation framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | ^7 | Type-safe JavaScript |
| [Biome](https://biomejs.dev/) | ^2.5 | Linting + formatting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^2 | PWA + service worker |
| [pasco-ble](https://www.npmjs.com/package/pasco-ble) | 0.3.70 | PASCO Smart Cart connection over Web Bluetooth |

## License

GNU Affero General Public License v3.0 — see [OpenLyceum org license](https://github.com/OpenLyceum/.github/blob/main/LICENSE).

## Contributing

See [OpenLyceum contributing guidelines](https://github.com/OpenLyceum/.github/blob/main/CONTRIBUTING.md).
Report bugs via GitHub Issues; use org issue templates.
