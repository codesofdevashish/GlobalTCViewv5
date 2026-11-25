/* Live weather globe (d3 + canvas). Fields come from data/wx (GFS 1-degree analysis).
   WxMap.create(el, {onPick, onStorm, onRegion}) -> api */
(() => {
  "use strict";
  const LEVEL_INFO = { 1000: "near the surface", 850: "about 1.5 km up", 700: "about 3 km up", 500: "about 5.5 km up", 300: "about 9 km up", 200: "about 12 km up" };
  const DIRS = ["north", "north-northeast", "northeast", "east-northeast", "east", "east-southeast", "southeast", "south-southeast",
                "south", "south-southwest", "southwest", "west-southwest", "west", "west-northwest", "northwest", "north-northwest"];
  const RAMPS = {
    speed: { unit: "km/h", lo: 0, hi: 220, f: (x) => x * 3.6, stops: ["#16213f", "#23447a", "#2b74ad", "#2fa3a8", "#7cc46a", "#e6d84a", "#f28c28", "#d9342b", "#8e1f5e"] },
    pwat:  { unit: "mm", lo: 0, hi: 70, f: (x) => x, stops: ["#7b5a2e", "#c8a86a", "#efe6c4", "#8fd1c4", "#2fa3b8", "#2a62b0", "#3b2f8f", "#7a2a8c"] },
    rh:    { unit: "%", lo: 0, hi: 100, f: (x) => x, stops: ["#6e3f1a", "#b5783a", "#e2c48b", "#e9f0c9", "#9fd08a", "#3f9a55", "#155f3a"] },
    sst:   { unit: "°C", lo: 0, hi: 32, f: (x) => x, stops: ["#08306b", "#2171b5", "#6baed6", "#c6dbef", "#fee0b6", "#fdae61", "#f46d43", "#d73027", "#7f0000"] },
    tmp:   { unit: "°C", lo: -40, hi: 35, f: (x) => x, stops: ["#3b4cc0", "#6f92f3", "#aac7fd", "#dddcdc", "#f7b89c", "#e7745b", "#b40426"] },
    vort:  { unit: "×10⁻⁵ s⁻¹", lo: -20, hi: 20, f: (x) => x, stops: ["#2a5fa8", "#6fa8dc", "#e9eef2", "#f2a07a", "#c8372d"] },
    shear: { unit: "m/s", lo: 0, hi: 40, f: (x) => x, stops: ["#2e8b57", "#9bd36a", "#f2e14a", "#f29a3a", "#d9342b", "#8b1a4a"] },
    cape:  { unit: "J/kg", lo: 0, hi: 4000, f: (x) => x, stops: ["#24415c", "#4f7a8c", "#d9d24a", "#f29a3a", "#d9342b", "#8b2a8a"] },
    hs:    { unit: "m", lo: 0, hi: 12, f: (x) => x, stops: ["#0b2545", "#13497a", "#1f7bb6", "#35b0c9", "#8fe0d6", "#f2f0a8", "#f2a65a", "#c8372d", "#5e0f2a"] },
    curspd:{ unit: "m/s", lo: 0, hi: 2, f: (x) => x, stops: ["#0a1f2e", "#0f4c5c", "#16807f", "#4fbf9f", "#bde68f", "#fff3a0", "#ffffff"] },
    tw:    { unit: "°C", lo: 8, hi: 35, f: (x) => x, stops: ["#2c4a7a", "#3f7fb0", "#7ec2c0", "#e9e3a6", "#f6b04a", "#e8632b", "#c4202f", "#6e0f3a"] },
    up:    { unit: "Pa/s", lo: -1, hi: 1, f: (x) => x, stops: ["#2f5fc4", "#79a6e6", "#dfe8f0", "#f6b26b", "#e2552e", "#a3182b"] },
    ivt:   { unit: "kg m⁻¹ s⁻¹", lo: 0, hi: 1000, min: 100, f: (x) => x, stops: ["#cfe8f7", "#8fc6e8", "#f6e58b", "#f6b043", "#e8632b", "#b8233a", "#6d1a6e"] },
    sss:   { unit: "PSU", lo: 30, hi: 38, f: (x) => x, stops: ["#3b1f5f", "#2a4f9b", "#2f86c4", "#2fb3b0", "#9be3c8", "#f6e7a8", "#f2a65a", "#c8372d"] },
    rain:  { unit: "mm", lo: 0, hi: 60, f: (x) => x, stops: ["#bfe3f2", "#6fb8e0", "#2f6fc4", "#5b3fb0", "#b03aa8", "#ff5fc0"] },
  };
  const FLOW = { lo: 0, hi: 200, stops: ["#9fd4ff", "#62d2c6", "#9be26a", "#f4e04a", "#f7a43a", "#f2603a", "#e0398f", "#ff8be0"] };   // streamline colour, km/h
  const lut = (stops) => { const s = d3.scaleLinear().domain(stops.map((_, i) => i / (stops.length - 1))).range(stops).interpolate(d3.interpolateRgb);
    return Array.from({ length: 256 }, (_, i) => { const c = d3.rgb(s(i / 255)); return [c.r, c.g, c.b]; }); };
  for (const r of Object.values(RAMPS)) r.lut = lut(r.stops);
  FLOW.lut = lut(FLOW.stops); FLOW.css = FLOW.lut.map(([r, g, b]) => `rgb(${r},${g},${b})`);
  const FLOW_LIGHT = ["#1f5f8b", "#1f8a7a", "#4f8f1f", "#a68a00", "#cc6a10", "#c8372d", "#a3206a", "#6d1a8a"];
  const binColorLight = (() => { const L = lut(FLOW_LIGHT); return Array.from({ length: 16 }, (_, i) => { const [r, g, b] = L[Math.round((i + 0.5) / 16 * 255)]; return `rgb(${r},${g},${b})`; }); })();
  const isLight = () => document.documentElement.dataset.theme === "light";
  const PAL = () => (isLight()
    ? { sea: "#d4e3ec", land: "#efece4", coast: "rgba(40,60,75,.8)", grat: "rgba(20,40,60,.10)", cont: "rgba(25,45,65,.55)", text: "#13283a", halo: "rgba(255,255,255,.92)", sub: "#2f4658", edge: "rgba(40,70,95,.35)", warm: "#c8372d", cold: "#1f5f9b" }
    : { sea: "#0b2a3c", land: "#24394a", coast: "rgba(235,242,246,.75)", grat: "rgba(255,255,255,.08)", cont: "rgba(255,255,255,.55)", text: "#ffffff", halo: "rgba(6,22,34,.85)", sub: "#d7e3ea", edge: "rgba(180,210,230,.35)", warm: "#ff7a59", cold: "#6fb6ff" });
  const NBIN = 16, binOf = (kmh) => Math.max(0, Math.min(NBIN - 1, Math.floor(kmh / (FLOW.hi / NBIN))));
  const binColor = Array.from({ length: NBIN }, (_, i) => FLOW.css[Math.round((i + 0.5) / NBIN * 255)]);

  function decode(e) {                                     // quantised field -> Float32Array (NaN = missing)
    const t = atob(e.b64), n = t.length, out = new Float32Array(n), k = (e.max - e.min) / 254;
    for (let i = 0; i < n; i++) { const b = t.charCodeAt(i); out[i] = b === 255 ? NaN : e.min + b * k; }
    return out;
  }

  let PLACES = null;
  function places() {                                       // [name, lat, lon, min_zoom, pop, name_hi], most important first
    if (!PLACES) PLACES = fetch("vendor/places.json").then((r) => r.json()).then((d) => d.places).catch(() => []);
    return PLACES;
  }
  const placeName = (p) => (window.I18N && window.I18N.lang === "hi" && p[5] ? p[5] : p[0]);
  const LANDS = {};
  function landSet(res) {                                    // {land, coast} for "110m", "50m", "10m", loaded once
    if (!LANDS[res]) LANDS[res] = fetch(`vendor/land-${res}.json`).then((r) => r.json())
      .then((t) => ({ land: topojson.feature(t, t.objects.land), coast: topojson.mesh(t, t.objects.land) })).catch(() => null);
    return LANDS[res];
  }
  function create(el, opts = {}) {
    el.classList.add("wx");
    const base = Object.assign(document.createElement("canvas"), { className: "wx-base" });
    const flow = Object.assign(document.createElement("canvas"), { className: "wx-flow" });
    el.append(base, flow);
    const bctx = base.getContext("2d"), fctx = flow.getContext("2d");
    const st = { level: 850, wind: true, scalar: "speed", contours: true, storms: true, cells: false, walker: false, nino: false,
                 rot: [-80, -12], k: 1, meta: null, flowColor: true, flow: "wind", ocean: false, fc: null, towns: [], showTowns: false, sel: null, surf: null, lev: {}, landF: null, storms: [], climate: null, dragging: false };
    let W = 0, H = 0, R = 0, dpr = 1;
    const proj = d3.geoOrthographic().clipAngle(90).precision(0.6);
    const path = d3.geoPath(proj, bctx);

    // ---------------------------------------------------------------- data
    const getJSON = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(`${u}: ${r.status}`); return r.json(); });
    const getBin = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(`${u}: ${r.status}`); return r.arrayBuffer(); });
    const N = 181 * 360;
    function unpack(buf, names, ranges) {
      const u8 = new Uint8Array(buf), out = {};
      names.forEach((nm, k) => { const [lo, hi] = ranges[nm], a = new Float32Array(N), q = (hi - lo) / 254;
        for (let i = 0; i < N; i++) { const b = u8[k * N + i]; a[i] = b === 255 ? NaN : lo + b * q; } out[nm] = a; });
      return out;
    }
    st.cache = {}; st.t = 0;
    let LANDMASK = null;                                    // 1-degree Natural Earth land mask: keeps sea-only fields off the land
    const landMask = () => LANDMASK || (LANDMASK = fetch("vendor/landmask-1deg.bin").then((r) => (r.ok ? r.arrayBuffer() : null)).then((b) => (b ? new Uint8Array(b) : null)).catch(() => null));
    async function maskSea(S) { const m = await landMask(); if (!m) return; for (const k of ["sst", "hs", "wu", "wv", "cu", "cv", "sss"]) { const a = S[k]; if (a) for (let i = 0; i < a.length; i++) if (m[i]) a[i] = NaN; } }
    async function loadTime(i) {
      const M = st.meta; if (!st.cache[i]) st.cache[i] = { surf: null, lev: {} };
      const C = st.cache[i];
      if (!C.surf) { const s = unpack(await getBin(`${st.base}t${i}_sfc.bin?c=${encodeURIComponent(M.cycle)}`), M.sfc, M.ranges); await maskSea(s); C.surf = Object.assign(s, { u: s.u10, v: s.v10 }); }
      st.surf = C.surf; st.lev = C.lev;
    }
    async function load(baseUrl = "data/wx/") {
      st.meta = await getJSON(`${baseUrl}meta.json?t=${Date.now()}`); st.base = baseUrl; st.cache = {}; contourCache = null;   // always the newest run
      if (st.meta.format === "bin-v2") { st.t = st.meta.now || 0; await loadTime(st.t); }
      else { const s = await getJSON(baseUrl + "surface.json"); st.surf = {}; for (const [k, e] of Object.entries(s)) st.surf[k] = decode(e); await maskSea(st.surf); }
      await setLevel(st.meta.levels.includes(850) ? 850 : st.meta.levels[0]);
      return st.meta;
    }
    async function setTime(i) {
      if (!st.meta || st.meta.format !== "bin-v2") return;
      st.t = i; await loadTime(i); await levelData(st.level); contourCache = null;
      if (st.scalar === "ivt" || st.ar) await ensureLevels(); if (st.mid) await ensureLevels([500]);
      resetParticles(); draw();
    }
    async function levelData(p) {
      if (st.meta && st.meta.format === "bin-v2") {
        if (!st.lev[p]) { const M = st.meta, r = Object.assign({}, M.ranges, { hgt: M.ranges[`hgt${p}`], tmp: M.ranges[`tmp${p}`] });
          st.lev[p] = unpack(await getBin(`${st.base}t${st.t}_l${p}.bin?c=${encodeURIComponent(M.cycle)}`), M.lev, r); }
        return st.lev[p];
      }
      if (p === 1000 && st.surf && st.surf.u && !st.lev[1000]) {        // near the surface, use 10 m winds
        try { const l = await getJSON(`${st.base}lev_1000.json`); st.lev[1000] = { u: st.surf.u, v: st.surf.v, hgt: decode(l.hgt), rh: decode(l.rh) }; }
        catch (e) { st.lev[1000] = { u: st.surf.u, v: st.surf.v }; }
      }
      if (!st.lev[p]) { const l = await getJSON(`${st.base}lev_${p}.json`); st.lev[p] = {}; for (const [k, e] of Object.entries(l)) st.lev[p][k] = decode(e); }
      return st.lev[p];
    }
    async function setLevel(p) { st.level = p; await levelData(p); if (st.scalar === "shear") { await levelData(850); await levelData(200); } contourCache = null; resetParticles(); draw(); return p; }
    const NX = 360, NY = 181;
    function sample(a, lon, lat) {                          // bilinear on the 1-degree grid (row 0 = 90 N, col 0 = 0 E)
      if (!a) return NaN;
      const x = ((lon % 360) + 360) % 360, y = 90 - lat, i = Math.floor(x), j = Math.min(NY - 2, Math.max(0, Math.floor(y)));
      const fx = x - i, fy = y - j, i1 = (i + 1) % NX;
      const v00 = a[j * NX + i], v10 = a[j * NX + i1], v01 = a[(j + 1) * NX + i], v11 = a[(j + 1) * NX + i1];
      return (v00 * (1 - fx) + v10 * fx) * (1 - fy) + (v01 * (1 - fx) + v11 * fx) * fy;
    }
    const L = () => st.lev[st.level] || {};
    function vorticity(l) {                                 // relative vorticity on the sphere, x 1e-5 per second
      if (l.vort) return l.vort; const a = 6.371e6, d = Math.PI / 180, z = new Float32Array(NX * NY).fill(NaN);
      for (let j = 1; j < NY - 1; j++) { const lat = 90 - j, c = Math.cos(lat * d); if (Math.abs(lat) > 85) continue;
        for (let i = 0; i < NX; i++) { const e = (i + 1) % NX, w = (i + NX - 1) % NX, k = j * NX + i;
          const dvdx = (l.v[j * NX + e] - l.v[j * NX + w]) / (2 * a * c * d), dudy = (l.u[(j - 1) * NX + i] - l.u[(j + 1) * NX + i]) / (2 * a * d);
          z[k] = (dvdx - dudy + l.u[k] * Math.tan(lat * d) / a) * 1e5; } }
      return (l.vort = z);
    }
    const IVT_LEVELS = [1000, 850, 700, 500, 300];
    async function ensureLevels(list = IVT_LEVELS) { for (const p of list) if (st.meta && st.meta.levels.includes(p)) await levelData(p); }
    function ivtField() {                                    // IVT = (1/g) * integral of q*V dp, 1000-300 hPa, from the model's RH, T and wind
      const S = st.surf || {}; if (S._ivt) return S._ivt;
      const lv = IVT_LEVELS.filter((p) => st.lev[p] && st.lev[p].u && st.lev[p].rh && st.lev[p].tmp); if (lv.length < 4) return null;
      const n = NX * NY, qu = lv.map(() => new Float32Array(n)), qv = lv.map(() => new Float32Array(n));
      lv.forEach((p, k) => { const L_ = st.lev[p];
        for (let i = 0; i < n; i++) { const T = L_.tmp[i], es = 6.112 * Math.exp(17.67 * T / (T + 243.5)), e = Math.max(0, L_.rh[i]) / 100 * es, q = 0.622 * e / (p - 0.378 * e);
          qu[k][i] = q * L_.u[i]; qv[k][i] = q * L_.v[i]; } });
      const U = new Float32Array(n), V = new Float32Array(n), M = new Float32Array(n);
      for (let k = 1; k < lv.length; k++) { const dp = (lv[k - 1] - lv[k]) * 100 / 9.81;
        for (let i = 0; i < n; i++) { U[i] += 0.5 * (qu[k - 1][i] + qu[k][i]) * dp; V[i] += 0.5 * (qv[k - 1][i] + qv[k][i]) * dp; } }
      for (let i = 0; i < n; i++) M[i] = Math.hypot(U[i], V[i]);
      return (S._ivt = { U, V, M });
    }
    function riverList() {                                   // connected IVT >= 250 corridors, at least ~2000 km long, outside the deep tropics
      const S = st.surf || {}; if (S._ars) return S._ars; const f = ivtField(); if (!f) return [];
      const n = NX * NY, seen = new Uint8Array(n), out = [];
      for (let s0 = 0; s0 < n; s0++) {
        if (seen[s0] || !(f.M[s0] >= 250)) continue;
        const cells = [], stack = [s0]; seen[s0] = 1;
        while (stack.length) { const c = stack.pop(); cells.push(c); const j = Math.floor(c / NX), i = c % NX;
          for (const [dj, di] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const jj = j + dj; if (jj < 0 || jj >= NY) continue; const k = jj * NX + ((i + di + NX) % NX); if (!seen[k] && f.M[k] >= 250) { seen[k] = 1; stack.push(k); } } }
        if (cells.length < 8) continue;
        let best = cells[0], lat0 = 0, a = 1e9, b = -1e9, c0 = 1e9, d0 = -1e9;
        for (const c of cells) { const la = 90 - Math.floor(c / NX); lat0 += la; if (f.M[c] > f.M[best]) best = c; a = Math.min(a, la); b = Math.max(b, la); }
        lat0 /= cells.length; if (Math.abs(lat0) < 15) continue;
        const lons = cells.map((c) => c % NX).sort((x, y) => x - y); let gap = 0, gi = 0;   // longitude extent on a circle
        for (let k = 1; k < lons.length; k++) if (lons[k] - lons[k - 1] > gap) { gap = lons[k] - lons[k - 1]; gi = k; }
        const span = Math.min(360 - Math.max(gap, 360 - (lons[lons.length - 1] - lons[0])), lons[lons.length - 1] - lons[0]);
        const lenKm = Math.hypot(span * 111 * Math.cos(lat0 * Math.PI / 180), (b - a) * 111);
        if (lenKm < 2000) continue;
        out.push({ cells, max: f.M[best], lon: best % NX, lat: 90 - Math.floor(best / NX), lenKm: Math.round(lenKm) });
      }
      return (S._ars = out);
    }
    function midSystems() {                                  // closed lows and highs at 500 hPa (cut-off lows, monsoon mid-level cyclones, ridges)
      const l5 = st.lev[500]; if (!l5 || !l5.hgt) return [];
      if (l5._mid) return l5._mid; const h = l5.hgt, out = [], r = 6;
      const at = (j, i) => h[Math.max(0, Math.min(NY - 1, j)) * NX + ((i + NX) % NX)];
      for (let j = 15; j < NY - 15; j++) { const lat = 90 - j; if (Math.abs(lat) < 8 || Math.abs(lat) > 75) continue;
        for (let i = 0; i < NX; i++) { const c = at(j, i); if (!isFinite(c)) continue; let mn = true, mx = true;
          for (let dj = -r; dj <= r && (mn || mx); dj++) for (let di = -r; di <= r; di++) { if (!dj && !di) continue; const v = at(j + dj, i + di); if (v < c) mn = false; if (v > c) mx = false; }
          if (!mn && !mx) continue; let ring = 0;
          for (let k = 0; k < 16; k++) { const t = k * Math.PI / 8; ring += at(j + Math.round(r * Math.sin(t)), i + Math.round(r * Math.cos(t) / Math.max(0.3, Math.cos(lat * Math.PI / 180)))); }
          ring /= 16; const depth = mn ? ring - c : c - ring;
          if ((mn && depth >= 40) || (mx && depth >= 30)) out.push({ kind: mn ? "L" : "H", lon: i, lat, hgt: Math.round(c), depth: Math.round(depth) }); } }
      out.sort((x, y) => y.depth - x.depth); const kept = [];                  // one marker per system: drop weaker ones within ~8 degrees
      for (const m of out) if (!kept.some((k) => k.kind === m.kind && Math.abs(k.lat - m.lat) < 8 && Math.abs(((k.lon - m.lon + 540) % 360) - 180) < 8 / Math.max(.3, Math.cos(m.lat * Math.PI / 180)))) kept.push(m);
      return (l5._mid = kept);
    }
    let AOD = null, aodState = "";                           // NASA GIBS: Terra+Aqua MODIS value-added aerosol optical depth, daily
    function loadAOD() {
      if (AOD || aodState === "loading") return; aodState = "loading";
      const tryDay = (back) => { const d = new Date(Date.now() - back * 864e5).toISOString().slice(0, 10), img = new Image(); img.crossOrigin = "anonymous";
        img.onload = () => { const c = document.createElement("canvas"); c.width = 2048; c.height = 1024; const g = c.getContext("2d"); g.drawImage(img, 0, 0, 2048, 1024);
          try { AOD = { data: g.getImageData(0, 0, 2048, 1024).data, day: d, img: c }; aodState = "ok"; } catch (e) { aodState = "failed"; } draw(); opts.onAOD && opts.onAOD(aodState, d); };
        img.onerror = () => { if (back < 3) tryDay(back + 1); else { aodState = "failed"; opts.onAOD && opts.onAOD("failed"); } };
        img.src = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=MODIS_Combined_Value_Added_AOD&STYLES=&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=2048&HEIGHT=1024&FORMAT=image%2Fpng&TRANSPARENT=true&TIME=" + d; };
      tryDay(1);
    }
    function drawAOD(step) {
      if (!st.aod || !AOD) return; const w = Math.ceil(W / step), h = Math.ceil(H / step); scalarCanvas.width = w; scalarCanvas.height = h;
      const img = sctx.createImageData(w, h), D = img.data, cx = W / 2, cy = H / 2, A = AOD.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const px = x * step + step / 2, py = y * step + step / 2;
        if ((px - cx) ** 2 + (py - cy) ** 2 > R * R) continue; const ll = proj.invert([px, py]); if (!ll) continue;
        const ix = Math.min(2047, Math.floor((ll[0] + 180) / 360 * 2048)), iy = Math.min(1023, Math.floor((90 - ll[1]) / 180 * 1024)), o2 = (iy * 2048 + ix) * 4;
        if (A[o2 + 3] < 20) continue; const o = (y * w + x) * 4; D[o] = A[o2]; D[o + 1] = A[o2 + 1]; D[o + 2] = A[o2 + 2]; D[o + 3] = 215; }
      sctx.putImageData(img, 0, 0); bctx.imageSmoothingEnabled = true; bctx.drawImage(scalarCanvas, 0, 0, w * step, h * step);
    }
    function drawScience() {
      const P = PAL();
      if (st.ar) for (const ar of riverList()) {
        const m = new Float32Array(NX * NY); for (const c of ar.cells) m[c] = 1;
        for (const l of gridLines(m, [0.5])) { bctx.beginPath(); path(l); bctx.strokeStyle = "#ff4fa3"; bctx.lineWidth = 2.4; bctx.stroke(); }
        if (visible(ar.lon, ar.lat)) label(`Atmospheric river · ${Math.round(ar.max)} kg/m/s`, ar.lon, ar.lat, { size: 12, weight: 700, color: "#ff4fa3" });
      }
      if (st.heat) { const tw = wetBulb();                     // dangerous humid heat: wet-bulb 28 C (orange) and 31 C (red)
        if (tw) for (const [lev, col, wdt] of [[28, "#ff9b3d", 2], [31, "#ff2f4f", 2.6]]) for (const l of gridLines(tw, [lev])) { bctx.beginPath(); path(l); bctx.strokeStyle = col; bctx.lineWidth = wdt; bctx.stroke(); } }
      if (st.mid && st.lev[500] && st.lev[500].hgt) {
        for (const l of gridLines(st.lev[500].hgt, [5880])) { bctx.beginPath(); path(l); bctx.setLineDash([9, 5]); bctx.strokeStyle = "#ffb347"; bctx.lineWidth = 2.2; bctx.stroke(); bctx.setLineDash([]); }
        for (const m of midSystems()) { if (!visible(m.lon, m.lat)) continue; const p = proj([m.lon, m.lat]);
          bctx.beginPath(); bctx.arc(p[0], p[1], 13, 0, 2 * Math.PI); bctx.fillStyle = m.kind === "L" ? "rgba(70,120,230,.85)" : "rgba(235,140,40,.85)"; bctx.fill();
          bctx.lineWidth = 2; bctx.strokeStyle = "#fff"; bctx.stroke();
          bctx.font = "700 14px 'IBM Plex Sans', sans-serif"; bctx.textAlign = "center"; bctx.textBaseline = "middle"; bctx.fillStyle = "#fff"; bctx.fillText(m.kind, p[0], p[1] + 1);
          if (st.k >= 1.3) label(`${m.kind === "L" ? "500 hPa low" : "500 hPa high"} · ${m.hgt.toLocaleString("en")} m`, m.lon, m.lat - 2.6, { size: 11, weight: 600, color: P.text }); }
      }
    }
    function wetBulb() {                                     // Stull (2011) wet-bulb temperature from 2 m temperature (C) and humidity (%)
      const S = st.surf || {}; if (S._tw) return S._tw; if (!S.t2 || !S.rh2) return null;
      const n = S.t2.length, o = new Float32Array(n);
      for (let i = 0; i < n; i++) { const T = S.t2[i], R = Math.max(5, Math.min(99, S.rh2[i]));
        o[i] = isFinite(T) && isFinite(S.rh2[i]) ? T * Math.atan(0.151977 * Math.sqrt(R + 8.313659)) + Math.atan(T + R) - Math.atan(R - 1.676331) + 0.00391838 * R ** 1.5 * Math.atan(0.023101 * R) - 4.686035 : NaN; }
      return (S._tw = o);
    }
    function heatIndex(T, R) {                               // NOAA heat index (Rothfusz), in C
      const F = T * 9 / 5 + 32; let H = 0.5 * (F + 61 + (F - 68) * 1.2 + R * 0.094);
      if (H >= 80) H = -42.379 + 2.04901523 * F + 10.14333127 * R - 0.22475541 * F * R - 0.00683783 * F * F - 0.05481717 * R * R + 0.00122874 * F * F * R + 0.00085282 * F * R * R - 0.00000199 * F * F * R * R;
      return (H - 32) * 5 / 9;
    }
    function scalarFor(name) {
      if (name === "ivt") { const f = ivtField(); return f ? f.M : null; }
      if (name === "tw") return wetBulb();
      if (name === "up") { const l = L(); if (!l.w) return null; if (!l._up) { l._up = new Float32Array(l.w.length); for (let i = 0; i < l.w.length; i++) l._up[i] = -l.w[i]; } return l._up; }
      if (name === "sss") return (st.surf || {}).sss;
      const l = L(), S = st.surf || {};
      if (name === "hs") return S.hs;
      if (name === "curspd") { if (!S.cu) return null; if (!S.cspd) { S.cspd = new Float32Array(NX * NY); for (let i = 0; i < NX * NY; i++) S.cspd[i] = Math.hypot(S.cu[i], S.cv[i]); } return S.cspd; }
      if (name === "tmp") return l.tmp; if (name === "vort") return l.u ? vorticity(l) : null; if (name === "cape") return S.cape; if (name === "rain") return S.rain6;
      if (name === "shear") { const a = st.lev[850], b = st.lev[200]; if (!a || !b || !a.u || !b.u) return null;
        if (!S.shear) { S.shear = new Float32Array(NX * NY); for (let i = 0; i < NX * NY; i++) S.shear[i] = Math.hypot(b.u[i] - a.u[i], b.v[i] - a.v[i]); } return S.shear; }
      const keep = st.scalar; st.scalar = name; const r = scalarArray(); st.scalar = keep; return r;
    }
    function rampFor(name) {
      const R = RAMPS[name]; if (!R) return null;
      if (name === "tmp" && st.meta && st.meta.ranges && st.meta.ranges[`tmp${st.level}`]) { const [lo, hi] = st.meta.ranges[`tmp${st.level}`]; return Object.assign({}, R, { lo, hi }); }
      return R;
    }
    function scalarArray() {
      if (["tmp", "vort", "cape", "rain", "shear", "hs", "curspd", "ivt", "sss", "up", "tw"].includes(st.scalar)) return scalarFor(st.scalar);
      if (st.scalar === "pwat") return st.surf && st.surf.pwat;
      if (st.scalar === "sst") return st.surf && st.surf.sst;
      if (st.scalar === "rh") return L().rh;
      if (st.scalar === "speed") { const l = L(); if (!l.u) return null;
        if (!l.spd) { l.spd = new Float32Array(l.u.length); for (let i = 0; i < l.u.length; i++) l.spd[i] = Math.hypot(l.u[i], l.v[i]); } return l.spd; }
      return null;
    }
    const contourArray = () => (st.level === 1000 ? st.surf && st.surf.mslp : L().hgt);

    // ---------------------------------------------------------------- geometry
    function resize() {
      const r = el.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(320, r.width); H = Math.max(300, r.height);
      for (const c of [base, flow]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); c.style.width = `${W}px`; c.style.height = `${H}px`; }
      fit(); resetParticles(); draw();
    }
    function fit() { R = Math.min(W, H) * 0.46 * st.k; proj.rotate(st.rot).scale(R).translate([W / 2, H / 2]); }
    const visible = (lon, lat) => d3.geoDistance([lon, lat], [-st.rot[0], -st.rot[1]]) < Math.PI / 2 - 0.02;

    // ---------------------------------------------------------------- static layers
    let land = null, coast = null, landRes = "", placeList = [];
    function useLand() {                                     // sharper coastlines as you zoom in
      const want = st.k >= 4 ? "10m" : st.k >= 1.8 ? "50m" : "110m"; if (want === landRes) return; landRes = want;
      landSet(want).then((L) => { if (L && landRes === want) { land = L.land; coast = L.coast; draw(); } });
    }
    useLand(); places().then((p) => { placeList = p; draw(); });
    const scalarCanvas = document.createElement("canvas"), sctx = scalarCanvas.getContext("2d");
    function drawScalar(step) {
      const a = scalarArray(); if (!a || st.scalar === "none") return;
      const ramp = rampFor(st.scalar), w = Math.ceil(W / step), h = Math.ceil(H / step), rainy = st.scalar === "rain";
      scalarCanvas.width = w; scalarCanvas.height = h;
      const img = sctx.createImageData(w, h), D = img.data, cx = W / 2, cy = H / 2;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const px = x * step + step / 2, py = y * step + step / 2;
        if ((px - cx) ** 2 + (py - cy) ** 2 > R * R) continue;
        const ll = proj.invert([px, py]); if (!ll) continue;
        const v = sample(a, ll[0], ll[1]); if (!isFinite(v) || (rainy && v < 0.5) || (ramp.min != null && v < ramp.min)) continue;
        const t = Math.max(0, Math.min(255, Math.round((ramp.f(v) - ramp.lo) / (ramp.hi - ramp.lo) * 255))), c = ramp.lut[t], o = (y * w + x) * 4;
        D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2]; D[o + 3] = 205;
      }
      sctx.putImageData(img, 0, 0);
      bctx.imageSmoothingEnabled = true; bctx.drawImage(scalarCanvas, 0, 0, w * step, h * step);
    }
    function gridLines(a, thresholds) {                     // contour lines as MultiLineStrings in lon/lat
      const w = NX + 1, vals = new Float64Array(w * NY);
      for (let j = 0; j < NY; j++) for (let i = 0; i < w; i++) { const v = a[j * NX + (i % NX)]; vals[j * w + i] = isFinite(v) ? v : NaN; }
      const edge = (x, y) => x <= 0 || x >= w || y <= 0 || y >= NY;
      return d3.contours().size([w, NY]).thresholds(thresholds)(vals).map((c) => {
        const lines = [];
        for (const ring of c.coordinates.flat()) {
          let cur = [];
          for (let k = 0; k < ring.length; k++) {
            const [x, y] = ring[k], prev = ring[k - 1];
            if (prev && edge(prev[0], prev[1]) && edge(x, y)) { if (cur.length > 1) lines.push(cur); cur = []; }
            cur.push([x - 0.5, 90 - (y - 0.5)]);
          }
          if (cur.length > 1) lines.push(cur);
        }
        return { value: c.value, type: "MultiLineString", coordinates: lines };
      });
    }
    let contourCache = null;
    function contours() {
      const a = contourArray(); if (!a) return [];
      const key = `${st.level}`; if (contourCache && contourCache.key === key) return contourCache.lines;
      let lo = Infinity, hi = -Infinity; for (const v of a) if (isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; }
      const step = st.level === 1000 ? 4 : st.level >= 700 ? 30 : st.level >= 500 ? 60 : 120;
      const th = d3.range(Math.ceil(lo / step) * step, hi, step);
      contourCache = { key, lines: gridLines(a, th), centres: extrema(a, st.level === 1000 ? 4 : step * 0.7) };
      return contourCache.lines;
    }
    function extrema(a, minDiff) {                           // H and L: local extremes within ~10 degrees
      const out = [], r = 10;
      for (let j = 12; j < NY - 12; j += 2) for (let i = 0; i < NX; i += 2) {
        const v = a[j * NX + i]; if (!isFinite(v)) continue;
        let isMin = true, isMax = true, sum = 0, n = 0;
        for (let dj = -r; dj <= r && (isMin || isMax); dj += 2) for (let di = -r; di <= r; di += 2) {
          if (!di && !dj) continue; const w = a[(j + dj) * NX + ((i + di + NX) % NX)]; if (!isFinite(w)) continue;
          if (w < v) isMin = false; if (w > v) isMax = false; sum += w; n++;
        }
        if (!n) continue; const mean = sum / n;
        if (isMin && mean - v >= minDiff) out.push({ lon: i, lat: 90 - j, kind: "L", v });
        if (isMax && v - mean >= minDiff) out.push({ lon: i, lat: 90 - j, kind: "H", v });
      }
      return out;
    }

    // ---------------------------------------------------------------- teaching overlays
    const band = (la0, la1) => ({ type: "Polygon", coordinates: [[...d3.range(-180, 181, 5).map((x) => [x, la0]), ...d3.range(180, -181, -5).map((x) => [x, la1]), [-180, la0]]] });
    const box = (lo0, la0, lo1, la1) => ({ type: "Polygon", coordinates: [[[lo0, la0], [lo0, la1], [lo1, la1], [lo1, la0], [lo0, la0]]] });
    const CELLS = [
      { id: "hadley", name: "Hadley cell", rgb: "232,163,61", bands: [[0, 30], [-30, 0]] },
      { id: "ferrel", name: "Ferrel cell", rgb: "47,163,154", bands: [[30, 60], [-60, -30]] },
      { id: "polar", name: "Polar cell", rgb: "122,160,214", bands: [[60, 90], [-90, -60]] }];
    const BELTS = [[15, "Trade winds blow towards the equator from the east"], [-15, "South-east trade winds"], [45, "Westerlies"], [-45, "Westerlies (Roaring Forties)"],
                   [72, "Polar easterlies"], [-72, "Polar easterlies"], [30, "Subtropical highs: sinking, dry air"], [-30, "Subtropical highs"]];
    const REGIONS = {
      nino34: { name: "Niño 3.4", geo: box(-170, -5, -120, 5) },
      iodw: { name: "IOD west pole", geo: box(50, -10, 70, 10) },
      iode: { name: "IOD east pole", geo: box(90, -10, 110, 0) },
      walker: { name: "Walker circulation", geo: box(100, -10, 280, 10) } };
    function itcz() {                                        // wettest latitude between 20S and 20N, from water vapour
      const a = st.surf && st.surf.pwat; if (!a) return null; const pts = [];
      for (let lon = 0; lon <= 360; lon += 4) {
        let best = -1, bl = 0; for (let lat = -20; lat <= 20; lat++) { const v = sample(a, lon, lat); if (v > best) { best = v; bl = lat; } }
        pts.push([lon, bl]);
      }
      const sm = pts.map((p, i) => [p[0], d3.mean(pts.slice(Math.max(0, i - 3), i + 4), (q) => q[1])]);
      return { type: "LineString", coordinates: sm };
    }
    function arrow(coords, color, width = 2.5) {            // a curved geo arrow with a head at its end
      const line = { type: "LineString", coordinates: coords };
      bctx.beginPath(); path(line); bctx.strokeStyle = color; bctx.lineWidth = width; bctx.stroke();
      const a = proj(coords[coords.length - 2]), b = proj(coords[coords.length - 1]);
      if (!a || !b || !visible(...coords[coords.length - 1])) return;
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), s = 9;
      bctx.beginPath(); bctx.moveTo(b[0], b[1]); bctx.lineTo(b[0] - s * Math.cos(ang - 0.45), b[1] - s * Math.sin(ang - 0.45));
      bctx.lineTo(b[0] - s * Math.cos(ang + 0.45), b[1] - s * Math.sin(ang + 0.45)); bctx.closePath(); bctx.fillStyle = color; bctx.fill();
    }
    function label(text, lon, lat, opt = {}) {
      if (!visible(lon, lat)) return; const p = proj([lon, lat]); if (!p) return;
      bctx.font = `${opt.weight || 600} ${opt.size || 13}px "IBM Plex Sans Condensed", "Arial Narrow", sans-serif`;
      bctx.textAlign = opt.align || "center"; bctx.textBaseline = "middle";
      const P_ = PAL(); bctx.lineJoin = "round"; bctx.miterLimit = 2; bctx.lineWidth = 3.5; bctx.strokeStyle = P_.halo; bctx.strokeText(text, p[0] + (opt.dx || 0), p[1]);
      bctx.fillStyle = opt.color || P_.text; bctx.fillText(text, p[0] + (opt.dx || 0), p[1]);
    }
    function drawPlaces() {
      const z = Math.log2(2 * Math.PI * R / 256) + 0.9, boxes = [], max = 240;   // the web-map zoom the globe is shown at
      bctx.font = `500 12px "IBM Plex Sans Condensed", "Arial Narrow", sans-serif`; bctx.textBaseline = "middle";
      let n = 0;
      for (const p of placeList) {
        if (p[3] > z) break; if (!visible(p[2], p[1])) continue;
        const xy = proj([p[2], p[1]]); if (!xy) continue;
        const name = placeName(p), w = bctx.measureText(name).width + 8, b = [xy[0] - 3, xy[1] - 8, xy[0] + w, xy[1] + 8];
        if (b[0] < 0 || b[2] > W || b[1] < 0 || b[3] > H) continue;
        if (boxes.some((q) => b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1])) continue;
        boxes.push(b); const big = p[3] <= 3;
        const Pp = PAL(); bctx.beginPath(); bctx.arc(xy[0], xy[1], big ? 2.6 : 2, 0, 2 * Math.PI); bctx.fillStyle = Pp.text; bctx.fill();
        bctx.lineJoin = "round"; bctx.lineWidth = 3; bctx.strokeStyle = Pp.halo; bctx.textAlign = "left";
        bctx.font = `${big ? 600 : 500} ${big ? 13 : 12}px "IBM Plex Sans Condensed", "Arial Narrow", sans-serif`;
        bctx.strokeText(name, xy[0] + 5, xy[1]); bctx.fillStyle = big ? Pp.text : Pp.sub; bctx.fillText(name, xy[0] + 5, xy[1]);
        if (++n >= max) break;
      }
    }
    const CURRENTS = [                      // [name, warm?, path (lon, lat)]
      ["Gulf Stream", 2, [[-80, 25], [-80, 30], [-75, 35], [-70, 38], [-60, 40], [-50, 42], [-40, 45]]], ["North Atlantic Drift", 1, [[-40, 45], [-30, 50], [-20, 55], [-10, 58], [0, 62]]],
      ["Labrador Current", -2, [[-60, 62], [-57, 57], [-54, 52], [-52, 48], [-50, 44]]], ["Canary Current", 0, [[-15, 40], [-17, 33], [-18, 27], [-20, 20]]],
      ["North Equatorial Current", 1, [[-20, 15], [-35, 14], [-50, 13], [-62, 14]]], ["South Equatorial Current", 1, [[5, -2], [-10, -4], [-25, -6], [-35, -8]]],
      ["Brazil Current", 1, [[-35, -10], [-38, -18], [-42, -25], [-48, -32], [-52, -38]]], ["Falklands Current", 0, [[-62, -52], [-60, -45], [-57, -40]]],
      ["Benguela Current", -2, [[18, -34], [15, -28], [12, -20], [9, -12]]], ["Agulhas Current", 2, [[40, -15], [36, -22], [32, -28], [28, -33], [22, -37], [18, -39]]],
      ["Kuroshio", 2, [[122, 22], [125, 27], [130, 31], [136, 34], [142, 36], [150, 37]]], ["North Pacific Current", 1, [[150, 40], [170, 42], [-170, 43], [-150, 44], [-135, 45]]],
      ["Oyashio", 0, [[158, 52], [152, 47], [146, 43], [144, 40]]], ["California Current", 0, [[-125, 48], [-124, 40], [-120, 33], [-115, 25]]], ["Alaska Current", 1, [[-135, 50], [-140, 56], [-148, 59]]],
      ["North Equatorial Current", 1, [[-110, 15], [-140, 14], [-170, 13], [160, 14], [130, 15]]], ["South Equatorial Current", 1, [[-85, -3], [-110, -5], [-140, -7], [-170, -9], [160, -10]]],
      ["Equatorial Counter Current", 1, [[130, 6], [160, 6], [-170, 6], [-130, 6], [-95, 6]]], ["Humboldt (Peru) Current", -2, [[-75, -45], [-75, -35], [-77, -25], [-80, -15], [-82, -5]]],
      ["East Australian Current", 1, [[155, -15], [154, -22], [153, -28], [152, -33], [155, -38]]], ["Leeuwin Current", 1, [[114, -22], [113, -28], [115, -34], [120, -35]]],
      ["Somali Current (summer monsoon)", 2, [[45, -2], [48, 3], [51, 8], [55, 12]]], ["South Equatorial Current", 1, [[110, -12], [90, -13], [70, -14], [55, -15], [45, -15]]],
      ["Indonesian Throughflow", 1, [[125, -5], [120, -9], [115, -11], [110, -12]]],
      ["Antarctic Circumpolar Current", -2, d3.range(-180, 181, 15).map((x) => [x, -55 + 3 * Math.sin(x * Math.PI / 90)])]];
    const GYRES = [["North Atlantic Gyre ↻", -45, 30], ["South Atlantic Gyre ↺", -15, -28], ["North Pacific Gyre ↻", -160, 30], ["South Pacific Gyre ↺", -120, -30], ["Indian Ocean Gyre ↺", 80, -28]];
    function drawOcean() {                                     // major currents always; the others and their names appear as you zoom in
      const P = PAL(), close = st.k >= 1.7, boxes = [];
      for (const [name, kind, pts] of CURRENTS) {
        const major = Math.abs(kind) === 2, warm = kind > 0; if (!major && !close) continue;
        const dense = []; for (let i = 1; i < pts.length; i++) for (let k = 0; k < 6; k++) { const a = pts[i - 1], b = pts[i]; dense.push([a[0] + (b[0] - a[0]) * k / 6, a[1] + (b[1] - a[1]) * k / 6]); }
        dense.push(pts[pts.length - 1]); arrow(dense, warm ? P.warm : P.cold, major ? 2.4 : 1.6);
        const m = pts[Math.floor(pts.length / 2)]; if (!visible(m[0], m[1])) continue; const q = proj(m); if (!q) continue;
        const b = [q[0] - 60, q[1] - 6, q[0] + 60, q[1] + 22]; if (boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])) continue; boxes.push(b);
        label(name.replace(" Current", ""), m[0], m[1] + 2.2, { size: 11, color: warm ? P.warm : P.cold, weight: 600 });
      }
      for (const [name, lo, la] of GYRES) label(name, lo, la, { size: close ? 15 : 13, weight: 700 });
    }
    function drawOverlays() {
      const PO = PAL(), ink = PO.text, ink2 = isLight() ? "rgba(19,40,58,.45)" : "rgba(255,255,255,.45)";
      if (st.ocean) drawOcean();
      const c = -st.rot[0];
      if (st.cells) {
        for (const cell of CELLS) for (const [a, b] of cell.bands) {
          bctx.beginPath(); path(band(a, b)); bctx.fillStyle = `rgba(${cell.rgb},.16)`; bctx.fill();
          label(cell.name, c, (a + b) / 2 + (a >= 0 ? 4 : -4), { size: 16, color: `rgb(${cell.rgb})` });
        }
        for (const [la, t] of BELTS) label(t, c, la - (Math.abs(la) === 30 ? 0 : 3.5) * Math.sign(la), { size: 12, weight: 500 });
        for (const la of [-60, -30, 30, 60]) { bctx.beginPath(); path({ type: "LineString", coordinates: d3.range(-180, 181, 5).map((x) => [x, la]) });
          bctx.setLineDash([6, 6]); bctx.strokeStyle = ink2; bctx.lineWidth = 1; bctx.stroke(); bctx.setLineDash([]); }
        const it = itcz();
        if (it) { bctx.beginPath(); path(it); bctx.strokeStyle = "#ffd27a"; bctx.lineWidth = 2.5; bctx.setLineDash([2, 5]); bctx.stroke(); bctx.setLineDash([]);
          const p = it.coordinates.reduce((b, q) => (Math.abs(((q[0] - c + 540) % 360) - 180) < Math.abs(((b[0] - c + 540) % 360) - 180) ? q : b)); label("ITCZ: rising air, heavy rain (from today's water vapour)", c, p[1] + 3.5, { size: 12, color: "#ffd27a" }); }
        for (const s of [1, -1]) {                             // surface flow arrows in each belt
          arrow(d3.range(c + 14, c - 15, -2).map((x) => [x, s * (20 - (c + 14 - x) * 0.25)]), ink);
          arrow(d3.range(c - 14, c + 15, 2).map((x) => [x, s * (40 + (x - c + 14) * 0.22)]), ink);
        }
      }
      if (st.walker) {
        bctx.beginPath(); path(REGIONS.walker.geo); bctx.fillStyle = "rgba(47,111,163,.18)"; bctx.fill();
        const enso = st.climate && st.climate.enso, el = enso && enso.phase === "El Niño", la = enso && enso.phase === "La Niña";
        arrow(d3.range(275, 125, -5).map((x) => [x, 0]), el ? ink2 : ink, el ? 2 : 3.5);
        arrow(d3.range(130, 270, 5).map((x) => [x, 7 + Math.sin((x - 130) / 140 * Math.PI) * 2]), "rgba(255,210,122,.95)", 2.5);
        for (const [x, up] of [[el ? 190 : 130, true], [270, false]]) {
          const p = visible(x, 0) && proj([x, 0]); if (!p) continue;
          bctx.beginPath(); bctx.arc(p[0], p[1], 9, 0, 2 * Math.PI); bctx.strokeStyle = up ? "#e8a33d" : ink; bctx.lineWidth = 2; bctx.stroke();
          bctx.beginPath(); if (up) { bctx.arc(p[0], p[1], 3, 0, 2 * Math.PI); bctx.fillStyle = "#ffd27a"; bctx.fill(); }      // dot: air rising towards you
          else { bctx.moveTo(p[0] - 5, p[1] - 5); bctx.lineTo(p[0] + 5, p[1] + 5); bctx.moveTo(p[0] + 5, p[1] - 5); bctx.lineTo(p[0] - 5, p[1] + 5); bctx.stroke(); }  // cross: sinking
        }
        label(el ? "Rising air shifts east during El Niño" : "Rising air, deep clouds, heavy rain", el ? 200 : 125, -6.5, { size: 12, color: "#ffd27a" });
        label("Sinking, dry air", 265, -6.5, { size: 12 });
        label(`Easterly trade winds along the equator${la ? " (stronger now: La Niña)" : el ? " (weaker now: El Niño)" : ""}`, 200, -2.5, { size: 12 });
        label("Return flow aloft (upper troposphere)", 200, 11, { size: 12, color: "#ffd27a" });
      }
      if (st.nino) {
        for (const [k, col] of [["nino34", "#ff8f6b"], ["iodw", "#7fe0b0"], ["iode", "#7fe0b0"]]) {
          bctx.beginPath(); path(REGIONS[k].geo); bctx.strokeStyle = col; bctx.lineWidth = 2.2; bctx.stroke(); bctx.fillStyle = col + "22"; bctx.fill();
        }
        const e = st.climate && st.climate.enso, i = st.climate && st.climate.iod;
        label(`Niño 3.4${e ? `: ${e.phase} (${e.value > 0 ? "+" : ""}${e.value} °C)` : ""}`, -145, 8.5, { color: "#ff8f6b" });
        label("IOD west", 60, 13, { color: "#7fe0b0" }); label(`IOD east${i ? `: dipole ${i.phase} (${i.value > 0 ? "+" : ""}${i.value})` : ""}`, 100, -13.5, { color: "#7fe0b0" });
      }
    }

    // ---------------------------------------------------------------- draw
    function draw() {
      if (!W) return; fit(); const step = st.dragging ? 6 : 2;
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0); bctx.clearRect(0, 0, W, H);
      const P = PAL();
      bctx.beginPath(); path({ type: "Sphere" }); bctx.fillStyle = P.sea; bctx.fill();
      if (land) { bctx.beginPath(); path(land); bctx.fillStyle = P.land; bctx.fill(); }
      drawScalar(step); drawAOD(step);
      bctx.beginPath(); path(d3.geoGraticule10()); bctx.strokeStyle = P.grat; bctx.lineWidth = 0.6; bctx.stroke();
      if (coast) { bctx.beginPath(); path(coast); bctx.strokeStyle = P.coast; bctx.lineWidth = 0.8; bctx.stroke(); }
      if (st.scalar === "sst" && st.surf && st.surf.sst && !st.dragging) {         // the 26.5 C line: warm enough for cyclones
        for (const l of gridLines(st.surf.sst, [26.5])) { bctx.beginPath(); path(l); bctx.strokeStyle = "#fff"; bctx.lineWidth = 1.6; bctx.setLineDash([5, 4]); bctx.stroke(); bctx.setLineDash([]); }
      }
      if (st.contours && !st.dragging) {
        for (const l of contours()) { bctx.beginPath(); path(l); bctx.strokeStyle = P.cont; bctx.lineWidth = 0.9; bctx.stroke(); }
        for (const c of (contourCache && contourCache.centres) || [])
          label(c.kind, c.lon, c.lat, { size: 22, weight: 700, color: c.kind === "H" ? "#7fb5ff" : "#ff8f8f" });
      }
      drawOverlays(); if (!st.dragging) drawScience();
      if (st.storms) for (const s of st.storms) {
        const tr = s.track || []; if (tr.length > 1) { bctx.beginPath(); path({ type: "LineString", coordinates: tr.map((p) => [p[2], p[1]]) }); bctx.strokeStyle = "rgba(255,255,255,.85)"; bctx.lineWidth = 1.6; bctx.stroke(); }
        if (!visible(s.lon, s.lat)) continue; const p = proj([s.lon, s.lat]);
        bctx.beginPath(); bctx.arc(p[0], p[1], 9, 0, 2 * Math.PI); bctx.fillStyle = s.color; bctx.fill(); bctx.lineWidth = 2; bctx.strokeStyle = "#fff"; bctx.stroke();
        label(`${s.name}, ${Math.round(s.vmax_kt * 1.852)} km/h`, s.lon, s.lat, { align: "left", size: 14, dx: 14 });
      }
      if (st.fc) {                                            // GEFS members, ensemble mean (dashed) and day marks
        for (const m of st.fc.members || []) { bctx.beginPath(); path({ type: "LineString", coordinates: m.map((q) => [q[2], q[1]]) }); bctx.strokeStyle = "rgba(255,255,255,.28)"; bctx.lineWidth = 1; bctx.stroke(); }
        if (st.fc.mean) { bctx.beginPath(); path({ type: "LineString", coordinates: st.fc.mean.map((q) => [q[2], q[1]]) }); bctx.setLineDash([8, 5]); bctx.strokeStyle = "#ffd27a"; bctx.lineWidth = 2.6; bctx.stroke(); bctx.setLineDash([]);
          for (const q of st.fc.mean) if (q[0] && q[0] % 24 === 0 && visible(q[2], q[1])) { const p = proj([q[2], q[1]]); bctx.beginPath(); bctx.arc(p[0], p[1], 4, 0, 2 * Math.PI); bctx.fillStyle = "#ffd27a"; bctx.fill();
            label(`+${q[0] / 24}d`, q[2], q[1], { size: 11, color: "#ffd27a", align: "left", dx: 7 }); } }
      }
      if (st.showTowns) for (const tw of st.towns) {
        if (!visible(tw.lon, tw.lat)) continue; const p = proj([tw.lon, tw.lat]);
        bctx.fillStyle = tw.alert ? "#ff8f6b" : "#e8f0f4"; bctx.fillRect(p[0] - 3, p[1] - 3, 6, 6);
        if (st.k >= 1.8) label(tw.name, tw.lon, tw.lat, { size: 11, align: "left", dx: 6, weight: 500 });
      }
      if (st.labels !== false && placeList.length && !st.dragging) drawPlaces();
      if (st.sel) { const s0 = st.storms.find((x) => x.key === st.sel); if (s0 && visible(s0.lon, s0.lat)) { const p = proj([s0.lon, s0.lat]); bctx.beginPath(); bctx.arc(p[0], p[1], 15, 0, 2 * Math.PI); bctx.strokeStyle = "#ffd27a"; bctx.lineWidth = 2.5; bctx.stroke(); } }
      if (marker && visible(...marker)) { const p = proj(marker); bctx.beginPath(); bctx.arc(p[0], p[1], 6, 0, 2 * Math.PI); bctx.strokeStyle = "#fff"; bctx.lineWidth = 2; bctx.stroke(); }
      bctx.beginPath(); path({ type: "Sphere" }); bctx.strokeStyle = P.edge; bctx.lineWidth = 1; bctx.stroke();
    }

    // ---------------------------------------------------------------- streamlines
    let parts = [], raf = 0, running = true;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    function spawn(first) {                                  // uniform random seeding over the visible disc
      for (let t = 0; t < 20; t++) {
        const a = Math.random() * 2 * Math.PI, r = Math.sqrt(Math.random()) * R * 0.97;
        const ll = proj.invert([W / 2 + r * Math.cos(a), H / 2 + r * Math.sin(a)]);
        if (ll) { const life = 120 + Math.floor(Math.random() * 90); return { lon: ll[0], lat: ll[1], age: first ? Math.floor(Math.random() * life) : 0, life }; }
      }
      return { lon: 0, lat: 0, age: 0, life: 80 };
    }
    function resetParticles() {
      const n = Math.round(Math.max(900, Math.min(3600, Math.PI * R * R / 140)));
      parts = Array.from({ length: n }, () => spawn(true)); fctx.setTransform(dpr, 0, 0, dpr, 0, 0); fctx.clearRect(0, 0, W, H);
    }
    function tick() {
      raf = requestAnimationFrame(tick);
      if (!running || !st.wind || st.dragging || !W) return;
      const l = L(), S = st.surf || {}; if (!l.u) return;
      const mode = st.flow, U = mode === "waves" ? S.wu : mode === "currents" ? S.cu : l.u, V = mode === "waves" ? S.wv : mode === "currents" ? S.cv : l.v;
      if (!U) return;
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fctx.globalCompositeOperation = "destination-in"; fctx.fillStyle = "rgba(0,0,0,0.965)"; fctx.fillRect(0, 0, W, H);
      fctx.globalCompositeOperation = "source-over"; fctx.lineWidth = 1.4; fctx.lineCap = "round";
      const sp = 0.008 / st.k, bins = Array.from({ length: NBIN }, () => []), mono = !st.flowColor, edged = st.flowColor && st.scalar && st.scalar !== "none";
      for (const p of parts) {
        let u = sample(U, p.lon, p.lat), v = sample(V, p.lon, p.lat), shade;
        if (!isFinite(u) || ++p.age > p.life || !visible(p.lon, p.lat)) { Object.assign(p, spawn(false)); continue; }
        if (mode === "waves") { const h = sample(S.hs, p.lon, p.lat); shade = (h / 12) * 200; u *= 9; v *= 9; }          // unit vectors: show direction, colour by height
        else if (mode === "currents") { shade = (Math.hypot(u, v) / 2) * 200; u *= 14; v *= 14; }                          // slow currents, sped up to be seen
        else shade = Math.hypot(u, v) * 3.6;
        const a = proj([p.lon, p.lat]);
        p.lon += u * sp / Math.max(0.2, Math.cos(p.lat * Math.PI / 180)); p.lat = Math.max(-85, Math.min(85, p.lat + v * sp));
        const b = proj([p.lon, p.lat]); if (!a || !b || Math.abs(a[0] - b[0]) > 30) continue;
        bins[binOf(shade)].push(a[0], a[1], b[0], b[1]);
      }
      if (edged) {                                            // a thin dark (or light) edge keeps coloured lines visible on any colour layer
        fctx.beginPath(); for (const q of bins) for (let k = 0; k < q.length; k += 4) { fctx.moveTo(q[k], q[k + 1]); fctx.lineTo(q[k + 2], q[k + 3]); }
        fctx.lineWidth = 2.6; fctx.strokeStyle = isLight() ? "rgba(255,255,255,.35)" : "rgba(4,12,22,.32)"; fctx.stroke(); fctx.lineWidth = 1.8;
      }
      for (let i = 0; i < NBIN; i++) { const q = bins[i]; if (!q.length) continue;
        fctx.beginPath(); for (let k = 0; k < q.length; k += 4) { fctx.moveTo(q[k], q[k + 1]); fctx.lineTo(q[k + 2], q[k + 3]); }
        if (!edged) fctx.lineWidth = 1.4;
        fctx.strokeStyle = mono ? (isLight() ? `rgba(20,36,50,${0.45 + 0.03 * i})` : `rgba(255,255,255,${0.5 + 0.03 * i})`) : (isLight() ? binColorLight : binColor)[i]; fctx.stroke(); }
    }
    if (!reduce) raf = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", () => { running = !document.hidden; });

    // ---------------------------------------------------------------- interaction
    let drag = null, moved = false, marker = null;
    const touches = new Map(); let pinch = null;             // two fingers: pinch to zoom
    flow.addEventListener("pointerdown", (e) => { touches.set(e.pointerId, [e.clientX, e.clientY]);
      if (touches.size === 2) { const [p1, p2] = [...touches.values()]; pinch = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]); drag = null; return; } drag = { x: e.clientX, y: e.clientY, rot: st.rot.slice() }; moved = false; flow.setPointerCapture(e.pointerId); });
    flow.addEventListener("pointermove", (e) => {
      if (touches.has(e.pointerId)) touches.set(e.pointerId, [e.clientX, e.clientY]);
      if (pinch && touches.size === 2) { const [p1, p2] = [...touches.values()], d1 = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]), d0 = pinch;
        if (Math.abs(d1 - d0) > 4) { zoom(d0 / d1 < 1 ? 1 + (d1 / d0 - 1) : 1 / (1 + (d0 / d1 - 1))); pinch = d1; moved = true; } return; }
      if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) moved = true; if (!moved) return;
      st.dragging = true; const f = 90 / R;
      st.rot = [drag.rot[0] + dx * f, Math.max(-75, Math.min(75, drag.rot[1] - dy * f))]; fctx.clearRect(0, 0, W, H); draw();
    });
    const endTouch = (e) => { touches.delete(e.pointerId); if (touches.size < 2) pinch = null; };
    flow.addEventListener("pointercancel", (e) => { endTouch(e); drag = null; });
    flow.addEventListener("pointerup", (e) => { const wasPinch = !!pinch || touches.size > 1; endTouch(e); if (wasPinch) { drag = null; return; }
      const was = moved; drag = null; if (st.dragging) { st.dragging = false; resetParticles(); draw(); }
      if (!was) pick(e);
    });
    flow.addEventListener("wheel", (e) => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
    function zoom(f) { st.k = Math.max(0.7, Math.min(24, st.k * f)); useLand(); resetParticles(); draw(); }
    function pick(e) {
      const r = flow.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if ((x - W / 2) ** 2 + (y - H / 2) ** 2 > R * R) return;
      for (const s of st.storms) { const p = visible(s.lon, s.lat) && proj([s.lon, s.lat]); if (p && Math.hypot(p[0] - x, p[1] - y) < 16) { opts.onStorm && opts.onStorm(s.key); return; } }
      if (st.showTowns) for (const tw of st.towns) { const p = visible(tw.lon, tw.lat) && proj([tw.lon, tw.lat]); if (p && Math.hypot(p[0] - x, p[1] - y) < 9) { opts.onTown && opts.onTown(tw.name); return; } }
      const ll = proj.invert([x, y]); if (!ll) return; const [lon, lat] = ll;
      marker = [lon, lat]; draw();
      opts.onPick && opts.onPick(readout(lon, lat));
    }
    function readout(lon, lat) {
      const l = L(), u = sample(l.u, lon, lat), v = sample(l.v, lon, lat), spd = Math.hypot(u, v);
      const from = DIRS[Math.round(((Math.atan2(-u, -v) * 180 / Math.PI + 360) % 360) / 22.5) % 16];
      const _t2 = st.surf && st.surf.t2 ? sample(st.surf.t2, lon, lat) : NaN, _rh = st.surf && st.surf.rh2 ? sample(st.surf.rh2, lon, lat) : NaN, _tw = wetBulb();
      return { tw: _tw ? sample(_tw, lon, lat) : NaN, hi: isFinite(_t2) && isFinite(_rh) && _t2 >= 26 ? heatIndex(_t2, _rh) : NaN, lon, lat, level: st.level, levelInfo: LEVEL_INFO[st.level], wind_kmh: isFinite(spd) ? Math.round(spd * 3.6) : null, from,
        hgt: st.level === 1000 ? null : Math.round(sample(l.hgt, lon, lat)), rh: Math.round(sample(l.rh, lon, lat)),
        mslp: st.surf ? Math.round(sample(st.surf.mslp, lon, lat)) : null, pwat: st.surf ? Math.round(sample(st.surf.pwat, lon, lat)) : null,
        sst: st.surf ? sample(st.surf.sst, lon, lat) : null, tmp: sample(l.tmp, lon, lat), cape: st.surf ? sample(st.surf.cape, lon, lat) : NaN,
        rain: st.surf ? sample(st.surf.rain6, lon, lat) : NaN, vort: l.u ? sample(vorticity(l), lon, lat) : NaN,
        up: l.w ? -sample(l.w, lon, lat) : NaN,
        ...(() => {                                          // the full 3D wind: w (m/s) from omega, w = -omega R T / (p g)
          const om = l.w ? sample(l.w, lon, lat) : NaN, Tc = l.tmp ? sample(l.tmp, lon, lat) : NaN, uu = sample(l.u, lon, lat), vv = sample(l.v, lon, lat);
          if (!isFinite(om) || !isFinite(uu)) return {};
          const T = (isFinite(Tc) ? Tc : 15) + 273.15, wms = -om * 287.05 * T / (st.level * 100 * 9.81), hs = Math.hypot(uu, vv), res = Math.hypot(uu, vv, wms);
          return { w_ms: wms, res_kmh: res * 3.6, tilt: Math.atan2(wms, hs) * 180 / Math.PI };
        })(),
        t2: st.surf && st.surf.t2 ? sample(st.surf.t2, lon, lat) : NaN, rh2: st.surf && st.surf.rh2 ? sample(st.surf.rh2, lon, lat) : NaN, ivt: st.surf && st.surf._ivt ? sample(st.surf._ivt.M, lon, lat) : NaN, sss: st.surf && st.surf.sss ? sample(st.surf.sss, lon, lat) : NaN,
        hs: st.surf ? sample(st.surf.hs, lon, lat) : NaN, wto: st.surf && st.surf.wu ? DIRS[Math.round(((Math.atan2(sample(st.surf.wu, lon, lat), sample(st.surf.wv, lon, lat)) * 180 / Math.PI + 360) % 360) / 22.5) % 16] : null,
        cur: st.surf && st.surf.cu ? Math.hypot(sample(st.surf.cu, lon, lat), sample(st.surf.cv, lon, lat)) : NaN,
        cto: st.surf && st.surf.cu ? DIRS[Math.round(((Math.atan2(sample(st.surf.cu, lon, lat), sample(st.surf.cv, lon, lat)) * 180 / Math.PI + 360) % 360) / 22.5) % 16] : null };
    }
    new ResizeObserver(() => resize()).observe(el);

    return {
      data: () => ({ meta: st.meta, surf: st.surf, lev: st.lev, base: st.base }), levelData, sample, readout, gridLines, contoursFor: () => contours(),
      setTime, time: () => st.t, scalarFor, rampFor,
      load, setLevel, levels: () => (st.meta ? st.meta.levels : []), meta: () => st.meta, LEVEL_INFO, RAMPS,
      async set(k, v) { st[k] = v; if (k === "level") return setLevel(v);
        if ((k === "scalar" && v === "ivt") || (k === "ar" && v)) await ensureLevels();
        if (k === "mid" && v) await ensureLevels([500]);
        if (k === "aod" && v) loadAOD();
        if (k === "scalar" && v === "shear") { await levelData(850); await levelData(200); } if (k === "wind" && !v) fctx.clearRect(0, 0, W, H); if (k === "wind" && v) resetParticles(); draw(); },
      get: (k) => st[k], monoFlow: () => !st.flowColor, rivers: () => riverList(), midSystems: () => midSystems(), aod: () => (AOD ? { day: AOD.day, canvas: AOD.img } : null), aodState: () => aodState, setStorms(list) { st.storms = list; draw(); }, getView: () => ({ lon: Math.round(-st.rot[0] * 10) / 10, lat: Math.round(-st.rot[1] * 10) / 10, k: Math.round(st.k * 100) / 100 }), theme() { resetParticles(); draw(); }, setForecast(fc) { st.fc = fc; draw(); }, setTowns(list, show) { st.towns = list; st.showTowns = show; draw(); }, select(k) { st.sel = k; draw(); }, setClimate(c) { st.climate = c; draw(); },
      focus(lon, lat, kk) { st.rot = [-lon, -lat]; if (kk) st.k = kk; useLand(); resetParticles(); draw(); },
      zoomIn: () => zoom(1.4), zoomOut: () => zoom(1 / 1.4), redraw: () => { resize(); },
      pause(p) { running = !p; },
    };
  }
  window.WxMap = { create, FLOW, RAMPS, LEVEL_INFO, lut, places, placeName, landSet };
})();
