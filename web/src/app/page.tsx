import fs from "node:fs/promises";
import path from "node:path";
import { Site } from "@/components/site";
import type { CrawlItem, DataEnvelope } from "@/lib/items";

const DATA_DIR = path.join(process.cwd(), "..", "data");

async function loadData(): Promise<{ items: CrawlItem[]; generatedAt: string }> {
  try {
    const env: DataEnvelope = JSON.parse(
      await fs.readFile(path.join(DATA_DIR, "latest.json"), "utf-8"),
    );
    return {
      items: Array.isArray(env.items) ? env.items : [],
      generatedAt: env.generatedAt ?? "",
    };
  } catch {
    return { items: [], generatedAt: "" };
  }
}

/** 历史归档日期列表（不含今天，最新在前） */
async function listDates(today: string): Promise<string[]> {
  try {
    const files = await fs.readdir(DATA_DIR);
    return files
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .map((f) => f.slice(0, 10))
      .filter((d) => d !== today)
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export default async function Home() {
  const { items, generatedAt } = await loadData();
  const today = new Date().toISOString().slice(0, 10);
  const dates = await listDates(today);
  return <Site items={items} generatedAt={generatedAt} today={today} dates={dates} />;
}
