export type SourceId =
  | "x"
  | "ecommerce"
  | "github"
  | "hf"
  | "hf-video"
  | "discover";

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
  /** 热度分（GitHub=stars；无则缺省） */
  score?: number;
  /** 主语言（GitHub） */
  lang?: string;
  /** 中文解释说明（规则化生成） */
  zh?: string;
}

export interface CrawlResult {
  source: SourceId;
  items: CrawlItem[];
  error?: string;
}
