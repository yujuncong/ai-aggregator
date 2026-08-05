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
  postedAt: string; // ISO 8601
  tags: string[];
  /** 热度分（GitHub=stars，电商=热度 0-14） */
  score?: number;
  /** 主语言（GitHub） */
  lang?: string;
  /** 中文解释说明 */
  zh?: string;
}

export interface DataEnvelope {
  generatedAt: string;
  count: number;
  items: CrawlItem[];
}

export const SOURCE_ORDER: SourceId[] = [
  "github",
  "discover",
  "ecommerce",
  "x",
  "hf",
  "hf-video",
];

export const SOURCE_META: Record<
  SourceId,
  {
    /** 中文短名 */
    label: string;
    /** 等宽代号（徽章用） */
    code: string;
    /** 来源主色（CSS 变量名） */
    color: string;
    /** 热度单位 */
    unit: string;
  }
> = {
  github: {
    label: "GitHub",
    code: "GH",
    color: "var(--src-github)",
    unit: "stars",
  },
  discover: {
    label: "Skill 榜",
    code: "SK",
    color: "var(--src-discover)",
    unit: "stars",
  },
  ecommerce: {
    label: "AI 电商",
    code: "SHOP",
    color: "var(--src-shop)",
    unit: "热度",
  },
  x: {
    label: "X",
    code: "X",
    color: "var(--src-x)",
    unit: "互动",
  },
  hf: {
    label: "HF 模型",
    code: "HF",
    color: "var(--src-hf)",
    unit: "likes",
  },
  "hf-video": {
    label: "HF 视频",
    code: "HF·V",
    color: "var(--src-hfv)",
    unit: "likes",
  },
};

/** GitHub 语言色板（与 GitHub linguist 对齐） */
export const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572a5",
  Rust: "#dea584",
  Go: "#00add8",
  Java: "#b07219",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Swift: "#f05138",
  Kotlin: "#a97bff",
  Ruby: "#701516",
  PHP: "#4f5d95",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  "Jupyter Notebook": "#da5b0b",
  Dart: "#00b4ab",
  Elixir: "#6e4a7e",
  Zig: "#ec915c",
  Scala: "#c22d40",
  Lua: "#000080",
  MDX: "#fcb32c",
  /* HF 常用库（显示在 lang 徽章里） */
  diffusers: "#ffd21e",
  transformers: "#ffd21e",
  pytorch: "#ee4c2c",
  tensorflow: "#ff6f00",
  gguf: "#77a9ff",
  safetensors: "#ffd21e",
  onnx: "#005fed",
  "sentence-transformers": "#fcd34d",
  autotrain: "#f97316",
};

/**
 * 相对时间（中文，紧凑）。
 * now 由调用方显式传入（见 hooks/use-clock 的 useNowMs），
 * 避免在 render 中调用 Date.now() 破坏纯度。
 * now 为 0（未水合）时返回空串，调用方渲染占位。
 */
export function relTime(iso: string, now: number): string {
  if (!now) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(1, Math.round((now - t) / 1000));
  if (s < 60) return `${s} 秒前`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} 分钟前`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d} 天前` : `${Math.round(d / 30)} 个月前`;
}

/** 域名（去 www.） */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** 紧凑数字：1200 → 1.2k */
export function compact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}
