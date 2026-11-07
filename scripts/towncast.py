"""
Five-day forecast for each listed coastal town (free, no key):
  rain and 10 m wind from GFS 1-degree forecasts (6-hourly buckets, +6 to +120 h),
  significant wave height from NOAA GFS-Wave (WaveWatch III, global 0.25 degree) at the nearest sea point.
Writes public/data/towns.json (a few tens of kB). Days are 24-hour periods from the model run.
"""
import json, os
import numpy as np
import pandas as pd
import requests
from wxfields import fetch_messages

HERE = os.path.dirname(__file__)


def towns():
    return json.load(open(os.path.join(HERE, "towns.json")))


def _bil(a, lat, lon, d=1.0, lat0=90.0):
    ny, nx = a.shape; x = (lon % 360) / d; y = (lat0 - lat) / d
    i, j = int(np.floor(x)) % nx, min(ny - 2, max(0, int(np.floor(y)))); fx, fy = x - np.floor(x), y - j
    v = a[j, i] * (1 - fx) * (1 - fy) + a[j, (i + 1) % nx] * fx * (1 - fy) + a[j + 1, i] * (1 - fx) * fy + a[j + 1, (i + 1) % nx] * fx * fy
    return float(v)


def _sea_point(w, lat, lon, d=0.25, maxdeg=1.0):
    """Nearest wave-grid cell with data (sea) within maxdeg of the town."""
    ny, nx = w.shape; best = None; r = int(maxdeg / d)
    j0, i0 = int(round((90 - lat) / d)), int(round((lon % 360) / d))
    for dj in range(-r, r + 1):
        for di in range(-r, r + 1):
            j, i = j0 + dj, (i0 + di) % nx
            if 0 <= j < ny and np.isfinite(w[j, i]):
                dist = np.hypot(dj, di * np.cos(np.deg2rad(lat)))
                if best is None or dist < best[0]: best = (dist, j, i)
    return (best[1], best[2], round(best[0] * d * 111)) if best else None


def build(public, cycle, sess=None):
    sess = sess or requests.Session(); sess.headers.setdefault("User-Agent", "tc3d-site/1.0")
    T = towns(); n = len(T)
    rain = np.zeros((n, 5)); wind = np.zeros((n, 5)); wave = np.full((n, 5), np.nan); seapt = {}; ok = 0
    for fh in range(6, 121, 6):
        day = (fh - 1) // 24
        f = fetch_messages(cycle, fh, [("APCP", "surface", {f"{fh - 6}-{fh} hour acc fcst"}), ("UGRD", "10 m above ground", {f"{fh} hour fcst"}),
                                       ("VGRD", "10 m above ground", {f"{fh} hour fcst"})], sess)
        w = fetch_messages(cycle, fh, [("HTSGW", "surface", {f"{fh} hour fcst"})], sess, product="wave/gridded/gfswave.t{h}z.global.0p25.f{f:03d}.grib2")
        if f: ok += 1
        hs = w.get(("HTSGW", "surface"))
        for k, t in enumerate(T):
            if ("APCP", "surface") in f: rain[k, day] += max(0.0, _bil(f[("APCP", "surface")], t["lat"], t["lon"]))
            if ("UGRD", "10 m above ground") in f:
                s = np.hypot(_bil(f[("UGRD", "10 m above ground")], t["lat"], t["lon"]), _bil(f[("VGRD", "10 m above ground")], t["lat"], t["lon"])) * 3.6
                wind[k, day] = max(wind[k, day], s)
            if hs is not None:
                if k not in seapt: seapt[k] = _sea_point(hs, t["lat"], t["lon"])
                sp = seapt[k]
                if sp: wave[k, day] = np.nanmax([wave[k, day], hs[sp[0], sp[1]]])
    if not ok: print("town forecasts: no GFS forecast files found"); return None
    days = [(pd.Timestamp(cycle) + pd.Timedelta(hours=24 * d)).strftime("%Y-%m-%dT%H:%MZ") for d in range(5)]
    out = dict(cycle=pd.Timestamp(cycle).strftime("%Y-%m-%dT%H:%MZ"), days=days, source="NOAA GFS and GFS-Wave", towns={})
    for k, t in enumerate(T):
        out["towns"][t["name"]] = dict(rain=[round(x, 1) for x in rain[k]], wind=[int(round(x)) for x in wind[k]],
                                       wave=[None if not np.isfinite(x) else round(float(x), 1) for x in wave[k]], wave_km=seapt.get(k, (0, 0, None))[2] if seapt.get(k) else None)
    json.dump(out, open(os.path.join(public, "data", "towns.json"), "w"), separators=(",", ":"))
    print(f"town forecasts: {n} towns, {ok} of 20 forecast steps")
    return out
