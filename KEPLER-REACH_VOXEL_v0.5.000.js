/* ============================================================
 * KEPLER REACH // VOXEL  (v0.5.0)
 * Everything physical is voxels: planets, moons, stations, ships, rovers, characters, buildings, trees,
 * collision, camera occlusion, gravity (derived from voxel mass), and a seeded procedural universe.
 * One intent vocabulary drives humans, scripts, LLM agents and NPC brains alike.
 * Single-file userscript. Public API: window.KeplerReach (state / input / actions / agent / characters / actors / warp).
 * ============================================================ */
(function () {
  "use strict";
  if (window.KeplerReach && typeof window.KeplerReach.destroy === "function") { try { window.KeplerReach.destroy(); } catch (e) { /* ignore */ } }
  const VERSION = "0.5.0";
  const API_SCHEMA_VERSION = "kepler-reach/2";
  let THREE = null;
  let destroyed = false;
  const cleanup = [];
  // ---- DOM shell ---------------------------------------------------------------------------------
  const root = document.createElement("div");
  root.id = "kr-voxel-root";
  root.style.cssText = "position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;background:#000;overflow:hidden;font-family:ui-monospace,Menlo,Consolas,monospace;color:#cfe6f5;user-select:none;-webkit-user-select:none;touch-action:none;";
  document.body.appendChild(root);
  const hud = document.createElement("div");
  hud.style.cssText = "position:absolute;left:10px;top:8px;right:10px;font-size:12px;line-height:1.5;text-shadow:0 0 4px #000,0 0 2px #000;pointer-events:none;white-space:pre-wrap;";
  root.appendChild(hud);
  const toastEl = document.createElement("div");
  toastEl.style.cssText = "position:absolute;left:0;right:0;top:34%;text-align:center;font-size:15px;letter-spacing:2px;text-shadow:0 0 6px #000;pointer-events:none;opacity:0;transition:opacity .25s;";
  root.appendChild(toastEl);
  const helpEl = document.createElement("div");
  helpEl.style.cssText = "position:absolute;left:10px;bottom:8px;font-size:11px;line-height:1.45;text-shadow:0 0 4px #000;pointer-events:none;white-space:pre;opacity:.85;";
  root.appendChild(helpEl);
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "EXIT";
  closeBtn.style.cssText = "position:absolute;right:10px;bottom:10px;z-index:5;background:rgba(10,20,30,.7);color:#cfe6f5;border:1px solid #456;border-radius:4px;padding:6px 10px;font:inherit;cursor:pointer;";
  closeBtn.addEventListener("click", () => { if (window.KeplerReach) window.KeplerReach.destroy(); });
  root.appendChild(closeBtn);
  // ---- status log (bounded, de-duplicated) -------------------------------------------------------
  const statusLog = [];
  let lastStatus = "", lastStatusAt = 0, toastTimer = 0;
  function setStatus(message, error) {
    const now = performance.now(), repeat = message === lastStatus && now - lastStatusAt < 2500;
    lastStatusAt = now;
    if (!repeat) {
      lastStatus = message; statusLog.push({ t: Math.round(now / 100) / 10, message: String(message), error: !!error }); if (statusLog.length > 60) statusLog.shift();
      toastEl.textContent = message; toastEl.style.opacity = "1"; toastEl.style.color = error ? "#ff8080" : "#cfe6f5";
      if (toastTimer) clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.style.opacity = "0"; }, error ? 6000 : 2600);
      (error ? console.error : console.log)("[Kepler Reach]", message);
    }
  }
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
        if (!module || !module.WebGLRenderer || !module.Scene) throw new Error("Module did not expose the expected Three.js API.");
        return module;
      } catch (error) { failures.push(sources[i] + " -> " + (error && error.message ? error.message : String(error))); }
    }
    throw new Error("THREE.JS COULD NOT LOAD. " + failures.join(" | "));
  }
  // ============================================================
  // 01 CORE: RNG, noise, materials, chunked voxel grids
  // Everything physical in Kepler Reach is made of voxels stored here.
  // ============================================================
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hashStr(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function hash3(x, y, z, s) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1103515245) ^ Math.imul(s | 0, 1274126177); h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; }
  const smooth = t => t * t * (3 - 2 * t);
  function vnoise(x, y, z, s) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi);
    const a = hash3(xi, yi, zi, s), b = hash3(xi + 1, yi, zi, s), c = hash3(xi, yi + 1, zi, s), d = hash3(xi + 1, yi + 1, zi, s);
    const e = hash3(xi, yi, zi + 1, s), f = hash3(xi + 1, yi, zi + 1, s), g = hash3(xi, yi + 1, zi + 1, s), h = hash3(xi + 1, yi + 1, zi + 1, s);
    const x0 = a + (b - a) * xf, x1 = c + (d - c) * xf, x2 = e + (f - e) * xf, x3 = g + (h - g) * xf;
    const y0 = x0 + (x1 - x0) * yf, y1 = x2 + (x3 - x2) * yf;
    return y0 + (y1 - y0) * zf;
  }
  function fbm(x, y, z, s, oct) { let a = 1, f = 1, sum = 0, n = 0; for (let i = 0; i < oct; i++) { sum += a * (vnoise(x * f, y * f, z * f, s + i * 101) * 2 - 1); n += a; a *= 0.5; f *= 2.03; } return sum / n; }
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  // ---- materials: id -> colour, density (mass per m^3), solidity, transparency
  const M = { AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SAND: 4, SNOW: 5, WATER: 6, ICE: 7, BASALT: 8, REGOLITH: 9, ORE: 10, WOOD: 11, HULL: 12, GLASS: 13, LIGHT: 14, DECK: 15, LEAF: 16, RUST: 17, PORTAL: 18, SKIN_GREEN: 32 };
  const MAT = new Array(256);
  function defMat(id, name, hex, density, solid, tr, emissive) {
    MAT[id] = { id, name, c: [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255], d: density, solid, tr: !!tr, em: !!emissive };
  }
  for (let i = 0; i < 256; i++) defMat(i, "voxel" + i, 0xcccccc, 1.2, true, false, false);
  defMat(0, "air", 0, 0, false, true);
  defMat(M.GRASS, "grass", 0x5aa63c, 1.3, true); defMat(M.DIRT, "dirt", 0x8a5a38, 1.5, true); defMat(M.STONE, "stone", 0x7b7f85, 2.6, true);
  defMat(M.SAND, "sand", 0xdcc88a, 1.6, true); defMat(M.SNOW, "snow", 0xf2f6fa, 0.5, true); defMat(M.WATER, "water", 0x2f6fd0, 1.0, false, true);
  defMat(M.ICE, "ice", 0xbfe6f5, 0.9, true); defMat(M.BASALT, "basalt", 0x4a4a55, 3.0, true); defMat(M.REGOLITH, "regolith", 0x9a9a9f, 1.4, true);
  defMat(M.ORE, "ore", 0xd9a441, 5.0, true); defMat(M.WOOD, "wood", 0x8b5a2b, 0.7, true); defMat(M.HULL, "hull", 0xb9c2cc, 1.2, true);
  defMat(M.GLASS, "glass", 0x9fd8ee, 0.8, true, true); defMat(M.LIGHT, "light", 0xfff1b0, 0.2, true, false, true); defMat(M.DECK, "deck", 0x6b7480, 1.4, true);
  defMat(M.LEAF, "leaf", 0x3f8f35, 0.3, true); defMat(M.RUST, "rust", 0xa5532e, 1.8, true); defMat(M.PORTAL, "portal", 0x9a6bff, 0.0, false, true, true);
  // model palette: ids 32.. are plain colours used by vehicle, NPC and building models
  const PALETTE_HEX = [0x6fbf5e, 0x4d8f45, 0xf1c9a5, 0xc98f6a, 0x7a4a2b, 0x2b2f3a, 0xd8d8e0, 0xe8453c, 0xf2b134, 0x3b82c4, 0x2a4a7a, 0x8a5fb5, 0xff8fb3, 0x1c1c22, 0xffffff, 0x9a6a3a, 0x58b8b0, 0xd0d4da, 0x394150, 0xb7c0cc, 0xe7d9a8, 0x3c6e47, 0xa33b3b, 0xffd35a, 0x66e0ff, 0xff6a3d, 0x2e8b57, 0x6b4f9e, 0xb5651d, 0x20252d, 0x9fb4c7, 0xf5f0e1];
  PALETTE_HEX.forEach((h, i) => defMat(32 + i, "paint" + i, h, 1.2, true));
  const P = {}; ["GREEN", "DKGREEN", "SKIN", "TAN", "BROWN", "NAVY", "SILVER", "RED", "GOLD", "BLUE", "DKBLUE", "PURPLE", "PINK", "BLACK", "WHITE", "LEATHER", "TEAL", "LTGREY", "SLATE", "STEEL", "CREAM", "FOREST", "CRIMSON", "YELLOW", "CYAN", "ORANGE", "JADE", "VIOLET", "COPPER", "CHARCOAL", "SKYSTEEL", "BONE"].forEach((n, i) => { P[n] = 32 + i; });
  const isSolid = id => MAT[id].solid;

  // ---- chunked sparse voxel grid ------------------------------------------------
  const CS = 16, CV = 4096;
  class Chunk {
    constructor(cx, cy, cz) { this.cx = cx; this.cy = cy; this.cz = cz; this.data = null; this.uniform = 0; this.mesh = null; this.wmesh = null; this.dirty = true; this.version = 0; }
  }
  const CKEY = (cx, cy, cz) => (cx + 1024) * 4194304 + (cy + 1024) * 2048 + (cz + 1024);
  class VoxelGrid {
    // scale = metres per voxel. gen(grid, chunk) lazily fills a new chunk.
    constructor(o) { o = o || {}; this.scale = o.scale || 1; this.gen = o.gen || null; this.chunks = new Map(); this.unlit = !!o.unlit; this.massDelta = 0; this._k = -1; this._c = null; this.dirtySet = new Set(); }
    chunk(cx, cy, cz, make) {
      const k = CKEY(cx, cy, cz);
      if (k === this._k) return this._c;
      let c = this.chunks.get(k);
      if (!c) { if (make === false) return null; c = new Chunk(cx, cy, cz); this.chunks.set(k, c); if (this.gen) this.gen(this, c); }
      this._k = k; this._c = c; return c;
    }
    get(x, y, z) { const c = this.chunk(x >> 4, y >> 4, z >> 4); return c.data ? c.data[((z & 15) << 8) | ((y & 15) << 4) | (x & 15)] : c.uniform; }
    solid(x, y, z) { return MAT[this.get(x, y, z)].solid; }
    alloc(c) { if (!c.data) { c.data = new Uint8Array(CV); if (c.uniform) c.data.fill(c.uniform); } return c.data; }
    set(x, y, z, id) {
      const c = this.chunk(x >> 4, y >> 4, z >> 4), d = this.alloc(c), i = ((z & 15) << 8) | ((y & 15) << 4) | (x & 15), old = d[i];
      if (old === id) return false;
      d[i] = id; this.massDelta += (MAT[id].d - MAT[old].d) * this.scale * this.scale * this.scale; this.markDirty(x, y, z); return true;
    }
    markDirty(x, y, z) {
      const lx = x & 15, ly = y & 15, lz = z & 15, cx = x >> 4, cy = y >> 4, cz = z >> 4;
      for (let dz = (lz === 0 ? -1 : 0); dz <= (lz === 15 ? 1 : 0); dz++) for (let dy = (ly === 0 ? -1 : 0); dy <= (ly === 15 ? 1 : 0); dy++) for (let dx = (lx === 0 ? -1 : 0); dx <= (lx === 15 ? 1 : 0); dx++) {
        const c = this.chunk(cx + dx, cy + dy, cz + dz, false); if (c) { c.dirty = true; c.version++; this.dirtySet.add(c); }
      }
    }
  }
  // Amanatides-Woo voxel traversal in grid units. Returns {x,y,z,id,t,nx,ny,nz} of the first solid voxel, or null.
  function voxelRay(grid, ox, oy, oz, dx, dy, dz, maxT, solidFn) {
    const sf = solidFn || (id => MAT[id].solid);
    let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
    const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
    const tdx = dx !== 0 ? Math.abs(1 / dx) : Infinity, tdy = dy !== 0 ? Math.abs(1 / dy) : Infinity, tdz = dz !== 0 ? Math.abs(1 / dz) : Infinity;
    let tx = dx !== 0 ? ((dx > 0 ? x + 1 - ox : ox - x)) * tdx : Infinity, ty = dy !== 0 ? ((dy > 0 ? y + 1 - oy : oy - y)) * tdy : Infinity, tz = dz !== 0 ? ((dz > 0 ? z + 1 - oz : oz - z)) * tdz : Infinity;
    let t = 0, nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < 2048; i++) {
      const id = grid.get(x, y, z);
      if (sf(id)) return { x, y, z, id, t, nx, ny, nz };
      if (tx < ty && tx < tz) { t = tx; if (t > maxT) return null; x += sx; tx += tdx; nx = -sx; ny = 0; nz = 0; }
      else if (ty < tz) { t = ty; if (t > maxT) return null; y += sy; ty += tdy; nx = 0; ny = -sy; nz = 0; }
      else { t = tz; if (t > maxT) return null; z += sz; tz += tdz; nx = 0; ny = 0; nz = -sz; }
    }
    return null;
  }
  // ============================================================
  // 02 MODELS: finite voxel models (ships, NPCs, buildings, stations)
  // A model is voxels. Its mass, centre of mass and collision shape come from them.
  // ============================================================
  class VoxelModel {
    constructor(sx, sy, sz, scale) { this.sx = sx; this.sy = sy; this.sz = sz; this.scale = scale || 0.25; this.data = new Uint8Array(sx * sy * sz); }
    get(x, y, z) { return (x < 0 || y < 0 || z < 0 || x >= this.sx || y >= this.sy || z >= this.sz) ? 0 : this.data[x + this.sx * (y + this.sy * z)]; }
    set(x, y, z, id) { if (x >= 0 && y >= 0 && z >= 0 && x < this.sx && y < this.sy && z < this.sz) this.data[x + this.sx * (y + this.sy * z)] = id; return this; }
    box(x0, y0, z0, x1, y1, z1, id) { for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, z, id); return this; }
    sphere(cx, cy, cz, r, id) { const R = Math.ceil(r); for (let z = -R; z <= R; z++) for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) if (x * x + y * y + z * z <= r * r) this.set(Math.round(cx + x), Math.round(cy + y), Math.round(cz + z), id); return this; }
    cylY(cx, cz, y0, y1, r, id) { const R = Math.ceil(r); for (let y = y0; y <= y1; y++) for (let z = -R; z <= R; z++) for (let x = -R; x <= R; x++) if (x * x + z * z <= r * r) this.set(Math.round(cx + x), y, Math.round(cz + z), id); return this; }
    cylX(cy, cz, x0, x1, r, id) { const R = Math.ceil(r); for (let x = x0; x <= x1; x++) for (let z = -R; z <= R; z++) for (let y = -R; y <= R; y++) if (y * y + z * z <= r * r) this.set(x, Math.round(cy + y), Math.round(cz + z), id); return this; }
    cylZ(cx, cy, z0, z1, r, id) { const R = Math.ceil(r); for (let z = z0; z <= z1; z++) for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) if (x * x + y * y <= r * r) this.set(Math.round(cx + x), Math.round(cy + y), z, id); return this; }
    ring(cx, cz, y0, y1, rIn, rOut, id) { const R = Math.ceil(rOut); for (let y = y0; y <= y1; y++) for (let z = -R; z <= R; z++) for (let x = -R; x <= R; x++) { const d = x * x + z * z; if (d <= rOut * rOut && d >= rIn * rIn) this.set(Math.round(cx + x), y, Math.round(cz + z), id); } return this; }
    mirrorX() { for (let z = 0; z < this.sz; z++) for (let y = 0; y < this.sy; y++) for (let x = 0; x < (this.sx >> 1); x++) { const a = this.get(x, y, z), b = this.get(this.sx - 1 - x, y, z); if (a && !b) this.set(this.sx - 1 - x, y, z, a); else if (b && !a) this.set(x, y, z, b); } return this; }
    count() { let n = 0; for (let i = 0; i < this.data.length; i++) if (this.data[i] && MAT[this.data[i]].solid) n++; return n; }
    // mass in "tonnes" from voxel densities; centre of mass in metres from the model origin (centre of base)
    massProps() {
      let m = 0, cx = 0, cy = 0, cz = 0; const v = this.scale * this.scale * this.scale;
      for (let z = 0; z < this.sz; z++) for (let y = 0; y < this.sy; y++) for (let x = 0; x < this.sx; x++) { const id = this.data[x + this.sx * (y + this.sy * z)]; if (!id) continue; const dm = MAT[id].d * v; m += dm; cx += dm * (x + 0.5); cy += dm * (y + 0.5); cz += dm * (z + 0.5); }
      if (m <= 0) return { mass: 0, com: [0, 0, 0] };
      return { mass: m, com: [(cx / m - this.sx / 2) * this.scale, (cy / m) * this.scale, (cz / m - this.sz / 2) * this.scale] };
    }
    // Collision shape derived from the voxels: boundary cells of a coarser lattice that contain any solid voxel.
    // Points are in metres in the model frame (origin = centre of the base).
    collisionPoints(spacing, maxPoints, pred) {
      const k = Math.max(1, Math.round(spacing / this.scale)), nx = Math.ceil(this.sx / k), ny = Math.ceil(this.sy / k), nz = Math.ceil(this.sz / k);
      const occ = new Uint8Array(nx * ny * nz);
      for (let z = 0; z < this.sz; z++) for (let y = 0; y < this.sy; y++) for (let x = 0; x < this.sx; x++) { const id = this.data[x + this.sx * (y + this.sy * z)]; if (id && MAT[id].solid && (!pred || pred(x, y, z))) occ[((x / k) | 0) + nx * (((y / k) | 0) + ny * ((z / k) | 0))] = 1; }
      const at = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= nx || y >= ny || z >= nz) ? 0 : occ[x + nx * (y + ny * z)];
      let pts = [];
      for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
        if (!at(x, y, z)) continue;
        if (at(x - 1, y, z) && at(x + 1, y, z) && at(x, y - 1, z) && at(x, y + 1, z) && at(x, y, z - 1) && at(x, y, z + 1)) continue;
        pts.push([(x + 0.5) * k * this.scale - this.sx * this.scale / 2, (y + 0.5) * k * this.scale, (z + 0.5) * k * this.scale - this.sz * this.scale / 2]);
      }
      if (maxPoints && pts.length > maxPoints) { const step = pts.length / maxPoints, out = []; for (let i = 0; i < maxPoints; i++) out.push(pts[Math.floor(i * step)]); pts = out; }
      return pts;
    }
    // copy into a voxel grid at integer voxel offset (same scale)
    toGrid(opts) {
      const g = new VoxelGrid({ scale: this.scale, unlit: !!(opts && opts.unlit) });
      for (let z = 0; z < this.sz; z++) for (let y = 0; y < this.sy; y++) for (let x = 0; x < this.sx; x++) { const id = this.data[x + this.sx * (y + this.sy * z)]; if (id) { const c = g.chunk(x >> 4, y >> 4, z >> 4), d = g.alloc(c); d[((z & 15) << 8) | ((y & 15) << 4) | (x & 15)] = id; } }
      return g;
    }
  }
  // ============================================================
  // 03 MESHER: voxel chunks -> three.js geometry (face culling + per-vertex ambient occlusion)
  // ============================================================
  const PADN = 18, PADN2 = 324, EMPTY_CHUNK = { data: null, uniform: 0 };
  const padBuf = new Uint8Array(PADN * PADN * PADN);
  function padChunk(grid, c) {
    const nb = new Array(27);
    for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) nb[(dz + 1) * 9 + (dy + 1) * 3 + (dx + 1)] = grid.chunk(c.cx + dx, c.cy + dy, c.cz + dz, !!grid.gen) || EMPTY_CHUNK;
    for (let z = -1; z <= 16; z++) {
      const nz = z < 0 ? 0 : z > 15 ? 2 : 1, lz = z & 15;
      for (let y = -1; y <= 16; y++) {
        const ny = y < 0 ? 0 : y > 15 ? 2 : 1, ly = y & 15, base = (z + 1) * PADN2 + (y + 1) * PADN + 1;
        for (let x = -1; x <= 16; x++) {
          const ch = nb[nz * 9 + ny * 3 + (x < 0 ? 0 : x > 15 ? 2 : 1)];
          padBuf[base + x] = ch.data ? ch.data[(lz << 8) | (ly << 4) | (x & 15)] : ch.uniform;
        }
      }
    }
    return padBuf;
  }
  const AO_LEVEL = [0.5, 0.68, 0.84, 1.0], AXIS_SHADE = [[0.9, 0.9], [1.0, 0.72], [0.86, 0.86]];
  function newBuf() { return { p: [], n: [], c: [], i: [] }; }
  // returns { opaque, water } raw buffers (or null when empty)
  function meshChunkBuffers(grid, chunk) {
    const pad = padChunk(grid, chunk), S = grid.scale, op = newBuf(), wt = newBuf(), unlit = grid.unlit;
    const bx = chunk.cx * CS, by = chunk.cy * CS, bz = chunk.cz * CS;
    const stride = [1, PADN, PADN2], pos = [0, 0, 0], off = [0, 0, 0];
    const occ = (idx) => { const m = MAT[pad[idx]]; return m.solid && !m.tr ? 1 : 0; };
    for (let z = 0; z < CS; z++) for (let y = 0; y < CS; y++) for (let x = 0; x < CS; x++) {
      const pidx = (z + 1) * PADN2 + (y + 1) * PADN + (x + 1), id = pad[pidx];
      if (!id) continue;
      const m = MAT[id], isTr = m.tr;
      for (let a = 0; a < 3; a++) for (let sgn = -1; sgn <= 1; sgn += 2) {
        const nidx = pidx + sgn * stride[a], nid = pad[nidx];
        if (isTr ? nid !== 0 : (nid !== 0 && !MAT[nid].tr)) continue;
        const buf = isTr ? wt : op, u = (a + 1) % 3, v = (a + 2) % 3;
        const gx = bx + x, gy = by + y, gz = bz + z;
        const vary = 0.94 + 0.12 * hash3(gx, gy, gz, 7), shade = AXIS_SHADE[a][sgn > 0 ? 1 : 0];
        const base = buf.p.length / 3, q = sgn > 0 ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[0, 0], [0, 1], [1, 1], [1, 0]], ao = [0, 0, 0, 0];
        for (let k = 0; k < 4; k++) {
          const cu = q[k][0], cv = q[k][1];
          pos[a] = (a === 0 ? x : a === 1 ? y : z) + (sgn > 0 ? 1 : 0); pos[u] = (u === 0 ? x : u === 1 ? y : z) + cu; pos[v] = (v === 0 ? x : v === 1 ? y : z) + cv;
          buf.p.push((pos[0] + (chunk.cx * CS)) * S, (pos[1] + (chunk.cy * CS)) * S, (pos[2] + (chunk.cz * CS)) * S);
          const nrm = [0, 0, 0]; nrm[a] = sgn; buf.n.push(nrm[0], nrm[1], nrm[2]);
          let lvl = 3;
          if (!isTr && !unlit) {
            const du = cu ? 1 : -1, dv = cv ? 1 : -1;
            const s1 = occ(nidx + du * stride[u]), s2 = occ(nidx + dv * stride[v]), cr = occ(nidx + du * stride[u] + dv * stride[v]);
            lvl = (s1 && s2) ? 0 : 3 - (s1 + s2 + cr);
          }
          ao[k] = lvl;
          const br = m.em ? 1.25 : (unlit ? 1 : shade * AO_LEVEL[lvl] * vary);
          buf.c.push(m.c[0] * br, m.c[1] * br, m.c[2] * br);
        }
        if (ao[0] + ao[2] < ao[1] + ao[3]) buf.i.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
        else buf.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
    }
    return { opaque: op.p.length ? op : null, water: wt.p.length ? wt : null };
  }
  function geometryFromBuf(b, offset) {
    const g = new THREE.BufferGeometry();
    const nv = b.p.length / 3;
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(b.p), 3));
    g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(b.n), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(b.c), 3));
    g.setIndex(new THREE.BufferAttribute(nv > 65535 ? new Uint32Array(b.i) : new Uint16Array(b.i), 1));
    g.computeBoundingSphere();
    return g;
  }
  let sharedMats = null;
  function voxelMaterials() {
    if (!sharedMats) sharedMats = {
      lit: new THREE.MeshLambertMaterial({ vertexColors: true }), unlit: new THREE.MeshBasicMaterial({ vertexColors: true }),
      water: new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.62, depthWrite: false })
    };
    return sharedMats;
  }
  // (Re)build the meshes of one chunk and attach them to `parent`.
  function syncChunkMesh(grid, chunk, parent) {
    if (!chunk.dirty && (chunk.mesh || chunk.wmesh || chunk.empty)) return false;
    for (const key of ["mesh", "wmesh"]) { if (chunk[key]) { parent.remove(chunk[key]); chunk[key].geometry.dispose(); chunk[key] = null; } }
    const bufs = meshChunkBuffers(grid, chunk), mats = voxelMaterials();
    if (bufs.opaque) { chunk.mesh = new THREE.Mesh(geometryFromBuf(bufs.opaque), grid.unlit ? mats.unlit : mats.lit); chunk.mesh.frustumCulled = true; parent.add(chunk.mesh); }
    if (bufs.water) { chunk.wmesh = new THREE.Mesh(geometryFromBuf(bufs.water), mats.water); chunk.wmesh.renderOrder = 2; parent.add(chunk.wmesh); }
    chunk.empty = !(bufs.opaque || bufs.water);
    chunk.dirty = false;
    return true;
  }
  function disposeGridMeshes(grid, parent) {
    for (const c of grid.chunks.values()) for (const key of ["mesh", "wmesh"]) if (c[key]) { if (parent) parent.remove(c[key]); c[key].geometry.dispose(); c[key] = null; }
  }
  // a whole finite model/grid becomes one THREE.Group
  function groupFromGrid(grid) {
    const g = new THREE.Group();
    for (const c of Array.from(grid.chunks.values())) { c.dirty = true; syncChunkMesh(grid, c, g); }
    return g;
  }
  // ============================================================
  // 04 PLANET GENERATOR: procedural voxel planets and moons
  // Terrain is a heightfield on a cube-sphere (cached lazily), voxelised on demand.
  // Buildings and trees are voxel models rasterised into the grid ("structures").
  // ============================================================
  const GRAV_G = 0.0043; // tuned so a 110 m radius world of bulk density 5 pulls ~9.9 m/s^2
  function frameFromDir(d, yaw) { // d: unit up vector; yaw rotates the horizontal axes about it
    const ref = Math.abs(d[1]) < 0.95 ? [0, 1, 0] : [1, 0, 0];
    let e = [ref[1] * d[2] - ref[2] * d[1], ref[2] * d[0] - ref[0] * d[2], ref[0] * d[1] - ref[1] * d[0]];
    let l = Math.hypot(e[0], e[1], e[2]); e = e.map(v => v / l);
    let s = [e[1] * d[2] - e[2] * d[1], e[2] * d[0] - e[0] * d[2], e[0] * d[1] - e[1] * d[0]];
    const c = Math.cos(yaw || 0), sn = Math.sin(yaw || 0);
    const e2 = [e[0] * c + s[0] * sn, e[1] * c + s[1] * sn, e[2] * c + s[2] * sn], s2 = [-e[0] * sn + s[0] * c, -e[1] * sn + s[1] * c, -e[2] * sn + s[2] * c];
    return { e: e2, u: [d[0], d[1], d[2]], s: s2 };
  }
  function nearestAxis(d) { const ax = Math.abs(d[0]), ay = Math.abs(d[1]), az = Math.abs(d[2]); if (ax >= ay && ax >= az) return [Math.sign(d[0]) || 1, 0, 0]; if (ay >= az) return [0, Math.sign(d[1]) || 1, 0]; return [0, 0, Math.sign(d[2]) || 1]; }
  function normDir(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

  // spec: { seed, R, amp, sea (m above R, or null), biome: temperate|desert|ice|barren, craters, density, trees, structures:[{model,dir,yaw,flatten,foot,blend}] }
  function createPlanetGenerator(spec) {
    const R = spec.R, amp = spec.amp, seed = spec.seed | 0, biome = spec.biome || "temperate", seaR = spec.sea === null || spec.sea === undefined ? -1 : R + spec.sea;
    const rnd = mulberry32(seed ^ 0x9e3779b9), craters = [];
    const nCr = spec.craters || 0;
    for (let i = 0; i < nCr; i++) {
      const d = normDir([rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1]), ang = (0.05 + rnd() * rnd() * 0.32), depth = Math.min(amp * 0.9, 2 + ang * R * 0.55);
      craters.push({ d, ang, cosA: Math.cos(ang * 1.3), depth });
    }
    const N = Math.max(24, Math.ceil(R * 1.35)), faces = new Array(6).fill(null);
    function rawHeight(dx, dy, dz) {
      let h;
      if (biome === "barren") h = fbm(dx * 2.1, dy * 2.1, dz * 2.1, seed, 4) * 0.55 + fbm(dx * 7, dy * 7, dz * 7, seed + 9, 3) * 0.22;
      else if (biome === "desert") h = fbm(dx * 1.7, dy * 1.7, dz * 1.7, seed, 4) * 0.5 + Math.abs(fbm(dx * 5, dy * 5, dz * 5, seed + 5, 3)) * 0.35 - 0.1;
      else if (biome === "ice") h = fbm(dx * 1.9, dy * 1.9, dz * 1.9, seed, 4) * 0.55 + fbm(dx * 6, dy * 6, dz * 6, seed + 3, 3) * 0.2;
      else h = fbm(dx * 1.5, dy * 1.5, dz * 1.5, seed, 4) * 0.8 + fbm(dx * 4.4, dy * 4.4, dz * 4.4, seed + 7, 3) * 0.3;
      let sr = R + amp * h;
      for (let i = 0; i < craters.length; i++) {
        const c = craters[i], dt = dx * c.d[0] + dy * c.d[1] + dz * c.d[2];
        if (dt < c.cosA) continue;
        const a = Math.acos(Math.min(1, dt)) / c.ang;
        sr += c.depth * (-(1 - Math.min(1, a * a)) * (a < 1 ? 1 : 0) + 0.3 * Math.exp(-((a - 1) / 0.14) * ((a - 1) / 0.14)));
      }
      return sr;
    }
    // cube-sphere face lookup
    function faceUV(dx, dy, dz) {
      const ax = Math.abs(dx), ay = Math.abs(dy), az = Math.abs(dz);
      if (ax >= ay && ax >= az) return dx > 0 ? [0, dz / ax, dy / ax] : [1, -dz / ax, dy / ax];
      if (ay >= az) return dy > 0 ? [2, dx / ay, dz / ay] : [3, dx / ay, -dz / ay];
      return dz > 0 ? [4, -dx / az, dy / az] : [5, dx / az, dy / az];
    }
    function faceDir(f, u, v) {
      switch (f) {
        case 0: return [1, v, u]; case 1: return [-1, v, -u]; case 2: return [u, 1, v]; case 3: return [u, -1, -v]; case 4: return [-u, v, 1]; default: return [u, v, -1];
      }
    }
    function faceTile(f) {
      if (faces[f]) return faces[f];
      const t = new Float32Array(N * N);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const d = normDir(faceDir(f, i / (N - 1) * 2 - 1, j / (N - 1) * 2 - 1));
        t[i + j * N] = rawHeight(d[0], d[1], d[2]);
      }
      faces[f] = t; return t;
    }
    function baseRadius(dx, dy, dz) {
      const fu = faceUV(dx, dy, dz), t = faceTile(fu[0]);
      const fx = (fu[1] * 0.5 + 0.5) * (N - 1), fy = (fu[2] * 0.5 + 0.5) * (N - 1);
      const i = Math.min(N - 2, Math.max(0, Math.floor(fx))), j = Math.min(N - 2, Math.max(0, Math.floor(fy))), a = fx - i, b = fy - j;
      const h00 = t[i + j * N], h10 = t[i + 1 + j * N], h01 = t[i + (j + 1) * N], h11 = t[i + 1 + (j + 1) * N];
      return (h00 * (1 - a) + h10 * a) * (1 - b) + (h01 * (1 - a) + h11 * a) * b;
    }
    // ---- structures (buildings, trees, pads)
    const structs = [];
    function addStructure(s) {
      const d = normDir(s.dir), model = s.model, ms = model.scale;
      // Structures sit on a plane aligned to the voxel grid axes (so floors and walls are perfectly flat voxels, not
      // stair-stepped); trees keep the local radial frame.
      const ax = s.axis === false ? d : (Array.isArray(s.axis) ? s.axis : nearestAxis(d));
      const fr = frameFromDir(ax, s.yaw || 0), base = baseRadius(d[0], d[1], d[2]);
      const groundR = (s.groundR !== undefined ? s.groundR : Math.round(base)) + (s.lift || 0);
      const p0 = [d[0] * groundR, d[1] * groundR, d[2] * groundR];
      const c = Math.round(p0[0] * ax[0] + p0[1] * ax[1] + p0[2] * ax[2]), shift = c - (p0[0] * ax[0] + p0[1] * ax[1] + p0[2] * ax[2]);
      const origin = [p0[0] + ax[0] * shift, p0[1] + ax[1] * shift, p0[2] + ax[2] * shift];
      const hx = model.sx * ms / 2, hz = model.sz * ms / 2, H = model.sy * ms;
      const rec = { model, ms, d, ax, c, fr, groundR, origin, hx, hz, H, flatten: s.flatten !== false, foot: s.foot === undefined ? Math.max(hx, hz) + 2 : s.foot, blend: s.blend === undefined ? 5 : s.blend,
        bc: [origin[0] + fr.u[0] * H / 2, origin[1] + fr.u[1] * H / 2, origin[2] + fr.u[2] * H / 2], br: Math.sqrt(hx * hx + hz * hz + H * H / 4) + 1, id: s.id || null, name: s.name || null, pad: s.pad || null, tag: s.tag || null };
      structs.push(rec); return rec;
    }
    (spec.structures || []).forEach(addStructure);
    let maxStructTop = 0;
    function refreshStructBounds() { maxStructTop = 0; for (const s of structs) maxStructTop = Math.max(maxStructTop, s.groundR + s.H + 2 - R); }
    refreshStructBounds();
    function surfaceR(dx, dy, dz) {
      let sr = baseRadius(dx, dy, dz);
      for (let i = 0; i < structs.length; i++) {
        const s = structs[i]; if (!s.flatten) continue;
        const dt = dx * s.d[0] + dy * s.d[1] + dz * s.d[2];
        const dist = Math.sqrt(Math.max(0, 2 * (1 - dt))) * s.groundR;
        if (dist > s.foot + s.blend) continue;
        const w = 1 - sstep(s.foot, s.foot + s.blend, dist), flat = s.c / Math.max(0.2, dx * s.ax[0] + dy * s.ax[1] + dz * s.ax[2]);
        sr = sr + (flat - sr) * w;
      }
      return sr;
    }
    function surfaceMat(dx, dy, dz, sr, depthTop) {
      const lat = Math.abs(dy), hgt = (sr - R) / Math.max(1, amp);
      if (biome === "barren") return depthTop ? (hgt > 0.5 ? M.BASALT : M.REGOLITH) : M.BASALT;
      if (biome === "desert") return depthTop ? (hgt > 0.55 ? M.RUST : M.SAND) : M.RUST;
      if (biome === "ice") return depthTop ? (hgt < -0.35 ? M.ICE : M.SNOW) : M.ICE;
      if (seaR > 0 && sr < seaR + 1.6) return depthTop ? M.SAND : M.SAND;
      if (lat > 0.86 || hgt > 0.62) return depthTop ? M.SNOW : M.STONE;
      if (hgt > 0.4) return depthTop ? M.STONE : M.STONE;
      return depthTop ? M.GRASS : M.DIRT;
    }
    function gen(grid, chunk) {
      const S = grid.scale, cs = CS * S, x0 = chunk.cx * cs, y0 = chunk.cy * cs, z0 = chunk.cz * cs;
      const nx = clamp(0, x0, x0 + cs), ny = clamp(0, y0, y0 + cs), nz = clamp(0, z0, z0 + cs);
      const near = Math.hypot(nx, ny, nz);
      const fx = Math.max(Math.abs(x0), Math.abs(x0 + cs)), fy = Math.max(Math.abs(y0), Math.abs(y0 + cs)), fz = Math.max(Math.abs(z0), Math.abs(z0 + cs));
      const far = Math.hypot(fx, fy, fz);
      const maxSurf = Math.max(R + amp * 1.25 + 6 + maxStructTop, seaR), minSurf = R - amp * 1.25 - 6;
      chunk.generated = true;
      if (near > maxSurf + S) { chunk.uniform = M.AIR; return; }
      if (far < minSurf - S) { chunk.uniform = M.STONE; return; }
      const data = new Uint8Array(CV);
      const cands = [];
      const ccx = x0 + cs / 2, ccy = y0 + cs / 2, ccz = z0 + cs / 2, half = cs * 0.87;
      for (const s of structs) { const d = Math.hypot(ccx - s.bc[0], ccy - s.bc[1], ccz - s.bc[2]); if (d < s.br + half + S) cands.push(s); }
      let allSame = true, first = -1;
      for (let lz = 0; lz < CS; lz++) for (let ly = 0; ly < CS; ly++) for (let lx = 0; lx < CS; lx++) {
        const px = x0 + (lx + 0.5) * S, py = y0 + (ly + 0.5) * S, pz = z0 + (lz + 0.5) * S, r = Math.sqrt(px * px + py * py + pz * pz) || 1e-6;
        const dx = px / r, dy = py / r, dz = pz / r, sr = surfaceR(dx, dy, dz);
        let id;
        if (r <= sr) {
          const depth = sr - r;
          if (depth < S) id = surfaceMat(dx, dy, dz, sr, true);
          else if (depth < S + 3) id = surfaceMat(dx, dy, dz, sr, false);
          else id = (S <= 1 && depth > 5 && hash3(Math.floor(px), Math.floor(py), Math.floor(pz), seed) > 0.996) ? M.ORE : M.STONE;
        } else id = r <= seaR ? M.WATER : M.AIR;
        for (let k = 0; k < cands.length; k++) {
          const s = cands[k], rx = px - s.origin[0], ry = py - s.origin[1], rz = pz - s.origin[2];
          const lx2 = rx * s.fr.e[0] + ry * s.fr.e[1] + rz * s.fr.e[2] + s.hx, ly2 = rx * s.fr.u[0] + ry * s.fr.u[1] + rz * s.fr.u[2], lz2 = rx * s.fr.s[0] + ry * s.fr.s[1] + rz * s.fr.s[2] + s.hz;
          if (lx2 < 0 || ly2 < 0 || lz2 < 0) continue;
          const mid = s.model.get(Math.floor(lx2 / s.ms), Math.floor(ly2 / s.ms), Math.floor(lz2 / s.ms));
          if (mid) { id = mid; break; }
        }
        data[(lz << 8) | (ly << 4) | lx] = id;
        if (first < 0) first = id; else if (id !== first) allSame = false;
      }
      if (allSame) chunk.uniform = first; else chunk.data = data;
    }
    // mass from voxel volume: integrate the surface over the sphere (Fibonacci lattice), times bulk density
    function volume() {
      const n = 3000; let v = 0; const ga = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < n; i++) { const y = 1 - (i + 0.5) / n * 2, rr = Math.sqrt(1 - y * y), th = i * ga; const sr = surfaceR(Math.cos(th) * rr, y, Math.sin(th) * rr); v += sr * sr * sr / 3; }
      return v * 4 * Math.PI / n;
    }
    return { gen, surfaceR, baseRadius, volume, structs, addStructure, refreshStructBounds, nearestAxis, R, amp, seaR, seed, biome, craters,
      topRadius: () => Math.max(R + amp * 1.25 + maxStructTop, seaR) };
  }
  // ============================================================
  // 05 MODEL LIBRARY: procedural voxel art (all of it is voxels)
  // Convention: model forward is -Z, up is +Y, origin is the centre of the base.
  // ============================================================
  function makeHuman(o) {
    o = o || {};
    const skin = o.skin || P.SKIN, shirt = o.shirt || P.BLUE, pants = o.pants || P.NAVY, hair = o.hair, hat = o.hat;
    const m = new VoxelModel(6, 10, 4, 0.25);
    m.box(1, 0, 1, 2, 2, 2, pants).box(3, 0, 1, 4, 2, 2, pants);              // legs
    m.box(1, 3, 1, 4, 5, 2, shirt).box(0, 3, 1, 0, 5, 2, shirt).box(5, 3, 1, 5, 5, 2, shirt); // torso + arms
    m.box(0, 3, 1, 0, 3, 2, skin).box(5, 3, 1, 5, 3, 2, skin);                  // hands
    m.box(1, 6, 1, 4, 7, 2, skin);                                              // head
    m.set(2, 7, 1, P.BLACK).set(3, 7, 1, P.BLACK);                              // eyes (front is -Z)
    if (o.frog) { m.set(1, 8, 1, P.WHITE).set(4, 8, 1, P.WHITE).set(1, 8, 2, skin).set(4, 8, 2, skin).set(2, 6, 0, P.CRIMSON); }
    if (hair) m.box(1, 8, 1, 4, 8, 2, hair);
    if (hat) { m.box(0, 8, 0, 5, 8, 3, hat).box(1, 9, 1, 4, 9, 2, hat); }
    if (o.badge) m.set(1, 5, 0, P.GOLD).set(2, 5, 0, P.GOLD);
    if (o.pack) m.box(1, 3, 3, 4, 5, 3, o.pack);
    return m;
  }
  const NPC_STYLES = {
    explorer: { skin: P.SKIN, shirt: P.TEAL, pants: P.SLATE, hair: P.BROWN, pack: P.ORANGE },
    benis: { skin: P.GREEN, shirt: P.TAN, pants: P.NAVY, hat: P.LEATHER, frog: true, badge: true },
    mia: { skin: P.TAN, shirt: P.PINK, pants: P.PURPLE, hair: P.BLACK },
    moonman: { skin: P.BONE, shirt: P.SILVER, pants: P.STEEL, hat: P.WHITE },
    sancho: { skin: P.COPPER, shirt: P.RED, pants: P.CHARCOAL, hat: P.BROWN },
    lemmy: { skin: P.SKIN, shirt: P.FOREST, pants: P.BROWN, hair: P.YELLOW },
    clovs: { skin: P.TAN, shirt: P.ORANGE, pants: P.NAVY, hair: P.CRIMSON },
    gardener: { skin: P.COPPER, shirt: P.JADE, pants: P.BROWN, hat: P.CREAM },
    stranger: { skin: P.SKIN, shirt: P.CHARCOAL, pants: P.CHARCOAL, hat: P.BLACK }
  };

  function makeTree(variant) {
    const m = new VoxelModel(7, 9, 7, 1), h = 3 + (variant % 3);
    m.box(3, 0, 3, 3, h, 3, M.WOOD); m.sphere(3, h + 1.5, 3, 2.7, M.LEAF); m.set(3, h + 4, 3, M.LEAF);
    return m;
  }
  function makeHouse(w, d, h, wall, roof) {
    const m = new VoxelModel(w, h + 2, d, 1);
    m.box(0, 0, 0, w - 1, h - 1, d - 1, wall);
    m.box(1, 0, 1, w - 2, h - 2, d - 2, 0);                         // hollow interior (ground is the floor)
    m.box(Math.floor(w / 2), 0, 0, Math.floor(w / 2), 1, 0, 0);     // door in the front (-Z) wall
    m.box(1, 2, 0, 1, 2, 0, M.GLASS).box(w - 2, 2, 0, w - 2, 2, 0, M.GLASS).box(1, 2, d - 1, 1, 2, d - 1, M.GLASS).box(w - 2, 2, d - 1, w - 2, 2, d - 1, M.GLASS);
    m.box(0, h, 0, w - 1, h, d - 1, roof); m.box(1, h + 1, 1, w - 2, h + 1, d - 2, roof);
    return m;
  }
  function makeShop(wall, roof, sign) {
    const m = makeHouse(13, 9, 5, wall, roof);
    m.box(2, 3, 0, 10, 3, 0, sign);                                  // signboard on the front
    m.box(3, 0, 3, 9, 0, 3, M.WOOD);                                 // counter
    m.set(1, 7, 1, M.LIGHT).set(11, 7, 1, M.LIGHT);
    return m;
  }
  function makeTower(h) {
    const m = new VoxelModel(5, h, 5, 1);
    m.box(1, 0, 1, 3, 2, 3, M.DECK).box(2, 3, 2, 2, h - 3, 2, P.STEEL).box(1, h - 3, 1, 3, h - 3, 3, P.STEEL).set(2, h - 2, 2, M.LIGHT).set(2, h - 1, 2, M.LIGHT);
    return m;
  }
  // landing pad: flat deck with border lights and a beacon pylon; the pad surface is the top of layer 0
  function makePad(size, accent) {
    const m = new VoxelModel(size, 8, size, 1), c = (size - 1) / 2;
    m.box(0, 0, 0, size - 1, 0, size - 1, M.DECK);
    for (let i = 0; i < size; i++) { if (i % 3 === 0) { m.set(i, 0, 0, M.LIGHT).set(i, 0, size - 1, M.LIGHT).set(0, 0, i, M.LIGHT).set(size - 1, 0, i, M.LIGHT); } }
    m.cylY(c, c, 0, 0, size * 0.32, accent || P.ORANGE); m.cylY(c, c, 0, 0, size * 0.2, M.DECK);
    m.box(Math.floor(c), 1, Math.floor(c), Math.floor(c), 1, Math.floor(c), P.STEEL);
    return m;
  }
  function makePier(len, wid, depth) {
    const m = new VoxelModel(wid, depth + 3, len, 1);
    m.box(0, depth, 0, wid - 1, depth, len - 1, M.WOOD);
    for (let z = 1; z < len; z += 4) { m.box(0, 0, z, 0, depth - 1, z, M.WOOD); m.box(wid - 1, 0, z, wid - 1, depth - 1, z, M.WOOD); }
    for (let z = 0; z < len; z += 4) { m.box(0, depth + 1, z, 0, depth + 1, z, M.WOOD); m.box(wid - 1, depth + 1, z, wid - 1, depth + 1, z, M.WOOD); }
    return m;
  }
  function makeSpaceport(size, depth) {
    const m = new VoxelModel(size, depth + 9, size, 1), c = (size - 1) / 2;
    for (let x = 2; x < size; x += 6) for (let z = 2; z < size; z += 6) m.box(x, 0, z, x, depth - 1, z, M.STONE);
    m.box(0, depth, 0, size - 1, depth, size - 1, M.DECK);
    m.cylY(c, c, depth, depth, size * 0.3, P.CYAN); m.cylY(c, c, depth, depth, size * 0.2, M.DECK);
    for (let i = 0; i < size; i += 2) { m.set(i, depth, 0, M.LIGHT).set(i, depth, size - 1, M.LIGHT).set(0, depth, i, M.LIGHT).set(size - 1, depth, i, M.LIGHT); }
    m.box(size - 8, depth + 1, size - 8, size - 3, depth + 5, size - 3, P.LTGREY).box(size - 7, depth + 1, size - 7, size - 4, depth + 4, size - 4, 0).set(size - 6, depth + 1, size - 8, 0).set(size - 6, depth + 2, size - 8, 0);
    return m;
  }
  function makePortalRing(R) {
    const n = Math.ceil(R * 2 + 6), m = new VoxelModel(n, n, 5, 1), c = (n - 1) / 2;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const d = Math.hypot(x - c, y - c); if (d <= R && d >= R - 2.2) for (let z = 1; z <= 3; z++) m.set(x, y, z, z === 2 ? P.VIOLET : P.STEEL); else if (d < R - 2.2) m.set(x, y, 2, M.PORTAL); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; m.set(Math.round(c + Math.cos(a) * (R - 1)), Math.round(c + Math.sin(a) * (R - 1)), 0, M.LIGHT); }
    return m;
  }
  // ---- vehicles (0.25 m voxels). Forward is -Z. Landing gear / wheels touch y = 0.
  function makeShip(o) {
    o = o || {}; const accent = o.accent || P.RED;
    const m = new VoxelModel(44, 18, 60, 0.25), cx = 22, cy = 9;
    m.cylZ(cx, cy, 8, 52, 6.5, M.HULL); m.cylZ(cx, cy, 9, 51, 5, 0);
    for (let k = 0; k < 8; k++) m.cylZ(cx, cy, k, k, 1 + (6.2 * Math.sqrt(k / 8)), M.HULL);   // tapered nose
    m.sphere(cx, cy + 1, 9, 4.2, M.GLASS);                                                      // cockpit canopy
    m.box(cx - 3, cy - 3, 12, cx + 3, cy - 3, 20, P.SLATE);                                    // cockpit floor
    m.box(cx - 1, cy - 2, 13, cx + 1, cy - 2, 15, M.LIGHT);                                    // console glow
    for (let z = 24; z <= 44; z++) { const sp = 6 + Math.round((z - 24) * 0.8); m.box(cx - sp - 4, cy - 1, z, cx - 6, cy, z, M.HULL); m.box(cx + 6, cy - 1, z, cx + sp + 4, cy, z, M.HULL); }
    m.box(cx - 1, cy + 6, 30, cx + 1, cy + 9, 46, accent);                                      // dorsal fin
    m.box(cx - 7, cy + 4, 14, cx + 7, cy + 4, 46, accent);                                      // roof stripe
    m.cylZ(cx - 9, cy - 1, 46, 58, 2.6, P.STEEL); m.cylZ(cx + 9, cy - 1, 46, 58, 2.6, P.STEEL); m.cylZ(cx - 9, cy - 1, 59, 59, 2.0, M.LIGHT); m.cylZ(cx + 9, cy - 1, 59, 59, 2.0, M.LIGHT);
    for (const [gx, gz] of [[cx - 8, 16], [cx + 8, 16], [cx - 8, 46], [cx + 8, 46]]) { m.box(gx, 0, gz, gx, 3, gz, P.STEEL); m.box(gx - 1, 0, gz - 1, gx + 1, 0, gz + 1, P.STEEL); }
    m.box(cx - 2, 3, 30, cx + 2, 6, 30, 0);                                                    // hatch
    return m;
  }
  function makeRover() {
    const m = new VoxelModel(18, 11, 26, 0.25);
    m.box(2, 3, 3, 15, 6, 23, M.HULL); m.box(3, 7, 6, 14, 9, 14, M.GLASS); m.box(4, 7, 15, 13, 7, 22, P.ORANGE);
    for (const wz of [5, 21]) for (const [x0, x1] of [[0, 2], [15, 17]]) m.cylX(2, wz, x0, x1, 2.4, P.CHARCOAL);
    m.set(3, 4, 2, M.LIGHT).set(14, 4, 2, M.LIGHT).box(8, 10, 20, 9, 10, 21, P.STEEL);
    return m;
  }

  // ---- stations: finite voxel bodies at 0.5 m voxels. deck gravity points along +Y of the model.
  function buildLastStop() {
    const m = new VoxelModel(220, 70, 130, 0.5), cx = 110, cz = 65;
    m.box(10, 0, 10, 209, 3, 119, M.DECK);                                                      // main deck slab
    m.box(10, 4, 10, 209, 4, 10, P.STEEL).box(10, 4, 119, 209, 4, 119, P.STEEL);               // rails
    m.box(0, 0, 40, 9, 3, 90, M.DECK);                                                          // west dock arm
    // dock apron (east): flat pad with markings
    m.box(150, 0, 20, 219, 3, 110, M.DECK); m.box(150, 4, 20, 219, 4, 20, M.LIGHT);
    for (let x = 150; x < 220; x += 6) { m.set(x, 4, 20, M.LIGHT).set(x, 4, 110, M.LIGHT); }
    m.cylY(185, 65, 4, 4, 28, P.ORANGE); m.cylY(185, 65, 4, 4, 22, M.DECK);
    // Beef's Bar: hollow building with a glass front
    m.box(30, 4, 30, 110, 30, 100, P.SLATE); m.box(32, 4, 32, 108, 28, 98, 0);
    m.box(60, 4, 30, 80, 14, 31, 0);                                                            // wide door
    m.box(34, 18, 30, 56, 24, 30, M.GLASS).box(84, 18, 30, 106, 24, 30, M.GLASS);
    m.box(36, 4, 60, 100, 8, 62, M.WOOD);                                                       // bar counter
    for (let x = 40; x < 100; x += 10) m.box(x, 4, 70, x + 3, 6, 73, P.BROWN);                  // stools
    m.box(30, 31, 30, 110, 31, 100, P.CRIMSON); m.box(50, 32, 50, 90, 36, 80, P.SLATE);        // roof + rooftop sign block
    m.box(52, 33, 49, 88, 35, 49, M.LIGHT);
    // sheriff's jail annex
    m.box(116, 4, 32, 146, 22, 62, P.STEEL); m.box(118, 4, 34, 144, 20, 60, 0); m.box(128, 4, 32, 134, 14, 33, 0);
    for (let z = 40; z <= 56; z += 2) m.box(131, 4, z, 131, 17, z, P.STEEL);                    // cell bars
    m.box(116, 23, 32, 146, 23, 62, P.CRIMSON);
    // pylons + spire
    for (const [x, z] of [[14, 14], [14, 115], [150, 24], [150, 106]]) { m.box(x, 4, z, x + 1, 14, z + 1, P.STEEL); m.box(x, 15, z, x + 1, 15, z + 1, M.LIGHT); }
    m.box(cx - 1, 4, 12, cx + 1, 60, 14, P.STEEL); m.box(cx - 3, 61, 11, cx + 3, 62, 15, M.LIGHT);
    // under-deck hull so it reads as a station from below
    m.box(30, -0, 30, 200, 0, 100, P.SLATE);
    return m;
  }
  function buildSolarCommons() {
    const m = new VoxelModel(270, 90, 200, 0.5), c = 100;
    m.cylY(c, c, 0, 2, 78, M.DECK); m.ring(c, c, 3, 4, 74, 78, P.STEEL);
    // glass dome (hemisphere shell) with an east door
    for (let y = 3; y < 90; y++) for (let z = 0; z < 200; z++) for (let x = 0; x < 200; x++) { const d = Math.sqrt((x - c) * (x - c) + (y - 3) * (y - 3) + (z - c) * (z - c)); if (d <= 61 && d >= 60) m.set(x, y, z, (x + z + y) % 17 === 0 ? P.STEEL : M.GLASS); }
    m.box(c + 56, 3, c - 4, c + 66, 14, c + 4, 0);
    // garden floor
    m.cylY(c, c, 3, 3, 58, M.GRASS); m.cylY(c, c, 3, 3, 8, M.SAND);
    for (let k = 0; k < 14; k++) { const a = k * 2.4, r = 18 + (k % 4) * 9, tx = Math.round(c + Math.cos(a) * r), tz = Math.round(c + Math.sin(a) * r); m.box(tx, 4, tz, tx, 8, tz, M.WOOD); m.sphere(tx, 11, tz, 3.4, M.LEAF); }
    m.box(c - 4, 4, c - 4, c + 4, 6, c + 4, M.STONE); m.box(c - 3, 7, c - 3, c + 3, 7, c + 3, M.WATER); // fountain
    // dock arm with landing apron (east)
    m.box(c + 78, 0, c - 20, 269, 2, c + 20, M.DECK); m.cylY(c + 135, c, 3, 3, 16, P.CYAN); m.cylY(c + 135, c, 3, 3, 10, M.DECK);
    for (let x = c + 78; x < 270; x += 5) { m.set(x, 3, c - 20, M.LIGHT).set(x, 3, c + 20, M.LIGHT); }
    return m;
  }
  function buildGenericStation(rnd) {
    const m = new VoxelModel(150, 50, 110, 0.5), cx = 55, cz = 55;
    m.cylY(cx, cz, 0, 3, 38, M.DECK); m.cylY(cx, cz, 4, 20, 20, P.SLATE); m.cylY(cx, cz, 5, 19, 18, 0); m.box(cx + 14, 4, cz - 3, cx + 20, 12, cz + 3, 0);
    m.ring(cx, cz, 4, 5, 34, 38, P.STEEL); m.cylY(cx, cz, 21, 21, 20, P.CRIMSON); m.box(cx - 1, 22, cz - 1, cx + 1, 34, cz + 1, P.STEEL); m.set(cx, 35, cz, M.LIGHT);
    m.box(cx + 38, 0, cz - 14, 149, 3, cz + 14, M.DECK); m.cylY(cx + 90, cz, 4, 4, 11, P.ORANGE); m.cylY(cx + 90, cz, 4, 4, 7, M.DECK);
    for (let x = cx + 38; x < 150; x += 4) m.set(x, 4, cz - 14, M.LIGHT).set(x, 4, cz + 14, M.LIGHT);
    return m;
  }
  // ============================================================
  // 06 UNIVERSE: the home system (hand-placed) and procedural systems (seeded)
  // A system is plain data: a star, bodies on orbits, structures stamped on planets, portals to neighbours.
  // ============================================================
  const SYL = ["ka", "ro", "ven", "ta", "lu", "mi", "sor", "dan", "eth", "ixa", "qua", "bel", "nor", "zeph", "ura", "cal", "tem", "ori", "vas", "mun", "gal", "pir", "ose", "dra"];
  function genName(rnd, n) { let s = ""; const k = n || (2 + Math.floor(rnd() * 2)); for (let i = 0; i < k; i++) s += SYL[Math.floor(rnd() * SYL.length)]; return s[0].toUpperCase() + s.slice(1); }
  function dirLatLon(lat, lon) { const la = lat * Math.PI / 180, lo = lon * Math.PI / 180; return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)]; }
  const sysKey = c => c[0] + "," + c[1] + "," + c[2];
  const UNIVERSE_SEED = 20261126;

  // --- structure placement helpers (work on a created planet generator) -------------------------------
  function findLand(gen, dir, minAbove, tries, rnd) {
    const sea = gen.seaR;
    for (let i = 0; i < (tries || 60); i++) {
      const d = i === 0 ? normDir(dir) : normDir([dir[0] + (rnd() - 0.5) * 0.04 * i, dir[1] + (rnd() - 0.5) * 0.04 * i, dir[2] + (rnd() - 0.5) * 0.04 * i]);
      const h = gen.baseRadius(d[0], d[1], d[2]);
      if (h < sea + (minAbove || 2) && sea > 0) continue;
      // reject steep spots: compare with neighbours 8 m away
      const fr = frameFromDir(d, 0); let worst = 0;
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const q = normDir([d[0] + (fr.e[0] * a + fr.s[0] * b) * 8 / gen.R, d[1] + (fr.e[1] * a + fr.s[1] * b) * 8 / gen.R, d[2] + (fr.e[2] * a + fr.s[2] * b) * 8 / gen.R]);
        worst = Math.max(worst, Math.abs(gen.baseRadius(q[0], q[1], q[2]) - h));
      }
      if (worst < 5.5) return d;
    }
    return normDir(dir);
  }
  function ringDir(d, ang, dist, R) { // direction `dist` metres from d at bearing `ang`
    const fr = frameFromDir(d, 0), k = dist / R, c = Math.cos(ang), s = Math.sin(ang);
    return normDir([d[0] + (fr.e[0] * c + fr.s[0] * s) * k, d[1] + (fr.e[1] * c + fr.s[1] * s) * k, d[2] + (fr.e[2] * c + fr.s[2] * s) * k]);
  }
  function stampTrees(gen, rnd, count, avoid) {
    let placed = 0, guard = 0;
    while (placed < count && guard++ < count * 8) {
      const d = normDir([rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1]), h = gen.baseRadius(d[0], d[1], d[2]), sr = (h - gen.R) / gen.amp;
      if (gen.seaR > 0 && h < gen.seaR + 2.5) continue; if (Math.abs(d[1]) > 0.84 || sr > 0.38) continue;
      if (avoid && avoid.some(a => Math.abs(a.d[0] * d[0] + a.d[1] * d[1] + a.d[2] * d[2]) > Math.cos((a.r / gen.R))) ) continue;
      gen.addStructure({ model: TREE_MODELS[placed % 3], dir: d, yaw: rnd() * 6.28, flatten: false, axis: false, foot: 0, blend: 0 }); placed++;
    }
  }
  let TREE_MODELS = null;
  // prefer a pad direction within ~22 degrees of a grid axis (a perfectly flat voxel plane there stays near the local horizon)
  function nearAxisCandidate(gen, dirA, rnd) {
    const axes = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]];
    const base = normDir(dirA), want = gen.nearestAxis(base); let best = null, bs = 1e9;
    const order = [want].concat(axes.filter(a => a.join() !== want.join()));
    for (const ax of order) {
      for (let i = 0; i < 40; i++) {
        const j = i === 0 ? 0 : 0.38 * Math.sqrt(rnd()), th = rnd() * 6.283, fr = frameFromDir(ax, 0);
        const d = normDir([ax[0] + (fr.e[0] * Math.cos(th) + fr.s[0] * Math.sin(th)) * j, ax[1] + (fr.e[1] * Math.cos(th) + fr.s[1] * Math.sin(th)) * j, ax[2] + (fr.e[2] * Math.cos(th) + fr.s[2] * Math.sin(th)) * j]);
        const h = gen.baseRadius(d[0], d[1], d[2]); if (gen.seaR > 0 && h < gen.seaR + 3) continue; if (Math.abs(d[1]) > 0.8 && ax[1] === 0) continue;
        let worst = 0; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = normDir([d[0] + (fr.e[0] * a + fr.s[0] * b) * 10 / gen.R, d[1] + (fr.e[1] * a + fr.s[1] * b) * 10 / gen.R, d[2] + (fr.e[2] * a + fr.s[2] * b) * 10 / gen.R]); worst = Math.max(worst, Math.abs(gen.baseRadius(q[0], q[1], q[2]) - h)); }
        const score = worst + j * 6 + (ax === want ? 0 : 3); if (score < bs) { bs = score; best = d; }
      }
      if (bs < 4) break;
    }
    return best || base;
  }
  // Called once the generator exists, before any chunk is generated.
  function populatePlanet(gen, desc, rnd) {
    if (!TREE_MODELS) TREE_MODELS = [makeTree(0), makeTree(1), makeTree(2)];
    const out = { pads: [], places: [] }, avoid = [];
    let SETTLE_AXIS = null;
    const add = (model, dir, yaw, name, kind, pad, extra) => {
      const rec = gen.addStructure({ model, dir, yaw: Math.round(yaw / (Math.PI / 2)) * (Math.PI / 2), name, foot: undefined, axis: SETTLE_AXIS || undefined, ...(extra || {}) });
      if (!SETTLE_AXIS) SETTLE_AXIS = rec.ax;
      avoid.push({ d: normDir(dir), r: Math.max(model.sx, model.sz) + 6 });
      out.places.push({ name, kind, struct: rec });
      if (pad) out.pads.push({ id: pad.id, name: pad.name, struct: rec, height: pad.height === undefined ? 1 : pad.height, kind: pad.kind || "landing-pad" });
      return rec;
    };
    const dirA = desc.padDir ? normDir(desc.padDir) : normDir([rnd() * 2 - 1, rnd() * 0.8 - 0.4, rnd() * 2 - 1]);
    let padDir = findLand(gen, nearAxisCandidate(gen, dirA, rnd), 3, 40, rnd);
    add(makePad(17, P.ORANGE), padDir, 0, desc.padName || (desc.name + " landing site"), "landing-pad", { id: desc.id + "-landing-site", name: desc.padName || (desc.name + " landing site"), height: 1 });
    if (desc.settlement) {
      const roofs = [P.RED, P.TEAL, P.ORANGE, P.PURPLE], walls = [P.CREAM, P.LTGREY, P.BONE];
      const shops = desc.settlement === "haven" ? [["Moon Man's Rx", P.SILVER, P.BLUE, P.GOLD], ["Sancho's Armory", P.SLATE, P.CRIMSON, P.ORANGE], ["Lemmy's Saloon", P.BROWN, P.FOREST, P.YELLOW]] : [["Outpost trade post", P.CREAM, P.TEAL, P.GOLD]];
      shops.forEach((s, i) => { const a = i * 2.1 + 0.6, d = findLand(gen, ringDir(padDir, a, 34 + i * 8, gen.R), 2.5, 60, rnd); add(makeShop(s[1], s[2], s[3]), d, a + Math.PI, s[0], "shop"); });
      const nh = desc.settlement === "haven" ? 6 : 3;
      for (let i = 0; i < nh; i++) { const a = rnd() * 6.28, d = findLand(gen, ringDir(padDir, a, 55 + rnd() * 45, gen.R), 2.5, 60, rnd); add(makeHouse(7 + (i % 3), 7, 4, walls[i % 3], roofs[i % 4]), d, a, "Homestead " + (i + 1), "house"); }
      add(makeTower(16), findLand(gen, ringDir(padDir, 4.1, 28, gen.R), 2.5, 60, rnd), 0, "Relay mast", "tower");
    }
    if (!desc.settlement && desc.outpost) { const a = 2.3, d = findLand(gen, ringDir(padDir, a, 30, gen.R), 0, 60, rnd); add(makeHouse(8, 8, 4, P.LTGREY, P.STEEL), d, a, desc.name + " habitat", "house"); add(makeTower(14), findLand(gen, ringDir(padDir, 4.4, 26, gen.R), 0, 60, rnd), 0, "Relay mast", "tower"); }
    return { padDir, out, avoid };
  }
  // shore pier and offshore spaceport (Haven): they stand on piles in the sea
  function addMaritime(gen, padDir, rnd, out) {
    if (!(gen.seaR > 0)) return;
    const sea = gen.seaR;
    // walk outward from the pad along several bearings until the water is 5+ m deep
    for (let a = 0.3; a < 6.3; a += 0.45) {
      let found = null;
      for (let dist = 36; dist < gen.R * 2.4; dist += 4) { const d = ringDir(padDir, a, dist, gen.R), h = gen.baseRadius(d[0], d[1], d[2]); if (h < sea - 3.5) { found = { d, dist, h }; break; } }
      if (!found) continue;
      // Quai de Haven pier: ends in deep water
      const pierDir = ringDir(padDir, a, found.dist - 16, gen.R), pierSeabed = Math.min(...[0, 1, 2, 3].map(i => { const q = ringDir(pierDir, 0, 0, gen.R), fr = frameFromDir(q, 0); const p2 = normDir([q[0] + fr.e[0] * (i - 1.5) * 6 / gen.R, q[1] + fr.e[1] * (i - 1.5) * 6 / gen.R, q[2] + fr.e[2] * (i - 1.5) * 6 / gen.R]); return gen.baseRadius(p2[0], p2[1], p2[2]); }));
      const depth = Math.max(3, Math.ceil(sea - pierSeabed) + 1);
      const pier = makePier(36, 5, depth), pr = gen.addStructure({ model: pier, dir: pierDir, yaw: a, flatten: false, groundR: Math.round(pierSeabed), name: "Quai de Haven" });
      out.places.push({ name: "Quai de Haven", kind: "pier", struct: pr });
      out.pads.push({ id: "quai-de-haven", name: "Quai de Haven shore dock", struct: pr, height: depth + 1, kind: "pier" });
      // L'Astrolabe spaceport further out
      const spDist = found.dist + 40, spDir = ringDir(padDir, a + 0.12, spDist, gen.R), spBed = Math.min(...[[0, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]].map(o => { const fr = frameFromDir(spDir, 0), q = normDir([spDir[0] + (fr.e[0] * o[0] + fr.s[0] * o[1]) * 13 / gen.R, spDir[1] + (fr.e[1] * o[0] + fr.s[1] * o[1]) * 13 / gen.R, spDir[2] + (fr.e[2] * o[0] + fr.s[2] * o[1]) * 13 / gen.R]); return gen.baseRadius(q[0], q[1], q[2]); }));
      const sDepth = Math.max(4, Math.ceil(sea - spBed) + 1), sp = makeSpaceport(27, sDepth);
      const sr = gen.addStructure({ model: sp, dir: spDir, yaw: 0, flatten: false, groundR: Math.round(spBed), name: "L'Astrolabe" });
      out.places.push({ name: "L'Astrolabe offshore spaceport", kind: "spaceport", struct: sr });
      out.pads.push({ id: "l-astrolabe", name: "L'Astrolabe offshore spaceport", struct: sr, height: sDepth + 1, kind: "dock" });
      return;
    }
  }

  // --- descriptors ---------------------------------------------------------------------------------------
  function homeSystem() {
    return {
      id: "kepler-reach", name: "Kepler Reach", coords: [0, 0, 0], seed: 1,
      star: { id: "kepler", name: "Kepler", pos: [-500, 180, -1350], radius: 44, colors: [P.YELLOW, P.GOLD, P.ORANGE] },
      bodies: [
        { id: "haven", name: "Haven", kind: "planet", orbit: { center: "star", period: 21600 }, pos: [0, 0, -650], spin: 7200,
          planet: { seed: 2026, R: 110, amp: 14, sea: 2, biome: "temperate", density: 5, craters: 0, trees: 150, settlement: "haven", padName: "Haven landing site", padDir: dirLatLon(8, -48), maritime: true } },
        { id: "luna", name: "Luna", kind: "planet", orbit: { center: "haven", period: 2700 }, pos: [345, 12, -650], spin: 2700,
          planet: { seed: 88, R: 48, amp: 5, sea: null, biome: "barren", density: 1.9, craters: 28, trees: 0, settlement: null, padName: "Luna landing site", padDir: dirLatLon(5, 200), outpost: true } },
        { id: "last-stop", name: "The Last Stop", kind: "station", orbit: { center: "haven", period: 43200 }, pos: [-310, 25, -650], model: "lastStop", gravity: 9.0,
          pads: [{ id: "last-stop-dock", name: "The Last Stop space dock", local: [92.5, 2.5, 32.5] }], shipHome: [92.5, 2.5, 32.5] },
        { id: "solar-commons", name: "Solar Commons", kind: "station", orbit: { center: "haven", period: 43200 }, pos: [150, 60, -1350], model: "solarCommons", gravity: 9.0,
          pads: [{ id: "solar-commons-dock", name: "Solar Commons orbital dock", local: [117.5, 2.0, 50] }] },
        { id: "gate-ember", name: "Ember Gate", kind: "portal", pos: [-180, 20, -560], to: [1, 0, 0], yaw: 0 },
        { id: "gate-azure", name: "Azure Gate", kind: "portal", pos: [160, 40, -1300], to: [0, 0, 1], yaw: 1.2 }
      ],
      people: [
        { id: "explorer", name: "Explorer", role: "Explorer", at: "last-stop", local: [88, 2.0, 27], brain: "player", style: "explorer" },
        { id: "benis", name: "Benis", role: "Sheriff", at: "last-stop", local: [66, 2.0, 12], brain: "patrol", style: "benis", patrol: { r: 9 }, say: ["Keep it civil in here, partner.", "Jail's got one empty cell if you're looking."] },
        { id: "mia", name: "Mia", role: "Barkeep", at: "last-stop", local: [34, 2.0, 36], brain: "idle", style: "mia", say: ["First one's on the house, spacer."] },
        { id: "moonman", name: "Moon Man", role: "Proprietor, Moon Man's Rx", at: "place:Moon Man's Rx", brain: "idle", style: "moonman", say: ["Rations, med-kits, moon dust. Ask away."] },
        { id: "sancho", name: "Sancho", role: "Proprietor, Sancho's Armory", at: "place:Sancho's Armory", brain: "idle", style: "sancho", say: ["Everything here is rated for vacuum."] },
        { id: "lemmy", name: "Lemmy", role: "Saloon keeper", at: "place:Lemmy's Saloon", brain: "idle", style: "lemmy", say: ["Water's free. Rumours cost extra."] },
        { id: "gardener", name: "Juno", role: "Gardener", at: "solar-commons", local: [45, 2.0, 50], brain: "wander", style: "gardener", wander: { r: 22 }, say: ["Mind the roots, they're older than the station."] }
      ],
      vehicles: [{ id: "space-rv", kind: "ship", at: "last-stop-home", name: "Space RV" }, { id: "luna-rover", kind: "rover", at: "place:Luna landing site", name: "Luna utility rover", body: "luna", offset: [8, 0, 5] }]
    };
  }
  function procSystem(coords) {
    const seed = hashStr(UNIVERSE_SEED + ":" + sysKey(coords)), rnd = mulberry32(seed);
    const name = genName(rnd), star = { id: "star", name: name, pos: [-500, 150, -1300], radius: 26 + Math.floor(rnd() * 26), colors: [[P.YELLOW, P.GOLD, P.ORANGE], [P.CYAN, P.WHITE, P.SKYSTEEL], [P.CRIMSON, P.ORANGE, P.RED]][Math.floor(rnd() * 3)] };
    const bodies = [], nPl = 2 + Math.floor(rnd() * 3);
    const biomes = ["temperate", "desert", "ice", "barren", "temperate", "desert"];
    let prevR = 480;
    for (let i = 0; i < nPl; i++) {
      const R = 38 + Math.floor(rnd() * 80), biome = biomes[Math.floor(rnd() * biomes.length)], amp = Math.round(R * (0.07 + rnd() * 0.07)), pname = name + " " + ["I", "II", "III", "IV", "V"][i];
      prevR += 380 + rnd() * 520; const ang = rnd() * 6.28, id = "planet" + (i + 1);
      const pl = { seed: Math.floor(rnd() * 1e9), R, amp, sea: biome === "temperate" ? Math.round(amp * 0.14) : null, biome, density: +(2.4 + rnd() * 3.6).toFixed(2), craters: biome === "barren" || biome === "ice" ? 8 + Math.floor(rnd() * 24) : 0,
        trees: biome === "temperate" ? Math.round(R * 0.9) : 0, settlement: i === 0 ? "outpost" : (rnd() < 0.5 ? "outpost" : null), padName: pname + " landing site", maritime: false, outpost: i > 0 };
      bodies.push({ id, name: pname, kind: "planet", orbit: { center: "star", period: 18000 + rnd() * 20000 }, pos: [star.pos[0] + Math.cos(ang) * prevR, star.pos[1] + (rnd() - 0.5) * 120, star.pos[2] + Math.sin(ang) * prevR], spin: 4000 + rnd() * 9000, planet: pl });
      if (rnd() < 0.55) { const mr = 20 + Math.floor(rnd() * 22); bodies.push({ id: id + "-moon", name: pname + " a", kind: "planet", orbit: { center: id, period: 1800 + rnd() * 2500 }, pos: [0, 0, 0], offset: [R + 120 + rnd() * 160, (rnd() - 0.5) * 40, (rnd() - 0.5) * 60], spin: 3000, planet: { seed: Math.floor(rnd() * 1e9), R: mr, amp: Math.max(3, Math.round(mr * 0.1)), sea: null, biome: "barren", density: 2.2, craters: 10 + Math.floor(rnd() * 12), trees: 0, settlement: null, padName: pname + " a landing site", outpost: true } }); }
    }
    bodies.push({ id: "station", name: name + " Station", kind: "station", orbit: { center: "planet1", period: 40000 }, pos: [0, 0, 0], offset: [190 + rnd() * 120, 20, -120 - rnd() * 120], model: "generic", gravity: 9.0, pads: [{ id: "station-dock", name: name + " Station dock", local: [72.5, 2.5, 27.5] }], shipHome: [72.5, 2.5, 27.5] });
    // portals to neighbouring systems, placed near the first planet so they are reachable
    const links = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], pick = [];
    while (pick.length < 3) { const l = links[Math.floor(rnd() * 6)]; if (!pick.includes(l)) pick.push(l); }
    pick.forEach((l, i) => { const to = [coords[0] + l[0], coords[1] + l[1], coords[2] + l[2]]; const a = i * 2.1 + 0.4; bodies.push({ id: "gate" + i, name: genName(mulberry32(hashStr(sysKey(to))), 2) + " Gate", kind: "portal", orbit: { center: "planet1", period: 90000 }, pos: [0, 0, 0], offset: [Math.cos(a) * 330, 30 + i * 12, Math.sin(a) * 330], to, yaw: a }); });
    // the first system a portal leads to must be able to return: the portal back to where we came from is added at warp time
    return { id: "sys-" + sysKey(coords), name: name, coords, seed, star, bodies, people: [
      { id: "explorer", name: "Explorer", role: "Explorer", at: "ship", brain: "player", style: "explorer" },
      { id: "hermit-" + sysKey(coords), name: genName(rnd, 2) + " the Hermit", role: "Hermit", at: "place:" + (bodies[0].planet.padName), brain: "wander", style: "stranger", wander: { r: 18 }, say: ["Haven't seen a ship in cycles."] }],
      vehicles: [{ id: "space-rv", kind: "ship", at: "arrival", name: "Space RV" }] };
  }
  // ============================================================
  // 07 WORLD: bodies, orbits, mass-derived gravity, voxel queries, level-of-detail rendering
  // ============================================================
  const COARSE = 4, FINE_IN = 110, FINE_OUT = 150, FRAME_ALT = 230;
  class Body {
    constructor(world, desc, type) {
      this.world = world; this.desc = desc; this.id = desc.id; this.name = desc.name; this.kind = desc.kind; this.type = type;
      this.root = new THREE.Group(); this.root.name = "body:" + desc.id; this.inv = new THREE.Matrix4();
      this.gox = 0; this.goy = 0; this.goz = 0; this.grid = null; this.coarse = null; this.view = null; this.mass0 = 0; this.pads = []; this.places = [];
      this.boundR = 10; this.offset = null; this.centerId = desc.orbit ? desc.orbit.center : null; this.period = desc.orbit ? desc.orbit.period : 0; this.spin = desc.spin || 0; this.spinPhase = 0;
      this.gravityBox = null; this.R = 0; this.model = null;
    }
    get mass() { return this.mass0 + (this.grid ? this.grid.massDelta : 0); }
    get surfaceGravity() { return this.type === "planet" ? GRAV_G * this.mass / (this.R * this.R) : (this.desc.gravity || 9); }
    localToWorld(v, out) { return (out || new THREE.Vector3()).copy(v).applyMatrix4(this.root.matrixWorld); }
    worldToLocal(v, out) { return (out || new THREE.Vector3()).copy(v).applyMatrix4(this.inv); }
    localDirToWorld(v, out) { return (out || new THREE.Vector3()).copy(v).transformDirection(this.root.matrixWorld); }
    worldDirToLocal(v, out) { return (out || new THREE.Vector3()).copy(v).transformDirection(this.inv); }
    matAt(lx, ly, lz) {
      if (this.type === "planet") { const r2 = lx * lx + ly * ly + lz * lz, top = this.topR + 2; if (r2 > top * top) return M.AIR; const lo = this.deepR; if (r2 < lo * lo) return M.STONE; }
      else if (this.type === "star") { return M.AIR; }
      const S = this.grid.scale; return this.grid.get(Math.floor((lx + this.gox) / S), Math.floor((ly + this.goy) / S), Math.floor((lz + this.goz) / S));
    }
    solidAt(lx, ly, lz) { return MAT[this.matAt(lx, ly, lz)].solid; }
    // gravity acceleration vector (local frame) at a local position; null if outside this body's field
    gravityLocal(l, out) {
      out = out || new THREE.Vector3();
      if (this.type === "planet") {
        const r = l.length(); if (r > this.R * 4 + 220) return null;
        const g = r >= this.R ? GRAV_G * this.mass / (r * r) : GRAV_G * this.mass * r / (this.R * this.R * this.R);
        return out.copy(l).multiplyScalar(-g / Math.max(r, 1e-6));
      }
      if (this.type === "station" && this.gravityBox) {
        const b = this.gravityBox; if (l.x < b.x0 || l.x > b.x1 || l.z < b.z0 || l.z > b.z1 || l.y < b.y0 || l.y > b.y1) return null;
        return out.set(0, -this.desc.gravity, 0);
      }
      return null;
    }
  }
  function randomStarModel(colors, radius, seed) {
    const S = COARSE, r = Math.round(radius / S), n = r * 2 + 2, m = new VoxelModel(n, n, n, S), rnd = mulberry32(seed || 1);
    for (let z = 0; z < n; z++) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (Math.hypot(x + 0.5 - n / 2, y + 0.5 - n / 2, z + 0.5 - n / 2) <= r) m.set(x, y, z, colors[Math.floor(rnd() * colors.length)]);
    return m;
  }
  function modelByName(name, rnd) { return name === "lastStop" ? buildLastStop() : name === "solarCommons" ? buildSolarCommons() : buildGenericStation(rnd); }

  class PlanetView {
    constructor(body) { this.body = body; this.cg = new THREE.Group(); this.fg = new THREE.Group(); body.root.add(this.cg); body.root.add(this.fg); this.list = []; this.regions = new Map(); this.pending = []; this.initDone = false; this.coarseQ = null; }
    initCoarse() {
      const b = this.body, ext = Math.ceil(b.topR / (CS * COARSE)) + 1, list = [];
      for (let cz = -ext; cz <= ext; cz++) for (let cy = -ext; cy <= ext; cy++) for (let cx = -ext; cx <= ext; cx++) {
        const c = b.coarse.chunk(cx, cy, cz); if (!c.data && (c.uniform === M.AIR || c.uniform === M.STONE)) { if (!this.maybeEdge(c)) continue; }
        list.push(c);
      }
      this.coarseQ = list; this.total = list.length;
    }
    maybeEdge(c) { // a uniform chunk next to a different chunk still has faces
      const g = this.body.coarse;
      for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy && !dz) continue; const n = g.chunk(c.cx + dx, c.cy + dy, c.cz + dz); if (n.data || n.uniform !== c.uniform) return true; }
      return false;
    }
    regionKey(cx, cy, cz) { return cx + "," + cy + "," + cz; }
    update(localPoints, budgetMs) {
      const t0 = performance.now(), b = this.body;
      if (!this.coarseQ) this.initCoarse();
      while (this.coarseQ.length && performance.now() - t0 < budgetMs) {
        const c = this.coarseQ.pop(); syncChunkMesh(b.coarse, c, this.cg);
        if (c.mesh) c.mesh.visible = !this.regions.has(this.regionKey(c.cx, c.cy, c.cz)) || !this.regions.get(this.regionKey(c.cx, c.cy, c.cz)).fineReady;
        if (c.wmesh) c.wmesh.visible = c.mesh ? c.mesh.visible : true;
      }
      this.initDone = this.coarseQ.length === 0;
      // choose fine regions around actors
      const wanted = new Set(), rs = CS * COARSE;
      for (const lp of localPoints) {
        const rr = Math.ceil(FINE_IN / rs) + 1, cx0 = Math.floor(lp.x / rs), cy0 = Math.floor(lp.y / rs), cz0 = Math.floor(lp.z / rs);
        for (let cz = cz0 - rr; cz <= cz0 + rr; cz++) for (let cy = cy0 - rr; cy <= cy0 + rr; cy++) for (let cx = cx0 - rr; cx <= cx0 + rr; cx++) {
          const dx = Math.max(0, Math.abs(lp.x - (cx + 0.5) * rs) - rs / 2), dy = Math.max(0, Math.abs(lp.y - (cy + 0.5) * rs) - rs / 2), dz = Math.max(0, Math.abs(lp.z - (cz + 0.5) * rs) - rs / 2);
          const dist = Math.hypot(dx, dy, dz), key = this.regionKey(cx, cy, cz), have = this.regions.has(key);
          if (dist < (have ? FINE_OUT : FINE_IN) - 40) {
            const cc = b.coarse.chunk(cx, cy, cz); if (!cc.mesh && !cc.wmesh && !cc.dirty === false) { /* not meshed yet */ }
            if (!cc.data && (cc.uniform === M.AIR || cc.uniform === M.STONE) && !this.maybeEdge(cc)) continue;
            wanted.add(key); if (!have) this.regions.set(key, { cx, cy, cz, chunks: null, fineReady: false });
          }
        }
      }
      for (const [key, r] of this.regions) {
        if (!wanted.has(key)) { // leave fine mode
          if (r.chunks) for (const c of r.chunks) { if (c.mesh) c.mesh.visible = false; if (c.wmesh) c.wmesh.visible = false; }
          const cc = b.coarse.chunk(r.cx, r.cy, r.cz, false); if (cc) { if (cc.mesh) cc.mesh.visible = true; if (cc.wmesh) cc.wmesh.visible = true; }
          this.regions.delete(key); continue;
        }
        if (!r.chunks) { r.chunks = []; r.todo = []; for (let k = 0; k < 4; k++) for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) r.todo.push([r.cx * 4 + i, r.cy * 4 + j, r.cz * 4 + k]); }
        while (r.todo.length && performance.now() - t0 < budgetMs) {
          const [fx, fy, fz] = r.todo.pop(), c = b.grid.chunk(fx, fy, fz);
          if (!c.data && (c.uniform === M.STONE || c.uniform === M.AIR)) { let inert = true; for (let dz = -1; dz <= 1 && inert; dz++) for (let dy = -1; dy <= 1 && inert; dy++) for (let dx = -1; dx <= 1; dx++) { const n = b.grid.chunk(fx + dx, fy + dy, fz + dz); if (n.data || n.uniform !== c.uniform) { inert = false; break; } } if (inert) { r.chunks.push(c); continue; } }
          syncChunkMesh(b.grid, c, this.fg); c.mesh && (c.mesh.visible = true); c.wmesh && (c.wmesh.visible = true); r.chunks.push(c);
        }
        if (!r.todo.length && !r.fineReady) {
          r.fineReady = true; const cc = b.coarse.chunk(r.cx, r.cy, r.cz, false); if (cc) { if (cc.mesh) cc.mesh.visible = false; if (cc.wmesh) cc.wmesh.visible = false; }
        } else if (r.chunks) for (const c of r.chunks) { if (c.mesh && !c.mesh.visible && r.fineReady) c.mesh.visible = true; }
      }
      // edits to fine voxels
      if (b.grid.dirtySet.size) for (const c of Array.from(b.grid.dirtySet)) { b.grid.dirtySet.delete(c); if (c.mesh || c.wmesh || c.data || c.uniform) { syncChunkMesh(b.grid, c, this.fg); } }
    }
    idle() { return this.initDone && Array.from(this.regions.values()).every(r => r.fineReady); }
  }

  class World {
    constructor(scene) {
      this.scene = scene; this.bodies = []; this.byId = new Map(); this.time = 0; this.system = null; this.pads = []; this.places = []; this.star = null; this.light = null;
    }
    clear() {
      for (const b of this.bodies) { this.scene.remove(b.root); b.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
      this.bodies = []; this.byId.clear(); this.pads = []; this.places = []; this.star = null;
    }
    addBody(b) { this.bodies.push(b); this.byId.set(b.id, b); this.scene.add(b.root); return b; }
    loadSystem(desc) {
      this.clear(); this.system = desc; this.time = 0;
      const rndAll = mulberry32(hashStr(desc.id));
      // star
      const sm = randomStarModel(desc.star.colors, desc.star.radius, desc.seed + 3), star = new Body(this, { id: "star", name: desc.star.name, kind: "star" }, "star");
      star.grid = sm.toGrid({ unlit: true }); star.gox = sm.sx * COARSE / 2; star.goy = sm.sy * COARSE / 2; star.goz = sm.sz * COARSE / 2; star.R = desc.star.radius; star.boundR = desc.star.radius + 4; star.mass0 = 1e7;
      const sg = groupFromGrid(star.grid); sg.position.set(-star.gox, -star.goy, -star.goz); star.root.add(sg);
      star.root.position.set(...desc.star.pos); this.addBody(star); this.star = star;
      if (!this.light) { this.light = new THREE.PointLight(0xfff2dc, 2.6, 0, 0); this.ambient = new THREE.AmbientLight(0x6c7a99, 0.55); this.scene.add(this.light); this.scene.add(this.ambient); }
      this.light.position.copy(star.root.position);
      const initial = new Map(); initial.set("star", new THREE.Vector3(...desc.star.pos));
      for (const d of desc.bodies) {
        const b = d.kind === "planet" ? this.makePlanet(d) : d.kind === "station" ? this.makeStation(d, rndAll) : this.makePortal(d);
        const parentPos = d.orbit ? (initial.get(d.orbit.center) || new THREE.Vector3()) : new THREE.Vector3();
        const startPos = d.offset ? parentPos.clone().add(new THREE.Vector3(...d.offset)) : new THREE.Vector3(...d.pos);
        initial.set(d.id, startPos);
        b.offset = startPos.clone().sub(parentPos); b.root.position.copy(startPos);
        this.addBody(b);
      }
      this.update(0);
      return this;
    }
    makePlanet(d) {
      const pl = d.planet, rnd = mulberry32(pl.seed ^ 0x51ed);
      const gen = createPlanetGenerator({ seed: pl.seed, R: pl.R, amp: pl.amp, sea: pl.sea, biome: pl.biome, craters: pl.craters });
      const pop = populatePlanet(gen, { id: d.id, name: d.name, padDir: pl.padDir, padName: pl.padName, settlement: pl.settlement, outpost: pl.outpost }, rnd);
      if (pl.maritime) addMaritime(gen, pop.padDir, rnd, pop.out);
      if (pl.trees) stampTrees(gen, rnd, pl.trees, pop.avoid);
      gen.refreshStructBounds();
      const b = new Body(this, d, "planet"); b.gen = gen; b.R = pl.R; b.topR = gen.topRadius(); b.deepR = pl.R - pl.amp * 1.3 - 8; b.boundR = b.topR + 4;
      b.grid = new VoxelGrid({ scale: 1, gen: gen.gen }); b.coarse = new VoxelGrid({ scale: COARSE, gen: gen.gen });
      b.mass0 = gen.volume() * pl.density; b.view = new PlanetView(b);
      for (const p of pop.out.pads) { const s = p.struct, o = new THREE.Vector3(...s.origin), u = new THREE.Vector3(...s.fr.u); b.pads.push({ id: p.id, name: p.name, kind: p.kind, body: b, local: o.clone().addScaledVector(u, p.height), up: u.clone() }); }
      for (const pl2 of pop.out.places) { const s = pl2.struct, o = new THREE.Vector3(...s.origin), u = new THREE.Vector3(...s.fr.u), sd = new THREE.Vector3(...s.fr.s); b.places.push({ name: pl2.name, kind: pl2.kind, body: b, local: o.clone(), up: u.clone(), south: sd.clone(), front: o.clone().addScaledVector(sd, -(s.hz + 2.5)).addScaledVector(u, 1.0), hz: s.hz }); }
      return b;
    }
    makeStation(d, rnd) {
      const model = modelByName(d.model, rnd), b = new Body(this, d, "station"), S = model.scale; b.model = model;
      b.grid = model.toGrid(); b.gox = model.sx * S / 2; b.goy = 0; b.goz = model.sz * S / 2; b.mass0 = model.massProps().mass * 0 + model.massProps().mass;
      const grp = groupFromGrid(b.grid); grp.position.set(-b.gox, 0, -b.goz); b.root.add(grp); b.group = grp;
      b.boundR = Math.hypot(model.sx * S / 2, model.sy * S, model.sz * S / 2) + 20; b.R = Math.max(model.sx, model.sz) * S / 2;
      b.gravityBox = { x0: -model.sx * S / 2 - 6, x1: model.sx * S / 2 + 6, z0: -model.sz * S / 2 - 6, z1: model.sz * S / 2 + 6, y0: -4, y1: 44 };
      for (const p of d.pads || []) { const l = new THREE.Vector3(p.local[0] - b.gox, p.local[1], p.local[2] - b.goz); b.pads.push({ id: p.id, name: p.name, kind: "dock", body: b, local: l, up: new THREE.Vector3(0, 1, 0) }); }
      if (d.shipHome) b.shipHome = new THREE.Vector3(d.shipHome[0] - b.gox, d.shipHome[1], d.shipHome[2] - b.goz);
      b.places.push({ name: d.name, kind: "station", body: b, local: new THREE.Vector3(0, 2, 0), up: new THREE.Vector3(0, 1, 0), front: new THREE.Vector3(0, 2, 0) });
      return b;
    }
    makePortal(d) {
      const model = makePortalRing(12), b = new Body(this, d, "portal"), S = model.scale; b.model = model; b.grid = model.toGrid(); b.gox = model.sx * S / 2; b.goy = 0; b.goz = model.sz * S / 2; b.mass0 = model.massProps().mass;
      const grp = groupFromGrid(b.grid); grp.position.set(-b.gox, 0, -b.goz); b.root.add(grp); b.boundR = 22; b.R = 12; b.to = d.to; b.root.rotation.y = d.yaw || 0; b.centerLocal = new THREE.Vector3(0, 12 + 0.0, 0);
      return b;
    }
    update(dt) {
      this.time += dt; const t = this.time;
      for (const b of this.bodies) {
        if (b.centerId && b.period) {
          const c = this.byId.get(b.centerId); if (c) {
            const a = 2 * Math.PI * t / b.period, cs = Math.cos(a), sn = Math.sin(a), o = b.offset;
            b.root.position.set(c.root.position.x + o.x * cs + o.z * sn, c.root.position.y + o.y, c.root.position.z - o.x * sn + o.z * cs);
          }
        }
        if (b.spin) b.root.rotation.y = 2 * Math.PI * t / b.spin;
      }
      for (const b of this.bodies) { b.root.updateMatrixWorld(true); b.inv.copy(b.root.matrixWorld).invert(); }
    }
    // gravity vector in WORLD space at a world point, and the body responsible
    gravityAt(wp, out) {
      let best = null, bestG = 0; const l = new THREE.Vector3(), gl = new THREE.Vector3();
      for (const b of this.bodies) {
        if (b.type !== "planet" && b.type !== "station") continue;
        if (wp.distanceToSquared(b.root.position) > (b.boundR + (b.type === "planet" ? b.R * 4 + 240 : 60)) ** 2) continue;
        b.worldToLocal(wp, l); if (!b.gravityLocal(l, gl)) continue;
        const g = gl.length(); if (b.type === "station") { best = { body: b, g, dir: b.localDirToWorld(gl.clone().normalize()) }; bestG = Infinity; break; }
        if (g > bestG) { bestG = g; best = { body: b, g, dir: b.localDirToWorld(gl.clone().normalize()) }; }
      }
      if (!best) return null;
      return (out || {}) && Object.assign(out || {}, best);
    }
    // body whose voxels contain a world point, or null
    solidBodyAt(wp) {
      const l = new THREE.Vector3();
      for (const b of this.bodies) {
        if (b.type === "star") continue;
        if (wp.distanceToSquared(b.root.position) > b.boundR * b.boundR) continue;
        b.worldToLocal(wp, l); if (b.solidAt(l.x, l.y, l.z)) return b;
      }
      return null;
    }
    // first voxel hit by a world-space ray. Returns { t, body, x,y,z (grid), id, normal(world) } or null
    raycast(o, d, maxT, opts) {
      let best = null; const lo = new THREE.Vector3(), ld = new THREE.Vector3(), skip = opts && opts.skipWater !== false;
      for (const b of this.bodies) {
        if (b.type === "star") continue;
        const oc = o.clone().sub(b.root.position), bb = oc.dot(d), cc = oc.lengthSq() - b.boundR * b.boundR, disc = bb * bb - cc;
        if (disc < 0 || (-bb + Math.sqrt(disc)) < 0 || (-bb - Math.sqrt(disc)) > maxT) { if (!(cc < 0)) continue; }
        b.worldToLocal(o, lo); b.worldDirToLocal(d, ld);
        const S = b.grid.scale, h = voxelRay(b.grid, (lo.x + b.gox) / S, (lo.y + b.goy) / S, (lo.z + b.goz) / S, ld.x, ld.y, ld.z, maxT / S, id => MAT[id].solid || (!skip && id === M.WATER));
        if (h && (!best || h.t * S < best.t)) best = { t: h.t * S, body: b, x: h.x, y: h.y, z: h.z, id: h.id, normal: b.localDirToWorld(new THREE.Vector3(h.nx, h.ny, h.nz)) };
      }
      return best;
    }
    findPad(id) { for (const b of this.bodies) for (const p of b.pads) if (p.id === id) return p; return null; }
    findPlace(name) { for (const b of this.bodies) for (const p of b.places) if (p.name === name) return p; return null; }
    allPads() { const out = []; for (const b of this.bodies) for (const p of b.pads) out.push(p); return out; }
    prepare(localPointsByBody, ms) { // blocking preload (used before the first frame)
      const t0 = performance.now();
      do { let busy = false; for (const b of this.bodies) if (b.view) { const pts = localPointsByBody.get(b.id) || []; b.view.update(pts, 12); if (!b.view.idle()) busy = true; } if (!busy) break; } while (performance.now() - t0 < ms);
    }
    updateViews(actorPoints, budgetMs) {
      const planets = this.bodies.filter(b => b.view), per = Math.max(1.5, budgetMs / Math.max(1, planets.length));
      for (const b of planets) b.view.update(actorPoints.get(b.id) || [], per);
    }
    dig(body, x, y, z, id) { return body.grid.set(x, y, z, id || 0); }
  }
  // ============================================================
  // 08 ACTORS: every character is a voxel model driven by one controller.
  // Humans, agents, scripts and NPC brains all write the same intent object.
  // Collision is voxel occupancy; gravity comes from the voxel mass of the body underfoot.
  // ============================================================
  let TMP = null;
  const tmp = () => TMP || (TMP = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), g: new THREE.Vector3(), m: new THREE.Matrix4(), q: new THREE.Quaternion(), w: new THREE.Vector3(), l: new THREE.Vector3() });
  function newIntent() { return { forward: 0, turn: 0, strafe: 0, pitch: 0, lookX: 0, lookY: 0, boost: false, sprint: false, brake: false }; }
  const ACTOR_CFG = {
    human: { speed: 5.2, sprint: 9.0, jump: 6.8, turn: 2.3, canFly: true, jetSpeed: 24, precision: 8 },
    rover: { speed: 13, sprint: 13, jump: 0, turn: 1.5, canFly: false, drive: true }
  };
  function rotVec(inv, v, out) { const e = inv.elements, x = v.x, y = v.y, z = v.z; return out.set(e[0] * x + e[4] * y + e[8] * z, e[1] * x + e[5] * y + e[9] * z, e[2] * x + e[6] * y + e[10] * z); }

  class Actor {
    constructor(world, o) {
      this.world = world; this.id = o.id; this.name = o.name || o.id; this.role = o.role || ""; this.kind = o.kind || "human"; this.cfg = ACTOR_CFG[this.kind];
      this.model = o.model; this.obj = new THREE.Group(); this.obj.name = "actor:" + this.id;
      const grp = groupFromGrid(this.model.toGrid()); grp.position.set(-this.model.sx * this.model.scale / 2, 0, -this.model.sz * this.model.scale / 2); this.obj.add(grp); this.body3d = grp;
      world.scene.add(this.obj);
      const pred = this.kind === "human" ? (x => x >= 1 && x <= 4) : null;
      this.pts = this.model.collisionPoints(this.kind === "human" ? 0.5 : 1.0, 80, pred);
      this.pointArr = new Float32Array(this.pts.length * 3); this.pts.forEach((p, i) => { this.pointArr[i * 3] = p[0]; this.pointArr[i * 3 + 1] = p[1]; this.pointArr[i * 3 + 2] = p[2]; });
      this.mass = this.model.massProps().mass; this.eye = this.kind === "human" ? 1.55 : 1.6;
      this.frame = null; this.p = new THREE.Vector3(); this.v = new THREE.Vector3(); this.fwd = new THREE.Vector3(0, 0, -1); this.up = new THREE.Vector3(0, 1, 0); this.nose = new THREE.Vector3(0, 0, -1);
      this.right = new THREE.Vector3(1, 0, 0);
      this.mode = "walk"; this.grounded = false; this.boostT = 0; this.boostPrev = false; this.inWater = false;
      this.intent = newIntent(); this.controller = o.controller || "brain"; this.controllerBy = null; this.brain = o.brain || null; this.say = o.say || []; this.sayIdx = 0;
      this.vehicle = null; this.pilot = null; this.style = o.style; this.stuckT = 0; this.lastPos = new THREE.Vector3(); this.inventory = {}; this.carried = 0; this.events = []; this.hp = 100;
      this.worldPos = new THREE.Vector3(); this.pitchVis = 0; this.rollVis = 0;
    }
    get stepH() { return this.frame ? this.frame.grid.scale * 1.06 : 0.55; }
    updateWorldPos() { if (this.frame) this.frame.localToWorld(this.p, this.worldPos); else this.worldPos.copy(this.p); return this.worldPos; }
    worldUp(out) { return this.frame ? this.frame.localDirToWorld(this.up, out || new THREE.Vector3()) : (out || new THREE.Vector3()).copy(this.up); }
    worldFwd(out) { return this.frame ? this.frame.localDirToWorld(this.fwd, out || new THREE.Vector3()) : (out || new THREE.Vector3()).copy(this.fwd); }
    eyeWorld(out) { const t = tmp(), u = this.up, w = out || new THREE.Vector3(); t.a.copy(this.p).addScaledVector(u, this.eye); return this.frame ? this.frame.localToWorld(t.a, w) : w.copy(t.a); }
  }

  // ---- frames -------------------------------------------------------------------------------------
  function attach(a, B) {
    const t = tmp(), len = a.v.length();
    B.worldToLocal(a.p, a.p); if (len > 0) { rotVec(B.inv, a.v, a.v); }
    rotVec(B.inv, a.fwd, a.fwd).normalize(); rotVec(B.inv, a.up, a.up).normalize(); rotVec(B.inv, a.nose, a.nose).normalize(); a.frame = B;
  }
  function detach(a) {
    const B = a.frame; if (!B) return; const m = B.root.matrixWorld;
    const rot = (v) => { const e = m.elements, x = v.x, y = v.y, z = v.z; return v.set(e[0] * x + e[4] * y + e[8] * z, e[1] * x + e[5] * y + e[9] * z, e[2] * x + e[6] * y + e[10] * z); };
    B.localToWorld(a.p, a.p); rot(a.v); rot(a.fwd).normalize(); rot(a.up).normalize(); rot(a.nose).normalize(); a.frame = null;
  }
  function updateFrame(w, a) {
    const t = tmp();
    // best planet frame at a world point = the one whose surface is nearest (so Luna wins over Haven near Luna)
    const bestPlanet = (wp, margin) => {
      let best = null, bestAlt = 1e9;
      for (const B of w.bodies) {
        if (B.type !== "planet") continue; if (wp.distanceToSquared(B.root.position) > (B.R + FRAME_ALT + 40) ** 2) continue;
        const alt = B.worldToLocal(wp, t.l).length() - B.R; if (alt < FRAME_ALT - 30 - (margin || 0) && alt < bestAlt) { bestAlt = alt; best = B; }
      }
      return best ? { B: best, alt: bestAlt } : null;
    };
    if (a.frame) {
      const B = a.frame; let out = false;
      if (B.type === "planet") {
        out = a.p.length() > B.R + FRAME_ALT;
        if (!out) { const wp = B.localToWorld(a.p, t.w).clone(), alt0 = a.p.length() - B.R, c = bestPlanet(wp); if (c && c.B !== B && c.alt < alt0 - 25) { detach(a); attach(a, c.B); return; } }
      } else if (B.type === "station") { const b = B.gravityBox; out = a.p.x < b.x0 - 8 || a.p.x > b.x1 + 8 || a.p.z < b.z0 - 8 || a.p.z > b.z1 + 8 || a.p.y < b.y0 - 8 || a.p.y > b.y1 + 8; }
      if (out) detach(a);
    }
    if (!a.frame) {
      for (const B of w.bodies) {
        if (B.type !== "station") continue;
        if (a.p.distanceToSquared(B.root.position) > (B.boundR + 260) * (B.boundR + 260)) continue;
        B.worldToLocal(a.p, t.l); const b = B.gravityBox;
        if (t.l.x > b.x0 && t.l.x < b.x1 && t.l.z > b.z0 && t.l.z < b.z1 && t.l.y > b.y0 && t.l.y < b.y1) { attach(a, B); return; }
      }
      const c = bestPlanet(a.p); if (c) attach(a, c.B);
    }
  }
  // put an actor at a world position with a world-space heading, in whatever frame applies there
  function placeActorWorld(w, a, wp, fwdW, upW) {
    a.frame = null; a.p.copy(wp); a.v.set(0, 0, 0); a.fwd.copy(fwdW).normalize(); a.up.copy(upW).normalize(); a.nose.copy(a.fwd); updateFrame(w, a);
  }
  function placeActorLocal(a, B, lp, fwdL, upL) { a.frame = B; a.p.copy(lp); a.v.set(0, 0, 0); a.fwd.copy(fwdL).normalize(); a.up.copy(upL).normalize(); a.nose.copy(a.fwd); a.grounded = false; a.mode = "walk"; a.intent = a.intent || newIntent(); }

  // ---- voxel collision ---------------------------------------------------------------------------
  function basisOf(a) {
    const u = a.up, f = a.fwd; f.addScaledVector(u, -f.dot(u)); if (f.lengthSq() < 1e-8) f.set(Math.abs(u.x) < 0.9 ? 1 : 0, Math.abs(u.x) < 0.9 ? 0 : 1, 0).addScaledVector(u, -u.x * (Math.abs(u.x) < 0.9 ? 1 : 0)); f.normalize();
    a.right.crossVectors(f, u).normalize();
  }
  function blockedAt(w, a, x, y, z) {
    const r = a.right, u = a.up, f = a.fwd, P = a.pointArr, B = a.frame, n = P.length / 3, t = tmp();
    for (let i = 0; i < n; i++) {
      const sx = P[i * 3], sy = P[i * 3 + 1], sz = P[i * 3 + 2];
      const qx = x + r.x * sx + u.x * sy - f.x * sz, qy = y + r.y * sx + u.y * sy - f.y * sz, qz = z + r.z * sx + u.z * sy - f.z * sz;
      if (B) { if (B.solidAt(qx, qy, qz)) return true; }
      else { t.w.set(qx, qy, qz); if (w.solidBodyAt(t.w)) return true; }
    }
    return false;
  }
  // move as far as possible along (vx,vy,vz); returns fraction moved
  function advance(w, a, vx, vy, vz) {
    const p = a.p;
    if (!blockedAt(w, a, p.x + vx, p.y + vy, p.z + vz)) { p.x += vx; p.y += vy; p.z += vz; return 1; }
    let lo = 0, hi = 1;
    for (let i = 0; i < 7; i++) { const m = (lo + hi) / 2; if (!blockedAt(w, a, p.x + vx * m, p.y + vy * m, p.z + vz * m)) lo = m; else hi = m; }
    p.x += vx * lo; p.y += vy * lo; p.z += vz * lo; return lo;
  }
  // full resolution of a displacement: vertical first, then horizontal with step-up and wall sliding
  function moveActor(w, a, dp) {
    const u = a.up, t = tmp(), vert = dp.dot(u);
    const hx = dp.x - u.x * vert, hy = dp.y - u.y * vert, hz = dp.z - u.z * vert;
    // unstick: if embedded, push out along up
    if (blockedAt(w, a, a.p.x, a.p.y, a.p.z)) { for (let i = 0; i < 12 && blockedAt(w, a, a.p.x, a.p.y, a.p.z); i++) a.p.addScaledVector(u, 0.12); }
    let hitDown = false, hitUp = false;
    if (Math.abs(vert) > 1e-6) { const f = advance(w, a, u.x * vert, u.y * vert, u.z * vert); if (f < 0.999) { if (vert < 0) hitDown = true; else hitUp = true; } }
    const hl = Math.hypot(hx, hy, hz);
    let blockedH = false;
    if (hl > 1e-6) {
      const f1 = advance(w, a, hx, hy, hz);
      if (f1 < 0.98) {
        blockedH = true;
        // step up: raise, try the remaining move, settle back down
        const sh = a.stepH, rem = 1 - f1;
        if (a.grounded || hitDown) {
          const px = a.p.x, py = a.p.y, pz = a.p.z;
          const up1 = advance(w, a, u.x * sh, u.y * sh, u.z * sh);
          if (up1 > 0.98) {
            const f2 = advance(w, a, hx * rem, hy * rem, hz * rem);
            if (f2 > 0.5) { advance(w, a, -u.x * sh * 1.05, -u.y * sh * 1.05, -u.z * sh * 1.05); blockedH = false; }
            else { a.p.set(px, py, pz); }
          } else a.p.set(px, py, pz);
        }
        if (blockedH) { // slide along the wall: forward and sideways components separately
          const df = hx * a.fwd.x + hy * a.fwd.y + hz * a.fwd.z, dr = hx * a.right.x + hy * a.right.y + hz * a.right.z;
          if (Math.abs(df) > 1e-6) advance(w, a, a.fwd.x * df * rem, a.fwd.y * df * rem, a.fwd.z * df * rem);
          if (Math.abs(dr) > 1e-6) advance(w, a, a.right.x * dr * rem, a.right.y * dr * rem, a.right.z * dr * rem);
        }
      }
    }
    return { hitDown, hitUp, blockedH };
  }
  function groundedAt(w, a) { const u = a.up; return blockedAt(w, a, a.p.x - u.x * 0.07, a.p.y - u.y * 0.07, a.p.z - u.z * 0.07); }

  // ---- the walker / jetpack / swimmer / driver step -----------------------------------------------
  function stepActor(w, a, dt) {
    updateFrame(w, a);
    const t = tmp(), I = a.intent, cfg = a.cfg; let g = 0;
    if (a.frame) { const gv = a.frame.gravityLocal(a.p, t.g); if (gv) { g = t.g.length(); a.up.copy(t.g).multiplyScalar(-1 / g); } }
    basisOf(a);
    if (a.mode === "ride") return;
    a.inWater = !!(a.frame && a.frame.matAt(a.p.x + a.up.x * 0.9, a.p.y + a.up.y * 0.9, a.p.z + a.up.z * 0.9) === M.WATER);
    const vu0 = a.v.dot(a.up);
    if (a.mode === "jetpack" && !cfg.canFly) a.mode = "walk";
    if (a.mode === "walk" || a.mode === "drive") {
      let spd = (I.sprint ? cfg.sprint : cfg.speed) * (a.inWater ? 0.55 : 1);
      if (cfg.drive) { // vehicle: steering needs motion; throttle is gradual
        const sp = a.v.dot(a.fwd), steerEff = clamp(Math.abs(sp) / 3.5, 0, 1) * (sp < -0.1 ? -1 : 1);
        a.fwd.applyAxisAngle(a.up, -I.turn * cfg.turn * dt * steerEff); basisOf(a);
        const target = I.forward * spd, cur = sp, acc = a.grounded ? 14 : 1.5, nv = cur + clamp(target - cur, -acc * dt, acc * dt);
        const vu = vu0; a.v.copy(a.fwd).multiplyScalar(nv).addScaledVector(a.up, vu);
      } else {
        a.fwd.applyAxisAngle(a.up, -I.turn * cfg.turn * dt); basisOf(a);
        t.a.copy(a.fwd).multiplyScalar(I.forward * spd).addScaledVector(a.right, I.strafe * spd * 0.85);
        t.b.copy(a.v).addScaledVector(a.up, -vu0);                       // horizontal velocity
        const ctl = Math.min(1, (a.grounded ? 14 : 3.2) * dt); t.b.lerp(t.a, ctl);
        a.v.copy(t.b).addScaledVector(a.up, vu0);
      }
      // jump / swim up / jetpack ignition
      if (I.boost && !a.boostPrev && cfg.jump > 0 && (a.grounded || a.inWater)) { a.v.addScaledVector(a.up, (a.inWater ? 3.4 : cfg.jump) - a.v.dot(a.up)); a.grounded = false; a.boostT = 0; }
      a.boostT = I.boost ? a.boostT + dt : 0;
      if (I.boost && cfg.canFly && !a.grounded && !a.inWater && a.boostT > 0.28) { a.mode = "jetpack"; a.nose.copy(a.fwd).multiplyScalar(0.77).addScaledVector(a.up, 0.64).normalize(); a.events.push("KINETIC FIELD // ENGAGED"); }
      if (g > 0) { let vu = a.v.dot(a.up); vu -= g * (a.inWater ? 0.22 : 1) * dt; if (vu < -45) vu = -45; if (a.inWater) { vu *= 1 - 2.2 * dt; a.v.multiplyScalar(1 - 1.2 * dt); } a.v.addScaledVector(a.up, vu - a.v.dot(a.up)); }
    } else if (a.mode === "jetpack") {
      // nose-relative flight: yaw about up, pitch about right, thrust along the nose
      if (g > 0 || a.frame) { a.nose.applyAxisAngle(a.up, -I.turn * 2.2 * dt); } else a.nose.applyAxisAngle(a.up, -I.turn * 2.2 * dt);
      t.c.crossVectors(a.nose, a.up); if (t.c.lengthSq() < 1e-4) t.c.copy(a.right); t.c.normalize(); a.right.copy(t.c);
      if (I.pitch) { a.nose.applyAxisAngle(a.right, I.pitch * 1.6 * dt); const d = a.nose.dot(a.up); if (d > 0.985) a.nose.addScaledVector(a.up, 0.985 - d).normalize(); else if (d < -0.985) a.nose.addScaledVector(a.up, -0.985 - d).normalize(); }
      const prec = Math.abs(I.forward) + Math.abs(I.strafe) > 0.02;
      if (I.boost) { t.a.copy(a.nose).multiplyScalar(cfg.jetSpeed).addScaledVector(a.right, I.strafe * cfg.precision); a.v.copy(t.a); }
      else if (prec) { t.a.copy(a.nose).multiplyScalar(I.forward * cfg.precision).addScaledVector(a.right, I.strafe * cfg.precision); a.v.lerp(t.a, Math.min(1, 8 * dt)); }
      else if (g > 0) { a.v.addScaledVector(t.g, dt); a.v.multiplyScalar(1 - 0.35 * dt); }
      else a.v.multiplyScalar(1 - 1.2 * dt);
      a.fwd.copy(a.nose).addScaledVector(a.up, -a.nose.dot(a.up)); if (a.fwd.lengthSq() > 1e-6) a.fwd.normalize();
      basisOf(a);
    }
    a.boostPrev = I.boost;
    // integrate with collision in small pieces
    const dp = t.c.copy(a.v).multiplyScalar(dt), n = Math.max(1, Math.ceil(dp.length() / 0.4)); dp.multiplyScalar(1 / n);
    let hitDown = false, hitUp = false;
    for (let i = 0; i < n; i++) { const r = moveActor(w, a, dp); hitDown = hitDown || r.hitDown; hitUp = hitUp || r.hitUp; if (r.hitDown) { const vu = a.v.dot(a.up); if (vu < 0) a.v.addScaledVector(a.up, -vu); } if (r.hitUp) { const vu = a.v.dot(a.up); if (vu > 0) a.v.addScaledVector(a.up, -vu); } if (r.blockedH && a.mode !== "jetpack") { /* arcade: lose into-wall speed */ } }
    const wasG = a.grounded; a.grounded = groundedAt(w, a);
    // stay glued to the ground when walking down steps and slopes
    if (!a.grounded && wasG && a.mode !== "jetpack" && a.v.dot(a.up) <= 0.01 && !a.inWater) { const f = advance(w, a, -a.up.x * a.stepH, -a.up.y * a.stepH, -a.up.z * a.stepH); if (f < 0.999) a.grounded = true; else a.p.addScaledVector(a.up, a.stepH * 0); }
    if (a.grounded) { const vu = a.v.dot(a.up); if (vu < 0) a.v.addScaledVector(a.up, -vu); }
    if (a.mode === "jetpack" && a.grounded && !I.boost) { a.mode = "walk"; a.events.push("KINETIC FIELD // LANDED"); }
    if (a.mode === "jetpack" && a.inWater) { a.mode = "walk"; }
  }

  // ---- visuals -------------------------------------------------------------------------------------
  const _m4 = () => tmp().m;
  function syncActorObject(a) {
    a.updateWorldPos();
    if (a.mode === "ride") { a.obj.visible = false; return; }
    a.obj.visible = true;
    const t = tmp(); a.obj.position.copy(a.worldPos);
    const r = a.worldRightOut || (a.worldRightOut = new THREE.Vector3()), u = a.worldUpOut || (a.worldUpOut = new THREE.Vector3()), f = a.worldFwdOut || (a.worldFwdOut = new THREE.Vector3());
    const forward = a.mode === "jetpack" ? a.nose : a.fwd;
    if (a.frame) { a.frame.localDirToWorld(a.right, r); a.frame.localDirToWorld(a.up, u); a.frame.localDirToWorld(forward, f); } else { r.copy(a.right); u.copy(a.up); f.copy(forward); }
    if (a.mode === "jetpack") { r.crossVectors(f, u).normalize(); u.crossVectors(r, f).normalize(); }
    t.m.makeBasis(r, u, t.a.copy(f).negate()); a.obj.quaternion.setFromRotationMatrix(t.m);
    a.obj.updateMatrixWorld(true);
  }

  // ---- NPC brains ----------------------------------------------------------------------------------
  function brainStep(w, a, dt) {
    const I = a.intent, b = a.brain; if (!b || a.mode === "ride") { return; }
    I.forward = 0; I.turn = 0; I.strafe = 0; I.boost = false; I.sprint = false;
    if (b.type === "idle") { b.t = (b.t || 0) + dt; if (b.t > (b.next || 4)) { b.t = 0; b.next = 3 + Math.random() * 5; b.turnT = 0.5 + Math.random() * 0.6; b.turnDir = Math.random() < 0.5 ? -1 : 1; } if (b.turnT > 0) { b.turnT -= dt; I.turn = b.turnDir * 0.5; } return; }
    if (b.type !== "patrol" && b.type !== "wander") return;
    if (!b.home) { b.home = a.p.clone(); b.target = null; }
    b.stuck = (b.stuck || 0);
    if (!b.target || a.p.distanceTo(b.target) < 1.3 || b.stuck > 1.6) {
      const ang = Math.random() * 6.283, rad = (b.r || 8) * (0.35 + Math.random() * 0.65);
      const rr = new THREE.Vector3().crossVectors(a.fwd, a.up).normalize();
      b.target = b.home.clone().addScaledVector(a.fwd, Math.cos(ang) * rad).addScaledVector(rr, Math.sin(ang) * rad); b.stuck = 0; b.lastP = a.p.clone();
    }
    const d = tmp().a.copy(b.target).sub(a.p); d.addScaledVector(a.up, -d.dot(a.up)); if (d.lengthSq() < 1e-6) return; d.normalize();
    const ang = Math.atan2(d.dot(a.right), d.dot(a.fwd));
    I.turn = clamp(ang * 2.2, -1, 1); I.forward = Math.abs(ang) < 0.8 ? 0.55 : 0.1;
    b.lastT = (b.lastT || 0) + dt;
    if (b.lastT > 0.5) { const moved = a.p.distanceTo(b.lastP || a.p); b.stuck = moved < 0.25 ? b.stuck + 0.5 : 0; b.lastP = a.p.clone(); b.lastT = 0; if (moved < 0.25 && a.grounded && b.stuck > 0.9) I.boost = true; }
  }

  // ---- digging, debris and cargo (voxel mass you can carry) ---------------------------------------
  const CARGO_FACTOR = 0.04; // tonnes carried per dug voxel per unit density (arcade scale)
  class Debris {
    constructor(world, body, lp, mat) { this.world = world; this.body = body; this.p = lp.clone(); this.v = new THREE.Vector3((Math.random() - 0.5) * 2, 2 + Math.random() * 2, (Math.random() - 0.5) * 2); this.mat = mat; this.life = 120; this.mesh = new THREE.Mesh(DEBRIS_GEO || (DEBRIS_GEO = new THREE.BoxGeometry(0.3, 0.3, 0.3)), new THREE.MeshLambertMaterial({ color: new THREE.Color(...MAT[mat].c) })); world.scene.add(this.mesh); }
  }
  let DEBRIS_GEO = null;
  function stepDebris(w, dt, actors) {
    const list = w.debris || (w.debris = []), t = tmp();
    for (let i = list.length - 1; i >= 0; i--) {
      const d = list[i]; d.life -= dt; const B = d.body;
      const gv = B.gravityLocal(d.p, t.g); if (gv) d.v.addScaledVector(t.g, dt);
      const upv = t.g.lengthSq() ? t.a.copy(t.g).normalize().negate() : t.a.set(0, 1, 0);
      let nx = d.p.clone().addScaledVector(d.v, dt);
      if (B.solidAt(nx.x, nx.y, nx.z)) { d.v.addScaledVector(upv, -d.v.dot(upv)); nx = d.p.clone().addScaledVector(d.v, dt); nx.addScaledVector(upv, 0.04); }
      if (B.solidAt(nx.x, nx.y, nx.z)) { d.v.multiplyScalar(0); d.p.addScaledVector(upv, 0.02); } else d.p.copy(nx);
      d.mesh.position.copy(B.localToWorld(d.p, t.w)); d.mesh.rotation.y += dt;
      for (const a of actors) { if (a.frame === B && a.mode !== "ride" && d.life < 119 && a.p.distanceToSquared(d.p) < 64) { t.c.copy(a.p).addScaledVector(a.up, 0.8).sub(d.p).normalize(); d.v.addScaledVector(t.c, 28 * dt); d.v.multiplyScalar(1 - 1.5 * dt); break; } }
      let take = null; for (const a of actors) { if (a.frame !== B || a.mode === "ride") continue; if (a.p.distanceToSquared(d.p) < 2.6 * 2.6 && d.life < 118) { take = a; break; } }
      if (take) { addCargo(take, d.mat, 1); w.scene.remove(d.mesh); d.mesh.geometry !== DEBRIS_GEO && d.mesh.geometry.dispose(); d.mesh.material.dispose(); list.splice(i, 1); }
      else if (d.life <= 0) { w.scene.remove(d.mesh); d.mesh.material.dispose(); list.splice(i, 1); }
    }
  }
  function addCargo(a, mat, n) { const k = MAT[mat].name; a.inventory[k] = (a.inventory[k] || 0) + n; a.carried += MAT[mat].d * CARGO_FACTOR * n; a.events.push("COLLECTED " + k.toUpperCase() + " x" + n); }
  function eyeRay(a) {
    const t = tmp(), eye = a.eyeWorld(new THREE.Vector3()), dir = a.worldFwd(new THREE.Vector3());
    if (a.mode === "jetpack") { if (a.frame) a.frame.localDirToWorld(a.nose, dir); else dir.copy(a.nose); }
    const up = a.worldUp(new THREE.Vector3()); dir.addScaledVector(up, (a.lookPitch || 0)).normalize();
    return { eye, dir };
  }
  function digAction(w, a, range) {
    const { eye, dir } = eyeRay(a), h = w.raycast(eye, dir, range || 7);
    if (!h) return { ok: false, reason: "nothing in reach" };
    if (h.body.type !== "planet") return { ok: false, reason: "only planetary ground can be dug" };
    const id = h.id; if (!MAT[id].solid) return { ok: false, reason: "not solid" };
    h.body.grid.set(h.x, h.y, h.z, M.AIR);
    const S = h.body.grid.scale, lp = new THREE.Vector3((h.x + 0.5) * S, (h.y + 0.5) * S, (h.z + 0.5) * S);
    (w.debris || (w.debris = [])).push(new Debris(w, h.body, lp, id));
    return { ok: true, dug: MAT[id].name, at: [h.x, h.y, h.z], planetMassTonnes: Math.round(h.body.mass) };
  }
  function placeAction(w, a, matName) {
    const key = String(matName || "dirt").toLowerCase(), id = Object.keys(M).find(k => k.toLowerCase() === key) ? M[Object.keys(M).find(k => k.toLowerCase() === key)] : null;
    if (id === null || id === undefined || !MAT[id].solid) return { ok: false, reason: "unknown or unplaceable material" };
    if (!(a.inventory[MAT[id].name] > 0)) return { ok: false, reason: "you are not carrying any " + MAT[id].name };
    const { eye, dir } = eyeRay(a), h = w.raycast(eye, dir, 7);
    if (!h || h.body.type !== "planet") return { ok: false, reason: "aim at planetary ground" };
    const nx = h.x + Math.round(h.normal.x * 0 + 0), B = h.body, S = B.grid.scale; // face neighbour in grid space
    const nl = B.worldDirToLocal(h.normal, new THREE.Vector3()), ax = Math.abs(nl.x), ay = Math.abs(nl.y), az = Math.abs(nl.z);
    const px = h.x + (ax >= ay && ax >= az ? Math.sign(nl.x) : 0), py = h.y + (ay > ax && ay >= az ? Math.sign(nl.y) : 0), pz = h.z + (az > ax && az > ay ? Math.sign(nl.z) : 0);
    const cur = B.grid.get(px, py, pz); if (MAT[cur].solid) return { ok: false, reason: "no room" };
    const c = new THREE.Vector3((px + 0.5) * S, (py + 0.5) * S, (pz + 0.5) * S); if (a.frame === B && a.p.distanceTo(c) < 1.1) return { ok: false, reason: "you are standing there" };
    B.grid.set(px, py, pz, id); a.inventory[MAT[id].name]--; a.carried = Math.max(0, a.carried - MAT[id].d * CARGO_FACTOR);
    return { ok: true, placed: MAT[id].name, at: [px, py, pz] };
  }
  // ============================================================
  // 09 SHIPS, VEHICLES, PORTALS
  // The ship is a voxel model. Its mass sets how hard it accelerates (thrust force / mass, cargo included);
  // its hull collision points come from its voxels; it collides with every voxel body, stations included.
  // ============================================================
  const SHIP_THRUST = 4700, SHIP_V = 42, SHIP_VBOOST = 65;
  class Ship {
    constructor(world, o) {
      this.world = world; this.id = o.id || "space-rv"; this.name = o.name || "Space RV"; this.kind = "ship";
      this.model = makeShip(o); this.obj = new THREE.Group(); this.obj.name = "ship:" + this.id;
      const grp = groupFromGrid(this.model.toGrid()); grp.position.set(-this.model.sx * this.model.scale / 2, 0, -this.model.sz * this.model.scale / 2); this.obj.add(grp);
      world.scene.add(this.obj);
      const pts = this.model.collisionPoints(0.9, 110); this.hull = pts.map(p => new THREE.Vector3(p[0], p[1] - 0.45, p[2]));
      this.hullMass = this.model.massProps().mass; this.p = new THREE.Vector3(); this.q = new THREE.Quaternion(); this.v = new THREE.Vector3();
      this.pilot = null; this.attach = null; this.assist = null; this.parked = false; this.idle = newIntent(); this.contact = false; this.events = []; this.lastNormal = new THREE.Vector3(0, 1, 0);
      this.cameraEye = new THREE.Vector3(0, 2.6, -3.0);
    }
    get mass() { return this.hullMass + (this.pilot ? this.pilot.carried : 0); }
    get accel() { return SHIP_THRUST / this.mass; }
    get landed() { return !!this.attach; }
    nose(out) { return (out || new THREE.Vector3()).set(0, 0, -1).applyQuaternion(this.q); }
    upV(out) { return (out || new THREE.Vector3()).set(0, 1, 0).applyQuaternion(this.q); }
    rightV(out) { return (out || new THREE.Vector3()).set(1, 0, 0).applyQuaternion(this.q); }
    syncObject() { this.obj.position.copy(this.p); this.obj.quaternion.copy(this.q); this.obj.updateMatrixWorld(true); }
  }
  function voxelNormalAt(w, body, wp) {
    const t = tmp(), l = body.worldToLocal(wp, t.l), S = body.grid.scale, n = new THREE.Vector3();
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) if (!body.solidAt(l.x + dx * S, l.y + dy * S, l.z + dz * S)) n.x += dx, n.y += dy, n.z += dz;
    if (n.lengthSq() < 1e-6) { if (body.type === "planet") n.copy(l).normalize(); else n.set(0, 1, 0); }
    n.normalize(); return body.localDirToWorld(n, new THREE.Vector3());
  }
  function hullHit(w, s, p, q) {
    const t = tmp(); const pw = t.w;
    for (let i = 0; i < s.hull.length; i++) { pw.copy(s.hull[i]).applyQuaternion(q).add(p); const b = w.solidBodyAt(pw); if (b) return { body: b, point: pw.clone() }; }
    return null;
  }
  function placeShipOnPad(w, s, pad, yaw) {
    const B = pad.body, wp = B.localToWorld(pad.local, new THREE.Vector3()), up = B.localDirToWorld(pad.up, new THREE.Vector3());
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up); const qy = new THREE.Quaternion().setFromAxisAngle(up, yaw || 0); s.q.copy(qy.multiply(q)); s.p.copy(wp).addScaledVector(up, 0.05); s.v.set(0, 0, 0);
    attachShip(s, B); s.syncObject();
  }
  function attachShip(s, B) { const t = tmp(); s.attach = { body: B, lp: B.worldToLocal(s.p, new THREE.Vector3()), lq: new THREE.Quaternion().setFromRotationMatrix(B.root.matrixWorld).invert().multiply(s.q) }; s.v.set(0, 0, 0); s.assist = null; }
  function stepShip(w, s, dt) {
    const t = tmp(), I = s.pilot ? s.pilot.intent : s.idle;
    if (s.attach) {
      const B = s.attach.body; B.localToWorld(s.attach.lp, s.p); s.q.setFromRotationMatrix(B.root.matrixWorld).multiply(s.attach.lq); s.v.set(0, 0, 0);
      if (s.pilot && Math.abs(I.turn) > 0.05) s.attach.lq.multiply(t.q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -I.turn * 1.2 * dt));
      const wantsOff = s.pilot && (Math.abs(I.forward) > 0.05 || I.boost || Math.abs(I.strafe) > 0.05 || I.pitch > 0.2 || s.assist);
      if (wantsOff) { const gw = w.gravityAt(s.p); const up = gw ? gw.dir.clone().negate() : s.upV(); s.attach = null; s.v.copy(up).multiplyScalar(2.6); s.p.addScaledVector(up, 0.7); s.events.push("LIFTOFF"); }
      else { s.syncObject(); return; }
    }
    const gw = w.gravityAt(s.p), gUp = gw ? gw.dir.clone().negate() : new THREE.Vector3(0, 1, 0);
    // ---- landing assist autopilot
    if (s.assist) {
      const pad = s.assist.pad, B = pad.body, P = B.localToWorld(pad.local, t.a), up = B.localDirToWorld(pad.up, t.b);
      const manual = Math.abs(I.forward) > 0.25 || Math.abs(I.turn) > 0.25 || Math.abs(I.pitch) > 0.25 || Math.abs(I.strafe) > 0.25;
      if (manual || s.p.distanceTo(P) > 400) { s.assist = null; s.events.push("LANDING ASSIST // OFF"); }
      else {
        const rel = s.p.clone().sub(P), h = rel.dot(up), lat = rel.clone().addScaledVector(up, -h), latD = lat.length();
        const vt = new THREE.Vector3();
        if (s.assist.phase === "approach") {
          const H = P.clone().addScaledVector(up, 34), d = H.clone().sub(s.p), dist = d.length();
          if (h < 26 && latD > 36) { vt.copy(up).multiplyScalar(18); s.assist.climbing = true; }      // clear the terrain first, then cruise in
          else { vt.copy(d).normalize().multiplyScalar(Math.min(58, dist * 0.55 + 6)); s.assist.climbing = false; }
          if (dist < 12) s.assist.phase = "descend";
        } else {
          vt.copy(lat).multiplyScalar(-1.4); if (vt.length() > 9) vt.setLength(9); vt.addScaledVector(up, -clamp(h * 0.45 + 1.1, 1.1, 12));
        }
        const dv = vt.sub(s.v), a = Math.max(s.accel, 20) * dt; if (dv.length() > a) dv.setLength(a); s.v.add(dv);
        // orient: ship up toward pad up, keep heading
        const cur = s.upV(new THREE.Vector3()), qa = new THREE.Quaternion().setFromUnitVectors(cur, up); s.q.premultiply(new THREE.Quaternion().identity().slerp(qa, Math.min(1, 1.8 * dt)));
      }
    } else {
      // ---- manual: yaw about the ship's up, pitch about its right, then self-level against the horizon
      const qy = t.q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -I.turn * 1.55 * dt); s.q.multiply(qy);
      if (I.pitch) { const qp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), I.pitch * 1.25 * dt); s.q.multiply(qp); }
      const r = s.rightV(new THREE.Vector3()), err = r.dot(gUp);
      if (Math.abs(err) > 1e-4 && !I.pitch) { const ql = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, -1), err * 2.2 * dt); s.q.multiply(ql); }
      s.q.normalize();
      const nose = s.nose(new THREE.Vector3()), right = s.rightV(new THREE.Vector3()), maxV = I.boost ? SHIP_VBOOST : SHIP_V;
      const vt = nose.multiplyScalar(I.forward * maxV).addScaledVector(right, I.strafe * maxV * 0.6), thrusting = Math.abs(I.forward) + Math.abs(I.strafe) > 0.03;
      if (s.parked) { s.v.multiplyScalar(Math.max(0, 1 - 6 * dt)); }
      else if (thrusting) { const dv = vt.sub(s.v), a = s.accel * dt * (I.boost ? 1.4 : 1); if (dv.length() > a) dv.setLength(a); s.v.add(dv); }
      else s.v.multiplyScalar(Math.max(0, 1 - (I.brake ? 4.5 : 1.3) * dt));
      if (gw && !s.parked) s.v.addScaledVector(gw.dir, gw.g * 0.35 * dt);
    }
    // ---- integrate with voxel hull collision (first free the hull if it is embedded)
    for (let k = 0; k < 20 && hullHit(w, s, s.p, s.q); k++) s.p.addScaledVector(gw ? gUp : s.upV(t.a), 0.1);
    const len = s.v.length() * dt, n = Math.max(1, Math.ceil(len / 0.45)), step = s.v.clone().multiplyScalar(dt / n), np = new THREE.Vector3();
    s.contact = false;
    for (let i = 0; i < n; i++) {
      np.copy(s.p).add(step);
      const hit = hullHit(w, s, np, s.q);
      if (!hit) { s.p.copy(np); continue; }
      s.contact = true;
      const nrm = voxelNormalAt(w, hit.body, hit.point); s.lastNormal.copy(nrm);
      const vn = s.v.dot(nrm); if (vn < 0) s.v.addScaledVector(nrm, -vn * 1.12);
      step.copy(s.v).multiplyScalar(dt / n); s.p.addScaledVector(nrm, 0.02);
      // touchdown: gentle, on something that faces "up", with no strong thrust request
      const speed = s.v.length(), upOk = nrm.dot(gUp) > 0.72;
      if (upOk && speed < 8 && vn < -0.25 && (s.assist || (Math.abs(I.forward) < 0.2 && !I.boost))) {
        const qa = new THREE.Quaternion().setFromUnitVectors(s.upV(new THREE.Vector3()), nrm); s.q.premultiply(qa);   // sit flat on whatever you landed on
        for (let k = 0; k < 10 && hullHit(w, s, s.p, s.q); k++) s.p.addScaledVector(nrm, 0.08);
        attachShip(s, hit.body); s.events.push("TOUCHDOWN // " + (nearestPadName(w, s.p) || hit.body.name).toUpperCase()); break;
      }
    }
    s.syncObject();
  }
  function nearestPadName(w, p) { let best = null, bd = 60; for (const pad of w.allPads()) { const d = pad.body.localToWorld(pad.local, tmp().a).distanceTo(p); if (d < bd) { bd = d; best = pad.name; } } return best; }
  function startAssist(w, s, padId) {
    let best = null, bd = 1e9; const t = tmp();
    for (const pad of w.allPads()) { if (padId && pad.id !== padId) continue; const d = pad.body.localToWorld(pad.local, t.a).distanceTo(s.p); if (d < bd) { bd = d; best = pad; } }
    if (padId && !best) return { ok: false, reason: "unknown pad id" };
    if (!best || bd > (padId ? 700 : 260)) return { ok: false, reason: "no landing beacon within 260 m", nearest: best ? { id: best.id, distanceM: Math.round(bd) } : null };
    s.assist = { pad: best, phase: "approach" }; s.parked = false; s.events.push("LANDING ASSIST // " + best.name.toUpperCase());
    return { ok: true, pad: best.id, distanceM: Math.round(bd) };
  }

  // ---- boarding and leaving vehicles
  function nearestVehicle(w, a, only) {
    let best = null, bd = 1e9; const t = tmp(); a.updateWorldPos();
    for (const s of w.ships) { if (only && s.id !== only) continue; const d = s.p.distanceTo(a.worldPos); if (d < 12 && d < bd) { bd = d; best = s; } }
    for (const r of w.rovers) { if (r.pilot || (only && r.id !== only)) continue; r.updateWorldPos(); const d = r.worldPos.distanceTo(a.worldPos); if (d < 7 && d < bd) { bd = d; best = r; } }
    return best ? { v: best, d: bd } : null;
  }
  function boardVehicle(w, a, only) {
    if (a.mode === "ride") return { ok: false, reason: "already aboard" };
    const nv = nearestVehicle(w, a, only); if (!nv) return { ok: false, reason: "no vehicle within reach (ships 12 m, rovers 7 m)" };
    const v = nv.v; if (v.pilot) return { ok: false, reason: "occupied" };
    v.pilot = a; a.vehicle = v; a.mode = "ride"; if (v.kind === "rover") { v.intent = a.intent; } a.events.push("BOARDED " + v.name.toUpperCase());
    return { ok: true, vehicle: v.id };
  }
  function leaveVehicle(w, a) {
    const v = a.vehicle; if (!v) return { ok: false, reason: "not in a vehicle" };
    let wp, up, fwd;
    if (v.kind === "ship") {
      up = v.landed ? v.upV(new THREE.Vector3()) : v.upV(new THREE.Vector3()); const r = v.rightV(new THREE.Vector3()); wp = v.p.clone().addScaledVector(r, 4.4).addScaledVector(up, 0.4); fwd = v.nose(new THREE.Vector3());
    } else { v.updateWorldPos(); up = v.worldUp(new THREE.Vector3()); wp = v.worldPos.clone().addScaledVector(v.right.clone().applyQuaternion(new THREE.Quaternion()), 0); const rw = v.frame ? v.frame.localDirToWorld(v.right, new THREE.Vector3()) : v.right.clone(); wp.addScaledVector(rw, 2.6).addScaledVector(up, 0.5); fwd = v.worldFwd(new THREE.Vector3()); }
    v.pilot = null; if (v.kind === "rover") { v.intent = newIntent(); v.mode = "drive"; }
    a.vehicle = null; a.mode = "walk"; a.intent.boost = false; a.boostPrev = true;
    placeActorWorld(w, a, wp, fwd, up); if (!a.frame) a.mode = "jetpack";
    a.events.push("DISEMBARKED"); return { ok: true, mode: a.mode };
  }

  // ---- portals: flying (or jetpacking) through the gate rings warps you to the linked system
  function checkPortals(w, movers) {
    const t = tmp();
    for (const B of w.bodies) {
      if (B.type !== "portal") continue;
      for (const m of movers) {
        const wp = m.worldPoint(); if (!wp) continue;
        if (wp.distanceToSquared(B.root.position) > 40 * 40) continue;
        B.worldToLocal(wp, t.l); const lx = t.l.x, ly = t.l.y - (B.R + 0.5), lz = t.l.z;
        if (Math.abs(lz) < 2.6 && Math.hypot(lx, ly) < B.R - 2) return { portal: B, mover: m };
      }
    }
    return null;
  }
  // ============================================================
  // 10 INPUT, CAMERA, HUD
  // The camera is occluded by voxels: its ray is a voxel traversal through every body.
  // ============================================================
  const keys = {};
  const touch = { moveX: 0, moveY: 0, lookX: 0, lookY: 0, boost: false };
  let lookYaw = 0, lookPitch = 0, camDist = 0, firstPerson = false;
  function isTyping() { const el = document.activeElement; return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable); }
  const GAME_KEYS = new Set(["w", "a", "s", "d", "q", "e", " ", "shift", "arrowup", "arrowdown", "arrowleft", "arrowright", "x", "c", "b", "f", "v", "r", "l", "p", "h"]);
  let gameRef = null;
  function onKeyDown(e) {
    if (isTyping() || destroyed) return;
    const k = (e.key || "").toLowerCase(); if (!GAME_KEYS.has(k)) return;
    e.preventDefault(); if (e.repeat) return; keys[k] = true;
    if (!gameRef) return; const g = gameRef, a = g.localActor(); if (!a) return;
    const act = { b: a.mode === "ride" ? "leave_vehicle" : "board", x: "dig", c: "place", f: "talk", v: "toggle_view", r: "recenter_camera", l: "landing_assist", p: "park", h: "toggle_help" }[k];
    if (act) g.runAction(a, act, act === "place" ? { material: g.placeMaterial } : {});
  }
  function onKeyUp(e) { const k = (e.key || "").toLowerCase(); if (GAME_KEYS.has(k)) keys[k] = false; }
  function onBlur() { for (const k of Object.keys(keys)) keys[k] = false; }
  document.addEventListener("keydown", onKeyDown); document.addEventListener("keyup", onKeyUp); window.addEventListener("blur", onBlur);
  cleanup.push(() => { document.removeEventListener("keydown", onKeyDown); document.removeEventListener("keyup", onKeyUp); window.removeEventListener("blur", onBlur); });
  // pointer look (drag) and zoom
  let drag = null;
  root.addEventListener("pointerdown", e => { if (e.target !== root && e.target.tagName !== "CANVAS") return; drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
  window.addEventListener("pointermove", e => { if (!drag || e.pointerId !== drag.id) return; lookYaw -= (e.clientX - drag.x) * 0.005; lookPitch = clamp(lookPitch + (e.clientY - drag.y) * 0.004, -1.2, 1.2); drag.x = e.clientX; drag.y = e.clientY; });
  window.addEventListener("pointerup", () => { drag = null; });
  root.addEventListener("wheel", e => { camDist = clamp(camDist + Math.sign(e.deltaY) * 0.8, -3, 10); e.preventDefault(); }, { passive: false });
  // touch pads (left: move, right: look/pitch) + buttons
  function makeTouchPad(side) {
    const el = document.createElement("div"); el.style.cssText = "position:absolute;bottom:56px;" + side + ":22px;width:120px;height:120px;border-radius:60px;border:2px solid rgba(160,200,230,.35);background:rgba(20,40,60,.25);touch-action:none;display:none;";
    const knob = document.createElement("div"); knob.style.cssText = "position:absolute;left:40px;top:40px;width:40px;height:40px;border-radius:20px;background:rgba(190,225,250,.45);"; el.appendChild(knob); root.appendChild(el);
    let id = null; const set = (e, up) => { const r = el.getBoundingClientRect(); const x = clamp((e.clientX - r.left - 60) / 50, -1, 1), y = clamp((e.clientY - r.top - 60) / 50, -1, 1); if (up) { knob.style.left = knob.style.top = "40px"; return [0, 0]; } knob.style.left = 40 + x * 40 + "px"; knob.style.top = 40 + y * 40 + "px"; return [x, y]; };
    el.addEventListener("pointerdown", e => { id = e.pointerId; el.setPointerCapture(id); const [x, y] = set(e); if (side === "left") { touch.moveX = x; touch.moveY = y; } else { touch.lookX = x; touch.lookY = y; } e.stopPropagation(); });
    el.addEventListener("pointermove", e => { if (e.pointerId !== id) return; const [x, y] = set(e); if (side === "left") { touch.moveX = x; touch.moveY = y; } else { touch.lookX = x; touch.lookY = y; } });
    const end = e => { if (e.pointerId !== id) return; id = null; set(e, true); if (side === "left") { touch.moveX = touch.moveY = 0; } else { touch.lookX = touch.lookY = 0; } };
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end); return el;
  }
  const padL = makeTouchPad("left"), padR = makeTouchPad("right");
  function makeBtn(label, bottom, right, fn, hold) {
    const b = document.createElement("button"); b.textContent = label; b.style.cssText = "position:absolute;bottom:" + bottom + "px;right:" + right + "px;width:62px;height:40px;background:rgba(20,40,60,.55);color:#cfe6f5;border:1px solid rgba(160,200,230,.4);border-radius:6px;font:11px ui-monospace,monospace;touch-action:none;display:none;";
    if (hold) { b.addEventListener("pointerdown", e => { touch.boost = true; e.stopPropagation(); }); const up = () => { touch.boost = false; }; b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); }
    else b.addEventListener("click", e => { fn(); e.stopPropagation(); });
    root.appendChild(b); return b;
  }
  const touchBtns = [makeBtn("BOOST", 180, 20, null, true), makeBtn("BOARD", 130, 20, () => { const a = gameRef && gameRef.localActor(); if (a) gameRef.runAction(a, a.mode === "ride" ? "leave_vehicle" : "board", {}); }), makeBtn("LAND", 130, 90, () => { const a = gameRef && gameRef.localActor(); if (a) gameRef.runAction(a, "landing_assist", {}); }), makeBtn("DIG", 180, 90, () => { const a = gameRef && gameRef.localActor(); if (a) gameRef.runAction(a, "dig", {}); }), makeBtn("VIEW", 80, 20, () => { const a = gameRef && gameRef.localActor(); if (a) gameRef.runAction(a, "toggle_view", {}); })];
  const isTouch = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
  if (isTouch) { padL.style.display = padR.style.display = "block"; touchBtns.forEach(b => { b.style.display = "block"; }); }
  // keyboard + touch -> intent, per control mode
  function humanIntent(mode, out) {
    const k = n => keys[n] ? 1 : 0, I = out || newIntent();
    I.forward = clamp(k("w") - k("s") - touch.moveY, -1, 1); I.turn = clamp(k("d") - k("a") + touch.moveX, -1, 1); I.strafe = clamp(k("e") - k("q"), -1, 1);
    I.pitch = clamp(k("arrowup") - k("arrowdown") - touch.lookY, -1, 1); I.lookX = k("arrowright") - k("arrowleft") + touch.lookX; I.lookY = 0;
    I.boost = !!keys[" "] || touch.boost; I.sprint = !!keys["shift"]; I.brake = false;
    if (mode === "jetpack") { I.pitch = clamp(I.pitch + (k("w") - k("s")), -1, 1); I.forward = 0; }
    else if (mode === "ship") { I.brake = !!keys["shift"]; I.sprint = false; }
    else if (mode === "drive") { I.brake = !!keys[" "]; I.boost = false; }
    else if (mode === "walk") { I.pitch = 0; }
    return I;
  }

  class CameraRig {
    constructor(camera) { this.camera = camera; this.pos = new THREE.Vector3(); this.up = new THREE.Vector3(0, 1, 0); this.heading = new THREE.Vector3(0, 0, -1); this.init = false; this.blocked = 0; }
    update(game, dt) {
      const world = game.world, a = game.localActor(); if (!a) return;
      const t = tmp(), cam = this.camera;
      let target = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), fwd = new THREE.Vector3(0, 0, -1), dist = 5.4 + camDist, eye = null, ignoreSelf = null;
      const v = a.vehicle;
      if (v && v.kind === "ship") {
        target.copy(v.p).addScaledVector(v.upV(t.a), 2.2); up.copy(v.upV(t.b)); fwd.copy(v.nose(t.c));
        const gw = world.gravityAt(v.p), ref = gw ? gw.dir.clone().negate() : new THREE.Vector3(0, 1, 0);
        // persistent chase heading (never snaps when the nose passes vertical)
        const hf = fwd.clone().addScaledVector(ref, -fwd.dot(ref)); if (hf.lengthSq() > 0.04) { hf.normalize(); if (this.heading.dot(hf) > -0.2 || hf.lengthSq() > 0.5) { this.heading.lerp(hf, 1 - Math.pow(0.004, dt)).normalize(); } }
        if (firstPerson) eye = v.p.clone().add(v.cameraEye.clone().applyQuaternion(v.q));
        else { fwd.copy(this.heading); up.copy(ref); dist = 16 + camDist * 2; }
      } else if (v && v.kind === "rover") { v.updateWorldPos(); target.copy(v.worldPos).addScaledVector(v.worldUp(t.a), 1.6); up.copy(v.worldUp(t.b)); fwd.copy(v.worldFwd(t.c)); dist = 9 + camDist * 1.4; if (firstPerson) eye = target.clone(); }
      else {
        a.updateWorldPos(); a.worldUp(up); a.mode === "jetpack" && a.frame ? a.frame.localDirToWorld(a.nose, fwd) : (a.mode === "jetpack" ? fwd.copy(a.nose) : a.worldFwd(fwd));
        target.copy(a.worldPos).addScaledVector(up, a.eye * 0.82); if (firstPerson) eye = a.eyeWorld(new THREE.Vector3());
      }
      if (!this.init) { this.pos.copy(target).addScaledVector(fwd, -dist).addScaledVector(up, 2); this.up.copy(up); this.init = true; }
      this.up.lerp(up, 1 - Math.pow(0.002, dt)).normalize();
      if (firstPerson && eye) {
        cam.position.copy(eye); cam.up.copy(this.up);
        const look = fwd.clone(); look.applyAxisAngle(this.up, lookYaw); const r = new THREE.Vector3().crossVectors(look, this.up).normalize(); look.applyAxisAngle(r, -lookPitch * 0.8);
        cam.lookAt(eye.clone().add(look)); a.obj.visible = false; return;
      }
      // orbit: behind the facing direction, offset by the user's look yaw/pitch
      const back = fwd.clone().negate().addScaledVector(up, fwd.dot(up)).normalize(); back.applyAxisAngle(up, lookYaw);
      const pitch = clamp(0.28 + lookPitch * 0.7, -0.5, 1.3), desired = target.clone().addScaledVector(back, Math.cos(pitch) * dist).addScaledVector(up, Math.sin(pitch) * dist + 0.4);
      // voxel occlusion
      const dir = desired.clone().sub(target), len = dir.length(); dir.multiplyScalar(1 / len);
      const hit = world.raycast(target, dir, len + 0.4); let safe = len; if (hit) safe = Math.max(0.9, hit.t - 0.45);
      const final = target.clone().addScaledVector(dir, safe);
      if (safe < len - 0.05) this.pos.copy(final); else this.pos.lerp(final, 1 - Math.pow(0.00005, dt)); // never smooth *through* a wall
      cam.position.copy(this.pos); cam.up.copy(this.up); cam.lookAt(target);
      if (v) a.obj.visible = false; else a.obj.visible = true;
    }
  }
  // ============================================================
  // 11 GAME: scene, people, vehicles, controllers, actions, warp, frame loop
  // ============================================================
  const HUMAN_GRACE_MS = 20000;
  class Game {
    constructor() {
      this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x02050b);
      this.camera = new THREE.PerspectiveCamera(70, 1, 0.1, 20000);
      this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); root.insertBefore(this.renderer.domElement, root.firstChild);
      this.world = new World(this.scene); this.world.ships = []; this.world.rovers = [];
      this.actors = new Map(); this.localId = "explorer"; this.claims = new Map(); this.agentIn = new Map(); this.rig = new CameraRig(this.camera);
      this.ship = null; this.simAcc = 0; this.coords = [0, 0, 0]; this.prevCoords = null; this.portalCooldown = 0; this.helpOn = true; this.placeMaterial = "dirt"; this.hudT = 0; this.frames = 0;
      this.customs = new Map(); this.actionDefs = new Map(); this.warps = 0; this.usernameBindings = {};
      const pos = new Float32Array(1800 * 3), rnd = mulberry32(99);
      for (let i = 0; i < 1800; i++) { const u = rnd() * 2 - 1, th = rnd() * 6.2832, r = Math.sqrt(1 - u * u); pos[i * 3] = Math.cos(th) * r * 9000; pos[i * 3 + 1] = u * 9000; pos[i * 3 + 2] = Math.sin(th) * r * 9000; }
      const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xdfeaff, size: 2, sizeAttenuation: false, fog: false })); this.stars.frustumCulled = false; this.scene.add(this.stars);
      this.defineActions(); this.resize();
    }
    resize() { const w = root.clientWidth || window.innerWidth, h = root.clientHeight || window.innerHeight; this.renderer.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
    localActor() { return this.actors.get(this.localId) || null; }
    // ---------------------------------------------------------------- spawning
    makeActor(p) {
      const style = NPC_STYLES[p.style] || NPC_STYLES.stranger, a = new Actor(this.world, { id: p.id, name: p.name, role: p.role, model: makeHuman(style), say: p.say, style: p.style, brain: p.brain === "player" ? { type: "idle" } : { type: p.brain, r: (p.patrol && p.patrol.r) || (p.wander && p.wander.r) || 8 } });
      this.actors.set(a.id, a); return a;
    }
    resolveSpawn(p) {
      const w = this.world, UP = new THREE.Vector3(0, 1, 0);
      if (p.at && p.at.startsWith("place:")) { const pl = w.findPlace(p.at.slice(6)); if (!pl) return null; return { body: pl.body, lp: pl.front.clone().addScaledVector(pl.up, 0.8), fwd: pl.south.clone(), up: pl.up.clone() }; }
      const B = w.byId.get(p.at); if (B && B.type === "station" && p.local) return { body: B, lp: new THREE.Vector3(p.local[0] - B.gox, p.local[1] + 0.3, p.local[2] - B.goz), fwd: new THREE.Vector3(1, 0, 0), up: UP.clone() };
      return null;
    }
    spawnSystem(desc, opts) {
      opts = opts || {};
      const w = this.world; w.ships.length = 0; w.rovers.length = 0;
      for (const [id, a] of Array.from(this.actors)) { if (id === this.localId || (this.explorer && a === this.explorer)) continue; this.scene.remove(a.obj); a.obj.traverse(o => { if (o.geometry) o.geometry.dispose(); }); this.actors.delete(id); }
      for (const p of desc.people || []) {
        let a = this.actors.get(p.id); const sp = this.resolveSpawn(p);
        if (!a) a = this.makeActor(p);
        if (p.id === "explorer") { this.explorer = a; }
        if (sp) placeActorLocal(a, sp.body, sp.lp, sp.fwd, sp.up);
        else if (p.at !== "ship") { a.obj.visible = false; }
      }
      // ship
      if (!this.ship) { this.ship = new Ship(w, {}); }
      w.ships.push(this.ship);
      const vdesc = (desc.vehicles || []).find(v => v.kind === "ship");
      if (vdesc && vdesc.at === "last-stop-home") { const st = w.byId.get("last-stop"); placeShipOnPad(w, this.ship, { body: st, local: st.shipHome, up: new THREE.Vector3(0, 1, 0) }, Math.PI / 2); }
      else if (!opts.arrival) { const st = w.byId.get("station"); if (st && st.shipHome) placeShipOnPad(w, this.ship, { body: st, local: st.shipHome, up: new THREE.Vector3(0, 1, 0) }, Math.PI / 2); }
      for (const v of desc.vehicles || []) if (v.kind === "rover") {
        const pl = w.findPlace(v.at.replace("place:", "")); if (!pl) continue;
        const r = new Actor(w, { id: v.id, name: v.name, kind: "rover", model: makeRover() }); r.mode = "drive"; r.brain = null; r.controller = "none"; this.actors.set(r.id, r);
        placeActorLocal(r, pl.body, pl.local.clone().addScaledVector(pl.south, 9).addScaledVector(pl.up, 1.6), pl.south.clone().negate(), pl.up.clone()); r.mode = "drive"; w.rovers.push(r);
      }
    }
    loadSystem(desc, opts) {
      opts = opts || {};
      this.world.loadSystem(desc); this.coords = desc.coords.slice(); this.systemDesc = desc;
      this.spawnSystem(desc, opts);
      const ex = this.explorer; if (ex && !opts.arrival && desc.people && desc.people.some(p => p.id === "explorer" && p.at !== "ship")) { /* placed by spawnSystem */ }
      const t = tmp(), pts = new Map();
      for (const a of this.actors.values()) { a.updateWorldPos(); }
      this.rebuildLodPoints(pts); this.world.prepare(pts, 6000);
      setStatus("SYSTEM // " + desc.name.toUpperCase() + " [" + desc.coords.join(",") + "]");
    }
    // ---------------------------------------------------------------- controllers
    controllerOf(a) {
      const claim = this.claims.get(a.id), now = performance.now();
      let c = claim ? claim.controller : (a.controller === "none" ? "none" : (a.id === this.localId ? "human" : "brain"));
      if (claim && (c === "agent" || c === "script")) { const last = this.agentIn.get(a.id); if (!last || now - last.at > HUMAN_GRACE_MS) c = a.id === this.localId ? "human" : "brain"; }
      if (a.id === this.localId && !claim) c = "human";
      return c;
    }
    modeOf(a) { return a.vehicle ? (a.vehicle.kind === "ship" ? "ship" : "drive") : a.mode; }
    resolveIntent(a, dt) {
      if (a.controller === "none" && !a.pilot) { Object.assign(a.intent, newIntent()); return; }
      const c = this.controllerOf(a), I = a.intent;
      if (c === "human") { humanIntent(this.modeOf(a), I); }
      else if (c === "agent" || c === "script") { const ag = this.agentIn.get(a.id); if (ag && performance.now() < ag.expires) Object.assign(I, ag.intent); else Object.assign(I, newIntent()); }
      else brainStep(this.world, a, dt);
    }
    // ---------------------------------------------------------------- simulation
    physStep(h) {
      const w = this.world; w.update(h);
      for (const a of this.actors.values()) {
        if (a.kind === "rover") { if (a.pilot) { a.intent = a.pilot.intent; } stepActor(w, a, h); continue; }
        this.resolveIntent(a, h);
        if (a.mode === "ride" && a.vehicle) { /* vehicle consumes this intent */ } else stepActor(w, a, h);
      }
      for (const s of w.ships) stepShip(w, s, h);
      for (const a of this.actors.values()) { if (a.mode === "ride" && a.vehicle && a.vehicle.kind === "ship") { a.frame = null; a.p.copy(a.vehicle.p); a.worldPos.copy(a.vehicle.p); a.v.copy(a.vehicle.v); } }
      stepDebris(w, h, Array.from(this.actors.values()));
      for (const c of this.customs.values()) { try { if (c.isActive && c.isActive() && c.applyIntent) c.applyIntent(Object.assign({}, this.localActor().intent), h); } catch (e) { /* custom controllables must not crash the loop */ } }
    }
    rebuildLodPoints(map) {
      const w = this.world, t = tmp();
      const feed = (wp) => { for (const b of w.bodies) { if (!b.view) continue; if (wp.distanceToSquared(b.root.position) > (b.R + 360) ** 2) continue; const l = b.worldToLocal(wp, new THREE.Vector3()); (map.get(b.id) || map.set(b.id, []).get(b.id)).push(l); } };
      for (const a of this.actors.values()) if (a.mode !== "ride") feed(a.updateWorldPos());
      for (const s of w.ships) feed(s.p);
    }
    portalMovers() {
      const out = [];
      for (const s of this.world.ships) if (s.pilot && !s.attach) out.push({ kind: "ship", s, worldPoint: () => s.p });
      for (const a of this.actors.values()) if (a.mode === "jetpack" && !a.frame) out.push({ kind: "actor", a, worldPoint: () => a.p });
      return out;
    }
    frame(dt) {
      dt = Math.min(dt, 0.05); this.frames++;
      this.simAcc += dt; let n = 0; const H = 1 / 60;
      while (this.simAcc >= H && n < 4) { this.physStep(H); this.simAcc -= H; n++; } if (n === 4) this.simAcc = 0;
      for (const a of this.actors.values()) syncActorObject(a);
      this.portalCooldown -= dt;
      if (this.portalCooldown <= 0) { const hit = checkPortals(this.world, this.portalMovers()); if (hit) this.warp(hit.portal.to, { portal: hit.portal }); }
      const pts = new Map(); this.rebuildLodPoints(pts); this.world.updateViews(pts, 5);
      this.rig.update(this, dt);
      this.stars.position.copy(this.camera.position);
      for (const a of this.actors.values()) for (const ev of a.events.splice(0)) { if (a.id === this.localId || (a.vehicle && a.vehicle === this.localActor().vehicle)) setStatus(ev); this.pushEvent(a.id, ev); }
      for (const s of this.world.ships) for (const ev of s.events.splice(0)) { if (s.pilot && s.pilot.id === this.localId) setStatus(ev); this.pushEvent(s.id, ev); }
      this.renderer.render(this.scene, this.camera);
      this.hudT -= dt; if (this.hudT <= 0) { this.hudT = 0.15; this.drawHud(); }
    }
    pushEvent(who, ev) { this.eventLog = this.eventLog || []; this.eventLog.push({ t: Math.round(performance.now() / 100) / 10, who, message: ev }); if (this.eventLog.length > 80) this.eventLog.shift(); }
    // ---------------------------------------------------------------- warp between systems
    warp(coords, opts) {
      opts = opts || {}; const from = this.coords.slice(), to = coords.slice();
      const desc = (to[0] === 0 && to[1] === 0 && to[2] === 0) ? homeSystem() : procSystem(to);
      // make sure there is a way back
      const gates = desc.bodies.filter(b => b.kind === "portal");
      if (!gates.some(g => g.to[0] === from[0] && g.to[1] === from[1] && g.to[2] === from[2]) && gates.length) { const g = gates[0]; g.to = from; g.name = (g.name.replace(/ Gate$/, "") + " Return Gate"); }
      const s = this.ship, pilot = s && s.pilot, ex = this.explorer;
      this.coords = to; this.prevCoords = from; this.warps++;
      const keepLocal = this.localActor();
      this.loadSystem(desc, { arrival: true });
      const gate = this.world.bodies.find(b => b.type === "portal" && b.to[0] === from[0] && b.to[1] === from[1] && b.to[2] === from[2]) || this.world.bodies.find(b => b.type === "portal");
      const fwdW = gate.localDirToWorld(new THREE.Vector3(0, 0, 1), new THREE.Vector3()), upW = new THREE.Vector3(0, 1, 0), rightW = new THREE.Vector3().crossVectors(upW, fwdW).normalize();
      const sp = gate.root.position.clone().addScaledVector(fwdW, 80).addScaledVector(upW, gate.R + 0.5);
      const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(rightW.clone().negate(), upW, fwdW.clone().negate().negate().multiplyScalar(-1)));
      // ship nose points away from the gate: nose = fwdW, so z axis = -nose
      const m = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(fwdW, upW).normalize(), upW, fwdW.clone().negate()); q.setFromRotationMatrix(m);
      if (s) { s.attach = null; s.assist = null; s.p.copy(sp); s.q.copy(q); s.v.copy(fwdW).multiplyScalar(22); s.syncObject(); }
      const a = this.localActor();
      if (a && !(a.mode === "ride" && a.vehicle === s)) { placeActorWorld(this.world, a, sp.clone().addScaledVector(rightW, 6), fwdW, upW); a.mode = "jetpack"; a.v.copy(fwdW).multiplyScalar(10); }
      this.portalCooldown = 4; this.rig.init = false;
      setStatus("WARP // " + desc.name.toUpperCase() + " [" + to.join(",") + "]");
      return { ok: true, system: desc.name, coords: to };
    }
    // ---------------------------------------------------------------- claims
    claim(id, o) {
      o = o || {}; const a = this.actors.get(String(id)); if (!a || a.kind === "rover") return { ok: false, error: "UNKNOWN_CHARACTER", id };
      const controller = ["human", "agent", "script"].includes(o.controller) ? o.controller : "human";
      const by = String(o.by || (window.CLIENT && window.CLIENT.name) || "local").slice(0, 60), existing = this.claims.get(a.id);
      if (existing && existing.by !== by && !o.force) return { ok: false, error: "ALREADY_CLAIMED", claimedBy: existing.by };
      this.claims.set(a.id, { by, controller, since: Date.now() });
      if (controller === "human") { const prev = this.localId; if (prev !== a.id) { const pa = this.actors.get(prev); this.claims.delete(prev); if (pa) { pa.intent = Object.assign(pa.intent, newIntent()); } this.localId = a.id; this.rig.init = false; } }
      else if (controller !== "human") this.agentIn.set(a.id, { at: performance.now(), intent: newIntent(), expires: 0 });
      setStatus("NOW PLAYING " + a.name.toUpperCase() + " // " + controller.toUpperCase() + " (" + by + ")");
      return { ok: true, character: this.characterSummary(a.id) };
    }
    release(id) {
      id = String(id || this.localId); if (!this.claims.has(id)) return { ok: false, error: "NOT_CLAIMED" };
      this.claims.delete(id); this.agentIn.delete(id); if (id === this.localId && id !== "explorer") { this.localId = "explorer"; this.rig.init = false; }
      return { ok: true };
    }
    handoff(controller, o) {
      o = o || {}; if (!["human", "agent", "script"].includes(controller)) return { ok: false, error: "UNKNOWN_CONTROLLER" };
      const id = String(o.id || this.localId), a = this.actors.get(id); if (!a) return { ok: false, error: "UNKNOWN_CHARACTER" };
      const ex = this.claims.get(id), by = String(o.by || (ex && ex.by) || (window.CLIENT && window.CLIENT.name) || "local").slice(0, 60);
      this.claims.set(id, { by, controller, since: Date.now() }); this.agentIn.set(id, { at: performance.now(), intent: newIntent(), expires: 0 });
      if (controller === "human") { this.localId = id; this.agentIn.delete(id); }
      return { ok: true, character: this.characterSummary(id), control: this.controlInfo(id) };
    }
    controlInfo(id) { const c = this.controllerOf(this.actors.get(id || this.localId)); const ag = this.agentIn.get(id || this.localId); return { controller: c, humanLocked: c === "agent" || c === "script", graceMsLeft: ag ? Math.max(0, Math.round(HUMAN_GRACE_MS - (performance.now() - ag.at))) : 0 }; }
    characterSummary(id) { const a = this.actors.get(id); if (!a) return null; const cl = this.claims.get(id), cn = (window.CLIENT && window.CLIENT.name) ? String(window.CLIENT.name) : null; return { id, name: a.name, role: a.role, controller: this.controllerOf(a), claimedBy: cl ? cl.by : (id === this.localId ? cn : null), since: cl ? cl.since : null, local: id === this.localId }; }
    setAgentIntent(id, raw, o) {
      o = o || {}; const a = this.actors.get(id); if (!a) return { ok: false, error: "UNKNOWN_CHARACTER" };
      const cl = this.claims.get(id); if (!cl || cl.controller === "human") { if (!(o.auto)) return { ok: false, error: "NOT_CLAIMED_BY_AGENT", hint: "claim(id,{controller:'agent'}) first" }; }
      const ag = this.agentIn.get(id) || { at: 0, intent: newIntent(), expires: 0 }; const patch = sanitizeIntent(raw);
      if (!o.merge) ag.intent = newIntent(); Object.assign(ag.intent, patch);
      let ttl = o.ttlMs === undefined ? 800 : Number(o.ttlMs); if (!Number.isFinite(ttl) || ttl < 0) ttl = 800; ttl = Math.min(ttl, 120000);
      ag.expires = ttl === 0 ? Infinity : performance.now() + ttl; ag.at = performance.now(); this.agentIn.set(id, ag); return { ok: true, intent: Object.assign({}, ag.intent) };
    }
    clearAgentIntent(id) { const ag = this.agentIn.get(id); if (ag) { ag.intent = newIntent(); ag.expires = 0; } return true; }
    drawHud() { drawHudImpl(this); }
  }
  const INTENT_KEYS = ["forward", "turn", "strafe", "pitch", "lookX", "lookY"];
  const INTENT_ALIASES = Object.freeze({ move: "forward", thrust: "forward", throttle: "forward", steer: "turn", yaw: "turn", jump: "boost" });
  function sanitizeIntent(raw) {
    const out = {}; if (!raw || typeof raw !== "object") return out;
    const num = v => { const n = Number(v); return Number.isFinite(n) ? clamp(n, -1, 1) : 0; };
    for (const key of Object.keys(raw)) { const name = INTENT_ALIASES[key] || key; if (name === "boost" || name === "sprint" || name === "brake") out[name] = !!raw[key]; else if (INTENT_KEYS.includes(name)) out[name] = num(raw[key]); }
    return out;
  }
  // ============================================================
  // 12 ACTIONS, OBSERVATION, HUD, PUBLIC API
  // ============================================================
  function bearingOf(a, wp) {
    const up = a.vehicle && a.vehicle.kind === "ship" ? a.vehicle.upV(new THREE.Vector3()) : a.worldUp(new THREE.Vector3());
    const fwd = a.vehicle && a.vehicle.kind === "ship" ? a.vehicle.nose(new THREE.Vector3()) : (a.mode === "jetpack" ? (a.frame ? a.frame.localDirToWorld(a.nose, new THREE.Vector3()) : a.nose.clone()) : a.worldFwd(new THREE.Vector3()));
    const pos = a.vehicle && a.vehicle.kind === "ship" ? a.vehicle.p : a.updateWorldPos();
    const right = new THREE.Vector3().crossVectors(fwd, up); if (right.lengthSq() < 1e-8) right.set(1, 0, 0); right.normalize();
    const v = wp.clone().sub(pos), flat = v.clone().addScaledVector(up, -v.dot(up));
    return { distanceM: roundTo(v.length(), 1), bearingDeg: roundTo(Math.atan2(flat.dot(right), flat.dot(fwd)) * 180 / Math.PI, 0) };
  }
  function roundTo(n, d) { const m = Math.pow(10, d === undefined ? 2 : d); return Math.round(n * m) / m; }
  const vj = v => v ? { x: roundTo(v.x), y: roundTo(v.y), z: roundTo(v.z) } : null;

  Game.prototype.defineActions = function () {
    const G = this, w = () => this.world, def = (name, spec) => { G.actionDefs.set(name, Object.assign({ name, params: {}, available: () => true, source: "core" }, spec)); };
    def("board", { description: "Board the nearest vehicle (ships within 12 m, rovers within 7 m).", params: { vehicle: "optional vehicle id (space-rv, luna-rover) when several are in reach" }, available: a => a.mode === "ride" ? "already aboard" : (nearestVehicle(w(), a) ? true : "no vehicle within reach"), run: (a, p) => boardVehicle(w(), a, p.vehicle) });
    def("leave_vehicle", { description: "Leave the vehicle you are in. Beside a landed ship you stand on the ground; in flight you step out on the Kinetic Field.", available: a => a.vehicle ? true : "not in a vehicle", run: a => leaveVehicle(w(), a) });
    def("landing_assist", { description: "Autopilot to a landing pad or dock: the nearest beacon within 260 m, or a chosen pad id within 700 m.", available: a => (a.vehicle && a.vehicle.kind === "ship") ? true : "you must be piloting the ship", params: { pad: "optional pad id from state.destinations (within 700 m); default: nearest beacon within 260 m" }, run: (a, p) => startAssist(w(), a.vehicle, p.pad) });
    def("cancel_assist", { description: "Cancel landing assist.", available: a => (a.vehicle && a.vehicle.assist) ? true : "no assist active", run: a => { a.vehicle.assist = null; return { ok: true }; } });
    def("park", { description: "Hold the ship still (cancels drift and gravity), or release.", params: { value: "boolean, default true" }, available: a => (a.vehicle && a.vehicle.kind === "ship") ? true : "not flying a ship", run: (a, p) => { a.vehicle.parked = p.value === undefined ? true : !!p.value; return { ok: true, parked: a.vehicle.parked }; } });
    def("dig", { description: "Dig the voxel you are looking at (planet ground within 7 m). Removes planet mass and drops debris you can collect.", available: a => (a.mode === "walk" || a.mode === "jetpack") ? true : "on foot only", params: { pitch: "aim offset, -1..1 (default -0.5: slightly downward)" }, run: (a, p) => { a.lookPitch = p.pitch === undefined ? -0.5 : clamp(Number(p.pitch) || 0, -1, 1); return digAction(w(), a, 7); } });
    def("place", { description: "Place a carried material voxel where you are looking.", params: { material: "dirt | stone | sand | grass | snow | ... (must be in inventory)" }, available: a => Object.values(a.inventory).some(n => n > 0) ? true : "you are carrying nothing", run: (a, p) => { a.lookPitch = p.pitch === undefined ? -0.5 : clamp(Number(p.pitch) || 0, -1, 1); return placeAction(w(), a, p.material || G.placeMaterial); } });
    def("talk", { description: "Talk to the nearest person within 6 m.", available: a => G.nearestTalker(a) ? true : "nobody close enough", run: a => { const o = G.nearestTalker(a); if (!o) return { ok: false }; const line = o.say.length ? o.say[o.sayIdx++ % o.say.length] : "..."; setStatus(o.name.toUpperCase() + ": " + line); return { ok: true, speaker: o.name, role: o.role, line }; } });
    def("toggle_view", { description: "Toggle first / third person.", run: () => { firstPerson = !firstPerson; return { ok: true, view: firstPerson ? "first" : "third" }; } });
    def("set_view", { description: "Set the camera view.", params: { mode: "first | third" }, run: (a, p) => { firstPerson = p.mode === "first"; return { ok: true, view: firstPerson ? "first" : "third" }; } });
    def("recenter_camera", { description: "Reset the camera behind your character.", run: () => { lookYaw = 0; lookPitch = 0; camDist = 0; return { ok: true }; } });
    def("toggle_help", { description: "Show or hide the key help.", run: () => { G.helpOn = !G.helpOn; return { ok: true }; } });
    def("select_material", { description: "Choose the material the place key uses.", params: { material: "string" }, run: (a, p) => { G.placeMaterial = String(p.material || "dirt"); return { ok: true, material: G.placeMaterial }; } });
  };
  Game.prototype.nearestTalker = function (a) {
    a.updateWorldPos(); let best = null, bd = 6;
    for (const o of this.actors.values()) { if (o === a || o.kind !== "human" || !o.say || !o.say.length) continue; const d = o.updateWorldPos().distanceTo(a.worldPos); if (d < bd) { bd = d; best = o; } }
    return best;
  };
  Game.prototype.availability = function (def, a) { let why = true; try { why = def.available(a); } catch (e) { why = "availability check failed"; } return (why === true || why === null || why === undefined) ? true : String(why); };
  Game.prototype.listActions = function (a, all) {
    const out = []; for (const d of this.actionDefs.values()) { const why = this.availability(d, a); if (why === true) out.push({ name: d.name, description: d.description, params: d.params, available: true, source: d.source }); else if (all) out.push({ name: d.name, description: d.description, params: d.params, available: false, reason: why, source: d.source }); }
    return out;
  };
  Game.prototype.runAction = function (a, name, params) {
    const d = this.actionDefs.get(String(name)); if (!d) return { ok: false, error: "UNKNOWN_ACTION", name: String(name) };
    const why = this.availability(d, a); if (why !== true) { if (a.id === this.localId) setStatus(String(name).toUpperCase().replace(/_/g, " ") + " // " + why.toUpperCase()); return { ok: false, error: "UNAVAILABLE", reason: why }; }
    try { const r = d.run(a, params && typeof params === "object" ? params : {}); if (r && r.ok === false) return { ok: false, error: "FAILED", reason: r.reason || "failed", detail: r }; return { ok: true, result: r === undefined ? null : r }; }
    catch (e) { return { ok: false, error: "ACTION_FAILED", message: String(e && e.message ? e.message : e) }; }
  };
  const MODE_HELP = Object.freeze({
    walk: "On foot. forward walks, turn (+1 right) turns, strafe slides, boost jumps; HOLD boost in the air to engage the Kinetic Field jetpack. sprint runs.",
    jetpack: "Kinetic Field flight. boost thrusts along your nose (24 m/s); turn yaws, pitch (+1 nose up) tilts; forward/strafe give slow precision movement and hover. Release everything to fall.",
    swim: "In water. forward/turn move slowly; boost swims up.",
    ship: "Spacecraft. forward thrusts along the nose, strafe slides, turn yaws, pitch tilts, boost = afterburner, brake slows. Thrust accelerates by force/mass, so cargo makes it sluggish.",
    drive: "Rover. forward is throttle, turn steers (needs motion), brake stops."
  });
  Game.prototype.locationOf = function (a) {
    const w = this.world, v = a.vehicle; const pos = (v && v.kind === "ship") ? v.p : a.updateWorldPos(), t = tmp();
    let body = (!v || v.kind !== "ship") ? a.frame : null, alt = null, g = 0, label = null;
    if (!body) { const gw = w.gravityAt(pos); if (gw) { body = gw.body; g = gw.g; } }
    if (body) {
      if (body.type === "planet") { const l = body.worldToLocal(pos, t.l), r = l.length(), sr = body.gen.surfaceR(l.x / r, l.y / r, l.z / r); alt = r - sr; }
      else if (body.type === "station") { const l = body.worldToLocal(pos, t.l); alt = l.y - 2; }
      if (!g && a.frame) { const gv = a.frame.gravityLocal(a.p, t.g); if (gv) g = t.g.length(); }
    }
    let nearest = null, nd = 1e9;
    for (const b of w.bodies) { if (b.type === "star") continue; const d = pos.distanceTo(b.root.position) - (b.R || 0); if (d < nd) { nd = d; nearest = b; } }
    return { body: body ? body.id : null, bodyName: body ? body.name : null, bodyType: body ? body.type : "space", altitudeM: alt === null ? null : roundTo(alt, 1), gravityMS2: roundTo(g, 2), nearestBody: nearest ? { id: nearest.id, name: nearest.name, distanceM: roundTo(nd, 0) } : null, massTonnes: body ? Math.round(body.mass) : null };
  };
  Game.prototype.destinationsOf = function (a) {
    const out = [], w = this.world;
    for (const p of w.allPads()) { const wp = p.body.localToWorld(p.local, new THREE.Vector3()); out.push(Object.assign({ id: p.id, name: p.name, kind: p.kind, body: p.body.id, positionM: vj(wp), beacon: true, how: "ship: landing_assist within 260 m; on foot: Kinetic Field descent" }, bearingOf(a, wp))); }
    for (const b of w.bodies) { if (b.type === "portal") out.push(Object.assign({ id: b.id, name: b.name, kind: "portal", positionM: vj(b.root.position), to: b.to, how: "fly or jetpack through the ring" }, bearingOf(a, b.root.position))); else if (b.type === "planet") out.push(Object.assign({ id: b.id, name: b.name, kind: "planet", radiusM: b.R, gravityMS2: roundTo(b.surfaceGravity, 2), positionM: vj(b.root.position) }, bearingOf(a, b.root.position))); else if (b.type === "station") out.push(Object.assign({ id: b.id, name: b.name, kind: "station", positionM: vj(b.root.position) }, bearingOf(a, b.root.position))); }
    out.sort((x, y) => x.distanceM - y.distanceM); return out;
  };
  Game.prototype.stateOf = function (id) {
    const a = this.actors.get(id || this.localId), w = this.world;
    if (!a || !w.system || destroyed) return { api: API_SCHEMA_VERSION, version: VERSION, ready: false };
    const v = a.vehicle, ship = v && v.kind === "ship" ? v : null, t = tmp();
    a.updateWorldPos(); const pos = ship ? ship.p : (v ? (v.updateWorldPos()) : a.worldPos);
    const up = ship ? ship.upV(new THREE.Vector3()) : a.worldUp(new THREE.Vector3()), fwd = ship ? ship.nose(new THREE.Vector3()) : (a.mode === "jetpack" ? (a.frame ? a.frame.localDirToWorld(a.nose, new THREE.Vector3()) : a.nose.clone()) : a.worldFwd(new THREE.Vector3()));
    const mode = this.modeOf(a) === "walk" && a.inWater ? "swim" : this.modeOf(a);
    const eye = ship ? ship.p.clone() : a.eyeWorld(new THREE.Vector3()), look = w.raycast(eye, fwd, 14), lookMat = look ? MAT[look.id].name : null;
    const nearby = [];
    for (const o of this.actors.values()) { if (o === a || o.mode === "ride" && o.vehicle === v) continue; const wp = o.updateWorldPos(); const d = wp.distanceTo(pos); if (d > 160) continue; nearby.push(Object.assign({ id: o.id, kind: o.kind === "rover" ? "vehicle" : "npc", name: o.name, role: o.role, controller: this.controllerOf(o), hint: o.kind === "rover" ? "board within 7 m" : (o.say && o.say.length ? "talk within 6 m" : undefined) }, bearingOf(a, wp))); }
    for (const s of w.ships) if (s !== v) nearby.push(Object.assign({ id: s.id, kind: "vehicle", name: s.name, hint: "board within 12 m" }, bearingOf(a, s.p)));
    nearby.sort((x, y) => x.distanceM - y.distanceM);
    const dests = this.destinationsOf(a);
    return {
      api: API_SCHEMA_VERSION, version: VERSION, ready: true, timeS: roundTo(performance.now() / 1000, 2),
      character: this.characterSummary(a.id), control: this.controlInfo(a.id),
      mode, modeHelp: MODE_HELP[mode], view: firstPerson ? "first" : "third",
      location: this.locationOf(a),
      self: { positionM: vj(pos), up: vj(up), forward: vj(fwd), speedMS: roundTo(ship ? ship.v.length() : a.v.length(), 1), grounded: !!a.grounded, inWater: !!a.inWater, onFoot: !v, massT: roundTo(a.mass + a.carried, 2), carriedT: roundTo(a.carried, 2) },
      vision: { lookingAt: look ? { material: lookMat, distanceM: roundTo(look.t, 1), body: look.body.id } : null },
      ship: ship ? { landed: ship.landed, parked: ship.parked, assist: ship.assist ? ship.assist.pad.id : null, contact: ship.contact, massT: roundTo(ship.mass, 1), accelMS2: roundTo(ship.accel, 1), positionM: vj(ship.p) } : null,
      nearby: nearby.slice(0, 16), destinations: dests,
      inventory: Object.assign({}, a.inventory),
      kineticField: { active: a.mode === "jetpack", canLaunch: !v && a.cfg.canFly, note: "hold boost in the air to engage; mass slows nothing, but gravity pulls harder on heavy worlds" },
      universe: { system: w.system.name, coords: this.coords.slice(), warps: this.warps, portals: w.bodies.filter(b => b.type === "portal").map(b => ({ id: b.id, name: b.name, to: b.to })) },
      events: statusLog.slice(-12), actions: this.listActions(a, false).map(x => x.name), custom: null
    };
  };
  function drawHudImpl(g) {
    const a = g.localActor(); if (!a) return; const s = g.stateOf(a.id); if (!s.ready) return;
    const loc = s.location, near = s.destinations[0];
    let l1 = "KEPLER REACH // VOXEL v" + VERSION + "   SYSTEM " + s.universe.system.toUpperCase() + " [" + s.universe.coords.join(",") + "]";
    let l2 = s.character.name.toUpperCase() + (s.character.role ? " // " + s.character.role : "") + "   MODE " + s.mode.toUpperCase() + (s.ship && s.ship.assist ? " // LANDING ASSIST" : "") + (s.ship && s.ship.landed ? " // LANDED" : "");
    let l3 = (loc.bodyName ? loc.bodyName.toUpperCase() : "DEEP SPACE") + (loc.altitudeM !== null ? "   ALT " + Math.round(loc.altitudeM) + " m" : "") + "   SPEED " + Math.round(s.self.speedMS) + " m/s   G " + loc.gravityMS2.toFixed(1) + "   MASS " + s.self.massT + " t" + (s.self.carriedT ? " (cargo " + s.self.carriedT + ")" : "");
    let l4 = near ? "NEAREST " + near.name.toUpperCase() + "  " + Math.round(near.distanceM) + " m  BRG " + near.bearingDeg + "°" : "";
    hud.textContent = l1 + "\n" + l2 + "\n" + l3 + "\n" + l4;
    helpEl.textContent = g.helpOn ? "WASD move/turn  Q/E strafe  SPACE jump/hold=Kinetic Field  SHIFT sprint/brake  arrows look/pitch\nB board/leave  L landing assist  X dig  C place  F talk  V view  R recentre  P park  H help  drag=look  wheel=zoom" : "";
  }
  // ---- the public API ---------------------------------------------------------------------------------
  function buildApi(game) {
    const lookup = o => String((o && o.as) || game.localId), need = id => game.actors.get(id);
    const actorApi = id => ({
      id, state: () => game.stateOf(id), setIntent: (i, o) => api.input.set(i, Object.assign({}, o, { as: id })), clear: () => game.clearAgentIntent(id),
      act: (name, params) => game.runAction(game.actors.get(id), name, params), claim: o => game.claim(id, o)
    });
    const api = {
      version: VERSION, apiVersion: API_SCHEMA_VERSION,
      state: o => game.stateOf(lookup(o)),
      input: {
        set(intent, o) {
          o = o || {}; const id = lookup(o), a = need(id); if (!a) return { ok: false, error: "UNKNOWN_CHARACTER" };
          const cl = game.claims.get(id);
          if (!cl || cl.controller === "human") {
            if (id === game.localId && !o.takeover) return { ok: false, error: "LOCAL_HUMAN_CONTROL", hint: "pass {takeover:true} to hand the local character to the agent, or claim another character" };
            const r = (id === game.localId) ? game.handoff("agent", { id, by: o.by }) : game.claim(id, { controller: o.controller || "agent", by: o.by || "agent" }); if (!r.ok) return r;
          }
          return game.setAgentIntent(id, intent, o);
        },
        clear(o) { return game.clearAgentIntent(lookup(o)); }, current() { const a = game.localActor(); return a ? Object.assign({}, a.intent) : null; },
        schema: { forward: "walk/throttle/ship thrust, -1..1", turn: "+1 = right", strafe: "+1 = right", pitch: "+1 = nose up (jetpack, ship)", boost: "boolean: jump / Kinetic Field / afterburner", sprint: "boolean", brake: "boolean", lookX: "camera", lookY: "camera" }
      },
      actions: { list(o) { return game.listActions(need(lookup(o)), true); }, run(name, params, o) { return game.runAction(need(lookup(o)), name, params); }, define(name, spec) { game.actionDefs.set(name, Object.assign({ name, params: {}, available: () => true, source: "custom" }, spec)); return name; } },
      characters: {
        list() { return Array.from(game.actors.values()).filter(a => a.kind === "human").map(a => game.characterSummary(a.id)); },
        get active() { return game.characterSummary(game.localId); },
        claim: (id, o) => game.claim(id, o), release: id => game.release(id), handoff: (c, o) => game.handoff(c, o), reclaim: o => game.handoff("human", o),
        register(spec) { return api.characters.add(spec); },
        add(spec) { const id = String(spec && spec.id || ""); if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(id) || game.actors.has(id)) return { ok: false, error: "BAD_OR_DUPLICATE_ID" }; const a = game.makeActor({ id, name: spec.name || id, role: spec.role, style: spec.style || "stranger", brain: spec.brain || "idle", say: spec.say }); const t = game.localActor(); if (t) placeActorWorld(game.world, a, t.updateWorldPos().clone().add(new THREE.Vector3(3, 0, 0)), t.worldFwd(new THREE.Vector3()), t.worldUp(new THREE.Vector3())); return { ok: true, id }; },
        bindUsername(name, id) { if (!game.actors.has(String(id))) return false; game.usernameBindings[String(name).trim().toLowerCase()] = String(id); return true; },
        autoClaim(name) { const n = String(name || (window.CLIENT && window.CLIENT.name) || "").trim().toLowerCase(); const id = game.usernameBindings[n]; return id ? game.claim(id, { by: n, controller: "human" }) : null; }
      },
      actors: { list: () => Array.from(game.actors.keys()), get: id => game.actors.has(id) ? actorApi(id) : null },
      registerControllable(spec) { if (!spec || typeof spec.isActive !== "function") throw new Error("Controllable needs isActive()."); game.customs.set(String(spec.id), spec); if (spec.actions) for (const k of Object.keys(spec.actions)) api.actions.define(spec.id + "." + k, spec.actions[k]); return { id: spec.id, unregister() { game.customs.delete(String(spec.id)); } }; },
      warp: coords => game.warp(coords.map(Number)),
      universe: { current: () => ({ name: game.world.system.name, coords: game.coords.slice() }), describe: coords => (coords[0] === 0 && coords[1] === 0 && coords[2] === 0) ? homeSystem() : procSystem(coords), seed: UNIVERSE_SEED },
      events: () => statusLog.slice(),
      agent: {
        describe() {
          const a = game.localActor();
          return { api: API_SCHEMA_VERSION, version: VERSION, summary: "Kepler Reach is an arcade 3D exploration game made entirely of voxels. Read state(), choose an intent and/or an action, repeat.", intent: { fields: api.input.schema, ttlMs: "default 800 (watchdog stop); 0 = hold until input.clear()" }, modes: MODE_HELP, actions: a ? game.listActions(a, true) : [], characters: api.characters.list(), command: { usage: "await KeplerReach.agent.command({ as?, character?, action?, params?, intent?, hold?, wait?, stop?, by? })", notes: ["as targets any character (default: the local one).", "character claims a roster character for the agent without moving the human's camera.", "intent applies for `hold` ms (default 800) then expires, so an idle agent never runs away.", "state.destinations lists every landing site, station, planet and portal with distance and bearing.", "state.vision.lookingAt is what is in front of you (material, distance).", "Flying or jetpacking through a portal ring warps to a neighbouring procedural system."] } };
        },
        state: o => api.state(o),
        async command(cmd) {
          cmd = cmd && typeof cmd === "object" ? cmd : {}; const out = { ok: true }; const by = cmd.by ? String(cmd.by).slice(0, 60) : undefined;
          if (cmd.character) { out.character = game.claim(cmd.character, { by, controller: ["agent", "script", "human"].includes(cmd.controller) ? cmd.controller : "agent", force: !!cmd.force }); if (!out.character.ok) out.ok = false; }
          const target = cmd.as || cmd.character || game.localId;
          if (cmd.action) { out.action = game.runAction(game.actors.get(target), cmd.action, cmd.params); if (!out.action.ok) out.ok = false; }
          const hold = Math.max(0, Math.min(60000, Number(cmd.hold) || 0));
          if (cmd.intent === null) game.clearAgentIntent(target);
          else if (cmd.intent !== undefined) { const r = api.input.set(cmd.intent, { as: target, by, ttlMs: hold > 0 ? hold : (cmd.ttlMs !== undefined ? cmd.ttlMs : 800), merge: !!cmd.merge, takeover: !!cmd.takeover }); if (!r.ok) { out.intent = r; out.ok = false; } }
          const wait = Math.max(0, Math.min(10000, hold > 0 ? hold : (Number(cmd.wait) || 0)));
          if (wait) await new Promise(r => setTimeout(r, wait));
          if (cmd.stop) game.clearAgentIntent(target);
          out.state = game.stateOf(target); return out;
        },
        drive(intent, ms, o) { return api.agent.command(Object.assign({ intent, hold: ms === undefined ? 1000 : ms, stop: true }, o)); },
        guide() { return ["You are playing Kepler Reach through window.KeplerReach.agent.", "Loop: s = KeplerReach.state(); decide; await KeplerReach.agent.command({...}).", "Take control of a character: command({ character:'benis', by:'MyAgent' }) (the human keeps their own character).", "Move: command({ as:'benis', intent:{ forward:1, turn:-0.3 }, hold:1000 }).", "One-offs: command({ as:'benis', action:'talk' }) / 'dig' / 'board' / 'landing_assist'.", "Use state.destinations (distance, bearingDeg: 0 ahead, +90 right) to navigate; state.vision.lookingAt shows what is ahead."].join("\n"); }
      },
      destroy() { destroyApi(); }
    };
    return api;
  }
  // ============================================================
  // 99 BOOT
  // ============================================================
  let game = null, rafId = 0, lastTs = 0;
  const frameFaults = [];
  function destroyApi() {
    if (destroyed) return; destroyed = true;
    try { cancelAnimationFrame(rafId); } catch (e) { /* ignore */ }
    for (const fn of cleanup) { try { fn(); } catch (e) { /* ignore */ } }
    try { if (game) { game.world.clear(); for (const a of game.actors.values()) a.obj.traverse(o => { if (o.geometry) o.geometry.dispose(); }); game.renderer.dispose(); } } catch (e) { /* ignore */ }
    try { root.remove(); } catch (e) { /* ignore */ }
    if (window.KeplerReach && window.KeplerReach._id === ID) delete window.KeplerReach;
  }
  const ID = Math.random().toString(36).slice(2);
  window.KeplerReach = { version: VERSION, _id: ID, destroy: destroyApi };
  function loop(ts) {
    if (destroyed) return; rafId = requestAnimationFrame(loop);
    const dt = lastTs ? (ts - lastTs) / 1000 : 1 / 60; lastTs = ts;
    try { game.frame(dt); }
    catch (error) {
      const now = performance.now(); while (frameFaults.length && now - frameFaults[0] > 3000) frameFaults.shift(); frameFaults.push(now);
      console.error("[Kepler Reach] Frame fault:", error);
      if (frameFaults.length >= 5) { cancelAnimationFrame(rafId); setStatus("RENDER LOOP ERROR: " + (error && error.message ? error.message : String(error)), true); }
      else setStatus("FRAME FAULT // RECOVERING: " + (error && error.message ? error.message : String(error)));
    }
  }
  async function init() {
    try { THREE = await loadThree(); } catch (error) { setStatus(error.message, true); return; }
    try {
      setStatus("GENERATING UNIVERSE // SEED " + UNIVERSE_SEED);
      game = new Game(); gameRef = game; game.loadSystem(homeSystem());
      const api = buildApi(game); Object.assign(window.KeplerReach, api); window.KeplerReach._id = ID;
      if (window.KR_TEST) window.__kr = { game, THREE, World, Actor, Ship, VoxelGrid, VoxelModel, M, MAT, procSystem, homeSystem, tmp };
      const onResize = () => game.resize(); window.addEventListener("resize", onResize); cleanup.push(() => window.removeEventListener("resize", onResize));
      try { api.characters.autoClaim(); } catch (e) { /* ignore */ }
      setStatus("KEPLER REACH // VOXEL // WELCOME");
      lastTs = 0; rafId = requestAnimationFrame(loop);
    } catch (error) { console.error(error); setStatus("STARTUP ERROR: " + (error && error.message ? error.message : String(error)), true); }
  }
  init();
})();
