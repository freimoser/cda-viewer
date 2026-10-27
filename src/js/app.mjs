// UI des Viewers: Datei/Einfügen/Beispiel -> analysieren -> rendern. Keine Netzwerkzugriffe.
import { analyze } from "./cda.mjs";
import { h, documentView, dataView, rawView, hintsView, errorView } from "./render.mjs";

const $ = (s, r = document) => r.querySelector(s);
const MODES = [["doc", "Dokument"], ["data", "Strukturdaten"], ["raw", "Roh-XML"]];

let state = { xml: "", result: null, mode: "doc", name: "" };
let samplesCache = null;
async function samples() { if (!samplesCache) samplesCache = (await import("./samples-data.js")).SAMPLES; return samplesCache; }

function setStatus(text, isErr) {
  const s = $("#status"); if (!s) return;
  s.textContent = text || ""; s.className = "status" + (isErr ? " err" : "");
}

function render() {
  const out = $("#output"); if (!out) return;
  out.textContent = "";
  const r = state.result;
  $("#viewbar").hidden = !r || !r.ok;
  if (!r) return;
  if (!r.ok) { out.appendChild(errorView(document, r.error)); setStatus("", false); return; }
  out.appendChild(hintsView(document, r));
  let v;
  if (state.mode === "data") v = dataView(document, r);
  else if (state.mode === "raw") v = rawView(document, r, state.xml);
  else v = documentView(document, r);
  out.appendChild(v);
  for (const b of document.querySelectorAll("#viewbar [data-mode]")) {
    const on = b.getAttribute("data-mode") === state.mode;
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.classList.toggle("on", on);
  }
}

export function load(xmlText, name) {
  state.xml = xmlText; state.name = name || "";
  state.result = analyze(xmlText);
  const r = state.result;
  if (r.ok) {
    const t = r.header.title || (r.header.code && r.header.code.displayName) || "CDA-Dokument";
    setStatus(`Geladen: ${name || "Eingabe"} · ${t} · Level ${r.level.level}`, false);
  } else setStatus("Fehler: " + r.error.message, true);
  render();
  const out = $("#viewbar") || $("#output"); if (out && out.scrollIntoView) out.scrollIntoView({ block: "start" });
}

async function loadSample(id) {
  const list = await samples();
  const s = list.find((x) => x.id === id);
  if (!s) { setStatus("Beispiel nicht gefunden: " + id, true); return false; }
  load(s.xml, s.file);
  const info = $("#sampleinfo");
  if (info) { info.textContent = ""; info.appendChild(h(document, "span", { text: `Beispiel: ${s.title} – Quelle: ${String(s.source).replace(/[.\s]+$/, "")}. Lizenz: ${s.license}.` })); info.hidden = false; }
  return true;
}

async function readFile(file) {
  if (!file) return;
  setStatus("Lese " + file.name + " …", false);
  if (file.size > 15 * 1024 * 1024) { load("x".repeat(15 * 1024 * 1024 + 1), file.name); return; }
  try {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let enc = "utf-8";
    const head = new TextDecoder("latin1").decode(bytes.slice(0, 200));
    const m = /^\s*<\?xml[^>]*encoding\s*=\s*["']([A-Za-z0-9._-]+)["']/.exec(head);
    if (m) { try { new TextDecoder(m[1]); enc = m[1]; } catch { enc = "utf-8"; } }
    if (bytes[0] === 0xff && bytes[1] === 0xfe) enc = "utf-16le"; else if (bytes[0] === 0xfe && bytes[1] === 0xff) enc = "utf-16be";
    const text = new TextDecoder(enc).decode(bytes);
    load(text, file.name);
  } catch (e) { setStatus("Die Datei konnte nicht gelesen werden: " + (e && e.message || e), true); }
}

export async function init() {
  const drop = $("#drop");
  if (!drop) return;
  const fi = $("#file");
  fi.addEventListener("change", () => { readFile(fi.files[0]); fi.value = ""; });
  for (const ev of ["dragenter", "dragover"]) drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); });
  for (const ev of ["dragleave", "drop"]) drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); });
  drop.addEventListener("drop", (e) => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) readFile(f); });
  $("#paste-go").addEventListener("click", () => { const t = $("#paste").value; load(t, "Eingefügtes XML"); });
  $("#paste-clear").addEventListener("click", () => { $("#paste").value = ""; state = { xml: "", result: null, mode: state.mode, name: "" }; setStatus("", false); render(); $("#sampleinfo").hidden = true; });
  for (const b of document.querySelectorAll("#viewbar [data-mode]")) b.addEventListener("click", () => { state.mode = b.getAttribute("data-mode"); render(); });
  $("#print").addEventListener("click", () => { window.print(); });
  for (const b of document.querySelectorAll("[data-sample]")) b.addEventListener("click", (e) => { e.preventDefault(); loadSample(b.getAttribute("data-sample")); history.replaceState(null, "", "#beispiel=" + b.getAttribute("data-sample")); });
  const m = /^#beispiel=([a-z0-9-]+)$/.exec(location.hash);
  if (m) loadSample(m[1]);
  window.__cdaReady = true;
}
init();
