"""E2E mit Python Playwright gegen den lokalen Server (node scripts/serve.mjs). Aufruf: python3 tests/e2e.py [extra-dir]"""
import sys, json, pathlib, re
from playwright.sync_api import sync_playwright
BASE = "http://localhost:8777/cda-viewer/"
SHOTS = pathlib.Path("/workspace/work-hl7/shots"); SHOTS.mkdir(exist_ok=True, parents=True)
EXTRA = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/workspace/work-hl7/e2e-extra")
SAMPLES = ["de-arztbrief-entlassbrief", "de-arztbrief-facharzt-level3", "hl7-ccda-ccd", "hl7-ccda-discharge-summary", "hl7-ccda-consultation-note"]
PAGES = ["", "cda-datei-oeffnen/", "cda-arztbrief-lesen/", "was-ist-cda/", "quellen/", "datenschutz/", "nichtda/"]
fails = []; log = []
def ok(c, m):
    (log if c else fails).append(("OK  " if c else "FAIL ") + m); print(("OK  " if c else "FAIL ") + m)

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", args=["--no-sandbox"])
    for w, h in [(320, 700), (360, 740), (1280, 800)]:
        ctx = b.new_context(viewport={"width": w, "height": h}); pg = ctx.new_page()
        msgs = []
        pg.on("console", lambda m: msgs.append(m.text) if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: msgs.append("pageerror " + str(e)))
        pg.on("requestfailed", lambda r: msgs.append("requestfailed " + r.url))
        for path in PAGES:
            pg.goto(BASE + path); pg.wait_for_load_state("networkidle")
            sw = pg.evaluate("document.documentElement.scrollWidth"); ok(sw <= w, f"{w}px /{path} kein Überlauf (scrollWidth {sw})")
            if w <= 360 and path in ("", "was-ist-cda/"):
                vis = pg.is_visible("#menu-btn"); ok(vis, f"{w}px Hamburger sichtbar")
                pg.click("#menu-btn"); ok(pg.is_visible("#site-nav a"), "Menü öffnet"); pg.screenshot(path=str(SHOTS / f"cda-menu-{w}.png")); pg.click("#menu-btn")
            if w == 1280: ok(not pg.is_visible("#menu-btn"), "Desktop: kein Hamburger")
            name = path.strip("/") or "start"
            pg.screenshot(path=str(SHOTS / f"cda-{name}-{w}.png"), full_page=(w != 1280 or True))
        # Viewer
        pg.goto(BASE); pg.wait_for_load_state("networkidle")
        for sid in SAMPLES:
            pg.goto(BASE + "#beispiel=" + sid); pg.reload(); pg.wait_for_function("window.__cdaReady === true", timeout=10000)
            pg.wait_for_selector("#output .doc, #output .hcard", timeout=10000)
            txt = pg.inner_text("#output"); ok(len(txt) > 200, f"{w}px Beispiel {sid} gerendert ({len(txt)} Zeichen)")
            sw = pg.evaluate("document.documentElement.scrollWidth"); ok(sw <= w, f"{w}px Beispiel {sid} kein Überlauf ({sw})")
            if w == 1280 or sid in ("de-arztbrief-facharzt-level3",):
                for mode in ["data", "raw", "doc"]:
                    pg.click(f'#viewbar [data-mode={mode}]'); pg.wait_for_timeout(100)
                    t = pg.inner_text("#output"); ok(len(t) > 50, f"{w}px {sid} Ansicht {mode} ({len(t)} Zeichen)")
                    if mode == "raw": ok("ClinicalDocument" in t, f"{sid} Roh-XML enthält ClinicalDocument")
                    sw = pg.evaluate("document.documentElement.scrollWidth"); ok(sw <= w, f"{w}px {sid} {mode} kein Überlauf ({sw})")
                    if w == 1280 and sid in ("de-arztbrief-facharzt-level3", "hl7-ccda-ccd") : pg.screenshot(path=str(SHOTS / f"cda-viewer-{sid}-{mode}-{w}.png"), full_page=True)
            elif w < 1280:
                pg.screenshot(path=str(SHOTS / f"cda-viewer-{sid}-{w}.png"))
        # Dateiupload, Fremddateien
        for f in ["Referral_Note.xml", "Care_Plan.xml"]:
            pg.goto(BASE); pg.wait_for_load_state("networkidle")
            pg.set_input_files("#file", str(EXTRA / f)); pg.wait_for_selector("#output .hcard", timeout=10000)
            ok(len(pg.inner_text("#output")) > 500, f"{w}px Fremddatei {f} geladen: {pg.inner_text('#status')[:60]}")
            ok(pg.evaluate("document.documentElement.scrollWidth") <= w, f"{w}px Fremddatei {f} kein Überlauf")
        # Fehlerfälle
        for f, expect in [("x-broken.xml", "wohlgeformt"), ("x-doctype.xml", "DOCTYPE"), ("x-nocda.xml", "Kein CDA-Dokument")]:
            pg.goto(BASE); pg.wait_for_load_state("networkidle")
            pg.set_input_files("#file", str(EXTRA / f)); pg.wait_for_timeout(400)
            t = pg.inner_text("#status") + pg.inner_text("#output"); ok(expect in t, f"{w}px Fehlerfall {f}: «{t.strip()[:90]}»")
        # XSS
        pg.goto(BASE); pg.wait_for_load_state("networkidle")
        pg.set_input_files("#file", str(EXTRA / "x-script-injection.xml")); pg.wait_for_selector("#output .hcard", timeout=5000)
        html = pg.inner_html("#output")
        ok(pg.evaluate("window.__pwned") is None, "XSS: window.__pwned nicht gesetzt")
        bad = pg.evaluate("""()=>{const o=document.querySelector('#output');const r=[];o.querySelectorAll('*').forEach(e=>{if(e.tagName==='SCRIPT')r.push('script');for(const a of e.attributes){if(/^on/i.test(a.name))r.push('attr '+a.name);if(/javascript:/i.test(a.value))r.push('js url')}});return r}""")
        ok(not bad, f"XSS: kein script/Handler/javascript: im DOM {bad}")
        ok(pg.locator("#output img").count() == 0, "XSS: kein img im Output")
        ok('rel="noopener noreferrer nofollow"' in html, "XSS: externer Link mit rel")
        if w == 1280: pg.screenshot(path=str(SHOTS / "cda-viewer-xss-test-1280.png"), full_page=True)
        # Einfügen
        pg.goto(BASE); pg.wait_for_load_state("networkidle")
        pg.evaluate("document.querySelector('details.paste').open=true"); pg.fill("#paste", (EXTRA / "x-script-injection.xml").read_text()); pg.click("#paste-go"); pg.wait_for_selector("#output .hcard", timeout=5000); ok(True, "Einfügen funktioniert")
        pg.click("#paste-clear"); pg.wait_for_timeout(200); ok(pg.input_value("#paste") == "", "Leeren funktioniert")
        # Druckansicht
        pg.goto(BASE + "#beispiel=de-arztbrief-facharzt-level3"); pg.reload(); pg.wait_for_function("window.__cdaReady === true")
        pg.wait_for_selector("#output .hcard"); pg.emulate_media(media="print")
        hidden = [s for s in [".site-header", ".intro", ".samples", ".faq", ".guide"] if pg.locator(s).count() and pg.locator(s).first.is_visible()]
        ok(not hidden, f"{w}px Druckansicht blendet aus (noch sichtbar: {hidden})"); ok(pg.is_visible("#output"), "Druckansicht zeigt Ausgabe")
        if w == 1280: pg.pdf(path=str(SHOTS / "cda-print-level3.pdf"), format="A4")
        pg.screenshot(path=str(SHOTS / f"cda-print-{w}.png"), full_page=True) if w == 1280 else None
        pg.emulate_media(media="screen")
        # 404 stammt vom absichtlich aufgerufenen /nichtda/; "Applying inline style" kommt von Playwrights Screenshot-Injektion (ohne Screenshots tritt es nicht auf, siehe tests/console-clean.py)
        errs = [m for m in msgs if "status of 404" not in m and "Applying inline style" not in m]
        ok(not errs, f"{w}px keine Konsolenfehler/-warnungen {errs[:5]}")
        ctx.close()
    # Hover nur in @media (hover:hover)
    css = (pathlib.Path(__file__).parent.parent / "src/css/styles.css").read_text()
    outside = re.sub(r"@media\s*\(hover:\s*hover\)\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}", "", css)
    ok(":hover" not in outside, "alle :hover nur in @media (hover:hover)")
    b.close()
print(f"\n{len(log)} OK, {len(fails)} FAIL")
sys.exit(1 if fails else 0)
