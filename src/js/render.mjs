// Darstellung: baut DOM ausschließlich mit createElement/textContent. Kein innerHTML.
import { flattenSections, sanitizeNarrative, extractEntries, formatCode, OID_NAMES } from "./cda.mjs";

export function h(doc, tag, props, ...children) {
  const e = doc.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "text") e.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
    else if (/^(data-[a-z-]+|aria-[a-z]+|id|type|title|role|scope|colspan|rowspan|lang|tabindex|href|rel|target|open)$/.test(k)) e.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of children.flat()) if (c != null && c !== false) e.appendChild(typeof c === "string" ? doc.createTextNode(c) : c);
  return e;
}

const NA = "–";

function kv(doc, rows) { // [[label, value|array|Node]]
  const dl = h(doc, "dl", { class: "kv" });
  for (const [k, v] of rows) {
    const vals = Array.isArray(v) ? v.filter(Boolean) : v ? [v] : [];
    if (!vals.length) continue;
    dl.appendChild(h(doc, "dt", { text: k }));
    const dd = h(doc, "dd");
    vals.forEach((x, i) => { if (i) dd.appendChild(doc.createElement("br")); dd.appendChild(typeof x === "string" ? doc.createTextNode(x) : x); });
    dl.appendChild(dd);
  }
  return dl;
}
const codeText = (c) => (c ? formatCode(c) + (c.codeSystemName ? ` – ${c.codeSystemName}` : c.codeSystem ? ` – ${c.codeSystem}` : "") : "");
const actorLines = (a) => a ? [[a.name, a.code && formatCode(a.code) ? `(${formatCode(a.code)})` : ""].filter(Boolean).join(" "), a.org, a.addr, ...(a.telecom || []), ...(a.ids || []).map((i) => "ID " + i)].filter(Boolean) : [];

export function headerBlock(doc, r) {
  const H = r.header;
  const wrap = h(doc, "div", { class: "cda-head" });
  const W = { appendChild: (n) => { if (n) wrap.appendChild(n); } };
  const card = (title, content) => content && content.childNodes.length ? h(doc, "section", { class: "hcard" }, h(doc, "h3", { text: title }), content) : null;
  W.appendChild(card("Dokument", kv(doc, [
    ["Titel", H.title], ["Dokumenttyp", codeText(H.code)], ["Erstellt", H.effectiveTime], ["Dokument-ID", H.ids],
    ["Vertraulichkeit", H.confidentiality && codeText(H.confidentiality)], ["Sprache", H.language],
    ["Version", H.version], ["Set-ID", H.setId],
  ])));
  H.patients.forEach((p, i) => W.appendChild(card(H.patients.length > 1 ? `Patient ${i + 1}` : "Patient", kv(doc, [
    ["Name", p.name], ["Geburtsdatum", p.birth], ["Geschlecht", p.gender], ["Adresse", p.addr], ["Kontakt", p.telecom], ["Patienten-ID", p.ids], ["Organisation", p.org], ["Sprache", p.language],
  ]))));
  H.authors.forEach((a) => W.appendChild(card("Autor", kv(doc, [["Name", a.name], ["Organisation", a.org], ["Zeitpunkt", a.time], ["Adresse", a.addr], ["Kontakt", a.telecom], ["ID", a.ids]]))));
  H.dataEnterer.forEach((a) => W.appendChild(card("Erfasser (dataEnterer)", kv(doc, [["Name", a.name], ["Organisation", a.org], ["Zeitpunkt", a.time]]))));
  if (H.custodian) W.appendChild(card("Verwahrer (custodian)", kv(doc, [["Organisation", H.custodian.name || H.custodian.org], ["Adresse", H.custodian.addr], ["Kontakt", H.custodian.telecom], ["ID", H.custodian.ids]])));
  H.recipients.forEach((a) => W.appendChild(card("Empfänger", kv(doc, [["Name", a.name], ["Organisation", a.org], ["Art", a.type], ["Adresse", a.addr]]))));
  H.legalAuthenticator.forEach((a) => W.appendChild(card("Rechtlich Unterzeichnender", kv(doc, [["Name", a.name], ["Organisation", a.org], ["Zeitpunkt", a.time], ["Signaturcode", a.signature]]))));
  H.authenticators.forEach((a) => W.appendChild(card("Mitunterzeichner", kv(doc, [["Name", a.name], ["Organisation", a.org], ["Zeitpunkt", a.time]]))));
  H.participants.forEach((a) => W.appendChild(card("Weitere Beteiligte", kv(doc, [["Name", a.name], ["Rolle", [a.role, a.code && formatCode(a.code)].filter(Boolean).join(" ")], ["Typ", a.type], ["Organisation", a.org], ["Zeit", a.time], ["Kontakt", a.telecom]]))));
  H.documentationOf.forEach((d) => W.appendChild(card("Dokumentierte Leistung (documentationOf)", kv(doc, [["Leistung", codeText(d.code)], ["Zeitraum", d.time], ["Durchführung", d.performers.flatMap(actorLines)]]))));
  if (H.encounter) W.appendChild(card("Kontakt / Aufenthalt (encounter)", kv(doc, [["ID", H.encounter.ids], ["Art", codeText(H.encounter.code)], ["Zeitraum", H.encounter.time], ["Verantwortlich", actorLines(H.encounter.responsible)], ["Ort", H.encounter.location]])));
  H.relatedDocuments.forEach((d) => W.appendChild(card("Bezugsdokument", kv(doc, [["Beziehung", d.type], ["ID", d.ids]]))));
  return wrap;
}

function narrative(doc, s) {
  const box = h(doc, "div", { class: "narr" });
  if (!s.textEl) {
    box.appendChild(h(doc, "p", { class: "muted", text: s.nullFlavor ? `Abschnitt ohne Inhalt (nullFlavor ${s.nullFlavor}).` : s.entries.length ? "Dieser Abschnitt hat keinen Text (Narrative), nur strukturierte Einträge. Sie sehen sie in der Ansicht „Strukturdaten“." : "Dieser Abschnitt enthält keinen Text." }));
    return { box, stats: null };
  }
  const { frag, stats } = sanitizeNarrative(s.textEl, doc);
  box.appendChild(frag);
  return { box, stats };
}

export function documentView(doc, r, onJump) {
  const H = r.header;
  const out = h(doc, "div", { class: "docview" });
  out.appendChild(h(doc, "h2", { class: "doctitle", text: H.title || formatCode(H.code) || "CDA-Dokument" }));
  const p = H.patients[0];
  const sub = [H.code && (H.code.displayName || H.code.code), H.effectiveTime && `erstellt ${H.effectiveTime}`, p && p.name && `Patient: ${p.name}`].filter(Boolean).join(" · ");
  if (sub) out.appendChild(h(doc, "p", { class: "docsub", text: sub }));
  out.appendChild(headerBlock(doc, r));
  const flat = flattenSections(r.sections);
  if (H.bodyType === "nonXMLBody") out.appendChild(h(doc, "p", { class: "note", text: "Dieses Dokument hat einen nonXMLBody (eingebetteter Inhalt, z. B. PDF). Der Viewer zeigt eingebettete Dateien nicht an." }));
  if (flat.length) {
    const toc = h(doc, "nav", { class: "toc", "aria-label": "Abschnitte" }, h(doc, "h3", { text: "Abschnitte (" + flat.length + ")" }));
    const ul = h(doc, "ul");
    flat.forEach(({ s, depth }, i) => {
      const label = s.title || (s.code && (s.code.displayName || s.code.code)) || "Abschnitt " + (i + 1);
      const b = h(doc, "button", { type: "button", class: "linkbtn", text: label, onclick: () => { const t = out.querySelector("#sec-" + i); if (t) { t.scrollIntoView({ block: "start" }); t.focus({ preventScroll: true }); } } });
      ul.appendChild(h(doc, "li", { class: "d" + Math.min(depth, 3) }, b));
    });
    toc.appendChild(ul); out.appendChild(toc);
    flat.forEach(({ s, depth }, i) => {
      const lvl = Math.min(depth + 2, 5);
      const label = s.title || (s.code && (s.code.displayName || s.code.code)) || "Abschnitt " + (i + 1);
      const sec = h(doc, "section", { class: "csec", id: "sec-" + i, tabindex: "-1" });
      sec.appendChild(h(doc, "h" + lvl, { class: "sech", text: label }));
      if (s.code && (s.code.code || s.code.displayName)) sec.appendChild(h(doc, "p", { class: "secmeta", text: "code " + (s.code.code || "") + (s.code.codeSystemName ? " (" + s.code.codeSystemName + ")" : "") + (s.code.displayName && s.code.displayName !== label ? " · " + s.code.displayName : "") }));
      const { box, stats } = narrative(doc, s);
      sec.appendChild(box);
      const notes = [];
      if (stats) {
        if (stats.dropped.length) notes.push(`${stats.dropped.length} nicht erlaubte(s) Element(e) entfernt (${[...new Set(stats.dropped)].join(", ")}).`);
        if (stats.unknown.size) notes.push(`Unbekannte Elemente im Text nur als Text übernommen: ${[...stats.unknown].join(", ")}.`);
      }
      if (s.entries.length) notes.push(`${s.entries.length} strukturierte(r) Eintrag/Einträge (entry), siehe „Strukturdaten“.`);
      if (notes.length) sec.appendChild(h(doc, "p", { class: "secnote", text: notes.join(" ") }));
      out.appendChild(sec);
    });
  } else if (H.bodyType === "structuredBody") out.appendChild(h(doc, "p", { class: "note", text: "Der structuredBody enthält keine Abschnitte." }));
  return out;
}

function table(doc, headers, rows, cls) {
  const t = h(doc, "table", { class: "dt " + (cls || "") });
  t.appendChild(h(doc, "thead", null, h(doc, "tr", null, headers.map((x) => h(doc, "th", { scope: "col", text: x })))));
  const tb = h(doc, "tbody");
  for (const r of rows) tb.appendChild(h(doc, "tr", null, r.map((c) => h(doc, "td", { text: c == null ? "" : String(c) }))));
  t.appendChild(tb);
  return h(doc, "div", { class: "tablewrap", tabindex: "0", role: "region", "aria-label": "Tabelle" }, t);
}

export function dataView(doc, r) {
  const H = r.header;
  const out = h(doc, "div", { class: "dataview" });
  out.appendChild(h(doc, "h2", { text: "Strukturdaten" }));
  out.appendChild(h(doc, "p", { class: "muted", text: "Maschinenlesbare Angaben aus dem Dokument. Codes und Einheiten stehen so, wie sie im XML stehen; der Viewer übersetzt keine Codes." }));
  out.appendChild(h(doc, "h3", { text: "Kopf (Header)" }));
  const rows = [];
  rows.push(["typeId", H.typeId ? `${H.typeId.root} / ${H.typeId.extension}` : NA]);
  rows.push(["realmCode", H.realmCode.join(", ") || NA]);
  H.templateIds.forEach((t, i) => rows.push([i ? "" : "templateId", t.root + (t.extension ? " : " + t.extension : "")]));
  if (!H.templateIds.length) rows.push(["templateId", NA]);
  rows.push(["Dokumenttyp (code)", codeText(H.code) || NA]);
  rows.push(["Dokument-ID", H.ids.join("; ") || NA]);
  rows.push(["effectiveTime", H.effectiveTime || NA]);
  rows.push(["Body-Art", H.bodyType || NA]);
  rows.push(["Level (Schätzung)", `Level ${r.level.level}: ${r.level.note}`]);
  out.appendChild(table(doc, ["Feld", "Wert"], rows, "kvt"));
  const flat = flattenSections(r.sections);
  out.appendChild(h(doc, "h3", { text: `Abschnitte und Einträge (${flat.length} Abschnitte)` }));
  if (!flat.length) out.appendChild(h(doc, "p", { class: "muted", text: "Keine Abschnitte vorhanden." }));
  let total = 0;
  flat.forEach(({ s, depth }, i) => {
    const label = s.title || (s.code && s.code.displayName) || "Abschnitt " + (i + 1);
    const box = h(doc, "section", { class: "dsec" });
    box.appendChild(h(doc, "h4", { text: label }));
    const meta = [];
    if (s.code) meta.push("code " + codeText(s.code));
    if (s.templateIds.length) meta.push("templateId " + s.templateIds.map((t) => t.root + (t.extension ? ":" + t.extension : "")).join(", "));
    if (depth) meta.push("Unterabschnitt (Ebene " + (depth + 1) + ")");
    if (meta.length) box.appendChild(h(doc, "p", { class: "secmeta", text: meta.join(" · ") }));
    const ents = extractEntries(s);
    total += ents.length;
    if (!ents.length) box.appendChild(h(doc, "p", { class: "muted", text: s.textEl ? "Keine strukturierten Einträge (nur Text, Level 2)." : "Keine Einträge." }));
    else {
      const trs = ents.map((e) => [
        "·".repeat(0) + (e.depth ? "↳ ".repeat(1) : "") + e.kind + (e.moodCode ? ` (${e.moodCode}${e.negation ? ", verneint" : ""})` : ""),
        e.code ? (e.code.code || (e.code.nullFlavor ? `(${e.code.nullFlavor})` : "")) : "",
        e.code ? (e.code.displayName || e.code.originalText) : "",
        e.code ? (e.code.codeSystemName || e.code.codeSystem) : "",
        e.values.map((v) => v.text).filter(Boolean).join("; "),
        e.values.map((v) => v.unit).filter(Boolean).join("; "),
        e.time, e.status, e.extra.join(" · "),
      ]);
      box.appendChild(table(doc, ["Art", "Code", "Anzeigename", "Codesystem", "Wert", "Einheit", "Zeit", "Status", "Weitere Angaben"], trs, "ent"));
    }
    out.appendChild(box);
  });
  if (flat.length) out.appendChild(h(doc, "p", { class: "muted", text: `Insgesamt ${total} Einträge (act, observation, procedure, substanceAdministration, …).` }));
  return out;
}

export function prettyXml(root, maxChars = 2000000) {
  const out = [];
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const escA = (s) => esc(s).replace(/"/g, "&quot;");
  let len = 0, cut = false;
  const walk = (el, d) => {
    if (len > maxChars) { cut = true; return; }
    const ind = "  ".repeat(Math.min(d, 60));
    let open = "<" + el.tagName;
    for (const a of el.attributes) open += ` ${a.name}="${escA(a.value)}"`;
    const kidsN = [...el.childNodes].filter((n) => n.nodeType === 1 || n.nodeType === 3 || n.nodeType === 4 || n.nodeType === 8);
    const onlyText = kidsN.every((n) => n.nodeType !== 1 && n.nodeType !== 8);
    let line;
    if (!kidsN.length) line = ind + open + "/>";
    else if (onlyText) line = ind + open + ">" + esc(el.textContent.replace(/\s+/g, " ").trim()) + "</" + el.tagName + ">";
    else {
      out.push(ind + open + ">"); len += ind.length + open.length;
      for (const n of kidsN) {
        if (n.nodeType === 1) walk(n, d + 1);
        else if (n.nodeType === 8) out.push(ind + "  <!--" + n.nodeValue.replace(/--/g, "- -") + "-->");
        else { const t = n.nodeValue.replace(/\s+/g, " ").trim(); if (t) out.push(ind + "  " + esc(t)); }
      }
      out.push(ind + "</" + el.tagName + ">");
      return;
    }
    out.push(line); len += line.length;
  };
  walk(root, 0);
  return out.join("\n") + (cut ? "\n… (Anzeige gekürzt)" : "");
}

export function rawView(doc, r, xmlText) {
  const out = h(doc, "div", { class: "rawview" });
  out.appendChild(h(doc, "h2", { text: "Roh-XML" }));
  const LIMIT = 1500000;
  let pretty = false;
  const pre = h(doc, "pre", { class: "raw", tabindex: "0" });
  const info = h(doc, "p", { class: "muted" });
  const show = () => {
    const t = pretty ? prettyXml(r.root) : (xmlText.length > LIMIT ? xmlText.slice(0, LIMIT) + "\n… (Anzeige gekürzt, " + xmlText.length + " Zeichen insgesamt)" : xmlText);
    pre.textContent = t;
    info.textContent = pretty ? "Neu eingerückte Darstellung (Whitespace in Texten zusammengefasst; Original bleibt unverändert)." : "Originaltext der Datei, unverändert.";
    btn.textContent = pretty ? "Original anzeigen" : "Eingerückt anzeigen";
  };
  const btn = h(doc, "button", { type: "button", class: "btn sm", onclick: () => { pretty = !pretty; show(); } });
  out.appendChild(h(doc, "div", { class: "rawbar" }, btn));
  out.appendChild(info); out.appendChild(pre);
  show();
  return out;
}

export function hintsView(doc, r) {
  const det = h(doc, "details", { class: "hints", open: r.hints.some((x) => x.level === "warn") });
  const warn = r.hints.filter((x) => x.level === "warn").length;
  det.appendChild(h(doc, "summary", { text: `Plausibilitätshinweise (${r.hints.length}${warn ? ", davon " + warn + " Warnung" + (warn > 1 ? "en" : "") : ""})` }));
  det.appendChild(h(doc, "p", { class: "muted", text: "Das sind einfache Prüfungen auf bestimmte Bestandteile. Es ist keine Schematron- oder Konformitätsprüfung gegen einen Leitfaden und ersetzt keine." }));
  const ul = h(doc, "ul", { class: "hintlist" });
  for (const x of r.hints) ul.appendChild(h(doc, "li", { class: "h-" + x.level }, h(doc, "span", { class: "tag", text: x.level === "warn" ? "Warnung" : x.level === "ok" ? "OK" : "Hinweis" }), " " + x.text));
  det.appendChild(ul);
  return det;
}

export function errorView(doc, err) {
  return h(doc, "div", { class: "errbox", role: "alert" }, h(doc, "h2", { text: "Datei konnte nicht angezeigt werden" }), h(doc, "p", { class: "errmsg", text: err.message }), h(doc, "p", { text: err.hint }));
}
export { OID_NAMES };
