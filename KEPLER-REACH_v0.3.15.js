
(() => {
  "use strict";

  // ============================================================
  // KEPLER REACH 0.3.15
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
  // - Collision-aware follow camera and first-person view
  // - Analog movement joystick and camera D-pad
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
    version: "0.3.15",
    seed: 847291,
    threeVersion: "0.160.0",

    starCount: 3500,
    settlementCount: 280,
    asteroidCount: 520,

    planetRadius: 110,
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
  let havenBuggy = null, buggyMode = false, buggyInteractButton = null;
  let buggySpeed = 0, buggyHeading = 0;
  let habitatGate = null, habitatGateButton = null, habitatGateOpen = false;
  let faunaReleased = false, faunaReleaseTime = 0;
  const habitatGateLeaves = [];
  const avatarWalkParts = { arms: [], legs: [], torso: null };
  let avatarIsWalking = false;
  const buggyWheels = [];
  const surfaceCollisionZones = [];
  const ambientFauna = [];
  let onFoot = false;
  let playerHeading = null;
  let playerUp = null;
  let playerRight = null;
  let playerMove = null;
  let playerCameraTarget = null;
  let cameraRaycaster = null;
  let cameraYaw = 0;
  let cameraPitch = 0.32;
  let cameraMode = "third";
  let lookInputX = 0, lookInputY = 0;
  let cameraButton = null;
  let lookPad = null;
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
    background: "#11152a",
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

    <div>PROCEDURAL UNIVERSE // BUILD 0.3.14</div>

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
  buggyInteractButton = document.createElement("button");
  buggyInteractButton.type = "button";
  buggyInteractButton.textContent = "ENTER MOON BUGGY";
  Object.assign(buggyInteractButton.style, { position:"absolute", top:"150px", right:"18px", zIndex:"25", minWidth:"154px", padding:"11px 15px", color:"#f3dfad", background:"rgba(35,48,39,.94)", border:"1px solid #9ebd83", borderRadius:"5px", font:"bold 11px monospace", letterSpacing:"1px", cursor:"pointer", touchAction:"manipulation", display:"none" });
  buggyInteractButton.addEventListener("click", toggleBuggy);
  root.appendChild(buggyInteractButton);
  habitatGateButton = document.createElement("button");
  habitatGateButton.type = "button";
  habitatGateButton.textContent = "OPEN WILDLIFE GATES";
  Object.assign(habitatGateButton.style, {position:"absolute",top:"196px",right:"18px",zIndex:"25",minWidth:"174px",padding:"11px 14px",color:"#f5e9c9",background:"rgba(38,62,48,.94)",border:"1px solid #9acb91",borderRadius:"5px",font:"bold 11px monospace",letterSpacing:"1px",cursor:"pointer",touchAction:"manipulation",display:"none"});
  habitatGateButton.addEventListener("click", openWildlifeHabitat);
  root.appendChild(habitatGateButton);

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
    statusPanel.style.color = error ? "#ff7777" : "#a9c5d9";
    const hudStatus = document.getElementById("kr-status");
    if (hudStatus) hudStatus.textContent = message;
    console[error ? "error" : "log"]("[Kepler Reach]", message);
  }

  // ============================================================
  // MOBILE CONTROLS — ANALOG MOVEMENT + CAMERA D-PAD
  // ============================================================

  const mobile = document.createElement("div");
  Object.assign(mobile.style, {
    position:"absolute",left:"18px",bottom:"22px",zIndex:"16",
    width:"132px",height:"132px",borderRadius:"50%",
    border:"2px solid rgba(151,205,222,.68)",
    background:"radial-gradient(circle,rgba(42,77,91,.58),rgba(9,22,34,.72))",
    boxShadow:"0 2px 14px rgba(0,0,0,.38)",touchAction:"none",
    display:"block",userSelect:"none"
  });
  const moveKnob=document.createElement("div");
  Object.assign(moveKnob.style,{
    position:"absolute",left:"40px",top:"40px",width:"48px",height:"48px",
    borderRadius:"50%",border:"2px solid rgba(221,241,232,.88)",
    background:"rgba(101,155,160,.72)",boxShadow:"0 2px 8px rgba(0,0,0,.4)",
    pointerEvents:"none"
  });
  mobile.appendChild(moveKnob);root.appendChild(mobile);
  let movePointerId=null;
  function releaseMoveStick(){movePointerId=null;moveKnob.style.transform="translate(0px,0px)";keys.w=keys.a=keys.s=keys.d=false;}
  function updateMoveStick(event){
    if(movePointerId!==event.pointerId)return;
    const r=mobile.getBoundingClientRect(),dx=event.clientX-(r.left+r.width/2),dy=event.clientY-(r.top+r.height/2);
    const d=Math.hypot(dx,dy),scale=d>43?43/d:1,x=dx*scale,y=dy*scale;
    moveKnob.style.transform=`translate(${x}px,${y}px)`;
    keys.w=y < -10;keys.s=y > 10;keys.a=x < -10;keys.d=x > 10;
  }
  mobile.addEventListener("pointerdown",e=>{if(movePointerId!==null)return;e.preventDefault();movePointerId=e.pointerId;if(mobile.setPointerCapture)mobile.setPointerCapture(e.pointerId);updateMoveStick(e);});
  mobile.addEventListener("pointermove",updateMoveStick);
  mobile.addEventListener("pointerup",e=>{if(e.pointerId===movePointerId)releaseMoveStick();});
  mobile.addEventListener("pointercancel",releaseMoveStick);
  mobile.addEventListener("lostpointercapture",releaseMoveStick);

  lookPad=document.createElement("div");
  Object.assign(lookPad.style,{
    position:"absolute",right:"18px",bottom:"22px",zIndex:"16",
    width:"132px",height:"132px",display:"none",
    gridTemplateColumns:"repeat(3,40px)",gridTemplateRows:"repeat(3,40px)",
    gap:"4px",justifyContent:"center",alignContent:"center",
    touchAction:"none",userSelect:"none"
  });
  const lookButtons=[{label:"▲",x:0,y:-1,r:1,c:2},{label:"◀",x:-1,y:0,r:2,c:1},{label:"▼",x:0,y:1,r:3,c:2},{label:"▶",x:1,y:0,r:2,c:3}];
  for(const item of lookButtons){
    const b=document.createElement("button");b.type="button";b.textContent=item.label;
    Object.assign(b.style,{gridRow:item.r,gridColumn:item.c,width:"40px",height:"40px",color:"#d9edf1",background:"rgba(15,35,55,.84)",border:"1px solid #6c9aa7",borderRadius:"8px",font:"bold 18px monospace",touchAction:"none",padding:"0"});
    const press=e=>{e.preventDefault();lookInputX=item.x;lookInputY=item.y;};
    const release=e=>{if(e.cancelable)e.preventDefault();if(lookInputX===item.x&&lookInputY===item.y){lookInputX=lookInputY=0;}};
    b.addEventListener("pointerdown",press);b.addEventListener("pointerup",release);b.addEventListener("pointercancel",release);b.addEventListener("lostpointercapture",release);
    lookPad.appendChild(b);
  }
  const recenterButton=document.createElement("button");recenterButton.type="button";recenterButton.textContent="◎";
  Object.assign(recenterButton.style,{gridRow:"2",gridColumn:"2",width:"40px",height:"40px",color:"#ffe4ad",background:"rgba(74,75,52,.94)",border:"1px solid #c5ae72",borderRadius:"50%",font:"bold 20px monospace",padding:"0",touchAction:"none"});
  recenterButton.addEventListener("click",recenterCamera);lookPad.appendChild(recenterButton);root.appendChild(lookPad);

  cameraButton=document.createElement("button");cameraButton.type="button";cameraButton.textContent="VIEW: THIRD PERSON";
  Object.assign(cameraButton.style,{position:"absolute",top:"242px",right:"18px",zIndex:"26",minWidth:"154px",padding:"10px 12px",display:"none",color:"#d8eee9",background:"rgba(20,35,39,.94)",border:"1px solid #75a69a",borderRadius:"5px",font:"bold 10px monospace",letterSpacing:"1px",touchAction:"manipulation"});
  cameraButton.addEventListener("click",toggleCameraMode);root.appendChild(cameraButton);

  function recenterCamera(){cameraYaw=0;cameraPitch=0.32;lookInputX=lookInputY=0;}
  function toggleCameraMode(){
    if(!onFoot||buggyMode)return;
    cameraMode=cameraMode==="third"?"first":"third";
    if(playerAvatar)playerAvatar.visible=cameraMode==="third";
    cameraButton.textContent=cameraMode==="first"?"VIEW: FIRST PERSON":"VIEW: THIRD PERSON";
    setStatus(cameraMode==="first"?"FIRST-PERSON EXPLORATION":"DRONE FOLLOW CAMERA");
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
    if (key === "g") { openWildlifeHabitat(); event.preventDefault(); return; }
    if (key === "v" && onFoot && !buggyMode) { toggleCameraMode(); event.preventDefault(); return; }

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
  window.addEventListener("blur", releaseMoveStick);

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
      return place(mesh, x, z, y, yaw);
    }
    function cylinder(radiusTop, radiusBottom, height, material, x, z, y, sides = 8) {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radiusTop, radiusBottom, height, sides),
        material
      );
      return place(mesh, x, z, y, 0);
    }

    // A broad pedestrian promenade leaves the landing pad and leads
    // through the settlement gate toward the outdoor cinema.
    for (let i = 0; i < 12; i++) {
      const x = 12 + i * 5.5;
      box(5.3, 0.42, 7.2, mat.path, x, 0, 0.35);
      box(5.3, 0.16, 0.34, mat.pathEdge, x, -3.75, 0.43);
      box(5.3, 0.16, 0.34, mat.pathEdge, x, 3.75, 0.43);
    }

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

    // Three recognizable modular buildings around a small plaza.
    const buildingSpecs = [
      { x: 43, z: -18, w: 13, h: 7, d: 11, body: mat.coral, roof: mat.cream },
      { x: 48, z: 18, w: 15, h: 8, d: 12, body: mat.turquoise, roof: mat.lilac },
      { x: 68, z: 4, w: 12, h: 6, d: 10, body: mat.lilac, roof: mat.cream }
    ];
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
      surfaceCollisionZones.push({ center: surfaceFrame(b.x, b.z).position.clone(), radius: Math.max(b.w, b.d) * 0.56 + 1.6 });
    }

    // Central plaza: a circular gathering court with a tiered fountain.
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 0.48, 20), mat.path);
    place(plaza, 72, -13, 0.28);
    const plazaRing = new THREE.Mesh(new THREE.TorusGeometry(9.6, 0.22, 5, 32), mat.neonPink);
    place(plazaRing, 72, -13, 0.65);
    cylinder(2.4, 3.0, 1.2, mat.turquoise, 72, -13, 1.0, 10);
    cylinder(1.25, 1.7, 0.9, mat.cream, 72, -13, 2.0, 10);
    const fountainOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), mat.neonMint);
    place(fountainOrb, 72, -13, 3.05);
    const fountainLight = new THREE.PointLight(0x65f2d0, 1.2, 19);
    fountainLight.position.copy(surfaceFrame(72, -13, 3.5).position);
    district.add(fountainLight);

    // Raised planter beds and compact garden sculptures.
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI * 2 / 8;
      const x = 72 + Math.cos(angle) * 16;
      const z = -13 + Math.sin(angle) * 16;
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
    surfaceCollisionZones.push({ center: surfaceFrame(94, -29).position.clone(), radius: 7.5 });

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
    const buggyBody = makeMaterial(0xe2b96f, { roughness:0.78, metalness:0.18 });
    const buggyTrim = makeMaterial(0x40565a, { roughness:0.72, metalness:0.28 });
    const buggyGlass = new THREE.MeshStandardMaterial({ color:0x80c9cf, emissive:0x17464c, emissiveIntensity:0.22, metalness:0.45, roughness:0.2, transparent:true, opacity:0.82 });
    const buggyLamp = new THREE.MeshBasicMaterial({ color:0xffe4a0 });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.65,0.55,3.9),buggyBody); chassis.position.y=1.15; buggy.add(chassis);
    const under = new THREE.Mesh(new THREE.BoxGeometry(2.15,0.42,3.1),buggyTrim); under.position.y=0.78; buggy.add(under);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9,1.12,1.8),buggyTrim); cabin.position.set(0,1.92,0.38); buggy.add(cabin);
    const windscreen = new THREE.Mesh(new THREE.BoxGeometry(1.62,0.72,0.09),buggyGlass); windscreen.position.set(0,2,-0.55); windscreen.rotation.x=-0.16; buggy.add(windscreen);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.12,0.18,2),buggyBody); roof.position.set(0,2.55,0.38); buggy.add(roof);
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
    district.add(buggy); surfaceCollisionZones.push({center:roverFrame.position.clone(),radius:3});
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
    createHavenSettlement(world);

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
    cameraMode="third";recenterCamera();if(cameraButton)cameraButton.style.display="none";if(lookPad)lookPad.style.display="none";
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
      CONFIG.planetRadius + terrain.elevation + 0.835
    );
    const surfaceWorld = planetWorld.localToWorld(surfaceLocal);
    const worldOrigin = planetWorld.localToWorld(new THREE.Vector3(0, 0, 0));
    const upWorld = surfaceWorld.clone().sub(worldOrigin).normalize();
    return { position: surfaceWorld, up: upWorld, terrain };
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
    for(const side of [-1,1]){
      const tank=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.18,0.68,7),accent);tank.position.set(side*0.3,1.42,0.57);playerAvatar.add(tank);
      const shoulder=new THREE.Mesh(new THREE.SphereGeometry(0.29,8,6),suitLight);shoulder.position.set(side*0.62,1.78,0);playerAvatar.add(shoulder);
      const arm=new THREE.Group();arm.position.set(side*0.62,1.73,0);
      const upper=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.19,0.58,7),suit);upper.position.y=-0.34;arm.add(upper);
      const cuff=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.16,7),accent);cuff.position.y=-0.65;arm.add(cuff);
      const glove=new THREE.Mesh(new THREE.SphereGeometry(0.19,8,6),dark);glove.position.set(0,-0.79,-0.02);arm.add(glove);
      playerAvatar.add(arm);avatarWalkParts.arms.push({pivot:arm,side});
      const leg=new THREE.Group();leg.position.set(side*0.25,0.72,0.02);
      const thigh=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.2,0.62,7),dark);thigh.position.y=-0.32;leg.add(thigh);
      const knee=new THREE.Mesh(new THREE.SphereGeometry(0.2,7,5),suitLight);knee.position.y=-0.58;leg.add(knee);
      const boot=new THREE.Mesh(new THREE.BoxGeometry(0.38,0.22,0.5),suit);boot.position.set(0,-0.68,-0.08);leg.add(boot);
      const sole=new THREE.Mesh(new THREE.BoxGeometry(0.39,0.07,0.5),accent);sole.position.set(0,-0.8,-0.08);leg.add(sole);
      playerAvatar.add(leg);avatarWalkParts.legs.push({pivot:leg,side});
    }
    playerAvatar.visible=false;scene.add(playerAvatar);
    playerHeading=new THREE.Vector3(0,0,-1);playerUp=new THREE.Vector3(0,1,0);playerRight=new THREE.Vector3(1,0,0);playerMove=new THREE.Vector3();playerCameraTarget=new THREE.Vector3();
  }
  function updateAvatarAnimation(time){
    const gait=avatarIsWalking?Math.sin(time*0.011)*0.62:0;
    for(const arm of avatarWalkParts.arms){arm.pivot.rotation.x=arm.side*gait*0.82;arm.pivot.rotation.z=arm.side*0.035;}
    for(const leg of avatarWalkParts.legs)leg.pivot.rotation.x=-leg.side*gait;
    if(avatarWalkParts.torso)avatarWalkParts.torso.scale.y=1+Math.sin(time*0.002)*0.008+(avatarIsWalking?0.006:0);
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
    recenterCamera();cameraMode="third";
    if(cameraButton){cameraButton.style.display="block";cameraButton.textContent="VIEW: THIRD PERSON";}
    if(lookPad)lookPad.style.display="grid";

    // Face away from the ship, projected onto the local tangent plane.
    playerHeading.copy(padRight).addScaledVector(playerUp, -padRight.dot(playerUp)).normalize();
    orientAvatar();

    onFoot = true;
    avatarIsWalking = false;
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
    if (cameraButton) cameraButton.style.display = "none";if(lookPad)lookPad.style.display="none";
    if (disembarkButton) disembarkButton.style.display = "block";
    if (landingButton) landingButton.style.display = "block";
    if (approachLine) approachLine.visible = true;

    camera.up.set(0, 1, 0);
    camera.position.copy(ship.position).addScaledVector(padUp, 12);
    lookTarget.copy(ship.position).addScaledVector(padUp, 4);
    camera.lookAt(lookTarget);
    setStatus("BACK ABOARD // HAVEN LANDING PAD");
  }


  function openWildlifeHabitat(){
    if(faunaReleased||!onFoot||!playerAvatar||!habitatGate)return;
    const gatePos=habitatGate.getWorldPosition(new THREE.Vector3());
    if(playerAvatar.position.distanceTo(gatePos)>28){setStatus("WILDLIFE RESERVE GATE // WALK CLOSER");return;}
    faunaReleased=true;faunaReleaseTime=performance.now()*0.001;habitatGateOpen=true;
    if(habitatGateButton){habitatGateButton.textContent="WILDLIFE RELEASED";habitatGateButton.disabled=true;habitatGateButton.style.opacity="0.72";}
    setStatus("HABITAT GATES OPEN // GRAZERS ARE EXPLORING HAVEN");
  }

  function toggleBuggy() {
    if (buggyMode) { exitBuggy(); return; }
    if (!onFoot || !playerAvatar || !havenBuggy) return;
    const p=havenBuggy.getWorldPosition(new THREE.Vector3());
    if (playerAvatar.position.distanceTo(p)>13) { setStatus("ROVER TOO FAR // WALK CLOSER"); return; }
    buggyMode=true; buggySpeed=0; avatarIsWalking=false; playerAvatar.visible=false;
    if(cameraButton)cameraButton.style.display="none";if(lookPad)lookPad.style.display="none";
    buggyInteractButton.textContent="EXIT MOON BUGGY"; buggyInteractButton.style.display="block";
    if (boardShipButton) boardShipButton.style.display="none";
    clearKeys(); setStatus("HAVEN UTILITY ROVER // W A S D TO DRIVE");
  }

  function exitBuggy() {
    if (!buggyMode || !havenBuggy || !playerAvatar) return;
    const q=havenBuggy.getWorldQuaternion(new THREE.Quaternion());
    const p=havenBuggy.getWorldPosition(new THREE.Vector3());
    const right=new THREE.Vector3(1,0,0).applyQuaternion(q).normalize();
    const surface=sampleSurface(p.addScaledVector(right,3.8));
    playerAvatar.position.copy(surface.position); playerUp.copy(surface.up);
    const fwd=new THREE.Vector3(0,0,-1).applyQuaternion(q);
    playerHeading.copy(fwd).addScaledVector(playerUp,-fwd.dot(playerUp)).normalize();
    orientAvatar(); buggyMode=false; buggySpeed=0; avatarIsWalking=false; playerAvatar.visible=cameraMode==="third";
    if(cameraButton)cameraButton.style.display="block";if(lookPad)lookPad.style.display="grid";
    buggyInteractButton.style.display="none"; if(boardShipButton)boardShipButton.style.display="block";
    clearKeys(); setStatus("ON FOOT // HAVEN SURFACE");
  }

  function updateBuggy(delta) {
    if (!buggyMode || !havenBuggy) return;
    const steer=(keys.a?1:0)-(keys.d?1:0), throttle=(keys.w?1:0)-(keys.s?1:0);
    buggyHeading += steer*1.35*delta*(buggySpeed<0?-1:1);
    buggySpeed += (throttle*13-buggySpeed)*Math.min(1,(throttle?8.5:3.2)*delta);
    const upAxis=new THREE.Vector3(0,1,0);
    const yaw=new THREE.Quaternion().setFromAxisAngle(upAxis,buggyHeading);
    const pos=havenBuggy.position.clone(), normal=pos.clone().normalize();
    const surfaceQ=new THREE.Quaternion().setFromUnitVectors(upAxis,normal);
    const forwardLocal=new THREE.Vector3(0,0,-1).applyQuaternion(yaw).applyQuaternion(surfaceQ);
    const candidate=pos.addScaledVector(forwardLocal,buggySpeed*delta), nextNormal=candidate.clone().normalize();
    const terrain=terrainProfile(nextNormal.x,nextNormal.y,nextNormal.z);
    nextNormal.multiplyScalar(CONFIG.planetRadius+terrain.elevation+0.95);
    havenBuggy.position.copy(nextNormal);
    const nextQ=new THREE.Quaternion().setFromUnitVectors(upAxis,nextNormal.clone().normalize());
    havenBuggy.quaternion.copy(nextQ).multiply(yaw);
    for(const wheel of buggyWheels) wheel.rotation.x-=buggySpeed*delta/0.57;
    const worldPos=havenBuggy.getWorldPosition(new THREE.Vector3()), worldQ=havenBuggy.getWorldQuaternion(new THREE.Quaternion());
    const worldUp=new THREE.Vector3(0,1,0).applyQuaternion(worldQ).normalize();
    const worldForward=new THREE.Vector3(0,0,-1).applyQuaternion(worldQ).normalize();
    const desired=worldPos.clone().addScaledVector(worldForward,-8.5).addScaledVector(worldUp,4.8);
    camera.position.lerp(desired,1-Math.pow(0.0008,delta));
    camera.up.copy(worldUp); camera.lookAt(worldPos.clone().addScaledVector(worldUp,1.4).addScaledVector(worldForward,2.2));
    const speed=document.getElementById("kr-speed"), loc=document.getElementById("kr-location"), phase=document.getElementById("kr-phase");
    if(speed)speed.textContent="ROVER SPEED: "+Math.abs(buggySpeed).toFixed(1);
    if(loc)loc.textContent="LOCATION: HAVEN // MOON BUGGY";
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
            const awayLocalX=away.dot(east), awayLocalZ=away.dot(north);
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

        const offset=east.clone().multiplyScalar(x).addScaledVector(north,z);
        const normal=up.clone().addScaledVector(offset,1/CONFIG.planetRadius).normalize();
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
        creature.group.position.addScaledVector(east,driftX).addScaledVector(north,driftZ);
        creature.group.quaternion.copy(creature.baseQuaternion).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.sin(seconds*0.7+creature.phase)*0.08));
      }
    }
    for(const leaf of habitatGateLeaves){
      const target=habitatGateOpen?leaf.side*1.12:0;
      leaf.hinge.rotation.y+=(target-leaf.hinge.rotation.y)*0.09;
    }
  }

  function updateOnFoot(delta) {
    if (!onFoot || !playerAvatar) return;

    if (buggyMode) return;
    const turn = (keys.a ? 1 : 0) - (keys.d ? 1 : 0);
    const walk = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);

    if (turn) {
      playerHeading.applyAxisAngle(playerUp, turn * 1.9 * delta);
      playerHeading.addScaledVector(playerUp, -playerHeading.dot(playerUp)).normalize();
    }

    if (walk) {
      playerMove.copy(playerHeading).multiplyScalar(walk * 5.2 * delta);
      const previousPosition = playerAvatar.position.clone();
      playerAvatar.position.add(playerMove);
      // Early radial collision volumes around major structures. These
      // are intentionally simple; later builds can replace them with
      // per-mesh capsule/convex collision shapes.
      const candidateLocal = planetWorld.worldToLocal(playerAvatar.position.clone());
      let blocked = false;
      for (const zone of surfaceCollisionZones) {
        const center = zone.center;
        const dx = candidateLocal.x - center.x;
        const dy = candidateLocal.y - center.y;
        const dz = candidateLocal.z - center.z;
        if (dx * dx + dy * dy + dz * dz < zone.radius * zone.radius) {
          blocked = true;
          break;
        }
      }
      if (blocked) playerAvatar.position.copy(previousPosition);
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
    avatarIsWalking=!!walk;
    if(habitatGateButton&&habitatGate&&!faunaReleased){const d=playerAvatar.position.distanceTo(habitatGate.getWorldPosition(new THREE.Vector3()));habitatGateButton.style.display=d<=28?"block":"none";}
    if (buggyInteractButton && !buggyMode && havenBuggy) {
      const d=playerAvatar.position.distanceTo(havenBuggy.getWorldPosition(new THREE.Vector3()));
      buggyInteractButton.style.display=d<=13?"block":"none";
      buggyInteractButton.textContent="ENTER MOON BUGGY";
    }

    cameraYaw-=lookInputX*1.75*delta;
    cameraPitch=THREE.MathUtils.clamp(cameraPitch-lookInputY*1.15*delta,-0.12,0.88);
    playerCameraTarget.copy(playerAvatar.position).addScaledVector(playerUp,1.35);
    camera.up.copy(playerUp);
    if(cameraMode==="first"){
      const viewForward=playerHeading.clone().applyAxisAngle(playerUp,cameraYaw);
      viewForward.addScaledVector(playerUp,Math.tan(cameraPitch)*0.45).normalize();
      const head=playerAvatar.position.clone().addScaledVector(playerUp,2.02);
      camera.position.lerp(head,1-Math.pow(0.00008,delta));
      camera.lookAt(head.clone().addScaledVector(viewForward,12));
    }else{
      const back=playerHeading.clone().negate().applyAxisAngle(playerUp,cameraYaw);
      const desired=playerCameraTarget.clone().addScaledVector(back,8.6*Math.cos(cameraPitch)).addScaledVector(playerUp,8.6*Math.sin(cameraPitch));
      const ray=desired.clone().sub(playerCameraTarget),desiredDistance=ray.length();ray.normalize();
      if(cameraRaycaster){
        cameraRaycaster.set(playerCameraTarget,ray);
        const hits=cameraRaycaster.intersectObjects(scene.children,true);
        for(const hit of hits){
          let node=hit.object,ownAvatar=false;
          while(node){if(node===playerAvatar){ownAvatar=true;break;}node=node.parent;}
          if(!ownAvatar&&hit.distance>0.25){
            desired.copy(playerCameraTarget).addScaledVector(ray,Math.max(1.25,Math.min(desiredDistance,hit.distance-0.42)));
            break;
          }
        }
      }
      camera.position.lerp(desired,1-Math.pow(0.00008,delta));
      camera.lookAt(playerCameraTarget);
    }

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
      cameraRaycaster = new THREE.Raycaster();

      // Allocate Three.js objects after THREE is available.
      forward = new THREE.Vector3();
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
      let lookPointerId=null,lastLookX=0,lastLookY=0;
      const lookDown=e=>{if(!onFoot||buggyMode||e.button>0)return;lookPointerId=e.pointerId;lastLookX=e.clientX;lastLookY=e.clientY;if(renderer.domElement.setPointerCapture)renderer.domElement.setPointerCapture(e.pointerId);};
      const lookMove=e=>{if(e.pointerId!==lookPointerId)return;const dx=e.clientX-lastLookX,dy=e.clientY-lastLookY;lastLookX=e.clientX;lastLookY=e.clientY;cameraYaw-=dx*0.006;cameraPitch=THREE.MathUtils.clamp(cameraPitch-dy*0.0045,-0.12,0.88);};
      const lookEnd=e=>{if(e.pointerId===lookPointerId)lookPointerId=null;};
      renderer.domElement.addEventListener("pointerdown",lookDown);
      renderer.domElement.addEventListener("pointermove",lookMove);
      renderer.domElement.addEventListener("pointerup",lookEnd);
      renderer.domElement.addEventListener("pointercancel",lookEnd);
      cleanup.push(()=>{renderer.domElement.removeEventListener("pointerdown",lookDown);renderer.domElement.removeEventListener("pointermove",lookMove);renderer.domElement.removeEventListener("pointerup",lookEnd);renderer.domElement.removeEventListener("pointercancel",lookEnd);});

      // Lighting

      scene.add(
        new THREE.AmbientLight(
          0xc2b8d8,
          1.55
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
        animationFrame = requestAnimationFrame(animate);
        try {
          const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
          lastTime = time;
          if (buggyMode) updateBuggy(delta);
          else if (onFoot) updateOnFoot(delta);
          else updateFlight(delta);
          updateAmbientFauna(time);
          updateAvatarAnimation(time);
          updateNavigation();
          if (stationRing) stationRing.rotation.z += delta * 0.11;
          if (asteroidBelt) asteroidBelt.rotation.y += delta * 0.0018;
          if (moonOrbit) moonOrbit.rotation.y += delta * 0.006;
          if (planetWorld) planetWorld.rotation.y += delta * 0.00035;
          updateHUD();
          renderer.render(scene, camera);
        } catch (error) {
          cancelAnimationFrame(animationFrame);
          setStatus("RENDER LOOP ERROR: " + (error && error.message ? error.message : String(error)), true);
          console.error("[Kepler Reach] Render loop stopped:", error);
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
      if (cameraButton && cameraButton.parentNode) cameraButton.remove();
      if (buggyInteractButton && buggyInteractButton.parentNode) buggyInteractButton.remove();
      if (habitatGateButton && habitatGateButton.parentNode) habitatGateButton.remove();

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
