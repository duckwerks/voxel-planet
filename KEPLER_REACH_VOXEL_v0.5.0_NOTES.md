# Kepler Reach // Voxel v0.5.0 — Notes

`KEPLER-REACH_VOXEL_v0.5.0.js` is a new voxel-native engine, not a patch of v0.4.x. It is one file (168 KB, ~1,970 lines) loaded the same way as before (three.js r160 from a CDN, `window.KeplerReach` API).

**Evidence labels:** **[Harness]** = ran headless (real script and real three.js, stub renderer, simulated 60 fps). **[Screenshot]** = rendered by a small CPU rasteriser I wrote, so I could actually see the voxels. **[Not browser verified]** = never run on a GPU, a phone, or in your CyTube room.

---

## 1. What "all voxels" means, system by system

| System | How it is voxel-based |
|---|---|
| **Planets & moons** | Chunked voxel grids (16³ chunks, 1 m voxels). Terrain is a seeded heightfield on a cube-sphere, voxelised on demand, with craters, oceans and biomes. Far views use 4 m "mega-voxels"; up close, 1 m voxels replace them. |
| **Stations** | Finite voxel bodies (0.5 m voxels): The Last Stop (bar, jail, apron), Solar Commons (glass dome, garden, dock), and a generic station for procedural systems. |
| **Models** | Ship, rover, every NPC, buildings, trees, piers, the spaceport, portals and the star are voxel models (0.25 m–1 m voxels), built in code. |
| **Collision** | Every shape is voxel occupancy. Characters use collision points derived from their own voxel model. The ship's hull points come from its voxels and collide with **every** body, stations included. |
| **Physics** | Gravity is computed from voxel mass (`g = G·M/r²`), including the Kinetic Field jetpack, swimming, step-up over 1-voxel ledges, and falling debris. |
| **Mass** | Planet mass comes from its voxel volume × bulk density, so Haven gives g ≈ 10.4 and Luna ≈ 1.6. Digging removes planet mass. Characters and ship have mass from their voxels. Ship acceleration is thrust ÷ mass, so cargo makes it sluggish. |
| **Camera** | Third and first person. The camera's occlusion ray is a voxel traversal through every body, so it can't clip through terrain or walls. |
| **NPCs** | Voxel humanoids (Benis, Mia, Moon Man, Sancho, Lemmy, Juno). They patrol, wander or idle using the same intent object as players. |
| **Universe** | Seeded and deterministic: each integer coordinate is a system (star, 2–4 planets, moons, a station, three portal gates to neighbours). Fly or jetpack through a gate ring to warp. A return gate always exists. |

Structures (pads, shops, houses) are snapped to the voxel grid's axes, so floors and walls are flat voxels instead of stair-stepped. The original screenshots showed a jagged pad; this fixed it.

## 2. Characters, controllers and the API

Every character is an `Actor` with one `intent` object. A human, a script, an LLM agent, or an NPC brain all write that same object, so **Benis can be played by any of them**. Unlike v0.4.x, multiple characters exist as separate bodies, so an agent can drive Benis while a human plays the Explorer.

```js
KeplerReach.characters.claim("benis", {controller:"agent", by:"MyAgent"})   // human keeps their own character
await KeplerReach.agent.command({ as:"benis", intent:{forward:1, turn:-0.3}, hold:1000 })
KeplerReach.actions.run("dig", {}, {as:"benis"})
KeplerReach.state({as:"benis"})        // position, destinations, vision.lookingAt, inventory, events...
KeplerReach.warp([1,0,0])              // or fly through a gate
```

- `state()` now includes `destinations` (every pad, station, planet and portal with distance and bearing), `vision.lookingAt` (what's in front of you), `inventory`, and `events`.
- Agent claims lock human input only on the claimed character; after 20 s without agent input control returns to the human (or the NPC brain).
- `registerControllable()`, `characters.add()`, `actions.define()` and `universe.describe(coords)` support extension.

Controls: WASD move/turn, Q/E strafe, Space jump (hold in the air = Kinetic Field), Shift sprint/brake, arrows look/pitch, B board/leave, L landing assist (`{pad:id}` to choose), X dig, C place, F talk, V view, R recentre, P park, H help. Yaw means the same thing in every mode: **turn +1 = right** (this fixes the mirrored Kinetic Field yaw from v0.4.x).

## 3. What I verified

**[Harness]** (0 exceptions across all runs):
- Voxel core: heightfield matches voxels; raycast, digging and mass; structures stamped; craters carve the moon.
- Gravity from voxel mass: Haven 10.4, Luna 1.64.
- Walk 5.2 m/s over voxel terrain; jump apex 2.5 m; enter buildings by their doors; Kinetic Field engage, climb, descend; swim; dig → debris → cargo; NPC patrols.
- Ship: board, thrust, **collides with the station** (stopped 22 m from the bar's centre), landing assist at Haven, Luna and a procedural planet, disembark, re-board.
- Rover: board and drive on Luna.
- Warp through a gate to a procedural system, land on its planet, walk around.
- Performance: mean ~1.5–2 ms/frame of JavaScript (no GPU). The first system takes ~5 s to generate; a warp takes ~1 s.

**[Screenshot]** (CPU rasteriser, in `voxel_screenshots/`): Haven pad with shops and sea, the Last Stop, the ship on its pad, Benis, the voxel sun, Haven from afar.

## 4. Not done / not verified

- **Not browser verified at all:** real rendering, input feel, touch pads (written but untested), mobile performance, your CyTube room.
- **Not ported from v0.4.x:** Lemmy's Ranch economy, quests, shop buying, fauna, dialogue trees, Whizz's dance house, the wildlife habitat, jetski and boat, the shore-dock gameplay. The structures exist as voxels; the gameplay on them does not.
- **Known visual limits:** the level-of-detail swap shows seams; digging isn't visible from far away; terrain uses value noise, so it has some banding; the sky is a plain background with stars.
- **Design limits:** only planetary ground can be dug (stations are protected); water physics is simple; no multiplayer, no persistence.
- **Authority:** the API and claims are client-side, so they are spoofable. Real ownership needs a server.

## 5. Suggested next steps

1. Play it in a browser (desktop first), then a phone inside the CyTube room. Tell me what looks or feels wrong.
2. Port gameplay back onto the voxel structures (shops, quests, ranch) as data-driven systems rather than hand-coded branches.
3. Replace value noise with gradient noise and add a proper atmosphere and sky.
4. Move claims and the world state server-side before any multiplayer.
