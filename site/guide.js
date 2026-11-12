/* GlobalTCView guide: a static assistant (no AI service) that answers from what the site already knows,
   a guided tour, quick quizzes and the "could a cyclone form here?" game. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, attrs = {}, kids = []) => { const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === "text") n.textContent = v; else n.setAttribute(k, v); }
    for (const k of [].concat(kids)) if (k != null) n.append(k); return n; };
  const S = () => window.TCShell || {}, D = () => (S().data ? S().data() : { ACTIVE: [], CLIMO: null });
  const kmh = (kt) => Math.round(kt * 1.852);

  // ---------------------------------------------------------------- what the guide knows
  const CURRENTS = {
    "gulf stream": ["The Gulf Stream", "A fast, warm current that leaves the Gulf of Mexico, runs up the US east coast and crosses the Atlantic. It carries tropical heat to Europe, which is why western Europe is mild for its latitude. Hurricanes often strengthen over its warm water.", -72, 35],
    kuroshio: ["The Kuroshio", "The Pacific's version of the Gulf Stream: warm water flowing north-east past Taiwan and Japan. Typhoons passing over it can keep their strength further north.", 135, 32],
    agulhas: ["The Agulhas Current", "One of the fastest ocean currents: warm water running south along the east coast of southern Africa. Where it meets the Atlantic it sheds rings of warm water, and giant waves form when storms blow against it.", 32, -30],
    labrador: ["The Labrador Current", "A cold current carrying Arctic water south past Labrador and Newfoundland. Where it meets the Gulf Stream, the clash of cold and warm water makes the fog banks of the Grand Banks, and it carried the iceberg that sank the Titanic.", -55, 50],
    humboldt: ["The Humboldt (Peru) Current", "A cold current flowing north along South America. Winds pull surface water offshore, so cold, nutrient-rich water wells up and feeds one of the richest fisheries on Earth. During El Niño the upwelling weakens and the sea off Peru warms.", -78, -20],
    benguela: ["The Benguela Current", "A cold current with strong upwelling along south-west Africa. It keeps the Namib Desert coast cool and foggy.", 12, -24],
    somali: ["The Somali Current", "It reverses with the monsoon: in summer it races north along Somalia, and upwelling cools the western Arabian Sea, which is one reason fewer cyclones form there in the monsoon.", 50, 6],
    "antarctic circumpolar": ["The Antarctic Circumpolar Current", "The largest current on Earth, flowing eastward all the way round Antarctica and linking the Atlantic, Indian and Pacific oceans.", 0, -55],
  };
  const TOPICS = [
    { id: "now", q: "What's happening now?", keys: ["now", "today", "current", "active", "storm", "cyclone right", "happening", "news"], a: () => {
      const A = (D().ACTIVE || []).slice().sort((a, b) => b.vmax_kt - a.vmax_kt);
      if (!A.length) return { text: "No tropical cyclones are active anywhere right now. You can still explore today's winds and oceans on the live map.", acts: [["Open the live map", () => S().show("map")]] };
      const lines = A.slice(0, 4).map((s) => `${s.name}: ${S().className ? S().className(s, s.vmax_kt) : ""}, winds of ${kmh(s.vmax_kt)} km/h, ${S().where ? S().where(s) : s.basin_name}.`);
      return { text: `${A.length === 1 ? "One storm is" : `${A.length} storms are`} active. ${lines.join(" ")}`,
        acts: A.slice(0, 3).map((s) => [`Show ${s.name}`, async () => { S().show("map"); await S().initMap(); S().stormPanel(s.key); }]) };
    } },
    { id: "town", q: "Is a cyclone coming to my town?", keys: ["my town", "my city", "near me", "coming", "my place", "location", "safe", "hit"], a: () => ({
      text: "Use the town check on the Today page: choose your town or share your location, and it tells you how close any storm may come in the next five days, with the official agency to follow. Your place stays on your device.",
      acts: [["Check my town", () => { S().show("today"); setTimeout(() => { const c = $("#city"); if (c) { c.scrollIntoView({ behavior: "smooth", block: "center" }); c.focus({ preventScroll: true }); } }, 80); }]] }) },
    { id: "form", q: "How does a cyclone form?", keys: ["form", "formation", "made", "born", "ingredient", "need", "why do cyclones", "how do cyclones"], a: () => ({
      text: "A cyclone needs four things together: warm sea (about 26.5 °C or more) to fuel it, moist air through a deep layer, weak vertical wind shear so the storm is not torn apart, and a spinning start away from the equator. Warm moist air rises in thunderstorms, pressure falls, winds speed up and draw in more moist air.",
      acts: [["Play the ingredients game", () => S().goto("game")], ["Show warm sea on the map", () => S().goto("sst")]] }) },
    { id: "eye", q: "What is the eye of a cyclone?", keys: ["eye", "eyewall", "calm"], a: () => ({
      text: "The eye is the calm, often clear centre of a strong cyclone, where air sinks. Around it the eyewall has the strongest winds and heaviest rain. If the wind suddenly stops during a cyclone, it may be the eye passing: stay inside, the wind will return from the other side.",
      acts: [["See the diagram", () => { S().show("learn"); setTimeout(() => $("#l-tc").scrollIntoView({ behavior: "smooth" }), 60); }]] }) },
    { id: "cells", q: "What are the Hadley, Ferrel and polar cells?", keys: ["hadley", "ferrel", "polar cell", "cell", "trade wind", "westerl", "itcz", "circulation"], a: () => ({
      text: "The atmosphere turns over in three great loops in each hemisphere. In the Hadley cell air rises near the equator (the ITCZ), flows poleward high up, sinks near 30° and returns as the trade winds. The Ferrel cell, 30–60°, gives the westerlies; the polar cell sinks cold air at the poles.",
      acts: [["Show the cells on the map", () => S().goto("cells")]] }) },
    { id: "walker", q: "What is the Walker circulation?", keys: ["walker", "pacific loop", "east-west"], a: () => ({
      text: "Along the equatorial Pacific, trade winds push warm water west; air rises over the warm west Pacific and sinks over the cool east Pacific. During El Niño this loop weakens and its rising branch moves east.",
      acts: [["Show it on the map", () => S().goto("walker")]] }) },
    { id: "enso", q: "Is it El Niño or La Niña now?", keys: ["el nino", "el niño", "la nina", "la niña", "enso", "nino"], a: () => { const e = D().CLIMO && D().CLIMO.climate && D().CLIMO.climate.enso;
      return { text: (e ? `Right now ENSO is ${e.phase}: the Niño 3.4 index is ${e.value > 0 ? "+" : ""}${e.value} °C (${e.season}, NOAA). ` : "") +
        "El Niño means the central and eastern equatorial Pacific is at least 0.5 °C warmer than normal for several months; La Niña means 0.5 °C or more cooler. They shift storms and rainfall around the world.",
        acts: [["Show the Niño 3.4 region", () => S().goto("nino")]] }; } },
    { id: "iod", q: "What is the Indian Ocean Dipole?", keys: ["iod", "dipole", "indian ocean dipole"], a: () => { const i = D().CLIMO && D().CLIMO.climate && D().CLIMO.climate.iod;
      return { text: `The Indian Ocean Dipole compares sea temperatures in the western and eastern Indian Ocean. A positive dipole (west warmer) tends to bring more rain to East Africa and India.${i ? ` The latest value is ${i.value > 0 ? "+" : ""}${i.value} (${i.phase}).` : ""}`,
        acts: [["Show the dipole boxes", () => S().goto("nino")]] }; } },
    { id: "mjo", q: "What is the MJO?", keys: ["mjo", "madden", "julian"], a: () => { const m = D().CLIMO && D().CLIMO.climate && D().CLIMO.climate.mjo;
      return { text: `The Madden–Julian Oscillation is a pulse of clouds and rain that travels east around the tropics every 30–60 days. Where its wet phase is, cyclones are more likely to form: phases 2–4 favour the Indian Ocean.${m ? ` Right now it is ${m.active ? `in phase ${m.phase}` : "weak"}.` : ""}`, acts: [] }; } },
    { id: "gyre", q: "What are ocean gyres?", keys: ["gyre", "ocean current", "currents", "ocean"], a: () => ({
      text: "Winds drive five great loops of surface currents, the gyres: clockwise in the Northern Hemisphere, anticlockwise in the Southern. Warm currents run poleward on their western sides (Gulf Stream, Kuroshio, Agulhas); cold currents flow towards the equator on their eastern sides (Canary, California, Benguela, Humboldt).",
      acts: [["Show currents and gyres", () => S().goto("ocean")]] }) },
    { id: "shear", q: "What is wind shear?", keys: ["shear"], a: () => ({
      text: "Vertical wind shear is how much the wind changes between the lower and upper atmosphere. Strong shear tilts a storm and blows its top away from its base, so it weakens; under about 10 m/s, storms can strengthen.",
      acts: [["Show shear on the map", async () => { S().show("map"); await S().initMap(); S().setScalar("shear"); }]] }) },
    { id: "ri", q: "What is rapid intensification?", keys: ["rapid", "intensif", "ri ", "strengthen quickly", "suddenly"], a: () => ({
      text: "Rapid intensification is when a storm's winds increase by 30 kt (about 55 km/h) or more in 24 hours. Most of the strongest cyclones go through it, and it is one of the hardest things to forecast. Storm analysis shows an experimental RI chance for each active storm.",
      acts: [["Open storm analysis", () => S().show("analysis")]] }) },
    { id: "waves", q: "How big are the waves today?", keys: ["wave", "sea state", "fisher", "boat", "rough sea"], a: () => ({
      text: "Choose Ocean waves under “Moving lines show” on the live map: the lines move the way waves travel and the colour shows their height. For your own coast, the Today page gives a five-day sea forecast with advice for small boats.",
      acts: [["Show waves", async () => { S().show("map"); await S().flow("waves"); }]] }) },
    { id: "surge", q: "What is storm surge?", keys: ["surge", "flood", "sea rise", "inundat"], a: () => ({
      text: "Storm surge is the rise of the sea pushed onshore by a cyclone's winds and low pressure. It is highest on shallow, low coasts such as the head of the Bay of Bengal, and causes most cyclone deaths there. Storm analysis has an indicative surge index for each storm.",
      acts: [["Open storm analysis", () => S().show("analysis")]] }) },
    { id: "scale", q: "How are cyclones classified?", keys: ["category", "class", "scale", "severe", "imd", "saffir", "strong is"], a: () => ({
      text: "In the North Indian Ocean, IMD classes run from Depression (31–61 km/h) through Cyclonic Storm (62–88 km/h), Severe, Very Severe and Extremely Severe, to Super Cyclonic Storm (222 km/h or more). Elsewhere the Saffir–Simpson scale goes from category 1 (119 km/h) to category 5 (252 km/h or more).",
      acts: [["See the full table", () => { S().show("learn"); setTimeout(() => $("#l-scale").scrollIntoView({ behavior: "smooth" }), 60); }]] }) },
    { id: "map", q: "How do I use the live map?", keys: ["use the map", "map", "layer", "slider", "3d", "flat", "how do i"], a: () => ({
      text: "On the live map: drag to turn the Earth, scroll or use + and − to zoom. Choose what the moving lines show (wind, waves or currents) and what colours the map. The height slider moves through the atmosphere; the time slider goes from two days ago to five days ahead. Click anywhere to read the values there.",
      acts: [["Take the tour", () => tour()]] }) },
    { id: "data", q: "Where does the data come from?", keys: ["data", "source", "accurate", "reliable", "official", "who made"], a: () => ({
      text: "Weather, waves and currents come from NOAA's GFS, WaveWatch III and RTOFS models; storm positions from official advisories (TCVitals); history from IBTrACS; imagery from NASA. It is a research site by Devashish (IIT Hyderabad), not an official warning service: always follow your national weather service.", acts: [] }) },
    { id: "tour", q: "Take the tour", keys: ["tour", "show me around", "help", "start", "guide me"], a: () => ({ text: "Here is a quick tour of the site.", acts: [["Start the tour", () => tour()]] }) },
  ];
  for (const [k, c] of Object.entries(CURRENTS)) TOPICS.push({ id: `cur-${k}`, keys: [k, c[0].toLowerCase()], a: () => ({ text: `${c[0]}: ${c[1]}`,
    acts: [["Show it on the map", async () => { S().show("map"); await S().initMap(); await S().overlay("ocean"); await S().flow("currents"); S().focus(c[2], c[3], 2.2); }]] }) });

  function answer(q) {
    const t = ` ${q.toLowerCase()} `; let best = null, score = 0;
    for (const tp of TOPICS) { let sc = 0; for (const k of tp.keys) if (t.includes(k)) sc += k.length; if (sc > score) { score = sc; best = tp; } }
    if (!best) return { text: "I don't know that one yet. I can tell you about today's storms, your town, how cyclones form, the circulation cells, El Niño, the ocean currents, waves, storm surge or how to use the map.", acts: [] };
    return best.a();
  }

  // ---------------------------------------------------------------- the guide panel
  const panel = $("#guide"), log = $("#g-log"), fab = $("#guide-fab");
  function say(who, text, acts = []) {
    const m = el("div", { class: `g-msg ${who}` }, [el("p", { text })]);
    if (acts.length) { const row = el("div", { class: "g-acts" }); for (const [label, fn] of acts) { const b = el("button", { type: "button", class: "btn ghost", text: label }); b.addEventListener("click", fn); row.append(b); } m.append(row); }
    log.append(m); log.scrollTop = log.scrollHeight;
  }
  function suggestions() {
    const box = $("#g-sugg"); box.textContent = "";
    for (const id of ["now", "town", "form", "cells", "enso", "gyre", "map", "tour"]) {
      const tp = TOPICS.find((x) => x.id === id); const b = el("button", { type: "button", class: "chip-l", text: tp.q });
      b.addEventListener("click", () => ask(tp.q)); box.append(b);
    }
  }
  function ask(q) { say("me", q); const r = answer(q); setTimeout(() => say("bot", r.text, r.acts), 180); }
  function open() {
    panel.hidden = false; fab.setAttribute("aria-expanded", "true");
    if (!log.childElementCount) { say("bot", "Hello! I can show you around and explain what you see. Ask a question or pick one below."); suggestions(); }
    $("#g-q").focus();
  }
  const close = () => { panel.hidden = true; fab.setAttribute("aria-expanded", "false"); };
  fab.addEventListener("click", () => (panel.hidden ? open() : close()));
  $("#guide-x").addEventListener("click", close);
  $("#g-ask").addEventListener("submit", (e) => { e.preventDefault(); const q = $("#g-q").value.trim(); if (q) { ask(q); $("#g-q").value = ""; } });

  // ---------------------------------------------------------------- guided tour
  const STEPS = [
    ["today", "#t-headline", "Today", "The headline tells you, in plain words, which cyclones are active and where."],
    ["today", ".place", "Your town", "Choose your town to see whether a storm may come near in the next five days, plus a five-day rain, wind and sea forecast."],
    ["today", "#t-storms", "Storms right now", "Each active storm with its strength in km/h and where it is heading. Open it on the map or in the analysis."],
    ["map", ".viewseg", "3D globe or flat map", "Switch between a 3D globe and a flat map. In 3D you can stack all heights to see a cyclone's vortex."],
    ["map", ".layers", "Layers", "Choose what the moving lines show (wind, waves or currents), what colours the map, and the teaching overlays."],
    ["map", ".timebar", "Time", "Slide from two days ago to five days ahead, or press play."],
    ["map", ".level", "Height", "Move up through the atmosphere, from the surface to about 12 km."],
    ["analysis", ".stage-tabs", "Storm analysis", "For each storm: 3D flow, track map, comparison and impact, all on one shared timeline."],
    ["learn", "#l-game", "Learn by playing", "Try the ingredients game: can you make a cyclone form?"],
    ["today", "#guide-fab", "Ask the guide", "Ask me anything, any time. That's the tour!"],
  ];
  let step = 0;
  function tour() { close(); step = 0; $("#tour").hidden = false; showStep(); }
  function showStep() {
    const [view, sel, title, text] = STEPS[step]; if (S().show && document.body.dataset.view !== view) S().show(view);
    setTimeout(async () => {
      if (view === "map" && S().initMap) await S().initMap();
      const target = $(sel), spot = $("#tour-spot"), tip = $("#tour-tip");
      if (target) target.scrollIntoView({ block: "center" });
      const r = target ? target.getBoundingClientRect() : { left: innerWidth / 2 - 100, top: innerHeight / 2 - 40, width: 200, height: 80 };
      Object.assign(spot.style, { left: `${r.left - 8}px`, top: `${r.top - 8}px`, width: `${r.width + 16}px`, height: `${r.height + 16}px` });
      tip.textContent = "";
      tip.append(el("p", { class: "tt-step", text: `${step + 1} of ${STEPS.length}` }), el("h3", { text: title }), el("p", { text }));
      const row = el("div", { class: "g-acts" });
      if (step > 0) { const b = el("button", { type: "button", class: "btn ghost", text: "Back" }); b.addEventListener("click", () => { step--; showStep(); }); row.append(b); }
      const n = el("button", { type: "button", class: "btn", text: step < STEPS.length - 1 ? "Next" : "Finish" }); n.addEventListener("click", () => { if (step < STEPS.length - 1) { step++; showStep(); } else endTour(); }); row.append(n);
      const x = el("button", { type: "button", class: "btn ghost", text: "Skip" }); x.addEventListener("click", endTour); row.append(x);
      tip.append(row);
      const below = r.top + r.height + 220 < innerHeight;
      Object.assign(tip.style, { left: `${Math.max(12, Math.min(innerWidth - 352, r.left))}px`, top: below ? `${r.top + r.height + 16}px` : `${Math.max(12, r.top - 200)}px` });
      n.focus();
    }, view === "map" ? 400 : 150);
  }
  function endTour() { $("#tour").hidden = true; try { localStorage.setItem("tc-toured", "1"); } catch (e) { /* ignore */ } }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#tour").hidden) endTour(); });

  // ---------------------------------------------------------------- quick quizzes (Learn)
  const QUIZ = {
    cells: [["Where does air rise in the Hadley cell?", ["Near the equator", "Around 30° latitude", "Over the poles"], 0, "Warm air rises near the equator, in the ITCZ, and sinks around 30°."],
            ["Which winds blow at the surface between 30° and 60°?", ["Trade winds", "Westerlies", "Polar easterlies"], 1, "The Ferrel cell gives the westerlies, which carry weather from west to east."]],
    walker: [["During El Niño, where does the rising branch of the Walker circulation move?", ["West, towards Africa", "East, towards the central Pacific", "It disappears for good"], 1, "Warm water spreads east, and the rising air follows it."],
             ["Which region's sea temperature defines El Niño?", ["The Bay of Bengal", "Niño 3.4 in the equatorial Pacific", "The North Atlantic"], 1, "Niño 3.4 is 5°S–5°N, 170°W–120°W."]],
    tc: [["About how warm must the sea be for a tropical cyclone?", ["About 15 °C", "About 26.5 °C", "About 35 °C"], 1, "Below about 26.5 °C the sea does not give enough heat and moisture."],
         ["Why do cyclones almost never form on the equator?", ["The sea is too cold", "The Earth's spin cannot start the swirl there", "There is no wind"], 1, "The Coriolis effect, which turns the winds into a spin, is zero at the equator."]],
  };
  for (const box of $$(".quiz[data-quiz]")) {
    const qs = QUIZ[box.dataset.quiz]; if (!qs) continue; box.hidden = false;
    box.append(el("h3", { text: "Quick quiz" }));
    qs.forEach(([q, opts, ok, why]) => {
      const f = el("div", { class: "qz" }, [el("p", { class: "qz-q", text: q })]), fb = el("p", { class: "qz-fb", "aria-live": "polite" });
      opts.forEach((o, i) => { const b = el("button", { type: "button", class: "qz-o", text: o });
        b.addEventListener("click", () => { for (const x of $$(".qz-o", f)) x.disabled = true; b.classList.add(i === ok ? "right" : "wrong"); $$(".qz-o", f)[ok].classList.add("right");
          fb.textContent = `${i === ok ? "Right! " : "Not quite. "}${why}`; }); f.append(b); });
      f.append(fb); box.append(f);
    });
  }

  // ---------------------------------------------------------------- the ingredients game
  const g = { sst: $("#g-sst"), rh: $("#g-rh"), sh: $("#g-sh"), lat: $("#g-lat") };
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  function game() {
    if (!g.sst) return;
    const sst = +g.sst.value, rh = +g.rh.value, sh = +g.sh.value, lat = +g.lat.value;
    $("#g-sst-o").textContent = `${sst} °C`; $("#g-rh-o").textContent = `${rh}%`; $("#g-sh-o").textContent = `${sh} m/s`; $("#g-lat-o").textContent = `${lat}°`;
    const f1 = clamp((sst - 25.5) / 3), f2 = clamp((rh - 40) / 35), f3 = clamp((25 - sh) / 15), f4 = lat < 5 ? lat / 5 * 0.5 : lat > 25 ? clamp((35 - lat) / 10) : 1;
    const pot = f1 * f2 * f3 * f4;
    $("#g-verdict").textContent = pot >= 0.6 ? "Yes: a strong cyclone could form and keep growing." : pot >= 0.3 ? "Maybe: a weak storm could form, but it may struggle." : "Unlikely: a cyclone would not form or would fall apart.";
    $("#g-verdict").className = `g-verdict ${pot >= 0.6 ? "go" : pot >= 0.3 ? "maybe" : "no"}`;
    const why = $("#g-why"); why.textContent = "";
    const item = (good, t) => why.append(el("li", { class: good ? "ok" : "no", text: `${good ? "✓" : "✗"} ${t}` }));
    item(sst >= 26.5, sst >= 26.5 ? "The sea is warm enough to fuel a storm." : "The sea is too cool: below about 26.5 °C there is not enough heat and moisture.");
    item(rh >= 60, rh >= 60 ? "The air is moist enough." : "Dry air would be pulled in and choke the thunderstorms.");
    item(sh <= 12, sh <= 12 ? "Shear is weak, so the storm can stay upright." : "Strong shear tilts the storm and blows its top away.");
    item(lat >= 5 && lat <= 25, lat < 5 ? "Too close to the equator: the Earth's spin cannot start the swirl." : lat > 25 ? "Far from the tropics, the sea usually gets too cool." : "Far enough from the equator for the Earth's spin to start a swirl.");
    // the storm picture: bigger and rounder when conditions are good, tilted by shear
    const svg = $("#g-art"), R = 25 + 70 * pot, tilt = Math.min(60, sh * 1.5), arms = pot > 0.15 ? 3 : 0;
    let h = `<rect x="0" y="180" width="300" height="40" fill="${sst >= 26.5 ? "#2f8fc4" : "#7fa6bf"}" opacity=".6"/>`;
    if (arms) { h += `<g class="g-spin" style="transform-origin:${150 + tilt / 2}px 100px">`;
      for (let k = 0; k < arms; k++) { const a = k * 120; h += `<path d="M${150 + tilt / 2},100 q${R * .6},${-R * .2} ${R},${R * .35}" transform="rotate(${a} ${150 + tilt / 2} 100)" fill="none" stroke="#e8f0f4" stroke-width="${4 + 14 * pot}" stroke-linecap="round" opacity="${.35 + .6 * pot}"/>`; }
      h += `<circle cx="${150 + tilt / 2}" cy="100" r="${pot > 0.6 ? 7 : 3}" fill="${pot > 0.6 ? "#0b2a3c" : "#e8f0f4"}"/></g>`; }
    else h += `<g fill="#c9d6de" opacity=".8"><ellipse cx="120" cy="90" rx="26" ry="12"/><ellipse cx="185" cy="120" rx="20" ry="9"/></g>`;
    svg.innerHTML = h;
  }
  if (g.sst) { for (const i of Object.values(g)) i.addEventListener("input", game);
    const P = { bob: [29.5, 75, 6, 14], arab: [28.5, 70, 30, 15], eq: [29, 80, 5, 1], cold: [24, 60, 8, 20] };
    $$("[data-preset]").forEach((b) => b.addEventListener("click", () => { const v = P[b.dataset.preset]; [g.sst.value, g.rh.value, g.sh.value, g.lat.value] = v; game(); }));
    game(); }

  window.TCGuide = { open, tour, ask };
})();
