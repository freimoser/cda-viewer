"""Lädt alle Seiten und Beispiele ohne Screenshots und gibt alle Konsolenmeldungen aus (erwartet: [])."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(channel="chrome",args=["--no-sandbox"]); pg=b.new_page(viewport={"width":360,"height":700})
    m=[]; pg.on("console",lambda x:m.append(x.text)); pg.on("pageerror",lambda e:m.append(str(e)))
    for u in ["","cda-datei-oeffnen/","cda-arztbrief-lesen/","was-ist-cda/","quellen/","datenschutz/","#beispiel=hl7-ccda-ccd","#beispiel=de-arztbrief-facharzt-level3"]:
        pg.goto("http://localhost:8777/cda-viewer/"+u); pg.reload(); pg.wait_for_timeout(700)
    pg.click("#menu-btn"); pg.click('#viewbar [data-mode=raw]'); pg.click('#viewbar [data-mode=data]')
    print(m)
