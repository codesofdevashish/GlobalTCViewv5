/* 3D weather globe (three.js). Streamlines fly at the altitude of the chosen pressure level;
   "all heights" stacks 1000-200 hPa (vertically exaggerated) so a cyclone appears as a 3D vortex column.
   Uses the data and helpers of the 2D map:  Wx3D.create(el, wx2d, {onPick, onStorm}) -> api | null */
(() => {
  "use strict";
  const D = Math.PI / 180;
  const ALT_KM = { 1000: 0.1, 850: 1.5, 700: 3.1, 500: 5.7, 300: 9.3, 200: 11.9 };
  const ll2v = (lat, lon, r) => { const phi = (90 - lat) * D, th = (90 - lon) * D; return [r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th)]; };

  function webgl() { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }

  function create(el, src, opts = {}) {
    if (!window.THREE || !webgl() || !src) return null;
    const T = window.THREE, FLOW = window.WxMap.FLOW, RAMPS = window.WxMap.RAMPS;
    const canvas = Object.assign(document.createElement("canvas"), { className: "wx3d-canvas" }); el.append(canvas);
    const labels = Object.assign(document.createElement("div"), { className: "wx3d-labels" }); el.append(labels);
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new T.Scene(), camera = new T.PerspectiveCamera(32, 1, 0.05, 100);
    let dist = 3.0; camera.position.set(0, 0, dist);
    const globe = new T.Group(); globe.rotation.order = "XYZ"; scene.add(globe);
    const st = { level: 850, mode: "single", scalar: "speed", wind: true, contours: true, storms: true, running: true, storms_: [] };

    // ---- Earth, atmosphere rim, colour layer
    const earthMat = new T.MeshBasicMaterial({ color: 0xd2dade });
    new T.TextureLoader().load("vendor/earth/day.jpg", (t) => { t.anisotropy = renderer.capabilities.getMaxAnisotropy(); earthMat.map = t; earthMat.needsUpdate = true; });
    const earth = new T.Mesh(new T.SphereGeometry(1, 128, 96), earthMat); earth.rotation.y = -Math.PI / 2; globe.add(earth);
    scene.add(new T.Mesh(new T.SphereGeometry(1.06, 64, 48), new T.ShaderMaterial({ side: T.BackSide, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: "varying vec3 n; void main(){ n = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "varying vec3 n; void main(){ float i = pow(max(0.0, 0.62 - dot(n, vec3(0,0,1))), 2.6); gl_FragColor = vec4(0.35,0.6,1.0,1.0) * i * 0.8; }" })));
    const ovCanvas = document.createElement("canvas"); ovCanvas.width = 720; ovCanvas.height = 360;
    const ovTex = new T.CanvasTexture(ovCanvas);
    const overlay = new T.Mesh(new T.SphereGeometry(1.0025, 128, 96), new T.MeshBasicMaterial({ map: ovTex, transparent: true, depthWrite: false }));
    overlay.rotation.y = -Math.PI / 2; globe.add(overlay);
    function paintOverlay() {
      const c = ovCanvas.getContext("2d"), img = c.createImageData(720, 360), d = img.data, R = src.rampFor ? src.rampFor(st.scalar) : RAMPS[st.scalar];
      const a = src.scalarFor ? src.scalarFor(st.scalar) : scalarArray(), rainy = st.scalar === "rain";
      if (a && R) for (let y = 0; y < 360; y++) for (let x = 0; x < 720; x++) {
        const lon = -180 + (x + 0.5) / 2, lat = 90 - (y + 0.5) / 2, v = src.sample(a, lon, lat); if (!isFinite(v) || (rainy && v < 0.5)) continue;
        const t = Math.max(0, Math.min(255, Math.round((R.f(v) - R.lo) / (R.hi - R.lo) * 255))), col = R.lut[t], o = (y * 720 + x) * 4;
        d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 170;
      }
      c.putImageData(img, 0, 0); ovTex.needsUpdate = true; overlay.visible = !!a;
    }
    function scalarArray() {
      const D_ = src.data(); if (!D_.surf) return null; const l = D_.lev[st.level] || {};
      if (st.scalar === "pwat") return D_.surf.pwat; if (st.scalar === "sst") return D_.surf.sst; if (st.scalar === "rh") return l.rh;
      if (st.scalar === "speed" && l.u) { if (!l.spd) { l.spd = new Float32Array(l.u.length); for (let i = 0; i < l.u.length; i++) l.spd[i] = Math.hypot(l.u[i], l.v[i]); } return l.spd; }
      return null;
    }

    // ---- streamlines: one particle system per drawn level
    const TL = 9, ex = () => (st.mode === "stack" ? 0.012 : 0.006);
    const rFor = (p) => 1.004 + ALT_KM[p] * ex();
    let systems = [];
    const flowMat = new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1, depthWrite: false, blending: T.AdditiveBlending });
    function makeSystem(p, n) {
      const g = new T.BufferGeometry(), pos = new Float32Array(n * (TL - 1) * 6), col = new Float32Array(n * (TL - 1) * 6);
      g.setAttribute("position", new T.BufferAttribute(pos, 3).setUsage(T.DynamicDrawUsage)); g.setAttribute("color", new T.BufferAttribute(col, 3).setUsage(T.DynamicDrawUsage));
      const line = new T.LineSegments(g, flowMat); line.frustumCulled = false; globe.add(line);
      const parts = Array.from({ length: n }, () => spawn(p, true));
      return { p, n, g, pos, col, line, parts };
    }
    function spawn(p, first) {
      const lat = Math.asin(2 * Math.random() - 1) / D, lon = Math.random() * 360 - 180;     // uniform over the sphere
      const life = 60 + Math.floor(Math.random() * 50), r = rFor(p), v = ll2v(lat, lon, r), tr = new Float32Array(TL * 3);
      for (let j = 0; j < TL; j++) tr.set(v, j * 3);
      return { lon, lat, age: first ? Math.floor(Math.random() * life) : 0, life, tr, spd: 0 };
    }
    function buildSystems() {
      for (const s of systems) { globe.remove(s.line); s.g.dispose(); } systems = [];
      if (!st.wind) return;
      const levels = st.mode === "stack" ? (src.data().meta ? src.data().meta.levels : []) : [st.level];
      for (const p of levels) systems.push(makeSystem(p, st.mode === "stack" ? 1700 : 5200));
    }
    const fc = FLOW.lut.map(([r, g, b]) => [r / 255, g / 255, b / 255]);
    function stepSystems() {
      const lev = src.data().lev;
      for (const S of systems) {
        const l = lev[S.p]; if (!l || !l.u) continue;
        const r = rFor(S.p), sp = 0.028, emph = st.mode === "stack" && S.p !== st.level ? 0.55 : 1;
        for (let i = 0; i < S.n; i++) {
          const q = S.parts[i]; let u = src.sample(l.u, q.lon, q.lat), v = src.sample(l.v, q.lon, q.lat);
          if (!isFinite(u) || ++q.age > q.life) { S.parts[i] = spawn(S.p, false); continue; }
          q.lon += u * sp / Math.max(0.2, Math.cos(q.lat * D)); q.lat = Math.max(-85, Math.min(85, q.lat + v * sp)); q.spd = Math.hypot(u, v) * 3.6;
          q.tr.copyWithin(3, 0, (TL - 1) * 3); q.tr.set(ll2v(q.lat, q.lon, r), 0);
          const c = fc[Math.max(0, Math.min(255, Math.round(q.spd / FLOW.hi * 255)))], life = Math.min(1, q.age / 8, (q.life - q.age) / 8);
          for (let j = 0; j < TL - 1; j++) {
            const o = (i * (TL - 1) + j) * 6, f0 = (1 - j / (TL - 1)) * life * emph, f1 = (1 - (j + 1) / (TL - 1)) * life * emph;
            S.pos[o] = q.tr[j * 3]; S.pos[o + 1] = q.tr[j * 3 + 1]; S.pos[o + 2] = q.tr[j * 3 + 2];
            S.pos[o + 3] = q.tr[j * 3 + 3]; S.pos[o + 4] = q.tr[j * 3 + 4]; S.pos[o + 5] = q.tr[j * 3 + 5];
            S.col[o] = c[0] * f0; S.col[o + 1] = c[1] * f0; S.col[o + 2] = c[2] * f0; S.col[o + 3] = c[0] * f1; S.col[o + 4] = c[1] * f1; S.col[o + 5] = c[2] * f1;
          }
        }
        S.g.attributes.position.needsUpdate = true; S.g.attributes.color.needsUpdate = true;
      }
    }

    // ---- contours (isobars near the surface, heights aloft) at the level's altitude
    let cont = null;
    function buildContours() {
      if (cont) { globe.remove(cont); cont.geometry.dispose(); cont = null; }
      if (!st.contours) return; const D_ = src.data(); const a = st.level === 1000 ? D_.surf && D_.surf.mslp : (D_.lev[st.level] || {}).hgt; if (!a) return;
      let lo = Infinity, hi = -Infinity; for (const v of a) if (isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; }
      const step = st.level === 1000 ? 4 : st.level >= 700 ? 30 : st.level >= 500 ? 60 : 120, th = [];
      for (let v = Math.ceil(lo / step) * step; v < hi; v += step) th.push(v);
      const r = rFor(st.level) - 0.001, pts = [];
      for (const ml of src.gridLines(a, th)) for (const ring of ml.coordinates) for (let i = 1; i < ring.length; i++) {
        const [x0, y0] = ring[i - 1], [x1, y1] = ring[i]; if (Math.abs(x1 - x0) > 5) continue; pts.push(...ll2v(y0, x0, r), ...ll2v(y1, x1, r));
      }
      const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pts, 3));
      cont = new T.LineSegments(g, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false })); globe.add(cont);
    }

    // ---- storms: marker at the sea surface and a vertical line through the column
    let stormObjs = [];
    const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
      g.fillStyle = "#fff"; g.beginPath(); g.arc(32, 32, 26, 0, 2 * Math.PI); g.fill(); return new T.CanvasTexture(c); })();
    function buildStorms() {
      for (const o of stormObjs) { globe.remove(o.obj); if (o.col) globe.remove(o.col); } stormObjs = []; labels.textContent = "";
      if (!st.storms) return;
      for (const s of st.storms_) {
        const spr = new T.Sprite(new T.SpriteMaterial({ map: dot, color: new T.Color(s.color), depthWrite: false })); spr.scale.set(0.035, 0.035, 1);
        spr.position.set(...ll2v(s.lat, s.lon, 1.006)); globe.add(spr);
        const g = new T.BufferGeometry().setFromPoints([new T.Vector3(...ll2v(s.lat, s.lon, 1.0)), new T.Vector3(...ll2v(s.lat, s.lon, rFor(200) + 0.01))]);
        const col = new T.Line(g, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })); globe.add(col);
        const lab = Object.assign(document.createElement("button"), { type: "button", className: "wx3d-label", textContent: `${s.name}, ${Math.round(s.vmax_kt * 1.852)} km/h` });
        lab.addEventListener("click", () => opts.onStorm && opts.onStorm(s.key)); labels.append(lab);
        stormObjs.push({ obj: spr, col, lab, s });
      }
    }

    // ---- crisp vector coastlines over the Earth image
    window.WxMap.landSet("50m").then((L) => {
      if (!L) return; const pts = [];
      for (const line of L.coast.coordinates) for (let i = 1; i < line.length; i++) pts.push(...ll2v(line[i - 1][1], line[i - 1][0], 1.0012), ...ll2v(line[i][1], line[i][0], 1.0012));
      const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pts, 3));
      globe.add(new T.LineSegments(g, new T.LineBasicMaterial({ color: 0xe8f0f4, transparent: true, opacity: 0.7, depthWrite: false })));
    });
    // ---- place names: most important first, no overlaps, hidden on the far side
    const lab = Object.assign(document.createElement("canvas"), { className: "wx3d-places" }); el.insertBefore(lab, labels);
    const lctx = lab.getContext("2d"); let placeList = []; window.WxMap.places().then((p) => { placeList = p; });
    const pv = new T.Vector3(), camDir = new T.Vector3();
    function drawPlaces() {
      const w = el.clientWidth, h = el.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (lab.width !== Math.round(w * dpr) || lab.height !== Math.round(h * dpr)) { lab.width = Math.round(w * dpr); lab.height = Math.round(h * dpr); lab.style.width = `${w}px`; lab.style.height = `${h}px`; }
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0); lctx.clearRect(0, 0, w, h); if (!placeList.length || st.labels === false) return;
      const d = camera.position.z, rpx = (h / 2) * Math.tan(Math.asin(Math.min(0.999, 1 / d))) / Math.tan(camera.fov * D / 2);
      const z = Math.log2(2 * Math.PI * rpx / 256) + 0.9, boxes = []; let n = 0;
      camDir.copy(camera.position).normalize();
      for (const p of placeList) {
        if (p[3] > z) break;
        pv.set(...ll2v(p[1], p[2], 1.0015)); globe.localToWorld(pv);
        if (pv.clone().normalize().dot(camDir) < 0.18) continue;
        pv.project(camera); const x = (pv.x * 0.5 + 0.5) * w, y = (-pv.y * 0.5 + 0.5) * h; if (x < 0 || y < 0 || x > w || y > h) continue;
        const name = window.WxMap.placeName(p), big = p[3] <= 3;
        lctx.font = `${big ? 600 : 500} ${big ? 13 : 12}px "IBM Plex Sans Condensed", "Arial Narrow", sans-serif`;
        const tw = lctx.measureText(name).width + 8, b = [x - 3, y - 8, x + tw, y + 8];
        if (boxes.some((q) => b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1])) continue; boxes.push(b);
        lctx.beginPath(); lctx.arc(x, y, big ? 2.6 : 2, 0, 2 * Math.PI); lctx.fillStyle = "#fff"; lctx.fill();
        lctx.lineJoin = "round"; lctx.lineWidth = 3; lctx.strokeStyle = "rgba(6,22,34,.85)"; lctx.textBaseline = "middle";
        lctx.strokeText(name, x + 5, y); lctx.fillStyle = big ? "#fff" : "#d7e3ea"; lctx.fillText(name, x + 5, y);
        if (++n >= 220) break;
      }
    }

    // ---- forecast tracks (members thin, ensemble mean dashed) just above the sea surface
    let fcObj = null;
    function setForecast(fc) {
      if (fcObj) { globe.remove(fcObj); fcObj.traverse((o) => o.geometry && o.geometry.dispose()); fcObj = null; }
      if (!fc) return; fcObj = new T.Group();
      const seg = (tr) => { const pts = []; for (let i = 1; i < tr.length; i++) pts.push(...ll2v(tr[i - 1][1], tr[i - 1][2], 1.008), ...ll2v(tr[i][1], tr[i][2], 1.008)); return pts; };
      const mem = []; for (const m of fc.members || []) mem.push(...seg(m));
      if (mem.length) { const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(mem, 3));
        fcObj.add(new T.LineSegments(g, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false }))); }
      if (fc.mean && fc.mean.length > 1) { const g = new T.BufferGeometry().setFromPoints(fc.mean.map((q) => new T.Vector3(...ll2v(q[1], q[2], 1.009))));
        const l = new T.Line(g, new T.LineDashedMaterial({ color: 0xffd27a, dashSize: 0.012, gapSize: 0.008 })); l.computeLineDistances(); fcObj.add(l);
        for (const q of fc.mean) if (q[0] && q[0] % 24 === 0) { const d = new T.Mesh(new T.SphereGeometry(0.006, 10, 8), new T.MeshBasicMaterial({ color: 0xffd27a })); d.position.set(...ll2v(q[1], q[2], 1.009)); fcObj.add(d); } }
      globe.add(fcObj);
    }

    // ---- interaction
    let drag = null, moved = false;
    canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY }; moved = false; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", (e) => {
      if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      const k = 0.005 * (dist - 1) / 2.6; globe.rotation.y += dx * k; globe.rotation.x = Math.max(-1.3, Math.min(1.3, globe.rotation.x + dy * k)); drag = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener("pointerup", (e) => { if (!moved) pick(e); drag = null; });
    canvas.addEventListener("wheel", (e) => { e.preventDefault(); zoom(e.deltaY < 0 ? 1 / 1.12 : 1.12); }, { passive: false });
    const zoom = (f) => { dist = Math.max(1.06, Math.min(7, 1 + (dist - 1) * f)); };
    const ray = new T.Raycaster(), ndc = new T.Vector2();
    function pick(e) {
      const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera); const hit = ray.intersectObject(earth, false)[0]; if (!hit) return;
      const p = globe.worldToLocal(hit.point.clone()).normalize(), lat = 90 - Math.acos(p.y) / D, lon = 90 - Math.atan2(p.z, p.x) / D;
      const L = ((lon + 540) % 360) - 180; opts.onPick && opts.onPick(src.readout(L, lat));
    }
    function focus(lon, lat, k) {
      if (k) dist = Math.max(1.6, Math.min(6, 3.4 / k));
      const p = ll2v(lat, lon, 1), yaw = Math.atan2(p[0], p[2]), pitch = Math.atan2(p[1], Math.hypot(p[0], p[2]));
      globe.rotation.y = -yaw; globe.rotation.x = Math.max(-1.2, Math.min(1.2, pitch));
    }

    // ---- loop
    function resize() { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    new ResizeObserver(resize).observe(el); resize();
    const v3 = new T.Vector3();
    function frame() {
      requestAnimationFrame(frame); if (!st.running || !el.clientWidth) return;
      camera.position.z += (dist - camera.position.z) * 0.15;
      if (!drag) stepSystems();
      const ms = Math.max(0.006, Math.min(0.035, 0.035 * (camera.position.z - 1) / 2.6));     // markers keep their size on screen
      for (const o of stormObjs) o.obj.scale.set(ms, ms, 1);
      for (const o of stormObjs) {                                    // labels follow their storms
        o.obj.getWorldPosition(v3); const facing = v3.clone().normalize().dot(camera.position.clone().normalize()); v3.project(camera);
        o.lab.style.display = facing > 0.2 ? "" : "none";
        o.lab.style.transform = `translate(${(v3.x * 0.5 + 0.5) * el.clientWidth + 10}px, ${(-v3.y * 0.5 + 0.5) * el.clientHeight - 12}px)`;
      }
      renderer.render(scene, camera);
      if ((frameNo = (frameNo + 1) % 2) === 0 || drag) drawPlaces();
    }
    let frameNo = 0;
    requestAnimationFrame(frame);

    async function refresh() {
      if (st.mode === "stack") { const L = src.data().meta ? src.data().meta.levels : []; for (const p of L) await src.levelData(p); }
      else await src.levelData(st.level);
      buildSystems(); buildContours(); paintOverlay(); buildStorms();
    }
    return {
      refresh, focus, zoomIn: () => zoom(1 / 1.3), zoomOut: () => zoom(1.3), pause(p) { st.running = !p; }, redraw: resize,
      async set(k, v) { st[k] = v; if (k === "labels") return; if (k === "storms") return buildStorms(); if (k === "contours") return buildContours(); if (k === "scalar") return paintOverlay(); await refresh(); },
      setStorms(list) { st.storms_ = list; buildStorms(); }, get: (k) => st[k], setForecast, select() {}, setTowns() {},
    };
  }
  window.Wx3D = { create, ALT_KM };
})();
