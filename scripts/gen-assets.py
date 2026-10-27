"""Erzeugt Icons und og-image aus scripts/assets/*.html (Python Playwright, Chrome). Aufruf: python3 scripts/gen-assets.py"""
import pathlib, struct
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
out = root / "src" / "static"; out.mkdir(parents=True, exist_ok=True)
icon = (root / "scripts/assets/icon.html").as_uri(); og = (root / "scripts/assets/og.html").as_uri()
ICONS = [("favicon-32.png", 32, ""), ("favicon-48.png", 48, ""), ("favicon-96.png", 96, ""), ("apple-touch-icon.png", 180, "&sq=1"), ("icon-192.png", 192, ""), ("icon-512.png", 512, ""), ("icon-512-maskable.png", 512, "&m=1")]
def ico(png, size):
    head = struct.pack("<HHH", 0, 1, 1) + struct.pack("<BBBBHHII", size, size, 0, 0, 1, 32, len(png), 22)
    return head + png
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", args=["--no-sandbox"])
    pg = b.new_page()
    shots = {}
    for name, size, extra in ICONS:
        pg.set_viewport_size({"width": size, "height": size})
        pg.goto(f"{icon}?s={size}{extra}")
        png = pg.screenshot(omit_background=True, clip={"x": 0, "y": 0, "width": size, "height": size})
        (out / name).write_bytes(png); shots[size] = shots.get(size, png)
    (out / "favicon.ico").write_bytes(ico(shots[48], 48))
    pg.set_viewport_size({"width": 1200, "height": 630}); pg.goto(og)
    (out / "og-image.png").write_bytes(pg.screenshot(clip={"x": 0, "y": 0, "width": 1200, "height": 630}))
    b.close()
print("ok")
