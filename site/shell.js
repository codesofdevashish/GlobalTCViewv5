/* GlobalTCView shell: views (Today, Live map, Storm analysis, Learn), plain-language storm summaries,
   the "is a cyclone heading for you" check, live-map controls and the Learn diagrams. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, attrs = {}, kids = []) => { const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === "text") n.textContent = v; else if (k === "html") n.innerHTML = v; else n.setAttribute(k, v); }
    for (const k of [].concat(kids)) if (k != null) n.append(k); return n; };
  const t = (k, v, f) => (window.I18N ? window.I18N.t(k, v, f) : f || k);
  const KMH = 1.852, MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const toMs = (s) => Date.parse(String(s).replace(" ", "T").replace(/(\d)$/, "$1Z"));
  const when = (ms) => { const d = new Date(ms); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}, ${String(d.getUTCHours()).padStart(2, "0")}:00 UTC`; };
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const catVar = (kt) => kt >= 137 ? "--c5" : kt >= 113 ? "--c4" : kt >= 96 ? "--c3" : kt >= 83 ? "--c2" : kt >= 64 ? "--c1" : kt >= 34 ? "--ts" : "--td";
  const IMD = [[120, "Super Cyclonic Storm"], [90, "Extremely Severe Cyclonic Storm"], [64, "Very Severe Cyclonic Storm"], [48, "Severe Cyclonic Storm"], [34, "Cyclonic Storm"], [28, "Deep Depression"], [17, "Depression"]];
  const className = (s, kt) => {
    if (s.basin === "A" || s.basin === "B") { const c = IMD.find(([x]) => kt * 0.93 >= x); return t(c ? c[1] : "Low pressure area"); }
    if (kt >= 64) { const n = kt < 83 ? 1 : kt < 96 ? 2 : kt < 113 ? 3 : kt < 137 ? 4 : 5;
      return `${t(["L", "E", "C"].includes(s.basin) ? "cls.hurricane" : s.basin === "W" ? "cls.typhoon" : "cls.stc")}, ${t("cls.cat", { n })}`; }
    return t(kt >= 34 ? "Tropical storm" : "Tropical depression");
  };
  const km = (a, b) => { const p = Math.PI / 180, dl = (b[1] - a[1]) * p, dn = (b[0] - a[0]) * p;
    const h = Math.sin(dl / 2) ** 2 + Math.cos(a[1] * p) * Math.cos(b[1] * p) * Math.sin(dn / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
  const COMPASS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
  const bearing = (a, b) => { const p = Math.PI / 180, y = Math.sin((b[0] - a[0]) * p) * Math.cos(b[1] * p),
    x = Math.cos(a[1] * p) * Math.sin(b[1] * p) - Math.sin(a[1] * p) * Math.cos(b[1] * p) * Math.cos((b[0] - a[0]) * p); return (Math.atan2(y, x) / p + 360) % 360; };
  const dir8 = (deg) => COMPASS[Math.round(deg / 45) % 8];
  const fmtKm = (d) => `${(d >= 1000 ? Math.round(d / 50) * 50 : Math.round(d / 10) * 10).toLocaleString("en")} ${t("km")}`;

  // coastal towns most exposed to tropical cyclones, [name, country, lat, lon]
  const TOWNS = [["Chennai", "India", 13.08, 80.27], ["Puducherry", "India", 11.93, 79.83], ["Nellore", "India", 14.44, 79.99], ["Machilipatnam", "India", 16.19, 81.14],
    ["Kakinada", "India", 16.99, 82.25], ["Visakhapatnam", "India", 17.69, 83.22], ["Srikakulam", "India", 18.3, 83.9], ["Gopalpur", "India", 19.26, 84.9],
    ["Puri", "India", 19.81, 85.83], ["Bhubaneswar", "India", 20.3, 85.82], ["Paradip", "India", 20.32, 86.61], ["Balasore", "India", 21.49, 86.93],
    ["Digha", "India", 21.63, 87.51], ["Kolkata", "India", 22.57, 88.36], ["Port Blair", "India", 11.62, 92.73], ["Kanyakumari", "India", 8.08, 77.55],
    ["Thiruvananthapuram", "India", 8.52, 76.94], ["Kochi", "India", 9.93, 76.27], ["Mangaluru", "India", 12.91, 74.86], ["Panaji", "India", 15.49, 73.83],
    ["Mumbai", "India", 19.08, 72.88], ["Veraval", "India", 20.91, 70.37], ["Porbandar", "India", 21.64, 69.6], ["Kandla", "India", 23.03, 70.22],
    ["Khulna", "Bangladesh", 22.85, 89.54], ["Barishal", "Bangladesh", 22.7, 90.37], ["Dhaka", "Bangladesh", 23.81, 90.41], ["Chattogram", "Bangladesh", 22.36, 91.78],
    ["Cox's Bazar", "Bangladesh", 21.43, 92.0], ["Sittwe", "Myanmar", 20.15, 92.9], ["Yangon", "Myanmar", 16.87, 96.2], ["Colombo", "Sri Lanka", 6.93, 79.86],
    ["Trincomalee", "Sri Lanka", 8.59, 81.23], ["Karachi", "Pakistan", 24.86, 67.0], ["Muscat", "Oman", 23.59, 58.41], ["Salalah", "Oman", 17.02, 54.09],
    ["Aden", "Yemen", 12.79, 45.02], ["Manila", "Philippines", 14.6, 120.98], ["Tacloban", "Philippines", 11.24, 125.0], ["Da Nang", "Vietnam", 16.05, 108.2],
    ["Hanoi", "Vietnam", 21.03, 105.85], ["Hong Kong", "China", 22.32, 114.17], ["Haikou", "China", 20.04, 110.32], ["Shanghai", "China", 31.23, 121.47],
    ["Taipei", "Taiwan", 25.03, 121.57], ["Naha", "Japan", 26.21, 127.68], ["Tokyo", "Japan", 35.68, 139.69], ["Busan", "South Korea", 35.18, 129.08],
    ["Guam", "USA", 13.44, 144.79], ["Darwin", "Australia", -12.46, 130.84], ["Cairns", "Australia", -16.92, 145.77], ["Broome", "Australia", -17.96, 122.24],
    ["Suva", "Fiji", -18.14, 178.44], ["Nouméa", "New Caledonia", -22.27, 166.46], ["Port Vila", "Vanuatu", -17.73, 168.32], ["Apia", "Samoa", -13.83, -171.76],
    ["Port Louis", "Mauritius", -20.16, 57.5], ["Saint-Denis", "Réunion", -20.88, 55.45], ["Antananarivo", "Madagascar", -18.88, 47.51], ["Beira", "Mozambique", -19.84, 34.84],
    ["Maputo", "Mozambique", -25.97, 32.57], ["Miami", "USA", 25.76, -80.19], ["Tampa", "USA", 27.95, -82.46], ["New Orleans", "USA", 29.95, -90.07],
    ["Houston", "USA", 29.76, -95.37], ["San Juan", "Puerto Rico", 18.47, -66.11], ["Havana", "Cuba", 23.11, -82.37], ["Kingston", "Jamaica", 17.97, -76.79],
    ["Santo Domingo", "Dominican Republic", 18.49, -69.93], ["Cancún", "Mexico", 21.16, -86.85], ["Acapulco", "Mexico", 16.85, -99.82], ["Cabo San Lucas", "Mexico", 22.89, -109.92],
    ["Honolulu", "USA", 21.31, -157.86], ["Hamilton", "Bermuda", 32.29, -64.78]];
  const AGENCY = (lat, lon) => {
    const l = ((lon + 540) % 360) - 180;
    if (lat >= 0 && l >= 30 && l < 100) return ["India Meteorological Department (RSMC New Delhi)", "https://rsmcnewdelhi.imd.gov.in/", "national weather services of the region"];
    if (lat >= 0 && l >= 100) return ["Japan Meteorological Agency (RSMC Tokyo)", "https://www.jma.go.jp/bosai/map.html#contents=typhoon&lang=en", "your national weather service"];
    if (lat >= 0 && l < -140) return ["Central Pacific Hurricane Center", "https://www.nhc.noaa.gov/?cpac", "the National Weather Service"];
    if (lat >= 0) return ["US National Hurricane Center", "https://www.nhc.noaa.gov/", "your national weather service"];
    if (l >= 30 && l < 90) return ["Météo-France La Réunion (RSMC)", "https://meteofrance.re/fr/cyclone", "your national weather service"];
    if (l >= 90 && l < 160) return ["Australian Bureau of Meteorology", "https://www.bom.gov.au/cyclone/", "the Bureau of Meteorology"];
    return ["Fiji Meteorological Service (RSMC Nadi)", "https://www.met.gov.fj/", "your national weather service"];
  };
  const nearestTown = (lon, lat) => { let best = null;
    for (const t of TOWNS) { const d = km([lon, lat], [t[3], t[2]]); if (!best || d < best.d) best = { t, d }; } return best; };

  // ---------------------------------------------------------------- data
  let DATA = null, ACTIVE = [], CLIMO = null; const FCS = {};
  const getJSON = (u) => fetch(`${u}${u.includes("?") ? "&" : "?"}v=${Date.now() / 6e5 | 0}`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
  function where(s) {
    const n = nearestTown(s.lon, s.lat); if (!n || n.d > 2500) return t("where.ocean");
    return t("where.fmt", { d: fmtKm(n.d), dir: t(`dir.${dir8(bearing([n.t[3], n.t[2]], [s.lon, s.lat]))}`), town: n.t[0], country: n.t[1] });
  }
  function motion(s) {
    const tr = s.track || []; if (tr.length < 3) return "";
    const a = tr[tr.length - 3], b = tr[tr.length - 1], h = (toMs(b[0]) - toMs(a[0])) / 36e5; if (!h) return "";
    const v = km([a[2], a[1]], [b[2], b[1]]) / h; if (v < 3) return t("mv.still");
    return t("mv.fmt", { dir: t(`dir.${dir8(bearing([a[2], a[1]], [b[2], b[1]]))}`), v: Math.round(v) });
  }
  const strengthWord = (s) => (s.dv24 >= 30 ? t("sw.rapid") : s.dv24 >= 10 ? t("sw.up") : s.dv24 <= -10 ? t("sw.down") : "");
  const stop = () => (window.I18N && window.I18N.lang === "hi" ? "।" : ".");

  // ---------------------------------------------------------------- Today
  function today() {
    const named = ACTIVE.filter((x) => !x.invest), n = named.length, inv = ACTIVE.length - n;
    const top = named.slice().sort((a, b) => b.vmax_kt - a.vmax_kt)[0], cls = top ? className(top, top.vmax_kt) : "";
    $("#t-headline").textContent = !n ? t("head.none") : n === 1 ? t("head.one", { name: top.name, a: article(cls), cls: cls.toLowerCase(), where: where(top) })
      : t("head.many", { n, name: top.name, where: where(top) });
    $("#t-sub").textContent = inv ? (inv === 1 ? t("sub.inv1") : t("sub.invN", { n: inv })) : "";
    const gen = DATA && DATA.generated ? toMs(DATA.generated) : NaN;
    $("#t-updated").textContent = isFinite(gen) ? t("updated", { t: when(gen) }) : "";
    const ol = $("#t-storms"); ol.textContent = "";
    if (!ACTIVE.length) ol.append(el("li", { class: "row empty" }, [el("p", { text: t("empty") })]));
    for (const s of ACTIVE.slice().sort((a, b) => b.vmax_kt - a.vmax_kt)) {
      const mv = motion(s), sw = strengthWord(s), wh = where(s);
      ol.append(el("li", { class: "row", style: `--c:var(${catVar(s.vmax_kt)})` }, [
        el("div", { class: "r-name" }, [el("h3", { text: s.name }), el("p", { text: `${className(s, s.vmax_kt)}${s.invest ? t("row.invest") : ""}` })]),
        el("p", { class: "r-wind" }, [el("strong", { text: Math.round(s.vmax_kt * KMH) }), el("span", { text: ` ${t("row.winds")}` })]),
        el("p", { class: "r-where", text: `${capital(wh)}${stop()} ${mv ? capital(mv) + sw + stop() : ""}` }),
        el("div", { class: "r-act" }, [btn(t("btn.map"), async () => { show("map"); await initMap(); focusMap(s.lon, s.lat); stormPanel(s.key); }), btn(t("btn.analysis"), () => openStorm(s.key), "ghost")])]));
    }
  }
  function glance() {
    const ul = $("#t-glance"); if (!ul) return; ul.textContent = "";
    const named = ACTIVE.filter((x) => !x.invest), top = named.slice().sort((a, b) => b.vmax_kt - a.vmax_kt)[0], c = (CLIMO && CLIMO.climate) || {};
    const item = (k, v, cls = "") => ul.append(el("li", { class: cls }, [el("span", { text: k }), el("b", { text: v })]));
    item(t("gl.storms"), String(named.length)); if (top) item(t("gl.strongest"), `${top.name}, ${Math.round(top.vmax_kt * KMH)} ${t("unit.kmh")}`, "wide");
    if (c.enso) item("ENSO", `${c.enso.phase} (${c.enso.value > 0 ? "+" : ""}${c.enso.value})`); if (c.mjo) item("MJO", c.mjo.active ? t("gl.phase", { n: c.mjo.phase }) : t("gl.weak"));
  }
  let wxMini = null;
  async function miniGlobe() {
    if (wxMini || !window.WxMap || !$("#t-globe")) return;
    wxMini = window.WxMap.create($("#t-globe"), { onPick: () => show("map"), onStorm: async (k) => { show("map"); await initMap(); stormPanel(k); } });
    try {
      await wxMini.load("data/wx/"); const lv = wxMini.levels(); if (lv.includes(1000)) await wxMini.set("level", 1000);
      wxMini.set("contours", false); wxMini.set("labels", false); wxMini.setStorms(stormList());
      const top = ACTIVE.slice().sort((a, b) => b.vmax_kt - a.vmax_kt)[0]; wxMini.focus(top ? top.lon : 82, top ? top.lat : 12, 1.0);
    } catch (e) { $("#t-globe").closest("figure").hidden = true; }
  }
  const article = (w) => (/^[aeiou]/i.test(w) ? "an" : "a");
  const capital = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
  const btn = (text, fn, cls = "") => { const b = el("button", { type: "button", class: `btn ${cls}`.trim(), text }); b.addEventListener("click", fn); return b; };

  // ---- is a cyclone heading for you?
  const city = $("#city");
  for (const t of TOWNS.slice().sort((a, b) => a[0].localeCompare(b[0]))) city.append(el("option", { value: `${t[2]},${t[3]},${t[0]}`, text: `${t[0]}, ${t[1]}` }));
  city.addEventListener("change", () => { if (!city.value) return; const [la, lo, nm] = city.value.split(","); setPlace({ lat: +la, lon: +lo, name: nm }); });
  $("#geo").addEventListener("click", () => {
    if (!navigator.geolocation) { place(t("place.nogeo")); return; }
    place(t("place.finding"));
    navigator.geolocation.getCurrentPosition((p) => setPlace({ lat: p.coords.latitude, lon: p.coords.longitude, name: "@you" }),
      () => place(t("place.denied")), { timeout: 10000, maximumAge: 6e5 });
  });
  const place = (t) => { const b = $("#place-result"); b.className = "place-result"; b.textContent = t; };
  function setPlace(p) { try { localStorage.setItem("tc-place", JSON.stringify(p)); } catch (e) { /* ignore */ } assess(p); }
  async function assess(p) {
    const box = $("#place-result"); box.textContent = ""; const here = [p.lon, p.lat];
    const rows = [];
    for (const s of ACTIVE) {
      let fc = FCS[s.key]; if (s.forecast && fc === undefined) { try { fc = FCS[s.key] = await getJSON(s.forecast); } catch (e) { fc = FCS[s.key] = null; } }
      const d0 = km(here, [s.lon, s.lat]); let dmin = d0, tmin = 0, src = "now";
      if (fc && fc.mean) for (const [tau, la, lo] of fc.mean) { if (tau > 120) break; const d = km(here, [lo, la]); if (d < dmin) { dmin = d; tmin = tau; src = "forecast"; } }
      rows.push({ s, d0, dmin, tmin, src, fc: !!(fc && fc.mean) });
    }
    rows.sort((a, b) => a.dmin - b.dmin);
    const [ag, agUrl] = AGENCY(p.lat, p.lon), r = rows[0], pl = p.name === "@you" ? t("place.you") : p.name;
    let level = "green", head, body;
    if (!r) { head = t("place.none", { place: pl }); body = t("place.updates"); }
    else {
      const days = r.tmin ? Math.max(1, Math.round(r.tmin / 24)) : 0, inDays = days === 1 ? t("place.day1") : t("place.days", { n: days });
      if (r.dmin <= 150 && r.tmin <= 72 || r.d0 <= 200) level = "red"; else if (r.dmin <= 300 && r.tmin <= 72 || r.dmin <= 150) level = "orange"; else if (r.dmin <= 600) level = "yellow";
      head = level === "green" ? t("place.clear", { place: pl }) : r.src === "forecast" ? t("place.may", { name: r.s.name, d: fmtKm(r.dmin), place: pl, when: inDays }) : t("place.is", { name: r.s.name, d: fmtKm(r.d0), place: pl });
      body = level === "green" ? t(r.fc ? "place.green.fc" : "place.green", { name: r.s.name, d: fmtKm(r.d0) }) : t(`place.${level}`, { ag });
    }
    box.className = `place-result lvl-${level}`;
    box.append(el("p", { class: "pr-head", text: head }), el("p", { text: body }),
      el("p", { class: "small" }, [`${t("place.official")} `, el("a", { href: agUrl, target: "_blank", rel: "noopener", text: ag })]),
      el("p", { class: "small muted", text: t(r && r.src === "forecast" ? "place.note.fc" : "place.note") }));
    LAST_PLACE = p; towncast(p);
  }
  let TOWNCAST = null;
  const IMD_RAIN = [[2.5, "rn.none"], [15.6, "rn.light"], [64.5, "rn.mod"], [115.6, "rn.heavy"], [204.5, "rn.vheavy"], [1e9, "rn.xheavy"]];
  const SEA = [[0.5, "sea.calm"], [1.25, "sea.slight"], [2.5, "sea.mod"], [4, "sea.rough"], [6, "sea.vrough"], [9, "sea.high"], [99, "sea.vhigh"]];
  async function loadTowncast() { if (!TOWNCAST) { try { TOWNCAST = await getJSON("data/towns.json"); } catch (e) { return null; } } return TOWNCAST; }
  async function towncast(p) {
    const box = $("#towncast"); box.hidden = true; box.textContent = "";
    if (!(await loadTowncast())) return;
    let name = TOWNCAST.towns[p.name] ? p.name : null, dist = 0;
    if (!name) { const n = nearestTown(p.lon, p.lat); if (n && n.d <= 150) { name = n.t[0]; dist = n.d; } }
    if (renderTowncast(box, name, dist)) box.hidden = false;
  }
  function renderTowncast(box, name, dist = 0) {
    const f = name && TOWNCAST && TOWNCAST.towns[name]; if (!f) return false;
    box.append(el("h3", { text: t("tc.h", { town: name }) }));
    const g = el("div", { class: "tc-grid" }); g.append(el("div", { class: "hd" }));
    for (const d of TOWNCAST.days) { const x = new Date(toMs(d)); g.append(el("div", { class: "hd", text: `${x.getUTCDate()} ${MON[x.getUTCMonth()]}` })); }
    const row = (label, cells) => { g.append(el("div", { class: "rl", text: label })); for (const c of cells) g.append(c); };
    row(t("tc.rain"), f.rain.map((v) => { const c = IMD_RAIN.find(([hi]) => v < hi)[1]; return el("div", { class: v >= 115.6 ? "bad" : v >= 64.5 ? "warn" : "" }, [el("b", { text: `${Math.round(v)} mm` }), el("small", { text: t(c) })]); }));
    row(t("tc.wind"), f.wind.map((v) => el("div", { class: v >= 62 ? "bad" : v >= 40 ? "warn" : "" }, [el("b", { text: `${v} ${t("unit.kmh")}` })])));
    if (f.wave.some((v) => v != null)) row(t("tc.sea"), f.wave.map((v) => v == null ? el("div", { text: "–" })
      : el("div", { class: v >= 4 ? "bad" : v >= 2.5 ? "warn" : "" }, [el("b", { text: `${v} m` }), el("small", { text: t(SEA.find(([hi]) => v < hi)[1]) })])));
    row(t("tc.boats"), f.wave.map((v, i) => { const bad = (v != null && v >= 2.5) || f.wind[i] >= 45;
      return el("div", { class: bad ? "bad" : "" }, [el("small", { text: t(bad ? "tc.nogo" : "tc.ok") })]); }));
    box.append(g, el("p", { class: "tc-note", text: t("tc.note", { d: dist ? `${Math.round(dist)} km` : "" }) + (f.wave_km ? ` ${t("tc.wavept", { km: f.wave_km })}` : "") }));
    return true;
  }
  let LAST_PLACE = null;

  // ---------------------------------------------------------------- live map
  let wx = null, wx3 = null, MODE = "3d", mapReady = null;
  const cur = () => (MODE === "3d" && wx3 ? wx3 : wx);
  const both = (fn) => { if (wx) fn(wx); if (wx3) fn(wx3); };
  function stormList() { return ACTIVE.map((s) => ({ key: s.key, name: s.name, lon: s.lon, lat: s.lat, vmax_kt: s.vmax_kt, track: s.track, color: css(catVar(s.vmax_kt)) || "#fff" })); }
  function initMap() {
    if (mapReady) return mapReady;
    mapReady = (async () => {
      if (!window.WxMap) return;
      $("#wx").hidden = false;                                     // the flat map holds the data; build it visible once, then hide it
      wx = window.WxMap.create($("#wx"), { onPick: info, onStorm: (k) => stormPanel(k), onTown: townPopup });
      try {
        const meta = await wx.load("data/wx/");
        const sl = $("#lv"); sl.max = meta.levels.length - 1; sl.value = Math.max(0, meta.levels.indexOf(850));
        const tm = $("#tm"), times = meta.times || []; tm.max = Math.max(0, times.length - 1); tm.value = meta.now || 0; $(".timebar").hidden = times.length < 2; timeLabel();
        $("#wx-time").textContent = t("map.time", { t: when(toMs(meta.cycle)) });
        if (window.Wx3D) wx3 = window.Wx3D.create($("#wx3d"), wx, { onPick: info, onStorm: (k) => stormPanel(k) });
        if (wx3) { await wx3.set("level", meta.levels[+sl.value]); } else { MODE = "2d"; $(".viewseg").hidden = true; $("#stack-row").hidden = true; }
      } catch (e) { $("#wx-time").textContent = t("map.notyet"); MODE = "2d"; }
      both((m) => m.setStorms(stormList())); if (CLIMO && CLIMO.climate) wx.setClimate(CLIMO.climate);
      const top = ACTIVE.slice().sort((a, b) => b.vmax_kt - a.vmax_kt)[0];          // open on the strongest storm, or the Indian Ocean
      both((m) => m.focus(top ? top.lon : 82, top ? top.lat : 12, 1.15));
      setMode(MODE); levelLabel(); legend();
    })();
    return mapReady;
  }
  let FC_ON = true, PANEL = null;
  async function stormPanel(key) {
    const s = ACTIVE.find((x) => x.key === key); if (!s) return openStorm(key);
    PANEL = key; both((m) => m.select && m.select(key)); $("#wx-info").hidden = true;
    let fc = FCS[key]; if (s.forecast && fc === undefined) { try { fc = FCS[key] = await getJSON(s.forecast); } catch (e) { fc = FCS[key] = null; } }
    if (PANEL !== key) return;
    both((m) => m.setForecast && m.setForecast(FC_ON && fc ? { members: Object.values(fc.members || {}), mean: fc.mean } : null));
    const b = $("#sd-body"); b.textContent = ""; $("#sd").hidden = false; $("#sd").style.setProperty("--c", css(catVar(s.vmax_kt)));
    const mv = motion(s), sw = strengthWord(s);
    b.append(el("p", { class: "sd-kicker", text: `${s.basin_name}${s.invest ? t("row.invest") : ""}` }), el("h2", { id: "sd-name", text: s.name }),
      el("p", { class: "sd-cls", text: `${className(s, s.vmax_kt)}, ${Math.round(s.vmax_kt * KMH)} ${t("unit.kmh")}` }),
      el("p", { text: `${capital(where(s))}${stop()} ${mv ? capital(mv) + sw + stop() : ""}` }), spark(s));
    if (fc && fc.mean) {
      const ul = el("ul", { class: "sd-fc" });
      for (const d of [1, 3, 5]) { const q = fc.mean.find((x) => x[0] === d * 24); if (!q) continue; const n = nearestTown(q[2], q[1]);
        ul.append(el("li", {}, [el("b", { text: d === 1 ? t("tm.in1") : t("tm.in", { n: d }) }), ` ${Math.round(q[3] * KMH)} ${t("unit.kmh")}, ${n && n.d < 2500 ? t("where.fmt", { d: fmtKm(n.d), dir: t(`dir.${dir8(bearing([n.t[3], n.t[2]], [q[2], q[1]]))}`), town: n.t[0], country: n.t[1] }) : t("where.ocean")}`])); }
      b.append(el("h3", { text: t("sd.fc") }), ul);
      const near = TOWNS.map((tw) => { let best = 1e9, tau = 0; for (const q of fc.mean) { if (q[0] > 120) break; const d = km([tw[3], tw[2]], [q[2], q[1]]); if (d < best) { best = d; tau = q[0]; } } return { tw, best, tau }; })
        .filter((x) => x.best <= 600).sort((a, b2) => a.best - b2.best).slice(0, 4);
      if (near.length) { const ol = el("ul", { class: "sd-towns" });
        for (const x of near) { const li = el("li", {}, [el("button", { type: "button", class: "linkish", text: x.tw[0] }), ` ${t("sd.closest", { d: fmtKm(x.best), n: Math.max(1, Math.round(x.tau / 24)) })}`]);
          li.querySelector("button").addEventListener("click", () => townPopup(x.tw[0])); ol.append(li); }
        b.append(el("h3", { text: t("sd.towns") }), ol); }
    }
    if (s.ri_guidance) b.append(el("p", { class: "sd-ri" }, [`${t("sd.ri")} `, el("strong", { text: `${Math.round(s.ri_guidance.p * 100)}%` }), ` (${t("sd.typical", { p: Math.round(s.ri_guidance.base * 100) })})`]));
    const fcBtn = btn(FC_ON ? t("sd.hidefc") : t("sd.showfc"), () => { FC_ON = !FC_ON; stormPanel(key); }, "ghost");
    b.append(el("div", { class: "sd-act" }, [btn(t("sd.centre"), () => both((m) => m.focus(s.lon, s.lat, 2.4)), "ghost"), fc ? fcBtn : null, btn(t("btn.analysis"), () => openStorm(s.key))]));
  }
  function spark(s) {                                         // small intensity history in km/h
    const P = (s.track || []).map((r) => [toMs(r[0]), r[3] * KMH]); if (P.length < 2) return el("span");
    const W_ = 300, H_ = 64, t0 = P[0][0], t1 = P[P.length - 1][0], hi = Math.max(120, ...P.map((p) => p[1]));
    const X = (x) => 4 + (W_ - 8) * (x - t0) / Math.max(1, t1 - t0), Y = (v) => H_ - 4 - (H_ - 8) * v / hi;
    const ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg"); svg.setAttribute("viewBox", `0 0 ${W_} ${H_}`); svg.setAttribute("class", "sd-spark");
    svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "Wind speed over the storm's life");
    for (let i = 1; i < P.length; i++) { const l = document.createElementNS(ns, "line");
      for (const [k, v] of Object.entries({ x1: X(P[i - 1][0]), y1: Y(P[i - 1][1]), x2: X(P[i][0]), y2: Y(P[i][1]), stroke: css(catVar(s.track[i][3])) || "#fff", "stroke-width": 3, "stroke-linecap": "round" })) l.setAttribute(k, v);
      svg.append(l); }
    return svg;
  }
  async function townPopup(name) {
    await loadTowncast(); const b = $("#wx-info-body"); b.textContent = ""; $("#wx-info").hidden = false;
    if (!renderTowncast(b, name)) { b.append(el("p", { text: t("tc.none") })); return; }
    const tw = TOWNS.find((x) => x[0] === name);
    if (tw) b.append(btn(t("tc.mine"), () => { setPlace({ lat: tw[2], lon: tw[3], name: tw[0] }); const o = [...city.options].find((x) => x.value.endsWith(`,${tw[0]}`)); if (o) city.value = o.value; show("today"); }, "ghost"));
  }
  $("#sd-x").addEventListener("click", () => { $("#sd").hidden = true; PANEL = null; both((m) => { if (m.setForecast) m.setForecast(null); if (m.select) m.select(null); }); });
  $("#ly-towns").addEventListener("change", async (e) => {
    const alerts = new Set(); for (const s of ACTIVE) { const fc = FCS[s.key]; if (fc && fc.mean) for (const tw of TOWNS) if (fc.mean.some((q) => q[0] <= 72 && km([tw[3], tw[2]], [q[2], q[1]]) <= 300)) alerts.add(tw[0]); }
    both((m) => m.setTowns && m.setTowns(TOWNS.map((tw) => ({ name: tw[0], lat: tw[2], lon: tw[3], alert: alerts.has(tw[0]) })), e.target.checked));
    if (e.target.checked && wx3 && MODE === "3d") setMode("2d");
  });
  function setMode(m) {
    MODE = m === "3d" && wx3 ? "3d" : "2d";
    $("#wx").hidden = MODE !== "2d"; $("#wx3d").hidden = MODE !== "3d"; $("#stack-row").hidden = MODE !== "3d" || !wx3;
    for (const b of $$(".seg")) b.setAttribute("aria-pressed", String(b.dataset.mode === MODE));
    if (wx) wx.pause(MODE !== "2d"); if (wx3) wx3.pause(MODE !== "3d");
    requestAnimationFrame(() => { const c = cur(); if (c) c.redraw(); }); legend();
  }
  $$(".seg").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
  $("#ly-stack").addEventListener("change", async (e) => { if (wx3) { $("#wx-time").dataset.busy = "1"; await wx3.set("mode", e.target.checked ? "stack" : "single"); legend(); } });
  const focusMap = (lon, lat) => both((m) => m.focus(lon, lat, 2.2));
  function timeLabel() {
    const m = wx && wx.meta(); if (!m || !m.times) return; const T_ = m.times[+$("#tm").value]; if (!T_) return;
    const o = T_.offset_h, rel = o === 0 ? t("tm.now") : o < 0 ? (o === -24 ? t("tm.yday") : t("tm.ago", { n: -o / 24 })) : (o === 24 ? t("tm.in1") : t("tm.in", { n: o / 24 }));
    const out = $("#tm-out"); out.textContent = `${rel}: ${when(toMs(T_.time))} `;
    out.append(el("span", { class: "fc", text: T_.kind === "forecast" ? t("tm.fc") : t("tm.an") }));
  }
  let busy = false;
  async function goTime(i) {
    if (!wx || busy) return; busy = true; $("#tm").value = i; timeLabel();
    try { await wx.setTime(i); if (wx3) await wx3.refresh(); legend(); } finally { busy = false; }
  }
  $("#tm").addEventListener("input", () => { goTime(+$("#tm").value); writeMapState(); });
  let playing = null;
  $("#tm-play").addEventListener("click", () => {
    const b = $("#tm-play");
    if (playing) { clearInterval(playing); playing = null; b.textContent = "▶"; return; }
    b.textContent = "❚❚"; playing = setInterval(() => { if (busy) return; const n = +$("#tm").max + 1; goTime((+$("#tm").value + 1) % n); }, 1600);
  });
  function levelLabel() {
    if (!wx) return; const p = wx.levels()[+$("#lv").value]; if (!p) return;
    $("#lv-out").textContent = p === 1000 ? t("lv.surface") : t("lv.fmt", { p, info: t(`lv.${p}`) });
    $("#ly-cont-label").textContent = t(p === 1000 ? "cont.p" : "cont.h");
  }
  $("#lv").addEventListener("input", () => writeMapState());
  $("#lv").addEventListener("input", async () => {
    if (!wx) return; levelLabel(); $("#wx-info").hidden = true; const p = wx.levels()[+$("#lv").value];
    await wx.set("level", p); if (wx3) await wx3.set("level", p); legend();
  });
  $("#ly-wind").addEventListener("change", (e) => { both((m) => m.set("wind", e.target.checked)); legend(); });
  $("#ly-cont").addEventListener("change", (e) => { both((m) => m.set("contours", e.target.checked)); legend(); });
  $("#ly-storms").addEventListener("change", (e) => both((m) => m.set("storms", e.target.checked)));
  $$('input[name="flow"]').forEach((r) => r.addEventListener("change", async () => {
    if (!r.checked) return; await initMap();
    if (wx) await wx.set("flow", r.value); if (wx3) { if (r.value !== "wind" && wx3.get("mode") === "stack") { $("#ly-stack").checked = false; await wx3.set("mode", "single"); } await wx3.set("flow", r.value); }
    if (r.value !== "wind") { const sc = r.value === "waves" ? "hs" : "curspd"; const rr = $(`input[name="scalar"][value="${sc}"]`); if (rr && !rr.checked) { rr.checked = true; rr.dispatchEvent(new Event("change")); } }
    legend();
  }));
  $("#ly-labels").addEventListener("change", (e) => both((m) => m.set("labels", e.target.checked)));
  $$('input[name="scalar"]').forEach((r) => r.addEventListener("change", () => { if (r.checked) { both((m) => m.set("scalar", r.value)); legend(); } }));
  $$(".chip[data-ov]").forEach((b) => b.addEventListener("click", async () => {
    await initMap(); const on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", String(on));
    if (wx) wx.set(b.dataset.ov, on);
    if (on) { if (MODE !== "2d") setMode("2d"); region({ cells: "hadley", walker: "walker", nino: "nino34", ocean: "ocean" }[b.dataset.ov]); } else $("#wx-info").hidden = true;
  }));
  $("#wz-in").addEventListener("click", () => { const c = cur(); if (c) c.zoomIn(); }); $("#wz-out").addEventListener("click", () => { const c = cur(); if (c) c.zoomOut(); });
  $("#wx-info-x").addEventListener("click", () => { $("#wx-info").hidden = true; });
  function bar(title, stops, lo, hi, unit) {
    return [el("p", { text: title }), el("div", { class: "bar", style: `background:linear-gradient(90deg,${stops.join(",")})` }),
      el("div", { class: "ends" }, [el("span", { text: `${lo}` }), el("span", { text: `${Math.round((lo + hi) / 2)}` }), el("span", { text: `${hi} ${unit}` })])];
  }
  function legend() {
    const box = $("#wx-legend"); box.textContent = ""; if (!wx) return;
    const F = window.WxMap.FLOW, s = wx.get("scalar"), R = wx.rampFor ? wx.rampFor(s) : window.WxMap.RAMPS[s];
    const unitK = window.I18N && window.I18N.lang === "hi" ? "किमी/घंटा" : "km/h";
    const fl = wx.get("flow");
    if (wx.get("wind") && fl === "waves") box.append(...bar(t("lg.flwaves"), F.stops, 0, 12, "m"));
    else if (wx.get("wind") && fl === "currents") box.append(...bar(t("lg.flcur"), F.stops, 0, 2, "m/s"));
    else if (wx.get("wind")) box.append(...bar(t(s === "speed" ? "lg.both" : "lg.flow"), F.stops, F.lo, F.hi, unitK));
    if (R && s !== "speed") box.append(...bar(t(`lg.${s}`), R.stops, R.lo, R.hi, R.unit));
    if (R && s === "speed" && !wx.get("wind")) box.append(...bar(t("lg.both"), R.stops, R.lo, R.hi, unitK));
    const p = wx.levels()[+$("#lv").value];
    if (wx.get("contours")) box.append(el("p", { class: "note", text: p === 1000 ? t("lg.iso") : t("lg.hgt", { p, s: p >= 700 ? 30 : p >= 500 ? 60 : 120 }) }));
    if (MODE === "3d" && wx3) box.append(el("p", { class: "note", text: t("lg.3d", { x: wx3.get("mode") === "stack" ? 75 : 38 }) }));
  }
  function info(r) {
    const b = $("#wx-info-body"); b.textContent = ""; $("#wx-info").hidden = false;
    const lat = `${Math.abs(r.lat).toFixed(1)}°${r.lat >= 0 ? "N" : "S"}`, lo = ((r.lon + 540) % 360) - 180, lon = `${Math.abs(lo).toFixed(1)}°${lo >= 0 ? "E" : "W"}`;
    const lvl = r.level === 1000 ? t("rd.surface") : t("rd.at", { p: r.level, info: t(`lv.${r.level}`) });
    const a = r.wind_kmh != null ? [t("rd.wind", { v: r.wind_kmh, dir: t(`dir16.${r.from}`, {}, r.from) })] : [t("rd.nowind")];
    if (isFinite(r.rh)) a.push(t("rd.rh", { v: r.rh })); if (r.hgt) a.push(t("rd.hgt", { v: r.hgt.toLocaleString("en") }));
    const s2 = []; if (r.mslp) s2.push(t("rd.mslp", { v: r.mslp })); if (isFinite(r.pwat)) s2.push(t("rd.pwat", { v: r.pwat }));
    if (r.sst != null && isFinite(r.sst)) s2.push(t("rd.sst", { v: r.sst.toFixed(1) }) + (r.sst >= 26.5 ? t("rd.warm") : ""));
    if (isFinite(r.tmp)) a.push(t("rd.tmp", { v: r.tmp.toFixed(1) })); if (isFinite(r.vort)) a.push(t("rd.vort", { v: r.vort.toFixed(1) }));
    if (isFinite(r.hs)) s2.push(t("rd.hs", { v: r.hs.toFixed(1), dir: t(`dir16.${r.wto}`, {}, r.wto) }));
    if (isFinite(r.cur) && r.cur > 0.02) s2.push(t("rd.cur", { v: r.cur.toFixed(2), dir: t(`dir16.${r.cto}`, {}, r.cto) }));
    if (isFinite(r.cape)) s2.push(t("rd.cape", { v: Math.round(r.cape) })); if (isFinite(r.rain)) s2.push(t("rd.rain", { v: r.rain.toFixed(1) }));
    b.append(el("h3", { text: `${lat}, ${lon}` }), el("p", { text: `${lvl}: ${a.join(", ")}${stop()}` }), el("p", { text: s2.join(", ") + stop() }));
    const F = window.WxMap.FLOW, c = r.wind_kmh != null ? F.css[Math.max(0, Math.min(255, Math.round(r.wind_kmh / F.hi * 255)))] : null;
    if (c) b.append(el("p", { class: "swatch" }, [el("i", { style: `background:${c}` }), ` ${r.wind_kmh} ${window.I18N && window.I18N.lang === "hi" ? "किमी/घंटा" : "km/h"}`]));
  }
  const REGION_TEXT = {
    hadley: () => ["Hadley cell", "Air rises near the equator in the ITCZ, flows poleward high up, sinks around 30° and returns along the surface as the trade winds. Tropical cyclones live inside this cell: they form in its moist air and are steered by the winds around the subtropical highs. Set the height to “Near the surface” to see the trades."],
    walker: () => { const e = CLIMO && CLIMO.climate && CLIMO.climate.enso;
      return ["Walker circulation", `Along the equatorial Pacific, trade winds push warm water west. Air rises over the warm western Pacific and Maritime Continent, flows east high up, and sinks over the cool eastern Pacific.${e ? ` Right now ENSO is ${e.phase} (Niño 3.4 index ${e.value > 0 ? "+" : ""}${e.value} °C, ${e.season}).` : ""} In El Niño the loop weakens and its rising branch moves east; in La Niña it strengthens.`]; },
    nino34: () => { const e = CLIMO && CLIMO.climate && CLIMO.climate.enso, i = CLIMO && CLIMO.climate && CLIMO.climate.iod;
      return ["Niño 3.4 and the Indian Ocean Dipole", `Niño 3.4 (5°S–5°N, 170°W–120°W): its sea temperature compared with normal measures El Niño (0.5 °C or more above) and La Niña (0.5 °C or more below).${e ? ` Latest: ${e.value > 0 ? "+" : ""}${e.value} °C, ${e.phase}.` : ""} The Indian Ocean Dipole compares a western box (50–70°E, 10°S–10°N) with an eastern box (90–110°E, 10°S–0°).${i ? ` Latest: ${i.value > 0 ? "+" : ""}${i.value}, ${i.phase}.` : ""}`]; } };
  REGION_TEXT.ocean = () => [t("oc.h"), t("oc.p")];
  function region(k) { const f = REGION_TEXT[k]; if (!f) return; const [h, x] = f(); const b = $("#wx-info-body"); b.textContent = ""; $("#wx-info").hidden = false; b.append(el("h3", { text: h }), el("p", { text: x })); }

  // ---------------------------------------------------------------- Learn diagrams
  function diagrams() {
    const lab = (x, y, t, a = "middle", c = "var(--ink-2)") => `<text x="${x}" y="${y}" text-anchor="${a}" fill="${c}">${t}</text>`;
    const loop = (x0, x1, up, color) => {                       // one cell: rising at x(up), sinking at the other end
      const xu = up === "l" ? x0 : x1, xd = up === "l" ? x1 : x0, top = 70, bot = 220, r = 22;
      return `<path d="M${xu},${bot - 10} L${xu},${top + r} Q${xu},${top} ${xu + (xd > xu ? r : -r)},${top} L${xd + (xd > xu ? -r : r)},${top} Q${xd},${top} ${xd},${top + r} L${xd},${bot - r} Q${xd},${bot} ${xd + (xd > xu ? -r : r)},${bot} L${xu + (xd > xu ? r : -r)},${bot}"
        fill="none" stroke="${color}" stroke-width="3" marker-end="url(#ah)"/>`;
    };
    const X = (lat) => 40 + (lat + 90) / 180 * 640;
    $("#fig-cells").innerHTML = `<svg viewBox="0 0 720 300" role="img" aria-label="Cross-section of the atmosphere from pole to pole showing the Hadley, Ferrel and polar cells">
      <defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink)"/></marker></defs>
      <rect x="40" y="240" width="640" height="10" fill="var(--soft)"/><path d="M40,95 Q360,30 680,95" fill="none" stroke="var(--line)" stroke-dasharray="4 4"/>
      ${lab(560, 44, "tropopause, the top of the weather layer")}
      ${loop(X(0), X(30), "l", "#e8a33d")}${loop(X(-30), X(0), "r", "#e8a33d")}${loop(X(30), X(60), "r", "#2fa39a")}${loop(X(-60), X(-30), "l", "#2fa39a")}
      ${loop(X(60), X(90) - 6, "l", "#7aa0d6")}${loop(X(-90) + 6, X(-60), "r", "#7aa0d6")}
      ${lab(X(15), 150, "Hadley", "middle", "#b8741c")}${lab(X(-15), 150, "Hadley", "middle", "#b8741c")}${lab(X(45), 150, "Ferrel", "middle", "#1f7d76")}${lab(X(-45), 150, "Ferrel", "middle", "#1f7d76")}
      ${lab(X(75), 150, "Polar", "middle", "#4a72aa")}${lab(X(-75), 150, "Polar", "middle", "#4a72aa")}
      ${[-90, -60, -30, 0, 30, 60, 90].map((l) => lab(X(l), 266, l ? `${Math.abs(l)}°${l > 0 ? "N" : "S"}` : "Equator", "middle", "var(--ink)")).join("")}
      ${lab(X(-75), 286, "polar easterlies")}${lab(X(-45), 286, "westerlies")}${lab(X(-15), 286, "trade winds")}${lab(X(15), 286, "trade winds")}${lab(X(45), 286, "westerlies")}${lab(X(75), 286, "polar easterlies")}
      ${lab(X(0), 60, "ITCZ: rising air", "middle", "var(--ink)")}${lab(X(30), 232, "high: sinking", "middle")}${lab(X(-30), 232, "high: sinking", "middle")}</svg>`;
    const walker = (y0, el) => { const xr = el ? 330 : 150, xs = el ? 600 : 560;
      return `<g transform="translate(0,${y0})"><rect x="40" y="110" width="640" height="10" fill="var(--soft)"/>
        <path d="M${xs},100 L${xr + 30},100" stroke="var(--ink)" stroke-width="${el ? 2 : 3.5}" fill="none" marker-end="url(#ah)"/>
        <path d="M${xr},95 L${xr},25 L${xs - 20},25 L${xs},45 L${xs},90" stroke="#e8a33d" stroke-width="3" fill="none" marker-end="url(#ah)"/>
        <g fill="var(--panel)" stroke="var(--ink-2)"><ellipse cx="${xr}" cy="30" rx="34" ry="14"/><ellipse cx="${xr - 22}" cy="42" rx="24" ry="12"/><ellipse cx="${xr + 24}" cy="42" rx="24" ry="12"/></g>
        ${lab(xr, 68, "rising air, rain")}${lab(xs, 68, "sinking, dry")}${lab((xr + xs) / 2, 140, el ? "weak trade winds: El Niño" : "strong easterly trade winds: normal or La Niña")}
        ${lab(60, 140, "Indonesia", "start")}${lab(670, 140, "South America", "end")}</g>`; };
    $("#fig-walker").innerHTML = `<svg viewBox="0 0 720 330" role="img" aria-label="The Walker circulation in normal conditions and during El Niño">
      <defs><marker id="ah2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink)"/></marker></defs>
      ${walker(5, false).replaceAll("url(#ah)", "url(#ah2)")}${walker(170, true).replaceAll("url(#ah)", "url(#ah2)")}</svg>`;
    $("#fig-tc").innerHTML = `<svg viewBox="0 0 720 260" role="img" aria-label="Cross-section of a tropical cyclone with the eye, eyewall, rain bands, inflow near the sea and outflow aloft">
      <defs><marker id="ah3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink)"/></marker></defs>
      <rect x="20" y="215" width="680" height="16" fill="#2f8fc4" opacity=".55"/>${lab(360, 252, "warm sea, at least about 26.5 °C: the storm's fuel")}
      <g fill="var(--panel)" stroke="var(--ink-2)"><path d="M300,210 C290,120 300,60 330,40 L340,210 Z"/><path d="M420,210 C430,120 420,60 390,40 L380,210 Z"/>
      <path d="M150,210 C150,170 170,140 200,135 L215,210 Z"/><path d="M570,210 C570,170 550,140 520,135 L505,210 Z"/><path d="M70,210 C75,185 90,175 110,172 L120,210 Z"/><path d="M650,210 C645,185 630,175 610,172 L600,210 Z"/></g>
      <path d="M40,205 L285,205" stroke="var(--ink)" stroke-width="2.5" marker-end="url(#ah3)"/><path d="M680,205 L435,205" stroke="var(--ink)" stroke-width="2.5" marker-end="url(#ah3)"/>
      <path d="M335,32 C300,15 200,15 90,40" stroke="#e8a33d" stroke-width="2.5" fill="none" marker-end="url(#ah3)"/><path d="M385,32 C420,15 520,15 630,40" stroke="#e8a33d" stroke-width="2.5" fill="none" marker-end="url(#ah3)"/>
      ${lab(360, 130, "eye: calm,")}${lab(360, 146, "sinking air")}${lab(255, 100, "eyewall", "end")}${lab(465, 100, "eyewall", "start")}${lab(180, 125, "rain bands")}
      ${lab(140, 197, "moist air spirals in")}${lab(560, 12, "outflow aloft")}</svg>`;
  }

  // ---------------------------------------------------------------- navigation
  const VIEWS = { today: "today", map: "map", storms: "analysis", learn: "learn", about: "about" };
  const TITLES = { today: "GlobalTCView: tropical cyclones today", map: "Live map of winds and oceans · GlobalTCView", analysis: "Storm analysis · GlobalTCView",
                   learn: "Learn how cyclones work · GlobalTCView", about: "About · GlobalTCView" };
  function show(v, opts) {
    document.body.dataset.view = v; if (wxMini) wxMini.pause(v !== "today");
    for (const s of $$(".view")) s.hidden = s.id !== `view-${v}`;
    for (const a of $$(".views a")) a.setAttribute("aria-current", a.dataset.view === v ? "page" : "false");
    if (v === "map") { initMap().then(() => setMode(MODE)); } else { if (wx) wx.pause(true); if (wx3) wx3.pause(true); }
    if (v === "analysis") requestAnimationFrame(() => { window.dispatchEvent(new Event("resize")); if (window.TCDash) window.TCDash.refresh(); });
    document.title = TITLES[v] || TITLES.today;
    const want = v === "analysis" ? null : `#${Object.keys(VIEWS).find((k) => VIEWS[k] === v)}`;
    const keep = v === "map" && location.hash.startsWith("#map?");            // keep map settings in the address
    if (want && !keep && location.hash !== want) history.replaceState(null, "", want);
    if (!opts || !opts.keepScroll) window.scrollTo(0, 0);
  }
  function route() {
    const h = decodeURIComponent(location.hash.slice(1)), [path, qs] = h.split("?");
    if (/(^|&)storm=/.test(h)) { show("analysis"); return; }
    if (VIEWS[path]) { show(VIEWS[path]); if (path === "map" && qs) applyMapState(new URLSearchParams(qs)); return; }
    const target = path && document.getElementById(path), host = target && target.closest(".view");   // an in-page anchor such as #place-h or #l-surge
    if (host) { show(host.id.replace("view-", ""), { keepScroll: true }); history.replaceState(null, "", `#${Object.keys(VIEWS).find((k) => VIEWS[k] === host.id.replace("view-", "")) || "today"}`);
      requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" })); return; }
    show("today");
  }
  // in-page links (table of contents, hero buttons) scroll without changing the route
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return; const id = a.getAttribute("href").slice(1);
    if (!id || VIEWS[id.split("?")[0]] || /(^|&)storm=/.test(id)) return;
    const target = document.getElementById(id); if (!target) return;
    e.preventDefault(); const host = target.closest(".view"); if (host && host.hidden) show(host.id.replace("view-", ""), { keepScroll: true });
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  // ---------------------------------------------------------------- map settings in the address: #map?view=2d&layer=sst&level=850&ov=cells&flow=wind&t=24&lon=85&lat=12&z=1.6
  let applying = false;
  async function applyMapState(q) {
    await initMap(); if (!wx) return; applying = true;
    try {
      if (q.get("view")) setMode(q.get("view") === "3d" ? "3d" : "2d");
      const lv = +q.get("level"); if (lv) { const i = wx.levels().indexOf(lv); if (i >= 0) { $("#lv").value = i; $("#lv").dispatchEvent(new Event("input")); } }
      const tq = q.get("t"); if (tq != null && wx.meta() && wx.meta().times) { const i = wx.meta().times.findIndex((x) => x.offset_h === +tq); if (i >= 0) await goTime(i); }
      for (const [name, key] of [["scalar", "layer"], ["flow", "flow"]]) { const v = q.get(key); const r = v && $(`input[name="${name}"][value="${v}"]`); if (r && !r.checked) { r.checked = true; r.dispatchEvent(new Event("change")); } }
      for (const ov of (q.get("ov") || "").split(",").filter(Boolean)) { const c = $(`.chip[data-ov="${ov}"]`); if (c && c.getAttribute("aria-pressed") !== "true") c.click(); }
      if (q.get("lon") && q.get("lat")) both((m) => m.focus(+q.get("lon"), +q.get("lat"), +q.get("z") || 1.6));
      if (q.get("stack") === "1" && wx3) { $("#ly-stack").checked = true; $("#ly-stack").dispatchEvent(new Event("change")); }
    } finally { applying = false; writeMapState(); }
  }
  function mapStateQuery() {
    if (!wx) return ""; const q = new URLSearchParams(); q.set("view", MODE);
    const sc = $('input[name="scalar"]:checked'), fl = $('input[name="flow"]:checked'); if (sc) q.set("layer", sc.value); if (fl && fl.value !== "wind") q.set("flow", fl.value);
    const p = wx.levels()[+$("#lv").value]; if (p) q.set("level", p);
    const m = wx.meta(); if (m && m.times && m.times[+$("#tm").value]) q.set("t", m.times[+$("#tm").value].offset_h);
    const ov = $$('.chip[data-ov][aria-pressed="true"]').map((c) => c.dataset.ov); if (ov.length) q.set("ov", ov.join(","));
    if (MODE === "2d" && wx.getView) { const g = wx.getView(); q.set("lon", g.lon); q.set("lat", g.lat); q.set("z", g.k); }
    if (wx3 && MODE === "3d" && $("#ly-stack").checked) q.set("stack", "1");
    return q.toString();
  }
  let wTimer = null;
  function writeMapState() {
    if (applying || document.body.dataset.view !== "map") return;
    clearTimeout(wTimer); wTimer = setTimeout(() => { const q = mapStateQuery(); if (q) history.replaceState(null, "", `#map?${q}`); }, 250);
  }
  document.addEventListener("change", (e) => { if (e.target.closest && e.target.closest(".mapview")) writeMapState(); });
  document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest(".mapview .chip, .mapview .seg")) setTimeout(writeMapState, 50); });
  document.addEventListener("pointerup", (e) => { if (e.target.closest && e.target.closest("#wx")) writeMapState(); });
  document.addEventListener("wheel", (e) => { if (e.target.closest && e.target.closest("#wx")) writeMapState(); }, { passive: true });
  $("#copy-view").addEventListener("click", async () => {
    writeMapState(); await new Promise((r) => setTimeout(r, 300)); const b = $("#copy-view"), old = b.textContent;
    try { await navigator.clipboard.writeText(location.href); b.textContent = t("ly.copied", {}, "Link copied"); } catch (e) { b.textContent = location.href; }
    setTimeout(() => { b.textContent = old; }, 1800);
  });
  // About: author details from config.js
  (() => { const S_ = window.SITE || {}, box = $("#ab-author"); if (!box) return;
    box.append(`Made by ${S_.name || "the author"}${S_.affiliation ? `, ${S_.affiliation}` : ""}. `);
    for (const [k, label] of [["github", "GitHub"], ["scholar", "Google Scholar"], ["linkedin", "LinkedIn"], ["email", "Email"]]) {
      const v = S_.links && S_.links[k]; if (v) box.append(el("a", { href: k === "email" ? `mailto:${v}` : v, target: "_blank", rel: "noopener", text: label }), " ");
    } })();
  function openStorm(key) { show("analysis"); const go = () => { if (window.TCDash && window.TCDash.open(key)) return; setTimeout(go, 200); }; go(); }
  window.addEventListener("hashchange", route);
  $$(".views a").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); show(a.dataset.view); }));
  $("#brand").addEventListener("click", (e) => { e.preventDefault(); show("today"); });
  $$("[data-goto]").forEach((b) => b.addEventListener("click", async () => {
    const g = b.dataset.goto;
    if (g === "game") { show("learn"); setTimeout(() => $("#l-game").scrollIntoView({ behavior: "smooth" }), 60); return; }
    show("map"); await initMap(); if (!wx) return; if (g !== "sst") setMode("2d");
    if (g === "ocean") { const c = $('.chip[data-ov="ocean"]'); if (c && c.getAttribute("aria-pressed") !== "true") c.click(); const f = $('input[name="flow"][value="currents"]'); if (f) { f.checked = true; f.dispatchEvent(new Event("change")); } both((m) => m.focus(-40, 20, 1)); return; }
    const press = (ov) => { const c = $(`.chip[data-ov="${ov}"]`); if (c && c.getAttribute("aria-pressed") !== "true") c.click(); };
    if (g === "cells") { press("cells"); const i = wx.levels().indexOf(1000); if (i >= 0) { $("#lv").value = i; $("#lv").dispatchEvent(new Event("input")); } setScalar("pwat"); both((m) => m.focus(30, 5, 1)); }
    if (g === "walker") { press("walker"); both((m) => m.focus(-160, 0, 1.2)); }
    if (g === "nino") { press("nino"); setScalar("sst"); both((m) => m.focus(-150, 0, 1)); }
    if (g === "sst") { setScalar("sst"); both((m) => m.focus(88, 12, 1.3)); }
  }));
  function setScalar(v) { const r = $(`input[name="scalar"][value="${v}"]`); if (r) { r.checked = true; r.dispatchEvent(new Event("change")); } }

  $("#go-place").addEventListener("click", (e) => { e.preventDefault(); $("#place-h").scrollIntoView({ behavior: "smooth", block: "center" }); $("#city").focus({ preventScroll: true }); });
  $("#go-map").addEventListener("click", (e) => { e.preventDefault(); show("map"); });
  $("#go-guide").addEventListener("click", () => window.TCGuide && window.TCGuide.open());
  // light and dark: the maps redraw with the new palette
  new MutationObserver(() => { if (wx) wx.theme(); if (wxMini) wxMini.theme(); legend(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // ---------------------------------------------------------------- language
  const langSel = $("#lang");
  if (window.I18N) {
    for (const [k, v] of Object.entries(window.I18N.LANGS)) langSel.append(el("option", { value: k, text: v }));
    langSel.value = window.I18N.lang; langSel.addEventListener("change", () => window.I18N.set(langSel.value));
    document.addEventListener("langchange", () => { if (wx) wx.set("labels", $("#ly-labels").checked); today(); if (LAST_PLACE) assess(LAST_PLACE); levelLabel(); legend(); const m = wx && wx.meta(); if (m) $("#wx-time").textContent = t("map.time", { t: when(toMs(m.cycle)) }); });
    window.I18N.apply();
  } else langSel.hidden = true;

  // ---------------------------------------------------------------- start
  diagrams(); route();
  getJSON("data/storms.json").then((d) => {
    DATA = d; ACTIVE = (d.storms || []).filter((s) => s.status === "active" && s.track && s.track.length);
    today(); glance(); miniGlobe();
    try { const p = JSON.parse(localStorage.getItem("tc-place") || "null"); if (p) { assess(p); const o = [...city.options].find((x) => x.value.endsWith(`,${p.name}`)); if (o) city.value = o.value; } } catch (e) { /* ignore */ }
    both((m) => m.setStorms(stormList()));
  }).catch(() => { $("#t-headline").textContent = "The storm list could not be loaded. It is created by the site's regular update."; });
  getJSON("data/climo.json").then((d) => {
    CLIMO = d; if (wx && d.climate) wx.setClimate(d.climate); glance();
    const e = d.climate && d.climate.enso, n = $("#l-enso-now");
    if (e) { n.hidden = false; n.textContent = `Right now: ${e.phase} (Niño 3.4 index ${e.value > 0 ? "+" : ""}${e.value} °C, ${e.season}).`; }
  }).catch(() => {});
  window.TCShell = {
    show, openStorm, stormPanel, initMap, setScalar, place: () => LAST_PLACE,
    data: () => ({ ACTIVE, CLIMO, DATA, TOWNS }), where, motion, className,
    goto: (g) => { const b = document.querySelector(`[data-goto="${g}"]`); if (b) b.click(); },
    flow: async (v) => { await initMap(); const f = $(`input[name="flow"][value="${v}"]`); if (f) { f.checked = true; f.dispatchEvent(new Event("change")); } },
    overlay: async (ov) => { await initMap(); const c = $(`.chip[data-ov="${ov}"]`); if (c && c.getAttribute("aria-pressed") !== "true") c.click(); },
    focus: async (lon, lat, k) => { await initMap(); both((m) => m.focus(lon, lat, k || 1.8)); },
  };
})();
