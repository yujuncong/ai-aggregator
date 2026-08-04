import fs from "node:fs/promises";
import path from "node:path";
import { Site } from "@/components/site";
import type { CrawlItem, DataEnvelope } from "@/lib/items";

async function loadItems(): Promise<CrawlItem[]> {
  try {
    const file = path.join(process.cwd(), "..", "data", "latest.json");
    const raw = await fs.readFile(file, "utf-8");
    const env: DataEnvelope = JSON.parse(raw);
    return Array.isArray(env.items) ? env.items : [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const items = await loadItems();
  return <Site items={items} />;
}
