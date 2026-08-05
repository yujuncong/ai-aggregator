import type { CrawlItem, CrawlResult, SourceId } from "../utils/types";
import { appendFailedLog, makeId } from "../utils/io";
import { summarize } from "../utils/summarize";
import { HUGGINGFACE } from "../config";

const UA = {
  "User-Agent": "ai-radar-crawler",
  Accept: "application/json",
};

/** pipeline_tag → 中文短名（用于摘要；未收录回退原文） */
const PIPELINE_ZH: Record<string, string> = {
  "text-generation": "文本生成",
  "text2text-generation": "文本生成",
  "conversational": "对话",
  "text-to-image": "文生图",
  "image-to-image": "图生图",
  "image-text-to-text": "图文理解",
  "image-to-text": "图像理解",
  "visual-question-answering": "视觉问答",
  "text-to-video": "文生视频",
  "image-to-video": "图生视频",
  "image-text-to-video": "图文生视频",
  "video-to-video": "视频转视频",
  "video-text-to-text": "视频问答",
  "video-to-text": "视频理解",
  "video-classification": "视频分类",
  "video-editing": "视频编辑",
  "text-to-audio-video": "音视频生成",
  "text-to-speech": "语音合成",
  "automatic-speech-recognition": "语音识别",
  "audio-classification": "音频分类",
  "audio-to-audio": "音频处理",
  "feature-extraction": "向量嵌入",
  "sentence-similarity": "句向量",
  "text-classification": "文本分类",
  "token-classification": "分词标注",
  "question-answering": "问答",
  "summarization": "摘要",
  "translation": "翻译",
  "fill-mask": "掩码补全",
  "object-detection": "目标检测",
  "image-classification": "图像分类",
  "image-segmentation": "图像分割",
  "zero-shot-classification": "零样本分类",
  "document-question-answering": "文档问答",
  "depth-estimation": "深度估计",
  "reinforcement-learning": "强化学习",
  "robotics": "机器人",
  "tabular-classification": "表格分类",
  "tabular-regression": "表格回归",
  "other": "通用",
};

/** HF tags 里的高频技术标签，命中即进卡片标签（限前几个） */
const TAG_ALLOWLIST = new Set([
  "diffusers", "transformers", "pytorch", "gguf", "safetensors",
  "onnx", "multimodal", "video", "image", "audio", "llm", "quantization",
  "finetune", "autotrain",
]);

interface HfModel {
  id?: string;
  author?: string;
  pipeline_tag?: string | null;
  library_name?: string | null;
  downloads?: number;
  likes?: number;
  createdAt?: string;
  private?: boolean;
  tags?: string[];
}

/** 紧凑数字：1200000 → 1.2M */
function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

async function fetchModels(
  params: Record<string, string | number>,
): Promise<HfModel[]> {
  const url = new URL(HUGGINGFACE.api);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  url.searchParams.set("full", "true"); // 拿全字段（pipeline_tag/downloads/likes/tags）
  const res = await fetch(url, {
    headers: UA,
    signal: AbortSignal.timeout(30_000),
  });
  if (res.status === 403 || res.status === 429 || res.status === 503) {
    throw new Error(`Hugging Face rate limited (status=${res.status})`);
  }
  if (!res.ok) throw new Error(`Hugging Face HTTP ${res.status}`);
  return (await res.json()) as HfModel[];
}

/** 单条 HF 模型 → CrawlItem（score = likes，点赞数即社区热度） */
function toItem(source: SourceId, m: HfModel): CrawlItem | null {
  const modelId = m.id;
  if (!modelId || m.private) return null;
  const pipeline = m.pipeline_tag?.trim() ?? "";
  const library = m.library_name?.trim() ?? "";
  const likes = m.likes ?? 0;
  const downloads = m.downloads ?? 0;
  const url = `https://huggingface.co/${modelId}`;

  // 摘要：任务类型 · 库 · 下载量（英文紧凑行）；pipeline 缺失/other 时不加噪音
  const zh = pipeline && pipeline !== "other" ? (PIPELINE_ZH[pipeline] ?? pipeline) : "";
  const summary = [zh, library, `${compact(downloads)} downloads`]
    .filter(Boolean)
    .join(" · ");

  const tags = new Set<string>();
  if (pipeline && pipeline !== "other") tags.add(pipeline);
  if (source === "hf-video") tags.add("video");
  for (const t of m.tags ?? []) {
    if (TAG_ALLOWLIST.has(t)) tags.add(t);
    if (tags.size >= 4) break;
  }

  return {
    id: makeId(source, url),
    source,
    url,
    title: modelId,
    summary: summarize(summary, 140),
    author: m.author ?? "",
    postedAt: m.createdAt ?? new Date().toISOString(),
    tags: [...tags],
    score: likes,
    lang: library || undefined,
  };
}

/** 榜①：通用模型 —— HF 官方 Trending 最热榜（trendingScore 已加权近期热度） */
export async function crawlHuggingFace(): Promise<CrawlResult> {
  try {
    const list = await fetchModels({
      sort: "trendingScore",
      direction: -1,
      limit: HUGGINGFACE.trendingLimit,
    });
    const items = list
      .map((m) => toItem("hf", m))
      .filter((it): it is CrawlItem => it !== null);
    return { source: "hf", items: items.slice(0, HUGGINGFACE.maxItems) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await appendFailedLog("hf", msg);
    return { source: "hf", items: [], error: msg };
  }
}

/**
 * 榜②：AI 视频模型 —— 逐类视频 pipeline 抓 Trending 再合并（HF API 多个 filter 是 AND，必须逐个请求）。
 * 单类失败不阻塞其他类，跨类按 id 去重，再按点赞数降序。
 */
export async function crawlHuggingFaceVideo(): Promise<CrawlResult> {
  try {
    const perPipeline = await Promise.all(
      HUGGINGFACE.videoPipelines.map((p) =>
        fetchModels({
          filter: p,
          sort: "trendingScore",
          direction: -1,
          limit: HUGGINGFACE.perPipelineLimit,
        })
          .then((list) =>
            list
              .map((m) => toItem("hf-video", m))
              .filter((it): it is CrawlItem => it !== null),
          )
          .catch(() => []),
      ),
    );

    const seen = new Set<string>();
    const items = perPipeline.flat().filter((it) => {
      if (seen.has(it.id)) return false;
      seen.add(it.id);
      return true;
    });
    items.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return {
      source: "hf-video",
      items: items.slice(0, HUGGINGFACE.videoMaxItems),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await appendFailedLog("hf-video", msg);
    return { source: "hf-video", items: [], error: msg };
  }
}
