"""
Global weather fields for the live map (GFS 1-degree, NOAA, free, no key), over 8 times:
  2 days ago, yesterday (analyses), now (analysis), +1 .. +5 days (forecasts from the latest cycle).

Only the needed messages are fetched with the .idx byte index (NOMADS, then the NOAA AWS mirror).
Files (one byte per grid point; value = lo + b/254 * (hi - lo); 255 = missing; fixed ranges so time steps compare):
  public/data/wx/meta.json          times, levels, field lists and ranges
  public/data/wx/t<i>_sfc.bin       mslp, pwat, sst, u10, v10, cape, rain6 (6-hour rain; forecasts only)
  public/data/wx/t<i>_l<p>.bin      u, v, hgt, rh, tmp at p hPa
Grid: 181 x 360, row 0 = 90 N, column 0 = 0 E. About 2.5 MB per time step, 20 MB in all.
"""
import json, os
import numpy as np
import pandas as pd
import requests

LEVELS = [1000, 850, 700, 500, 300, 200]
SOURCES = ["https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod", "https://noaa-gfs-bdp-pds.s3.amazonaws.com"]
NY, NX = 181, 360
SFC = ["mslp", "pwat", "sst", "u10", "v10", "cape", "rain6", "hs", "wu", "wv", "cu", "cv"]
LEV = ["u", "v", "hgt", "rh", "tmp"]
HGT_R = {1000: (-500, 500), 850: (900, 1700), 700: (2300, 3300), 500: (4600, 6000), 300: (8000, 9900), 200: (10400, 12700)}
TMP_R = {1000: (-50, 45), 850: (-50, 35), 700: (-50, 25), 500: (-60, 5), 300: (-75, -15), 200: (-80, -30)}
RANGES = dict(mslp=(940, 1060), pwat=(0, 80), sst=(-2, 34), u10=(-40, 40), v10=(-40, 40), cape=(0, 5000), rain6=(0, 100), u=(-100, 100), v=(-100, 100), rh=(0, 100),
              hs=(0, 15), wu=(-1, 1), wv=(-1, 1), cu=(-2.5, 2.5), cv=(-2.5, 2.5))
RTOFS = "https://coastwatch.pfeg.noaa.gov/erddap/griddap/ncepRtofsG2DFore3hrlyProg.csv"


def waves(cycle, fh, sess):
    """Significant wave height (m) and the direction waves travel (unit vector) on the 1-degree grid, from GFS-Wave 0.25 degree."""
    kind = {"anl"} if fh == 0 else {f"{fh} hour fcst"}
    f = fetch_messages(cycle, fh, [("HTSGW", "surface", kind), ("DIRPW", "surface", kind)], sess, product="wave/gridded/gfswave.t{h}z.global.0p25.f{f:03d}.grib2")
    hs, dp = f.get(("HTSGW", "surface")), f.get(("DIRPW", "surface"))
    if hs is None or hs.shape != (721, 1440): return None
    def block(a):                                                   # 0.25 -> 1 degree cell means, ignoring land
        a = a[:720].reshape(180, 4, 360, 4); return np.nanmean(a, axis=(1, 3))
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        H = np.vstack([block(hs), hs[720:721, ::4]])
        if dp is not None and dp.shape == hs.shape:
            r = np.deg2rad(dp); U, V = block(-np.sin(r)), block(-np.cos(r))          # DIRPW: where waves come from; travel is opposite
            n = np.hypot(U, V); U, V = U / np.where(n > 0, n, 1), V / np.where(n > 0, n, 1)
            U = np.vstack([U, np.full((1, 360), np.nan)]); V = np.vstack([V, np.full((1, 360), np.nan)])
        else:
            U = V = np.full((NY, NX), np.nan)
    return H, U, V


def currents(sess):
    """Daily surface currents (m/s) from NOAA RTOFS (latest run, via ERDDAP), as {time: (u, v)} on the 1-degree grid."""
    try:
        sub = "%5B0:8:63%5D%5B0%5D%5B(-78):12:(89.9)%5D%5B(74.2):12:(434.0)%5D"           # every 24 h (3-hourly steps), surface, ~1 degree
        r = sess.get(f"{RTOFS}?u_velocity{sub},v_velocity{sub}", timeout=300); r.raise_for_status()
        import io
        df = pd.read_csv(io.StringIO(r.text), skiprows=[1])
    except Exception as e:
        print("  ocean currents unavailable:", type(e).__name__, e); return {}
    out = {}
    for tm, g in df.groupby("time"):
        U, V, N = np.zeros((NY, NX)), np.zeros((NY, NX)), np.zeros((NY, NX))
        g = g.dropna(subset=["u_velocity", "v_velocity"]); g = g[(g.u_velocity.abs() < 10) & (g.v_velocity.abs() < 10)]
        j = np.clip(np.round(90 - g.latitude.values).astype(int), 0, NY - 1); i = np.round(g.longitude.values % 360).astype(int) % NX
        np.add.at(U, (j, i), g.u_velocity.values); np.add.at(V, (j, i), g.v_velocity.values); np.add.at(N, (j, i), 1)
        with np.errstate(invalid="ignore", divide="ignore"): out[pd.Timestamp(tm.replace("Z", ""))] = (np.where(N > 0, U / N, np.nan), np.where(N > 0, V / N, np.nan))
    print(f"  ocean currents: {len(out)} daily fields from RTOFS")
    return out


def _decode(msg):
    import eccodes
    h = eccodes.codes_new_from_message(msg)
    try:
        ni, nj = eccodes.codes_get(h, "Ni"), eccodes.codes_get(h, "Nj")
        v = eccodes.codes_get_values(h).reshape(nj, ni).astype("float32")
        v[v >= 9.0e20] = np.nan; v[np.abs(v - 9999) < 1e-3] = np.nan
        if eccodes.codes_get(h, "latitudeOfFirstGridPointInDegrees") < 0: v = v[::-1]
        return v
    finally:
        eccodes.codes_release(h)


def fetch_messages(cycle, fh, want, sess, product="atmos/gfs.t{h}z.pgrb2.1p00.f{f:03d}"):
    """{(var, level, kind): array} for one file. want: list of (var, level, kinds) with kinds a set of idx descriptions."""
    d, h = f"{cycle:%Y%m%d}", f"{cycle:%H}"
    rel = product.format(h=h, f=fh)
    for base in SOURCES:
        url = f"{base}/gfs.{d}/{h}/{rel}"
        try:
            r = sess.get(url + ".idx", timeout=60)
            if r.status_code != 200: continue
            lines = [l.split(":") for l in r.text.strip().splitlines()]
            out = {}
            for i, l in enumerate(lines):
                if len(l) < 6: continue
                for var, lev, kinds in want:
                    if l[3] == var and l[4] == lev and l[5] in kinds and (var, lev) not in out:
                        end = int(lines[i + 1][1]) - 1 if i + 1 < len(lines) else ""
                        g = sess.get(url, headers={"Range": f"bytes={l[1]}-{end}"}, timeout=120)
                        if g.status_code in (200, 206): out[(var, lev)] = _decode(g.content)
            if out: return out
        except Exception as e:
            print("  weather fields:", type(e).__name__, e)
    return {}


def _q(a, lo, hi, mask=None):
    a = np.asarray(a, "float64"); good = np.isfinite(a) if mask is None else (np.isfinite(a) & ~mask)
    q = np.clip(np.round((a - lo) / (hi - lo) * 254), 0, 254); q[~good] = 255
    return q.astype(np.uint8).tobytes()


def write_time(fields, i, out):
    F = fields.get
    land = F(("LAND", "surface")); land = (land > 0.5) if land is not None else np.zeros((NY, NX), bool)
    miss = np.full((NY, NX), np.nan)
    def g(k): v = F(k); return v if v is not None and v.shape == (NY, NX) else miss
    sfc = dict(mslp=g(("PRMSL", "mean sea level")) / 100, pwat=g(("PWAT", "entire atmosphere (considered as a single layer)")),
               sst=g(("TMP", "surface")) - 273.15, u10=g(("UGRD", "10 m above ground")), v10=g(("VGRD", "10 m above ground")),
               cape=g(("CAPE", "surface")), rain6=g(("APCP", "surface")))
    w = fields.get("_waves"); c = fields.get("_currents")
    sfc.update(hs=w[0] if w else miss, wu=w[1] if w else miss, wv=w[2] if w else miss, cu=c[0] if c else miss, cv=c[1] if c else miss)
    blob = b"".join(_q(sfc[k], *RANGES[k], mask=(land | (sfc["sst"] < -2.5)) if k == "sst" else None) for k in SFC)
    open(os.path.join(out, f"t{i}_sfc.bin"), "wb").write(blob)
    for p in LEVELS:
        lv = dict(u=g(("UGRD", f"{p} mb")), v=g(("VGRD", f"{p} mb")), hgt=g(("HGT", f"{p} mb")), rh=g(("RH", f"{p} mb")), tmp=g(("TMP", f"{p} mb")) - 273.15)
        rng = dict(RANGES, hgt=HGT_R[p], tmp=TMP_R[p])
        open(os.path.join(out, f"t{i}_l{p}.bin"), "wb").write(b"".join(_q(lv[k], *rng[k]) for k in LEV))
    return int(np.isfinite(sfc["mslp"]).any())


def build(public, latest=None, sess=None):
    sess = sess or requests.Session(); sess.headers.setdefault("User-Agent", "tc3d-site/1.0")
    out = os.path.join(public, "data", "wx"); os.makedirs(out, exist_ok=True)
    now = pd.Timestamp(latest) if latest is not None else (pd.Timestamp.now("UTC").tz_localize(None) - pd.Timedelta(hours=5)).floor("6h")
    inst = lambda fh: {"anl"} if fh == 0 else {f"{fh} hour fcst"}
    def want(fh):
        w = [(v, f"{p} mb", inst(fh)) for p in LEVELS for v in ("UGRD", "VGRD", "HGT", "RH", "TMP")]
        w += [(v, l, inst(fh)) for v, l in [("PRMSL", "mean sea level"), ("PWAT", "entire atmosphere (considered as a single layer)"), ("TMP", "surface"),
                                            ("LAND", "surface"), ("UGRD", "10 m above ground"), ("VGRD", "10 m above ground"), ("CAPE", "surface")]]
        if fh: w.append(("APCP", "surface", {f"{fh - 6}-{fh} hour acc fcst"}))
        return w
    times = []
    for cyc0 in [now - pd.Timedelta(hours=6 * k) for k in range(3)]:            # newest cycle whose analysis exists
        f0 = fetch_messages(cyc0, 0, want(0), sess)
        if f0: break
    else:
        print("weather fields: no GFS 1-degree analysis found"); return None
    CUR = currents(sess)
    plan = [(-48, cyc0 - pd.Timedelta(hours=48), 0), (-24, cyc0 - pd.Timedelta(hours=24), 0), (0, cyc0, 0)] + [(fh, cyc0, fh) for fh in (24, 48, 72, 96, 120)]
    for i, (off, cyc, fh) in enumerate(plan):
        f = f0 if off == 0 else fetch_messages(cyc, fh, want(fh), sess)
        if not f: continue
        f = dict(f); f["_waves"] = waves(cyc, fh, sess)
        valid = cyc + pd.Timedelta(hours=fh)
        if CUR:                                                                 # the nearest daily current field, within 12 h
            tn = min(CUR, key=lambda x: abs(x - valid))
            if abs(tn - valid) <= pd.Timedelta(hours=12): f["_currents"] = CUR[tn]
        write_time(f, len(times), out)
        times.append(dict(time=(cyc + pd.Timedelta(hours=fh)).strftime("%Y-%m-%dT%H:%MZ"), offset_h=off, kind="analysis" if fh == 0 else "forecast"))
        print(f"  weather fields: {'analysis' if fh == 0 else 'forecast'} {off:+d} h ({len(f)} messages)")
    meta = dict(cycle=cyc0.strftime("%Y-%m-%dT%H:%MZ"), times=times, now=[t["offset_h"] for t in times].index(0) if any(t["offset_h"] == 0 for t in times) else 0,
                levels=LEVELS, sfc=SFC, lev=LEV, grid=dict(ny=NY, nx=NX, lat0=90, lon0=0, d=1),
                ranges=dict({k: list(v) for k, v in RANGES.items()}, **{f"hgt{p}": list(HGT_R[p]) for p in LEVELS}, **{f"tmp{p}": list(TMP_R[p]) for p in LEVELS}),
                source="NOAA GFS 1-degree analyses and forecasts", format="bin-v2")
    json.dump(meta, open(os.path.join(out, "meta.json"), "w"))
    for f in os.listdir(out):                                                   # remove files from the older format
        if f.endswith(".json") and f != "meta.json": os.remove(os.path.join(out, f))
    return meta
