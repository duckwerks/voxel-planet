# KEPLER REACH

## Architecture and Development Roadmap --- v1.0

**Project:** Kepler Reach / Cytube Channels\
**Repository:** `duckwerks/voxel-planet`\
**Architecture baseline:** User-selected `KEPLER-REACH_v0.3.83.0.js`\
**Document status:** Architecture baseline and forward-looking roadmap\
**Prepared:** 2026-11-24

------------------------------------------------------------------------

## Document purpose

This document establishes the shared architectural direction for Kepler
Reach. It records the project's design goals, decisions, existing
foundations, proposed systems, constraints, risks, and implementation
sequence.

It is a planning and engineering reference, not a claim that every
described system already exists. Each capability is classified as
implemented, experimental, proposed, or requiring verification.
Source-code presence is not equivalent to successful runtime behavior.

The authoritative code baseline for this document is the user-selected
`KEPLER-REACH_v0.3.83.0.js` source. It is distinct from the separately
published `KEPLER-REACH_v0.3.83.js` release. Future code work must fetch
and audit the exact selected source before editing.

## 1. Project vision

Kepler Reach is a persistent-feeling, browser-based 3D universe
integrated with CyTube. It combines space exploration, planetary
environments, settlements, vehicles, social gathering places, community
characters, and eventually shared multiplayer activity.

The immediate experience is a social exploration game: players travel
through space, arrive at destinations such as Haven, land, leave their
spacecraft, walk through environments, interact with places and
characters, and gather with CyTube community members. CyTube provides
synchronized video and chat; the game must provide its own systems for
synchronizing game-world state.

The universe should feel broad and discoverable. Haven is a handcrafted,
permanent home world. Its moon, nearby stations, and selected
destinations may be deliberately curated. Beyond those destinations,
planets, terrain, structures, vehicles, flora, fauna, minerals, and
other discoveries can be procedurally generated. Generated discoveries
may later be curated and retained as permanent destinations.

The long-term goal is not merely a collection of disconnected scenes. It
is a coherent universe in which the same physical rules, character
systems, interaction conventions, and world-generation standards apply
across planets, stations, spacecraft, settlements, and other
environments.

## 2. Design philosophy and visual direction

The intended visual character draws inspiration from:

-   The scale, exploration, and economical presentation of *Frontier:
    Elite II*.
-   The procedural vastness and discovery-oriented atmosphere of
    *Noctis*.
-   The colorful detail and visual personality of Neo Geo-era games.
-   Retro-futurist social environments, including selective *Futurama*
    and *The Jetsons*-like kitsch.
-   Restrained neon and cyberpunk accents where they support the
    setting.

The world should use actual 3D geometry, with low-poly and
voxel-inspired forms, selective pixel-art shading, subtle dithering,
strong silhouettes, and readable environmental detail. Bright, colorful
alien landscapes are desirable; the entire universe should not be
reduced to a uniformly dark or monochromatic science-fiction aesthetic.

Visual design must remain subordinate to usability, performance,
physical consistency, and readable interaction---especially on mobile
devices.

## 3. Architectural principles and invariants

The following principles are intended to remain stable across future
releases.

1.  **One physical world model.** Characters, creatures, vehicles,
    buildings, stations, and planets must participate in shared
    physical-environment conventions.
2.  **One character movement system.** Human-controlled characters,
    LLM-controlled characters, and autonomous NPCs use the same movement
    and interaction interfaces.
3.  **Identity is independent of controller.** A persistent character
    does not become a different entity when control changes between a
    human, an LLM agent, or an autonomous behavior controller.
4.  **The engine owns physical truth.** AI agents request bounded
    actions. The game engine validates and executes movement, collision,
    gravity, interactions, and authoritative state changes.
5.  **Generated objects must be playable objects.** Procedural geometry
    must be accompanied by appropriate collision, support surfaces,
    navigation, interaction, and environmental metadata.
6.  **No destination-specific physics forks.** A new station or planet
    may define data and local rules, but should not require a
    fundamentally separate character controller.
7.  **Preserve approved flight behavior.** Spacecraft flight controls
    approved in v0.3.30 remain a protected behavior unless an
    intentional redesign is agreed upon.
8.  **Multiplayer is a first-class future constraint.** Local prototypes
    should not assume that a single browser is the permanent authority
    for every shared-world feature.
9.  **Mobile is a real target.** Landscape mobile use, touch controls,
    memory, GPU limits, and browser constraints must be considered
    throughout development.
10. **Implemented, tested, and planned are different claims.**
    Documentation and release notes must distinguish source presence
    from verified runtime behavior.

## 4. Universal scale, units, and coordinate conventions

### 4.1 Shared scale

Use a consistent world-unit convention. The working convention is that
one world unit represents approximately one meter. A typical humanoid
character is approximately 2 meters tall and serves as a practical scale
reference for doors, furniture, vehicles, rooms, roads, and other
structures.

The exact dimensions of each asset may vary for artistic or
species-specific reasons, but they should be intentional and expressed
relative to the shared scale.

### 4.2 Coordinate systems

The engine must clearly distinguish:

-   Global or universe coordinates.
-   Planet-local coordinates.
-   Station or habitat-local coordinates.
-   Vehicle-local coordinates.
-   Character-local coordinates.
-   Render-space coordinates, if floating-origin or origin-rebasing
    techniques are used.

Objects should be authored and transformed in the coordinate frame
appropriate to their parent environment. A character walking on a
rotating station, for example, must be evaluated relative to the
station's local frame and gravity field rather than relying on a single
global up direction.

### 4.3 Large-distance precision

As the universe expands, ordinary floating-point world coordinates may
lose precision at large distances. The architecture should support local
coordinate frames, floating-origin techniques, or equivalent precision
management before the universe reaches distances where visible jitter or
collision instability becomes a problem.

This is a planned requirement, not a claim that large-world precision
management is already implemented.

## 5. Shared physical environment

The physical environment is the foundation for planetary exploration,
station interiors, buildings, vehicles, spacecraft, and AI navigation.

### 5.1 Physical entity metadata

Physical entities should be able to expose relevant metadata through a
consistent registration or component interface:

-   Entity identity and category.
-   Transform and coordinate frame.
-   Mass and, where relevant, density or volume.
-   Collision representation and collision layers.
-   Support-surface information.
-   Gravity-field participation.
-   Movement or interaction constraints.
-   Dynamic/static status.
-   Ownership or authority information where multiplayer requires it.

Mass and density metadata are useful foundations, but metadata alone
does not constitute a rigid-body simulation.

### 5.2 Collision architecture

No single collision technique is sufficient for every task. Use a hybrid
approach:

-   **Capsule or swept-capsule tests** for character-body collision and
    continuous movement.
-   **Raycasts and shape casts** for floor, ceiling, ramp, roof,
    landing, and support-surface detection.
-   **Oriented bounding boxes (OBBs)** for oriented solid objects and
    broad collision volumes.
-   **Boxes, spheres, planes, and compound shapes** for common physical
    primitives.
-   **Mesh-level collision selectively**, where simpler primitives
    cannot represent the required shape affordably.

A movement step should test the intended displacement, resolve contact,
and avoid tunneling through thin obstacles. Complex objects should use
compound collision shapes or per-part records rather than one large
aggregate bounding box that fills empty space and creates phantom
obstacles.

A broadphase or spatial index will eventually be necessary to avoid
testing every collider against every moving entity in a large procedural
world.

### 5.3 Surface support and grounded movement

Collision with obstacles is not the same as finding a surface on which a
character can stand. The controller must know whether a valid supporting
surface exists beneath the character's feet and whether that surface is
suitable for the current movement mode.

Surface queries should support:

-   Terrain.
-   Building floors.
-   Roofs and landing pads.
-   Decks and platforms.
-   Ramps and stairs.
-   Moving platforms.
-   Vehicle interiors.
-   Curved or locally oriented surfaces where appropriate.

Surface contact must be reconciled with collision, gravity, slope
limits, and the character's current movement state. A raycast can
identify a candidate support surface, but the character's body still
needs collision resolution.

### 5.4 Character movement controller

A shared character controller should manage:

-   Character dimensions and collision shape.
-   Current coordinate frame and gravity direction.
-   Grounded, jumping, falling, swimming, flying, seated, and other
    relevant states.
-   Horizontal movement relative to the supporting surface.
-   Slope and step handling.
-   Wall, ceiling, doorway, and obstacle contact.
-   Moving-platform attachment and detachment.
-   Landing and fall recovery.
-   Movement constraints imposed by the environment.

Planetary terrain movement, station walking, building interiors, and
maritime locations should become configurations of this common
system---not separate movement implementations that drift apart.

### 5.5 Gravity fields

Gravity should be represented as a queryable environmental field rather
than hard-coded assumptions inside individual destinations.

Expected field types include:

-   Radial gravity toward a planet or moon.
-   Directional gravity on a station deck.
-   Radial or centrifugal gravity inside a rotating habitat.
-   Localized gravity volumes.
-   Zero-gravity regions.
-   Suppression or altered-gravity regions where justified by world
    design.

A character controller should query the effective gravity at its
location and orient movement accordingly. Rotating habitats should
eventually calculate gravity from their geometry and angular velocity
rather than merely assigning an approximate fixed direction.

### 5.6 Swimming and water

Water should become a physical environment type, not only a visual
surface. The system should eventually support shoreline transitions,
buoyancy or simplified float behavior, swimming movement, underwater
state, watercraft interaction, and transitions between land and water.

The existing Haven maritime content is a useful prototype foundation,
but it should ultimately use shared environmental interfaces.

### 5.7 Mass and physical consequences

Mass profiles are a useful foundation for future physical interactions.
The long-term model may include momentum transfer, impacts, kinetic
weapons, asteroid deflection, structural damage, and other consequences.

Do not imply that mass metadata already produces general physical forces
or structural failure. A full rigid-body simulation is not a
prerequisite for the next character-controller milestone.

## 6. Environment interaction architecture

Every interactable environment object should expose a consistent
description of what it is, how it can be used, and which character or
vehicle states are valid.

Common interaction categories include:

-   Doors, hatches, airlocks, elevators, stairs, ramps, and force
    fields.
-   Seats, passenger positions, vehicle controls, and docking
    interfaces.
-   Furniture, terminals, consoles, signs, and service counters.
-   Pickups, equipment, inventory containers, and world objects.
-   Watercraft boarding points, docks, ladders, and shore transitions.
-   Social activities, gathering points, games, and entertainment
    facilities.

An interaction should have a discoverable identifier, eligibility rules,
action parameters, and a result or event. The engine should validate
proximity, permissions, state, and required prerequisites.

A visual door is not functionally complete until it has collision
behavior, an open/closed state, an interaction interface, and navigation
support. A generated staircase is not complete until characters can
traverse it.

## 7. Vehicles, spacecraft, and transportation

Transportation should use shared vehicle and character interfaces while
preserving the distinct handling appropriate to each vehicle category.

The system should eventually support:

-   Spacecraft flight, docking, landing, and passenger seating.
-   Surface vehicles such as the Luna buggy.
-   Personal watercraft and passenger boats.
-   Boarding, seat assignment, occupancy, and disembarking.
-   Vehicle-local coordinates and passenger attachment.
-   Control permissions and handoff.
-   Collision and environmental constraints.
-   Vehicle persistence and multiplayer authority.

### 7.1 Protected spacecraft flight behavior

The approved v0.3.30 spacecraft controls are a preservation requirement.
They use nose-relative movement and avoid unwanted drift. The control
behavior should not be casually replaced with a conventional
momentum-heavy flight model.

Future changes to flight should be isolated, explicitly reviewed, and
compared against the approved behavior. A source-level comparison is
useful but does not replace actual browser testing.

### 7.2 Kinetic Field

The player's personal flight ability is conceptually a Kinetic Field. It
is an in-world ability and visual/storytelling device, not a
conventional upward-thrust-only jetpack.

Use code-neutral names such as `personalFlightMode` or
`personalFlightController`. The ability should remain consistent with
the common movement and gravity architecture and should not introduce a
separate physics universe.

## 8. Persistent character entities

A character is a persistent entity independent of whoever or whatever
currently controls it.

Character identity and state may include:

-   Persistent character ID.
-   Display name and model.
-   Community-account association, if applicable.
-   Current controller type and controller identity.
-   Position, orientation, and movement state.
-   Inventory, equipment, and possessions.
-   Credits and other game-owned balances.
-   Relationships, affiliations, and history.
-   Knowledge, memories, and current goals.
-   Current activity, vehicle, seat, or location.
-   Permissions and ownership rules.

The exact persistence schema remains to be designed. The architecture
should avoid binding character identity directly to a browser session or
a particular controller.

## 9. Human, LLM, and autonomous controllers

### 9.1 Controller types

A persistent character may be controlled by:

1.  A human player.
2.  An LLM-backed agent.
3.  An autonomous scripted or behavior-tree NPC controller.

A character may change controller without losing its identity or
persistent state.

### 9.2 Common action interface

All controller types should use the same bounded action interface.
Examples include:

-   Move toward a destination.
-   Turn or look in a direction.
-   Jump or activate personal flight, if permitted.
-   Interact with a named object.
-   Board or leave a vehicle.
-   Sit, stand, or use a service.
-   Speak or send an in-world communication.
-   Start, stop, or change an activity.

Controllers should not directly manipulate Three.js objects, write
arbitrary transforms, bypass collision, or assign authoritative velocity
and gravity.

### 9.3 Observation interface

Agents should receive structured observations appropriate to their
permissions and perception:

-   Nearby entities and their categories.
-   Relevant object names and interaction options.
-   Navigation destinations and obstacles.
-   Character state and current activity.
-   Recent events and messages.
-   Relevant social context and goals.

Observation should be bounded by range, visibility, permissions, and
information policy. An LLM should not automatically receive the entire
hidden world state.

### 9.4 Planning and execution separation

LLMs may interpret goals, choose actions, converse, and plan. The game
engine remains responsible for validating actions, executing movement,
resolving collisions, applying gravity, and changing authoritative
state.

A navigation or behavior subsystem should translate high-level goals
into movement and interaction steps. This avoids asking an LLM to
calculate every frame of movement and reduces latency, cost, and unsafe
state manipulation.

### 9.5 Controller handoff

Controller ownership must be exclusive or explicitly arbitrated. When a
human takes control, the autonomous controller should stop issuing
conflicting commands. When the human leaves or relinquishes control, the
system may assign an LLM or scripted controller according to the
character's policy.

Handoff should preserve character state and produce clear events.
Reconnection should not create duplicate control.

## 10. CyTube community characters and identity

The initial community roster is expected to contain approximately 10--20
members. These are persistent community characters, not disposable
generated NPCs.

CyTube already provides account and room-user mechanisms. Kepler Reach
should use CyTube's actual connected-user information and
authentication/guest status as exposed by the client API. It should not
rely on parsing chat messages or on an arbitrary text label supplied by
a message.

The intended mapping is a simple roster association between known CyTube
account names and persistent game-character IDs. No separate password
system or external identity provider is proposed for the initial design.

Illustrative, provisional mappings:

  -----------------------------------------------------------------------
  CyTube account          Game character          Status
  ----------------------- ----------------------- -----------------------
  `BenisDDD`              Benis Sheriff           Reported association;
                                                  verify exact account

  `LemmyCaution`          Lemmy                   Tentative account name;
                                                  confirm

  `DooDooButtChamp`       To be established       Character identity and
                                                  mapping pending

  Other community members To be established       Add as roster is
                                                  confirmed
  -----------------------------------------------------------------------

The actual userlist record shape and the exact authentication/guest
fields must be verified against the CyTube client API before
implementation. Use the userlist and supported login/user events; do not
assume an undocumented field exists.

When a mapped account joins, the corresponding character can be assigned
to that human controller. When the user leaves, the character may remain
in the world and be taken over by an LLM or autonomous controller. When
the user returns, control can be handed back according to the
character's ownership and session rules.

The design should not invent an impersonation problem that CyTube
already prevents. The implementation should simply honor CyTube's
account and guest rules and verify the account state exposed by the
actual client.

### 10.1 Community characters versus generated NPCs

Community characters have persistent identities and user associations.
Generated NPCs are world inhabitants created by the simulation or
procedural content system. They may use the same character entity and
controller interfaces, but their identity lifecycle, permissions, and
persistence policies differ.

## 11. Navigation and autonomous behavior

Navigation is a shared service for humans, LLM agents, and autonomous
NPCs. Human players may control movement directly, while agents can
request destinations and activities.

The navigation system should eventually support:

-   Walkable navigation graphs or equivalent spatial navigation data.
-   Local pathfinding and obstacle avoidance.
-   Stairs, ramps, doors, elevators, hatches, and ladders.
-   Boarding and disembarking vehicles.
-   Transitions between interiors and exteriors.
-   Planetary terrain and station surfaces.
-   Dynamic obstacles and moving platforms.
-   Recovery from blocked or invalid paths.
-   Activity and destination selection.

Procedural structures should produce navigation data as part of
generation or validation. Navigation must use the same physical
constraints as actual movement; it must not plan paths through walls or
inaccessible geometry.

## 12. Procedural generation architecture

Procedural generation should produce coherent, playable entities rather
than visual decoration alone.

### 12.1 Generation pipeline

A common generation pipeline should:

1.  Select or generate the entity's underlying parameters and seed.
2.  Generate its visual geometry and materials.
3.  Generate collision shapes and physical metadata.
4.  Generate support surfaces and movement constraints.
5.  Generate navigation data.
6.  Generate interaction points and behavior.
7.  Generate environmental, ecological, and contextual metadata.
8.  Validate the result against physical and gameplay rules.
9.  Register, cache, or persist the generated entity as appropriate.

The pipeline should be modular so that planets, buildings, ships,
vegetation, animals, minerals, and other entity categories can share
infrastructure without forcing identical generation logic.

### 12.2 Planetary environments and ecosystems

Planet generation may include:

-   Terrain shape, elevation, plains, hills, valleys, ramps, and
    mountains.
-   Climate, temperature, atmosphere, weather, and lighting.
-   Water, coastlines, rivers, and oceans where appropriate.
-   Vegetation and ecological regions.
-   Animals and other life.
-   Minerals, resources, and points of interest.
-   Settlements, ruins, facilities, and landing sites.

Terrain should favor broad traversable forms and coherent landscapes
rather than excessive spikes or noise. Character and creature movement
must follow the terrain and shared collision rules.

### 12.3 Structures and settlements

Generated buildings and stations should have scale-aware dimensions,
valid interiors, collision, support surfaces, entrances, exits, doors,
navigation, and interaction metadata.

A structure generator should produce both the rendered structure and its
playable representation. Compound collision and semantic components are
preferable to one oversized collider for an entire complex building.

### 12.4 Curated destinations

Haven is the permanent handcrafted home planet. Its moon and selected
nearby facilities may also be curated. Procedurally generated locations
can be discovered, visited, and later promoted to curated persistent
destinations.

Generation seeds and source parameters should be retained where
practical so that a destination can be reconstructed or audited.

## 13. Multiplayer and shared world state

CyTube synchronizes its own room features, such as video and chat. It
does not automatically synchronize Kepler Reach character positions,
movement, vehicles, inventory, or world changes. Those require a
separate game-state synchronization architecture.

### 13.1 Authority

The long-term design requires an authoritative source for shared state.
The authority may be a dedicated service or another deliberately chosen
architecture; the final choice is unresolved.

The system must define authority for:

-   Character movement and collision.
-   Controller ownership and handoff.
-   Vehicle occupancy and control.
-   Inventory, credits, and transactions.
-   Interactions and world changes.
-   NPC and LLM actions.
-   Persistence and recovery.

A client may predict local movement for responsiveness, but shared
authoritative state must resolve conflicts and prevent clients from
unilaterally awarding themselves resources or changing other players'
state.

### 13.2 Sessions and synchronization

The multiplayer design should cover session discovery, joining, state
snapshots, incremental updates, event ordering, reconnection, conflict
resolution, and version compatibility.

It should also distinguish ephemeral state (such as a transient
animation) from persistent state (such as a character's inventory or a
permanent world change).

### 13.3 LLM agents in multiplayer

LLM agents must participate through the same authorized
character/controller interface as human players and autonomous NPCs.
They must not receive privileged direct access to authoritative game
state simply because they are AI.

An agent's connection and credentials must be separately authorized. Do
not share a human user's CyTube password, session cookie, or browser
authentication material with an agent.

## 14. Persistence, economy, inventory, and permissions

Persistent world state will eventually include character identity,
inventory, credits, discovered locations, selected world changes, and
other durable data.

The design should define:

-   Which data is authoritative and where it is stored.
-   Which actions can create, transfer, or destroy items and credits.
-   Ownership and access permissions.
-   Transaction validation and audit events.
-   Recovery from interrupted actions or disconnects.
-   Save versions and migration strategy.
-   Character and world deletion or archival rules.

Credits are intended as an in-game resource, not real-money value.
Betting and games should use credits only. LLM dialogue may narrate or
comment on results, but it must not determine authoritative balances,
payouts, inventory, or game outcomes.

The existing local `game.addCredits()`-style API should not be treated
as a secure multiplayer economy authority. Economy mutations must
eventually pass through validated authoritative transactions.

## 15. CyTube integration

CyTube is the social and synchronized-media environment in which Kepler
Reach is hosted. The game should integrate with available CyTube client
events and interfaces without assuming that CyTube provides game-world
simulation services.

Integration responsibilities may include:

-   Detecting the current room and connected users.
-   Mapping authenticated account identities to community characters.
-   Responding to joins, leaves, and account/session changes.
-   Displaying game controls and status in a mobile-friendly layout.
-   Coordinating in-world social activity with synchronized video.
-   Providing a stable script-loading and initialization path.

CyTube-specific APIs must be verified against the actual client version
and source before relying on exact event payloads or object fields.

## 16. Rendering, performance, and mobile deployment

Kepler Reach must remain practical in a browser, including mobile
browsers in landscape orientation.

### 16.1 Mobile interface

Controls should be compact, thumb-friendly, and arranged horizontally in
landscape. Movement controls should remain on the left, with relevant
action controls such as BOOST and ray-gun/fire placed in the space
between the movement control and the opposite side of the screen. Avoid
large vertical stacks and unnecessary HUD clutter.

Spacecraft controls should preserve the user-approved behavior and
layout. Personal flight should inherit the approved spacecraft control
philosophy rather than inventing an unrelated control scheme.

### 16.2 Performance architecture

As the universe grows, consider:

-   Level of detail and distance-based visibility.
-   Geometry and material reuse.
-   Instancing for repeated vegetation, structures, and objects.
-   Spatial indexing for collision, navigation, and visibility.
-   Chunked or region-based terrain.
-   Loading and unloading distant environments.
-   Asset caching and asynchronous loading.
-   Bounded procedural generation work.
-   Memory lifecycle and cleanup.
-   Graceful handling of initialization and rendering errors.

Performance targets should be measured on representative desktop and
mobile hardware rather than assumed.

### 16.3 Deployment format

The current delivery preference is a JavaScript script that can be
loaded through CyTube's internal JavaScript editor or an external script
URL. A single-file deployment artifact may remain convenient even if the
source is organized into modular internal sections or generated from a
modular development source.

The initial game should not require the user to operate a separate
server merely to load and play the local prototype. This constraint does
not eliminate the future need for an authoritative multiplayer service
if true shared persistent state is required.

## 17. Asset and model pipeline

The project has an existing modular model-system foundation. Future
assets should use consistent conventions for:

-   Model loading and normalization.
-   Scale and origin.
-   Named attachment sockets.
-   Collision and support metadata.
-   Materials and texture budgets.
-   Animation and interaction points.
-   Fallback models and load failure handling.
-   Versioning and asset provenance.

Models should not be treated as purely visual objects when they
participate in the physical world. Collision and semantic metadata
should be associated with the model or its generated entity definition.

## 18. Existing source assessment: selected v0.3.83.0 baseline

This assessment concerns the user-selected `KEPLER-REACH_v0.3.83.0.js`,
not the separately published `v0.3.83.js` file. The source passed a
JavaScript syntax check during the audit. No live mobile/CyTube/browser
runtime test was performed as part of that audit.

### 18.1 Existing foundations

The selected source contains:

-   An organized obstacle-collision approach using OBB-style solid
    records.
-   Surface-step and solid-movement resolution helpers.
-   Mass and density metadata.
-   Radial and directional gravity concepts.
-   Spherical boundaries and physical registration concepts.
-   Planetary terrain movement and separate station-walking behavior.
-   Spacecraft flight and vehicle systems.
-   Haven maritime infrastructure, including Quai de Haven and
    L'Astrolabe.
-   A passenger launch boat and personal watercraft concepts.
-   Character, controllable, and model registration interfaces.
-   State inspection and bounded command concepts.
-   Camera obstruction handling.
-   Cleanup routines.

### 18.2 Important limitations identified

1.  Obstacle collision is not yet a complete character-versus-world
    movement architecture.
2.  Aggregate bounds around complex objects can create phantom collision
    volumes.
3.  The L'Astrolabe pad remains marked as a solid collider in this
    selected source; it is not yet integrated as a general walkable
    structural surface.
4.  Station walking relies substantially on fixed local floor-height
    assumptions, with special handling for the Quai.
5.  Planetary walking relies on terrain sampling and surface-step
    resolution rather than a universal support-surface system.
6.  There is no general roof, ramp, stair, or arbitrary platform support
    system across all structures.
7.  Gravity and mass metadata do not amount to a complete rigid-body
    simulation.
8.  The rotating habitat's gravity is not yet a complete physically
    derived centrifugal-gravity system.
9.  Spacecraft movement retains the approved core behavior in broad
    terms, but the audited source adds post-movement terrain resolution;
    it is not byte-for-byte identical to the v0.3.78 flight function.
10. Camera blockers may be stale between refreshes, particularly for
    moving or newly created objects.
11. A render-loop exception may stop future animation-frame execution;
    robust recovery is not established.
12. The local APIs do not provide multiplayer synchronization or secure
    persistent authority.
13. Direct mutable economy functions must not be considered
    authoritative multiplayer operations.
14. A stale header comment says `NO COMMANDS YET` despite the presence
    of command and registration interfaces.

### 18.3 Architectural assessment

The selected v0.3.83.0 source is a useful organizational starting point
for solid-object collision because its OBB records make obstacle
representation more explicit. The earlier v0.3.83 implementation
contains a separate raycast/walkable-surface experiment that is relevant
to the support-surface problem. Neither source should be treated as a
complete finished foundation.

The recommended direction is to combine the useful concepts: explicit
solid collision records, raycast/shape-cast support detection, a
continuous character-body collision model, and one shared movement
controller. This is a design direction, not a claim that the two
versions have already been merged.

## 19. Preservation requirements

Future development should preserve the following unless a deliberate
redesign is approved:

-   The user-approved v0.3.30 spacecraft flight-control behavior.
-   Kinetic Field as the conceptual personal-flight ability.
-   The shared-scale direction and the approximately 2-meter humanoid
    reference.
-   Haven as the handcrafted permanent home world.
-   The curated Haven maritime and orbital destinations already
    established.
-   Existing vehicle and passenger concepts, including the eight-seat
    launch boat.
-   The modular model-loading foundation.
-   Character registration and controller concepts that can be retained
    safely.
-   The mobile landscape control philosophy.
-   The distinction between CyTube synchronized media and game-owned
    world synchronization.

Preservation does not mean every existing implementation detail must
remain. Buggy or fragmented systems should be replaced while preserving
the intended behavior and content.

## 20. Technical risks and unresolved decisions

The following are open engineering decisions. They should be resolved
when the relevant implementation phase approaches, rather than guessed
prematurely.

1.  Exact character capsule dimensions, slope limits, step height, and
    movement tuning.
2.  Collision broadphase and spatial-index implementation.
3.  The representation of compound colliders and moving structures.
4.  The exact gravity-field API and rotating-habitat calculations.
5.  The persistence schema and storage provider.
6.  The authoritative multiplayer topology and hosting model.
7.  The exact CyTube client userlist and login event payloads for the
    deployed client version.
8.  The LLM provider, orchestration model, rate limits, and agent memory
    policy.
9.  The navigation data representation and pathfinding algorithm.
10. The procedural-generation seed and content-validation strategy.
11. Performance budgets and representative mobile test devices.
12. Whether the single-file deployment is built from modular source or
    maintained directly.

### 20.1 Explicit non-goals for the immediate phase

-   Do not attempt a complete rigid-body physics engine before shared
    character movement is reliable.
-   Do not build a fully persistent multiplayer universe before local
    physical and character foundations are stable.
-   Do not give LLMs direct scene-graph or authoritative-state access.
-   Do not create a separate movement controller for each destination.
-   Do not generate visual-only buildings that cannot be traversed or
    interacted with.
-   Do not introduce a separate identity/password system for the initial
    CyTube community roster.
-   Do not claim that a prototype feature is complete solely because its
    code exists.

## 21. Phased development roadmap

### Phase 1 --- Shared physical environment

**Goal:** Establish one reliable movement and physical-environment
foundation.

Work items: - Define coordinate-frame and physical-entity interfaces. -
Consolidate collision records and compound collision handling. -
Implement character-body collision with continuous or swept movement. -
Add raycast/shape-cast support-surface detection. - Integrate terrain,
floors, roofs, decks, ramps, and platforms. - Unify planetary and
station walking. - Query gravity fields through a common interface. -
Preserve spacecraft flight behavior and Kinetic Field behavior. - Add
automated and in-browser acceptance tests.

**Exit condition:** A character can move reliably across representative
planetary terrain, station interiors, decks, roofs, and platforms
without falling through supported surfaces or passing through solid
obstacles.

### Phase 2 --- Universal character and controller system

**Goal:** Make characters persistent entities with interchangeable
controllers.

Work items: - Define persistent character identity and state. -
Standardize movement and interaction commands. - Define controller
ownership and handoff. - Add human, scripted, and LLM controller
adapters. - Define structured observations and event delivery. -
Integrate CyTube account-to-character mapping using verified client
events. - Add reconnect and control-reclamation behavior.

**Exit condition:** A community character can be controlled by a human,
handed to an autonomous controller, and reclaimed by the human without
losing its identity or state.

### Phase 3 --- Navigation and interaction

**Goal:** Make environments usable by both human players and autonomous
characters.

Work items: - Generate navigation data from walkable surfaces. - Add
pathfinding and obstacle avoidance. - Support doors, stairs, ramps,
elevators, hatches, and boarding points. - Implement common interaction
discovery and validation. - Add stuck detection and recovery. - Support
activity-oriented autonomous behavior.

**Exit condition:** An autonomous character can navigate a
representative building, use its doors and facilities, and reach a
requested destination using the same movement constraints as a human.

### Phase 4 --- Procedural environments

**Goal:** Make generated worlds physically coherent and playable.

Work items: - Establish generation pipeline and entity schemas. -
Generate terrain, structures, and environmental metadata. - Generate
collision, support, navigation, and interaction data. - Add ecosystem
and resource-generation interfaces. - Validate generated content. -
Support saving and promoting selected discoveries to curated
destinations.

**Exit condition:** A generated destination contains traversable terrain
and structures with functioning collision, navigation, and interaction
metadata.

### Phase 5 --- Shared persistent multiplayer

**Goal:** Allow independent clients and agents to inhabit the same
authoritative world.

Work items: - Choose authority and hosting topology. - Implement session
discovery and joining. - Synchronize character, vehicle, and interaction
state. - Add ownership and permission enforcement. - Implement
persistence, snapshots, and event updates. - Add reconnect, conflict
resolution, and version compatibility. - Secure economy and inventory
transactions.

**Exit condition:** Two independent clients observe consistent shared
character and world state, can interact without conflicting authority,
and recover correctly after reconnecting.

### Phase 6 --- Universe expansion

**Goal:** Expand content and social systems on the established
foundations.

Potential work: - More curated planets, moons, stations, and
settlements. - Procedural flora, fauna, minerals, and points of
interest. - Persistent community characters and social activities. -
Drive-in theater, Lemmy's Ranch, Whizz's Dance House, Thunderdome, Ayyum
Space Track, and other venues. - In-game credits, games, and credit-only
betting under authoritative rules. - More vehicles, spacecraft, and
exploration systems.

## 22. Testing and release discipline

Every release should identify:

-   Exact source baseline and version.
-   Intended changes and preserved behaviors.
-   Syntax-check results.
-   Static feature and regression checks.
-   Targeted harness tests.
-   Browser/CyTube tests actually performed.
-   Devices and browsers tested.
-   Known limitations and unresolved defects.
-   Exact published source and commit.

A release should never describe a browser test as completed unless it
was actually run. Source-level checks are valuable, but they do not
prove rendering, touch input, collision behavior, or CyTube integration
at runtime.

The companion document
`KEPLER_REACH_ENGINEERING_ACCEPTANCE_AND_RELEASE_CHECKLIST_v1.0.md`
provides practical acceptance and release checklists.

## 23. Architectural decision register

  -----------------------------------------------------------------------
  ID                      Decision                Status
  ----------------------- ----------------------- -----------------------
  AR-001                  Use a shared            Accepted direction
                          physical-environment    
                          architecture            

  AR-002                  Use hybrid collision    Accepted direction
                          and support-surface     
                          queries                 

  AR-003                  Use one character       Accepted direction
                          movement system for all 
                          controllers             

  AR-004                  Keep character identity Accepted direction
                          independent of          
                          controller              

  AR-005                  LLMs request bounded    Accepted direction
                          actions; engine owns    
                          physical truth          

  AR-006                  Use CyTube's            Accepted direction;
                          account/userlist        exact payloads to
                          mechanisms for          verify
                          community mapping       

  AR-007                  Preserve approved       Preservation
                          spacecraft flight       requirement
                          behavior                

  AR-008                  Treat Haven as the      Accepted
                          handcrafted permanent   
                          home world              

  AR-009                  Generate physical and   Accepted direction
                          interaction metadata    
                          with procedural         
                          geometry                

  AR-010                  Plan for authoritative  Accepted direction;
                          shared multiplayer      topology unresolved
                          state                   

  AR-011                  Keep a browser/CyTube   Accepted near-term
                          script as the initial   constraint
                          delivery path           

  AR-012                  Use in-game credits     Accepted direction
                          only; no real-money     
                          betting                 
  -----------------------------------------------------------------------

## 24. Closing principle

Kepler Reach should grow by adding content to a coherent universe, not
by accumulating unrelated destination-specific systems. The most
valuable next investment is the shared physical and character
foundation. Once characters can reliably move, perceive, navigate, and
interact in any environment, procedural worlds, persistent community
characters, LLM agents, and multiplayer become extensions of the same
architecture rather than separate projects.