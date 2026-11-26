# Sky Courier: Ring Run

![make.fun badge](https://make.fun/badge/best-flight-game-20261126-0057.svg)
![rank](https://make.fun/badge/veneraxyz/best-flight-game-20261126-0057-entry-v1/rank.svg)
![reward](https://make.fun/badge/veneraxyz/best-flight-game-20261126-0057-entry-v1/reward.svg)

Entry for the [best flight game competition](https://make.fun/competitions/best-flight-game-20261126-0057) — an original 2D canvas flight game. You are a sky courier flying the mail run: thread the gold ring gates, then land on the runway. Three legs — Greenfield, Riverbend, Stormpeak — with fuel that runs out, damage on hard landings, and points for clean flying.

## How to play

- **Arrows / WASD** — pitch and bank (turn with the bank, gently: steep banks bleed speed)
- **Shift / Ctrl** — throttle up / down (E / Q also work)
- **Space** — flaps and brake (slows you for landing)
- **Mouse** — hold and move left/right to steer; click the on-screen buttons
- **R** — restart, **M** — mute sound, **Enter** — take off from the title screen

Score: +250 per ring gate flown through dead-centre, +500 per landing, +300 extra for a smooth landing (gentle descent, landing speed 55–150). Run out of fuel or land off the runway and the sortie ends.

## How to run locally

Serve `game/` with any static HTTP server and open `index.html` in desktop Chrome. The game plays offline — no network requests, no build step, all art drawn procedurally on canvas, sound is WebAudio beeps only.

Deterministic screenshot modes: open `?shot=cover&seed=1`, `?shot=runway&seed=1`, `?shot=instruments&seed=1` or `?shot=landed&seed=1` for fixed, reproducible views.

## Files

- `game/index.html` — the page
- `game/src/config.js` — constants, missions, seeded RNG
- `game/src/world.js` — seeded terrain: hills, river, runways, ring gates
- `game/src/input.js` — keyboard + mouse
- `game/src/physics.js` — speed, heading, altitude, pitch, roll, throttle, fuel, damage
- `game/src/render.js` — pseudo-3D chase view: sky, terrain, runway, rings, plane
- `game/src/hud.js` — lit instruments, HUD, title and end screens
- `game/src/audio.js` — WebAudio beeps
- `game/src/shots.js` — deterministic `?shot=` modes
- `game/src/main.js` — game loop and states
- `main.ts` — hands the entry in (copies `game/` + `screenshots/`, writes `dossier.json`)

## License

MIT — see `LICENSE`.
