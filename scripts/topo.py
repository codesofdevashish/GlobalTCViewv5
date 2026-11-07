"""Land elevation and ocean depth (NOAA ETOPO1, 1 arc-minute) for a box, via NOAA ERDDAP (free, no login).
get(lat_top, lon_left, ny, nx, d=0.1) -> metres on the impact grid (positive land, negative sea), or None."""
import io
import numpy as np
import requests

ERDDAP = "https://coastwatch.pfeg.noaa.gov/erddap/griddap/etopo180.csv"


def _fetch(la0, la1, lo0, lo1, stride, sess):
    q = f"?altitude%5B({la0:.4f}):{stride}:({la1:.4f})%5D%5B({lo0:.4f}):{stride}:({lo1:.4f})%5D"
    r = sess.get(ERDDAP + q, timeout=180); r.raise_for_status()
    a = np.genfromtxt(io.StringIO(r.text), delimiter=",", skip_header=2)
    return a[:, 0], a[:, 1], a[:, 2]


def get(lat_top, lon_left, ny, nx, d=0.1, sess=None):
    sess = sess or requests.Session(); sess.headers.setdefault("User-Agent", "tc3d-site/1.0")
    la0, la1 = lat_top - ny * d, lat_top
    lo0 = ((lon_left + 180) % 360) - 180; lo1 = lo0 + nx * d
    stride = max(1, int(round(d * 60)))
    try:
        parts = [(lo0, min(lo1, 179.98))] + ([(-180.0, lo1 - 360)] if lo1 > 180 else [])
        lat, lon, alt = [], [], []
        for a, b in parts:
            x, y, z = _fetch(max(-89.9, la0), min(89.9, la1), a, b, stride, sess); lat.append(x); lon.append(y); alt.append(z)
        lat, lon, alt = np.concatenate(lat), np.concatenate(lon), np.concatenate(alt)
    except Exception as e:
        print("  elevation (ETOPO1) unavailable:", type(e).__name__, e); return None
    out = np.full((ny, nx), np.nan)
    i = np.clip(((lat_top - lat) / d).astype(int), 0, ny - 1)
    j = np.clip(((((lon - lon_left) % 360)) / d).astype(int), 0, nx - 1)
    out[i, j] = alt
    return out
