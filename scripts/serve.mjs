/** Lokaler Server: liefert das Repository-Root unter /cda-viewer/ aus wie GitHub Pages (404.html als Fallback). */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "/cda-viewer/";
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".webmanifest": "application/manifest+json", ".md": "text/markdown" };
const port = Number(process.env.PORT || 8777);

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path === "/") { res.writeHead(302, { Location: BASE }); return res.end(); }
  let file = null;
  if (path.startsWith(BASE)) {
    let p = normalize(join(root, path.slice(BASE.length)));
    if (p.startsWith(root) && !p.includes(join(root, "node_modules")) && !p.includes(join(root, ".git"))) {
      try {
        const s = await stat(p);
        if (s.isDirectory()) { if (!path.endsWith("/")) { res.writeHead(301, { Location: path + "/" }); return res.end(); } p = join(p, "index.html"); }
        await stat(p); file = p;
      } catch { /* 404 */ }
    }
  }
  const status = file ? 200 : 404;
  if (!file) file = join(root, "404.html");
  try {
    const body = await readFile(file);
    res.writeHead(status, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(body);
  } catch { res.writeHead(500); res.end("Fehler"); }
}).listen(port, () => console.log(`http://localhost:${port}${BASE}`));
