# Kepler Reach v0.4.05 — Travel, Kinetic Field, and Spacecraft Review

**Review date:** 2026-11-25  
**Reviewed release:** `KEPLER-REACH_v0.4.05.js`  
**Source commit:** `bbc0fd7c954f96b00a61639cb89d8c1517a927bb`  
**Source blob:** `bb9289583fa17bb7344cb31f1edc610be05caee8`  
**Related architecture:** `docs/architecture/KEPLER_REACH_ARCHITECTURE_AND_ROADMAP_v1.0.md`  
**Related acceptance checklist:** `docs/architecture/KEPLER_REACH_ENGINEERING_ACCEPTANCE_AND_RELEASE_CHECKLIST_v1.0.md`

> **Evidence boundary:** This is a source audit informed by the recorded CyTube test reports and user observations. I could not operate the live CyTube room or control the game in this review environment. Therefore, I did **not** fly the Kinetic Field routes or pilot the spacecraft during this review. No statement below should be mistaken for a fresh browser, CyTube, or mobile playtest. The requested route playtest remains outstanding.

---

## 1. Executive assessment

Kepler Reach has made real progress toward a unified physical environment: it has gravity-field queries, support-surface sampling, moving-support handling, collision movement resolution, spatial broadphase indexing, and a distinct personal-flight controller. The spacecraft controller also retains the approved direct, nose-relative arcade handling.

However, the current Kinetic Field implementation still has a conceptual weakness: it treats a change in the **gravity up-vector** as though that were the same thing as changing the complete **environmental coordinate frame**. Those are not equivalent. A frame also has an origin and a transform that can translate and rotate over time. The current code transports the flight-forward vector when up changes, but does not consistently carry the flying character with a moving station frame or preserve an explicit frame owner through transitions.

This is a credible architectural defect and a strong candidate for the reported surface-dependent behavior, but it is not yet a proven explanation for every symptom. v0.4.05's quaternion adjustment was too narrow to establish that the underlying problem was solved.

**Recommendation:** do not add another isolated gravity-vector patch. Introduce and test a small, explicit movement-frame contract shared by walking and Kinetic Field. Preserve spacecraft flight and the approved mobile control layout. Complete the route test matrix before declaring the travel layer reliable.

## 2. What is good

### 2.1 Spacecraft handling has a clear, proven design target

The spacecraft controller uses nose-relative translation and direct arcade movement rather than accumulating unwanted inertia. Forward/reverse and lateral translation are derived from the ship's local nose and right vectors. This is consistent with the approved v0.3.30 control behavior and the user's positive assessment of that control scheme.

The source keeps spacecraft flight in a separate `updateFlight()` path. That separation is useful: personal flight can be repaired without casually redesigning ship handling.

### 2.2 There is now a meaningful physical foundation

The source contains:
- Radial gravity fields for Haven and Luna.
- Directional box gravity fields for Last Stop and Solar Commons.
- Support-surface registration and gravity-relative surface sampling.
- Solid movement resolution with adaptive substeps and slide handling.
- A spatial hash for collision candidate selection.
- Moving-support transform tracking for grounded characters.
- Explicit landing paths for Solar Commons and Last Stop, plus generic structural and planetary landing paths.

These are useful building blocks. They are not yet proof of a complete unified character physics system, but they are more than decorative metadata.

### 2.3 The code has useful diagnostics

The collision broadphase and movement-sweep counters can help answer whether a character is testing too many colliders, encountering blocked movement, or repeatedly attempting step-ups. Instrumentation is a good investment if the measurements are exposed in a practical way during actual play.

### 2.4 The project has an appropriate verification standard

The architecture and acceptance documents correctly distinguish source presence, static verification, harness verification, browser verification, CyTube verification, mobile verification, and regression verification. They also explicitly require that untested behavior be marked as untested.

That distinction matters here: the source has evolved quickly, but most releases after the user's v0.3.85 confirmation have not been tested in the live CyTube environment.

## 3. What is bad

### 3.1 Kinetic Field does not own a complete movement frame

In `updateKineticFieldFlight()`, the controller:
1. Finds the nearest celestial body.
2. Queries a gravity field at the player's world position.
3. Chooses either the field's up-vector or the nearest body's up-vector.
4. Rotates `playerFlightForward` from the previous `playerUp` to the new `gravityUp` when those vectors differ.
5. Copies the new up-vector into `playerUp`.

This transports attitude between two up-vectors. It does not transport the full frame's origin, orientation, or velocity. Two environments can have the same up-vector and still have different positions, headings, and motion. A gravity field can also move while its up-vector remains nearly unchanged.

The local variable `stationDeck` is calculated but unused. That is a sign that the controller recognizes a directional station field but does not yet use an explicit station-frame policy.

### 3.2 Moving-world handling stops when personal flight begins

`advanceAstronomy()` carries the player with a station, planet, or moon only while the player is on foot and **not** in Kinetic Field flight. When the player launches, the carry root is no longer selected.

Meanwhile, the Solar Commons orbit and habitat ring continue to advance. This means a character in personal flight is no longer explicitly attached to the moving environment frame. The station gravity field is queried from the station's current transform, while the player's position is advanced in world space.

This is a concrete frame-consistency gap. It is especially relevant around orbiting or rotating environments. It does not, by itself, prove the precise symptom the user experienced.

### 3.3 Gravity transitions are inferred from one vector

A shortest-arc quaternion between old up and new up is useful for avoiding a sudden tilt, but it cannot determine the intended heading around the up-axis. When up remains the same, it does nothing—even if the environment's local north/forward direction or origin has changed.

A robust transition must use the previous and current **full frame transforms**, not just two up-vectors.

### 3.4 The personal-flight movement model is still rudimentary

The current Kinetic Field path applies direct forward/strafe translation while thrusting and a gravity-scaled downward speed when not thrusting. It resolves solid movement, but it is not yet a complete flight model with:
- Explicit frame-relative velocity.
- Moving-frame velocity inheritance.
- Defined behavior at gravity-field boundaries.
- Explicit zero-gravity behavior.
- A transition policy for overlapping fields.
- A reliable frame handoff when leaving a station's field and entering planetary gravity.

This may be perfectly acceptable as an arcade ability, but its coordinate-frame behavior must still be coherent.

### 3.5 Landing code is destination-aware in several places

Solar Commons and Last Stop have explicit local-coordinate landing checks. Other structural landings use the generic support sampler, and planetary landings use a separate terrain path.

Some destination-specific handling is reasonable for landing zones and local rules. The risk is allowing those special cases to become separate movement systems with different assumptions. The architecture document explicitly says destinations should provide data and local rules, not physics forks.

## 4. The ugly: the assumptions that can mislead us

1. **A successful syntax check is not a successful journey.** It says nothing about whether a player can fly from one body to another, orient correctly, land, disembark, or take off again.
2. **A gravity up-vector is not a coordinate frame.** Treating them as interchangeable can create bugs that appear to depend on the last surface or station where flight was activated.
3. **A moving station is not a static platform.** If the station changes transform while the player is detached from its frame, the field, landing zone, and player can disagree about where the environment is.
4. **One successful landing does not validate all landing paths.** Solar Commons, Last Stop, L'Astrolabe, Haven, and Luna exercise different combinations of gravity, support, and local coordinates.
5. **The flight controller may look correct in open space while failing at transitions.** The most important tests are field entry/exit, station departure, planetary approach, landing, and immediate relaunch.
6. **Adding more special cases can hide the architecture problem.** A patch that makes one station work while leaving the frame model inconsistent is not a durable fix.

## 5. Devil's advocate

### Argument: perhaps the Kinetic Field is already good enough

The Kinetic Field is an arcade traversal ability, not a spacecraft simulator. It may not need inertial navigation, a sophisticated reference-frame graph, or physically realistic orbital mechanics. A simple controller with direct translation and gravity-relative descent could be easier to understand and more fun.

That argument is valid. We should not over-engineer it.

### Counterargument

An arcade controller still needs stable orientation and consistent movement when crossing between environments. The user should not have to remember which surface the ability was activated on. A small frame abstraction is not excessive physics; it is the minimum structure needed to make the same controls behave consistently on Haven, Luna, and station decks.

### Argument: the issue may be a control or camera problem, not physics

A player may describe a strange heading, unexpected direction, or apparent surface dependency when the actual issue is camera orientation, input mapping, or a stale heading vector. The existing control layout also has a deliberate distinction between camera look and flight translation.

### Counterargument

That possibility is exactly why the next test must record the player's heading, up-vector, gravity-field identity, frame owner, and position across transitions. We should not infer the cause solely from the visual symptom.

### Argument: the player should not be carried with a moving station after launching

Once a character activates personal flight, perhaps they should become independent of the station and continue in inertial world space. That could be an intentional design.

### Counterargument

If so, the game must define what happens to station gravity and local orientation as the station moves away. The character cannot simultaneously be treated as stationary in world space and as a member of a gravity field that moves with the station without an explicit transition rule. Either policy can work; an accidental mixture cannot.

### Argument: spacecraft already provide the correct long-distance travel

Perhaps Kinetic Field only needs to be a local mobility ability. The spacecraft should handle interplanetary travel, while personal flight handles station decks, landing pads, and nearby space.

### Counterargument

That is a sensible gameplay distinction and should be considered. But the user explicitly wants to use Kinetic Field to travel between Haven, Luna, stations, and space docks. We should not silently narrow its intended role. The game can support both methods, with the same frame conventions and clearly differentiated handling.

## 6. Recommended design: one explicit movement frame

Introduce a small shared movement-frame record. It should not be a new physics engine.

Suggested conceptual fields:

- `id`: stable frame identity, such as `haven`, `luna`, `solar-commons`, or `last-stop`.
- `root`: the Three.js transform root defining the frame.
- `worldMatrix`: current frame-to-world transform.
- `previousWorldMatrix`: previous transform, for delta calculation.
- `origin`: world-space frame origin.
- `up`: effective local gravity up.
- `forward`: a stable local forward/reference direction.
- `linearVelocity`: frame-origin velocity when the frame moves.
- `angularVelocity`: frame rotation rate when needed.
- `mode`: planetary, station, vehicle, free-space, or zero-G.
- `fieldId`: the gravity field currently governing the character.

### Required behavior

1. Walking obtains its frame from the supporting environment.
2. Activating Kinetic Field inherits the current frame explicitly.
3. Each flight update resolves the current frame and computes the full transform delta.
4. When crossing a field boundary, the controller transitions from the old frame to the new frame using a defined policy.
5. When leaving a moving station, the controller explicitly decides whether to inherit frame velocity or detach into world space.
6. The forward vector is transformed by the frame rotation, then re-orthogonalized against the new up-vector.
7. The camera and avatar orientation use the same frame state.
8. Landing adopts the destination support frame and clears obsolete flight-frame state.
9. Spacecraft controls remain separate and unchanged.

For an arcade game, frame velocity inheritance can be simplified. The important part is that it is explicit, deterministic, and tested.

## 7. Route test plan

The following is the required playtest matrix. It has **not** been executed in this review.

### A. Kinetic Field travel

| Test | Start | Destination | Required observations |
|---|---|---|---|
| KF-01 | Haven surface | Luna surface | Heading remains controllable; gravity transitions cleanly; land and walk |
| KF-02 | Luna surface | Haven surface | Reverse transition behaves equally well |
| KF-03 | Haven | Last Stop station | Station field entry; orientation and landing are stable |
| KF-04 | Last Stop | Haven | Leave directional field without inherited surface lock |
| KF-05 | Haven | Solar Commons | Orbiting station approach; local gravity and landing are stable |
| KF-06 | Solar Commons | Haven | Station-to-planet frame transition is stable |
| KF-07 | Solar Commons | Last Stop | Directional field to directional field transition |
| KF-08 | L'Astrolabe space dock | Haven / Luna | Dock and planetary transitions; no stale local frame |
| KF-09 | Any station | Relaunch immediately after landing | Flight starts with correct heading and gravity |
| KF-10 | Any destination | Fly across field boundary repeatedly | No abrupt roll, heading reversal, position jump, or surface-dependent control |

For every test, record:
- Starting and ending position.
- Gravity-field ID before and after transition.
- Frame ID before and after transition.
- `playerUp`, `playerHeading`, and `playerFlightForward`.
- Whether the player was carried by a moving frame.
- Whether the camera orientation matched the character.
- Landing result and whether walking resumed normally.

### B. Spacecraft travel and landing

| Test | Route / action | Required observations |
|---|---|---|
| SH-01 | Launch from Haven and land on Haven | Baseline controls, approach, touchdown, disembark |
| SH-02 | Haven to Luna | Target selection, approach alignment, touchdown |
| SH-03 | Luna to Haven | Reverse route and landing |
| SH-04 | Haven to Last Stop | Station approach, docking/landing, disembark |
| SH-05 | Haven to Solar Commons | Station approach, landing, disembark |
| SH-06 | Haven to L'Astrolabe | Space-dock approach and landing |
| SH-07 | Take off after each landing | No stuck landing state or broken control handoff |
| SH-08 | Repeat with both camera modes | Cockpit/chase behavior remains understandable |

Spacecraft acceptance must include the approved nose-relative controls, immediate stop on input release, no unwanted drift, mobile layout, and successful landing/disembark/reboard cycles.

### C. Ground and station checks after landing

At each destination:
- Walk away from the landing point.
- Turn through a full circle.
- Walk across the deck or terrain.
- Approach an edge and verify support ends correctly.
- Activate Kinetic Field, fly briefly, and land again.
- Confirm the character can board the ship and regain spacecraft control.

## 8. Prioritized engineering actions

### P0 — Before another Kinetic Field release

1. Add the explicit movement-frame abstraction described above.
2. Replace the up-vector-only transition with full frame-transform handling.
3. Define and implement moving-frame detachment/inheritance.
4. Ensure gravity-field identity and frame identity are visible in diagnostics.
5. Add a deterministic harness for transitions between two differently oriented frames and a translating/rotating frame.
6. Preserve the existing spacecraft controller and approved mobile control layout byte-for-byte unless a separate, approved change requires otherwise.

### P1 — After the harness passes

1. Run the route matrix inside CyTube.
2. Fix any station-specific landing or support defects using shared interfaces where possible.
3. Verify Haven, Luna, Last Stop, Solar Commons, and L'Astrolabe in both Kinetic Field and spacecraft workflows.
4. Test the same routes in mobile landscape.

### P2 — Once travel is stable

Return to the Phase 1 acceptance checklist: collision, support surfaces, gravity transitions, and movement across representative environments. Do not advance to later roadmap phases merely because travel looks convincing in one scene.

## 9. Release decision

**Do not designate v0.4.05 as a verified travel release.**

Evidence currently available:
- **Source/static:** relevant systems are present in v0.4.05.
- **Prior CyTube report:** the user confirmed v0.3.85 could fly around and land on different stations and planets. This is evidence for that earlier release only.
- **User-reported regression:** the Kinetic Field issue persisted at Solar Commons after v0.4.05.
- **Fresh playtest in this review:** not performed.
- **Current route matrix:** not tested.
- **Spacecraft regression against v0.3.30:** source design is preserved in the current path, but a fresh end-to-end route test is still required.

The next release should not be another speculative one-line gravity patch. It should be a focused movement-frame correction backed by a harness, followed by the full CyTube route matrix.

## 10. Bottom line

The good news is that Kepler Reach already has the ingredients for a coherent travel system. The bad news is that the Kinetic Field controller still does not consistently model the complete environment frame. The ugly part is that this defect can masquerade as several different problems—bad heading, wrong gravity, stale surface state, camera confusion, or a moving station leaving the player behind.

The best next step is not to add more destination-specific exceptions. It is to make the movement frame explicit, test it independently, and then verify every requested route in the live game. Until that playtest is actually completed, any claim that the best version has been produced from hands-on gameplay would be misleading.
