# GlobalTCView

Every tropical cyclone on Earth, explained for the people who live with them and the scientists who study them.

- **Today**: a plain-language summary of active storms (wind in km/h, where they are relative to the nearest
  coastal town, how they move), a check of whether a storm may come near your town in the next five days
  (from the GEFS ensemble mean; your place stays in your browser), and preparedness guidance.
- **Live map** (3D globe or flat map): the atmosphere from the GFS 1-degree analysis (`scripts/wxfields.py`). In 3D the
  streamlines fly at the altitude of the chosen level, and "All heights at once" stacks every level as a 3D vortex. Animated wind
  streamlines, coloured by speed (with colour bars), at 1000 (10 m), 850, 700, 500, 300 or 200 hPa; colour by wind speed, total-column water vapour,
  relative humidity or sea surface temperature (with the 26.5 degree line); isobars or geopotential height with
  highs and lows; clickable teaching overlays for the Hadley, Ferrel and polar cells (with the ITCZ found from
  today's water vapour), the Walker circulation and the Nino 3.4 and Indian Ocean Dipole regions. Click anywhere
  to read the values there.
- **Storm analysis**: the research dashboard (3D flow, environment, forecast, history, impact).
- **Learn**: short explanations with diagrams, each linked to the live map.

# Tropical cyclones in 3D, updated daily

A GitHub Pages site that shows a 3D flow animation for every active tropical cyclone on Earth,
rebuilt every morning by GitHub Actions. It also serves as a portfolio page (edit `site/config.js`).

**What happens each day** (`.github/workflows/update.yml`, 06:40 UTC)

1. `scripts/storms.py` reads NCEP TCVitals from the last 8 days of GFS cycles. TCVitals carries the
   operational position and intensity of every active storm (NHC, CPHC, JTWC, ...), so this covers
   all basins and gives each storm's official track. Invest areas (90–99) are skipped.
2. `scripts/run_daily.py` downloads GFS 0.25° analyses (u, v, omega, vorticity, 900–500 hPa) for each
   storm's region, renders the video with `tc3d/render.py`, and deletes the data and frames at once.
3. Videos of storms that have ended are copied forward from the live site into the archive.
4. Only `public/` (web page, MP4s, posters, `storms.json`) is uploaded to GitHub Pages.
   No data or video is ever committed to the repository.

## The website: a single-screen dashboard

- **Storms (left)**: active storms with intensity sparklines and basin filters, pinned storms, and
  storms that recently ended.
- **Stage (centre)**, five views: a high-resolution **globe** (CesiumJS streaming NASA GIBS tiles: VIIRS true
  colour of the chosen day at 250 m or Blue Marble at 500 m, real sunlight; falls back to a three.js globe), the **3D flow** video, a **track map**, and **compare** (two videos side by side).
- **Shared timeline (bottom)**: storm lifespans, official intensity, rapid-intensification periods and
  the 3D video window. One playhead drives everything: storm positions on the globe, the video
  frame, the map, and every number in the inspector. Play, step an hour, change speed.
- **Inspector (right)**: wind, 24-hour change, motion, pressure, deep and mid-level shear, humidity,
  SST, tilt and radius of maximum wind at the playhead's hour, each with a sparkline; a live
  checklist of conditions often linked to rapid intensification; the written summary; downloads and a
  NASA Worldview link for the same hour.
- **Search** (Ctrl K), **pins**, deep links (`#storm=2026_17E&view=flow`), keyboard shortcuts
  (space, ← →, [ ], 1–4), and drawers for the season summary, archive, guide and About.

## Impact layer (hazard × exposure × vulnerability)

For every storm the daily job also builds an indicative impact layer on a 0.1° grid
(`scripts/impact.py`), shown in the dashboard's **Impact** view and the inspector:

- **Hazard**: Holland (1980) wind profile driven by the official track (TCVitals Vmax, central and
  environmental pressure, radius of maximum wind), plus 0.55 × forward motion; the footprint is the
  highest wind each cell sees, and it grows with the shared timeline.
- **Exposure**: GHSL GHS-POP 2025 population (EU JRC); economic value = population × GDP per capita
  (PPP, World Bank), the population-weighted form of LitPop.
- **Vulnerability**: country-level index from World Bank GDP per capita, under-5 mortality and
  access to electricity (first version; a gridded index such as GRDI can replace it).
- **Rain**: GFS 0–6 h accumulations from each cycle, counted within 500 km of the storm centre;
  storm-total and largest 24-hour rain (IMD classes), with people under very heavy and extremely heavy rain.
- **Risk index**: 100 × max(wind hazard, rain hazard) × exposure × vulnerability, in five classes. Wind, rain and risk
  are stored every 6 hours, so they follow the dashboard's timeline.
  Relative and indicative: no money damage is estimated, and storm surge is not modelled.

`scripts/fetch_exposure.py` downloads and prepares the exposure data once (about 450 MB from GHSL,
then about 40 MB cached by the workflow). If that step fails, the site still builds without the
Impact view.

## Notes

- Rapid intensification is flagged only from the official intensities (increase of at least
  30 kt in 24 h), never from GFS winds.
- Southern Hemisphere storms are handled (vorticity sign flipped), and so are storms crossing 180°.
- GitHub Pages sites are limited to about 1 GB; each video is roughly 5–15 MB, which is why the
  archive is capped.
- This is a research visualisation, not a forecast.

The site has light and dark themes (toggle in the top bar). Archived storms without an impact layer get one computed from their saved track (up to 20 a day).

## Forecasts, history and climate (all free, no login)

- **Forecast** (inspector tab, track map, globe): GEFS ensemble members, ensemble mean and GFS from NCEP's
  cyclone tracker on NOMADS (`scripts/forecast.py`), with links to each basin's official agency. Model guidance only.
- **History** (inspector tab, track map): IBTrACS v04r01 since 1980 (`scripts/context.py`): storms that passed near
  the current position at this time of year, how strong they became, and the closest analogs.
- **Season vs normal and climate state** (Season panel, storm list): named storms and ACE vs 1991-2020 to the same
  date; ENSO (NOAA CPC ONI), IOD (NOAA PSL DMI), MJO (Australian Bureau of Meteorology RMM) (`scripts/extras.py`).
- **Infrared** on the globe: Himawari or GOES clean-IR band from NASA GIBS (no free layer covers the western Indian Ocean).
- **RSS feed** (`feed.xml`), **CSV downloads** of every track and hourly diagnostics, and a **glossary**.

## Languages

`site/i18n.js` holds the translations: static text is marked with `data-i18n` in `index.html`, and generated sentences
(headlines, storm rows, the location check, map readouts) use templates, so each language keeps its own word order.
English and Hindi are included. To add a language (for example Bengali, Odia, Tamil or Telugu), copy the `hi` block,
translate every value, and add the language to `LANGS` (and its Google font to `FONTS` if it uses another script).
Safety and warning text should be checked by a native speaker.

## Town forecasts, storm surge, verification, RI guidance, time steps

- **Town forecasts** (`scripts/towncast.py`, `scripts/towns.json`): five days of rain (IMD daily classes), strongest wind and
  sea state (NOAA GFS-Wave significant wave height at the nearest sea point, WMO sea-state terms) with small-boat advice,
  for 74 cyclone-prone coastal towns. One small file, `data/towns.json`.
- **Storm surge index** (`scripts/topo.py`, `impact.surge_index`): wind over the nearby sea squared x shallow-shelf factor x
  low-elevation factor, on coastal land, from NOAA ETOPO1 via ERDDAP. Relative and indicative, not a surge height.
- **Forecast verification** (`scripts/verify.py`): every GEFS-mean and GFS forecast is kept and scored against the official
  track; errors by lead time for each storm (Forecast tab) and for the season (Season panel).
- **RI guidance** (`context.ri_train`, `context.ri_guidance`): logistic model trained weekly on IBTrACS (intensity, 12-hour
  change, latitude, forward speed, distance to land, North Indian Ocean), shown with each factor's contribution. Experimental.
- **Live map time steps**: 2 days ago, yesterday, now and +1 to +5 days, as compact binary files (about 20 MB in all), with
  temperature, vorticity, 850-200 hPa shear, CAPE and 6-hour rain added to the colour layers.

All of this uses free, keyless sources and stays well within GitHub's free limits for public repositories.

Place names (Natural Earth populated places, with Hindi names) appear by importance as you zoom, without overlapping; coastlines sharpen from 1:110m to 1:50m to 1:10m on the flat map, and are drawn as vector lines on the 3D globe.

## Tests, licence and citation

- `pytest -q` runs the tests of the scientific core (forecast verification, storm-surge index, RI guidance,
  weather-file encoding, land mask); they also run on GitHub for every push (`.github/workflows/tests.yml`).
- Code: MIT licence (`LICENSE`). Data keep their providers' terms.
- To cite the software, use `CITATION.cff` (GitHub shows a "Cite this repository" button).
- Map settings can be linked directly, for example `#map?view=2d&layer=sst&level=1000&ov=cells&t=24&lon=85&lat=12&z=1.6`
  (the "Copy a link to this view" button on the live map writes them for you).
