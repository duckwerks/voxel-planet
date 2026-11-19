
(() => {
  "use strict";

  // ============================================================
  // KEPLER REACH 0.3.05
  // Procedural 3D Universe for CyTube
  //
  // Author: Elwood Edwards
  // Renderer: Three.js r160 / WebGL
  //
  // FEATURES
  // - Procedural starfield
  // - Procedural low-poly planet
  // - Procedural spacecraft
  // - Procedural orbital station
  // - Central star and lighting
  // - Atmospheric planetary shell
  // - Keyboard flight controls
  // - Mobile touch controls
  // - Chase camera
  // - Visible initialization diagnostics
  //
  // NO SERVER REQUIRED
  // NO COMMANDS YET
  // NO MULTIPLAYER YET
  // ============================================================

  if (window.KeplerReach) {
    window.KeplerReach.destroy();
  }

  const CONFIG = {
    version: "0.3.07",
    seed: 847291,
    threeVersion: "0.160.0",

    starCount: 3500,
    settlementCount: 280,
    asteroidCount: 520,

    planetRadius: 110,
    planetPosition: [0, 0, -650],

    acceleration: 65,
    maximumSpeed: 150,

    background: 0x030611
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

  const random = seededRandom(CONFIG.seed);

  // ============================================================
  // APPLICATION STATE
  // ============================================================

  let THREE = null;
  let scene = null;
  let camera = null;
  let renderer = null;

  let ship = null;
  let station = null;
  let planet = null;
  let stationRing = null;
  let asteroidBelt = null;
  let moonOrbit = null;
  let planetWorld = null;
  let landingMarker = null;
  let landingTarget = null;
  let approachLine = null;
  let approachLinePositions = null;
  let navLabel = null;
  let landingButton = null;
  let disembarkButton = null;
  let boardShipButton = null;
  let playerAvatar = null;
  let onFoot = false;
  let playerHeading = null;
  let playerUp = null;
  let playerRight = null;
  let playerMove = null;
  let playerCameraTarget = null;
  let landingState = "idle";
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
    background: "#030611",
    zIndex: "9998",
    fontFamily: "monospace"
  });

  document.body.appendChild(root);

  // ============================================================
  // HUD
  // ============================================================

  const hud = document.createElement("div");

  Object.assign(hud.style, {
    position: "absolute",
    top: "18px",
    left: "20px",
    zIndex: "10",
    color: "#b5cde0",
    fontSize: "12px",
    lineHeight: "1.8",
    pointerEvents: "none",
    textShadow: "0 2px 5px #000"
  });

  hud.innerHTML = `
    <div style="
      color:#e7c58b;
      font-size:18px;
      letter-spacing:3px;
    ">KEPLER REACH</div>

    <div>PROCEDURAL UNIVERSE // BUILD 0.3.07</div>

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
  root.appendChild(homeButton);

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
    landingState = "approach";
    clearKeys();
    velocity.x = velocity.y = velocity.z = 0;
    setStatus("LANDING ASSIST ENGAGED // ALIGNING WITH PAD");
  });
  root.appendChild(landingButton);

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
  root.appendChild(disembarkButton);

  boardShipButton = document.createElement("button");
  boardShipButton.type = "button";
  boardShipButton.textContent = "BOARD SHIP";
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
  root.appendChild(boardShipButton);

  // ============================================================
  // STATUS / ERROR DISPLAY
  // ============================================================

  const statusPanel = document.createElement("div");

  Object.assign(statusPanel.style, {
    position: "absolute",
    bottom: "15px",
    left: "20px",
    zIndex: "20",
    color: "#a9c5d9",
    fontSize: "11px",
    lineHeight: "1.8",
    pointerEvents: "none",
    textShadow: "0 2px 5px #000"
  });

  statusPanel.textContent = "INITIALIZING KEPLER REACH";

  root.appendChild(statusPanel);

  function setStatus(message, error = false) {
    statusPanel.textContent = message;

    statusPanel.style.color =
      error ? "#ff7777" : "#a9c5d9";

    console.log("[Kepler Reach]", message);
  }

  // ============================================================
  // MOBILE CONTROLS
  // ============================================================

  const mobile = document.createElement("div");

  Object.assign(mobile.style, {
    position: "absolute",
    right: "18px",
    bottom: "20px",
    zIndex: "15",
    display: "grid",
    gridTemplateColumns: "repeat(3, 48px)",
    gap: "6px"
  });

  const touchButtons = [
    ["↑", "w", 1, 2],
    ["←", "a", 2, 1],
    ["↓", "s", 2, 2],
    ["→", "d", 2, 3]
  ];

  touchButtons.forEach(([label, key, row, col]) => {
    const button = document.createElement("button");

    button.textContent = label;

    Object.assign(button.style, {
      gridRow: row,
      gridColumn: col,
      width: "48px",
      height: "44px",
      color: "#c5e5ff",
      background: "rgba(15,35,55,.85)",
      border: "1px solid #567c9d",
      borderRadius: "5px",
      fontSize: "19px",
      touchAction: "none"
    });

    button.addEventListener("pointerdown", event => {
      event.preventDefault();

      keys[key] = true;

      button.setPointerCapture(event.pointerId);
    });

    function release() {
      keys[key] = false;
    }

    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);

    mobile.appendChild(button);
  });

  root.appendChild(mobile);

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
      returnHome();
      event.preventDefault();
      return;
    }

    if (
      "wasdqer".includes(key) ||
      key === "arrowup" ||
      key === "arrowdown"
    ) {
      keys[key] = true;
      event.preventDefault();
    }
  }

  function keyUp(event) {
    keys[event.key.toLowerCase()] = false;
  }

  function clearKeys() {
    Object.keys(keys).forEach(key => {
      keys[key] = false;
    });
  }

  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);
  window.addEventListener("blur", clearKeys);

  cleanup.push(() => {
    document.removeEventListener("keydown", keyDown);
    document.removeEventListener("keyup", keyUp);
    window.removeEventListener("blur", clearKeys);
  });

  // ============================================================
  // LOAD THREE.JS
  //
  // IMPORTANT:
  // Use the ES module build, not the old three.min.js file.
  // ============================================================

  async function loadThree() {
    setStatus("LOADING THREE.JS MODULE");

    const module = await import(
      "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"
    );

    if (!module.WebGLRenderer) {
      throw new Error("Three.js module did not initialize.");
    }

    return module;
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
    const palette = [0x8d7658, 0x6f8290, 0xb08b59, 0x526c72, 0x9b9a83];

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
    const detail = terrainNoise(x * 2.8 - 4.2, y * 2.8 + 1.7, z * 2.8 - 2.3);
    const ridgeField = terrainNoise(x * 1.65 + 8.4, y * 1.65 - 5.1, z * 1.65 + 0.8);
    const ridges = Math.pow(Math.max(0, (0.72 - Math.abs(ridgeField)) / 0.72), 2);
    const land = continents > -0.12;
    const elevation = land
      ? 1.5 + continents * 3.2 + detail * 2.1 + ridges * 11.5
      : -3.4 + detail * 0.45;
    return { continents, detail, ridges, land, elevation };
  }

  function createLandingSite(world) {
    const longitude = 0.08;
    const latitude = 0.12;
    const normal = new THREE.Vector3(
      Math.cos(latitude) * Math.cos(longitude),
      Math.sin(latitude),
      Math.cos(latitude) * Math.sin(longitude)
    ).normalize();
    const ground = terrainProfile(normal.x, normal.y, normal.z).elevation;
    const site = new THREE.Group();
    site.position.copy(normal).multiplyScalar(CONFIG.planetRadius + ground + 0.35);
    site.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(8.5, 8.5, 0.65, 12),
      makeMaterial(0x667b82, { metalness: 0.48, roughness: 0.72 })
    );
    site.add(pad);

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

    const ocean = new THREE.Color("#24495d");
    const shelf = new THREE.Color("#52716f");
    const lowland = new THREE.Color("#8a795b");
    const mountain = new THREE.Color("#a99a80");
    const highland = new THREE.Color("#d4c9ad");

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

    world.add(atmosphere);

    createSurfaceSettlements(world);
    createLandingSite(world);

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

  function createShip() {
    setStatus("CONSTRUCTING SPACECRAFT");

    const group = new THREE.Group();

    // Main hull

    const hull = new THREE.Mesh(
      new THREE.ConeGeometry(3.1, 12, 6),
      makeMaterial(0xb6c3ce, {
        metalness: 0.55,
        roughness: 0.4
      })
    );

    hull.rotation.x = -Math.PI / 2;

    group.add(hull);

    // Wings

    const wings = new THREE.Mesh(
      new THREE.BoxGeometry(15, 0.6, 4),
      makeMaterial(0x687f91, {
        metalness: 0.6
      })
    );

    wings.position.z = 1.5;

    group.add(wings);

    // Cockpit

    const cockpit = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 8, 6),
      makeMaterial(0x65b4ce, {
        metalness: 0.7,
        roughness: 0.2
      })
    );

    cockpit.position.set(0, 1.8, -1);

    group.add(cockpit);

    // Engines

    for (const side of [-1, 1]) {
      const engine = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0xff9c50
        })
      );

      engine.position.set(
        side * 3.2,
        0,
        4.5
      );

      group.add(engine);
    }

    // Ship starting location

    group.position.set(0, 0, -390);

    scene.add(group);

    return group;
  }

  // ============================================================
  // PROCEDURAL ORBITAL STATION
  // ============================================================

  function createStation() {
    setStatus("CONSTRUCTING ORBITAL STATION");

    const stationGroup = new THREE.Group();

    // Main station core

    stationGroup.add(
      makeBox(18, 9, 25, 0x788c9d)
    );

    // Central tower

    const tower = makeBox(
      7, 17, 7, 0x9aabb8
    );

    tower.position.y = 11;

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

      dock.position.set(
        Math.cos(angle) * 18,
        0,
        Math.sin(angle) * 18
      );

      dock.rotation.y = -angle;

      stationGroup.add(dock);
    }

    stationGroup.position.set(
      155, 15, -650
    );

    scene.add(stationGroup);

    station = stationGroup;

    return stationGroup;
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
    const material = new THREE.MeshStandardMaterial({
      color: 0x8a8175,
      roughness: 1,
      metalness: 0.08,
      flatShading: true
    });

    asteroidBelt = new THREE.InstancedMesh(
      geometry,
      material,
      CONFIG.asteroidCount
    );

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < CONFIG.asteroidCount; i++) {
      const angle = random() * Math.PI * 2;
      const radius = 205 + (random() - 0.5) * 48;
      const vertical = (random() - 0.5) * 34;
      const size = 1.2 + random() * 5.5;

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
      dummy.scale.set(
        size * (0.7 + random() * 0.7),
        size * (0.55 + random() * 0.8),
        size * (0.7 + random() * 0.7)
      );
      dummy.updateMatrix();
      asteroidBelt.setMatrixAt(i, dummy.matrix);

      color.setHSL(
        0.08 + random() * 0.07,
        0.12 + random() * 0.12,
        0.31 + random() * 0.22
      );
      asteroidBelt.setColorAt(i, color);
    }

    asteroidBelt.instanceMatrix.needsUpdate = true;
    if (asteroidBelt.instanceColor) asteroidBelt.instanceColor.needsUpdate = true;

    asteroidBelt.position.copy(planetCenter);
    scene.add(asteroidBelt);
  }

  // ============================================================
  // HAVEN MOON
  // ============================================================

  function createMoon() {
    const orbit = new THREE.Group();
    orbit.position.copy(planetCenter);

    const geometry = new THREE.SphereGeometry(19, 32, 24);
    const positions = geometry.attributes.position;
    const colors = [];
    const base = new THREE.Color("#8c8b83");
    const dark = new THREE.Color("#555a60");
    const color = new THREE.Color();

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) / 19;
      const y = positions.getY(i) / 19;
      const z = positions.getZ(i) / 19;
      const n = terrainNoise(x * 1.8 + 4, y * 1.8 - 2, z * 1.8 + 7);
      const craterBand = Math.sin(x * 31 + y * 17 + z * 23);
      const shade = Math.max(0.58, Math.min(1.08, 0.86 + n * 0.17 + craterBand * 0.035));
      color.copy(n < -0.25 ? dark : base).multiplyScalar(shade);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const moon = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 1,
        flatShading: true
      })
    );

    moon.position.set(345, 12, 0);
    orbit.add(moon);

    const orbitLine = new THREE.Mesh(
      new THREE.TorusGeometry(345, 0.22, 4, 160),
      new THREE.MeshBasicMaterial({
        color: 0x526b7b,
        transparent: true,
        opacity: 0.22
      })
    );

    orbitLine.rotation.x = Math.PI / 2;
    orbit.add(orbitLine);

    scene.add(orbit);
    moonOrbit = orbit;
  }

  // ============================================================
  // CENTRAL STAR
  // ============================================================

  function createSun() {
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(32, 24, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffd99a,
        flatShading: true
      })
    );

    sun.position.set(-500, 180, -1350);

    scene.add(sun);

    const light = new THREE.PointLight(
      0xffd6a0,
      1800,
      1800
    );

    light.position.copy(sun.position);

    scene.add(light);

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
  let lookTarget = null;
  let planetCenter = null;

  function returnHome() {
    if (!ship || !camera || !planetCenter) return;
    landingState = "idle";
    onFoot = false;
    if (playerAvatar) playerAvatar.visible = false;
    if (ship) ship.visible = true;
    if (disembarkButton) disembarkButton.style.display = "none";
    if (boardShipButton) boardShipButton.style.display = "none";
    if (landingButton) landingButton.style.display = "block";
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
    const local = planetWorld.worldToLocal(worldPosition.clone());
    const normalLocal = local.clone().normalize();
    const terrain = terrainProfile(normalLocal.x, normalLocal.y, normalLocal.z);
    const surfaceLocal = normalLocal.clone().multiplyScalar(
      CONFIG.planetRadius + terrain.elevation + 0.85
    );
    const surfaceWorld = planetWorld.localToWorld(surfaceLocal);
    const worldOrigin = planetWorld.localToWorld(new THREE.Vector3(0, 0, 0));
    const upWorld = surfaceWorld.clone().sub(worldOrigin).normalize();
    return { position: surfaceWorld, up: upWorld, terrain };
  }

  function createOnFootAvatar() {
    playerAvatar = new THREE.Group();

    const suit = makeMaterial(0xc0b69a, { roughness: 0.92, metalness: 0.08 });
    const dark = makeMaterial(0x394a50, { roughness: 0.9 });
    const visor = new THREE.MeshStandardMaterial({
      color: 0x75b8c7, metalness: 0.55, roughness: 0.22,
      emissive: 0x163943, emissiveIntensity: 0.25
    });

    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 1.15, 0.52), suit
    );
    torso.position.y = 1.25;
    playerAvatar.add(torso);

    const chest = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.34, 0.08), dark
    );
    chest.position.set(0, 1.35, -0.29);
    playerAvatar.add(chest);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 10, 8), suit
    );
    head.position.y = 2.12;
    playerAvatar.add(head);

    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.31, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62),
      visor
    );
    helmet.position.set(0, 2.14, -0.13);
    helmet.scale.set(1, 0.9, 0.78);
    playerAvatar.add(helmet);

    const backpack = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.86, 0.32), dark
    );
    backpack.position.set(0, 1.3, 0.39);
    playerAvatar.add(backpack);

    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.72, 0.34), dark
      );
      leg.position.set(side * 0.25, 0.38, 0.02);
      playerAvatar.add(leg);

      const boot = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.2, 0.48), suit
      );
      boot.position.set(side * 0.25, 0.1, -0.06);
      playerAvatar.add(boot);

      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.86, 0.28), suit
      );
      arm.position.set(side * 0.62, 1.28, -0.02);
      playerAvatar.add(arm);
    }

    playerAvatar.visible = false;
    scene.add(playerAvatar);

    playerHeading = new THREE.Vector3(0, 0, -1);
    playerUp = new THREE.Vector3(0, 1, 0);
    playerRight = new THREE.Vector3(1, 0, 0);
    playerMove = new THREE.Vector3();
    playerCameraTarget = new THREE.Vector3();
  }

  function orientAvatar() {
    playerRight.crossVectors(playerHeading, playerUp).normalize();
    const back = playerHeading.clone().negate();
    const basis = new THREE.Matrix4().makeBasis(
      playerRight, playerUp, back
    );
    playerAvatar.quaternion.setFromRotationMatrix(basis);
  }

  function disembark() {
    if (landingState !== "landed" || onFoot || !playerAvatar || !ship) return;

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

    playerAvatar.position.copy(surface.position);
    playerUp.copy(surface.up);

    // Face away from the ship, projected onto the local tangent plane.
    playerHeading.copy(padRight).addScaledVector(playerUp, -padRight.dot(playerUp)).normalize();
    orientAvatar();

    onFoot = true;
    playerAvatar.visible = true;
    ship.visible = false;
    clearKeys();

    if (disembarkButton) disembarkButton.style.display = "none";
    if (boardShipButton) boardShipButton.style.display = "block";
    if (landingButton) landingButton.style.display = "none";
    if (navLabel) navLabel.style.display = "none";
    if (approachLine) approachLine.visible = false;

    setStatus("ON FOOT // HAVEN SURFACE EXPLORATION");
  }

  function boardShip() {
    if (!onFoot || !playerAvatar || !ship) return;

    const padWorld = landingMarker.getWorldPosition(new THREE.Vector3());
    const padUp = new THREE.Vector3(0, 1, 0)
      .applyQuaternion(landingMarker.getWorldQuaternion(new THREE.Quaternion()))
      .normalize();

    const distance = playerAvatar.position.distanceTo(padWorld);
    if (distance > 24) {
      setStatus("SHIP OUT OF REACH // RETURN TO THE LANDING PAD");
      return;
    }

    ship.visible = true;
    playerAvatar.visible = false;
    onFoot = false;
    ship.position.copy(landingDestination);
    ship.quaternion.copy(landingQuaternion);
    clearKeys();

    if (boardShipButton) boardShipButton.style.display = "none";
    if (disembarkButton) disembarkButton.style.display = "block";
    if (landingButton) landingButton.style.display = "block";
    if (approachLine) approachLine.visible = true;

    camera.up.set(0, 1, 0);
    camera.position.copy(ship.position).addScaledVector(padUp, 12);
    lookTarget.copy(ship.position).addScaledVector(padUp, 4);
    camera.lookAt(lookTarget);
    setStatus("BACK ABOARD // HAVEN LANDING PAD");
  }

  function updateOnFoot(delta) {
    if (!onFoot || !playerAvatar) return;

    const turn = (keys.a ? 1 : 0) - (keys.d ? 1 : 0);
    const walk = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);

    if (turn) {
      playerHeading.applyAxisAngle(playerUp, turn * 1.9 * delta);
      playerHeading.addScaledVector(playerUp, -playerHeading.dot(playerUp)).normalize();
    }

    if (walk) {
      playerMove.copy(playerHeading).multiplyScalar(walk * 5.2 * delta);
      playerAvatar.position.add(playerMove);
      const surface = sampleSurface(playerAvatar.position);
      playerAvatar.position.copy(surface.position);
      playerUp.copy(surface.up);
      playerHeading.addScaledVector(playerUp, -playerHeading.dot(playerUp)).normalize();
    } else {
      const surface = sampleSurface(playerAvatar.position);
      playerAvatar.position.copy(surface.position);
      playerUp.copy(surface.up);
      playerHeading.addScaledVector(playerUp, -playerHeading.dot(playerUp)).normalize();
    }

    orientAvatar();

    const desired = playerAvatar.position.clone()
      .addScaledVector(playerUp, 5.2)
      .addScaledVector(playerHeading, -9.5);
    camera.position.lerp(desired, 1 - Math.pow(0.0008, delta));

    playerCameraTarget.copy(playerAvatar.position)
      .addScaledVector(playerUp, 1.25)
      .addScaledVector(playerHeading, 2.4);
    camera.up.copy(playerUp);
    camera.lookAt(playerCameraTarget);

    const footPhase = document.getElementById("kr-phase");
    const footLocation = document.getElementById("kr-location");
    const footSpeed = document.getElementById("kr-speed");
    if (footPhase) footPhase.textContent = "MODE: ON FOOT // HAVEN";
    if (footLocation) footLocation.textContent = "LOCATION: HAVEN SURFACE";
    if (footSpeed) footSpeed.textContent = "MOVEMENT: " + (walk ? "WALKING" : "STANDING");
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
        landingButton.textContent = "LANDED ON HAVEN";
        landingButton.disabled = true;
        landingButton.style.opacity = "1";
      }
      if (disembarkButton) disembarkButton.style.display = "block";
      setStatus("TOUCHDOWN CONFIRMED // HAVEN LANDING PAD");
    }
    return true;
  }

  function updateFlight(delta) {
    if (landingState === "landed") {
      velocity.x = velocity.y = velocity.z = 0;
      cameraOffset.set(0, 12, 25).applyQuaternion(ship.quaternion);
      desiredCamera.copy(ship.position).add(cameraOffset);
      camera.position.lerp(desiredCamera, 1 - Math.pow(0.001, delta));
      lookTarget.copy(ship.position).addScaledVector(landingNormal, 5);
      camera.lookAt(lookTarget);
      return;
    }

    if (landingState === "approach") {
      updateLanding(delta);
    } else {
    if (keys.a) {
      ship.rotation.y += delta * 0.8;
    }

    if (keys.d) {
      ship.rotation.y -= delta * 0.8;
    }

    if (keys.arrowup) {
      ship.rotation.x += delta * 0.6;
    }

    if (keys.arrowdown) {
      ship.rotation.x -= delta * 0.6;
    }

    if (keys.q) {
      ship.rotation.z += delta * 0.7;
    }

    if (keys.e) {
      ship.rotation.z -= delta * 0.7;
    }

    ship.getWorldDirection(forward);

    if (keys.w) {
      velocity.x +=
        forward.x * CONFIG.acceleration * delta;

      velocity.y +=
        forward.y * CONFIG.acceleration * delta;

      velocity.z +=
        forward.z * CONFIG.acceleration * delta;
    }

    if (keys.s) {
      velocity.x -=
        forward.x * CONFIG.acceleration * delta;

      velocity.y -=
        forward.y * CONFIG.acceleration * delta;

      velocity.z -=
        forward.z * CONFIG.acceleration * delta;
    }

    // Space friction

    const friction = Math.pow(
      0.985,
      delta * 60
    );

    velocity.x *= friction;
    velocity.y *= friction;
    velocity.z *= friction;

    const speed = Math.sqrt(
      velocity.x * velocity.x +
      velocity.y * velocity.y +
      velocity.z * velocity.z
    );

    if (speed > CONFIG.maximumSpeed) {
      const scale = CONFIG.maximumSpeed / speed;

      velocity.x *= scale;
      velocity.y *= scale;
      velocity.z *= scale;
    }

    ship.position.x += velocity.x * delta;
    ship.position.y += velocity.y * delta;
    ship.position.z += velocity.z * delta;
    }

    // Chase camera

    cameraOffset.set(0, 17, 43);

    cameraOffset.applyQuaternion(
      ship.quaternion
    );

    desiredCamera.copy(ship.position)
      .add(cameraOffset);

    camera.position.lerp(
      desiredCamera,
      1 - Math.pow(0.001, delta)
    );

    lookTarget.copy(ship.position)
      .addScaledVector(forward, 45);

    camera.lookAt(lookTarget);
  }

  // ============================================================
  // HAVEN APPROACH NAVIGATION
  // The marker is attached to Haven, so it follows the planet's
  // slow rotation. The guidance line is updated in world space.
  // ============================================================

  function createNavigationSystem() {
    const longitude = 0.08;
    const latitude = 0.12;
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
    if (inFront) {
      const margin = 34;
      const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
      navLabel.style.display = "block";
      navLabel.style.left = Math.max(margin, Math.min(window.innerWidth - margin, x)) + "px";
      navLabel.style.top = Math.max(margin, Math.min(window.innerHeight - margin, y - 24)) + "px";
      navLabel.textContent = "▼ HAVEN LANDING SITE";
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
        landingButton.textContent = "LANDED ON HAVEN";
      } else {
        landingButton.textContent = ready ? "INITIATE LANDING" : "LANDING ASSIST";
      }
    }
    const targetText = document.getElementById("kr-target");
    const phaseText = document.getElementById("kr-phase");
    const altitude = ship.position.distanceTo(planetCenter) - CONFIG.planetRadius;

    if (targetText) {
      targetText.textContent = "LANDING SITE: " + targetDistance.toFixed(0) + " UNITS";
    }

    let phase = "DEEP SPACE";
    if (altitude < 250) phase = "HAVEN ORBIT";
    if (targetDistance < 180) phase = "APPROACH CORRIDOR";
    if (targetDistance < 55) phase = "LANDING RANGE";
    if (landingState === "approach") phase = "AUTOMATED DESCENT";
    if (landingState === "landed") phase = "LANDED // PAD SECURE";
    if (onFoot) phase = "ON FOOT // HAVEN";

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

  function updateHUD() {
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
      location.textContent = "LOCATION: HAVEN SURFACE";
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
        "LOCATION: HAVEN APPROACH";

      status.textContent =
        "DESTINATION IN RANGE";

    } else if (altitude < 250) {
      location.textContent =
        "LOCATION: HAVEN ORBIT";

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

      // Allocate Three.js objects after THREE is available.
      forward = new THREE.Vector3();
      cameraOffset = new THREE.Vector3();
      desiredCamera = new THREE.Vector3();
      lookTarget = new THREE.Vector3();
      planetCenter = new THREE.Vector3(...CONFIG.planetPosition);

      setStatus("INITIALIZING WEBGL");

      // Scene

      scene = new THREE.Scene();

      scene.background = new THREE.Color(
        CONFIG.background
      );

      scene.fog = new THREE.FogExp2(
        CONFIG.background,
        0.000035
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

      renderer.toneMappingExposure = 1.1;

      renderer.domElement.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;display:block;z-index:1";

      root.insertBefore(
        renderer.domElement,
        hud
      );

      // Lighting

      scene.add(
        new THREE.AmbientLight(
          0x8296bb,
          1.1
        )
      );

      // Generate universe

      createStarfield();
      createSun();
      planetWorld = createPlanet();
      createNavigationSystem();
      createMoon();
      createStation();
      createAsteroidBelt();

      // Generate player ship

      ship = createShip();
      createOnFootAvatar();

      // Initial camera

      camera.position.set(0, 17, -345);

      camera.lookAt(ship.position);

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

        animationFrame =
          requestAnimationFrame(animate);

        const delta = lastTime
          ? Math.min(
              (time - lastTime) / 1000,
              0.05
            )
          : 0;

        lastTime = time;

        if (onFoot) updateOnFoot(delta);
        else updateFlight(delta);
        updateNavigation();

        if (stationRing) stationRing.rotation.z += delta * 0.11;
        if (asteroidBelt) asteroidBelt.rotation.y += delta * 0.0018;
        if (moonOrbit) moonOrbit.rotation.y += delta * 0.006;
        if (planetWorld) planetWorld.rotation.y += delta * 0.00035;

        updateHUD();

        renderer.render(scene, camera);
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
  // PUBLIC API
  // ============================================================

  window.KeplerReach = {
    version: CONFIG.version,
    seed: CONFIG.seed,

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
