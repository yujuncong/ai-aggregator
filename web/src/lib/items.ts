export type SourceId = "x" | "ecommerce" | "github";

export interface CrawlItem {
  id: string;
  source: SourceId;
  url: string;
  title: string;
  summary: string;
  author: string;
  postedAt: string; // ISO 8601
  tags: string[];
}

export interface DataEnvelope {
  generatedAt: string;
  count: number;
  items: CrawlItem[];
}

export const SOURCE_META: Record<
  SourceId,
  { label: string; badge: string }
> = {
  x: {
    label: "X",
    badge: "bg-zinc-900 text-white dark:bg-zinc-600 dark:text-white",
  },
  ecommerce: { label: "电商", badge: "bg-orange-500 text-white" },
  github: { label: "GitHub", badge: "bg-purple-600 text-white" },
};
