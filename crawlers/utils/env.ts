import fs from "node:fs";
import path from "node:path";

/**
 * 极简 .env 加载器：若仓库根目录存在 .env 则读取，
 * 仅对尚未设置的环境变量赋值（不覆盖已存在的环境变量）。
 * 支持 KEY=VALUE 与 # 注释。
 */
export function loadDotEnv(): void {
  const file = path.join(process.cwd(), ".env");
  let raw: string;
  try {
    raw = fs.readFileSync(file, "utf-8");
  } catch {
    return; // 无 .env 文件则跳过
  }
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
}
