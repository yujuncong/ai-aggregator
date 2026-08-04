export type SourceId = "x" | "ecommerce" | "github";

export interface CrawlItem {
  id: string;
  source: SourceId;
  url: string;
  title: string;
  summary: string;
  author: string;
  /** ISO 8601 */
  postedAt: string;
  tags: string[];
}

export interface CrawlResult {
  source: SourceId;
  items: CrawlItem[];
  error?: string;
}
