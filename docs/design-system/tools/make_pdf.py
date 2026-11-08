"""Converts boards-png/*.png to grayscale (L mode: no colour channel can exist) and writes the consolidated PDF.
usage (repo root): python3 -I docs/design-system/tools/make_pdf.py"""
import glob, os
from PIL import Image
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
fs = sorted(glob.glob(os.path.join(D, "boards-png", "*.png")))
ims = [Image.open(f).convert("L") for f in fs]
for f, im in zip(fs, ims): im.save(f, optimize=True)
ims[0].save(os.path.join(D, "ADIAK_Design_System_1.0.pdf"), save_all=True, append_images=ims[1:], resolution=144)
print(len(ims), "pages")
