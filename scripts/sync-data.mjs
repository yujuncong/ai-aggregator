// 构建前把 data/ 同步到 web/public/data/，让历史归档随静态站发布
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "data");
const dst = path.join(root, "web", "public", "data");

fs.rmSync(dst, { recursive: true, force: true });
fs.mkdirSync(dst, { recursive: true });

let n = 0;
for (const f of fs.readdirSync(src)) {
  if (f.endsWith(".json")) {
    fs.copyFileSync(path.join(src, f), path.join(dst, f));
    n++;
  }
}
console.log(`[sync-data] 已同步 ${n} 个数据文件 → web/public/data/`);
