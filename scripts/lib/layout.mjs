/** Gemeinsames Layout: head, Navigation, Footer, JSON-LD-Helfer. Nur statisches HTML, keine Skripte außer menu/app. */
export const SITE = {
  origin: "https://freimoser.github.io",
  base: "/cda-viewer/",
  name: "CDA-Viewer",
  verification: "6pYvtFCnU7UFcQFajtMSkQ7tYMy3Z_Bt7teKiT5yKNg",
  bing: "E1F30DEB311AAF5458907DB431B481AC",
  indexNowKey: "c67e9b3d19be863e1c5ec56c3a89f916",
  themeColor: "#0b1210",
  repo: "https://github.com/freimoser/cda-viewer",
  updated: "2026-10-27",
  updatedDe: "27.10.2026",
  impressum: "https://freimoser.de/impressum/",
  author: { name: "Thomas Freimoser", url: "https://freimoser.de/", linkedin: "https://www.linkedin.com/in/thomas-freimoser/" },
  // Schalter für genau einen redaktionellen Fließtext-Link (derzeit AUS, bis die Formulierung freigegeben ist).
  // Aktivieren: enabled auf true setzen und "html" mit der freigegebenen Formulierung füllen (genau ein <a>), dann neu bauen.
  flexchange: { enabled: false, url: "https://flexchange-medical.de/products_flx-suite.php", html: "" },
};

export const url = (p = "") => SITE.origin + SITE.base + p;
export const href = (p = "") => SITE.base + p;
export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Content-Security-Policy per Meta-Tag: keine Netzwerkverbindungen, keine fremden Ressourcen, keine Inline-Skripte. */
export const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'none'; connect-src 'none'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";

const NAV = [
  ["", "Viewer"],
  ["cda-datei-oeffnen/", "CDA-Datei öffnen"],
  ["cda-arztbrief-lesen/", "Arztbrief lesen"],
  ["was-ist-cda/", "Was ist CDA?"],
  ["quellen/", "Quellen"],
];

/** Weitere Werkzeuge; Einträge mit `ok: false` werden nicht verlinkt (Build prüft per HTTP). */
export function tools(status = {}) {
  const all = [
    ["ldt-bdt-viewer", "LDT- und BDT-Dateien lesen", "Labordaten (LDT) und Praxisdaten-Exporte (BDT)."],
    ["gdt-viewer", "GDT-Dateien anzeigen", "Geräte- und Praxis-Datenträger im GDT-Format."],
    ["dicom-viewer", "DICOM-Bilder und Radiologie-CD öffnen", "Röntgen-, CT- und MRT-Bilder."],
    ["fhir-viewer", "FHIR-Daten ansehen", "FHIR-Ressourcen und Bundles."],
    ["hl7v2-viewer", "HL7-v2-Nachrichten lesen", "Nachrichten im Pipe-Format."],
    ["e-rechnung-klartext", "XRechnung und ZUGFeRD lesen", "E-Rechnungen als Klartext."],
  ];
  return all.filter(([id]) => status[id] !== false).map(([id, t, d]) => ({ id, t, d, u: `${SITE.origin}/${id}/` }));
}

function head(p) {
  const robots = p.noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1";
  const canon = p.noindex ? "" : `<link rel="canonical" href="${esc(url(p.path))}">\n`;
  const ld = (p.jsonld || []).map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n");
  const ogTitle = p.ogTitle || p.title;
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${esc(CSP)}">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
${canon}<meta name="robots" content="${robots}">
<meta name="google-site-verification" content="${SITE.verification}">
<meta name="msvalidate.01" content="${SITE.bing}">
<meta name="theme-color" content="${SITE.themeColor}">
<meta name="author" content="${esc(SITE.author.name)}">
<link rel="icon" href="${href("favicon.ico")}" sizes="48x48">
<link rel="icon" href="${href("favicon.svg")}" type="image/svg+xml">
<link rel="icon" href="${href("favicon-96.png")}" type="image/png" sizes="96x96">
<link rel="apple-touch-icon" href="${href("apple-touch-icon.png")}" sizes="180x180">
<link rel="manifest" href="${href("site.webmanifest")}">
<meta property="og:type" content="${p.ogType || "website"}">
<meta property="og:locale" content="de_DE">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${esc(ogTitle)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${esc(url(p.path))}">
<meta property="og:image" content="${esc(url("og-image.png"))}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="CDA-Viewer: HL7 CDA-Arztbriefe im Browser lesen, ohne Upload">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ogTitle)}">
<meta name="twitter:description" content="${esc(p.description)}">
<meta name="twitter:image" content="${esc(url("og-image.png"))}">
<link rel="stylesheet" href="${href("assets/css/styles.css")}">
${ld}
</head>`;
}

function header(path) {
  return `<header class="top"><div class="wrap">
<a class="brand" href="${href()}"><img src="${href("favicon.svg")}" alt="" width="28" height="28"><span>CDA-Viewer</span></a>
<button class="menu-btn" id="menu-btn" type="button" aria-label="Menü" aria-expanded="false" aria-controls="site-nav"><span></span></button>
<nav class="main" id="site-nav" aria-label="Hauptnavigation">
${NAV.map(([p, l]) => `<a href="${href(p)}"${p === path ? ' aria-current="page"' : ""}>${esc(l)}</a>`).join("\n")}
</nav>
</div></header>`;
}

export const DISCLAIMER = "HL7 und FHIR sind eingetragene Marken von HL7 International. Dieses Werkzeug steht in keiner Verbindung zu HL7 International oder zu HL7 Deutschland und wird von diesen weder unterstützt noch empfohlen. Die Bezeichnungen werden nur zur Benennung der Formate verwendet.";

function footer() {
  return `<footer class="site"><div class="wrap">
<div class="cols">
<div><h2>CDA-Viewer</h2><ul>
<li><a href="${href()}">Viewer</a></li>
<li><a href="${href("cda-datei-oeffnen/")}">CDA-Datei öffnen</a></li>
<li><a href="${href("cda-arztbrief-lesen/")}">Arztbrief lesen</a></li>
<li><a href="${href("was-ist-cda/")}">Was ist HL7 CDA?</a></li>
<li><a href="${href("quellen/")}">Quellen</a></li>
<li><a href="${SITE.repo}">Quellcode auf GitHub</a></li>
</ul></div>
<div><h2>Rechtliches</h2><ul>
<li><a href="${SITE.impressum}">Impressum</a></li>
<li><a href="${href("datenschutz/")}">Datenschutz</a></li>
</ul></div>
</div>
<p class="disc">Nur zur Ansicht, kein Medizinprodukt, keine Grundlage für Diagnose oder Behandlung. Keine Cookies, kein Tracking, kein Upload. Stand ${SITE.updatedDe}. ${esc(DISCLAIMER)}</p>
</div></footer>`;
}

export const authorBlock = () => `<section class="about" aria-labelledby="entwickler"><div class="wrap">
<h2 id="entwickler">Über den Entwickler</h2>
<p>Entwickelt von <a href="${SITE.author.url}">Thomas Freimoser</a> (München / Remote). Der Quellcode ist offen: <a href="${SITE.repo}">github.com/freimoser/cda-viewer</a>. Kontakt über das <a href="${SITE.impressum}">Impressum</a>; Profil auf <a href="${SITE.author.linkedin}">LinkedIn</a>.</p>
</div></section>`;

export function breadcrumbHtml(items) {
  return `<nav class="crumbs" aria-label="Brotkrumen"><ol>
${items.map(([n, p], i) => (i === items.length - 1 ? `<li aria-current="page">${esc(n)}</li>` : `<li><a href="${href(p)}">${esc(n)}</a></li>`)).join("\n")}
</ol></nav>`;
}
export const breadcrumbLd = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, p], i) => ({ "@type": "ListItem", position: i + 1, name, item: url(p) })) });

export const personLd = () => ({ "@type": "Person", "@id": SITE.author.url + "#person", name: SITE.author.name, url: SITE.author.url, sameAs: [SITE.author.linkedin] });

const strip = (s) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
export const faqHtml = (faq, id = "faq") => `<section aria-labelledby="${id}"><h2 id="${id}">Fragen und Antworten</h2>
${faq.map((f) => `<details class="faq"><summary>${esc(f.q)}</summary><div>${f.a}</div></details>`).join("\n")}
</section>`;
export const faqLd = (faq) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: strip(f.a) } })) });

export function articleLd(p, headline) {
  return { "@context": "https://schema.org", "@type": "TechArticle", headline, description: p.description, inLanguage: "de-DE", mainEntityOfPage: url(p.path), datePublished: SITE.updated, dateModified: SITE.updated, author: personLd(), publisher: personLd(), image: url("og-image.png") };
}

export function mdr() {
  return `<div class="mdr" role="note">Nur zur Ansicht, kein Medizinprodukt, keine Grundlage für Diagnose oder Behandlung. Ihre Dateien bleiben auf Ihrem Gerät: Es gibt keinen Upload.</div>`;
}

/** Vollständige Seite. p: {path,title,description,jsonld,noindex,body,scripts:[...],crumbs} */
export function page(p, toolStatus = {}) {
  const scripts = (p.scripts || ["assets/js/menu.mjs"]).map((s) => `<script type="module" src="${href(s)}"></script>`).join("\n");
  return `<!doctype html>
<html lang="de">
${head(p)}
<body>
<a class="skip" href="#main">Zum Inhalt springen</a>
${header(p.nav ?? p.path)}
<main id="main" class="wrap">
${p.body}
</main>
${p.about === false ? "" : authorBlock()}
${footer()}
${scripts}
</body>
</html>
`;
}
