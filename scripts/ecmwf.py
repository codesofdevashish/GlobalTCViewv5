"""
ECMWF IFS open data (CC BY 4.0, https://www.ecmwf.int/en/forecasts/datasets/open-data) for the live map, as a second
model beside NOAA GFS. Writes public/data/wx_ecmwf/ in exactly the format of wxfields.py, so the map can switch models.

Only the needed fields are downloaded, using the byte index (.index, one JSON object per field) of each 0.25-degree file:
surface: msl, tcwv, 10u, 10v, tp;  pressure levels 1000-200 hPa: u, v, gh, r, t.  Then sampled to the 1-degree map grid.
Times: the newest 00 or 12 UTC run, at +0, +24 ... +120 h. Sea temperature, waves and currents are not part of this set.
"""
import json, os
import numpy as np
import pandas as pd
import requests
import wxfields as W

ROOTS = ["https://data.ecmwf.int/forecasts", "https://ecmwf-forecasts.s3.eu-central-1.amazonaws.com"]
PL = [1000, 850, 700, 500, 300, 200]


def _decode(msg):
    import eccodes
    h = eccodes.codes_new_from_message(msg)
    try:
        ni, nj = eccodes.codes_get(h, "Ni"), eccodes.codes_get(h, "Nj")
        v = eccodes.codes_get_values(h).reshape(nj, ni).astype("float32")
        if eccodes.codes_get(h, "latitudeOfFirstGridPointInDegrees") < 0: v = v[::-1]
        lon0, d = eccodes.codes_get(h, "longitudeOfFirstGridPointInDegrees"), eccodes.codes_get(h, "iDirectionIncrementInDegrees")
    finally:
        eccodes.codes_release(h)
    if lon0 > 180: lon0 -= 360
    if abs(lon0) > 1e-6: v = np.roll(v, -int(round(-lon0 / d)) % ni, axis=1)   # start the grid at 0 E, like the GFS grid
    k = int(round(1 / d))
    return v[::k, ::k][:W.NY, :W.NX]


def _base(run, step, root):
    return f"{root}/{run:%Y%m%d}/{run:%H}z/ifs/0p25/oper/{run:%Y%m%d%H}0000-{step}h-oper-fc"


def fetch(run, step, want, sess):
    """{(param, levtype, level): 1-degree array} for one forecast step; want is a set of such keys."""
    for root in ROOTS:
        base = _base(run, step, root)
        try:
            r = sess.get(base + ".index", timeout=60)
            if r.status_code != 200: continue
            out = {}
            for line in r.text.splitlines():
                try: e = json.loads(line)
                except ValueError: continue
                key = (e.get("param"), e.get("levtype"), int(e["levelist"]) if e.get("levelist") else None)
                if key in want and key not in out:
                    a, n = int(e["_offset"]), int(e["_length"])
                    g = sess.get(base + ".grib2", headers={"Range": f"bytes={a}-{a + n - 1}"}, timeout=120)
                    if g.status_code in (200, 206): out[key] = _decode(g.content)
            if out: return out
        except Exception as e:
            print(f"  ECMWF: {root.split('/')[2]} step {step}: {type(e).__name__} {e}")
    return {}


def _has(run, step, sess):
    for root in ROOTS:
        try:
            if sess.get(_base(run, step, root) + ".index", timeout=30).status_code == 200: return True
        except Exception:
            pass
    return False


def build(public, sess=None):
    sess = sess or requests.Session(); sess.headers.setdefault("User-Agent", "tc3d-site/1.0")
    out = os.path.join(public, "data", "wx_ecmwf"); os.makedirs(out, exist_ok=True)
    now = pd.Timestamp.now("UTC").tz_localize(None).floor("12h")
    run = next((c for c in [now - pd.Timedelta(hours=12 * k) for k in range(4)] if _has(c, 120, sess)), None)
    if run is None:
        print("::warning::ECMWF: no complete open-data run found"); return None
    print(f"ECMWF: using IFS {run:%Y-%m-%d %H}Z")
    want = {(p, "sfc", None) for p in ("msl", "tcwv", "10u", "10v", "tp", "2t", "2d")} | {(p, "pl", L) for p in ("u", "v", "gh", "r", "t", "w") for L in PL}
    times, prev_tp = [], {}
    for step in range(0, 121, 12):
        try:
            f = fetch(run, step, want, sess)
            if not f: print(f"::warning::ECMWF: no data at +{step} h"); continue
            tp6 = None
            if step:                                                             # 6-hour rain from the accumulated total
                f6 = fetch(run, step - 6, {("tp", "sfc", None)}, sess)
                if ("tp", "sfc", None) in f and ("tp", "sfc", None) in f6: tp6 = np.clip(f[("tp", "sfc", None)] - f6[("tp", "sfc", None)], 0, None) * 1000
            g = lambda k: f.get(k)
            fields = {("PRMSL", "mean sea level"): g(("msl", "sfc", None)), ("PWAT", "entire atmosphere (considered as a single layer)"): g(("tcwv", "sfc", None)),
                      ("UGRD", "10 m above ground"): g(("10u", "sfc", None)), ("VGRD", "10 m above ground"): g(("10v", "sfc", None)), ("APCP", "surface"): tp6}
            t2, d2 = g(("2t", "sfc", None)), g(("2d", "sfc", None))
            if t2 is not None:                                                   # 2 m humidity from the dewpoint (Magnus formula)
                fields[("TMP", "2 m above ground")] = t2
                if d2 is not None:
                    es = lambda T: 6.112 * np.exp(17.67 * (T - 273.15) / (T - 29.65))
                    fields[("RH", "2 m above ground")] = np.clip(100 * es(d2) / es(t2), 0, 100)
            for L in PL:
                for ec, gf in (("u", "UGRD"), ("v", "VGRD"), ("gh", "HGT"), ("r", "RH"), ("t", "TMP"), ("w", "VVEL")): fields[(gf, f"{L} mb")] = g((ec, "pl", L))
            W.write_time({k: v for k, v in fields.items() if v is not None}, len(times), out)
            times.append(dict(time=(run + pd.Timedelta(hours=step)).strftime("%Y-%m-%dT%H:%MZ"), offset_h=step, kind="analysis" if step == 0 else "forecast"))
            print(f"  ECMWF: +{step} h ({len(f)} fields)")
        except Exception as e:
            print(f"::warning::ECMWF: step +{step} h failed ({type(e).__name__}: {e})")
    if not times: return None
    meta = dict(cycle=run.strftime("%Y-%m-%dT%H:%MZ"), times=times, now=0, levels=PL, sfc=W.SFC, lev=W.LEV, grid=dict(ny=W.NY, nx=W.NX, lat0=90, lon0=0, d=1),
                ranges=dict({k: list(v) for k, v in W.RANGES.items()}, **{f"hgt{p}": list(W.HGT_R[p]) for p in PL}, **{f"tmp{p}": list(W.TMP_R[p]) for p in PL}),
                source="ECMWF IFS open data (CC BY 4.0)", model="ECMWF", format="bin-v2")
    json.dump(meta, open(os.path.join(out, "meta.json"), "w"))
    for fn in os.listdir(out):                                                  # remove time steps from an older, longer run
        if fn.startswith("t") and fn.endswith(".bin") and int(fn[1:].split("_")[0]) >= len(times): os.remove(os.path.join(out, fn))
    return meta
