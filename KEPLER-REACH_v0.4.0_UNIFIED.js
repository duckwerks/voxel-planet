(() => {
  "use strict";

  // ============================================================
  // KEPLER REACH 0.4.0  —  UNIFIED CONTROLS + FLIGHT PHYSICS
  // Procedural 3D Universe for CyTube
  //
  // Based on original work by Elwood Edwards (v0.3.65)
  // Control / Physics overhaul for open-world play
  //
  // GOAL
  // Walk a planet → board ship → fly to another body / station →
  // land or dock → walk around / drive → launch again.
  //
  // KEY IMPROVEMENTS IN 0.4.0
  // - Unified control scheme across on-foot, jetpack, ship, buggy
  // - Real linear + angular velocity for ship and jetpack
  // - Flight Assist (toggle) — kills residual rotation & provides
  //   translation relative to local up when enabled
  // - Clear mode transitions and consistent input meaning
  // - Basic attitude / velocity HUD for spatial awareness
  // - Improved jetpack that feels like a short-range EVA suit
  // - Ship retains inertia (no more zero-inertia arcade translation)
  // - Same visual style and procedural generation intent
  //
  // CONTROLS (keyboard)
  //   W/S          Forward / Back thrust (or walk)
  //   A/D          Yaw  (or strafe when holding Alt / Precision)
  //   Q/E          Roll
  //   R/F          Pitch up / Pitch down   (also mouse look)
  //   Space        Up thrusters / Jump / Boost
  //   Ctrl         Down thrusters
  //   Shift        Precision mode (slower, finer control)
  //   V            Cycle camera
  //   F            Interact / Board / Disembark / Enter vehicle
  //   X            Fire ray gun (on foot)
  //   H            Return to home position
  //   G            Open wildlife habitat (when available)
  //   Tab          Toggle Flight Assist
  //
  // Mouse: look / free-look (right button hold in some modes)
  // ============================================================

  if (window.KeplerReach) {
    window.KeplerReach.destroy();
  }

  const CONFIG = {
    version: "0.4.0-unified",
    seed: 847291,
    threeVersion: "0.160.0",

    starCount: 3500,
    settlementCount: 280,
    asteroidCount: 520,

    planetRadius: 110,
    moonRadius: 48,
    planetPosition: [0, 0, -650],

    // Ship flight
    shipAcceleration: 55,
    shipMaxSpeed: 180,
    shipAngularAccel: 1.8,
    shipAngularDamp: 2.4,
    shipLinearDamp: 0.35,          // low in space
    shipLinearDampAtmosphere: 1.8,

    // Jetpack / EVA
    jetpackThrust: 22,
    jetpackMaxSpeed: 38,
    jetpackFuelMax: 100,
    jetpackFuelBurn: 12,           // per second at full thrust
    jetpackFuelRegen: 8,           // per second on ground

    // Walking
    walkSpeed: 5.2,
    runMultiplier: 1.55,
    jumpSpeed: 5.8,

    background: 0x11152a
  };

  // ============================================================
  // SEEDED RANDOM
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

  const WORLD_SCALE = Object.freeze({
    unitsPerMeter: 1,
    explorerHeight: 2.0,
    doorwayHeight: 3.2,
    moonBuggyLength: 7.5,
    motorcycleLength: 3.0,
    mountLength: 3.2,
    jetpackHeight: 1.2,
    walkSpeed: CONFIG.walkSpeed,
    maxWalkSlopeDegrees: 48,
    cameraClearance: 0.55
  });

  const PLAYER_CAPSULE = Object.freeze({
    height: WORLD_SCALE.explorerHeight,
    radius: 0.42,
    maxSubstepDistance: 0.20,
    verticalWallThresholdDegrees: 89.5,
    groundSkin: 0.03
  });

  const BODY_PHYSICS = Object.freeze({
    haven: Object.freeze({ gravity: 9.8, radius: CONFIG.planetRadius }),
    moon: Object.freeze({ gravity: 1.62, radius: CONFIG.moonRadius })
  });

  const random = seededRandom(CONFIG.seed);
  const AVATAR_SOLE_CLEARANCE = 0.13;

  // ============================================================
  // APPLICATION STATE
  // ============================================================

  let THREE = null;
  let scene = null;
  let camera = null;
  let renderer = null;

  const modularModels = {
    registry: new Map(),
    instances: new Set(),
    loaderPromise: null
  };

  let ship = null;
  let shipVisualRoot = null;
  let shipProceduralVisual = null;
  let activeShipModel = null;

  // Player / mode state
  let onFoot = false;
  let buggyMode = false;
  let playerInSpaceFlight = false;   // jetpack / EVA free-flight
  let stationInteriorMode = false;
  let playerGrounded = true;
  let playerVerticalSpeed = 0;
  let playerAirHeight = 0;
  let avatarIsWalking = false;

  // Vectors (allocated after Three.js loads)
  let playerAvatar = null;
  let playerHeading = null;
  let playerUp = null;
  let playerRight = null;
  let playerMove = null;
  let playerFlightForward = null;
  let playerFlightVelocity = null;
  let playerCameraTarget = null;

  // Ship physics (real velocity)
  let shipVelocity = null;           // THREE.Vector3
  let shipAngularVelocity = null;    // THREE.Vector3 (local)
  let flightAssist = true;

  // Jetpack
  let jetpackFuel = CONFIG.jetpackFuelMax;

  // Camera
  let cameraMode = "third";          // "third" | "first"
  let cameraYaw = 0;
  let cameraPitch = 0.28;
  let flightCameraYaw = 0;
  let flightCameraPitch = 0.18;

  // Input
  const keys = Object.create(null);
  let lookInputX = 0, lookInputY = 0;
  let touchFlightYaw = 0, touchFlightPitch = 0;
  let touchFlightThrust = 0, touchFlightStrafe = 0;
  let boostHeld = false;
  let precisionMode = false;

  // Landing / navigation
  let landingState = "idle";         // idle | approach | landed
  let landingMarker = null;
  let havenLandingMarker = null;
  let landingTarget = null;
  let landingNormal = null;
  let landingQuaternion = null;
  let landingDestination = null;
  let activeLandingBody = "haven";
  let activeSurfaceBody = "haven";

  // World references
  let planetWorld = null;
  let moonWorld = null;
  let moonOrbit = null;
  let stationRing = null;
  let asteroidBelt = null;
  let lastStopDinerRef = null;
  let havenBuggy = null;
  let buggyWheels = [];
  let buggyHeading = 0;
  let buggySpeed = 0;

  // Terrain
  let terrainProfile = null;
  let moonTerrainProfile = null;

  // UI elements
  let root = null;
  let statusEl = null;
  let navReadout = null;
  let attitudeHud = null;
  let fuelBar = null;
  let assistLabel = null;
  let boardShipButton = null;
  let disembarkButton = null;
  let landingButton = null;
  let cameraButton = null;
  let homeButton = null;
  let boostButton = null;
  let fireButton = null;
  let mobile = null;
  let lookPad = null;
  let moveLabel = null;
  let lookPadLabel = null;

  // Misc
  let destroyed = false;
  let animationFrame = 0;
  let lastTime = 0;
  let planetCenter = null;
  let desiredCamera = null;
  let lookTarget = null;
  let cameraRaycaster = null;

  const cleanup = [];

  // ============================================================
  // UTILITY
  // ============================================================

  function setStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.color = isError ? "#ff6b6b" : "#9fe8c7";
  }

  function isTyping() {
    const el = document.activeElement;
    return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  // ============================================================
  // INPUT SYSTEM  (unified)
  // ============================================================

  function keyDown(event) {
    if (isTyping()) return;
    const key = event.key.toLowerCase();

    if (key === "h") { returnHome(); event.preventDefault(); return; }
    if (key === "v") { toggleCameraMode(); event.preventDefault(); return; }
    if (key === "tab") { flightAssist = !flightAssist; updateAssistLabel(); event.preventDefault(); return; }
    if (key === "x" && onFoot && !buggyMode && !event.repeat) { fireRayGun(); event.preventDefault(); return; }
    if (key === "f" && !event.repeat) { handleInteract(); event.preventDefault(); return; }
    if (key === " ") { keys.space = true; event.preventDefault(); return; }
    if (key === "shift") { precisionMode = true; event.preventDefault(); return; }
    if (key === "control") { keys.ctrl = true; event.preventDefault(); return; }

    if ("wasdqer".includes(key) ||
        key === "arrowup" || key === "arrowdown" ||
        key === "arrowleft" || key === "arrowright") {
      keys[key] = true;
      event.preventDefault();
    }
  }

  function keyUp(event) {
    const key = event.key.toLowerCase();
    if (key === " ") keys.space = false;
    else if (key === "shift") precisionMode = false;
    else if (key === "control") keys.ctrl = false;
    else keys[key] = false;
  }

  function clearKeys() {
    Object.keys(keys).forEach(k => { keys[k] = false; });
    precisionMode = false;
    boostHeld = false;
  }

  function getThrustInput() {
    // Unified thrust vector in local ship/avatar space
    // X = strafe, Y = up/down, Z = forward/back  (Three.js: -Z is forward)
    const precision = precisionMode ? 0.35 : 1.0;
    let forward = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);
    let strafe  = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);   // will be remapped
    let vertical = (keys.space ? 1 : 0) - (keys.ctrl ? 1 : 0);

    // Touch overrides / additions
    forward += touchFlightThrust;
    strafe  += touchFlightStrafe;

    forward = clamp(forward, -1, 1) * precision;
    strafe  = clamp(strafe, -1, 1) * precision;
    vertical = clamp(vertical, -1, 1) * precision;

    return { forward, strafe, vertical };
  }

  function getRotationInput(delta) {
    const precision = precisionMode ? 0.4 : 1.0;
    let yaw   = (keys.a ? 1 : 0) - (keys.d ? 1 : 0);      // A left, D right
    let pitch = (keys.r ? 1 : 0) - (keys.f ? 1 : 0);      // R up, F down
    let roll  = (keys.q ? 1 : 0) - (keys.e ? 1 : 0);

    yaw   += touchFlightYaw;
    pitch += touchFlightPitch;

    // Mouse / look pad contribution for free look modes is handled separately
    yaw   = clamp(yaw, -1, 1) * precision;
    pitch = clamp(pitch, -1, 1) * precision;
    roll  = clamp(roll, -1, 1) * precision;

    return { yaw, pitch, roll };
  }

  // ============================================================
  // SURFACE SAMPLING (kept compatible with original)
  // ============================================================

  function sampleSurface(worldPosition) {
    const surfaceRoot = activeSurfaceBody === "moon" && moonWorld ? moonWorld : planetWorld;
    const surfaceRadius = activeSurfaceBody === "moon" ? CONFIG.moonRadius : CONFIG.planetRadius;
    const profile = activeSurfaceBody === "moon" ? moonTerrainProfile : terrainProfile;
    if (!surfaceRoot || !profile) {
      return {
        position: worldPosition.clone(),
        up: new THREE.Vector3(0, 1, 0),
        slopeDegrees: 0,
        elevation: 0
      };
    }

    const local = surfaceRoot.worldToLocal(worldPosition.clone());
    const radial = local.clone().normalize();
    const terrain = profile(radial.x, radial.y, radial.z);
    const elevation = terrain.elevation || 0;

    let east = new THREE.Vector3(0, 1, 0).cross(radial);
    if (east.lengthSq() < 1e-7) east.set(1, 0, 0);
    east.normalize();
    const north = radial.clone().cross(east).normalize();

    const sampleAngle = activeSurfaceBody === "moon" ? (1.0 / CONFIG.moonRadius) : 0.006;
    const sampleAt = (dir) => {
      const d = radial.clone().addScaledVector(dir, sampleAngle).normalize();
      return profile(d.x, d.y, d.z).elevation || 0;
    };

    const eEast = sampleAt(east);
    const eWest = sampleAt(east.clone().negate());
    const eNorth = sampleAt(north);
    const eSouth = sampleAt(north.clone().negate());

    const slopeX = (eEast - eWest) / (2 * sampleAngle * surfaceRadius);
    const slopeZ = (eNorth - eSouth) / (2 * sampleAngle * surfaceRadius);
    const slopeDegrees = Math.atan(Math.sqrt(slopeX * slopeX + slopeZ * slopeZ)) * (180 / Math.PI);

    const worldUp = radial.clone().applyQuaternion(surfaceRoot.getWorldQuaternion(new THREE.Quaternion())).normalize();
    const surfacePos = surfaceRoot.localToWorld(
      radial.clone().multiplyScalar(surfaceRadius + elevation + AVATAR_SOLE_CLEARANCE)
    );

    return {
      position: surfacePos,
      up: worldUp,
      slopeDegrees,
      elevation
    };
  }

  function resolveSurfaceStep(fromPosition, desiredPosition) {
    const start = sampleSurface(fromPosition);
    const movement = desiredPosition.clone().sub(fromPosition);
    const distance = movement.length();
    if (distance < 1e-6) return start;

    const steps = Math.max(1, Math.ceil(distance / PLAYER_CAPSULE.maxSubstepDistance));
    let accepted = start;
    for (let i = 1; i <= steps; i++) {
      const candidate = sampleSurface(fromPosition.clone().addScaledVector(movement, i / steps));
      if (candidate.slopeDegrees >= PLAYER_CAPSULE.verticalWallThresholdDegrees) break;
      accepted = candidate;
    }
    return accepted;
  }

  // ============================================================
  // GRAVITY HELPERS
  // ============================================================

  function getGravityAt(position) {
    // Simple two-body (Haven + Luna). Returns acceleration vector (world).
    const g = new THREE.Vector3();
    if (planetWorld) {
      const center = planetWorld.getWorldPosition(new THREE.Vector3());
      const toCenter = center.clone().sub(position);
      const dist = Math.max(toCenter.length(), CONFIG.planetRadius * 0.5);
      const strength = BODY_PHYSICS.haven.gravity * Math.pow(CONFIG.planetRadius / dist, 2);
      g.addScaledVector(toCenter.normalize(), -strength);
    }
    if (moonWorld) {
      const center = moonWorld.getWorldPosition(new THREE.Vector3());
      const toCenter = center.clone().sub(position);
      const dist = Math.max(toCenter.length(), CONFIG.moonRadius * 0.5);
      const strength = BODY_PHYSICS.moon.gravity * Math.pow(CONFIG.moonRadius / dist, 2);
      g.addScaledVector(toCenter.normalize(), -strength);
    }
    return g;
  }

  function nearestBody(position) {
    let best = "haven";
    let bestAlt = Infinity;
    if (planetWorld) {
      const c = planetWorld.getWorldPosition(new THREE.Vector3());
      const alt = position.distanceTo(c) - CONFIG.planetRadius;
      if (alt < bestAlt) { bestAlt = alt; best = "haven"; }
    }
    if (moonWorld) {
      const c = moonWorld.getWorldPosition(new THREE.Vector3());
      const alt = position.distanceTo(c) - CONFIG.moonRadius;
      if (alt < bestAlt) { bestAlt = alt; best = "moon"; }
    }
    return { body: best, altitude: bestAlt };
  }

  // ============================================================
  // ORIENTATION / AVATAR
  // ============================================================

  function orientAvatar() {
    if (!playerAvatar || !playerHeading || !playerUp) return;
    const look = playerHeading.clone().addScaledVector(playerUp, -playerHeading.dot(playerUp)).normalize();
    if (look.lengthSq() < 1e-6) return;
    const right = look.clone().cross(playerUp).normalize();
    const m = new THREE.Matrix4().makeBasis(right, playerUp, look.clone().negate());
    playerAvatar.quaternion.setFromRotationMatrix(m);
  }

  // ============================================================
  // ON-FOOT UPDATE
  // ============================================================

  function updateOnFoot(delta) {
    if (!onFoot || !playerAvatar || buggyMode) return;

    moveLabel && (moveLabel.textContent = "MOVE");
    lookPadLabel && (lookPadLabel.textContent = "LOOK");

    // Station interior: flat walking
    if (stationInteriorMode && lastStopDinerRef && !playerInSpaceFlight) {
      const turn = (keys.a ? 1 : 0) - (keys.d ? 1 : 0);
      const walk = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);
      if (turn) {
        playerHeading.applyAxisAngle(new THREE.Vector3(0, 1, 0), turn * 1.9 * delta).normalize();
      }
      if (walk) {
        playerAvatar.position.addScaledVector(playerHeading, walk * WORLD_SCALE.walkSpeed * delta);
      }
      const local = lastStopDinerRef.worldToLocal(playerAvatar.position.clone());
      local.x = clamp(local.x, -38, 154);
      local.z = clamp(local.z, -47, 47);
      local.y = 5.9;
      playerAvatar.position.copy(lastStopDinerRef.localToWorld(local));
      playerUp.set(0, 1, 0);
      orientAvatar();
      avatarIsWalking = !!walk;
      updateOnFootCamera(delta);
      return;
    }

    // Planetary surface
    if (playerInSpaceFlight) {
      updateJetpack(delta);
      return;
    }

    const turn = (keys.a ? 1 : 0) - (keys.d ? 1 : 0);
    const walk = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);
    const speedMul = (keys.shift || precisionMode) ? 0.55 : (boostHeld || keys.space ? CONFIG.runMultiplier : 1.0);

    if (turn) {
      playerHeading.applyAxisAngle(playerUp, turn * 1.9 * delta);
      playerHeading.addScaledVector(playerUp, -playerHeading.dot(playerUp)).normalize();
    }

    const currentSurface = sampleSurface(playerAvatar.position);
    const gravity = BODY_PHYSICS[activeSurfaceBody === "moon" ? "moon" : "haven"].gravity;

    if (playerGrounded) {
      playerVerticalSpeed = 0;
      playerAirHeight = 0;

      if (keys.space && !boostHeld) {
        // Short jump
        playerVerticalSpeed = CONFIG.jumpSpeed;
        playerGrounded = false;
        playerAirHeight = 0.05;
      } else if (boostHeld || (keys.space && jetpackFuel > 5)) {
        // Transition into jetpack
        enterJetpack();
        return;
      }

      let playerMove = new THREE.Vector3();
      if (walk) {
        playerMove.copy(playerHeading).multiplyScalar(walk * WORLD_SCALE.walkSpeed * speedMul * delta);
      }
      const previousPosition = playerAvatar.position.clone();
      const desired = previousPosition.clone().add(playerMove);
      const surface = resolveSurfaceStep(previousPosition, desired);
      playerAvatar.position.copy(surface.position);
      playerUp.copy(surface.up);
    } else {
      // Airborne (jump or falling)
      if (walk) {
        playerAvatar.position.addScaledVector(playerHeading, walk * WORLD_SCALE.walkSpeed * 0.7 * delta);
      }
      playerVerticalSpeed -= gravity * delta;
      playerAirHeight += playerVerticalSpeed * delta;

      const projected = sampleSurface(playerAvatar.position);
      if (playerAirHeight <= 0 && playerVerticalSpeed <= 0) {
        playerAirHeight = 0;
        playerVerticalSpeed = 0;
        playerGrounded = true;
        playerAvatar.position.copy(projected.position);
        playerUp.copy(projected.up);
        setStatus("LANDED // " + (activeSurfaceBody === "moon" ? "LUNA" : "HAVEN"));
      } else {
        playerAvatar.position.copy(projected.position).addScaledVector(projected.up, playerAirHeight);
        playerUp.copy(projected.up);
      }
    }

    playerHeading.addScaledVector(playerUp, -playerHeading.dot(playerUp)).normalize();
    orientAvatar();
    avatarIsWalking = !!walk && playerGrounded;
    updateOnFootCamera(delta);

    // Fuel regen on ground
    if (playerGrounded) {
      jetpackFuel = Math.min(CONFIG.jetpackFuelMax, jetpackFuel + CONFIG.jetpackFuelRegen * delta);
    }
    updateFuelBar();
  }

  function updateOnFootCamera(delta) {
    if (!playerAvatar || !camera) return;
    playerCameraTarget.copy(playerAvatar.position).addScaledVector(playerUp, 1.35);

    cameraYaw -= lookInputX * 1.75 * delta;
    cameraPitch = clamp(cameraPitch - lookInputY * 1.15 * delta, -0.35, 0.95);

    if (cameraMode === "first") {
      const head = playerAvatar.position.clone().addScaledVector(playerUp, 1.85);
      camera.position.lerp(head, 1 - Math.pow(0.00008, delta));
      const lookDir = playerHeading.clone().applyAxisAngle(playerUp, cameraYaw);
      lookDir.addScaledVector(playerUp, Math.tan(cameraPitch) * 0.6).normalize();
      camera.up.copy(playerUp);
      camera.lookAt(head.clone().addScaledVector(lookDir, 12));
    } else {
      const back = playerHeading.clone().negate().applyAxisAngle(playerUp, cameraYaw);
      const desired = playerCameraTarget.clone()
        .addScaledVector(back, 7.8 * Math.cos(cameraPitch))
        .addScaledVector(playerUp, 7.8 * Math.sin(cameraPitch) + 1.2);
      camera.up.copy(playerUp);
      camera.position.lerp(desired, 1 - Math.pow(0.00008, delta));
      camera.lookAt(playerCameraTarget);
    }
  }

  // ============================================================
  // JETPACK / EVA  (proper 6DOF with local gravity)
  // ============================================================

  function enterJetpack() {
    if (!playerAvatar || !playerFlightVelocity) return;
    playerInSpaceFlight = true;
    playerGrounded = false;
    playerFlightForward.copy(playerHeading);
    playerFlightVelocity.set(0, 0, 0);
    setStatus("JETPACK ENGAGED // FUEL " + Math.round(jetpackFuel) + "%");
  }

  function exitJetpackToGround() {
    playerInSpaceFlight = false;
    playerGrounded = true;
    playerAirHeight = 0;
    playerVerticalSpeed = 0;
    setStatus("JETPACK OFF // SURFACE");
  }

  function updateJetpack(delta) {
    if (!playerAvatar || !playerFlightVelocity || !playerInSpaceFlight) return;

    moveLabel && (moveLabel.textContent = "THRUST");
    lookPadLabel && (lookPadLabel.textContent = "LOOK / ROTATE");

    const dt = Math.min(delta, 0.05);
    const thrustInput = getThrustInput();
    const rotInput = getRotationInput(dt);

    // Local gravity
    const gravity = getGravityAt(playerAvatar.position);
    const nearest = nearestBody(playerAvatar.position);

    // Build local frame
    // playerFlightForward = nose
    // playerUp = current "up" (we keep a stable up and let gravity pull)
    if (gravity.lengthSq() > 1e-6) {
      // Gently pull visual up toward anti-gravity for orientation comfort
      const antiG = gravity.clone().normalize().negate();
      playerUp.lerp(antiG, 1 - Math.pow(0.15, dt)).normalize();
    }

    // Rotation
    const yawSpeed = 1.6 * dt;
    const pitchSpeed = 1.4 * dt;
    const rollSpeed = 1.8 * dt;

    if (rotInput.yaw) {
      playerFlightForward.applyAxisAngle(playerUp, -rotInput.yaw * yawSpeed);
    }
    let right = playerFlightForward.clone().cross(playerUp);
    if (right.lengthSq() < 1e-8) right.copy(playerRight || new THREE.Vector3(1, 0, 0));
    right.normalize();
    if (rotInput.pitch) {
      playerFlightForward.applyAxisAngle(right, rotInput.pitch * pitchSpeed);
      playerUp.applyAxisAngle(right, rotInput.pitch * pitchSpeed);
    }
    if (rotInput.roll) {
      playerUp.applyAxisAngle(playerFlightForward, rotInput.roll * rollSpeed);
    }

    playerFlightForward.normalize();
    playerUp.normalize();
    // Re-orthogonalize
    right = playerFlightForward.clone().cross(playerUp).normalize();
    playerUp.copy(right.clone().cross(playerFlightForward).normalize());
    playerRight = right;

    // Thrust (local)
    const thrustMag = CONFIG.jetpackThrust;
    const accel = new THREE.Vector3();
    accel.addScaledVector(playerFlightForward, thrustInput.forward * thrustMag);
    accel.addScaledVector(right, thrustInput.strafe * thrustMag * 0.75);
    accel.addScaledVector(playerUp, thrustInput.vertical * thrustMag * 0.85);

    // Fuel
    const thrustUsed = Math.abs(thrustInput.forward) + Math.abs(thrustInput.strafe) * 0.7 + Math.abs(thrustInput.vertical) * 0.8;
    if (thrustUsed > 0.05 && jetpackFuel > 0) {
      jetpackFuel = Math.max(0, jetpackFuel - CONFIG.jetpackFuelBurn * thrustUsed * dt);
      playerFlightVelocity.addScaledVector(accel, dt);
    } else if (thrustUsed > 0.05 && jetpackFuel <= 0) {
      setStatus("JETPACK FUEL EMPTY");
    }

    // Gravity
    playerFlightVelocity.addScaledVector(gravity, dt);

    // Soft speed limit
    const speed = playerFlightVelocity.length();
    if (speed > CONFIG.jetpackMaxSpeed) {
      playerFlightVelocity.multiplyScalar(CONFIG.jetpackMaxSpeed / speed);
    }

    // Integrate
    playerAvatar.position.addScaledVector(playerFlightVelocity, dt);

    // Ground proximity check
    const surface = sampleSurface(playerAvatar.position);
    const distToSurface = playerAvatar.position.distanceTo(surface.position);
    if (distToSurface < 1.8 && playerFlightVelocity.dot(surface.up) < 2.0) {
      // Auto-land when close and not climbing hard
      playerAvatar.position.copy(surface.position);
      playerUp.copy(surface.up);
      playerHeading.copy(playerFlightForward).addScaledVector(playerUp, -playerFlightForward.dot(playerUp)).normalize();
      exitJetpackToGround();
      return;
    }

    orientAvatar();
    updateJetpackCamera(dt);
    updateFuelBar();
    updateAttitudeHud(playerFlightVelocity, playerUp, playerFlightForward);
  }

  function updateJetpackCamera(delta) {
    if (!playerAvatar || !camera) return;
    playerCameraTarget.copy(playerAvatar.position).addScaledVector(playerUp, 1.2);

    // Mouse / look pad orbits the chase camera
    flightCameraYaw -= lookInputX * 1.4 * delta;
    flightCameraPitch = clamp(flightCameraPitch - lookInputY * 1.0 * delta, -0.6, 0.85);

    if (cameraMode === "first") {
      const head = playerAvatar.position.clone().addScaledVector(playerUp, 1.7);
      camera.position.lerp(head, 1 - Math.pow(0.00005, delta));
      camera.up.copy(playerUp);
      camera.lookAt(head.clone().addScaledVector(playerFlightForward, 20));
    } else {
      const back = playerFlightForward.clone().negate().applyAxisAngle(playerUp, flightCameraYaw);
      const desired = playerCameraTarget.clone()
        .addScaledVector(back, 9.5 * Math.cos(flightCameraPitch))
        .addScaledVector(playerUp, 9.5 * Math.sin(flightCameraPitch) + 1.5);
      camera.up.copy(playerUp);
      camera.position.lerp(desired, 1 - Math.pow(0.00005, delta));
      camera.lookAt(playerCameraTarget);
    }
  }

  // ============================================================
  // SHIP FLIGHT  (real 6DOF + Flight Assist)
  // ============================================================

  function updateFlight(delta) {
    if (!ship) return;

    moveLabel && (moveLabel.textContent = "AIM / ROTATE");
    lookPadLabel && (lookPadLabel.textContent = "THRUST");

    if (landingState === "landed") {
      shipVelocity.set(0, 0, 0);
      shipAngularVelocity.set(0, 0, 0);
      updateFlightCamera(delta);
      return;
    }

    if (landingState === "approach") {
      updateLanding(delta);
      updateFlightCamera(delta);
      return;
    }

    const dt = Math.min(delta, 0.05);
    const thrustInput = getThrustInput();
    const rotInput = getRotationInput(dt);

    // --- Angular control ---
    const angAccel = CONFIG.shipAngularAccel * (precisionMode ? 0.45 : 1.0);
    // Map inputs to local angular acceleration
    // yaw (Y), pitch (X), roll (Z)
    shipAngularVelocity.y += -rotInput.yaw * angAccel * dt;   // yaw
    shipAngularVelocity.x +=  rotInput.pitch * angAccel * dt; // pitch
    shipAngularVelocity.z +=  rotInput.roll * angAccel * dt;  // roll

    // Angular damping
    const angDamp = Math.exp(-CONFIG.shipAngularDamp * dt);
    shipAngularVelocity.multiplyScalar(angDamp);

    // Apply angular velocity (local → world)
    const q = ship.quaternion;
    const wx = shipAngularVelocity.x;
    const wy = shipAngularVelocity.y;
    const wz = shipAngularVelocity.z;
    // Simple integration: build a small rotation quaternion
    const angSpeed = shipAngularVelocity.length();
    if (angSpeed > 1e-6) {
      const axis = shipAngularVelocity.clone().normalize();
      const worldAxis = axis.applyQuaternion(q);
      const deltaQ = new THREE.Quaternion().setFromAxisAngle(worldAxis, angSpeed * dt);
      ship.quaternion.premultiply(deltaQ).normalize();
    }

    // --- Linear thrust ---
    const nose  = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion).normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(ship.quaternion).normalize();
    const up    = new THREE.Vector3(0, 1, 0).applyQuaternion(ship.quaternion).normalize();

    const accel = new THREE.Vector3();
    const thrustPower = CONFIG.shipAcceleration * (precisionMode ? 0.4 : 1.0);
    accel.addScaledVector(nose,  thrustInput.forward * thrustPower);
    accel.addScaledVector(right, thrustInput.strafe  * thrustPower * 0.7);
    accel.addScaledVector(up,    thrustInput.vertical * thrustPower * 0.75);

    // Gravity
    const gravity = getGravityAt(ship.position);
    accel.add(gravity);

    // Integrate linear velocity
    shipVelocity.addScaledVector(accel, dt);

    // Linear damping (stronger near atmosphere / surface)
    const nearest = nearestBody(ship.position);
    const inAtmosphere = nearest.altitude < 45;
    const damp = inAtmosphere ? CONFIG.shipLinearDampAtmosphere : CONFIG.shipLinearDamp;
    const linDamp = Math.exp(-damp * dt);
    shipVelocity.multiplyScalar(linDamp);

    // Speed soft cap
    const speed = shipVelocity.length();
    if (speed > CONFIG.shipMaxSpeed) {
      shipVelocity.multiplyScalar(CONFIG.shipMaxSpeed / speed);
    }

    // Flight Assist: kill residual rotation + optional translation assist
    if (flightAssist) {
      // Stronger angular damping when assist is on
      shipAngularVelocity.multiplyScalar(Math.exp(-3.5 * dt));
    }

    // Integrate position
    ship.position.addScaledVector(shipVelocity, dt);

    updateFlightCamera(delta);
    updateAttitudeHud(shipVelocity, up, nose);
  }

  function updateFlightCamera(delta) {
    if (!ship || !camera) return;

    const worldForward = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion).normalize();
    const worldUp = new THREE.Vector3(0, 1, 0).applyQuaternion(ship.quaternion).normalize();

    // Mouse look orbits chase camera
    flightCameraYaw -= lookInputX * 1.2 * delta;
    flightCameraPitch = clamp(flightCameraPitch - lookInputY * 0.9 * delta, -0.55, 0.75);

    if (cameraMode === "first") {
      const worldPosition = ship.localToWorld(new THREE.Vector3(0, 1.8, -2.4));
      const target = worldPosition.clone().addScaledVector(worldForward, 80);
      camera.up.copy(worldUp);
      camera.position.lerp(worldPosition, 1 - Math.pow(0.00006, delta));
      camera.lookAt(target);
      if (cameraButton) cameraButton.textContent = "VIEW: CHASE";
    } else {
      // Stabilized chase with independent orbit
      const back = worldForward.clone().negate().applyAxisAngle(worldUp, flightCameraYaw);
      const desired = ship.position.clone()
        .addScaledVector(back, 32 * Math.cos(flightCameraPitch))
        .addScaledVector(worldUp, 14 + 18 * Math.sin(flightCameraPitch));
      camera.up.copy(worldUp);
      camera.position.lerp(desired, 1 - Math.pow(0.00006, delta));
      lookTarget.copy(ship.position).addScaledVector(worldForward, 8);
      camera.lookAt(lookTarget);
      if (cameraButton) cameraButton.textContent = "VIEW: COCKPIT";
    }
  }

  // ============================================================
  // LANDING ASSIST (kept simple + reliable)
  // ============================================================

  function updateLanding(delta) {
    if (landingState !== "approach" || !landingTarget || !landingNormal || !landingDestination) return false;

    landingMarker.getWorldPosition(landingTarget);
    landingMarker.getWorldQuaternion(landingQuaternion);
    landingNormal.set(0, 1, 0).applyQuaternion(landingQuaternion).normalize();
    landingDestination.copy(landingTarget).addScaledVector(landingNormal, 2.4);

    const distance = ship.position.distanceTo(landingDestination);
    const travelStep = Math.min(1, (22 * delta) / Math.max(distance, 0.001));
    ship.position.lerp(landingDestination, travelStep);
    ship.quaternion.slerp(landingQuaternion, 1 - Math.pow(0.0008, delta));

    shipVelocity.set(0, 0, 0);
    shipAngularVelocity.set(0, 0, 0);

    if (distance < 0.18 && ship.quaternion.angleTo(landingQuaternion) < 0.04) {
      ship.position.copy(landingDestination);
      ship.quaternion.copy(landingQuaternion);
      landingState = "landed";
      if (landingButton) {
        landingButton.textContent = "LANDED ON " + (activeLandingBody === "moon" ? "LUNA" : "HAVEN");
        landingButton.disabled = true;
      }
      if (disembarkButton) disembarkButton.style.display = "block";
      setStatus("TOUCHDOWN CONFIRMED // " + (activeLandingBody === "moon" ? "LUNA" : "HAVEN"));
    }
    return true;
  }

  // ============================================================
  // BUGGY (kept mostly original, small polish)
  // ============================================================

  function updateBuggy(delta) {
    if (!buggyMode || !havenBuggy) return;
    moveLabel && (moveLabel.textContent = "DRIVE");
    lookPadLabel && (lookPadLabel.textContent = "CAMERA");

    const steer = (keys.a ? 1 : 0) - (keys.d ? 1 : 0);
    const throttle = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);

    cameraYaw -= lookInputX * 1.45 * delta;
    cameraPitch = clamp(cameraPitch - lookInputY * 1.0 * delta, -0.18, 0.72);

    buggyHeading += steer * 1.35 * delta * (buggySpeed < 0 ? -1 : 1);
    buggySpeed += (throttle * 13 - buggySpeed) * Math.min(1, (throttle ? 8.5 : 3.2) * delta);

    const upAxis = new THREE.Vector3(0, 1, 0);
    const yawQ = new THREE.Quaternion().setFromAxisAngle(upAxis, buggyHeading);
    const pos = havenBuggy.position.clone();
    const normal = pos.clone().normalize();
    const surfaceQ = new THREE.Quaternion().setFromUnitVectors(upAxis, normal);
    const forwardLocal = new THREE.Vector3(0, 0, -1).applyQuaternion(yawQ).applyQuaternion(surfaceQ);

    const candidate = pos.addScaledVector(forwardLocal, buggySpeed * delta);
    const nextNormal = candidate.clone().normalize();
    const terrain = (activeSurfaceBody === "moon" ? moonTerrainProfile : terrainProfile)(nextNormal.x, nextNormal.y, nextNormal.z);
    const radius = activeSurfaceBody === "moon" ? CONFIG.moonRadius : CONFIG.planetRadius;
    nextNormal.multiplyScalar(radius + (terrain.elevation || 0) + 0.95);
    havenBuggy.position.copy(nextNormal);

    const nextQ = new THREE.Quaternion().setFromUnitVectors(upAxis, nextNormal.clone().normalize());
    havenBuggy.quaternion.copy(nextQ).multiply(yawQ);

    for (const wheel of buggyWheels) {
      if (wheel) wheel.rotation.x -= buggySpeed * delta / 0.57;
    }

    // Camera
    const worldPos = havenBuggy.getWorldPosition(new THREE.Vector3());
    const worldQ = havenBuggy.getWorldQuaternion(new THREE.Quaternion());
    const worldUp = new THREE.Vector3(0, 1, 0).applyQuaternion(worldQ).normalize();
    const worldForward = new THREE.Vector3(0, 0, -1).applyQuaternion(worldQ).normalize();
    camera.up.copy(worldUp);

    if (cameraMode === "first") {
      const eye = worldPos.clone().addScaledVector(worldUp, 2.15).addScaledVector(worldForward, 0.25);
      const viewForward = worldForward.clone().applyAxisAngle(worldUp, cameraYaw);
      viewForward.addScaledVector(worldUp, Math.tan(cameraPitch - 0.32) * 0.65).normalize();
      camera.position.lerp(eye, 1 - Math.pow(0.00008, delta));
      camera.lookAt(eye.clone().addScaledVector(viewForward, 12));
    } else {
      const back = worldForward.clone().negate().applyAxisAngle(worldUp, cameraYaw);
      const desired = worldPos.clone()
        .addScaledVector(back, 8.5 * Math.cos(cameraPitch))
        .addScaledVector(worldUp, 4.5 + 6 * Math.sin(cameraPitch));
      camera.position.lerp(desired, 1 - Math.pow(0.00008, delta));
      camera.lookAt(worldPos.clone().addScaledVector(worldUp, 1.2));
    }
  }

  // ============================================================
  // MODE TRANSITIONS
  // ============================================================

  function boardShip() {
    if (!ship || !playerAvatar) return;
    onFoot = false;
    playerInSpaceFlight = false;
    buggyMode = false;
    stationInteriorMode = false;
    playerAvatar.visible = false;
    ship.visible = true;
    landingState = "idle";
    cameraMode = "third";
    if (disembarkButton) disembarkButton.style.display = "none";
    if (boardShipButton) boardShipButton.style.display = "none";
    if (landingButton) {
      landingButton.style.display = "block";
      landingButton.disabled = false;
      landingButton.textContent = "LANDING ASSIST";
    }
    // Place ship a little above the player
    ship.position.copy(playerAvatar.position).addScaledVector(playerUp || new THREE.Vector3(0,1,0), 6);
    shipVelocity.set(0, 0, 0);
    shipAngularVelocity.set(0, 0, 0);
    setStatus("SHIP BOARDED // READY FOR LAUNCH");
  }

  function disembark() {
    if (!ship || !playerAvatar) return;
    onFoot = true;
    playerInSpaceFlight = false;
    buggyMode = false;
    playerAvatar.visible = true;
    // Place avatar just outside the ship
    const nose = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(ship.quaternion);
    playerAvatar.position.copy(ship.position).addScaledVector(nose, 9).addScaledVector(up, -1.5);
    playerUp.copy(up);
    playerHeading.copy(nose);
    playerGrounded = false;
    playerAirHeight = 2.0;
    // Snap to surface if close
    const surf = sampleSurface(playerAvatar.position);
    if (playerAvatar.position.distanceTo(surf.position) < 12) {
      playerAvatar.position.copy(surf.position);
      playerUp.copy(surf.up);
      playerGrounded = true;
      playerAirHeight = 0;
      activeSurfaceBody = activeLandingBody;
    }
    orientAvatar();
    if (disembarkButton) disembarkButton.style.display = "none";
    if (boardShipButton) boardShipButton.style.display = "block";
    if (landingButton) landingButton.style.display = "none";
    setStatus("DISEMBARKED // ON SURFACE");
  }

  function handleInteract() {
    // Context-sensitive interact
    if (!onFoot && !buggyMode && landingState === "landed") {
      disembark();
      return;
    }
    if (onFoot && !buggyMode) {
      // Check distance to ship
      if (ship && playerAvatar) {
        const d = playerAvatar.position.distanceTo(ship.position);
        if (d < 18) {
          boardShip();
          return;
        }
      }
      // Future: buggy enter, station doors, NPCs...
    }
  }

  function returnHome() {
    if (!ship || !camera) return;
    landingState = "idle";
    stationInteriorMode = false;
    activeSurfaceBody = "haven";
    activeLandingBody = "haven";
    if (havenLandingMarker) landingMarker = havenLandingMarker;
    onFoot = false;
    playerInSpaceFlight = false;
    buggyMode = false;
    if (playerAvatar) playerAvatar.visible = false;
    if (ship) ship.visible = true;
    if (disembarkButton) disembarkButton.style.display = "none";
    if (boardShipButton) boardShipButton.style.display = "none";
    if (landingButton) {
      landingButton.style.display = "block";
      landingButton.disabled = true;
      landingButton.style.opacity = "0.5";
      landingButton.textContent = "LANDING ASSIST";
    }
    ship.position.set(0, 0, -390);
    ship.rotation.set(0, 0, 0);
    ship.quaternion.identity();
    if (shipVelocity) shipVelocity.set(0, 0, 0);
    if (shipAngularVelocity) shipAngularVelocity.set(0, 0, 0);
    camera.up.set(0, 1, 0);
    camera.position.set(0, 17, -345);
    camera.lookAt(0, 0, -435);
    clearKeys();
    setStatus("HOME POSITION RESTORED // HAVEN AHEAD");
  }

  function toggleCameraMode() {
    cameraMode = cameraMode === "third" ? "first" : "third";
    if (cameraButton) {
      if (onFoot || playerInSpaceFlight) {
        cameraButton.textContent = cameraMode === "first" ? "CAMERA: THIRD" : "CAMERA: FIRST";
      } else {
        cameraButton.textContent = cameraMode === "first" ? "VIEW: CHASE" : "VIEW: COCKPIT";
      }
    }
  }

  // ============================================================
  // HUD helpers
  // ============================================================

  function updateAssistLabel() {
    if (assistLabel) {
      assistLabel.textContent = "FLIGHT ASSIST: " + (flightAssist ? "ON" : "OFF");
      assistLabel.style.color = flightAssist ? "#8dffb0" : "#ff9f7a";
    }
  }

  function updateFuelBar() {
    if (!fuelBar) return;
    const pct = clamp(jetpackFuel / CONFIG.jetpackFuelMax, 0, 1);
    fuelBar.style.width = (pct * 100) + "%";
    fuelBar.style.background = pct < 0.2 ? "#ff5c5c" : (pct < 0.45 ? "#ffc14d" : "#5dffa8");
  }

  function updateAttitudeHud(velocity, up, forward) {
    if (!attitudeHud) return;
    const speed = velocity.length();
    const vertical = velocity.dot(up);
    const progradeDot = speed > 0.5 ? velocity.clone().normalize().dot(forward) : 0;
    attitudeHud.innerHTML =
      "SPD " + speed.toFixed(1) +
      "  |  V " + (vertical >= 0 ? "+" : "") + vertical.toFixed(1) +
      "  |  FA " + (flightAssist ? "ON" : "OFF") +
      (onFoot || playerInSpaceFlight ? "  |  FUEL " + Math.round(jetpackFuel) : "");
  }

  // Placeholder for ray gun so the key binding doesn't crash
  function fireRayGun() {
    setStatus("RAY GUN // PRACTICE TARGETS (visual only in this build)");
  }

  // ============================================================
  // UI CONSTRUCTION
  // ============================================================

  function buildUI() {
    root = document.createElement("div");
    root.id = "kepler-reach-root";
    Object.assign(root.style, {
      position: "fixed", inset: "0", width: "100%", height: "100%",
      overflow: "hidden", background: "#11152a", zIndex: "9998",
      fontFamily: "monospace", color: "#e8f4ff"
    });
    document.body.appendChild(root);

    // Status
    statusEl = document.createElement("div");
    Object.assign(statusEl.style, {
      position: "absolute", top: "12px", left: "12px",
      padding: "6px 10px", background: "rgba(8,14,28,0.78)",
      border: "1px solid #3a5a78", borderRadius: "4px",
      font: "12px monospace", zIndex: "90", maxWidth: "420px"
    });
    statusEl.textContent = "KEPLER REACH " + CONFIG.version + " // INITIALIZING";
    root.appendChild(statusEl);

    // Attitude / velocity HUD
    attitudeHud = document.createElement("div");
    Object.assign(attitudeHud.style, {
      position: "absolute", bottom: "18px", left: "50%",
      transform: "translateX(-50%)",
      padding: "5px 12px", background: "rgba(6,12,24,0.75)",
      border: "1px solid #2e4a66", borderRadius: "4px",
      font: "11px monospace", zIndex: "85", letterSpacing: "0.4px"
    });
    attitudeHud.textContent = "SPD 0.0  |  V +0.0  |  FA ON";
    root.appendChild(attitudeHud);

    // Fuel bar (jetpack)
    const fuelWrap = document.createElement("div");
    Object.assign(fuelWrap.style, {
      position: "absolute", bottom: "48px", left: "50%",
      transform: "translateX(-50%)", width: "160px", height: "6px",
      background: "rgba(0,0,0,0.45)", border: "1px solid #3a5a78",
      borderRadius: "3px", zIndex: "85"
    });
    fuelBar = document.createElement("div");
    Object.assign(fuelBar.style, {
      height: "100%", width: "100%", background: "#5dffa8",
      borderRadius: "2px", transition: "width 0.15s linear"
    });
    fuelWrap.appendChild(fuelBar);
    root.appendChild(fuelWrap);

    // Flight assist label
    assistLabel = document.createElement("div");
    Object.assign(assistLabel.style, {
      position: "absolute", top: "12px", right: "12px",
      padding: "5px 9px", background: "rgba(8,14,28,0.78)",
      border: "1px solid #3a5a78", borderRadius: "4px",
      font: "11px monospace", zIndex: "90"
    });
    assistLabel.textContent = "FLIGHT ASSIST: ON";
    assistLabel.style.color = "#8dffb0";
    root.appendChild(assistLabel);

    // Top action buttons
    const topBar = document.createElement("div");
    Object.assign(topBar.style, {
      position: "absolute", top: "44px", left: "50%",
      transform: "translateX(-50%)", display: "flex", gap: "8px",
      zIndex: "88", pointerEvents: "none"
    });

    function makeBtn(label, onClick) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      Object.assign(b.style, {
        pointerEvents: "auto", padding: "7px 12px",
        background: "rgba(12,22,40,0.85)", color: "#d8f0ff",
        border: "1px solid #4a7a9a", borderRadius: "5px",
        font: "bold 11px monospace", cursor: "pointer"
      });
      b.addEventListener("click", onClick);
      topBar.appendChild(b);
      return b;
    }

    homeButton = makeBtn("⌂ HOME / HAVEN", returnHome);
    boardShipButton = makeBtn("BOARD SHIP / LAUNCH", boardShip);
    boardShipButton.style.display = "none";
    disembarkButton = makeBtn("↗ DISEMBARK", disembark);
    disembarkButton.style.display = "none";
    landingButton = makeBtn("LANDING ASSIST", () => {
      if (landingState === "idle" && ship) {
        landingState = "approach";
        setStatus("LANDING ASSIST ENGAGED");
      }
    });
    cameraButton = makeBtn("VIEW: COCKPIT", toggleCameraMode);

    root.appendChild(topBar);

    // Simple mobile / look pad stubs (desktop primarily targeted)
    mobile = document.createElement("div");
    Object.assign(mobile.style, {
      position: "absolute", left: "18px", bottom: "18px",
      width: "110px", height: "110px", borderRadius: "50%",
      background: "rgba(10,18,32,0.55)", border: "1px solid #3a5a78",
      zIndex: "80"
    });
    moveLabel = document.createElement("div");
    moveLabel.textContent = "MOVE";
    Object.assign(moveLabel.style, {
      position: "absolute", top: "6px", left: "0", right: "0",
      textAlign: "center", font: "10px monospace", color: "#9ec8e8",
      pointerEvents: "none"
    });
    mobile.appendChild(moveLabel);
    root.appendChild(mobile);

    lookPad = document.createElement("div");
    Object.assign(lookPad.style, {
      position: "absolute", right: "18px", bottom: "18px",
      width: "120px", height: "120px",
      display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
      gridTemplateRows: "1fr 1fr 1fr", gap: "3px", zIndex: "80"
    });
    lookPadLabel = document.createElement("div");
    lookPadLabel.textContent = "LOOK";
    Object.assign(lookPadLabel.style, {
      position: "absolute", top: "-16px", left: "0", right: "0",
      textAlign: "center", font: "10px monospace", color: "#9ec8e8"
    });
    lookPad.appendChild(lookPadLabel);
    root.appendChild(lookPad);

    // Boost button
    boostButton = document.createElement("button");
    boostButton.textContent = "HOLD BOOST";
    Object.assign(boostButton.style, {
      position: "absolute", right: "18px", bottom: "150px",
      padding: "8px 14px", background: "rgba(12,28,22,0.85)",
      color: "#b8ffd8", border: "1px solid #3a8a6a", borderRadius: "5px",
      font: "bold 11px monospace", zIndex: "80", cursor: "pointer"
    });
    boostButton.addEventListener("pointerdown", () => { boostHeld = true; });
    boostButton.addEventListener("pointerup", () => { boostHeld = false; });
    boostButton.addEventListener("pointerleave", () => { boostHeld = false; });
    root.appendChild(boostButton);

    // Keyboard help
    const help = document.createElement("div");
    Object.assign(help.style, {
      position: "absolute", left: "12px", bottom: "140px",
      padding: "8px 10px", background: "rgba(6,12,22,0.72)",
      border: "1px solid #2a4058", borderRadius: "4px",
      font: "10px monospace", color: "#8ab0c8", zIndex: "70",
      lineHeight: "1.45", maxWidth: "220px"
    });
    help.innerHTML =
      "<b style='color:#c8e8ff'>CONTROLS</b><br>" +
      "WASD move / thrust<br>" +
      "Q/E roll · R/F pitch<br>" +
      "Space up / jump / boost<br>" +
      "Ctrl down · Shift precision<br>" +
      "V camera · F interact<br>" +
      "Tab flight assist · H home";
    root.appendChild(help);
  }

  // ============================================================
  // MINIMAL WORLD (so the control system is immediately playable)
  // Full procedural planet / station content from 0.3.65 can be
  // re-integrated later; this gives a clean testbed for the new
  // controls and physics.
  // ============================================================

  function createMinimalWorld() {
    // Lights
    const ambient = new THREE.AmbientLight(0x6688aa, 0.55);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.15);
    sun.position.set(400, 600, 200);
    scene.add(sun);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(CONFIG.starCount * 3);
    for (let i = 0; i < CONFIG.starCount; i++) {
      const r = 1800 + random() * 2200;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      starPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xcce8ff, size: 1.6, sizeAttenuation: true
    }));
    scene.add(stars);

    // Haven (simple sphere + heightfield function)
    planetWorld = new THREE.Group();
    planetWorld.position.set(...CONFIG.planetPosition);
    scene.add(planetWorld);

    terrainProfile = function (x, y, z) {
      // Simple multi-octave value noise style elevation
      const n = Math.sin(x * 3.1 + y * 2.4) * 0.4 +
                Math.sin(y * 4.7 - z * 3.3) * 0.3 +
                Math.sin(z * 5.2 + x * 1.9) * 0.25 +
                Math.sin((x + y + z) * 8.1) * 0.12;
      return { elevation: n * 4.5 };
    };

    const planetGeo = new THREE.SphereGeometry(CONFIG.planetRadius, 96, 64);
    // Displace vertices for visual interest
    const pos = planetGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
      const len = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
      const nx = vx / len, ny = vy / len, nz = vz / len;
      const elev = terrainProfile(nx, ny, nz).elevation;
      pos.setXYZ(i, nx * (CONFIG.planetRadius + elev), ny * (CONFIG.planetRadius + elev), nz * (CONFIG.planetRadius + elev));
    }
    pos.needsUpdate = true;
    planetGeo.computeVertexNormals();

    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x3a6b4a, roughness: 0.82, metalness: 0.08,
      flatShading: true
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetWorld.add(planetMesh);

    // Atmosphere shell
    const atmos = new THREE.Mesh(
      new THREE.SphereGeometry(CONFIG.planetRadius + 7, 48, 32),
      new THREE.MeshBasicMaterial({
        color: 0x6ec8ff, transparent: true, opacity: 0.07, side: THREE.BackSide
      })
    );
    planetWorld.add(atmos);

    // Moon
    moonOrbit = new THREE.Group();
    scene.add(moonOrbit);
    moonWorld = new THREE.Group();
    moonWorld.position.set(280, 40, -420);
    moonOrbit.add(moonWorld);

    moonTerrainProfile = function (x, y, z) {
      const n = Math.sin(x * 5.2) * 0.35 + Math.sin(y * 6.1 + z * 4.0) * 0.3;
      return { elevation: n * 2.8 };
    };

    const moonGeo = new THREE.SphereGeometry(CONFIG.moonRadius, 64, 48);
    const mpos = moonGeo.attributes.position;
    for (let i = 0; i < mpos.count; i++) {
      const vx = mpos.getX(i), vy = mpos.getY(i), vz = mpos.getZ(i);
      const len = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
      const nx = vx / len, ny = vy / len, nz = vz / len;
      const elev = moonTerrainProfile(nx, ny, nz).elevation;
      mpos.setXYZ(i, nx * (CONFIG.moonRadius + elev), ny * (CONFIG.moonRadius + elev), nz * (CONFIG.moonRadius + elev));
    }
    mpos.needsUpdate = true;
    moonGeo.computeVertexNormals();
    const moonMesh = new THREE.Mesh(moonGeo, new THREE.MeshStandardMaterial({
      color: 0x9a9a9a, roughness: 0.9, metalness: 0.05, flatShading: true
    }));
    moonWorld.add(moonMesh);

    // Simple orbital station (Last Stop stand-in)
    stationRing = new THREE.Group();
    stationRing.position.set(90, 30, -280);
    scene.add(stationRing);
    const ringGeo = new THREE.TorusGeometry(28, 3.2, 10, 48);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x4a6a8a, metalness: 0.45, roughness: 0.4 });
    stationRing.add(new THREE.Mesh(ringGeo, ringMat));
    // Hub
    stationRing.add(new THREE.Mesh(
      new THREE.CylinderGeometry(6, 6, 14, 12),
      new THREE.MeshStandardMaterial({ color: 0x3a4a5a, metalness: 0.5, roughness: 0.35 })
    ));

    // Landing marker on Haven
    const lat = 0.18, lon = 0.35;
    const nrm = new THREE.Vector3(
      Math.cos(lat) * Math.cos(lon),
      Math.sin(lat),
      Math.cos(lat) * Math.sin(lon)
    ).normalize();
    const ground = terrainProfile(nrm.x, nrm.y, nrm.z).elevation;
    landingMarker = new THREE.Group();
    landingMarker.position.copy(nrm).multiplyScalar(CONFIG.planetRadius + ground + 0.9);
    landingMarker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), nrm);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(11, 0.4, 6, 40),
      new THREE.MeshBasicMaterial({ color: 0xffc77d, transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = Math.PI / 2;
    landingMarker.add(ring);
    planetWorld.add(landingMarker);
    havenLandingMarker = landingMarker;
    landingTarget = new THREE.Vector3();
    landingNormal = nrm.clone();
    landingQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), nrm);
    landingDestination = new THREE.Vector3();

    // Ship (simple procedural)
    ship = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 1.6, 9.5),
      new THREE.MeshStandardMaterial({ color: 0x7a8a9a, metalness: 0.55, roughness: 0.3 })
    );
    hull.position.y = 0.3;
    ship.add(hull);
    const cockpit = new THREE.Mesh(
      new THREE.SphereGeometry(1.3, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0x88ccee, metalness: 0.2, roughness: 0.15, transparent: true, opacity: 0.75 })
    );
    cockpit.position.set(0, 1.1, -2.2);
    ship.add(cockpit);
    const engL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.7, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x445566, metalness: 0.6, roughness: 0.25 })
    );
    engL.rotation.x = Math.PI / 2;
    engL.position.set(-1.6, 0.2, 4.2);
    ship.add(engL);
    const engR = engL.clone();
    engR.position.x = 1.6;
    ship.add(engR);
    ship.position.set(0, 0, -390);
    scene.add(ship);

    // Player avatar (simple capsule-ish)
    playerAvatar = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.38, 1.1, 6, 10),
      new THREE.MeshStandardMaterial({ color: 0xc45a3a, roughness: 0.55, metalness: 0.1 })
    );
    body.position.y = 1.05;
    playerAvatar.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xe8d0b0, roughness: 0.6 })
    );
    head.position.y = 1.95;
    playerAvatar.add(head);
    playerAvatar.visible = false;
    scene.add(playerAvatar);

    // Allocate physics vectors
    playerHeading = new THREE.Vector3(0, 0, -1);
    playerUp = new THREE.Vector3(0, 1, 0);
    playerRight = new THREE.Vector3(1, 0, 0);
    playerMove = new THREE.Vector3();
    playerFlightForward = new THREE.Vector3(0, 0, -1);
    playerFlightVelocity = new THREE.Vector3();
    playerCameraTarget = new THREE.Vector3();
    shipVelocity = new THREE.Vector3();
    shipAngularVelocity = new THREE.Vector3();
    desiredCamera = new THREE.Vector3();
    lookTarget = new THREE.Vector3();
    planetCenter = new THREE.Vector3(...CONFIG.planetPosition);

    // Start in ship
    onFoot = false;
    camera.position.set(0, 17, -345);
    camera.lookAt(0, 0, -435);
  }

  // ============================================================
  // MAIN LOOP
  // ============================================================

  function animate(time) {
    if (destroyed) return;
    animationFrame = requestAnimationFrame(animate);
    try {
      const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
      lastTime = time;

      if (buggyMode) {
        updateBuggy(delta);
      } else if (onFoot) {
        updateOnFoot(delta);
      } else {
        updateFlight(delta);
      }

      // Slow station spin
      if (stationRing) stationRing.rotation.y += delta * 0.04;
      if (moonOrbit) moonOrbit.rotation.y += delta * 0.005;

      renderer.render(scene, camera);
    } catch (err) {
      cancelAnimationFrame(animationFrame);
      setStatus("RENDER LOOP ERROR: " + (err && err.message ? err.message : String(err)), true);
      console.error("[Kepler Reach] Render loop stopped:", err);
    }
  }

  // ============================================================
  // INIT
  // ============================================================

  async function loadThree() {
    const sources = [
      "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
      "https://unpkg.com/three@0.160.0/build/three.module.js",
      "https://esm.sh/three@0.160.0"
    ];
    for (let i = 0; i < sources.length; i++) {
      try {
        setStatus("LOADING THREE.JS // SOURCE " + (i + 1));
        const mod = await import(sources[i]);
        if (mod && mod.WebGLRenderer) return mod;
      } catch (e) {
        console.warn("[Kepler Reach] Three source failed", sources[i], e);
      }
    }
    throw new Error("Could not load Three.js");
  }

  async function initialize() {
    buildUI();
    setStatus("LOADING ENGINE...");

    try {
      THREE = await loadThree();
      // Expose CapsuleGeometry if missing (some builds)
      if (!THREE.CapsuleGeometry && THREE.SphereGeometry) {
        // fallback already handled by using CapsuleGeometry from r160
      }

      scene = new THREE.Scene();
      scene.background = new THREE.Color(CONFIG.background);
      camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.15, 8000);
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      root.appendChild(renderer.domElement);

      // Pointer look on the canvas
      let lookPointerId = null;
      let lastLookX = 0, lastLookY = 0;
      renderer.domElement.addEventListener("pointerdown", (e) => {
        if (lookPointerId !== null) return;
        lookPointerId = e.pointerId;
        lastLookX = e.clientX;
        lastLookY = e.clientY;
        renderer.domElement.setPointerCapture(e.pointerId);
      });
      renderer.domElement.addEventListener("pointermove", (e) => {
        if (e.pointerId !== lookPointerId) return;
        const dx = e.clientX - lastLookX;
        const dy = e.clientY - lastLookY;
        lastLookX = e.clientX;
        lastLookY = e.clientY;
        lookInputX = clamp(dx * 0.012, -1.5, 1.5);
        lookInputY = clamp(dy * 0.012, -1.5, 1.5);
      });
      const endLook = (e) => {
        if (e.pointerId === lookPointerId) {
          lookPointerId = null;
          lookInputX = 0;
          lookInputY = 0;
        }
      };
      renderer.domElement.addEventListener("pointerup", endLook);
      renderer.domElement.addEventListener("pointercancel", endLook);

      window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      document.addEventListener("keydown", keyDown);
      document.addEventListener("keyup", keyUp);
      window.addEventListener("blur", clearKeys);
      cleanup.push(() => {
        document.removeEventListener("keydown", keyDown);
        document.removeEventListener("keyup", keyUp);
      });

      createMinimalWorld();
      setStatus("KEPLER REACH " + CONFIG.version + " // READY  —  Tab = Flight Assist, F = Board/Disembark, V = Camera");
      updateAssistLabel();
      updateFuelBar();

      lastTime = performance.now();
      animationFrame = requestAnimationFrame(animate);

    } catch (err) {
      console.error(err);
      setStatus("INIT FAILED: " + (err && err.message ? err.message : String(err)), true);
    }
  }

  // Public API
  window.KeplerReach = {
    version: CONFIG.version,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(animationFrame);
      cleanup.forEach(fn => { try { fn(); } catch (_) {} });
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
      if (root && root.parentNode) root.parentNode.removeChild(root);
      delete window.KeplerReach;
    }
  };

  initialize();
})();
