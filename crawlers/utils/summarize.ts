const TAG_KEYWORDS = [
  "ai", "agent", "agents", "llm", "gpt", "claude", "model", "models",
  "open source", "opensource", "api", "rag", "multimodal", "fine-tune",
  "finetune", "training", "inference", "chatbot", "copilot", "automation",
  "prompt", "embedding", "evaluation", "benchmark", "vision",
  "skill", "skills", "mcp",
];

/** 剥离 HTML 标签（PH feed 的 content 是 HTML 片段） */
export function stripHtml(text: string): string {
  return text
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 把可能是字符串 / 对象（fast-xml-parser 的 content 节点）/ 数组的值规整成纯文本 */
export function cleanText(text: unknown): string {
  if (typeof text === "string") return text.replace(/\s+/g, " ").trim();
  if (text == null) return "";
  if (typeof text === "number" || typeof text === "boolean") return String(text);
  if (Array.isArray(text)) return text.map(cleanText).join(" ").trim();
  if (typeof text === "object") {
    const o = text as Record<string, unknown>;
    const inner = o["#text"] ?? o["__text"] ?? o["__cdata"];
    if (typeof inner === "string") return inner.replace(/\s+/g, " ").trim();
    return "";
  }
  return "";
}

/** 规则化摘要：无外部 LLM，纯截断 */
export function summarize(text: string | null | undefined, max = 160): string {
  const t = cleanText(text);
  if (!t) return "";
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

/** 从 #hashtag 和关键词命中里抽取标签，去重、限 5 个 */
export function extractTags(...texts: (string | null | undefined)[]): string[] {
  const all = texts.map(cleanText).join(" ").toLowerCase();
  const tags = new Set<string>();
  for (const m of all.matchAll(/#([a-z0-9_]{2,30})/g)) tags.add(m[1]);
  for (const kw of TAG_KEYWORDS) {
    if (all.includes(kw)) tags.add(kw === "open source" ? "opensource" : kw);
  }
  return [...tags].slice(0, 5);
}
