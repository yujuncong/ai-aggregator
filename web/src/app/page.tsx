import fs from "node:fs/promises";
import path from "node:path";
import { Site } from "@/components/site";
import type { CrawlItem, DataEnvelope } from "@/lib/items";

async function loadData(): Promise<{ items: CrawlItem[]; generatedAt: string }> {
  try {
    const file = path.join(process.cwd(), "..", "data", "latest.json");
    const env: DataEnvelope = JSON.parse(await fs.readFile(file, "utf-8"));
    return {
      items: Array.isArray(env.items) ? env.items : [],
      generatedAt: env.generatedAt ?? "",
    };
  } catch {
    return { items: [], generatedAt: "" };
  }
}

export default async function Home() {
  const { items, generatedAt } = await loadData();
  return <Site items={items} generatedAt={generatedAt} />;
}
