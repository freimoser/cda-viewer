// CDA-Kern: Parsen, Header, Abschnitte, Narrative-Sanitizer, Entries, Hinweise.
// Läuft im Browser und (mit jsdom) in Node. Kein XSLT, kein innerHTML.

export const NS_CDA = "urn:hl7-org:v3";
const NS_XSI = "http://www.w3.org/2001/XMLSchema-instance";
export const MAX_BYTES = 15 * 1024 * 1024;

export const OID_NAMES = {
  "2.16.840.1.113883.6.1": "LOINC",
  "2.16.840.1.113883.6.96": "SNOMED CT",
  "2.16.840.1.113883.6.88": "RxNorm",
  "2.16.840.1.113883.6.90": "ICD-10-CM",
  "2.16.840.1.113883.6.3": "ICD-10 (WHO)",
  "2.16.840.1.113883.6.103": "ICD-9-CM (Diagnosen)",
  "2.16.840.1.113883.6.104": "ICD-9-CM (Prozeduren)",
  "2.16.840.1.113883.6.12": "CPT-4",
  "2.16.840.1.113883.6.8": "UCUM",
  "2.16.840.1.113883.6.69": "NDC",
  "2.16.840.1.113883.12.292": "CVX",
  "2.16.840.1.113883.5.25": "Confidentiality",
  "2.16.840.1.113883.5.1": "AdministrativeGender",
  "2.16.840.1.113883.5.4": "ActCode",
  "2.16.840.1.113883.5.111": "RoleCode",
  "2.16.840.1.113883.5.1008": "NullFlavor",
  "2.16.840.1.113883.1.3": "HL7 CDA R2 (typeId)",
  "1.2.276.0.76.5.311": "ICD-10-GM",
  "1.2.276.0.76.5.310": "OPS",
  "1.2.276.0.76.5.309": "Alpha-ID",
  "1.2.276.0.76.4.1": "eGK-Versichertennummer",
  "1.2.276.0.76.4.5": "Institutionskennzeichen (IK)",
};

// ---------- DOM-Helfer (namespace-unabhängig über localName) ----------
const isEl = (n) => n && n.nodeType === 1;
export const kids = (el, ...names) => {
  const out = [];
  if (!el) return out;
  for (let c = el.firstChild; c; c = c.nextSibling) if (isEl(c) && (!names.length || names.includes(c.localName))) out.push(c);
  return out;
};
export const first = (el, ...names) => kids(el, ...names)[0] || null;
export const path = (el, ...names) => {
  let cur = el;
  for (const n of names) { cur = first(cur, n); if (!cur) return null; }
  return cur;
};
const attr = (el, n) => (el && el.hasAttribute(n) ? el.getAttribute(n) : "");
const xsiType = (el) => (el ? el.getAttributeNS(NS_XSI, "type") || el.getAttribute("xsi:type") || "" : "");
const text = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");

// ---------- Vorprüfung auf Wohlgeformtheit ----------
// Chrome baut bei kaputtem XML ein <parsererror> mit Inline-Style; das löst unter der strengen CSP
// (style-src 'self') zwei Konsolenhinweise aus. Deshalb prüft der Viewer die häufigsten Fehler selbst, bevor
// DOMParser läuft. Die Prüfung ist bewusst konservativ: Sie meldet nur eindeutige Fehler (nicht geschlossene
// oder falsch verschachtelte Elemente, nacktes &, ungültige Attribute, fehlendes Wurzelelement). Alles andere
// entscheidet weiterhin der DOMParser des Browsers.
export function wellFormedError(xml) {
  const pos = (i) => { const pre = xml.slice(0, i); const l = pre.split("\n"); return { line: l.length, col: l[l.length - 1].length + 1 }; };
  const err = (i, msg) => ({ ...pos(i), msg });
  const NAME = "[^\\s<>/=\"'&]+";
  const attrRe = new RegExp("\\s+" + NAME + "\\s*=\\s*(?:\"[^\"<]*\"|'[^'<]*')", "y");
  const entOk = /^&(?:[A-Za-z_][\w.-]*|#\d+|#x[0-9A-Fa-f]+);/;
  const stack = []; let i = 0, rootSeen = false, rootClosed = false;
  const n = xml.length;
  while (i < n) {
    const lt = xml.indexOf("<", i);
    const chunk = xml.slice(i, lt < 0 ? n : lt);
    for (let k = chunk.indexOf("&"); k >= 0; k = chunk.indexOf("&", k + 1)) {
      if (!entOk.test(chunk.slice(k, k + 40))) return err(i + k, "Das Zeichen „&“ steht ohne Entität im Text. Schreiben Sie „&amp;“.");
    }
    if (rootClosed && /\S/.test(chunk)) return err(i + chunk.search(/\S/), "Nach dem Wurzelelement steht weiterer Text.");
    if (!stack.length && !rootClosed && /\S/.test(chunk)) return err(i + chunk.search(/\S/), "Vor dem Wurzelelement steht Text, der kein XML ist.");
    if (lt < 0) break;
    i = lt;
    if (xml.startsWith("<!--", i)) { const e = xml.indexOf("-->", i + 4); if (e < 0) return err(i, "Kommentar nicht geschlossen."); i = e + 3; continue; }
    if (xml.startsWith("<![CDATA[", i)) { const e = xml.indexOf("]]>", i + 9); if (e < 0) return err(i, "CDATA-Abschnitt nicht geschlossen."); i = e + 3; continue; }
    if (xml.startsWith("<?", i)) { const e = xml.indexOf("?>", i + 2); if (e < 0) return err(i, "Verarbeitungsanweisung nicht geschlossen."); i = e + 2; continue; }
    if (xml.startsWith("<!", i)) return null; // DOCTYPE o. Ä.: Sache des Browsers
    if (xml[i + 1] === "/") {
      const m = new RegExp("^</(" + NAME + ")\\s*>").exec(xml.slice(i, i + 300));
      if (!m) return err(i, "Ungültiges Endtag.");
      const top = stack.pop();
      if (top !== m[1]) return err(i, top ? "Endtag </" + m[1] + "> passt nicht zum offenen Element <" + top + ">." : "Endtag </" + m[1] + "> ohne passendes Starttag.");
      if (!stack.length) rootClosed = true;
      i += m[0].length; continue;
    }
    const nm = new RegExp("<(" + NAME + ")", "y"); nm.lastIndex = i;
    const m = nm.exec(xml);
    if (!m) return err(i, "Das Zeichen „<“ steht ohne Elementnamen im Text. Schreiben Sie „&lt;“.");
    if (rootClosed) return err(i, "Nach dem Wurzelelement steht ein weiteres Element.");
    let j = i + m[0].length; const seen = new Set();
    for (;;) {
      attrRe.lastIndex = j; const a = attrRe.exec(xml);
      if (!a) break;
      const an = /\s+(\S+?)\s*=/.exec(a[0])[1];
      if (seen.has(an)) return err(j, "Attribut „" + an + "“ kommt im Element <" + m[1] + "> doppelt vor.");
      seen.add(an); j += a[0].length;
    }
    const rest = /^\s*(\/?)>/.exec(xml.slice(j, j + 50));
    if (!rest) return err(j, "Element <" + m[1] + "> ist nicht korrekt abgeschlossen (Attribut ohne Anführungszeichen oder „>“ fehlt).");
    rootSeen = true;
    if (!rest[1]) stack.push(m[1]); else if (!stack.length) rootClosed = true;
    i = j + rest[0].length;
  }
  if (stack.length) return err(n, "Element <" + stack[stack.length - 1] + "> wird nicht geschlossen (Datei abgeschnitten?).");
  if (!rootSeen) return err(0, "Kein Wurzelelement gefunden.");
  return null;
}

// ---------- Parsen ----------
export function parseCda(xmlText, DOMParserCtor) {
  const DP = DOMParserCtor || (typeof DOMParser !== "undefined" ? DOMParser : null);
  if (typeof xmlText !== "string" || !xmlText.trim()) return fail("leer", "Die Eingabe ist leer.", "Fügen Sie XML ein oder wählen Sie eine Datei.");
  if (xmlText.length > MAX_BYTES) return fail("zu-gross", "Die Datei ist größer als 15 MB.", "Der Viewer ist für Dokumente im Bereich weniger Megabyte gedacht. Teilen Sie die Datei oder prüfen Sie, ob sie eingebettete Anhänge enthält.");
  xmlText = xmlText.replace(/^\uFEFF/, "");
  if (/<!DOCTYPE|<!ENTITY/i.test(xmlText)) return fail("doctype", "Die Datei enthält eine DOCTYPE- oder ENTITY-Deklaration und wird nicht geladen.", "CDA-Dokumente brauchen keine DOCTYPE-Deklaration. Aus Sicherheitsgründen (Entity-Expansion) lädt dieser Viewer solche Dateien nicht. Entfernen Sie die Zeile, wenn Sie der Datei vertrauen.");
  if (/^\s*<\?xml[^>]*encoding\s*=\s*["']?(iso-8859-1|windows-1252|latin1)/i.test(xmlText) === false && /\uFFFD/.test(xmlText.slice(0, 200000))) {
    // Ersatzzeichen deuten auf falsch gelesene Zeichenkodierung hin; kein harter Fehler
  }
  const wf = wellFormedError(xmlText);
  if (wf) return fail("xml", "Die Datei ist kein wohlgeformtes XML.", "Meldung des Viewers: Zeile " + wf.line + ", Spalte " + wf.col + ": " + wf.msg + " Häufige Ursachen: abgeschnittene Datei, nicht escapte Zeichen (&, <) im Text oder eine Datei, die gar kein XML ist (z. B. PDF oder Pipe-Nachricht).");
  let doc;
  try { doc = new DP().parseFromString(xmlText, "application/xml"); } catch (e) { return fail("xml", "Das XML konnte nicht gelesen werden.", String(e && e.message || e)); }
  const perr = doc.getElementsByTagName("parsererror")[0];
  if (perr || !doc.documentElement) {
    const msg = perr ? text(perr).slice(0, 300) : "Kein Wurzelelement gefunden.";
    return fail("xml", "Die Datei ist kein wohlgeformtes XML.", "Meldung des Browsers: " + msg + " Häufige Ursachen: abgeschnittene Datei, nicht escapte Zeichen (&, <) im Text oder eine Datei, die gar kein XML ist (z. B. PDF oder Pipe-Nachricht).");
  }
  const root = doc.documentElement;
  if (root.localName !== "ClinicalDocument") {
    let tip = "CDA-Dokumente beginnen mit dem Element ClinicalDocument.";
    if (root.localName === "Bundle" || root.localName === "Composition") tip += " Diese Datei sieht nach einer FHIR-Ressource aus (Wurzelelement " + root.localName + ").";
    else if (/^[A-Z]{4}_[A-Z]{2}\d{6}/.test(root.localName)) tip += " Diese Datei sieht nach einer HL7-v3-Nachricht aus (" + root.localName + "), nicht nach einem Dokument.";
    return fail("kein-cda", "Kein CDA-Dokument: Wurzelelement ist „" + root.localName + "“.", tip);
  }
  const nsOk = root.namespaceURI === NS_CDA;
  return { ok: true, doc, root, nsOk, error: null };
}
function fail(code, message, hint) { return { ok: false, doc: null, root: null, error: { code, message, hint } }; }

// ---------- Formatierung ----------
const pad = (s) => String(s);
export function formatTs(v) {
  if (!v) return "";
  const m = /^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?(?:\.\d+)?([+-]\d{2,4})?$/.exec(v.trim());
  if (!m) return v;
  const [, y, mo, d, h, mi, s, tz] = m;
  let out = d ? `${d}.${mo}.${y}` : mo ? `${mo}/${y}` : y;
  if (h) out += ` ${h}:${mi || "00"}` + (s ? `:${s}` : "");
  if (tz) out += ` (UTC${tz.slice(0, 3)}${tz.length > 3 ? ":" + tz.slice(3, 5) : ""})`;
  return out;
}
export function validTs(v) {
  const m = /^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?(?:\.\d+)?([+-]\d{2,4})?$/.exec((v || "").trim());
  if (!m) return false;
  const mo = m[2] ? +m[2] : 1, d = m[3] ? +m[3] : 1, h = m[4] ? +m[4] : 0, mi = m[5] ? +m[5] : 0, s = m[6] ? +m[6] : 0;
  return mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && h < 24 && mi < 60 && s < 61;
}
export function formatTime(el) { // effectiveTime / time / birthTime: value | low..high | center | width
  if (!el) return "";
  const nf = attr(el, "nullFlavor");
  const v = attr(el, "value");
  if (v) return formatTs(v);
  const low = first(el, "low"), high = first(el, "high"), center = first(el, "center");
  if (low || high) {
    const a = low ? (attr(low, "value") ? formatTs(attr(low, "value")) : attr(low, "nullFlavor") ? "?" : "") : "";
    const b = high ? (attr(high, "value") ? formatTs(attr(high, "value")) : attr(high, "nullFlavor") ? "offen" : "") : "";
    return `${a} – ${b}`.replace(/^ – $/, "");
  }
  if (center) return formatTs(attr(center, "value"));
  return nf ? `(${nf})` : "";
}
export function codeInfo(el) {
  if (!el) return null;
  const cs = attr(el, "codeSystem");
  const info = {
    code: attr(el, "code"), codeSystem: cs, codeSystemName: attr(el, "codeSystemName") || OID_NAMES[cs] || "",
    displayName: attr(el, "displayName"), nullFlavor: attr(el, "nullFlavor"),
    originalText: text(first(el, "originalText")), translations: kids(el, "translation").map(codeInfo),
  };
  return info;
}
export function formatName(el) {
  if (!el) return "";
  const parts = [];
  for (const c of kids(el)) {
    if (["prefix", "given", "family", "suffix"].includes(c.localName)) parts.push(text(c));
  }
  return parts.length ? parts.join(" ") : text(el);
}
export function formatAddr(el) {
  if (!el) return "";
  const p = (n) => kids(el, n).map(text).filter(Boolean);
  const street = [...p("streetAddressLine"), ...p("streetName"), ...p("houseNumber")].join(" ");
  const city = [p("postalCode")[0], p("city")[0]].filter(Boolean).join(" ");
  return [street, city, p("state")[0], p("country")[0]].filter(Boolean).join(", ");
}
export function formatTelecom(el) {
  const v = attr(el, "value");
  const use = attr(el, "use");
  return v ? (use ? `${v} (${use})` : v) : "";
}
export function formatId(el) {
  const root = attr(el, "root"), ext = attr(el, "extension");
  const nf = attr(el, "nullFlavor");
  if (nf && !root) return `(${nf})`;
  const sys = OID_NAMES[root];
  return (ext ? ext : "") + (ext ? " " : "") + `[${sys ? sys + " " : ""}${root}]`;
}
export function formatCode(c) {
  if (!c) return "";
  if (c.nullFlavor && !c.code) return `(${c.nullFlavor})`;
  return [c.displayName, c.code ? `[${c.code}]` : ""].filter(Boolean).join(" ");
}

function actor(el) { // assignedAuthor/assignedEntity/intendedRecipient/...
  if (!el) return null;
  const person = first(el, "assignedPerson", "associatedPerson", "informationRecipient", "relatedPerson");
  const dev = first(el, "assignedAuthoringDevice");
  const org = first(el, "representedOrganization", "representedCustodianOrganization", "receivedOrganization", "scopingOrganization", "serviceProviderOrganization");
  return {
    ids: kids(el, "id").map(formatId),
    code: codeInfo(first(el, "code")),
    name: formatName(first(person, "name")) || (dev ? text(first(dev, "softwareName")) + " (Software)" : ""),
    org: org ? text(first(org, "name")) : "",
    addr: formatAddr(first(el, "addr")) || (org ? formatAddr(first(org, "addr")) : ""),
    telecom: kids(el, "telecom").map(formatTelecom).filter(Boolean),
  };
}

// ---------- Header ----------
export function extractHeader(root) {
  const h = {};
  h.realmCode = kids(root, "realmCode").map((e) => attr(e, "code"));
  const typeId = first(root, "typeId");
  h.typeId = typeId ? { root: attr(typeId, "root"), extension: attr(typeId, "extension") } : null;
  h.templateIds = kids(root, "templateId").map((e) => ({ root: attr(e, "root"), extension: attr(e, "extension") }));
  h.ids = kids(root, "id").map(formatId);
  h.code = codeInfo(first(root, "code"));
  h.title = text(first(root, "title"));
  h.effectiveTime = formatTime(first(root, "effectiveTime"));
  h.effectiveTimeRaw = attr(first(root, "effectiveTime"), "value");
  h.confidentiality = codeInfo(first(root, "confidentialityCode"));
  h.language = attr(first(root, "languageCode"), "code");
  h.setId = first(root, "setId") ? formatId(first(root, "setId")) : "";
  h.version = attr(first(root, "versionNumber"), "value");

  h.patients = kids(root, "recordTarget").map((rt) => {
    const pr = first(rt, "patientRole");
    const p = first(pr, "patient");
    return {
      ids: kids(pr, "id").map(formatId),
      name: formatName(first(p, "name")),
      gender: formatCode(codeInfo(first(p, "administrativeGenderCode"))),
      birth: formatTime(first(p, "birthTime")),
      addr: formatAddr(first(pr, "addr")),
      telecom: kids(pr, "telecom").map(formatTelecom).filter(Boolean),
      org: text(path(pr, "providerOrganization", "name")),
      language: kids(p, "languageCommunication").map((l) => attr(first(l, "languageCode"), "code")).filter(Boolean),
    };
  });
  h.authors = kids(root, "author").map((a) => ({ time: formatTime(first(a, "time")), ...actor(first(a, "assignedAuthor")) }));
  h.dataEnterer = kids(root, "dataEnterer").map((a) => ({ time: formatTime(first(a, "time")), ...actor(first(a, "assignedEntity")) }));
  h.custodian = actor(path(root, "custodian", "assignedCustodian"));
  h.recipients = kids(root, "informationRecipient").map((r) => ({ type: attr(r, "typeCode"), ...actor(first(r, "intendedRecipient")) }));
  h.legalAuthenticator = kids(root, "legalAuthenticator").map((a) => ({ time: formatTime(first(a, "time")), signature: attr(first(a, "signatureCode"), "code"), ...actor(first(a, "assignedEntity")) }));
  h.authenticators = kids(root, "authenticator").map((a) => ({ time: formatTime(first(a, "time")), signature: attr(first(a, "signatureCode"), "code"), ...actor(first(a, "assignedEntity")) }));
  h.participants = kids(root, "participant").map((p) => ({ type: attr(p, "typeCode"), time: formatTime(first(p, "time")), ...actor(first(p, "associatedEntity")), role: attr(first(p, "associatedEntity"), "classCode") }));
  h.documentationOf = kids(root, "documentationOf").map((d) => {
    const se = first(d, "serviceEvent");
    return { code: codeInfo(first(se, "code")), time: formatTime(first(se, "effectiveTime")), performers: kids(se, "performer").map((p) => actor(first(p, "assignedEntity"))) };
  });
  h.relatedDocuments = kids(root, "relatedDocument").map((r) => ({ type: attr(r, "typeCode"), ids: kids(first(r, "parentDocument"), "id").map(formatId) }));
  const enc = path(root, "componentOf", "encompassingEncounter");
  h.encounter = enc ? {
    ids: kids(enc, "id").map(formatId), code: codeInfo(first(enc, "code")), time: formatTime(first(enc, "effectiveTime")),
    responsible: actor(path(enc, "responsibleParty", "assignedEntity")),
    location: text(path(enc, "location", "healthCareFacility", "location", "name")) || text(path(enc, "location", "healthCareFacility", "serviceProviderOrganization", "name")),
  } : null;
  const comp = first(root, "component");
  h.bodyType = comp ? (first(comp, "structuredBody") ? "structuredBody" : first(comp, "nonXMLBody") ? "nonXMLBody" : "") : "";
  return h;
}

// ---------- Sektionen ----------
export function extractSections(root) {
  const body = path(root, "component", "structuredBody");
  const walk = (parent) => kids(parent, "component").map((c) => first(c, "section")).filter(Boolean).map((s) => ({
    el: s,
    title: text(first(s, "title")),
    code: codeInfo(first(s, "code")),
    templateIds: kids(s, "templateId").map((t) => ({ root: attr(t, "root"), extension: attr(t, "extension") })),
    textEl: first(s, "text"),
    nullFlavor: attr(s, "nullFlavor"),
    entries: kids(s, "entry"),
    children: walk(s),
  }));
  return body ? walk(body) : [];
}
export function flattenSections(secs, depth = 0, out = []) {
  for (const s of secs) { out.push({ s, depth }); flattenSections(s.children, depth + 1, out); }
  return out;
}

// ---------- Narrative-Sanitizer (Allowlist) ----------
const MAP = { paragraph: "p", content: "span", list: "ul", item: "li", table: "table", thead: "thead", tbody: "tbody", tfoot: "tfoot", tr: "tr", th: "th", td: "td", br: "br", sub: "sub", sup: "sup", caption: "caption", col: "col", colgroup: "colgroup", linkHtml: "a", footnote: "span", footnoteRef: "span", renderMultiMedia: "span" };
const DROP = new Set(["script", "style", "iframe", "object", "embed", "applet", "link", "meta", "base", "form", "input", "img", "svg", "math", "audio", "video"]);
const STYLE_CLASSES = { Bold: "cda-b", Italics: "cda-i", Underline: "cda-u", Emphasis: "cda-em", Underline_Bold: "cda-u cda-b", Rrule: "cda-rrule", Lrule: "cda-lrule", Toprule: "cda-trule", Botrule: "cda-brule" };
const MAX_DEPTH = 40, MAX_NODES = 100000;

export function sanitizeNarrative(textEl, document) {
  const frag = document.createDocumentFragment();
  const stats = { nodes: 0, dropped: [], unknown: new Set(), links: 0, media: 0 };
  if (!textEl) return { frag, stats };
  const add = (src, dst, depth) => {
    for (let n = src.firstChild; n; n = n.nextSibling) {
      if (++stats.nodes > MAX_NODES) { return; }
      if (n.nodeType === 3 || n.nodeType === 4) { dst.appendChild(document.createTextNode(n.nodeValue)); continue; }
      if (n.nodeType !== 1) continue;
      const name = n.localName;
      if (DROP.has(name.toLowerCase())) { stats.dropped.push(name); continue; }
      if (depth > MAX_DEPTH) { dst.appendChild(document.createTextNode(n.textContent)); continue; }
      const tag = MAP[name];
      if (!tag) { stats.unknown.add(name); add(n, dst, depth + 1); continue; } // unbekannt: Text behalten, Element entfernen
      let out;
      if (name === "list") out = document.createElement(attr(n, "listType") === "ordered" ? "ol" : "ul");
      else if (name === "renderMultiMedia") {
        stats.media++;
        out = document.createElement("span"); out.className = "cda-media";
        out.textContent = "[Eingebettetes Medium (renderMultiMedia" + (attr(n, "referencedObject") ? ", Verweis " + attr(n, "referencedObject").slice(0, 40) : "") + "), vom Viewer nicht angezeigt]";
        dst.appendChild(out); continue;
      } else if (name === "footnote" || name === "footnoteRef") {
        out = document.createElement("span"); out.className = "cda-fn";
      } else out = document.createElement(tag);
      if (name === "linkHtml") {
        const href = attr(n, "href").trim();
        if (/^(https?:\/\/|mailto:)/i.test(href)) {
          out.setAttribute("href", href); out.setAttribute("rel", "noopener noreferrer nofollow"); out.setAttribute("target", "_blank"); stats.links++;
        } else { out = document.createElement("span"); out.className = "cda-link-off"; out.title = "Link nicht aktiv: nur http(s) und mailto werden verlinkt"; }
      }
      if (name === "caption" && n.parentNode && n.parentNode.localName === "list") { out = document.createElement("li"); out.className = "cda-caption"; }
      if (name === "td" || name === "th") {
        for (const a of ["colspan", "rowspan"]) { const v = attr(n, a); if (/^\d{1,3}$/.test(v) && +v >= 1 && +v <= 100) out.setAttribute(a, v); }
        const al = attr(n, "align").toLowerCase(); if (["left", "right", "center", "justify"].includes(al)) out.className = "al-" + al;
        const va = attr(n, "valign").toLowerCase(); if (["top", "middle", "bottom"].includes(va)) out.className += " va-" + va;
      }
      const sc = attr(n, "styleCode");
      if (sc) { const cls = sc.split(/\s+/).map((c) => STYLE_CLASSES[c]).filter(Boolean).join(" "); if (cls) out.className = ((out.className || "") + " " + cls).trim(); }
      if (name === "content") {
        const rev = attr(n, "revised");
        if (rev === "insert") out.className = ((out.className || "") + " cda-ins").trim();
        else if (rev === "delete") out.className = ((out.className || "") + " cda-del").trim();
        const id = attr(n, "ID"); if (id) out.setAttribute("data-cda-id", id.slice(0, 80));
      }
      if (name === "paragraph" || name === "item" || name === "td" || name === "th") { const id = attr(n, "ID"); if (id) out.setAttribute("data-cda-id", id.slice(0, 80)); }
      dst.appendChild(out);
      add(n, out, depth + 1);
    }
  };
  add(textEl, frag, 0);
  return { frag, stats };
}

// ---------- Entries (Level 3) ----------
const ACT_NAMES = new Set(["act", "observation", "procedure", "substanceAdministration", "supply", "encounter", "organizer", "observationMedia", "regionOfInterest"]);
export function formatValue(v) {
  if (!v) return { text: "", unit: "", type: "" };
  const type = xsiType(v).replace(/^.*:/, "");
  const nf = attr(v, "nullFlavor");
  const pq = (e) => e ? { v: attr(e, "value"), u: attr(e, "unit") } : null;
  if (type === "PQ" || (!type && attr(v, "unit"))) return { text: attr(v, "value") || (nf ? `(${nf})` : ""), unit: attr(v, "unit"), type: type || "PQ" };
  if (/^IVL_(PQ|INT|REAL)$/.test(type)) {
    const lo = pq(first(v, "low")), hi = pq(first(v, "high"));
    const t = [lo ? lo.v : "", hi ? hi.v : ""]; return { text: `${t[0] || "…"} – ${t[1] || "…"}`, unit: (lo && lo.u) || (hi && hi.u) || "", type };
  }
  if (type === "IVL_TS" || type === "TS" || type === "PIVL_TS") return { text: formatTime(v), unit: "", type };
  if (/^(CD|CE|CV|CO|CS)$/.test(type) || (!type && (attr(v, "code") || attr(v, "codeSystem")))) { const c = codeInfo(v); return { text: formatCode(c) + (c.codeSystemName ? ` – ${c.codeSystemName}` : ""), unit: "", type: type || "CD", code: c }; }
  if (type === "INT" || type === "REAL" || type === "BL" || type === "MO") return { text: attr(v, "value") || (nf ? `(${nf})` : ""), unit: attr(v, "currency"), type };
  if (type === "ST" || type === "ED" || type === "SC") { const ref = attr(first(v, "reference"), "value"); return { text: text(v) || (ref ? `Verweis ${ref}` : "") || (nf ? `(${nf})` : ""), unit: "", type }; }
  const t = text(v) || attr(v, "value") || (nf ? `(${nf})` : "");
  return { text: t.slice(0, 500), unit: "", type };
}
function refText(el) { const r = first(first(el, "text"), "reference"); return r ? attr(r, "value") : ""; }
function entryRow(el, depth, relType) {
  const c = codeInfo(first(el, "code"));
  const vals = kids(el, "value").map(formatValue);
  const q = (n) => { const e = first(el, n); return e ? `${attr(e, "value")}${attr(e, "unit") ? " " + attr(e, "unit") : ""}`.trim() : ""; };
  const extra = [];
  const dose = q("doseQuantity"); if (dose) extra.push("Dosis " + dose);
  const rate = q("rateQuantity"); if (rate) extra.push("Rate " + rate);
  const route = codeInfo(first(el, "routeCode")); if (route) extra.push("Weg " + formatCode(route));
  const site = codeInfo(first(el, "targetSiteCode") || first(el, "approachSiteCode")); if (site) extra.push("Ort " + formatCode(site));
  const mm = path(el, "consumable", "manufacturedProduct", "manufacturedMaterial");
  const product = mm ? codeInfo(first(mm, "code")) : null;
  if (product) extra.push("Produkt " + formatCode(product) + (product.codeSystemName ? " – " + product.codeSystemName : ""));
  else if (mm && text(first(mm, "name"))) extra.push("Produkt " + text(first(mm, "name")));
  const pe = path(first(el, "participant"), "participantRole", "playingEntity");
  if (pe) { const pc = codeInfo(first(pe, "code")); extra.push("Beteiligt " + (pc ? formatCode(pc) : text(first(pe, "name")))); }
  const perf = kids(el, "performer").map((p) => actor(first(p, "assignedEntity"))).filter((a) => a && a.name).map((a) => a.name);
  if (perf.length) extra.push("Durchführung " + perf.join(", "));
  const auth = kids(el, "author").map((p) => actor(first(p, "assignedAuthor"))).filter((a) => a && a.name).map((a) => a.name);
  if (auth.length) extra.push("Autor " + auth.join(", "));
  const interp = codeInfo(first(el, "interpretationCode")); if (interp) extra.push("Interpretation " + formatCode(interp));
  const ref = refText(el); if (ref) extra.push("Text-Verweis " + ref);
  const nf = attr(el, "nullFlavor");
  return {
    depth, kind: el.localName, classCode: attr(el, "classCode"), moodCode: attr(el, "moodCode"), negation: attr(el, "negationInd") === "true",
    relType, nullFlavor: nf,
    templates: kids(el, "templateId").map((t) => attr(t, "root") + (attr(t, "extension") ? ":" + attr(t, "extension") : "")),
    ids: kids(el, "id").map(formatId), code: c, status: attr(first(el, "statusCode"), "code"),
    time: formatTime(first(el, "effectiveTime")), values: vals, extra,
  };
}
export function extractEntries(section) {
  const rows = [];
  const walk = (el, depth, relType) => {
    if (depth > 12 || rows.length > 5000) return;
    rows.push(entryRow(el, depth, relType));
    for (const er of kids(el, "entryRelationship")) for (const c of kids(er, ...ACT_NAMES)) walk(c, depth + 1, attr(er, "typeCode"));
    for (const comp of kids(el, "component")) for (const c of kids(comp, ...ACT_NAMES)) walk(c, depth + 1, "COMP");
    for (const ent of kids(el, "entry")) for (const c of kids(ent, ...ACT_NAMES)) walk(c, depth + 1, "ENTRY");
  };
  for (const e of section.entries) for (const c of kids(e, ...ACT_NAMES)) walk(c, 0, attr(e, "typeCode"));
  return rows;
}

// ---------- Hinweise (Plausibilität, KEIN Schematron) ----------
export function buildHints(parsed, header, sections) {
  const H = []; // {level: "warn"|"info"|"ok", text}
  const add = (level, t) => H.push({ level, text: t });
  const root = parsed.root;
  if (!parsed.nsOk) add("warn", `Das Wurzelelement liegt nicht im Namensraum „${NS_CDA}“ (gefunden: „${root.namespaceURI || "keiner"}“). CDA-Dokumente verwenden diesen Namensraum.`);
  if (!header.typeId) add("warn", "typeId fehlt. CDA R2 verlangt typeId mit root 2.16.840.1.113883.1.3 und extension POCD_HD000040.");
  else if (header.typeId.root !== "2.16.840.1.113883.1.3" || header.typeId.extension !== "POCD_HD000040") add("warn", `typeId weicht vom üblichen Wert ab (${header.typeId.root} / ${header.typeId.extension}); erwartet: 2.16.840.1.113883.1.3 / POCD_HD000040.`);
  else add("ok", "typeId entspricht CDA R2 (POCD_HD000040).");
  if (!header.realmCode.length) add("info", "Kein realmCode angegeben. Das ist laut CDA-Basisstandard optional; manche Leitfäden (z. B. US-C-CDA) verlangen ihn.");
  else add("info", `realmCode: ${header.realmCode.join(", ")}.`);
  if (!header.templateIds.length) add("info", "Keine templateId im Kopf. Ohne templateId lässt sich nicht erkennen, nach welchem Leitfaden das Dokument gebaut wurde; ein Dokument kann trotzdem gültiges CDA sein.");
  else add("ok", `${header.templateIds.length} templateId im Kopf (${header.templateIds.map((t) => t.root + (t.extension ? ":" + t.extension : "")).join(", ")}).`);
  const must = [
    ["id", header.ids.length > 0], ["code (Dokumenttyp)", !!(header.code && (header.code.code || header.code.nullFlavor))],
    ["effectiveTime (Erstellungsdatum)", !!header.effectiveTime], ["confidentialityCode", !!header.confidentiality],
    ["recordTarget (Patient)", header.patients.length > 0], ["author", header.authors.length > 0], ["custodian", !!header.custodian],
    ["component (Body)", !!header.bodyType],
  ];
  const missing = must.filter(([, ok]) => !ok).map(([n]) => n);
  if (missing.length) add("warn", "Im Kopf fehlen Bestandteile, die der CDA-R2-Basisstandard vorsieht: " + missing.join(", ") + ".");
  else add("ok", "Alle Kopfbestandteile der CDA-R2-Basis sind vorhanden (id, code, effectiveTime, confidentialityCode, recordTarget, author, custodian, component).");
  if (header.effectiveTimeRaw && !validTs(header.effectiveTimeRaw)) add("warn", `effectiveTime „${header.effectiveTimeRaw}“ ist kein gültiger HL7-Zeitstempel (JJJJMMTT[hhmm[ss]][±zzzz]).`);
  if (header.bodyType === "nonXMLBody") add("info", "Der Body ist ein nonXMLBody: Der Inhalt steckt als eingebettetes Dokument (z. B. PDF) im XML. Der Viewer zeigt es nicht an.");
  const flat = flattenSections(sections);
  if (header.bodyType === "structuredBody" && !flat.length) add("info", "Der structuredBody enthält keine Abschnitte (section). Das ist nicht zwingend ein Fehler: Beim eArztbrief nach der KBV-Richtlinie (Stand 17.05.2024) darf der body leer sein, der Inhalt steht dann im PDF/A. Dieser Viewer zeigt das PDF nicht an.");
  const noCode = flat.filter(({ s }) => !s.code && !s.nullFlavor).length;
  const noTitle = flat.filter(({ s }) => !s.title && !s.nullFlavor).length;
  const empty = flat.filter(({ s }) => !s.nullFlavor && !s.textEl && !s.entries.length && !s.children.length).length;
  if (flat.length) {
    if (noCode) add("info", `${noCode} von ${flat.length} Abschnitten haben keinen code (nur Level 1: ohne maschinenlesbare Abschnittsklassifikation).`);
    if (noTitle) add("info", `${noTitle} Abschnitt(e) ohne title.`);
    if (empty) add("warn", `${empty} Abschnitt(e) ohne text, entry oder Unterabschnitt.`);
  }
  // Text-Verweise (originalText/reference) ohne Ziel im Narrative
  const ids = new Set();
  for (const e of root.getElementsByTagName("*")) { const i = e.getAttribute("ID"); if (i) ids.add(i); }
  let broken = 0;
  for (const r of root.getElementsByTagName("reference")) { const v = r.getAttribute("value") || ""; if (v.startsWith("#") && !ids.has(v.slice(1))) broken++; }
  if (broken) add("warn", `${broken} Text-Verweis(e) (reference value="#…") zeigen auf eine ID, die im Dokument nicht vorkommt.`);
  return H;
}

export function guessLevel(sections) {
  const flat = flattenSections(sections);
  const entries = flat.reduce((n, { s }) => n + s.entries.length, 0);
  const coded = flat.filter(({ s }) => s.code).length;
  if (entries > 0) return { level: 3, note: `${entries} entry-Element(e) in ${flat.filter(({ s }) => s.entries.length).length} Abschnitt(en) gefunden` };
  if (coded > 0) return { level: 2, note: `${coded} von ${flat.length} Abschnitten mit code, keine entry-Elemente` };
  return { level: 1, note: "keine codierten Abschnitte und keine entry-Elemente gefunden" };
}

export function analyze(xmlText, DOMParserCtor) {
  const parsed = parseCda(xmlText, DOMParserCtor);
  if (!parsed.ok) return parsed;
  const header = extractHeader(parsed.root);
  const sections = extractSections(parsed.root);
  const hints = buildHints(parsed, header, sections);
  const level = guessLevel(sections);
  return { ...parsed, header, sections, hints, level };
}
