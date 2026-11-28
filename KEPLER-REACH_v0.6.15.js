
(() => {
  "use strict";

  // ============================================================
  // KEPLER REACH 0.6.15
  // Procedural 3D Universe for CyTube
  //
  // Author: Elwood Edwards
  // Renderer: Three.js r160 / WebGL
  //
  // FEATURES
  // - v0.6.15: Shared moving-support attachments carry arbitrary actors with translating/rotating platforms
  // - v0.6.15: World-space support-frame transforms preserve actor parent hierarchies and orientation vectors
  // - v0.6.15: Reusable by characters, creatures, vehicles, scripts and LLM-controlled actors
  // - v0.6.14: Shared capsule collision resolution for characters, creatures, vehicles and external controllers
  // - v0.6.14: Shared actor movement combines solid sweeps, boundary crossing, gravity and optional support sampling
  // - v0.6.14: Rover movement joins the common collision path while retaining its terrain solver
  // - v0.6.13: Shared actor-physics probes for gravity, terrain support, solid obstacles and world boundaries
  // - v0.6.13: Machine-readable physical observations exposed to characters, vehicles, LLM agents and scripts
  // - v0.6.13: Read-only simulation adapters prepare common contact resolution without replacing stable movement solvers
  // - v0.6.12: Unified physical interaction discovery for solids, supports, terrain, structures, gravity and boundaries
  // - v0.6.12: Shared physical observation for human, LLM-agent and scripted character controllers
  // - v0.6.12: Spatial filtering occurs before result limits to prevent category starvation
  // - v0.6.11: Shared world-space spatial resolver for render objects, gravity fields and spherical boundaries
  // - v0.6.11: KeplerReach.world.spatial.query/nearby/nearest use one registry-backed spatial query path
  // - v0.6.10: Gravity fields and spherical world boundaries become first-class One World entities
  // - v0.6.10: World API exposes gravityFields() and boundaries() registry queries and lifecycle removal
  // - v0.6.05: Three selectable explorers; original spaceman is default and fully restorable
  // - v0.6.05: Imported explorers receive model-relative ray-gun placement; George arm-pose fallback improved
  // - v0.6.04: Selectable Trash-Can Robot explorer; lazy GLB load, shared controller/equipment, normalized scale and procedural gait
  // - v0.6.03: Explorer selector HUD; George remains default and can be restored at any time
  // - v0.6.03: GLB attribution retained (FySyde / CC-BY-4.0 / Sketchfab Bender model)
  // - v0.6.02: Existing solid colliders and walkable supports are registered as World entities
  // - v0.6.02: Collision/support tags bridge the shared World registry to the existing collision pipeline
  // - v0.6.02: World API exposes collider/support queries and collision-index diagnostics
  // - v0.6.01: World transform-write API for registered Object3D entities (local/world position and rotation)
  // - v0.6.01: Refresh API synchronizes live scene transforms into World snapshots
  // - v0.6.01: Spatial queries select nearest matches before applying result limits
  // - v0.6.01: Snapshot filtering and truncation metadata report the actual returned set
  // - v0.6.00: One World entity registry with stable IDs, hierarchy, transforms, lifecycle, tags and state
  // - v0.6.00: Existing physical-body and support-surface systems adapt into the registry
  // - v0.6.00: Public World API for registration, inspection, queries and state updates
  // - v0.6.00: Backward-compatible Three.js rendering, gravity, collision and movement adapters
  // - v0.5.11: George taller (~2.6m world) + arms-down from T-pose for idle/walk
  // - v0.5.10: George scale fix (was double-scaled tiny) + procedural walk cycle (bones if present, else whole-body stride)
  // - v0.5.9: George-2077.glb as default on-foot explorer (CDN load, scale normalize, gun/jetpack attach, procedural fallback)
  // - v0.5.8: On-foot laser draws as a long depth-test-off tracer (not a glow ball); ship beam unchanged
  // - v0.5.7: Ray gun — bright long-lived laser beam, always visible muzzle→impact, clear hit/miss feedback
  // - v0.5.6: Unified mobile control chrome — same 8-way + look pads in walk/ship/buggy; no stuck vehicle UI
  // - v0.5.5: Asteroid belt mining — ship or EVA mining laser, instanced rock HP, ore from belt
  // - v0.5.4: Permanent LUNA MINE next to moon pad (big rocks, always visible, dig with ray gun)
  // - v0.5.3: Mine site always near pad (surface-parented) + bright beacon; ray gun fires a visible beam (not just glow)
  // - v0.5.2: 8-way D-pad replaces analog move stick; Kinetic Field flight raises both arms (~2 o'clock / 45°)
  // - v0.5.1: Mobile landscape controls — large 🔫 fire + ⛏️ dig buttons, orientation-aware layout
  // - v0.5.1: Touch-friendly ray gun / mine actions (pointer capture, no click-only)
  // - v0.5.0: VOXEL MINING — sparse chunk VoxelWorld + diggable asteroid by the Haven/Luna pad; ray gun carves voxels
  // - v0.5.0: environment destruction (mine rock, holes persist, ore counted toward credits hint)
  // - v0.4.06: Last Stop home-dock landing beacon (landing assist, disembark and re-board now work at the home station)
  // - v0.4.06: boarding a ship that was left parked in place launches from where it sits (no more teleport to the last pad)
  // - v0.4.06: agent API: turn +1 now means RIGHT in Kinetic Field; forward/strafe drive the precision translation controls
  // - v0.4.06: agent API: state() adds destinations, events (recent HUD messages), structure, kineticField gate and control owner
  // - v0.4.06: controller ownership: agent/script claims lock the human's movement input (auto hand-back after 20 s of agent silence); characters.handoff()/reclaim()
  // - v0.4.06: HUD status messages are de-duplicated (no per-frame console spam) and kept in a bounded event log
  // - v0.4.06: a single frame fault no longer stops the render loop; five faults inside three seconds do
  // - v0.4.06: removed the invalid flatShading flag on the sun's MeshBasicMaterial (console warning at startup)
  // - v0.4.05: Kinetic Field attitude follows changing local gravity frames; station launch gates are location-scoped
  // - Procedural starfield
  // - Procedural low-poly planet
  // - Dynamic vehicle occupants and cargo slots
  // - Empty rover until a player boards
  // - Procedural spacecraft
  // - Procedural orbital station
  // - Central star and lighting
  // - Atmospheric planetary shell
  // - Keyboard flight controls
  // - Mobile touch controls
  // - Stabilized third-person spacecraft chase camera
  // - First-person spacecraft cockpit camera
  // - In-flight camera switching
  // - Lemmy's Ranch economy, inventory, NPC dialogue and quests
  // - Five animated saloon dancers and buggy passenger invitations
  // - Nose-relative direct flight translation with zero drift
  // - Rotation joystick and translation D-pad
  // - Planet-radial gravity reference and upright character orientation
  // - Terrain heightfield grounding with a near-vertical-wall-only movement limit
  // - Separate terrain normals for slope and foot-placement information
  // - Live world XYZ coordinates and ship range/bearing navigation
  // - Radial terrain grounding, near-vertical wall checks and smoothed camera clearance
  // - Terrain and obstacle checks for the moon buggy
  // - Visible initialization diagnostics
  // - Modular GLB/glTF model registry and lazy loader
  // - Explorer jetpack with local-gravity thrust, fuel and twin exhaust effects
  // - Hand-held ray gun with first-person aiming and harmless practice targets
  // - In-game local GLB workshop with preview, scale/orientation controls and ship replacement
  // - Model scale/pivot normalization and named attachment sockets
  // - Procedural fallbacks retained for all current vehicles and characters
  // - v0.3.82: shared camera collision (terrain march + cached blocker list) for every view
  // - v0.3.82: ship-versus-planet/moon terrain collision (no more flying through Haven)
  // - v0.3.82: ship chase camera keeps its heading when the nose points up or down
  // - v0.3.82: rigid first-person cameras (no lag/slide), carried-frame update ordering
  // - v0.3.82: unified control intent layer: humans, scripts and LLM agents drive the same controls
  // - v0.3.82: KeplerReach.state()/input/actions/agent/characters/registerControllable API
  // - v0.3.82: character roster and claims (e.g. Benis the sheriff: human, LLM or script)
  // - v0.3.83: oriented-box (OBB) solid collision with cached local bounds, wall sliding and no pinned spawns
  // - v0.3.84: shared gravity-relative support-surface registry for terrain, pads, decks, piers and roofs
  // - v0.3.84: grounded walking, ledge departure and airborne landing query the same support system
  // - v0.3.84: support surfaces are inspectable and extensible through the public physics API
  // - v0.3.97: defer support-raycaster and normal-matrix construction until Three.js has loaded
  // - v0.3.97: resolve airborne vertical movement against shared solid colliders
  // - v0.3.98: frame-cached spatial hash limits character collision queries to nearby solid colliders
  // - v0.3.99: spatial hash uses transformed collider AABBs for conservative coverage under nested rotations and non-uniform scale
  // - v0.4.00: per-frame collision broadphase diagnostics expose index and candidate work for Phase 1 acceptance testing
  // - v0.4.01: per-frame support-surface diagnostics expose structural raycast, slope/range rejection, terrain fallback and support misses
  // - v0.4.04: restore the approved v0.4.01 mobile control layout; retain v0.4.02 flight and structural-landing behavior
  // - v0.4.02: Kinetic Field structural landing, L'Astrolabe roof access, precision translation controls
  //
  // NO SERVER REQUIRED
  // v0.4.04: BOOST and flight-look control placement restored to v0.4.01 layout
  // PUBLIC CONTROL / AGENT API IS AVAILABLE; CYTUBE NETWORK SYNC IS NOT YET IMPLEMENTED
  // ============================================================

  if (window.KeplerReach) {
    window.KeplerReach.destroy();
  }

  const CONFIG = {
    version: "0.6.15",
    seed: 847291,
    threeVersion: "0.160.0",

    starCount: 3500,
    settlementCount: 280,
    asteroidCount: 520,

    planetRadius: 110,
    moonRadius: 48,
    planetPosition: [0, 0, -650],

    acceleration: 65,
    maximumSpeed: 150,

    background: 0x11152a
  };

  // ============================================================
  // SEEDED RANDOM GENERATOR
  // ============================================================

  function seededRandom(seed) {
    let state = seed >>> 0;

    return function () {
      state += 0x6D2B79F5;

      let t = state;

      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Shared physical reference: one world unit represents approximately one metre.
  const WORLD_SCALE = Object.freeze({
    unitsPerMeter: 1, explorerHeight: 2.0, doorwayHeight: 3.2,
    moonBuggyLength: 7.5, motorcycleLength: 3.0, mountLength: 3.2,
    jetpackHeight: 1.2, walkSpeed: 5.2, maxWalkSlopeDegrees: 45,
    cameraClearance: 0.55
  });

  // A lightweight planetary character controller. The capsule dimensions
  // describe the player's collision envelope; terrain contact is solved
  // analytically against Haven's deterministic radial heightfield.
  const PLAYER_CAPSULE = Object.freeze({
    height: WORLD_SCALE.explorerHeight,
    radius: 0.42,
    maxSubstepDistance: 0.20,
    verticalWallThresholdDegrees: 89.5,
    groundSkin: 0.03
  });
  // First-pass planetary gravity model in game-world metres per second squared.
  const BODY_PHYSICS = Object.freeze({
    haven: Object.freeze({ gravity: 9.8, radius: CONFIG.planetRadius }),
    moon: Object.freeze({ gravity: 1.62, radius: CONFIG.moonRadius })
  });
  // UNIVERSAL PHYSICS FOUNDATION. Orbital time is game-scaled; local gravity
  // uses reusable radial or directional fields with inverse-square falloff.
  const PHYSICS_G=6.67430e-11, physicalBodies=new Map(), gravityFields=new Map(), sphericalBoundaries=[];

  // ONE WORLD: stable entity identity and shared state, layered over legacy render/physics adapters.
  const WORLD_SCHEMA_VERSION = "kepler-world/4";
  const worldEntities = new Map();
  const worldObjectIds = new WeakMap();
  let worldRevision = 0;
  function worldVector(v) {
    if (!v) return null;
    if (Array.isArray(v)) return v.slice(0,3).map(Number);
    if (v.isVector3) return [v.x,v.y,v.z];
    if ([v.x,v.y,v.z].every(Number.isFinite)) return [v.x,v.y,v.z];
    return null;
  }
  function registerWorldEntity(object, profile = {}) {
    if (!object || typeof object !== "object") throw new TypeError("World entities require an object reference.");
    const id = String(profile.id || object.name || object.uuid || "");
    if (!id) throw new Error("World entities require a stable id.");
    const e = worldEntities.get(id) || { id, createdAt: Date.now(), state: Object.create(null), tags: [], lifecycle: "active" };
    e.kind = String(profile.kind || e.kind || "object");
    e.name = String(profile.name || object.name || e.name || id);
    e.representation = profile.representation || (object.isObject3D ? "three-object3d" : "data-object");
    e.owner = profile.owner !== undefined ? profile.owner : (e.owner || null);
    e.persistence = profile.persistence || e.persistence || "session";
    e.material = profile.material || e.material || "unknown";
    for (const k of ["massKg","densityKgM3","structuralStrength"]) if (profile[k] !== undefined) e[k] = Math.max(0, Number(profile[k]) || 0);
    e.instanceId = Number.isInteger(profile.instanceId) ? profile.instanceId : (e.instanceId ?? null);
    e.localPosition = profile.localPosition !== undefined ? worldVector(profile.localPosition) : (e.localPosition || null);
    e.object = object; e.objectUuid = object.uuid || e.objectUuid || null;
    // Non-rendered spatial entities (gravity volumes, boundaries, portals)
    // may anchor their world position to a live Object3D plus local offset.
    if (profile.spatialRoot !== undefined) e.spatialRoot = profile.spatialRoot;
    if (profile.spatialOffset !== undefined) e.spatialOffset = worldVector(profile.spatialOffset);
    e.parentId = profile.parentId !== undefined ? profile.parentId : (e.parentId || null);
    const incomingTags = Array.isArray(profile.tags) ? profile.tags.map(String) : [];
    e.tags = Array.from(new Set([...(e.tags || []), ...incomingTags]));
    if (profile.state && typeof profile.state === "object") Object.assign(e.state, profile.state);
    if (profile.metadata && typeof profile.metadata === "object") e.metadata = { ...(e.metadata || {}), ...profile.metadata };
    e.lifecycle = profile.lifecycle || "active"; e.updatedAt = Date.now();
    worldEntities.set(id,e);
    if (object.isObject3D && e.instanceId === null) worldObjectIds.set(object,id);
    worldRevision++;
    return e;
  }
  function syncWorldEntity(e) {
    const o=e && e.object;
    if ((!o || !o.isObject3D) && e && e.spatialRoot && e.spatialRoot.isObject3D) {
      const root=e.spatialRoot;
      root.updateWorldMatrix(true,false);
      const offset=e.spatialOffset||[0,0,0];
      const p=root.localToWorld(new THREE.Vector3(offset[0],offset[1],offset[2]));
      const q=root.getWorldQuaternion(new THREE.Quaternion());
      const z=root.getWorldScale(new THREE.Vector3());
      e.transform={position:[p.x,p.y,p.z],quaternion:[q.x,q.y,q.z,q.w],scale:[z.x,z.y,z.z],coordinateSpace:"world"};
      return e;
    }
    if (!o || !o.isObject3D) return e;
    if (e.instanceId !== null && e.localPosition) {
      e.transform={position:e.localPosition.slice(),coordinateSpace:"parent-local"};
      return e;
    }
    o.updateWorldMatrix(true,false);
    const p=o.getWorldPosition(new THREE.Vector3()), q=o.getWorldQuaternion(new THREE.Quaternion()), z=o.getWorldScale(new THREE.Vector3());
    e.transform={position:[p.x,p.y,p.z],quaternion:[q.x,q.y,q.z,q.w],scale:[z.x,z.y,z.z],localPosition:[o.position.x,o.position.y,o.position.z],coordinateSpace:"world"};
    const parent=o.parent && worldObjectIds.get(o.parent); if(parent)e.parentId=parent;
    return e;
  }
  function worldEntitySnapshot(e) {
    syncWorldEntity(e);
    return {id:e.id,name:e.name,kind:e.kind,representation:e.representation,owner:e.owner,persistence:e.persistence,lifecycle:e.lifecycle,parentId:e.parentId,objectUuid:e.objectUuid,instanceId:e.instanceId,localPosition:e.localPosition,transform:e.transform?{...e.transform}:null,physical:{massKg:e.massKg??null,densityKgM3:e.densityKgM3??null,structuralStrength:e.structuralStrength??null,material:e.material},tags:e.tags.slice(),state:{...e.state},metadata:{...(e.metadata||{})},createdAt:e.createdAt,updatedAt:e.updatedAt};
  }
  function getWorldEntity(id) { const e=worldEntities.get(String(id)); return e?worldEntitySnapshot(e):null; }
  function listWorldEntities(options={}) {
    const limit=Math.max(1,Math.min(5000,Number(options.limit)||500)), kind=options.kind?String(options.kind):null, tag=options.tag?String(options.tag):null, lifecycle=options.lifecycle===undefined?"active":String(options.lifecycle), out=[];
    for(const e of worldEntities.values()){if(kind&&e.kind!==kind)continue;if(lifecycle&&e.lifecycle!==lifecycle)continue;if(tag&&!e.tags.includes(tag))continue;out.push(worldEntitySnapshot(e));if(out.length>=limit)break;}
    return out;
  }
  function queryWorldEntities(options={}) {
    const c=worldVector(options.center), radius=Number.isFinite(Number(options.radius))?Math.max(0,Number(options.radius)):Infinity, r2=radius*radius, kind=options.kind?String(options.kind):null, tag=options.tag?String(options.tag):null, limit=Math.max(1,Math.min(2000,Number(options.limit)||250)), out=[];
    for(const e of worldEntities.values()){
      if(e.lifecycle!=="active"||(kind&&e.kind!==kind)||(tag&&!e.tags.includes(tag)))continue;
      const snap=worldEntitySnapshot(e),p=snap.transform&&snap.transform.position;
      if(c&&p&&snap.transform.coordinateSpace!=="parent-local"){
        const dx=p[0]-c[0],dy=p[1]-c[1],dz=p[2]-c[2],d2=dx*dx+dy*dy+dz*dz;
        if(d2>r2)continue;
        snap.distance=Math.sqrt(d2);
      }else if(c&&radius!==Infinity)continue;
      out.push(snap);
    }
    if(c)out.sort((a,b)=>(a.distance??Infinity)-(b.distance??Infinity));
    return out.slice(0,limit);
  }
  // Shared spatial service. All spatial categories are queried through the same
  // world entity registry and world-space transform resolver.
  function queryWorldSpatial(options={}) {
    const center=worldVector(options.center);
    if (!center || !center.every(Number.isFinite)) throw new TypeError("Spatial queries require a finite world-space center.");
    const radius=options.radius===undefined?Infinity:Number(options.radius);
    if (!(radius>=0) || Number.isNaN(radius)) throw new TypeError("Spatial query radius must be non-negative.");
    const kinds=Array.isArray(options.kinds)?new Set(options.kinds.map(String)):null;
    const tags=Array.isArray(options.tags)?new Set(options.tags.map(String)):null;
    const limit=Math.max(1,Math.min(5000,Number(options.limit)||250));
    const results=[];
    // Filter before truncation so unrelated entities cannot hide nearby physics.
    for(const entity of worldEntities.values()){
      if(entity.lifecycle!=="active" || (kinds&&!kinds.has(entity.kind)) ||
        (tags&&!entity.tags.some(tag=>tags.has(tag)))) continue;
      const snap=worldEntitySnapshot(entity),p=snap.transform&&snap.transform.position;
      if(p && snap.transform.coordinateSpace!=="parent-local"){
        const dx=p[0]-center[0],dy=p[1]-center[1],dz=p[2]-center[2],d2=dx*dx+dy*dy+dz*dz;
        if(d2>radius*radius)continue;
        snap.distance=Math.sqrt(d2);
      } else if(radius!==Infinity) continue;
      results.push(snap);
    }
    results.sort((a,b)=>(a.distance??Infinity)-(b.distance??Infinity));
    return results.slice(0,limit);
  }
  function nearestWorldSpatial(options={}) {
    const results=queryWorldSpatial({...options,limit:1});
    return results[0]||null;
  }
  function queryPhysicalInteractions(options={}) {
    const center=worldVector(options.center);
    if(!center || !center.every(Number.isFinite)) throw new TypeError("Physical interaction queries require a finite world-space center.");
    const radius=options.radius===undefined?12:Number(options.radius);
    if(!Number.isFinite(radius)||radius<0) throw new TypeError("Physical interaction radius must be finite and non-negative.");
    const limit=Math.max(1,Math.min(1000,Number(options.limit)||200));
    const all=queryWorldSpatial({center,radius,limit:5000});
    const solids=all.filter(e=>e.tags.includes("collision")||e.tags.includes("solid"));
    const supports=all.filter(e=>e.tags.includes("walkable")||e.tags.includes("support"));
    const gravity=all.filter(e=>e.kind==="gravity-field"||e.tags.includes("gravity"));
    const boundaries=all.filter(e=>e.kind==="world-boundary"||e.tags.includes("boundary"));
    const terrain=all.filter(e=>e.kind==="terrain"||e.tags.includes("terrain"));
    const structures=all.filter(e=>e.kind==="structure"||e.tags.includes("structure"));
    return {center,radius,revision:worldRevision,entities:all.slice(0,limit),solids:solids.slice(0,limit),supports:supports.slice(0,limit),terrain:terrain.slice(0,limit),structures:structures.slice(0,limit),gravityFields:gravity.slice(0,limit),boundaries:boundaries.slice(0,limit),nearestSolid:solids[0]||null,nearestSupport:supports[0]||null};
  }
  function discoverPhysicalInteractions(options={}) {
    const result=queryPhysicalInteractions(options);
    return {revision:result.revision,nearby:result.entities,solids:result.solids,supports:result.supports,terrain:result.terrain,structures:result.structures,gravityFields:result.gravityFields,boundaries:result.boundaries,nearestSolid:result.nearestSolid,nearestSupport:result.nearestSupport};
  }
  function evaluateActorPhysics(options={}) {
    if(!THREE)throw new Error("Three.js physics services are not ready.");
    const actor=options.actor||null;
    let position=worldVector(options.position);
    if(!position&&actor&&actor.isObject3D){
      actor.updateWorldMatrix(true,false);
      const p=actor.getWorldPosition(new THREE.Vector3());position=[p.x,p.y,p.z];
    }
    if(!position)throw new TypeError("Actor physics evaluation requires a world position or Object3D.");
    const pos=new THREE.Vector3(position[0],position[1],position[2]);
    let up=worldVector(options.up),forward=worldVector(options.forward);
    if(!up&&actor&&actor.isObject3D){const q=actor.getWorldQuaternion(new THREE.Quaternion());const v=new THREE.Vector3(0,1,0).applyQuaternion(q);up=[v.x,v.y,v.z];}
    if(!up)up=[0,1,0];
    const upVector=new THREE.Vector3(up[0],up[1],up[2]);
    if(upVector.lengthSq()<1e-8)upVector.set(0,1,0);else upVector.normalize();
    if(!forward&&actor&&actor.isObject3D){const v=actor.getWorldDirection(new THREE.Vector3());forward=[v.x,v.y,v.z];}
    if(!forward)forward=[0,0,-1];
    const forwardVector=new THREE.Vector3(forward[0],forward[1],forward[2]);
    if(forwardVector.lengthSq()<1e-8)forwardVector.set(0,0,-1);else forwardVector.normalize();
    const radius=Math.max(0.05,Number(options.radius)||0.45);
    const height=Math.max(radius*2,Number(options.height)||2);
    const lookAhead=Math.max(0,Math.min(30,Number(options.lookAhead)||Math.max(1.5,radius*3)));
    const gravity=queryGravityField(pos);
    const gravityUp=gravity&&gravity.up?gravity.up.clone().normalize():upVector.clone();
    const gravityVector=gravity?gravityUp.clone().multiplyScalar(-Math.max(0,Number(gravity.magnitude)||0)):new THREE.Vector3();
    let support=null;
    if(options.includeSupport!==false){
      try{support=sampleFootSupport(pos,gravityUp,{maxRise:Number.isFinite(options.maxRise)?Math.max(0,options.maxRise):0.65,maxDrop:Number.isFinite(options.maxDrop)?Math.max(0,options.maxDrop):1.5,preferredSupportObject:options.preferredSupportObject||null});}
      catch(error){support=null;}
    }
    const right=new THREE.Vector3().crossVectors(forwardVector,gravityUp);
    if(right.lengthSq()<1e-8)right.set(1,0,0);else right.normalize();
    const rayOrigin=pos.clone().addScaledVector(gravityUp,height*0.5);
    const offsets=[0,-radius*0.8,radius*0.8];
    let obstacle=null;
    if(lookAhead>0&&solidColliders.length){
      const raycaster=new THREE.Raycaster();raycaster.near=0.05;raycaster.far=lookAhead;
      for(const offset of offsets){
        const origin=rayOrigin.clone().addScaledVector(right,offset);
        raycaster.set(origin,forwardVector);
        const hits=raycaster.intersectObjects(solidColliders,true);
        const hit=hits.find(h=>h.object&&h.object.visible&&h.distance>0.05);
        if(hit&&(!obstacle||hit.distance<obstacle.distance)){
          const id=hit.object.userData&&hit.object.userData.krWorldId||worldObjectIds.get(hit.object)||null;
          obstacle={id,distance:hit.distance,point:[hit.point.x,hit.point.y,hit.point.z],normal:hit.face?hit.face.normal.clone().transformDirection(hit.object.matrixWorld).toArray():null,objectName:hit.object.name||null};
        }
      }
    }
    const boundaryContacts=[];
    for(const boundary of sphericalBoundaries){
      if(!boundary.root)continue;
      boundary.root.updateWorldMatrix(true,false);
      const local=boundary.root.worldToLocal(pos.clone()),delta=local.sub(boundary.center),distance=delta.length(),signedDistance=boundary.radius-distance;
      const threshold=Math.max(radius*2,Number(options.boundaryThreshold)||3);
      if(Math.abs(signedDistance)<=threshold||distance>=boundary.radius){
        boundaryContacts.push({id:boundary.id,distanceM:distance,radiusM:boundary.radius,signedDistanceM:signedDistance,inside:distance<=boundary.radius,near:Math.abs(signedDistance)<=threshold,normalLocal:distance>1e-8?delta.normalize().toArray():[0,1,0]});
      }
    }
    const nearby=queryPhysicalInteractions({center:position,radius:Math.max(lookAhead+radius,Number(options.discoveryRadius)||12),limit:Math.max(20,Math.min(250,Number(options.limit)||100))});
    return {
      position,up:gravityUp.toArray(),forward:forwardVector.toArray(),
      gravity:gravity?{fieldId:gravity.id,kind:gravity.kind,magnitudeMS2:gravity.magnitude,vectorMS2:gravityVector.toArray(),altitudeM:gravity.altitude}:null,
      support:support?{grounded:!!support.grounded,supportId:support.supportId||null,position:support.position.toArray(),normal:(support.terrainNormal||support.up||gravityUp).toArray(),slopeDegrees:Number(support.slopeDegrees)||0,terrain:support.terrain||null}:null,
      obstacle,boundaries:boundaryContacts,nearby:{revision:nearby.revision,solids:nearby.solids,supports:nearby.supports,gravityFields:nearby.gravityFields,boundaries:nearby.boundaries},
      probe:{radiusM:radius,heightM:height,lookAheadM:lookAhead}
    };
  }
  function registerPhysicalWorldEntity(object,profile={}) {
    const p={...profile},tags=new Set(Array.isArray(p.tags)?p.tags.map(String):[]);
    const role=String(p.physicalRole||p.kind||"").toLowerCase();
    if(p.solid===true||["solid","collider","structure","rock","obstacle"].includes(role)){tags.add("physical");tags.add("solid");tags.add("collision");}
    if(p.walkable===true||p.support===true||["terrain","ground","support-surface","walkable"].includes(role)){tags.add("physical");tags.add("support");tags.add("walkable");}
    if(["terrain","ground"].includes(role))tags.add("terrain");
    if(["structure","building"].includes(role))tags.add("structure");
    p.tags=Array.from(tags);
    p.kind=p.kind||(["terrain","ground"].includes(role)?"terrain":["structure","building"].includes(role)?"structure":"physical-object");
    delete p.physicalRole;delete p.solid;delete p.walkable;delete p.support;
    return registerWorldEntity(object,p);
  }

  function setWorldEntityState(id,patch) {
    const e=worldEntities.get(String(id));
    if(!e||!patch||typeof patch!=="object"||Array.isArray(patch))return false;
    Object.assign(e.state,patch);e.updatedAt=Date.now();worldRevision++;return true;
  }
  function worldFiniteArray(value,length,label) {
    const a=Array.isArray(value)?value.slice(0,length):(value&&typeof value==="object"?Array.from({length},(_,i)=>value[["x","y","z","w"][i]]):null);
    if(!a||a.length!==length||!a.every(v=>Number.isFinite(Number(v))))throw new TypeError("World transform "+label+" must contain "+length+" finite numbers.");
    return a.map(Number);
  }
  function setWorldEntityTransform(id,patch={}) {
    const e=worldEntities.get(String(id));
    if(!e||!e.object||!e.object.isObject3D||e.instanceId!==null||!patch||typeof patch!=="object"||Array.isArray(patch))return false;
    const o=e.object,space=patch.space==="world"?"world":"local";
    if(patch.position!==undefined){
      const a=worldFiniteArray(patch.position,3,"position"),p=new THREE.Vector3(a[0],a[1],a[2]);
      if(space==="world"&&o.parent){o.parent.updateWorldMatrix(true,false);o.parent.worldToLocal(p);}
      o.position.copy(p);
    }
    if(patch.quaternion!==undefined||patch.rotation!==undefined){
      let q;
      if(patch.quaternion!==undefined){const a=worldFiniteArray(patch.quaternion,4,"quaternion");q=new THREE.Quaternion(a[0],a[1],a[2],a[3]).normalize();}
      else {const a=worldFiniteArray(patch.rotation,3,"rotation");q=new THREE.Quaternion().setFromEuler(new THREE.Euler(a[0],a[1],a[2],"XYZ"));}
      if(space==="world"&&o.parent){o.parent.updateWorldMatrix(true,false);const parentQ=o.parent.getWorldQuaternion(new THREE.Quaternion());q.premultiply(parentQ.invert()).normalize();}
      o.quaternion.copy(q);
    }
    if(patch.scale!==undefined){const a=worldFiniteArray(patch.scale,3,"scale");o.scale.set(a[0],a[1],a[2]);}
    o.updateMatrix();o.updateWorldMatrix(true,false);
    e.updatedAt=Date.now();worldRevision++;
    return worldEntitySnapshot(e);
  }
  function refreshWorldEntities(options={}) {
    const kind=options.kind?String(options.kind):null,tag=options.tag?String(options.tag):null;
    let refreshed=0,changed=0;
    for(const e of worldEntities.values()){
      if(kind&&e.kind!==kind)continue;
      if(tag&&!e.tags.includes(tag))continue;
      const before=e.transform?JSON.stringify(e.transform):"";
      syncWorldEntity(e);
      const after=e.transform?JSON.stringify(e.transform):"";
      if(before!==after)changed++;
      refreshed++;
    }
    if(changed)worldRevision++;
    return {schema:WORLD_SCHEMA_VERSION,revision:worldRevision,refreshed,changed,entityCount:worldEntities.size};
  }
  function removeWorldEntity(id) {
    const k=String(id),e=worldEntities.get(k);if(!e)return false;
    if(e.object&&e.object.isObject3D){
      worldObjectIds.delete(e.object);
      if(e.object.userData&&e.object.userData.krPhysics&&e.object.userData.krPhysics.id===k)delete e.object.userData.krPhysics;
      const supportId=e.object.userData&&e.object.userData.krWalkableSurface;
      if(supportId){const i=walkableSurfaces.indexOf(e.object);if(i>=0)walkableSurfaces.splice(i,1);}
    }
    physicalBodies.delete(k);
    if(k.startsWith("gravity-field:"))gravityFields.delete(k.slice("gravity-field:".length));
    if(k.startsWith("world-boundary:")){
      const boundaryId=k.slice("world-boundary:".length);
      const index=sphericalBoundaries.findIndex(b=>b.id===boundaryId);
      if(index>=0)sphericalBoundaries.splice(index,1);
    }
    worldEntities.delete(k);worldRevision++;return true;
  }
  function worldSnapshot(options={}) {
    const limit=Math.max(1,Math.min(5000,Number(options.limit)||500)),kind=options.kind?String(options.kind):null,tag=options.tag?String(options.tag):null,lifecycle=options.lifecycle===undefined?"active":String(options.lifecycle),entities=[];
    let matched=0;
    for(const e of worldEntities.values()){
      if((kind&&e.kind!==kind)||(tag&&!e.tags.includes(tag))||(lifecycle&&e.lifecycle!==lifecycle))continue;
      matched++;
      if(entities.length<limit)entities.push(worldEntitySnapshot(e));
    }
    return {schema:WORLD_SCHEMA_VERSION,revision:worldRevision,entityCount:worldEntities.size,matched,returned:entities.length,truncated:matched>entities.length,entities};
  }

  const HAVEN_DAY_SECONDS=7200, HAVEN_YEAR_SECONDS=21600, LUNA_ORBIT_SECONDS=2700, LAST_STOP_ORBIT_SECONDS=43200;
  function registerPhysicalBody(object,profile={}){
    if(!object)return null;
    const id=String(profile.id||object.name||("physical-"+object.uuid)),massKg=Math.max(0,Number(profile.massKg??1));
    const record={id,object,kind:profile.kind||"object",massKg,densityKgM3:Math.max(0,Number(profile.densityKgM3??1000)),structuralStrength:Math.max(0,Number(profile.structuralStrength??1)),material:profile.material||"unknown",instanceId:Number.isInteger(profile.instanceId)?profile.instanceId:null,localPosition:profile.localPosition||null};
    physicalBodies.set(id,record);
    registerWorldEntity(object,{...record,id,representation:record.instanceId===null?"three-object3d":"instanced-mesh-instance",tags:["physical"],persistence:"session"});
    if(object.userData&&record.instanceId===null)object.userData.krPhysics={id,kind:record.kind,massKg,densityKgM3:record.densityKgM3,structuralStrength:record.structuralStrength,material:record.material};
    return record;
  }
  function registerGravityField(id,field){
    if(!id||!field||!field.root)throw new Error("Gravity fields require an id and transform root.");
    const key=String(id);
    const record={id:key,...field};
    gravityFields.set(key,record);
    // Gravity volumes are first-class One World entities. Their live force
    // calculation remains in queryGravityField; the registry owns identity,
    // classification, metadata and lifecycle visibility.
    registerWorldEntity(record,{
      id:"gravity-field:"+key,
      kind:"gravity-field",
      name:key,
      tags:["spatial","gravity","gravity-field"],
      persistence:"session",
      spatialRoot:field.root,
      spatialOffset:field.center||[0,0,0],
      metadata:{
        shape:String(field.shape||"unknown"),
        priority:Number(field.priority)||0,
        radius:Number.isFinite(Number(field.radius))?Number(field.radius):null,
        influenceRadius:Number.isFinite(Number(field.influenceRadius))?Number(field.influenceRadius):null,
        magnitude:Number.isFinite(Number(field.magnitude))?Number(field.magnitude):null,
        surfaceGravity:Number.isFinite(Number(field.surfaceGravity))?Number(field.surfaceGravity):null
      }
    });
    return record;
  }
  function queryGravityField(worldPosition){
    if(!worldPosition)return null;
    const point=worldPosition.isVector3?worldPosition:new THREE.Vector3(Number(worldPosition.x),Number(worldPosition.y),Number(worldPosition.z));
    if(![point.x,point.y,point.z].every(Number.isFinite))return null;
    let best=null;
    for(const field of gravityFields.values()){
      const root=field.root;if(!root)continue;root.updateWorldMatrix(true,false);
      const local=root.worldToLocal(point.clone());
      if(field.shape==="box"){
        const b=field.bounds;
        if(local.x<b.minX||local.x>b.maxX||local.y<b.minY||local.y>b.maxY||local.z<b.minZ||local.z>b.maxZ)continue;
        const up=new THREE.Vector3(0,1,0).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion())).normalize();
        const c={id:field.id,kind:"directional",magnitude:field.magnitude,up,priority:field.priority||0,altitude:0};
        if(!best||c.priority>best.priority)best=c;
      }else if(field.shape==="radial"){
        const distance=Math.max(.001,local.length()),altitude=distance-field.radius;
        if(altitude < -2 || altitude > field.influenceRadius)continue;
        const up=local.clone().normalize().applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion())).normalize();
        const magnitude=field.massKg>0?PHYSICS_G*field.massKg/Math.pow(Math.max(distance,field.radius),2):field.surfaceGravity*Math.pow(field.radius/Math.max(distance,field.radius),2);
        const c={id:field.id,kind:"radial",magnitude,up,priority:field.priority||0,altitude};
        if(!best||c.priority>best.priority||(c.priority===best.priority&&c.altitude<best.altitude))best=c;
      }
    }
    return best;
  }
  function registerSphericalBoundary(spec){
    if(!spec||!spec.id||!spec.root||!spec.center||!(spec.radius>0))throw new Error("Spherical boundary requires id, root, center and positive radius.");
    const boundary={id:String(spec.id),root:spec.root,center:spec.center.clone(),radius:spec.radius,portal:typeof spec.portal==="function"?spec.portal:null};
    const existing=sphericalBoundaries.findIndex(b=>b.id===boundary.id);
    if(existing>=0)sphericalBoundaries[existing]=boundary;else sphericalBoundaries.push(boundary);
    // Boundaries join the same identity/lifecycle registry as bodies, supports
    // and colliders; portal execution remains owned by the boundary resolver.
    registerWorldEntity(boundary,{
      id:"world-boundary:"+boundary.id,
      kind:"world-boundary",
      name:boundary.id,
      tags:["spatial","boundary","world-boundary"],
      persistence:"session",
      spatialRoot:boundary.root,
      spatialOffset:[boundary.center.x,boundary.center.y,boundary.center.z],
      metadata:{shape:"sphere",radius:boundary.radius,center:[boundary.center.x,boundary.center.y,boundary.center.z],hasPortal:!!boundary.portal}
    });
    return boundary.id;
  }
  function resolveWorldBoundaries(fromWorld,toWorld){
    let result=toWorld.clone();
    for(const boundary of sphericalBoundaries){
      const root=boundary.root;root.updateWorldMatrix(true,false);
      const from=root.worldToLocal(fromWorld.clone()),to=root.worldToLocal(result.clone()),center=boundary.center;
      const a=from.clone().sub(center),b=to.clone().sub(center),r0=a.length(),r1=b.length(),radius=boundary.radius;
      const crossed=(r0<radius&&r1>=radius)||(r0>radius&&r1<=radius);
      if(!crossed)continue;
      const t=THREE.MathUtils.clamp((radius-r0)/(r1-r0),0,1),crossing=from.clone().lerp(to,t);
      if(boundary.portal&&boundary.portal(crossing))continue;
      const normal=b.lengthSq()>1e-8?b.normalize():a.normalize(),safeRadius=r0<radius?radius-.18:radius+.18;
      result=root.localToWorld(center.clone().addScaledVector(normal,safeRadius));
    }
    return result;
  }
  function registerCorePhysics(){
    const massFromGravity=(g,r)=>g*r*r/PHYSICS_G;
    if(planetWorld){const massKg=massFromGravity(BODY_PHYSICS.haven.gravity,CONFIG.planetRadius),densityKgM3=massKg/((4/3)*Math.PI*Math.pow(CONFIG.planetRadius,3));registerPhysicalBody(planetWorld,{id:"haven",kind:"planet",massKg,densityKgM3,material:"rock-water"});registerGravityField("haven-surface",{root:planetWorld,shape:"radial",radius:CONFIG.planetRadius,massKg,influenceRadius:2400,priority:1});}
    if(moonWorld){const massKg=massFromGravity(BODY_PHYSICS.moon.gravity,CONFIG.moonRadius),densityKgM3=massKg/((4/3)*Math.PI*Math.pow(CONFIG.moonRadius,3));registerPhysicalBody(moonWorld,{id:"luna",kind:"moon",massKg,densityKgM3,material:"rock"});registerGravityField("luna-surface",{root:moonWorld,shape:"radial",radius:CONFIG.moonRadius,massKg,influenceRadius:900,priority:1});}
    if(station){registerPhysicalBody(station,{id:"last-stop",kind:"space-station",massKg:24000000,densityKgM3:4200,material:"steel-composite"});registerGravityField("last-stop-deck",{root:station,shape:"box",bounds:{minX:-41,maxX:154,minY:4.5,maxY:90,minZ:-47,maxZ:47},magnitude:9.8,priority:20});}
    if(solarHabitatStation){registerPhysicalBody(solarHabitatStation,{id:"solar-commons",kind:"space-station",massKg:78000000,densityKgM3:3900,material:"steel-glass"});registerGravityField("solar-commons-dock",{root:solarHabitatStation,shape:"box",bounds:{minX:46,maxX:162,minY:4.5,maxY:90,minZ:-52,maxZ:190},magnitude:9.8,priority:20});}
    if(ship)registerPhysicalBody(ship,{id:"space-rv",kind:"spacecraft",massKg:18000,densityKgM3:950,material:"aluminium-composite"});
    if(playerAvatar)registerPhysicalBody(playerAvatar,{id:"player",kind:"character",massKg:85,densityKgM3:985,material:"living"});
    if(centralStar)registerPhysicalBody(centralStar,{id:"sol",kind:"star",massKg:1.989e30,densityKgM3:1408,material:"plasma"});
    if(asteroidBelt&&asteroidBelt.userData.krAsteroidMasses)for(const a of asteroidBelt.userData.krAsteroidMasses)registerPhysicalBody(asteroidBelt,{id:"asteroid-"+a.instanceId,kind:"asteroid",massKg:a.massKg,densityKgM3:a.densityKgM3,material:"rock",instanceId:a.instanceId,localPosition:a.localPosition});
    if(scene)scene.traverse(node=>{
      const p=node.userData&&node.userData.krPhysicsProfile;
      if(p)registerPhysicalBody(node,{...p,id:p.id||node.name||("entity-"+node.uuid)});
      else if(node.isGroup&&(node.userData.characterName||node.userData.krNpc||node.name.startsWith("KR_NPC_")||node.name.startsWith("KR_SOLAR_COMMONS_NPC_")||node.name.startsWith("KR_DINER_PATRON_")))registerPhysicalBody(node,{id:node.name||("npc-"+node.uuid),kind:"npc",massKg:78,densityKgM3:985,material:"living"});
      else if(node.name==="KR_HAVEN_UTILITY_ROVER")registerPhysicalBody(node,{id:"haven-rover",kind:"vehicle",massKg:3500,densityKgM3:1100,material:"aluminium-steel"});
      else if(node.name==="KR_WINGED_SPACE_SEMI")registerPhysicalBody(node,{id:"winged-space-semi",kind:"vehicle",massKg:26000,densityKgM3:1200,material:"steel-composite"});
    });
  }
  function createHavenOrbitalSystem(){
    if(!planetWorld||!moonOrbit||!station)return;
    havenOrbitRoot=new THREE.Group();havenOrbitRoot.name="KR_HAVEN_SOLAR_ORBIT";havenOrbitRoot.position.set(-500,180,-1350);scene.add(havenOrbitRoot);
    havenOrbitRoot.attach(planetWorld);havenOrbitRoot.attach(moonOrbit);
    lastStopOrbitRoot=new THREE.Group();lastStopOrbitRoot.name="KR_LAST_STOP_ORBIT";lastStopOrbitRoot.position.copy(planetWorld.position);havenOrbitRoot.add(lastStopOrbitRoot);lastStopOrbitRoot.attach(station);
    const radius=Math.hypot(planetWorld.position.x,planetWorld.position.z);
    havenOrbitLine=new THREE.Mesh(new THREE.TorusGeometry(radius,.28,4,256),new THREE.MeshBasicMaterial({color:0x7894a8,transparent:true,opacity:.16,depthWrite:false}));
    havenOrbitLine.rotation.x=Math.PI/2;havenOrbitLine.position.y=planetWorld.position.y;havenOrbitLine.name="KR_HAVEN_SOLAR_ORBIT_LINE";havenOrbitRoot.add(havenOrbitLine);
    const stopRadius=Math.hypot(station.position.x,station.position.z);
    lastStopOrbitLine=new THREE.Mesh(new THREE.TorusGeometry(stopRadius,.22,4,192),new THREE.MeshBasicMaterial({color:0x7894a8,transparent:true,opacity:.18,depthWrite:false}));
    lastStopOrbitLine.rotation.x=Math.PI/2;lastStopOrbitLine.position.y=station.position.y;lastStopOrbitLine.name="KR_LAST_STOP_ORBIT_LINE";lastStopOrbitRoot.add(lastStopOrbitLine);
  }
  function advanceAstronomy(delta){
    if(!havenOrbitRoot||!planetWorld)return;
    let carryRoot=null,localPosition=null,oldQuaternion=null;
    if(onFoot&&playerAvatar&&!playerInSpaceFlight){
      if(stationInteriorMode&&stationWalkRoot)carryRoot=stationWalkRoot;
      else if(activeSurfaceBody==="moon")carryRoot=moonWorld;
      else if(activeSurfaceBody==="haven")carryRoot=planetWorld;
    }
    if(carryRoot){carryRoot.updateWorldMatrix(true,false);localPosition=carryRoot.worldToLocal(playerAvatar.position.clone());oldQuaternion=carryRoot.getWorldQuaternion(new THREE.Quaternion());}
    havenOrbitRoot.rotation.y+=delta*(Math.PI*2/HAVEN_YEAR_SECONDS);
    planetWorld.rotation.y+=delta*(Math.PI*2/HAVEN_DAY_SECONDS);
    if(moonOrbit)moonOrbit.rotation.y+=delta*(Math.PI*2/LUNA_ORBIT_SECONDS);
    if(lastStopOrbitRoot)lastStopOrbitRoot.rotation.y+=delta*(Math.PI*2/LAST_STOP_ORBIT_SECONDS);
    if(solarHabitatOrbit)solarHabitatOrbit.rotation.y+=delta*.00042;
    if(solarHabitatRing)solarHabitatRing.rotation.y+=delta*.56;
    if(stationRing)stationRing.rotation.z+=delta*.11;
    if(asteroidBelt)asteroidBelt.rotation.y+=delta*.0018;
    if(havenSunLight&&centralStar&&planetWorld){
      havenSunLight.position.copy(centralStar.position);
      havenSunLight.target.position.copy(planetWorld.getWorldPosition(new THREE.Vector3()));
    }
    if(carryRoot&&localPosition){
      carryRoot.updateWorldMatrix(true,false);playerAvatar.position.copy(carryRoot.localToWorld(localPosition));
      const q=carryRoot.getWorldQuaternion(new THREE.Quaternion()).multiply(oldQuaternion.invert());
      playerUp.applyQuaternion(q).normalize();playerHeading.applyQuaternion(q).normalize();
      if(playerFlightForward)playerFlightForward.applyQuaternion(q).normalize();
      orientAvatar();
    }
  }

  const PLAYER_JUMP_SPEED = 4.2;
  const random = seededRandom(CONFIG.seed);

  // The avatar root is positioned just high enough that the lowest point
  // of the resting boot sole clears the sampled terrain by ~1.5 cm.
  // Boot sole bottom is approximately -0.115 units relative to the root.
  const AVATAR_SOLE_CLEARANCE = 0.13;

  // ============================================================
  // APPLICATION STATE
  // ============================================================

  let THREE = null;
  let scene = null;
  let camera = null;
  let renderer = null;

  // Modular asset state is deliberately independent of the current
  // procedural scene. No external model is requested unless registered.
  const modularModels = {
    registry: new Map(),
    instances: new Set(),
    loaderPromise: null
  };

  let ship = null;
  let shipVisualRoot = null;
  let shipProceduralVisual = null;
  let activeShipModel = null;
  let modelWorkshopPanel = null;
  let modelWorkshopButton = null;
  let modelWorkshopPreview = null;
  let modelWorkshopStatus = null;
  let modelWorkshopInputs = null;
  let station = null;
  let planet = null;
  let stationRing = null;
  let asteroidBelt = null;
  let moonOrbit = null;
  let planetWorld = null;
  let moonWorld = null;
  let moonLandingMarker = null;
  let havenLandingMarker = null;
  let lastStopLandingMarker = null;
  let activeLandingBody = "haven";
  let activeSurfaceBody = "haven";
  let landingMarker = null;
  let landingTarget = null;
  let approachLine = null;
  let approachLinePositions = null;
  let navLabel = null;
  let landingButton = null;
  let disembarkButton = null;
  let boardShipButton = null;
  let playerAvatar = null;
  let playerSeatedInShip = false;
  let havenBuggy = null, buggyMode = false, buggyInteractButton = null;
  let havenPortRoot=null,havenPortLandingMarker=null,havenShoreDockRoot=null,maritimeBoat=null,maritimeJetski=null,maritimeInteractButton=null;
  let maritimeOnBoat=false,maritimeDriving=false,maritimeDrivingType="boat",maritimeHeading=0;
  let buggySpeed = 0, buggyHeading = 0;
  let habitatGate = null, habitatGateButton = null, habitatGateOpen = false;
  let southSaloonRef=null,bartenderNpcRef=null,northObservatoryRef=null,ranchInteractButton=null,ranchPanel=null,ranchPassengerDancer=null;
  let moonRxRef=null,sanchosArmoryRef=null,moonRxButton=null,sanchosButton=null,shopPanel=null;
  let whizzDanceRef=null,whizzDanceButton=null,whizzDancePanel=null;
  const ranchGame={credits:150,inventory:[{name:"Trail Rations",quantity:2},{name:"Haven Trinket",quantity:1}],quests:[],dialogue:"Welcome to Lemmy's Ranch. Pull up a stool, stranger."};
  const ranchShop=[{name:"Ranch Soda",price:8},{name:"Space Jerky",price:12},{name:"Trail Rations",price:18},{name:"Haven Souvenir",price:25}];
  let faunaReleased = false, faunaReleaseTime = 0;
  const habitatGateLeaves = [];
  const avatarWalkParts = { arms: [], legs: [], torso: null };
  let avatarIsWalking = false;
  let georgeExplorer = null; // { root, mixer, clips, proceduralHidden: [] }
  let trashCanExplorer = null;
  let trashCanLoadPromise = null;
  let activeExplorerCharacter = "original";
  let lastGeorgeAnimTime = 0;
  const GEORGE_MODEL_URLS = [
    "https://cdn.jsdelivr.net/gh/duckwerks/voxel-planet@main/assets/George-2077.glb",
    "https://raw.githubusercontent.com/duckwerks/voxel-planet/main/assets/George-2077.glb"
  ];
  const explorerEquipment = {thrusting:false,gun:null,muzzle:null,proceduralGunParent:null,proceduralGunPosition:null,proceduralGunRotation:null,proceduralGunScale:null,targets:[],beams:[],shots:0,hits:0,oreMined:0};

  // ============================================================
  // v0.5.0 VOXEL WORLD — sparse chunks, block dig, greedy-ish mesh
  // Authoritative occupancy for mineable props (not full planet yet)
  // ============================================================
  const VOXEL_CHUNK = 16;
  const VOXEL_SCALE = 0.55; // metres per voxel edge
  let voxelWorld = null;

  function createVoxelWorld() {
    const chunks = new Map(); // "cx,cy,cz" -> { data: Uint8Array(size^3), mesh: THREE.Mesh|null, dirty: bool }
    const root = new THREE.Group();
    root.name = "KR_VOXEL_WORLD";
    const material = new THREE.MeshStandardMaterial({
      color: 0x8a7355, roughness: 0.85, metalness: 0.08, flatShading: true
    });
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x6e5a44, roughness: 0.9, metalness: 0.12, flatShading: true
    });
    const oreMat = new THREE.MeshStandardMaterial({
      color: 0xc4a35a, roughness: 0.55, metalness: 0.35, emissive: 0x332208, emissiveIntensity: 0.35, flatShading: true
    });

    function key(cx, cy, cz) { return cx + "," + cy + "," + cz; }
    function worldToVoxel(wx, wy, wz) {
      const vx = Math.floor(wx / VOXEL_SCALE);
      const vy = Math.floor(wy / VOXEL_SCALE);
      const vz = Math.floor(wz / VOXEL_SCALE);
      return { vx, vy, vz };
    }
    function chunkOf(vx, vy, vz) {
      const cx = Math.floor(vx / VOXEL_CHUNK);
      const cy = Math.floor(vy / VOXEL_CHUNK);
      const cz = Math.floor(vz / VOXEL_CHUNK);
      const lx = ((vx % VOXEL_CHUNK) + VOXEL_CHUNK) % VOXEL_CHUNK;
      const ly = ((vy % VOXEL_CHUNK) + VOXEL_CHUNK) % VOXEL_CHUNK;
      const lz = ((vz % VOXEL_CHUNK) + VOXEL_CHUNK) % VOXEL_CHUNK;
      return { cx, cy, cz, lx, ly, lz };
    }
    function ensureChunk(cx, cy, cz) {
      const k = key(cx, cy, cz);
      let c = chunks.get(k);
      if (!c) {
        c = { data: new Uint8Array(VOXEL_CHUNK * VOXEL_CHUNK * VOXEL_CHUNK), mesh: null, dirty: false, cx, cy, cz };
        chunks.set(k, c);
      }
      return c;
    }
    function idx(lx, ly, lz) { return lx + VOXEL_CHUNK * (ly + VOXEL_CHUNK * lz); }
    function get(vx, vy, vz) {
      const { cx, cy, cz, lx, ly, lz } = chunkOf(vx, vy, vz);
      const c = chunks.get(key(cx, cy, cz));
      if (!c) return 0;
      return c.data[idx(lx, ly, lz)] || 0;
    }
    function set(vx, vy, vz, mat) {
      const { cx, cy, cz, lx, ly, lz } = chunkOf(vx, vy, vz);
      const c = ensureChunk(cx, cy, cz);
      const i = idx(lx, ly, lz);
      if (c.data[i] === mat) return false;
      c.data[i] = mat;
      c.dirty = true;
      return true;
    }

    function rebuildChunkMesh(c) {
      if (c.mesh) {
        root.remove(c.mesh);
        c.mesh.geometry.dispose();
        c.mesh = null;
      }
      const positions = [];
      const normals = [];
      const colors = [];
      const baseX = c.cx * VOXEL_CHUNK;
      const baseY = c.cy * VOXEL_CHUNK;
      const baseZ = c.cz * VOXEL_CHUNK;
      const faces = [
        [0, 1, 0, 0, 1, 0], [0, -1, 0, 0, -1, 0],
        [1, 0, 0, 1, 0, 0], [-1, 0, 0, -1, 0, 0],
        [0, 0, 1, 0, 0, 1], [0, 0, -1, 0, 0, -1]
      ];
      // 4 corners per face in local voxel space (order for outward face)
      const faceVerts = [
        // +Y
        [[0,1,0],[0,1,1],[1,1,1],[1,1,0]],
        // -Y
        [[0,0,0],[1,0,0],[1,0,1],[0,0,1]],
        // +X
        [[1,0,0],[1,1,0],[1,1,1],[1,0,1]],
        // -X
        [[0,0,0],[0,0,1],[0,1,1],[0,1,0]],
        // +Z
        [[0,0,1],[1,0,1],[1,1,1],[0,1,1]],
        // -Z
        [[0,0,0],[0,1,0],[1,1,0],[1,0,0]]
      ];
      function solid(vx, vy, vz) { return get(vx, vy, vz) !== 0; }
      for (let lz = 0; lz < VOXEL_CHUNK; lz++) {
        for (let ly = 0; ly < VOXEL_CHUNK; ly++) {
          for (let lx = 0; lx < VOXEL_CHUNK; lx++) {
            const matId = c.data[idx(lx, ly, lz)];
            if (!matId) continue;
            const vx = baseX + lx, vy = baseY + ly, vz = baseZ + lz;
            let r = 0.55, g = 0.45, b = 0.32;
            if (matId === 2) { r = 0.78; g = 0.62; b = 0.28; }
            for (let f = 0; f < 6; f++) {
              const nx = faces[f][3], ny = faces[f][4], nz = faces[f][5];
              if (solid(vx + faces[f][0], vy + faces[f][1], vz + faces[f][2])) continue;
              const corners = faceVerts[f];
              const tri = [0, 1, 2, 0, 2, 3];
              for (const t of tri) {
                const p = corners[t];
                positions.push(
                  (vx + p[0]) * VOXEL_SCALE,
                  (vy + p[1]) * VOXEL_SCALE,
                  (vz + p[2]) * VOXEL_SCALE
                );
                normals.push(nx, ny, nz);
                colors.push(r, g, b);
              }
            }
          }
        }
      }
      if (!positions.length) { c.dirty = false; return; }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
      geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        vertexColors: true, roughness: 0.88, metalness: 0.1, flatShading: true
      }));
      mesh.name = "KR_VOXEL_CHUNK_" + key(c.cx, c.cy, c.cz);
      mesh.userData.krVoxelChunk = true;
      root.add(mesh);
      c.mesh = mesh;
      c.dirty = false;
    }

    function flushDirty() {
      for (const c of chunks.values()) {
        if (c.dirty) rebuildChunkMesh(c);
      }
    }

    function fillSphere(centerWorld, radiusM, matId) {
      const rV = Math.ceil(radiusM / VOXEL_SCALE);
      const c = worldToVoxel(centerWorld.x, centerWorld.y, centerWorld.z);
      const r2 = rV * rV;
      for (let dz = -rV; dz <= rV; dz++) {
        for (let dy = -rV; dy <= rV; dy++) {
          for (let dx = -rV; dx <= rV; dx++) {
            if (dx * dx + dy * dy + dz * dz > r2) continue;
            const ore = (dx * dx + dy * dy + dz * dz) < (rV * 0.35) * (rV * 0.35) ? 2 : matId;
            set(c.vx + dx, c.vy + dy, c.vz + dz, ore);
          }
        }
      }
      flushDirty();
    }

    // DDA ray against solid voxels. origin/dir world space.
    function raycast(origin, direction, maxDist) {
      const dir = direction.clone().normalize();
      const maxD = maxDist || 48;
      const step = VOXEL_SCALE * 0.45;
      let dist = 0;
      let lastAir = null;
      while (dist <= maxD) {
        const p = origin.clone().addScaledVector(dir, dist);
        const v = worldToVoxel(p.x, p.y, p.z);
        const m = get(v.vx, v.vy, v.vz);
        if (m) {
          return {
            hit: true,
            voxel: v,
            material: m,
            point: lastAir || p,
            distance: dist
          };
        }
        lastAir = p;
        dist += step;
      }
      return { hit: false };
    }

    function digAt(vx, vy, vz, radius) {
      let removed = 0;
      const r = radius || 1;
      for (let dz = -r; dz <= r; dz++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy + dz * dz > r * r + 0.1) continue;
            const m = get(vx + dx, vy + dy, vz + dz);
            if (m) {
              set(vx + dx, vy + dy, vz + dz, 0);
              removed++;
              if (m === 2) explorerEquipment.oreMined++;
            }
          }
        }
      }
      if (removed) flushDirty();
      return removed;
    }

    return {
      root, chunks, get, set, fillSphere, raycast, digAt, flushDirty, worldToVoxel,
      get stats() {
        let solid = 0;
        for (const c of chunks.values()) {
          for (let i = 0; i < c.data.length; i++) if (c.data[i]) solid++;
        }
        return { chunks: chunks.size, solidVoxels: solid, oreMined: explorerEquipment.oreMined };
      }
    };
  }

  function ensureVoxelWorld() {
    if (!THREE || !scene) return null;
    if (!voxelWorld) {
      voxelWorld = createVoxelWorld();
      scene.add(voxelWorld.root);
    }
    return voxelWorld;
  }

  let mineAsteroidMarker = null;
  let mineAsteroidAnchor = null; // THREE.Vector3 world pos of current mine

  function clearVoxelWorldContents() {
    if (!voxelWorld) return;
    for (const c of voxelWorld.chunks.values()) {
      if (c.mesh) {
        voxelWorld.root.remove(c.mesh);
        if (c.mesh.geometry) c.mesh.geometry.dispose();
        c.mesh = null;
      }
    }
    voxelWorld.chunks.clear();
  }


  let lunaMineRoot = null;

  function installLunaMineField() {
    if (!THREE || !moonWorld || !moonLandingMarker) return null;
    if (lunaMineRoot && lunaMineRoot.parent) {
      lunaMineRoot.parent.remove(lunaMineRoot);
      lunaMineRoot.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach(m => m.dispose && m.dispose());
        }
      });
      lunaMineRoot = null;
    }
    const root = new THREE.Group();
    root.name = "KR_LUNA_MINE_FIELD";
    // Local offset from moon landing marker: walk forward off the pad
    root.position.set(14, 0.2, 10);
    root.userData.mineField = true;

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x8a7a62, roughness: 0.95, metalness: 0.08, flatShading: true
    });
    const oreMat = new THREE.MeshStandardMaterial({
      color: 0xd4b24a, roughness: 0.55, metalness: 0.4,
      emissive: 0x553308, emissiveIntensity: 0.45, flatShading: true
    });

    // Big obvious boulder cluster
    const rocks = [];
    const specs = [
      [0, 1.6, 0, 3.4, false],
      [3.2, 1.1, 1.5, 2.2, false],
      [-2.8, 1.0, 2.0, 2.0, false],
      [1.5, 2.4, -1.2, 1.8, true],
      [-1.2, 2.2, -2.0, 1.6, true],
      [4.5, 0.9, -1.5, 1.5, false],
      [-4.0, 0.85, 0.5, 1.4, true],
      [0.5, 0.7, 3.5, 1.3, false]
    ];
    for (let i = 0; i < specs.length; i++) {
      const [x, y, z, r, ore] = specs[i];
      const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(r, 1),
        (ore ? oreMat : rockMat).clone()
      );
      mesh.position.set(x, y, z);
      mesh.rotation.set(x * 0.3, y * 0.7, z * 0.2);
      mesh.userData.mineRock = true;
      mesh.userData.ore = !!ore;
      mesh.userData.hp = ore ? 4 : 3;
      mesh.userData.maxHp = mesh.userData.hp;
      mesh.name = "KR_LUNA_MINE_ROCK_" + i;
      root.add(mesh);
      rocks.push(mesh);
    }

    // Tall sign / beacon in local frame
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 9, 8),
      new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xaa6600, emissiveIntensity: 0.9 })
    );
    pole.position.set(-6, 4.5, 0);
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 1.6, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xff3311, emissive: 0x770000, emissiveIntensity: 0.65 })
    );
    board.position.set(-3.2, 8.5, 0);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffee66 })
    );
    bulb.position.set(-6, 9.2, 0);
    const light = new THREE.PointLight(0xffaa44, 3.0, 55);
    light.position.set(-6, 9.2, 0);
    // Canvas label
    const cv = document.createElement("canvas");
    cv.width = 512; cv.height = 128;
    const cx = cv.getContext("2d");
    cx.fillStyle = "#4a1208";
    cx.fillRect(0, 0, 512, 128);
    cx.fillStyle = "#ffe566";
    cx.font = "bold 48px monospace";
    cx.textAlign = "center";
    cx.fillText("LUNA MINE", 256, 55);
    cx.font = "bold 28px monospace";
    cx.fillText("SHOOT ROCKS  //  ORE = GOLD", 256, 100);
    const tex = new THREE.CanvasTexture(cv);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 1.4),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    sign.position.set(-3.2, 8.5, 0.12);
    root.add(pole, board, bulb, light, sign);

    moonLandingMarker.add(root);
    lunaMineRoot = root;
    root.userData.rocks = rocks;
    return root;
  }

  function spawnPadMineAsteroid(force) {
    if (!THREE || !scene || !playerAvatar || !playerUp) return;
    const vw = ensureVoxelWorld();
    if (!vw) return;

    // Avoid stacking infinite rocks unless forced or previous site is gone/far
    if (!force && mineAsteroidAnchor && playerAvatar.position.distanceTo(mineAsteroidAnchor) < 90) {
      const stats = vw.stats;
      if (stats && stats.solidVoxels > 20) return;
    }

    clearVoxelWorldContents();

    const right = playerHeading.clone().cross(playerUp).normalize();
    // Prefer a spot on the local surface ahead-right of the player
    let anchor = playerAvatar.position.clone()
      .addScaledVector(playerHeading, 12)
      .addScaledVector(right, 5)
      .addScaledVector(playerUp, 0.5);
    try {
      if (typeof sampleSurface === "function") {
        const surface = sampleSurface(anchor);
        if (surface && surface.position) {
          anchor = surface.position.clone().addScaledVector(surface.up || playerUp, 2.6);
        }
      }
    } catch (_) {}

    // Solid diggable rock (larger, more ore in the core)
    vw.fillSphere(anchor, 5.2, 1);
    mineAsteroidAnchor = anchor.clone();

    // Bright beacon so the site is obvious from the pad
    if (mineAsteroidMarker && mineAsteroidMarker.parent) {
      mineAsteroidMarker.parent.remove(mineAsteroidMarker);
      mineAsteroidMarker.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach(m => m.dispose && m.dispose());
        }
      });
    }
    const marker = new THREE.Group();
    marker.name = "KR_MINE_ASTEROID_MARKER";
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.14, 7.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xaa6600, emissiveIntensity: 0.85 })
    );
    pole.position.y = 3.75;
    const flag = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.3, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xff4422, emissive: 0x881100, emissiveIntensity: 0.7 })
    );
    flag.position.set(1.6, 7.0, 0);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffee66 })
    );
    bulb.position.y = 7.6;
    const light = new THREE.PointLight(0xffaa44, 2.2, 40);
    light.position.y = 7.6;
    marker.add(pole, flag, bulb, light);
    marker.position.copy(anchor);
    marker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), (playerUp || new THREE.Vector3(0,1,0)).clone().normalize());
    // Same space as voxel meshes (scene / world) so rock + beacon stay together
    marker.position.copy(anchor);
    scene.add(marker);
    mineAsteroidMarker = marker;

    setStatus("MINE SITE // ORANGE BEACON AHEAD-RIGHT // SHOOT ROCK WITH 🔫");
  }

  function sellMinedOre() {
    const ore = explorerEquipment.oreMined | 0;
    if (ore <= 0) {
      setStatus("NO ORE TO SELL // MINE THE ROCK FIRST");
      return { ok: false, sold: 0 };
    }
    const priceEach = 3;
    const credits = ore * priceEach;
    ranchGame.credits += credits;
    explorerEquipment.oreMined = 0;
    if (ranchGame.dialogue !== undefined) {
      ranchGame.dialogue = "Fine rock. Here's " + credits + " credits for " + ore + " ore.";
    }
    setStatus("SOLD " + ore + " ORE // +" + credits + " CREDITS // BALANCE " + ranchGame.credits);
    updateEquipmentHUD();
    return { ok: true, sold: ore, credits };
  }

  let playerInSpaceFlight = false;
  let playerFlightVelocity = null;
  // Keeps initial ascent radial even if camera-look input changes pitch.
  let jetpackLaunchAssist = 0;
  let boostButton=null,fireButton=null,digButton=null,equipmentReadout=null,aimReticle=null;
  const buggyWheels = [];
  const PLAYER_COLLISION_RADIUS = PLAYER_CAPSULE.radius;
  const BUGGY_COLLISION_RADIUS = 2.65;

  // Walk freely over the sampled heightfield. Elevation differences are not
  // obstacles: a two-metre explorer must not be stopped by arbitrary 45 cm
  // steps or by steep-but-traversable 45-80 degree terrain. Only a virtually
  // vertical face (89.5 degrees or steeper) is treated as an impassable wall.
  function resolveSurfaceStep(fromPosition,desiredPosition){
    const start=sampleSurface(fromPosition);
    const movement=desiredPosition.clone().sub(fromPosition);
    const distance=movement.length();
    if(distance<1e-6)return start;
    const steps=Math.max(1,Math.ceil(distance/PLAYER_CAPSULE.maxSubstepDistance));
    let accepted=start;
    for(let i=1;i<=steps;i++){
      const candidate=sampleSurface(fromPosition.clone().addScaledVector(movement,i/steps));
      if(candidate.slopeDegrees>=PLAYER_CAPSULE.verticalWallThresholdDegrees)break;
      accepted=candidate;
    }
    return accepted;
  }
  const solidColliders = [];
  const walkableSurfaces = [];
  let walkSurfaceRaycaster = null;
  let walkSurfaceNormalMatrix = null;
  const WALK_SURFACE_MAX_SLOPE_DEGREES = 62;
  // Maximum vertical drop accepted during one grounded-walk support sample.
  // Larger drops become falling transitions; gradual walkable ramps remain valid.
  const MAX_GROUNDED_STEP_DOWN = 0.55;

  // SOLID-WORLD COLLISION // shared two-metre explorer capsule.
  // v0.3.82b: oriented-box (OBB) collision. Every collider keeps a cached
  // box in its OWN local frame; the player's capsule is transformed into
  // that frame for the test. Buildings tilted to follow the planet's
  // curvature therefore collide with their true shape (the old world-axis
  // AABB inflated them into invisible walls), the per-call Box3 rebuild is
  // gone, and the contact face normal lets us slide along walls.
  let solidFrame = 0;
  let solidCache = new WeakMap();
  let solidScratchData = null;
  // The spatial hash is rebuilt at most once per frame, on the first
  // character-collision query. Static and moving colliders share one index.
  const SOLID_SPATIAL_CELL_SIZE = 24;
  const SOLID_SPATIAL_MAX_CELLS_PER_COLLIDER = 512;
  let solidSpatialFrame = -1;
  let solidSpatialBuckets = new Map();
  let solidSpatialOversized = [];
  let solidSpatialCandidates = [];
  let solidSpatialSeen = new Set();
  // Per-frame counters make broadphase behavior observable during in-browser
  // acceptance runs without changing collision decisions or player movement.
  const solidCollisionStats = {
    queries:0,candidateReferences:0,broadPhaseSurvivors:0,
    narrowPhaseTests:0,indexBuilds:0,indexedColliders:0,
    occupiedCells:0,oversizedColliders:0,
    movementCalls:0,requestedDistance:0,acceptedDistance:0,
    sweepPasses:0,sweepSteps:0,maxSweepSteps:0,
    blockedContacts:0,slideProjections:0,overlapEscapeStarts:0,
    stepUpAttempts:0,stepUpSuccesses:0
  };
  function resetSolidCollisionStats(){
    solidCollisionStats.queries=0;
    solidCollisionStats.candidateReferences=0;
    solidCollisionStats.broadPhaseSurvivors=0;
    solidCollisionStats.narrowPhaseTests=0;
    solidCollisionStats.indexBuilds=0;
    solidCollisionStats.indexedColliders=0;
    solidCollisionStats.occupiedCells=0;
    solidCollisionStats.oversizedColliders=0;
    solidCollisionStats.movementCalls=0;
    solidCollisionStats.requestedDistance=0;
    solidCollisionStats.acceptedDistance=0;
    solidCollisionStats.sweepPasses=0;
    solidCollisionStats.sweepSteps=0;
    solidCollisionStats.maxSweepSteps=0;
    solidCollisionStats.blockedContacts=0;
    solidCollisionStats.slideProjections=0;
    solidCollisionStats.overlapEscapeStarts=0;
    solidCollisionStats.stepUpAttempts=0;
    solidCollisionStats.stepUpSuccesses=0;
  }
  // Support sampling has its own counters because a successful obstacle
  // broadphase does not prove that floors, decks, roofs and ramps are found.
  const supportSampleStats = {
    samples:0,raycasts:0,raycastHits:0,invalidHits:0,
    slopeRejected:0,rangeRejected:0,structuralSelections:0,
    terrainFallbacks:0,misses:0
  };
  function resetSupportSampleStats(){
    supportSampleStats.samples=0;
    supportSampleStats.raycasts=0;
    supportSampleStats.raycastHits=0;
    supportSampleStats.invalidHits=0;
    supportSampleStats.slopeRejected=0;
    supportSampleStats.rangeRejected=0;
    supportSampleStats.structuralSelections=0;
    supportSampleStats.terrainFallbacks=0;
    supportSampleStats.misses=0;
  }
  const SOLID_SKIN = PLAYER_CAPSULE.radius + PLAYER_CAPSULE.groundSkin;

  function rebuildSolidColliderCache(){
    solidColliders.length=0;
    walkableSurfaces.length=0;
    solidCache=new WeakMap();
    solidSpatialFrame=-1;
    solidSpatialBuckets.clear();
    solidSpatialOversized.length=0;
    if(!scene)return;
    const colliderParts = new Set();
    scene.traverse(node=>{
      if(!node.userData)return;
      if(node.userData.krSolidCollider)colliderParts.add(node);
      if(node.userData.krSolidRoot){
        node.traverse(part=>{
          if(part.isMesh&&part.geometry)colliderParts.add(part);
        });
      }
      if(node.userData.krWalkableSurface)walkableSurfaces.push(node);
    });
    solidColliders.push(...colliderParts);
    // ONE WORLD bridge: collision geometry is still handled by the mature
    // solid broad/narrow-phase pipeline, but every collider now has a shared
    // entity identity and can be discovered through World queries.
    for(const object of solidColliders){
      const existingId=worldObjectIds.get(object);
      const id=existingId||((object.userData&&object.userData.krWorldId)||("collider:"+(object.uuid||object.name)));
      registerWorldEntity(object,{id,tags:["collision","solid"],persistence:"session"});
      object.userData=object.userData||{};
      object.userData.krWorldId=id;
    }
    // Walkable surfaces share that same identity whenever they are also
    // colliders; support-only meshes receive their own stable World identity.
    for(const surface of walkableSurfaces){
      const existingId=worldObjectIds.get(surface);
      const supportLabel=String(surface.userData.krWalkableSurface||surface.name||surface.uuid);
      const id=existingId||surface.userData.krWorldId||("support:"+supportLabel);
      registerWorldEntity(surface,{id,tags:["support","walkable"],persistence:"session"});
      surface.userData=surface.userData||{};
      surface.userData.krWorldId=id;
    }
  }
  function solidScratch(){
    if(!solidScratchData)solidScratchData={a:new THREE.Vector3(),b:new THREE.Vector3(),m:new THREE.Vector3(),start:new THREE.Vector3(),end:new THREE.Vector3(),range:[0,1],corner:new THREE.Vector3(),mat:new THREE.Matrix4(),inv:new THREE.Matrix4()};
    return solidScratchData;
  }
  // The collider's bounds expressed in its own local frame.
  function buildSolidRecord(object,previous){
    const s=solidScratch(),box=new THREE.Box3();
    object.updateWorldMatrix(true,true);
    s.inv.copy(object.matrixWorld).invert();
    object.traverse(node=>{
      if(!node.isMesh||!node.geometry)return;
      let bb=null;
      if(node.isInstancedMesh){if(node.boundingBox===null||node.boundingBox===undefined)node.computeBoundingBox();bb=node.boundingBox;}
      else{if(!node.geometry.boundingBox)node.geometry.computeBoundingBox();bb=node.geometry.boundingBox;}
      if(!bb||bb.isEmpty())return;
      s.mat.multiplyMatrices(s.inv,node.matrixWorld);
      for(let i=0;i<8;i++){
        s.corner.set(i&1?bb.max.x:bb.min.x,i&2?bb.max.y:bb.min.y,i&4?bb.max.z:bb.min.z).applyMatrix4(s.mat);
        box.expandByPoint(s.corner);
      }
    });
    const rec=previous||{inv:new THREE.Matrix4(),nm:new THREE.Matrix3(),center:new THREE.Vector3(),radius:0,spatialCenter:new THREE.Vector3(),spatialRadius:0,worldBoundsMin:new THREE.Vector3(),worldBoundsMax:new THREE.Vector3(),worldCorner:new THREE.Vector3(),sx:1,sy:1,sz:1,frame:-1,worldFrame:-1,object};
    if(!rec.worldBoundsMin)rec.worldBoundsMin=new THREE.Vector3();
    if(!rec.worldBoundsMax)rec.worldBoundsMax=new THREE.Vector3();
    if(!rec.worldCorner)rec.worldCorner=new THREE.Vector3();
    rec.box=box.isEmpty()?null:box;
    rec.stamp=performance.now();
    rec.frame=-1;
    if(rec.box){
      rec.localCenter=rec.box.getCenter(new THREE.Vector3());
      rec.localRadius=rec.box.getSize(new THREE.Vector3()).length()*0.5;
    }
    return rec;
  }
  function solidRecord(object){
    let rec=solidCache.get(object);
    // Groups (shops, rover) may animate internally, so refresh their bounds occasionally.
    if(!rec||(object.userData.krSolidRoot&&performance.now()-rec.stamp>1500)){rec=buildSolidRecord(object,rec);solidCache.set(object,rec);}
    return rec.box?rec:null;
  }
  // Cheap broad phase (uses last frame's matrix), then an exact refresh.
  function solidRecordNear(object,position,reach){
    const rec=solidRecord(object);
    if(!rec)return null;
    // Refresh the collider's world transform before broad-phase rejection.
    // Otherwise a parented/moving collider can be tested against its previous
    // frame's centre and incorrectly culled before its current transform is read.
    if(rec.worldFrame!==solidFrame){
      object.updateWorldMatrix(true,false);
      rec.worldFrame=solidFrame;
    }
    // The spatial index stores a world-space AABB formed from all eight
    // transformed local-bound corners. Point-to-AABB distance is conservative
    // even when parent transforms introduce shear through nested rotations/scales.
    const mn=rec.worldBoundsMin,mx=rec.worldBoundsMax;
    const dx=Math.max(mn.x-position.x,0,position.x-mx.x);
    const dy=Math.max(mn.y-position.y,0,position.y-mx.y);
    const dz=Math.max(mn.z-position.z,0,position.z-mx.z);
    const lim=reach+2;
    if(dx*dx+dy*dy+dz*dz>lim*lim)return null;
    let node=object;
    while(node){if(!node.visible)return null;node=node.parent;}
    if(rec.frame!==solidFrame){
      rec.inv.copy(object.matrixWorld).invert();
      rec.nm.getNormalMatrix(object.matrixWorld);
      const m=object.matrixWorld.elements;
      rec.sx=Math.max(1e-6,Math.hypot(m[0],m[1],m[2]));rec.sy=Math.max(1e-6,Math.hypot(m[4],m[5],m[6]));rec.sz=Math.max(1e-6,Math.hypot(m[8],m[9],m[10]));
      rec.frame=solidFrame;
    }
    return rec;
  }
  function solidSpatialCellKey(x,y,z){return x+","+y+","+z;}
  function ensureSolidSpatialIndex(){
    if(solidSpatialFrame===solidFrame)return;
    solidSpatialBuckets.clear();
    solidSpatialOversized.length=0;
    const cellSize=SOLID_SPATIAL_CELL_SIZE;
    for(let i=0;i<solidColliders.length;i++){
      const object=solidColliders[i],rec=solidRecord(object);
      if(!rec)continue;
      if(rec.worldFrame!==solidFrame){
        object.updateWorldMatrix(true,false);
        rec.worldFrame=solidFrame;
      }
      // Transform the local collider bounds into a conservative world AABB.
      // Unlike max-column-length sphere scaling, this remains safe under
      // nested rotations combined with non-uniform parent scales.
      const e=object.matrixWorld,box=rec.box,mn=rec.worldBoundsMin,mx=rec.worldBoundsMax,corner=rec.worldCorner;
      mn.set(Infinity,Infinity,Infinity);
      mx.set(-Infinity,-Infinity,-Infinity);
      for(let c=0;c<8;c++){
        corner.set(c&1?box.max.x:box.min.x,c&2?box.max.y:box.min.y,c&4?box.max.z:box.min.z).applyMatrix4(e);
        mn.min(corner);mx.max(corner);
      }
      const minX=Math.floor(mn.x/cellSize),maxX=Math.floor(mx.x/cellSize);
      const minY=Math.floor(mn.y/cellSize),maxY=Math.floor(mx.y/cellSize);
      const minZ=Math.floor(mn.z/cellSize),maxZ=Math.floor(mx.z/cellSize);
      const cellCount=(maxX-minX+1)*(maxY-minY+1)*(maxZ-minZ+1);
      if(!Number.isFinite(cellCount)||cellCount>SOLID_SPATIAL_MAX_CELLS_PER_COLLIDER){
        solidSpatialOversized.push(object);
        continue;
      }
      for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++)for(let z=minZ;z<=maxZ;z++){
        const key=solidSpatialCellKey(x,y,z);
        let bucket=solidSpatialBuckets.get(key);
        if(!bucket){bucket=[];solidSpatialBuckets.set(key,bucket);}
        bucket.push(object);
      }
    }
    solidSpatialFrame=solidFrame;
    solidCollisionStats.indexBuilds++;
    solidCollisionStats.indexedColliders=solidColliders.length;
    solidCollisionStats.occupiedCells=solidSpatialBuckets.size;
    solidCollisionStats.oversizedColliders=solidSpatialOversized.length;
  }
  function nearbySolidColliders(position,reach){
    ensureSolidSpatialIndex();
    const size=SOLID_SPATIAL_CELL_SIZE;
    const minX=Math.floor((position.x-reach)/size),maxX=Math.floor((position.x+reach)/size);
    const minY=Math.floor((position.y-reach)/size),maxY=Math.floor((position.y+reach)/size);
    const minZ=Math.floor((position.z-reach)/size),maxZ=Math.floor((position.z+reach)/size);
    const found=solidSpatialCandidates;
    found.length=0;
    solidSpatialSeen.clear();
    for(let i=0;i<solidSpatialOversized.length;i++){
      const object=solidSpatialOversized[i];
      if(!solidSpatialSeen.has(object)){solidSpatialSeen.add(object);found.push(object);}
    }
    for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++)for(let z=minZ;z<=maxZ;z++){
      const bucket=solidSpatialBuckets.get(solidSpatialCellKey(x,y,z));
      if(!bucket)continue;
      for(let i=0;i<bucket.length;i++){
        const object=bucket[i];
        if(!solidSpatialSeen.has(object)){solidSpatialSeen.add(object);found.push(object);}
      }
    }
    solidCollisionStats.candidateReferences+=found.length;
    return found;
  }
  function slabClip(o,d,mn,mx,range){
    if(Math.abs(d)<1e-9)return o>=mn&&o<=mx;
    let ta=(mn-o)/d,tb=(mx-o)/d;
    if(ta>tb){const t=ta;ta=tb;tb=t;}
    if(ta>range[0])range[0]=ta;
    if(tb<range[1])range[1]=tb;
    return range[0]<=range[1];
  }
  // Returns null when the capsule is clear, otherwise the world-space normal
  // of the face being pressed into (pointing out of the solid).
  function solidHitAt(position,up,moveDir,skinOverride,profile){
    profile=profile||{};
    const radius=Math.max(0.05,Number(profile.radius)||PLAYER_CAPSULE.radius);
    const height=Math.max(radius*2,Number(profile.height)||PLAYER_CAPSULE.height);
    const s=solidScratch(),skin=skinOverride===undefined?(profile.skin===undefined?radius+PLAYER_CAPSULE.groundSkin:Math.max(0,Number(profile.skin)||0)):skinOverride,reach=height+Math.max(0,skin);
    s.start.copy(position).addScaledVector(up,radius);s.end.copy(position).addScaledVector(up,Math.max(radius,height-radius));
    const excluded=Array.isArray(profile.exclude)?profile.exclude:(profile.exclude?[profile.exclude]:[]);
    const isExcluded=object=>{for(const root of excluded){if(!root)continue;let node=object;while(node){if(node===root)return true;node=node.parent;}}return false;};
    let bestNormal=null,bestDepth=Infinity,bestAgainst=-Infinity;solidCollisionStats.queries++;
    const candidates=nearbySolidColliders(position,reach+2);
    for(let i=0;i<candidates.length;i++){
      if(isExcluded(candidates[i]))continue;
      const rec=solidRecordNear(candidates[i],position,reach);if(!rec)continue;
      solidCollisionStats.broadPhaseSurvivors++;solidCollisionStats.narrowPhaseTests++;
      const A=s.a.copy(s.start).applyMatrix4(rec.inv),B=s.b.copy(s.end).applyMatrix4(rec.inv);
      const ex=skin/rec.sx,ey=skin/rec.sy,ez=skin/rec.sz;
      const mnx=rec.box.min.x-ex,mny=rec.box.min.y-ey,mnz=rec.box.min.z-ez,mxx=rec.box.max.x+ex,mxy=rec.box.max.y+ey,mxz=rec.box.max.z+ez;
      s.range[0]=0;s.range[1]=1;
      if(!slabClip(A.x,B.x-A.x,mnx,mxx,s.range)||!slabClip(A.y,B.y-A.y,mny,mxy,s.range)||!slabClip(A.z,B.z-A.z,mnz,mxz,s.range))continue;
      const cx=(mnx+mxx)*0.5,cy=(mny+mxy)*0.5,cz=(mnz+mxz)*0.5,abx=B.x-A.x,aby=B.y-A.y,abz=B.z-A.z,len2=abx*abx+aby*aby+abz*abz;
      let t=len2>1e-12?((cx-A.x)*abx+(cy-A.y)*aby+(cz-A.z)*abz)/len2:0;t=Math.max(0,Math.min(1,t));
      const qx=A.x+abx*t,qy=A.y+aby*t,qz=A.z+abz*t;
      const faces=[[mxx-qx,1,0,0],[qx-mnx,-1,0,0],[mxy-qy,0,1,0],[qy-mny,0,-1,0],[mxz-qz,0,0,1],[qz-mxz,0,0,-1]];
      let face=faces[0];for(let k=1;k<6;k++)if(Math.abs(faces[k][0])<Math.abs(face[0]))face=faces[k];
      const depth=Math.abs(face[0]),normal=s.m.set(face[1],face[2],face[3]).applyNormalMatrix(rec.nm).normalize(),against=moveDir&&moveDir.isVector3?-moveDir.dot(normal):0;
      if(depth<bestDepth-1e-5||(Math.abs(depth-bestDepth)<=1e-5&&against>bestAgainst)){if(!bestNormal)bestNormal=new THREE.Vector3();bestNormal.copy(normal);bestDepth=depth;bestAgainst=against;}
    }
    return bestNormal;
  }
  function solidOverlapAt(position,up){return !!solidHitAt(position,up,null);}

  function resolveSolidMovement(fromPosition,toPosition,up,profile){
    profile=profile||{};const accepted=fromPosition.clone(),target=toPosition.clone(),distance=target.distanceTo(accepted);
    solidCollisionStats.movementCalls++;solidCollisionStats.requestedDistance+=distance;if(distance<1e-6)return target;
    if(solidHitAt(accepted,up,null,-0.25,profile)){solidCollisionStats.overlapEscapeStarts++;solidCollisionStats.acceptedDistance+=distance;return target;}
    const maxStep=Math.max(0.08,Number(profile.maxSubstepDistance)||PLAYER_CAPSULE.maxSubstepDistance*0.75),blocking=(normal,vec)=>normal&&vec.dot(normal)<-0.005*vec.length();
    for(let pass=0;pass<3;pass++){
      const remaining=target.clone().sub(accepted),length=remaining.length();if(length<1e-5)break;
      const steps=Math.max(1,Math.min(512,Math.ceil(length/maxStep)));solidCollisionStats.sweepPasses++;solidCollisionStats.sweepSteps+=steps;solidCollisionStats.maxSweepSteps=Math.max(solidCollisionStats.maxSweepSteps,steps);
      const step=remaining.clone().divideScalar(steps);let collided=false;
      for(let i=0;i<steps;i++){
        const candidate=accepted.clone().add(step),normal=solidHitAt(candidate,up,step,undefined,profile);
        if(!blocking(normal,step)){accepted.copy(candidate);continue;}
        solidCollisionStats.blockedContacts++;let low=0,high=1,contactNormal=normal.clone();
        for(let refine=0;refine<12;refine++){const mid=(low+high)*0.5,probe=accepted.clone().addScaledVector(step,mid),hit=solidHitAt(probe,up,step,undefined,profile);if(blocking(hit,step)){high=mid;contactNormal.copy(hit);}else low=mid;}
        accepted.addScaledVector(step,Math.max(0,low-0.002));const residual=target.clone().sub(accepted),into=residual.dot(contactNormal);
        if(into<0){residual.addScaledVector(contactNormal,-into);solidCollisionStats.slideProjections++;}
        target.copy(accepted).add(residual);collided=true;break;
      }
      if(!collided)break;
    }
    solidCollisionStats.acceptedDistance+=fromPosition.distanceTo(accepted);return accepted;
  }
  // Capture a support object's world transform once an actor becomes grounded.
  // The returned frame is deliberately plain data plus a Matrix4 so external
  // controllers can retain it between simulation ticks.
  function captureSupportFrame(supportObject){
    if(!THREE||!supportObject||!supportObject.isObject3D)throw new TypeError("captureSupportFrame requires a Three.js support Object3D.");
    supportObject.updateWorldMatrix(true,false);
    return {object:supportObject,worldMatrix:supportObject.matrixWorld.clone(),valid:true};
  }
  // Apply the support's world-space transform delta to any actor Object3D.
  // Actor local transforms are reconstructed relative to their current parent,
  // so this also works for actors nested in vehicles or scene groups.
  function carryActorWithSupport(actorObject,frame,orientation={}){
    if(!THREE||!actorObject||!actorObject.isObject3D||!frame||!frame.object||!frame.worldMatrix||!frame.worldMatrix.isMatrix4)
      throw new TypeError("carryActorWithSupport requires an actor Object3D and a captured support frame.");
    const support=frame.object;
    if(!support.parent||support.visible===false){frame.valid=false;return {carried:false,reason:"support-unavailable"};}
    support.updateWorldMatrix(true,false);
    actorObject.updateWorldMatrix(true,false);
    const previousMatrix=frame.worldMatrix.clone(),currentMatrix=support.matrixWorld.clone();
    const deltaMatrix=currentMatrix.clone().multiply(previousMatrix.clone().invert());
    const actorWorld=deltaMatrix.multiply(actorObject.matrixWorld.clone());
    if(actorObject.parent){
      actorObject.parent.updateWorldMatrix(true,false);
      actorWorld.premultiply(actorObject.parent.matrixWorld.clone().invert());
    }
    actorWorld.decompose(actorObject.position,actorObject.quaternion,actorObject.scale);
    actorObject.updateMatrix();actorObject.updateWorldMatrix(false,true);
    const previousQ=new THREE.Quaternion(),currentQ=new THREE.Quaternion(),tmpScale=new THREE.Vector3(),tmpPosition=new THREE.Vector3();
    previousMatrix.decompose(tmpPosition,previousQ,tmpScale);
    currentMatrix.decompose(tmpPosition,currentQ,tmpScale);
    const rotationDelta=currentQ.multiply(previousQ.invert());
    const up=orientation.up&&orientation.up.isVector3?orientation.up.clone().applyQuaternion(rotationDelta).normalize():null;
    const forward=orientation.forward&&orientation.forward.isVector3?orientation.forward.clone().applyQuaternion(rotationDelta).normalize():null;
    frame.worldMatrix.copy(currentMatrix);frame.valid=true;
    return {carried:true,position:actorObject.getWorldPosition(new THREE.Vector3()).toArray(),
      quaternion:actorObject.getWorldQuaternion(new THREE.Quaternion()).toArray(),
      up:up?up.toArray():null,forward:forward?forward.toArray():null,rotationDelta:rotationDelta.toArray()};
  }
  function refreshSupportFrame(frame){
    if(!frame||!frame.object||!frame.worldMatrix||!frame.worldMatrix.isMatrix4)return false;
    if(!frame.object.parent||frame.object.visible===false){frame.valid=false;return false;}
    frame.object.updateWorldMatrix(true,false);frame.worldMatrix.copy(frame.object.matrixWorld);frame.valid=true;return true;
  }

  // Shared world-space movement entry point for built-in and external actors.
  // Profiles describe bottom-anchored capsules; own collider hierarchies can
  // be excluded while solid sweeps, gravity and spherical boundaries stay common.
  function resolvePhysicalActorStep(options={}){
    if(!THREE)throw new Error("Three.js physics services are not ready.");
    const from=worldVector(options.from),to=worldVector(options.to);
    if(!from||!to||![...from,...to].every(Number.isFinite))throw new TypeError("Actor movement requires finite world-space from/to positions.");
    const fromPosition=new THREE.Vector3(...from),desired=new THREE.Vector3(...to),gravity=queryGravityField(fromPosition);
    let up=worldVector(options.up);if(!up&&gravity&&gravity.up)up=gravity.up.toArray();if(!up)up=[0,1,0];
    const upVector=new THREE.Vector3(...up);if(upVector.lengthSq()<1e-8)upVector.set(0,1,0);else upVector.normalize();
    const profile={radius:Math.max(0.05,Number(options.radius)||PLAYER_CAPSULE.radius),height:Math.max(0.1,Number(options.height)||PLAYER_CAPSULE.height),
      maxSubstepDistance:Math.max(0.05,Number(options.maxSubstepDistance)||PLAYER_CAPSULE.maxSubstepDistance*0.75),skin:options.skin,exclude:options.exclude||null};
    let position=resolveSolidMovement(fromPosition,desired,upVector,profile);const beforeBoundary=position.clone();position=resolveWorldBoundaries(fromPosition,position);
    let support=null;if(options.support===true){try{support=sampleFootSupport(position,upVector,{maxRise:Number.isFinite(options.maxRise)?Math.max(0,options.maxRise):0.65,maxDrop:Number.isFinite(options.maxDrop)?Math.max(0,options.maxDrop):1.5});}catch(_){support=null;}if(support)position.copy(support.position);}
    const g=queryGravityField(position);
    return {position:position.toArray(),requested:desired.toArray(),resolved:position.toArray(),blocked:position.distanceTo(desired)>0.025,boundaryAdjusted:position.distanceTo(beforeBoundary)>0.025,
      gravity:g?{fieldId:g.id,magnitudeMS2:g.magnitude,up:g.up.toArray()}:null,
      support:support?{grounded:!!support.grounded,supportId:support.supportId||null,normal:(support.terrainNormal||support.up).toArray(),slopeDegrees:Number(support.slopeDegrees)||0}:null,
      profile:{radiusM:profile.radius,heightM:profile.height}};
  }

  const ambientFauna = [];
  const saloonDancers = [];
  // Shared Haven surface basis used by the wildlife animation loop.
  let havenEast = null, havenNorth = null, havenUp = null;
  let onFoot = false;
  let stationInteriorMode = false;
  let lastStopDinerRef = null;
  let stationWalkRoot = null;
  let solarHabitatOrbit = null;
  let solarHabitatStation = null;
  let solarHabitatRing = null;
  let havenOrbitRoot = null, lastStopOrbitRoot = null;
  let havenOrbitLine = null, lastStopOrbitLine = null;
  let centralStar = null, havenSunLight = null;
  let solarCommonsLandingMarker = null;
  let playerGrounded = true;
  // Previous transform of the registered surface currently supporting the player.
  let playerSupportFrame = null;
  let playerVerticalSpeed = 0;
  let playerAirHeight = 0;
  let playerHeading = null;
  let playerFlightForward = null;
  let playerUp = null;
  let playerRight = null;
  let playerMove = null;
  let playerCameraTarget = null;
  let cameraRaycaster = null;
  let cameraYaw = 0;
  let cameraPitch = 0.32;
  let cameraMode = "third";
  let lookInputX = 0, lookInputY = 0;
  let touchFlightYaw = 0, touchFlightPitch = 0;
  let touchFlightThrust = 0, touchFlightStrafe = 0;
  // Third-person flight camera orbit is independent of the astronaut's nose.
  let flightCameraYaw = 0, flightCameraPitch = 0.18;
  let jetpackAltitude = 0;
  let cameraButton = null;
  let lookPad = null;
  let landingState = "idle";
  let shipParked = false;
  let parkedShipPosition = null;
  let parkedShipQuaternion = null;
  let brakeButton = null;
  let parkButton = null;
  let landingNormal = null;
  let landingQuaternion = null;
  let landingDestination = null;

  let destroyed = false;
  let animationFrame = 0;
  let lastTime = 0;

  const velocity = { x: 0, y: 0, z: 0 };
  const keys = Object.create(null);
  const cleanup = [];

  // ============================================================
  // ROOT CONTAINER
  // ============================================================

  const root = document.createElement("div");

  root.id = "kepler-reach-root";

  Object.assign(root.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    background: "#11152a",
    zIndex: "9998",
    fontFamily: "monospace"
  });

  document.body.appendChild(root);

  // Shared top action strip keeps contextual buttons away from the
  // right-side camera/look pad and lower movement controls.
  const topActionBar = document.createElement("div");
  Object.assign(topActionBar.style, {
    position: "absolute", top: "10px", left: "50%",
    transform: "translateX(-50%)", width: "calc(100% - 16px)",
    maxWidth: "1100px", display: "flex", flexDirection: "row",
    flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start",
    gap: "6px", zIndex: "80", pointerEvents: "none"
  });
  root.appendChild(topActionBar);

  const navReadout = document.createElement("div");
  Object.assign(navReadout.style, {
    position: "absolute", top: "50px", left: "8px",
    width: "auto", maxWidth: "min(520px, calc(100% - 16px))",
    boxSizing: "border-box", display: "flex", flexWrap: "wrap",
    justifyContent: "flex-start", alignContent: "flex-start",
    gap: "4px 12px", padding: "6px 9px",
    border: "1px solid rgba(129,178,190,.34)",
    borderRadius: "5px", background: "rgba(5,15,25,.76)",
    color: "#c5e1df", font: "10px/1.4 monospace",
    letterSpacing: ".35px", textAlign: "left",
    textShadow: "0 1px 4px #000", pointerEvents: "none",
    zIndex: "81"
  });
  navReadout.innerHTML = '<span id="kr-nav-coords">HAVEN --</span><span id="kr-nav-heading">HDG --</span><span id="kr-nav-xyz" style="flex:1 0 100%;opacity:.86">WORLD XYZ --</span><span id="kr-nav-ship" style="flex:1 0 100%">SHIP --</span>';
  root.appendChild(navReadout);

  const actionButtons = document.createElement("div");
  Object.assign(actionButtons.style, {
    position: "absolute", top: "8px", left: "8px", right: "8px",
    width: "auto", maxWidth: "none", boxSizing: "border-box",
    display: "flex", flexDirection: "row", flexWrap: "nowrap",
    justifyContent: "center", alignItems: "center",
    alignContent: "center", gap: "5px", padding: "0 2px 3px",
    overflowX: "auto", overflowY: "hidden", scrollbarWidth: "none",
    WebkitOverflowScrolling: "touch", pointerEvents: "auto",
    zIndex: "90", isolation: "isolate"
  });
  root.appendChild(actionButtons);

  const modeHint = document.createElement("div");
  Object.assign(modeHint.style, {
    order: "2", flex: "1 0 100%", display: "none",
    boxSizing: "border-box", padding: "4px 8px", margin: "0 auto",
    maxWidth: "100%", borderRadius: "4px",
    background: "rgba(10,24,32,.82)", color: "#ffe0a6",
    border: "1px solid rgba(255,204,132,.42)",
    font: "bold 10px monospace", textAlign: "center",
    letterSpacing: ".6px", pointerEvents: "none"
  });
  topActionBar.appendChild(modeHint);
  let modeHintTimer = 0;
  function showModeHint(message) {
    modeHint.textContent = message;
    modeHint.style.display = "block";
    if (modeHintTimer) clearTimeout(modeHintTimer);
    modeHintTimer = setTimeout(() => { modeHint.style.display = "none"; }, 4200);
  }

  function placeTopAction(button) {
    Object.assign(button.style, {
      position: "relative", top: "auto", right: "auto",
      bottom: "auto", left: "auto", minWidth: "0",
      width: "auto", maxWidth: "none", padding: "7px 9px", margin: "0",
      minHeight: "34px", height: "34px", boxSizing: "border-box",
      fontSize: "9px", lineHeight: "1", whiteSpace: "nowrap",
      flex: "0 0 auto", pointerEvents: "auto", touchAction: "manipulation",
      WebkitTapHighlightColor: "transparent", userSelect: "none", WebkitUserSelect: "none", zIndex: "90"
    });
    actionButtons.appendChild(button);
  }

  let solarCommonsNearbyNPC = null;
  let solarCommonsDialogueIndex = 0;
  const solarTalkButton=document.createElement("button");
  solarTalkButton.type="button";solarTalkButton.textContent="TALK";
  Object.assign(solarTalkButton.style,{position:"absolute",top:"68px",left:"50%",transform:"translateX(-50%)",display:"none",zIndex:"120",padding:"10px 18px",borderRadius:"5px",border:"1px solid #9acdb9",background:"rgba(13,38,43,.96)",color:"#e5f4d8",font:"bold 12px monospace",letterSpacing:"1px",touchAction:"manipulation"});
  root.appendChild(solarTalkButton);
  const solarDialoguePanel=document.createElement("div");
  Object.assign(solarDialoguePanel.style,{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",display:"none",width:"min(420px, calc(100% - 36px))",boxSizing:"border-box",padding:"18px",zIndex:"130",border:"1px solid rgba(151,211,188,.75)",borderRadius:"8px",background:"rgba(9,25,31,.97)",color:"#e8ead7",font:"13px/1.55 monospace",boxShadow:"0 12px 36px rgba(0,0,0,.55)",pointerEvents:"auto"});
  const solarDialogueTitle=document.createElement("div");
  Object.assign(solarDialogueTitle.style,{font:"bold 14px monospace",letterSpacing:"1px",color:"#ffd58b",marginBottom:"10px"});
  const solarDialogueText=document.createElement("div");
  Object.assign(solarDialogueText.style,{minHeight:"76px",whiteSpace:"normal",marginBottom:"14px"});
  const solarDialogueActions=document.createElement("div");
  Object.assign(solarDialogueActions.style,{display:"flex",gap:"8px",justifyContent:"flex-end"});
  const solarDialogueNext=document.createElement("button");solarDialogueNext.type="button";solarDialogueNext.textContent="NEXT";
  const solarDialogueClose=document.createElement("button");solarDialogueClose.type="button";solarDialogueClose.textContent="CLOSE";
  for(const b of [solarDialogueNext,solarDialogueClose])Object.assign(b.style,{padding:"9px 14px",borderRadius:"4px",border:"1px solid #8db9a7",background:"#203e40",color:"#f1e7c9",font:"bold 11px monospace",touchAction:"manipulation"});
  solarDialogueActions.append(solarDialogueNext,solarDialogueClose);solarDialoguePanel.append(solarDialogueTitle,solarDialogueText,solarDialogueActions);root.appendChild(solarDialoguePanel);
  function showSolarDialogue(){if(!solarCommonsNearbyNPC)return;const lines=solarCommonsNearbyNPC.dialogueLines||["Welcome to Solar Commons."];solarCommonsDialogueIndex=solarCommonsDialogueIndex%lines.length;solarDialogueTitle.textContent=solarCommonsNearbyNPC.name+" // "+solarCommonsNearbyNPC.group.userData.role;solarDialogueText.textContent=lines[solarCommonsDialogueIndex];solarDialoguePanel.style.display="block";solarDialogueNext.textContent=solarCommonsDialogueIndex===lines.length-1?"RESTART":"NEXT";}
  solarTalkButton.addEventListener("click",showSolarDialogue);
  solarDialogueNext.addEventListener("click",()=>{if(!solarCommonsNearbyNPC)return;const n=(solarCommonsNearbyNPC.dialogueLines||[]).length;solarCommonsDialogueIndex=n?(solarCommonsDialogueIndex+1)%n:0;showSolarDialogue();});
  solarDialogueClose.addEventListener("click",()=>{solarDialoguePanel.style.display="none";});
  function updateSolarCommonsInteraction(){
    if(!onFoot||playerInSpaceFlight||!stationInteriorMode||stationWalkRoot!==solarHabitatStation||!solarHabitatStation?.userData.biosphere){solarTalkButton.style.display="none";solarCommonsNearbyNPC=null;solarDialoguePanel.style.display="none";return;}
    const npcs=solarHabitatStation.userData.biosphere.npcs;let nearest=null,best=8.5;
    for(const npc of npcs){const d=playerAvatar.position.distanceTo(npc.group.getWorldPosition(new THREE.Vector3()));if(d<best){best=d;nearest=npc;}}
    solarCommonsNearbyNPC=nearest;solarTalkButton.style.display=nearest?"block":"none";
    if(nearest)solarTalkButton.textContent="TALK TO "+nearest.name;else solarDialoguePanel.style.display="none";
  }

  // ============================================================
  // HUD
  // ============================================================

  const hud = document.createElement("div");

  Object.assign(hud.style, {
    display: "none",
    position: "absolute",
    top: "104px",
    left: "20px",
    zIndex: "10",
    color: "#f2e6c8",
    fontSize: "12px",
    lineHeight: "1.8",
    pointerEvents: "none",
    textShadow: "0 2px 5px #000"
  });

  hud.innerHTML = `
    <div style="
      color:#ffd477;
      font-size:18px;
      letter-spacing:3px;
    ">KEPLER REACH</div>

    <div>PROCEDURAL UNIVERSE // BUILD 0.4.06</div>

    <div id="kr-location">LOCATION: INITIALIZING</div>
    <div id="kr-speed">VELOCITY: 0</div>
    <div id="kr-distance">HAVEN: SCANNING</div>
    <div id="kr-target">LANDING SITE: ACQUIRING</div>
    <div id="kr-phase">FLIGHT PHASE: INITIALIZING</div>
    <div id="kr-moon">LUNA: TRACKING</div>
    <div id="kr-status">LOADING ENGINE</div>
  `;

  root.appendChild(hud);

  // HOME / HAVEN RETURN CONTROL
  const homeButton = document.createElement("button");
  homeButton.type = "button";
  homeButton.textContent = "⌂  HOME / HAVEN";
  Object.assign(homeButton.style, {
    position: "absolute", top: "18px", right: "18px", zIndex: "25",
    padding: "11px 15px", color: "#f0d6a4",
    background: "rgba(13,27,43,.88)", border: "1px solid #9b8059",
    borderRadius: "5px", font: "bold 12px monospace",
    letterSpacing: "1px", cursor: "pointer", touchAction: "manipulation",
    boxShadow: "0 2px 12px rgba(0,0,0,.35)"
  });
  homeButton.addEventListener("click", returnHome);
  placeTopAction(homeButton);

  // Three selectable on-foot explorers. The original procedural spaceman is the default.
  const explorerSelectorButton=document.createElement("button");
  explorerSelectorButton.type="button";
  explorerSelectorButton.textContent="EXPLORER: SPACEMAN";
  Object.assign(explorerSelectorButton.style,{position:"absolute",top:"18px",left:"18px",zIndex:"26",padding:"11px 14px",color:"#d9f2e8",background:"rgba(13,27,43,.92)",border:"1px solid #648f87",borderRadius:"5px",font:"bold 11px monospace",letterSpacing:"1px",cursor:"pointer",touchAction:"manipulation",boxShadow:"0 2px 12px rgba(0,0,0,.35)"});
  root.appendChild(explorerSelectorButton);
  const explorerSelectorPanel=document.createElement("div");
  Object.assign(explorerSelectorPanel.style,{position:"absolute",top:"62px",left:"18px",zIndex:"126",display:"none",minWidth:"210px",padding:"8px",border:"1px solid rgba(116,174,158,.85)",borderRadius:"6px",background:"rgba(8,23,30,.97)",boxShadow:"0 10px 28px rgba(0,0,0,.5)",pointerEvents:"auto"});
  const explorerSelectorTitle=document.createElement("div");
  explorerSelectorTitle.textContent="SELECT EXPLORER";
  Object.assign(explorerSelectorTitle.style,{padding:"5px 7px 9px",color:"#ffd58b",font:"bold 10px monospace",letterSpacing:"1px"});
  const explorerOriginalOption=document.createElement("button"),explorerGeorgeOption=document.createElement("button"),explorerTrashOption=document.createElement("button");
  for(const option of [explorerOriginalOption,explorerGeorgeOption,explorerTrashOption]){
    option.type="button";
    Object.assign(option.style,{display:"block",width:"100%",margin:"3px 0",padding:"10px 9px",textAlign:"left",color:"#e7f2e8",background:"#18353a",border:"1px solid #547e77",borderRadius:"4px",font:"bold 11px monospace",letterSpacing:".4px",cursor:"pointer",touchAction:"manipulation"});
  }
  explorerOriginalOption.textContent="ORIGINAL SPACEMAN";
  explorerGeorgeOption.textContent="GEORGE-2077";
  explorerTrashOption.textContent="TRASH-CAN ROBOT";
  explorerSelectorPanel.append(explorerSelectorTitle,explorerOriginalOption,explorerGeorgeOption,explorerTrashOption);
  root.appendChild(explorerSelectorPanel);
  function refreshExplorerSelectorUI(){
    const label=activeExplorerCharacter==="trash-can"?"TRASH-CAN ROBOT":activeExplorerCharacter==="george"?"GEORGE-2077":"ORIGINAL SPACEMAN";
    explorerSelectorButton.textContent="EXPLORER: "+label;
    explorerOriginalOption.style.borderColor=activeExplorerCharacter==="original"?"#f4cf83":"#547e77";
    explorerGeorgeOption.style.borderColor=activeExplorerCharacter==="george"?"#f4cf83":"#547e77";
    explorerTrashOption.style.borderColor=activeExplorerCharacter==="trash-can"?"#f4cf83":"#547e77";
  }
  // Use Pointer Events directly. Some mobile WebViews/CyTube touch layers
  // suppress the synthetic click event after a touch, so click-only controls
  // can appear responsive but never invoke their action.
  const selectorPointerAction=(element,action)=>{
    element.style.pointerEvents="auto";
    element.style.touchAction="manipulation";
    element.addEventListener("pointerdown",event=>{
      if(event.isPrimary===false)return;
      if(event.cancelable)event.preventDefault();
      event.stopPropagation();
      action();
    },{passive:false});
    // Keyboard and accessibility activation remains available.
    element.addEventListener("click",event=>{
      if(event.detail===0){event.preventDefault();event.stopPropagation();action();}
    });
  };
  selectorPointerAction(explorerSelectorButton,()=>{
    explorerSelectorPanel.style.display=explorerSelectorPanel.style.display==="none"?"block":"none";
  });
  selectorPointerAction(explorerOriginalOption,()=>{
    explorerSelectorPanel.style.display="none";
    selectExplorerCharacter("original");
  });
  selectorPointerAction(explorerGeorgeOption,()=>{
    explorerSelectorPanel.style.display="none";
    selectExplorerCharacter("george");
  });
  selectorPointerAction(explorerTrashOption,()=>{
    explorerSelectorPanel.style.display="none";
    explorerSelectorButton.textContent="LOADING: TRASH-CAN...";
    setStatus("LOADING TRASH-CAN ROBOT // PLEASE WAIT");
    selectExplorerCharacter("trash-can");
  });
  refreshExplorerSelectorUI();

  // LANDING CONTROL
  landingButton = document.createElement("button");
  landingButton.type = "button";
  landingButton.textContent = "LANDING ASSIST";
  Object.assign(landingButton.style, {
    position: "absolute", top: "62px", right: "18px", zIndex: "25",
    minWidth: "154px", padding: "11px 15px",
    color: "#d5e8e7", background: "rgba(13,27,43,.88)",
    border: "1px solid #527f83", borderRadius: "5px",
    font: "bold 11px monospace", letterSpacing: "1px",
    cursor: "pointer", touchAction: "manipulation",
    boxShadow: "0 2px 12px rgba(0,0,0,.35)",
    opacity: "0.48"
  });
  landingButton.disabled = true;
  landingButton.addEventListener("click", () => {
    if (landingState === "approach") {
      landingState = "idle";
      clearKeys();
      setStatus("LANDING ASSIST ABORTED // MANUAL FLIGHT");
      return;
    }
    if (landingState === "landed") return;
    const distance = ship && landingTarget
      ? ship.position.distanceTo(landingTarget)
      : Infinity;
    if (distance > 220) {
      setStatus("LANDING ASSIST LOCKED // CLOSE TO THE BEACON");
      return;
    }
    setShipParked(false);
    activeSurfaceBody = activeLandingBody;
    landingState = "approach";
    clearKeys();
    velocity.x = velocity.y = velocity.z = 0;
    setStatus("LANDING ASSIST ENGAGED // ALIGNING WITH PAD");
  });
  placeTopAction(landingButton);

  // ON-FOOT CONTROLS
  disembarkButton = document.createElement("button");
  disembarkButton.type = "button";
  disembarkButton.textContent = "↗  DISEMBARK";
  Object.assign(disembarkButton.style, {
    position: "absolute", top: "106px", right: "18px", zIndex: "25",
    minWidth: "154px", padding: "11px 15px",
    color: "#e4d5b5", background: "rgba(20,31,34,.92)",
    border: "1px solid #a18a60", borderRadius: "5px",
    font: "bold 11px monospace", letterSpacing: "1px",
    cursor: "pointer", touchAction: "manipulation",
    display: "none"
  });
  disembarkButton.addEventListener("click", disembark);
  placeTopAction(disembarkButton);

  boardShipButton = document.createElement("button");
  boardShipButton.type = "button";
  boardShipButton.textContent = "BOARD SHIP / LAUNCH";
  Object.assign(boardShipButton.style, {
    position: "absolute", top: "106px", right: "18px", zIndex: "25",
    minWidth: "154px", padding: "11px 15px",
    color: "#d5e8e7", background: "rgba(13,27,43,.92)",
    border: "1px solid #527f83", borderRadius: "5px",
    font: "bold 11px monospace", letterSpacing: "1px",
    cursor: "pointer", touchAction: "manipulation",
    display: "none"
  });
  boardShipButton.addEventListener("click", boardShip);
  placeTopAction(boardShipButton);
  buggyInteractButton = document.createElement("button");
  buggyInteractButton.type = "button";
  buggyInteractButton.textContent = "ENTER MOON BUGGY";
  Object.assign(buggyInteractButton.style, { position:"absolute", top:"150px", right:"18px", zIndex:"25", minWidth:"154px", padding:"11px 15px", color:"#f3dfad", background:"rgba(35,48,39,.94)", border:"1px solid #9ebd83", borderRadius:"5px", font:"bold 11px monospace", letterSpacing:"1px", cursor:"pointer", touchAction:"manipulation", display:"none" });
  buggyInteractButton.addEventListener("click", toggleBuggy);
  placeTopAction(buggyInteractButton);
  maritimeInteractButton=document.createElement("button");maritimeInteractButton.type="button";maritimeInteractButton.textContent="MARITIME";
  Object.assign(maritimeInteractButton.style,{position:"absolute",top:"150px",right:"18px",zIndex:"25",minWidth:"170px",padding:"11px 15px",color:"#d8f0ec",background:"rgba(13,42,52,.94)",border:"1px solid #69b8bd",borderRadius:"5px",font:"bold 11px monospace",letterSpacing:"1px",cursor:"pointer",touchAction:"manipulation",display:"none"});
  maritimeInteractButton.addEventListener("click",handleMaritimeAction);placeTopAction(maritimeInteractButton);
  habitatGateButton = document.createElement("button");
  habitatGateButton.type = "button";
  habitatGateButton.textContent = "OPEN WILDLIFE GATES";
  Object.assign(habitatGateButton.style, {position:"absolute",top:"196px",right:"18px",zIndex:"25",minWidth:"174px",padding:"11px 14px",color:"#f5e9c9",background:"rgba(38,62,48,.94)",border:"1px solid #9acb91",borderRadius:"5px",font:"bold 11px monospace",letterSpacing:"1px",cursor:"pointer",touchAction:"manipulation",display:"none"});
  habitatGateButton.addEventListener("click", openWildlifeHabitat);
  placeTopAction(habitatGateButton);
  ranchInteractButton=document.createElement("button");ranchInteractButton.type="button";ranchInteractButton.textContent="LEMMY'S RANCH";
  Object.assign(ranchInteractButton.style,{position:"absolute",top:"236px",right:"18px",zIndex:"25",padding:"11px 14px",color:"#ffe6b0",background:"rgba(73,43,29,.96)",border:"1px solid #d4a65d",borderRadius:"5px",font:"bold 11px monospace",cursor:"pointer",display:"none"});
  ranchInteractButton.addEventListener("click",()=>openRanchPanel("bar"));placeTopAction(ranchInteractButton);
  moonRxButton=document.createElement("button");moonRxButton.type="button";moonRxButton.textContent="MOON MAN'S RX";Object.assign(moonRxButton.style,{position:"absolute",top:"236px",right:"18px",zIndex:"25",padding:"11px 14px",color:"#fff0c0",background:"rgba(55,95,83,.97)",border:"1px solid #f0cf58",borderRadius:"5px",font:"bold 11px monospace",cursor:"pointer",display:"none"});moonRxButton.addEventListener("click",()=>openShopPanel("rx"));placeTopAction(moonRxButton);
  sanchosButton=document.createElement("button");sanchosButton.type="button";sanchosButton.textContent="SANCHO'S ARMORY";Object.assign(sanchosButton.style,{position:"absolute",top:"236px",right:"18px",zIndex:"25",padding:"11px 14px",color:"#fff0c0",background:"rgba(112,53,42,.97)",border:"1px solid #f0cf58",borderRadius:"5px",font:"bold 11px monospace",cursor:"pointer",display:"none"});sanchosButton.addEventListener("click",()=>openShopPanel("armory"));placeTopAction(sanchosButton);
  whizzDanceButton=document.createElement("button");whizzDanceButton.type="button";whizzDanceButton.textContent="WHIZZ'S DANCE HOUSE";Object.assign(whizzDanceButton.style,{position:"absolute",top:"236px",right:"18px",zIndex:"25",padding:"11px 14px",color:"#fff0c0",background:"rgba(102,55,116,.97)",border:"1px solid #ffd92f",borderRadius:"5px",font:"bold 11px monospace",cursor:"pointer",display:"none"});whizzDanceButton.addEventListener("click",openWhizzDancePanel);placeTopAction(whizzDanceButton);
  ranchPanel=document.createElement("div");Object.assign(ranchPanel.style,{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",width:"min(450px,calc(100% - 28px))",maxHeight:"78vh",overflowY:"auto",padding:"15px",boxSizing:"border-box",border:"2px solid #c69a4e",borderRadius:"9px",background:"rgba(35,25,22,.97)",color:"#f5e5c8",font:"13px monospace",zIndex:"150",display:"none"});root.appendChild(ranchPanel);
  shopPanel=document.createElement("div");Object.assign(shopPanel.style,{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",width:"min(450px,calc(100% - 28px))",maxHeight:"78vh",overflowY:"auto",padding:"15px",boxSizing:"border-box",border:"3px solid #b51f18",borderRadius:"7px",background:"rgba(38,31,21,.98)",color:"#fff0c0",font:"13px monospace",zIndex:"151",display:"none"});root.appendChild(shopPanel);
  whizzDancePanel=document.createElement("div");Object.assign(whizzDancePanel.style,{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",width:"min(430px,calc(100% - 28px))",padding:"18px",boxSizing:"border-box",border:"3px solid #ffd92f",borderRadius:"9px",background:"rgba(43,30,55,.97)",color:"#fff0c0",font:"13px monospace",zIndex:"152",display:"none",textAlign:"center"});root.appendChild(whizzDancePanel);
  function ranchBtn(label,fn){const b=document.createElement("button");b.textContent=label;Object.assign(b.style,{display:"block",width:"100%",margin:"6px 0",padding:"10px",background:"#59402c",color:"#ffe6b0",border:"1px solid #9c7548",borderRadius:"5px",font:"bold 12px monospace"});b.addEventListener("click",fn);return b;}
  function openRanchPanel(tab="bar"){if(!onFoot)return;ranchPanel.style.display="block";renderRanchPanel(tab);}
  function renderRanchPanel(tab="bar"){
    ranchPanel.replaceChildren();const title=document.createElement("h2");title.textContent="LEMMY'S RANCH";title.style.color="#ffd17f";ranchPanel.appendChild(title);
    const money=document.createElement("p");money.textContent="CREDITS: "+ranchGame.credits;ranchPanel.appendChild(money);
    for(const [label,key] of [["BAR","bar"],["INVENTORY","inventory"],["QUESTS","quests"]])ranchPanel.appendChild(ranchBtn(label,()=>renderRanchPanel(key)));
    if(tab==="bar"){
      const talk=document.createElement("p");talk.textContent=ranchGame.dialogue;ranchPanel.appendChild(talk);
      const shopTitle=document.createElement("h3");shopTitle.textContent="BAR & GENERAL GOODS";ranchPanel.appendChild(shopTitle);
      for(const item of ranchShop)ranchPanel.appendChild(ranchBtn("BUY "+item.name+" — "+item.price+" CREDITS",()=>buyRanchItem(item.name)));
      ranchPanel.appendChild(ranchBtn("SELL MINED ORE ("+explorerEquipment.oreMined+" × 3 CR)",()=>sellMinedOre()));
      ranchPanel.appendChild(ranchBtn("ASK LEMMY FOR WORK",()=>{ranchGame.dialogue="Visit the North Pole Observatory and report back. I'll pay 75 credits.";renderRanchPanel("bar");}));
      ranchPanel.appendChild(ranchBtn("ACCEPT OBSERVATORY DELIVERY",acceptRanchQuest));
      const dancer=saloonDancers.find(d=>d.group.visible);
      if(dancer){
        ranchPanel.appendChild(ranchBtn("TALK TO "+dancer.group.userData.npcName,()=>{ranchGame.dialogue=dancer.group.userData.npcName+": "+["The band plays better when the floor is full!","Lemmy keeps the best stories behind the bar.","Maybe you can show me the sights in that buggy."][saloonDancers.indexOf(dancer)%3];renderRanchPanel("bar");}));
        ranchPanel.appendChild(ranchBtn("INVITE "+dancer.group.userData.npcName+" FOR A BUGGY RIDE",()=>inviteRanchDancer(dancer)));
      }
      if(ranchPassengerDancer)ranchPanel.appendChild(ranchBtn("RETURN "+ranchPassengerDancer.group.userData.npcName+" TO THE RANCH",returnRanchDancer));
    }else if(tab==="inventory"){
      const h=document.createElement("h3");h.textContent="YOUR PACK";ranchPanel.appendChild(h);
      if(!ranchGame.inventory.length){const p=document.createElement("p");p.textContent="Empty";ranchPanel.appendChild(p);}
      for(const item of ranchGame.inventory){const p=document.createElement("p");p.textContent=item.name+" × "+item.quantity;ranchPanel.appendChild(p);}
    }else{
      const h=document.createElement("h3");h.textContent="YOUR JOBS";ranchPanel.appendChild(h);
      for(const q of ranchGame.quests){const p=document.createElement("p");p.textContent=q.title+" — "+(q.complete?"COMPLETE":"IN PROGRESS");ranchPanel.appendChild(p);}
    }
    ranchPanel.appendChild(ranchBtn("CLOSE",()=>{ranchPanel.style.display="none";}));
  }
  function addRanchItem(name){let item=ranchGame.inventory.find(x=>x.name===name);if(!item){item={name,quantity:0};ranchGame.inventory.push(item);}item.quantity++;}
  function buyRanchItem(name){const item=ranchShop.find(x=>x.name===name);if(!item)return false;if(ranchGame.credits<item.price){ranchGame.dialogue="You're a little short on credits, partner.";renderRanchPanel("bar");return false;}ranchGame.credits-=item.price;addRanchItem(name);ranchGame.dialogue="Pleasure doing business. "+name+" is in your pack.";renderRanchPanel("bar");setStatus("PURCHASE COMPLETE // -"+item.price+" CREDITS");return true;}
  function acceptRanchQuest(){if(ranchGame.quests.some(q=>q.id==="observatory-run"&&!q.complete)){ranchGame.dialogue="You've already got that job.";renderRanchPanel("bar");return;}ranchGame.quests.push({id:"observatory-run",title:"A Message from Lemmy",complete:false,visited:false});ranchGame.dialogue="Visit the North Pole Observatory, then come back.";renderRanchPanel("quests");setStatus("NEW QUEST // A MESSAGE FROM LEMMY");}
  function updateRanchQuestProgress(){
    if(!onFoot||!playerAvatar||!northObservatoryRef||!bartenderNpcRef)return;
    const q=ranchGame.quests.find(x=>x.id==="observatory-run"&&!x.complete);if(!q)return;
    const pos=playerAvatar.position;
    if(!q.visited&&pos.distanceTo(northObservatoryRef.getWorldPosition(new THREE.Vector3()))<24){q.visited=true;ranchGame.dialogue="You reached the observatory. Bring the report back to me.";setStatus("QUEST UPDATE // RETURN TO LEMMY");}
    if(q.visited&&pos.distanceTo(bartenderNpcRef.getWorldPosition(new THREE.Vector3()))<30){q.complete=true;ranchGame.credits+=75;ranchGame.dialogue="You made it back! Here are your 75 credits.";setStatus("QUEST COMPLETE // +75 CREDITS");if(ranchPanel.style.display!=="none")renderRanchPanel("quests");}
  }
  const moonRxShop=[{name:"Personal Jetpack",price:85},{name:"Herbal Speed Tonic",price:20},{name:"Location Beacon",price:30},{name:"Pocket Star Map",price:25}];
  const sanchosShop=[{name:"Frontier Sidearm",price:60},{name:"Pulse Carbine",price:110},{name:"Shock Baton",price:35}];
  function openWhizzDancePanel(){if(!onFoot)return;whizzDancePanel.replaceChildren();const h=document.createElement("h2");h.textContent="WHIZZ'S DANCE HOUSE";h.style.color="#ffd92f";whizzDancePanel.appendChild(h);const p=document.createElement("p");p.textContent="The floor is open! The DJ is spinning interstellar favorites. Watch out for the space chickens and watermelons.";whizzDancePanel.appendChild(p);const b=document.createElement("button");b.textContent="BACK TO THE DANCE FLOOR";Object.assign(b.style,{padding:"11px 14px",marginTop:"8px",background:"#6d477d",color:"#fff0c0",border:"1px solid #ffd92f",borderRadius:"5px",font:"bold 12px monospace"});b.onclick=()=>whizzDancePanel.style.display="none";whizzDancePanel.appendChild(b);whizzDancePanel.style.display="block";}
  function openShopPanel(kind){
    if(!onFoot)return;
    const isRx=kind==="rx",items=isRx?moonRxShop:sanchosShop,title=isRx?"MOON MAN'S RX":"SANCHO'S ARMORY";
    shopPanel.replaceChildren();
    const h=document.createElement("h2");h.textContent=title;h.style.color="#ffd92f";shopPanel.appendChild(h);
    const credits=document.createElement("p");credits.textContent="CREDITS: "+ranchGame.credits;shopPanel.appendChild(credits);
    const intro=document.createElement("p");intro.textContent=isRx?"Jetpacks, field remedies and exploration gear.":"Frontier protection and practical hardware.";shopPanel.appendChild(intro);
    for(const item of items){shopPanel.appendChild(ranchBtn("BUY "+item.name+" — "+item.price+" CREDITS",()=>{
      if(ranchGame.credits<item.price){setStatus("NOT ENOUGH CREDITS",true);return;}
      ranchGame.credits-=item.price;addRanchItem(item.name);setStatus("PURCHASE COMPLETE // "+item.name+" ADDED TO INVENTORY");openShopPanel(kind);
    }));}
    shopPanel.appendChild(ranchBtn("VIEW INVENTORY",()=>{
      shopPanel.replaceChildren();const ih=document.createElement("h2");ih.textContent="YOUR PACK";shopPanel.appendChild(ih);
      const c=document.createElement("p");c.textContent="CREDITS: "+ranchGame.credits;shopPanel.appendChild(c);
      for(const item of ranchGame.inventory){const p=document.createElement("p");p.textContent=item.name+" × "+item.quantity;shopPanel.appendChild(p);}
      shopPanel.appendChild(ranchBtn("BACK TO SHOP",()=>openShopPanel(kind)));shopPanel.appendChild(ranchBtn("CLOSE",()=>shopPanel.style.display="none"));
    }));
    shopPanel.appendChild(ranchBtn("CLOSE",()=>shopPanel.style.display="none"));shopPanel.style.display="block";
  }
  function inviteRanchDancer(d){if(!havenBuggy||ranchPassengerDancer)return;const id="ranch-dancer-"+d.group.userData.npcName.toLowerCase();if(!addVehicleOccupant({id,type:"npc",label:d.group.userData.npcName,slot:"passenger"})){ranchGame.dialogue="The passenger seat is occupied.";renderRanchPanel("bar");return;}d.group.visible=false;ranchPassengerDancer=d;ranchGame.dialogue=d.group.userData.npcName+" joins you for a ride.";renderRanchPanel("bar");}
  function returnRanchDancer(){if(!ranchPassengerDancer)return;removeVehicleOccupant("ranch-dancer-"+ranchPassengerDancer.group.userData.npcName.toLowerCase());ranchPassengerDancer.group.visible=true;ranchPassengerDancer=null;renderRanchPanel("bar");}


  // ============================================================
  // STATUS / ERROR DISPLAY
  // ============================================================

  const statusPanel = document.createElement("div");

  Object.assign(statusPanel.style, {
    display: "none",
    position: "absolute",
    bottom: "178px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "min(560px, calc(100% - 32px))",
    boxSizing: "border-box",
    padding: "6px 10px",
    border: "1px solid rgba(126,164,177,.38)",
    borderRadius: "5px",
    background: "rgba(5,14,24,.68)",
    textAlign: "center",
    zIndex: "70",
    color: "#a9c5d9",
    fontSize: "10px",
    lineHeight: "1.35",
    pointerEvents: "none",
    textShadow: "0 2px 5px #000"
  });

  statusPanel.textContent = "INITIALIZING KEPLER REACH";

  root.appendChild(statusPanel);

  let statusTimer = 0;
  // v0.4.06: bounded event log + de-duplication. HUD messages that repeat every frame
  // (e.g. "WALK OUT TO THE SPACE DOCK TO LAUNCH") are logged once and no longer spam the console.
  const statusLog = [];
  let lastStatusMessage = "", lastStatusAt = 0;
  const frameFaults = [];
  function landingBodyName(body) {
    return body === "port" ? "L'ASTROLABE" : body === "moon" ? "LUNA" : body === "solar" ? "SOLAR COMMONS" : body === "last" ? "THE LAST STOP" : "HAVEN";
  }
  function setStatus(message, error = false) {
    const nowMs = performance.now();
    const repeat = message === lastStatusMessage && nowMs - lastStatusAt < 2500;
    lastStatusAt = nowMs;
    if (!repeat) {
      lastStatusMessage = message;
      statusLog.push({ t: Math.round(nowMs / 100) / 10, message: String(message), error: !!error });
      if (statusLog.length > 40) statusLog.shift();
    }
    if (statusPanel.textContent !== message) statusPanel.textContent = message;
    statusPanel.style.color = error ? "#ff7777" : "#a9c5d9";
    statusPanel.style.display = "block";
    if (statusTimer) clearTimeout(statusTimer);
    if (!error) {
      statusTimer = setTimeout(() => { statusPanel.style.display = "none"; }, 4200);
    }
    const hudStatus = document.getElementById("kr-status");
    if (hudStatus && hudStatus.textContent !== message) hudStatus.textContent = message;
    if (!repeat) console[error ? "error" : "log"]("[Kepler Reach]", message);
  }

  // ============================================================
  // MOBILE CONTROLS — ANALOG MOVEMENT + CAMERA D-PAD
  // ============================================================

  let compassRose = null; // optional; D-pad UI does not use a rose
  const mobile = document.createElement("div");
  Object.assign(mobile.style, {
    position: "absolute", left: "18px", bottom: "22px", zIndex: "60",
    width: "148px", height: "148px",
    display: "grid",
    gridTemplateColumns: "repeat(3, 44px)",
    gridTemplateRows: "repeat(3, 44px)",
    gap: "6px",
    justifyContent: "center",
    alignContent: "center",
    touchAction: "none",
    userSelect: "none",
    pointerEvents: "auto"
  });
  const moveLabel = document.createElement("div");
  moveLabel.textContent = "MOVE";
  Object.assign(moveLabel.style, {
    position: "absolute", left: "0", right: "0", top: "-16px",
    textAlign: "center", color: "#e7f4e8", font: "bold 10px monospace",
    letterSpacing: "2px", pointerEvents: "none", textShadow: "0 1px 4px #000"
  });
  mobile.appendChild(moveLabel);

  // 8-way D-pad cells (center is idle)
  const dpadDirs = [
    { label: "↖", dx: -1, dy: -1, r: 1, c: 1 },
    { label: "▲", dx:  0, dy: -1, r: 1, c: 2 },
    { label: "↗", dx:  1, dy: -1, r: 1, c: 3 },
    { label: "◀", dx: -1, dy:  0, r: 2, c: 1 },
    { label: "●", dx:  0, dy:  0, r: 2, c: 2, center: true },
    { label: "▶", dx:  1, dy:  0, r: 2, c: 3 },
    { label: "↙", dx: -1, dy:  1, r: 3, c: 1 },
    { label: "▼", dx:  0, dy:  1, r: 3, c: 2 },
    { label: "↘", dx:  1, dy:  1, r: 3, c: 3 }
  ];
  const dpadButtons = [];
  let movePointerId = null;
  let activeDpad = null;

  function clearMoveKeys() {
    keys.w = keys.a = keys.s = keys.d = keys.arrowup = keys.arrowdown = false;
    touchFlightYaw = touchFlightPitch = 0;
  }

  function applyDpadVector(dx, dy) {
    clearMoveKeys();
    if (dx === 0 && dy === 0) return;
    if (onFoot && playerInSpaceFlight) {
      // Kinetic Field: D-pad steers pitch/yaw intent
      touchFlightYaw = -dx;
      touchFlightPitch = -dy;
    } else if (!onFoot && !buggyMode) {
      touchFlightYaw = dx < 0 ? 1 : (dx > 0 ? -1 : 0);
      touchFlightPitch = dy < 0 ? 1 : (dy > 0 ? -1 : 0);
    } else {
      // On foot / buggy-style walk: 8-way WASD
      if (dy < 0) keys.w = true;
      if (dy > 0) keys.s = true;
      if (dx < 0) keys.a = true;
      if (dx > 0) keys.d = true;
    }
  }

  function setDpadVisual(activeBtn) {
    for (const b of dpadButtons) {
      const on = b === activeBtn && !b._center;
      b.style.background = on
        ? "linear-gradient(180deg,rgba(120,190,196,.95),rgba(40,90,100,.96))"
        : (b._center
            ? "rgba(20,40,48,.55)"
            : "linear-gradient(180deg,rgba(58,105,112,.88),rgba(9,22,34,.92))");
      b.style.borderColor = on ? "#dff7f2" : "rgba(173,224,224,.75)";
      b.style.filter = on ? "brightness(1.15)" : "none";
    }
  }

  function releaseMoveStick() {
    movePointerId = null;
    activeDpad = null;
    clearMoveKeys();
    setDpadVisual(null);
  }

  // Keep name updateMoveStick for any external blur handlers
  function updateMoveStick(event) {
    if (movePointerId !== null && event.pointerId !== movePointerId) return;
    // Hit-test which cell is under the pointer
    const el = document.elementFromPoint(event.clientX, event.clientY);
    let btn = null;
    if (el) {
      for (const b of dpadButtons) {
        if (b === el || b.contains(el)) { btn = b; break; }
      }
    }
    if (!btn) return;
    activeDpad = btn;
    setDpadVisual(btn);
    applyDpadVector(btn._dx, btn._dy);
  }

  for (const item of dpadDirs) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = item.label;
    b._dx = item.dx;
    b._dy = item.dy;
    b._center = !!item.center;
    Object.assign(b.style, {
      gridRow: String(item.r),
      gridColumn: String(item.c),
      width: "44px",
      height: "44px",
      borderRadius: item.center ? "50%" : "10px",
      border: "1.5px solid rgba(173,224,224,.75)",
      background: item.center
        ? "rgba(20,40,48,.55)"
        : "linear-gradient(180deg,rgba(58,105,112,.88),rgba(9,22,34,.92))",
      color: item.center ? "#7a9aa0" : "#edf8f1",
      font: item.center ? "bold 12px monospace" : "bold 16px monospace",
      padding: "0",
      margin: "0",
      touchAction: "none",
      userSelect: "none",
      WebkitUserSelect: "none",
      WebkitTapHighlightColor: "transparent",
      boxShadow: "0 2px 8px rgba(0,0,0,.35)",
      pointerEvents: "auto"
    });
    function press(e) {
      e.preventDefault();
      e.stopPropagation();
      if (movePointerId !== null && e.pointerId !== movePointerId) return;
      movePointerId = e.pointerId;
      try { if (b.setPointerCapture) b.setPointerCapture(e.pointerId); } catch (_) {}
      activeDpad = b;
      setDpadVisual(b);
      applyDpadVector(b._dx, b._dy);
    }
    function release(e) {
      if (e && movePointerId !== null && e.pointerId !== movePointerId) return;
      releaseMoveStick();
    }
    b.addEventListener("pointerdown", press, { passive: false });
    b.addEventListener("pointerup", release, { passive: false });
    b.addEventListener("pointercancel", release, { passive: false });
    b.addEventListener("lostpointercapture", release);
    // Allow sliding across the pad
    b.addEventListener("pointerenter", (e) => {
      if (movePointerId === null) return;
      if (e.buttons === 0 && e.pressure === 0) return;
      activeDpad = b;
      setDpadVisual(b);
      applyDpadVector(b._dx, b._dy);
    });
    mobile.appendChild(b);
    dpadButtons.push(b);
  }

  // Whole-pad pointermove so sliding between cells works even if enter is flaky
  mobile.addEventListener("pointermove", (e) => {
    if (movePointerId !== e.pointerId) return;
    updateMoveStick(e);
  }, { passive: false });
  mobile.addEventListener("pointerup", (e) => {
    if (e.pointerId === movePointerId) releaseMoveStick();
  });
  mobile.addEventListener("pointercancel", releaseMoveStick);

  root.appendChild(mobile);

  lookPad=document.createElement("div");
  Object.assign(lookPad.style,{
    position:"absolute",right:"18px",bottom:"22px",zIndex:"60",
    width:"142px",height:"142px",display:"grid",
    gridTemplateColumns:"repeat(3,40px)",gridTemplateRows:"repeat(3,40px)",
    gap:"4px",justifyContent:"center",alignContent:"center",
    touchAction:"none",userSelect:"none",pointerEvents:"auto"
  });
  const lookButtons=[{label:"▲",x:0,y:-1,r:1,c:2},{label:"◀",x:-1,y:0,r:2,c:1},{label:"▼",x:0,y:1,r:3,c:2},{label:"▶",x:1,y:0,r:2,c:3}];
  const lookPadLabel=document.createElement("div");lookPadLabel.textContent="LOOK";Object.assign(lookPadLabel.style,{position:"absolute",top:"-16px",left:"0",right:"0",textAlign:"center",color:"#e7f4e8",font:"bold 10px monospace",letterSpacing:"2px",pointerEvents:"none",textShadow:"0 1px 4px #000"});lookPad.appendChild(lookPadLabel);
  for(const item of lookButtons){
    const b=document.createElement("button");b.type="button";b.textContent=item.label;
    Object.assign(b.style,{gridRow:item.r,gridColumn:item.c,width:"40px",height:"40px",color:"#d9edf1",background:"rgba(15,35,55,.84)",border:"1px solid #6c9aa7",borderRadius:"8px",font:"bold 18px monospace",touchAction:"none",padding:"0"});
    const press=e=>{e.preventDefault();if(b.setPointerCapture)b.setPointerCapture(e.pointerId);if(!onFoot&&!buggyMode){touchFlightThrust=item.y<0?1:(item.y>0?-1:0);touchFlightStrafe=item.x<0?-1:(item.x>0?1:0);}else if(playerInSpaceFlight){touchFlightThrust=item.y<0?1:(item.y>0?-1:0);touchFlightStrafe=item.x<0?-1:(item.x>0?1:0);}else{lookInputX=item.x;lookInputY=item.y;}};
    const release=e=>{if(e.cancelable)e.preventDefault();if(!onFoot&&!buggyMode){touchFlightThrust=touchFlightStrafe=0;}else if(playerInSpaceFlight){touchFlightThrust=touchFlightStrafe=0;}else if(lookInputX===item.x&&lookInputY===item.y){lookInputX=lookInputY=0;}};
    b.addEventListener("pointerdown",press);b.addEventListener("pointerup",release);b.addEventListener("pointercancel",release);b.addEventListener("lostpointercapture",release);
    lookPad.appendChild(b);
  }
  const recenterButton=document.createElement("button");recenterButton.type="button";recenterButton.textContent="◎";
  Object.assign(recenterButton.style,{gridRow:"2",gridColumn:"2",width:"40px",height:"40px",color:"#ffe4ad",background:"rgba(74,75,52,.94)",border:"1px solid #c5ae72",borderRadius:"50%",font:"bold 20px monospace",padding:"0",touchAction:"none"});
  recenterButton.addEventListener("click",recenterCamera);lookPad.appendChild(recenterButton);root.appendChild(lookPad);

  cameraButton=document.createElement("button");cameraButton.type="button";cameraButton.textContent="VIEW: THIRD PERSON";
  Object.assign(cameraButton.style,{position:"relative",top:"auto",right:"auto",bottom:"auto",left:"auto",zIndex:"80",minWidth:"0",padding:"8px 10px",display:"none",color:"#d8eee9",background:"rgba(20,35,39,.94)",border:"1px solid #75a69a",borderRadius:"5px",font:"bold 10px monospace",letterSpacing:"1px",touchAction:"manipulation",pointerEvents:"auto",flex:"0 1 auto"});
  cameraButton.addEventListener("click",toggleCameraMode);placeTopAction(cameraButton);

  brakeButton=document.createElement("button");
  brakeButton.type="button";
  brakeButton.textContent="BRAKE";
  brakeButton.title="Cancel all ship movement and turning immediately";
  Object.assign(brakeButton.style,{position:"relative",top:"auto",right:"auto",bottom:"auto",left:"auto",zIndex:"80",minWidth:"0",padding:"8px 10px",display:"none",color:"#e8f3e8",background:"rgba(29,48,43,.96)",border:"1px solid #83b79b",borderRadius:"5px",font:"bold 10px monospace",letterSpacing:".8px",touchAction:"manipulation",pointerEvents:"auto",flex:"0 1 auto"});
  brakeButton.addEventListener("click",brakeShip);
  placeTopAction(brakeButton);

  parkButton=document.createElement("button");
  parkButton.type="button";
  parkButton.textContent="PARK";
  parkButton.title="Hold the spacecraft at its current position and heading";
  Object.assign(parkButton.style,{position:"relative",top:"auto",right:"auto",bottom:"auto",left:"auto",zIndex:"80",minWidth:"0",padding:"8px 10px",display:"none",color:"#f5e4bd",background:"rgba(49,43,29,.96)",border:"1px solid #c5a96c",borderRadius:"5px",font:"bold 10px monospace",letterSpacing:".8px",touchAction:"manipulation",pointerEvents:"auto",flex:"0 1 auto"});
  parkButton.setAttribute("aria-pressed","false");
  parkButton.addEventListener("click",toggleShipPark);
  placeTopAction(parkButton);
  function styleEquipmentButton(button,borderColor){Object.assign(button.style,{position:"relative",top:"auto",right:"auto",bottom:"auto",left:"auto",minWidth:"0",maxWidth:"100%",padding:"8px 10px",margin:"0",color:"#eaf6ee",background:"rgba(20,35,39,.94)",border:"1px solid "+borderColor,borderRadius:"5px",font:"bold 10px monospace",letterSpacing:".5px",lineHeight:"1.15",flex:"0 1 auto",touchAction:"manipulation",pointerEvents:"auto"});}
  // Jetpack is always available; BOOST itself initiates takeoff and flight.
  boostButton=document.createElement("button");boostButton.type="button";boostButton.textContent="🚀";boostButton.setAttribute("aria-label","Hold to fly");boostButton.title="Hold to fly";styleEquipmentButton(boostButton,"#67c9d4");
  Object.assign(boostButton.style,{position:"absolute",right:"18px",bottom:"176px",zIndex:"63",width:"48px",height:"48px",minWidth:"48px",maxWidth:"48px",boxSizing:"border-box",display:"none",justifyContent:"center",alignItems:"center",padding:"0",fontSize:"25px",fontWeight:"normal",letterSpacing:"0",lineHeight:"1",borderWidth:"1.5px",borderRadius:"50%",background:"linear-gradient(180deg,rgba(26,83,91,.98),rgba(8,35,48,.98))",boxShadow:"0 2px 10px rgba(0,0,0,.38),inset 0 1px rgba(255,255,255,.12)",touchAction:"none",userSelect:"none",WebkitUserSelect:"none"});
  let boostHeld=false,boostPointerId=null;
  const boostStart=e=>{
    if(!onFoot||buggyMode||boostHeld)return;
    if(e&&e.cancelable)e.preventDefault();
    boostHeld=true;boostPointerId=e&&e.pointerId!==undefined?e.pointerId:null;
    if(e&&e.pointerId!==undefined&&boostButton.setPointerCapture)boostButton.setPointerCapture(e.pointerId);
    keys.space=true;explorerEquipment.thrusting=true;
    boostButton.style.filter="brightness(1.5)";
    boostButton.style.background="linear-gradient(180deg,rgba(53,143,151,.99),rgba(12,66,82,.99))";
    boostButton.textContent="🚀";
  };
  const boostEnd=e=>{
    // Only an active BOOST press may cancel its own release event.
    if(!boostHeld)return;
    if(e&&e.pointerId!==undefined&&boostPointerId!==null&&e.pointerId!==boostPointerId)return;
    if(e&&e.cancelable)e.preventDefault();
    boostHeld=false;boostPointerId=null;keys.space=false;
    boostButton.style.filter="none";
    boostButton.style.background="linear-gradient(180deg,rgba(26,83,91,.98),rgba(8,35,48,.98))";
    boostButton.textContent="🚀";
  };
  // Pointer Events cover touch, pen and mouse without double-firing
  // separate touchstart/mousedown handlers on modern mobile browsers.
  boostButton.addEventListener("pointerdown",boostStart,{passive:false});
  document.addEventListener("pointerup",boostEnd,{passive:false});
  document.addEventListener("pointercancel",boostEnd,{passive:false});
  window.addEventListener("blur",boostEnd);
  boostButton.addEventListener("lostpointercapture",boostEnd);
  root.appendChild(boostButton);
  function styleMobileActionCircle(button, borderColor, bgA, bgB) {
    Object.assign(button.style, {
      position: "absolute",
      zIndex: "86",
      width: "58px",
      height: "58px",
      minWidth: "58px",
      maxWidth: "58px",
      boxSizing: "border-box",
      display: "none",
      justifyContent: "center",
      alignItems: "center",
      padding: "0",
      margin: "0",
      borderRadius: "50%",
      border: "2px solid " + borderColor,
      background: "linear-gradient(180deg," + bgA + "," + bgB + ")",
      color: "#fff8e8",
      font: "28px/1 sans-serif",
      letterSpacing: "0",
      boxShadow: "0 2px 12px rgba(0,0,0,.45), inset 0 1px rgba(255,255,255,.14)",
      touchAction: "none",
      userSelect: "none",
      WebkitUserSelect: "none",
      WebkitTapHighlightColor: "transparent",
      pointerEvents: "auto"
    });
  }

  fireButton = document.createElement("button");
  fireButton.type = "button";
  fireButton.textContent = "🔫";
  fireButton.setAttribute("aria-label", "Fire ray gun");
  fireButton.title = "Ray gun (fire / dig)";
  styleMobileActionCircle(fireButton, "#e58b63", "rgba(120,48,28,.98)", "rgba(48,16,10,.98)");
  function fireTouchStart(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (e && e.pointerId !== undefined && fireButton.setPointerCapture) {
      try { fireButton.setPointerCapture(e.pointerId); } catch (_) {}
    }
    fireButton.style.filter = "brightness(1.45)";
    if(onFoot) fireRayGun(); else fireMiningLaser();
  }
  function fireTouchEnd(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    fireButton.style.filter = "none";
  }
  fireButton.addEventListener("pointerdown", fireTouchStart, { passive: false });
  fireButton.addEventListener("pointerup", fireTouchEnd, { passive: false });
  fireButton.addEventListener("pointercancel", fireTouchEnd, { passive: false });
  fireButton.addEventListener("lostpointercapture", fireTouchEnd);
  root.appendChild(fireButton);

  digButton = document.createElement("button");
  digButton.type = "button";
  digButton.textContent = "⛏️";
  digButton.setAttribute("aria-label", "Mine / dig");
  digButton.title = "Mine rock (same as ray dig) · long-press sells ore";
  styleMobileActionCircle(digButton, "#d4b24a", "rgba(90,70,18,.98)", "rgba(36,28,8,.98)");
  let digHoldTimer = null;
  function digTouchStart(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (e && e.pointerId !== undefined && digButton.setPointerCapture) {
      try { digButton.setPointerCapture(e.pointerId); } catch (_) {}
    }
    digButton.style.filter = "brightness(1.45)";
    if(onFoot) fireRayGun(); else fireMiningLaser();
    if (digHoldTimer) clearTimeout(digHoldTimer);
    digHoldTimer = setTimeout(() => {
      digHoldTimer = null;
      sellMinedOre();
    }, 650);
  }
  function digTouchEnd(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    digButton.style.filter = "none";
    if (digHoldTimer) { clearTimeout(digHoldTimer); digHoldTimer = null; }
  }
  digButton.addEventListener("pointerdown", digTouchStart, { passive: false });
  digButton.addEventListener("pointerup", digTouchEnd, { passive: false });
  digButton.addEventListener("pointercancel", digTouchEnd, { passive: false });
  digButton.addEventListener("lostpointercapture", digTouchEnd);
  root.appendChild(digButton);

  function isLandscapeMobile() {
    const w = window.innerWidth || 0;
    const h = window.innerHeight || 0;
    const touch = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    // Landscape if wider than tall, or short height typical of phones sideways
    return touch && (w > h || h < 520);
  }

  function applyMobileControlLayout() {
    const landscape = isLandscapeMobile();
    const thin = (window.innerHeight || 800) < 480;
    // Move stick — left side
    if (mobile) {
      mobile.style.left = landscape ? "12px" : "18px";
      mobile.style.bottom = landscape ? "12px" : "22px";
      const size = landscape ? (thin ? 120 : 136) : 148;
      mobile.style.width = size + "px";
      mobile.style.height = size + "px";
    }
    // Look pad — right side
    if (lookPad && !(onFoot && playerInSpaceFlight)) {
      lookPad.style.right = landscape ? "12px" : "18px";
      lookPad.style.bottom = landscape ? "12px" : "22px";
      if (landscape) {
        const ls = thin ? 112 : 128;
        lookPad.style.width = ls + "px";
        lookPad.style.height = ls + "px";
      }
    }
    // 🔫 and ⛏️ — bottom-center / above thumbs in landscape
    if (fireButton && digButton) {
      if (landscape) {
        // Sit above the right thumb area but left of look pad
        fireButton.style.right = thin ? "150px" : "170px";
        fireButton.style.bottom = "18px";
        digButton.style.right = thin ? "150px" : "170px";
        digButton.style.bottom = "84px";
        boostButton && (boostButton.style.right = thin ? "150px" : "170px");
        boostButton && (boostButton.style.bottom = "150px");
      } else {
        // Portrait: stacked left of look pad
        fireButton.style.right = "175px";
        fireButton.style.bottom = "22px";
        digButton.style.right = "175px";
        digButton.style.bottom = "90px";
        if (boostButton) {
          boostButton.style.right = "18px";
          boostButton.style.bottom = "175px";
        }
      }
    }
  }

  window.addEventListener("orientationchange", () => setTimeout(applyMobileControlLayout, 120));
  window.addEventListener("resize", () => applyMobileControlLayout());
  applyMobileControlLayout();

  equipmentReadout=document.createElement("div");Object.assign(equipmentReadout.style,{position:"absolute",left:"50%",bottom:"238px",transform:"translateX(-50%)",zIndex:"82",width:"min(520px,calc(100% - 24px))",boxSizing:"border-box",padding:"6px 9px",border:"1px solid rgba(104,205,215,.55)",borderRadius:"5px",background:"rgba(4,15,24,.82)",color:"#bcebf0",font:"9px/1.35 monospace",letterSpacing:".35px",whiteSpace:"normal",textAlign:"center",pointerEvents:"none",display:"none"});root.appendChild(equipmentReadout);
  aimReticle=document.createElement("div");aimReticle.textContent="＋";Object.assign(aimReticle.style,{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",zIndex:"84",color:"#b7f8e8",font:"bold 26px/1 monospace",textShadow:"0 0 5px #163e4b,0 0 12px #54d9cf",pointerEvents:"none",display:"none"});root.appendChild(aimReticle);

  // Spacecraft assistance is deliberately arcade-like: BRAKE cancels all
  // active translation/rotation input immediately; PARK additionally holds
  // the current world position and attitude until the player releases it.
  function clearShipControlInput() {
    for (const key of ["w","s","a","d","arrowup","arrowdown","arrowleft","arrowright"]) keys[key] = false;
    touchFlightYaw = touchFlightPitch = touchFlightThrust = touchFlightStrafe = 0;
    velocity.x = velocity.y = velocity.z = 0;
  }

  function brakeShip() {
    if (!ship || onFoot || buggyMode) return false;
    clearShipControlInput();
    if (shipParked) {
      parkedShipPosition = ship.position.clone();
      parkedShipQuaternion = ship.quaternion.clone();
    }
    setStatus(shipParked ? "PARK HOLD // CONTROLS BRAKED" : "BRAKES ENGAGED // SHIP STOPPED");
    return true;
  }

  function setShipParked(value) {
    if (!ship || buggyMode || (onFoot && value)) return false;
    shipParked = !!value;
    clearShipControlInput();
    if (shipParked) {
      parkedShipPosition = ship.position.clone();
      parkedShipQuaternion = ship.quaternion.clone();
      setStatus("PARK ENGAGED // POSITION AND HEADING HELD");
    } else {
      parkedShipPosition = null;
      parkedShipQuaternion = null;
      setStatus("PARK RELEASED // ARCADE FLIGHT CONTROLS");
    }
    if (parkButton) {
      parkButton.textContent = shipParked ? "UNPARK" : "PARK";
      parkButton.setAttribute("aria-pressed", shipParked ? "true" : "false");
    }
    return true;
  }

  function toggleShipPark() {
    setShipParked(!shipParked);
  }


  // ============================================================
  // UNIFIED CONTROL CHROME
  // Same physical pads everywhere; only labels + input mapping change.
  // ============================================================
  function syncControlChrome() {
    if (!mobile || !lookPad) return;

    // Always show both pads full size — never leave a collapsed ship/jetpack layout stuck
    mobile.style.display = "grid";
    mobile.style.gridTemplateColumns = "repeat(3, 44px)";
    mobile.style.gridTemplateRows = "repeat(3, 44px)";
    mobile.style.gap = "6px";
    mobile.style.width = "148px";
    mobile.style.height = "148px";
    mobile.style.left = "12px";
    mobile.style.bottom = "12px";
    mobile.style.opacity = "1";
    mobile.style.pointerEvents = "auto";

    for (const b of dpadButtons) {
      b.style.display = "";
      b.style.width = "44px";
      b.style.height = "44px";
      b.style.visibility = "visible";
    }

    lookPad.style.display = "grid";
    lookPad.style.gridTemplateColumns = "repeat(3, 40px)";
    lookPad.style.gridTemplateRows = "repeat(3, 40px)";
    lookPad.style.gap = "4px";
    lookPad.style.width = "142px";
    lookPad.style.height = "142px";
    lookPad.style.right = "12px";
    lookPad.style.bottom = "12px";
    lookPad.style.opacity = "1";
    lookPad.style.pointerEvents = "auto";
    for (const child of lookPad.children) {
      child.style.display = "";
    }
    if (recenterButton) {
      recenterButton.style.gridRow = "2";
      recenterButton.style.gridColumn = "2";
      recenterButton.style.display = "";
    }

    // Mode labels only — input routing already branches in applyDpadVector / look handlers
    if (buggyMode) {
      if (moveLabel) moveLabel.textContent = "DRIVE";
      if (lookPadLabel) lookPadLabel.textContent = "LOOK";
    } else if (!onFoot) {
      if (moveLabel) moveLabel.textContent = "STEER";
      if (lookPadLabel) lookPadLabel.textContent = "THRUST";
    } else if (playerInSpaceFlight || explorerEquipment.thrusting) {
      if (moveLabel) moveLabel.textContent = "STEER";
      if (lookPadLabel) lookPadLabel.textContent = "LOOK";
    } else {
      if (moveLabel) moveLabel.textContent = "MOVE";
      if (lookPadLabel) lookPadLabel.textContent = "LOOK";
    }

    // Action cluster: gun/dig/boost
    const foot = !!(onFoot && !buggyMode);
    const shipMode = !onFoot && !buggyMode && !!ship;
    if (boostButton) boostButton.style.display = foot ? "flex" : "none";
    if (fireButton) fireButton.style.display = (foot || shipMode) ? "flex" : "none";
    if (digButton) digButton.style.display = (foot || shipMode) ? "flex" : "none";

    try { applyMobileControlLayout(); } catch (_) {}
  }

  function updateEquipmentHUD(){
    syncControlChrome();
    const visible=!!(onFoot&&!buggyMode&&playerAvatar);
    const flying=visible&&playerInSpaceFlight;
    if(equipmentReadout&&visible&&!flying){
      equipmentReadout.style.display="block";
      equipmentReadout.textContent="RAY GUN  SHOTS "+explorerEquipment.shots+"  ORE "+explorerEquipment.oreMined+"  CR "+ranchGame.credits;
    }

    // BOOST is an optional on-foot control. It must not replace the
    // spacecraft translation pad or the normal on-foot camera/look pad.
    if(boostButton){
      boostButton.style.display=visible?"flex":"none";
      boostButton.style.width="52px";
      boostButton.style.minWidth="52px";
      boostButton.style.maxWidth="52px";
      boostButton.style.height="52px";
      boostButton.style.padding="0";
      boostButton.style.borderRadius="50%";
      boostButton.style.fontSize="25px";
      // position set by applyMobileControlLayout()
    }

    // lookPad / mobile layout owned by syncControlChrome()


    // The spacecraft view switch is available whenever the player is
    // aboard. On foot, the camera is controlled with the look pad.
    if(cameraButton)cameraButton.style.display=(!onFoot&&!buggyMode)?"block":"none";
    if(brakeButton)brakeButton.style.display=(!onFoot&&!buggyMode)?"block":"none";
    if(parkButton){
      parkButton.style.display=(!onFoot&&!buggyMode)?"block":"none";
      parkButton.textContent=shipParked?"UNPARK":"PARK";
      parkButton.setAttribute("aria-pressed",shipParked?"true":"false");
    }
    const inShip = !onFoot && !buggyMode && !!ship;
    if(fireButton){
      fireButton.style.display=(visible||inShip)?"flex":"none";
      fireButton.textContent="🔫";
    }
    if(digButton){
      digButton.style.display=(visible||inShip)?"flex":"none";
      digButton.textContent="⛏️";
    }
    if(aimReticle)aimReticle.style.display=(visible)?"block":"none";
    // equipmentReadout handled above for on-foot ore readout
    if(equipmentReadout && !(visible && !flying)){
      // leave on-foot readout; hide only when not applicable
      if(!visible) equipmentReadout.style.display="none";
    }
    try { applyMobileControlLayout(); } catch (_) {}

    navReadout.style.display = cameraMode === "first" ? "flex" : "none";
    hud.style.display = "none";

    if(visible){
      // Temporary notifications remain controlled by setStatus() and its timer.
      actionButtons.style.display="flex";
      // Keep the useful on-foot actions; hide the workshop and unrelated
      // interaction buttons until the player is back aboard.
      const contextualButtons=[habitatGateButton,ranchInteractButton,moonRxButton,sanchosButton,whizzDanceButton];
      for(const button of actionButtons.children){
        if(contextualButtons.includes(button)){if(playerInSpaceFlight||stationInteriorMode)button.style.display="none";continue;}
        button.style.display=(button===boardShipButton||button===homeButton||(button===buggyInteractButton&&buggyInteractButton.dataset.active==="1")||(button===maritimeInteractButton&&maritimeInteractButton.dataset.active==="1"))?"block":"none";
      }
      modeHint.style.display="none";
    }else{
      actionButtons.style.display="flex";
      for(const b of [habitatGateButton,ranchInteractButton,moonRxButton,sanchosButton,whizzDanceButton])if(b)b.style.display="none";
      // Navigation coordinates are a first-person instrument, not a
      // permanent overlay on the chase-camera view.
      navReadout.style.display = cameraMode === "first" ? "flex" : "none";
      // setStatus() owns notification visibility and its timeout. Never
      // force the notification panel back on from this per-frame updater.
    }
  }

  function createPracticeTargets(){if(!THREE||!scene||!playerAvatar||explorerEquipment.targets.length)return;[-8,0,8].forEach((side,index)=>{const p=playerAvatar.position.clone().addScaledVector(playerHeading,23+(index===1?5:0)).addScaledVector(playerRight,side);const surface=sampleSurface(p);const group=new THREE.Group();group.name="KR_PRACTICE_TARGET_"+(index+1);group.position.copy(surface.position).addScaledVector(surface.up,2.0);group.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),playerAvatar.position.clone().sub(group.position).normalize());const ringMat=new THREE.MeshStandardMaterial({color:0x54d8d0,emissive:0x14545a,emissiveIntensity:.8,metalness:.5,roughness:.28});const coreMat=new THREE.MeshStandardMaterial({color:0xf5c36d,emissive:0x8b4812,emissiveIntensity:.9,metalness:.35,roughness:.25});const ring=new THREE.Mesh(new THREE.TorusGeometry(1.12,.075,7,24),ringMat);const core=new THREE.Mesh(new THREE.SphereGeometry(.58,12,9),coreMat);const center=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),new THREE.MeshBasicMaterial({color:0xffffff}));group.add(ring,core,center);for(const mesh of [ring,core,center])mesh.userData.practiceTarget=group;group.userData={practiceTarget:true,hitUntil:0,coreMat,baseCore:0xf5c36d};scene.add(group);explorerEquipment.targets.push(group);});setStatus("RAY GUN RANGE READY // THREE PRACTICE TARGETS DEPLOYED");try{spawnPadMineAsteroid(true);}catch(e){console.warn(e);}}

  function spawnLaserBeam(muzzlePos, endPos, colorHex, life) {
    if (!THREE || !scene) return;
    const muzzle = muzzlePos.clone();
    const end = endPos.clone();
    let along = end.clone().sub(muzzle);
    let beamLen = along.length();
    if (!isFinite(beamLen) || beamLen < 2) {
      // Force a long visible tracer so walking shots never collapse to a blob
      along = new THREE.Vector3(0, 0, -1);
      if (camera) camera.getWorldDirection(along);
      if (along.lengthSq() < 1e-6) along.set(0, 0, -1);
      along.normalize();
      beamLen = 40;
      end.copy(muzzle).addScaledVector(along, beamLen);
    } else {
      along.multiplyScalar(1 / beamLen);
    }
    // Keep a readable minimum length on foot
    if (beamLen < 8) {
      beamLen = 8;
      end.copy(muzzle).addScaledVector(along, beamLen);
    }
    if (Math.abs(along.y) > 0.99) {
      along.x += 0.03;
      along.normalize();
    }

    const mid = muzzle.clone().lerp(end, 0.5);
    const beamGroup = new THREE.Group();
    beamGroup.name = "KR_LASER_BEAM";
    beamGroup.frustumCulled = false;
    beamGroup.renderOrder = 999;

    // depthTest:false so third-person avatar/props never eat the beam
    function mat(color, opacity) {
      const m = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: opacity,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      m.userDataBaseOpacity = opacity;
      return m;
    }

    // Thick tube — reads as a bolt, not a spark
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.08, beamLen, 10, 1, true),
      mat(0xffffff, 1)
    );
    const midCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.2, beamLen, 10, 1, true),
      mat(colorHex, 0.85)
    );
    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.4, beamLen, 12, 1, true),
      mat(colorHex, 0.35)
    );
    for (const m of [core, midCyl, glow]) {
      m.frustumCulled = false;
      m.renderOrder = 999;
      beamGroup.add(m);
    }
    beamGroup.position.copy(mid);
    beamGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), along);

    // Extra hard streak using a line (always reads in profile)
    const lineGeo = new THREE.BufferGeometry().setFromPoints([muzzle.clone(), end.clone()]);
    const lineMat = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
      linewidth: 2
    });
    lineMat.userDataBaseOpacity = 1;
    const line = new THREE.Line(lineGeo, lineMat);
    line.frustumCulled = false;
    line.renderOrder = 1000;
    scene.add(line);

    // Impact spark (smaller — the beam is the star)
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 10, 8),
      mat(colorHex, 1)
    );
    spark.position.copy(end);
    spark.frustumCulled = false;
    spark.renderOrder = 1000;

    // Muzzle flash
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 8, 6),
      mat(0xffffff, 1)
    );
    flash.position.copy(muzzle);
    flash.frustumCulled = false;
    flash.renderOrder = 1000;

    scene.add(beamGroup);
    scene.add(spark);
    scene.add(flash);
    explorerEquipment.beams.push({
      object: beamGroup,
      spark,
      flash,
      line,
      life: life || 0.65,
      maxLife: life || 0.65
    });
  }

  function fireRayGun(){
    if(!onFoot||buggyMode||!playerAvatar||!camera||!THREE){
      setStatus("RAY GUN // MUST BE ON FOOT");
      return;
    }
    const ray=new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0,0),camera);
    ray.far=120;
    // Third-person: prefer aim from chest along camera forward so beam matches reticle
    const camDir=new THREE.Vector3();
    camera.getWorldDirection(camDir);
    camDir.normalize();
    const chest=playerAvatar.position.clone().addScaledVector(playerUp||new THREE.Vector3(0,1,0),1.35);
    let origin=chest.clone();
    let direction=camDir.clone();
    // If first-person, use true camera ray
    if(cameraMode==="first"){
      origin=ray.ray.origin.clone();
      direction=ray.ray.direction.clone().normalize();
    } else {
      ray.set(origin, direction);
      ray.far=120;
    }

    const meshes=[];
    for(const t of explorerEquipment.targets)if(t&&t.visible)t.traverse(o=>{if(o.isMesh)meshes.push(o);});
    if(lunaMineRoot){
      lunaMineRoot.traverse(o=>{ if(o.isMesh && o.userData.mineRock && o.userData.hp>0) meshes.push(o); });
    }
    // Also try a few nearby scene meshes for impact feedback (props)
    const hits=meshes.length?ray.intersectObjects(meshes,false):[];
    const targetHit=hits.length?hits[0]:null;
    let end=origin.clone().addScaledVector(direction,80);
    let hitColor=0x5ef6ff;
    let msg="RAY FIRED // NO HIT";

    if(targetHit && targetHit.object.userData.mineRock){
      end=targetHit.point.clone();
      const rock=targetHit.object;
      rock.userData.hp=(rock.userData.hp||1)-1;
      explorerEquipment.hits++;
      explorerEquipment.oreMined += rock.userData.ore ? 2 : 1;
      const ratio=Math.max(0.15, rock.userData.hp/Math.max(1,rock.userData.maxHp||3));
      rock.scale.setScalar(ratio);
      if(rock.material&&rock.material.emissive){
        rock.material.emissive.setHex(0xff6622);
        rock.material.emissiveIntensity=0.9;
      }
      if(rock.userData.hp<=0){ rock.visible=false; rock.userData.mineRock=false; }
      hitColor=0xffb040;
      msg="MINED // ORE "+explorerEquipment.oreMined+" // HOLD ⛏️ OR B TO SELL";
    } else if(targetHit){
      end=targetHit.point.clone();
      const target=targetHit.object.userData.practiceTarget;
      if(target){
        explorerEquipment.hits++;
        target.userData.hitUntil=performance.now()+700;
        if(target.userData.coreMat){
          target.userData.coreMat.color.setHex(0xff754f);
          target.userData.coreMat.emissive.setHex(0xd52a12);
        }
        hitColor=0xffaa66;
        msg="TARGET HIT // "+explorerEquipment.hits+" HITS";
      } else {
        hitColor=0x9affc8;
        msg="IMPACT";
      }
    } else if(voxelWorld){
      const vhit=voxelWorld.raycast(origin,direction,70);
      if(vhit&&vhit.hit){
        end=vhit.point.clone();
        const mined=voxelWorld.digAt(vhit.voxel.vx,vhit.voxel.vy,vhit.voxel.vz,2);
        if(mined>0){
          explorerEquipment.hits++;
          hitColor=0xffb040;
          msg="VOXEL DIG // +"+mined+" // ORE "+explorerEquipment.oreMined;
        } else {
          hitColor=0xffdd88;
          msg="RAY IMPACT // ROCK";
        }
      }
    }

    // Start the *visible* beam clearly in front of the explorer so third-person
    // shots read as a bolt, not a ball glued to the body.
    let muzzlePos = chest.clone().addScaledVector(direction, 1.2);
    try {
      if (explorerEquipment.muzzle) {
        const mw = explorerEquipment.muzzle.getWorldPosition(new THREE.Vector3());
        // Prefer the gun tip when it is ahead of the chest along the aim vector
        if (mw.clone().sub(chest).dot(direction) > 0.1) {
          muzzlePos = mw.addScaledVector(direction, 0.35);
        }
      }
    } catch (_) {}
    // Guarantee a long tracer toward the aim point / sky
    if (muzzlePos.distanceTo(end) < 12) {
      end.copy(muzzlePos).addScaledVector(direction, 45);
    }
    spawnLaserBeam(muzzlePos, end, hitColor, 0.7);
    explorerEquipment.shots++;
    if(explorerEquipment.gun&&explorerEquipment.gun.userData.muzzleGlow){
      explorerEquipment.gun.userData.muzzleGlow.intensity=5;
    }
    setStatus(msg);
    updateEquipmentHUD();
  }

  function updateEquipment(delta,time){
  for(let i=explorerEquipment.beams.length-1;i>=0;i--){
    const b=explorerEquipment.beams[i];
    b.life-=delta;
    const t=Math.max(0,b.life/Math.max(0.001,b.maxLife));
    const fade=(obj)=>{
      if(!obj)return;
      if(obj.material){
        const base = obj.material.opacity !== undefined ? Math.min(1, obj.material.userDataBaseOpacity || obj.material.opacity) : 1;
        if(obj.material.userDataBaseOpacity === undefined) obj.material.userDataBaseOpacity = obj.material.opacity;
        obj.material.opacity = t * obj.material.userDataBaseOpacity;
      }
      if(obj.children)obj.children.forEach(fade);
    };
    fade(b.object);
    if(b.spark&&b.spark.material)b.spark.material.opacity=t*(b.spark.material.userDataBaseOpacity||1);
    if(b.flash&&b.flash.material)b.flash.material.opacity=t*(b.flash.material.userDataBaseOpacity||1);
    if(b.line&&b.line.material)b.line.material.opacity=t*(b.line.material.userDataBaseOpacity||1);
    if(b.life<=0){
      const disposeObj=(obj)=>{
        if(!obj)return;
        if(obj.parent)obj.parent.remove(obj);
        if(obj.traverse){
          obj.traverse(o=>{
            if(o.geometry)o.geometry.dispose();
            if(o.material){
              const ms=Array.isArray(o.material)?o.material:[o.material];
              ms.forEach(m=>m.dispose&&m.dispose());
            }
          });
        } else {
          if(obj.geometry)obj.geometry.dispose();
          if(obj.material)obj.material.dispose();
        }
      };
      disposeObj(b.object);
      disposeObj(b.spark);
      disposeObj(b.flash);
      disposeObj(b.line);
      explorerEquipment.beams.splice(i,1);
    }
  }
const active=!!(onFoot&&!buggyMode&&keys.space);explorerEquipment.thrusting=active;if(explorerEquipment.gun&&explorerEquipment.gun.userData.muzzleGlow)explorerEquipment.gun.userData.muzzleGlow.intensity=explorerEquipment.beams.length?2:0;if(playerAvatar&&playerAvatar.userData.jetpackFlames)for(const flame of playerAvatar.userData.jetpackFlames){flame.visible=active;if(active)flame.scale.y=.88+Math.sin(time*.045)*.12;}for(const t of explorerEquipment.targets)if(t.userData.hitUntil&&performance.now()>t.userData.hitUntil){t.userData.hitUntil=0;t.userData.coreMat.color.setHex(t.userData.baseCore);t.userData.coreMat.emissive.setHex(0x8b4812);}updateEquipmentHUD();}
  function recenterCamera(){cameraYaw=0;cameraPitch=0.32;flightCameraYaw=0;flightCameraPitch=0.18;lookInputX=lookInputY=0;touchFlightYaw=touchFlightPitch=touchFlightThrust=touchFlightStrafe=0;}
  function toggleCameraMode(){
    if (!onFoot && (!ship || buggyMode)) return;
    cameraMode = cameraMode === "third" ? "first" : "third";
    if (playerAvatar) playerAvatar.visible = onFoot && !buggyMode && cameraMode === "third";
    if (cameraButton) {
      cameraButton.textContent = onFoot
        ? (cameraMode === "first" ? "CAMERA: THIRD PERSON" : "CAMERA: FIRST PERSON")
        : (cameraMode === "first" ? "VIEW: CHASE" : "VIEW: COCKPIT");
    }
    const label = cameraMode === "first"
      ? (onFoot ? "FIRST-PERSON EXPLORATION" : "COCKPIT VIEW")
      : (onFoot ? "THIRD-PERSON EXPLORATION" : "STABILIZED CHASE VIEW");
    setStatus(label);
    updateEquipmentHUD();
  }

  // ============================================================
  // KEYBOARD CONTROLS
  // ============================================================

  function isTyping() {
    const element = document.activeElement;

    return element && (
      element.tagName === "INPUT" ||
      element.tagName === "TEXTAREA" ||
      element.isContentEditable
    );
  }

  function keyDown(event) {
    if (isTyping()) return;

    const key = event.key.toLowerCase();

    if (key === "h") {
      returnHome(); event.preventDefault(); return;
    }
    if (key === "f") { toggleBuggy(); event.preventDefault(); return; }

    if (key === "x" && !buggyMode && !event.repeat) { if(onFoot) fireRayGun(); else fireMiningLaser(); event.preventDefault(); return; }
    if (key === "b" && onFoot && !event.repeat) { sellMinedOre(); event.preventDefault(); return; }
    if (key === "g") { openWildlifeHabitat(); event.preventDefault(); return; }
    if (key === "v" && (onFoot || (!buggyMode && ship))) { toggleCameraMode(); event.preventDefault(); return; }
    if (key === " " && onFoot && !buggyMode) { keys.space = true; event.preventDefault(); return; }

    if (
      "wasdqer".includes(key) ||
      key === "arrowup" ||
      key === "arrowdown" ||
      key === "arrowleft" ||
      key === "arrowright"
    ) {
      keys[key] = true;
      event.preventDefault();
    }
  }

  function keyUp(event) {
    if(event.key===" ")keys.space=false;
    else keys[event.key.toLowerCase()] = false;
  }

  function clearKeys() {
    Object.keys(keys).forEach(key => {
      keys[key] = false;
    });
  }

  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);
  window.addEventListener("blur", clearKeys);
  window.addEventListener("blur", releaseMoveStick);

  cleanup.push(() => {
    document.removeEventListener("keydown", keyDown);
    document.removeEventListener("keyup", keyUp);
    window.removeEventListener("blur", clearKeys);
    window.removeEventListener("blur", releaseMoveStick);
    document.removeEventListener("pointerup", boostEnd);
    document.removeEventListener("pointercancel", boostEnd);
    window.removeEventListener("blur", boostEnd);
  });

  // ============================================================
  // LOAD THREE.JS
  //
  // IMPORTANT:
  // Use the ES module build, not the old three.min.js file.
  // ============================================================

  async function loadThree() {
    const sources = [
      "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
      "https://unpkg.com/three@0.160.0/build/three.module.js",
      "https://esm.sh/three@0.160.0"
    ];
    const failures = [];
    for (let i = 0; i < sources.length; i++) {
      try {
        setStatus("LOADING THREE.JS // SOURCE " + (i + 1) + " OF " + sources.length);
        const module = await import(sources[i]);
        if (!module || !module.WebGLRenderer || !module.Scene) {
          throw new Error("Module did not expose the expected Three.js API.");
        }
        console.info("[Kepler Reach] Three.js loaded from", sources[i]);
        return module;
      } catch (error) {
        failures.push(sources[i] + " -> " + (error && error.message ? error.message : String(error)));
        console.warn("[Kepler Reach] Three.js source failed:", failures[failures.length - 1]);
      }
    }
    throw new Error("THREE.JS COULD NOT LOAD. Check CDN access / browser console. " + failures.join(" | "));
  }

  // ============================================================
  // MODULAR MODEL SYSTEM
  //
  // GLB/glTF assets are opt-in and loaded only when requested through
  // the public API. The loader is version-matched to Three.js r160.
  // Current procedural ships, rover and avatar remain untouched.
  // ============================================================

  async function getGLTFLoader() {
    if (!modularModels.loaderPromise) {
      modularModels.loaderPromise = (async () => {
        const module = await import(
          "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js?deps=three@0.160.0"
        );
        if (!module || typeof module.GLTFLoader !== "function") {
          throw new Error("Three.js r160 GLTFLoader module is unavailable.");
        }
        return new module.GLTFLoader();
      })().catch(error => {
        modularModels.loaderPromise = null;
        throw error;
      });
    }
    return modularModels.loaderPromise;
  }

  function validModelId(value) {
    return typeof value === "string" &&
      /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,79}$/.test(value);
  }

  function registerModularModel(id, specification) {
    if (!validModelId(id)) {
      throw new Error("Model ID must be 1-80 safe identifier characters.");
    }
    if (!specification || typeof specification !== "object") {
      throw new Error("A model specification is required.");
    }
    const url = String(specification.url || "");
    let parsed;
    try { parsed = new URL(url, window.location.href); }
    catch (_) { throw new Error("Model URL is invalid."); }
    if (parsed.protocol !== "https:") {
      throw new Error("External model assets must use HTTPS.");
    }
    const targetSize = Number(specification.targetSize || 1);
    if (!Number.isFinite(targetSize) || targetSize <= 0 || targetSize > 10000) {
      throw new Error("targetSize must be a positive value no greater than 10000.");
    }
    const record = Object.freeze({
      id,
      url: parsed.href,
      targetSize,
      center: specification.center !== false,
      rotation: Array.isArray(specification.rotation)
        ? specification.rotation.slice(0, 3).map(Number)
        : [0, 0, 0],
      license: String(specification.license || "unspecified").slice(0, 160),
      attribution: String(specification.attribution || "").slice(0, 240)
    });
    if (record.rotation.some(value => !Number.isFinite(value))) {
      throw new Error("Model rotation must contain finite radians.");
    }
    modularModels.registry.set(id, record);
    return { id, url: record.url, targetSize, registered: true };
  }

  function normalizeModularModel(source, specification) {
    const wrapper = new THREE.Group();
    wrapper.name = "KR_MODEL_" + specification.id;
    wrapper.userData.keplerReachModel = {
      id: specification.id,
      url: specification.url,
      license: specification.license,
      attribution: specification.attribution
    };

    source.name = source.name || specification.id + "_CONTENT";
    wrapper.add(source);

    // Compute dimensions in world space before applying the target scale.
    source.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(source);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);
    const largest = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(largest) || largest < 1e-6) {
      throw new Error("Model has no usable visible geometry.");
    }

    const scale = specification.targetSize / largest;
    source.scale.multiplyScalar(scale);
    if (specification.center) {
      source.position.x -= center.x * scale;
      source.position.y -= center.y * scale;
      source.position.z -= center.z * scale;
    }
    source.rotation.x += specification.rotation[0];
    source.rotation.y += specification.rotation[1];
    source.rotation.z += specification.rotation[2];
    source.updateMatrixWorld(true);

    wrapper.userData.normalization = {
      sourceSize: { x: size.x, y: size.y, z: size.z },
      appliedScale: scale,
      targetLargestDimension: specification.targetSize,
      centered: specification.center
    };
    modularModels.instances.add(wrapper);
    return wrapper;
  }

  async function loadModularModel(id, options = {}) {
    const specification = modularModels.registry.get(String(id));
    if (!specification) throw new Error("Unknown modular model: " + id);
    if (destroyed || !THREE) throw new Error("Kepler Reach is not ready.");

    try {
      const loader = await getGLTFLoader();
      const gltf = await loader.loadAsync(specification.url);
      if (destroyed) throw new Error("Kepler Reach was closed during model loading.");
      if (!gltf || !gltf.scene) throw new Error("GLB/glTF file contains no scene.");
      const object = normalizeModularModel(gltf.scene, specification);
      object.userData.animations = Array.isArray(gltf.animations) ? gltf.animations : [];
      if (options.parent && typeof options.parent.add === "function") {
        options.parent.add(object);
      }
      return {
        id: specification.id,
        object,
        animations: object.userData.animations.slice(),
        source: "gltf",
        fallback: false
      };
    } catch (error) {
      console.warn("[Kepler Reach] Modular model load failed:", id, error);
      let fallback = null;
      if (typeof options.fallbackFactory === "function") {
        try {
          fallback = options.fallbackFactory(THREE);
          if (fallback && options.parent && typeof options.parent.add === "function") {
            options.parent.add(fallback);
          }
        } catch (fallbackError) {
          console.error("[Kepler Reach] Procedural model fallback failed:", fallbackError);
        }
      }
      if (fallback) {
        return {
          id: specification.id,
          object: fallback,
          animations: [],
          source: "procedural-fallback",
          fallback: true,
          error: String(error && error.message ? error.message : error)
        };
      }
      throw error;
    }
  }

  function createModelSocket(host, name, transform = {}) {
    if (!host || typeof host.add !== "function") {
      throw new Error("A Three.js Object3D host is required.");
    }
    if (!validModelId(name)) throw new Error("Socket name is invalid.");
    if (!host.userData) host.userData = {};
    if (!host.userData.krSockets) host.userData.krSockets = {};
    if (host.userData.krSockets[name]) return host.userData.krSockets[name];

    const socket = new THREE.Group();
    socket.name = "KR_SOCKET_" + name;
    const position = Array.isArray(transform.position) ? transform.position : [0, 0, 0];
    const rotation = Array.isArray(transform.rotation) ? transform.rotation : [0, 0, 0];
    const scale = Array.isArray(transform.scale) ? transform.scale : [1, 1, 1];
    if (![...position, ...rotation, ...scale].every(Number.isFinite)) {
      throw new Error("Socket transform values must be finite numbers.");
    }
    socket.position.set(position[0] || 0, position[1] || 0, position[2] || 0);
    socket.rotation.set(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
    socket.scale.set(scale[0] ?? 1, scale[1] ?? 1, scale[2] ?? 1);
    socket.userData.socketName = name;
    host.userData.krSockets[name] = socket;
    host.add(socket);
    return socket;
  }

  function attachModelModule(host, socketName, moduleObject) {
    if (!moduleObject || typeof moduleObject !== "object" ||
        typeof moduleObject.traverse !== "function") {
      throw new Error("A Three.js Object3D module is required.");
    }
    const sockets = host && host.userData && host.userData.krSockets;
    const socket = sockets && sockets[socketName];
    if (!socket) throw new Error("Unknown attachment socket: " + socketName);
    socket.add(moduleObject);
    return moduleObject;
  }

  function listModularModels() {
    return Array.from(modularModels.registry.values()).map(model => ({
      id: model.id,
      url: model.url,
      targetSize: model.targetSize,
      license: model.license,
      attribution: model.attribution
    }));
  }

  // ============================================================
  // GEOMETRY HELPERS
  // ============================================================

  function makeMaterial(color, options = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true,
      ...options
    });
  }

  function makeBox(w, h, d, color) {
    return new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      makeMaterial(color)
    );
  }

  // ============================================================
  // PROCEDURAL SURFACE SETTLEMENTS
  // Instanced voxel-like structures keep draw calls low.
  // ============================================================

  function createSurfaceSettlements(world) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.12,
      vertexColors: true,
      flatShading: true
    });
    const mesh = new THREE.InstancedMesh(
      geometry,
      material,
      CONFIG.settlementCount
    );
    const dummy = new THREE.Object3D();
    const normal = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const color = new THREE.Color();
    const palette = [0xe58b63, 0x62b9a9, 0xb58acb, 0xe3c46c, 0x6f9ed0, 0xf0d8b0];

    for (let i = 0; i < CONFIG.settlementCount; i++) {
      // Keep settlements in broad clusters rather than a uniform grid.
      const cluster = i % 7;
      const clusterLongitude = cluster * (Math.PI * 2 / 7);
      const longitude = clusterLongitude + (random() - 0.5) * 0.48;
      const latitude = (random() - 0.5) * 1.45;

      normal.set(
        Math.cos(latitude) * Math.cos(longitude),
        Math.sin(latitude),
        Math.cos(latitude) * Math.sin(longitude)
      ).normalize();

      const height = 0.7 + random() * 3.8;
      const width = 0.65 + random() * 1.45;
      const depth = 0.65 + random() * 1.45;
      const ground = terrainProfile(normal.x, normal.y, normal.z).elevation;

      dummy.position.copy(normal).multiplyScalar(
        CONFIG.planetRadius + ground + height * 0.48
      );
      dummy.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        normal
      );
      dummy.scale.set(width, height, depth);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      color.setHex(palette[Math.floor(random() * palette.length)]);
      color.multiplyScalar(0.82 + random() * 0.35);
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    world.add(mesh);
  }

  // ============================================================
  // PROCEDURAL PLANET TERRAIN
  // ============================================================

  function terrainNoise(x, y, z) {
    const a = Math.sin(x * 9.1 + y * 4.3 + z * 7.2);
    const b = Math.sin(x * 21.7 - y * 13.1 + z * 17.3);
    const c = Math.sin(x * 43.2 + y * 31.4 - z * 27.1);
    return a * 0.55 + b * 0.28 + c * 0.17;
  }

  // Continental forms, eroded lowlands and ridged mountain chains.
  // Shared with surface placement so structures follow the terrain.
  function terrainProfile(x, y, z) {
    const continents = terrainNoise(x * 0.72 + 2.1, y * 0.72 - 1.4, z * 0.72 + 3.7);
    const broad = terrainNoise(x * 1.02 - 1.8, y * 1.02 + 2.6, z * 1.02 - 0.9);
    const detail = terrainNoise(x * 2.15 - 4.2, y * 2.15 + 1.7, z * 2.15 - 2.3);
    const ridgeField = terrainNoise(x * 1.22 + 8.4, y * 1.22 - 5.1, z * 1.22 + 0.8);
    const ridges = Math.pow(Math.max(0, (0.78 - Math.abs(ridgeField)) / 0.78), 2.4);
    let land = continents > -0.12;
    let elevation = land ? 1.25 + continents * 2.45 + broad * 1.75 + detail * 0.58 + ridges * 2.8 : -3.0 + broad * 0.34 + detail * 0.16;
    const portLat=0.02,portLon=1.75,portX=Math.cos(portLat)*Math.cos(portLon),portY=Math.sin(portLat),portZ=Math.cos(portLat)*Math.sin(portLon);
    const portDistance=Math.acos(THREE.MathUtils.clamp(x*portX+y*portY+z*portZ,-1,1))*CONFIG.planetRadius;
    const portBasin=1-THREE.MathUtils.smoothstep(portDistance,72,104);
    if(portBasin>0.001){land=false;elevation=THREE.MathUtils.lerp(elevation,-5.4,portBasin);}
    const hc=terrainProfile._c||(terrainProfile._c=(()=>{const tan=new THREE.Vector3(0,0,-1).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(portX,portY,portZ).normalize())).normalize(),a=92/CONFIG.planetRadius;return {sx:portX*Math.cos(a)+tan.x*Math.sin(a),sy:portY*Math.cos(a)+tan.y*Math.sin(a),sz:portZ*Math.cos(a)+tan.z*Math.sin(a)};})());
    const shoreX=hc.sx,shoreY=hc.sy,shoreZ=hc.sz;
    const shoreDistance=Math.acos(THREE.MathUtils.clamp(x*shoreX+y*shoreY+z*shoreZ,-1,1))*CONFIG.planetRadius;
    const shoreIsland=1-THREE.MathUtils.smoothstep(shoreDistance,17,31);
    if(shoreIsland>0.001){land=true;elevation=THREE.MathUtils.lerp(elevation,2.1,shoreIsland);}
    const anchorLon=0.08,anchorLat=0.12;
    const ax=Math.cos(anchorLat)*Math.cos(anchorLon),ay=Math.sin(anchorLat),az=Math.cos(anchorLat)*Math.sin(anchorLon);
    const distance=Math.acos(THREE.MathUtils.clamp(x*ax+y*ay+z*az,-1,1))*CONFIG.planetRadius;
    const blend=THREE.MathUtils.smoothstep(distance,105,130);
    elevation=THREE.MathUtils.lerp(2.8,elevation,blend);
    if(distance<130)land=true;
    return { continents, broad, detail, ridges, land, elevation };
  }

  // Independent, open Luna test terrain: low rolling relief and shallow basins.
  function moonTerrainProfile(x, y, z) {
    // Broad plains, six large shallow craters and soft rims. The lunar
    // test range intentionally has no high-frequency ridge noise.
    const broad=terrainNoise(x*0.58+13.2,y*0.58-6.4,z*0.58+2.8);
    const rolling=terrainNoise(x*1.05-8.7,y*1.05+4.2,z*1.05-11.5);
    const fine=terrainNoise(x*1.8+2.1,y*1.8-9.3,z*1.8+5.4);
    const craters=[
      [0.94,0.20,0.28,10.5,1.75],[-0.42,0.72,0.55,8.5,1.35],
      [0.12,-0.58,0.80,11.5,1.90],[-0.82,-0.18,0.53,7.5,1.25],
      [0.48,0.78,-0.40,9.0,1.45],[-0.22,0.12,-0.97,8.0,1.30]
    ];
    let crater=0,rim=0;
    for(const c of craters){
      const len=Math.hypot(c[0],c[1],c[2]);
      const dot=THREE.MathUtils.clamp((x*c[0]+y*c[1]+z*c[2])/len,-1,1);
      const t=Math.acos(dot)*CONFIG.moonRadius/c[3];
      if(t<1)crater+=c[4]*Math.pow(1-t*t,2);
      rim+=0.20*Math.exp(-Math.pow((t-1.02)/0.17,2));
    }
    const elevation=broad*0.18+rolling*0.065+fine*0.012-crater+rim;
    return {broad,rolling,fine,crater,elevation,land:true};
  }
  function createLandingSite(world) {
    const latitude = 0.12;
    const longitude = 0.08 - 100 / (CONFIG.planetRadius * Math.cos(latitude));
    const normal = new THREE.Vector3(
      Math.cos(latitude) * Math.cos(longitude),
      Math.sin(latitude),
      Math.cos(latitude) * Math.sin(longitude)
    ).normalize();
    const ground = terrainProfile(normal.x, normal.y, normal.z).elevation;
    const site = new THREE.Group();
    site.position.copy(normal).multiplyScalar(CONFIG.planetRadius + ground + 0.35);
    site.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

    const deck=new THREE.Mesh(new THREE.BoxGeometry(82,.75,68),makeMaterial(0x53636a,{metalness:.38,roughness:.82}));deck.position.y=-.18;site.add(deck);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(9.5,9.5,.65,12),makeMaterial(0x667b82,{metalness:.48,roughness:.72}));site.add(pad);
    const padPaint=new THREE.MeshBasicMaterial({color:0x9bdde0});
    for(const x of [-25,25]){
      const secondary=new THREE.Mesh(new THREE.CylinderGeometry(9,9,.62,12),makeMaterial(0x667b82,{metalness:.48,roughness:.72}));secondary.position.set(x,.04,0);site.add(secondary);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(7.8,.16,5,32),padPaint);ring.rotation.x=Math.PI/2;ring.position.set(x,.42,0);site.add(ring);
      for(let i=0;i<8;i++){const a=i*Math.PI/4;const light=new THREE.Mesh(new THREE.SphereGeometry(.24,6,5),new THREE.MeshBasicMaterial({color:0xffd18b}));light.position.set(x+Math.cos(a)*9.8,.5,Math.sin(a)*9.8);site.add(light);}
    }
    const terminalMat=makeMaterial(0x8b9b9b,{metalness:.28,roughness:.7}),terminalGlass=new THREE.MeshStandardMaterial({color:0x79c8d1,emissive:0x17454b,emissiveIntensity:.25,metalness:.4,roughness:.2});
    const terminal=new THREE.Mesh(new THREE.BoxGeometry(25,7,12),terminalMat);terminal.userData.krSolidCollider=true;terminal.position.set(0,3.35,-25);site.add(terminal);
    const terminalWindows=new THREE.Mesh(new THREE.BoxGeometry(22,3.2,.16),terminalGlass);terminalWindows.position.set(0,4.2,-18.9);site.add(terminalWindows);
    const portControlTower=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.8,13,7),terminalMat);portControlTower.userData.krSolidCollider=true;portControlTower.position.set(15,6.5,-26);site.add(portControlTower);
    const towerCab=new THREE.Mesh(new THREE.BoxGeometry(5,3,5),terminalGlass);towerCab.position.set(15,12,-26);site.add(towerCab);
    const towerLight=new THREE.PointLight(0xffc77d,1.7,32);towerLight.position.set(15,14,-26);site.add(towerLight);
    for(let z=-30;z<=30;z+=10){const stripe=new THREE.Mesh(new THREE.BoxGeometry(1,.05,4),padPaint);stripe.position.set(0,.24,z);site.add(stripe);}

    const padCore = new THREE.Mesh(
      new THREE.CylinderGeometry(5.8, 5.8, 0.68, 12),
      new THREE.MeshBasicMaterial({ color: 0xb59a69 })
    );
    site.add(padCore);

    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.8, 7, 6),
      makeMaterial(0x7f8d91, { metalness: 0.55 })
    );
    tower.position.set(6.2, 3.5, -5.8);
    site.add(tower);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffbd70 })
    );
    beacon.position.set(6.2, 7.5, -5.8);
    site.add(beacon);

    const mastLight = new THREE.PointLight(0xffb86a, 2.2, 24);
    mastLight.position.copy(beacon.position);
    site.add(mastLight);
    world.add(site);
  }


  // ============================================================
  // HAVEN SETTLEMENT DISTRICT // v0.3.08
  // Seeded architectural language, surface-following props,
  // pedestrian walkways, settlement gate and outdoor cinema.
  // ============================================================

  function createHavenSettlement(world) {
    const anchorLon = 0.08;
    const anchorLat = 0.12;
    const up = new THREE.Vector3(
      Math.cos(anchorLat) * Math.cos(anchorLon),
      Math.sin(anchorLat),
      Math.cos(anchorLat) * Math.sin(anchorLon)
    ).normalize();
    const east = new THREE.Vector3(0, 1, 0).cross(up).normalize();
    const north = up.clone().cross(east).normalize();
    havenEast = east.clone();
    havenNorth = north.clone();
    havenUp = up.clone();
    const district = new THREE.Group();
    world.add(district);

    // Stable planet identity. Future flora/fauna generators can use
    // independent streams derived from this value without changing
    // the existing terrain or settlement random sequence.
    const ecologySeed = (CONFIG.seed ^ 0x48415645) >>> 0;
    function ecologyRandom(stream) {
      let state = (ecologySeed ^ stream) >>> 0;
      return function () {
        state = (state + 0x6D2B79F5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const plantRandom = ecologyRandom(0x504c414e);
    const propRandom = ecologyRandom(0x50524f50);
    const floraRandom = ecologyRandom(0x464c4f52);
    const faunaRandom = ecologyRandom(0x4641554e);
    ambientFauna.length = 0;
    faunaReleased = false; faunaReleaseTime = 0; habitatGateOpen = false; habitatGateLeaves.length = 0;

    const mat = {
      path: makeMaterial(0xd7c7a3, { roughness: 0.94, metalness: 0.02 }),
      pathEdge: makeMaterial(0x4b8588, { roughness: 0.8, metalness: 0.16 }),
      coral: makeMaterial(0xe87965, { roughness: 0.78 }),
      turquoise: makeMaterial(0x42b9b0, { roughness: 0.62, metalness: 0.12 }),
      lilac: makeMaterial(0xa58bc7, { roughness: 0.76 }),
      cream: makeMaterial(0xf0d9a5, { roughness: 0.8 }),
      dark: makeMaterial(0x34434a, { roughness: 0.9 }),
      glass: new THREE.MeshStandardMaterial({
        color: 0x8ce5dc, emissive: 0x286f75, emissiveIntensity: 0.34,
        metalness: 0.35, roughness: 0.24, transparent: true, opacity: 0.86
      }),
      neonPink: new THREE.MeshBasicMaterial({ color: 0xff6b9c }),
      neonMint: new THREE.MeshBasicMaterial({ color: 0x7dffd1 }),
      leaf: [0x70c98b, 0x9bd46f, 0x55bcb0, 0xd18b9b].map(c =>
        makeMaterial(c, { roughness: 0.96 })
      )
    };

    const upAxis = new THREE.Vector3(0, 1, 0);
    function surfaceFrame(x, z, heightOffset = 0) {
      const offset = east.clone().multiplyScalar(x).addScaledVector(north, z);
      const normal = up.clone().addScaledVector(offset, 1 / CONFIG.planetRadius).normalize();
      const ground = terrainProfile(normal.x, normal.y, normal.z).elevation;
      const position = normal.clone().multiplyScalar(
        CONFIG.planetRadius + ground + heightOffset
      );
      const q = new THREE.Quaternion().setFromUnitVectors(upAxis, normal);
      return { position, normal, q };
    }
    function place(mesh, x, z, y = 0, yaw = 0) {
      const frame = surfaceFrame(x, z, y);
      mesh.position.copy(frame.position);
      mesh.quaternion.copy(frame.q);
      if (yaw) mesh.rotateY(yaw);
      district.add(mesh);
      return mesh;
    }
    function box(w, h, d, material, x, z, y = h / 2, yaw = 0) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      if(h>=0.72)mesh.userData.krSolidCollider=true;
      return place(mesh, x, z, y, yaw);
    }
    function cylinder(radiusTop, radiusBottom, height, material, x, z, y, sides = 8) {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radiusTop, radiusBottom, height, sides),
        material
      );
      if(height>=1.25)mesh.userData.krSolidCollider=true;
      return place(mesh, x, z, y, 0);
    }

    // A broad pedestrian promenade leaves the landing pad and leads
    // through the settlement gate toward the outdoor cinema.
    for (let i = 0; i < 0; i++) {
      const x = 12 + i * 5.5;
      box(5.3, 0.42, 7.2, mat.path, x, 0, 0.35);
      box(5.3, 0.16, 0.34, mat.pathEdge, x, -3.75, 0.43);
      box(5.3, 0.16, 0.34, mat.pathEdge, x, 3.75, 0.43);
    }

    // Two walk-up storefronts beside the promenade.
    function createShopBillboard(name,x,z,accent){
      const frame=surfaceFrame(x,z,0),shop=new THREE.Group();
      shop.userData.krSolidRoot=true;shop.position.copy(frame.position);shop.quaternion.copy(frame.q);district.add(shop);
      const body=new THREE.Mesh(new THREE.BoxGeometry(9,3.4,6),makeMaterial(accent,{roughness:0.82}));body.position.set(0,1.7,0);shop.add(body);
      const roof=new THREE.Mesh(new THREE.BoxGeometry(10,0.42,6.8),makeMaterial(0x39434a));roof.position.set(0,3.55,0);roof.userData.krWalkableSurface="shop-roof-"+name.toLowerCase().replace(/[^a-z0-9]+/g,"-");shop.add(roof);
      const canvas=document.createElement("canvas");canvas.width=1200;canvas.height=300;
      const ctx=canvas.getContext("2d");ctx.fillStyle="#ffd92f";ctx.fillRect(0,0,1200,300);
      ctx.strokeStyle="#a82018";ctx.lineWidth=18;ctx.strokeRect(12,12,1176,276);
      ctx.fillStyle="#b51f18";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="900 104px Georgia";ctx.shadowColor="#fff2a0";ctx.shadowBlur=4;ctx.fillText(name,600,150,1100);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      const boardFront=new THREE.Mesh(new THREE.PlaneGeometry(10.5,2.65),new THREE.MeshBasicMaterial({map:texture,side:THREE.FrontSide}));boardFront.position.set(0,5.45,3.16);shop.add(boardFront);
      const boardBack=new THREE.Mesh(new THREE.PlaneGeometry(10.5,2.65),new THREE.MeshBasicMaterial({map:texture,side:THREE.FrontSide}));boardBack.position.set(0,5.45,-3.16);boardBack.rotation.y=Math.PI;shop.add(boardBack);
      const postMat=makeMaterial(0x6a4931);
      for(const px of [-4.8,4.8]){const post=new THREE.Mesh(new THREE.BoxGeometry(0.35,2.5,0.35),postMat);post.position.set(px,4.55,3.05);shop.add(post);}
      return shop;
    }
    moonRxRef=createShopBillboard("MOON MAN'S RX",78,34,0x55a99c);
    sanchosArmoryRef=createShopBillboard("SANCHO'S ARMORY",78,-34,0xb75a42);

    // Whizz's Dance House: open-front walk-in club, with DJ, dance floor, space chickens and watermelons.
    const df=surfaceFrame(22,-34,0),club=new THREE.Group();club.userData.krSolidRoot=true;club.position.copy(df.position);club.quaternion.copy(df.q);district.add(club);whizzDanceRef=club;
    const purple=makeMaterial(0x59416f,{roughness:.84}),gold=makeMaterial(0xffd45d,{metalness:.25,roughness:.5});
    const fl=new THREE.Mesh(new THREE.BoxGeometry(22,.55,17),makeMaterial(0x342b4d));fl.position.set(0,.28,0);fl.userData.krWalkableSurface="whizz-dance-floor";club.add(fl);
    for(let x=0;x<6;x++)for(let z=0;z<4;z++){const tile=new THREE.Mesh(new THREE.BoxGeometry(3.35,.08,3.35),makeMaterial([0x36bdb2,0xe66e9b,0xe8bd55,0x8d72c8][(x+z)%4]));tile.position.set(-8.35+x*3.34,.61,-5.1+z*3.35);club.add(tile);}
    const rear=new THREE.Mesh(new THREE.BoxGeometry(22,8,.7),purple);rear.position.set(0,4,-8.2);club.add(rear);
    for(const side of [-1,1]){const w=new THREE.Mesh(new THREE.BoxGeometry(.7,8,17),purple);w.position.set(side*10.65,4,0);club.add(w);const strip=new THREE.Mesh(new THREE.BoxGeometry(.18,6.8,.22),new THREE.MeshBasicMaterial({color:side<0?0x53f0dc:0xff62ad}));strip.position.set(side*10.22,4.2,0);club.add(strip);}
    const roof=new THREE.Mesh(new THREE.BoxGeometry(23,.75,18),makeMaterial(0x343044));roof.position.set(0,8.25,0);roof.userData.krWalkableSurface="whizz-dance-house-roof";club.add(roof);
    const booth=new THREE.Mesh(new THREE.BoxGeometry(8,1.6,2.3),makeMaterial(0x263b50));booth.position.set(0,1.25,-6.35);club.add(booth);const deck=new THREE.Mesh(new THREE.BoxGeometry(6.8,.16,1.7),gold);deck.position.set(0,2.12,-6.35);club.add(deck);
    for(const x of [-2.1,2.1]){const platter=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.12,16),new THREE.MeshBasicMaterial({color:0x23232b}));platter.position.set(x,2.28,-6.35);club.add(platter);}
    const djHead=new THREE.Mesh(new THREE.SphereGeometry(.62,10,8),makeMaterial(0x9c6848));djHead.position.set(0,3.35,-6.5);club.add(djHead);const djBody=new THREE.Mesh(new THREE.BoxGeometry(1.35,1.75,.8),makeMaterial(0x4cb8ae));djBody.position.set(0,2.05,-6.5);club.add(djBody);
    for(let i=0;i<4;i++){const lamp=new THREE.PointLight([0xff4f9a,0x4cebd8,0xffd45d,0x9c78ff][i],1.8,22);lamp.position.set((i-1.5)*5,6.8,2);club.add(lamp);}
    for(let i=0;i<3;i++){const bird=new THREE.Group();bird.position.set(-5+i*5,.8,1.5+(i%2)*2);club.add(bird);const plumage=makeMaterial([0xf3e8c5,0xb9d8d1,0xf0b7a0][i]);const body=new THREE.Mesh(new THREE.SphereGeometry(.78,9,7),plumage);body.scale.set(1.15,.82,.9);bird.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.43,9,7),plumage);head.position.set(.42,.58,.08);bird.add(head);const beak=new THREE.Mesh(new THREE.ConeGeometry(.19,.48,5),makeMaterial(0xe5a53b));beak.rotation.z=-Math.PI/2;beak.position.set(.83,.52,.08);bird.add(beak);const comb=new THREE.Mesh(new THREE.ConeGeometry(.2,.42,5),makeMaterial(0xd94d55));comb.position.set(.35,1,.08);bird.add(comb);}
    for(const [x,z,sc] of [[-8,5,1],[8,5,.9],[-7,-5,.72],[7,-5,.78]]){const melon=new THREE.Mesh(new THREE.SphereGeometry(.85,12,9),makeMaterial(0x318e55));melon.scale.set(sc,sc*.78,sc);melon.position.set(x,.95*sc,z);club.add(melon);for(let k=0;k<5;k++){const stripe=new THREE.Mesh(new THREE.TorusGeometry(.82*sc,.035*sc,4,16),new THREE.MeshBasicMaterial({color:0x174c35}));stripe.rotation.y=k*Math.PI/5;stripe.position.copy(melon.position);stripe.scale.set(1,.78,1);club.add(stripe);}}
    const signCanvas=document.createElement("canvas");signCanvas.width=1200;signCanvas.height=300;const signCtx=signCanvas.getContext("2d");signCtx.fillStyle="#ffd92f";signCtx.fillRect(0,0,1200,300);signCtx.strokeStyle="#a82018";signCtx.lineWidth=18;signCtx.strokeRect(12,12,1176,276);signCtx.fillStyle="#b51f18";signCtx.font="900 94px Georgia";signCtx.textAlign="center";signCtx.textBaseline="middle";signCtx.fillText("WHIZZ'S DANCE HOUSE",600,150,1120);const signTex=new THREE.CanvasTexture(signCanvas);signTex.colorSpace=THREE.SRGBColorSpace;
    const signA=new THREE.Mesh(new THREE.PlaneGeometry(21,3.8),new THREE.MeshBasicMaterial({map:signTex,side:THREE.FrontSide}));signA.position.set(0,10.7,8.9);club.add(signA);const signB=new THREE.Mesh(new THREE.PlaneGeometry(21,3.8),new THREE.MeshBasicMaterial({map:signTex,side:THREE.FrontSide}));signB.position.set(0,10.7,-8.9);signB.rotation.y=Math.PI;club.add(signB);

    // Smaller side paths and illuminated guide studs.
    for (let side of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        box(5.2, 0.3, 4.4, mat.path, 29 + i * 4.8, side * 13, 0.25);
      }
    }
    for (let i = 0; i < 13; i++) {
      const x = 13 + i * 5.1;
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 5), mat.neonMint);
      place(stud, x, -4.25, 0.55);
      const lamp = new THREE.PointLight(0x72e9c8, 0.45, 8);
      lamp.position.copy(stud.position).addScaledVector(surfaceFrame(x, -4.25).normal, 1.1);
      district.add(lamp);
    }

    // Settlement entrance: colorful retro-futurist gate and sign.
    box(2.2, 8, 2.2, mat.turquoise, 34, -6, 4);
    box(2.2, 8, 2.2, mat.coral, 34, 6, 4);
    box(15, 1.7, 2.4, mat.cream, 34, 0, 8.3);
    box(12.8, 0.34, 0.28, mat.neonPink, 34, -1.28, 8.2);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(10.5, 1.1, 0.22), mat.dark);
    place(sign, 34, 0, 8.4);
    const signGlow = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.16, 0.25), mat.neonMint);
    place(signGlow, 34, 0, 8.98);

    // WESTERN TOWN GRID: straight streets, rectangular blocks and sidewalks.
    const streetMat=makeMaterial(0x706d66,{roughness:.98}),curbMat=makeMaterial(0xc2b18e,{roughness:.92}),stripeMat=new THREE.MeshBasicMaterial({color:0xe6d3a8});
    // Short sections follow the planet's curvature. Long tangent slabs
    // intersected the terrain at their ends and looked like black fragments.
    for(const x of [5,40,75,110]){
      for(let z=-52;z<=52;z+=8){
        box(7.2,.20,8.35,streetMat,x,z,.18);
        box(.48,.34,8.35,curbMat,x-3.82,z,.25);
        box(.48,.34,8.35,curbMat,x+3.82,z,.25);
      }
      for(const z of [-48,-32,-16,0,16,32,48])box(.16,.035,1.1,stripeMat,x,z,.31);
    }
    for(const z of [-52,-17.5,17.5,52]){
      for(let x=0;x<=110;x+=8){
        box(8.35,.20,7.2,streetMat,x,z,.18);
        box(8.35,.34,.48,curbMat,x,z-3.82,.25);
        box(8.35,.34,.48,curbMat,x,z+3.82,.25);
      }
      for(let x=0;x<=110;x+=12)box(1.1,.035,.16,stripeMat,x,z,.31);
    }
    for(const x of [22,57,92])for(const z of [-35,0,35]){
      cylinder(.10,.15,5.4,mat.dark,x,z,2.7,7);
      cylinder(.42,.48,.18,mat.cream,x,z,5.45,8);
      const lamp=new THREE.PointLight(0xffd18b,.55,13);lamp.position.copy(surfaceFrame(x,z,5.8).position);district.add(lamp);
    }

    // Three recognizable modular buildings around a small plaza.
    const buildingSpecs = []; // Legacy generic blocks replaced by planned Western storefronts.
    for (const b of buildingSpecs) {
      box(b.w, b.h, b.d, b.body, b.x, b.z, b.h / 2 + 0.15);
      box(b.w + 1.2, 0.9, b.d + 1.2, b.roof, b.x, b.z, b.h + 0.65);
      box(b.w * 0.48, b.h * 0.42, 0.32, mat.glass, b.x, b.z - b.d / 2 - 0.18, b.h * 0.56);
      box(2.4, 3.6, 0.36, mat.dark, b.x, b.z + b.d / 2 + 0.2, 1.9);
      // Recessed entry canopy, lit threshold and side-facing signage.
      box(4.8, 0.34, 3.0, b.roof, b.x, b.z + b.d / 2 + 1.8, 4.0);
      box(3.0, 0.18, 0.24, mat.neonMint, b.x, b.z + b.d / 2 + 2.0, 2.1);
      box(0.38, 2.5, 0.22, mat.neonPink, b.x - 1.45, b.z + b.d / 2 + 0.28, 2.0);
      box(0.38, 2.5, 0.22, mat.neonPink, b.x + 1.45, b.z + b.d / 2 + 0.28, 2.0);
      cylinder(0.42, 0.42, 1.1, mat.neonPink, b.x - b.w * 0.32, b.z - b.d / 2 - 0.3, b.h + 0.7, 8);
      const entryGlow = new THREE.PointLight(0x74f0cf, 0.65, 13);
      entryGlow.position.copy(surfaceFrame(b.x, b.z + b.d / 2 + 2.4, 2.6).position);
      district.add(entryGlow);


    }

    // Central plaza: a circular gathering court with a tiered fountain.
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 0.48, 20), mat.path);
    place(plaza, 55, 0, 0.28);
    const plazaRing = new THREE.Mesh(new THREE.TorusGeometry(9.6, 0.22, 5, 32), mat.neonPink);
    place(plazaRing, 55, 0, 0.65);
    cylinder(2.4, 3.0, 1.2, mat.turquoise, 55, 0, 1.0, 10);
    cylinder(1.25, 1.7, 0.9, mat.cream, 55, 0, 2.0, 10);
    const fountainOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), mat.neonMint);
    place(fountainOrb, 55, 0, 3.05);
    const fountainLight = new THREE.PointLight(0x65f2d0, 1.2, 19);
    fountainLight.position.copy(surfaceFrame(55, 0, 3.5).position);
    district.add(fountainLight);
    const plaqueCanvas=document.createElement("canvas");plaqueCanvas.width=900;plaqueCanvas.height=240;
    const plaqueCtx=plaqueCanvas.getContext("2d");plaqueCtx.fillStyle="#302c29";plaqueCtx.fillRect(0,0,900,240);
    plaqueCtx.strokeStyle="#d8bd78";plaqueCtx.lineWidth=14;plaqueCtx.strokeRect(10,10,880,220);
    plaqueCtx.fillStyle="#f1dca7";plaqueCtx.font="bold 112px Georgia";plaqueCtx.textAlign="center";plaqueCtx.textBaseline="middle";plaqueCtx.fillText("HZ F@##!T",450,126);
    const plaqueTexture=new THREE.CanvasTexture(plaqueCanvas);plaqueTexture.colorSpace=THREE.SRGBColorSpace;
    const fountainPlaque=new THREE.Mesh(new THREE.PlaneGeometry(5.8,1.55),new THREE.MeshBasicMaterial({map:plaqueTexture}));
    fountainPlaque.position.set(55,2.25,3.05);fountainPlaque.rotation.y=Math.PI;district.add(fountainPlaque);

    // Raised planter beds and compact garden sculptures.
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI * 2 / 8;
      const x = 55 + Math.cos(angle) * 16;
      const z = Math.sin(angle) * 16;
      const bed = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.8, 0.75, 8), mat.coral);
      place(bed, x, z, 0.5);
      const sprout = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 0), mat.leaf[i % mat.leaf.length]);
      place(sprout, x, z, 2.0);
    }

    // Alien ornamental trees: stacked faceted crowns, with their own
    // independent seeded stream so later fauna changes stay isolated.
    for (let i = 0; i < 15; i++) {
      const x = 22 + plantRandom() * 54;
      const z = (plantRandom() < 0.5 ? -1 : 1) * (9 + plantRandom() * 22);
      const trunkHeight = 2.2 + plantRandom() * 2.2;
      cylinder(0.32, 0.48, trunkHeight, mat.cream, x, z, trunkHeight / 2, 6);
      const crownColor = mat.leaf[Math.floor(plantRandom() * mat.leaf.length)];
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.1 + plantRandom() * 1.4, 0), crownColor);
      place(crown, x, z, trunkHeight + 1.8);
      const crown2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 0), crownColor);
      place(crown2, x + (plantRandom() - 0.5) * 1.5, z, trunkHeight + 3.1);
    }

    // A clearly marked pedestrian arcade leads from plaza to cinema.
    for (let i = 0; i < 5; i++) {
      const x = 77 + i * 4.5;
      box(3.8, 0.28, 4.8, mat.cream, x, -31, 0.35);
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.0, 7), mat.coral);
      place(bollard, x, -34.1, 1.0);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.38, 7, 5), mat.neonMint);
      place(cap, x, -34.1, 2.05);
    }

    // Retro drive-in amphitheatre: screen, colored surround, low stage,
    // speaker pylons and curved rows of individual seats.
    box(2.2, 15, 28, mat.coral, 91, -29, 7.5);
    box(1.2, 11.8, 23, mat.dark, 92.3, -29, 7.3);
    box(0.5, 9.8, 20, mat.glass, 93.05, -29, 7.3);
    box(0.65, 10.8, 21, mat.neonPink, 93.4, -29, 7.3);
    box(5, 1.1, 31, mat.turquoise, 91, -29, 0.7);
    // Rear screen service block and visible side access panels.
    box(3.2, 5.5, 8.0, mat.lilac, 94.2, -29, 3.0);
    box(0.3, 3.6, 2.0, mat.neonMint, 96.0, -29, 2.0);


    for (const side of [-1, 1]) {
      cylinder(0.7, 1.0, 6.5, mat.lilac, 91, -29 + side * 18, 3.3, 8);
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6), mat.neonMint);
      place(beacon, 91, -29 + side * 18, 6.8);
    }
    for (let row = 0; row < 3; row++) {
      for (let seat = 0; seat < 7; seat++) {
        const x = 55 + seat * 5.5;
        const z = -49 - row * 5.2;
        const yaw = -0.12;
        box(2.5, 1.4, 2.0, seat % 2 ? mat.coral : mat.lilac, x, z, 0.95, yaw);
        box(2.5, 1.8, 0.48, mat.cream, x, z - 0.72, 1.8, yaw);
      }
    }

    // Decorative alien boulders and colored mineral spires.
    for (let i = 0; i < 22; i++) {
      const x = 15 + propRandom() * 90;
      const z = (propRandom() - 0.5) * 88;
      const size = 0.8 + propRandom() * 2.1;
      const rockMat = [mat.lilac, mat.coral, mat.turquoise][Math.floor(propRandom() * 3)];
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), rockMat);
      rock.rotation.set(propRandom(), propRandom() * 2, propRandom());
      place(rock, x, z, size * 0.45);
    }

    // Seeded crystalline mineral clusters around the outer garden.
    const crystalRandom = ecologyRandom(0x43525953);
    const crystalMaterials = [mat.turquoise, mat.lilac, mat.coral, mat.cream];
    for (let i = 0; i < 18; i++) {
      const x = 18 + crystalRandom() * 83;
      const z = (crystalRandom() - 0.5) * 102;
      const height = 1.6 + crystalRandom() * 3.8;
      const crystal = new THREE.Mesh(
        new THREE.ConeGeometry(0.65 + crystalRandom() * 0.8, height, 5),
        crystalMaterials[Math.floor(crystalRandom() * crystalMaterials.length)]
      );
      place(crystal, x, z, height / 2);
    }


    // ------------------------------------------------------------
    // PLANET-SPECIFIC FLORA // v0.3.10
    // Four reusable low-poly species, generated from an isolated
    // random stream so ecology changes do not alter the settlement.
    // Geometry and materials are shared to keep mobile rendering light.
    // ------------------------------------------------------------
    const floraMaterials = [
      makeMaterial(0x78c98d, { roughness: 0.94 }),
      makeMaterial(0x9edb79, { roughness: 0.94 }),
      makeMaterial(0x55bdb5, { roughness: 0.9 }),
      makeMaterial(0xd78da9, { roughness: 0.92 }),
      makeMaterial(0xe8bd75, { roughness: 0.9 })
    ];
    const floraStemMat = makeMaterial(0x927b62, { roughness: 0.98 });
    const floraGeometries = {
      stem: new THREE.CylinderGeometry(0.16, 0.25, 1, 6),
      leaf: new THREE.ConeGeometry(0.48, 2.8, 5),
      bulb: new THREE.IcosahedronGeometry(1, 1),
      spire: new THREE.ConeGeometry(0.72, 3.6, 6),
      cap: new THREE.SphereGeometry(1, 8, 5),
      pebble: new THREE.DodecahedronGeometry(0.55, 0)
    };
    const floraCounts = { fanreed: 0, bulbcluster: 0, spirebloom: 0, umbrella: 0 };

    function floraSpotClear(x, z) {
      // Keep the main promenade, plaza, buildings, cinema and seating clear.
      if (x > 7 && x < 83 && Math.abs(z) < 8) return false;
      if (x > 23 && x < 55 && Math.abs(z) < 25) return false;
      if (x > 59 && x < 86 && z > -28 && z < 2) return false;
      if (x > 48 && x < 92 && z < -43 && z > -57) return false;
      if (x > 85 && z > -39 && z < -18) return false;
      if (x > 8 && x < 80 && Math.abs(z) < 17) return false;
      return true;
    }

    function createFlora(species, x, z, scale, colorIndex) {
      const group = new THREE.Group();
      group.userData.krPhysicsProfile={kind:"plant",massKg:Math.max(.2,scale*3.5),densityKgM3:650,structuralStrength:.35,material:"living-fibre"};
      const leafMat = floraMaterials[colorIndex % floraMaterials.length];
      const accentMat = floraMaterials[(colorIndex + 2) % floraMaterials.length];
      const stem = new THREE.Mesh(floraGeometries.stem, floraStemMat);
      stem.position.y = 0.8 * scale;
      stem.scale.set(scale, 1.6 * scale, scale);
      group.add(stem);

      if (species === "fanreed") {
        for (let i = 0; i < 5; i++) {
          const leaf = new THREE.Mesh(floraGeometries.leaf, i % 2 ? leafMat : accentMat);
          const angle = i * Math.PI * 2 / 5;
          leaf.position.set(Math.cos(angle) * 0.65 * scale, 2.05 * scale, Math.sin(angle) * 0.65 * scale);
          leaf.rotation.z = -Math.cos(angle) * 0.72;
          leaf.rotation.x = Math.sin(angle) * 0.72;
          leaf.scale.set(0.7 * scale, (0.72 + floraRandom() * 0.35) * scale, 0.7 * scale);
          group.add(leaf);
        }
      } else if (species === "bulbcluster") {
        for (let i = 0; i < 3; i++) {
          const bulb = new THREE.Mesh(floraGeometries.bulb, i === 1 ? accentMat : leafMat);
          const angle = i * Math.PI * 2 / 3;
          bulb.position.set(Math.cos(angle) * 0.78 * scale, (1.45 + (i === 1 ? 0.6 : 0)) * scale, Math.sin(angle) * 0.78 * scale);
          bulb.scale.set(0.68 * scale, (0.85 + floraRandom() * 0.25) * scale, 0.68 * scale);
          group.add(bulb);
        }
      } else if (species === "spirebloom") {
        const spire = new THREE.Mesh(floraGeometries.spire, leafMat);
        spire.position.y = 2.0 * scale;
        spire.scale.set(scale, (0.85 + floraRandom() * 0.5) * scale, scale);
        group.add(spire);
        for (let i = 0; i < 3; i++) {
          const bud = new THREE.Mesh(floraGeometries.bulb, accentMat);
          const angle = i * Math.PI * 2 / 3;
          bud.position.set(Math.cos(angle) * 0.7 * scale, (0.9 + i * 0.45) * scale, Math.sin(angle) * 0.7 * scale);
          bud.scale.setScalar(0.32 * scale);
          group.add(bud);
        }
      } else {
        const cap = new THREE.Mesh(floraGeometries.cap, leafMat);
        cap.position.y = 2.0 * scale;
        cap.scale.set(1.35 * scale, 0.48 * scale, 1.35 * scale);
        group.add(cap);
        const capCore = new THREE.Mesh(floraGeometries.bulb, accentMat);
        capCore.position.y = 2.22 * scale;
        capCore.scale.setScalar(0.28 * scale);
        group.add(capCore);
      }

      const pebble = new THREE.Mesh(floraGeometries.pebble, accentMat);
      pebble.position.set(0.55 * scale, 0.24 * scale, 0.3 * scale);
      pebble.scale.set(0.8 * scale, 0.55 * scale, 0.7 * scale);
      group.add(pebble);

      const frame = surfaceFrame(x, z, 0.08);
      group.position.copy(frame.position);
      group.quaternion.copy(frame.q);
      group.rotateY(floraRandom() * Math.PI * 2);
      group.scale.setScalar(0.72 + scale * 0.28);
      district.add(group);
      floraCounts[species]++;
    }

    const floraSpecies = ["fanreed", "bulbcluster", "spirebloom", "umbrella"];
    for (let i = 0; i < 34; i++) {
      let x = 0, z = 0, found = false;
      for (let attempt = 0; attempt < 24; attempt++) {
        x = 12 + floraRandom() * 99;
        z = floraRandom() < 0.72
          ? 25 + floraRandom() * 37
          : -61 - floraRandom() * 16;
        if (floraSpotClear(x, z)) { found = true; break; }
      }
      if (!found) continue;
      const species = floraSpecies[Math.floor(floraRandom() * floraSpecies.length)];
      createFlora(species, x, z, 0.8 + floraRandom() * 0.9, Math.floor(floraRandom() * floraMaterials.length));
    }


    // HAVEN WILDLIFE RESERVE: fenced habitat with an opening double gate.
    const zooRailMat=makeMaterial(0x547d70,{roughness:0.88,metalness:0.12});
    const zooPostMat=makeMaterial(0xe7c982,{roughness:0.78});
    const zooGlowMat=new THREE.MeshBasicMaterial({color:0x91f1c9});
    const zooX0=24,zooX1=76,zooZ0=27,zooZ1=62;
    for(const x of [zooX0,zooX1]){
      for(let z=zooZ0;z<=zooZ1;z+=5.8){
        cylinder(0.22,0.3,2.35,zooPostMat,x,z,1.18,7);
        const cap=new THREE.Mesh(new THREE.SphereGeometry(0.25,7,5),zooGlowMat); place(cap,x,z,2.42);
      }
    }
    for(const z of [zooZ0,zooZ1]){
      const segments=z===zooZ0?[[zooX0,46.7],[53.3,zooX1]]:[[zooX0,zooX1]];
      for(const [x1,x2] of segments){
        const mid=(x1+x2)/2,len=x2-x1;
        box(len,0.22,0.22,zooRailMat,mid,z,1.2);
        box(len,0.18,0.18,zooRailMat,mid,z,2.0);
        for(let x=x1+5.8;x<x2;x+=5.8)cylinder(0.14,0.18,2.3,zooPostMat,x,z,1.15,6);
      }
    }
    for(const x of [46.7,53.3]){
      box(0.55,3.4,0.55,zooPostMat,x,zooZ0,1.7);
      const cap=new THREE.Mesh(new THREE.SphereGeometry(0.42,8,6),zooGlowMat); place(cap,x,zooZ0,3.55);
    }
    box(7.4,0.48,0.55,zooPostMat,50,zooZ0,3.45);
    box(6.1,0.9,0.2,mat.dark,50,zooZ0-0.35,3.55);
    box(4.8,0.12,0.22,mat.neonMint,50,zooZ0-0.47,3.55);
    const gateAnchor=surfaceFrame(50,zooZ0,0.1);
    habitatGate=new THREE.Group(); habitatGate.position.copy(gateAnchor.position); habitatGate.quaternion.copy(gateAnchor.q); district.add(habitatGate);
    for(const side of [-1,1]){
      const hinge=new THREE.Group(); hinge.position.set(side*3,0,0);
      const panel=new THREE.Mesh(new THREE.BoxGeometry(3,2,0.22),zooRailMat); panel.position.set(-side*1.5,1,0); hinge.add(panel);
      for(let i=0;i<3;i++){const rail=new THREE.Mesh(new THREE.BoxGeometry(3,0.14,0.3),zooPostMat);rail.position.set(-side*1.5,0.35+i*0.62,0);hinge.add(rail);}
      habitatGate.add(hinge); habitatGateLeaves.push({hinge,side});
    }

    // ------------------------------------------------------------
    // AMBIENT FAUNA // v0.3.14
    // Grazers, shellback hoppers and hovering motes share simple
    // deterministic forage/rest/wander/startle behavior.
    // ------------------------------------------------------------
    const faunaMaterials = [
      makeMaterial(0xf0b36d, { roughness: 0.82 }),
      makeMaterial(0x7ed3c4, { roughness: 0.8 }),
      makeMaterial(0xb39bd8, { roughness: 0.82 })
    ];
    const faunaDark = makeMaterial(0x34434a, { roughness: 0.88 });
    const faunaBodyGeo = new THREE.SphereGeometry(1, 9, 7);
    const faunaHeadGeo = new THREE.SphereGeometry(0.55, 8, 6);
    const faunaWingGeo = new THREE.BoxGeometry(1.35, 0.12, 0.72);
    const faunaLegGeo = new THREE.CylinderGeometry(0.09, 0.13, 0.78, 5);
    const faunaEyeGeo = new THREE.SphereGeometry(0.095, 6, 5);

    function createFauna(kind, x, z, colorIndex) {
      const group = new THREE.Group();
      group.userData.krPhysicsProfile={kind:"animal",massKg:kind==="grazer"?72:(kind==="hopper"?18:4),densityKgM3:980,structuralStrength:.6,material:"living"};
      const bodyMat = faunaMaterials[colorIndex % faunaMaterials.length];
      const body = new THREE.Mesh(faunaBodyGeo, bodyMat);
      const head = new THREE.Mesh(faunaHeadGeo, bodyMat);
      const eyes = [];
      const wings = [];
      const legs = [];

      if (kind === "mote") {
        body.scale.set(0.72, 0.62, 1.0);
        body.position.y = 0.1;
        head.position.set(0, 0.05, 0.82);
        head.scale.set(0.72, 0.72, 0.72);
        group.add(body, head);
        for (const side of [-1, 1]) {
          const wingPivot = new THREE.Group();
          wingPivot.position.set(side * 0.48, 0.22, -0.08);
          const wing = new THREE.Mesh(faunaWingGeo, side < 0 ? faunaMaterials[1] : faunaMaterials[2]);
          wing.position.x = side * 0.58;
          wing.rotation.z = side * -0.16;
          wingPivot.add(wing);
          group.add(wingPivot);
          wings.push({ pivot: wingPivot, side });
        }
        for (const side of [-1, 1]) {
          const eye = new THREE.Mesh(faunaEyeGeo, faunaDark);
          eye.position.set(side * 0.22, 0.14, 1.23);
          group.add(eye);
          eyes.push(eye);
        }
      } else if (kind === "hopper") {
        // Small six-legged shellback: a distinct ground-dwelling species.
        body.scale.set(0.78, 0.5, 0.92);
        body.position.y = 0.56;
        head.position.set(0, 0.55, 0.88);
        head.scale.set(0.48, 0.48, 0.48);
        group.add(body, head);
        const shell = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 0), faunaMaterials[2]);
        shell.position.set(0, 0.88, -0.12);
        shell.scale.set(1.12, 0.72, 1.2);
        group.add(shell);
        for (const side of [-1, 1]) {
          const eye = new THREE.Mesh(faunaEyeGeo, faunaDark);
          eye.position.set(side * 0.18, 0.62, 1.2);
          group.add(eye);
          eyes.push(eye);
          const feeler = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.045, 0.48, 5), faunaDark);
          feeler.position.set(side * 0.2, 1.02, 0.92);
          feeler.rotation.z = side * -0.28;
          group.add(feeler);
        }
        for (const side of [-1, 1]) {
          for (const fore of [-1, 0, 1]) {
            const leg = new THREE.Mesh(faunaLegGeo, faunaDark);
            leg.scale.set(0.72, 0.72, 0.72);
            leg.position.set(side * 0.48, 0.34, fore * 0.48);
            leg.rotation.z = side * 0.3;
            group.add(leg);
            legs.push(leg);
          }
        }
      } else {
        body.scale.set(0.92, 0.62, 1.25);
        body.position.y = 0.95;
        head.position.set(0, 1.12, 1.12);
        head.scale.set(0.68, 0.68, 0.68);
        group.add(body, head);
        for (const side of [-1, 1]) {
          const eye = new THREE.Mesh(faunaEyeGeo, faunaDark);
          eye.position.set(side * 0.2, 1.2, 1.62);
          group.add(eye);
          eyes.push(eye);
        }
        for (const side of [-1, 1]) {
          for (const fore of [-1, 1]) {
            const leg = new THREE.Mesh(faunaLegGeo, faunaDark);
            leg.position.set(side * 0.58, 0.48, fore * 0.7);
            leg.rotation.z = side * 0.2;
            group.add(leg);
            legs.push(leg);
          }
        }
        const tail = new THREE.Mesh(floraGeometries.spire, faunaMaterials[2]);
        tail.position.set(0, 0.82, -1.05);
        tail.rotation.x = Math.PI / 2;
        tail.scale.set(0.3, 0.72, 0.3);
        group.add(tail);
      }

      const frame = surfaceFrame(x, z, kind === "mote" ? 2.8 + faunaRandom() * 1.6 : 0.06);
      group.position.copy(frame.position);
      group.quaternion.copy(frame.q);
      group.rotateY(faunaRandom() * Math.PI * 2);
      district.add(group);
      ambientFauna.push({
        group,
        kind,
        basePosition: group.position.clone(),
        surfaceUp: frame.normal.clone(),
        baseQuaternion: group.quaternion.clone(),
        phase: faunaRandom() * Math.PI * 2,
        amplitude: kind === "mote" ? 0.38 : (kind === "hopper" ? 0.045 : 0.08),
        homeX:x, homeZ:z,
        roamX:kind==="grazer"?4.2:(kind==="hopper"?5.8:0),
        roamZ:kind==="grazer"?3.0:(kind==="hopper"?4.6:0),
        state:"wandering", stateChangedAt:0,
        wings,
        legs
      });
    }

    for(let i=0;i<5;i++) createFauna("grazer",31+i*8.5+faunaRandom()*3,37+faunaRandom()*13,i);
    for(let i=0;i<5;i++) createFauna("mote",31+i*10+faunaRandom()*5,31+faunaRandom()*9,i+1);
    for(let i=0;i<4;i++) {
      const x=29+faunaRandom()*31, z=34+faunaRandom()*13;
      const before=ambientFauna.length;
      createFauna("hopper",x,z,i+2);
      ambientFauna[before].group.scale.setScalar(0.68);
    }


    // HAVEN UTILITY MOON BUGGY // six-wheel retro-futurist rover.
    const buggy = new THREE.Group();
    buggy.name="KR_HAVEN_UTILITY_ROVER";
    const buggyBody = makeMaterial(0xe2b96f, { roughness:0.78, metalness:0.18 });
    const buggyTrim = makeMaterial(0x40565a, { roughness:0.72, metalness:0.28 });
    const buggyGlass = new THREE.MeshStandardMaterial({ color:0x80c9cf, emissive:0x17464c, emissiveIntensity:0.22, metalness:0.45, roughness:0.2, transparent:true, opacity:0.82 });
    const buggyLamp = new THREE.MeshBasicMaterial({ color:0xffe4a0 });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.65,0.55,3.9),buggyBody); chassis.position.y=1.15; buggy.add(chassis);
    const under = new THREE.Mesh(new THREE.BoxGeometry(2.15,0.42,3.1),buggyTrim); under.position.y=0.78; buggy.add(under);
    // Open two-seat cockpit: keep the crew visible from the chase camera.
    const dash = new THREE.Mesh(new THREE.BoxGeometry(2.05,0.34,0.34),buggyTrim); dash.position.set(0,1.72,-0.72); buggy.add(dash);
    const dashFace = new THREE.Mesh(new THREE.BoxGeometry(1.72,0.16,0.045),buggyGlass); dashFace.position.set(0,1.78,-0.905); buggy.add(dashFace);
    const windscreen = new THREE.Mesh(new THREE.BoxGeometry(1.72,0.62,0.09),buggyGlass); windscreen.position.set(0,2.12,-1.02); windscreen.rotation.x=-0.12; buggy.add(windscreen);
    // Rear roll hoop and short side safety rails replace the old opaque roof/cabin.
    for (const side of [-1,1]) {
      const hoopPost = new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.09,1.42,7),buggyBody);
      hoopPost.position.set(side*0.92,2.02,1.05); buggy.add(hoopPost);
    }
    const hoopTop = new THREE.Mesh(new THREE.BoxGeometry(1.95,0.14,0.14),buggyBody); hoopTop.position.set(0,2.73,1.05); buggy.add(hoopTop);
    const rearBulkhead = new THREE.Mesh(new THREE.BoxGeometry(1.92,0.48,0.16),buggyTrim); rearBulkhead.position.set(0,1.72,1.22); buggy.add(rearBulkhead);
    // Two individual bucket seats with visible cushions and headrests.
    for (const side of [-1,1]) {
      const seat = new THREE.Group(); seat.position.set(side*0.52,0.92,0.18); buggy.add(seat);
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.76,0.22,0.82),buggyTrim); cushion.position.set(0,0.12,0.02); seat.add(cushion);
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.76,0.9,0.2),buggyTrim); backrest.position.set(0,0.58,0.31); backrest.rotation.x=-0.12; seat.add(backrest);
      const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.48,0.3,0.2),buggyBody); headrest.position.set(0,1.08,0.34); seat.add(headrest);
      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.74,0.07),buggyBody); belt.position.set(0,0.48,-0.13); belt.rotation.z=side*0.16; seat.add(belt);
    }
    // A small retro steering wheel and column in front of the left-hand driver seat.
    const steeringColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.07,0.48,8),buggyTrim);
    steeringColumn.position.set(-0.52,1.72,-0.55); steeringColumn.rotation.x=-0.62; buggy.add(steeringColumn);
    const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.29,0.045,7,18),buggyBody);
    steeringWheel.position.set(-0.52,1.91,-0.77); steeringWheel.rotation.x=0.28; buggy.add(steeringWheel);
    const steeringHub = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.12,8),buggyTrim);
    steeringHub.position.copy(steeringWheel.position); steeringHub.rotation.x=Math.PI/2; buggy.add(steeringHub);
    // Dynamic occupants: the cockpit starts empty. Passenger and cargo
    // visuals are instantiated only when an occupant is actually assigned.
    function makeSeatedCrew(isDriver) {
      const crew = new THREE.Group();
      const suit = makeMaterial(0xe0c99c,{roughness:0.84,metalness:0.12});
      const light = makeMaterial(0xf4e4bf,{roughness:0.78,metalness:0.12});
      const dark = makeMaterial(0x34454c,{roughness:0.88});
      const accent = makeMaterial(0xe78b67,{roughness:0.72,metalness:0.14});
      const visor = new THREE.MeshStandardMaterial({color:0x66c6d2,metalness:0.62,roughness:0.16,emissive:0x16434c,emissiveIntensity:0.32});
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.68,0.82,0.42),suit); torso.position.set(0,1.48,0.16); torso.rotation.x=-0.16; crew.add(torso);
      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.42,0.34,0.07),dark); chest.position.set(0,1.5,-0.07); crew.add(chest);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.25,0.12,0.035),accent); panel.position.set(0,1.53,-0.115); crew.add(panel);
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.34,10,8),light); helmet.position.set(0,2.12,0.02); crew.add(helmet);
      const face = new THREE.Mesh(new THREE.SphereGeometry(0.275,10,7,0,Math.PI*2,0,Math.PI),visor); face.position.set(0,2.14,-0.105); face.scale.set(1,0.78,0.76); crew.add(face);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28,0.045,5,14),accent); rim.position.set(0,2.14,-0.19); crew.add(rim);
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.48,0.64,0.25),dark); pack.position.set(0,1.5,0.42); crew.add(pack);
      for (const side of [-1,1]) {
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.105,0.12,0.48,7),accent); tank.position.set(side*0.22,1.52,0.53); crew.add(tank);
        const arm = new THREE.Group(); arm.position.set(side*0.43,1.72,0.12);
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.105,0.12,0.42,7),suit); upper.position.y=-0.2; arm.add(upper);
        const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.1,0.42,7),suit); fore.position.set(side*(isDriver?0.12:0.02),-0.47,-0.2); fore.rotation.x=-0.72; arm.add(fore);
        const glove = new THREE.Mesh(new THREE.SphereGeometry(0.12,7,5),dark);
        glove.position.set(isDriver?side*0.17:side*0.04,-0.62,isDriver?-0.43:-0.18); arm.add(glove);
        if (isDriver) { arm.rotation.z=-side*0.12; }
        else { arm.rotation.x=-0.12; }
        crew.add(arm);
        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.16,0.52,7),dark);
        thigh.position.set(side*0.2,1.02,-0.2); thigh.rotation.x=Math.PI/2.7; crew.add(thigh);
        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.25,0.2,0.48),suit);
        boot.position.set(side*0.2,0.82,-0.62); crew.add(boot);
      }
      crew.position.set(isDriver?-0.52:0.52,0,0.12);
      crew.rotation.y=0;
      return crew;
    }
    buggy.userData.occupants=new Map();
    buggy.userData.capacity={seats:2,cargo:2};
    buggy.userData.createOccupant=function(spec){
      const type=spec.type||"npc";
      if(type==="player"||type==="npc")return makeSeatedCrew(spec.slot==="driver");
      const item=new THREE.Group();
      if(type==="animal"){
        const coat=makeMaterial(spec.color||0xc68c5b,{roughness:0.95});
        const body=new THREE.Mesh(new THREE.SphereGeometry(0.58,9,7),coat);body.scale.set(1.25,0.72,0.78);body.position.y=0.78;item.add(body);
        const head=new THREE.Mesh(new THREE.SphereGeometry(0.32,8,6),coat);head.position.set(0,1.08,-0.58);item.add(head);
      }else if(type==="plant"){
        const pot=new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.25,0.48,7),makeMaterial(0xc77d4f));pot.position.y=0.25;item.add(pot);
        const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.08,0.78,5),makeMaterial(0x568e58));stem.position.y=0.85;item.add(stem);
        for(let i=0;i<5;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(0.22,7,5),makeMaterial(i%2?0x69aa68:0x9bc76c));leaf.scale.set(1.45,0.48,0.72);leaf.position.set(Math.cos(i*1.256)*0.25,0.95+i*0.08,Math.sin(i*1.256)*0.25);item.add(leaf);}
      }else{
        const crate=new THREE.Mesh(new THREE.BoxGeometry(0.95,0.8,0.9),makeMaterial(spec.color||0xb68a58));crate.position.y=0.52;item.add(crate);
      }
      return item;
    };
    buggy.userData.addOccupant=function(spec){
      const id=String(spec.id||("occupant-"+Date.now()));if(buggy.userData.occupants.has(id))return false;
      const slot=spec.slot||(spec.type==="plant"||spec.type==="cargo"||spec.type==="animal"?"cargo":"passenger");
      const entries=Array.from(buggy.userData.occupants.values());
      const seats=entries.filter(x=>x.slot==="driver"||x.slot==="passenger").length,cargo=entries.filter(x=>x.slot==="cargo").length;
      if(slot==="driver"||slot==="passenger"){if(seats>=buggy.userData.capacity.seats)return false;if(entries.some(x=>x.slot===slot))return false;}
      else if(slot!=="cargo"||cargo>=buggy.userData.capacity.cargo)return false;
      const visual=buggy.userData.createOccupant({...spec,slot});
      if(slot==="driver")visual.position.set(-0.52,0,0.12);
      else if(slot==="passenger")visual.position.set(0.52,0,0.12);
      else visual.position.set(cargo%2===0?-0.58:0.58,0.92,1.15+Math.floor(cargo/2)*0.72);
      if(slot==="cargo")visual.scale.setScalar(0.72);
      buggy.add(visual);buggy.userData.occupants.set(id,{id,type:spec.type||"npc",label:spec.label||id,slot,visual});return true;
    };
    buggy.userData.removeOccupant=function(id){const entry=buggy.userData.occupants.get(String(id));if(!entry)return false;buggy.remove(entry.visual);buggy.userData.occupants.delete(String(id));return true;};
    for (const z of [-2,2]) { const bumper=new THREE.Mesh(new THREE.BoxGeometry(2.9,0.24,0.24),buggyTrim); bumper.position.set(0,0.82,z); buggy.add(bumper); }
    for (const side of [-1,1]) {
      const lamp=new THREE.Mesh(new THREE.BoxGeometry(0.38,0.22,0.12),buggyLamp); lamp.position.set(side*0.88,1.35,-1.98); buggy.add(lamp);
      const rail=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.9,2),buggyBody); rail.position.set(side*1.12,1.85,0.35); buggy.add(rail);
      for (const z of [-1.35,0,1.35]) {
        const pivot=new THREE.Group(); pivot.position.set(side*1.35,0.68,z);
        const tire=new THREE.Mesh(new THREE.CylinderGeometry(0.57,0.57,0.38,10),makeMaterial(0x30383a,{roughness:0.96})); tire.rotation.z=Math.PI/2; pivot.add(tire);
        const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.23,0.23,0.405,8),buggyBody); hub.rotation.z=Math.PI/2; pivot.add(hub);
        buggy.add(pivot); buggyWheels.push(pivot);
      }
    }
    const antenna=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.05,1,5),buggyTrim); antenna.position.set(0.72,3.05,0.95); buggy.add(antenna);
    const tip=new THREE.Mesh(new THREE.SphereGeometry(0.13,7,5),mat.neonMint); tip.position.set(0.72,3.58,0.95); buggy.add(tip);
    const roverFrame=surfaceFrame(20,17,0.12); buggy.position.copy(roverFrame.position); buggy.quaternion.copy(roverFrame.q);
    buggy.userData.krSolidRoot=true;
    district.add(buggy);
    havenBuggy=buggy; buggy.userData.species="HAVEN UTILITY ROVER";


    // OUTER HAVEN: distant geological points of interest and rocky ground.
    const outerRandom=ecologyRandom(0x4f555452);
    const outerGeo=new THREE.DodecahedronGeometry(1,0);
    const outerMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.96,flatShading:true,vertexColors:true});
    const outerRocks=new THREE.InstancedMesh(outerGeo,outerMat,96);
    const outerDummy=new THREE.Object3D(),outerColor=new THREE.Color();let outerCount=0;
    for(let i=0;i<260&&outerCount<96;i++){
      const x=104+outerRandom()*112,z=(outerRandom()-0.5)*190;
      const offset=east.clone().multiplyScalar(x).addScaledVector(north,z);
      const normal=up.clone().addScaledVector(offset,1/CONFIG.planetRadius).normalize();
      const terrain=terrainProfile(normal.x,normal.y,normal.z);if(!terrain.land)continue;
      const size=1.1+outerRandom()*3.8;
      outerDummy.position.copy(normal).multiplyScalar(CONFIG.planetRadius+terrain.elevation+size*0.35);
      outerDummy.quaternion.setFromUnitVectors(upAxis,normal);outerDummy.rotateY(outerRandom()*Math.PI*2);
      outerDummy.scale.set(size*(0.7+outerRandom()*0.6),size*(0.45+outerRandom()*0.7),size*(0.7+outerRandom()*0.6));
      outerDummy.updateMatrix();outerRocks.setMatrixAt(outerCount,outerDummy.matrix);
      outerColor.setHSL(0.06+outerRandom()*0.12,0.18+outerRandom()*0.24,0.28+outerRandom()*0.26);
      outerRocks.setColorAt(outerCount,outerColor);outerCount++;
    }
    outerRocks.count=outerCount;outerRocks.instanceMatrix.needsUpdate=true;if(outerRocks.instanceColor)outerRocks.instanceColor.needsUpdate=true;district.add(outerRocks);

    // Old Survey Relay.
    const relayFrame=surfaceFrame(164,34,0.2),relay=new THREE.Group();
    relay.position.copy(relayFrame.position);relay.quaternion.copy(relayFrame.q);district.add(relay);
    const relayBase=new THREE.Mesh(new THREE.CylinderGeometry(2.5,3.2,1.2,8),mat.dark);relayBase.position.y=0.6;relay.add(relayBase);
    const relayTower=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.72,12,6),mat.cream);relayTower.position.y=6.8;relay.add(relayTower);
    const relayDish=new THREE.Mesh(new THREE.TorusGeometry(2.2,0.24,6,16),mat.turquoise);relayDish.position.y=11.5;relayDish.rotation.x=0.72;relay.add(relayDish);
    const relayBeacon=new THREE.Mesh(new THREE.OctahedronGeometry(1,0),mat.neonPink);relayBeacon.position.y=13.3;relay.add(relayBeacon);

    // Crystal Basin.
    for(let i=0;i<17;i++){
      const angle=i*Math.PI*2/17,radius=4+outerRandom()*8,h=3+outerRandom()*10;
      const crystal=new THREE.Mesh(new THREE.ConeGeometry(0.75+outerRandom()*0.9,h,5),i%3===0?mat.turquoise:(i%3===1?mat.lilac:mat.coral));
      const frame=surfaceFrame(139+Math.cos(angle)*radius,-74+Math.sin(angle)*radius,h*0.48);
      crystal.position.copy(frame.position);crystal.quaternion.copy(frame.q);crystal.rotateY(angle);district.add(crystal);
    }
    const basinMarker=new THREE.Mesh(new THREE.OctahedronGeometry(2.1,0),mat.neonMint);place(basinMarker,139,-74,13);

    // Ridge Arch.
    const archFrame=surfaceFrame(190,82,0.2),arch=new THREE.Group();arch.position.copy(archFrame.position);arch.quaternion.copy(archFrame.q);district.add(arch);
    const archMat=makeMaterial(0xb68d70,{roughness:0.96});
    const archL=new THREE.Mesh(new THREE.DodecahedronGeometry(3.6,0),archMat);archL.position.set(-4.2,3.4,0);arch.add(archL);
    const archR=archL.clone();archR.position.x=4.2;arch.add(archR);
    const archTop=new THREE.Mesh(new THREE.BoxGeometry(10,1.5,2.2),archMat);archTop.position.y=7.1;arch.add(archTop);

    // A subtle local identity marker for future network presence and
    // ecological catalogues; no server or network dependency added.
    district.userData.worldSeed = CONFIG.seed >>> 0;
    district.userData.ecologySeed = ecologySeed;
    district.userData.biome = "HAVEN // WARM COASTAL HIGHLANDS";
    district.userData.speciesCatalog = {
      flora: { ...floraCounts },
      fauna: { mote: 5, grazer: 5, hopper: 4, wildlifeReserve: 1 },
      vehicles: { havenUtilityRover: 1 },
      landmarks: { surveyRelay: 1, crystalBasin: 1, ridgeArch: 1 },
      wildlifeReleased: faunaReleased
    };
  }


  // ============================================================
  // HAVEN POLAR LANDMARKS // v0.3.26
  // Deterministic installations at the exact geographic poles.
  // The polar generator uses an isolated seed stream and does not
  // consume or alter the existing terrain/ecology random sequence.
  // ============================================================

  function createPolarDestinations(world) {
    const northPole = new THREE.Vector3(0, 1, 0);
    const southPole = new THREE.Vector3(0, -1, 0);
    const upAxis = new THREE.Vector3(0, 1, 0);
    const polarSeed = (CONFIG.seed ^ 0x504f4c45) >>> 0;
    let polarState = polarSeed;
    function polarRandom() {
      polarState = (polarState + 0x6D2B79F5) >>> 0;
      let t = polarState;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    function makePoleSite(normal, name) {
      const terrain = terrainProfile(normal.x, normal.y, normal.z);
      const site = new THREE.Group();
      site.position.copy(normal).multiplyScalar(CONFIG.planetRadius + terrain.elevation + 0.12);
      site.quaternion.setFromUnitVectors(upAxis, normal);
      site.userData.landmark = name;
      world.add(site);
      return site;
    }
    function box(parent, w, h, d, material, x, y, z) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    }
    function cylinder(parent, rt, rb, h, material, x, y, z, sides = 8) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, sides), material);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    }
    function sphere(parent, radius, material, x, y, z, w = 1, h = 1, d = 1) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), material);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, d);
      parent.add(mesh);
      return mesh;
    }

    // NORTH POLE: a permanent scientific navigation observatory.
    const northSite = makePoleSite(northPole, "NORTH POLE OBSERVATORY");
    northObservatoryRef=northSite;
    const northDeck = new THREE.Mesh(
      new THREE.CylinderGeometry(12, 13, 0.7, 12),
      makeMaterial(0x718b91, { metalness: 0.42, roughness: 0.72 })
    );
    northDeck.position.y = 0.35;
    northSite.add(northDeck);
    const northDeckRing = new THREE.Mesh(
      new THREE.TorusGeometry(10.2, 0.24, 5, 32),
      new THREE.MeshBasicMaterial({ color: 0x77e8d1 })
    );
    northDeckRing.rotation.x = Math.PI / 2;
    northDeckRing.position.y = 0.78;
    northSite.add(northDeckRing);
    const observatoryMat = makeMaterial(0xc5d2c8, { metalness: 0.38, roughness: 0.58 });
    const darkMat = makeMaterial(0x344650, { metalness: 0.3, roughness: 0.72 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x8be2df, emissive: 0x174e55, emissiveIntensity: 0.4,
      metalness: 0.42, roughness: 0.18, transparent: true, opacity: 0.78
    });
    cylinder(northSite, 2.1, 2.7, 15, observatoryMat, 0, 8, 0, 8);
    cylinder(northSite, 3.1, 3.1, 1.0, darkMat, 0, 15.4, 0, 8);
    const pod = new THREE.Mesh(new THREE.SphereGeometry(4.2, 12, 8), glassMat);
    pod.position.set(0, 18.8, 0);
    pod.scale.y = 0.72;
    northSite.add(pod);
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2 + Math.PI / 4;
      const x = Math.cos(angle) * 7.3, z = Math.sin(angle) * 7.3;
      cylinder(northSite, 0.42, 0.58, 8.2, darkMat, x, 4.7, z, 6);
      const supportLight = new THREE.Mesh(new THREE.SphereGeometry(0.42, 7, 5), new THREE.MeshBasicMaterial({ color: 0xffd47e }));
      supportLight.position.set(x, 8.9, z);
      northSite.add(supportLight);
    }
    cylinder(northSite, 0.24, 0.42, 10, darkMat, 0, 27, 0, 6);
    const northBeacon = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.6, 0),
      new THREE.MeshBasicMaterial({ color: 0xffd477 })
    );
    northBeacon.position.y = 32.5;
    northSite.add(northBeacon);
    const northLight = new THREE.PointLight(0xffcf79, 2.0, 48);
    northLight.position.set(0, 32.5, 0);
    northSite.add(northLight);
    const northSign = box(northSite, 12, 1.5, 0.35, darkMat, 0, 4.3, 9.2);
    const northLetters = box(northSite, 9.2, 0.22, 0.42, new THREE.MeshBasicMaterial({ color: 0x7dffd1 }), 0, 4.65, 9.0);
    northSite.userData.latitude = 90;
    northSite.userData.longitude = null;

    // SOUTH POLE: THE LAST CHANCE SALOON.
    // Open-front, roofless interior is deliberate: it remains visible
    // from the ground-level follow camera and is fully walk-in.
    const southSite = makePoleSite(southPole, "LEMMY'S RANCH");
    southSaloonRef=southSite;
    const wood = makeMaterial(0x8a5737, { roughness: 0.92 });
    const darkWood = makeMaterial(0x493126, { roughness: 0.9 });
    const cream = makeMaterial(0xe7cda0, { roughness: 0.84 });
    const brass = makeMaterial(0xc69a4e, { metalness: 0.62, roughness: 0.34 });
    const red = makeMaterial(0x9d463d, { roughness: 0.8 });
    const amber = new THREE.MeshBasicMaterial({ color: 0xffbd63 });
    const warmGlass = new THREE.MeshStandardMaterial({ color: 0xffbd76, emissive: 0x9a4b19, emissiveIntensity: 0.65 });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(32, 0.48, 25), darkWood);
    floor.position.set(0, 0.24, -0.4);
    southSite.add(floor);
    // Rear and side walls; the broad front entrance stays open.
    box(southSite, 32, 9, 0.8, wood, 0, 4.7, -12.5);
    box(southSite, 0.8, 9, 24, wood, -15.6, 4.7, -0.3);
    box(southSite, 0.8, 9, 24, wood, 15.6, 4.7, -0.3);
    // Lower interior wainscoting and upper trim.
    box(southSite, 31.5, 1.0, 0.22, darkWood, 0, 1.0, -11.95);
    box(southSite, 31.5, 0.36, 0.42, brass, 0, 8.9, -12.0);
    box(southSite, 0.3, 0.35, 23.5, brass, -15.0, 8.9, -0.2);
    box(southSite, 0.3, 0.35, 23.5, brass, 15.0, 8.9, -0.2);
    // Front porch, saloon sign and lanterns.
    box(southSite, 21, 0.55, 4.2, wood, 0, 0.35, 13.1);
    box(southSite, 20, 1.9, 0.65, darkWood, 0, 10.2, 13.2);
    box(southSite, 16.8, 0.18, 0.82, amber, 0, 10.3, 12.82);
    for (const x of [-10.8, 10.8]) {
      box(southSite, 0.9, 9.5, 0.9, darkWood, x, 4.8, 12.2);
      const lantern = new THREE.PointLight(0xffa64e, 1.0, 19);
      lantern.position.set(x, 7.0, 11.3);
      southSite.add(lantern);
      sphere(southSite, 0.42, warmGlass, x, 7.0, 11.3, 0.8, 1.25, 0.8);
    }
    // Roof edge and exposed rafters, leaving the room open to view.
    box(southSite, 33, 0.55, 2.0, darkWood, 0, 9.55, -11.2);
    for (const x of [-14, -7, 0, 7, 14]) box(southSite, 0.28, 0.28, 23, darkWood, x, 9.1, -0.1);
    // Sign lettering represented as simple raised blockwork.
    const signGlow = new THREE.MeshBasicMaterial({ color: 0xffd078 });
    const ranchCanvas=document.createElement("canvas");ranchCanvas.width=1024;ranchCanvas.height=160;
    const ranchCtx=ranchCanvas.getContext("2d");ranchCtx.fillStyle="#ffd92f";ranchCtx.fillRect(0,0,1024,160);
    ranchCtx.strokeStyle="#a82018";ranchCtx.lineWidth=12;ranchCtx.strokeRect(8,8,1016,144);
    ranchCtx.fillStyle="#b51f18";ranchCtx.font="bold 100px Georgia";ranchCtx.textAlign="center";ranchCtx.textBaseline="middle";ranchCtx.shadowColor="#fff2a0";ranchCtx.shadowBlur=3;ranchCtx.fillText("LEMMY'S RANCH",512,82);
    const ranchTexture=new THREE.CanvasTexture(ranchCanvas);ranchTexture.colorSpace=THREE.SRGBColorSpace;
    const ranchSignFront=new THREE.Mesh(new THREE.PlaneGeometry(19.5,3.05),new THREE.MeshBasicMaterial({map:ranchTexture,side:THREE.FrontSide}));ranchSignFront.position.set(0,10.25,13.58);southSite.add(ranchSignFront);
    const ranchSignBack=new THREE.Mesh(new THREE.PlaneGeometry(19.5,3.05),new THREE.MeshBasicMaterial({map:ranchTexture,side:THREE.FrontSide}));ranchSignBack.position.set(0,10.25,12.82);ranchSignBack.rotation.y=Math.PI;southSite.add(ranchSignBack);
    for (let i = 0; i < 9; i++) box(southSite, 0.65, 0.9, 0.18, signGlow, -6.1 + i * 1.52, 10.25, 12.45);

    // Bar counter, foot rail, back-bar shelves and bottle collection.
    box(southSite, 17.5, 1.25, 1.8, wood, 0, 1.25, -7.4);
    box(southSite, 17.8, 0.22, 2.0, brass, 0, 1.98, -7.4);
    box(southSite, 16.5, 0.2, 0.18, brass, 0, 0.62, -6.2);
    box(southSite, 18, 5.4, 0.55, darkWood, 0, 5.0, -11.55);
    box(southSite, 17.5, 0.24, 0.9, wood, 0, 3.7, -10.9);
    box(southSite, 17.5, 0.24, 0.9, wood, 0, 5.7, -10.9);
    for (let i = 0; i < 13; i++) {
      const bx = -7.6 + i * 1.27;
      const bottleMat = [amber, new THREE.MeshBasicMaterial({ color: 0x70c7bb }), new THREE.MeshBasicMaterial({ color: 0xb78bd2 })][i % 3];
      cylinder(southSite, 0.22, 0.3, 1.0 + (i % 3) * 0.22, bottleMat, bx, 4.3, -10.35, 6);
      sphere(southSite, 0.19, bottleMat, bx, 4.88 + (i % 3) * 0.22, -10.35, 0.8, 0.8, 0.8);
    }
    // Bartender: recognizable head, torso, apron and arms behind the bar.
    const bartender = new THREE.Group();
    bartenderNpcRef=bartender;
    bartender.position.set(0, 0.55, -9.0);
    southSite.add(bartender);
    cylinder(bartender, 0.42, 0.52, 1.15, cream, 0, 1.45, 0, 8);
    box(bartender, 0.72, 0.72, 0.12, darkWood, 0, 1.25, -0.32);
    sphere(bartender, 0.39, cream, 0, 2.35, 0);
    cylinder(bartender, 0.48, 0.48, 0.22, darkWood, 0, 2.64, 0, 8);
    box(bartender, 0.78, 0.16, 0.5, darkWood, 0, 2.73, 0);
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      arm.position.set(side * 0.48, 1.95, 0);
      cylinder(arm, 0.13, 0.16, 0.78, cream, 0, -0.34, 0, 7);
      sphere(arm, 0.16, darkWood, 0, -0.76, -0.02);
      arm.rotation.z = side * -0.18;
      bartender.add(arm);
    }

    // Raised dance stage with a small piano and two animated performers.
    box(southSite, 12.5, 0.85, 5.8, darkWood, -8.4, 0.55, 3.2);
    box(southSite, 12.1, 0.18, 5.4, red, -8.4, 1.05, 3.2);
    box(southSite, 5.0, 1.4, 1.6, darkWood, -12.0, 1.95, 1.5);
    for (let i = 0; i < 7; i++) {
      const key = box(southSite, 0.48, 0.12, 0.7, cream, -14.0 + i * 0.62, 2.72, 0.62);
      key.rotation.y = 0;
    }
    const performerMats = [
      { dress: makeMaterial(0xd96c73, { roughness: 0.78 }), top: cream },
      { dress: makeMaterial(0x6c9e9c, { roughness: 0.78 }), top: makeMaterial(0xe7d5b8) }
    ];
    const dancerSpots=[-12.2,-9.2,-6.2,-3.2,-0.2];
    for (let i = 0; i < 5; i++) {
      const dancer = new THREE.Group();
      dancer.position.set(dancerSpots[i],1.16,4.1);
      southSite.add(dancer);
      dancer.userData.npcName=["Mabel","Ruby","Dottie","June","Pearl"][i];
      cylinder(dancer, 0.34, 0.72, 0.92, performerMats[i%2].dress, 0, 0.5, 0, 8);
      cylinder(dancer, 0.42, 0.38, 0.16, brass, 0, 0.12, 0, 8);
      cylinder(dancer, 0.34, 0.27, 0.82, performerMats[i%2].top, 0, 1.34, 0, 8);
      sphere(dancer, 0.31, cream, 0, 2.0, 0);
      sphere(dancer, 0.33, darkWood, 0, 2.23, 0, 1.12, 0.38, 1.0);
      const arms = [];
      for (const side of [-1, 1]) {
        const arm = new THREE.Group();
        arm.position.set(side * 0.34, 1.68, 0);
        cylinder(arm, 0.1, 0.13, 0.76, cream, 0, -0.34, 0, 6);
        sphere(arm, 0.12, cream, 0, -0.75, 0);
        dancer.add(arm);
        arms.push({ pivot: arm, side });
      }
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 8), darkWood);
      hat.position.y = 2.45;
      dancer.add(hat);
      saloonDancers.push({ group: dancer, arms, phase: i * Math.PI });
    }

    // Tables, stools and warm hanging lights. All props are fixed by
    // the polar landmark design and the same Haven world seed.
    const tablePositions = [[6, 3], [10, -2], [1, 6], [-1, -3]];
    for (let i = 0; i < tablePositions.length; i++) {
      const [x, z] = tablePositions[i];
      cylinder(southSite, 1.35, 1.45, 0.22, wood, x, 1.55, z, 10);
      cylinder(southSite, 0.2, 0.32, 1.35, darkWood, x, 0.78, z, 8);
      for (let j = 0; j < 3; j++) {
        const angle = j * Math.PI * 2 / 3;
        const sx = x + Math.cos(angle) * 2.0, sz = z + Math.sin(angle) * 2.0;
        cylinder(southSite, 0.72, 0.72, 0.22, red, sx, 0.85, sz, 8);
        cylinder(southSite, 0.13, 0.17, 0.75, darkWood, sx, 0.42, sz, 6);
      }
      cylinder(southSite, 0.12, 0.12, 0.9, brass, x, 2.1, z, 6);
      sphere(southSite, 0.25, amber, x, 2.62, z, 1.1, 1.25, 1.1);
    }
    // A small piano-side lantern and decorative wanted-board style sign.
    box(southSite, 4.2, 3.2, 0.28, darkWood, 11.0, 4.1, -11.85);
    box(southSite, 3.2, 1.6, 0.12, cream, 11.0, 4.1, -11.62);
    for (let i = 0; i < 5; i++) {
      box(southSite, 0.16, 1.0, 0.18, red, 9.8 + i * 0.6, 4.1, -11.5);
    }
    const saloonLamp = new THREE.PointLight(0xffa65f, 1.8, 34);
    saloonLamp.position.set(0, 7.5, 0);
    southSite.add(saloonLamp);
    southSite.userData.latitude = -90;
    southSite.userData.longitude = null;
    southSite.userData.seed = polarSeed;
    northSite.userData.seed = polarSeed;
  }

  function updateLastStopPerformers(time){
    if(!lastStopDinerRef||!lastStopDinerRef.userData.npcs)return;
    const clovs=lastStopDinerRef.userData.npcs.clovs,phase=time*.0028;
    if(clovs){clovs.rotation.y=Math.sin(phase*.48)*.34;clovs.position.y=5.75+Math.abs(Math.sin(phase))*.13;for(const item of clovs.userData.danceArms||[]){item.arm.rotation.z=item.side*(.28+Math.sin(phase*1.65+item.side)*.52);item.arm.rotation.x=Math.sin(phase+item.side)*.24;}}
    const door=lastStopDinerRef.userData.entryDoor;
    if(door&&door.userData.leftPanel&&playerAvatar){
      const local=lastStopDinerRef.worldToLocal(playerAvatar.position.clone());
      const shouldOpen=local.x>32&&Math.abs(local.z)<7.5;
      door.userData.openAmount=THREE.MathUtils.lerp(door.userData.openAmount,shouldOpen?1:0,.18);
      const slide=2.15*door.userData.openAmount;
      door.userData.leftPanel.position.z=-1.01-slide;
      door.userData.rightPanel.position.z=1.01+slide;
    }
    const dock=lastStopDinerRef.userData.dockScene;
    if(dock&&dock.userData){
      dock.userData.patrons.forEach(p=>{p.rotation.y=Math.sin(phase*.35+p.userData.phase)*.09;});
      // Mia walks a compact loop inside her cell, clear of the bed and plumbing.
      const mia=dock.userData.mia,walk=phase*.42;
      if(!characterAIHeld("mia")){mia.position.set(Math.sin(walk)*1.35,.35,1.25+Math.cos(walk)*1.45);
      mia.rotation.y=Math.atan2(Math.cos(walk)*1.35,-Math.sin(walk)*1.45);}
      // Benis patrols a rounded rectangular circuit around the outside of the jail.
      const patrol=phase*.24;
      if(!characterAIHeld("benis")){dock.userData.benis.position.set(58+9.4*Math.cos(patrol),5.58,-25+8.2*Math.sin(patrol));
      dock.userData.benis.rotation.y=Math.atan2(8.2*Math.cos(patrol),-9.4*Math.sin(patrol));}
      dock.userData.owner.rotation.y=Math.PI/2+Math.sin(phase*.3)*.1;
      dock.userData.woman.rotation.y=-Math.PI/2+Math.sin(phase*.27)*.12;
    }
  }

  function updateSolarCommonsLife(time){
    if(!solarHabitatStation||!solarHabitatStation.userData.biosphere)return;
    const life=solarHabitatStation.userData.biosphere,seconds=time*.001;
    for(const plant of life.plants){
      if(plant.kind==='tree')plant.group.rotation.z=Math.sin(seconds*.42+plant.phase)*.025;
      else plant.group.rotation.z=Math.sin(seconds*1.25+plant.phase)*.09;
    }
    for(const animal of life.animals){
      const p=seconds*(animal.kind==='glider'?.22:.12)+animal.phase;
      const radius=animal.kind==='glider'?5:2.3;
      animal.group.position.x=animal.x+Math.sin(p)*radius;
      animal.group.position.z=animal.z+Math.cos(p*.83)*radius;
      animal.group.rotation.y=Math.atan2(Math.cos(p)*radius,-Math.sin(p*.83)*radius);
      animal.group.position.y=.1+(animal.kind==='glider'?1.8+Math.sin(seconds*1.6+animal.phase)*.45:Math.abs(Math.sin(seconds*2.1+animal.phase))*(animal.kind==='hopper'?.48:.08));
      for(const leg of animal.legs)leg.mesh.rotation.x=Math.sin(seconds*3.2+leg.phase+animal.phase)*.24;
    }
    for(const npc of life.npcs){
      const p=seconds*.16+npc.phase;
      npc.group.position.x=npc.homeX+Math.sin(p)*1.25;
      npc.group.position.z=npc.homeZ+Math.cos(p*.8)*.9;
      npc.group.rotation.y=Math.atan2(Math.cos(p)*1.25,-Math.sin(p*.8)*.9);
      npc.group.position.y=Math.abs(Math.sin(seconds*1.8+npc.phase))*.035;
    }
  }

  function constrainSolarDomeFlight(fromWorld,toWorld){
    return resolveWorldBoundaries(fromWorld,toWorld);
  }

  function updateSaloonPerformers(time) {
    const seconds = time * 0.001;
    for (const dancer of saloonDancers) {
      const phase = seconds * 2.4 + dancer.phase;
      dancer.group.rotation.y = Math.sin(phase * 0.55) * 0.28;
      dancer.group.position.y = 1.16 + Math.abs(Math.sin(phase)) * 0.16;
      for (const arm of dancer.arms) {
        arm.pivot.rotation.z = arm.side * (0.48 + Math.sin(phase * 1.7 + arm.side) * 0.32);
        arm.pivot.rotation.x = Math.sin(phase + arm.side) * 0.2;
      }
    }
  }

  function createPlanet() {
    setStatus("GENERATING HAVEN");

    const geometry = new THREE.SphereGeometry(
      CONFIG.planetRadius,
      112,
      80
    );

    const positions = geometry.attributes.position;
    const colors = [];

    const color = new THREE.Color();

    const ocean = new THREE.Color("#287f91");
    const shelf = new THREE.Color("#55b99c");
    const lowland = new THREE.Color("#d49b62");
    const mountain = new THREE.Color("#b47b9d");
    const highland = new THREE.Color("#f0d9a0");

    for (let i = 0; i < positions.count; i++) {
      let x = positions.getX(i);
      let y = positions.getY(i);
      let z = positions.getZ(i);

      const length = Math.sqrt(
        x * x + y * y + z * z
      );

      x /= length;
      y /= length;
      z /= length;

      const terrain = terrainProfile(x, y, z);
      const elevation = terrain.elevation;
      const radius = CONFIG.planetRadius + elevation;

      positions.setXYZ(
        i,
        x * radius,
        y * radius,
        z * radius
      );

      if (!terrain.land) {
        color.copy(terrain.continents < -0.34 ? ocean : shelf);
      } else if (terrain.ridges > 0.48 || elevation > 12) {
        color.copy(highland);
      } else if (terrain.ridges > 0.2 || elevation > 6) {
        color.copy(mountain);
      } else {
        color.copy(lowland);
      }
      color.multiplyScalar(0.94 + terrain.detail * 0.075 + random() * 0.035);

      colors.push(
        color.r,
        color.g,
        color.b
      );
    }

    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3)
    );

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
      flatShading: true
    });

    const world = new THREE.Group();

    planet = new THREE.Mesh(
      geometry,
      material
    );

    planet.userData.krTerrainMesh = true;
    world.add(planet);

    // Atmospheric shell

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(
        CONFIG.planetRadius + 5,
        64,
        48
      ),
      new THREE.MeshBasicMaterial({
        color: 0x438bb9,
        transparent: true,
        opacity: 0.12,
        side: THREE.FrontSide,
        depthWrite: false
      })
    );

    atmosphere.userData.noCameraCollision = true;
    world.add(atmosphere);

    createSurfaceSettlements(world);
    createLandingSite(world);
    createHavenSettlement(world);
    createPolarDestinations(world);

    world.position.set(
      CONFIG.planetPosition[0],
      CONFIG.planetPosition[1],
      CONFIG.planetPosition[2]
    );

    scene.add(world);

    return world;
  }

  // ============================================================
  // PROCEDURAL SPACECRAFT
  // ============================================================

  // HAVEN OCEAN & MARITIME INFRASTRUCTURE
  function createHavenMaritimeInfrastructure(world){
    const water=new THREE.Mesh(new THREE.SphereGeometry(CONFIG.planetRadius-.85,112,80),new THREE.MeshPhysicalMaterial({color:0x238fa5,metalness:.08,roughness:.19,clearcoat:.92,clearcoatRoughness:.12,transparent:true,opacity:.76,depthWrite:false}));
    water.name="KR_HAVEN_GLOBAL_OCEAN";water.userData.noCameraCollision=true;water.renderOrder=2;world.add(water);
    const lat=.02,lon=1.75,normal=new THREE.Vector3(Math.cos(lat)*Math.cos(lon),Math.sin(lat),Math.cos(lat)*Math.sin(lon)).normalize();
    const port=new THREE.Group();port.name="KR_L_ASTROLABE_OFFSHORE_SPACEPORT";port.position.copy(normal).multiplyScalar(CONFIG.planetRadius-.35);port.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);
    port.userData.walkBounds={minX:-34,maxX:34,minZ:-26,maxZ:26,floorY:3.15,launchX:-999};port.userData.krPhysicsProfile={id:"l-astrolabe",kind:"offshore-spaceport",massKg:8600000,densityKgM3:780,structuralStrength:8,material:"steel-composite"};world.add(port);havenPortRoot=port;
    const steel=new THREE.MeshStandardMaterial({color:0x526a76,metalness:.72,roughness:.38}),ivory=new THREE.MeshStandardMaterial({color:0xd7d0bd,metalness:.28,roughness:.58}),blue=new THREE.MeshStandardMaterial({color:0x247f91,metalness:.5,roughness:.32}),orange=new THREE.MeshStandardMaterial({color:0xd87943,metalness:.32,roughness:.45}),dark=new THREE.MeshStandardMaterial({color:0x263943,metalness:.48,roughness:.62}),glass=new THREE.MeshStandardMaterial({color:0x83d5df,metalness:.25,roughness:.16,transparent:true,opacity:.42}),amber=new THREE.MeshBasicMaterial({color:0xffc66e});
    const deck=new THREE.Mesh(new THREE.BoxGeometry(76,1.8,56),steel);deck.position.y=2.05;deck.userData.krSolidCollider=true;port.add(deck);
    const deckTop=new THREE.Mesh(new THREE.BoxGeometry(73,.12,53),ivory);deckTop.position.y=3;deckTop.userData.krWalkableSurface="l-astrolabe-deck";port.add(deckTop);
    for(const x of [-30,-15,0,15,30]){const pontoon=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.55,52,10),blue);pontoon.rotation.x=Math.PI/2;pontoon.position.set(x,-1.4,0);port.add(pontoon);for(const z of [-23,23]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.38,.55,4.8,8),steel);leg.position.set(x,-1,z);port.add(leg);}}
    const pad=new THREE.Mesh(new THREE.CylinderGeometry(13,13,.34,48),dark);pad.position.set(0,3.15,2);pad.userData.krSolidCollider=true;pad.userData.krWalkableSurface="l-astrolabe-landing-pad";port.add(pad);
    const padRing=new THREE.Mesh(new THREE.TorusGeometry(11.2,.22,6,64),amber);padRing.rotation.x=Math.PI/2;padRing.position.set(0,3.38,2);port.add(padRing);
    for(const x of [-15,15])for(const z of [-18,18]){const b=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,4,8),amber);b.position.set(x,4.7,z);port.add(b);}
    const tower=new THREE.Group();tower.position.set(-27,3.1,15);port.add(tower);
    const tb=new THREE.Mesh(new THREE.BoxGeometry(8,8,8),ivory);tb.position.y=4;tb.userData.krSolidCollider=true;tb.userData.krWalkableSurface="l-astrolabe-tower-roof";tower.add(tb);
    const tg=new THREE.Mesh(new THREE.BoxGeometry(8.25,2.5,8.25),glass);tg.position.y=8.7;tower.add(tg);
    const tr=new THREE.Mesh(new THREE.CylinderGeometry(5.8,5.8,.8,8),blue);tr.position.y=10.3;tr.userData.krSolidCollider=true;tr.userData.krWalkableSurface="l-astrolabe-tower-cap";tower.add(tr);
    const mast=new THREE.Mesh(new THREE.CylinderGeometry(.12,.2,8,8),steel);mast.position.y=14.5;tower.add(mast);
    const shed=new THREE.Mesh(new THREE.BoxGeometry(17,5,8),ivory);shed.position.set(22,5.5,17);shed.userData.krSolidCollider=true;shed.userData.krWalkableSurface="l-astrolabe-shed-roof";port.add(shed);
    const crane=new THREE.Group();crane.position.set(28,3.2,-15);port.add(crane);
    const cp=new THREE.Mesh(new THREE.BoxGeometry(.8,12,.8),blue);cp.position.y=6;crane.add(cp);
    const ca=new THREE.Mesh(new THREE.BoxGeometry(12,.65,.65),blue);ca.position.set(5,11.5,0);crane.add(ca);
    const hook=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,5,6),steel);hook.position.set(9,8.5,0);crane.add(hook);
    const signCanvas=document.createElement("canvas");signCanvas.width=1024;signCanvas.height=256;const ctx=signCanvas.getContext("2d");
    ctx.fillStyle="#142b36";ctx.fillRect(0,0,1024,256);ctx.fillStyle="#f2dfb3";ctx.font="bold 76px Georgia";ctx.textAlign="center";ctx.fillText("L'ASTROLABE",512,112);ctx.font="32px monospace";ctx.fillStyle="#80cbd2";ctx.fillText("PORT SPATIAL OFFSHORE  •  HAVEN",512,182);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(25,6.25),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(signCanvas),side:THREE.DoubleSide}));sign.position.set(0,9,-26);port.add(sign);
    // Mainland coastal terminal, 92 m along the equatorial sea lane from L'Astrolabe.
    const portBaseRadius=CONFIG.planetRadius-.35,shoreDistanceAlong=92,shoreAngle=shoreDistanceAlong/portBaseRadius,shoreRadius=CONFIG.planetRadius+2.1;
    const shore=new THREE.Group();shore.name="KR_HAVEN_MAINLAND_SHIPPING_DOCK";
    shore.position.set(0,shoreRadius*Math.cos(shoreAngle)-portBaseRadius,-shoreRadius*Math.sin(shoreAngle));
    shore.rotation.x=-shoreAngle;shore.userData.walkBounds={minX:-18,maxX:18,minZ:-17,maxZ:53,floorY:1.12,launchX:-999};
    shore.userData.krPhysicsProfile={id:"haven-shipping-dock",kind:"coastal-port",massKg:1250000,densityKgM3:820,structuralStrength:5,material:"timber-steel"};port.add(shore);havenShoreDockRoot=shore;
    const quay=new THREE.Mesh(new THREE.BoxGeometry(32,1.1,25),ivory);quay.position.set(0,.55,0);quay.userData.krSolidCollider=true;quay.userData.krWalkableSurface="quai-main-quay";shore.add(quay);
    const pierWood=new THREE.MeshStandardMaterial({color:0x9b7951,roughness:.92});
    const dockPileMat=new THREE.MeshStandardMaterial({color:0x554b3c,roughness:1});
    for(let z=10;z<=50;z+=10){const sag=Math.sqrt(shoreRadius*shoreRadius-z*z)-shoreRadius,angle=Math.asin(z/shoreRadius),segment=new THREE.Group();segment.position.set(0,sag,z);segment.rotation.x=angle;shore.add(segment);
      const pierDeck=new THREE.Mesh(new THREE.BoxGeometry(9,1,11),pierWood);pierDeck.position.y=.5;pierDeck.userData.krSolidCollider=true;pierDeck.userData.krWalkableSurface="quai-pier-segment-"+z;segment.add(pierDeck);
      for(const x of [-4.2,4.2]){const railPost=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,1.2,6),steel);railPost.position.set(x,1.1,0);segment.add(railPost);const rail=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,10),steel);rail.position.set(x,1.65,0);segment.add(rail);}
      for(const x of [-4,4])for(const zz of [-4.5,4.5]){const pile=new THREE.Mesh(new THREE.CylinderGeometry(.25,.34,4.5,8),dockPileMat);pile.position.set(x,-1.7,zz);segment.add(pile);}
    }
    const pierEdge=new THREE.Mesh(new THREE.BoxGeometry(11,.42,3),steel);pierEdge.position.set(0,Math.sqrt(shoreRadius*shoreRadius-50.5*50.5)-shoreRadius+1.05,50.5);shore.add(pierEdge);
    const terminal=new THREE.Mesh(new THREE.BoxGeometry(14,5.4,10),ivory);terminal.position.set(-7,3.25,-5);terminal.userData.krSolidCollider=true;terminal.userData.krWalkableSurface="quai-terminal-roof";shore.add(terminal);
    const terminalGlass=new THREE.Mesh(new THREE.BoxGeometry(14.2,2.2,.12),glass);terminalGlass.position.set(-7,4.1,-10.08);shore.add(terminalGlass);
    const awning=new THREE.Mesh(new THREE.BoxGeometry(16,.45,7),blue);awning.position.set(-7,6.1,-3);shore.add(awning);
    for(let i=0;i<3;i++){const cargo=new THREE.Mesh(new THREE.BoxGeometry(4.5,2.8,6),[orange,blue,ivory][i]);cargo.position.set(9,1.95,-7+i*7);cargo.userData.krSolidCollider=true;shore.add(cargo);}
    for(const x of [-12,12]){const bollard=new THREE.Mesh(new THREE.CylinderGeometry(.28,.34,1.15,8),steel);bollard.position.set(x,1.05,49);shore.add(bollard);}
    const dockSignCanvas=document.createElement("canvas");dockSignCanvas.width=768;dockSignCanvas.height=192;const dockSignCtx=dockSignCanvas.getContext("2d");dockSignCtx.fillStyle="#24333a";dockSignCtx.fillRect(0,0,768,192);dockSignCtx.fillStyle="#f3dfb6";dockSignCtx.font="bold 54px Georgia";dockSignCtx.textAlign="center";dockSignCtx.fillText("QUAI DE HAVEN",384,83);dockSignCtx.font="23px monospace";dockSignCtx.fillStyle="#9dd5d6";dockSignCtx.fillText("PORT MARITIME  •  SHIPPING DOCK",384,139);
    const dockSign=new THREE.Mesh(new THREE.PlaneGeometry(17,4.25),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(dockSignCanvas),side:THREE.DoubleSide}));dockSign.position.set(0,7,-10.12);shore.add(dockSign);
    const dockLampMat=new THREE.MeshBasicMaterial({color:0xffc66e});for(const x of [-4,4]){const post=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,4,8),steel);post.position.set(x,2.7,48);shore.add(post);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.34,10,8),dockLampMat);lamp.position.set(x,4.8,48);shore.add(lamp);}
    const marker=new THREE.Group();marker.name="KR_L_ASTROLABE_LANDING_MARKER";marker.position.set(0,3.55,2);
    const mr=new THREE.Mesh(new THREE.TorusGeometry(12,.28,6,64),new THREE.MeshBasicMaterial({color:0xffc66e,transparent:true,opacity:.88,depthWrite:false}));mr.rotation.x=Math.PI/2;marker.add(mr);
    const mb=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,22,6),new THREE.MeshBasicMaterial({color:0x8fe4ec,transparent:true,opacity:.5,depthWrite:false}));mb.position.y=12;marker.add(mb);port.add(marker);havenPortLandingMarker=marker;
    const boat=new THREE.Group();boat.name="KR_HAVEN_EIGHT_PERSON_PASSENGER_LAUNCH";
    const hull=new THREE.Mesh(new THREE.BoxGeometry(7.8,2.3,24),blue);hull.position.y=.15;hull.userData.krSolidCollider=true;boat.add(hull);
    const bow=new THREE.Mesh(new THREE.ConeGeometry(4,5.8,4),blue);bow.rotation.x=Math.PI/2;bow.position.set(0,.15,-14);boat.add(bow);
    const bd=new THREE.Mesh(new THREE.BoxGeometry(7.1,.35,21),ivory);bd.position.y=1.45;bd.userData.krSolidCollider=true;bd.userData.krWalkableSurface="passenger-launch-deck";boat.add(bd);
    for(const side of [-1,1]){for(let z=-9;z<=9;z+=3){const rail=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,1.05,6),steel);rail.position.set(side*3.35,2.05,z);boat.add(rail);}const top=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,19),steel);top.position.set(side*3.35,2.55,0);boat.add(top);}
    const seatMat=new THREE.MeshStandardMaterial({color:0xb36e4e,roughness:.85});
    for(const z of [-5,0,5,8])for(const x of [-1.75,1.75]){const seat=new THREE.Group();seat.position.set(x,1.65,z);boat.add(seat);const c=new THREE.Mesh(new THREE.BoxGeometry(1.45,.35,1.5),seatMat);c.position.y=.28;seat.add(c);const back=new THREE.Mesh(new THREE.BoxGeometry(1.45,1.05,.28),seatMat);back.position.set(0,.82,.58);seat.add(back);}
    const consoleMesh=new THREE.Mesh(new THREE.BoxGeometry(3.5,1.5,2.2),dark);consoleMesh.position.set(0,2.15,-8.2);boat.add(consoleMesh);
    const wheel=new THREE.Mesh(new THREE.TorusGeometry(.62,.075,8,24),amber);wheel.position.set(0,3.05,-8.9);wheel.rotation.x=.45;boat.add(wheel);
    const windshield=new THREE.Mesh(new THREE.BoxGeometry(5.8,1.3,.12),glass);windshield.position.set(0,3.25,-10);boat.add(windshield);
    boat.userData.walkBounds={minX:-3,maxX:3,minZ:-10.5,maxZ:10.5,floorY:1.67,launchX:-999};boat.userData.krPhysicsProfile={id:"haven-passenger-launch",kind:"boat",massKg:14500,densityKgM3:680,structuralStrength:3.5,material:"aluminium-composite"};
    const R=CONFIG.planetRadius-.35;boat.position.set(0,Math.sqrt(R*R-22*22)-R,-22);port.add(boat);maritimeBoat=boat;
    const ski=new THREE.Group();ski.name="KR_HAVEN_PERSONAL_WATERCRAFT";
    const sk=new THREE.Mesh(new THREE.CapsuleGeometry(.72,3.2,5,10),new THREE.MeshStandardMaterial({color:0xe7a64d,metalness:.35,roughness:.35}));sk.rotation.x=Math.PI/2;sk.position.y=.45;ski.add(sk);
    const ss=new THREE.Mesh(new THREE.BoxGeometry(1.05,.48,1.8),dark);ss.position.set(0,1.05,.15);ski.add(ss);
    const bars=new THREE.Mesh(new THREE.TorusGeometry(.48,.07,7,18),steel);bars.position.set(0,1.45,-1);bars.rotation.x=.6;ski.add(bars);
    ski.position.set(16,Math.sqrt(R*R-16*16-8*8)-R,8);ski.userData.krPhysicsProfile={id:"haven-personal-watercraft",kind:"personal-watercraft",massKg:420,densityKgM3:720,structuralStrength:1.8,material:"fibreglass-composite"};port.add(ski);maritimeJetski=ski;
    return port;
  }
  function updateMaritimeVehicle(delta){
    if(!maritimeDriving||!havenPortRoot)return;const vehicle=maritimeDrivingType==="jetski"?maritimeJetski:maritimeBoat;if(!vehicle)return;
    const dt=Math.min(delta,.05),throttle=(keys.w?1:0)-(keys.s?1:0),steer=(keys.a?1:0)-(keys.d?1:0),avatarLocal=maritimeDrivingType==="boat"&&playerAvatar?vehicle.worldToLocal(playerAvatar.position.clone()):null;
    maritimeHeading+=steer*(maritimeDrivingType==="jetski"?1.65:1)*dt;const speed=throttle*(maritimeDrivingType==="jetski"?23:12),R=CONFIG.planetRadius-.35,x=vehicle.position.x,z=vehicle.position.z;
    const up=new THREE.Vector3(x,Math.sqrt(Math.max(1,R*R-x*x-z*z)),z).normalize(),yawQ=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),maritimeHeading);
    vehicle.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),up).multiply(yawQ);const forward=new THREE.Vector3(0,0,-1).applyQuaternion(vehicle.quaternion).projectOnPlane(up).normalize();
    const nx=x+forward.x*speed*dt,nz=z+forward.z*speed*dt;if(nx*nx+nz*nz<104*104){vehicle.position.set(nx,Math.sqrt(Math.max(1,R*R-nx*nx-nz*nz))-R,nz);const nu=new THREE.Vector3(nx,R+vehicle.position.y,nz).normalize();vehicle.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),nu).multiply(yawQ);}
    if(avatarLocal&&playerAvatar){vehicle.updateWorldMatrix(true,false);playerAvatar.position.copy(vehicle.localToWorld(avatarLocal));const q=vehicle.getWorldQuaternion(new THREE.Quaternion());playerUp.set(0,1,0).applyQuaternion(q).normalize();playerHeading.set(0,0,-1).applyQuaternion(q).normalize();orientAvatar();}
    const wp=vehicle.getWorldPosition(new THREE.Vector3()),wq=vehicle.getWorldQuaternion(new THREE.Quaternion()),wu=new THREE.Vector3(0,1,0).applyQuaternion(wq).normalize(),wf=new THREE.Vector3(0,0,-1).applyQuaternion(wq).normalize();
    camera.up.copy(wu);const eye=wp.clone().addScaledVector(wu,maritimeDrivingType==="jetski"?2.5:7).addScaledVector(wf,-(maritimeDrivingType==="jetski"?6:15));camera.position.lerp(eye,1-Math.pow(.00008,dt));camera.lookAt(wp.clone().addScaledVector(wu,2));
  }
  function updateMaritimePrompt(){
    if(!maritimeInteractButton)return;let label="",active=false;if(!onFoot||playerInSpaceFlight||!playerAvatar){maritimeInteractButton.dataset.active="0";maritimeInteractButton.style.display="none";return;}
    if(maritimeDriving){label=maritimeDrivingType==="jetski"?"EXIT PERSONAL WATERCRAFT":"RELEASE THE HELM";active=true;}
    else if(maritimeOnBoat){const l=maritimeBoat.worldToLocal(playerAvatar.position.clone());label=(l.z<-5.5&&l.z>-11.5&&Math.abs(l.x)<2.5)?"TAKE THE HELM":(Math.abs(maritimeBoat.position.z)>46?"DISEMBARK AT QUAI DE HAVEN":"RETURN TO L'ASTROLABE");active=true;}
    else if(havenPortRoot&&maritimeBoat&&maritimeJetski){const p=playerAvatar.position,bd=p.distanceTo(maritimeBoat.getWorldPosition(new THREE.Vector3())),sd=p.distanceTo(maritimeJetski.getWorldPosition(new THREE.Vector3()));if(sd<12){label="RIDE PERSONAL WATERCRAFT";active=true;}else if(bd<15){label="BOARD PASSENGER LAUNCH";active=true;}}
    maritimeInteractButton.textContent=label||"MARITIME";maritimeInteractButton.dataset.active=active?"1":"0";maritimeInteractButton.style.display=active?"block":"none";
  }
  function handleMaritimeAction(){
    if(!onFoot||!playerAvatar||playerInSpaceFlight)return;
    if(maritimeDriving){maritimeDriving=false;clearKeys();if(maritimeDrivingType==="jetski"){playerAvatar.visible=true;stationInteriorMode=true;stationWalkRoot=havenPortRoot;playerAvatar.position.copy(havenPortRoot.localToWorld(new THREE.Vector3(0,3.15,17)));playerUp.set(0,1,0).applyQuaternion(havenPortRoot.getWorldQuaternion(new THREE.Quaternion())).normalize();playerHeading.set(0,0,-1).applyQuaternion(havenPortRoot.getWorldQuaternion(new THREE.Quaternion())).normalize();}setStatus("MARITIME VEHICLE // SECURED");return;}
    if(maritimeOnBoat){const l=maritimeBoat.worldToLocal(playerAvatar.position.clone());if(l.z<-5.5&&l.z>-11.5&&Math.abs(l.x)<2.5){maritimeDriving=true;maritimeDrivingType="boat";maritimeHeading=0;setStatus("PASSENGER LAUNCH // AT THE HELM");}else if(Math.abs(maritimeBoat.position.z)>46&&havenShoreDockRoot){maritimeOnBoat=false;stationWalkRoot=havenShoreDockRoot;const dockQ=havenShoreDockRoot.getWorldQuaternion(new THREE.Quaternion());playerAvatar.position.copy(havenShoreDockRoot.localToWorld(new THREE.Vector3(0,1.12,46)));playerUp.set(0,1,0).applyQuaternion(dockQ).normalize();playerHeading.set(0,0,-1).applyQuaternion(dockQ).normalize();playerGrounded=true;playerInSpaceFlight=false;orientAvatar();setStatus("QUAI DE HAVEN // MAINLAND SHIPPING DOCK");}else{maritimeOnBoat=false;stationWalkRoot=havenPortRoot;playerAvatar.position.copy(havenPortRoot.localToWorld(new THREE.Vector3(0,3.15,17)));playerUp.set(0,1,0).applyQuaternion(havenPortRoot.getWorldQuaternion(new THREE.Quaternion())).normalize();playerHeading.set(0,0,-1).applyQuaternion(havenPortRoot.getWorldQuaternion(new THREE.Quaternion())).normalize();setStatus("L'ASTROLABE // MARINA DECK");}return;}
    if(playerAvatar.position.distanceTo(maritimeJetski.getWorldPosition(new THREE.Vector3()))<12){maritimeDriving=true;maritimeDrivingType="jetski";maritimeHeading=0;playerAvatar.visible=false;setStatus("PERSONAL WATERCRAFT // W A S D TO DRIVE");return;}
    if(playerAvatar.position.distanceTo(maritimeBoat.getWorldPosition(new THREE.Vector3()))<15){maritimeOnBoat=true;stationInteriorMode=true;stationWalkRoot=maritimeBoat;playerAvatar.position.copy(maritimeBoat.localToWorld(new THREE.Vector3(0,1.67,8.5)));playerUp.set(0,1,0).applyQuaternion(maritimeBoat.getWorldQuaternion(new THREE.Quaternion())).normalize();playerHeading.set(0,0,-1).applyQuaternion(maritimeBoat.getWorldQuaternion(new THREE.Quaternion())).normalize();playerGrounded=true;playerInSpaceFlight=false;playerAvatar.visible=true;orientAvatar();setStatus("PASSENGER LAUNCH // EIGHT SEATS // WALK TO THE HELM");}
  }


  function createShip() {
    setStatus("CONSTRUCTING SPACE RV");

    const group = new THREE.Group();
    group.name = "KR_SPACE_RV";
    shipVisualRoot = new THREE.Group();
    shipVisualRoot.name = "KR_PLAYER_SHIP_VISUAL_ROOT";
    group.add(shipVisualRoot);
    shipProceduralVisual = new THREE.Group();
    shipProceduralVisual.name = "KR_PROCEDURAL_SPACE_RV";
    shipVisualRoot.add(shipProceduralVisual);

    const rv = shipProceduralVisual;
    const ivory = makeMaterial(0xe8ddc4,{metalness:0.24,roughness:0.62});
    const cream = makeMaterial(0xc8b99a,{metalness:0.3,roughness:0.58});
    const teal = makeMaterial(0x367f83,{metalness:0.42,roughness:0.38});
    const orange = makeMaterial(0xd87943,{metalness:0.32,roughness:0.45});
    const darkTrim = makeMaterial(0x53646a,{metalness:0.68,roughness:0.32});
    const glass = new THREE.MeshStandardMaterial({
      color:0x78cbd5,metalness:0.58,roughness:0.16,
      transparent:true,opacity:0.48,side:THREE.DoubleSide
    });
    const glow = new THREE.MeshBasicMaterial({color:0x9cf3e8});
    const engineGlow = new THREE.MeshBasicMaterial({color:0xffa35c});

    function box(w,h,d,material,x,y,z,rz=0){
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
      mesh.position.set(x,y,z);mesh.rotation.z=rz;rv.add(mesh);return mesh;
    }
    function cylinder(radiusTop,radiusBottom,length,material,x,y,z,axis="z"){
      const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radiusTop,radiusBottom,length,12),material);
      mesh.position.set(x,y,z);
      if(axis==="z")mesh.rotation.x=Math.PI/2;
      if(axis==="x")mesh.rotation.z=Math.PI/2;
      rv.add(mesh);return mesh;
    }

    // Broad, friendly motorhome body: rounded corners are approximated with
    // layered low-poly volumes so the silhouette reads clearly at distance.
    box(5.35,3.55,10.2,ivory,0,0.05,0.55);
    box(5.62,0.48,10.45,cream,0,-1.78,0.55);
    box(5.58,0.38,10.35,teal,0,-1.42,0.55);
    box(5.5,0.34,10.4,orange,0,-1.16,0.55);
    box(5.62,0.42,10.55,cream,0,1.94,0.55);

    // Forward cab and panoramic windshield.
    box(5.05,3.05,4.2,ivory,0,0.32,-3.15);
    box(4.42,1.92,0.13,glass,0,1.05,-5.29);
    box(0.12,2.02,0.16,darkTrim,0,1.05,-5.35);
    box(4.55,0.12,0.16,teal,0,2.06,-5.34);
    box(4.55,0.12,0.16,orange,0,0.04,-5.34);
    for(const side of [-1,1]){
      box(0.12,1.52,2.35,glass,side*2.58,0.95,-2.72);
      box(0.16,1.7,2.52,teal,side*2.64,0.95,-2.72);
      // Rear cabin windows.
      box(0.12,1.18,1.65,glass,side*2.58,0.9,0.45);
      box(0.16,1.34,1.82,cream,side*2.64,0.9,0.45);
    }

    // Decorative retro touring stripes and roof equipment.
    box(5.68,0.13,8.9,teal,0,1.72,0.7);
    box(5.72,0.12,6.8,orange,0,1.84,1.1);
    box(2.5,0.18,3.2,darkTrim,0,2.2,1.15);
    for(const x of [-0.78,0.78]){
      box(0.16,0.08,2.4,glow,x,2.34,1.15);
    }
    const antenna=cylinder(0.045,0.065,1.35,darkTrim,1.95,2.55,3.6,"y");
    const antennaTip=new THREE.Mesh(new THREE.SphereGeometry(0.13,8,6),glow);
    antennaTip.position.set(1.95,3.25,3.6);rv.add(antennaTip);

    // Short swept wings and engine pods give the RV a recognizable flying
    // silhouette without turning it into a generic fighter.
    for(const side of [-1,1]){
      const wing=box(5.3,0.28,3.9,teal,side*5.05,-0.72,1.05,side*-0.08);
      wing.geometry.translate(side*0.25,0,0);
      box(3.15,0.13,0.24,orange,side*5.0,-0.51,1.12,side*-0.08);
      cylinder(0.82,0.98,5.1,darkTrim,side*5.65,-0.35,3.1);
      cylinder(0.66,0.74,0.22,teal,side*5.65,-0.35,0.52);
      const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(0.58,0.72,0.34,12),darkTrim);
      nozzle.rotation.x=Math.PI/2;nozzle.position.set(side*5.65,-0.35,5.72);rv.add(nozzle);
      const exhaust=new THREE.Mesh(new THREE.ConeGeometry(0.49,1.35,12),engineGlow);
      exhaust.rotation.x=-Math.PI/2;exhaust.position.set(side*5.65,-0.35,6.48);exhaust.visible=false;rv.add(exhaust);
      group.userData.engineEffects=group.userData.engineEffects||[];group.userData.engineEffects.push(exhaust);
      // Landing wheels and chunky shock struts.
      cylinder(0.22,0.22,0.82,darkTrim,side*2.25,-2.02,-2.9,"y");
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(0.52,0.52,0.32,10),darkTrim);
      wheel.rotation.z=Math.PI/2;wheel.position.set(side*2.25,-2.43,-2.9);rv.add(wheel);
      cylinder(0.18,0.18,0.72,darkTrim,side*2.25,-2.0,3.55,"y");
      const rearWheel=new THREE.Mesh(new THREE.CylinderGeometry(0.44,0.44,0.3,10),darkTrim);
      rearWheel.rotation.z=Math.PI/2;rearWheel.position.set(side*2.25,-2.37,3.55);rv.add(rearWheel);
      // Marker lamps.
      const lamp=new THREE.Mesh(new THREE.SphereGeometry(0.19,8,6),glow);
      lamp.position.set(side*2.2,0.55,-5.42);rv.add(lamp);
    }

    // Vertical tail fin and rear boarding ramp. The ramp is a visual
    // placeholder for the later walkable interior/boarding implementation.
    box(0.34,2.3,2.25,orange,0,2.0,4.25);
    box(3.5,0.22,2.5,cream,0,-1.88,6.0,-0.22);
    for(let step=0;step<3;step++)box(3.35,0.1,0.42,teal,0,-2.04-step*0.13,6.55+step*0.43);

    // Visible cabin furniture and reserved crew stations. The pilot and
    // co-pilot anchors are deliberately named for future passenger binding.
    function makeSeat(name,x,z){
      const seat=new THREE.Group();seat.name=name;seat.position.set(x,-0.78,z);rv.add(seat);
      const base=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.24,1.05),darkTrim);base.position.set(0,0.12,0);seat.add(base);
      const back=new THREE.Mesh(new THREE.BoxGeometry(1.0,1.05,0.22),cream);back.position.set(0,0.68,0.36);seat.add(back);
      const head=new THREE.Mesh(new THREE.BoxGeometry(0.56,0.32,0.2),orange);head.position.set(0,1.34,0.34);seat.add(head);
      return seat;
    }
    const pilotSeat=makeSeat("KR_SEAT_PILOT",-0.88,-2.68);
    const copilotSeat=makeSeat("KR_SEAT_COPILOT",0.88,-2.68);
    const gunnerSeat=makeSeat("KR_SEAT_GUNNER",0,1.65);
    group.userData.seatAnchors={pilot:pilotSeat,copilot:copilotSeat,gunner:gunnerSeat};
    group.userData.vehicleType="space-rv";
    group.userData.interiorPlanned=true;

    // Instrument panel and steering yoke.
    box(4.25,0.38,0.62,darkTrim,0,0.2,-4.42);
    for(const x of [-1.3,-0.45,0.45,1.3]){
      const display=new THREE.Mesh(new THREE.BoxGeometry(0.58,0.25,0.045),new THREE.MeshBasicMaterial({color:x===-0.45?0x6ddbd0:0xe6a15c}));
      display.position.set(x,0.49,-4.52);rv.add(display);
    }
    for(const side of [-1,1]){
      const yoke=new THREE.Mesh(new THREE.TorusGeometry(0.22,0.055,6,12),darkTrim);
      yoke.position.set(side*0.88,0.28,-3.92);rv.add(yoke);
    }

    // Docking lights and small retro-futurist details.
    for(const side of [-1,1]){
      const beacon=new THREE.Mesh(new THREE.SphereGeometry(0.16,8,6),side<0?orange:glow);
      beacon.position.set(side*2.7,1.98,4.9);rv.add(beacon);
    }

    // Keep the same world placement and flight root used by the approved
    // spacecraft controller; only the visual vehicle is replaced.
    group.position.set(0,0,-390);
    scene.add(group);
    return group;
  }

  // ============================================================
  // LOCAL GLB MODEL WORKSHOP
  // User-selected GLB files are parsed locally in this browser.
  // No upload, server, or external model URL is required.
  // ============================================================

  function disposeWorkshopObject(object) {
    if (!object) return;
    object.traverse(node => {
      if (node.geometry && typeof node.geometry.dispose === "function") node.geometry.dispose();
      if (node.material) {
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach(material => {
          if (material && typeof material.dispose === "function") material.dispose();
        });
      }
    });
    if (object.parent) object.parent.remove(object);
    modularModels.instances.delete(object);
  }

  function createWorkshopControl(labelText, input) {
    const wrap = document.createElement("label");
    Object.assign(wrap.style, {display:"flex",flexDirection:"column",gap:"3px",font:"10px monospace",color:"#c5e1df",minWidth:"70px",flex:"1 1 70px"});
    const label = document.createElement("span");
    label.textContent = labelText;
    Object.assign(input.style,{boxSizing:"border-box",width:"100%",padding:"7px",border:"1px solid rgba(129,178,190,.45)",borderRadius:"4px",background:"#101d2b",color:"#f0f5f8",font:"12px monospace"});
    wrap.append(label,input);
    return wrap;
  }

  function createWorkshopButton(label, primary) {
    const button=document.createElement("button");
    button.type="button";
    button.textContent=label;
    Object.assign(button.style,{
      padding:"9px 11px",border:"1px solid "+(primary?"#e5b86b":"rgba(129,178,190,.5)"),
      borderRadius:"4px",background:primary?"#6b4c22":"#172a39",
      color:"#fff1d2",font:"bold 10px monospace",cursor:"pointer"
    });
    return button;
  }

  function createModelWorkshop() {
    if (modelWorkshopButton || !actionButtons) return;
    modelWorkshopButton=createWorkshopButton("MODEL WORKSHOP",false);
    modelWorkshopButton.addEventListener("click",()=> {
      if(modelWorkshopPanel) modelWorkshopPanel.style.display=modelWorkshopPanel.style.display==="none"?"block":"none";
    });
    placeTopAction(modelWorkshopButton);

    const panel=document.createElement("section");
    modelWorkshopPanel=panel;
    Object.assign(panel.style,{
      position:"absolute",top:"66px",right:"12px",width:"min(390px,calc(100% - 24px))",
      maxHeight:"calc(100% - 90px)",overflowY:"auto",boxSizing:"border-box",
      padding:"13px",border:"1px solid rgba(129,178,190,.55)",borderRadius:"7px",
      background:"rgba(5,14,24,.96)",color:"#e7f1f5",font:"11px/1.4 monospace",
      zIndex:"120",pointerEvents:"auto",boxShadow:"0 8px 30px rgba(0,0,0,.45)",display:"none"
    });
    const heading=document.createElement("div");
    heading.textContent="KEPLER REACH // MODEL WORKSHOP";
    Object.assign(heading.style,{font:"bold 12px monospace",color:"#ffe0a6",marginBottom:"7px"});
    panel.appendChild(heading);
    const intro=document.createElement("p");
    intro.textContent="Import a .GLB from your device. It is parsed locally; no upload or server is used. The procedural ship remains as a fallback until you apply a model.";
    Object.assign(intro.style,{margin:"0 0 10px",color:"#b8cbd4"});
    panel.appendChild(intro);

    const file=document.createElement("input");
    file.type="file";file.accept=".glb,model/gltf-binary";
    Object.assign(file.style,{display:"block",width:"100%",boxSizing:"border-box",font:"10px monospace",color:"#dce8ed",marginBottom:"10px"});
    panel.appendChild(file);

    const controls=document.createElement("div");
    Object.assign(controls.style,{display:"flex",gap:"7px",flexWrap:"wrap",marginBottom:"9px"});
    const sizeInput=document.createElement("input");sizeInput.type="number";sizeInput.min="1";sizeInput.max="200";sizeInput.step="1";sizeInput.value="18";
    const rx=document.createElement("input");rx.type="number";rx.step="5";rx.value="0";
    const ry=document.createElement("input");ry.type="number";ry.step="5";ry.value="0";
    const rz=document.createElement("input");rz.type="number";rz.step="5";rz.value="0";
    controls.append(
      createWorkshopControl("LENGTH / SIZE",sizeInput),
      createWorkshopControl("ROTATE X °",rx),
      createWorkshopControl("ROTATE Y °",ry),
      createWorkshopControl("ROTATE Z °",rz)
    );
    panel.appendChild(controls);

    const status=document.createElement("div");
    modelWorkshopStatus=status;
    status.textContent="No model loaded. Choose spaceship-one.glb to begin.";
    Object.assign(status.style,{padding:"8px",marginBottom:"9px",background:"rgba(40,65,77,.45)",borderRadius:"4px",color:"#c5e1df",overflowWrap:"anywhere"});
    panel.appendChild(status);

    const actions=document.createElement("div");
    Object.assign(actions.style,{display:"flex",gap:"7px",flexWrap:"wrap"});
    const apply=createWorkshopButton("APPLY AS PLAYER SHIP",true);
    const remove=createWorkshopButton("REMOVE PREVIEW",false);
    const close=createWorkshopButton("CLOSE",false);
    actions.append(apply,remove,close);
    panel.appendChild(actions);
    root.appendChild(panel);

    modelWorkshopInputs={size:sizeInput,rx,ry,rz};

    function updatePreviewTransform() {
      if(!modelWorkshopPreview)return;
      const size=Math.max(1,Math.min(200,Number(sizeInput.value)||18));
      modelWorkshopPreview.scale.setScalar(size/18);
      modelWorkshopPreview.rotation.set(
        THREE.MathUtils.degToRad(Number(rx.value)||0),
        THREE.MathUtils.degToRad(Number(ry.value)||0),
        THREE.MathUtils.degToRad(Number(rz.value)||0)
      );
    }
    [sizeInput,rx,ry,rz].forEach(input=>input.addEventListener("input",updatePreviewTransform));

    file.addEventListener("change",async()=>{
      const selected=file.files&&file.files[0];
      if(!selected)return;
      if(!/\.glb$/i.test(selected.name)){
        status.textContent="Please choose a binary .GLB file. External .gltf sidecar assets are not supported by this local importer.";
        file.value="";
        return;
      }
      status.textContent="Loading "+selected.name+" …";
      try{
        const loader=await getGLTFLoader();
        const buffer=await selected.arrayBuffer();
        const gltf=await new Promise((resolve,reject)=>{
          loader.parse(buffer,"",resolve,reject);
        });
        if(destroyed)throw new Error("Kepler Reach was closed during import.");
        if(!gltf||!gltf.scene)throw new Error("The selected GLB has no scene.");
        if(modelWorkshopPreview)disposeWorkshopObject(modelWorkshopPreview);
        const spec={
          id:"local-player-ship-"+Date.now(),
          url:"local-file://"+encodeURIComponent(selected.name),
          targetSize:18,center:true,rotation:[0,0,0],
          license:"User supplied; verify source license",
          attribution:"Imported locally by the player"
        };
        modelWorkshopPreview=normalizeModularModel(gltf.scene,spec);
        modelWorkshopPreview.userData.animations=Array.isArray(gltf.animations)?gltf.animations:[];
        const bounds=new THREE.Box3().setFromObject(modelWorkshopPreview);
        const dimensions=new THREE.Vector3();bounds.getSize(dimensions);
        modelWorkshopPreview.position.copy(ship.position).add(new THREE.Vector3(24,0,0));
        scene.add(modelWorkshopPreview);
        updatePreviewTransform();
        status.textContent="PREVIEW READY: "+selected.name+" // normalized size "+dimensions.x.toFixed(1)+" × "+dimensions.y.toFixed(1)+" × "+dimensions.z.toFixed(1)+" units. Adjust orientation/size, then apply.";
      }catch(error){
        status.textContent="IMPORT FAILED: "+(error&&error.message?error.message:String(error));
        console.error("[Kepler Reach] Local GLB import failed:",error);
      }
    });

    apply.addEventListener("click",()=>{
      if(!modelWorkshopPreview){status.textContent="Choose a GLB and wait for the preview to finish loading first.";return;}
      if(activeShipModel)disposeWorkshopObject(activeShipModel);
      if(modelWorkshopPreview.parent)modelWorkshopPreview.parent.remove(modelWorkshopPreview);
      modelWorkshopPreview.position.set(0,0,0);
      // Preserve the workshop size and orientation adjustments when parenting to the ship root.
      shipVisualRoot.add(modelWorkshopPreview);
      if(shipProceduralVisual)shipProceduralVisual.visible=false;
      activeShipModel=modelWorkshopPreview;
      modelWorkshopPreview=null;
      status.textContent="APPLIED. The imported GLB is now the player spacecraft for this session. The original flight, landing and camera root remains unchanged.";
      setStatus("PLAYER SPACECRAFT MODEL APPLIED");
    });

    remove.addEventListener("click",()=>{
      if(modelWorkshopPreview)disposeWorkshopObject(modelWorkshopPreview);
      modelWorkshopPreview=null;
      status.textContent="Preview removed. The current player ship is unchanged.";
    });
    close.addEventListener("click",()=>{panel.style.display="none";});
  }

  // ============================================================
  // PROCEDURAL ORBITAL STATION
  // ============================================================

  function createStation() {
    setStatus("CONSTRUCTING ORBITAL STATION");

    const stationGroup = new THREE.Group();

    // Main station core

    const stationCore=makeBox(18,9,25,0x788c9d);stationCore.userData.krSolidCollider=true;stationGroup.add(stationCore);

    // Central tower

    const tower = makeBox(
      7, 17, 7, 0x9aabb8
    );

    tower.position.y = 11;tower.userData.krSolidCollider=true;

    stationGroup.add(tower);

    // Rotating station ring

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(
        24, 1.2, 6, 48
      ),
      makeMaterial(0x8ba4b9, {
        metalness: 0.8
      })
    );

    ring.rotation.x = Math.PI / 2;

    stationGroup.add(ring);
    stationRing = ring;

    // Docking arms

    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2;

      const dock = makeBox(
        5, 4, 18, 0x536b7d
      );

      dock.userData.krSolidCollider=true;
      dock.position.set(
        Math.cos(angle) * 18,
        0,
        Math.sin(angle) * 18
      );

      dock.rotation.y = -angle;

      stationGroup.add(dock);
    }

    // Far side of Haven, opposite the moon's +X orbital position.
    // The truck-stop apron now sits clear of Haven's planetary surface.
    stationGroup.position.set(
      -310, 25, -650
    );

    scene.add(stationGroup);

    station = stationGroup;

    return stationGroup;
  }


  function createSolarHabitatStation(){
    const orbitRoot=new THREE.Group();orbitRoot.name='KR_SOLAR_HABITAT_ORBIT';orbitRoot.position.set(-500,180,-1350);scene.add(orbitRoot);solarHabitatOrbit=orbitRoot;
    const g=new THREE.Group();g.name='KR_SOLAR_HABITAT_STATION';g.position.set(260,0,0);orbitRoot.add(g);solarHabitatStation=g;
    const metal=new THREE.MeshStandardMaterial({color:0x667d8c,metalness:.78,roughness:.32}),ivory=new THREE.MeshStandardMaterial({color:0xd9d1bd,metalness:.34,roughness:.54}),blue=new THREE.MeshStandardMaterial({color:0x347f91,metalness:.55,roughness:.34}),glass=new THREE.MeshStandardMaterial({color:0x7bd5e4,metalness:.25,roughness:.16,transparent:true,opacity:.20,side:THREE.DoubleSide}),amber=new THREE.MeshBasicMaterial({color:0xffc36f}),dark=new THREE.MeshStandardMaterial({color:0x263a48,metalness:.5,roughness:.5});
    function box(w,h,d,m,x,y,z,solid=true,parent=g){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);if(solid)o.userData.krSolidCollider=true;parent.add(o);return o;}
    function cyl(rt,rb,h,m,x,y,z,n=16,parent=g){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n),m);o.position.set(x,y,z);parent.add(o);return o;}
    cyl(8.5,10,16,ivory,0,0,0,20).userData.krSolidCollider=true;
    const habitat=new THREE.Group();habitat.name='KR_SOLAR_HABITAT_ROTATING_RING';g.add(habitat);solarHabitatRing=habitat;
    const deck=new THREE.Mesh(new THREE.RingGeometry(27,35,72),dark);deck.rotation.x=-Math.PI/2;deck.userData.krSolidCollider=true;habitat.add(deck);
    const shell=new THREE.Mesh(new THREE.TorusGeometry(31,3.7,8,72),metal);shell.rotation.x=Math.PI/2;shell.position.y=3.4;habitat.add(shell);
    for(const radius of [27,35]){const rail=new THREE.Mesh(new THREE.TorusGeometry(radius,.32,6,72),amber);rail.rotation.x=Math.PI/2;rail.position.y=1.1;habitat.add(rail);}
    for(let i=0;i<16;i++){const a=i*Math.PI*2/16,x=Math.cos(a)*31,z=Math.sin(a)*31;const win=new THREE.Mesh(new THREE.BoxGeometry(5,2.5,.18),glass);win.position.set(x,4.8,z);win.rotation.y=-a;habitat.add(win);}
    for(let i=0;i<4;i++){const a=i*Math.PI/2,spoke=box(2.4,2.4,25,metal,Math.cos(a)*18,0,Math.sin(a)*18,false,g);spoke.rotation.y=-a;}
    const sign=box(22,3,.5,blue,0,8,-39,false),cv=document.createElement('canvas');cv.width=512;cv.height=96;const cx=cv.getContext('2d');cx.fillStyle='#173346';cx.fillRect(0,0,512,96);cx.fillStyle='#f5d69a';cx.font='bold 40px monospace';cx.textAlign='center';cx.fillText('SOLAR COMMONS',256,62);sign.material=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv),side:THREE.DoubleSide});

    // The outside dock is deliberately broad and level. A connecting apron
    // leads from the landing pads to the separate enclosed biosphere.
    box(116,.9,300,dark,104,5,45);for(const z of [-104,194])box(116,.22,1.2,blue,104,5.55,z,false);for(const x of [46,162])box(1,.22,300,blue,x,5.55,45,false);
    for(const x of [76,112,148]){box(25,.16,27,metal,x,5.56,0,false);for(const z of [-12,12])box(25,.12,.24,amber,x,5.7,z,false);for(const side of [-1,1])box(.24,.12,27,amber,x+side*12.2,5.7,0,false);cyl(.28,.38,2.8,amber,x,7.2,-16,8);const lamp=new THREE.PointLight(0xffbd70,.9,22);lamp.position.set(x,9,-16);g.add(lamp);}
    const launch=new THREE.Mesh(new THREE.TorusGeometry(5,.32,8,40),amber);launch.rotation.x=Math.PI/2;launch.position.set(155,6.1,0);g.add(launch);cyl(.18,.28,10,ivory,155,10,0,8);const beacon=new THREE.PointLight(0x78d9ef,1.8,38);beacon.position.set(155,16,0);g.add(beacon);
    const plate=box(28,3,.5,blue,104,9,-46,false),pc=document.createElement('canvas');pc.width=512;pc.height=96;const pctx=pc.getContext('2d');pctx.fillStyle='#173346';pctx.fillRect(0,0,512,96);pctx.fillStyle='#f5d69a';pctx.font='bold 34px monospace';pctx.textAlign='center';pctx.fillText('SOLAR COMMONS // DOCK',256,62);plate.material=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(pc),side:THREE.DoubleSide});

    // SOLAR COMMONS BIOSPHERE: a geodesic glass dome, physically distinct
    // from The Last Stop's industrial diner and truck-stop apron.
    const dome=new THREE.Group();dome.name='KR_SOLAR_COMMONS_GEODOME';dome.position.set(104,5.9,104);g.add(dome);
    // True triangular geodesic hemisphere: subdivided icosahedron, glass panels and shared struts.
    const phi=(1+Math.sqrt(5))/2;
    const gv=[[-1,phi,0],[1,phi,0],[-1,-phi,0],[1,-phi,0],[0,-1,phi],[0,1,phi],[0,-1,-phi],[0,1,-phi],[phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]].map(v=>new THREE.Vector3(...v).normalize());
    let gf=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
    for(let level=0;level<2;level++){const cache=new Map(),mid=(a,b)=>{const k=a<b?a+":"+b:b+":"+a;if(cache.has(k))return cache.get(k);const id=gv.push(gv[a].clone().add(gv[b]).normalize())-1;cache.set(k,id);return id;};const next=[];for(const f of gf){const [a,b,c]=f,ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);next.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]);}gf=next;}
    const faces=gf.filter(f=>f.every(i=>gv[i].y>=-0.0001)),positions=[],edges=new Set();
    const panelMat=new THREE.MeshStandardMaterial({color:0x8bd8e4,metalness:.12,roughness:.22,transparent:true,opacity:.105,side:THREE.DoubleSide,depthWrite:false});
    const strutMat=new THREE.MeshStandardMaterial({color:0x8fd5d0,metalness:.62,roughness:.32});
    for(const f of faces){const [a,b,c]=f.map(i=>gv[i].clone().multiplyScalar(30));positions.push(...a.toArray(),...b.toArray(),...c.toArray());
      for(const [u,v] of [[f[0],f[1]],[f[1],f[2]],[f[2],f[0]]]){const key=u<v?u+":"+v:v+":"+u;if(edges.has(key))continue;edges.add(key);const p=gv[u].clone().multiplyScalar(30),q=gv[v].clone().multiplyScalar(30),axis=q.clone().sub(p),len=axis.length(),bar=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,len,6),strutMat);bar.position.copy(p).add(q).multiplyScalar(.5);bar.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize());bar.userData.krGeodesicStrut=true;dome.add(bar);}
    }
    const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));pg.computeVertexNormals();
    const domeGlass=new THREE.Mesh(pg,panelMat);domeGlass.name='KR_GEODOME_TRIANGULAR_GLASS_PANELS';dome.add(domeGlass);
    const wire=new THREE.Group();wire.name='KR_GEODOME_GEODESIC_FRAME';wire.userData.triangleCount=faces.length;wire.userData.strutCount=edges.size;dome.add(wire);
    const baseRing=new THREE.Mesh(new THREE.TorusGeometry(30,.48,8,96),ivory);baseRing.rotation.x=Math.PI/2;baseRing.position.y=.15;dome.add(baseRing);
    const innerRing=new THREE.Mesh(new THREE.TorusGeometry(25,.16,6,96),new THREE.MeshStandardMaterial({color:0x7cc9bd,metalness:.4,roughness:.4}));innerRing.rotation.x=Math.PI/2;innerRing.position.y=.22;dome.add(innerRing);
    const biosphereFloor=new THREE.Mesh(new THREE.CircleGeometry(29.4,64),new THREE.MeshStandardMaterial({color:0x385d4b,roughness:.95,side:THREE.DoubleSide}));biosphereFloor.rotation.x=-Math.PI/2;biosphereFloor.position.y=.04;dome.add(biosphereFloor);
    const pathMat=new THREE.MeshStandardMaterial({color:0xc6ad7c,roughness:.9});
    const path=new THREE.Mesh(new THREE.RingGeometry(3.4,5.2,48),pathMat);path.rotation.x=-Math.PI/2;path.position.set(0,.07,0);dome.add(path);
    const centralPool=new THREE.Mesh(new THREE.CircleGeometry(3.1,32),new THREE.MeshStandardMaterial({color:0x49a9b4,metalness:.2,roughness:.18,side:THREE.DoubleSide}));centralPool.rotation.x=-Math.PI/2;centralPool.position.y=.09;dome.add(centralPool);
    const poolRim=new THREE.Mesh(new THREE.TorusGeometry(3.2,.18,8,40),ivory);poolRim.rotation.x=Math.PI/2;poolRim.position.y=.15;dome.add(poolRim);

    // Broad-leaf alien trees and colorful undergrowth. All geometry is
    // intentionally lightweight and generated locally; no external assets.
    const leafMats=[new THREE.MeshStandardMaterial({color:0x62b96e,roughness:.86}),new THREE.MeshStandardMaterial({color:0x91c75b,roughness:.86}),new THREE.MeshStandardMaterial({color:0x4caaa0,roughness:.86}),new THREE.MeshStandardMaterial({color:0xb0a3d8,roughness:.8})];
    const bark=new THREE.MeshStandardMaterial({color:0x80624c,roughness:1}),flower=new THREE.MeshStandardMaterial({color:0xe8a2bf,roughness:.75});
    const plants=[];
    function makeTree(x,z,scale,phase){
      const tree=new THREE.Group();tree.userData.krPhysicsProfile={kind:"plant",massKg:Math.max(12,scale*95),densityKgM3:650,structuralStrength:.8,material:"living-wood"};tree.position.set(x,.08,z);tree.scale.setScalar(scale);dome.add(tree);
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.28,.48,5.8,7),bark);trunk.position.y=2.9;tree.add(trunk);
      for(let j=0;j<7;j++){const a=j*Math.PI*2/7,leaf=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),leafMats[j%leafMats.length]);leaf.scale.set(1.35,.42,.58);leaf.position.set(Math.cos(a)*1.15,4.2+Math.sin(j*2)*.28,Math.sin(a)*1.15);leaf.rotation.y=-a;tree.add(leaf);}
      const crown=new THREE.Mesh(new THREE.SphereGeometry(1.25,9,7),leafMats[(phase|0)%leafMats.length]);crown.scale.set(1.1,.75,1.1);crown.position.y=5.1;tree.add(crown);plants.push({group:tree,phase,kind:'tree'});
    }
    for(const p of [[-17,-12,1.0,0],[17,-13,.9,1],[-18,14,.82,2],[18,15,1.05,3],[0,21,.72,1]])makeTree(...p);
    for(let i=0;i<26;i++){
      const a=i*2.399,r=8+(i%5)*3.5,x=Math.cos(a)*r,z=Math.sin(a)*r;
      const plant=new THREE.Group();plant.userData.krPhysicsProfile={kind:"plant",massKg:2.5,densityKgM3:650,structuralStrength:.25,material:"living-fibre"};plant.position.set(x,.08,z);dome.add(plant);
      const stem=new THREE.Mesh(new THREE.CylinderGeometry(.07,.13,1.25,6),leafMats[i%leafMats.length]);stem.position.y=.62;plant.add(stem);
      for(let j=0;j<5;j++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.55,7,5),leafMats[(i+j)%leafMats.length]);leaf.scale.set(1.25,.22,.42);leaf.position.set(Math.cos(j*1.256)*.55,.55+j*.08,Math.sin(j*1.256)*.55);leaf.rotation.y=j*1.256;plant.add(leaf);}
      if(i%3===0){const bloom=new THREE.Mesh(new THREE.SphereGeometry(.28,8,6),flower);bloom.position.y=1.3;plant.add(bloom);}
      plants.push({group:plant,phase:i*.71,kind:'fern'});
    }

    // Small alien wildlife: grazing six-legged grazers, hopping puffballs,
    // and a pair of slow gliding ray-creatures under the dome.
    const animals=[];
    const animalMats=[new THREE.MeshStandardMaterial({color:0xd58b56,roughness:.82}),new THREE.MeshStandardMaterial({color:0x8f9fce,roughness:.82}),new THREE.MeshStandardMaterial({color:0xb7c56d,roughness:.82})];
    function makeAnimal(kind,x,z,phase){
      const animal=new THREE.Group();animal.name='KR_SOLAR_BIOSPHERE_'+kind.toUpperCase();animal.userData.krPhysicsProfile={kind:"animal",massKg:kind==="grazer"?72:(kind==="hopper"?18:12),densityKgM3:980,structuralStrength:.55,material:"living"};animal.position.set(x,.1,z);dome.add(animal);
      const body=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),animalMats[animals.length%animalMats.length]);body.scale.set(kind==='grazer'?1.25:.85,.68,kind==='grazer'?.82:.72);body.position.y=1.05;animal.add(body);
      const head=new THREE.Mesh(new THREE.SphereGeometry(.48,9,7),animalMats[(animals.length+1)%animalMats.length]);head.position.set(0,1.28,-.78);animal.add(head);
      const eyeMat=new THREE.MeshBasicMaterial({color:0x17232a});for(const side of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.075,6,5),eyeMat);eye.position.set(side*.29,1.38,-1.12);animal.add(eye);}
      const legs=[];for(let j=0;j<(kind==='grazer'?6:4);j++){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,.65,6),dark);const side=j%2?1:-1,along=Math.floor(j/2)-1;leg.position.set(side*.48,.38,along*.48);animal.add(leg);legs.push({mesh:leg,phase:j*Math.PI*.7});}
      if(kind==='hopper'){const ear=new THREE.Mesh(new THREE.ConeGeometry(.18,.8,6),animalMats[1]);ear.position.set(-.22,2,-.7);ear.rotation.z=-.22;animal.add(ear);const ear2=ear.clone();ear2.position.x=.22;ear2.rotation.z=.22;animal.add(ear2);}
      if(kind==='glider'){const wingMat=new THREE.MeshStandardMaterial({color:0x72c8c0,transparent:true,opacity:.8,side:THREE.DoubleSide});for(const side of [-1,1]){const wing=new THREE.Mesh(new THREE.SphereGeometry(1,9,6),wingMat);wing.scale.set(1.35,.08,.52);wing.position.set(side*1.15,1.35,0);wing.rotation.z=side*.16;animal.add(wing);}}
      animals.push({group:animal,kind,x,z,phase,legs});
    }
    makeAnimal('grazer',-10,-18,.3);makeAnimal('grazer',13,17,2.1);makeAnimal('hopper',-19,5,1.2);makeAnimal('hopper',18,-2,3.4);makeAnimal('glider',0,-13,.8);makeAnimal('glider',-5,19,2.7);

    // Three resident NPCs give the biosphere a lived-in research-outpost feel.
    const npcs=[];
    function makeNPC(name,x,z,coat,role,phase){
      const npc=new THREE.Group();npc.name='KR_SOLAR_COMMONS_NPC_'+name.toUpperCase();npc.userData.krNpc=true;npc.position.set(x,0,z);dome.add(npc);
      const skin=new THREE.MeshStandardMaterial({color:0x9aaf91,roughness:.85}),clothes=new THREE.MeshStandardMaterial({color:coat,roughness:.72}),boots=new THREE.MeshStandardMaterial({color:0x343b45,roughness:.8});
      const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.85,4,8),clothes);torso.position.y=1.25;npc.add(torso);
      const head=new THREE.Mesh(new THREE.SphereGeometry(.38,10,8),skin);head.position.y=2.05;npc.add(head);
      const visor=new THREE.Mesh(new THREE.SphereGeometry(.4,10,6,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0xd5b978,metalness:.35,roughness:.3}));visor.position.set(0,2.14,-.03);npc.add(visor);
      for(const side of [-1,1]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.13,.16,.7,7),boots);leg.position.set(side*.2,.38,0);npc.add(leg);const arm=new THREE.Mesh(new THREE.CylinderGeometry(.1,.13,.72,7),clothes);arm.position.set(side*.52,1.28,0);arm.rotation.z=side*.18;npc.add(arm);}
      const badge=new THREE.Mesh(new THREE.BoxGeometry(.28,.16,.035),amber);badge.position.set(.18,1.45,-.4);npc.add(badge);
      npc.userData.role=role;
      const dialogue={
        RHEA:["I'm Rhea, the station botanist. This dome is our living seed bank.","The tall silverleaf trees tolerate low light. Their roots stabilize the biosphere soil.","Please stay on the paths near the central pool. Some seedlings are delicate."],
        ORIN:["Orin. I look after the animals and keep their habitat healthy.","The grazers are calm, the hoppers are curious, and the gliders prefer the upper canopy.","Watch quietly for a moment. They behave more naturally when visitors give them room."],
        TAVI:["Welcome to Solar Commons. This is the quiet green heart of the station.","The landing apron is outside. Follow the illuminated path to reach this dome.","The station ring is still being commissioned. The biosphere is open for visitors."]
      };
      npcs.push({group:npc,name,phase,homeX:x,homeZ:z,dialogueLines:dialogue[name]||["Welcome to Solar Commons."]});
    }
    makeNPC('RHEA',-8,8,0x477f83,'BOTANIST',.4);
    makeNPC('ORIN',9,-7,0xb46d45,'WILDLIFE KEEPER',2.2);
    makeNPC('TAVI',-20,-3,0x7867a8,'STATION GUIDE',4.1);

    // Entry portal and a short illuminated path from the landing apron.
    const portal=new THREE.Group();portal.name='KR_GEODOME_ENTRY';portal.position.set(0,0,-29.2);dome.add(portal);
    const archMat=ivory;for(const side of [-1,1]){const post=new THREE.Mesh(new THREE.BoxGeometry(.55,4.8,.65),archMat);post.position.set(side*3,2.4,0);portal.add(post);}
    const lintel=new THREE.Mesh(new THREE.BoxGeometry(6.5,.55,.65),blue);lintel.position.y=4.8;portal.add(lintel);
    const entryGlow=new THREE.PointLight(0x78d9ef,1.5,18);entryGlow.position.set(0,3,-2);portal.add(entryGlow);
    const walkway=box(7,.18,44,pathMat,104,5.55,61,false);walkway.userData.krBiospherePath=true;
    for(const side of [-1,1]){box(.24,.4,44,amber,104+side*3.5,5.72,61,false);}
    const domeSign=box(24,3,.5,blue,104,10.2,70,false);const dc=document.createElement('canvas');dc.width=512;dc.height=96;const dctx=dc.getContext('2d');dctx.fillStyle='#173346';dctx.fillRect(0,0,512,96);dctx.fillStyle='#d7f0ce';dctx.font='bold 36px monospace';dctx.textAlign='center';dctx.fillText('SOLAR COMMONS BIOSPHERE',256,62);domeSign.material=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(dc),side:THREE.DoubleSide});

    g.userData.walkBounds={minX:42,maxX:164,minZ:-104,maxZ:194,floorY:5.9,launchX:42};
    g.userData.stationType='solar-habitat';g.userData.orbitRadius=260;
    const dockMarker=new THREE.Group();dockMarker.name='KR_SOLAR_COMMONS_LANDING_MARKER';dockMarker.position.set(112,6.15,0);g.add(dockMarker);
    const dockRing=new THREE.Mesh(new THREE.TorusGeometry(10,.34,8,48),amber);dockRing.rotation.x=Math.PI/2;dockMarker.add(dockRing);
    const dockInner=new THREE.Mesh(new THREE.TorusGeometry(6,.18,6,40),new THREE.MeshBasicMaterial({color:0x8fd9e7}));dockInner.rotation.x=Math.PI/2;dockMarker.add(dockInner);
    const dockBeacon=new THREE.Mesh(new THREE.CylinderGeometry(.18,.24,18,8),amber);dockBeacon.position.y=10;dockMarker.add(dockBeacon);
    const dockTip=new THREE.Mesh(new THREE.OctahedronGeometry(1.1,0),new THREE.MeshBasicMaterial({color:0xffe0a6}));dockTip.position.y=19;dockMarker.add(dockTip);
    solarCommonsLandingMarker=dockMarker;
    g.userData.biosphere={dome,animals,npcs,plants,geodesic:{triangles:faces.length,struts:edges.size}};
    return g;
  }

  function createLastStopDiner(stationGroup) {
    const diner=new THREE.Group();diner.name="KR_THE_LAST_STOP_DINER";stationGroup.add(diner);
    const mat=(c,m=.25,r=.65)=>new THREE.MeshStandardMaterial({color:c,metalness:m,roughness:r});
    const floor=mat(0x34434a,.5,.48),teal=mat(0x267f83,.45,.38),orange=mat(0xe17a45,.35,.46),cream=mat(0xe7d7b5),dark=mat(0x25333b,.55,.45);
    const glass=new THREE.MeshStandardMaterial({color:0x6ec6d4,metalness:.5,roughness:.2,transparent:true,opacity:.34,side:THREE.DoubleSide});
    const neon=new THREE.MeshBasicMaterial({color:0xff9a62});
    function box(w,h,d,m,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);if(h>=.68)o.userData.krSolidCollider=true;o.position.set(x,y,z);diner.add(o);return o;}
    function cyl(rt,rb,h,m,x,y,z,n=12){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n),m);o.position.set(x,y,z);diner.add(o);return o;}
    box(82,.8,58,floor,0,5,0);box(82,1,1,teal,0,5.6,-29);box(82,1,1,teal,0,5.6,29);box(1,1,58,teal,-41,5.6,0);
    // Continuous glass frontage with a central, automatic two-panel sliding door.
    box(1,1,20,teal,41,5.6,-19);box(1,1,20,teal,41,5.6,19);
    box(.18,7.8,6.7,glass,41,9.55,-5.35);box(.18,7.8,6.7,glass,41,9.55,5.35);
    const doorFrame=mat(0xd5a45b,.68,.3);
    box(.28,8,.35,orange,41.35,9.55,-8.95);box(.28,8,.35,orange,41.35,9.55,8.95);
    box(.35,.5,18.2,cream,41.35,13.55,0);
    const slidingDoor=new THREE.Group();slidingDoor.name="KR_LAST_STOP_GLASS_SLIDING_DOOR";slidingDoor.position.set(41.22,5.62,0);diner.add(slidingDoor);
    const leftPanel=new THREE.Mesh(new THREE.BoxGeometry(.14,6.65,2.02),glass);leftPanel.userData.krSolidCollider=true;leftPanel.position.set(0,3.33,-1.01);slidingDoor.add(leftPanel);
    const rightPanel=new THREE.Mesh(new THREE.BoxGeometry(.14,6.65,2.02),glass);rightPanel.userData.krSolidCollider=true;rightPanel.position.set(0,3.33,1.01);slidingDoor.add(rightPanel);
    for(const z of [-1,1]){const stile=new THREE.Mesh(new THREE.BoxGeometry(.2,6.75,.13),doorFrame);stile.position.set(.04,3.35,z*1.96);slidingDoor.add(stile);}
    const doorHandle=new THREE.Mesh(new THREE.SphereGeometry(.1,8,6),doorFrame);doorHandle.position.set(.18,3.2,0);slidingDoor.add(doorHandle);
    slidingDoor.userData={leftPanel,rightPanel,openAmount:0};diner.userData.entryDoor=slidingDoor;
    box(82,.7,58,dark,0,15,0);
    for(const x of [-30,-15,0,15,30]){box(11,7,.28,glass,x,10.2,-28.35);box(.22,7,.35,orange,x+5.5,10.2,-28.3);}
    for(const x of [-35,-21,-7,7,21,35]){box(.32,.4,57,cream,x,14.45,0);box(4.5,.12,1.1,neon,x,14.15,0);}
    box(28,4,.55,dark,0,12.5,-27.2);box(25,2.5,.12,neon,0,12.55,-27.58);
    box(31,1.1,3,teal,0,7.2,-13.5);box(31.4,.22,3.25,cream,0,7.86,-13.5);
    for(let x=-13;x<=13;x+=4.3){cyl(.62,.72,.28,orange,x,6.2,-9.7,10);cyl(.12,.12,1,dark,x,5.65,-9.7,8);}
    box(23,4.2,.7,dark,0,10.1,-20.5);box(18,.28,5.5,cream,0,8.3,-22.5);box(13,.35,4,dark,0,8.65,-22.5);
    for(let x=-5;x<=5;x+=2.5)box(1.1,.12,3.2,orange,x,8.9,-22.5);for(const x of [-8,8])cyl(.34,.5,5.5,dark,x,13,-21.5,10);
    box(27,.18,20,dark,18,5.52,13);
    for(let x=7;x<30;x+=4)for(let z=5;z<22;z+=4)box(3.8,.08,3.8,((Math.round(x/4)+Math.round(z/4))%2)?teal:orange,x,5.66,z);
    box(24,.8,4,dark,18,6,25);for(let x=8;x<=28;x+=5)box(.35,2.5,.35,neon,x,7.2,25);
    for(const z of [-2,7,17])for(const x of [-29,-19]){box(7,1.4,3.2,orange,x,6.6,z);box(5.4,.3,5.4,cream,x,7.35,z-2.4);cyl(.14,.18,1.4,dark,x,6,z-2.4,8);}
    // Keep the apron-to-diner route open: remove the old boxed-in hangar corridor.
    for(let z=-8;z<=8;z+=4)box(.5,.25,1.8,neon,41.45,7,z);
    // Level outdoor orbital truck-stop apron with three marked parking pads.
    const apronMat=mat(0x46545a,.58,.62),padMat=mat(0x26383f,.68,.42),lineMat=new THREE.MeshBasicMaterial({color:0xf0d6a0});
    box(116,.8,96,apronMat,96,5,0);
    box(116,.18,1.1,teal,96,5.48,-47.5);box(116,.18,1.1,teal,96,5.48,47.5);
    box(.9,.18,96,teal,38,5.48,0);box(.9,.18,96,teal,154,5.48,0);
    function parkingPad(x,label){
      box(25,.16,25,padMat,x,5.52,0);
      for(const side of [-1,1]){box(25,.09,.22,lineMat,x,5.66,side*11.8);box(.22,.09,25,lineMat,x+side*11.8,5.66,0);}
      const beacon=cyl(.22,.3,2.2,neon,x,6.7,-14,8);
      const lamp=new THREE.PointLight(0x83e8d7,.7,18);lamp.position.set(x,8,-14);diner.add(lamp);
      const marker=box(3,.12,.5,cream,x,5.72,14);marker.userData.parkingLabel=label;
    }
    parkingPad(82,"PLAYER RV");parkingPad(116,"DOCK 02");parkingPad(145,"DOCK 03");
    // Slim exterior jambs frame the glass entrance without obstructing the walkway.
    box(.28,8,.28,orange,41.4,9.5,-9.05);box(.28,8,.28,orange,41.4,9.5,9.05);
    box(.25,.2,13,neon,41.78,13.05,0);
    for(const x of [55,105,140]){cyl(.16,.24,8,dark,x,9.5,-39,8);const lamp=new THREE.PointLight(0xffc77d,1.2,26);lamp.position.set(x,14,-39);diner.add(lamp);cyl(.34,.34,.22,neon,x,13.65,-39,8);}
    diner.userData.exterior={name:"Last Stop Orbital Parking Apron",bounds:{minX:38,maxX:154,minZ:-47,maxZ:47},parkingPads:[82,116,145]};
    diner.userData.hangarPosition=new THREE.Vector3(82,7.3,0);
    function part(g,geo,m,x,y,z){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);g.add(o);return o;}
    // Beef, the grease-loving alien bear cook.
    const beef=new THREE.Group();beef.name="KR_NPC_BEEF";beef.userData.krNpc=true;beef.position.set(-5,5.92,-16);diner.add(beef);
    const fur=mat(0x79513b,.05,.95),fur2=mat(0xa97854,.05,.92),black=mat(0x24252a),apron=mat(0x303b3b),eye=mat(0xf2d8a0);
    part(beef,new THREE.CapsuleGeometry(.78,1,4,8),fur,0,1.15,0);part(beef,new THREE.SphereGeometry(.86,12,9),fur,0,2.45,-.08);
    for(const side of [-1,1]){part(beef,new THREE.SphereGeometry(.34,8,6),fur,side*.68,3,-.04);part(beef,new THREE.SphereGeometry(.18,8,6),fur2,side*.68,3,-.12);part(beef,new THREE.SphereGeometry(.11,8,6),eye,side*.32,2.55,-.78);part(beef,new THREE.SphereGeometry(.055,8,6),black,side*.32,2.55,-.88);const arm=part(beef,new THREE.CapsuleGeometry(.22,.7,3,7),fur,side*.9,1.75,-.12);arm.rotation.z=side*-.24;}
    part(beef,new THREE.SphereGeometry(.4,9,7),fur2,0,2.22,-.75);part(beef,new THREE.SphereGeometry(.18,8,6),black,0,2.35,-1.05);part(beef,new THREE.BoxGeometry(1.35,1.1,.16),apron,0,1,-.52);part(beef,new THREE.BoxGeometry(.6,.16,.12),cream,0,1.12,-.63);
    const pan=part(beef,new THREE.CylinderGeometry(.42,.42,.12,12),dark,1.25,1.55,-.3);pan.rotation.x=Math.PI/2;const handle=part(beef,new THREE.CylinderGeometry(.06,.06,.8,8),cream,1.65,1.55,-.3);handle.rotation.z=Math.PI/2;
    beef.rotation.y=Math.PI;beef.userData.characterName="Beef";beef.userData.role="Alien bear cook and bartender";beef.userData.personality="Loves grease";
    // Clovs, ebony 1960s-mod diner regular.
    const clovs=new THREE.Group();clovs.name="KR_NPC_CLOVS";clovs.userData.krNpc=true;clovs.position.set(18,5.75,11.2);diner.add(clovs);
    const skin=mat(0x633a2c,.05,.82),skinLight=mat(0x8b5842,.05,.8),hair=mat(0x171a25,.05,.52),dress=mat(0x35a7a1,.18,.48),white=mat(0xf1dfc5);
    part(clovs,new THREE.CapsuleGeometry(.42,.78,4,8),dress,0,1.05,0);part(clovs,new THREE.SphereGeometry(.37,12,9),skin,0,2.05,-.02);part(clovs,new THREE.SphereGeometry(.46,12,8),hair,0,2.35,.02);part(clovs,new THREE.SphereGeometry(.29,10,7),hair,0,2.62,.13);
    const clovsArms=[];
    for(const side of [-1,1]){part(clovs,new THREE.SphereGeometry(.105,8,6),skinLight,side*.37,2,-.03);part(clovs,new THREE.SphereGeometry(.045,8,6),white,side*.14,2.12,-.34);part(clovs,new THREE.SphereGeometry(.025,6,5),hair,side*.14,2.12,-.38);const arm=part(clovs,new THREE.CapsuleGeometry(.12,.58,3,7),skin,side*.5,1.48,-.02);arm.rotation.z=side*-.38;clovsArms.push({arm,side});part(clovs,new THREE.CapsuleGeometry(.13,.55,3,7),skin,side*.17,.28,0);part(clovs,new THREE.BoxGeometry(.36,.14,.55),white,side*.17,-.1,-.04);}
    part(clovs,new THREE.BoxGeometry(.72,.12,.08),white,0,1.58,-.32);part(clovs,new THREE.SphereGeometry(.055,8,6),orange,0,1.62,-.4);
    // Gold cross necklace.
    const gold=mat(0xd7ad43,.72,.28),chain=part(clovs,new THREE.TorusGeometry(.23,.025,5,20,Math.PI),gold,0,1.88,-.39);chain.rotation.z=Math.PI;
    part(clovs,new THREE.BoxGeometry(.11,.42,.075),gold,0,1.43,-.48);
    part(clovs,new THREE.BoxGeometry(.31,.105,.085),gold,0,1.49,-.49);
    clovs.userData.danceArms=clovsArms;
    clovs.userData.characterName="Clovs";clovs.userData.role="Diner regular and dance-floor enthusiast";clovs.userData.style="1960s mod";
    const jukebox=new THREE.Group();jukebox.name="KR_JUKEBOX";jukebox.position.set(33,5.7,20);diner.add(jukebox);const jbody=new THREE.Mesh(new THREE.BoxGeometry(2.1,3.8,1),dark);jbody.position.y=1.9;jukebox.add(jbody);const jglass=new THREE.Mesh(new THREE.BoxGeometry(1.65,1.6,.12),neon);jglass.position.set(0,2.55,-.56);jukebox.add(jglass);
    diner.userData.npcs={beef,clovs};diner.userData.name="The Last Stop";return diner;
  }
  // ============================================================
  // LAST STOP ORBITAL DOCK SCENE
  // ============================================================
  function createLastStopDockScene(stationGroup,diner) {
    const root=new THREE.Group();root.name="KR_LAST_STOP_DOCK_SCENE";stationGroup.add(root);
    const mat=(c,m=.18,r=.72)=>new THREE.MeshStandardMaterial({color:c,metalness:m,roughness:r});
    const cream=mat(0xe8d5ae),teal=mat(0x287f83,.42,.42),orange=mat(0xe87943,.28,.48),dark=mat(0x26343b,.42,.55),steel=mat(0x87949a,.72,.36),gold=mat(0xd9b04c,.7,.3);
    const glass=new THREE.MeshStandardMaterial({color:0x8bd8e3,transparent:true,opacity:.25,metalness:.25,roughness:.2,side:THREE.DoubleSide});
    const pink=mat(0xe78bb5,.08,.76),pinkLight=mat(0xf5b7d1,.04,.72),frog=mat(0x83a95c,.05,.82),black=mat(0x20272c,.12,.8),white=mat(0xf1e7d2),hair=mat(0xd9b76a,.05,.72);
    function mesh(g,geo,m,x,y,z){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);g.add(o);return o;}
    function box(g,w,h,d,m,x,y,z){const o=mesh(g,new THREE.BoxGeometry(w,h,d),m,x,y,z);if(h>=.72)o.userData.krSolidCollider=true;return o;}
    function sphere(g,r,m,x,y,z,n=12){return mesh(g,new THREE.SphereGeometry(r,n,8),m,x,y,z);}
    function cyl(g,r1,r2,hh,m,x,y,z,n=10){return mesh(g,new THREE.CylinderGeometry(r1,r2,hh,n),m,x,y,z);}
    function alien(name,skin,clothes,x,z,scale=1){const g=new THREE.Group();g.name=name;g.position.set(x,5.58,z);g.scale.setScalar(scale);root.add(g);mesh(g,new THREE.CapsuleGeometry(.42,.72,4,8),clothes,0,1.02,0);sphere(g,.43,skin,0,2.05,-.02);sphere(g,.12,skin,-.49,2.1,-.03);sphere(g,.12,skin,.49,2.1,-.03);for(const side of [-1,1]){sphere(g,.065,white,side*.16,2.12,-.39,8);sphere(g,.032,black,side*.16,2.12,-.45,8);const arm=mesh(g,new THREE.CapsuleGeometry(.105,.56,3,7),skin,side*.48,1.45,-.02);arm.rotation.z=side*-.28;mesh(g,new THREE.CapsuleGeometry(.12,.52,3,7),skin,side*.17,.25,0);}g.userData.characterName=name;return g;}
    // Seated alien patrons inside the diner booths.
    const patrons=[],skins=[mat(0x91b5a0),mat(0x9b8ac3),mat(0xc3a16c),mat(0x7eabbc),mat(0xb2a1a0),mat(0x91a45d)],outfits=[mat(0x385f78),mat(0x8a4f48),mat(0x5d7862),mat(0x8a6b9b),mat(0xc17b42),mat(0x43515a)],spots=[[-29,-2],[-19,-2],[-29,7],[-19,7],[-29,17],[-19,17]];
    for(let i=0;i<spots.length;i++){const [x,z]=spots[i],g=new THREE.Group();g.name="KR_DINER_PATRON_"+(i+1);g.userData.krNpc=true;g.position.set(x,5.7,z);diner.add(g);mesh(g,new THREE.CapsuleGeometry(.34,.58,3,7),outfits[i],0,.92,0);sphere(g,.35,skins[i],0,1.8,-.03);for(const side of [-1,1]){sphere(g,.055,white,side*.13,1.84,-.33,8);sphere(g,.026,black,side*.13,1.84,-.375,8);const arm=mesh(g,new THREE.CapsuleGeometry(.09,.45,3,6),skins[i],side*.38,1.22,-.08);arm.rotation.z=side*-.62;mesh(g,new THREE.CapsuleGeometry(.11,.5,3,6),outfits[i],side*.14,.25,.12);}box(g,2.4,.16,1.6,cream,0,1.22,-1.35);cyl(g,.12,.12,.25,orange,.65,1.42,-1.35,8);g.userData.phase=i*.83;patrons.push(g);}
    // Barred jail for Mia.
    const jail=new THREE.Group();jail.name="KR_LAST_STOP_JAIL";jail.position.set(58,5.58,-25);root.add(jail);
    box(jail,12,.45,10,dark,0,.22,0);box(jail,12,.35,10,teal,0,6.5,0);box(jail,12,5.8,.35,teal,0,3.35,-4.85);box(jail,.35,5.8,9,teal,-5.85,3.35,0);box(jail,.35,5.8,9,teal,5.85,3.35,0);
    for(let x=-4.9;x<=5;x+=1.15)cyl(jail,.065,.065,5.7,steel,x,3.35,4.75,8);
    // Proper jail frontage, readable sign, and simple prison furnishings.
    box(jail,5,.65,.22,dark,0,7.1,0);
    const signCanvas=document.createElement("canvas");signCanvas.width=768;signCanvas.height=192;
    const signCtx=signCanvas.getContext("2d");signCtx.fillStyle="#24343b";signCtx.fillRect(0,0,768,192);signCtx.strokeStyle="#e9b45c";signCtx.lineWidth=12;signCtx.strokeRect(8,8,752,176);
    signCtx.fillStyle="#f4e4bd";signCtx.font="bold 104px sans-serif";signCtx.textAlign="center";signCtx.textBaseline="middle";signCtx.fillText("SPACE JAIL",384,98);
    const signTexture=new THREE.CanvasTexture(signCanvas);const signMaterial=new THREE.MeshBasicMaterial({map:signTexture,side:THREE.DoubleSide});
    const jailSign=new THREE.Mesh(new THREE.PlaneGeometry(5.4,1.35),signMaterial);jailSign.position.set(0,7.15,5.12);jail.add(jailSign);
    // Bunk bed along the left wall.
    box(jail,3.2,.22,1.35,steel,-3.75,1.25,-1.35);box(jail,3.05,.32,1.2,mat(0xb9c6c8),-3.75,1.5,-1.35);
    box(jail,3.2,.12,.12,gold,-3.75,.78,-2.02);box(jail,.12,.9,1.35,steel,-5.25,1.05,-1.35);
    // Compact sink and toilet against the back wall.
    box(jail,1.25,.18,.85,steel,4.25,2.05,-3.65);cyl(jail,.2,.2,.5,white,4.25,1.72,-3.65,12);
    sphere(jail,.48,white,1.9,.75,-3.55);box(jail,.9,1.15,.55,white,1.9,1.35,-4.05);cyl(jail,.17,.17,.24,steel,1.9,1.96,-3.65,10);
    const mia=alien("KR_NPC_MIA",pink,pinkLight,0,0,.92);jail.add(mia);mia.position.set(0,.35,1.35);mia.rotation.y=Math.PI;sphere(mia,.18,pinkLight,-.2,2.43,-.04);sphere(mia,.18,pinkLight,.2,2.43,-.04);
    const miaSkirt=mesh(mia,new THREE.CylinderGeometry(.55,.72,.42,10),pinkLight,0,.65,0);miaSkirt.rotation.x=Math.PI/2;mia.userData.role="Pink humanoid troll alien prisoner";mia.userData.characterName="Mia";mia.userData.walkPhase=0;
    // Benis, frog-like humanoid sheriff.
    const benis=alien("KR_NPC_BENIS",frog,mat(0x76614b),68,-17,1.03);sphere(benis,.28,frog,-.25,2.48,-.02);sphere(benis,.28,frog,.25,2.48,-.02);sphere(benis,.12,white,-.25,2.52,-.25);sphere(benis,.12,white,.25,2.52,-.25);sphere(benis,.055,black,-.25,2.52,-.35);sphere(benis,.055,black,.25,2.52,-.35);cyl(benis,.48,.52,.2,mat(0x604b37),0,2.72,0);cyl(benis,.28,.34,.48,mat(0x604b37),0,2.98,0);sphere(benis,.13,gold,.24,1.85,-.38,8);benis.userData.role="Frog-like humanoid space sheriff";benis.userData.characterName="Benis";
    // Winged semi with rocket cargo booster.
    const truck=new THREE.Group();truck.name="KR_WINGED_SPACE_SEMI";truck.position.set(119,5.62,24);truck.rotation.y=-Math.PI/2;root.add(truck);
    box(truck,23,3.4,5.2,teal,0,3.1,0);box(truck,14,2.2,4.8,cream,4,5.85,0);box(truck,6.8,3.7,4.7,orange,-7.3,3.65,0);box(truck,4.7,2.1,4.35,teal,-7.3,5.8,0);box(truck,2.4,1.5,.12,glass,-7.3,5.85,-2.22);box(truck,2.4,1.5,.12,glass,-7.3,5.85,2.22);
    for(const x of [-9.4,-5.3,1.5,7.5])for(const side of [-1,1]){cyl(truck,.92,.92,.45,black,x,1.05,side*2.65,12).rotation.x=Math.PI/2;cyl(truck,.38,.38,.48,steel,x,1.05,side*2.68,12).rotation.x=Math.PI/2;}
    const ws=new THREE.Shape();ws.moveTo(-3,-2);ws.lineTo(7,-11);ws.lineTo(12,-12);ws.lineTo(8,-2);ws.lineTo(8,2);ws.lineTo(12,12);ws.lineTo(7,11);ws.lineTo(-3,2);ws.closePath();const wg=new THREE.ExtrudeGeometry(ws,{depth:.22,bevelEnabled:false});const wings=new THREE.Mesh(wg,orange);wings.rotation.x=Math.PI/2;wings.position.set(1,3.5,0);truck.add(wings);box(truck,4,.5,9,teal,10,4.3,0);cyl(truck,1.25,1.25,13,steel,3,7.1,0,12).rotation.z=Math.PI/2;cyl(truck,.05,1.25,2,orange,-4.5,7.1,0,12).rotation.z=-Math.PI/2;
    for(const side of [-1,1]){const fin=mesh(truck,new THREE.ConeGeometry(1.2,2.2,4),orange,7,7.1,side*1.1);fin.rotation.z=Math.PI/2;}
    // Refuelling pump, rig owner, and grey alien in blonde wig and go-go outfit.
    const owner=alien("KR_NPC_RIG_OWNER",mat(0xb5a18c),mat(0x394e60),101,13,1);owner.userData.role="Owner of the winged space rig, refuelling the truck";
    const pump=new THREE.Group();pump.name="KR_SPACE_FUEL_PUMP";pump.position.set(97,5.58,13);root.add(pump);box(pump,1.6,2.8,1.25,orange,0,1.4,0);box(pump,1.1,.55,.12,dark,0,2.1,-.66);box(pump,.7,.3,.08,glass,0,2.12,-.74);const hose=mesh(pump,new THREE.TorusGeometry(.48,.07,8,18,Math.PI*1.25),black,.92,1.25,.1);hose.rotation.z=Math.PI/2;box(pump,.16,.6,.16,steel,1.15,1.1,.1);box(pump,.22,.55,.22,gold,1.28,1.4,.08);
    owner.rotation.y=Math.PI/2;
    const woman=alien("KR_NPC_BLONDE_WIG_ALIEN",mat(0x858b8d),orange,105,10,.96);woman.userData.role="Grey alien wearing blonde wig, tube top and go-go skirt";sphere(woman,.48,hair,0,2.38,-.02);for(let i=0;i<9;i++){const a=i/9*Math.PI*2;sphere(woman,.2,hair,Math.cos(a)*.35,2.48,Math.sin(a)*.3,8);}box(woman,.7,.28,1,orange,0,1.3,-.02);const skirt=mesh(woman,new THREE.CylinderGeometry(.48,.68,.5,10),white,0,.72,0);skirt.rotation.x=Math.PI/2;
    const hoseLine=mesh(root,new THREE.CylinderGeometry(.055,.055,5,8),black,99,6.6,15);hoseLine.rotation.z=Math.PI/2;
    truck.userData.description="Winged long-haul space semi with rocket cargo booster";root.userData={jail,benis,mia,truck,owner,woman,pump,patrons};return root;
  }

  // ============================================================
  // PROCEDURAL STARFIELD
  // ============================================================

  function createStarfield() {
    setStatus("GENERATING STARFIELD");

    const positions = [];
    const colors = [];

    for (let i = 0; i < CONFIG.starCount; i++) {
      const radius = 1200 + random() * 2500;

      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);

      positions.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );

      const brightness = 0.5 + random() * 0.5;

      colors.push(
        brightness,
        brightness * (0.9 + random() * 0.1),
        brightness
      );
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        positions, 3
      )
    );

    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(
        colors, 3
      )
    );

    const stars = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: 2.2,
        vertexColors: true,
        sizeAttenuation: false
      })
    );

    scene.add(stars);
  }

  // ============================================================
  // PROCEDURAL ASTEROID FIELD
  // A sparse, instanced orbital belt around Haven.
  // ============================================================

  function createAsteroidBelt() {
    const geometry = new THREE.DodecahedronGeometry(1, 0);
    const asteroidMasses = [];
    const material = new THREE.MeshStandardMaterial({
      color: 0x8a8175,
      roughness: 1,
      metalness: 0.08,
      flatShading: true,
      vertexColors: true
    });

    asteroidBelt = new THREE.InstancedMesh(
      geometry,
      material,
      CONFIG.asteroidCount
    );
    // Raycasting instanced belt rocks for mining laser
    asteroidBelt.userData.mineableBelt = true;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const richIds = [];

    for (let i = 0; i < CONFIG.asteroidCount; i++) {
      const angle = random() * Math.PI * 2;
      // Slightly denser inner ring + main belt so players can find rocks near Haven orbit
      const ringPick = random();
      const radius = ringPick < 0.22
        ? (165 + random() * 28)
        : (205 + (random() - 0.5) * 48);
      const vertical = (random() - 0.5) * 34;
      const size = 1.2 + random() * 5.5;
      const isRich = random() < 0.18; // ~18% gold-bearing

      dummy.position.set(
        Math.cos(angle) * radius,
        vertical,
        Math.sin(angle) * radius
      );
      dummy.rotation.set(
        random() * Math.PI,
        random() * Math.PI,
        random() * Math.PI
      );
      const sx=size*(0.7+random()*0.7),sy=size*(0.55+random()*0.8),sz=size*(0.7+random()*0.7);
      dummy.scale.set(sx,sy,sz);
      const densityKgM3=isRich ? 3200 : 2600;
      const hp = Math.max(2, Math.round(size * 1.1));
      asteroidMasses.push({
        instanceId:i,
        massKg:(4/3)*Math.PI*sx*sy*sz*densityKgM3,
        densityKgM3,
        localPosition:dummy.position.clone(),
        scale:[sx,sy,sz],
        hp: hp,
        maxHp: hp,
        ore: isRich,
        alive: true
      });
      dummy.updateMatrix();
      asteroidBelt.setMatrixAt(i, dummy.matrix);

      if (isRich) {
        // Gold-tinted rich rocks
        color.setHSL(0.12, 0.55, 0.42 + random() * 0.1);
        richIds.push(i);
      } else {
        color.setHSL(
          0.08 + random() * 0.07,
          0.12 + random() * 0.12,
          0.31 + random() * 0.22
        );
      }
      asteroidBelt.setColorAt(i, color);
    }

    asteroidBelt.instanceMatrix.needsUpdate = true;
    if (asteroidBelt.instanceColor) asteroidBelt.instanceColor.needsUpdate = true;
    asteroidBelt.userData.krAsteroidMasses=asteroidMasses;
    asteroidBelt.userData.richIds = richIds;
    asteroidBelt.userData.dummy = dummy;

    asteroidBelt.position.copy(planetCenter);
    scene.add(asteroidBelt);
  }

  function getAsteroidWorldMatrix(instanceId, outMatrix) {
    if (!asteroidBelt) return null;
    const m = outMatrix || new THREE.Matrix4();
    asteroidBelt.getMatrixAt(instanceId, m);
    // InstancedMesh local → world
    const parent = asteroidBelt.matrixWorld;
    m.premultiply(parent);
    return m;
  }

  function damageBeltAsteroid(instanceId, amount) {
    if (!asteroidBelt || !asteroidBelt.userData.krAsteroidMasses) return null;
    const rec = asteroidBelt.userData.krAsteroidMasses[instanceId];
    if (!rec || !rec.alive) return null;
    rec.hp -= amount || 1;
    const dummy = asteroidBelt.userData.dummy || new THREE.Object3D();
    const ratio = Math.max(0.12, rec.hp / Math.max(1, rec.maxHp));
    dummy.position.copy(rec.localPosition);
    // keep prior rotation approximate by reading matrix
    const tmp = new THREE.Matrix4();
    asteroidBelt.getMatrixAt(instanceId, tmp);
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    tmp.decompose(pos, quat, scl);
    dummy.position.copy(pos);
    dummy.quaternion.copy(quat);
    if (rec.hp <= 0) {
      rec.alive = false;
      dummy.scale.set(0.001, 0.001, 0.001);
      dummy.updateMatrix();
      asteroidBelt.setMatrixAt(instanceId, dummy.matrix);
      asteroidBelt.instanceMatrix.needsUpdate = true;
      const yieldOre = rec.ore ? (3 + Math.floor(rec.maxHp / 2)) : (1 + Math.floor(rec.maxHp / 3));
      explorerEquipment.oreMined += yieldOre;
      explorerEquipment.hits++;
      return { destroyed: true, ore: yieldOre, rich: !!rec.ore };
    }
    dummy.scale.set(rec.scale[0] * ratio, rec.scale[1] * ratio, rec.scale[2] * ratio);
    dummy.updateMatrix();
    asteroidBelt.setMatrixAt(instanceId, dummy.matrix);
    asteroidBelt.instanceMatrix.needsUpdate = true;
    // flash richer color when hit
    if (asteroidBelt.instanceColor) {
      const c = new THREE.Color(rec.ore ? 0xffcc55 : 0xff7744);
      asteroidBelt.setColorAt(instanceId, c);
      asteroidBelt.instanceColor.needsUpdate = true;
    }
    const chipOre = rec.ore ? 2 : 1;
    explorerEquipment.oreMined += chipOre;
    explorerEquipment.hits++;
    return { destroyed: false, ore: chipOre, rich: !!rec.ore, hp: rec.hp };
  }

  function fireMiningLaser() {
    // Works on foot (EVA) OR from the ship cockpit/chase cam
    if (buggyMode || !camera || !THREE) return;
    if (onFoot && !playerAvatar) return;
    if (!onFoot && !ship) return;

    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0, 0), camera);
    ray.far = 220;

    const origin = ray.ray.origin.clone();
    const direction = ray.ray.direction.clone().normalize();
    let end = origin.clone().addScaledVector(direction, 180);
    let hitColor = 0x66fff5;
    let mined = 0;
    let statusMsg = null;

    // 1) Belt asteroids (instanced)
    if (asteroidBelt) {
      asteroidBelt.updateMatrixWorld(true);
      const beltHits = ray.intersectObject(asteroidBelt, false);
      if (beltHits.length) {
        const h = beltHits[0];
        end = h.point.clone();
        const id = h.instanceId;
        if (id !== undefined && id !== null) {
          const result = damageBeltAsteroid(id, 1);
          if (result) {
            mined = result.ore;
            hitColor = result.rich ? 0xffd24a : 0xff8a40;
            statusMsg = result.destroyed
              ? ("ASTEROID DESTROYED // +" + result.ore + " ORE // TOTAL " + explorerEquipment.oreMined)
              : ("BELT MINE // +" + result.ore + " ORE // HP " + result.hp + " // TOTAL " + explorerEquipment.oreMined);
          }
        }
      }
    }

    // 2) Fall back to on-foot gun logic targets if EVA
    if (!statusMsg && onFoot) {
      // reuse existing foot mining by calling internal path
      fireRayGun();
      return;
    }

    // Draw beam (ship or EVA)
    const muzzle = (!onFoot && ship)
      ? ship.localToWorld(new THREE.Vector3(0, 0.4, -4.5))
      : (explorerEquipment.muzzle
          ? explorerEquipment.muzzle.getWorldPosition(new THREE.Vector3())
          : origin.clone());
    spawnLaserBeam(muzzle, end, hitColor, 0.55);
    explorerEquipment.shots++;
    if (statusMsg) setStatus(statusMsg);
    else setStatus("MINING LASER // NO ASTEROID IN SIGHT // FLY THE BELT");
    updateEquipmentHUD();
  }


  // ============================================================
  // HAVEN MOON
  // ============================================================

  function createMoon() {
    const orbit = new THREE.Group();
    orbit.position.copy(planetCenter);
    moonWorld = new THREE.Group();
    moonWorld.position.set(345,12,0);
    orbit.add(moonWorld);

    const radius = CONFIG.moonRadius;
    const geometry = new THREE.SphereGeometry(radius,96,64);
    const positions = geometry.attributes.position;
    const colors = [];
    const base = new THREE.Color("#aaa69a"), dark = new THREE.Color("#686c70"), pale = new THREE.Color("#c7c0ad"), color = new THREE.Color();
    for(let i=0;i<positions.count;i++){
      const n=new THREE.Vector3(positions.getX(i),positions.getY(i),positions.getZ(i)).normalize();
      const t=moonTerrainProfile(n.x,n.y,n.z), r=radius+t.elevation;
      positions.setXYZ(i,n.x*r,n.y*r,n.z*r);
      const shade=THREE.MathUtils.clamp(0.88+t.broad*0.10+t.rolling*0.055+t.fine*0.025,0.68,1.08);
      color.copy(t.crater>0.35?dark:(t.broad>0.22?pale:base)).multiplyScalar(shade);
      colors.push(color.r,color.g,color.b);
    }
    geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    {const moonTerrainMesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));moonTerrainMesh.userData.krTerrainMesh=true;moonWorld.add(moonTerrainMesh);}

    // Clear landing beacon; no buildings, rocks or vegetation on Luna.
    moonLandingMarker=new THREE.Group();
    const n=new THREE.Vector3(0.94,0.20,0.28).normalize(), t=moonTerrainProfile(n.x,n.y,n.z);
    moonLandingMarker.position.copy(n).multiplyScalar(radius+t.elevation+0.55);
    moonLandingMarker.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),n);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(7.5,0.32,6,48),new THREE.MeshBasicMaterial({color:0x8fe0e5,transparent:true,opacity:0.9,depthWrite:false}));
    ring.rotation.x=Math.PI/2; moonLandingMarker.add(ring);
    const beacon=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,15,6),new THREE.MeshBasicMaterial({color:0x9de8ec,transparent:true,opacity:0.58,depthWrite:false}));
    beacon.position.y=8; moonLandingMarker.add(beacon); moonWorld.add(moonLandingMarker);

    // Rehome the existing open-cockpit rover from Haven to Luna.
    if(havenBuggy){
      const oldWorld=havenBuggy.getWorldPosition(new THREE.Vector3());
      if(havenBuggy.parent)havenBuggy.parent.remove(havenBuggy);
      const rn=new THREE.Vector3(0.91,0.20,0.36).normalize(), rt=moonTerrainProfile(rn.x,rn.y,rn.z);
      havenBuggy.position.copy(rn).multiplyScalar(radius+rt.elevation+0.95);
      havenBuggy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),rn);
      moonWorld.add(havenBuggy);
      havenBuggy.userData.species="LUNA UTILITY ROVER";
    }

    const orbitLine=new THREE.Mesh(new THREE.TorusGeometry(345,0.22,4,160),new THREE.MeshBasicMaterial({color:0x526b7b,transparent:true,opacity:0.22}));
    orbitLine.rotation.x=Math.PI/2; orbit.add(orbitLine);
    scene.add(orbit); moonOrbit=orbit;
    try { installLunaMineField(); } catch (err) { console.warn("[Kepler Reach] Luna mine install failed", err); }
  }

  // ============================================================
  // CENTRAL STAR
  // ============================================================

  // v0.4.06: home-dock landing beacon so landing assist, disembark and re-board work at the Last Stop.
  function createStationLandingMarker(parent, position, name) {
    const g = new THREE.Group();
    g.name = name; g.position.copy(position);
    const amber = new THREE.MeshBasicMaterial({ color: 0xe8b25a }), cyan = new THREE.MeshBasicMaterial({ color: 0x8fd9e7 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(10, 0.34, 8, 48), amber); ring.rotation.x = Math.PI / 2; g.add(ring);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(6, 0.18, 6, 40), cyan); inner.rotation.x = Math.PI / 2; g.add(inner);
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 18, 8), amber); beacon.position.y = 10; g.add(beacon);
    const tip = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), new THREE.MeshBasicMaterial({ color: 0xffe0a6 })); tip.position.y = 19; g.add(tip);
    g.traverse(o => { o.userData.noCameraCollision = true; });
    parent.add(g);
    return g;
  }

  function createSun() {
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(32, 24, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffd99a
      })
    );

    sun.position.set(-500, 180, -1350);
    centralStar=sun;

    scene.add(sun);

    const light = new THREE.PointLight(
      0xffd6a0,
      1800,
      1800
    );

    light.position.copy(sun.position);

    scene.add(light);
    havenSunLight=new THREE.DirectionalLight(0xffe4bd,2.15);
    havenSunLight.position.copy(sun.position);
    havenSunLight.target.position.copy(planetCenter);
    scene.add(havenSunLight);
    scene.add(havenSunLight.target);

    // Sun glow

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(43, 20, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffbb70,
        transparent: true,
        opacity: 0.13,
        side: THREE.BackSide,
        depthWrite: false
      })
    );

    glow.position.copy(sun.position);

    scene.add(glow);
  }

  // ============================================================
  // FLIGHT PHYSICS
  // ============================================================

  // Three.js vectors are created only after the module has loaded.
  let forward = null;
  let cameraOffset = null;
  let desiredCamera = null;
  let shipChaseHeading = null;
  let lookTarget = null;
  let planetCenter = null;

  function returnHome() {
    if (!ship || !camera || !planetCenter) return;
    if (shipParked) setShipParked(false);
    landingState = "idle";
    stationInteriorMode = false;
    activeSurfaceBody="haven"; activeLandingBody="haven";
    if(havenLandingMarker)landingMarker=havenLandingMarker;
    onFoot = false;
    cameraMode="third";recenterCamera();if(cameraButton){cameraButton.style.display="block";cameraButton.textContent="VIEW: COCKPIT";}if(lookPad)lookPad.style.display="grid";if(mobile)mobile.style.display="block";try{clearMoveKeys();releaseMoveStick();syncControlChrome();}catch(_){}try{clearMoveKeys();releaseMoveStick();syncControlChrome();}catch(_){}
    buggyMode = false; buggySpeed = 0;
    avatarIsWalking = false;
    avatarIsWalking=false;
    if (habitatGateButton) habitatGateButton.style.display="none";
    if (buggyInteractButton) buggyInteractButton.style.display = "none";
    if (playerAvatar) playerAvatar.visible = false;
    if (ship) ship.visible = true;
    if (disembarkButton) disembarkButton.style.display = "none";
    if (boardShipButton) boardShipButton.style.display = "none";
    if (landingButton) landingButton.style.display = "block";
    if (mobile) mobile.style.display = "block";
    if (lookPad) lookPad.style.display = "grid";
    if (landingButton) {
      landingButton.textContent = "LANDING ASSIST";
      landingButton.disabled = true;
      landingButton.style.opacity = "0.48";
    }
    ship.position.set(0, 0, -390);
    ship.rotation.set(0, 0, 0);
    velocity.x = 0;
    velocity.y = 0;
    velocity.z = 0;
    camera.up.set(0, 1, 0);
    camera.position.set(0, 17, -345);
    camera.lookAt(0, 0, -435);
    clearKeys();
    setStatus("HOME POSITION RESTORED // HAVEN AHEAD");
  }

  // ============================================================
  // HAVEN SURFACE MOVEMENT
  // Ground height is sampled from the same deterministic terrain
  // profile used to build the visible planet mesh.
  // ============================================================

  function sampleSurface(worldPosition) {
    const surfaceRoot=activeSurfaceBody==="moon"&&moonWorld?moonWorld:planetWorld;
    const surfaceRadius=activeSurfaceBody==="moon"?CONFIG.moonRadius:CONFIG.planetRadius;
    const profile=activeSurfaceBody==="moon"?moonTerrainProfile:terrainProfile;
    const local = surfaceRoot.worldToLocal(worldPosition.clone());
    const radial = local.clone().normalize();
    const terrain = profile(radial.x, radial.y, radial.z);
    // Estimate the terrain gradient along two tangent directions so the
    // explorer follows the actual slope rather than the planet radius.
    let east = new THREE.Vector3(0, 1, 0).cross(radial);
    if (east.lengthSq() < 1e-7) east.set(1, 0, 0);
    east.normalize();
    const north = radial.clone().cross(east).normalize();
    const sampleAngle = activeSurfaceBody==="moon" ? (1.0/CONFIG.moonRadius) : 0.006;
    const sampleAt = direction => {
      const n = radial.clone().addScaledVector(direction, sampleAngle).normalize();
      return profile(n.x, n.y, n.z).elevation;
    };
    const metresPerStep = surfaceRadius * sampleAngle * 2;
    const gradientEast = (sampleAt(east) - sampleAt(east.clone().negate())) / metresPerStep;
    const gradientNorth = (sampleAt(north) - sampleAt(north.clone().negate())) / metresPerStep;
    const normalLocal = radial.clone().addScaledVector(east, -gradientEast)
      .addScaledVector(north, -gradientNorth).normalize();
    // Place the capsule foot point just above the sampled terrain. The
    // character body remains aligned to radial gravity, not this terrain slope.
    const surfaceLocal = radial.clone().multiplyScalar(
      surfaceRadius + terrain.elevation + AVATAR_SOLE_CLEARANCE
    );
    const surfaceWorld = surfaceRoot.localToWorld(surfaceLocal);
    const worldRotation = surfaceRoot.getWorldQuaternion(new THREE.Quaternion());
    const terrainNormalWorld = normalLocal.applyQuaternion(worldRotation).normalize();
    const radialUpWorld = radial.clone().applyQuaternion(worldRotation).normalize();
    const slope = Math.acos(THREE.MathUtils.clamp(terrainNormalWorld.dot(radialUpWorld), -1, 1));
    // Planetary gravity always points toward the planet centre. Terrain normal
    // is deliberately separate and must never tip the whole character/camera.
    const gravityWorld = radialUpWorld.clone().negate();
    return {
      position: surfaceWorld,
      up: radialUpWorld,
      gravity: gravityWorld,
      terrainNormal: terrainNormalWorld,
      terrain,
      slope,
      slopeDegrees: THREE.MathUtils.radToDeg(slope),
      grounded: true
    };
  }


  function registerWalkableSurface(mesh, id) {
    if (!mesh || !mesh.isObject3D) throw new Error("A walkable support must be a Three.js Object3D.");
    mesh.userData = mesh.userData || {};
    mesh.userData.krWalkableSurface = String(id || mesh.name || ("support-" + walkableSurfaces.length));
    if (!walkableSurfaces.includes(mesh)) walkableSurfaces.push(mesh);
    registerWorldEntity(mesh,{id:"support:"+mesh.userData.krWalkableSurface,kind:"support-surface",tags:["support","walkable"],persistence:"session"});
    return mesh.userData.krWalkableSurface;
  }
  function sampleFootSupport(worldPosition, up, options) {
    options = options || {};
    supportSampleStats.samples++;
    const gravityUp = up && up.isVector3 ? up.clone().normalize() : new THREE.Vector3(0,1,0);
    const maxRise = options.maxRise === undefined ? 0.55 : Math.max(0, options.maxRise);
    const maxDrop = options.maxDrop === undefined ? 1.25 : Math.max(0, options.maxDrop);
    const terrain = sampleSurface(worldPosition);
    const terrainDelta = terrain.position.clone().sub(worldPosition).dot(gravityUp);
    let best = null, bestDistance = Infinity;
    const preferredSupportObject = options.preferredSupportObject || null;
    if (walkableSurfaces.length) {
      // Registered supports may be attached to rotating stations, elevators, or
      // other moving structures. Refresh their complete parent transform chain
      // before raycasting so support hits and face normals use the current frame.
      for (const supportMesh of walkableSurfaces) {
        if (supportMesh && supportMesh.parent) supportMesh.updateWorldMatrix(true, false);
      }
      const origin = worldPosition.clone().addScaledVector(gravityUp, maxRise + AVATAR_SOLE_CLEARANCE + 0.08);
      walkSurfaceRaycaster.set(origin, gravityUp.clone().negate());
      walkSurfaceRaycaster.near = 0;
      walkSurfaceRaycaster.far = maxRise + maxDrop + AVATAR_SOLE_CLEARANCE + 0.08;
      const hits = walkSurfaceRaycaster.intersectObjects(walkableSurfaces, false);
      supportSampleStats.raycasts++;
      supportSampleStats.raycastHits+=hits.length;
      for (const hit of hits) {
        if (!hit.face || !hit.object.visible || !hit.object.parent) {
          supportSampleStats.invalidHits++;
          continue;
        }
        walkSurfaceNormalMatrix.getNormalMatrix(hit.object.matrixWorld);
        const normal = hit.face.normal.clone().applyMatrix3(walkSurfaceNormalMatrix).normalize();
        const alignment = normal.dot(gravityUp);
        if (alignment < Math.cos(THREE.MathUtils.degToRad(WALK_SURFACE_MAX_SLOPE_DEGREES))) {
          supportSampleStats.slopeRejected++;
          continue;
        }
        const supportPosition = hit.point.clone().addScaledVector(gravityUp, AVATAR_SOLE_CLEARANCE);
        const signed = supportPosition.clone().sub(worldPosition).dot(gravityUp);
        if (signed > maxRise || signed < -maxDrop) {
          supportSampleStats.rangeRejected++;
          continue;
        }
        const distance = Math.abs(signed);
        // At a shared edge, two registered meshes can describe the same
        // physical floor within a few millimetres. Prefer the support already
        // under the explorer for near-equal samples; otherwise use the nearest
        // surface as before. This prevents support ownership flicker at seams.
        const preferredTie = preferredSupportObject && hit.object === preferredSupportObject &&
          best && Math.abs(distance - bestDistance) <= 0.015 && best.supportObject !== preferredSupportObject;
        if (distance < bestDistance - 1e-5 || preferredTie || !best) {
          bestDistance = distance;
          const slope = Math.acos(THREE.MathUtils.clamp(alignment,-1,1));
          best = {position:supportPosition,up:gravityUp.clone(),gravity:gravityUp.clone().negate(),
            terrainNormal:normal,terrain:terrain.terrain,slope,slopeDegrees:THREE.MathUtils.radToDeg(slope),
            grounded:true,supportId:hit.object.userData.krWalkableSurface,supportObject:hit.object,
            supportLocalPoint:hit.object.worldToLocal(hit.point.clone()),
            supportWorldMatrix:hit.object.matrixWorld.clone()};
        }
      }
    }
    if (best) {
      supportSampleStats.structuralSelections++;
      return best;
    }
    if (terrainDelta <= maxRise && terrainDelta >= -maxDrop) {
      supportSampleStats.terrainFallbacks++;
      terrain.supportId = "terrain:" + activeSurfaceBody;
      terrain.supportObject = null;
      return terrain;
    }
    supportSampleStats.misses++;
    return null;
  }
  function resolveFootSupportStep(fromPosition, desiredPosition, up) {
    const movement = desiredPosition.clone().sub(fromPosition), distance = movement.length();
    if (distance < 1e-6) return sampleFootSupport(fromPosition, up);
    const steps = Math.max(1, Math.ceil(distance / PLAYER_CAPSULE.maxSubstepDistance));
    let accepted = sampleFootSupport(fromPosition, up, {maxRise:0.55,maxDrop:1.25});
    if (!accepted) return null;
    for (let i=1;i<=steps;i++) {
      const candidate = fromPosition.clone().addScaledVector(movement, i/steps);
      const support = sampleFootSupport(candidate, up, {
        maxRise:0.55,maxDrop:MAX_GROUNDED_STEP_DOWN,
        preferredSupportObject:accepted.supportObject || null
      });
      if (!support) return null;
      if (support.slopeDegrees >= PLAYER_CAPSULE.verticalWallThresholdDegrees) break;
      accepted = support;
    }
    return accepted;
  }

  // Shared grounded-walking interface for every environment. Each frame supplies
  // its own support provider: registered/terrain support for planetary surfaces,
  // or a local fixed-deck frame for station and vehicle interiors. Collision and
  // the returned movement result are common; environment-specific boundaries
  // remain with the owning frame.
  function clearPlayerSupportFrame() {
    playerSupportFrame = null;
  }

  function rememberPlayerSupport(support) {
    if (!support || !support.supportObject || !support.supportLocalPoint || !support.supportWorldMatrix) {
      clearPlayerSupportFrame();
      return;
    }
    playerSupportFrame = {
      object:support.supportObject,
      worldMatrix:support.supportWorldMatrix.clone()
    };
  }

  function carryPlayerWithMovingSupport() {
    if (!playerGrounded || !playerSupportFrame || !playerAvatar) return;
    const support = playerSupportFrame.object;
    if (!support || !support.parent || !support.visible) {
      clearPlayerSupportFrame();
      return;
    }
    support.updateWorldMatrix(true, false);
    const currentMatrix = support.matrixWorld.clone();
    const inversePrevious = playerSupportFrame.worldMatrix.clone().invert();
    const deltaMatrix = currentMatrix.clone().multiply(inversePrevious);
    const position = playerAvatar.position.clone().applyMatrix4(deltaMatrix);
    const previousQuaternion = new THREE.Quaternion();
    const currentQuaternion = new THREE.Quaternion();
    const previousScale = new THREE.Vector3();
    const currentScale = new THREE.Vector3();
    playerSupportFrame.worldMatrix.decompose(new THREE.Vector3(), previousQuaternion, previousScale);
    currentMatrix.decompose(new THREE.Vector3(), currentQuaternion, currentScale);
    const rotationDelta = currentQuaternion.multiply(previousQuaternion.invert());
    playerAvatar.position.copy(position);
    playerUp.applyQuaternion(rotationDelta).normalize();
    playerHeading.applyQuaternion(rotationDelta).addScaledVector(playerUp,-playerHeading.dot(playerUp)).normalize();
    playerSupportFrame.worldMatrix.copy(currentMatrix);
  }

  function resolveCharacterWalkStep(fromPosition, desiredPosition, up, options) {
    options = options || {};
    const frameUp = up && up.isVector3 ? up.clone().normalize() : new THREE.Vector3(0,1,0);
    if (options.supportMode === "surface") {
      const support = resolveFootSupportStep(fromPosition, desiredPosition, frameUp);
      if (!support) {
        return {position:desiredPosition.clone(),up:frameUp,grounded:false,support:null};
      }
      const directPosition = resolveSolidMovement(fromPosition, support.position, support.up);
      let collisionSafe = directPosition;
      const rise = support.position.clone().sub(fromPosition).dot(frameUp);
      const directError = directPosition.distanceTo(support.position);

      // A short vertical face can block the direct diagonal path even when a
      // valid, reachable support surface exists on top. Try a collision-tested
      // stair-step path: lift, traverse, then settle onto the sampled support.
      // The same solid resolver checks the lift and overhead clearance.
      if (rise > 0.08 && rise <= 0.55 && directError > 0.12) {
        solidCollisionStats.stepUpAttempts++;
        const lift = rise + 0.08;
        const raisedStartTarget = fromPosition.clone().addScaledVector(frameUp,lift);
        const raisedStart = resolveSolidMovement(fromPosition,raisedStartTarget,frameUp);
        if (raisedStart.distanceTo(raisedStartTarget) <= 0.08) {
          const raisedEndTarget = support.position.clone().addScaledVector(frameUp,lift);
          const raisedEnd = resolveSolidMovement(raisedStart,raisedEndTarget,frameUp);
          if (raisedEnd.distanceTo(raisedEndTarget) <= 0.16) {
            const steppedDown = resolveSolidMovement(raisedEnd,support.position,frameUp);
            const stepSupport = sampleFootSupport(steppedDown,support.up,{maxRise:0.18,maxDrop:0.22});
            if (stepSupport && steppedDown.distanceTo(stepSupport.position) <= 0.22) {
              solidCollisionStats.stepUpSuccesses++;
              collisionSafe = stepSupport.position.clone();
            }
          }
        }
      }

      const settled = sampleFootSupport(collisionSafe, support.up, {
        maxRise:0.55,maxDrop:MAX_GROUNDED_STEP_DOWN,
        preferredSupportObject:support.supportObject || null
      }) || support;
      return {position:settled.position.clone(),up:settled.up.clone(),grounded:true,support:settled};
    }
    return {
      position:resolveSolidMovement(fromPosition, desiredPosition, frameUp),
      up:frameUp,
      grounded:true,
      support:null
    };
  }

  function createOnFootAvatar() {
    playerAvatar=new THREE.Group();
    const suit=makeMaterial(0xe0c99c,{roughness:0.84,metalness:0.12});
    const suitLight=makeMaterial(0xf4e4bf,{roughness:0.78,metalness:0.12});
    const dark=makeMaterial(0x34454c,{roughness:0.88});
    const accent=makeMaterial(0xe78b67,{roughness:0.72,metalness:0.14});
    const visor=new THREE.MeshStandardMaterial({color:0x66c6d2,metalness:0.62,roughness:0.16,emissive:0x16434c,emissiveIntensity:0.32});
    const glow=new THREE.MeshBasicMaterial({color:0x9fffe0});
    const torso=new THREE.Mesh(new THREE.BoxGeometry(0.94,1.16,0.58),suit);torso.position.y=1.28;playerAvatar.add(torso);avatarWalkParts.torso=torso;
    const chest=new THREE.Mesh(new THREE.BoxGeometry(0.62,0.52,0.12),dark);chest.position.set(0,1.35,-0.34);playerAvatar.add(chest);
    const panel=new THREE.Mesh(new THREE.BoxGeometry(0.38,0.2,0.035),accent);panel.position.set(0,1.42,-0.415);playerAvatar.add(panel);
    for(let i=0;i<3;i++){const led=new THREE.Mesh(new THREE.SphereGeometry(0.045,6,5),i===1?glow:suitLight);led.position.set(-0.11+i*0.11,1.25,-0.44);playerAvatar.add(led);}
    const belt=new THREE.Mesh(new THREE.BoxGeometry(1,0.16,0.64),accent);belt.position.y=0.72;playerAvatar.add(belt);
    const buckle=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.2,0.08),suitLight);buckle.position.set(0,0.72,-0.36);playerAvatar.add(buckle);
    const helmet=new THREE.Mesh(new THREE.SphereGeometry(0.43,12,9),suitLight);helmet.position.y=2.18;playerAvatar.add(helmet);
    const visorShell=new THREE.Mesh(new THREE.SphereGeometry(0.335,12,9,0,Math.PI*2,0,Math.PI),visor);visorShell.position.set(0,2.2,-0.16);visorShell.scale.set(1,0.78,0.76);playerAvatar.add(visorShell);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(0.34,0.055,6,16),accent);rim.position.set(0,2.2,-0.27);playerAvatar.add(rim);
    const aerial=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.05,0.35,6),dark);aerial.position.set(0.36,2.46,0.04);aerial.rotation.z=-0.35;playerAvatar.add(aerial);
    const tip=new THREE.Mesh(new THREE.SphereGeometry(0.09,7,5),glow);tip.position.set(0.42,2.62,0.04);playerAvatar.add(tip);
    const pack=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.9,0.38),dark);pack.position.set(0,1.34,0.43);playerAvatar.add(pack);
    const packTop=new THREE.Mesh(new THREE.BoxGeometry(.82,.12,.48),accent);packTop.position.set(0,1.78,.44);playerAvatar.add(packTop);
    const jetpackFlames=[];
    for(const side of [-1,1]){
      const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(.105,.16,.25,8),suitLight);nozzle.position.set(side*.27,.82,.52);playerAvatar.add(nozzle);
      const flame=new THREE.Mesh(new THREE.ConeGeometry(.13,.68,8),new THREE.MeshBasicMaterial({color:0x65e9ff,transparent:true,opacity:.86}));flame.position.set(side*.27,.38,.52);flame.rotation.x=Math.PI;flame.visible=false;playerAvatar.add(flame);jetpackFlames.push(flame);
      const glowRing=new THREE.Mesh(new THREE.TorusGeometry(.15,.035,5,12),glow);glowRing.position.set(side*.27,.68,.52);playerAvatar.add(glowRing);
    }
    playerAvatar.userData.jetpackFlames=jetpackFlames;
    for(const side of [-1,1]){
      const tank=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.18,0.68,7),accent);tank.position.set(side*0.3,1.42,0.57);playerAvatar.add(tank);
      const shoulder=new THREE.Mesh(new THREE.SphereGeometry(0.29,8,6),suitLight);shoulder.position.set(side*0.62,1.78,0);playerAvatar.add(shoulder);
      const arm=new THREE.Group();arm.position.set(side*0.62,1.73,0);
      const upper=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.19,0.58,7),suit);upper.position.y=-0.34;arm.add(upper);
      const cuff=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.16,7),accent);cuff.position.y=-0.65;arm.add(cuff);
      const glove=new THREE.Mesh(new THREE.SphereGeometry(0.19,8,6),dark);glove.position.set(0,-0.79,-0.02);arm.add(glove);
      if(side===1){const gun=new THREE.Group();gun.name="KR_FRONTIER_RAY_GUN";const metal=new THREE.MeshStandardMaterial({color:0x485b60,metalness:.72,roughness:.3});const gunBody=new THREE.Mesh(new THREE.BoxGeometry(.2,.22,.58),metal);gunBody.position.set(0,-.79,-.29);gun.add(gunBody);const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.075,.09,.48,8),new THREE.MeshStandardMaterial({color:0xb6c6bb,metalness:.8,roughness:.22}));barrel.rotation.x=Math.PI/2;barrel.position.set(0,-.77,-.72);gun.add(barrel);const grip=new THREE.Mesh(new THREE.BoxGeometry(.14,.32,.18),accent);grip.position.set(0,-.98,-.12);grip.rotation.x=-.18;gun.add(grip);const coil=new THREE.Mesh(new THREE.TorusGeometry(.105,.035,6,12),new THREE.MeshBasicMaterial({color:0x6ef7ee}));coil.position.set(0,-.77,-.48);gun.add(coil);const muzzleGlow=new THREE.PointLight(0x69f5ef,0,2);muzzleGlow.position.set(0,-.77,-.96);gun.add(muzzleGlow);const muzzle=new THREE.Object3D();muzzle.position.set(0,-.77,-.98);gun.add(muzzle);arm.add(gun);explorerEquipment.gun=gun;explorerEquipment.muzzle=muzzle;explorerEquipment.proceduralGunParent=arm;explorerEquipment.proceduralGunPosition=gun.position.clone();explorerEquipment.proceduralGunRotation=gun.rotation.clone();explorerEquipment.proceduralGunScale=gun.scale.clone();gun.userData.muzzleGlow=muzzleGlow;}
      playerAvatar.add(arm);avatarWalkParts.arms.push({pivot:arm,side});
      const leg=new THREE.Group();leg.position.set(side*0.25,0.72,0.02);
      const thigh=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.2,0.62,7),dark);thigh.position.y=-0.32;leg.add(thigh);
      const knee=new THREE.Mesh(new THREE.SphereGeometry(0.2,7,5),suitLight);knee.position.y=-0.58;leg.add(knee);
      const boot=new THREE.Mesh(new THREE.BoxGeometry(0.38,0.22,0.5),suit);boot.position.set(0,-0.68,-0.08);leg.add(boot);
      const sole=new THREE.Mesh(new THREE.BoxGeometry(0.39,0.07,0.5),accent);sole.position.set(0,-0.8,-0.08);leg.add(sole);
      playerAvatar.add(leg);avatarWalkParts.legs.push({pivot:leg,side});
    }
    playerAvatar.scale.setScalar(WORLD_SCALE.explorerHeight/2.62);
    playerAvatar.userData.controller = {
      type: "planet-radial-capsule",
      height: PLAYER_CAPSULE.height,
      radius: PLAYER_CAPSULE.radius,
      groundSkin: PLAYER_CAPSULE.groundSkin
    };
    playerAvatar.visible=false;scene.add(playerAvatar);
    playerHeading=new THREE.Vector3(0,0,-1);playerFlightForward=new THREE.Vector3(0,0,-1);playerUp=new THREE.Vector3(0,1,0);playerRight=new THREE.Vector3(1,0,0);playerMove=new THREE.Vector3();playerCameraTarget=new THREE.Vector3();
    // Kick off George GLB load (non-blocking). Procedural suit remains until ready.
    try { loadGeorgeExplorer(); } catch (err) { console.warn("[Kepler Reach] George load start failed", err); }
  }

  function hideProceduralSuitMeshes(hide) {
    if (!playerAvatar) return;
    playerAvatar.traverse(obj => {
      if (!obj.isMesh && !obj.isGroup) return;
      // Keep equipment, jetpack FX, and the George root visible
      if (obj.name === "KR_GEORGE_ROOT" || obj.name === "KR_TRASH_CAN_ROBOT_ROOT" || obj.name === "KR_FRONTIER_RAY_GUN") return;
      if (obj.parent && obj.parent.name === "KR_FRONTIER_RAY_GUN") return;
      if (playerAvatar.userData.jetpackFlames && playerAvatar.userData.jetpackFlames.includes(obj)) return;
      // Hide only meshes that were part of the procedural body (no name or suit pieces)
      if (obj.isMesh && obj.parent === playerAvatar) {
        obj.visible = !hide;
      }
      // Also hide limb group children of procedural arms/legs
      if (obj.isGroup && obj.parent === playerAvatar && obj.name !== "KR_GEORGE_ROOT" && obj.name !== "KR_TRASH_CAN_ROBOT_ROOT") {
        // limb groups are unnamed; George root is named
        let isEquip = false;
        obj.traverse(c => { if (c.name === "KR_FRONTIER_RAY_GUN") isEquip = true; });
        if (!isEquip) {
          obj.visible = !hide;
        }
      }
    });
  }

  async function loadGeorgeExplorer() {
    if (!THREE || !playerAvatar || georgeExplorer) return;
    let loader;
    try {
      loader = await getGLTFLoader();
    } catch (err) {
      console.warn("[Kepler Reach] GLTFLoader unavailable; keeping procedural avatar", err);
      return;
    }
    let gltf = null;
    let lastErr = null;
    for (const url of GEORGE_MODEL_URLS) {
      try {
        gltf = await new Promise((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });
        console.info("[Kepler Reach] Loaded George from", url);
        break;
      } catch (err) {
        lastErr = err;
        console.warn("[Kepler Reach] George URL failed", url, err);
      }
    }
    if (!gltf || !gltf.scene) {
      console.warn("[Kepler Reach] George-2077.glb could not be loaded; procedural suit stays", lastErr);
      setStatus("GEORGE MODEL UNAVAILABLE // PROCEDURAL SUIT");
      return;
    }

    const root = gltf.scene;
    root.name = "KR_GEORGE_ROOT";
    root.traverse(o => {
      if (o.isMesh) {
        o.castShadow = false;
        o.receiveShadow = false;
        o.frustumCulled = true;
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) {
            if (m) { m.side = THREE.FrontSide; m.depthWrite = true; }
          }
        }
      }
    });

    // Normalize: feet on y=0, height → explorerHeight in WORLD units.
    // playerAvatar already has a scale factor — compensate so George is not tiny.
    root.position.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
    root.scale.set(1, 1, 1);
    root.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(root);
    let size = box.getSize(new THREE.Vector3());
    if (!isFinite(size.y) || size.y < 0.01) size.y = 1;
    // NPCs read larger than 2m suit units — bias George up so he matches the scene
    const targetH = WORLD_SCALE.explorerHeight * 1.35; // ~2.7m world height
    const parentScale = (playerAvatar.scale && playerAvatar.scale.x) ? playerAvatar.scale.x : 1;
    // Desired world height = targetH → local scale must divide out parent scale
    const s = (targetH / size.y) / parentScale;
    root.scale.setScalar(s);
    root.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const minY = box.min.y;
    // Box is in world space while root is under scaled parent; convert deltas to local
    root.position.x -= center.x / parentScale;
    root.position.z -= center.z / parentScale;
    root.position.y -= minY / parentScale;
    // Many character exports face +Z; game forward is -Z
    root.rotation.y = Math.PI;
    root.userData.baseY = root.position.y;
    root.userData.baseScale = s;
    console.info("[Kepler Reach] George scale", { sizeY: size.y, parentScale, localScale: s, targetH });

    // Re-parent gun + jetpack flames on top of George if present
    playerAvatar.add(root);
    root.visible=activeExplorerCharacter==="george";

    // Keep the original procedural spaceman available as a selectable avatar.
    hideProceduralSuitMeshes(activeExplorerCharacter!=="original");

    // Mixer for embedded clips
    let mixer = null;
    const clips = gltf.animations || [];
    let idleAction = null, walkAction = null;
    if (false && clips.length && THREE.AnimationMixer) {
      mixer = new THREE.AnimationMixer(root);
      const byName = {};
      for (const c of clips) byName[String(c.name || "").toLowerCase()] = c;
      const idleClip = byName.idle || byName["idle"] || byName.tpose || clips[0];
      const walkClip = byName.walk || byName.walking || byName.run || null;
      if (idleClip) {
        idleAction = mixer.clipAction(idleClip);
        idleAction.play();
      }
      if (walkClip) {
        walkAction = mixer.clipAction(walkClip);
        walkAction.play();
        walkAction.setEffectiveWeight(0);
      }
    }

    // Collect bones for a lightweight procedural walk if clips are missing
    const bones = { hips: null, spine: null, leftUpLeg: null, rightUpLeg: null, leftLeg: null, rightLeg: null, leftArm: null, rightArm: null, leftShoulder: null, rightShoulder: null };
    root.traverse(o => {
      if (!o.isBone && o.type !== "Bone") return;
      const n = String(o.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const assign = (key, pred) => { if (!bones[key] && pred(n)) bones[key] = o; };
      const L = n => n.startsWith("l") || n.includes("left");
      const R = n => n.startsWith("r") || n.includes("right");
      assign("hips", n => n.includes("hip") || n.includes("pelvis") || n === "root" || n.includes("hips"));
      assign("spine", n => n.includes("spine") || n.includes("torso") || n.includes("chest"));
      assign("leftUpLeg", n => L(n) && (n.includes("upleg") || n.includes("upperleg") || n.includes("thigh") || n.includes("legtwist")));
      assign("rightUpLeg", n => R(n) && (n.includes("upleg") || n.includes("upperleg") || n.includes("thigh") || n.includes("legtwist")));
      assign("leftLeg", n => L(n) && (n.includes("leg") || n.includes("calf") || n.includes("shin") || n.includes("lowerleg")) && !n.includes("up") && !n.includes("thigh"));
      assign("rightLeg", n => R(n) && (n.includes("leg") || n.includes("calf") || n.includes("shin") || n.includes("lowerleg")) && !n.includes("up") && !n.includes("thigh"));
      assign("leftShoulder", n => L(n) && n.includes("shoulder"));
      assign("rightShoulder", n => R(n) && n.includes("shoulder"));
      assign("leftArm", n => L(n) && (n.includes("upperarm") || n.includes("arm")) && !n.includes("fore") && !n.includes("hand"));
      assign("rightArm", n => R(n) && (n.includes("upperarm") || n.includes("arm")) && !n.includes("fore") && !n.includes("hand"));
    });
    // Some GLB exporters use opaque bone names. Infer missing upper-arm pivots
    // from bone positions relative to the character's actual bounds.
    if(!bones.leftArm||!bones.rightArm){
      root.updateWorldMatrix(true,true);
      const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),candidates=[];
      root.traverse(o=>{
        if(!o.isBone&&o.type!=="Bone")return;
        const world=o.getWorldPosition(new THREE.Vector3()),local=root.worldToLocal(world.clone());
        const normalizedY=size.y>1e-5?(world.y-bounds.min.y)/size.y:0;
        if(normalizedY>0.48&&normalizedY<0.9&&Math.abs(local.x)>size.x*0.12)
          candidates.push({bone:o,x:local.x,score:Math.abs(normalizedY-0.70)+Math.abs(Math.abs(local.x)/Math.max(size.x,1e-5)-0.27)});
      });
      for(const side of ["left","right"]){
        if(bones[side+"Arm"])continue;
        const sign=side==="left"?-1:1;
        const choice=candidates.filter(c=>Math.sign(c.x)===sign).sort((a,b)=>a.score-b.score)[0];
        if(choice)bones[side+"Arm"]=choice.bone;
      }
    }
    // Store rest rotations, then calculate a real "arms-down" correction
    // from the actual skeleton geometry. Do not assume the model uses a
    // particular local bone axis or left/right rotation sign.
    const boneRest = {};
    for (const [k, b] of Object.entries(bones)) {
      if (b) boneRest[k] = { x: b.rotation.x, y: b.rotation.y, z: b.rotation.z };
    }
    const armDownPose={};
    root.updateWorldMatrix(true,true);
    for(const key of ["leftArm","rightArm"]){
      const arm=bones[key],rest=boneRest[key];
      if(!arm||!rest)continue;
      let endpoint=null,bestDistance=-1;
      const shoulder=arm.getWorldPosition(new THREE.Vector3());
      const findDescendants=(node)=>{
        for(const child of node.children||[]){
          if(child.isBone||child.type==="Bone"){
            const p=child.getWorldPosition(new THREE.Vector3()),d=p.distanceTo(shoulder);
            if(d>bestDistance){bestDistance=d;endpoint=child;}
          }
          findDescendants(child);
        }
      };
      findDescendants(arm);
      if(!endpoint)continue;
      const endBefore=endpoint.getWorldPosition(new THREE.Vector3());
      const restY=endBefore.y;
      let best=null,bestY=Infinity;
      const axes=["x","y","z"],angles=[-1.65,-1.35,-1.05,-0.75,0.75,1.05,1.35,1.65];
      for(const axis of axes){
        for(const angle of angles){
          arm.rotation.set(rest.x,rest.y,rest.z);
          arm.rotation[axis]+=angle;
          root.updateWorldMatrix(true,true);
          const y=endpoint.getWorldPosition(new THREE.Vector3()).y;
          if(y<bestY){bestY=y;best={axis,angle};}
        }
      }
      arm.rotation.set(rest.x,rest.y,rest.z);
      root.updateWorldMatrix(true,true);
      // Accept a correction only when it materially lowers the arm endpoint.
      if(best&&bestY<restY-bestDistance*0.18)armDownPose[key]=best;
    }
    // Imported clips repeatedly reset the shoulder transforms and were the
    // reason the previous overlay could not reliably hold George's arms down.
    // Use the game's deterministic procedural gait for George instead.
    mixer=null;idleAction=null;walkAction=null;

    georgeExplorer = {
      root,
      mixer,
      clips,
      idleAction,
      walkAction,
      bones,
      boneRest,
      armDownPose,
      ready: true
    };
    playerAvatar.userData.george = georgeExplorer;
    const boneCount = Object.values(bones).filter(Boolean).length;
    setStatus("GEORGE-2077 ONLINE // SCALE OK" + (boneCount ? (" // " + boneCount + " BONES") : " // PROCEDURAL WALK"));
  }

  async function loadTrashCanExplorer(){
    if(!THREE||!playerAvatar)return null;
    if(trashCanExplorer&&trashCanExplorer.ready)return trashCanExplorer;
    if(trashCanLoadPromise)return trashCanLoadPromise;
    trashCanLoadPromise=(async()=>{
      let loader;
      try{loader=await getGLTFLoader();}
      catch(err){console.warn("[Kepler Reach] GLTFLoader unavailable for Trash-Can Robot",err);return null;}
      const urls=[
        "https://cdn.jsdelivr.net/gh/duckwerks/voxel-planet@main/assets/Robot_Trash-Can.glb",
        "https://raw.githubusercontent.com/duckwerks/voxel-planet/main/assets/Robot_Trash-Can.glb"
      ];
      let gltf=null,lastErr=null;
      for(const url of urls){
        try{gltf=await new Promise((resolve,reject)=>loader.load(url,resolve,undefined,reject));console.info("[Kepler Reach] Loaded Trash-Can Robot from",url);break;}
        catch(err){lastErr=err;console.warn("[Kepler Reach] Trash-Can Robot URL failed",url,err);}
      }
      if(!gltf||!gltf.scene){console.warn("[Kepler Reach] Trash-Can Robot GLB unavailable; keeping current explorer",lastErr);setStatus("TRASH-CAN ROBOT UNAVAILABLE // CURRENT EXPLORER KEPT");return null;}
      const model=gltf.scene;
      model.name="KR_TRASH_CAN_ROBOT_ROOT";
      model.traverse(o=>{
        if(!o.isMesh)return;
        o.castShadow=false;o.receiveShadow=false;o.frustumCulled=true;
        if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];for(const material of mats)if(material){material.side=THREE.FrontSide;material.depthWrite=true;}}
      });
      // Normalize to the same world-space height as George.
      model.position.set(0,0,0);model.rotation.set(0,0,0);model.scale.set(1,1,1);model.updateMatrixWorld(true);
      let bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
      if(!isFinite(size.y)||size.y<0.01)throw new Error("Trash-Can Robot has invalid model bounds");
      const targetHeight=WORLD_SCALE.explorerHeight*1.35;
      const parentScale=playerAvatar.scale&&playerAvatar.scale.x?playerAvatar.scale.x:1;
      const modelScale=(targetHeight/size.y)/parentScale;
      model.scale.setScalar(modelScale);model.updateMatrixWorld(true);
      bounds=new THREE.Box3().setFromObject(model);
      const center=bounds.getCenter(new THREE.Vector3());
      model.position.x-=center.x/parentScale;model.position.z-=center.z/parentScale;model.position.y-=bounds.min.y/parentScale;
      // Match the explorer's -Z forward convention used by the existing George model.
      model.rotation.y=Math.PI;
      model.userData.baseY=model.position.y;
      model.userData.baseRotationY=model.rotation.y;
      model.userData.baseScale=modelScale;
      model.userData.krAssetAttribution={title:"Bender by Futurama",creator:"FySyde",license:"CC-BY-4.0",source:"https://sketchfab.com/3d-models/bender-by-futurama-b61897e3b7ae4a1babedd87936e36883"};
      playerAvatar.add(model);
      model.visible=activeExplorerCharacter==="trash-can";
      trashCanExplorer={root:model,mixer:null,clips:gltf.animations||[],ready:true,baseY:model.position.y,baseRotationY:model.rotation.y,componentGroups:[]};
      // Retain the GLB's independent rigid groups for later joint-level animation.
      model.traverse(o=>{if(o.isGroup&&/^(Point|Point\.001|Point\.002|Cylinder|Cylinder\.001|Cylinder\.002|Cylinder\.003|Cylinder\.004|Cube)$/.test(o.name||""))trashCanExplorer.componentGroups.push(o);});
      model.visible=activeExplorerCharacter==="trash-can";
      hideProceduralSuitMeshes(activeExplorerCharacter!=="original");
      refreshExplorerSelectorUI();
      setStatus("TRASH-CAN ROBOT ONLINE // SHARED EXPLORER CONTROLS");
      return trashCanExplorer;
    })().catch(err=>{console.error("[Kepler Reach] Trash-Can Robot load failed",err);setStatus("TRASH-CAN ROBOT LOAD ERROR // CURRENT EXPLORER KEPT",true);return null;}).finally(()=>{trashCanLoadPromise=null;});
    return trashCanLoadPromise;
  }

  function attachExplorerGunToImportedModel(model){
    const gun=explorerEquipment.gun;
    if(!gun||!model||!playerAvatar)return;
    model.updateWorldMatrix(true,true);
    const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
    // Front-right hand region in world space; normalize against this model's
    // dimensions, then convert to the avatar's local coordinates.
    const point=new THREE.Vector3(bounds.min.x+size.x*0.77,bounds.min.y+size.y*0.62,bounds.min.z+size.z*0.16);
    if(gun.parent!==playerAvatar)playerAvatar.attach(gun);
    gun.position.copy(playerAvatar.worldToLocal(point));
    gun.rotation.set(0,0,0);gun.scale.set(1,1,1);gun.visible=true;gun.updateMatrixWorld(true);
  }

  function restoreProceduralExplorerGun(){
    const gun=explorerEquipment.gun,parent=explorerEquipment.proceduralGunParent;
    if(!gun||!parent)return;
    if(gun.parent!==parent)parent.add(gun);
    if(explorerEquipment.proceduralGunPosition)gun.position.copy(explorerEquipment.proceduralGunPosition);
    if(explorerEquipment.proceduralGunRotation)gun.rotation.copy(explorerEquipment.proceduralGunRotation);
    if(explorerEquipment.proceduralGunScale)gun.scale.copy(explorerEquipment.proceduralGunScale);
    gun.visible=true;gun.updateMatrixWorld(true);
  }

  async function selectExplorerCharacter(characterId){
    const requested=characterId==="trash-can"?"trash-can":characterId==="george"?"george":"original";
    if(requested==="trash-can"&&!trashCanExplorer){
      refreshExplorerSelectorUI();setStatus("LOADING TRASH-CAN ROBOT // KEEPING CURRENT CONTROLS");
      const loaded=await loadTrashCanExplorer();
      if(!loaded){
        activeExplorerCharacter="original";restoreProceduralExplorerGun();refreshExplorerSelectorUI();
        if(georgeExplorer&&georgeExplorer.root)georgeExplorer.root.visible=false;
        if(trashCanExplorer&&trashCanExplorer.root)trashCanExplorer.root.visible=false;
        hideProceduralSuitMeshes(false);setStatus("TRASH-CAN LOAD FAILED // ORIGINAL SPACEMAN RESTORED",true);return false;
      }
    }
    if(requested==="george"&&!georgeExplorer){
      try{await loadGeorgeExplorer();}catch(err){console.warn("[Kepler Reach] George selection load failed",err);}
    }
    activeExplorerCharacter=requested;
    if(georgeExplorer&&georgeExplorer.root)georgeExplorer.root.visible=requested==="george";
    if(trashCanExplorer&&trashCanExplorer.root)trashCanExplorer.root.visible=requested==="trash-can";
    if(requested==="original"){
      restoreProceduralExplorerGun();hideProceduralSuitMeshes(false);
    }else{
      attachExplorerGunToImportedModel(requested==="george"?georgeExplorer&&georgeExplorer.root:trashCanExplorer&&trashCanExplorer.root);
      hideProceduralSuitMeshes(true);
    }
    refreshExplorerSelectorUI();
    setStatus(requested==="trash-can"?"TRASH-CAN ROBOT SELECTED // EXPLORER CONTROLS ONLINE":requested==="george"?"GEORGE-2077 SELECTED // EXPLORER CONTROLS ONLINE":"ORIGINAL SPACEMAN SELECTED // EXPLORER CONTROLS ONLINE");
    return true;
  }

  function updateAvatarAnimation(time){
    // Non-rigged Trash-Can Robot: whole-body mechanical gait until joint pivots are mapped.
    if(activeExplorerCharacter==="trash-can"&&trashCanExplorer&&trashCanExplorer.ready&&trashCanExplorer.root){
      const flying=!!(onFoot&&(playerInSpaceFlight||explorerEquipment.thrusting));
      const walking=!!(avatarIsWalking&&!flying),phase=time*0.0125,model=trashCanExplorer.root;
      model.position.y=trashCanExplorer.baseY+(walking?Math.abs(Math.sin(phase))*0.045:Math.sin(time*0.0018)*0.008);
      model.rotation.x=flying?-0.24:(walking?0.035:0);
      model.rotation.z=walking?Math.sin(phase)*0.032:Math.sin(time*0.0012)*0.009;
      model.rotation.y=trashCanExplorer.baseRotationY+(walking?Math.sin(phase*0.5)*0.018:0);
      return;
    }
    // George GLB: clips if present, else procedural bone/body walk
    if(activeExplorerCharacter==="george"&&georgeExplorer&&georgeExplorer.ready&&georgeExplorer.root) {
      const dt = lastGeorgeAnimTime ? Math.min(0.05, Math.max(0, (time - lastGeorgeAnimTime) / 1000)) : 1/60;
      lastGeorgeAnimTime = time;
      const flying = !!(onFoot && (playerInSpaceFlight || explorerEquipment.thrusting));
      const walking = !!(avatarIsWalking && !flying);

      if (georgeExplorer.mixer && (georgeExplorer.walkAction || georgeExplorer.idleAction)) {
        georgeExplorer.mixer.update(dt);
        if (georgeExplorer.walkAction && georgeExplorer.idleAction) {
          const w = walking ? 1 : 0;
          georgeExplorer.walkAction.setEffectiveWeight(w);
          georgeExplorer.idleAction.setEffectiveWeight(1 - w);
        }
        const bones=georgeExplorer.bones||{},rest=georgeExplorer.boneRest||{},swing=walking?Math.sin(time*0.012):0;
        if(bones.leftArm&&rest.leftArm){bones.leftArm.rotation.z=rest.leftArm.z+1.15;bones.leftArm.rotation.x=rest.leftArm.x-swing*0.25;}
        if(bones.rightArm&&rest.rightArm){bones.rightArm.rotation.z=rest.rightArm.z-1.15;bones.rightArm.rotation.x=rest.rightArm.x+swing*0.25;}
      } else {
        // Procedural walk cycle
        const baseY = georgeExplorer.root.userData.baseY || 0;
        const bones = georgeExplorer.bones || {};
        const rest = georgeExplorer.boneRest || {};
        const hasLegs = !!(bones.leftUpLeg || bones.rightUpLeg);

        const applyPose = (b, key, dx, dy, dz) => {
          if (!b || !rest[key]) return;
          b.rotation.x = rest[key].x + (dx || 0);
          b.rotation.y = rest[key].y + (dy || 0);
          b.rotation.z = rest[key].z + (dz || 0);
        };
        const armPose=georgeExplorer.armDownPose||{};
        const applyArmDown=(key,swing)=>{
          const b=bones[key],r=rest[key],pose=armPose[key];
          if(!b||!r)return;
          b.rotation.set(r.x,r.y,r.z);
          if(pose)b.rotation[pose.axis]+=pose.angle;
          // Small opposing forward/back swing, around an axis other than the
          // one used to lower the arm, so the arm remains hanging beside him.
          const swingAxis=pose?(pose.axis==="x"?"z":"x"):"z";
          b.rotation[swingAxis]+=swing;
        };
        applyArmDown("leftArm",walking?-Math.sin(time*0.012)*0.20:0);
        applyArmDown("rightArm",walking?Math.sin(time*0.012)*0.20:0);
        // Shoulder rest pose is preserved; avoid a fixed shoulder twist that
        // can rotate an otherwise correctly lowered arm back outward.

        if (walking) {
          const t = time * 0.012;
          const swing = Math.sin(t);
          const bob = Math.abs(Math.sin(t)) * 0.06;
          georgeExplorer.root.position.y = baseY + bob;
          georgeExplorer.root.rotation.x = flying ? -0.25 : 0.04;
          georgeExplorer.root.rotation.z = swing * 0.03;

          if (hasLegs) {
            applyPose(bones.leftUpLeg, "leftUpLeg", swing * 0.55, 0, 0);
            applyPose(bones.rightUpLeg, "rightUpLeg", -swing * 0.55, 0, 0);
            applyPose(bones.leftLeg, "leftLeg", -Math.max(0, swing) * 0.45, 0, 0);
            applyPose(bones.rightLeg, "rightLeg", -Math.max(0, -swing) * 0.45, 0, 0);
          }
          // Arm-down pose above already includes a restrained opposing swing.
          if (bones.spine && rest.spine) {
            bones.spine.rotation.y = rest.spine.y + swing * 0.06;
          }
        } else {
          georgeExplorer.root.position.y = baseY;
          georgeExplorer.root.rotation.x = flying ? -0.28 : 0;
          georgeExplorer.root.rotation.z = 0;
        }
      }
      if (flying) georgeExplorer.root.rotation.x = -0.28;
      return;
    }
    if(playerSeatedInShip){
      for(const arm of avatarWalkParts.arms){arm.pivot.rotation.x=0.78;arm.pivot.rotation.z=arm.side*0.10;}
      for(const leg of avatarWalkParts.legs){leg.pivot.rotation.x=1.05;leg.pivot.rotation.z=leg.side*0.035;}
      if(avatarWalkParts.torso)avatarWalkParts.torso.scale.y=1;
      return;
    }
    // Kinetic Field / vector flight: both arms raised ~45° (2 o'clock side profile)
    const flyingPose = !!(onFoot && (playerInSpaceFlight || explorerEquipment.thrusting));
    if(flyingPose){
      for(const arm of avatarWalkParts.arms){
        arm.pivot.rotation.x = -0.95;
        arm.pivot.rotation.z = arm.side * 0.42;
        arm.pivot.rotation.y = 0;
      }
      for(const leg of avatarWalkParts.legs){
        leg.pivot.rotation.x = 0.12;
        leg.pivot.rotation.z = leg.side * 0.02;
      }
      if(avatarWalkParts.torso)avatarWalkParts.torso.scale.y=1.02;
      return;
    }
    const gait=avatarIsWalking?Math.sin(time*0.011)*0.62:0;
    for(const arm of avatarWalkParts.arms){
      arm.pivot.rotation.x=arm.side*gait*0.82;
      arm.pivot.rotation.z=arm.side*0.035;
      arm.pivot.rotation.y=0;
    }
    for(const leg of avatarWalkParts.legs){
      leg.pivot.rotation.x=-leg.side*gait;
      leg.pivot.rotation.z=0;
    }
    if(avatarWalkParts.torso)avatarWalkParts.torso.scale.y=1+Math.sin(time*0.002)*0.008+(avatarIsWalking?0.006:0);
  }

  function orientAvatar() {
    // In powered flight the astronaut's body follows the full 3D flight
    // vector. On foot, the existing upright planetary frame is retained.
    const up=playerUp.clone().normalize();
    let forward=playerInSpaceFlight&&playerFlightForward?playerFlightForward.clone().normalize():playerHeading.clone().addScaledVector(up,-playerHeading.dot(up)).normalize();
    if(forward.lengthSq()<1e-8)forward.set(0,0,-1).applyQuaternion(playerAvatar.quaternion);
    let right=forward.clone().cross(up);
    if(right.lengthSq()<1e-8)right.set(1,0,0).addScaledVector(up,-up.x);
    right.normalize();
    const back=forward.clone().negate(),correctedUp=back.clone().cross(right).normalize();
    const basis=new THREE.Matrix4().makeBasis(right,correctedUp,back);
    playerAvatar.quaternion.setFromRotationMatrix(basis);
    playerRight.copy(right);
    if(playerInSpaceFlight){playerHeading.copy(forward).addScaledVector(up,-forward.dot(up));if(playerHeading.lengthSq()>1e-8)playerHeading.normalize();}
    else{playerHeading.copy(forward);playerUp.copy(correctedUp);}
  }

  function disembark() {
    if (landingState !== "landed" || onFoot || !playerAvatar || !ship) return;
    if(activeLandingBody==="port"&&havenPortRoot){
      stationInteriorMode=true;stationWalkRoot=havenPortRoot;activeSurfaceBody="haven";maritimeOnBoat=false;maritimeDriving=false;
      if(playerAvatar.parent!==scene)scene.attach(playerAvatar);playerSeatedInShip=false;playerAvatar.position.copy(havenPortRoot.localToWorld(new THREE.Vector3(0,3.15,17)));
      const q=havenPortRoot.getWorldQuaternion(new THREE.Quaternion());playerUp.set(0,1,0).applyQuaternion(q).normalize();playerHeading.set(0,0,-1).applyQuaternion(q).normalize();playerFlightForward.copy(playerHeading);
      playerGrounded=true;playerVerticalSpeed=0;playerAirHeight=0;recenterCamera();cameraMode="third";if(cameraButton)cameraButton.style.display="none";
      if(lookPad)lookPad.style.display="grid";if(mobile)mobile.style.display="block";try{clearMoveKeys();releaseMoveStick();syncControlChrome();}catch(_){}try{clearMoveKeys();releaseMoveStick();syncControlChrome();}catch(_){}orientAvatar();onFoot=true;avatarIsWalking=false;playerAvatar.visible=true;ship.visible=true;
      explorerEquipment.thrusting=false;playerInSpaceFlight=false;if(playerFlightVelocity)playerFlightVelocity.set(0,0,0);clearKeys();createPracticeTargets();
      if(disembarkButton)disembarkButton.style.display="none";if(boardShipButton)boardShipButton.style.display="block";if(landingButton)landingButton.style.display="none";if(navLabel)navLabel.style.display="none";if(approachLine)approachLine.visible=false;
      setStatus("L'ASTROLABE // EQUATORIAL OFFSHORE SPACEPORT");showModeHint("L'ASTROLABE  //  MARINA & SPACEPORT");return;
    }


    // v0.4.06: Last Stop home-dock touchdown transitions into the station walking frame.
    if(activeLandingBody==="last"&&lastStopDinerRef){
      stationInteriorMode=true;stationWalkRoot=lastStopDinerRef;activeSurfaceBody="haven";
      if(playerAvatar.parent!==scene)scene.attach(playerAvatar);
      playerSeatedInShip=false;
      playerAvatar.position.copy(lastStopDinerRef.localToWorld(new THREE.Vector3(82,5.9,12)));
      const lsQ=lastStopDinerRef.getWorldQuaternion(new THREE.Quaternion());
      playerUp.set(0,1,0).applyQuaternion(lsQ).normalize();
      playerHeading.set(0,0,-1).applyQuaternion(lsQ).normalize();playerFlightForward.copy(playerHeading);
      playerGrounded=true;playerVerticalSpeed=0;playerAirHeight=0;recenterCamera();cameraMode="third";
      if(cameraButton){cameraButton.style.display="block";cameraButton.textContent="VIEW: THIRD PERSON";}
      if(lookPad)lookPad.style.display="grid";if(mobile)mobile.style.display="block";try{clearMoveKeys();releaseMoveStick();syncControlChrome();}catch(_){}try{clearMoveKeys();releaseMoveStick();syncControlChrome();}catch(_){}
      orientAvatar();onFoot=true;avatarIsWalking=false;playerAvatar.visible=true;ship.visible=true;
      explorerEquipment.thrusting=false;playerInSpaceFlight=false;if(playerFlightVelocity)playerFlightVelocity.set(0,0,0);
      clearKeys();createPracticeTargets();
      if(disembarkButton)disembarkButton.style.display="none";if(boardShipButton)boardShipButton.style.display="block";
      if(landingButton)landingButton.style.display="none";if(navLabel)navLabel.style.display="none";if(approachLine)approachLine.visible=false;
      setStatus("ON FOOT // THE LAST STOP SPACE DOCK");showModeHint("THE LAST STOP  //  SPACE DOCK");return;
    }

    // Solar Commons touchdown transitions directly into the station walking frame.
    if(activeLandingBody==="solar"&&solarHabitatStation){
      stationInteriorMode=true;stationWalkRoot=solarHabitatStation;activeSurfaceBody="haven";
      if(playerAvatar.parent!==scene)scene.attach(playerAvatar);
      playerSeatedInShip=false;
      playerAvatar.position.copy(solarHabitatStation.localToWorld(new THREE.Vector3(112,5.9,-18)));
      const stationQ=solarHabitatStation.getWorldQuaternion(new THREE.Quaternion());
      playerUp.set(0,1,0).applyQuaternion(stationQ).normalize();
      playerHeading.set(0,0,-1).applyQuaternion(stationQ).normalize();playerFlightForward.copy(playerHeading);
      playerGrounded=true;playerVerticalSpeed=0;playerAirHeight=0;recenterCamera();cameraMode="third";
      if(cameraButton){cameraButton.style.display="block";cameraButton.textContent="VIEW: THIRD PERSON";}
      if(lookPad)lookPad.style.display="grid";if(mobile)mobile.style.display="block";try{clearMoveKeys();releaseMoveStick();syncControlChrome();}catch(_){}try{clearMoveKeys();releaseMoveStick();syncControlChrome();}catch(_){}
      orientAvatar();onFoot=true;avatarIsWalking=false;playerAvatar.visible=true;ship.visible=true;
      explorerEquipment.thrusting=false;playerInSpaceFlight=false;if(playerFlightVelocity)playerFlightVelocity.set(0,0,0);
      clearKeys();createPracticeTargets();
      if(disembarkButton)disembarkButton.style.display="none";if(boardShipButton)boardShipButton.style.display="block";
      if(landingButton)landingButton.style.display="none";if(navLabel)navLabel.style.display="none";if(approachLine)approachLine.visible=false;
      setStatus("ON FOOT // SOLAR COMMONS ORBITAL DOCK");showModeHint("SOLAR COMMONS  //  ORBITAL DOCK");return;
    }
    stationInteriorMode = false;stationWalkRoot=null;
    activeSurfaceBody = activeLandingBody;
    const padWorld = landingMarker.getWorldPosition(new THREE.Vector3());
    const padUp = new THREE.Vector3(0, 1, 0)
      .applyQuaternion(landingMarker.getWorldQuaternion(new THREE.Quaternion()))
      .normalize();

    // Step off the pad toward its local right-hand side.
    const padRight = new THREE.Vector3(1, 0, 0)
      .applyQuaternion(landingMarker.getWorldQuaternion(new THREE.Quaternion()))
      .normalize();
    const spawn = padWorld.clone().addScaledVector(padRight, 12);
    const surface = sampleSurface(spawn);

    if(playerAvatar.parent!==scene)scene.attach(playerAvatar);
    playerSeatedInShip=false;
    playerAvatar.position.copy(surface.position);
    playerUp.copy(surface.up);
    playerGrounded = true;
    playerVerticalSpeed = 0;
    playerAirHeight = 0;
    recenterCamera();cameraMode="third";
    if(cameraButton){cameraButton.style.display="block";cameraButton.textContent="VIEW: THIRD PERSON";}
    if(lookPad)lookPad.style.display="grid";if(mobile)mobile.style.display="block";try{clearMoveKeys();releaseMoveStick();syncControlChrome();}catch(_){}try{clearMoveKeys();releaseMoveStick();syncControlChrome();}catch(_){}

    // Face away from the ship, projected onto the local tangent plane.
    playerHeading.copy(padRight).addScaledVector(playerUp, -padRight.dot(playerUp)).normalize();
    playerFlightForward.copy(playerHeading);
    orientAvatar();

    onFoot = true;
    avatarIsWalking = false;
    playerAvatar.visible = true;
    ship.visible = true;
    explorerEquipment.thrusting=false;playerInSpaceFlight=false;if(playerFlightVelocity)playerFlightVelocity.set(0,0,0);
    clearKeys();
    createPracticeTargets();

    if (disembarkButton) disembarkButton.style.display = "none";
    if (boardShipButton) boardShipButton.style.display = "block";
    try { clearMoveKeys(); releaseMoveStick(); syncControlChrome(); } catch(_){}
    if (landingButton) landingButton.style.display = "none";
    if (navLabel) navLabel.style.display = "none";
    if (approachLine) approachLine.visible = false;

    const bodyName=activeSurfaceBody==="moon"?"LUNA":"HAVEN";
    if(activeSurfaceBody==="moon"){
      setStatus("LUNA MINE // ORANGE SIGN BY THE PAD // SHOOT THE ROCKS");
      showModeHint("LUNA MINE  //  SHOOT GOLDEN ROCKS FOR ORE");
      try { if(!lunaMineRoot) installLunaMineField(); } catch(err){ console.warn(err); }
    } else {
      setStatus("ON FOOT // "+bodyName+" SURFACE // FLY TO LUNA FOR THE MINE");
      showModeHint("ON FOOT  //  "+bodyName+" SURFACE");
      try { spawnPadMineAsteroid(true); } catch (err) { console.warn("[Kepler Reach] voxel spawn failed", err); }
    }
  }

  function boardShip() {
    if (!onFoot || !playerAvatar || !ship) return;

    const padWorld = landingMarker.getWorldPosition(new THREE.Vector3());
    let padUp = new THREE.Vector3(0, 1, 0)
      .applyQuaternion(landingMarker.getWorldQuaternion(new THREE.Quaternion()))
      .normalize();

    const distanceToPad = playerAvatar.position.distanceTo(padWorld);
    const distanceToShip = playerAvatar.position.distanceTo(ship.position);
    const distance = Math.min(distanceToPad, distanceToShip);
    if (distance > 36) {
      setStatus("SHIP OUT OF REACH // WALK BACK TO THE LANDING PAD");
      return;
    }

    // v0.4.06: a ship that was left parked in place (the home dock at game start, or after
    // a manual stop) launches from where it sits instead of teleporting to the last landing pad.
    const launchInPlace = landingState !== "landed" && distanceToShip <= 36;

    // Boarding is also the launch transition. Leaving landingState as
    // "landed" keeps updateFlight() in its stationary touchdown branch.
    // Reset that state and stage the ship clear of Haven's surface.
    setShipParked(false);
    ship.visible = true;
    ship.attach(playerAvatar);
    playerSeatedInShip=true;
    playerAvatar.position.set(-0.88,-0.72,-2.68);
    playerAvatar.rotation.set(0,0,0);
    playerAvatar.visible = true;
    onFoot = false;
    explorerEquipment.thrusting=false;playerInSpaceFlight=false;if(playerFlightVelocity)playerFlightVelocity.set(0,0,0);keys.space=false;
    playerGrounded = true;
    playerVerticalSpeed = 0;
    playerAirHeight = 0;
    buggyMode = false;
    landingState = "idle";
    if (launchInPlace) {
      padUp = new THREE.Vector3(0, 1, 0).applyQuaternion(ship.getWorldQuaternion(new THREE.Quaternion())).normalize();
      ship.position.addScaledVector(padUp, 4);
    } else {
      ship.position.copy(landingDestination).addScaledVector(padUp, 10);
      ship.quaternion.copy(landingQuaternion);
    }
    velocity.x = velocity.y = velocity.z = 0;
    clearKeys();

    if (boardShipButton) boardShipButton.style.display = "none";
    if (cameraButton) { cameraButton.style.display = "block"; cameraButton.textContent = cameraMode === "first" ? "VIEW: CHASE" : "VIEW: COCKPIT"; }
    if (mobile) mobile.style.display = "block";
    if (lookPad) lookPad.style.display = "grid";
    // Disembark is only available after the next confirmed touchdown.
    if (disembarkButton) disembarkButton.style.display = "none";
    if (landingButton) {
      landingButton.style.display = "block";
      landingButton.textContent = "LANDING ASSIST";
      landingButton.disabled = false;
      landingButton.style.opacity = "1";
    }
    if (approachLine) approachLine.visible = true;

    // Start with a small outward impulse so the ship visibly clears
    // the landing pad; normal W/A/D/Q/E flight controls take over.
    velocity.x = padUp.x * 9;
    velocity.y = padUp.y * 9;
    velocity.z = padUp.z * 9;

    camera.up.set(0, 1, 0);
    camera.position.copy(ship.position).addScaledVector(padUp, 12);
    lookTarget.copy(ship.position).addScaledVector(padUp, 4);
    camera.lookAt(lookTarget);
    setStatus((launchInPlace?"ABOARD // LAUNCHED FROM PARKED POSITION":"BACK ABOARD // "+(activeLandingBody==="last"?"THE LAST STOP":activeLandingBody==="solar"?"SOLAR COMMONS":activeSurfaceBody==="moon"?"LUNA":"HAVEN")+" LANDING SITE"));
    showModeHint("SPACECRAFT  //  FLIGHT CONTROLS");
  }


  function addVehicleOccupant(spec){return !!(havenBuggy&&havenBuggy.userData.addOccupant&&havenBuggy.userData.addOccupant(spec));}
  function removeVehicleOccupant(id){return !!(havenBuggy&&havenBuggy.userData.removeOccupant&&havenBuggy.userData.removeOccupant(id));}

  function openWildlifeHabitat(){
    if(faunaReleased||!onFoot||!playerAvatar||!habitatGate)return;
    const gatePos=habitatGate.getWorldPosition(new THREE.Vector3());
    if(playerAvatar.position.distanceTo(gatePos)>28){setStatus("WILDLIFE RESERVE GATE // WALK CLOSER");return;}
    faunaReleased=true;faunaReleaseTime=performance.now()*0.001;habitatGateOpen=true;
    if(habitatGateButton){
      habitatGateButton.textContent="WILDLIFE RELEASED";
      habitatGateButton.disabled=true;
      habitatGateButton.style.opacity="0.72";
      // The release confirmation is temporary; the habitat remains open.
      setTimeout(()=>{if(habitatGateButton)habitatGateButton.style.display="none";},5000);
    }
    setStatus("HABITAT GATES OPEN // GRAZERS ARE EXPLORING HAVEN");
  }

  function toggleBuggy() {
    if (buggyMode) { exitBuggy(); return; }
    if (!onFoot || !playerAvatar || !havenBuggy) return;
    const p=havenBuggy.getWorldPosition(new THREE.Vector3());
    if (playerAvatar.position.distanceTo(p)>13) { setStatus("ROVER TOO FAR // WALK CLOSER"); return; }
    buggyMode=true; buggySpeed=0; avatarIsWalking=false; playerAvatar.visible=false;
    addVehicleOccupant({id:"local-driver",type:"player",label:"You",slot:"driver"});
    if(cameraButton){cameraButton.style.display="block";cameraButton.textContent="VIEW: CHASE CAMERA";}if(lookPad)lookPad.style.display="grid";if(mobile)mobile.style.display="block";try{clearMoveKeys();releaseMoveStick();syncControlChrome();}catch(_){}try{clearMoveKeys();releaseMoveStick();syncControlChrome();}catch(_){}
    buggyInteractButton.textContent="EXIT MOON BUGGY"; buggyInteractButton.style.display="block";
    if (boardShipButton) boardShipButton.style.display="none";
    clearKeys(); setStatus("LUNA UTILITY ROVER // W A S D TO DRIVE");
    showModeHint("LUNA UTILITY ROVER  //  W A S D TO DRIVE");
  }

  function exitBuggy() {
    if (!buggyMode || !havenBuggy || !playerAvatar) return;
    removeVehicleOccupant("local-driver");
    const q=havenBuggy.getWorldQuaternion(new THREE.Quaternion());
    const p=havenBuggy.getWorldPosition(new THREE.Vector3());
    const right=new THREE.Vector3(1,0,0).applyQuaternion(q).normalize();
    const surface=sampleSurface(p.addScaledVector(right,3.8));
    playerAvatar.position.copy(surface.position); playerUp.copy(surface.up);
    const fwd=new THREE.Vector3(0,0,-1).applyQuaternion(q);
    playerHeading.copy(fwd).addScaledVector(playerUp,-fwd.dot(playerUp)).normalize();
    playerFlightForward.copy(playerHeading);
    orientAvatar(); buggyMode=false; buggySpeed=0; avatarIsWalking=false; playerAvatar.visible=cameraMode==="third";
    if(cameraButton){cameraButton.style.display="block";cameraButton.textContent=cameraMode==="first"?"VIEW: FIRST PERSON":"VIEW: THIRD PERSON";}if(lookPad)lookPad.style.display="grid";if(mobile)mobile.style.display="block";try{clearMoveKeys();releaseMoveStick();syncControlChrome();}catch(_){}try{clearMoveKeys();releaseMoveStick();syncControlChrome();}catch(_){}
    buggyInteractButton.style.display="none"; if(boardShipButton)boardShipButton.style.display="block";
    const bodyName=activeSurfaceBody==="moon"?"LUNA":"HAVEN";
    clearKeys(); try{clearMoveKeys();releaseMoveStick();syncControlChrome();}catch(_){}
    setStatus("ON FOOT // "+bodyName+" SURFACE");
    showModeHint("ON FOOT  //  "+bodyName+" SURFACE");
  }

  function updateBuggy(delta) {
    if (!buggyMode || !havenBuggy) return;
    // labels: syncControlChrome()
    const steer=(keys.a?1:0)-(keys.d?1:0), throttle=(keys.w?1:0)-(keys.s?1:0);
    cameraYaw -= lookInputX * 1.45 * delta;
    cameraPitch = THREE.MathUtils.clamp(cameraPitch - lookInputY * 1.0 * delta, -0.18, 0.72);
    buggyHeading += steer*1.35*delta*(buggySpeed<0?-1:1);
    buggySpeed += (throttle*13-buggySpeed)*Math.min(1,(throttle?8.5:3.2)*delta);
    const upAxis=new THREE.Vector3(0,1,0);
    const yaw=new THREE.Quaternion().setFromAxisAngle(upAxis,buggyHeading);
    const pos=havenBuggy.position.clone(), normal=pos.clone().normalize();
    const surfaceQ=new THREE.Quaternion().setFromUnitVectors(upAxis,normal);
    const forwardLocal=new THREE.Vector3(0,0,-1).applyQuaternion(yaw).applyQuaternion(surfaceQ);
    const candidate=pos.addScaledVector(forwardLocal,buggySpeed*delta), nextNormal=candidate.clone().normalize();
    const terrain=moonTerrainProfile(nextNormal.x,nextNormal.y,nextNormal.z);
    nextNormal.multiplyScalar(CONFIG.moonRadius+terrain.elevation+0.95);
    // Keep radial terrain following, but route rover movement through shared
    // solid collision and world-boundary handling; ignore its own meshes.
    moonWorld.updateWorldMatrix(true,false);
    const fromWorld=moonWorld.localToWorld(pos.clone()),targetWorld=moonWorld.localToWorld(nextNormal.clone());
    const roverUp=fromWorld.clone().sub(moonWorld.getWorldPosition(new THREE.Vector3())).normalize();
    const resolved=resolvePhysicalActorStep({from:fromWorld.toArray(),to:targetWorld.toArray(),up:roverUp.toArray(),
      radius:BUGGY_COLLISION_RADIUS,height:2.2,maxSubstepDistance:0.3,exclude:[havenBuggy]});
    const resolvedLocal=moonWorld.worldToLocal(new THREE.Vector3(...resolved.position)),resolvedNormal=resolvedLocal.clone().normalize();
    const resolvedTerrain=moonTerrainProfile(resolvedNormal.x,resolvedNormal.y,resolvedNormal.z);
    resolvedLocal.copy(resolvedNormal).multiplyScalar(CONFIG.moonRadius+resolvedTerrain.elevation+0.95);
    havenBuggy.position.copy(resolvedLocal);
    const nextQ=new THREE.Quaternion().setFromUnitVectors(upAxis,nextNormal.clone().normalize());
    havenBuggy.quaternion.copy(nextQ).multiply(yaw);
    for(const wheel of buggyWheels) wheel.rotation.x-=buggySpeed*delta/0.57;
    const worldPos=havenBuggy.getWorldPosition(new THREE.Vector3()), worldQ=havenBuggy.getWorldQuaternion(new THREE.Quaternion());
    const worldUp=new THREE.Vector3(0,1,0).applyQuaternion(worldQ).normalize();
    const worldForward=new THREE.Vector3(0,0,-1).applyQuaternion(worldQ).normalize();
    camera.up.copy(worldUp);
    if(cameraMode==="first"){
      const eye=worldPos.clone().addScaledVector(worldUp,2.15).addScaledVector(worldForward,0.25);
      const viewForward=worldForward.clone().applyAxisAngle(worldUp,cameraYaw);
      viewForward.addScaledVector(worldUp,Math.tan(cameraPitch-0.32)*0.65).normalize();
      camera.position.copy(eye);
      camera.lookAt(eye.clone().addScaledVector(viewForward,12));
      if(cameraButton)cameraButton.textContent="VIEW: DRIVER POV";
    }else{
      const back=worldForward.clone().negate().applyAxisAngle(worldUp,cameraYaw);
      const desired=worldPos.clone().addScaledVector(back,8.5*Math.cos(cameraPitch)).addScaledVector(worldUp,8.5*Math.sin(cameraPitch));
      const buggyTarget=worldPos.clone().addScaledVector(worldUp,1.4);
      desired.copy(resolveCameraSafe(buggyTarget,desired,[havenBuggy,playerAvatar],{minDist:2.5}));
      camera.position.lerp(desired,1-Math.pow(0.00008,delta));
      camera.lookAt(worldPos.clone().addScaledVector(worldUp,1.4).addScaledVector(worldForward,2.2));
      if(cameraButton)cameraButton.textContent="VIEW: CHASE CAMERA";
    }
    const speed=document.getElementById("kr-speed"), loc=document.getElementById("kr-location"), phase=document.getElementById("kr-phase");
    if(speed)speed.textContent="ROVER SPEED: "+Math.abs(buggySpeed).toFixed(1);
    if(loc)loc.textContent="LOCATION: LUNA // UTILITY ROVER";
    if(phase)phase.textContent="MODE: SURFACE VEHICLE";
  }

  function updateAmbientFauna(time) {
    const seconds=time*0.001;
    const playerPosition = buggyMode && havenBuggy
      ? havenBuggy.position
      : (onFoot && playerAvatar && planetWorld
        ? planetWorld.worldToLocal(playerAvatar.position.clone())
        : null);

    for(const creature of ambientFauna){
      if(creature.kind!=="mote"){
        const releasedBlend=faunaReleased?Math.min(1,Math.max(0,(seconds-faunaReleaseTime)/8)):0;
        const releaseTargetX=50+(creature.phase-Math.PI)*2.2;
        const releaseTargetZ=10+Math.sin(creature.phase)*7;
        const centerX=creature.homeX+(releaseTargetX-creature.homeX)*releasedBlend;
        const centerZ=creature.homeZ+(releaseTargetZ-creature.homeZ)*releasedBlend;
        const cycle=((seconds*0.075+creature.phase/(Math.PI*2))%1+1)%1;
        const resting=cycle>0.43&&cycle<0.57;
        const grazing=cycle<=0.43;
        const rx=(faunaReleased?13:creature.roamX)*(resting?0.12:1);
        const rz=(faunaReleased?10:creature.roamZ)*(resting?0.12:1);
        const ax=seconds*(creature.kind==="hopper"?0.28:0.19)+creature.phase;
        const az=seconds*(creature.kind==="hopper"?0.23:0.15)+creature.phase*1.37;
        let x=centerX+Math.sin(ax)*rx;
        let z=centerZ+Math.cos(az)*rz;

        // A nearby explorer or rover startles ground fauna. Released
        // grazers gradually regroup rather than remaining at the gate.
        if(playerPosition){
          const creatureWorld=creature.group.position;
          const away=creatureWorld.clone().sub(playerPosition);
          const distance=away.length();
          if(distance<15&&distance>0.001){
            away.normalize();
            const awayLocalX=away.dot(havenEast), awayLocalZ=away.dot(havenNorth);
            const strength=(15-distance)/15;
            x+=awayLocalX*strength*(creature.kind==="hopper"?11:16);
            z+=awayLocalZ*strength*(creature.kind==="hopper"?11:16);
            creature.state="startled";
          }else{
            creature.state=resting?"resting":(grazing?"foraging":"wandering");
          }
        }else{
          creature.state=resting?"resting":(grazing?"foraging":"wandering");
        }

        const offset=havenEast.clone().multiplyScalar(x).addScaledVector(havenNorth,z);
        const normal=havenUp.clone().addScaledVector(offset,1/CONFIG.planetRadius).normalize();
        const terrain=terrainProfile(normal.x,normal.y,normal.z);
        creature.group.position.copy(normal).multiplyScalar(CONFIG.planetRadius+terrain.elevation+(creature.kind==="hopper"?0.055:0.08));
        const heading=Math.atan2(Math.cos(ax)*rx*0.19,-Math.sin(az)*rz*0.15);
        const frameQ=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),normal);
        creature.group.quaternion.copy(frameQ).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),heading));
        const stride=creature.state==="startled"?0.46:(resting?0.025:(creature.kind==="hopper"?0.31:0.2));
        for(let i=0;i<creature.legs.length;i++){
          creature.legs[i].rotation.x=Math.sin(seconds*(creature.state==="startled"?9:5.2)+creature.phase+i*1.7)*stride;
        }
        creature.group.position.addScaledVector(normal,Math.sin(seconds*(resting?0.7:2.1)+creature.phase)*(resting?0.012:0.045));
      }else{
        const bob=Math.sin(seconds*2.1+creature.phase);
        creature.group.position.copy(creature.basePosition).addScaledVector(creature.surfaceUp,bob*creature.amplitude);
        for(const wing of creature.wings)wing.pivot.rotation.z=wing.side*(0.18+Math.sin(seconds*12+creature.phase)*0.58);
        // Hovering motes loosely orbit one another, forming a living cloud.
        const flock=faunaReleased?0.85:0.38;
        const driftX=Math.sin(seconds*0.24+creature.phase)*flock;
        const driftZ=Math.cos(seconds*0.21+creature.phase*1.4)*flock;
        creature.group.position.addScaledVector(havenEast,driftX).addScaledVector(havenNorth,driftZ);
        creature.group.quaternion.copy(creature.baseQuaternion).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.sin(seconds*0.7+creature.phase)*0.08));
      }
    }
    for(const leaf of habitatGateLeaves){
      const target=habitatGateOpen?leaf.side*1.12:0;
      leaf.hinge.rotation.y+=(target-leaf.hinge.rotation.y)*0.09;
    }
  }

  // PERSONAL SPACEFLIGHT // TWO-BODY PLANET-TO-PLANET JETPACK
  function getCelestialBodyState(root,radius,profile,position,gravityAtSurface){
    const local=root.worldToLocal(position.clone()),distance=Math.max(.001,local.length()),radial=local.clone().normalize();
    const terrain=profile(radial.x,radial.y,radial.z),terrainRadius=radius+terrain.elevation+AVATAR_SOLE_CLEARANCE;
    const rotation=root.getWorldQuaternion(new THREE.Quaternion()),up=radial.clone().applyQuaternion(rotation).normalize();
    const surfacePosition=root.localToWorld(radial.clone().multiplyScalar(terrainRadius));
    const gravity=gravityAtSurface*Math.pow(terrainRadius/Math.max(distance,terrainRadius),2);
    return {distance,altitude:distance-terrainRadius,up,surfacePosition,gravity};
  }
  function updateKineticFieldFlight(delta){
    if(!playerAvatar||!playerFlightVelocity||!playerInSpaceFlight||!playerFlightForward)return;
    const dt=Math.min(delta,.05);
    const haven=getCelestialBodyState(planetWorld,CONFIG.planetRadius,terrainProfile,playerAvatar.position,BODY_PHYSICS.haven.gravity);
    const luna=getCelestialBodyState(moonWorld,CONFIG.moonRadius,moonTerrainProfile,playerAvatar.position,BODY_PHYSICS.moon.gravity);
    const nearestBody=haven.altitude<=luna.altitude?"haven":"moon",nearest=nearestBody==="haven"?haven:luna;
    const gravityField=queryGravityField(playerAvatar.position);
    const stationDeck=!!(gravityField&&gravityField.kind==="directional");
    const previousGravityUp=playerUp.clone().normalize();
    const gravityUp=gravityField?gravityField.up.clone():nearest.up.clone();
    const gravity=gravityField?gravityField.magnitude:nearest.gravity;
    // Carry the flight attitude into the current gravity frame. Without this
    // transport, the forward vector retains the orientation of the surface
    // where Kinetic Field was last activated, even after entering another field.
    if(previousGravityUp.lengthSq()>1e-8&&previousGravityUp.dot(gravityUp)<0.999999){
      const gravityFrameChange=new THREE.Quaternion().setFromUnitVectors(previousGravityUp,gravityUp);
      playerFlightForward.applyQuaternion(gravityFrameChange).normalize();
    }
    playerUp.copy(gravityUp);
    const yawInput=THREE.MathUtils.clamp(touchFlightYaw+(keys.a?1:0)-(keys.d?1:0),-1,1);
    const pitchInput=THREE.MathUtils.clamp(touchFlightPitch+(keys.w?1:0)-(keys.s?1:0),-1,1);
    playerFlightForward.normalize();
    if(yawInput)playerFlightForward.applyAxisAngle(playerUp,-yawInput*2.25*dt);
    let flightRight=playerFlightForward.clone().cross(playerUp);
    if(flightRight.lengthSq()<1e-8)flightRight.copy(playerRight);
    flightRight.normalize();
    if(pitchInput)playerFlightForward.applyAxisAngle(flightRight,pitchInput*1.95*dt);
    playerFlightForward.normalize();
    const translationRight=playerFlightForward.clone().cross(playerUp);
    if(translationRight.lengthSq()<1e-8)translationRight.copy(playerRight);
    translationRight.normalize();
    const precisionForward=THREE.MathUtils.clamp(touchFlightThrust,-1,1);
    const precisionStrafe=THREE.MathUtils.clamp(touchFlightStrafe,-1,1);
    const precisionInput=Math.hypot(precisionForward,precisionStrafe);
    const thrusting=!!keys.space||precisionInput>0.01;
    if(thrusting){
      const translation=new THREE.Vector3();
      if(keys.space){
        translation.addScaledVector(playerFlightForward,24);
        translation.addScaledVector(translationRight,precisionStrafe*8);
      }else{
        translation.addScaledVector(playerFlightForward,precisionForward*8);
        translation.addScaledVector(translationRight,precisionStrafe*8);
        if(translation.lengthSq()>1e-8)translation.normalize().multiplyScalar(8*Math.min(1,precisionInput));
      }
      playerFlightVelocity.copy(translation);
      const from=playerAvatar.position.clone(),desired=from.clone().addScaledVector(translation,dt);
      playerAvatar.position.copy(constrainSolarDomeFlight(from,resolveSolidMovement(from,desired,playerUp)));
    }else{
      const fallSpeed=Math.min(10,Math.max(0,gravity*.8)),down=gravityUp.clone().negate();
      playerFlightVelocity.copy(down).multiplyScalar(fallSpeed);
      const from=playerAvatar.position.clone(),desired=from.clone().addScaledVector(down,fallSpeed*dt);
      playerAvatar.position.copy(constrainSolarDomeFlight(from,resolveSolidMovement(from,desired,playerUp)));
    }
    const h2=getCelestialBodyState(planetWorld,CONFIG.planetRadius,terrainProfile,playerAvatar.position,BODY_PHYSICS.haven.gravity);
    const l2=getCelestialBodyState(moonWorld,CONFIG.moonRadius,moonTerrainProfile,playerAvatar.position,BODY_PHYSICS.moon.gravity);
    let landed=false,landingName="";
    if(solarHabitatStation){solarHabitatStation.updateMatrixWorld(true);const local=solarHabitatStation.worldToLocal(playerAvatar.position.clone()),up=new THREE.Vector3(0,1,0).applyQuaternion(solarHabitatStation.getWorldQuaternion(new THREE.Quaternion()));const inApron=local.x>=46&&local.x<=162&&local.z>=-52&&local.z<=190;if(inApron&&local.y<=7.1&&local.y>=3.5&&playerFlightVelocity.dot(up)<0){local.y=5.9;playerAvatar.position.copy(solarHabitatStation.localToWorld(local));stationInteriorMode=true;stationWalkRoot=solarHabitatStation;playerUp.copy(up);landed=true;landingName="SOLAR COMMONS";}}
    if(!landed&&station){
      station.updateMatrixWorld(true);
      const local=station.worldToLocal(playerAvatar.position.clone());
      const inDiner=local.x>=-41&&local.x<=41&&Math.abs(local.z)<=29;
      const inApron=local.x>=38&&local.x<=154&&Math.abs(local.z)<=47;
      if((inDiner||inApron)&&local.y<=6.9&&local.y>=3.5&&playerFlightVelocity.dot(new THREE.Vector3(0,1,0).applyQuaternion(station.getWorldQuaternion(new THREE.Quaternion())))<0){
        local.y=5.9;playerAvatar.position.copy(station.localToWorld(local));
        stationInteriorMode=true;stationWalkRoot=lastStopDinerRef;
        playerUp.set(0,1,0).applyQuaternion(station.getWorldQuaternion(new THREE.Quaternion())).normalize();
        landed=true;landingName="LAST STOP";
      }
    }
    let landingSupport=null;
    if(!landed&&playerFlightVelocity.dot(gravityUp)<-0.01){
      const structural=sampleFootSupport(playerAvatar.position,gravityUp,{maxRise:0.35,maxDrop:1.35});
      if(structural&&structural.supportObject){
        landingSupport=structural;
        playerAvatar.position.copy(structural.position);
        playerUp.copy(structural.up);
        activeSurfaceBody=nearestBody;
        stationInteriorMode=false;
        stationWalkRoot=null;
        landed=true;
        landingName=String(structural.supportId||"STRUCTURE").replace(/-/g," ").toUpperCase();
      }
    }
    if(!landed){
      const body=h2.altitude<=l2.altitude?"haven":"moon",state=body==="haven"?h2:l2;
      if(state.altitude<=1.35&&playerFlightVelocity.dot(state.up)<0){
        activeSurfaceBody=body==="moon"?"moon":"haven";stationInteriorMode=false;stationWalkRoot=null;
        const surface=sampleSurface(playerAvatar.position);
        playerAvatar.position.copy(surface.position);playerUp.copy(surface.up);
        landed=true;landingName=body==="moon"?"LUNA":"HAVEN";
      }
    }
    if(landed){
      playerHeading.copy(playerFlightForward).addScaledVector(playerUp,-playerFlightForward.dot(playerUp));
      if(playerHeading.lengthSq()<1e-8)playerHeading.set(0,0,-1);else playerHeading.normalize();
      playerGrounded=true;playerVerticalSpeed=0;playerAirHeight=0;playerFlightVelocity.set(0,0,0);
      if(landingSupport)rememberPlayerSupport(landingSupport);else clearPlayerSupportFrame();
      playerInSpaceFlight=false;keys.space=false;touchFlightThrust=touchFlightStrafe=0;
      touchFlightThrust=touchFlightStrafe=touchFlightYaw=touchFlightPitch=0;
      setStatus("FLIGHT LANDING // "+landingName);updateEquipmentHUD();
    }else playerGrounded=false;
    orientAvatar();avatarIsWalking=false;
    const nearestAltitude=Math.max(0,Math.min(h2.altitude,l2.altitude));
    jetpackAltitude=nearestAltitude;
    const phase=nearestAltitude>500?"DEEP SPACE":(h2.altitude<=l2.altitude?"HAVEN":"LUNA")+" APPROACH";
    const loc=document.getElementById("kr-location"),sp=document.getElementById("kr-speed"),dist=document.getElementById("kr-distance"),ph=document.getElementById("kr-phase");
    if(loc)loc.textContent="LOCATION: "+(landed?landingName:phase);
    if(sp)sp.textContent=thrusting?"FLIGHT: POWERED":"FLIGHT: GRAVITY / STOPPED";
    if(dist)dist.textContent="NEAREST SURFACE: "+nearestAltitude.toFixed(0)+" M";
    if(ph)ph.textContent="FLIGHT MODE: "+(thrusting?"ROCKET ON":"ROCKET RELEASED");
    if(equipmentReadout)equipmentReadout.textContent=thrusting?"ROCKET FLIGHT":"GRAVITY DESCENT";
    playerCameraTarget.copy(playerAvatar.position).addScaledVector(playerUp,1.25);camera.up.copy(playerUp);
    if(cameraMode==="first"){
      const head=playerAvatar.position.clone().addScaledVector(playerUp,1.84);
      camera.position.copy(head);
      const view=playerFlightForward.clone().applyAxisAngle(playerUp,flightCameraYaw);
      camera.lookAt(head.clone().addScaledVector(view,28));
    }else{
      const cameraBase=playerFlightForward.clone(),verticalAlignment=cameraBase.dot(playerUp);
      if(Math.abs(verticalAlignment)>.96){
        const horizontal=playerHeading.clone().addScaledVector(playerUp,-playerHeading.dot(playerUp));
        if(horizontal.lengthSq()<1e-8)horizontal.set(0,0,-1);
        cameraBase.copy(horizontal.normalize().multiplyScalar(.28)).addScaledVector(playerUp,Math.sign(verticalAlignment)*.96).normalize();
      }
      const viewForward=cameraBase.applyAxisAngle(playerUp,flightCameraYaw);
      const viewRight=viewForward.clone().cross(playerUp).normalize();
      viewForward.applyAxisAngle(viewRight,flightCameraPitch).normalize();
      const desired=playerAvatar.position.clone().addScaledVector(viewForward,-9.5).addScaledVector(playerUp,2.5);
      const cameraTarget=playerAvatar.position.clone().addScaledVector(playerUp,1.0);
      desired.copy(resolveCameraSafe(cameraTarget,desired,[playerAvatar]));
      camera.position.lerp(desired,1-Math.pow(.00008,dt));
      camera.lookAt(playerAvatar.position.clone().addScaledVector(viewForward,5).addScaledVector(playerUp,1));
    }
  }
  function updateOnFoot(delta) {
    if (!onFoot || !playerAvatar) return;
    navReadout.style.display=cameraMode==="first"?"flex":"none";
    navReadout.style.width = "auto";
    navReadout.style.maxWidth = "230px";
    navReadout.style.padding = "5px 8px";
    if (navReadout.children[2]) navReadout.children[2].style.display = "none";
    if (navReadout.children[3]) navReadout.children[3].style.display = "none";
    if (buggyMode) return;
    if(buggyInteractButton&&havenBuggy){const d=playerAvatar.position.distanceTo(havenBuggy.getWorldPosition(new THREE.Vector3())),near=d<=13&&!playerInSpaceFlight;buggyInteractButton.dataset.active=near?"1":"0";buggyInteractButton.style.display=near?"block":"none";}
    updateMaritimePrompt();
    if(maritimeDriving){updateMaritimeVehicle(delta);return;}
    if(keys.space&&!playerInSpaceFlight&&playerGrounded){
      if(stationInteriorMode&&stationWalkRoot){
        const bounds=stationWalkRoot.userData&&stationWalkRoot.userData.walkBounds;
        const hasExplicitLaunchGate=!!(bounds&&Number.isFinite(bounds.launchX)&&bounds.launchX>-900);
        const isLastStopInterior=stationWalkRoot===lastStopDinerRef;
        const launchX=hasExplicitLaunchGate?bounds.launchX:(isLastStopInterior?38:null);
        if(launchX!==null){
          const local=stationWalkRoot.worldToLocal(playerAvatar.position.clone());
          if(local.x<launchX){keys.space=false;setStatus("WALK OUT TO THE SPACE DOCK TO LAUNCH");return;}
        }
      }
      clearPlayerSupportFrame();
      playerInSpaceFlight=true;playerGrounded=false;
      playerFlightForward.copy(playerHeading).addScaledVector(playerUp,.38).normalize();
      playerFlightVelocity.set(0,0,0);
      touchFlightYaw=touchFlightPitch=touchFlightThrust=touchFlightStrafe=0;
      setStatus("KINETIC FIELD // ARCADE CONTROL");
    }
    if(playerInSpaceFlight){updateKineticFieldFlight(delta);return;}
    const turn = (keys.a ? 1 : 0) - (keys.d ? 1 : 0);
    const walk = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);

    // The Last Stop is a station interior, not a planetary surface. Use a
    // simple flat local-space walking frame so surface sampling cannot snap
    // the player through the deck and down to Haven.
    if(stationInteriorMode&&stationWalkRoot&&!playerInSpaceFlight){
      clearPlayerSupportFrame();
      const stationQ=stationWalkRoot.getWorldQuaternion(new THREE.Quaternion());
      const dockWalk=stationWalkRoot===havenShoreDockRoot,dockRadius=CONFIG.planetRadius+2.1;
      const beforeLocal=stationWalkRoot.worldToLocal(playerAvatar.position.clone());
      const stationUp=(dockWalk?new THREE.Vector3(0,Math.sqrt(Math.max(0,dockRadius*dockRadius-beforeLocal.z*beforeLocal.z))/dockRadius,beforeLocal.z/dockRadius):new THREE.Vector3(0,1,0)).applyQuaternion(stationQ).normalize();
      if(turn)playerHeading.applyAxisAngle(stationUp,turn*1.9*delta).normalize();
      if(walk){
        const from=playerAvatar.position.clone();
        const desired=from.clone().addScaledVector(playerHeading,walk*WORLD_SCALE.walkSpeed*delta);
        const movement=resolveCharacterWalkStep(from,desired,stationUp,{supportMode:"fixed"});
        playerAvatar.position.copy(movement.position);
      }
      const local=stationWalkRoot.worldToLocal(playerAvatar.position.clone()),bounds=stationWalkRoot.userData.walkBounds||{minX:-38,maxX:154,minZ:-47,maxZ:47,floorY:5.9};local.x=THREE.MathUtils.clamp(local.x,bounds.minX,bounds.maxX);local.z=THREE.MathUtils.clamp(local.z,bounds.minZ,bounds.maxZ);
      if(stationWalkRoot===solarHabitatStation){const dx=local.x-104,dz=local.z-104,r=Math.hypot(dx,dz),zone=Math.abs(dx)<35&&local.z>66&&local.z<143,door=Math.abs(dx)<3.75&&local.z>67&&local.z<78;if(zone&&r>29.15&&!door){const k=29.15/r;local.x=104+dx*k;local.z=104+dz*k;}}
      if(dockWalk){const z=THREE.MathUtils.clamp(local.z,-dockRadius+1,dockRadius-1),radialY=Math.sqrt(Math.max(0,dockRadius*dockRadius-z*z));local.z=z;local.y=bounds.floorY+radialY-dockRadius;playerUp.set(0,radialY/dockRadius,z/dockRadius).applyQuaternion(stationQ).normalize();}else{local.y=bounds.floorY;playerUp.set(0,1,0).applyQuaternion(stationQ).normalize();}
      playerAvatar.position.copy(stationWalkRoot.localToWorld(local));playerHeading.addScaledVector(playerUp,-playerHeading.dot(playerUp)).normalize();
      orientAvatar();avatarIsWalking=!!walk;updateSolarCommonsInteraction();
      playerCameraTarget.copy(playerAvatar.position).addScaledVector(playerUp,1.0);
      camera.up.copy(playerUp);
      cameraYaw-=lookInputX*1.75*delta;
      cameraPitch=THREE.MathUtils.clamp(cameraPitch-lookInputY*1.15*delta,-0.12,0.88);
      if(cameraMode==="first"){
        const head=playerAvatar.position.clone().addScaledVector(playerUp,1.84);
        camera.position.copy(head);
        camera.lookAt(head.clone().add(playerHeading.clone().applyAxisAngle(stationUp,cameraYaw).multiplyScalar(12)));
      }else{
        const back=playerHeading.clone().negate().applyAxisAngle(stationUp,cameraYaw);
        const desired=playerCameraTarget.clone().addScaledVector(back,8.6*Math.cos(cameraPitch)).addScaledVector(playerUp,8.6*Math.sin(cameraPitch));
        desired.copy(resolveCameraSafe(playerCameraTarget,desired,[playerAvatar]));
        camera.position.lerp(desired,1-Math.pow(.00008,delta));camera.lookAt(playerCameraTarget);
      }
      return;
    }

    if (turn && !playerInSpaceFlight) {
      playerHeading.applyAxisAngle(playerUp, turn * 1.9 * delta);
      playerHeading.addScaledVector(playerUp, -playerHeading.dot(playerUp)).normalize();
    }

    carryPlayerWithMovingSupport();
    const terrainReference = sampleSurface(playerAvatar.position);
    let currentSurface = sampleFootSupport(playerAvatar.position, playerUp, {maxRise:0.55,maxDrop:1.25});
    if (currentSurface && currentSurface.supportObject) rememberPlayerSupport(currentSurface);
    else clearPlayerSupportFrame();
    if (playerGrounded && !currentSurface) {
      playerGrounded = false;
      playerVerticalSpeed = 0;
      playerAirHeight = Math.max(0, playerAvatar.position.clone().sub(terrainReference.position).dot(playerUp));
    }
    const gravityField=queryGravityField(playerAvatar.position);
    const gravity=gravityField?gravityField.magnitude:BODY_PHYSICS[activeSurfaceBody].gravity;
    const moveDistance = walk * WORLD_SCALE.walkSpeed * delta;
    if (playerGrounded && keys.space) {
      clearPlayerSupportFrame();
      playerVerticalSpeed = PLAYER_JUMP_SPEED;playerAirHeight = Math.max(0, playerAvatar.position.clone().sub(terrainReference.position).dot(playerUp));playerGrounded = false;keys.space = false;setStatus("JUMP // GRAVITY " + gravity.toFixed(2) + " M/S²");
    }
    if (playerGrounded) {
      if (walk) {
        playerMove.copy(playerHeading).multiplyScalar(moveDistance);
        const previousPosition = playerAvatar.position.clone();
        const movement = resolveCharacterWalkStep(
          previousPosition, previousPosition.clone().add(playerMove), playerUp,
          {supportMode:"surface"}
        );
        if (!movement.grounded) {
          playerGrounded = false;
          playerVerticalSpeed = 0;
          playerAirHeight = Math.max(0, previousPosition.clone().sub(terrainReference.position).dot(playerUp));
          clearPlayerSupportFrame();
        } else {
          playerAvatar.position.copy(movement.position);
          playerUp.copy(movement.up);
          rememberPlayerSupport(movement.support);
        }
      } else if (currentSurface) {
        playerAvatar.position.copy(currentSurface.position);
        playerUp.copy(currentSurface.up);
      } else {
        playerGrounded = false;
        playerVerticalSpeed = 0;
        playerAirHeight = Math.max(0, playerAvatar.position.clone().sub(terrainReference.position).dot(playerUp));
      }
    }
    if (!playerGrounded) {
      if(walk){
        playerMove.copy(playerHeading).multiplyScalar(moveDistance);
        const from=playerAvatar.position.clone(),desired=from.clone().add(playerMove);
        playerAvatar.position.copy(resolveSolidMovement(from,desired,playerUp));
      }
      const projectedGround = sampleSurface(playerAvatar.position);
      const landingSupport = sampleFootSupport(playerAvatar.position, playerUp, {maxRise:0.15,maxDrop:12}) || projectedGround;
      const supportHeight = landingSupport.position.clone().sub(projectedGround.position).dot(playerUp);
      if(keys.space)playerVerticalSpeed=Math.min(11.5,playerVerticalSpeed+Math.max(0,24-gravity)*delta);
      else playerVerticalSpeed-=gravity*delta;
      playerAirHeight += playerVerticalSpeed * delta;
      if (playerAirHeight <= supportHeight + 0.025 && playerVerticalSpeed <= 0) {
        playerAirHeight = Math.max(0,supportHeight); playerVerticalSpeed = 0; playerGrounded = true;
        playerAvatar.position.copy(landingSupport.position);
        playerUp.copy(landingSupport.up);
        rememberPlayerSupport(landingSupport);
        setStatus("LANDED // " + (landingSupport.supportId || (activeSurfaceBody === "moon" ? "LUNA" : "HAVEN")));
      } else {
        // Resolve the vertical part of a jump or fall against the same solid
        // collider set used by horizontal walking and Kinetic Field movement.
        // This prevents the avatar from passing through ceilings or solid
        // undersides while airborne.
        const verticalFrom = playerAvatar.position.clone();
        const verticalTarget = projectedGround.position.clone()
          .addScaledVector(projectedGround.up, playerAirHeight);
        const verticalResolved = resolveSolidMovement(
          verticalFrom, verticalTarget, projectedGround.up
        );
        const verticalBlocked = verticalResolved.distanceToSquared(verticalTarget) > 1e-5;
        playerAvatar.position.copy(verticalResolved);
        if (verticalBlocked) {
          // Keep the ballistic height in sync with the collision-resolved
          // position and cancel velocity into the blocking surface.
          playerAirHeight = Math.max(0,
            playerAvatar.position.clone().sub(projectedGround.position).dot(projectedGround.up)
          );
          playerVerticalSpeed = 0;
        }
        playerUp.copy(projectedGround.up);
      }
    }
    playerHeading.addScaledVector(playerUp, -playerHeading.dot(playerUp)).normalize();

    orientAvatar();
    avatarIsWalking=!!walk;
    if(habitatGateButton&&habitatGate&&!faunaReleased){const d=playerAvatar.position.distanceTo(habitatGate.getWorldPosition(new THREE.Vector3()));habitatGateButton.style.display=d<=28?"block":"none";}
    if(ranchInteractButton&&bartenderNpcRef){const d=playerAvatar.position.distanceTo(bartenderNpcRef.getWorldPosition(new THREE.Vector3()));ranchInteractButton.style.display=d<=30?"block":"none";}
    if(moonRxButton&&moonRxRef){const d=playerAvatar.position.distanceTo(moonRxRef.getWorldPosition(new THREE.Vector3()));moonRxButton.style.display=d<=24?"block":"none";}
    if(sanchosButton&&sanchosArmoryRef){const d=playerAvatar.position.distanceTo(sanchosArmoryRef.getWorldPosition(new THREE.Vector3()));sanchosButton.style.display=d<=24?"block":"none";}
    if(whizzDanceButton&&whizzDanceRef){const d=playerAvatar.position.distanceTo(whizzDanceRef.getWorldPosition(new THREE.Vector3()));whizzDanceButton.style.display=d<=30?"block":"none";}
    updateSolarCommonsInteraction();
    updateRanchQuestProgress();
    if (buggyInteractButton && !buggyMode && havenBuggy) {
      const d=playerAvatar.position.distanceTo(havenBuggy.getWorldPosition(new THREE.Vector3()));
      buggyInteractButton.style.display=d<=13?"block":"none";
      buggyInteractButton.textContent="ENTER MOON BUGGY";
    }

    cameraYaw-=lookInputX*1.75*delta;
    cameraPitch=THREE.MathUtils.clamp(cameraPitch-lookInputY*1.15*delta,-0.12,0.88);
    playerCameraTarget.copy(playerAvatar.position).addScaledVector(playerUp,1.0);
    camera.up.copy(playerUp);
    if(cameraMode==="first"){
      const viewForward=playerHeading.clone().applyAxisAngle(playerUp,cameraYaw);
      viewForward.addScaledVector(playerUp,Math.tan(cameraPitch)*0.45).normalize();
      const head=playerAvatar.position.clone().addScaledVector(playerUp,1.84);
      camera.position.copy(head);
      camera.lookAt(head.clone().addScaledVector(viewForward,12));
    }else{
      const back=playerHeading.clone().negate().applyAxisAngle(playerUp,cameraYaw);
      const desired=playerCameraTarget.clone().addScaledVector(back,8.6*Math.cos(cameraPitch)).addScaledVector(playerUp,8.6*Math.sin(cameraPitch));
      desired.copy(resolveCameraSafe(playerCameraTarget,desired,[playerAvatar]));
      // Smooth both inward collision corrections and outward recovery. The
      // previous instant-in/slow-out rule made the camera visibly snap and
      // wobble as rays crossed nearby building and prop geometry.
      camera.position.lerp(desired,1-Math.pow(0.00008,delta));
      camera.lookAt(playerCameraTarget);
    }

    const footPhase = document.getElementById("kr-phase");
    const footLocation = document.getElementById("kr-location");
    const footSpeed = document.getElementById("kr-speed");
    const bodyLabel=activeSurfaceBody==="moon"?"LUNA":"HAVEN";
    if (footPhase) footPhase.textContent = "MODE: ON FOOT // "+bodyLabel;
    if (footLocation) footLocation.textContent = "LOCATION: "+(stationInteriorMode&&stationWalkRoot===solarHabitatStation?"SOLAR COMMONS DOCK":bodyLabel+" SURFACE");
    if (footSpeed) footSpeed.textContent = "MOVEMENT: " + (explorerEquipment.thrusting?"JETPACK THRUST":(walk ? "WALKING" : (playerGrounded?"STANDING":"AIRBORNE")));
  }

  function updateLanding(delta) {
    if (landingState !== "approach" || !landingTarget || !landingNormal || !landingDestination) return false;

    // Recompute the pad's world-space frame as Haven slowly rotates.
    landingMarker.getWorldPosition(landingTarget);
    landingMarker.getWorldQuaternion(landingQuaternion);
    landingNormal.set(0, 1, 0).applyQuaternion(landingQuaternion).normalize();
    landingDestination.copy(landingTarget).addScaledVector(landingNormal, 2.4);

    const distance = ship.position.distanceTo(landingDestination);
    const travelStep = Math.min(1, (24 * delta) / Math.max(distance, 0.001));
    ship.position.lerp(landingDestination, travelStep);

    // Keep the ship's local up axis aligned with the landing surface.
    ship.quaternion.slerp(landingQuaternion, 1 - Math.pow(0.0008, delta));

    velocity.x = velocity.y = velocity.z = 0;

    if (distance < 0.16 && ship.quaternion.angleTo(landingQuaternion) < 0.035) {
      ship.position.copy(landingDestination);
      ship.quaternion.copy(landingQuaternion);
      landingState = "landed";
      if (landingButton) {
        landingButton.textContent = "LANDED ON "+landingBodyName(activeLandingBody);
        landingButton.disabled = true;
        landingButton.style.opacity = "1";
      }
      if (disembarkButton) disembarkButton.style.display = "block";
      setStatus("TOUCHDOWN CONFIRMED // "+landingBodyName(activeLandingBody));
    }
    return true;
  }

  function updateFlightCamera(delta) {
    const worldForward = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(ship.getWorldQuaternion(new THREE.Quaternion())).normalize();
    if (cameraMode === "first") {
      const worldPosition = ship.localToWorld(new THREE.Vector3(0, 1.8, -2.55));
      const worldUp = new THREE.Vector3(0, 1, 0)
        .applyQuaternion(ship.getWorldQuaternion(new THREE.Quaternion())).normalize();
      const target = worldPosition.clone().addScaledVector(worldForward, 65);
      camera.up.copy(worldUp);
      camera.position.copy(worldPosition);
      camera.lookAt(target);
      if (cameraButton) cameraButton.textContent = "VIEW: CHASE";
    } else {
      // The chase heading is remembered, so the camera no longer snaps to a
      // fixed fallback when the nose points (nearly) straight up or down.
      if (!shipChaseHeading) shipChaseHeading = new THREE.Vector3(0, 0, -1);
      const rawHeading = worldForward.clone();
      rawHeading.y = 0;
      const rawLenSq = rawHeading.lengthSq();
      if (rawLenSq > 0.04) {
        rawHeading.normalize();
        if (rawLenSq > 0.5 || shipChaseHeading.dot(rawHeading) > -0.2) {
          shipChaseHeading.lerp(rawHeading, 1 - Math.pow(0.004, delta));
          if (shipChaseHeading.lengthSq() < 1e-6) shipChaseHeading.copy(rawHeading);
          shipChaseHeading.normalize();
        }
      }
      const chaseOffset = shipChaseHeading.clone().multiplyScalar(-34);
      chaseOffset.y = 12;
      desiredCamera.copy(ship.position).add(chaseOffset);
      desiredCamera.copy(resolveCameraSafe(ship.position, desiredCamera, [ship, playerAvatar], { minDist: 9, clearance: 1.5 }));
      camera.up.set(0, 1, 0);
      camera.position.lerp(desiredCamera, 1 - Math.pow(0.00008, delta));
      lookTarget.copy(ship.position).addScaledVector(worldForward, 7);
      camera.lookAt(lookTarget);
      if (cameraButton) cameraButton.textContent = "VIEW: COCKPIT";
    }
  }

  function updateFlight(delta) {
    if (cameraButton) cameraButton.style.display = "block";
    if (landingState === "landed") {
      velocity.x = velocity.y = velocity.z = 0;
      updateFlightCamera(delta);
      return;
    }
    if (landingState === "approach") {
      updateLanding(delta);
    } else {
      // Aim with the joystick; translate independently with the D-pad.
      const yawInput=THREE.MathUtils.clamp((keys.a?1:0)-(keys.d?1:0)+touchFlightYaw,-1,1);
      const pitchInput=THREE.MathUtils.clamp((keys.arrowup?1:0)-(keys.arrowdown?1:0)+touchFlightPitch,-1,1);
      const thrust=THREE.MathUtils.clamp((keys.w?1:0)-(keys.s?1:0)+touchFlightThrust,-1,1);
      const strafe=THREE.MathUtils.clamp((keys.arrowright?1:0)-(keys.arrowleft?1:0)+touchFlightStrafe,-1,1);
      ship.rotateY(yawInput*0.92*delta);
      ship.rotateX(pitchInput*0.72*delta);

      // IMPORTANT: Object3D.getWorldDirection() on a Group returns
      // its +Z axis. This ship's nose is local -Z, so using that method
      // sent "forward" toward the tail. Build the nose vector explicitly.
      const nose = new THREE.Vector3(0,0,-1).applyQuaternion(ship.quaternion).normalize();
      const right = new THREE.Vector3(1,0,0).applyQuaternion(ship.quaternion).normalize();

      // Direct arcade translation while controls are being learned:
      // no accumulated inertia, no sideways drift, and immediate stop
      // when the D-pad is released. Up = nose, Down = tail, Left/Right
      // = ship-relative strafe. Diagonal input is normalized.
      const move = new THREE.Vector3();
      move.addScaledVector(nose, thrust * CONFIG.acceleration);
      move.addScaledVector(right, strafe * CONFIG.acceleration * 0.72);
      if (move.lengthSq() > 0) move.normalize().multiplyScalar(
        CONFIG.acceleration * (thrust && strafe ? 0.82 : 1)
      );
      velocity.x = move.x;
      velocity.y = move.y;
      velocity.z = move.z;
      ship.position.addScaledVector(move, delta);
      resolveShipTerrain();
    }
    updateFlightCamera(delta);
  }

  // ============================================================
  // HAVEN APPROACH NAVIGATION
  // The marker is attached to Haven, so it follows the planet's
  // slow rotation. The guidance line is updated in world space.
  // ============================================================

  function createNavigationSystem() {
    const latitude = 0.12;
    const longitude = 0.08 - 100 / (CONFIG.planetRadius * Math.cos(latitude));
    const normal = new THREE.Vector3(
      Math.cos(latitude) * Math.cos(longitude),
      Math.sin(latitude),
      Math.cos(latitude) * Math.sin(longitude)
    ).normalize();

    const ground = terrainProfile(
      normal.x, normal.y, normal.z
    ).elevation;

    landingMarker = new THREE.Group();
    landingMarker.position.copy(normal).multiplyScalar(
      CONFIG.planetRadius + ground + 0.9
    );
    landingMarker.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      normal
    );

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(12, 0.42, 6, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffc77d,
        transparent: true,
        opacity: 0.95,
        depthWrite: false
      })
    );
    ring.rotation.x = Math.PI / 2;
    landingMarker.add(ring);

    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(7.2, 0.18, 5, 40),
      new THREE.MeshBasicMaterial({
        color: 0x8fd9e7,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
      })
    );
    innerRing.rotation.x = Math.PI / 2;
    landingMarker.add(innerRing);

    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 26, 6),
      new THREE.MeshBasicMaterial({
        color: 0xffc77d,
        transparent: true,
        opacity: 0.55,
        depthWrite: false
      })
    );
    beacon.position.y = 14;
    landingMarker.add(beacon);

    const beaconTip = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.5, 0),
      new THREE.MeshBasicMaterial({ color: 0xffe0a6 })
    );
    beaconTip.position.y = 28;
    landingMarker.add(beaconTip);

    planetWorld.add(landingMarker);
    havenLandingMarker = landingMarker;

    landingTarget = new THREE.Vector3();
    landingNormal = normal.clone();
    landingQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0), normal
    );
    landingDestination = new THREE.Vector3();

    approachLinePositions = new Float32Array(6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(approachLinePositions, 3)
    );
    approachLine = new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({
        color: 0x8fcbd7,
        transparent: true,
        opacity: 0.34,
        depthWrite: false
      })
    );
    approachLine.frustumCulled = false;
    scene.add(approachLine);

    navLabel = document.createElement("div");
    navLabel.textContent = "▼ HAVEN LANDING SITE";
    Object.assign(navLabel.style, {
      position: "absolute",
      zIndex: "18",
      display: "none",
      padding: "5px 8px",
      color: "#ffe0a6",
      background: "rgba(5,12,22,.72)",
      border: "1px solid rgba(255,199,125,.55)",
      borderRadius: "3px",
      font: "bold 10px monospace",
      letterSpacing: "1px",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      textShadow: "0 1px 4px #000",
      transform: "translate(-50%,-50%)"
    });
    root.appendChild(navLabel);
  }

  function updateNavigation() {
    if (onFoot) {
      if (approachLine) approachLine.visible = false;
      if (navLabel) navLabel.style.display = "none";
      return;
    }
    if (!landingMarker || !landingTarget || !ship || !camera) return;

    if(landingState==="idle"&&havenLandingMarker&&moonLandingMarker&&moonWorld){
      const beaconCandidates=[["haven",havenLandingMarker],["moon",moonLandingMarker],["solar",solarCommonsLandingMarker],["port",havenPortLandingMarker],["last",lastStopLandingMarker]];
      let bestBody="haven",bestMarker=havenLandingMarker,bestDistance=Infinity;
      const beaconPoint=new THREE.Vector3();
      for(const [body,marker] of beaconCandidates){if(!marker)continue;const d=ship.position.distanceTo(marker.getWorldPosition(beaconPoint));if(d<bestDistance){bestDistance=d;bestBody=body;bestMarker=marker;}}
      landingMarker=bestMarker;activeLandingBody=bestBody;
    }
    landingMarker.getWorldPosition(landingTarget);

    approachLinePositions[0] = ship.position.x;
    approachLinePositions[1] = ship.position.y;
    approachLinePositions[2] = ship.position.z;
    approachLinePositions[3] = landingTarget.x;
    approachLinePositions[4] = landingTarget.y;
    approachLinePositions[5] = landingTarget.z;

    const positionAttribute = approachLine.geometry.attributes.position;
    positionAttribute.needsUpdate = true;
    approachLine.geometry.computeBoundingSphere();

    const projected = landingTarget.clone().project(camera);
    const inFront = projected.z > -1 && projected.z < 1;
    if (inFront && cameraMode === "first") {
      const margin = 34;
      const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
      navLabel.style.display = "block";
      navLabel.style.left = Math.max(margin, Math.min(window.innerWidth - margin, x)) + "px";
      navLabel.style.top = Math.max(margin, Math.min(window.innerHeight - margin, y - 24)) + "px";
      navLabel.textContent = activeLandingBody==="port"?"▼ L'ASTROLABE OFFSHORE SPACEPORT":activeLandingBody==="moon"?"▼ LUNA LANDING SITE":activeLandingBody==="solar"?"▼ SOLAR COMMONS DOCK":activeLandingBody==="last"?"▼ THE LAST STOP SPACE DOCK":"▼ HAVEN LANDING SITE";
    } else {
      navLabel.style.display = "none";
    }

    const targetDistance = ship.position.distanceTo(landingTarget);
    if (landingButton) {
      const ready = targetDistance <= 220 && landingState === "idle";
      landingButton.disabled = !(ready || landingState === "approach");
      landingButton.style.opacity = landingButton.disabled ? "0.48" : "1";
      if (landingState === "approach") {
        landingButton.textContent = "ABORT LANDING";
      } else if (landingState === "landed") {
        landingButton.textContent = "LANDED ON "+landingBodyName(activeLandingBody);
      } else {
        landingButton.textContent = ready ? (activeLandingBody==="port"?"LAND AT L'ASTROLABE":activeLandingBody==="moon"?"LAND ON LUNA":activeLandingBody==="solar"?"DOCK AT SOLAR COMMONS":activeLandingBody==="last"?"DOCK AT THE LAST STOP":"LAND ON HAVEN") : "LANDING ASSIST";
      }
    }
    const targetText = document.getElementById("kr-target");
    const phaseText = document.getElementById("kr-phase");
    const altitude=activeLandingBody==="last"?ship.position.distanceTo(landingTarget):activeLandingBody==="solar"&&solarHabitatStation?ship.position.distanceTo(solarHabitatStation.getWorldPosition(new THREE.Vector3())):activeLandingBody==="port"&&havenPortLandingMarker?ship.position.distanceTo(landingTarget):activeLandingBody==="moon"&&moonWorld?ship.position.distanceTo(moonWorld.getWorldPosition(new THREE.Vector3()))-CONFIG.moonRadius:ship.position.distanceTo(planetCenter)-CONFIG.planetRadius;

    if (targetText) {
      targetText.textContent = "LANDING SITE: " + targetDistance.toFixed(0) + " UNITS";
    }

    let phase = "DEEP SPACE";
    if (altitude < 250) phase = activeLandingBody==="moon"?"LUNA ORBIT":activeLandingBody==="solar"?"SOLAR COMMONS APPROACH":activeLandingBody==="last"?"LAST STOP APPROACH":"HAVEN ORBIT";
    if (targetDistance < 180) phase = "APPROACH CORRIDOR";
    if (targetDistance < 55) phase = "LANDING RANGE";
    if (landingState === "approach") phase = (activeLandingBody==="solar"||activeLandingBody==="last")?"AUTOMATED DOCKING":"AUTOMATED DESCENT";
    if (landingState === "landed") phase = "LANDED // "+(activeLandingBody==="solar"?"SOLAR COMMONS DOCK":activeLandingBody==="last"?"LAST STOP DOCK":"PAD SECURE");
    if (onFoot) phase = "ON FOOT // "+(activeSurfaceBody==="moon"?"LUNA":"HAVEN");

    if (phaseText) {
      phaseText.textContent = "FLIGHT PHASE: " + phase;
    }

    if (approachLine.material) {
      approachLine.material.opacity = targetDistance < 220 ? 0.72 : 0.22;
    }
  }

  // ============================================================
  // HUD UPDATES
  // ============================================================

  function updateNavigationReadout() {
    if (!THREE || !planetWorld || !ship || !navReadout) return;

    const shipWorld = ship.getWorldPosition(new THREE.Vector3());
    const shipLocal = planetWorld.worldToLocal(shipWorld.clone());
    const shipRadius = shipLocal.length();
    const shipLat = Math.asin(THREE.MathUtils.clamp(shipLocal.y / Math.max(1, shipRadius), -1, 1)) * 180 / Math.PI;
    const shipLon = Math.atan2(shipLocal.z, shipLocal.x) * 180 / Math.PI;

    let observerWorld = shipWorld.clone();
    let headingWorld = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.getWorldQuaternion(new THREE.Quaternion())).normalize();
    let observerLabel = "SHIP";
    if (onFoot && playerAvatar) {
      observerWorld = buggyMode && havenBuggy
        ? havenBuggy.getWorldPosition(new THREE.Vector3())
        : playerAvatar.getWorldPosition(new THREE.Vector3());
      if (buggyMode && havenBuggy) {
        headingWorld.set(0, 0, -1).applyQuaternion(havenBuggy.getWorldQuaternion(new THREE.Quaternion())).normalize();
        observerLabel = "ROVER";
      } else {
        headingWorld.copy(playerHeading || headingWorld);
        observerLabel = "YOU";
      }
    }

    const coordinateRoot=onFoot&&activeSurfaceBody==="moon"&&moonWorld?moonWorld:planetWorld;
    const local = coordinateRoot.worldToLocal(observerWorld.clone());
    const radius = local.length();
    const lat = Math.asin(THREE.MathUtils.clamp(local.y / Math.max(1, radius), -1, 1)) * 180 / Math.PI;
    const lon = Math.atan2(local.z, local.x) * 180 / Math.PI;
    const nearHaven = Math.abs(radius - (activeSurfaceBody==="moon"?CONFIG.moonRadius:CONFIG.planetRadius)) < 900;
    const polarLatitude = Math.abs(lat) >= 89.95;
    const coords = nearHaven
      ? "LAT " + (polarLatitude ? (lat >= 0 ? "90.0000° N" : "90.0000° S") : Math.abs(lat).toFixed(4) + "° " + (lat >= 0 ? "N" : "S")) + "  LON " + (polarLatitude ? "POLAR" : Math.abs(lon).toFixed(4) + "° " + (lon >= 0 ? "E" : "W"))
      : "SPACE X " + observerWorld.x.toFixed(0) + " Y " + observerWorld.y.toFixed(0) + " Z " + observerWorld.z.toFixed(0);

    const inversePlanetRotation = coordinateRoot.getWorldQuaternion(new THREE.Quaternion()).invert();
    const localHeading = headingWorld.clone().applyQuaternion(inversePlanetRotation).normalize();
    const normal = local.clone().normalize();
    // Define north from Haven's fixed +Y axis projected onto the
    // observer's local horizon. This avoids longitude-wrap sign changes.
    const north = new THREE.Vector3(0, 1, 0)
      .addScaledVector(normal, -normal.y);
    if (north.lengthSq() < 1e-8) {
      // Geographic north is undefined at either pole; use Haven +Z as
      // a deterministic fallback so the compass does not jump randomly.
      north.set(0, 0, 1).addScaledVector(normal, -normal.z);
    }
    north.normalize();
    const east = normal.clone().cross(north).normalize();
    localHeading.addScaledVector(normal, -localHeading.dot(normal)).normalize();
    const bearing = (Math.atan2(localHeading.dot(east), localHeading.dot(north)) * 180 / Math.PI + 360) % 360;
    const headings = ["N","NE","E","SE","S","SW","W","NW"];
    const compass = headings[Math.round(bearing / 45) % 8];

    const coordsNode = document.getElementById("kr-nav-coords");
    const headingNode = document.getElementById("kr-nav-heading");
    const xyzNode = document.getElementById("kr-nav-xyz");
    const shipNode = document.getElementById("kr-nav-ship");
    if (coordsNode) coordsNode.textContent = (onFoot && activeSurfaceBody === "moon" ? "LUNA-" : "HAVEN-") + CONFIG.seed + "  " + observerLabel + "  " + coords;
    if (headingNode) headingNode.textContent = "HDG " + compass + " " + bearing.toFixed(0) + "°";
    if (xyzNode) {
      xyzNode.textContent = "WORLD XYZ  " +
        observerWorld.x.toFixed(1) + ", " +
        observerWorld.y.toFixed(1) + ", " +
        observerWorld.z.toFixed(1);
    }
    if (shipNode) {
      if (onFoot) {
        const distanceToShip = observerWorld.distanceTo(shipWorld);
        const shipDirectionLocal = shipWorld.clone()
          .sub(observerWorld)
          .applyQuaternion(inversePlanetRotation);
        shipDirectionLocal.addScaledVector(
          normal, -shipDirectionLocal.dot(normal)
        );
        const shipBearing = shipDirectionLocal.lengthSq() > 1e-8
          ? (Math.atan2(shipDirectionLocal.dot(east), shipDirectionLocal.dot(north)) * 180 / Math.PI + 360) % 360
          : 0;
        shipNode.textContent = "SHIP RANGE " + distanceToShip.toFixed(1) +
          "u  //  BRG " + shipBearing.toFixed(0) + "°  //  XYZ " +
          shipWorld.x.toFixed(1) + ", " + shipWorld.y.toFixed(1) + ", " +
          shipWorld.z.toFixed(1);
      } else {
        shipNode.textContent = "HAVEN " + ship.position.distanceTo(planetCenter).toFixed(0) + "u";
      }
    }
    if (compassRose && compassRose.style) {
      compassRose.style.transform = "rotate(" + (-bearing) + "deg)";
      for (const mark of compassRose.children) mark.style.transform = "rotate(" + bearing + "deg)";
    }
  }

  function updateHUD() {
    updateNavigationReadout();
    const distance = ship.position.distanceTo(planetCenter);

    const altitude =
      distance - CONFIG.planetRadius;

    const location =
      document.getElementById("kr-location");

    const speed =
      document.getElementById("kr-speed");

    const distanceText =
      document.getElementById("kr-distance");

    const moonText =
      document.getElementById("kr-moon");

    const status =
      document.getElementById("kr-status");

    if (!location) return;

    if (onFoot) {
      if (playerInSpaceFlight) {
        const jetSpeed = playerFlightVelocity ? playerFlightVelocity.length() : 0;
        location.textContent = "LOCATION: PERSONAL FLIGHT";
        speed.textContent = "JETPACK VELOCITY: " + jetSpeed.toFixed(1) + " M/S";
        distanceText.textContent = "HAVEN RANGE: " + playerAvatar.position.distanceTo(planetCenter).toFixed(0) + " UNITS";
        status.textContent = "JETPACK FLIGHT // " + (explorerEquipment.thrusting ? "BOOSTING" : "GRAVITY DESCENT");
        return;
      }
      location.textContent = "LOCATION: " + (activeSurfaceBody === "moon" ? "LUNA SURFACE" : "HAVEN SURFACE");
      speed.textContent = "MOVEMENT: " + ((keys.w || keys.s) ? "WALKING" : "STANDING");
      distanceText.textContent = "EXPLORATION: ON FOOT";
      if (moonText && moonOrbit) {
        moonText.textContent = "LUNA: " + moonOrbit.rotation.y.toFixed(2) + " ORBIT";
      }
      status.textContent = "SURFACE EXPLORATION // HAVEN";
      return;
    }

    const currentSpeed = Math.sqrt(
      velocity.x * velocity.x +
      velocity.y * velocity.y +
      velocity.z * velocity.z
    );

    speed.textContent =
      "VELOCITY: " + currentSpeed.toFixed(1);

    distanceText.textContent =
      "HAVEN: " + altitude.toFixed(0) + " UNITS";

    if (moonText && moonOrbit) {
      moonText.textContent =
        "LUNA: " + moonOrbit.rotation.y.toFixed(2) + " ORBIT";
    }

    if (altitude < 35) {
      location.textContent =
        activeLandingBody==="moon"?"LOCATION: LUNA APPROACH":activeLandingBody==="last"?"LOCATION: LAST STOP APPROACH":"LOCATION: HAVEN APPROACH";

      status.textContent =
        "DESTINATION IN RANGE";

    } else if (altitude < 250) {
      location.textContent =
        activeLandingBody==="moon"?"LOCATION: LUNA ORBIT":activeLandingBody==="last"?"LOCATION: LAST STOP ORBIT":"LOCATION: HAVEN ORBIT";

      status.textContent =
        "APPROACHING VIDEO WORLD";

    } else {
      location.textContent =
        "LOCATION: DEEP SPACE";

      status.textContent =
        "SYSTEM ONLINE";
    }
  }

  // ============================================================
  // MAIN INITIALIZATION
  // ============================================================

  async function initialize() {
    try {
      THREE = await loadThree();

      if (destroyed) return;
      cameraRaycaster = new THREE.Raycaster();
      walkSurfaceRaycaster = new THREE.Raycaster();
      walkSurfaceNormalMatrix = new THREE.Matrix3();

      // Allocate Three.js objects after THREE is available.
      forward = new THREE.Vector3();
      playerFlightVelocity = new THREE.Vector3();
      cameraOffset = new THREE.Vector3();
      desiredCamera = new THREE.Vector3();
      lookTarget = new THREE.Vector3();
      planetCenter = new THREE.Vector3(...CONFIG.planetPosition);

      setStatus("CHECKING WEBGL SUPPORT");
      const probe = document.createElement("canvas");
      const webgl2 = probe.getContext("webgl2", { antialias: false, alpha: false });
      if (!webgl2) throw new Error("WEBGL 2 IS UNAVAILABLE OR DISABLED IN THIS BROWSER.");
      setStatus("INITIALIZING WEBGL RENDERER");

      // Scene

      scene = new THREE.Scene();

      scene.background = new THREE.Color(
        CONFIG.background
      );

      scene.fog = new THREE.FogExp2(
        CONFIG.background,
        0.000022
      );

      // Camera

      camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
      );

      // Renderer

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
      });

      renderer.setPixelRatio(
        Math.min(
          window.devicePixelRatio || 1,
          1.5
        )
      );

      renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );

      renderer.outputColorSpace =
        THREE.SRGBColorSpace;

      renderer.toneMapping =
        THREE.ACESFilmicToneMapping;

      renderer.toneMappingExposure = 1.32;

      renderer.domElement.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;display:block;z-index:1";

      root.insertBefore(renderer.domElement,hud);
      renderer.domElement.style.touchAction="none";
      // Re-append selector overlays after the canvas so they win hit-testing
      // in mobile browsers even when the renderer is initialized asynchronously.
      for(const control of [explorerSelectorButton,explorerSelectorPanel]){
        if(control&&control.parentNode===root)root.appendChild(control);
        if(control)control.style.zIndex="140";
      }
      explorerSelectorButton.style.pointerEvents="auto";
      explorerSelectorPanel.style.pointerEvents="auto";
      // Place all interactive overlays after the canvas in DOM paint order.
      for(const control of [mobile,lookPad]) if(control&&control.parentNode===root)root.appendChild(control);
      topActionBar.style.zIndex="80";
      mobile.style.zIndex="60";lookPad.style.zIndex="60";cameraButton.style.zIndex="80";
      hud.style.zIndex="70";statusPanel.style.zIndex="70";
      let lookPointerId=null,lastLookX=0,lastLookY=0,flightLookPointer=false;
      const lookDown=e=>{
        if(!onFoot||buggyMode||e.button>0)return;
        // In jetpack flight, drag the open right half of the screen to orbit
        // the chase camera. The left joystick remains dedicated to steering.
        if(playerInSpaceFlight&&e.clientX<window.innerWidth*0.48)return;
        lookPointerId=e.pointerId;
        flightLookPointer=!!playerInSpaceFlight;
        lastLookX=e.clientX;lastLookY=e.clientY;
        if(renderer.domElement.setPointerCapture)renderer.domElement.setPointerCapture(e.pointerId);
      };
      const lookMove=e=>{
        if(e.pointerId!==lookPointerId)return;
        const dx=e.clientX-lastLookX,dy=e.clientY-lastLookY;
        lastLookX=e.clientX;lastLookY=e.clientY;
        if(flightLookPointer){
          flightCameraYaw-=dx*0.006;
          if(flightCameraYaw>Math.PI*2)flightCameraYaw-=Math.PI*2;if(flightCameraYaw<-Math.PI*2)flightCameraYaw+=Math.PI*2;
          flightCameraPitch=THREE.MathUtils.clamp(flightCameraPitch-dy*0.0045,-1.35,1.35);
        }else{
          cameraYaw-=dx*0.006;
          cameraPitch=THREE.MathUtils.clamp(cameraPitch-dy*0.0045,-0.12,0.88);
        }
      };
      const lookEnd=e=>{if(e.pointerId===lookPointerId){lookPointerId=null;flightLookPointer=false;}};
      renderer.domElement.addEventListener("pointerdown",lookDown);
      renderer.domElement.addEventListener("pointermove",lookMove);
      renderer.domElement.addEventListener("pointerup",lookEnd);
      renderer.domElement.addEventListener("pointercancel",lookEnd);
      cleanup.push(()=>{renderer.domElement.removeEventListener("pointerdown",lookDown);renderer.domElement.removeEventListener("pointermove",lookMove);renderer.domElement.removeEventListener("pointerup",lookEnd);renderer.domElement.removeEventListener("pointercancel",lookEnd);});

      // Lighting

      scene.add(
        new THREE.AmbientLight(
          0xc2b8d8,
          0.62
        )
      );

      // Generate universe

      createStarfield();
      createSun();
      planetWorld = createPlanet();
      createHavenMaritimeInfrastructure(planetWorld);
      createNavigationSystem();
      createMoon();
      const stationGroup=createStation();
      const lastStopDiner=createLastStopDiner(stationGroup);
      lastStopDinerRef=lastStopDiner;
      createSolarHabitatStation();
      lastStopDiner.userData.dockScene=createLastStopDockScene(stationGroup,lastStopDiner);
      createAsteroidBelt();
      createHavenOrbitalSystem();
      registerSphericalBoundary({id:"solar-commons-geodome-shell",root:solarHabitatStation,center:new THREE.Vector3(104,5.9,104),radius:29.15,portal:p=>Math.abs(p.x-104)<3.75&&p.z>69&&p.z<81&&p.y<11.2});

      // Generate player ship

      ship = createShip();
      ship.userData.krSolidRoot=true;
      createOnFootAvatar();
      // Begin at Beef's bar inside The Last Stop. The RV is visible outside on
      // the orbital parking apron, through the new east-side exit.
      playerAvatar.position.copy(lastStopDiner.localToWorld(new THREE.Vector3(-5.2,5.9,-5.4)));
      stationWalkRoot=lastStopDiner;
      playerAvatar.visible=true;playerSeatedInShip=false;
      playerUp.set(0,1,0);playerHeading.set(0,0,-1);playerFlightForward.copy(playerHeading);
      playerGrounded=true;playerVerticalSpeed=0;playerAirHeight=0;onFoot=true;stationInteriorMode=true;landingState="idle";
      orientAvatar();
      ship.position.copy(stationGroup.localToWorld(new THREE.Vector3(82,7.3,0)));
      ship.rotation.y=Math.PI/2;
      lastStopLandingMarker=createStationLandingMarker(stationGroup,new THREE.Vector3(82,5.95,0),'KR_LAST_STOP_LANDING_MARKER');
      createModelWorkshop();
      registerCorePhysics();
      rebuildSolidColliderCache();
      cameraMode="third";
      camera.position.copy(playerAvatar.position).add(new THREE.Vector3(0,7,12));
      camera.lookAt(playerAvatar.position.clone().add(new THREE.Vector3(0,1.4,-2)));
      setStatus("THE LAST STOP // BEEF'S BAR // ORBITAL TRUCK STOP");

      // Resize handling

      function resize() {
        if (!renderer || !camera) return;

        camera.aspect =
          window.innerWidth /
          window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
          window.innerWidth,
          window.innerHeight
        );
      }

      window.addEventListener(
        "resize",
        resize
      );

      cleanup.push(() => {
        window.removeEventListener(
          "resize",
          resize
        );
      });

      setStatus(
        "UNIVERSE GENERATED // FLIGHT SYSTEM ONLINE"
      );
      try { autoClaimCharacter(); } catch (error) { console.warn("[Kepler Reach] Character auto-claim failed:", error); }

      const statusElement =
        document.getElementById("kr-status");

      if (statusElement) {
        statusElement.textContent =
          "SYSTEM ONLINE";
      }

      // ========================================================
      // RENDER LOOP
      // ========================================================

      function animate(time) {
        if (destroyed) return;
        animationFrame = requestAnimationFrame(animate);
        try {
          const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
          lastTime = time;
          if (onFoot && !buggyMode) {
            navReadout.style.width = "auto";
            navReadout.style.maxWidth = "min(360px, calc(100% - 16px))";
            navReadout.style.padding = "5px 8px";
            if (navReadout.children[2]) navReadout.children[2].style.display = "none";
            if (navReadout.children[3]) navReadout.children[3].style.display = "none";
          } else {
            navReadout.style.width = "auto";
            navReadout.style.maxWidth = "min(520px, calc(100% - 16px))";
            navReadout.style.padding = "6px 9px";
            if (navReadout.children[2]) navReadout.children[2].style.display = "";
            if (navReadout.children[3]) navReadout.children[3].style.display = "";
          }
          solidFrame++;
          resetSolidCollisionStats();
          resetSupportSampleStats();
          advanceAstronomy(delta);
          applyAgentControls(time);
          if (buggyMode) updateBuggy(delta);
          else if (onFoot) updateOnFoot(delta);
          else if (shipParked) {
            // PARK is a true position/attitude hold, not a velocity damper.
            if (parkedShipPosition) ship.position.copy(parkedShipPosition);
            if (parkedShipQuaternion) ship.quaternion.copy(parkedShipQuaternion);
            velocity.x = velocity.y = velocity.z = 0;
            updateFlightCamera(delta);
          } else updateFlight(delta);
          updateAmbientFauna(time);
          updateSaloonPerformers(time);
          updateLastStopPerformers(time);
          updateSolarCommonsLife(time);
          updateAvatarAnimation(time);
          updateEquipment(delta,time);
          restoreAgentControls();
          runControllables(delta);
          updateNavigation();
          updateHUD();
          renderer.render(scene, camera);
        } catch (error) {
          // v0.4.06: one transient fault no longer ends the session; a burst of faults does.
          const faultNow = performance.now();
          while (frameFaults.length && faultNow - frameFaults[0] > 3000) frameFaults.shift();
          frameFaults.push(faultNow);
          const faultMessage = error && error.message ? error.message : String(error);
          console.error("[Kepler Reach] Frame fault:", error);
          if (frameFaults.length >= 5) {
            cancelAnimationFrame(animationFrame);
            setStatus("RENDER LOOP ERROR: " + faultMessage, true);
            console.error("[Kepler Reach] Render loop stopped after repeated faults.");
          } else {
            setStatus("FRAME FAULT // RECOVERING: " + faultMessage);
          }
        }
      }

      animationFrame =
        requestAnimationFrame(animate);

    } catch (error) {
      console.error(
        "[Kepler Reach] Initialization failed:",
        error
      );

      setStatus(
        "ENGINE ERROR: " + error.message,
        true
      );

      const statusElement =
        document.getElementById("kr-status");

      if (statusElement) {
        statusElement.textContent =
          "RENDERER INITIALIZATION FAILED";
      }
    }
  }

  // ============================================================
  // SHARED CAMERA COLLISION + SHIP TERRAIN COLLISION // v0.3.82
  //
  // One collision pass for every camera (surface, jetpack, station,
  // buggy, ship). Terrain is tested analytically by marching the camera
  // ray against the heightfield; everything else uses a cached list of
  // solid meshes that is pre-filtered by distance, so we no longer
  // raycast the whole scene (planet sphere included) every frame.
  // ============================================================

  const cameraBlockerCache = { list: [], stamp: -1e9, scratch: [] };

  function refreshCameraBlockers(force) {
    const now = performance.now();
    if (!force && now - cameraBlockerCache.stamp < 1500) return cameraBlockerCache.list;
    cameraBlockerCache.stamp = now;
    const list = [];
    if (scene) {
      scene.updateMatrixWorld(true);
      scene.traverse(o => {
        if (!o.isMesh || !o.geometry) return;
        if (o.userData && o.userData.krTerrainMesh) return;
        const m = o.material;
        if (m && !Array.isArray(m) && m.transparent && m.depthWrite === false) return;
        let n = o, skip = false;
        while (n) {
          if (n.userData && n.userData.noCameraCollision) { skip = true; break; }
          n = n.parent;
        }
        if (skip) return;
        let radius = Infinity;
        if (!o.isInstancedMesh) {
          if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
          const bs = o.geometry.boundingSphere;
          if (bs) radius = (bs.center.length() + bs.radius) * o.matrixWorld.getMaxScaleOnAxis();
        }
        o.userData.krCamRadius = radius;
        list.push(o);
      });
    }
    cameraBlockerCache.list = list;
    return list;
  }

  function cameraHitIgnored(object, ignore) {
    let n = object;
    while (n) {
      if (ignore && ignore.includes(n)) return true;
      if (n.userData && n.userData.noCameraCollision) return true;
      if (n.visible === false) return true;
      if (n === scene) return false;
      n = n.parent;
    }
    return true; // detached from the scene: stale cache entry
  }

  function cameraTerrainLimit(target, dir, len, clearance) {
    let limit = len;
    const bodies = [
      { root: planetWorld, radius: CONFIG.planetRadius, profile: terrainProfile, g: BODY_PHYSICS.haven.gravity },
      { root: moonWorld, radius: CONFIG.moonRadius, profile: moonTerrainProfile, g: BODY_PHYSICS.moon.gravity }
    ];
    const probe = new THREE.Vector3(), centre = new THREE.Vector3();
    const steps = 10;
    for (const b of bodies) {
      if (!b.root) continue;
      b.root.getWorldPosition(centre);
      if (centre.distanceTo(target) - b.radius > len + 60) continue;
      for (let s = 1; s <= steps; s++) {
        const t = len * s / steps;
        probe.copy(target).addScaledVector(dir, t);
        const st = getCelestialBodyState(b.root, b.radius, b.profile, probe, b.g);
        if (st.altitude < clearance) {
          limit = Math.min(limit, Math.max(0, len * (s - 1) / steps));
          break;
        }
      }
    }
    return limit;
  }

  // Returns a camera position that is no farther from `target` than
  // `desired`, pulled in front of terrain and solid meshes.
  function resolveCameraSafe(target, desired, ignore, opts) {
    opts = opts || {};
    const minDist = opts.minDist !== undefined ? opts.minDist : 0.72;
    const clearance = opts.clearance !== undefined ? opts.clearance : WORLD_SCALE.cameraClearance;
    const dir = desired.clone().sub(target), len = dir.length();
    if (!(len > 1e-4) || !isFinite(len)) return desired.clone();
    dir.multiplyScalar(1 / len);
    let safe = Math.min(len, cameraTerrainLimit(target, dir, len, 0.6));
    if (cameraRaycaster) {
      const blockers = refreshCameraBlockers(false), filtered = cameraBlockerCache.scratch, reach = len + 1;
      filtered.length = 0;
      for (let i = 0; i < blockers.length; i++) {
        const o = blockers[i], r = o.userData.krCamRadius;
        if (r !== Infinity) {
          const e = o.matrixWorld.elements, dx = e[12] - target.x, dy = e[13] - target.y, dz = e[14] - target.z, lim = reach + r;
          if (dx * dx + dy * dy + dz * dz > lim * lim) continue;
        }
        filtered.push(o);
      }
      cameraRaycaster.near = 0.12;
      cameraRaycaster.far = len + 0.5;
      cameraRaycaster.set(target, dir);
      const hits = cameraRaycaster.intersectObjects(filtered, false);
      for (const hit of hits) {
        if (hit.distance > 0.25 && !cameraHitIgnored(hit.object, ignore)) {
          safe = Math.min(safe, hit.distance - clearance);
          break;
        }
      }
    }
    safe = Math.max(Math.min(minDist, len), Math.min(len, safe));
    return target.clone().addScaledVector(dir, safe);
  }

  // The spacecraft can no longer fly through Haven or Luna. Hull clearance is
  // 2.0 m, below the touchdown altitude, so landing and launching never pop.
  const SHIP_MIN_ALTITUDE = 2.0;
  let shipTerrainContact = false;
  function resolveShipTerrain() {
    shipTerrainContact = false;
    if (!ship || !THREE) return;
    const bodies = [
      { root: planetWorld, radius: CONFIG.planetRadius, profile: terrainProfile, floor: -0.3 },
      { root: moonWorld, radius: CONFIG.moonRadius, profile: moonTerrainProfile, floor: -1e9 }
    ];
    for (const b of bodies) {
      if (!b.root) continue;
      const local = b.root.worldToLocal(ship.position.clone()), dist = local.length();
      if (dist < 1e-3 || dist > b.radius + 40) continue;
      const radial = local.clone().multiplyScalar(1 / dist);
      const elevation = Math.max(b.profile(radial.x, radial.y, radial.z).elevation, b.floor);
      const minRadius = b.radius + elevation + SHIP_MIN_ALTITUDE;
      if (dist < minRadius) {
        local.copy(radial).multiplyScalar(minRadius);
        ship.position.copy(b.root.localToWorld(local));
        shipTerrainContact = true;
      }
    }
  }

  // ============================================================
  // CONTROL LAYER // v0.3.82
  //
  // ONE vocabulary of control for every kind of player:
  //   - humans      : keyboard / touch (existing handlers, unchanged)
  //   - scripts     : KeplerReach.input.set({...}) every frame or with a TTL
  //   - LLM agents  : KeplerReach.agent.command({...}) -> JSON state back
  //
  // Intent fields (all optional, -1..1 unless noted):
  //   forward  walk / throttle / ship thrust
  //   turn     +1 = right
  //   strafe   ship sideways, +1 = right
  //   pitch    +1 = nose up (jetpack and ship)
  //   boost    boolean: jetpack launch/thrust (kinetic field)
  //   lookX/lookY  camera orbit, same sign as the LOOK pad arrows
  //
  // Everything an intent cannot express (boarding, buying, talking...) is a
  // named ACTION. New vehicles/gadgets plug in with registerControllable().
  // ============================================================

  const API_SCHEMA_VERSION = "kepler-reach/1.4";
  const INTENT_FIELDS = Object.freeze({
    forward: { type: "number", range: [-1, 1], description: "Walk / drive / ship thrust. +1 forward, -1 back." },
    turn: { type: "number", range: [-1, 1], description: "Steer or turn. +1 right, -1 left." },
    strafe: { type: "number", range: [-1, 1], description: "Ship sideways translation. +1 right." },
    pitch: { type: "number", range: [-1, 1], description: "Nose up (+1) or down (-1) in jetpack flight and the ship." },
    boost: { type: "boolean", description: "Hold true to fire the jetpack (kinetic field) and fly along your nose." },
    lookX: { type: "number", range: [-1, 1], description: "Orbit the camera sideways (like the LOOK pad right arrow)." },
    lookY: { type: "number", range: [-1, 1], description: "Orbit the camera vertically (like the LOOK pad up arrow)." }
  });
  const INTENT_ALIASES = Object.freeze({ move: "forward", thrust: "forward", throttle: "forward", steer: "turn", yaw: "turn", jump: "boost" });
  const MODE_HELP = Object.freeze({
    walk: "On foot. forward walks, turn rotates, boost launches the jetpack, look orbits the camera.",
    jetpack: "Kinetic-field flight. boost thrusts along your nose at full speed; turn (+1 = right) yaws, pitch tilts the nose; forward/strafe give slow precision translation (and hover). Release everything to descend.",
    ship: "Spacecraft. forward thrusts along the nose, strafe slides sideways, turn yaws, pitch tilts.",
    buggy: "Luna utility rover. forward is throttle, turn steers.",
    boat: "Passenger launch at the helm. forward is throttle, turn steers.",
    jetski: "Personal watercraft. forward is throttle, turn steers."
  });
  const AGENT_KEYS = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "space"];
  const agentControl = {
    active: false, by: null, expires: 0, saved: null,
    intent: { forward: 0, turn: 0, strafe: 0, pitch: 0, lookX: 0, lookY: 0, boost: false }
  };
  let controlFrameIntent = { forward: 0, turn: 0, strafe: 0, pitch: 0, lookX: 0, lookY: 0, boost: false };

  function clampUnit(v) { return Math.max(-1, Math.min(1, v)); }
  function roundTo(n, d) { const m = Math.pow(10, d === undefined ? 2 : d); return Math.round(n * m) / m; }
  function vecJson(v) { return v ? { x: roundTo(v.x), y: roundTo(v.y), z: roundTo(v.z) } : null; }

  function sanitizeIntent(raw) {
    const out = {};
    if (!raw || typeof raw !== "object") return out;
    const num = v => { const n = Number(v); return Number.isFinite(n) ? clampUnit(n) : 0; };
    for (const key of Object.keys(raw)) {
      const name = INTENT_ALIASES[key] || key;
      if (name === "boost") out.boost = !!raw[key];
      else if (name in agentControl.intent && name !== "boost") out[name] = num(raw[key]);
    }
    return out;
  }

  function getControlMode() {
    if (buggyMode) return "buggy";
    if (onFoot) {
      if (maritimeDriving) return maritimeDrivingType === "jetski" ? "jetski" : "boat";
      return playerInSpaceFlight ? "jetpack" : "walk";
    }
    return "ship";
  }

  function setAgentIntent(raw, opts) {
    opts = opts || {};
    const patch = sanitizeIntent(raw);
    const intent = agentControl.intent;
    if (!opts.merge) { intent.forward = intent.turn = intent.strafe = intent.pitch = intent.lookX = intent.lookY = 0; intent.boost = false; }
    Object.assign(intent, patch);
    let ttl = opts.ttlMs === undefined ? 800 : Number(opts.ttlMs);
    if (!Number.isFinite(ttl) || ttl < 0) ttl = 800;
    ttl = Math.min(ttl, 120000);
    // ttl 0 = hold until clear() is called. The default (800 ms) is a
    // watchdog: if an agent goes quiet, its character stops instead of running away.
    agentControl.expires = ttl === 0 ? Infinity : performance.now() + ttl;
    agentControl.active = true;
    lastAgentInputAt = performance.now();
    agentControl.by = String(opts.by || agentControl.by || "agent").slice(0, 60);
    return { ...intent };
  }

  function clearAgentIntent() {
    const intent = agentControl.intent;
    intent.forward = intent.turn = intent.strafe = intent.pitch = intent.lookX = intent.lookY = 0;
    intent.boost = false;
    agentControl.active = false;
    agentControl.expires = 0;
    return true;
  }

  function humanIntent() {
    const b = v => (v ? 1 : 0);
    return {
      forward: clampUnit(b(keys.w) - b(keys.s) + touchFlightThrust),
      turn: clampUnit(b(keys.d) - b(keys.a) - touchFlightYaw),
      strafe: clampUnit(b(keys.arrowright) - b(keys.arrowleft) + touchFlightStrafe),
      pitch: clampUnit(b(keys.arrowup) - b(keys.arrowdown) + touchFlightPitch),
      lookX: clampUnit(lookInputX), lookY: clampUnit(lookInputY),
      boost: !!keys.space
    };
  }

  // Called at the start of every frame. Merges agent intent into the same
  // inputs the keyboard and touch pads write, so ONE movement implementation
  // serves everybody. Restored after the frame by restoreAgentControls().
  // Controller ownership (roadmap 9.5): when the local character is claimed by an agent or script,
  // the human's movement input is locked out while that controller is alive. If the agent goes
  // silent for HUMAN_LOCK_GRACE_MS the human is handed control back automatically.
  const HUMAN_LOCK_GRACE_MS = 20000;
  let lastAgentInputAt = 0;
  function localControllerType() {
    const claim = characterClaims.get(localCharacterId);
    return claim ? claim.controller : "human";
  }
  function humanInputLocked() {
    if (localControllerType() === "human") return false;
    return performance.now() - lastAgentInputAt < HUMAN_LOCK_GRACE_MS;
  }

  function applyAgentControls() {
    agentControl.saved = null;
    if (agentControl.active && performance.now() > agentControl.expires) clearAgentIntent();
    const locked = humanInputLocked();
    const idle = { forward: 0, turn: 0, strafe: 0, pitch: 0, lookX: 0, lookY: 0, boost: false };
    const human = locked ? idle : humanIntent(), a = agentControl.intent;
    const merged = {
      forward: clampUnit(human.forward + (agentControl.active ? a.forward : 0)),
      turn: clampUnit(human.turn + (agentControl.active ? a.turn : 0)),
      strafe: clampUnit(human.strafe + (agentControl.active ? a.strafe : 0)),
      pitch: clampUnit(human.pitch + (agentControl.active ? a.pitch : 0)),
      lookX: clampUnit(human.lookX + (agentControl.active ? a.lookX : 0)),
      lookY: clampUnit(human.lookY + (agentControl.active ? a.lookY : 0)),
      boost: human.boost || (agentControl.active && a.boost)
    };
    controlFrameIntent = merged;
    const custom = activeControllable(), capture = custom && custom.captureInput;
    if (!agentControl.active && !capture && !locked) return;
    const saved = { keys: {}, yaw: touchFlightYaw, pitch: touchFlightPitch, thrust: touchFlightThrust, strafe: touchFlightStrafe, lookX: lookInputX, lookY: lookInputY };
    for (const k of AGENT_KEYS) saved.keys[k] = keys[k];
    agentControl.saved = saved;
    if (capture || locked) {
      // A registered vehicle (or an agent/script owner) holds the controls: the human's inputs are neutral this frame.
      for (const k of AGENT_KEYS) keys[k] = false;
      touchFlightYaw = touchFlightPitch = touchFlightThrust = touchFlightStrafe = 0;
      lookInputX = lookInputY = 0;
    }
    if (capture) return;
    if (!agentControl.active) return;
    const mode = getControlMode(), dz = 0.25;
    if (mode === "ship") {
      touchFlightYaw = clampUnit(touchFlightYaw - a.turn);
      touchFlightPitch = clampUnit(touchFlightPitch + a.pitch);
      touchFlightThrust = clampUnit(touchFlightThrust + a.forward);
      touchFlightStrafe = clampUnit(touchFlightStrafe + a.strafe);
    } else if (mode === "jetpack") {
      // v0.4.06: Kinetic Field's yaw input is mirrored relative to walking and the ship
      // (its A key turns right), so +turn (right) maps to +yaw here. forward/strafe drive the
      // precision translation controls added in v0.4.02.
      touchFlightYaw = clampUnit(touchFlightYaw + a.turn);
      touchFlightPitch = clampUnit(touchFlightPitch + a.pitch);
      touchFlightThrust = clampUnit(touchFlightThrust + a.forward);
      touchFlightStrafe = clampUnit(touchFlightStrafe + a.strafe);
      if (a.boost) keys.space = true;
    } else {
      if (a.forward > dz) keys.w = true; else if (a.forward < -dz) keys.s = true;
      if (a.turn < -dz) keys.a = true; else if (a.turn > dz) keys.d = true;
      if (mode === "walk" || mode === "buggy") {
        lookInputX = clampUnit(lookInputX + a.lookX);
        lookInputY = clampUnit(lookInputY + a.lookY);
      }
      if (mode === "walk" && a.boost) keys.space = true;
    }
  }

  function restoreAgentControls() {
    const s = agentControl.saved;
    if (!s) return;
    for (const k of AGENT_KEYS) keys[k] = s.keys[k];
    touchFlightYaw = s.yaw; touchFlightPitch = s.pitch; touchFlightThrust = s.thrust; touchFlightStrafe = s.strafe;
    lookInputX = s.lookX; lookInputY = s.lookY;
    agentControl.saved = null;
  }

  // ------------------------------------------------------------
  // PLUGGABLE VEHICLES / GADGETS
  // ------------------------------------------------------------
  const controllables = new Map();
  const controllableWarned = new Set();
  function activeControllable() {
    for (const spec of controllables.values()) {
      try { if (spec.isActive()) return spec; } catch (_) { /* ignore */ }
    }
    return null;
  }
  function registerControllable(spec) {
    if (!spec || typeof spec !== "object") throw new Error("registerControllable needs a spec object.");
    if (!validModelId(spec.id)) throw new Error("Controllable id must be 1-80 safe identifier characters.");
    if (typeof spec.isActive !== "function") throw new Error("Controllable needs isActive().");
    const record = {
      id: spec.id, label: String(spec.label || spec.id), mode: String(spec.mode || spec.id),
      help: String(spec.help || ""), captureInput: spec.captureInput !== false,
      isActive: spec.isActive, applyIntent: typeof spec.applyIntent === "function" ? spec.applyIntent : null,
      getState: typeof spec.getState === "function" ? spec.getState : null,
      getObject: typeof spec.getObject === "function" ? spec.getObject : null,
      actionNames: []
    };
    controllables.set(record.id, record);
    if (spec.actions && typeof spec.actions === "object") {
      for (const name of Object.keys(spec.actions)) {
        const action = spec.actions[name];
        const full = record.id + "." + name;
        defineAction(full, { ...action, source: record.id });
        record.actionNames.push(full);
      }
    }
    return {
      id: record.id,
      unregister() {
        for (const n of record.actionNames) actionRegistry.delete(n);
        controllables.delete(record.id);
      }
    };
  }
  function runControllables(delta) {
    for (const spec of controllables.values()) {
      let active = false;
      try { active = !!spec.isActive(); } catch (_) { active = false; }
      if (!active || !spec.applyIntent) continue;
      try { spec.applyIntent({ ...controlFrameIntent }, delta); }
      catch (error) {
        if (!controllableWarned.has(spec.id)) { controllableWarned.add(spec.id); console.error("[Kepler Reach] Controllable failed:", spec.id, error); }
      }
    }
  }

  // ------------------------------------------------------------
  // ACTIONS
  // ------------------------------------------------------------
  const actionRegistry = new Map();
  function defineAction(name, spec) {
    if (typeof name !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,79}$/.test(name)) throw new Error("Invalid action name.");
    if (!spec || typeof spec.run !== "function") throw new Error("Action needs run().");
    actionRegistry.set(name, {
      name, description: String(spec.description || ""), params: spec.params || {},
      available: typeof spec.available === "function" ? spec.available : () => true,
      run: spec.run, source: spec.source || "core"
    });
    return name;
  }
  function actionAvailability(a) {
    let why = true;
    try { why = a.available(); } catch (error) { why = "availability check failed"; }
    return (why === true || why === null || why === undefined) ? true : String(why || "unavailable");
  }
  function listActions(includeUnavailable) {
    const out = [];
    for (const a of actionRegistry.values()) {
      const why = actionAvailability(a);
      if (why === true) out.push({ name: a.name, description: a.description, params: a.params, available: true, source: a.source });
      else if (includeUnavailable) out.push({ name: a.name, description: a.description, params: a.params, available: false, reason: why, source: a.source });
    }
    return out;
  }
  function runAction(name, params) {
    const a = actionRegistry.get(String(name));
    if (!a) return { ok: false, error: "UNKNOWN_ACTION", name: String(name) };
    const why = actionAvailability(a);
    if (why !== true) return { ok: false, error: "UNAVAILABLE", reason: why };
    try {
      const result = a.run(params && typeof params === "object" ? params : {});
      return { ok: true, result: result === undefined ? null : result };
    } catch (error) {
      return { ok: false, error: "ACTION_FAILED", message: String(error && error.message ? error.message : error) };
    }
  }

  function buyAnywhere(name) {
    const lists = [ranchShop, moonRxShop, sanchosShop];
    for (const list of lists) {
      const item = list.find(x => x.name.toLowerCase() === String(name).toLowerCase());
      if (!item) continue;
      if (ranchGame.credits < item.price) return { bought: false, reason: "NOT_ENOUGH_CREDITS", price: item.price, credits: ranchGame.credits };
      ranchGame.credits -= item.price;
      addRanchItem(item.name);
      setStatus("PURCHASE COMPLETE // " + item.name + " ADDED TO INVENTORY");
      return { bought: true, item: item.name, credits: ranchGame.credits };
    }
    return { bought: false, reason: "UNKNOWN_ITEM" };
  }
  function nearWorld(obj, range) {
    if (!obj || !playerAvatar) return false;
    return playerAvatar.position.distanceTo(obj.getWorldPosition(new THREE.Vector3())) <= range;
  }
  const needFoot = () => (onFoot && !buggyMode && !playerInSpaceFlight) ? true : "you must be on foot";

  defineAction("board_ship", {
    description: "Board the Space RV and launch (must be within 36 m of your ship or its landing pad).",
    available: () => {
      if (!onFoot || buggyMode || !ship || !landingMarker) return "you must be on foot";
      const d = Math.min(playerAvatar.position.distanceTo(landingMarker.getWorldPosition(new THREE.Vector3())), playerAvatar.position.distanceTo(ship.position));
      return d <= 36 ? true : "walk closer to your ship or its landing pad";
    },
    run: () => { boardShip(); return true; }
  });
  defineAction("disembark", {
    description: "Leave the landed Space RV and step outside.",
    available: () => (!onFoot && landingState === "landed") ? true : "the ship must be landed",
    run: () => { disembark(); return true; }
  });
  defineAction("landing_assist", {
    description: "Toggle automatic landing on the nearest landing beacon (must be within ~220 m).",
    available: () => (!onFoot && !buggyMode && ship && landingButton && !landingButton.disabled) ? true : "fly the ship near a landing beacon",
    run: () => { landingButton.click(); return { landingState }; }
  });
  defineAction("vehicle_toggle", {
    description: "Enter or exit the Luna utility rover (within 13 m).",
    available: () => (buggyMode || (onFoot && havenBuggy && !playerInSpaceFlight && nearWorld(havenBuggy, 13))) ? true : "no rover within reach",
    run: () => { toggleBuggy(); return { driving: buggyMode }; }
  });
  defineAction("maritime_action", {
    description: "Board, drive, or leave the passenger launch / personal watercraft when prompted.",
    available: () => (maritimeInteractButton && maritimeInteractButton.dataset.active === "1") ? true : "no boat or watercraft prompt here",
    run: () => { handleMaritimeAction(); return { driving: maritimeDriving }; }
  });
  defineAction("go_home", { description: "Return to the home position at Haven.", run: () => { returnHome(); return true; } });
  defineAction("toggle_view", {
    description: "Switch between first-person/cockpit and third-person/chase camera.",
    available: () => (onFoot || ship) ? true : "not ready",
    run: () => { toggleCameraMode(); return { view: cameraMode }; }
  });
  defineAction("set_view", {
    description: "Set the camera view.", params: { mode: "first | third" },
    available: () => (onFoot || ship) ? true : "not ready",
    run: p => { const want = p.mode === "first" ? "first" : "third"; if (cameraMode !== want) toggleCameraMode(); return { view: cameraMode }; }
  });
  defineAction("recenter_camera", { description: "Reset the camera behind your character or ship.", run: () => { recenterCamera(); return true; } });
  defineAction("brake", {
    description: "Stop all ship movement immediately.",
    available: () => (!onFoot && !buggyMode && ship) ? true : "you must be flying the ship",
    run: () => { brakeShip(); return true; }
  });
  defineAction("park", {
    description: "Hold the ship at its position and heading, or release the hold.", params: { value: "boolean, default true" },
    available: () => (!onFoot && !buggyMode && ship) ? true : "you must be flying the ship",
    run: p => { setShipParked(p.value === undefined ? true : !!p.value); return { parked: shipParked }; }
  });
  defineAction("fire_ray_gun", {
    description: "Fire the ray gun / mining laser: Luna rocks, practice targets, or asteroid belt.",
    available: () => (!buggyMode && (onFoot || ship)) ? true : "you must be on foot or in the ship",
    run: () => { if(onFoot) fireRayGun(); else fireMiningLaser(); return { shots: explorerEquipment.shots, hits: explorerEquipment.hits, ore: explorerEquipment.oreMined }; }
  });
  defineAction("mine_belt", {
    description: "Fire the ship mining laser at asteroid-belt rocks in view.",
    available: () => (!onFoot && !buggyMode && ship) ? true : "board the ship and fly the belt",
    run: () => { fireMiningLaser(); return { shots: explorerEquipment.shots, ore: explorerEquipment.oreMined }; }
  });
  defineAction("sell_ore", {
    description: "Sell mined voxel ore for credits (3 CR each).",
    available: () => (onFoot && explorerEquipment.oreMined > 0) ? true : "mine ore first",
    run: () => sellMinedOre()
  });
  defineAction("open_wildlife_gates", {
    description: "Open the wildlife habitat gates when standing at the gate.",
    available: () => (habitatGateButton && habitatGateButton.style.display === "block") ? true : "not at the habitat gate",
    run: () => { openWildlifeHabitat(); return true; }
  });
  defineAction("buy", {
    description: "Buy an item from the nearby shop (Lemmy's Ranch, Moon Man's Rx, Sancho's Armory).", params: { item: "item name, e.g. Trail Rations" },
    available: needFoot,
    run: p => buyAnywhere(p.item)
  });
  defineAction("accept_quest", { description: "Ask Lemmy for work: accept the observatory delivery quest.", available: needFoot, run: () => { acceptRanchQuest(); return { quests: ranchGame.quests.map(q => ({ ...q })) }; } });
  defineAction("talk_nearest", {
    description: "Talk to the nearest Solar Commons resident; repeated calls advance the conversation.",
    available: () => solarCommonsNearbyNPC ? true : "nobody to talk to nearby",
    run: () => {
      showSolarDialogue();
      const speaker = solarCommonsNearbyNPC.name, line = solarDialogueText.textContent;
      solarCommonsDialogueIndex++;
      return { speaker, line };
    }
  });

  // ------------------------------------------------------------
  // CHARACTERS: who is being played, by whom, and how
  // ------------------------------------------------------------
  const characterRoster = new Map();
  const characterClaims = new Map();
  const characterHeld = new Set();
  const CHARACTER_USERNAME_BINDINGS = {}; // e.g. { "moon man": "moonman", "benis": "benis" }
  let localCharacterId = "explorer";
  let nameTagSprite = null;
  function characterAIHeld(id) { return characterHeld.has(id); }

  function registerCharacter(spec) {
    if (!spec || !/^[a-z0-9][a-z0-9_-]{0,39}$/.test(String(spec.id || ""))) throw new Error("Character id must be lowercase letters, digits, - or _.");
    const record = {
      id: spec.id, name: String(spec.name || spec.id).slice(0, 40), role: String(spec.role || "").slice(0, 80),
      description: String(spec.description || "").slice(0, 240),
      usernames: Array.isArray(spec.usernames) ? spec.usernames.map(u => String(u).slice(0, 60)) : [],
      getBody: typeof spec.getBody === "function" ? spec.getBody : null,
      spawn: typeof spec.spawn === "function" ? spec.spawn : null
    };
    characterRoster.set(record.id, record);
    return record.id;
  }

  function resetToOnFootState() {
    if (buggyMode) { try { exitBuggy(); } catch (_) { buggyMode = false; } }
    maritimeDriving = false; maritimeOnBoat = false;
    if (playerAvatar.parent !== scene) scene.attach(playerAvatar);
    playerSeatedInShip = false;
    playerGrounded = true; playerVerticalSpeed = 0; playerAirHeight = 0;
    explorerEquipment.thrusting = false; playerInSpaceFlight = false;
    if (playerFlightVelocity) playerFlightVelocity.set(0, 0, 0);
    clearKeys();
  }
  function finishOnFootEntry() {
    recenterCamera(); orientAvatar();
    onFoot = true; avatarIsWalking = false; playerAvatar.visible = cameraMode === "third";
    if (ship) ship.visible = true;
    if (disembarkButton) disembarkButton.style.display = "none";
    if (boardShipButton) boardShipButton.style.display = "block";
    if (landingButton) landingButton.style.display = "none";
    if (navLabel) navLabel.style.display = "none";
    if (approachLine) approachLine.visible = false;
    createPracticeTargets();
  }
  function placePlayerInStationFrame(root, localPosition, faceWorld) {
    resetToOnFootState();
    stationInteriorMode = true; stationWalkRoot = root; activeSurfaceBody = "haven";
    root.updateWorldMatrix(true, false);
    playerAvatar.position.copy(root.localToWorld(localPosition.clone()));
    const q = root.getWorldQuaternion(new THREE.Quaternion());
    playerUp.set(0, 1, 0).applyQuaternion(q).normalize();
    let heading = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
    if (faceWorld) heading = faceWorld.clone().sub(playerAvatar.position);
    heading.addScaledVector(playerUp, -heading.dot(playerUp));
    if (heading.lengthSq() < 1e-8) heading.set(0, 0, -1).applyQuaternion(q);
    playerHeading.copy(heading.normalize()); playerFlightForward.copy(playerHeading);
    finishOnFootEntry();
  }
  function placePlayerOnSurface(worldPosition, body, faceWorld) {
    resetToOnFootState();
    stationInteriorMode = false; stationWalkRoot = null; activeSurfaceBody = body === "moon" ? "moon" : "haven";
    const surface = sampleSurface(worldPosition);
    playerAvatar.position.copy(surface.position); playerUp.copy(surface.up);
    let heading = faceWorld ? faceWorld.clone().sub(surface.position) : playerHeading.clone();
    heading.addScaledVector(playerUp, -heading.dot(playerUp));
    if (heading.lengthSq() < 1e-8) heading.set(1, 0, 0).addScaledVector(playerUp, -playerUp.x);
    playerHeading.copy(heading.normalize()); playerFlightForward.copy(playerHeading);
    finishOnFootEntry();
  }

  function setPlayerNameTag(text) {
    if (!THREE || !playerAvatar) return;
    if (nameTagSprite) {
      playerAvatar.remove(nameTagSprite);
      if (nameTagSprite.material.map) nameTagSprite.material.map.dispose();
      nameTagSprite.material.dispose();
      nameTagSprite = null;
    }
    if (!text) return;
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 128;
    const g = canvas.getContext("2d");
    g.fillStyle = "rgba(8,18,26,.72)"; g.fillRect(0, 24, 512, 80);
    g.strokeStyle = "#9bd3c6"; g.lineWidth = 4; g.strokeRect(2, 26, 508, 76);
    g.fillStyle = "#f4ead0"; g.font = "bold 44px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(String(text).slice(0, 22), 256, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
    sprite.name = "KR_PLAYER_NAMETAG"; sprite.scale.set(3.2, 0.8, 1); sprite.position.set(0, 2.7, 0);
    sprite.userData.noCameraCollision = true;
    playerAvatar.add(sprite);
    nameTagSprite = sprite;
  }

  function characterSummary(id) {
    id = id || localCharacterId;
    const c = characterRoster.get(id), claim = characterClaims.get(id);
    const clientName = (typeof window !== "undefined" && window.CLIENT && window.CLIENT.name) ? String(window.CLIENT.name) : null;
    return {
      id, name: c ? (id === "explorer" ? (clientName || c.name) : c.name) : id, role: c ? c.role : "",
      controller: claim ? claim.controller : "human", claimedBy: claim ? claim.by : (id === "explorer" ? clientName : null),
      since: claim ? claim.since : null, aiSuspended: characterHeld.has(id)
    };
  }

  function releaseCharacter(id, silent) {
    id = String(id || localCharacterId);
    const claim = characterClaims.get(id), c = characterRoster.get(id);
    if (!claim) return { ok: false, error: "NOT_CLAIMED" };
    characterClaims.delete(id);
    characterHeld.delete(id);
    const body = c && c.getBody ? c.getBody() : null;
    if (body) body.visible = true;
    if (localCharacterId === id) { localCharacterId = "explorer"; setPlayerNameTag(null); }
    if (!silent) setStatus("CHARACTER RELEASED // " + (c ? c.name.toUpperCase() : id));
    return { ok: true };
  }

  function claimCharacter(id, opts) {
    opts = opts || {};
    id = String(id);
    const c = characterRoster.get(id);
    if (!c) return { ok: false, error: "UNKNOWN_CHARACTER", id };
    if (!THREE || !playerAvatar || !playerUp) return { ok: false, error: "NOT_READY" };
    const controller = ["human", "agent", "script"].includes(opts.controller) ? opts.controller : "human";
    const clientName = (window.CLIENT && window.CLIENT.name) ? String(window.CLIENT.name) : "local";
    const by = String(opts.by || clientName).slice(0, 60);
    const existing = characterClaims.get(id);
    if (existing && existing.by !== by && !opts.force) return { ok: false, error: "ALREADY_CLAIMED", claimedBy: existing.by };
    if (localCharacterId !== id && localCharacterId !== "explorer") releaseCharacter(localCharacterId, true);
    characterClaims.set(id, { by, controller, since: Date.now() });
    lastAgentInputAt = performance.now();
    localCharacterId = id;
    if (id !== "explorer") {
      characterHeld.add(id);
      const body = c.getBody ? c.getBody() : null;
      if (body) body.visible = false;
      try { if (c.spawn) c.spawn(); } catch (error) { console.warn("[Kepler Reach] Character spawn failed:", id, error); }
      setPlayerNameTag(c.name.toUpperCase() + (c.role ? " // " + c.role.toUpperCase() : ""));
      setStatus("NOW PLAYING " + c.name.toUpperCase() + " // " + controller.toUpperCase() + " (" + by + ")");
    }
    return { ok: true, character: characterSummary(id) };
  }

  // Controller handoff (roadmap 9.5): identity and state stay; only who drives changes.
  function handoffCharacter(controller, opts) {
    opts = opts || {};
    if (!["human", "agent", "script"].includes(controller)) return { ok: false, error: "UNKNOWN_CONTROLLER" };
    const id = localCharacterId, existing = characterClaims.get(id);
    const clientName = (window.CLIENT && window.CLIENT.name) ? String(window.CLIENT.name) : "local";
    const by = String(opts.by || (existing && existing.by) || clientName).slice(0, 60);
    characterClaims.set(id, { by, controller, since: Date.now() });
    lastAgentInputAt = performance.now();
    if (controller === "human") clearAgentIntent();
    setStatus("CONTROL // " + characterSummary(id).name.toUpperCase() + " -> " + controller.toUpperCase() + " (" + by + ")");
    return { ok: true, character: characterSummary(id), control: controlOwnerInfo() };
  }
  function controlOwnerInfo() {
    const locked = humanInputLocked();
    return { controller: localControllerType(), humanLocked: locked, graceMsLeft: locked ? Math.max(0, Math.round(HUMAN_LOCK_GRACE_MS - (performance.now() - lastAgentInputAt))) : 0 };
  }

  function bindUsername(username, id) {
    if (!characterRoster.has(String(id))) return false;
    CHARACTER_USERNAME_BINDINGS[String(username).trim().toLowerCase()] = String(id);
    return true;
  }
  function autoClaimCharacter(username) {
    const raw = username || (window.CLIENT && window.CLIENT.name) || "";
    const name = String(raw).trim().toLowerCase();
    if (!name) return null;
    let id = CHARACTER_USERNAME_BINDINGS[name];
    if (!id) for (const c of characterRoster.values()) if (c.usernames.some(u => u.toLowerCase() === name)) { id = c.id; break; }
    return id ? claimCharacter(id, { by: String(raw), controller: "human" }) : null;
  }

  const benisBody = () => (lastStopDinerRef && lastStopDinerRef.userData.dockScene && lastStopDinerRef.userData.dockScene.userData.benis) || null;
  registerCharacter({ id: "explorer", name: "Explorer", role: "Explorer", description: "The default traveller. Anyone can play this one." });
  registerCharacter({
    id: "benis", name: "Benis", role: "Sheriff",
    description: "Frog-like humanoid sheriff of The Last Stop. Patrols the jail until someone plays him.",
    getBody: benisBody,
    spawn() {
      const body = benisBody();
      if (!body || !lastStopDinerRef) return;
      const local = lastStopDinerRef.worldToLocal(body.getWorldPosition(new THREE.Vector3()));
      placePlayerInStationFrame(lastStopDinerRef, new THREE.Vector3(local.x, 5.9, local.z));
    }
  });
  registerCharacter({
    id: "moonman", name: "Moon Man", role: "Proprietor, Moon Man's Rx",
    description: "Runs the apothecary and exploration-gear shop on Haven.",
    getBody: () => null,
    spawn() { if (moonRxRef) placePlayerOnSurface(moonRxRef.localToWorld(new THREE.Vector3(0, 0, 9)), "haven", moonRxRef.getWorldPosition(new THREE.Vector3())); }
  });
  registerCharacter({
    id: "sancho", name: "Sancho", role: "Proprietor, Sancho's Armory",
    description: "Sells frontier sidearms and practical hardware on Haven.",
    getBody: () => null,
    spawn() { if (sanchosArmoryRef) placePlayerOnSurface(sanchosArmoryRef.localToWorld(new THREE.Vector3(0, 0, 9)), "haven", sanchosArmoryRef.getWorldPosition(new THREE.Vector3())); }
  });

  // ------------------------------------------------------------
  // STATE SNAPSHOT (JSON-safe, for scripts and LLM agents)
  // ------------------------------------------------------------
  function getControlFrame() {
    const mode = getControlMode();
    let obj = null;
    if (mode === "ship") obj = ship;
    else if (mode === "buggy") obj = havenBuggy;
    else if (mode === "boat") obj = maritimeBoat;
    else if (mode === "jetski") obj = maritimeJetski;
    const custom = activeControllable();
    if (custom && custom.getObject) { try { obj = custom.getObject() || obj; } catch (_) { /* ignore */ } }
    if (obj) {
      const q = obj.getWorldQuaternion(new THREE.Quaternion());
      return { pos: obj.getWorldPosition(new THREE.Vector3()), up: new THREE.Vector3(0, 1, 0).applyQuaternion(q).normalize(), forward: new THREE.Vector3(0, 0, -1).applyQuaternion(q).normalize() };
    }
    if (!playerAvatar || !playerUp || !playerHeading) return null;
    const fwd = (playerInSpaceFlight && playerFlightForward ? playerFlightForward : playerHeading).clone();
    return { pos: playerAvatar.position.clone(), up: playerUp.clone(), forward: fwd.normalize() };
  }

  function nearbyEntities(frame, maxRange, limit) {
    const out = [];
    const right = frame.forward.clone().cross(frame.up);
    if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
    right.normalize();
    const add = (id, kind, name, obj, extra) => {
      if (!obj) return;
      try {
        const p = obj.getWorldPosition(new THREE.Vector3()), v = p.clone().sub(frame.pos), d = v.length();
        if (d > maxRange || d < 0.01) return;
        const flat = v.clone().addScaledVector(frame.up, -v.dot(frame.up));
        out.push({ id, kind, name, distanceM: roundTo(d, 1), bearingDeg: roundTo(Math.atan2(flat.dot(right), flat.dot(frame.forward)) * 180 / Math.PI, 0), ...(extra || {}) });
      } catch (_) { /* ignore */ }
    };
    add("space-rv", "vehicle", "Space RV", ship, { hint: "board_ship within 36 m" });
    add("luna-rover", "vehicle", "Luna Utility Rover", havenBuggy, { hint: "vehicle_toggle within 13 m" });
    add("passenger-launch", "vehicle", "Passenger Launch", maritimeBoat);
    add("personal-watercraft", "vehicle", "Personal Watercraft", maritimeJetski);
    add("landing-pad", "landing-pad", "Landing beacon", landingMarker, { hint: "landing_assist within 220 m" });
    add("lemmy", "npc", "Lemmy", bartenderNpcRef, { hint: "Lemmy's Ranch: buy, accept_quest" });
    add("moonman-rx", "shop", "Moon Man's Rx", moonRxRef, { hint: "buy within 24 m" });
    add("sanchos-armory", "shop", "Sancho's Armory", sanchosArmoryRef, { hint: "buy within 24 m" });
    add("whizz-dance-house", "venue", "Whizz's Dance House", whizzDanceRef);
    add("wildlife-gates", "poi", "Wildlife habitat gates", habitatGate, { hint: "open_wildlife_gates within 28 m" });
    const dock = lastStopDinerRef && lastStopDinerRef.userData.dockScene && lastStopDinerRef.userData.dockScene.userData;
    if (dock) {
      if (localCharacterId !== "benis") add("benis", "npc", "Benis (Sheriff)", dock.benis);
      add("mia", "npc", "Mia", dock.mia);
    }
    const npcs = solarHabitatStation && solarHabitatStation.userData.biosphere && solarHabitatStation.userData.biosphere.npcs;
    if (npcs) for (const npc of npcs) add("solar-" + String(npc.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"), "npc", npc.name, npc.group, { hint: "talk_nearest within 8.5 m" });
    for (const spec of controllables.values()) {
      if (!spec.getObject) continue;
      try { add(spec.id, "vehicle", spec.label, spec.getObject()); } catch (_) { /* ignore */ }
    }
    out.sort((a, b) => a.distanceM - b.distanceM);
    return out.slice(0, limit || 14);
  }

  // ---- v0.4.06 observation additions -------------------------------------------------------
  function bearingFor(frame, point) {
    const right = frame.forward.clone().cross(frame.up);
    if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
    right.normalize();
    const v = new THREE.Vector3(point.x, point.y, point.z).sub(frame.pos);
    const flat = v.clone().addScaledVector(frame.up, -v.dot(frame.up));
    return { distanceM: roundTo(v.length(), 1), bearingDeg: roundTo(Math.atan2(flat.dot(right), flat.dot(frame.forward)) * 180 / Math.PI, 0) };
  }
  function destinationsList(frame) {
    const out = [];
    const add = (id, name, kind, obj, extra) => {
      if (!obj) return;
      try {
        const p = obj.getWorldPosition(new THREE.Vector3());
        out.push({ id, name, kind, positionM: vecJson(p), ...bearingFor(frame, p), ...(extra || {}) });
      } catch (_) { /* ignore */ }
    };
    add("haven-landing-site", "Haven landing site", "planet-pad", havenLandingMarker, { beacon: true, ship: "landing_assist within 220 m", onFoot: "Kinetic Field descent onto the pad" });
    add("luna-landing-site", "Luna landing site", "moon-pad", moonLandingMarker, { beacon: true, ship: "landing_assist within 220 m", onFoot: "Kinetic Field descent; low gravity makes a slow drift down, so point the nose down and boost" });
    add("l-astrolabe", "L'Astrolabe offshore spaceport", "offshore-spaceport", havenPortLandingMarker, { beacon: true, ship: "landing_assist within 220 m", onFoot: "Kinetic Field descent onto the deck" });
    add("quai-de-haven", "Quai de Haven shore dock", "shore-dock", havenShoreDockRoot, { beacon: false, ship: "no landing beacon", onFoot: "walk, boat, or Kinetic Field descent onto the quay" });
    add("solar-commons-dock", "Solar Commons orbital dock", "station-dock", solarCommonsLandingMarker, { beacon: true, ship: "landing_assist within 220 m", onFoot: "Kinetic Field descent onto the apron" });
    add("last-stop-dock", "The Last Stop space dock", "station-dock", lastStopLandingMarker, { beacon: true, ship: "landing_assist within 220 m", onFoot: "Kinetic Field descent onto the apron (x >= 38 in the station frame to launch)" });
    out.sort((a, b) => a.distanceM - b.distanceM);
    return out;
  }
  function describeStructure(pos) {
    const roots = [["l-astrolabe", havenPortRoot], ["quai-de-haven", havenShoreDockRoot], ["solar-commons", solarHabitatStation], ["last-stop", lastStopDinerRef]];
    for (const [id, root] of roots) {
      if (!root) continue;
      const b = (root.userData && root.userData.walkBounds) || (id === "last-stop" ? { minX: -41, maxX: 154, minZ: -47, maxZ: 47, floorY: 5.9 } : null);
      if (!b) continue;
      const local = root.worldToLocal(pos.clone());
      if (local.x >= b.minX && local.x <= b.maxX && local.z >= b.minZ && local.z <= b.maxZ && Math.abs(local.y - b.floorY) < 4) return id;
    }
    return null;
  }
  function kineticFieldInfo() {
    const mode = getControlMode();
    if (mode === "jetpack") return { active: true, canLaunch: false, reason: "already flying" };
    if (mode !== "walk") return { active: false, canLaunch: false, reason: "Kinetic Field is available on foot only" };
    if (stationInteriorMode && stationWalkRoot) {
      const bounds = stationWalkRoot.userData && stationWalkRoot.userData.walkBounds;
      const explicit = !!(bounds && Number.isFinite(bounds.launchX) && bounds.launchX > -900);
      const launchX = explicit ? bounds.launchX : (stationWalkRoot === lastStopDinerRef ? 38 : null);
      if (launchX !== null) {
        const local = stationWalkRoot.worldToLocal(playerAvatar.position.clone());
        if (local.x < launchX) return { active: false, canLaunch: false, reason: "walk out to the space dock to launch", gate: { launchX, currentX: roundTo(local.x, 1) } };
      }
    }
    return { active: false, canLaunch: true };
  }

  function describeLocation() {
    let station = null;
    if (onFoot && stationInteriorMode && stationWalkRoot) {
      if (stationWalkRoot === lastStopDinerRef) station = "last-stop";
      else if (stationWalkRoot === solarHabitatStation) station = "solar-commons";
      else if (stationWalkRoot === havenPortRoot) station = "l-astrolabe";
      else if (stationWalkRoot === havenShoreDockRoot) station = "quai-de-haven";
      else if (stationWalkRoot === maritimeBoat) station = "passenger-launch";
    }
    const pos = (getControlFrame() || {}).pos;
    let nearest = null, bodies = [];
    if (pos && planetWorld && moonWorld) {
      const h = getCelestialBodyState(planetWorld, CONFIG.planetRadius, terrainProfile, pos, BODY_PHYSICS.haven.gravity);
      const l = getCelestialBodyState(moonWorld, CONFIG.moonRadius, moonTerrainProfile, pos, BODY_PHYSICS.moon.gravity);
      nearest = h.altitude <= l.altitude ? { body: "haven", altitudeM: roundTo(h.altitude, 1) } : { body: "luna", altitudeM: roundTo(l.altitude, 1) };
      // upM points away from each body's centre: fly along -upM to descend toward it.
      bodies = [
        { body: "haven", altitudeM: roundTo(h.altitude, 1), radiusM: CONFIG.planetRadius, centerM: vecJson(planetWorld.getWorldPosition(new THREE.Vector3())), upM: vecJson(h.up) },
        { body: "luna", altitudeM: roundTo(l.altitude, 1), radiusM: CONFIG.moonRadius, centerM: vecJson(moonWorld.getWorldPosition(new THREE.Vector3())), upM: vecJson(l.up) }
      ];
    }
    const gravity = pos ? queryGravityField(pos) : null;
    return {
      station, structure: (onFoot && playerAvatar) ? describeStructure(playerAvatar.position) : null,
      surfaceBody: station ? null : (onFoot ? (activeSurfaceBody === "moon" ? "luna" : "haven") : null),
      nearestBody: nearest, bodies, gravityMS2: gravity ? roundTo(gravity.magnitude, 2) : 0, gravityField: gravity ? gravity.id : null
    };
  }

  function getAgentState() {
    if (!THREE || !playerAvatar || !playerUp || destroyed) return { api: API_SCHEMA_VERSION, version: CONFIG.version, ready: false };
    const frame = getControlFrame();
    if (!frame) return { api: API_SCHEMA_VERSION, version: CONFIG.version, ready: false };
    const mode = getControlMode(), custom = activeControllable();
    const speed = mode === "ship" ? Math.hypot(velocity.x, velocity.y, velocity.z)
      : mode === "buggy" ? Math.abs(buggySpeed)
      : mode === "jetpack" ? (playerFlightVelocity ? playerFlightVelocity.length() : 0)
      : (mode === "walk" && avatarIsWalking) ? WORLD_SCALE.walkSpeed : 0;
    const surface = (mode === "walk" && !stationInteriorMode) ? sampleSurface(playerAvatar.position) : null;
    const state = {
      api: API_SCHEMA_VERSION, version: CONFIG.version, ready: true, timeS: roundTo(performance.now() / 1000, 2),
      character: characterSummary(),
      controller: { source: agentControl.active ? agentControl.by : "human", agentIntentActive: agentControl.active, agentIntent: { ...agentControl.intent } },
      mode: custom ? custom.mode : mode, modeHelp: custom ? custom.help : MODE_HELP[mode], view: cameraMode,
      location: describeLocation(),
      self: {
        positionM: vecJson(frame.pos), up: vecJson(frame.up), forward: vecJson(frame.forward), speedMS: roundTo(speed, 1),
        grounded: mode === "walk" ? !!playerGrounded : false, onFoot, inVehicle: mode !== "walk" && mode !== "jetpack",
        slopeDegrees: surface ? roundTo(surface.slopeDegrees, 1) : null
      },
      ship: ship ? {
        parked: shipParked, landingState, terrainContact: shipTerrainContact,
        positionM: vecJson(ship.position), occupied: !onFoot
      } : null,
      rover: havenBuggy ? { driving: buggyMode, occupants: Array.from(havenBuggy.userData.occupants ? havenBuggy.userData.occupants.values() : []).map(o => ({ id: o.id, type: o.type, label: o.label, slot: o.slot })) } : null,
      nearby: nearbyEntities(frame, 160, 14),
      destinations: destinationsList(frame),
      events: statusLog.slice(-12),
      kineticField: kineticFieldInfo(),
      control: controlOwnerInfo(),
      inventory: ranchGame.inventory.map(x => ({ ...x })), credits: ranchGame.credits, quests: ranchGame.quests.map(x => ({ ...x })),
      equipment: { rayGun: { shots: explorerEquipment.shots, hits: explorerEquipment.hits }, jetpackThrusting: explorerEquipment.thrusting },
      world: { schema: WORLD_SCHEMA_VERSION, revision: worldRevision, entities: worldEntities.size,
        physical: queryPhysicalInteractions({center:frame.pos,radius:18,limit:80}),
        simulation: evaluateActorPhysics({position:frame.pos,up:frame.up,forward:frame.forward,includeSupport:mode==="walk"||mode==="buggy",lookAhead:8,limit:40}) },
      actions: listActions(false).map(a => a.name),
      custom: null
    };
    if (custom && custom.getState) { try { state.custom = custom.getState(); } catch (error) { state.custom = { error: String(error && error.message ? error.message : error) }; } }
    return state;
  }

  function describeAgentApi() {
    return {
      api: API_SCHEMA_VERSION, version: CONFIG.version,
      summary: "Kepler Reach is an arcade 3D exploration game. Read state(), choose an intent (continuous controls) and/or an action (one-off), repeat.",
      intent: { fields: INTENT_FIELDS, aliases: INTENT_ALIASES, ttlMs: "default 800 (watchdog stop); 0 = hold until input.clear()" },
      modes: MODE_HELP,
      actions: listActions(true),
      characters: Array.from(characterRoster.values()).map(c => ({ id: c.id, name: c.name, role: c.role, description: c.description, claim: characterClaims.has(c.id) ? characterSummary(c.id) : null })),
      controllables: Array.from(controllables.values()).map(c => ({ id: c.id, label: c.label, mode: c.mode, help: c.help, actions: c.actionNames })),
      command: {
        usage: "await KeplerReach.agent.command({ character?, action?, params?, intent?, hold?, wait?, stop?, by? })",
        notes: [
          "intent is applied for `hold` ms (default 800), then expires, so an idle agent never runs away.",
          "wait (ms, max 10000) pauses before the returned state snapshot; hold implies wait.",
          "character claims a roster character (human, agent or script controllers); the local avatar becomes that character.",
          "Every call returns { ok, state } where state is the same JSON as KeplerReach.state().",
          "state.destinations lists every curated landing site/dock with position, distance, bearing and how to reach it; state.events is the recent HUD message log; state.kineticField says whether you can launch here and why not; state.location.structure names the structure you are standing on.",
          "Claiming a character as 'agent' or 'script' locks the local human's movement input; it is handed back automatically after 20 s without agent input, or immediately with KeplerReach.characters.reclaim()."
        ]
      }
    };
  }

  function agentGuide() {
    return [
      "World collision integration: world.colliders({center,radius,limit}) lists registered solid collider entities; world.supports({center,radius,limit}) lists registered walkable support entities.",
      "World spatial services: world.gravityFields({limit}) and world.boundaries({limit}) list registered gravity volumes and spherical travel boundaries; these share stable identity and lifecycle with all other World entities.",
      "Unified spatial queries: world.spatial.nearby({center,radius,kinds,tags,limit}), world.spatial.query(...) and world.spatial.nearest(...) return active entities by world-space distance from one shared registry.",
      "world.interactions.nearby({center:[x,y,z],radius:12}) discovers solids, supports, terrain, structures, gravityFields and boundaries in one response.",
      "world.simulation.evaluateActor({actor, radius:0.45, height:2, lookAhead:8}) evaluates an actor against shared gravity, support, forward solid obstacles and spherical boundaries.",
      "world.simulation.resolveActorStep({from:[x,y,z],to:[x,y,z],up:[x,y,z],radius:0.45,height:2}) returns a collision-resolved world position with wall sliding, boundary handling and optional support; use exclude:[object] to ignore an actor's own collider hierarchy.",
      "world.simulation.captureSupportFrame(supportObject) captures a moving platform; carryActorWithSupport(actorObject,frame,{up,forward}) applies its world transform delta to an actor and returns the carried orientation vectors. Call refreshSupportFrame(frame) to reset the attachment after teleporting/repositioning an actor.",
      "Moving-support attachments work with nested Object3D hierarchies and are reusable by humans, LLM agents, scripts, creatures and vehicles.",
      "world.registerPhysical(object,{kind:'structure',solid:true,walkable:true}) registers a physical object with shared classification tags. Terrain and structures can join the same spatial index without bespoke query systems.",
      "Collider/support lists expose the same registered entities consumed by existing collision and terrain-support algorithms; this release preserves those solvers.",
      "Humans, LLM agents and scripts share the character-control contract: input.set(), agent.command(), character claim/reclaim, and registerControllable() for additional actor controllers.",
      "World entities are available through KeplerReach.world: list(), get(id), query({center,radius,kind,tag,limit}) and snapshot({kind,tag,lifecycle,limit}).",
      "For registered non-instanced Three.js objects, world.setTransform(id,{position:[x,y,z],space:'world'}) or {quaternion:[x,y,z,w],space:'world'} writes a transform; scale is local-space.",
      "world.refresh() refreshes cached transform snapshots after legacy systems move scene objects. Instanced-mesh records remain read-only through this transform API.",
      "You are playing Kepler Reach through window.KeplerReach.agent.",
      "Loop: state = KeplerReach.state(); decide; await KeplerReach.agent.command({...}).",
      "Movement: command({ intent:{ forward:1, turn:-0.5 }, hold:1000 }) moves for one second then stops.",
      "One-off: command({ action:'board_ship' }) / 'vehicle_toggle' / 'buy' {item} / 'talk_nearest' ...",
      "Look at state.nearby (distanceM, bearingDeg: 0 ahead, +90 right) to find things; state.actions lists what is possible right now.",
      "state.mode tells you which controls matter (walk, jetpack, ship, buggy, boat, jetski) and modeHelp explains them.",
      "To play a roster character: command({ character:'benis', by:'MyAgent' }). Release with KeplerReach.characters.release('benis').",
      "Call KeplerReach.agent.describe() for the full machine-readable schema."
    ].join("\n");
  }

  async function agentCommand(cmd) {
    cmd = cmd && typeof cmd === "object" ? cmd : {};
    const out = { ok: true };
    const by = cmd.by ? String(cmd.by).slice(0, 60) : undefined;
    if (cmd.character) {
      out.character = claimCharacter(cmd.character, { by, controller: ["agent", "script", "human"].includes(cmd.controller) ? cmd.controller : "agent", force: !!cmd.force });
      if (!out.character.ok) out.ok = false;
    }
    if (cmd.action) {
      out.action = runAction(cmd.action, cmd.params);
      if (!out.action.ok) out.ok = false;
    }
    let hold = Math.max(0, Math.min(60000, Number(cmd.hold) || 0));
    if (cmd.intent === null) clearAgentIntent();
    else if (cmd.intent !== undefined) setAgentIntent(cmd.intent, { by, ttlMs: hold > 0 ? hold : (cmd.ttlMs !== undefined ? cmd.ttlMs : 800), merge: !!cmd.merge });
    const wait = Math.max(0, Math.min(10000, hold > 0 ? hold : (Number(cmd.wait) || 0)));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    if (cmd.stop) clearAgentIntent();
    out.state = getAgentState();
    return out;
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  window.KeplerReach = {
    version: CONFIG.version,
    world: {
      schema: WORLD_SCHEMA_VERSION,
      get revision() { return worldRevision; },
      get size() { return worldEntities.size; },
      register: registerWorldEntity, registerPhysical: registerPhysicalWorldEntity, get: getWorldEntity, list: listWorldEntities,
      query: queryWorldEntities,
      colliders(options={}) { return queryWorldEntities({...options,tag:"collision"}); },
      supports(options={}) { return queryWorldEntities({...options,tag:"walkable"}); },
      gravityFields(options={}) { return queryWorldEntities({...options,tag:"gravity-field"}); },
      boundaries(options={}) { return queryWorldEntities({...options,tag:"world-boundary"}); },
      spatial: {
        query: queryWorldSpatial,
        nearby(options={}) { return queryWorldSpatial(options); },
        nearest: nearestWorldSpatial
      },
      interactions: {
        query: queryPhysicalInteractions,
        nearby: discoverPhysicalInteractions,
        discover: discoverPhysicalInteractions,
        forActor(actor,options={}) {
          let center=worldVector(actor);
          if(!center&&actor&&actor.isObject3D){const point=actor.getWorldPosition(new THREE.Vector3());center=[point.x,point.y,point.z];}
          if(!center)throw new TypeError("Actor discovery requires a world position or Object3D.");
          return discoverPhysicalInteractions({...options,center});
        }
      },
      simulation: {
        evaluateActor: evaluateActorPhysics,
        probeActor: evaluateActorPhysics,
        resolveActorStep: resolvePhysicalActorStep,
        moveActor: resolvePhysicalActorStep,
        captureSupportFrame: captureSupportFrame,
        carryActorWithSupport: carryActorWithSupport,
        refreshSupportFrame: refreshSupportFrame,
        describe() { return {mode:"shared actor movement, physical observation and moving-support attachment",inputs:["actor or position","from","to","up","forward","radius","height","lookAhead","includeSupport","support","exclude","support Object3D","captured support frame","orientation up/forward"],outputs:["gravity vector","terrain/support contact","solid collision and sliding","world-boundary crossing","nearby physical entities","moving-platform position and rotation carry"],note:"Built-in and external controllers share swept-capsule collision and can attach arbitrary actors to moving supports; support deltas preserve world transforms through nested parent hierarchies."}; }
      },
      setState: setWorldEntityState, setTransform: setWorldEntityTransform,
      refresh: refreshWorldEntities, remove: removeWorldEntity, snapshot: worldSnapshot
    },
    scale: WORLD_SCALE,
    apiVersion: API_SCHEMA_VERSION,
    // ---- Unified control + observation API (humans, scripts, LLM agents) ----
    state: getAgentState,
    input: {
      set: setAgentIntent,
      clear: clearAgentIntent,
      current() { return { ...controlFrameIntent }; },
      get agentIntent() { return { ...agentControl.intent }; },
      get mode() { return getControlMode(); },
      schema: INTENT_FIELDS
    },
    actions: { list: listActions, run: runAction, define: defineAction },
    agent: {
      describe: describeAgentApi,
      state: getAgentState,
      command: agentCommand,
      drive(intent, ms) { return agentCommand({ intent, hold: ms === undefined ? 1000 : ms, stop: true }); },
      guide: agentGuide
    },
    characters: {
      list() { return Array.from(characterRoster.values()).map(c => ({ id: c.id, name: c.name, role: c.role, description: c.description, usernames: c.usernames.slice(), claim: characterClaims.has(c.id) ? characterSummary(c.id) : null })); },
      get active() { return characterSummary(); },
      claim: claimCharacter,
      release: releaseCharacter,
      handoff: handoffCharacter,
      reclaim(opts) { return handoffCharacter("human", opts); },
      register: registerCharacter,
      bindUsername,
      autoClaim: autoClaimCharacter
    },
    registerControllable,
    events() { return statusLog.slice(); },
    spacecraft:{get parked(){return shipParked;},brake:brakeShip,park(value){return setShipParked(value===undefined?true:!!value);}},
    physics:{
      model:"shared-body-mass-gravity-field-collision-boundary-and-support-surface-framework",
      worldSchema: WORLD_SCHEMA_VERSION,
      get worldEntityCount(){return worldEntities.size;},
      gravitationalConstant:PHYSICS_G,
      kineticField:{movement:"fixed-speed while thrust is held; immediate stop on release",speed:24,inertia:false,drift:false,momentumConservation:false,gravity:"queried from reusable local gravity fields"},
      jetpack:{movement:"legacy compatibility alias for Kinetic Field",speed:24,inertia:false,drift:false,momentumConservation:false},
      get bodies(){return Array.from(physicalBodies.values()).map(b=>({id:b.id,kind:b.kind,massKg:b.massKg,densityKgM3:b.densityKgM3,structuralStrength:b.structuralStrength,material:b.material,instanceId:b.instanceId}));},
      get gravityFields(){return Array.from(gravityFields.values()).map(f=>({id:f.id,shape:f.shape,priority:f.priority||0,magnitude:f.magnitude||f.surfaceGravity}));},
      get supportSurfaces(){return walkableSurfaces.map(o=>({id:o.userData.krWalkableSurface,name:o.name||"",visible:o.visible}));},
      get collisionDiagnostics(){
        const stats={...solidCollisionStats};
        stats.worldColliderEntities=Array.from(worldEntities.values()).filter(e=>e.lifecycle==="active"&&e.tags.includes("collision")).length;
        stats.worldWalkableEntities=Array.from(worldEntities.values()).filter(e=>e.lifecycle==="active"&&e.tags.includes("walkable")).length;
        return {
          frame:solidFrame,cellSize:SOLID_SPATIAL_CELL_SIZE,
          maxCellsPerCollider:SOLID_SPATIAL_MAX_CELLS_PER_COLLIDER,
          ...stats,
          candidateReduction:stats.candidateReferences>0
            ?1-(stats.narrowPhaseTests/Math.max(1,stats.candidateReferences)):0
        };
      },
      get supportDiagnostics(){
        return {
          frame:solidFrame,registeredSurfaces:walkableSurfaces.length,
          ...supportSampleStats
        };
      },
      registerSupportSurface(mesh,id){return registerWalkableSurface(mesh,id);},
      registerBody(object,profile){return registerPhysicalBody(object,profile);},
      registerGravityField(id,field){return registerGravityField(id,field);},
      gravityAt(position){const v=queryGravityField(position);return v?{field:v.id,kind:v.kind,magnitude:v.magnitude,up:{x:v.up.x,y:v.up.y,z:v.up.z}}:null;},
      astronomy:{havenDaySeconds:HAVEN_DAY_SECONDS,havenYearSeconds:HAVEN_YEAR_SECONDS,lunaOrbitSeconds:LUNA_ORBIT_SECONDS,lastStopOrbitSeconds:LAST_STOP_ORBIT_SECONDS,orbitalTimeScale:"game-scaled; local gravity fields use inverse-square falloff"},
      bodiesByName:{haven:{surfaceGravity:BODY_PHYSICS.haven.gravity,escapeVelocity:Math.sqrt(2*BODY_PHYSICS.haven.gravity*BODY_PHYSICS.haven.radius)},luna:{surfaceGravity:BODY_PHYSICS.moon.gravity,escapeVelocity:Math.sqrt(2*BODY_PHYSICS.moon.gravity*BODY_PHYSICS.moon.radius)}},
      player:{jumpSpeed:PLAYER_JUMP_SPEED,get inSpaceFlight(){return playerInSpaceFlight;},get flightSpeed(){return playerFlightVelocity?playerFlightVelocity.length():0;}}
    },
    characterController:{type:"planet-radial-heightfield-controller",height:PLAYER_CAPSULE.height,radius:PLAYER_CAPSULE.radius,verticalWallThresholdDegrees:PLAYER_CAPSULE.verticalWallThresholdDegrees,stepHeightBlocked:false,gravity:{haven:BODY_PHYSICS.haven.gravity,luna:BODY_PHYSICS.moon.gravity},jumpSpeed:PLAYER_JUMP_SPEED},
    controls:{flight:"left joystick steers 3D yaw/pitch; hold BOOST to launch and accelerate along the flight nose; drag the open right half of the screen to orbit the chase camera independently; center button recenters the view; release BOOST to stop powered horizontal movement and descend under local gravity; no retained horizontal momentum; keyboard arrows lift/descend and strafe",buggy:"joystick drives, D-pad orbits camera",explorer:"WASD walk; hold Space/BOOST to launch; X fires ray gun"},
    equipment:{kineticField:{get thrusting(){return explorerEquipment.thrusting;}},jetpack:{get thrusting(){return explorerEquipment.thrusting;}},rayGun:{fire:fireRayGun,get shots(){return explorerEquipment.shots;},get hits(){return explorerEquipment.hits;},get oreMined(){return explorerEquipment.oreMined;}},get practiceTargets(){return explorerEquipment.targets.length;},get voxel(){return voxelWorld?voxelWorld.stats:null;}},
    seed: CONFIG.seed,
    game:{get credits(){return ranchGame.credits;},get inventory(){return ranchGame.inventory.map(x=>({...x}));},get quests(){return ranchGame.quests.map(x=>({...x}));},buy(name){return buyRanchItem(name);},addCredits(amount){const n=Math.floor(Number(amount));if(!Number.isFinite(n)||n<=0||n>100000)return false;ranchGame.credits+=n;return true;}},
    npc:{snapshot(){return {characters:[{id:"lemmy",name:"Lemmy",role:"Ranch owner",dialogue:ranchGame.dialogue}],credits:ranchGame.credits,inventory:ranchGame.inventory.map(x=>({...x})),quests:ranchGame.quests.map(x=>({...x}))};},action(c){if(!c||c.character!=="lemmy")return {ok:false,error:"Unknown character"};if(c.action==="talk"){ranchGame.dialogue=String(c.text||"Howdy, partner.").slice(0,240);return {ok:true,dialogue:ranchGame.dialogue};}if(c.action==="buy")return {ok:buyRanchItem(String(c.item||"")),credits:ranchGame.credits};if(c.action==="offer_quest"){acceptRanchQuest();return {ok:true};}return {ok:false,error:"Action not permitted"};}},
    vehicle:{get occupants(){return havenBuggy?Array.from(havenBuggy.userData.occupants.values()).map(({id,type,label,slot})=>({id,type,label,slot})):[];},board(spec){return addVehicleOccupant(spec);},leave(id){return removeVehicleOccupant(id);},get capacity(){return havenBuggy?{...havenBuggy.userData.capacity}:{seats:2,cargo:2};}},
    models: {
      get registered() { return listModularModels(); },
      register(id, specification) { return registerModularModel(id, specification); },
      load(id, options) { return loadModularModel(id, options || {}); },
      loadGeorge() { return loadGeorgeExplorer(); },
      loadTrashCanRobot() { return loadTrashCanExplorer(); },
      selectCharacter(id) { return selectExplorerCharacter(id); },
      get activeCharacter() { return activeExplorerCharacter; },
      get georgeReady() { return !!(georgeExplorer && georgeExplorer.ready); },
      get trashCanRobotReady() { return !!(trashCanExplorer && trashCanExplorer.ready); },
      createSocket(host, name, transform) { return createModelSocket(host, name, transform || {}); },
      attach(host, socketName, moduleObject) { return attachModelModule(host, socketName, moduleObject); },
      get loadedCount() { return modularModels.instances.size; },
      get loaderStatus() {
        return modularModels.loaderPromise ? "requested" : "not-requested";
      }
    },

    destroy() {
      destroyed = true;

      cancelAnimationFrame(animationFrame);

      cleanup.forEach(fn => fn());

      if (renderer) {
        renderer.dispose();

        renderer.domElement.remove();
      }

      if (navLabel && navLabel.parentNode) navLabel.remove();
      if (landingButton && landingButton.parentNode) landingButton.remove();
      if (disembarkButton && disembarkButton.parentNode) disembarkButton.remove();
      if (boardShipButton && boardShipButton.parentNode) boardShipButton.remove();
      if (cameraButton && cameraButton.parentNode) cameraButton.remove();
      for(const c of [boostButton,fireButton,digButton,equipmentReadout,aimReticle])if(c&&c.parentNode)c.remove();
      explorerEquipment.targets.forEach(t=>{if(t.parent)t.parent.remove(t);t.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose&&m.dispose());}});});
      explorerEquipment.beams.forEach(b=>{if(b.object.parent)b.object.parent.remove(b.object);b.object.geometry.dispose();b.object.material.dispose();});
      if (buggyInteractButton && buggyInteractButton.parentNode) buggyInteractButton.remove();
      if (habitatGateButton && habitatGateButton.parentNode) habitatGateButton.remove();
      if (modelWorkshopButton && modelWorkshopButton.parentNode) modelWorkshopButton.remove();
      if (modelWorkshopPanel && modelWorkshopPanel.parentNode) modelWorkshopPanel.remove();
      if (modelWorkshopPreview) disposeWorkshopObject(modelWorkshopPreview);
      if (activeShipModel) disposeWorkshopObject(activeShipModel);
      modelWorkshopPreview = null;
      activeShipModel = null;
      if (ranchInteractButton && ranchInteractButton.parentNode) ranchInteractButton.remove();
      if (ranchPanel && ranchPanel.parentNode) ranchPanel.remove();

      modularModels.instances.forEach(instance => {
        instance.traverse(object => {
          if (object.geometry && typeof object.geometry.dispose === "function") {
            object.geometry.dispose();
          }
          if (object.material) {
            const materials = Array.isArray(object.material)
              ? object.material
              : [object.material];
            materials.forEach(material => {
              if (material && typeof material.dispose === "function") material.dispose();
            });
          }
        });
        if (instance.parent) instance.parent.remove(instance);
      });
      modularModels.instances.clear();
      modularModels.registry.clear();
      modularModels.loaderPromise = null;

      if (scene) {
        scene.traverse(object => {
          if (object.geometry) {
            object.geometry.dispose();
          }

          if (object.material) {
            const materials = Array.isArray(
              object.material
            )
              ? object.material
              : [object.material];

            materials.forEach(material => {
              material.dispose();
            });
          }
        });
      }

      root.remove();

      delete window.KeplerReach;
    }
  };

  // Start

  initialize();

})();
