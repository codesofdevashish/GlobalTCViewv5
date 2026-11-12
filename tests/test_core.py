"""Tests of the scientific core: forecast verification, storm-surge index, RI guidance, weather-file encoding, land mask."""
import os, sys
import numpy as np, pandas as pd
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
import verify as V, impact as I, context as C, wxfields as W


def _track():
    t = pd.date_range("2026-10-20", periods=25, freq="6h")
    return [[x.strftime("%Y-%m-%dT%H:%MZ"), 14 + 0.3 * i, 88 - 0.15 * i, 40 + 3 * i] for i, x in enumerate(t)]


def test_verification_track_and_intensity_error():
    tr, v = _track(), None
    for d in range(3):
        c = pd.Timestamp("2026-10-20") + pd.Timedelta(days=d)
        fc = dict(cycle=c.strftime("%Y-%m-%dT%H:%MZ"), gfs=None,
                  mean=[[L, 14 + 0.3 * (4 * d + L / 6), 88 - 0.15 * (4 * d + L / 6) + 0.5, 40 + 3 * (4 * d + L / 6) - 5] for L in (24, 48, 72, 96, 120)])
        v = V.update(v, fc, tr)
    e = v["errors"]["mean"]["48"]
    assert e["n"] == 3 and 45 <= e["track_km"] <= 60          # 0.5 degree of longitude near 16-18 N
    assert e["wind_bias_kt"] == -5.0 and e["wind_mae_kt"] == 5.0
    assert v["errors"]["mean"]["120"]["n"] == 2                 # the last forecast's 120 h is past the track's end


def test_surge_index_prefers_shallow_low_coast():
    ny = nx = 120
    lat = 26 - (np.arange(ny) + .5) * .1; lon = 80 + (np.arange(nx) + .5) * .1; LON, LAT = np.meshgrid(lon, lat)
    elev = np.where(LON < 86.0, 2 + (86.0 - LON) * 25, -(LON - 86.0) * np.where(LAT > 21, 12, 250))
    wmax = 55 * np.exp(-((LAT - 21.5) ** 2 + (LON - 86.2) ** 2) / 2) + 55 * np.exp(-((LAT - 19.0) ** 2 + (LON - 86.2) ** 2) / 2)
    S = I.surge_index(wmax, elev)
    assert S[45, 59] > 3 * S[70, 59]                          # shallow shelf >> steep shelf, same wind
    assert S[45, 49] == 0                                     # higher ground inland
    assert (S[elev < 0] == 0).all()                           # only land cells carry the index
    assert 0 <= S.min() and S.max() <= 100


def test_ri_guidance_directions():
    model = dict(feats=["v0", "dv12", "abslat", "speed", "land", "ni"], labels=["a", "b", "c", "d", "e", "f"],
                 mean=[60, 5, 15, 15, 2.5, 0.2], std=[25, 8, 6, 8, 0.6, 0.4], intercept=-2.5, coef=[0.2, 0.9, -0.2, -0.1, 0.5, 0.0],
                 base_rate=0.08, n=1000, auc=0.8)
    fast = C.ri_guidance(model, 70, 20, 14, 12, 800, "B")["p"]
    slow = C.ri_guidance(model, 70, 0, 14, 12, 800, "B")["p"]
    near = C.ri_guidance(model, 70, 20, 14, 12, 10, "B")["p"]
    assert fast > slow and fast > near and 0 < near < 1


def test_weather_file_quantisation_round_trip():
    a = np.array([[-40.0, 0.0, 39.9, np.nan]])
    q = np.frombuffer(W._q(a, -40, 40), np.uint8)
    back = -40 + q[:3] / 254 * 80
    assert q[3] == 255 and np.allclose(back, a[0, :3], atol=80 / 254)


def test_static_land_mask():
    m = W.STATIC_LAND
    assert m.shape == (181, 360) and m[90 - 22, 88] and not m[90 - 15, 88] and not m[90, 200]
