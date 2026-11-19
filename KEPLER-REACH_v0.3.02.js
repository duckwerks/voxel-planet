
(() => {
  "use strict";

  // ============================================================
  // KEPLER REACH 0.3.02
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
    version: "0.3.02",
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

    <div>PROCEDURAL UNIVERSE // BUILD 0.3.02</div>

    <div id="kr-location">LOCATION: INITIALIZING</div>
    <div id="kr-speed">VELOCITY: 0</div>
    <div id="kr-distance">HAVEN: SCANNING</div>
    <div id="kr-status">LOADING ENGINE</div>
  `;

  root.appendChild(hud);

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

      dummy.position.copy(normal).multiplyScalar(
        CONFIG.planetRadius + height * 0.48
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

    const ocean = new THREE.Color("#274c61");
    const lowland = new THREE.Color("#806e52");
    const mountain = new THREE.Color("#a99a80");
    const highland = new THREE.Color("#d1c6a6");

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

      const noise = terrainNoise(x, y, z);

      const elevation = noise * 9;

      const radius = CONFIG.planetRadius + elevation;

      positions.setXYZ(
        i,
        x * radius,
        y * radius,
        z * radius
      );

      if (noise < -0.15) {
        color.copy(ocean);
      } else if (noise > 0.55) {
        color.copy(highland);
      } else if (noise > 0.18) {
        color.copy(mountain);
      } else {
        color.copy(lowland);
      }

      color.multiplyScalar(
        0.94 + random() * 0.12
      );

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

    group.position.set(0, 0, 100);

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

  function updateFlight(delta) {
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

    const status =
      document.getElementById("kr-status");

    if (!location) return;

    const currentSpeed = Math.sqrt(
      velocity.x * velocity.x +
      velocity.y * velocity.y +
      velocity.z * velocity.z
    );

    speed.textContent =
      "VELOCITY: " + currentSpeed.toFixed(1);

    distanceText.textContent =
      "HAVEN: " + altitude.toFixed(0) + " UNITS";

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
      createPlanet();
      createStation();
      createAsteroidBelt();

      // Generate player ship

      ship = createShip();

      // Initial camera

      camera.position.set(0, 17, 145);

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

        updateFlight(delta);

        if (stationRing) stationRing.rotation.z += delta * 0.11;
        if (asteroidBelt) asteroidBelt.rotation.y += delta * 0.0018;

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
