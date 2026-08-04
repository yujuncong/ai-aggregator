import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function writeJson(file: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf-8")) as T;
  } catch {
    return null;
  }
}

/** 写 crawlers/logs/<source>.failed，供人工排查 */
export async function appendFailedLog(source: string, reason: string): Promise<void> {
  try {
    const logDir = path.join(process.cwd(), "crawlers", "logs");
    await ensureDir(logDir);
    const stamp = new Date().toISOString();
    await fs.appendFile(
      path.join(logDir, `${source}.failed`),
      `[${stamp}] ${reason}\n`,
      "utf-8",
    );
  } catch {
    /* 日志失败不影响主流程 */
  }
}

/** id = sha1(source + url) 前 12 位 */
export function makeId(source: string, url: string): string {
  return createHash("sha1").update(`${source}|${url}`).digest("hex").slice(0, 12);
}
