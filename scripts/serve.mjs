// 本地静态预览：把 /ai-aggregator 子路径映射到 web/out，模拟 GitHub Pages
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../web/out");
const BASE = "/ai-aggregator";
const port = Number(process.env.PORT ?? 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".woff2": "font/woff2",
};

http
  .createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
    if (p.startsWith(BASE)) p = p.slice(BASE.length) || "/";
    let file = path.normalize(path.join(out, p));
    if (!file.startsWith(out)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, "index.html");
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404);
        return res.end("Not Found");
      }
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream" });
      res.end(buf);
    });
  })
  .listen(port, () => {
    console.log(`[preview] http://localhost:${port}${BASE}/`);
  });
