# KEPLER REACH

## Engineering Acceptance and Release Checklist --- v1.0

**Project:** Kepler Reach / Cytube Channels\
**Repository:** `duckwerks/voxel-planet`\
**Related architecture:**
`KEPLER_REACH_ARCHITECTURE_AND_ROADMAP_v1.0.md`\
**Baseline under audit:** User-selected `KEPLER-REACH_v0.3.83.0.js`\
**Document status:** Engineering checklist and verification standard\
**Prepared:** 2026-11-24

------------------------------------------------------------------------

## 1. Purpose

This checklist turns the architecture roadmap into practical
verification criteria. It is intended for planning work, reviewing code
changes, testing releases, and distinguishing implemented behavior from
verified behavior.

A checked item means evidence exists for that item in the current
release. It must not be checked merely because a function, class,
comment, or UI element exists in source.

## 2. Evidence levels

Use these labels in development notes and release reports.

  -----------------------------------------------------------------------
  Label                               Meaning
  ----------------------------------- -----------------------------------
  **Proposed**                        Designed or discussed, not
                                      implemented

  **Source present**                  Relevant code exists, but behavior
                                      has not been verified

  **Static verified**                 Syntax, source inspection, or
                                      static checks passed

  **Harness verified**                A targeted automated or isolated
                                      test passed

  **Browser verified**                Tested in an actual browser

  **CyTube verified**                 Tested inside the intended CyTube
                                      environment

  **Mobile verified**                 Tested on a real target mobile
                                      device

  **Regression verified**             Existing protected behavior was
                                      retested and passed
  -----------------------------------------------------------------------

Evidence should include the release version, test method, environment,
and result. A test that was not run must be marked **Not tested**, not
assumed successful.

## 3. Source intake and audit checklist

Before editing:

-   [ ] Confirm the exact authoritative source URL.
-   [ ] Fetch the complete source, not a truncated preview.
-   [ ] Record file size, line count, version header, and source hash.
-   [ ] Confirm whether the selected source differs from the latest
    published release.
-   [ ] Identify the functions and systems affected by the requested
    change.
-   [ ] Trace relevant callers, initialization order, and cleanup paths.
-   [ ] Identify shared state and variables with scope or
    temporal-dead-zone risk.
-   [ ] Identify related UI elements and mobile behavior.
-   [ ] Record protected behavior that must remain unchanged.
-   [ ] Record known defects that are in scope and those deliberately
    deferred.

After editing:

-   [ ] Run a JavaScript syntax check, such as `new Function(source)`,
    where suitable.
-   [ ] Run targeted static checks for required and forbidden markers.
-   [ ] Inspect the full changed function and its callers.
-   [ ] Check variable declaration order and scope.
-   [ ] Check event listeners, animation loops, timers, and cleanup.
-   [ ] Check for accidental duplicate functions or stale comments.
-   [ ] Compare protected functions against their approved reference.
-   [ ] Run targeted harness tests where possible.
-   [ ] Test in a real browser when behavior depends on browser APIs or
    rendering.
-   [ ] Test inside CyTube when behavior depends on CyTube APIs or page
    integration.
-   [ ] Test on mobile landscape when controls or performance are
    affected.

## 4. Shared physical environment acceptance

### 4.1 Coordinate and scale

-   [ ] World-unit convention is documented and consistently applied.
-   [ ] Character dimensions are consistent with the approximate 2-meter
    reference.
-   [ ] Doors, furniture, vehicles, and rooms use coherent scale.
-   [ ] Planet, station, vehicle, and character coordinate frames are
    explicit.
-   [ ] Transforms between local and parent coordinate frames are
    tested.
-   [ ] Large-distance precision risks are documented and addressed when
    needed.

### 4.2 Collision

-   [ ] Character body cannot pass through representative solid walls.
-   [ ] Character body cannot pass through closed doors or hatches.
-   [ ] Character does not tunnel through thin obstacles at expected
    movement speeds.
-   [ ] Collision works for rotated objects.
-   [ ] Compound objects do not produce large phantom collision volumes.
-   [ ] Moving objects update their collision representation correctly.
-   [ ] Collision queries are spatially bounded rather than scanning the
    entire universe.
-   [ ] Collision behavior is tested at corners, doorways, and narrow
    passages.

### 4.3 Support surfaces

-   [ ] Character can stand on planetary terrain.
-   [ ] Character can stand on station floors.
-   [ ] Character can stand on designated roofs and landing pads.
-   [ ] Character can stand on decks and platforms.
-   [ ] Character can traverse supported ramps and stairs.
-   [ ] Character does not snap to unrelated surfaces above or below.
-   [ ] Jump descent lands on valid support surfaces.
-   [ ] Kinetic Field descent lands on valid support surfaces.
-   [ ] Moving-platform support behaves consistently.
-   [ ] Unsupported surfaces do not falsely register as walkable.

### 4.4 Gravity and movement

-   [ ] Planetary radial gravity points toward the correct body.
-   [ ] Directional station gravity uses the correct local orientation.
-   [ ] Gravity transitions do not unexpectedly rotate or trap the
    character.
-   [ ] Zero-G behavior is explicit and tested where implemented.
-   [ ] Grounded, jumping, falling, swimming, flying, and seated states
    transition correctly.
-   [ ] Movement remains stable on slopes and curved surfaces.
-   [ ] Character movement and camera orientation remain coherent when
    local up differs from global up.

### 4.5 Water and maritime environments

-   [ ] Shoreline transitions are stable.
-   [ ] Water entry and exit behave correctly.
-   [ ] Swimming state and controls are clear.
-   [ ] Boarding and disembarking work at designated points.
-   [ ] Passenger positions and boat occupancy are consistent.
-   [ ] Watercraft movement respects its intended operating area.
-   [ ] Maritime collision and support surfaces use shared interfaces
    where applicable.

## 5. Character and controller acceptance

### 5.1 Persistent character identity

-   [ ] Character ID is independent of browser session.
-   [ ] Character identity is independent of controller type.
-   [ ] Character state survives controller handoff.
-   [ ] Character state can be saved and restored where persistence is
    implemented.
-   [ ] Duplicate or conflicting controller ownership is prevented or
    explicitly arbitrated.

### 5.2 Common controller interface

-   [ ] Human input uses the shared movement controller.
-   [ ] Scripted NPC behavior uses the shared movement controller.
-   [ ] LLM actions use the shared movement and interaction interfaces.
-   [ ] No controller directly bypasses collision or gravity.
-   [ ] Invalid actions are rejected safely.
-   [ ] Action results and failures are observable.
-   [ ] Controller handoff stops the previous controller from issuing
    conflicting actions.
-   [ ] Reclaiming control after reconnect works without duplicating the
    character.

### 5.3 Agent observations and actions

-   [ ] Agent observations are structured and bounded.
-   [ ] Agents receive only information allowed by their perception and
    permissions.
-   [ ] Actions have explicit parameters and validation.
-   [ ] Long-running actions can be interrupted or cancelled.
-   [ ] Navigation and movement execution are handled by game systems,
    not free-form LLM coordinate manipulation.
-   [ ] Agent errors, timeouts, and unavailable services do not corrupt
    character state.
-   [ ] Agent dialogue cannot directly award credits, inventory, or
    authoritative outcomes.

## 6. CyTube identity and community-character acceptance

-   [ ] The actual deployed CyTube client API has been inspected.
-   [ ] The current userlist payload shape is verified from source or
    runtime inspection.
-   [ ] Login and guest status fields are verified rather than guessed.
-   [ ] Userlist updates and join/leave events are handled.
-   [ ] Account names are normalized consistently without accidentally
    merging distinct accounts.
-   [ ] Only an account recognized by CyTube's own account/session
    mechanisms is mapped to its community character.
-   [ ] Chat message text is never used as proof of identity.
-   [ ] Unknown accounts do not gain control of a reserved community
    character.
-   [ ] Provisional roster mappings are confirmed with the relevant
    community members.
-   [ ] When a mapped user leaves, the configured autonomous takeover
    policy is applied.
-   [ ] When the mapped user returns, control reclamation is handled
    safely.
-   [ ] No human password, session cookie, or browser credential is
    shared with an LLM agent.

Initial roster candidates:

  CyTube account       Character           Verification
  -------------------- ------------------- ----------------------------
  `BenisDDD`           Benis Sheriff       Confirm exact account
  `LemmyCaution`       Lemmy               Tentative; confirm
  `DooDooButtChamp`    To be established   Confirm character identity
  Additional members   To be established   Add after agreement

Do not introduce a separate identity provider or duplicate password
system unless a demonstrated CyTube API limitation requires a deliberate
redesign.

## 7. Navigation and interaction acceptance

-   [ ] Navigation paths respect actual collision and support surfaces.
-   [ ] Characters can reach representative destinations inside a
    building.
-   [ ] Doors can be discovered and used by authorized characters.
-   [ ] Stairs, ramps, elevators, and hatches are traversable where
    implemented.
-   [ ] Vehicle boarding points are reachable.
-   [ ] Characters can board and disembark without clipping or being
    stranded.
-   [ ] Dynamic obstacles cause path replanning or safe failure.
-   [ ] Stuck detection identifies repeated lack of progress.
-   [ ] Recovery does not teleport characters through solid geometry.
-   [ ] Interactions validate distance, state, permissions, and
    prerequisites.

## 8. Procedural generation acceptance

For each generated entity category, verify that generation creates more
than appearance.

-   [ ] Generated visual geometry is valid.
-   [ ] Scale and coordinate frame are valid.
-   [ ] Collision representation is generated.
-   [ ] Support surfaces are generated where needed.
-   [ ] Navigation data is generated where needed.
-   [ ] Interaction metadata is generated where needed.
-   [ ] Environmental metadata is internally coherent.
-   [ ] Generated content passes physical validation.
-   [ ] Generation is deterministic from a retained seed where required.
-   [ ] Invalid content is rejected or repaired rather than silently
    registered.
-   [ ] Generated destinations can be saved or promoted to curated
    destinations where intended.

Representative generated content should include terrain, a building, an
interior room, a door, a ramp or stair, vegetation, an animal, and a
point of interest.

## 9. Multiplayer and persistence acceptance

Do not mark these items complete until independently connected clients
have been tested.

-   [ ] Two independent clients can join the same game session.
-   [ ] Both clients observe consistent character identities and
    positions.
-   [ ] Movement updates are reconciled by the selected authority.
-   [ ] Conflicting control attempts are resolved.
-   [ ] Vehicle occupancy is consistent between clients.
-   [ ] Interactions produce consistent results.
-   [ ] Disconnect and reconnect restore the correct character
    association.
-   [ ] Persistent state survives a reload or service restart as
    designed.
-   [ ] Inventory and credit mutations are validated by an authority.
-   [ ] Clients cannot award themselves credits or modify another
    character's state.
-   [ ] LLM agents use separately authorized connections and the same
    action rules.
-   [ ] Version mismatch and stale-client behavior are handled safely.

## 10. Spacecraft and vehicle regression checklist

-   [ ] Approved v0.3.30 nose-relative spacecraft controls remain
    intact.
-   [ ] Forward, reverse, lateral, vertical, and rotational controls
    behave as approved.
-   [ ] No unwanted drift has been introduced.
-   [ ] BOOST and relevant action controls remain usable in mobile
    landscape.
-   [ ] Landing and docking remain functional.
-   [ ] Vehicle transitions do not strand the character.
-   [ ] Passenger seats and occupancy remain correct.
-   [ ] Kinetic Field remains conceptually and mechanically distinct
    from spacecraft propulsion.
-   [ ] Any intentional flight change is documented and explicitly
    approved.

A byte-for-byte comparison of a protected function is useful evidence,
but runtime regression testing is still required.

## 11. Mobile, rendering, and performance checklist

-   [ ] Landscape layout is usable on a real mobile device.
-   [ ] Movement joystick is reachable and does not obscure the view
    unnecessarily.
-   [ ] Action controls are compact and thumb-friendly.
-   [ ] HUD elements do not overlap essential controls.
-   [ ] Touch input works without requiring hover.
-   [ ] Camera controls remain usable while moving.
-   [ ] Representative scenes maintain acceptable responsiveness.
-   [ ] Memory use remains stable during travel between environments.
-   [ ] Repeated loading/unloading does not leak scene objects or
    listeners.
-   [ ] Procedural generation does not block the main thread for
    excessive periods.
-   [ ] Rendering and initialization errors are reported and recover
    safely where possible.

Record actual device, browser, screen orientation, and test scene. Do
not label a feature mobile verified based only on desktop emulation.

## 12. Release procedure

### 12.1 Before publication

-   [ ] Confirm the release is based on the intended authoritative
    source.
-   [ ] Increment the version correctly.
-   [ ] Update header, authorship, source references, and change notes.
-   [ ] Include complete replacement-ready JavaScript.
-   [ ] Run syntax and static checks.
-   [ ] Run relevant harness and regression tests.
-   [ ] Review the complete final file, not just the diff.
-   [ ] Record untested behavior and known limitations.

### 12.2 GitHub publication

-   [ ] Publish a new versioned file; do not overwrite older releases.
-   [ ] Record commit SHA.
-   [ ] Record file blob SHA.
-   [ ] Record GitHub blob URL.
-   [ ] Record raw GitHub URL.
-   [ ] Record jsDelivr URL if used for deployment.
-   [ ] Fetch the published raw file back.
-   [ ] Verify the fetched file exactly matches the intended release.
-   [ ] Verify the published version header and file size.

### 12.3 Release report

Every release report should include:

**Version:**\
**Authoritative base:**\
**Commit SHA:**\
**Blob SHA:**\
**GitHub URL:**\
**Raw URL:**\
**jsDelivr URL:**

**Changes** - ...

**Preserved behavior** - ...

**Verification** - Syntax: - Static checks: - Harness tests: -
Browser: - CyTube: - Mobile: - Regression:

**Known limitations** - ...

**Not tested** - ...

## 13. Test scenario catalogue

Maintain a small repeatable set of test scenes rather than relying on
one-off exploration.

1.  **Open terrain:** walk, jump, turn, and traverse slopes.
2.  **Building interior:** walls, corners, doorways, floor changes, and
    ceilings.
3.  **Roof and landing pad:** land, stand, walk, jump, and leave.
4.  **Station habitat:** local gravity, orientation, interior
    navigation, and transitions.
5.  **Rotating habitat:** verify local gravity and surface-relative
    movement when implemented.
6.  **Quai de Haven:** dock, curved pier, boat boarding, and
    disembarking.
7.  **L'Astrolabe:** landing pad, deck, shop roof, and nearby walkable
    surfaces.
8.  **Vehicle test:** board, occupy, operate, exit, and reclaim
    character control.
9.  **Controller handoff:** human to autonomous and back.
10. **CyTube roster:** known account joins, leaves, and rejoins.
11. **Two-client session:** independent clients observe the same shared
    state.
12. **Procedural destination:** generated terrain and building are
    traversable and interactable.

## 14. Current baseline status snapshot

This is a documentation snapshot of the selected v0.3.83.0 source audit,
not a live test report.

  -----------------------------------------------------------------------
  Area                                Baseline assessment
  ----------------------------------- -----------------------------------
  JavaScript syntax                   Static syntax check passed during
                                      audit

  OBB-style obstacle records          Source present

  Complete shared character collision Not established

  General structural walkable         Not established
  surfaces                            

  Unified planetary/station movement  Not established

  Gravity and mass metadata           Source present; limited physical
                                      consequences

  Rotating-habitat centrifugal        Not established
  gravity                             

  Spacecraft flight                   Existing implementation; regression
                                      testing required

  Haven maritime content              Source present; runtime
                                      verification required

  Persistent character identity       Partial concepts; full persistence
                                      not established

  LLM controller system               Proposed / partial API concepts

  CyTube community mapping            Design established; exact client
                                      payload verification required

  Navigation for autonomous agents    Not established as a complete
                                      system

  Procedural playable-world pipeline  Not established

  Authoritative multiplayer           Not implemented in audited baseline

  Secure persistent economy           Not established
  -----------------------------------------------------------------------

## 15. Final rule

A feature is complete only when its intended behavior is implemented,
its acceptance criteria are met, and the evidence is recorded. A source
file that parses is a useful milestone---but it is not proof that the
game works in a browser, inside CyTube, on mobile, or across multiple
clients.