"""Forecast verification: keep every GEFS-mean and GFS forecast made for a storm and score it against the
official track once the forecast time has passed. Track error (km, great circle) and intensity error (kt)
by lead time. One small JSON per storm, carried from day to day through the live site."""
import numpy as np
import pandas as pd

LEADS = [24, 48, 72, 96, 120]


def _km(a, b):
    p = np.deg2rad
    return float(6371 * 2 * np.arcsin(np.sqrt(np.sin(p(b[0] - a[0]) / 2) ** 2 + np.cos(p(a[0])) * np.cos(p(b[0])) * np.sin(p((b[1] - a[1] + 540) % 360 - 180) / 2) ** 2)))


def _official(track, t):
    """Official position and intensity at time t from the storm's track [[iso, lat, lon, kt], ...] (None outside it)."""
    ts = pd.to_datetime([r[0].replace("Z", "") for r in track]).values.astype("datetime64[s]").astype("int64")
    x = pd.Timestamp(t).value // 10**9
    if not len(ts) or x < ts[0] or x > ts[-1]: return None
    lat = np.interp(x, ts, [r[1] for r in track]); lon = np.rad2deg(np.unwrap(np.deg2rad([r[2] for r in track])))
    return float(lat), float(np.interp(x, ts, lon)), float(np.interp(x, ts, [r[3] for r in track]))


def update(prev, fc, track):
    """prev: last verify dict (or None); fc: today's forecast dict from forecast.for_storm (or None); track: official track."""
    v = prev or {"forecasts": []}
    if fc and not any(f["cycle"] == fc["cycle"] for f in v["forecasts"]):
        keep = lambda tr: [p for p in (tr or []) if p[0] in LEADS]
        v["forecasts"].append(dict(cycle=fc["cycle"], mean=keep(fc.get("mean")), gfs=keep(fc.get("gfs"))))
        v["forecasts"] = v["forecasts"][-40:]
    rows = {m: {L: [] for L in LEADS} for m in ("mean", "gfs")}
    for f in v["forecasts"]:
        t0 = pd.Timestamp(f["cycle"].replace("Z", ""))
        for m in ("mean", "gfs"):
            for tau, la, lo, kt in f.get(m) or []:
                ob = _official(track, t0 + pd.Timedelta(hours=tau))
                if ob: rows[m][tau].append((_km((la, lo), ob[:2]), kt - ob[2]))
    v["errors"] = {m: {str(L): (dict(n=len(r), track_km=int(np.mean([x[0] for x in r])), wind_bias_kt=round(float(np.mean([x[1] for x in r])), 1),
                                     wind_mae_kt=round(float(np.mean([abs(x[1]) for x in r])), 1)) if r else dict(n=0)) for L, r in rows[m].items()}
                   for m in rows}
    return v


def season(all_v):
    """Combine the errors of many storms (weighted by the number of verified forecasts)."""
    out = {}
    for m in ("mean", "gfs"):
        out[m] = {}
        for L in LEADS:
            n = tk = wb = wm = 0
            for v in all_v:
                e = (v.get("errors") or {}).get(m, {}).get(str(L), {})
                if e.get("n"): n += e["n"]; tk += e["track_km"] * e["n"]; wb += e["wind_bias_kt"] * e["n"]; wm += e["wind_mae_kt"] * e["n"]
            out[m][str(L)] = dict(n=n, track_km=int(tk / n), wind_bias_kt=round(wb / n, 1), wind_mae_kt=round(wm / n, 1)) if n else dict(n=0)
    return out
