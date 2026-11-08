"""Fail if any pixel in the given PNGs carries hue: max(|R-G|,|G-B|,|R-B|) > TOL.
usage: python3 -I hue_scan.py <png>...   (TOL 3 allows rounding in anti-aliasing)"""
import sys
from PIL import Image
TOL = 3
bad = 0
for f in sys.argv[1:]:
    im = Image.open(f).convert("RGB")
    r, g, b = im.split()
    from PIL import ImageChops
    d = ImageChops.lighter(ImageChops.lighter(ImageChops.difference(r, g), ImageChops.difference(g, b)), ImageChops.difference(r, b))
    hist = d.histogram()
    n = sum(hist[TOL + 1:]); mx = max(i for i, c in enumerate(hist) if c)
    box = d.point(lambda v: 255 if v > TOL else 0).getbbox()
    print(f"{f.split('/')[-1]:>12}  max-chroma={mx:3d}  coloured-px={n:7d}  {'OK' if n == 0 else 'FAIL bbox=' + str(box)}")
    bad += n > 0
sys.exit(1 if bad else 0)
